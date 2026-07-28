// Persistenza locale, import/export dati, esercizi personalizzati.
// Finché non c'è il database, i dati aggiunti dall'allenatore (routine, esercizi nuovi)
// vengono salvati nel browser (localStorage) e possono essere esportati/importati.

const CHIAVE_SALVATAGGIO = "metis_custom";

// Aggiunge gli esercizi personalizzati dentro le librerie in memoria (senza duplicare).
function mergeEserciziCustom(lista) {
  (lista || []).forEach(e => {
    const arr = LIBRERIE[e.lib];
    if (!arr) return;
    if (arr.some(x => x.custom && x.n === e.n)) return;
    arr.push({ g: e.g || "Personalizzati", n: e.n, m: e.m || "", cue: e.cue || "",
      f: e.f || "personalizzato", v: e.v || "", custom: true });
  });
}

// All'avvio: rilegge ciò che l'allenatore ha salvato nel browser.
function caricaCustom() {
  try {
    const raw = localStorage.getItem(CHIAVE_SALVATAGGIO);
    if (!raw) return;
    const c = JSON.parse(raw);
    DEMO.customEsercizi = c.esercizi || [];
    mergeEserciziCustom(DEMO.customEsercizi);
    if (c.schede) DEMO.schede = c.schede;
    if (c.schedeTipo) DEMO.schedeTipo = c.schedeTipo;
    if (c.piano) DEMO.piano = c.piano;
    if (c.pista) DEMO.pista = c.pista;
    if (c.palestra) DEMO.palestra = c.palestra;
  } catch (e) { /* niente da caricare */ }
}

function salvaCustom() {
  try {
    localStorage.setItem(CHIAVE_SALVATAGGIO, JSON.stringify({
      esercizi: DEMO.customEsercizi || [], schede: DEMO.schede, schedeTipo: DEMO.schedeTipo,
      piano: DEMO.piano, pista: DEMO.pista, palestra: DEMO.palestra
    }));
  } catch (e) { /* localStorage non disponibile */ }
}
function savePiano() { salvaCustom(); }

function aggiungiEsercizioCustom(lib, ex) {
  DEMO.customEsercizi = DEMO.customEsercizi || [];
  const rec = { lib, g: ex.g || "Personalizzati", n: ex.n, m: ex.m || "", cue: ex.cue || "", v: ex.v || "" };
  DEMO.customEsercizi.push(rec);
  mergeEserciziCustom([rec]);
  salvaCustom();
}

// ---------- download / upload ----------
function scaricaFile(nome, testo) {
  const blob = new Blob([testo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function esportaDati() {
  const dump = JSON.stringify(DEMO, null, 2);
  scaricaFile("metis-dati.json", dump);
}

function importaDati(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      Object.keys(d).forEach(k => { DEMO[k] = d[k]; });
      mergeEserciziCustom(DEMO.customEsercizi || []);
      salvaCustom();
      alert("Dati importati. ✓");
      S.vista = "dati"; S.esercizioEdit = null; S.routineEdit = null; disegna();
    } catch (err) {
      alert("File non valido: dev'essere un file .json esportato da qui.");
    }
  };
  r.readAsText(file);
}

// ---------- vista Import / Export ----------
function vistaImportExport() {
  const nCustom = (DEMO.customEsercizi || []).length;
  const nRoutine = Object.keys(DEMO.schede || {}).length;
  return `
  <div class="card"><h3>Import / Export</h3>
    <p class="et" style="margin-top:2px">Salva o ripristina i dati. Utile per fare backup e, in futuro, per lo scambio con l'Excel.</p></div>

  <div class="card">
    <p style="font-weight:600;margin-bottom:4px">Esporta</p>
    <p class="et" style="margin-bottom:10px">Scarica un file con tutti i dati attuali (atleti, programmi, routine, esercizi aggiunti, diario, presenze).</p>
    <button class="btn" onclick="esportaDati()">⬇ Scarica i dati (.json)</button>
  </div>

  <div class="card">
    <p style="font-weight:600;margin-bottom:4px">Importa</p>
    <p class="et" style="margin-bottom:10px">Carica un file esportato prima: sostituisce i dati attuali.</p>
    <label class="btn btn-2" style="text-align:center;cursor:pointer">
      ⬆ Scegli un file .json
      <input type="file" accept="application/json,.json" style="display:none"
        onchange="importaDati(this.files[0])">
    </label>
  </div>

  <div class="card" style="border-color:var(--line2)">
    <p class="et">Adesso · <b>${nRoutine}</b> routine di riscaldamento · <b>${nCustom}</b> esercizi aggiunti da te</p>
    <p class="et" style="margin-top:8px">Quando collegheremo il database, l'export diventerà l'<b>Excel completo per atleta</b> e gli esercizi che aggiungi qui finiranno automaticamente nella libreria dell'Excel.</p>
  </div>`;
}
