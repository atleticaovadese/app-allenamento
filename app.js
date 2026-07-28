// Avvio, accesso, menù laterale e disegno delle schermate.
const S = { utente: null, vista: "oggi", seduta: null, menu: false, gruppi: {}, atletaSel: null, calModo: "mesociclo", libCat: null, routineEdit: null, esercizioEdit: null, mostraScheda: false, nuovoAtleta: null, pianoGrafici: false, pistaMeso: 0, pistaGiorno: 0 };
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
  { k: "dati", ic: "⇅", l: "Import / Export" },
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
  return `<div class="login">
    <h1>${CONFIG.nome}</h1>
    <p class="sub">Allenamento e monitoraggio</p>
    <div id="loginErr" class="login-err" style="display:none"></div>
    <div class="campo"><label>Email</label><input id="inEmail" type="email" placeholder="nome@esempio.it"></div>
    <div class="campo"><label>Password</label>
      <input id="inPwd" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')accediUI()"></div>
    <button class="btn" onclick="accediUI()">Entra</button>
    <div class="demo-nota"><b>Anteprima</b> — per provare l'interfaccia senza account:
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-2" onclick="entra('atleta')">Atleta (demo)</button>
        <button class="btn btn-2" onclick="entra('coach')">Allenatore (demo)</button>
      </div></div>
  </div>`;
}
function accediUI() {
  const email = ($("inEmail") || {}).value || "";
  const pwd = ($("inPwd") || {}).value || "";
  if (typeof accedi === "function") accedi(email, pwd);
}

function apriMenu() { S.menu = !S.menu; aggiornaMenu(); }
function aggiornaMenu() {
  $("lato").classList.toggle("on", S.menu);
  $("ombra").classList.toggle("on", S.menu);
}
function apriGruppo(g) { S.gruppi[g] = !S.gruppi[g]; disegna(); }
function vai(v) { S.vista = v; S.seduta = null; S.atletaSel = null; S.libCat = null; S.routineEdit = null; S.esercizioEdit = null; S.mostraScheda = false; S.nuovoAtleta = null; S.pianoGrafici = false; S.pistaMeso = 0; S.pistaGiorno = 0; S.menu = false; disegna(); window.scrollTo(0, 0); }

// atleta attualmente loggato (o il primo, in anteprima)
function atletaCorrente() {
  return DEMO.atleti.find(x => S.utente && x.id === S.utente.atletaId) || DEMO.atleti[0];
}

// ---------- atleta: cruscotto a quadranti ----------
function vistaOggi() {
  const a = atletaCorrente(), m = DEMO.mesociclo, g = DEMO.prossimaGara;
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

// ---------- Gare (atleta e allenatore) ----------
function vistaGare() {
  const p = DEMO.prossimaGara;
  const righe = DEMO.gareProssime.map(g => `
    <div class="riga">
      <div><div style="font-weight:500">${g.luogo}</div>
        <div class="et">${g.gara} · obiettivo ${g.obiettivo}</div></div>
      <b>${g.data}</b></div>`).join("");
  return `
  <div class="card"><h3>Calendario gare</h3>
    <p class="et" style="margin-top:2px">La prossima e quelle in programma</p></div>
  <div class="card" style="border-color:var(--blu)">
    <p class="et" style="color:var(--blu)">Prossima gara · tra ${p.traSettimane} settimane</p>
    <h3 style="margin-top:4px">${p.luogo}</h3>
    <p class="et" style="margin-top:2px">${p.gara} · obiettivo ${p.obiettivo}</p>
  </div>
  <div class="card">
    <p class="et" style="margin-bottom:6px">In programma</p>
    ${righe || `<p class="et">Nessun'altra gara inserita.</p>`}
  </div>`;
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
    "Reactive Strength Index = altezza del salto ÷ tempo di contatto a terra (di solito col drop jump). Più è alto, più sei esplosivo e 'rigido' al contatto — qualità chiave nello sprint. Si misura con app tipo My Jump."],

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
    "Percentuale di allenamenti fatti su quelli programmati (es. 27 su 30 = 90%). È il primo segnale di costanza: un'aderenza che cala spesso anticipa cali di forma o fastidi."]
];

function vistaAiuto() {
  let h = `<div class="card"><h3>Aiuto e glossario</h3>
    <p class="et" style="margin-top:2px">Tutti i termini e gli acronimi che vedi nell'app e nell'Excel. Tocca una voce per leggere tutto.</p></div>`;
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
  if (S.seduta) corpo = vistaSeduta();
  else if (coach && S.atletaSel && S.mostraScheda) corpo = vistaSchedaAtleta();
  else if (coach && S.atletaSel) corpo = vistaAtletaDettaglio();
  else if (coach && S.vista === "squadra") corpo = vistaSquadra();
  else if (coach && S.vista === "atleti") corpo = vistaAtleti();
  else if (coach && S.vista === "cal-squadra") corpo = vistaCalendarioSquadra();
  else if (coach && S.vista === "report") corpo = vistaReport();
  else if (coach && S.vista === "riscaldamento") corpo = vistaRiscaldamento();
  else if (coach && S.vista === "piano") corpo = vistaPiano();
  else if (coach && S.vista === "periodizzazione") corpo = vistaPeriodizzazione();
  else if (coach && S.vista === "pista") corpo = vistaProgrammaPista();
  else if (coach && S.vista === "carico") corpo = vistaCarico();
  else if (coach && S.vista === "infortuni") corpo = vistaInfortuni();
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
