// Condividi l'allenamento: card "Metis" stile Strava, pronta per i social.
// Nessuna libreria: la card è un SVG (anteprima = output). La foto scelta dall'atleta è
// ridimensionata sul telefono ed embeddata come data-URI. Per condividere: SVG → canvas → immagine
// → navigator.share (share sheet nativo) con fallback "scarica/tieni premuto per salvare".

function apriCondividi(sid) { S.share = { sid, foto: null, eser: null, el: null }; disegna(); window.scrollTo(0, 0); }
function chiudiCondividi() { S.share = null; disegna(); window.scrollTo(0, 0); }

function _shareEsc(t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function _shareFmtSec(sec) {
  if (sec == null || isNaN(sec)) return "—";
  sec = Number(sec);
  if (sec < 60) return (Math.round(sec * 100) / 100).toFixed(2) + "s";
  const m = Math.floor(sec / 60), s = sec - m * 60, sw = Math.floor(s + 1e-6), cc = Math.round((s - sw) * 100);
  return m + "'" + String(sw).padStart(2, "0") + (cc ? '"' + String(cc).padStart(2, "0") : "");
}
function _shareFmtPace(secPerKm) {
  if (secPerKm == null || !isFinite(secPerKm)) return null;
  const m = Math.floor(secPerKm / 60), s = Math.round(secPerKm - m * 60);
  return m + ":" + String(s).padStart(2, "0");
}

// estrae i numeri "da vetrina" dalla seduta, adattati alla disciplina
function _shareStats(s, a) {
  const g = (typeof gruppoDi === "function") ? gruppoDi(a) : "vel";
  const rpe = s.rpe != null ? { v: String(s.rpe), l: "RPE" } : null;
  const dur = s.durata != null ? { v: String(s.durata) + "′", l: "Durata" } : null;

  if (s.tipo === "palestra") {
    const ex = (s.esercizi || []).filter(x => x && x.nome);
    if (!ex.length) return { chip: "PALESTRA", heroLabel: "SEDUTA", heroVal: "✓", heroUnit: "", stats: [dur, rpe].filter(Boolean), eserList: [], eserSel: "" };
    let sel = S.share.eser ? ex.find(x => x.nome === S.share.eser) : null;
    if (!sel) sel = ex.slice().sort((x, y) => (Number(y.peso) || 0) - (Number(x.peso) || 0))[0];
    const hasPeso = sel.peso != null && sel.peso !== "";
    const load = (sel.serie && sel.rep && hasPeso) ? sel.serie * sel.rep * Number(sel.peso) : null;
    const vbtF = (sel.vbt || []).filter(v => v != null);
    const vbtBest = vbtF.length ? Math.max(...vbtF) : null;
    const stats = [
      (sel.serie && sel.rep) ? { v: sel.serie + "×" + sel.rep, l: "serie × rip" } : null,
      load != null ? { v: Math.round(load).toLocaleString("it-IT"), l: "volume kg" } : null,
      vbtBest != null ? { v: vbtBest.toFixed(2), l: "m/s (VBT)" } : rpe
    ].filter(Boolean);
    return { chip: "PALESTRA", heroLabel: _shareEsc(sel.nome).toUpperCase(), heroVal: hasPeso ? String(sel.peso) : ((sel.serie && sel.rep) ? sel.serie + "×" + sel.rep : "✓"), heroUnit: hasPeso ? " kg" : "", stats, eserList: ex.map(x => x.nome), eserSel: sel.nome };
  }

  // pista / campo
  const el = s.elementi || [];
  if (s.lanci) {
    let best = null, n = 0, attrezzo = "";
    el.forEach(e => { (e.misure || []).forEach(m => { if (m != null) { n++; if (best == null || m > best) best = m; } }); if (e.mezzo) attrezzo = e.mezzo + (e.kg ? " " + e.kg + "kg" : ""); });
    return { chip: "THROW", heroLabel: "MIGLIOR LANCIO", heroVal: best != null ? best.toFixed(2) : "—", heroUnit: best != null ? " m" : "", stats: [n ? { v: String(n), l: "lanci" } : null, attrezzo ? { v: _shareEsc(attrezzo), l: "attrezzo" } : null, rpe].filter(Boolean) };
  }
  const chip = g === "mezzo" ? "RUNNING" : "SPRINT";
  // elementi selezionabili (rip×dist con tempi, o continuo a minuti) — l'atleta sceglie cosa mettere in evidenza
  const items = [];
  el.forEach((e, i) => {
    if (e.distanza && e.ripetute) items.push({ i, e, label: e.ripetute + "×" + e.distanza + "m" });
    else if (e.min) items.push({ i, e, label: (e.mezzo || "continuo") + " " + e.min + "′" });
  });
  const elList = [{ v: "tot", l: "Tutta la seduta" }].concat(items.map(it => ({ v: String(it.i), l: it.label })));
  const primoTimed = items.find(it => (it.e.tempi || []).some(t => t != null));
  const def = primoTimed ? String(primoTimed.i) : "tot"; // default: il 1° set con tempi
  const elSel = (S.share.el != null && (S.share.el === "tot" || items.some(it => String(it.i) === String(S.share.el)))) ? String(S.share.el) : def;

  if (elSel !== "tot") {
    const it = items.find(x => String(x.i) === String(elSel));
    if (it) {
      const e = it.e, times = (e.tempi || []).filter(t => t != null).map(Number), vol = e.ripetute * e.distanza;
      if (times.length) {
        const avg = times.reduce((x, y) => x + y, 0) / times.length, bt = Math.min(...times);
        const heroVal = _shareFmtSec(avg).replace("s", ""), heroUnit = avg < 60 ? "s" : "";
        const repsLbl = e.ripetute + " × " + e.distanza + " M";
        if (g === "mezzo") {
          const pace = e.distanza ? _shareFmtPace(avg / e.distanza * 1000) : null;
          const avgR = Math.round(avg); // per la corsa: tempo medio al secondo (senza centesimi)
          return { chip, heroLabel: repsLbl, heroVal: _shareFmtSec(avgR).replace("s", ""), heroUnit: avgR < 60 ? "s" : "", stats: [pace ? { v: pace, l: "passo /km" } : null, { v: vol >= 1000 ? (vol / 1000).toFixed(1) + " km" : vol + " m", l: "volume" }, rpe].filter(Boolean), elList, elSel };
        }
        return { chip, heroLabel: repsLbl, heroVal, heroUnit, stats: [{ v: _shareFmtSec(bt), l: "miglior tempo" }, { v: vol + " m", l: "volume" }, rpe].filter(Boolean), elList, elSel };
      }
      if (e.min) return { chip, heroLabel: _shareEsc(e.mezzo || "CONTINUO").toUpperCase(), heroVal: String(e.min), heroUnit: "′", stats: [dur, rpe].filter(Boolean), elList, elSel };
    }
  }
  // "Tutta la seduta" (riepilogo)
  let metri = 0, prove = 0, tempi = [], distTimed = 0, timeSum = 0, minuti = 0;
  el.forEach(e => {
    if (e.distanza && e.ripetute) { metri += e.ripetute * e.distanza; prove += e.ripetute; }
    if (e.min) minuti += Number(e.min) || 0;
    (e.tempi || []).forEach(t => { if (t != null) { tempi.push(Number(t)); if (e.distanza) { distTimed += e.distanza; timeSum += Number(t); } } });
  });
  const bestAll = tempi.length ? Math.min(...tempi) : null;
  if (g === "mezzo") {
    const km = metri / 1000, pace = distTimed > 0 ? _shareFmtPace(timeSum / distTimed * 1000) : null;
    const hb = km >= 1 ? { v: km.toFixed(1), u: " km", l: "DISTANZA" } : minuti ? { v: String(minuti), u: "′", l: "CORSA" } : { v: String(Math.round(metri)), u: " m", l: "LAVORO" };
    return { chip, heroLabel: hb.l, heroVal: hb.v, heroUnit: hb.u, stats: [pace ? { v: pace, l: "passo /km" } : null, dur, rpe].filter(Boolean), elList, elSel };
  }
  return { chip, heroLabel: "VOLUME", heroVal: String(Math.round(metri)), heroUnit: " m", stats: [prove ? { v: String(prove), l: "prove" } : null, bestAll != null ? { v: _shareFmtSec(bestAll), l: "miglior tempo" } : null, rpe].filter(Boolean), elList, elSel };
}

// card come SVG 1080×1920 (story). L'anteprima a schermo È lo stesso SVG → WYSIWYG.
function _shareSVG(s, a) {
  const st = _shareStats(s, a);
  const foto = S.share.foto, W = 1080, H = 1920;
  const nome = _shareEsc(a && a.nome ? a.nome : "");
  const data = _shareEsc(s.data || "");
  const bg = foto
    ? `<image xlink:href="${foto}" href="${foto}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${W}" height="${H}" fill="url(#sgBg)"/>`;
  const cols = st.stats.slice(0, 3);
  const colW = (W - 128) / Math.max(1, cols.length);
  const statsSVG = cols.map((c, i) => {
    const cx = (64 + colW * i).toFixed(0);
    return `<text x="${cx}" y="1648" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700" fill="#ffffff">${_shareEsc(c.v)}</text>
      <text x="${cx}" y="1692" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#cfd6e2" letter-spacing="1">${_shareEsc(c.l)}</text>`;
  }).join("");
  const heroUnit = st.heroUnit ? `<tspan font-size="74" font-weight="600" fill="#e7ecf5">${_shareEsc(st.heroUnit)}</tspan>` : "";
  const chipW = st.chip.length * 21 + 60;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    <defs>
      <linearGradient id="sgTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000000" stop-opacity=".5"/><stop offset="1" stop-color="#000000" stop-opacity="0"/></linearGradient>
      <linearGradient id="sgBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080a0f" stop-opacity="0"/><stop offset=".45" stop-color="#080a0f" stop-opacity=".55"/><stop offset="1" stop-color="#080a0f" stop-opacity=".95"/></linearGradient>
      <linearGradient id="sgBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a3a6b"/><stop offset="1" stop-color="#0a0c12"/></linearGradient>
    </defs>
    ${bg}
    <rect x="0" y="0" width="${W}" height="360" fill="url(#sgTop)"/>
    <rect x="0" y="1020" width="${W}" height="900" fill="url(#sgBot)"/>
    <rect x="64" y="72" width="72" height="72" rx="18" fill="#2563c9"/>
    <text x="100" y="123" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" fill="#ffffff" text-anchor="middle">M</text>
    <text x="156" y="108" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" fill="#ffffff" letter-spacing="2">METIS</text>
    <text x="158" y="140" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="600" fill="#cfd6e2" letter-spacing="4">PERFORMANCE</text>
    <rect x="64" y="1236" width="${chipW}" height="58" rx="29" fill="#4d9aff" fill-opacity=".2" stroke="#4d9aff" stroke-opacity=".7" stroke-width="2"/>
    <text x="92" y="1275" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#a9cdff" letter-spacing="2">${_shareEsc(st.chip)}</text>
    <text x="64" y="1372" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="600" fill="#dbe1ec" letter-spacing="3">${_shareEsc(st.heroLabel)}</text>
    <text x="60" y="1512" font-family="Arial, Helvetica, sans-serif" font-size="156" font-weight="800" fill="#ffffff">${_shareEsc(st.heroVal)}${heroUnit}</text>
    <line x1="64" y1="1556" x2="1016" y2="1556" stroke="#ffffff" stroke-opacity=".2" stroke-width="2"/>
    ${statsSVG}
    <line x1="64" y1="1758" x2="1016" y2="1758" stroke="#ffffff" stroke-opacity=".2" stroke-width="2"/>
    <text x="64" y="1828" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${nome}</text>
    <text x="1016" y="1828" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#cfd6e2" text-anchor="end">${data}</text>
  </svg>`;
}

function caricaFotoSeduta(input) {
  const file = input && input.files && input.files[0]; if (!file) return;
  if (!/^image\//.test(file.type || "")) { alert("Scegli un'immagine."); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height; const max = 1280, sc = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * sc); h = Math.round(h * sc);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      let q = 0.85, uri = cv.toDataURL("image/jpeg", q);
      while (uri.length > 900000 && q > 0.4) { q -= 0.12; uri = cv.toDataURL("image/jpeg", q); }
      S.share.foto = uri; disegna();
    };
    img.onerror = () => alert("Immagine non valida.");
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function rimuoviFotoSeduta() { if (S.share) S.share.foto = null; disegna(); }
function setShareEser(nome) { if (S.share) S.share.eser = nome; disegna(); }
function setShareEl(v) { if (S.share) S.share.el = v; disegna(); }

// SVG → canvas → immagine → share sheet nativo (o fallback salva/scarica)
function condividiCard() {
  const s = (typeof sedutaDaId === "function") ? sedutaDaId(S.share.sid) : null;
  const a = (typeof atletaCorrente === "function") ? atletaCorrente() : (DEMO.atleti[0]);
  if (!s) return;
  const svg = _shareSVG(s, a);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
    const ctx = cv.getContext("2d"); ctx.fillStyle = "#0a0c12"; ctx.fillRect(0, 0, 1080, 1920);
    ctx.drawImage(img, 0, 0, 1080, 1920); URL.revokeObjectURL(url);
    cv.toBlob(async (b) => {
      if (!b) { alert("Non riesco a creare l'immagine."); return; }
      const file = new File([b], "metis-allenamento.jpg", { type: "image/jpeg" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Il mio allenamento", text: "Allenamento con Metis 💪" });
          return;
        }
      } catch (e) { if (e && e.name === "AbortError") return; }
      const durl = cv.toDataURL("image/jpeg", 0.92);
      const out = document.getElementById("shareOut");
      if (out) out.innerHTML = `<p class="et" style="margin:14px 0 8px">Tieni premuto sull'immagine per salvarla nel rullino, poi caricala su Instagram/WhatsApp.</p>
        <img src="${durl}" style="width:100%;border-radius:14px;display:block" alt="card allenamento">
        <a class="btn btn-2" style="display:block;text-align:center;margin-top:10px;text-decoration:none" href="${durl}" download="metis-allenamento.jpg">⬇ Scarica l'immagine</a>`;
    }, "image/jpeg", 0.92);
  };
  img.onerror = () => { URL.revokeObjectURL(url); alert("Non riesco a generare l'immagine (foto troppo grande?)."); };
  img.src = url;
}

