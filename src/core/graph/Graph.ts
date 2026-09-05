import {
  GraphNode,
  GraphEdge,
  GraphGroup,
  NodeId,
  EdgeId,
  GroupId,
} from '../../types/graph';
import { GraphQuery, GraphView } from '../../types/query';
import { GraphIndex } from './GraphIndex';
import { GraphBuilder } from './GraphBuilder';
import { LazyGraphView } from '../query/QueryEngine';

/**
 * Primary Graph Store representing the authoritative state topological graph.
 * Manages indexed nodes, edges, groups, and traversal queries.
 */
export class Graph {
  private index = new GraphIndex();
  private groups = new Map<GroupId, GraphGroup>();
  public readonly builder: GraphBuilder;

  constructor() {
    this.builder = new GraphBuilder(this);
  }

  // --- Node Operations ---
  public addNode(node: GraphNode): void {
    this.index.addNode(node);
  }

  public removeNode(id: NodeId): void {
    this.index.removeNode(id);
  }

  public getNode(id: NodeId): GraphNode | undefined {
    return this.index.nodeById.get(id);
  }

  public hasNode(id: NodeId): boolean {
    return this.index.nodeById.has(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.index.nodeById.values());
  }

  public getAllNodeIds(): NodeId[] {
    return Array.from(this.index.nodeById.keys());
  }

  // --- Edge Operations ---
  public addEdge(edge: GraphEdge): void {
    if (!this.hasNode(edge.source) || !this.hasNode(edge.target)) {
      throw new Error(
        `Cannot add edge "${edge.id}": Source "${edge.source}" or target "${edge.target}" does not exist.`
      );
    }
    this.index.addEdge(edge);
  }

  public removeEdge(id: EdgeId): void {
    this.index.removeEdge(id);
  }

  public getEdge(id: EdgeId): GraphEdge | undefined {
    return this.index.edgeById.get(id);
  }

  public hasEdge(id: EdgeId): boolean {
    return this.index.edgeById.has(id);
  }

  public getAllEdges(): GraphEdge[] {
    return Array.from(this.index.edgeById.values());
  }

  // --- Group Operations ---
  public addGroup(group: GraphGroup): void {
    this.groups.set(group.id, group);
  }

  public getGroup(id: GroupId): GraphGroup | undefined {
    return this.groups.get(id);
  }

  public getAllGroups(): GraphGroup[] {
    return Array.from(this.groups.values());
  }

  // --- Adjacency & Traversal ---
  public getIncomingEdges(id: NodeId): GraphEdge[] {
    const edgeIds = this.index.incomingEdges.get(id);
    if (!edgeIds) return [];
    const result: GraphEdge[] = [];
    for (const eid of edgeIds) {
      const e = this.index.edgeById.get(eid);
      if (e) result.push(e);
    }
    return result;
  }

  public getOutgoingEdges(id: NodeId): GraphEdge[] {
    const edgeIds = this.index.outgoingEdges.get(id);
    if (!edgeIds) return [];
    const result: GraphEdge[] = [];
    for (const eid of edgeIds) {
      const e = this.index.edgeById.get(eid);
      if (e) result.push(e);
    }
    return result;
  }

  /**
   * Return parent nodes (nodes pointing to this node)
   */
  public getParents(id: NodeId): GraphNode[] {
    const inEdges = this.getIncomingEdges(id);
    const parents: GraphNode[] = [];
    const visited = new Set<NodeId>();
    for (const edge of inEdges) {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        const node = this.getNode(edge.source);
        if (node) parents.push(node);
      }
    }
    return parents;
  }

  /**
   * Return child nodes (nodes this node points to)
   */
  public getChildren(id: NodeId): GraphNode[] {
    const outEdges = this.getOutgoingEdges(id);
    const children: GraphNode[] = [];
    const visited = new Set<NodeId>();
    for (const edge of outEdges) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        const node = this.getNode(edge.target);
        if (node) children.push(node);
      }
    }
    return children;
  }

  // --- Query Engine Entrypoint ---
  public query(queryOptions: GraphQuery = {}): GraphView {
    return new LazyGraphView(this, queryOptions);
  }

  // --- Serialization ---
  public exportJSON(): {
    nodes: GraphNode[];
    edges: GraphEdge[];
    groups: GraphGroup[];
  } {
    return {
      nodes: this.getAllNodes(),
      edges: this.getAllEdges(),
      groups: this.getAllGroups(),
    };
  }

  public importJSON(data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    groups?: GraphGroup[];
  }): void {
    this.clear();
    if (data.groups) {
      for (const g of data.groups) {
        this.addGroup(g);
      }
    }
    for (const n of data.nodes) {
      this.addNode(n);
    }
    for (const e of data.edges) {
      this.addEdge(e);
    }
  }

  public clear(): void {
    this.index.clear();
    this.groups.clear();
  }

  public get nodeCount(): number {
    return this.index.nodeById.size;
  }

  public get edgeCount(): number {
    return this.index.edgeById.size;
  }

  public getIndex(): GraphIndex {
    return this.index;
  }
}
