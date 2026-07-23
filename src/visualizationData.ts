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

type TechStackItem = { layer: string; technology: string; reason: string; complexity: 'Low' | 'Medium' | 'High' };
type ArchNode = { id: string; label: string; type: string; layer: string; description: string };
type ArchEdge = { from: string; to: string; label: string };
type ArchLayer = { id: string; label: string; order: number };

const LAYER_BUCKETS: Array<{ match: RegExp; id: string; label: string; order: number }> = [
  { match: /front|ui|client|web|mobile/i, id: 'frontend', label: 'Frontend', order: 1 },
  { match: /back|api|server|service|orchestrat|auth|cache/i, id: 'backend', label: 'Backend', order: 2 },
  { match: /data|database|db|storage/i, id: 'data', label: 'Data', order: 3 },
  { match: /ai|ml|llm|model|agent/i, id: 'ai', label: 'AI', order: 4 },
];

function bucketFor(layer: string) {
  return LAYER_BUCKETS.find((b) => b.match.test(layer)) ?? { id: 'other', label: 'Other', order: 5 };
}

function slugify(value: string, taken: Set<string>) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'node';
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

const FALLBACK_ARCHITECTURE = {
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

// Builds the architecture diagram from the actual AI-generated recommended stack.
// When the stack is thin (< 6 components), auto-augments with commonly-needed
// infrastructure (auth, cache, storage, users, LLM, payment) inferred from the
// idea so the diagram looks rich and realistic instead of a bare 3-node chain.
function buildArchitectureFromStack(stack: TechStackItem[], idea: string = '') {
  const takenIds = new Set<string>();
  const nodes: ArchNode[] = stack.map((item) => {
    const bucket = bucketFor(item.layer);
    return {
      id: slugify(item.technology, takenIds),
      label: item.technology,
      type: bucket.id,
      layer: bucket.id,
      description: item.reason,
    };
  });

  // Auto-augment thin stacks with realistic infrastructure based on idea keywords
  const lower = idea.toLowerCase();
  const hasAi = /\bai\b|agent|llm|copilot|assistant|gpt|ml|recommend|nlp|chat/.test(lower);
  const hasPay = /pay|checkout|subscription|billing|store|marketplace|ecommerce|book/.test(lower);
  const hasMedia = /video|image|photo|audio|upload|content|media|stream|file/.test(lower);
  const hasRealtime = /chat|realtime|live|social|messag|notif|match/.test(lower);
  const hasAuth = true; // Every app needs auth
  const hasMap = /map|location|delivery|ride|logist|track/.test(lower);
  const hasEmail = /email|newsletter|invite|notif/.test(lower);

  const hasFrontend = nodes.some((n) => n.layer === 'frontend');
  const hasBackend = nodes.some((n) => n.layer === 'backend');
  const hasData = nodes.some((n) => n.layer === 'data');
  const hasAiNode = nodes.some((n) => n.layer === 'ai');

  // Users (always add)
  const users: ArchNode = { id: slugify('users', takenIds), label: 'Users', type: 'external', layer: 'client', description: 'End users of the product' };
  nodes.unshift(users);

  if (!hasFrontend) {
    nodes.push({ id: slugify('web', takenIds), label: 'Web App', type: 'frontend', layer: 'frontend', description: 'Next.js user interface' });
  }
  if (!hasBackend) {
    nodes.push({ id: slugify('api', takenIds), label: 'API Gateway', type: 'backend', layer: 'backend', description: 'Main backend API' });
  }
  if (hasAuth && !nodes.some((n) => /auth/i.test(n.label))) {
    nodes.push({ id: slugify('auth', takenIds), label: 'Auth Service', type: 'backend', layer: 'backend', description: 'Login, sessions, OAuth' });
  }
  if (!hasData) {
    nodes.push({ id: slugify('db', takenIds), label: 'PostgreSQL', type: 'database', layer: 'data', description: 'Primary data store' });
  }
  // Cache is generally useful
  if (!nodes.some((n) => /redis|cache/i.test(n.label))) {
    nodes.push({ id: slugify('cache', takenIds), label: 'Redis', type: 'cache', layer: 'data', description: 'Session & response cache' });
  }
  if (hasMedia && !nodes.some((n) => /s3|storage|blob/i.test(n.label))) {
    nodes.push({ id: slugify('storage', takenIds), label: 'S3 Storage', type: 'storage', layer: 'data', description: 'Files, media, uploads' });
  }
  if (hasAi && !hasAiNode) {
    nodes.push({ id: slugify('llm', takenIds), label: 'LLM API', type: 'ai', layer: 'ai', description: 'Language model inference' });
  }
  if (hasAi && !nodes.some((n) => /vector|embed|pinecone|weaviate/i.test(n.label))) {
    nodes.push({ id: slugify('vector', takenIds), label: 'Vector DB', type: 'database', layer: 'ai', description: 'Embeddings & semantic search' });
  }
  if (hasPay) {
    nodes.push({ id: slugify('stripe', takenIds), label: 'Stripe', type: 'external', layer: 'external', description: 'Payments & subscriptions' });
  }
  if (hasMap) {
    nodes.push({ id: slugify('maps', takenIds), label: 'Google Maps', type: 'external', layer: 'external', description: 'Geocoding & routing' });
  }
  if (hasEmail) {
    nodes.push({ id: slugify('email', takenIds), label: 'Email (Resend)', type: 'external', layer: 'external', description: 'Transactional email' });
  }
  if (hasRealtime && !nodes.some((n) => /websocket|pusher|ably/i.test(n.label))) {
    nodes.push({ id: slugify('ws', takenIds), label: 'WebSockets', type: 'backend', layer: 'backend', description: 'Real-time messaging' });
  }

  const layerMap = new Map<string, ArchLayer>();
  const ORDER: Record<string, number> = { client: 0, frontend: 1, backend: 2, ai: 3, data: 4, external: 5 };
  const LABEL: Record<string, string> = { client: 'Client', frontend: 'Frontend', backend: 'Backend', ai: 'AI Layer', data: 'Data Layer', external: 'External Services' };
  nodes.forEach((n) => {
    if (layerMap.has(n.layer)) return;
    layerMap.set(n.layer, { id: n.layer, label: LABEL[n.layer] ?? n.layer, order: ORDER[n.layer] ?? 6 });
  });
  const layers = Array.from(layerMap.values()).sort((a, b) => a.order - b.order);

  const byLayer = (layerId: string) => nodes.filter((n) => n.layer === layerId);
  const client = byLayer('client');
  const frontend = byLayer('frontend');
  const backend = byLayer('backend');
  const data = byLayer('data');
  const ai = byLayer('ai');
  const external = byLayer('external');

  const edges: ArchEdge[] = [];
  const push = (from: string, to: string, label: string) => edges.push({ from, to, label });

  // Users → Frontend
  if (client.length && frontend.length) {
    client.forEach((c) => frontend.slice(0, 1).forEach((f) => push(c.id, f.id, 'Uses')));
  }
  // Frontend → Backend (main API)
  const apiNode = backend.find((n) => /api|gateway/i.test(n.label)) ?? backend[0];
  if (frontend.length && apiNode) {
    frontend.forEach((f) => push(f.id, apiNode.id, 'HTTPS'));
  }
  // Frontend → Auth
  const authNode = backend.find((n) => /auth/i.test(n.label));
  if (frontend.length && authNode) {
    frontend.slice(0, 1).forEach((f) => push(f.id, authNode.id, 'Login'));
  }
  // API → other backend services (except itself)
  if (apiNode) {
    backend.filter((n) => n.id !== apiNode.id && !/auth/i.test(n.label)).forEach((b) => push(apiNode.id, b.id, 'Calls'));
  }
  // API → Data
  if (apiNode) {
    data.forEach((d) => {
      const label = /cache|redis/i.test(d.label) ? 'Cache' : /s3|storage/i.test(d.label) ? 'Files' : 'Read/Write';
      push(apiNode.id, d.id, label);
    });
  }
  // API → AI
  if (apiNode) {
    ai.forEach((a) => push(apiNode.id, a.id, /vector/i.test(a.label) ? 'Search' : 'Prompt'));
  }
  // API → External
  if (apiNode) {
    external.forEach((e) => {
      const label = /stripe/i.test(e.label) ? 'Charge' : /map/i.test(e.label) ? 'Geocode' : /email/i.test(e.label) ? 'Send' : 'API';
      push(apiNode.id, e.id, label);
    });
  }

  // Fallback: if we somehow got no edges, chain them
  if (edges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      push(nodes[i].id, nodes[i + 1].id, '');
    }
  }

  return {
    title: 'MVP Architecture',
    layout: 'layered' as const,
    theme: 'excalidraw-sketch' as const,
    layers: layers.length ? layers : [{ id: 'stack', label: 'Stack', order: 1 }],
    nodes,
    edges,
  };
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

  const architecture = Array.isArray(mvp?.recommended_stack) && mvp.recommended_stack.length
    ? buildArchitectureFromStack(recommendedTechStack, idea)
    : buildArchitectureFromStack(inferTechStack(idea), idea);

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
