// Viste delle librerie (Sala, Mobilità, Pliometria, Video) — dati da librerie.js.

// Da un URL YouTube (video, youtu.be o playlist) all'URL da mettere in <iframe>.
function ytEmbed(u) {
  if (!u) return "";
  let m;
  if (m = u.match(/youtu\.be\/([\w-]+)/)) return "https://www.youtube-nocookie.com/embed/" + m[1];
  if (m = u.match(/[?&]v=([\w-]+)/)) return "https://www.youtube-nocookie.com/embed/" + m[1];
  if (m = u.match(/[?&]list=([\w-]+)/)) return "https://www.youtube-nocookie.com/embed/videoseries?list=" + m[1];
  return "";
}

// Foglio esercizio: muscoli + cue + video che si apre DENTRO l'app (embed) + link a YouTube.
function apriVideo(nome, url, muscoli, cue, fonte) {
  const emb = ytEmbed(url);
  mostraFoglio(`
    <div class="foglio-top"><h3>${nome}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    ${muscoli ? `<p class="et" style="margin-bottom:8px"><b style="color:var(--txt2)">Lavora:</b> ${muscoli}</p>` : ""}
    ${cue ? `<p style="font-size:14px;line-height:1.6;margin-bottom:10px">${cue}</p>` : ""}
    ${fonte ? `<p class="et">fonte: ${fonte}</p>` : ""}
    ${emb
      ? `<div class="yt-wrap"><iframe src="${emb}" title="${nome}"
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
           allowfullscreen loading="lazy"></iframe></div>
         <a class="et" style="display:block;text-align:center;margin-top:8px;color:var(--blu)"
            href="${url}" target="_blank" rel="noopener">apri su YouTube ↗</a>`
      : `<div class="video-vuoto"><span>▶</span></div>
         <p class="et" style="margin-top:12px">Video non ancora disponibile per questo esercizio.</p>`}`);
}

// Libreria a lista raggruppata per distretto/zona (Sala, Mobilità, Pliometria).
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

function apriEs(tipo, idx) {
  const x = LIBRERIE[tipo][idx];
  apriVideo(x.n, x.v, x.m, x.cue, x.f);
}

// Libreria Video a due livelli: categorie (Basic taps, Running drills, ...) -> esercizi.
function vistaLibreriaVideo() {
  const cats = LIBRERIE.video || [];
  if (S.libCat == null) {
    let h = `<div class="card"><h3>Libreria Video</h3>
      <p class="et" style="margin-top:2px">Andature, mobilità e tecnica divise per categoria · tocca una categoria</p></div>`;
    h += cats.map((c, i) => `<div class="lib-row" onclick="apriCat(${i})">
      <div style="flex:1;min-width:0"><div style="font-weight:500">${c.cat}</div>
        <div class="et" style="margin-top:1px">${c.items.length} esercizi</div></div>
      <span class="vid-ic">▶</span><span class="freccia">›</span></div>`).join("");
    return h;
  }
  const c = cats[S.libCat];
  let h = `<div class="card">
    <button class="link-indietro" onclick="apriCat(null)">‹ tutte le categorie</button>
    <h3 style="margin-top:6px">${c.cat}</h3>
    <p class="et" style="margin-top:2px">${c.items.length} esercizi · tocca per il video</p></div>`;
  h += c.items.map((x, i) => `<div class="lib-row" onclick="apriVideoLib(${S.libCat},${i})">
    <div style="flex:1;min-width:0;font-weight:500">${x.n}</div>
    ${x.v ? '<span class="vid-ic">▶</span>' : ""}<span class="freccia">›</span></div>`).join("");
  return h;
}

function apriCat(i) { S.libCat = i; disegna(); window.scrollTo(0, 0); }
function apriVideoLib(ci, ii) { const x = LIBRERIE.video[ci].items[ii]; apriVideo(x.n, x.v); }

// Cerca un esercizio (per nome) in tutte le librerie: serve al riscaldamento.
function cercaLibreria(nome) {
  const q = (nome || "").toLowerCase().trim();
  if (!q) return null;
  const tipi = ["sala", "mobilita", "pliometria"];
  for (const t of tipi) {
    const hit = (LIBRERIE[t] || []).find(x => x.n.toLowerCase() === q);
    if (hit) return hit;
  }
  // anche dentro la Libreria Video (andature, mobility, ecc.)
  for (const c of (LIBRERIE.video || [])) {
    const hit = c.items.find(x => x.n.toLowerCase() === q);
    if (hit) return { n: hit.n, v: hit.v, m: "", cue: "", f: "" };
  }
  // ultima chance: corrispondenza parziale nelle librerie esercizi
  for (const t of tipi) {
    const hit = (LIBRERIE[t] || []).find(x => {
      const n = x.n.toLowerCase();
      return n.length > 3 && (q.includes(n) || n.includes(q));
    });
    if (hit) return hit;
  }
  return null;
}
