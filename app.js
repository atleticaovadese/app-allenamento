// Avvio, accesso, menù laterale e disegno delle schermate.
const S = { utente: null, vista: "oggi", seduta: null, menu: false, gruppi: {}, atletaSel: null, calModo: "mesociclo", libCat: null, routineEdit: null, esercizioEdit: null, mostraScheda: false, nuovoAtleta: null, infortunio: null, risultatoGara: null, modificaDati: null, nuovoTest: false, gruppo: "vel", progGruppo: "vel", mostraRegistra: false, onboarding: null, tourStep: 0, calOff: 0, pianoGrafici: false, pistaMeso: 0, pistaGiorno: 0, palMeso: 0, palGiorno: 0 };
function setProgGruppo(g) { S.progGruppo = g; S.pistaMeso = 0; S.pistaGiorno = 0; S.palMeso = 0; S.palGiorno = 0; disegna(); window.scrollTo(0, 0); }
const GRUPPI_PROG = [["vel", "Velocisti / Saltatori"], ["lanci", "Lanciatori"], ["mezzo", "Mezzofondo / Fondo"]];
function selettoreProgGruppo() {
  return `<div class="card" style="border-color:var(--blu)"><label class="lab">Programma madre per</label>
    <select onchange="setProgGruppo(this.value)" style="margin-top:6px">${GRUPPI_PROG.map(([k, l]) => `<option value="${k}" ${S.progGruppo === k ? "selected" : ""}>${l}</option>`).join("")}</select>
    <p class="et" style="margin-top:8px">Stai scrivendo il programma per i <b>${(GRUPPI_PROG.find(x => x[0] === S.progGruppo) || [])[1] || ""}</b>. Va solo a loro; per gli altri gruppi scegli qui sopra.</p></div>`;
}
const $ = (id) => document.getElementById(id);

// ---------- menù: tutti i fogli, raggruppati ----------
const MENU_ATLETA = [
  { k: "oggi", ic: "◧", l: "Oggi" },
  { k: "calendario", ic: "▦", l: "Calendario" },
  { k: "diario", ic: "✎", l: "Diario" },
  { k: "gare", ic: "★", l: "Gare" },
  { g: "Librerie", ic: "▤", subs: [["lib-sala", "Sala"], ["lib-mobilita", "Mobilità"], ["lib-video", "Video"], ["lib-plio", "Pliometria"]] },
  { k: "io", ic: "◉", l: "I miei dati" },
  { k: "presenze", ic: "◍", l: "Presenze" },
  { k: "aiuto", ic: "?", l: "Guida e glossario" }
];

const MENU_COACH = [
  { k: "squadra", ic: "◧", l: "Squadra" },
  { k: "atleti", ic: "◉", l: "Atleti" },
  { k: "cal-squadra", ic: "▦", l: "Calendario squadra" },
  { g: "Programma", ic: "▦", subs: [
    ["pista", "Pista"], ["palestra", "Palestra"], ["riscaldamento", "Riscaldamento"],
    ["template", "Template microcicli"], ["piano", "Piano e picco"], ["periodizzazione", "Periodizzazione"], ["per-distanza", "Per distanza (mezzo)"], ["guida-mezzi", "Guida mezzi (mezzo)"], ["guida-mezzi-lanci", "Guida mezzi (lanci)"], ["periodizzazione-lanci", "Periodizzazione Lanci"]] },
  { g: "Analisi", ic: "◭", subs: [
    ["test", "Test"], ["fv", "Profilo F-V"], ["fv-sprint", "Profilo F-V sprint"], ["dropjump", "Drop Jump & RSI"],
    ["stima1rm", "Stima 1RM"], ["vel-target", "Velocità target"], ["ritmi-mezzo", "Ritmi mezzofondo"], ["test-lattato", "Test lattato"], ["critical-speed", "Velocità critica"], ["riepilogo-test", "Riepilogo test"], ["profilo-attrezzo", "Profilo attrezzo (lanci)"], ["traino", "Traino"],
    ["vbt", "Monitoraggio VBT"], ["andamento-pista", "Andamento pista"], ["andamento-palestra", "Andamento palestra"], ["guida-test", "Guida test mezzofondo"]] },
  { g: "Monitoraggio", ic: "◍", subs: [
    ["screening", "Screening"], ["carico", "Carico e forma"], ["infortuni", "Infortuni"], ["prevenzione", "Prevenzione"], ["presenze", "Presenze"], ["diario-c", "Diario"]] },
  { g: "Librerie", ic: "▤", subs: [["lib-sala", "Sala"], ["lib-mobilita", "Mobilità"], ["lib-video", "Video"], ["lib-plio", "Pliometria"], ["esercizi-speciali", "Esercizi speciali (lanci)"]] },
  { k: "gare", ic: "★", l: "Gare" },
  { k: "report", ic: "✉", l: "Report settimanale" },
  { k: "dati", ic: "⇅", l: "Import / Export" },
  { k: "aiuto", ic: "?", l: "Guida e glossario" }
];

// Da quale foglio dell'Excel arriva ogni voce (serve a non perdere niente)
const DA_EXCEL = {
  squadra: "Cruscotto", atleti: "Atleta", io: "Atleta",
  pista: "Pista", palestra: "Palestra", riscaldamento: "Riscaldamento",
  template: "Template microcicli", piano: "Piano & Picco", periodizzazione: "Periodizzazione", "per-distanza": "Per distanza", "guida-mezzi": "Guida mezzi", "guida-test": "Guida test", "guida-mezzi-lanci": "Guida mezzi (lanci)", "periodizzazione-lanci": "Periodizzazione (lanci)", "esercizi-speciali": "Esercizi speciali",
  test: "Test", fv: "Profilo F-V", "fv-sprint": "Profilo F-V Sprint", dropjump: "Drop Jump & RSI", cmj: "Test (CMJ/SJ)", "sprint-test": "Test (sprint)", stima1rm: "Stima 1RM",
  "vel-target": "Velocita target", "ritmi-mezzo": "Ritmi target (mezzofondo)", "test-lattato": "Test lattato", "critical-speed": "Critical Speed", "riepilogo-test": "Riepilogo test (mezzofondo)", "profilo-attrezzo": "Profilo attrezzo", traino: "Traino (Sled)", vbt: "Monitoraggio VBT",
  "andamento-pista": "Andamento Pista", "andamento-palestra": "Andamento Palestra", screening: "(nuovo: settimana/mesociclo)", carico: "Carico & Forma",
  infortuni: "Infortuni & Prevenzione", prevenzione: "Infortuni & Prevenzione (asimmetrie)", presenze: "Presenze", "diario-c": "Diario",
  "lib-sala": "Libreria Sala", "lib-mobilita": "Libreria Mobilita", "lib-video": "Libreria Video",
  "lib-plio": "Pliometria", gare: "Calendario gare", calendario: "Pista (mesocicli)", diario: "Diario",
  aiuto: "Legenda + Start", report: "(nuovo: non c'è in Excel)"
};

// Librerie condivise (atleta e allenatore): voce del menù -> [tipo dati, titolo]
const LIB = {
  "lib-sala": ["sala", "Libreria Sala"],
  "lib-mobilita": ["mobilita", "Libreria Mobilità"],
  "lib-plio": ["pliometria", "Pliometria"]
};

const TITOLI_EXTRA = { cmj: "CMJ e SJ", "sprint-test": "Sprint — tempi" };
function titoloVista(v, menu) {
  for (const m of menu) {
    if (m.k === v) return m.l;
    if (m.subs) { const s = m.subs.find(x => x[0] === v); if (s) return s[1]; }
  }
  return TITOLI_EXTRA[v] || "In arrivo";
}

// ---------- accesso ----------
function entra(ruolo) {
  S.utente = DEMO.utenti.find(u => u.ruolo === ruolo);
  S.vista = ruolo === "coach" ? "squadra" : "oggi";
  localStorage.setItem("utente", S.utente.id);
  // programma demo pulito SOLO al primo login della sessione (poi conserva le modifiche fatte in demo)
  if (!window._demoProgFatto && typeof _installaProgrammaDemo === "function") { _installaProgrammaDemo(); window._demoProgFatto = true; }
  if (typeof allineaDemoProgramma === "function") allineaDemoProgramma();
  disegna();
}
function esci() {
  if (typeof disconnetti === "function") disconnetti();
  S.utente = null; S.seduta = null; S.vista = "oggi"; S.menu = false; S.atletaSel = null;
  localStorage.removeItem("utente"); disegna();
}
function ripristina() {
  const id = localStorage.getItem("utente");
  if (id) {
    S.utente = DEMO.utenti.find(u => u.id === id) || null;
    if (S.utente && S.utente.ruolo === "coach") S.vista = "squadra";
  }
}

