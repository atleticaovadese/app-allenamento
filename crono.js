// ============================================================================
//  CRONOMETRO DAL VIVO (allenatore) — Parte 1: lo strumento
//  Un crono "grande" fa partire TUTTI gli atleti presenti sulla stessa ripetuta;
//  ogni atleta ha la sua riga con Stop individuale → registra il tempo e parte il
//  recupero. I recuperi/tempi degli altri continuano indipendenti. Ripremendo il
//  crono grande tutti ripartono sincronizzati (ripetuta successiva).
//  I tempi si salvano a fine allenamento (Parte 2) sulla giornata dell'atleta.
// ============================================================================

function _clEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
function _clFmt(ms) {            // m:ss.d (decimi) per i tempi che corrono
  if (!(ms > 0)) ms = 0;
  const dec = Math.floor(ms / 100) % 10, t = Math.floor(ms / 1000), s = t % 60, m = Math.floor(t / 60);
  return m + ":" + String(s).padStart(2, "0") + "." + dec;
}
function _clFmtRec(ms) {         // m:ss per il recupero
  if (!(ms > 0)) ms = 0;
  const t = Math.floor(ms / 1000), s = t % 60, m = Math.floor(t / 60);
  return m + ":" + String(s).padStart(2, "0");
}
function _clIniz(n) { return (String(n || "").trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("") || "?").toUpperCase(); }
// lavoro di OGGI del singolo atleta (dal suo programma): etichetta breve + distanza del blocco a ripetute.
// Serve a mostrare chi fa un lavoro diverso E a far finire i tempi sull'elemento giusto della sua seduta.
function _clTargetAtleta(a, oggi) {
  try {
    const sd = (typeof seduteDelGiorno === "function") ? (seduteDelGiorno(oggi, false, a) || []) : [];
    const s = sd.find(x => x.tipo === "pista"); if (!s) return { label: "", distanza: 0 };
    const parts = []; let dist = 0;
    for (const e of (s.elementi || [])) {
      if (e.bici) parts.push("🚴 bici");
      else if (e.fk) parts.push("fartlek");
      else if (e.seg) parts.push("segment");
      else if (Number(e.distanza) > 0 && Number(e.ripetute) > 0) { parts.push(e.ripetute + "×" + e.distanza + "m"); if (!dist) dist = Number(e.distanza); }
      else if (Number(e.min) > 0) parts.push(e.min + "′");
      else if ((e.contenuto || "").trim()) parts.push(e.contenuto.trim());
      if (parts.length >= 2) break;
    }
    return { label: parts.join(" · "), distanza: dist };
  } catch (e) { return { label: "", distanza: 0 }; }
}

