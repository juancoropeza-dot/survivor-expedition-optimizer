import * as persistence from "./state/persistence.js";
import { SURVIVORS } from "./data/survivors.js";
import { generateSuggestion } from "./algorithm/scheduler.js";
import { assignWave } from "./algorithm/assign.js";
import { applySquish } from "./algorithm/squish.js";
import { computeTime } from "./data/timings.js";
import * as scheduleUI from "./ui/schedule.js";
import * as configUI from "./ui/config.js";
import * as helpUI from "./ui/help.js";

export const state = {
  waves: [[], [], []], 
  bench: [],
  activeWaveIdx: 0,
  nodes: [], 
  owned: {}, 
  configTab: "nodes",
  showNodeTags: false,
  isDirty: false
};

export function init() {
  const saved = persistence.load();
  
  state.nodes = Array(10).fill(null).map((_, i) => saved.nodes[i] || { tags: [] });
  state.owned = saved.owned || {};
  
  if (saved.waves && saved.waves.length > 0 && saved.bench !== null) {
    state.waves = saved.waves;
    state.bench = saved.bench;
    state.activeWaveIdx = saved.activeWaveIdx || 0;
    state.isDirty = saved.isDirty || false;
  } else {
    state.waves = [[], [], []];
    state.bench = SURVIVORS.filter(s => state.owned[s.id]?.owned).map(s => s.id);
    state.activeWaveIdx = 0;
  }
  
  scheduleUI.render(state.showNodeTags);
}

function saveState() {
  persistence.save({
    nodes: state.nodes,
    owned: state.owned,
    waves: state.waves,
    bench: state.bench,
    activeWaveIdx: state.activeWaveIdx,
    isDirty: state.isDirty
  });
}

export function setNodeDisplay(showTags) {
  state.showNodeTags = showTags;
  
  const btnNum = document.getElementById("btn-node-num");
  const btnTag = document.getElementById("btn-node-tag");
  
  if (showTags) {
    btnTag.className = "px-2 py-1 rounded bg-blue-600 text-white transition";
    btnNum.className = "px-2 py-1 rounded text-slate-400 hover:text-white transition";
  } else {
    btnNum.className = "px-2 py-1 rounded bg-blue-600 text-white transition";
    btnTag.className = "px-2 py-1 rounded text-slate-400 hover:text-white transition";
  }
  
  scheduleUI.render(state.showNodeTags);
}

export function addWave() {
  if (state.waves.length >= 4) {
    showToast("Maximum 4 waves allowed.", true);
    return;
  }
  state.waves.push([]);
  state.activeWaveIdx = state.waves.length - 1;
  saveState();
  scheduleUI.render(state.showNodeTags);
}

export function tapBench(id) {
  const isSpongeWave = state.activeWaveIdx >= 2;
  const maxCap = isSpongeWave ? 8 : 4;
  const currentCount = state.waves[state.activeWaveIdx].length;

  if (currentCount >= maxCap) {
    const msg = isSpongeWave
      ? "Sponge wave is full! Max 8 (4 hosts + 4 squished)." 
      : `Wave ${state.activeWaveIdx + 1} is full! Max 4.`;
    showToast(msg, true);
    return;
  }

  state.bench = state.bench.filter(b => b !== id);
  state.waves[state.activeWaveIdx].push(id);
  saveState();
  scheduleUI.render(state.showNodeTags);
}

export function tapWave(id) {
  state.waves[state.activeWaveIdx] = state.waves[state.activeWaveIdx].filter(w => w !== id);
  state.bench.push(id);
  saveState();
  scheduleUI.render(state.showNodeTags);
}

export function switchWave(idx) {
  state.activeWaveIdx = idx;
  saveState();
  scheduleUI.render(state.showNodeTags);
}

