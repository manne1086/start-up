import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type Viewport,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ArchitectureModel } from './architecture-types';
import { useArchitectureLayout } from './useArchitectureLayout';
import SketchNode from './SketchNode';
import SketchEdge from './SketchEdge';
import NodeInspector from './NodeInspector';
import ArchitectureToolbar from './ArchitectureToolbar';

type FlowNode = Node<{ id: string; label: string; type: string; layer: string; description: string }>;

const nodeTypes = { sketchNode: SketchNode };
const edgeTypes = { sketchEdge: SketchEdge };

function CanvasInner({ architecture }: { architecture: ArchitectureModel }) {
  const layout = useArchitectureLayout(architecture);
  const { setViewport, fitView, zoomIn, zoomOut } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewport, setViewportState] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const initialLayoutRef = useRef(false);

  const nodes = useMemo<FlowNode[]>(
    () =>
      architecture.nodes.map((node, index) => ({
        id: node.id,
        type: 'sketchNode',
        position: layout.positions.get(node.id) ?? { x: 0, y: 0 },
        data: { ...node },
        sourceHandle: 'out',
        targetHandle: 'in',
        sourcePosition: 'bottom',
        targetPosition: 'top',
        draggable: true,
        selectable: true,
        style: {
          opacity: hoveredNodeId && hoveredNodeId !== node.id && selectedNodeId !== node.id ? 0.28 : 1,
          transform: `rotate(${index % 2 === 0 ? -0.35 : 0.3}deg)`,
        },
      })),
    [architecture.nodes, hoveredNodeId, layout.positions, selectedNodeId]
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
          stroke: selectedNodeId && selectedNodeId !== edge.from && selectedNodeId !== edge.to ? 'rgba(108,71,255,0.15)' : '#6C47FF',
          strokeWidth: selectedNodeId && selectedNodeId !== edge.from && selectedNodeId !== edge.to ? 1.6 : 2.6,
          strokeDasharray: '7 5',
        },
      })),
    [architecture.edges, selectedNodeId]
  );

  const selectedNode = architecture.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const incoming = selectedNode ? architecture.edges.filter((edge) => edge.to === selectedNode.id) : [];
  const outgoing = selectedNode ? architecture.edges.filter((edge) => edge.from === selectedNode.id) : [];

  const centerGraph = () => {
    void fitView({ padding: 0.2, duration: 400 });
  };

  const resetLayout = () => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    void fitView({ padding: 0.2, duration: 400 });
  };

  useEffect(() => {
    if (initialLayoutRef.current) return;
    initialLayoutRef.current = true;
    void fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  useEffect(() => {
    const current = architecture.nodes.find((node) => node.id === selectedNodeId);
    if (!current) return;
    const pos = layout.positions.get(current.id);
    if (pos) {
      void setViewport({ x: -pos.x + 180, y: -pos.y + 80, zoom: 1 });
    }
  }, [architecture.nodes, layout.positions, selectedNodeId, setViewport]);

  const handleNodeClick: NodeMouseHandler = (_event, node) => setSelectedNodeId(node.id);
  const handleNodeDoubleClick: NodeMouseHandler = (_event, node) => {
    const pos = layout.positions.get(node.id);
    if (pos) {
      void setViewport({ x: -pos.x + 120, y: -pos.y + 60, zoom: 1.15 });
    }
  };

  return (
    <div className="relative h-[760px] w-full overflow-hidden rounded-3xl border border-[#23232D] bg-[#0D0D14]">
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#0A0A0F]/90 px-5 py-4 backdrop-blur-md">
        <div>
          <div className="text-sm font-black text-white">{architecture.title}</div>
          <div className="text-xs text-[#888899]">Interactive layered system diagram</div>
        </div>
        <ArchitectureToolbar onReset={resetLayout} onCenter={centerGraph} onZoomIn={zoomIn} onZoomOut={zoomOut} />
      </div>

      <NodeInspector node={selectedNode} incoming={incoming} outgoing={outgoing} onClose={() => setSelectedNodeId(null)} />

      <div className="absolute inset-x-0 bottom-0 top-[73px]">
        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          defaultViewport={viewport}
          panOnScroll
          zoomOnScroll
          nodesDraggable
          nodesConnectable={false}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeMouseEnter={(_event, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onMove={(_event, nextViewport) => setViewportState(nextViewport)}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(255,255,255,0.07)" />
          <MiniMap
            zoomable
            pannable
            nodeColor={(node) => (node.id === selectedNodeId ? '#00D4AA' : '#6C47FF')}
            maskColor="rgba(10,10,15,0.72)"
            style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default memo(function ArchitectureCanvas({ architecture }: { architecture: ArchitectureModel }) {
  return (
    <ReactFlowProvider>
      <CanvasInner architecture={architecture} />
    </ReactFlowProvider>
  );
});
