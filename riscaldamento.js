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

function nuovaRoutine() { S.routineEdit = { nome: "", voci: [], orig: null }; disegna(); window.scrollTo(0, 0); }
function modificaRoutine(i) {
  const n = Object.keys(DEMO.schede)[i];
  S.routineEdit = { nome: n, voci: [...DEMO.schede[n]], orig: n };
  disegna(); window.scrollTo(0, 0);
}

function editorRoutine() {
  const r = S.routineEdit;
  const sugg = suggeritiRiscaldamento();
  window._SUGG = sugg;
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
      <div style="display:flex;gap:8px;margin-top:12px">
        <input id="nuovaVoce" placeholder="Esercizio + dose (es. A-skip 2×20 m)" style="flex:1"
          onkeydown="if(event.key==='Enter'){aggiungiVoce();}">
        <button class="btn" style="width:auto;padding:0 16px" onclick="aggiungiVoce()">＋</button>
      </div>
      ${sugg.length
        ? `<p class="et" style="margin-top:14px;margin-bottom:6px">Aggiungi rapido dalle librerie</p>
           <div class="chips">${sugg.map((n, i) => `<button class="chip" onclick="aggiungiVoceIdx(${i})">＋ ${n}</button>`).join("")}</div>`
        : ""}
    </div>
    <button class="btn" onclick="salvaRoutine()">Salva routine</button>
    ${r.orig ? `<button class="btn btn-2" style="margin-top:8px" onclick="eliminaRoutine()">Elimina routine</button>` : ""}`;
}

function aggiungiVoce() {
  const el = document.getElementById("nuovaVoce");
  const v = (el && el.value || "").trim();
  if (v) { S.routineEdit.voci.push(v); disegna(); }
}
function aggiungiVoceIdx(i) { S.routineEdit.voci.push(window._SUGG[i]); disegna(); }
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

// Suggerimenti presi dalle librerie video (andature, mobility, basic taps).
function suggeritiRiscaldamento() {
  const out = [];
  const cats = LIBRERIE.video || [];
  ["Running drills (andature)", "Mobility drills", "Basic taps (piedi e caviglia)"].forEach(cn => {
    const c = cats.find(x => x.cat === cn);
    if (c) c.items.slice(0, 4).forEach(it => out.push(it.n));
  });
  return out;
}
