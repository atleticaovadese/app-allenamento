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
// PB in secondi dell'atleta per una distanza (il migliore)
function _mzPbSec(atleta, dist) {
  if (!atleta || !atleta.scheda) return null;
  const vals = (atleta.scheda.pb || []).filter(r => r[0] === dist && r[1] != null && r[1] !== "")
    .map(r => _mzToSec(r[1])).filter(v => v != null && v > 0);
  return vals.length ? Math.min(...vals) : null;
}

// motore ritmi: restituisce [{mezzo, secKm, mmss, rif, zona}] per l'atleta (o coi PB manuali in opts.pb)
function ritmiTarget(atleta, opts) {
  opts = opts || {};
  const ob = Number(opts.obiettivo) || 0;
  const off = Object.assign({}, MZ_OFFSET_DEF, opts.offsets || {});
  const pbSec = d => (opts.pb && opts.pb[d] != null && opts.pb[d] !== "") ? _mzToSec(opts.pb[d]) : _mzPbSec(atleta, d);
  const km = d => { const s = pbSec(d); return s == null ? null : s / MZ_KM[d]; };
  const P = d => { const k = km(d); return k == null ? null : k - ob; };          // /km sec, con obiettivo
  const p800 = P("800 m"), p1500 = P("1500 m"), p3000 = P("3000 m"), p5000 = P("5000 m"), p10000 = P("10000 m");
  const or = (...xs) => { for (const x of xs) { if (x != null && !isNaN(x)) return x; } return null; };
  const add = (b, d) => b == null ? null : b + d;
  const lt2 = (opts.useLT2 && opts.vLT2) ? 3600 / opts.vLT2 : null;              // vLT2 km/h → sec/km
  const M = [
    ["Rigenerazione", or(add(p5000, off.lungo + 20)), "5000 +120", "Z1 <1.5"],
    ["Lungo", or(add(p5000, off.lungo)), "5000 +100", "Z1-2 1-2"],
    ["Medio / maratona", or(add(p10000, off.medio), add(p5000, 55)), "10000 +48", "Z2 2-2.5"],
    ["Soglia LT2 (tempo)", or(lt2, add(p10000, off.soglia), add(p5000, 33)), "10000 +30 / test", "Z3 2.5-4"],
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

// ---------- vista: Ritmi target (Analisi) ----------
let mzState = { atletaRif: "", pb: {}, obiettivo: 0, offsets: {}, avanzato: false };
function setMzAtleta(id) { mzState.atletaRif = id; mzState.pb = {}; disegna(); }
function setMzPbVal(d, v) { mzState.pb[d] = v; }
function setMzObiVal(v) { mzState.obiettivo = v; }
function setMzOffVal(k, v) { mzState.offsets[k] = v === "" ? undefined : Number(v); }
function toggleMzAvanzato() { mzState.avanzato = !mzState.avanzato; disegna(); }

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

  return `
  <div class="card"><h3>Ritmi target — mezzofondo/fondo</h3>
    <p class="et" style="margin-top:2px">Dai PB (800/1500/3000/5000/10000) ai <b>ritmi di allenamento</b> per ogni mezzo. In Pista scegli il mezzo e il ritmo/km arriva da qui.</p></div>

  <div class="card">
    <label class="lab">Atleta (prende i PB)</label>
    <select onchange="setMzAtleta(this.value)" style="margin-top:6px">
      <option value="">— a mano —</option>${DEMO.atleti.map(x => `<option value="${x.id}" ${mzState.atletaRif === x.id ? "selected" : ""}>${x.nome}</option>`).join("")}</select>
    <p class="et" style="margin:10px 0 4px">PB per distanza (mm:ss). Vuoto = usa quello dell'atleta se c'è.</p>
    <div class="griglia2">${pbInputs}</div>
    <div style="margin-top:12px"><label class="lab">Obiettivo: ritmi più veloci di (sec/km)</label>
      <input inputmode="numeric" value="${mzState.obiettivo || 0}" oninput="setMzObiVal(this.value)" onchange="disegna()" placeholder="0" style="margin-top:6px">
      <p class="et" style="margin-top:6px">0 = ritmi sul livello attuale (PB). Es. 3 = programma 3″/km più veloce (progressione).</p></div>
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

  const testa = `
    <div class="card"><h3>Programma Pista — mezzofondo / fondo</h3>
      <p class="et" style="margin-top:2px">Scegli il <b>mezzo</b> e metti <b>distanza + n°</b> (ripetute) <b>oppure i minuti</b> (corsa continua). Ritmo/km, tempo per ripetuta e volume escono da soli dal PB (motore <b>Ritmi target</b>).</p>
      <p class="et" style="margin-top:8px;color:var(--verde)">✓ Si salva da solo. Ogni atleta vedrà i ritmi calcolati sul <b>suo</b> PB.</p></div>
    <div class="card">
      <label class="lab">Riferimento ritmi (solo anteprima)</label>
      <select onchange="setPistaTop('atletaRif',this.value)" style="margin-top:6px">
        <option value="">🎯 Programma madre (PB a mano)</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${p.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
      <p class="et" style="margin:10px 0 4px">PB per distanza (mm:ss). Vuoto = usa quello dell'atleta di riferimento, se scelto.</p>
      <div class="griglia2">${pbInputs}</div>
      <div style="margin-top:12px"><label class="lab">Obiettivo: ritmi più veloci di (sec/km)</label>
        <input inputmode="numeric" value="${p.mzObiettivo || 0}" oninput="setMzPistaObiVal(this.value)" onchange="disegna()" placeholder="0" style="margin-top:6px"></div>
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
