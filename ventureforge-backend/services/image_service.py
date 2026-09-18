"""
Reusable image generation service.

Any agent or route can call `image_generator.generate(prompt=...)` without
knowing which provider is behind it. Swap providers by constructing
`ImageGenerator` with a different `ImageProvider` implementation.

Currently implemented: FLUX.1-schnell via the Hugging Face Inference API.
"""

from __future__ import annotations

import asyncio
import hashlib
import io
import logging
import time
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Literal

import httpx
from PIL import Image
from pydantic import BaseModel, Field, field_validator

from core.config import settings

logger = logging.getLogger("ventureforge.images")

# Images are served from the backend, so keep them under a known static dir.
IMAGES_DIR = Path(__file__).resolve().parents[1] / "generated_images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

MIN_PROMPT_CHARS = 3
MAX_PROMPT_CHARS = 2000


# ─────────────────────────── models ────────────────────────────


class ImageRequest(BaseModel):
    """Validated input for a single image generation."""

    prompt: str = Field(..., description="What to draw. Plain English.")
    width: int = Field(1024, ge=256, le=1536)
    height: int = Field(1024, ge=256, le=1536)
    seed: int | None = Field(None, description="Set for reproducible output.")
    guidance_scale: float | None = Field(None, ge=0.0, le=20.0)
    steps: int | None = Field(None, ge=1, le=50)
    negative_prompt: str | None = None
    enhance: bool = Field(True, description="Apply the quality-suffix enhancer.")

    @field_validator("prompt")
    @classmethod
    def _prompt_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < MIN_PROMPT_CHARS:
            raise ValueError(f"Prompt must be at least {MIN_PROMPT_CHARS} characters.")
        if len(cleaned) > MAX_PROMPT_CHARS:
            raise ValueError(f"Prompt must be under {MAX_PROMPT_CHARS} characters.")
        return cleaned


class ImageResult(BaseModel):
    """Structured response returned to callers."""

    success: bool
    image_url: str | None = None       # URL the frontend can render
    local_path: str | None = None      # path relative to the backend root
    width: int | None = None
    height: int | None = None
    cached: bool = False
    prompt: str | None = None          # the final (enhanced) prompt actually sent
    duration_ms: int | None = None
    provider: str | None = None
    error: str | None = None
    # HTTP status the API layer should return on failure. Not part of the
    # public payload — a bad prompt is a 400, a dead provider is a 502.
    error_status: int = Field(502, exclude=True)


