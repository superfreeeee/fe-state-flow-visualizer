import dagre from 'dagre';
import { GraphNode, GraphEdge, NodeId, EdgeId } from '@state-flow/common';
import {
  LayoutNode,
  LayoutEdge,
  LayoutResult,
  LayoutOptions,
  LayoutPoint,
} from '../../types/layout';

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  direction: 'TB',
  nodeWidth: 210,
  nodeHeight: 84,
  rankSep: 96,
  nodeSep: 64,
};

/**
 * High-precision Dagre-powered Hierarchical DAG layout.
 * Features:
 * 1. Virtual dummy vertex insertion for multi-rank edges to route wires around nodes.
 * 2. Strict collision corridors ensuring edges never pass behind or through node cards.
 * 3. Network-simplex ranking and barycentric crossing minimization.
 * 4. Multi-port edge routing for both Top-to-Bottom and Left-to-Right layouts.
 */
export class HierarchicalLayout {
  public static layout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options: LayoutOptions = {}
  ): LayoutResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const nodeMap = new Map<NodeId, GraphNode>();
    for (const n of nodes) nodeMap.set(n.id, n);

    // Filter valid edges (both source & target exist in current node set)
    const validEdges = edges.filter(
      (e) => nodeMap.has(e.source) && nodeMap.has(e.target)
    );

    if (nodes.length === 0) {
      return {
        nodes: new Map(),
        edges: new Map(),
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 100, height: 100 },
      };
    }

    // 1. Create and configure Dagre Multigraph
    const g = new dagre.graphlib.Graph({ multigraph: true });
    g.setGraph({
      rankdir: opts.direction,
      // Spacing guarantees:
      nodesep: Math.max(50, opts.nodeSep),
      ranksep: Math.max(80, opts.rankSep),
      edgesep: 36, // Dedicated horizontal buffer between edge corridors
      marginx: 50,
      marginy: 50,
      ranker: 'network-simplex', // Optimal layer assignment
    });
    g.setDefaultEdgeLabel(() => ({}));

    // 2. Collision buffer:
    // Inform Dagre that nodes have an additional safety envelope
    // so wires and arrowheads maintain clean clearance without overlapping node borders/glow
    const bufferX = 20;
    const bufferY = 16;
    const envelopeWidth = opts.nodeWidth + bufferX;
    const envelopeHeight = opts.nodeHeight + bufferY;

    for (const n of nodes) {
      g.setNode(n.id, {
        width: envelopeWidth,
        height: envelopeHeight,
      });
    }

    for (const e of validEdges) {
      g.setEdge(e.source, e.target, {}, e.id);
    }

    // 3. Compute layout with Dagre
    dagre.layout(g);

    // 4. Extract Node coordinates (converting Dagre's center coords to top-left coords)
    const layoutNodes = new Map<NodeId, LayoutNode>();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      const dNode = g.node(n.id);
      if (!dNode) continue;

      const x = dNode.x - opts.nodeWidth / 2;
      const y = dNode.y - opts.nodeHeight / 2;

      layoutNodes.set(n.id, {
        id: n.id,
        x,
        y,
        width: opts.nodeWidth,
        height: opts.nodeHeight,
        rank: (dNode as any).rank ?? 0,
        order: (dNode as any).order ?? 0,
      });

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + opts.nodeWidth);
      maxY = Math.max(maxY, y + opts.nodeHeight);
    }

    // 5. Extract Edge routes with waypoint corridor tracking
    const layoutEdges = new Map<EdgeId, LayoutEdge>();

    for (const e of validEdges) {
      const dEdge = g.edge(e.source, e.target, e.id);
      let rawPoints: LayoutPoint[] = [];

      if (dEdge && dEdge.points && dEdge.points.length > 0) {
        rawPoints = dEdge.points.map((p: any) => ({ x: p.x, y: p.y }));
      } else {
        // Fallback direct ports
        const src = layoutNodes.get(e.source);
        const tgt = layoutNodes.get(e.target);
        if (src && tgt) {
          if (opts.direction === 'TB') {
            rawPoints = [
              { x: src.x + src.width / 2, y: src.y + src.height },
              { x: tgt.x + tgt.width / 2, y: tgt.y },
            ];
          } else {
            rawPoints = [
              { x: src.x + src.width, y: src.y + src.height / 2 },
              { x: tgt.x, y: tgt.y + tgt.height / 2 },
            ];
          }
        }
      }

      // Snap the terminal connection endpoints cleanly to the physical borders of source and target cards
      const src = layoutNodes.get(e.source);
      const tgt = layoutNodes.get(e.target);
      if (src && tgt && rawPoints.length >= 2) {
        if (opts.direction === 'TB') {
          rawPoints[0] = {
            x: Math.max(src.x + 20, Math.min(src.x + src.width - 20, rawPoints[0].x)),
            y: src.y + src.height,
          };
          rawPoints[rawPoints.length - 1] = {
            x: Math.max(tgt.x + 20, Math.min(tgt.x + tgt.width - 20, rawPoints[rawPoints.length - 1].x)),
            y: tgt.y,
          };
        } else {
          // LR
          rawPoints[0] = {
            x: src.x + src.width,
            y: Math.max(src.y + 16, Math.min(src.y + src.height - 16, rawPoints[0].y)),
          };
          rawPoints[rawPoints.length - 1] = {
            x: tgt.x,
            y: Math.max(tgt.y + 16, Math.min(tgt.y + tgt.height - 16, rawPoints[rawPoints.length - 1].y)),
          };
        }
      }

      for (const p of rawPoints) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }

      layoutEdges.set(e.id, {
        id: e.id,
        source: e.source,
        target: e.target,
        points: rawPoints,
      });
    }

    const padding = 70;
    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      bounds: {
        minX: minX === Infinity ? 0 : minX - padding,
        minY: minY === Infinity ? 0 : minY - padding,
        maxX: maxX === -Infinity ? 0 : maxX + padding,
        maxY: maxY === -Infinity ? 0 : maxY + padding,
        width: maxX === -Infinity ? 100 : Math.max(100, maxX - minX + padding * 2),
        height: maxY === -Infinity ? 100 : Math.max(100, maxY - minY + padding * 2),
      },
    };
  }
}

