// Diario giornaliero dell'atleta.
// Nota: la prontezza si calcola sempre, ma all'atleta NON si mostra
// (se la vedesse potrebbe aggiustare le risposte). La vede l'allenatore.

function prontezza(d) {
  const v = CONFIG.diario.voci.map(x => d[x.id]).filter(x => x !== null);
  if (v.length < CONFIG.diario.voci.length) return null;
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function statoProntezza(p) {
  if (p === null) return ["", "non compilata"];
  if (p < CONFIG.soglie.prontezzaBassa) return ["r", "Prontezza bassa"];
  if (p < 3.5) return ["w", "Sotto tono"];
  return ["v", "Via libera"];
}

function diarioCompleto(d) { return prontezza(d) !== null; }

// storia diario dell'atleta loggato (recente → vecchio)
function _diarioStoriaMia() {
  const a = (typeof atletaCorrente === "function") ? atletaCorrente() : null;
  const aid = a ? a.id : (S.utente && S.utente.atletaId);
  return aid ? ((DEMO.diariStorico || {})[aid] || []).slice().sort((x, y) => x.data < y.data ? 1 : -1) : [];
}
// riepilogo sonno: media (ultimi giorni) + ultima notte + mini-trend. Condiviso atleta/allenatore.
function _sonnoRiepilogo(storia) {
  const conSonno = (storia || []).filter(v => v.oreSonno != null && v.oreSonno !== "" && !isNaN(Number(v.oreSonno)));
  if (!conSonno.length) return "";
  const rec = conSonno.slice(0, 14);
  const media = rec.reduce((s, v) => s + Number(v.oreSonno), 0) / rec.length;
  const ultima = Number(conSonno[0].oreSonno);
  const diff = ultima - media;
  const nota = Math.abs(diff) < 0.5 ? "in linea con la tua media" : (diff < 0 ? `${Math.abs(diff).toFixed(1)} h in meno del solito` : `${diff.toFixed(1)} h in più del solito`);
  const notaCol = diff <= -1 ? "var(--rosso)" : diff >= 0.5 ? "var(--verde)" : "var(--txt2)";
  const barre = conSonno.slice(0, 10).reverse().map(v => { const h = Number(v.oreSonno); const ph = Math.max(6, Math.round((h / 10) * 46)); const c = h >= media - 0.5 ? "var(--verde)" : "var(--giallo)"; return `<div title="${h} h" style="width:13px;height:${ph}px;background:${c};border-radius:3px"></div>`; }).join("");
  return `<div class="card">
    <p class="et" style="margin-bottom:8px">😴 Sonno — nel tempo</p>
    <div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap">
      <div><div style="font-size:30px;font-weight:800;line-height:1">${media.toFixed(1)}<span style="font-size:14px;color:var(--txt3);font-weight:600"> h</span></div>
        <div class="et" style="margin:2px 0 0">media ultimi ${rec.length} giorni</div></div>
      <div style="border-left:1px solid var(--line);padding-left:16px">
        <div style="font-size:21px;font-weight:700;line-height:1">${ultima.toFixed(1)}<span style="font-size:12px;color:var(--txt3)"> h</span></div>
        <div class="et" style="margin:2px 0 0">ultima notte</div></div>
      <div style="display:flex;align-items:flex-end;gap:3px;height:48px;margin-left:auto">${barre}</div>
    </div>
    <p class="et" style="margin-top:9px;color:${notaCol}">Ultima notte: <b>${nota}</b>. ${media < 7 ? "Media sotto le 7 h: prova a dormire di più." : "Buona media di sonno 👍"}</p>
  </div>`;
}
// storia diario per l'ATLETA (senza prontezza, che non deve vedere); evidenzia il ciclo
function _diarioStoriaAtleta(storia) {
  if (!storia || !storia.length) return "";
  const dl = v => (typeof fmtDataAnno === "function") ? fmtDataAnno(v) : v;
  const rows = storia.slice(0, 21).map(v => `<div style="padding:8px 0;border-bottom:1px solid var(--line)${v.ciclo ? ";background:rgba(214,74,120,.08);border-radius:8px;padding:8px 9px;border-bottom:0;margin-bottom:2px" : ""}">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <b style="font-size:13px">${dl(v.data)}${v.ciclo ? ' <span style="color:#c74a78">🩸</span>' : ""}</b>
        <span class="et" style="margin:0">${v.oreSonno != null ? v.oreSonno + " h sonno" : ""}</span></div>
      <div class="et" style="margin-top:3px">qualità ${v.sonno_qualita ?? "—"} · stress ${v.stress ?? "—"} · dolori ${v.dolori ?? "—"} · energia ${v.energia ?? "—"}${v.fastidi ? ' · <span style="color:var(--rosso)">fastidio</span>' : ""}</div>
    </div>`).join("");
  return `<div class="card"><p class="et" style="margin-bottom:6px">📅 Come stavo — i miei giorni</p>${rows}
    ${storia.length > 21 ? `<p class="et" style="margin-top:8px;color:var(--txt3)">mostrati gli ultimi 21 giorni</p>` : ""}</div>`;
}

function vistaDiario() {
  const d = DEMO.diarioOggi;

  const scale = CONFIG.diario.voci.map(v => `
    <div style="margin-bottom:15px">
      <div class="lab">${v.label}</div>
      <div class="scala">
        ${[1, 2, 3, 4, 5].map(i => `<button class="sc ${d[v.id] === i ? "on" : ""}"
            onclick="segnaDiario('${v.id}',${i})">${i}</button>`).join("")}
      </div>
      <div class="estremi"><span>1 · ${v.basso}</span><span>5 · ${v.alto}</span></div>
    </div>`).join("");

  return `
  <div class="card">
    <p class="et">Ore di sonno</p>
    <div class="ore">
      <button class="tondo" onclick="cambiaOre(-0.5)" aria-label="Meno">−</button>
      <div class="ore-v">${d.oreSonno.toFixed(1)} <span>h</span></div>
      <button class="tondo" onclick="cambiaOre(0.5)" aria-label="Più">+</button>
    </div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:13px">Come stai oggi — rispondi di pancia, senza pensarci troppo</p>
    ${scale}
  </div>

  <div class="card">
    <div class="griglia2">
      <div><div class="lab">Peso (kg)</div>
        <input inputmode="decimal" value="${d.peso ?? ""}" placeholder="es. 72.4"
          onchange="segnaDiario('peso',this.value)"></div>
      <div><div class="lab">Ciclo mestruale</div>
        <button class="btn ${d.ciclo ? "" : "btn-2"}" style="padding:11px"
          onclick="segnaDiario('ciclo',${!d.ciclo})">${d.ciclo ? "Segnato ✓" : "Segna"}</button></div>
    </div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:9px">Hai fastidi o dolori?</p>
    <div style="display:flex;gap:8px">
      <button class="btn ${d.fastidi ? "btn-2" : ""}" onclick="segnaDiario('fastidi',false)">No</button>
      <button class="btn ${d.fastidi ? "" : "btn-2"}" onclick="segnaDiario('fastidi',true)">Sì</button>
    </div>
    ${d.fastidi ? `<div style="margin-top:11px"><div class="lab">Dove</div>
      <input value="${d.doveFastidi}" placeholder="es. ischiocrurale destro"
        onchange="segnaDiario('doveFastidi',this.value)"></div>` : ""}
  </div>

  <div class="card">
    <div class="lab">Note per l'allenatore</div>
    <textarea rows="2" placeholder="gambe pesanti, poco riposo…"
      onchange="segnaDiario('note',this.value)">${d.note}</textarea>
  </div>

  ${d.salvato ? `<div class="card fatto">
      <p style="font-size:15px">Diario salvato ✓</p>
      <p class="et" style="margin-top:4px">Grazie — l'allenatore lo vede subito.</p>
    </div>`
    : `<button class="btn" style="margin-bottom:14px" onclick="salvaDiario()">Salva il diario</button>`}

  ${(() => { const st = _diarioStoriaMia(); return _sonnoRiepilogo(st) + _diarioStoriaAtleta(st); })()}`;
}

function segnaDiario(campo, val) {
  const d = DEMO.diarioOggi;
  if (campo === "peso") { const n = parseFloat(String(val).replace(",", ".")); d.peso = isNaN(n) ? null : n; }
  else d[campo] = val;
  d.salvato = false;
  disegna();
}
function cambiaOre(x) {
  const d = DEMO.diarioOggi;
  d.oreSonno = Math.min(12, Math.max(3, d.oreSonno + x));
  d.salvato = false; disegna();
}
async function salvaDiario() {
  if (typeof atletaBloccato === "function" && S.utente && atletaBloccato(S.utente.atletaId)) { alert("🔒 Scheda dimostrativa in sola lettura: il diario non si può compilare qui."); return; }
  const d = DEMO.diarioOggi;
  if (!diarioCompleto(d)) { alert("Rispondi a tutte e quattro le domande prima di salvare."); return; }
  d.salvato = true;
  const oggi = (typeof oggiISO === "function") ? oggiISO() : new Date().toISOString().slice(0, 10);
  registraDiarioStorico(oggi, d);
  if (typeof salvaDiarioDB === "function") { try { await salvaDiarioDB(oggi, d); } catch (e) { /* offline: resta in locale */ } }
  disegna();
}
// aggiorna lo storico locale (che il coach vede giorno per giorno) + il riepilogo
function registraDiarioStorico(dataISO, d) {
  const a = (typeof atletaCorrente === "function") ? atletaCorrente() : null;
  const aid = a ? a.id : (S.utente && S.utente.atletaId);
  if (!aid) return;
  const p = prontezza(d);
  const voce = {
    data: dataISO, sonno_qualita: d.sonno_qualita, stress: d.stress, dolori: d.dolori, energia: d.energia,
    oreSonno: d.oreSonno, peso: d.peso, ciclo: !!d.ciclo, fastidi: !!d.fastidi, doveFastidi: d.doveFastidi || "",
    note: d.note || "", prontezza: p == null ? null : Math.round(p * 100) / 100
  };
  DEMO.diariStorico = DEMO.diariStorico || {};
  const arr = DEMO.diariStorico[aid] || [];
  const i = arr.findIndex(x => x.data === dataISO);
  if (i >= 0) arr[i] = voce; else arr.push(voce);
  arr.sort((x, y) => x.data < y.data ? 1 : -1);
  DEMO.diariStorico[aid] = arr;
  DEMO.diariCoach = DEMO.diariCoach || {};
  DEMO.diariCoach[aid] = { compilato: true, ultimo: (typeof fmtDataAnno === "function" ? fmtDataAnno(dataISO) : dataISO), prontezza: voce.prontezza != null ? String(voce.prontezza) : "—", sonno: d.oreSonno, nota: d.note || "" };
}
