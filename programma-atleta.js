// TAPPA 3a — genera le sedute dell'atleta dal programma madre (pista/palestra) in base alla data.
// Il programma madre è UNO (DEMO.pista / DEMO.palestra). Ogni "giorno" ha un giornoSett (lun..dom)
// e il contenuto per settimana. Da data → mesociclo attivo → indice settimana → seduta del giorno.

const GG_ISO = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
const GG_FULL = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
const MESI_FULL = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function isoDiData(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); } // data LOCALE (no UTC shift)
function oggiISO() { return isoDiData(new Date()); }
function wdIdx(dataISO) { return (new Date(dataISO + "T00:00:00").getDay() + 6) % 7; } // 0 = lunedì
function dataLunga(dataISO) { const d = new Date(dataISO + "T00:00:00"); return GG_FULL[wdIdx(dataISO)] + " " + d.getDate() + " " + MESI_FULL[d.getMonth()]; }
function nSettDi(m) { return typeof nSettimaneMeso === "function" ? nSettimaneMeso(m) : ((m.settimane && m.settimane.length) || (m.giorni && m.giorni[0] && m.giorni[0].settimane.length) || 4); }

// mesociclo attivo per una data (clamp=true → se fuori range usa il più vicino, così il calendario mostra sempre qualcosa)
function mesoAttivo(prog, dataISO, clamp) {
  const mc = ((prog && prog.mesocicli) || []).filter(m => m.inizio);
  if (!mc.length) return null;
  const oggi = new Date(dataISO + "T00:00:00").getTime();
  for (const m of mc) {
    const inizio = new Date(m.inizio + "T00:00:00").getTime(), fine = inizio + nSettDi(m) * 7 * 86400000;
    if (oggi >= inizio && oggi < fine) return { m, settIdx: Math.floor((oggi - inizio) / (7 * 86400000)) };
  }
  if (!clamp) return null;
  const primo = mc[0], ultimo = mc[mc.length - 1];
  if (oggi < new Date(primo.inizio + "T00:00:00").getTime()) return { m: primo, settIdx: 0 };
  return { m: ultimo, settIdx: nSettDi(ultimo) - 1 };
}

// cache delle sedute generate: stesso id → stesso oggetto (così i dati inseriti non si perdono al re-render)
function _cacheSeduta(s) {
  DEMO.seduteGen = DEMO.seduteGen || [];
  const e = DEMO.seduteGen.find(x => x.id === s.id);
  if (e) return e;
  DEMO.seduteGen.push(s); return s;
}
function sedutaGen(id) { return (DEMO.seduteGen || []).find(s => s.id === id); }

