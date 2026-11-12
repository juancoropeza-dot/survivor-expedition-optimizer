export const BASE_TIMES = {
  normal: { base: 10.000, sixstar: 7.500 },
  sp:     { base: 5.000,  sixstar: 3.750 },
};

export const TAG_BOOST = {
  10.000: 8.500, // FIXED: 8h 30m
  7.500:  6.367, // 6h 22m
  5.000:  4.250, // 4h 15m
  3.750:  3.183, // 3h 11m
};

export function tierOf(star) {
  return star === "6star" ? "sixstar" : "base";
}

export function computeTime(survivor, node) {
  const raw = BASE_TIMES[survivor.rarity]?.[tierOf(survivor.star)] || 10.000;
  const matches = node.tags.some(t => survivor.tags.includes(t));
  return matches ? TAG_BOOST[raw] : raw;
}