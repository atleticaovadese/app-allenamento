// Programma PISTA — editor delle sedute in pista (fedele al foglio Excel).
// Mesociclo → 4 giorni → 4 settimane. Il coach scrive contenuto/distanza/n°/rec/%vel;
// il TEMPO richiesto e la m/s escono da soli dal PB e dal coefficiente della distanza.
// Tempo = PB × coeff(distanza) / (%vel/100)   ·   m/s = distanza / tempo
// Volume seduta = somma(distanza × n°).

const PISTA_PROFILI = ["100m M", "100m F", "100m F Master", "200m M", "200m F", "400m"];
const PISTA_COEFF = {
  "100m M": { 20: 0.295, 30: 0.3987, 40: 0.4868, 50: 0.5727, 60: 0.6565, 70: 0.7405, 80: 0.8255, 90: 0.9117, 100: 1.0, 120: 1.1689, 150: 1.4252 },
  "100m F": { 20: 0.2816, 30: 0.3805, 40: 0.4688, 50: 0.5563, 60: 0.6419, 70: 0.7293, 80: 0.8186, 90: 0.9088, 100: 1.0, 120: 1.224, 150: 1.56, 180: 1.896, 200: 2.12, 220: 2.2838, 250: 2.592, 300: 3.1057 },
  "100m F Master": { 20: 0.2654, 30: 0.3587, 40: 0.4478, 50: 0.5365, 60: 0.6253, 70: 0.7156, 80: 0.8067, 90: 0.8997, 100: 1.0, 120: 1.1747, 150: 1.4479 },
  "200m M": { 20: 0.149, 30: 0.2013, 40: 0.2471, 50: 0.2913, 60: 0.3364, 70: 0.381, 80: 0.4262, 90: 0.4719, 100: 0.5176, 120: 0.6111, 150: 0.7513, 180: 0.9005, 200: 1.0 },
  "200m F": { 20: 0.1448, 30: 0.1957, 40: 0.2402, 50: 0.2832, 60: 0.3286, 70: 0.3734, 80: 0.4188, 90: 0.4648, 100: 0.5107, 120: 0.6053, 150: 0.7471, 180: 0.8988, 200: 1.0 },
  "400m": { 50: 0.1403, 100: 0.2508, 150: 0.3642, 200: 0.4816, 250: 0.6021, 300: 0.7261, 350: 0.8574, 400: 1.0 }
};

// una riga di pista "conta" (= genera seduta E va nell'aderenza) secondo il gruppo.
// DEVE restare allineata ai filtri dei tre generatori (velocità / mezzo / lanci).
function _rigaValidaPista(r, gruppo) {
  if (!r) return false;
  if (gruppo === "lanci") return !!(r.mezzo && Number(r.n) > 0);
  if (gruppo === "mezzo") return Number(r.distanza) > 0 || Number(r.min) > 0;
  return !!(r.distanza && Number(r.n) > 0);   // velocità / salti
}
function rigaVuota() { return { contenuto: "", distanza: "", n: "", rec: "", perc: "" }; }
function settVuota() { return { righe: [rigaVuota()], nota: "" }; }
function giornoVuoto() { return { giornoSett: "", risc: {}, settimane: [settVuota(), settVuota(), settVuota(), settVuota()] }; }

// riscaldamento del giorno: 4 tipi (attivazione/mobilità/andature/ostacoli), ognuno on/off + protocollo scelto
const RISC_TIPI_PISTA = [["attivazione", "Attivazione"], ["mobilita", "Mobilità"], ["andature", "Andature"], ["ostacoli", "Ostacoli"]];
function riscInit(g) {
  if (!g.risc) g.risc = {};
  RISC_TIPI_PISTA.forEach(([k]) => { if (!g.risc[k]) g.risc[k] = { on: false, prot: "" }; });
  return g.risc;
}
function routineDiTipo(label) {
  const st = DEMO.schedeTipo || {};
  return Object.keys(DEMO.schede || {}).filter(n => (st[n] || "") === label);
}
function giornoCorrente() { return pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno]; }
// giorno "corrente" per il riscaldamento: pista o palestra, in base alla schermata aperta
function riscGiorno() {
  if (S.vista === "palestra" && typeof palestraInit === "function")
    return palestraInit().mesocicli[S.palMeso].giorni[S.palGiorno];
  return giornoCorrente();
}

