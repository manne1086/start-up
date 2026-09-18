import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, ImageOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type DiagramStyle = 'isometric' | 'blueprint' | 'flat';

const STYLE_LABELS: Record<DiagramStyle, string> = {
  isometric: 'Isometric',
  blueprint: 'Blueprint',
  flat: 'Flat icons',
};

interface Props {
  /** Technologies from the MVP agent, e.g. ["React Native", "FastAPI"]. */
  technologies: string[];
  className?: string;
}

/**
 * Renders the system architecture as a FLUX-generated illustration.
 *
 * The backend generalises technology names into drawable component types
 * before prompting, so the image shows recognisable icons rather than
 * misspelled product names.
 */
export default function ArchitectureImage({ technologies, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<DiagramStyle>('isometric');

  // Guards against a slow first response overwriting a newer one.
  const requestIdRef = useRef(0);

  const load = useCallback(async (opts: { regenerate?: boolean; style?: DiagramStyle } = {}) => {
    const chosen = opts.style ?? style;
    const id = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/images/architecture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          technologies,
          style: chosen,
          use_cache: !opts.regenerate,
          // A fresh seed forces a genuinely different image on regenerate,
          // otherwise the identical prompt would just re-hit the cache.
          ...(opts.regenerate ? { seed: Math.floor(Math.random() * 1_000_000) } : {}),
        }),
      });

      if (id !== requestIdRef.current) return; // superseded

      if (!res.ok) {
        let detail = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (typeof body?.detail === 'string') detail = body.detail;
        } catch { /* keep the status message */ }
        throw new Error(detail);
      }

      const data = await res.json();
      if (id !== requestIdRef.current) return;
      setUrl(`${API_URL}${data.image_url}`);
    } catch (err: any) {
      if (id === requestIdRef.current) setError(err?.message ?? 'Could not generate the diagram.');
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, [technologies, style]);

  useEffect(() => {
    if (technologies.length === 0) return;
    void load();
    // Re-fetch when the stack itself changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technologies.join('|')]);

  const switchStyle = (next: DiagramStyle) => {
    setStyle(next);
    void load({ style: next });
  };

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          {(Object.keys(STYLE_LABELS) as DiagramStyle[]).map((key) => (
            <button
              key={key}
              onClick={() => switchStyle(key)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                style === key
                  ? 'bg-[#6C47FF] text-white'
                  : 'bg-[#111118] text-[#888899] hover:text-white border border-white/[0.08]'
              }`}
            >
              {STYLE_LABELS[key]}
            </button>
          ))}
        </div>

        <button
          onClick={() => load({ regenerate: true })}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-[#888899] hover:text-white border border-white/[0.08] hover:border-[#6C47FF]/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-[#0A0A0F] overflow-hidden aspect-video">
        {url && (
          <img
            src={url}
            alt="System architecture illustration"
            /* contain, not cover — cover was cropping the edges of the
               illustration and cutting components out of frame */
            className={`w-full h-full object-contain transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#6C47FF] animate-spin" />
            <span className="text-sm text-[#888899]">Generating the architecture visual…</span>
            <span className="text-xs text-[#555566]">This takes about 8 seconds</span>
          </div>
        )}

        {!loading && !url && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ImageOff className="w-7 h-7 text-[#FF6B6B]" />
            <span className="text-sm text-[#FF6B6B]">{error}</span>
            <button
              onClick={() => load()}
              className="mt-1 px-4 py-2 rounded-lg bg-[#6C47FF] hover:bg-[#7D5AFF] text-white text-xs font-bold transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !url && !error && technologies.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-[#555566]">No tech stack available yet.</span>
          </div>
        )}
      </div>

      {/* Honest caption — the image conveys shape, the stack list carries the facts. */}
      <p className="mt-3 text-xs text-[#555566] leading-relaxed">
        An illustrative view of the system shape. Exact technologies are listed in the stack below.
      </p>
    </div>
  );
}
