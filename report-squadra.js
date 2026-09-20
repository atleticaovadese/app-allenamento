// Riepilogo di fine MESOCICLO, UNA DISCIPLINA per volta (velocisti / lanci / mezzofondo separati) → PDF.
// Struttura: condizione della squadra (aderenza & co.) + poi GIORNO PER GIORNO:
//   per ogni giorno del programma esce prima il programma con la progressione delle N settimane (es. 3+1 = 4 lunedì),
//   poi, atleta per atleta, come è andato quel giorno (svolti X/N, tempi/volume/misure primo→ultimo, RPE, forma).
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
function _riepEsc(t) { return String(t == null ? "" : t).replace(/</g, "&lt;"); }
const _RIEP_GG_TIT = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
function _riepWdIdx(giornoSett) { return (typeof GG_ISO !== "undefined") ? GG_ISO.indexOf(giornoSett) : -1; }
function _riepWdLabel(giornoSett, n) { const i = _riepWdIdx(giornoSett); return i >= 0 ? _RIEP_GG_TIT[i] : ("Giorno " + (n || "")); }

// ---------- elenco dei mesocicli selezionabili (da ogni gruppo, quelli con data d'inizio) ----------
function _riepMesocicliLista() {
  const grp = (typeof GRUPPI_PROG !== "undefined") ? GRUPPI_PROG : [["vel"], ["lanci"], ["mezzo"]];
  const out = [];
  grp.forEach(([g]) => {
    const prog = (typeof pistaDi === "function") ? pistaDi(g) : null;
    const mc = ((prog && prog.mesocicli) || []).map((m, i) => ({ m, i })).filter(x => x.m.inizio);
    mc.forEach(({ m, i }, k) => {
      const start = new Date(m.inizio + "T00:00:00");
      const nW = (typeof nSettDi === "function") ? nSettDi(m) : 4;
      const succ = mc.slice(k + 1).map(x => x.m).find(mm => new Date(mm.inizio + "T00:00:00") > start);
      const end = succ ? new Date(succ.inizio + "T00:00:00") : new Date(start.getFullYear(), start.getMonth(), start.getDate() + nW * 7);
      const endIncl = new Date(end.getTime() - 86400000);
      out.push({
        key: g + ":" + m.inizio, gruppo: g, meso: m,
        start, end, startISO: _riepISO(start), endISO: _riepISO(end), endInclISO: _riepISO(endIncl),
        nW, nome: m.blocco || m.ciclo || m.focus || ("Mesociclo " + (i + 1)), focus: m.focus || "", ciclo: m.ciclo || ""
      });
    });
  });
  out.sort((a, b) => b.start - a.start);
  return out;
}
function _riepMesoDefault(liste) {
  if (!liste || !liste.length) return null;
  const oggi = _riepISO(new Date());
  const dentro = liste.filter(w => oggi >= w.startISO && oggi <= w.endInclISO);
  if (dentro.length) { dentro.sort((a, b) => _riepNAtl(b.gruppo) - _riepNAtl(a.gruppo)); return dentro[0].key; }
  const passati = liste.filter(w => oggi > w.endInclISO);
  if (passati.length) return passati[0].key;
  return liste[0].key;
}

