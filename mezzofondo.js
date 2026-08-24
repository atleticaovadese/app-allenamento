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
// come _mzMMSS ma tiene i centesimi (m:ss.cc) — per i tempi reali che scrive l'atleta in allenamento
function _mzMMSSc(sec) {
  if (sec == null || isNaN(sec)) return "";
  const cc = Math.round(sec * 100) % 100, tot = Math.floor(Math.round(sec * 100) / 100);
  const m = Math.floor(tot / 60), s = tot % 60;
  return m + ":" + String(s).padStart(2, "0") + (cc ? "." + String(cc).padStart(2, "0") : "");
}
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
      <label class="lab" style="display:block;margin-top:12px">Pliometria / policoncorrenza</label>
      <button class="btn btn-2" style="margin-top:6px;text-align:left" onclick="apriPlio()">${plioRiassunto(g)}</button>
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
  // Basta che ci sia del lavoro reale: una distanza (le ripetute vuote valgono 1) OPPURE dei minuti.
  // La "zona" (mezzo) resta opzionale: se non è scelta la riga si mostra comunque, solo senza ritmo target.
  const righe = allRighe.filter(r => Number(r.distanza) > 0 || Number(r.min) > 0);
  if (!righe.length) return null;
  const aid = atleta.id;
  const opts = { obiettivo: (prog && prog.mzObiettivo) || 0, offsets: (prog && prog.mzOffsets) || {} };  // PB = quelli dell'atleta
  const elementi = righe.map((r, i) => {
    const sec = ritmoMezzo(atleta, r.mezzo, opts);
    const cont = Number(r.min) > 0;
    const dist = Number(r.distanza) || 0, n = Number(r.n) || (dist > 0 ? 1 : 0);
    const vol = cont ? (sec != null ? Math.round(Number(r.min) * 60000 / sec) : 0) : dist * n;
    const tempoRip = cont ? null : (sec != null && dist ? Math.round((dist / 1000) * sec) : null);
    return {
      id: "e" + i, contenuto: r.contenuto || "", mezzo: r.mezzo, distanza: dist, ripetute: n,
      min: cont ? Number(r.min) : null, ritmoSecKm: sec, ritmoKm: sec != null ? _mzMMSS(sec) : "—",
      tempoRipSec: tempoRip, recupero: r.rec || "", volume: vol,
      // ripetute: l'atleta segna il tempo reale di ognuna (mm:ss). Continuo: niente caselle.
      tempi: cont ? null : Array(n).fill(null)
    };
  });
  return _cacheSeduta({
    id: "gen-p-" + aid + "-" + dataISO + "-g" + giornoNum, tipo: "pista", mezzo: true, giorno: giornoNum,
    quando: "", data: dataLunga(dataISO), dataISO: dataISO, atletaId: aid,
    focus: (meso && meso.focus) || "", obiettivi: "", notaCoach: (sett && sett.nota) || "", riscaldamento: (typeof riscLista === "function" ? riscLista(g) : []),
    plio: (g.plio || []).filter(r => r.es),
    elementi, durata: null, rpe: null, fastidi: false, chiusa: false
  });
}

