import React from 'react';
import { useAtomValue } from 'jotai';
import { Play, RotateCcw, Sparkles } from 'lucide-react';
import { PresetScenario } from '../../core/adapters/presetModels';
import { selectedPresetAtom, isSimulatingAtom } from '../../store/atoms';

interface RuntimeSimulatorProps {
  onTriggerPresetEvent: (eventDef: PresetScenario['triggerableEvents'][0]) => void;
  onResetStates: () => void;
}

export const RuntimeSimulator: React.FC<RuntimeSimulatorProps> = ({
  onTriggerPresetEvent,
  onResetStates,
}) => {
  const scenario = useAtomValue(selectedPresetAtom);
  const isSimulating = useAtomValue(isSimulatingAtom);
  return (
    <div
      id="runtime-simulator-bar"
      className="bg-neutral-900 border-t border-neutral-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Runtime Flow Simulator:</span>
        </div>
        <span className="text-neutral-400 text-[11px] hidden sm:inline">
          Click an event to trigger reactive propagation across the Graph:
        </span>
      </div>

      {/* Triggerable Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {scenario.triggerableEvents.map((evt) => (
          <button
            key={evt.id}
            id={`btn-trigger-${evt.id}`}
            disabled={isSimulating}
            onClick={() => onTriggerPresetEvent(evt)}
            title={evt.description}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50 text-neutral-200 border border-neutral-700 rounded-md font-medium transition cursor-pointer"
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="font-mono text-[11px]">{evt.id}</span>
          </button>
        ))}

        <button
          id="btn-reset-runtime-states"
          onClick={onResetStates}
          title="Reset runtime values to initial state"
          className="flex items-center gap-1 px-2.5 py-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="text-[11px]">Reset State</span>
        </button>
      </div>
    </div>
  );
};
