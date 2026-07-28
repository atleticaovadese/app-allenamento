// Programma PISTA — editor delle sedute in pista (fedele al foglio Excel).
// Mesociclo → 4 giorni → 4 settimane. Il coach scrive contenuto/distanza/n°/rec/%vel;
// il TEMPO richiesto e la m/s escono da soli dal PB e dal coefficiente della distanza.
// Tempo = PB × coeff(distanza) / (%vel/100)   ·   m/s = distanza / tempo
// Volume seduta = somma(distanza × n°).

const PISTA_PROFILI = ["100m M", "100m F", "100m F Master", "200m M", "200m F", "400m"];
const PISTA_COEFF = {
  "100m M": { 20: 0.295, 30: 0.3987, 40: 0.4868, 50: 0.5727, 60: 0.6565, 70: 0.7405, 80: 0.8255, 90: 0.9117, 100: 1.0, 120: 1.1689, 150: 1.4252 },
  "100m F": { 20: 0.2816, 30: 0.3805, 40: 0.4688, 50: 0.5563, 60: 0.6419, 70: 0.7293, 80: 0.8186, 90: 0.9088, 100: 1.0, 120: 1.224, 150: 1.56, 180: 1.896, 200: 2.12, 220: 2.2838, 250: 2.592, 300: 3.1057 },
  "100m F Master": { 20: 0.2654, 30: 0.3587, 40: 0.4478, 50: 0.5365, 60: 0.6253, 70: 0.7156, 80: 0.8067, 90: 0.8997, 100: 1.0, 120: 1.1747, 150: 1.4479 },
  "200m M": { 20: 0.149, 30: 0.2013, 40: 0.2471, 50: 0.2913, 60: 0.3364, 70: 0.381, 80: 0.4262, 90: 0.4719, 100: 0.5176, 120: 0.6111, 150: 0.7513, 180: 0.9005, 200: 1.0 },
  "200m F": { 20: 0.1448, 30: 0.1957, 40: 0.2402, 50: 0.2832, 60: 0.3286, 70: 0.3734, 80: 0.4188, 90: 0.4648, 100: 0.5107, 120: 0.6053, 150: 0.7471, 180: 0.8988, 200: 1.0 },
  "400m": { 50: 0.1403, 100: 0.2508, 150: 0.3642, 200: 0.4816, 250: 0.6021, 300: 0.7261, 350: 0.8574, 400: 1.0 }
};

function rigaVuota() { return { contenuto: "", distanza: "", n: "", rec: "", perc: "" }; }
function settVuota() { return { righe: [rigaVuota()] }; }
function giornoVuoto() { return { giornoSett: "", riscaldamento: "", settimane: [settVuota(), settVuota(), settVuota(), settVuota()] }; }
function mesoVuoto() { return { blocco: "", inizio: "", focus: "", giorni: [giornoVuoto(), giornoVuoto(), giornoVuoto(), giornoVuoto()] }; }

function pistaInit() {
  if (!DEMO.pista || !DEMO.pista.mesocicli) DEMO.pista = { profilo: "", pbManuale: "", atletaRif: "", mesocicli: [mesoVuoto()] };
  return DEMO.pista;
}
function savePista() { if (typeof salvaCustom === "function") salvaCustom(); }

// PB di riferimento: dall'atleta scelto (in base al profilo) oppure scritto a mano.
function pistaPB() {
  const p = pistaInit();
  if (p.atletaRif) {
    const a = DEMO.atleti.find(x => x.id === p.atletaRif);
    if (a && a.scheda) {
      const md = p.profilo.indexOf("400") === 0 ? "400 m" : p.profilo.indexOf("200") === 0 ? "200 m" : "100 m";
      const row = (a.scheda.pb || []).find(r => r[0] === md);
      if (row && row[1]) return parseFloat(String(row[1]).replace(",", "."));
    }
  }
  const v = parseFloat(String(p.pbManuale).replace(",", "."));
  return isNaN(v) ? null : v;
}

