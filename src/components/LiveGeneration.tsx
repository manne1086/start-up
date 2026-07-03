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
  Terminal,
  Pause,
  Clock,
} from 'lucide-react';
import { useMemo } from 'react';
import { useGeneration } from '../generation';

const steps = [
  { id: 1, name: 'Market Research Agent', status: 'completed', icon: Search },
  { id: 2, name: 'Business Planning Agent', status: 'completed', icon: FileText },
  { id: 3, name: 'Financial Engineering Agent', status: 'in-progress', icon: PieChart },
  { id: 4, name: 'Legal & Compliance Agent', status: 'waiting', icon: Scale },
  { id: 5, name: 'Pitch Deck Agent', status: 'waiting', icon: Presentation },
  { id: 6, name: 'MVP Architecture Agent', status: 'waiting', icon: Cpu },
];

export default function LiveGeneration({ onComplete }: { onComplete?: () => void }) {
  const { backendState, status } = useGeneration();
  const completedCount = backendState?.completed_steps?.length ?? 0;
  const progress = useMemo(
    () => Math.min(100, Math.round((completedCount / steps.length) * 100)),
    [completedCount]
  );

  const liveLogs = backendState?.agent_logs?.length
    ? backendState.agent_logs.map((log) => ({
        text: `[${log.agent}] ${log.message}`,
        status: log.status === 'success' ? 'completed' : log.status === 'warning' ? 'active' : log.status === 'error' ? 'pending' : 'active',
      }))
    : [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 flex flex-col flex-1 h-full">
      <div className="mb-10 border-2 border-[#6C47FF]/30 bg-[#12121A] p-5 shadow-[4px_4px_0px_#6C47FF]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black tracking-tight uppercase">
            {status === 'paused' ? 'Human Review' : 'Live Generation'}
          </h2>
          <span className="text-[#00D4AA] font-mono font-bold text-lg">{progress}% Complete</span>
        </div>
        <div className="w-full h-4 bg-[#0A0A0F] border-2 border-white/10 overflow-hidden">
          <div className="h-full bg-[#6C47FF] relative transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[500px]">
        <div className="w-full lg:w-[40%] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Agent Swarm Status</h3>
          <div className="flex flex-col gap-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = completedCount >= step.id;
              const isInProgress = !isCompleted && step.id === completedCount + 1;

              let borderColor = 'border-white/10';
              let bgColor = 'bg-[#0A0A0F]';
              let textColor = 'text-gray-500';
              let iconColor = 'text-gray-600';
              let StatusIcon = PauseCircle;
              let badgeText = 'WAITING';
              let badgeColor = 'text-gray-500 bg-gray-900 border-gray-700';

              if (isCompleted) {
                borderColor = 'border-[#00D4AA]/30';
                textColor = 'text-white';
                iconColor = 'text-[#00D4AA]';
                StatusIcon = CheckCircle2;
                badgeText = 'COMPLETED';
                badgeColor = 'text-[#00D4AA] bg-[#00D4AA]/10 border-[#00D4AA]/30';
              } else if (isInProgress) {
                borderColor = 'border-[#6C47FF]';
                bgColor = 'bg-[#12121A] shadow-[4px_4px_0px_#6C47FF] translate-x-2';
                textColor = 'text-white';
                iconColor = 'text-[#6C47FF]';
                StatusIcon = Activity;
                badgeText = 'IN PROGRESS';
                badgeColor = 'text-[#6C47FF] bg-[#6C47FF]/10 border-[#6C47FF]/30';
              }

              return (
                <div key={step.id} className={`border-2 ${borderColor} ${bgColor} p-4 flex items-center justify-between transition-all duration-300 relative`}>
                  {isInProgress && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#00D4AA] animate-ping opacity-75"></div>}
                  {isInProgress && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#00D4AA] border-2 border-[#0A0A0F]"></div>}

                  <div className="flex items-center gap-4">
                    <div className={`p-2 border-2 border-white/10 bg-[#0A0A0F] ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-bold text-sm ${textColor}`}>{step.name}</span>
                  </div>
                  <div className={`text-[10px] font-black tracking-wider px-2 py-1 border flex items-center gap-1 ${badgeColor}`}>
                    <StatusIcon className="w-3 h-3" />
                    {badgeText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-[60%] flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Agent Thought Stream
            </h3>
            <div className="text-[10px] font-black tracking-wider text-[#00D4AA] border border-[#00D4AA]/50 px-2 py-1 bg-[#00D4AA]/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse"></div>
              LIVE
            </div>
          </div>

          <div className="flex-1 bg-[#111118] border-2 border-white/10 p-6 font-mono text-sm overflow-y-auto flex flex-col gap-4 shadow-[6px_6px_0px_rgba(108,71,255,0.15)] h-[500px]">
            {liveLogs.length ? liveLogs.map((log, i) => {
              let colorClass = 'text-gray-500';
              if (log.status === 'completed') colorClass = 'text-[#00D4AA]';
              else if (log.status === 'active') colorClass = 'text-[#6C47FF]';

              return (
                <div key={i} className={`${colorClass} flex gap-4 leading-relaxed`}>
                  <span className="opacity-40 shrink-0 select-none">{`[${String(i + 1).padStart(2, '0')}]`}</span>
                  <span>{log.text}</span>
                </div>
              );
            }) : (
              <div className="text-[#888899]">Waiting for agent events from the backend...</div>
            )}
            <div className="text-[#6C47FF] flex gap-4 mt-2">
              <span className="opacity-40 shrink-0 select-none">[{String((liveLogs.length || 5) + 1).padStart(2, '0')}]</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-between items-center border-t-2 border-white/10 pt-6 px-2">
        <div className="flex items-center gap-3 font-mono text-gray-400 bg-[#12121A] px-4 py-2 border-2 border-white/10">
          <Clock className="w-4 h-4 text-[#00D4AA]" />
          <span className="text-sm font-bold">
            {status === 'paused' ? 'Paused for review' : 'Running live'}
          </span>
        </div>
        <button
          onClick={onComplete}
          className="flex items-center gap-3 px-8 py-3 bg-[#12121A] border-2 border-white/50 text-white font-black hover:bg-white hover:text-black hover:border-white shadow-[4px_4px_0px_#6C47FF] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#6C47FF] transition-all group"
        >
          <Pause className="w-5 h-5 group-hover:fill-black" />
          PAUSE & REVIEW
        </button>
      </div>
    </div>
  );
}