function apriRiscPista() {
  const g = riscGiorno(), risc = riscInit(g);
  const body = RISC_TIPI_PISTA.map(([k, label]) => {
    const rs = routineDiTipo(label), on = risc[k].on;
    return `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
      <label class="check"><input type="checkbox" ${on ? "checked" : ""} onchange="toggleRiscTipo('${k}',this.checked)"><span>${label}</span></label>
      ${on ? (rs.length
        ? `<select style="margin-top:8px" onchange="setRiscTipoProt('${k}',this.value)"><option value="">— scegli protocollo —</option>${rs.map(n => `<option ${risc[k].prot === n ? "selected" : ""}>${n}</option>`).join("")}</select>`
        : `<p class="et" style="margin-top:6px">Nessun protocollo «${label}». Crealo in Programma → Riscaldamento scegliendo il tipo «${label}».</p>`) : ""}
    </div>`;
  }).join("");
  mostraFoglio(`
    <div class="foglio-top"><h3>Riscaldamento del giorno</h3>
      <button class="chiudi" onclick="chiudiRiscPista()" aria-label="Chiudi">✕</button></div>
    <p class="et" style="margin-bottom:4px">Spunta i tipi da includere e scegli il protocollo. Puoi combinarli come vuoi.</p>
    ${body}`);
}
function toggleRiscTipo(k, on) { riscInit(riscGiorno())[k].on = on; if (typeof salvaCustom === "function") salvaCustom(); apriRiscPista(); }
function setRiscTipoProt(k, v) { riscInit(riscGiorno())[k].prot = v; if (typeof salvaCustom === "function") salvaCustom(); apriRiscPista(); }
function chiudiRiscPista() { chiudiScheda(); disegna(); }
function riscRiassunto(g) {
  const risc = riscInit(g);
  const att = RISC_TIPI_PISTA.filter(([k]) => risc[k].on);
  return att.length ? att.map(([k, label]) => `${label}${risc[k].prot ? " (" + risc[k].prot + ")" : ""}`).join(" · ") : "non impostato";
}
// nomi dei protocolli scelti dal coach → lista che l'atleta vede nella seduta (ogni voce apribile).
// Vale per pista velocità, palestra, mezzofondo e lanci (stessa struttura g.risc).
function riscLista(g) {
  const risc = (g && g.risc) || {};
  return RISC_TIPI_PISTA.filter(([k]) => risc[k] && risc[k].on).map(([k, label]) => risc[k].prot || label);
}

