// Schermata della seduta: pista e palestra.
const T = { id: null, sec: 0, handle: null };   // timer di recupero

function sedutaDaId(id) { return DEMO.sedute.find(s => s.id === id); }

// ---------- riscaldamento (comune) ----------
function bloccoRiscaldamento(s) {
  return `<div class="card">
    <p class="et">Riscaldamento</p>
    ${s.riscaldamento.map(n => `<div class="riga tocca" onclick="apriScheda('${n}')">
        <span>${n}</span><span class="freccia">›</span></div>`).join("")}
  </div>`;
}
function mostraFoglio(html) {
  $("velo").innerHTML = `<div class="foglio">${html}</div>`;
  $("velo").classList.add("on");
}
function chiudiScheda() { $("velo").classList.remove("on"); $("velo").innerHTML = ""; }

function apriScheda(nome) {
  const voci = DEMO.schede[nome] || ["(protocollo da compilare)"];
  mostraFoglio(`
    <div class="foglio-top"><h3>${nome}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    ${voci.map((v, i) => `<div class="riga tocca" onclick="apriEsercizioInfo('${nome}',${i})">
        <span>${v}</span><span class="freccia">›</span></div>`).join("")}
    <p class="et" style="margin-top:12px">Tocca un esercizio se non ti ricordi com'è fatto.</p>`);
}

function apriEsercizioInfo(prot, i) {
  const voce = (DEMO.schede[prot] || [])[i] || "";
  const nome = voce.replace(/\s+[×x]?\d.*$/i, "").trim() || voce;
  const lib = typeof cercaLibreria === "function" ? cercaLibreria(nome) : null;
  mostraFoglio(`
    <div class="foglio-top">
      <button class="chiudi" onclick="apriScheda('${prot}')" aria-label="Indietro">‹</button>
      <h3 style="flex:1;text-align:center">${nome}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    <p class="et" style="text-align:center;margin-bottom:12px">${voce}</p>
    ${lib && lib.cue ? `<p style="font-size:14px;line-height:1.6;margin-bottom:10px">${lib.cue}</p>` : ""}
    ${lib && lib.v
      ? `<a class="btn" style="text-decoration:none;display:block;text-align:center"
           href="${lib.v}" target="_blank" rel="noopener">▶ Guarda il video</a>`
      : `<div class="video-vuoto"><span>▶</span></div>
         <p class="et" style="margin-top:12px">Video non ancora disponibile per questo esercizio.</p>`}`);
}

