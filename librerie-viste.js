// Viste delle librerie (Sala, Mobilità, Pliometria) — dati da librerie.js.

function vistaLibreria(tipo, titolo) {
  const items = LIBRERIE[tipo] || [];
  const gruppi = {};
  items.forEach((x, idx) => { (gruppi[x.g] = gruppi[x.g] || []).push(idx); });
  const conVideo = items.filter(x => x.v).length;

  let h = `<div class="card"><h3>${titolo}</h3>
    <p class="et" style="margin-top:2px">${items.length} esercizi · ${conVideo} con video · tocca per la scheda</p></div>`;

  for (const g of Object.keys(gruppi)) {
    h += `<p class="sez">${g}</p>`;
    h += gruppi[g].map(idx => {
      const x = items[idx];
      return `<div class="lib-row" onclick="apriEs('${tipo}',${idx})">
        <div style="flex:1;min-width:0">
          <div style="font-weight:500">${x.n}</div>
          <div class="et" style="margin-top:1px">${x.m || ""}</div>
        </div>
        ${x.v ? '<span class="vid-ic">▶</span>' : ""}
        <span class="freccia">›</span>
      </div>`;
    }).join("");
  }
  return h;
}

// Cerca un esercizio (per nome) in tutte le librerie: serve al riscaldamento.
function cercaLibreria(nome) {
  const q = (nome || "").toLowerCase().trim();
  if (!q) return null;
  const tipi = ["sala", "mobilita", "pliometria"];
  for (const t of tipi) {
    const hit = (LIBRERIE[t] || []).find(x => x.n.toLowerCase() === q);
    if (hit) return hit;
  }
  for (const t of tipi) {
    const hit = (LIBRERIE[t] || []).find(x => {
      const n = x.n.toLowerCase();
      return n.length > 3 && (q.includes(n) || n.includes(q));
    });
    if (hit) return hit;
  }
  return null;
}

function apriEs(tipo, idx) {
  const x = LIBRERIE[tipo][idx];
  mostraFoglio(`
    <div class="foglio-top"><h3>${x.n}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    ${x.m ? `<p class="et" style="margin-bottom:8px">${x.m}</p>` : ""}
    ${x.cue ? `<p style="font-size:14px;line-height:1.6;margin-bottom:10px">${x.cue}</p>` : ""}
    ${x.f ? `<p class="et">fonte: ${x.f}</p>` : ""}
    ${x.v
      ? `<a class="btn" style="margin-top:14px;text-decoration:none;display:block;text-align:center"
           href="${x.v}" target="_blank" rel="noopener">▶ Guarda il video</a>`
      : `<div class="video-vuoto" style="margin-top:14px;height:80px;font-size:13px">Video non disponibile</div>`}`);
}
