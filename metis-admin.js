// Multi-società: il SUPER-ADMIN (solo Alessandro) può CURIOSARE le altre società collegate in SOLA LETTURA,
// e TUTTI (atleti e allenatori) possono "Scrivere a Metis". La sicurezza è garantita lato DB:
// is_super_admin(), RLS per società, e le RPC admin_list_societa/admin_snapshot (gate is_super_admin).

// ---------- caricamento extra per il super-admin (elenco società + messaggi) ----------
async function caricaExtraAdmin() {
  if (typeof sb === "undefined" || !sb) return;
  try { const { data } = await sb.rpc("admin_list_societa"); DEMO.adminSocieta = data || []; } catch (e) { DEMO.adminSocieta = []; }
  await caricaMessaggiMetis();
}
async function caricaMessaggiMetis() {
  if (typeof sb === "undefined" || !sb || !(S.utente && S.utente.superAdmin)) return;
  try {
    const { data } = await sb.from("messaggio_metis").select("id,nome,ruolo,societa_nome,testo,letto,creato_il").order("creato_il", { ascending: false });
    DEMO.messaggiMetis = data || [];
  } catch (e) { DEMO.messaggiMetis = []; }
}
function _nMsgMetisNonLetti() { return (DEMO.messaggiMetis || []).filter(m => !m.letto).length; }

// ---------- SCRIVI A METIS (atleti e allenatori) ----------
async function inviaMessaggioMetis(testo) {
  testo = String(testo || "").trim();
  if (!testo) { alert("Scrivi prima un messaggio."); return; }
  if (typeof sb === "undefined" || !sb || !(S.utente && S.utente.id)) { alert("Devi essere connesso per scrivere."); return; }
  try {
    const { error } = await sb.from("messaggio_metis").insert({
      profilo_id: S.utente.id, nome: S.utente.nome || "", ruolo: S.utente.ruolo || "",
      societa_id: S.utente.societaMadre || S.utente.societaId || null, societa_nome: DEMO._societaNomeMia || "", testo
    });
    if (error) { alert("Non è stato possibile inviare: " + (error.message || "riprova")); return; }
    S._metisInviato = true; S._metisBozza = ""; disegna(); window.scrollTo(0, 0);
  } catch (e) { alert("Non è stato possibile inviare: " + ((e && e.message) || "riprova")); }
}
function vistaScriviMetis() {
  const home = (S.utente && S.utente.ruolo === "coach") ? "squadra" : "oggi";
  if (S._metisInviato) {
    return `<div class="card"><h3>✉️ Grazie!</h3>
      <p class="et" style="margin-top:6px">Messaggio inviato ad <b>Alessandro</b>. Ti risponderà appena può. 🙌</p>
      <button class="btn" style="margin-top:10px" onclick="S._metisInviato=false;vai('${home}')">Torna alla home</button></div>`;
  }
  const bozza = (S._metisBozza || "").replace(/</g, "&lt;");
  return `<div class="card"><h3>✉️ Scrivi a Metis</h3>
      <p class="et" style="margin-top:6px">Scrivi direttamente ad <b>Alessandro Senelli</b>: un <b>bug</b> dell'app, una cosa da <b>migliorare</b>, un <b>dubbio</b>… o anche solo un <b>saluto</b> 👋 <span class="et">(in caso di saluto, inviate anche del cibo 🍝😄)</span>.</p></div>
    <div class="card">
      <textarea id="metisTxt" rows="6" placeholder="Scrivi qui il tuo messaggio…" oninput="S._metisBozza=this.value" style="width:100%;box-sizing:border-box;font-family:inherit;font-size:14px;line-height:1.5;padding:10px;border:1px solid var(--line2,#cdd6e4);border-radius:8px;resize:vertical">${bozza}</textarea>
      <button class="btn" style="margin-top:10px" onclick="inviaMessaggioMetis((document.getElementById('metisTxt')||{}).value)">📨 Invia a Metis</button>
    </div>`;
}

