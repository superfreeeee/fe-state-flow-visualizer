import {
  GraphNode,
  GraphEdge,
  NodeId,
  EdgeId,
} from '../../types/graph';
import { GraphQuery, GraphView } from '../../types/query';
import type { Graph } from '../graph/Graph';

/**
 * Lazy, high-performance GraphView implementation.
 * Wraps a parent Graph and a query filter set without cloning the underlying nodes or edges.
 */
export class LazyGraphView implements GraphView {
  private activeNodeIds: Set<NodeId>;
  private activeEdgeIds: Set<EdgeId>;

  constructor(
    private graph: Graph,
    private querySpec: GraphQuery,
    nodeIds?: Set<NodeId>,
    edgeIds?: Set<EdgeId>
  ) {
    if (nodeIds && edgeIds) {
      this.activeNodeIds = nodeIds;
      this.activeEdgeIds = edgeIds;
    } else {
      const computed = this.computeMatchedElements();
      this.activeNodeIds = computed.nodes;
      this.activeEdgeIds = computed.edges;
    }
  }

  private computeMatchedElements(): { nodes: Set<NodeId>; edges: Set<EdgeId> } {
    let candidateNodes: Set<NodeId>;

    // 1. If a root node is specified with a direction (upstream/downstream/both)
    if (this.querySpec.root && this.graph.hasNode(this.querySpec.root)) {
      candidateNodes = this.traverseDirectional(
        this.querySpec.root,
        this.querySpec.direction || 'both',
        this.querySpec.depth ?? Infinity
      );
    } else {
      // All nodes in graph
      candidateNodes = new Set(this.graph.getAllNodeIds());
    }

    // 2. Filter by NodeKind
    if (this.querySpec.kinds && this.querySpec.kinds.length > 0) {
      const allowedKinds = new Set(this.querySpec.kinds);
      candidateNodes = new Set(
        Array.from(candidateNodes).filter((nid) => {
          const node = this.graph.getNode(nid);
          return node ? allowedKinds.has(node.kind) : false;
        })
      );
    }

    // 3. Filter by Search keyword
    if (this.querySpec.searchTerm && this.querySpec.searchTerm.trim() !== '') {
      const term = this.querySpec.searchTerm.toLowerCase().trim();
      candidateNodes = new Set(
        Array.from(candidateNodes).filter((nid) => {
          const node = this.graph.getNode(nid);
          if (!node) return false;
          return (
            node.name.toLowerCase().includes(term) ||
            node.id.toLowerCase().includes(term) ||
            (node.framework?.type && node.framework.type.toLowerCase().includes(term))
          );
        })
      );
    }

    // 4. Filter by Group
    if (this.querySpec.groupId) {
      candidateNodes = new Set(
        Array.from(candidateNodes).filter((nid) => {
          const node = this.graph.getNode(nid);
          return node?.groupId === this.querySpec.groupId;
        })
      );
    }

    // 5. Connect active edges where both source and target exist in candidateNodes
    const matchedEdges = new Set<EdgeId>();
    const allowedEdgeKinds = this.querySpec.edgeKinds
      ? new Set(this.querySpec.edgeKinds)
      : null;

    for (const nid of candidateNodes) {
      const outEdges = this.graph.getOutgoingEdges(nid);
      for (const edge of outEdges) {
        if (candidateNodes.has(edge.target)) {
          if (!allowedEdgeKinds || allowedEdgeKinds.has(edge.kind)) {
            matchedEdges.add(edge.id);
          }
        }
      }
    }

    return { nodes: candidateNodes, edges: matchedEdges };
  }

  private traverseDirectional(
    rootId: NodeId,
    direction: 'upstream' | 'downstream' | 'both',
    maxDepth: number
  ): Set<NodeId> {
    const visited = new Set<NodeId>();
    const queue: Array<{ id: NodeId; depth: number }> = [{ id: rootId, depth: 0 }];
    visited.add(rootId);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors: NodeId[] = [];

      if (direction === 'upstream' || direction === 'both') {
        const parents = this.graph.getParents(id);
        neighbors.push(...parents.map((n) => n.id));
      }

      if (direction === 'downstream' || direction === 'both') {
        const children = this.graph.getChildren(id);
        neighbors.push(...children.map((n) => n.id));
      }

      for (const nextId of neighbors) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, depth: depth + 1 });
        }
      }
    }

    return visited;
  }

  public *nodes(): Iterable<GraphNode> {
    for (const id of this.activeNodeIds) {
      const node = this.graph.getNode(id);
      if (node) yield node;
    }
  }

  public *edges(): Iterable<GraphEdge> {
    for (const id of this.activeEdgeIds) {
      const edge = this.graph.getEdge(id);
      if (edge) yield edge;
    }
  }

  public getNode(id: NodeId): GraphNode | undefined {
    return this.activeNodeIds.has(id) ? this.graph.getNode(id) : undefined;
  }

  public getEdge(id: EdgeId): GraphEdge | undefined {
    return this.activeEdgeIds.has(id) ? this.graph.getEdge(id) : undefined;
  }

  public hasNode(id: NodeId): boolean {
    return this.activeNodeIds.has(id);
  }

  public hasEdge(id: EdgeId): boolean {
    return this.activeEdgeIds.has(id);
  }

  public getIncomingEdges(nodeId: NodeId): GraphEdge[] {
    if (!this.hasNode(nodeId)) return [];
    return this.graph
      .getIncomingEdges(nodeId)
      .filter((e) => this.activeEdgeIds.has(e.id));
  }

  public getOutgoingEdges(nodeId: NodeId): GraphEdge[] {
    if (!this.hasNode(nodeId)) return [];
    return this.graph
      .getOutgoingEdges(nodeId)
      .filter((e) => this.activeEdgeIds.has(e.id));
  }

  public get nodeCount(): number {
    return this.activeNodeIds.size;
  }

  public get edgeCount(): number {
    return this.activeEdgeIds.size;
  }

  public getRawNodeIds(): Set<NodeId> {
    return this.activeNodeIds;
  }

  public getRawEdgeIds(): Set<EdgeId> {
    return this.activeEdgeIds;
  }
}
