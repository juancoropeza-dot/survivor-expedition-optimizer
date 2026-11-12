import { SURVIVORS } from "../data/survivors.js";
import * as persistence from "./persistence.js";

export const state = {
  data: null,
  onChange: null,
};

export function init() {
  state.data = persistence.load();
  mergeWithCatalog();
}

export function mergeWithCatalog() {
  const profile = state.data.profiles[state.data.activeProfileId];
  
  for (const s of SURVIVORS) {
    if (!profile.survivorStates[s.id]) {
      const isLimited = ["tmnt", "squarepants", "event_sp"].includes(s.category);
      profile.survivorStates[s.id] = { owned: !isLimited, star: "base" };
    }
  }

  if (state.data.plan.activeIds.length === 0) {
    state.data.plan.activeIds = SURVIVORS
      .filter(s => profile.survivorStates[s.id]?.owned)
      .map(s => s.id);
  }
}

export function getOwnedStates() {
  return state.data.profiles[state.data.activeProfileId].survivorStates;
}

export function getActiveIds() {
  return state.data.plan.activeIds;
}

export function getCeiling() {
  return state.data.plan.ceilingHours;
}

export function cycleOwnership(id) {
  const st = getOwnedStates()[id] || { owned: false, star: "base" };
  if (!st.owned) { st.owned = true; st.star = "base"; }
  else if (st.star === "base") { st.star = "6star"; }
  else { st.owned = false; st.star = "base"; }
  getOwnedStates()[id] = st;

  const active = new Set(state.data.plan.activeIds);
  if (st.owned) active.add(id); else active.delete(id);
  state.data.plan.activeIds = [...active];

  persist();
}

// Handles the folder-specific All/Clear buttons
export function setFolderPreset(categoryId, mode) {
  const states = getOwnedStates();
  const active = new Set(state.data.plan.activeIds);
  
  SURVIVORS.filter(s => s.category === categoryId).forEach(s => {
    if (mode === "all") {
      states[s.id] = { owned: true, star: states[s.id]?.star || "base" };
      active.add(s.id);
    } else {
      states[s.id] = { owned: false, star: "base" };
      active.delete(s.id);
    }
  });
  
  state.data.plan.activeIds = [...active];
  persist();
}

function persist() {
  persistence.save(state.data);
  if (state.onChange) state.onChange();
}