// Viste dell'allenatore: squadra, dettaglio atleta, calendario squadra, report.

const STATO = {
  v: ["p-verde", "in regola", "var(--verde)"],
  w: ["p-giallo", "attenzione", "var(--giallo)"],
  r: ["p-rosso", "rischio alto", "var(--rosso)"]
};
const TIPO_CELLA = { pista: "pista", palestra: "palestra", gara: "gara", salto: "salto" };

function triage(lista) {
  const c = { v: 0, w: 0, r: 0 };
  (lista || DEMO.atleti).forEach(a => { const s = DEMO.mon[a.id]; if (s) c[s.stato]++; });
  return c;
}

// atleti ordinati per urgenza (rosso, giallo, verde)
function ordinaAtleti() {
  const ord = { r: 0, w: 1, v: 2 };
  return [...DEMO.atleti].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);
}
function colAcwr(v) { const n = parseFloat(v); return n >= 1.5 ? "var(--rosso)" : n >= 1.3 ? "var(--giallo)" : "var(--verde)"; }
function colProntezza(v) { const n = parseFloat(v); return n >= 3.5 ? "var(--verde)" : n >= 2.5 ? "var(--giallo)" : "var(--rosso)"; }
function nomeAtleta(id) { return (DEMO.atleti.find(a => a.id === id) || {}).nome || id; }

// gruppi per disciplina: si toccano per vedere solo gli atleti di quel gruppo
const GRUPPI = [
  ["vel", "Velocisti / Saltatori", ["velocita", "velocità", "salti", "palestra"]],
  ["lanci", "Lanciatori", ["lanci"]],
  ["mezzo", "Mezzofondo / Fondo", ["mezzofondo", "fondo", "mezzofondo/fondo"]]
];
function gruppoDi(a) {
  const d = (a.disciplina || "").toLowerCase();
  const g = GRUPPI.find(x => x[2].includes(d));
  return g ? g[0] : "vel"; // default: velocisti/saltatori (il sistema principale)
}
function nomeGruppo(k) { const g = GRUPPI.find(x => x[0] === k); return g ? g[1] : "Tutti"; }
function atletiDelGruppo(gk) { return DEMO.atleti.filter(a => gruppoDi(a) === gk); }
function setGruppo(gk) { S.gruppo = gk; disegna(); window.scrollTo(0, 0); }
function chipsGruppi() {
  return `<div class="tabbar" style="margin-bottom:11px">${GRUPPI.map(([k, l]) => {
    const n = atletiDelGruppo(k).length;
    return `<button class="${S.gruppo === k ? "on" : ""}" onclick="setGruppo('${k}')">${l}${n ? " · " + n : ""}</button>`;
  }).join("")}</div>`;
}

// ---------- squadra (ingresso coach) ----------
function vistaSquadra() {
  const lista = atletiDelGruppo(S.gruppo);
  const t = triage(lista);
  return `
  ${chipsGruppi()}
  <div class="quadri" style="margin-bottom:11px">
    <div class="q" onclick="vai('report')"><div class="k">Da vedere subito</div>
      <div class="v" style="color:var(--rosso)">${t.r}</div></div>
    <div class="q" onclick="vai('report')"><div class="k">Tieni d'occhio</div>
      <div class="v" style="color:var(--giallo)">${t.w}</div></div>
    <div class="q" onclick="vai('report')"><div class="k">In regola</div>
      <div class="v" style="color:var(--verde)">${t.v}</div></div>
  </div>
  ${listaAtleti(lista)}`;
}

function vistaAtleti() {
  if (S.nuovoAtleta) return vistaNuovoAtleta();
  const lista = atletiDelGruppo(S.gruppo);
  return `<div class="card"><h3>Atleti</h3>
    <p class="et" style="margin-top:2px">${nomeGruppo(S.gruppo)} · ${lista.length} di ${DEMO.atleti.length} · tocca per il cruscotto</p></div>
    ${chipsGruppi()}
    <button class="btn" style="margin-bottom:12px" onclick="apriNuovoAtleta()">＋ Nuovo atleta</button>
    ${listaAtleti(lista)}`;
}

// ---------- nuovo atleta (salva nel database) ----------
function apriNuovoAtleta() { S.nuovoAtleta = { disciplina: "velocita" }; disegna(); window.scrollTo(0, 0); }
function chiudiNuovoAtleta() { S.nuovoAtleta = null; disegna(); window.scrollTo(0, 0); }