class ImageGenerationError(Exception):
    """Raised when generation fails. `status` maps to an HTTP status code."""

    def __init__(self, message: str, status: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


# ─────────────────────── provider interface ────────────────────────


class ImageProvider(ABC):
    """
    Contract every image backend must satisfy.

    Add OpenAI / Gemini / Stability / Replicate / Fal / Together by
    implementing this and passing it to ImageGenerator — no caller changes.
    """

    name: str

    @abstractmethod
    async def generate_bytes(self, request: ImageRequest) -> bytes:
        """Return raw image bytes, or raise ImageGenerationError."""

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """False when credentials are missing, so callers can fail clearly."""


class FluxProvider(ImageProvider):
    """
    FLUX.1-schnell through Hugging Face Inference Providers.

    The legacy `hf-inference` route is retired for this model (410 Gone), so we
    talk to the serverless providers behind the HF router. Each returns JSON —
    either base64 or a URL — rather than raw image bytes, and we normalise both.
    Providers are tried in order so one being busy doesn't fail the request.
    """

    name = "flux-schnell"

    # (label, url, payload-style). Verified live against the HF router.
    ROUTES: tuple[tuple[str, str, str], ...] = (
        ("nscale",   "https://router.huggingface.co/nscale/v1/images/generations",   "openai"),
        ("together", "https://router.huggingface.co/together/v1/images/generations", "openai"),
        ("fal-ai",   "https://router.huggingface.co/fal-ai/fal-ai/flux/schnell",     "fal"),
    )

    def __init__(self, token: str | None = None, model: str | None = None, timeout: float = 120.0) -> None:
        self._token = token or settings.HUGGINGFACE_API_KEY or settings.HF_TOKEN
        self._model = model or settings.FLUX_MODEL
        self._timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self._token)

    def _payload(self, request: ImageRequest, style: str) -> dict[str, Any]:
        if style == "fal":
            body: dict[str, Any] = {
                "prompt": request.prompt,
                "image_size": {"width": request.width, "height": request.height},
            }
            if request.steps is not None:
                body["num_inference_steps"] = request.steps
            if request.seed is not None:
                body["seed"] = request.seed
            return body

        # OpenAI-compatible images payload (nscale, together).
        #
        # These routes have no negative_prompt field. Folding the exclusions
        # into the prompt text was tried and made output worse — the model
        # renders the very words it is told to avoid. So the negative prompt is
        # dropped here and suppression is handled by positive phrasing in the
        # prompt templates instead.
        body: dict[str, Any] = {
            "model": self._model,
            "prompt": request.prompt,
            "width": request.width,
            "height": request.height,
            "size": f"{request.width}x{request.height}",  # some routes read `size`
            "response_format": "base64",
        }
        if request.steps is not None:
            body["num_inference_steps"] = request.steps
        if request.seed is not None:
            body["seed"] = request.seed
        return body

    @staticmethod
    async def _extract_image(payload: dict[str, Any], client: httpx.AsyncClient) -> bytes | None:
        """Pull image bytes out of the various JSON shapes providers return."""
        import base64

        # OpenAI-ish: {"data": [{"b64_json": ...}]} or [{"url": ...}]
        for item in (payload.get("data") or []):
            if isinstance(item, dict):
                b64 = item.get("b64_json") or item.get("base64")
                if b64:
                    return base64.b64decode(b64)
                url = item.get("url")
                if url:
                    r = await client.get(url, timeout=60)
                    if r.status_code == 200:
                        return r.content

        # fal-ai: {"images": [{"url": ...}]}
        for item in (payload.get("images") or []):
            if isinstance(item, dict):
                url = item.get("url")
                if url:
                    r = await client.get(url, timeout=60)
                    if r.status_code == 200:
                        return r.content
                b64 = item.get("b64_json") or item.get("content")
                if b64:
                    return base64.b64decode(b64)

        # Some providers return a bare top-level base64 string.
        for key in ("image", "b64_json", "output"):
            val = payload.get(key)
            if isinstance(val, str) and len(val) > 256:
                try:
                    return base64.b64decode(val)
                except Exception:
                    pass
        return None

    async def generate_bytes(self, request: ImageRequest) -> bytes:
        if not self.is_configured:
            raise ImageGenerationError(
                "Hugging Face token is not configured. Set HUGGINGFACE_API_KEY in the backend .env.",
                status=503,
            )

        headers = {"Authorization": f"Bearer {self._token}"}
        last_error = "No image provider returned an image."
        last_status = 502

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            for label, url, style in self.ROUTES:
                try:
                    response = await client.post(url, headers=headers, json=self._payload(request, style))
                except httpx.TimeoutException:
                    last_error, last_status = f"{label} timed out.", 504
                    logger.warning("Image provider %s timed out", label)
                    continue
                except httpx.HTTPError as exc:
                    last_error, last_status = f"Network error contacting {label}: {exc}", 502
                    logger.warning("Image provider %s network error: %s", label, exc)
                    continue

                if response.status_code in (401, 403):
                    # Auth problems are terminal — every route shares the token.
                    raise ImageGenerationError(
                        "Hugging Face rejected the token. Check HUGGINGFACE_API_KEY has Inference Providers access.",
                        status=401,
                    )
                if response.status_code == 429:
                    last_error, last_status = f"{label} rate limit reached.", 429
                    logger.warning("Image provider %s rate limited", label)
                    continue

                ctype = response.headers.get("content-type", "")
                if response.status_code == 200:
                    if ctype.startswith("image/"):
                        return response.content
                    if "json" in ctype:
                        try:
                            data = await self._extract_image(response.json(), client)
                        except Exception as exc:
                            last_error = f"{label} returned unreadable JSON: {exc}"
                            continue
                        if data:
                            logger.info("Image served by provider: %s", label)
                            return data
                        last_error = f"{label} returned JSON without an image."
                        continue

                last_error = f"{label} returned {response.status_code}: {response.text[:200]}"
                last_status = 502 if response.status_code >= 500 else 400
                logger.warning("Image provider %s failed: %s", label, last_error)

        raise ImageGenerationError(last_error, status=last_status)


# ────────────────────── prompt engineering ──────────────────────

QUALITY_SUFFIX = (
    "ultra realistic, soft cinematic lighting, high detail, professional, "
    "8k, photorealistic, minimal, corporate, sharp focus"
)

# Same negation caveat as DIAGRAM_STYLES: saying "no text" here produced slide
# backgrounds with garbled headings baked in. Positive phrasing keeps the frame
# clean and leaves room for a real title to be overlaid in the UI.
SLIDE_SUFFIX = (
    "abstract geometric background illustration, bold flat colour shapes, "
    "corporate presentation backdrop, composition weighted to one side leaving "
    "the opposite area open, smooth unmarked surfaces, professional, high quality"
)