function vistaLogin() {
  const reg = S.mostraRegistra;
  let savedEmail = ""; try { savedEmail = localStorage.getItem("metis_email") || ""; } catch (e) { }
  return `<div class="login">
    <h1>${CONFIG.nome}</h1>
    <p class="sub" style="font-style:italic">${reg ? "Registrazione atleta" : "«Chi non pianifica è destinato a fallire.»"}</p>
    <div id="loginErr" class="login-err" style="display:none"></div>
    <div class="campo"><label>Email</label><input id="inEmail" type="email" placeholder="nome@esempio.it" value="${(reg ? "" : savedEmail).replace(/"/g, "&quot;")}"></div>
    <div class="campo"><label>Password</label>
      <input id="inPwd" type="password" placeholder="${reg ? "almeno 6 caratteri" : "••••••••"}" onkeydown="if(event.key==='Enter')${reg ? "registraUI()" : "accediUI()"}"></div>
    ${reg
      ? `<button class="btn" onclick="registraUI()">Registrati</button>
         <p class="et" style="text-align:center;margin-top:12px">Usa l'email che ti ha dato l'allenatore.<br>
           <button class="link-indietro" onclick="toggleRegistra()">Hai già l'accesso? Entra ›</button></p>`
      : `<label class="check" style="margin:4px 2px 14px"><input type="checkbox" id="inRicorda" ${savedEmail ? "checked" : ""}><span>Ricorda la mia email</span></label>
         <button class="btn" onclick="accediUI()">Entra</button>
         <p class="et" style="text-align:center;margin-top:12px">
           <button class="link-indietro" onclick="toggleRegistra()">Sei un atleta? Registrati ›</button></p>`}
  </div>`;
}
function toggleRegistra() { S.mostraRegistra = !S.mostraRegistra; disegna(); }
function accediUI() {
  const email = ($("inEmail") || {}).value || "";
  const pwd = ($("inPwd") || {}).value || "";
  const ric = ($("inRicorda") || {}).checked;
  try { if (ric && email.trim()) localStorage.setItem("metis_email", email.trim().toLowerCase()); else localStorage.removeItem("metis_email"); } catch (e) { }
  if (typeof accedi === "function") accedi(email, pwd);
}
function registraUI() {
  const email = ($("inEmail") || {}).value || "";
  const pwd = ($("inPwd") || {}).value || "";
  if (typeof registraAtleta === "function") registraAtleta(email, pwd);
}

function apriMenu() { S.menu = !S.menu; aggiornaMenu(); }
function aggiornaMenu() {
  $("lato").classList.toggle("on", S.menu);
  $("ombra").classList.toggle("on", S.menu);
}
function apriGruppo(g) { S.gruppi[g] = !S.gruppi[g]; disegna(); }
function vai(v) { S.vista = v; S.seduta = null; S.atletaSel = null; S.diarioAtleta = null; S.spostaGiorni = null; S.adatta = null; S.sedSvolte = null; S.report = null; S.libCat = null; S.routineEdit = null; S.esercizioEdit = null; S.mostraScheda = false; S.nuovoAtleta = null; S.infortunio = null; S.risultatoGara = null; S.modificaDati = null; S.nuovoTest = false; S.calOff = 0; S.pianoGrafici = false; S.pistaMeso = 0; S.pistaGiorno = 0; S.palMeso = 0; S.palGiorno = 0; S.menu = false; disegna(); window.scrollTo(0, 0); }

// atleta attualmente loggato (o il primo, in anteprima)
function atletaCorrente() {
  return DEMO.atleti.find(x => S.utente && x.id === S.utente.atletaId) || DEMO.atleti[0];
}

// ---------- atleta: cruscotto a quadranti ----------
function vistaOggi() {
  const a = atletaCorrente(), g = DEMO.prossimaGara;
  const pos = typeof posizioneProgramma === "function" ? posizioneProgramma() : null;
  const oggiSed = typeof seduteDelGiorno === "function" ? seduteDelGiorno(oggiISO(), false) : [];
  const cardOggi = oggiSed.length
    ? oggiSed.map(s => `<div class="card oggi" onclick="apriSeduta('${s.id}')">
        <p class="et">Allenamento di oggi</p>
        <h3>${s.tipo === "pista" ? "Pista" : "Palestra"} · giorno ${s.giorno}</h3>
        <p class="et" style="color:#dbe9ff">${typeof riepilogoSeduta === "function" ? riepilogoSeduta(s) : ""}</p></div>`).join("")
    : `<div class="card"><p class="et">Nessun allenamento programmato oggi — riposo o guarda il <button class="link-indietro" onclick="vai('calendario')">calendario ›</button></p></div>`;
  const tacche = pos ? Array.from({ length: pos.tot },
    (_, i) => `<i class="${i < pos.sett ? "on" : ""}"></i>`).join("") : "";
  const ad = Math.round(a.presenzeStagione[0] / a.presenzeStagione[1] * 100);
  const d = DEMO.diarioOggi, fatto = d.salvato && diarioCompleto(d);

  // il cruscotto si adatta: per il mezzofondo mostra ritmi/zone e km invece di sprint/salti
  const isMezzo = (typeof gruppoDi === "function") && gruppoDi(a) === "mezzo";
  const rm = isMezzo && typeof ritmiHomeMezzo === "function" ? ritmiHomeMezzo(a) : null;
  const kmS = isMezzo && typeof kmSettAtleta === "function" ? kmSettAtleta(a) : null;
  const cardVolume = isMezzo ? `<div class="q" onclick="vai('calendario')">
      <div class="k">Volume settimana</div>
      <div><div class="v">${kmS != null ? kmS + " km" : "—"}</div><div class="d">${kmS != null ? "programmati" : "nessun lavoro"}</div></div>
    </div>` : "";
  const cardTestZone = isMezzo
    ? `<div class="q wide" onclick="vai('calendario')">
        <div class="k">Le mie zone di ritmo (/km)</div>
        <div class="d" style="margin-top:6px;font-size:13px;color:var(--txt)">Facile <b>${rm.facile}</b> &nbsp;·&nbsp; Soglia <b>${rm.soglia}</b> &nbsp;·&nbsp; VO2max <b>${rm.vo2}</b> &nbsp;·&nbsp; Gara 5k <b>${rm.gara5}</b></div>
      </div>`
    : `<div class="q wide" onclick="vai('io')">
        <div class="k">Ultimi test</div>
        <div class="d" style="margin-top:6px;font-size:13px;color:var(--txt)">${a.test.map(([n, v, dd]) => `${n} <b>${v}</b> <span style="color:var(--verde)">${dd}</span>`).join(" &nbsp;·&nbsp; ")}</div>
      </div>`;

  return `
  ${cardOggi}

  <div class="quadri">
    ${pos ? `<div class="q wide" onclick="vai('calendario')">
      <div><div class="k">Dove sei nel programma</div>
        <div class="v s">${pos.titolo}</div>
        <div class="d">settimana ${pos.sett} di ${pos.tot} · ${pos.dal} – ${pos.al}</div></div>
      <div class="tacche">${tacche}</div>
    </div>` : ""}
    ${cardVolume}

    <div class="q" onclick="vai('diario')">
      <div class="k">Diario di oggi</div>
      <div><div class="v s" style="${fatto ? "color:var(--verde)" : ""}">${fatto ? "Fatto ✓" : "Da fare"}</div>
        <div class="d">${fatto ? "grazie" : "tocca per compilarlo"}</div></div>
    </div>

    <div class="q" onclick="vai('gare')">
      <div class="k">Prossima gara</div>
      <div><div class="v s">${g.luogo}</div>
        <div class="d">tra ${g.traSettimane} sett · ${g.gara} · ${g.obiettivo}</div></div>
    </div>

    <div class="q" onclick="vai('presenze')">
      <div class="k">Presenze del mese</div>
      <div><div class="v">${a.presenzeMese[0]} / ${a.presenzeMese[1]}</div></div>
    </div>

    <div class="q" onclick="vai('presenze')">
      <div class="k">Stagione</div>
      <div><div class="v">${ad}%</div><div class="d">${a.presenzeStagione[0]} su ${a.presenzeStagione[1]}</div></div>
    </div>

    ${cardTestZone}
  </div>`;
}

function apriSeduta(id) { S.seduta = id; T.id = null; fermaTimer(); disegna(); window.scrollTo(0, 0); }

// ---------- Gare (atleta e allenatore) ----------
const DIST_GARA = ["60 m", "80 m", "100 m", "120 m", "150 m", "200 m", "300 m", "400 m", "60 hs", "100 hs", "110 hs", "400 hs", "Altro"];
function nomeAtletaGara(id) { const a = DEMO.atleti.find(x => x.id === id); return a ? a.nome : "—"; }

function vistaGare() {
  const p = DEMO.prossimaGara;
  const coach = S.utente && S.utente.ruolo === "coach";
  const mio = S.utente && S.utente.atletaId;
  const prog = (DEMO.gareProssime || []).map(g => `
    <div class="riga">
      <div><div style="font-weight:500">${g.luogo}</div>
        <div class="et">${g.gara} · obiettivo ${g.obiettivo}</div></div>
      <b>${g.data}</b></div>`).join("");
  const ris = (DEMO.risultatiGara || []).filter(r => coach || r.atletaId === mio).slice(0, 30).map(r => `
    <div class="card" style="padding:12px 14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3 style="font-size:16px">${coach ? nomeAtletaGara(r.atletaId) : (r.gara || r.distanza)}</h3>
        <b style="font-size:17px">${r.tempo}${typeof r.tempo === "number" ? " s" : ""}</b></div>
      <p class="et" style="margin-top:4px">${r.distanza}${r.gara ? " · " + r.gara : ""} · ${typeof fmtDataAnno === "function" ? fmtDataAnno(r.data) : r.data}</p>
      <p class="et" style="margin-top:2px">${[r.posizione ? "pos. " + r.posizione : "", r.vento ? "vento " + r.vento : "", r.note].filter(Boolean).join(" · ") || ""}</p>
      ${coach ? `<button class="link-indietro" style="color:var(--rosso);margin-top:4px" onclick="eliminaRisultatoGara('${r.id}')">elimina</button>` : ""}
    </div>`).join("");
  return `
  <div class="card"><h3>Gare</h3>
    <p class="et" style="margin-top:2px">${coach ? "Registra i risultati: aggiornano in automatico i PB in gara dell'atleta. Sotto, il calendario." : "I tuoi risultati aggiornano in automatico i tuoi PB in gara. Sotto, le prossime gare."}</p></div>

  <button class="btn" style="margin-bottom:12px" onclick="apriRisultatoGara('${coach ? "" : (mio || "")}')">＋ Registra risultato</button>

  <p class="sez">${coach ? "Risultati recenti" : "I tuoi risultati"}</p>
  ${ris || `<div class="card"><p class="et">Nessun risultato registrato. Tocca «Registra risultato».</p></div>`}

  <p class="sez">Prossima gara</p>
  <div class="card" style="border-color:var(--blu)">
    <p class="et" style="color:var(--blu)">tra ${p.traSettimane} settimane</p>
    <h3 style="margin-top:4px">${p.luogo}</h3>
    <p class="et" style="margin-top:2px">${p.gara} · obiettivo ${p.obiettivo}</p>
  </div>
  <div class="card">
    <p class="et" style="margin-bottom:6px">In programma</p>
    ${prog || `<p class="et">Nessun'altra gara inserita.</p>`}
  </div>`;
}

function apriRisultatoGara(atletaId) {
  S.risultatoGara = { atletaId: atletaId || "", data: new Date().toISOString().slice(0, 10), gara: "", distanza: "", tempo: "", vento: "", posizione: "", note: "" };
  disegna(); window.scrollTo(0, 0);
}
function chiudiRisultatoGara() { S.risultatoGara = null; S.vista = "gare"; disegna(); window.scrollTo(0, 0); }
function vistaRisultatoGaraForm() {
  const f = S.risultatoGara;
  const coach = S.utente && S.utente.ruolo === "coach";
  return `<button class="indietro" onclick="chiudiRisultatoGara()">‹ Indietro</button>
    <div class="card"><h3>Registra risultato</h3>
      <p class="et" style="margin-top:2px">${coach ? "Aggiorna il PB in gara dell'atleta (se è un nuovo migliore)." : "Aggiorna il tuo PB in gara (se è un nuovo migliore)."}</p></div>
    <div class="card">
      ${coach
        ? `<label class="lab">Atleta</label>
      <select onchange="S.risultatoGara.atletaId=this.value;S.risultatoGara.distanza='';disegna()" style="margin-top:6px">
        <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${f.atletaId === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>`
        : ""}
      ${(() => {
        const disc = ((DEMO.atleti.find(x => x.id === f.atletaId) || {}).disciplina) || "velocita";
        const voci = typeof eventiPB === "function" ? eventiPB(disc) : DIST_GARA;
        const opts = typeof _optsPB === "function" ? _optsPB(voci, f.distanza) : DIST_GARA.map(d => `<option ${f.distanza === d ? "selected" : ""}>${d}</option>`).join("");
        return `<div class="griglia2" style="${coach ? "margin-top:12px" : ""}">
        <div><label class="lab">Data</label>
          <input type="date" value="${f.data || ""}" oninput="S.risultatoGara.data=this.value" style="margin-top:6px"></div>
        <div><label class="lab">${disc === "lanci" ? "Attrezzo" : "Distanza / prova"}</label>
          <select onchange="S.risultatoGara.distanza=this.value" style="margin-top:6px"><option value="" ${!f.distanza ? "selected" : ""}>— scegli —</option>${opts}</select></div>
      </div>`;
      })()}
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Tempo (s)</label>
          <input inputmode="decimal" value="${f.tempo}" placeholder="es. 10.85" oninput="S.risultatoGara.tempo=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Vento (m/s)</label>
          <input inputmode="decimal" value="${f.vento}" placeholder="es. +1.2" oninput="S.risultatoGara.vento=this.value" style="margin-top:6px"></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Posizione</label>
          <input inputmode="numeric" value="${f.posizione}" placeholder="es. 2" oninput="S.risultatoGara.posizione=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Gara / luogo</label>
          <input value="${(f.gara || "").replace(/"/g, "&quot;")}" placeholder="es. Reg. Novara" oninput="S.risultatoGara.gara=this.value" style="margin-top:6px"></div>
      </div>
      <label class="lab" style="display:block;margin-top:12px">Note</label>
      <textarea rows="2" oninput="S.risultatoGara.note=this.value" placeholder="condizioni, sensazioni…" style="margin-top:6px;width:100%">${(f.note || "").replace(/</g, "&lt;")}</textarea>
    </div>
    <button class="btn" onclick="salvaRisultatoGara()">Salva il risultato</button>`;
}
async function salvaRisultatoGara() {
  const f = S.risultatoGara;
  if (!f.atletaId) { alert("Scegli l'atleta."); return; }
  const t = parseFloat(String(f.tempo).replace(",", "."));
  if (!f.distanza || !(t > 0)) { alert("Distanza e tempo (valido) sono obbligatori."); return; }
  const btn = document.querySelector(".main .btn"); if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }
  DEMO.risultatiGara = DEMO.risultatiGara || [];
  DEMO.risultatiGara.unshift({ id: "rg" + Date.now(), atletaId: f.atletaId, data: f.data, gara: (f.gara || "").trim(), distanza: f.distanza, tempo: Math.round(t * 100) / 100, vento: (f.vento || "").trim(), posizione: (f.posizione || "").trim(), note: (f.note || "").trim() });
  if (typeof salvaCustom === "function") salvaCustom();
  const ok = typeof creaPB === "function" ? await creaPB(f.atletaId, { distanza: f.distanza, tempo: Math.round(t * 100) / 100, data: f.data || null, stagione: null, obiettivo: null, origine: "gara" }) : true;
  if (ok !== false) { S.risultatoGara = null; S.vista = "gare"; disegna(); window.scrollTo(0, 0); }
  else if (btn) { btn.textContent = "Salva il risultato"; btn.disabled = false; }
}
function eliminaRisultatoGara(id) {
  if (!confirm("Eliminare questo risultato? (il PB già aggiornato resta)")) return;
  DEMO.risultatiGara = (DEMO.risultatiGara || []).filter(r => r.id !== id);
  if (typeof salvaCustom === "function") salvaCustom();
  disegna();
}

// ---------- Aiuto e glossario ----------
// Ogni voce: [sezione, termine, riga breve, spiegazione completa]. Si tocca per leggere tutto.
const GLOSSARIO = [
  ["Diario", "Prontezza", "Quanto sei pronto ad allenarti oggi (dal diario).",
    "È la media dei quattro valori del diario: qualità del sonno, stress, dolori ed energia (da 1 a 5). Su tutte e quattro le scale 5 = sto bene, quindi più è alta più sei pronto. Indicativamente: <b>sopra 3.5</b> via libera, <b>tra 2.5 e 3.5</b> allenamento un po' più leggero, <b>sotto 2.5</b> conviene scaricare o parlarne con l'allenatore. L'atleta non la vede (per non 'aggiustare' le risposte): la vede solo l'allenatore."],

  ["Carico e forma", "RPE", "Quanto è stato faticoso l'allenamento.",
    "Rate of Perceived Exertion: da 1 (facilissimo) a 10 (massimo sforzo), lo scrivi a fine seduta. Insieme alla durata è la base del carico. È soggettivo ma molto affidabile se sei onesto."],
  ["Carico e forma", "RIR", "Ripetizioni ancora in riserva.",
    "Reps In Reserve: quante ripetizioni potevi ancora fare a fine serie. È il modo di esprimere lo sforzo in palestra: <b>RIR 2 ≈ RPE 8</b>, <b>RIR 0 = a cedimento</b> (RPE 10, massimale). Più RIR = più margine lasciato."],
  ["Carico e forma", "sRPE / Carico", "Il carico di una singola seduta.",
    "Session-RPE: RPE della seduta × durata in minuti (es. RPE 7 per 80' = 560). È il mattone da cui nascono carico acuto, cronico, forma e ACWR."],
  ["Carico e forma", "CTL (Fitness)", "La tua condizione di fondo.",
    "Chronic Training Load: media del carico su ~42 giorni. È la base che costruisci nel tempo: sale e scende lentamente. Più è alta, più 'motore' hai."],
  ["Carico e forma", "ATL (Fatica)", "La stanchezza recente.",
    "Acute Training Load: media del carico su ~7 giorni. Sale e scende in fretta: rappresenta la fatica accumulata negli ultimi giorni."],
  ["Carico e forma", "TSB (Forma)", "La tua freschezza in questo momento.",
    "Training Stress Balance = CTL − ATL (fondo meno fatica recente). <b>Positivo</b> = fresco e scarico, buono vicino alle gare; <b>negativo</b> = affaticato, normale nei blocchi di carico. Non è 'male' essere negativi: dipende dal momento della stagione."],
  ["Carico e forma", "ACWR", "Rapporto tra carico recente e abituale.",
    "Acute:Chronic Workload Ratio = carico acuto (7 gg) diviso cronico (28 gg). Dice se stai aumentando troppo in fretta. <b>0.8–1.3</b> = zona ideale; <b>1.31–1.50</b> = attenzione; <b>sopra 1.5</b> = rischio infortunio alto, scarica; <b>sotto 0.8</b> = carico basso. Nel monitoraggio è colorato verde/giallo/rosso."],

  ["Palestra e VBT", "VBT", "Allenarsi guardando la velocità del bilanciere.",
    "Velocity Based Training: si misura quanto velocemente si muove il bilanciere in ogni serie. Per ogni esercizio c'è una velocità richiesta (target). L'app fa la media delle serie: se cala <b>più del 10% sotto il target</b>, il carico è troppo alto o sei stanco, meglio togliere peso o chiudere."],
  ["Palestra e VBT", "m/s", "L'unità della velocità del bilanciere.",
    "Metri al secondo: la velocità media della fase di salita (concentrica) del bilanciere. È il numero che scrivi in palestra serie per serie."],
  ["Palestra e VBT", "MCV", "Velocità media di una serie.",
    "Mean Concentric Velocity: la velocità media della fase di salita, mediata sulle ripetizioni della serie. È ciò che l'app confronta col target VBT."],
  ["Palestra e VBT", "MVT", "La velocità del tuo massimale.",
    "Minimal Velocity Threshold: la velocità (m/s) a cui il carico diventa un massimale. Cambia per esercizio: Squat ~0.30, Panca ~0.15, Stacco ~0.20. Serve a stimare l'1RM senza farlo davvero."],
  ["Palestra e VBT", "1RM", "Il massimale.",
    "One-Rep Max: il carico che sollevi una sola volta con tecnica corretta. È il riferimento da cui si calcolano le percentuali di lavoro."],
  ["Palestra e VBT", "%1RM", "Percentuale del massimale.",
    "La quota del massimale a cui lavori: 80% = 0,8 × 1RM. Le percentuali decidono se stai allenando forza (alte) o velocità/potenza (medio-basse)."],
  ["Palestra e VBT", "R²", "Quanto è affidabile la stima dell'1RM.",
    "Da 0 a 1: quanto bene i dati velocità-carico stanno su una retta. Vicino a 1 = stima molto affidabile; sotto 0,9 servono più serie o un'esecuzione più pulita."],
  ["Palestra e VBT", "TUT", "Tempo sotto tensione.",
    "Il ritmo di esecuzione, es. 3-1-0-1 = 3s in discesa (eccentrica), 1s di pausa in basso, 0s in salita (esplosiva), 1s in alto. Controlla il tipo di stimolo dell'esercizio."],
  ["Palestra e VBT", "Volume (kg)", "Il tonnellaggio in palestra.",
    "Serie × ripetizioni × peso (es. 4×5 a 100 kg = 2000 kg). Misura quanto lavoro totale hai fatto in palestra."],

  ["Pista e sprint", "Volume pista", "I metri totali in pista.",
    "Somma delle ripetute per i metri della seduta (es. 4×60 m + 6×30 m = 420 m). Misura il carico di corsa."],
  ["Pista e sprint", "Traino / Sled", "Sprint con resistenza.",
    "Sprint resistito trascinando una slitta (sled). Il carico si dosa in base al calo di velocità che provoca: leggeri per la velocità, pesanti per la forza-accelerazione. Vedi il profilo F-V sprint."],
  ["Pista e sprint", "Profilo F-V", "Forza vs velocità: dove sei carente.",
    "Il profilo Forza-Velocità (salti/sprint con metodo Morin-Samozino, bilanciere con la curva di Hill) dice se ti manca più <b>forza</b> (spingi poco) o più <b>velocità</b> (sei lento a esprimerla). Guida su cosa lavorare."],

  ["Test e salti", "CMJ e SJ", "Due salti che misurano la forza esplosiva.",
    "<b>CMJ</b> (Counter Movement Jump) = salto con contromovimento (ti pieghi e risali): usa l'elasticità. <b>SJ</b> (Squat Jump) = parti da fermo piegato, senza rimbalzo: misura la forza pura. La differenza tra i due dice quanto sfrutti l'elasticità."],
  ["Test e salti", "RSI", "Quanto sei reattivo nei salti.",
    "Reactive Strength Index = altezza del salto ÷ tempo di contatto a terra (di solito col drop jump). Più è alto, più sei esplosivo e 'rigido' al contatto — qualità chiave nello sprint. Si misura con app tipo My Jump. Rif.: &lt;1.5 scarso · 1.5-2.0 medio · 2.0-2.5 buono · &gt;2.5 ottimo."],
  ["Test e salti", "Squat Jump (SJ)", "Salto da fermo, senza rimbalzo.",
    "Parti da in piedi, scendi a ginocchia ~90° e <b>fermati 2-3 secondi</b>; poi salti più in alto possibile <b>senza riabbassarti</b> (nessun contromovimento). Mani ai fianchi. Misura la <b>forza esplosiva pura</b>. Se ti abbassi prima di saltare stai facendo un CMJ e il dato non vale."],
  ["Test e salti", "Drop Jump", "Il rimbalzo dopo la caduta.",
    "Scendi da un rialzo (20-60 cm) lasciandoti cadere (non salti verso l'alto dal box) e appena tocchi terra <b>risalti subito</b> col minimo tempo di contatto. Serve a misurare l'RSI e a trovare l'altezza di caduta ottimale."],
  ["Test e salti", "hPO", "La distanza di spinta nel salto.",
    "Push-off distance: l'altezza dell'anca (grande trocantere) a fine spinta in punta di piedi <b>meno</b> quella nella posizione di partenza (~90°). Serve al Profilo F-V salti. Si misura una volta, tipico 0.30-0.40 m."],
  ["Test e salti", "F0 / V0 / Pmax", "I numeri del profilo forza-velocità.",
    "<b>F0</b> = forza massima teorica (a velocità zero). <b>V0</b> = velocità massima teorica (a carico zero). <b>Pmax</b> = potenza massima (F0×V0/4). Lo squilibrio tra la tua pendenza e quella ottimale dice se ti manca più forza o più velocità."],
  ["Test e salti", "RFmax / Vmax", "Efficacia e velocità nello sprint.",
    "<b>Vmax</b> = velocità massima raggiunta nello sprint. <b>RFmax</b> = massima percentuale di forza applicata in orizzontale (efficacia tecnica della spinta): rif. velocisti ~45-60%. Bassa = spingi troppo verso il basso, poco in avanti."],
  ["Prevenzione", "Asimmetria dx/sx (LSI)", "Differenza tra le due gambe.",
    "Limb Symmetry Index: differenza percentuale tra lato destro e sinistro in un test (forza, mobilità, salto monopodalico). <b>&lt;10% ok · 10-15% attenzione · &gt;15% bandiera</b> (rischio infortunio, da correggere lavorando sul lato debole)."],
  ["Prevenzione", "KTW / AKE", "Due test di mobilità.",
    "<b>KTW</b> (Knee-To-Wall) = mobilità della caviglia in dorsiflessione (ginocchio verso il muro, tallone a terra; misuri la distanza alluce-muro). <b>AKE</b> (Active Knee Extension) = estensibilità degli ischiocrurali (supino, anca a 90°, estendi il ginocchio; misuri i gradi mancanti). Confronta sempre dx/sx."],

  ["Periodizzazione", "Mesociclo e Blocco", "Come è organizzato il programma.",
    "Il <b>mesociclo</b> è una fase di 3-4 settimane con un obiettivo, con le prime settimane in carico e l'ultima di <b>scarico</b>. Più mesocicli in fila formano la stagione, costruita da Piano & Picco verso la gara importante."],
  ["Periodizzazione", "Scarico", "La settimana 'leggera'.",
    "Settimana (di solito l'ultima del blocco) con volume e intensità ridotti: serve a recuperare, far salire la forma e trasformare il lavoro in prestazione. Nel calendario è la colonna più chiara."],
  ["Periodizzazione", "AA — Adattamento Anatomico", "Il primo blocco di forza.",
    "Fase iniziale che prepara tendini, articolazioni e struttura al carico e sistema la tecnica. Volumi medi, carichi non massimali: getta le fondamenta per i blocchi successivi."],
  ["Periodizzazione", "Mx-S — Forza massima", "Il blocco di forza pura.",
    "Maximum Strength: carichi alti e poche ripetizioni per alzare la forza massimale. È la base che poi si converte in potenza e velocità."],
  ["Periodizzazione", "Conversione a potenza", "Trasformare la forza in esplosività.",
    "Blocco in cui la forza costruita viene resa veloce/esplosiva con carichi più leggeri mossi rapidamente, pliometria e lavori specifici. Avvicina la forza alla gara."],
  ["Periodizzazione", "Mantenimento (P+MxS)", "Tenere forza e potenza in gara.",
    "Nel periodo competitivo si riduce il volume ma si mantiene lo stimolo di forza e potenza, per non perdere ciò che hai costruito mentre gareggi."],

  ["Sistemi energetici", "O2p — Potenza aerobica", "Il sistema aerobico.",
    "La capacità di produrre energia con l'ossigeno. Nello sprint conta soprattutto per il recupero tra le prove e per i 300-400 m."],
  ["Sistemi energetici", "P. alattacida", "Energia esplosiva immediata.",
    "Il sistema dei fosfati (ATP-PC): energia potentissima ma brevissima (fino a ~6-8 s). È ciò che usi negli sprint brevi e nei massimali."],
  ["Sistemi energetici", "P. lattacida", "Energia per prove intense medie.",
    "Produzione di energia ad alta intensità con accumulo di lattato, tipica delle prove sui 150-300 m."],
  ["Sistemi energetici", "Cap. lattacida", "Tolleranza al lattato.",
    "La capacità di reggere prove intense e prolungate accumulando lattato (prove lunghe/ripetute, tipiche dei 200-400 m)."],

  ["Prestazioni e costanza", "PB e Stagione", "I tuoi migliori tempi.",
    "<b>PB</b> (Personal Best) = miglior tempo di sempre su quella distanza. <b>Stagione</b> = miglior tempo dell'anno in corso. <b>Obiettivo</b> = il tempo a cui punti. Nella scheda atleta li vedi affiancati."],
  ["Prestazioni e costanza", "Aderenza", "Quanto segui il programma.",
    "Percentuale di allenamenti fatti su quelli programmati (es. 27 su 30 = 90%). È il primo segnale di costanza: un'aderenza che cala spesso anticipa cali di forma o fastidi."],

  ["Screening e gare", "PB in gara / in allenamento", "I record, separati.",
    "L'app tiene due liste. <b>PB in gara</b> = migliori tempi in competizione, dai risultati che registri nelle Gare. <b>PB in allenamento</b> = migliori tempi nelle sedute (pista) e nei test sprint. Così vedi il vero valore di gara e quello che esprimi in allenamento."],
  ["Screening e gare", "Screening", "Come sta andando l'atleta.",
    "Riepilogo su <b>settimana</b> e <b>mesociclo</b>: sedute, volume in pista, velocità VBT, gare, e soprattutto i <b>tempi per distanza</b> con la variazione rispetto al periodo precedente (verde = migliora, rosso = peggiora). Integra anche il <b>carico</b> (ACWR, forma, prontezza) per capire performance e freschezza insieme."],
  ["Screening e gare", "Mesociclo", "Il blocco di 3-4 settimane.",
    "Fase di allenamento con un obiettivo, di solito 3-4 settimane (le prime in carico, l'ultima di scarico). Lo screening del mesociclo mostra il trend su tutto il blocco: utile per capire se hai spostato la qualità che volevi."]
];

// Guida all'app: [titolo, riga breve, spiegazione HTML]. Si tocca per leggere tutto.
const METIS_LONG = `<p style="font-size:16px;font-weight:600;color:var(--txt)">«Chi non pianifica è destinato a fallire.»</p>
<p>Nella cultura greca, <i>Mētis</i> rappresenta l'intelligenza strategica, la saggezza pratica e la capacità di prevedere, adattarsi e scegliere la strada migliore per raggiungere un obiettivo.</p>
<p>Da questa filosofia nasce <b>Metis Performance</b>. Un'app che non vuole dirti come allenare e non vuole sostituirsi all'esperienza, alle competenze e alle decisioni dell'allenatore. Vuole essere il tuo alleato, in pista, in palestra e fuori dal campo.</p>
<p>Uno strumento pensato per chi allena un singolo atleta o un'intera squadra e vuole avere tutto sotto mano: pianificare e programmare con semplicità, monitorare il lavoro svolto, analizzare il percorso e organizzare ciò che verrà.</p>
<p>Perché dietro ogni prestazione ci sono delle scelte. Dietro ogni obiettivo c'è un percorso. E dietro ogni grande risultato c'è una strategia.</p>
<p style="font-weight:600;color:var(--txt)">Pianifica. Programma. Monitora. Analizza. Adatta.</p>
<p>Le decisioni restano tue. <b>Metis ti aiuta a renderle migliori.</b> Per costruire, giorno dopo giorno, insieme ai tuoi atleti, la migliore versione di voi stessi.</p>
<p style="font-style:italic;color:var(--txt)">Questo è Metis Performance.<br>Intelligenza nella pianificazione. Strategia nell'allenamento. Visione nella performance.</p>`;
const GUIDA = [
  ["Cos'è Metis Performance", "La filosofia e lo scopo dell'app", METIS_LONG],
  ["Come funziona l'app", "Panoramica in 30 secondi",
    "Metis Performance replica il tuo Excel di programmazione velocità in un'app. Come allenatore hai: <b>Squadra</b> (colpo d'occhio), <b>Atleti</b> (scheda con PB, massimali, test), <b>Programma</b> (pista, palestra, piano annuale), <b>Analisi/Test</b> (calcolatori e batteria di test), <b>Monitoraggio</b> (screening, carico, infortuni, prevenzione), <b>Gare</b> e <b>Librerie</b> di esercizi con video.<br><br>I dati anagrafici, PB, massimali, test e infortuni stanno nel <b>database</b> (condiviso tra gli allenatori). I programmi e i calcoli restano per ora salvati sul dispositivo."],
  ["Squadra", "Il colpo d'occhio giornaliero",
    "La schermata iniziale dell'allenatore: per ogni atleta vedi lo stato (verde/giallo/rosso) da ACWR, forma, prontezza e aderenza, gli alert (asimmetrie, diario non compilato, sedute saltate) e la settimana di allenamento. Serve a capire in un attimo chi seguire."],
  ["Atleti e scheda", "Anagrafica, PB, massimali, test",
    "In <b>Atleti</b> aggiungi gli atleti e apri la loro <b>scheda</b>. Trovi: dati anagrafici, <b>🏆 PB in gara</b> (dai risultati delle Gare) e <b>🏋 PB in allenamento</b> (dai test sprint e dalle sedute di pista), <b>massimali di forza</b> e <b>salti/test</b>. Puoi aggiungere/eliminare voci; tutto si salva nel database."],
  ["Programma — Pista", "I mesocicli di corsa",
    "Imposti la settimana di pista (giorni × settimane) con le ripetute, i target di tempo e il riscaldamento (attivazione, mobilità, andature, ostacoli). Il mesociclo arriva dal Piano & Picco; nella settimana di scarico il volume cala in automatico. Il volume è la somma dei metri."],
  ["Programma — Palestra", "Forza, VBT e scarico",
    "Costruisci le sedute di forza: esercizi, serie, rep, %1RM (il peso si calcola dal massimale), TUT e velocità VBT target. Nella settimana di scarico i carichi degli esercizi con massimale scendono al 60% (modificabile) e la card diventa gialla."],
  ["Piano, Periodizzazione, Template", "La stagione",
    "<b>Piano & Picco</b>: pianifichi i picchi verso le gare importanti e vedi i grafici volume/intensità. <b>Periodizzazione</b>: la guida ai blocchi (AA, forza max, conversione, mantenimento). <b>Template microcicli</b>: schemi di settimana-tipo pronti."],
  ["Analisi e Test", "I calcolatori e la batteria",
    "La pagina <b>Test</b> è l'organizzatore: scegli l'atleta, premi <b>＋ Nuovo test</b> e scegli cosa fare (Prevenzione, CMJ/SJ, Sprint, Profilo F-V sprint, Drop Jump & RSI, Traino, Stima 1RM, Profilo F-V salti). In ogni test c'è <b>📖 Come si fa</b> (spiegazione passo-passo + video) e il pulsante per <b>salvare</b>: i risultati entrano nella scheda e nella progressione. Trovi anche il protocollo consigliato (ogni 8 settimane)."],
  ["Monitoraggio — Screening", "Come reagisce l'atleta",
    "Scegli l'atleta e vedi due riquadri, <b>Settimana</b> e <b>Mesociclo</b>: sedute, volume pista, VBT, gare, e i <b>tempi per distanza</b> con la variazione (verde = migliora). Un verdetto riassume l'andamento, con anche carico e freschezza (ACWR, forma, prontezza)."],
  ["Monitoraggio — Carico e forma", "ACWR, fitness, fatica",
    "Il carico di ogni seduta (RPE × durata) costruisce fitness (CTL), fatica (ATL) e forma (TSB). L'<b>ACWR</b> (carico recente ÷ abituale) dice se stai aumentando troppo in fretta: zona ideale 0.8-1.3, sopra 1.5 rischio. Colorato verde/giallo/rosso."],
  ["Infortuni e Prevenzione", "Registro e asimmetrie",
    "In <b>Infortuni</b> registri fastidi/infortuni (zona, lato, tipo, gravità, durata, stato) e li segni risolti; puoi segnalarne uno anche durante la seduta. In <b>Prevenzione</b> inserisci i test di asimmetria dx/sx (caviglia, hamstring, anca, salto monopodalico): l'app calcola la % e ti dice cosa fare sul lato debole, con gli esercizi (Nordic, Copenhagen…)."],
  ["Gare", "Risultati e calendario",
    "Con <b>＋ Registra risultato</b> segni data, distanza, tempo, vento, posizione: aggiorna in automatico il <b>PB in gara</b> dell'atleta e compare nello screening. Sotto trovi il calendario delle gare in programma."],
  ["Librerie e Diario", "Esercizi con video, benessere",
    "Le <b>Librerie</b> (Sala, Mobilità, Pliometria, Video) raccolgono gli esercizi con muscoli, indicazioni e video che si aprono dentro l'app. Il <b>Diario</b> raccoglie il benessere quotidiano degli atleti (sonno, stress, dolori, energia) da cui nasce la prontezza."]
];
function apriGuida(i) {
  const [t, , dett] = GUIDA[i];
  mostraFoglio(`
    <div class="foglio-top"><h3>${t}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    <div style="font-size:15px;line-height:1.7">${dett}</div>`);
}

