// Avvio, accesso, menù laterale e disegno delle schermate.
const S = { utente: null, vista: "oggi", seduta: null, menu: false, gruppi: {}, atletaSel: null, calModo: "mesociclo", libCat: null, routineEdit: null };
const $ = (id) => document.getElementById(id);

// ---------- menù: tutti i fogli, raggruppati ----------
const MENU_ATLETA = [
  { k: "oggi", ic: "◧", l: "Oggi" },
  { k: "calendario", ic: "▦", l: "Calendario" },
  { k: "diario", ic: "✎", l: "Diario" },
  { g: "Librerie", ic: "▤", subs: [["lib-sala", "Sala"], ["lib-mobilita", "Mobilità"], ["lib-video", "Video"], ["lib-plio", "Pliometria"]] },
  { k: "io", ic: "◉", l: "I miei dati" },
  { k: "presenze", ic: "◍", l: "Presenze" },
  { k: "aiuto", ic: "?", l: "Aiuto e glossario" }
];

const MENU_COACH = [
  { k: "squadra", ic: "◧", l: "Squadra" },
  { k: "atleti", ic: "◉", l: "Atleti" },
  { k: "cal-squadra", ic: "▦", l: "Calendario squadra" },
  { g: "Programma", ic: "▦", subs: [
    ["pista", "Pista"], ["palestra", "Palestra"], ["riscaldamento", "Riscaldamento"],
    ["template", "Template microcicli"], ["piano", "Piano e picco"], ["periodizzazione", "Periodizzazione"]] },
  { g: "Analisi", ic: "◭", subs: [
    ["test", "Test"], ["fv", "Profilo F-V"], ["fv-sprint", "Profilo F-V sprint"],
    ["stima1rm", "Stima 1RM"], ["vel-target", "Velocità target"], ["traino", "Traino"],
    ["vbt", "Monitoraggio VBT"], ["andamento", "Andamento"]] },
  { g: "Monitoraggio", ic: "◍", subs: [
    ["carico", "Carico e forma"], ["infortuni", "Infortuni"], ["presenze", "Presenze"], ["diario-c", "Diario"]] },
  { g: "Librerie", ic: "▤", subs: [["lib-sala", "Sala"], ["lib-mobilita", "Mobilità"], ["lib-video", "Video"], ["lib-plio", "Pliometria"]] },
  { k: "gare", ic: "★", l: "Gare" },
  { k: "report", ic: "✉", l: "Report settimanale" },
  { k: "aiuto", ic: "?", l: "Aiuto e glossario" }
];

