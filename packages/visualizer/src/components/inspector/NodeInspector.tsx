import React, { useState, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import {
  X,
  Info,
  Layers,
  Zap,
  Play,
  RotateCcw,
  Clock,
  FileCode,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  CheckCircle2,
  Sparkles,
  Search,
  PanelRightClose,
} from 'lucide-react';
import { GraphNode, GraphEdge, NodeId } from '@state-flow/common';
import { RuntimeState, RuntimeEvent } from '../../types/runtime';
import { PresetScenario } from '../../core/adapters/presetModels';
import {
  selectNodeActionAtom,
  clearSelectionActionAtom,
  InspectorTab,
} from '../../store/atoms';

interface NodeInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  parents: GraphNode[];
  children: GraphNode[];
  runtimeState?: RuntimeState;
  runtimeStates: Map<NodeId, RuntimeState>;
  events: RuntimeEvent[];
  onSelectNode?: (id: NodeId | null) => void;
  onTriggerEvent?: (nodeId: NodeId) => void;
  onTriggerPresetEvent?: (eventDef: PresetScenario['triggerableEvents'][0]) => void;
  onResetStates?: () => void;
  isSimulating?: boolean;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
  scenario: PresetScenario;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  selectedNode,
  selectedEdge,
  parents,
  children,
  runtimeState,
  runtimeStates,
  events,
  onSelectNode,
  onTriggerEvent,
  onTriggerPresetEvent,
  onResetStates,
  isSimulating = false,
  allNodes,
  allEdges,
  scenario,
}) => {
  const defaultSelectNode = useSetAtom(selectNodeActionAtom);
  const defaultClose = useSetAtom(clearSelectionActionAtom);
  const handleSelectNode = onSelectNode || defaultSelectNode;
  const handleClearSelection = defaultClose;

  // Search filter for nodes in overview/runtime tabs
  const [overviewFilter, setOverviewFilter] = useState('');
  const [runtimeFilter, setRuntimeFilter] = useState('');

  // Node kinds distribution
  const kindCounts = useMemo(() => {
    return allNodes.reduce((acc, n) => {
      acc[n.kind] = (acc[n.kind] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allNodes]);

  // Filtered nodes for quick directory
  const filteredDirectoryNodes = useMemo(() => {
    if (!overviewFilter.trim()) return allNodes.slice(0, 15);
    const term = overviewFilter.toLowerCase().trim();
    return allNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(term) ||
        n.id.toLowerCase().includes(term) ||
        n.kind.toLowerCase().includes(term)
    );
  }, [allNodes, overviewFilter]);

  // Live runtime state nodes
  const liveStateNodes = useMemo(() => {
    const list: Array<{ node: GraphNode; state?: RuntimeState }> = [];
    for (const node of allNodes) {
      const st = runtimeStates.get(node.id);
      if (st && st.value !== undefined) {
        list.push({ node, state: st });
      }
    }
    if (!runtimeFilter.trim()) return list;
    const term = runtimeFilter.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.node.name.toLowerCase().includes(term) ||
        item.node.id.toLowerCase().includes(term) ||
        String(item.state?.value).toLowerCase().includes(term)
    );
  }, [allNodes, runtimeStates, runtimeFilter]);

  if (!isOpen) return null;

  return (
    <aside
      id="right-inspector-panel"
      className="w-84 sm:w-88 md:w-92 bg-neutral-900 border-l border-neutral-800 text-neutral-300 text-xs flex flex-col h-full select-none shrink-0 z-20 shadow-xl"
    >
      {/* 1. Panel Header with 3 Tabs & Close Button */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 bg-neutral-950/80">
        {/* The 3 Tabs: overview, detail, runtime */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {/* Tab 1: Overview */}
          <button
            id="inspector-tab-overview"
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition ${
              activeTab === 'overview'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {/* Tab 2: Detail (Disabled when no node is selected) */}
          <button
            id="inspector-tab-detail"
            disabled={!selectedNode}
            onClick={() => onTabChange('detail')}
            title={
              !selectedNode
                ? '未选中节点时不可用，请点击画布中的节点查看详情'
                : '查看节点详情与依赖链路'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition ${
              !selectedNode
                ? 'opacity-40 cursor-not-allowed text-neutral-500 bg-transparent'
                : activeTab === 'detail'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Detail</span>
          </button>

          {/* Tab 3: Runtime */}
          <button
            id="inspector-tab-runtime"
            onClick={() => onTabChange('runtime')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition ${
              activeTab === 'runtime'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Runtime</span>
          </button>
        </div>

        {/* Close Panel Button */}
        <button
          id="btn-close-inspector-panel"
          onClick={onClose}
          title="完全关闭右侧面板"
          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Panel Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* =============================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* =============================================================== */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            {/* Scenario Header */}
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {scenario.framework}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {scenario.definitions.length} defs
                </span>
              </div>
              <h3 className="text-sm font-semibold text-neutral-100">{scenario.title}</h3>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                {scenario.description}
              </p>
            </div>

            {/* Topology Metrics */}
            <div>
              <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Topology Metrics
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Total Nodes</span>
                  <span className="text-base font-bold text-neutral-100 font-mono">
                    {allNodes.length}
                  </span>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Total Edges</span>
                  <span className="text-base font-bold text-neutral-100 font-mono">
                    {allEdges.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Node Kinds Distribution */}
            <div>
              <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Node Kinds Distribution
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(kindCounts).map(([kind, count]) => (
                  <div
                    key={kind}
                    className="flex items-center justify-between bg-neutral-950 px-2.5 py-1.5 rounded border border-neutral-800"
                  >
                    <span className="capitalize font-mono text-neutral-300 text-[11px]">{kind}</span>
                    <span className="font-mono text-neutral-400 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Node Directory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Quick Node Selector
                </h4>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {filteredDirectoryNodes.length} nodes
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter nodes to inspect..."
                  value={overviewFilter}
                  onChange={(e) => setOverviewFilter(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-md text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {filteredDirectoryNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleSelectNode(n.id)}
                    className="flex items-center justify-between p-2 rounded bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-left transition"
                  >
                    <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[190px]">
                      {n.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">
                      {n.kind}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tip Box */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 text-neutral-400 text-[11px] leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                点击画布中任意节点，即可自动切换至 <strong>Detail</strong> 面板查看源码声明与因果链路依赖。
              </span>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2: DETAIL */}
        {/* =============================================================== */}
        {activeTab === 'detail' && (
          <div className="flex flex-col gap-4">
            {selectedNode ? (
              <>
                {/* Node Top Header & Clear */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                      {selectedNode.kind}
                    </span>
                    {selectedNode.framework && (
                      <span className="text-neutral-400 font-mono text-[10px] bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                        {selectedNode.framework.name}:{selectedNode.framework.type}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClearSelection}
                    title="取消节点选中"
                    className="text-neutral-500 hover:text-neutral-300 p-1 rounded hover:bg-neutral-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Node Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-neutral-100 font-mono tracking-tight break-all">
                    {selectedNode.name}
                  </h3>
                  {selectedNode.description && (
                    <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                      {selectedNode.description}
                    </p>
                  )}
                </div>

                {/* Trigger Event Action (if applicable) */}
                {(selectedNode.kind === 'event' || selectedNode.kind === 'effect') && onTriggerEvent && (
                  <button
                    id="btn-inspector-trigger-event"
                    onClick={() => onTriggerEvent(selectedNode.id)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-medium transition cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Simulate Trigger Event</span>
                  </button>
                )}

                {/* Runtime State Snapshot */}
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Runtime State Snapshot</span>
                    </span>
                    {runtimeState?.version !== undefined && (
                      <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded">
                        v{runtimeState.version}
                      </span>
                    )}
                  </div>

                  {runtimeState?.value !== undefined ? (
                    <pre className="text-[11px] font-mono text-emerald-300 bg-neutral-900 p-2 rounded overflow-x-auto max-h-36 border border-neutral-800">
                      {typeof runtimeState.value === 'object'
                        ? JSON.stringify(runtimeState.value, null, 2)
                        : String(runtimeState.value)}
                    </pre>
                  ) : (
                    <span className="text-neutral-500 text-[11px] italic block">
                      暂无运行时快照（触发上游事件后自动更新）
                    </span>
                  )}
                </div>

                {/* Source Code Declaration */}
                {selectedNode.source && (
                  <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-300 mb-1.5">
                      <FileCode className="w-3.5 h-3.5 text-sky-400" />
                      <span>Source Code Declaration</span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 mb-2 truncate">
                      {selectedNode.source.file}:{selectedNode.source.line}
                    </div>
                    {selectedNode.source.snippet && (
                      <pre className="text-[10.5px] font-mono text-neutral-300 bg-neutral-900 p-2 rounded overflow-x-auto border border-neutral-800">
                        {selectedNode.source.snippet}
                      </pre>
                    )}
                  </div>
                )}

                {/* Upstream Parents */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upstream Sources ({parents.length})</span>
                    </span>
                  </div>
                  {parents.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {parents.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectNode(p.id)}
                          className="text-left bg-neutral-950 hover:border-emerald-500/50 p-2 rounded border border-neutral-800 transition flex items-center justify-between"
                        >
                          <span className="font-mono text-emerald-400 truncate max-w-[190px]">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">
                            {p.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-500 text-[11px] italic block bg-neutral-950 p-2 rounded">
                      根节点（无上游依赖源）
                    </span>
                  )}
                </div>

                {/* Downstream Children */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5">
                    <span className="flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span>Downstream Consumers ({children.length})</span>
                    </span>
                  </div>
                  {children.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {children.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectNode(c.id)}
                          className="text-left bg-neutral-950 hover:border-amber-500/50 p-2 rounded border border-neutral-800 transition flex items-center justify-between"
                        >
                          <span className="font-mono text-amber-400 truncate max-w-[190px]">
                            {c.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">
                            {c.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-500 text-[11px] italic block bg-neutral-950 p-2 rounded">
                      终端输出（无下游受影响消费者）
                    </span>
                  )}
                </div>

                {/* Metadata dump */}
                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                  <details className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-[10px]">
                    <summary className="font-mono text-neutral-400 cursor-pointer font-semibold">
                      Raw Metadata ({Object.keys(selectedNode.metadata).length} keys)
                    </summary>
                    <pre className="mt-2 text-[10px] font-mono text-neutral-400 overflow-x-auto">
                      {JSON.stringify(selectedNode.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </>
            ) : selectedEdge ? (
              /* Edge Inspector (fallback if edge selected) */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                    {selectedEdge.kind} Edge
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-neutral-500 hover:text-neutral-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800 font-mono text-[11px]">
                  {selectedEdge.source} → {selectedEdge.target}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>未选中任何节点</p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  在画布中单击节点后即可查看其详情
                </p>
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 3: RUNTIME */}
        {/* =============================================================== */}
        {activeTab === 'runtime' && (
          <div className="flex flex-col gap-4">
            {/* Simulator Triggerable Events */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Simulate Events</span>
                </h4>
                {onResetStates && (
                  <button
                    id="btn-inspector-reset-state"
                    onClick={onResetStates}
                    title="重置运行时状态为初始值"
                    className="flex items-center gap-1 px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {scenario.triggerableEvents.map((evt) => (
                  <button
                    key={evt.id}
                    id={`inspector-btn-trigger-${evt.id}`}
                    disabled={isSimulating}
                    onClick={() => onTriggerPresetEvent && onTriggerPresetEvent(evt)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-left transition disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-200 font-semibold">
                        <Play className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        <span>{evt.id}</span>
                      </div>
                      <span className="text-[10.5px] text-neutral-400 block mt-0.5">
                        {evt.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Runtime Store Values */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Store Values ({liveStateNodes.length})</span>
                </h4>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter runtime values..."
                  value={runtimeFilter}
                  onChange={(e) => setRuntimeFilter(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-md text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                {liveStateNodes.length > 0 ? (
                  liveStateNodes.map(({ node, state }) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() => handleSelectNode(node.id)}
                        className={`p-2 rounded-lg border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-neutral-950 hover:bg-neutral-800/80 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono text-[11px] block truncate font-medium">
                            {node.name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {node.kind} {state?.version ? `• v${state.version}` : ''}
                          </span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-mono text-[11px] text-emerald-400 font-bold bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                            {typeof state?.value === 'object'
                              ? JSON.stringify(state.value)
                              : String(state?.value)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-neutral-500 text-[11px] italic p-2 bg-neutral-950 rounded">
                    无匹配状态数据
                  </span>
                )}
              </div>
            </div>

            {/* Event History Log */}
            {events.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Recent Event Dispatches
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {events.length} events
                  </span>
                </div>
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                  {events.slice(-6).reverse().map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-neutral-950 p-2 rounded border border-neutral-800 font-mono text-[10.5px] flex items-center justify-between"
                    >
                      <span className="text-amber-400 truncate max-w-[160px]">{ev.nodeId}</span>
                      <span className="text-neutral-500 text-[10px]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
