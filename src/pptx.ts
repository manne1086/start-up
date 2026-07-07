const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function downloadPitchDeckPptx(state: unknown, filename: string) {
  const response = await fetch(`${API_URL}/api/outputs/pptx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ state }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
