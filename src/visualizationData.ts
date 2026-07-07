type BackendState = Record<string, any> | null | undefined;

type Competitor = {
  name: string;
  founded: string;
  funding: string;
  pricing: string;
  focus: string;
  threat: 'High' | 'Medium' | 'Low';
};

type VisualizationData = {
  startupSummary: {
    name: string;
    description: string;
    industry: string;
    stage: string;
  };
  recommendedTechStack: Array<{
    layer: string;
    technology: string;
    reason: string;
    complexity: 'Low' | 'Medium' | 'High';
  }>;
  architecture: {
    title: string;
    layout: 'layered';
    theme: 'excalidraw-sketch';
    layers: Array<{ id: string; label: string; order: number }>;
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      layer: string;
      description: string;
    }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
  marketResearch: {
    tam: string;
    sam: string;
    som: string;
    competitors: Competitor[];
    gaps: string[];
    sources: string[];
  };
  marketFunnel: {
    theme: 'excalidraw-sketch';
    currency: 'USD';
    levels: Array<{ name: 'TAM' | 'SAM' | 'SOM'; value: number; description: string }>;
  };
  competitorAnalysis: Competitor[];
  userPersonas: Array<{
    name: string;
    role: string;
    painPoints: string[];
    goals: string[];
    trigger: string;
  }>;
  revenueModel: {
    model: string;
    pricingTiers: Array<{ name: string; price: string; value: string }>;
    channels: string[];
  };
  financialForecast: Array<{ year: number; revenue: number; ebitda: number; fcf: number }>;
  financialChart: {
    theme: 'excalidraw-sketch';
    currency: 'USD';
    series: Array<{ name: string; values: number[] }>;
    years: number[];
  };
  mvpRoadmap: Array<{
    phase: number;
    title: string;
    startWeek: number;
    endWeek: number;
    tasks: string[];
  }>;
  roadmapTimeline: {
    theme: 'excalidraw-sketch';
    phases: Array<{
      phase: number;
      title: string;
      startWeek: number;
      endWeek: number;
      deliverables: string[];
      tasks: string[];
    }>;
  };
  risks: Array<{
    title: string;
    severity: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }>;
  recommendations: string[];
};