// ---------- vista atleta: seduta pista mezzofondo (prescrizione da seguire a ritmo) ----------
function volumePistaMezzo(s) { return (s.elementi || []).reduce((t, e) => t + (e.volume || 0), 0); }
// l'atleta scrive il tempo di una ripetuta (mm:ss oppure secondi) → salvato in secondi
function segnaTempoMezzo(sid, eid, i, val) {
  const s = sedutaDaId(sid), e = s && s.elementi.find(x => x.id === eid);
  if (!e || !e.tempi) return;
  const sec = _mzToSec(val);
  e.tempi[i] = (sec != null && sec > 0) ? sec : null;
  disegna();
}
function vistaPistaMezzo(s) {
  return `${bloccoRiscaldamento(s)}
  ${typeof bloccoPliometria === "function" ? bloccoPliometria(s) : ""}
  ${s.elementi.map(e => {
    const cont = e.min != null;
    const prescr = cont ? `${e.min}′ in continuo` : `${e.ripetute} × ${e.distanza} m`;
    const tr = e.tempoRipSec != null ? _mzMMSS(e.tempoRipSec) : null;
    const km = e.volume ? Math.round(e.volume / 100) / 10 : 0;
    // caselle per i tempi reali delle ripetute (mm:ss). Verde/rosso vs il tempo target a ripetuta.
    let bloccoTempi = "";
    if (e.tempi) {
      const fatte = e.tempi.filter(v => v != null);
      const best = fatte.length ? Math.min(...fatte) : null;
      const caselle = e.tempi.map((t, i) => {
        let cls = "";
        if (t != null && e.tempoRipSec != null) cls = (t - e.tempoRipSec) / e.tempoRipSec * 100 > 4 ? "male" : "bene";
        return `<input class="tempo ${cls}" value="${t != null ? _mzMMSSc(t) : ""}" placeholder="m:ss.cc"
          onchange="segnaTempoMezzo('${s.id}','${e.id}',${i},this.value)">`;
      }).join("");
      bloccoTempi = `<p class="et" style="margin:8px 0 6px">Segna il tempo di ogni ripetuta${best != null ? ` · <b style="color:var(--verde)">meglio ${_mzMMSSc(best)}</b>` : ""}</p>
        <div class="tempi">${caselle}</div>`;
    }
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3>${prescr}</h3>
        <span class="et" style="margin:0">${e.mezzo || ""}</span>
      </div>
      <p class="et" style="margin:4px 0 2px">ritmo <b>${e.ritmoKm}/km</b>${tr ? " · ~" + tr + " a ripetuta" : ""}${e.recupero ? " · rec " + e.recupero : ""}</p>
      <p class="et" style="margin:0">volume ${(e.volume || 0).toLocaleString("it-IT")} m${km ? " · " + km + " km" : ""}</p>
      ${e.contenuto ? `<p class="et" style="margin:6px 0 0">${e.contenuto}</p>` : ""}
      ${bloccoTempi}
      ${typeof bloccoSforzoPista === "function" ? bloccoSforzoPista(s.id, e) : ""}
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
  const _n = x => { const v = Number(String(x == null ? "" : x).replace(",", ".")); return isNaN(v) ? 0 : v; };  // tollerante alla virgola
  const pts = [];
  (cs.prove || []).forEach(p => {
    const dist = _n(p.dist), t = _n(p.min) * 60 + _n(p.sec);
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
  const lanDist = _n(cs.lanDist) || 30, lanT = _n(cs.lanTempo);
  R.vmax = (lanDist > 0 && lanT > 0) ? lanDist / lanT : null;
  const pb15 = atleta ? _mzPbSec(atleta, "1500 m") : null;
  R.rit1500ms = pb15 ? 1500 / pb15 : null;
  R.srr = (R.vmax != null && R.rit1500ms) ? R.vmax / R.rit1500ms : null;
  return R;
}

// spiegazioni in parole semplici
function _spiegCsGara(g) {
  if (g == null) return "Dice quanto la tua velocità sostenibile (CS) è vicina al ritmo dei 5000 in gara (di solito ~90-95%). Serve il PB 5000.";
  const p = Math.round(g * 100);
  if (g > 0.96) return "CS ALTA (" + p + "%): la tua soglia sul campo è quasi al ritmo gara → motore aerobico forte. Per migliorare lavora SOPRA (VO2max, tratti a ritmo gara).";
  if (g < 0.9) return "CS BASSA (" + p + "%): la soglia è lontana dal ritmo gara → da rinforzare con sedute di soglia e tanta corsa facile.";
  return "CS NELLA NORMA (" + p + "%): buon equilibrio. Mantieni la soglia e aggiungi un po' di VO2max.";
}
function _spiegDprime(dp) {
  if (dp == null) return "";
  const d = Math.round(dp);
  if (dp < 150) return "D′ BASSO (" + d + " m): poco “serbatoio” di scatto sopra la soglia. Per l'800/1500 allena VELOCITÀ e prove lattacide.";
  if (dp > 250) return "D′ ALTO (" + d + " m): buon serbatoio di scatto → sfruttalo nei finali veloci.";
  return "D′ MEDIO (" + d + " m): serbatoio di scatto discreto, migliorabile con velocità e prove lattacide.";
}
// testo coaching per disciplina, in parole semplici
function _csCoach(disc, R) {
  if (R.cs == null) return "(fai il test: 2-4 prove a tutta su distanze diverse)";
  const g = R.csGara, dp = R.dprime;
  if (disc === "800") {
    let t = "Per l'800/1500 contano la CS (la tua soglia sul campo) e SOPRATTUTTO il D′ (il “serbatoio” di scatto sopra la soglia). ";
    if (dp != null) t += "Il tuo D′ è " + Math.round(dp) + " m: " + (dp < 150 ? "BASSO → allena VELOCITÀ (allunghi 60-120 m veloci) e ripetute LATTACIDE (200-600 m a ritmo gara): è la tua arma. " : (dp > 250 ? "buono → sfruttalo nei finali veloci; mantieni la base. " : "medio → puoi alzarlo con velocità e prove lattacide. "));
    if (g != null) t += "La CS vale il " + Math.round(g * 100) + "% del ritmo gara: " + (g < 0.9 ? "soglia da rinforzare con volume facile." : "soglia a posto.");
    return t;
  }
  if (disc === "35") {
    let t = "Per il 3000/5000 conta soprattutto la CS (= la tua soglia sul campo). ";
    t += g == null ? "Inserisci il PB 5000 per il confronto con la gara." : (g < 0.9 ? "Da te è un po' bassa: più sedute di SOGLIA e tanta corsa facile per alzarla." : (g > 0.96 ? "Da te è ottima: mantienila e aggiungi VO2max e tratti a ritmo gara." : "Da te è a posto: soglia + un po' di VO2max."));
    return t;
  }
  let t = "Per il 5000/10000 la CS (soglia) e il VOLUME sono tutto. ";
  t += g == null ? "" : (g < 0.9 ? "La CS è da alzare: sedute di soglia/sub-soglia + tanta corsa facile." : "La CS è a posto: mantienila e aumenta la corsa facile e il lungo. Il D′ (scatto) conta poco per te.");
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
function toggleCsGuida() { S.csGuida = !S.csGuida; disegna(); }

function vistaCriticalSpeed() {
  const a = csState.atletaRif ? DEMO.atleti.find(x => x.id === csState.atletaRif) : null;
  const intro = `<div class="card"><h3>Velocità Critica (Critical Speed)</h3>
    <p class="et" style="margin-top:2px">La versione "sul campo" della soglia: da 2-4 prove <b>a tutta</b> su distanze diverse trova la <b>CS</b> (la velocità che tieni a lungo = la tua soglia) e il <b>D′</b> (il “serbatoio” di scatto sopra la soglia).</p>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="toggleCsGuida()">${S.csGuida ? "Nascondi come si fa" : "📋 Come si fa il test"}</button>
    ${S.csGuida ? `<div style="margin-top:10px;padding:11px 13px;background:var(--card2,rgba(120,120,140,.08));border-radius:10px">
      <p class="et" style="margin:0 0 6px"><b>Come si fa</b> (sul campo)</p>
      <p class="et" style="margin:0 0 6px"><b>1.</b> Scegli <b>2 distanze ben diverse</b> (meglio 3-4), con rapporto ~2:1: es. <b>1200 m e 2400 m</b>, oppure una prova di <b>3′</b> e una di <b>12′</b>.</p>
      <p class="et" style="margin:0 0 6px"><b>2.</b> Corri ogni prova <b>a tutta</b> (il massimo che reggi per quella distanza), <b>ben riposato</b> tra una e l'altra — anche in <b>giorni diversi</b>.</p>
      <p class="et" style="margin:0 0 6px"><b>3.</b> Segna <b>distanza e tempo</b> di ogni prova qui sotto. L'app traccia la retta e trova CS e D′.</p>
      <p class="et" style="margin:0"><b>Facoltativo (tipo di atleta):</b> fai uno <b>sprint lanciato di 30 m</b> (parti già lanciato, cronometra solo i 30 m di punta) e mettilo nella sezione in fondo.</p>
    </div>` : ""}</div>`;
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
    <div style="padding:9px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="et" style="margin:0">CS rispetto al ritmo gara 5000</span><span style="white-space:nowrap"><b>${csPct}</b> ${csLab}</span></div>
      <p class="et" style="margin:5px 0 0">${_spiegCsGara(R.csGara)}</p>
    </div>
    <div style="padding:9px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="et" style="margin:0">D′ — serbatoio di scatto</span><span style="white-space:nowrap"><b>${R.dprime != null ? num(R.dprime) + " m" : "—"}</b> ${dpLab}</span></div>
      <p class="et" style="margin:5px 0 0">${_spiegDprime(R.dprime)}</p>
    </div>
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

// ============================================================================
// RIEPILOGO TEST — una pagina per atleta con tutto (lattato + velocità critica + ritmi).
// ============================================================================
let riepState = { atletaRif: "" };
function setRiepAtleta(id) { riepState.atletaRif = id; disegna(); }
// bucket-gara dalla specialità dell'atleta
function _buckDist(spec) {
  const s = (spec || "").toLowerCase();
  if (/10000|10\s?km|mezza|marat|campestre/.test(s)) return "10";
  if (/5000|3000|2000/.test(s)) return "35";
  return "800";
}
// confronto soglia lattato vs velocità critica (km/h)
function _confrontoSoglia(RL, RC) {
  const vLat = RL.vLT2, vCS = (RC.cs != null) ? RC.cs * 3.6 : null;
  if (vLat == null || vCS == null) return "";
  const diff = Math.abs(vLat - vCS) / vLat;
  if (diff < 0.03) return "✓ Lattato e velocità critica danno una soglia molto simile: dato solido.";
  return "I due test differiscono un po' (" + Math.round(diff * 100) + "%): normale, dipende da come sono stati fatti. Usa il lattato come riferimento e la CS come controprova.";
}
// opzioni: TUTTI gli atleti raggruppati per disciplina
function _optAtletiTutti(sel) {
  const grp = [["Velocisti / Saltatori", "vel"], ["Lanciatori", "lanci"], ["Mezzofondo / Fondo", "mezzo"]];
  const g = (typeof gruppoDi === "function") ? gruppoDi : () => "vel";
  let out = `<option value="">— scegli —</option>`;
  grp.forEach(([lab, k]) => {
    const arr = (DEMO.atleti || []).filter(x => g(x) === k);
    if (arr.length) out += `<optgroup label="${lab}">${arr.map(x => `<option value="${x.id}" ${sel === x.id ? "selected" : ""}>${x.nome}</option>`).join("")}</optgroup>`;
  });
  return out;
}
// dispatcher: la pagina si adatta alla disciplina dell'atleta
function vistaRiepilogoTest() {
  const a = riepState.atletaRif ? DEMO.atleti.find(x => x.id === riepState.atletaRif) : null;
  const intro = `<div class="card"><h3>Riepilogo test — atleta</h3>
    <p class="et" style="margin-top:2px">Tutti i test dell'atleta in una pagina. Si <b>adatta alla disciplina</b>: mezzofondo → soglia, zone e ritmi; velocità/lanci → PB, forza e salti.</p></div>`;
  const sel = `<div class="card"><label class="lab">Atleta</label>
    <select onchange="setRiepAtleta(this.value)" style="margin-top:6px">${_optAtletiTutti(riepState.atletaRif)}</select></div>`;
  if (!a) return intro + sel + `<div class="card"><p class="et">Scegli un atleta per vedere il suo riepilogo.</p></div>`;
  const isMezzo = (typeof gruppoDi === "function") && gruppoDi(a) === "mezzo";
  const body = isMezzo ? _riepMezzoHTML(a) : (typeof riepiloVelHTML === "function" ? riepiloVelHTML(a) : "<div class='card'><p class='et'>Riepilogo non disponibile.</p></div>");
  return intro + sel + body;
}
// corpo per il mezzofondo/fondo
function _riepMezzoHTML(a) {
  const num = (v, d) => (v == null || isNaN(v)) ? "—" : (d != null ? v.toFixed(d) : Math.round(v));
  const RL = analisiLattato((DEMO.lattato && DEMO.lattato[a.id]) || {}, a);
  const RC = analisiCriticalSpeed((DEMO.critSpeed && DEMO.critSpeed[a.id]) || {}, a);
  const hasL = RL.n > 0, hasC = RC.cs != null;
  const bucket = _buckDist(a.specialita);
  const ritmi = ritmiTarget(a, {});
  const rit = m => { const r = ritmi.find(x => x.mezzo === m); return r ? r.mmss : "—"; };
  const metodo = (typeof metodoLT2diAtleta === "function") ? metodoLT2diAtleta(a) : null;
  const pbTxt = MZ_DIST.map(d => { const s = _mzPbSec(a, d); return s != null ? d + " " + _mzMMSS(s) : null; }).filter(Boolean).join(" · ") || "nessun PB di mezzofondo";
  const R2 = (l, v) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line)"><span class="et" style="margin:0">${l}</span><span>${v}</span></div>`;

  const header = `<div class="card">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px"><h3>${a.nome}</h3><span class="et" style="margin:0">${a.disciplina} · ${a.specialita || ""}</span></div>
    <p class="et" style="margin-top:6px">PB: ${pbTxt}</p>
    <p class="et" style="margin-top:4px">Test: ${hasL ? "✓ lattato" : "— lattato"} · ${hasC ? "✓ velocità critica" : "— velocità critica"}</p></div>`;

  const cardSoglia = `<div class="card">
    <p class="et" style="margin-bottom:6px">La tua soglia (il ritmo-chiave)</p>
    ${R2("Usata negli allenamenti", `<b style="font-size:16px">${rit("Soglia LT2 (tempo)")}/km</b>${metodo ? ` <span class="et">(${metodo === "obla" ? "Test · OBLA 4" : "Test · Dmax"})</span>` : ` <span class="et">(stima dai PB)</span>`}`)}
    ${hasL ? R2("Test lattato · Dmax / OBLA", `<b>${RL.ritmoDmax || "—"} / ${RL.ritmoLT2 || "—"}</b>/km`) + R2("Andatura facile (LT1)", `<b>${RL.ritmoLT1 || "—"}</b>/km`) : ""}
    ${hasC ? R2("Velocità critica (dal campo)", `<b>${RC.ritmoCS}</b>/km · CS ${num(RC.cs, 2)} m/s`) : ""}
    ${hasL && hasC ? `<p class="et" style="margin:8px 0 0">${_confrontoSoglia(RL, RC)}</p>` : ""}
  </div>`;

  const zone = [["Rigenerazione", "molto facile"], ["Lungo", "facile, conversabile"], ["Medio / maratona", "controllato"], ["Soglia LT2 (tempo)", "comodo-duro (~1h)"], ["Sub-soglia", "un filo sotto soglia"], ["VO2max", "molto duro"], ["Ritmo gara 5000", "ritmo gara"], ["Velocità", "veloce, sciolto"]];
  const cardZone = `<div class="card">
    <p class="et" style="margin-bottom:6px">Zone di allenamento — ritmi /km</p>
    <div class="p-scroll"><table class="ptab pista-w"><tbody>
    ${zone.map(([m, s]) => `<tr><td><b>${m}</b></td><td class="pauto">${rit(m)}</td><td class="et">${s}</td></tr>`).join("")}
    </tbody></table></div></div>`;

  const cardProfilo = (hasL || hasC) ? `<div class="card">
    <p class="et" style="margin-bottom:8px">Profilo dell'atleta</p>
    ${hasL ? `<p class="et" style="margin:0 0 8px"><b>Soglia vs gara:</b> ${_spiegSogliaGara(RL.sogliaGara)}</p><p class="et" style="margin:0 0 8px"><b>Base aerobica:</b> ${_spiegAmpiezza(RL.ampiezza)}</p>` : ""}
    ${hasC ? `<p class="et" style="margin:0 0 8px"><b>Serbatoio di scatto (D′):</b> ${_spiegDprime(RC.dprime)}</p><p class="et" style="margin:0"><b>Tipo di atleta:</b> ${_csSpeedReserve(RC)}</p>` : ""}
  </div>` : "";

  const cardSintesi = `<div class="card">
    <p class="et" style="margin-bottom:6px">In sintesi — cosa lavorare (per ${a.specialita || "la tua gara"})</p>
    ${hasL ? `<p class="et" style="margin:0 0 8px"><b>Dal lattato:</b> ${_latCoach(bucket, RL)}</p>` : ""}
    ${hasC ? `<p class="et" style="margin:0"><b>Dalla velocità critica:</b> ${_csCoach(bucket, RC)}</p>` : ""}
    ${(!hasL && !hasC) ? `<p class="et" style="margin:0">Fai il <b>Test lattato</b> e/o la <b>Velocità critica</b> per la sintesi personalizzata. Intanto i ritmi qui sopra sono stimati dai PB.</p>` : ""}
  </div>`;

  return header + cardSoglia + cardZone + cardProfilo + cardSintesi;
}

