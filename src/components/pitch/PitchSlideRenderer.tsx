/**
 * Renders a single pitch slide in one of 3 aesthetic templates:
 *   - pritzker: cream/beige editorial architecture, serif
 *   - fashion:  luxury magazine, gold/brown palette
 *   - indie:    DIY zine, warm cream, monospace + playful
 *
 * All rendering happens in-app — no external redirects.
 */

type SlideContent = Record<string, unknown>;

type Slide = {
  number?: number;
  title?: string;
  content?: SlideContent;
};

type TemplateKey = 'pritzker' | 'fashion' | 'indie';

interface Props {
  slide: Slide;
  template: TemplateKey;
  startup: string;
  slideIndex: number;
  totalSlides: number;
}

const THEMES: Record<TemplateKey, {
  bg: string;
  ink: string;
  accent: string;
  soft: string;
  headingFont: string;
  bodyFont: string;
  label: string;
}> = {
  pritzker: {
    bg: '#F5F2EC',
    ink: '#2B2419',
    accent: '#B8935A',
    soft: '#E8C788',
    headingFont: '"Playfair Display", Georgia, serif',
    bodyFont: '"Inter", -apple-system, sans-serif',
    label: 'PRITZKER · EDITORIAL',
  },
  fashion: {
    bg: '#F5F0EB',
    ink: '#2B1810',
    accent: '#B8935A',
    soft: '#D4A574',
    headingFont: '"Playfair Display", "Didot", serif',
    bodyFont: '"Inter", -apple-system, sans-serif',
    label: 'FASHION WEEKLY',
  },
  indie: {
    bg: '#F5EFE0',
    ink: '#3A2E2E',
    accent: '#E85D75',
    soft: '#F4A261',
    headingFont: '"Courier New", "Monaco", monospace',
    bodyFont: '"Courier New", "Monaco", monospace',
    label: 'INDIE ZINE',
  },
};

function s(content: SlideContent | undefined, key: string, fallback = ''): string {
  const val = content?.[key];
  return typeof val === 'string' ? val : fallback;
}

function arr(content: SlideContent | undefined, key: string): string[] {
  const val = content?.[key];
  return Array.isArray(val) ? val.filter((v) => typeof v === 'string') : [];
}

export default function PitchSlideRenderer({ slide, template, startup, slideIndex, totalSlides }: Props) {
  const theme = THEMES[template];
  const content = slide.content ?? {};
  const title = slide.title ?? '';

  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: theme.bg,
        color: theme.ink,
        fontFamily: theme.bodyFont,
        aspectRatio: '16 / 9',
      }}
    >
      {/* Header ribbon */}
      <div className="px-12 py-4 flex justify-between items-center text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.accent }}>
        <span style={{ fontFamily: theme.bodyFont, fontWeight: 600 }}>{theme.label}</span>
        <span>{String(slideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}</span>
      </div>

      {/* Divider */}
      <div className="mx-12 h-px" style={{ backgroundColor: `${theme.ink}20` }} />

      {/* Body */}
      <div className="flex-1 px-12 py-8 flex flex-col justify-center">
        {renderBody(title, content, theme, startup)}
      </div>

      {/* Footer */}
      <div className="px-12 py-4 flex justify-between items-center text-[10px] tracking-widest" style={{ color: `${theme.ink}80` }}>
        <span style={{ fontFamily: theme.headingFont, fontStyle: 'italic' }}>{startup}</span>
        <span>{title.toUpperCase()}</span>
      </div>
    </div>
  );
}

// --- Per-slide-type body renderers ---------------------------------------

function renderBody(
  title: string,
  content: SlideContent,
  theme: (typeof THEMES)[TemplateKey],
  startup: string,
) {
  const t = title.toLowerCase();

  if (t.includes('cover')) return <Cover content={content} theme={theme} startup={startup} />;
  if (t.includes('problem')) return <Problem content={content} theme={theme} />;
  if (t.includes('solution')) return <Solution content={content} theme={theme} />;
  if (t.includes('market')) return <Market content={content} theme={theme} />;
  if (t.includes('product')) return <Product content={content} theme={theme} />;
  if (t.includes('business') || t.includes('model')) return <Business content={content} theme={theme} />;
  if (t.includes('go-to') || t.includes('gtm')) return <GTM content={content} theme={theme} />;
  if (t.includes('compet')) return <Competition content={content} theme={theme} />;
  if (t.includes('team')) return <Team content={content} theme={theme} />;
  if (t.includes('ask') || t.includes('fund')) return <Ask content={content} theme={theme} />;

  return <Generic title={title} content={content} theme={theme} />;
}

