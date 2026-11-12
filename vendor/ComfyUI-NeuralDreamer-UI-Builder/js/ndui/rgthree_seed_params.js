// ND UI bridge for the existing rgthree Seed node; no queue hooks or generation.
const MODES = ['fixed', 'increment', 'decrement', 'randomize'];
const SPECIAL = {increment: -2, decrement: -3, randomize: -1};
const previous = new WeakMap();
export function seedControlParams(node, touch = () => {}) {
  const seed = node.seedWidget || node.widgets?.find(w => w.name === 'seed');
  if (!seed) return [];
  const mode = () => {
    const n = Number(seed.value);
    if (Number.isFinite(n) && n >= 0) previous.set(node, n);
    return n === -1 ? 'randomize' : n === -2 ? 'increment' : n === -3 ? 'decrement' : 'fixed';
  };
  const proxy = {
    name: 'ndui_seed_control', type: 'combo', node,
    options: {values: MODES},
    get value() { return mode(); },
    setValue(value) {
      if (!MODES.includes(value)) return;
      mode();
      if (value === 'fixed') {
        if (Number(seed.value) < 0) {
          const queued = node.lastSeed;
          seed.value = Number.isFinite(queued) && queued >= 0 ? queued : previous.get(node) ?? 0;
        }
      } else seed.value = SPECIAL[value];
      touch(node);
    },
  };
  return [{name: proxy.name, label: 'Seed mode', ptype: 'COMBO', widget: proxy,
    node, virtual: true, multiline: false, def: 'fixed', control: true, seed: false}];
}
