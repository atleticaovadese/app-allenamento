// Piano & Picco (periodizzazione, Bompa/Buzzichelli) — fedele al foglio Excel.
// Il coach compila Fase, Blocco forza, Sist. energetico e il Ciclo carico+scarico;
// Intensità, Volume, Gara, →gara A, Scarico e Peaking sono automatici.

const FASI = ["Prep. generale", "Prep. speciale", "Pre-competitiva", "Competitiva", "Transizione"];
const BLOCCHI = ["AA (Adatt. Anatomico)", "Mx-S (Forza Max)", "Conv. a Potenza", "Mant. P+MxS", "Competitivo"];
// sistemi energetici DIVERSI per disciplina (il dropdown cambia in base al gruppo scelto)
const SIST_EN_BY = {
  vel: ["O2 power (aerob.)", "Capacità lattacida", "Potenza alattacida", "Potenza lattacida"],
  lanci: ["Potenza alattacida", "Forza max / esplosiva", "Tecnica specifica", "Aerobico rigenerante"],
  mezzo: ["Aerobico base (Z1-2)", "Aerobico medio / Fondo", "Soglia LT2", "VO2max", "Capacità lattacida", "Potenza lattacida", "Velocità / neuromuscolare"]
};
function sistEnDi(g) { return SIST_EN_BY[g] || SIST_EN_BY.vel; }
const SIST_EN = SIST_EN_BY.vel;   // retrocompatibilità
const CICLI = ["4+1", "3+1", "2+1", "1+1", "1"];
const INT_BLOCCO = { "AA (Adatt. Anatomico)": 2, "Mx-S (Forza Max)": 4, "Conv. a Potenza": 4, "Mant. P+MxS": 5, "Competitivo": 5 };
const AD_CICLO = { "1": 1, "1+1": 2, "2+1": 3, "3+1": 4, "4+1": 5 };
const OPZ_SETT = Array.from({ length: 52 }, (_, i) => i + 1);  // 1..52
const WEEK_MS = 7 * 86400000;

function dnum(iso) { if (!iso) return null; const d = new Date(iso + "T00:00:00"); return isNaN(d) ? null : d.getTime(); }