export function autoFill() {
  const benchObjs = state.bench.map(id => {
    const base = SURVIVORS.find(s => s.id === id);
    const star = state.owned[id]?.star === "6star" ? "6star" : "base";
    return { ...base, star };
  });

  const waveObjs = state.waves.map(w => w.map(id => {
    const base = SURVIVORS.find(s => s.id === id);
    const star = state.owned[id]?.star === "6star" ? "6star" : "base";
    return { ...base, star };
  }));

  const result = generateSuggestion(benchObjs, waveObjs, state.nodes);
  
  state.waves = result.map(w => w.items.map(i => i.survivor.id));
  
  const placedIds = state.waves.flat();
  state.bench = SURVIVORS.filter(s => state.owned[s.id]?.owned && !placedIds.includes(s.id)).map(s => s.id);
  
  state.activeWaveIdx = 0;
  state.isDirty = false; 
  saveState();
  scheduleUI.render(state.showNodeTags);
}

export function clearAll() {
  state.waves = [[], [], []];
  state.bench = SURVIVORS.filter(s => state.owned[s.id]?.owned).map(s => s.id);
  state.activeWaveIdx = 0;
  state.isDirty = false;
  saveState();
  scheduleUI.render(state.showNodeTags);
}

export function openConfig() {
  document.getElementById("configModal").classList.remove("hidden");
  document.getElementById("configModal").classList.add("flex");
  configUI.render();
}

export function closeConfig() {
  document.getElementById("configModal").classList.add("hidden");
  document.getElementById("configModal").classList.remove("flex");
  scheduleUI.render(state.showNodeTags); 
}

export function setConfigTab(tab) {
  state.configTab = tab;
  configUI.render();
}

export function saveConfig(newNodes, newOwned) {
  state.nodes = newNodes;
  state.owned = newOwned;
  state.isDirty = true; 
  saveState();
  scheduleUI.render(state.showNodeTags);
}

export function openHelp(context = "schedule") {
  helpUI.render(context);
}

export function openConfigHelp() {
  helpUI.render(state.configTab);
}

