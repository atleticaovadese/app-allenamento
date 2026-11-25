// Condividi l'allenamento: card "Metis" stile Strava, pronta per i social.
// Nessuna libreria: la card è un SVG (anteprima = output). La foto scelta dall'atleta è
// ridimensionata sul telefono ed embeddata come data-URI. Per condividere: SVG → canvas → immagine
// → navigator.share (share sheet nativo) con fallback "scarica/tieni premuto per salvare".

function apriCondividi(sid) { S.share = { sid, foto: null, eser: null, sels: null, mps: false }; disegna(); window.scrollTo(0, 0); }
function chiudiCondividi() { S.share = null; disegna(); window.scrollTo(0, 0); }

const _FF = "Arial, Helvetica, sans-serif";
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

  // ---------- PALESTRA: serie × rip × peso (sintetico) + media m/s opzionale ----------
  if (s.tipo === "palestra") {
    const ex = (s.esercizi || []).filter(x => x && x.nome);
    if (!ex.length) return { chip: "PALESTRA", heroLabel: "SEDUTA", heroVal: "✓", heroUnit: "", stats: [dur, rpe].filter(Boolean), eserList: [], eserSel: "" };
    let sel = S.share.eser ? ex.find(x => x.nome === S.share.eser) : null;
    if (!sel) sel = ex.slice().sort((x, y) => (Number(y.peso) || 0) - (Number(x.peso) || 0))[0];
    const hasPeso = sel.peso != null && sel.peso !== "";
    const load = (sel.serie && sel.rep && hasPeso) ? sel.serie * sel.rep * Number(sel.peso) : null;
    const vbtF = (sel.vbt || []).filter(v => v != null).map(Number);
    const mediaMps = vbtF.length ? (vbtF.reduce((x, y) => x + y, 0) / vbtF.length).toFixed(2) : null;
    const showMps = !!(S.share.mps && mediaMps);
    const stats = [
      (sel.serie && sel.rep) ? { v: sel.serie + "×" + sel.rep, l: "serie × rip" } : null,
      load != null ? { v: Math.round(load).toLocaleString("it-IT"), l: "volume kg" } : null,
      showMps ? { v: mediaMps, l: "m/s media" } : rpe
    ].filter(Boolean);
    return { chip: "PALESTRA", heroLabel: _shareEsc(sel.nome).toUpperCase(), heroVal: hasPeso ? String(sel.peso) : ((sel.serie && sel.rep) ? sel.serie + "×" + sel.rep : "✓"), heroUnit: hasPeso ? " kg" : "", stats, eserList: ex.map(x => x.nome), eserSel: sel.nome, hasVbt: !!vbtF.length, mediaMps };
  }

  // ---------- LANCI ----------
  const el = s.elementi || [];
  if (s.lanci) {
    let best = null, n = 0, attrezzo = "";
    el.forEach(e => { (e.misure || []).forEach(m => { if (m != null) { n++; if (best == null || m > best) best = m; } }); if (e.mezzo) attrezzo = e.mezzo + (e.kg ? " " + e.kg + "kg" : ""); });
    return { chip: "THROW", heroLabel: "MIGLIOR LANCIO", heroVal: best != null ? best.toFixed(2) : "—", heroUnit: best != null ? " m" : "", stats: [n ? { v: String(n), l: "lanci" } : null, attrezzo ? { v: _shareEsc(attrezzo), l: "attrezzo" } : null, rpe].filter(Boolean) };
  }

  // ---------- PISTA / CAMPO: scegli cosa condividere (tutto o solo le ripetute spuntate) ----------
  const chip = g === "mezzo" ? "RUNNING" : "SPRINT";
  const items = [];
  el.forEach((e, i) => {
    if (e.distanza && e.ripetute) items.push({ i, e, label: e.ripetute + " × " + e.distanza + " m" });
    else if (e.min) items.push({ i, e, label: (e.mezzo || "continuo") + " " + e.min + "′" });
  });
  const elItems = items.map(it => ({ v: String(it.i), l: it.label }));
  const allIdx = items.map(it => String(it.i));
  let sels = Array.isArray(S.share.sels) ? S.share.sels.filter(v => allIdx.includes(v)) : null;
  if (!sels || !sels.length) sels = allIdx.slice();   // default / mai vuoto = tutta la seduta
  const chosen = items.filter(it => sels.includes(String(it.i)));

  // UN solo lavoro scelto → card "singola" (media grande + i singoli tempi)
  if (chosen.length === 1) {
    const e = chosen[0].e, times = (e.tempi || []).filter(t => t != null).map(Number), vol = (e.ripetute || 0) * (e.distanza || 0);
    if (times.length) {
      const avg = times.reduce((x, y) => x + y, 0) / times.length, bt = Math.min(...times);
      const repsLbl = e.ripetute + " × " + e.distanza + " M";
      if (g === "mezzo") {
        const pace = e.distanza ? _shareFmtPace(avg / e.distanza * 1000) : null, avgR = Math.round(avg);
        return { chip, mode: "single", heroLabel: repsLbl, heroVal: _shareFmtSec(avgR).replace("s", ""), heroUnit: avgR < 60 ? "s" : "", stats: [pace ? { v: pace, l: "passo /km" } : null, { v: vol >= 1000 ? (vol / 1000).toFixed(1) + " km" : vol + " m", l: "volume" }, rpe].filter(Boolean), splits: times.map(t => _shareFmtSec(Math.round(Number(t)))), splitsTitle: "SINGOLI TEMPI", elItems, sels };
      }
      return { chip, mode: "single", heroLabel: repsLbl, heroVal: _shareFmtSec(avg).replace("s", ""), heroUnit: avg < 60 ? "s" : "", stats: [{ v: _shareFmtSec(bt), l: "miglior tempo" }, { v: vol + " m", l: "volume" }, rpe].filter(Boolean), splits: times.map(t => _shareFmtSec(Number(t))), splitsTitle: "SINGOLI TEMPI", elItems, sels };
    }
    if (e.min) return { chip, mode: "single", heroLabel: _shareEsc(e.mezzo || "CONTINUO").toUpperCase(), heroVal: String(e.min), heroUnit: "′", stats: [dur, rpe].filter(Boolean), elItems, sels };
  }

  // PIÙ lavori (o tutta la seduta) → card "breakdown": riepilogo + elenco dei lavori coi tempi
  let metri = 0, prove = 0, tempiAll = [];
  const breakdown = chosen.map(it => {
    const e = it.e;
    if (e.distanza && e.ripetute) { metri += e.ripetute * e.distanza; prove += e.ripetute; }
    const tms = (e.tempi || []).filter(t => t != null).map(Number); tms.forEach(t => tempiAll.push(t));
    let times = [];
    if (tms.length) times = (g === "mezzo") ? tms.map(t => _shareFmtSec(Math.round(t))) : tms.map(t => t.toFixed(2));
    return { label: it.label.toUpperCase(), times, sub: (!tms.length && e.min) ? (e.min + "′ " + (e.mezzo || "")).trim() : "" };
  });
  const bestAll = tempiAll.length ? Math.min(...tempiAll) : null;
  const statsB = [prove ? { v: String(prove), l: "prove" } : null, bestAll != null ? { v: _shareFmtSec(bestAll), l: "miglior tempo" } : null, rpe].filter(Boolean);
  if (g === "mezzo") {
    const km = metri / 1000;
    return { chip, mode: "breakdown", heroLabel: "DISTANZA", heroVal: km >= 1 ? km.toFixed(1) : String(Math.round(metri)), heroUnit: km >= 1 ? " km" : " m", stats: statsB, breakdown, elItems, sels };
  }
  return { chip, mode: "breakdown", heroLabel: "VOLUME", heroVal: String(Math.round(metri)), heroUnit: " m", stats: statsB, breakdown, elItems, sels };
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
  const heroUnit = st.heroUnit ? `<tspan font-size="74" font-weight="600" fill="#e7ecf5">${_shareEsc(st.heroUnit)}</tspan>` : "";
  const chipW = st.chip.length * 21 + 64;

  // logo Metis: immagine vera (data-URI) se disponibile, altrimenti la "M" disegnata come fallback
  const logoUri = (typeof window !== "undefined" && window.METIS_LOGO_URI) ? window.METIS_LOGO_URI : "";
  const logo = logoUri
    ? `<clipPath id="lgClip"><rect x="64" y="72" width="80" height="80" rx="20"/></clipPath>
       <image clip-path="url(#lgClip)" x="64" y="72" width="80" height="80" xlink:href="${logoUri}" href="${logoUri}"/>`
    : `<rect x="64" y="72" width="72" height="72" rx="18" fill="#2563c9"/>
       <text x="100" y="123" font-family="${_FF}" font-size="46" font-weight="800" fill="#ffffff" text-anchor="middle">M</text>`;
  const logoTxtX = logoUri ? 160 : 156;
  const brand = `<text x="${logoTxtX}" y="108" font-family="${_FF}" font-size="42" font-weight="800" fill="#ffffff" letter-spacing="2">METIS</text>
    <text x="${logoTxtX + 2}" y="140" font-family="${_FF}" font-size="21" font-weight="600" fill="#cfd6e2" letter-spacing="4">PERFORMANCE</text>`;

  const chipBlock = `<rect x="64" y="1232" width="${chipW}" height="60" rx="30" fill="url(#sgAccent)" fill-opacity=".16" stroke="url(#sgAccent)" stroke-opacity=".9" stroke-width="2"/>
    <text x="94" y="1272" font-family="${_FF}" font-size="30" font-weight="800" fill="#eaf2ff" letter-spacing="3">${_shareEsc(st.chip)}</text>`;
  const accent = y => `<rect x="66" y="${y}" width="140" height="9" rx="4" fill="url(#sgAccent)"/>`;
  const footer = (dy, ty) => `<line x1="64" y1="${dy}" x2="1016" y2="${dy}" stroke="url(#sgAccent)" stroke-opacity=".55" stroke-width="3"/>
    <text x="64" y="${ty}" font-family="${_FF}" font-size="38" font-weight="700" fill="#ffffff">${nome}</text>
    <text x="1016" y="${ty}" font-family="${_FF}" font-size="30" fill="#cfd6e2" text-anchor="end">${data}</text>`;
  const statsCols = (valY, labY) => {
    const cols = (st.stats || []).slice(0, 3), colW = (W - 128) / Math.max(1, cols.length);
    return cols.map((c, i) => {
      const cx = (64 + colW * i).toFixed(0);
      return `<text x="${cx}" y="${valY}" font-family="${_FF}" font-size="60" font-weight="700" fill="#ffffff">${_shareEsc(c.v)}</text>
        <text x="${cx}" y="${labY}" font-family="${_FF}" font-size="27" fill="#cfd6e2" letter-spacing="1">${_shareEsc(c.l)}</text>`;
    }).join("");
  };

  let lower;
  if (st.mode === "breakdown") {
    // ---- più lavori / tutta la seduta ----
    const summary = (st.stats || []).slice(0, 3).map(c => _shareEsc(c.v) + " " + _shareEsc(c.l)).join("   ·   ");
    const bd = (st.breakdown || []).slice(0, 4);
    const y0 = 1636, rowH = 60;
    const rows = bd.map((b, i) => {
      const y = y0 + i * rowH;
      const tStr = (b.times && b.times.length) ? b.times.slice(0, 5).join("   ") + (b.times.length > 5 ? "  …" : "") : (b.sub || "—");
      return `<text x="64" y="${y}" font-family="${_FF}" font-size="33" font-weight="800" fill="#ffffff">${_shareEsc(b.label)}</text>
        <text x="1016" y="${y}" font-family="${_FF}" font-size="27" fill="#bcd0ea" text-anchor="end">${_shareEsc(tStr)}</text>
        <line x1="64" y1="${y + 18}" x2="1016" y2="${y + 18}" stroke="#ffffff" stroke-opacity=".1" stroke-width="1"/>`;
    }).join("");
    const lastY = y0 + (Math.max(1, bd.length) - 1) * rowH;
    lower = `${chipBlock}
      <text x="64" y="1352" font-family="${_FF}" font-size="36" font-weight="600" fill="#dbe1ec" letter-spacing="3">${_shareEsc(st.heroLabel)}</text>
      <text x="60" y="1484" font-family="${_FF}" font-size="150" font-weight="800" fill="#ffffff">${_shareEsc(st.heroVal)}${heroUnit}</text>
      ${accent(1508)}
      ${summary ? `<text x="64" y="1556" font-family="${_FF}" font-size="29" fill="#cfd6e2">${summary}</text>` : ""}
      <text x="64" y="1606" font-family="${_FF}" font-size="26" font-weight="700" fill="#9fb3cc" letter-spacing="3">LAVORI</text>
      ${rows}
      ${footer(lastY + 40, lastY + 96)}`;
  } else if (st.splits && st.splits.length) {
    // ---- un solo lavoro cronometrato: media grande + i singoli tempi ----
    let shown = st.splits;
    if (st.splits.length > 10) { shown = st.splits.slice(0, 9); shown.push("+" + (st.splits.length - 9)); }
    const n = shown.length, perRow = Math.min(5, n), gap = 14, availW = W - 128;
    const pillW = (availW - gap * (perRow - 1)) / perRow, pillH = 58, rowH = pillH + 16, y0 = 1626;
    const pills = shown.map((t, i) => {
      const r = Math.floor(i / perRow), c = i % perRow, x = 64 + c * (pillW + gap), y = y0 + r * rowH;
      return `<rect x="${x.toFixed(0)}" y="${y}" width="${pillW.toFixed(0)}" height="${pillH}" rx="17" fill="#ffffff" fill-opacity=".1" stroke="#ffffff" stroke-opacity=".22" stroke-width="1.5"/>
        <text x="${(x + pillW / 2).toFixed(0)}" y="${y + 39}" font-family="${_FF}" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">${_shareEsc(t)}</text>`;
    }).join("");
    const summary = (st.stats || []).slice(0, 3).map(c => _shareEsc(c.v) + " " + _shareEsc(c.l)).join("   ·   ");
    const rows = Math.ceil(n / perRow), pillsBottom = y0 + rows * rowH - 16;
    lower = `${chipBlock}
      <text x="64" y="1352" font-family="${_FF}" font-size="36" font-weight="600" fill="#dbe1ec" letter-spacing="3">${_shareEsc(st.heroLabel)}</text>
      <text x="60" y="1484" font-family="${_FF}" font-size="134" font-weight="800" fill="#ffffff">${_shareEsc(st.heroVal)}${heroUnit}</text>
      ${accent(1508)}
      ${summary ? `<text x="64" y="1556" font-family="${_FF}" font-size="29" fill="#cfd6e2">${summary}</text>` : ""}
      <text x="64" y="1606" font-family="${_FF}" font-size="26" font-weight="700" fill="#9fb3cc" letter-spacing="3">${_shareEsc(st.splitsTitle || "SINGOLI TEMPI")}</text>
      ${pills}
      ${footer(Math.max(pillsBottom + 36, 1792), Math.max(pillsBottom + 94, 1850))}`;
  } else {
    // ---- classico: eroe + 3 numeri (palestra, lanci, singolo senza tempi) ----
    lower = `${chipBlock}
      <text x="64" y="1366" font-family="${_FF}" font-size="36" font-weight="600" fill="#dbe1ec" letter-spacing="3">${_shareEsc(st.heroLabel)}</text>
      <text x="60" y="1506" font-family="${_FF}" font-size="156" font-weight="800" fill="#ffffff">${_shareEsc(st.heroVal)}${heroUnit}</text>
      ${accent(1530)}
      ${statsCols(1648, 1692)}
      ${footer(1760, 1824)}`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
    <defs>
      <linearGradient id="sgTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000000" stop-opacity=".5"/><stop offset="1" stop-color="#000000" stop-opacity="0"/></linearGradient>
      <linearGradient id="sgBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080a0f" stop-opacity="0"/><stop offset=".45" stop-color="#080a0f" stop-opacity=".55"/><stop offset="1" stop-color="#080a0f" stop-opacity=".97"/></linearGradient>
      <linearGradient id="sgBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a3a6b"/><stop offset="1" stop-color="#0a0c12"/></linearGradient>
      <linearGradient id="sgAccent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4d8df0"/><stop offset="1" stop-color="#7bc043"/></linearGradient>
    </defs>
    ${bg}
    <rect x="0" y="0" width="${W}" height="360" fill="url(#sgTop)"/>
    <rect x="0" y="1000" width="${W}" height="920" fill="url(#sgBot)"/>
    ${logo}
    ${brand}
    ${lower}
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
function toggleShareMps() { if (S.share) { S.share.mps = !S.share.mps; disegna(); } }
// pista: spunta/togli un lavoro da condividere (default = tutti). Mai lasciare vuoto → torna a "tutta la seduta".
function toggleShareSet(v) {
  if (!S.share) return;
  const s = (typeof sedutaDaId === "function") ? sedutaDaId(S.share.sid) : null; if (!s) return;
  const all = []; (s.elementi || []).forEach((e, i) => { if ((e.distanza && e.ripetute) || e.min) all.push(String(i)); });
  let sels = Array.isArray(S.share.sels) ? S.share.sels.filter(x => all.includes(x)) : all.slice();
  if (!sels.length) sels = all.slice();
  sels = sels.includes(v) ? sels.filter(x => x !== v) : sels.concat(v);
  if (!sels.length) sels = all.slice();     // non si può condividere "niente"
  S.share.sels = sels; disegna();
}

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

  // controlli "cosa condividere"
  let controls = "";
  if (s.tipo === "palestra") {
    const exSel = (st.eserList && st.eserList.length > 1)
      ? `<label class="lab">Esercizio in evidenza</label>
         <select onchange="setShareEser(this.value)" style="margin-top:6px;margin-bottom:${st.hasVbt ? "12px" : "0"}">${st.eserList.map(n => `<option ${n === st.eserSel ? "selected" : ""}>${_shareEsc(n)}</option>`).join("")}</select>` : "";
    const mps = st.hasVbt
      ? `<label style="display:flex;align-items:center;gap:10px;cursor:pointer">
           <input type="checkbox" ${S.share.mps ? "checked" : ""} onclick="toggleShareMps()" style="width:20px;height:20px">
           <span>Aggiungi <b>media m/s</b>${st.mediaMps ? ` <span style="color:var(--txt3)">(${st.mediaMps})</span>` : ""}</span></label>` : "";
    controls = (exSel || mps) ? `<div class="card">${exSel}${mps}</div>` : "";
  } else if (st.elItems && st.elItems.length > 1) {
    const chips = st.elItems.map(o => {
      const on = (st.sels || []).includes(o.v);
      return `<button class="chip" style="border-color:${on ? "var(--blu)" : "var(--line2)"};color:${on ? "var(--blu)" : "var(--txt3)"};background:${on ? "var(--blu-bg,rgba(77,141,240,.12))" : "var(--card2)"}" onclick="toggleShareSet('${o.v}')">${on ? "☑" : "☐"} ${_shareEsc(o.l)}</button>`;
    }).join("");
    controls = `<div class="card"><label class="lab">Cosa condividere</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${chips}</div>
      <p class="et" style="margin-top:8px;color:var(--txt3)">Spunta i lavori da mostrare. <b>Tutti spuntati = tutta la seduta</b>; lasciane uno solo per la card dettagliata coi singoli tempi.</p></div>`;
  }

  return `<button class="indietro" onclick="chiudiCondividi()">‹ Indietro</button>
    <div class="card"><h3>Condividi l'allenamento</h3>
      <p class="et" style="margin-top:2px">Scatta o scegli una foto di fine seduta: esce una card Metis pronta per Instagram/WhatsApp.</p></div>
    <div style="max-width:330px;margin:0 auto 12px;border-radius:18px;overflow:hidden;box-shadow:0 12px 34px rgba(0,0,0,.45)">${svg}</div>
    ${controls}
    <label class="btn btn-2" style="display:block;text-align:center;cursor:pointer">📷 ${S.share.foto ? "Cambia foto" : "Scatta o scegli foto"}
      <input type="file" accept="image/*" style="display:none" onchange="caricaFotoSeduta(this)"></label>
    ${S.share.foto ? `<button class="btn btn-2" style="margin-top:8px" onclick="rimuoviFotoSeduta()">Togli la foto</button>` : ""}
    <button class="btn" style="margin-top:8px" onclick="condividiCard()">📲 Condividi</button>
    <div id="shareOut"></div>`;
}
