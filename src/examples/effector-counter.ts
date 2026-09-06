import { createEvent, createStore } from 'effector';

const onInc = createEvent();
const onReset = createEvent();
const $count = createStore(0)
  .on(onInc, (count) => count + 1)
  .on(onReset, () => 0);

console.log({ $count, onInc, onReset });