export function closeHelp() {
  const modal = document.getElementById("helpModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

export function openImportNodes() {
  document.getElementById("importText").value = "";
  document.getElementById("importModal").classList.remove("hidden");
  document.getElementById("importModal").classList.add("flex");
}

export function closeImportNodes() {
  document.getElementById("importModal").classList.add("hidden");
  document.getElementById("importModal").classList.remove("flex");
}

export function submitImportedNodes() {
  const text = document.getElementById("importText").value.trim();
  try {
    const parsed = JSON.parse(text);
    
    let updatedNodes = null;
    let updatedWaves = null;
    let updatedBench = null;

    if (Array.isArray(parsed)) {
      updatedNodes = parsed; 
    } else if (typeof parsed === "object" && parsed !== null) {
      if (parsed.nodes) updatedNodes = parsed.nodes;
      if (parsed.waves) updatedWaves = parsed.waves;
      if (parsed.bench) updatedBench = parsed.bench;
    }

    if (!updatedNodes) throw new Error("No nodes found in JSON.");

    if (!state.nodes || state.nodes.length !== 10) {
      state.nodes = Array(10).fill(null).map(() => ({ tags: [] }));
    }
    
    for (let i = 0; i < 10; i++) {
       const n = updatedNodes[i];
       if (n) {
         state.nodes[i].tags = Array.isArray(n) ? n : (n.tags || []);
       } else {
         state.nodes[i].tags = [];
       }
    }

    if (updatedWaves && Array.isArray(updatedWaves)) {
       const newWaves = [];
       updatedWaves.forEach((w) => {
         if (w.items && Array.isArray(w.items)) {
           newWaves.push(w.items.map(it => {
             const name = it.name || it;
             const s = SURVIVORS.find(sv => sv.name.toLowerCase() === name.toLowerCase());
             return s ? s.id : null;
           }).filter(Boolean));
         }
       });
       state.waves = newWaves;
       if (state.waves.length === 0) state.waves = [[], [], []];
    }

    if (updatedBench && Array.isArray(updatedBench)) {
       state.bench = updatedBench;
    }

    state.activeWaveIdx = 0;
    state.isDirty = false;
    saveState();
    closeImportNodes();
    showToast("Imported successfully!");
    
    scheduleUI.render(state.showNodeTags);
    configUI.render(); 
    
  } catch (e) {
    showToast("Invalid JSON format.", true);
    console.error(e);
  }
}

export function exportNodes() {
  const jsonStr = JSON.stringify(state.nodes, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    showToast("Board exported to clipboard!");
  }).catch(() => {
    const textArea = document.createElement("textarea");
    textArea.value = jsonStr;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast("Board exported!");
  });
}

export function clearAllNodes() {
  state.nodes = Array(10).fill(null).map(() => ({ tags: [] }));
  state.isDirty = true;
  saveConfig(state.nodes, state.owned);
  showToast("All nodes cleared!");
  configUI.render(); 
}

export function copyDebugData() {
  const processWaveForDebug = (waveIds) => {
    if (waveIds.length === 0) return { items: [], maxDuration: 0 };

    const hosts = waveIds.slice(0, 4);
    const leftovers = waveIds.slice(4);

    const mapToObj = (id) => {
      const base = SURVIVORS.find(s => s.id === id);
      const star = state.owned[id]?.star === "6star" ? "6star" : "base";
      return { ...base, star };
    };

    const hostObjs = hosts.map(mapToObj);
    const res = assignWave(hostObjs, state.nodes);
    
    let hostWave = res ? { items: res.assignment, maxDuration: res.maxTime, hasSquished: false } : { items: [], maxDuration: 0 };

    if (leftovers.length > 0) {
      const leftoverObjs = leftovers.map(mapToObj);
      
      // THE FIX: Calculate real times for debug export
      const dummyLeftoverItems = leftoverObjs.map(s => {
        let bestTime = Infinity;
        state.nodes.forEach(node => {
          const t = computeTime(s, node);
          if (t < bestTime) bestTime = t;
        });
        return { survivor: s, node: null, time: bestTime };
      });

      const dummyWave = { items: dummyLeftoverItems, maxDuration: 0, hasSquished: false };
      
      const squishedResult = applySquish([hostWave, dummyWave], state.nodes);
      hostWave = squishedResult[0]; 
    }

    return {
      maxDuration: hostWave.maxDuration,
      items: hostWave.items.map(it => ({
        name: it.survivor.name,
        node: it.node ? it.node.tags[0] : "?",
        nodeIndex: it.nodeIndex,
        time: it.time,
        isSquished: it.isSquished || false,
        squishLabel: it.squishLabel || null
      }))
    };
  };

  const debugData = {
    nodes: state.nodes,
    waves: state.waves.map((w, i) => {
      const processed = processWaveForDebug(w);
      return {
        wave: i + 1,
        maxDuration: processed.maxDuration,
        items: processed.items
      };
    }),
    bench: state.bench
  };

  const jsonStr = JSON.stringify(debugData, null, 2);
  
  navigator.clipboard.writeText(jsonStr).then(() => {
    showToast("Data copied!");
  }).catch(() => {
    const textArea = document.createElement("textarea");
    textArea.value = jsonStr;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast("Data copied!");
  });
}

export function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  
  if (isError) {
    toast.classList.remove("bg-emerald-600", "border-emerald-700");
    toast.classList.add("bg-red-600", "border-red-700");
  } else {
    toast.classList.remove("bg-red-600", "border-red-700");
    toast.classList.add("bg-emerald-600", "border-emerald-700");
  }
  
  toast.classList.remove("opacity-0", "translate-y-2");
  toast.classList.add("opacity-100", "translate-y-0");
  
  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "translate-y-2");
  }, 2500);
}

window.app = { 
  tapBench, tapWave, switchWave, addWave, autoFill, clearAll, 
  openConfig, closeConfig, setConfigTab, saveConfig, copyDebugData,
  openHelp, closeHelp, openConfigHelp, openImportNodes, closeImportNodes, submitImportedNodes, exportNodes, clearAllNodes,
  setNodeDisplay
};
window.addEventListener("DOMContentLoaded", init);