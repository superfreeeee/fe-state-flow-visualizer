/**
 * Core Graph Data Structures for Frontend State Flow Visualizer
 */

export type NodeKind =
  | 'state'      // Primary state storage ($store, atom, signal, ref)
  | 'derived'    // Computed or derived state ($filteredList, computed, selector)
  | 'event'      // Trigger/Action/Event (event, action, dispatch)
  | 'effect'     // Async effect or side-effect ($fetchUserFx, thunk, saga)
  | 'reaction'   // Observer or listener (watch, sample, reaction)
  | 'component'  // React/Vue component bound to state
  | 'unknown';

export type EdgeKind =
  | 'dependency' // Target depends on Source (reading state)
  | 'derive'     // Source calculates Target (e.g. $count -> $doubleCount)
  | 'update'     // Source mutates Target (e.g. event -> store)
  | 'trigger'    // Source triggers Target (e.g. sample, trigger, event -> effect)
  | 'effect'     // Effect execution / completion flow
  | 'render'     // State induces component render
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
  name: string;        // e.g. 'effector', 'jotai', 'zustand', 'signals'
  type: string;        // e.g. 'store', 'event', 'effect', 'atom', 'computed'
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
}

export interface NodeDefinition extends Omit<GraphNode, 'id'> {
  id?: NodeId;
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
}