// PER DISCIPLINA: DEMO.piano è una mappa { vel:{...}, lanci:{...}, mezzo:{...} } (come pista/palestra)
function _emptyPiano() { return { inizio: "", nSettimane: 24, righe: [] }; }
function pianoDi(g) {
  // migra il vecchio formato singolo (con .righe) → { vel: <vecchio>, lanci:{}, mezzo:{} }
  if (!DEMO.piano || DEMO.piano.righe) {
    const old = (DEMO.piano && DEMO.piano.righe) ? DEMO.piano : null;
    DEMO.piano = { vel: old || _emptyPiano(), lanci: _emptyPiano(), mezzo: _emptyPiano() };
  }
  if (!DEMO.piano[g]) DEMO.piano[g] = _emptyPiano();
  const p = DEMO.piano[g];
  if (!p.righe) p.righe = [];
  if (!p.nSettimane) p.nSettimane = 24;
  while (p.righe.length < p.nSettimane) p.righe.push({ fase: "", blocco: "", sist: "", ciclo: "" });
  return p;
}
// piano di un SINGOLO atleta: alla prima selezione è una COPIA del madre del suo gruppo,
// poi il coach lo modifica liberamente senza toccare il madre né gli altri atleti.
function pianoAtletaDi(atletaId) {
  DEMO.pianoAtleta = DEMO.pianoAtleta || {};
  if (!DEMO.pianoAtleta[atletaId]) {
    const a = DEMO.atleti.find(x => x.id === atletaId) || {};
    const g = (typeof gruppoDi === "function") ? gruppoDi(a) : (S.pianoDisc || "vel");
    const madre = pianoDi(g);
    DEMO.pianoAtleta[atletaId] = JSON.parse(JSON.stringify({ inizio: madre.inizio, nSettimane: madre.nSettimane, righe: madre.righe, disc: g }));
  }
  const p = DEMO.pianoAtleta[atletaId];
  if (!p.righe) p.righe = [];
  if (!p.nSettimane) p.nSettimane = 24;
  while (p.righe.length < p.nSettimane) p.righe.push({ fase: "", blocco: "", sist: "", ciclo: "" });
  return p;
}
// il piano attualmente in modifica: quello dell'atleta scelto, altrimenti il madre della disciplina
function pianoDati() {
  if (S.pianoAtleta) return pianoAtletaDi(S.pianoAtleta);
  return pianoDi(S.pianoDisc || "vel");
}
function setPianoDisc(g) { S.pianoDisc = g; S.pianoAtleta = null; disegna(); window.scrollTo(0, 0); }
// scegli chi stai pianificando: "" = programma madre, altrimenti l'atleta (crea la sua copia dal madre)
function setPianoAtleta(atletaId) {
  if (!atletaId) { S.pianoAtleta = null; disegna(); window.scrollTo(0, 0); return; }
  S.pianoAtleta = atletaId;
  const a = DEMO.atleti.find(x => x.id === atletaId);
  if (a && typeof gruppoDi === "function") S.pianoDisc = gruppoDi(a);
  pianoAtletaDi(atletaId);
  if (typeof savePiano === "function") savePiano();
  disegna(); window.scrollTo(0, 0);
}
// ributta il piano dell'atleta uguale al madre (scarta le sue modifiche), restando su di lui
function pianoAtletaResetMadre() {
  if (!S.pianoAtleta) return;
  if (typeof confirm === "function" && !confirm("Riallineare il piano al madre? Le modifiche personali di questo atleta verranno perse.")) return;
  const a = DEMO.atleti.find(x => x.id === S.pianoAtleta) || {};
  const g = (typeof gruppoDi === "function") ? gruppoDi(a) : (S.pianoDisc || "vel");
  const madre = pianoDi(g);
  DEMO.pianoAtleta = DEMO.pianoAtleta || {};
  DEMO.pianoAtleta[S.pianoAtleta] = JSON.parse(JSON.stringify({ inizio: madre.inizio, nSettimane: madre.nSettimane, righe: madre.righe, disc: g }));
  if (typeof savePiano === "function") savePiano();
  disegna(); window.scrollTo(0, 0);
}

// Calcola le colonne automatiche per ogni settimana (formule del foglio Excel).
function calcolaPiano() {
  const p = pianoDati();
  const startD = p.inizio ? new Date(p.inizio + "T00:00:00") : null;
  const gg = (a, b) => Math.round((b - a) / 86400000); // giorni tra due date, robusto all'ora legale
  // ogni gara → settimana del piano in cui cade (indice), calcolata a GIORNI (niente sfasamento CEST/CET)
  const gare = ((typeof gareGruppo === "function" ? gareGruppo(S.pianoDisc || "vel") : (DEMO.gareRaw || []))).map(g => {
    const d = g.data ? new Date(g.data + "T00:00:00") : null;
    return (d && !isNaN(d) && startD) ? { wk: Math.floor(gg(startD, d) / 7), ob: g.obiettivo, nome: g.luogo || g.gara } : null;
  }).filter(Boolean);
  const gareA = gare.filter(g => g.ob === "A").sort((a, b) => a.wk - b.wk);
  const out = [];
  let ad = 4, ae = -1;   // helper ciclo: lunghezza e posizione (carry come nell'Excel)
  for (let i = 0; i < p.nSettimane; i++) {
    const inp = p.righe[i] || { fase: "", blocco: "", sist: "", ciclo: "" };
    if (inp.ciclo) { ad = AD_CICLO[inp.ciclo] || 4; ae = 0; }
    else { ae = ((ae + 1) % ad + ad) % ad; }

    let gara = "", aA = null, scar = "", intv = "", vol = "", peak = "";
    if (startD) {
      const gThis = gare.find(x => x.wk === i);
      if (gThis) gara = gThis.nome + " (" + gThis.ob + ")";
      const gaNext = gareA.find(x => x.wk >= i);
      if (gaNext) aA = gaNext.wk - i;

      const garaA = (aA === 0);            // gara A questa settimana → picco/taper pieno
      const garaW = !!gThis;               // una gara qualsiasi (A/B/C) questa settimana
      scar = garaA ? "GARA" : (garaW ? "GARA " + gThis.ob : (ae === ad - 1 ? "SCARICO" : "carico"));

      if (garaA) intv = 5;
      else if (inp.blocco) intv = INT_BLOCCO[inp.blocco];
      else if (aA != null) intv = Math.max(2, Math.min(5, Math.round(5 - aA / 4)));
      else intv = 2;

      if (aA != null) {
        const base = Math.min(5, Math.round(1 + aA / 3));
        vol = garaA ? 1 : garaW ? Math.max(1, base - 1) : (ae === ad - 1 ? Math.max(1, base - 2) : Math.max(1, base));
        peak = Math.min(5, aA + 1);
      }
    }
    const dCol = startD ? new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i * 7) : null;
    out.push({ inizio: dCol ? dCol.getDate() + "/" + (dCol.getMonth() + 1) : "", intensita: intv, volume: vol, gara, aA, scarico: scar, peaking: peak });
  }
  return out;
}

