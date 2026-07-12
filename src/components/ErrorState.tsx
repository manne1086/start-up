import { AlertOctagon, RotateCcw, Eye, ArrowLeft, Terminal, AlertTriangle, ShieldAlert } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';
import { useGeneration } from '../generation';
import { useRouter } from '../router';

export default function ErrorState() {
  const { navigate } = useRouter();
  const { error, clearRun } = useGeneration();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans overflow-hidden">
      <GlobalNavbar />
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF4D4F]/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="px-6 py-6 absolute top-[64px] left-0 z-10 w-full flex justify-between">
        <button onClick={() => navigate('projects')} className="flex items-center gap-2 text-xs font-bold text-[#888899] hover:text-white uppercase tracking-widest transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </button>
      </div>
      
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10 animate-fadeInUp">
        
        {/* Error Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#FF4D4F]/20 blur-xl rounded-full"></div>
          <div className="w-20 h-20 bg-[#111118] border-2 border-[#FF4D4F]/50 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(255,77,79,0.2)]">
            <ShieldAlert className="w-10 h-10 text-[#FF4D4F]" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Pipeline Interrupted</h1>
        <p className="text-lg text-[#888899] font-medium mb-10 max-w-xl">
          {error ?? 'The generation process encountered a critical failure during execution.'}
        </p>

        {/* Error Details Card */}
        <div className="w-full bg-[#111118]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-left p-6 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF4D4F] to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Component
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF4D4F]"></div>
                Financial Engineering Agent
              </div>
            </div>
            
            <div>
              <div className="text-[10px] font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#6C47FF]" /> Diagnostic
              </div>
              <div className="text-xs font-mono text-[#FF4D4F] bg-[#FF4D4F]/10 border border-[#FF4D4F]/20 p-2.5 rounded-lg flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>API Rate Limit — OpenAI quota exceeded [HTTP 429]</span>
              </div>
            </div>
          </div>
          
          <div className="pt-5 border-t border-white/5 bg-gradient-to-r from-[#00D4AA]/5 to-transparent -mx-6 px-6 -mb-6 pb-6">
            <p className="text-sm text-[#00D4AA] font-semibold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#00D4AA]/20 flex items-center justify-center text-[#00D4AA] text-xs">✓</span>
              Your progress up to Step 2 (Business Planning) has been saved.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => navigate('progress')}
            className="py-3.5 px-8 bg-[#6C47FF] border border-[#6C47FF] rounded-xl text-white font-bold text-sm hover:bg-[#5a3ae0] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(108,71,255,0.4)]"
          >
            <RotateCcw className="w-4 h-4" /> Retry from Step 3
          </button>
          
          <button 
            onClick={() => navigate('review')}
            className="py-3.5 px-8 bg-transparent border border-[#00D4AA]/50 rounded-xl text-[#00D4AA] font-bold text-sm hover:bg-[#00D4AA]/10 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" /> View Partial Results
          </button>
        </div>
        
        <button 
          onClick={() => { clearRun(); navigate('landing'); }}
          className="mt-8 text-xs font-bold text-[#888899] hover:text-white uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-0.5"
        >
          Abandon & Start Over
        </button>

      </main>
    </div>
  );
}
