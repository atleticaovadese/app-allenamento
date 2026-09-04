// Analisi / calcolatori (fedeli alle formule dell'Excel).
// 1) VELOCITÀ TARGET (%) — dai PB, i tempi target a ogni % di velocità per distanza.

const PERC_VT = [100, 95, 90, 85, 80, 75, 70];
const EVENTI_VT = [
  { nome: "100 m Maschile", base: "100 m", coeffs: { 20: 0.295, 30: 0.3987, 40: 0.4868, 50: 0.5727, 60: 0.6565, 70: 0.7405, 80: 0.8255, 90: 0.9117, 100: 1.0, 120: 1.1689, 150: 1.4252 } },
  { nome: "100 m Femminile", base: "100 m", coeffs: { 20: 0.2816, 30: 0.3805, 40: 0.4688, 50: 0.5563, 60: 0.6419, 70: 0.7293, 80: 0.8186, 90: 0.9088, 100: 1.0, 120: 1.224, 150: 1.56, 180: 1.896, 200: 2.12, 220: 2.2838, 250: 2.592, 300: 3.1057 } },
  { nome: "100 m Femm. Master", base: "100 m", coeffs: { 20: 0.2654, 30: 0.3587, 40: 0.4478, 50: 0.5365, 60: 0.6253, 70: 0.7156, 80: 0.8067, 90: 0.8997, 100: 1.0, 120: 1.1747, 150: 1.4479 } },
  { nome: "200 m Maschile", base: "200 m", coeffs: { 20: 0.149, 30: 0.2013, 40: 0.2471, 50: 0.2913, 60: 0.3364, 70: 0.381, 80: 0.4262, 90: 0.4719, 100: 0.5176, 120: 0.6111, 150: 0.7513, 180: 0.9005, 200: 1.0 } },
  { nome: "200 m Femminile", base: "200 m", coeffs: { 20: 0.1448, 30: 0.1957, 40: 0.2402, 50: 0.2832, 60: 0.3286, 70: 0.3734, 80: 0.4188, 90: 0.4648, 100: 0.5107, 120: 0.6053, 150: 0.7471, 180: 0.8988, 200: 1.0 } },
  { nome: "400 m", base: "400 m", coeffs: { 50: 0.1403, 100: 0.2508, 150: 0.3642, 200: 0.4816, 250: 0.6021, 300: 0.7261, 350: 0.8574, 400: 1.0 } }
];
// basi extra 60/80/120/150 m: ri-normalizzo la curva 100 m Maschile su quella distanza,
// così il coach può calcolare i tempi partendo dal PB dell'atleta su 60/80/120/150 m.
(function () {
  const c100 = EVENTI_VT[0].coeffs;
  [60, 80, 120, 150].forEach(base => {
    const k = c100[base]; if (k == null) return;
    const coeffs = {};
    Object.keys(c100).forEach(d => { coeffs[d] = Math.round(c100[d] / k * 10000) / 10000; });
    EVENTI_VT.push({ nome: base + " m", base: base + " m", coeffs });
  });
})();

let velState = { evento: 0, atletaRif: "", pb: "" };

function pbAtletaBase(atletaId, base) {
  const a = DEMO.atleti.find(x => x.id === atletaId);
  if (!a || !a.scheda) return null;
  const row = (a.scheda.pb || []).find(p => p[0] === base);
  return row && row[1] != null ? Number(row[1]) : null;
}
function setVelAtleta(id) {
  velState.atletaRif = id;
  const p = id ? pbAtletaBase(id, EVENTI_VT[velState.evento].base) : null;
  if (p != null) velState.pb = String(p);
  disegna();
}
function setVelEvento(i) {
  velState.evento = Number(i);
  const p = velState.atletaRif ? pbAtletaBase(velState.atletaRif, EVENTI_VT[velState.evento].base) : null;
  if (p != null) velState.pb = String(p);
  disegna();
}
function setVelPbVal(v) { velState.pb = v; }

function vistaVelocitaTarget() {
  const ev = EVENTI_VT[velState.evento];
  const pb = parseFloat(String(velState.pb).replace(",", "."));
  const hasPb = !isNaN(pb) && pb > 0;
  const dists = Object.keys(ev.coeffs).map(Number).sort((a, b) => a - b);

  const righe = dists.map(d => {
    const c = ev.coeffs[d];
    const t100 = hasPb ? c * pb : null;          // tempo target a 100% (s)
    const v100 = t100 ? d / t100 : null;         // velocità a 100% (m/s)
    const celle = PERC_VT.map(p => t100 != null ? (t100 / (p / 100)).toFixed(2) : "—");
    return `<tr><td>${d} m</td><td class="pauto">${v100 != null ? v100.toFixed(2) : "—"}</td>${celle.map(x => `<td>${x}</td>`).join("")}</tr>`;
  }).join("");

  return `
  <div class="card"><h3>Velocità target (%)</h3>
    <p class="et" style="margin-top:2px">Dai PB, i tempi da cercare in allenamento a ogni percentuale di velocità (100% = PB, 90% = allenante, ecc.) per ogni distanza.</p></div>

  <div class="card">
    <label class="lab">Tabella (gara / sesso)</label>
    <select onchange="setVelEvento(this.value)" style="margin-top:6px">
      ${EVENTI_VT.map((e, i) => `<option value="${i}" ${velState.evento === i ? "selected" : ""}>${e.nome}</option>`).join("")}
    </select>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Atleta (prende il PB)</label>
        <select onchange="setVelAtleta(this.value)" style="margin-top:6px">
          <option value="">— a mano —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${velState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select></div>
      <div><label class="lab">PB ${ev.base} (s)</label>
        <input inputmode="decimal" value="${velState.pb || ""}" placeholder="es. 10.90"
          oninput="setVelPbVal(this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    ${!hasPb ? `<p class="et" style="margin-top:10px">Scegli un atleta o scrivi il PB ${ev.base} per calcolare i tempi.</p>` : ""}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Tempo target (s) per distanza · velocità 100% → 70%</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Dist.</th><th>v@100%<br>(m/s)</th>${PERC_VT.map(p => `<th>${p}%</th>`).join("")}</tr></thead>
      <tbody>${righe}</tbody>
    </table></div>
    <p class="et" style="margin-top:8px">v a una % = velocità a 100% × %. m/s a 100% = distanza ÷ tempo a 100%.</p>
  </div>`;
}

// 2) STIMA 1RM da VBT (load-velocity) — stima il massimale senza farlo.
const LIFTS_1RM = [["Squat", 0.30], ["1/2 Squat", 0.32], ["Panca piana", 0.15], ["Stacco", 0.20], ["Bulgarian", 0.45], ["Girata/Strappo", 0.80]];
let rmState = { lift: 0, mvt: 0.30, atletaRif: "", righe: [{ c: "", v: "" }, { c: "", v: "" }, { c: "", v: "" }, { c: "", v: "" }, { c: "", v: "" }] };

function regressione(punti) {
  const n = punti.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  punti.forEach(p => { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; syy += p.y * p.y; });
  const den = n * sxx - sx * sx;
  if (den === 0) return null;
  const slope = (n * sxy - sx * sy) / den;
  const intercept = (sy - slope * sx) / n;
  const rden = den * (n * syy - sy * sy);
  const r2 = rden > 0 ? Math.pow(n * sxy - sx * sy, 2) / rden : null;
  return { slope, intercept, r2 };
}
function setRmLift(i) { rmState.lift = Number(i); rmState.mvt = LIFTS_1RM[rmState.lift][1]; disegna(); }
function setRmMvtVal(v) { rmState.mvt = v; }
function setRmRigaVal(i, campo, v) { rmState.righe[i][campo] = v; }
function setRmAtleta(id) { rmState.atletaRif = id; disegna(); }

// salva la stima come "massimale stimato" nella scheda dell'atleta (cronologia + andamento)
async function salvaStima1RM() {
  const mvt = parseFloat(String(rmState.mvt).replace(",", "."));
  const punti = rmState.righe.map(r => ({ x: parseFloat(String(r.c).replace(",", ".")), y: parseFloat(String(r.v).replace(",", ".")) }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y) && p.x > 0);
  const reg = regressione(punti);
  if (!reg || reg.slope === 0 || isNaN(mvt)) { alert("Serve una stima valida (almeno 2 prove)."); return; }
  const oneRM = (mvt - reg.intercept) / reg.slope;
  if (!(oneRM > 0 && isFinite(oneRM))) { alert("Stima non valida."); return; }
  const a = DEMO.atleti.find(x => x.id === rmState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const eserc = LIFTS_1RM[rmState.lift][0];
  const oggi = new Date().toISOString().slice(0, 10);
  const note = "stima VBT" + (reg.r2 != null ? " · R² " + reg.r2.toFixed(2) : "");
  const btn = document.getElementById("btnSalva1rm"); if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }
  const ok = typeof creaMassimale === "function" ? await creaMassimale(a.id, { esercizio: eserc, kg: Math.round(oneRM), data: oggi, note }) : false;
  if (ok) { alert("Salvato: " + eserc + " " + Math.round(oneRM) + " kg nella scheda di " + a.nome + "."); disegna(); }
  else if (btn) { btn.textContent = "Salva"; btn.disabled = false; }
}

