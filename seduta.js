// Schermata della seduta: pista e palestra.
const T = { id: null, sec: 0, handle: null };   // timer di recupero

function sedutaDaId(id) { return DEMO.sedute.find(s => s.id === id) || (typeof sedutaGen === "function" ? sedutaGen(id) : null); }

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

// Obiettivi e focus della seduta: li scrive l'allenatore, l'atleta li legge.
function bloccoObiettivi(s) {
  const coach = S.utente.ruolo === "coach";
  const testo = (s.obiettivi || "").trim();
  if (!coach && !testo) return "";
  return `<div class="card">
    <p class="et">Obiettivi e focus di oggi${coach ? " · <span style='color:var(--blu)'>lo scrivi tu, l'atleta lo vede</span>" : ""}</p>
    ${coach
      ? `<textarea rows="4" style="margin-top:8px" placeholder="Punti chiave della seduta, su cosa concentrarsi negli esercizi..."
           onchange="segnaTestoSeduta('${s.id}','obiettivi',this.value)">${testo}</textarea>`
      : `<div class="obiettivi">${testo.split("\n").filter(r => r.trim()).map(r => `<div>${r}</div>`).join("")}</div>`}
  </div>`;
}
function segnaTestoSeduta(sid, campo, val) { sedutaDaId(sid)[campo] = val; }
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
  const emb = lib && lib.v && typeof ytEmbed === "function" ? ytEmbed(lib.v) : "";
  mostraFoglio(`
    <div class="foglio-top">
      <button class="chiudi" onclick="apriScheda('${prot}')" aria-label="Indietro">‹</button>
      <h3 style="flex:1;text-align:center">${nome}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    <p class="et" style="text-align:center;margin-bottom:10px">${voce}</p>
    ${lib && lib.cue ? `<p style="font-size:14px;line-height:1.6;margin-bottom:10px">${lib.cue}</p>` : ""}
    ${emb
      ? `<div class="yt-wrap"><iframe src="${emb}" title="${nome}"
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
           allowfullscreen loading="lazy"></iframe></div>
         <a class="et" style="display:block;text-align:center;margin-top:8px;color:var(--blu)"
            href="${lib.v}" target="_blank" rel="noopener">apri su YouTube ↗</a>`
      : `<div class="video-vuoto"><span>▶</span></div>
         <p class="et" style="margin-top:12px">Video non ancora disponibile per questo esercizio.</p>`}`);
}

// recupero in secondi -> "3'" oppure "1'30"
function fmtRec(sec) { if (!sec) return ""; const m = Math.floor(sec / 60), s = sec % 60; return s ? m + "'" + String(s).padStart(2, "0") : m + "'"; }
function volumeKg(x) { return x.peso ? x.serie * x.rep * x.peso : null; }
function volumePista(s) { return (s.elementi || []).reduce((t, e) => t + e.ripetute * e.distanza, 0); }