// ---------- condizione dell'atleta sul blocco (aderenza, carico, prontezza…) ----------
function _riepCarico(s) { return (Number(s.durata_min) || 60) * (Number(s.rpe) || 5); }
function _riepAcwr(id, endISO) {
  const sv = ((DEMO.seduteSvolte || {})[id] || []).filter(s => s.tipo !== "extra" && s.data && s.data <= endISO);
  if (sv.length < 3) return null;
  const end = new Date(endISO + "T00:00:00").getTime();
  const dISO = n => _riepISO(new Date(end - n * 86400000));
  const loadTra = (da, a) => sv.filter(s => s.data >= da && s.data <= a).reduce((t, s) => t + _riepCarico(s), 0);
  const acuto = loadTra(dISO(6), endISO), cronico = loadTra(dISO(27), endISO) / 4;
  return cronico > 0 ? Math.round(acuto / cronico * 100) / 100 : null;
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
  let km = null;
  if (g === "mezzo" && typeof kmFattiPeriodo === "function") km = kmFattiPeriodo(a, win.startISO, win.endInclISO);
  return { a, id, g, disc: a.disciplina, done, nPista, nPal, programmate, aderenza, caricoTot, acwr, prontMedia, sonnoMedio, dia, inf, fastidi, km };
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

// ---------- programma di un giorno (righe per settimana) ----------
function _riepRigaPista(r, g) {
  if (g === "lanci") return _riepEsc(`${r.mezzo || r.contenuto || ""}${r.kg ? " " + r.kg + "kg" : ""}${r.n ? " ×" + r.n : ""}${r.tipo ? " (" + r.tipo + ")" : ""}${r.rec ? " · rec " + r.rec : ""}`.trim());
  if (g === "mezzo") return _riepEsc(`${r.mezzo || r.contenuto || ""}${(Number(r.distanza) > 0) ? " " + (Number(r.n) > 0 ? r.n + "×" : "") + r.distanza + "m" : ""}${r.min ? " " + r.min + "′" : ""}${r.rec ? " · rec " + r.rec : ""}`.trim());
  return _riepEsc(`${r.contenuto || ""}${(r.distanza && r.n) ? " " + r.n + "×" + r.distanza + "m" : ""}${r.perc ? " @" + r.perc + "%" : ""}${r.rec ? " · rec " + r.rec : ""}`.trim());
}
function _riepRigaPal(r) { return _riepEsc(`${r.esercizio || ""}${(r.serie && r.rep) ? " " + r.serie + "×" + r.rep : ""}${r.perc ? " @" + r.perc + "%" : ""}${r.tut ? " · TUT " + r.tut : ""}${r.rec ? " · rec " + r.rec : ""}`.trim()); }
function _riepRigaValida(r, tipo, g) { return tipo === "palestra" ? !!r.esercizio : !!(r.contenuto || r.mezzo || Number(r.distanza) > 0 || (g === "mezzo" && r.min)); }
function _riepProgrammaGiorno(g, tipo, m, giorno) {
  const nSett = (typeof nSettDi === "function") ? nSettDi(m) : ((giorno.settimane || []).length || 4);
  const rigaFn = tipo === "palestra" ? _riepRigaPal : (x => _riepRigaPista(x, g));
  const rows = [];
  for (let k = 0; k < nSett; k++) {
    const w = giorno.settimane && giorno.settimane[k];
    const righe = ((w && w.righe) || []).filter(r => _riepRigaValida(r, tipo, g)).map(rigaFn).filter(Boolean);
    const scar = (typeof isScaricoIdx === "function") ? isScaricoIdx(m, k) : (k === nSett - 1);
    rows.push(`<tr><td class="wk">Sett ${k + 1}${scar ? " ⬇" : ""}</td><td>${righe.length ? righe.map(r => `<div>${r}</div>`).join("") : '<span class="muted">— riposo/vuoto</span>'}</td></tr>`);
  }
  return `<table class="lavtab"><tbody>${rows.join("")}</tbody></table>`;
}

// ---------- date di un giorno (una per settimana) all'interno del mesociclo ----------
function _riepGiorniDate(m, giorno) {
  const nSett = (typeof nSettDi === "function") ? nSettDi(m) : 4;
  const inizio = new Date(m.inizio + "T00:00:00");
  const wdTarget = _riepWdIdx(giorno.giornoSett);
  const out = [];
  for (let k = 0; k < nSett; k++) {
    const ws = new Date(inizio); ws.setDate(inizio.getDate() + k * 7);
    let off = 0;
    if (wdTarget >= 0) off = (wdTarget - ((ws.getDay() + 6) % 7) + 7) % 7;
    const d = new Date(ws); d.setDate(ws.getDate() + off);
    out.push({ k, iso: _riepISO(d) });
  }
  return out;
}
// metriche di UNA seduta svolta (tempo migliore, volume metri, misura, tonnellaggio, km, rpe)
function _riepMetriche(s, g) {
  const d = s.dati || {}, out = { rpe: (s.rpe != null ? Number(s.rpe) : null) };
  if (s.tipo === "palestra") {
    let ton = 0; (d.esercizi || []).forEach(x => { const se = Number(x.serie) || 0, re = Number(x.rep) || 0, pe = Number(x.peso) || 0; ton += se * re * pe; });
    out.ton = ton || null; return out;
  }
  if (g === "lanci") {
    let best = null, n = 0; (d.elementi || []).forEach(e => (e.misure || []).forEach(v => { const x = Number(v); if (!isNaN(x) && x > 0) { n++; if (best == null || x > best) best = x; } }));
    out.mis = best; out.nLanci = n || null; return out;
  }
  if (g === "mezzo") {
    out.km = (typeof volumePistaMezzo === "function") ? Math.round(volumePistaMezzo(s) / 100) / 10 : null;
    let best = null; (d.elementi || []).forEach(e => (e.tempi || []).forEach(v => { const x = Number(v); if (!isNaN(x) && x > 0 && (best == null || x < best)) best = x; }));
    out.tempo = best; return out;
  }
  let best = null, volM = 0;
  (d.elementi || []).forEach(e => {
    (e.tempi || []).forEach(v => { const x = Number(v); if (!isNaN(x) && x > 0 && (best == null || x < best)) best = x; });
    const rip = Number(e.ripetute) || 0, dist = Number(e.distanza) || 0; if (rip && dist) volM += rip * dist;
  });
  out.tempo = best; out.volumeM = volM || null; return out;
}
// come è andato UN giorno per UN atleta (nelle N settimane)
function _riepGiornoAtleta(a, g, tipo, m, giorno) {
  const dates = _riepGiorniDate(m, giorno);
  const sv = (DEMO.seduteSvolte || {})[a.id] || [];
  const done = [];
  dates.forEach(({ k, iso }) => {
    const s = sv.find(x => x.data === iso && x.tipo === tipo);
    if (s) done.push({ k, s, met: _riepMetriche(s, g) });
  });
  const N = dates.filter(({ k }) => { const w = giorno.settimane && giorno.settimane[k]; return ((w && w.righe) || []).some(r => _riepRigaValida(r, tipo, g)); }).length || dates.length;
  return { done: done.sort((x, y) => x.k - y.k), N };
}
function _riepGiornoAtletaLinea(a, info, g) {
  const N = info.N;
  if (!info.done.length) return `<div class="rs-al"><b>${_riepEsc(a.nome)}</b> <span class="muted">— nessuna seduta svolta (0/${N})</span></div>`;
  const done = info.done, first = done[0].met, last = done[done.length - 1].met, multi = done.length > 1;
  const parts = [];
  const disc = a.disciplina;
  if (first.tempo != null && last.tempo != null) {
    const dlt = last.tempo - first.tempo, cls = !multi || dlt === 0 ? "" : (dlt < 0 ? "g" : "r");
    parts.push(`tempo ${_rFmtMis(disc, first.tempo)}${multi ? " → " + _rFmtMis(disc, last.tempo) + ` <span class="${cls}">(${dlt < 0 ? "−" : dlt > 0 ? "+" : ""}${_rFmtMis(disc, Math.abs(dlt))})</span>` : ""}`);
  }
  if (first.volumeM != null && last.volumeM != null) {
    const dv = last.volumeM - first.volumeM, cls = !multi || dv === 0 ? "" : (dv > 0 ? "g" : "y");
    parts.push(`volume ${first.volumeM}${multi ? "→" + last.volumeM : ""} m${multi && dv !== 0 ? ` <span class="${cls}">(${dv > 0 ? "+" : ""}${dv} m)</span>` : ""}`);
  }
  if (first.mis != null && last.mis != null) {
    const dm = last.mis - first.mis, cls = !multi || dm === 0 ? "" : (dm > 0 ? "g" : "r");
    parts.push(`misura ${first.mis.toFixed(2)}${multi ? "→" + last.mis.toFixed(2) : ""} m${multi && dm !== 0 ? ` <span class="${cls}">(${dm > 0 ? "+" : ""}${dm.toFixed(2)})</span>` : ""}`);
  }
  if (g === "mezzo") { const kmTot = done.reduce((t, x) => t + (x.met.km || 0), 0); if (kmTot) parts.push(`${Math.round(kmTot * 10) / 10} km totali`); }
  if (done.some(x => x.met.ton)) { const t0 = first.ton, t1 = last.ton; if (t0 && t1) { const dt = t1 - t0, cls = !multi || dt === 0 ? "" : (dt > 0 ? "g" : "y"); parts.push(`carico sala ${Math.round(t0 / 100) / 10}${multi ? "→" + Math.round(t1 / 100) / 10 : ""} t${multi && dt !== 0 ? ` <span class="${cls}">(${dt > 0 ? "+" : ""}${Math.round(dt / 100) / 10} t)</span>` : ""}`); } }
  const rpes = done.map(x => x.met.rpe).filter(v => v != null);
  if (rpes.length) parts.push(`RPE medio ${Math.round(rpes.reduce((s, x) => s + x, 0) / rpes.length * 10) / 10}`);
  const fastidi = done.filter(x => x.s.fastidi).length; if (fastidi) parts.push(`<span class="y">${fastidi} con fastidi</span>`);
  const allDone = done.length >= N && N > 0;
  const svCls = allDone ? "g" : "y";
  return `<div class="rs-al"><b>${_riepEsc(a.nome)}</b> — <span class="${svCls}">svolti ${done.length}/${N}</span>${parts.length ? " · " + parts.join(" · ") : ""}</div>`;
}

// ---------- corpo del documento (una disciplina) ----------
function _riepBodyHTML(win) {
  const brand = (typeof CONFIG !== "undefined" && CONFIG.nome) ? CONFIG.nome : "Metis Performance";
  const oggiL = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const oggi = _riepISO(new Date());
  const g = win.gruppo;
  const inCorso = win.startISO <= oggi && oggi <= win.endInclISO;
  const calcEnd = win.endInclISO > oggi ? oggi : win.endInclISO;
  const w = Object.assign({}, win, { endInclISO: calcEnd });
  const cicloTxt = win.ciclo ? (" · ciclo " + win.ciclo) : "";

  const atleti = ((typeof atletiDelGruppo === "function") ? atletiDelGruppo(g) : (DEMO.atleti || []).filter(a => (typeof gruppoDi === "function" ? gruppoDi(a) : "vel") === g)).filter(a => !a.bloccato);

  const cover = `<div class="cover">
    <div class="cover-brand"><img class="cover-logo" src="icon-192.png" alt="" onerror="this.style.display='none'"><span>${brand}</span></div>
    <div class="cover-hero"><div>
      <div class="cover-name">Riepilogo mesociclo — ${_riepGLabel(g)}</div>
      <div class="cover-sub">${win.nome}${win.focus ? " · focus: " + win.focus : ""}${cicloTxt}</div>
    </div></div>
    <div class="cover-meta">Blocco dal ${_rDataL(win.startISO)} al ${_rDataL(win.endInclISO)} · ${win.nW} settimane · ${atleti.length} ${atleti.length === 1 ? "atleta" : "atleti"}${inCorso ? " · <b>in corso</b>, dati fino a oggi" : ""} · generato il ${oggiL}</div>
  </div>`;

  if (!atleti.length) return cover + `<p class="muted" style="margin-top:14px">Nessun atleta in questa disciplina.</p>`;

  const stats = atleti.map(a => _riepStats(a, w));
  stats.sort((x, y) => _riepSev(x) - _riepSev(y) || (y.done.length - x.done.length) || String(x.a.nome).localeCompare(String(y.a.nome)));

  // --- condizione della squadra ---
  const totSvolti = stats.reduce((t, s) => t + s.done.length, 0);
  const prV = stats.map(s => s.prontMedia).filter(x => x != null);
  const prSq = prV.length ? Math.round(prV.reduce((a, b) => a + b, 0) / prV.length * 10) / 10 : null;
  const adV = stats.map(s => s.aderenza).filter(x => x != null);
  const adSq = adV.length ? Math.round(adV.reduce((a, b) => a + b, 0) / adV.length) : null;
  const nAvvisi = stats.filter(s => _riepAvvisi(s).length).length;
  const isMezzo = g === "mezzo";
  const kpi = `<h2>Condizione della squadra</h2><div class="kpi">
    <div class="box"><div class="k">Atleti</div><div class="v">${atleti.length}</div></div>
    <div class="box"><div class="k">Allenamenti svolti</div><div class="v">${totSvolti}</div></div>
    <div class="box"><div class="k">Aderenza media</div><div class="v ${adSq != null ? _rClsAder(adSq) : ""}">${adSq != null ? adSq + "%" : "—"}</div></div>
    <div class="box"><div class="k">Prontezza media</div><div class="v ${prSq != null ? _rClsPront(prSq) : ""}">${prSq != null ? prSq : "—"}</div></div>
    <div class="box"><div class="k">Con avvisi</div><div class="v ${nAvvisi ? "y" : "g"}">${nAvvisi}</div></div>
  </div>`;
  const rows = stats.map(st => {
    const av = _riepAvvisi(st), ico = av.length ? av.map(x => x.lv === "r" ? "🔴" : "🟡").join("") : "🟢";
    return `<tr><td>${_riepEsc(st.a.nome)}</td><td>${st.done.length}${st.programmate ? "/" + st.programmate : ""}</td>
      <td class="${st.aderenza != null ? _rClsAder(st.aderenza) : ""}">${st.aderenza != null ? st.aderenza + "%" : "—"}</td>
      <td>${st.caricoTot || "—"}</td>
      <td class="${st.acwr != null ? _rClsAcwr(st.acwr) : ""}">${st.acwr != null ? st.acwr.toFixed(2) : "—"}</td>
      <td class="${st.prontMedia != null ? _rClsPront(st.prontMedia) : ""}">${st.prontMedia != null ? st.prontMedia : "—"}</td>
      <td>${st.sonnoMedio != null ? st.sonnoMedio + " h" : "—"}</td>
      ${isMezzo ? `<td>${st.km != null ? st.km + " km" : "—"}</td>` : ""}
      <td>${ico}</td></tr>`;
  }).join("");
  const tabella = `<div style="overflow-x:auto"><table>
    <tr><th>Atleta</th><th>Svolti</th><th>Aderenza</th><th>Carico</th><th>ACWR</th><th>Prontezza</th><th>Sonno</th>${isMezzo ? "<th>Km</th>" : ""}<th>Stato</th></tr>
    ${rows}</table></div>
    <p class="sub muted" style="margin-top:4px">Svolti = fatti/programmati · Carico = sRPE totale (durata × RPE) · ACWR zona sicura 0.8–1.3.</p>`;

  // --- giorno per giorno ---
  const mP = (typeof pistaDi === "function") ? (pistaDi(g).mesocicli || []).find(m => m.inizio === win.startISO) : null;
  const paL = (typeof mesoAttivo === "function" && typeof palDi === "function") ? mesoAttivo(palDi(g), win.startISO, false) : null;
  const mL = paL ? paL.m : null;
  const entries = [];
  if (mP) (mP.giorni || []).forEach((gio, gi) => entries.push({ wd: _riepWdIdx(gio.giornoSett), n: gi + 1, giornoSett: gio.giornoSett, tipo: "pista", giorno: gio, m: mP }));
  if (mL) (mL.giorni || []).forEach((gio, gi) => entries.push({ wd: _riepWdIdx(gio.giornoSett), n: gi + 1, giornoSett: gio.giornoSett, tipo: "palestra", giorno: gio, m: mL }));
  const hasContent = e => (e.giorno.settimane || []).some(w2 => ((w2.righe) || []).some(r => _riepRigaValida(r, e.tipo, g)));
  const days = entries.filter(hasContent).sort((a, b) => (a.wd < 0 ? 99 : a.wd) - (b.wd < 0 ? 99 : b.wd) || (a.tipo < b.tipo ? -1 : a.tipo > b.tipo ? 1 : 0) || a.n - b.n);

  let dd = `<div style="page-break-before:always"></div><h2>Programma e andamento, giorno per giorno</h2>`;
  if (!days.length) {
    dd += `<p class="muted">Nessun giorno con contenuto nel programma di questo mesociclo.</p>`;
  } else {
    let lastWd = "__";
    days.forEach(e => {
      const wdKey = e.wd + "|" + e.giornoSett;
      if (wdKey !== lastWd) { dd += `<h3 class="rs-wd">${_riepWdLabel(e.giornoSett, e.n)}</h3>`; lastWd = wdKey; }
      const tipoLab = e.tipo === "palestra" ? "Palestra" : (g === "lanci" ? "Campo" : "Pista");
      const nSett = (typeof nSettDi === "function") ? nSettDi(e.m) : 4;
      dd += `<div class="rs-giorno">
        <p class="rs-gtit"><b>${tipoLab}</b>${e.m.focus ? ` · <span class="muted">focus: ${_riepEsc(e.m.focus)}</span>` : ""}</p>
        <p class="sub" style="margin:4px 0 2px"><b>Programma · progressione ${nSett} settimane</b></p>
        ${_riepProgrammaGiorno(g, e.tipo, e.m, e.giorno)}
        <p class="sub" style="margin:8px 0 2px"><b>Come è andata, atleta per atleta</b></p>
        <div class="rs-ally">${atleti.map(a => _riepGiornoAtletaLinea(a, _riepGiornoAtleta(a, g, e.tipo, e.m, e.giorno), g)).join("")}</div>
      </div>`;
    });
  }

  return cover + kpi + tabella + dd
    + `<div class="foot">${brand} · Riepilogo mesociclo ${_riepGLabel(g)} · «Chi non pianifica è destinato a fallire.»</div>`
    + `<div class="print-footer">${brand} · ${_riepGLabel(g)} · ${_rDataL(win.startISO)}–${_rDataL(win.endInclISO)}</div>`;
}

const _RIEP_CSS = `
#app-report .rs-wd{margin:18px 0 4px;font-size:16px;color:#2B4C7E;border-bottom:2px solid #2B4C7E;padding-bottom:3px}
#app-report .rs-giorno{border:1px solid #d8dde6;border-radius:8px;padding:9px 12px;margin:8px 0;page-break-inside:avoid}
#app-report .rs-gtit{margin:0 0 2px;font-size:13.5px;color:#2B4C7E}
#app-report .lavtab{width:100%;border-collapse:collapse;margin-top:2px}
#app-report .lavtab td{border:1px solid #e3e7ee;padding:3px 6px;font-size:12px;vertical-align:top}
#app-report .lavtab td.wk{white-space:nowrap;font-weight:600;color:#2B4C7E;width:70px}
#app-report .rs-ally{margin-top:2px}
#app-report .rs-al{font-size:12.5px;padding:4px 0;border-bottom:1px dotted #e3e7ee;line-height:1.45}
#app-report .rs-al:last-child{border-bottom:none}
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
      <span class="et" style="margin:0 2px 0 0">Disciplina / blocco:</span>${sel}
      <span class="et" style="margin:0 0 0 6px;color:var(--muted,#8a94a3)">Un report per disciplina. Premi <b>Stampa › Salva come PDF</b>.</span>
    </div>
    <div id="app-report">${_riepBodyHTML(win)}</div>`;
}