// ---- avvio dalla schermata "Oggi" ----
function avviaCronoLive() {
  const g = (typeof S !== "undefined" && S.gruppo) ? S.gruppo : "vel";
  if (g === "online") { alert("Il cronometro dal vivo è per gli allenamenti di gruppo in pista/campo, non per gli atleti online."); return; }
  const oggi = (typeof oggiISO === "function") ? oggiISO() : new Date().toISOString().slice(0, 10);
  const lista = ((typeof atletiDelGruppo === "function") ? atletiDelGruppo(g) : (DEMO.atleti || [])).filter(a => a && !a.bloccato);
  if (!lista.length) { alert("Nessun atleta in questo gruppo."); return; }
  // opzioni di lavoro dal programma madre di oggi (pista)
  const madre = (typeof _madreRigheOggi === "function") ? _madreRigheOggi(g, "pista", oggi) : null;
  const righe = (madre && madre.righe) || [];
  const opzioni = righe.map(r => ({
    label: (typeof _txtRigaProg === "function") ? _txtRigaProg(r, g, "pista") : (r.contenuto || ""),
    distanza: Number(r.distanza) || 0, nrip: Number(r.n) || 0
  })).filter(x => (x.label || "").trim());
  // presenti di default: chi ha una seduta programmata oggi (altrimenti tutti)
  const presenti = {};
  lista.forEach(a => { let has = false; try { has = ((typeof seduteDelGiorno === "function") ? (seduteDelGiorno(oggi, false, a) || []) : []).length > 0; } catch (e) { } if (has) presenti[a.id] = true; });
  if (!Object.keys(presenti).length) lista.forEach(a => { presenti[a.id] = true; });
  const atl = {}, lavoroAtl = {}, distAtl = {};
  lista.forEach(a => { atl[a.id] = { running: false, runStart: null, recStart: null, tempi: [] }; const tg = _clTargetAtleta(a, oggi); lavoroAtl[a.id] = tg.label; distAtl[a.id] = tg.distanza; });
  // scelta di default: la prima riga con distanza (il "corpo" di ripetute), altrimenti la prima
  let sel = opzioni.findIndex(o => o.distanza > 0); if (sel < 0) sel = opzioni.length ? 0 : -1;
  S.cronoLive = { gruppo: g, data: oggi, lista: lista.map(a => a.id), opzioni, sel, custom: "", presenti, lavoroAtl, distAtl, modo: null, repStart: null, nRep: 0, atl, setup: true };
  disegna(); window.scrollTo(0, 0);
}
function chiudiCronoLive() {
  _clStopTick();
  const fatti = _clQualcosaFatto();
  if (fatti && typeof confirm === "function" && !confirm("Uscire dal cronometro? I tempi non ancora salvati andranno persi.")) { _clStartTick(); return; }
  S.cronoLive = null; disegna(); window.scrollTo(0, 0);
}
function _clQualcosaFatto() {
  const C = S.cronoLive; if (!C) return false;
  if (C.repStart != null) return true;
  if (C.serie && ((C.serie.passaggi || []).length || C.serie.nRep)) return true;
  return Object.keys(C.atl || {}).some(id => (C.atl[id].tempi || []).length);
}

// ---- tick: aggiorna i tempi a schermo senza ridisegnare tutto ----
function _clStartTick() { if (!S._clHandle) S._clHandle = setInterval(_clTick, 120); }
function _clStopTick() { if (S._clHandle) { clearInterval(S._clHandle); S._clHandle = null; } }
function _clTick() {
  const C = S.cronoLive;
  if (!C) { _clStopTick(); return; }
  const now = Date.now();
  const big = document.getElementById("cl-big");
  if (C.modo === "serie") {
    const se = C.serie || {};
    if (big) big.textContent = se.start ? _clFmt(now - se.start) : "0:00.0";
    const sr = document.getElementById("cl-serie-rec");
    if (sr) sr.textContent = se.recStart ? ("rec dal 1°: " + _clFmtRec(now - se.recStart)) : "";
    return;
  }
  if (big) big.textContent = C.repStart ? _clFmt(now - C.repStart) : "0:00.0";
  (C.lista || []).forEach(id => {
    if (!C.presenti[id]) return;
    const st = C.atl[id]; if (!st) return;
    const te = document.getElementById("cl-t-" + id);
    const re = document.getElementById("cl-r-" + id);
    if (st.running && st.runStart) { if (te) te.textContent = _clFmt(now - st.runStart); if (re) re.textContent = ""; }
    else {
      const ultimo = st.tempi.length ? st.tempi[st.tempi.length - 1] : null;
      if (te) te.textContent = ultimo != null ? _clFmt(ultimo * 1000) : "–";
      if (re) re.textContent = st.recStart ? ("rec " + _clFmtRec(now - st.recStart)) : "";
    }
  });
}

