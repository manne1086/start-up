const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function downloadPitchDeckPptx(state: unknown, filename: string) {
  const stateObj = state as Record<string, unknown> | null | undefined;

  // Build the payload — send thread_id as a fallback so the backend
  // can look up the state from its own store when the full state is too large
  const payload: Record<string, unknown> = {};
  payload.prefer_local_flux = true;
  if (stateObj && Object.keys(stateObj).length > 0) {
    payload.state = stateObj;
  }
  if (stateObj?.thread_id) {
    payload.thread_id = stateObj.thread_id;
  }

  const response = await fetch(`${API_URL}/api/outputs/pptx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorText: string;
    try {
      errorText = await response.text();
    } catch {
      errorText = `Server returned ${response.status}`;
    }
    throw new Error(errorText || `PPTX generation failed (${response.status})`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/vnd.openxmlformats') && !contentType.includes('application/octet-stream')) {
    // Might be a JSON error response
    const text = await response.text();
    throw new Error(text || 'Server did not return a valid PPTX file');
  }

  const blob = await response.blob();
  if (blob.size < 100) {
    throw new Error('Generated file appears to be empty');
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
