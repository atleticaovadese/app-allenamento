// Piano & Picco (periodizzazione, Bompa/Buzzichelli) — fedele al foglio Excel.
// Il coach compila Fase, Blocco forza, Sist. energetico e il Ciclo carico+scarico;
// Intensità, Volume, Gara, →gara A, Scarico e Peaking sono automatici.

const FASI = ["Prep. generale", "Prep. speciale", "Pre-competitiva", "Competitiva", "Transizione"];
const BLOCCHI = ["AA (Adatt. Anatomico)", "Mx-S (Forza Max)", "Conv. a Potenza", "Mant. P+MxS", "Competitivo"];
const SIST_EN = ["O2 power (aerob.)", "Capacita lattacida", "Potenza alattacida", "Potenza lattacida"];
const CICLI = ["4+1", "3+1", "2+1", "1+1", "1"];
const INT_BLOCCO = { "AA (Adatt. Anatomico)": 2, "Mx-S (Forza Max)": 4, "Conv. a Potenza": 4, "Mant. P+MxS": 5, "Competitivo": 5 };
const AD_CICLO = { "1": 1, "1+1": 2, "2+1": 3, "3+1": 4, "4+1": 5 };
const OPZ_SETT = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52];
const WEEK_MS = 7 * 86400000;

function dnum(iso) { if (!iso) return null; const d = new Date(iso + "T00:00:00"); return isNaN(d) ? null : d.getTime(); }

function pianoDati() {
  if (!DEMO.piano || !DEMO.piano.righe) DEMO.piano = { inizio: "", nSettimane: 24, righe: [] };
  const p = DEMO.piano;
  while (p.righe.length < p.nSettimane) p.righe.push({ fase: "", blocco: "", sist: "", ciclo: "" });
  return p;
}

// Calcola le colonne automatiche per ogni settimana (formule del foglio Excel).
function calcolaPiano() {
  const p = pianoDati();
  const gare = (DEMO.gareRaw || []).map(g => ({ t: dnum(g.data), ob: g.obiettivo, nome: g.gara }))
    .filter(g => g.t != null).sort((a, b) => a.t - b.t);
  const gareA = gare.filter(g => g.ob === "A");
  const start = p.inizio ? dnum(p.inizio) : null;
  const out = [];
  let ad = 4, ae = -1;   // helper ciclo: lunghezza e posizione (carry come nell'Excel)
  for (let i = 0; i < p.nSettimane; i++) {
    const inp = p.righe[i] || { fase: "", blocco: "", sist: "", ciclo: "" };
    if (inp.ciclo) { ad = AD_CICLO[inp.ciclo] || 4; ae = 0; }
    else { ae = ((ae + 1) % ad + ad) % ad; }

    const t0 = start != null ? start + i * WEEK_MS : null;
    let gara = "", aA = null, scar = "", intv = "", vol = "", peak = "";
    if (t0 != null) {
      const g = gare.find(x => x.t >= t0 && x.t <= t0 + 6 * 86400000);
      if (g) gara = g.nome + " (" + g.ob + ")";
      const ga = gareA.find(x => x.t >= t0);
      if (ga) aA = Math.floor((ga.t - t0) / WEEK_MS);

      scar = (aA === 0) ? "GARA" : (ae === ad - 1 ? "SCARICO" : "carico");

      if (scar === "GARA") intv = 5;
      else if (inp.blocco) intv = INT_BLOCCO[inp.blocco];
      else if (aA != null) intv = Math.max(2, Math.min(5, Math.round(5 - aA / 4)));
      else intv = 2;

      if (aA != null) {
        const base = Math.min(5, Math.round(1 + aA / 3));
        vol = scar === "GARA" ? 1 : scar === "SCARICO" ? Math.max(1, base - 2) : Math.max(1, base);
        peak = Math.min(5, aA + 1);
      }
    }
    const d = t0 != null ? new Date(t0) : null;
    out.push({ inizio: d ? d.getDate() + "/" + (d.getMonth() + 1) : "", intensita: intv, volume: vol, gara, aA, scarico: scar, peaking: peak });
  }
  return out;
}

function prossimaGaraA() {
  const now = Date.now();
  const gA = (DEMO.gareRaw || []).map(g => ({ t: dnum(g.data), ob: g.obiettivo }))
    .filter(g => g.ob === "A" && g.t != null && g.t >= now).sort((a, b) => a.t - b.t)[0];
  if (!gA) return null;
  return { data: new Date(gA.t).toLocaleDateString("it-IT"), tra: Math.ceil((gA.t - now) / WEEK_MS) };
}

