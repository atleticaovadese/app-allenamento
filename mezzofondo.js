// MODULO MEZZOFONDO / FONDO — fedele all'Excel "Programma Mezzofondo".
// Fase 1a: RITMI TARGET — dai PB (800/1500/3000/5000/10000) ai ritmi di allenamento per ogni "mezzo".

// distanza → km (per il ritmo /km)
const MZ_KM = { "800 m": 0.8, "1500 m": 1.5, "3000 m": 3, "5000 m": 5, "10000 m": 10 };
const MZ_DIST = ["800 m", "1500 m", "3000 m", "5000 m", "10000 m"];
// offset (sec/km) editabili, come nel foglio Ritmi target
const MZ_OFFSET_DEF = { lungo: 100, medio: 48, soglia: 30, subsoglia: 40, vo2: -8, potlatt: -12, vel: -30 };
const MZ_OFFSET_LABEL = [
  ["lungo", "Lungo (da 5000)"], ["medio", "Medio M (da 10000)"], ["soglia", "Soglia T (da 10000)"],
  ["subsoglia", "Sub-soglia (da 10000)"], ["vo2", "VO2max I (da 3000)"], ["potlatt", "Pot. lattacida (da 800)"], ["vel", "Velocità (da 800)"]
];
// i 13 mezzi (l'ordine e i nomi usati anche dalla Pista mezzofondo)
const MZ_MEZZI = ["Rigenerazione", "Lungo", "Medio / maratona", "Soglia LT2 (tempo)", "Sub-soglia", "VO2max",
  "Ritmo gara 1500", "Ritmo gara 5000", "Ritmo gara 10000", "Capacità lattacida", "Potenza lattacida", "Velocità", "Forza-economia"];
// scala dei mezzi: sensazione + a cosa serve (spiegazione in fondo, come nell'Excel)
const MZ_SCALA = [
  ["Rigenerazione", "molto facile, quasi passeggiata", "recupero attivo, NON allena"],
  ["Lungo (Easy)", "ci parli tranquillo", "base aerobica: cuore, capillari, mitocondri"],
  ["Medio / maratona", "frasi brevi, controllato-duro", "resistenza aerobica forte, supporto alla soglia"],
  ["Soglia LT2 (T)", "comodamente duro (~1h di gara)", "alza la SOGLIA = il ritmo che tieni a lungo"],
  ["Sub-soglia", "un filo più facile della soglia", "tanto volume di soglia SENZA sfinirti (metodo norvegese)"],
  ["VO2max (I)", "molto duro, niente parole", "potenza aerobica: il motore massimo (VO2max)"],
  ["Ritmo gara (1500/5k/10k)", "al ritmo esatto di gara", "specificità: abituarsi al ritmo di gara"],
  ["Capacità lattacida", "bruci, gambe acide", "tollerare l'acido: gara 800/1500"],
  ["Potenza lattacida", "quasi massimale, breve", "massima energia lattacida (800)"],
  ["Velocità", "veloce ma sciolto, senza acido", "velocità pura ed economia neuromuscolare"],
  ["Forza-economia", "palestra / collinari", "economia di corsa e prevenzione"]
];

// stringa "mm:ss" o "m:ss" → secondi; numero → numero
function _mzToSec(x) {
  if (x === "" || x == null) return null;
  x = String(x).replace(",", ".").trim();
  if (x.indexOf(":") >= 0) { const p = x.split(":"); const s = Number(p[0]) * 60 + Number(p[1]); return isNaN(s) ? null : s; }
  const n = Number(x); return isNaN(n) ? null : n;
}
function _mzMMSS(sec) { if (sec == null || isNaN(sec)) return "—"; sec = Math.round(sec); const m = Math.floor(sec / 60); return m + ":" + String(sec % 60).padStart(2, "0"); }
// PB in secondi dell'atleta per una distanza-ancora esatta (il migliore)
function _mzPbSec(atleta, dist) {
  if (!atleta || !atleta.scheda) return null;
  const vals = (atleta.scheda.pb || []).filter(r => r && r[0] === dist && r[1] != null && r[1] !== "")
    .map(r => _mzToSec(r[1])).filter(v => v != null && v > 0);
  return vals.length ? Math.min(...vals) : null;
}
// km di TUTTE le distanze di mezzofondo (per convertire un PB qualsiasi in un ritmo-ancora)
const MZ_KM_ALL = {
  "600 m": 0.6, "800 m": 0.8, "1000 m": 1.0, "1200 m": 1.2, "1500 m": 1.5, "1 miglio": 1.609, "2000 m": 2.0,
  "2000 siepi": 2.0, "3000 m": 3.0, "3000 siepi": 3.0, "5000 m": 5.0, "10000 m": 10.0, "10 km strada": 10.0,
  "Mezza maratona": 21.0975, "Maratona": 42.195
};
// tutti i PB di mezzofondo dell'atleta (migliore per distanza) → [{dist, km, sec}]
function _mzAllPb(atleta) {
  if (!atleta || !atleta.scheda) return [];
  const best = {};
  (atleta.scheda.pb || []).forEach(r => {
    if (!r) return; const d = r[0], km = MZ_KM_ALL[d]; if (km == null) return;
    const sec = _mzToSec(r[1]); if (sec == null || sec <= 0) return;
    if (best[d] == null || sec < best[d]) best[d] = sec;
  });
  return Object.keys(best).map(d => ({ dist: d, km: MZ_KM_ALL[d], sec: best[d] }));
}
// PB (sec) all'ancora: manuale → esatto → STIMA (Riegel T2=T1·(D2/D1)^1.06) dal PB più vicino. → {sec, stimato, da} o null
function _mzAnchorSec(atleta, dist, manualPb) {
  if (manualPb && manualPb[dist] != null && manualPb[dist] !== "") { const s = _mzToSec(manualPb[dist]); if (s != null && s > 0) return { sec: s, stimato: false }; }
  const exact = _mzPbSec(atleta, dist);
  if (exact != null) return { sec: exact, stimato: false };
  const all = _mzAllPb(atleta);
  if (!all.length) return null;
  const tKm = MZ_KM[dist];
  let best = null, gap = Infinity;
  all.forEach(p => { const g = Math.abs(Math.log(p.km) - Math.log(tKm)); if (g < gap) { gap = g; best = p; } });
  return { sec: best.sec * Math.pow(tKm / best.km, 1.06), stimato: true, da: best.dist };
}

// motore ritmi: restituisce [{mezzo, secKm, mmss, rif, zona}] per l'atleta (o coi PB manuali in opts.pb)
function ritmiTarget(atleta, opts) {
  opts = opts || {};
  const ob = Number(opts.obiettivo) || 0;
  const off = Object.assign({}, MZ_OFFSET_DEF, opts.offsets || {});
  // PB all'ancora: manuale → esatto → stima Riegel da un altro PB (così basta un PB qualsiasi per avere i ritmi)
  const km = d => { const a = _mzAnchorSec(atleta, d, opts.pb); return a == null ? null : a.sec / MZ_KM[d]; };
  const P = d => { const k = km(d); return k == null ? null : k - ob; };          // /km sec, con obiettivo
  const p800 = P("800 m"), p1500 = P("1500 m"), p3000 = P("3000 m"), p5000 = P("5000 m"), p10000 = P("10000 m");
  const or = (...xs) => { for (const x of xs) { if (x != null && !isNaN(x)) return x; } return null; };
  const add = (b, d) => b == null ? null : b + d;
  // soglia REALE dal Test lattato (vLT2 OBLA, km/h → sec/km): esplicita (opts) o dal test salvato dell'atleta
  let lt2 = (opts.useLT2 && opts.vLT2) ? 3600 / opts.vLT2 : null;
  if (lt2 == null && opts.useLT2 !== false) { const vt = (typeof vLT2diAtleta === "function") ? vLT2diAtleta(atleta) : null; if (vt) lt2 = 3600 / vt; }
  const _mtLT2 = (typeof metodoLT2diAtleta === "function") ? metodoLT2diAtleta(atleta) : null;
  const rifSoglia = lt2 == null ? "10000 +30 / test" : (_mtLT2 ? "Test · " + (_mtLT2 === "obla" ? "OBLA 4" : "Dmax") : "Test lattato (vLT2)");
  const M = [
    ["Rigenerazione", or(add(p5000, off.lungo + 20)), "5000 +120", "Z1 <1.5"],
    ["Lungo", or(add(p5000, off.lungo)), "5000 +100", "Z1-2 1-2"],
    ["Medio / maratona", or(add(p10000, off.medio), add(p5000, 55)), "10000 +48", "Z2 2-2.5"],
    ["Soglia LT2 (tempo)", or(lt2, add(p10000, off.soglia), add(p5000, 33)), rifSoglia, "Z3 2.5-4"],
    ["Sub-soglia", or(add(p10000, off.subsoglia), add(p5000, 43)), "10000 +40", "Z3 2-2.5"],
    ["VO2max", or(p3000, add(p5000, off.vo2)), "3000 (~vVO2max)", "Z4-5 3.5-8"],
    ["Ritmo gara 1500", or(p1500), "PB 1500", "gara"],
    ["Ritmo gara 5000", or(p5000), "PB 5000", "gara"],
    ["Ritmo gara 10000", or(p10000), "PB 10000", "gara"],
    ["Capacità lattacida", or(p800, add(p1500, -10)), "PB 800", "Z6 8-12"],
    ["Potenza lattacida", or(add(p800, off.potlatt)), "800 -12", "Z6+ >12"],
    ["Velocità", or(add(p800, off.vel)), "800 -30", "Z7"],
    ["Forza-economia", null, "colli / pesi / pliometria", "forza"]
  ];
  return M.map(([mezzo, sec, rif, zona]) => ({ mezzo, secKm: sec, mmss: _mzMMSS(sec), rif, zona }));
}
// ritmo /km (secondi) di un singolo mezzo per un atleta — usato dalla Pista mezzofondo
function ritmoMezzo(atleta, mezzo, opts) {
  const r = ritmiTarget(atleta, opts).find(x => x.mezzo === mezzo);
  return r ? r.secKm : null;
}

