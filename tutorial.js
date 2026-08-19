// Tutorial INTERATTIVO: mockup del telefono in cui si può giocare (tap → succede qualcosa).
// Stato d'interazione in S.tutI (azzerato a ogni cambio passo). _tutMock(key) → schermo del telefono.

const _TA = "#2b4c7e", _TG = "#2f9e52", _TY = "#d99a00", _TR = "#c0392b";
function _tutIState() { S.tutI = S.tutI || {}; return S.tutI; }
// handlers interattivi (aggiornano lo stato e ridisegnano, senza scroll)
function tutDot(row, n) { const t = _tutIState(); t.diario = t.diario || { sonno: 4, stress: 3, dolori: 5, energia: 4 }; t.diario[row] = n; disegna(); }
function tutSet(k, v) { _tutIState()[k] = v; disegna(); }
function tutPct(delta) { const t = _tutIState(); t.pct = Math.max(88, Math.min(102, (t.pct || 95) + delta)); disegna(); }
function tutSeen(i) { const t = _tutIState(); t.seen = t.seen || {}; t.seen[i] = 1; disegna(); }
function tutReset(k) { const t = _tutIState(); delete t[k]; if (k === "notifiche") delete t.seen; disegna(); }

// cornice telefono
function _tf(header, accent, body) {
  return `<div class="tut-phone"><div class="tut-notch"></div>
    <div class="tut-scr">
      <div class="tut-hd" style="background:${accent || _TA}">${header}</div>
      <div class="tut-bd">${body}</div>
    </div></div>`;
}
const _hint = t => `<div class="tut-hint">👆 ${t}</div>`;
const _pill = (t, c) => `<span class="tut-pill" style="background:${c}">${t}</span>`;

