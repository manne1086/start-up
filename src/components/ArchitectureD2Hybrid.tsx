import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, ImageOff } from 'lucide-react';
import { D2 } from '@terrastruct/d2';
import type { ArchitectureModel } from './architecture-types';

type Props = {
  architecture: ArchitectureModel;
  technologies: string[];
};

function modelToD2(architecture: ArchitectureModel) {
  const edges = architecture.edges.slice(0, 16);

  if (edges.length === 0) {
    return 'frontend -> api\napi -> database';
  }

  return edges.map((edge) => `${edge.from} -> ${edge.to}`).join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fallbackSvg(architecture: ArchitectureModel) {
  const nodes = architecture.nodes.slice(0, 8);
  const W = 980;
  const H = 360;
  const gap = nodes.length > 1 ? (W - 180) / (nodes.length - 1) : 0;

  const nodeMarkup = nodes.map((node, index) => {
    const x = 60 + gap * index;
    const y = index % 2 === 0 ? 120 : 220;
    return `
      <rect x="${x}" y="${y}" width="130" height="54" rx="10" fill="#111118" stroke="#6C47FF" stroke-width="2"/>
      <text x="${x + 65}" y="${y + 33}" text-anchor="middle" fill="#F0F0F0" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700">${escapeHtml(node.label)}</text>
    `;
  }).join('');

  const edgeMarkup = nodes.slice(0, -1).map((node, index) => {
    const fromX = 60 + gap * index + 130;
    const fromY = index % 2 === 0 ? 147 : 247;
    const toX = 60 + gap * (index + 1);
    const toY = (index + 1) % 2 === 0 ? 147 : 247;
    return `<path d="M ${fromX} ${fromY} C ${fromX + 40} ${fromY}, ${toX - 40} ${toY}, ${toX} ${toY}" fill="none" stroke="#00D4AA" stroke-width="2.5" marker-end="url(#arrow)"/>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" role="img" aria-label="Architecture diagram">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00D4AA"/>
        </marker>
      </defs>
      ${edgeMarkup}
      ${nodeMarkup}
    </svg>
  `;
}

export default function ArchitectureD2Hybrid({ architecture, technologies }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);

  const diagram = useMemo(() => modelToD2(architecture), [architecture]);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const d2 = new D2();
        const compiled = await d2.compile({
          fs: { index: diagram },
          inputPath: 'index',
          options: {
            layout: 'elk',
            pad: 48,
            center: true,
            scale: 1,
            noXMLTag: true,
          },
        });
        const rendered = await d2.render(compiled.diagram, {
          sketch: false,
          center: true,
          pad: 48,
          scale: 1,
          noXMLTag: true,
        });
        if (!cancelled) {
          setSvg(rendered);
          setRenderError(null);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.warn('D2 render failed, using SVG fallback:', error);
          setSvg(fallbackSvg(architecture));
          setRenderError(null);
        }
      }
    }

    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [architecture, diagram]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadBackground() {
      if (technologies.length === 0) return;
      setBackgroundLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/images/architecture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            technologies,
            style: 'blueprint',
            use_cache: true,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setBackgroundUrl(`${apiUrl}${data.image_url}`);
      } catch {
        // Decorative background only.
      } finally {
        if (active) setBackgroundLoading(false);
      }
    }

    void loadBackground();
    return () => {
      active = false;
      controller.abort();
    };
  }, [technologies]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A0A0F]">
        <div className="absolute inset-0">
          {backgroundUrl ? (
            <img
              src={backgroundUrl}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover opacity-15 blur-[1px] scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(108,71,255,0.18),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(0,212,170,0.10),_transparent_35%)]" />
          )}
          <div className="absolute inset-0 bg-[#0A0A0F]/30" />
        </div>

        <div className="relative min-h-[520px] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#888899]">
              D2 structure over Flux background
            </div>
            <button
              onClick={() => setBackgroundUrl(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111118] px-3 py-1.5 text-xs font-bold text-[#888899] transition-colors hover:border-[#6C47FF]/40 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh background
            </button>
          </div>

          <div className="relative rounded-xl border border-white/[0.08] bg-[#0A0A0F]/80 p-3 shadow-[0_0_0_1px_rgba(108,71,255,0.08)]">
            <div className="flex min-h-[440px] items-center justify-center overflow-auto">
              {svg ? (
                <div className="w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
              ) : renderError ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <ImageOff className="h-7 w-7 text-[#FF6B6B]" />
                  <div className="text-sm text-[#FF6B6B]">{renderError}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#6C47FF]" />
                  <div className="text-sm text-[#888899]">Rendering D2 diagram…</div>
                </div>
              )}
            </div>
          </div>

          {backgroundLoading && (
            <div className="mt-2 text-xs text-[#555566]">Loading background illustration…</div>
          )}
        </div>
      </div>
    </div>
  );
}