// ---------- pliometria / policoncorrenza (dopo il riscaldamento) — condivisa vel + mezzo ----------
const PLIO_MODI = [["balzi", "balzi"], ["metri", "m"], ["ostacoli", "ostacoli"]];
function _plioModoLab(m) { const x = PLIO_MODI.find(p => p[0] === m); return x ? x[1] : (m || ""); }
function plioInit(g) { if (!g.plio) g.plio = []; return g.plio; }
function plioRiassunto(g) { const p = (g.plio || []).filter(r => r.es); return p.length ? p.map(r => r.es).join(" · ") : "non impostata"; }
// descrizione di una riga (per la seduta dell'atleta)
function plioTxt(r) {
  const q = (r.q || r.serie) ? (r.serie ? r.serie + "×" : "") + (r.q || "") + " " + _plioModoLab(r.modo) : "";
  return r.es + (q ? " — " + q.trim() : "") + (r.rec ? " · rec " + r.rec : "");
}
function apriPlio() {
  const g = riscGiorno(), plio = plioInit(g);   // riscGiorno = giorno attivo (pista o palestra)
  const optModo = sel => PLIO_MODI.map(([k]) => `<option value="${k}" ${sel === k ? "selected" : ""}>${k}</option>`).join("");
  const rows = plio.map((r, i) => `<tr>
      <td><input value="${(r.es || "").replace(/"/g, "&quot;")}" placeholder="es. Balzi tra ostacoli" oninput="setPlioRigaVal(${i},'es',this.value)" style="min-width:150px"></td>
      <td><input inputmode="numeric" value="${r.serie || ""}" placeholder="n°" oninput="setPlioRigaVal(${i},'serie',this.value)" style="min-width:44px"></td>
      <td><select onchange="setPlioRiga(${i},'modo',this.value)">${optModo(r.modo || "balzi")}</select></td>
      <td><input inputmode="numeric" value="${r.q || ""}" placeholder="quant." oninput="setPlioRigaVal(${i},'q',this.value)" style="min-width:56px"></td>
      <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setPlioRigaVal(${i},'rec',this.value)" style="min-width:56px"></td>
      <td><button class="chiudi" style="font-size:14px" onclick="plioDelRiga(${i})" aria-label="Rimuovi">✕</button></td>
    </tr>`).join("");
  mostraFoglio(`
    <div class="foglio-top"><h3>Pliometria / policoncorrenza</h3>
      <button class="chiudi" onclick="chiudiPlio()" aria-label="Chiudi">✕</button></div>
    <p class="et" style="margin-bottom:8px">Esercizi da fare <b>dopo il riscaldamento</b>. Scegli l'esercizio, le serie, se contarlo in <b>balzi</b>, <b>metri</b> o <b>ostacoli</b>, e la quantità.<br>Es: <i>Balzi tra ostacoli 4 × 8 ostacoli · Salto in lungo da fermo 4 × 5 balzi · Balzi alternati 4 × 30 m · Cadute (drop) 4 × 6 balzi</i></p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Esercizio</th><th>Serie</th><th>Conta</th><th>Quantità</th><th>Rec</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="plioAddRiga()">＋ esercizio</button>`);
}
function plioAddRiga() { plioInit(riscGiorno()).push({ es: "", serie: "", modo: "balzi", q: "", rec: "" }); if (typeof salvaCustom === "function") salvaCustom(); apriPlio(); }
function plioDelRiga(i) { const p = plioInit(riscGiorno()); if (i >= 0 && i < p.length) p.splice(i, 1); if (typeof salvaCustom === "function") salvaCustom(); apriPlio(); }
function setPlioRiga(i, campo, v) { plioInit(riscGiorno())[i][campo] = v; if (typeof salvaCustom === "function") salvaCustom(); apriPlio(); }
function setPlioRigaVal(i, campo, v) { plioInit(riscGiorno())[i][campo] = v; if (typeof salvaCustom === "function") salvaCustom(); }
function chiudiPlio() { chiudiScheda(); disegna(); }
// blocco pliometria nella seduta dell'atleta (dopo il riscaldamento)
function bloccoPliometria(s) {
  const p = (s.plio || []).filter(r => r.es);
  if (!p.length) return "";
  return `<div class="card"><p class="et" style="margin-bottom:6px">Pliometria / policoncorrenza (dopo il riscaldamento)</p>
    ${p.map(r => `<div style="padding:5px 0${r === p[p.length - 1] ? "" : ";border-bottom:1px solid var(--line)"}"><b>${r.es}</b>${(r.q || r.serie) ? ` <span class="et">${(r.serie ? r.serie + "×" : "") + (r.q || "") + " " + _plioModoLab(r.modo)}${r.rec ? " · rec " + r.rec : ""}</span>` : ""}</div>`).join("")}</div>`;
}

// ---------- collegamento al Piano & Picco ----------
function cicloDaLen(len) { return ({ 1: "1", 2: "1+1", 3: "2+1", 4: "3+1", 5: "4+1" })[len] || ""; }
function isoLocale(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function nSettimaneMeso(m) { return (m.ciclo && typeof AD_CICLO !== "undefined" && AD_CICLO[m.ciclo]) ? AD_CICLO[m.ciclo] : 4; }
function isScaricoIdx(m, s) {
  if (!m.ciclo) return false;
  if (m.ciclo === "1") return true;                 // ciclo "1" = tutto scarico
  return s === nSettimaneMeso(m) - 1;               // ultima settimana del ciclo
}
function settimaneDelGiorno(m, g) {
  const n = nSettimaneMeso(m);
  while (g.settimane.length < n) g.settimane.push(settVuota());
  g.settimane.forEach(s => { if (s.nota === undefined) s.nota = ""; });
  return g.settimane.slice(0, n);
}

// cicli (mesocicli) ricavati dal foglio Piano & Picco
function pistaCicliPiano() {
  // il Piano è per-disciplina: prendi quello del gruppo che si sta programmando
  const p = (typeof pianoDi === "function") ? pianoDi(S.progGruppo || "vel") : DEMO.piano;
  if (!p || !p.inizio || !p.righe || typeof AD_CICLO === "undefined") return [];
  const inizio = new Date(p.inizio + "T00:00:00");
  const res = [];
  let AD = 4, AE = null, label = "";
  for (let i = 0; i < p.nSettimane; i++) {
    const w = p.righe[i] || {};
    if (w.ciclo) { AD = AD_CICLO[w.ciclo] || 4; AE = 0; label = w.ciclo; }
    else { AE = (AE === null ? 0 : (AE + 1) % AD); }
    if (AE === 0) res.push({ startIdx: i, ciclo: label || cicloDaLen(AD), data: new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate() + i * 7), blocco: w.blocco || "" });
  }
  res.forEach((c, k) => { c.nWeeks = ((k + 1 < res.length) ? res[k + 1].startIdx : p.nSettimane) - c.startIdx; });
  return res;
}
function setPistaMesoDaPiano(idx) {
  if (idx === "") return;
  const c = pistaCicliPiano()[Number(idx)];
  if (!c) return;
  const m = pistaInit().mesocicli[S.pistaMeso];
  m.ciclo = c.ciclo;
  m.inizio = isoLocale(c.data);
  if (c.blocco && !m.blocco) m.blocco = c.blocco;
  savePista(); disegna();
}

