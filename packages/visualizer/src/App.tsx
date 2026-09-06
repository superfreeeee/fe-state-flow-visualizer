import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Graph } from '@state-flow/common';
import { EffectorAdapter } from './core/adapters/EffectorAdapter';
import { PresetScenario } from './core/adapters/presetModels';
import { HierarchicalLayout } from './core/layout/HierarchicalLayout';
import { RuntimeStore } from './core/runtime/RuntimeStore';
import { NodeId, EdgeId, GraphNode } from '@state-flow/common';
import { RuntimeState, RuntimeEvent } from './types/runtime';

import { Header } from './components/Header';
import { QueryToolbar } from './components/query/QueryToolbar';
import { GraphCanvas } from './components/canvas/GraphCanvas';
import { NodeInspector } from './components/inspector/NodeInspector';
import { ArchitectureDoc } from './components/architecture/ArchitectureDoc';
import { IndexMemoryViewer } from './components/inspector/IndexMemoryViewer';
import { EventTimelineViewer } from './components/inspector/EventTimelineViewer';
import { ImportExportModal } from './components/ImportExportModal';
import { PanelRightOpen } from 'lucide-react';

import {
  selectedPresetAtom,
  activeTabAtom,
  layoutDirectionAtom,
  searchTermAtom,
  selectedKindsAtom,
  queryDirectionAtom,
  selectedNodeIdAtom,
  selectedEdgeIdAtom,
  activePulseEdgeIdAtom,
  isSimulatingAtom,
  clearSelectionActionAtom,
  resetFiltersActionAtom,
  isInspectorOpenAtom,
  inspectorTabAtom,
} from './store/atoms';

