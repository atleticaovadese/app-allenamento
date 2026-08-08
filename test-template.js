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

function vistaTest() {
  const batteria = TEST_BATTERIA.map(([sez, tests]) => `
    <div class="card">
      <p style="font-weight:600;font-size:13px;margin-bottom:8px">${sez}</p>
      <table class="ptab" style="min-width:0"><tbody>
        ${tests.map(([n, u]) => `<tr><td>${n}</td><td class="pauto" style="width:60px;text-align:right">${u}</td></tr>`).join("")}
      </tbody></table>
    </div>`).join("");

  const come = TEST_COME.map(([nome, testo], i) => `
    <div class="lib-row" onclick="apriTestVideo(${i})">
      <div style="flex:1;min-width:0">
        <div style="font-weight:500">${nome}</div>
        <div class="et" style="margin-top:2px;white-space:normal;line-height:1.4">${testo.length > 90 ? testo.slice(0, 90) + "…" : testo}</div>
      </div>
      <span class="vid-ic">▶</span><span class="freccia">›</span>
    </div>`).join("");

  return `
  <div class="card"><h3>Test periodici</h3>
    <p class="et" style="margin-top:2px">Batteria da fare ogni ~8 settimane, da RIPOSATO e nelle stesse condizioni. Registra i risultati nella scheda dell'atleta (poi li vedi in Analisi → Andamento).</p></div>

  <p class="sez">Batteria di test</p>
  ${batteria}

  <div class="card">
    <p style="font-weight:600;font-size:13px;margin-bottom:6px">Rapporti utili</p>
    <p class="et" style="line-height:1.6">• <b>CMJ − SJ</b> = uso dell'elastico (contromovimento).<br>• <b>Squat / peso</b> = forza relativa (× peso corporeo).<br>• <b>RSI</b> (drop jump) = altezza salto ÷ tempo di contatto: <1.5 scarso · 1.5-2.0 medio · 2.0-2.5 buono · >2.5 ottimo. L'altezza di caduta con RSI più alto è la tua ottimale.</p>
  </div>

  <p class="sez">Come eseguire i test di mobilità / prevenzione</p>
  ${come}
  <p class="et" style="margin:8px 2px 20px">Tocca un test per la spiegazione e il video. Protocolli completi di tutti i test nella Guida (cap. 10.5).</p>`;
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
