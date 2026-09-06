import { NodeId } from '../../types/graph';
import {
  RuntimeState,
  RuntimeEvent,
  RuntimeListener,
  Unsubscribe,
  RuntimeEventType,
} from '../../types/runtime';

/**
 * Authoritative decoupled runtime state store & event bus.
 * Strictly separates static topology (Graph) from ephemeral runtime data (RuntimeState/Event).
 */
export class RuntimeStore {
  private states = new Map<NodeId, RuntimeState>();
  private events: RuntimeEvent[] = [];
  private listeners = new Set<RuntimeListener>();
  private maxEventHistory = 100;

  public get(nodeId: NodeId): RuntimeState | undefined {
    return this.states.get(nodeId);
  }

  public getAll(): Map<NodeId, RuntimeState> {
    return new Map(this.states);
  }

  public set(
    nodeId: NodeId,
    value: unknown,
    eventType: RuntimeEventType = 'update',
    meta?: Record<string, unknown>
  ): RuntimeState {
    const prev = this.states.get(nodeId);
    const version = (prev?.version ?? 0) + 1;
    const now = Date.now();

    const nextState: RuntimeState = {
      nodeId,
      value,
      version,
      updatedAt: now,
      isPending: false,
    };

    this.states.set(nodeId, nextState);

    const event: RuntimeEvent = {
      id: `ev_${now}_${Math.random().toString(36).slice(2, 7)}`,
      nodeId,
      timestamp: now,
      type: eventType,
      value,
      meta,
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEventHistory) {
      this.events.pop();
    }

    this.notify(event, nextState);
    return nextState;
  }

  public triggerEvent(
    nodeId: NodeId,
    payload?: unknown,
    meta?: Record<string, unknown>
  ): RuntimeEvent {
    const now = Date.now();
    const event: RuntimeEvent = {
      id: `ev_${now}_${Math.random().toString(36).slice(2, 7)}`,
      nodeId,
      timestamp: now,
      type: 'trigger',
      value: payload,
      meta,
    };

    const state = this.states.get(nodeId) || {
      nodeId,
      version: 1,
      updatedAt: now,
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEventHistory) {
      this.events.pop();
    }

    this.notify(event, state);
    return event;
  }

  public getEvents(limit = 50): RuntimeEvent[] {
    return this.events.slice(0, limit);
  }

  public clearEvents(): void {
    this.events = [];
  }

  public resetStates(): void {
    this.states.clear();
    this.events = [];
  }

  public subscribe(listener: RuntimeListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: RuntimeEvent, state: RuntimeState): void {
    for (const listener of this.listeners) {
      try {
        listener(event, state);
      } catch (err) {
        console.error('Error in RuntimeStore listener:', err);
      }
    }
  }
}
