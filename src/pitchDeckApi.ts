const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export type SlideContentSuggestion = {
  text: string;
  bullets: string[];
};

export async function regenerateSlideContent(
  state: unknown,
  slideTitle: string,
  slideType?: string,
): Promise<SlideContentSuggestion> {
  const response = await fetch(`${API_URL}/api/outputs/regenerate-slide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ state: state ?? {}, slide_title: slideTitle, slide_type: slideType }),
  });

  if (!response.ok) {
    let detail = `Server error ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      detail = (await response.text().catch(() => detail)) || detail;
    }
    throw new Error(detail);
  }

  const data = (await response.json()) as { content?: { text?: string; bullets?: string[] } };
  return {
    text: data.content?.text ?? '',
    bullets: Array.isArray(data.content?.bullets) ? data.content.bullets : [],
  };
}
