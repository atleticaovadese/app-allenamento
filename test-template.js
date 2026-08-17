// Pagine di riferimento (fedeli all'Excel): Test (batteria + protocolli) e Template microcicli.

// ---------- TEST ----------
const TEST_BATTERIA = [
  ["Sprint (tempi: meno = meglio)", [["20 m", "s"], ["30 m lanciato", "s"], ["30 m blocchi", "s"], ["60 m", "s"], ["100 m", "s"], ["150 m", "s"], ["Velocità max", "m/s"]]],
  ["Salti (My Jump: più = meglio)", [["CMJ", "cm"], ["SJ", "cm"], ["Drop jump", "cm"], ["Broad jump", "cm"], ["RSI", "index"]]],
  ["Forza (1RM o stima VBT)", [["Squat 1RM", "kg"], ["Panca 1RM", "kg"], ["Stacco 1RM", "kg"]]],
  ["Mobilità / Prevenzione", [["Caviglia (knee-to-wall)", "cm"], ["Hamstring (AKE)", "gradi"], ["Rotazione interna anca", "gradi"], ["Rotazione esterna anca", "gradi"], ["Overhead squat", "0-3"]]],
  ["Asimmetrie dx/sx (prevenzione)", [["Caviglia KTW dx / sx", "cm"], ["Hamstring AKE dx / sx", "gradi"], ["Rot. interna anca dx / sx", "gradi"], ["Salto monopodalico dx / sx", "cm"]]],
  ["Antropometria", [["Peso", "kg"]]]
];

const TEST_COME = [
  ["Caviglia — knee-to-wall", "In ginocchio, piede verso il muro, tallone SEMPRE a terra: spingi il ginocchio a toccare il muro. Allontana il piede finché tocca appena. Misura la distanza alluce-muro. ≥10 cm = ok; dolore davanti = blocco articolare, dietro = tensione soleo/Achille.", "https://www.youtube.com/watch?v=kbzYML05Vac"],
  ["Hamstring — AKE", "Supino, anca a 90° (coscia verticale, tenuta con le mani dietro la coscia), bacino neutro: estendi il ginocchio il più possibile. Misura i gradi che MANCANO all'estensione completa (0 = ginocchio dritto; ~40° = media). Meno gradi = femorale più lungo. Fai dx e sx.", "https://www.youtube.com/watch?v=HYYGRZJIYcA"],
  ["Rotazione anca INTERNA", "Seduto a bordo lettino, ginocchia a 90° (o prono, ginocchio a 90°), coscia ferma: ruota la tibia in FUORI → misuri la rotazione INTERNA dell'anca (gradi, inclinometro sulla tibia). È quella che entra nel semaforo: confronta dx/sx.", "https://www.youtube.com/shorts/M8WaZD5IS1c"],
  ["Rotazione anca ESTERNA (FABER)", "FABER / test di Patrick: supino, caviglia della gamba da testare appoggiata sopra il ginocchio opposto (figura del 4); lascia cadere il ginocchio verso il lettino. Valuta apertura/rotazione esterna e confronta dx/sx (dolore inguine/schiena = da approfondire).", "https://www.youtube.com/shorts/QkOK97JpC_I"],
  ["Overhead squat", "In piedi, bilanciere/bastone sopra la testa a braccia tese: 5 squat profondi. Valuta la qualità 0-3 (0 = compensi marcati: talloni che si alzano, ginocchia in dentro, busto molto in avanti; 3 = movimento pulito).", "https://www.youtube.com/watch?v=UvvY9I8oy3Q"],
  ["Salto monopodalico", "Salto in lungo da fermo su UNA gamba, atterra e resta fermo 2 s (se ti sbilanci, ripeti). Misura la distanza (tallone). Ripeti sull'altra gamba: differenza dx/sx >10-15% = bandiera.", "https://www.youtube.com/watch?v=OGvizp1oycU"]
];

function apriTestVideo(i) {
  const [nome, come, url] = TEST_COME[i];
  if (typeof apriVideo === "function") apriVideo(nome, url, "", come, "");
}

