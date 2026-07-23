/**
 * Reusable Mermaid.js diagram renderer.
 *
 * Feed it any valid Mermaid syntax (flowchart, sequence, class, ER, gantt, etc.)
 * and it will render an SVG in-app. No external redirects, no server round-trip.
 */

import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';

// Initialize once with dark theme matching VentureForge's palette
let mermaidInitialized = false;
function ensureInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      // Neo-brutalist dark theme matching the app
      background: '#0D0D14',
      primaryColor: '#1A1A22',
      primaryTextColor: '#F0F0F0',
      primaryBorderColor: '#6C47FF',
      lineColor: '#00D4AA',
      secondaryColor: '#111118',
      tertiaryColor: '#0A0A0F',
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '14px',
      // Cluster (subgraph) styling
      clusterBkg: '#0A0A0F',
      clusterBorder: '#6C47FF44',
      // Edge label
      edgeLabelBackground: '#111118',
      // Text
      nodeTextColor: '#F0F0F0',
    },
    flowchart: {
      curve: 'basis',
      padding: 20,
      nodeSpacing: 50,
      rankSpacing: 60,
      useMaxWidth: true,
    },
    securityLevel: 'loose',
  });
  mermaidInitialized = true;
}

interface Props {
  code: string;
  className?: string;
  onError?: (err: string) => void;
}

export default function MermaidDiagram({ code, className, onError }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useId().replace(/:/g, ''); // Mermaid dislikes colons in ids

  useEffect(() => {
    ensureInit();
    if (!code?.trim() || !ref.current) return;

    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(`mmd-${id}`, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        if (!cancelled) {
          setError(msg);
          onError?.(msg);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [code, id, onError]);

  if (error) {
    return (
      <div className={`p-4 rounded-lg border border-[#FF6B6B]/30 bg-[#FF6B6B]/5 text-[#FF6B6B] text-xs font-mono ${className ?? ''}`}>
        <div className="font-bold mb-2">Diagram rendering failed:</div>
        <pre className="whitespace-pre-wrap opacity-80">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`mermaid-container w-full overflow-x-auto ${className ?? ''}`}
      style={{ minHeight: 200 }}
    />
  );
}