function vistaCondividi() {
  const s = (typeof sedutaDaId === "function") ? sedutaDaId(S.share.sid) : null;
  const a = (typeof atletaCorrente === "function") ? atletaCorrente() : (DEMO.atleti[0]);
  if (!s) return `<button class="indietro" onclick="chiudiCondividi()">‹ Indietro</button><div class="card"><p class="et">Seduta non più disponibile.</p></div>`;
  const st = _shareStats(s, a);
  const svg = _shareSVG(s, a);
  const esBlocco = (s.tipo === "palestra" && st.eserList && st.eserList.length > 1)
    ? `<div class="card"><label class="lab">Esercizio in evidenza</label>
        <select onchange="setShareEser(this.value)" style="margin-top:6px">${st.eserList.map(n => `<option ${n === st.eserSel ? "selected" : ""}>${_shareEsc(n)}</option>`).join("")}</select></div>`
    : (st.elList && st.elList.length > 1)
    ? `<div class="card"><label class="lab">Cosa mettere in evidenza</label>
        <select onchange="setShareEl(this.value)" style="margin-top:6px">${st.elList.map(o => `<option value="${o.v}" ${o.v === st.elSel ? "selected" : ""}>${_shareEsc(o.l)}</option>`).join("")}</select></div>`
    : "";
  return `<button class="indietro" onclick="chiudiCondividi()">‹ Indietro</button>
    <div class="card"><h3>Condividi l'allenamento</h3>
      <p class="et" style="margin-top:2px">Scatta o scegli una foto di fine seduta: esce una card Metis pronta per Instagram/WhatsApp.</p></div>
    <div style="max-width:330px;margin:0 auto 12px;border-radius:18px;overflow:hidden;box-shadow:0 12px 34px rgba(0,0,0,.45)">${svg}</div>
    ${esBlocco}
    <label class="btn btn-2" style="display:block;text-align:center;cursor:pointer">📷 ${S.share.foto ? "Cambia foto" : "Scatta o scegli foto"}
      <input type="file" accept="image/*" style="display:none" onchange="caricaFotoSeduta(this)"></label>
    ${S.share.foto ? `<button class="btn btn-2" style="margin-top:8px" onclick="rimuoviFotoSeduta()">Togli la foto</button>` : ""}
    <button class="btn" style="margin-top:8px" onclick="condividiCard()">📲 Condividi</button>
    <div id="shareOut"></div>`;
}