function vistaStima1RM() {
  const mvt = parseFloat(String(rmState.mvt).replace(",", "."));
  const punti = rmState.righe.map(r => ({ x: parseFloat(String(r.c).replace(",", ".")), y: parseFloat(String(r.v).replace(",", ".")) }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y) && p.x > 0);
  const reg = regressione(punti);
  let oneRM = null, r2 = null;
  if (reg && reg.slope !== 0 && !isNaN(mvt)) { oneRM = (mvt - reg.intercept) / reg.slope; r2 = reg.r2; }
  const ok = oneRM != null && oneRM > 0 && isFinite(oneRM);

  const righeInput = rmState.righe.map((r, i) => `<tr>
      <td><input inputmode="numeric" value="${r.c}" placeholder="kg" oninput="setRmRigaVal(${i},'c',this.value)" onchange="disegna()" style="min-width:70px"></td>
      <td><input inputmode="decimal" value="${r.v}" placeholder="m/s" oninput="setRmRigaVal(${i},'v',this.value)" onchange="disegna()" style="min-width:70px"></td>
    </tr>`).join("");

  const perc = [100, 90, 80, 70, 60];
  const righePerc = ok ? perc.map(p => {
    const velAttesa = reg.slope * (p / 100 * oneRM) + reg.intercept;
    return `<tr><td>${p}%</td><td class="pauto">${Math.round(p / 100 * oneRM)}</td><td class="pauto">${velAttesa.toFixed(2)}</td></tr>`;
  }).join("") : "";

  const colR2 = r2 == null ? "var(--txt3)" : r2 >= 0.95 ? "var(--verde)" : r2 >= 0.9 ? "var(--giallo)" : "var(--rosso)";
  const eserc = LIFTS_1RM[rmState.lift][0];
  const atl = DEMO.atleti.find(x => x.id === rmState.atletaRif);
  const storia = atl && atl.scheda ? (atl.scheda.massimali || []).filter(m => m[0] === eserc) : [];

  return `
  <div class="card"><h3>Stima 1RM (da velocità)</h3>
    <p class="et" style="margin-top:2px">Inserisci 3-5 serie a carichi crescenti con massima intenzione e la loro velocità media. La retta carico-velocità stima l'1RM alla MVT, senza fare il massimale.</p></div>
  ${typeof bloccoComeSiFa === "function" ? bloccoComeSiFa("stima1rm") : ""}

  <div class="card">
    <label class="lab">Atleta <span style="color:var(--txt3)">(per salvare la stima e la cronologia)</span></label>
    <select onchange="setRmAtleta(this.value)" style="margin-top:6px">
      <option value="">— nessuno (solo calcolo) —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${rmState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Esercizio</label>
        <select onchange="setRmLift(this.value)" style="margin-top:6px">
          ${LIFTS_1RM.map((l, i) => `<option value="${i}" ${rmState.lift === i ? "selected" : ""}>${l[0]}</option>`).join("")}</select></div>
      <div><label class="lab">MVT (m/s) <span style="color:var(--txt3)">vel. all'1RM</span></label>
        <input inputmode="decimal" value="${rmState.mvt}" oninput="setRmMvtVal(this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Prove (carico crescente + velocità media)</p>
    <table class="ptab" style="min-width:0">
      <thead><tr><th>Carico (kg)</th><th>Vel. media (m/s)</th></tr></thead>
      <tbody>${righeInput}</tbody>
    </table>
  </div>

  <div class="card" ${ok ? 'style="border-color:rgba(124,194,67,.4)"' : ""}>
    <div class="quadri">
      <div class="q wide"><div class="k">1RM stimato</div>
        <div class="v" style="color:var(--verde)">${ok ? Math.round(oneRM) + " kg" : "—"}</div></div>
      <div class="q"><div class="k">R² (affidabilità)</div>
        <div class="v" style="color:${colR2}">${r2 != null ? r2.toFixed(2) : "—"}</div></div>
    </div>
    ${ok
      ? `<p class="et" style="margin-top:10px;margin-bottom:6px">Velocità attesa per %1RM</p>
         <table class="ptab" style="min-width:0"><thead><tr><th>%1RM</th><th>Carico (kg)</th><th>Vel. attesa (m/s)</th></tr></thead><tbody>${righePerc}</tbody></table>
         ${atl
          ? `<button class="btn" id="btnSalva1rm" style="margin-top:14px" onclick="salvaStima1RM()">💾 Salva come massimale stimato di ${atl.nome}</button>`
          : `<p class="et" style="margin-top:10px">Scegli un atleta in alto per salvare questa stima nella sua scheda (cronologia).</p>`}`
      : `<p class="et" style="margin-top:8px">Servono almeno 2 prove (meglio 3-5) con carichi diversi. R² vicino a 1 = stima affidabile.</p>`}
  </div>

  ${atl ? `<div class="card">
    <p class="et" style="margin-bottom:6px">Cronologia ${eserc} · ${atl.nome}</p>
    ${storia.length
      ? `<table class="ptab" style="min-width:0"><thead><tr><th>Data</th><th>1RM (kg)</th><th>Note</th></tr></thead>
         <tbody>${storia.map(m => `<tr><td>${m[2] || "—"}</td><td class="pauto">${m[1]}</td><td class="et" style="white-space:normal">${m[3] || ""}</td></tr>`).join("")}</tbody></table>`
      : `<p class="et">Ancora nessun massimale/stima per ${eserc}. Salva la prima!</p>`}
  </div>` : ""}`;
}

// 3) TRAINO / SLED (Morin-Samozino) — carichi per zona dal calo di velocità.
const ZONE_TRAINO = [
  [0.10, "Competenza tecnica", "Sovraccarico minimo: meccanica di sprint quasi piena"],
  [0.20, "Speed-strength", "Forza-velocità: fase di accelerazione"],
  [0.30, "Speed-strength", "Transizione verso la potenza"],
  [0.40, "Potenza", "Vicino alla potenza orizzontale massima"],
  [0.50, "Potenza (max ~)", "Massima potenza orizzontale (~ metà di V0)"],
  [0.60, "Strength-speed", "Forza orizzontale, carichi alti"],
  [0.75, "Strength / Forza", "Carichi molto pesanti: forza orizzontale pura"]
];
let trainoState = { atletaRif: "", bm: "", dist: "", righe: [{ c: "", t: "" }, { c: "", t: "" }, { c: "", t: "" }, { c: "", t: "" }, { c: "", t: "" }] };

function setTrainoAtleta(id) {
  trainoState.atletaRif = id;
  const a = DEMO.atleti.find(x => x.id === id);
  if (a && a.scheda && a.scheda.anagrafica && a.scheda.anagrafica.peso) trainoState.bm = String(a.scheda.anagrafica.peso);
  disegna();
}
function setTrainoVal(campo, val) { trainoState[campo] = val; }
function setTrainoRigaVal(i, campo, val) { trainoState.righe[i][campo] = val; }

function vistaTraino() {
  const bm = parseFloat(String(trainoState.bm).replace(",", "."));
  const dist = parseFloat(String(trainoState.dist).replace(",", "."));
  const hasDist = !isNaN(dist) && dist > 0;
  const punti = trainoState.righe.map(r => {
    const c = parseFloat(String(r.c).replace(",", "."));
    const t = parseFloat(String(r.t).replace(",", "."));
    const v = (hasDist && !isNaN(t) && t > 0) ? dist / t : null;
    return { c, t, v };
  });
  const regPunti = punti.filter(p => !isNaN(p.c) && p.v != null).map(p => ({ x: p.c, y: p.v }));
  const reg = regPunti.length >= 2 ? regressione(regPunti) : null;
  const V0 = reg ? reg.intercept : null, slope = reg ? reg.slope : null, r2 = reg ? reg.r2 : null;
  const okZone = reg && slope < 0 && V0 > 0 && hasDist;
  const colR2 = r2 == null ? "var(--txt3)" : r2 >= 0.95 ? "var(--verde)" : r2 >= 0.9 ? "var(--giallo)" : "var(--rosso)";

  const righeInput = punti.map((p, i) => `<tr>
      <td><input inputmode="numeric" value="${trainoState.righe[i].c}" placeholder="kg" oninput="setTrainoRigaVal(${i},'c',this.value)" onchange="disegna()" style="min-width:64px"></td>
      <td><input inputmode="decimal" value="${trainoState.righe[i].t}" placeholder="s" oninput="setTrainoRigaVal(${i},'t',this.value)" onchange="disegna()" style="min-width:64px"></td>
      <td class="pauto">${p.v != null ? p.v.toFixed(2) : "—"}</td>
    </tr>`).join("");

  const righeZone = okZone ? ZONE_TRAINO.map(([loss, zona, scopo]) => {
    const vT = V0 * (1 - loss), tT = dist / vT, carico = -V0 * loss / slope;
    const pctBM = (!isNaN(bm) && bm > 0) ? carico / bm * 100 : null;
    return `<tr><td>${Math.round(loss * 100)}%</td><td class="pauto">${vT.toFixed(2)}</td><td class="pauto">${tT.toFixed(2)}</td><td class="pauto">${Math.round(carico)}</td><td class="pauto">${pctBM != null ? Math.round(pctBM) + "%" : "—"}</td><td>${zona}</td><td class="et" style="white-space:normal">${scopo}</td></tr>`;
  }).join("") : "";

  return `
  <div class="card"><h3>Traino / Sled</h3>
    <p class="et" style="margin-top:2px">Metodo Morin-Samozino. Cronometra alcuni sprint sulla stessa distanza: uno senza traino (0 kg) e 1-2 con traino, a massima spinta. Da distanza e tempi il foglio stima V0 e la pendenza e calcola il carico per ogni zona.</p></div>
  ${typeof bloccoComeSiFa === "function" ? bloccoComeSiFa("traino") : ""}

  <div class="card">
    <div class="griglia2">
      <div><label class="lab">Atleta (prende il peso)</label>
        <select onchange="setTrainoAtleta(this.value)" style="margin-top:6px">
          <option value="">— a mano —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${trainoState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select></div>
      <div><label class="lab">Massa corporea (kg)</label>
        <input inputmode="decimal" value="${trainoState.bm || ""}" placeholder="es. 74" oninput="setTrainoVal('bm',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    <label class="lab" style="display:block;margin-top:12px">Distanza della prova (m) <span style="color:var(--txt3)">stessa per tutte, es. 20-30 m</span></label>
    <input inputmode="numeric" value="${trainoState.dist || ""}" placeholder="es. 20" oninput="setTrainoVal('dist',this.value)" onchange="disegna()" style="margin-top:6px">
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Prove (includi 0 kg) — la velocità si calcola da distanza ÷ tempo</p>
    <table class="ptab" style="min-width:0">
      <thead><tr><th>Carico (kg)</th><th>Tempo (s)</th><th>Vmax (m/s)</th></tr></thead>
      <tbody>${righeInput}</tbody>
    </table>
  </div>

  <div class="card" ${okZone ? 'style="border-color:rgba(124,194,67,.4)"' : ""}>
    <div class="quadri">
      <div class="q"><div class="k">V0 (m/s)</div><div class="v" style="color:var(--verde)">${V0 != null && okZone ? V0.toFixed(2) : "—"}</div></div>
      <div class="q"><div class="k">Pendenza</div><div class="v" style="font-size:18px">${slope != null && okZone ? slope.toFixed(3) : "—"}</div></div>
      <div class="q"><div class="k">R²</div><div class="v" style="color:${colR2}">${r2 != null ? r2.toFixed(2) : "—"}</div></div>
    </div>
    ${okZone
      ? `<p class="et" style="margin-top:10px;margin-bottom:6px">Carichi per zona (dal calo di Vmax)</p>
         <div class="p-scroll"><table class="ptab pista-w"><thead><tr><th>Calo</th><th>Vmax<br>target</th><th>Tempo<br>target</th><th>Carico<br>(kg)</th><th>%BM</th><th>Zona</th><th>Scopo</th></tr></thead><tbody>${righeZone}</tbody></table></div>
         <p class="et" style="margin-top:8px">La potenza orizzontale max è tipicamente intorno al 50% di calo di Vmax. R² vicino a 1 = stima affidabile.</p>
         ${trainoState.atletaRif ? `<button class="btn btn-2" style="margin-top:12px" onclick="salvaTraino()">💾 Salva il test (V0) nella scheda</button>` : `<p class="et" style="margin-top:8px">Scegli un atleta in alto per salvare il test.</p>`}`
      : `<p class="et" style="margin-top:8px">Servono almeno il tempo senza traino (0 kg) + 1-2 carichi, la distanza e (per il %BM) il peso.</p>`}
  </div>`;
}

