import { useState } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle2, ArrowRight,
  BookOpen, ChevronDown, Lightbulb, Wallet, Users,
} from 'lucide-react';

type ScoreCard = {
  label: string;
  verdict: string;
  score: number;
  plain_english: string;
  evidence?: string;
};

type GlossaryTerm = {
  term: string;
  plain_meaning: string;
  why_it_matters: string;
  this_startup?: string;
};

export type Briefing = {
  headline?: string;
  verdict?: 'promising' | 'mixed' | 'challenging';
  confidence?: number;
  elevator_pitch?: string;
  what_you_are_building?: string;
  who_pays_and_why?: string;
  how_you_make_money?: string;
  scorecards?: ScoreCard[];
  biggest_strengths?: string[];
  biggest_risks?: string[];
  do_this_next?: string[];
  glossary?: GlossaryTerm[];
};

const VERDICT_STYLE = {
  promising:   { color: '#00D4AA', bg: 'rgba(0,212,170,0.10)',  label: 'Promising' },
  mixed:       { color: '#FFB800', bg: 'rgba(255,184,0,0.10)',  label: 'Mixed signals' },
  challenging: { color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)', label: 'Challenging' },
} as const;

function scoreColor(score: number) {
  if (score >= 70) return '#00D4AA';
  if (score >= 40) return '#FFB800';
  return '#FF6B6B';
}

export default function ExecutiveBriefing({ briefing }: { briefing?: Briefing | null }) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  if (!briefing?.headline) return null;

  const verdict = VERDICT_STYLE[briefing.verdict ?? 'mixed'];
  const confidence = briefing.confidence ?? 0;
  const scorecards = briefing.scorecards ?? [];
  const glossary = briefing.glossary ?? [];

  return (
    <section className="mb-10 animate-fadeInUp">
      {/* ── Headline verdict ── */}
      <div
        className="rounded-2xl border border-white/[0.08] bg-[#111118] p-7 mb-4"
        style={{ borderLeftWidth: '4px', borderLeftColor: verdict.color }}
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
            style={{ color: verdict.color, backgroundColor: verdict.bg }}
          >
            {verdict.label}
          </span>
          {confidence > 0 && (
            <span className="text-[11px] text-[#888899] font-medium">
              Confidence in this read: <span className="font-bold text-[#E0E0EE]">{confidence}%</span>
            </span>
          )}
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white leading-snug mb-4">
          {briefing.headline}
        </h2>

        {briefing.elevator_pitch && (
          <p className="text-base text-[#E0E0EE] leading-relaxed max-w-4xl">
            {briefing.elevator_pitch}
          </p>
        )}
      </div>

      {/* ── The three questions every founder gets asked ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {[
          { icon: Lightbulb, q: 'What you are building', a: briefing.what_you_are_building, c: '#6C47FF' },
          { icon: Users,     q: 'Who pays, and why',     a: briefing.who_pays_and_why,      c: '#00D4AA' },
          { icon: Wallet,    q: 'How you make money',    a: briefing.how_you_make_money,    c: '#FFB800' },
        ].filter((x) => x.a).map(({ icon: Icon, q, a, c }) => (
          <div key={q} className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4" style={{ color: c }} />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#888899]">{q}</span>
            </div>
            <p className="text-sm text-[#E0E0EE] leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      {/* ── Scorecards ── */}
      {scorecards.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6 mb-4">
          <div className="text-[11px] font-black uppercase tracking-widest text-[#888899] mb-5">
            How it scores
          </div>
          <div className="flex flex-col gap-5">
            {scorecards.map((sc) => (
              <div key={sc.label}>
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="text-sm font-bold text-white">{sc.label}</span>
                    <span className="text-xs font-black uppercase tracking-wide" style={{ color: scoreColor(sc.score) }}>
                      {sc.verdict}
                    </span>
                  </div>
                  <span className="text-sm font-black tabular-nums shrink-0" style={{ color: scoreColor(sc.score) }}>
                    {sc.score}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#1A1A22] overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(0, Math.min(100, sc.score))}%`, backgroundColor: scoreColor(sc.score) }}
                  />
                </div>
                <p className="text-sm text-[#888899] leading-relaxed">{sc.plain_english}</p>
                {sc.evidence && (
                  <p className="text-xs text-[#555566] mt-1 font-mono">{sc.evidence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Strengths / Risks / Next steps ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ListCard
          icon={CheckCircle2}
          title="What is working"
          items={briefing.biggest_strengths ?? []}
          color="#00D4AA"
        />
        <ListCard
          icon={AlertTriangle}
          title="What could go wrong"
          items={briefing.biggest_risks ?? []}
          color="#FF6B6B"
        />
        <ListCard
          icon={ArrowRight}
          title="Do this next"
          items={briefing.do_this_next ?? []}
          color="#6C47FF"
          numbered
        />
      </div>

      {/* ── Glossary ── */}
      {glossary.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden">
          <button
            onClick={() => setGlossaryOpen((o) => !o)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#6C47FF]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#E0E0EE]">
                Every term on this page, explained
              </span>
              <span className="text-[11px] text-[#555566]">({glossary.length})</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#888899] transition-transform ${glossaryOpen ? 'rotate-180' : ''}`} />
          </button>

          {glossaryOpen && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {glossary.map((g) => (
                <div key={g.term} className="rounded-xl border border-white/[0.06] bg-[#111118] p-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm font-black text-[#6C47FF]">{g.term}</span>
                    {g.this_startup && (
                      <span className="text-xs font-bold text-[#00D4AA] tabular-nums">{g.this_startup}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#E0E0EE] leading-relaxed mb-2">{g.plain_meaning}</p>
                  <p className="text-xs text-[#888899] leading-relaxed">{g.why_it_matters}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ListCard({
  icon: Icon, title, items, color, numbered = false,
}: {
  icon: typeof TrendingUp;
  title: string;
  items: string[];
  color: string;
  numbered?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[11px] font-black uppercase tracking-widest text-[#888899]">{title}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-[#E0E0EE] leading-relaxed">
            <span className="shrink-0 font-black tabular-nums" style={{ color }}>
              {numbered ? `${i + 1}.` : '•'}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
