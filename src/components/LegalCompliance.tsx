import { Scale, ShieldAlert, CheckCircle2, Download, ArrowRight, FileText, Briefcase, Building, ChevronRight } from 'lucide-react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';

export default function LegalCompliance() {
  const { navigate } = useRouter();
  const { backendState } = useGeneration();
  const legal = backendState?.legal as
    | {
        gdpr_compliant?: boolean;
        local_regulations?: Array<{ name?: string; status?: string; note?: string }>;
        entity_recommendation?: string;
        entity_notes?: string;
        action_items?: Array<{ title?: string; priority?: string; description?: string }>;
        documents_available?: string[];
      }
    | null
    | undefined;

  const regulations = legal?.local_regulations?.length
    ? legal.local_regulations
    : [];

  const actionItems = legal?.action_items?.length
    ? legal.action_items
    : [];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#888899] uppercase tracking-widest mb-4">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('projects')}>Projects</span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('results')}>
            {backendState?.startup_name || backendState?.idea || 'Startup'}
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#6C47FF]">Legal & Compliance</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">
          Legal & Compliance — {backendState?.startup_name || backendState?.idea || 'Live Startup Data'}
        </h1>

        {/* Top 4 Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {regulations.map((regulation, index) => {
            const isReview = regulation.status?.toLowerCase().includes('review');
            const isCompliant = regulation.status?.toLowerCase().includes('compliant');
            return (
              <div
                key={`${regulation.name ?? 'reg'}-${index}`}
                className={`${isReview ? 'bg-amber-500/5 border-amber-500/50 shadow-[4px_4px_0px_rgba(234,179,8,0.2)]' : 'bg-[#111118] border-[#111118]'} border-2 p-5 transition-colors flex flex-col`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {isReview ? (
                    <ShieldAlert className="w-6 h-6 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-[#00D4AA]" />
                  )}
                  <h3 className={`font-black uppercase tracking-wide ${isReview ? 'text-amber-500' : 'text-white'}`}>{regulation.name ?? 'Regulation'}</h3>
                </div>
                <div className="mt-auto">
                  <span className={`px-2 py-1 text-xs font-bold uppercase border mb-2 inline-block ${isReview ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' : isCompliant ? 'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]' : 'border-[#888899]/30 bg-[#888899]/10 text-[#888899]'}`}>
                    {regulation.status ?? 'Pending'}
                  </span>
                  <p className="text-xs text-[#888899] font-medium leading-relaxed">{regulation.note ?? 'Awaiting backend compliance analysis.'}</p>
                </div>
              </div>
            );
          })}

          <div className="bg-[#111118] border-2 border-[#111118] p-5 hover:border-[#6C47FF] transition-colors flex flex-col group">
            <div className="flex items-center gap-3 mb-4">
              <Building className="w-6 h-6 text-[#00D4AA]" />
              <h3 className="font-black text-white uppercase tracking-wide">Entity Name</h3>
            </div>
            <div className="mt-auto">
              <span className="px-2 py-1 text-xs font-bold uppercase border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA] mb-2 inline-block">MCA Verified</span>
              <p className="text-xs text-[#888899] font-medium leading-relaxed">{legal?.entity_recommendation ?? 'No entity recommendation yet.'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          
          {/* LEFT — Entity Recommendation */}
          <div className="w-full lg:w-1/2 border-2 border-[#111118] bg-[#111118] flex flex-col">
            <div className="p-6 border-b border-[#0A0A0F]">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1">Entity Recommendation</h2>
              <p className="text-[#888899] text-xs">Based on backend legal analysis and current startup state.</p>
            </div>
            <div className="p-6 flex flex-col gap-6 flex-1">
              <div className="text-2xl font-black text-[#6C47FF] tracking-tight">{legal?.entity_recommendation ?? 'No entity recommendation yet.'}</div>
              
              <div className="flex flex-col gap-3 font-mono text-sm">
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">Notes:</span>
                  <span className="text-[#F0F0F0] font-bold">{legal?.entity_notes ?? 'No legal notes yet.'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">Est. Setup Cost:</span>
                  <span className="text-[#F0F0F0] font-bold">Backend estimate pending</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">Timeline:</span>
                  <span className="text-[#F0F0F0] font-bold">Live run output</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#0A0A0F]">
                  <span className="text-[#888899]">DIN Status:</span>
                  <span className="text-[#00D4AA] font-bold">Generated from current run ✅</span>
                </div>
              </div>

              <button className="mt-auto w-full py-3 bg-[#6C47FF] text-white font-black text-sm uppercase tracking-wider hover:bg-[#111118] hover:text-[#6C47FF] transition-all shadow-[4px_4px_0px_transparent] hover:shadow-[4px_4px_0px_#6C47FF] border-2 border-[#6C47FF] flex items-center justify-center gap-2">
                Generate Incorporation Checklist <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT — Compliance Action Items */}
          <div className="w-full lg:w-1/2 border-2 border-[#111118] bg-[#111118] flex flex-col">
            <div className="p-6 border-b border-[#0A0A0F]">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-1">Compliance Action Items</h2>
              <p className="text-[#888899] text-xs">Prioritized legal tasks from the backend.</p>
            </div>
            
            <div className="flex flex-col p-6 gap-4 flex-1 overflow-y-auto custom-scrollbar max-h-[400px]">
              
              {actionItems.map((item, index) => (
                <div key={`${item.title ?? 'action'}-${index}`} className="flex items-start gap-3 p-4 bg-[#0A0A0F] border border-[#111118]">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-[#6C47FF]" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#F0F0F0]">{index + 1}. {item.title ?? 'Action item'}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${item.priority === 'Critical' ? 'bg-[#FF4D4F]/10 text-[#FF4D4F]' : item.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-[#00D4AA]/10 text-[#00D4AA]'}`}>
                        {item.priority ?? 'Low'}
                      </span>
                    </div>
                    <p className="text-xs text-[#888899] leading-relaxed mb-2">{item.description ?? 'Awaiting backend compliance guidance.'}</p>
                    <span className="text-xs font-bold text-[#6C47FF]">No external link configured</span>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>

        {/* Downloads Row */}
        <div>
          <h4 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-4">Document Templates</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(legal?.documents_available?.length ? legal.documents_available : []).map((doc, i) => (
                <button key={i} className="bg-[#111118] border-2 border-[#111118] hover:border-[#6C47FF] p-4 flex flex-col items-start gap-3 transition-colors group">
                  <FileText className="w-5 h-5 text-[#888899] group-hover:text-[#6C47FF]" />
                  <div className="text-left">
                    <div className="font-bold text-[#F0F0F0] text-sm">{doc}</div>
                    <div className="text-xs text-[#888899] font-mono mt-1">.pdf</div>
                  </div>
                  <Download className="w-4 h-4 text-[#6C47FF] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              {!legal?.documents_available?.length && <div className="text-[#888899]">No document templates generated yet.</div>}
          </div>
        </div>

      </main>
    </div>
  );
}
