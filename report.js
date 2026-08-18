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

// un evento è un salto (misura in metri) anche se l'atleta è "velocità"
function _rEvSalto(ev) { return (typeof EV_SALTI !== "undefined" && EV_SALTI.includes(ev)) || /salto|lungo|triplo|asta/i.test(ev || ""); }
// formato risultato per disciplina: velocità "10.96s" / oltre il minuto 1'00"00 · mezzo/fondo min o ore:min:sec.cent · lanci/salti metri
function _rFmtMis(disc, raw, evento) {
  if (raw == null || raw === "") return "";
  const metri = disc === "lanci" || _rEvSalto(evento);
  const n = (typeof parseMisura === "function") ? parseMisura(metri ? "lanci" : disc, raw) : parseFloat(String(raw).replace(",", "."));
  if (n == null || isNaN(n)) return String(raw);
  if (metri) return n.toFixed(2) + " m";
  if (disc === "mezzofondo" || disc === "fondo") {
    const h = Math.floor(n / 3600), rem = n - h * 3600, mm = Math.floor(rem / 60), ss = rem - mm * 60;
    const sw = Math.floor(ss + 1e-6), cc = Math.round((ss - sw) * 100);
    const cs = cc > 0 ? "." + String(cc).padStart(2, "0") : "";
    return (h > 0 ? h + ":" + String(mm).padStart(2, "0") : String(mm)) + ":" + String(sw).padStart(2, "0") + cs;
  }
  // velocità (e default): secondi sotto il minuto, M'SS"cc oltre (es. 400 m)
  if (n < 60) return (Math.round(n * 100) / 100).toFixed(2) + "s";
  const mm = Math.floor(n / 60), ss = n - mm * 60, sw = Math.floor(ss + 1e-6), sc = Math.round((ss - sw) * 100);
  return mm + "'" + String(sw).padStart(2, "0") + "\"" + String(sc).padStart(2, "0");
}

// programma per mesociclo (Pista/Campo + Palestra del gruppo dell'atleta): settimana-tipo per giorno
function _rProgrammaMesocicli(a) {
  const g = (typeof gruppoDi === "function") ? gruppoDi(a) : "vel";
  const pista = (typeof pistaDi === "function") ? pistaDi(g) : (DEMO.pista || null);
  const pal = (typeof palDi === "function") ? palDi(g) : (DEMO.palestra || null);
  const rigaPista = r => {
    if (g === "lanci") return `${r.mezzo || r.contenuto || ""}${r.kg ? " " + r.kg + "kg" : ""}${r.n ? " ×" + r.n : ""}${r.tipo ? " (" + r.tipo + ")" : ""}${r.rec ? " rec " + r.rec : ""}`.trim();
    if (g === "mezzo") return `${r.mezzo || r.contenuto || ""}${(r.distanza && r.n) ? " " + r.n + "×" + r.distanza + "m" : ""}${r.min ? " " + r.min + "′" : ""}${r.rec ? " rec " + r.rec : ""}`.trim();
    return `${r.contenuto || ""}${(r.distanza && r.n) ? " " + r.n + "×" + r.distanza + "m" : ""}${r.perc ? " @" + r.perc + "%" : ""}${r.rec ? " rec " + r.rec : ""}`.trim();
  };
  const rigaPal = r => `${r.esercizio || ""}${(r.serie && r.rep) ? " " + r.serie + "×" + r.rep : ""}${r.perc ? " @" + r.perc + "%" : ""}${r.rec ? " rec " + r.rec : ""}`.trim();
  const sezione = (titolo, prog, rigaFn, colLavoro, atletaIdGraf) => {
    if (!prog || !prog.mesocicli || !prog.mesocicli.length) return "";
    let s = "";
    prog.mesocicli.forEach((m, mi) => {
      const testa = ["Mesociclo " + (mi + 1), m.blocco || m.ciclo || "", m.inizio ? "dal " + _rDataL(m.inizio) : "", m.focus ? "focus: " + m.focus : ""].filter(Boolean).join(" · ");
      const giorni = (m.giorni || []).map((gi, idx) => {
        const sett = (gi.settimane && gi.settimane[0]) || {};
        const righe = (sett.righe || []).map(rigaFn).filter(t => t);
        return righe.length ? `<tr><td>Giorno ${idx + 1}${gi.giornoSett ? " (" + gi.giornoSett + ")" : ""}</td><td>${righe.join(" · ")}</td></tr>` : "";
      }).filter(Boolean).join("");
      if (!giorni) return;
      s += `<div style="page-break-inside:avoid"><p class="sub" style="margin-top:10px"><b>${testa}</b></p><table><tr><th>Giorno</th><th>${colLavoro} (settimana tipo)</th></tr>${giorni}</table>`;
      s += (atletaIdGraf ? _rGraficoMeso(atletaIdGraf, _rMesoWin(prog.mesocicli, mi)) : "") + `</div>`;
    });
    return s ? `<h2>${titolo}</h2>${s}` : "";
  };
  const html = sezione(g === "lanci" ? "Programma Campo per mesociclo" : "Programma Pista per mesociclo", pista, rigaPista, g === "lanci" ? "Contenuto" : "Lavoro", a.id)
    + sezione("Programma Palestra per mesociclo", pal, rigaPal, "Esercizi", null);
  return html || `<h2>Programma</h2><p class="muted">Nessun programma impostato per questo gruppo.</p>`;
}

