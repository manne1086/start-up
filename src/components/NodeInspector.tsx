import { memo } from 'react';
import { ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react';
import type { ArchitectureNode, ArchitectureEdge } from './architecture-types';

export default memo(function NodeInspector({
  node,
  incoming,
  outgoing,
  onClose,
}: {
  node: ArchitectureNode | null;
  incoming: ArchitectureEdge[];
  outgoing: ArchitectureEdge[];
  onClose: () => void;
}) {
  return (
    <aside className={`absolute right-4 top-4 z-20 w-[320px] rounded-3xl border border-white/10 bg-[#0D0D14]/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all ${node ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-6 opacity-0'}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#888899]">Node Inspector</div>
          <div className="mt-1 text-lg font-black text-white">{node?.label ?? 'Select a node'}</div>
        </div>
        <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#888899] hover:text-white">
          Close
        </button>
      </div>
      {node ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#111118] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#888899]">
              <Info className="h-3.5 w-3.5 text-[#00D4AA]" />
              Details
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="text-[#888899]">Technology</span><span className="font-semibold text-white">{node.label}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[#888899]">Layer</span><span className="font-semibold text-white">{node.layer}</span></div>
              <div className="flex items-start justify-between gap-3"><span className="text-[#888899]">Purpose</span><span className="max-w-[180px] text-right font-medium text-white">{node.description}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111118] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#888899]">
              <ArrowDownLeft className="h-3.5 w-3.5 text-[#6C47FF]" />
              Incoming
            </div>
            <div className="space-y-2">
              {incoming.length ? incoming.map((edge) => <div key={`${edge.from}-${edge.to}`} className="rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-sm text-white">{edge.label || `${edge.from} → ${edge.to}`}</div>) : <div className="text-sm text-[#888899]">No incoming edges</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111118] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#888899]">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#00D4AA]" />
              Outgoing
            </div>
            <div className="space-y-2">
              {outgoing.length ? outgoing.map((edge) => <div key={`${edge.from}-${edge.to}`} className="rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-sm text-white">{edge.label || `${edge.from} → ${edge.to}`}</div>) : <div className="text-sm text-[#888899]">No outgoing edges</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#111118] p-4 text-sm text-[#888899]">Click a node to inspect its connections.</div>
      )}
    </aside>
  );
});