// Da quale foglio dell'Excel arriva ogni voce (serve a non perdere niente)
const DA_EXCEL = {
  squadra: "Cruscotto", atleti: "Atleta", io: "Atleta",
  pista: "Pista", palestra: "Palestra", riscaldamento: "Riscaldamento",
  template: "Template microcicli", piano: "Piano & Picco", periodizzazione: "Periodizzazione",
  test: "Test", fv: "Profilo F-V", "fv-sprint": "Profilo F-V Sprint", stima1rm: "Stima 1RM",
  "vel-target": "Velocita target", traino: "Traino (Sled)", vbt: "Monitoraggio VBT",
  andamento: "Andamento Palestra + Andamento Pista", carico: "Carico & Forma",
  infortuni: "Infortuni & Prevenzione", presenze: "Presenze", "diario-c": "Diario",
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

function titoloVista(v, menu) {
  for (const m of menu) {
    if (m.k === v) return m.l;
    if (m.subs) { const s = m.subs.find(x => x[0] === v); if (s) return s[1]; }
  }
  return "In arrivo";
}

// ---------- accesso ----------
function entra(ruolo) {
  S.utente = DEMO.utenti.find(u => u.ruolo === ruolo);
  S.vista = ruolo === "coach" ? "squadra" : "oggi";
  localStorage.setItem("utente", S.utente.id);
  disegna();
}
function esci() {
  S.utente = null; S.seduta = null; S.vista = "oggi"; S.menu = false;
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
  return `<div class="login">
    <h1>${CONFIG.nome}</h1>
    <p class="sub">Allenamento e monitoraggio</p>
    <div class="campo"><label>Email</label><input type="email" placeholder="nome@esempio.it"></div>
    <div class="campo"><label>Password</label><input type="password" placeholder="••••••••"></div>
    <button class="btn" onclick="entra('atleta')">Entra</button>
    <div class="demo-nota"><b>Anteprima</b> — il collegamento al database arriva al prossimo passo. Intanto entra come:
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-2" onclick="entra('atleta')">Atleta</button>
        <button class="btn btn-2" onclick="entra('coach')">Allenatore</button>
      </div></div>
  </div>`;
}

function apriMenu() { S.menu = !S.menu; aggiornaMenu(); }
function aggiornaMenu() {
  $("lato").classList.toggle("on", S.menu);
  $("ombra").classList.toggle("on", S.menu);
}
function apriGruppo(g) { S.gruppi[g] = !S.gruppi[g]; disegna(); }
function vai(v) { S.vista = v; S.seduta = null; S.atletaSel = null; S.libCat = null; S.routineEdit = null; S.menu = false; disegna(); window.scrollTo(0, 0); }

// ---------- atleta: cruscotto a quadranti ----------
function vistaOggi() {
  const a = DEMO.atleti[0], m = DEMO.mesociclo, g = DEMO.prossimaGara;
  const s = DEMO.sedute.find(x => x.quando === "oggi");
  const lavoro = s.tipo === "pista"
    ? s.elementi.map(e => `${e.ripetute}×${e.distanza} m`).join(" · ")
    : s.esercizi.slice(0, 3).map(e => e.nome).join(" · ");
  const tacche = Array.from({ length: m.settimaneTotali },
    (_, i) => `<i class="${i < m.settimanaCorrente ? "on" : ""}"></i>`).join("");
  const ad = Math.round(a.presenzeStagione[0] / a.presenzeStagione[1] * 100);
  const d = DEMO.diarioOggi, fatto = d.salvato && diarioCompleto(d);

  return `
  <div class="card oggi" onclick="apriSeduta('${s.id}')">
    <p class="et">Allenamento di oggi</p>
    <h3>${s.tipo === "pista" ? "Pista" : "Palestra"} · giorno ${s.giorno}</h3>
    <p class="et" style="color:#dbe9ff">${lavoro}</p>
  </div>

  <div class="quadri">
    <div class="q wide" onclick="vai('calendario')">
      <div><div class="k">Dove sei nel programma</div>
        <div class="v s">Mesociclo ${m.numero} — ${m.blocco}</div>
        <div class="d">settimana ${m.settimanaCorrente} di ${m.settimaneTotali} · ${m.dal} – ${m.al}</div></div>
      <div class="tacche">${tacche}</div>
    </div>

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

    <div class="q wide" onclick="vai('io')">
      <div class="k">Ultimi test</div>
      <div class="d" style="margin-top:6px;font-size:13px;color:var(--txt)">
        ${a.test.map(([n, v, dd]) => `${n} <b>${v}</b> <span style="color:var(--verde)">${dd}</span>`).join(" &nbsp;·&nbsp; ")}
      </div>
    </div>
  </div>`;
}

function apriSeduta(id) { S.seduta = id; T.id = null; fermaTimer(); disegna(); window.scrollTo(0, 0); }

function vistaInArrivo(titolo, foglio) {
  return `<div class="card">
    <h3>${titolo}</h3>
    <p class="et" style="margin-top:6px">Questo pezzo lo costruiamo nei prossimi giorni.</p>
    ${foglio ? `<div style="margin-top:12px;padding:10px 12px;background:var(--blu-bg);border-radius:var(--r)">
      <p style="font-size:12px;color:var(--blu)">Arriva dal foglio Excel «${foglio}»</p></div>` : ""}
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
  if (S.seduta) corpo = vistaSeduta();
  else if (coach && S.atletaSel) corpo = vistaAtletaDettaglio();
  else if (coach && S.vista === "squadra") corpo = vistaSquadra();
  else if (coach && S.vista === "atleti") corpo = vistaAtleti();
  else if (coach && S.vista === "cal-squadra") corpo = vistaCalendarioSquadra();
  else if (coach && S.vista === "report") corpo = vistaReport();
  else if (coach && S.vista === "riscaldamento") corpo = vistaRiscaldamento();
  else if (!coach && S.vista === "oggi") corpo = vistaOggi();
  else if (!coach && S.vista === "calendario") corpo = vistaCalendario();
  else if (!coach && S.vista === "diario") corpo = vistaDiario();
  else if (!coach && S.vista === "io") corpo = vistaIo();
  else if (!coach && S.vista === "presenze") corpo = vistaPresenze();
  else if (LIB[S.vista]) corpo = vistaLibreria(LIB[S.vista][0], LIB[S.vista][1]);
  else if (S.vista === "lib-video") corpo = vistaLibreriaVideo();
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
    </aside>

    <div class="top">
      <button class="hamb" onclick="apriMenu()" aria-label="Menù"><i></i><i></i><i></i></button>
      <div><div class="nome">Ciao ${S.utente.nome.split(" ")[0]}</div><div class="data">${oggi}</div></div>
    </div>
    <div class="main">${corpo}</div>`;
  aggiornaMenu();
}

ripristina();
disegna();