// solo gli atleti del gruppo Mezzofondo/Fondo (per non cercarli in mezzo a tutti)
function atletiMezzo() { return (DEMO.atleti || []).filter(a => (typeof gruppoDi === "function") ? gruppoDi(a) === "mezzo" : true); }
// <option> degli atleti mezzofondo + flag se la lista è vuota
function _optAtletiMezzo(selId, vuotoLabel) {
  const arr = atletiMezzo();
  const first = `<option value="">${vuotoLabel}</option>`;
  return first + arr.map(x => `<option value="${x.id}" ${selId === x.id ? "selected" : ""}>${x.nome}</option>`).join("");
}
const _MZ_NO_ATLETI = `<p class="et" style="margin-top:8px">Nessun atleta <b>Mezzofondo/Fondo</b>: impostane la disciplina in <b>Atleti</b> e ricompariranno qui.</p>`;

// ---------- vista: Ritmi target (Analisi) ----------
let mzState = { atletaRif: "", pb: {}, obiettivo: 0, offsets: {}, avanzato: false };
// selezione atleta: prende (e MOSTRA) i suoi PB mezzofondo, modificabili
function setMzAtleta(id) {
  mzState.atletaRif = id; mzState.pb = {};
  const a = id ? DEMO.atleti.find(x => x.id === id) : null;
  if (a) MZ_DIST.forEach(d => { const s = _mzPbSec(a, d); if (s != null) mzState.pb[d] = _mzMMSS(s); });
  disegna();
}
function setMzPbVal(d, v) { mzState.pb[d] = v; }
function setMzObiVal(v) { mzState.obiettivo = v; }
function setMzOffVal(k, v) { mzState.offsets[k] = v === "" ? undefined : Number(v); }
function toggleMzAvanzato() { mzState.avanzato = !mzState.avanzato; disegna(); }
// attiva/disattiva l'uso del vLT2 (Test lattato) per la Soglia dei Ritmi
function toggleMzUsaLT2() {
  const aid = mzState.atletaRif;
  if (!aid || !DEMO.lattato || !DEMO.lattato[aid]) return;
  DEMO.lattato[aid].usaLT2 = !(DEMO.lattato[aid].usaLT2 !== false);
  if (typeof salvaCustom === "function") salvaCustom();
  disegna();
}