// ============================================================================
// PER DISTANZA — programmazione distanza per distanza (800→10000), fedele all'Excel.
// ============================================================================
const MZ_PD_MEZZI = ["Base / Lungo", "Medio / maratona", "Soglia LT2 (T)", "Sub-soglia", "VO2max (I)", "Ritmo gara", "Cap. lattacida", "Pot. lattacida", "Velocità", "Forza-economia"];
const MZ_FORZA = { gen: "Forza generale (AA)", spec: "Forza max", pre: "Potenza / conversione", comp: "Mantenimento forza" };
const MZ_PD_FASI = [["gen", "Prep. generale"], ["spec", "Prep. speciale"], ["pre", "Pre-competitiva"], ["comp", "Competitiva"]];
const MZ_PERDIST = [
  {
    nome: "800 m", prof: "~60-75% aerobico / 25-40% anaerobico",
    qual: "1) Cap./Pot. lattacida  2) Velocità  3) VO2max  4) Soglia/Base (supporto)",
    vol: "giovani 25-45 · senior 45-80 · elite 50-120 km/sett (4-12 sedute)",
    dis: "Più POLARIZZATA: base ampia ma volume totale contenuto; molta qualità veloce/lattacida.",
    mx: ["***|**|*|*", "**|**|*|-", "**|**|*|*", "*|*|-|-", "-|**|**|**", "-|*|***|***", "-|*|***|***", "-|-|**|***", "***|***|***|***", "***|***|**|*"],
    per: [["Prep. generale", "6-8 sett", "base aerobica + soglia + forza generale + velocità"], ["Prep. speciale", "5-6 sett", "VO2max + soglia + forza max + collinari + avvio lattacido"], ["Pre-competitiva", "3-4 sett", "ritmo gara 800 + capacità lattacida + velocità"], ["Competitiva", "8-12 sett", "potenza lattacida + ritmo gara + rifinitura"]],
    cs: "Onda 3:1 (2:1 se giovane/periodo duro). Scarico = volume −40/50%, intensità invariata. Taper pre-gara A ~7-10 giorni, tenendo stimoli veloci/lattacidi brevi.",
    fac: "35-45'", lung: "60-70'",
    Q: { gen: ["Soglia 5-6×1000 (rec 60-90″)", "Collinari 8-10×150 in salita + allunghi", "Ripetute 6-8×400 controllate + velocità"], spec: ["VO2max 5-6×800 a ritmo 3-5k", "Soglia 4×1500 o 20' T", "Avvio lattacido 6×300 a ritmo gara + velocità"], pre: ["Ritmo gara: 5-6×300-500 a ritmo 800", "VO2max breve 5×600", "Cap. lattacida 4-5×300-400, rec lunghi"], comp: ["Ritmo gara: 4×200-300 a ritmo/più veloce", "Pot. lattacida 3-4×150-250 forte", "Rifinitura: allunghi veloci / pre-gara"] }
  },
  {
    nome: "1500 m", prof: "~75-85% aerobico / 15-25% anaerobico",
    qual: "1) VO2max + Soglia  2) Velocità specifica  3) Base aerobica  4) Lattacido (pre-comp)",
    vol: "giovani 30-55 · senior 55-95 · elite 120-170 km/sett (6-14 sedute)",
    dis: "Incrocio veloce/prolungato: piramidale in prep, più polarizzata verso la gara.",
    mx: ["***|**|**|*", "**|**|*|-", "**|***|**|*", "*|**|*|-", "*|***|***|***", "-|*|***|***", "-|*|**|***", "-|-|*|**", "**|**|**|***", "***|**|*|*"],
    per: [["Prep. generale", "6-8 sett", "base + soglia + forza generale + allunghi"], ["Prep. speciale", "5-7 sett", "VO2max (cardine) + soglia + forza max + collinari"], ["Pre-competitiva", "3-4 sett", "ritmo gara 1500 + VO2max + avvio lattacido"], ["Competitiva", "8-10 sett", "ritmo gara + lattacido + rifinitura"]],
    cs: "Onda 3:1. Scarico −40/50% volume, intensità invariata. Taper pre-gara A ~7-10 giorni.",
    fac: "40-50'", lung: "75-90'",
    Q: { gen: ["Soglia 6×1000 T", "Fartlek o 8×400 controllati + allunghi", "Collinari + velocità"], spec: ["VO2max 5-6×1000 a ritmo 3-5k", "Soglia 5×1500 / 25' T", "Ritmo gara 5-6×500-600"], pre: ["Ritmo gara 1500: 4-6×400-600 a ritmo", "VO2max 5×800", "Lattacido 4-5×300 a ritmo gara"], comp: ["Ritmo gara: 4-5×300-500 a ritmo", "VO2max breve 4×600", "Rifinitura + allunghi"] }
  },
  {
    nome: "3000 m", prof: "~86-94% aerobico",
    qual: "1) VO2max  2) Soglia LT2  3) Economia  4) Base + velocità",
    vol: "giovani 35-65 · senior 65-110 · elite 130-180 km/sett (6-14 sedute)",
    dis: "Piramidale con forte componente VO2max/soglia; polarizza in pre-comp.",
    mx: ["***|***|**|**", "**|***|**|*", "***|***|***|**", "**|**|**|*", "*|**|***|***", "-|*|***|***", "-|-|*|*", "-|-|-|-", "**|**|**|**", "***|**|*|*"],
    per: [["Prep. generale", "8-10 sett", "base + soglia + forza generale"], ["Prep. speciale", "5-7 sett", "soglia + VO2max + medio + forza max"], ["Pre-competitiva", "3-5 sett", "VO2max + ritmo gara 3000"], ["Competitiva", "in-season", "ritmo gara + soglia di richiamo + rifinitura"]],
    cs: "Onda 3:1. Scarico −40/50% volume. Taper pre-gara A ~10-12 giorni.",
    fac: "45-55'", lung: "80-100'",
    Q: { gen: ["Soglia 6-8×1000 T", "Fartlek / 8×400 + allunghi", "Progressivo o collinari"], spec: ["Soglia 5×1 miglio", "VO2max 5-6×1000 a ritmo 5k", "Medio-progr. o 2000+1000 ritmo gara"], pre: ["Ritmo gara 3000: 4-5×1000 a ritmo", "VO2max 5×1000", "Soglia breve 20'"], comp: ["Ritmo gara: 3-4×1000 a ritmo", "VO2max breve 5×800", "Rifinitura + allunghi"] }
  },
  {
    nome: "5000 m", prof: "~90-95% aerobico",
    qual: "1) Soglia LT2  2) VO2max  3) Economia  4) Volume/base",
    vol: "giovani 35-70 · senior 65-115 · elite 130-180 km/sett (6-14 sedute)",
    dis: "Piramidale: tanta Z1 + soglia; VO2max e ritmo gara nella fase specifica.",
    mx: ["***|***|**|**", "**|***|**|*", "***|***|***|**", "**|**|**|*", "*|**|***|**", "-|*|***|***", "-|-|*|*", "-|-|-|-", "**|**|*|*", "***|**|*|*"],
    per: [["Prep. generale", "8-10 sett", "base + soglia + forza generale"], ["Prep. speciale", "6-8 sett", "soglia/sub-soglia + VO2max + medio"], ["Pre-competitiva", "3-5 sett", "VO2max + ritmo gara 5000"], ["Competitiva", "in-season", "ritmo gara + soglia + rifinitura"]],
    cs: "Onda 3:1. Scarico −40/50% volume. Taper pre-gara A ~10-14 giorni.",
    fac: "50-60'", lung: "85-105'",
    Q: { gen: ["Soglia 6-8×1000 T", "Medio 12-14 km", "Progressivo / fartlek + allunghi"], spec: ["Soglia/sub-soglia 5-6×2000", "VO2max 5-6×1000 a ritmo 5k", "Medio-progressivo 12-14 km"], pre: ["Ritmo gara 5000: 4-5×1000-1600 a ritmo", "VO2max 5×1000", "Soglia 20-30'"], comp: ["Ritmo gara: 5×1000 a ritmo", "VO2max breve 5×800", "Rifinitura + allunghi"] }
  },
  {
    nome: "10000 m", prof: "~95-97% aerobico",
    qual: "1) Soglia (LT1/LT2)  2) VO2max  3) Economia  4) Volume alto",
    vol: "giovani 40-70 · senior 70-120 · elite 130-190 km/sett (6-14 sedute)",
    dis: "Piramidale con volume alto: massima Z1 + tanta soglia/sub-soglia.",
    mx: ["***|***|***|**", "**|***|**|**", "***|***|***|***", "**|***|**|*", "*|**|**|**", "-|*|***|***", "-|-|-|-", "-|-|-|-", "**|*|*|*", "***|**|*|*"],
    per: [["Prep. generale", "8-12 sett", "base (volume max) + soglia + forza generale"], ["Prep. speciale", "6-8 sett", "soglia/sub-soglia (cardine) + VO2max + medio-progr."], ["Pre-competitiva", "3-5 sett", "ritmo gara 10000 + VO2max"], ["Competitiva", "in-season", "ritmo gara + soglia + lunghi con finale"]],
    cs: "Onda 3:1. Scarico −40/50% volume. Taper pre-gara A ~10-14 giorni.",
    fac: "50-60'", lung: "90-120'",
    Q: { gen: ["Soglia 6-8×1000 T", "Medio-lungo 14-16 km", "Progressivo / fartlek"], spec: ["Sub-soglia 6×2000 (o doppia soglia)", "VO2max 5×1000", "Medio-progressivo 12-16 km"], pre: ["Ritmo gara 10000: 5-6×1600-2000 a ritmo", "Soglia 30-40'", "VO2max 5×1000"], comp: ["Ritmo gara: 6×1000 a ritmo", "Soglia di richiamo 20-30'", "Rifinitura + allunghi"] }
  }
];
let pdState = { dist: "800 m", fase: "gen" };
function setPdDist(n) { pdState.dist = n; disegna(); window.scrollTo(0, 0); }
function setPdFase(f) { pdState.fase = f; disegna(); }
const _pdInt = v => v === "***" ? "●●●" : v === "**" ? "●●" : v === "*" ? "●" : "–";

