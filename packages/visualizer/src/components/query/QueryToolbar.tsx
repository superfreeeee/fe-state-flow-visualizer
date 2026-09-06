import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  Search,
  RotateCcw,
  GitFork,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  Filter,
  Download,
  Upload,
} from 'lucide-react';
import { NodeKind } from '@state-flow/common';
import {
  searchTermAtom,
  selectedKindsAtom,
  queryDirectionAtom,
  selectedNodeIdAtom,
  layoutDirectionAtom,
  modalStateAtom,
  toggleKindActionAtom,
  resetFiltersActionAtom,
  clearSelectionActionAtom,
  selectedGraphAtom,
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

export const QueryToolbar: React.FC<QueryToolbarProps> = ({ selectedNodeName, visibleCount, totalCount }) => {
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const selectedKinds = useAtomValue(selectedKindsAtom);
  const toggleKind = useSetAtom(toggleKindActionAtom);
  const [direction, setDirection] = useAtom(queryDirectionAtom);
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);
  const resetFilters = useSetAtom(resetFiltersActionAtom);
  const clearSelection = useSetAtom(clearSelectionActionAtom);
  const [layoutDirection, setLayoutDirection] = useAtom(layoutDirectionAtom);
  const setModalState = useSetAtom(modalStateAtom);
  const selectedGraph = useAtomValue(selectedGraphAtom);

  return (
    <div
      id="query-toolbar"
      className="h-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 py-2 flex items-center justify-between gap-3 text-xs overflow-x-auto select-none shrink-0"
    >
      {/* Left: Search & Filter Kinds */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="query-search-input"
            type="text"
            placeholder="Filter nodes (name, type, id)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-52 pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-700 text-neutral-200 placeholder-neutral-500 rounded-md focus:outline-none focus:border-emerald-500 transition text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Node Kind Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-neutral-500 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3" />
            <span className="hidden xl:inline">Kinds:</span>
          </span>
          {ALL_KINDS.map(({ kind, label, color }) => {
            const isSelected = selectedKinds.includes(kind);
            return (
              <button
                key={kind}
                id={`filter-kind-${kind}`}
                onClick={() => toggleKind(kind)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  isSelected
                    ? color
                    : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle: Focus Path Traversal (when node selected) */}
      {selectedNodeId && (
        <div className="flex items-center gap-2 px-2.5 py-1 bg-neutral-950/80 rounded-md border border-neutral-800 shrink-0">
          <span className="text-neutral-400 font-mono text-[11px] truncate max-w-[130px] text-emerald-400 font-semibold">
            {selectedNodeName || selectedNodeId}
          </span>
          <div className="flex items-center bg-neutral-900 rounded p-0.5 border border-neutral-800">
            <button
              id="btn-dir-upstream"
              title="前序因果溯源：仅高亮所有直接与间接推导源"
              onClick={() => setDirection('upstream')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
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
              title="后序波及分析：仅高亮所有受影响的下游消费者"
              onClick={() => setDirection('downstream')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
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
              title="双向全链路：高亮全部关联链路"
              onClick={() => setDirection('both')}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
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
      )}

      {/* Right: Layout Direction (TB/LR), Import/Export, Visibility Stats, Panel Toggle */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Visibility Stats & Reset */}
        {selectedNodeId ? (
          <span className="text-neutral-400 font-mono text-[11px] bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
            <span className="text-emerald-400 font-bold">{visibleCount}</span>/{totalCount} 高亮
          </span>
        ) : (
          <span className="text-neutral-400 font-mono text-[11px] bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
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

        <div className="h-4 w-px bg-neutral-800" />

        {/* 布局切换: TB 或是 LR */}
        <button
          id="btn-toggle-direction"
          title={`切换布局方向：当前为 ${layoutDirection === 'TB' ? '从上到下 (TB)' : '从左到右 (LR)'}`}
          onClick={() => setLayoutDirection((d) => (d === 'TB' ? 'LR' : 'TB'))}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-md border border-neutral-700 transition cursor-pointer"
        >
          {layoutDirection === 'TB' ? (
            <>
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-medium">TB</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-medium">LR</span>
            </>
          )}
        </button>

        {/* 上传下载: Export / Import */}
        <div className="flex items-center bg-neutral-950 rounded-md border border-neutral-700 p-0.5">
          <button
            id="btn-export-json"
            title="下载 / 导出 Graph JSON"
            disabled={!selectedGraph}
            onClick={() => setModalState({ isOpen: true, mode: 'export' })}
            className="p-1 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-neutral-800" />
          <button
            id="btn-import-json"
            title="上传 / 导入 Graph JSON"
            disabled={!selectedGraph}
            onClick={() => setModalState({ isOpen: true, mode: 'import' })}
            className="p-1 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
