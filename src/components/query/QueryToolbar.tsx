import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  Search,
  RotateCcw,
  GitFork,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  X,
} from 'lucide-react';
import { NodeKind } from '../../types/graph';
import {
  searchTermAtom,
  selectedKindsAtom,
  queryDirectionAtom,
  selectedNodeIdAtom,
  toggleKindActionAtom,
  resetFiltersActionAtom,
  clearSelectionActionAtom,
} from '../../store/atoms';

interface QueryToolbarProps {
  selectedNodeName?: string;
  visibleCount: number;
  totalCount: number;
}

const ALL_KINDS: Array<{ kind: NodeKind; label: string; color: string }> = [
  { kind: 'state', label: 'Store/State', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { kind: 'derived', label: 'Derived', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { kind: 'event', label: 'Event', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { kind: 'effect', label: 'Effect', color: 'bg-violet-500/20 text-violet-300 border-violet-500/40' },
  { kind: 'reaction', label: 'Reaction/Sample', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  { kind: 'component', label: 'Component', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
];

export const QueryToolbar: React.FC<QueryToolbarProps> = ({
  selectedNodeName,
  visibleCount,
  totalCount,
}) => {
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const selectedKinds = useAtomValue(selectedKindsAtom);
  const toggleKind = useSetAtom(toggleKindActionAtom);
  const [direction, setDirection] = useAtom(queryDirectionAtom);
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);
  const resetFilters = useSetAtom(resetFiltersActionAtom);
  const clearSelection = useSetAtom(clearSelectionActionAtom);

  return (
    <div
      id="query-toolbar"
      className="bg-neutral-900/90 backdrop-blur border-b border-neutral-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="query-search-input"
            type="text"
            placeholder="Filter nodes (name, type, id)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56 pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-700 text-neutral-200 placeholder-neutral-500 rounded-md focus:outline-none focus:border-emerald-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              ×
            </button>
          )}
        </div>

        {/* Node Kind Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-neutral-500 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Kinds:</span>
          </span>
          {ALL_KINDS.map(({ kind, label, color }) => {
            const isSelected = selectedKinds.includes(kind);
            return (
              <button
                key={kind}
                id={`filter-kind-${kind}`}
                onClick={() => toggleKind(kind)}
                className={`px-2 py-1 rounded-md border text-[11px] font-medium transition cursor-pointer ${
                  isSelected
                    ? color
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directional Traversal (Upstream / Downstream focus) */}
      <div className="flex items-center gap-2 flex-wrap">
        {selectedNodeId ? (
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-700 text-neutral-300">
            <span className="text-neutral-500 font-mono">Focus:</span>
            <span className="font-semibold text-emerald-400 max-w-[130px] truncate">
              {selectedNodeName || selectedNodeId}
            </span>

            {/* Exit focus mode */}
            <button
              id="btn-clear-focus"
              onClick={clearSelection}
              title="退出 Focus 模式"
              className="p-0.5 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Mode selection buttons */}
            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-neutral-700">
              <button
                id="btn-dir-upstream"
                title="前序模式：高亮上游因果依赖链路，其余节点保留 0.4 透明度"
                onClick={() => setDirection('upstream')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  direction === 'upstream'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>前序</span>
              </button>
              <button
                id="btn-dir-downstream"
                title="后序模式：高亮下游受影响路径，其余节点保留 0.4 透明度"
                onClick={() => setDirection('downstream')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  direction === 'downstream'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>后序</span>
              </button>
              <button
                id="btn-dir-both"
                title="双向全链路：高亮全部关联链路，其余节点保留 0.4 透明度"
                onClick={() => setDirection('both')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  direction === 'both'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <GitFork className="w-3.5 h-3.5 text-sky-400" />
                <span>双向</span>
              </button>
            </div>
          </div>
        ) : (
          <span className="text-neutral-500 text-[11px] hidden sm:inline">
            点击画布任一节点开启前序/后序链路 Focus (非路径节点保持 0.4 透明度)
          </span>
        )}

        {/* Visibility Stats & Reset */}
        <div className="flex items-center gap-2">
          {selectedNodeId ? (
            <span className="text-neutral-400 font-mono text-[11px] bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
              <span className="text-emerald-400 font-bold">{visibleCount}</span>/{totalCount} 链路高亮 (其余 0.4)
            </span>
          ) : (
            <span className="text-neutral-400 font-mono text-[11px]">
              {visibleCount}/{totalCount} 节点
            </span>
          )}

          {(searchTerm || selectedKinds.length > 0 || direction !== 'both' || selectedNodeId) && (
            <button
              id="btn-reset-filters"
              onClick={resetFilters}
              title="Reset all filters"
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
