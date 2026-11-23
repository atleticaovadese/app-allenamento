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
  S.cronoLive = { gruppo: g, data: oggi, lista: lista.map(a => a.id), opzioni, sel, custom: "", presenti, lavoroAtl, distAtl, repStart: null, nRep: 0, atl, setup: true };
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
  return Object.keys(C.atl).some(id => (C.atl[id].tempi || []).length) || C.repStart != null;
}

// ---- tick: aggiorna i tempi a schermo senza ridisegnare tutto ----
function _clStartTick() { if (!S._clHandle) S._clHandle = setInterval(_clTick, 120); }
function _clStopTick() { if (S._clHandle) { clearInterval(S._clHandle); S._clHandle = null; } }
function _clTick() {
  const C = S.cronoLive;
  if (!C) { _clStopTick(); return; }
  const now = Date.now();
  const big = document.getElementById("cl-big");
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

// ---- vista ----
function vistaCronoLive() {
  const C = S.cronoLive;
  if (!C) return "";
  _clStartTick();
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
