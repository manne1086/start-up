import { Plus, MoreHorizontal, ArrowRight, Folder } from 'lucide-react';
import { useRouter } from '../router';
import GlobalNavbar from './GlobalNavbar';
import { useGeneration } from '../generation';

export default function Projects() {
  const { navigate } = useRouter();
  const { backendState } = useGeneration();

  const projects = backendState
    ? [
        {
          id: backendState.thread_id ?? 'current',
          name: backendState.startup_name || backendState.idea || 'Current startup',
          industry: backendState.industry || 'Research-backed',
          status: backendState.status === 'complete' ? 'Complete' : backendState.status === 'failed' ? 'Failed' : backendState.status === 'paused' ? 'Draft' : 'Running',
          date: backendState.thread_id ? backendState.thread_id.slice(0, 8) : 'Live',
          updated: backendState.agent_logs?.length ? `${backendState.agent_logs.length} agent events` : 'No events yet',
          progress: backendState.completed_steps?.length ? `Step ${backendState.completed_steps.length} of 10` : null,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0] flex flex-col font-sans">
      <GlobalNavbar />
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">My Projects</h1>
          <button className="px-5 py-2.5 bg-[#6C47FF] border-2 border-[#6C47FF] text-white font-bold text-sm hover:bg-[#111118] hover:text-[#6C47FF] shadow-[4px_4px_0px_#00D4AA] transition-all flex items-center justify-center gap-2">
            New Project <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-6 border-b border-[#111118] mb-8">
          {['All', 'Draft', 'Complete', 'Archived'].map((tab, i) => (
            <button 
              key={tab} 
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${i === 0 ? 'border-[#6C47FF] text-white' : 'border-transparent text-[#888899] hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.length ? projects.map((p) => (
            <div key={p.id} className="border-2 border-[#111118] bg-[#111118] p-6 hover:border-[#6C47FF] hover:shadow-[4px_4px_0px_#6C47FF] transition-all flex flex-col group">
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-white">{p.name}</h3>
                <span className="px-2 py-1 border border-[#6C47FF]/30 bg-[#6C47FF]/10 text-[#6C47FF] text-xs font-bold uppercase">
                  {p.industry}
                </span>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-2 py-1 text-xs font-bold uppercase border ${
                  p.status === 'Complete' ? 'border-[#00D4AA]/30 bg-[#00D4AA]/10 text-[#00D4AA]' :
                  p.status === 'Draft' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' :
                  'border-[#FF4D4F]/30 bg-[#FF4D4F]/10 text-[#FF4D4F]'
                }`}>
                  {p.status}
                </span>
                <span className="text-xs text-[#888899] font-medium">Created {p.date} • {p.updated}</span>
              </div>

              {p.progress && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold text-[#888899] mb-2 uppercase">
                    <span>Progress</span>
                    <span>{p.progress}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0A0A0F]">
                    <div className="h-full bg-amber-500 w-[50%]"></div>
                  </div>
                </div>
              )}
              
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-[#0A0A0F]">
                <button 
                  onClick={() => p.status === 'Complete' ? navigate('results') : navigate('progress')}
                  className="text-sm font-bold text-[#F0F0F0] hover:text-[#00D4AA] flex items-center gap-2 transition-colors"
                >
                  {p.status === 'Complete' ? 'View Results' : p.status === 'Failed' ? 'View Error' : 'Resume'} <ArrowRight className="w-4 h-4" />
                </button>
                <button className="text-[#888899] hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

            </div>
          )) : (
            <div className="col-span-full border-2 border-[#111118] bg-[#111118] p-8 text-[#888899]">
              No project snapshots yet. Start a generation run and your live startup package will appear here.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
