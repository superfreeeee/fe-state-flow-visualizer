import React from 'react';
import { useSetAtom } from 'jotai';
import {
  X,
  FileCode,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Info,
  Layers,
  Code2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { GraphNode, GraphEdge, NodeId, EdgeId } from '../../types/graph';
import { RuntimeState } from '../../types/runtime';
import { selectNodeActionAtom, clearSelectionActionAtom } from '../../store/atoms';

interface NodeInspectorProps {
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  parents: GraphNode[];
  children: GraphNode[];
  runtimeState?: RuntimeState;
  onSelectNode?: (id: NodeId | null) => void;
  onClose?: () => void;
  onTriggerEvent?: (nodeId: NodeId) => void;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  selectedEdge,
  parents,
  children,
  runtimeState,
  onSelectNode,
  onClose,
  onTriggerEvent,
  allNodes,
  allEdges,
}) => {
  const defaultSelectNode = useSetAtom(selectNodeActionAtom);
  const defaultClose = useSetAtom(clearSelectionActionAtom);
  const handleSelectNode = onSelectNode || defaultSelectNode;
  const handleClose = onClose || defaultClose;

  if (!selectedNode && !selectedEdge) {
    // Summary overview when nothing is selected
    const kindCounts = allNodes.reduce((acc, n) => {
      acc[n.kind] = (acc[n.kind] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <aside
        id="graph-summary-inspector"
        className="w-80 bg-neutral-900 border-l border-neutral-800 p-5 overflow-y-auto text-neutral-300 text-xs flex flex-col gap-5 select-none"
      >
        <div className="flex items-center gap-2 text-neutral-100 font-semibold border-b border-neutral-800 pb-3">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Graph Overview & Topology</span>
        </div>

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

        <div>
          <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Node Kinds Distribution
          </h4>
          <div className="flex flex-col gap-1.5">
            {Object.entries(kindCounts).map(([kind, count]) => (
              <div
                key={kind}
                className="flex items-center justify-between bg-neutral-950 px-2.5 py-1.5 rounded border border-neutral-800"
              >
                <span className="capitalize font-mono text-neutral-300">{kind}</span>
                <span className="font-mono text-neutral-400 font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 text-neutral-400 text-[11px] leading-relaxed">
          <p className="flex items-start gap-1.5">
            <Layers className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <span>
              Click any node in the canvas to inspect its source location, runtime value snapshot,
              and trace upstream root causes or downstream side-effects.
            </span>
          </p>
        </div>
      </aside>
    );
  }

  // Inspect Selected Edge
  if (selectedEdge) {
    const src = allNodes.find((n) => n.id === selectedEdge.source);
    const tgt = allNodes.find((n) => n.id === selectedEdge.target);

    return (
      <aside
        id="edge-inspector"
        className="w-80 bg-neutral-900 border-l border-neutral-800 p-5 overflow-y-auto text-neutral-300 text-xs flex flex-col gap-4"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
              {selectedEdge.kind}
            </span>
            <span className="font-semibold text-neutral-100">Edge Inspector</span>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-300 p-1 rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <span className="text-[10px] text-neutral-500 block mb-1">EDGE ID</span>
          <code className="text-[11px] text-neutral-300 bg-neutral-950 p-1.5 rounded block border border-neutral-800 break-all font-mono">
            {selectedEdge.id}
          </code>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[10px] text-neutral-500 block mb-1">SOURCE NODE</span>
            <button
              onClick={() => src && handleSelectNode(src.id)}
              className="w-full text-left bg-neutral-950 hover:border-emerald-500/50 p-2 rounded border border-neutral-800 transition flex items-center justify-between"
            >
              <span className="font-mono text-emerald-400 font-semibold">{src?.name || selectedEdge.source}</span>
              <span className="text-[10px] text-neutral-500 uppercase">{src?.kind}</span>
            </button>
          </div>

          <div className="text-center text-neutral-600 font-bold">↓ {selectedEdge.label || selectedEdge.kind} ↓</div>

          <div>
            <span className="text-[10px] text-neutral-500 block mb-1">TARGET NODE</span>
            <button
              onClick={() => tgt && handleSelectNode(tgt.id)}
              className="w-full text-left bg-neutral-950 hover:border-sky-500/50 p-2 rounded border border-neutral-800 transition flex items-center justify-between"
            >
              <span className="font-mono text-sky-400 font-semibold">{tgt?.name || selectedEdge.target}</span>
              <span className="text-[10px] text-neutral-500 uppercase">{tgt?.kind}</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Inspect Selected Node
  if (!selectedNode) return null;

  const isEvent = selectedNode.kind === 'event' || selectedNode.kind === 'effect';

  return (
    <aside
      id="node-inspector"
      className="w-84 bg-neutral-900 border-l border-neutral-800 p-5 overflow-y-auto text-neutral-300 text-xs flex flex-col gap-4 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
            {selectedNode.kind}
          </span>
          <span className="text-neutral-400 font-mono text-[11px]">
            {selectedNode.framework ? `${selectedNode.framework.name}:${selectedNode.framework.type}` : ''}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="text-neutral-500 hover:text-neutral-300 p-1 rounded hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
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
      {isEvent && onTriggerEvent && (
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
            <span>Runtime State</span>
          </span>
          {runtimeState?.version && (
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
          <span className="text-neutral-500 text-[11px] italic">
            No runtime snapshot recorded yet (trigger upstream event to populate)
          </span>
        )}
      </div>

      {/* Source Location */}
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
                <span className="font-mono text-emerald-400 truncate max-w-[170px]">
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
            Root node (no upstream dependencies)
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
                <span className="font-mono text-amber-400 truncate max-w-[170px]">
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
            Terminal sink (no downstream consumers)
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
    </aside>
  );
};
