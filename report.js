// Report completo dell'atleta, stampabile → PDF (Stampa del browser → Salva come PDF). Nessuna libreria.

function apriReport(id) { S.report = id; disegna(); window.scrollTo(0, 0); }
function chiudiReport() { S.report = null; disegna(); window.scrollTo(0, 0); }

const _REPORT_CSS = `
#app-report{background:#fff;color:#1a1f2b;max-width:840px;margin:0 auto;padding:26px 30px;font-family:Calibri,'Segoe UI',Arial,sans-serif;line-height:1.5;box-shadow:0 2px 14px rgba(0,0,0,.18);border-radius:8px}
#app-report h1{font-size:25px;margin:0 0 2px;color:#2B4C7E}
#app-report h2{font-size:15px;margin:22px 0 8px;color:#2B4C7E;border-bottom:2px solid #2B4C7E;padding-bottom:3px;text-transform:uppercase;letter-spacing:.02em}
#app-report .sub{color:#5a6472;font-size:13px;margin:0 0 3px}
#app-report table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px}
#app-report th{background:#2B4C7E;color:#fff;text-align:left;padding:6px 8px;font-weight:600}
#app-report td{border:1px solid #d7dde7;padding:5px 8px;vertical-align:top}
#app-report tr:nth-child(even) td{background:#f5f8fc}
#app-report .kpi{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
#app-report .kpi .box{flex:1;min-width:110px;border:1px solid #d7dde7;border-radius:6px;padding:8px 11px;text-align:center}
#app-report .kpi .k{font-size:10.5px;color:#5a6472;text-transform:uppercase;letter-spacing:.03em}
#app-report .kpi .v{font-size:22px;font-weight:700;margin-top:2px}
#app-report .g{color:#1a7a3a}
#app-report .y{color:#a86800}
#app-report .r{color:#b02a37}
#app-report .note{font-size:12.5px;color:#333;background:#f5f8fc;border-left:3px solid #2B4C7E;padding:6px 10px;margin-top:6px;border-radius:0 4px 4px 0}
#app-report .muted{color:#8a94a3}
#app-report .two{display:flex;gap:22px;flex-wrap:wrap}
#app-report .two>div{flex:1;min-width:280px}
#app-report .foot{margin-top:26px;padding-top:8px;border-top:1px solid #d7dde7;font-size:11px;color:#8a94a3;text-align:center}
@media print{
  body *{visibility:hidden!important}
  #app-report,#app-report *{visibility:visible!important}
  #app-report{position:absolute;left:0;top:0;width:100%;max-width:none;box-shadow:none;border-radius:0;padding:0}
  .no-print{display:none!important}
  h2{page-break-after:avoid}
  tr{page-break-inside:avoid}
  @page{margin:13mm}
}
`;

function _rClsPront(v) { v = parseFloat(v); return isNaN(v) ? "" : (v >= 3.5 ? "g" : v >= 2.5 ? "y" : "r"); }
function _rClsAcwr(v) { v = parseFloat(v); return isNaN(v) ? "" : (v >= 0.8 && v <= 1.3 ? "g" : (v > 1.3 && v <= 1.5 ? "y" : "r")); }
function _rClsAder(v) { return v >= 85 ? "g" : v >= 70 ? "y" : "r"; }
function _rDataL(v) { return typeof fmtDataAnno === "function" ? fmtDataAnno(v) : v; }