const CATEGORIE = ["Cadetti/e", "Allievi/e", "Juniores", "Promesse", "Senior", "SM/SF 35", "SM/SF 40", "SM/SF 45", "SM/SF 50"];
// menu a tendina categoria; mantiene un valore fuori lista se già presente
function selCategoria(cur, onchangeExpr) {
  const extra = cur && !CATEGORIE.includes(cur) ? [cur] : [];
  return `<select onchange="${onchangeExpr}" style="margin-top:6px"><option value="">— scegli —</option>${[...CATEGORIE, ...extra].map(c => `<option ${cur === c ? "selected" : ""}>${c}</option>`).join("")}</select>`;
}
const SPEC_DISC = {
  velocita: ["60 m", "100 m", "200 m", "400 m", "60 hs", "100 hs", "110 hs", "400 hs", "Salto in lungo", "Salto in alto", "Salto triplo", "Salto con l'asta"],
  lanci: ["Peso", "Martello", "Disco", "Giavellotto"],
  mezzofondo: ["500 m", "600 m", "800 m", "1000 m", "1200 m", "1500 m", "2000 m", "2000 siepi", "3000 m", "3000 siepi", "5000 m", "10000 m", "Mezza maratona", "Maratona", "5 km strada/campestre", "10 km strada/campestre"],
  palestra: []
};
function vistaNuovoAtleta() {
  const a = S.nuovoAtleta;
  const disc = [["velocita", "Velocità / Salti"], ["lanci", "Lanci"], ["mezzofondo", "Mezzofondo / Fondo"], ["palestra", "Solo palestra"]];
  const spec = SPEC_DISC[a.disciplina] || [];
  return `<button class="indietro" onclick="chiudiNuovoAtleta()">‹ Indietro</button>
    <div class="card"><h3>Nuovo atleta</h3>
      <p class="et" style="margin-top:2px">Si salva nel database e compare nella squadra.</p></div>
    <div class="card">
      <label class="lab">Nome e cognome</label>
      <input value="${(a.nome || "").replace(/"/g, "&quot;")}" placeholder="Es. Giulia Rossi"
        oninput="S.nuovoAtleta.nome=this.value" style="margin-top:6px">

      <label class="lab" style="display:block;margin-top:12px">Disciplina (gruppo)</label>
      <select onchange="S.nuovoAtleta.disciplina=this.value; S.nuovoAtleta.specialita=''; disegna()" style="margin-top:6px">
        ${disc.map(([k, l]) => `<option value="${k}" ${a.disciplina === k ? "selected" : ""}>${l}</option>`).join("")}
      </select>

      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Specialità</label>
          ${spec.length
            ? `<select onchange="S.nuovoAtleta.specialita=this.value" style="margin-top:6px"><option value="">— scegli —</option>${spec.map(x => `<option ${a.specialita === x ? "selected" : ""}>${x}</option>`).join("")}</select>`
            : `<input value="${(a.specialita || "").replace(/"/g, "&quot;")}" placeholder="—" oninput="S.nuovoAtleta.specialita=this.value" style="margin-top:6px">`}</div>
        <div><label class="lab">Categoria</label>
          ${selCategoria(a.categoria, "S.nuovoAtleta.categoria=this.value")}</div>
      </div>

      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Data di nascita</label>
          <input type="date" value="${a.data_nascita || ""}"
            oninput="S.nuovoAtleta.data_nascita=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Gamba di stacco</label>
          <select onchange="S.nuovoAtleta.gamba_stacco=this.value" style="margin-top:6px">
            <option value="">—</option>
            <option value="Destra" ${a.gamba_stacco === "Destra" ? "selected" : ""}>Destra</option>
            <option value="Sinistra" ${a.gamba_stacco === "Sinistra" ? "selected" : ""}>Sinistra</option>
          </select></div>
      </div>

      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Altezza (cm)</label>
          <input inputmode="numeric" value="${a.altezza_cm || ""}" placeholder="178"
            oninput="S.nuovoAtleta.altezza_cm=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Peso (kg)</label>
          <input inputmode="numeric" value="${a.peso_kg || ""}" placeholder="70"
            oninput="S.nuovoAtleta.peso_kg=this.value" style="margin-top:6px"></div>
      </div>

      <label class="lab" style="display:block;margin-top:12px">Email per l'accesso <span style="color:var(--txt3)">(l'atleta si registrerà con questa)</span></label>
      <input type="email" value="${(a.email || "").replace(/"/g, "&quot;")}" placeholder="atleta@esempio.it"
        oninput="S.nuovoAtleta.email=this.value" style="margin-top:6px">
    </div>
    <button class="btn" onclick="salvaNuovoAtleta()">Salva atleta</button>`;
}

async function salvaNuovoAtleta() {
  const a = S.nuovoAtleta;
  if (!(a.nome || "").trim()) { alert("Scrivi almeno il nome dell'atleta."); return; }
  const btn = document.querySelector(".main .btn"); if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }
  const ok = await creaAtleta({
    nome: a.nome.trim(), disciplina: a.disciplina || "velocita", specialita: (a.specialita || "").trim(),
    email: (a.email || "").trim(),
    categoria: (a.categoria || "").trim(), data_nascita: a.data_nascita || null, gamba_stacco: a.gamba_stacco || "",
    altezza_cm: a.altezza_cm ? Number(a.altezza_cm) : null, peso_kg: a.peso_kg ? Number(a.peso_kg) : null
  });
  if (ok) { S.nuovoAtleta = null; S.vista = "atleti"; disegna(); window.scrollTo(0, 0); }
  else if (btn) { btn.textContent = "Salva atleta"; btn.disabled = false; }
}

// PB dell'atleta sulla SUA specialità (per velocità/lanci)
function _pbSpecDisplay(a) {
  const disc = a.disciplina, spec = (a.specialita || "").trim(), rows = (a.scheda && a.scheda.pb) || [];
  if (!rows.length || !spec) return "";
  const higher = (typeof pbPiuAltoMeglio === "function") ? pbPiuAltoMeglio(disc) : false;
  let best = null;
  rows.forEach(r => {
    if (!r) return;
    const ev = String(r[0] || "");
    if (ev !== spec && ev.indexOf(spec) !== 0) return;         // stessa specialità (o attrezzo che inizia con essa)
    const val = (typeof parseMisura === "function") ? parseMisura(disc, r[1]) : Number(r[1]);
    if (val == null || isNaN(val)) return;
    if (!best || (higher ? val > best.v : val < best.v)) best = { r, v: val };
  });
  if (!best) return "";
  const fmt = (typeof fmtMisura === "function") ? fmtMisura(disc, best.r[1]) : best.r[1];
  return "PB " + fmt + (disc === "lanci" ? " m" : "");
}
// metrica che "riguarda l'atleta" secondo la disciplina (report squadra adattivo)
function _metricaGruppo(a) {
  if ((typeof gruppoDi === "function" ? gruppoDi(a) : "vel") === "mezzo") {
    const rm = (typeof ritmiHomeMezzo === "function") ? ritmiHomeMezzo(a) : {};
    return (rm.soglia && rm.soglia !== "—") ? "soglia " + rm.soglia + "/km" : "";
  }
  return _pbSpecDisplay(a);
}
function listaAtleti(lista) {
  // ordinati per urgenza: rosso, giallo, verde
  const ord = { r: 0, w: 1, v: 2 };
  const base = lista || DEMO.atleti;
  const arr = [...base].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);
  if (!arr.length) return `<div class="card"><p class="et">Nessun atleta in questo gruppo. Aggiungilo da «Atleti» scegliendo la disciplina.</p></div>`;
  return arr.map(a => {
    const s = DEMO.mon[a.id], [, , col] = STATO[s.stato];
    const met = (typeof _metricaGruppo === "function") ? _metricaGruppo(a) : "";
    return `<div class="card riga-a" onclick="apriAtleta('${a.id}')">
      <span class="dot" style="background:${col}"></span>
      <div style="flex:1;min-width:0">
        <h3>${a.nome}</h3>
        <p class="et" style="margin-top:2px">${a.specialita}${met ? " · " + met : ""} · ${s.ultimo} · aderenza ${s.aderenza}%</p>
      </div>
      <span class="freccia">›</span>
    </div>`;
  }).join("");
}

// ---------- dettaglio atleta = cruscotto ----------
function apriAtleta(id) { S.atletaSel = id; S.mostraScheda = false; disegna(); window.scrollTo(0, 0); }
function chiudiAtleta() { S.atletaSel = null; disegna(); }

// ---------- NOTIFICHE allenatore: casella avvisi (fastidi/infortuni, cali di condizione, ACWR) ----------
const _NOTIF_LV = { r: "r", w: "y", v: "v" };
function _notifPront(v) {
  if (!v) return null;
  if (typeof v.prontezza === "number") return v.prontezza;
  const p = [v.sonno_qualita, v.stress, v.dolori, v.energia].map(Number).filter(x => !isNaN(x));
  return p.length ? p.reduce((s, x) => s + x, 0) / p.length : null;
}
// chiave stabile di una notifica: cambia se la situazione cambia (→ ricompare)
function _notifKey(atletaId, tipo, sig) { return atletaId + "|" + tipo + "|" + sig; }
function notificheCoach(includiVisti) {
  const out = [], oggiN = new Date();
  const gg = iso => iso ? Math.round((oggiN - new Date(iso + "T00:00:00")) / 86400000) : 999;
  const sog = (typeof CONFIG !== "undefined" && CONFIG.soglie) ? CONFIG.soglie : { prontezzaBassa: 2.5, acwrAlto: 1.5 };
  const add = (a, tipo, lv, data, testo, sig) => out.push({ atletaId: a.id, nome: a.nome, tipo, lv, data, testo, key: _notifKey(a.id, tipo, sig) });
  (DEMO.atleti || []).forEach(a => {
    // infortuni/fastidi aperti (sig = id infortunio)
    (DEMO.infortuni || []).filter(i => i.atleta === a.id && (i.stato || "") !== "Risolto").forEach(i => {
      add(a, "infortunio", "r", i.dataInizio || i.dal || "", `Infortunio/fastidio: ${i.zona || "?"}${i.lato ? " " + i.lato : ""}${i.tipo ? " · " + i.tipo : ""} — stato ${i.stato || "attivo"}`, i.id + "|" + (i.stato || ""));
    });
    // fastidio recente nel diario (sig = data → un nuovo fastidio ricompare)
    const storia = ((DEMO.diariStorico || {})[a.id] || []).slice().sort((x, y) => x.data < y.data ? 1 : -1);
    const fx = storia.find(v => v.fastidi && gg(v.data) <= 14);
    if (fx) add(a, "fastidio", "y", fx.data, `Fastidio segnalato nel diario${fx.doveFastidi ? ": " + fx.doveFastidi : ""}`, fx.data);
    // warning già calcolati (sig = testo → cambia se il warning cambia)
    const m = (DEMO.mon || {})[a.id] || {};
    const haAlert = m.alert && m.alert.length;
    (m.alert || []).forEach(([lv, t]) => { if (lv === "r" || lv === "w") add(a, "monitor", _NOTIF_LV[lv] || "y", "", t, t); });
    // atleti senza warning pre-calcolati: calo condizione + ACWR (sig = valore → ricompare se peggiora)
    if (!haAlert) {
      if (storia.length) {
        const p = _notifPront(storia[0]);
        if (p != null && p < sog.prontezzaBassa) add(a, "prontezza", "y", storia[0].data, `Prontezza bassa: ${p.toFixed(1)}/5`, p.toFixed(1));
        else if (p != null) { const prev = storia.slice(1, 6).map(_notifPront).filter(x => x != null); if (prev.length >= 3) { const med = prev.reduce((s, x) => s + x, 0) / prev.length; if (med - p >= 1.0) add(a, "prontezza", "y", storia[0].data, `Calo di condizione: prontezza ${p.toFixed(1)} (media recente ${med.toFixed(1)})`, p.toFixed(1)); } }
      }
      const ac = parseFloat(String(m.acwr).replace(",", "."));
      if (!isNaN(ac)) {
        if (ac > sog.acwrAlto) add(a, "acwr", "r", "", `ACWR alto ${ac.toFixed(2)}: picco di carico (rischio)`, "alto" + ac.toFixed(2));
        else if (ac < 0.8) add(a, "acwr", "y", "", `ACWR basso ${ac.toFixed(2)}: carico giù / calo di condizione`, "basso" + ac.toFixed(2));
      }
    }
  });
  const visti = DEMO.notifVisti || {};
  const lista = includiVisti ? out : out.filter(x => !visti[x.key]);
  const rank = { r: 0, y: 1, v: 2 };
  return lista.sort((x, y) => (rank[x.lv] - rank[y.lv]) || (x.data < y.data ? 1 : -1));
}
// "✓ visto": nasconde la notifica finché la situazione resta identica (la sig non cambia)
function segnaNotifVista(key) { DEMO.notifVisti = DEMO.notifVisti || {}; DEMO.notifVisti[key] = 1; if (typeof salvaCustom === "function") salvaCustom(); disegna(); }
function riattivaNotifiche() { DEMO.notifVisti = {}; if (typeof salvaCustom === "function") salvaCustom(); disegna(); }
function _notifNascoste() { return notificheCoach(true).filter(x => (DEMO.notifVisti || {})[x.key]).length; }
function vistaNotifiche() {
  const list = notificheCoach();
  const crit = list.filter(x => x.lv === "r").length, warn = list.filter(x => x.lv === "y").length;
  const ico = t => ({ infortunio: "🩹", fastidio: "🩹", prontezza: "🔋", acwr: "📈", monitor: "⚠️" })[t] || "•";
  const col = lv => lv === "r" ? "#c0392b" : lv === "y" ? "#d99000" : "#3a9a5a";
  const nascoste = (typeof _notifNascoste === "function") ? _notifNascoste() : 0;
  const intro = `<div class="card"><h3>🔔 Notifiche</h3>
    <p class="et" style="margin-top:2px">Avvisi automatici sui tuoi atleti: <b>infortuni/fastidi</b> segnalati, <b>cali di condizione</b> e <b>ACWR</b> fuori range. Un doppio controllo oltre ai cruscotti.</p>
    <p class="et" style="margin-top:8px">${list.length ? `<b style="color:${crit ? "#c0392b" : "var(--txt)"}">${list.length}</b> avvisi · ${crit} critici · ${warn} da tenere d'occhio` : "✓ Tutto tranquillo: nessun avviso al momento."}</p>
    <p class="et" style="margin-top:6px;color:var(--txt3)">Un avviso sparisce da solo quando la causa rientra (infortunio risolto, prontezza/ACWR di nuovo a posto). Con <b>✓ Visto</b> lo nascondi tu: torna solo se la situazione <b>peggiora o cambia</b>.</p>
    ${nascoste ? `<button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="riattivaNotifiche()">↺ Rivedi i ${nascoste} avvisi nascosti</button>` : ""}</div>`;
  if (!list.length) return intro;
  const esc = s => String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const rows = list.map(x => `<div class="card" style="border-left:4px solid ${col(x.lv)}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;cursor:pointer" onclick="apriAtleta('${x.atletaId}')">
        <b style="font-size:14px">${ico(x.tipo)} ${x.nome}</b>
        <span class="et" style="margin:0">${x.data ? (typeof fmtDataAnno === "function" ? fmtDataAnno(x.data) : x.data) : ""}</span></div>
      <p class="et" style="margin:4px 0 0;color:var(--txt2)">${x.testo}</p>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="btn btn-2" style="width:auto;padding:6px 12px;font-size:13px" onclick="apriAtleta('${x.atletaId}')">apri atleta ›</button>
        <button class="btn btn-2" style="width:auto;padding:6px 12px;font-size:13px" onclick="segnaNotifVista('${esc(x.key)}')">✓ Visto</button>
      </div>
    </div>`).join("");
  return intro + rows;
}

function vistaAtletaDettaglio() {
  const a = DEMO.atleti.find(x => x.id === S.atletaSel);
  const s = DEMO.mon[a.id];
  const [, txt, col] = STATO[s.stato];

  const avvisi = s.alert.map(([lv, t]) => {
    const c = STATO[lv][2];
    return `<div class="avviso" style="background:${lv === 'v' ? 'var(--verde-bg)' : lv === 'w' ? 'var(--giallo-bg)' : 'var(--rosso-bg)'}">
      <span style="color:${c}">${lv === 'v' ? '▲' : '!'}</span>
      <span style="color:${c};font-size:13px">${t}</span></div>`;
  }).join("");

  const sett = s.settimana.map((tp, i) => `
    <div class="mini-g">
      <div class="mini-c ${tp ? TIPO_CELLA[tp] : 'vuoto'} ${s.done[i] ? '' : 'nofatto'}">${s.done[i] ? '✓' : ''}</div>
      <div class="et" style="text-align:center;font-size:10px">${DEMO.giorniSettimana[i]}</div>
    </div>`).join("");

  return `
  <button class="indietro" onclick="chiudiAtleta()">‹ Squadra</button>
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="avatar">${a.nome.split(" ").map(x => x[0]).join("")}</div>
      <div style="flex:1"><h3>${a.nome}</h3><p class="et" style="margin-top:2px">${a.disciplina} · ${a.specialita}</p></div>
      <span class="pill ${STATO[s.stato][0]}">${txt}</span>
    </div>
  </div>

  ${s.alert.length ? `<div style="margin-bottom:11px">${avvisi}</div>` : ""}

  <div class="quadri" style="margin-bottom:11px">
    <div class="q"><div class="k">ACWR</div><div class="v">${s.acwr}</div></div>
    <div class="q"><div class="k">Forma (TSB)</div><div class="v">${s.forma}</div></div>
    <div class="q"><div class="k">Prontezza</div><div class="v">${s.prontezza}</div></div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Ultima settimana</p>
    <div class="mini-week">${sett}</div>
  </div>

  <div class="griglia2" style="margin-bottom:11px">
    <div class="num"><div class="k">Prossima gara</div><div class="v" style="font-size:16px">${DEMO.prossimaGara.luogo}</div>
      <div class="et">tra ${DEMO.prossimaGara.traSettimane} sett</div></div>
    <div class="num"><div class="k">Profilo F-V</div><div class="v" style="font-size:15px">${s.fv}</div></div>
  </div>

  ${(typeof gruppoDi === "function" && gruppoDi(a) === "mezzo" && typeof cardProfiloMezzo === "function") ? cardProfiloMezzo(a) : ""}
  ${(typeof gruppoDi === "function" && gruppoDi(a) === "lanci" && typeof cardProfiloLanci === "function") ? cardProfiloLanci(a) : ""}

  <div class="card">
    <p class="et" style="margin-bottom:6px">Accesso atleta</p>
    ${a.email
      ? `<p style="font-size:14px"><b>${a.email}</b> ${a.haAccesso ? '<span class="pill p-verde">registrato</span>' : '<span class="pill p-giallo">in attesa</span>'}</p>
         <p class="et" style="margin-top:6px">${a.haAccesso ? "L'atleta ha l'accesso attivo." : "Di' all'atleta di aprire l'app → «Sei un atleta? Registrati» e usare questa email."}</p>`
      : `<p class="et">Nessuna email impostata: l'atleta non può ancora accedere.</p>`}
    <button class="btn btn-2" style="margin-top:10px" onclick="cambiaEmailAtleta('${a.id}')">${a.email ? "Cambia email di accesso" : "Imposta email di accesso"}</button>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Apri</p>
    <div class="azioni">
      <button class="btn btn-2" onclick="apriSchedaAtleta()">Scheda: dati, PB, massimali, test</button>
      <button class="btn btn-2" onclick="apriModificaDati('${a.id}')">Modifica dati anagrafici</button>
      ${(() => {
        const sog = typeof seduteDelGiorno === "function" ? seduteDelGiorno(oggiISO(), false, a) : [];
        return sog.length
          ? sog.map(s => `<button class="btn btn-2" onclick="apriSeduta('${s.id}')">Seduta di oggi: ${s.tipo === "pista" ? "Pista" : "Palestra"}</button>`).join("")
          : `<button class="btn btn-2" disabled style="opacity:.5">Nessuna seduta oggi</button>`;
      })()}
      <button class="btn btn-2" onclick="vai('pista')">Programma</button>
      <button class="btn btn-2" onclick="apriSpostaGiorni('${a.id}')">Sposta giorni (personalizza)</button>
      <button class="btn btn-2" onclick="apriAdatta('${a.id}')">Adatta contenuto (per lui)</button>
      <button class="btn btn-2" onclick="apriSeduteSvolte('${a.id}')">Allenamenti svolti</button>
      <button class="btn btn-2" onclick="apriReport('${a.id}')">📄 Report completo (PDF)</button>
      <button class="btn btn-2" onclick="vai('diario-c')">Diario</button>
      <button class="btn btn-2" onclick="vai('presenze')">Presenze</button>
    </div>
  </div>

  <button class="btn btn-2" style="color:var(--rosso);border-color:rgba(255,107,107,.4)" onclick="eliminaAtletaUI('${a.id}')">🗑 Elimina atleta</button>`;
}
async function eliminaAtletaUI(id) {
  const a = DEMO.atleti.find(x => x.id === id);
  if (!confirm(`Eliminare ${a ? a.nome : "l'atleta"} e tutti i suoi dati (PB, massimali, test, infortuni)? Non è reversibile.`)) return;
  if (typeof eliminaAtleta === "function") { const ok = await eliminaAtleta(id); if (ok) { S.atletaSel = null; S.vista = "atleti"; disegna(); window.scrollTo(0, 0); } }
}
async function cambiaEmailAtleta(id) {
  const a = DEMO.atleti.find(x => x.id === id);
  const em = prompt("Email di accesso dell'atleta (la userà per registrarsi):", (a && a.email) || "");
  if (em === null) return;
  if (typeof impostaEmailAtleta === "function") { const ok = await impostaEmailAtleta(id, em); if (ok) disegna(); }
}

// ---------- calendario squadra ----------
function vistaCalendarioSquadra() {
  const gg = DEMO.giorniSettimana;
  const righe = DEMO.atleti.map(a => {
    const s = DEMO.mon[a.id];
    const celle = s.settimana.map((tp, i) => tp
      ? `<div class="cell ${TIPO_CELLA[tp]} ${s.done[i] ? '' : 'nofatto'}">${s.done[i] ? '✓' : ''}</div>`
      : `<div class="cell off"></div>`).join("");
    return `<div class="srow">
      <span class="srow-n">${a.nome.split(" ")[0]} ${a.nome.split(" ")[1][0]}.</span>${celle}</div>`;
  }).join("");

  return `
  <div class="card">
    <h3>Calendario squadra</h3>
    <p class="et" style="margin-top:2px">${DEMO.report.settimana} · chi si allena quando</p>
    <div class="shead"><span></span>${gg.map(g => `<span>${g}</span>`).join("")}</div>
    ${righe}
    <div class="legenda">
      <span><span class="quad" style="background:#2f6fd6"></span> pista</span>
      <span><span class="quad" style="background:#5148b0"></span> palestra</span>
      <span><span class="quad" style="background:#d85a30"></span> gara</span>
      <span>✓ fatto</span>
    </div>
  </div>`;
}

// ---------- report della domenica ----------
function vistaReport() {
  const lista = atletiDelGruppo(S.gruppo);
  const r = DEMO.report, t = triage(lista);
  const ord = { r: 0, w: 1, v: 2 };
  const arr = [...lista].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);

  const schede = arr.map(a => {
    const s = DEMO.mon[a.id];
    const kpi = [["sedute", `${DEMO.mon[a.id].done.filter(Boolean).length}/${s.settimana.filter(Boolean).length}`],
      ["prontezza", s.prontezza], ["ACWR", s.acwr], ["aderenza", s.aderenza + "%"]];
    const avvisi = s.alert.map(([lv, tx]) => {
      const c = STATO[lv][2];
      return `<div class="avviso" style="background:${lv === 'v' ? 'var(--verde-bg)' : lv === 'w' ? 'var(--giallo-bg)' : 'var(--rosso-bg)'}">
        <span style="color:${c}">${lv === 'v' ? '▲' : '!'}</span><span style="color:${c};font-size:12px">${tx}</span></div>`;
    }).join("");
    const daFare = r.daFare[a.id];
    return `<div class="card">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">
        <span class="dot" style="background:${STATO[s.stato][2]}"></span>
        <h3 style="flex:1">${a.nome}</h3><span class="et">${a.specialita}</span></div>
      <div class="kpi4">${kpi.map(([k, v]) => `<div class="num" style="padding:7px 8px">
        <div class="k">${k}</div><div class="v" style="font-size:15px">${v}</div></div>`).join("")}</div>
      <div style="margin-top:8px">${avvisi}</div>
      ${daFare ? `<p style="font-size:12px;color:var(--txt2);margin-top:8px">→ ${daFare}</p>` : ""}
    </div>`;
  }).join("");

  return `
  <div class="card">
    <h3>Report settimanale</h3>
    <p class="et" style="margin-top:2px">${nomeGruppo(S.gruppo)} · ${r.settimana}</p>
  </div>
  ${chipsGruppi()}
  <div class="quadri" style="margin-bottom:11px">
    <div class="q"><div class="k">Da vedere subito</div><div class="v" style="color:var(--rosso)">${t.r}</div></div>
    <div class="q"><div class="k">Tieni d'occhio</div><div class="v" style="color:var(--giallo)">${t.w}</div></div>
    <div class="q"><div class="k">In regola</div><div class="v" style="color:var(--verde)">${t.v}</div></div>
  </div>

  <div class="card" style="border-color:rgba(124,194,67,.4)">
    <p class="et" style="margin-bottom:9px;color:var(--verde)">Come sta andando la squadra</p>
    <p style="font-size:13px;margin-bottom:7px"><b>Pista</b> · <span style="color:var(--txt2)">${r.positivo.pista}</span></p>
    <p style="font-size:13px;margin-bottom:10px"><b>Palestra</b> · <span style="color:var(--txt2)">${r.positivo.palestra}</span></p>
    ${r.positivo.wins.map(([n, w]) => `<div style="display:flex;gap:7px;padding:3px 0">
      <span style="color:var(--verde)">▲</span><span style="font-size:13px"><b>${n}</b> <span style="color:var(--txt2)">${w}</span></span></div>`).join("")}
  </div>

  <p class="et" style="margin:14px 2px 8px">Atleti per priorità</p>
  ${schede}`;
}

// ---------- monitoraggio: carico e forma ----------
function vistaCarico() {
  const righe = ordinaAtleti().map(a => {
    const s = DEMO.mon[a.id];
    return `<div class="card">
      <div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
        <span class="dot" style="background:${STATO[s.stato][2]}"></span>
        <h3 style="flex:1">${a.nome}</h3><span class="et">${a.specialita}</span></div>
      <div class="quadri">
        <div class="q"><div class="k">ACWR</div><div class="v" style="color:${colAcwr(s.acwr)}">${s.acwr}</div></div>
        <div class="q"><div class="k">Forma (TSB)</div>
          <div class="v" style="color:${parseFloat(s.forma) >= 0 ? 'var(--verde)' : 'var(--giallo)'}">${s.forma}</div></div>
        <div class="q"><div class="k">Prontezza</div><div class="v" style="color:${colProntezza(s.prontezza)}">${s.prontezza}</div></div>
      </div></div>`;
  }).join("");
  return `<div class="card"><h3>Carico e forma</h3>
    <p class="et" style="margin-top:2px">ACWR, freschezza (TSB) e prontezza di ogni atleta ·
      <button class="link-indietro" onclick="vai('aiuto')">cosa vogliono dire ›</button></p></div>
    ${righe}`;
}

// ---------- monitoraggio: infortuni e prevenzione ----------
const ZONE_INF = ["Ischiocrurali", "Polpaccio", "Adduttori", "Quadricipite", "Flessori anca", "Schiena/lombare", "Ginocchio", "Caviglia", "Tendine Achille", "Piede", "Spalla", "Altro"];
const TIPO_INF = ["Muscolare", "Tendineo", "Articolare", "Osseo", "Altro"];
const LATO_INF = ["Dx", "Sx", "Bilaterale"];
const STATO_INF = ["Attivo", "In recupero", "Risolto"];
function pillStato(s) { return s === "Risolto" ? "p-verde" : s === "In recupero" ? "p-giallo" : "p-rosso"; }
function giorniTra(aISO, bISO) { if (!aISO || !bISO) return null; const d = (new Date(bISO) - new Date(aISO)) / 86400000; return isNaN(d) ? null : Math.round(d); }
function durataInf(inf) {
  const oggi = new Date().toISOString().slice(0, 10);
  if (inf.dataRientro) { const g = giorniTra(inf.dataInizio, inf.dataRientro); return g != null ? `${g} gg` : ""; }
  if (inf.dataInizio) { const g = giorniTra(inf.dataInizio, oggi); return g != null ? `${g} gg (in corso)` : ""; }
  return "";
}

function vistaInfortuni() {
  const righe = (DEMO.infortuni || []).map(inf => {
    const meta = [inf.lato, inf.tipo, inf.gravita ? "gravità " + inf.gravita + "/5" : "", durataInf(inf)].filter(Boolean).join(" · ");
    const dataTxt = inf.dataInizio ? (typeof fmtData === "function" ? fmtData(inf.dataInizio) : inf.dataInizio) : (inf.dal || "");
    return `<div class="card" style="border-color:rgba(240,168,60,.45)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3>${nomeAtleta(inf.atleta)}</h3><span class="pill ${pillStato(inf.stato)}">${inf.stato || "Attivo"}</span></div>
      <p style="font-weight:500;margin-top:6px">${inf.zona}${inf.lato ? " " + inf.lato : ""} <span class="et">· dal ${dataTxt}</span></p>
      ${meta ? `<p class="et" style="margin-top:2px">${meta}</p>` : ""}
      ${inf.nota ? `<p style="font-size:14px;line-height:1.6;color:var(--txt2);margin-top:6px">${inf.nota}</p>` : ""}
      <div style="display:flex;gap:8px;margin-top:11px">
        ${inf.stato !== "Risolto" ? `<button class="btn-2" style="flex:1;padding:9px" onclick="risolviInfortunio('${inf.id}')">Segna risolto</button>` : ""}
        <button class="btn-2" style="flex:1;padding:9px;color:var(--rosso)" onclick="eliminaInfortunioUI('${inf.id}')">Elimina</button>
      </div></div>`;
  }).join("");
  return `<div class="card"><h3>Infortuni e prevenzione</h3>
    <p class="et" style="margin-top:2px">Registro infortuni e fastidi: segnala, aggiorna lo stato, tieni la durata.</p></div>
    <button class="btn" style="margin-bottom:12px" onclick="apriInfortunio('','infortuni')">＋ Segnala infortunio</button>
    ${righe || `<div class="card"><p class="et">Nessun infortunio segnalato. 💪</p></div>`}`;
}

function apriInfortunio(atletaId, from) {
  S.infortunio = { atletaId: atletaId || "", from: from || "infortuni", zona: "", lato: "", tipo: "", gravita: "", stato: "Attivo", dataInizio: new Date().toISOString().slice(0, 10), dataRientro: "", nota: "" };
  disegna(); window.scrollTo(0, 0);
}
function chiudiInfortunio() { const f = S.infortunio && S.infortunio.from; S.infortunio = null; if (f && f !== "seduta") S.vista = f; disegna(); window.scrollTo(0, 0); }

function vistaInfortunioForm() {
  const f = S.infortunio;
  const sel = (arr, cur, campo) => `<select onchange="S.infortunio.${campo}=this.value" style="margin-top:6px"><option value="">—</option>${arr.map(z => `<option ${String(cur) === String(z) ? "selected" : ""}>${z}</option>`).join("")}</select>`;
  return `<button class="indietro" onclick="chiudiInfortunio()">‹ Indietro</button>
    <div class="card"><h3>Segnala infortunio</h3>
      <p class="et" style="margin-top:2px">Si salva nel registro infortuni dell'atleta.</p></div>
    <div class="card">
      <label class="lab">Atleta</label>
      <select onchange="S.infortunio.atletaId=this.value" style="margin-top:6px">
        <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${f.atletaId === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Zona</label>${sel(ZONE_INF, f.zona, "zona")}</div>
        <div><label class="lab">Lato</label>${sel(LATO_INF, f.lato, "lato")}</div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Tipo</label>${sel(TIPO_INF, f.tipo, "tipo")}</div>
        <div><label class="lab">Gravità (1-5)</label>${sel([1, 2, 3, 4, 5], f.gravita, "gravita")}</div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Data inizio</label>
          <input type="date" value="${f.dataInizio || ""}" oninput="S.infortunio.dataInizio=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Rientro (prev./eff.)</label>
          <input type="date" value="${f.dataRientro || ""}" oninput="S.infortunio.dataRientro=this.value" style="margin-top:6px"></div>
      </div>
      <label class="lab" style="display:block;margin-top:12px">Stato</label>
      <select onchange="S.infortunio.stato=this.value" style="margin-top:6px">${STATO_INF.map(z => `<option ${f.stato === z ? "selected" : ""}>${z}</option>`).join("")}</select>
      <label class="lab" style="display:block;margin-top:12px">Causa / cosa fare</label>
      <textarea rows="3" oninput="S.infortunio.nota=this.value" placeholder="Come è successo, indicazioni, cosa fare…" style="margin-top:6px;width:100%">${(f.nota || "").replace(/</g, "&lt;")}</textarea>
    </div>
    <button class="btn" onclick="salvaInfortunio()">Salva nel registro</button>`;
}

async function salvaInfortunio() {
  const f = S.infortunio;
  if (!f.atletaId) { alert("Scegli l'atleta."); return; }
  if (!f.zona) { alert("Scegli la zona."); return; }
  const btn = document.querySelector(".main .btn"); if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }
  const ok = await creaInfortunio(f.atletaId, {
    zona: f.zona, lato: f.lato || null, tipo: f.tipo || null, gravita: f.gravita ? Number(f.gravita) : null,
    stato: f.stato || "Attivo", dataInizio: f.dataInizio || null, dataRientro: f.dataRientro || null, nota: (f.nota || "").trim() || null
  });
  if (ok) { const from = f.from; S.infortunio = null; if (from !== "seduta") S.vista = "infortuni"; disegna(); window.scrollTo(0, 0); }
  else if (btn) { btn.textContent = "Salva nel registro"; btn.disabled = false; }
}

async function risolviInfortunio(id) {
  const inf = (DEMO.infortuni || []).find(x => String(x.id) === String(id));
  if (!inf) return;
  const oggi = new Date().toISOString().slice(0, 10);
  if (typeof aggiornaInfortunio === "function") await aggiornaInfortunio(id, { stato: "Risolto", data_rientro: oggi, aperto: false });
  inf.stato = "Risolto"; if (!inf.dataRientro) inf.dataRientro = oggi;
  disegna();
}
async function eliminaInfortunioUI(id) {
  if (!confirm("Eliminare questo infortunio dal registro?")) return;
  if (typeof eliminaInfortunio === "function") await eliminaInfortunio(id);
  DEMO.infortuni = (DEMO.infortuni || []).filter(x => String(x.id) !== String(id));
  disegna();
}

// ---------- monitoraggio: PREVENZIONE (test asimmetrie dx/sx = Limb Symmetry Index) ----------
const PREV_TESTS = [
  { k: "ktw", nome: "Caviglia KTW (dorsiflessione)", unita: "cm" },
  { k: "ake", nome: "Hamstring AKE", unita: "°" },
  { k: "hip", nome: "Rotazione interna anca", unita: "°" },
  { k: "hop", nome: "Salto monopodalico", unita: "cm" }
];
const PREV_ESERCIZI = [
  ["Nordic hamstring", "ischiocrurali · −~50% infortuni", "nordic+hamstring+curl"],
  ["Copenhagen adduction", "adduttori / inguine", "copenhagen+adduction+exercise"],
  ["Calf raise eccentrico", "polpaccio / Achille", "eccentric+calf+raise"],
  ["Core anti-rotazione (Pallof press)", "core", "pallof+press"]
];
// cosa fare quando il test è oltre soglia (per lavorare sul lato debole)
const PREV_NOTE = {
  ktw: "Mobilità caviglia (knee-to-wall, sblocco tibio-tarsica) e soft tissue polpaccio/soleo sul lato rigido, poi rinforzo caviglia. Ricontrolla.",
  ake: "Estensibilità + forza eccentrica ischiocrurali sul lato corto (Nordic mirato, hip hinge) e attivazione prima di correre.",
  hip: "Mobilità anca sul lato limitato (rotazioni interne, 90/90, stretch glutei/piriforme) e controllo del bacino; rivaluta a 4-6 settimane.",
  hop: "Forza e potenza monopodalica sul lato debole (split squat, step-up, progressione di balzi) finché la simmetria torna sotto il 10%."
};
// esempio pre-compilato su Leonardo (at1): 2 ok, 1 attenzione, 1 bandiera
let prevState = { atletaRif: "at1", val: {
  ktw: { dx: "11", sx: "10" }, ake: { dx: "72", sx: "68" },
  hip: { dx: "38", sx: "30" }, hop: { dx: "185", sx: "165" }
} };
function setPrevAtleta(id) { prevState.atletaRif = id; disegna(); }
function setPrevVal(k, lato, v) { prevState.val[k][lato] = v; }
function prevAsym(k) {
  const d = parseFloat(String(prevState.val[k].dx).replace(",", "."));
  const s = parseFloat(String(prevState.val[k].sx).replace(",", "."));
  if (isNaN(d) || isNaN(s) || d <= 0 || s <= 0) return null;
  return Math.abs(d - s) / Math.max(d, s) * 100;
}
function prevColor(a) { return a == null ? "var(--txt3)" : a > 15 ? "var(--rosso)" : a >= 10 ? "var(--giallo)" : "var(--verde)"; }
function prevFlag(a) { return a == null ? "—" : a > 15 ? "🔴 asimmetria" : a >= 10 ? "🟡 attenzione" : "🟢 ok"; }

function vistaPrevenzione() {
  const atl = DEMO.atleti.find(x => x.id === prevState.atletaRif);
  const righe = PREV_TESTS.map(t => {
    const a = atl ? prevAsym(t.k) : null;
    return `<tr>
      <td style="text-align:left">${t.nome}<br><span class="et">${t.unita}</span></td>
      <td><input inputmode="decimal" value="${prevState.val[t.k].dx}" placeholder="dx" oninput="setPrevVal('${t.k}','dx',this.value)" onchange="disegna()" style="min-width:50px"></td>
      <td><input inputmode="decimal" value="${prevState.val[t.k].sx}" placeholder="sx" oninput="setPrevVal('${t.k}','sx',this.value)" onchange="disegna()" style="min-width:50px"></td>
      <td class="pauto" style="color:${prevColor(a)};font-weight:600">${a != null ? a.toFixed(1) + "%" : "—"}</td>
      <td style="color:${prevColor(a)};white-space:nowrap">${prevFlag(a)}</td>
    </tr>`;
  }).join("");
  const flags = atl ? PREV_TESTS.map(t => prevAsym(t.k)).filter(a => a != null) : [];
  const nRosse = flags.filter(a => a > 15).length, nGialle = flags.filter(a => a >= 10 && a <= 15).length;
  const stato = !flags.length ? "" : nRosse ? `🔴 ${nRosse} asimmetria da correggere` : nGialle ? `🟡 ${nGialle} da tenere d'occhio` : "🟢 simmetria nella norma";

  return `
  <div class="card"><h3>Prevenzione — test asimmetrie</h3>
    <p class="et" style="margin-top:2px">Confronto destra/sinistra (Limb Symmetry Index). Per ogni test inserisci dx e sx: la % di asimmetria si calcola da sola. Rif.: &gt;15% 🔴 bandiera · 10–15% 🟡 attenzione · &lt;10% 🟢 ok.</p></div>

  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setPrevAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${prevState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
  </div>

  <div class="card">
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th style="text-align:left">Test</th><th>Dx</th><th>Sx</th><th>Asimm.</th><th>Esito</th></tr></thead>
      <tbody>${righe}</tbody>
    </table></div>
    ${stato ? `<p style="margin-top:12px;font-weight:600">${stato}</p>` : ""}
    <p class="et" style="margin-top:6px">Misura KTW e salto in cm, AKE e rotazione anca in gradi. Ricontrolla ogni ~8 settimane e confronta.</p>
    ${atl && flags.length ? `<button class="btn btn-2" style="margin-top:12px" onclick="salvaPrevenzione()">💾 Salva il test</button>` : (atl ? `<p class="et" style="margin-top:8px">Inserisci i test (dx e sx) per salvarli.</p>` : "")}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Come si eseguono i test (video)</p>
    ${typeof TEST_COME !== "undefined" ? [0, 1, 2, 5].map(i => { const t = TEST_COME[i]; if (!t) return ""; return `<div class="lib-row" onclick="apriTestVideo(${i})"><div style="flex:1;min-width:0"><div style="font-weight:500">${t[0]}</div><div class="et" style="margin-top:2px;white-space:normal;line-height:1.4">${t[1].length > 80 ? t[1].slice(0, 80) + "…" : t[1]}</div></div><span class="vid-ic">▶</span><span class="freccia">›</span></div>`; }).join("") : ""}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Cosa fare</p>
    ${(() => {
      const daFare = atl ? PREV_TESTS.filter(t => { const a = prevAsym(t.k); return a != null && a >= 10; }) : [];
      return daFare.length
        ? daFare.map(t => { const a = prevAsym(t.k); return `<div style="margin-bottom:10px">
            <b style="font-size:14px;color:${prevColor(a)}">${t.nome} · ${a.toFixed(1)}%</b>
            <p style="font-size:14px;line-height:1.6;color:var(--txt2);margin-top:2px">${PREV_NOTE[t.k]}</p></div>`; }).join("")
        : `<p class="et">Nessuna asimmetria oltre il 10%: mantieni la prevenzione di base (Nordic, Copenhagen, calf, core 2×/sett).</p>`;
    })()}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Rientro graduale &amp; prehab</p>
    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.65;color:var(--txt2)">
      <li>Rientro solo a <b>dolore assente</b>, forza ~90% del lato sano e gesto tecnico pulito. Carico in progressione, non di colpo.</li>
      <li>Dopo uno stop riparti con volume/intensità bassi (lo Scarico nel Piano &amp; Picco aiuta) e ricontrolla le asimmetrie.</li>
      <li>Prevenzione di base <b>2×/sett</b> nelle zone a rischio del velocista: ischiocrurali, adduttori, polpaccio, core.</li>
    </ul>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:10px">Esercizi di prevenzione</p>
    ${PREV_ESERCIZI.map(([n, d, q]) => `<div class="lib-row">
      <div style="flex:1"><b style="font-size:14px">${n}</b><div class="et" style="margin:2px 0 0">${d}</div></div>
      <a class="vid-ic" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">cerca ▶</a>
    </div>`).join("")}
    <p class="et" style="margin-top:10px">Rif.: ACWR (Gabbett) 0.8–1.3 · asimmetria &gt;10–15% = bandiera (Limb Symmetry Index) · Nordic hamstring (meta-analisi van Dyk / Al Attar).</p>
  </div>
  ${atl && typeof bloccoSessioni === "function" ? bloccoSessioni(atl.id, "prevenzione", "Test di prevenzione salvati") : ""}`;
}
function salvaPrevenzione() {
  const a = DEMO.atleti.find(x => x.id === prevState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const dati = {}; let n = 0;
  PREV_TESTS.forEach(t => { const asym = prevAsym(t.k); if (asym != null) { dati[t.k] = { dx: prevState.val[t.k].dx, sx: prevState.val[t.k].sx, asym }; n++; } });
  if (!n) { alert("Inserisci almeno un test (dx e sx)."); return; }
  if (typeof salvaSessione === "function") salvaSessione(a.id, "prevenzione", dati);
  alert(`Test di prevenzione salvato per ${a.nome}.`); disegna();
}

// ---------- monitoraggio: presenze squadra ----------
function vistaPresenzeCoach() {
  const righe = ordinaAtleti().map(a => {
    const stag = Math.round(a.presenzeStagione[0] / a.presenzeStagione[1] * 100);
    const col = stag >= 85 ? "var(--verde)" : stag >= 70 ? "var(--giallo)" : "var(--rosso)";
    return `<div class="card riga-a">
      <div style="flex:1;min-width:0"><h3>${a.nome}</h3>
        <p class="et" style="margin-top:2px">mese ${a.presenzeMese[0]}/${a.presenzeMese[1]} · stagione ${a.presenzeStagione[0]}/${a.presenzeStagione[1]}</p></div>
      <b style="font-size:18px;color:${col}">${stag}%</b></div>`;
  }).join("");
  return `<div class="card"><h3>Presenze squadra</h3>
    <p class="et" style="margin-top:2px">Aderenza di ogni atleta (fatti su programmati)</p></div>
    ${righe}`;
}

// ---------- monitoraggio: diario squadra ----------
function vistaDiarioCoach() {
  const righe = ordinaAtleti().map(a => {
    const d = DEMO.diariCoach[a.id] || {};
    const pr = d.prontezza || DEMO.mon[a.id].prontezza;
    const nGiorni = ((DEMO.diariStorico || {})[a.id] || []).length;
    const stato = d.compilato
      ? `compilato ${d.ultimo}`
      : `<span style="color:var(--rosso)">non compilato da ${d.ultimo}</span>`;
    return `<div class="card es" onclick="apriDiarioAtleta('${a.id}')">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1;min-width:0"><h3>${a.nome}</h3>
          <p class="et" style="margin-top:2px">${stato}${nGiorni ? ` · ${nGiorni} giorni registrati` : ""}</p></div>
        <div style="text-align:right"><div class="et">prontezza</div>
          <b style="font-size:18px;color:${colProntezza(pr)}">${pr}</b></div>
        <span class="freccia">›</span></div>
      ${d.compilato && (d.sonno || d.nota) ? `<p class="et" style="margin-top:8px">${d.sonno ? "sonno " + d.sonno + " h" : ""}${d.sonno && d.nota ? " · " : ""}${d.nota || ""}</p>` : ""}
    </div>`;
  }).join("");
  return `<div class="card"><h3>Diario squadra</h3>
    <p class="et" style="margin-top:2px">Prontezza e ultimo diario di ogni atleta. Tocca un atleta per vederlo giorno per giorno.</p></div>
    ${righe}`;
}
function apriDiarioAtleta(id) { S.diarioAtleta = id; disegna(); window.scrollTo(0, 0); }
function chiudiDiarioAtleta() { S.diarioAtleta = null; S.vista = "diario-c"; disegna(); window.scrollTo(0, 0); }
function vistaDiarioAtleta() {
  const a = DEMO.atleti.find(x => x.id === S.diarioAtleta);
  if (!a) { S.diarioAtleta = null; return vistaDiarioCoach(); }
  const storia = ((DEMO.diariStorico || {})[a.id] || []).slice().sort((x, y) => x.data < y.data ? 1 : -1);
  const dl = v => typeof dataLunga === "function" ? dataLunga(v) : v;
  const giorni = storia.map(v => `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3 style="font-size:16px">${dl(v.data)}</h3>
        <div style="text-align:right"><span class="et" style="margin:0">prontezza</span>
          <b style="font-size:17px;margin-left:6px;color:${colProntezza(v.prontezza)}">${v.prontezza != null ? v.prontezza : "—"}</b></div></div>
      <p class="et" style="margin-top:6px">sonno ${v.oreSonno != null ? v.oreSonno + " h" : "—"} · qualità ${v.sonno_qualita ?? "—"}/5 · stress ${v.stress ?? "—"}/5 · dolori ${v.dolori ?? "—"}/5 · energia ${v.energia ?? "—"}/5</p>
      ${v.fastidi ? `<p class="et" style="color:var(--rosso);margin-top:3px">⚠ fastidio${v.doveFastidi ? ": " + v.doveFastidi : ""}</p>` : ""}
      ${v.peso ? `<p class="et" style="margin-top:3px">peso ${v.peso} kg</p>` : ""}
      ${v.note ? `<p style="font-size:14px;line-height:1.5;margin-top:6px">${v.note}</p>` : ""}
    </div>`).join("");
  return `<button class="indietro" onclick="chiudiDiarioAtleta()">‹ Diario squadra</button>
    <div class="card"><h3>Diario · ${a.nome}</h3>
      <p class="et" style="margin-top:2px">Giorno per giorno${storia.length ? ` · ${storia.length} inserimenti` : ""}</p></div>
    ${giorni || `<div class="card"><p class="et">Nessun diario registrato ancora per ${a.nome}.</p></div>`}`;
}

// ---------- TAPPA 3b: sposta i giorni di un atleta (override sul madre, senza toccarlo) ----------
const GG_LABEL = { lun: "Lunedì", mar: "Martedì", mer: "Mercoledì", gio: "Giovedì", ven: "Venerdì", sab: "Sabato", dom: "Domenica" };
const GG_ORDER = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
function apriSpostaGiorni(id) { S.spostaGiorni = id; disegna(); window.scrollTo(0, 0); }
function chiudiSpostaGiorni() { S.spostaGiorni = null; disegna(); window.scrollTo(0, 0); }
function _mesoRif(prog) {
  const act = (typeof mesoAttivo === "function") ? mesoAttivo(prog, oggiISO(), true) : null;
  return act ? act.m : ((prog && prog.mesocicli && prog.mesocicli[0]) || null);
}
function setOverrideGiorno(atletaId, tipo, gi, wd) {
  DEMO.overrideGiorni = DEMO.overrideGiorni || {};
  const a = DEMO.overrideGiorni[atletaId] = DEMO.overrideGiorni[atletaId] || {};
  const t = a[tipo] = a[tipo] || {};
  if (wd) t[gi] = wd; else delete t[gi];
  if (Object.keys(t).length === 0) delete a[tipo];
  if (Object.keys(a).length === 0) delete DEMO.overrideGiorni[atletaId];
  if (typeof salvaCustom === "function") salvaCustom();
  disegna();
}
function bloccoSposta(atletaId, tipo, prog) {
  const m = _mesoRif(prog);
  const giorniProg = (m && m.giorni || []).map((g, gi) => ({ g, gi })).filter(x => x.g.giornoSett);
  if (!giorniProg.length) return `<div class="card"><p class="et" style="margin:0">${tipo === "pista" ? "Pista" : "Palestra"}: nessun giorno programmato nel madre.</p></div>`;
  const ov = (DEMO.overrideGiorni && DEMO.overrideGiorni[atletaId] && DEMO.overrideGiorni[atletaId][tipo]) || {};
  const righe = giorniProg.map(({ g, gi }) => {
    const cur = ov[gi] || "";
    const spostato = cur && cur !== g.giornoSett;
    const opts = `<option value="">Come il madre (${GG_LABEL[g.giornoSett] || g.giornoSett})</option>` +
      GG_ORDER.map(w => `<option value="${w}" ${cur === w ? "selected" : ""}>${GG_LABEL[w]}</option>`).join("");
    return `<div style="margin-bottom:14px">
      <div style="font-weight:500">Giorno ${gi + 1}</div>
      <div class="et" style="margin:2px 0 6px">madre: ${GG_LABEL[g.giornoSett] || g.giornoSett}${spostato ? ` → <b style="color:var(--blu)">${GG_LABEL[cur]}</b>` : ""}</div>
      <select style="width:100%" onchange="setOverrideGiorno('${atletaId}','${tipo}',${gi},this.value)">${opts}</select>
    </div>`;
  }).join("");
  return `<div class="card"><p class="et" style="margin-bottom:8px">${tipo === "pista" ? "Pista" : "Palestra"}</p>${righe}</div>`;
}
function vistaSpostaGiorni() {
  const a = DEMO.atleti.find(x => x.id === S.spostaGiorni);
  if (!a) { S.spostaGiorni = null; return typeof vistaAtletaDettaglio === "function" ? vistaAtletaDettaglio() : ""; }
  return `<button class="indietro" onclick="chiudiSpostaGiorni()">‹ Torna all'atleta</button>
    <div class="card"><h3>Sposta giorni · ${a.nome}</h3>
      <p class="et" style="margin-top:2px">Scegli in che giorno della settimana ${a.nome} fa ogni seduta. Non cambia il programma madre: vale solo per lui. "Come il madre" = giorno standard. Si salva da solo.</p></div>
    ${bloccoSposta(a.id, "pista", typeof pistaDi === "function" ? pistaDi(gruppoDi(a)) : DEMO.pista)}
    ${bloccoSposta(a.id, "palestra", typeof palDi === "function" ? palDi(gruppoDi(a)) : DEMO.palestra)}`;
}

// ---------- TAPPA 3c: adatta il CONTENUTO di una seduta per un atleta (override sul madre) ----------
// programma del gruppo dell'atleta che sto adattando (S.adatta)
function _progAdatta(tipo) {
  const a = DEMO.atleti.find(x => x.id === (S.adatta && S.adatta.atletaId));
  const g = (a && typeof gruppoDi === "function") ? gruppoDi(a) : "vel";
  return tipo === "pista" ? (typeof pistaDi === "function" ? pistaDi(g) : DEMO.pista) : (typeof palDi === "function" ? palDi(g) : DEMO.palestra);
}
function _giorniSched(tipo) {
  const m = _mesoRif(_progAdatta(tipo));
  return (m && m.giorni || []).map((g, gi) => ({ g, gi })).filter(x => x.g.giornoSett);
}
function _nSettMeso(tipo) {
  const m = _mesoRif(_progAdatta(tipo));
  if (!m) return 4;
  if (typeof nSettimaneMeso === "function") return nSettimaneMeso(m);
  return (m.giorni[0] && m.giorni[0].settimane.length) || 4;
}
function _righeMadre(tipo, gi, wk) {
  const m = _mesoRif(_progAdatta(tipo));
  return (m && m.giorni[gi] && m.giorni[gi].settimane[wk] && m.giorni[gi].settimane[wk].righe) || [];
}
function apriAdatta(atletaId) {
  const sch = _giorniSched("pista");
  S.adatta = { atletaId, tipo: "pista", gi: sch.length ? sch[0].gi : 0, wk: 0 };
  disegna(); window.scrollTo(0, 0);
}
function chiudiAdatta() { S.adatta = null; disegna(); window.scrollTo(0, 0); }
function setAdattaSel(campo, val) {
  if (campo === "tipo") { S.adatta.tipo = val; const sch = _giorniSched(val); S.adatta.gi = sch.length ? sch[0].gi : 0; S.adatta.wk = 0; }
  else S.adatta[campo] = Number(val);
  disegna(); window.scrollTo(0, 0);
}
function _ensureAdattaRighe() {
  const s = S.adatta;
  DEMO.overrideContenuto = DEMO.overrideContenuto || {};
  const a = DEMO.overrideContenuto[s.atletaId] = DEMO.overrideContenuto[s.atletaId] || {};
  const t = a[s.tipo] = a[s.tipo] || {};
  const d = t[s.gi] = t[s.gi] || {};
  if (!d[s.wk]) d[s.wk] = JSON.parse(JSON.stringify(_righeMadre(s.tipo, s.gi, s.wk)));
  return d[s.wk];
}
function setAdattaRigaVal(campo, i, val) {
  const righe = _ensureAdattaRighe();
  if (righe[i]) righe[i][campo] = val;
  if (typeof salvaCustom === "function") salvaCustom();
}
function setAdattaRiga(campo, i, val) { setAdattaRigaVal(campo, i, val); disegna(); }
function addAdattaRiga() {
  const righe = _ensureAdattaRighe();
  righe.push(S.adatta.tipo === "pista" ? { contenuto: "", distanza: "", n: "", rec: "", perc: "" } : { esercizio: "", serie: "", rep: "", perc: "", rec: "", tut: "", vbt: "", peso: "" });
  if (typeof salvaCustom === "function") salvaCustom();
  disegna();
}
function delAdattaRiga(i) {
  const righe = _ensureAdattaRighe();
  righe.splice(i, 1);
  if (typeof salvaCustom === "function") salvaCustom();
  disegna();
}
function ripristinaAdatta() {
  const s = S.adatta, o = DEMO.overrideContenuto && DEMO.overrideContenuto[s.atletaId];
  if (o && o[s.tipo] && o[s.tipo][s.gi]) {
    delete o[s.tipo][s.gi][s.wk];
    if (!Object.keys(o[s.tipo][s.gi]).length) delete o[s.tipo][s.gi];
    if (!Object.keys(o[s.tipo]).length) delete o[s.tipo];
    if (!Object.keys(o).length) delete DEMO.overrideContenuto[s.atletaId];
  }
  if (typeof salvaCustom === "function") salvaCustom();
  disegna();
}
function _tabellaAdattaPista(a, righe) {
  const prof = (typeof pistaDi === "function" && typeof gruppoDi === "function") ? pistaDi(gruppoDi(a)).profilo : (DEMO.pista && DEMO.pista.profilo);
  const distOpt = (prof && typeof PISTA_COEFF !== "undefined" && PISTA_COEFF[prof]) ? Object.keys(PISTA_COEFF[prof]).map(Number).sort((x, y) => x - y) : [];
  const opt = (val, arr) => arr.map(x => `<option value="${x}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`).join("");
  const rows = righe.map((r, i) => {
    const t = (typeof pistaTempoAtleta === "function") ? pistaTempoAtleta(a, r.distanza, r.perc) : null;
    return `<tr>
      <td><input value="${(r.contenuto || "").replace(/"/g, "&quot;")}" placeholder="lavoro" oninput="setAdattaRigaVal('contenuto',${i},this.value)" style="min-width:110px"></td>
      <td><select onchange="setAdattaRiga('distanza',${i},this.value)"><option value="">—</option>${opt(r.distanza, distOpt)}</select></td>
      <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setAdattaRigaVal('n',${i},this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setAdattaRigaVal('perc',${i},this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setAdattaRigaVal('rec',${i},this.value)" style="min-width:60px"></td>
      <td class="pauto">${t != null ? t.toFixed(2) : "—"}</td>
      <td><button class="chiudi" style="font-size:14px" onclick="delAdattaRiga(${i})" aria-label="Rimuovi">✕</button></td>
    </tr>`;
  }).join("");
  return `<div class="card"><div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Contenuto</th><th>Dist.</th><th>n°</th><th>% vel</th><th>Rec</th><th>Tempo</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7"><span class="et">Nessuna riga — aggiungine una.</span></td></tr>`}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:8px" onclick="addAdattaRiga()">＋ riga</button></div>`;
}
function _tabellaAdattaPal(a, righe) {
  const rows = righe.map((r, i) => {
    const peso = (typeof palPesoAtleta === "function") ? palPesoAtleta(a, r) : null;
    return `<tr>
      <td><input value="${(r.esercizio || "").replace(/"/g, "&quot;")}" placeholder="esercizio" oninput="setAdattaRigaVal('esercizio',${i},this.value)" style="min-width:120px"></td>
      <td><input inputmode="numeric" value="${r.serie || ""}" placeholder="s" oninput="setAdattaRigaVal('serie',${i},this.value)" onchange="disegna()" style="min-width:42px"></td>
      <td><input inputmode="numeric" value="${r.rep || ""}" placeholder="r" oninput="setAdattaRigaVal('rep',${i},this.value)" onchange="disegna()" style="min-width:42px"></td>
      <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setAdattaRigaVal('perc',${i},this.value)" onchange="disegna()" style="min-width:48px"></td>
      <td class="pauto">${peso != null ? peso + " kg" : "—"}</td>
      <td><button class="chiudi" style="font-size:14px" onclick="delAdattaRiga(${i})" aria-label="Rimuovi">✕</button></td>
    </tr>`;
  }).join("");
  return `<div class="card"><div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Esercizio</th><th>Serie</th><th>Rep</th><th>%1RM</th><th>Peso</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6"><span class="et">Nessuna riga — aggiungine una.</span></td></tr>`}</tbody></table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:8px" onclick="addAdattaRiga()">＋ riga</button></div>`;
}
function vistaAdatta() {
  const s = S.adatta;
  const a = DEMO.atleti.find(x => x.id === s.atletaId);
  if (!a) { S.adatta = null; return typeof vistaAtletaDettaglio === "function" ? vistaAtletaDettaglio() : ""; }
  const sch = _giorniSched(s.tipo);
  if (sch.length && !sch.some(x => x.gi === s.gi)) s.gi = sch[0].gi;
  const nSett = _nSettMeso(s.tipo);
  if (s.wk >= nSett) s.wk = 0;
  const hasOv = !!overrideRighe(a, s.tipo, s.gi, s.wk);
  const righe = hasOv ? overrideRighe(a, s.tipo, s.gi, s.wk) : _righeMadre(s.tipo, s.gi, s.wk);
  const tipoTab = `<div class="tabbar">
    <button class="${s.tipo === "pista" ? "on" : ""}" onclick="setAdattaSel('tipo','pista')">Pista</button>
    <button class="${s.tipo === "palestra" ? "on" : ""}" onclick="setAdattaSel('tipo','palestra')">Palestra</button></div>`;
  const selettori = !sch.length ? "" : `<div class="card"><div class="griglia2">
      <div><label class="lab">Giorno</label><select onchange="setAdattaSel('gi',this.value)" style="margin-top:6px">${sch.map(x => `<option value="${x.gi}" ${x.gi === s.gi ? "selected" : ""}>Giorno ${x.gi + 1} (${GG_LABEL[x.g.giornoSett] || x.g.giornoSett})</option>`).join("")}</select></div>
      <div><label class="lab">Settimana</label><select onchange="setAdattaSel('wk',this.value)" style="margin-top:6px">${Array.from({ length: nSett }, (_, w) => `<option value="${w}" ${w === s.wk ? "selected" : ""}>Settimana ${w + 1}</option>`).join("")}</select></div>
    </div>
    <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span style="font-size:13px;margin:0;${hasOv ? "color:var(--blu);font-weight:600" : "color:var(--txt3)"}">${hasOv ? "✏️ Personalizzato per lui" : "Come il madre"}</span>
      ${hasOv ? `<button class="btn btn-2" style="width:auto;padding:8px 12px" onclick="ripristinaAdatta()">↺ Ripristina il madre</button>` : ""}
    </div></div>`;
  const corpo = !sch.length
    ? `<div class="card"><p class="et">Nessun giorno programmato in ${s.tipo} nel madre. Imposta prima il programma.</p></div>`
    : (s.tipo === "pista" ? _tabellaAdattaPista(a, righe) : _tabellaAdattaPal(a, righe));
  return `<button class="indietro" onclick="chiudiAdatta()">‹ Torna all'atleta</button>
    <div class="card"><h3>Adatta contenuto · ${a.nome}</h3>
      <p class="et" style="margin-top:2px">Cambia ripetute, %, distanze o carichi solo per ${a.nome}, senza toccare il madre. Tempi e pesi restano calcolati sui suoi PB. Si salva da solo.</p></div>
    ${tipoTab}
    ${selettori}
    ${corpo}`;
}

