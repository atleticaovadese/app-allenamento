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