// ---- azioni ----
function cronoGo() {               // crono grande: parte/riparte TUTTI i presenti sulla stessa ripetuta
  const C = S.cronoLive; if (!C) return;
  const now = Date.now();
  C.repStart = now; C.nRep = (C.nRep || 0) + 1; C.setup = false;
  (C.lista || []).forEach(id => { if (C.presenti[id]) { const st = C.atl[id]; st.running = true; st.runStart = now; st.recStart = null; } });
  disegna();
}
// crono del SINGOLO atleta: fa (ri)partire solo il suo tempo, indipendente dagli altri
function cronoViaUno(id) {
  const C = S.cronoLive; if (!C) return;
  const st = C.atl[id]; if (!st) return;
  C.presenti[id] = true; C.setup = false;
  st.running = true; st.runStart = Date.now(); st.recStart = null;
  if (C.repStart == null) C.repStart = st.runStart;   // così il crono grande mostra comunque qualcosa
  disegna();
}
function cronoStop(id) {            // stop del singolo atleta: registra il tempo (dal SUO start) e parte il recupero
  const C = S.cronoLive; if (!C) return;
  const st = C.atl[id]; if (!st || !st.running || !st.runStart) return;
  const t = Math.round((Date.now() - st.runStart) / 10) / 100;   // secondi, 2 decimali
  st.tempi.push(t); st.running = false; st.recStart = Date.now();
  disegna();
}
function cronoAnnullaUltimo(id) {   // togli l'ultimo tempo registrato (mistap)
  const C = S.cronoLive; if (!C) return;
  const st = C.atl[id]; if (!st || !st.tempi.length) return;
  st.tempi.pop(); st.recStart = null;
  disegna();
}
function cronoTogglePresente(id) {
  const C = S.cronoLive; if (!C) return;
  if (C.presenti[id]) delete C.presenti[id]; else C.presenti[id] = true;
  disegna();
}
function cronoSetLavoro(v) {
  const C = S.cronoLive; if (!C) return;
  const n = Number(v);
  if (v === "custom") { C.sel = -1; } else { C.sel = n; }
  disegna();
}
function cronoSetCustom(v) { const C = S.cronoLive; if (C) C.custom = v; }
function _clLavoroLabel() {
  const C = S.cronoLive; if (!C) return "";
  if (C.sel >= 0 && C.opzioni[C.sel]) return C.opzioni[C.sel].label;
  return (C.custom || "").trim() || "Allenamento";
}
function cronoToggleSetup() { const C = S.cronoLive; if (C) { C.setup = !C.setup; disegna(); } }