// 4) PROFILO FORZA-VELOCITÀ (salti) — Morin-Samozino.
let fvState = { atletaRif: "", massa: "", hFine: "", hPart: "", righe: [{ cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }] };

function setFvAtleta(id) {
  fvState.atletaRif = id;
  const a = DEMO.atleti.find(x => x.id === id);
  if (a && a.scheda && a.scheda.anagrafica && a.scheda.anagrafica.peso) fvState.massa = String(a.scheda.anagrafica.peso);
  // altezze anca (grande trocantere): dati fissi dell'atleta, ripescati da quelli salvati
  const ant = (DEMO.atletaAntropo && DEMO.atletaAntropo[id]) || {};
  fvState.hFine = ant.hFine != null ? String(ant.hFine) : "";
  fvState.hPart = ant.hPart != null ? String(ant.hPart) : "";
  disegna();
}
function setFvVal(campo, val) {
  fvState[campo] = val;
  // le altezze anca (trocantere) sono dati fissi: si salvano subito sull'atleta e si ripropongono ai test futuri
  if ((campo === "hFine" || campo === "hPart") && fvState.atletaRif) {
    DEMO.atletaAntropo = DEMO.atletaAntropo || {};
    const ant = DEMO.atletaAntropo[fvState.atletaRif] = DEMO.atletaAntropo[fvState.atletaRif] || {};
    const n = parseFloat(String(val).replace(",", "."));
    ant[campo] = isNaN(n) ? null : n;
    if (typeof salvaCustom === "function") salvaCustom();
  }
}
function setFvRigaVal(i, campo, val) { fvState.righe[i][campo] = val; }

// pendenza ottimale F-V (Samozino 2012), da hPO (m) e Pmax/kg (W/kg)
function soptFV(hPO, Pkg) {
  const g = 9.81;
  const big = -(Math.pow(g, 6)) * Math.pow(hPO, 6) - 18 * Math.pow(g, 3) * Math.pow(hPO, 5) * Math.pow(Pkg, 2)
    - 54 * Math.pow(hPO, 4) * Math.pow(Pkg, 4)
    + 6 * Math.sqrt(3) * Math.sqrt(2 * Math.pow(g, 3) * Math.pow(hPO, 9) * Math.pow(Pkg, 6) + 27 * Math.pow(hPO, 8) * Math.pow(Pkg, 8));
  const ss = Math.sign(big) * Math.pow(Math.abs(big), 1 / 3);
  return -(g * g) / (3 * Pkg)
    - ((-(Math.pow(g, 4)) * Math.pow(hPO, 4) - 12 * g * Math.pow(hPO, 3) * Math.pow(Pkg, 2)) / (3 * hPO * hPO * Pkg * ss))
    + ss / (3 * hPO * hPO * Pkg);
}

