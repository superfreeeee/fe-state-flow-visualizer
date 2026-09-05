import { NodeId } from './graph';

export type RuntimeEventType =
  | 'trigger'
  | 'update'
  | 'compute'
  | 'effect_start'
  | 'effect_done'
  | 'effect_fail'
  | 'error';

export interface RuntimeState {
  nodeId: NodeId;
  value?: unknown;
  version: number;
  updatedAt: number;
  isPending?: boolean;
}

export interface RuntimeEvent {
  id: string;
  nodeId: NodeId;
  timestamp: number;
  type: RuntimeEventType;
  value?: unknown;
  meta?: Record<string, unknown>;
  triggerEdgeId?: string;
  sourceNodeId?: string;
}

export type RuntimeListener = (event: RuntimeEvent, state: RuntimeState) => void;
export type Unsubscribe = () => void;
