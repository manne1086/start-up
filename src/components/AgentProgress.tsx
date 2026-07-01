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
} from 'lucide-react';
import { useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />

      <div className="w-full bg-[#111118] border-b border-[#111118] px-6 py-4 flex flex-col gap-2 shrink-0">
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-white uppercase tracking-wider">
            {isPaused ? 'Step 4 of 10 - Human Review' : `Step ${Math.max(1, progressCount + 1)} of ${progressTotal} - Live Generation`}
          </span>
          <span className="text-[#6C47FF]">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#0A0A0F] overflow-hidden">
          <div className="h-full bg-[#6C47FF] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto overflow-hidden">
        <div className="w-full lg:w-[38%] border-r border-[#111118] p-6 lg:p-8 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col gap-4">
            {flowSteps.map((step) => {
              const Icon = step.icon;
              const isDone = completed.has(step.key);
              const isActive = currentStep === step.key || (!isDone && isPaused && step.key === 'review');
              const isWaiting = !isDone && !isActive;

              return (
                <div
                  key={step.key}
                  className={`p-4 border-2 bg-[#111118] flex items-center justify-between relative transition-colors ${
                    isActive ? 'border-[#6C47FF]' : 'border-transparent'
                  }`}
                >
                  {isActive && (
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#6C47FF] animate-pulse" />
                  )}
                  <div className="flex items-center gap-4">
                    <Icon className={`w-5 h-5 ${isDone ? 'text-[#00D4AA]' : isActive ? 'text-[#6C47FF]' : 'text-[#888899]'}`} />
                    <span className={`font-bold text-sm ${isDone || isActive ? 'text-[#F0F0F0]' : 'text-[#888899]'}`}>
                      {step.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isDone && <CheckCircle2 className="w-4 h-4 text-[#00D4AA]" />}
                    {isActive && <Activity className="w-4 h-4 text-[#6C47FF]" />}
                    {isWaiting && <PauseCircle className="w-4 h-4 text-[#888899]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <button
              onClick={() => navigate('review')}
              className="w-full py-4 border-2 border-[#6C47FF] text-[#F0F0F0] font-bold text-sm hover:bg-[#6C47FF] hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" /> Pause & Review
            </button>
            <button
              onClick={() => navigate('landing')}
              className="text-sm font-bold text-[#FF4D4F] hover:underline"
            >
              Cancel Run
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[62%] p-6 lg:p-8 flex flex-col bg-[#0A0A0F] overflow-hidden">
          <div className="flex-1 bg-[#0D0D14] border-2 border-[#6C47FF] flex flex-col relative shadow-[4px_4px_0px_#6C47FF]">
            <div className="p-3 border-b-2 border-[#6C47FF]/30 bg-[#111118] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#6C47FF]">agent_stream.log</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF4D4F]" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-[#00D4AA]" />
              </div>
            </div>

            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar flex flex-col gap-2">
              {displayLogs.length === 0 ? (
                <div className="text-[#888899]">Waiting for the first agent event...</div>
              ) : (
                displayLogs.map((log, i) => {
                  const colorClass =
                    log.status === 'success' ? 'text-[#00D4AA]'
                    : log.status === 'warning' ? 'text-amber-500'
                    : log.status === 'error' ? 'text-[#FF4D4F]'
                    : 'text-[#6C47FF]';

                  return (
                    <div key={`${log.agent}-${i}`} className={`${colorClass} flex gap-4 leading-relaxed`}>
                      <span className="opacity-40 shrink-0 select-none">
                        [{String(i + 1).padStart(2, '0')}]
                      </span>
                      <span>
                        <span className="opacity-60">[{log.agent}] </span>
                        {log.message}
                      </span>
                      <span className="ml-auto opacity-40 text-[10px]">
                        {toReadableTime(log.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t-2 border-[#6C47FF]/30 bg-[#111118] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#888899]">
                <Clock className="w-4 h-4 text-[#00D4AA]" />
                <span>
                  {isPaused ? 'Paused for human review' : status === 'complete' ? 'Generation complete' : 'Running live'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#888899]">Auto-scroll</span>
                <div className="w-8 h-4 bg-[#6C47FF] rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 border border-[#FF4D4F]/40 bg-[#FF4D4F]/10 text-[#FF4D4F] px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