// --- HUB dei test: blocchi Mattina/Pomeriggio (protocollo consigliato) ---
const TEST_HUB = [
  ["🌅 Mattina — velocità, elasticità, reattività", [
    ["prevenzione", "Prevenzione / asimmetrie", "peso + screening dx/sx a freddo"],
    ["cmj", "CMJ e SJ (salti verticali)", "forza esplosiva + uso dell'elastico"],
    ["sprint-test", "Sprint — tempi", "20 m blocchi, 30 m lanciato…"],
    ["fv-sprint", "Profilo F-V Sprint", "F0 / V0 / Pmax dallo sprint"],
    ["dropjump", "Drop Jump & RSI", "reattività, altezza di caduta ottimale"],
    ["traino", "Traino / Sled", "carichi per zona (per ultimo, affatica)"]
  ]],
  ["🌇 Pomeriggio — forza (≥4-6 h dopo)", [
    ["stima1rm", "Stima 1RM (VBT)", "Squat, Panca, Stacco → massimali"],
    ["fv", "Profilo F-V salti", "squilibrio forza-velocità (opz.)"]
  ]]
];

// spiegazione + video per ogni test: [titolo, testo, urlVideoEmbed, ricercaYouTube]
// [titolo, teaser (riga breve), spiegazione HTML completa, url video, ricerca YouTube]
const TEST_INFO = {
  cmj: ["CMJ e SJ (salti verticali)", "Come si fa il salto e la differenza elastica",
    "<b>Due salti, mani sempre ai fianchi.</b><br><br><b>CMJ (con contromovimento):</b> in piedi, ti pieghi rapidamente (~90°) e risali <b>in un'unica azione</b> esplosiva, saltando più in alto possibile. Sfrutta l'elastico.<br><br><b>SJ (squat jump):</b> scendi a ginocchia ~90° e <b>resta fermo 2-3 secondi</b> in quella posizione, poi salti <b>senza riabbassarti</b> (niente rimbalzo). Misura la forza pura.<br><br><b>Come rilevare:</b> altezza col telefono (My Jump) o pedana; 2-3 tentativi per salto, tieni il migliore.<br><br>La <b>differenza CMJ − SJ</b> dice quanto usi l'elastico: alta = ottimo ciclo allungamento-accorciamento; vicino a 0 = da migliorare la reattività.", "https://www.youtube.com/watch?v=rSaR_Aq38SQ", "counter+movement+jump+squat+jump+my+jump"],
  "sprint-test": ["Sprint — tempi", "Accelerazione e velocità massima, come cronometrare",
    "Stesse condizioni ogni volta (pista, scarpe, riscaldamento).<br><br><b>Accelerazione:</b> 20-30 m da fermo o dai blocchi, sempre nello stesso modo.<br><b>Velocità massima:</b> 30 m <b>lanciato</b> — fai ~20-30 m di rincorsa e cronometri solo i 30 m centrali.<br><br><b>Come rilevare:</b> meglio le fotocellule; in alternativa video ad alta frequenza (120-240 fps) con riferimenti a terra ogni 5-10 m.<br><br>Meno tempo = meglio. Registra il migliore di 2-3 prove ben recuperate.", "", "sprint+timing+test"],
  "fv-sprint": ["Profilo F-V Sprint", "Come rilevarlo (anche senza MySprint)",
    "Misura il forza-velocità della corsa da <b>uno sprint massimale</b> di 30-40 m, da riposato.<br><br><b>SENZA MySprint (tempi parziali):</b><br>1) Parti da fermo (3 punti o blocchi), sempre uguale.<br>2) Cronometra il <b>tempo cumulato</b> a più distanze: 5, 10, 15, 20, 30, 40 m. Bastano 2-3 punti, meglio 4-5. Usa fotocellule o video 240 fps con riferimenti a terra.<br>3) Inserisci i tempi nelle righe → il foglio calcola Vmax, F0, V0, Pmax, RFmax.<br>4) Inserisci anche <b>massa</b> e <b>altezza</b> (servono per la resistenza dell'aria); temperatura, vento e pressione se li hai (affinano la stima).<br><br><b>CON MySprint:</b> passa a «MySprint» e incolla F0/kg, V0, Pmax/kg, RFmax, Sfv/kg dall'app.<br><br>A massima spinta; ripeti nelle stesse condizioni.", "", "sprint+force+velocity+profile+morin"],
  dropjump: ["Drop Jump & RSI", "Come si esegue, la progressione e quanti tentativi",
    "Misura la <b>reattività</b>: quanto rimbalzi in fretta.<br><br>1) Sali su un rialzo e <b>lasciati cadere</b> giù (NON saltare verso l'alto dal box), atterrando sull'avampiede.<br>2) Appena tocchi terra <b>risalta subito</b> più in alto possibile, con il <b>minimo tempo di contatto</b> (immagina il terreno che scotta).<br>3) Misura tempo di contatto e altezza del salto (My Jump / OVR / pedana).<br><br><b>Progressione di altezze:</b> parti da 20 cm e sali → 30, 40, 50, 60 cm. Per <b>ogni altezza fai 2-3 tentativi</b> e tieni il migliore.<br><br>L'<b>RSI = altezza ÷ tempo di contatto</b>: l'altezza con l'RSI più alto è la tua <b>ottimale</b> per allenare i drop jump. Inseriscile tutte nella tabella: l'app segna l'ottimale con ★.<br><br>⚠️ Se le ginocchia si piegano molto o il contatto supera ~0.25 s stai facendo forza, non reattività: scendi di altezza.", "https://www.youtube.com/watch?v=LrZuW-sJPBo", "drop+jump+RSI+reactive+strength"],
  traino: ["Traino / Sled", "Come trovare i carichi giusti",
    "Trova i carichi di traino (sled) per ogni obiettivo, col metodo Morin-Samozino.<br><br>1) Fai alcuni sprint sulla <b>stessa distanza</b> (20-30 m) a massima spinta: uno <b>senza traino (0 kg)</b> e 1-2 con carichi diversi.<br>2) Cronometra ogni prova → il foglio calcola la velocità e stima V0 e la pendenza.<br>3) Ottieni i <b>carichi per zona</b> dal calo di velocità: tecnica, velocità, potenza, forza.<br><br>Recupera bene tra le prove (è molto affaticante: mettila per ultima). Serve il peso corporeo per il %BM.", "", "resisted+sprint+sled+load+velocity"],
  stima1rm: ["Stima 1RM da VBT", "Come stimarlo senza fare il massimale",
    "Stima l'1RM dalla velocità del bilanciere, senza andare a cedimento.<br><br>1) Scegli l'esercizio; fai <b>3-5 singole a carichi crescenti</b> (es. 60, 70, 80, 85%), ognuna alla <b>massima velocità possibile</b>.<br>2) Registra la <b>velocità media</b> di ogni alzata (encoder o app VBT).<br>3) La retta carico-velocità stima l'1RM alla <b>MVT</b> (velocità minima dell'esercizio).<br><br>Più alto è l'R², più affidabile la stima. Da riposato; ripeti ogni ~8 settimane per ricalibrare le percentuali.", "", "velocity+based+training+1RM+estimation"],
  fv: ["Profilo F-V salti", "Squat jump: come tenerlo fermo e cosa serve",
    "<b>Squat jump — NON è il CMJ.</b><br><br>1) Mani ai fianchi, piedi larghezza spalle.<br>2) Scendi in mezzo squat (ginocchia ~90°) e <b>FERMATI 2-3 secondi</b> in questa posizione: niente rimbalzo, niente molleggio.<br>3) Al via <b>salta più in alto possibile senza riabbassarti prima</b> (nessun contromovimento).<br>4) Atterra e ripeti.<br><br><b>Come rilevare:</b> altezza col telefono (My Jump) o pedana. Fai il test a <b>carichi crescenti</b>: a corpo libero, poi bilanciere leggero, +10/20 kg per volta (2-6 prove, 2-3 tentativi per carico, tieni il migliore).<br><br>Servono anche <b>massa corporea</b> e <b>hPO</b> (distanza di spinta): altezza dell'anca a fine spinta in punta di piedi <b>meno</b> quella nella posizione di partenza; misurala una volta (~0.30-0.40 m).<br><br>⚠️ Se ti abbassi prima di saltare stai facendo un CMJ: il dato non è valido. Guarda il video.",
    "https://youtube.com/shorts/UYUjHgzXgeU", "squat+jump+test+force+velocity"]
};
// apre la finestra "Come si fa": spiegazione completa + video in-app (o ricerca)
function apriComeSiFa(k) {
  const x = TEST_INFO[k]; if (!x || typeof mostraFoglio !== "function") return;
  const emb = x[3] && typeof ytEmbed === "function" ? ytEmbed(x[3]) : "";
  const video = emb
    ? `<div class="yt-wrap"><iframe src="${emb}" title="${x[0]}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>
       <a class="et" style="display:block;text-align:center;margin-top:8px;color:var(--blu)" href="${x[3]}" target="_blank" rel="noopener">apri su YouTube ↗</a>`
    : (x[4] ? `<a class="lib-row" style="text-decoration:none;color:inherit" href="https://www.youtube.com/results?search_query=${x[4]}" target="_blank" rel="noopener"><div style="flex:1;font-weight:500">Cerca il video su YouTube</div><span class="vid-ic">▶</span><span class="freccia">↗</span></a>` : "");
  mostraFoglio(`
    <div class="foglio-top"><h3>${x[0]}</h3><button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    <div style="font-size:15px;line-height:1.7">${x[2]}</div>
    ${video ? `<div style="margin-top:14px">${video}</div>` : ""}`);
}
// riga "Come si fa" cliccabile → apre la finestra ben formattata
function bloccoComeSiFa(k) {
  const x = TEST_INFO[k]; if (!x) return "";
  return `<div class="lib-row" style="margin-bottom:11px" onclick="apriComeSiFa('${k}')">
    <div style="flex:1;min-width:0"><div style="font-weight:600">📖 Come si fa</div>
      <div class="et" style="margin-top:1px">${x[1]}</div></div>
    ${x[3] ? '<span class="vid-ic">▶</span>' : ""}<span class="freccia">›</span></div>`;
}
function toggleNuovoTest() { S.nuovoTest = !S.nuovoTest; disegna(); if (S.nuovoTest) window.scrollTo(0, 0); }

