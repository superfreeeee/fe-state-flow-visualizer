import { NodeId, EdgeId } from './graph';

export interface LayoutNode {
  id: NodeId;
  x: number;
  y: number;
  width: number;
  height: number;
  rank: number;
  order: number;
}

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  points: LayoutPoint[];
}

export interface LayoutResult {
  nodes: Map<NodeId, LayoutNode>;
  edges: Map<EdgeId, LayoutEdge>;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export interface LayoutOptions {
  direction?: 'TB' | 'LR'; // Top-to-Bottom or Left-to-Right
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}
