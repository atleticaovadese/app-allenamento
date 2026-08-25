// Collegamento al database Supabase: login reale e caricamento dati.
// Strategia: al login riempio l'oggetto DEMO con i dati veri (stessa forma),
// così tutte le viste restano uguali. Le parti non ancora nel DB (sedute,
// programma, monitoraggio calcolato) restano per ora sui dati demo.

const sb = (typeof supabase !== "undefined" && typeof SUPA !== "undefined")
  ? supabase.createClient(SUPA.url, SUPA.anon)
  : null;

// Nessun dato demo agganciato per nome: gli atleti veri partono PULITI (mon/diario/presenze
// arrivano solo dai dati reali del DB). Evita che un vero "Leonardo Zetti" erediti dati d'esempio.
const _MON_DEMO = {}, _DIARI_DEMO = {}, _DAFARE_DEMO = {}, _PRES_DEMO = {};

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
  try { await sb.rpc("collega_atleta"); } catch (e) { /* collega l'atleta al primo accesso se ha l'email impostata dal coach */ }
  await caricaDati();
  disegna();
}

// registrazione atleta: si iscrive con l'email che il coach ha messo nella sua scheda, poi si collega da solo
async function registraAtleta(email, password) {
  if (!sb) { mostraErroreLogin("Collegamento al database non disponibile."); return; }
  if (!email || !password) { mostraErroreLogin("Scrivi email e password."); return; }
  if (password.length < 6) { mostraErroreLogin("La password deve avere almeno 6 caratteri."); return; }
  mostraErroreLogin(""); const e = document.getElementById("loginErr"); if (e) e.style.display = "none";
  const btn = document.querySelector(".login .btn"); if (btn) { btn.textContent = "Registrazione…"; btn.disabled = true; }
  const { data, error } = await sb.auth.signUp({ email: email.trim().toLowerCase(), password });
  if (error) {
    if (btn) { btn.textContent = "Registrati"; btn.disabled = false; }
    const m = (error.message || "").toLowerCase();
    mostraErroreLogin(m.includes("already") ? "Email già registrata: usa «Entra»." : "Registrazione non riuscita: " + error.message);
    return;
  }
  if (data && data.session) {                 // conferma email disattivata → sei già dentro
    try { await sb.rpc("collega_atleta"); } catch (e) {}
    await caricaDati(); disegna();
  } else {                                     // conferma email attiva → serve il link via email
    if (btn) { btn.textContent = "Registrati"; btn.disabled = false; }
    mostraErroreLogin("Ti abbiamo inviato un'email di conferma. Aprila, conferma l'account, poi torna qui e fai «Entra».");
  }
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
    .select("id,nome,disciplina,specialita,email,profilo_id,bloccato,categoria,data_nascita,gamba_stacco,altezza_cm,peso_kg,pb(id,distanza,tempo,data,stagione,obiettivo,origine,vento),massimale(id,esercizio,kg,data,note),test(id,nome,valore,unita,data)")
    .order("creato_il");

  const nuoviMon = {}, nuoviDiari = {}, nuovaDaFare = {};
  DEMO.atleti = (atl || []).map(a => {
    const pres = _PRES_DEMO[a.nome] || { mese: [0, 0], stag: [0, 0] };
    const pb = (a.pb || []).slice().sort((x, y) => rankDist(x.distanza) - rankDist(y.distanza))
      .map(p => [p.distanza, p.tempo, fmtDataAnno(p.data), p.stagione, p.obiettivo, p.id, p.data || "", p.origine || "gara", p.vento]);
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
      email: a.email || "", haAccesso: !!a.profilo_id, bloccato: !!a.bloccato, dataNascita: a.data_nascita || "",
      presenzeMese: pres.mese, presenzeStagione: pres.stag,
      test: salti.slice(0, 3).map(([n, v, u]) => [n, v + " " + u, ""]),
      pb: pb.map(p => [p[0], p[1]]), massimali: massimali.map(m => [m[0], m[1]]),
      scheda
    };
  });
  DEMO.mon = nuoviMon;
  DEMO.diariCoach = nuoviDiari;
  DEMO.report.daFare = nuovaDaFare;
  DEMO.report.positivo = null;   // niente riassunto squadra demo (Leonardo Z./Marco B.): esce dai dati reali
  DEMO.report.settimana = null;

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
  // idem per i test di prevenzione (asimmetrie)
  if (typeof prevState !== "undefined" && _oldToName[prevState.atletaRif] && _idByNome[_oldToName[prevState.atletaRif]]) {
    prevState.atletaRif = _idByNome[_oldToName[prevState.atletaRif]];
  }
  // sessioni di test complete salvate (snapshot): aggancia al vero uuid
  DEMO.testSessioni = (DEMO.testSessioni || []).map(s => {
    const nm = _oldToName[s.atletaId];
    return (nm && _idByNome[nm]) ? { ...s, atletaId: _idByNome[nm] } : s;
  });
  DEMO.risultatiGara = (DEMO.risultatiGara || []).map(s => {
    const nm = _oldToName[s.atletaId];
    return (nm && _idByNome[nm]) ? { ...s, atletaId: _idByNome[nm] } : s;
  });

  // se ha fatto login un atleta, aggancio il suo atletaId
  if (prof.ruolo === "atleta") {
    const mio = (atl || []).find(a => a.profilo_id === user.id);
    if (mio) S.utente.atletaId = mio.id;
    else if (DEMO.atleti[0]) S.utente.atletaId = DEMO.atleti[0].id;
    // primo accesso / profilo incompleto → avvia l'onboarding: apri subito "I miei dati"
    const a = DEMO.atleti.find(x => x.id === S.utente.atletaId);
    if (a && profiloIncompleto(a) && typeof apriModificaDati === "function") { S.onboarding = "dati"; apriModificaDati(a.id); }
  } else if (prof.ruolo === "coach") {
    // primo accesso di un allenatore/tecnico su questo dispositivo → tutorial allenatore
    try { if (!localStorage.getItem("metis_tut_coach")) S.onboarding = "tour"; } catch (e) { }
  }

  // infortuni aperti
  const { data: inf } = await sb.from("infortunio").select("id,atleta_id,zona,lato,tipo,gravita,stato,dal,data_inizio,data_rientro,nota").eq("aperto", true);
  DEMO.infortuni = (inf || []).map(i => ({ id: i.id, atleta: i.atleta_id, zona: i.zona, lato: i.lato, tipo: i.tipo, gravita: i.gravita, stato: i.stato, dal: i.dal, dataInizio: i.data_inizio || i.dal, dataRientro: i.data_rientro, nota: i.nota }));

  // gare (prossima + successive) dal calendario
  const { data: gare } = await sb.from("gara").select("id,data,luogo,gara,obiettivo,gruppo").order("data");
  _applicaGare(gare || []);

  // diari (storico giorno per giorno): coach vede la società, atleta vede i propri (RLS). Ultimi ~60 giorni.
  try {
    const dd = new Date(Date.now() - 60 * 86400000);
    const dalISO = dd.getFullYear() + "-" + String(dd.getMonth() + 1).padStart(2, "0") + "-" + String(dd.getDate()).padStart(2, "0");
    const { data: diari } = await sb.from("diario").select("atleta_id,data,ore_sonno,sonno_qualita,stress,dolori,energia,peso,ciclo,fastidi,dove_fastidi,note").gte("data", dalISO).order("data", { ascending: false });
    DEMO.diariStorico = {};
    (diari || []).forEach(r => {
      const vc = { data: r.data, sonno_qualita: r.sonno_qualita, stress: r.stress, dolori: r.dolori, energia: r.energia, oreSonno: r.ore_sonno, peso: r.peso, ciclo: r.ciclo, fastidi: r.fastidi, doveFastidi: r.dove_fastidi || "", note: r.note || "" };
      const p = (typeof prontezza === "function") ? prontezza(vc) : null;
      vc.prontezza = p == null ? null : Math.round(p * 100) / 100;
      (DEMO.diariStorico[r.atleta_id] = DEMO.diariStorico[r.atleta_id] || []).push(vc);
    });
    Object.keys(DEMO.diariStorico).forEach(aid => {
      const ult = DEMO.diariStorico[aid][0];
      DEMO.diariCoach[aid] = { compilato: true, ultimo: (typeof fmtDataAnno === "function" ? fmtDataAnno(ult.data) : ult.data), prontezza: ult.prontezza != null ? String(ult.prontezza) : "—", sonno: ult.oreSonno, nota: ult.note };
      if (ult.prontezza != null && DEMO.mon[aid]) DEMO.mon[aid].prontezza = String(ult.prontezza);   // prontezza reale nel monitoraggio
    });
    if (prof.ruolo === "atleta" && S.utente.atletaId) {
      const oggiStr = (typeof oggiISO === "function") ? oggiISO() : new Date().toISOString().slice(0, 10);
      const og = (DEMO.diariStorico[S.utente.atletaId] || []).find(x => x.data === oggiStr);
      if (og) Object.assign(DEMO.diarioOggi, { oreSonno: og.oreSonno, sonno_qualita: og.sonno_qualita, stress: og.stress, dolori: og.dolori, energia: og.energia, peso: og.peso, ciclo: og.ciclo, fastidi: og.fastidi, doveFastidi: og.doveFastidi, note: og.note, salvato: true });
    }
  } catch (e) { /* tabella diario assente o offline: si usa il locale */ }

  // login reale: parto PULITO dai dati/programmi DEMO (Leonardo & co.), poi carico solo ciò che è salvato nel DB
  DEMO.vbtLog = []; DEMO.pistaLog = []; DEMO.testSessioni = []; DEMO.risultatiGara = []; DEMO.overrideGiorni = {}; DEMO.overrideContenuto = {};
  DEMO.pista = {}; DEMO.palestra = {};   // programmi per-gruppo: creati vuoti su richiesta da pistaDi/palDi(gruppo)

  // programmi & dati custom salvati nel DB (sovrascrivono demo/locale se presenti)
  await caricaDatiDB();

  // TAPPA 4 — sedute svolte: pistaLog/vbtLog + carico + storico per la vista + presenze/aderenza reali
  try {
    await _codaFlush();   // reinvia le sedute chiuse offline prima di rileggere (così rientrano nel select)
    const isoL = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const sv0 = new Date(Date.now() - 180 * 86400000);
    const { data: svolteDb } = await sb.from("seduta_svolta").select("atleta_id,data,tipo,giorno,durata_min,rpe,fastidi,dati").eq("chiusa", true).gte("data", isoL(sv0)).order("data", { ascending: false });
    // + le sedute ancora in coda (non sincronizzate): l'atleta le vede lo stesso come "svolte"
    const pend = _codaLeggi().map(p => ({ atleta_id: p.atleta_id, data: p.data, tipo: p.tipo, giorno: p.giorno, durata_min: p.durata_min, rpe: p.rpe, fastidi: p.fastidi, dati: p.dati, _pending: true }));
    const svolte = (svolteDb || []).concat(pend.filter(p => !(svolteDb || []).some(x => x.atleta_id === p.atleta_id && x.data === p.data && x.tipo === p.tipo && (x.giorno == null || x.giorno === p.giorno))));
    DEMO.pistaLog = []; DEMO.vbtLog = []; DEMO.lanciLog = []; DEMO.seduteSvolte = {};
    (svolte || []).forEach(sv => {
      (DEMO.seduteSvolte[sv.atleta_id] = DEMO.seduteSvolte[sv.atleta_id] || []).push(sv);
      const d = sv.dati || {};
      if (sv.tipo === "pista") {
        (d.elementi || []).forEach(e => {
          if (Array.isArray(e.misure)) {   // elemento LANCI: ricostruisco lanciLog (niente doppioni alla ri-chiusura)
            const f = e.misure.filter(v => v != null);
            DEMO.lanciLog.push({ data: sv.data, atletaId: sv.atleta_id, mezzo: e.mezzo || "", kg: e.kg != null ? e.kg : null, tipo: e.tipo || null, lanci: e.lanci != null ? Number(e.lanci) : null, misura: f.length ? Math.round(Math.max.apply(null, f) * 100) / 100 : null });
            return;
          }
          const fatti = (e.tempi || []).filter(v => v != null);
          if (!fatti.length) return;
          const tmed = fatti.reduce((a, b) => a + b, 0) / fatti.length;
          DEMO.pistaLog.push({ data: sv.data, atletaId: sv.atleta_id, distanza: Number(e.distanza), tempo: Math.round(tmed * 100) / 100, volume: (e.ripetute || 0) * (e.distanza || 0), velocita: tmed ? Math.round(e.distanza / tmed * 100) / 100 : null });
        });
      } else {
        (d.esercizi || []).forEach(x => {
          const fatte = (x.vbt || []).filter(v => v != null);
          const vmed = fatte.length ? fatte.reduce((a, b) => a + b, 0) / fatte.length : null;
          const pw = (x.pesoFatto != null ? x.pesoFatto : x.peso);   // peso reale usato dall'atleta, se segnato
          DEMO.vbtLog.push({ data: sv.data, atletaId: sv.atleta_id, esercizio: x.nome, peso: pw != null ? pw : null, carico: pw != null ? pw : null, serie: x.serie, rep: x.rep, volume: (pw && x.serie && x.rep) ? x.serie * x.rep * pw : null, rpe: sv.rpe, vbtEseguita: vmed != null ? Math.round(vmed * 100) / 100 : null, vbtTarget: x.vbtTarget != null ? x.vbtTarget : null });
        });
      }
    });
    if (typeof ricalcolaCarico === "function") ricalcolaCarico(svolte || []);

    // presenze / aderenza reali: fatte = seduta_svolta, programmate = dal programma (con override)
    const oggiStr = (typeof oggiISO === "function") ? oggiISO() : isoL(new Date());
    const meseStart = oggiStr.slice(0, 8) + "01";
    const _n = new Date();
    const stagStart = isoL(_n.getMonth() >= 8 ? new Date(_n.getFullYear(), 8, 1) : new Date(_n.getFullYear() - 1, 8, 1));
    let stagRows = [];
    try { const { data } = await sb.from("seduta_svolta").select("atleta_id,data").eq("chiusa", true).gte("data", stagStart); stagRows = data || []; } catch (e) { /* ignora */ }
    (DEMO.atleti || []).forEach(a => {
      const doneM = (svolte || []).filter(s => s.atleta_id === a.id && s.data >= meseStart && s.data <= oggiStr).length;
      const doneS = stagRows.filter(s => s.atleta_id === a.id && s.data <= oggiStr).length;
      const progM = (typeof contaProgrammate === "function") ? contaProgrammate(a, meseStart, oggiStr) : 0;
      const progS = (typeof contaProgrammate === "function") ? contaProgrammate(a, stagStart, oggiStr) : 0;
      a.presenzeMese = [doneM, Math.max(progM, doneM)];
      a.presenzeStagione = [doneS, Math.max(progS, doneS)];
      if (DEMO.mon[a.id]) DEMO.mon[a.id].aderenza = progS > 0 ? Math.min(100, Math.round(doneS / progS * 100)) : (doneS > 0 ? 100 : 0);
      // barra "ultima settimana" (scheda atleta) + calendario squadra: dai dati REALI (programma + svolte)
      if (DEMO.mon[a.id]) { const wk = _settimanaMonReale(a); DEMO.mon[a.id].settimana = wk.settimana; DEMO.mon[a.id].done = wk.done; }
    });
  } catch (e) { /* tabella seduta_svolta assente o offline */ }
}
// settimana corrente (lun→dom) di un atleta: per ogni giorno il tipo di seduta programmata (o gara) + se è stata svolta.
function _settimanaMonReale(a) {
  const sett = ["", "", "", "", "", "", ""], done = [0, 0, 0, 0, 0, 0, 0];
  const isoL = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const svolte = (DEMO.seduteSvolte && DEMO.seduteSvolte[a.id]) || [];
  const gare = (typeof gareGruppo === "function" && typeof gruppoDi === "function") ? gareGruppo(gruppoDi(a)) : (DEMO.gareRaw || []);
  for (let i = 0; i < 7; i++) {
    const iso = isoL(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    const svGiorno = svolte.filter(sv => sv.data === iso);
    done[i] = svGiorno.length ? 1 : 0;
    let tipo = "";
    if (typeof seduteDelGiorno === "function") {
      try { const sd = seduteDelGiorno(iso, false, a); tipo = sd.some(x => x.tipo === "pista") ? "pista" : sd.some(x => x.tipo === "palestra") ? "palestra" : ""; } catch (e) { /* ignora */ }
    }
    if (!tipo && svGiorno.length) tipo = svGiorno.some(x => x.tipo === "palestra") ? "palestra" : "pista";  // svolto ma non programmato
    sett[i] = (gare || []).some(g => g.data === iso) ? "gara" : tipo;
  }
  return { settimana: sett, done };
}

// ---------- scrittura: nuovo atleta ----------
function haDB() { return !!(sb && S.utente && S.utente.societaId); }

// profilo da completare al primo accesso: manca specialità, nascita, altezza o peso
function profiloIncompleto(a) {
  const an = (a && a.scheda && a.scheda.anagrafica) || {};
  return !a || !a.specialita || !a.dataNascita || !an.altezza || !an.peso;
}

// ---------- programmi & dati custom nel DB (JSON per società) ----------
let _datiDBTimer = null;
function salvaDatiDB() {
  if (!haDB() || typeof bundleCustom !== "function") return;
  clearTimeout(_datiDBTimer);
  _datiDBTimer = setTimeout(async () => {
    try {
      await sb.from("societa_dati").upsert({ societa_id: S.utente.societaId, dati: bundleCustom(), updated_at: new Date().toISOString() });
    } catch (e) { /* offline: resta salvato in locale, si sincronizza al prossimo salvataggio */ }
  }, 1500);
}
async function caricaDatiDB() {
  if (!haDB() || typeof applicaBundle !== "function") return;
  try {
    const { data } = await sb.from("societa_dati").select("dati").eq("societa_id", S.utente.societaId).maybeSingle();
    if (data && data.dati) applicaBundle(data.dati);
  } catch (e) { /* nessun dato nel DB: si usa demo/locale */ }
}

// diario di oggi dell'atleta → DB (upsert per atleta+data). Solo l'atleta scrive il proprio (RLS).
async function salvaDiarioDB(dataISO, d) {
  if (!haDB()) return;
  const aid = S.utente && S.utente.atletaId;
  if (!aid) return;
  if (atletaBloccato(aid)) return;
  await sb.from("diario").upsert({
    atleta_id: aid, data: dataISO,
    ore_sonno: d.oreSonno, sonno_qualita: d.sonno_qualita, stress: d.stress, dolori: d.dolori, energia: d.energia,
    peso: d.peso, ciclo: !!d.ciclo, fastidi: !!d.fastidi, dove_fastidi: d.doveFastidi || null, note: d.note || null
  }, { onConflict: "atleta_id,data" });
}

// ---------- CODA OFFLINE delle sedute svolte (localStorage): se il salvataggio nel DB fallisce
// (niente rete), la seduta resta in coda e viene reinviata da sola alla riconnessione / al prossimo login. ----------
const _CODA_KEY = "metis_coda_svolte";
function _codaLeggi() { try { return JSON.parse(localStorage.getItem(_CODA_KEY) || "[]"); } catch (e) { return []; } }
function _codaScrivi(arr) { try { localStorage.setItem(_CODA_KEY, JSON.stringify(arr)); } catch (e) { /* storage pieno */ } }
function _codaAggiungi(p) {
  const arr = _codaLeggi();
  const i = arr.findIndex(x => x.atleta_id === p.atleta_id && x.chiave === p.chiave);
  if (i >= 0) arr[i] = p; else arr.push(p);   // dedup: una sola voce per atleta+seduta (l'ultima vince)
  _codaScrivi(arr);
}
function codaSvoltePendenti() { return _codaLeggi().length; }
// alla riconnessione, reinvia da sola le sedute in coda e aggiorna la schermata
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("online", function () { _codaFlush().then(function () { if (typeof disegna === "function") disegna(); }); });
}
// prova a reinviare tutte le sedute in coda; toglie dalla coda solo quelle andate a buon fine
async function _codaFlush() {
  if (!haDB()) return;
  const arr = _codaLeggi();
  if (!arr.length) return;
  const rimasti = [];
  for (const p of arr) {
    try { const { error } = await sb.from("seduta_svolta").upsert(p, { onConflict: "atleta_id,chiave" }); if (error) rimasti.push(p); }
    catch (e) { rimasti.push(p); }
  }
  _codaScrivi(rimasti);
}