const _TUT_SCREENS = {
  // ---- INTERATTIVE ----
  diario: () => {
    const d = _tutIState().diario || { sonno: 4, stress: 3, dolori: 5, energia: 4 };
    const pr = ((d.sonno + d.stress + d.dolori + d.energia) / 4).toFixed(1);
    const rows = [["Sonno", "sonno"], ["Stress", "stress"], ["Dolori", "dolori"], ["Energia", "energia"]];
    const dots = (key, val) => [1, 2, 3, 4, 5].map(n => `<button class="tut-dot" style="background:${n <= val ? _TG : "#dbe3ef"}" onclick="tutDot('${key}',${n})"></button>`).join("");
    return _tf("Diario", "#3a4256", `
      <div class="tc">${rows.map(([l, k]) => `<div class="tut-scorerow"><span>${l}</span><div class="tut-dots">${dots(k, d[k])}</div></div>`).join("")}</div>
      <div class="tc" style="text-align:center;background:#eaf6ee;border-color:#bfe3ca">
        <div style="font-size:10px;color:#5a7a63">Prontezza (si calcola da sola)</div>
        <div style="font-size:24px;font-weight:800;color:${pr >= 3.5 ? _TG : pr >= 2.5 ? _TY : _TR}">${pr}<span style="font-size:13px;color:#8a94a3"> / 5</span></div>
      </div>
      ${_hint("tocca i pallini: cambia la prontezza")}`);
  },
  oggi: () => {
    const st = _tutIState().oggi || "closed";
    if (st === "done") return _tf("Oggi", _TA, `
      <div class="tc tut-in" style="text-align:center;padding:22px 12px">
        <div style="font-size:34px">✅</div>
        <div style="font-weight:700;margin-top:6px">Seduta chiusa!</div>
        <div style="font-size:11px;color:#7a8598;margin-top:4px">durata e RPE inviati all'allenatore</div></div>
      <button class="tut-mini" style="background:#8a94a3;align-self:center" onclick="tutReset('oggi')">↺ rivedi</button>`);
    if (st === "open") return _tf("Oggi · Pista", _TA, `
      <div class="tc tut-in"><div style="font-weight:700">6 × 60 m · 95%</div>
        <div style="font-size:10px;color:#7a8598;margin:6px 0 4px">Segna i tempi</div>
        <div class="tut-tempi"><span>7.05</span><span>7.02</span><span class="ok">6.98</span></div></div>
      <button class="tut-mini tut-in" style="background:${_TG};align-self:center" onclick="tutSet('oggi','done')">Chiudi seduta ✓</button>
      ${_hint("chiudi con durata e RPE")}`);
    return _tf("Oggi", _TA, `
      <div class="tc" style="background:#2b4c7e;color:#fff;border:0">
        <div style="font-size:10px;color:#cfe0ff">Allenamento di oggi</div>
        <div style="font-weight:700;font-size:15px;margin-top:2px">Pista · giorno 3</div>
        <div style="font-size:10px;color:#cfe0ff;margin-top:2px">6×60 m · 95% · rec 4'</div></div>
      <button class="tut-mini" style="background:${_TA};align-self:center" onclick="tutSet('oggi','open')">Apri l'allenamento ›</button>
      ${_hint("apri la card di oggi")}`);
  },
  gare: () => {
    const done = _tutIState().gare === "done";
    return _tf("Gare", "#8a5a1a", `
      <div class="tc"><div style="font-size:10px;color:#7a8598">Prossima gara</div><div style="font-weight:700">Meeting regionale · 12 set</div></div>
      ${done
        ? `<div class="tc tut-in" style="display:flex;justify-content:space-between;align-items:center"><b>100 m</b><span style="font-weight:800;color:${_TG}">10.90</span>${_pill("PB!", _TG)}</div>
           <button class="tut-mini" style="background:#8a94a3;align-self:center" onclick="tutReset('gare')">↺ rivedi</button>`
        : `<button class="tut-mini" style="background:#b5761f;align-self:center" onclick="tutSet('gare','done')">＋ Registra risultato</button>${_hint("registra: aggiorna il tuo PB")}`}`);
  },
  programma: () => {
    const pct = _tutIState().pct || 95, base = 6.55, tempo = (base * 100 / pct).toFixed(2);
    return _tf("Programma · Pista", _TA, `
      <div class="tc"><div style="font-weight:700">Vel. max · 60 m</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <button class="tut-step" onclick="tutPct(-1)">−</button>
            <b style="min-width:42px;text-align:center">${pct}%</b>
            <button class="tut-step" onclick="tutPct(1)">＋</button></div>
          <div style="text-align:right"><div style="font-size:9px;color:#7a8598">tempo da fare</div>
            <div style="font-size:20px;font-weight:800;color:${_TG}">${tempo}</div></div>
        </div></div>
      <div class="tc" style="font-size:10px;color:#7a8598;text-align:center">Cambi la <b>%</b> → il <b>tempo esce dal PB</b> dell'atleta, in automatico</div>
      ${_hint("usa − e ＋ e guarda il tempo")}`);
  },
  notifiche: () => {
    const t = _tutIState(), seen = t.seen || {};
    const items = [["🩹", "Sara — fastidio caviglia", _TR], ["📈", "Luca — ACWR 1.62 (alto)", _TR], ["🔋", "Marco — prontezza 2.1", _TY]];
    const vivi = items.map((a, i) => seen[i] ? "" : `<div class="tc tut-in" style="border-left:4px solid ${a[2]};display:flex;justify-content:space-between;align-items:center;gap:6px">
        <div style="min-width:0"><div style="font-weight:700;font-size:11px">${a[0]} ${a[1].split(" — ")[0]}</div><div style="font-size:9px;color:#7a8598">${a[1].split(" — ")[1]}</div></div>
        <button class="tut-mini" style="background:${_TG};padding:5px 9px;font-size:10px" onclick="tutSeen(${i})">✓ Visto</button></div>`).join("");
    const tutti = items.every((_, i) => seen[i]);
    return _tf("🔔 Notifiche", "#a8321f", `${tutti
      ? `<div class="tc tut-in" style="text-align:center;padding:20px 12px"><div style="font-size:30px">✅</div><div style="font-weight:700;margin-top:4px">Tutto tranquillo</div></div>
         <button class="tut-mini" style="background:#8a94a3;align-self:center" onclick="tutReset('notifiche')">↺ rivedi</button>`
      : `${vivi}${_hint("«✓ Visto» per gestire un avviso")}`}`);
  },
  squadra: () => {
    const sel = _tutIState().atl;
    const atl = [["Marco B.", _TG, "ok"], ["Sara M.", _TR, "fastidio"], ["Luca P.", _TY, "ACWR alto"], ["Anna R.", _TG, "ok"]];
    const rows = atl.map((a, i) => `<div class="tut-arow ${sel === i ? "on" : ""}" onclick="tutSet('atl',${i})"><span class="tut-sdot" style="background:${a[1]}"></span><b>${a[0]}</b><span style="margin-left:auto;font-size:9px;color:#7a8598">${a[2]}</span></div>`).join("");
    const det = sel != null ? `<div class="tc tut-in"><div style="font-weight:700;font-size:12px">${atl[sel][0]}</div><div style="display:flex;gap:6px;margin-top:6px">${_pill("PB 10.90", "#5a6472")} ${_pill(atl[sel][2], atl[sel][1])}</div></div>` : "";
    return _tf("Squadra", _TA, `<div class="tc" style="padding:6px">${rows}</div>${det}${sel == null ? _hint("tocca un atleta") : ""}`);
  },
  // ---- ILLUSTRATIVE (statiche, stile app) ----
  profilo: () => _tf("I miei dati", _TA, `
    <div class="tc"><b style="font-size:12px">Leonardo Zetti</b><div style="font-size:10px;color:#7a8598">velocità · 100 m</div></div>
    <div style="font-size:10px;color:#7a8598;margin:-2px 2px">Personali (PB)</div>
    ${[["100 m", "10.90"], ["60 m", "7.01"], ["200 m", "22.10"]].map(p => `<div class="tc" style="display:flex;justify-content:space-between;padding:8px 12px"><span>${p[0]}</span><b style="color:${_TA}">${p[1]}</b></div>`).join("")}
    <div style="font-size:9px;color:#7a8598;text-align:center">dai PB escono i tempi da fare</div>`),
  video: () => _tf("Librerie", _TA, `
    <div class="tut-grid">${["Squat", "Mobilità", "Balzi", "Andature"].map(n => `<div class="tut-thumb"><div class="tut-play">▶</div><span>${n}</span></div>`).join("")}</div>
    <div style="font-size:9px;color:#7a8598;text-align:center">i video si aprono dentro l'app</div>`),
  calendario: () => _tf("Calendario", _TA, `
    <div class="tc"><div style="font-size:10px;color:#7a8598">Questa settimana</div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">${["L", "M", "M", "G", "V", "S", "D"].map((g, i) => `<div style="text-align:center"><div style="font-size:9px;color:#7a8598">${g}</div><div class="tut-cday" style="background:${[0, 2, 4].includes(i) ? _TA : "#e2e8f2"}"></div></div>`).join("")}</div></div>
    <div class="tc"><div style="font-size:10px;color:#7a8598">Presenze del mese</div><div class="tut-prog2"><i style="width:75%"></i></div><div style="font-size:10px;text-align:right;margin-top:2px"><b>12 / 16</b></div></div>`),
  guida: () => _tf("Guida & glossario", "#3a4256", [["ACWR", "carico acuto / cronico"], ["RSI", "indice di reattività"], ["TUT", "tempo sotto tensione"], ["LSI", "simmetria dx/sx"]].map(p => `<div class="tc" style="padding:8px 12px"><b style="color:${_TA}">${p[0]}</b><div style="font-size:9px;color:#7a8598">${p[1]}</div></div>`).join("")),
  atleti: () => _tf("Atleti", _TA, `
    <button class="tut-mini" style="background:${_TA};align-self:center">＋ Nuovo atleta</button>
    <div class="tc"><b style="font-size:12px">Scheda atleta</b><div style="font-size:10px;color:#7a8598;margin:2px 0 8px">PB · massimali · test</div>
      <div class="tut-line" style="width:80%"></div><div class="tut-line" style="width:60%"></div><div class="tut-line" style="width:70%"></div></div>
    <div style="font-size:9px;color:#7a8598;text-align:center">nome + email e sei pronto</div>`),
  adatta: () => _tf("Adatta al singolo", "#5a4a8a", `
    <div class="tc"><b style="font-size:12px">Sposta i giorni</b><div style="font-size:10px;color:#7a8598">Lun → Mar (solo per lui)</div></div>
    <div class="tc"><b style="font-size:12px">Meno ripetute</b><div style="margin-top:4px"><s style="color:#c0392b">6×</s> <b style="color:#5a4a8a">4×60 m</b></div></div>
    <div style="font-size:9px;color:#7a8598;text-align:center">senza toccare il programma madre</div>`),
  monitoraggio: () => _tf("Monitoraggio", _TA, `
    <div class="tc"><div style="font-size:10px;color:#7a8598">Carico e forma (ACWR)</div>
      <svg viewBox="0 0 190 70" style="width:100%;margin-top:4px"><polyline points="8,58 40,48 72,40 104,30 136,36 168,22" fill="none" stroke="${_TA}" stroke-width="2.5"/>${[[8, 58], [72, 40], [136, 36], [168, 22]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${_TA}"/>`).join("")}</svg>
      <div style="font-size:10px"><b style="color:${_TG}">ACWR 1.1</b> · in zona sicura</div></div>
    <div style="font-size:9px;color:#7a8598;text-align:center">dati veri da ciò che gli atleti fanno</div>`),
  analisi: () => _tf("Analisi · Test", "#1a6a5a", `
    <div class="tc"><b style="font-size:12px">Profilo Forza-Velocità</b>
      <svg viewBox="0 0 190 60" style="width:100%;margin-top:4px"><line x1="10" y1="52" x2="150" y2="14" stroke="#1a6a5a" stroke-width="2"/><circle cx="10" cy="52" r="3" fill="#1a6a5a"/><circle cx="150" cy="14" r="3" fill="#1a6a5a"/><text x="156" y="18" font-size="9" fill="#7a8598">Pmax</text></svg></div>
    <div class="tc" style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:12px">Come si fa</b><span class="tut-play" style="position:static">▶</span></div>
    <div style="font-size:9px;color:#7a8598;text-align:center">ogni test ha «come si fa» col video</div>`),
  report: () => _tf("Report PDF", _TA, `
    <div class="tc"><b style="font-size:12px">Leonardo Zetti</b><div style="font-size:9px;color:#7a8598">velocità · 100 m</div>
      <div style="display:flex;gap:6px;margin-top:8px">${["PB", "ACWR", "Forma"].map(k => `<div style="flex:1;background:#eef2f8;border-radius:8px;text-align:center;padding:6px 0"><div style="font-size:8px;color:#7a8598">${k}</div></div>`).join("")}</div>
      <div style="font-size:10px;color:#7a8598;margin-top:8px">Storico test</div>
      <svg viewBox="0 0 190 34" style="width:100%"><polyline points="6,28 50,22 94,16 138,12 182,6" fill="none" stroke="${_TG}" stroke-width="2"/></svg></div>
    <div style="font-size:9px;color:#7a8598;text-align:center">tutto l'atleta in un PDF</div>`)
};

function _tutMock(key) {
  const fn = _TUT_SCREENS[key];
  return fn ? fn() : _tf("Metis", _TA, `<div style="text-align:center;padding:30px 0;font-weight:700;color:${_TA}">Metis Performance</div>`);
}

function _tutCSS() {
  return `<style>
  .tut-wrap{max-width:600px;margin:0 auto;text-align:center;padding:6px 8px 24px}
  .tut-phone{width:222px;max-width:70vw;margin:0 auto;border:7px solid #12151c;border-radius:30px;background:#12151c;box-shadow:0 18px 44px rgba(0,0,0,.42);position:relative;padding:9px 0}
  .tut-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:62px;height:13px;background:#12151c;border-radius:0 0 11px 11px;z-index:2}
  .tut-scr{background:#eef2f7;border-radius:22px;margin:0 7px;min-height:334px;font-family:system-ui,Segoe UI,Arial;color:#2a3345;overflow:hidden}
  .tut-hd{padding:12px 14px;color:#fff;font-weight:700;font-size:13.5px}
  .tut-bd{padding:10px 11px;display:flex;flex-direction:column;gap:9px}
  .tut-scr .tc{background:#fff;border:1px solid #dde4ee;border-radius:12px;padding:10px 12px;font-size:12px;text-align:left}
  .tut-scorerow{display:flex;align-items:center;justify-content:space-between;padding:5px 0}
  .tut-scorerow span{font-size:11px;font-weight:600}
  .tut-dots{display:flex;gap:6px}
  .tut-dot{width:19px;height:19px;border-radius:50%;border:0;padding:0;cursor:pointer;transition:background .15s,transform .1s}
  .tut-dot:active{transform:scale(.85)}
  .tut-mini{border:0;border-radius:16px;padding:8px 14px;font-size:12px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.15)}
  .tut-mini:active{transform:translateY(1px)}
  .tut-step{width:26px;height:26px;border-radius:50%;border:1px solid #cdd6e4;background:#fff;font-size:15px;font-weight:700;color:${_TA};cursor:pointer;line-height:1}
  .tut-step:active{background:#eef2f8}
  .tut-tempi{display:flex;gap:6px}.tut-tempi span{flex:1;text-align:center;background:#eef2f8;border-radius:7px;padding:6px 0;font-size:11px}.tut-tempi .ok{background:#dff3e6;color:${_TG};font-weight:700}
  .tut-arow{display:flex;align-items:center;gap:8px;padding:8px 6px;border-radius:9px;cursor:pointer;font-size:12px}
  .tut-arow.on{background:#e9f0fb}
  .tut-sdot{width:12px;height:12px;border-radius:50%;flex:none}
  .tut-pill{display:inline-block;font-size:9px;font-weight:700;color:#fff;padding:2px 8px;border-radius:10px}
  .tut-hint{font-size:10px;color:#8a94a3;text-align:center;background:#e4e9f1;border-radius:9px;padding:5px 8px;margin-top:1px}
  .tut-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .tut-thumb{background:#20304a;border-radius:10px;height:66px;position:relative;display:flex;align-items:flex-end;padding:6px}.tut-thumb span{font-size:9px;color:#cfe0ff}
  .tut-play{position:absolute;top:16px;left:50%;transform:translateX(-50%);color:#fff;font-size:14px}
  .tut-cday{width:15px;height:15px;border-radius:50%;margin-top:4px}
  .tut-prog2{height:12px;border-radius:6px;background:#e6ecf5;margin-top:6px;overflow:hidden}.tut-prog2>i{display:block;height:100%;background:${_TG}}
  .tut-line{height:8px;border-radius:4px;background:#e6ecf5;margin:5px 0}
  .tut-in{animation:tutIn .34s cubic-bezier(.2,.7,.3,1)}
  @keyframes tutIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .tut-come{max-width:440px;margin:14px auto 0;text-align:left;background:var(--card2,rgba(120,120,140,.08));border-radius:14px;padding:12px 14px}
  .tut-come li{font-size:13.5px;line-height:1.5;color:var(--txt2);margin:3px 0}
  .tut-badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:var(--blu,#2b4c7e);padding:3px 10px;border-radius:20px}
  .tut-prog{height:5px;border-radius:3px;background:var(--line2,#e2e8f2);max-width:440px;margin:0 auto 6px;overflow:hidden}
  .tut-prog>i{display:block;height:100%;background:var(--blu,#2b4c7e);border-radius:3px;transition:width .35s ease}
  </style>`;
}