function vistaAiuto() {
  let h = `<div class="card"><h3>Guida e glossario</h3>
    <p class="et" style="margin-top:2px">Come si usa l'app, spiegata sezione per sezione, e tutti i termini/acronimi. Tocca una voce per leggere tutto.</p></div>
    ${S.utente ? `<button class="btn btn-2" style="margin-bottom:12px" onclick="setOnboarding('tour')">▶ ${S.utente.ruolo === "coach" ? "Rivedi il tutorial allenatore" : "Rivedi il tutorial"}</button>` : ""}
    <p class="sez">Guida all'app</p>
    ${GUIDA.map(([t, breve], i) => `<div class="lib-row" onclick="apriGuida(${i})">
      <div style="flex:1;min-width:0"><div style="font-weight:600">${t}</div>
        <div class="et" style="margin-top:1px">${breve}</div></div>
      <span class="freccia">›</span></div>`).join("")}
    <p class="sez" style="margin-top:16px">Glossario</p>`;
  let sez = null;
  GLOSSARIO.forEach(([s, t, breve], i) => {
    if (s !== sez) { h += `<p class="sez">${s}</p>`; sez = s; }
    h += `<div class="lib-row" onclick="apriGlossario(${i})">
      <div style="flex:1;min-width:0"><div style="font-weight:600">${t}</div>
        <div class="et" style="margin-top:1px">${breve}</div></div>
      <span class="freccia">›</span></div>`;
  });

  // Tabella semaforo ACWR (come nella Legenda dell'Excel)
  const acwr = [
    ["&lt; 0.80", "Carico basso: rischio sotto-stimolo. Puoi aumentare gradualmente.", "var(--verde)"],
    ["0.80 – 1.30", "Zona ottimale: progressione sicura del carico.", "var(--verde)"],
    ["1.31 – 1.50", "Attenzione: carico in rapida salita. Occhio a fatica e sensazioni.", "var(--giallo)"],
    ["&gt; 1.50", "Rischio infortunio alto: scarica / riduci il carico.", "var(--rosso)"]
  ];
  h += `<p class="sez">Semaforo ACWR</p>
    <div class="card">${acwr.map(([v, d, c]) => `
      <div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)">
        <b style="color:${c};min-width:78px">${v}</b>
        <span style="font-size:13px;color:var(--txt2)">${d}</span></div>`).join("")}
      <p class="et" style="margin-top:8px">L'ACWR nel monitoraggio è colorato con questi stessi livelli.</p>
    </div>`;
  return h;
}

