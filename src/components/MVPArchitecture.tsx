import { Download, ExternalLink, Globe, Database, Server, Cpu, Clock, Users, IndianRupee, Box } from 'lucide-react';
import { useGeneration } from '../generation';
import GlobalNavbar from './GlobalNavbar';

export default function MVPArchitecture() {
  const { backendState } = useGeneration();
  const mvp = backendState?.mvp as
    | {
        recommended_stack?: Array<{ layer?: string; technology?: string; reason?: string; complexity?: string }>;
        architecture_diagram?: string;
        roadmap_phases?: Array<{ phase?: number; title?: string; weeks?: string; tasks?: string[] }>;
        estimated_weeks?: number;
        estimated_cost_inr?: string;
        team_size?: number;
      }
    | null
    | undefined;

  const stack = mvp?.recommended_stack ?? [];
  const roadmap = mvp?.roadmap_phases ?? [];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans pb-12">
      <GlobalNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-8">
          MVP Architecture - {backendState?.startup_name || backendState?.idea || 'Live Startup Data'}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><Box className="w-4 h-4 text-[#6C47FF]"/> Stack</div>
            <div className="text-xl font-black text-white">{stack[0]?.technology ?? 'No stack generated yet'}</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-[#00D4AA]"/> Est. Build</div>
            <div className="text-xl font-black text-white">{mvp?.estimated_weeks ? `${mvp.estimated_weeks} Weeks` : 'Pending'}</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[#6C47FF]"/> Team Size</div>
            <div className="text-xl font-black text-white">{mvp?.team_size ? `${mvp.team_size} Engineers` : 'Pending'}</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-[#00D4AA]"/> Est. Cost</div>
            <div className="text-xl font-black text-[#00D4AA]">{mvp?.estimated_cost_inr ?? 'Pending'}</div>
          </div>
        </div>

        <div className="w-full border-2 border-[#111118] bg-[#111118] mb-12">
          <div className="p-5 border-b border-[#0A0A0F] flex justify-between items-center bg-[#0A0A0F]">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">System Architecture</h2>
          </div>
          <div className="p-8 bg-[#0D0D14] flex justify-center items-center font-mono text-sm">
            <pre className="text-[#888899] leading-relaxed">
{mvp?.architecture_diagram ?? 'No architecture diagram generated yet.'}
            </pre>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Recommended Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stack.length ? stack.slice(0, 3).map((item, index) => {
              const icons = [Globe, Server, Database];
              const Icon = icons[index] ?? Cpu;
              return (
                <div key={index} className="bg-[#0A0A0F] border border-[#111118] p-6 hover:border-[#6C47FF] transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-6 h-6 text-[#00D4AA]" />
                    <div>
                      <h3 className="font-bold text-white">{item.layer ?? 'Layer'}</h3>
                      <div className="text-xs text-[#00D4AA] font-mono">{item.technology ?? 'Pending'}</div>
                    </div>
                  </div>
                  <p className="text-sm text-[#888899] mb-4">{item.reason ?? 'No recommendation yet.'}</p>
                  <div className="inline-block px-2 py-1 bg-[#111118] text-xs font-bold text-[#F0F0F0] border border-[#111118]">Complexity: {item.complexity ?? 'Pending'}</div>
                </div>
              );
            }) : (
              <div className="text-[#888899]">No architecture stack generated yet.</div>
            )}
          </div>
        </div>

        <div className="w-full border-2 border-[#111118] bg-[#111118] mb-8">
          <div className="p-5 border-b border-[#0A0A0F] flex justify-between items-center bg-[#0A0A0F]">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Developer Roadmap</h2>
          </div>

          <div className="p-6 overflow-x-auto">
            <div className="flex gap-6 min-w-[800px]">
              {roadmap.length ? roadmap.map((phase, index) => (
                <div key={phase.phase ?? index} className={`flex-1 border-t-2 ${index === roadmap.length - 1 ? 'border-[#6C47FF]' : 'border-[#111118]'} pt-4 relative`}>
                  <div className={`absolute -top-[11px] left-0 w-5 h-5 rounded-full ${index === roadmap.length - 1 ? 'bg-[#6C47FF] animate-pulse' : 'bg-[#111118]'} border-4 border-[#0A0A0F]`}></div>
                  <h4 className={`font-bold mb-1 ${index === roadmap.length - 1 ? 'text-[#6C47FF]' : 'text-white'}`}>Phase {phase.phase ?? index + 1}: {phase.title ?? 'Roadmap'}</h4>
                  <div className="text-xs text-[#888899] font-mono mb-4">{phase.weeks ?? 'Week range pending'}</div>
                  <div className="flex flex-col gap-2">
                    {(phase.tasks ?? []).map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center gap-2 text-sm text-[#F0F0F0]"><input type="checkbox" disabled /> {task}</div>
                    ))}
                  </div>
                </div>
              )) : <div className="text-[#888899]">No roadmap generated yet.</div>}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="px-6 py-3 bg-transparent border-2 border-[#111118] text-[#888899] font-bold text-sm hover:border-[#6C47FF] hover:text-[#6C47FF] transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Roadmap .pdf
          </button>
          <button className="px-6 py-3 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#0A0A0F] hover:text-[#6C47FF] transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_transparent] hover:shadow-[4px_4px_0px_#00D4AA]">
            Export to Notion <ExternalLink className="w-4 h-4" />
          </button>
        </div>

      </main>
    </div>
  );
}
