// Illustrazioni del tutorial: mini-mockup del telefono (SVG) che mostrano ogni schermata + il gesto.
// _tutMock(key) → HTML con la cornice del telefono e lo schermo disegnato. Usato da vistaTutorial (app.js).

const _TA = "#2b4c7e";          // accent blu Metis
const _TG = "#2f9e52", _TY = "#d99a00", _TR = "#c0392b";

// --- mattoncini SVG riutilizzabili ---
function _thead(title, accent) {
  return `<rect x="0" y="0" width="240" height="50" fill="${accent || _TA}"/>
    <text x="16" y="32" fill="#fff" font-size="15" font-weight="700" font-family="system-ui,Segoe UI,Arial">${title}</text>
    <circle cx="214" cy="25" r="2.6" fill="#ffffffaa"/><circle cx="206" cy="25" r="2.6" fill="#ffffffaa"/><circle cx="198" cy="25" r="2.6" fill="#ffffffaa"/>`;
}
function _tcard(y, h, fill) { return `<rect x="14" y="${y}" width="212" height="${h}" rx="12" fill="${fill || "#fff"}" stroke="#dbe3ef"/>`; }
function _ttext(x, y, t, o) { o = o || {}; return `<text x="${x}" y="${y}" font-size="${o.s || 11}" fill="${o.c || "#3a4256"}" font-weight="${o.w || 400}" font-family="system-ui,Segoe UI,Arial"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}>${t}</text>`; }
function _tbar(x, y, w, h, c) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c || "#e6ecf5"}"/>`; }
function _tdot(cx, cy, c) { return `<circle cx="${cx}" cy="${cy}" r="5" fill="${c}"/>`; }
function _ttap(cx, cy, accent) {
  return `<circle class="tut-tap" cx="${cx}" cy="${cy}" r="13" fill="none" stroke="${accent || _TA}" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="${accent || _TA}"/>`;
}
function _tbtn(x, y, w, t, accent) {
  return `<rect x="${x}" y="${y}" width="${w}" height="30" rx="15" fill="${accent || _TA}"/>${_ttext(x + w / 2, y + 20, t, { c: "#fff", w: 700, anchor: "middle" })}`;
}

