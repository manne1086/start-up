import { Download, ExternalLink, Globe, Database, Server, Cpu, Clock, Users, IndianRupee, Box, ChevronRight } from 'lucide-react';
import { useGeneration } from '../generation';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';
import { buildVisualizationData } from '../visualizationData';
import ArchitectureCanvas from './ArchitectureCanvas';
import RoadmapTimeline from './RoadmapTimeline';

export default function MVPArchitecture() {
  const { navigate } = useRouter();
  const { backendState } = useGeneration();
  const viz = buildVisualizationData(backendState);
  const stack = viz.recommendedTechStack;
  const roadmap = viz.roadmapTimeline.phases;
  const architecture = viz.architecture;

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
          <span className="text-[#6C47FF]">MVP Architecture</span>
        </div>
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
            <div className="text-xl font-black text-white">{viz.roadmapTimeline.phases.length ? `${viz.roadmapTimeline.phases[viz.roadmapTimeline.phases.length - 1].endWeek} Weeks` : 'Pending'}</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[#6C47FF]"/> Team Size</div>
            <div className="text-xl font-black text-white">{backendState?.mvp?.team_size ? `${backendState.mvp.team_size} Engineers` : '4 Engineers'}</div>
          </div>
          <div className="bg-[#111118] border-2 border-[#111118] p-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-[#888899] uppercase tracking-widest mb-2 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-[#00D4AA]"/> Est. Cost</div>
            <div className="text-xl font-black text-[#00D4AA]">{backendState?.mvp?.estimated_cost_inr ?? '₹2,50,000'}</div>
          </div>
        </div>

        <ArchitectureCanvas architecture={architecture} />

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
                    <h3 className="font-bold text-white">{item.layer}</h3>
                    <div className="text-xs text-[#00D4AA] font-mono">{item.technology}</div>
                  </div>
                </div>
                  <p className="text-sm text-[#888899] mb-4">{item.reason}</p>
                  <div className="inline-block px-2 py-1 bg-[#111118] text-xs font-bold text-[#F0F0F0] border border-[#111118]">Complexity: {item.complexity}</div>
                </div>
              );
            }) : (
              <div className="text-[#888899]">No architecture stack generated yet.</div>
            )}
          </div>
        </div>

        <RoadmapTimeline phases={roadmap} />

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
