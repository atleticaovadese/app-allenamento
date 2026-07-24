// Creazione e modifica delle routine di riscaldamento (lato allenatore).
// Le routine stanno in DEMO.schede: {nome: [esercizio+dose, ...]}. L'atleta le usa nella seduta.

function vistaRiscaldamento() {
  if (S.routineEdit) return editorRoutine();
  const nomi = Object.keys(DEMO.schede);
  let h = `<div class="card"><h3>Riscaldamento</h3>
      <p class="et" style="margin-top:2px">Crea e gestisci le routine. L'atleta le trova nella sua seduta e, toccando un esercizio, ne vede il video.</p></div>
    <button class="btn" style="margin-bottom:12px" onclick="nuovaRoutine()">＋ Nuova routine</button>`;
  h += nomi.map((n, i) => `<div class="lib-row" onclick="modificaRoutine(${i})">
      <div style="flex:1;min-width:0"><div style="font-weight:500">${n}</div>
        <div class="et" style="margin-top:1px">${DEMO.schede[n].length} esercizi</div></div>
      <span class="freccia">›</span></div>`).join("");
  return h;
}

const RISC_TIPI = ["Attivazione", "Mobilità", "Andature"];

// Esercizi disponibili per tipo, presi dalle librerie (come i menù a tendina dell'Excel).
function eserciziTipo(tipo) {
  const V = LIBRERIE.video || [];
  const cat = n => (V.find(c => c.cat === n) || { items: [] }).items;
  if (tipo === "Attivazione")
    return [...cat("Basic taps (piedi e caviglia)"), ...cat("Glutei e femorali")];
  if (tipo === "Mobilità")
    return [...(LIBRERIE.mobilita || []).map(x => ({ n: x.n, v: x.v })),
            ...cat("Mobility drills"), ...cat("Attivazione e mobilità tronco (TAM)")];
  if (tipo === "Andature")
    return [...cat("Running drills (andature)"), ...cat("Tecnica di partenza")];
  return [];
}

function nuovaRoutine() { S.routineEdit = { nome: "", voci: [], orig: null, tipo: "Attivazione" }; disegna(); window.scrollTo(0, 0); }
function modificaRoutine(i) {
  const n = Object.keys(DEMO.schede)[i];
  S.routineEdit = { nome: n, voci: [...DEMO.schede[n]], orig: n, tipo: "Attivazione" };
  disegna(); window.scrollTo(0, 0);
}

function editorRoutine() {
  const r = S.routineEdit;
  const lista = eserciziTipo(r.tipo);
  return `<button class="indietro" onclick="annullaRoutine()">‹ Indietro</button>
    <div class="card">
      <label class="lab">Nome della routine</label>
      <input value="${(r.nome || "").replace(/"/g, "&quot;")}" placeholder="Es. Attivazione sprint"
        oninput="S.routineEdit.nome=this.value" style="margin-top:6px">
    </div>
    <div class="card">
      <p class="et" style="margin-bottom:6px">Esercizi della routine (${r.voci.length})</p>
      ${r.voci.length
        ? r.voci.map((v, i) => `<div class="riga"><span>${v}</span>
            <button class="chiudi" onclick="rimuoviVoce(${i})" aria-label="Rimuovi">✕</button></div>`).join("")
        : `<p class="et" style="margin-top:6px">Ancora nessun esercizio: aggiungline qui sotto.</p>`}

      <p class="et" style="margin-top:16px;margin-bottom:6px">Aggiungi dalle librerie</p>
      <label class="lab">Tipo</label>
      <div class="segm" style="margin:6px 0 10px">
        ${RISC_TIPI.map(t => `<button class="${r.tipo === t ? "on" : ""}" onclick="setTipoRisc('${t}')">${t}</button>`).join("")}
      </div>
      <label class="lab">Esercizio (${lista.length} in «${r.tipo}»)</label>
      <select id="esSel" style="margin-top:6px">
        ${lista.map((x, i) => `<option value="${x.n.replace(/"/g, "&quot;")}">${x.n}</option>`).join("")}
      </select>
      <div style="display:flex;gap:8px;margin-top:8px">
        <input id="doseEs" placeholder="dose (opz.) es. 2×20 m" style="flex:1">
        <button class="btn" style="width:auto;padding:0 16px" onclick="aggiungiDaTipo()">＋ Aggiungi</button>
      </div>

      <p class="et" style="margin-top:14px;margin-bottom:6px">Oppure scrivi a mano</p>
      <div style="display:flex;gap:8px">
        <input id="nuovaVoce" placeholder="Esercizio + dose libero" style="flex:1"
          onkeydown="if(event.key==='Enter'){aggiungiVoce();}">
        <button class="btn btn-2" style="width:auto;padding:0 16px" onclick="aggiungiVoce()">＋</button>
      </div>
    </div>
    <button class="btn" onclick="salvaRoutine()">Salva routine</button>
    ${r.orig ? `<button class="btn btn-2" style="margin-top:8px" onclick="eliminaRoutine()">Elimina routine</button>` : ""}`;
}

function setTipoRisc(t) { S.routineEdit.tipo = t; disegna(); }
function aggiungiDaTipo() {
  const sel = document.getElementById("esSel");
  const nome = sel ? sel.value : "";
  const dose = ((document.getElementById("doseEs") || {}).value || "").trim();
  if (nome) { S.routineEdit.voci.push(dose ? nome + " " + dose : nome); disegna(); }
}
function aggiungiVoce() {
  const el = document.getElementById("nuovaVoce");
  const v = (el && el.value || "").trim();
  if (v) { S.routineEdit.voci.push(v); disegna(); }
}
function rimuoviVoce(i) { S.routineEdit.voci.splice(i, 1); disegna(); }
function annullaRoutine() { S.routineEdit = null; disegna(); window.scrollTo(0, 0); }

function salvaRoutine() {
  const r = S.routineEdit, nome = (r.nome || "").trim();
  if (!nome) { alert("Dai un nome alla routine."); return; }
  if (!r.voci.length) { alert("Aggiungi almeno un esercizio."); return; }
  if (r.orig && r.orig !== nome) delete DEMO.schede[r.orig];  // rinominata
  DEMO.schede[nome] = [...r.voci];
  S.routineEdit = null; disegna(); window.scrollTo(0, 0);
}
function eliminaRoutine() {
  const r = S.routineEdit;
  if (r.orig && confirm("Eliminare questa routine?")) delete DEMO.schede[r.orig];
  else if (r.orig) return;
  S.routineEdit = null; disegna(); window.scrollTo(0, 0);
}
