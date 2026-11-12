import { computeTime } from "../data/timings.js";

export function assignWave(survivors, nodes) {
  if (survivors.length === 0) return { assignment: [], maxTime: 0 };
  if (survivors.length > nodes.length) return null;

  let best = null;
  let bestMax = Infinity;
  let bestDiscounts = -1;
  const used = new Array(nodes.length).fill(false);
  const current = [];

  function recurse(i, currentMax, discountCount) {
    if (currentMax > bestMax) return; 
    
    const remaining = survivors.length - i;
    if (currentMax === bestMax && (discountCount + remaining) <= bestDiscounts) return; 

    if (i === survivors.length) {
      bestMax = currentMax;
      bestDiscounts = discountCount;
      best = current.map(a => ({ ...a }));
      return;
    }

    const s = survivors[i];
    for (let j = 0; j < nodes.length; j++) {
      if (used[j]) continue;
      const node = nodes[j];
      const time = computeTime(s, node);
      
      const sTags = s.tags || [];
      const nTags = node.tags || [];
      const matched = nTags.some(t => sTags.includes(t));

      used[j] = true;
      // SAVE THE NODE INDEX HERE
      current.push({ survivor: s, node, nodeIndex: j, time });
      
      recurse(i + 1, Math.max(currentMax, time), discountCount + (matched ? 1 : 0));
      
      current.pop();
      used[j] = false;
    }
  }

  recurse(0, 0, 0);
  return best ? { assignment: best, maxTime: bestMax } : null;
}