# Only used on routes that support a real negative_prompt field (fal-ai).
# It is deliberately NOT folded into the positive prompt for OpenAI-style
# routes, because that reintroduces the words we want suppressed.
DEFAULT_NEGATIVE = (
    "text, letters, words, watermark, signature, caption, label, typography, "
    "blurry, low quality, distorted, deformed"
)


def enhance_prompt(prompt: str) -> str:
    """Append quality descriptors unless the caller already supplied them."""
    base = prompt.strip().rstrip(",.")
    if any(marker in base.lower() for marker in ("8k", "photorealistic", "ultra realistic")):
        return base
    return f"{base}, {QUALITY_SUFFIX}"


def build_slide_prompt(topic: str) -> str:
    """Prompt for a presentation background image on `topic`."""
    return f"{topic.strip().rstrip(',.')}, {SLIDE_SUFFIX}"


# Diagram styles, ranked by how well FLUX renders them.
#
# `isometric` is the default: it reads as a system architecture visual while
# keeping lettering out of frame, which is where diffusion models fail. The
# `blueprint` style looks more like a conventional boxes-and-arrows diagram but
# reliably garbles labels ("API oction", "AI engim"), so it is opt-in.
#
# Note on phrasing: these prompts never say "no text" or "no labels". Diffusion
# models attend to the words in a negation rather than obeying it, so telling
# FLUX "no text, no letters, no words" measurably *increased* garbled lettering
# ("WIPD", "SERVICE"). Describing surfaces positively — "smooth blank
# untextured surfaces, plain unmarked panels" — produces clean output instead.
DIAGRAM_STYLES: dict[str, str] = {
    "isometric": (
        "Isometric 3D illustration of a cloud software architecture: {parts}. "
        "Smooth blank untextured surfaces, plain unmarked panels, "
        "components connected by glowing lines, arranged left to right. "
        "Flat vector, purple violet and cyan teal palette, dark navy background, "
        "clean modern tech illustration, high detail, professional"
    ),
    "blueprint": (
        "Technical blueprint diagram of a software system: {parts}. "
        "Geometric rounded boxes with plain empty faces connected by arrows, "
        "left to right flow, cyan glowing wireframe on dark navy background, "
        "minimal, futuristic, clean technical schematic"
    ),
    "flat": (
        "Flat vector infographic of a software system: {parts}. "
        "Minimal pictogram icons with smooth blank surfaces connected by arrows, "
        "left to right flow, purple and teal on dark navy background, "
        "clean corporate style"
    ),
    # Modelled on the classic "Project Roadmap" slide template: a winding road
    # receding into the distance with evenly spaced milestone markers.
    "roadmap": (
        "Flat vector project roadmap infographic, a winding road curving from "
        "bottom left into the distance, with {count} evenly spaced circular "
        "milestone markers along it, each marker a plain coloured disc with a "
        "small simple pictogram, alternating above and below the road. "
        "Bright teal, violet, amber and coral colour blocks, light clean "
        "background, smooth unmarked surfaces, corporate presentation "
        "infographic, flat design, high quality"
    ),
    # Modelled on the horizontal "Time & Planning" timeline template.
    "timeline": (
        "Flat vector horizontal timeline infographic, one straight central line "
        "across the frame with {count} evenly spaced circular nodes, each node a "
        "plain coloured ring containing a simple pictogram, connector stems "
        "alternating above and below the line. Teal, violet, amber and coral, "
        "light clean background, smooth unmarked surfaces, corporate "
        "presentation infographic, flat design, high quality"
    ),
}


def build_architecture_prompt(components: list[str], style: str = "isometric") -> str:
    """
    Turn a list of system components into a FLUX prompt.

    Technology names are deliberately generalised (FastAPI -> "API server")
    because the model cannot spell product names and will render them as
    plausible-looking gibberish. Describing the *kind* of component yields a
    recognisable icon instead of a misspelled label.
    """
    template = DIAGRAM_STYLES.get(style, DIAGRAM_STYLES["isometric"])
    cleaned = [c for c in dict.fromkeys(components) if c]
    parts = ", ".join(cleaned) or "web app, API server, database"
    # Roadmap/timeline templates are driven by marker count rather than a
    # component list; 4-6 reads clearly at slide size.
    count = max(3, min(len(cleaned) or 5, 6))
    return template.format(parts=parts, count=count)


