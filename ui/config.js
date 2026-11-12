import { state, saveConfig } from "../app.js";
import { SURVIVORS } from "../data/survivors.js";

const TAG_ROWS = [
  ["female", "male", "no_human"],
  ["short_hair", "long_hair", "bald", "no_hair"]
];
let selectedTag = "female";

const CATEGORIES = [
  { id: "normal", label: "Normal" },
  { id: "sp", label: "S tier" },
  { id: "event_sp", label: "Event SP" },
  { id: "tmnt", label: "TMNT (Limited)" },
  { id: "squarepants", label: "Square Pants (Limited)" }
];

export function render() {
  const container = document.getElementById("configContent");
  
  // Cyan MDL-style Tab updates
  document.getElementById("btn-cfg-nodes").className = state.configTab === "nodes" 
    ? "px-4 py-3 text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 transition" 
    : "px-4 py-3 text-sm font-bold text-slate-400 hover:text-slate-300 border-b-2 border-transparent transition";
  document.getElementById("btn-cfg-roster").className = state.configTab === "roster" 
    ? "px-4 py-3 text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 transition" 
    : "px-4 py-3 text-sm font-bold text-slate-400 hover:text-slate-300 border-b-2 border-transparent transition";

  if (state.configTab === "nodes") {
    renderNodes(container);
  } else {
    renderRoster(container);
  }
}