// TAPPA 4 — seduta svolta dall'atleta → DB (upsert per atleta+chiave). Solo l'atleta scrive la propria (RLS).
async function salvaSedutaSvoltaDB(s) {
  if (!s) return;
  const aid = s.atletaId || (S.utente && S.utente.atletaId);   // l'atleta della seduta (coach corregge quella dell'atleta)
  if (!aid) return;
  if (atletaBloccato(aid)) return;
  const dati = s.tipo === "pista"
    ? { elementi: (s.elementi || []).map(e => ({ distanza: e.distanza, ripetute: e.ripetute, percentuale: e.percentuale, target: e.target, tempi: e.tempi, misure: e.misure, min: e.min, mezzo: e.mezzo, lanci: e.lanci, kg: e.kg, tipo: e.tipo, perc: e.perc, rpe: e.rpe, nonCompletato: !!e.nonCompletato, notaAtleta: e.notaAtleta || "" })) }
    : { esercizi: (s.esercizi || []).map(x => ({ nome: x.nome, serie: x.serie, rep: x.rep, percentuale: x.percentuale, peso: x.peso, pesoFatto: x.pesoFatto != null ? x.pesoFatto : null, vbtTarget: x.vbtTarget, vbt: x.vbt, rpe: x.rpe, nonCompletato: !!x.nonCompletato, serieFatte: x.serieFatte, repFatte: x.repFatte, notaAtleta: x.notaAtleta || "" })) };
  const payload = {
    atleta_id: aid, chiave: s.id, tipo: s.tipo,
    data: s.dataISO || (typeof oggiISO === "function" ? oggiISO() : new Date().toISOString().slice(0, 10)),
    durata_min: s.durata, rpe: s.rpe, fastidi: !!s.fastidi, giorno: s.giorno || null, chiusa: true, dati
  };
  // allinea SUBITO lo storico in memoria (senza aspettare il reload): così il carry-forward dei carichi,
  // la lista "svolti", lo screening e le presenze riflettono la modifica appena fatta.
  DEMO.seduteSvolte = DEMO.seduteSvolte || {};
  const _lst = DEMO.seduteSvolte[aid] = DEMO.seduteSvolte[aid] || [];
  const _sv = { atleta_id: aid, data: payload.data, tipo: payload.tipo, giorno: payload.giorno, durata_min: payload.durata_min, rpe: payload.rpe, fastidi: payload.fastidi, dati: payload.dati };
  const _ix = _lst.findIndex(x => x.data === payload.data && x.tipo === payload.tipo && (x.giorno == null || x.giorno === payload.giorno));
  if (_ix >= 0) _lst[_ix] = _sv; else _lst.push(_sv);
  if (typeof _invalidaSeduteGen === "function") _invalidaSeduteGen();   // settimane future non ancora fatte → si rigenerano col nuovo carico
  if (!haDB()) { _codaAggiungi(payload); return; }   // nessun DB al momento: metti in coda
  try {
    const { error } = await sb.from("seduta_svolta").upsert(payload, { onConflict: "atleta_id,chiave" });
    if (error) { _codaAggiungi(payload); return; }
    _codaFlush();   // salvataggio ok → tento di svuotare eventuale arretrato
  } catch (e) { _codaAggiungi(payload); }   // offline / errore rete: resta in coda, si reinvia da sola
}

