import { memo, type ComponentType } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Cpu, Database, Layers3, MessageSquareMore, ShieldCheck, Boxes, Workflow } from 'lucide-react';
import type { ArchitectureNode } from './architecture-types';

type SketchNodeData = ArchitectureNode;
type SketchFlowNode = Node<SketchNodeData, 'sketchNode'>;

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  frontend: Workflow,
  backend: Boxes,
  api: Workflow,
  database: Database,
  cache: Layers3,
  auth: ShieldCheck,
  llm: MessageSquareMore,
  ai: MessageSquareMore,
  storage: Database,
  default: Cpu,
};

// ReactFlow custom node: receives { data, selected, id, ... }
export default memo(function SketchNode({
  data,
  selected,
}: NodeProps<SketchFlowNode>) {
  const node = data;
  const Icon = iconMap[node.type] ?? iconMap.default;
  const hasTopHandle = node.layer !== 'frontend';
  const hasBottomHandle = node.layer !== 'external';

  return (
    <div
      className={`group relative w-[260px] bg-[#111118]/95 p-5 text-left transition-all duration-300 animate-fadeInUp ${
        selected
          ? 'border-[#00D4AA] shadow-[0_0_0_1px_rgba(0,212,170,0.3),0_10px_30px_rgba(0,0,0,0.45)]'
          : 'border-[#2A2A35]'
      } hover:shadow-[0_12px_30px_rgba(108,71,255,0.18)] hover:-translate-y-1`}
      style={{
        border: `2px solid ${selected ? '#00D4AA' : '#2A2A35'}`,
        borderRadius: '16px',
        animationDelay: `${(node as any).order ? (node as any).order * 100 : 0}ms`,
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-70" viewBox="0 0 260 120" fill="none">
        <path d="M10 12 L246 12 L250 24 L246 106 L14 108 L8 22 Z" stroke="rgba(255,255,255,0.08)" strokeWidth="1.4" />
        <path d="M18 18 L106 18" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
      </svg>
      {hasTopHandle ? (
        <Handle id="in" type="target" position={Position.Top} style={{ background: '#00D4AA', width: 8, height: 8, border: 'none', opacity: 0.8 }} />
      ) : null}
      {hasBottomHandle ? (
        <Handle id="out" type="source" position={Position.Bottom} style={{ background: '#6C47FF', width: 8, height: 8, border: 'none', opacity: 0.8 }} />
      ) : null}
      <div className="relative z-10 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-[#0A0A0F] text-[#00D4AA]" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#888899]" style={{ borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
            {node.type}
          </div>
          <div className="text-sm font-black text-white">{node.label}</div>
          <div className="mt-2 text-[11px] leading-relaxed text-[#888899]">{node.description}</div>
        </div>
      </div>
    </div>
  );
});
