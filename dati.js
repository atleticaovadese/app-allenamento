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
// il pacchetto dei dati "custom" (programmi, librerie, log) — condiviso da localStorage e DB
function bundleCustom() {
  return {
    esercizi: DEMO.customEsercizi || [], schede: DEMO.schede, schedeTipo: DEMO.schedeTipo,
    piano: DEMO.piano, pista: DEMO.pista, palestra: DEMO.palestra, vbtLog: DEMO.vbtLog, pistaLog: DEMO.pistaLog,
    testSessioni: DEMO.testSessioni, risultatiGara: DEMO.risultatiGara,
    lattato: DEMO.lattato || {},
    overrideGiorni: DEMO.overrideGiorni || {}, overrideContenuto: DEMO.overrideContenuto || {}
  };
}
function applicaBundle(c) {
  if (!c) return;
  DEMO.customEsercizi = c.esercizi || DEMO.customEsercizi || [];
  if (typeof mergeEserciziCustom === "function") mergeEserciziCustom(DEMO.customEsercizi);
  if (c.schede) DEMO.schede = c.schede;
  if (c.schedeTipo) DEMO.schedeTipo = c.schedeTipo;
  if (c.piano) DEMO.piano = c.piano;
  if (c.pista) DEMO.pista = c.pista;
  if (c.palestra) DEMO.palestra = c.palestra;
  if (c.vbtLog) DEMO.vbtLog = c.vbtLog;
  if (c.pistaLog) DEMO.pistaLog = c.pistaLog;
  if (c.testSessioni) DEMO.testSessioni = c.testSessioni;
  if (c.risultatiGara) DEMO.risultatiGara = c.risultatiGara;
  if (c.lattato) DEMO.lattato = c.lattato;
  if (c.overrideGiorni) DEMO.overrideGiorni = c.overrideGiorni;
  if (c.overrideContenuto) DEMO.overrideContenuto = c.overrideContenuto;
}

function caricaCustom() {
  try {
    const raw = localStorage.getItem(CHIAVE_SALVATAGGIO);
    if (raw) applicaBundle(JSON.parse(raw));
  } catch (e) { /* niente da caricare */ }
}

function salvaCustom() {
  try { localStorage.setItem(CHIAVE_SALVATAGGIO, JSON.stringify(bundleCustom())); }
  catch (e) { /* localStorage non disponibile */ }
  if (typeof salvaDatiDB === "function") salvaDatiDB(); // write-through al database (se collegato)
}