// ============================================================================
// PER DISTANZA — VELOCITÀ (60/100/200/400). Stessa struttura del mezzofondo.
// Fonti: Spencer & Gastin 2001 (contributo energetico), de Villarreal 2012 (meta-analisi
// pliometria→sprint), rev. sist. sprint resistito 2024, Francis/ALTIS, NSCA, Bompa/Buzzichelli.
// ============================================================================
const VEL_PD_MEZZI = ["Accelerazione (0-30 m)", "Velocità max (lanciati)", "Speed endurance (60-150 m)", "Special endurance (150-300+)", "Tempo estensivo (recupero)", "Forza massimale", "Forza esplosiva / balistico", "Olympic lifts / potenza", "Pliometria", "Tecnica / andature", "Partenze dai blocchi"];
const VEL_FORZA = { gen: "Forza generale (AA)", spec: "Forza max", pre: "Potenza / conversione", comp: "Mantenimento forza" };
const VEL_PERDIST = [
  {
    nome: "60 m", prof: "~100% ALATTACIDO (ATP-PC). Gara 6.5-7.5 s: partenza + accelerazione + primi metri di velocità massima.",
    qual: "1) Accelerazione / forza esplosiva  2) Velocità max  3) Reattività (RFD, plio)  4) Tecnica di partenza",
    vol: "Sprint di qualità 300-600 m/seduta (0-60 m), recuperi COMPLETI · 2-3 sedute veloci/sett",
    dis: "Corto→lungo: dominano blocchi, accelerazione e velocità max; volumi bassissimi, massima freschezza nervosa.",
    mx: ["***|***|***|***", "**|***|***|***", "*|**|**|*", "-|-|-|-", "***|**|*|*", "***|***|**|*", "**|***|***|**", "**|***|**|*", "**|***|**|**", "***|***|**|**", "**|***|***|***"],
    per: [["Prep. generale", "6-10 sett", "forza generale (AA) + tecnica + tempo + accelerazioni submax + plio estensiva"], ["Prep. speciale", "6-8 sett", "forza max + accelerazioni max + velocità max + blocchi + plio intensiva"], ["Pre-competitiva", "3-5 sett", "conversione a potenza + velocità max + blocchi (reattività), volumi giù"], ["Competitiva", "in-season", "velocità max di qualità + blocchi + taper; volumi bassi, alta freschezza"]],
    cs: "Onda 3:1 (2:1 nei periodi nervosi intensi). Scarico −40/50% volume, intensità invariata. Taper pre-gara ~7-10 gg con stimoli brevi e veloci. Recuperi COMPLETI sui lavori di velocità.",
    tempo: "6-10×100-150 m", rec: "completo 3-6' tra le prove veloci",
    Q: {
      gen: ["Accelerazioni 6-8×20-30 m (submax→max) + tecnica", "Velocità/tempo 8-10×60 m ~85% + andature", "Multibalzi + accel 4-6×30 m + forza"],
      spec: ["Accelerazioni max 5-6×30-40 m dai blocchi", "Velocità max 4-6×(20-30 m lanciati)", "Blocchi + accel 20-40 m + potenza"],
      pre: ["Velocità max 4-5×30 m lanciati (qualità)", "Blocchi 6-8×30 m (reazione + accel)", "Accel / velocità max 20-40 m + rifinitura"],
      comp: ["Blocchi 20-40 m di qualità (poche prove)", "Velocità max 3-4×20-30 m lanciati", "Attivazione pre-gara / allunghi veloci"]
    }
  },
  {
    nome: "100 m", prof: "Prevalentemente ALATTACIDO + anaerobico glicolitico (~10-15% aerobico). Accelerazione, velocità max e mantenimento.",
    qual: "1) Accelerazione + velocità max  2) Forza esplosiva / RFD  3) Speed endurance breve  4) Tecnica",
    vol: "Sprint di qualità 400-800 m/seduta (0-100 m), recuperi completi · 2-3 sedute veloci/sett",
    dis: "Corto→lungo: accelerazione e velocità max dominanti; speed endurance breve verso la gara. Freschezza nervosa.",
    mx: ["***|***|***|***", "**|***|***|***", "*|**|***|**", "-|*|*|-", "***|**|*|*", "***|***|**|*", "**|***|***|**", "**|***|**|*", "**|***|**|**", "***|***|**|**", "**|***|***|***"],
    per: [["Prep. generale", "6-10 sett", "forza generale + tecnica + tempo + accelerazioni + plio estensiva"], ["Prep. speciale", "6-8 sett", "forza max + accel/velocità max + avvio speed endurance + plio intensiva"], ["Pre-competitiva", "3-5 sett", "velocità max + speed endurance + conversione a potenza"], ["Competitiva", "in-season", "velocità max di qualità + blocchi + rifinitura; volumi bassi"]],
    cs: "Onda 3:1 (2:1 nei periodi intensi). Scarico −40/50% volume, intensità invariata. Taper pre-gara ~7-10 gg. Recuperi COMPLETI sulla velocità.",
    tempo: "8-12×100-150 m", rec: "completo 4-8' sui lavori veloci",
    Q: {
      gen: ["Accelerazioni 6-8×30 m + tecnica", "Tempo intensivo 8-10×80-100 m ~85%", "Accel 30-40 m + multibalzi + forza"],
      spec: ["Accelerazioni max 5-6×40-60 m", "Velocità max 4-6×(30 m lanciati)", "Speed endurance 4-5×80-120 m ~95%"],
      pre: ["Velocità max 4-5×(30-40 m lanciati)", "Speed endurance 3-4×120-150 m ~95%", "Blocchi 30-60 m + potenza"],
      comp: ["Blocchi / accel 30-60 m di qualità", "Velocità max 3-4×30 m lanciati", "Rifinitura + allunghi / gara"]
    }
  },
  {
    nome: "200 m", prof: "~71% anaerobico / 29% aerobico (Spencer & Gastin 2001). Velocità max + speed endurance, con curva.",
    qual: "1) Velocità max  2) Speed endurance  3) Accelerazione (in curva)  4) Forza / potenza",
    vol: "Qualità 600-1200 m/seduta (30-150 m); + tempo estensivo per la base · 3-4 sedute chiave/sett",
    dis: "Corto→lungo che si estende: velocità max e speed endurance dominanti; special endurance verso la gara.",
    mx: ["**|***|**|**", "**|***|***|***", "**|***|***|**", "*|**|***|**", "***|**|**|*", "***|***|**|*", "**|***|**|**", "**|**|**|*", "**|***|**|*", "***|**|**|**", "*|**|**|**"],
    per: [["Prep. generale", "6-10 sett", "base (tempo) + forza generale + tecnica + accelerazioni"], ["Prep. speciale", "6-8 sett", "velocità max + speed endurance + forza max + curva"], ["Pre-competitiva", "3-5 sett", "special endurance + ritmo gara 200 + velocità max"], ["Competitiva", "in-season", "speed endurance di qualità + rifinitura + gara"]],
    cs: "Onda 3:1. Scarico −40/50% volume, intensità invariata. Taper ~7-10 gg. Recuperi pieni sulla qualità; tempo per la capacità di lavoro.",
    tempo: "10-14×100-200 m", rec: "3-8' sui veloci, più corto sul tempo",
    Q: {
      gen: ["Accelerazioni 6×30-40 m + tecnica", "Tempo intensivo 10-12×100-150 m ~80-85%", "Curve / accel + multibalzi + forza"],
      spec: ["Velocità max 4-6×(30-40 m lanciati)", "Speed endurance 4-5×120-150 m ~95%", "Accel in curva 40-60 m + potenza"],
      pre: ["Special endurance 3-4×150-200 m 90-95%", "Velocità max 4×40 m lanciati", "Ritmo gara: 2-3×(150+150) rec breve"],
      comp: ["Speed endurance 3×150 m di qualità", "Velocità max 3×30-40 m", "Rifinitura + gara"]
    }
  },
  {
    nome: "400 m", prof: "~57% anaerobico / 43% aerobico (Spencer & Gastin 2001). Special endurance + tolleranza al lattato.",
    qual: "1) Special endurance  2) Speed endurance  3) Velocità di base  4) Forza-resistenza / tolleranza lattato",
    vol: "Qualità 1000-2000 m/seduta (150-300+ m, frazionati); tempo esteso per la base aerobica · 3-5 sedute/sett",
    dis: "Base ampia (tempo) + speed endurance; special endurance e ritmo gara verso la competizione. La più aerobica degli sprint.",
    mx: ["*|**|**|*", "*|**|**|**", "**|***|***|**", "**|***|***|***", "***|***|**|*", "**|***|**|*", "*|**|**|*", "*|**|*|*", "*|**|*|*", "**|**|**|*", "*|**|**|**"],
    per: [["Prep. generale", "8-12 sett", "tempo (volume alto) + forza-resistenza + tecnica + accelerazioni"], ["Prep. speciale", "6-8 sett", "speed endurance + special endurance + forza max"], ["Pre-competitiva", "3-5 sett", "special endurance + ritmo gara 400 (split) + velocità"], ["Competitiva", "in-season", "special endurance di qualità + rifinitura + gara"]],
    cs: "Onda 3:1. Scarico −40/50% volume, intensità invariata. Taper ~10-12 gg. Recuperi lunghi sui special endurance (fino a 8-15').",
    tempo: "12-16×100-200 m (rec brevi)", rec: "lunghi sui special (8-15')",
    Q: {
      gen: ["Tempo intensivo 12-16×100-200 m 75-85% (rec brevi)", "Accelerazioni 6×40-60 m + tecnica", "Forza-resistenza + collinari / circuiti"],
      spec: ["Speed endurance 5-6×150-200 m 90-95%", "Special endurance 3-4×250-300 m ~90%", "Velocità max 4×40 m lanciati + potenza"],
      pre: ["Special endurance 2-3×300 m 90-95% (rec lunghi)", "Ritmo gara: split 200+200 / 300+100", "Speed endurance 4×150 m + rifinitura"],
      comp: ["Special endurance 2×300 m di qualità (rec pieni)", "Speed endurance 4×150 m", "Rifinitura + gara"]
    }
  }
];

