export type NodeKind =
  | 'state'
  | 'derived'
  | 'event'
  | 'effect'
  | 'reaction'
  | 'component'
  | 'unknown';

export type EdgeKind =
  | 'dependency'
  | 'derive'
  | 'update'
  | 'trigger'
  | 'effect'
  | 'render'
  | 'unknown';

export type NodeId = string;
export type EdgeId = string;
export type GroupId = string;

export interface SourceLocation {
  file: string;
  line: number;
  column?: number;
  snippet?: string;
}

export interface FrameworkMetadata {
  name: string;
  type: string;
  rawConfig?: Record<string, unknown>;
}

export interface GraphNode {
  id: NodeId;
  kind: NodeKind;
  name: string;
  description?: string;
  framework?: FrameworkMetadata;
  source?: SourceLocation;
  groupId?: GroupId;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  kind: EdgeKind;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphGroup {
  id: GroupId;
  name: string;
  description?: string;
  color?: string;
  parentGroupId?: GroupId;
}

export interface NodeDefinition {
  id?: NodeId;
  kind: NodeKind;
  name: string;
  description?: string;
  framework?: FrameworkMetadata;
  source?: SourceLocation;
  groupId?: GroupId;
  metadata?: Record<string, unknown>;
}

export interface EdgeDefinition {
  id?: EdgeId;
  source: NodeId;
  target: NodeId;
  kind: EdgeKind;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface GroupDefinition {
  id: GroupId;
  name: string;
  description?: string;
  color?: string;
  parentGroupId?: GroupId;
}

export interface NodeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups?: GraphGroup[];
  metadata?: {
    sourceFile?: string;
    framework?: string;
    extractedAt?: string;
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
}
