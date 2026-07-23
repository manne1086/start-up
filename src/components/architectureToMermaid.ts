/**
 * Converts an ArchitectureModel (from the MVP agent output) into
 * Mermaid flowchart syntax that MermaidDiagram can render.
 */

import type { ArchitectureModel, ArchitectureNode } from './architecture-types';

const NODE_TYPE_SHAPES: Record<string, (label: string) => string> = {
  frontend: (l) => `(["${l}"])`,          // stadium
  ui: (l) => `(["${l}"])`,
  backend: (l) => `["${l}"]`,               // rectangle
  api: (l) => `["${l}"]`,
  service: (l) => `["${l}"]`,
  ai: (l) => `{{"${l}"}}`,                  // hexagon
  agent: (l) => `{{"${l}"}}`,
  llm: (l) => `{{"${l}"}}`,
  database: (l) => `[("${l}")]`,           // cylinder
  storage: (l) => `[("${l}")]`,
  cache: (l) => `[("${l}")]`,
  external: (l) => `(("${l}"))`,          // circle
  user: (l) => `(("${l}"))`,
  queue: (l) => `>"${l}"]`,                // flag
};

function shape(node: ArchitectureNode): string {
  const fn = NODE_TYPE_SHAPES[(node.type ?? '').toLowerCase()] ?? ((l: string) => `["${l}"]`);
  return fn(escapeLabel(node.label ?? node.id));
}

function escapeLabel(s: string): string {
  return s.replace(/"/g, "'").replace(/\n/g, ' ');
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Build a `flowchart LR` (left-to-right) diagram grouped by layer.
 * Nodes with the same `layer` end up in a subgraph so the visual hierarchy
 * matches the intended architecture.
 */
export function architectureToMermaid(model: ArchitectureModel): string {
  const lines: string[] = ['flowchart LR'];

  // Vibrant, colorful node style classes with strong fills + glow-like borders
  lines.push('  classDef frontend fill:#00D4AA,stroke:#00FFCC,stroke-width:3px,color:#0A0A0F,font-weight:bold');
  lines.push('  classDef backend  fill:#6C47FF,stroke:#9B7DFF,stroke-width:3px,color:#FFFFFF,font-weight:bold');
  lines.push('  classDef ai       fill:#FF6B9D,stroke:#FF8FB6,stroke-width:3px,color:#FFFFFF,font-weight:bold');
  lines.push('  classDef database fill:#FFB800,stroke:#FFCC33,stroke-width:3px,color:#0A0A0F,font-weight:bold');
  lines.push('  classDef external fill:#4EA8DE,stroke:#7CC0EB,stroke-width:3px,color:#FFFFFF,font-weight:bold');
  lines.push('  classDef cache    fill:#F76F53,stroke:#FF8F70,stroke-width:3px,color:#FFFFFF,font-weight:bold');
  lines.push('  classDef queue    fill:#B47AEA,stroke:#CB9CF5,stroke-width:3px,color:#FFFFFF,font-weight:bold');
  // Colorful edge styling
  lines.push('  linkStyle default stroke:#00D4AA,stroke-width:2.5px');

  // Group nodes by layer
  const layers = [...(model.layers ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const nodesByLayer = new Map<string, ArchitectureNode[]>();
  for (const n of model.nodes ?? []) {
    const key = n.layer || 'default';
    if (!nodesByLayer.has(key)) nodesByLayer.set(key, []);
    nodesByLayer.get(key)!.push(n);
  }

  // Emit subgraphs per layer
  const orderedLayerIds = layers.length > 0 ? layers.map((l) => l.id) : [...nodesByLayer.keys()];
  for (const layerId of orderedLayerIds) {
    const nodes = nodesByLayer.get(layerId) ?? [];
    if (nodes.length === 0) continue;
    const layer = layers.find((l) => l.id === layerId);
    const layerLabel = escapeLabel(layer?.label ?? layerId);
    lines.push(`  subgraph ${safeId(layerId)}["${layerLabel}"]`);
    lines.push('    direction TB');
    for (const n of nodes) {
      lines.push(`    ${safeId(n.id)}${shape(n)}`);
    }
    lines.push('  end');
  }

  // Loose nodes (no layer or unknown layer)
  const knownLayerIds = new Set(orderedLayerIds);
  for (const [layerKey, nodes] of nodesByLayer) {
    if (knownLayerIds.has(layerKey)) continue;
    for (const n of nodes) {
      lines.push(`  ${safeId(n.id)}${shape(n)}`);
    }
  }

  // Edges
  for (const e of model.edges ?? []) {
    const from = safeId(e.from);
    const to = safeId(e.to);
    const label = e.label ? `|${escapeLabel(e.label)}|` : '';
    lines.push(`  ${from} -->${label} ${to}`);
  }

  // Apply classes to nodes
  for (const n of model.nodes ?? []) {
    const t = (n.type ?? '').toLowerCase();
    let cls = 'backend';
    if (t.includes('front') || t === 'ui') cls = 'frontend';
    else if (t.includes('ai') || t.includes('llm') || t.includes('agent')) cls = 'ai';
    else if (t.includes('cache') || t.includes('redis')) cls = 'cache';
    else if (t.includes('queue') || t.includes('mq') || t.includes('bus')) cls = 'queue';
    else if (t.includes('db') || t.includes('database') || t.includes('storage')) cls = 'database';
    else if (t.includes('user') || t.includes('external')) cls = 'external';
    lines.push(`  class ${safeId(n.id)} ${cls}`);
  }

  return lines.join('\n');
}
