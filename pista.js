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
  const p = DEMO.piano;
  if (!p || !p.inizio || !p.righe || typeof AD_CICLO === "undefined") return [];
  const inizio = new Date(p.inizio + "T00:00:00");
  const res = [];
  let AD = 4, AE = null, label = "";
  for (let i = 0; i < p.nSettimane; i++) {
    const w = p.righe[i] || {};
    if (w.ciclo) { AD = AD_CICLO[w.ciclo] || 4; AE = 0; label = w.ciclo; }
    else { AE = (AE === null ? 0 : (AE + 1) % AD); }
    if (AE === 0) res.push({ startIdx: i, ciclo: label || cicloDaLen(AD), data: new Date(inizio.getTime() + i * 7 * 86400000), blocco: w.blocco || "" });
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
    if (isScaricoIdx(m, s)) righe.forEach(r => { if (r.n) r.n = Math.max(1, Math.round(Number(r.n) / 2)); });
    g.settimane[s].righe = righe;
    g.settimane[s].nota = src.nota || "";
  }
  savePista(); disegna();
}

// progressione: copia la settimana precedente aumentando Volume (ripetute) o Intensità (% vel) di pct%
function applicaProgrPista(s) {
  if (s < 1) return;
  const tSel = document.getElementById("pgt-" + s), pSel = document.getElementById("pgp-" + s);
  const tipo = tSel ? tSel.value : "volume", pct = parseFloat(pSel ? pSel.value : "5");
  const g = giornoCorrente(), prev = g.settimane[s - 1], cur = g.settimane[s];
  if (!prev || !(prev.righe || []).some(r => r.n || r.perc)) { alert("Compila prima la settimana precedente."); return; }
  const f = 1 + pct / 100;
  cur.righe = prev.righe.map(r => {
    const nr = { ...r };
    if (tipo === "volume") { const n = Number(r.n); if (n > 0) nr.n = String(Math.max(1, Math.round(n * f))); }
    else { const p = Number(r.perc); if (p > 0) nr.perc = String(Math.min(100, Math.round(p * f * 10) / 10)); }
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

function pistaInit() {
  if (!DEMO.pista || !DEMO.pista.mesocicli) DEMO.pista = { profilo: "", pbManuale: "", atletaRif: "", mesocicli: [mesoVuoto()] };
  return DEMO.pista;
}
function savePista() { if (typeof salvaCustom === "function") salvaCustom(); }

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
  return pb * coeff / (Number(perc) / 100);
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
      <p class="et" style="margin-top:2px">Scrivi contenuto, distanza, n°, recupero e % velocità: il <b>tempo richiesto</b> e la <b>m/s</b> escono da soli dal PB. Il volume è automatico.</p></div>
    <div class="card">
      <div class="griglia2">
        <div><label class="lab">Profilo velocità</label>
          <select onchange="setPistaTop('profilo',this.value)" style="margin-top:6px">
            <option value="">—</option>${optSel(p.profilo, PISTA_PROFILI, false)}</select></div>
        <div><label class="lab">Atleta di riferimento</label>
          <select onchange="setPistaTop('atletaRif',this.value)" style="margin-top:6px">
            <option value="">— (PB a mano)</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${p.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select></div>
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
        <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setPistaRigaVal(${s},${i},'perc',this.value)" onchange="disegna()" style="min-width:52px"></td>
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
      ${s > 0 ? `<div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <span class="et" style="margin:0">↑ da sett. ${s}:</span>
        <select id="pgt-${s}" style="padding:7px 8px;width:auto;flex:none"><option value="volume">Volume</option><option value="intensita">Intensità</option></select>
        <select id="pgp-${s}" style="padding:7px 8px;width:auto;flex:none"><option>2.5</option><option>5</option><option>7.5</option><option>10</option></select>
        <button class="btn btn-2" style="width:auto;padding:7px 12px" onclick="applicaProgrPista(${s})">+% applica</button>
      </div>` : ""}
      <button class="btn btn-2" style="margin-top:8px;text-align:left;font-size:13px" onclick="apriNotaSeduta(${s})">📝 ${nota ? "Nota: " + (nota.length > 42 ? nota.slice(0, 42) + "…" : nota) : "Nota tecnica del giorno"}</button>
    </div>`;
  }).join("");

  return testa + tabMeso + testaMeso + tabGiorno + testaGiorno + copiaBtn + settimane;
}
