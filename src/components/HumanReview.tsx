import { useEffect, useState } from 'react';
import {
  PauseCircle,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';
import { useGeneration } from '../generation';
import { useRouter } from '../router';

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? '');
  }
}

export default function HumanReview() {
  const { navigate, screen } = useRouter();
  const { backendState, approveRun, patchRun, status } = useGeneration();
  const [showPatch, setShowPatch] = useState(false);
  const [patchText, setPatchText] = useState('{\n  "gtm_strategy": "Direct sales plus NGO partnerships"\n}');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'complete' && screen !== 'results') {
      navigate('results');
    }
    if (status === 'failed' && screen !== 'error') {
      navigate('error');
    }
  }, [navigate, screen, status]);

  useEffect(() => {
    if (backendState?.business_plan) {
      const draft = backendState.business_plan as Record<string, unknown>;
      setPatchText(formatJson(draft));
    }
  }, [backendState?.business_plan]);

  const businessPlan = backendState?.business_plan as Record<string, string> | null | undefined;

  const handleApprove = async () => {
    if (!backendState?.thread_id) return;
    setBusy(true);
    setLocalError(null);
    try {
      await approveRun();
      navigate('results');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to resume generation.');
    } finally {
      setBusy(false);
    }
  };

  const handlePatch = async () => {
    if (!backendState?.thread_id) return;
    setBusy(true);
    setLocalError(null);
    try {
      const patch = JSON.parse(patchText) as Record<string, unknown>;
      await patchRun(patch);
      navigate('results');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Patch JSON is invalid.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-24">
      <GlobalNavbar />

      <div className="bg-[#6C47FF] text-white px-6 py-4 flex items-center gap-3">
        <PauseCircle className="w-6 h-6 fill-white text-[#6C47FF]" />
        <h2 className="text-base font-bold tracking-wide">
          Agent paused - Review the business plan before we proceed to Financial Modeling.
        </h2>
      </div>

      <main className="flex flex-col lg:flex-row gap-6 p-6 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="w-full lg:w-[55%] border-2 border-[#111118] bg-[#111118] flex flex-col h-[calc(100vh-200px)]">
          <div className="p-5 border-b-2 border-[#0A0A0F] flex justify-between items-center">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#6C47FF]" />
              Business Plan Draft
            </h3>
            <span className="text-xs font-bold text-[#888899] border border-[#888899]/30 px-2 py-1 uppercase">
              {backendState?.thread_id ? `run ${backendState.thread_id.slice(0, 6)}` : 'live'}
            </span>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-8">
            {businessPlan ? (
              <>
                <section className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-bold text-[#00D4AA]">Problem Statement</h4>
                    <button className="text-[#888899] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[#F0F0F0] leading-relaxed text-sm">
                    {businessPlan.problem_statement}
                  </p>
                </section>

                <section className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-bold text-[#00D4AA]">Solution & Value Proposition</h4>
                    <button className="text-[#888899] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[#F0F0F0] leading-relaxed text-sm">
                    {businessPlan.solution}
                  </p>
                </section>

                <section className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-bold text-[#00D4AA]">Target Market</h4>
                    <button className="text-[#888899] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[#F0F0F0] leading-relaxed text-sm">
                    {businessPlan.target_market}
                  </p>
                </section>

                <section className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-bold text-[#00D4AA]">Revenue Model</h4>
                    <button className="text-[#888899] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[#F0F0F0] leading-relaxed text-sm">
                    {businessPlan.revenue_model} - {businessPlan.pricing}
                  </p>
                </section>

                <section className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-bold text-[#00D4AA]">Go-to-Market Strategy</h4>
                    <button className="text-[#888899] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[#F0F0F0] leading-relaxed text-sm">
                    {businessPlan.gtm_strategy}
                  </p>
                </section>
              </>
            ) : (
              <div className="text-[#888899]">
                Waiting for the business plan to arrive from the backend.
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[45%] flex flex-col gap-6">
          <div className="border-2 border-[#111118] bg-[#111118] flex flex-col flex-1">
            <div className="p-5 border-b-2 border-[#0A0A0F] flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                Agent Notes
              </h3>
              <RefreshCw className="w-4 h-4 text-[#888899] cursor-pointer hover:text-white" />
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <div className="border-l-2 border-[#00D4AA] bg-[#0A0A0F] p-4 flex gap-3">
                <Search className="w-5 h-5 text-[#00D4AA] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#888899] uppercase mb-1">Market Agent</div>
                  <p className="text-sm text-[#F0F0F0]">
                    {backendState?.market ? 'Market intelligence loaded from the backend.' : 'Waiting for market research payload.'}
                  </p>
                </div>
              </div>

              <div className="border-l-2 border-[#6C47FF] bg-[#0A0A0F] p-4 flex gap-3">
                <FileText className="w-5 h-5 text-[#6C47FF] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#888899] uppercase mb-1">Business Agent</div>
                  <p className="text-sm text-[#F0F0F0]">
                    {businessPlan ? 'Business plan is ready for review.' : 'Business plan has not been generated yet.'}
                  </p>
                </div>
              </div>

              <div className="border-l-2 border-amber-500 bg-[#0A0A0F] p-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#888899] uppercase mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Validator
                  </div>
                  <p className="text-sm text-[#F0F0F0]">
                    Review the GTM and pricing before resuming the next stage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-[#111118] bg-[#111118]">
            <button
              className="w-full p-5 flex items-center justify-between font-bold text-sm text-[#888899] hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => setShowPatch(!showPatch)}
            >
              Advanced - Patch State
              {showPatch ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showPatch && (
              <div className="p-5 border-t-2 border-[#0A0A0F] bg-[#0A0A0F]">
                <div className="text-xs text-[#888899] font-mono mb-2">Edit raw state before resuming (expert mode)</div>
                <textarea
                  className="w-full h-[150px] bg-[#0D0D14] border-2 border-[#111118] text-[#F0F0F0] p-4 font-mono text-xs focus:outline-none focus:border-[#6C47FF] resize-none"
                  value={patchText}
                  onChange={(e) => setPatchText(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-[#111118] border-t-2 border-[#6C47FF]/20 p-4 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-end gap-4">
          <button
            className="w-[25%] py-3 bg-transparent text-[#888899] font-bold text-sm hover:text-white transition-colors flex items-center justify-center gap-2"
            onClick={() => setShowPatch((current) => !current)}
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>

          <button
            className="w-[25%] py-3 bg-transparent border-2 border-[#00D4AA] text-[#00D4AA] font-bold text-sm hover:bg-[#00D4AA] hover:text-[#0A0A0F] shadow-[4px_4px_0px_transparent] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex items-center justify-center gap-2"
            onClick={handlePatch}
            disabled={busy}
          >
            <Edit2 className="w-4 h-4" /> Apply Patch
          </button>

          <button
            onClick={handleApprove}
            disabled={busy}
            className="w-[50%] py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Approve & Continue
          </button>
        </div>

        {localError && (
          <div className="max-w-[1600px] mx-auto mt-3 text-sm text-[#FF4D4F]">
            {localError}
          </div>
        )}
      </div>
    </div>
  );
}