let testState = { atletaRif: "" };
function setTestAtleta(id) { testState.atletaRif = id; disegna(); window.scrollTo(0, 0); }

// progressione dell'atleta in tutto: salti/test, tempi/PB, massimali (riusa andaVoci/andaMetriche/chartSerie di analisi.js)
function progressioneAtleta(atl) {
  if (typeof andaVoci !== "function") return "";
  const cats = [["test", "Salti / test"], ["pb", "Tempi / PB (s)"], ["massimali", "Massimali (kg)"]];
  let out = "";
  cats.forEach(([cat, lbl]) => {
    const metriche = andaMetriche(atl, cat);
    if (!metriche.length) return;
    out += `<p class="sez">${lbl}</p>`;
    metriche.forEach(m => {
      const serie = andaVoci(atl, cat).filter(v => v.nome === m)
        .sort((a, b) => (a.iso || "") < (b.iso || "") ? -1 : (a.iso || "") > (b.iso || "") ? 1 : 0);
      if (!serie.length) return;
      const ultimo = serie[serie.length - 1];
      const delta = serie.length > 1 ? (ultimo.val - serie[0].val) : null;
      const unita = cat === "massimali" ? "kg" : cat === "pb" ? "s" : (serie[0] && serie[0].unita) || "";
      const meglio = cat === "pb" ? (delta < 0) : (delta > 0);   // sui tempi: meno = meglio
      out += `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <p style="font-weight:600;font-size:13px;margin:0">${m}</p>
          <div style="text-align:right"><b style="font-size:16px">${ultimo.val} ${unita}</b>
            ${delta != null ? `<span class="et" style="margin-left:6px;color:${meglio ? "var(--verde)" : "var(--rosso)"}">${delta > 0 ? "+" : ""}${Math.round(delta * 100) / 100}</span>` : ""}</div>
        </div>
        ${chartSerie(serie)}</div>`;
    });
  });
  return out || `<div class="card"><p class="et">Ancora nessun dato registrato per questo atleta. I test compaiono qui man mano che li salvi (scheda / Stima 1RM).</p></div>`;
}