function vistaProfiloFV() {
  const massa = parseFloat(String(fvState.massa).replace(",", "."));
  const hFine = parseFloat(String(fvState.hFine).replace(",", "."));
  const hPart = parseFloat(String(fvState.hPart).replace(",", "."));
  const hPO = (!isNaN(hFine) && !isNaN(hPart)) ? (hFine - hPart) / 100 : null;
  const okBase = !isNaN(massa) && massa > 0 && hPO != null && hPO > 0;

  const punti = fvState.righe.map(r => {
    const c = parseFloat(String(r.c).replace(",", ".")) || 0;
    const h = parseFloat(String(r.h).replace(",", "."));
    if (!okBase || isNaN(h) || h <= 0) return { E: null, F: null, V: null, Fkg: null, P: null };
    const E = massa + c;
    const F = E * 9.81 * (1 + (h / 100) / hPO);
    const V = Math.sqrt(9.81 * (h / 100) / 2);
    return { E, F, V, Fkg: F / E, P: F * V };
  });
  const regP = punti.filter(p => p.F != null).map(p => ({ x: p.V, y: p.F }));
  const reg = regP.length >= 2 ? regressione(regP) : null;

  let F0 = null, V0 = null, Pmax = null, Pkg = null, Sfv = null, r2 = null, Sopt = null, Sfvkg = null, FVimb = null, dir = null;
  if (reg && reg.slope < 0) {
    F0 = reg.intercept; Sfv = reg.slope; V0 = -F0 / Sfv; Pmax = F0 * V0 / 4; Pkg = Pmax / massa; r2 = reg.r2;
    if (Pkg > 0) {
      Sopt = soptFV(hPO, Pkg);
      Sfvkg = Sfv / massa;
      if (Sopt) { FVimb = Math.abs(Sfvkg / Sopt - 1) * 100; dir = (Sfvkg / Sopt < 1) ? "Carenza di forza" : "Carenza di velocità"; }
    }
  }
  const ok = F0 != null && V0 > 0;

  const righeInput = punti.map((p, i) => `<tr>
      <td><input value="${(fvState.righe[i].cond || "").replace(/"/g, "&quot;")}" placeholder="es. libero" oninput="setFvRigaVal(${i},'cond',this.value)" style="min-width:90px"></td>
      <td><input inputmode="numeric" value="${fvState.righe[i].c}" placeholder="kg" oninput="setFvRigaVal(${i},'c',this.value)" onchange="disegna()" style="min-width:56px"></td>
      <td><input inputmode="decimal" value="${fvState.righe[i].h}" placeholder="cm" oninput="setFvRigaVal(${i},'h',this.value)" onchange="disegna()" style="min-width:56px"></td>
      <td class="pauto">${p.F != null ? Math.round(p.F) : "—"}</td>
      <td class="pauto">${p.V != null ? p.V.toFixed(2) : "—"}</td>
      <td class="pauto">${p.P != null ? Math.round(p.P) : "—"}</td>
    </tr>`).join("");

  const colR2 = r2 == null ? "var(--txt3)" : r2 >= 0.95 ? "var(--verde)" : r2 >= 0.9 ? "var(--giallo)" : "var(--rosso)";
  const colImb = FVimb == null ? "var(--txt3)" : FVimb <= 10 ? "var(--verde)" : FVimb <= 40 ? "var(--giallo)" : "var(--rosso)";
  const consiglio = dir == null ? ""
    : dir === "Carenza di forza"
      ? "Priorità: FORZA — squat/stacco pesanti 85-100%, oly lift, balzi caricati."
      : "Priorità: VELOCITÀ / BALISTICO — jump squat 30-50%, balzi e depth jump reattivi, sprint.";

  return `
  <div class="card"><h3>Profilo Forza-Velocità (salti)</h3>
    <p class="et" style="margin-top:2px">Da squat jump a carichi crescenti stima F0 (forza), V0 (velocità), Pmax e lo squilibrio F-V, e ti dice cosa allenare. Stessa formula dell'app My Jump. Usa lo SQUAT JUMP, non il CMJ.</p></div>
  ${typeof bloccoComeSiFa === "function" ? bloccoComeSiFa("fv") : ""}

  <div class="card">
    <div class="griglia2">
      <div><label class="lab">Atleta (peso + altezze salvate)</label>
        <select onchange="setFvAtleta(this.value)" style="margin-top:6px">
          <option value="">— a mano —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${fvState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select></div>
      <div><label class="lab">Massa corporea (kg)</label>
        <input inputmode="decimal" value="${fvState.massa || ""}" placeholder="es. 74" oninput="setFvVal('massa',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Anca a FINE spinta (cm)</label>
        <input inputmode="numeric" value="${fvState.hFine || ""}" placeholder="es. 105" oninput="setFvVal('hFine',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <div><label class="lab">Anca in PARTENZA (cm)</label>
        <input inputmode="numeric" value="${fvState.hPart || ""}" placeholder="es. 70" oninput="setFvVal('hPart',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    <p class="et" style="margin-top:8px">hPO (distanza di spinta): <b style="color:var(--txt)">${hPO != null ? hPO.toFixed(2) + " m" : "—"}</b> · misura al grande trocantere (anca), da terra. Tipico 0.30-0.40 m.${fvState.atletaRif ? " Le altezze si <b>salvano</b> sull'atleta e si ripropongono ai prossimi test." : ""}</p>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Prove — squat jump a carico crescente (2-6). F, V e P si calcolano da soli.</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Condizione</th><th>Carico<br>agg. (kg)</th><th>Salto<br>(cm)</th><th>F (N)</th><th>V (m/s)</th><th>P (W)</th></tr></thead>
      <tbody>${righeInput}</tbody>
    </table></div>
  </div>

  <div class="card" ${ok ? 'style="border-color:rgba(124,194,67,.4)"' : ""}>
    <div class="quadri">
      <div class="q"><div class="k">F0 (N)</div><div class="v" style="color:var(--verde)">${ok ? Math.round(F0) : "—"}</div></div>
      <div class="q"><div class="k">V0 (m/s)</div><div class="v" style="color:var(--verde)">${ok ? V0.toFixed(2) : "—"}</div></div>
      <div class="q"><div class="k">Pmax (W)</div><div class="v">${ok ? Math.round(Pmax) : "—"}</div></div>
      <div class="q"><div class="k">Pmax/kg (W/kg)</div><div class="v">${ok ? Pkg.toFixed(1) : "—"}</div></div>
      <div class="q"><div class="k">Pendenza Sfv</div><div class="v" style="font-size:17px">${ok ? Sfv.toFixed(1) : "—"}</div></div>
      <div class="q"><div class="k">R²</div><div class="v" style="color:${colR2}">${r2 != null ? r2.toFixed(2) : "—"}</div></div>
    </div>
  </div>

  ${ok && FVimb != null ? `<div class="card" style="border-color:rgba(77,154,255,.4)">
    <p class="et" style="margin-bottom:8px">Squilibrio F-V → cosa allenare</p>
    <div class="quadri">
      <div class="q"><div class="k">Squilibrio F-V</div><div class="v" style="color:${colImb}">${Math.round(FVimb)}%</div></div>
      <div class="q wide"><div class="k">Direzione</div><div class="v s">${dir}</div></div>
    </div>
    <p style="font-size:14px;line-height:1.6;margin-top:10px;color:var(--txt)">${consiglio}</p>
    <p class="et" style="margin-top:8px">Squilibrio vicino a 0% = profilo già ottimale → lavora per alzare il Pmax.</p>
    ${fvState.atletaRif ? `<button class="btn btn-2" style="margin-top:12px" onclick="salvaFV()">💾 Salva il test</button>` : `<p class="et" style="margin-top:8px">Scegli un atleta in alto per salvare il test.</p>`}
  </div>` : `<div class="card"><p class="et">Inserisci massa, le due altezze dell'anca e almeno 2 salti a carichi diversi.</p></div>`}
  ${fvState.atletaRif && typeof bloccoSessioni === "function" ? bloccoSessioni(fvState.atletaRif, "fv", "Profili F-V salvati") : ""}`;
}

// 4b) DROP JUMP & RSI — reattività (Morin-Samozino / My Jump / OVR): RSI = altezza salto ÷ tempo di contatto.
let djState = { atletaRif: "at1", righe: [
  { caduta: "20", ct: "0.16", h: "32" }, { caduta: "30", ct: "0.17", h: "36" }, { caduta: "40", ct: "0.18", h: "40" },
  { caduta: "50", ct: "0.20", h: "41" }, { caduta: "60", ct: "0.23", h: "42" }, { caduta: "", ct: "", h: "" }
] };
function setDjAtleta(id) { djState.atletaRif = id; disegna(); }
function setDjRigaVal(i, campo, val) { djState.righe[i][campo] = val; }
function colRSI(r) { return r == null ? "var(--txt3)" : r < 1.5 ? "var(--rosso)" : r < 2.0 ? "var(--giallo)" : "var(--verde)"; }

// calcola per ogni riga: tempo di volo (dal salto), RSI = altezza/contatto, RSI volo/contatto
function djCalcola() {
  return djState.righe.map(r => {
    const H = parseFloat(String(r.caduta).replace(",", "."));
    const ct = parseFloat(String(r.ct).replace(",", "."));
    const h = parseFloat(String(r.h).replace(",", "."));
    const Hv = isNaN(H) ? null : H;
    if (isNaN(ct) || ct <= 0 || isNaN(h) || h <= 0) return { H: Hv, ct: null, h: null, ft: null, rsi: null, rsift: null };
    const JHm = h / 100, ft = Math.sqrt(8 * JHm / 9.81);
    return { H: Hv, ct, h, ft, rsi: JHm / ct, rsift: ft / ct };
  });
}
// prova con RSI più alto = altezza di caduta ottimale
function djBest() {
  const p = djCalcola().filter(x => x.rsi != null);
  if (!p.length) return null;
  let b = p[0]; p.forEach(x => { if (x.rsi > b.rsi) b = x; });
  return b;
}
async function salvaRSI() {
  const a = DEMO.atleti.find(x => x.id === djState.atletaRif);
  if (!a) { alert("Scegli prima un atleta."); return; }
  const best = djBest();
  if (!best) { alert("Inserisci almeno una prova valida (tempo di contatto e altezza del salto)."); return; }
  const oggi = new Date().toISOString().slice(0, 10);
  const nome = best.H != null ? `RSI (DJ ${best.H} cm)` : "RSI (Drop Jump)";
  // scheda completa del test (tutte le altezze) per rivederla per data
  const righe = djCalcola().filter(x => x.rsi != null).map(x => ({ caduta: x.H, ct: x.ct, h: x.h, rsi: Math.round(x.rsi * 100) / 100 }));
  if (typeof salvaSessione === "function") salvaSessione(a.id, "dropjump", { righe, bestH: best.H, bestRsi: Math.round(best.rsi * 100) / 100 });
  if (typeof creaTest === "function") {
    const ok = await creaTest(a.id, { nome, valore: Math.round(best.rsi * 100) / 100, unita: "m/s", data: oggi });
    if (ok) { alert(`Test RSI salvato per ${a.nome} (${nome} = ${best.rsi.toFixed(2)} m/s).`); disegna(); }
  }
}

function vistaDropJump() {
  const punti = djCalcola();
  let bestIdx = -1;
  punti.forEach((x, i) => { if (x.rsi != null && (bestIdx < 0 || x.rsi > punti[bestIdx].rsi)) bestIdx = i; });
  const best = bestIdx >= 0 ? punti[bestIdx] : null;
  const serie = punti.filter(x => x.rsi != null && x.H != null).sort((a, b) => a.H - b.H)
    .map(x => ({ label: `${x.H}`, val: Math.round(x.rsi * 100) / 100 }));

  const righeInput = punti.map((p, i) => `<tr ${i === bestIdx ? 'style="background:var(--verde-bg)"' : ""}>
      <td><input inputmode="numeric" value="${djState.righe[i].caduta}" placeholder="cm" oninput="setDjRigaVal(${i},'caduta',this.value)" onchange="disegna()" style="min-width:50px"></td>
      <td><input inputmode="decimal" value="${djState.righe[i].ct}" placeholder="0,18" oninput="setDjRigaVal(${i},'ct',this.value)" onchange="disegna()" style="min-width:60px"></td>
      <td><input inputmode="decimal" value="${djState.righe[i].h}" placeholder="cm" oninput="setDjRigaVal(${i},'h',this.value)" onchange="disegna()" style="min-width:50px"></td>
      <td class="pauto">${p.ft != null ? p.ft.toFixed(3) : "—"}</td>
      <td class="pauto" style="color:${colRSI(p.rsi)};font-weight:600">${p.rsi != null ? p.rsi.toFixed(2) : "—"}${i === bestIdx ? " ★" : ""}</td>
      <td class="pauto">${p.rsift != null ? p.rsift.toFixed(2) : "—"}</td>
    </tr>`).join("");

  return `
  <div class="card"><h3>Drop Jump & RSI</h3>
    <p class="et" style="margin-top:2px">Reattività (Morin-Samozino · My Jump · OVR): da varie altezze di caduta misuri tempo di contatto e altezza del salto. Il foglio calcola l'<b>RSI = altezza salto ÷ tempo di contatto</b> e trova l'<b>altezza di caduta ottimale</b> (RSI più alto ★).</p></div>
  ${typeof bloccoComeSiFa === "function" ? bloccoComeSiFa("dropjump") : ""}

  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setDjAtleta(this.value)" style="margin-top:6px">
      <option value="">— a mano —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${djState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Prove — una riga per altezza di caduta. Tempo di contatto in secondi (0,18 = 180 ms). Altezza salto dal volo (My Jump / OVR).</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Caduta<br>(cm)</th><th>T. contatto<br>(s)</th><th>Salto<br>(cm)</th><th>T. volo<br>(s)</th><th>RSI<br>(m/s)</th><th>RSI<br>volo/cont.</th></tr></thead>
      <tbody>${righeInput}</tbody>
    </table></div>
    <p class="et" style="margin-top:8px">RSI = altezza salto (m) ÷ tempo di contatto (s). Rif.: &lt;1.5 scarso · 1.5–2.0 medio · 2.0–2.5 buono · &gt;2.5 ottimo.</p>
  </div>

  ${best ? `<div class="card" style="border-color:rgba(124,194,67,.4)">
    <p class="et" style="margin-bottom:8px">Migliore reattività</p>
    <div class="quadri">
      <div class="q"><div class="k">Caduta ottimale</div><div class="v" style="color:var(--verde)">${best.H != null ? best.H + " cm" : "—"}</div></div>
      <div class="q"><div class="k">RSI migliore</div><div class="v" style="color:var(--verde)">${best.rsi.toFixed(2)}</div></div>
      <div class="q"><div class="k">Salto</div><div class="v">${best.h} cm</div></div>
      <div class="q"><div class="k">T. contatto</div><div class="v">${best.ct.toFixed(2)} s</div></div>
    </div>
    ${serie.length >= 2 ? `<p class="et" style="margin:14px 0 4px">RSI per altezza di caduta</p>${chartSerie(serie)}` : ""}
    ${djState.atletaRif ? `<button class="btn btn-2" style="margin-top:12px" onclick="salvaRSI()">💾 Salva il test RSI (scheda completa)</button>` : `<p class="et" style="margin-top:10px">Scegli un atleta per salvare il test (compare nella progressione e qui sotto per data).</p>`}
  </div>` : `<div class="card"><p class="et">Inserisci almeno una prova: altezza di caduta, tempo di contatto e altezza del salto.</p></div>`}
  ${djState.atletaRif && typeof bloccoSessioni === "function" ? bloccoSessioni(djState.atletaRif, "dropjump", "Test RSI salvati") : ""}`;
}

// 5) ANDAMENTO — due viste separate come nell'Excel: Pista (per distanza) e Palestra (per esercizio).

// estrae {nome, val, label, iso} dalle righe della scheda in base alla categoria
function andaVoci(a, cat) {
  const s = (a && a.scheda) || {};
  if (cat === "massimali") return (s.massimali || []).map(m => ({ nome: m[0], val: Number(m[1]), label: m[2], iso: m[5] || "" }));
  if (cat === "pb") return (s.pb || []).map(p => ({ nome: p[0], val: Number(p[1]), label: p[2], iso: p[6] || "" }));
  if (cat === "vbt") return (DEMO.vbtLog || []).filter(l => l.atletaId === a.id).map(l => ({ nome: l.esercizio, val: Number(l.vbtEseguita), label: (typeof fmtDataAnno === "function" ? fmtDataAnno(l.data) : l.data), iso: l.data || "", unita: "m/s" }));
  return (s.salti || []).map(t => ({ nome: t[0], val: Number(t[1]), label: t[3], iso: t[5] || "", unita: t[2] }));
}
function andaMetriche(a, cat) {
  const set = [];
  andaVoci(a, cat).forEach(v => { if (v.nome && !set.includes(v.nome)) set.push(v.nome); });
  return set;
}
// --- stato e dati dei due andamenti (Pista per distanza, Palestra per esercizio) ---
const DIST_ANDA = [10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 180, 200, 220, 250, 280, 300, 350, 400, 500, 600, 800, 1000, 1200, 1500, 1600, 2000, 3000, 5000, 10000];
const MET_PISTA = [["tempo", "Tempo (s)"], ["volume", "Volume (m)"], ["velocita", "Vel (m/s)"]];
const MET_PAL = [["serie", "Serie"], ["rep", "Rep"], ["peso", "Peso (kg)"], ["volume", "Volume (kg)"], ["rpe", "RPE"], ["vbt", "VBT (m/s)"]];
let andaPistaState = { atletaRif: "", distanza: 60, metrica: "tempo" };
let andaPalState = { atletaRif: "", esercizio: "", metrica: "peso" };
function setAndaPiAtleta(id) { andaPistaState.atletaRif = id; disegna(); }
function setAndaPiDist(d) { andaPistaState.distanza = Number(d); disegna(); }
function setAndaPiMetrica(m) { andaPistaState.metrica = m; disegna(); }
function setAndaPaAtleta(id) { andaPalState.atletaRif = id; andaPalState.esercizio = ""; disegna(); }
function setAndaPaEs(e) { andaPalState.esercizio = e; disegna(); }
function setAndaPaMetrica(m) { andaPalState.metrica = m; disegna(); }

// sedute in pista alla distanza scelta (da DEMO.pistaLog)
function pistaLogVoci(atletaId, distanza) {
  return (DEMO.pistaLog || []).filter(l => l.atletaId === atletaId && Number(l.distanza) === Number(distanza))
    .slice().sort((a, b) => (a.data || "") < (b.data || "") ? -1 : (a.data || "") > (b.data || "") ? 1 : 0);
}
// distanze che hanno almeno un dato (per marcare il menu a tendina)
function pistaLogDistanze(atletaId) {
  const set = [];
  (DEMO.pistaLog || []).filter(l => l.atletaId === atletaId).forEach(l => { const d = Number(l.distanza); if (!set.includes(d)) set.push(d); });
  return set.sort((a, b) => a - b);
}
// esercizi registrati in palestra (da DEMO.vbtLog)
function palLogEsercizi(atletaId) {
  const set = [];
  (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId).forEach(l => { if (!set.includes(l.esercizio)) set.push(l.esercizio); });
  return set;
}
function palLogVoci(atletaId, esercizio) {
  return (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId && l.esercizio === esercizio)
    .slice().sort((a, b) => (a.data || "") < (b.data || "") ? -1 : (a.data || "") > (b.data || "") ? 1 : 0);
}
// blocco Sedute / Media / Max / Min come nell'Excel
function statBlocco(vals) {
  const v = vals.filter(x => x != null && !isNaN(x));
  const n = v.length;
  const f = x => Math.abs(x) >= 100 ? String(Math.round(x)) : (Math.round(x * 100) / 100).toString();
  const cells = [["Sedute", String(n)], ["Media", n ? f(v.reduce((s, x) => s + x, 0) / n) : "—"],
    ["Max", n ? f(Math.max(...v)) : "—"], ["Min", n ? f(Math.min(...v)) : "—"]];
  return `<div style="display:flex;gap:8px;margin:12px 0 4px">${cells.map(([l, val]) =>
    `<div style="flex:1;background:var(--card2);border-radius:12px;padding:10px 4px;text-align:center">
      <p class="et" style="margin:0 0 2px">${l}</p><b style="font-size:16px">${val}</b></div>`).join("")}</div>`;
}

function chartSerie(punti) {
  const n = punti.length;
  if (!n) return `<p class="et">Nessun dato per questa voce.</p>`;
  const vals = punti.map(p => p.val);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= Math.abs(min * 0.05) || 1; max += Math.abs(max * 0.05) || 1; }
  const W = 340, H = 170, padL = 34, padR = 8, padT = 10, padB = 30;
  const x = i => padL + (W - padL - padR) * (n <= 1 ? 0.5 : i / (n - 1));
  const y = v => (H - padB) - (H - padT - padB) * ((v - min) / (max - min));
  const fmt = v => Math.abs(v) >= 100 ? String(Math.round(v)) : (Math.round(v * 100) / 100).toString();
  const yl = [min, (min + max) / 2, max].map(v =>
    `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${W - padR}" y2="${y(v).toFixed(1)}" stroke="#2c2c34"/><text x="2" y="${(y(v) + 3).toFixed(1)}" fill="#76756f" font-size="9">${fmt(v)}</text>`).join("");
  const step = Math.max(1, Math.ceil(n / 6));
  const xl = punti.map((p, i) => (i % step === 0 || i === n - 1)
    ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" fill="#76756f" font-size="8" text-anchor="middle">${(p.label || "").split(" ").slice(0, 2).join(" ")}</text>` : "").join("");
  const line = n > 1 ? `<polyline points="${punti.map((p, i) => `${x(i).toFixed(1)},${y(p.val).toFixed(1)}`).join(" ")}" fill="none" stroke="#4d9aff" stroke-width="2"/>` : "";
  const dots = punti.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.val).toFixed(1)}" r="3" fill="#4d9aff"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${yl}${xl}${line}${dots}</svg>`;
}