function prossimaGaraA() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const src = (typeof gareGruppo === "function") ? gareGruppo(S.pianoDisc || "vel") : (DEMO.gareRaw || []);
  const gA = src.filter(g => g.obiettivo === "A" && g.data).map(g => new Date(g.data + "T00:00:00"))
    .filter(d => !isNaN(d) && d >= now).sort((a, b) => a - b)[0];
  if (!gA) return null;
  return { data: gA.toLocaleDateString("it-IT"), tra: Math.max(0, Math.ceil(Math.round((gA - now) / 86400000) / 7)) };
}

// ---------- vista ----------
function vistaPiano() {
  if (S.pianoGrafici) return vistaPianoGrafici();
  if (S.pianoAtleta && !DEMO.atleti.find(x => x.id === S.pianoAtleta)) S.pianoAtleta = null; // atleta rimosso → torna al madre
  const disc = S.pianoDisc || "vel";
  const p = pianoDati();
  const rows = calcolaPiano();
  const gaA = prossimaGaraA();
  const opt = (arr, val) => `<option value=""></option>` + arr.map(x => `<option ${x === val ? "selected" : ""}>${x}</option>`).join("");
  const colScar = s => s === "GARA" ? "var(--rosso)" : (s && s.indexOf("GARA") === 0) ? "var(--blu)" : s === "SCARICO" ? "var(--giallo)" : "var(--txt3)";

  const corpo = rows.map((r, i) => {
    const inp = p.righe[i];
    return `<tr>
      <td>${i + 1}</td>
      <td class="pdata">${r.inizio || "—"}</td>
      <td><select onchange="setPianoCella(${i},'fase',this.value)">${opt(FASI, inp.fase)}</select></td>
      <td><select onchange="setPianoCella(${i},'blocco',this.value)">${opt(BLOCCHI, inp.blocco)}</select></td>
      <td><select onchange="setPianoCella(${i},'sist',this.value)">${opt(sistEnDi(disc), inp.sist)}</select></td>
      <td class="pauto">${r.intensita === "" ? "—" : r.intensita}</td>
      <td class="pauto">${r.volume === "" ? "—" : r.volume}</td>
      <td class="pgara">${r.gara || ""}</td>
      <td class="pauto">${r.aA == null ? "" : r.aA}</td>
      <td style="color:${colScar(r.scarico)};font-weight:600">${r.scarico || ""}</td>
      <td><select onchange="setPianoCella(${i},'ciclo',this.value)">${opt(CICLI, inp.ciclo)}</select></td>
      <td class="pauto">${r.peaking === "" ? "" : r.peaking}</td>
    </tr>`;
  }).join("");

  const grp = (typeof GRUPPI_PROG !== "undefined") ? GRUPPI_PROG : [["vel", "Velocisti / Saltatori"], ["lanci", "Lanciatori"], ["mezzo", "Mezzofondo / Fondo"]];
  const nomeG = (typeof nomeGruppo === "function") ? nomeGruppo(disc) : ((grp.find(x => x[0] === disc) || [])[1] || "");
  const isAtl = !!S.pianoAtleta;
  const atl = isAtl ? DEMO.atleti.find(x => x.id === S.pianoAtleta) : null;
  const listaAtl = (typeof atletiDelGruppo === "function") ? atletiDelGruppo(disc) : DEMO.atleti.filter(x => ((typeof gruppoDi === "function") ? gruppoDi(x) : "vel") === disc);
  return `
  <div class="card"><h3>Piano & Picco</h3>
    <p class="et" style="margin-top:2px">Piano annuale della stagione (Bompa). Tu compili <b>Fase</b>, <b>Blocco forza</b>, <b>Sist. energetico</b> e il <b>Ciclo</b>; Intensità, Volume, Gara, Scarico e Peaking escono da soli.</p></div>
  <div class="card">
    <label class="lab">Piano per disciplina (madre)</label>
    <select onchange="setPianoDisc(this.value)" style="margin-top:6px">${grp.map(([k, l]) => `<option value="${k}" ${k === disc ? "selected" : ""}>${l}</option>`).join("")}</select>
    <label class="lab" style="display:block;margin-top:12px">Chi stai pianificando</label>
    <select onchange="setPianoAtleta(this.value)" style="margin-top:6px">
      <option value="">🗂 Programma madre — ${nomeG}</option>
      ${listaAtl.map(x => { const has = DEMO.pianoAtleta && DEMO.pianoAtleta[x.id]; return `<option value="${x.id}" ${S.pianoAtleta === x.id ? "selected" : ""}>${x.nome}${has ? " · personalizzato" : ""}</option>`; }).join("")}
    </select>
    <div style="margin-top:10px;padding:9px 11px;border-radius:9px;background:${isAtl ? "var(--blu-bg)" : "var(--card2)"};font-size:12.5px;color:${isAtl ? "var(--blu)" : "var(--txt2)"};line-height:1.5">
      ${isAtl
        ? `✏️ Stai modificando il piano <b>solo di ${atl ? atl.nome : ""}</b>. Il <b>madre</b> e gli altri atleti <b>non cambiano</b>.`
        : `🗂 Stai modificando il <b>piano madre</b> dei <b>${nomeG}</b>: vale per tutti gli atleti del gruppo che non hanno un piano personale. Seleziona un atleta per adattarglielo su misura.`}
    </div>
    ${isAtl ? `<button class="btn btn-2" style="margin-top:10px" onclick="pianoAtletaResetMadre()">↺ Riallinea al piano madre</button>` : ""}
    ${isAtl ? "" : `<p class="et" style="margin-top:8px">Sistemi energetici dei <b>${nomeG}</b>: <span style="color:var(--txt)">${sistEnDi(disc).join(" · ")}</span>.</p>`}
  </div>
  <div class="card">
    <div class="griglia2">
      <div><label class="lab">Inizio settimana 1</label>
        <input type="date" value="${p.inizio || ""}" onchange="setPianoInizio(this.value)" style="margin-top:6px"></div>
      <div><label class="lab">Settimane</label>
        <select onchange="setPianoNsett(+this.value)" style="margin-top:6px">
          ${OPZ_SETT.map(n => `<option value="${n}" ${p.nSettimane === n ? "selected" : ""}>${n}</option>`).join("")}
        </select></div>
    </div>
    ${gaA ? `<p class="et" style="margin-top:10px">Prossima gara A: <b>${gaA.data}</b> · tra ${gaA.tra} settimane · <button class="link-indietro" onclick="vai('gare')">gestisci gare ›</button></p>`
          : `<p class="et" style="margin-top:10px">Nessuna gara «A». <button class="link-indietro" onclick="vai('gare')">Gestisci gare ›</button></p>`}
  </div>
  ${(() => {
    const src = (typeof gareGruppo === "function" ? gareGruppo(disc) : (DEMO.gareRaw || [])).filter(g => g.data);
    const fut = src.slice().sort((a, b) => a.data < b.data ? -1 : 1).filter(g => new Date(g.data + "T00:00:00").getTime() >= Date.now() - 7 * 86400000);
    if (!fut.length) return "";
    const colOb = o => o === "A" ? "var(--rosso)" : "var(--blu)";
    return `<div class="card"><p class="et" style="margin-bottom:6px"><b>🏁 Gare in calendario</b> — ${nomeG}</p>${fut.map(g => `<div class="riga" style="padding:6px 0">
      <div style="font-weight:500">${g.luogo || g.gara || "gara"}${g.luogo && g.gara ? " · " + g.gara : ""} <b style="color:${colOb(g.obiettivo)}">(${g.obiettivo || "?"})</b></div>
      <b class="pdata">${typeof fmtData === "function" ? fmtData(g.data) : g.data}</b></div>`).join("")}<p class="et" style="margin-top:6px;color:var(--txt3)">Le trovi anche nella tabella (colonne Gara / Scarico): <span style="color:var(--rosso)">A</span> · <span style="color:var(--blu)">B/C</span>.</p></div>`;
  })()}
  <button class="btn btn-2" style="margin-bottom:12px" onclick="apriPianoGrafici()">📊 Vedi i grafici</button>
  <div class="p-scroll">
    <table class="piano">
      <thead><tr>
        <th>Sett</th><th>Inizio</th><th>Fase</th><th>Blocco forza</th><th>Sist. energ.</th>
        <th>Int</th><th>Vol</th><th>Gara</th><th>→A</th><th>Scarico</th><th>Ciclo</th><th>Peak</th>
      </tr></thead>
      <tbody>${corpo}</tbody>
    </table>
  </div>
  <p class="et" style="margin-top:10px"><span style="color:var(--verde)">Verde</span> = automatico (Int/Vol/Peaking 1-5). Lo <b>Scarico</b> esce dal Ciclo (ultima settimana di ogni ciclo). <b>Gara</b> e <b>→A</b> dal Calendario gare. Il Ciclo lo imposti a inizio blocco e vale finché non lo cambi.</p>`;
}

