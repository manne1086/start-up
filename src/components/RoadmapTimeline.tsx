import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

type Phase = {
  phase: number;
  title: string;
  startWeek: number;
  endWeek: number;
  deliverables: string[];
  tasks: string[];
};

export default memo(function RoadmapTimeline({ phases }: { phases: Phase[] }) {
  const [openPhase, setOpenPhase] = useState<number | null>(1);

  return (
    <div className="rounded-3xl border border-[#23232D] bg-[#0D0D14] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-black text-white">Roadmap Timeline</div>
          <div className="text-xs text-[#888899]">Milestones and deliverables</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.35em] text-[#888899]">Interactive</div>
      </div>

      <div className="relative">
        <div className="absolute left-6 right-6 top-8 h-px bg-white/10" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {phases.map((phase) => {
            const open = openPhase === phase.phase;
            return (
              <div key={phase.phase} className="min-w-[240px] max-w-[240px] shrink-0">
                <button
                  onClick={() => setOpenPhase(open ? null : phase.phase)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${open ? 'border-[#6C47FF] bg-[#111118] shadow-[4px_4px_0px_#6C47FF]' : 'border-[#23232D] bg-[#0A0A0F]'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#888899]">Phase {phase.phase}</div>
                    {open ? <ChevronDown className="w-4 h-4 text-[#00D4AA]" /> : <ChevronRight className="w-4 h-4 text-[#888899]" />}
                  </div>
                  <div className="text-lg font-black text-white">{phase.title}</div>
                  <div className="mt-2 text-xs text-[#888899]">Weeks {phase.startWeek}-{phase.endWeek}</div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#00D4AA]">
                    <CheckCircle2 className="w-4 h-4" />
                    {phase.deliverables[0] ?? 'Milestone'}
                  </div>
                </button>

                {open && (
                  <div className="mt-3 rounded-2xl border border-[#23232D] bg-[#0A0A0F] p-4">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-[#888899] mb-3">Tasks</div>
                    <div className="flex flex-col gap-2">
                      {phase.tasks.map((task) => (
                        <div key={task} className="rounded-xl border border-[#1A1A22] bg-[#111118] px-3 py-2 text-sm text-[#F0F0F0]">
                          {task}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
