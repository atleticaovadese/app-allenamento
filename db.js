// Collegamento al database Supabase: login reale e caricamento dati.
// Strategia: al login riempio l'oggetto DEMO con i dati veri (stessa forma),
// così tutte le viste restano uguali. Le parti non ancora nel DB (sedute,
// programma, monitoraggio calcolato) restano per ora sui dati demo.

const sb = (typeof supabase !== "undefined" && typeof SUPA !== "undefined")
  ? supabase.createClient(SUPA.url, SUPA.anon)
  : null;

// ---- snapshot dei dati demo di monitoraggio (per riagganciarli agli atleti veri per nome) ----
const _MON_DEMO   = { "Leonardo Zetti": DEMO.mon.at1, "Marco Bianchi": DEMO.mon.at2, "Sara Moretti": DEMO.mon.at3 };
const _DIARI_DEMO = { "Leonardo Zetti": DEMO.diariCoach.at1, "Marco Bianchi": DEMO.diariCoach.at2, "Sara Moretti": DEMO.diariCoach.at3 };
const _DAFARE_DEMO = { "Marco Bianchi": DEMO.report.daFare.at2, "Sara Moretti": DEMO.report.daFare.at3 };
const _PRES_DEMO = {};
DEMO.atleti.forEach(a => { _PRES_DEMO[a.nome] = { mese: a.presenzeMese, stag: a.presenzeStagione }; });

const MESI_IT = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const ORD_DIST = ["30 m lanciato","30 m blocchi","60 m","80 m","100 m","120 m","150 m","200 m","300 m","400 m"];
function fmtData(iso) { if (!iso) return ""; const d = new Date(iso + "T00:00:00"); return d.getDate() + " " + MESI_IT[d.getMonth()]; }
function fmtDataAnno(iso) { if (!iso) return ""; const d = new Date(iso + "T00:00:00"); return d.getDate() + " " + MESI_IT[d.getMonth()] + " " + d.getFullYear(); }
function rankDist(d) { const i = ORD_DIST.indexOf(d); return i < 0 ? 99 : i; }
function settimaneA(iso) { if (!iso) return 0; const d = new Date(iso + "T00:00:00"); return Math.max(0, Math.round((d - new Date()) / (7 * 86400000))); }
function monDefault() { return { stato: "v", acwr: "—", forma: "—", prontezza: "—", aderenza: 0, ultimo: "—", fv: "—", alert: [], settimana: ["","","","","","",""], done: [0,0,0,0,0,0,0] }; }
function diarioDefault() { return { compilato: false, ultimo: "—", prontezza: "—", sonno: null, nota: "" }; }

// ---------- login ----------
function mostraErroreLogin(msg) {
  const e = document.getElementById("loginErr");
  if (e) { e.textContent = msg; e.style.display = "block"; }
}

async function accedi(email, password) {
  if (!sb) { mostraErroreLogin("Collegamento al database non disponibile. Usa l'anteprima demo."); return; }
  if (!email || !password) { mostraErroreLogin("Scrivi email e password."); return; }
  mostraErroreLogin(""); const e = document.getElementById("loginErr"); if (e) e.style.display = "none";
  const btn = document.querySelector(".login .btn"); if (btn) { btn.textContent = "Accesso in corso…"; btn.disabled = true; }
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) {
    if (btn) { btn.textContent = "Entra"; btn.disabled = false; }
    const m = (error.message || "").toLowerCase();
    if (m.includes("not confirmed"))
      mostraErroreLogin("Utente non confermato. In Supabase → Authentication → Users, ricrealo con 'Auto Confirm User' spuntato.");
    else
      mostraErroreLogin("Email o password non corretti. Controlla la password, oppure reimpostala in Supabase.");
    return;
  }
  await caricaDati();
  disegna();
}

async function disconnetti() { if (sb) { try { await sb.auth.signOut(); } catch (e) {} } }

