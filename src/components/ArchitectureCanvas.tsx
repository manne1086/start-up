import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useNodesInitialized,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type Viewport,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Cpu } from 'lucide-react';
import type { ArchitectureModel } from './architecture-types';
import { useArchitectureLayout } from './useArchitectureLayout';
import SketchNode from './SketchNode';
import SketchEdge from './SketchEdge';
import NodeInspector from './NodeInspector';
import ArchitectureToolbar from './ArchitectureToolbar';

type FlowNode = Node<{ id: string; label: string; type: string; layer: string; description: string }>;

const nodeTypes = { sketchNode: SketchNode };
const edgeTypes = { sketchEdge: SketchEdge };

function EmptyState() {
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 h-[480px] w-full overflow-hidden border border-white/10 bg-[#0D0D14]"
         style={{ borderRadius: '24px' }}>
      <div className="text-center p-5">
        <div className="mb-4 flex justify-center">
          <div className="p-3 bg-[#0A0A0F] border border-white/10" style={{ borderRadius: '16px' }}>
            <Cpu className="text-[#00D4AA]" style={{ width: 40, height: 40 }} />
          </div>
        </div>
        <h5 className="text-lg text-white font-bold mb-2">Architecture Diagram Pending</h5>
        <p className="text-[#888899] text-sm">
          The AI agents are generating your system architecture.<br />
          Complete the generation to see your interactive diagram.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {['Frontend', 'API', 'Database', 'AI Layer'].map((layer) => (
            <span key={layer} className="rounded-full border border-white/10 bg-[#0A0A0F] text-[#888899] px-3 py-1.5 text-xs font-bold">
              {layer}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CanvasInner({ architecture }: { architecture: ArchitectureModel }) {
  const layout = useArchitectureLayout(architecture);
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const nodesInitialized = useNodesInitialized();
  const hasFitRef = useRef(false);

  const nodes = useMemo<FlowNode[]>(
    () =>
      architecture.nodes.map((node, index) => ({
        id: node.id,
        type: 'sketchNode',
        position: layout.positions.get(node.id) ?? { x: 0, y: 0 },
        data: { ...node },
        draggable: true,
        selectable: true,
        // Explicit measured dimensions so fitView calculates zoom correctly
        measured: { width: layout.nodeWidth, height: layout.nodeHeight },
        width: layout.nodeWidth,
        height: layout.nodeHeight,
        style: {
          width: layout.nodeWidth,
          height: layout.nodeHeight,
          opacity: hoveredNodeId && hoveredNodeId !== node.id && selectedNodeId !== node.id ? 0.28 : 1,
          transform: `rotate(${index % 2 === 0 ? -0.35 : 0.3}deg)`,
        },
      })),
    [architecture.nodes, hoveredNodeId, layout.positions, layout.nodeWidth, layout.nodeHeight, selectedNodeId]
  );

  const edges = useMemo<Edge[]>(
    () =>
      architecture.edges.map((edge, index) => ({
        id: `${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'sketchEdge',
        label: edge.label,
        animated: true,
        data: { edgeLabel: edge.label },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00D4AA' },
        style: {
          stroke:
            selectedNodeId && selectedNodeId !== edge.from && selectedNodeId !== edge.to
              ? 'rgba(108,71,255,0.15)'
              : '#6C47FF',
          strokeWidth:
            selectedNodeId && selectedNodeId !== edge.from && selectedNodeId !== edge.to ? 1.6 : 2.6,
          strokeDasharray: '7 5',
        },
      })),
    [architecture.edges, selectedNodeId]
  );

  const selectedNode = architecture.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const incoming = selectedNode ? architecture.edges.filter((e) => e.to === selectedNode.id) : [];
  const outgoing = selectedNode ? architecture.edges.filter((e) => e.from === selectedNode.id) : [];

  const centerGraph = useCallback(() => void fitView({ padding: 0.15, duration: 400 }), [fitView]);
  const resetLayout = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    void fitView({ padding: 0.15, duration: 400 });
  }, [fitView]);

  // Wait for nodes to be initialized (measured by ReactFlow) before fitting
  useEffect(() => {
    if (nodesInitialized && !hasFitRef.current) {
      hasFitRef.current = true;
      // Small delay to ensure DOM layout is complete
      requestAnimationFrame(() => {
        void fitView({ padding: 0.15, duration: 600 });
      });
    }
  }, [nodesInitialized, fitView]);

  useEffect(() => {
    if (!selectedNodeId) return;
    const pos = layout.positions.get(selectedNodeId);
    if (pos) void setViewport({ x: -pos.x + 180, y: -pos.y + 80, zoom: 1 });
  }, [layout.positions, selectedNodeId, setViewport]);

  const handleNodeClick: NodeMouseHandler = (_e, node) => setSelectedNodeId(node.id);
  const handleNodeDoubleClick: NodeMouseHandler = (_e, node) => {
    const pos = layout.positions.get(node.id);
    if (pos) void setViewport({ x: -pos.x + 120, y: -pos.y + 60, zoom: 1.15 });
  };

  return (
    <div className="flex flex-col relative w-full overflow-hidden border border-white/10 bg-[#0D0D14]"
         style={{ height: 'min(760px, calc(100vh - 280px))', borderRadius: '24px' }}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 bg-[#0A0A0F]/90 px-4 py-3 backdrop-blur-md z-10">
        <div>
          <div className="text-sm font-black text-white">{architecture.title}</div>
          <div className="text-[11px] text-[#888899]">Interactive layered system diagram</div>
        </div>
        <div className="w-full overflow-x-auto pb-1 sm:w-auto sm:pb-0 scrollbar-hide">
          <ArchitectureToolbar onReset={resetLayout} onCenter={centerGraph} onZoomIn={zoomIn} onZoomOut={zoomOut} />
        </div>
      </div>

      <div className="relative flex-1 w-full">
        <NodeInspector node={selectedNode} incoming={incoming} outgoing={outgoing} onClose={() => setSelectedNodeId(null)} />

        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          panOnScroll
          zoomOnScroll
          nodesDraggable
          nodesConnectable={false}
          minZoom={0.2}
          maxZoom={2}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeMouseEnter={(_e, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(255,255,255,0.07)" />
          <MiniMap
            zoomable
            pannable
            nodeColor={(n) => (n.id === selectedNodeId ? '#00D4AA' : '#6C47FF')}
            maskColor="rgba(10,10,15,0.72)"
            style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default memo(function ArchitectureCanvas({ architecture }: { architecture: ArchitectureModel }) {
  const hasNodes = architecture?.nodes?.length > 0;

  if (!hasNodes) {
    return <EmptyState />;
  }

  return (
    <ReactFlowProvider>
      <CanvasInner architecture={architecture} />
    </ReactFlowProvider>
  );
});