// ---------- PISTA ----------
function vistaPista(s) {
  if (s.mezzo && typeof vistaPistaMezzo === "function") return vistaPistaMezzo(s);   // seduta mezzofondo/fondo
  if (s.lanci && typeof vistaPistaLanci === "function") return vistaPistaLanci(s);   // seduta lanci
  return `${bloccoRiscaldamento(s)}
  ${typeof bloccoPliometria === "function" ? bloccoPliometria(s) : ""}
  ${s.elementi.map(e => {
    const caselle = e.tempi.map((t, i) => {
      const v = t === null ? "" : t;
      let cls = "";
      if (t !== null && e.target != null) {
        const peggio = (t - e.target) / e.target * 100;
        cls = peggio > CONFIG.soglie.pistaPeggioPct ? "male" : "bene";
      }
      return `<input class="tempo ${cls}" inputmode="decimal" value="${v}" placeholder="—"
        onchange="segnaTempo('${s.id}','${e.id}',${i},this.value)">`;
    }).join("");
    const meta = [e.percentuale != null ? e.percentuale + "%" : "", e.recupero ? "rec " + e.recupero : ""].filter(Boolean).join(" · ");
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3>${e.ripetute} × ${e.distanza} m</h3>
        <span class="et" style="margin:0">${meta}</span>
      </div>
      <p class="et" style="margin:4px 0 10px">${e.target != null ? "obiettivo <b>" + e.target.toFixed(2) + " s</b> · " : ""}volume ${e.ripetute * e.distanza} m</p>
      <div class="tempi">${caselle}</div>
      ${bloccoSforzoPista(s.id, e)}
    </div>`;
  }).join("")}
  <div class="card" style="display:flex;justify-content:space-between;align-items:center">
    <span class="et" style="margin:0">Volume totale della seduta</span>
    <b style="font-size:17px">${volumePista(s)} m</b>
  </div>
  ${bloccoChiusura(s)}`;
}

function segnaTempo(sid, eid, i, val) {
  const s = sedutaDaId(sid), e = s.elementi.find(x => x.id === eid);
  const n = parseFloat(String(val).replace(",", "."));
  e.tempi[i] = isNaN(n) ? null : n;
  disegna();
}

// ---------- sforzo percepito (RPE) + "non chiuse/non completato" per singolo lavoro ----------
// Blocco per un ELEMENTO di pista (ripetute velocità / mezzo / lanci): RPE + segnalazione se non chiuse.
function bloccoSforzoPista(sid, e) {
  return `<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <label class="lab" style="margin:0">Sforzo percepito (RPE 1-10)</label>
      <input inputmode="decimal" value="${e.rpe ?? ""}" placeholder="es. 8.5" style="width:90px"
        onchange="setEsitoPista('${sid}','${e.id}','rpe',this.value)">
    </div>
    <label class="check" style="margin-top:8px">
      <input type="checkbox" ${e.nonCompletato ? "checked" : ""} onchange="setEsitoPista('${sid}','${e.id}','nonCompletato',this.checked)">
      <span>Non ho chiuso le ripetute</span></label>
    ${e.nonCompletato ? `<textarea rows="2" style="margin-top:6px" placeholder="Cosa è successo? (es. fermato dopo la 3ª, fastidio al polpaccio...)"
       onchange="setEsitoPista('${sid}','${e.id}','notaAtleta',this.value)">${e.notaAtleta || ""}</textarea>` : ""}
  </div>`;
}
function setEsitoPista(sid, eid, campo, val) {
  const s = sedutaDaId(sid), e = s && (s.elementi || []).find(x => x.id === eid);
  if (!e) return;
  if (campo === "nonCompletato") { e.nonCompletato = val; disegna(); }
  else if (campo === "rpe") e.rpe = (val === "" ? null : Number(String(val).replace(",", ".")));
  else e[campo] = val;
}
// Blocco per un ESERCIZIO di palestra: RPE + "non chiuso" con serie/rep effettive.
function bloccoSforzoEs(sid, x) {
  return `<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <label class="lab" style="margin:0">Sforzo percepito (RPE 1-10)</label>
      <input inputmode="decimal" value="${x.rpe ?? ""}" placeholder="es. 8.5" style="width:90px"
        onchange="setEsitoEs('${sid}','${x.id}','rpe',this.value)">
    </div>
    <label class="check" style="margin-top:8px">
      <input type="checkbox" ${x.nonCompletato ? "checked" : ""} onchange="setEsitoEs('${sid}','${x.id}','nonCompletato',this.checked)">
      <span>Non ho chiuso — ho fatto meno del previsto</span></label>
    ${x.nonCompletato ? `<div class="griglia2" style="margin-top:6px">
        <div><label class="lab">Serie fatte</label><input inputmode="numeric" value="${x.serieFatte ?? ""}" placeholder="es. 2"
          onchange="setEsitoEs('${sid}','${x.id}','serieFatte',this.value)"></div>
        <div><label class="lab">Rep dell'ultima</label><input inputmode="numeric" value="${x.repFatte ?? ""}" placeholder="es. 6"
          onchange="setEsitoEs('${sid}','${x.id}','repFatte',this.value)"></div>
      </div>
      <textarea rows="2" style="margin-top:6px" placeholder="Cosa è successo? (es. carico troppo alto, fastidio...)"
        onchange="setEsitoEs('${sid}','${x.id}','notaAtleta',this.value)">${x.notaAtleta || ""}</textarea>` : ""}
  </div>`;
}
function setEsitoEs(sid, xid, campo, val) {
  const s = sedutaDaId(sid), x = s && (s.esercizi || []).find(e => e.id === xid);
  if (!x) return;
  if (campo === "nonCompletato") { x.nonCompletato = val; disegna(); }
  else if (campo === "rpe" || campo === "serieFatte" || campo === "repFatte") x[campo] = (val === "" ? null : Number(String(val).replace(",", ".")));
  else x[campo] = val;
}

// ---------- PALESTRA ----------
function vistaPalestra(s) {
  return `${bloccoRiscaldamento(s)}
  ${typeof bloccoPliometria === "function" ? bloccoPliometria(s) : ""}
  <p class="et" style="margin:0 2px 8px">Tocca l'esercizio da cui parti</p>
  ${s.esercizi.map(x => x.id === T.id ? esercizioAperto(s, x) : esercizioChiuso(s, x)).join("")}
  ${bloccoChiusura(s)}`;
}

function esercizioChiuso(s, x) {
  const fatte = x.vbt.filter(v => v !== null).length;
  const finito = x.serie > 0 && fatte === x.serie;
  const vol = volumeKg(x);
  const presc = `${x.serie} × ${x.rep}${x.peso ? " · " + x.peso + " kg" : ""}${x.tut ? " · TUT " + x.tut : ""}${vol ? " · vol " + vol + " kg" : ""}`;
  let cls = "", stato = "";
  if (finito && x.vbtTarget) {
    const m = media(x.vbt);
    const sotto = (x.vbtTarget - m) / x.vbtTarget * 100;
    cls = sotto > CONFIG.soglie.vbtSottoPct ? "male" : "bene";
    stato = `media ${m.toFixed(2)} m/s` + (cls === "male" ? ` · sotto ${x.vbtTarget}` : " · in linea");
  } else if (fatte) stato = `${fatte}/${x.serie} serie`;

  return `<div class="card es ${cls}" onclick="apriEsercizio('${x.id}')">
    <div style="display:flex;align-items:center;gap:10px">
      <span class="spunta ${finito ? (cls === "male" ? "w" : "v") : ""}">${finito ? "✓" : ""}</span>
      <div style="flex:1;min-width:0">
        <h3>${x.nome}</h3>
        <p class="et" style="margin-top:2px">${presc}</p>
        ${stato ? `<p class="et" style="margin-top:1px">${stato}</p>` : ""}
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
      ${x.peso ? x.peso + " kg" : "corpo libero"}${x.tut ? " · TUT " + x.tut : ""}${x.recuperoSec ? " · rec " + fmtRec(x.recuperoSec) : ""}${x.vbtTarget ? " · vel. " + x.vbtTarget.toFixed(2) + " m/s" : ""}${volumeKg(x) ? " · vol " + volumeKg(x) + " kg" : ""}
    </p>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <label class="lab" style="margin:0">Peso usato (kg)</label>
      <input inputmode="decimal" value="${x.pesoFatto != null ? x.pesoFatto : ""}" placeholder="${x.peso ? x.peso : "kg"}" style="width:110px"
        onchange="setPesoFatto('${s.id}','${x.id}',this.value)">
    </div>
    ${righe}${parziale}
    ${T.sec > 0 ? bloccoTimer() : ""}
    ${bloccoSforzoEs(s.id, x)}
  </div>`;
}

// l'atleta segna il peso davvero usato in un esercizio. Se la seduta è GIÀ chiusa (lo aggiunge dopo),
// si salva subito nel DB senza dover richiudere.
function setPesoFatto(sid, xid, val) {
  const s = sedutaDaId(sid), x = s && (s.esercizi || []).find(e => e.id === xid);
  if (!x) return;
  const n = Number(String(val).replace(",", "."));
  x.pesoFatto = (val === "" || !Number.isFinite(n)) ? null : n;
  if (s.chiusa && typeof salvaSedutaSvoltaDB === "function") salvaSedutaSvoltaDB(s);
}
function media(a) { const v = a.filter(x => x !== null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; }

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
      <div><label class="lab">RPE (1-10, anche mezzi)</label>
        <input inputmode="decimal" value="${s.rpe ?? ""}" placeholder="es. 8.5"
          onchange="segnaChiusura('${s.id}','rpe',this.value)"></div>
    </div>
    <label class="check" style="margin-top:12px">
      <input type="checkbox" ${s.fastidi ? "checked" : ""}
        onchange="segnaChiusura('${s.id}','fastidi',this.checked)">
      <span>Ho avuto un fastidio durante l'allenamento</span>
    </label>
    ${S.utente.ruolo === "coach"
      ? `<div style="margin-top:14px">
           <label class="lab">Nota dell'allenatore — promemoria su cosa lavorare <span style="color:var(--txt3)">(la vedi solo tu)</span></label>
           <textarea rows="3" style="margin-top:6px" placeholder="Es. curare l'uscita, controllare la caviglia, alzare il carico la prossima volta..."
             onchange="segnaTestoSeduta('${s.id}','notaCoach',this.value)">${s.notaCoach || ""}</textarea>
         </div>`
      : ""}
    <button class="btn" style="margin-top:14px" onclick="chiudiSeduta('${s.id}')">
      ${s.chiusa ? "Allenamento salvato ✓" : "Chiudi allenamento e segna presenza"}
    </button>
    ${S.utente && S.utente.ruolo !== "coach" && typeof apriCondividi === "function"
      ? `<button class="btn btn-2" style="margin-top:8px" onclick="apriCondividi('${s.id}')">📸 Condividi l'allenamento (card Metis)</button>`
      : ""}
  </div>`;
}
function segnaChiusura(sid, campo, val) {
  const s = sedutaDaId(sid);
  if (campo === "fastidi") { s[campo] = val; return; }
  const n = Number(String(val).replace(",", "."));
  s[campo] = (val === "" || !Number.isFinite(n)) ? null : n;   // scarta NaN (es. testo) invece di salvarlo
}
async function chiudiSeduta(sid) {
  const s = sedutaDaId(sid);
  if (typeof atletaBloccato === "function" && S.utente && atletaBloccato(S.utente.atletaId)) { alert("🔒 Scheda dimostrativa in sola lettura: l'allenamento non viene salvato."); return; }
  if (s.durata === null || s.rpe === null) { alert("Scrivi durata e RPE prima di chiudere."); return; }
  // palestra: registra la seduta (Serie/Rep/Peso/Volume/RPE/VBT) → Monitoraggio VBT + Andamento Palestra
  if (s.tipo === "palestra" && typeof registraVbt === "function") {
    const aid = (S.utente && S.utente.atletaId) || (DEMO.atleti[0] && DEMO.atleti[0].id);
    (s.esercizi || []).forEach(x => {
      const fatte = x.vbt.filter(v => v !== null);
      const vbtMedia = fatte.length ? media(x.vbt) : null;
      registraVbt(aid, x.nome, x.peso || null, vbtMedia, x.vbtTarget || null,
        { serie: x.serie != null ? x.serie : null, rep: x.rep != null ? x.rep : null, volume: volumeKg(x), rpe: s.rpe });
    });
  }
  // lanci: registra mezzo / attrezzo / n. lanci / miglior misura → registro lanci
  if (s.lanci && typeof registraLancio === "function") {
    const aid = (S.utente && S.utente.atletaId) || (DEMO.atleti[0] && DEMO.atleti[0].id);
    (s.elementi || []).forEach(e => {
      const fatte = (e.misure || []).filter(v => v !== null);
      registraLancio(aid, e.mezzo, e.kg, e.tipo, e.lanci, fatte.length ? Math.max(...fatte) : null);
    });
  }
  // pista: registra Tempo (media eseguita) / Volume (m) / Vel per distanza → Andamento Pista
  if (s.tipo === "pista" && typeof registraPista === "function") {
    const aid = (S.utente && S.utente.atletaId) || (DEMO.atleti[0] && DEMO.atleti[0].id);
    (s.elementi || []).forEach(e => {
      const fatti = (e.tempi || []).filter(v => v !== null);
      if (!fatti.length) return;
      const tmedio = fatti.reduce((a, b) => a + b, 0) / fatti.length;
      registraPista(aid, e.distanza, tmedio, e.ripetute * e.distanza, tmedio ? e.distanza / tmedio : null);
      // miglior tempo della seduta su questa distanza → aggiorna PB in allenamento.
      // NON per il mezzofondo: le ripetute si corrono a ritmo prescritto (non al massimo) → eviterei falsi PB.
      if (!s.mezzo && typeof aggiornaPbAllenamento === "function") aggiornaPbAllenamento(aid, e.distanza + " m", Math.min(...fatti));
    });
  }
  s.chiusa = true;
  // TAPPA 4: la seduta svolta va al coach (DB) → screening/andamento/VBT/carico reali
  if (typeof salvaSedutaSvoltaDB === "function") { try { await salvaSedutaSvoltaDB(s); } catch (e) { /* offline: resta in locale */ } }
  fermaTimer(); S.seduta = null; S.vista = "oggi"; disegna();
}

// ---------- ingresso ----------
function vistaSeduta() {
  const s = sedutaDaId(S.seduta);
  if (!s) return `<button class="indietro" onclick="tornaIndietro()">‹ Indietro</button>
    <div class="card"><p class="et">Questa seduta non è più disponibile (il programma è cambiato). Torna indietro.</p></div>`;
  const corpo = s.tipo === "pista" ? vistaPista(s) : vistaPalestra(s);
  return `<button class="indietro" onclick="tornaIndietro()">‹ Indietro</button>
    <div class="card" style="background:var(--blu);color:#fff;border:0">
      <p class="et" style="color:#fff;opacity:.85">${s.data}</p>
      <h3 style="color:#fff">${s.tipo === "pista" ? "Pista" : "Palestra"} · giorno ${s.giorno}</h3>
      <p style="font-size:13px;margin-top:6px;opacity:.9">${s.focus}</p>
    </div>
    ${s.chiusa ? `<div class="card" style="border-color:var(--verde);background:var(--verde-bg)"><p style="margin:0;font-weight:600;color:var(--verde)">✓ Allenamento già svolto${s.rpe ? " · RPE " + s.rpe : ""}${s.durata ? " · " + s.durata + "′" : ""}</p><p class="et" style="margin:4px 0 0">Lo stai <b>rivedendo</b>: i tuoi dati sono già salvati. Puoi correggere qualcosa se serve e richiudere.</p></div>` : ""}
    ${bloccoObiettivi(s)}
    <button class="btn-2" style="margin-bottom:11px" onclick="segnalaInfortunioSeduta()">🩹 Segnala infortunio / fastidio</button>
    ${corpo}`;
}
function segnalaInfortunioSeduta() {
  const aid = (S.utente && S.utente.atletaId) || (DEMO.atleti[0] && DEMO.atleti[0].id) || "";
  if (typeof apriInfortunio === "function") apriInfortunio(aid, "seduta");
}
function tornaIndietro() { fermaTimer(); T.id = null; S.seduta = null; disegna(); }
