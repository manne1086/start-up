import { AlertOctagon, RotateCcw, ArrowRight, Eye } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';
import { useGeneration } from '../generation';
import { useRouter } from '../router';

export default function ErrorState() {
  const { navigate } = useRouter();
  const { error, clearRun } = useGeneration();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />
      
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
        
        <div className="w-16 h-16 bg-[#FF4D4F]/10 border-2 border-[#FF4D4F] flex items-center justify-center mb-6 shadow-[4px_4px_0px_rgba(255,77,79,0.3)]">
          <AlertOctagon className="w-8 h-8 text-[#FF4D4F]" />
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Agent Failure</h1>
        <p className="text-[#888899] font-medium mb-8">
          {error ?? 'The generation process was interrupted during Step 3.'}
        </p>

        <div className="w-full bg-[#111118] border-2 border-[#111118] text-left p-6 mb-8 flex flex-col gap-4">
          <div>
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-1">Failed Component</div>
            <div className="text-lg font-bold text-white">Financial Engineering Agent</div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-1">Error Type</div>
            <div className="text-sm font-mono text-[#FF4D4F] bg-[#0A0A0F] p-3 border border-[#FF4D4F]/20">
              API Rate Limit — OpenAI quota exceeded [HTTP 429]
            </div>
          </div>
          <div className="pt-4 border-t border-[#0A0A0F]">
            <p className="text-sm text-[#00D4AA] font-medium">
              ✅ Your progress up to Step 2 (Business Planning) has been saved.
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate('progress')}
            className="flex-1 py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-sm hover:bg-[#0A0A0F] hover:text-[#6C47FF] transition-all shadow-[4px_4px_0px_transparent] hover:shadow-[4px_4px_0px_#00D4AA] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Retry from Step 3
          </button>
          
          <button 
            onClick={() => navigate('review')}
            className="flex-1 py-3 bg-transparent border-2 border-[#00D4AA] text-[#00D4AA] font-bold text-sm hover:bg-[#00D4AA] hover:text-[#0A0A0F] transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" /> View Partial Results
          </button>
        </div>
        
        <button 
          onClick={() => { clearRun(); navigate('landing'); }}
          className="mt-6 text-sm font-bold text-[#888899] hover:text-white transition-colors"
        >
          Start Over
        </button>

      </main>
    </div>
  );
}
