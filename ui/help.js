export function render(context = "schedule") {
  let modal = document.getElementById("helpModal");
  
  let contentHTML = "";
  let title = "Help & Guide";

  if (context === "schedule") {
    title = "Schedule Guide";
    contentHTML = `
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-black text-amber-400 mb-2">The 24h Rule</h3>
          <ul class="text-xs text-slate-300 space-y-1 ml-4 list-disc marker:text-slate-500 mb-3">
            <li><strong class="text-amber-400">Under 24h:</strong> Safe.</li>
            <li><strong class="text-yellow-400">24h to 24h 30m:</strong> ⚠️ Soft Overflow. Auto-Fill aims to stop here so clan speed-ups can cover the rest.</li>
            <li><strong class="text-red-500">Over 24h 30m:</strong> 🚨 Hard Overflow. This only happens if you manually add too many survivors.</li>
          </ul>
        </div>

        <hr class="border-slate-800">

        <div>
          <h3 class="text-sm font-black text-amber-400 mb-2">Waves & Dispatch</h3>
          <ul class="text-xs text-slate-300 space-y-1 ml-4 list-disc marker:text-slate-500 mb-3">
            <li>You start with 3 waves. If you have enough fast, leveled-up survivors to finish under 24h, click the <strong>+</strong> button to add a 4th. <em class="text-amber-300">(Highly recommend using Auto-Fill after adding).</em> Click <strong>Clear</strong> to reset back to 3 waves.</li>
            <li>You can dispatch waves in any order in the game (e.g., send the longest one before going to sleep).</li>
            <li><strong>The Squish Wave:</strong> The last wave (Wave 3 or 4) can hold up to <strong>8 survivors</strong> (4 Hosts + 4 Squished).</li>
          </ul>
        </div>

        <hr class="border-slate-800">

        <div>
          <h3 class="text-sm font-black text-amber-400 mb-2">Manual Tuning</h3>
          <p class="text-xs text-slate-300 leading-relaxed mb-2">
            The algorithm gives you a strong start, but you can fine-tune it to your needs:
          </p>
          <ul class="text-xs text-slate-300 space-y-2 ml-4 list-disc marker:text-slate-500">
            <li><strong>Moving Survivors:</strong> Tap a character in a wave to send them to the Bench, then tap them on the Bench to add them to the current wave.</li>
            <li><strong>Squish Tips:</strong> 
              <br>• <em>Large Roster (16+):</em> Add the <strong>fastest</strong> survivors first as hosts to prevent overflow.
              <br>• <em>Small Roster (<16):</em> Add the <strong>slower</strong> survivors first to create large gaps for the quicker ones to fill.
            </li>
            <li><strong>Badge Colors:</strong> 
              <br>• <strong class="text-emerald-400">Green:</strong> Match (gets speed bonus).
              <br>• <strong class="text-white">White:</strong> No match (raw time).
            </li>
          </ul>
        </div>

        <hr class="border-slate-800">

        <div>
          <h3 class="text-sm font-black text-amber-400 mb-2">Display & Warnings</h3>
          <ul class="text-xs text-slate-300 space-y-1 ml-4 list-disc marker:text-slate-500">
            <li><strong>Num / Tag Toggle:</strong> Use the <strong>Num</strong> / <strong>Tag</strong> switch at the top to change how nodes are displayed (Node Number vs Node Tag).</li>
            <li><strong>Settings Warning (⚠️):</strong> If you change a Node Tag, Star Level, or add a new wave, the Auto-Fill button will show a ⚠️. Auto-Fill can generate a fresh plan, or you can keep your manual edits.</li>
          </ul>
        </div>
      </div>
    `;
  } 
  else if (context === "nodes") {
    title = "Node Board Settings";
    contentHTML = `
      <div class="space-y-4">
        <div>
          <p class="text-xs text-slate-300 leading-relaxed mb-2">
            Tell the app what tags are currently active on your 1–10 nodes. <strong>Node tags change often</strong> with game events, and every player may have a slightly different layout. You must update this screen whenever the game rotates your board.
          </p>
          <p class="text-xs text-slate-300 leading-relaxed mb-3">
            <strong>How to use it:</strong><br>
            1. Tap a tag in the "Select a Tag" list.<br>
            2. Tap a node in the green grid to assign it.<br>
            3. <strong>To remove a tag, tap the same node again.</strong>
          </p>
          
          <h4 class="text-xs font-bold text-white mb-1 mt-4">Board Tools</h4>
          <ul class="text-xs text-slate-300 space-y-1 ml-4 list-disc marker:text-slate-500 mb-4">
            <li><strong>Clear All:</strong> Wipes every tag from the board so you can start fresh.</li>
            <li><strong>Export:</strong> Copies your current 10-node layout to your clipboard as text. Save this text somewhere safe.</li>
            <li><strong>Import:</strong> Paste a saved text layout to instantly load a previous board configuration.</li>
          </ul>

          <div class="bg-slate-900 rounded-lg p-3 border border-slate-800">
            <h4 class="text-xs font-bold text-white mb-2">How Time is Calculated</h4>
            <table class="w-full text-left text-[11px] text-slate-300">
              <thead class="text-slate-500 border-b border-slate-700">
                <tr>
                  <th class="pb-1">Rarity</th>
                  <th class="pb-1">Star</th>
                  <th class="pb-1">Base</th>
                  <th class="pb-1 text-emerald-400">Tag Bonus</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50">
                <tr>
                  <td class="py-1">Normal</td>
                  <td>Base</td>
                  <td>10h 00m</td>
                  <td class="text-emerald-400 font-bold">8h 30m</td>
                </tr>
                <tr>
                  <td class="py-1">Normal</td>
                  <td>6★</td>
                  <td>7h 30m</td>
                  <td class="text-emerald-400 font-bold">6h 22m</td>
                </tr>
                <tr>
                  <td class="py-1">SP / SPP</td>
                  <td>Base</td>
                  <td>5h 00m</td>
                  <td class="text-emerald-400 font-bold">4h 15m</td>
                </tr>
                <tr>
                  <td class="py-1">SP / SPP</td>
                  <td>6★</td>
                  <td>3h 45m</td>
                  <td class="text-emerald-400 font-bold">3h 11m</td>
                </tr>
              </tbody>
            </table>
            <p class="text-[10px] text-slate-500 mt-2 italic">*Time drops ~15% when a tag matches.</p>
          </div>
        </div>
      </div>
    `;
  } 
  else if (context === "roster") {
    title = "Roster Settings";
    contentHTML = `
      <div class="space-y-4">
        <div>
          <p class="text-xs text-slate-300 leading-relaxed mb-3">
            Tell the app which survivors you own and their current star level. Tap a character card to cycle through the 3 states:
          </p>
          
          <div class="flex gap-2 justify-center bg-slate-900 p-3 rounded-lg border border-slate-800 mb-3">
            <div class="flex flex-col items-center gap-1 opacity-50">
              <div class="w-12 h-12 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-500">?</div>
              <span class="text-[9px] font-bold text-slate-400">Not Owned</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-12 h-12 bg-slate-800 border border-slate-600 rounded-lg flex items-center justify-center">
                 <img src="assets/survivors/common.webp" class="w-full h-full object-cover rounded-lg" onerror="this.style.display='none';">
              </div>
              <span class="text-[10px] text-amber-400 font-black">★</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div class="w-12 h-12 bg-slate-800 border-2 border-purple-500 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                 <img src="assets/survivors/common.webp" class="w-full h-full object-cover rounded-lg" onerror="this.style.display='none';">
              </div>
              <span class="text-[10px] text-amber-400 font-black">6★</span>
            </div>
          </div>

          <ul class="text-xs text-slate-300 space-y-1 ml-4 list-disc marker:text-slate-500">
            <li><strong>Grayed Out:</strong> Not owned (ignored by algorithm).</li>
            <li><strong>Bright + ★:</strong> Owned at Base level.</li>
            <li><strong>Bright + 6★:</strong> Owned and upgraded.</li>
          </ul>
        </div>

        <div class="bg-amber-950/40 border border-amber-900/50 rounded-xl p-3 mt-4">
          <h3 class="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">📢 Missing Tags?</h3>
          <p class="text-[11px] text-amber-200/80 leading-relaxed">
            We are still missing exact tags for some newer survivors (TMNT, SpongeBob, etc.). If you own them, please share their tags on Discord/Reddit so we can update the database!<br><br>
            <em>*Until added, survivors with unknown tags are assumed to have NO tags. They will not receive speed bonuses.</em>
          </p>
        </div>
      </div>
    `;
  }

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "helpModal";
    modal.className = "fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm hidden flex-col";
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="bg-darkbg w-full h-full max-w-md mx-auto flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 shrink-0">
        <h2 class="text-base font-bold text-white">${title}</h2>
        <button onclick="app.closeHelp()" class="text-slate-300 hover:text-white text-sm font-bold px-3 py-1 bg-slate-800 rounded-lg">Close</button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 hide-scrollbar">
        ${contentHTML}
      </div>
    </div>
  `;
  
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}