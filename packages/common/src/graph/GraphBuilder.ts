import {
  NodeDefinition,
  EdgeDefinition,
  GroupDefinition,
  NodeId,
  EdgeId,
  GroupId,
  GraphNode,
  GraphEdge,
} from '../types/graph';
import type { Graph } from './Graph';

/**
 * Standard GraphBuilder allowing adapters (static, AST, or runtime)
 * to safely append nodes, edges, and metadata without coupling to internal stores.
 */
export class GraphBuilder {
  private autoIdCounter = 1;

  constructor(private graph: Graph) {}

  public addNode(node: NodeDefinition): NodeId {
    const id: NodeId = node.id || `node_${this.autoIdCounter++}`;
    this.graph.addNode({
      ...node,
      id,
    });
    return id;
  }

  public addEdge(edge: EdgeDefinition): EdgeId {
    const id: EdgeId = edge.id || `edge_${edge.source}__${edge.kind}__${edge.target}`;
    this.graph.addEdge({
      ...edge,
      id,
    });
    return id;
  }

  public updateNode(id: NodeId, patch: Partial<NodeDefinition>): void {
    const existing = this.graph.getNode(id);
    if (!existing) {
      throw new Error(`Cannot update non-existent node with id: ${id}`);
    }
    this.graph.addNode({
      ...existing,
      ...patch,
      id,
    });
  }

  public addGroup(group: GroupDefinition): GroupId {
    this.graph.addGroup(group);
    return group.id;
  }

  public addMetadata(id: NodeId, metadata: Record<string, unknown>): void {
    const existing = this.graph.getNode(id);
    if (existing) {
      this.updateNode(id, {
        metadata: {
          ...(existing.metadata || {}),
          ...metadata,
        },
      });
    }
  }

  load(graphLike: { nodes: GraphNode[]; edges: GraphEdge[] }) {
    for (const node of graphLike.nodes) {
      this.addNode(node);
    }
    for (const edge of graphLike.edges) {
      this.addEdge(edge);
    }
  }
}