// ====================== MODO "DA SERIE / BATTERIA" ======================
function cronoScegliModo(modo) {
  const C = S.cronoLive; if (!C) return;
  C.modo = modo;
  if (modo === "serie") {
    const pres = (C.lista || []).filter(id => C.presenti[id]);
    C.batt = {}; pres.forEach((id, i) => { C.batt[id] = Math.floor(i / 10) + 1; });   // batterie da max 10
    C.battAttiva = 1;
    C.serie = { start: null, nRep: 0, passaggi: [], recStart: null, ordine: [] };
    C.setup = true;
  }
  disegna(); window.scrollTo(0, 0);
}
function _clVistaScegliModo(C) {
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const dataLbl = (typeof dataLunga === "function") ? cap(dataLunga(C.data)) : C.data;
  const gruppoNome = (typeof nomeGruppo === "function") ? nomeGruppo(C.gruppo) : "";
  return `<button class="indietro" onclick="chiudiCronoLive()">‹ Esci dal cronometro</button>
    <div class="card" style="background:var(--blu);color:#fff;border:0"><h3 style="color:#fff;margin:0">⏱ Allenamento dal vivo</h3><p class="et" style="color:#fff;opacity:.9;margin-top:3px">${gruppoNome} · ${dataLbl}</p></div>
    <div class="card"><p class="et" style="margin:0 0 10px">Che tipo di cronometro vuoi usare?</p>
      <button class="cl-go" style="background:linear-gradient(135deg,#2f6fd6,#4d8df0)" onclick="cronoScegliModo('ripetuta')">🔂 Da ripetuta<br><span style="font-size:12.5px;font-weight:600;opacity:.92">ogni atleta ha la sua riga e il suo STOP · parte col crono grande</span></button>
      <button class="cl-go" style="margin-top:11px;background:linear-gradient(135deg,#2f8f4e,#7bc043)" onclick="cronoScegliModo('serie')">🏁 Da serie / batteria<br><span style="font-size:12.5px;font-weight:600;opacity:.92">partono insieme (max 10): segni i passaggi con un tasto, poi assegni l'ordine d'arrivo</span></button>
    </div>`;
}
function _clSerie() { const C = S.cronoLive; if (!C) return null; C.serie = C.serie || { start: null, nRep: 0, passaggi: [], recStart: null, ordine: [] }; return C.serie; }
function cronoSetBatt(id, n) { const C = S.cronoLive; if (!C) return; C.batt = C.batt || {}; C.batt[id] = Number(n) || 1; disegna(); }
function cronoBattAttiva(n) { const C = S.cronoLive; if (!C) return; const se = _clSerie(); se.start = null; se.passaggi = []; se.recStart = null; se.ordine = []; C.battAttiva = Number(n) || 1; disegna(); }
function cronoSerieVia() { const C = S.cronoLive; if (!C) return; const se = _clSerie(); se.start = Date.now(); se.nRep = (se.nRep || 0) + 1; se.passaggi = []; se.recStart = null; C.setup = false; disegna(); }
function cronoSeriePassaggio() {
  const C = S.cronoLive; if (!C) return; const se = _clSerie(); if (se.start == null) return;
  const heat = (C.lista || []).filter(id => C.presenti[id] && (C.batt[id] || 1) === C.battAttiva);
  if (se.passaggi.length >= heat.length && heat.length) return;   // presi tutti
  se.passaggi.push(Math.round((Date.now() - se.start) / 10) / 100);
  if (se.recStart == null) se.recStart = Date.now();   // recupero dal 1° arrivato
  disegna();
}
function cronoSeriePassaggioUndo() { const C = S.cronoLive; if (!C) return; const se = _clSerie(); if (!se.passaggi.length) return; se.passaggi.pop(); if (!se.passaggi.length) se.recStart = null; disegna(); }
function cronoSerieSetOrdine(pos, aid) { const C = S.cronoLive; if (!C) return; const se = _clSerie(); se.ordine[pos] = aid || null; disegna(); }
function cronoSerieConferma() {
  const C = S.cronoLive; if (!C) return; const se = _clSerie();
  if (!se.passaggi.length) { alert("Non hai ancora segnato nessun passaggio."); return; }
  const senzaAtl = se.passaggi.some((_, i) => !se.ordine[i]);
  if (senzaAtl && typeof confirm === "function" && !confirm("Alcuni tempi non hanno un atleta assegnato e verranno ignorati. Confermo lo stesso?")) return;
  se.passaggi.forEach((t, i) => { const aid = se.ordine[i]; if (aid && C.atl[aid]) C.atl[aid].tempi.push(t); });
  se.start = null; se.passaggi = []; se.recStart = null;   // pronta per la prossima serie (l'ordine resta come default)
  disegna(); window.scrollTo(0, 0);
}
function _clVistaSerie(C) {
  const esc = _clEsc;
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const dataLbl = (typeof dataLunga === "function") ? cap(dataLunga(C.data)) : C.data;
  const nomeDi = id => { const a = (DEMO.atleti || []).find(x => x.id === id); return a ? a.nome : "?"; };
  const gruppoNome = (typeof nomeGruppo === "function") ? nomeGruppo(C.gruppo) : "";
  const se = _clSerie();
  const pres = (C.lista || []).filter(id => C.presenti[id]);
  const nBatt = pres.length ? Math.max(1, ...pres.map(id => C.batt[id] || 1)) : 1;
  const heat = pres.filter(id => (C.batt[id] || 1) === C.battAttiva);
  const opt = C.opzioni.map((o, i) => `<option value="${i}" ${C.sel === i ? "selected" : ""}>${esc(o.label)}</option>`).join("");

  const setup = C.setup ? `<div class="card">
      <label class="lab">Lavoro del gruppo</label>
      <select onchange="cronoSetLavoro(this.value)" style="margin-top:6px">${opt}<option value="custom" ${C.sel < 0 ? "selected" : ""}>✎ scrivilo a mano…</option></select>
      ${C.sel < 0 ? `<input value="${esc(C.custom)}" placeholder="es. 5 × 200 m" oninput="cronoSetCustom(this.value)" onchange="disegna()" style="margin-top:8px">` : ""}
      <label class="lab" style="display:block;margin-top:14px">Batterie (max 10 per batteria) — tocca il numero per spostare</label>
      ${pres.map(id => `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">
          <span>${esc(nomeDi(id))}</span>
          <div class="cl-batt-sel">${Array.from({ length: nBatt + 1 }, (_, b) => b + 1).map(b => `<button class="cl-bchip ${(C.batt[id] || 1) === b ? "on" : ""}" onclick="cronoSetBatt('${id}',${b})">${b}</button>`).join("")}</div>
        </div>`).join("")}
      <p class="et" style="margin-top:8px;color:var(--txt3)">Ogni batteria parte per conto suo. Dopo il «Via!» <b>tutta l'area verde del cronometro è un tasto</b>: tocchi <b>ovunque lì</b> a ogni arrivo (comodo e veloce). Poi assegni l'ordine d'arrivo.</p>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
        <label class="lab">🎮 Telecomando Bluetooth (facoltativo, a mani libere)</label>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:7px">
          ${S.cronoLearn
      ? `<span class="cl-chip on" style="cursor:default">⏺ Premi ora un tasto sul telecomando…</span>`
      : `<button class="btn btn-2" style="width:auto;padding:8px 12px" onclick="cronoAbbinaRemoto()">Abbina un tasto</button>`}
          ${_cronoRemotoKey() ? `<span class="et" style="margin:0">abbinato: <b>${esc(_cronoRemotoKey())}</b></span><button class="btn btn-2" style="width:auto;padding:6px 9px;font-size:12px" onclick="cronoResetRemoto()">✕</button>` : ``}
        </div>
        <p class="et" style="margin-top:7px;color:var(--txt3)">Spia — ultimo tasto ricevuto: <b id="cl-lastkey">${esc(S._cronoLastKey || "— nessuno —")}</b>. Se premendo il telecomando resta «nessuno», quel telecomando manda comandi <b>volume</b> (il browser non li riceve): serve un telecomando che faccia da <b>tastiera</b> (spesso c'è una modalità iOS/Android — prova a cambiarla).</p>
      </div>
    </div>` : "";

  const battSel = nBatt > 1 ? `<div class="cl-presenti" style="margin-bottom:10px">${Array.from({ length: nBatt }, (_, b) => b + 1).map(b => `<button class="cl-chip ${C.battAttiva === b ? "on" : ""}" onclick="cronoBattAttiva(${b})">Batteria ${b} · ${pres.filter(id => (C.batt[id] || 1) === b).length}</button>`).join("")}</div>` : "";

  const lavoro = _clLavoroLabel();
  // in corsa: tutta l'area clock+passaggio è un TASTO GIGANTE (tocca ovunque qui a ogni arrivo)
  const corpoGrande = se.start == null
    ? `<div class="cl-big" id="cl-big">0:00.0</div><button class="cl-go" onclick="cronoSerieVia()">▶ Via! (batteria ${C.battAttiva})</button>`
    : `<div class="cl-tapzone" onclick="cronoSeriePassaggio()">
        <div class="cl-big" id="cl-big">0:00.0</div>
        <div class="cl-tapzone-lbl">⏱ PASSAGGIO · ${se.passaggi.length}/${heat.length}</div>
        <div class="cl-tapzone-sub">tocca qui a ogni arrivo</div>
      </div>`;
  const grande = `<div class="card cl-grande">
      <div class="cl-grande-top"><div><div class="et" style="margin:0">Lavoro del gruppo</div><div class="cl-lavoro">${esc(lavoro)}</div></div>
        <button class="btn btn-2" style="width:auto;padding:6px 10px;font-size:12px" onclick="cronoToggleSetup()">${C.setup ? "Nascondi" : "⚙ Setup"}</button></div>
      ${battSel}
      ${corpoGrande}
      <p class="cl-rec" id="cl-serie-rec" style="text-align:center;margin:8px 0 0;min-height:16px"></p>
      <p class="et" style="text-align:center;margin:4px 0 0">${se.nRep ? "Serie " + se.nRep + " · batteria di " + heat.length : "Premi «Via!» e poi «Passaggio» a ogni arrivo"}</p>
    </div>`;

  const assegna = se.passaggi.length ? `<div class="card">
      <p class="sez" style="margin-top:0">Ordine d'arrivo · assegna gli atleti</p>
      ${se.passaggi.map((t, i) => `<div class="cl-ass-row">
          <span class="cl-ass-pos">${i + 1}°</span>
          <span class="cl-ass-t">${_clFmt(t * 1000)}</span>
          <select onchange="cronoSerieSetOrdine(${i},this.value)" style="flex:1;min-width:110px"><option value="">— atleta —</option>${heat.map(aid => `<option value="${aid}" ${se.ordine[i] === aid ? "selected" : ""}>${esc(nomeDi(aid))}</option>`).join("")}</select>
        </div>`).join("")}
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-2" style="width:auto;padding:8px 12px" onclick="cronoSeriePassaggioUndo()">↶ togli ultimo</button>
        <button class="btn" style="flex:1" onclick="cronoSerieConferma()">✓ Conferma la serie</button>
      </div>
    </div>` : "";

  const prog = heat.map(id => { const tp = C.atl[id].tempi; return `<div class="card cl-row"><span class="av" style="width:34px;height:34px;font-size:11px">${_clIniz(nomeDi(id))}</span><div style="flex:1;min-width:0"><h3 style="margin:0;font-size:14px">${esc(nomeDi(id))}</h3>${tp.length ? `<div class="cl-times">${tp.map((t, i) => `<span class="cl-time-chip">${i + 1}: ${_clFmt(t * 1000)}</span>`).join("")}</div>` : `<span class="et" style="margin:0">nessun tempo</span>`}</div></div>`; }).join("");

  const fine = _clQualcosaFatto() ? `<button class="btn" style="margin-top:14px" onclick="cronoFine()">✓ Fine allenamento · salva i tempi</button>` : "";

  return `<button class="indietro" onclick="chiudiCronoLive()">‹ Esci dal cronometro</button>
    <div class="card" style="background:var(--blu);color:#fff;border:0"><h3 style="color:#fff;margin:0">🏁 Serie / batteria dal vivo</h3><p class="et" style="color:#fff;opacity:.9;margin-top:3px">${gruppoNome} · ${dataLbl}</p></div>
    ${setup}
    ${grande}
    ${assegna}
    ${heat.length ? `<p class="sez">Batteria ${C.battAttiva} · ${heat.length}</p>${prog}` : `<div class="card"><p class="et" style="margin:0">Nessun atleta in questa batteria: apri il setup.</p></div>`}
    ${fine}`;
}
// telecomando Bluetooth / tastiera nel modo "serie": un tasto → Via!/Passaggio (mani libere).
// Molti telecomandi mandano tasti diversi, quindi si può ABBINARE il proprio (impara qualunque tasto);
// senza abbinamento valgono i tasti più comuni. Una spia mostra l'ultimo tasto ricevuto (diagnostica).
function _cronoRemotoKey() { try { return localStorage.getItem("metis_crono_remoto") || ""; } catch (e) { return ""; } }
function cronoAbbinaRemoto() { S.cronoLearn = true; disegna(); }
function cronoResetRemoto() { try { localStorage.removeItem("metis_crono_remoto"); } catch (e) { } S.cronoLearn = false; disegna(); }
const _CL_DEF_KEYS = ["Space", "Enter", "NumpadEnter", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "AudioVolumeUp", "AudioVolumeDown"];
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("keydown", function (e) {
    const C = (typeof S !== "undefined") ? S.cronoLive : null;
    if (!C || C.modo !== "serie" || (typeof S !== "undefined" && S.seduta)) return;
    // spia: mostra SEMPRE l'ultimo tasto ricevuto (così si vede se il telecomando manda qualcosa)
    const info = (e.key === " " ? "Spazio" : e.key) + (e.code && e.code !== e.key ? " · " + e.code : "");
    S._cronoLastKey = info;
    const le = document.getElementById("cl-lastkey"); if (le) le.textContent = info;
    // modalità abbinamento: memorizza questo tasto come comando del telecomando
    if (S.cronoLearn) {
      if (e.key === "Escape") { S.cronoLearn = false; disegna(); return; }
      e.preventDefault();
      try { localStorage.setItem("metis_crono_remoto", e.code || e.key); } catch (x) { }
      S.cronoLearn = false; disegna(); return;
    }
    if (e.target && e.target.matches && e.target.matches("input,select,textarea")) return;
    const learned = _cronoRemotoKey();
    const match = (_CL_DEF_KEYS.indexOf(e.code) >= 0 || e.key === " " || e.key === "Enter")
      || (learned && (e.code === learned || e.key === learned));   // tasti comuni SEMPRE attivi + quello abbinato
    if (!match) return;
    e.preventDefault();
    const se = C.serie || {};
    if (se.start == null) cronoSerieVia(); else cronoSeriePassaggio();
  });
}