function pistaTempo(distanza, perc) {
  const p = pistaInit(), pb = pistaPB();
  if (!p.profilo || !pb || !distanza || !perc) return null;
  const co = PISTA_COEFF[p.profilo]; if (!co) return null;
  const coeff = co[Number(distanza)]; if (coeff == null) return null;
  return pb * coeff / (Number(perc) / 100);
}
function volumeSett(sett) {
  return (sett.righe || []).reduce((t, r) => t + (Number(r.distanza) || 0) * (Number(r.n) || 0), 0);
}

// ---------- handlers ----------
function setPistaTop(campo, val) {
  const p = pistaInit(); p[campo] = val;
  if (campo === "atletaRif" && val) p.pbManuale = "";
  savePista(); disegna();
}
function setPistaMeso(campo, val) { pistaInit().mesocicli[S.pistaMeso][campo] = val; savePista(); disegna(); }
function setPistaGiorno(campo, val) { pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno][campo] = val; savePista(); disegna(); }
function setPistaRiga(s, i, campo, val) { pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno].settimane[s].righe[i][campo] = val; savePista(); disegna(); }
function pistaAddRiga(s) { pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno].settimane[s].righe.push(rigaVuota()); savePista(); disegna(); }
function pistaDelRiga(s, i) { const r = pistaInit().mesocicli[S.pistaMeso].giorni[S.pistaGiorno].settimane[s].righe; if (r.length > 1) r.splice(i, 1); savePista(); disegna(); }
function pistaAddMeso() { pistaInit().mesocicli.push(mesoVuoto()); S.pistaMeso = pistaInit().mesocicli.length - 1; S.pistaGiorno = 0; savePista(); disegna(); window.scrollTo(0, 0); }
function selMeso(i) { S.pistaMeso = i; S.pistaGiorno = 0; disegna(); window.scrollTo(0, 0); }
function selGiorno(i) { S.pistaGiorno = i; disegna(); window.scrollTo(0, 0); }