function apriGlossario(i) {
  const [, t, , dett] = GLOSSARIO[i];
  mostraFoglio(`
    <div class="foglio-top"><h3>${t}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    <p style="font-size:15px;line-height:1.7">${dett}</p>`);
}

// ---------- onboarding atleta: dati → personali → tutorial guidato ----------
// Testo introduttivo (prima schermata del tutorial)
const METIS_INTRO = `<b style="font-size:18px">«Chi non pianifica è destinato a fallire.»</b><br><br>
Nella cultura greca, <i>Mētis</i> rappresenta l'intelligenza strategica, la saggezza pratica e la capacità di prevedere e scegliere la strada migliore.<br><br>
Da questa filosofia nasce <b>Metis Performance</b>: non per sostituire l'allenatore, non per dirti come allenare, ma per essere il tuo alleato nella <b>pianificazione</b>, nella <b>programmazione</b> e nel <b>monitoraggio</b> dell'allenamento.<br><br>
Le decisioni restano tue. <b>Metis ti aiuta a renderle migliori.</b>`;
const TOUR = [
  ["", "Metis Performance", METIS_INTRO],
  ["◧", "Oggi — le tue sedute", "Nella pagina <b>Oggi</b> trovi l'allenamento del giorno preparato dall'allenatore (pista o palestra): aprilo, segna i tempi o le serie mentre ti alleni e <b>chiudi la seduta</b> con durata e RPE. Così i tuoi dati tornano all'allenatore."],
  ["✎", "Diario — ogni giorno", "Ogni mattina compila il <b>Diario</b> (sonno, stress, dolori, energia): bastano 30 secondi e aiuta l'allenatore a dosare il carico. Sii onesto, non lo vedi tu il punteggio."],
  ["◉", "I miei dati e i personali", "In <b>I miei dati</b> ci sono la tua anagrafica e i tuoi <b>PB (personali)</b>. Tienili aggiornati: dai tuoi PB l'app calcola i <b>tempi da fare</b> in allenamento, su misura per te."],
  ["★", "Gare — i tuoi risultati", "In <b>Gare</b> vedi le prossime gare e registri i tuoi risultati con «＋ Registra risultato»: il tempo aggiorna in automatico il tuo <b>PB in gara</b>."],
  ["▤", "Librerie con i video", "In <b>Librerie</b> (Sala, Mobilità, Pliometria, Video) trovi gli esercizi spiegati, con i video che si aprono dentro l'app: usale quando non ricordi un esercizio."],
  ["◍", "Presenze e Calendario", "In <b>Presenze</b> vedi quanti allenamenti hai fatto sul totale programmato; nel <b>Calendario</b> il tuo programma della settimana, giorno per giorno."],
  ["?", "Guida e glossario", "Non sai cosa vuol dire un termine (RSI, ACWR, TUT…)? È tutto spiegato in <b>Guida e glossario</b>. Puoi rivedere questo tutorial da lì quando vuoi. Buon allenamento! 💪"]
];
// Tutorial ALLENATORE (per i tecnici che aggiungi)
const TOUR_COACH = [
  ["", "Metis Performance", METIS_INTRO],
  ["◧", "Squadra — il colpo d'occhio", "La schermata <b>Squadra</b> ti mostra ogni atleta con lo stato (verde/giallo/rosso) da carico, forma, prontezza e aderenza, più gli alert (diario mancante, sedute saltate, fastidi). In un attimo capisci chi seguire."],
  ["◉", "Atleti e schede", "In <b>Atleti</b> aggiungi gli atleti (nome + email), apri la loro scheda con PB, massimali e test, e ne modifichi i dati. Ogni atleta è raggruppato per disciplina (velocità, lanci, mezzofondo)."],
  ["▦", "Programma madre", "In <b>Programma → Pista/Palestra</b> scrivi il programma UNA volta per tutta la società: distanze e % velocità (i tempi escono dal PB di ogni atleta), esercizi e %1RM (il peso dal massimale). Si salva da solo e gli atleti lo vedono subito sul loro calendario."],
  ["✎", "Su misura per il singolo", "Dal dettaglio di un atleta puoi <b>spostargli i giorni</b> e <b>adattargli il contenuto</b> (meno ripetute, carico diverso) senza toccare il programma madre: vale solo per lui."],
  ["◍", "Monitoraggio", "In <b>Monitoraggio</b> vedi lo <b>Screening</b> (tempi/VBT per periodo), il <b>Carico e forma</b> (ACWR, TSB), il <b>Diario</b> giorno per giorno e gli <b>Infortuni</b>. Sono dati veri: nascono da ciò che gli atleti svolgono e scrivono."],
  ["◭", "Analisi e Test", "In <b>Analisi</b> trovi Velocità target, Profilo F-V, Stima 1RM, Traino, Monitoraggio VBT, Drop Jump/RSI e la batteria Test. Ogni test ha «Come si fa» con video."],
  ["⇅", "Report ed Export", "Nel dettaglio atleta c'è il <b>Report PDF completo</b>; in <b>Import/Export</b> il backup e il <b>Report Excel con grafici</b> (per analisi e presentazioni)."],
  ["?", "Guida e glossario", "Dubbi su un termine (ACWR, RSI, TUT…)? È tutto in <b>Guida e glossario</b>, dove puoi anche rivedere questo tutorial. Buon lavoro! 💪"]
];
function _tourCorrente() { return (S.utente && S.utente.ruolo === "coach") ? TOUR_COACH : TOUR; }
function setOnboarding(fase) { S.onboarding = fase; S.tourStep = 0; if (fase !== "tour") S.modificaDati = null; disegna(); window.scrollTo(0, 0); }
function tourAvanti() { if (S.tourStep < _tourCorrente().length - 1) { S.tourStep++; disegna(); window.scrollTo(0, 0); } else tourFine(); }
function tourIndietro() { if (S.tourStep > 0) { S.tourStep--; disegna(); window.scrollTo(0, 0); } }
function tourFine() {
  if (S.utente && S.utente.ruolo === "coach") { try { localStorage.setItem("metis_tut_coach", "1"); } catch (e) { } }
  S.onboarding = null; S.tourStep = 0; S.vista = (S.utente && S.utente.ruolo === "coach") ? "squadra" : "oggi"; disegna(); window.scrollTo(0, 0);
}
function vistaTutorial() {
  const TR = _tourCorrente();
  const [ic, tit, txt] = TR[S.tourStep] || TR[0];
  const n = TR.length, ultimo = S.tourStep === n - 1, primo = S.tourStep === 0;
  const punti = TR.map((_, i) => `<span style="width:8px;height:8px;border-radius:50%;background:${i === S.tourStep ? "var(--blu)" : "var(--line2)"}"></span>`).join("");
  return `
  <div style="min-height:70vh;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:20px 8px">
    ${primo
      ? `<img src="icon-192.png" alt="logo" style="width:104px;height:104px;border-radius:24px;margin:0 auto 18px;display:block;box-shadow:0 8px 30px rgba(0,0,0,.35)">`
      : `<div style="font-size:54px;margin-bottom:14px">${ic}</div>`}
    <h2 style="font-size:${primo ? "28" : "24"}px;margin-bottom:12px">${tit}</h2>
    <p style="font-size:${primo ? "15" : "16"}px;line-height:1.7;color:var(--txt2);max-width:540px;margin:0 auto;${primo ? "text-align:left" : ""}">${txt}</p>
    <div style="display:flex;gap:8px;justify-content:center;margin:22px 0">${punti}</div>
    <div style="display:flex;gap:10px;max-width:420px;margin:0 auto;width:100%">
      ${S.tourStep > 0 ? `<button class="btn btn-2" onclick="tourIndietro()">‹ Indietro</button>` : ""}
      <button class="btn" onclick="tourAvanti()">${ultimo ? "Inizia! 🚀" : "Avanti ›"}</button>
    </div>
    <button class="link-indietro" style="margin-top:14px" onclick="tourFine()">Salta il tutorial</button>
  </div>`;
}

