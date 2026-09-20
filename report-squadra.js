// Riepilogo di fine MESOCICLO per TUTTA la squadra → PDF (Stampa del browser → «Salva come PDF»).
// Sintesi di squadra (KPI + highlight + tabella) e poi una scheda per ogni atleta ("come è andato il blocco").
// Riusa lo stile (_REPORT_CSS) e gli helper di report.js (_svgBars, _rFmtMis, _rCls*, _rDataL).

// ---------- navigazione ----------
function apriRiepilogoMeso(key) {
  const liste = _riepMesocicliLista();
  S.riepMeso = key || S.riepMeso || _riepMesoDefault(liste) || (liste[0] && liste[0].key) || "__nessuno__";
  disegna(); window.scrollTo(0, 0);
}
function chiudiRiepilogoMeso() { S.riepMeso = null; disegna(); window.scrollTo(0, 0); }
function setRiepMesoSel(key) { S.riepMeso = key; disegna(); window.scrollTo(0, 0); }

function _riepISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function _riepDMY(d) { const M = (typeof MESI_IT !== "undefined") ? MESI_IT : ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]; return d.getDate() + " " + M[d.getMonth()]; }
function _riepGLabel(g) { return ({ vel: "Velocità / Salti", lanci: "Lanci", mezzo: "Mezzofondo / Fondo" })[g] || g; }
function _riepNAtl(g) { return (typeof atletiDelGruppo === "function") ? atletiDelGruppo(g).length : 0; }

// ---------- elenco dei mesocicli selezionabili (da tutti i gruppi che hanno una data d'inizio) ----------
function _riepMesocicliLista() {
  const grp = (typeof GRUPPI_PROG !== "undefined") ? GRUPPI_PROG : [["vel", "Velocità"], ["lanci", "Lanci"], ["mezzo", "Mezzofondo"]];
  const out = [];
  grp.forEach(([g]) => {
    const prog = (typeof pistaDi === "function") ? pistaDi(g) : null;
    const mc = ((prog && prog.mesocicli) || []).map((m, i) => ({ m, i })).filter(x => x.m.inizio);
    mc.forEach(({ m, i }, k) => {
      const start = new Date(m.inizio + "T00:00:00");
      const nW = (typeof nSettDi === "function") ? nSettDi(m) : 4;
      // fine (esclusa) = inizio del mesociclo successivo dello stesso gruppo, altrimenti inizio + nW settimane
      const succ = mc.slice(k + 1).map(x => x.m).find(mm => new Date(mm.inizio + "T00:00:00") > start);
      const end = succ ? new Date(succ.inizio + "T00:00:00") : new Date(start.getFullYear(), start.getMonth(), start.getDate() + nW * 7);
      const endIncl = new Date(end.getTime() - 86400000);
      out.push({
        key: g + ":" + m.inizio, gruppo: g,
        start, end, startISO: _riepISO(start), endISO: _riepISO(end), endInclISO: _riepISO(endIncl),
        nW, nome: m.blocco || m.ciclo || m.focus || ("Mesociclo " + (i + 1)), focus: m.focus || "", ciclo: m.ciclo || ""
      });
    });
  });
  out.sort((a, b) => b.start - a.start); // più recenti in cima
  return out;
}
// blocco di default: quello che contiene oggi (gruppo con più atleti), altrimenti l'ultimo concluso
function _riepMesoDefault(liste) {
  if (!liste || !liste.length) return null;
  const oggi = _riepISO(new Date());
  const dentro = liste.filter(w => oggi >= w.startISO && oggi <= w.endInclISO);
  if (dentro.length) { dentro.sort((a, b) => _riepNAtl(b.gruppo) - _riepNAtl(a.gruppo)); return dentro[0].key; }
  const passati = liste.filter(w => oggi > w.endInclISO);   // già ordinata desc
  if (passati.length) return passati[0].key;
  return liste[0].key;
}