// ---------- caricamento dati veri nel DEMO ----------
async function caricaDati() {
  if (!sb) return;
  const { data: ures } = await sb.auth.getUser();
  const user = ures && ures.user;
  if (!user) return;

  // profilo dell'utente
  const { data: prof } = await sb.from("profilo").select("ruolo,societa_id,nome").eq("id", user.id).single();
  if (!prof) return;
  S.utente = { ruolo: prof.ruolo, nome: prof.nome, societaId: prof.societa_id, email: user.email };

  // atleti + schede
  const { data: atl } = await sb.from("atleta")
    .select("id,nome,disciplina,specialita,categoria,data_nascita,gamba_stacco,altezza_cm,peso_kg,pb(id,distanza,tempo,data,stagione,obiettivo),massimale(id,esercizio,kg,data,note),test(id,nome,valore,unita,data)")
    .order("creato_il");

  const nuoviMon = {}, nuoviDiari = {}, nuovaDaFare = {};
  DEMO.atleti = (atl || []).map(a => {
    const pres = _PRES_DEMO[a.nome] || { mese: [0, 0], stag: [0, 0] };
    const pb = (a.pb || []).slice().sort((x, y) => rankDist(x.distanza) - rankDist(y.distanza))
      .map(p => [p.distanza, p.tempo, fmtDataAnno(p.data), p.stagione, p.obiettivo, p.id, p.data || ""]);
    const massimali = (a.massimale || []).map(m => [m.esercizio, m.kg, fmtDataAnno(m.data), m.note || "", m.id, m.data || ""]);
    const salti = (a.test || []).map(t => [t.nome, t.valore, t.unita, fmtDataAnno(t.data), t.id, t.data || ""]);
    const scheda = {
      anagrafica: {
        categoria: a.categoria, anno: a.data_nascita ? new Date(a.data_nascita).getFullYear() : "",
        nascita: a.data_nascita ? new Date(a.data_nascita).toLocaleDateString("it-IT") : "",
        gambaStacco: a.gamba_stacco, altezza: a.altezza_cm, peso: a.peso_kg
      }, pb, massimali, salti
    };
    nuoviMon[a.id] = _MON_DEMO[a.nome] || monDefault();
    nuoviDiari[a.id] = _DIARI_DEMO[a.nome] || diarioDefault();
    if (_DAFARE_DEMO[a.nome]) nuovaDaFare[a.id] = _DAFARE_DEMO[a.nome];
    return {
      id: a.id, nome: a.nome, disciplina: a.disciplina, specialita: a.specialita,
      presenzeMese: pres.mese, presenzeStagione: pres.stag,
      test: salti.slice(0, 3).map(([n, v, u]) => [n, v + " " + u, ""]),
      pb: pb.map(p => [p[0], p[1]]), massimali: massimali.map(m => [m[0], m[1]]),
      scheda
    };
  });
  DEMO.mon = nuoviMon;
  DEMO.diariCoach = nuoviDiari;
  DEMO.report.daFare = nuovaDaFare;

  // ri-aggancia per NOME i dati VBT demo (at1/at2/at3) ai veri atleti (uuid), così si vedono al login reale
  const _oldToName = { at1: "Leonardo Zetti", at2: "Marco Bianchi", at3: "Sara Moretti" };
  const _idByNome = {}; DEMO.atleti.forEach(a => { _idByNome[a.nome] = a.id; });
  DEMO.vbtLog = (DEMO.vbtLog || []).map(l => {
    const nm = _oldToName[l.atletaId];
    return (nm && _idByNome[nm]) ? { ...l, atletaId: _idByNome[nm] } : l;
  });
  DEMO.pistaLog = (DEMO.pistaLog || []).map(l => {
    const nm = _oldToName[l.atletaId];
    return (nm && _idByNome[nm]) ? { ...l, atletaId: _idByNome[nm] } : l;
  });
  // dati esempio Drop Jump/RSI: aggancia Leonardo (at1) al vero uuid così è già selezionato al login reale
  if (typeof djState !== "undefined" && _oldToName[djState.atletaRif] && _idByNome[_oldToName[djState.atletaRif]]) {
    djState.atletaRif = _idByNome[_oldToName[djState.atletaRif]];
  }

  // se ha fatto login un atleta, aggancio il suo atletaId
  if (prof.ruolo === "atleta") {
    const mio = (atl || []).find(a => a.profilo_id === user.id);
    if (mio) S.utente.atletaId = mio.id;
    else if (DEMO.atleti[0]) S.utente.atletaId = DEMO.atleti[0].id;
  }

  // infortuni aperti
  const { data: inf } = await sb.from("infortunio").select("atleta_id,zona,stato,dal,nota").eq("aperto", true);
  DEMO.infortuni = (inf || []).map(i => ({ atleta: i.atleta_id, zona: i.zona, stato: i.stato, dal: i.dal, nota: i.nota }));

  // gare (prossima + successive)
  const { data: gare } = await sb.from("gara").select("data,luogo,gara,obiettivo").order("data");
  if (gare && gare.length) {
    const g0 = gare[0];
    DEMO.prossimaGara = { luogo: g0.luogo, gara: g0.gara, obiettivo: g0.obiettivo, traSettimane: settimaneA(g0.data) };
    DEMO.gareProssime = gare.slice(1).map(g => ({ data: fmtData(g.data), luogo: g.luogo, gara: g.gara, obiettivo: g.obiettivo }));
    DEMO.gareRaw = gare.map(g => ({ data: g.data, luogo: g.luogo, gara: g.gara, obiettivo: g.obiettivo }));
  }
}