// copia la settimana 1 sulle altre; sulla settimana di scarico taglia il volume del 50% (dimezza le ripetute)
function pistaCopiaSettimana() {
  const m = pistaInit().mesocicli[S.pistaMeso], g = m.giorni[S.pistaGiorno];
  const n = nSettimaneMeso(m);
  while (g.settimane.length < n) g.settimane.push(settVuota());
  const src = g.settimane[0];
  for (let s = 1; s < n; s++) {
    const righe = (src.righe || []).map(r => ({ ...r }));
    if (isScaricoIdx(m, s)) righe.forEach(r => {
      if (r.n) r.n = Math.max(1, Math.round(Number(r.n) / 2));
      if (r.min) r.min = String(Math.max(1, Math.round(Number(r.min) / 2)));   // corsa continua (mezzofondo)
    });
    g.settimane[s].righe = righe;
    g.settimane[s].nota = src.nota || "";
  }
  savePista(); disegna();
}

// opzioni % progressione: Volume in passi ampi, Intensità in punti percentuali fini
const PROG_VOL = [5, 10, 15, 20, 30, 40];
const PROG_INT = [2.5, 5, 7.5, 10];
// cambia le opzioni del menu % quando si sceglie Volume o Intensità
function progSwitch(tId, pId) {
  const t = document.getElementById(tId), p = document.getElementById(pId);
  if (!t || !p) return;
  const opts = t.value === "volume" ? PROG_VOL : PROG_INT;
  p.innerHTML = opts.map(o => `<option>${o}</option>`).join("");
}
// progressione: copia la settimana precedente aumentando Volume (ripetute ×%) o Intensità (% vel: +punti)
function applicaProgrPista(s) {
  if (s < 1) return;
  const tSel = document.getElementById("pgt-" + s), pSel = document.getElementById("pgp-" + s);
  const tipo = tSel ? tSel.value : "volume", pct = parseFloat(pSel ? pSel.value : "10");
  const g = giornoCorrente(), prev = g.settimane[s - 1], cur = g.settimane[s];
  if (!prev || !(prev.righe || []).some(r => r.n || r.perc)) { alert("Compila prima la settimana precedente."); return; }
  const f = 1 + pct / 100;
  const base = cur.righe || [];
  const curVuota = !base.some(r => r.n || r.perc || r.contenuto);
  // il valore modificato si calcola dalla settimana precedente; l'ALTRA dimensione (e le modifiche già fatte) restano
  cur.righe = prev.righe.map((pr, i) => {
    const nr = { ...((!curVuota && base[i]) ? base[i] : pr) };
    if (tipo === "volume") {
      const n = Number(pr.n); if (n > 0) nr.n = String(Math.max(1, Math.round(n * f)));
      const mn = Number(pr.min); if (mn > 0) nr.min = String(Math.max(1, Math.round(mn * f)));   // corsa continua (mezzofondo)
    }
    else { const p = parseFloat(String(pr.perc).replace(",", ".")); if (p > 0) nr.perc = String(Math.min(100, Math.round((p + pct) * 10) / 10)); } // additiva: 85 + 2.5 = 87.5
    return nr;
  });
  if (curVuota) cur.nota = prev.nota || "";
  savePista(); disegna();
}
// scarico: dimezza il volume (ripetute) della settimana precedente, intensità invariata
function applicaScaricoPista(s) {
  if (s < 1) return;
  const g = giornoCorrente(), prev = g.settimane[s - 1], cur = g.settimane[s];
  if (!prev || !(prev.righe || []).some(r => r.n || r.min)) { alert("Compila prima la settimana precedente."); return; }
  cur.righe = prev.righe.map(r => {
    const nr = { ...r };
    const n = Number(r.n); if (n > 0) nr.n = String(Math.max(1, Math.round(n / 2)));
    const mn = Number(r.min); if (mn > 0) nr.min = String(Math.max(1, Math.round(mn / 2)));   // corsa continua (mezzofondo)
    return nr;
  });
  cur.nota = prev.nota || "";
  savePista(); disegna();
}

