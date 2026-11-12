import { state, tapBench, tapWave, switchWave, addWave } from "../app.js";
import { SURVIVORS } from "../data/survivors.js";
import { assignWave } from "../algorithm/assign.js";
import { applySquish } from "../algorithm/squish.js";
import { BASE_TIMES, TAG_BOOST, computeTime } from "../data/timings.js";

export function render(showTags = false) {
  renderAutoFillButton();
  renderTabs();
  renderActiveWave(showTags);
  renderBench();
}

function renderAutoFillButton() {
  const btnText = document.getElementById("autofill-text");
  if (!btnText) return;

  if (state.isDirty) {
    btnText.innerHTML = `Auto-Fill <span class="text-amber-300 ml-1" title="Settings changed. Re-run Auto-Fill to recalculate.">⚠️</span>`;
  } else {
    btnText.innerHTML = `Auto-Fill`;
  }
}

function renderTabs() {
  const container = document.getElementById("waveTabs");
  container.innerHTML = "";

  state.waves.forEach((wave, idx) => {
    let timeStr = "Empty";
    if (wave.length > 0) {
      const processed = processWaveLogic(wave);
      timeStr = formatTime(processed.maxDuration);
    }

    const isActive = state.activeWaveIdx === idx;
    const btn = document.createElement("button");
    btn.className = `px-4 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap border-t border-x ${
      isActive 
        ? "bg-slate-700 text-white border-slate-600 border-b-transparent z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]" 
        : "bg-slate-900 text-slate-500 border-slate-800 border-b-slate-700 hover:bg-slate-800"
    }`;
    btn.innerHTML = `Wave ${idx + 1} <span class="block text-xs ${isActive ? 'text-slate-300' : 'text-slate-600'}">${timeStr}</span>`;
    btn.onclick = () => switchWave(idx);
    container.appendChild(btn);
  });

  if (state.waves.length < 4) {
    const addBtn = document.createElement("button");
    addBtn.className = "px-4 py-2 text-sm font-bold text-slate-500 hover:text-white bg-slate-900 rounded-t-lg border-t border-x border-slate-800 border-b-slate-700";
    addBtn.innerHTML = "+";
    addBtn.onclick = addWave;
    container.appendChild(addBtn);
  }
}

function renderActiveWave(showTags) {
  const container = document.getElementById("activeWaveSlots");
  container.innerHTML = "";

  const waveIds = state.waves[state.activeWaveIdx];
  const waveData = processWaveLogic(waveIds);
  
  const totalTime = calculateTotalTime(); 
  const headerEl = document.getElementById("headerTotal");
  
  if (totalTime > 24.5) {
    headerEl.innerHTML = `<span class="text-red-500 flex items-center justify-end gap-1">${formatTime(totalTime)} 🚨</span>`;
  } else if (totalTime > 24.0) {
    headerEl.innerHTML = `<span class="text-yellow-400 flex items-center justify-end gap-1">${formatTime(totalTime)} ⚠️</span>`;
  } else {
    headerEl.innerHTML = `<span class="text-amber-400">${formatTime(totalTime)}</span>`;
  }

  const sortedItems = [];
  const processed = new Set();

  waveData.items.forEach(host => {
    if (processed.has(host)) return;
    if (host.squishLabel && !host.isSquished) {
      sortedItems.push(host);
      processed.add(host);
      
      waveData.items.forEach(squished => {
        if (squished.isSquished && squished.squishLabel === host.squishLabel && !processed.has(squished)) {
          sortedItems.push(squished);
          processed.add(squished);
        }
      });
    }
  });

  const remaining = waveData.items.filter(it => !processed.has(it));
  remaining.sort((a, b) => (a.nodeIndex || 0) - (b.nodeIndex || 0));
  remaining.forEach(it => sortedItems.push(it));

  sortedItems.forEach((it) => {
    const isSquished = it.isSquished;
    const squishBadge = it.squishLabel ? `<span class="text-[11px] text-indigo-400 font-bold ml-1">[${it.squishLabel}]</span>` : "";
    
    const wrapper = document.createElement("div");
    wrapper.className = isSquished ? "flex mt-1" : "mt-1";
    
    if (isSquished) {
      const treeLine = document.createElement("div");
      treeLine.className = "w-6 shrink-0 relative";
      treeLine.innerHTML = `
        <div class="absolute left-3 -top-2 bottom-1/2 w-0.5 bg-indigo-500/50"></div>
        <div class="absolute left-3 top-1/2 w-3 h-0.5 bg-indigo-500/50"></div>
      `;
      wrapper.appendChild(treeLine);
    }

    const card = document.createElement("div");
    card.className = `flex-1 flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:border-red-500/50 hover:bg-red-950/20 transition ${
      isSquished ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-900/80 border-slate-800/80"
    }`;
    card.onclick = () => tapWave(it.survivor.id);

    const baseTime = BASE_TIMES[it.survivor.rarity]?.[it.survivor.star === "6star" ? "sixstar" : "base"] || 10;
    const isDiscounted = it.time < baseTime;
    
    const badgeClass = isDiscounted 
      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
      : 'bg-slate-800 text-slate-300 border-slate-600';
      
    const timeColor = isDiscounted ? 'text-emerald-400' : 'text-slate-200';

    let nodeLabel = "?";
    if (showTags) {
      nodeLabel = it.node && it.node.tags.length > 0 ? formatTagName(it.node.tags[0]) : "None";
    } else {
      let nIdx = it.nodeIndex !== undefined ? it.nodeIndex : -1;
      nodeLabel = nIdx >= 0 ? (nIdx + 1).toString() : "?";
    }

    card.innerHTML = `
      <div class="flex items-center gap-3 w-5/12">
        <div class="w-10 h-10 rounded bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
           <img src="assets/survivors/${it.survivor.id}.webp" class="w-full h-full object-cover" onerror="this.style.display='none';">
        </div>
        <div class="min-w-0">
          <div class="text-sm font-bold truncate flex items-center">${it.survivor.name} ${squishBadge}</div>
          <div class="text-xs text-amber-400 font-bold truncate">${it.survivor.star === "6star" ? "6★" : "★"}</div>
        </div>
      </div>
      
      <div class="w-3/12 flex flex-col items-center justify-center">
        <span class="text-sm px-2 py-0.5 rounded border font-mono font-bold truncate max-w-full ${badgeClass}">
          ${nodeLabel}
        </span>
      </div>

      <div class="w-4/12 text-right pr-1">
        <div class="text-base font-mono font-black ${timeColor}">${formatTime(it.time)}</div>
      </div>
    `;
    
    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });

  const hostCount = waveData.items.filter(i => !i.isSquished).length;
  const emptySlots = Math.max(0, 4 - hostCount);
  
  for (let i = 0; i < emptySlots; i++) {
    const empty = document.createElement("div");
    empty.className = "mt-1 p-4 rounded-lg border border-dashed border-slate-800 bg-slate-900/30 text-center text-xs text-slate-600";
    empty.textContent = "Empty Slot";
    container.appendChild(empty);
  }

  const footer = document.createElement("div");
  footer.className = "mt-4 text-center text-base font-black text-amber-400";
  footer.textContent = `Wave Duration: ${formatTime(waveData.maxDuration)}`;
  container.appendChild(footer);
}

