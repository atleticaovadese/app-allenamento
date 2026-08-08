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
         <p class="et" style="margin-top:8px">La potenza orizzontale max è tipicamente intorno al 50% di calo di Vmax. R² vicino a 1 = stima affidabile.</p>`
      : `<p class="et" style="margin-top:8px">Servono almeno il tempo senza traino (0 kg) + 1-2 carichi, la distanza e (per il %BM) il peso.</p>`}
  </div>`;
}

// 4) PROFILO FORZA-VELOCITÀ (salti) — Morin-Samozino.
let fvState = { atletaRif: "", massa: "", hFine: "", hPart: "", righe: [{ cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }, { cond: "", c: "", h: "" }] };

function setFvAtleta(id) {
  fvState.atletaRif = id;
  const a = DEMO.atleti.find(x => x.id === id);
  if (a && a.scheda && a.scheda.anagrafica && a.scheda.anagrafica.peso) fvState.massa = String(a.scheda.anagrafica.peso);
  disegna();
}
function setFvVal(campo, val) { fvState[campo] = val; }
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

  <div class="card">
    <div class="griglia2">
      <div><label class="lab">Atleta (prende il peso)</label>
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
    <p class="et" style="margin-top:8px">hPO (distanza di spinta): <b style="color:var(--txt)">${hPO != null ? hPO.toFixed(2) + " m" : "—"}</b> · misura al grande trocantere (anca), da terra. Tipico 0.30-0.40 m.</p>
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
  </div>` : `<div class="card"><p class="et">Inserisci massa, le due altezze dell'anca e almeno 2 salti a carichi diversi.</p></div>`}`;
}
