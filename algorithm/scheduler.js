import { computeTime } from "../data/timings.js";
import { assignWave } from "./assign.js";
import { applySquish } from "./squish.js";

export function generateSuggestion(benchSurvivors, existingWaves, nodes) {
  // 1. Gather all survivors
  let allSurvivors = [];
  existingWaves.forEach(w => w.forEach(s => allSurvivors.push(s)));
  benchSurvivors.forEach(s => allSurvivors.push(s));
  
  const map = new Map();
  allSurvivors.forEach(s => map.set(s.id, s));
  allSurvivors = Array.from(map.values());

  // 2. Calculate exact Best Time
  allSurvivors.forEach(s => {
    let bestTime = Infinity;
    nodes.forEach(node => {
      const t = computeTime(s, node);
      if (t < bestTime) bestTime = t;
    });
    s.bestTime = bestTime;
  });

  // 3. Sort Descending (Heaviest First)
  let sortedDesc = [...allSurvivors].sort((a, b) => {
    if (Math.abs(a.bestTime - b.bestTime) > 0.01) return b.bestTime - a.bestTime;
    return a.name.localeCompare(b.name);
  });

  // 4. PRE-ANALYSIS (Drop the heaviest individuals one by one)
  let validSurvivors = [...sortedDesc];
  if (validSurvivors.length > 16) {
    let changed = true;
    while (changed && validSurvivors.length > 0) {
      changed = false;
      
      let chunks = [];
      for (let i = 0; i < validSurvivors.length; i += 4) {
        chunks.push(validSurvivors.slice(i, i + 4));
      }
      
      let total = chunks.reduce((sum, c) => sum + (c.length > 0 ? c[0].bestTime : 0), 0);
      
      if (total > 24.5) {
        validSurvivors.shift(); 
        changed = true;
      }
    }
  }

  // 5. Build Host Waves (Waves 1, 2, 3)
  let numWaves = Math.min(4, Math.max(3, existingWaves.length));
  let hostWavesNeeded = numWaves - 1;
  
  let hostWaves = [];
  let usedIds = new Set();

  let grouped = {};
  validSurvivors.forEach(s => {
    let key = s.bestTime.toFixed(3);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  let perfectGroups = [];
  let keys = Object.keys(grouped).sort((a, b) => parseFloat(b) - parseFloat(a)); // Heaviest first

  for (let key of keys) {
    let group = grouped[key];
    while (group.length >= 4) {
      perfectGroups.push(group.splice(0, 4));
    }
  }

  // Fill Host Waves
  for (let i = 0; i < hostWavesNeeded; i++) {
    if (perfectGroups.length > 0) {
      let group = perfectGroups.shift();
      group.forEach(s => usedIds.add(s.id));
      hostWaves.push(group);
    } else {
      // Fallback to heaviest remaining
      let chunk = [];
      for (let s of validSurvivors) {
        if (!usedIds.has(s.id)) {
          chunk.push(s);
          usedIds.add(s.id);
          if (chunk.length === 4) break;
        }
      }
      if (chunk.length > 0) hostWaves.push(chunk);
    }
  }

  // 6. Calculate Base Total (Host Waves)
  let baseTotal = 0;
  for (let group of hostWaves) {
    if (group.length === 0) continue;
    const res = assignWave(group, nodes);
    if (res) {
      let processed = applySquish([{ items: res.assignment, maxDuration: res.maxTime, hasSquished: false }], nodes);
      baseTotal += (processed[0]?.maxDuration || 0);
    }
  }

  // 7. Build Sponge Wave (Wave 4)
  let remaining = validSurvivors.filter(s => !usedIds.has(s.id));
  
  // DUAL-MODE SORTING
  if (validSurvivors.length <= 16) {
    // Small Roster: Slowest First
    remaining.sort((a, b) => {
      if (Math.abs(a.bestTime - b.bestTime) > 0.01) return b.bestTime - a.bestTime;
      return a.name.localeCompare(b.name);
    });
  } else {
    // Large Roster: Fastest First
    remaining.sort((a, b) => {
      if (Math.abs(a.bestTime - b.bestTime) > 0.01) return a.bestTime - b.bestTime;
      return a.name.localeCompare(b.name);
    });
  }

  let spongeHosts = remaining.slice(0, 4);
  let squishCandidates = remaining.slice(4, 8);
  squishCandidates.reverse(); // Try largest of the fast group first

  let spongeWave = [...spongeHosts];

  // Calculate initial Sponge Time
  let currentSpongeTime = 0;
  if (spongeWave.length > 0) {
      const res = assignWave(spongeWave, nodes);
      if (res) currentSpongeTime = res.maxTime;
  }

  for (let s of squishCandidates) {
    let testWave = [...spongeWave, s];
    
    // Calculate test wave time
    const res = assignWave(testWave.slice(0, 4), nodes);
    let testWaveTime = 0;
    if (res) {
      let hostWave = { items: res.assignment, maxDuration: res.maxTime, hasSquished: false };
      let dummySquished = testWave.slice(4).map(sv => ({ survivor: sv, node: null, time: sv.bestTime }));
      let leftoverWave = { items: dummySquished, maxDuration: 0, hasSquished: false };
      
      let processed = applySquish([hostWave, leftoverWave], nodes);
      testWaveTime = processed[0]?.maxDuration || 0;
    }
    
    let currentTotal = baseTotal + currentSpongeTime;
    let testTotal = baseTotal + testWaveTime;

    // If adding this survivor makes the time WORSE and pushes us over the limit, skip
    if (testTotal > 24.5 && testTotal > currentTotal) {
      // Skip candidate if it causes a *new* overflow
    } else {
      spongeWave.push(s);
      currentSpongeTime = testWaveTime;
    }
  }

  // 8. Combine everything
  let finalWaves = [...hostWaves];
  if (spongeWave.length > 0) {
    finalWaves.push(spongeWave);
  }

  return finalWaves.map(group => ({
    items: group.map(s => ({ survivor: s }))
  }));
}