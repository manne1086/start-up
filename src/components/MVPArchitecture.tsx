import { Cpu, Layers3, Play, Rocket, Server, Sparkles, Database, GitBranch } from 'lucide-react';
import GlobalNavbar from './GlobalNavbar';
import MermaidDiagram from './MermaidDiagram';
import { architectureToMermaid } from './architectureToMermaid';
import type { ArchitectureModel } from './architecture-types';
import { useGeneration } from '../generation';
import { buildVisualizationData } from '../visualizationData';
const FALLBACK_MVP: ArchitectureModel = {
  title: 'MVP Architecture',
  layout: 'layered',
  theme: 'excalidraw-sketch',
  layers: [
    { id: 'frontend', label: 'Frontend', order: 0 },
    { id: 'backend', label: 'Backend', order: 1 },
    { id: 'data', label: 'Data', order: 2 },
  ],
  nodes: [
    { id: 'web', label: 'React App', type: 'frontend', layer: 'frontend', description: 'Customer-facing interface and onboarding flow' },
    { id: 'api', label: 'FastAPI', type: 'backend', layer: 'backend', description: 'Business logic, orchestration, and API surface' },
    { id: 'agent', label: 'AI Agent', type: 'ai', layer: 'backend', description: 'LLM-driven planning and analysis tasks' },
    { id: 'db', label: 'PostgreSQL', type: 'database', layer: 'data', description: 'Source of truth for app state and outputs' },
  ],
  edges: [
    { from: 'web', to: 'api', label: 'HTTP' },
    { from: 'api', to: 'agent', label: 'Task graph' },
    { from: 'api', to: 'db', label: 'Persistence' },
  ],
};

export default function MVPArchitecture() {
  const { backendState } = useGeneration();
  const vizData = buildVisualizationData(backendState);
  const mvp = backendState?.mvp as
    | {
        estimated_weeks?: number;
        team_size?: number;
        estimated_cost_inr?: string;
        recommended_stack?: Array<{ technology?: string; rationale?: string }>;
      }
    | null
    | undefined;

  const architecture = vizData.architecture;
  const stack = mvp?.recommended_stack ?? [];
  const techStack = vizData.recommendedTechStack;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0]">
      <GlobalNavbar />

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8 overflow-x-hidden">
        <section className="rounded-3xl border border-white/10 bg-[#111118] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#888899]">
                <Rocket className="h-4 w-4 text-[#6C47FF]" />
                How it works
              </div>
              <h1 className="text-3xl font-black text-white">From customer idea to working startup system</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#888899]">
                VentureForge turns a plain startup idea into a guided workflow: it researches the market,
                estimates the opportunity, maps the MVP architecture, and packages the output so founders
                can make faster product and funding decisions.
              </p>
            </div>
            <button className="inline-flex self-start items-center gap-2 rounded-xl border border-[#00D4AA]/30 bg-[#00D4AA]/10 px-4 py-2 text-sm font-bold text-[#00D4AA] lg:self-auto">
              <Play className="h-4 w-4" />
              Preview stack
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0F] p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-[#888899]">For customers</div>
              <div className="mt-2 text-base font-bold text-white">Less guesswork</div>
              <p className="mt-2 text-sm leading-relaxed text-[#888899]">
                Founders see the idea broken into clear modules, risks, and next steps instead of a vague pitch.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0F] p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-[#888899]">How it runs</div>
              <div className="mt-2 text-base font-bold text-white">Multi-agent pipeline</div>
              <p className="mt-2 text-sm leading-relaxed text-[#888899]">
                The app sequences research, planning, compliance, and finance so each module feeds the next.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0F] p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-[#888899]">What they get</div>
              <div className="mt-2 text-base font-bold text-white">Investor-ready outputs</div>
              <p className="mt-2 text-sm leading-relaxed text-[#888899]">
                Architecture, market intelligence, financials, and pitch content are delivered in one place.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-[#111118] border-2 border-[#111118] p-6 flex flex-col hover:border-[#6C47FF] transition-colors card-hover animate-fadeInUp">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[#6C47FF]" />
                </div>
                <div className="text-xs font-bold text-[#888899] uppercase tracking-widest">Selected Stack</div>
              </div>
              <div className="text-2xl font-black text-white mb-2">{techStack.length > 0 ? `${techStack.length} Layers` : 'TBD'}</div>
              <p className="text-sm text-[#888899] font-medium leading-relaxed">
                {techStack.length > 0 ? `Optimized for ${techStack.some((t) => t.layer === 'AI') ? 'AI workloads' : 'fast time-to-market'} and scalability.` : 'Generating optimal stack configuration...'}
              </p>
            </div>

            <div className="bg-[#111118] border-2 border-[#111118] p-6 flex flex-col hover:border-[#00D4AA] transition-colors card-hover animate-fadeInUp delay-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#00D4AA]" />
                </div>
                <div className="text-xs font-bold text-[#888899] uppercase tracking-widest">Data Layer</div>
              </div>
              <div className="text-2xl font-black text-white mb-2">
                {techStack.find((t) => t.layer?.toLowerCase().includes('database'))?.technology ?? 'TBD'}
              </div>
              <p className="text-sm text-[#888899] font-medium leading-relaxed">
                {techStack.length > 0 ? 'Primary system of record for core entities and transactions.' : 'Defining data persistence strategy...'}
              </p>
            </div>

            <div className="bg-[#111118] border-2 border-[#111118] p-6 flex flex-col hover:border-[#6C47FF] transition-colors card-hover animate-fadeInUp delay-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#6C47FF]/10 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-[#6C47FF]" />
                </div>
                <div className="text-xs font-bold text-[#888899] uppercase tracking-widest">Complexity</div>
              </div>
              <div className="text-2xl font-black text-white mb-2">
                {techStack.length > 0 ? (techStack.filter((t) => t.complexity === 'High').length > 0 ? 'High' : 'Medium') : 'TBD'}
              </div>
              <p className="text-sm text-[#888899] font-medium leading-relaxed">
                {techStack.length > 0 ? 'Development effort estimation based on selected capabilities.' : 'Analyzing project scope and complexity...'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111118] p-6">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#888899]">
            <GitBranch className="h-4 w-4 text-[#00D4AA]" />
            System Architecture (Mermaid)
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0A0A0F] p-6">
            <MermaidDiagram code={architectureToMermaid(architecture)} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-[#111118] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-white">
              <Layers3 className="h-4 w-4 text-[#00D4AA]" />
              Recommended Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {stack.length ? stack.map((item, index) => (
                <span key={`${item.technology ?? 'stack'}-${index}`} className="rounded-full border border-[#6C47FF]/30 bg-[#6C47FF]/10 px-3 py-1 text-xs font-bold text-[#C9BEFF]">
                  {item.technology ?? 'Technology'}
                </span>
              )) : <span className="text-sm text-[#888899]">The backend has not produced a stack yet.</span>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111118] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-white">
              <Cpu className="h-4 w-4 text-[#6C47FF]" />
              Why this helps
            </div>
            <p className="text-sm leading-relaxed text-[#888899]">
              This view explains the internal system in customer terms: it shows the architecture, the flow of work,
              and the business outcome so users can understand what the product does before they commit.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0A0F] px-3 py-1 text-xs font-bold text-[#00D4AA]">
              <Server className="h-3.5 w-3.5" />
              Ready for iteration
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0A0F] px-3 py-1 text-xs font-bold text-[#888899]">
              <Sparkles className="h-3.5 w-3.5" />
              Uses live backend state when available
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
