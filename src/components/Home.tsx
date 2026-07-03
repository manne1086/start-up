import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '../router';
import { useGeneration } from '../generation';
import GlobalNavbar from './GlobalNavbar';
import NeuralBrainBackground from './NeuralBrainBackground';

export default function Home() {
  const { navigate } = useRouter();
  const { startGeneration, status, error } = useGeneration();
  const [idea, setIdea] = useState('');

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    await startGeneration(idea);
    navigate('progress');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans selection:bg-[#6C47FF] selection:text-white">
      <NeuralBrainBackground />
      <GlobalNavbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-4xl mx-auto">
        <h1 className="text-[48px] font-black mb-8 tracking-tight text-white text-center leading-tight">
          What are you building?
        </h1>
        
        <div className="w-full max-w-5xl relative group">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your startup idea..."
            className="w-full h-[60px] bg-[#111118] border-2 border-[#6C47FF] text-[#F0F0F0] placeholder-[#888899] px-5 py-2.5 focus:outline-none focus:shadow-[4px_4px_0px_#00D4AA] transition-all resize-none text-lg font-medium shadow-[4px_4px_0px_#6C47FF]"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!idea.trim() || status === 'running'}
          className="mt-6 w-fit self-center flex justify-center items-center gap-3 px-8 py-4 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-lg hover:bg-[#111118] hover:text-[#6C47FF] hover:border-[#6C47FF] shadow-[4px_4px_0px_#6C47FF] hover:shadow-[4px_4px_0px_#00D4AA] hover:-translate-y-1 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'running' ? 'STARTING...' : 'START BUILDING'}
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>

        {error && (
          <div className="mt-6 w-full border border-[#FF4D4F]/40 bg-[#FF4D4F]/10 text-[#FF4D4F] px-4 py-3 text-sm font-medium text-left">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