// ---------- PISTA ----------
function vistaPista(s) {
  return `${bloccoRiscaldamento(s)}
  ${s.elementi.map(e => {
    const caselle = e.tempi.map((t, i) => {
      const v = t === null ? "" : t;
      let cls = "";
      if (t !== null) {
        const peggio = (t - e.target) / e.target * 100;
        cls = peggio > CONFIG.soglie.pistaPeggioPct ? "male" : "bene";
      }
      return `<input class="tempo ${cls}" inputmode="decimal" value="${v}" placeholder="—"
        onchange="segnaTempo('${s.id}','${e.id}',${i},this.value)">`;
    }).join("");
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3>${e.ripetute} × ${e.distanza} m</h3>
        <span class="et" style="margin:0">${e.percentuale}% · rec ${e.recupero}</span>
      </div>
      <p class="et" style="margin:4px 0 10px">obiettivo <b>${e.target.toFixed(2)} s</b></p>
      <div class="tempi">${caselle}</div>
    </div>`;
  }).join("")}
  ${bloccoChiusura(s)}`;
}

function segnaTempo(sid, eid, i, val) {
  const s = sedutaDaId(sid), e = s.elementi.find(x => x.id === eid);
  const n = parseFloat(String(val).replace(",", "."));
  e.tempi[i] = isNaN(n) ? null : n;
  disegna();
}

// ---------- PALESTRA ----------
function vistaPalestra(s) {
  return `${bloccoRiscaldamento(s)}
  <p class="et" style="margin:0 2px 8px">Tocca l'esercizio da cui parti</p>
  ${s.esercizi.map(x => x.id === T.id ? esercizioAperto(s, x) : esercizioChiuso(s, x)).join("")}
  ${bloccoChiusura(s)}`;
}

function esercizioChiuso(s, x) {
  const fatte = x.vbt.filter(v => v !== null).length;
  const finito = fatte === x.serie;
  let stato = `${x.serie} × ${x.rep}${x.peso ? " · " + x.peso + " kg" : ""}`;
  let cls = "";
  if (finito && x.vbtTarget) {
    const m = media(x.vbt);
    const sotto = (x.vbtTarget - m) / x.vbtTarget * 100;
    cls = sotto > CONFIG.soglie.vbtSottoPct ? "male" : "bene";
    stato = `media ${m.toFixed(2)} m/s` + (cls === "male" ? ` · sotto ${x.vbtTarget}` : " · in linea");
  } else if (fatte) stato += ` · ${fatte}/${x.serie} serie`;

  return `<div class="card es ${cls}" onclick="apriEsercizio('${x.id}')">
    <div style="display:flex;align-items:center;gap:10px">
      <span class="spunta ${finito ? (cls === "male" ? "w" : "v") : ""}">${finito ? "✓" : ""}</span>
      <div style="flex:1;min-width:0">
        <h3>${x.nome}</h3><p class="et" style="margin-top:2px">${stato}</p>
      </div>
      <span class="freccia">›</span>
    </div></div>`;
}

function esercizioAperto(s, x) {
  const righe = x.vbt.map((v, i) => `
    <div class="serie">
      <span class="n">S${i + 1}</span>
      <input inputmode="decimal" value="${v === null ? "" : v}" placeholder="m/s"
        onchange="segnaVbt('${s.id}','${x.id}',${i},this.value)">
      ${v !== null ? '<span class="ok">✓</span>' : '<span class="ok off">–</span>'}
    </div>`).join("");

  const fatte = x.vbt.filter(v => v !== null).length;
  const parziale = fatte ? `<p class="et" style="margin-top:8px">media finora <b>${media(x.vbt).toFixed(2)} m/s</b></p>` : "";

  return `<div class="card aperto">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <h3>${x.nome}</h3>
      <span class="et" style="margin:0">${x.serie} × ${x.rep}${x.percentuale ? " · " + x.percentuale + "%" : ""}</span>
    </div>
    <p class="et" style="margin:4px 0 10px">
      ${x.peso ? x.peso + " kg" : "corpo libero"}${x.vbtTarget ? " · velocità richiesta " + x.vbtTarget.toFixed(2) + " m/s" : ""}
    </p>
    ${righe}${parziale}
    ${T.sec > 0 ? bloccoTimer() : ""}
  </div>`;
}

function media(a) { const v = a.filter(x => x !== null); return v.reduce((s, x) => s + x, 0) / v.length; }

function apriEsercizio(id) { T.id = (T.id === id ? null : id); fermaTimer(); disegna(); }

function segnaVbt(sid, xid, i, val) {
  const s = sedutaDaId(sid), x = s.esercizi.find(e => e.id === xid);
  const n = parseFloat(String(val).replace(",", "."));
  x.vbt[i] = isNaN(n) ? null : n;
  const restano = x.vbt.some(v => v === null);
  if (!isNaN(n) && restano) avviaTimer(x.recuperoSec); else fermaTimer();
  disegna();
}

// ---------- timer di recupero ----------
function bloccoTimer() {
  const m = Math.floor(T.sec / 60), s = String(T.sec % 60).padStart(2, "0");
  return `<div class="timer">
    <span class="tv">${m}:${s}</span>
    <span class="tl">recupero</span>
    <button class="btn btn-2" style="width:auto;padding:6px 12px;font-size:13px" onclick="fermaTimer();disegna()">Salta</button>
  </div>`;
}
function avviaTimer(sec) {
  fermaTimer(); T.sec = sec;
  T.handle = setInterval(() => {
    T.sec--;
    if (T.sec <= 0) { fermaTimer(); disegna(); return; }
    const el = document.querySelector(".tv");
    if (el) el.textContent = Math.floor(T.sec / 60) + ":" + String(T.sec % 60).padStart(2, "0");
  }, 1000);
}
function fermaTimer() { if (T.handle) clearInterval(T.handle); T.handle = null; T.sec = 0; }

// ---------- chiusura seduta ----------
function bloccoChiusura(s) {
  return `<div class="card">
    <p class="et">A fine allenamento</p>
    <div class="griglia2">
      <div><label class="lab">Durata (min)</label>
        <input inputmode="numeric" value="${s.durata ?? ""}" placeholder="es. 75"
          onchange="segnaChiusura('${s.id}','durata',this.value)"></div>
      <div><label class="lab">RPE (1-10)</label>
        <input inputmode="numeric" value="${s.rpe ?? ""}" placeholder="es. 8"
          onchange="segnaChiusura('${s.id}','rpe',this.value)"></div>
    </div>
    <label class="check" style="margin-top:12px">
      <input type="checkbox" ${s.fastidi ? "checked" : ""}
        onchange="segnaChiusura('${s.id}','fastidi',this.checked)">
      <span>Ho avuto un fastidio durante l'allenamento</span>
    </label>
    <button class="btn" style="margin-top:14px" onclick="chiudiSeduta('${s.id}')">
      ${s.chiusa ? "Allenamento salvato ✓" : "Chiudi allenamento e segna presenza"}
    </button>
  </div>`;
}
function segnaChiusura(sid, campo, val) {
  const s = sedutaDaId(sid);
  s[campo] = (campo === "fastidi") ? val : (val === "" ? null : Number(val));
}
function chiudiSeduta(sid) {
  const s = sedutaDaId(sid);
  if (s.durata === null || s.rpe === null) { alert("Scrivi durata e RPE prima di chiudere."); return; }
  s.chiusa = true; fermaTimer(); S.seduta = null; S.vista = "oggi"; disegna();
}

// ---------- ingresso ----------
function vistaSeduta() {
  const s = sedutaDaId(S.seduta);
  const corpo = s.tipo === "pista" ? vistaPista(s) : vistaPalestra(s);
  return `<button class="indietro" onclick="tornaIndietro()">‹ Indietro</button>
    <div class="card" style="background:var(--blu);color:#fff;border:0">
      <p class="et" style="color:#fff;opacity:.85">${s.data}</p>
      <h3 style="color:#fff">${s.tipo === "pista" ? "Pista" : "Palestra"} · giorno ${s.giorno}</h3>
      <p style="font-size:13px;margin-top:6px;opacity:.9">${s.focus}</p>
    </div>${corpo}`;
}
function tornaIndietro() { fermaTimer(); T.id = null; S.seduta = null; disegna(); }