function vistaRitmiMezzofondo() {
  const a = mzState.atletaRif ? DEMO.atleti.find(x => x.id === mzState.atletaRif) : null;
  const opts = { obiettivo: mzState.obiettivo, offsets: mzState.offsets, pb: mzState.pb };
  const righe = ritmiTarget(a, opts);
  const off = Object.assign({}, MZ_OFFSET_DEF, mzState.offsets || {});

  const tabMezzi = `<div class="p-scroll"><table class="ptab pista-w">
    <thead><tr><th>Mezzo</th><th>Ritmo /km</th><th>Riferimento</th><th>Zona / lattato</th></tr></thead>
    <tbody>${righe.map(r => `<tr><td>${r.mezzo}</td><td class="pauto"><b>${r.mmss}</b></td><td>${r.rif}</td><td>${r.zona}</td></tr>`).join("")}</tbody>
  </table></div>`;

  const tabScala = `<div class="p-scroll"><table class="ptab pista-w">
    <thead><tr><th>Mezzo</th><th>Sensazione</th><th>A cosa serve</th></tr></thead>
    <tbody>${MZ_SCALA.map(([m, s, c]) => `<tr><td><b>${m}</b></td><td>${s}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table></div>`;

  const pbInputs = MZ_DIST.map(d => {
    const stored = a ? _mzPbSec(a, d) : null;
    const ph = stored != null ? _mzMMSS(stored) : "mm:ss";
    return `<div><label class="lab">PB ${d}</label>
      <input value="${(mzState.pb[d] || "").toString().replace(/"/g, "&quot;")}" placeholder="${ph}" inputmode="text"
        oninput="setMzPbVal('${d}',this.value)" onchange="disegna()" style="margin-top:6px"></div>`;
  }).join("");

  const offInputs = MZ_OFFSET_LABEL.map(([k, l]) => `<div><label class="lab">${l}</label>
    <input inputmode="numeric" value="${off[k]}" oninput="setMzOffVal('${k}',this.value)" onchange="disegna()" style="margin-top:6px"></div>`).join("");

  // diagnostica PB: cosa trova, cosa manca, se sta stimando (così non "non esce niente" senza spiegazione)
  const manualiSet = Object.keys(mzState.pb).filter(k => mzState.pb[k]);
  const allPb = a ? _mzAllPb(a) : [];
  const anchorsEsatti = a ? MZ_DIST.filter(d => _mzPbSec(a, d) != null) : [];
  const altri = allPb.filter(p => MZ_DIST.indexOf(p.dist) < 0);
  let diag = "";
  if (a) {
    if (allPb.length === 0 && manualiSet.length === 0) {
      diag = `<p class="et" style="margin-top:10px;padding:9px 11px;background:rgba(240,168,60,.12);border-radius:8px"><b>⚠ ${a.nome} non ha PB di mezzofondo.</b> Inseriscine almeno uno in <b>Atleti → PB</b> (800/1500/3000/5000/10000, oppure 1000/2000/5 km…): i ritmi si calcolano da lì.</p>`;
    } else if (anchorsEsatti.length === 0 && altri.length) {
      diag = `<p class="et" style="margin-top:10px;padding:9px 11px;background:rgba(59,130,246,.10);border-radius:8px">Ritmi <b>stimati</b> dai PB disponibili (${altri.map(p => p.dist + " " + _mzMMSS(p.sec)).join(", ")}) con la formula di Riegel. Per più precisione aggiungi un PB su <b>1500/3000/5000</b>.</p>`;
    } else if (anchorsEsatti.length) {
      diag = `<p class="et" style="margin-top:10px;color:var(--verde)">✓ PB usati: ${anchorsEsatti.map(d => d + " " + _mzMMSS(_mzPbSec(a, d))).join(", ")}${altri.length ? ` · altri: ${altri.map(p => p.dist).join(", ")}` : ""}.</p>`;
    }
  }

  // soglia dal Test lattato (se l'atleta ha un test valido): mostra e permette di attivarla/disattivarla
  const Rlat = a ? analisiLattato((DEMO.lattato && DEMO.lattato[a.id]) || {}, a) : null;
  const hasTest = Rlat && Rlat.vLT2 != null;
  const usaTest = a && DEMO.lattato && DEMO.lattato[a.id] && DEMO.lattato[a.id].usaLT2 !== false;
  const metodoT = (a && DEMO.lattato && DEMO.lattato[a.id]) ? (DEMO.lattato[a.id].metodo || "dmax") : "dmax";
  const effObla = (metodoT === "obla") || (Rlat && Rlat.vLT2dmax == null);   // Dmax se disponibile e scelto, altrimenti OBLA
  const vUsata = Rlat ? (effObla ? Rlat.vLT2 : Rlat.vLT2dmax) : null;
  const metodoNome = effObla ? "OBLA 4" : "Dmax";
  const bloccoTest = hasTest ? `<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:12px;border-top:1px solid var(--line)">
      <div><span class="lab">Soglia dal Test lattato · <b>${metodoNome}</b></span><p class="et" style="margin:2px 0 0">soglia = <b>${_mzMMSS(3600 / vUsata)}/km</b> · ${usaTest ? "usata per la Soglia" : "stima dai PB in uso"}<br><span style="color:var(--txt3)">cambi metodo nel Test lattato</span></p></div>
      <button class="btn ${usaTest ? "btn-1" : "btn-2"}" style="width:auto;padding:9px 14px" onclick="toggleMzUsaLT2()">${usaTest ? "✓ Attivo" : "Usa vLT2"}</button>
    </div>` : "";

  return `
  <div class="card"><h3>Ritmi target — mezzofondo/fondo</h3>
    <p class="et" style="margin-top:2px">Dai PB (800/1500/3000/5000/10000) ai <b>ritmi di allenamento</b> per ogni mezzo. In Pista scegli il mezzo e il ritmo/km arriva da qui.</p></div>

  <div class="card">
    <label class="lab">Atleta (prende i suoi PB)</label>
    <select onchange="setMzAtleta(this.value)" style="margin-top:6px">${_optAtletiMezzo(mzState.atletaRif, "— a mano —")}</select>
    ${atletiMezzo().length === 0 ? _MZ_NO_ATLETI : ""}
    <p class="et" style="margin:10px 0 4px">Scegli l'atleta: prende i suoi PB (modificabili qui sotto). Senza atleta puoi metterli a mano.</p>
    <div class="griglia2">${pbInputs}</div>
    ${diag}
    <div style="margin-top:12px"><label class="lab">Obiettivo: ritmi più veloci di (sec/km)</label>
      <input inputmode="numeric" value="${mzState.obiettivo || 0}" oninput="setMzObiVal(this.value)" onchange="disegna()" placeholder="0" style="margin-top:6px">
      <p class="et" style="margin-top:6px">0 = ritmi sul livello attuale (PB). Es. 3 = programma 3″/km più veloce (progressione).</p></div>
    ${bloccoTest}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Ritmi di allenamento (/km) per mezzo</p>
    ${tabMezzi}
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="toggleMzAvanzato()">${mzState.avanzato ? "Nascondi" : "⚙ Offset avanzati"}</button>
    ${mzState.avanzato ? `<p class="et" style="margin:10px 0 4px">Offset (sec/km) — tara i ritmi sull'atleta.</p><div class="griglia2">${offInputs}</div>` : ""}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Scala dei mezzi — sensazione e a cosa serve (dal lento al veloce)</p>
    ${tabScala}
    <p class="et" style="margin-top:8px">Quando avrai fatto il <b>Test lattato</b>, potrai usare la soglia reale (vLT2) al posto della stima dai PB.</p>
  </div>`;
}

// ============================================================================
// PISTA MEZZOFONDO — editor del programma madre per il gruppo "mezzo".
// Righe: warm-up · Mezzo (tendina) · Distanza+n° (ripetute) OPPURE Min (continuo) · Rec.
// Ritmo/km (dal mezzo sul PB), Tempo per ripetuta e Volume (m) escono da soli.
// ============================================================================
const MZ_BLOCCHI = ["Prep. generale (base)", "Prep. speciale", "Pre-competitiva", "Competitiva", "Transizione"];

function _mzPistaOpts(p) { return { obiettivo: Number(p.mzObiettivo) || 0, offsets: p.mzOffsets || {}, pb: p.mzPb || {} }; }
function _mzPistaRef(p) { return p.atletaRif ? DEMO.atleti.find(x => x.id === p.atletaRif) : null; }
function _mzRigaSec(p, r) { return r.mezzo ? ritmoMezzo(_mzPistaRef(p), r.mezzo, _mzPistaOpts(p)) : null; }
// volume (m) della settimana per il mezzo: continuo = min×ritmo→metri, ripetute = dist×n°
function volumeSettMezzo(sett, p) {
  return (sett.righe || []).reduce((t, r) => {
    if (Number(r.min) > 0) { const s = _mzRigaSec(p, r); return t + (s != null ? Math.round(Number(r.min) * 60000 / s) : 0); }
    if (r.distanza && r.n) return t + Number(r.distanza) * Number(r.n);
    return t;
  }, 0);
}
// handlers header (operano sul programma del gruppo corrente)
function setMzPistaPbVal(d, v) { const p = pistaInit(); p.mzPb = p.mzPb || {}; p.mzPb[d] = v; savePista(); }
function setMzPistaObiVal(v) { pistaInit().mzObiettivo = v; savePista(); }
function setMzPistaOffVal(k, v) { const p = pistaInit(); p.mzOffsets = p.mzOffsets || {}; p.mzOffsets[k] = v === "" ? undefined : Number(v); savePista(); }
function toggleMzPistaAvanzato() { S.mzPistaAvanzato = !S.mzPistaAvanzato; disegna(); }

function vistaProgrammaPistaMezzo() {
  const p = pistaInit();
  if (S.pistaMeso >= p.mesocicli.length) S.pistaMeso = 0;
  const m = p.mesocicli[S.pistaMeso];
  const g = m.giorni[S.pistaGiorno];
  const refA = _mzPistaRef(p);
  const off = Object.assign({}, MZ_OFFSET_DEF, p.mzOffsets || {});
  const optSel = (val, arr) => arr.map(x => `<option value="${String(x).replace(/"/g, "&quot;")}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`).join("");

  const pbInputs = MZ_DIST.map(d => {
    const st = refA ? _mzPbSec(refA, d) : null;
    const ph = st != null ? _mzMMSS(st) : "mm:ss";
    return `<div><label class="lab">PB ${d}</label>
      <input value="${((p.mzPb || {})[d] || "").toString().replace(/"/g, "&quot;")}" placeholder="${ph}" inputmode="text"
        oninput="setMzPistaPbVal('${d}',this.value)" onchange="disegna()" style="margin-top:6px"></div>`;
  }).join("");
  const offInputs = MZ_OFFSET_LABEL.map(([k, l]) => `<div><label class="lab">${l}</label>
    <input inputmode="numeric" value="${off[k]}" oninput="setMzPistaOffVal('${k}',this.value)" onchange="disegna()" style="margin-top:6px"></div>`).join("");

  // se l'atleta di riferimento ha un Test lattato attivo: scelta Dmax/OBLA proprio qui (vale per i SUOI allenamenti)
  const RlatP = refA ? analisiLattato((DEMO.lattato && DEMO.lattato[refA.id]) || {}, refA) : null;
  const testAttivo = refA && DEMO.lattato && DEMO.lattato[refA.id] && DEMO.lattato[refA.id].usaLT2 !== false && RlatP && RlatP.vLT2 != null;
  const metP = (refA && DEMO.lattato && DEMO.lattato[refA.id]) ? (DEMO.lattato[refA.id].metodo || "dmax") : "dmax";
  const bloccoMetP = testAttivo ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
        <span class="lab">Soglia di ${refA.nome} (dal Test lattato)</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          <button class="btn ${metP === "dmax" ? "btn-1" : "btn-2"}" style="width:auto;padding:7px 12px" onclick="setLatMetodoFor('${refA.id}','dmax')">Dmax${RlatP.ritmoDmax ? " · " + RlatP.ritmoDmax : ""}</button>
          <button class="btn ${metP === "obla" ? "btn-1" : "btn-2"}" style="width:auto;padding:7px 12px" onclick="setLatMetodoFor('${refA.id}','obla')">OBLA 4${RlatP.ritmoLT2 ? " · " + RlatP.ritmoLT2 : ""}</button>
        </div>
        <p class="et" style="margin-top:6px">Cambia la soglia negli allenamenti di <b>${refA.nome}</b>. Ogni atleta ha la sua (anche dal Test lattato).</p>
      </div>` : "";

  const testa = `
    <div class="card"><h3>Programma Pista — mezzofondo / fondo</h3>
      <p class="et" style="margin-top:2px">Scegli il <b>mezzo</b> e metti <b>distanza + n°</b> (ripetute) <b>oppure i minuti</b> (corsa continua). Ritmo/km, tempo per ripetuta e volume escono da soli dal PB (motore <b>Ritmi target</b>).</p>
      <p class="et" style="margin-top:8px;color:var(--verde)">✓ Si salva da solo. Ogni atleta vedrà i ritmi calcolati sul <b>suo</b> PB.</p></div>
    <div class="card">
      <label class="lab">Riferimento ritmi (solo anteprima)</label>
      <select onchange="setPistaTop('atletaRif',this.value)" style="margin-top:6px">${_optAtletiMezzo(p.atletaRif, "🎯 Programma madre (PB a mano)")}</select>
      <p class="et" style="margin:10px 0 4px">PB per distanza (mm:ss). Vuoto = usa quello dell'atleta di riferimento, se scelto.</p>
      <div class="griglia2">${pbInputs}</div>
      <div style="margin-top:12px"><label class="lab">Obiettivo: ritmi più veloci di (sec/km)</label>
        <input inputmode="numeric" value="${p.mzObiettivo || 0}" oninput="setMzPistaObiVal(this.value)" onchange="disegna()" placeholder="0" style="margin-top:6px"></div>
      ${bloccoMetP}
      <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:12px" onclick="toggleMzPistaAvanzato()">${S.mzPistaAvanzato ? "Nascondi offset" : "⚙ Offset avanzati"}</button>
      ${S.mzPistaAvanzato ? `<p class="et" style="margin:10px 0 4px">Offset (sec/km) — tara i ritmi.</p><div class="griglia2">${offInputs}</div>` : ""}
    </div>`;

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
          <select onchange="setPistaMeso('ciclo',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.ciclo, (typeof CICLI !== "undefined" ? CICLI : []))}</select></div>
        <div><label class="lab">Inizio Sett. 1</label>
          <input type="date" value="${m.inizio || ""}" onchange="setPistaMeso('inizio',this.value)" style="margin-top:6px"></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Blocco (corsa)</label>
          <select onchange="setPistaMeso('blocco',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.blocco, MZ_BLOCCHI)}</select></div>
        <div><label class="lab">Focus mesociclo</label>
          <input value="${(m.focus || "").replace(/"/g, "&quot;")}" placeholder="Es. costruzione aerobica" oninput="setPistaMesoVal('focus',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      </div>
      <p class="et" style="margin-top:10px">${m.ciclo ? `<b style="color:var(--txt)">${nSett} settimane</b> (ciclo ${m.ciclo}) · l'ultima è di scarico` : "Scegli un ciclo (o dal Piano & Picco) per sapere quante settimane sono e quale è lo scarico."}</p>
    </div>`;

  const tabGiorno = `<div class="tabbar">${m.giorni.map((_, i) =>
    `<button class="${i === S.pistaGiorno ? "on" : ""}" onclick="selGiorno(${i})">Giorno ${i + 1}</button>`).join("")}</div>`;
  const testaGiorno = `<div class="card">
      <label class="lab">Giorno della settimana</label>
      <select onchange="setPistaGiorno('giornoSett',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(g.giornoSett, ["lun", "mar", "mer", "gio", "ven", "sab", "dom"])}</select>
      <label class="lab" style="display:block;margin-top:12px">Riscaldamento</label>
      <button class="btn btn-2" style="margin-top:6px;text-align:left" onclick="apriRiscPista()">${riscRiassunto(g)}</button>
    </div>`;

  const listaSett = settimaneDelGiorno(m, g);
  const copiaBtn = listaSett.length > 1
    ? `<button class="btn btn-2" style="margin-bottom:11px" onclick="pistaCopiaSettimana()">⧉ Copia settimana 1 sulle altre${m.ciclo && m.ciclo !== "1" ? " (scarico −50% auto)" : ""}</button>`
    : "";
  const settimane = listaSett.map((sett, s) => {
    const scar = isScaricoIdx(m, s);
    const nota = (sett.nota || "").trim();
    const righe = sett.righe.map((r, i) => {
      const sec = _mzRigaSec(p, r);
      const cont = Number(r.min) > 0;
      const ritmoKm = sec != null ? _mzMMSS(sec) : "—";
      const tempoRip = cont ? (r.min + "′") : (r.distanza && sec != null ? _mzMMSS((Number(r.distanza) / 1000) * sec) : "—");
      const vol = cont ? (sec != null ? Math.round(Number(r.min) * 60000 / sec) : null) : ((r.distanza && r.n) ? Number(r.distanza) * Number(r.n) : null);
      return `<tr>
        <td><input value="${(r.contenuto || "").replace(/"/g, "&quot;")}" placeholder="warm-up / focus" oninput="setPistaRigaVal(${s},${i},'contenuto',this.value)" style="min-width:110px"></td>
        <td><select onchange="setPistaRiga(${s},${i},'mezzo',this.value)"><option value="">—</option>${optSel(r.mezzo, MZ_MEZZI)}</select></td>
        <td><input inputmode="numeric" value="${r.distanza || ""}" placeholder="m" oninput="setPistaRigaVal(${s},${i},'distanza',this.value)" onchange="disegna()" style="min-width:58px"></td>
        <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setPistaRigaVal(${s},${i},'n',this.value)" onchange="disegna()" style="min-width:46px"></td>
        <td><input inputmode="numeric" value="${r.min || ""}" placeholder="min" oninput="setPistaRigaVal(${s},${i},'min',this.value)" onchange="disegna()" style="min-width:50px"></td>
        <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setPistaRigaVal(${s},${i},'rec',this.value)" style="min-width:58px"></td>
        <td class="pauto"><b>${ritmoKm}</b></td>
        <td class="pauto">${tempoRip}</td>
        <td class="pauto">${vol != null ? vol.toLocaleString("it-IT") : "—"}</td>
        <td><button class="chiudi" style="font-size:14px" onclick="pistaDelRiga(${s},${i})" aria-label="Rimuovi">✕</button></td>
      </tr>`;
    }).join("");
    const volS = volumeSettMezzo(sett, p);
    return `<div class="card"${scar ? ' style="border-color:rgba(240,168,60,.45)"' : ""}>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <p style="font-weight:600;font-size:13px;margin:0">Settimana ${s + 1}</p>
        ${scar ? '<span class="pill p-giallo">scarico</span>' : ""}
      </div>
      <div class="p-scroll"><table class="ptab pista-w">
        <thead><tr><th>Warm-up / focus</th><th>Mezzo</th><th>Dist (m)</th><th>n°</th><th>Min</th><th>Rec</th><th>Ritmo /km</th><th>Tempo/rip</th><th>Volume (m)</th><th></th></tr></thead>
        <tbody>${righe}</tbody>
      </table></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="pistaAddRiga(${s})">＋ riga</button>
        <span class="et">Volume: <b style="color:var(--verde);font-size:14px">${volS.toLocaleString("it-IT")} m</b> <span style="color:var(--txt3)">(${Math.round(volS / 100) / 10} km)</span></span>
      </div>
      ${s > 0 && !scar ? `<div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <span class="et" style="margin:0">↑ da sett. ${s} · volume:</span>
        <select id="pgp-${s}" style="padding:7px 8px;width:auto;flex:none">${(typeof PROG_VOL !== "undefined" ? PROG_VOL : [10, 20]).map(o => `<option>${o}</option>`).join("")}</select>
        <button class="btn btn-2" style="width:auto;padding:7px 12px" onclick="applicaProgrPista(${s})">+% applica</button>
      </div>` : ""}
      ${s > 0 && scar ? `<button class="btn btn-2" style="margin-top:8px" onclick="applicaScaricoPista(${s})">⬇ Scarico: volume al 50% della sett. ${s}</button>` : ""}
      <button class="btn btn-2" style="margin-top:8px;text-align:left;font-size:13px" onclick="apriNotaSeduta(${s})">📝 ${nota ? "Nota: " + (nota.length > 42 ? nota.slice(0, 42) + "…" : nota) : "Nota tecnica del giorno"}</button>
    </div>`;
  }).join("");

  return (typeof selettoreProgGruppo === "function" ? selettoreProgGruppo() : "") + testa + tabMeso + testaMeso + tabGiorno + testaGiorno + copiaBtn + settimane;
}

// ---------- generazione seduta mezzofondo per l'atleta (dal madre del gruppo "mezzo") ----------
function _generaSedutaPistaMezzo(g, giornoNum, settIdx, dataISO, meso, atleta, prog, sett, allRighe) {
  const righe = allRighe.filter(r => r.mezzo && ((r.distanza && Number(r.n) > 0) || Number(r.min) > 0));
  if (!righe.length) return null;
  const aid = atleta.id;
  const opts = { obiettivo: (prog && prog.mzObiettivo) || 0, offsets: (prog && prog.mzOffsets) || {} };  // PB = quelli dell'atleta
  const elementi = righe.map((r, i) => {
    const sec = ritmoMezzo(atleta, r.mezzo, opts);
    const cont = Number(r.min) > 0;
    const dist = Number(r.distanza) || 0, n = Number(r.n) || 0;
    const vol = cont ? (sec != null ? Math.round(Number(r.min) * 60000 / sec) : 0) : dist * n;
    const tempoRip = cont ? null : (sec != null && dist ? Math.round((dist / 1000) * sec) : null);
    return {
      id: "e" + i, contenuto: r.contenuto || "", mezzo: r.mezzo, distanza: dist, ripetute: n,
      min: cont ? Number(r.min) : null, ritmoSecKm: sec, ritmoKm: sec != null ? _mzMMSS(sec) : "—",
      tempoRipSec: tempoRip, recupero: r.rec || "", volume: vol
    };
  });
  return _cacheSeduta({
    id: "gen-p-" + aid + "-" + dataISO + "-g" + giornoNum, tipo: "pista", mezzo: true, giorno: giornoNum,
    quando: "", data: dataLunga(dataISO), dataISO: dataISO, atletaId: aid,
    focus: (meso && meso.focus) || "", obiettivi: "", notaCoach: (sett && sett.nota) || "", riscaldamento: [],
    elementi, durata: null, rpe: null, fastidi: false, chiusa: false
  });
}

// ---------- vista atleta: seduta pista mezzofondo (prescrizione da seguire a ritmo) ----------
function volumePistaMezzo(s) { return (s.elementi || []).reduce((t, e) => t + (e.volume || 0), 0); }
function vistaPistaMezzo(s) {
  return `${bloccoRiscaldamento(s)}
  ${s.elementi.map(e => {
    const cont = e.min != null;
    const prescr = cont ? `${e.min}′ in continuo` : `${e.ripetute} × ${e.distanza} m`;
    const tr = e.tempoRipSec != null ? _mzMMSS(e.tempoRipSec) : null;
    const km = e.volume ? Math.round(e.volume / 100) / 10 : 0;
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3>${prescr}</h3>
        <span class="et" style="margin:0">${e.mezzo || ""}</span>
      </div>
      <p class="et" style="margin:4px 0 2px">ritmo <b>${e.ritmoKm}/km</b>${tr ? " · ~" + tr + " a ripetuta" : ""}${e.recupero ? " · rec " + e.recupero : ""}</p>
      <p class="et" style="margin:0">volume ${(e.volume || 0).toLocaleString("it-IT")} m${km ? " · " + km + " km" : ""}</p>
      ${e.contenuto ? `<p class="et" style="margin:6px 0 0">${e.contenuto}</p>` : ""}
    </div>`;
  }).join("")}
  <div class="card" style="display:flex;justify-content:space-between;align-items:center">
    <span class="et" style="margin:0">Volume totale della seduta</span>
    <b style="font-size:17px">${volumePistaMezzo(s).toLocaleString("it-IT")} m</b>
  </div>
  ${bloccoChiusura(s)}`;
}

// ============================================================================
// TEST DEL LATTATO — protocollo a step → LT1/LT2/OBLA + Dmax + prospetto + report.
// Fedele al foglio Excel "Test lattato": passo (min:sec/km) → velocità km/h,
// interpolazione lineare sulla curva, metodo Dmax; il vLT2 alimenta i Ritmi target.
// ============================================================================
function _mzVelKmh(min, sec) { const p = (Number(min) || 0) + (Number(sec) || 0) / 60; return p > 0 ? 60 / p : null; }

// test corrente di un atleta (in DEMO.lattato); crea la struttura se manca
function _latTest(aid) {
  DEMO.lattato = DEMO.lattato || {};
  if (!DEMO.lattato[aid]) DEMO.lattato[aid] = { distStep: 1200, peso: "", lt2Target: 4.0, usaLT2: true, metodo: "dmax", steps: [] };
  const t = DEMO.lattato[aid];
  if (!t.steps) t.steps = [];
  while (t.steps.length < 5) t.steps.push({ min: "", sec: "", fc: "", lat: "", rpe: "" });
  if (t.lt2Target == null) t.lt2Target = 4.0;
  if (t.usaLT2 == null) t.usaLT2 = true;
  if (t.metodo == null) t.metodo = "dmax";   // soglia per i ritmi: Dmax (predefinito, più su misura) o OBLA 4
  return t;
}
function _latSave() { if (typeof salvaCustom === "function") salvaCustom(); }
// metodo soglia scelto per l'atleta ("dmax"/"obla") se il test è valido e attivo, altrimenti null
function metodoLT2diAtleta(atleta) {
  if (!atleta || !atleta.id || !DEMO.lattato || !DEMO.lattato[atleta.id]) return null;
  const t = DEMO.lattato[atleta.id];
  if (t.usaLT2 === false) return null;
  const R = analisiLattato(t, atleta);
  const m = t.metodo || "dmax";
  if (m === "dmax" && R.vLT2dmax == null) return (R.vLT2 != null ? "obla" : null);   // Dmax non disponibile (pochi punti) → ripiega su OBLA
  if (R.vLT2 == null && R.vLT2dmax == null) return null;
  return m;
}
// vLT2 (km/h) dal test dell'atleta col metodo scelto (Dmax predefinito) — usata dai Ritmi target
function vLT2diAtleta(atleta) {
  if (!atleta || !atleta.id || !DEMO.lattato || !DEMO.lattato[atleta.id]) return null;
  const t = DEMO.lattato[atleta.id];
  if (t.usaLT2 === false) return null;
  const R = analisiLattato(t, atleta);
  const m = t.metodo || "dmax";
  const v = (m === "obla") ? R.vLT2 : (R.vLT2dmax != null ? R.vLT2dmax : R.vLT2);   // Dmax, con ripiego su OBLA se manca
  return (v != null && !isNaN(v)) ? v : null;
}

// motore: legge il test → baseline, LT1/LT2, Dmax, ritmi, FC, prospetto
function analisiLattato(test, atleta) {
  test = test || {};
  const lt2T = Number(test.lt2Target) || 4.0;
  const pts = [];
  (test.steps || []).forEach(s => {
    const v = _mzVelKmh(s.min, s.sec);
    const lat = (s.lat === "" || s.lat == null) ? null : Number(String(s.lat).replace(",", "."));
    if (v != null && lat != null && !isNaN(lat)) pts.push({ v, lat, fc: (s.fc === "" || s.fc == null) ? null : Number(s.fc) });
  });
  const n = pts.length, R = { n, pts, lt2Target: lt2T };
  if (!n) return R;
  const V = pts.map(p => p.v), L = pts.map(p => p.lat), H = pts.map(p => p.fc);
  R.baseline = L[0]; R.lt1Target = R.baseline + 0.5; R.lt2Alt = R.baseline + 1.5;
  // Dmax: punto più lontano dalla retta primo→ultimo (metodo più affidabile per LT2)
  if (n >= 3) {
    const V0 = V[0], L0 = L[0], Vn = V[n - 1], Ln = L[n - 1];
    const den = Math.sqrt((Ln - L0) * (Ln - L0) + (Vn - V0) * (Vn - V0));
    let maxD = -1, imax = 0;
    for (let i = 0; i < n; i++) { const d = den > 0 ? Math.abs((Ln - L0) * (V[i] - V0) - (Vn - V0) * (L[i] - L0)) / den : 0; if (d > maxD) { maxD = d; imax = i; } }
    R.vLT2dmax = V[imax]; R.latDmax = L[imax]; R.ritmoDmax = _mzMMSS(3600 / R.vLT2dmax);
    R.retta = { x0: V0, y0: L0, x1: Vn, y1: Ln };
  }
  // interpolazione lineare: valore in ARR quando il lattato = tgt (curva crescente)
  const interp = (tgt, ARR) => {
    if (tgt < L[0]) return null;
    let idx = -1; for (let i = 0; i < n; i++) if (L[i] <= tgt) idx = i;
    if (idx < 0 || idx >= n - 1) return null;
    const llo = L[idx], lhi = L[idx + 1]; if (lhi === llo) return ARR[idx];
    const ylo = ARR[idx], yhi = ARR[idx + 1]; if (ylo == null || yhi == null) return null;
    return ylo + (tgt - llo) / (lhi - llo) * (yhi - ylo);
  };
  R.vLT1 = interp(R.lt1Target, V); R.vLT2 = interp(lt2T, V);
  R.fcLT1 = interp(R.lt1Target, H); R.fcLT2 = interp(lt2T, H);
  R.ritmoLT1 = R.vLT1 != null ? _mzMMSS(3600 / R.vLT1) : null;
  R.ritmoLT2 = R.vLT2 != null ? _mzMMSS(3600 / R.vLT2) : null;
  // prospetto: confronto con la velocità di gara 5000 (dal PB, foglio Atleta)
  const pb5 = atleta ? _mzPbSec(atleta, "5000 m") : null;
  R.vGara5000 = pb5 ? 18000 / pb5 : null;
  R.sogliaGara = (R.vLT2 != null && R.vGara5000) ? R.vLT2 / R.vGara5000 : null;
  R.ampiezza = (R.vLT1 != null && R.vLT2 != null) ? R.vLT1 / R.vLT2 : null;
  R.warn = R.baseline > 2.5 ? "veloce" : (n < 5 ? "pochi" : "ok");
  return R;
}

// spiegazione in parole semplici dell'indicatore "soglia vs ritmo gara"
function _spiegSogliaGara(sg) {
  if (sg == null) return "Dice quanto vai forte alla soglia rispetto al tuo ritmo dei 5000 in gara (di solito 88–92%). Per calcolarlo serve il PB 5000.";
  const p = Math.round(sg * 100);
  if (sg > 0.93) return "ALTA (" + p + "%): in gara corri quasi al ritmo di soglia → il tuo motore aerobico è già forte e ben sfruttato. Per migliorare i tempi lavora SOPRA la soglia (VO2max, tratti a ritmo gara) e sulla velocità.";
  if (sg < 0.86) return "BASSA (" + p + "%): alla soglia vai molto più piano che in gara → hai margine da recuperare. Più sedute di soglia + tanta corsa facile la alzano, e i tempi scendono.";
  return "NELLA NORMA (" + p + "%): buon equilibrio tra soglia e ritmo gara. Mantieni le soglie e aumenta piano il resto.";
}
// spiegazione in parole semplici dell'"ampiezza aerobica"
function _spiegAmpiezza(amp) {
  if (amp == null) return "Dice quanto la tua andatura facile (LT1) è già vicina alla soglia (LT2).";
  const p = Math.round(amp * 100);
  if (amp < 0.8) return "STRETTA (" + p + "%): c'è un bel salto tra il passo facile e la soglia → la base aerobica è ancora povera. Aumenta la corsa LENTA e comoda per allargarla.";
  return "BUONA (" + p + "%): corri comodo già vicino alla soglia → base aerobica sviluppata. Continua con volume facile + soglia.";
}
// testo coaching per disciplina, in parole semplici (spiega anche i termini)
function _latCoach(disc, R) {
  if (R.vLT2 == null) return "(fai il test: inserisci gli step con passo e lattato)";
  const sg = R.sogliaGara, rit = R.ritmoLT2 || "—";
  const baseStretta = (R.ampiezza != null && R.ampiezza < 0.8) ? " In più la tua base è “stretta” (il passo facile è lontano dalla soglia): aggiungi corsa LENTA e comoda per allargarla." : "";
  if (disc === "800") {
    let t = "Per l'800/1500 conta metà il motore aerobico (la soglia) e metà la VELOCITÀ/scatto, che questo test NON misura. ";
    t += sg == null ? "Inserisci il PB 5000 per capire quanto è forte la tua base aerobica. " : (sg < 0.9 ? "La tua base aerobica è un po' indietro. " : "La tua base aerobica regge bene come supporto. ");
    t += "COSA FARE: " + (sg == null ? "tanta corsa facile + 1-2 sedute di soglia a settimana (es. 5×1000 al ritmo di soglia)." : (sg < 0.9 ? "4-6 settimane con tanta corsa facile + 1-2 sedute di soglia (5-6×1000 al ritmo soglia, oppure 20-30′ di medio); pochi lavori durissimi. Poi rifai il test." : "mantieni 1-2 soglie a settimana + corsa facile."));
    return t + " FONDAMENTALE per te: allena anche la VELOCITÀ pura (allunghi di 60-120 m veloci ma sciolti) e le ripetute LATTACIDE (200-600 m a ritmo gara con recuperi lunghi). Fai la Velocità Critica per misurare il tuo “serbatoio” di scatto (D′).";
  }
  if (disc === "35") {
    let t = "Per il 3000/5000 il ritmo-chiave è la SOGLIA (il passo più veloce che tieni a lungo, qui " + rit + "/km). ";
    if (sg != null) t += sg < 0.86 ? "Da te è BASSA rispetto alla gara → tanto margine. COSA FARE: 4-6 settimane con 2 sedute di soglia (5-6×1000 o 4×2000 al ritmo soglia) + molta corsa facile + 1 lungo; per ora pochi lavori durissimi. Poi rifai il test." : (sg > 0.93 ? "Da te è ALTA (quasi ritmo gara) → soglia già forte. COSA FARE: mantienila e aggiungi qualcosa SOPRA: VO2max (5×1000 molto duri, a ritmo 3-5 km) + tratti a ritmo gara." : "Da te è NELLA NORMA. COSA FARE: 1-2 soglie a settimana + 1 seduta VO2max (5×1000 duri) + 1 lungo, salendo piano.");
    return t + baseStretta;
  }
  let t = "Per il 5000/10000 la SOGLIA e il VOLUME sono tutto (soglia qui " + rit + "/km). ";
  if (sg != null) t += sg < 0.86 ? "La soglia è BASSA rispetto alla gara → da alzare. COSA FARE: 2 sedute di soglia/sub-soglia a settimana (6-8×1000 o 5-6×2000) + molta corsa facile + 1 lungo di 90-120′; poco VO2max." : (sg > 0.93 ? "La soglia è ALTA (già ottima). COSA FARE: mantienila e aggiungi VO2max + tratti a ritmo gara." : "La soglia è NELLA NORMA. COSA FARE: mantieni le soglie e soprattutto AUMENTA la corsa facile e il lungo.");
  return t + baseStretta;
}

// grafico curva del lattato (SVG): punti + curva + retta Dmax + marker LT1/LT2
function _latChart(R) {
  if (!R.n) return `<p class="et">Il grafico compare appena inserisci almeno 2 step con passo e lattato.</p>`;
  const W = 320, Hh = 210, mL = 32, mR = 12, mT = 12, mB = 28;
  const V = R.pts.map(p => p.v), L = R.pts.map(p => p.lat);
  let xmin = Math.min(...V), xmax = Math.max(...V);
  let ymax = Math.max(4.5, Math.max(...L) + 0.6);
  if (xmax - xmin < 0.5) { xmin -= 0.5; xmax += 0.5; }
  const dx = (xmax - xmin) || 1;
  const px = v => mL + (v - xmin) / dx * (W - mL - mR);
  const py = l => Hh - mB - (l / ymax) * (Hh - mT - mB);
  const gline = "stroke:var(--line);stroke-width:1";
  let g = "";
  // griglia + assi Y (lattato)
  for (let y = 0; y <= ymax; y += 2) {
    g += `<line x1="${mL}" y1="${py(y).toFixed(1)}" x2="${W - mR}" y2="${py(y).toFixed(1)}" style="${gline}" opacity="0.5"/>`;
    g += `<text x="${mL - 5}" y="${(py(y) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--txt3)">${y}</text>`;
  }
  // linea soglia LT2 target (orizzontale tratteggiata)
  g += `<line x1="${mL}" y1="${py(R.lt2Target).toFixed(1)}" x2="${W - mR}" y2="${py(R.lt2Target).toFixed(1)}" style="stroke:var(--rosso,#e0575b);stroke-width:1;stroke-dasharray:4 3"/>`;
  // retta Dmax (primo→ultimo)
  if (R.retta) g += `<line x1="${px(R.retta.x0).toFixed(1)}" y1="${py(R.retta.y0).toFixed(1)}" x2="${px(R.retta.x1).toFixed(1)}" y2="${py(R.retta.y1).toFixed(1)}" style="stroke:var(--txt3);stroke-width:1;stroke-dasharray:2 2" opacity="0.7"/>`;
  // curva (polilinea sui punti)
  const poly = R.pts.map(p => `${px(p.v).toFixed(1)},${py(p.lat).toFixed(1)}`).join(" ");
  g += `<polyline points="${poly}" fill="none" style="stroke:var(--blu,#3b82f6);stroke-width:2"/>`;
  // punti
  R.pts.forEach(p => { g += `<circle cx="${px(p.v).toFixed(1)}" cy="${py(p.lat).toFixed(1)}" r="3" fill="var(--blu,#3b82f6)"/>`; });
  // marker LT2 e LT1 (sulla curva, al lattato target)
  if (R.vLT2 != null) { const x = px(R.vLT2), y = py(R.lt2Target); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="none" style="stroke:var(--rosso,#e0575b);stroke-width:2"/><text x="${(x).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--rosso,#e0575b)">LT2</text>`; }
  if (R.vLT1 != null) { const x = px(R.vLT1), y = py(R.lt1Target); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="none" style="stroke:var(--verde,#3fb56b);stroke-width:2"/><text x="${(x).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--verde,#3fb56b)">LT1</text>`; }
  // assi
  g += `<line x1="${mL}" y1="${mT}" x2="${mL}" y2="${Hh - mB}" style="${gline}"/>`;
  g += `<line x1="${mL}" y1="${Hh - mB}" x2="${W - mR}" y2="${Hh - mB}" style="${gline}"/>`;
  for (let i = 0; i <= 4; i++) { const v = xmin + dx * i / 4; g += `<text x="${px(v).toFixed(1)}" y="${Hh - mB + 14}" text-anchor="middle" font-size="9" fill="var(--txt3)">${v.toFixed(1)}</text>`; }
  g += `<text x="${(W / 2).toFixed(0)}" y="${Hh - 2}" text-anchor="middle" font-size="9" fill="var(--txt3)">velocità (km/h)</text>`;
  return `<div class="p-scroll"><svg viewBox="0 0 ${W} ${Hh}" width="100%" style="max-width:420px" role="img" aria-label="Curva del lattato">${g}</svg></div>`;
}

// ---------- vista: Test lattato (Analisi) ----------
let latState = { atletaRif: "" };
function setLatAtleta(id) { latState.atletaRif = id; disegna(); }
function setLatCampo(campo, v) { const t = _latTest(latState.atletaRif); t[campo] = v; _latSave(); disegna(); }
function setLatCampoVal(campo, v) { const t = _latTest(latState.atletaRif); t[campo] = v; _latSave(); }
function toggleLatUsa() { const t = _latTest(latState.atletaRif); t.usaLT2 = !t.usaLT2; _latSave(); disegna(); }
function setLatMetodoFor(aid, m) { if (!aid) return; const t = _latTest(aid); t.metodo = m; _latSave(); disegna(); }
function setLatMetodo(m) { setLatMetodoFor(latState.atletaRif, m); }
function setLatStepVal(i, campo, v) { const t = _latTest(latState.atletaRif); t.steps[i][campo] = v; _latSave(); }
function latAddStep() { const t = _latTest(latState.atletaRif); t.steps.push({ min: "", sec: "", fc: "", lat: "", rpe: "" }); _latSave(); disegna(); }
function latDelStep(i) { const t = _latTest(latState.atletaRif); if (t.steps.length > 1) t.steps.splice(i, 1); _latSave(); disegna(); }
function toggleLatGuida() { S.latGuida = !S.latGuida; disegna(); }

function vistaTestLattato() {
  const a = latState.atletaRif ? DEMO.atleti.find(x => x.id === latState.atletaRif) : null;
  const selAtleta = `<div class="card">
    <label class="lab">Atleta (mezzofondo / fondo)</label>
    <select onchange="setLatAtleta(this.value)" style="margin-top:6px">${_optAtletiMezzo(latState.atletaRif, "— scegli —")}</select>
    ${atletiMezzo().length === 0 ? _MZ_NO_ATLETI : ""}</div>`;
  const intro = `<div class="card"><h3>Test del lattato</h3>
    <p class="et" style="margin-top:2px">Serve a trovare la <b>soglia</b> (il ritmo più veloce che tieni ~1 ora) e le zone di allenamento, misurando il lattato nel sangue mentre corri sempre più forte.</p>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="toggleLatGuida()">${S.latGuida ? "Nascondi come si fa" : "📋 Come si fa il test"}</button>
    ${S.latGuida ? `<div style="margin-top:10px;padding:11px 13px;background:var(--card2,rgba(120,120,140,.08));border-radius:10px">
      <p class="et" style="margin:0 0 6px"><b>Protocollo a step</b> (semplice, sul campo)</p>
      <p class="et" style="margin:0 0 6px"><b>1.</b> <b>Distanza per step:</b> 1200 m (oppure 3-4 minuti a ritmo costante) — la imposti qui sotto.</p>
      <p class="et" style="margin:0 0 6px"><b>2.</b> <b>Parti LENTO:</b> il 1º step dev'essere facile (~1,5 mmol). Se parti forte, la soglia bassa non si vede.</p>
      <p class="et" style="margin:0 0 6px"><b>3.</b> <b>Ogni step ~10″/km più veloce</b> del precedente (es. 4:30 → 4:20 → 4:10 → 4:00 …/km).</p>
      <p class="et" style="margin:0 0 6px"><b>4.</b> <b>Alla fine di ogni step</b> misura il <b>lattato</b> (goccia dal dito), la <b>frequenza cardiaca</b> e segna quanto è stato duro (<b>RPE</b> 1-10). ~1 minuto di pausa per il prelievo, poi riparti.</p>
      <p class="et" style="margin:0 0 6px"><b>5.</b> <b>Continua per 5-8 step</b>, finché il lattato è chiaramente alto (6-8+) e fatichi a tenere il ritmo.</p>
      <p class="et" style="margin:0"><b>6.</b> <b>Inserisci qui sotto</b>, per ogni step: passo (min e sec /km), FC, lattato, RPE. Il resto lo calcola l'app.</p>
    </div>` : ""}</div>`;
  if (!a) return intro + selAtleta + `<div class="card"><p class="et">Scegli un atleta per inserire il suo test.</p></div>`;

  const t = _latTest(a.id);
  const R = analisiLattato(t, a);
  const num = (v, dec) => (v == null || isNaN(v)) ? "—" : (dec != null ? v.toFixed(dec) : Math.round(v));

  // setup
  const setup = `<div class="card">
    <div class="griglia2">
      <div><label class="lab">Distanza step (m)</label><input inputmode="numeric" value="${t.distStep || ""}" placeholder="1200" oninput="setLatCampoVal('distStep',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <div><label class="lab">Peso (kg)</label><input inputmode="decimal" value="${t.peso || ""}" placeholder="kg" oninput="setLatCampoVal('peso',this.value)" style="margin-top:6px"></div>
    </div>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Soglia LT2 (OBLA, mmol/L)</label><input inputmode="decimal" value="${t.lt2Target}" oninput="setLatCampoVal('lt2Target',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <div><label class="lab" style="display:block">Usa vLT2 nei Ritmi</label>
        <button class="btn ${t.usaLT2 ? "btn-1" : "btn-2"}" style="width:auto;padding:9px 14px;margin-top:6px" onclick="toggleLatUsa()">${t.usaLT2 ? "✓ Attivo" : "Disattivato"}</button></div>
    </div>
    <p class="et" style="margin-top:8px">Incremento consigliato ~10″/km per step. Con «Usa vLT2» attivo, la <b>Soglia</b> nei Ritmi target usa il valore reale del test invece della stima dai PB.</p>
  </div>`;

  // tabella step
  const righeStep = t.steps.map((s, i) => {
    const v = _mzVelKmh(s.min, s.sec);
    return `<tr>
      <td style="text-align:center;color:var(--txt3)">${i + 1}</td>
      <td><input inputmode="numeric" value="${s.min || ""}" placeholder="min" oninput="setLatStepVal(${i},'min',this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input inputmode="numeric" value="${s.sec || ""}" placeholder="sec" oninput="setLatStepVal(${i},'sec',this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td class="pauto">${v != null ? v.toFixed(1) : "—"}</td>
      <td><input inputmode="numeric" value="${s.fc || ""}" placeholder="bpm" oninput="setLatStepVal(${i},'fc',this.value)" onchange="disegna()" style="min-width:54px"></td>
      <td><input inputmode="decimal" value="${s.lat || ""}" placeholder="mmol" oninput="setLatStepVal(${i},'lat',this.value)" onchange="disegna()" style="min-width:56px"></td>
      <td><input inputmode="numeric" value="${s.rpe || ""}" placeholder="1-10" oninput="setLatStepVal(${i},'rpe',this.value)" style="min-width:48px"></td>
      <td><button class="chiudi" style="font-size:14px" onclick="latDelStep(${i})" aria-label="Rimuovi">✕</button></td>
    </tr>`;
  }).join("");
  const tabSteps = `<div class="card">
    <p class="et" style="margin-bottom:6px">Step del test — passo /km, FC, lattato, RPE (la velocità km/h è automatica)</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>#</th><th>min</th><th>sec</th><th>km/h</th><th>FC</th><th>Lattato</th><th>RPE</th><th></th></tr></thead>
      <tbody>${righeStep}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="latAddStep()">＋ step</button>
  </div>`;

  // risultati
  const badge = (lbl, cls) => `<span class="pill ${cls}">${lbl}</span>`;
  const sgPct = R.sogliaGara != null ? Math.round(R.sogliaGara * 100) + "%" : "—";
  const sgLab = R.sogliaGara == null ? "" : (R.sogliaGara < 0.86 ? badge("bassa", "p-giallo") : (R.sogliaGara > 0.93 ? badge("alta", "p-verde") : badge("norma", "p-verde")));
  const ampPct = R.ampiezza != null ? Math.round(R.ampiezza * 100) + "%" : "—";
  const ampLab = R.ampiezza == null ? "" : (R.ampiezza < 0.8 ? badge("stretta", "p-giallo") : badge("buona", "p-verde"));
  const warnTxt = R.n === 0 ? "" : (R.warn === "veloce"
    ? `<div class="card" style="border-color:rgba(240,168,60,.5)"><p class="et" style="margin:0"><b>⚠ Partenza troppo veloce</b>: 1º step già a ${num(R.baseline, 1)} mmol (dovrebbe essere ~1.5). La soglia aerobica LT1 non è ben catturata: rifai partendo più lento. I ritmi sono stimati con cautela.</p></div>`
    : (R.warn === "pochi"
      ? `<div class="card" style="border-color:rgba(240,168,60,.5)"><p class="et" style="margin:0"><b>Pochi step (&lt;5)</b>: aggiungi punti per una curva più affidabile.</p></div>`
      : `<div class="card" style="border-color:rgba(63,181,107,.4)"><p class="et" style="margin:0">✓ <b>Test ben impostato</b> (primo step basso e punti sufficienti).</p></div>`));

  const rigaRis = (lbl, val, extra) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span class="et" style="margin:0">${lbl}</span><span><b>${val}</b>${extra ? ` <span class="et" style="margin:0">${extra}</span>` : ""}</span></div>`;
  const risultati = R.n === 0 ? "" : `<div class="card">
    <p class="et" style="margin-bottom:6px">Risultati (interpolazione sulla curva)</p>
    ${rigaRis("Baseline (step 1)", num(R.baseline, 1) + " mmol")}
    ${rigaRis("LT1 — ritmo /km", R.ritmoLT1 || "—", R.vLT1 != null ? num(R.vLT1, 1) + " km/h · FC " + num(R.fcLT1) : "")}
    ${rigaRis("LT2 (OBLA " + R.lt2Target + ") — ritmo /km", R.ritmoLT2 || "—", R.vLT2 != null ? num(R.vLT2, 1) + " km/h · FC " + num(R.fcLT2) : "")}
    ${R.vLT2dmax != null ? rigaRis("LT2 (Dmax) — ritmo /km", R.ritmoDmax, num(R.vLT2dmax, 1) + " km/h · a " + num(R.latDmax, 1) + " mmol") : ""}
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">
      <p class="et" style="margin:0 0 6px">Quale soglia usano i <b>Ritmi</b>${t.usaLT2 ? "" : " <span style='color:var(--txt3)'>(accendi «Usa vLT2» qui sopra)</span>"}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ${(t.metodo || "dmax") === "dmax" ? "btn-1" : "btn-2"}" style="width:auto;padding:8px 13px" onclick="setLatMetodo('dmax')">Dmax${R.ritmoDmax ? " · " + R.ritmoDmax : ""}</button>
        <button class="btn ${(t.metodo || "dmax") === "obla" ? "btn-1" : "btn-2"}" style="width:auto;padding:8px 13px" onclick="setLatMetodo('obla')">OBLA 4${R.ritmoLT2 ? " · " + R.ritmoLT2 : ""}</button>
      </div>
    </div>
    <div style="margin-top:12px">${_latChart(R)}</div>
    <p class="et" style="margin-top:8px">OBLA 4.0 = riferimento fisso; <b>Dmax</b> = il punto dove la <i>tua</i> curva si piega davvero (più su misura). La riga tratteggiata rossa è la soglia OBLA scelta.</p>
  </div>`;

  // prospetto
  const prospetto = R.n === 0 ? "" : `<div class="card">
    <p class="et" style="margin-bottom:6px">Prospetto — lettura del test</p>
    <p class="et" style="margin:0 0 10px">Il lattato sale quando corri forte. <b>LT1</b> = fin qui è facile (corsa lenta, si bruciano grassi). <b>LT2</b> = qui vai in debito e la fatica arriva presto: è la <b>soglia</b>, il ritmo più veloce che tieni ~1 ora. Il test misura il <b>motore aerobico</b>, non la parte veloce/anaerobica.</p>
    ${rigaRis("Velocità gara 5000 (dal PB)", R.vGara5000 != null ? num(R.vGara5000, 1) + " km/h" : "—")}
    <div style="padding:9px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="et" style="margin:0">Soglia rispetto al ritmo gara 5000</span><span style="white-space:nowrap"><b>${sgPct}</b> ${sgLab}</span></div>
      <p class="et" style="margin:5px 0 0">${_spiegSogliaGara(R.sogliaGara)}</p>
    </div>
    <div style="padding:9px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="et" style="margin:0">Ampiezza aerobica (facile → soglia)</span><span style="white-space:nowrap"><b>${ampPct}</b> ${ampLab}</span></div>
      <p class="et" style="margin:5px 0 0">${_spiegAmpiezza(R.ampiezza)}</p>
    </div>
  </div>
  <div class="card">
    <p class="et" style="margin-bottom:8px">Per la tua gara — cosa va e cosa lavorare</p>
    ${[["800 / 1500", "800"], ["3000 / 5000", "35"], ["5000 / 10000", "10"]].map(([lbl, k]) =>
      `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><p style="font-weight:600;font-size:13px;margin:0 0 3px">${lbl}</p><p class="et" style="margin:0">${_latCoach(k, R)}</p></div>`).join("")}
    <p class="et" style="margin-top:10px"><b>Regola d'oro:</b> la leva più grande resta il VOLUME AEROBICO facile. Il test serve a MISURARE i progressi e affinare i ritmi, non a sostituire l'occhio del coach.</p>
  </div>`;

  return intro + selAtleta + setup + tabSteps + warnTxt + risultati + prospetto;
}

// ============================================================================
// VELOCITÀ CRITICA (Critical Speed) — dal campo.
// Fedele al foglio Excel "Critical Speed": 2-4 prove all-out su distanze diverse,
// modello distanza = CS × tempo + D'  (CS=SLOPE, D'=INTERCEPT, R²=RSQ) + speed reserve.
// ============================================================================
function _csTest(aid) {
  DEMO.critSpeed = DEMO.critSpeed || {};
  if (!DEMO.critSpeed[aid]) DEMO.critSpeed[aid] = { prove: [], lanDist: 30, lanTempo: "" };
  const t = DEMO.critSpeed[aid];
  if (!t.prove) t.prove = [];
  while (t.prove.length < 2) t.prove.push({ dist: "", min: "", sec: "" });
  if (t.lanDist == null) t.lanDist = 30;
  return t;
}
function _csSave() { if (typeof salvaCustom === "function") salvaCustom(); }

// motore: regressione distanza(y) su tempo(x) → CS, D', R², tempi previsti, prospetto, speed reserve
function analisiCriticalSpeed(cs, atleta) {
  cs = cs || {};
  const pts = [];
  (cs.prove || []).forEach(p => {
    const dist = Number(p.dist), t = (Number(p.min) || 0) * 60 + (Number(p.sec) || 0);
    if (dist > 0 && t > 0) pts.push({ dist, t, v: dist / t });
  });
  const n = pts.length, R = { n, pts };
  if (n >= 2) {
    const X = pts.map(p => p.t), Y = pts.map(p => p.dist);   // x=tempo, y=distanza
    const mx = X.reduce((a, b) => a + b, 0) / n, my = Y.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const dx = X[i] - mx, dy = Y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    if (sxx > 0) {
      R.cs = sxy / sxx;                       // m/s (pendenza)
      R.dprime = my - R.cs * mx;              // m (intercetta)
      R.r2 = syy > 0 ? (sxy * sxy) / (sxx * syy) : null;
      R.vCS = R.cs * 3.6;                     // km/h
      R.ritmoCS = _mzMMSS(1000 / R.cs);
      R.previsti = [800, 1500, 3000, 5000, 10000].map(d => { const tp = (d - R.dprime) / R.cs; return { d, tempo: tp > 0 ? _mzMMSS(tp) : "—" }; });
    }
  }
  const pb5 = atleta ? _mzPbSec(atleta, "5000 m") : null;
  R.vGara5000 = pb5 ? 18000 / pb5 : null;
  R.csGara = (R.vCS != null && R.vGara5000) ? R.vCS / R.vGara5000 : null;
  // speed reserve (tipo atleta, per 800/1500)
  const lanDist = Number(cs.lanDist) || 30, lanT = Number(cs.lanTempo);
  R.vmax = (lanDist > 0 && lanT > 0) ? lanDist / lanT : null;
  const pb15 = atleta ? _mzPbSec(atleta, "1500 m") : null;
  R.rit1500ms = pb15 ? 1500 / pb15 : null;
  R.srr = (R.vmax != null && R.rit1500ms) ? R.vmax / R.rit1500ms : null;
  return R;
}

function _csCoach(disc, R) {
  if (R.cs == null) return "(fai il test: 2-4 prove a tutta su distanze diverse)";
  const g = R.csGara, dp = R.dprime;
  if (disc === "800") {
    let t = "Per te contano CS (base/soglia) e SOPRATTUTTO D′ (la punta anaerobica). D′ " + (dp != null ? Math.round(dp) + " m: " : "");
    t += dp < 150 ? "BASSO → allena VELOCITÀ e LATTACIDO (la tua arma di gara), oltre alla base." : (dp > 250 ? "buono → sfruttalo nei finali veloci." : "medio → puoi alzarlo con velocità e prove lattacide.");
    t += g != null ? " CS " + Math.round(g * 100) + "% gara: " + (g < 0.9 ? "soglia da rinforzare col volume." : "soglia ok.") : "";
    return t;
  }
  if (disc === "35") {
    let t = "Per te conta soprattutto la CS (= la soglia). ";
    t += g == null ? "(inserisci il PB 5000)" : (g < 0.9 ? "CS un po' bassa: più SOGLIA e volume aerobico." : (g > 0.96 ? "Ottima CS: aggiungi VO2max e ritmo gara." : "CS ok: soglia + VO2max."));
    return t;
  }
  let t = "CS = la tua soglia sostenibile: base e soglia sono tutto. ";
  t += g == null ? "" : (g < 0.9 ? "CS da alzare: T/sub-soglia + tanto volume facile." : "CS ok: mantieni e aumenta il volume. Il D′ conta poco per te.");
  return t;
}
function _csSpeedReserve(R) {
  if (R.vmax == null) return "(inserisci lo sprint lanciato)";
  if (R.rit1500ms == null) return "(inserisci il PB 1500 nel foglio Atleta)";
  const s = R.srr;
  const tipo = s >= 1.58 ? "tipo 400/800 (molto veloce)" : (s >= 1.47 ? "tipo 800 puro (veloce)" : (s >= 1.36 ? "tipo 800/1500 (bilanciato)" : "tipo 1500/prolungato (resistente)"));
  const fare = s >= 1.47 ? "hai VELOCITÀ naturale, ti manca la RESISTENZA → più soglia, VO2max e volume aerobico (mantieni la velocità)."
    : (s >= 1.36 ? "profilo bilanciato → cura sia VO2max/soglia sia velocità e potenza lattacida."
      : "sei RESISTENTE ma poco veloce, ti manca il CAMBIO → più velocità pura (allunghi 60-120 m) e potenza lattacida.");
  return "SRR " + s.toFixed(2) + " → " + tipo + ". COSA FARE: " + fare;
}

// grafico: distanza (y) vs tempo (x) con la retta del modello (CS·t + D')
function _csChart(R) {
  if (R.n < 2) return "";
  const W = 320, Hh = 200, mL = 40, mR = 12, mT = 12, mB = 28;
  const T = R.pts.map(p => p.t), D = R.pts.map(p => p.dist);
  let xmin = 0, xmax = Math.max(...T) * 1.08;
  let ymax = Math.max(...D) * 1.1;
  const dx = xmax - xmin || 1;
  const px = t => mL + (t - xmin) / dx * (W - mL - mR);
  const py = d => Hh - mB - (d / ymax) * (Hh - mT - mB);
  let g = "";
  const gline = "stroke:var(--line);stroke-width:1";
  for (let i = 0; i <= 4; i++) { const d = ymax * i / 4; g += `<line x1="${mL}" y1="${py(d).toFixed(1)}" x2="${W - mR}" y2="${py(d).toFixed(1)}" style="${gline}" opacity="0.5"/><text x="${mL - 5}" y="${(py(d) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--txt3)">${Math.round(d)}</text>`; }
  // retta del modello y = CS*t + D' tra x=0 e xmax
  if (R.cs != null) { const y0 = R.dprime, y1 = R.cs * xmax + R.dprime; g += `<line x1="${px(0).toFixed(1)}" y1="${py(y0).toFixed(1)}" x2="${px(xmax).toFixed(1)}" y2="${py(y1).toFixed(1)}" style="stroke:var(--verde,#3fb56b);stroke-width:2"/>`; }
  R.pts.forEach(p => { g += `<circle cx="${px(p.t).toFixed(1)}" cy="${py(p.dist).toFixed(1)}" r="3.5" fill="var(--blu,#3b82f6)"/>`; });
  g += `<line x1="${mL}" y1="${mT}" x2="${mL}" y2="${Hh - mB}" style="${gline}"/><line x1="${mL}" y1="${Hh - mB}" x2="${W - mR}" y2="${Hh - mB}" style="${gline}"/>`;
  for (let i = 0; i <= 4; i++) { const t = xmax * i / 4; g += `<text x="${px(t).toFixed(1)}" y="${Hh - mB + 14}" text-anchor="middle" font-size="9" fill="var(--txt3)">${Math.round(t)}</text>`; }
  g += `<text x="${(W / 2).toFixed(0)}" y="${Hh - 2}" text-anchor="middle" font-size="9" fill="var(--txt3)">tempo (s) · y = distanza (m)</text>`;
  return `<div class="p-scroll"><svg viewBox="0 0 ${W} ${Hh}" width="100%" style="max-width:420px" role="img" aria-label="Modello Critical Speed">${g}</svg></div>`;
}

// ---------- vista: Critical Speed (Analisi) ----------
let csState = { atletaRif: "" };
function setCsAtleta(id) { csState.atletaRif = id; disegna(); }
function setCsCampoVal(campo, v) { const t = _csTest(csState.atletaRif); t[campo] = v; _csSave(); }
function setCsProvaVal(i, campo, v) { const t = _csTest(csState.atletaRif); t.prove[i][campo] = v; _csSave(); }
function csAddProva() { const t = _csTest(csState.atletaRif); if (t.prove.length < 4) t.prove.push({ dist: "", min: "", sec: "" }); _csSave(); disegna(); }
function csDelProva(i) { const t = _csTest(csState.atletaRif); if (t.prove.length > 2) t.prove.splice(i, 1); _csSave(); disegna(); }

function vistaCriticalSpeed() {
  const a = csState.atletaRif ? DEMO.atleti.find(x => x.id === csState.atletaRif) : null;
  const intro = `<div class="card"><h3>Velocità Critica (Critical Speed)</h3>
    <p class="et" style="margin-top:2px">Dal campo: 2-4 prove <b>a tutta</b> su distanze diverse (es. 1200 m e 2400 m, o 3′ e 12′). Dalla retta distanza-tempo escono <b>CS</b> (soglia sostenibile) e <b>D′</b> (riserva anaerobica). Usa distanze ben diverse (rapporto ~2:1).</p></div>`;
  const selAtleta = `<div class="card"><label class="lab">Atleta (mezzofondo / fondo)</label>
    <select onchange="setCsAtleta(this.value)" style="margin-top:6px">${_optAtletiMezzo(csState.atletaRif, "— scegli —")}</select>
    ${atletiMezzo().length === 0 ? _MZ_NO_ATLETI : ""}</div>`;
  if (!a) return intro + selAtleta + `<div class="card"><p class="et">Scegli un atleta per inserire le prove.</p></div>`;

  const t = _csTest(a.id);
  const R = analisiCriticalSpeed(t, a);
  const num = (v, d) => (v == null || isNaN(v)) ? "—" : (d != null ? v.toFixed(d) : Math.round(v));

  const righeProve = t.prove.map((p, i) => {
    const tempo = (Number(p.min) || 0) * 60 + (Number(p.sec) || 0);
    const v = (Number(p.dist) > 0 && tempo > 0) ? Number(p.dist) / tempo : null;
    return `<tr>
      <td style="text-align:center;color:var(--txt3)">${i + 1}</td>
      <td><input inputmode="numeric" value="${p.dist || ""}" placeholder="m" oninput="setCsProvaVal(${i},'dist',this.value)" onchange="disegna()" style="min-width:64px"></td>
      <td><input inputmode="numeric" value="${p.min || ""}" placeholder="min" oninput="setCsProvaVal(${i},'min',this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input inputmode="numeric" value="${p.sec || ""}" placeholder="sec" oninput="setCsProvaVal(${i},'sec',this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td class="pauto">${tempo > 0 ? tempo : "—"}</td>
      <td class="pauto">${v != null ? v.toFixed(2) : "—"}</td>
      <td><button class="chiudi" style="font-size:14px" onclick="csDelProva(${i})" aria-label="Rimuovi">✕</button></td>
    </tr>`;
  }).join("");
  const tabProve = `<div class="card">
    <p class="et" style="margin-bottom:6px">Prove all-out — distanza + tempo (il tempo in s e la m/s sono automatici)</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>#</th><th>Distanza (m)</th><th>min</th><th>sec</th><th>Tempo (s)</th><th>m/s</th><th></th></tr></thead>
      <tbody>${righeProve}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="csAddProva()">＋ prova</button>
  </div>`;

  const rigaRis = (lbl, val, extra) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span class="et" style="margin:0">${lbl}</span><span><b>${val}</b>${extra ? ` <span class="et" style="margin:0">${extra}</span>` : ""}</span></div>`;
  const risultati = R.cs == null ? "" : `<div class="card">
    <p class="et" style="margin-bottom:6px">Risultati — modello distanza = CS × tempo + D′</p>
    ${rigaRis("Velocità Critica CS", num(R.cs, 2) + " m/s", num(R.vCS, 1) + " km/h · " + R.ritmoCS + "/km")}
    ${rigaRis("D′ (riserva anaerobica)", num(R.dprime) + " m")}
    ${rigaRis("R² (qualità del fit)", R.r2 != null ? R.r2.toFixed(3) : "—", R.r2 != null && R.r2 < 0.95 ? "prove poco allineate" : "")}
    <div style="margin-top:12px">${_csChart(R)}</div>
    <p class="et" style="margin-top:8px">CS ≈ soglia (LT2/MLSS): il ritmo sostenibile a lungo. D′ = i metri extra sopra CS (capacità anaerobica), conta negli 800/1500.</p>
  </div>`;

  const previsti = (R.previsti && R.cs != null) ? `<div class="card">
    <p class="et" style="margin-bottom:6px">Tempi previsti dal modello</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr>${R.previsti.map(x => `<th>${x.d} m</th>`).join("")}</tr></thead>
      <tbody><tr>${R.previsti.map(x => `<td class="pauto"><b>${x.tempo}</b></td>`).join("")}</tr></tbody>
    </table></div></div>` : "";

  const csPct = R.csGara != null ? Math.round(R.csGara * 100) + "%" : "—";
  const csLab = R.csGara == null ? "" : (R.csGara < 0.9 ? `<span class="pill p-giallo">CS bassa</span>` : (R.csGara > 0.96 ? `<span class="pill p-verde">CS alta</span>` : `<span class="pill p-verde">norma</span>`));
  const dpLab = R.dprime == null ? "" : (R.dprime < 150 ? `<span class="pill p-giallo">basso</span>` : (R.dprime > 250 ? `<span class="pill p-verde">alto</span>` : `<span class="pill p-verde">medio</span>`));
  const prospetto = R.cs == null ? "" : `<div class="card">
    <p class="et" style="margin-bottom:6px">Prospetto — lettura del test</p>
    <p class="et" style="margin:0 0 10px">Fai 2-4 prove a tutta su distanze diverse; la retta distanza-tempo dà due numeri. <b>CS</b> = la velocità che tieni A LUNGO (la tua soglia sul campo). <b>D′</b> = i metri EXTRA sopra CS: è la tua PUNTA, conta negli 800/1500.</p>
    ${rigaRis("Velocità gara 5000 (dal PB)", R.vGara5000 != null ? num(R.vGara5000, 1) + " km/h" : "—")}
    ${rigaRis("CS / velocità gara", csPct, csLab)}
    ${rigaRis("D′ (riserva anaerobica)", R.dprime != null ? num(R.dprime) + " m" : "—", dpLab)}
  </div>
  <div class="card">
    <p class="et" style="margin-bottom:8px">Per la tua gara — cosa va e cosa lavorare</p>
    ${[["800 / 1500", "800"], ["3000 / 5000", "35"], ["5000 / 10000", "10"]].map(([lbl, k]) =>
      `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><p style="font-weight:600;font-size:13px;margin:0 0 3px">${lbl}</p><p class="et" style="margin:0">${_csCoach(k, R)}</p></div>`).join("")}
  </div>`;

  // speed reserve (tipo atleta)
  const speed = `<div class="card">
    <p class="et" style="margin-bottom:6px">Tipo di atleta — speed reserve (per 800/1500)</p>
    <p class="et" style="margin:0 0 10px">La riserva di velocità = quanto sei più veloce in sprint rispetto al ritmo gara. Dice se sei un tipo VELOCE (ti manca resistenza) o RESISTENTE (ti manca il cambio).</p>
    <div class="griglia2">
      <div><label class="lab">Sprint lanciato: distanza (m)</label><input inputmode="numeric" value="${t.lanDist != null ? t.lanDist : ""}" placeholder="30" oninput="setCsCampoVal('lanDist',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <div><label class="lab">Sprint lanciato: tempo (s)</label><input inputmode="decimal" value="${t.lanTempo || ""}" placeholder="es. 3.2" oninput="setCsCampoVal('lanTempo',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    <div style="margin-top:10px">
      ${rigaRis("Vmax (m/s)", R.vmax != null ? num(R.vmax, 2) : "—")}
      ${rigaRis("Ritmo 1500 (m/s) [rif dal PB]", R.rit1500ms != null ? num(R.rit1500ms, 2) : "—", "proxy vVO2max")}
      ${rigaRis("Speed Reserve (Vmax/rif)", R.srr != null ? num(R.srr, 2) : "—", R.srr == null ? "" : (R.srr >= 1.47 ? `<span class="pill p-verde">veloce</span>` : (R.srr >= 1.36 ? `<span class="pill p-verde">bilanciato</span>` : `<span class="pill p-giallo">resistente</span>`)))}
    </div>
    <p class="et" style="margin-top:10px;padding:8px;background:var(--card2,rgba(120,120,140,.08));border-radius:8px">${_csSpeedReserve(R)}</p>
  </div>`;

  return intro + selAtleta + tabProve + risultati + previsti + prospetto + speed;
}