export default function App() {
  // Global Jotai State
  const selectedPreset = useAtomValue(selectedPresetAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const direction = useAtomValue(layoutDirectionAtom);
  const searchTerm = useAtomValue(searchTermAtom);
  const selectedKinds = useAtomValue(selectedKindsAtom);
  const queryDirection = useAtomValue(queryDirectionAtom);
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const selectedEdgeId = useAtomValue(selectedEdgeIdAtom);
  const [, setActivePulseEdgeId] = useAtom(activePulseEdgeIdAtom);
  const [isSimulating, setIsSimulating] = useAtom(isSimulatingAtom);
  const [isInspectorOpen, setIsInspectorOpen] = useAtom(isInspectorOpenAtom);
  const [inspectorTab, setInspectorTab] = useAtom(inspectorTabAtom);
  const clearSelection = useSetAtom(clearSelectionActionAtom);
  const resetFilters = useSetAtom(resetFiltersActionAtom);

  // Runtime engine states
  const [runtimeStore] = useState(() => new RuntimeStore());
  const [runtimeStates, setRuntimeStates] = useState<Map<NodeId, RuntimeState>>(
    () => new Map()
  );
  const [events, setEvents] = useState<RuntimeEvent[]>([]);

  // 1. Build and populate graph whenever preset changes
  const graph = useMemo(() => {
    const g = new Graph();
    const adapter = new EffectorAdapter();
    adapter.extract({ definitions: selectedPreset.definitions }, g.builder);
    return g;
  }, [selectedPreset]);

  // 2. Initialize runtime values from preset
  useEffect(() => {
    runtimeStore.resetStates();
    for (const [key, val] of Object.entries(selectedPreset.initialValues)) {
      const matching = graph
        .getAllNodes()
        .find(
          (n) =>
            n.id.includes(key) ||
            n.name.toLowerCase().includes(key.replace('_', ''))
        );
      if (matching) {
        runtimeStore.set(matching.id, val, 'update');
      }
    }
    setRuntimeStates(runtimeStore.getAll());
    setEvents(runtimeStore.getEvents());
    clearSelection();
  }, [graph, selectedPreset, runtimeStore, clearSelection]);

  // Subscribe to RuntimeStore events
  useEffect(() => {
    const unsub = runtimeStore.subscribe(() => {
      setRuntimeStates(new Map(runtimeStore.getAll()));
      setEvents([...runtimeStore.getEvents()]);
    });
    return unsub;
  }, [runtimeStore]);

  // 1. Full Graph Nodes and Edges
  const allNodes = useMemo(() => graph.getAllNodes(), [graph]);
  const allEdges = useMemo(() => graph.getAllEdges(), [graph]);

  // 2. Compute Layout using HierarchicalLayout (Sugiyama algorithm)
  // STABILITY FIX: Layout is computed on all nodes and edges for the scenario & direction.
  // Switching selectedNodeId or changing upstream/downstream does NOT recompute or move layout!
  const layoutResult = useMemo(() => {
    return HierarchicalLayout.layout(allNodes, allEdges, {
      direction,
      nodeWidth: 210,
      nodeHeight: 84,
      rankSep: direction === 'TB' ? 96 : 120,
      nodeSep: direction === 'TB' ? 64 : 54,
    });
  }, [allNodes, allEdges, direction]);

  // 3. Search & Kind Filters (if user explicitly searches or filters kinds)
  // When no explicit search or kind filter is applied, this is all nodes and edges.
  // Focus mode NO LONGER deletes nodes: all nodes remain in the DOM, non-path nodes are dimmed to 0.4 opacity!
  const visibleNodes = useMemo(() => {
    if (!searchTerm && selectedKinds.length === 0) {
      return allNodes;
    }
    const term = searchTerm.toLowerCase().trim();
    const allowedKinds = selectedKinds.length > 0 ? new Set(selectedKinds) : null;

    return allNodes.filter((node) => {
      const matchesKind = !allowedKinds || allowedKinds.has(node.kind);
      const matchesSearch =
        !term ||
        node.name.toLowerCase().includes(term) ||
        node.id.toLowerCase().includes(term) ||
        (node.framework?.type && node.framework.type.toLowerCase().includes(term));
      return matchesKind && matchesSearch;
    });
  }, [allNodes, searchTerm, selectedKinds]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(() => {
    if (visibleNodes.length === allNodes.length) {
      return allEdges;
    }
    return allEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [allEdges, visibleNodes.length, allNodes.length, visibleNodeIds]);

  // 4. Focus Path: Upstream, Downstream, and Path Edge Sets for highlighting
  const { upstreamIds, downstreamIds, focusedPathNodeIds, focusedPathEdgeIds } = useMemo(() => {
    if (!selectedNodeId) {
      return {
        upstreamIds: new Set<NodeId>(),
        downstreamIds: new Set<NodeId>(),
        focusedPathNodeIds: new Set<NodeId>(),
        focusedPathEdgeIds: new Set<EdgeId>(),
      };
    }

    const upView = graph.query({
      root: selectedNodeId,
      direction: 'upstream',
    });
    const downView = graph.query({
      root: selectedNodeId,
      direction: 'downstream',
    });

    const up = new Set(Array.from(upView.nodes()).map((n: GraphNode) => n.id));
    const down = new Set(Array.from(downView.nodes()).map((n: GraphNode) => n.id));
    up.delete(selectedNodeId);
    down.delete(selectedNodeId);

    const pathNodes = new Set<NodeId>();
    pathNodes.add(selectedNodeId);

    const pathEdges = new Set<EdgeId>();

    if (queryDirection === 'upstream') {
      for (const id of up) pathNodes.add(id);
      for (const edge of upView.edges()) pathEdges.add(edge.id);
    } else if (queryDirection === 'downstream') {
      for (const id of down) pathNodes.add(id);
      for (const edge of downView.edges()) pathEdges.add(edge.id);
    } else {
      // 'both'
      for (const id of up) pathNodes.add(id);
      for (const id of down) pathNodes.add(id);
      for (const edge of upView.edges()) pathEdges.add(edge.id);
      for (const edge of downView.edges()) pathEdges.add(edge.id);
    }

    return {
      upstreamIds: up,
      downstreamIds: down,
      focusedPathNodeIds: pathNodes,
      focusedPathEdgeIds: pathEdges,
    };
  }, [graph, selectedNodeId, queryDirection]);

  // Parents and Children of selected node (for inspector)
  const selectedNode = selectedNodeId ? graph.getNode(selectedNodeId) || null : null;
  const selectedEdge = selectedEdgeId ? graph.getEdge(selectedEdgeId) || null : null;
  const selectedParents = selectedNodeId ? graph.getParents(selectedNodeId) : [];
  const selectedChildren = selectedNodeId ? graph.getChildren(selectedNodeId) : [];

  // Simulation execution handler
  const handleTriggerPresetEvent = useCallback(
    (eventDef: PresetScenario['triggerableEvents'][0]) => {
      if (isSimulating) return;
      setIsSimulating(true);

      const targetEventNode = graph.getNode(eventDef.id);
      if (!targetEventNode) {
        setIsSimulating(false);
        return;
      }

      // Step 1: Trigger Event
      runtimeStore.triggerEvent(targetEventNode.id, eventDef.payload, {
        description: eventDef.description,
      });

      // Find outgoing edges to pulse
      const outEdges = graph.getOutgoingEdges(targetEventNode.id);
      if (outEdges.length > 0) {
        setActivePulseEdgeId(outEdges[0].id);
      }

      // Step 2: Propagate downstream updates after short step delay
      setTimeout(() => {
        if (eventDef.id === 'ev_add_item') {
          const cartStore = graph.getNode('store_cart_items');
          if (cartStore) {
            const current = (runtimeStore.get(cartStore.id)?.value as number) || 2;
            runtimeStore.set(cartStore.id, current + 1, 'update');
          }

          const totalStore = graph.getNode('derived_total_amount');
          if (totalStore) {
            runtimeStore.set(totalStore.id, '$506.00', 'compute');
          }

          const discountStore = graph.getNode('derived_discounted_price');
          if (discountStore) {
            runtimeStore.set(discountStore.id, '$404.80', 'compute');
          }
        } else if (eventDef.id === 'ev_apply_coupon') {
          const fxNode = graph.getNode('fx_validate_coupon');
          if (fxNode) {
            runtimeStore.set(fxNode.id, { valid: true, discountRate: 0.3 }, 'effect_done');
          }
          const couponStore = graph.getNode('store_coupon_code');
          if (couponStore) {
            runtimeStore.set(couponStore.id, 'BLACKFRIDAY30', 'update');
          }
          const discountStore = graph.getNode('derived_discounted_price');
          if (discountStore) {
            runtimeStore.set(discountStore.id, '$214.90', 'compute');
          }
        } else if (eventDef.id === 'ev_checkout_click') {
          const fxSubmit = graph.getNode('fx_submit_order');
          if (fxSubmit) {
            runtimeStore.set(
              fxSubmit.id,
              { orderId: 'ORD-98241', status: 'PAID' },
              'effect_done'
            );
          }
        } else if (eventDef.id === 'action_increment') {
          const countAtom = graph.getNode('atom_count');
          if (countAtom) {
            const cur = (runtimeStore.get(countAtom.id)?.value as number) || 10;
            runtimeStore.set(countAtom.id, cur + 1, 'update');

            const totalAtom = graph.getNode('atom_computed_total');
            if (totalAtom) {
              runtimeStore.set(totalAtom.id, (cur + 1) * 3, 'compute');
            }
          }
        } else if (eventDef.id === 'ev_login_submit') {
          const tokenStore = graph.getNode('store_auth_token');
          if (tokenStore) {
            runtimeStore.set(tokenStore.id, 'jwt_live_session_9921', 'update');
          }
          const userStore = graph.getNode('store_user_profile');
          if (userStore) {
            runtimeStore.set(userStore.id, { name: 'Alex Rivera (Verified)', role: 'Admin' }, 'update');
          }
        } else if (eventDef.id === 'ev_logout_click') {
          const tokenStore = graph.getNode('store_auth_token');
          if (tokenStore) runtimeStore.set(tokenStore.id, null, 'update');
          const userStore = graph.getNode('store_user_profile');
          if (userStore) runtimeStore.set(userStore.id, null, 'update');
        }

        setActivePulseEdgeId(null);
        setIsSimulating(false);
      }, 700);
    },
    [isSimulating, graph, runtimeStore, setActivePulseEdgeId, setIsSimulating]
  );

  // Import JSON handler
  const handleImportJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
        graph.importJSON(data);
        resetFilters();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div
      id="app-root"
      className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans antialiased"
    >
      {/* 1. Header Navigation Bar */}
      <Header
        nodeCount={graph.nodeCount}
        edgeCount={graph.edgeCount}
      />

      {/* 2. Main Content Body according to activeTab */}
      {activeTab === 'graph' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Query & Filter Bar */}
          <QueryToolbar
            selectedNodeName={selectedNode?.name}
            visibleCount={selectedNodeId ? focusedPathNodeIds.size : visibleNodes.length}
            totalCount={graph.nodeCount}
          />

          {/* Canvas + Inspector Split View */}
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            <main className="flex-1 h-full min-w-0 relative">
              <GraphCanvas
                nodes={visibleNodes}
                edges={visibleEdges}
                layout={layoutResult}
                upstreamNodeIds={upstreamIds}
                downstreamNodeIds={downstreamIds}
                focusedPathNodeIds={focusedPathNodeIds}
                focusedPathEdgeIds={focusedPathEdgeIds}
                runtimeStates={runtimeStates}
              />

              {/* Floating button to reopen inspector when completely closed */}
              {!isInspectorOpen && (
                <button
                  id="btn-reopen-inspector"
                  onClick={() => setIsInspectorOpen(true)}
                  title="展开右侧详情与运行面板"
                  className="absolute right-4 top-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg shadow-xl text-xs backdrop-blur cursor-pointer transition hover:border-emerald-500/50"
                >
                  <PanelRightOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">展开面板</span>
                </button>
              )}
            </main>

            {/* Right Side Inspector (Supports complete closure and 3 tabs: overview, detail, runtime) */}
            <NodeInspector
              isOpen={isInspectorOpen}
              onClose={() => setIsInspectorOpen(false)}
              activeTab={inspectorTab}
              onTabChange={setInspectorTab}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              parents={selectedParents}
              children={selectedChildren}
              runtimeState={selectedNodeId ? runtimeStates.get(selectedNodeId) : undefined}
              runtimeStates={runtimeStates}
              events={events}
              onTriggerEvent={(nodeId) => {
                const triggerable = selectedPreset.triggerableEvents.find(
                  (t) => t.id === nodeId
                );
                if (triggerable) {
                  handleTriggerPresetEvent(triggerable);
                } else {
                  runtimeStore.triggerEvent(nodeId, { clickedAt: Date.now() });
                }
              }}
              onTriggerPresetEvent={handleTriggerPresetEvent}
              onResetStates={() => {
                runtimeStore.resetStates();
                for (const [key, val] of Object.entries(selectedPreset.initialValues)) {
                  const matching = graph
                    .getAllNodes()
                    .find((n) => n.id.includes(key));
                  if (matching) runtimeStore.set(matching.id, val, 'update');
                }
                setRuntimeStates(new Map(runtimeStore.getAll()));
              }}
              isSimulating={isSimulating}
              allNodes={graph.getAllNodes()}
              allEdges={graph.getAllEdges()}
              scenario={selectedPreset}
            />
          </div>
        </div>
      )}

      {activeTab === 'architecture' && <ArchitectureDoc />}

      {activeTab === 'index' && (
        <IndexMemoryViewer graph={graph} runtimeStore={runtimeStore} />
      )}

      {activeTab === 'timeline' && (
        <EventTimelineViewer
          events={events}
          graph={graph}
          onClear={() => runtimeStore.clearEvents()}
        />
      )}

      {/* JSON Import/Export Modal */}
      <ImportExportModal
        graph={graph}
        onImport={handleImportJSON}
      />
    </div>
  );
}