function vistaPerDistanzaVel() {
  const d = VEL_PERDIST.find(x => x.nome === pdState.dist) || VEL_PERDIST[0];
  const fase = pdState.fase || "gen";
  const intro = `<div class="card"><h3>Per distanza — velocità</h3>
    <p class="et" style="margin-top:2px">Per ogni gara: profilo energetico, qualità, volumi, i <b>mezzi per periodo</b>, i periodi dell'anno e il <b>microciclo</b> per fase. I tempi target arrivano da <b>Velocità target</b>.</p>
    <p class="et" style="margin-top:8px;padding:8px 10px;background:var(--card2,rgba(120,120,140,.08));border-radius:8px"><b>Alto/basso (CNS):</b> alterna giorni VELOCI (blocchi, velocità max, speed endurance) a giorni di <b>tempo</b>/tecnica/recupero. Sui lavori veloci recuperi COMPLETI: la qualità viene prima della quantità.</p></div>`;
  const tabs = `<div class="tabbar">${VEL_PERDIST.map(x => `<button class="${x.nome === d.nome ? "on" : ""}" onclick="setPdDist('${x.nome}')">${x.nome.replace(" m", "")}</button>`).join("")}</div>`;
  const info = `<div class="card"><h3 style="margin-bottom:6px">${d.nome}</h3>
    ${[["Profilo di gara (energia)", d.prof], ["Qualità da allenare (priorità)", d.qual], ["Volumi di qualità", d.vol], ["Approccio / distribuzione", d.dis]].map(([l, v]) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="et" style="margin:0">${l}</span><p style="margin:2px 0 0;font-size:13px">${v}</p></div>`).join("")}</div>`;
  const matr = `<div class="card"><p class="et" style="margin-bottom:6px">Mezzi × periodo <span style="color:var(--txt3)">(●●● alto · ●● medio · ● basso · – assente)</span></p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Mezzo</th><th>Prep.gen</th><th>Prep.spec</th><th>Pre-comp</th><th>Comp</th></tr></thead>
      <tbody>${VEL_PD_MEZZI.map((m, i) => { const c = d.mx[i].split("|"); return `<tr><td><b>${m}</b></td>${c.map(v => `<td class="pauto" style="letter-spacing:1px">${_pdInt(v)}</td>`).join("")}</tr>`; }).join("")}</tbody>
    </table></div></div>`;
  const periodi = `<div class="card"><p class="et" style="margin-bottom:6px">Periodi dell'anno</p>
    ${d.per.map(([f, dur, foc]) => `<div style="padding:7px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between"><b style="font-size:13px">${f}</b><span class="et" style="margin:0">${dur}</span></div><p class="et" style="margin:3px 0 0">${foc}</p></div>`).join("")}
    <p class="et" style="margin-top:8px"><b>Carico/scarico/taper:</b> ${d.cs}</p>
    <p class="et" style="margin-top:6px">Tempo (recupero): <b>${d.tempo}</b> · Rec tra prove: <b>${d.rec}</b></p></div>`;
  const week = [
    ["Lun", d.Q[fase][0], true], ["Mar", "Tempo estensivo " + d.tempo + " + " + VEL_FORZA[fase] + " (forza)", false],
    ["Mer", d.Q[fase][1], true], ["Gio", "Tecnica/andature + core/prehab", false],
    ["Ven", (fase !== "comp" ? d.Q[fase][2] : d.Q[fase][2] + " o GARA"), true],
    ["Sab", "Tempo/recupero o gara C", false], ["Dom", "Riposo", false]
  ];
  const micro = `<div class="card"><p class="et" style="margin-bottom:6px">Microciclo per fase</p>
    <div class="tabbar" style="margin-bottom:10px">${MZ_PD_FASI.map(([k, l]) => `<button class="${k === fase ? "on" : ""}" onclick="setPdFase('${k}')">${l}</button>`).join("")}</div>
    ${week.map(([g, txt, veloce]) => `<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)">
      <div style="flex:none;width:38px"><b style="font-size:13px">${g}</b>${veloce ? `<div style="font-size:9px;color:var(--verde)">veloce</div>` : ""}</div>
      <p style="margin:0;font-size:13px;flex:1${veloce ? ";font-weight:500" : ";color:var(--txt2)"}">${txt}</p></div>`).join("")}
    <p class="et" style="margin-top:8px">I giorni <b style="color:var(--verde)">veloci</b> sono i lavori di qualità: copiali in <b>Pista</b> e i tempi arrivano da Velocità target. Onda 3:1 e taper come sopra.</p></div>`;
  const fonti = `<div class="card"><p class="et" style="margin:0;color:var(--txt3)">Fonti sprint: Spencer & Gastin 2001 (energia) · de Villarreal 2012 (pliometria→sprint) · Francis/ALTIS · NSCA. <b>Periodizzazione, forza e zone VBT</b> (Bompa & Buzzichelli, Mann/González-Badillo/<b>Squillante</b>) nelle tabelle «Periodizzazione &amp; Volumi» qui sotto.</p></div>`;
  return intro + tabs + info + matr + periodi + micro + fonti;
}

// selettore disciplina — "Per disciplina": tutto in un posto (velocità · mezzofondo · lanci)
function setPdDisc(x) { S.pdDisc = x; if (x === "vel") pdState.dist = "100 m"; else if (x === "mezzo") pdState.dist = "800 m"; disegna(); window.scrollTo(0, 0); }
function _pdSelettore(disc) {
  const opt = [["vel", "Velocità"], ["mezzo", "Mezzofondo / Fondo"], ["lanci", "Lanci"]];
  return `<div class="card" style="border-color:var(--blu)"><label class="lab">Disciplina</label>
    <div class="tabbar" style="margin-top:6px">${opt.map(([k, l]) => `<button class="${disc === k ? "on" : ""}" onclick="setPdDisc('${k}')">${l}</button>`).join("")}</div></div>`;
}
function vistaPerDistanza() {
  const disc = S.pdDisc || "vel";
  const sel = _pdSelettore(disc);
  if (disc === "lanci" && typeof vistaPeriodizzazioneLanci === "function") return sel + vistaPeriodizzazioneLanci();
  if (disc === "mezzo") return sel + _vistaPerDistanzaMezzo();
  // velocità: per-distanza + Periodizzazione & Volumi (velocità) unite
  return sel + vistaPerDistanzaVel() + (typeof vistaPeriodizzazione === "function" ? vistaPeriodizzazione() : "");
}

function _vistaPerDistanzaMezzo() {
  const d = MZ_PERDIST.find(x => x.nome === pdState.dist) || MZ_PERDIST[0];
  const fase = pdState.fase || "gen";
  const faseLab = (MZ_PD_FASI.find(f => f[0] === fase) || [])[1] || "";

  const intro = `<div class="card"><h3>Per distanza — programmazione essenziale</h3>
    <p class="et" style="margin-top:2px">Per ogni gara: profilo, qualità da allenare, volumi, i <b>mezzi per periodo</b>, i periodi dell'anno e il <b>microciclo</b> per fase. I ritmi arrivano dai <b>Ritmi target</b>.</p>
    <p class="et" style="margin-top:8px;padding:8px 10px;background:var(--card2,rgba(120,120,140,.08));border-radius:8px"><b>Settimana fissa:</b> Lun/Mer/Ven = lavori <b>cronometrati</b> (col coach). Mar/Gio/Sab = aerobico + <b>forza/tecnica</b> (coi tecnici). Dom = <b>lungo</b> (o gara).</p></div>`;

  const tabs = `<div class="tabbar">${MZ_PERDIST.map(x => `<button class="${x.nome === d.nome ? "on" : ""}" onclick="setPdDist('${x.nome}')">${x.nome.replace(" m", "")}</button>`).join("")}</div>`;

  const info = `<div class="card"><h3 style="margin-bottom:6px">${d.nome}</h3>
    ${[["Profilo di gara", d.prof], ["Qualità da allenare (priorità)", d.qual], ["Volumi (km/sett)", d.vol], ["Distribuzione intensità", d.dis]].map(([l, v]) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="et" style="margin:0">${l}</span><p style="margin:2px 0 0;font-size:13px">${v}</p></div>`).join("")}</div>`;

  const matr = `<div class="card"><p class="et" style="margin-bottom:6px">Mezzi × periodo <span style="color:var(--txt3)">(●●● alto · ●● medio · ● basso · – assente)</span></p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Mezzo</th><th>Prep.gen</th><th>Prep.spec</th><th>Pre-comp</th><th>Comp</th></tr></thead>
      <tbody>${MZ_PD_MEZZI.map((m, i) => { const c = d.mx[i].split("|"); return `<tr><td><b>${m}</b></td>${c.map(v => `<td class="pauto" style="letter-spacing:1px">${_pdInt(v)}</td>`).join("")}</tr>`; }).join("")}</tbody>
    </table></div></div>`;

  const periodi = `<div class="card"><p class="et" style="margin-bottom:6px">Periodi dell'anno</p>
    ${d.per.map(([f, dur, foc]) => `<div style="padding:7px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between"><b style="font-size:13px">${f}</b><span class="et" style="margin:0">${dur}</span></div><p class="et" style="margin:3px 0 0">${foc}</p></div>`).join("")}
    <p class="et" style="margin-top:8px"><b>Carico/scarico/taper:</b> ${d.cs}</p>
    <p class="et" style="margin-top:6px">Facile: <b>${d.fac}</b> · Lungo: <b>${d.lung}</b></p></div>`;

  // microciclo per fase (settimana)
  const week = [
    ["Lun", d.Q[fase][0], true], ["Mar", "Facile " + d.fac + " + " + MZ_FORZA[fase] + " (tecnici)", false],
    ["Mer", d.Q[fase][1], true], ["Gio", "Facile " + d.fac + " + core/prehab (tecnici)", false],
    ["Ven", d.Q[fase][2], true], ["Sab", "Facile/Medio + tecnica/andature/allunghi (tecnici)", false],
    ["Dom", (fase !== "comp" ? "Lungo " + d.lung : "Lungo " + d.lung + " o GARA"), false]
  ];
  const micro = `<div class="card"><p class="et" style="margin-bottom:6px">Microciclo per fase</p>
    <div class="tabbar" style="margin-bottom:10px">${MZ_PD_FASI.map(([k, l]) => `<button class="${k === fase ? "on" : ""}" onclick="setPdFase('${k}')">${l}</button>`).join("")}</div>
    ${week.map(([g, txt, crono]) => `<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)">
      <div style="flex:none;width:38px"><b style="font-size:13px">${g}</b>${crono ? `<div style="font-size:9px;color:var(--verde)">crono</div>` : ""}</div>
      <p style="margin:0;font-size:13px;flex:1${crono ? ";font-weight:500" : ";color:var(--txt2)"}">${txt}</p></div>`).join("")}
    <p class="et" style="margin-top:8px">I giorni <b style="color:var(--verde)">crono</b> (Lun/Mer/Ven) sono i lavori cronometrati: copiali in <b>Pista</b> e i ritmi arrivano dai Ritmi target. Onda 3:1 e taper come sopra.</p></div>`;

  return intro + tabs + info + matr + periodi + micro;
}