// ---------- vista ----------
function vistaPiano() {
  const p = pianoDati();
  const rows = calcolaPiano();
  const gaA = prossimaGaraA();
  const opt = (arr, val) => `<option value=""></option>` + arr.map(x => `<option ${x === val ? "selected" : ""}>${x}</option>`).join("");
  const colScar = s => s === "GARA" ? "var(--rosso)" : s === "SCARICO" ? "var(--giallo)" : "var(--txt3)";

  const corpo = rows.map((r, i) => {
    const inp = p.righe[i];
    return `<tr>
      <td>${i + 1}</td>
      <td class="pdata">${r.inizio || "—"}</td>
      <td><select onchange="setPianoCella(${i},'fase',this.value)">${opt(FASI, inp.fase)}</select></td>
      <td><select onchange="setPianoCella(${i},'blocco',this.value)">${opt(BLOCCHI, inp.blocco)}</select></td>
      <td><select onchange="setPianoCella(${i},'sist',this.value)">${opt(SIST_EN, inp.sist)}</select></td>
      <td class="pauto">${r.intensita === "" ? "—" : r.intensita}</td>
      <td class="pauto">${r.volume === "" ? "—" : r.volume}</td>
      <td class="pgara">${r.gara || ""}</td>
      <td class="pauto">${r.aA == null ? "" : r.aA}</td>
      <td style="color:${colScar(r.scarico)};font-weight:600">${r.scarico || ""}</td>
      <td><select onchange="setPianoCella(${i},'ciclo',this.value)">${opt(CICLI, inp.ciclo)}</select></td>
      <td class="pauto">${r.peaking === "" ? "" : r.peaking}</td>
    </tr>`;
  }).join("");

  return `
  <div class="card"><h3>Piano & Picco</h3>
    <p class="et" style="margin-top:2px">Piano annuale della stagione (Bompa). Tu compili <b>Fase</b>, <b>Blocco forza</b>, <b>Sist. energetico</b> e il <b>Ciclo</b>; Intensità, Volume, Gara, Scarico e Peaking escono da soli.</p></div>
  <div class="card">
    <div class="griglia2">
      <div><label class="lab">Inizio settimana 1</label>
        <input type="date" value="${p.inizio || ""}" onchange="setPianoInizio(this.value)" style="margin-top:6px"></div>
      <div><label class="lab">Settimane</label>
        <select onchange="setPianoNsett(+this.value)" style="margin-top:6px">
          ${OPZ_SETT.map(n => `<option value="${n}" ${p.nSettimane === n ? "selected" : ""}>${n} settimane</option>`).join("")}
        </select></div>
    </div>
    ${gaA ? `<p class="et" style="margin-top:10px">Prossima gara A: <b>${gaA.data}</b> · tra ${gaA.tra} settimane</p>`
          : `<p class="et" style="margin-top:10px">Nessuna gara «A» futura nel calendario gare.</p>`}
  </div>
  <div class="p-scroll">
    <table class="piano">
      <thead><tr>
        <th>Sett</th><th>Inizio</th><th>Fase</th><th>Blocco forza</th><th>Sist. energ.</th>
        <th>Int</th><th>Vol</th><th>Gara</th><th>→A</th><th>Scarico</th><th>Ciclo</th><th>Peak</th>
      </tr></thead>
      <tbody>${corpo}</tbody>
    </table>
  </div>
  <p class="et" style="margin-top:10px"><span style="color:var(--verde)">Verde</span> = automatico (Int/Vol/Peaking 1-5). Lo <b>Scarico</b> esce dal Ciclo (ultima settimana di ogni ciclo). <b>Gara</b> e <b>→A</b> dal Calendario gare. Il Ciclo lo imposti a inizio blocco e vale finché non lo cambi.</p>`;
}

function setPianoInizio(v) { pianoDati().inizio = v; if (typeof savePiano === "function") savePiano(); disegna(); }
function setPianoNsett(n) {
  const p = pianoDati();
  p.nSettimane = Math.max(4, Math.min(52, n));
  while (p.righe.length < p.nSettimane) p.righe.push({ fase: "", blocco: "", sist: "", ciclo: "" });
  if (typeof savePiano === "function") savePiano(); disegna();
}
function setPianoCella(i, campo, v) { pianoDati().righe[i][campo] = v; if (typeof savePiano === "function") savePiano(); disegna(); }