// finestra temporale (start/end) del mesociclo i
function _rMesoWin(mesocicli, i) {
  const m = mesocicli[i];
  if (!m || !m.inizio) return null;
  const start = new Date(m.inizio + "T00:00:00");
  const next = mesocicli[i + 1];
  let end;
  if (next && next.inizio) end = new Date(next.inizio + "T00:00:00");
  else { const n = (typeof nSettimaneMeso === "function") ? nSettimaneMeso(m) : 4; end = new Date(start.getTime() + n * 7 * 86400000); }
  return { start, end };
}
// grafico salute (prontezza) + n° allenamenti nel periodo di un mesociclo
function _rGraficoMeso(atletaId, win) {
  if (!win) return "";
  const dd = ((DEMO.diariStorico || {})[atletaId] || []).filter(x => { const t = new Date((x.data || "") + "T00:00:00"); return t >= win.start && t < win.end; }).sort((x, y) => x.data < y.data ? -1 : 1);
  const nSed = ((DEMO.seduteSvolte || {})[atletaId] || []).filter(s => { const t = new Date((s.data || "") + "T00:00:00"); return t >= win.start && t < win.end; }).length;
  if (!dd.length) return `<p class="sub muted" style="margin-top:4px">${nSed} allenamenti svolti · nessun diario in questo periodo</p>`;
  const media = (dd.reduce((s, v) => s + (v.prontezza || 0), 0) / dd.length).toFixed(1);
  const bars = dd.slice(-14).map(v => ({ v: v.prontezza != null ? Math.round(v.prontezza * 10) / 10 : 0, lab: (v.data || "").slice(8, 10) + "/" + (v.data || "").slice(5, 7) }));
  return `<p class="sub" style="margin-top:4px">Salute nel mesociclo: prontezza media <b class="${_rClsPront(media)}">${media}/5</b> · <b>${nSed}</b> allenamenti svolti</p>${_svgBars(bars)}`;
}

