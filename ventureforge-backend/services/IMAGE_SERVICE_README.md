# Image Generation Service

Provider-agnostic image generation for VentureForge. Any agent or route calls
`image_generator.generate(prompt=...)` and gets back a saved PNG plus metadata,
without knowing which provider served it.

Default provider: **FLUX.1-schnell** via Hugging Face Inference Providers.

---

## Installation

Dependencies are in `requirements.txt` (`httpx`, `Pillow`, `python-dotenv`):

```bash
cd ventureforge-backend
pip install -r requirements.txt
```

## Token setup

Add to `ventureforge-backend/.env`:

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
```

`HF_TOKEN` is accepted as an alias. The token needs **Inference Providers**
access (a standard read token works). Never hardcode it — it is read through
`core.config.settings`.

Optional override:

```env
FLUX_MODEL=black-forest-labs/FLUX.1-schnell
```

## Running

```bash
uvicorn main:app --reload --port 8000
```

---

## API

### `POST /api/images/generate`

```json
{
  "prompt": "A beautiful modern office with AI assistants",
  "width": 1024,
  "height": 1024,
  "seed": null,
  "guidance_scale": null,
  "steps": null,
  "negative_prompt": null,
  "enhance": true,
  "use_cache": true
}
```

Response:

```json
{
  "success": true,
  "image_url": "/api/images/file/982a240c82c5dbff7bcf_016a0bee.png",
  "local_path": "generated_images/982a240c82c5dbff7bcf_016a0bee.png",
  "width": 1024,
  "height": 1024,
  "cached": false,
  "prompt": "A beautiful modern office with AI assistants, ultra realistic, ...",
  "duration_ms": 13082,
  "provider": "flux-schnell",
  "error": null
}
```

### `POST /api/images/slide-background`

```json
{ "topic": "Artificial Intelligence in Healthcare" }
```

Returns a true 16:9 (1280x720) presentation background.

### `GET /api/images/file/{filename}`

Serves a generated PNG. Filenames are validated to stay inside
`generated_images/`.

---

## curl

```bash
curl -X POST http://localhost:8000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A futuristic AI-powered banking dashboard with holographic analytics"}'
```

```bash
curl -X POST http://localhost:8000/api/images/slide-background \
  -H "Content-Type: application/json" \
  -d '{"topic":"Market Growth Strategy"}'
```

## Python

```python
from services.image_service import image_generator

result = await image_generator.generate(
    prompt="A futuristic AI-powered banking dashboard with holographic analytics"
)
if result.success:
    print(result.image_url, result.width, result.height)

slide = await image_generator.generate_slide_background("AI in Healthcare")
```

---

## Behaviour notes

**Prompt enhancement** — `enhance=True` (default) appends quality descriptors:
`ultra realistic, soft cinematic lighting, high detail, professional, 8k,
photorealistic, minimal, corporate, sharp focus`. Skipped automatically when the
prompt already contains such markers. Pass `enhance=False` for full control.

**Caching** — the prompt plus every pixel-affecting parameter is SHA-256 hashed.
A repeat request returns the existing file in ~30ms instead of regenerating.
Pass `use_cache=false` to force a new image.

**Dimensions are enforced locally.** Providers on the HF router treat
`width`/`height` as hints and frequently ignore them (nscale returns 1024x1024
regardless). After download, the image is centre-cropped to the requested aspect
and resized with Pillow, so the returned size always matches what was asked for.

**Provider failover** — `nscale -> together -> fal-ai`, tried in order. A busy or
failing provider falls through to the next. Auth failures are terminal (all
routes share the token).

**Storage** — PNGs land in `generated_images/` as `{cache_key}_{uuid}.png`.

---

## Error handling

| Condition | Status |
|---|---|
| Prompt too short / too long | `400` |
| Invalid token | `401` |
| Rate limited | `429` |
| No token configured | `503` |
| Provider error / bad response | `502` |
| Provider timeout | `504` |

Failures return `{"detail": "<human-readable message>"}`.

---

## Adding a provider

Implement `ImageProvider` and pass it in — no caller changes:

```python
class OpenAIProvider(ImageProvider):
    name = "openai-dalle"

    @property
    def is_configured(self) -> bool:
        return bool(settings.OPENAI_API_KEY)

    async def generate_bytes(self, request: ImageRequest) -> bytes:
        ...  # raise ImageGenerationError(msg, status) on failure

from services.image_service import ImageGenerator
image_generator = ImageGenerator(provider=OpenAIProvider())
```

Candidates: OpenAI, Gemini, Stability AI, Replicate, Fal.ai, Together AI.

---

### `POST /api/images/architecture`

```json
{
  "technologies": ["React Native", "FastAPI", "PostgreSQL", "Redis", "OpenAI GPT-4"],
  "style": "isometric"
}
```

Styles: `isometric` (default), `blueprint`, `flat`. Returns 1280x720.

Technology names are **generalised before prompting** — `FastAPI` becomes
"API server", `PostgreSQL` becomes "database". This is deliberate: FLUX cannot
spell product names and renders them as gibberish (`FastAPI` -> `FasttAPPI`,
`PostgreSQL` -> `Postcbase`). Describing the *kind* of component yields a
recognisable icon instead of a misspelled label. Mapping lives in
`_COMPONENT_HINTS`.

---

## Prompt engineering notes

**Never write "no text" in a prompt.** Diffusion models attend to the words
inside a negation rather than obeying it. Prompts containing
`no text, no labels, no letters, no words` measurably produced *more* garbled
lettering (`WIPD`, `SERVICE`, `MARKET growth Strategy STRATEGY`). Removing the
negation and describing surfaces positively — `smooth blank untextured surfaces,
plain unmarked panels` — produced clean output across seeds.

For the same reason, `DEFAULT_NEGATIVE` is **not** folded into the prompt text
on OpenAI-style routes (nscale, together), which have no `negative_prompt`
field. Suppression is handled by positive phrasing in the templates instead.

**Output varies between runs.** The same prompt can produce a clean image on one
seed and stray lettering on the next. The UI exposes a Regenerate control that
sends a fresh random seed, since re-sending an identical prompt would just hit
the cache.

---

## Scope

This service renders **illustrative** imagery: architecture visuals, slide
backgrounds, hero images, section dividers.

It conveys the *shape* of a system — which kinds of components exist and roughly
how they connect. It does not encode exact topology, and the component list is
approximate. The precise stack is shown as text alongside the image on the MVP
Architecture page, which is where the authoritative detail lives.