// mini grafico a barre SVG (prontezza ultimi giorni)
function _svgBars(punti) {
  if (!punti.length) return "";
  const W = 460, H = 90, pad = 18, bw = Math.min(46, (W - pad * 2) / punti.length - 6);
  const max = 5;
  const barre = punti.map((p, i) => {
    const x = pad + i * ((W - pad * 2) / punti.length) + 3;
    const h = Math.max(2, (p.v / max) * (H - 30));
    const col = p.v >= 3.5 ? "#2f9e52" : p.v >= 2.5 ? "#d99a00" : "#c0392b";
    return `<rect x="${x.toFixed(0)}" y="${(H - 18 - h).toFixed(0)}" width="${bw.toFixed(0)}" height="${h.toFixed(0)}" fill="${col}" rx="2"/>
      <text x="${(x + bw / 2).toFixed(0)}" y="${(H - 18 - h - 3).toFixed(0)}" font-size="9" fill="#555" text-anchor="middle">${p.v}</text>
      <text x="${(x + bw / 2).toFixed(0)}" y="${H - 5}" font-size="8" fill="#8a94a3" text-anchor="middle">${p.lab}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;margin-top:6px">${barre}</svg>`;
}

function _reportBodyHTML(id) {
  const a = DEMO.atleti.find(x => x.id === id);
  if (!a) return "<p>Atleta non trovato.</p>";
  const an = (a.scheda && a.scheda.anagrafica) || {};
  const m = (DEMO.mon || {})[id] || {};
  const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const ps = a.presenzeStagione || [0, 0], pm = a.presenzeMese || [0, 0];
  const ader = m.aderenza != null ? m.aderenza : (ps[1] ? Math.round(ps[0] / ps[1] * 100) : 0);

  // --- intestazione ---
  let h = `<h1>${a.nome}</h1>
    <p class="sub"><b>${a.disciplina || ""}</b>${a.specialita ? " · " + a.specialita : ""}${an.categoria ? " · " + an.categoria : ""}</p>
    <p class="sub muted">Report generato il ${oggi} · Metis Performance</p>`;

  // --- anagrafica ---
  const anag = [an.nascita ? "Nascita " + an.nascita : "", an.altezza ? "Altezza " + an.altezza + " cm" : "", an.peso ? "Peso " + an.peso + " kg" : "", an.gambaStacco ? "Gamba di stacco " + an.gambaStacco : ""].filter(Boolean).join(" · ");
  if (anag) h += `<p class="sub" style="margin-top:8px">${anag}</p>`;

  // --- stato attuale ---
  h += `<h2>Stato attuale</h2><div class="kpi">
    <div class="box"><div class="k">Prontezza</div><div class="v ${_rClsPront(m.prontezza)}">${m.prontezza || "—"}</div></div>
    <div class="box"><div class="k">ACWR</div><div class="v ${_rClsAcwr(m.acwr)}">${m.acwr || "—"}</div></div>
    <div class="box"><div class="k">Forma (TSB)</div><div class="v">${m.forma || "—"}</div></div>
    <div class="box"><div class="k">Aderenza</div><div class="v ${_rClsAder(ader)}">${ader}%</div></div>
  </div>`;

  // --- PB (gara + allenamento) ---
  const pb = (a.scheda && a.scheda.pb) || [];
  const rankd = t => (typeof rankDist === "function" ? rankDist(t) : 0);
  const pbRow = p => `<tr><td>${p[0]}</td><td><b>${p[1]}</b></td><td>${p[2] || ""}</td></tr>`;
  const gara = pb.filter(p => (p[7] || "gara") === "gara").sort((x, y) => rankd(x[0]) - rankd(y[0]));
  const allen = pb.filter(p => p[7] === "allenamento").sort((x, y) => rankd(x[0]) - rankd(y[0]));
  h += `<h2>Personali (PB)</h2><div class="two">
    <div><p class="sub"><b>🏆 In gara</b></p>${gara.length ? `<table><tr><th>Distanza</th><th>Tempo</th><th>Data</th></tr>${gara.map(pbRow).join("")}</table>` : `<p class="muted">Nessun PB in gara.</p>`}</div>
    <div><p class="sub"><b>🏋 In allenamento</b></p>${allen.length ? `<table><tr><th>Distanza</th><th>Tempo</th><th>Data</th></tr>${allen.map(pbRow).join("")}</table>` : `<p class="muted">Nessun PB in allenamento.</p>`}</div>
  </div>`;

  // --- massimali + test/salti ---
  const mx = (a.scheda && a.scheda.massimali) || [];
  const salti = (a.scheda && a.scheda.salti) || [];
  h += `<div class="two">
    <div><h2>Massimali di forza</h2>${mx.length ? `<table><tr><th>Esercizio</th><th>Kg</th><th>Data</th></tr>${mx.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}</b></td><td>${x[2] || ""}</td></tr>`).join("")}</table>` : `<p class="muted">Nessun massimale.</p>`}</div>
    <div><h2>Test e salti</h2>${salti.length ? `<table><tr><th>Test</th><th>Valore</th><th>Data</th></tr>${salti.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}${x[2] ? " " + x[2] : ""}</b></td><td>${x[3] || ""}</td></tr>`).join("")}</table>` : `<p class="muted">Nessun test registrato.</p>`}</div>
  </div>`;

  // --- presenze ---
  h += `<h2>Presenze</h2><div class="kpi">
    <div class="box"><div class="k">Questo mese</div><div class="v">${pm[0]}/${pm[1]}</div></div>
    <div class="box"><div class="k">Stagione</div><div class="v">${ps[0]}/${ps[1]}</div></div>
    <div class="box"><div class="k">Aderenza</div><div class="v ${_rClsAder(ader)}">${ader}%</div></div>
  </div>`;

  // --- salute: diario recente + grafico + infortuni ---
  const storia = ((DEMO.diariStorico || {})[id] || []).slice().sort((x, y) => x.data < y.data ? 1 : -1);
  h += `<h2>Stato di salute</h2>`;
  if (storia.length) {
    const ult = storia[0];
    h += `<p class="sub">Ultimo diario (${_rDataL(ult.data)}): prontezza <b class="${_rClsPront(ult.prontezza)}">${ult.prontezza != null ? ult.prontezza : "—"}</b> · sonno ${ult.oreSonno != null ? ult.oreSonno + " h" : "—"} · qualità ${ult.sonno_qualita ?? "—"}/5 · stress ${ult.stress ?? "—"}/5 · dolori ${ult.dolori ?? "—"}/5 · energia ${ult.energia ?? "—"}/5</p>`;
    if (ult.note) h += `<p class="note">"${ult.note}"</p>`;
    const bars = storia.slice(0, 8).reverse().map(v => ({ v: v.prontezza != null ? Math.round(v.prontezza * 10) / 10 : 0, lab: (v.data || "").slice(8, 10) + "/" + (v.data || "").slice(5, 7) }));
    if (bars.length) h += `<p class="sub" style="margin-top:8px"><b>Prontezza — ultimi giorni</b></p>${_svgBars(bars)}`;
  } else h += `<p class="muted">Nessun diario registrato.</p>`;
  const inf = (DEMO.infortuni || []).filter(i => (i.atleta === id) && i.stato !== "Risolto");
  if (inf.length) h += `<p class="sub" style="margin-top:8px"><b class="r">Infortuni/fastidi in corso</b></p><table><tr><th>Zona</th><th>Tipo</th><th>Stato</th><th>Dal</th></tr>${inf.map(i => `<tr><td>${i.zona}${i.lato ? " " + i.lato : ""}</td><td>${i.tipo || ""}</td><td>${i.stato || "Attivo"}</td><td>${_rDataL(i.dataInizio || i.dal || "")}</td></tr>`).join("")}</table>`;

  // --- allenamenti svolti ---
  const svolte = ((DEMO.seduteSvolte || {})[id] || []).slice().sort((x, y) => x.data < y.data ? 1 : -1).slice(0, 12);
  h += `<h2>Allenamenti svolti (recenti)</h2>`;
  if (svolte.length) {
    h += `<table><tr><th>Data</th><th>Tipo</th><th>Durata · RPE</th><th>Contenuto svolto</th></tr>${svolte.map(sv => {
      const d = sv.dati || {};
      const cont = sv.tipo === "pista"
        ? (d.elementi || []).map(e => { const f = (e.tempi || []).filter(v => v != null); return `${e.ripetute}×${e.distanza}m${f.length ? " (" + f.map(t => Number(t).toFixed(2)).join(", ") + ")" : ""}`; }).join(" · ")
        : (d.esercizi || []).map(x => { const f = (x.vbt || []).filter(v => v != null); const vm = f.length ? (f.reduce((s, v) => s + v, 0) / f.length).toFixed(2) : null; return `${x.nome} ${x.serie || "?"}×${x.rep || "?"}${x.peso ? "@" + x.peso + "kg" : ""}${vm ? " VBT " + vm : ""}`; }).join(" · ");
      return `<tr><td>${_rDataL(sv.data)}</td><td>${sv.tipo === "pista" ? "Pista" : "Palestra"}${sv.fastidi ? ' <span class="r">⚠</span>' : ""}</td><td>${sv.durata_min ? sv.durata_min + "′" : "—"}${sv.rpe ? " · RPE " + sv.rpe : ""}</td><td>${cont || "—"}</td></tr>`;
    }).join("")}</table>`;
  } else h += `<p class="muted">Nessun allenamento chiuso ancora dall'atleta.</p>`;

  h += `<div class="foot">Metis Performance · «Chi non pianifica è destinato a fallire.»</div>`;
  return h;
}

function vistaReportAtleta() {
  const a = DEMO.atleti.find(x => x.id === S.report);
  if (!a) { S.report = null; return typeof vistaAtletaDettaglio === "function" ? vistaAtletaDettaglio() : ""; }
  return `<style>${_REPORT_CSS}</style>
    <div class="no-print" style="display:flex;gap:8px;margin-bottom:14px">
      <button class="btn btn-2" style="width:auto;padding:9px 14px" onclick="chiudiReport()">‹ Indietro</button>
      <button class="btn" style="width:auto;padding:9px 16px" onclick="window.print()">🖨 Stampa / Salva PDF</button>
    </div>
    <p class="no-print et" style="margin-bottom:12px">Anteprima del report. Premi <b>Stampa</b> e scegli <b>«Salva come PDF»</b> come stampante.</p>
    <div id="app-report">${_reportBodyHTML(a.id)}</div>`;
}

// per validazione/uso esterno: documento HTML autonomo
function _reportStandalone(id) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report ${(DEMO.atleti.find(x => x.id === id) || {}).nome || ""}</title><style>body{margin:0;background:#e9edf2;padding:16px}${_REPORT_CSS}</style></head><body><div id="app-report">${_reportBodyHTML(id)}</div></body></html>`;
}