function vistaTest() {
  const atl = DEMO.atleti.find(x => x.id === testState.atletaRif);
  const picker = TEST_HUB.map(([blocco, tests]) => `
    <p class="sez">${blocco}</p>
    ${tests.map(([r, nome, info]) => `<div class="lib-row" onclick="vai('${r}')">
      <div style="flex:1;min-width:0"><div style="font-weight:500">${nome}</div><div class="et" style="margin-top:1px">${info}</div></div>
      <span class="freccia">›</span></div>`).join("")}`).join("");

  return `
  <div class="card"><h3>Test periodici</h3>
    <p class="et" style="margin-top:2px">Batteria ogni ~8 settimane, da RIPOSATO e nelle stesse condizioni. Scegli l'atleta e apri il test: i risultati si salvano nella sua scheda e vedi la progressione.</p></div>

  <div class="card">
    <label class="lab">Atleta — vedi la sua progressione</label>
    <select onchange="setTestAtleta(this.value)" style="margin-top:6px">
      <option value="">— nessuno (solo protocollo) —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${testState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
  </div>

  <button class="btn" style="margin-bottom:12px" onclick="toggleNuovoTest()">＋ Nuovo test</button>
  ${S.nuovoTest ? `<div class="card">${picker}</div>` : ""}

  ${atl ? `<p class="sez">Progressione di ${atl.nome}</p>${progressioneAtleta(atl)}` : ""}

  <p class="sez">Protocollo consigliato (ogni 8 settimane, sabato)</p>
  <div class="card"><p style="font-size:14px;line-height:1.6;color:var(--txt2)">
    <b style="color:var(--txt)">🌅 Mattina</b> (freschi): peso + prevenzione a freddo · riscaldamento · CMJ/SJ · sprint 20 m blocchi e 30 m lanciato (Profilo F-V Sprint) · Drop Jump & RSI · traino per ultimo.<br><br>
    <b style="color:var(--txt)">🌇 Pomeriggio</b> (≥4-6 h dopo): Stima 1RM VBT (Squat/Panca/Stacco) · (opz.) Profilo F-V salti.<br><br>
    <span class="et">Ordine per fatica crescente: mai forza pesante prima di velocità/salti. Stesse condizioni ogni volta = confronti validi. Ogni 8 settimane ricalibra le %1RM dei microcicli.</span></p></div>

  <div class="card">
    <p style="font-weight:600;font-size:13px;margin-bottom:6px">Rapporti utili</p>
    <p class="et" style="line-height:1.6">• <b>CMJ − SJ</b> = uso dell'elastico (contromovimento).<br>• <b>Squat / peso</b> = forza relativa (× peso corporeo).<br>• <b>RSI</b> (drop jump) = altezza salto ÷ tempo di contatto: <1.5 scarso · 1.5-2.0 medio · 2.0-2.5 buono · >2.5 ottimo.</p>
  </div>

  <p class="sez">Come eseguire i test di mobilità / prevenzione</p>
  ${TEST_COME.map(([nome, testo], i) => `<div class="lib-row" onclick="apriTestVideo(${i})">
    <div style="flex:1;min-width:0"><div style="font-weight:500">${nome}</div>
      <div class="et" style="margin-top:2px;white-space:normal;line-height:1.4">${testo.length > 90 ? testo.slice(0, 90) + "…" : testo}</div></div>
    <span class="vid-ic">▶</span><span class="freccia">›</span></div>`).join("")}
  <p class="et" style="margin:8px 2px 20px">Tocca un test per la spiegazione e il video.</p>`;
}