// ---------- calcoli per atleta sul blocco ----------
function _riepCarico(s) { return (Number(s.durata_min) || 60) * (Number(s.rpe) || 5); } // sRPE
// ACWR alla fine del periodo: carico ultimi 7 gg / media settimanale su 28 gg
function _riepAcwr(id, endISO) {
  const sv = ((DEMO.seduteSvolte || {})[id] || []).filter(s => s.tipo !== "extra" && s.data && s.data <= endISO);
  if (sv.length < 3) return null;
  const end = new Date(endISO + "T00:00:00").getTime();
  const dISO = n => _riepISO(new Date(end - n * 86400000));
  const loadTra = (da, a) => sv.filter(s => s.data >= da && s.data <= a).reduce((t, s) => t + _riepCarico(s), 0);
  const acuto = loadTra(dISO(6), endISO), cronico = loadTra(dISO(27), endISO) / 4;
  return cronico > 0 ? Math.round(acuto / cronico * 100) / 100 : null;
}
// migliori tempi (velocità: min) o misure (lanci: max) per distanza/attrezzo, dalle sedute pista chiuse nel periodo
function _riepBest(id, disc, fromISO, toISO) {
  const sv = ((DEMO.seduteSvolte || {})[id] || []).filter(s => s.tipo === "pista" && s.data && s.data >= fromISO && s.data <= toISO);
  const isLanci = disc === "lanci", map = {};
  sv.forEach(s => ((s.dati && s.dati.elementi) || []).forEach(e => {
    if (isLanci) {
      const vals = (e.misure || []).map(Number).filter(v => !isNaN(v) && v > 0);
      if (!vals.length) return;
      const k = e.mezzo || "lanci", best = Math.max(...vals);
      if (map[k] == null || best > map[k]) map[k] = best;
    } else {
      const vals = (e.tempi || []).map(Number).filter(v => !isNaN(v) && v > 0);
      if (!vals.length || !e.distanza) return;
      const k = e.distanza + "m", best = Math.min(...vals);
      if (map[k] == null || best < map[k]) map[k] = best;
    }
  }));
  return map;
}
function _riepStats(a, win) {
  const id = a.id;
  const done = ((DEMO.seduteSvolte || {})[id] || []).filter(s => s.tipo !== "extra" && s.data >= win.startISO && s.data <= win.endInclISO);
  const nPista = done.filter(s => s.tipo === "pista").length, nPal = done.length - nPista;
  const programmate = (typeof contaProgrammate === "function") ? contaProgrammate(a, win.startISO, win.endInclISO) : 0;
  const aderenza = programmate > 0 ? Math.round(done.length / programmate * 100) : null;
  const caricoTot = Math.round(done.reduce((t, s) => t + _riepCarico(s), 0));
  const acwr = _riepAcwr(id, win.endInclISO);
  const dia = ((DEMO.diariStorico || {})[id] || []).filter(v => v.data >= win.startISO && v.data <= win.endInclISO).sort((x, y) => x.data < y.data ? -1 : 1);
  const pr = dia.map(v => v.prontezza).filter(x => x != null);
  const prontMedia = pr.length ? Math.round(pr.reduce((s, x) => s + x, 0) / pr.length * 10) / 10 : null;
  const son = dia.map(v => Number(v.oreSonno)).filter(x => !isNaN(x) && x > 0);
  const sonnoMedio = son.length ? Math.round(son.reduce((s, x) => s + x, 0) / son.length * 10) / 10 : null;
  const g = (typeof gruppoDi === "function") ? gruppoDi(a) : "vel";
  const inf = (DEMO.infortuni || []).filter(i => i.atleta === id && i.stato !== "Risolto");
  const fastidi = done.filter(s => s.fastidi).length;
  // volume corsa (mezzo) blocco vs blocco precedente
  const lenGiorni = Math.max(7, Math.round((win.end - win.start) / 86400000));
  const prevFrom = _riepISO(new Date(win.start.getTime() - lenGiorni * 86400000));
  const prevTo = _riepISO(new Date(win.start.getTime() - 86400000));
  let km = null, kmPrev = null;
  if (g === "mezzo" && typeof kmFattiPeriodo === "function") {
    km = kmFattiPeriodo(a, win.startISO, win.endInclISO);
    kmPrev = kmFattiPeriodo(a, prevFrom, prevTo);
  }
  const best = _riepBest(id, a.disciplina, win.startISO, win.endInclISO);
  const bestPrev = _riepBest(id, a.disciplina, prevFrom, prevTo);
  return { a, id, g, disc: a.disciplina, done, nPista, nPal, programmate, aderenza, caricoTot, acwr, prontMedia, sonnoMedio, dia, inf, fastidi, km, kmPrev, best, bestPrev };
}
function _riepAvvisi(st) {
  const av = [];
  if (st.inf.length) av.push({ lv: "r", t: st.inf.length + (st.inf.length === 1 ? " infortunio" : " infortuni") });
  if (st.acwr != null && st.acwr > 1.5) av.push({ lv: "r", t: "ACWR " + st.acwr.toFixed(2) });
  else if (st.acwr != null && st.acwr < 0.8) av.push({ lv: "y", t: "carico basso" });
  if (st.prontMedia != null && st.prontMedia < 2.5) av.push({ lv: "y", t: "prontezza " + st.prontMedia });
  if (st.aderenza != null && st.aderenza < 70) av.push({ lv: "y", t: "aderenza " + st.aderenza + "%" });
  if (st.fastidi) av.push({ lv: "y", t: st.fastidi + " con fastidi" });
  return av;
}
function _riepSev(st) { const av = _riepAvvisi(st); return av.some(x => x.lv === "r") ? 0 : (av.some(x => x.lv === "y") ? 1 : 2); }

