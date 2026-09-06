import { createEvent, createStore } from 'effector';

/**
 * Basic Effector Counter Model
 * Demonstrates elementary store, events, and .on() mutations
 */
export const increment = createEvent<number | void>('increment');
export const decrement = createEvent<void>('decrement');
export const reset = createEvent<void>('reset');

export const $counter = createStore<number>(0, { name: '$counter' })
  .on(increment, (state, step) => state + (typeof step === 'number' ? step : 1))
  .on(decrement, (state) => state - 1)
  .reset(reset);