// ============================================================================
// TEMPLATE MICROCICLI mezzofondo — 5 blocchi (stessa struttura dei template velocità).
// giorni = [giorno, corsa, distanze/ritmo, palestra, %1RM·s×r, note, kind ("r"=riposo,"g"=gara)]
// ============================================================================
const MZ_TEMPLATE = [
  {
    titolo: "Blocco 1 · Prep. GENERALE (base aerobica, ~6-10 sett.)",
    parametri: "Tanta Z1 (≥80%) + 1-2 soglie + allunghi · Forza generale (AA) 2× · volume in crescita · distribuzione piramidale.",
    giorni: [
      ["Lun", "Facile + allunghi", "45-70' E + 6×100m", "Circuito forza generale full-body", "40-60% · 8-12 ×2-3", "RPE 6-7; costruzione", ""],
      ["Mar", "Soglia (T)", "20-30' continuo o 5-6×1000 T", "-", "-", "rec 60-90″; ~2.5-4 mmol", ""],
      ["Mer", "Facile / rigenerante", "40-60' E", "-", "-", "conversazione", ""],
      ["Gio", "Medio o collinari + forza", "8-12 km M oppure colli", "Forza generale 2 (squat/stacco/spinte)", "40-60% · 8-12 ×3", "", ""],
      ["Ven", "Facile + allunghi", "40' E + allunghi", "Core / prehab", "-", "recupero attivo", ""],
      ["Sab", "Lungo", "70-110' E", "-", "-", "fondo lento, aerobico", ""],
      ["Dom", "Riposo", "-", "-", "-", "-", "r"]
    ]
  },
  {
    titolo: "Blocco 2 · Prep. SPECIALE (soglia + VO2max, ~4-8 sett.)",
    parametri: "Più soglia + intervalli VO2max + collinari · Forza MAX 1-2× · volume alto · piramidale/polarizzato.",
    giorni: [
      ["Lun", "Soglia + allunghi", "6×1000-2000 T", "Forza MAX (squat/stacco)", "85-95% · 2-4 ×3-5", "rec 60-90″", ""],
      ["Mar", "Facile", "45-60' E", "-", "-", "", ""],
      ["Mer", "VO2max (I)", "5-6×1000 o 5-8×800 I", "-", "-", "rec 2-3'; ~ritmo 3-5k", ""],
      ["Gio", "Medio + forza", "10-14 km M", "Forza MAX 2 + oly leggeri", "85-100% · 1-3", "", ""],
      ["Ven", "Facile + allunghi", "40' + allunghi", "Core / prehab", "-", "recupero attivo", ""],
      ["Sab", "Lungo (finale più veloce)", "80-110'", "-", "-", "progressivo", ""],
      ["Dom", "Riposo", "-", "-", "-", "-", "r"]
    ]
  },
  {
    titolo: "Blocco 3 · PRE-COMPETITIVA (ritmo gara, ~3-5 sett.)",
    parametri: "Ritmo gara specifico + VO2max + (lattacido per 800/1500) · Conversione a potenza · volume medio, più polarizzato.",
    giorni: [
      ["Lun", "Ritmo gara", "5-6×1000 a ritmo gara", "Conversione potenza (balistico/oly)", "30-50% balistico / 70-85%", "rec pieni", ""],
      ["Mar", "Facile", "45' E", "-", "-", "", ""],
      ["Mer", "VO2max o lattacido", "5×1000 I  oppure  6×400 lattacido", "-", "-", "800/1500: lattacido; 5-10k: VO2max", ""],
      ["Gio", "Soglia breve + colli", "4×1500 T", "Potenza 2 (contrasto)", "70-85% + balistico", "", ""],
      ["Ven", "Facile + allunghi", "35' + allunghi", "-", "-", "recupero", ""],
      ["Sab", "Ritmo gara o gara C", "3-4×1000 a ritmo gara / gara", "-", "-", "specificità gara", ""],
      ["Dom", "Riposo", "-", "-", "-", "-", "r"]
    ]
  },
  {
    titolo: "Blocco 4 · COMPETITIVA (in-season)",
    parametri: "Ritmo gara di QUALITÀ + rifinitura, VOLUMI BASSI · Forza di mantenimento 1× · molto recupero · gara nel weekend.",
    giorni: [
      ["Lun", "Ritmo gara (qualità, vol. basso)", "4-5×1000 a ritmo gara", "Mantenimento forza/potenza", "80-90% · 1-3", "poche serie, alta qualità", ""],
      ["Mar", "Facile", "40' E", "-", "-", "", ""],
      ["Mer", "VO2max breve", "5×800 I", "-", "-", "freschezza", ""],
      ["Gio", "Rifinitura + allunghi", "20' + 4-6 allunghi", "-", "-", "", ""],
      ["Ven", "Attivazione pre-gara", "25' E + 3-4 allunghi", "-", "-", "pre-gara", ""],
      ["Sab", "GARA", "gara", "-", "-", "gara", "g"],
      ["Dom", "Riposo / rigenerante", "30' E (facolt.)", "-", "-", "-", "r"]
    ]
  },
  {
    titolo: "Blocco 5 · TAPER — settimana di gara (peaking)",
    parametri: "TAPER: volume −40/60%, intensità e frequenza INVARIATE · 2-3 stimoli brevi di qualità · obiettivo FRESCHEZZA/PICCO.",
    giorni: [
      ["Lun", "Qualità breve", "3-4×1000 a ritmo gara", "Richiamo forza breve", "85-90% · 1-2 serie", "taglia il volume, tieni l'intensità", ""],
      ["Mar", "Facile", "35' E", "-", "-", "freschezza", ""],
      ["Mer", "VO2max breve", "3-4×600 I", "-", "-", "stimolo breve", ""],
      ["Gio", "Facile + allunghi", "25' + 4 allunghi", "-", "-", "", ""],
      ["Ven", "Riposo / scarico", "20' E (facolt.)", "-", "-", "scarico", "r"],
      ["Sab", "GARA", "gara", "-", "-", "PICCO", "g"],
      ["Dom", "Riposo / recupero", "-", "-", "-", "-", "r"]
    ]
  }
];