// ANDAMENTO PISTA — per distanza (Tempo / Volume / Vel), si compila dalle sedute di pista
// formatta un tempo di pista: mm:ss.cc per i mezzofondisti o per i tempi lunghi (≥60s), altrimenti secondi.cc
function fmtTempoPista(sec, atleta) {
  if (sec == null || sec === "" || isNaN(Number(sec))) return "—";
  sec = Number(sec);
  const isMezzo = (typeof gruppoDi === "function" && atleta) ? gruppoDi(atleta) === "mezzo" : false;
  return (isMezzo || sec >= 60) && typeof _mzMMSSc === "function" ? _mzMMSSc(sec) : sec.toFixed(2);
}
function vistaAndamentoPista() {
  const atl = DEMO.atleti.find(x => x.id === andaPistaState.atletaRif);
  const dist = andaPistaState.distanza, met = andaPistaState.metrica;
  const voci = atl ? pistaLogVoci(atl.id, dist) : [];
  const metLbl = (MET_PISTA.find(m => m[0] === met) || MET_PISTA[0])[1];
  const disp = atl ? pistaLogDistanze(atl.id) : [];
  const serie = voci.map(v => ({ label: typeof fmtDataAnno === "function" ? fmtDataAnno(v.data) : v.data, val: Number(v[met]) }));

  return `
  <div class="card"><h3>Andamento Pista</h3>
    <p class="et" style="margin-top:2px">Scegli una distanza: seduta per seduta il Tempo, il Volume (metri) e la velocità (m/s), col grafico della metrica che scegli. Si compila da solo dalla Pista.</p></div>

  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setAndaPiAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${andaPistaState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
    ${atl ? `<div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Distanza (m)</label>
        <select onchange="setAndaPiDist(this.value)" style="margin-top:6px">${DIST_ANDA.map(d => `<option value="${d}" ${dist === d ? "selected" : ""}>${d}${disp.includes(d) ? " ●" : ""}</option>`).join("")}</select></div>
      <div><label class="lab">Vedi nel grafico</label>
        <select onchange="setAndaPiMetrica(this.value)" style="margin-top:6px">${MET_PISTA.map(([k, l]) => `<option value="${k}" ${met === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
    </div>` : ""}
  </div>

  ${!atl ? `<div class="card"><p class="et">Scegli un atleta.</p></div>`
    : !voci.length ? `<div class="card"><p class="et">Nessuna seduta sui ${dist} m per ${atl.nome}. I dati compaiono man mano che chiudi le sedute di pista${disp.length ? ` · distanze con dati: ${disp.join(", ")} m` : ""}.</p></div>`
    : `<div class="card">
        <p class="et" style="margin-bottom:2px">${metLbl} · ${dist} m · ${atl.nome}${met === "tempo" ? " · più in basso = meglio" : ""}</p>
        ${statBlocco(serie.map(s => s.val))}
        ${chartSerie(serie)}
        <table class="ptab" style="min-width:0;margin-top:10px"><thead><tr><th>Data</th><th>Tempo</th><th>Vol (m)</th><th>Vel</th></tr></thead>
          <tbody>${voci.map(v => `<tr><td>${typeof fmtDataAnno === "function" ? fmtDataAnno(v.data) : v.data}</td><td class="pauto">${fmtTempoPista(v.tempo, atl)}</td><td>${v.volume != null ? v.volume : "—"}</td><td>${v.velocita != null ? Number(v.velocita).toFixed(2) : "—"}</td></tr>`).join("")}</tbody></table>
      </div>`}`;
}

// ANDAMENTO PALESTRA — per esercizio (Serie/Rep/Peso/Volume/RPE/VBT), si compila dalle sedute di palestra
function vistaAndamentoPalestra() {
  const atl = DEMO.atleti.find(x => x.id === andaPalState.atletaRif);
  const esercizi = atl ? palLogEsercizi(atl.id) : [];
  if (atl && !andaPalState.esercizio && esercizi.length) andaPalState.esercizio = esercizi[0];
  const es = andaPalState.esercizio, met = andaPalState.metrica;
  const metLbl = (MET_PAL.find(m => m[0] === met) || MET_PAL[2])[1];
  const voci = atl && es ? palLogVoci(atl.id, es) : [];
  const campo = met === "vbt" ? "vbtEseguita" : met;
  const serie = voci.map(v => {
    let raw = v[campo]; if (raw == null && met === "peso") raw = v.carico;
    return { label: typeof fmtDataAnno === "function" ? fmtDataAnno(v.data) : v.data, val: Number(raw) };
  }).filter(s => !isNaN(s.val));

  return `
  <div class="card"><h3>Andamento Palestra</h3>
    <p class="et" style="margin-top:2px">Scegli un esercizio: seduta per seduta Serie, Rep, Peso, Volume (kg), RPE e VBT, col grafico della metrica che scegli. Si compila da solo dalla Palestra.</p></div>

  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setAndaPaAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${andaPalState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
    ${atl && esercizi.length ? `<div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Esercizio</label>
        <select onchange="setAndaPaEs(this.value)" style="margin-top:6px">${esercizi.map(e => `<option ${es === e ? "selected" : ""}>${e}</option>`).join("")}</select></div>
      <div><label class="lab">Vedi nel grafico</label>
        <select onchange="setAndaPaMetrica(this.value)" style="margin-top:6px">${MET_PAL.map(([k, l]) => `<option value="${k}" ${met === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
    </div>` : ""}
  </div>

  ${!atl ? `<div class="card"><p class="et">Scegli un atleta.</p></div>`
    : !esercizi.length ? `<div class="card"><p class="et">Nessun esercizio registrato per ${atl.nome}. I dati compaiono man mano che chiudi le sedute di palestra.</p></div>`
    : `<div class="card">
        <p class="et" style="margin-bottom:2px">${metLbl} · ${es} · ${atl.nome}</p>
        ${statBlocco(serie.map(s => s.val))}
        ${chartSerie(serie)}
        <table class="ptab" style="min-width:0;margin-top:10px"><thead><tr><th>Data</th><th>Ser</th><th>Rep</th><th>Peso</th><th>Vol</th><th>RPE</th><th>VBT</th></tr></thead>
          <tbody>${voci.map(v => `<tr><td>${typeof fmtDataAnno === "function" ? fmtDataAnno(v.data) : v.data}</td><td>${v.serie != null ? v.serie : "—"}</td><td>${v.rep != null ? v.rep : "—"}</td><td class="pauto">${v.peso != null ? v.peso : (v.carico != null ? v.carico : "—")}</td><td>${v.volume != null ? v.volume : "—"}</td><td>${v.rpe != null ? v.rpe : "—"}</td><td>${v.vbtEseguita != null ? Number(v.vbtEseguita).toFixed(2) : "—"}</td></tr>`).join("")}</tbody></table>
      </div>`}`;
}

// 6) PROFILO F-V SPRINT (Samozino-Morin 2016) — dai tempi parziali o da MySprint.
const DIST_SPRINT = [5, 10, 15, 20, 30, 40];
const MS_LABELS = ["F0/kg (N/kg)", "V0 (m/s)", "Pmax/kg (W/kg)", "RFmax (%)", "Sfv/kg"];
let sprintState = { atletaRif: "", massa: "", altezza: "", temp: "20", vento: "0", pressione: "760", fonte: "tempi", tempi: ["", "", "", "", "", ""], ms: ["", "", "", "", ""] };

function setSprintAtleta(id) {
  sprintState.atletaRif = id;
  const a = DEMO.atleti.find(x => x.id === id);
  if (a && a.scheda && a.scheda.anagrafica) {
    if (a.scheda.anagrafica.peso) sprintState.massa = String(a.scheda.anagrafica.peso);
    if (a.scheda.anagrafica.altezza) sprintState.altezza = String(a.scheda.anagrafica.altezza / 100);
  }
  disegna();
}
function setSprintVal(campo, val) { sprintState[campo] = val; }
function setSprintFonte(v) { sprintState.fonte = v; disegna(); }
function setSprintTempo(i, val) { sprintState.tempi[i] = val; }
function setSprintMs(i, val) { sprintState.ms[i] = val; }

// adatta Vmax e tau ai tempi parziali (x(t)=Vmax·(t + tau·e^-t/tau − tau))
function fitSprint(dists, tempi) {
  let best = null;
  for (let i = 0; i <= 70; i++) {
    const tau = Math.round((0.60 + 0.02 * i) * 100) / 100;
    const G = tempi.map(t => t + tau * Math.exp(-t / tau) - tau);
    let sxg = 0, sgg = 0;
    for (let k = 0; k < dists.length; k++) { sxg += dists[k] * G[k]; sgg += G[k] * G[k]; }
    if (sgg === 0) continue;
    const Vmax = sxg / sgg;
    let err = 0;
    for (let k = 0; k < dists.length; k++) { const d = dists[k] - Vmax * G[k]; err += d * d; }
    if (!best || err < best.err) best = { tau, Vmax, err };
  }
  return best;
}

// calcolo del profilo F-V sprint (Samozino-Morin) — usato da vista e da salvataggio
function calcSprint() {
  const massa = parseFloat(String(sprintState.massa).replace(",", "."));
  const altezza = parseFloat(String(sprintState.altezza).replace(",", "."));
  const temp = parseFloat(String(sprintState.temp).replace(",", ".")) || 20;
  const vento = parseFloat(String(sprintState.vento).replace(",", ".")) || 0;
  const press = parseFloat(String(sprintState.pressione).replace(",", ".")) || 760;
  const fonte = sprintState.fonte;
  let F0kg = null, V0 = null, Pkg = null, RFmax = null, Sfvkg = null, DRF = null, Vmax = null, tau = null;
  if (fonte === "mysprint") {
    const m = sprintState.ms.map(x => parseFloat(String(x).replace(",", ".")));
    if (!isNaN(m[0])) F0kg = m[0]; if (!isNaN(m[1])) V0 = m[1]; if (!isNaN(m[2])) Pkg = m[2];
    if (!isNaN(m[3])) RFmax = m[3]; if (!isNaN(m[4])) Sfvkg = m[4];
  } else if (!isNaN(massa) && massa > 0 && !isNaN(altezza) && altezza > 0) {
    const coppie = DIST_SPRINT.map((d, i) => ({ d, t: parseFloat(String(sprintState.tempi[i]).replace(",", ".")) }))
      .filter(p => !isNaN(p.t) && p.t > 0);
    if (coppie.length >= 2) {
      const fit = fitSprint(coppie.map(p => p.d), coppie.map(p => p.t));
      if (fit && fit.Vmax > 0) {
        Vmax = fit.Vmax; tau = fit.tau;
        const rho = 1.293 * (press / 760) * (273 / (273 + temp));
        const af = 0.2025 * Math.pow(altezza, 0.725) * Math.pow(massa, 0.425) * 0.266;
        const kd = 0.5 * rho * af * 0.9;
        const samples = [];
        for (let i = 0; i <= 40; i++) {
          const v = Vmax * (i / 40);
          const a = (Vmax - v) / tau;
          const Fh = massa * a + kd * Math.pow(v - vento, 2);
          const RF = Fh !== 0 ? Fh / Math.sqrt(Fh * Fh + Math.pow(massa * 9.81, 2)) * 100 : 0;
          samples.push({ v, Fh, RF });
        }
        const reg = regressione(samples.map(s => ({ x: s.v, y: s.Fh })));
        if (reg && reg.slope < 0) {
          const F0 = reg.intercept, Sfv = reg.slope;
          F0kg = F0 / massa; V0 = -F0 / Sfv; Pkg = F0kg * V0 / 4; Sfvkg = Sfv / massa;
          RFmax = Math.max(...samples.map(s => s.RF));
          const regDrf = regressione(samples.slice(2).map(s => ({ x: s.v, y: s.RF })));
          if (regDrf) DRF = regDrf.slope;
        }
      }
    }
  }
  const ok = F0kg != null && V0 != null && V0 > 0;
  return { ok, F0kg, V0, Pkg, RFmax, Sfvkg, DRF, Vmax, tau };
}

function vistaProfiloFVSprint() {
  const { ok, F0kg, V0, Pkg, RFmax, Sfvkg, DRF, Vmax, tau } = calcSprint();
  const fonte = sprintState.fonte;
  let dir = null, extra = "";
  if (ok) {
    dir = (F0kg / 8.5 < V0 / 10) ? "Carenza di forza" : "Carenza di velocità";
    if (RFmax != null && RFmax < 45) extra = " · efficacia tecnica bassa (spinta orizzontale da migliorare)";
  }
  const consiglio = dir === "Carenza di forza"
    ? "Priorità ACCELERAZIONE: traino pesante, forza max/esplosiva, partenze dai blocchi."
    : dir === "Carenza di velocità"
      ? "Priorità VELOCITÀ MASSIMA: lanciati, over-speed/assistito, tecnica ad alta velocità."
      : "";

  const tempiTable = `<div class="p-scroll"><table class="ptab" style="min-width:0">
      <thead><tr><th>Distanza (m)</th><th>Tempo cumulato (s)</th></tr></thead>
      <tbody>${DIST_SPRINT.map((d, i) => `<tr><td>${d}</td><td><input inputmode="decimal" value="${sprintState.tempi[i]}" placeholder="s" oninput="setSprintTempo(${i},this.value)" onchange="disegna()" style="min-width:80px"></td></tr>`).join("")}</tbody>
    </table></div>
    <p class="et" style="margin-top:8px">${Vmax != null ? `Vmax <b style="color:var(--txt)">${Vmax.toFixed(2)} m/s</b> · tau <b style="color:var(--txt)">${tau.toFixed(2)} s</b>` : "Inserisci almeno 2 tempi parziali (di uno sprint massimale da fermo)."}</p>`;

  const msTable = MS_LABELS.map((l, i) => `<div class="griglia2" style="margin-top:${i ? 8 : 0}px;align-items:center">
      <label class="lab" style="margin:0">${l}</label>
      <input inputmode="decimal" value="${sprintState.ms[i]}" oninput="setSprintMs(${i},this.value)" onchange="disegna()"></div>`).join("");

  return `
  <div class="card"><h3>Profilo F-V Sprint</h3>
    <p class="et" style="margin-top:2px">Da uno sprint massimale (30-40 m): inserisci i tempi parziali (calcolo automatico) oppure gli output di MySprint. È il forza-velocità orizzontale della corsa.</p></div>
  ${typeof bloccoComeSiFa === "function" ? bloccoComeSiFa("fv-sprint") : ""}

  <div class="card">
    <div class="griglia2">
      <div><label class="lab">Atleta</label>
        <select onchange="setSprintAtleta(this.value)" style="margin-top:6px"><option value="">— a mano —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${sprintState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select></div>
      <div><label class="lab">Massa (kg)</label>
        <input inputmode="decimal" value="${sprintState.massa || ""}" placeholder="74" oninput="setSprintVal('massa',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Altezza (m)</label>
        <input inputmode="decimal" value="${sprintState.altezza || ""}" placeholder="1.81" oninput="setSprintVal('altezza',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <div><label class="lab">Vento (m/s, + a favore)</label>
        <input inputmode="decimal" value="${sprintState.vento}" oninput="setSprintVal('vento',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Temperatura (°C)</label>
        <input inputmode="decimal" value="${sprintState.temp}" oninput="setSprintVal('temp',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <div><label class="lab">Pressione (mmHg)</label>
        <input inputmode="decimal" value="${sprintState.pressione}" oninput="setSprintVal('pressione',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
  </div>

  <div class="card">
    <div class="segm">
      <button class="${fonte === "tempi" ? "on" : ""}" onclick="setSprintFonte('tempi')">Tempi parziali</button>
      <button class="${fonte === "mysprint" ? "on" : ""}" onclick="setSprintFonte('mysprint')">MySprint</button>
    </div>
    <div style="margin-top:12px">${fonte === "tempi" ? tempiTable : msTable}</div>
  </div>

  <div class="card" ${ok ? 'style="border-color:rgba(124,194,67,.4)"' : ""}>
    <div class="quadri">
      <div class="q"><div class="k">F0/kg (N/kg)</div><div class="v" style="color:var(--verde)">${ok ? F0kg.toFixed(2) : "—"}</div></div>
      <div class="q"><div class="k">V0 (m/s)</div><div class="v" style="color:var(--verde)">${ok ? V0.toFixed(2) : "—"}</div></div>
      <div class="q"><div class="k">Pmax/kg (W/kg)</div><div class="v">${Pkg != null ? Pkg.toFixed(1) : "—"}</div></div>
      <div class="q"><div class="k">RFmax (%)</div><div class="v">${RFmax != null ? RFmax.toFixed(1) : "—"}</div></div>
      <div class="q"><div class="k">Sfv/kg</div><div class="v" style="font-size:17px">${Sfvkg != null ? Sfvkg.toFixed(2) : "—"}</div></div>
      <div class="q"><div class="k">DRF (%/m/s)</div><div class="v" style="font-size:17px">${DRF != null ? DRF.toFixed(2) : "—"}</div></div>
    </div>
    ${ok ? `<div style="margin-top:12px;padding:12px;background:var(--blu-bg);border-radius:12px">
      <div style="font-weight:600;color:var(--blu)">${dir}${extra}</div>
      <p style="font-size:14px;line-height:1.6;margin-top:6px">${consiglio}</p></div>
      <p class="et" style="margin-top:10px">Rif. velocisti allenati: F0/kg 7-9 · V0 9-10.5 · Pmax/kg 18-28 · RFmax 45-60%.</p>
      ${sprintState.atletaRif ? `<button class="btn btn-2" style="margin-top:12px" onclick="salvaFVSprint()">💾 Salva il test</button>` : `<p class="et" style="margin-top:8px">Scegli un atleta in alto per salvare il test.</p>`}`
      : `<p class="et" style="margin-top:8px">Inserisci massa e altezza + almeno 2 tempi parziali, oppure passa a MySprint e incolla i valori.</p>`}
  </div>
  ${sprintState.atletaRif && typeof bloccoSessioni === "function" ? bloccoSessioni(sprintState.atletaRif, "fv-sprint", "F-V Sprint salvati") : ""}`;
}

// 7) MONITORAGGIO VBT — registro della velocità del bilanciere nel tempo (dalle sedute di palestra).
let vbtState = { atletaRif: "", esercizio: "" };
function setVbtAtleta(id) { vbtState.atletaRif = id; vbtState.esercizio = ""; disegna(); }
function setVbtEsercizio(e) { vbtState.esercizio = e; disegna(); }
function eserciziVbt(atletaId) {
  const set = [];
  (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId && l.vbtEseguita != null).forEach(l => { if (!set.includes(l.esercizio)) set.push(l.esercizio); });
  return set;
}
function serieVbt(atletaId, esercizio) {
  return (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId && l.esercizio === esercizio && l.vbtEseguita != null)
    .slice().sort((a, b) => (a.data || "") < (b.data || "") ? -1 : (a.data || "") > (b.data || "") ? 1 : 0);
}
// chiamata dalla seduta di palestra a fine allenamento; extra = {serie, rep, volume, rpe}
function registraVbt(atletaId, esercizio, peso, vbtEseguita, vbtTarget, extra) {
  if (!atletaId || !esercizio) return;
  extra = extra || {};
  const hasVbt = vbtEseguita != null && !isNaN(vbtEseguita);
  if (!hasVbt && peso == null && extra.serie == null) return; // niente da registrare
  DEMO.vbtLog = DEMO.vbtLog || [];
  DEMO.vbtLog.push({
    data: (typeof oggiISO === "function" ? oggiISO() : new Date().toISOString().slice(0, 10)), atletaId, esercizio,
    peso: peso != null ? peso : null, carico: peso != null ? peso : null,
    serie: extra.serie != null ? extra.serie : null, rep: extra.rep != null ? extra.rep : null,
    volume: extra.volume != null ? extra.volume : null, rpe: extra.rpe != null ? extra.rpe : null,
    vbtEseguita: hasVbt ? Math.round(vbtEseguita * 100) / 100 : null, vbtTarget: vbtTarget != null ? vbtTarget : null
  });
  if (typeof salvaCustom === "function") salvaCustom();
}
// chiamata dalla seduta di pista a fine allenamento
function registraPista(atletaId, distanza, tempo, volume, velocita) {
  if (!atletaId || !distanza) return;
  DEMO.pistaLog = DEMO.pistaLog || [];
  DEMO.pistaLog.push({
    data: (typeof oggiISO === "function" ? oggiISO() : new Date().toISOString().slice(0, 10)), atletaId, distanza: Number(distanza),
    tempo: tempo != null ? Math.round(tempo * 100) / 100 : null,
    volume: volume != null ? volume : null,
    velocita: velocita != null ? Math.round(velocita * 100) / 100 : null
  });
  if (typeof salvaCustom === "function") salvaCustom();
}

function chartVBT(punti) {
  const n = punti.length;
  if (!n) return `<p class="et">Nessun dato VBT per questa voce.</p>`;
  const all = punti.flatMap(p => [p.val, p.target]).filter(v => v != null);
  let min = Math.min(...all), max = Math.max(...all);
  if (min === max) { min -= 0.05; max += 0.05; }
  const W = 340, H = 170, padL = 32, padR = 8, padT = 10, padB = 28;
  const x = i => padL + (W - padL - padR) * (n <= 1 ? 0.5 : i / (n - 1));
  const y = v => (H - padB) - (H - padT - padB) * ((v - min) / (max - min));
  const yl = [min, (min + max) / 2, max].map(v => `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${W - padR}" y2="${y(v).toFixed(1)}" stroke="#2c2c34"/><text x="2" y="${(y(v) + 3).toFixed(1)}" fill="#76756f" font-size="9">${(Math.round(v * 100) / 100).toFixed(2)}</text>`).join("");
  const step = Math.max(1, Math.ceil(n / 6));
  const xl = punti.map((p, i) => (i % step === 0 || i === n - 1) ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" fill="#76756f" font-size="8" text-anchor="middle">${(p.label || "").split(" ").slice(0, 2).join(" ")}</text>` : "").join("");
  const tgt = punti.every(p => p.target != null) ? `<polyline points="${punti.map((p, i) => `${x(i).toFixed(1)},${y(p.target).toFixed(1)}`).join(" ")}" fill="none" stroke="#76756f" stroke-width="1.5" stroke-dasharray="4 3"/>` : "";
  const line = n > 1 ? `<polyline points="${punti.map((p, i) => `${x(i).toFixed(1)},${y(p.val).toFixed(1)}`).join(" ")}" fill="none" stroke="#4d9aff" stroke-width="2"/>` : "";
  const dots = punti.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.val).toFixed(1)}" r="3" fill="#4d9aff"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${yl}${xl}${tgt}${line}${dots}</svg>`;
}

function vistaMonitoraggioVBT() {
  const atl = DEMO.atleti.find(x => x.id === vbtState.atletaRif);
  const esercizi = atl ? eserciziVbt(atl.id) : [];
  if (atl && !vbtState.esercizio && esercizi.length) vbtState.esercizio = esercizi[0];
  const serie = atl && vbtState.esercizio ? serieVbt(atl.id, vbtState.esercizio) : [];
  const punti = serie.map(e => ({ label: typeof fmtDataAnno === "function" ? fmtDataAnno(e.data) : e.data, val: e.vbtEseguita, target: e.vbtTarget }));
  const delta = serie.length > 1 ? serie[serie.length - 1].vbtEseguita - serie[0].vbtEseguita : null;

  return `
  <div class="card"><h3>Monitoraggio VBT</h3>
    <p class="et" style="margin-top:2px">La velocità del bilanciere nel tempo, dalle sedute di palestra. A parità di carico, più la m/s sale = i pesi corrono di più = stai migliorando.</p></div>

  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setVbtAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${vbtState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
    ${atl && esercizi.length ? `<label class="lab" style="display:block;margin-top:12px">Esercizio</label>
      <select onchange="setVbtEsercizio(this.value)" style="margin-top:6px">${esercizi.map(e => `<option ${vbtState.esercizio === e ? "selected" : ""}>${e}</option>`).join("")}</select>` : ""}
  </div>

  ${!atl ? `<div class="card"><p class="et">Scegli un atleta per vedere l'andamento della velocità del bilanciere.</p></div>`
    : !esercizi.length ? `<div class="card"><p class="et">Nessun dato VBT per ${atl.nome}. Si riempie quando registra la velocità nelle sedute di palestra.</p></div>`
    : `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <p class="et" style="margin:0">${vbtState.esercizio} · m/s eseguita <span style="color:var(--txt3)">(tratteggio = target)</span></p>
          ${delta != null ? `<span class="et" style="color:${delta >= 0 ? "var(--verde)" : "var(--rosso)"}">${delta > 0 ? "+" : ""}${(Math.round(delta * 100) / 100).toFixed(2)} m/s</span>` : ""}
        </div>
        ${chartVBT(punti)}
        <table class="ptab" style="min-width:0;margin-top:10px">
          <thead><tr><th>Data</th><th>Carico</th><th>Eseg.</th><th>Target</th></tr></thead>
          <tbody>${serie.map(e => {
            const sotto = e.vbtTarget != null && e.vbtEseguita < e.vbtTarget * (1 - (CONFIG.soglie.vbtSottoPct / 100));
            return `<tr><td>${typeof fmtDataAnno === "function" ? fmtDataAnno(e.data) : e.data}</td><td>${e.carico != null ? e.carico + " kg" : "—"}</td><td class="pauto" style="color:${sotto ? "var(--rosso)" : "var(--verde)"}">${e.vbtEseguita.toFixed(2)}</td><td>${e.vbtTarget != null ? e.vbtTarget.toFixed(2) : "—"}</td></tr>`;
          }).join("")}</tbody>
        </table>
      </div>`}`;
}

// 7) CMJ e SJ (salti verticali) — My Jump; salva in scheda + indice elastico CMJ−SJ
let cmjState = { atletaRif: "", cmj: "", sj: "" };
function setCmjAtleta(id) { cmjState.atletaRif = id; disegna(); }
function setCmjVal(k, v) { cmjState[k] = v; }
async function salvaCMJ() {
  const a = DEMO.atleti.find(x => x.id === cmjState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const cmj = parseFloat(String(cmjState.cmj).replace(",", ".")), sj = parseFloat(String(cmjState.sj).replace(",", "."));
  if (!(cmj > 0) && !(sj > 0)) { alert("Inserisci almeno CMJ o SJ."); return; }
  const oggi = new Date().toISOString().slice(0, 10); let n = 0;
  if (cmj > 0 && typeof creaTest === "function") { await creaTest(a.id, { nome: "CMJ", valore: Math.round(cmj * 10) / 10, unita: "cm", data: oggi }); n++; }
  if (sj > 0 && typeof creaTest === "function") { await creaTest(a.id, { nome: "SJ", valore: Math.round(sj * 10) / 10, unita: "cm", data: oggi }); n++; }
  alert(`Salvati ${n} salti nella scheda di ${a.nome}.`); disegna();
}
function vistaCMJ() {
  const cmj = parseFloat(String(cmjState.cmj).replace(",", ".")), sj = parseFloat(String(cmjState.sj).replace(",", "."));
  const idx = (!isNaN(cmj) && !isNaN(sj) && sj > 0) ? cmj - sj : null;
  const atl = DEMO.atleti.find(x => x.id === cmjState.atletaRif);
  return `
  <div class="card"><h3>CMJ e SJ (salti verticali)</h3>
    <p class="et" style="margin-top:2px">Countermovement jump e squat jump (My Jump). La differenza CMJ−SJ dice quanto sfrutti l'elastico (contromovimento).</p></div>
  ${typeof bloccoComeSiFa === "function" ? bloccoComeSiFa("cmj") : ""}
  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setCmjAtleta(this.value)" style="margin-top:6px">
      <option value="">— a mano —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${cmjState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">CMJ (cm)</label><input inputmode="decimal" value="${cmjState.cmj}" placeholder="es. 38" oninput="setCmjVal('cmj',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <div><label class="lab">SJ (cm)</label><input inputmode="decimal" value="${cmjState.sj}" placeholder="es. 35" oninput="setCmjVal('sj',this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
  </div>
  <div class="card" ${idx != null ? 'style="border-color:rgba(124,194,67,.4)"' : ""}>
    <div class="quadri">
      <div class="q"><div class="k">CMJ</div><div class="v">${!isNaN(cmj) ? cmj + " cm" : "—"}</div></div>
      <div class="q"><div class="k">SJ</div><div class="v">${!isNaN(sj) ? sj + " cm" : "—"}</div></div>
      <div class="q"><div class="k">CMJ−SJ</div><div class="v" style="color:var(--verde)">${idx != null ? (Math.round(idx * 10) / 10) + " cm" : "—"}</div></div>
    </div>
    <p class="et" style="margin-top:8px">CMJ−SJ alto = buon uso del ciclo allungamento-accorciamento. Vicino a 0 o negativo → lavora la componente elastica/reattiva.</p>
    ${atl ? `<button class="btn btn-2" style="margin-top:12px" onclick="salvaCMJ()">Salva nella scheda di ${atl.nome}</button>` : `<p class="et" style="margin-top:10px">Scegli un atleta per salvare (compare nella progressione test).</p>`}
  </div>`;
}

// 8) SPRINT — tempi: salva come PB (distanza + tempo) → progressione tempi
const DIST_SPRINT_TEST = ["20 m", "30 m", "30 m lanciato", "60 m", "100 m", "150 m"];
let sprTState = { atletaRif: "", dist: "30 m", tempo: "" };
function setSprTAtleta(id) { sprTState.atletaRif = id; disegna(); }
function setSprTDist(d) { sprTState.dist = d; disegna(); }
function setSprTTempo(v) { sprTState.tempo = v; }
async function salvaSprintTest() {
  const a = DEMO.atleti.find(x => x.id === sprTState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const t = parseFloat(String(sprTState.tempo).replace(",", "."));
  if (!(t > 0)) { alert("Inserisci un tempo valido."); return; }
  const oggi = new Date().toISOString().slice(0, 10);
  const ok = typeof creaPB === "function" ? await creaPB(a.id, { distanza: sprTState.dist, tempo: Math.round(t * 100) / 100, data: oggi, stagione: null, obiettivo: null, origine: "allenamento" }) : false;
  if (ok) { alert(`Salvato: ${sprTState.dist} ${t.toFixed(2)} s nella scheda di ${a.nome}.`); sprTState.tempo = ""; disegna(); }
}
function vistaSprintTest() {
  const atl = DEMO.atleti.find(x => x.id === sprTState.atletaRif);
  const storia = atl && atl.scheda ? (atl.scheda.pb || []).filter(p => p[0] === sprTState.dist) : [];
  return `
  <div class="card"><h3>Sprint — tempi</h3>
    <p class="et" style="margin-top:2px">Registra i tempi (20 m, 30 m, 30 m lanciato…). Si salvano come PB e li vedi nella progressione.</p></div>
  ${typeof bloccoComeSiFa === "function" ? bloccoComeSiFa("sprint-test") : ""}
  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setSprTAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${sprTState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
    <div class="griglia2" style="margin-top:12px">
      <div><label class="lab">Distanza</label>
        <select onchange="setSprTDist(this.value)" style="margin-top:6px">${DIST_SPRINT_TEST.map(d => `<option ${sprTState.dist === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
      <div><label class="lab">Tempo (s)</label>
        <input inputmode="decimal" value="${sprTState.tempo}" placeholder="es. 3.85" oninput="setSprTTempo(this.value)" onchange="disegna()" style="margin-top:6px"></div>
    </div>
    ${atl ? `<button class="btn" style="margin-top:14px" onclick="salvaSprintTest()">Salva il tempo</button>` : `<p class="et" style="margin-top:10px">Scegli un atleta per salvare.</p>`}
  </div>
  ${atl ? `<div class="card"><p class="et" style="margin-bottom:6px">Storico ${sprTState.dist} · ${atl.nome}</p>
    ${storia.length ? `<table class="ptab" style="min-width:0"><thead><tr><th>Data</th><th>Tempo (s)</th></tr></thead><tbody>${storia.map(p => `<tr><td>${p[2] || "—"}</td><td class="pauto">${p[1]}</td></tr>`).join("")}</tbody></table>` : `<p class="et">Ancora nessun tempo per ${sprTState.dist}.</p>`}</div>` : ""}`;
}

// salvataggio Profilo F-V salti (headline Pmax/kg) e Traino (V0) → scheda/progressione
async function salvaFV() {
  const a = DEMO.atleti.find(x => x.id === fvState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const massa = parseFloat(String(fvState.massa).replace(",", "."));
  const hPO = ((parseFloat(String(fvState.hFine).replace(",", ".")) || NaN) - (parseFloat(String(fvState.hPart).replace(",", ".")) || NaN)) / 100;
  if (!(massa > 0) || !(hPO > 0)) { alert("Servono massa e le due altezze dell'anca."); return; }
  const regP = fvState.righe.map(r => {
    const c = parseFloat(String(r.c).replace(",", ".")) || 0, h = parseFloat(String(r.h).replace(",", "."));
    if (isNaN(h) || h <= 0) return null;
    const E = massa + c;
    return { x: Math.sqrt(9.81 * (h / 100) / 2), y: E * 9.81 * (1 + (h / 100) / hPO) };
  }).filter(Boolean);
  const reg = regP.length >= 2 ? regressione(regP) : null;
  if (!reg || reg.slope >= 0) { alert("Servono almeno 2 salti a carichi diversi."); return; }
  const F0 = reg.intercept, V0 = -F0 / reg.slope, Pmax = F0 * V0 / 4, Pkg = Pmax / massa;
  let FVimb = null, dir = null;
  const Sopt = (typeof soptFV === "function" && Pkg > 0) ? soptFV(hPO, Pkg) : null;
  if (Sopt) { const Sfvkg = reg.slope / massa; FVimb = Math.abs(Sfvkg / Sopt - 1) * 100; dir = (Sfvkg / Sopt < 1) ? "Carenza di forza" : "Carenza di velocità"; }
  if (typeof salvaSessione === "function") salvaSessione(a.id, "fv", { F0, V0, Pmax, Pkg, FVimb, dir });
  const oggi = new Date().toISOString().slice(0, 10);
  const note = `F0 ${Math.round(F0)}N · V0 ${V0.toFixed(2)} · R² ${reg.r2 != null ? reg.r2.toFixed(2) : "—"}`;
  const ok = typeof creaTest === "function" ? await creaTest(a.id, { nome: "Pmax/kg (salti)", valore: Math.round(Pkg * 10) / 10, unita: "W/kg", data: oggi, note }) : false;
  if (ok) { alert(`Salvato: Pmax/kg ${Pkg.toFixed(1)} W/kg nella scheda di ${a.nome}.`); disegna(); }
}
async function salvaTraino() {
  const a = DEMO.atleti.find(x => x.id === trainoState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const dist = parseFloat(String(trainoState.dist).replace(",", "."));
  const regP = trainoState.righe.map(r => {
    const c = parseFloat(String(r.c).replace(",", ".")), t = parseFloat(String(r.t).replace(",", "."));
    return (!isNaN(c) && dist > 0 && t > 0) ? { x: c, y: dist / t } : null;
  }).filter(Boolean);
  const reg = regP.length >= 2 ? regressione(regP) : null;
  if (!reg || reg.slope >= 0 || !(reg.intercept > 0)) { alert("Servono il tempo a 0 kg + 1-2 carichi e la distanza."); return; }
  const V0 = reg.intercept, carico50 = -V0 * 0.5 / reg.slope;
  const oggi = new Date().toISOString().slice(0, 10);
  const note = `carico ~50% calo: ${Math.round(carico50)} kg · R² ${reg.r2 != null ? reg.r2.toFixed(2) : "—"}`;
  const ok = typeof creaTest === "function" ? await creaTest(a.id, { nome: "V0 sprint (traino)", valore: Math.round(V0 * 100) / 100, unita: "m/s", data: oggi, note }) : false;
  if (ok) { alert(`Salvato: V0 ${V0.toFixed(2)} m/s (traino) nella scheda di ${a.nome}.`); disegna(); }
}
async function salvaFVSprint() {
  const a = DEMO.atleti.find(x => x.id === sprintState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const r = calcSprint();
  if (!r.ok) { alert("Serve un profilo valido (massa+altezza+2 tempi, oppure MySprint)."); return; }
  if (typeof salvaSessione === "function") salvaSessione(a.id, "fv-sprint", { F0kg: r.F0kg, V0: r.V0, Pmaxkg: r.Pkg, RFmax: r.RFmax, Sfvkg: r.Sfvkg });
  const oggi = new Date().toISOString().slice(0, 10);
  if (r.Pkg != null && typeof creaTest === "function") await creaTest(a.id, { nome: "Pmax/kg (sprint)", valore: Math.round(r.Pkg * 10) / 10, unita: "W/kg", data: oggi });
  alert(`Test F-V Sprint salvato per ${a.nome}.`); disegna();
}