// --- schermate (una per concetto) ---
const _TUT_SCREENS = {
  oggi: () => `${_thead("Oggi")}
    ${_tcard(64, 76, "#2b4c7e")}
    ${_ttext(26, 88, "Allenamento di oggi", { c: "#cfe0ff", s: 10 })}
    ${_ttext(26, 108, "Pista · giorno 3", { c: "#fff", s: 14, w: 700 })}
    ${_ttext(26, 128, "6×60 m · 95%", { c: "#cfe0ff", s: 10 })}
    ${_ttap(196, 102)}
    ${_tcard(152, 60)} ${_ttext(26, 176, "Tempi", { s: 10, c: "#7a8598" })}
    ${_tbar(26, 184, 34, 22, "#eef2f8")}${_tbar(66, 184, 34, 22, "#eef2f8")}${_tbar(106, 184, 34, 22, "#dff3e6")}
    ${_ttext(30, 199, "7.05", { s: 9 })}${_ttext(70, 199, "7.02", { s: 9 })}${_ttext(112, 199, "6.98", { s: 9, c: _TG, w: 700 })}
    ${_tbtn(60, 232, 120, "Chiudi seduta ✓", _TG)}`,

  diario: () => `${_thead("Diario", "#3a4256")}
    ${_tcard(66, 176)}
    ${["Sonno", "Stress", "Dolori", "Energia"].map((l, i) => {
    const y = 92 + i * 38;
    return `${_ttext(26, y, l, { s: 11, w: 600 })}
      ${[0, 1, 2, 3, 4].map(d => _tdot(120 + d * 22, y - 4, d <= (3 - (i === 1 ? 1 : 0)) ? (i === 1 ? _TY : _TG) : "#e2e8f2")).join("")}`;
  }).join("")}
    ${_ttap(142, 200)}
    ${_ttext(120, 254, "30 secondi al giorno", { s: 10, c: "#7a8598" })}`,

  profilo: () => `${_thead("I miei dati")}
    ${_tcard(64, 40)}${_ttext(26, 88, "Leonardo Zetti · velocità", { s: 11, w: 600 })}
    ${_ttext(26, 128, "Personali (PB)", { s: 11, c: "#7a8598" })}
    ${[["100 m", "10.90"], ["60 m", "7.01"], ["200 m", "22.10"]].map((p, i) => {
    const y = 142 + i * 34; return `${_tcard(y, 28)}${_ttext(26, y + 18, p[0], { s: 11 })}${_ttext(210, y + 18, p[1], { s: 12, w: 700, c: _TA, anchor: "end" })}`;
  }).join("")}
    ${_ttext(120, 262, "dai PB escono i tempi da fare", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  gare: () => `${_thead("Gare", "#8a5a1a")}
    ${_tcard(64, 44)}${_ttext(26, 82, "Prossima gara", { s: 10, c: "#7a8598" })}${_ttext(26, 98, "Meeting regionale · 12 set", { s: 11, w: 600 })}
    ${_tbtn(40, 128, 160, "＋ Registra risultato", "#b5761f")}${_ttap(190, 143, "#b5761f")}
    ${_tcard(176, 40)}${_ttext(26, 194, "100 m", { s: 11 })}${_ttext(150, 194, "10.90", { s: 12, w: 700, c: _TG })}${_ttext(196, 194, "PB!", { s: 10, c: _TG, w: 700 })}
    ${_ttext(120, 250, "il tempo aggiorna il PB in gara", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  video: () => `${_thead("Librerie")}
    ${[0, 1, 2, 3].map(i => { const x = 18 + (i % 2) * 106, y = 66 + Math.floor(i / 2) * 92; return `<rect x="${x}" y="${y}" width="96" height="78" rx="10" fill="#20304a"/><path d="M${x + 40} ${y + 28} L${x + 62} ${y + 39} L${x + 40} ${y + 50} Z" fill="#fff"/>${_ttext(x + 8, y + 70, ["Squat", "Mobilità", "Balzi", "Andature"][i], { s: 9, c: "#cfe0ff" })}`; }).join("")}
    ${_ttap(66, 105)}
    ${_ttext(120, 264, "i video si aprono dentro l'app", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  calendario: () => `${_thead("Calendario")}
    ${_tcard(64, 54)}${_ttext(26, 82, "Questa settimana", { s: 10, c: "#7a8598" })}
    ${["L", "M", "M", "G", "V", "S", "D"].map((g, i) => { const x = 28 + i * 27; const on = [0, 2, 4].includes(i); return `${_ttext(x, 100, g, { s: 9, c: "#7a8598", anchor: "middle" })}<circle cx="${x}" cy="108" r="6" fill="${on ? _TA : "#e2e8f2"}"/>`; }).join("")}
    ${_ttext(26, 150, "Presenze del mese", { s: 10, c: "#7a8598" })}
    ${_tbar(26, 158, 200, 14, "#e6ecf5")}${_tbar(26, 158, 150, 14, _TG)}${_ttext(120, 169, "12 / 16", { s: 9, c: "#fff", w: 700, anchor: "middle" })}
    ${_ttext(120, 250, "il tuo programma, giorno per giorno", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  guida: () => `${_thead("Guida & glossario", "#3a4256")}
    ${[["ACWR", "carico acuto / cronico"], ["RSI", "indice di reattività"], ["TUT", "tempo sotto tensione"], ["LSI", "simmetria arti dx/sx"]].map((p, i) => { const y = 66 + i * 42; return `${_tcard(y, 34)}${_ttext(26, y + 15, p[0], { s: 12, w: 700, c: _TA })}${_ttext(26, y + 28, p[1], { s: 9, c: "#7a8598" })}`; }).join("")}
    ${_ttext(120, 262, "tutti i termini spiegati semplici", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  squadra: () => `${_thead("Squadra")}
    ${[["Marco B.", _TG, "ok"], ["Sara M.", _TR, "rosso"], ["Luca P.", _TY, "attenz."], ["Anna R.", _TG, "ok"]].map((a, i) => { const y = 64 + i * 46; return `${_tcard(y, 38)}<circle cx="34" cy="${y + 19}" r="7" fill="${a[1]}"/>${_ttext(52, y + 16, a[0], { s: 11, w: 600 })}${_ttext(52, y + 29, a[2], { s: 9, c: "#7a8598" })}${_ttext(212, y + 23, "›", { s: 16, c: "#c3ccdb", anchor: "end" })}`; }).join("")}
    ${_ttext(120, 264, "verde / giallo / rosso: chi seguire", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  atleti: () => `${_thead("Atleti")}
    ${_tbtn(40, 62, 160, "＋ Nuovo atleta")}${_ttap(190, 77)}
    ${_tcard(106, 100)}${_ttext(26, 126, "Scheda atleta", { s: 11, w: 700 })}
    ${_ttext(26, 148, "PB · massimali · test", { s: 10, c: "#7a8598" })}
    ${_tbar(26, 158, 90, 10, "#e6ecf5")}${_tbar(26, 176, 130, 10, "#e6ecf5")}${_tbar(26, 194, 70, 10, "#e6ecf5")}
    ${_ttext(120, 250, "nome + email e sei pronto", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  programma: () => `${_thead("Programma · Pista")}
    ${_ttext(20, 78, "Contenuto", { s: 9, c: "#7a8598" })}${_ttext(120, 78, "Dist", { s: 9, c: "#7a8598" })}${_ttext(160, 78, "%", { s: 9, c: "#7a8598" })}${_ttext(196, 78, "Tempo", { s: 9, c: "#7a8598" })}
    ${[["Accel.", "30", "95", "3.98"], ["Vel. max", "60", "100", "6.55"], ["Sped. end", "150", "92", "17.2"]].map((r, i) => { const y = 92 + i * 30; return `${_tcard(y, 24)}${_ttext(20, y + 16, r[0], { s: 10 })}${_ttext(122, y + 16, r[1], { s: 10 })}${_ttext(160, y + 16, r[2], { s: 10 })}${_ttext(196, y + 16, r[3], { s: 11, w: 700, c: _TG })}`; }).join("")}
    ${_ttext(120, 210, "il tempo esce dal PB dell'atleta", { s: 9, c: "#7a8598", anchor: "middle" })}
    ${_ttext(120, 246, "scrivi UNA volta, lo vedono tutti", { s: 9, c: _TA, w: 700, anchor: "middle" })}`,

  adatta: () => `${_thead("Adatta al singolo", "#5a4a8a")}
    ${_tcard(64, 44)}${_ttext(26, 82, "Sposta i giorni", { s: 11, w: 600 })}${_ttext(26, 98, "Lun → Mar (solo per lui)", { s: 9, c: "#7a8598" })}
    ${_tcard(120, 70)}${_ttext(26, 140, "Meno ripetute", { s: 11, w: 600 })}
    ${_ttext(26, 162, "6×", { s: 11 })}<line x1="42" y1="158" x2="52" y2="158" stroke="#c0392b" stroke-width="2"/>${_ttext(56, 162, "4×60 m", { s: 11, w: 700, c: "#5a4a8a" })}
    ${_tbar(26, 172, 160, 8, "#e6ddf3")}${_tbar(26, 172, 100, 8, "#5a4a8a")}
    ${_ttext(120, 250, "senza toccare il programma madre", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  monitoraggio: () => `${_thead("Monitoraggio")}
    ${_ttext(26, 78, "Carico e forma (ACWR)", { s: 10, c: "#7a8598" })}
    ${_tcard(86, 96)}
    <polyline points="30,150 60,140 90,132 120,120 150,128 180,110 210,116" fill="none" stroke="${_TA}" stroke-width="2.5"/>
    ${[["30", "150"], ["90", "132"], ["150", "128"], ["210", "116"]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${_TA}"/>`).join("")}
    <line x1="26" y1="160" x2="214" y2="160" stroke="#e2e8f2"/>
    ${_ttext(30, 100, "1.1", { s: 9, c: _TG, w: 700 })}${_ttext(120, 100, "ACWR ok", { s: 9, c: "#7a8598", anchor: "middle" })}
    ${_ttext(120, 230, "dati veri da ciò che gli atleti fanno", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  analisi: () => `${_thead("Analisi · Test", "#1a6a5a")}
    ${_tcard(64, 60)}${_ttext(26, 84, "Profilo Forza-Velocità", { s: 11, w: 700 })}
    <line x1="30" y1="112" x2="120" y2="86" stroke="#1a6a5a" stroke-width="2"/><circle cx="30" cy="112" r="2.5" fill="#1a6a5a"/><circle cx="120" cy="86" r="2.5" fill="#1a6a5a"/>
    ${_ttext(140, 100, "Pmax", { s: 9, c: "#7a8598" })}
    ${_tcard(136, 40)}${_ttext(26, 161, "Come si fa", { s: 11, w: 600 })}<path d="M196 149 L210 158 L196 167 Z" fill="#1a6a5a"/>
    ${_ttap(203, 158, "#1a6a5a")}
    ${_ttext(120, 250, "ogni test ha «come si fa» col video", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  notifiche: () => `${_thead("🔔 Notifiche", "#a8321f")}
    ${[["🩹", "Sara — fastidio caviglia", _TR], ["📈", "Luca — ACWR 1.62 (alto)", _TR], ["🔋", "Marco — prontezza 2.1", _TY]].map((a, i) => { const y = 66 + i * 46; return `<rect x="14" y="${y}" width="212" height="38" rx="10" fill="#fff" stroke="#dbe3ef"/><rect x="14" y="${y}" width="4" height="38" rx="2" fill="${a[2]}"/>${_ttext(26, y + 17, a[0] + " " + a[1].split(" — ")[0], { s: 11, w: 700 })}${_ttext(26, y + 30, a[1].split(" — ")[1], { s: 9, c: "#7a8598" })}`; }).join("")}
    ${_ttext(120, 258, "avviso subito se un atleta ha bisogno", { s: 9, c: "#7a8598", anchor: "middle" })}`,

  report: () => `${_thead("Report PDF")}
    ${_tcard(64, 190)}
    ${_ttext(26, 84, "Leonardo Zetti", { s: 12, w: 700 })}${_ttext(26, 98, "velocità · 100 m", { s: 9, c: "#7a8598" })}
    ${_tbar(26, 110, 60, 22, "#eef2f8")}${_tbar(92, 110, 60, 22, "#eef2f8")}${_tbar(158, 110, 60, 22, "#eef2f8")}
    ${_ttext(34, 124, "PB", { s: 8, c: "#7a8598" })}${_ttext(100, 124, "ACWR", { s: 8, c: "#7a8598" })}${_ttext(166, 124, "Forma", { s: 8, c: "#7a8598" })}
    ${_ttext(26, 156, "Storico test", { s: 10, w: 600 })}
    <polyline points="26,182 70,176 114,168 158,160 202,150" fill="none" stroke="${_TG}" stroke-width="2"/>
    ${_ttext(26, 210, "Programma per mesociclo…", { s: 9, c: "#7a8598" })}
    ${_ttext(120, 264, "tutto l'atleta in un PDF", { s: 9, c: "#7a8598", anchor: "middle" })}`
};

function _tutMock(key) {
  const inner = (_TUT_SCREENS[key] || (() => `${_thead("Metis")}${_ttext(120, 150, "Metis Performance", { anchor: "middle", w: 700, c: _TA, s: 14 })}`))();
  return `<div class="tut-phone"><div class="tut-notch"></div><svg viewBox="0 0 240 290" class="tut-screen" preserveAspectRatio="xMidYMin meet">${inner}</svg></div>`;
}
// stile + animazioni del tutorial (iniettato una volta da vistaTutorial)
function _tutCSS() {
  return `<style>
    .tut-wrap{max-width:600px;margin:0 auto;text-align:center;padding:6px 8px 24px}
    .tut-phone{width:210px;max-width:64vw;margin:0 auto;border:7px solid #12151c;border-radius:28px;background:#12151c;box-shadow:0 18px 44px rgba(0,0,0,.42);position:relative;overflow:hidden}
    .tut-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:64px;height:14px;background:#12151c;border-radius:0 0 11px 11px;z-index:2}
    .tut-screen{display:block;width:100%;background:#eef2f8;border-radius:21px}
    .tut-tap{transform-origin:center;transform-box:fill-box;animation:tutPulse 1.7s ease-out infinite}
    @keyframes tutPulse{0%{opacity:.85;transform:scale(.5)}70%{opacity:0;transform:scale(1.9)}100%{opacity:0}}
    .tut-anim{animation:tutIn .45s cubic-bezier(.2,.7,.3,1)}
    @keyframes tutIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    .tut-come{max-width:440px;margin:14px auto 0;text-align:left;background:var(--card2,rgba(120,120,140,.08));border-radius:14px;padding:12px 14px}
    .tut-come li{font-size:13.5px;line-height:1.5;color:var(--txt2);margin:3px 0}
    .tut-badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:var(--blu,#2b4c7e);padding:3px 10px;border-radius:20px}
    .tut-prog{height:5px;border-radius:3px;background:var(--line2,#e2e8f2);max-width:440px;margin:0 auto 6px;overflow:hidden}
    .tut-prog>i{display:block;height:100%;background:var(--blu,#2b4c7e);border-radius:3px;transition:width .35s ease}
  </style>`;
}
