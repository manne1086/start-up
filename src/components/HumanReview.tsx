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
  Sparkles,
  Target,
  Globe2,
  ChevronRight,
  TrendingUp,
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
  const { backendState, threadId, approveRun, patchRun, status } = useGeneration();
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
  const riskItems = Array.isArray((backendState?.business_plan as { key_risks?: string[] } | null | undefined)?.key_risks)
    ? ((backendState?.business_plan as { key_risks?: string[] } | null | undefined)?.key_risks ?? [])
    : [];
  const mitigationItems = Array.isArray((backendState?.business_plan as { mitigation_steps?: string[] } | null | undefined)?.mitigation_steps)
    ? ((backendState?.business_plan as { mitigation_steps?: string[] } | null | undefined)?.mitigation_steps ?? [])
    : [];
  const market = backendState?.market as
    | {
        tam?: string;
        sam?: string;
        som?: string;
        tam_source?: string;
        competitors?: Array<Record<string, string>>;
        market_gaps?: string[];
        raw_search_results?: string[];
      }
    | null
    | undefined;

  const evidence = Array.isArray(market?.raw_search_results) ? market.raw_search_results : [];
  const competitors = Array.isArray(market?.competitors) ? market.competitors : [];
  const gaps = Array.isArray(market?.market_gaps) ? market.market_gaps : [];

  const handleApprove = async () => {
    if (!threadId && !backendState?.thread_id) {
      setLocalError('No active run found. Start a generation before approving.');
      return;
    }
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
    if (!threadId && !backendState?.thread_id) {
      setLocalError('No active run found. Start a generation before applying a patch.');
      return;
    }
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

      <div className="bg-gradient-to-r from-[#6C47FF] via-[#5B3CFF] to-[#00D4AA] text-white px-6 py-4 flex items-center gap-3 shadow-[0_8px_40px_rgba(108,71,255,0.25)]">
        <PauseCircle className="w-6 h-6 fill-white text-[#6C47FF]" />
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold tracking-wide">
            Agent paused - Review the research-backed business plan before we proceed to Financial Modeling.
          </h2>
          <p className="text-xs text-white/80">
            The draft now reflects Tavily research signals, market gaps, and competitor context instead of a generic placeholder.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 max-w-[1600px] w-full mx-auto pb-0">
        <div className="flex items-center gap-2 text-xs font-bold text-[#888899] uppercase tracking-widest">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('projects')}>Projects</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#6C47FF]">Human Review</span>
        </div>
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
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0A0A0F] border border-white/10 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-[#888899] mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#00D4AA]" />
                      TAM
                    </div>
                    <div className="text-2xl font-black text-white">{market?.tam ?? '—'}</div>
                    <div className="text-xs text-[#888899] mt-2">{market?.tam_source ?? 'No source available yet.'}</div>
                  </div>
                  <div className="bg-[#0A0A0F] border border-white/10 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-[#888899] mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#6C47FF]" />
                      SAM
                    </div>
                    <div className="text-2xl font-black text-white">{market?.sam ?? '—'}</div>
                    <div className="text-xs text-[#888899] mt-2">Serviceable segment the agent is using for planning.</div>
                  </div>
                  <div className="bg-[#0A0A0F] border border-white/10 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-[#888899] mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00D4AA]" />
                      SOM
                    </div>
                    <div className="text-2xl font-black text-white">{market?.som ?? '—'}</div>
                    <div className="text-xs text-[#888899] mt-2">Initial capture assumption used to frame the go-to-market.</div>
                  </div>
                </section>

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

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="group">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-bold text-[#00D4AA]">Target Market</h4>
                      <button className="text-[#888899] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[#F0F0F0] leading-relaxed text-sm">
                      {businessPlan.target_market}
                    </p>
                  </div>

                  <div className="group">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-bold text-[#00D4AA]">Revenue Model</h4>
                      <button className="text-[#888899] hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[#F0F0F0] leading-relaxed text-sm">
                      {businessPlan.revenue_model}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 border border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA] text-xs font-bold px-3 py-1">
                      <Globe2 className="w-3 h-3" />
                      {businessPlan.pricing}
                    </div>
                  </div>
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

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#0A0A0F] border border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm uppercase tracking-widest">
                      <AlertTriangle className="w-4 h-4" />
                      Key Risks
                    </div>
                    <ul className="space-y-3 text-sm text-[#F0F0F0] leading-relaxed">
                      {riskItems.length ? (
                        riskItems.map((risk, index) => (
                          <li key={`${risk}-${index}`} className="flex gap-3">
                            <span className="text-amber-400 font-black">{index + 1}.</span>
                            <span>{risk}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[#888899]">No explicit risks listed yet.</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-[#0A0A0F] border border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-3 text-[#00D4AA] font-bold text-sm uppercase tracking-widest">
                      <ShieldAlert className="w-4 h-4" />
                      Prevention / Mitigation
                    </div>
                    <ul className="space-y-3 text-sm text-[#F0F0F0] leading-relaxed">
                      {mitigationItems.length ? (
                        mitigationItems.map((step, index) => (
                          <li key={`${step}-${index}`} className="flex gap-3">
                            <span className="text-[#00D4AA] font-black">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[#888899]">No mitigation steps listed yet.</li>
                      )}
                    </ul>
                  </div>
                </section>

                <section className="bg-[#0A0A0F] border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#00D4AA]" />
                      Research Signals
                    </h4>
                    <span className="text-[11px] font-mono text-[#888899]">{evidence.length} sources</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evidence.slice(0, 4).map((item, index) => (
                      <div key={`${index}-${item.slice(0, 20)}`} className="border border-white/10 bg-[#111118] p-3">
                        <div className="text-[11px] uppercase tracking-widest text-[#888899] mb-2">Signal {index + 1}</div>
                        <p className="text-sm text-[#F0F0F0] leading-relaxed">{item}</p>
                      </div>
                    ))}
                    {evidence.length === 0 && (
                      <div className="text-sm text-[#888899]">No research evidence available yet.</div>
                    )}
                  </div>
                </section>

                <section className="bg-[#0A0A0F] border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">
                      Competitor Snapshot
                    </h4>
                    <span className="text-[11px] font-mono text-[#888899]">{competitors.length} competitors</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {competitors.slice(0, 3).map((competitor, index) => (
                      <div key={`${competitor.name ?? 'competitor'}-${index}`} className="border border-white/10 bg-[#111118] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white">{competitor.name ?? 'Unknown'}</div>
                          <span className="text-[10px] uppercase tracking-widest text-[#00D4AA]">
                            {competitor.threat_level ?? 'Unknown'}
                          </span>
                        </div>
                        <div className="text-xs text-[#888899] space-y-1">
                          <div>Founded: {competitor.founded ?? '—'}</div>
                          <div>Funding: {competitor.funding ?? '—'}</div>
                          <div>Pricing: {competitor.pricing ?? '—'}</div>
                          <div>Focus: {competitor.focus ?? '—'}</div>
                        </div>
                      </div>
                    ))}
                    {competitors.length === 0 && (
                      <div className="text-sm text-[#888899]">No competitor data available yet.</div>
                    )}
                  </div>
                </section>

                <section className="bg-[#0A0A0F] border border-white/10 p-5">
                  <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">Market Gaps</h4>
                  <div className="flex flex-wrap gap-2">
                    {gaps.map((gap) => (
                      <span key={gap} className="px-3 py-1 text-xs font-bold border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#C9BEFF]">
                        {gap}
                      </span>
                    ))}
                    {gaps.length === 0 && <span className="text-sm text-[#888899]">No market gaps captured yet.</span>}
                  </div>
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
                    {backendState?.market
                      ? 'Deep market research loaded from Tavily-backed evidence and synthesized into TAM, competitors, and gaps.'
                      : 'Waiting for market research payload.'}
                  </p>
                </div>
              </div>

              <div className="border-l-2 border-[#6C47FF] bg-[#0A0A0F] p-4 flex gap-3">
                <FileText className="w-5 h-5 text-[#6C47FF] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#888899] uppercase mb-1">Business Agent</div>
                  <p className="text-sm text-[#F0F0F0]">
                    {businessPlan
                      ? 'Business plan is grounded in market evidence and ready for human review.'
                      : 'Business plan has not been generated yet.'}
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
                    Review the GTM, pricing, and source quality before resuming the next stage.
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
            <Edit2 className="w-4 h-4" /> {busy ? 'Applying Patch...' : 'Apply Patch'}
          </button>

          <button
            onClick={handleApprove}
            disabled={busy}
            className="w-[50%] py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-black text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> {busy ? 'Approving...' : 'Approve & Continue'}
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
