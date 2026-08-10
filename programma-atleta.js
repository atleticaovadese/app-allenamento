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

function generaSedutaPista(g, giornoNum, settIdx, dataISO, meso) {
  const sett = g.settimane && g.settimane[settIdx];
  const righe = ((sett && sett.righe) || []).filter(r => r.distanza && Number(r.n) > 0);
  if (!righe.length) return null;
  const elementi = righe.map((r, i) => {
    const n = Number(r.n), t = typeof pistaTempo === "function" ? pistaTempo(r.distanza, r.perc) : null;
    return { id: "e" + i, contenuto: r.contenuto || "", distanza: Number(r.distanza), ripetute: n, percentuale: Number(r.perc) || null, recupero: r.rec || "", target: t != null ? Math.round(t * 100) / 100 : null, tempi: Array(n).fill(null) };
  });
  return _cacheSeduta({
    id: "gen-p-" + dataISO + "-g" + giornoNum, tipo: "pista", giorno: giornoNum, quando: "", data: dataLunga(dataISO),
    focus: (meso && meso.focus) || "", obiettivi: "", notaCoach: (sett && sett.nota) || "", riscaldamento: [],
    elementi, durata: null, rpe: null, fastidi: false, chiusa: false
  });
}
function generaSedutaPal(g, giornoNum, settIdx, dataISO, meso) {
  const sett = g.settimane && g.settimane[settIdx];
  const righe = ((sett && sett.righe) || []).filter(r => r.esercizio);
  if (!righe.length) return null;
  const esercizi = righe.map((r, i) => {
    const serie = Number(r.serie) || 0, peso = typeof palPeso === "function" ? palPeso(r) : null;
    const rec = String(r.rec || ""), recSec = rec.indexOf("'") >= 0 ? (parseFloat(rec) * 60) : (parseInt(rec) || null);
    return { id: "x" + i, nome: r.esercizio, serie, rep: Number(r.rep) || 0, percentuale: Number(r.perc) || null, peso, tut: r.tut || "", vbtTarget: r.vbt ? Number(r.vbt) : null, recuperoSec: recSec, vbt: Array(serie).fill(null) };
  });
  return _cacheSeduta({
    id: "gen-l-" + dataISO + "-g" + giornoNum, tipo: "palestra", giorno: giornoNum, quando: "", data: dataLunga(dataISO),
    focus: (meso && meso.focus) || "", obiettivi: "", notaCoach: (sett && sett.nota) || "", riscaldamento: [],
    esercizi, durata: null, rpe: null, fastidi: false, chiusa: false
  });
}

// sedute (pista + palestra) del programma madre per una data
function seduteDelGiorno(dataISO, clamp) {
  const wd = GG_ISO[wdIdx(dataISO)], out = [];
  const pa = mesoAttivo(DEMO.pista, dataISO, clamp);
  if (pa) (pa.m.giorni || []).forEach((g, gi) => { if (g.giornoSett === wd) { const s = generaSedutaPista(g, gi + 1, pa.settIdx, dataISO, pa.m); if (s) out.push(s); } });
  const pl = mesoAttivo(DEMO.palestra, dataISO, clamp);
  if (pl) (pl.m.giorni || []).forEach((g, gi) => { if (g.giornoSett === wd) { const s = generaSedutaPal(g, gi + 1, pl.settIdx, dataISO, pl.m); if (s) out.push(s); } });
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
// riepilogo breve di una seduta generata
function riepilogoSeduta(s) {
  if (s.tipo === "pista") return (s.elementi || []).map(e => `${e.ripetute}×${e.distanza} m`).join(" · ");
  return (s.esercizi || []).slice(0, 3).map(e => e.nome).join(" · ") + ((s.esercizi || []).length > 3 ? "…" : "");
}

// allinea un eventuale programma DEMO alla settimana reale del browser (solo per l'anteprima demo)
function allineaDemoProgramma() {
  const lunISO = (() => { const b = new Date(); const off = (b.getDay() + 6) % 7; const l = new Date(b.getTime() - off * 86400000); return isoDiData(l); })();
  [DEMO.pista, DEMO.palestra].forEach(prog => {
    ((prog && prog.mesocicli) || []).forEach(m => { if (m._demo) m.inizio = lunISO; });
  });
}
