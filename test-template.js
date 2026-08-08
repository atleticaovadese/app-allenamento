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
const TEST_INFO = {
  cmj: ["CMJ e SJ (salti verticali)", "CMJ: mani ai fianchi, contromovimento rapido e salto in un'unica azione. SJ: parti fermo con ginocchia a ~90° (2 s, senza contromovimento) e salti. Altezza dal tempo di volo (My Jump). Il CMJ−SJ = quanto sfrutti l'elastico.", "", "counter+movement+jump+test+my+jump"],
  "sprint-test": ["Sprint — tempi", "Accelerazione: da fermo o dai blocchi (20-30 m). Velocità massima: 30 m lanciato con rincorsa. Fotocellule o video ad alta frequenza, stesse condizioni ogni volta. Meno tempo = meglio.", "", "sprint+timing+gates+test"],
  "fv-sprint": ["Profilo F-V Sprint", "Uno sprint massimale con i tempi parziali (o da MySprint): il modello Samozino-Morin stima F0 (forza a inizio spinta), V0 (velocità max), Pmax e RFmax. Fresco, a massima spinta.", "", "sprint+force+velocity+profile+morin"],
  dropjump: ["Drop Jump & RSI", "Scendi da un rialzo (20-60 cm), tocca e risalta subito col minimo tempo di contatto. Misura contatto e altezza del salto: RSI = altezza ÷ contatto. Prova più altezze per trovare l'ottimale.", "", "drop+jump+RSI+test"],
  traino: ["Traino / Sled", "Sprint sulla stessa distanza senza traino e con 1-2 carichi, a massima spinta. Dal calo di velocità il modello Morin-Samozino stima V0 e i carichi per ogni zona.", "", "resisted+sprint+sled+test"],
  stima1rm: ["Stima 1RM da VBT", "3-5 serie a carichi crescenti con massima intenzione, registrando la velocità media (encoder/app). La retta carico-velocità stima l'1RM alla MVT, senza fare il massimale vero.", "", "velocity+based+training+1RM"],
  fv: ["Profilo F-V salti", "Squat jump (NON CMJ) a carichi crescenti; con massa e distanza di spinta (hPO) il modello Samozino stima F0, V0, Pmax e lo squilibrio forza-velocità → cosa allenare.", "", "squat+jump+force+velocity+profile"]
};
function apriTestInfo(k) { const x = TEST_INFO[k]; if (x && typeof apriVideo === "function") apriVideo(x[0], x[2] || "", "", x[1], ""); }
// blocco "Come si fa" riusabile: spiegazione sempre + video in-app se disponibile, altrimenti ricerca YouTube
function bloccoComeSiFa(k) {
  const x = TEST_INFO[k]; if (!x) return "";
  const emb = x[2] && typeof ytEmbed === "function" ? ytEmbed(x[2]) : "";
  const azione = emb
    ? `<div class="lib-row" style="margin-top:10px" onclick="apriTestInfo('${k}')"><div style="flex:1;font-weight:500">Spiegazione e video</div><span class="vid-ic">▶</span><span class="freccia">›</span></div>`
    : (x[3] ? `<a class="lib-row" style="margin-top:10px;text-decoration:none;color:inherit" href="https://www.youtube.com/results?search_query=${x[3]}" target="_blank" rel="noopener"><div style="flex:1;font-weight:500">Cerca il video</div><span class="vid-ic">▶</span><span class="freccia">↗</span></a>` : "");
  return `<div class="card"><p class="et" style="margin-bottom:6px">Come si fa</p>
    <p style="font-size:14px;line-height:1.55;color:var(--txt2)">${x[1]}</p>${azione}</div>`;
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

function vistaTemplate() {
  const blocchi = TEMPLATE_BLOCCHI.map(b => `
    <div class="card">
      <p style="font-weight:600;font-size:13px">${b.titolo}</p>
      <p class="et" style="margin:6px 0 10px;line-height:1.5">${b.parametri}</p>
      <div class="p-scroll"><table class="ptab pista-w">
        <thead><tr><th>Giorno</th><th>Pista</th><th>Distanze/%</th><th>Palestra</th><th>%1RM·s×r</th><th>Note</th></tr></thead>
        <tbody>${b.giorni.map(([g, pista, dist, pal, perc, note, kind]) => {
          const st = kind === "g" ? ' style="background:rgba(240,168,60,.13)"' : kind === "r" ? ' style="color:var(--txt3)"' : "";
          return `<tr${st}><td>${g}</td><td style="white-space:normal;min-width:150px">${pista}</td><td style="white-space:normal">${dist}</td><td style="white-space:normal;min-width:130px">${pal}</td><td style="white-space:normal">${perc}</td><td class="et" style="white-space:normal">${note}</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </div>`).join("");

  return `
  <div class="card"><h3>Template microcicli</h3>
    <p class="et" style="margin-top:2px">Settimana-tipo per ogni blocco: uno scheletro da copiare e adattare quando scrivi un mesociclo. Valori indicativi (Bompa/Buzzichelli, NSCA, Francis/Altis). Grigio = riposo, arancione = gara.</p></div>
  ${blocchi}`;
}
