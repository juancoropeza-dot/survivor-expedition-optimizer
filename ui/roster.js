import { SURVIVORS } from "../data/survivors.js";
import * as roster from "../state/roster.js";

const CATEGORIES = [
  { id: "normal", label: "Normal" },
  { id: "sp", label: "S tier" },
  { id: "event_sp", label: "Event SP" },
  { id: "tmnt", label: "TMNT (Limited)" },
  { id: "squarepants", label: "Square Pants (Limited)" }
];

export function render() {
  const container = document.getElementById("rosterList");
  const ownedStates = roster.getOwnedStates();
  container.innerHTML = "";

  let globalActiveCount = 0;
  const globalTotalCount = SURVIVORS.length;

  CATEGORIES.forEach(cat => {
    const survivorsInCat = SURVIVORS
      .filter(s => s.category === cat.id)
      .sort((a, b) => a.name.localeCompare(b.name));
      
    if (survivorsInCat.length === 0) return;

    let activeInCat = 0;
    survivorsInCat.forEach(s => {
      if (roster.getActiveIds().includes(s.id)) activeInCat++;
    });
    globalActiveCount += activeInCat;

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
        <button onclick="event.preventDefault(); event.stopPropagation(); window.roster.setFolderPreset('${cat.id}', 'all'); window.rosterUI.render();" class="px-2 py-0.5 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700">All</button>
        <button onclick="event.preventDefault(); event.stopPropagation(); window.roster.setFolderPreset('${cat.id}', 'none'); window.rosterUI.render();" class="px-2 py-0.5 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700">Clear</button>
      </div>
    `;
    details.appendChild(summary);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-3 gap-2 p-2";

    survivorsInCat.forEach(s => {
      const st = ownedStates[s.id] || { owned: false, star: "base" };
      const isActive = roster.getActiveIds().includes(s.id);

      const card = document.createElement("button");
      card.type = "button";
      card.onclick = () => { roster.cycleOwnership(s.id); render(); };
      card.className = `flex flex-col items-center p-1.5 rounded-xl border transition ${
        isActive ? "bg-purple-950/30 border-purple-500/50" : "bg-slate-900/40 border-slate-800/80 opacity-60"
      }`;

      const initial = s.name[0].toUpperCase();
      const starBadge = st.owned ? (st.star === "6star" ? "6★" : "★") : "—";

      card.innerHTML = `
        <div class="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center border border-slate-700 mb-1.5">
          <span class="absolute text-xs font-black text-slate-400">${initial}</span>
          <img src="assets/survivors/${s.id}.webp" alt="${s.name}" class="relative z-10 w-full h-full object-cover" onerror="this.style.display='none';">
        </div>
        <div class="text-[10px] font-bold text-center leading-tight truncate w-full px-0.5">${s.name}</div>
        <div class="text-[11px] font-black mt-0.5 text-amber-400">${starBadge}</div>
      `;
      grid.appendChild(card);
    });

    details.appendChild(grid);
    container.appendChild(details);
  });

  document.getElementById("rosterCount").textContent = globalActiveCount;
  document.getElementById("rosterTotal").textContent = globalTotalCount;
}

window.roster = roster;
window.rosterUI = { render };