// ---------- MESSAGGI RICEVUTI (solo super-admin) ----------
function vistaMessaggiMetis() {
  const msg = DEMO.messaggiMetis || [];
  const fmt = d => { try { return new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return d; } };
  if (!msg.length) return `<div class="card"><h3>📬 Messaggi a Metis</h3><p class="et" style="margin-top:6px">Nessun messaggio, per ora.</p></div>`;
  const rows = msg.map(m => `<div class="card" style="${m.letto ? "" : "border-color:var(--blu)"}">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <b>${(m.nome || "—")}</b><span class="et">${(m.ruolo === "coach" ? "Allenatore" : "Atleta")}${m.societa_nome ? " · " + m.societa_nome : ""} · ${fmt(m.creato_il)}</span></div>
      <p style="margin:8px 0 0;white-space:pre-wrap">${String(m.testo || "").replace(/</g, "&lt;")}</p>
      ${m.letto ? "" : `<button class="btn btn-2" style="width:auto;padding:6px 11px;font-size:12px;margin-top:8px" onclick="segnaMsgLetto('${m.id}')">Segna come letto</button>`}
    </div>`).join("");
  return `<div class="card"><h3>📬 Messaggi a Metis</h3><p class="et" style="margin-top:6px">${msg.length} messaggi${_nMsgMetisNonLetti() ? ` · <b>${_nMsgMetisNonLetti()}</b> da leggere` : ""}.</p></div>${rows}`;
}
async function segnaMsgLetto(id) {
  try { if (sb) await sb.from("messaggio_metis").update({ letto: true }).eq("id", id); } catch (e) { }
  const m = (DEMO.messaggiMetis || []).find(x => x.id === id); if (m) m.letto = true;
  disegna();
}

