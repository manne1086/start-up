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
        architecture_diagram?: string;
      }
    | null
    | undefined;

  const architecture = vizData.architecture;
  const stack = mvp?.recommended_stack ?? [];
  const techStack = vizData.recommendedTechStack;

  // Prefer the AI-generated Mermaid diagram when available. Fall back to the
  // stack-derived diagram when the agent hasn't produced one, or if it's obviously
  // truncated (< 3 lines).
  const agentMermaid = (mvp?.architecture_diagram ?? '').trim();
  const isRichAgentDiagram = agentMermaid.split('\n').length >= 4 && /flowchart|graph/i.test(agentMermaid);
  const mermaidCode = isRichAgentDiagram ? agentMermaid : architectureToMermaid(architecture);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F0]">
      <GlobalNavbar />

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8 overflow-x-hidden">
        <section className="rounded-3xl border border-white/10 bg-[#111118] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#6C47FF]">
                <Rocket className="h-4 w-4 text-[#6C47FF]" />
                MVP Architecture
              </div>
              <h1 className="text-3xl font-black text-white">Build roadmap & system design</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#888899]">
                A colorful, interactive blueprint of the recommended system for this idea — including
                the tech stack, data layer, and how each component connects together.
              </p>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#00D4AA]/30 bg-[#00D4AA]/10 px-4 py-2 text-sm font-bold text-[#00D4AA]">
                <Play className="h-4 w-4" />
                {mvp?.estimated_weeks ?? '—'} weeks to build
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#6C47FF]/30 bg-[#6C47FF]/10 px-4 py-2 text-sm font-bold text-[#C9BEFF]">
                <Sparkles className="h-4 w-4" />
                {mvp?.team_size ?? '—'} person team
              </div>
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

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111118] via-[#0F0F18] to-[#111118] p-6 shadow-[0_20px_60px_rgba(108,71,255,0.15)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-white">
              <GitBranch className="h-4 w-4 text-[#00D4AA]" />
              System Architecture Roadmap
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00D4AA]" /> Frontend</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6C47FF]" /> Backend</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF6B9D]" /> AI</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FFB800]" /> Data</span>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#6C47FF]/20 bg-gradient-to-br from-[#0A0A14] to-[#0D0D18] p-8">
            <MermaidDiagram code={mermaidCode} />
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
