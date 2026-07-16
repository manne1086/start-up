import { ArrowRight, BarChart3, PieChart, Scale, Presentation, Cpu, RefreshCw, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import NeuralBrainBackground from './NeuralBrainBackground';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function Landing() {
  const { navigate } = useRouter();
  const { startGeneration, status, backendState, error } = useGeneration();
  const [idea, setIdea] = useState('');
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
    await startGeneration(idea);
    navigate('progress');
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

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans selection:bg-[#6C47FF] selection:text-white">
      <NeuralBrainBackground />
      <nav className="w-full h-[64px] px-6 flex justify-between items-center z-10 sticky top-0 bg-[#0A0A0F]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#6C47FF] p-1.5 border-2 border-[#0A0A0F] shadow-[2px_2px_0px_#00D4AA]">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">VentureForge</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold">
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
            className="text-[#6C47FF] hover:text-[#00D4AA] transition-colors flex items-center gap-1"
          >
            Launch Idea <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center text-center mt-20 px-4 w-full max-w-5xl mx-auto">
        <h1 className="text-[56px] font-black mb-6 tracking-tight text-white leading-tight">
          From Idea to Investor-Ready Startup in <span className="text-[#6C47FF]">Minutes</span>
        </h1>
        <p className="text-[18px] text-[#888899] mb-12 max-w-3xl font-medium leading-relaxed">
          Multi-agent AI that does the market research, financials, legal,
          and pitch deck - autonomously.
        </p>

        <div className="w-full max-w-5xl relative group">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your startup idea..."
            className="w-full h-[72px] bg-[#111118] border-2 border-[#6C47FF] text-[#F0F0F0] placeholder-[#888899] px-6 py-3.5 focus:outline-none focus:shadow-[6px_6px_0px_#00D4AA] transition-all resize-none text-lg font-medium shadow-[4px_4px_0px_#6C47FF] rounded-full"
          />

          <div className="flex flex-wrap justify-center gap-4 mt-6">
              {['Research-led', 'SaaS', 'AI-native'].map((tag) => (
              <button
                key={tag}
                className="border-2 border-[#6C47FF]/30 bg-[#111118] px-5 py-1.5 text-sm font-bold text-[#888899] hover:border-[#00D4AA] hover:text-[#00D4AA] transition-colors shadow-[2px_2px_0px_transparent] hover:shadow-[2px_2px_0px_#00D4AA] rounded-full"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="mt-12 w-full max-w-4xl flex justify-center items-center gap-3 px-8 py-5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-xl hover:bg-[#111118] hover:text-[#6C47FF] hover:border-[#6C47FF] shadow-[6px_6px_0px_#6C47FF] hover:shadow-[6px_6px_0px_#00D4AA] hover:-translate-y-1 transition-all group rounded-full"
        >
          {status === 'running' ? 'GENERATING...' : 'GENERATE STARTUP PACKAGE'}
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>

        {(backendState?.status === 'failed' || error) && (
          <div className="mt-6 w-full max-w-4xl border border-[#FF4D4F]/40 bg-[#FF4D4F]/10 text-[#FF4D4F] px-4 py-3 text-sm font-medium text-left">
            {error ?? 'Generation failed. Try again.'}
          </div>
        )}

        <section className="w-full max-w-4xl mt-24 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-full border-2 border-[#111118] bg-[#111118] p-6 text-left text-[#888899]">
              Generate a startup package to populate market research, financials, compliance, pitch, MVP, and pivot modules here.
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 bg-[#0A0A0F] border-t border-[#6C47FF]/20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[#888899] font-medium text-sm">Built with LangGraph + FastAPI</p>
        </div>
      </footer>
    </div>
  );
}
