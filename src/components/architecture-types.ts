export type ArchitectureLayer = {
  id: string;
  label: string;
  order: number;
};

export type ArchitectureNode = {
  id: string;
  label: string;
  type: string;
  layer: string;
  description: string;
};

export type ArchitectureEdge = {
  from: string;
  to: string;
  label: string;
};

export type ArchitectureModel = {
  title: string;
  layout?: string;
  theme?: string;
  layers: ArchitectureLayer[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
};

export type LayoutNode = ArchitectureNode & {
  x: number;
  y: number;
  order: number;
};