// ---------- progressi (tempi/misure/km) di una scheda atleta ----------
function _riepProgressi(st) {
  if (st.g === "mezzo") {
    let s = "";
    if (st.km != null) {
      const d = st.kmPrev != null ? Math.round((st.km - st.kmPrev) * 10) / 10 : null;
      const col = d == null ? "" : (d > 0 ? "g" : (d < 0 ? "y" : ""));
      s += `<p class="sub" style="margin:4px 0"><b>Volume:</b> ${st.km} km nel blocco${d != null ? ` <span class="${col}">(${d > 0 ? "+" : ""}${d} km vs blocco prec.)</span>` : ""}</p>`;
    }
    const nota = (typeof _notaTempiMezzo === "function") ? _notaTempiMezzo(st.id) : "";
    if (nota) s += `<p class="sub" style="margin:2px 0">${nota}</p>`;
    return s;
  }
  const keys = Object.keys(st.best);
  if (!keys.length) return "";
  const isLanci = st.g === "lanci";
  // le chiavi sono "60m"/"100m" (dalla distanza) → ordino per numero; per i lanci sono nomi attrezzo → alfabetico
  keys.sort((x, y) => isLanci ? x.localeCompare(y) : (parseFloat(x) || 0) - (parseFloat(y) || 0));
  const rows = keys.map(k => {
    const b = st.best[k], p = st.bestPrev[k];
    let delta = "—", cls = "";
    if (p != null) {
      const migliorato = isLanci ? b > p : b < p; // tempo: più basso è meglio; misura: più alto è meglio
      cls = b === p ? "" : (migliorato ? "g" : "r");
      delta = b === p ? "=" : `${migliorato ? "↑" : "↓"} ${_rFmtMis(st.disc, Math.abs(b - p), k)}`;
    }
    return `<tr><td>${k}</td><td><b>${_rFmtMis(st.disc, b, k)}</b></td><td class="${cls}">${delta}</td></tr>`;
  }).join("");
  return `<table class="rs-mini"><tr><th>${isLanci ? "Attrezzo" : "Distanza"}</th><th>Meglio nel blocco</th><th>Δ vs prec.</th></tr>${rows}</table>`;
}
// ---------- scheda dettagliata di un atleta ----------
function _riepSchedaAtleta(st) {
  const a = st.a;
  const kpi = `<div class="kpi">
    <div class="box"><div class="k">Svolti</div><div class="v">${st.done.length}</div><div class="k">${st.nPista} pista · ${st.nPal} pal${st.programmate ? " · su " + st.programmate : ""}</div></div>
    <div class="box"><div class="k">Aderenza</div><div class="v ${st.aderenza != null ? _rClsAder(st.aderenza) : ""}">${st.aderenza != null ? st.aderenza + "%" : "—"}</div></div>
    <div class="box"><div class="k">Carico (sRPE)</div><div class="v">${st.caricoTot || "—"}</div><div class="k">ACWR ${st.acwr != null ? st.acwr.toFixed(2) : "—"}</div></div>
    <div class="box"><div class="k">Prontezza</div><div class="v ${st.prontMedia != null ? _rClsPront(st.prontMedia) : ""}">${st.prontMedia != null ? st.prontMedia : "—"}</div><div class="k">${st.sonnoMedio != null ? "sonno " + st.sonnoMedio + " h" : "&nbsp;"}</div></div>
  </div>`;
  const prog = _riepProgressi(st);
  const pbars = st.dia.filter(v => v.prontezza != null).slice(-10).map(v => ({ v: Math.round(v.prontezza * 10) / 10, lab: (v.data || "").slice(8, 10) + "/" + (v.data || "").slice(5, 7) }));
  const salute = pbars.length ? `<p class="sub" style="margin-top:6px"><b>Prontezza nel blocco</b> ${st.dia.length} diari</p>${(typeof _svgBars === "function") ? _svgBars(pbars) : ""}` : `<p class="sub muted" style="margin-top:6px">Nessun diario compilato nel blocco.</p>`;
  const infHtml = st.inf.length ? `<p class="sub r" style="margin-top:6px"><b>⚠ Infortuni/fastidi in corso:</b> ${st.inf.map(i => `${i.zona || ""}${i.lato ? " " + i.lato : ""}${i.tipo ? " (" + i.tipo + ")" : ""}`).join(" · ")}</p>` : "";
  const av = _riepAvvisi(st);
  const avHtml = av.length
    ? `<div class="rs-tags">${av.map(x => `<span class="rs-tag ${x.lv}">${x.lv === "r" ? "🔴" : "🟡"} ${x.t}</span>`).join("")}</div>`
    : `<div class="rs-tags"><span class="rs-tag g">🟢 Nessun avviso</span></div>`;
  return `<div class="rs-card">
    <div class="rs-head"><h3 class="rs-nome">${a.nome}</h3><span class="rs-disc">${_riepGLabel(st.g)}${a.specialita ? " · " + a.specialita : ""}</span></div>
    ${avHtml}${kpi}${prog}${salute}${infHtml}
  </div>`;
}

