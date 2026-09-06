import { atom } from 'jotai';
import { PRESET_SCENARIOS, PresetScenario } from '../core/adapters/presetModels';
import { NodeKind, NodeId, EdgeId } from '../types/graph';
import { QueryDirection } from '../types/query';

export type ActiveTab = 'graph' | 'architecture' | 'index' | 'timeline';
export type InspectorTab = 'overview' | 'detail' | 'runtime';

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

// 5. Inspector Panel Atoms
export const isInspectorOpenAtom = atom(true);
export const inspectorTabAtom = atom<InspectorTab>('overview');

// 6. Simulation & Runtime UI Atoms
export const activePulseEdgeIdAtom = atom(null as EdgeId | null);
export const isSimulatingAtom = atom(false);

// 7. Action / Dispatcher Atoms (Simplify State & Setter Passing)
export const selectNodeActionAtom = atom(
  null,
  (get, set, nodeId: NodeId | null) => {
    set(selectedNodeIdAtom, nodeId);
    set(selectedEdgeIdAtom, null);
    if (nodeId) {
      set(inspectorTabAtom, 'detail');
    } else {
      if (get(inspectorTabAtom) === 'detail') {
        set(inspectorTabAtom, 'overview');
      }
    }
  }
);

export const selectEdgeActionAtom = atom(
  null,
  (get, set, edgeId: EdgeId | null) => {
    set(selectedEdgeIdAtom, edgeId);
    set(selectedNodeIdAtom, null);
    if (edgeId) {
      // If an edge is selected without a node, fallback to overview or keep current
      if (get(inspectorTabAtom) === 'detail') {
        set(inspectorTabAtom, 'overview');
      }
    }
  }
);

export const clearSelectionActionAtom = atom(null, (get, set) => {
  set(selectedNodeIdAtom, null);
  set(selectedEdgeIdAtom, null);
  if (get(inspectorTabAtom) === 'detail') {
    set(inspectorTabAtom, 'overview');
  }
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