function setPianoInizio(v) { pianoDati().inizio = v; if (typeof savePiano === "function") savePiano(); disegna(); }
function setPianoNsett(n) {
  const p = pianoDati();
  p.nSettimane = Math.max(1, Math.min(52, n));
  while (p.righe.length < p.nSettimane) p.righe.push({ fase: "", blocco: "", sist: "", ciclo: "" });
  if (typeof savePiano === "function") savePiano(); disegna();
}
// propaga Fase / Blocco forza / Sist. energetico dalla settimana d'inizio blocco (quella col Ciclo)
// a tutte le settimane del blocco, fino allo scarico compreso. Il Ciclo resta solo sull'inizio.
function _pianoFillGiu(p, i) {
  const src = p.righe[i];
  if (!src || !src.ciclo) return;
  const n = AD_CICLO[src.ciclo] || 0;
  for (let k = i + 1; k < Math.min(i + n, p.nSettimane); k++) {
    p.righe[k].fase = src.fase;
    p.righe[k].blocco = src.blocco;
    p.righe[k].sist = src.sist;
    p.righe[k].ciclo = "";
  }
}
function setPianoCella(i, campo, v) {
  const p = pianoDati();
  p.righe[i][campo] = v;
  // inizio blocco (settimana col Ciclo): riempi in automatico il resto del blocco con gli stessi valori
  if (campo === "ciclo") { if (v) _pianoFillGiu(p, i); }
  else if ((campo === "fase" || campo === "blocco" || campo === "sist") && p.righe[i].ciclo) _pianoFillGiu(p, i);
  if (typeof savePiano === "function") savePiano();
  disegna();
}