// ---------- corpo del documento ----------
function _riepBodyHTML(win) {
  const brand = (typeof CONFIG !== "undefined" && CONFIG.nome) ? CONFIG.nome : "Metis Performance";
  const oggiL = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const oggi = _riepISO(new Date());
  const inCorso = win.startISO <= oggi && oggi <= win.endInclISO;
  // se il blocco è in corso i conti si fermano a oggi (altrimenti l'aderenza conterebbe sedute future)
  const calcEnd = win.endInclISO > oggi ? oggi : win.endInclISO;
  const w = Object.assign({}, win, { endInclISO: calcEnd });

  const atleti = (DEMO.atleti || []).filter(a => !a.bloccato);
  const stats = atleti.map(a => _riepStats(a, w)).filter(st => st.done.length > 0 || st.programmate > 0 || st.dia.length > 0);
  stats.sort((x, y) => _riepSev(x) - _riepSev(y) || (y.done.length - x.done.length) || String(x.a.nome).localeCompare(String(y.a.nome)));

  const cover = `<div class="cover">
    <div class="cover-brand"><img class="cover-logo" src="icon-192.png" alt="" onerror="this.style.display='none'"><span>${brand}</span></div>
    <div class="cover-hero"><div>
      <div class="cover-name">Riepilogo mesociclo</div>
      <div class="cover-sub">${_riepGLabel(win.gruppo)}${win.nome ? " · " + win.nome : ""}${win.focus ? " · focus: " + win.focus : ""}</div>
    </div></div>
    <div class="cover-meta">Blocco dal ${_rDataL(win.startISO)} al ${_rDataL(win.endInclISO)} · ${win.nW} settimane · squadra (${stats.length} ${stats.length === 1 ? "atleta" : "atleti"})${inCorso ? " · <b>in corso</b>, dati fino a oggi" : ""} · generato il ${oggiL}</div>
  </div>`;

  if (!stats.length) return cover + `<p class="muted" style="margin-top:14px">Nessun atleta ha allenamenti, diari o sedute programmate in questo blocco. Controlla le date del mesociclo o scegline un altro.</p>`;

  // --- KPI di squadra ---
  const totSvolti = stats.reduce((t, s) => t + s.done.length, 0);
  const prV = stats.map(s => s.prontMedia).filter(x => x != null);
  const prSq = prV.length ? Math.round(prV.reduce((a, b) => a + b, 0) / prV.length * 10) / 10 : null;
  const adV = stats.map(s => s.aderenza).filter(x => x != null);
  const adSq = adV.length ? Math.round(adV.reduce((a, b) => a + b, 0) / adV.length) : null;
  const nAvvisi = stats.filter(s => _riepAvvisi(s).length).length;
  const kpiSq = `<div class="kpi">
    <div class="box"><div class="k">Atleti nel blocco</div><div class="v">${stats.length}</div></div>
    <div class="box"><div class="k">Allenamenti svolti</div><div class="v">${totSvolti}</div></div>
    <div class="box"><div class="k">Aderenza media</div><div class="v ${adSq != null ? _rClsAder(adSq) : ""}">${adSq != null ? adSq + "%" : "—"}</div></div>
    <div class="box"><div class="k">Prontezza media</div><div class="v ${prSq != null ? _rClsPront(prSq) : ""}">${prSq != null ? prSq : "—"}</div></div>
    <div class="box"><div class="k">Con avvisi</div><div class="v ${nAvvisi ? "y" : "g"}">${nAvvisi}</div></div>
  </div>`;

  // --- highlight ---
  const conAder = stats.filter(s => s.aderenza != null).sort((a, b) => b.aderenza - a.aderenza);
  const topAder = conAder[0];
  const topCar = stats.slice().sort((a, b) => b.caricoTot - a.caricoTot)[0];
  const topKm = stats.filter(s => s.km != null && s.kmPrev != null).map(s => ({ s, d: s.km - s.kmPrev })).sort((a, b) => b.d - a.d)[0];
  const rischio = stats.filter(s => _riepAvvisi(s).some(x => x.lv === "r"));
  const hi = [];
  if (topAder && topAder.aderenza != null) hi.push({ lv: "g", t: `<b>Più costante:</b> ${topAder.a.nome} (${topAder.aderenza}% aderenza)` });
  if (topCar && topCar.caricoTot) hi.push({ lv: "", t: `<b>Carico più alto:</b> ${topCar.a.nome} (${topCar.caricoTot} u.a.)` });
  if (topKm && topKm.d > 0) hi.push({ lv: "g", t: `<b>Più km del blocco prec.:</b> ${topKm.s.a.nome} (+${Math.round(topKm.d * 10) / 10} km)` });
  if (rischio.length) hi.push({ lv: "r", t: `<b>Da tenere d'occhio:</b> ${rischio.map(s => s.a.nome).join(", ")}` });
  const bd = lv => lv === "g" ? "#1a7a3a" : lv === "y" ? "#a86800" : lv === "r" ? "#b02a37" : "#2B4C7E";
  const highlight = hi.length ? `<h2>In evidenza</h2><div style="display:flex;flex-wrap:wrap;gap:8px">${hi.map(x => `<div style="flex:1;min-width:200px;border:1px solid #d7dde7;border-left:4px solid ${bd(x.lv)};border-radius:6px;padding:7px 10px;font-size:12.5px">${x.t}</div>`).join("")}</div>` : "";

  // --- tabella di sintesi ---
  const rows = stats.map(st => {
    const av = _riepAvvisi(st);
    const ico = av.length ? av.map(x => x.lv === "r" ? "🔴" : "🟡").join("") : "🟢";
    return `<tr>
      <td>${st.a.nome}</td>
      <td>${_riepGLabel(st.g)}</td>
      <td>${st.done.length}${st.programmate ? "/" + st.programmate : ""}</td>
      <td class="${st.aderenza != null ? _rClsAder(st.aderenza) : ""}">${st.aderenza != null ? st.aderenza + "%" : "—"}</td>
      <td>${st.caricoTot || "—"}</td>
      <td class="${st.acwr != null ? _rClsAcwr(st.acwr) : ""}">${st.acwr != null ? st.acwr.toFixed(2) : "—"}</td>
      <td class="${st.prontMedia != null ? _rClsPront(st.prontMedia) : ""}">${st.prontMedia != null ? st.prontMedia : "—"}</td>
      <td>${st.sonnoMedio != null ? st.sonnoMedio + " h" : "—"}</td>
      <td>${st.km != null ? st.km + " km" : "—"}</td>
      <td>${ico}</td>
    </tr>`;
  }).join("");
  const tabella = `<h2>Sintesi di squadra</h2>
    <div style="overflow-x:auto"><table>
    <tr><th>Atleta</th><th>Gruppo</th><th>Svolti</th><th>Aderenza</th><th>Carico</th><th>ACWR</th><th>Prontezza</th><th>Sonno</th><th>Km</th><th>Stato</th></tr>
    ${rows}</table></div>
    <p class="sub muted" style="margin-top:4px">Svolti = fatti/programmati · Carico = sRPE totale (durata × RPE) · ACWR zona sicura 0.8–1.3 · Km solo mezzofondo/fondo.</p>`;

  // --- dettaglio per atleta ---
  const dettaglio = `<div style="page-break-before:always"></div><h2>Dettaglio per atleta</h2>${stats.map(_riepSchedaAtleta).join("")}`;

  return cover + kpiSq + highlight + tabella + dettaglio
    + `<div class="foot">${brand} · Riepilogo mesociclo · «Chi non pianifica è destinato a fallire.»</div>`
    + `<div class="print-footer">${brand} · Riepilogo mesociclo ${_riepGLabel(win.gruppo)} · ${_rDataL(win.startISO)}–${_rDataL(win.endInclISO)}</div>`;
}

