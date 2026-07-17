from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import tempfile
from functools import partial
from pathlib import Path

IMAGES_DIR = Path(__file__).resolve().parents[1] / "data" / "slide_images"


def _convert_sync(pptx_bytes: bytes, thread_id: str) -> int:
    """Export each PPTX slide to a PNG via PowerPoint COM (PowerShell subprocess).
    Returns the number of slides exported.

    Requires a Windows host with a licensed PowerPoint install (COM
    automation). Not available on Linux hosts such as Render — callers
    should treat failures here as non-fatal and fall back to the
    text-based slide editor."""
    if sys.platform != "win32":
        raise RuntimeError("PowerPoint COM automation requires Windows; skipping slide image export.")

    output_dir = IMAGES_DIR / thread_id
    output_dir.mkdir(parents=True, exist_ok=True)

    pptx_path = output_dir / "presentation.pptx"
    pptx_path.write_bytes(pptx_bytes)

    ps_script = (
        "$ErrorActionPreference = 'Stop'\n"
        "$ppt = New-Object -ComObject PowerPoint.Application\n"
        "try {\n"
        f"    $pres = $ppt.Presentations.Open('{pptx_path}', [Microsoft.Office.Interop.PowerPoint.MsoTriState]::msoFalse, "
        "[Microsoft.Office.Interop.PowerPoint.MsoTriState]::msoFalse, "
        "[Microsoft.Office.Interop.PowerPoint.MsoTriState]::msoFalse)\n"
        "    for ($i = 1; $i -le $pres.Slides.Count; $i++) {\n"
        f"        $outPath = '{output_dir}' + '\\slide_' + $i + '.png'\n"
        "        $pres.Slides.Item($i).Export($outPath, 'PNG', 1920, 1080)\n"
        "    }\n"
        "    $count = $pres.Slides.Count\n"
        "    $pres.Close()\n"
        "    Write-Output $count\n"
        "} finally {\n"
        "    $ppt.Quit()\n"
        "    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null\n"
        "}\n"
    )

    with tempfile.NamedTemporaryFile(mode="w", suffix=".ps1", delete=False, encoding="utf-8") as f:
        f.write(ps_script)
        ps_path = f.name

    try:
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_path],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(f"PowerPoint export failed: {result.stderr.strip()}")

        count = int(result.stdout.strip().splitlines()[-1])
        return count
    finally:
        try:
            os.unlink(ps_path)
        except OSError:
            pass
        try:
            pptx_path.unlink(missing_ok=True)
        except OSError:
            pass


async def convert_pptx_to_images(pptx_bytes: bytes, thread_id: str) -> int:
    """Async wrapper — runs the PowerPoint conversion in a thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_convert_sync, pptx_bytes, thread_id))


def get_slide_image_path(thread_id: str, slide_number: int) -> Path | None:
    """Return the path to a specific slide image, or None if it doesn't exist."""
    path = IMAGES_DIR / thread_id / f"slide_{slide_number}.png"
    return path if path.exists() else None


def get_slide_count(thread_id: str) -> int:
    """Return how many slide images exist for a thread."""
    d = IMAGES_DIR / thread_id
    if not d.exists():
        return 0
    return len(list(d.glob("slide_*.png")))