# Maps concrete technologies onto generic, drawable component types.
_COMPONENT_HINTS: tuple[tuple[tuple[str, ...], str], ...] = (
    (("react native", "flutter", "swift", "kotlin", "android", "ios", "mobile"), "mobile app"),
    (("react", "next", "vue", "angular", "svelte", "frontend", "web"), "web app"),
    (("fastapi", "django", "flask", "express", "node", "spring", "api", "backend", "server"), "API server"),
    (("postgres", "mysql", "sqlite", "database", "db", "mongo", "dynamo"), "database"),
    (("redis", "memcached", "cache"), "cache"),
    (("s3", "storage", "blob", "bucket"), "cloud storage"),
    (("openai", "groq", "llm", "gpt", "claude", "gemini", "ai", "ml", "model"), "AI engine"),
    (("kafka", "rabbitmq", "queue", "sqs", "pubsub"), "message queue"),
    (("stripe", "payment", "razorpay", "paypal"), "payment gateway"),
    (("auth", "oauth", "cognito", "clerk"), "authentication service"),
)


def technologies_to_components(technologies: list[str]) -> list[str]:
    """Generalise concrete tech names into drawable component types."""
    out: list[str] = []
    for tech in technologies:
        low = (tech or "").lower()
        match = next((generic for keys, generic in _COMPONENT_HINTS if any(k in low for k in keys)), None)
        out.append(match or "service")
    # Preserve order, drop duplicates.
    return list(dict.fromkeys(out))


# ───────────────────────── the generator ─────────────────────────


