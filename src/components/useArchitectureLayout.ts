import { useMemo } from 'react';
import type { ArchitectureModel, LayoutNode } from './architecture-types';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 120;
const LAYER_GAP = 220;
const NODE_GAP = 80;
const LEFT_PADDING = 120;
const TOP_PADDING = 80;

export function useArchitectureLayout(architecture: ArchitectureModel) {
  return useMemo(() => {
    const layers = [...architecture.layers].sort((a, b) => a.order - b.order);
    const layerMap = new Map(layers.map((layer, index) => [layer.id, index]));
    const nodesByLayer = new Map<string, LayoutNode[]>();

    layers.forEach((layer) => nodesByLayer.set(layer.id, []));

    architecture.nodes.forEach((node, index) => {
      const layerIndex = layerMap.get(node.layer) ?? 0;
      const list = nodesByLayer.get(node.layer) ?? [];
      list.push({ ...node, x: 0, y: 0, order: index });
      nodesByLayer.set(node.layer, list);
    });

    const widthByLayer = layers.reduce((max, layer) => {
      const count = nodesByLayer.get(layer.id)?.length ?? 0;
      return Math.max(max, count * NODE_WIDTH + Math.max(count - 1, 0) * NODE_GAP);
    }, NODE_WIDTH);

    const positions = new Map<string, { x: number; y: number }>();

    layers.forEach((layer, layerIndex) => {
      const nodes = nodesByLayer.get(layer.id) ?? [];
      const layerWidth = Math.max(widthByLayer, nodes.length * NODE_WIDTH + Math.max(nodes.length - 1, 0) * NODE_GAP);
      const startX = LEFT_PADDING + (Math.max(widthByLayer, layerWidth) - (nodes.length * NODE_WIDTH + Math.max(nodes.length - 1, 0) * NODE_GAP)) / 2;
      nodes.forEach((node, index) => {
        const x = startX + index * (NODE_WIDTH + NODE_GAP);
        const y = TOP_PADDING + layerIndex * LAYER_GAP;
        positions.set(node.id, { x, y });
      });
    });

    const height = TOP_PADDING * 2 + Math.max(layers.length - 1, 0) * LAYER_GAP + NODE_HEIGHT + 120;
    const width = Math.max(widthByLayer + LEFT_PADDING * 2, 1280);

    return { layers, positions, width, height, nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT, layerGap: LAYER_GAP };
  }, [architecture]);
}
