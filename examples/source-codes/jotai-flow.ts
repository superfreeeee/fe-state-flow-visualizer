import { atom } from 'jotai';

export interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

// 1. Primitive State Atoms
export const baseCountAtom = atom(10);
export const stepAtom = atom(2);
export const currentUserAtom = atom<UserProfile>({
  id: 'u_101',
  name: 'Alex Developer',
  role: 'admin',
});
export const logHistoryAtom = atom<string[]>([]);

// 2. Read-only Derived Atoms (Dependent on primitive atoms)
export const doubleCountAtom = atom((get) => get(baseCountAtom) * 2);

export const userGreetingAtom = atom((get) => {
  const user = get(currentUserAtom);
  const count = get(baseCountAtom);
  return `Hello, ${user.name} (${user.role})! Target value: ${count}`;
});

export const isExceededAtom = atom((get) => get(doubleCountAtom) > 50);

// 3. Write-only / Action Atoms
export const incrementActionAtom = atom(null, (get, set) => {
  const step = get(stepAtom);
  const current = get(baseCountAtom);
  const nextVal = current + step;
  set(baseCountAtom, nextVal);
  set(logHistoryAtom, (prev) => [...prev, `Incremented by ${step} to ${nextVal}`]);
});

export const resetAllActionAtom = atom(null, (_get, set) => {
  set(baseCountAtom, 0);
  set(logHistoryAtom, (prev) => [...prev, 'Reset counter to 0']);
});
