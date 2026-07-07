import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, Database, Layers3, MessageSquareMore, ShieldCheck, Boxes, Workflow } from 'lucide-react';
import type { ArchitectureNode } from './architecture-types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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

export default memo(function SketchNode({
  node,
  active,
  dimmed,
  selected,
  onClick,
  onDoubleClick,
}: {
  node: ArchitectureNode;
  active: boolean;
  dimmed: boolean;
  selected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const Icon = iconMap[node.type] ?? iconMap.default;
  const hasTopHandle = node.layer !== 'frontend';
  const hasBottomHandle = node.layer !== 'external';

  return (
    <button
      type="button"
      aria-label={`${node.label} node`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group relative w-[240px] rounded-[28px] border-2 bg-[#111118]/95 p-4 text-left transition-all duration-200 ${selected ? 'border-[#00D4AA] shadow-[0_0_0_1px_rgba(0,212,170,0.3),0_10px_30px_rgba(0,0,0,0.45)]' : 'border-[#2A2A35]'} ${active ? 'scale-[1.02] -rotate-1' : 'rotate-0'} ${dimmed ? 'opacity-30' : 'opacity-100'} hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(108,71,255,0.18)]`}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-70" viewBox="0 0 240 104" fill="none">
        <path d="M10 12 L226 12 L230 24 L226 90 L14 92 L8 22 Z" stroke="rgba(255,255,255,0.08)" strokeWidth="1.4" />
        <path d="M18 18 L96 18" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
      </svg>
      {hasTopHandle ? <Handle id="in" type="target" position={Position.Top} className="!h-2 !w-2 !border-none !bg-[#00D4AA] !opacity-80" /> : null}
      {hasBottomHandle ? <Handle id="out" type="source" position={Position.Bottom} className="!h-2 !w-2 !border-none !bg-[#6C47FF] !opacity-80" /> : null}
      <div className="relative z-10 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#0A0A0F] text-[#00D4AA]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#888899]">
            {node.type}
          </div>
          <div className="text-sm font-black text-white">{node.label}</div>
          <div className="mt-2 text-[11px] leading-relaxed text-[#888899]">{node.description}</div>
        </div>
      </div>
    </button>
  );
});