// carico reale dalle sedute svolte (sRPE = rpe × durata): ACWR + forma (TSB) per atleta
function ricalcolaCarico(svolte) {
  const dayMs = 86400000, oggi = Date.now(), perA = {};
  (svolte || []).forEach(sv => {
    const load = (Number(sv.rpe) || 0) * (Number(sv.durata_min) || 0);
    if (!load) return;
    (perA[sv.atleta_id] = perA[sv.atleta_id] || []).push({ t: new Date(sv.data + "T00:00:00").getTime(), load });
  });
  Object.keys(perA).forEach(aid => {
    const arr = perA[aid];
    const win = g => arr.filter(x => (oggi - x.t) / dayMs < g).reduce((s, x) => s + x.load, 0);
    const m = DEMO.mon[aid] = DEMO.mon[aid] || monDefault();
    // ACWR e forma (TSB) hanno senso solo con un carico CRONICO reale (~4 settimane). Con poche sedute
    // acuto≈cronico → ACWR sempre ~4 e forma molto negativa: sono ARTEFATTI, non un vero rischio.
    const firstT = Math.min.apply(null, arr.map(x => x.t));
    const spanGiorni = (oggi - firstT) / dayMs;
    if (spanGiorni < 21 || arr.length < 3) {
      m.acwr = "—"; m.forma = "—"; m.stato = "v"; m.caricoInfo = "In raccolta dati: ACWR e forma diventano affidabili dopo ~4 settimane di allenamenti.";
      return;
    }
    m.caricoInfo = "";
    const acute = win(7), chronic = win(28);
    const acwr = chronic > 0 ? Math.round(acute / (chronic / 4) * 100) / 100 : null;
    const tsb = Math.round((chronic / 28 - acute / 7) * 10) / 10;
    if (acwr != null) { m.acwr = String(acwr); m.forma = (tsb >= 0 ? "+" : "") + tsb; m.stato = (acwr > 1.5 || acwr < 0.8) ? "r" : (acwr > 1.3 ? "w" : "v"); }
  });
}

