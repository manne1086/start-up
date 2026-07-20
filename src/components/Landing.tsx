import { ArrowRight, BarChart3, PieChart, Scale, Presentation, Cpu, RefreshCw, Rocket, Sparkles, Shield, TrendingUp, Zap, Target, Brain, Users, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import NeuralBrainBackground from './NeuralBrainBackground';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const CORE_FEATURES = [
  { icon: Cpu, title: 'AI Agents', desc: 'Multi-agent AI pipeline that researches, analyzes, and generates in parallel.', color: '#6C47FF' },
  { icon: TrendingUp, title: 'Market Intelligence', desc: 'Deep-dive competitor analysis, TAM/SAM/SOM sizing, and live web search.', color: '#00D4AA' },
  { icon: FileText, title: 'Investor-Ready Outputs', desc: '5-year financials, pitch decks, legal docs, and complete startup packages.', color: '#F59E0B' },
  { icon: Users, title: 'Collaborate & Publish', desc: 'Share ideas with founders, get feedback, and publish to the community.', color: '#3B82F6' },
];

const ALL_FEATURES = [
  { icon: BarChart3, title: 'Market Research', desc: 'Deep-dive competitor analysis, TAM/SAM/SOM sizing, and gap identification powered by live web search.', color: '#6C47FF' },
  { icon: PieChart, title: 'Financial Model', desc: '5-year projections with NPV, IRR, payback period and automated sensitivity analysis.', color: '#00D4AA' },
  { icon: Scale, title: 'Legal & Compliance', desc: 'GDPR readiness, entity recommendations, IP strategy and regulatory checklists.', color: '#FF6B6B' },
  { icon: Presentation, title: 'Pitch Deck', desc: 'Investor-ready slides with brand system, editable layouts and .pptx export.', color: '#F59E0B' },
  { icon: Cpu, title: 'MVP Architecture', desc: 'Interactive system diagrams, tech stack recommendations and development roadmap.', color: '#3B82F6' },
  { icon: RefreshCw, title: 'Pivot Simulator', desc: 'Adversarial analysis stress-testing your model with alternative pivot strategies.', color: '#EC4899' },
];

const STEPS = [
  { num: '01', title: 'Describe Your Idea', desc: 'Enter a plain-language description of what you want to build.' },
  { num: '02', title: 'AI Agents Research', desc: 'Multi-agent pipeline researches market, financials, legal, and architecture.' },
  { num: '03', title: 'Get Your Package', desc: 'Download investor-ready pitch deck, financial model, and full startup package.' },
];

export default function Landing() {
  const { navigate } = useRouter();
  const { startGeneration, status, backendState, error } = useGeneration();
  const { loading: authLoading, authenticated, user: authUser, logout } = useAuth();
  const [idea, setIdea] = useState('');
  const [toastError, setToastError] = useState('');

  const handleSignIn = () => {
    window.location.href = `${API_URL}/api/auth/oauth/google`;
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    try {
      await startGeneration(idea);
      navigate('progress');
    } catch (err: any) {
      setToastError(err?.message ?? 'Generation failed. Please try again.');
      setTimeout(() => setToastError(''), 5000);
    }
  };

  useEffect(() => {
    if (!authLoading && authenticated) {
      navigate('home');
    }
  }, [authLoading, authenticated, navigate]);

  const handleLogout = async () => {
    await logout();
  };

  // Show error from generation context
  useEffect(() => {
    if (backendState?.status === 'failed' || error) {
      setToastError(error ?? 'Generation failed. Try again.');
      setTimeout(() => setToastError(''), 5000);
    }
  }, [backendState?.status, error]);

  return (
    <div className="min-h-screen bg-[#07070C] text-[#F0F0F0] flex flex-col font-sans selection:bg-[#6C47FF] selection:text-white overflow-x-hidden">
      <NeuralBrainBackground />

      {/* Toast Error */}
      {toastError && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slideInRight">
          <div className="backdrop-blur-xl px-5 py-3 flex items-center gap-3 rounded-xl border border-[#FF6B6B]/30 bg-[#111118]/90 shadow-lg max-w-md">
            <div className="w-2 h-2 rounded-full bg-[#FF6B6B] shrink-0 animate-pulse" />
            <span className="text-sm font-semibold text-[#FF6B6B]">{toastError}</span>
            <button onClick={() => setToastError('')} className="ml-auto text-[#888899] hover:text-white text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="w-full h-16 px-8 flex justify-between items-center z-10 sticky top-0 bg-[#07070C]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-3 animate-fadeInDown">
          <div className="bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-2 rounded-lg">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">VentureForge</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold animate-fadeInDown">
          {authLoading ? (
            <span className="text-[#888899]">Checking session...</span>
          ) : authenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-[#E0E0EE]">
                {authUser?.name ?? authUser?.email ?? 'Signed in'}
              </span>
              <button
                onClick={handleLogout}
                className="text-[#888899] hover:text-[#E0E0EE] transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="text-[#888899] hover:text-[#E0E0EE] transition-colors"
            >
              Sign in
            </button>
          )}
          <button
            onClick={() => navigate('home')}
            className="px-6 py-2.5 rounded-lg bg-[#6C47FF] hover:bg-[#7D5AFF] text-white font-bold text-sm transition-all duration-200 hover:shadow-[2px_2px_0px_#00D4AA] flex items-center gap-2"
          >
            Launch Idea <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="flex-1 flex flex-col items-center text-center px-8 w-full max-w-6xl mx-auto relative z-[1]">

        {/* Badge */}
        <div className="mt-24 mb-8 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-sm font-bold text-[#E0E0EE]">
            <Sparkles className="w-4 h-4 text-[#6C47FF]" />
            AI-Powered Startup Brainstorming
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-[1.1] animate-fadeInUp delay-100">
          <span className="text-white">Turn Ideas into</span>
          <br />
          <span className="bg-gradient-to-r from-[#6C47FF] via-[#8B6AFF] to-[#00D4AA] bg-clip-text text-transparent">Investor-Ready Plans</span>
        </h1>

        <p className="text-lg text-[#E0E0EE] mb-16 max-w-2xl font-medium leading-relaxed animate-fadeInUp delay-200">
          Get market research, financial models, pitch decks, and MVP blueprints — all in minutes.
        </p>

        {/* ── Input Area ── */}
        <div className="w-full max-w-3xl relative animate-fadeInUp delay-300 mb-8">
          <div className="relative group">
            <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-[#6C47FF] via-[#00D4AA] to-[#6C47FF] opacity-30 group-focus-within:opacity-60 blur-lg transition-opacity duration-500" />
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your startup idea..."
              maxLength={500}
              className="relative w-full h-28 bg-[#111118] text-[#F0F0F0] placeholder-[#555566] px-6 py-4 focus:outline-none resize-none text-base font-medium rounded-xl border border-white/[0.08] focus:border-[#6C47FF]/40 transition-all duration-200"
              style={{ backdropFilter: 'blur(20px)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex flex-wrap gap-2">
              {['Research-led', 'SaaS', 'AI-native', 'Marketplace', 'B2B'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setIdea((prev) => prev ? `${prev} [${tag}]` : tag)}
                  className="px-3 py-1.5 text-xs font-bold text-[#888899] hover:text-[#00D4AA] bg-[#111118] border border-white/[0.06] hover:border-[#00D4AA]/40 transition-all duration-200 rounded-lg"
                >
                  {tag}
                </button>
              ))}
            </div>
            <span className="text-xs text-[#555566] font-mono">{idea.length}/500</span>
          </div>
        </div>

        {/* ── CTA Button ── */}
        <button
          onClick={handleGenerate}
          disabled={!idea.trim() || status === 'running'}
          className="flex justify-center items-center gap-3 px-8 py-3 rounded-lg bg-[#6C47FF] hover:bg-[#7D5AFF] text-white font-black text-sm uppercase tracking-wide transition-all duration-200 hover:shadow-[4px_4px_0px_#00D4AA] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none animate-fadeInUp delay-400"
        >
          {status === 'running' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              RESEARCHING...
            </>
          ) : (
            <>
              Research My Idea
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* ── Core Features Highlight ── */}
        <section className="w-full max-w-5xl mt-32 mb-32">
          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-xs font-bold uppercase tracking-wider text-[#E0E0EE] mb-4">
              <Zap className="w-3 h-3 text-[#00D4AA]" />
              Core Capabilities
            </div>
            <h2 className="text-4xl md:text-4xl font-black text-white tracking-tight mb-4">What Makes VentureForge Different</h2>
            <p className="text-lg text-[#E0E0EE] max-w-2xl mx-auto">Powerful AI agents working together to turn your idea into a complete startup package.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {CORE_FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-[#111118] border border-white/[0.06] hover:border-[#6C47FF]/30 p-6 rounded-xl transition-all duration-200 cursor-default animate-fadeInUp"
                  style={{ animationDelay: `${150 + i * 100}ms` }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#888899] leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Full Features Grid ── */}
        <section className="w-full max-w-5xl mb-32">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-3xl font-black text-white tracking-tight mb-4">Complete Feature Suite</h2>
            <p className="text-base text-[#E0E0EE] max-w-2xl mx-auto">Six AI agents analyzing every aspect of your startup idea.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ALL_FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-[#0D0D14] border border-white/[0.06] hover:border-white/[0.12] p-6 rounded-xl transition-all duration-200 cursor-default animate-fadeInUp"
                  style={{ animationDelay: `${250 + i * 80}ms` }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${feature.color}12`, border: `1px solid ${feature.color}25` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#888899] leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="w-full max-w-4xl mb-32 animate-fadeInUp">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-xs font-bold uppercase tracking-wider text-[#E0E0EE] mb-4">
              <Target className="w-3 h-3 text-[#00D4AA]" />
              Process
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-4">Three Steps to Your Startup</h2>
            <p className="text-base text-[#E0E0EE]">Simple process, powerful results</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-[50px] left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-[#6C47FF]/30 via-[#00D4AA]/30 to-[#6C47FF]/30" />
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center animate-fadeInUp" style={{ animationDelay: `${300 + i * 150}ms` }}>
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#111118] to-[#0D0D14] border border-white/[0.08] flex items-center justify-center mb-6 relative z-[1]">
                  <span className="text-3xl font-black bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] bg-clip-text text-transparent">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-[#888899] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats / Social Proof ── */}
        <section className="w-full max-w-4xl mb-32 animate-fadeInUp">
          <div className="bg-[#0D0D14] border border-white/[0.06] rounded-2xl p-12 flex flex-col md:flex-row items-center justify-around gap-12">
            {[
              { value: '6', label: 'AI Agents' },
              { value: '<5min', label: 'To Complete Startup Package' },
              { value: '∞', label: 'Possible Ideas' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] bg-clip-text text-transparent mb-3">{stat.value}</div>
                <div className="text-sm font-medium text-[#E0E0EE]">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-8 px-8 relative z-[1] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-1.5 rounded-lg">
              <Rocket className="text-white w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">VentureForge</span>
          </div>
          <p className="text-[#555566] font-medium text-sm">Built with LangGraph + FastAPI + Gemini</p>
          <div className="flex items-center gap-6 text-xs font-semibold text-[#555566]">
            <span className="hover:text-[#888899] transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-[#888899] transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-[#888899] transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
