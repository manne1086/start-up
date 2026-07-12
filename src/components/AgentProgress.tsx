import {
  CheckCircle2,
  Activity,
  PauseCircle,
  Search,
  FileText,
  PieChart,
  Scale,
  Presentation,
  Cpu,
  Clock,
  Pause,
  Terminal,
  ChevronRight,
  Globe,
  ExternalLink,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';

const flowSteps = [
  { key: 'orchestrator', name: 'Orchestrator', icon: Activity },
  { key: 'market_research', name: 'Market Research', icon: Search },
  { key: 'validator_market', name: 'Market Validation', icon: CheckCircle2 },
  { key: 'business_planning', name: 'Business Planning', icon: FileText },
  { key: 'review', name: 'Human Review', icon: PauseCircle },
  { key: 'financial_engineering', name: 'Financial Engineering', icon: PieChart },
  { key: 'validator_financial', name: 'Financial Validation', icon: CheckCircle2 },
  { key: 'legal_compliance', name: 'Legal & Compliance', icon: Scale },
  { key: 'pitch_deck', name: 'Pitch Deck', icon: Presentation },
  { key: 'mvp_architecture', name: 'MVP Architecture', icon: Cpu },
];

function toReadableTime(timestamp?: string) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function AgentProgress() {
  const { navigate, screen } = useRouter();
  const { backendState, status, error } = useGeneration();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'paused' && screen !== 'review') {
      navigate('review');
    }
    if (status === 'complete' && screen !== 'results') {
      navigate('results');
    }
    if (status === 'failed' && screen !== 'error') {
      navigate('error');
    }
  }, [navigate, screen, status]);

  const completed = new Set(backendState?.completed_steps ?? []);
  const currentStep = (backendState?.current_step as string | undefined) ?? '';
  const isPaused = status === 'paused' || Boolean(backendState?.awaiting_human_review);
  const progressCount = completed.size + (isPaused ? 1 : 0);
  const progressTotal = flowSteps.length;
  const progressPercent = Math.min(100, Math.round((progressCount / progressTotal) * 100));
  const displayLogs = backendState?.agent_logs ?? [];

  // Aggregate unique sources from logs
  const sources = useMemo(() => {
    const urlSet = new Map<string, { domain: string; url: string; count: number }>();
    for (const log of displayLogs) {
      if (log.url) {
        const domain = extractDomain(log.url);
        const existing = urlSet.get(domain);
        if (existing) {
          existing.count++;
        } else {
          urlSet.set(domain, { domain, url: log.url, count: 1 });
        }
      }
    }
    return Array.from(urlSet.values());
  }, [displayLogs]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayLogs.length]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />

      {/* Progress Header */}
      <div className="w-full bg-[#111118] border-b border-white/5 px-6 py-4 flex flex-col gap-2 shrink-0 animate-fadeInDown">
        <div className="flex items-center gap-2 text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('projects')}>Projects</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#6C47FF]">Live Generation</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-white uppercase tracking-wider">
            {isPaused ? 'Step 4 of 10 — Human Review' : `Step ${Math.max(1, progressCount + 1)} of ${progressTotal} — Live Generation`}
          </span>
          <span className="text-[#6C47FF] font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#0A0A0F] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] progress-animated"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto overflow-hidden">
        
        {/* Left Panel — Steps */}
        <div className="w-full lg:w-[38%] border-r border-white/5 p-6 lg:p-8 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex-1 flex flex-col gap-3">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              const isDone = completed.has(step.key);
              const isActive = currentStep === step.key || (!isDone && isPaused && step.key === 'review');
              const isWaiting = !isDone && !isActive;

              return (
                <div
                  key={step.key}
                  className={`p-4 rounded-xl bg-[#111118] flex items-center justify-between relative transition-all duration-300 animate-fadeInUp ${
                    isActive ? 'border border-[#6C47FF] shadow-[0_0_20px_rgba(108,71,255,0.15)]' : 'border border-transparent'
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {isActive && (
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#6C47FF] animate-pulse" />
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isDone ? 'bg-[#00D4AA]/10' : isActive ? 'bg-[#6C47FF]/10' : 'bg-white/5'
                    }`}>
                      <Icon className={`w-4 h-4 ${isDone ? 'text-[#00D4AA]' : isActive ? 'text-[#6C47FF]' : 'text-[#555566]'}`} />
                    </div>
                    <span className={`font-bold text-sm ${isDone || isActive ? 'text-[#F0F0F0]' : 'text-[#555566]'}`}>
                      {step.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isDone && <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" />}
                    {isActive && <Activity className="w-4 h-4 text-[#6C47FF] animate-pulse" />}
                    {isWaiting && <div className="w-4 h-4 rounded-full border border-[#555566]/40" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => navigate('review')}
              className="w-full py-3.5 rounded-xl border border-[#6C47FF] text-[#F0F0F0] font-bold text-sm hover:bg-[#6C47FF] hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" /> Pause & Review
            </button>
            <button
              onClick={() => navigate('landing')}
              className="text-sm font-bold text-[#FF4D4F] hover:underline transition-colors"
            >
              Cancel Run
            </button>
          </div>
        </div>

        {/* Right Panel — Agent Log */}
        <div className="w-full lg:w-[62%] p-6 lg:p-8 flex flex-col bg-[#0A0A0F] overflow-hidden gap-4">
          
          {/* Sources Consulted Panel */}
          {sources.length > 0 && (
            <div className="glass rounded-xl p-4 animate-fadeInDown">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-[#00D4AA]" />
                <span className="text-xs font-bold text-[#888899] uppercase tracking-[0.15em]">Sources Consulted ({sources.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.map((src) => (
                  <a
                    key={src.domain}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-white/8 text-xs font-semibold text-[#00D4AA] hover:border-[#00D4AA]/40 transition-all duration-200"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=16`}
                      alt=""
                      className="w-3.5 h-3.5 rounded-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {src.domain}
                    {src.count > 1 && <span className="text-[#6C47FF]">×{src.count}</span>}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Terminal */}
          <div className="flex-1 rounded-xl border border-[#6C47FF]/30 flex flex-col relative overflow-hidden glass" style={{ minHeight: 300 }}>
            {/* Terminal header */}
            <div className="p-3 border-b border-white/5 bg-[#111118]/80 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#6C47FF]" />
                <span className="text-xs font-mono font-bold text-[#6C47FF]">agent_stream.log</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF4D4F]/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-[#00D4AA]/80" />
              </div>
            </div>

            {/* Log entries */}
            <div className="flex-1 p-5 font-mono text-sm overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {displayLogs.length === 0 ? (
                <div className="text-[#555566] flex items-center gap-2">
                  <div className="flex gap-1">
                    <span style={{ animation: 'typingDots 1.2s infinite 0s' }}>●</span>
                    <span style={{ animation: 'typingDots 1.2s infinite 0.2s' }}>●</span>
                    <span style={{ animation: 'typingDots 1.2s infinite 0.4s' }}>●</span>
                  </div>
                  Waiting for the first agent event...
                </div>
              ) : (
                displayLogs.map((log, i) => {
                  const colorClass =
                    log.status === 'success' ? 'text-[#00D4AA]'
                    : log.status === 'warning' ? 'text-amber-500'
                    : log.status === 'error' ? 'text-[#FF4D4F]'
                    : 'text-[#6C47FF]';

                  return (
                    <div key={`${log.agent}-${i}`} className={`${colorClass} flex flex-col gap-0.5 leading-relaxed mb-1.5 animate-slideInRight`} style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
                      <div className="flex gap-3">
                        <span className="opacity-30 shrink-0 select-none text-[11px]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <span className="opacity-50 font-semibold">[{log.agent}] </span>
                          <span className="text-[#F0F0F0]/90">{log.message}</span>
                        </div>
                        <span className="ml-auto opacity-30 text-[10px] shrink-0">
                          {toReadableTime(log.timestamp)}
                        </span>
                      </div>
                      
                      {/* Agent research details — search queries, URLs, thoughts */}
                      {(log.thought || log.search_query || log.url) && (
                        <div className="ml-7 flex flex-col gap-1 text-[12px] border-l-2 border-[#6C47FF]/20 pl-3 mt-1 py-1 mb-1">
                          {log.thought && (
                            <div className="flex items-start gap-2 text-[#888899]">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500/60" />
                              <span className="italic">{log.thought}</span>
                            </div>
                          )}
                          {log.search_query && (
                            <div className="flex items-center gap-2 text-amber-500 font-semibold">
                              <Search className="w-3.5 h-3.5 shrink-0" />
                              <span>Searching: <span className="text-amber-400">&quot;{log.search_query}&quot;</span></span>
                            </div>
                          )}
                          {log.url && (
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold">
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span>Reading: </span>
                              <a href={log.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[#00D4AA]/30 hover:decoration-[#00D4AA] transition-colors flex items-center gap-1">
                                {extractDomain(log.url)}
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>

            {/* Terminal footer */}
            <div className="p-3 border-t border-white/5 bg-[#111118]/80 flex items-center justify-between rounded-b-xl">
              <div className="flex items-center gap-2 text-xs font-mono text-[#888899]">
                {status === 'running' && <div className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse" />}
                {status === 'running' && <Clock className="w-3.5 h-3.5 text-[#00D4AA]" />}
                <span>
                  {isPaused ? 'Paused for human review' : status === 'complete' ? 'Generation complete' : 'Running live'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[#555566]">
                <span>{displayLogs.length} events</span>
                {sources.length > 0 && <span>• {sources.length} sources</span>}
              </div>
            </div>
          </div>

          {error && (
            <div className="glass rounded-xl border border-[#FF4D4F]/30 text-[#FF4D4F] px-5 py-3 text-sm font-semibold animate-fadeInUp flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF4D4F] animate-pulse shrink-0" />
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