function aggiungiAtletaLocale(a) {
  const anag = {
    categoria: a.categoria, anno: a.data_nascita ? new Date(a.data_nascita).getFullYear() : "",
    nascita: a.data_nascita ? new Date(a.data_nascita).toLocaleDateString("it-IT") : "",
    gambaStacco: a.gamba_stacco, altezza: a.altezza_cm, peso: a.peso_kg
  };
  DEMO.atleti.push({
    id: a.id, nome: a.nome, disciplina: a.disciplina, specialita: a.specialita,
    email: a.email || "", haAccesso: !!a.profilo_id, dataNascita: a.data_nascita || "",
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
      email: (d.email || "").trim().toLowerCase() || null,
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
// imposta/aggiorna l'email di accesso di un atleta esistente (il coach la dà all'atleta per registrarsi)
async function impostaEmailAtleta(atletaId, email) {
  if (_bloccatoStop(atletaId)) return false;
  const em = (email || "").trim().toLowerCase();
  if (haDB() && atletaId && !String(atletaId).startsWith("loc")) {
    const { error } = await sb.from("atleta").update({ email: em || null }).eq("id", atletaId);
    if (error) { alert("Errore: " + error.message); return false; }
  }
  const a = _atl(atletaId); if (a) a.email = em;
  return true;
}
// scheda bloccata (esempio dimostrativo, sola lettura): non modificabile né cancellabile
function atletaBloccato(id) { const a = (DEMO.atleti || []).find(x => x.id === id); return !!(a && a.bloccato); }
function _bloccatoStop(id) { if (atletaBloccato(id)) { alert("🔒 Scheda bloccata (esempio dimostrativo): è in sola lettura e non può essere modificata."); return true; } return false; }

// elimina un atleta e tutti i suoi dati collegati (solo coach)
async function eliminaAtleta(atletaId) {
  if (_bloccatoStop(atletaId)) return false;
  if (haDB() && atletaId && !String(atletaId).startsWith("loc")) {
    const { error } = await sb.from("atleta").delete().eq("id", atletaId);
    if (error) { alert("Errore nell'eliminazione: " + error.message); return false; }
  }
  DEMO.atleti = (DEMO.atleti || []).filter(a => a.id !== atletaId);
  if (DEMO.mon) delete DEMO.mon[atletaId];
  if (DEMO.diariCoach) delete DEMO.diariCoach[atletaId];
  if (DEMO.report && DEMO.report.daFare) delete DEMO.report.daFare[atletaId];
  return true;
}
// ---------- calendario gare (per gruppo: velocisti / mezzofondo / lanci) ----------
function _applicaGare(gare) {
  DEMO.gareRaw = (gare || []).map(g => ({ id: g.id, data: g.data, luogo: g.luogo, gara: g.gara, obiettivo: g.obiettivo, gruppo: g.gruppo || null }));
  // prossima/gareProssime "società" (retro-compat, usate come fallback): tutte, ordinate per data
  if (DEMO.gareRaw.length) {
    const g0 = DEMO.gareRaw[0];
    DEMO.prossimaGara = { id: g0.id, luogo: g0.luogo, gara: g0.gara, obiettivo: g0.obiettivo, gruppo: g0.gruppo, data: g0.data, traSettimane: (typeof settimaneA === "function" ? settimaneA(g0.data) : 0) };
    DEMO.gareProssime = DEMO.gareRaw.slice(1).map(g => ({ id: g.id, data: (typeof fmtData === "function" ? fmtData(g.data) : g.data), dataISO: g.data, luogo: g.luogo, gara: g.gara, obiettivo: g.obiettivo, gruppo: g.gruppo }));
  } else { DEMO.prossimaGara = null; DEMO.gareProssime = []; }
}
// gare di un gruppo (una gara senza gruppo vale per tutti — retro-compat)
function gareGruppo(g) { return (DEMO.gareRaw || []).filter(x => !x.gruppo || x.gruppo === g); }
// prossima gara futura di un gruppo (per la home atleta e il dettaglio coach)
function prossimaGaraGruppo(g) {
  const nd = new Date(); nd.setHours(0, 0, 0, 0); const now = nd.getTime();
  const arr = gareGruppo(g).map(x => ({ x, t: x.data ? new Date(x.data + "T00:00:00").getTime() : null }))
    .filter(o => o.t != null && o.t >= now).sort((a, b) => a.t - b.t);
  if (!arr.length) return null;
  const g0 = arr[0].x;
  return { id: g0.id, luogo: g0.luogo, gara: g0.gara, obiettivo: g0.obiettivo, data: g0.data, gruppo: g0.gruppo, traSettimane: (typeof settimaneA === "function" ? settimaneA(g0.data) : 0) };
}
async function caricaGare() {
  if (!haDB()) return;
  const { data: gare } = await sb.from("gara").select("id,data,luogo,gara,obiettivo,gruppo").order("data");
  _applicaGare(gare || []);
}
async function creaGara(d) {
  if (haDB()) {
    const { error } = await sb.from("gara").insert({ societa_id: S.utente.societaId, data: d.data || null, luogo: d.luogo || null, gara: d.gara || null, obiettivo: d.obiettivo || null, gruppo: d.gruppo || null });
    if (error) { alert("Errore nel salvataggio della gara: " + error.message); return false; }
    await caricaGare();
  }
  return true;
}
async function eliminaGara(id) {
  if (haDB() && id) {
    const { error } = await sb.from("gara").delete().eq("id", id);
    if (error) { alert("Errore: " + error.message); return false; }
    await caricaGare();
  }
  return true;
}

// aggiorna l'anagrafica dell'atleta (può farlo l'atleta stesso dal suo profilo, o il coach)
async function aggiornaAnagrafica(atletaId, d) {
  if (_bloccatoStop(atletaId)) return false;
  const patch = {
    disciplina: d.disciplina || "velocita", specialita: d.specialita || null, categoria: d.categoria || null,
    data_nascita: d.data_nascita || null, gamba_stacco: d.gamba_stacco || null,
    altezza_cm: d.altezza_cm != null ? d.altezza_cm : null, peso_kg: d.peso_kg != null ? d.peso_kg : null
  };
  if (d.nome != null && d.nome.trim()) patch.nome = d.nome.trim();
  if (haDB() && atletaId && !String(atletaId).startsWith("loc")) {
    const { error } = await sb.from("atleta").update(patch).eq("id", atletaId);
    if (error) { alert("Errore nel salvataggio: " + error.message); return false; }
  }
  const a = _atl(atletaId);
  if (a) {
    if (patch.nome) { a.nome = patch.nome; if (S.utente && S.utente.atletaId === atletaId) S.utente.nome = patch.nome; }
    a.disciplina = d.disciplina || "velocita"; a.specialita = d.specialita || ""; a.dataNascita = d.data_nascita || "";
    a.scheda = a.scheda || {}; a.scheda.anagrafica = a.scheda.anagrafica || {};
    const an = a.scheda.anagrafica;
    an.categoria = d.categoria || "";
    an.anno = d.data_nascita ? new Date(d.data_nascita).getFullYear() : "";
    an.nascita = d.data_nascita ? new Date(d.data_nascita).toLocaleDateString("it-IT") : "";
    an.gambaStacco = d.gamba_stacco || ""; an.altezza = d.altezza_cm; an.peso = d.peso_kg;
  }
  return true;
}

// ---------- scrittura: voci della scheda (PB, massimali, test) ----------
function _atl(id) { return DEMO.atleti.find(a => a.id === id); }

// "" o NaN → null (le colonne numeriche del DB non accettano stringa vuota)
function _numOrNull(x) { if (x === "" || x == null) return null; const n = Number(x); return isNaN(n) ? null : n; }
async function creaPB(atletaId, d) {
  if (_bloccatoStop(atletaId)) return false;
  let id = "loc" + Date.now();
  const origine = d.origine || "gara";
  const tempo = _numOrNull(d.tempo), stagione = _numOrNull(d.stagione), obiettivo = _numOrNull(d.obiettivo), vento = _numOrNull(d.vento);
  if (haDB()) {
    const rec = { atleta_id: atletaId, distanza: d.distanza, tempo, data: d.data || null, stagione, obiettivo, origine };
    if (vento != null) rec.vento = vento;   // colonna opzionale: inviata solo se valorizzata
    const { data, error } = await sb.from("pb").insert(rec).select("id").single();
    if (error) { alert("Errore nel salvataggio: " + error.message); return false; }
    id = data.id;
  }
  const a = _atl(atletaId);
  if (a) {
    a.scheda.pb.push([d.distanza, tempo, fmtDataAnno(d.data), stagione, obiettivo, id, d.data || "", origine, vento]);
    a.scheda.pb.sort((x, y) => rankDist(x[0]) - rankDist(y[0]));
    a.pb.push([d.distanza, tempo]);
  }
  return true;
}
// aggiorna il PB in allenamento per una distanza solo se il tempo è un nuovo migliore (meno = meglio)
async function aggiornaPbAllenamento(atletaId, distanza, tempo) {
  if (atletaBloccato(atletaId)) return false; // silenzioso: aggiornamento PB automatico
  if (!atletaId || !distanza || !(tempo > 0)) return false;
  const a = _atl(atletaId);
  if (a) {
    const attuale = (a.scheda.pb || []).filter(p => p[0] === distanza && (p[7] || "gara") === "allenamento").map(p => Number(p[1]));
    if (attuale.length && Math.min(...attuale) <= tempo) return false; // non è un nuovo PB
  }
  return creaPB(atletaId, { distanza, tempo: Math.round(tempo * 100) / 100, data: new Date().toISOString().slice(0, 10), stagione: null, obiettivo: null, origine: "allenamento" });
}

async function creaMassimale(atletaId, d) {
  if (_bloccatoStop(atletaId)) return false;
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
  if (_bloccatoStop(atletaId)) return false;
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

async function creaInfortunio(atletaId, d) {
  if (_bloccatoStop(atletaId)) return false;
  let id = "loc" + Date.now();
  if (haDB()) {
    const { data, error } = await sb.from("infortunio").insert({
      atleta_id: atletaId, zona: d.zona, lato: d.lato || null, tipo: d.tipo || null, gravita: d.gravita || null,
      stato: d.stato || "Attivo", dal: d.dataInizio || null, data_inizio: d.dataInizio || null,
      data_rientro: d.dataRientro || null, nota: d.nota || null, aperto: d.stato !== "Risolto"
    }).select("id").single();
    if (error) { alert("Errore nel salvataggio: " + error.message); return false; }
    id = data.id;
  }
  DEMO.infortuni = DEMO.infortuni || [];
  DEMO.infortuni.unshift({ id, atleta: atletaId, zona: d.zona, lato: d.lato, tipo: d.tipo, gravita: d.gravita,
    stato: d.stato || "Attivo", dal: d.dataInizio, dataInizio: d.dataInizio, dataRientro: d.dataRientro, nota: d.nota });
  return true;
}
async function aggiornaInfortunio(id, patch) {
  if (haDB() && id && !String(id).startsWith("loc")) {
    const { error } = await sb.from("infortunio").update(patch).eq("id", id);
    if (error) { alert("Errore: " + error.message); return false; }
  }
  return true;
}
async function eliminaInfortunio(id) {
  if (haDB() && id && !String(id).startsWith("loc")) {
    const { error } = await sb.from("infortunio").delete().eq("id", id);
    if (error) { alert("Errore: " + error.message); return false; }
  }
  return true;
}

async function eliminaVoce(tabella, atletaId, id, arrKey, idx) {
  if (_bloccatoStop(atletaId)) return;
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