// ---------- nota tecnica del giorno (coach -> atleta) ----------
function apriNotaSeduta(s) {
  const sett = giornoCorrente().settimane[s];
  mostraFoglio(`
    <div class="foglio-top"><h3>Nota tecnica · Settimana ${s + 1}</h3>
      <button class="chiudi" onclick="chiudiNotaSeduta()" aria-label="Chiudi">✕</button></div>
    <p class="et" style="margin-bottom:8px">Spiega all'atleta cosa curare in questa seduta: la vedrà nel suo allenamento.</p>
    <textarea rows="5" placeholder="Es. cura l'uscita dai blocchi, spinta bassa nei primi 20 m..." oninput="setNotaSeduta(${s},this.value)">${(sett.nota || "").replace(/</g, "&lt;")}</textarea>`);
}
function setNotaSeduta(s, v) { giornoCorrente().settimane[s].nota = v; savePista(); }
function chiudiNotaSeduta() { chiudiScheda(); disegna(); }
function mesoVuoto() { return { ciclo: "", blocco: "", inizio: "", focus: "", giorni: [giornoVuoto(), giornoVuoto(), giornoVuoto(), giornoVuoto()] }; }

// TAPPA: programma madre PER DISCIPLINA. DEMO.pista è una mappa { vel:{...}, lanci:{...}, mezzo:{...} }.
function _emptyPista() { return { profilo: "", pbManuale: "", atletaRif: "", mesocicli: [mesoVuoto()] }; }
function pistaDi(g) {
  // migra il vecchio formato singolo (con .mesocicli) → { vel: <vecchio>, lanci:{}, mezzo:{} }
  if (!DEMO.pista || DEMO.pista.mesocicli) {
    const old = (DEMO.pista && DEMO.pista.mesocicli) ? DEMO.pista : null;
    DEMO.pista = { vel: old || _emptyPista(), lanci: _emptyPista(), mezzo: _emptyPista() };
  }
  if (!DEMO.pista[g]) DEMO.pista[g] = _emptyPista();
  return DEMO.pista[g];
}
function pistaInit() { return pistaDi(S.progGruppo || "vel"); }
function savePista() { if (typeof _invalidaSeduteGen === "function") _invalidaSeduteGen(); if (typeof salvaCustom === "function") salvaCustom(); }

// PB di riferimento: dall'atleta scelto (in base al profilo) oppure scritto a mano.
function pistaPB() {
  const p = pistaInit();
  if (p.atletaRif) {
    const a = DEMO.atleti.find(x => x.id === p.atletaRif);
    if (a && a.scheda) {
      const md = p.profilo.indexOf("400") === 0 ? "400 m" : p.profilo.indexOf("200") === 0 ? "200 m" : "100 m";
      const row = (a.scheda.pb || []).find(r => r[0] === md);
      if (row && row[1]) return parseFloat(String(row[1]).replace(",", "."));
    }
  }
  const v = parseFloat(String(p.pbManuale).replace(",", "."));
  return isNaN(v) ? null : v;
}

function pistaTempo(distanza, perc) {
  const p = pistaInit(), pb = pistaPB();
  if (!p.profilo || !pb || !distanza || !perc) return null;
  const co = PISTA_COEFF[p.profilo]; if (!co) return null;
  const coeff = co[Number(distanza)]; if (coeff == null) return null;
  const pc = parseFloat(String(perc).replace(",", ".")); if (!(pc > 0)) return null;
  return pb * coeff / (pc / 100);
}