// ---------- CURIOSA LE SOCIETÀ (solo super-admin, SOLA LETTURA) ----------
function vistaSocietaAdmin() {
  const soc = DEMO.adminSocieta || [], cur = S.curiosando;
  const rows = soc.map(s => {
    const mia = s.id === S.utente.societaMadre, attiva = cur && cur.id === s.id;
    return `<div class="card" style="${attiva ? "border-color:var(--blu)" : ""}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <div><b>${s.nome}</b>${mia ? ' <span class="et">(la tua)</span>' : ""}<div class="et">${s.n_atleti} atleti · ${s.n_coach} allenatori</div></div>
        ${mia
          ? (cur ? `<button class="btn btn-2" style="width:auto;padding:8px 13px" onclick="tornaMiaSocieta()">↩︎ Torna qui</button>` : `<span class="et" style="color:var(--verde)">sei qui</span>`)
          : `<button class="btn" style="width:auto;padding:8px 13px" onclick="curiosaSocieta('${s.id}','${String(s.nome).replace(/'/g, "\\'")}')">👀 Curiosa</button>`}
      </div></div>`;
  }).join("");
  return `<div class="card"><h3>🏛 Società collegate</h3>
      <p class="et" style="margin-top:6px">Solo tu vedi questa sezione. Entra in una società per <b>controllare</b> squadra, allenamenti e programmi — in <b>sola lettura</b> (non tocchi nulla dei loro).</p></div>
    ${cur ? _bannerCuriosa() : ""}
    ${rows || `<p class="muted">Nessuna società collegata.</p>`}`;
}
function _bannerCuriosa() {
  const cur = S.curiosando; if (!cur) return "";
  return `<div class="card" style="border-color:var(--ambra,#e6a83c)">
    <p class="et" style="margin:0;color:var(--ambra,#e6a83c)">👀 <b>Stai curiosando: ${cur.nome}</b> · sola lettura (le modifiche non vengono salvate). <button class="link-indietro" onclick="tornaMiaSocieta()">Torna alla tua società ›</button></p></div>`;
}
async function curiosaSocieta(id, nome) {
  if (typeof sb === "undefined" || !sb || !(S.utente && S.utente.superAdmin)) return;
  try {
    const { data, error } = await sb.rpc("admin_snapshot", { target: id });
    if (error || !data) { alert("Non riesco a caricare questa società: " + ((error && error.message) || "riprova")); return; }
    _popolaSnapshot(data);
    S.curiosando = { id: id, nome: (data.societa && data.societa.nome) || nome };
    S.utente.societaId = id;
    S.vista = "squadra"; S.atletaSel = null; S.seduta = null; S.gruppo = (typeof GRUPPI !== "undefined" && GRUPPI[0]) ? GRUPPI[0][0] : "vel"; S.menu = false;
    disegna(); window.scrollTo(0, 0);
  } catch (e) { alert("Errore: " + ((e && e.message) || "riprova")); }
}
async function tornaMiaSocieta() {
  S.curiosando = null;
  if (S.utente) S.utente.societaId = S.utente.societaMadre;
  DEMO.draftPista = {}; DEMO.draftPal = {}; DEMO.draftPistaAtleta = {}; DEMO.draftPalAtleta = {}; DEMO.seduteGen = [];
  S.vista = "squadra"; S.atletaSel = null; S.seduta = null; S.menu = false;
  if (typeof caricaCustom === "function") { try { caricaCustom(); } catch (e) { } }   // ripristina i TUOI dati locali
  if (typeof caricaDati === "function") { try { await caricaDati(); } catch (e) { } }   // e ricarica dal DB la tua società
  disegna(); window.scrollTo(0, 0);
}
// popola DEMO da una fotografia (admin_snapshot) — SOLA LETTURA
function _popolaSnapshot(snap) {
  snap = snap || {};
  const nuoviMon = {}, nuoviDiari = {};
  DEMO.atleti = (snap.atleti || []).map(a => {
    const pb = (a.pb || []).slice().sort((x, y) => (typeof rankDist === "function" ? rankDist(x.distanza) - rankDist(y.distanza) : 0))
      .map(p => [p.distanza, p.tempo, (typeof fmtDataAnno === "function" ? fmtDataAnno(p.data) : p.data), p.stagione, p.obiettivo, p.id, p.data || "", p.origine || "gara", p.vento]);
    const massimali = (a.massimale || []).map(m => [m.esercizio, m.kg, (typeof fmtDataAnno === "function" ? fmtDataAnno(m.data) : m.data), m.note || "", m.id, m.data || ""]);
    const salti = (a.test || []).map(t => [t.nome, t.valore, t.unita, (typeof fmtDataAnno === "function" ? fmtDataAnno(t.data) : t.data), t.id, t.data || ""]);
    const scheda = { anagrafica: { categoria: a.categoria, anno: a.data_nascita ? new Date(a.data_nascita).getFullYear() : "", nascita: a.data_nascita ? new Date(a.data_nascita).toLocaleDateString("it-IT") : "", gambaStacco: a.gamba_stacco, altezza: a.altezza_cm, peso: a.peso_kg }, pb, massimali, salti };
    nuoviMon[a.id] = (typeof monDefault === "function" ? monDefault() : {});
    nuoviDiari[a.id] = (typeof diarioDefault === "function" ? diarioDefault() : {});
    return { id: a.id, nome: a.nome, disciplina: a.disciplina, specialita: a.specialita, email: a.email || "", haAccesso: !!a.profilo_id, bloccato: !!a.bloccato, dataNascita: a.data_nascita || "", presenzeMese: [0, 0], presenzeStagione: [0, 0], test: salti.slice(0, 3).map(([n, v, u]) => [n, v + " " + u, ""]), pb: pb.map(p => [p[0], p[1]]), massimali: massimali.map(m => [m[0], m[1]]), scheda };
  });
  DEMO.atleti.sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "it", { sensitivity: "base" }));
  DEMO.mon = nuoviMon; DEMO.diariCoach = nuoviDiari;
  DEMO.report = DEMO.report || {}; DEMO.report.daFare = {}; DEMO.report.positivo = null; DEMO.report.settimana = null;
  // programmi (bundle) della società curiosata — sostituisce tutto
  DEMO.pista = {}; DEMO.palestra = {}; DEMO.pistaAtleta = {}; DEMO.palAtleta = {};
  DEMO.vbtLog = []; DEMO.pistaLog = []; DEMO.lanciLog = []; DEMO.testSessioni = []; DEMO.risultatiGara = []; DEMO.overrideGiorni = {}; DEMO.overrideContenuto = {}; DEMO.seduteGen = [];
  DEMO.draftPista = {}; DEMO.draftPal = {}; DEMO.draftPistaAtleta = {}; DEMO.draftPalAtleta = {};
  if (snap.bundle && typeof applicaBundle === "function") { try { applicaBundle(snap.bundle); } catch (e) { } }
  if (typeof _applicaGare === "function") _applicaGare(snap.gare || []);
  DEMO.infortuni = (snap.infortuni || []).map(i => ({ id: i.id, atleta: i.atleta_id, zona: i.zona, lato: i.lato, tipo: i.tipo, gravita: i.gravita, stato: i.stato, dal: i.dal, dataInizio: i.data_inizio || i.dal, dataRientro: i.data_rientro, nota: i.nota }));
  DEMO.diariStorico = {};
  (snap.diari || []).forEach(r => {
    const vc = { data: r.data, sonno_qualita: r.sonno_qualita, stress: r.stress, dolori: r.dolori, energia: r.energia, oreSonno: r.ore_sonno, peso: r.peso, ciclo: r.ciclo, fastidi: r.fastidi, doveFastidi: r.dove_fastidi || "", note: r.note || "" };
    const p = (typeof prontezza === "function") ? prontezza(vc) : null; vc.prontezza = p == null ? null : Math.round(p * 100) / 100;
    (DEMO.diariStorico[r.atleta_id] = DEMO.diariStorico[r.atleta_id] || []).push(vc);
  });
  Object.keys(DEMO.diariStorico).forEach(aid => { DEMO.diariStorico[aid].sort((x, y) => x.data < y.data ? 1 : -1); const ult = DEMO.diariStorico[aid][0]; if (ult && DEMO.mon[aid] && ult.prontezza != null) DEMO.mon[aid].prontezza = String(ult.prontezza); });
  DEMO.seduteSvolte = {};
  (snap.svolte || []).forEach(sv => {
    if (sv.rpe != null) sv.rpe = Number(sv.rpe);
    if (sv.durata_min != null) sv.durata_min = Number(sv.durata_min);
    (DEMO.seduteSvolte[sv.atleta_id] = DEMO.seduteSvolte[sv.atleta_id] || []).push(sv);
    const d = sv.dati || {};
    if (sv.tipo === "pista") {
      (d.elementi || []).forEach(e => {
        if (Array.isArray(e.misure)) { const f = e.misure.filter(v => v != null); DEMO.lanciLog.push({ data: sv.data, atletaId: sv.atleta_id, mezzo: e.mezzo || "", kg: e.kg != null ? e.kg : null, tipo: e.tipo || null, lanci: e.lanci != null ? Number(e.lanci) : null, misura: f.length ? Math.round(Math.max.apply(null, f) * 100) / 100 : null }); return; }
        const fatti = (e.tempi || []).filter(v => v != null); if (!fatti.length) return;
        const tmed = fatti.reduce((a, b) => a + b, 0) / fatti.length;
        DEMO.pistaLog.push({ data: sv.data, atletaId: sv.atleta_id, distanza: Number(e.distanza), tempo: Math.round(tmed * 100) / 100, volume: (e.ripetute || 0) * (e.distanza || 0), velocita: tmed ? Math.round(e.distanza / tmed * 100) / 100 : null });
      });
    } else {
      (d.esercizi || []).forEach(x => { const fatte = (x.vbt || []).filter(v => v != null); const vmed = fatte.length ? fatte.reduce((a, b) => a + b, 0) / fatte.length : null; const pw = (x.pesoFatto != null ? x.pesoFatto : x.peso); DEMO.vbtLog.push({ data: sv.data, atletaId: sv.atleta_id, esercizio: x.nome, peso: pw != null ? pw : null, carico: pw != null ? pw : null, serie: x.serie, rep: x.rep, volume: (pw && x.serie && x.rep) ? x.serie * x.rep * pw : null, rpe: sv.rpe, vbtEseguita: vmed != null ? Math.round(vmed * 100) / 100 : null, vbtTarget: x.vbtTarget != null ? x.vbtTarget : null }); });
    }
  });
  if (typeof ricalcolaCarico === "function") { try { ricalcolaCarico(snap.svolte || []); } catch (e) { } }
  try {
    const isoL = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const oggiStr = (typeof oggiISO === "function") ? oggiISO() : isoL(new Date());
    const meseStart = oggiStr.slice(0, 8) + "01";
    (DEMO.atleti || []).forEach(a => {
      const svA = (DEMO.seduteSvolte[a.id] || []);
      const doneM = svA.filter(s => s.tipo !== "extra" && s.data >= meseStart && s.data <= oggiStr).length;
      a.presenzeMese = [doneM, doneM];
      if (DEMO.mon[a.id] && typeof _settimanaMonReale === "function") { const wk = _settimanaMonReale(a); DEMO.mon[a.id].settimana = wk.settimana; DEMO.mon[a.id].done = wk.done; DEMO.mon[a.id].extra = wk.extra; }
    });
  } catch (e) { }
}