// ---------- scrittura: nuovo atleta ----------
function haDB() { return !!(sb && S.utente && S.utente.societaId); }

function aggiungiAtletaLocale(a) {
  const anag = {
    categoria: a.categoria, anno: a.data_nascita ? new Date(a.data_nascita).getFullYear() : "",
    nascita: a.data_nascita ? new Date(a.data_nascita).toLocaleDateString("it-IT") : "",
    gambaStacco: a.gamba_stacco, altezza: a.altezza_cm, peso: a.peso_kg
  };
  DEMO.atleti.push({
    id: a.id, nome: a.nome, disciplina: a.disciplina, specialita: a.specialita,
    presenzeMese: [0, 0], presenzeStagione: [0, 0], test: [], pb: [], massimali: [],
    scheda: { anagrafica: anag, pb: [], massimali: [], salti: [] }
  });
  DEMO.mon[a.id] = monDefault();
  DEMO.diariCoach[a.id] = diarioDefault();
}

async function creaAtleta(d) {
  if (haDB()) {
    const { data, error } = await sb.from("atleta").insert({
      societa_id: S.utente.societaId, nome: d.nome, disciplina: d.disciplina, specialita: d.specialita || null,
      categoria: d.categoria || null, data_nascita: d.data_nascita || null, gamba_stacco: d.gamba_stacco || null,
      altezza_cm: d.altezza_cm || null, peso_kg: d.peso_kg || null
    }).select().single();
    if (error) { alert("Errore nel salvataggio: " + error.message); return false; }
    aggiungiAtletaLocale(data);
  } else {
    aggiungiAtletaLocale({ id: "loc" + Date.now(), ...d });
  }
  return true;
}

// ---------- scrittura: voci della scheda (PB, massimali, test) ----------
function _atl(id) { return DEMO.atleti.find(a => a.id === id); }

async function creaPB(atletaId, d) {
  let id = "loc" + Date.now();
  if (haDB()) {
    const { data, error } = await sb.from("pb").insert({ atleta_id: atletaId, distanza: d.distanza, tempo: d.tempo, data: d.data || null, stagione: d.stagione, obiettivo: d.obiettivo }).select("id").single();
    if (error) { alert("Errore nel salvataggio: " + error.message); return false; }
    id = data.id;
  }
  const a = _atl(atletaId);
  if (a) {
    a.scheda.pb.push([d.distanza, d.tempo, fmtDataAnno(d.data), d.stagione, d.obiettivo, id, d.data || ""]);
    a.scheda.pb.sort((x, y) => rankDist(x[0]) - rankDist(y[0]));
    a.pb.push([d.distanza, d.tempo]);
  }
  return true;
}

async function creaMassimale(atletaId, d) {
  let id = "loc" + Date.now();
  if (haDB()) {
    const { data, error } = await sb.from("massimale").insert({ atleta_id: atletaId, esercizio: d.esercizio, kg: d.kg, data: d.data || null, note: d.note || null }).select("id").single();
    if (error) { alert("Errore nel salvataggio: " + error.message); return false; }
    id = data.id;
  }
  const a = _atl(atletaId);
  if (a) { a.scheda.massimali.push([d.esercizio, d.kg, fmtDataAnno(d.data), d.note || "", id, d.data || ""]); a.massimali.push([d.esercizio, d.kg]); }
  return true;
}

async function creaTest(atletaId, d) {
  let id = "loc" + Date.now();
  if (haDB()) {
    const { data, error } = await sb.from("test").insert({ atleta_id: atletaId, nome: d.nome, valore: d.valore, unita: d.unita || null, data: d.data || null }).select("id").single();
    if (error) { alert("Errore nel salvataggio: " + error.message); return false; }
    id = data.id;
  }
  const a = _atl(atletaId);
  if (a) a.scheda.salti.push([d.nome, d.valore, d.unita || "", fmtDataAnno(d.data), id, d.data || ""]);
  return true;
}

async function eliminaVoce(tabella, atletaId, id, arrKey, idx) {
  if (haDB() && id && !String(id).startsWith("loc")) {
    const { error } = await sb.from(tabella).delete().eq("id", id);
    if (error) { alert("Errore: " + error.message); return; }
  }
  const a = _atl(atletaId);
  if (a && a.scheda[arrKey]) a.scheda[arrKey].splice(idx, 1);
  disegna();
}

// ---------- avvio: riprende la sessione se già loggato ----------
async function avvioApp() {
  try {
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data && data.session) { await caricaDati(); }
      else if (typeof ripristina === "function") ripristina();
    } else if (typeof ripristina === "function") ripristina();
  } catch (e) { console.warn("avvio:", e); if (typeof ripristina === "function") ripristina(); }
  disegna();
}