class ImageGenerator:
    """
    Provider-agnostic entry point.

    Callers only ever touch `generate()` / `generate_slide_background()`.
    """

    def __init__(self, provider: ImageProvider | None = None, images_dir: Path | None = None) -> None:
        self.provider = provider or FluxProvider()
        self.images_dir = images_dir or IMAGES_DIR
        self.images_dir.mkdir(parents=True, exist_ok=True)

    # -- helpers required by the spec ------------------------------

    def validate_prompt(self, prompt: str) -> str:
        """Raise ImageGenerationError(400) when the prompt is unusable."""
        cleaned = (prompt or "").strip()
        if len(cleaned) < MIN_PROMPT_CHARS:
            raise ImageGenerationError("Prompt is too short — describe what you want to see.", status=400)
        if len(cleaned) > MAX_PROMPT_CHARS:
            raise ImageGenerationError(f"Prompt is too long (max {MAX_PROMPT_CHARS} characters).", status=400)
        return cleaned

    async def download_image(self, request: ImageRequest) -> bytes:
        """Fetch raw bytes from the active provider."""
        return await self.provider.generate_bytes(request)

    def save_image(
        self,
        data: bytes,
        cache_key: str,
        target: tuple[int, int] | None = None,
    ) -> tuple[Path, int, int]:
        """
        Persist bytes as PNG and return (path, width, height).

        Providers on the HF router treat width/height as hints and often ignore
        them (nscale returns 1024x1024 regardless), which would make a "16:9
        slide background" square. When `target` is given we centre-crop to the
        requested aspect and resize, so the caller's contract always holds.
        """
        try:
            image = Image.open(io.BytesIO(data))
            image.load()
        except Exception as exc:
            raise ImageGenerationError(f"The provider returned data that is not a valid image: {exc}", status=502)

        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

        if target and (image.width, image.height) != target:
            tw, th = target
            src_ratio, dst_ratio = image.width / image.height, tw / th
            # Centre-crop to the target aspect, then scale — avoids distortion.
            if src_ratio > dst_ratio:
                new_w = int(image.height * dst_ratio)
                left = (image.width - new_w) // 2
                image = image.crop((left, 0, left + new_w, image.height))
            elif src_ratio < dst_ratio:
                new_h = int(image.width / dst_ratio)
                top = (image.height - new_h) // 2
                image = image.crop((0, top, image.width, top + new_h))
            image = image.resize((tw, th), Image.LANCZOS)

        path = self.images_dir / f"{cache_key}_{uuid.uuid4().hex[:8]}.png"
        image.save(path, format="PNG", optimize=True)
        return path, image.width, image.height

    # -- caching ---------------------------------------------------

    @staticmethod
    def _cache_key(request: ImageRequest, final_prompt: str) -> str:
        """Hash the prompt plus every parameter that changes the pixels."""
        material = "|".join(
            str(x) for x in (
                final_prompt, request.width, request.height, request.seed,
                request.guidance_scale, request.steps, request.negative_prompt,
            )
        )
        return hashlib.sha256(material.encode("utf-8")).hexdigest()[:20]

    def _find_cached(self, cache_key: str) -> Path | None:
        return next(iter(sorted(self.images_dir.glob(f"{cache_key}_*.png"))), None)

    @staticmethod
    def _public_url(path: Path) -> str:
        return f"/api/images/file/{path.name}"

    # -- the one method the rest of the app calls -------------------

    async def generate(
        self,
        prompt: str,
        *,
        width: int = 1024,
        height: int = 1024,
        seed: int | None = None,
        guidance_scale: float | None = None,
        steps: int | None = None,
        negative_prompt: str | None = None,
        enhance: bool = True,
        use_cache: bool = True,
    ) -> ImageResult:
        started = time.perf_counter()

        try:
            cleaned = self.validate_prompt(prompt)
            request = ImageRequest(
                prompt=cleaned, width=width, height=height, seed=seed,
                guidance_scale=guidance_scale, steps=steps,
                negative_prompt=negative_prompt or DEFAULT_NEGATIVE,
                enhance=enhance,
            )
        except ImageGenerationError as exc:
            logger.warning("Image prompt rejected: %s", exc.message)
            return ImageResult(success=False, error=exc.message, provider=self.provider.name,
                               error_status=exc.status)
        except Exception as exc:  # pydantic validation
            return ImageResult(success=False, error=str(exc), provider=self.provider.name,
                               error_status=400)

        final_prompt = enhance_prompt(request.prompt) if request.enhance else request.prompt
        request = request.model_copy(update={"prompt": final_prompt})
        cache_key = self._cache_key(request, final_prompt)

        if use_cache:
            hit = self._find_cached(cache_key)
            if hit:
                with Image.open(hit) as im:
                    w, h = im.size
                logger.info("Image cache hit (%s) for prompt: %.70s", cache_key, final_prompt)
                return ImageResult(
                    success=True, image_url=self._public_url(hit),
                    local_path=str(hit.relative_to(self.images_dir.parent)),
                    width=w, height=h, cached=True, prompt=final_prompt,
                    duration_ms=int((time.perf_counter() - started) * 1000),
                    provider=self.provider.name,
                )

        logger.info("Generating image via %s: %.90s", self.provider.name, final_prompt)
        api_started = time.perf_counter()
        try:
            data = await self.download_image(request)
            api_ms = int((time.perf_counter() - api_started) * 1000)
            path, w, h = self.save_image(data, cache_key, target=(request.width, request.height))
        except ImageGenerationError as exc:
            logger.error("Image generation failed (%s): %s", exc.status, exc.message)
            return ImageResult(success=False, error=exc.message, provider=self.provider.name,
                               error_status=exc.status,
                               duration_ms=int((time.perf_counter() - started) * 1000))
        except Exception as exc:
            logger.exception("Unexpected image generation failure")
            return ImageResult(success=False, error=f"Unexpected error: {exc}",
                               provider=self.provider.name, error_status=500)

        total_ms = int((time.perf_counter() - started) * 1000)
        logger.info("Image ready in %dms (provider %dms) -> %s", total_ms, api_ms, path.name)

        return ImageResult(
            success=True, image_url=self._public_url(path),
            local_path=str(path.relative_to(self.images_dir.parent)),
            width=w, height=h, cached=False, prompt=final_prompt,
            duration_ms=total_ms, provider=self.provider.name,
        )

    async def generate_architecture_diagram(
        self,
        technologies: list[str],
        *,
        style: str = "isometric",
        **kwargs: Any,
    ) -> ImageResult:
        """
        Render a system architecture visual from a list of technologies.

        Concrete names are generalised first (see `technologies_to_components`)
        so the model draws recognisable component icons rather than attempting —
        and failing — to spell "PostgreSQL".
        """
        components = technologies_to_components(technologies)
        kwargs.setdefault("width", 1280)
        kwargs.setdefault("height", 720)
        return await self.generate(
            build_architecture_prompt(components, style=style),
            enhance=False,
            **kwargs,
        )

    async def generate_slide_background(self, topic: str, **kwargs: Any) -> ImageResult:
        """
        Presentation-ready background for `topic`.

        1280x720 is exactly 16:9 (1344x768 is 7:4, which reads as subtly wrong
        when dropped behind a slide).
        """
        kwargs.setdefault("width", 1280)
        kwargs.setdefault("height", 720)
        return await self.generate(build_slide_prompt(topic), enhance=False, **kwargs)


# Shared instance — import this rather than constructing your own.
image_generator = ImageGenerator()