function generaSedutaPista(g, giornoNum, settIdx, dataISO, meso, atleta, prog) {
  const sett = g.settimane && g.settimane[settIdx];
  const ovR = overrideRighe(atleta, "pista", giornoNum - 1, settIdx);
  const allRighe = (ovR || (sett && sett.righe) || []);
  // gruppo Mezzofondo/Fondo: seduta a mezzi/ritmi (ripetute o corsa continua)
  if (atleta && typeof gruppoDi === "function" && gruppoDi(atleta) === "mezzo" && typeof _generaSedutaPistaMezzo === "function")
    return _generaSedutaPistaMezzo(g, giornoNum, settIdx, dataISO, meso, atleta, prog, sett, allRighe);
  if (atleta && typeof gruppoDi === "function" && gruppoDi(atleta) === "lanci" && typeof _generaSedutaPistaLanci === "function")
    return _generaSedutaPistaLanci(g, giornoNum, settIdx, dataISO, meso, atleta, prog, sett, allRighe);
  const righe = allRighe.filter(r => r.distanza && Number(r.n) > 0);
  if (!righe.length) return null;
  const aid = (atleta && atleta.id) || "x";
  const profilo = prog && prog.profilo;   // il profilo velocità del programma del GRUPPO dell'atleta
  const elementi = righe.map((r, i) => {
    const n = Number(r.n);
    const t = (atleta && typeof pistaTempoAtleta === "function") ? pistaTempoAtleta(atleta, r.distanza, r.perc, profilo)
      : (typeof pistaTempo === "function" ? pistaTempo(r.distanza, r.perc) : null);
    return { id: "e" + i, contenuto: r.contenuto || "", distanza: Number(r.distanza), ripetute: n, percentuale: (parseFloat(String(r.perc).replace(",", ".")) || null), recupero: r.rec || "", target: t != null ? Math.round(t * 100) / 100 : null, tempi: Array(n).fill(null) };
  });
  return _cacheSeduta({
    id: "gen-p-" + aid + "-" + dataISO + "-g" + giornoNum, tipo: "pista", giorno: giornoNum, quando: "", data: dataLunga(dataISO), dataISO: dataISO, atletaId: aid,
    focus: (meso && meso.focus) || "", obiettivi: "", notaCoach: (sett && sett.nota) || "", riscaldamento: [],
    plio: (g.plio || []).filter(r => r.es),
    elementi, durata: null, rpe: null, fastidi: false, chiusa: false
  });
}
function generaSedutaPal(g, giornoNum, settIdx, dataISO, meso, atleta) {
  const sett = g.settimane && g.settimane[settIdx];
  const ovR = overrideRighe(atleta, "palestra", giornoNum - 1, settIdx);
  const righe = (ovR || (sett && sett.righe) || []).filter(r => r.esercizio);
  if (!righe.length) return null;
  const aid = (atleta && atleta.id) || "x";
  const esercizi = righe.map((r, i) => {
    const serie = Number(r.serie) || 0;
    const peso = (atleta && typeof palPesoAtleta === "function") ? palPesoAtleta(atleta, r)
      : (typeof palPeso === "function" ? palPeso(r) : null);
    const rec = String(r.rec || ""), recSec = rec.indexOf("'") >= 0 ? (parseFloat(rec) * 60) : (parseInt(rec) || null);
    return { id: "x" + i, nome: r.esercizio, serie, rep: Number(r.rep) || 0, percentuale: (parseFloat(String(r.perc).replace(",", ".")) || null), peso, tut: r.tut || "", vbtTarget: r.vbt ? Number(r.vbt) : null, recuperoSec: recSec, vbt: Array(serie).fill(null) };
  });
  return _cacheSeduta({
    id: "gen-l-" + aid + "-" + dataISO + "-g" + giornoNum, tipo: "palestra", giorno: giornoNum, quando: "", data: dataLunga(dataISO), dataISO: dataISO, atletaId: aid,
    focus: (meso && meso.focus) || "", obiettivi: "", notaCoach: (sett && sett.nota) || "", riscaldamento: [],
    esercizi, durata: null, rpe: null, fastidi: false, chiusa: false
  });
}

// giorno-settimana EFFETTIVO di un giorno del programma per un atleta:
// se il coach ha spostato quel giorno per lui (override) usa quello, altrimenti quello del madre.
function giornoSettEff(atleta, tipo, gi, g) {
  const ov = atleta && DEMO.overrideGiorni && DEMO.overrideGiorni[atleta.id];
  const w = ov && ov[tipo] && ov[tipo][gi];
  return w || g.giornoSett;
}

// TAPPA 3c — righe di contenuto personalizzate per un atleta (giorno gi, settimana wk): null se usa il madre
function overrideRighe(atleta, tipo, gi, wk) {
  const o = atleta && DEMO.overrideContenuto && DEMO.overrideContenuto[atleta.id];
  return (o && o[tipo] && o[tipo][gi] && o[tipo][gi][wk]) || null;
}

// TAPPA 4 — conta le sedute PROGRAMMATE per un atleta tra due date ISO (rispetta sposta-giorni + override contenuto)
// programma del GRUPPO dell'atleta (per-disciplina). Se manca l'atleta → gruppo "vel".
function _progPista(atleta) { if (typeof pistaDi !== "function") return DEMO.pista; const g = (atleta && typeof gruppoDi === "function") ? gruppoDi(atleta) : "vel"; return pistaDi(g); }
function _progPal(atleta) { if (typeof palDi !== "function") return DEMO.palestra; const g = (atleta && typeof gruppoDi === "function") ? gruppoDi(atleta) : "vel"; return palDi(g); }

function contaProgrammate(atleta, fromISO, toISO) {
  let n = 0, guard = 0;
  const to = new Date(toISO + "T00:00:00").getTime();
  const d = new Date(fromISO + "T00:00:00");
  const progs = [["pista", _progPista(atleta)], ["palestra", _progPal(atleta)]];
  while (d.getTime() <= to && guard++ < 800) {
    const dataISO = isoDiData(d), wd = GG_ISO[wdIdx(dataISO)];
    progs.forEach(([tipo, prog]) => {
      const pa = mesoAttivo(prog, dataISO, false);
      if (!pa) return;
      (pa.m.giorni || []).forEach((g, gi) => {
        if (giornoSettEff(atleta, tipo, gi, g) !== wd) return;
        const sett = g.settimane && g.settimane[pa.settIdx];
        const righe = overrideRighe(atleta, tipo, gi, pa.settIdx) || (sett && sett.righe) || [];
        const ok = tipo === "pista" ? righe.some(r => (r.distanza && Number(r.n) > 0) || Number(r.min) > 0) : righe.some(r => r.esercizio);
        if (ok) n++;
      });
    });
    d.setDate(d.getDate() + 1);
  }
  return n;
}

