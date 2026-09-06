import React from 'react';
import { useSetAtom } from 'jotai';
import { Activity, Clock, Zap, ArrowRight, Trash2 } from 'lucide-react';
import { RuntimeEvent } from '../../types/runtime';
import { Graph } from '@state-flow/common';
import { selectNodeActionAtom, activeTabAtom } from '../../store/atoms';

interface EventTimelineViewerProps {
  events: RuntimeEvent[];
  graph: Graph;
  onClear: () => void;
}

export const EventTimelineViewer: React.FC<EventTimelineViewerProps> = ({
  events,
  graph,
  onClear,
}) => {
  const selectNode = useSetAtom(selectNodeActionAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  return (
    <div
      id="event-timeline-viewer"
      className="w-full h-full bg-neutral-950 text-neutral-200 overflow-y-auto p-6 md:p-8 select-text text-xs"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>Runtime Event Stream & Trace (Phase 2 运行时流)</span>
            </h2>
            <p className="text-neutral-400 text-xs mt-1">
              追踪记录响应式拓扑中触发的每一个微任务与状态更新事件序列。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-neutral-400 text-[11px]">
              {events.length} events logged
            </span>
            {events.length > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 transition text-[11px]"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Clear Trace</span>
              </button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xl">
            <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-300 mb-1">
              No Runtime Events Recorded Yet
            </h3>
            <p className="text-neutral-500 text-xs max-w-sm mx-auto">
              Switch back to the DAG Visualizer and click on any event trigger button in the bottom simulator bar to observe real-time event propagation.
            </p>
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {events.map((evt, idx) => {
              const node = graph.getNode(evt.nodeId);
              const dateStr = new Date(evt.timestamp).toLocaleTimeString();

              let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              if (evt.type === 'update') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
              if (evt.type === 'compute') badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
              if (evt.type.startsWith('effect')) badgeColor = 'bg-violet-500/20 text-violet-300 border-violet-500/30';

              return (
                <div
                  key={evt.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 hover:border-neutral-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-600 text-[10px] w-6 text-right">
                      #{events.length - idx}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${badgeColor}`}
                    >
                      {evt.type}
                    </span>
                    <button
                      onClick={() => {
                        selectNode(evt.nodeId);
                        setActiveTab('graph');
                      }}
                      className="font-semibold text-neutral-100 hover:text-emerald-400 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{node?.name || evt.nodeId}</span>
                      <ArrowRight className="w-3 h-3 text-neutral-600" />
                    </button>
                    <span className="text-neutral-500 text-[10px]">{node?.kind}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {evt.value !== undefined && (
                      <span className="text-[11px] text-emerald-300 bg-neutral-950 px-2 py-1 rounded border border-neutral-800 max-w-xs truncate">
                        {typeof evt.value === 'object'
                          ? JSON.stringify(evt.value)
                          : String(evt.value)}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-500 font-sans">{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