// --- PER ATLETA: il tempo target si calcola sul PB del singolo atleta ---
// PB dell'atleta ESATTAMENTE su una distanza (numero → "60 m"). Prende il MIGLIORE se ce n'è più d'uno.
function pbAtletaDist(atleta, distanza) {
  if (!atleta || !atleta.scheda) return null;
  const label = distanza + " m";
  const tempi = (atleta.scheda.pb || [])
    .filter(r => r[0] === label && r[1] != null && r[1] !== "")
    .map(r => parseFloat(String(r[1]).replace(",", ".")))
    .filter(v => !isNaN(v));
  return tempi.length ? Math.min(...tempi) : null;
}
// tempo "al 100%" dell'atleta sulla distanza D: PB esatto se c'è, altrimenti stima dalla distanza-ancora
// (D<=60 → dai 60 m; D>60 → dai 100 m; fallback al PB di riferimento del profilo), ri-scalando con la curva.
function baseAtletaDist(atleta, D, profilo) {
  const diretto = pbAtletaDist(atleta, D);
  if (diretto != null) return diretto;                 // PB reale su quella distanza
  if (profilo == null) profilo = pistaInit().profilo;  // fallback (editor); in generazione arriva dal programma del gruppo
  const co = profilo ? PISTA_COEFF[profilo] : null;
  if (!co || co[D] == null) return null;
  const refDist = profilo.indexOf("400") === 0 ? 400 : profilo.indexOf("200") === 0 ? 200 : 100;
  const ancore = (D <= 60 ? [60, 100, refDist] : [100, refDist, 60]).filter((v, i, a) => a.indexOf(v) === i);
  for (const anc of ancore) {
    const pbAnc = pbAtletaDist(atleta, anc);
    if (pbAnc != null && co[anc] != null) return pbAnc * co[D] / co[anc];   // ri-scalatura sulla curva
  }
  return null;
}
function pistaTempoAtleta(atleta, distanza, perc, profilo) {
  const D = Number(distanza);
  if (!atleta || !D || !perc) return null;
  const base = baseAtletaDist(atleta, D, profilo);
  if (base == null) return null;
  const pc = parseFloat(String(perc).replace(",", ".")); if (!(pc > 0)) return null;
  return base / (pc / 100);   // % di velocità: 95% → tempo = base / 0.95
}
function volumeSett(sett) {
  return (sett.righe || []).reduce((t, r) => t + (Number(r.distanza) || 0) * (Number(r.n) || 0), 0);
}

// ---------- handlers ----------
function setPistaTop(campo, val) {
  const p = pistaInit(); p[campo] = val;
  if (campo === "atletaRif" && val) p.pbManuale = "";
  savePista(); disegna();
}
function setPistaMeso(campo, val) { pistaInit().mesocicli[S.pistaMeso][campo] = val; savePista(); disegna(); }
function setPistaGiorno(campo, val) { pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno][campo] = val; savePista(); disegna(); }
function setPistaRiga(s, i, campo, val) { pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno].settimane[s].righe[i][campo] = val; savePista(); disegna(); }
// versioni "solo stato" (niente disegna): per gli <input> di testo, così non si perde il focus mentre si scrive
function setPistaTopVal(campo, val) { const p = pistaInit(); p[campo] = val; savePista(); }
function setPistaMesoVal(campo, val) { pistaInit().mesocicli[S.pistaMeso][campo] = val; savePista(); }
function setPistaRigaVal(s, i, campo, val) { pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno].settimane[s].righe[i][campo] = val; savePista(); }
function pistaAddRiga(s) { pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno].settimane[s].righe.push(rigaVuota()); savePista(); disegna(); }
function pistaDelRiga(s, i) { const r = pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno].settimane[s].righe; if (r.length > 1) r.splice(i, 1); savePista(); disegna(); }
function pistaAddMeso() { pistaInit().mesocicli.push(mesoVuoto()); S.pistaMeso = pistaInit().mesocicli.length - 1; S.pistaGiorno = 0; savePista(); disegna(); window.scrollTo(0, 0); }
function selMeso(i) { S.pistaMeso = i; S.pistaGiorno = 0; disegna(); window.scrollTo(0, 0); }
function selGiorno(i) { S.pistaGiorno = i; disegna(); window.scrollTo(0, 0); }

