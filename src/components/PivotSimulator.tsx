import { AlertTriangle, ArrowRight, RefreshCw, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import GlobalNavbar from './GlobalNavbar';
import { useRouter } from '../router';

const pivots = [
  { 
    id: 1, 
    name: 'Tier 2-3 Vernacular Focus', 
    rationale: 'Bypass Tier 1 saturation by targeting UP/MP budget schools with Hindi-first UI.', 
    impact: '+₹1.2Cr', 
    impactType: 'positive',
    tam: '$2.1B (Niche)' 
  },
  { 
    id: 2, 
    name: 'B2C Direct to Parent', 
    rationale: 'Sell directly to parents for after-school tutoring. Higher CAC but better margins.', 
    impact: '-₹0.4Cr', 
    impactType: 'negative',
    tam: '$5.5B (Broad)' 
  },
  { 
    id: 3, 
    name: 'Govt School NGO Partnerships', 
    rationale: 'Distribute via CSR funds. Extremely low CAC, high volume, but delayed sales cycles.', 
    impact: '+₹0.8Cr', 
    impactType: 'positive',
    tam: '$1.8B (CSR)' 
  }
];

export default function PivotSimulator() {
  const { navigate } = useRouter();
  const [showLog, setShowLog] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-10">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Pivot Simulator</h1>
          <p className="text-[#888899] font-medium">Stress-test your model against market reality</p>
        </div>

        {/* Warning Card */}
        <div className="w-full border-2 border-amber-500 bg-amber-500/5 p-6 shadow-[6px_6px_0px_rgba(234,179,8,0.2)] mb-10 flex gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <h2 className="text-lg font-black text-amber-500 uppercase tracking-wide mb-2">Adversarial Agent Finding</h2>
            <p className="text-[#F0F0F0] font-medium leading-relaxed">
              Tier 1 city market is saturated (87th percentile competition density). 
              Incumbents like BYJU's and Vedantu control 80% of BPS budgets. 
              Continuing with current GTM strategy has a 92% probability of CAC exceeding LTV by Month 14. 
              <span className="block mt-2 font-bold text-amber-500">3 pivot strategies generated.</span>
            </p>
          </div>
        </div>

        {/* Pivot Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {pivots.map(pivot => (
            <div key={pivot.id} className="border-2 border-[#111118] bg-[#111118] p-6 flex flex-col hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all group">
              <h3 className="text-xl font-black text-white mb-3">{pivot.name}</h3>
              <p className="text-sm text-[#888899] leading-relaxed mb-6 flex-1">
                {pivot.rationale}
              </p>
              
              <div className="bg-[#0A0A0F] border border-[#111118] p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#888899] uppercase">Revenue Impact (Yr 3)</span>
                  <span className={`text-sm font-black ${pivot.impactType === 'positive' ? 'text-[#00D4AA]' : 'text-[#FF4D4F]'}`}>
                    {pivot.impact}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#888899] uppercase">Adjusted TAM</span>
                  <span className="text-sm font-bold text-white">{pivot.tam}</span>
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
                <div className="text-[#00D4AA]"><span className="opacity-50">[Market Agent]</span> Proposing B2B SaaS in Tier 1. TAM is largest here.</div>
                <div className="text-amber-500"><span className="opacity-50">[Adversarial Agent]</span> Objection. Tier 1 CAC is $400+. Your LTV is only $350. You will bleed cash by month 8.</div>
                <div className="text-[#6C47FF]"><span className="opacity-50">[Financial Agent]</span> Confirmed. The model breaks at 15% churn in Tier 1.</div>
                <div className="text-[#F0F0F0]"><span className="opacity-50">[Strategy Agent]</span> Adjusting. What if we pivot to Tier 2-3 vernacular? CAC drops to $40.</div>
                <div className="text-[#00D4AA]"><span className="opacity-50">[Market Agent]</span> Running numbers on Tier 2-3... TAM shrinks to $2.1B, but SOM increases to 12% due to low competition.</div>
                <div className="text-[#6C47FF]"><span className="opacity-50">[Financial Agent]</span> Recalculating DCF. Yr 3 NPV turns positive (+₹1.2Cr).</div>
                <div className="text-amber-500"><span className="opacity-50">[Adversarial Agent]</span> Acceptable. However, warn user about vernacular content creation costs.</div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