// ============================================================================
// GUIDA MEZZI — i 13 mezzi spiegati (fedele all'Excel "Guida mezzi").
// [mezzo, scopo, intensità, struttura, recupero, volume/seduta, quando·chi, attenzione]
// ============================================================================
const MZ_GUIDA = [
  ["Rigenerazione", "Recupero attivo: flusso sanguigno, tecnica rilassata. NON è allenante, aiuta a recuperare.", "molto lento · <1.5 mmol · <70% FCmax · RPE 2-3 · rit.5000 +90-120″/km", "continuo 20-45'", "-", "-", "tutto l'anno, dopo sedute dure/gare · tutti", "Deve essere DAVVERO lento: l'errore più comune è correrlo troppo forte."],
  ["Lungo", "Base aerobica: capillari, mitocondri, economia, resistenza. È il fondamento di tutto.", "lento · 1-2 mmol · 70-82% FCmax · RPE 3-4 · rit.5000 +75-105″/km", "continuo 60-120' (pista 45-100')", "-", "12-28 km", "tutto l'anno (max prep gen.) · ++ 5-10k", "Durata progressiva nel tempo; non trasformarlo in medio."],
  ["Medio / maratona", "Resistenza aerobica «forte», supporto alla soglia, correre svelto a lungo.", "2-2.5 mmol · 83-88% FCmax · RPE 5-6 · rit.10k +25-40″/km", "continuo 8-18 km o 2-3×4-6 km", "90-120″", "8-18 km", "prep gen/spec · 3-10k", "Non superare la soglia: deve restare «controllato-duro»."],
  ["Soglia LT2 (T)", "Alza la velocità ALLA SOGLIA: il fattore più allenabile nel fondo; migliora lo smaltimento del lattato.", "ritmo ~1h gara · 2.5-4 mmol · 84-88% FCmax · RPE 6-7 · dal Test vLT2", "cont. 20-40' oppure 5-6×1miglio / 4-6×2000 / 6-8×1000", "60-90″", "5-10 km", "tutto l'anno, picco prep spec. · cardine 3-10k", "Il ritmo deve stare IN soglia (né 10k né maratona). Tara col Test lattato."],
  ["Sub-soglia (norvegese)", "Accumula TANTO volume di qualità appena sotto LT2 senza troppa fatica: grande stimolo aerobico.", "2.0-2.5 mmol (sotto LT2) · RPE 5-6 · ritmo soglia −5/10″/km", "5-6×2000 / 10-15×1000 / 20-25×400 (anche 2 doppie/gg)", "breve 30-60″", "8-14 km", "spec/pre-comp · 1500-10k evoluti", "Controlla il lattato (2-2.5): se sale troppo, stai correndo forte."],
  ["VO2max (I)", "Alza VO2max e vVO2max: potenza aerobica massima ed economia ad alta velocità.", "~ritmo 3000-5000 · 95-100% vVO2max · 3.5-8 mmol · RPE 8-9", "4-6×1000-1200 / 5-8×800 / 6-8×600 / 25-30×30″", "2-3' o = alla rip.", "4-8 km (15-25' al ritmo)", "spec + pre-comp · cardine 1500-5000", "Ritmo COSTANTE fino all'ultima; se crolli hai esagerato intensità/volume."],
  ["Ritmo gara 1500", "Specificità: meccanica, respiro e testa al ritmo esatto di gara.", "pari al ritmo obiettivo 1500 · RPE 8-9", "4-6×400-600 a ritmo gara", "1:1 → 1:0.5", "3-5 km", "pre-comp/comp · 1500 (e 800)", "Ritmo giusto e tenuta: è il test della forma specifica."],
  ["Ritmo gara 5000", "Specificità 5000: abituarsi al ritmo e alla sua durata.", "pari al ritmo obiettivo 5000 · RPE 7-8", "5-6×1000 a ritmo gara", "1:1 → 1:0.5", "4-6 km", "pre-comp/comp · 3000-5000", "Deve «girare» al ritmo con margine; occhio a non partire troppo forte."],
  ["Ritmo gara 10000", "Specificità 10000: resistenza al ritmo gara.", "pari al ritmo obiettivo 10000 · RPE 7-8", "6-8×1000-1600 a ritmo gara", "1:0.5", "5-8 km", "pre-comp/comp · 5000-10000", "Tenuta e ritmo costante su volume alto."],
  ["Capacità lattacida", "Tollerare/tamponare alto lattato: resistere all'acidosi. Chiave per 800/1500.", "ritmo 800-1500 · 8-12 mmol · RPE 9-10", "200-600 m a ritmo gara", "lungo 2-4' (1:2-1:3)", "1.2-3 km", "pre-comp/comp · 800-1500", "Tenere il ritmo nonostante l'acido; recuperi ampi, poco volume."],
  ["Potenza lattacida", "Massimizzare l'energia anaerobica lattacida: velocità di gara degli 800.", "quasi-massimale · >12 mmol · RPE 10", "150-400 m forte", "completo 4-8'", "0.6-1.5 km", "comp · 800 (soprattutto)", "Qualità altissima, recuperi pieni; volume molto basso."],
  ["Velocità / alattacido", "Velocità pura, reclutamento, economia neuromuscolare: il «cambio di marcia».", "massimale breve · RPE alto ma SENZA acido", "30-80 m sprint / allunghi 80-120 m", "completo", "0.3-0.8 km", "tutto l'anno (allunghi) · ++ 800", "Rilassatezza e tecnica; non è un lavoro lattacido."],
  ["Forza-economia", "Migliora l'economia di corsa (forza pesante + pliometria), struttura, prevenzione.", "palestra 80-100% 1RM poche rip + pliometria; colli 8-12×60-200 m", "vedi Palestra / Pliometria", "completo / jog", "2×/sett prep, 1× comp", "gen → mantenuto · tutti", "Non cercare ipertrofia: qualità e freschezza. Evidenza: +economia alle alte velocità."]
];
const MZ_GUIDA_COMBINA = [
  "Regola 80/20 (Seiler): ≥80% del volume facile (Rigenerazione/Lungo/base); i lavori DURI (Soglia, VO2max, lattacido, ritmo gara) sono 2-3 a settimana, con 48h tra loro.",
  "800: cardine Capacità/Potenza lattacida + Velocità + VO2max; base aerobica come supporto. Distribuzione più polarizzata, volume più basso.",
  "1500: VO2max + Soglia + Velocità specifica + un po' di lattacido nel pre-comp. È l'incrocio tra veloce e prolungato.",
  "3000-5000: Soglia (cardine) + VO2max + Lungo + Ritmo gara; distribuzione piramidale, volume medio-alto.",
  "5000-10000: Soglia/Sub-soglia (cardine) + VO2max + tanto Lungo/base + Ritmo gara; volume alto, piramidale.",
  "Per periodo: Prep. generale = Base + Soglia + Forza generale; Prep. speciale = + VO2max e più Soglia, Forza max; Pre-comp = Ritmo gara + (lattacido per 800/1500); Competitiva = qualità gara + rifinitura, TAPER prima delle gare A.",
  "Vedi anche «Per distanza» (matrice periodo × mezzo) e «Template microcicli» (settimane-tipo pronte)."
];
function vistaGuidaMezzi() {
  const lbl = (l, v) => `<div style="padding:3px 0"><b>${l}:</b> ${v}</div>`;
  const cards = MZ_GUIDA.map(m => `<div class="card">
    <h3>${m[0]}</h3>
    <p class="et" style="margin:4px 0 8px">${m[1]}</p>
    <div style="font-size:13px">
      ${lbl("Intensità", m[2])}
      ${lbl("Struttura", m[3])}
      ${m[4] !== "-" ? lbl("Recupero", m[4]) : ""}
      ${m[5] !== "-" ? lbl("Volume/seduta", m[5]) : ""}
      ${lbl("Quando · per chi", m[6])}
    </div>
    <p class="et" style="margin:8px 0 0;padding:7px 9px;background:rgba(240,168,60,.12);border-radius:8px">⚠ ${m[7]}</p>
  </div>`).join("");
  const combina = `<div class="card"><p class="et" style="margin-bottom:6px">Come combinarli — settimana e periodo</p>
    ${MZ_GUIDA_COMBINA.map(t => `<p class="et" style="margin:0 0 7px">• ${t}</p>`).join("")}</div>`;
  return `<div class="card"><h3>Guida ai mezzi (mezzofondo/fondo)</h3>
    <p class="et" style="margin-top:2px">I 13 mezzi spiegati: a cosa servono, come strutturarli (distanze/recuperi/volume), quando usarli e gli errori da evitare. I ritmi arrivano dai <b>Ritmi target</b>.</p></div>
    ${cards}${combina}`;
}