function processWaveLogic(waveIds) {
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
    
    // THE FIX: Calculate real times instead of passing 0
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

  return hostWave;
}

function renderBench() {
  const list = document.getElementById("benchList");
  const count = document.getElementById("benchCount");
  list.innerHTML = "";
  count.textContent = state.bench.length;

  const activeWaveIds = state.waves[state.activeWaveIdx];
  const activeHosts = activeWaveIds.slice(0, 4).map(hid => {
    const hb = SURVIVORS.find(x => x.id === hid);
    const hs = state.owned[hid]?.star === "6star" ? "6star" : "base";
    return { ...hb, star: hs };
  });

  const usedNodeIndices = new Set();
  if (activeHosts.length > 0) {
    const res = assignWave(activeHosts, state.nodes);
    if (res) res.assignment.forEach(a => usedNodeIndices.add(a.nodeIndex));
  }

  const benchObjs = state.bench.map(id => {
    const base = SURVIVORS.find(x => x.id === id);
    const star = state.owned[id]?.star === "6star" ? "6star" : "base";
    const s = { ...base, star };

    const baseTime = BASE_TIMES[s.rarity]?.[s.star === "6star" ? "sixstar" : "base"] || 10;
    
    const canMatchAvailable = state.nodes.some((node, i) => 
      !usedNodeIndices.has(i) && node.tags.some(t => s.tags.includes(t))
    );
    
    s.bestTime = canMatchAvailable ? (TAG_BOOST[baseTime] || baseTime) : baseTime;
    s.isDiscounted = canMatchAvailable;
    return s;
  });

  benchObjs.sort((a, b) => a.bestTime - b.bestTime);

  benchObjs.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "flex flex-col items-center w-[65px] gap-1 group";
    btn.onclick = () => tapBench(s.id);

    const timeColor = s.isDiscounted ? 'text-emerald-400' : 'text-slate-200';

    btn.innerHTML = `
      <div class="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden border border-slate-700 group-hover:border-purple-500 transition shadow-md relative">
        <img src="assets/survivors/${s.id}.webp" class="w-full h-full object-cover" onerror="this.style.display='none';">
        <div class="absolute bottom-0 right-0 bg-black/80 text-[10px] text-amber-400 px-1 rounded-tl">${s.star === "6star" ? "6★" : "★"}</div>
      </div>
      <span class="text-[11px] text-slate-300 font-bold truncate w-full text-center group-hover:text-white">${s.name}</span>
      <span class="text-xs font-mono font-black ${timeColor}">${formatTime(s.bestTime)}</span>
    `;
    list.appendChild(btn);
  });
}

function calculateTotalTime() {
  let total = 0;
  state.waves.forEach(waveIds => {
    if (waveIds.length === 0) return;
    const processed = processWaveLogic(waveIds);
    total += processed.maxDuration;
  });
  return total; 
}

function formatTagName(tag) {
  return tag.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatTime(hours) {
  if (hours === 0) return "0h";
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}