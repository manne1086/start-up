import { ArrowRight, BarChart3, PieChart, Scale, Presentation, Cpu, RefreshCw, Rocket, Sparkles, Shield, TrendingUp, Zap, Target, Brain } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import NeuralBrainBackground from './NeuralBrainBackground';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const FEATURES = [
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
  const [idea, setIdea] = useState('');
  const [toastError, setToastError] = useState('');
  const [authState, setAuthState] = useState<{
    loading: boolean;
    authenticated: boolean;
    user: null | { name?: string; email?: string; picture?: string };
  }>({
    loading: true,
    authenticated: false,
    user: null,
  });

  const handleSignIn = () => {
    window.location.href = `${API_URL}/api/auth/google/login`;
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

  const refreshAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await response.json();
      setAuthState({
        loading: false,
        authenticated: Boolean(data.authenticated),
        user: data.user ?? null,
      });
    } catch {
      setAuthState({ loading: false, authenticated: false, user: null });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get('auth');

    if (auth === 'success' || auth === 'error') {
      window.history.replaceState({}, '', window.location.pathname);
    }

    void refreshAuth();
  }, []);

  useEffect(() => {
    if (!authState.loading && authState.authenticated) {
      navigate('home');
    }
  }, [authState.loading, authState.authenticated, navigate]);

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    await refreshAuth();
  };

  // Show error from generation context
  useEffect(() => {
    if (backendState?.status === 'failed' || error) {
      setToastError(error ?? 'Generation failed. Try again.');
      setTimeout(() => setToastError(''), 5000);
    }
  }, [backendState?.status, error]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans selection:bg-[#6C47FF] selection:text-white overflow-x-hidden">
      <NeuralBrainBackground />

      {/* Toast Error */}
      {toastError && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slideInRight">
          <div className="glass-strong px-5 py-3 flex items-center gap-3 rounded-2xl border border-[#FF4D4F]/30 shadow-2xl max-w-md">
            <div className="w-2 h-2 rounded-full bg-[#FF4D4F] shrink-0 animate-pulse" />
            <span className="text-sm font-semibold text-[#FF4D4F]">{toastError}</span>
            <button onClick={() => setToastError('')} className="ml-auto text-[#888899] hover:text-white text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="w-full h-[64px] px-6 flex justify-between items-center z-10 sticky top-0 bg-transparent pt-4">
        <div className="flex items-center gap-3 animate-fadeInDown">
          <div className="bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] p-2 rounded-xl shadow-lg">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">VentureForge</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold animate-fadeInDown delay-200">
          {authState.loading ? (
            <span className="text-[#888899]">Checking session...</span>
          ) : authState.authenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-[#00D4AA]">
                {authState.user?.name ?? authState.user?.email ?? 'Signed in'}
              </span>
              <button
                onClick={handleLogout}
                className="text-[#888899] hover:text-white transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="text-[#888899] hover:text-white transition-colors"
            >
              Sign in
            </button>
          )}
          <button
            onClick={() => navigate('home')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C47FF] to-[#8B6AFF] text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(108,71,255,0.4)] transition-all duration-300 flex items-center gap-2"
          >
            Launch Idea <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="flex-1 flex flex-col items-center text-center px-4 w-full max-w-6xl mx-auto relative z-[1]">
        
        {/* Badge */}
        <div className="mt-20 mb-8 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#6C47FF]/20 text-sm font-semibold text-[#C9BEFF]">
            <Sparkles className="w-4 h-4 text-[#6C47FF]" />
            Multi-Agent AI Platform
            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#6C47FF]/20 text-[#6C47FF] text-xs font-bold">NEW</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[52px] md:text-[64px] font-black mb-6 tracking-tight leading-[1.1] animate-fadeInUp delay-100">
          <span className="text-white">From Idea to Investor-Ready</span>
          <br />
          <span className="text-white">Startup in </span>
          <span className="bg-gradient-to-r from-[#6C47FF] via-[#8B6AFF] to-[#00D4AA] bg-clip-text text-transparent animate-gradientShift" style={{ backgroundSize: '200% 200%' }}>
            Minutes
          </span>
        </h1>

        <p className="text-lg text-[#888899] mb-12 max-w-2xl font-medium leading-relaxed animate-fadeInUp delay-200">
          Multi-agent AI that does the market research, financials, legal,
          and pitch deck — autonomously. Get a complete startup package ready for investors.
        </p>

        {/* ── Input Area ── */}
        <div className="w-full max-w-3xl relative animate-fadeInUp delay-300">
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-[#6C47FF] via-[#00D4AA] to-[#6C47FF] opacity-40 group-focus-within:opacity-80 blur-sm transition-opacity duration-500 animate-gradientShift" style={{ backgroundSize: '200% 200%' }} />
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your startup idea in detail..."
              maxLength={500}
              className="relative w-full h-[120px] bg-[#111118]/95 text-[#F0F0F0] placeholder-[#555566] px-10 py-6 focus:outline-none resize-none text-lg font-medium rounded-full border border-transparent z-[1]"
              style={{ backdropFilter: 'blur(20px)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex flex-wrap gap-2">
              {['Research-led', 'SaaS', 'AI-native', 'Marketplace', 'B2B'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setIdea((prev) => prev ? `${prev} [${tag}]` : tag)}
                  className="glass px-4 py-1.5 text-xs font-bold text-[#888899] hover:text-[#00D4AA] hover:border-[#00D4AA]/40 transition-all duration-300 rounded-full"
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
          className="mt-8 flex justify-center items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C47FF] to-[#8B6AFF] text-white font-black text-sm uppercase tracking-widest btn-shimmer hover:shadow-[0_8px_32px_rgba(108,71,255,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none animate-fadeInUp delay-400"
        >
          {status === 'running' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              RESEARCHING...
            </>
          ) : (
            <>
              RESEARCH
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* ── Features Grid ── */}
        <section className="w-full max-w-5xl mt-28 mb-16">
          <div className="text-center mb-12 animate-fadeInUp">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-bold uppercase tracking-[0.2em] text-[#888899] mb-4">
              <Zap className="w-3 h-3 text-[#6C47FF]" />
              What You Get
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Everything You Need to Launch</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group glass p-6 rounded-2xl card-hover cursor-default animate-fadeInUp"
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
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
        <section className="w-full max-w-4xl mb-28 animate-fadeInUp">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-bold uppercase tracking-[0.2em] text-[#888899] mb-4">
              <Target className="w-3 h-3 text-[#00D4AA]" />
              How It Works
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Three Steps to Your Startup</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-[42px] left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-[#6C47FF] via-[#00D4AA] to-[#6C47FF] opacity-30" />
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center animate-fadeInUp" style={{ animationDelay: `${300 + i * 150}ms` }}>
                <div className="w-[84px] h-[84px] rounded-2xl bg-gradient-to-br from-[#111118] to-[#0A0A0F] border border-white/10 flex items-center justify-center mb-5 relative z-[1]">
                  <span className="text-2xl font-black bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] bg-clip-text text-transparent">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-[#888899] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats / Social Proof ── */}
        <section className="w-full max-w-4xl mb-24 animate-fadeInUp">
          <div className="glass rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-around gap-8">
            {[
              { value: '6', label: 'AI Agents Working Together' },
              { value: '<5min', label: 'Average Generation Time' },
              { value: '100%', label: 'Investor-Ready Output' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] bg-clip-text text-transparent mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-[#888899]">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-8 relative z-[1]" style={{ borderTop: '1px solid rgba(108, 71, 255, 0.15)' }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
