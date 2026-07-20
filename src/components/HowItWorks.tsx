import React, { useRef } from 'react';
import {
  Lightbulb, Search, ShieldCheck, Briefcase, DollarSign, Scale,
  Presentation, Cpu, Shuffle, ArrowRight, LayoutDashboard,
  BarChart3, Target, MessageSquare, ThumbsUp, GitFork, Rocket,
  ChevronRight, Eye, Users, Sparkles, PanelLeft, PanelRight,
} from 'lucide-react';
import { motion, useInView } from 'motion/react';
import GlobalNavbar from './GlobalNavbar';
import { useRouter } from '../router';
import { useAuth } from '../auth';

/* ─── animation wrapper ─── */
function FadeIn({ children, className = '', delay = 0, ...rest }: { children: React.ReactNode; className?: string; delay?: number; [key: string]: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── pipeline data (mirrors graph/graph.py) ─── */
type PipelineNode = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  desc: string;
  retry?: string;
  humanReview?: boolean;
};

const PIPELINE_NODES: PipelineNode[] = [
  { id: 'orchestrator', label: 'Orchestrator', icon: Sparkles, color: '#6C47FF', desc: 'Names & classifies your startup from the raw idea.' },
  { id: 'market_research', label: 'Market Research', icon: Search, color: '#00D4AA', desc: 'Searches the web for market size, competitors, gaps & trends.' },
  { id: 'validator_market', label: 'Market Validator', icon: ShieldCheck, color: '#FF6B6B', desc: 'Checks research for consistency & completeness.', retry: 'market_research' },
  { id: 'business_planning', label: 'Business Planning', icon: Briefcase, color: '#6C47FF', desc: 'Generates an investor-grade business plan with GTM strategy.' },
  { id: 'financial_engineering', label: 'Financial Engine', icon: DollarSign, color: '#00D4AA', desc: 'Builds revenue projections, unit economics & cost models.', humanReview: true },
  { id: 'validator_financial', label: 'Financial Validator', icon: ShieldCheck, color: '#FF6B6B', desc: 'Validates projections for realism before continuing.', retry: 'financial_engineering' },
  { id: 'legal_compliance', label: 'Legal & Compliance', icon: Scale, color: '#6C47FF', desc: 'Assesses regulatory risks and recommends entity structure.' },
  { id: 'pitch_deck', label: 'Pitch Deck', icon: Presentation, color: '#00D4AA', desc: 'Produces branded slides with tokens, copy & visuals.' },
  { id: 'mvp_architecture', label: 'MVP Architecture', icon: Cpu, color: '#6C47FF', desc: 'Designs tech stack, architecture diagram & dev roadmap.' },
  { id: 'pivot_simulator', label: 'Pivot Simulator', icon: Shuffle, color: '#00D4AA', desc: 'Pressure-tests your strategy with three adversarial pivots.' },
];

const HERO_STEPS = [
  { icon: Lightbulb, label: 'Describe your idea', color: '#6C47FF' },
  { icon: Cpu, label: 'AI agents analyze', color: '#00D4AA' },
  { icon: LayoutDashboard, label: 'Get full package', color: '#6C47FF' },
  { icon: Users, label: 'Share & collaborate', color: '#00D4AA' },
];

const OUTPUTS = [
  { icon: BarChart3, label: 'Results Dashboard', desc: 'Market data, competitive landscape & opportunity scores.' },
  { icon: Presentation, label: 'Pitch Deck', desc: 'Investor-ready slides with branded visuals, exportable as PPTX.' },
  { icon: DollarSign, label: 'Financial Model', desc: 'Revenue projections, unit economics & cost breakdown.' },
  { icon: Target, label: 'Business Plan', desc: 'Problem, solution, GTM, pricing & risk analysis.' },
  { icon: Scale, label: 'Legal Checklist', desc: 'Compliance risks, entity structure & regulatory to-dos.' },
  { icon: Cpu, label: 'MVP Blueprint', desc: 'Tech stack, architecture diagram, timeline & cost estimate.' },
];

export default function HowItWorks() {
  const { navigate } = useRouter();
  const { authenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] font-sans">
      <GlobalNavbar />

      <main className="mx-auto max-w-5xl px-6 py-12 flex flex-col gap-24">

        {/* ───────────────────────────────────────────
            SECTION 1 — HERO / OVERVIEW
        ─────────────────────────────────────────── */}
        <section className="text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#888899] mb-4">
              <Rocket className="w-4 h-4 text-[#6C47FF]" /> How VentureForge works
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              From idea to investor-ready<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C47FF] to-[#00D4AA]">in minutes, not months</span>
            </h1>
            <p className="mt-4 text-[#888899] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Describe a startup idea in plain English. Ten AI agents research, plan, model,
              and package it into a validated, shareable startup kit — automatically.
            </p>
          </FadeIn>

          {/* hero flow */}
          <FadeIn delay={0.15}>
            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
              {HERO_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-4 md:gap-0">
                  <div className="flex flex-col items-center gap-3 w-40">
                    <div
                      className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center"
                      style={{ background: `${step.color}15` }}
                    >
                      <step.icon className="w-7 h-7" style={{ color: step.color }} />
                    </div>
                    <span className="text-sm font-bold text-white">{step.label}</span>
                  </div>
                  {i < HERO_STEPS.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-[#333344] hidden md:block mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ───────────────────────────────────────────
            SECTION 2 — AGENT PIPELINE
        ─────────────────────────────────────────── */}
        <section>
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white">The Agent Pipeline</h2>
              <p className="mt-3 text-[#888899] text-sm max-w-xl mx-auto">
                Ten specialized AI agents run in sequence. Validators can loop agents back
                for revision — no bad data passes through unchecked.
              </p>
            </div>
          </FadeIn>

          <div className="relative flex flex-col gap-0">
            {/* vertical connector line */}
            <div className="absolute left-[23px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#6C47FF] via-[#00D4AA] to-[#6C47FF] opacity-30" />

            {PIPELINE_NODES.map((node, i) => {
              const isLeft = i % 2 === 0;
              return (
                <FadeIn key={node.id} delay={i * 0.06}>
                  <div className={`relative flex items-start gap-4 md:gap-0 ${i > 0 ? 'mt-2' : ''}`}>
                    {/* desktop: alternating left/right */}
                    <div className={`hidden md:flex w-full items-center ${isLeft ? '' : 'flex-row-reverse'}`}>
                      {/* card */}
                      <div className={`w-[calc(50%-32px)] ${isLeft ? 'text-right pr-6' : 'text-left pl-6'}`}>
                        <div
                          className="inline-block rounded-xl border border-white/10 bg-[#111118] p-4 text-left transition-colors hover:border-white/20"
                          style={{ boxShadow: `3px 3px 0px ${node.color}33` }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <node.icon className="w-4 h-4 flex-shrink-0" style={{ color: node.color }} />
                            <span className="text-sm font-black text-white">{node.label}</span>
                          </div>
                          <p className="text-xs text-[#888899] leading-relaxed">{node.desc}</p>
                          {node.retry && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#FF6B6B] bg-[#FF6B6B]/10 px-2 py-0.5 rounded-full border border-[#FF6B6B]/20">
                              ↩ Retry loop
                            </div>
                          )}
                          {node.humanReview && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 rounded-full border border-[#FFB800]/20">
                              <Eye className="w-3 h-3" /> Human review checkpoint
                            </div>
                          )}
                        </div>
                      </div>

                      {/* center dot */}
                      <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#0A0A0F] z-10 flex-shrink-0"
                        style={{ borderColor: node.color }}>
                        <span className="text-xs font-black" style={{ color: node.color }}>{i + 1}</span>
                      </div>

                      {/* spacer */}
                      <div className="w-[calc(50%-32px)]" />
                    </div>

                    {/* mobile: all left-aligned */}
                    <div className="flex md:hidden items-start gap-4">
                      <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#0A0A0F] z-10 flex-shrink-0"
                        style={{ borderColor: node.color }}>
                        <span className="text-xs font-black" style={{ color: node.color }}>{i + 1}</span>
                      </div>
                      <div
                        className="flex-1 rounded-xl border border-white/10 bg-[#111118] p-4"
                        style={{ boxShadow: `3px 3px 0px ${node.color}33` }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <node.icon className="w-4 h-4 flex-shrink-0" style={{ color: node.color }} />
                          <span className="text-sm font-black text-white">{node.label}</span>
                        </div>
                        <p className="text-xs text-[#888899] leading-relaxed">{node.desc}</p>
                        {node.retry && (
                          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#FF6B6B] bg-[#FF6B6B]/10 px-2 py-0.5 rounded-full border border-[#FF6B6B]/20">
                            ↩ Retry loop
                          </div>
                        )}
                        {node.humanReview && (
                          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 rounded-full border border-[#FFB800]/20">
                            <Eye className="w-3 h-3" /> Human review checkpoint
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}

            {/* terminal node */}
            <FadeIn delay={PIPELINE_NODES.length * 0.06}>
              <div className="relative flex items-start gap-4 md:gap-0 mt-2">
                <div className="hidden md:flex w-full justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-[#00D4AA] flex items-center justify-center bg-[#00D4AA]/10 z-10">
                    <Rocket className="w-5 h-5 text-[#00D4AA]" />
                  </div>
                </div>
                <div className="flex md:hidden items-start gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#00D4AA] flex items-center justify-center bg-[#00D4AA]/10 z-10 flex-shrink-0">
                    <Rocket className="w-5 h-5 text-[#00D4AA]" />
                  </div>
                  <div className="flex-1 flex items-center h-12">
                    <span className="text-sm font-black text-[#00D4AA]">Done — your startup package is ready</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ───────────────────────────────────────────
            SECTION 3 — 3-PANEL WORKSPACE
        ─────────────────────────────────────────── */}
        <section>
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white">Your Workspace</h2>
              <p className="mt-3 text-[#888899] text-sm max-w-xl mx-auto">
                The home dashboard is a 3-panel layout that keeps your ideas, the brainstorm input,
                and the community feed visible at all times.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* left panel */}
              <div className="rounded-xl border border-white/10 bg-[#111118] p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#888899]">
                  <PanelLeft className="w-4 h-4 text-[#6C47FF]" /> Your Ideas
                </div>
                <p className="text-sm text-[#888899] leading-relaxed">
                  Every idea you've brainstormed lives here. Click any past project to jump
                  back into its analysis or continue where you left off.
                </p>
                <div className="mt-auto space-y-2">
                  <div className="rounded-lg bg-[#0A0A0F] border border-white/5 p-3">
                    <div className="text-xs font-bold text-white">HarvestHub</div>
                    <div className="mt-1 text-[10px] font-bold text-[#00D4AA] bg-[#00D4AA]/10 px-2 py-0.5 rounded inline-block">COMPLETE</div>
                  </div>
                  <div className="rounded-lg bg-[#0A0A0F] border border-white/5 p-3">
                    <div className="text-xs font-bold text-white">Propelio</div>
                    <div className="mt-1 text-[10px] font-bold text-[#6C47FF] bg-[#6C47FF]/10 px-2 py-0.5 rounded inline-block">RUNNING</div>
                  </div>
                </div>
              </div>

              {/* middle panel */}
              <div className="rounded-xl border-2 border-[#6C47FF]/30 bg-[#111118] p-5 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#6C47FF]/5 to-transparent pointer-events-none" />
                <div className="relative flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#888899]">
                  <Lightbulb className="w-4 h-4 text-[#00D4AA]" /> Brainstorm
                </div>
                <p className="relative text-sm text-[#888899] leading-relaxed">
                  Type a startup idea in plain English and press Enter. The AI pipeline
                  kicks off immediately — you'll see each agent's progress in real time.
                </p>
                <div className="relative mt-auto">
                  <div className="rounded-lg bg-[#0A0A0F] border border-[#333344] px-4 py-3 text-sm text-[#555566]">
                    Describe your startup idea...
                  </div>
                </div>
              </div>

              {/* right panel */}
              <div className="rounded-xl border border-white/10 bg-[#111118] p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#888899]">
                  <PanelRight className="w-4 h-4 text-[#00D4AA]" /> Community Feed
                </div>
                <p className="text-sm text-[#888899] leading-relaxed">
                  See what other founders are building. React, comment, and express interest —
                  all without leaving the workspace.
                </p>
                <div className="mt-auto space-y-2">
                  <div className="rounded-lg bg-[#0A0A0F] border border-white/5 p-3 flex items-center justify-between">
                    <div className="text-xs font-bold text-white">MediSync</div>
                    <div className="text-[10px] text-[#888899]">👍 3 💬 1</div>
                  </div>
                  <div className="rounded-lg bg-[#0A0A0F] border border-white/5 p-3 flex items-center justify-between">
                    <div className="text-xs font-bold text-white">CarbonTrail</div>
                    <div className="text-[10px] text-[#888899]">👍 1 💬 0</div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ───────────────────────────────────────────
            SECTION 4 — OUTPUT SHOWCASE
        ─────────────────────────────────────────── */}
        <section>
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white">What You Get</h2>
              <p className="mt-3 text-[#888899] text-sm max-w-xl mx-auto">
                Every analysis produces six deliverables — each generated from your specific
                idea, not boilerplate templates.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OUTPUTS.map((out, i) => (
              <FadeIn key={out.label} delay={i * 0.06}>
                <div className="rounded-xl border border-white/10 bg-[#111118] p-5 hover:border-[#6C47FF]/40 transition-colors group h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center mb-3 group-hover:bg-[#6C47FF]/20 transition-colors">
                    <out.icon className="w-5 h-5 text-[#6C47FF]" />
                  </div>
                  <div className="text-sm font-black text-white mb-1">{out.label}</div>
                  <p className="text-xs text-[#888899] leading-relaxed">{out.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ───────────────────────────────────────────
            SECTION 5 — COMMUNITY LOOP
        ─────────────────────────────────────────── */}
        <section>
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white">The Community Loop</h2>
              <p className="mt-3 text-[#888899] text-sm max-w-xl mx-auto">
                Validation doesn't stop at AI. Publish your idea to get feedback
                from real founders — and discover ideas you can help build.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-[#111118] p-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
                {[
                  { icon: Rocket, label: 'Publish', desc: 'Share your validated idea to the community board', color: '#6C47FF' },
                  { icon: MessageSquare, label: 'Discuss', desc: 'Get comments, questions & advice from other founders', color: '#00D4AA' },
                  { icon: ThumbsUp, label: 'React', desc: 'Upvote, "would use", or express co-founder interest', color: '#6C47FF' },
                  { icon: GitFork, label: 'Fork', desc: 'Remix someone else\'s idea with your own twist', color: '#00D4AA' },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2 w-32">
                      <div
                        className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center"
                        style={{ background: `${step.color}15` }}
                      >
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                      </div>
                      <span className="text-sm font-black text-white">{step.label}</span>
                      <p className="text-[11px] text-[#888899] text-center leading-snug">{step.desc}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-[#333344] hidden md:block flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* loop-back arrow */}
              <div className="hidden md:flex justify-center mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#888899]">
                  <div className="w-40 h-px bg-gradient-to-r from-transparent via-[#6C47FF]/30 to-transparent" />
                  <span className="text-[#6C47FF]">↩ loop back</span>
                  <div className="w-40 h-px bg-gradient-to-r from-transparent via-[#6C47FF]/30 to-transparent" />
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ───────────────────────────────────────────
            SECTION 6 — CTA
        ─────────────────────────────────────────── */}
        <section className="text-center pb-12">
          <FadeIn>
            <h2 className="text-3xl font-black text-white">Ready to build?</h2>
            <p className="mt-3 text-[#888899] text-sm max-w-md mx-auto">
              Go from "what if" to a validated startup package in under ten minutes.
            </p>
            <button
              onClick={() => navigate(authenticated ? 'home' : 'landing')}
              className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-sm rounded-xl hover:bg-transparent hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] hover:shadow-[2px_2px_0px_#00D4AA] transition-all"
            >
              <Lightbulb className="w-4 h-4" />
              Brainstorm your first idea
              <ArrowRight className="w-4 h-4" />
            </button>
          </FadeIn>
        </section>
      </main>
    </div>
  );
}
