import { GraphEdge, GraphNode } from '@state-flow/common';

// import effector_cart_graph_json from '../../../../examples/graphs/effector-cart.json';
import effector_counter_graph_json from '../../../../examples/graphs/effector-counter.json';
// import effector_react_feed_graph_json from '../../../../examples/graphs/effector-react-feed.json';

export const graphsMap = {
  // effector_cart: effector_cart_graph_json,
  effector_counter: effector_counter_graph_json,
  // effector_react_feed: effector_react_feed_graph_json,
} as Record<string, { nodes: GraphNode[]; edges: GraphEdge[] }>;

export const allGraphs = Object.entries(graphsMap);