// ---------- vista ----------
function vistaProgrammaPista() {
  // il gruppo Mezzofondo/Fondo ha un editor dedicato (mezzi, ritmi/km, corsa continua)
  if ((S.progGruppo || "vel") === "mezzo" && typeof vistaProgrammaPistaMezzo === "function") return vistaProgrammaPistaMezzo();
  if ((S.progGruppo || "vel") === "lanci" && typeof vistaProgrammaPistaLanci === "function") return vistaProgrammaPistaLanci();
  const p = pistaInit();
  if (S.pistaMeso >= p.mesocicli.length) S.pistaMeso = 0;
  const m = p.mesocicli[S.pistaMeso];
  const g = m.giorni[S.pistaGiorno];
  const pb = pistaPB();
  const distOpt = p.profilo ? Object.keys(PISTA_COEFF[p.profilo]).map(Number).sort((a, b) => a - b) : [];
  const routineOpt = Object.keys(DEMO.schede || {});
  const optSel = (val, arr, mostraVuoto) => `${mostraVuoto ? '<option value="">—</option>' : ""}${arr.map(x => `<option value="${String(x).replace(/"/g, "&quot;")}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`).join("")}`;

  // header profilo + PB
  const testa = `
    <div class="card"><h3>Programma Pista</h3>
      <p class="et" style="margin-top:2px">Scrivi contenuto, distanza, n°, recupero e % velocità: il <b>tempo richiesto</b> e la <b>m/s</b> escono da soli dal PB. Il volume è automatico.</p>
      <p class="et" style="margin-top:8px;color:var(--verde)">✓ Si salva da solo, non serve confermare. Gli atleti lo vedono subito sul loro calendario.</p></div>
    <div class="card">
      <div class="griglia2">
        <div><label class="lab">Profilo velocità</label>
          <select onchange="setPistaTop('profilo',this.value)" style="margin-top:6px">
            <option value="">—</option>${optSel(p.profilo, PISTA_PROFILI, false)}</select></div>
        <div><label class="lab">Riferimento tempi</label>
          <select onchange="setPistaTop('atletaRif',this.value)" style="margin-top:6px">
            <option value="">🎯 Programma madre (PB a mano)</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${p.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select></div>
      </div>
      <div style="margin-top:10px">
        <label class="lab">PB di riferimento (s) ${p.atletaRif ? "<span style='color:var(--txt3)'>(dall'atleta)</span>" : ""}</label>
        <input inputmode="decimal" value="${p.atletaRif ? (pb != null ? pb : "") : (p.pbManuale || "")}" ${p.atletaRif ? "disabled" : ""}
          placeholder="es. 10.90" oninput="setPistaTopVal('pbManuale',this.value)" onchange="disegna()" style="margin-top:6px">
      </div>
      <p class="et" style="margin-top:8px">${p.profilo ? (pb != null ? `Tempi target calcolati sul PB ${pb} s.` : "Manca il PB: scrivilo o scegli un atleta.") : "Scegli il profilo velocità per calcolare i tempi."}</p>
    </div>`;

  // selettore mesociclo
  const tabMeso = `<div class="tabbar">${p.mesocicli.map((_, i) =>
    `<button class="${i === S.pistaMeso ? "on" : ""}" onclick="selMeso(${i})">Meso ${i + 1}</button>`).join("")}
    <button onclick="pistaAddMeso()">＋</button></div>`;

  const cicli = pistaCicliPiano();
  const nSett = nSettimaneMeso(m);
  const testaMeso = `<div class="card">
      <label class="lab">Mesociclo dal Piano &amp; Picco</label>
      <select onchange="setPistaMesoDaPiano(this.value)" style="margin-top:6px">
        <option value="">— scegli (o imposta a mano) —</option>
        ${cicli.map((c, i) => `<option value="${i}">Ciclo ${c.ciclo} · ${c.nWeeks} sett · dal ${c.data.getDate()} ${MESI_IT[c.data.getMonth()]}</option>`).join("")}
      </select>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Ciclo (carico+scarico)</label>
          <select onchange="setPistaMeso('ciclo',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.ciclo, (typeof CICLI !== "undefined" ? CICLI : []), false)}</select></div>
        <div><label class="lab">Inizio Sett. 1</label>
          <input type="date" value="${m.inizio || ""}" onchange="setPistaMeso('inizio',this.value)" style="margin-top:6px"></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Blocco</label>
          <select onchange="setPistaMeso('blocco',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.blocco, (typeof BLOCCHI !== "undefined" ? BLOCCHI : []), false)}</select></div>
        <div><label class="lab">Focus mesociclo</label>
          <input value="${(m.focus || "").replace(/"/g, "&quot;")}" placeholder="Es. accelerazione" oninput="setPistaMesoVal('focus',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      </div>
      <p class="et" style="margin-top:10px">${m.ciclo ? `<b style="color:var(--txt)">${nSett} settimane</b> (ciclo ${m.ciclo}) · l'ultima è di scarico` : "Scegli un ciclo (o prendilo dal Piano & Picco) per sapere quante settimane sono e quale è lo scarico."}</p>
    </div>`;

  // selettore giorno
  const tabGiorno = `<div class="tabbar">${m.giorni.map((_, i) =>
    `<button class="${i === S.pistaGiorno ? "on" : ""}" onclick="selGiorno(${i})">Giorno ${i + 1}</button>`).join("")}</div>`;

  const testaGiorno = `<div class="card">
      <label class="lab">Giorno della settimana</label>
      <select onchange="setPistaGiorno('giornoSett',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(g.giornoSett, ["lun", "mar", "mer", "gio", "ven", "sab", "dom"], false)}</select>
      <label class="lab" style="display:block;margin-top:12px">Riscaldamento</label>
      <button class="btn btn-2" style="margin-top:6px;text-align:left" onclick="apriRiscPista()">${riscRiassunto(g)}</button>
      <label class="lab" style="display:block;margin-top:12px">Pliometria / policoncorrenza</label>
      <button class="btn btn-2" style="margin-top:6px;text-align:left" onclick="apriPlio()">${plioRiassunto(g)}</button>
    </div>`;

  // le settimane del giorno (numero dal ciclo del mesociclo)
  const listaSett = settimaneDelGiorno(m, g);
  const copiaBtn = listaSett.length > 1
    ? `<button class="btn btn-2" style="margin-bottom:11px" onclick="pistaCopiaSettimana()">⧉ Copia settimana 1 sulle altre${m.ciclo && m.ciclo !== "1" ? " (scarico −50% auto)" : ""}</button>`
    : "";
  const settimane = listaSett.map((sett, s) => {
    const scar = isScaricoIdx(m, s);
    const nota = (sett.nota || "").trim();
    const righe = sett.righe.map((r, i) => {
      const t = pistaTempo(r.distanza, r.perc);
      const ms = t && r.distanza ? (Number(r.distanza) / t) : null;
      return `<tr>
        <td><input value="${(r.contenuto || "").replace(/"/g, "&quot;")}" placeholder="lavoro" oninput="setPistaRigaVal(${s},${i},'contenuto',this.value)" style="min-width:120px"></td>
        <td><select onchange="setPistaRiga(${s},${i},'distanza',this.value)"><option value="">—</option>${optSel(r.distanza, distOpt, false)}</select></td>
        <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setPistaRigaVal(${s},${i},'n',this.value)" onchange="disegna()" style="min-width:52px"></td>
        <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setPistaRigaVal(${s},${i},'rec',this.value)" style="min-width:66px"></td>
        <td><input inputmode="decimal" value="${r.perc || ""}" placeholder="%" oninput="setPistaRigaVal(${s},${i},'perc',this.value)" onchange="disegna()" style="min-width:52px"></td>
        <td class="pauto">${t != null ? t.toFixed(2) : "—"}</td>
        <td class="pauto">${ms != null ? ms.toFixed(2) : "—"}</td>
        <td><button class="chiudi" style="font-size:14px" onclick="pistaDelRiga(${s},${i})" aria-label="Rimuovi">✕</button></td>
      </tr>`;
    }).join("");
    return `<div class="card"${scar ? ' style="border-color:rgba(240,168,60,.45)"' : ""}>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <p style="font-weight:600;font-size:13px;margin:0">Settimana ${s + 1}</p>
        ${scar ? '<span class="pill p-giallo">scarico</span>' : ""}
      </div>
      <div class="p-scroll"><table class="ptab pista-w">
        <thead><tr><th>Contenuto</th><th>Distanza</th><th>n°</th><th>Rec</th><th>% vel</th><th>Tempo (s)</th><th>m/s</th><th></th></tr></thead>
        <tbody>${righe}</tbody>
      </table></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="pistaAddRiga(${s})">＋ riga</button>
        <span class="et">Volume: <b style="color:var(--verde);font-size:14px">${volumeSett(sett).toLocaleString("it-IT")} m</b></span>
      </div>
      ${s > 0 && !scar ? `<div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <span class="et" style="margin:0">↑ da sett. ${s}:</span>
        <select id="pgt-${s}" onchange="progSwitch('pgt-${s}','pgp-${s}')" style="padding:7px 8px;width:auto;flex:none"><option value="volume">Volume</option><option value="intensita">Intensità</option></select>
        <select id="pgp-${s}" style="padding:7px 8px;width:auto;flex:none">${PROG_VOL.map(o => `<option>${o}</option>`).join("")}</select>
        <button class="btn btn-2" style="width:auto;padding:7px 12px" onclick="applicaProgrPista(${s})">+% applica</button>
      </div>` : ""}
      ${s > 0 && scar ? `<button class="btn btn-2" style="margin-top:8px" onclick="applicaScaricoPista(${s})">⬇ Scarico: volume al 50% della sett. ${s}</button>` : ""}
      <button class="btn btn-2" style="margin-top:8px;text-align:left;font-size:13px" onclick="apriNotaSeduta(${s})">📝 ${nota ? "Nota: " + (nota.length > 42 ? nota.slice(0, 42) + "…" : nota) : "Nota tecnica del giorno"}</button>
    </div>`;
  }).join("");

  return (typeof selettoreProgGruppo === "function" ? selettoreProgGruppo() : "") + testa + tabMeso + testaMeso + tabGiorno + testaGiorno + copiaBtn + settimane;
}