// ---------- vista ----------
function vistaProgrammaPista() {
  const p = pistaInit();
  if (S.pistaMeso >= p.mesocicli.length) S.pistaMeso = 0;
  const m = p.mesocicli[S.pistaMeso];
  const g = m.giorni[S.pistaGiorno];
  const pb = pistaPB();
  const distOpt = p.profilo ? Object.keys(PISTA_COEFF[p.profilo]).map(Number).sort((a, b) => a - b) : [];
  const routineOpt = Object.keys(DEMO.schede || {});
  const optSel = (val, arr, mostraVuoto) => `${mostraVuoto ? '<option value="">—</option>' : ""}${arr.map(x => `<option value="${String(x).replace(/"/g, "&quot;")}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`).join("")}`;

  // header profilo + PB
  const testa = `
    <div class="card"><h3>Programma Pista</h3>
      <p class="et" style="margin-top:2px">Scrivi contenuto, distanza, n°, recupero e % velocità: il <b>tempo richiesto</b> e la <b>m/s</b> escono da soli dal PB. Il volume è automatico.</p></div>
    <div class="card">
      <div class="griglia2">
        <div><label class="lab">Profilo velocità</label>
          <select onchange="setPistaTop('profilo',this.value)" style="margin-top:6px">
            <option value="">—</option>${optSel(p.profilo, PISTA_PROFILI, false)}</select></div>
        <div><label class="lab">Atleta di riferimento</label>
          <select onchange="setPistaTop('atletaRif',this.value)" style="margin-top:6px">
            <option value="">— (PB a mano)</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${p.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select></div>
      </div>
      <div style="margin-top:10px">
        <label class="lab">PB di riferimento (s) ${p.atletaRif ? "<span style='color:var(--txt3)'>(dall'atleta)</span>" : ""}</label>
        <input inputmode="decimal" value="${p.atletaRif ? (pb != null ? pb : "") : (p.pbManuale || "")}" ${p.atletaRif ? "disabled" : ""}
          placeholder="es. 10.90" oninput="setPistaTop('pbManuale',this.value)" style="margin-top:6px">
      </div>
      <p class="et" style="margin-top:8px">${p.profilo ? (pb != null ? `Tempi target calcolati sul PB ${pb} s.` : "Manca il PB: scrivilo o scegli un atleta.") : "Scegli il profilo velocità per calcolare i tempi."}</p>
    </div>`;

  // selettore mesociclo
  const tabMeso = `<div class="tabbar">${p.mesocicli.map((_, i) =>
    `<button class="${i === S.pistaMeso ? "on" : ""}" onclick="selMeso(${i})">Meso ${i + 1}</button>`).join("")}
    <button onclick="pistaAddMeso()">＋</button></div>`;

  const testaMeso = `<div class="card">
      <div class="griglia2">
        <div><label class="lab">Blocco</label>
          <select onchange="setPistaMeso('blocco',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.blocco, (typeof BLOCCHI !== "undefined" ? BLOCCHI : []), false)}</select></div>
        <div><label class="lab">Inizio Sett. 1</label>
          <input type="date" value="${m.inizio || ""}" onchange="setPistaMeso('inizio',this.value)" style="margin-top:6px"></div>
      </div>
      <label class="lab" style="display:block;margin-top:10px">Focus mesociclo</label>
      <input value="${(m.focus || "").replace(/"/g, "&quot;")}" placeholder="Es. accelerazione e forza" oninput="setPistaMeso('focus',this.value)" style="margin-top:6px">
    </div>`;

  // selettore giorno
  const tabGiorno = `<div class="tabbar">${m.giorni.map((_, i) =>
    `<button class="${i === S.pistaGiorno ? "on" : ""}" onclick="selGiorno(${i})">Giorno ${i + 1}</button>`).join("")}</div>`;

  const testaGiorno = `<div class="card">
      <div class="griglia2">
        <div><label class="lab">Giorno della settimana</label>
          <select onchange="setPistaGiorno('giornoSett',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(g.giornoSett, ["lun", "mar", "mer", "gio", "ven", "sab", "dom"], false)}</select></div>
        <div><label class="lab">Riscaldamento</label>
          <select onchange="setPistaGiorno('riscaldamento',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(g.riscaldamento, routineOpt, false)}</select></div>
      </div>
    </div>`;

  // le 4 settimane del giorno
  const settimane = g.settimane.map((sett, s) => {
    const righe = sett.righe.map((r, i) => {
      const t = pistaTempo(r.distanza, r.perc);
      const ms = t && r.distanza ? (Number(r.distanza) / t) : null;
      return `<tr>
        <td><input value="${(r.contenuto || "").replace(/"/g, "&quot;")}" placeholder="lavoro" oninput="setPistaRiga(${s},${i},'contenuto',this.value)" style="min-width:120px"></td>
        <td><select onchange="setPistaRiga(${s},${i},'distanza',this.value)"><option value="">—</option>${optSel(r.distanza, distOpt, false)}</select></td>
        <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setPistaRiga(${s},${i},'n',this.value)" style="min-width:52px"></td>
        <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setPistaRiga(${s},${i},'rec',this.value)" style="min-width:66px"></td>
        <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setPistaRiga(${s},${i},'perc',this.value)" style="min-width:52px"></td>
        <td class="pauto">${t != null ? t.toFixed(2) : "—"}</td>
        <td class="pauto">${ms != null ? ms.toFixed(2) : "—"}</td>
        <td><button class="chiudi" style="font-size:14px" onclick="pistaDelRiga(${s},${i})" aria-label="Rimuovi">✕</button></td>
      </tr>`;
    }).join("");
    return `<div class="card">
      <p style="font-weight:600;font-size:13px;margin-bottom:8px">Settimana ${s + 1}</p>
      <div class="p-scroll"><table class="ptab pista-w">
        <thead><tr><th>Contenuto</th><th>Distanza</th><th>n°</th><th>Rec</th><th>% vel</th><th>Tempo (s)</th><th>m/s</th><th></th></tr></thead>
        <tbody>${righe}</tbody>
      </table></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="pistaAddRiga(${s})">＋ riga</button>
        <span class="et">Volume: <b style="color:var(--verde);font-size:14px">${volumeSett(sett).toLocaleString("it-IT")} m</b></span>
      </div>
    </div>`;
  }).join("");

  return testa + tabMeso + testaMeso + tabGiorno + testaGiorno + settimane;
}
