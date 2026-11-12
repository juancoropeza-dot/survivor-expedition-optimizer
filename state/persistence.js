const KEY = "expedition_v1";

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    owned: {},
    nodes: Array(10).fill(null).map(() => ({ tags: [] })),
    waves: [[], [], []],
    bench: null, // Null triggers a fresh bench generation in app.js
    activeWaveIdx: 0
  };
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {}
}