// sedute (pista + palestra) del programma madre per una data, personalizzate sul PB/massimale dell'ATLETA
// e sui giorni spostati per lui (Tappa 3b)
function seduteDelGiorno(dataISO, clamp, atleta) {
  atleta = atleta || (typeof atletaCorrente === "function" ? atletaCorrente() : null);
  const wd = GG_ISO[wdIdx(dataISO)], out = [];
  const progP = _progPista(atleta), progL = _progPal(atleta);
  const pa = mesoAttivo(progP, dataISO, clamp);
  if (pa) (pa.m.giorni || []).forEach((g, gi) => { if (giornoSettEff(atleta, "pista", gi, g) === wd) { const s = generaSedutaPista(g, gi + 1, pa.settIdx, dataISO, pa.m, atleta, progP); if (s) out.push(s); } });
  const pl = mesoAttivo(progL, dataISO, clamp);
  if (pl) (pl.m.giorni || []).forEach((g, gi) => { if (giornoSettEff(atleta, "palestra", gi, g) === wd) { const s = generaSedutaPal(g, gi + 1, pl.settIdx, dataISO, pl.m, atleta); if (s) out.push(s); } });
  return out;
}

// la settimana (lun→dom) a partire da oggi + off settimane; ogni giorno con le sue sedute
function settimanaProgramma(off) {
  off = off || 0;
  const base = new Date(oggiISO() + "T00:00:00");
  const lunedi = new Date(base.getTime() - wdIdx(oggiISO()) * 86400000 + off * 7 * 86400000);
  const giorni = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lunedi.getTime() + i * 86400000), dataISO = isoDiData(d);
    giorni.push({ dataISO, wd: GG_ISO[i], nomeGiorno: GG_FULL[i], oggi: dataISO === oggiISO(), sedute: seduteDelGiorno(dataISO, false) });
  }
  return giorni;
}
// posizione nel programma madre oggi (per la card "Dove sei nel programma") — null se nessun mesociclo attivo
function posizioneProgramma() {
  const oggi = oggiISO();
  const a = (typeof atletaCorrente === "function") ? atletaCorrente() : null;
  const pa = mesoAttivo(_progPista(a), oggi, false) || mesoAttivo(_progPal(a), oggi, false);
  if (!pa) return null;
  const m = pa.m, tot = nSettDi(m), sett = pa.settIdx + 1;
  const inizio = new Date(m.inizio + "T00:00:00");
  const fine = new Date(inizio.getTime() + (tot * 7 - 1) * 86400000);
  const fmt = d => d.getDate() + " " + MESI_FULL[d.getMonth()].slice(0, 3);
  return {
    titolo: m.ciclo || m.blocco || m.focus || "Programma in corso",
    sett, tot, dal: fmt(inizio), al: fmt(fine)
  };
}

// riepilogo breve di una seduta generata
function riepilogoSeduta(s) {
  if (s.tipo === "pista") return (s.elementi || []).map(e =>
    e.min != null ? `${e.min}′ ${e.mezzo || "continuo"}` : `${e.ripetute}×${e.distanza} m`).join(" · ");
  return (s.esercizi || []).slice(0, 3).map(e => e.nome).join(" · ") + ((s.esercizi || []).length > 3 ? "…" : "");
}

// allinea un eventuale programma DEMO alla settimana reale del browser (solo per l'anteprima demo)
function allineaDemoProgramma() {
  const lunISO = (() => { const b = new Date(); const off = (b.getDay() + 6) % 7; const l = new Date(b.getTime() - off * 86400000); return isoDiData(l); })();
  [DEMO.pista, DEMO.palestra].forEach(root => {
    if (!root) return;
    const progs = root.mesocicli ? [root] : Object.keys(root).map(k => root[k]);
    progs.forEach(prog => ((prog && prog.mesocicli) || []).forEach(m => { if (m._demo) m.inizio = lunISO; }));
  });
}
