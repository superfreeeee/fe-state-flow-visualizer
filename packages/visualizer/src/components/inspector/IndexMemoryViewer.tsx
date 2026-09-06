import React from 'react';
import { Database, GitBranch, Terminal, RefreshCw } from 'lucide-react';
import { Graph } from '@state-flow/common';
import { RuntimeStore } from '../../core/runtime/RuntimeStore';

interface IndexMemoryViewerProps {
  graph: Graph | null;
  runtimeStore: RuntimeStore;
}

export const IndexMemoryViewer: React.FC<IndexMemoryViewerProps> = ({ graph, runtimeStore }) => {
  if (!graph) {
    return <div>no graph</div>;
  }
  const index = graph.getIndex();
  const allNodes = graph.getAllNodes();
  const allEdges = graph.getAllEdges();
  const runtimeMap = runtimeStore.getAll();

  return (
    <div
      id="index-memory-viewer"
      className="w-full h-full bg-neutral-950 text-neutral-200 overflow-y-auto p-6 md:p-8 font-mono text-xs select-text"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>GraphIndex & RuntimeStore 内存状态观察器</span>
            </h2>
            <p className="text-neutral-400 text-xs mt-1 font-sans">
              实时展示内部哈希表、倒排索引及邻接表存储结构，验证 O(1) 检索设计。
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
            <span>
              Nodes in Hash: <strong className="text-emerald-400">{allNodes.length}</strong>
            </span>
            <span className="text-neutral-600">|</span>
            <span>
              Edges in Hash: <strong className="text-sky-400">{allEdges.length}</strong>
            </span>
          </div>
        </div>

        {/* Inverted Index by Kind */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-neutral-300 tracking-wider flex items-center gap-2 font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>倒排索引：nodesByKind (Map&lt;NodeKind, Set&lt;NodeId&gt;&gt;)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(index.nodesByKind.entries()).map(([kind, nodeIds]) => (
              <div key={kind} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-emerald-400 font-bold">{kind}</span>
                  <span className="text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-500">
                    {nodeIds.size} nodes
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 flex flex-wrap gap-1">
                  {Array.from(nodeIds).map((id) => (
                    <span key={id} className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 text-[10px]">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adjacency Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-neutral-300 tracking-wider flex items-center gap-2 font-sans">
            <GitBranch className="w-4 h-4 text-sky-400" />
            <span>双向邻接拓扑：incomingEdges & outgoingEdges</span>
          </h3>

          <div className="bg-neutral-950 rounded-lg border border-neutral-800 overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 text-[10px] uppercase">
                  <th className="p-3 font-semibold">Node ID</th>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Incoming Edges (Upstream)</th>
                  <th className="p-3 font-semibold">Outgoing Edges (Downstream)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {allNodes.map((n) => {
                  const inEdges = Array.from(index.incomingEdges.get(n.id) || []);
                  const outEdges = Array.from(index.outgoingEdges.get(n.id) || []);

                  return (
                    <tr key={n.id} className="hover:bg-neutral-900/40 transition">
                      <td className="p-3 text-neutral-300 font-bold">{n.id}</td>
                      <td className="p-3 text-emerald-400">{n.name}</td>
                      <td className="p-3">
                        {inEdges.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {inEdges.map((eid) => (
                              <span
                                key={eid}
                                className="bg-neutral-900 text-sky-300 px-1.5 py-0.5 rounded text-[10px] border border-neutral-800"
                              >
                                {eid}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-600 italic">none (root)</span>
                        )}
                      </td>
                      <td className="p-3">
                        {outEdges.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {outEdges.map((eid) => (
                              <span
                                key={eid}
                                className="bg-neutral-900 text-amber-300 px-1.5 py-0.5 rounded text-[10px] border border-neutral-800"
                              >
                                {eid}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-600 italic">none (sink)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Runtime Store Memory Dump */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-neutral-300 tracking-wider flex items-center gap-2 font-sans">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>解耦的 RuntimeStore 内存状态 (Map&lt;NodeId, RuntimeState&gt;)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from(runtimeMap.entries()).map(([nodeId, state]) => (
              <div key={nodeId} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-neutral-200 font-bold">{nodeId}</span>
                  <span className="text-[10px] text-neutral-500">v{state.version}</span>
                </div>
                <pre className="text-[10.5px] text-emerald-300 bg-neutral-900 p-2 rounded border border-neutral-800/80 overflow-x-auto">
                  {JSON.stringify(state.value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