function vistaInArrivo(titolo, foglio) {
  return `<div class="card">
    <h3>${titolo}</h3>
    <p class="et" style="margin-top:6px">Questa parte si gestisce nell'Excel${foglio ? ` (foglio «${foglio}»)` : ""}: è il nostro file di riferimento per programmazione e analisi. I dati entreranno in app con l'import, quando collegheremo il database.</p>
    ${foglio ? `<div style="margin-top:12px;padding:10px 12px;background:var(--blu-bg);border-radius:var(--r)">
      <p style="font-size:12px;color:var(--blu)">📄 Excel · foglio «${foglio}»</p></div>` : ""}
  </div>`;
}

// (le viste dell'allenatore stanno in coach.js)

// ---------- disegno ----------
function disegnaMenu(menu) {
  return menu.map(m => {
    if (m.k) return `<a class="${S.vista === m.k ? "on" : ""}" onclick="vai('${m.k}')">
        <span class="ic">${m.ic}</span>${m.l}</a>`;
    const aperto = !!S.gruppi[m.g] || m.subs.some(s => s[0] === S.vista);
    return `<a class="gr" onclick="apriGruppo('${m.g}')">
        <span class="ic">${m.ic}</span><span style="flex:1">${m.g}</span>
        <span class="ic" style="font-size:12px">${aperto ? "▾" : "▸"}</span></a>
      ${aperto ? `<div class="sub">${m.subs.map(([k, l]) =>
        `<a class="${S.vista === k ? "on" : ""}" onclick="vai('${k}')">${l}</a>`).join("")}</div>` : ""}`;
  }).join("");
}