// ---- vista ----
function vistaCronoLive() {
  const C = S.cronoLive;
  if (!C) return "";
  _clStartTick();
  if (!C.modo) return _clVistaScegliModo(C);
  if (C.modo === "serie") return _clVistaSerie(C);
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const dataLbl = (typeof dataLunga === "function") ? cap(dataLunga(C.data)) : C.data;
  const nomeDi = id => { const a = (DEMO.atleti || []).find(x => x.id === id); return a ? a.nome : "?"; };
  const gruppoNome = (typeof nomeGruppo === "function") ? nomeGruppo(C.gruppo) : "";
  const nPres = (C.lista || []).filter(id => C.presenti[id]).length;

  // --- setup: presenti + lavoro ---
  const opt = C.opzioni.map((o, i) => `<option value="${i}" ${C.sel === i ? "selected" : ""}>${_clEsc(o.label)}</option>`).join("");
  const setup = C.setup ? `<div class="card">
      <label class="lab">Lavoro da cronometrare</label>
      <select onchange="cronoSetLavoro(this.value)" style="margin-top:6px">${opt}<option value="custom" ${C.sel < 0 ? "selected" : ""}>✎ scrivilo a mano…</option></select>
      ${C.sel < 0 ? `<input value="${_clEsc(C.custom)}" placeholder="es. 5 × 1000 m" oninput="cronoSetCustom(this.value)" onchange="disegna()" style="margin-top:8px">` : ""}
      <label class="lab" style="display:block;margin-top:14px">Chi è presente (${nPres})</label>
      <div class="cl-presenti">${(C.lista || []).map(id => `<button class="cl-chip ${C.presenti[id] ? "on" : ""}" onclick="cronoTogglePresente('${id}')">${C.presenti[id] ? "✓ " : ""}${_clEsc(nomeDi(id))}</button>`).join("")}</div>
      <p class="et" style="margin-top:8px;color:var(--txt3)">Puoi includere anche chi fa un <b>lavoro diverso</b>: partono insieme col crono grande, ma ognuno ha il suo tempo e può ripartire da solo col <b>▶ Via</b> della sua riga.</p>
    </div>` : "";

  // --- crono grande ---
  const lavoro = _clLavoroLabel();
  const bigBtn = `<button class="cl-go" onclick="cronoGo()">${C.repStart ? "↻ Via! (tutti)" : "▶ Via!"}</button>`;
  const grande = `<div class="card cl-grande">
      <div class="cl-grande-top">
        <div><div class="et" style="margin:0">Lavoro del gruppo</div><div class="cl-lavoro">${_clEsc(lavoro)}</div></div>
        <button class="btn btn-2" style="width:auto;padding:6px 10px;font-size:12px" onclick="cronoToggleSetup()">${C.setup ? "Nascondi" : "⚙ Setup"}</button>
      </div>
      <div class="cl-big" id="cl-big">0:00.0</div>
      ${bigBtn}
      <p class="et" style="text-align:center;margin:8px 0 0">${C.nRep ? "Ripetuta " + C.nRep + " · parte/riparte tutti insieme" : "Premi «Via!» per far partire tutti insieme"}</p>
    </div>`;

  // --- righe atleti ---
  const righe = (C.lista || []).filter(id => C.presenti[id]).map(id => {
    const st = C.atl[id];
    const chips = st.tempi.map((t, i) => `<span class="cl-time-chip">${i + 1}: ${_clFmt(t * 1000)}</span>`).join("");
    const tDisp = st.running ? "0:00.0" : (st.tempi.length ? _clFmt(st.tempi[st.tempi.length - 1] * 1000) : "–");
    const azione = st.running
      ? `<button class="cl-stop" onclick="cronoStop('${id}')">■ STOP</button>`
      : `<button class="cl-via1" onclick="cronoViaUno('${id}')">▶ Via</button>`;
    const undo = (!st.running && st.tempi.length) ? `<button class="cl-undo-mini" onclick="cronoAnnullaUltimo('${id}')" title="Annulla l'ultimo tempo">↶</button>` : "";
    const lavA = (C.lavoroAtl && C.lavoroAtl[id]) ? `<div class="cl-lav-atl">${_clEsc(C.lavoroAtl[id])}</div>` : "";
    return `<div class="card cl-row ${st.running ? "run" : (st.recStart ? "rec" : "")}">
      <span class="av" style="width:36px;height:36px;font-size:12px">${_clIniz(nomeDi(id))}</span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
          <h3 style="margin:0;font-size:15px">${_clEsc(nomeDi(id))}</h3>
          <span class="cl-rec" id="cl-r-${id}"></span>
        </div>
        ${lavA}
        ${chips ? `<div class="cl-times">${chips}</div>` : ""}
      </div>
      <div class="cl-row-right">
        <span class="cl-t" id="cl-t-${id}">${tDisp}</span>
        ${azione}${undo}
      </div>
    </div>`;
  }).join("");

  const fine = _clQualcosaFatto()
    ? `<button class="btn" style="margin-top:14px" onclick="cronoFine()">✓ Fine allenamento · salva i tempi</button>`
    : "";

  return `<button class="indietro" onclick="chiudiCronoLive()">‹ Esci dal cronometro</button>
    <div class="card" style="background:var(--blu);color:#fff;border:0">
      <h3 style="color:#fff;margin:0">⏱ Allenamento dal vivo</h3>
      <p class="et" style="color:#fff;opacity:.9;margin-top:3px">${gruppoNome} · ${dataLbl}</p>
    </div>
    ${setup}
    ${grande}
    ${nPres ? `<p class="sez">Atleti · ${nPres}</p>${righe}` : `<div class="card"><p class="et" style="margin:0">Nessun atleta selezionato: apri il setup e scegli chi è presente.</p></div>`}
    ${fine}`;
}

