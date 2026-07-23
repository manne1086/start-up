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
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';

const flowSteps = [
  { key: 'orchestrator', name: 'Orchestrator', icon: Activity },
  { key: 'market_research', name: 'Market Research', icon: Search },
  { key: 'validator_market', name: 'Market Validation', icon: CheckCircle2 },
  { key: 'business_planning', name: 'Business Planning', icon: FileText },
  { key: 'review', name: 'Human Review', icon: PauseCircle, isCheckpoint: true },
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

// Pipeline Timeline Component
function PipelineTimeline({
  completed,
  currentStep,
  isPaused,
  progressCount,
  progressTotal,
}: {
  completed: Set<string>;
  currentStep: string;
  isPaused: boolean;
  progressCount: number;
  progressTotal: number;
}) {
  const [isVertical, setIsVertical] = useState(false);

  useEffect(() => {
    const checkLayout = () => {
      setIsVertical(window.innerWidth < 1024);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  return (
    <div className={`pipeline-timeline ${isVertical ? 'vertical' : 'horizontal'}`}>
      <div className={`${
        isVertical
          ? 'flex flex-col gap-2 px-4 py-4'
          : 'flex flex-row gap-1 overflow-x-auto px-4 py-3 pb-4 custom-scrollbar'
      }`}>
        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          const isDone = completed.has(step.key);
          const isActive = currentStep === step.key || (!isDone && isPaused && step.key === 'review');
          const isWaiting = !isDone && !isActive;
          const isReached = isDone || isActive;

          return (
            <div key={step.key} className={`flex ${isVertical ? 'flex-col items-start gap-3' : 'flex-col items-center gap-3'}`}>
              {/* Connector line (horizontal or vertical) */}
              {index > 0 && (
                <div
                  className={`absolute ${
                    isVertical
                      ? 'left-[24px] w-0.5 h-4 bg-gradient-to-b'
                      : 'top-[24px] h-0.5 w-2 bg-gradient-to-r'
                  } pointer-events-none`}
                  style={{
                    background: isDone || isActive
                      ? 'linear-gradient(to bottom, #00D4AA, #00D4AA)'
                      : 'linear-gradient(to bottom, #555566, #555566)',
                  }}
                />
              )}

              {/* Node */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold transition-all duration-300 ${
                  isDone
                    ? 'border-2 border-[#00D4AA] bg-[#00D4AA]/10 shadow-[0_0_20px_rgba(0,212,170,0.2)]'
                    : isActive
                    ? 'border-2 border-[#6C47FF] bg-[#6C47FF]/10 shadow-[0_0_20px_rgba(108,71,255,0.3)] animate-pulse'
                    : step.isCheckpoint && isPaused && !isDone
                    ? 'border-2 border-[#FFB800] bg-[#FFB800]/10 shadow-[0_0_20px_rgba(255,184,0,0.2)]'
                    : 'border-2 border-[#555566] bg-[#222233]'
                } ${step.isCheckpoint ? 'ring-2 ring-offset-2 ring-offset-[#07070C] ring-[#FFB800]/30' : ''}`}
              >
                {isDone && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#00D4AA]" />
                  </motion.div>
                )}
                {isActive && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Activity className="w-5 h-5 text-[#6C47FF]" />
                  </motion.div>
                )}
                {isWaiting && (
                  <span className="text-[10px] font-bold text-[#555566]">{index + 1}</span>
                )}

                {/* Checkpoint indicator */}
                {step.isCheckpoint && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#FFB800] flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.div>

              {/* Label */}
              <div className={`text-center ${isVertical ? 'w-20' : ''}`}>
                <div
                  className={`text-xs font-bold leading-tight ${
                    isDone || isActive ? 'text-[#F0F0F0]' : 'text-[#555566]'
                  }`}
                >
                  {step.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline info footer */}
      <div className="px-6 py-4 border-t border-white/5 bg-[#111118]/50 flex items-center justify-between text-xs">
        <span className="text-[#888899]">
          <span className="font-bold text-[#F0F0F0]">{progressCount}</span> of{' '}
          <span className="font-bold text-[#F0F0F0]">{progressTotal}</span> agents complete
        </span>
        <span className="text-[#6C47FF] font-mono font-bold">
          {Math.min(100, Math.round((progressCount / progressTotal) * 100))}%
        </span>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, isPaused }: { status: string; isPaused: boolean }) {
  if (isPaused) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800] text-xs font-bold">
        <AlertCircle className="w-3.5 h-3.5" />
        Awaiting Review
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6C47FF]/10 border border-[#6C47FF]/40 text-[#6C47FF] text-xs font-bold animate-pulse">
        <Activity className="w-3.5 h-3.5" />
        Running
      </div>
    );
  }
  if (status === 'complete') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/40 text-[#00D4AA] text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Complete
      </div>
    );
  }
  return null;
}

export default function AgentProgress() {
  const { navigate, screen } = useRouter();
  const { backendState, status, error } = useGeneration();

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

  return (
    <div className="h-screen bg-[#07070C] text-[#F0F0F0] flex flex-col font-sans overflow-hidden">
      <GlobalNavbar />

      {/* Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#0D0D14] border-b border-white/5 px-6 py-3 flex flex-col gap-2 shrink-0"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#888899] uppercase tracking-widest mb-2">
              <span
                className="hover:text-white cursor-pointer transition-colors"
                onClick={() => navigate('projects')}
              >
                Projects
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#6C47FF]">Live Generation</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {isPaused
                  ? 'Paused for Human Review'
                  : `Step ${Math.max(1, progressCount + 1)} of ${progressTotal} — Live Analysis`}
              </span>
              <StatusBadge status={status} isPaused={isPaused} />
            </div>
          </div>
          <span className="text-[#6C47FF] font-mono font-bold text-lg">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-[#111118] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6C47FF] to-[#00D4AA]"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </motion.div>


      {/* Main Content */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row w-full overflow-hidden">

        {/* Left Panel — Steps (Hidden on large screens, kept for mobile) */}
        <div className="hidden lg:flex w-[32%] min-h-0 border-r border-white/5 p-8 flex-col overflow-y-auto custom-scrollbar bg-[#07070C]">
          <h3 className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-6">
            Pipeline Status
          </h3>
          <div className="flex-1 flex flex-col gap-3">
            {flowSteps.map((step, i) => {
              const Icon = step.icon;
              const isDone = completed.has(step.key);
              const isActive = currentStep === step.key || (!isDone && isPaused && step.key === 'review');
              const isWaiting = !isDone && !isActive;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg bg-[#111118] flex items-center justify-between relative transition-all duration-300 ${
                    isActive ? 'border border-[#6C47FF] shadow-[0_0_20px_rgba(108,71,255,0.15)]' : 'border border-transparent'
                  } ${step.isCheckpoint ? 'ring-1 ring-[#FFB800]/30' : ''}`}
                >
                  {isActive && (
                    <motion.div
                      className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#6C47FF]"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-[#00D4AA]/10' : isActive ? 'bg-[#6C47FF]/10' : 'bg-white/5'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isDone ? 'text-[#00D4AA]' : isActive ? 'text-[#6C47FF]' : 'text-[#555566]'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        isDone || isActive ? 'text-[#F0F0F0]' : 'text-[#555566]'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDone && <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" />}
                    {isActive && (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                        <Activity className="w-4 h-4 text-[#6C47FF]" />
                      </motion.div>
                    )}
                    {isWaiting && <div className="w-3 h-3 rounded-full border border-[#555566]/40" />}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => navigate('review')}
              className="w-full py-3 rounded-lg border border-[#6C47FF] text-[#F0F0F0] font-bold text-sm hover:bg-[#6C47FF] hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" /> Pause & Review
            </button>
            <button
              onClick={() => navigate('landing')}
              className="text-sm font-bold text-[#FF6B6B] hover:underline transition-colors"
            >
              Cancel Run
            </button>
          </div>
        </div>

        {/* Right Panel — Agent Log Stream */}
        <div className="w-full lg:w-[68%] min-h-0 p-6 lg:p-8 flex flex-col bg-[#07070C] overflow-hidden gap-4">

          {/* Checkpoint Alert */}
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl border border-[#FFB800]/40 bg-[#FFB800]/10 px-5 py-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-[#FFB800] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#FFB800] mb-1">Human Review Required</div>
                <div className="text-sm text-[#E0E0EE]">
                  The Financial Engineering agent has completed initial analysis. Please review the generated reports and approve to continue.
                </div>
              </div>
            </motion.div>
          )}

          {/* Sources Consulted Panel */}
          {sources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-[#00D4AA]" />
                <span className="text-xs font-bold text-[#888899] uppercase tracking-[0.15em]">
                  Sources Consulted ({sources.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.map((src) => (
                  <motion.a
                    key={src.domain}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111118] border border-white/8 text-xs font-semibold text-[#00D4AA] hover:border-[#00D4AA]/40 transition-all duration-200"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=16`}
                      alt=""
                      className="w-3.5 h-3.5 rounded-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {src.domain}
                    {src.count > 1 && <span className="text-[#6C47FF]">×{src.count}</span>}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Log Stream Terminal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-h-0 rounded-xl border border-[#6C47FF]/30 flex flex-col relative overflow-hidden glass"
            style={{ minHeight: 400 }}
          >
            {/* Terminal header */}
            <div className="p-4 border-b border-white/5 bg-[#111118]/80 flex items-center justify-between rounded-t-xl shrink-0">
              <div className="flex items-center gap-2">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Terminal className="w-4 h-4 text-[#6C47FF]" />
                </motion.div>
                <span className="text-xs font-mono font-bold text-[#6C47FF]">agent_stream.log</span>
              </div>
              <div className="flex gap-1.5">
                <motion.div
                  className="w-3 h-3 rounded-full bg-[#FF4D4F]/80"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-amber-500/80"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-[#00D4AA]/80"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                />
              </div>
            </div>

            {/* Log entries */}
            <div className="flex-1 min-h-0 p-5 font-mono text-sm overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {displayLogs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#555566] flex items-center gap-2"
                >
                  <div className="flex gap-1">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                    >
                      ●
                    </motion.span>
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    >
                      ●
                    </motion.span>
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    >
                      ●
                    </motion.span>
                  </div>
                  Waiting for the first agent event...
                </motion.div>
              ) : (
                displayLogs.map((log, i) => {
                  const colorClass =
                    log.status === 'success'
                      ? 'text-[#00D4AA]'
                      : log.status === 'warning'
                      ? 'text-amber-500'
                      : log.status === 'error'
                      ? 'text-[#FF6B6B]'
                      : 'text-[#6C47FF]';

                  return (
                    <motion.div
                      key={`${log.agent}-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      className={`${colorClass} flex flex-col gap-0.5 leading-relaxed mb-1.5`}
                    >
                      <div className="flex gap-3 hover:bg-white/5 px-2 py-1 rounded transition-colors">
                        <span className="opacity-30 shrink-0 select-none text-[11px]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="opacity-50 font-semibold">[{log.agent}] </span>
                          <span className="text-[#F0F0F0]/90">{log.message}</span>
                        </div>
                        <span className="ml-auto opacity-30 text-[10px] shrink-0">
                          {toReadableTime(log.timestamp)}
                        </span>
                      </div>

                      {/* Agent research details — search queries, URLs, thoughts */}
                      {(log.thought || log.search_query || log.url) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="ml-7 flex flex-col gap-1 text-[12px] border-l-2 border-[#6C47FF]/20 pl-3 mt-1 py-1 mb-1"
                        >
                          {log.thought && (
                            <div className="flex items-start gap-2 text-[#888899]">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500/60" />
                              <span className="italic">{log.thought}</span>
                            </div>
                          )}
                          {log.search_query && (
                            <div className="flex items-center gap-2 text-amber-500 font-semibold">
                              <Search className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Searching:{' '}
                                <span className="text-amber-400">&quot;{log.search_query}&quot;</span>
                              </span>
                            </div>
                          )}
                          {log.url && (
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold">
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span>Reading: </span>
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-[#00D4AA]/30 hover:decoration-[#00D4AA] transition-colors flex items-center gap-1"
                              >
                                {extractDomain(log.url)}
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </a>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Terminal footer */}
            <div className="p-4 border-t border-white/5 bg-[#111118]/80 flex items-center justify-between rounded-b-xl shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono text-[#888899]">
                {status === 'running' && (
                  <>
                    <motion.div
                      className="w-2 h-2 rounded-full bg-[#00D4AA]"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <Clock className="w-3.5 h-3.5 text-[#00D4AA]" />
                  </>
                )}
                <span>
                  {isPaused ? 'Paused for human review' : status === 'complete' ? 'Generation complete' : 'Running live'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[#555566]">
                <span>{displayLogs.length} events</span>
                {sources.length > 0 && <span>• {sources.length} sources</span>}
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl border border-[#FF4D4F]/30 text-[#FF4D4F] px-5 py-3 text-sm font-semibold flex items-center gap-2 shrink-0"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-[#FF4D4F]"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {error}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