// ---------- grafici ----------
function apriPianoGrafici() { S.pianoGrafici = true; disegna(); window.scrollTo(0, 0); }
function chiudiPianoGrafici() { S.pianoGrafici = false; disegna(); window.scrollTo(0, 0); }

// grafico a linee (scala 1-5) di Intensità / Volume / Picco
function chartPianoSVG(calc) {
  const n = calc.length;
  if (!n || !pianoDati().inizio) return `<p class="et">Imposta l'inizio della stagione (nel piano) per vedere il grafico.</p>`;
  const W = 340, H = 190, padL = 20, padR = 8, padT = 10, padB = 22;
  const x = i => padL + (W - padL - padR) * (n <= 1 ? 0 : i / (n - 1));
  const y = v => (H - padB) - (H - padT - padB) * ((v - 1) / 4);
  const serie = [{ key: "intensita", col: "#ff6b6b" }, { key: "volume", col: "#4d9aff" }, { key: "peaking", col: "#7cc243" }];
  const linea = s => {
    const pts = calc.map((c, i) => (c[s.key] === "" || c[s.key] == null) ? null : `${x(i).toFixed(1)},${y(c[s.key]).toFixed(1)}`).filter(Boolean).join(" ");
    return pts ? `<polyline points="${pts}" fill="none" stroke="${s.col}" stroke-width="2" stroke-linejoin="round"/>` : "";
  };
  const grid = [1, 2, 3, 4, 5].map(v => `<line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="#2c2c34" stroke-width="1"/><text x="2" y="${(y(v) + 3).toFixed(1)}" fill="#76756f" font-size="9">${v}</text>`).join("");
  const gara = calc.map((c, i) => {
    if (!c.scarico || c.scarico.indexOf("GARA") !== 0) return "";
    const col = c.scarico === "GARA" ? "#ff6b6b" : "#4d9aff"; // A = rosso, B/C = blu
    return `<line x1="${x(i).toFixed(1)}" y1="${padT}" x2="${x(i).toFixed(1)}" y2="${H - padB}" stroke="${col}" stroke-width="1" stroke-dasharray="3 3" opacity="0.55"/>`;
  }).join("");
  const xlab = calc.map((c, i) => (i % 4 === 0 || i === n - 1) ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" fill="#76756f" font-size="9" text-anchor="middle">${i + 1}</text>` : "").join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${grid}${gara}${xlab}${serie.map(linea).join("")}</svg>`;
}

function vistaPianoGrafici() {
  const calc = calcolaPiano();
  return `<button class="indietro" onclick="chiudiPianoGrafici()">‹ Torna al piano</button>
    <div class="card"><h3>Grafici del piano</h3>
      <p class="et" style="margin-top:2px">L'andamento programmato della stagione. Linee tratteggiate: <span style="color:#ff6b6b">gare A</span> · <span style="color:#4d9aff">gare B/C</span>.</p></div>

    <div class="card">
      <p class="et" style="margin-bottom:6px">Intensità · Volume · Picco (1–5) per settimana</p>
      ${chartPianoSVG(calc)}
      <div style="display:flex;gap:14px;margin-top:8px;flex-wrap:wrap">
        <span class="et"><span class="quad" style="background:#ff6b6b"></span> intensità</span>
        <span class="et"><span class="quad" style="background:#4d9aff"></span> volume</span>
        <span class="et"><span class="quad" style="background:#7cc243"></span> picco</span>
      </div>
    </div>

    <div class="card">
      <p class="et" style="margin-bottom:6px">Forma misurata (TSB) per settimana</p>
      <div style="background:var(--card2);border:1px dashed var(--line2);border-radius:12px;padding:16px;font-size:13px;color:var(--txt2);line-height:1.6">
        Si riempirà quando gli atleti registreranno gli allenamenti (Carico &amp; Forma). Obiettivo: la forma reale sale quando il <b>picco</b> scende a 1 sulla gara A.</div>
    </div>`;
}