// ---------- TEMPLATE MICROCICLI ----------
const TEMPLATE_BLOCCHI = [
  {
    titolo: "Blocco 1 · AA — Adattamento Anatomico (Prep. generale, ~3-4 sett.)",
    parametri: "Palestra 40-60% · 8-12 rip · RPE basso (circuiti) | Sprint submax 70-90% (tecnica + accel brevi) | Pliometria estensiva (molti contatti, bassa intensità) | recuperi ampi",
    giorni: [
      ["Lun", "Tecnica + accelerazioni brevi (submax)", "20-30 m · 80-90%", "Circuito forza generale full-body", "40-60% · 8-12 ×2-3", "cura tecnica; RPE 6-7", ""],
      ["Mar", "Tempo estensivo + core", "10-15×100-150 m · ~70%", "—", "—", "rec 60-90 s; capacità di lavoro", ""],
      ["Mer", "Riposo / mobilità", "—", "—", "—", "mobilità, foam roll", "r"],
      ["Gio", "Accelerazioni + multibalzi estensivi", "30-40 m · 85-90%", "Forza generale 2 (squat/stacco/spinte)", "40-60% · 8-12 ×3", "plyo estensiva (molti contatti bassi)", ""],
      ["Ven", "Tecnica + andature + allunghi", "4-6 allunghi", "Core / prehab", "—", "recupero attivo", ""],
      ["Sab", "Volume misto / multibalzi", "tempo + balzi", "Forza generale 3 o circuito", "40-60% · 8-12", "oppure gara C di rodaggio", ""],
      ["Dom", "Riposo", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 2 · Mx-S — Forza Massima (Prep. speciale, ~6-7 sett.)",
    parametri: "Palestra 85-100% · 1-5 rip · rec 3-5' (+ oly lift) | Sprint 95-100% accel/velocità max 20-60 m | Pliometria intensiva | avvio speed endurance",
    giorni: [
      ["Lun", "Accelerazioni massimali", "20-40 m · 95-100%", "Forza MAX (squat/stacco)", "85-95% · 2-4 ×3-5", "rec pieni 4-6'", ""],
      ["Mar", "Velocità massima (lanciati) + plyo intensiva", "20-40 m lanciati", "—", "—", "depth/bound intensivi; core", ""],
      ["Mer", "Riposo", "—", "—", "—", "—", "r"],
      ["Gio", "Accel + avvio speed endurance", "60-80 m · 90-95%", "Forza MAX 2 + oly lift (girata/strappo)", "85-100% + oly · 1-3", "—", ""],
      ["Ven", "Tecnica + recupero", "andature", "Prehab / core", "—", "recupero attivo", ""],
      ["Sab", "Velocità max o gara C", "30-60 m max", "Forza MAX 3 (richiamo)", "85-90% · 2-3", "—", ""],
      ["Dom", "Riposo", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 3 · Conversione a Potenza (Pre-competitiva, ~4 sett.)",
    parametri: "Palestra 70-85% veloce + balistico 30-50% (jump squat) + oly/contrasto | Sprint velocità max + speed endurance specifica | Pliometria shock/reattiva",
    giorni: [
      ["Lun", "Velocità max + accelerazioni", "20-50 m · 95-100%", "Potenza: jump squat + oly + contrasto", "30-50% balistico / 70-85% veloce", "contrast training; rec pieni", ""],
      ["Mar", "Speed endurance + depth jump reattivi", "80-120 m · 95%", "—", "—", "plyo shock; rec 6-12'", ""],
      ["Mer", "Riposo", "—", "—", "—", "—", "r"],
      ["Gio", "Blocchi / accel specifici", "20-40 m dai blocchi", "Potenza 2 (contrasto / oly)", "70-85% + balistico", "—", ""],
      ["Ven", "Tecnica + recupero", "andature / allunghi", "Core / prehab", "—", "recupero attivo", ""],
      ["Sab", "Special endurance o gara", "120-150 m / gara", "leggera o off", "—", "specificità gara", ""],
      ["Dom", "Riposo", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 4 · Mantenimento P+MxS (Competitiva in-season, ~6 sett.)",
    parametri: "Palestra 1-2 sedute, 80-90% poche rip + potenza (alta qualità) | Sprint qualità-gara, volumi bassi | molto recupero | gara nel weekend",
    giorni: [
      ["Lun", "Accel + velocità max (qualità, vol. basso)", "20-40 m max", "Forza/potenza breve (mantenimento)", "80-90% · 1-3 + potenza", "poche serie, alta qualità", ""],
      ["Mar", "Speed endurance leggera / tecnica", "60-100 m", "—", "—", "freschezza", ""],
      ["Mer", "Riposo", "—", "—", "—", "—", "r"],
      ["Gio", "Rifinitura (blocchi, 1-2 accel veloci)", "20-30 m", "Potenza breve o off", "poche serie", "—", ""],
      ["Ven", "Attivazione pre-gara", "riscaldamento + 2-3 allunghi", "—", "—", "pre-gara", ""],
      ["Sab", "GARA", "gara", "—", "—", "🏁 gara", "g"],
      ["Dom", "Riposo / recupero", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 5 · Competitivo — settimana di gara / TAPER (peaking)",
    parametri: "TAPER: volume molto basso, alta qualità e freschezza | 2-3 stimoli brevi e veloci | scarico pre-gara | obiettivo PICCO",
    giorni: [
      ["Lun", "Attivazione + 2-3 accel brevi veloci", "10-30 m · 100%", "Richiamo forza/potenza breve", "85-90% · 1-2 serie", "tagli il volume, tieni l'intensità", ""],
      ["Mar", "Blocchi / velocità max breve", "20-40 m", "—", "—", "freschezza, niente fatica", ""],
      ["Mer", "Riposo", "—", "—", "—", "—", "r"],
      ["Gio", "Pre-gara: risc. + 2 allunghi + 1-2 partenze", "brevi", "—", "—", "stimolo neurale breve", ""],
      ["Ven", "Riposo / scarico (o viaggio)", "—", "—", "—", "scarico totale", "r"],
      ["Sab", "GARA", "gara", "—", "—", "🏁 PICCO", "g"],
      ["Dom", "Riposo / recupero attivo", "—", "—", "—", "—", "r"]
    ]
  }
];

function setTmplSet(v) { S.tmplSet = v; disegna(); window.scrollTo(0, 0); }
function _renderTemplateBlocchi(blocchi, colPista, col2) {
  const c2 = col2 || ("Distanze/" + (colPista === "Corsa" ? "ritmo" : "%"));
  return blocchi.map(b => `
    <div class="card">
      <p style="font-weight:600;font-size:13px">${b.titolo}</p>
      <p class="et" style="margin:6px 0 10px;line-height:1.5">${b.parametri}</p>
      <div class="p-scroll"><table class="ptab pista-w">
        <thead><tr><th>Giorno</th><th>${colPista}</th><th>${c2}</th><th>Palestra</th><th>%1RM·s×r</th><th>Note</th></tr></thead>
        <tbody>${b.giorni.map(([g, pista, dist, pal, perc, note, kind]) => {
          const st = kind === "g" ? ' style="background:rgba(240,168,60,.13)"' : kind === "r" ? ' style="color:var(--txt3)"' : "";
          return `<tr${st}><td>${g}</td><td style="white-space:normal;min-width:150px">${pista}</td><td style="white-space:normal">${dist}</td><td style="white-space:normal;min-width:130px">${pal}</td><td style="white-space:normal">${perc}</td><td class="et" style="white-space:normal">${note}</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </div>`).join("");
}
function vistaTemplate() {
  // set di template disponibili (menù a tendina)
  const sets = { vel: { lab: "Velocità / Salti", col: "Pista", blocchi: TEMPLATE_BLOCCHI, nota: "Valori indicativi (Bompa/Buzzichelli, NSCA, Francis/Altis)." } };
  if (typeof MZ_TEMPLATE !== "undefined") sets.mezzo = { lab: "Mezzofondo / Fondo", col: "Corsa", blocchi: MZ_TEMPLATE, nota: "Ritmi dai Ritmi target (E/M/T/I/R). Carico 3:1 (3 sett. in crescita + 1 scarico)." };
  if (typeof LANCI_TEMPLATE !== "undefined") sets.lanci = { lab: "Lanci", col: "Campo / lanci", col2: "Attrezzo · n° lanci", blocchi: LANCI_TEMPLATE, nota: "Lanci (da fresco) + palestra spesso nello stesso giorno. Volumi da USATF; forza da Bompa/Buzzichelli/NSCA. Carico 3:1." };
  const set = sets[S.tmplSet] ? S.tmplSet : "vel";
  const cur = sets[set];
  const dropdown = `<div class="card"><label class="lab">Template per disciplina</label>
    <select onchange="setTmplSet(this.value)" style="margin-top:6px">${Object.keys(sets).map(k => `<option value="${k}" ${k === set ? "selected" : ""}>${sets[k].lab}</option>`).join("")}</select></div>`;

  return `
  <div class="card"><h3>Template microcicli</h3>
    <p class="et" style="margin-top:2px">Settimana-tipo per ogni blocco: uno scheletro da copiare e adattare quando scrivi un mesociclo in Pista. Grigio = riposo, arancione = gara. ${cur.nota}</p></div>
  ${dropdown}
  ${_renderTemplateBlocchi(cur.blocchi, cur.col, cur.col2)}`;
}
