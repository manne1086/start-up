import { useMemo } from 'react';

export type SketchTheme = 'excalidraw-sketch';

export function useSketchColors(index: number) {
  const colors = ['#6C47FF', '#00D4AA', '#4DA3FF', '#F5A524'];
  return colors[index % colors.length];
}

export function useGroupedNodes<T extends { layer: string }>(nodes: T[]) {
  return useMemo(() => {
    const map = new Map<string, T[]>();
    nodes.forEach((node) => {
      const list = map.get(node.layer) ?? [];
      list.push(node);
      map.set(node.layer, list);
    });
    return map;
  }, [nodes]);
}