// ---------- TAPPA 4: allenamenti SVOLTI da un atleta (cronologia) ----------
function apriSeduteSvolte(id) { S.sedSvolte = id; disegna(); window.scrollTo(0, 0); }
function chiudiSeduteSvolte() { S.sedSvolte = null; disegna(); window.scrollTo(0, 0); }
function vistaSeduteSvolte() {
  const a = DEMO.atleti.find(x => x.id === S.sedSvolte);
  if (!a) { S.sedSvolte = null; return typeof vistaAtletaDettaglio === "function" ? vistaAtletaDettaglio() : ""; }
  const lista = (((DEMO.seduteSvolte || {})[a.id]) || []).slice().sort((x, y) => x.data < y.data ? 1 : -1);
  const dl = v => typeof fmtDataAnno === "function" ? fmtDataAnno(v) : v;
  const cards = lista.map(sv => {
    const d = sv.dati || {};
    let corpo = "";
    if (sv.tipo === "pista") {
      corpo = (d.elementi || []).map(e => {
        const fatti = (e.tempi || []).filter(v => v != null);
        const tstr = fatti.length ? fatti.map(t => Number(t).toFixed(2)).join(" · ") : "—";
        const best = fatti.length ? Math.min(...fatti) : null;
        const col = (best != null && e.target != null) ? (best <= e.target ? "var(--verde)" : "var(--rosso)") : "var(--txt2)";
        return `<div class="riga" style="align-items:baseline"><div style="flex:1;min-width:0"><b>${e.ripetute}×${e.distanza} m</b>${e.percentuale ? ` <span class="et">${e.percentuale}%</span>` : ""}
          <div class="et">tempi ${tstr}${e.target != null ? ` · obiettivo ${Number(e.target).toFixed(2)}` : ""}</div></div>
          ${best != null ? `<b style="color:${col}">${best.toFixed(2)}</b>` : ""}</div>`;
      }).join("");
    } else {
      corpo = (d.esercizi || []).map(x => {
        const fatte = (x.vbt || []).filter(v => v != null);
        const vmed = fatte.length ? (fatte.reduce((s, v) => s + v, 0) / fatte.length) : null;
        return `<div class="riga" style="align-items:baseline"><div style="flex:1;min-width:0"><b>${x.nome}</b> <span class="et">${x.serie || "?"}×${x.rep || "?"}${x.peso ? ` @${x.peso} kg` : ""}</span>
          ${vmed != null ? `<div class="et">VBT ${vmed.toFixed(2)} m/s${x.vbtTarget ? ` · target ${x.vbtTarget}` : ""}</div>` : ""}</div></div>`;
      }).join("");
    }
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3 style="font-size:16px">${dl(sv.data)} · ${sv.tipo === "pista" ? "Pista" : "Palestra"}${sv.giorno ? " · g" + sv.giorno : ""}</h3>
        <span class="et">${sv.durata_min ? sv.durata_min + "′" : ""}${sv.rpe ? " · RPE " + sv.rpe : ""}</span></div>
      ${sv.fastidi ? `<p class="et" style="color:var(--rosso);margin-top:4px">⚠ ha segnalato un fastidio</p>` : ""}
      <div style="margin-top:8px">${corpo || `<span class="et">Nessun dato inserito.</span>`}</div>
    </div>`;
  }).join("");
  return `<button class="indietro" onclick="chiudiSeduteSvolte()">‹ Torna all'atleta</button>
    <div class="card"><h3>Allenamenti svolti · ${a.nome}</h3>
      <p class="et" style="margin-top:2px">Cosa ha davvero fatto, dal più recente${lista.length ? ` · ${lista.length} sedute` : ""}.</p></div>
    ${cards || `<div class="card"><p class="et">Nessun allenamento chiuso ancora da ${a.nome}. Compaiono qui quando l'atleta chiude una seduta.</p></div>`}`;
}

// ---------- monitoraggio: SCREENING (performance + carico) settimana / mesociclo ----------
let screeningState = { atletaRif: "" };
function setScreeningAtleta(id) { screeningState.atletaRif = id; disegna(); window.scrollTo(0, 0); }

function bloccoScreening(atletaId, giorni, titolo) {
  const oggiISO = new Date().toISOString().slice(0, 10);
  const dalISO = new Date(Date.now() - giorni * 86400000).toISOString().slice(0, 10);
  const inWin = d => d && d >= dalISO && d <= oggiISO;
  const pista = (DEMO.pistaLog || []).filter(l => l.atletaId === atletaId && inWin(l.data));
  const pistaPrima = (DEMO.pistaLog || []).filter(l => l.atletaId === atletaId && l.data < dalISO);
  const vbt = (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId && l.vbtEseguita != null && inWin(l.data));
  const vbtPrima = (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId && l.vbtEseguita != null && l.data < dalISO);
  const gare = (DEMO.risultatiGara || []).filter(r => r.atletaId === atletaId && inWin(r.data));

  const sedute = new Set([...pista.map(x => x.data), ...vbt.map(x => x.data)]).size;
  const volume = pista.reduce((s, x) => s + (x.volume || 0), 0);
  const dist = [...new Set(pista.map(x => x.distanza))].sort((a, b) => a - b);
  let mig = 0, peg = 0;
  const righeTempi = dist.map(d => {
    const win = pista.filter(x => x.distanza === d).map(x => x.tempo).filter(t => t > 0);
    const prima = pistaPrima.filter(x => x.distanza === d).map(x => x.tempo).filter(t => t > 0);
    const best = win.length ? Math.min(...win) : null, bestPrima = prima.length ? Math.min(...prima) : null;
    const delta = (best != null && bestPrima != null) ? best - bestPrima : null;
    if (delta != null) { if (delta < 0) mig++; else if (delta > 0) peg++; }
    const col = delta == null ? "var(--txt3)" : delta < 0 ? "var(--verde)" : delta > 0 ? "var(--rosso)" : "var(--txt2)";
    return `<tr><td>${d} m</td><td class="pauto">${best != null ? best.toFixed(2) : "—"}</td><td style="color:${col}">${delta != null ? (delta > 0 ? "+" : "") + delta.toFixed(2) : "—"}</td></tr>`;
  }).join("");
  const vMedia = vbt.length ? vbt.reduce((s, x) => s + x.vbtEseguita, 0) / vbt.length : null;
  const vPrima = vbtPrima.length ? vbtPrima.reduce((s, x) => s + x.vbtEseguita, 0) / vbtPrima.length : null;
  const dVbt = (vMedia != null && vPrima != null) ? vMedia - vPrima : null;
  const m = (DEMO.mon || {})[atletaId] || {};

  const perf = sedute === 0 ? "🕓 nessun dato nel periodo"
    : mig > peg ? "🟢 tempi in miglioramento" : peg > mig ? "🔴 tempi in calo" : "🟡 tempi stabili";
  const caricoTxt = m.acwr ? `ACWR ${m.acwr} · forma ${m.forma || "—"} · prontezza ${m.prontezza || "—"}` : "—";

  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <p class="et" style="margin:0">${titolo}</p><span class="et">ultimi ${giorni} giorni</span></div>
    <div style="display:flex;gap:8px;margin:12px 0 4px">
      ${[["Sedute", sedute], ["Volume pista", volume ? (volume >= 1000 ? (volume / 1000).toFixed(1) + " km" : volume + " m") : "—"], ["VBT media", vMedia != null ? vMedia.toFixed(2) : "—"], ["Gare", gare.length]]
        .map(([l, v]) => `<div style="flex:1;background:var(--card2);border-radius:12px;padding:10px 4px;text-align:center"><p class="et" style="margin:0 0 2px">${l}</p><b style="font-size:16px">${v}</b></div>`).join("")}
    </div>
    ${dist.length ? `<p class="et" style="margin:10px 0 4px">Tempi per distanza (best · variazione vs prima)</p>
      <table class="ptab" style="min-width:0"><thead><tr><th>Distanza</th><th>Best</th><th>Δ</th></tr></thead><tbody>${righeTempi}</tbody></table>` : ""}
    ${gare.length ? `<p class="et" style="margin:10px 0 4px">🏁 Gare nel periodo</p>
      <table class="ptab" style="min-width:0"><thead><tr><th>Data</th><th>Prova</th><th>Tempo</th><th>Pos.</th></tr></thead>
      <tbody>${gare.slice().sort((a, b) => (a.data < b.data ? 1 : -1)).map(g => `<tr><td>${typeof fmtDataAnno === "function" ? fmtDataAnno(g.data) : g.data}</td><td>${g.distanza}${g.gara ? " · " + g.gara : ""}</td><td class="pauto">${g.tempo}</td><td>${g.posizione || "—"}</td></tr>`).join("")}</tbody></table>` : ""}
    <p style="margin-top:12px;font-weight:600">${perf}${dVbt != null ? ` · VBT ${dVbt >= 0 ? "+" : ""}${dVbt.toFixed(2)} m/s` : ""}</p>
    <p class="et" style="margin-top:6px">Carico: <b style="color:${typeof colAcwr === "function" && m.acwr ? colAcwr(m.acwr) : "var(--txt2)"}">${caricoTxt}</b></p>
    ${m.alert && m.alert.length ? `<p class="et" style="margin-top:4px">${m.alert.map(a => a[1]).join(" · ")}</p>` : ""}
  </div>`;
}

function vistaScreening() {
  const atl = DEMO.atleti.find(x => x.id === screeningState.atletaRif);
  return `
  <div class="card"><h3>Screening</h3>
    <p class="et" style="margin-top:2px">Come sta andando l'atleta: tempi e ripetute (performance) + carico e freschezza, sulla settimana e sul mesociclo.</p></div>
  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setScreeningAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${screeningState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
  </div>
  ${atl ? `<p class="sez">Settimana</p>${bloccoScreening(atl.id, 7, "Questa settimana")}
    <p class="sez">Mesociclo</p>${bloccoScreening(atl.id, 28, "Ultime 4 settimane")}`
    : `<div class="card"><p class="et">Scegli un atleta per vedere lo screening.</p></div>`}`;
}
