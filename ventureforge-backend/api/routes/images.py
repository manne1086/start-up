"""Image generation endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from services.image_service import (
    IMAGES_DIR,
    ImageGenerator,
    ImageResult,
    image_generator,
)

router = APIRouter()


def get_image_generator() -> ImageGenerator:
    """Dependency injection seam — override in tests with a fake provider."""
    return image_generator


class GenerateImageBody(BaseModel):
    prompt: str = Field(..., examples=["A beautiful modern office with AI assistants"])
    width: int = 1024
    height: int = 1024
    seed: int | None = None
    guidance_scale: float | None = None
    steps: int | None = None
    negative_prompt: str | None = None
    enhance: bool = True
    use_cache: bool = True


class SlideBackgroundBody(BaseModel):
    topic: str = Field(..., examples=["Artificial Intelligence in Healthcare"])
    seed: int | None = None
    use_cache: bool = True


class ArchitectureBody(BaseModel):
    """Technologies from the MVP agent, e.g. ["React Native", "FastAPI", "PostgreSQL"]."""

    technologies: list[str] = Field(default_factory=list)
    style: str = Field("isometric", examples=["isometric", "blueprint", "flat"])
    seed: int | None = None
    use_cache: bool = True


@router.post("/images/generate", response_model=ImageResult)
async def generate_image(
    body: GenerateImageBody,
    generator: ImageGenerator = Depends(get_image_generator),
) -> ImageResult:
    result = await generator.generate(
        body.prompt,
        width=body.width,
        height=body.height,
        seed=body.seed,
        guidance_scale=body.guidance_scale,
        steps=body.steps,
        negative_prompt=body.negative_prompt,
        enhance=body.enhance,
        use_cache=body.use_cache,
    )
    if not result.success:
        raise HTTPException(status_code=result.error_status, detail=result.error or "Image generation failed.")
    return result


@router.post("/images/slide-background", response_model=ImageResult)
async def generate_slide_background(
    body: SlideBackgroundBody,
    generator: ImageGenerator = Depends(get_image_generator),
) -> ImageResult:
    result = await generator.generate_slide_background(
        body.topic, seed=body.seed, use_cache=body.use_cache
    )
    if not result.success:
        raise HTTPException(status_code=result.error_status, detail=result.error or "Image generation failed.")
    return result


@router.post("/images/architecture", response_model=ImageResult)
async def generate_architecture_diagram(
    body: ArchitectureBody,
    generator: ImageGenerator = Depends(get_image_generator),
) -> ImageResult:
    """Render the MVP architecture as an illustrated visual."""
    result = await generator.generate_architecture_diagram(
        body.technologies,
        style=body.style,
        seed=body.seed,
        use_cache=body.use_cache,
    )
    if not result.success:
        raise HTTPException(status_code=result.error_status, detail=result.error or "Image generation failed.")
    return result


@router.get("/images/file/{filename}")
async def serve_image(filename: str) -> FileResponse:
    """Serve a generated PNG. Filename is validated to stay inside the folder."""
    # Reject traversal before touching the filesystem.
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    path = (IMAGES_DIR / filename).resolve()
    if not str(path).startswith(str(Path(IMAGES_DIR).resolve())):
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(path, media_type="image/png")
