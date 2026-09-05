import { atom } from 'jotai';
import { PRESET_SCENARIOS, PresetScenario } from '../core/adapters/presetModels';
import { NodeKind, NodeId, EdgeId } from '../types/graph';
import { QueryDirection } from '../types/query';

export type ActiveTab = 'graph' | 'architecture' | 'index' | 'timeline';

// 1. Core Navigation & Scenario Atoms
export const selectedPresetAtom = atom(PRESET_SCENARIOS[0] as PresetScenario);
export const activeTabAtom = atom('graph' as ActiveTab);
export const layoutDirectionAtom = atom('TB' as 'TB' | 'LR');

// 2. Modal Atoms
export interface ModalState {
  isOpen: boolean;
  mode: 'import' | 'export';
}
export const modalStateAtom = atom<ModalState>({
  isOpen: false,
  mode: 'export',
});

// 3. Query & Filter Atoms
export const searchTermAtom = atom('');
export const selectedKindsAtom = atom([] as NodeKind[]);
export const queryDirectionAtom = atom('both' as QueryDirection);

// 4. Selection Atoms
export const selectedNodeIdAtom = atom(null as NodeId | null);
export const selectedEdgeIdAtom = atom(null as EdgeId | null);

// 5. Simulation & Runtime UI Atoms
export const activePulseEdgeIdAtom = atom(null as EdgeId | null);
export const isSimulatingAtom = atom(false);

// 6. Action / Dispatcher Atoms (Simplify State & Setter Passing)
export const selectNodeActionAtom = atom(
  null,
  (_get, set, nodeId: NodeId | null) => {
    set(selectedNodeIdAtom, nodeId);
    set(selectedEdgeIdAtom, null);
  }
);

export const selectEdgeActionAtom = atom(
  null,
  (_get, set, edgeId: EdgeId | null) => {
    set(selectedEdgeIdAtom, edgeId);
    set(selectedNodeIdAtom, null);
  }
);

export const clearSelectionActionAtom = atom(null, (_get, set) => {
  set(selectedNodeIdAtom, null);
  set(selectedEdgeIdAtom, null);
});

export const toggleKindActionAtom = atom(
  null,
  (get, set, kind: NodeKind) => {
    const current = get(selectedKindsAtom);
    if (current.includes(kind)) {
      set(selectedKindsAtom, current.filter((k) => k !== kind));
    } else {
      set(selectedKindsAtom, [...current, kind]);
    }
  }
);

export const resetFiltersActionAtom = atom(null, (_get, set) => {
  set(searchTermAtom, '');
  set(selectedKindsAtom, []);
  set(queryDirectionAtom, 'both');
  set(selectedNodeIdAtom, null);
  set(selectedEdgeIdAtom, null);
});