// --- sessioni di test complete (snapshot per data): si rivedono per intero ---
function salvaSessione(atletaId, tipo, dati) {
  if (!atletaId) return false;
  DEMO.testSessioni = DEMO.testSessioni || [];
  DEMO.testSessioni.push({ id: "ts" + Date.now(), atletaId, tipo, data: new Date().toISOString().slice(0, 10), dati });
  salvaCustom();
  return true;
}
function sessioniDi(atletaId, tipo) {
  return (DEMO.testSessioni || []).filter(s => s.atletaId === atletaId && s.tipo === tipo)
    .slice().sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0)); // più recenti prima
}
function eliminaSessione(id) {
  DEMO.testSessioni = (DEMO.testSessioni || []).filter(s => s.id !== id);
  salvaCustom(); disegna();
}
// lista delle sessioni salvate di un test (card riapribile per data)
function bloccoSessioni(atletaId, tipo, titolo) {
  if (!atletaId) return "";
  const ss = sessioniDi(atletaId, tipo);
  const dt = d => typeof fmtDataAnno === "function" ? fmtDataAnno(d) : d;
  return `<div class="card"><p class="et" style="margin-bottom:8px">${titolo || "Test salvati"}</p>
    ${ss.length ? ss.map(s => `<div style="border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <b style="font-size:14px">${dt(s.data)}</b>
        <button class="link-indietro" style="color:var(--rosso)" onclick="eliminaSessione('${s.id}')">elimina</button></div>
      ${formatSessione(s.tipo, s.dati)}</div>`).join("")
      : `<p class="et">Nessun test salvato ancora. Salva e lo rivedi qui, completo, per data.</p>`}
  </div>`;
}
// formatta il contenuto completo di una sessione salvata, per tipo di test
function formatSessione(tipo, d) {
  const col = a => a == null ? "var(--txt3)" : a > 15 ? "var(--rosso)" : a >= 10 ? "var(--giallo)" : "var(--verde)";
  if (tipo === "prevenzione") {
    const row = (lbl, o) => o ? `<tr><td>${lbl}</td><td class="pauto">${o.dx}/${o.sx}</td><td class="pauto" style="color:${col(o.asym)}">${o.asym != null ? o.asym.toFixed(1) + "%" : "—"}</td></tr>` : "";
    return `<table class="ptab" style="min-width:0;margin-top:6px"><thead><tr><th>Test</th><th>Dx/Sx</th><th>Asimm.</th></tr></thead><tbody>${row("Caviglia KTW", d.ktw)}${row("Hamstring AKE", d.ake)}${row("Rot. anca", d.hip)}${row("Salto monop.", d.hop)}</tbody></table>`;
  }
  if (tipo === "dropjump") {
    return `<table class="ptab" style="min-width:0;margin-top:6px"><thead><tr><th>Caduta</th><th>Cont.</th><th>Salto</th><th>RSI</th></tr></thead><tbody>${(d.righe || []).map(r => { const best = d.bestH != null && Number(r.caduta) === Number(d.bestH); return `<tr><td>${r.caduta} cm</td><td class="pauto">${r.ct}</td><td class="pauto">${r.h}</td><td class="pauto"${best ? ' style="color:var(--verde);font-weight:600"' : ""}>${r.rsi != null ? Number(r.rsi).toFixed(2) : "—"}${best ? " ★" : ""}</td></tr>`; }).join("")}</tbody></table>${d.bestRsi != null ? `<p class="et" style="margin-top:4px">Ottimale: ${d.bestH} cm · RSI ${Number(d.bestRsi).toFixed(2)}</p>` : ""}`;
  }
  if (tipo === "fv") {
    return `<p class="et" style="margin-top:4px;line-height:1.6">F0 ${Math.round(d.F0)} N · V0 ${Number(d.V0).toFixed(2)} m/s · Pmax ${Math.round(d.Pmax)} W · <b style="color:var(--txt)">${Number(d.Pkg).toFixed(1)} W/kg</b>${d.FVimb != null ? ` · squilibrio ${Math.round(d.FVimb)}% (${d.dir})` : ""}</p>`;
  }
  if (tipo === "fv-sprint") {
    return `<p class="et" style="margin-top:4px;line-height:1.6">F0/kg ${d.F0kg != null ? Number(d.F0kg).toFixed(1) : "—"} N/kg · V0 ${d.V0 != null ? Number(d.V0).toFixed(2) : "—"} m/s · <b style="color:var(--txt)">Pmax/kg ${d.Pmaxkg != null ? Number(d.Pmaxkg).toFixed(1) : "—"} W/kg</b> · RFmax ${d.RFmax != null ? Number(d.RFmax).toFixed(1) + "%" : "—"}</p>`;
  }
  return "";
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

  <div class="card" style="border-color:var(--blu)">
    <p style="font-weight:600;margin-bottom:4px">📊 Report Excel (con grafici)</p>
    <p class="et" style="margin-bottom:10px">Un file Excel bello e pronto: fogli formattati (Squadra, Allenamenti svolti, PB, Presenze) con colori e <b>grafici</b> di aderenza e ACWR. Ideale per presentazioni e conferenze.</p>
    <button class="btn" onclick="esportaXlsx()">⬇ Scarica il report Excel (.xlsx)</button>
  </div>

  <div class="card">
    <p style="font-weight:600;margin-bottom:4px">Esporta per Excel (CSV singoli)</p>
    <p class="et" style="margin-bottom:10px">File CSV leggeri, un dato per file, se ti serve solo una tabella da analizzare.</p>
    <div class="azioni">
      <button class="btn btn-2" onclick="esportaSvoltiCSV()">⬇ Allenamenti svolti</button>
      <button class="btn btn-2" onclick="esportaPbCSV()">⬇ PB e massimali</button>
      <button class="btn btn-2" onclick="esportaProgrammaCSV()">⬇ Programma</button>
      <button class="btn btn-2" onclick="esportaPresenzeCSV()">⬇ Presenze e aderenza</button>
    </div>
  </div>

  <div class="card" style="border-color:var(--line2)">
    <p class="et">Adesso · <b>${nRoutine}</b> routine di riscaldamento · <b>${nCustom}</b> esercizi aggiunti da te</p>
    <p class="et" style="margin-top:8px">Il <b>.json</b> è il backup completo (salva/ripristina tutto). I <b>CSV</b> sono per portare i dati in Excel.</p>
  </div>`;
}

// ---------- export CSV (Excel) — nessuna libreria, apri direttamente in Excel ----------
function _csvCell(v) { v = (v == null ? "" : String(v)); return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function scaricaCSV(nome, righe) {
  const csv = (righe || []).map(r => r.map(_csvCell).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function _nomeAtl(id) { const a = (DEMO.atleti || []).find(x => x.id === id); return a ? a.nome : id; }

function esportaSvoltiCSV() {
  const righe = [["Atleta", "Data", "Tipo", "Giorno", "Durata (min)", "RPE", "Fastidio", "Voce", "Prescrizione", "%", "Obiettivo", "Svolto", "Migliore/Media"]];
  const ss = DEMO.seduteSvolte || {};
  Object.keys(ss).forEach(aid => {
    (ss[aid] || []).slice().sort((x, y) => x.data < y.data ? 1 : -1).forEach(sv => {
      const d = sv.dati || {};
      const base = [_nomeAtl(aid), sv.data, sv.tipo, sv.giorno || "", sv.durata_min || "", sv.rpe || "", sv.fastidi ? "sì" : ""];
      if (sv.tipo === "pista") {
        (d.elementi || []).forEach(e => {
          const fatti = (e.tempi || []).filter(v => v != null);
          const best = fatti.length ? Math.min(...fatti) : "";
          righe.push(base.concat([e.distanza + " m", e.ripetute + "×" + e.distanza, e.percentuale || "", e.target != null ? e.target : "", fatti.map(t => Number(t).toFixed(2)).join(" · "), best !== "" ? Number(best).toFixed(2) : ""]));
        });
      } else {
        (d.esercizi || []).forEach(x => {
          const fatte = (x.vbt || []).filter(v => v != null);
          const vmed = fatte.length ? (fatte.reduce((s, v) => s + v, 0) / fatte.length).toFixed(2) : "";
          righe.push(base.concat([x.nome, (x.serie || "") + "×" + (x.rep || "") + (x.peso ? " @" + x.peso + "kg" : ""), x.percentuale || "", x.vbtTarget != null ? x.vbtTarget : "", fatte.map(v => Number(v).toFixed(2)).join(" · "), vmed]));
        });
      }
    });
  });
  if (righe.length <= 1) { alert("Nessun allenamento svolto ancora da esportare."); return; }
  scaricaCSV("metis-allenamenti-svolti.csv", righe);
}
function esportaPbCSV() {
  const righe = [["Atleta", "Categoria", "Tipo", "Voce", "Valore", "Data", "Origine"]];
  (DEMO.atleti || []).forEach(a => {
    const cat = (a.scheda && a.scheda.anagrafica && a.scheda.anagrafica.categoria) || "";
    ((a.scheda && a.scheda.pb) || []).forEach(p => righe.push([a.nome, cat, "PB", p[0], p[1], p[2] || "", p[7] || ""]));
    ((a.scheda && a.scheda.massimali) || []).forEach(m => righe.push([a.nome, cat, "Massimale", m[0], m[1] + " kg", m[2] || "", ""]));
  });
  if (righe.length <= 1) { alert("Nessun PB/massimale da esportare."); return; }
  scaricaCSV("metis-pb-massimali.csv", righe);
}
function esportaProgrammaCSV() {
  const righe = [["Gruppo", "Tipo", "Mesociclo", "Giorno n°", "Giorno sett.", "Settimana", "Voce", "Distanza/Serie", "N/Rep", "%", "Rec", "Peso/TUT"]];
  const dump = (glab, prog, tipo) => {
    ((prog && prog.mesocicli) || []).forEach((m, mi) => {
      const mLabel = ((m.ciclo ? "ciclo " + m.ciclo : "") + (m.focus ? " " + m.focus : "")).trim() || ("Mesociclo " + (mi + 1));
      (m.giorni || []).forEach((g, gi) => {
        (g.settimane || []).forEach((sett, wi) => {
          (sett.righe || []).forEach(r => {
            if (tipo === "pista") { if (!r.distanza && !r.contenuto) return; righe.push([glab, "Pista", mLabel, gi + 1, g.giornoSett || "", wi + 1, r.contenuto || "", r.distanza || "", r.n || "", r.perc || "", r.rec || "", ""]); }
            else { if (!r.esercizio) return; righe.push([glab, "Palestra", mLabel, gi + 1, g.giornoSett || "", wi + 1, r.esercizio || "", r.serie || "", r.rep || "", r.perc || "", r.rec || "", r.peso || r.tut || ""]); }
          });
        });
      });
    });
  };
  // per-gruppo (nuovo formato mappa) oppure singolo (vecchio)
  const GRP = [["vel", "Velocisti/Saltatori"], ["lanci", "Lanciatori"], ["mezzo", "Mezzofondo/Fondo"]];
  const progs = (root) => (!root) ? [] : (root.mesocicli ? [["", root]] : GRP.map(([k, l]) => [l, root[k]]).filter(x => x[1]));
  progs(DEMO.pista).forEach(([glab, prog]) => dump(glab, prog, "pista"));
  progs(DEMO.palestra).forEach(([glab, prog]) => dump(glab, prog, "palestra"));
  if (righe.length <= 1) { alert("Nessun programma da esportare."); return; }
  scaricaCSV("metis-programma.csv", righe);
}
function esportaPresenzeCSV() {
  const righe = [["Atleta", "Disciplina", "Specialità", "Fatte (mese)", "Programmate (mese)", "Fatte (stagione)", "Programmate (stagione)", "Aderenza %", "ACWR", "Forma (TSB)", "Prontezza"]];
  (DEMO.atleti || []).forEach(a => {
    const m = (DEMO.mon || {})[a.id] || {};
    const pm = a.presenzeMese || [0, 0], ps = a.presenzeStagione || [0, 0];
    righe.push([a.nome, a.disciplina || "", a.specialita || "", pm[0], pm[1], ps[0], ps[1], m.aderenza != null ? m.aderenza : "", m.acwr || "", m.forma || "", m.prontezza || ""]);
  });
  if (righe.length <= 1) { alert("Nessun atleta da esportare."); return; }
  scaricaCSV("metis-presenze.csv", righe);
}