type ThemeT = (typeof THEMES)[TemplateKey];

function Cover({ content, theme, startup }: { content: SlideContent; theme: ThemeT; startup: string }) {
  const name = s(content, 'startup', startup);
  const tagline = s(content, 'tagline');
  const subtitle = s(content, 'subtitle');
  return (
    <div className="flex flex-col justify-center h-full">
      <div className="text-xs tracking-[0.5em] uppercase mb-6" style={{ color: theme.accent }}>
        Investor Pitch · 2026
      </div>
      <h1
        className="mb-4 leading-none"
        style={{
          fontFamily: theme.headingFont,
          fontSize: 'clamp(48px, 6.5vw, 88px)',
          fontWeight: 700,
          color: theme.ink,
        }}
      >
        {name}
      </h1>
      <div
        className="text-3xl mb-8 italic"
        style={{ fontFamily: theme.headingFont, color: theme.accent }}
      >
        {tagline}
      </div>
      {subtitle && (
        <div className="text-base tracking-wide" style={{ color: `${theme.ink}80` }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function Problem({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  return (
    <div className="grid grid-cols-2 gap-12 h-full items-center">
      <div>
        <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>
          The Problem
        </div>
        <h2 className="mb-6 leading-tight" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
          {s(content, 'headline', 'A broken status quo')}
        </h2>
        <p className="text-lg leading-relaxed" style={{ color: `${theme.ink}CC` }}>
          {s(content, 'body')}
        </p>
      </div>
      <div className="p-8 border-l-4" style={{ borderColor: theme.accent, backgroundColor: `${theme.accent}15` }}>
        <div className="text-xs tracking-widest uppercase mb-4" style={{ color: theme.accent }}>
          Impact
        </div>
        <div className="text-4xl font-bold leading-tight" style={{ fontFamily: theme.headingFont, color: theme.ink }}>
          {s(content, 'stat', '—')}
        </div>
      </div>
    </div>
  );
}

function Solution({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  const features = arr(content, 'features');
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>
        Our Solution
      </div>
      <h2 className="mb-6 leading-tight" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
        {s(content, 'headline', 'A better way')}
      </h2>
      <p className="text-lg leading-relaxed mb-8 max-w-4xl" style={{ color: `${theme.ink}CC` }}>
        {s(content, 'body')}
      </p>
      {features.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          {features.slice(0, 3).map((f, i) => (
            <div key={i} className="p-5 border-t-2" style={{ borderColor: theme.accent, backgroundColor: `${theme.accent}10` }}>
              <div className="text-3xl font-bold mb-2" style={{ color: theme.accent, fontFamily: theme.headingFont }}>
                0{i + 1}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: theme.ink }}>{f}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Market({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>
        Market Opportunity
      </div>
      <h2 className="mb-8" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
        A massive, addressable market
      </h2>
      <div className="grid grid-cols-3 gap-8 mb-10">
        {(['tam', 'sam', 'som'] as const).map((key) => (
          <div key={key} className="p-6" style={{ backgroundColor: `${theme.accent}15`, borderTop: `3px solid ${theme.accent}` }}>
            <div className="text-xs tracking-widest uppercase mb-3" style={{ color: theme.accent }}>{key}</div>
            <div className="text-4xl font-bold" style={{ fontFamily: theme.headingFont, color: theme.ink }}>
              {s(content, key, '—')}
            </div>
          </div>
        ))}
      </div>
      {s(content, 'insight') && (
        <p className="text-base italic max-w-3xl" style={{ color: `${theme.ink}AA`, fontFamily: theme.headingFont }}>
          "{s(content, 'insight')}"
        </p>
      )}
    </div>
  );
}

function Product({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  const highlights = arr(content, 'highlights');
  return (
    <div className="grid grid-cols-2 gap-12 h-full items-center">
      <div>
        <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>Product</div>
        <h2 className="mb-6" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
          {s(content, 'headline', 'The Product')}
        </h2>
        <p className="text-lg leading-relaxed" style={{ color: `${theme.ink}CC` }}>{s(content, 'body')}</p>
      </div>
      <div className="space-y-4">
        {highlights.map((h, i) => (
          <div key={i} className="flex gap-4 items-start p-4" style={{ backgroundColor: `${theme.accent}10` }}>
            <div className="text-2xl font-bold" style={{ color: theme.accent, fontFamily: theme.headingFont }}>→</div>
            <div className="text-base" style={{ color: theme.ink }}>{h}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Business({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>Business Model</div>
      <h2 className="mb-10" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
        {s(content, 'model', 'How we make money')}
      </h2>
      <div className="grid grid-cols-2 gap-8">
        <div className="p-6 border-l-4" style={{ borderColor: theme.accent }}>
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: theme.accent }}>Pricing</div>
          <div className="text-xl leading-relaxed" style={{ color: theme.ink }}>{s(content, 'pricing')}</div>
        </div>
        <div className="p-6 border-l-4" style={{ borderColor: theme.accent }}>
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: theme.accent }}>Unit Economics</div>
          <div className="text-xl leading-relaxed" style={{ color: theme.ink }}>{s(content, 'unit_economics')}</div>
        </div>
      </div>
    </div>
  );
}

function GTM({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  const channels = arr(content, 'channels');
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>Go-To-Market</div>
      <h2 className="mb-8" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
        Reaching customers
      </h2>
      <p className="text-lg leading-relaxed mb-10 max-w-4xl" style={{ color: `${theme.ink}CC` }}>{s(content, 'strategy')}</p>
      {channels.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          {channels.slice(0, 3).map((ch, i) => (
            <div key={i} className="p-5 text-center" style={{ backgroundColor: `${theme.accent}15`, borderTop: `3px solid ${theme.accent}` }}>
              <div className="text-xs tracking-widest uppercase mb-2" style={{ color: theme.accent }}>Channel {i + 1}</div>
              <div className="text-base font-semibold" style={{ color: theme.ink }}>{ch}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Competition({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  const competitors = arr(content, 'competitors');
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>Competitive Landscape</div>
      <h2 className="mb-8" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
        {s(content, 'headline', 'Our Edge')}
      </h2>
      <div className="grid grid-cols-2 gap-8">
        <div className="p-6" style={{ backgroundColor: `${theme.accent}15`, borderLeft: `4px solid ${theme.accent}` }}>
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: theme.accent }}>Our Advantage</div>
          <p className="text-lg leading-relaxed" style={{ color: theme.ink }}>{s(content, 'advantage')}</p>
        </div>
        <div>
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: theme.accent }}>Alternatives</div>
          <div className="space-y-3">
            {competitors.slice(0, 4).map((c, i) => (
              <div key={i} className="text-base py-2 border-b" style={{ color: theme.ink, borderColor: `${theme.ink}20` }}>{c}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Team({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>The Team</div>
      <h2 className="mb-6" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 700 }}>
        {s(content, 'headline', 'Built to execute')}
      </h2>
      <p className="text-xl leading-relaxed max-w-4xl" style={{ color: `${theme.ink}CC` }}>{s(content, 'body')}</p>
    </div>
  );
}

function Ask({ content, theme }: { content: SlideContent; theme: ThemeT }) {
  const useOfFunds = arr(content, 'use_of_funds');
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>The Ask</div>
      <div className="mb-8" style={{ fontFamily: theme.headingFont, fontSize: 'clamp(56px, 8vw, 96px)', fontWeight: 700, color: theme.ink, lineHeight: 1 }}>
        {s(content, 'amount', '$—')}
      </div>
      {useOfFunds.length > 0 && (
        <div className="mb-8">
          <div className="text-xs tracking-widest uppercase mb-4" style={{ color: theme.accent }}>Use of Funds</div>
          <div className="grid grid-cols-3 gap-4">
            {useOfFunds.slice(0, 3).map((u, i) => (
              <div key={i} className="p-4" style={{ backgroundColor: `${theme.accent}15`, borderTop: `3px solid ${theme.accent}` }}>
                <div className="text-sm" style={{ color: theme.ink }}>{u}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-lg italic" style={{ color: `${theme.ink}CC`, fontFamily: theme.headingFont }}>
        {s(content, 'closing', 'Join us.')}
      </p>
    </div>
  );
}

function Generic({ title, content, theme }: { title: string; content: SlideContent; theme: ThemeT }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: theme.accent }}>{title}</div>
      <div className="text-lg leading-relaxed max-w-4xl" style={{ color: theme.ink }}>
        {Object.entries(content).map(([k, v]) => (
          <div key={k} className="mb-3">
            <span style={{ color: theme.accent, fontWeight: 600 }}>{k}: </span>
            <span>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