function disegna() {
  const r = $("radice");
  if (!S.utente) { r.innerHTML = vistaLogin(); return; }

  const coach = S.utente.ruolo === "coach";
  const menu = coach ? MENU_COACH : MENU_ATLETA;
  let corpo;
  if (S.onboarding === "tour") corpo = vistaTutorial();
  else if (S.modificaDati) corpo = vistaModificaDati();
  else if (S.infortunio) corpo = vistaInfortunioForm();
  else if (S.risultatoGara) corpo = vistaRisultatoGaraForm();
  else if (S.seduta) corpo = vistaSeduta();
  else if (coach && S.spostaGiorni) corpo = vistaSpostaGiorni();
  else if (coach && S.adatta) corpo = vistaAdatta();
  else if (coach && S.sedSvolte) corpo = vistaSeduteSvolte();
  else if (coach && S.report) corpo = vistaReportAtleta();
  else if (coach && S.atletaSel && S.mostraScheda) corpo = vistaSchedaAtleta();
  else if (coach && S.atletaSel) corpo = vistaAtletaDettaglio();
  else if (coach && S.diarioAtleta) corpo = vistaDiarioAtleta();
  else if (coach && S.vista === "squadra") corpo = vistaSquadra();
  else if (coach && S.vista === "atleti") corpo = vistaAtleti();
  else if (coach && S.vista === "cal-squadra") corpo = vistaCalendarioSquadra();
  else if (coach && S.vista === "report") corpo = vistaReport();
  else if (coach && S.vista === "riscaldamento") corpo = vistaRiscaldamento();
  else if (coach && S.vista === "piano") corpo = vistaPiano();
  else if (coach && S.vista === "periodizzazione") corpo = vistaPeriodizzazione();
  else if (coach && S.vista === "pista") corpo = vistaProgrammaPista();
  else if (coach && S.vista === "palestra") corpo = vistaProgrammaPalestra();
  else if (coach && S.vista === "vel-target") corpo = vistaVelocitaTarget();
  else if (coach && S.vista === "ritmi-mezzo") corpo = vistaRitmiMezzofondo();
  else if (coach && S.vista === "test-lattato") corpo = vistaTestLattato();
  else if (coach && S.vista === "critical-speed") corpo = vistaCriticalSpeed();
  else if (coach && S.vista === "riepilogo-test") corpo = vistaRiepilogoTest();
  else if (coach && S.vista === "per-distanza") corpo = vistaPerDistanza();
  else if (coach && S.vista === "guida-mezzi") corpo = vistaGuidaMezzi();
  else if (coach && S.vista === "guida-test") corpo = vistaGuidaTest();
  else if (coach && S.vista === "guida-mezzi-lanci") corpo = guidaMezziLanciHTML();
  else if (coach && S.vista === "esercizi-speciali") corpo = vistaEserciziSpeciali();
  else if (coach && S.vista === "profilo-attrezzo") corpo = vistaProfiloAttrezzo();
  else if (coach && S.vista === "periodizzazione-lanci") corpo = vistaPeriodizzazioneLanci();
  else if (coach && S.vista === "stima1rm") corpo = vistaStima1RM();
  else if (coach && S.vista === "traino") corpo = vistaTraino();
  else if (coach && S.vista === "fv") corpo = vistaProfiloFV();
  else if (coach && S.vista === "andamento-pista") corpo = vistaAndamentoPista();
  else if (coach && S.vista === "andamento-palestra") corpo = vistaAndamentoPalestra();
  else if (coach && S.vista === "fv-sprint") corpo = vistaProfiloFVSprint();
  else if (coach && S.vista === "dropjump") corpo = vistaDropJump();
  else if (coach && S.vista === "cmj") corpo = vistaCMJ();
  else if (coach && S.vista === "sprint-test") corpo = vistaSprintTest();
  else if (coach && S.vista === "vbt") corpo = vistaMonitoraggioVBT();
  else if (coach && S.vista === "test") corpo = vistaTest();
  else if (coach && S.vista === "template") corpo = vistaTemplate();
  else if (coach && S.vista === "screening") corpo = vistaScreening();
  else if (coach && S.vista === "carico") corpo = vistaCarico();
  else if (coach && S.vista === "infortuni") corpo = vistaInfortuni();
  else if (coach && S.vista === "prevenzione") corpo = vistaPrevenzione();
  else if (coach && S.vista === "presenze") corpo = vistaPresenzeCoach();
  else if (coach && S.vista === "diario-c") corpo = vistaDiarioCoach();
  else if (coach && S.vista === "dati") corpo = vistaImportExport();
  else if (!coach && S.vista === "oggi") corpo = vistaOggi();
  else if (!coach && S.vista === "calendario") corpo = vistaCalendario();
  else if (!coach && S.vista === "diario") corpo = vistaDiario();
  else if (!coach && S.vista === "io") corpo = vistaIo();
  else if (!coach && S.vista === "presenze") corpo = vistaPresenze();
  else if (LIB[S.vista]) corpo = vistaLibreria(LIB[S.vista][0], LIB[S.vista][1]);
  else if (S.vista === "lib-video") corpo = vistaLibreriaVideo();
  else if (S.vista === "gare") corpo = vistaGare();
  else if (S.vista === "aiuto") corpo = vistaAiuto();
  else corpo = vistaInArrivo(titoloVista(S.vista, menu), DA_EXCEL[S.vista]);

  const oggi = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  r.innerHTML = `
    <div class="ombra" id="ombra" onclick="apriMenu()"></div>
    <aside class="lato" id="lato">
      <div style="padding:0 12px 6px"><div style="font-size:19px;font-weight:600">${CONFIG.nome}</div>
        <div style="font-size:12px;color:var(--txt3)">${S.utente.nome}</div></div>
      <div class="tit">${coach ? "Allenatore" : "Atleta"}</div>
      ${disegnaMenu(menu)}
      <div class="tit">Account</div>
      <a onclick="esci()"><span class="ic">⏻</span>Esci</a>
      <div style="padding:14px 12px 4px;font-size:11px;color:var(--txt3)">${CONFIG.nome} · versione ${CONFIG.versione}</div>
    </aside>

    <div class="top">
      <button class="hamb" onclick="apriMenu()" aria-label="Menù"><i></i><i></i><i></i></button>
      <div><div class="nome">Ciao ${S.utente.nome.split(" ")[0]}</div><div class="data">${oggi}</div></div>
    </div>
    <div class="main">${corpo}</div>`;
  aggiornaMenu();
}

if (typeof caricaCustom === "function") caricaCustom();
if (typeof avvioApp === "function") { avvioApp(); }
else { ripristina(); disegna(); }
