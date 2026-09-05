import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  Layers,
  Cpu,
  Database,
  Activity,
  Download,
  Upload,
  ArrowDownRight,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { PRESET_SCENARIOS } from '../core/adapters/presetModels';
import {
  selectedPresetAtom,
  activeTabAtom,
  layoutDirectionAtom,
  modalStateAtom,
} from '../store/atoms';

export type { ActiveTab } from '../store/atoms';

interface HeaderProps {
  nodeCount: number;
  edgeCount: number;
}

export const Header: React.FC<HeaderProps> = ({ nodeCount, edgeCount }) => {
  const [selectedPreset, setSelectedPreset] = useAtom(selectedPresetAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [direction, setDirection] = useAtom(layoutDirectionAtom);
  const setModalState = useSetAtom(modalStateAtom);

  return (
    <header
      id="app-header"
      className="bg-neutral-900 border-b border-neutral-800 text-neutral-200 px-5 py-3 select-none flex flex-wrap items-center justify-between gap-4"
    >
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-neutral-100 tracking-tight">
              Frontend State Flow Visualizer
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 font-mono">
              Phase 1 + Core Infra
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Universal State DAG • Framework Adapters • Query Engine • Runtime Inspector
          </p>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
        <label htmlFor="preset-select" className="text-xs text-neutral-400 px-2 font-medium">
          Scenario:
        </label>
        <select
          id="preset-select"
          value={selectedPreset.id}
          onChange={(e) => {
            const found = PRESET_SCENARIOS.find((p) => p.id === e.target.value);
            if (found) setSelectedPreset(found);
          }}
          className="bg-neutral-900 text-neutral-200 text-xs font-medium rounded-md px-2.5 py-1.5 border border-neutral-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          {PRESET_SCENARIOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
        <button
          id="tab-graph"
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'graph'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>DAG Visualizer</span>
        </button>

        <button
          id="tab-architecture"
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'architecture'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Architecture & Design</span>
        </button>

        <button
          id="tab-index"
          onClick={() => setActiveTab('index')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'index'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Index & Memory</span>
        </button>

        <button
          id="tab-timeline"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Event Timeline</span>
        </button>
      </nav>

      {/* Metrics & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Node/Edge Counter */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
          <span>
            Nodes: <strong className="text-neutral-200">{nodeCount}</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span>
            Edges: <strong className="text-neutral-200">{edgeCount}</strong>
          </span>
        </div>

        {/* Orientation toggle */}
        <button
          id="btn-toggle-direction"
          title={`Layout direction: ${direction === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}`}
          onClick={() => setDirection((d) => (d === 'TB' ? 'LR' : 'TB'))}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md border border-neutral-700 transition"
        >
          {direction === 'TB' ? (
            <>
              <ArrowDownRight className="w-3.5 h-3.5 text-neutral-400" />
              <span>TB</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              <span>LR</span>
            </>
          )}
        </button>

        {/* Export / Import */}
        <button
          id="btn-export-json"
          title="Export Graph JSON"
          onClick={() => setModalState({ isOpen: true, mode: 'export' })}
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md border border-neutral-700 transition"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          id="btn-import-json"
          title="Import Graph JSON"
          onClick={() => setModalState({ isOpen: true, mode: 'import' })}
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md border border-neutral-700 transition"
        >
          <Upload className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
