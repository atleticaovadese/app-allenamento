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
#app-report .only-print{display:none}
#app-report .report-nota{width:100%;box-sizing:border-box;font-family:inherit;font-size:13px;line-height:1.5;padding:9px 11px;border:1px solid #cdd6e4;border-radius:6px;margin-top:4px;resize:vertical}
#app-report .cover{background:linear-gradient(135deg,#2B4C7E,#3d6bb0);color:#fff;padding:22px 24px;border-radius:8px;margin-bottom:16px}
#app-report .cover-brand{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.92}
#app-report .cover-logo{width:22px;height:22px;border-radius:6px;background:#fff;padding:1px}
#app-report .cover-hero{display:flex;align-items:center;gap:16px;margin-top:14px}
#app-report .cover-foto{width:74px;height:74px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.85);flex:none}
#app-report .cover-foto-ph{width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:700;color:#fff;border:3px solid rgba(255,255,255,.5);flex:none}
#app-report .cover-name{font-size:27px;font-weight:700;line-height:1.1}
#app-report .cover-sub{font-size:14px;opacity:.95;margin-top:4px}
#app-report .cover-meta{margin-top:14px;font-size:11px;opacity:.82;border-top:1px solid rgba(255,255,255,.28);padding-top:9px}
#app-report .print-footer{display:none}
@media print{
  body *{visibility:hidden!important}
  #app-report,#app-report *{visibility:visible!important}
  #app-report{position:absolute;left:0;top:0;width:100%;max-width:none;box-shadow:none;border-radius:0;padding:0}
  .no-print{display:none!important}
  #app-report .only-print{display:block!important}
  #app-report .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  #app-report th,#app-report .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  #app-report .print-footer{display:block;position:fixed;bottom:4mm;left:0;right:0;text-align:center;font-size:8.5px;color:#8a94a3}
  h2{page-break-after:avoid}
  tr{page-break-inside:avoid}
  table,svg,.kpi{page-break-inside:avoid}
  @page{margin:14mm}
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

// programma per mesociclo (Pista/Campo + Palestra): settimana-tipo per giorno.
// gOverride = per stampare il programma MADRE di un gruppo (a può essere null → niente grafico salute)
function _rProgrammaMesocicli(a, gOverride) {
  const g = gOverride || ((typeof gruppoDi === "function" && a) ? gruppoDi(a) : "vel");
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
  const html = sezione(g === "lanci" ? "Programma Campo per mesociclo" : "Programma Pista per mesociclo", pista, rigaPista, g === "lanci" ? "Contenuto" : "Lavoro", a ? a.id : null)
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
  else { const n = (typeof nSettimaneMeso === "function") ? nSettimaneMeso(m) : 4; end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + n * 7); }
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
// grafico del sonno (ore) con linea della media
function _svgBarsSonno(punti, media) {
  if (!punti.length) return "";
  const W = 460, H = 96, pad = 18, max = 10, base = H - 18;
  const bw = Math.min(46, (W - pad * 2) / punti.length - 6);
  const yFor = h => base - (Math.min(h, max) / max) * (H - 34);
  const barre = punti.map((p, i) => {
    const x = pad + i * ((W - pad * 2) / punti.length) + 3;
    const y = yFor(p.v), hh = Math.max(2, base - y);
    const col = p.v >= media - 0.5 ? "#2f9e52" : "#d99a00";
    return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${bw.toFixed(0)}" height="${hh.toFixed(0)}" fill="${col}" rx="2"/>
      <text x="${(x + bw / 2).toFixed(0)}" y="${(y - 3).toFixed(0)}" font-size="9" fill="#555" text-anchor="middle">${p.v}</text>
      <text x="${(x + bw / 2).toFixed(0)}" y="${H - 4}" font-size="8" fill="#8a94a3" text-anchor="middle">${p.lab}</text>`;
  }).join("");
  const my = yFor(media);
  const mline = `<line x1="${pad}" y1="${my.toFixed(0)}" x2="${W - pad}" y2="${my.toFixed(0)}" stroke="#2B4C7E" stroke-width="1" stroke-dasharray="4 3"/><text x="${W - pad}" y="${(my - 3).toFixed(0)}" font-size="8" fill="#2B4C7E" text-anchor="end">media ${media.toFixed(1)} h</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;margin-top:6px">${mline}${barre}</svg>`;
}

// (1) sintesi esecutiva: 4-6 bandierine automatiche
function _rExecSummary(a, id, m, ader) {
  const b = [];
  b.push({ lv: ader >= 85 ? "g" : ader >= 70 ? "y" : "r", t: `Aderenza <b>${ader}%</b>` });
  const ac = parseFloat(String(m.acwr).replace(",", "."));
  if (!isNaN(ac)) b.push({ lv: (ac >= 0.8 && ac <= 1.3) ? "g" : (ac <= 1.5 ? "y" : "r"), t: `Carico ACWR <b>${ac.toFixed(2)}</b>${ac > 1.5 ? " (picco)" : ac < 0.8 ? " (basso)" : ""}` });
  const storia = ((DEMO.diariStorico || {})[id] || []);
  const pr = storia.slice(0, 14).map(v => v.prontezza).filter(x => x != null);
  if (pr.length) { const mp = pr.reduce((s, x) => s + x, 0) / pr.length; b.push({ lv: mp >= 3.5 ? "g" : mp >= 2.5 ? "y" : "r", t: `Prontezza media <b>${mp.toFixed(1)}/5</b>` }); }
  const son = storia.slice(0, 14).map(v => Number(v.oreSonno)).filter(x => !isNaN(x));
  if (son.length) { const ms = son.reduce((s, x) => s + x, 0) / son.length; b.push({ lv: ms >= 7 ? "g" : "y", t: `Sonno medio <b>${ms.toFixed(1)} h</b>` }); }
  const prev = (typeof sessioniDi === "function") ? sessioniDi(id, "prevenzione")[0] : null;
  if (prev && prev.dati) { const fl = Object.values(prev.dati).map(x => x.asym).filter(a2 => a2 != null); const ro = fl.filter(a2 => a2 > 15).length, gi = fl.filter(a2 => a2 >= 10 && a2 <= 15).length; if (ro || gi) b.push({ lv: ro ? "r" : "y", t: ro ? `${ro} asimmetria/e da correggere` : `${gi} asimmetria/e da tenere d'occhio` }); else if (fl.length) b.push({ lv: "g", t: "Simmetria dx/sx nella norma" }); }
  const inf = (DEMO.infortuni || []).filter(i => i.atleta === id && i.stato !== "Risolto").length;
  if (inf) b.push({ lv: "r", t: `${inf} infortunio/fastidio in corso` });
  if (!b.length) return "";
  const ic = lv => lv === "g" ? "🟢" : lv === "y" ? "🟡" : "🔴";
  const bd = lv => lv === "g" ? "#1a7a3a" : lv === "y" ? "#a86800" : "#b02a37";
  return `<h2>In sintesi</h2><div style="display:flex;flex-wrap:wrap;gap:8px">${b.map(x => `<div style="flex:1;min-width:150px;border:1px solid #d7dde7;border-left:4px solid ${bd(x.lv)};border-radius:6px;padding:7px 10px;font-size:12.5px">${ic(x.lv)} ${x.t}</div>`).join("")}</div>`;
}
// (2) obiettivo vs realtà (dai PB con obiettivo impostato)
function _rObiettivi(a) {
  const disc = a.disciplina, pb = (a.scheda && a.scheda.pb) || [];
  const higher = ev => disc === "lanci" || _rEvSalto(ev);
  const byEv = {};
  pb.forEach(p => { const ev = p[0], hi = higher(ev), v = parseMisura(hi ? "lanci" : disc, p[1]); if (v == null || isNaN(v)) return; const ob = (p[4] != null && p[4] !== "") ? parseMisura(hi ? "lanci" : disc, p[4]) : null; if (!byEv[ev]) byEv[ev] = { best: v, ob }; else { byEv[ev].best = hi ? Math.max(byEv[ev].best, v) : Math.min(byEv[ev].best, v); if (ob != null) byEv[ev].ob = ob; } });
  const evs = Object.keys(byEv).filter(ev => byEv[ev].ob != null);
  if (!evs.length) return "";
  const rows = evs.map(ev => { const o = byEv[ev], hi = higher(ev); const gap = hi ? o.ob - o.best : o.best - o.ob; const stato = gap <= 0 ? `<b class="g">✓ raggiunto</b>` : `manca <b>${_rFmtMis(disc, Math.abs(gap), ev)}</b>`; return `<tr><td>${ev}</td><td><b>${_rFmtMis(disc, o.best, ev)}</b></td><td>${_rFmtMis(disc, o.ob, ev)}</td><td>${stato}</td></tr>`; }).join("");
  return `<h2>Obiettivo vs realtà</h2><table><tr><th>Prova</th><th>Attuale</th><th>Obiettivo</th><th>Stato</th></tr>${rows}</table>`;
}
// (3) prevenzione: ultima sessione asimmetrie
function _rPrevenzione(id) {
  const s = (typeof sessioniDi === "function") ? sessioniDi(id, "prevenzione")[0] : null;
  if (!s || !s.dati) return "";
  const tests = (typeof prevTestsAll === "function") ? prevTestsAll() : (typeof PREV_TESTS !== "undefined" ? PREV_TESTS : []);
  const nameOf = k => { const t = tests.find(x => x.k === k); return t ? t.nome : k; };
  const rows = Object.keys(s.dati).map(k => { const d = s.dati[k], a2 = d.asym; const cls = a2 == null ? "" : a2 > 15 ? "r" : a2 >= 10 ? "y" : "g"; const fl = a2 == null ? "" : a2 > 15 ? "🔴" : a2 >= 10 ? "🟡" : "🟢"; return `<tr><td>${nameOf(k)}</td><td>${d.dx ?? "—"}</td><td>${d.sx ?? "—"}</td><td class="${cls}"><b>${a2 != null ? a2.toFixed(1) + "%" : "—"}</b> ${fl}</td></tr>`; }).join("");
  return `<h2>Prevenzione — asimmetrie dx/sx</h2><p class="sub">Test del ${_rDataL(s.data)} · &gt;15% 🔴 · 10-15% 🟡 · &lt;10% 🟢 (Limb Symmetry Index)</p><table><tr><th>Test</th><th>Dx</th><th>Sx</th><th>Asimmetria</th></tr>${rows}</table>`;
}
// (5) progressione dei PB nel tempo (per evento con >=2 date)
function _rProgressionePB(a) {
  const disc = a.disciplina, pb = (a.scheda && a.scheda.pb) || [];
  const higher = ev => disc === "lanci" || _rEvSalto(ev);
  const byEv = {};
  pb.forEach(p => { const ev = p[0], v = parseMisura(higher(ev) ? "lanci" : disc, p[1]); if (v == null || isNaN(v)) return; (byEv[ev] = byEv[ev] || []).push({ v, d: p[6] || p[2] || "" }); });
  const rows = Object.keys(byEv).map(ev => {
    const serie = byEv[ev].slice().sort((x, y) => x.d < y.d ? -1 : 1);
    if (serie.length < 2) return "";
    const first = serie[0], last = serie[serie.length - 1], hi = higher(ev);
    const better = hi ? last.v > first.v : last.v < first.v, delta = Math.abs(last.v - first.v);
    const cls = last.v === first.v ? "" : better ? "g" : "r";
    return `<tr><td>${ev}</td><td>${_rSpark(serie.map(p => hi ? p.v : -p.v))}</td><td>${serie.map(p => `${_rDataL(p.d) || "—"}: <b>${_rFmtMis(disc, p.v, ev)}</b>`).join(" · ")}</td><td><b class="${cls}">${last.v === first.v ? "=" : better ? "↑" : "↓"} ${_rFmtMis(disc, delta, ev)}</b></td></tr>`;
  }).join("");
  return rows ? `<h2>Progressione PB</h2><table><tr><th>Prova</th><th>Andamento</th><th>Storia</th><th>Δ</th></tr>${rows}</table>` : "";
}
// (7) andamento del peso corporeo (dal diario)
function _rPesoTrend(id) {
  const pts = ((DEMO.diariStorico || {})[id] || []).filter(v => v.peso != null && v.peso !== "" && !isNaN(Number(v.peso)) && _rInPeriodo(v.data)).map(v => ({ v: Number(v.peso), d: v.data })).sort((x, y) => x.d < y.d ? -1 : 1);
  if (pts.length < 2) return "";
  const first = pts[0], last = pts[pts.length - 1], delta = last.v - first.v;
  return `<p class="sub" style="margin-top:10px"><b>Peso corporeo</b> · <b>${last.v} kg</b> (${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg dal ${_rDataL(first.d)}) &nbsp;${_rSpark(pts.map(p => p.v))}</p>`;
}
// (6) carico e forma nel tempo (sRPE = durata × RPE → carico settimanale + ACWR)
function _rCaricoTrend(id) {
  const sv = ((DEMO.seduteSvolte || {})[id] || []).filter(s => s.data && _rInPeriodo(s.data));
  if (sv.length < 4) return "";
  const byWeek = {};
  sv.forEach(s => { const d = new Date(s.data + "T00:00:00"); if (isNaN(d)) return; const dow = (d.getDay() + 6) % 7; const mon = new Date(d.getTime()); mon.setDate(d.getDate() - dow); const key = mon.toISOString().slice(0, 10); const load = (Number(s.durata_min) || 60) * (Number(s.rpe) || 5); byWeek[key] = (byWeek[key] || 0) + load; });
  const weeks = Object.keys(byWeek).sort();
  if (weeks.length < 3) return "";
  const rec = weeks.slice(-9).map(w => { const idx = weeks.indexOf(w); const cw = weeks.slice(Math.max(0, idx - 3), idx + 1).map(k => byWeek[k]); const chronic = cw.reduce((s, x) => s + x, 0) / cw.length; return { w, load: byWeek[w], acwr: chronic > 0 ? byWeek[w] / chronic : null }; });
  const maxL = Math.max(...rec.map(r => r.load)) || 1;
  const W = 460, H = 120, pad = 18, base = H - 26, bw = Math.min(40, (W - pad * 2) / rec.length - 6);
  const acol = a => a == null ? "#8a94a3" : (a >= 0.8 && a <= 1.3) ? "#1a7a3a" : (a <= 1.5) ? "#a86800" : "#b02a37";
  const bars = rec.map((r, i) => { const x = pad + i * ((W - pad * 2) / rec.length) + 3; const bh = Math.max(2, (r.load / maxL) * (base - 16)); return `<rect x="${x.toFixed(0)}" y="${(base - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="#c7d3e6" rx="2"/>
      <text x="${(x + bw / 2).toFixed(0)}" y="${(base - bh - 3).toFixed(0)}" font-size="8" fill="${acol(r.acwr)}" text-anchor="middle" font-weight="700">${r.acwr != null ? r.acwr.toFixed(2) : "—"}</text>
      <text x="${(x + bw / 2).toFixed(0)}" y="${H - 6}" font-size="7.5" fill="#8a94a3" text-anchor="middle">${r.w.slice(8, 10)}/${r.w.slice(5, 7)}</text>`; }).join("");
  const last = rec[rec.length - 1];
  const cls = last.acwr == null ? "" : (last.acwr >= 0.8 && last.acwr <= 1.3) ? "g" : last.acwr <= 1.5 ? "y" : "r";
  return `<h2>Carico e forma nel tempo</h2>
    <p class="sub">Carico settimanale (sRPE = durata × RPE) con l'<b>ACWR</b> sopra ogni barra (acuto/cronico 4 sett). Zona sicura 0.8–1.3.</p>
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;margin-top:4px">${bars}</svg>
    <p class="sub">Ultima settimana: carico <b>${Math.round(last.load)}</b> u.a. · ACWR <b class="${cls}">${last.acwr != null ? last.acwr.toFixed(2) : "—"}</b>${last.acwr > 1.5 ? " — picco: attenzione" : last.acwr < 0.8 ? " — carico basso" : ""}</p>`;
}
// (9) profilo specifico per disciplina
function _rPerDisciplina(a) {
  const g = (typeof gruppoDi === "function") ? gruppoDi(a) : "vel";
  if (g === "lanci" && typeof pbLanciInfo === "function") {
    const info = pbLanciInfo(a), obi = (typeof obiettivoLanciScheda === "function") ? obiettivoLanciScheda(a) : null, diag = (typeof _profiloAttrDiag === "function") ? _profiloAttrDiag(a) : null;
    if (info.pb == null && !diag && obi == null) return "";
    const rows = [info.pb != null ? ["Personale", info.pb.toFixed(2) + " m" + (info.evento ? " (" + info.evento + ")" : "")] : null, obi != null ? ["Obiettivo", obi.toFixed(2) + " m"] : null, diag ? ["Profilo attrezzo (over/under)", diag.diag] : null].filter(Boolean);
    return `<h2>Profilo lanci</h2><table>${rows.map(r => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join("")}</table>`;
  }
  if (g === "mezzo" && typeof ritmiHomeMezzo === "function") {
    const R = ritmiHomeMezzo(a);
    if (!R || (R.soglia === "—" && R.vo2 === "—")) return "";
    return `<h2>Profilo mezzofondo — ritmi target</h2><table><tr><th>Zona</th><th>Ritmo /km</th></tr>
      <tr><td>Facile / lungo</td><td><b>${R.facile}</b></td></tr>
      <tr><td>Soglia</td><td><b>${R.soglia}</b></td></tr>
      <tr><td>VO2max</td><td><b>${R.vo2}</b></td></tr>
      <tr><td>Ritmo gara 5000</td><td><b>${R.gara5}</b></td></tr></table>`;
  }
  return "";
}
// (8) batteria test dall'area Analisi: F-V bilanciere, F-V sprint, RSI/Drop jump, VBT
function _rTestBattery(id) {
  if (typeof sessioniDi !== "function") return "";
  const blocks = [];
  const fv = sessioniDi(id, "fv")[0];
  if (fv && fv.dati) {
    const d = fv.dati;
    blocks.push(`<p class="sub" style="margin-top:8px"><b>Profilo Forza-Velocità (salti · ${_rDataL(fv.data)})</b></p>
      <table><tr><th>F0</th><th>V0</th><th>Pmax</th><th>Pmax/kg</th><th>Squilibrio F-V</th></tr>
      <tr><td>${d.F0 != null ? Math.round(d.F0) + " N" : "—"}</td><td>${d.V0 != null ? d.V0.toFixed(2) + " m/s" : "—"}</td><td>${d.Pmax != null ? Math.round(d.Pmax) + " W" : "—"}</td><td>${d.Pkg != null ? d.Pkg.toFixed(1) + " W/kg" : "—"}</td><td>${d.FVimb != null ? Math.round(d.FVimb) + "% · " + (d.dir || "") : "equilibrato"}</td></tr></table>`);
  }
  const fvs = sessioniDi(id, "fv-sprint")[0];
  if (fvs && fvs.dati) {
    const d = fvs.dati;
    blocks.push(`<p class="sub" style="margin-top:8px"><b>Profilo F-V Sprint (${_rDataL(fvs.data)})</b></p>
      <table><tr><th>F0/kg</th><th>V0</th><th>Pmax/kg</th><th>RF max</th></tr>
      <tr><td>${d.F0kg != null ? d.F0kg.toFixed(1) + " N/kg" : "—"}</td><td>${d.V0 != null ? d.V0.toFixed(2) + " m/s" : "—"}</td><td>${d.Pmaxkg != null ? d.Pmaxkg.toFixed(1) + " W/kg" : "—"}</td><td>${d.RFmax != null ? d.RFmax.toFixed(1) + "%" : "—"}</td></tr></table>`);
  }
  const dj = sessioniDi(id, "dropjump")[0];
  if (dj && dj.dati) {
    const d = dj.dati, cls = d.bestRsi >= 2 ? "g" : d.bestRsi >= 1.5 ? "y" : "r";
    blocks.push(`<p class="sub" style="margin-top:8px"><b>Reattività — Drop Jump / RSI (${_rDataL(dj.data)})</b></p>
      <table><tr><th>RSI migliore</th><th>Caduta ottimale</th></tr><tr><td><b class="${cls}">${d.bestRsi != null ? d.bestRsi.toFixed(2) + " m/s" : "—"}</b></td><td>${d.bestH != null ? d.bestH + " cm" : "—"}</td></tr></table>`);
  }
  const vlog = (DEMO.vbtLog || []).filter(l => l.atletaId === id && l.vbtEseguita != null);
  if (vlog.length) {
    const byEx = {};
    vlog.forEach(l => { const e = l.esercizio || "?"; if (!byEx[e] || (l.data || "") > (byEx[e].data || "")) byEx[e] = { v: Number(l.vbtEseguita), data: l.data, target: l.vbtTarget }; });
    const rows = Object.keys(byEx).map(e => { const o = byEx[e]; return `<tr><td>${e}</td><td><b>${o.v.toFixed(2)} m/s</b></td><td>${(o.target != null && o.target !== "") ? Number(o.target).toFixed(2) + " m/s" : "—"}</td><td>${_rDataL(o.data)}</td></tr>`; }).join("");
    blocks.push(`<p class="sub" style="margin-top:8px"><b>Velocità al bilanciere (VBT) — ultima per esercizio</b></p>
      <table><tr><th>Esercizio</th><th>Eseguita</th><th>Target</th><th>Data</th></tr>${rows}</table>`);
  }
  return blocks.length ? `<h2>Batteria test (Analisi)</h2>${blocks.join("")}` : "";
}
// (4) note dell'allenatore (editabili a schermo, stampate nel PDF)
function setReportNotaVal(id, v) { DEMO.reportNote = DEMO.reportNote || {}; DEMO.reportNote[id] = v; if (typeof salvaCustom === "function") salvaCustom(); }
function _rNoteCoach(id) {
  const nota = ((DEMO.reportNote || {})[id] || "");
  return `<h2>Note dell'allenatore</h2>
    <textarea class="no-print report-nota" rows="3" placeholder="Valutazione, priorità, cosa curare nel prossimo blocco…" oninput="setReportNotaVal('${id}',this.value)" onchange="disegna()">${nota.replace(/</g, "&lt;")}</textarea>
    ${nota ? `<div class="note only-print">${nota.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</div>` : `<p class="muted no-print">Scrivi qui una nota: comparirà nel PDF.</p>`}`;
}

// (11) selettore periodo: filtra le sezioni temporali (diario, sonno, peso, carico, allenamenti)
function setReportPeriodo(p) { S.reportPeriodo = p; disegna(); }
function _rPeriodoCut() {
  const p = S.reportPeriodo || "tutto";
  if (p === "tutto") return null;
  const days = Number(p) || 0; if (!days) return null;
  return new Date(new Date().getTime() - days * 86400000);
}
function _rInPeriodo(dataISO) { const c = _rPeriodoCut(); if (!c) return true; const t = new Date((dataISO || "") + "T00:00:00"); return !isNaN(t) && t >= c; }
function _rPeriodoLabel() { const p = S.reportPeriodo || "tutto"; return p === "tutto" ? "intera stagione" : "ultimi " + p + " giorni"; }

// (12) copertina brandizzata: logo + nome prodotto + foto/placeholder atleta + disciplina + data
function _rCover(a, an, oggi) {
  const brand = (typeof CONFIG !== "undefined" && CONFIG.nome) ? CONFIG.nome : "Metis Performance";
  const src = (typeof fotoAtleta === "function" ? fotoAtleta(a.id) : "") || an.foto || "";
  const foto = src ? `<img class="cover-foto" src="${src}" alt="" onerror="this.style.display='none'">`
    : `<div class="cover-foto-ph">${((a.nome || "?").trim().charAt(0) || "?").toUpperCase()}</div>`;
  const sub = [a.disciplina || "", a.specialita || "", an.categoria || ""].filter(Boolean).join(" · ");
  return `<div class="cover">
    <div class="cover-brand"><img class="cover-logo" src="icon-192.png" alt="" onerror="this.style.display='none'"><span>${brand}</span></div>
    <div class="cover-hero">${foto}
      <div><div class="cover-name">${a.nome}</div><div class="cover-sub">${sub || "&nbsp;"}</div></div>
    </div>
    <div class="cover-meta">Report individuale · ${_rPeriodoLabel()} · generato il ${oggi}</div>
  </div>`;
}

// (10) Punteggio World Athletics — Scoring Tables 2022 (Bojidar/Attila Spiriev), coefficienti VERIFICATI ±1 punto
// TRACK (t = secondi): round(A*(B-t)^2) se t<B, altrimenti 0. FIELD (d = metri): round(a*d^2+b*d+c).
const WA_COEF = {
  "60m":     { M: { A: 68.6203220047, B: 10.69928 }, F: { A: 24.9117754427, B: 13.997652 }, type: "track" }, // indoor
  "100m":    { M: { A: 24.6536929929, B: 16.9953440254 }, F: { A: 9.926600016, B: 21.9940024224 }, type: "track" },
  "200m":    { M: { A: 5.0824183918, B: 35.4930524053 }, F: { A: 2.2421246579, B: 45.4945535153 }, type: "track" },
  "400m":    { M: { A: 1.0210075972, B: 78.9948247446 }, F: { A: 0.3350013982, B: 109.9948164 }, type: "track" },
  "800m":    { M: { A: 0.19800169, B: 181.9947737429 }, F: { A: 0.0687998955, B: 249.9950204174 }, type: "track" },
  "1500m":   { M: { A: 0.0406598378, B: 384.995271393 }, F: { A: 0.0134000092, B: 539.994762721 }, type: "track" },
  "3000m":   { M: { A: 0.0081500119, B: 839.9948111538 }, F: { A: 0.0025389975, B: 1199.9954 }, type: "track" },
  "5000m":   { M: { A: 0.0027780047, B: 1439.9944748965 }, F: { A: 0.0008079992, B: 2099.9956 }, type: "track" },
  "10000m":  { M: { A: 0.0005239998, B: 3149.9953299972 }, F: { A: 0.0001712, B: 4499.9944 }, type: "track" },
  "lungo":     { M: { a: 1.931092873, b: 186.7313473363, c: -479.7064044572 }, F: { a: 1.9581140326, b: 193.6954825441, c: -233.9898865274 }, type: "field" },
  "triplo":    { M: { a: 0.4603666024, b: 90.9697876805, c: -514.9946082624 }, F: { a: 0.4296645887, b: 90.3430418781, c: -231.6675825306 }, type: "field" },
  "alto":      { M: { a: 32.1457081634, b: 745.374682614, c: -705.259733494 }, F: { a: 39.5579087446, b: 831.3655724456, c: -601.5063267489 }, type: "field" },
  "asta":      { M: { a: 3.0457199209, b: 239.6120266961, c: -280.5412229935 }, F: { a: 3.9325797501, b: 275.4896832994, c: -205.1216924619 }, type: "field" },
  "peso":      { M: { a: 0.0423461436, b: 57.9996626593, c: -55.8236102462 }, F: { a: 0.0462143876, b: 60.7550311138, c: -25.9319418889 }, type: "field" },
  "disco":     { M: { a: 0.0040063129, b: 17.892060501, c: -27.187774646 }, F: { a: 0.0040284238, b: 17.9416953835, c: -19.2107481937 }, type: "field" },
  "martello":  { M: { a: 0.0028444951, b: 15.0816273081, c: -21.6890119851 }, F: { a: 0.003096724, b: 15.7301668765, c: -22.6994985433 }, type: "field" },
  "giavellotto": { M: { a: 0.0024031525, b: 13.8411868132, c: -21.0582509535 }, F: { a: 0.0040722745, b: 18.0426160529, c: -18.8429043394 }, type: "field" }
};
// attrezzi standard senior (kg) per cui valgono le tabelle WA
const WA_IMPL = { peso: { M: 7.26, F: 4.0 }, disco: { M: 2.0, F: 1.0 }, martello: { M: 7.26, F: 4.0 }, giavellotto: { M: 0.8, F: 0.6 } };
function _waPoints(key, gender, mark) {
  const e = WA_COEF[key]; if (!e) return null;
  const g = e[gender]; if (!g || mark == null || isNaN(mark)) return null;
  let p = e.type === "track" ? (mark < g.B ? g.A * (g.B - mark) ** 2 : 0) : (g.a * mark * mark + g.b * mark + g.c);
  return Math.max(0, Math.min(1400, Math.round(p)));
}
// mappa un evento PB → {key, kind} oppure null se non supportato
function _waEventKey(evento) {
  const ev = String(evento || "").toLowerCase().trim();
  if (/lungo/.test(ev)) return { key: "lungo", kind: "field" };
  if (/triplo/.test(ev)) return { key: "triplo", kind: "field" };
  if (/alto/.test(ev)) return { key: "alto", kind: "field" };
  if (/asta/.test(ev)) return { key: "asta", kind: "field" };
  if (/peso/.test(ev)) return { key: "peso", kind: "lancio" };
  if (/disco/.test(ev)) return { key: "disco", kind: "lancio" };
  if (/martello/.test(ev)) return { key: "martello", kind: "lancio" };
  if (/giavellotto/.test(ev)) return { key: "giavellotto", kind: "lancio" };
  if (/ostacol|\bhs\b|siepi|marcia|staffett|\d\s*x\s*\d/.test(ev)) return null; // tabelle diverse → escluso
  const m = ev.match(/(\d{2,5})\s*m?/);
  if (m) { const k = m[1] + "m"; if (WA_COEF[k]) return { key: k, kind: "track" }; }
  return null;
}
// sesso dell'atleta: override coach → segnale "ciclo" nel diario → grammatica categoria → default M
function _waSesso(a) {
  if (DEMO.atletaSesso && DEMO.atletaSesso[a.id]) return DEMO.atletaSesso[a.id];
  if (((DEMO.diariStorico || {})[a.id] || []).some(v => v.ciclo)) return "F";
  const cat = ((a.scheda && a.scheda.anagrafica && a.scheda.anagrafica.categoria) || "").toLowerCase();
  if (/allieve|cadette|ragazze|esordienti f|femmin|donne/.test(cat)) return "F";
  if (/allievi|cadetti|ragazzi|maschi|uomini/.test(cat)) return "M";
  return "M";
}
function setWaSesso(id, s) { DEMO.atletaSesso = DEMO.atletaSesso || {}; DEMO.atletaSesso[id] = s; if (typeof salvaCustom === "function") salvaCustom(); disegna(); }
// sezione report: punteggio World Athletics per ogni PB mappabile
function _rWAPoints(a) {
  const gender = _waSesso(a);
  const pb = (a.scheda && a.scheda.pb) || [];
  const best = {}; // key → {mark, key, kind, evento, punti}
  let esclusiImpl = 0;
  pb.forEach(p => {
    if (p[0] == null || p[1] == null || p[1] === "") return;
    const map = _waEventKey(p[0]); if (!map) return;
    const mark = parseMisura(a.disciplina, p[1]); if (mark == null || isNaN(mark)) return;
    if (map.kind === "lancio") { // attrezzo standard per il sesso?
      const kg = (typeof _parseKgAttrezzo === "function") ? _parseKgAttrezzo(p[0]) : null;
      const std = WA_IMPL[map.key] && WA_IMPL[map.key][gender];
      if (kg == null || std == null || Math.abs(kg - std) > 0.06) { esclusiImpl++; return; }
    }
    const pt = _waPoints(map.key, gender, mark); if (pt == null) return;
    const better = map.kind === "track" ? (o => mark < o.mark) : (o => mark > o.mark);
    if (!best[map.key] || better(best[map.key])) best[map.key] = { mark, key: map.key, kind: map.kind, evento: p[0], punti: pt };
  });
  const righe = Object.values(best).sort((x, y) => y.punti - x.punti);
  if (!righe.length && !esclusiImpl) return "";
  const top = righe[0];
  const sesLabel = gender === "F" ? "Femminile" : "Maschile";
  const toggle = `<span class="no-print" style="font-size:12px;color:#5a6472"> · tabella <b>${sesLabel}</b> <button class="btn btn-2" style="width:auto;padding:2px 8px;font-size:11px;display:inline-block" onclick="setWaSesso('${a.id}','${gender === "F" ? "M" : "F"}')">cambia in ${gender === "F" ? "M" : "F"}</button></span>`;
  let h = `<h2>Punteggio World Athletics</h2>
    <p class="sub">Punti dalle <b>Scoring Tables World Athletics 2022</b> (attrezzi standard senior): un punteggio unico e confrontabile tra discipline diverse.${toggle}</p>`;
  if (righe.length) {
    h += `<table><tr><th>Prova</th><th>Risultato</th><th>Punti WA</th></tr>${righe.map(r => {
      const disc = r.kind === "track" ? (r.key === "800m" || r.key === "1500m" || r.key === "3000m" || r.key === "5000m" || r.key === "10000m" ? "mezzofondo" : "velocita") : "lanci";
      return `<tr><td>${r.evento}</td><td>${_rFmtMis(disc, r.mark, r.evento)}</td><td><b>${r.punti}</b></td></tr>`;
    }).join("")}</table>
    <p class="sub" style="margin-top:6px">Migliore: <b>${top.punti} punti</b> (${top.evento}). <span class="muted">Riferimento indicativo: ~1200+ livello internazionale · ~1000 nazionale · ~800 regionale.</span></p>`;
  }
  if (esclusiImpl) h += `<p class="sub muted" style="margin-top:4px">${esclusiImpl} ${esclusiImpl === 1 ? "prova esclusa" : "prove escluse"} (attrezzo non standard per la tabella ${sesLabel.toLowerCase()}).</p>`;
  return h;
}

function _reportBodyHTML(id) {
  const a = DEMO.atleti.find(x => x.id === id);
  if (!a) return "<p>Atleta non trovato.</p>";
  const an = (a.scheda && a.scheda.anagrafica) || {};
  const m = (DEMO.mon || {})[id] || {};
  const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const ps = a.presenzeStagione || [0, 0], pm = a.presenzeMese || [0, 0];
  const ader = m.aderenza != null ? m.aderenza : (ps[1] ? Math.round(ps[0] / ps[1] * 100) : 0);

  // --- intestazione / copertina ---
  let h = _rCover(a, an, oggi);

  // --- anagrafica ---
  const anag = [an.nascita ? "Nascita " + an.nascita : "", an.altezza ? "Altezza " + an.altezza + " cm" : "", an.peso ? "Peso " + an.peso + " kg" : "", an.gambaStacco ? "Lead Leg " + an.gambaStacco : ""].filter(Boolean).join(" · ");
  if (anag) h += `<p class="sub" style="margin-top:8px">${anag}</p>`;

  // --- sintesi esecutiva ---
  h += _rExecSummary(a, id, m, ader);

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

  // --- obiettivo vs realtà ---
  h += _rObiettivi(a);

  // --- punteggio World Athletics ---
  h += _rWAPoints(a);

  // --- progressione PB nel tempo ---
  h += _rProgressionePB(a);

  // --- massimali + test/salti ---
  const mx = (a.scheda && a.scheda.massimali) || [];
  const salti = (a.scheda && a.scheda.salti) || [];
  h += `<div class="two">
    <div><h2>Massimali di forza</h2>${mx.length ? `<table><tr><th>Esercizio</th><th>Kg</th><th>Data</th></tr>${mx.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}</b></td><td>${x[2] || ""}</td></tr>`).join("")}</table>` : `<p class="muted">Nessun massimale.</p>`}</div>
    <div><h2>Test e salti</h2>${salti.length ? `<table><tr><th>Test</th><th>Valore</th><th>Data</th></tr>${salti.map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}${x[2] ? " " + x[2] : ""}</b></td><td>${x[3] || ""}</td></tr>`).join("")}</table>` : `<p class="muted">Nessun test registrato.</p>`}</div>
  </div>`;

  // --- profilo specifico per disciplina (lanci / mezzofondo) ---
  h += _rPerDisciplina(a);

  // --- storico test e forza (progressione nel tempo) ---
  h += _rStoricoTestForza(a);

  // --- batteria test dall'area Analisi (F-V, RSI, VBT) ---
  h += _rTestBattery(id);

  // --- prevenzione: asimmetrie dx/sx ---
  h += _rPrevenzione(id);

  // --- presenze ---
  h += `<h2>Presenze</h2><div class="kpi">
    <div class="box"><div class="k">Questo mese</div><div class="v">${pm[0]}/${pm[1]}</div></div>
    <div class="box"><div class="k">Stagione</div><div class="v">${ps[0]}/${ps[1]}</div></div>
    <div class="box"><div class="k">Aderenza</div><div class="v ${_rClsAder(ader)}">${ader}%</div></div>
  </div>`;

  // --- salute: diario recente + grafico + infortuni ---
  const storia = ((DEMO.diariStorico || {})[id] || []).filter(v => _rInPeriodo(v.data)).slice().sort((x, y) => x.data < y.data ? 1 : -1);
  h += `<h2>Stato di salute</h2>`;
  if (storia.length) {
    const ult = storia[0];
    h += `<p class="sub">Ultimo diario (${_rDataL(ult.data)}): prontezza <b class="${_rClsPront(ult.prontezza)}">${ult.prontezza != null ? ult.prontezza : "—"}</b> · sonno ${ult.oreSonno != null ? ult.oreSonno + " h" : "—"} · qualità ${ult.sonno_qualita ?? "—"}/5 · stress ${ult.stress ?? "—"}/5 · dolori ${ult.dolori ?? "—"}/5 · energia ${ult.energia ?? "—"}/5</p>`;
    if (ult.note) h += `<p class="note">"${ult.note}"</p>`;
    const bars = storia.slice(0, 8).reverse().map(v => ({ v: v.prontezza != null ? Math.round(v.prontezza * 10) / 10 : 0, lab: (v.data || "").slice(8, 10) + "/" + (v.data || "").slice(5, 7) }));
    if (bars.length) h += `<p class="sub" style="margin-top:8px"><b>Prontezza — ultimi giorni</b></p>${_svgBars(bars)}`;
    // --- sonno: media + ultima notte + grafico ---
    const sonnoS = storia.filter(v => v.oreSonno != null && v.oreSonno !== "" && !isNaN(Number(v.oreSonno)));
    if (sonnoS.length) {
      const recS = sonnoS.slice(0, 14);
      const mediaS = recS.reduce((s, v) => s + Number(v.oreSonno), 0) / recS.length;
      const ultimaS = Number(sonnoS[0].oreSonno);
      h += `<p class="sub" style="margin-top:10px"><b>Sonno — ultimi giorni</b> · media <b>${mediaS.toFixed(1)} h</b> (${recS.length} gg) · ultima notte <b>${ultimaS.toFixed(1)} h</b>${mediaS < 7 ? ` <span class="y">(sotto le 7 h)</span>` : ""}</p>`;
      const sbars = sonnoS.slice(0, 10).reverse().map(v => ({ v: Math.round(Number(v.oreSonno) * 10) / 10, lab: (v.data || "").slice(8, 10) + "/" + (v.data || "").slice(5, 7) }));
      h += _svgBarsSonno(sbars, mediaS);
    }
    // peso corporeo
    h += _rPesoTrend(id);
    // giorni con ciclo (se registrati)
    const nCiclo = storia.filter(v => v.ciclo).length;
    if (nCiclo) h += `<p class="sub" style="margin-top:8px">🩸 Ciclo mestruale registrato in <b>${nCiclo}</b> ${nCiclo === 1 ? "giorno" : "giorni"} nel periodo.</p>`;
  } else h += `<p class="muted">Nessun diario registrato.</p>`;
  const inf = (DEMO.infortuni || []).filter(i => (i.atleta === id) && i.stato !== "Risolto");
  if (inf.length) h += `<p class="sub" style="margin-top:8px"><b class="r">Infortuni/fastidi in corso</b></p><table><tr><th>Zona</th><th>Tipo</th><th>Stato</th><th>Dal</th></tr>${inf.map(i => `<tr><td>${i.zona}${i.lato ? " " + i.lato : ""}</td><td>${i.tipo || ""}</td><td>${i.stato || "Attivo"}</td><td>${_rDataL(i.dataInizio || i.dal || "")}</td></tr>`).join("")}</table>`;

  // --- allenamenti svolti ---
  const tutteSvolte = ((DEMO.seduteSvolte || {})[id] || []).filter(s => _rInPeriodo(s.data));
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

  // --- carico e forma nel tempo (sRPE + ACWR) ---
  h += _rCaricoTrend(id);

  // --- note dell'allenatore ---
  h += _rNoteCoach(id);

  // --- programma per mesociclo (parte da una nuova pagina) ---
  h += `<div style="page-break-before:always"></div>${_rProgrammaMesocicli(a)}`;

  h += `<div class="foot">Metis Performance · «Chi non pianifica è destinato a fallire.»</div>`;
  // footer ripetuto su ogni pagina in stampa (Chrome: il n° pagina si attiva da "Altre impostazioni › Intestazioni e piè di pagina")
  h += `<div class="print-footer">${(typeof CONFIG !== "undefined" && CONFIG.nome) ? CONFIG.nome : "Metis Performance"} · ${a.nome} · ${oggi}</div>`;
  return h;
}

function vistaReportAtleta() {
  const a = DEMO.atleti.find(x => x.id === S.report);
  if (!a) { S.report = null; return typeof vistaAtletaDettaglio === "function" ? vistaAtletaDettaglio() : ""; }
  const per = S.reportPeriodo || "tutto";
  const pill = (v, l) => `<button class="btn ${per === v ? "" : "btn-2"}" style="width:auto;padding:7px 12px;font-size:13px" onclick="setReportPeriodo('${v}')">${l}</button>`;
  return `<style>${_REPORT_CSS}</style>
    <div class="no-print" style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <button class="btn btn-2" style="width:auto;padding:9px 14px" onclick="chiudiReport()">‹ Indietro</button>
      <button class="btn" style="width:auto;padding:9px 16px" onclick="window.print()">🖨 Stampa / Salva PDF</button>
    </div>
    <div class="no-print" style="display:flex;gap:6px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <span class="et" style="margin:0 2px 0 0">Periodo:</span>${pill("tutto", "Stagione")}${pill("90", "90 giorni")}${pill("180", "180 giorni")}
      <span class="et" style="margin:0 0 0 6px;color:var(--muted,#8a94a3)">Grafici e diario mostrano <b>${_rPeriodoLabel()}</b>. Premi <b>Stampa › Salva come PDF</b>.</span>
    </div>
    <div id="app-report">${_reportBodyHTML(a.id)}</div>`;
}

// per validazione/uso esterno: documento HTML autonomo
function _reportStandalone(id) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report ${(DEMO.atleti.find(x => x.id === id) || {}).nome || ""}</title><style>body{margin:0;background:#e9edf2;padding:16px}${_REPORT_CSS}</style></head><body><div id="app-report">${_reportBodyHTML(id)}</div></body></html>`;
}

// ---------- Stampa del programma MADRE di un gruppo (PDF, stesso stile del report) ----------
function apriStampaProgramma(g) { S.stampaProg = g || (S.progGruppo || "vel"); disegna(); window.scrollTo(0, 0); }
function chiudiStampaProgramma() { S.stampaProg = null; disegna(); window.scrollTo(0, 0); }
function vistaStampaProgramma() {
  const g = S.stampaProg || "vel";
  const grp = (typeof GRUPPI_PROG !== "undefined") ? GRUPPI_PROG : [["vel", "Velocisti / Saltatori"], ["lanci", "Lanciatori"], ["mezzo", "Mezzofondo / Fondo"]];
  const nomeG = (grp.find(x => x[0] === g) || [])[1] || g;
  const brand = (typeof CONFIG !== "undefined" && CONFIG.nome) ? CONFIG.nome : "Metis";
  const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const body = `<h1>Programma madre — ${nomeG}</h1>
    <p class="sub muted">${brand} · settimana-tipo per giorno di ogni mesociclo · stampato il ${oggi}</p>
    ${(typeof _rProgrammaMesocicli === "function") ? _rProgrammaMesocicli(null, g) : ""}
    <div class="foot">${brand} · «Chi non pianifica è destinato a fallire.»</div>
    <div class="print-footer">${brand} · programma madre ${nomeG} · ${oggi}</div>`;
  return `<style>${_REPORT_CSS}</style>
    <div class="no-print" style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <button class="btn btn-2" style="width:auto;padding:9px 14px" onclick="chiudiStampaProgramma()">‹ Indietro</button>
      <button class="btn" style="width:auto;padding:9px 16px" onclick="window.print()">🖨 Stampa / Salva PDF</button>
    </div>
    <div class="no-print" style="display:flex;gap:6px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <span class="et" style="margin:0 4px 0 0">Disciplina:</span>
      ${grp.map(([k, l]) => `<button class="btn ${g === k ? "" : "btn-2"}" style="width:auto;padding:7px 12px;font-size:13px" onclick="apriStampaProgramma('${k}')">${l}</button>`).join("")}
    </div>
    <p class="no-print et" style="margin-bottom:12px">Anteprima del programma madre. Premi <b>Stampa</b> → <b>«Salva come PDF»</b>. Ogni mesociclo sta in un blocco che non si spezza tra le pagine.</p>
    <div id="app-report">${body}</div>`;
}
