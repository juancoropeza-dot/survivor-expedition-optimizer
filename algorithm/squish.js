import { computeTime } from "../data/timings.js";

export function applySquish(waves, nodes) {
  if (waves.length < 2) return waves;

  let newWaves = JSON.parse(JSON.stringify(waves));
  let lastWave = newWaves[newWaves.length - 1];
  
  if (lastWave.items.length === 0) return newWaves;

  let hostWave = newWaves[0];
  let leftovers = [...lastWave.items].sort((a, b) => b.time - a.time);
  let pairCounter = 0;

  // 1. Setup the 4 strict timeline slots
  let slots = hostWave.items.map(it => ({
    endTime: it.time,
    host: it
  }));

  // Track when each node is free
  let nodeEndTimes = {};
  hostWave.items.forEach(it => {
    nodeEndTimes[it.nodeIndex] = it.time;
  });

  for (const leftover of leftovers) {
    // 2. Find the slot that frees up earliest
    let minSlot = slots[0];
    for (let i = 1; i < slots.length; i++) {
        if (slots[i].endTime < minSlot.endTime) {
            minSlot = slots[i];
        }
    }

    let startTime = minSlot.endTime;
    let slotHost = minSlot.host;

    // 3. Find the best available node at startTime
    let bestNodeIndex = -1;
    let bestTime = Infinity;

    for (let i = 0; i < nodes.length; i++) {
      let busyUntil = nodeEndTimes[i] || 0;
      
      if (busyUntil <= startTime) {
        let t = computeTime(leftover.survivor, nodes[i]);
        
        // TIER 1: Faster time (Tag match)
        if (t < bestTime) {
          bestTime = t;
          bestNodeIndex = i;
        } 
        // TIER 2: Tie-Breaker. If times are equal, prefer the node the host just freed.
        else if (t === bestTime) {
           let isSlotHostNode = (i === slotHost.nodeIndex);
           let currentIsSlotHost = (bestNodeIndex === slotHost.nodeIndex);
           
           if (isSlotHostNode && !currentIsSlotHost) {
               bestNodeIndex = i;
           }
        }
      }
    }

    if (bestNodeIndex !== -1) {
       // Assign a label if the slotHost doesn't have one yet
       if (!slotHost.squishLabel) {
         slotHost.squishLabel = String.fromCharCode(65 + (pairCounter % 26));
         pairCounter++;
       }

       let newItem = {
         survivor: leftover.survivor,
         node: nodes[bestNodeIndex],
         nodeIndex: bestNodeIndex,
         time: bestTime,
         isSquished: true,
         squishLabel: slotHost.squishLabel
       };

       hostWave.items.push(newItem);
       
       // Update the timeline and node tracker
       minSlot.endTime = startTime + bestTime;
       minSlot.host = newItem;
       nodeEndTimes[bestNodeIndex] = startTime + bestTime;

       hostWave.maxDuration = Math.max(hostWave.maxDuration, startTime + bestTime);
    }
  }

  hostWave.hasSquished = hostWave.items.some(it => it.isSquished);
  
  return [hostWave];
}