import { GraphNode, GraphEdge } from './graph';
import { GraphView } from './query';

export type ProjectionType =
  | 'raw'
  | 'state_flow'
  | 'dependency_tree'
  | 'runtime_trace'
  | 'component_boundary';

export interface ProjectionView {
  type: ProjectionType;
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters?: {
    id: string;
    label: string;
    nodeIds: string[];
    color?: string;
  }[];
}
