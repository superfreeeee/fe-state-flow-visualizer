import { NodeId, EdgeId, NodeKind, EdgeKind, GraphNode, GraphEdge } from './graph';

export type QueryDirection = 'upstream' | 'downstream' | 'both';

export interface GraphQuery {
  root?: NodeId;
  direction?: QueryDirection;
  depth?: number;
  kinds?: NodeKind[];
  edgeKinds?: EdgeKind[];
  frameworkType?: string;
  groupId?: string;
  searchTerm?: string;
  changedSince?: number;
}

export interface GraphView {
  nodes(): Iterable<GraphNode>;
  edges(): Iterable<GraphEdge>;
  getNode(id: NodeId): GraphNode | undefined;
  getEdge(id: EdgeId): GraphEdge | undefined;
  hasNode(id: NodeId): boolean;
  hasEdge(id: EdgeId): boolean;
  getIncomingEdges(nodeId: NodeId): GraphEdge[];
  getOutgoingEdges(nodeId: NodeId): GraphEdge[];
  readonly nodeCount: number;
  readonly edgeCount: number;
}