function money(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value / 1000)}K`;
}

function normalizeCompetitors(market: BackendState): Competitor[] {
  const competitors = Array.isArray(market?.competitors) ? market.competitors : [];
  return competitors.slice(0, 3).map((competitor: any) => ({
    name: String(competitor?.name ?? 'Competitor'),
    founded: String(competitor?.founded ?? '-'),
    funding: String(competitor?.funding ?? '-'),
    pricing: String(competitor?.pricing ?? '-'),
    focus: String(competitor?.focus ?? '-'),
    threat: (competitor?.threat_level ?? 'Medium') as 'High' | 'Medium' | 'Low',
  }));
}

function inferTechStack(idea: string) {
  const lower = idea.toLowerCase();
  const useAi = lower.includes('ai') || lower.includes('agent') || lower.includes('copilot') || lower.includes('assistant');
  const useMarketplace = lower.includes('marketplace') || lower.includes('booking') || lower.includes('platform');
  const useB2B = lower.includes('saas') || lower.includes('workflow') || lower.includes('crm') || lower.includes('ops');

  return [
    { layer: 'Frontend', technology: 'Next.js', reason: 'Fast UI delivery and SSR-ready marketing pages.', complexity: 'Low' as const },
    { layer: 'Backend', technology: 'FastAPI', reason: 'Typed APIs with strong async support for product workflows.', complexity: 'Low' as const },
    { layer: 'Database', technology: useMarketplace ? 'PostgreSQL' : 'PostgreSQL + MongoDB', reason: 'Relational core with flexible metadata storage.', complexity: 'Medium' as const },
    ...(useAi
      ? [{ layer: 'AI', technology: 'OpenAI / Gemini', reason: 'Model inference for generation, ranking, and recommendations.', complexity: 'Medium' as const }]
      : [{ layer: 'AI', technology: 'LLM API', reason: 'Optional AI workflows for assistants and synthesis.', complexity: 'Medium' as const }]),
    ...(useB2B ? [{ layer: 'Cache', technology: 'Redis', reason: 'Speed up sessions, queues, and repeated reads.', complexity: 'Low' as const }] : []),
    ...(useMarketplace ? [{ layer: 'Storage', technology: 'S3', reason: 'Store uploads, media, and generated artifacts.', complexity: 'Low' as const }] : []),
  ];
}

function inferRoadmap(idea: string) {
  const lower = idea.toLowerCase();
  const hasAi = lower.includes('ai') || lower.includes('agent') || lower.includes('assistant');
  return [
    { phase: 1, title: 'Foundation', startWeek: 1, endWeek: 2, tasks: ['Authentication', 'Landing Page', 'Database'], deliverables: ['Auth flow', 'Brand shell'] },
    { phase: 2, title: 'Core Product', startWeek: 3, endWeek: 4, tasks: ['Primary workflow', 'CRUD API', 'Dashboard'], deliverables: ['End-to-end core flow'] },
    { phase: 3, title: hasAi ? 'AI Layer' : 'Growth Layer', startWeek: 5, endWeek: 6, tasks: hasAi ? ['Prompting', 'Model calls', 'Guardrails'] : ['Analytics', 'Billing', 'Retention'], deliverables: [hasAi ? 'AI-assisted output' : 'Monetization hooks'] },
    { phase: 4, title: 'Launch', startWeek: 7, endWeek: 8, tasks: ['Beta release', 'Telemetry', 'Support'], deliverables: ['Public beta'] },
  ];
}

export function buildVisualizationData(backendState: BackendState): VisualizationData {
  const idea = String(backendState?.idea ?? backendState?.startup_name ?? 'Startup');
  const market = backendState?.market ?? {};
  const financials = backendState?.financials ?? {};
  const mvp = backendState?.mvp ?? {};
  const recommendedTechStack = Array.isArray(mvp?.recommended_stack) && mvp.recommended_stack.length
    ? mvp.recommended_stack.map((item: any) => ({
        layer: String(item?.layer ?? 'Layer'),
        technology: String(item?.technology ?? 'Tech'),
        reason: String(item?.reason ?? 'Recommended for the MVP.'),
        complexity: (item?.complexity ?? 'Medium') as 'Low' | 'Medium' | 'High',
      }))
    : inferTechStack(idea);

  const architecture = {
    title: 'MVP Architecture',
    layout: 'layered' as const,
    theme: 'excalidraw-sketch' as const,
    layers: [
      { id: 'frontend', label: 'Frontend', order: 1 },
      { id: 'backend', label: 'Backend', order: 2 },
      { id: 'data', label: 'Data', order: 3 },
      { id: 'ai', label: 'AI', order: 4 },
    ],
    nodes: [
      { id: 'web', label: 'Next.js', type: 'frontend', layer: 'frontend', description: 'User interface and landing pages.' },
      { id: 'api', label: 'FastAPI', type: 'api', layer: 'backend', description: 'Main application API and orchestration.' },
      { id: 'auth', label: 'Auth', type: 'auth', layer: 'backend', description: 'Login and session handling.' },
      { id: 'db', label: 'PostgreSQL', type: 'database', layer: 'data', description: 'System of record for core entities.' },
      { id: 'cache', label: 'Redis', type: 'cache', layer: 'data', description: 'Session and response caching.' },
      { id: 'storage', label: 'S3', type: 'storage', layer: 'data', description: 'File and artifact storage.' },
      { id: 'llm', label: 'LLM API', type: 'llm', layer: 'ai', description: 'Reasoning, generation, and summarization.' },
    ],
    edges: [
      { from: 'web', to: 'api', label: 'API' },
      { from: 'web', to: 'auth', label: 'Login' },
      { from: 'api', to: 'db', label: 'Read / Write' },
      { from: 'api', to: 'cache', label: 'Cache' },
      { from: 'api', to: 'storage', label: 'Files' },
      { from: 'api', to: 'llm', label: 'Prompt' },
    ],
  };

  const competitors = normalizeCompetitors(market);
  const marketResearch = {
    tam: String(market?.tam ?? '$4.2B'),
    sam: String(market?.sam ?? '$820M'),
    som: String(market?.som ?? '$120M'),
    competitors,
    gaps: Array.isArray(market?.market_gaps) && market.market_gaps.length ? market.market_gaps.map(String) : [
      'Workflow automation',
      'Better onboarding',
      'Distribution partnerships',
    ],
    sources: Array.isArray(market?.raw_search_results) ? market.raw_search_results.slice(0, 3).map(String) : [],
  };

  const tamValue = Number(String(marketResearch.tam).replace(/[^0-9.]/g, '')) || 4200;
  const samValue = Number(String(marketResearch.sam).replace(/[^0-9.]/g, '')) || 820;
  const somValue = Number(String(marketResearch.som).replace(/[^0-9.]/g, '')) || 120;

  const financialForecast = Array.isArray(financials?.projections) && financials.projections.length
    ? financials.projections.slice(0, 5).map((row: any) => ({
        year: Number(row?.year ?? 0),
        revenue: Number(row?.revenue ?? 0),
        ebitda: Number(row?.ebitda ?? 0),
        fcf: Number(row?.fcf ?? 0),
      }))
    : [
        { year: 1, revenue: 120000, ebitda: -780000, fcf: -920000 },
        { year: 2, revenue: 550000, ebitda: -450000, fcf: -510000 },
        { year: 3, revenue: 1800000, ebitda: 150000, fcf: 90000 },
        { year: 4, revenue: 4200000, ebitda: 980000, fcf: 760000 },
        { year: 5, revenue: 8400000, ebitda: 2200000, fcf: 1850000 },
      ];

  return {
    startupSummary: {
      name: String(backendState?.startup_name ?? idea),
      description: String(backendState?.business_plan?.solution ?? backendState?.business_plan?.value_proposition ?? 'AI-powered startup concept with an investor-ready MVP.'),
      industry: String(backendState?.industry ?? 'Technology'),
      stage: String(backendState?.status ?? 'running'),
    },
    recommendedTechStack,
    architecture,
    marketResearch,
    marketFunnel: {
      theme: 'excalidraw-sketch',
      currency: 'USD',
      levels: [
        { name: 'TAM', value: Math.max(tamValue, samValue * 5, somValue * 20), description: 'Total addressable opportunity' },
        { name: 'SAM', value: Math.max(samValue, somValue * 5), description: 'Serviceable segment' },
        { name: 'SOM', value: somValue, description: 'Obtainable share in 24 months' },
      ],
    },
    competitorAnalysis: competitors,
    userPersonas: [
      {
        name: 'Primary Buyer',
        role: 'Decision maker',
        painPoints: ['Too much manual work', 'Slow reporting', 'Fragmented tools'],
        goals: ['Save time', 'See ROI quickly', 'Reduce operational drag'],
        trigger: 'Needs a faster way to execute core workflows.',
      },
      {
        name: 'Power User',
        role: 'Daily operator',
        painPoints: ['Context switching', 'Repetitive tasks', 'Lack of automation'],
        goals: ['Streamline work', 'Track progress', 'Trust outputs'],
        trigger: 'Adopts tools that remove repetitive steps.',
      },
    ],
    revenueModel: {
      model: String(backendState?.business_plan?.revenue_model ?? 'Subscription + usage-based pricing'),
      pricingTiers: [
        { name: 'Starter', price: '$49/mo', value: 'Single team or individual' },
        { name: 'Growth', price: '$199/mo', value: 'Small teams with automation needs' },
        { name: 'Scale', price: '$499/mo', value: 'Multi-team, advanced controls' },
      ],
      channels: ['Direct sales', 'Self-serve', 'Partners'],
    },
    financialForecast,
    financialChart: {
      theme: 'excalidraw-sketch',
      currency: 'USD',
      series: [
        { name: 'Revenue', values: financialForecast.map((row) => row.revenue) },
        { name: 'EBITDA', values: financialForecast.map((row) => row.ebitda) },
        { name: 'Free Cash Flow', values: financialForecast.map((row) => row.fcf) },
      ],
      years: financialForecast.map((row) => row.year),
    },
    mvpRoadmap: inferRoadmap(idea),
    roadmapTimeline: {
      theme: 'excalidraw-sketch',
      phases: inferRoadmap(idea).map((phase) => ({
        phase: phase.phase,
        title: phase.title,
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        deliverables: phase.deliverables,
        tasks: phase.tasks,
      })),
    },
    risks: [
      { title: 'Market timing', severity: 'Medium', mitigation: 'Ship a narrow wedge and validate demand early.' },
      { title: 'Data quality', severity: 'High', mitigation: 'Add guardrails, validation, and human review loops.' },
      { title: 'Distribution', severity: 'Medium', mitigation: 'Pair product launches with outbound and partnerships.' },
    ],
    recommendations: [
      'Launch with one tightly scoped workflow.',
      'Instrument activation and retention from day one.',
      'Keep the AI layer assistive before making it autonomous.',
      'Prioritize a short sales cycle and a clear ROI story.',
    ],
  };
}

export function formatMoney(value: number) {
  return money(value);
}
