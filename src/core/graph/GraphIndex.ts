import {
  GraphNode,
  GraphEdge,
  NodeId,
  EdgeId,
  NodeKind,
  GroupId,
} from '../../types/graph';

/**
 * High-performance inverted index and adjacency graph structures
 * Provides O(1) lookups for traversal, filtering, and neighborhood discovery.
 */
export class GraphIndex {
  public readonly nodeById = new Map<NodeId, GraphNode>();
  public readonly edgeById = new Map<EdgeId, GraphEdge>();

  // Adjacency indices
  public readonly incomingEdges = new Map<NodeId, Set<EdgeId>>();
  public readonly outgoingEdges = new Map<NodeId, Set<EdgeId>>();

  // Inverted categorical indices
  public readonly nodesByKind = new Map<NodeKind, Set<NodeId>>();
  public readonly nodesByFrameworkType = new Map<string, Set<NodeId>>();
  public readonly nodesByGroup = new Map<GroupId, Set<NodeId>>();
  public readonly nodesByName = new Map<string, Set<NodeId>>();

  public addNode(node: GraphNode): void {
    this.nodeById.set(node.id, node);

    if (!this.incomingEdges.has(node.id)) {
      this.incomingEdges.set(node.id, new Set());
    }
    if (!this.outgoingEdges.has(node.id)) {
      this.outgoingEdges.set(node.id, new Set());
    }

    // Index by kind
    let kindSet = this.nodesByKind.get(node.kind);
    if (!kindSet) {
      kindSet = new Set();
      this.nodesByKind.set(node.kind, kindSet);
    }
    kindSet.add(node.id);

    // Index by framework type (e.g. store, event, atom)
    if (node.framework?.type) {
      const fwKey = `${node.framework.name}:${node.framework.type}`.toLowerCase();
      let fwSet = this.nodesByFrameworkType.get(fwKey);
      if (!fwSet) {
        fwSet = new Set();
        this.nodesByFrameworkType.set(fwKey, fwSet);
      }
      fwSet.add(node.id);
    }

    // Index by group
    if (node.groupId) {
      let grpSet = this.nodesByGroup.get(node.groupId);
      if (!grpSet) {
        grpSet = new Set();
        this.nodesByGroup.set(node.groupId, grpSet);
      }
      grpSet.add(node.id);
    }

    // Index by name
    const lowerName = node.name.toLowerCase();
    let nameSet = this.nodesByName.get(lowerName);
    if (!nameSet) {
      nameSet = new Set();
      this.nodesByName.set(lowerName, nameSet);
    }
    nameSet.add(node.id);
  }

  public addEdge(edge: GraphEdge): void {
    this.edgeById.set(edge.id, edge);

    let outSet = this.outgoingEdges.get(edge.source);
    if (!outSet) {
      outSet = new Set();
      this.outgoingEdges.set(edge.source, outSet);
    }
    outSet.add(edge.id);

    let inSet = this.incomingEdges.get(edge.target);
    if (!inSet) {
      inSet = new Set();
      this.incomingEdges.set(edge.target, inSet);
    }
    inSet.add(edge.id);
  }

  public removeNode(id: NodeId): void {
    const node = this.nodeById.get(id);
    if (!node) return;

    // Remove associated edges
    const inEdges = Array.from(this.incomingEdges.get(id) || []);
    for (const eid of inEdges) {
      this.removeEdge(eid);
    }
    const outEdges = Array.from(this.outgoingEdges.get(id) || []);
    for (const eid of outEdges) {
      this.removeEdge(eid);
    }

    this.incomingEdges.delete(id);
    this.outgoingEdges.delete(id);

    // Remove from inverted indices
    this.nodesByKind.get(node.kind)?.delete(id);
    if (node.framework?.type) {
      const fwKey = `${node.framework.name}:${node.framework.type}`.toLowerCase();
      this.nodesByFrameworkType.get(fwKey)?.delete(id);
    }
    if (node.groupId) {
      this.nodesByGroup.get(node.groupId)?.delete(id);
    }
    this.nodesByName.get(node.name.toLowerCase())?.delete(id);

    this.nodeById.delete(id);
  }

  public removeEdge(id: EdgeId): void {
    const edge = this.edgeById.get(id);
    if (!edge) return;

    this.outgoingEdges.get(edge.source)?.delete(id);
    this.incomingEdges.get(edge.target)?.delete(id);
    this.edgeById.delete(id);
  }

  public clear(): void {
    this.nodeById.clear();
    this.edgeById.clear();
    this.incomingEdges.clear();
    this.outgoingEdges.clear();
    this.nodesByKind.clear();
    this.nodesByFrameworkType.clear();
    this.nodesByGroup.clear();
    this.nodesByName.clear();
  }
}