// ---- fine allenamento: salva i tempi sulla giornata di OGNI atleta come seduta "da confermare" ----
async function cronoFine() {
  const C = S.cronoLive; if (!C) return;
  const oggi = C.data;
  const conTempi = (C.lista || []).filter(id => C.presenti[id] && (C.atl[id].tempi || []).length);
  if (!conTempi.length) { alert("Nessun tempo registrato da salvare."); return; }
  const nomiFinali = conTempi.map(id => { const a = (DEMO.atleti || []).find(x => x.id === id); return a ? a.nome : ""; }).filter(Boolean);
  if (typeof confirm === "function" && !confirm("Salvare i tempi e mandarli sulla giornata di " + conTempi.length + " atlet" + (conTempi.length === 1 ? "a" : "i") + "?\nOgnuno li controllerà, metterà l'RPE e confermerà.")) return;
  let n = 0;
  for (const id of conTempi) {
    const a = (DEMO.atleti || []).find(x => x.id === id); if (!a) continue;
    const giorno = (typeof giornoDataAtleta === "function") ? giornoDataAtleta(a, oggi, "pista") : 1;
    const dati = {
      daConfermare: true,
      cronoContenuto: (C.lavoroAtl && C.lavoroAtl[id]) ? C.lavoroAtl[id] : _clLavoroLabel(),
      cronoDist: (C.distAtl && C.distAtl[id]) ? C.distAtl[id] : ((C.sel >= 0 && C.opzioni[C.sel]) ? C.opzioni[C.sel].distanza : 0),
      cronoTempi: C.atl[id].tempi.slice()
    };
    if (typeof salvaCronoDaConfermareDB === "function") { try { await salvaCronoDaConfermareDB(id, oggi, giorno, dati); } catch (e) { } }
    n++;
  }
  if (typeof _invalidaSeduteGen === "function") _invalidaSeduteGen();   // le sedute si rigenerano coi tempi del cronometro
  _clStopTick(); S.cronoLive = null;
  if (typeof S !== "undefined") S.vista = "oggi";
  disegna(); window.scrollTo(0, 0);
  alert("✓ Salvato per " + n + " atlet" + (n === 1 ? "a" : "i") + ".\nI tempi sono sulla loro giornata: controllano, mettono l'RPE e confermano.");
}
