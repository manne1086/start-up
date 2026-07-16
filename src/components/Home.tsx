import { useState } from 'react';
import { ArrowRight, Sparkles, Clock, FolderOpen } from 'lucide-react';
import { useRouter } from '../router';
import { useGeneration } from '../generation';
import GlobalNavbar from './GlobalNavbar';
import NeuralBrainBackground from './NeuralBrainBackground';

const SUGGESTIONS = [
  'AI-powered resume builder for job seekers',
  'SaaS analytics dashboard for D2C brands',
  'Marketplace connecting local farmers to restaurants',
  'EdTech platform for competitive exam prep',
  'AI copilot for real estate agents',
];

export default function Home() {
  const { navigate } = useRouter();
  const { startGeneration, status, error } = useGeneration();
  const [idea, setIdea] = useState('');
  const [toastError, setToastError] = useState('');

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    try {
      await startGeneration(idea);
      navigate('progress');
    } catch (err: any) {
      setToastError(err?.message ?? 'Failed to start generation.');
      setTimeout(() => setToastError(''), 5000);
    }
  };

  const displayError = toastError || error;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans selection:bg-[#6C47FF] selection:text-white">
      <NeuralBrainBackground />
      <GlobalNavbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-4xl mx-auto relative z-[1]">
        
        {/* Greeting */}
        <div className="text-center mb-10 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-bold text-[#888899] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#6C47FF]" />
            Ready to build something amazing
          </div>
          <h1 className="text-[44px] md:text-[52px] font-black tracking-tight text-white leading-[1.15]">
            What are you <span className="bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] bg-clip-text text-transparent">building</span>?
          </h1>
        </div>
        
        {/* Input */}
        <div className="w-full max-w-3xl relative animate-fadeInUp delay-200">
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-[#6C47FF] via-[#00D4AA] to-[#6C47FF] opacity-30 group-focus-within:opacity-70 blur-sm transition-opacity duration-500 animate-gradientShift" style={{ backgroundSize: '200% 50%' }} />
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. An AI-powered resume builder that helps job seekers craft ATS-optimized resumes..."
              maxLength={500}
              className="relative w-full h-[130px] bg-[#111118]/95 text-[#F0F0F0] placeholder-[#555566] px-10 py-5 focus:outline-none resize-none text-base font-medium rounded-full border border-transparent z-[1] leading-relaxed"
              style={{ backdropFilter: 'blur(20px)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-[#555566] flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono">Enter</kbd>
              to generate
            </span>
            <span className={`text-xs font-mono transition-colors ${idea.length > 450 ? 'text-amber-500' : 'text-[#555566]'}`}>{idea.length}/500</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleGenerate}
          disabled={!idea.trim() || status === 'running'}
          className="mt-8 group px-12 py-4 rounded-full bg-gradient-to-r from-[#6C47FF] to-[#8B6AFF] text-white font-black text-base uppercase tracking-wider btn-shimmer hover:shadow-[0_8px_32px_rgba(108,71,255,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-3 animate-fadeInUp delay-300 relative overflow-hidden"
        >
          {status === 'running' ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              Launching...
            </>
          ) : (
            <>
              Start Building
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* Error */}
        {displayError && (
          <div className="mt-4 w-full max-w-3xl animate-fadeInUp">
            <div className="glass px-5 py-3 rounded-xl border border-[#FF4D4F]/30 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FF4D4F] animate-pulse shrink-0" />
              <span className="text-sm font-semibold text-[#FF4D4F]">{displayError}</span>
            </div>
          </div>
        )}

        {/* Quick Suggestions */}
        <div className="mt-12 w-full max-w-3xl animate-fadeInUp delay-400">
          <h3 className="text-xs font-bold text-[#555566] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Try an example
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => setIdea(s)}
                className="glass px-4 py-2 rounded-full text-sm font-medium text-[#888899] hover:text-[#00D4AA] hover:border-[#00D4AA]/30 transition-all duration-300"
                style={{ animationDelay: `${500 + i * 80}ms` }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 flex items-center gap-6 animate-fadeInUp delay-500">
          <button
            onClick={() => navigate('projects')}
            className="flex items-center gap-2 text-sm font-semibold text-[#888899] hover:text-white transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            My Projects
          </button>
          <div className="w-px h-4 bg-[#888899]/20" />
          <button
            onClick={() => navigate('mvp')}
            className="flex items-center gap-2 text-sm font-semibold text-[#888899] hover:text-white transition-colors"
          >
            <Clock className="w-4 h-4" />
            How It Works
          </button>
        </div>
      </main>
    </div>
  );
}