function renderNodes(container) {
  container.innerHTML = `
    <div class="flex flex-col gap-3 pb-4">
    
      <!-- 1. Select Tag Container -->
      <div class="bg-cardbg border border-slate-800 rounded-xl p-3 shadow-sm">
        <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">1. Select a Tag</h3>
        <div class="flex flex-col gap-1.5">
          ${TAG_ROWS.map(row => `
            <div class="flex justify-between gap-1">
              ${row.map(t => `
                <button onclick="window.setTag('${t}')" class="flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition ${
                  selectedTag === t ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }">
                  ${formatTag(t)}
                </button>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2. Assign Nodes Container -->
      <div class="bg-cardbg border border-slate-800 rounded-xl p-3 shadow-sm">
        <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">2. Assign Nodes</h3>
        
        <!-- Instruction Text -->
        <div class="text-center bg-blue-950/40 border border-blue-800/60 rounded-lg p-2.5 mb-3 shadow-inner">
          <p class="text-xs font-bold text-blue-300">👆 Select a tag above, then tap a node below to assign it.</p>
        </div>

        <!-- Action Buttons (Moved Below Text) -->
        <div class="flex gap-2 mb-3">
          <button onclick="window.app.clearAllNodes()" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition">Clear All</button>
          <button onclick="window.app.exportNodes()" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition">Export</button>
          <button onclick="window.app.openImportNodes()" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition">Import</button>
        </div>

        <div class="bg-gradient-to-b from-emerald-900/80 to-green-950 rounded-xl border border-emerald-800/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] p-3 flex flex-col justify-center gap-2 relative overflow-hidden">
          <svg class="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 10 90 Q 50 70 90 80 T 180 40" fill="none" stroke="white" stroke-width="2" />
            <path d="M 50 100 Q 80 50 120 60 T 150 10" fill="none" stroke="white" stroke-width="2" />
          </svg>
          <div class="flex gap-2 relative z-10">${renderNodeBtn(8)}${renderNodeBtn(9)}</div>
          <div class="flex gap-2 relative z-10">${renderNodeBtn(6)}${renderNodeBtn(7)}</div>
          <div class="flex gap-2 relative z-10">${renderNodeBtn(4)}${renderNodeBtn(5)}</div>
          <div class="flex gap-2 relative z-10">${renderNodeBtn(2)}${renderNodeBtn(3)}</div>
          <div class="flex gap-2 relative z-10">${renderNodeBtn(0)}${renderNodeBtn(1)}</div>
        </div>
      </div>
    </div>
  `;
}

function renderNodeBtn(idx) {
  const node = state.nodes[idx];
  const tag = node && node.tags.length > 0 ? node.tags[0] : null;
  
  return `
    <button onclick="window.setNode(${idx})" class="flex-1 h-10 flex items-center justify-between p-1.5 bg-black/40 hover:bg-black/60 border border-emerald-700/40 rounded-xl transition group backdrop-blur-sm">
      <div class="w-6 h-6 rounded-full bg-slate-900 border-2 ${tag ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-500'} flex items-center justify-center font-bold text-[10px] font-mono transition group-hover:scale-110 shadow-lg shrink-0">
        ${idx + 1}
      </div>
      <div class="flex-1 text-right pr-0.5 min-w-0">
        ${tag 
          ? `<span class="text-[9px] font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50 truncate inline-block max-w-full">${formatTag(tag)}</span>` 
          : `<span class="text-[9px] italic text-slate-600">Empty</span>`
        }
      </div>
    </button>
  `;
}

function renderRoster(container) {
  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "flex flex-col gap-3 pb-8";

  CATEGORIES.forEach(cat => {
    const survivorsInCat = SURVIVORS.filter(s => s.category === cat.id).sort((a, b) => a.name.localeCompare(b.name));
    if (survivorsInCat.length === 0) return;

    let activeInCat = 0;
    survivorsInCat.forEach(s => { if (state.owned[s.id]?.owned) activeInCat++; });

    const details = document.createElement("details");
    details.className = "bg-cardbg border border-slate-800 rounded-xl overflow-hidden";
    if (activeInCat > 0) details.open = true;

    const summary = document.createElement("summary");
    summary.className = "px-3 py-2.5 bg-slate-900/50 cursor-pointer flex items-center justify-between text-xs font-bold text-slate-300 select-none";
    summary.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-slate-500 transition-transform">▼</span>
        <span>${cat.label} <span class="text-slate-500 font-normal">(${activeInCat} of ${survivorsInCat.length})</span></span>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="event.preventDefault(); event.stopPropagation(); window.setCatAll('${cat.id}', true);" class="px-2 py-0.5 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700">All</button>
        <button onclick="event.preventDefault(); event.stopPropagation(); window.setCatAll('${cat.id}', false);" class="px-2 py-0.5 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700">Clear</button>
      </div>
    `;
    details.appendChild(summary);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-4 gap-1.5 p-2";

    survivorsInCat.forEach(s => {
      const st = state.owned[s.id] || { owned: false, star: "base" };
      const isActive = st.owned;

      const card = document.createElement("button");
      card.type = "button";
      card.onclick = () => { window.toggleOwned(s.id); };
      card.className = `flex flex-col items-center p-1 rounded-lg border transition ${isActive ? "bg-purple-950/30 border-purple-500/50" : "bg-slate-900/40 border-slate-800/80 opacity-60"}`;

      const initial = s.name[0].toUpperCase();
      const starBadge = st.owned ? (st.star === "6star" ? "6★" : "★") : "—";

      card.innerHTML = `
        <div class="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center border border-slate-700 mb-1">
          <span class="absolute text-[10px] font-black text-slate-400">${initial}</span>
          <img src="assets/survivors/${s.id}.webp" alt="${s.name}" class="relative z-10 w-full h-full object-cover" onerror="this.style.display='none';">
        </div>
        <div class="text-[9px] font-bold text-center leading-tight truncate w-full px-0.5">${s.name}</div>
        <div class="text-[10px] font-black mt-0.5 text-amber-400">${starBadge}</div>
      `;
      grid.appendChild(card);
    });

    details.appendChild(grid);
    wrapper.appendChild(details);
  });

  container.appendChild(wrapper);
}

function formatTag(tag) {
  return tag.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

window.setTag = (tag) => { selectedTag = tag; render(); };

window.setNode = (idx) => {
  if (!state.nodes[idx]) state.nodes[idx] = { tags: [] };
  const current = state.nodes[idx].tags[0];
  if (current === selectedTag) {
    state.nodes[idx].tags = [];
  } else {
    state.nodes[idx].tags = [selectedTag];
  }
  saveConfig(state.nodes, state.owned);
  render();
};

window.toggleOwned = (id) => {
  const st = state.owned[id] || { owned: false, star: "base" };
  if (!st.owned) { st.owned = true; st.star = "base"; }
  else if (st.star === "base") { st.star = "6star"; }
  else { st.owned = false; st.star = "base"; }
  state.owned[id] = st;
  
  if (st.owned && !state.bench.includes(id) && !state.waves.flat().includes(id)) state.bench.push(id);
  else if (!st.owned) {
    state.bench = state.bench.filter(b => b !== id);
    state.waves = state.waves.map(w => w.filter(b => b !== id));
  }
  saveConfig(state.nodes, state.owned);
  render(); 
};

window.setCatAll = (catId, stateBool) => {
  const catSurvivors = SURVIVORS.filter(s => s.category === catId);
  catSurvivors.forEach(s => {
    if (stateBool) {
      state.owned[s.id] = { owned: true, star: state.owned[s.id]?.star || "base" };
      if (!state.bench.includes(s.id) && !state.waves.flat().includes(s.id)) state.bench.push(s.id);
    } else {
      state.owned[s.id] = { owned: false, star: "base" };
      state.bench = state.bench.filter(b => b !== s.id);
      state.waves = state.waves.map(w => w.filter(b => b !== s.id));
    }
  });
  saveConfig(state.nodes, state.owned);
  render();
};