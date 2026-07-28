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
