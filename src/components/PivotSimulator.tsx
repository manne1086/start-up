import { AlertTriangle, ArrowRight, RefreshCw, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useGeneration } from '../generation';
import GlobalNavbar from './GlobalNavbar';
import { useRouter } from '../router';

export default function PivotSimulator() {
  const { navigate } = useRouter();
  const { backendState } = useGeneration();
  const [showLog, setShowLog] = useState(false);

  const pivots = backendState?.pivots?.length
    ? backendState.pivots
    : [
        { id: 1, name: 'Pivot options pending', rationale: 'Run a generation to create live pivot paths.', impact: '+₹0', impactType: 'positive', adjusted_tam: '$0' },
      ];

  const transcript = backendState?.agent_logs?.length
    ? backendState.agent_logs.slice(-8).map((log) => ({
        agent: log.agent,
        message: log.message,
        status: log.status,
      }))
    : [
        { agent: 'Pivot Simulator', status: 'info', message: 'Waiting for backend pivot analysis.' },
      ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-10">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Pivot Simulator — {backendState?.startup_name || backendState?.idea || 'Live Startup Data'}
          </h1>
          <p className="text-[#888899] font-medium">Stress-test your model against market reality</p>
        </div>

        {/* Warning Card */}
        <div className="w-full border-2 border-amber-500 bg-amber-500/5 p-6 shadow-[6px_6px_0px_rgba(234,179,8,0.2)] mb-10 flex gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <h2 className="text-lg font-black text-amber-500 uppercase tracking-wide mb-2">Adversarial Agent Finding</h2>
            <p className="text-[#F0F0F0] font-medium leading-relaxed">
              {backendState?.pivots?.length
                ? 'Backend pivot analysis generated live alternatives based on the current startup state.'
                : 'Run a generation to surface adversarial findings from the backend.'}
              <span className="block mt-2 font-bold text-amber-500">{pivots.length} pivot strategy(ies) available.</span>
            </p>
          </div>
        </div>

        {/* Pivot Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {pivots.map((pivot, index) => (
            <div key={pivot.id ?? index} className="border-2 border-[#111118] bg-[#111118] p-6 flex flex-col hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all group">
              <h3 className="text-xl font-black text-white mb-3">{pivot.name ?? 'Pivot option'}</h3>
              <p className="text-sm text-[#888899] leading-relaxed mb-6 flex-1">
                {pivot.rationale ?? 'Backend pivot rationale pending.'}
              </p>
              
              <div className="bg-[#0A0A0F] border border-[#111118] p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#888899] uppercase">Revenue Impact (Yr 3)</span>
                  <span className={`text-sm font-black ${pivot.impactType === 'positive' ? 'text-[#00D4AA]' : 'text-[#FF4D4F]'}`}>
                    {pivot.impact ?? 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#888899] uppercase">Adjusted TAM</span>
                  <span className="text-sm font-bold text-white">{pivot.adjusted_tam ?? pivot.tam ?? 'Pending'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button className="w-full py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[2px_2px_0px_transparent] group-hover:shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center justify-center gap-2">
                  Accept this Pivot <ArrowRight className="w-4 h-4" />
                </button>
                <button className="w-full py-3 bg-transparent text-[#888899] font-bold text-sm hover:text-white transition-colors flex items-center justify-center gap-2">
                  View Financials <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button className="px-6 py-3 border-2 border-[#111118] text-[#888899] font-bold text-sm hover:border-white hover:text-white transition-colors flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Re-run Adversarial Analysis
          </button>

          <div className="w-full max-w-4xl border-2 border-[#111118] bg-[#111118]">
            <button 
              onClick={() => setShowLog(!showLog)}
              className="w-full p-5 flex items-center justify-between font-bold text-sm text-[#888899] hover:text-white transition-colors uppercase tracking-widest"
            >
              <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> Debate Transcript</div>
              {showLog ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showLog && (
              <div className="p-5 border-t-2 border-[#0A0A0F] bg-[#0D0D14] h-[300px] overflow-y-auto custom-scrollbar font-mono text-sm flex flex-col gap-3">
                {transcript.map((entry, index) => (
                  <div key={`${entry.agent}-${index}`} className={entry.status === 'success' ? 'text-[#00D4AA]' : entry.status === 'warning' ? 'text-amber-500' : entry.status === 'error' ? 'text-[#FF4D4F]' : 'text-[#6C47FF]'}>
                    <span className="opacity-50">[{entry.agent}]</span> {entry.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
