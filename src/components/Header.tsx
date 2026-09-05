import React from 'react';
import { useAtom } from 'jotai';
import {
  Layers,
  Cpu,
  Database,
  Activity,
  Share2,
} from 'lucide-react';
import { PRESET_SCENARIOS } from '../core/adapters/presetModels';
import {
  selectedPresetAtom,
  activeTabAtom,
} from '../store/atoms';

export type { ActiveTab } from '../store/atoms';

interface HeaderProps {
  nodeCount: number;
  edgeCount: number;
}

export const Header: React.FC<HeaderProps> = ({ nodeCount, edgeCount }) => {
  const [selectedPreset, setSelectedPreset] = useAtom(selectedPresetAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  return (
    <header
      id="app-header"
      className="bg-neutral-900 border-b border-neutral-800 text-neutral-200 select-none shrink-0"
    >
      {/* Row 1: Brand Title & Scenario Selector */}
      <div className="px-4 py-2 flex items-center justify-between gap-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-neutral-100 tracking-tight whitespace-nowrap">
              Frontend State Flow Visualizer
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 hidden sm:inline">
              Universal State DAG
            </span>
          </div>
        </div>

        {/* Preset / Scenario Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="preset-select" className="text-xs text-neutral-400 font-medium hidden sm:inline">
            Scenario:
          </label>
          <select
            id="preset-select"
            value={selectedPreset.id}
            onChange={(e) => {
              const found = PRESET_SCENARIOS.find((p) => p.id === e.target.value);
              if (found) setSelectedPreset(found);
            }}
            className="bg-neutral-950 text-neutral-200 text-xs font-medium rounded-md px-2.5 py-1.5 border border-neutral-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
          >
            {PRESET_SCENARIOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: DAG Navigation Tabs & Stats */}
      <div className="px-4 py-1.5 bg-neutral-950/60 flex items-center justify-between gap-3 overflow-x-auto">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            id="tab-graph"
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'graph'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>DAG</span>
          </button>

          <button
            id="tab-index"
            onClick={() => setActiveTab('index')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'index'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Memory</span>
          </button>

          <button
            id="tab-timeline"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Event</span>
          </button>

          <button
            id="tab-architecture"
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'architecture'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
        </nav>

        {/* Node/Edge Counter */}
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900/80 px-2.5 py-1 rounded-md border border-neutral-800 shrink-0">
          <span>
            Nodes: <strong className="text-neutral-200">{nodeCount}</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span>
            Edges: <strong className="text-neutral-200">{edgeCount}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
