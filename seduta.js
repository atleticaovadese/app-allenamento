// Schermata della seduta: pista e palestra.
const T = { id: null, sec: 0, handle: null, endAt: null, over: false, suonato: false };   // timer di recupero (endAt = istante di fine, wall-clock)

function sedutaDaId(id) { return DEMO.sedute.find(s => s.id === id) || (typeof sedutaGen === "function" ? sedutaGen(id) : null); }

// ---------- BOZZA locale dell'allenamento IN CORSO ----------
// Ogni dato che l'atleta segna (tempi, misure, VBT, peso, RPE, "non completato", note) viene salvato subito
// nel telefono (localStorage). Così se cambia app o la pagina si ricarica NON perde nulla: alla riapertura
// i dati tornano, e vengono inviati al coach solo quando chiude l'allenamento. Bozza cancellata alla chiusura.
function _bozzaKey(s) { return "metis_bozza:" + (s.atletaId || (S.utente && S.utente.atletaId) || "") + ":" + s.id; }
function _datiBozza(s) {
  return s.tipo === "pista"
    ? { elementi: (s.elementi || []).map(e => ({ distanza: e.distanza, ripetute: e.ripetute, mezzo: e.mezzo, tempi: e.tempi, misure: e.misure, rpe: e.rpe, nonCompletato: !!e.nonCompletato, notaAtleta: e.notaAtleta || "" })) }
    : { esercizi: (s.esercizi || []).map(x => ({ nome: x.nome, vbt: x.vbt, pesoFatto: x.pesoFatto, rpe: x.rpe, nonCompletato: !!x.nonCompletato, serieFatte: x.serieFatte, repFatte: x.repFatte, notaAtleta: x.notaAtleta || "" })) };
}
function salvaBozzaSeduta(s) {
  if (!s || s.chiusa || !s.id) return;   // chiusa = già salvata nel DB, niente bozza
  try { localStorage.setItem(_bozzaKey(s), JSON.stringify({ ts: Date.now(), tipo: s.tipo, durata: s.durata, rpe: s.rpe, fastidi: !!s.fastidi, notaCoach: s.notaCoach || "", dati: _datiBozza(s) })); } catch (e) { }
}
function _rimuoviBozza(s) { if (s) { try { localStorage.removeItem(_bozzaKey(s)); } catch (e) { } } }
function applicaBozza(s) {
  if (!s || s.chiusa || s._bozzaApplicata) return s;
  s._bozzaApplicata = true;   // applica una sola volta per oggetto (le modifiche in memoria restano la verità durante la sessione)
  let b; try { const r = localStorage.getItem(_bozzaKey(s)); b = r ? JSON.parse(r) : null; } catch (e) { b = null; }
  if (!b) return s;
  if (b.ts && (Date.now() - b.ts) > 3 * 24 * 3600 * 1000) { _rimuoviBozza(s); return s; }   // bozza vecchia (>3 gg): scarta
  if (b.durata != null) s.durata = b.durata;
  if (b.rpe != null) s.rpe = b.rpe;
  if (b.fastidi) s.fastidi = true;
  if (b.notaCoach) s.notaCoach = b.notaCoach;
  const d = b.dati || {};
  if (s.tipo === "pista" && d.elementi) {
    const used = [];
    (s.elementi || []).forEach((e, i) => {
      let de = d.elementi.find((c, j) => !used[j] && Number(c.distanza) === Number(e.distanza) && Number(c.ripetute) === Number(e.ripetute) && (c.mezzo || "") === (e.mezzo || ""));
      if (!de && d.elementi[i] && !used[i]) de = d.elementi[i];
      if (!de) return;
      used[d.elementi.indexOf(de)] = true;
      if (de.tempi) e.tempi = de.tempi;
      if (de.misure) e.misure = de.misure;
      if (de.rpe != null) e.rpe = de.rpe;
      if (de.nonCompletato) { e.nonCompletato = true; e.notaAtleta = de.notaAtleta || ""; }
    });
  } else if (s.esercizi && d.esercizi) {
    const used = [];
    (s.esercizi || []).forEach((x, i) => {
      let dx = d.esercizi.find((c, j) => !used[j] && (c.nome || "") === (x.nome || ""));
      if (!dx && d.esercizi[i] && !used[i]) dx = d.esercizi[i];
      if (!dx) return;
      used[d.esercizi.indexOf(dx)] = true;
      if (dx.vbt) x.vbt = dx.vbt;
      if (dx.pesoFatto != null) x.pesoFatto = dx.pesoFatto;
      if (dx.rpe != null) x.rpe = dx.rpe;
      if (dx.nonCompletato) { x.nonCompletato = true; x.serieFatte = dx.serieFatte; x.repFatte = dx.repFatte; x.notaAtleta = dx.notaAtleta || ""; }
    });
  }
  return s;
}

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
function segnaTestoSeduta(sid, campo, val) { const s = sedutaDaId(sid); s[campo] = val; salvaBozzaSeduta(s); }
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
// scheda "come si fa" di un esercizio dato solo il nome (usata nella seduta di palestra dell'atleta)
function mostraSchedaEsercizio(nome) {
  const lib = typeof cercaLibreria === "function" ? cercaLibreria(nome) : null;
  const emb = lib && lib.v && typeof ytEmbed === "function" ? ytEmbed(lib.v) : "";
  mostraFoglio(`
    <div class="foglio-top"><h3 style="flex:1;text-align:center">${nome}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    ${lib && lib.cue ? `<p style="font-size:14px;line-height:1.6;margin-bottom:10px">${lib.cue}</p>` : ""}
    ${emb
      ? `<div class="yt-wrap"><iframe src="${emb}" title="${nome}"
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
           allowfullscreen loading="lazy"></iframe></div>
         <a class="et" style="display:block;text-align:center;margin-top:8px;color:var(--blu)"
            href="${lib.v}" target="_blank" rel="noopener">apri su YouTube ↗</a>`
      : `<div class="video-vuoto"><span>▶</span></div>
         <p class="et" style="margin-top:12px">Video non ancora disponibile per questo esercizio. Puoi cercarlo nella libreria (Sala).</p>`}`);
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
  ${typeof bloccoCore === "function" ? bloccoCore(s) : ""}
  ${typeof bloccoSpeciali === "function" ? bloccoSpeciali(s) : ""}
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
    const cont = e.contenuto ? String(e.contenuto).replace(/&/g, "&amp;").replace(/</g, "&lt;") : "";
    return `<div class="card">
      ${cont ? `<p style="font-weight:600;font-size:15px;margin:0 0 6px;line-height:1.35">${cont}</p>` : ""}
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
  salvaBozzaSeduta(s);
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
  if (campo === "nonCompletato") { e.nonCompletato = val; salvaBozzaSeduta(s); disegna(); return; }
  else if (campo === "rpe") e.rpe = (val === "" ? null : Number(String(val).replace(",", ".")));
  else e[campo] = val;
  salvaBozzaSeduta(s);
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
  if (campo === "nonCompletato") { x.nonCompletato = val; salvaBozzaSeduta(s); disegna(); return; }
  else if (campo === "rpe" || campo === "serieFatte" || campo === "repFatte") x[campo] = (val === "" ? null : Number(String(val).replace(",", ".")));
  else x[campo] = val;
  salvaBozzaSeduta(s);
}

// ---------- PALESTRA ----------
function vistaPalestra(s) {
  return `${bloccoRiscaldamento(s)}
  ${typeof bloccoPliometria === "function" ? bloccoPliometria(s) : ""}
  ${typeof bloccoCore === "function" ? bloccoCore(s) : ""}
  ${typeof bloccoSpeciali === "function" ? bloccoSpeciali(s) : ""}
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
    <p class="et" style="margin:4px 0 8px">
      ${x.peso ? x.peso + " kg" : "corpo libero"}${x.tut ? " · TUT " + x.tut : ""}${x.recuperoSec ? " · rec " + fmtRec(x.recuperoSec) : ""}${x.vbtTarget ? " · vel. " + x.vbtTarget.toFixed(2) + " m/s" : ""}${volumeKg(x) ? " · vol " + volumeKg(x) + " kg" : ""}
    </p>
    <button class="btn btn-2" style="width:auto;padding:7px 12px;font-size:13px;margin-bottom:10px" onclick="mostraSchedaEsercizio('${String(x.nome).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">▶ Come si fa</button>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <label class="lab" style="margin:0">Peso usato (kg)</label>
      <input inputmode="decimal" value="${x.pesoFatto != null ? x.pesoFatto : ""}" placeholder="${x.peso ? x.peso : "kg"}" style="width:110px"
        onchange="setPesoFatto('${s.id}','${x.id}',this.value)">
    </div>
    ${righe}${parziale}
    <button class="btn btn-2" style="width:auto;padding:8px 14px;font-size:13px;margin-top:8px" onclick="avviaRecupero('${s.id}','${x.id}')">⏱ Avvia recupero${x.recuperoSec > 0 ? " · " + fmtRec(x.recuperoSec) : ""}</button>
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
  if (s.chiusa) { if (typeof salvaSedutaSvoltaDB === "function") salvaSedutaSvoltaDB(s); }
  else salvaBozzaSeduta(s);
}
function media(a) { const v = a.filter(x => x !== null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; }

function apriEsercizio(id) { T.id = (T.id === id ? null : id); disegna(); }   // il recupero NON si ferma cambiando esercizio: continua galleggiante

function segnaVbt(sid, xid, i, val) {
  const s = sedutaDaId(sid), x = s.esercizi.find(e => e.id === xid);
  const n = parseFloat(String(val).replace(",", "."));
  x.vbt[i] = isNaN(n) ? null : n;
  const restano = x.vbt.some(v => v === null);
  if (!isNaN(n) && restano) avviaTimer(x.recuperoSec); else fermaTimer();
  salvaBozzaSeduta(s);
  disegna();
}
// avvia il recupero a mano (senza dover segnare i m/s): usa il recupero prescritto, o 90s di default
function avviaRecupero(sid, xid) {
  const s = sedutaDaId(sid), x = s && (s.esercizi || []).find(e => e.id === xid);
  const rec = (x && x.recuperoSec > 0) ? x.recuperoSec : 90;
  avviaTimer(rec);
}

// ---------- timer di recupero (GALLEGGIANTE: continua anche navigando; va in negativo e in ROSSO se si sfora) ----------
// Elemento fisso attaccato al <body>: NON dipende da disegna(), così resta mentre l'atleta gira per l'app.
function _timerEl() {
  let el = document.getElementById("timer-flt");
  if (!el) {
    el = document.createElement("div");
    el.id = "timer-flt";
    el.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:6000;display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:14px;background:var(--card2,#171c28);border:1px solid var(--line2,#2a3550);box-shadow:0 6px 22px rgba(0,0,0,.45);font-size:15px;color:var(--txt,#e6ebf5);max-width:92vw";
    el.innerHTML = `<span id="timer-flt-txt"></span><button onclick="fermaTimer()" style="border:none;background:transparent;color:inherit;font-size:13px;cursor:pointer;opacity:.75;padding:4px 6px">✕ stop</button>`;
    document.body.appendChild(el);
  }
  return el;
}
function _mmss(s) { s = Math.max(0, s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
function _timerRender() {
  const el = _timerEl(), txt = el.querySelector("#timer-flt-txt");
  if (T.over) {
    el.style.borderColor = "var(--rosso,#b02a37)"; el.style.background = "rgba(176,42,55,.16)"; el.style.color = "var(--rosso,#e0556a)";
    txt.innerHTML = `⏱ recupero finito · <b>+${_mmss(T.sec)}</b>`;
  } else {
    el.style.borderColor = "var(--line2,#2a3550)"; el.style.background = "var(--card2,#171c28)"; el.style.color = "var(--txt,#e6ebf5)";
    txt.innerHTML = `⏱ recupero <b>${_mmss(T.sec)}</b>`;
  }
}
// il timer è ancorato a un ISTANTE DI FINE (wall-clock): resta corretto anche se il telefono mette Metis in
// pausa (cambio app, schermo spento) — al ritorno ricalcola dal tempo reale e non si resetta né sbaglia.
function _timerTick() {
  if (T.endAt == null) return;
  const remMs = T.endAt - Date.now();
  T.over = remMs <= 0;
  T.sec = T.over ? Math.floor((Date.now() - T.endAt) / 1000) : Math.ceil(remMs / 1000);
  if (T.over && !T.suonato) { T.suonato = true; _allarmeRecupero(); }   // scaduto → avviso (vibrazione + suono + notifica)
  _timerRender();
}
function avviaTimer(sec) {
  if (T.handle) clearInterval(T.handle);
  T.endAt = Date.now() + (sec || 0) * 1000; T.over = false; T.suonato = false;
  try { localStorage.setItem("metis_rec_end", String(T.endAt)); } catch (e) { }   // per riprenderlo dopo un reload
  _primeAudio();                 // "sblocca" l'audio sul gesto dell'utente, così il beep finale può suonare
  _chiediNotifSeServe();         // permesso notifiche (per l'avviso quando sei su un'altra app / schermo spento)
  _acquisisciWakeLock();         // tiene lo schermo acceso durante il recupero (niente standby)
  _timerTick();
  T.handle = setInterval(_timerTick, 250);   // 250ms = conteggio fluido e sempre allineato all'orario reale
}
function fermaTimer() {
  if (T.handle) clearInterval(T.handle);
  T.handle = null; T.sec = 0; T.endAt = null; T.over = false; T.suonato = false;
  try { localStorage.removeItem("metis_rec_end"); } catch (e) { }
  _rilasciaWakeLock();
  const el = document.getElementById("timer-flt"); if (el) el.remove();
}
// ----- avviso di fine recupero: vibrazione + suono + notifica di sistema (sveglia lo schermo anche in standby) -----
let _recAudioCtx = null;
function _primeAudio() {
  try {
    if (!_recAudioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) _recAudioCtx = new AC(); }
    if (_recAudioCtx && _recAudioCtx.state === "suspended") _recAudioCtx.resume();
  } catch (e) { }
}
function _beepRecupero() {
  try {
    _primeAudio(); if (!_recAudioCtx) return;
    const t0 = _recAudioCtx.currentTime;
    [0, 0.32, 0.64].forEach(off => {
      const o = _recAudioCtx.createOscillator(), g = _recAudioCtx.createGain();
      o.type = "sine"; o.frequency.value = 880; o.connect(g); g.connect(_recAudioCtx.destination);
      g.gain.setValueAtTime(0.0001, t0 + off);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.28);
      o.start(t0 + off); o.stop(t0 + off + 0.3);
    });
  } catch (e) { }
}
function _notificaFineRecupero() {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const opts = { body: "Recupero finito 💪 torna all'esercizio.", tag: "recupero-metis", renotify: true, vibrate: [500, 150, 500, 150, 500], icon: "icon-192.png", badge: "icon-192.png" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => { try { reg.showNotification("⏱ Recupero finito", opts); } catch (e) { try { new Notification("⏱ Recupero finito", opts); } catch (_) { } } }).catch(() => { try { new Notification("⏱ Recupero finito", opts); } catch (e) { } });
    } else { try { new Notification("⏱ Recupero finito", opts); } catch (e) { } }
  } catch (e) { }
}
function _allarmeRecupero() {
  try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([500, 150, 500, 150, 500]); } catch (e) { }
  _beepRecupero();
  _notificaFineRecupero();
  _rilasciaWakeLock();   // recupero finito: lascia che lo schermo possa spegnersi
}
function _chiediNotifSeServe() {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    let chiesto = false; try { chiesto = localStorage.getItem("metis_notif_rec") === "1"; } catch (e) { }
    if (chiesto) return;
    try { localStorage.setItem("metis_notif_rec", "1"); } catch (e) { }
    Notification.requestPermission().catch(() => { });
  } catch (e) { }
}
// ----- Wake Lock: schermo acceso durante il recupero (si rilascia da solo quando la pagina va in background) -----
let _recWakeLock = null;
async function _acquisisciWakeLock() {
  try { if ("wakeLock" in navigator && document.visibilityState === "visible") { _recWakeLock = await navigator.wakeLock.request("screen"); _recWakeLock.addEventListener && _recWakeLock.addEventListener("release", () => { _recWakeLock = null; }); } } catch (e) { }
}
function _rilasciaWakeLock() { try { if (_recWakeLock) { _recWakeLock.release(); _recWakeLock = null; } } catch (e) { } }
// al ritorno in primo piano aggiorna subito (lo sleep in background può aver "congelato" il conteggio) e riprende il wake lock
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && T.endAt != null) { _timerTick(); if (!T.over) _acquisisciWakeLock(); }
  });
}
// riprende il recupero dopo un reload della pagina (auto-aggiornamento o app ricaricata dal sistema)
function _ripristinaTimer() {
  try {
    const raw = localStorage.getItem("metis_rec_end"); if (!raw) return;
    const endAt = parseInt(raw); if (!endAt) return;
    if (Date.now() - endAt > 20 * 60 * 1000) { localStorage.removeItem("metis_rec_end"); return; }   // troppo vecchio: scarta
    if (T.handle) clearInterval(T.handle);
    T.endAt = endAt; T.suonato = (Date.now() >= endAt);   // se è già scaduto non risuonare
    _timerTick(); T.handle = setInterval(_timerTick, 250);
  } catch (e) { }
}

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
  if (campo === "fastidi") { s[campo] = val; salvaBozzaSeduta(s); return; }
  const n = Number(String(val).replace(",", "."));
  s[campo] = (val === "" || !Number.isFinite(n)) ? null : n;   // scarta NaN (es. testo) invece di salvarlo
  salvaBozzaSeduta(s);
}
async function chiudiSeduta(sid) {
  const s = sedutaDaId(sid);
  // l'atleta della seduta (per l'atleta = sé; per il coach che corregge = l'atleta di cui vede la seduta)
  const aid = s.atletaId || (S.utente && S.utente.atletaId) || (DEMO.atleti[0] && DEMO.atleti[0].id);
  if (typeof atletaBloccato === "function" && atletaBloccato(aid)) { alert("🔒 Scheda dimostrativa in sola lettura: l'allenamento non viene salvato."); return; }
  if (s.durata === null || s.rpe === null) { alert("Scrivi durata e RPE prima di chiudere."); return; }
  // palestra: registra la seduta (Serie/Rep/Peso/Volume/RPE/VBT) → Monitoraggio VBT + Andamento Palestra
  if (s.tipo === "palestra" && typeof registraVbt === "function") {
    (s.esercizi || []).forEach(x => {
      const fatte = x.vbt.filter(v => v !== null);
      const vbtMedia = fatte.length ? media(x.vbt) : null;
      const pw = (x.pesoFatto != null ? x.pesoFatto : x.peso);   // peso reale usato se segnato
      registraVbt(aid, x.nome, pw || null, vbtMedia, x.vbtTarget || null,
        { serie: x.serie != null ? x.serie : null, rep: x.rep != null ? x.rep : null, volume: (pw && x.serie && x.rep) ? x.serie * x.rep * pw : null, rpe: s.rpe });
    });
  }
  // lanci: registra mezzo / attrezzo / n. lanci / miglior misura → registro lanci
  if (s.lanci && typeof registraLancio === "function") {
    (s.elementi || []).forEach(e => {
      const fatte = (e.misure || []).filter(v => v !== null);
      registraLancio(aid, e.mezzo, e.kg, e.tipo, e.lanci, fatte.length ? Math.max(...fatte) : null);
    });
  }
  // pista: registra Tempo (media eseguita) / Volume (m) / Vel per distanza → Andamento Pista
  if (s.tipo === "pista" && typeof registraPista === "function") {
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
  if (typeof _rimuoviBozza === "function") _rimuoviBozza(s);   // chiusa: la bozza locale non serve più (ora è nel DB/coda)
  // TAPPA 4: la seduta svolta va al coach (DB) → screening/andamento/VBT/carico reali
  if (typeof salvaSedutaSvoltaDB === "function") { try { await salvaSedutaSvoltaDB(s); } catch (e) { /* offline: resta in coda */ } }
  fermaTimer(); S.seduta = null;
  if (typeof _applicaAggiornamentoSeInSospeso === "function") _applicaAggiornamentoSeInSospeso();   // aggiornamento rimandato: ora si può
  // l'atleta torna a "oggi"; il coach torna alla lista degli allenamenti svolti dell'atleta
  if (!(S.utente && S.utente.ruolo === "coach")) S.vista = "oggi";
  disegna();
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
    ${s.daMod ? `<div class="card" style="border-color:var(--blu);background:var(--blu-bg)"><p style="margin:0;font-weight:600;color:var(--blu)">✏️ Allenamento modificato dall'allenatore per questo giorno</p></div>` : ""}
    ${_notaExtraGiorno(s)}
    ${bloccoObiettivi(s)}
    <button class="btn-2" style="margin-bottom:11px" onclick="segnalaInfortunioSeduta()">🩹 Segnala infortunio / fastidio</button>
    ${_modBtnSeduta(s)}
    ${_extraBtnSeduta()}
    ${corpo}`;
}
// pulsante "modifica live" — SOLO l'allenatore, sull'allenamento di un atleta (non su seduta già chiusa)
function _modBtnSeduta(s) {
  if (!s || s.chiusa) return "";
  if (!(S.utente && S.utente.ruolo === "coach")) return "";
  if (typeof atletaBloccato === "function" && atletaBloccato(s.atletaId)) return "";
  if (typeof apriModSeduta !== "function") return "";
  return `<button class="btn btn-2" style="margin-bottom:11px" onclick="apriModSeduta('${s.id}')">✏️ Modifica questo allenamento (solo oggi)</button>`;
}
// pulsante "allenamento in più" nella seduta — per l'ATLETA: corsa (mezzofondo) o pista/palestra (velocisti/lanciatori)
function _extraBtnSeduta() {
  if (S.utente && S.utente.ruolo === "coach") return "";
  const a = (typeof atletaCorrente === "function") ? atletaCorrente() : null;
  if (!a || typeof gruppoDi !== "function") return "";
  const gen = (typeof apriExtraGen === "function") ? `<button class="btn btn-2" style="margin-bottom:11px" onclick="apriExtraGen()">➕ ${gruppoDi(a) === "mezzo" ? "Altro allenamento in più (palestra / bici)" : "Ho fatto un allenamento in più"}</button>` : "";
  if (gruppoDi(a) === "mezzo") return ((typeof apriExtra === "function") ? `<button class="btn btn-2" style="margin-bottom:11px" onclick="apriExtra()">➕ Ho corso in più (aggiungi km · corsa extra)</button>` : "") + gen;
  return gen;
}
// nota "corsa in più" nel giorno della seduta (la vede il coach aprendo la giornata e l'atleta): km · passo · RPE
function _extraDelGiorno(aid, dataISO) {
  return ((DEMO.seduteSvolte && DEMO.seduteSvolte[aid]) || []).filter(sv => sv.tipo === "extra" && sv.data === dataISO);
}
function _notaExtraGiorno(s) {
  if (!s || !s.atletaId) return "";
  const ex = _extraDelGiorno(s.atletaId, s.dataISO);
  if (!ex.length) return "";
  const righe = ex.map(sv => {
    const inf = (typeof _extraInfo === "function") ? _extraInfo(sv) : { icona: "➕", titolo: "Allenamento in più", riga: "" };
    return `${inf.icona} <b>${inf.titolo}</b>${inf.riga ? " · " + inf.riga : ""}${sv.rpe != null ? " · RPE " + sv.rpe : ""}`;
  }).join("<br>");
  return `<div class="card" style="border-color:rgba(124,194,67,.5);background:var(--verde-bg)">
    <p style="margin:0;font-weight:600;color:var(--verde)">➕ Allenamento in più in questo giorno</p>
    <p class="et" style="margin:4px 0 0">${righe}</p></div>`;
}
function segnalaInfortunioSeduta() {
  const aid = (S.utente && S.utente.atletaId) || (DEMO.atleti[0] && DEMO.atleti[0].id) || "";
  if (typeof apriInfortunio === "function") apriInfortunio(aid, "seduta");
}
function tornaIndietro() { T.id = null; S.seduta = null; if (typeof _applicaAggiornamentoSeInSospeso === "function") _applicaAggiornamentoSeInSospeso(); disegna(); }   // esce dalla seduta ma il recupero continua (galleggiante) finché non scade/stop

// ============================================================================
// MODIFICA LIVE (solo allenatore) — cambia l'allenamento di un atleta SOLO per quel giorno.
// Si può cambiare il lavoro o passare pista↔palestra. Stato in S.modEdit; salvato in DEMO.modGiorno.
// ============================================================================
// apre l'editor partendo da una seduta già aperta (dal calendario squadra / scheda atleta)
function apriModSeduta(sedutaId) {
  const s = (typeof sedutaDaId === "function") ? sedutaDaId(sedutaId) : null;
  if (!s) return;
  const a = (DEMO.atleti || []).find(x => x.id === s.atletaId); if (!a) return;
  const origTipo = s.tipo === "palestra" ? "palestra" : "pista";
  const base = (typeof righeGiornoAtleta === "function") ? righeGiornoAtleta(a, s.dataISO, origTipo) : [];
  const ex = (typeof _modGiornoDi === "function") ? _modGiornoDi(a.id, s.dataISO) : null;
  S.modEdit = {
    atletaId: a.id, nome: a.nome, dataISO: s.dataISO, giorno: s.giorno || 1,
    tipo: ex ? ex.tipo : origTipo, origTipo, baseRighe: base,
    righe: ex ? JSON.parse(JSON.stringify(ex.righe || [])) : JSON.parse(JSON.stringify(base)),
    byTipo: {}, fromSeduta: sedutaId
  };
  S.seduta = null; disegna(); window.scrollTo(0, 0);
}
// apre l'editor da una DATA (usato da "Adatta contenuto")
function apriModData(atletaId, dataISO, tipo) {
  const a = (DEMO.atleti || []).find(x => x.id === atletaId); if (!a || !dataISO) return;
  const ex = (typeof _modGiornoDi === "function") ? _modGiornoDi(atletaId, dataISO) : null;
  const origTipo = tipo === "palestra" ? "palestra" : "pista";
  const base = (typeof righeGiornoAtleta === "function") ? righeGiornoAtleta(a, dataISO, origTipo) : [];
  const gio = (typeof giornoDataAtleta === "function") ? giornoDataAtleta(a, dataISO, origTipo) : 1;
  S.modEdit = {
    atletaId: a.id, nome: a.nome, dataISO, giorno: (ex && ex.giorno) || gio,
    tipo: ex ? ex.tipo : origTipo, origTipo, baseRighe: base,
    righe: ex ? JSON.parse(JSON.stringify(ex.righe || [])) : JSON.parse(JSON.stringify(base)),
    byTipo: {}, fromAdatta: true
  };
  S.adatta = null; disegna(); window.scrollTo(0, 0);
}
function annullaMod() { const m = S.modEdit; S.modEdit = null; if (m && m.fromSeduta) S.seduta = m.fromSeduta; disegna(); window.scrollTo(0, 0); }
// cambio Pista/Palestra: memorizza le righe del tipo corrente; per il tipo originale riparte dalla base, per l'altro da vuoto
function setModTipo(t) {
  const m = S.modEdit; if (!m || m.tipo === t) return;
  m.byTipo = m.byTipo || {};
  m.byTipo[m.tipo] = m.righe;
  if (m.byTipo[t] == null) m.byTipo[t] = (t === m.origTipo) ? JSON.parse(JSON.stringify(m.baseRighe || [])) : [];
  m.tipo = t; m.righe = m.byTipo[t];
  disegna(); window.scrollTo(0, 0);
}
function setModRigaVal(campo, i, val) { const r = (S.modEdit && S.modEdit.righe) || []; if (r[i]) r[i][campo] = val; }
function setModRiga(campo, i, val) { setModRigaVal(campo, i, val); disegna(); }
function setModEsercizio(i, val) {
  if (val === "__altro__") { const t = (typeof prompt === "function") ? prompt("Nome dell'esercizio (scrivilo a mano):", "") : ""; if (t && t.trim()) setModRiga("esercizio", i, t.trim()); else disegna(); return; }
  setModRiga("esercizio", i, val);
}
function addModRiga() {
  const m = S.modEdit; if (!m) return; m.righe = m.righe || [];
  const a = (DEMO.atleti || []).find(x => x.id === m.atletaId);
  const gr = (a && typeof gruppoDi === "function") ? gruppoDi(a) : "vel";
  if (m.tipo !== "pista") m.righe.push({ esercizio: "", serie: "", rep: "", perc: "", rec: "", tut: "", vbt: "", peso: "" });
  else if (gr === "mezzo") m.righe.push({ contenuto: "", mezzo: "", distanza: "", n: "", min: "", rec: "" });
  else if (gr === "lanci") m.righe.push({ contenuto: "", mezzo: "", kg: "", tipo: "", n: "", rec: "" });
  else m.righe.push({ contenuto: "", distanza: "", n: "", rec: "", perc: "" });
  disegna();
}
function delModRiga(i) { const m = S.modEdit; if (m && m.righe) { m.righe.splice(i, 1); disegna(); } }
function salvaMod() {
  const m = S.modEdit; if (!m) return;
  const righe = (m.righe || []).filter(r => r && (r.esercizio || r.distanza || r.min || r.mezzo || r.contenuto || r.n));
  if (!righe.length) { alert("Aggiungi almeno una riga (o annulla)."); return; }
  DEMO.modGiorno = DEMO.modGiorno || {};
  const per = DEMO.modGiorno[m.atletaId] = DEMO.modGiorno[m.atletaId] || {};
  per[m.dataISO] = { tipo: m.tipo, giorno: m.giorno || 1, righe: JSON.parse(JSON.stringify(righe)), stato: "ok", richiedente: "coach", quando: (typeof oggiISO === "function" ? oggiISO() : ""), orig: m.origTipo };
  if (typeof _invalidaSeduteGen === "function") _invalidaSeduteGen();
  if (typeof salvaCustom === "function") salvaCustom();
  S.modEdit = null;
  alert("✓ Allenamento modificato per " + (m.nome || "l'atleta") + " · " + (typeof dataLunga === "function" ? dataLunga(m.dataISO) : m.dataISO) + " (solo questo giorno).");
  disegna(); window.scrollTo(0, 0);
}
// rimuove la modifica del giorno → torna all'allenamento originale del programma
function annullaModGiorno() {
  const m = S.modEdit; if (!m) return;
  const per = DEMO.modGiorno && DEMO.modGiorno[m.atletaId];
  if (per && per[m.dataISO]) { delete per[m.dataISO]; if (typeof _invalidaSeduteGen === "function") _invalidaSeduteGen(); if (typeof salvaCustom === "function") salvaCustom(); }
  S.modEdit = null; alert("↺ Ripristinato l'allenamento originale del programma.");
  disegna(); window.scrollTo(0, 0);
}
function vistaModSeduta() {
  const m = S.modEdit; if (!m) return "";
  const a = (DEMO.atleti || []).find(x => x.id === m.atletaId);
  const gr = (a && typeof gruppoDi === "function") ? gruppoDi(a) : "vel";
  const tab = `<div class="tabbar">
    <button class="${m.tipo === "pista" ? "on" : ""}" onclick="setModTipo('pista')">Pista</button>
    <button class="${m.tipo === "palestra" ? "on" : ""}" onclick="setModTipo('palestra')">Palestra</button></div>`;
  const tabella = m.tipo === "palestra" ? _modTabPal(a, m.righe)
    : gr === "mezzo" ? _modTabMezzo(a, m.righe)
      : gr === "lanci" ? _modTabLanci(a, m.righe)
        : _modTabVel(a, m.righe);
  const esisteMod = !!(DEMO.modGiorno && DEMO.modGiorno[m.atletaId] && DEMO.modGiorno[m.atletaId][m.dataISO]);
  return `<button class="indietro" onclick="annullaMod()">‹ Annulla</button>
    <div class="card" style="background:var(--blu);color:#fff;border:0">
      <p class="et" style="color:#fff;opacity:.85">${typeof dataLunga === "function" ? dataLunga(m.dataISO) : m.dataISO}</p>
      <h3 style="color:#fff">✏️ Modifica allenamento · ${m.nome || ""}</h3>
      <p style="font-size:13px;margin-top:6px;opacity:.9">Vale <b>solo per questo giorno</b>. Scegli Pista o Palestra, poi imposta il lavoro.</p></div>
    ${tab}
    ${m.tipo !== m.origTipo ? `<div class="card" style="border-color:var(--blu)"><p class="et" style="margin:0;color:var(--blu)">Hai cambiato tipo (era <b>${m.origTipo}</b>): componi il nuovo allenamento da zero.</p></div>` : ""}
    ${tabella}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <button class="btn" style="flex:1;min-width:150px" onclick="salvaMod()">💾 Salva (solo oggi)</button>
      ${esisteMod ? `<button class="btn btn-2" style="width:auto;padding:11px 14px" onclick="annullaModGiorno()">↺ Ripristina originale</button>` : ""}
    </div>`;
}
// tabelle editor (scrivono su S.modEdit.righe) — stesse colonne di "Adatta contenuto"
function _modTabVel(a, righe) {
  const prof = (typeof pistaDi === "function" && typeof gruppoDi === "function") ? pistaDi(gruppoDi(a)).profilo : (DEMO.pista && DEMO.pista.profilo);
  const rows = (righe || []).map((r, i) => {
    const t = (typeof pistaTempoAtleta === "function") ? pistaTempoAtleta(a, r.distanza, r.perc) : null;
    return `<tr>
      <td><input value="${(r.contenuto || "").replace(/"/g, "&quot;")}" placeholder="lavoro" oninput="setModRigaVal('contenuto',${i},this.value)" style="min-width:110px"></td>
      <td><input inputmode="numeric" value="${r.distanza || ""}" placeholder="m" oninput="setModRigaVal('distanza',${i},this.value)" onchange="disegna()" style="min-width:58px"></td>
      <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setModRigaVal('n',${i},this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setModRigaVal('perc',${i},this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setModRigaVal('rec',${i},this.value)" style="min-width:60px"></td>
      <td class="pauto">${t != null ? t.toFixed(2) : "—"}</td>
      <td><button class="chiudi" style="font-size:14px" onclick="delModRiga(${i})" aria-label="Rimuovi">✕</button></td></tr>`;
  }).join("");
  return `<div class="card"><div class="p-scroll"><table class="ptab pista-w">
    <thead><tr><th>Contenuto</th><th>Dist.</th><th>n°</th><th>% vel</th><th>Rec</th><th>Tempo</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7"><span class="et">Nessuna riga — aggiungine una.</span></td></tr>`}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:8px" onclick="addModRiga()">＋ riga</button></div>`;
}
function _modTabMezzo(a, righe) {
  const MZ = (typeof MZ_MEZZI !== "undefined") ? MZ_MEZZI : [];
  const optMezzo = val => `<option value="">—</option>` + MZ.map(x => `<option value="${String(x).replace(/"/g, "&quot;")}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`).join("");
  const rows = (righe || []).map((r, i) => `<tr>
      <td><input value="${(r.contenuto || "").replace(/"/g, "&quot;")}" placeholder="focus" oninput="setModRigaVal('contenuto',${i},this.value)" style="min-width:100px"></td>
      <td><select onchange="setModRiga('mezzo',${i},this.value)">${optMezzo(r.mezzo)}</select></td>
      <td><input inputmode="numeric" value="${r.distanza || ""}" placeholder="m" oninput="setModRigaVal('distanza',${i},this.value)" onchange="disegna()" style="min-width:56px"></td>
      <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setModRigaVal('n',${i},this.value)" onchange="disegna()" style="min-width:44px"></td>
      <td><input inputmode="numeric" value="${r.min || ""}" placeholder="min" oninput="setModRigaVal('min',${i},this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setModRigaVal('rec',${i},this.value)" style="min-width:56px"></td>
      <td><button class="chiudi" style="font-size:14px" onclick="delModRiga(${i})" aria-label="Rimuovi">✕</button></td></tr>`).join("");
  return `<div class="card"><div class="p-scroll"><table class="ptab pista-w">
    <thead><tr><th>Focus</th><th>Mezzo</th><th>Dist (m)</th><th>n°</th><th>Min</th><th>Rec</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7"><span class="et">Nessuna riga — aggiungine una.</span></td></tr>`}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:8px" onclick="addModRiga()">＋ riga</button></div>`;
}
function _modTabPal(a, righe) {
  const dISO = (S.modEdit && S.modEdit.dataISO) || (typeof oggiISO === "function" ? oggiISO() : "");
  const rows = (righe || []).map((r, i) => {
    const target = (typeof palPesoAtleta === "function") ? palPesoAtleta(a, r) : null;
    const peso = target != null ? target : (typeof pesoRifAtleta === "function" ? pesoRifAtleta(a, r, dISO) : null);
    const pesoCell = target != null ? target + " kg" : (peso != null ? `<span title="peso usato nel blocco precedente" style="color:var(--txt3)">~${peso} kg</span>` : "—");
    return `<tr>
      <td><select onchange="setModEsercizio(${i},this.value)" style="min-width:150px">${typeof optEsercizioPal === "function" ? optEsercizioPal(r.esercizio) : `<option>${r.esercizio || ""}</option>`}</select></td>
      <td><input inputmode="numeric" value="${r.serie || ""}" placeholder="s" oninput="setModRigaVal('serie',${i},this.value)" onchange="disegna()" style="min-width:42px"></td>
      <td><input inputmode="numeric" value="${r.rep || ""}" placeholder="r" oninput="setModRigaVal('rep',${i},this.value)" onchange="disegna()" style="min-width:42px"></td>
      <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setModRigaVal('perc',${i},this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setModRigaVal('rec',${i},this.value)" style="min-width:56px"></td>
      <td class="pauto">${pesoCell}</td>
      <td><button class="chiudi" style="font-size:14px" onclick="delModRiga(${i})" aria-label="Rimuovi">✕</button></td></tr>`;
  }).join("");
  return `<div class="card"><div class="p-scroll"><table class="ptab pista-w">
    <thead><tr><th>Esercizio</th><th>Serie</th><th>Rep</th><th>%1RM</th><th>Rec</th><th>Peso</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7"><span class="et">Nessuna riga — aggiungine una.</span></td></tr>`}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:8px" onclick="addModRiga()">＋ esercizio</button></div>`;
}
function _modTabLanci(a, righe) {
  const rows = (righe || []).map((r, i) => `<tr>
      <td><input value="${(r.contenuto || "").replace(/"/g, "&quot;")}" placeholder="focus" oninput="setModRigaVal('contenuto',${i},this.value)" style="min-width:90px"></td>
      <td><input value="${(r.mezzo || "").replace(/"/g, "&quot;")}" placeholder="attrezzo" oninput="setModRigaVal('mezzo',${i},this.value)" style="min-width:90px"></td>
      <td><input inputmode="decimal" value="${r.kg || ""}" placeholder="kg" oninput="setModRigaVal('kg',${i},this.value)" style="min-width:54px"></td>
      <td><input value="${(r.tipo || "").replace(/"/g, "&quot;")}" placeholder="tipo" oninput="setModRigaVal('tipo',${i},this.value)" style="min-width:80px"></td>
      <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setModRigaVal('n',${i},this.value)" onchange="disegna()" style="min-width:44px"></td>
      <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setModRigaVal('rec',${i},this.value)" style="min-width:54px"></td>
      <td><button class="chiudi" style="font-size:14px" onclick="delModRiga(${i})" aria-label="Rimuovi">✕</button></td></tr>`).join("");
  return `<div class="card"><div class="p-scroll"><table class="ptab pista-w">
    <thead><tr><th>Focus</th><th>Attrezzo</th><th>Kg</th><th>Tipo</th><th>n°</th><th>Rec</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7"><span class="et">Nessuna riga — aggiungine una.</span></td></tr>`}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:8px" onclick="addModRiga()">＋ lancio</button></div>`;
}