// sparkline (andamento) di una serie di valori
function _rSpark(vals) {
  if (!vals.length) return "";
  const W = 92, H = 26, min = Math.min(...vals), max = Math.max(...vals), rng = (max - min) || 1;
  const pts = vals.map((v, i) => { const x = vals.length > 1 ? (i / (vals.length - 1)) * (W - 6) + 3 : W / 2; const y = H - 3 - ((v - min) / rng) * (H - 8); return `${x.toFixed(1)},${y.toFixed(1)}`; });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="flex:none;vertical-align:middle"><polyline points="${pts.join(" ")}" fill="none" stroke="#2B4C7E" stroke-width="1.5"/>${pts.map(p => { const c = p.split(","); return `<circle cx="${c[0]}" cy="${c[1]}" r="1.7" fill="#2B4C7E"/>`; }).join("")}</svg>`;
}
// storico di tutti i test/salti e massimali (progressione nel tempo)
function _rStoricoTestForza(a) {
  const salti = (a.scheda && a.scheda.salti) || [];
  const mx = (a.scheda && a.scheda.massimali) || [];
  const grp = (items, ni, vi, ui, di) => {
    const by = {};
    items.forEach(x => { const n = x[ni], v = parseFloat(String(x[vi]).replace(",", ".")); if (isNaN(v)) return; (by[n] = by[n] || []).push({ v, u: ui != null ? (x[ui] || "") : "kg", d: x[di] || "" }); });
    return by;
  };
  const render = by => Object.keys(by).map(n => {
    const serie = by[n].slice().sort((x, y) => x.d < y.d ? -1 : 1);
    if (!serie.length) return "";
    const first = serie[0], last = serie[serie.length - 1];
    const delta = serie.length > 1 ? Math.round((last.v - first.v) * 100) / 100 : null;
    const higher = last.u !== "s";   // secondi: più basso è meglio; cm/kg/index: più alto è meglio
    const cls = delta == null || delta === 0 ? "" : ((delta > 0) === higher ? "g" : "r");
    return `<tr><td>${n}</td><td>${_rSpark(serie.map(p => p.v))}</td><td>${serie.map(p => `${_rDataL(p.d) || "—"}: <b>${p.v}${last.u ? " " + last.u : ""}</b>`).join(" · ")}</td><td>${delta != null ? `<b class="${cls}">${delta > 0 ? "+" : ""}${delta}${last.u ? " " + last.u : ""}</b>` : "—"}</td></tr>`;
  }).join("");
  const rowsTest = render(grp(salti, 0, 1, 2, 5));
  const rowsForza = render(grp(mx, 0, 1, null, 5));
  if (!rowsTest && !rowsForza) return "";
  let s = `<h2>Storico test e forza</h2>`;
  if (rowsTest) s += `<p class="sub"><b>Test / salti</b></p><table><tr><th>Test</th><th>Andamento</th><th>Valori</th><th>Δ</th></tr>${rowsTest}</table>`;
  if (rowsForza) s += `<p class="sub" style="margin-top:10px"><b>Massimali di forza</b></p><table><tr><th>Esercizio</th><th>Andamento</th><th>Valori</th><th>Δ</th></tr>${rowsForza}</table>`;
  return s;
}

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
  const colProva = a.disciplina === "lanci" ? "Attrezzo" : (a.disciplina === "mezzofondo" || a.disciplina === "fondo") ? "Distanza" : "Prova";
  const colRis = a.disciplina === "lanci" ? "Misura" : "Tempo";
  const pbRow = p => `<tr><td>${p[0]}</td><td><b>${_rFmtMis(a.disciplina, p[1], p[0])}</b></td><td>${p[2] || ""}</td></tr>`;
  const gara = pb.filter(p => (p[7] || "gara") === "gara").sort((x, y) => rankd(x[0]) - rankd(y[0]));
  const allen = pb.filter(p => p[7] === "allenamento").sort((x, y) => rankd(x[0]) - rankd(y[0]));
  h += `<h2>Personali (PB)</h2><div class="two">
    <div><p class="sub"><b>🏆 In gara</b></p>${gara.length ? `<table><tr><th>${colProva}</th><th>${colRis}</th><th>Data</th></tr>${gara.map(pbRow).join("")}</table>` : `<p class="muted">Nessun PB in gara.</p>`}</div>
    <div><p class="sub"><b>🏋 In allenamento</b></p>${allen.length ? `<table><tr><th>${colProva}</th><th>${colRis}</th><th>Data</th></tr>${allen.map(pbRow).join("")}</table>` : `<p class="muted">Nessun PB in allenamento.</p>`}</div>
  </div>`;

  // --- massimali + test/salti ---
  const mx = (a.scheda && a.scheda.massimali) || [];
  const salti = (a.scheda && a.scheda.salti) || [];
  h += `<div class="two">
    <div><h2>Massimali di forza</h2>${mx.length ? `<table><tr><th>Esercizio</th><th>Kg</th><th>Data</th></tr>${mx.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}</b></td><td>${x[2] || ""}</td></tr>`).join("")}</table>` : `<p class="muted">Nessun massimale.</p>`}</div>
    <div><h2>Test e salti</h2>${salti.length ? `<table><tr><th>Test</th><th>Valore</th><th>Data</th></tr>${salti.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}${x[2] ? " " + x[2] : ""}</b></td><td>${x[3] || ""}</td></tr>`).join("")}</table>` : `<p class="muted">Nessun test registrato.</p>`}</div>
  </div>`;

  // --- storico test e forza (progressione nel tempo) ---
  h += _rStoricoTestForza(a);

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
  const tutteSvolte = ((DEMO.seduteSvolte || {})[id] || []);
  const nSvolte = tutteSvolte.length, nPista = tutteSvolte.filter(s => s.tipo === "pista").length;
  const svolte = tutteSvolte.slice().sort((x, y) => x.data < y.data ? 1 : -1).slice(0, 12);
  h += `<h2>Allenamenti svolti (${nSvolte})</h2>`;
  if (nSvolte) h += `<p class="sub">${nPista} in pista/campo · ${nSvolte - nPista} in palestra${nSvolte > 12 ? " · sotto gli ultimi 12" : ""}</p>`;
  if (svolte.length) {
    h += `<table><tr><th>Data</th><th>Tipo</th><th>Durata · RPE</th><th>Contenuto svolto</th></tr>${svolte.map(sv => {
      const d = sv.dati || {};
      const cont = sv.tipo === "pista"
        ? (d.elementi || []).map(e => {
            if (e.misure) { const f = (e.misure || []).filter(v => v != null); return `${e.mezzo || "lanci"}${e.lanci ? " " + e.lanci + " lanci" : ""}${f.length ? " (best " + Math.max(...f).toFixed(2) + "m)" : ""}`; }
            if (e.min != null) return `${e.mezzo || "continuo"} ${e.min}′`;
            const f = (e.tempi || []).filter(v => v != null); return `${e.ripetute}×${e.distanza}m${f.length ? " (" + f.map(t => Number(t).toFixed(2)).join(", ") + ")" : ""}`;
          }).join(" · ")
        : (d.esercizi || []).map(x => { const f = (x.vbt || []).filter(v => v != null); const vm = f.length ? (f.reduce((s, v) => s + v, 0) / f.length).toFixed(2) : null; return `${x.nome} ${x.serie || "?"}×${x.rep || "?"}${x.peso ? "@" + x.peso + "kg" : ""}${vm ? " VBT " + vm : ""}`; }).join(" · ");
      return `<tr><td>${_rDataL(sv.data)}</td><td>${sv.tipo === "pista" ? "Pista" : "Palestra"}${sv.fastidi ? ' <span class="r">⚠</span>' : ""}</td><td>${sv.durata_min ? sv.durata_min + "′" : "—"}${sv.rpe ? " · RPE " + sv.rpe : ""}</td><td>${cont || "—"}</td></tr>`;
    }).join("")}</table>`;
  } else h += `<p class="muted">Nessun allenamento chiuso ancora dall'atleta.</p>`;

  // --- programma per mesociclo (parte da una nuova pagina) ---
  h += `<div style="page-break-before:always"></div>${_rProgrammaMesocicli(a)}`;

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