const _RIEP_CSS = `
#app-report .rs-card{border:1px solid #d8dde6;border-radius:8px;padding:11px 13px;margin:10px 0;page-break-inside:avoid}
#app-report .rs-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:1px solid #e3e7ee;padding-bottom:5px;margin-bottom:6px}
#app-report .rs-nome{margin:0;font-size:16px;color:#2B4C7E}
#app-report .rs-disc{font-size:12px;color:#5a6472}
#app-report .rs-tags{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px}
#app-report .rs-tag{font-size:11px;border:1px solid #d7dde7;border-radius:20px;padding:2px 9px;background:#f5f8fc}
#app-report .rs-tag.r{border-color:#e6b8bd;background:#fbeff0;color:#b02a37}
#app-report .rs-tag.y{border-color:#eddcb0;background:#fbf5e6;color:#a86800}
#app-report .rs-tag.g{border-color:#bfe3c9;background:#eef8f1;color:#1a7a3a}
#app-report .rs-card .kpi{margin-top:6px}
#app-report .rs-card .kpi .box{min-width:96px}
#app-report .rs-card .kpi .v{font-size:19px}
#app-report table.rs-mini{width:auto;min-width:260px;margin-top:6px}
#app-report table.rs-mini th{font-size:11px}
`;

// ---------- vista ----------
function vistaRiepilogoMeso() {
  const liste = _riepMesocicliLista();
  const barra = (extra) => `<div class="no-print" style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
      <button class="btn btn-2" style="width:auto;padding:9px 14px" onclick="chiudiRiepilogoMeso()">‹ Indietro</button>
      ${extra || ""}</div>`;
  if (!liste.length) {
    return `<style>${_REPORT_CSS}</style>${barra()}
      <div class="card"><p class="et">Nessun mesociclo con <b>data d'inizio</b> impostata. Vai in <b>Programma → Pista</b>, imposta la data d'inizio dei mesocicli, poi torna qui.</p></div>`;
  }
  const key = (S.riepMeso && S.riepMeso !== "__nessuno__") ? S.riepMeso : _riepMesoDefault(liste);
  const win = liste.find(w => w.key === key) || liste[0];
  const sel = `<select onchange="setRiepMesoSel(this.value)" style="padding:7px 10px;border-radius:8px;max-width:100%">
    ${liste.map(w => `<option value="${w.key}" ${w.key === win.key ? "selected" : ""}>${_riepGLabel(w.gruppo)} · ${w.nome} · ${_riepDMY(w.start)}–${_riepDMY(new Date(w.end.getTime() - 86400000))}</option>`).join("")}
  </select>`;
  return `<style>${_REPORT_CSS}${_RIEP_CSS}</style>
    ${barra(`<button class="btn" style="width:auto;padding:9px 16px" onclick="window.print()">🖨 Stampa / Salva PDF</button>`)}
    <div class="no-print" style="display:flex;gap:6px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <span class="et" style="margin:0 2px 0 0">Mesociclo:</span>${sel}
      <span class="et" style="margin:0 0 0 6px;color:var(--muted,#8a94a3)">Le discipline hanno blocchi diversi: scegli quale riassumere. Premi <b>Stampa › Salva come PDF</b>.</span>
    </div>
    <div id="app-report">${_riepBodyHTML(win)}</div>`;
}