// ============================================================================
// GUIDA TEST MEZZOFONDO — a cosa servono i test, come si leggono, cosa allenare.
// [test, a cosa serve, come si fa, come si legge, "se esce → allena", fonte]
// ============================================================================
const MZ_GUIDA_TEST = [
  ["Test lattato — curva & soglie", "Trova le due soglie (LT1, LT2) e i ritmi/zone REALI dell'atleta. È il test più importante per il fondo.", "Step di 3-4', +1 km/h a step, prelievo di lattato a fine step, velocità crescenti (5-8 step).", "La curva sale piano poi IMPENNA. LT1 = primo rialzo (baseline+0.5, ~2 mmol) = tetto della corsa lenta. LT2 = impennata (OBLA 4.0 / baseline+1.5 / Dmax) = ritmo di SOGLIA. Dmax (più affidabile) = punto della curva a max distanza dalla retta che ne unisce gli estremi. Guarda anche la FC alle soglie.", "Curva che impenna PRESTO (LT2 a bassa velocità) → manca soglia/base: più T + Sub-soglia + volume facile (Z1). Curva «piatta e spostata a destra» → ottima resistenza: spingi VO2max e ritmo gara. Divario LT1-LT2 ampio → margine: alza la soglia con lavoro a T.", "Goodwin & Gladden; Mader (OBLA); Dmax"],
  ["Velocità critica (CS / D')", "Stima la soglia dal CAMPO (senza lattametro) + la capacità anaerobica.", "2-4 prove a tutta su distanze diverse (es. 1200 e 2400 m, o 3' e 12'), ben recuperate.", "Retta distanza-tempo: la PENDENZA = CS (m/s, ~soglia sostenibile), l'INTERCETTA = D' (m, riserva anaerobica). R² vicino a 1 = affidabile. Dà anche il ritmo/km a CS.", "CS alta ma D' basso = «diesel» (fondo forte, poca punta) → se fai 800/1500 allena Velocità/lattacido. D' alto ma CS bassa = tanta punta poca soglia → allena T/Sub-soglia + volume. 5-10k: conta CS. 800-1500: conta anche D'.", "Monod-Scherrer; Jones (Critical Power)"],
  ["VO2max (stima o laboratorio)", "Capacità aerobica massima: il «tetto» della potenza aerobica. Con la vVO2max fissi il ritmo degli intervalli.", "Campo: Cooper 12' o test progressivo / da prova 1500-3000 (stima). Oppure laboratorio.", "ml/kg/min (amatore evoluto ~55-65, elite ~70-85). vVO2max = velocità a VO2max (~ritmo 3000 m): è il ritmo degli intervalli «I».", "VO2max alto ma prestazione scarsa → problema di ECONOMIA o soglia: Forza-economia + Soglia. VO2max basso ma % di soglia alta → margine: inserisci intervalli I (5-6×1000). vVO2max bassa → intervalli al ritmo 3000 + economia (allunghi, pliometria).", "Billat (vVO2max); Daniels"],
  ["Prove cronometrate (600-10000)", "Verifica diretta della forma per distanza e taratura dei ritmi.", "Prove a tutta o submax controllate, sempre nella stessa condizione.", "Delta tra sessioni + confronto col PB (semaforo nel foglio Test).", "Migliori sulle brevi ma non sulle lunghe → manca resistenza/soglia (più Lungo, T, volume). Migliori sulle lunghe ma non sulle brevi → manca velocità/VO2max (più I, Ritmo gara, Velocità).", "-"],
  ["Salti CMJ / SJ (uso elastico)", "Forza esplosiva degli arti inferiori e uso ELASTICO (lega all'economia/rigidità).", "CMJ (con contromovimento) e SJ (da fermo, senza rimbalzo). Best di 2-3 prove.", "CMJ − SJ = quota «elastica». CMJ-SJ basso (<2-3 cm) = poco uso elastico. SJ basso = poca forza esplosiva.", "CMJ-SJ basso → PLIOMETRIA reattiva (rimbalzi, drop/depth jump). SJ basso → forza esplosiva (squat/jump squat). Serve al fondista per l'economia, non per saltare più in alto.", "Bosco"],
  ["RSI — drop jump (reattività)", "Forza REATTIVA e stiffness della caviglia/tendine: chiave dell'economia di corsa.", "Drop jump da varie altezze; RSI = altezza salto (m) / tempo di contatto (s).", "<1.5 scarso · 1.5-2.0 medio · 2.0-2.5 buono · >2.5 ottimo. L'altezza di caduta col RSI più alto è la tua ottimale per i drop jump.", "RSI basso → pliometria REATTIVA (contatti brevi) + forza: migliora la stiffness → corri più «economico» a parità di VO2max.", "Flanagan"],
  ["Forza 1RM / VBT", "Forza massima RELATIVA (economia, prevenzione, finale di gara).", "1RM diretto o stima dalla retta carico-velocità (foglio Stima 1RM).", "Squat / peso corporeo: <1.5× debole · 1.5-2× discreto · >2× buono per un fondista.", "Squat/peso basso → Forza max (85-100%, poche rip). Se già ok → mantenimento + potenza/pliometria (non aggiungere massa).", "NSCA; Blagrove"],
  ["Asimmetrie DX/SX", "Prevenzione infortuni: squilibri tra lato destro e sinistro.", "Caviglia knee-to-wall, hamstring SLR, salto monopodalico: misura dx e sx.", "Differenza %: >15% bandiera ROSSA, 10-15% attenzione (Limb Symmetry Index). Nel foglio Infortuni il semaforo lo calcola da solo.", "Asimmetria >15% → lavoro UNILATERALE sul lato debole + mobilità; riduci il carico finché non rientra.", "Limb Symmetry Index"]
];
const MZ_TEST_PER_DISC = [
  ["800 / 1500", "Critical Speed (CS + D'); Speed reserve (lanciato 30-40 m vs ritmo 1500); prove 600 e 1000 m a tutta; lattato dopo un all-out (picco); lattato a step per la base.", "D' (riserva anaerobica) = la marcia in più; il TIPO (veloce/resistente); picco di lattato (potenza lattacida); CS come base aerobica."],
  ["3000 / 5000", "Lattato a step (centrale, parti lento); VO2max/vVO2max (da 3000 o Cooper); prove 2000/3000 m; salti (CMJ/RSI).", "Soglia LT2 = il ritmo-chiave; vVO2max (ritmo intervalli); economia (salti/forza)."],
  ["10000", "Lattato a step (LT2); prove 5000/10000; lunghi a ritmo; Critical Speed (opz.).", "Soglia LT2; tenuta sul volume; ritmo gara sostenibile."],
  ["Mezza maratona", "Lattato (LT2 ~ ritmo mezza); lunghi con tratti a ritmo mezza/maratona; prove 5-10 km.", "Soglia LT2 e ritmo mezza; resistenza alla soglia; economia."],
  ["Maratona", "Lattato (LT1 e LT2); lunghi 30-35 km con ritmo maratona; prova rifornimento/idratazione.", "LT1 (il ritmo maratona sta vicino/sotto LT1?); uso dei grassi; economia; tenuta finale."]
];
function vistaGuidaTest() {
  const lbl = (l, v) => `<div style="padding:3px 0"><b>${l}:</b> ${v}</div>`;
  const cards = MZ_GUIDA_TEST.map(t => `<div class="card">
    <h3>${t[0]}</h3>
    <p class="et" style="margin:4px 0 8px">${t[1]}</p>
    <div style="font-size:13px">
      ${lbl("Come si fa", t[2])}
      ${lbl("Come si legge", t[3])}
      ${t[5] !== "-" ? lbl("Fonte", t[5]) : ""}
    </div>
    <p style="margin:8px 0 0;padding:8px 10px;background:rgba(63,181,107,.12);border-radius:8px;font-size:13px"><b>Se esce… → allena:</b> ${t[4]}</p>
  </div>`).join("");
  const perDisc = `<div class="card"><p class="et" style="margin-bottom:6px">Test per disciplina — quali fare e cosa guardare</p>
    ${MZ_TEST_PER_DISC.map(([d, test, guarda]) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)">
      <p style="font-weight:600;font-size:13px;margin:0 0 3px">${d}</p>
      <p class="et" style="margin:0 0 4px"><b>Test prioritari:</b> ${test}</p>
      <p class="et" style="margin:0"><b>Cosa guardare:</b> ${guarda}</p></div>`).join("")}</div>`;
  return `<div class="card"><h3>Guida ai test (mezzofondo/fondo)</h3>
    <p class="et" style="margin-top:2px">Ogni test dice qualcosa di preciso e indica <b>cosa allenare</b> in risposta. Rifai i test ogni ~8 settimane e confronta. I valori li trovi in Test lattato, Velocità critica e Test.</p></div>
    ${cards}${perDisc}
    <div class="card"><p class="et" style="margin:0">I test dicono <b>dove</b> sei debole; il riquadro verde «Se esce → allena» dice cosa mettere di più nel programma. Ripeti ogni ~8 settimane per vedere se la soluzione ha funzionato.</p></div>`;
}

// ============================================================================
// CRUSCOTTO ATLETA mezzofondo — helper per la home dell'atleta e il dettaglio coach.
// ============================================================================
// i ritmi-chiave dell'atleta (per i quadranti "le mie zone")
function ritmiHomeMezzo(a) {
  if (typeof ritmiTarget !== "function") return {};
  const R = ritmiTarget(a, {});
  const g = m => { const r = R.find(x => x.mezzo === m); return r ? r.mmss : "—"; };
  return { facile: g("Lungo"), soglia: g("Soglia LT2 (tempo)"), vo2: g("VO2max"), gara5: g("Ritmo gara 5000"), gara10: g("Ritmo gara 10000") };
}
// km PROGRAMMATI nella settimana corrente (Lun-Dom) per l'atleta, dalle sedute pista mezzo
function kmSettAtleta(a) {
  if (typeof seduteDelGiorno !== "function" || typeof isoDiData !== "function") return null;
  const oggi = new Date((typeof oggiISO === "function" ? oggiISO() : new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const dow = (oggi.getDay() + 6) % 7;                    // 0 = lunedì
  const lun = new Date(oggi); lun.setDate(oggi.getDate() - dow);
  let m = 0, trovato = false;
  for (let i = 0; i < 7; i++) {
    const d = new Date(lun); d.setDate(lun.getDate() + i);
    const sed = seduteDelGiorno(isoDiData(d), false, a) || [];
    sed.forEach(s => { if (s.mezzo) { trovato = true; m += (typeof volumePistaMezzo === "function" ? volumePistaMezzo(s) : 0); } });
  }
  return trovato ? Math.round(m / 100) / 10 : null;        // km
}
// card "Profilo mezzofondo" (per il dettaglio-atleta del coach): soglia · CS · D' · tipo
function cardProfiloMezzo(a) {
  const R = ritmiHomeMezzo(a);
  const RL = (typeof analisiLattato === "function") ? analisiLattato((DEMO.lattato && DEMO.lattato[a.id]) || {}, a) : {};
  const RC = (typeof analisiCriticalSpeed === "function") ? analisiCriticalSpeed((DEMO.critSpeed && DEMO.critSpeed[a.id]) || {}, a) : {};
  const tipo = (RC && RC.srr != null) ? (RC.srr >= 1.47 ? "veloce" : RC.srr >= 1.36 ? "bilanciato" : "resistente") : "—";
  const riga = (l, v) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span class="et" style="margin:0">${l}</span><b>${v}</b></div>`;
  return `<div class="card"><p class="et" style="margin-bottom:6px">🏃 Profilo mezzofondo</p>
    ${riga("Soglia (ritmi)", R.soglia + "/km")}
    ${riga("VO2max · Ritmo gara 5k", R.vo2 + " · " + R.gara5 + "/km")}
    ${(RC && RC.ritmoCS) ? riga("Velocità critica (campo)", RC.ritmoCS + "/km · D′ " + Math.round(RC.dprime) + " m") : ""}
    ${(RC && RC.srr != null) ? riga("Tipo di atleta", tipo + " (SRR " + RC.srr.toFixed(2) + ")") : ""}
  </div>`;
}


