// MODULO LANCI — Peso · Disco · Martello · Giavellotto.
// Contenuti FEDELI all'Excel dell'utente (build_lanci.py: fogli "Guida mezzi" e "Modello tecnico").
// Categorie Bondarchuk: GPE generale · SPE speciale di preparazione · SDE speciale di sviluppo · CE gara.

// ---- zone di carico in sala (dal 1RM) ----
const LANCI_ZONE = [
  ["Forza max", "SPE", "85-100% · 2-5×1-5 · rec 3-5'", "< 0.50 m/s", "base di forza assoluta"],
  ["Forza-potenza (oly)", "SPE", "70-90% · 3-6×1-3 · rec 2-3'", "0.75-1.00 m/s", "RFD / potenza (tripla estensione)"],
  ["Derivati di tirata", "SPE", "90-140% · 3-5×2-5", "—", "sovraccarico senza ricezione (clean pull ~102%, mid-thigh ~135%)"],
  ["Velocità-forza (balistico)", "SPE", "30-60% · 3-6×3-5 · rec 2-3'", "0.90-1.20 m/s", "potenza a velocità (jump squat, push press)"],
  ["Velocità / pliometria", "SPE", "corpo libero / <30% · reattivo", "max", "forza reattiva ed elastica"]
];

// ---- i 14 mezzi: [mezzo, cat, scopo, come si struttura, quando · attenzione] ----
const LANCI_GUIDA = [
  ["Forza massimale (squat/stacco/panca)", "SPE", "Base di forza assoluta", "85-100% 1RM · 2-5×1-5 · rec 3-5'", "gen/spec · tecnica pulita, mai a cedimento. Squat r=0.76 con la prestazione"],
  ["Olympic lifts (strappo/girata/slancio)", "SPE", "Potenza e RFD, tripla estensione", "70-90% · 3-6×1-3 esplosivo · rec 2-3'", "tutto l'anno · IL PIÙ CORRELATO (girata r=0.868); qualità del gesto"],
  ["Derivati di tirata (clean/snatch/mid-thigh pull)", "SPE", "Sovraccarico di forza-potenza", "90-140% 1RM girata · 3-5×2-5", "gen/spec · più sicuri della girata completa per i giovani"],
  ["Forza balistica (jump squat, push press)", "SPE", "Potenza a velocità", "30-60% · 3-6×3-5 · rec 2-3'", "spec/pre-comp · massima velocità, poche ripetizioni"],
  ["Pliometria / balzi (depth jump, bounding)", "SPE", "Forza reattiva ed elastica", "corpo libero · 3-6×3-6 contatti · rec completo", "gen→comp · 60 contatti in prep, 80 pre-comp, 50 in gara, ZERO nel taper"],
  ["Multilanci palla medica (avanti/dietro/laterale)", "SDE", "Potenza esplosiva di tronco e catena", "3-6 kg · 4-8×3-6 · rec 1-2'", "tutto l'anno · imita il gesto; +3.5/5.2% di velocità in 6 sett. (van den Tillaar)"],
  ["Lanci attrezzo STANDARD (gara)", "CE", "Tecnica di gara e ritmo", "attrezzo gara · 15-30 lanci/seduta · rec completo", "tutto l'anno · IL CARDINE · serve freschezza per la qualità"],
  ["Lanci attrezzo PESANTE (+5/15%)", "SDE", "Forza-specifica, posizioni", "attrezzo pesante · 10-25 lanci · rec completo", "gen/spec, LONTANO dalla gara · non stravolgere la tecnica (±10%)"],
  ["Lanci attrezzo LEGGERO (−5/15%)", "SDE", "Velocità di rilascio", "attrezzo leggero · 10-25 lanci · rec completo", "pre-comp/comp, VICINO alla gara · massima velocità"],
  ["Lanci speciali / parziali (power position, mezzi giri)", "SDE", "Isolare e costruire le fasi/il finale", "attrezzo vario · 10-30 lanci · rec completo", "gen→spec · tecnica «a pezzi»"],
  ["Velocità / accelerazione (sprint 20-40 m, skip)", "SPE", "Velocità degli arti e della rincorsa", "max · 4-8×20-40 m · rec completo", "tutto l'anno · ++ giavellotto · rilassatezza"],
  ["Tecnica / drills", "SDE", "Modello tecnico, timing", "a secco o con attrezzo · molti, bassa fatica", "tutto l'anno · precisione > quantità; meno variabilità = più distanza"],
  ["Mobilità / prevenzione (spalla, anca, core)", "GPE", "Salute e ampiezza", "2-3×/sett", "tutto l'anno · ++ giavellotto (spalla/gomito): è il rischio n.1"],
  ["Rigenerante / aerobico", "GPE", "Capacità di lavoro e recupero", "blando, 20-40'", "prep. generale e scarichi · il lancio è ALATTACIDO: l'aerobico non è allenante per la gara"]
];

// ---- priorità mezzo × attrezzo ----
const LANCI_MATR_MEZZI = ["Forza massimale", "Olympic lifts / potenza", "Derivati di tirata", "Forza balistica", "Pliometria / balzi", "Multilanci palla medica", "Lanci pesanti (over)", "Lanci leggeri (under)", "Velocità / accelerazione", "Tecnica / rotazione", "Mobilità / prevenzione"];
const LANCI_MATRICE = [
  ["●●●", "●●", "●●●", "●●"], ["●●●", "●●●", "●●●", "●●●"], ["●●●", "●●", "●●●", "●●"], ["●●", "●●●", "●●", "●●●"],
  ["●●", "●●", "●●", "●●●"], ["●●●", "●●●", "●●", "●●●"], ["●●●", "●●", "●●●", "●●"], ["●●", "●●●", "●●", "●●●"],
  ["●●", "●●", "●●", "●●●"], ["●●", "●●●", "●●●", "●●●"], ["●●", "●●", "●●", "●●●"]
];
const LANCI_CAT_LEGENDA = "GPE = generale · SPE = speciale di preparazione · SDE = speciale di sviluppo (parti del gesto) · CE = gara";

// ---- modello tecnico per attrezzo (biomeccanica applicata: punti chiave, cue, errori, drills, fonti) ----
const LANCI_MODELLO = [
  {
    nome: "Peso", eng: "shot put", righe: [
      ["Profilo", "Gesto brevissimo: FORZA e POTENZA dominanti (alta correlazione con squat e panca). Due tecniche: O'Brien (traslazione) e rotazionale. Il rotazionale richiede meno forza di spinta per metro (9.98 vs 11.03 kg di panca per metro) ma più coordinazione."],
      ["Qualità in ordine", "1) Forza max  2) Potenza (oly/balistico)  3) Velocità di traslazione/rotazione  4) Tecnica del finale."],
      ["Punti chiave", "EQUILIBRIO in tutto il gesto (il manuale USATF lo indica come LA chiave). Posizione di potenza. Blocco del lato sinistro. Finale esplosivo con sequenza gamba → anca → tronco → braccio."],
      ["Meccanica", "La velocità del corpo a fine traslazione, insieme alla massa corporea, determina in gran parte l'energia trasferita. Le masse grandi (gambe, tronco) accelerano la massa piccola (braccio-mano)."],
      ["Cue", "«Spingi il terreno» · «Il braccio arriva per ultimo» · «Petto chiuso fino al blocco» · «Sinistra ferma e forte»."],
      ["Errori tipici", "Forzare il braccio prima delle gambe. Troppa palestra e pochi lanci di qualità. Perdere l'equilibrio in traslazione."],
      ["Drills", "Lanci da fermo (power position), lanci con blocco della sinistra, traslazioni senza attrezzo, lanci dietro sopra la testa, mezzi giri (rotazionale)."],
      ["Riferimenti", "Linthorne (angolo ottimale); Terzis/Kyriazis (forza-prestazione); USATF Coaching Manual cap. 14; Judge (PAP)."]
    ]
  },
  {
    nome: "Disco", eng: "discus", righe: [
      ["Profilo", "Rotazionale: POTENZA ROTAZIONALE + ritmo + tecnica fine. Meno forza bruta del peso, più coordinazione e velocità angolare."],
      ["Qualità in ordine", "1) Potenza rotazionale/velocità  2) Forza max (base)  3) Ritmo/tecnica della rotazione  4) Elasticità."],
      ["Punti chiave", "RITMO lento → veloce. Separazione anca-spalle. Finale lungo e continuo. Negli uomini è la SECONDA FASE DI DOPPIO APPOGGIO a fare la differenza (Hay & Yu 1995); nelle donne pesano ugualmente volo e secondo doppio appoggio."],
      ["Meccanica", "Momenti di estensione dell'ANCA DESTRA e del GINOCCHIO SINISTRO nella consegna sono critici (Yu, Broker & Silvester 2002): è a questo che servono squat e balzi. Ripetibilità: negli uomini meno variabilità = più distanza (r = −0.57/−0.63, Dai 2013)."],
      ["Aerodinamica", "Inclinazione ottimale 5-10° MENO dell'angolo di rilascio. Il disco vola PIÙ LONTANO CONTRO VENTO (fino a +8 m con vento contrario da 10 m/s). Angolo di rilascio ottimale INDIVIDUALE: 35-44°."],
      ["Cue", "«Lento in alto, veloce in basso» · «Il disco resta lungo» · «Gira sul sinistro, non saltare» · «Ultimo dito: indice»."],
      ["Errori tipici", "Partire troppo veloci (si perde il ritmo). «Tirare» con le braccia invece che con la rotazione del corpo. Aprire troppo presto."],
      ["Drills", "Mezzi giri, step-in, lanci da fermo, cone drills, line drills, lanci con disco più leggero (variabilità controllata)."],
      ["Riferimenti", "Bartlett 1992 (review); Hay & Yu 1995; Yu 2002; Leigh & Yu 2007; Dai 2013; Leigh 2010 (angoli individuali); Dinu 2019."]
    ]
  },
  {
    nome: "Martello", eng: "hammer", righe: [
      ["Profilo", "Il più TECNICO: 3-4 giri con velocità angolare crescente e forza centrifuga da gestire. Forza + velocità di rotazione + gestione della trazione."],
      ["Qualità in ordine", "1) Velocità di rotazione/potenza  2) Forza max (contrastare la trazione)  3) Tecnica dei giri (equilibrio, tempo)  4) Forza specifica (lanci pesanti)."],
      ["Punti chiave", "Aumento PROGRESSIVO della velocità nei giri. DOPPIO APPOGGIO LUNGO (prolungarlo aumenta la velocità media dell'attrezzo). Raggio ampio e catena tesa. Angolo di rilascio 42-45°."],
      ["Meccanica", "Negli elite gli spostamenti verticali del centro di massa di atleta e attrezzo sono ~180° fuori fase (Dapena). A parità di raggio, tempi di rotazione più brevi = distanze maggiori. La velocità di rilascio correla r=0.86 con la prestazione."],
      ["Cue", "«Early! Early! Early!» per l'appoggio del piede destro · al rilascio pensa «TURN!» e non «Explode!» (mantiene centro e raggio) · «Occhi sulla palla»."],
      ["Errori tipici", "Andare «a braccia» perdendo l'equilibrio. Troppi giri veloci senza controllo. Gathering per «il lancio grosso» (il rilascio è solo un altro giro)."],
      ["Drills", "Winds (5×5), drag position, giri con attrezzo corto, lanci a 1-2 giri, lanci con martello pesante e leggero, plate swings."],
      ["Riferimenti", "Dapena 1984/1986/1989; Brice 2011; Castaldi 2022 (review); Bondarchuk; USATF Coaching Manual cap. 17."]
    ]
  },
  {
    nome: "Giavellotto", eng: "javelin", righe: [
      ["Profilo", "Rincorsa + blocco + frustata: VELOCITÀ (rincorsa e arto) + ELASTICITÀ + salute di spalla/gomito. Meno forza massima assoluta, più velocità/elasticità e tecnica."],
      ["Qualità in ordine", "1) Velocità (rincorsa, arti)  2) Elasticità/pliometria  3) Forza esplosiva  4) Mobilità/salute spalla  5) Tecnica del blocco e frustata."],
      ["Punti chiave", "Rincorsa ritmica di 12-15 passi (aggiunge il 30-40% rispetto al lancio da fermo). Passi incrociati. Ultimo passo lungo. BLOCCO della gamba sinistra con poca flessione del ginocchio. Progressione ordinata dei picchi di velocità anca → spalla → gomito."],
      ["Meccanica", "Il 70% della velocità di rilascio si genera negli ultimi 0.1 secondi (Morriss & Bartlett 1996): è un gesto di RFD estrema, non di forza massima. Le variabili che aumentano la velocità aumentano ANCHE il carico su spalla e gomito."],
      ["Cue", "«Braccio lungo e rilassato» · «Anca prima della spalla» · «Sinistra come un muro» · «Punta avanti, palmo in alto»."],
      ["Errori tipici / ATTENZIONE", "SOVRACCARICARE SPALLA E GOMITO con troppi lanci pieni: è il rischio n.1. Nei junior elite il 69% delle spalle dominanti mostra cisti intraossee e la rotazione interna cala (48° vs 57°). Gestisci il volume con gradualità e cura la mobilità."],
      ["Drills", "Lanci con palle mediche e palle zavorrate, stubbies (giavellotti corti), lanci da fermo, passi incrociati a secco, sprint con attrezzo, prehab cuffia con elastici."],
      ["Riferimenti", "Bartlett & Best 1988; Morriss & Bartlett 1996; Liu 2010; Beitzel 2016; Schmitt 2001/2004; USATF Coaching Manual cap. 16."]
    ]
  }
];

let lanciState = { attrezzo: "Peso" };
function setLanciAttrezzo(n) { lanciState.attrezzo = n; disegna(); window.scrollTo(0, 0); }
const _lanciCatCol = c => c === "CE" ? "var(--rosso,#c00000)" : "var(--blu,#1f3864)";

// ---------- render: Guida mezzi (lanci) ----------
function guidaMezziLanciHTML() {
  const zone = `<div class="card"><p class="et" style="margin-bottom:6px">Zone di carico in sala (dal 1RM)</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Zona</th><th>Cat.</th><th>%1RM · serie×rep</th><th>VBT (m/s)</th><th>Scopo</th></tr></thead>
      <tbody>${LANCI_ZONE.map(z => `<tr><td><b>${z[0]}</b></td><td class="pauto">${z[1]}</td><td>${z[2]}</td><td class="pauto">${z[3]}</td><td class="et">${z[4]}</td></tr>`).join("")}</tbody>
    </table></div></div>`;
  const cards = LANCI_GUIDA.map(m => `<div class="card">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px"><h3 style="margin:0">${m[0]}</h3><span class="pill" style="background:${_lanciCatCol(m[1])};color:#fff">${m[1]}</span></div>
    <p class="et" style="margin:4px 0 8px">${m[2]}</p>
    <div style="font-size:13px"><div style="padding:3px 0"><b>Come si struttura:</b> ${m[3]}</div><div style="padding:3px 0"><b>Quando · attenzione:</b> ${m[4]}</div></div>
  </div>`).join("");
  const idx = LANCI_MODELLO.findIndex(x => x.nome === lanciState.attrezzo);
  const matr = `<div class="card"><p class="et" style="margin-bottom:6px">Priorità dei mezzi per attrezzo <span style="color:var(--txt3)">(●●● alta · ●● media · ● supporto)</span></p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Mezzo</th><th>Peso</th><th>Disco</th><th>Martello</th><th>Giavell.</th></tr></thead>
      <tbody>${LANCI_MATR_MEZZI.map((m, i) => `<tr><td><b>${m}</b></td>${LANCI_MATRICE[i].map(v => `<td class="pauto">${v}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div></div>`;
  return `<div class="card"><h3>Guida ai mezzi (lanci)</h3>
    <p class="et" style="margin-top:2px">Per ogni mezzo: categoria Bondarchuk, scopo, come si struttura e quando usarlo. La forza si scrive in Palestra; lanci e pliometria in Campo/Pista.</p>
    <p class="et" style="margin-top:6px">${LANCI_CAT_LEGENDA}</p></div>
    ${zone}${cards}${matr}
    <div class="card"><p class="et" style="margin:0"><b>Sistema energetico:</b> il lancio dura meno di 1-2 secondi → energia quasi 100% ALATTACIDA (fosfageni), con recuperi COMPLETI tra le prove. Il lattacido NON è rilevante. L'aerobico serve solo come capacità di lavoro e recupero, soprattutto in preparazione generale.</p></div>`;
}

// ---------- render: Modello tecnico per attrezzo ----------
function perAttrezzoLanciHTML() {
  const a = LANCI_MODELLO.find(x => x.nome === lanciState.attrezzo) || LANCI_MODELLO[0];
  const tabs = `<div class="tabbar">${LANCI_MODELLO.map(x => `<button class="${x.nome === a.nome ? "on" : ""}" onclick="setLanciAttrezzo('${x.nome}')">${x.nome}</button>`).join("")}</div>`;
  const righe = a.righe.map(([l, t]) => {
    const warn = /ATTENZIONE/.test(l);
    return `<div style="padding:7px 0;border-bottom:1px solid var(--line)${warn ? ";background:rgba(240,168,60,.10);border-radius:8px;padding:8px 9px" : ""}">
      <span class="et" style="margin:0;font-weight:600;color:${warn ? "var(--giallo,#d99000)" : "var(--txt2)"}">${l}</span>
      <p style="margin:2px 0 0;font-size:13px">${t}</p></div>`;
  }).join("");
  return `<div class="card"><h3>Modello tecnico per attrezzo</h3>
    <p class="et" style="margin-top:2px">Biomeccanica applicata: profilo, punti chiave, meccanica, cue (parole da usare), errori e drills. Fonti a fine sezione.</p></div>
    ${tabs}
    <div class="card"><h3 style="margin-bottom:4px">${a.nome} <span class="et">(${a.eng})</span></h3>${righe}</div>
    <div class="card"><p class="et" style="margin:0">Regola trasversale: la <b>ripetibilità</b> del gesto è allenabile e misurabile. Filma le sedute e confronta: meno variabilità del movimento significa più distanza.</p></div>`;
}

// ============================================================================
// CAMPO — la "Pista" dei lanci: editor delle sedute in pedana.
// Fedele al foglio Excel "Campo" (build_lanci.py) + esercizi speciali (esercizi_lanci.py).
// Riga: Mezzo/contenuto (tendina) · Attrezzo kg · n° lanci · Rec · % int · Tipo attrezzo.
// Calcolati: Δ% vs peso di gara (regola ±10% USATF) · n° lanci totali · di cui gara.
// ============================================================================

// mezzi allenanti generali (prima parte della tendina "Mezzo / contenuto")
const LANCI_MEZZI = [
  "Lanci attrezzo GARA (standard)", "Lanci attrezzo PESANTE (over)", "Lanci attrezzo LEGGERO (under)",
  "Lanci da fermo / power position", "Lanci parziali (mezzi giri, 1 giro)", "Tecnica / drills a secco",
  "Multilanci palla medica", "Lanci con attrezzi vari (palle, bilanciere)",
  "Olympic lifts / derivati", "Forza massimale", "Forza balistica",
  "Pliometria / balzi", "Velocità / accelerazione", "Andature / corsa",
  "Mobilità / prevenzione", "Core", "Rigenerante / aerobico", "Gara / prova simulata"
];
// tipi di attrezzo (colonna "Tipo attrezzo")
const LANCI_TIPO_ATTR = ["Gara", "Pesante (over)", "Leggero (under)", "Palla medica", "Attrezzo vario", "-"];
// blocchi della periodizzazione forza dei lanci (fedele al foglio Excel)
const LANCI_BLOCCHI = ["AA (Adatt. Anatomico)", "Mx-S (Forza Max)", "Conv. a Potenza", "Mant. P+MxS", "Competitivo"];

// esercizi SPECIALI in pedana: [attrezzo, nome, cat, scopo, come si esegue, quando usarlo, volume tipico]
// fonti: USA Track & Field Coaching Manual capp. 14-17 · Bondarchuk (classificazione/transfer).
const LANCI_ESERCIZI = [
  // ---- PESO — traslazione (O'Brien) ----
  ["Peso (traslazione)", "Double-pivot drill", "SDE", "Primo mattone: usare gambe e anche, non il braccio", "Piedi tacco-punta, peso sul collo. Accosciata sugli avampiedi guardando le ore 3; risali in verticale ruotando 90° su entrambi gli avampiedi, baricentro sul destro. Braccia estese, testa indietro, occhi in alto. Entrambi i piedi finiscono alle ore 12.", "Prep. generale e speciale · primo drill da insegnare", "10-20 lanci"],
  ["Peso (traslazione)", "Lancio senza inversione (nonreverse)", "SDE", "Qualità balistiche: trasferimento del momento dal lato destro al blocco sinistro", "Parti guardando le ore 3, gamba sinistra poco flessa e peso a destra. Il piede destro ruota di 90° portando la gamba destra contro la sinistra; la sinistra si blocca e crea l'accelerazione. Estensione oltre l'asse. Piedi alle ore 12.", "Prep. speciale e pre-competitiva", "10-25 lanci"],
  ["Peso (traslazione)", "Lancio da fermo con inversione (full-reverse)", "SDE", "Separazione anca-spalle e finale completo", "Posizione di potenza: parte bassa alle ore 3, parte alta alle ore 6 (separazione). Le gambe spingono con sollevamento rotatorio, la sinistra si blocca, il destro sostituisce il sinistro a piede pieno parallelo all'asse. Braccio destro alto ed esteso.", "Tutto l'anno · è il drill cardine", "10-25 lanci"],
  ["Peso (traslazione)", "Traslazione + pausa in power position", "SDE", "Costanza dell'appoggio e della posizione di potenza", "Dal fondo del cerchio (ore 6) trasla al centro, PAUSA in posizione di potenza, poi rilascia con uno dei drill precedenti. Quando l'appoggio è costante, elimina la pausa.", "Prep. speciale · prima del gesto completo", "10-20 lanci"],
  ["Peso (traslazione)", "Traslazione continua (ritmo e velocità)", "CE", "Ritmo e velocità di transizione: è il gesto completo", "Senza pausa: il focus passa dalla posizione al RITMO e alla velocità di transizione verso il finale. Grip, posizione dell'attrezzo, linea di spinta unica e lato destro attivo restano i fondamentali.", "Tutto l'anno · dominante in competizione", "15-30 lanci"],
  ["Peso (traslazione)", "Lancio contro il blocco (long-left drill)", "SDE", "Rinforzare il blocco del lato sinistro", "Lanci da fermo curando che la gamba sinistra si blocchi e resti lunga: il bacino ruota CONTRO una sinistra ferma. Il braccio parte solo quando il blocco è avvenuto.", "Prep. speciale · se il finale «scappa» avanti", "10-20 lanci"],
  // ---- PESO — rotazionale ----
  ["Peso (rotazionale)", "360-degree drill (senza attrezzo)", "SPE", "Equilibrio e controllo del giro, gamba destra bassa e larga", "Dalla partenza, pivota sulla sinistra completando un giro di 360° e atterrando ESATTAMENTE dove sei partito. Lento, gamba destra bassa e larga; il braccio sinistro non anticipa la gamba sinistra.", "Tutto l'anno · test di equilibrio", "6-12 ripetizioni"],
  ["Peso (rotazionale)", "Ingresso (entry / wheel drill)", "SDE", "L'inizio del giro: caricamento e uscita dal fondo del cerchio", "Dal fondo del cerchio esegui solo l'ingresso fermandoti a metà: controlla che il ginocchio destro guidi e che le spalle restino indietro rispetto al bacino.", "Prep. generale e speciale", "10-20 ripetizioni"],
  ["Peso (rotazionale)", "Mezzo giro + lancio (half-turn)", "SDE", "Pivot sul piede destro al centro del cerchio", "Partenza col destro al centro; ruota anca, ginocchio e piede destro all'unisono e rilascia. Prima senza attrezzo, poi con l'attrezzo.", "Prep. speciale", "10-25 lanci"],
  ["Peso (rotazionale)", "Step-in drill", "SDE", "Collegare ingresso e finale", "Dal fondo del cerchio entri con un passo nel centro e concludi col mezzo giro. Cura il pivot continuo del piede destro.", "Prep. speciale e pre-competitiva", "10-25 lanci"],
  ["Peso (rotazionale)", "South African drill", "SDE", "Spinta attiva di ENTRAMBE le gambe nell'attraversamento", "Come lo step-in, ma spingi attivamente la gamba destra verso il centro mentre spingi via col sinistro: insegna ad attraversare il cerchio con le gambe, non a cadere.", "Prep. speciale", "10-20 lanci"],
  ["Peso (rotazionale)", "Box drill (dal rialzo a ore 6)", "SPE", "Forza e potenza dell'ingresso", "Un box fuori dal cerchio a ore 6: parti dall'alto, ruota scendendo e atterra in posizione di potenza dentro il cerchio.", "Prep. speciale · box basso, atterraggio controllato", "6-10 ripetizioni"],
  ["Peso (rotazionale)", "Lancio da fermo rotazionale (power position)", "SDE", "Il finale isolato, senza il giro", "Dalla posizione di potenza, finale completo con separazione e blocco. È il test di riferimento negli studi (peso da power position).", "Tutto l'anno · anche come TEST", "10-25 lanci"],
  // ---- DISCO ----
  ["Disco", "Pendulum drill (oscillazione)", "SDE", "Sensibilità dell'attrezzo e presa", "Oscilla il disco avanti e indietro col braccio disteso, sentendo il disco «appoggiato» sulle falangi. Primo drill dopo la presa.", "Prep. generale · apprendimento", "20-40 oscillazioni"],
  ["Disco", "Release drill (rilascio)", "SDE", "Uscita corretta: ultimo dito l'indice", "Rilascia il disco verso l'alto facendolo rotolare via dall'indice, senza spingerlo col polso. Deve girare in senso orario (destrimani).", "Prep. generale · richiamo", "15-30 rilasci"],
  ["Disco", "Discus bowling drill", "SDE", "Rilascio radente e rotazione dell'attrezzo", "Fai «bowling» col disco verso un compagno a ~10 m: il disco deve rotolare via dall'indice e correre dritto sul terreno.", "Prep. generale · apprendimento", "10-20 lanci"],
  ["Disco", "Height-release drill (pendolo avanzato)", "SDE", "Rilascio alto e lungo", "Dall'oscillazione bassa rilasci verso l'alto cercando la massima altezza mantenendo la rotazione pulita.", "Prep. generale e speciale", "10-20 rilasci"],
  ["Disco", "Wind up drill", "SDE", "Piano di oscillazione parallelo al terreno", "Oscilla il disco su un piano PARALLELO al suolo, riprendendolo nel palmo della mano non lanciante: costruisce il piano corretto.", "Prep. generale", "15-30 oscillazioni"],
  ["Disco", "Kneeling throw (lancio in ginocchio)", "SDE", "Isolare tronco e braccio, togliendo le gambe", "In ginocchio sul destro, piede sinistro avanti: lancio completo di tronco e braccio. Per sentire il finale lungo senza compensi delle gambe.", "Prep. generale e speciale", "10-20 lanci"],
  ["Disco", "Standing throw (lancio da fermo)", "SDE", "Finale completo: anca destra e ginocchio sinistro", "Dalla posizione di potenza, finale con estensione dell'anca destra e blocco/estensione del ginocchio sinistro (i momenti critici dell'analisi cinetica).", "Tutto l'anno · drill cardine", "10-25 lanci"],
  ["Disco", "Half-turn drill (mezzo giro)", "SDE", "Pivot del piede destro al centro del cerchio", "Senza disco: destro al centro, ruota anca-ginocchio-piede all'unisono e concludi. Poi col disco, portandolo indietro all'altezza dell'anca.", "Prep. speciale", "10-25 lanci"],
  ["Disco", "Step-in drill", "SDE", "Collegamento ingresso → mezzo giro → rilascio", "Dal fondo del cerchio col disco fermo dietro: entri con un passo e concludi col mezzo giro. Il piede destro continua a pivotare e la rotazione parte dalle gambe.", "Prep. speciale", "10-25 lanci"],
  ["Disco", "South African drill", "SDE", "Attraversare il cerchio con la spinta di entrambe le gambe", "Come lo step-in ma spingendo attivamente la gamba destra verso il centro mentre spingi via col sinistro. Per chi «cade» nel cerchio.", "Prep. speciale", "10-20 lanci"],
  ["Disco", "360-degree turn drill", "SPE", "Uscita dal fondo del cerchio in equilibrio", "In piedi, gambe poco flesse e peso sugli avampiedi: giro completo di 360° tornando nella posizione di partenza.", "Prep. generale e speciale", "6-12 ripetizioni"],
  ["Disco", "Cone drill / line drill", "SDE", "Traiettoria dei piedi e direzione del lancio", "Coni (o una linea a terra) come riferimento per l'appoggio dei piedi lungo l'asse del lancio: controlla che non «scappino» fuori linea.", "Tutto l'anno · correzione", "10-20 ripetizioni"],
  ["Disco", "Lancio completo (full throw)", "CE", "Il gesto di gara", "Se una parte non funziona, torna al drill che isola quella fase. Obiettivo: RIDURRE LA VARIABILITÀ (negli uomini meno variabilità = più distanza).", "Tutto l'anno", "15-30 lanci"],
  // ---- MARTELLO ----
  ["Martello", "Walk-around drill", "SPE", "Sensazione del raggio lungo e della forza centrifuga", "Con l'attrezzo teso, cammina attorno ad esso mantenendo la trazione: più aumenta la velocità, più devi contrastare col contrappeso del corpo.", "Prep. generale · apprendimento", "4-8 serie"],
  ["Martello", "Tug of war drill", "SPE", "Contrastare la trazione del martello", "Con un compagno, «tiro alla fune» col cavo del martello: senti dove mettere il corpo per contrastare la trazione senza perdere la postura.", "Prep. generale", "4-6 serie"],
  ["Martello", "Right hand drill (90° e 180°)", "SDE", "Posizione del braccio rispetto all'arco largo", "Con la sola mano destra, porta l'attrezzo prima a 90° poi a 180° tenendo il braccio esteso e il raggio ampio. Insegna a non «tirare» l'attrezzo verso di sé.", "Prep. generale e speciale", "5×5 ripetizioni"],
  ["Martello", "Mulinelli / winds (5×5)", "SDE", "Piano dei mulinelli e posizione di «catch»", "Cinque serie da cinque mulinelli: il piano deve essere PIATTO, nella ripresa il braccio va esteso; poi si estende verso i 270°.", "Tutto l'anno · richiamo quotidiano", "5×5"],
  ["Martello", "Drag position drill", "SDE", "Posizione di trascinamento e passaggio ai giri", "Dalla posizione di «drag» (attrezzo dietro), cinque serie da cinque mulinelli con entrambe le mani sull'impugnatura, curando la partenza.", "Prep. generale e speciale", "5×5"],
  ["Martello", "Walking drill", "SDE", "Fiducia e controllo dell'attrezzo in movimento", "Mulinando il martello sopra la testa, cammina: per prendere confidenza col controllo dell'attrezzo mentre il corpo si sposta.", "Prep. generale", "3-6 serie"],
  ["Martello", "180° to 180° drill (con manico di scopa)", "SPE", "Ritmo del giro e ritorno alla stessa posizione", "Manico di scopa a 180°, un giro completo di 360° e torna a 180°. Insegna il tempo del giro senza il carico dell'attrezzo.", "Prep. generale e speciale", "8-15 ripetizioni"],
  ["Martello", "Wind/turn drill (su pedana lunga)", "SDE", "Concatenare più giri", "Su una pedana lunga o un cerchio del disco: mulinelli e poi giri in successione, per farne più di quanti ne consenta la pedana del martello.", "Prep. speciale", "6-12 serie"],
  ["Martello", "Two-hammer / pipe drill", "SPE", "Simmetria, postura e contrappeso", "Due martelli tesi ai lati (o un tubo/bilanciere): giri mantenendo la postura e il contrappeso, senza inclinarti.", "Prep. generale e speciale", "6-10 ripetizioni"],
  ["Martello", "Lanci a 1 giro", "SDE", "Costruire il gesto per parti", "Mulinelli + 1 giro + rilascio. Doppio appoggio lungo, accelerazione progressiva.", "Prep. generale e speciale", "10-20 lanci"],
  ["Martello", "Lanci a 2 giri", "SDE", "Transizione fra i giri (la parte più difficile)", "Come i lanci a 1 giro ma con la transizione: prima dei due giri servono molti drill di giro multiplo.", "Prep. speciale", "10-20 lanci"],
  ["Martello", "Lancio completo (3-4 giri)", "CE", "Il gesto di gara", "Velocità angolare crescente, doppio appoggio lungo, catena tesa. Al rilascio pensa «TURN!» non «Explode!». Angolo di rilascio 42-45°.", "Tutto l'anno · ~30 lanci a seduta", "20-30 lanci"],
  ["Martello", "Plate swing (simulazione del rilascio)", "SPE", "Finale e catena, senza l'attrezzo", "Disco della palestra a due mani: swing controllato che simula il rilascio, il movimento parte dall'anca.", "Tutto l'anno · anche in palestra", "3×15"],
  // ---- GIAVELLOTTO ----
  ["Giavellotto", "Lancio da fermo con giavellotto", "SDE", "Il finale: blocco e frustata, senza rincorsa", "Piedi in linea col lancio, attrezzo armato indietro e braccio lungo: blocco della gamba sinistra e frustata con anticipo dell'anca. La rincorsa aggiunge il 30-40%.", "Tutto l'anno · drill cardine", "10-20 lanci"],
  ["Giavellotto", "Lancio da fermo con palla medica (2 mani)", "SDE", "Catena e finale, senza carico sulla spalla", "Palla medica 2-4 kg sopra la testa a due mani: stessa posizione del lancio, blocco e frustata. Per aumentare il VOLUME senza caricare spalla e gomito.", "Tutto l'anno · il modo giusto di fare volume", "4-8×3-6"],
  ["Giavellotto", "Lanci con palle zavorrate / stubbies", "SDE", "Volume specifico a basso rischio articolare", "Palle zavorrate a una mano e «stubbies» (giavellotti corti col puntale in gomma): molti lanci con gesto simile e stress ridotto. Anche al coperto.", "Prep. generale e speciale (dic-feb)", "20-40 lanci"],
  ["Giavellotto", "Overhead shot throw (3.6 / 5.4 kg)", "SDE", "Potenza della catena e del finale", "Lancio del peso (8 e 12 lb) sopra la testa in avanti e all'indietro: potenza esplosiva globale.", "Prep. generale e speciale", "4-8×3-5"],
  ["Giavellotto", "Lanci a 3 passi", "SDE", "Collegare gli ultimi appoggi al finale", "Rincorsa di 3 passi (incrociato + blocco): ultimo passo lungo e ginocchio di blocco poco flesso.", "Prep. speciale", "10-20 lanci"],
  ["Giavellotto", "Lanci a 5 passi", "SDE", "Ritmo dei passi incrociati", "Cinque passi: costruisce il ritmo della parte finale della rincorsa tenendo l'attrezzo fermo e la punta bassa.", "Prep. speciale e pre-competitiva", "10-20 lanci"],
  ["Giavellotto", "Lanci a 7 passi", "SDE", "Rincorsa quasi completa", "Sette passi: ponte verso la rincorsa piena (12-15 passi).", "Pre-competitiva", "8-15 lanci"],
  ["Giavellotto", "Lancio completo con rincorsa", "CE", "Il gesto di gara", "Rincorsa ritmica di 12-15 passi, passi incrociati, blocco della sinistra, frustata con anticipo dell'anca. ATTENZIONE: il volume di lanci pieni è la principale variabile di RISCHIO.", "Tutto l'anno, ma MODERATO e progressivo", "8-20 lanci"],
  ["Giavellotto", "Corsa con passi incrociati (con attrezzo)", "SPE", "Ritmo e postura della rincorsa", "Passi incrociati sul rettilineo col giavellotto armato: attrezzo fermo, bacino alto, spalle in linea col lancio.", "Tutto l'anno", "4-8×20-30 m"],
  ["Giavellotto", "Sprint con giavellotto", "SPE", "Velocità della rincorsa senza perdere la posizione dell'attrezzo", "Allunghi col giavellotto armato: rilassato, senza far oscillare la punta.", "Tutto l'anno", "4-6×30-40 m"],
  ["Giavellotto", "Carioca", "GPE", "Mobilità e coordinazione del bacino per i passi incrociati", "Passo incrociato laterale: prepara il pattern del cross-step.", "Tutto l'anno · riscaldamento", "4-6×20 m"],
  ["Giavellotto", "Cross-step trascinando 2-4 kg", "SPE", "Forza specifica della rincorsa", "Passi incrociati trascinando 2.25-4.5 kg: forza specifica della fase di trasporto.", "Prep. speciale", "4-6×20 m"],
  ["Giavellotto", "Simulazione con elastico / cavo", "SPE", "Frustata contro resistenza, senza attrezzo", "Elastico o cavo dietro: simula la frustata a velocità controllata. Per il volume tecnico quando la spalla è affaticata.", "Tutto l'anno", "3-5×8-12"],
  ["Giavellotto", "Axe swings (una e due mani)", "SPE", "Catena tronco-braccio, gesto di «spaccalegna»", "Movimento tipo ascia con clava/palla: dall'alto verso il basso, catena completa.", "Prep. generale e speciale", "3-5×8-10"],
  // ---- COMUNI (multilanci) ----
  ["Comuni (multilanci)", "Lancio avanti dal petto (med ball)", "SDE", "Potenza di spinta della catena", "Palla 3-6 kg: spinta esplosiva avanti dal petto, in piedi o da seduto. Da seduto isola l'arto superiore.", "Tutto l'anno · 2×/sett", "4-8×3-6"],
  ["Comuni (multilanci)", "Lancio dietro sopra la testa (overhead backward)", "SDE", "Potenza esplosiva globale (è anche il test BOST)", "Palla o peso: caricamento con contromovimento e lancio all'indietro sopra la testa. Il multilancio più correlato alla potenza globale.", "Tutto l'anno", "4-8×3-6"],
  ["Comuni (multilanci)", "Lancio dal basso in avanti (underneath forward)", "SDE", "Estensione completa della catena dal basso", "Palla fra le gambe, estensione esplosiva verso l'alto-avanti.", "Tutto l'anno", "4-6×5"],
  ["Comuni (multilanci)", "Lancio laterale in rotazione (power position)", "SDE", "Potenza ROTAZIONALE: la più specifica per disco, martello e peso rotazionale", "Dalla posizione di potenza, rotazione esplosiva e lancio laterale contro un muro o a un compagno. Fai entrambi i lati e confronta (asimmetria).", "Tutto l'anno", "4-8×3-6 per lato"],
  ["Comuni (multilanci)", "Hip throw (palla sull'anca)", "SDE", "Il movimento della posizione di potenza con carico", "Palla tenuta sull'anca: esegui il movimento del finale spingendo la palla lungo la linea del lancio.", "Tutto l'anno", "4-6×5"],
  ["Comuni (multilanci)", "Lancio da sit-up (overhead from sit-up)", "SDE", "Catena addominale esplosiva", "Da seduto, lancio sopra la testa a un compagno alzandoti col tronco.", "Tutto l'anno", "3-5×8-10"],
  ["Comuni (multilanci)", "Scambio schiena-schiena col compagno", "SDE", "Rotazione continua sotto carico leggero", "Schiena contro schiena, passaggio della palla in rotazione: alterna i lati.", "Prep. generale · riscaldamento specifico", "2-3×10 per lato"],
  ["Comuni (multilanci)", "Lancio sopra la testa camminando", "SDE", "Coordinazione fra passo e finale", "Passo avanti e lancio sopra la testa: collega appoggio e catena.", "Prep. generale", "3-5×6-8"],
  ["Comuni", "Lanci con attrezzo PESANTE (+5/10%)", "SDE", "Forza specifica e tenuta delle posizioni", "Stesso gesto con attrezzo più pesante (regola ±10%). Se il gesto cambia, il peso è troppo.", "Prep. generale e speciale · LONTANO dalla gara", "10-25 lanci"],
  ["Comuni", "Lanci con attrezzo LEGGERO (−5/10%)", "SDE", "Velocità di rilascio e arti veloci", "Stesso gesto con attrezzo più leggero: cerca la massima velocità, non la massima forza.", "Pre-competitiva e competitiva · VICINO alla gara", "10-25 lanci"],
  ["Comuni", "Gara simulata (concorso a 6 prove)", "CE", "Routine, tempi di attesa e gestione mentale", "Sei prove coi tempi e i rituali della gara: si allena la prestazione, non solo il gesto.", "Pre-competitiva e competitiva", "6 prove"]
];

// specialità del lancio (Peso/Disco/Martello/Giavellotto) dell'atleta di riferimento del programma
function _lanciRefSpec(p) {
  if (!p || !p.atletaRif) return "";
  const a = (DEMO.atleti || []).find(x => x.id === p.atletaRif);
  return (a && a.specialita) || "";
}
function atletiLanci() { return (DEMO.atleti || []).filter(a => (typeof gruppoDi === "function") ? gruppoDi(a) === "lanci" : true); }
function _optAtletiLanci(selId, vuotoLabel) {
  return `<option value="">${vuotoLabel}</option>` + atletiLanci().map(a =>
    `<option value="${a.id}" ${selId === a.id ? "selected" : ""}>${a.nome}${a.specialita ? " · " + a.specialita : ""}</option>`).join("");
}
// tag attrezzo di un esercizio (per la tendina e i gruppi): "Peso (traslazione)" → "PESO"
function _lanciTag(att) { return att.split(" (")[0].toUpperCase(); }
// opzioni della tendina "Mezzo / contenuto": mezzi generali + esercizi speciali (filtrati per specialità se scelta)
function _lanciMezzoOptions(val, spec) {
  const esc = s => String(s).replace(/"/g, "&quot;");
  const opt = x => `<option value="${esc(x)}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`;
  const shown = new Set(LANCI_MEZZI);
  let html = `<optgroup label="Mezzi allenanti">${LANCI_MEZZI.map(opt).join("")}</optgroup>`;
  const groups = {};
  LANCI_ESERCIZI.forEach(e => { (groups[e[0]] = groups[e[0]] || []).push(_lanciTag(e[0]) + " · " + e[1]); });
  const attrezzi = Object.keys(groups);
  const sp = (spec || "").toLowerCase();
  const wanted = sp ? attrezzi.filter(a => a.toLowerCase().startsWith(sp) || a.startsWith("Comuni")) : attrezzi;
  wanted.forEach(a => { groups[a].forEach(v => shown.add(v)); html += `<optgroup label="${a}">${groups[a].map(opt).join("")}</optgroup>`; });
  // se il valore attuale non è tra le opzioni mostrate (scritto a mano o di altro attrezzo), aggiungilo in testa
  if (val && !shown.has(val)) html = `<optgroup label="Attuale">${opt(val)}</optgroup>` + html;
  return html;
}

// peso dell'attrezzo di gara (kg) impostato nel programma; handlers header
function _lanciKgGara(p) { const v = parseFloat(String((p && p.lanciKgGara) || "").replace(",", ".")); return isNaN(v) ? null : v; }
function setLanciKgGaraVal(v) { pistaInit().lanciKgGara = v; savePista(); }
// n° lanci totali della settimana e di cui gara
function volumeLanciSett(sett) { return (sett.righe || []).reduce((t, r) => t + (Number(r.n) || 0), 0); }
function lanciGaraSett(sett) { return (sett.righe || []).reduce((t, r) => t + ((r.tipo === "Gara") ? (Number(r.n) || 0) : 0), 0); }

// ---------- editor CAMPO (Pista lanci) ----------
function vistaProgrammaPistaLanci() {
  const p = pistaInit();
  if (S.pistaMeso >= p.mesocicli.length) S.pistaMeso = 0;
  const m = p.mesocicli[S.pistaMeso];
  const g = m.giorni[S.pistaGiorno];
  const spec = _lanciRefSpec(p);
  const kgGara = _lanciKgGara(p);
  const optSel = (val, arr) => arr.map(x => `<option value="${String(x).replace(/"/g, "&quot;")}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`).join("");

  const testa = `
    <div class="card"><h3>Programma Campo — lanci</h3>
      <p class="et" style="margin-top:2px">Scegli il <b>mezzo / contenuto</b> (mezzi allenanti o esercizi speciali in pedana), i <b>kg</b> dell'attrezzo, il <b>n° lanci</b>, recupero, % intensità e il <b>tipo</b> (gara / over / under). Lo scostamento % dal peso di gara e i totali escono da soli.</p>
      <p class="et" style="margin-top:8px;color:var(--verde)">✓ Si salva da solo. La tendina «Mezzo/contenuto» segue la <b>Guida mezzi</b> e gli <b>Esercizi speciali</b>.</p></div>
    <div class="card">
      <label class="lab">Riferimento atleta (specialità → esercizi in tendina)</label>
      <select onchange="setPistaTop('atletaRif',this.value)" style="margin-top:6px">${_optAtletiLanci(p.atletaRif, "🎯 Programma madre (tutti gli attrezzi)")}</select>
      <div style="margin-top:12px"><label class="lab">Peso attrezzo di gara (kg)${spec ? " · " + spec : ""}</label>
        <input inputmode="decimal" value="${(p.lanciKgGara || "").toString().replace(/"/g, "&quot;")}" placeholder="es. 7.26" oninput="setLanciKgGaraVal(this.value)" onchange="disegna()" style="margin-top:6px"></div>
      <p class="et" style="margin-top:8px">${kgGara != null ? `Scostamento % calcolato sui <b>${kgGara} kg</b> di gara · over/under entro <b>±10%</b> (regola USATF): pesanti lontano dalla gara, leggeri vicino.` : "Metti il peso dell'attrezzo di gara per vedere lo scostamento % (over/under) di ogni riga."}</p>
    </div>`;

  const tabMeso = `<div class="tabbar">${p.mesocicli.map((_, i) =>
    `<button class="${i === S.pistaMeso ? "on" : ""}" onclick="selMeso(${i})">Meso ${i + 1}</button>`).join("")}
    <button onclick="pistaAddMeso()">＋</button></div>`;
  const cicli = pistaCicliPiano();
  const nSett = nSettimaneMeso(m);
  const testaMeso = `<div class="card">
      <label class="lab">Mesociclo dal Piano &amp; Picco</label>
      <select onchange="setPistaMesoDaPiano(this.value)" style="margin-top:6px">
        <option value="">— scegli (o imposta a mano) —</option>
        ${cicli.map((c, i) => `<option value="${i}">Ciclo ${c.ciclo} · ${c.nWeeks} sett · dal ${c.data.getDate()} ${MESI_IT[c.data.getMonth()]}</option>`).join("")}
      </select>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Ciclo (carico+scarico)</label>
          <select onchange="setPistaMeso('ciclo',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.ciclo, (typeof CICLI !== "undefined" ? CICLI : []))}</select></div>
        <div><label class="lab">Inizio Sett. 1</label>
          <input type="date" value="${m.inizio || ""}" onchange="setPistaMeso('inizio',this.value)" style="margin-top:6px"></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Blocco</label>
          <select onchange="setPistaMeso('blocco',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.blocco, LANCI_BLOCCHI)}</select></div>
        <div><label class="lab">Focus mesociclo</label>
          <input value="${(m.focus || "").replace(/"/g, "&quot;")}" placeholder="Es. forza-potenza" oninput="setPistaMesoVal('focus',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      </div>
      <p class="et" style="margin-top:10px">${m.ciclo ? `<b style="color:var(--txt)">${nSett} settimane</b> (ciclo ${m.ciclo}) · l'ultima è di scarico` : "Scegli un ciclo (o dal Piano & Picco) per sapere quante settimane sono e quale è lo scarico."}</p>
    </div>`;

  const tabGiorno = `<div class="tabbar">${m.giorni.map((_, i) =>
    `<button class="${i === S.pistaGiorno ? "on" : ""}" onclick="selGiorno(${i})">Giorno ${i + 1}</button>`).join("")}</div>`;
  const testaGiorno = `<div class="card">
      <label class="lab">Giorno della settimana</label>
      <select onchange="setPistaGiorno('giornoSett',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(g.giornoSett, ["lun", "mar", "mer", "gio", "ven", "sab", "dom"])}</select>
      <label class="lab" style="display:block;margin-top:12px">Riscaldamento</label>
      <button class="btn btn-2" style="margin-top:6px;text-align:left" onclick="apriRiscPista()">${riscRiassunto(g)}</button>
      <label class="lab" style="display:block;margin-top:12px">Pliometria / policoncorrenza</label>
      <button class="btn btn-2" style="margin-top:6px;text-align:left" onclick="apriPlio()">${plioRiassunto(g)}</button>
    </div>`;

  const listaSett = settimaneDelGiorno(m, g);
  const copiaBtn = listaSett.length > 1
    ? `<button class="btn btn-2" style="margin-bottom:11px" onclick="pistaCopiaSettimana()">⧉ Copia settimana 1 sulle altre${m.ciclo && m.ciclo !== "1" ? " (scarico −50% auto)" : ""}</button>`
    : "";
  const settimane = listaSett.map((sett, s) => {
    const scar = isScaricoIdx(m, s);
    const nota = (sett.nota || "").trim();
    const righe = sett.righe.map((r, i) => {
      const kg = parseFloat(String(r.kg || "").replace(",", "."));
      const delta = (!isNaN(kg) && kgGara > 0) ? (kg / kgGara - 1) : null;
      const dTxt = delta == null ? "—" : (delta === 0 ? "gara" : (delta > 0 ? "+" : "") + Math.round(delta * 100) + "%");
      const dCls = delta != null && Math.abs(delta) > 0.10 ? "male" : "";
      return `<tr>
        <td><select onchange="setPistaRiga(${s},${i},'mezzo',this.value)"><option value="">—</option>${_lanciMezzoOptions(r.mezzo, spec)}</select></td>
        <td><input inputmode="decimal" value="${r.kg || ""}" placeholder="kg" oninput="setPistaRigaVal(${s},${i},'kg',this.value)" onchange="disegna()" style="min-width:52px"></td>
        <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setPistaRigaVal(${s},${i},'n',this.value)" onchange="disegna()" style="min-width:46px"></td>
        <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setPistaRigaVal(${s},${i},'rec',this.value)" style="min-width:58px"></td>
        <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setPistaRigaVal(${s},${i},'perc',this.value)" style="min-width:46px"></td>
        <td><select onchange="setPistaRiga(${s},${i},'tipo',this.value)"><option value="">—</option>${optSel(r.tipo, LANCI_TIPO_ATTR)}</select></td>
        <td class="pauto ${dCls}">${dTxt}</td>
        <td><button class="chiudi" style="font-size:14px" onclick="pistaDelRiga(${s},${i})" aria-label="Rimuovi">✕</button></td>
      </tr>`;
    }).join("");
    const nTot = volumeLanciSett(sett), nGara = lanciGaraSett(sett);
    return `<div class="card"${scar ? ' style="border-color:rgba(240,168,60,.45)"' : ""}>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <p style="font-weight:600;font-size:13px;margin:0">Settimana ${s + 1}</p>
        ${scar ? '<span class="pill p-giallo">scarico</span>' : ""}
      </div>
      <div class="p-scroll"><table class="ptab pista-w">
        <thead><tr><th>Mezzo / contenuto</th><th>Attrezzo kg</th><th>n° lanci</th><th>Rec</th><th>% int</th><th>Tipo</th><th>Δ% gara</th><th></th></tr></thead>
        <tbody>${righe}</tbody>
      </table></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="pistaAddRiga(${s})">＋ riga</button>
        <span class="et">Lanci totali: <b style="color:var(--verde);font-size:14px">${nTot}</b>${nGara ? ` · di cui gara <b>${nGara}</b>` : ""}</span>
      </div>
      ${s > 0 && !scar ? `<div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <span class="et" style="margin:0">↑ da sett. ${s} · n° lanci:</span>
        <select id="pgp-${s}" style="padding:7px 8px;width:auto;flex:none">${(typeof PROG_VOL !== "undefined" ? PROG_VOL : [10, 20]).map(o => `<option>${o}</option>`).join("")}</select>
        <button class="btn btn-2" style="width:auto;padding:7px 12px" onclick="applicaProgrPista(${s})">+% applica</button>
      </div>` : ""}
      ${s > 0 && scar ? `<button class="btn btn-2" style="margin-top:8px" onclick="applicaScaricoPista(${s})">⬇ Scarico: n° lanci al 50% della sett. ${s}</button>` : ""}
      <button class="btn btn-2" style="margin-top:8px;text-align:left;font-size:13px" onclick="apriNotaSeduta(${s})">📝 ${nota ? "Nota: " + (nota.length > 42 ? nota.slice(0, 42) + "…" : nota) : "Nota tecnica del giorno"}</button>
    </div>`;
  }).join("");

  return (typeof selettoreProgGruppo === "function" ? selettoreProgGruppo() : "") + testa + tabMeso + testaMeso + tabGiorno + testaGiorno + copiaBtn + settimane;
}

// ---------- generazione seduta lanci per l'atleta (dal madre del gruppo "lanci") ----------
function _generaSedutaPistaLanci(g, giornoNum, settIdx, dataISO, meso, atleta, prog, sett, allRighe) {
  const righe = allRighe.filter(r => r.mezzo && Number(r.n) > 0);
  if (!righe.length) return null;
  const aid = atleta.id;
  const kgGara = _lanciKgGara(prog);
  const elementi = righe.map((r, i) => {
    const kg = parseFloat(String(r.kg || "").replace(",", "."));
    const delta = (!isNaN(kg) && kgGara > 0) ? (kg / kgGara - 1) : null;
    const nl = Number(r.n) || 0;
    const nMis = Math.min(Math.max(nl, 1), 6);
    return {
      id: "e" + i, mezzo: r.mezzo, contenuto: r.contenuto || "", kg: isNaN(kg) ? null : kg,
      tipo: r.tipo || "", lanci: nl, deltaPct: delta, perc: Number(r.perc) || null,
      recupero: r.rec || "", misure: Array(nMis).fill(null)
    };
  });
  return _cacheSeduta({
    id: "gen-p-" + aid + "-" + dataISO + "-g" + giornoNum, tipo: "pista", lanci: true, giorno: giornoNum,
    quando: "", data: dataLunga(dataISO), dataISO: dataISO, atletaId: aid,
    focus: (meso && meso.focus) || "", obiettivi: "", notaCoach: (sett && sett.nota) || "", riscaldamento: [],
    plio: (g.plio || []).filter(r => r.es),
    elementi, durata: null, rpe: null, fastidi: false, chiusa: false
  });
}

// ---------- vista atleta: seduta lanci (prescrizione + registrazione misure) ----------
function _lanciDeltaTxt(e) {
  if (e.deltaPct == null) return e.tipo || "";
  const d = e.deltaPct;
  const pct = d === 0 ? "gara" : (d > 0 ? "+" : "") + Math.round(d * 100) + "%";
  return (e.tipo ? e.tipo + " · " : "") + pct;
}
function volumeLanciSeduta(s) { return (s.elementi || []).reduce((t, e) => t + (Number(e.lanci) || 0), 0); }
function vistaPistaLanci(s) {
  return `${bloccoRiscaldamento(s)}
  ${typeof bloccoPliometria === "function" ? bloccoPliometria(s) : ""}
  ${s.elementi.map(e => {
    const fatte = (e.misure || []).filter(v => v !== null);
    const best = fatte.length ? Math.max(...fatte) : null;
    const caselle = (e.misure || []).map((v, i) =>
      `<input class="tempo${best != null && v === best ? " bene" : ""}" inputmode="decimal" value="${v === null ? "" : v}" placeholder="m"
        onchange="segnaMisura('${s.id}','${e.id}',${i},this.value)">`).join("");
    const meta = [e.kg != null ? e.kg + " kg" : "", _lanciDeltaTxt(e), e.perc != null ? e.perc + "%" : "", e.recupero ? "rec " + e.recupero : ""].filter(Boolean).join(" · ");
    const vid = (typeof esVideoDi === "function") ? esVideoDi(e.mezzo) : "";
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
        <h3 style="margin:0">${e.mezzo || "Lanci"}</h3>
        <span class="et" style="margin:0">${e.lanci ? e.lanci + " lanci" : ""}</span>
      </div>
      ${vid ? `<button class="btn btn-2" style="width:auto;padding:6px 12px;margin:6px 0 2px" onclick="vediVideoMezzo('${String(e.mezzo).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">▶ Vedi il video</button>` : ""}
      ${meta ? `<p class="et" style="margin:4px 0 8px">${meta}</p>` : ""}
      ${e.contenuto ? `<p class="et" style="margin:0 0 8px">${e.contenuto}</p>` : ""}
      <p class="et" style="margin:0 0 6px">Segna le misure (m) che hai preso${best != null ? ` · <b style="color:var(--verde)">meglio ${best.toFixed(2)} m</b>` : ""}</p>
      <div class="tempi">${caselle}</div>
    </div>`;
  }).join("")}
  <div class="card" style="display:flex;justify-content:space-between;align-items:center">
    <span class="et" style="margin:0">Lanci totali della seduta</span>
    <b style="font-size:17px">${volumeLanciSeduta(s)}</b>
  </div>
  ${bloccoChiusura(s)}`;
}
function segnaMisura(sid, eid, i, val) {
  const s = sedutaDaId(sid), e = s && s.elementi.find(x => x.id === eid);
  if (!e) return;
  const n = parseFloat(String(val).replace(",", "."));
  e.misure[i] = isNaN(n) ? null : n;
  disegna();
}
// registro lanci: mezzo / attrezzo / n° / miglior misura → per andamento e riepilogo
function registraLancio(atletaId, mezzo, kg, tipo, lanci, migliore) {
  if (!atletaId || !mezzo) return;
  DEMO.lanciLog = DEMO.lanciLog || [];
  DEMO.lanciLog.push({
    data: new Date().toISOString().slice(0, 10), atletaId, mezzo,
    kg: kg != null ? kg : null, tipo: tipo || null,
    lanci: lanci != null ? Number(lanci) : null,
    misura: migliore != null ? Math.round(migliore * 100) / 100 : null
  });
  if (typeof salvaCustom === "function") salvaCustom();
}

// ---------- LIBRERIA Esercizi speciali (per disciplina, con video, espandibile) ----------
// Categorie: lanci (seed USATF) + sprint/salti (vuote, da riempire nel tempo).
const ES_SPEC_CAT = ["Peso", "Giavellotto", "Disco", "Martello", "Velocità", "Lungo", "Triplo", "Alto", "Asta", "Multilanci comuni"];
const ES_SPEC_SEED = ["Peso", "Giavellotto", "Disco", "Martello", "Multilanci comuni"]; // categorie con contenuti di serie
// mappa l'attrezzo di un esercizio built-in → categoria della libreria
function _esCatDi(att) { const t = _lanciTag(att); return t === "COMUNI" ? "Multilanci comuni" : t.charAt(0) + t.slice(1).toLowerCase(); }
function esBuiltinCat(cat) { return LANCI_ESERCIZI.filter(e => _esCatDi(e[0]) === cat); }
function esCustomCat(cat) { return (DEMO.eserciziSpec || []).filter(x => x.cat === cat); }
function _esKeyBuiltin(e) { return _lanciTag(e[0]) + " · " + e[1]; }   // = valore tendina Campo (i video si riflettono nella seduta)
function esVideoDi(key) { return (DEMO.eserciziVideo || {})[key] || ""; }
function setEsSpecCat(c) { S.esSpecCat = c; disegna(); window.scrollTo(0, 0); }
// apre il video di un mezzo/esercizio (usato nella seduta dell'atleta)
function vediVideoMezzo(mezzo) { const url = esVideoDi(mezzo); if (url && typeof apriVideo === "function") apriVideo(mezzo, url); }

// scheda esercizio: dettagli + video embed + azioni (aggiungi/cambia video, elimina se è tuo)
function apriEsScheda(kind, idx) {
  const cat = S.esSpecCat || "Peso";
  let nome, corpo, key, cid = null;
  if (kind === "b") {
    const e = esBuiltinCat(cat)[idx]; if (!e) return;
    nome = e[1]; key = _esKeyBuiltin(e);
    corpo = `<p class="et" style="margin:0"><b>Categoria:</b> ${e[2]}</p>
      <p style="font-size:14px;margin:6px 0 0"><b>Scopo:</b> ${e[3]}</p>
      <p style="font-size:13px;margin:6px 0 0;color:var(--txt2)">${e[4]}</p>
      <p class="et" style="margin:6px 0 0">${e[5]} · <b>${e[6]}</b></p>`;
  } else {
    const x = esCustomCat(cat)[idx]; if (!x) return;
    nome = x.nome; key = "custom:" + x.id; cid = x.id;
    corpo = `<p style="font-size:14px;margin:0;white-space:pre-wrap">${(x.spiegazione || "").replace(/</g, "&lt;") || "<span class='et'>(nessuna spiegazione)</span>"}</p>`;
  }
  const url = esVideoDi(key), emb = (typeof ytEmbed === "function") ? ytEmbed(url) : "";
  mostraFoglio(`
    <div class="foglio-top"><h3>${nome}</h3><button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    ${corpo}
    ${emb
      ? `<div class="yt-wrap" style="margin-top:10px"><iframe src="${emb}" title="${nome}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>
         <a class="et" style="display:block;text-align:center;margin-top:8px;color:var(--blu)" href="${url}" target="_blank" rel="noopener">apri su YouTube ↗</a>`
      : `<p class="et" style="margin-top:10px">Nessun video ancora per questo esercizio.</p>`}
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="apriVideoEs('${kind}',${idx})">${url ? "✏ Cambia video" : "＋ Aggiungi video"}</button>
      ${cid ? `<button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="delEsercizioSpec('${cid}')">🗑 Elimina</button>` : ""}
    </div>`);
}
// form: imposta/cambia l'URL del video di un esercizio
function apriVideoEs(kind, idx) {
  const cat = S.esSpecCat || "Peso";
  let nome, key;
  if (kind === "b") { const e = esBuiltinCat(cat)[idx]; if (!e) return; nome = e[1]; key = _esKeyBuiltin(e); }
  else { const x = esCustomCat(cat)[idx]; if (!x) return; nome = x.nome; key = "custom:" + x.id; }
  const url = esVideoDi(key);
  mostraFoglio(`
    <div class="foglio-top"><h3>Video · ${nome}</h3><button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    <p class="et" style="margin-bottom:8px">Incolla il link YouTube (video, youtu.be o shorts). Si vedrà qui e anche in allenamento quando l'esercizio è nel programma.</p>
    <input id="es-vid-url" value="${(url || "").replace(/"/g, "&quot;")}" placeholder="https://youtu.be/..." style="margin-bottom:10px">
    <button class="btn btn-1" onclick="salvaVideoEs('${key.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">Salva video</button>
    ${url ? `<button class="btn btn-2" style="margin-top:8px" onclick="salvaVideoEs('${key.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}',true)">Rimuovi video</button>` : ""}`);
}
function salvaVideoEs(key, rimuovi) {
  DEMO.eserciziVideo = DEMO.eserciziVideo || {};
  const v = rimuovi ? "" : ((document.getElementById("es-vid-url") || {}).value || "").trim();
  if (v) DEMO.eserciziVideo[key] = v; else delete DEMO.eserciziVideo[key];
  // se è un esercizio tuo, tieni allineato anche il campo video del record
  if (key.indexOf("custom:") === 0) { const id = key.slice(7); const x = (DEMO.eserciziSpec || []).find(e => e.id === id); if (x) x.video = v; }
  if (typeof salvaCustom === "function") salvaCustom();
  chiudiScheda(); disegna();
}
// aggiungi un esercizio alla categoria corrente
function apriAggiungiEsercizio() {
  const cat = S.esSpecCat || "Peso";
  mostraFoglio(`
    <div class="foglio-top"><h3>Aggiungi esercizio · ${cat}</h3><button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    <label class="lab">Nome esercizio</label>
    <input id="es-new-nome" placeholder="es. Balzi tra ostacoli" style="margin:6px 0 10px">
    <label class="lab">Spiegazione (come si esegue, scopo, quando)</label>
    <textarea id="es-new-spieg" rows="4" placeholder="descrivi l'esercizio..." style="margin:6px 0 10px"></textarea>
    <label class="lab">Video YouTube (facoltativo)</label>
    <input id="es-new-video" placeholder="https://youtu.be/..." style="margin:6px 0 12px">
    <button class="btn btn-1" onclick="salvaEsercizioSpec()">Salva esercizio</button>`);
}
function salvaEsercizioSpec() {
  const nome = ((document.getElementById("es-new-nome") || {}).value || "").trim();
  if (!nome) { alert("Metti il nome dell'esercizio."); return; }
  const spieg = ((document.getElementById("es-new-spieg") || {}).value || "").trim();
  const video = ((document.getElementById("es-new-video") || {}).value || "").trim();
  DEMO.eserciziSpec = DEMO.eserciziSpec || [];
  const id = "es" + Date.now();
  DEMO.eserciziSpec.push({ id, cat: S.esSpecCat || "Peso", nome, spiegazione: spieg, video });
  if (video) { DEMO.eserciziVideo = DEMO.eserciziVideo || {}; DEMO.eserciziVideo["custom:" + id] = video; }
  if (typeof salvaCustom === "function") salvaCustom();
  chiudiScheda(); disegna();
}
function delEsercizioSpec(id) {
  DEMO.eserciziSpec = (DEMO.eserciziSpec || []).filter(x => x.id !== id);
  if (DEMO.eserciziVideo) delete DEMO.eserciziVideo["custom:" + id];
  if (typeof salvaCustom === "function") salvaCustom();
  chiudiScheda(); disegna();
}

function vistaEserciziSpeciali() {
  if (!S.esSpecCat || !ES_SPEC_CAT.includes(S.esSpecCat)) S.esSpecCat = "Peso";
  const cat = S.esSpecCat;
  const catCol = c => c === "CE" ? "var(--rosso,#c00000)" : "var(--blu,#1f3864)";
  const builtin = esBuiltinCat(cat), custom = esCustomCat(cat);
  const isSeed = ES_SPEC_SEED.includes(cat);
  const selettore = `<div class="card">
    <label class="lab">Disciplina / gruppo</label>
    <select onchange="setEsSpecCat(this.value)" style="margin-top:6px">${ES_SPEC_CAT.map(c => `<option ${c === cat ? "selected" : ""}>${c}</option>`).join("")}</select>
    <p class="et" style="margin-top:8px">${builtin.length + custom.length} esercizi in «${cat}»${isSeed ? " · progressione USATF + i tuoi" : " · aggiungi i tuoi per iniziare"}. Tocca per scheda e video.</p>
  </div>`;
  const rowBuiltin = (e, i) => { const hasV = !!esVideoDi(_esKeyBuiltin(e)); return `<div class="lib-row" onclick="apriEsScheda('b',${i})">
      <div style="flex:1;min-width:0"><div style="font-weight:500">${e[1]} <span class="pill" style="background:${catCol(e[2])};color:#fff;font-size:10px">${e[2]}</span></div>
        <div class="et" style="margin-top:1px">${e[3]}</div></div>
      ${hasV ? '<span class="vid-ic">▶</span>' : ""}<span class="freccia">›</span></div>`; };
  const rowCustom = (x, i) => { const hasV = !!esVideoDi("custom:" + x.id); const s = (x.spiegazione || ""); return `<div class="lib-row" onclick="apriEsScheda('c',${i})">
      <div style="flex:1;min-width:0"><div style="font-weight:500">${x.nome} <span class="pill" style="background:var(--verde,#3a9);color:#fff;font-size:10px">tuo</span></div>
        <div class="et" style="margin-top:1px">${s.slice(0, 60)}${s.length > 60 ? "…" : ""}</div></div>
      ${hasV ? '<span class="vid-ic">▶</span>' : ""}<span class="freccia">›</span></div>`; };
  const lista = (builtin.length || custom.length)
    ? builtin.map(rowBuiltin).join("") + custom.map(rowCustom).join("")
    : `<div class="card"><p class="et" style="margin:0">Ancora nessun esercizio in «${cat}». Aggiungine uno qui sotto: nel tempo costruisci la tua libreria.</p></div>`;
  return `<div class="card"><h3>Esercizi speciali</h3>
      <p class="et" style="margin-top:2px">Libreria di esercizi per disciplina, con video. Scegli la disciplina, apri scheda e video, e aggiungi i tuoi (con spiegazione e video): nel tempo diventa una libreria completa. Gli esercizi dei lanci sono anche nella tendina «Mezzo / contenuto» del <b>Campo</b>.</p></div>
    ${selettore}
    ${lista}
    <button class="btn btn-1" style="margin-top:4px" onclick="apriAggiungiEsercizio()">＋ Aggiungi esercizio a «${cat}»</button>`;
}

// ============================================================================
// TEST LANCI — Velocità di rilascio + Profilo carico-velocità (over/under).
// Fedeli ai fogli Excel "Velocita rilascio" e "Profilo attrezzo" (modello balistico g=9.81).
// ============================================================================
const _G_LANCI = 9.81;
// velocità (m/s) richiesta per lanciare a distanza R (m), angolo ang (°), altezza rilascio h (m)
function _vReqLanci(R, ang, h) {
  if (!(R > 0) || h == null || isNaN(h)) return null;
  const a = ang * Math.PI / 180, c = Math.cos(a);
  const den = 2 * c * c * (h + R * Math.tan(a));
  if (den <= 0) return null;
  const v = R * Math.sqrt(_G_LANCI / den);
  return isNaN(v) ? null : v;
}
// distanza (m) da velocità v (m/s), angolo ang (°), altezza h (m)
function _rDistLanci(v, ang, h) {
  if (!(v > 0) || h == null || isNaN(h)) return null;
  const a = ang * Math.PI / 180, c = Math.cos(a), t = Math.tan(a);
  const A = v * v * c * c;
  const disc = A * A * t * t + 2 * _G_LANCI * A * h;
  if (disc < 0) return null;
  const R = (A * t + Math.sqrt(disc)) / _G_LANCI;
  return isNaN(R) ? null : R;
}
// angolo tipico misurato per attrezzo (default suggerito)
const LANCI_ANG_TIPICO = { "Peso": 37, "Disco": 37, "Martello": 43, "Giavellotto": 34 };
const LANCI_HREL_TIPICA = { "Peso": "≈2.0-2.2", "Disco": "≈1.6-1.8", "Martello": "≈1.5-1.7", "Giavellotto": "≈1.8-2.0" };

let lanciTestState = { atletaRif: "" };
function setLanciTestAtleta(id) { lanciTestState.atletaRif = id; disegna(); }
function _lanciAtletaRif() { return lanciTestState.atletaRif ? (DEMO.atleti || []).find(x => x.id === lanciTestState.atletaRif) : null; }
const _LANCI_NO_ATLETI = `<p class="et" style="margin-top:8px">Nessun lanciatore in squadra: aggiungi un atleta con disciplina «lanci».</p>`;

// peso (kg) dell'attrezzo dall'etichetta PB: "Martello 4 kg"→4 · "Peso 7,26 kg"→7.26 · "Giavellotto 600 g"→0.6
function _parseKgAttrezzo(evento) {
  if (!evento) return null;
  const s = String(evento);
  let m = s.match(/([\d.,]+)\s*kg/i);
  if (m) { const v = Number(m[1].replace(",", ".")); return isNaN(v) ? null : v; }
  m = s.match(/([\d.,]+)\s*g\b/i);
  if (m) { const v = Number(m[1].replace(",", ".")); return isNaN(v) ? null : v / 1000; }
  return null;
}
// info PB dell'atleta sulla specialità: { pb (m, sull'attrezzo di gara), kg (peso attrezzo), evento }
// gli eventi PB dei lanci sono tipo "Martello 4 kg": il match è per PREFISSO (specialità) e il peso si legge dall'etichetta.
function pbLanciInfo(a) {
  const none = { pb: null, kg: null, evento: null };
  if (!a || !a.scheda) return none;
  const spec = (a.specialita || "").trim().toLowerCase();
  const rows = (a.scheda.pb || []).filter(r => r[0] != null && r[1] != null && r[1] !== "" &&
    (spec ? String(r[0]).trim().toLowerCase().startsWith(spec) : true));
  if (!rows.length) return none;
  // attrezzo di gara = quello del PB più recente (data ISO r[6], altrimenti anno r[2])
  const dt = r => String(r[6] || r[2] || "");
  const recent = rows.slice().sort((x, y) => dt(y).localeCompare(dt(x)))[0];
  const kgGara = _parseKgAttrezzo(recent[0]);
  // PB = miglior misura su quell'attrezzo (se identificato), altrimenti su tutte le prove della specialità
  const same = kgGara != null ? rows.filter(r => _parseKgAttrezzo(r[0]) === kgGara) : rows;
  const vals = same.map(r => parseMisura("lanci", r[1])).filter(v => v != null && !isNaN(v));
  return { pb: vals.length ? Math.max(...vals) : null, kg: kgGara, evento: recent[0] };
}
// miglior PB (m) di un atleta sulla sua specialità
function pbLanciMigliore(a) { return pbLanciInfo(a).pb; }
// TUTTI gli attrezzi su cui l'atleta ha un PB: [{evento, kg, pb, dt}] — per scegliere quale profilare
// (un lanciatore può allenare più attrezzi/pesi). Ordina: specialità prima, poi più recenti.
function pbLanciAttrezzi(a) {
  if (!a || !a.scheda) return [];
  const spec = (a.specialita || "").trim().toLowerCase();
  const byLabel = {};
  (a.scheda.pb || []).forEach(r => {
    if (r[0] == null || r[1] == null || r[1] === "") return;
    const v = parseMisura("lanci", r[1]); if (v == null || isNaN(v)) return;
    const label = String(r[0]).trim(), dt = String(r[6] || r[2] || "");
    if (!byLabel[label]) byLabel[label] = { evento: label, kg: _parseKgAttrezzo(label), pb: v, dt };
    else { if (v > byLabel[label].pb) byLabel[label].pb = v; if (dt > byLabel[label].dt) byLabel[label].dt = dt; }
  });
  return Object.values(byLabel).sort((x, y) => {
    const sx = spec && x.evento.toLowerCase().startsWith(spec) ? 0 : 1;
    const sy = spec && y.evento.toLowerCase().startsWith(spec) ? 0 : 1;
    if (sx !== sy) return sx - sy;
    return String(y.dt).localeCompare(String(x.dt));
  });
}
// scelta dell'attrezzo da profilare → resetta il peso di gara così si ri-deduce dal nuovo attrezzo
function setPaAttrezzo(v) { const a = _lanciAtletaRif(); if (!a) return; const t = _profAttrTest(a.id); t.attrezzoSel = v; t.pesoGara = ""; _paSave(); disegna(); }
// obiettivo (m) dall'attrezzo di gara (stessa selezione di pbLanciInfo: match per prefisso specialità + PB più recente)
function obiettivoLanciScheda(a) {
  if (!a || !a.scheda) return null;
  const spec = (a.specialita || "").trim().toLowerCase();
  const rows = (a.scheda.pb || []).filter(r => r[0] != null && r[1] != null && r[1] !== "" &&
    (spec ? String(r[0]).trim().toLowerCase().startsWith(spec) : true));
  if (!rows.length) return null;
  const dt = r => String(r[6] || r[2] || "");
  const recent = rows.slice().sort((x, y) => dt(y).localeCompare(dt(x)))[0];
  const kg = _parseKgAttrezzo(recent[0]);
  const same = kg != null ? rows.filter(r => _parseKgAttrezzo(r[0]) === kg) : rows;
  let best = null, obj = null;
  same.forEach(r => { const v = parseMisura("lanci", r[1]); if (v != null && (best == null || v > best)) { best = v; obj = r[4]; } });
  const o = (obj != null && obj !== "") ? parseMisura("lanci", obj) : null;
  return (o != null && !isNaN(o)) ? o : null;
}

// ---------- TEST 1: Velocità di rilascio ----------
function _velRilTest(aid) {
  DEMO.velRilascio = DEMO.velRilascio || {};
  if (!DEMO.velRilascio[aid]) DEMO.velRilascio[aid] = { angolo: "", hRel: "", obiettivo: "", vMis: "", vProva: "" };
  return DEMO.velRilascio[aid];
}
function _vrSave() { if (typeof salvaCustom === "function") salvaCustom(); }
function setVrCampo(campo, v) { const a = _lanciAtletaRif(); if (!a) return; _velRilTest(a.id)[campo] = v; _vrSave(); disegna(); }
function setVrCampoVal(campo, v) { const a = _lanciAtletaRif(); if (!a) return; _velRilTest(a.id)[campo] = v; _vrSave(); }

function vistaVelocitaRilascio() {
  const a = _lanciAtletaRif();
  const selAtleta = `<div class="card">
    <label class="lab">Atleta (lanci)</label>
    <select onchange="setLanciTestAtleta(this.value)" style="margin-top:6px">${_optAtletiLanci(lanciTestState.atletaRif, "— scegli —")}</select>
    ${atletiLanci().length === 0 ? _LANCI_NO_ATLETI : ""}</div>`;
  const intro = `<div class="card"><h3>Velocità di rilascio</h3>
    <p class="et" style="margin-top:2px">È il <b>predittore n.1</b> della distanza (martello r=0.86 · disco r=0.87). La misura cresce circa col <b>quadrato</b> della velocità: <b>+2% di velocità ≈ +4% di misura</b>. Da misura, angolo e altezza di rilascio esce la velocità richiesta (modello balistico, g=9.81).</p></div>`;
  if (!a) return selAtleta + intro + `<div class="card"><p class="et" style="margin:0">Scegli un lanciatore per calcolare la velocità di rilascio che gli serve.</p></div>`;

  const t = _velRilTest(a.id);
  const spec = a.specialita || "";
  const angTip = LANCI_ANG_TIPICO[spec];
  const ang = (t.angolo !== "" && t.angolo != null) ? Number(String(t.angolo).replace(",", ".")) : null;
  const h = (t.hRel !== "" && t.hRel != null) ? Number(String(t.hRel).replace(",", ".")) : null;
  const pb = pbLanciMigliore(a);
  const obiUser = (t.obiettivo !== "" && t.obiettivo != null) ? Number(String(t.obiettivo).replace(",", ".")) : null;
  const obi = obiUser != null ? obiUser : obiettivoLanciScheda(a);
  const vMis = (t.vMis !== "" && t.vMis != null) ? Number(String(t.vMis).replace(",", ".")) : null;
  const an = (a.scheda && a.scheda.anagrafica) || {};

  const testa = `<div class="card">
      <div class="griglia2">
        <div><label class="lab">Attrezzo</label><input value="${spec}" disabled style="margin-top:6px"></div>
        <div><label class="lab">PB (m) <span style="color:var(--txt3)">(dal profilo)</span></label><input value="${pb != null ? pb.toFixed(2) : ""}" disabled placeholder="—" style="margin-top:6px"></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Angolo di rilascio (°)</label>
          <input inputmode="decimal" value="${t.angolo || ""}" placeholder="${angTip ? "tipico " + angTip + "°" : "es. 37"}" oninput="setVrCampoVal('angolo',this.value)" onchange="disegna()" style="margin-top:6px"></div>
        <div><label class="lab">Altezza di rilascio (m)</label>
          <input inputmode="decimal" value="${t.hRel || ""}" placeholder="${LANCI_HREL_TIPICA[spec] || "es. 2.0"}${an.altezza ? " · h corpo " + an.altezza + "cm" : ""}" oninput="setVrCampoVal('hRel',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Obiettivo (m)</label>
          <input inputmode="decimal" value="${t.obiettivo || ""}" placeholder="${obiettivoLanciScheda(a) != null ? obiettivoLanciScheda(a).toFixed(2) + " (dal profilo)" : "es. 19.00"}" oninput="setVrCampoVal('obiettivo',this.value)" onchange="disegna()" style="margin-top:6px"></div>
        <div><label class="lab">v misurata (m/s) <span style="color:var(--txt3)">(radar/video)</span></label>
          <input inputmode="decimal" value="${t.vMis || ""}" placeholder="opzionale" oninput="setVrCampoVal('vMis',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      </div>
      <p class="et" style="margin-top:10px">Angoli tipici misurati: PESO ~37° · DISCO 35-40° · MARTELLO 42-45° · GIAVELLOTTO 31-36°. L'angolo ottimale <b>non è 45°</b> (si rilascia da sopra il suolo e la velocità cala se l'angolo sale).</p>
    </div>`;

  // 1) velocità richiesta per PB e obiettivo
  const rigaReq = (lbl, R) => {
    const vr = (R != null && ang != null && h != null) ? _vReqLanci(R, ang, h) : null;
    let lettura;
    if (vr == null) lettura = "(inserisci angolo e altezza di rilascio)";
    else if (vMis == null) lettura = `Servono <b>${vr.toFixed(2)} m/s</b> al rilascio per ${R.toFixed(2)} m (misura la v con radar/video per il confronto)`;
    else { const d = vr - vMis; lettura = d <= 0 ? "✔ la velocità misurata basta: il resto è angolo/tecnica" : `<b>${d.toFixed(2)} m/s</b> da guadagnare ≈ <b>${(d / vMis * 100).toFixed(1)}%</b> di velocità`; }
    return `<tr><td><b>${lbl}</b></td><td class="pauto">${R != null ? R.toFixed(2) : "—"}</td><td class="pauto"><b>${vr != null ? vr.toFixed(2) : "—"}</b></td><td class="pauto">${vMis != null ? vMis.toFixed(2) : "—"}</td><td class="et" style="text-align:left">${lettura}</td></tr>`;
  };
  const sez1 = `<div class="card"><p class="et" style="margin-bottom:6px"><b>1) Velocità richiesta</b> per il tuo PB e per l'obiettivo</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>&nbsp;</th><th>Misura (m)</th><th>v richiesta</th><th>v misurata</th><th>Lettura</th></tr></thead>
      <tbody>${rigaReq("PB attuale", pb)}${rigaReq("Obiettivo", obi)}</tbody>
    </table></div></div>`;

  // 2) tabella % PB × angoli
  const ANG = [30, 33, 35, 37, 40, 42, 45];
  const PCT = [0.90, 0.95, 1.00, 1.02, 1.05, 1.08, 1.10, 1.15];
  const rows2 = PCT.map(pct => {
    const R = pb != null ? pb * pct : null;
    const cells = ANG.map(agv => { const vr = (R != null && h != null) ? _vReqLanci(R, agv, h) : null; const hit = ang != null && agv === Math.round(ang); return `<td class="pauto${hit ? " bene" : ""}">${vr != null ? vr.toFixed(2) : "—"}</td>`; }).join("");
    const vTuo = (R != null && ang != null && h != null) ? _vReqLanci(R, ang, h) : null;
    return `<tr><td><b>${Math.round(pct * 100)}%</b></td><td class="pauto">${R != null ? R.toFixed(2) : "—"}</td>${cells}<td class="pauto"><b>${vTuo != null ? vTuo.toFixed(2) : "—"}</b></td></tr>`;
  }).join("");
  const sez2 = `<div class="card"><p class="et" style="margin-bottom:6px"><b>2) Velocità richiesta</b> per misura e angolo</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>% PB</th><th>Misura</th>${ANG.map(agv => `<th>${agv}°</th>`).join("")}<th>tuo ang.</th></tr></thead>
      <tbody>${rows2}</tbody>
    </table></div>
    <p class="et" style="margin-top:8px">${pb == null ? "Manca il PB nel profilo dell'atleta." : (h == null ? "Inserisci l'altezza di rilascio per calcolare." : "Ultima colonna = velocità al TUO angolo. Spesso conviene aggiustare l'angolo più che spingere di più.")}</p></div>`;

  // 3) da velocità a misura
  const vProva = (t.vProva !== "" && t.vProva != null) ? Number(String(t.vProva).replace(",", ".")) : null;
  const cells3 = ANG.map(agv => { const R = (vProva != null && h != null) ? _rDistLanci(vProva, agv, h) : null; return `<td class="pauto">${R != null ? R.toFixed(2) : "—"}</td>`; }).join("");
  const sez3 = `<div class="card"><p class="et" style="margin-bottom:6px"><b>3) Da velocità a misura</b> — quanto lanceresti con una certa velocità</p>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <label class="lab" style="margin:0">v rilascio (m/s)</label>
      <input inputmode="decimal" value="${t.vProva || ""}" placeholder="es. 13.5" oninput="setVrCampoVal('vProva',this.value)" onchange="disegna()" style="width:auto;flex:none;padding:7px 10px">
    </div>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr>${ANG.map(agv => `<th>${agv}°</th>`).join("")}</tr></thead>
      <tbody><tr>${cells3}</tr></tbody>
    </table></div>
    <p class="et" style="margin-top:8px">${h == null ? "Serve l'altezza di rilascio." : "Misura teorica a ogni angolo: utile per capire quanto vale un guadagno di velocità."}</p></div>`;

  const note = `<div class="card"><p class="et" style="margin-bottom:6px"><b>Attenzione — validità del modello</b></p>
    <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--txt2);line-height:1.5">
      <li>PESO e MARTELLO: modello molto accurato (poco sensibili all'aria).</li>
      <li>DISCO e GIAVELLOTTO: sono <b>aerodinamici</b>, il modello è solo indicativo (sottostima). Sul disco l'inclinazione ottimale è 5-10° meno dell'angolo di rilascio e — controintuitivo — il disco vola <b>più lontano contro vento</b> (fino a +8 m con 10 m/s contro: Frohlich 1981, Hubbard & Cheng 2007).</li>
      <li>Angolo ottimale <b>individuale</b>: nel peso spesso 30-37°, nel disco 35-44° (Leigh 2010). Trovalo per prove, non per teoria.</li>
      <li>Come si misura: radar in linea col volo, oppure video 120-240 fps (2 fotogrammi dopo il rilascio).</li>
      <li>Riferimento: Tom Walsh, Mondiali 2018 — 14.12 m/s a 37.3° da 2.11 m (22.31 m). Elite giavellotto: 24-30 m/s.</li>
    </ul></div>`;

  return selAtleta + intro + testa + sez1 + sez2 + sez3 + note;
}

// ---------- TEST 2: Profilo attrezzo (over / under) ----------
function _profAttrTest(aid) {
  DEMO.profiloAttrezzo = DEMO.profiloAttrezzo || {};
  if (!DEMO.profiloAttrezzo[aid]) DEMO.profiloAttrezzo[aid] = { pesoGara: "", data: "", prove: [] };
  const t = DEMO.profiloAttrezzo[aid];
  if (!t.prove) t.prove = [];
  while (t.prove.length < 3) t.prove.push({ peso: "", misura: "", n: "", note: "" });
  return t;
}
function _paSave() { if (typeof salvaCustom === "function") salvaCustom(); }
function togglePaGuida() { S.paGuida = !S.paGuida; disegna(); }
function setPaCampo(campo, v) { const a = _lanciAtletaRif(); if (!a) return; _profAttrTest(a.id)[campo] = v; _paSave(); disegna(); }
function setPaCampoVal(campo, v) { const a = _lanciAtletaRif(); if (!a) return; _profAttrTest(a.id)[campo] = v; _paSave(); }
function setPaRiga(i, campo, v) { const a = _lanciAtletaRif(); if (!a) return; _profAttrTest(a.id).prove[i][campo] = v; _paSave(); disegna(); }
function setPaRigaVal(i, campo, v) { const a = _lanciAtletaRif(); if (!a) return; _profAttrTest(a.id).prove[i][campo] = v; _paSave(); }
function paAddRiga() { const a = _lanciAtletaRif(); if (!a) return; _profAttrTest(a.id).prove.push({ peso: "", misura: "", n: "", note: "" }); _paSave(); disegna(); }
function paDelRiga(i) { const a = _lanciAtletaRif(); if (!a) return; const p = _profAttrTest(a.id).prove; if (p.length > 1) p.splice(i, 1); _paSave(); disegna(); }

// regressione lineare misura~peso
function _linRegLanci(pts) {
  const n = pts.length; if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  pts.forEach(p => { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; syy += p.y * p.y; });
  const d = n * sxx - sx * sx; if (d === 0) return null;
  const slope = (n * sxy - sx * sy) / d, intercept = (sy - slope * sx) / n;
  const denR = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  const r = denR ? (n * sxy - sx * sy) / denR : 0;
  return { slope, intercept, r2: r * r, pred: w => intercept + slope * w };
}
// scatter SVG misura vs peso con retta
function _scatterProfilo(pts, reg, wg) {
  if (!pts.length) return "";
  const W = 300, H = 170, mL = 34, mR = 8, mT = 10, mB = 24;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (wg && wg > 0) { x0 = Math.min(x0, wg); x1 = Math.max(x1, wg); }
  const padX = (x1 - x0) * 0.12 || 0.5, padY = (y1 - y0) * 0.15 || 0.5;
  x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
  const SX = v => mL + (v - x0) / (x1 - x0) * (W - mL - mR);
  const SY = v => H - mB - (v - y0) / (y1 - y0) * (H - mT - mB);
  const dots = pts.map(p => `<circle cx="${SX(p.x).toFixed(1)}" cy="${SY(p.y).toFixed(1)}" r="3.5" fill="var(--blu,#1f3864)"/>`).join("");
  let line = "";
  if (reg) { const yA = reg.pred(x0), yB = reg.pred(x1); line = `<line x1="${SX(x0).toFixed(1)}" y1="${SY(yA).toFixed(1)}" x2="${SX(x1).toFixed(1)}" y2="${SY(yB).toFixed(1)}" stroke="var(--verde,#3a9)" stroke-width="1.5" stroke-dasharray="4 3"/>`; }
  const wgLine = (wg && wg > 0) ? `<line x1="${SX(wg).toFixed(1)}" y1="${mT}" x2="${SX(wg).toFixed(1)}" y2="${H - mB}" stroke="var(--txt3,#999)" stroke-width="1" stroke-dasharray="2 2"/><text x="${SX(wg).toFixed(1)}" y="${mT + 8}" font-size="9" fill="var(--txt3,#999)" text-anchor="middle">gara</text>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:340px;height:auto;display:block">
    <line x1="${mL}" y1="${mT}" x2="${mL}" y2="${H - mB}" stroke="var(--line,#ddd)"/>
    <line x1="${mL}" y1="${H - mB}" x2="${W - mR}" y2="${H - mB}" stroke="var(--line,#ddd)"/>
    ${wgLine}${line}${dots}
    <text x="${mL}" y="${H - 6}" font-size="9" fill="var(--txt3,#999)">${x0.toFixed(1)}</text>
    <text x="${W - mR}" y="${H - 6}" font-size="9" fill="var(--txt3,#999)" text-anchor="end">${x1.toFixed(1)} kg</text>
    <text x="4" y="${mT + 8}" font-size="9" fill="var(--txt3,#999)">${y1.toFixed(1)}</text>
    <text x="4" y="${H - mB}" font-size="9" fill="var(--txt3,#999)">${y0.toFixed(1)}m</text>
  </svg>`;
}

function vistaProfiloAttrezzo() {
  const a = _lanciAtletaRif();
  const selAtleta = `<div class="card">
    <label class="lab">Atleta (lanci)</label>
    <select onchange="setLanciTestAtleta(this.value)" style="margin-top:6px">${_optAtletiLanci(lanciTestState.atletaRif, "— scegli —")}</select>
    ${atletiLanci().length === 0 ? _LANCI_NO_ATLETI : ""}</div>`;
  const intro = `<div class="card"><h3>Profilo attrezzo (over / under)</h3>
    <p class="et" style="margin-top:2px">Ti manca <b>forza</b> o <b>velocità</b>? Lanciando con attrezzi di peso diverso si vede dove sei carente: se crolli col <b>pesante</b> ti manca forza; se col <b>leggero</b> non guadagni ti manca velocità.</p>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="togglePaGuida()">${S.paGuida ? "Nascondi come si fa" : "📋 Come si fa il test"}</button>
    ${S.paGuida ? `<div style="margin-top:10px;padding:11px 13px;background:var(--card2,rgba(120,120,140,.08));border-radius:10px">
      <p class="et" style="margin:0 0 6px"><b>Il test (una seduta sola)</b></p>
      <p class="et" style="margin:0 0 6px"><b>1.</b> <b>Da fresco</b>, dopo un riscaldamento completo (è un test di massima, non allenamento).</p>
      <p class="et" style="margin:0 0 6px"><b>2.</b> <b>Almeno 3 pesi diversi</b> e includi <b>sempre</b> il peso di gara. Es: −10%, gara, +10% (e volendo +20%).</p>
      <p class="et" style="margin:0 0 6px"><b>3.</b> Regola <b>±10% (USATF)</b>: dentro il ±10% i dati sono confrontabili; oltre, la tecnica cambia troppo (usali solo a blocchi).</p>
      <p class="et" style="margin:0 0 6px"><b>4.</b> <b>3-5 prove per peso</b>, recuperi pieni, e segna la <b>migliore misura</b> di ciascun peso.</p>
      <p class="et" style="margin:0 0 6px"><b>5.</b> <b>Inserisci qui sotto</b> peso e migliore misura: l'app traccia la retta misura↔peso e ti dice se ti manca forza o velocità.</p>
      <p class="et" style="margin:0"><b>6.</b> <b>Ripeti ogni 6-8 settimane</b>, stesse condizioni, per vedere come cambia il profilo.</p>
    </div>` : ""}</div>`;
  if (!a) return selAtleta + intro + `<div class="card"><p class="et" style="margin:0">Scegli un lanciatore per profilare l'attrezzo.</p></div>`;

  const t = _profAttrTest(a.id);
  const attrezzi = pbLanciAttrezzi(a);                       // tutti gli attrezzi su cui ha un PB
  // attrezzo selezionato: quello scelto (se ancora presente) altrimenti il primo (specialità / più recente)
  const sel = attrezzi.find(x => x.evento === t.attrezzoSel) || attrezzi[0] || null;
  const pb = sel ? sel.pb : null;
  const wgAuto = sel ? sel.kg : null;                        // peso dedotto dall'etichetta ("Martello 4 kg"→4)
  const pesoGaraEff = (t.pesoGara !== "" && t.pesoGara != null) ? t.pesoGara : (wgAuto != null ? String(wgAuto) : "");
  const autoNota = (t.pesoGara === "" || t.pesoGara == null) && wgAuto != null;
  const wg = pesoGaraEff !== "" ? Number(String(pesoGaraEff).replace(",", ".")) : null;
  const attrOpts = attrezzi.length
    ? attrezzi.map(x => `<option value="${String(x.evento).replace(/"/g, "&quot;")}" ${sel && sel.evento === x.evento ? "selected" : ""}>${x.evento} — ${x.pb.toFixed(2)} m</option>`).join("")
    : `<option value="">— nessun PB nel profilo —</option>`;
  const testa = `<div class="card">
      <div class="griglia2">
        <div><label class="lab">Attrezzo / personale ${attrezzi.length > 1 ? "<span style='color:var(--txt3)'>(scegli)</span>" : ""}</label>
          <select ${attrezzi.length ? "" : "disabled"} onchange="setPaAttrezzo(this.value)" style="margin-top:6px">${attrOpts}</select></div>
        <div><label class="lab">Peso di gara (kg)${autoNota ? " <span style='color:var(--txt3)'>(auto)</span>" : ""}</label>
          <input inputmode="decimal" value="${pesoGaraEff}" placeholder="es. 7.26" oninput="setPaCampoVal('pesoGara',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      </div>
      <div style="margin-top:12px"><label class="lab">Data test</label>
        <input type="date" value="${t.data || ""}" onchange="setPaCampo('data',this.value)" style="margin-top:6px"></div>
      <p class="et" style="margin-top:8px">${pb != null
        ? `Personale <b>${pb.toFixed(2)} m</b>${sel && sel.evento ? " (" + sel.evento + ")" : ""}.${attrezzi.length > 1 ? " L'atleta allena più attrezzi: scegli quello da profilare." : ""}${autoNota ? " Peso preso dall'attrezzo — modificabile." : ""}`
        : "Nessun PB nel profilo: aggiungilo nella scheda dell'atleta (es. «Martello 4 kg») per il confronto."}</p>
    </div>`;

  const righe = t.prove.map((r, i) => {
    const peso = (r.peso !== "" && r.peso != null) ? Number(String(r.peso).replace(",", ".")) : null;
    const delta = (peso != null && wg > 0) ? (peso / wg - 1) : null;
    const dTxt = delta == null ? "—" : (Math.abs(delta) < 0.005 ? "gara" : (delta > 0 ? "+" : "") + Math.round(delta * 100) + "%");
    let sug = "";
    if (delta != null) sug = Math.abs(delta) > 0.20 ? "⚠ oltre ±20%: tecnica troppo diversa" : (Math.abs(delta) > 0.10 ? "oltre ±10%: solo a blocchi, lontano gara" : "dentro ±10% (USATF)");
    const dCls = delta != null && Math.abs(delta) > 0.10 ? "male" : "";
    return `<tr>
      <td><input inputmode="decimal" value="${r.peso || ""}" placeholder="kg" oninput="setPaRigaVal(${i},'peso',this.value)" onchange="disegna()" style="min-width:56px"></td>
      <td class="pauto ${dCls}">${dTxt}</td>
      <td><input inputmode="decimal" value="${r.misura || ""}" placeholder="m" oninput="setPaRigaVal(${i},'misura',this.value)" onchange="disegna()" style="min-width:60px"></td>
      <td><input inputmode="numeric" value="${r.n || ""}" placeholder="n°" oninput="setPaRigaVal(${i},'n',this.value)" style="min-width:44px"></td>
      <td class="et" style="text-align:left;min-width:120px">${sug}</td>
      <td><button class="chiudi" style="font-size:14px" onclick="paDelRiga(${i})" aria-label="Rimuovi">✕</button></td>
    </tr>`;
  }).join("");
  const tabella = `<div class="card"><p class="et" style="margin-bottom:6px"><b>Prove</b> — un peso per riga (includi il peso di gara)</p>
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th>Peso kg</th><th>Δ% gara</th><th>Migliore (m)</th><th>n°</th><th>Suggerimento</th><th></th></tr></thead>
      <tbody>${righe}</tbody>
    </table></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px;margin-top:10px" onclick="paAddRiga()">＋ peso</button></div>`;

  // regressione sui punti validi
  const pts = t.prove.map(r => ({ x: Number(String(r.peso).replace(",", ".")), y: Number(String(r.misura).replace(",", ".")) }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y) && p.x > 0 && p.y > 0);
  const reg = _linRegLanci(pts);
  let risultati = `<div class="card"><p class="et" style="margin:0">Inserisci almeno <b>3 pesi</b> con la relativa misura migliore (e il peso di gara) per il calcolo.</p></div>`;
  if (reg && wg > 0 && pts.length >= 2) {
    const stimaGara = reg.pred(wg);
    const loss = (reg.pred(wg * 1.1) - stimaGara) / stimaGara;   // di solito negativo
    const gain = (reg.pred(wg * 0.9) - stimaGara) / stimaGara;   // di solito positivo
    let diag, dcol;
    if (Math.abs(loss) > 0.09) { diag = "CARENZA DI FORZA → crolli troppo con l'attrezzo pesante. Priorità: forza massimale (squat/stacco 85-100%), olympic lifts e derivati di tirata, lanci PESANTI lontano dalla gara."; dcol = "var(--rosso,#c00000)"; }
    else if (gain < 0.04) { diag = "CARENZA DI VELOCITÀ → col leggero non guadagni. Priorità: balistico 30-60%, pliometria reattiva, multilanci veloci, lanci LEGGERI e sprint."; dcol = "var(--rosso,#c00000)"; }
    else { diag = "PROFILO EQUILIBRATO → lavora su tecnica e velocità di rilascio: alza il Pmax mantenendo l'equilibrio forza/velocità."; dcol = "var(--verde,#3a9)"; }
    const cellR = (l, v) => `<div style="flex:1;min-width:120px;padding:8px;background:var(--sfondo2,rgba(0,0,0,.03));border-radius:10px"><p class="et" style="margin:0">${l}</p><p style="margin:2px 0 0;font-size:16px;font-weight:700">${v}</p></div>`;
    risultati = `<div class="card">
      <p class="et" style="margin-bottom:8px"><b>Risultati</b> (${pts.length} punti · retta misura↔peso)</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${cellR("Pendenza", reg.slope.toFixed(2) + " m/kg")}
        ${cellR("R²", reg.r2.toFixed(2))}
        ${cellR("Stima a peso gara", stimaGara.toFixed(2) + " m")}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        ${cellR("Perdita con +10% peso", (loss * 100).toFixed(1) + "%")}
        ${cellR("Guadagno con −10%", (gain * 100).toFixed(1) + "%")}
      </div>
      <div style="margin-top:12px">${_scatterProfilo(pts, reg, wg)}</div>
      <div style="margin-top:10px;padding:10px;border-radius:10px;background:rgba(120,120,120,.08);border-left:3px solid ${dcol}">
        <p style="margin:0;font-weight:700;font-size:13px">${diag}</p></div>
      ${pb != null ? `<p class="et" style="margin-top:8px">Personale <b>${pb.toFixed(2)} m</b> vs stima del test a peso gara <b>${stimaGara.toFixed(2)} m</b>: ${Math.abs(pb - stimaGara) < 0.3 ? "in linea (test attendibile)" : (stimaGara < pb ? "test sotto il PB → eri poco fresco o poche prove" : "test sopra il PB → giornata buona, cerca di trasferirlo in gara")}.</p>` : ""}
      <p class="et" style="margin-top:8px">Soglie (9% perdita, 4% guadagno) <b>indicative</b>: in letteratura non esistono cut-off validati per i lanci. Conta il confronto con te stesso nel tempo. Valori tipici: 6-9% ogni ±10% di peso.</p>
    </div>`;
  }

  const note = `<div class="card"><p class="et" style="margin-bottom:6px"><b>Come leggerlo</b></p>
    <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--txt2);line-height:1.5">
      <li>Test da fresco, dopo riscaldamento completo, 3-5 prove per peso e recuperi pieni.</li>
      <li>Regola USATF: attrezzi entro ±10% del peso di gara; oltre, la cinematica cambia troppo.</li>
      <li>Le palle LEGGERE hanno effetto positivo consistente sulla velocità; le PESANTI vanno scelte con cura (rev. Sports Med Open 2024). Blocchi di ≥6 settimane.</li>
      <li>Sul disco l'attrezzo più leggero (1.7 vs 2.0 kg) aumenta la distanza e modifica l'attivazione della spalla (Dinu 2019): usalo come variabilità, non come sostituto.</li>
    </ul></div>`;

  return selAtleta + intro + testa + tabella + risultati + note;
}

// ============================================================================
// TEMPLATE MICROCICLI (lanci) — settimana-tipo per blocco (fedele al foglio "Template microcicli").
// giorni = [giorno, campo/lanci, attrezzo·n°lanci, palestra, %1RM·s×r, note, kind ("r"=riposo,"g"=gara)]
// Nei lanciatori lanci e palestra stanno spesso nello STESSO giorno: prima i lanci (da fresco), poi la forza.
// ============================================================================
const LANCI_TEMPLATE = [
  {
    titolo: "Blocco 1 · Prep. GENERALE — AA (Adattamento Anatomico, ~3-4 sett.)",
    parametri: "Lanci 10-20/seduta, 2×/sett, attrezzo di GARA · intensità tecnica 70-80% | Palestra 30-60%, circuiti full-body | Pliometria ESTENSIVA ~60 contatti | Multilanci 2×/sett.",
    giorni: [
      ["Lun", "Tecnica/drills + lanci standard (medio volume)", "gara · 15-20 lanci", "Circuito forza generale full-body", "30-50% max · 10 es. 30″/15″", "cura la tecnica; RPE 6-7", ""],
      ["Mar", "Velocità/accelerazione + pliometria base + core", "sprint 6-8×30-60 m", "—", "—", "pliometria estensiva ~60 contatti", ""],
      ["Mer", "Lanci pesanti (posizioni) + drills", "pesante +10% · 10-15 lanci", "Olympic lifts (tecnica) + forza generale 2", "oly 60-70% · pulls 3-4×5-6", "tecnica dei sollevamenti", ""],
      ["Gio", "Mobilità/prevenzione + tecnica a secco", "drills senza attrezzo", "Prehab spalla/anca + core", "elastici 3×15", "recupero attivo", ""],
      ["Ven", "Lanci standard + multilanci palla medica", "gara · 15-20 lanci · med ball 3-6 kg 4-8×3-6", "Forza generale 3", "30-50% · 8-12 ×2-3", "presses 3-4×8-10", ""],
      ["Sab", "Velocità + balzi (facolt.)", "—", "Circuito o off", "—", "oppure recupero", ""],
      ["Dom", "Riposo", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 2 · Prep. SPECIALE — Forza MAX + potenza (~6-10 sett.)",
    parametri: "Lanci 20-30/seduta, 2-3 gg/sett, GARA + PESANTI (+5/10%) · intensità 70-90% | Palestra 85-100% 1RM + oly 70-90% | Pliometria intensiva | è la fase più carica dell'anno.",
    giorni: [
      ["Lun", "Lanci standard (qualità tecnica)", "gara · 20-30 lanci", "Forza MAX (squat/stacco)", "85-95% · 2-4 ×3-5", "rec pieni 3-5'; pulls 3-4×3-4", ""],
      ["Mar", "Velocità + pliometria + core", "sprint 6-8×20-40 m", "—", "—", "~80 contatti; 48-72 h tra sedute intense", ""],
      ["Mer", "Lanci PESANTI (forza specifica, posizioni)", "pesante +10% · 15-25 lanci", "Olympic lifts + balistico", "oly 70-90% · 3-6×1-3", "mai a cedimento; qualità del gesto", ""],
      ["Gio", "Mobilità/prevenzione + tecnica a secco", "drills", "Prehab cuffia rotatori (elastici)", "3×15-20", "obbligatorio per il giavellotto", ""],
      ["Ven", "Lanci speciali/parziali + multilanci", "power position e mezzi giri · 20-30 lanci", "Forza MAX 2 + oly", "85-100% · 1-3 + oly", "presses 3-4×5", ""],
      ["Sab", "Multilanci / velocità / balzi", "med ball 4-8×3-6", "Forza MAX 3 (richiamo) o off", "85-90% · 2-3", "facoltativo", ""],
      ["Dom", "Riposo", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 3 · PRE-COMPETITIVA — Conversione a potenza (~4-8 sett.)",
    parametri: "Lanci 20-30/seduta, 2-3 gg/sett, GARA (ritmo) + primi LEGGERI · intensità 80-100% | Palestra balistico 30-60% + oly 70-85% | Pliometria SHOCK, poco volume | la forza max si mantiene.",
    giorni: [
      ["Lun", "Lanci gara-simile (qualità, ritmo completo)", "gara · 20-25 lanci", "Forza balistica + oly + contrasto", "30-60% balistico / 70-85% veloce", "contrast training; rec pieni", ""],
      ["Mar", "Velocità + pliometria reattiva", "sprint 4-6×20-40 m", "—", "—", "depth jump: pochi contatti, rec pieno", ""],
      ["Mer", "Lanci LEGGERI (velocità di rilascio)", "leggero -10% · 15-25 lanci", "Potenza (jump squat, push press)", "30-60% · 3-6×3-5", "massima velocità, poche rip", ""],
      ["Gio", "Mobilità + tecnica leggera", "drills", "Prehab / core", "—", "recupero attivo", ""],
      ["Ven", "Lanci gara-simile + prove di rifinitura", "gara · 15-20 lanci", "Mantenimento forza (poche serie)", "80-90% · 1-3", "oly 3-4×2-3", ""],
      ["Sab", "Prova/gara C o multilanci veloci", "gara o med ball", "leggera o off", "—", "simula la routine di gara", ""],
      ["Dom", "Riposo", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 4 · COMPETITIVA (in-season, ~6-8 sett.)",
    parametri: "Lanci 15-25/seduta, 2-3 gg/sett, GARA + LEGGERI · intensità 80-100%, alta QUALITÀ | Palestra 1-2 sedute di mantenimento | Pliometria ~50 contatti | gara nel weekend.",
    giorni: [
      ["Lun", "Lanci di qualità (poche prove, alta qualità)", "gara · 15-20 lanci", "Mantenimento forza/potenza", "80-90% · 1-3 + potenza", "se la tecnica cala, fermati", ""],
      ["Mar", "Velocità breve + mobilità", "sprint 4×20-30 m", "—", "—", "freschezza", ""],
      ["Mer", "Lanci leggeri/veloci (brevi) o tecnica", "leggero -10% · 12-18 lanci", "Potenza breve o off", "poche serie esplosive", "—", ""],
      ["Gio", "Rifinitura tecnica + allunghi", "gara · 8-12 lanci", "—", "—", "qualità > quantità", ""],
      ["Ven", "Attivazione pre-gara (poche prove veloci)", "gara · 5-8 lanci", "—", "—", "routine di gara", ""],
      ["Sab", "GARA", "gara", "—", "—", "🏁 gara", "g"],
      ["Dom", "Riposo / rigenerante", "—", "—", "—", "—", "r"]
    ]
  },
  {
    titolo: "Blocco 5 · TAPER — settimana di gara (PICCO)",
    parametri: "Volume −40/−60%, INTENSITÀ e VELOCITÀ INVARIATE (Bosquet 2007) · 10-20 lanci totali, soprattutto LEGGERI | Palestra: richiamo corto 3×3 al 70-75% veloce | ZERO pliometria | obiettivo: FRESCHEZZA.",
    giorni: [
      ["Lun", "Poche prove di qualità", "gara + leggero · 10-15 lanci", "Richiamo forza breve", "85-90% · 1-2 serie", "tagli il volume, tieni l'intensità", ""],
      ["Mar", "Velocità breve + mobilità", "sprint 3-4×20-30 m", "—", "—", "niente fatica", ""],
      ["Mer", "Stimolo breve (lanci leggeri veloci)", "leggero · 8-12 lanci", "Pull/press leggeri e veloci", "70-75% · 3×3", "stimolo neurale", ""],
      ["Gio", "Tecnica leggera + allunghi", "gara · 5-8 lanci", "—", "—", "routine e rituali di gara", ""],
      ["Ven", "Riposo / scarico (o viaggio)", "—", "—", "—", "scarico totale", "r"],
      ["Sab", "GARA", "gara", "—", "—", "🏁 PICCO", "g"],
      ["Dom", "Riposo", "—", "—", "—", "—", "r"]
    ]
  }
];

// ============================================================================
// PERIODIZZAZIONE & VOLUMI (lanci) — pagina di riferimento (fedele al foglio "Periodizzazione").
// Stile "Per distanza (mezzo)": tabs per attrezzo + sezioni condivise (fasi, forza, taper, evidenze).
// ============================================================================
const LANCI_PERIOD_ATTR = [
  {
    nome: "Peso", prof: "Gesto brevissimo: FORZA e POTENZA dominanti. Due tecniche (O'Brien lineare / rotazionale).",
    qual: "1) Forza max  2) Potenza (oly/balistico)  3) Velocità di traslazione/rotazione  4) Tecnica del finale",
    vol: { seduta: "20-30 (15-25 in gara)", sett: "2-4", prep: "gara + pesanti (+0.45-0.9 kg)", gara: "gara + leggeri", ou: "±10% (regola USATF)" },
    prio: "forza max ●●● · oly ●●● · multilanci ●●● · lanci pesanti ●●●",
    err: "troppa palestra e pochi lanci di qualità; forzare il braccio prima delle gambe",
    att: "equilibrio in tutto il gesto (USATF)", rif: "Terzis/Kyriazis; USATF cap.14"
  },
  {
    nome: "Disco", prof: "Rotazionale: POTENZA ROTAZIONALE + ritmo + tecnica fine. Meno forza bruta, più coordinazione.",
    qual: "1) Potenza rotazionale/velocità  2) Forza max (base)  3) Ritmo/tecnica della rotazione  4) Elasticità",
    vol: { seduta: "20-30", sett: "3-4", prep: "stand throw + pesanti, drills", gara: "gara + leggeri, gare simulate", ou: "±10% (1.7 vs 2.0 kg studiato)" },
    prio: "potenza rotazionale ●●● · balistico ●●● · tecnica ●●●",
    err: "partire troppo veloci (si perde il ritmo); «tirare» con le braccia",
    att: "meno variabilità del movimento = più distanza (uomini, r=−0.57/−0.63)", rif: "Hay & Yu 1995; Dai 2013"
  },
  {
    nome: "Martello", prof: "Il più TECNICO: 3-4 giri con velocità angolare crescente e forza centrifuga da gestire.",
    qual: "1) Velocità di rotazione/potenza  2) Forza max (contrastare la trazione)  3) Tecnica dei giri  4) Forza specifica",
    vol: { seduta: "~30 (meno se pesante)", sett: "3-5", prep: "pesanti presto in stagione", gara: "leggeri vicino ai campionati", ou: "±10%" },
    prio: "forza max ●●● · oly ●●● · tecnica dei giri ●●●",
    err: "andare «a braccia» perdendo equilibrio; giri veloci senza controllo",
    att: "doppio appoggio lungo; al rilascio pensa «Turn!» non «Explode!»", rif: "Dapena; Bondarchuk; USATF cap.17"
  },
  {
    nome: "Giavellotto", prof: "Rincorsa + blocco + frustata: VELOCITÀ (rincorsa e arto) + ELASTICITÀ + salute spalla/gomito.",
    qual: "1) Velocità (rincorsa, arti)  2) Elasticità/pliometria  3) Forza esplosiva  4) Mobilità/salute spalla  5) Tecnica",
    vol: { seduta: "MODERATI e progressivi", sett: "2-3 pieni", prep: "palle pesanti, medicinali, stubbies", gara: "gara + leggeri", ou: "±10%, con prudenza" },
    prio: "velocità ●●● · pliometria ●●● · balistico ●●● · mobilità spalla ●●●",
    err: "sovraccaricare spalla e gomito con troppi lanci pieni",
    att: "il 70% della velocità si genera negli ultimi 0.1 s: è RFD pura. CONTA i lanci pieni!", rif: "Morriss & Bartlett 1996; Beitzel 2016"
  }
];
// 1) struttura annuale — [sotto-fase, blocco forza, qualità dominante, durata, lanci, note]
const LANCI_FASI = [
  ["Prep. generale", "AA — Adatt. Anatomico", "Forza generale + tecnica", "~3-4 sett", "10-20 lanci, 2×/sett", "circuito 30-50% max; molti multilanci; pliometria estensiva"],
  ["Prep. speciale", "Mx-S — Forza Massima", "Forza massimale", "~6-10 sett", "20-30 lanci, 2-3 gg/sett", "85-100% 1RM; oly lift; è la fase più lunga e carica"],
  ["Pre-competitiva", "Conversione a Potenza", "Forza esplosiva / RFD", "~4-8 sett", "20-30 lanci, 2-3 gg/sett", "balistico 30-60% + oly; intensità lanci 70-90%"],
  ["Competitiva", "Mantenimento P + MxS", "Velocità / tecnica", "~6-8 sett", "15-25 lanci, 2-3 gg/sett", "intensità lanci 80-100%; forza 1-2×/sett, poche serie"],
  ["Taper / picco", "Richiamo", "Freschezza", "7-10 gg", "10-20 lanci di qualità", "volume −40/−60%, intensità INVARIATA; pull/press 3×3 al 70-75%; zero plio"],
  ["Transizione", "Compensazione", "Rigenerante", "1-2 sett", "tecnica leggera / nulla", "recupero attivo, mobilità, altre attività"]
];
// 2) parametri forza per blocco — [blocco, %1RM, VBT m/s, rip, serie, rec, RIR, note]
const LANCI_FORZA_BLOCCO = [
  ["AA (Adatt. Anatom.)", "40-60%", "0.80-1.05", "8-12 (15)", "2-4", "60-90 s", "alto (4-6)", "circuito total-body; struttura, tendini, tecnica"],
  ["Ipertrofia (opz.)", "67-80%", "0.55-0.72", "6-12", "3-6", "1-2 min", "0-2", "solo se serve massa magra (giovani/meno esperti)"],
  ["Forza Massima", "85-100%", "0.30-0.50", "1-5", "2-5", "3-5 min", "0-2", "squat/stacco/panca; concentrica esplosiva, mai a cedimento"],
  ["Forza-potenza (oly)", "70-90%", "0.75-1.00", "1-3", "3-6", "2-3 min", "2-3", "girata/strappo/slancio: il lift più correlato (r=0.868)"],
  ["Derivati di tirata", "90-140%", "—", "2-5", "3-5", "2-4 min", "—", "clean pull ~102%, mid-thigh ~135%: sovraccarico senza ricezione"],
  ["Velocità-forza (balistico)", "30-60%", "0.90-1.20", "3-5", "3-6", "2-3 min", "—", "jump squat, push press, lanci col bilanciere; max velocità"],
  ["Pliometria / reattivo", "corpo libero", "max", "3-6 contatti", "3-6", "completo", "—", "contatti brevi; volume alto in prep, basso in gara, ZERO nel taper"],
  ["Mantenimento", "80-90% + pot.", "0.42-0.55", "1-4", "2-3", "3 min", "2-3", "1-2 sedute/sett; regge ~4 sett. detraining (Terzis 2008)"]
];
// 5) onda / scarico / taper — bullets
const LANCI_TAPER = [
  "Onda 3:1 (3 sett. in crescita + 1 di scarico). Giovani o periodi duri: 2:1. Nel martello USATF: cicli di 4 sett. con +2-5% carico/sett e test dei massimali prima di ogni ciclo.",
  "Settimana di scarico: volume −40/−50%, INTENSITÀ mantenuta (cali la fatica ma tieni la condizione).",
  "TAPER pre-gara A (Bosquet 2007, 8-14 giorni): volume −41/−60%, intensità e frequenza invariate, guadagno medio ~2%. Bazyler 2017 (1 sett. overreach + 3 taper) ha migliorato 5 lanciatori su 6.",
  "Nel taper: pochi lanci di altissima qualità, soprattutto LEGGERI; richiamo di forza corto (3×3 al 70-75%, veloce); niente pliometria; multilanci a 1 serie.",
  "Verifica in Carico & Forma: ACWR 0.8-1.3; Forma (TSB) positiva prima delle gare."
];
// 6) miglioramenti attesi (studi) — [studio, durata, cosa, Δlancio, Δforza, Δaltro]
const LANCI_STUDI = [
  ["Anousaki 2021 (JSCR)", "25 sett", "macrociclo ipertrofia→forza→potenza", "+10.9 ± 3.2%", "snatch +9.7% · squat +9.9%", "CMJ +10.9%"],
  ["Zaras 2016 (JSCR)", "10 sett", "periodizzato, giovani lanciatori", "+6.8 ± 4.3%", "RFD e 1RM ↑", "fascicoli +13.4%"],
  ["Zaras 2013 (JSSM)", "6 sett", "forza max VS balistico-potenza", "+7.0/13.5% vs +6.0/11.5%", "leg press +43% vs +21%", "CMJ +8.5% (solo pot.)"],
  ["Terzis 2008 (JSCR)", "14 sett +4 detr.", "forza", "+6-12% (mantenuto)", "1RM +22-34%", "CSA fibre +12-18%"],
  ["Kyriazis 2009/10", "preseason→gara", "preparazione completa", "+4.7% · rotaz. +6.5%", "squat +6.5%", "EMG ↑"]
];
// 7) attivazione PAP/PAPE — [protocollo, effetto, fonte, come]
const LANCI_PAP = [
  ["Riscaldamento con attrezzo PESANTE", "14.39 vs 14.18 (leggero)/14.15 (controllo), p=0.003", "Judge 2016", "alcune prove pesanti, poi gara"],
  ["Sprint di attivazione", "peso +3.74 ± 1.88%", "Terzis 2012", "2-3 sprint brevi massimali"],
  ["CMJ di attivazione", "peso +2.64 ± 1.59%", "Terzis 2012", "3-5 salti massimali"],
  ["Hang clean & jerk 80% + 8'", "10.93 vs 10.57 m, p=0.007", "PAP shot put 2017", "3 rip a 80%, poi 7-10' recupero"],
  ["Pliometria/isometria breve", "+2.30% ÷ +5.72%", "Kontou 2018", "serie brevi prima delle prove"]
];
// 8) cosa conta per livello — [livello, determinante, priorità]
const LANCI_LIVELLO = [
  ["Poco esperto / giovane", "massa magra (LBM)", "forza generale, tecnica, massa magra, multilanci"],
  ["Intermedio", "LBM + proprietà architetturali", "forza max + conversione a potenza"],
  ["Esperto", "lunghezza fascicoli + composizione fibre", "RFD, balistico, velocità di rilascio, tecnica fine"]
];

let lanciPerState = { attr: "Peso" };
function setLanciPerAttr(n) { lanciPerState.attr = n; disegna(); window.scrollTo(0, 0); }
function _lanciTblHTML(headers, rows) {
  return `<div class="p-scroll"><table class="ptab pista-w">
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => i === 0 ? `<td style="white-space:normal"><b>${c}</b></td>` : `<td class="et" style="white-space:normal;text-align:left">${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function vistaPeriodizzazioneLanci() {
  const d = LANCI_PERIOD_ATTR.find(x => x.nome === lanciPerState.attr) || LANCI_PERIOD_ATTR[0];

  const intro = `<div class="card"><h3>Periodizzazione & volumi (lanci)</h3>
    <p class="et" style="margin-top:2px">Per ogni attrezzo: profilo, volumi e adattamenti. Sotto: <b>struttura annuale</b>, <b>parametri di forza per blocco</b>, onda/taper, evidenze e cosa conta per livello. I microcicli pronti sono nel <b>Template</b>; i mezzi nella <b>Guida mezzi</b>.</p>
    <p class="et" style="margin-top:8px;padding:8px 10px;background:var(--card2,rgba(120,120,140,.08));border-radius:8px"><b>Modello italiano a DOPPIO PICCO:</b> picco 1 sui campionati invernali di lanci (feb-mar), transizione breve, picco 2 (più alto) in estate (giu-lug). L'USATF per il martello lo dice esplicito: «peak in March and June».</p>
    <p class="et" style="margin-top:6px;color:var(--txt3)">Fonti: Bompa/Buzzichelli, Bondarchuk, USATF Coaching Manual, Bosquet 2007 (taper), Zaras/Terzis/Anousaki/Kyriazis, NSCA.</p></div>`;

  const tabs = `<div class="tabbar">${LANCI_PERIOD_ATTR.map(x => `<button class="${x.nome === d.nome ? "on" : ""}" onclick="setLanciPerAttr('${x.nome}')">${x.nome}</button>`).join("")}</div>`;

  const info = `<div class="card"><h3 style="margin-bottom:6px">${d.nome}</h3>
    ${[["Profilo di gara", d.prof], ["Qualità da allenare (priorità)", d.qual], ["Priorità dei mezzi", d.prio], ["Errore tipico", d.err], ["Attenzione", d.att]].map(([l, v]) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)${l === "Attenzione" ? ";background:rgba(240,168,60,.10);border-radius:8px;padding:8px 9px" : ""}"><span class="et" style="margin:0;font-weight:600;color:${l === "Attenzione" ? "var(--giallo,#d99000)" : "var(--txt2)"}">${l}</span><p style="margin:2px 0 0;font-size:13px">${v}</p></div>`).join("")}
    <p class="et" style="margin-top:8px;color:var(--txt3)">Rif.: ${d.rif}</p></div>`;

  const vol = `<div class="card"><p class="et" style="margin-bottom:6px">Volumi dei lanci — ${d.nome}</p>
    ${_lanciTblHTML(["", "Lanci/seduta", "Sedute/sett", "In preparazione", "In gara", "Over/under"], [["Volume", d.vol.seduta, d.vol.sett, d.vol.prep, d.vol.gara, d.vol.ou]])}
    <p class="et" style="margin-top:8px">Intensità tecnica dei lanci per fase (guida USATF): <b>prep 70-80%</b> · <b>pre-comp 70-90%</b> · <b>comp 80-100%</b>. Contatti pliometrici/seduta: <b>60</b> (prep) → <b>80</b> (pre) → <b>50</b> (comp) → <b>0</b> nel taper.</p></div>`;

  const fasi = `<div class="card"><p class="et" style="margin-bottom:6px">Struttura annuale (fasi e blocchi di forza)</p>
    ${_lanciTblHTML(["Sotto-fase", "Blocco forza", "Qualità dominante", "Durata", "Lanci", "Note"], LANCI_FASI)}</div>`;

  const forza = `<div class="card"><p class="et" style="margin-bottom:6px">Parametri di forza per blocco <span style="color:var(--txt3)">(Bompa/Buzzichelli/NSCA + VBT)</span></p>
    ${_lanciTblHTML(["Blocco", "%1RM", "VBT m/s", "Rip", "Serie", "Rec", "RIR", "Note lanci"], LANCI_FORZA_BLOCCO)}
    <p class="et" style="margin-top:8px">VBT come zona-bersaglio e per autoregolare: perdita di velocità del 10-20% dentro la serie = stop. <b>Transfer (Bondarchuk):</b> avvicinandoti alla gara sposta il volume da GPE/SPE verso SDE/CE.</p></div>`;

  const taper = `<div class="card"><p class="et" style="margin-bottom:6px">Onda del carico, scarico e taper</p>
    <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--txt2);line-height:1.55">${LANCI_TAPER.map(t => `<li>${t}</li>`).join("")}</ul></div>`;

  const studi = `<div class="card"><p class="et" style="margin-bottom:6px">Quanto ci si aspetta di migliorare <span style="color:var(--txt3)">(studi sui lanciatori)</span></p>
    ${_lanciTblHTML(["Studio", "Durata", "Cosa", "Δ lancio", "Δ forza", "Δ altro"], LANCI_STUDI)}
    <p class="et" style="margin-top:8px">Un macrociclo ben periodizzato vale circa <b>+7/11%</b> sulla misura. Forza massimale e balistico funzionano ENTRAMBI ma con adattamenti diversi (ipertrofia/CSA vs velocità/CMJ): vanno in sequenza, non in alternativa.</p></div>`;

  const pap = `<div class="card"><p class="et" style="margin-bottom:6px">Attivazione PAP/PAPE — un guadagno «gratuito»</p>
    ${_lanciTblHTML(["Protocollo", "Effetto", "Fonte", "Come si applica"], LANCI_PAP)}
    <p class="et" style="margin-top:8px">L'effetto è <b>individuale</b> e la finestra utile è <b>7-10 min</b> dopo lo stimolo. Attrezzi troppo pesanti possono PEGGIORARE: testa 2-3 protocolli e segna quale funziona in Riscaldamento.</p></div>`;

  const livello = `<div class="card"><p class="et" style="margin-bottom:6px">Cosa conta davvero, per livello <span style="color:var(--txt3)">(Methenitis 2016)</span></p>
    ${_lanciTblHTML(["Livello", "Determinante principale", "Priorità di allenamento"], LANCI_LIVELLO)}</div>`;

  return intro + tabs + info + vol + fasi + forza + taper + studi + pap + livello;
}

// ============================================================================
// CRUSCOTTO ATLETA (lanci) — sintesi del lanciatore (fedele al foglio "Cruscotto").
// Card profilo per il dettaglio-atleta del coach + adattamento della home atleta.
// ============================================================================
// miglior massimale (kg) che contiene una parola (es. "girata", "squat")
function _lanciMaxKg(a, needle) {
  const rows = ((a.scheda && a.scheda.massimali) || []).filter(x => String(x[0]).toLowerCase().includes(needle));
  const vals = rows.map(x => Number(x[1])).filter(v => !isNaN(v));
  return vals.length ? Math.max(...vals) : null;
}
// test/salto per nome esatto (es. "CMJ") → {v, u}
function _lanciSalto(a, nome) {
  const s = ((a.scheda && a.scheda.salti) || []).find(x => String(x[0]).toLowerCase() === nome.toLowerCase());
  return s ? { v: s[1], u: s[2] || "" } : null;
}
// diagnosi del Profilo attrezzo (over/under) se il test è stato fatto → {diag, stima} altrimenti null
function _profiloAttrDiag(a) {
  const t = DEMO.profiloAttrezzo && DEMO.profiloAttrezzo[a.id];
  if (!t) return null;
  const info = pbLanciInfo(a);
  const wg = (t.pesoGara !== "" && t.pesoGara != null) ? Number(String(t.pesoGara).replace(",", ".")) : info.kg;
  const pts = (t.prove || []).map(r => ({ x: Number(String(r.peso).replace(",", ".")), y: Number(String(r.misura).replace(",", ".")) }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y) && p.x > 0 && p.y > 0);
  const reg = _linRegLanci(pts);
  if (!reg || !(wg > 0) || pts.length < 2) return null;
  const stima = reg.pred(wg), loss = (reg.pred(wg * 1.1) - stima) / stima, gain = (reg.pred(wg * 0.9) - stima) / stima;
  const diag = Math.abs(loss) > 0.09 ? "Carenza di forza" : (gain < 0.04 ? "Carenza di velocità" : "Profilo equilibrato");
  return { diag, stima };
}
// n° lanci PROGRAMMATI nella settimana corrente (Lun-Dom) per l'atleta, dalle sedute Campo
function lanciSettAtleta(a) {
  if (typeof seduteDelGiorno !== "function" || typeof isoDiData !== "function") return null;
  const oggi = new Date((typeof oggiISO === "function" ? oggiISO() : new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const dow = (oggi.getDay() + 6) % 7;
  const lun = new Date(oggi); lun.setDate(oggi.getDate() - dow);
  let n = 0, trovato = false;
  for (let i = 0; i < 7; i++) {
    const d = new Date(lun); d.setDate(lun.getDate() + i);
    const sed = seduteDelGiorno(isoDiData(d), false, a) || [];
    sed.forEach(s => { if (s.lanci) { trovato = true; n += (typeof volumeLanciSeduta === "function" ? volumeLanciSeduta(s) : 0); } });
  }
  return trovato ? n : null;
}
// card "Profilo lanci" (per il dettaglio-atleta del coach): PB, obiettivo, profilo attrezzo, forza, salti
function cardProfiloLanci(a) {
  const info = pbLanciInfo(a);
  const obi = obiettivoLanciScheda(a);
  const girata = _lanciMaxKg(a, "girata"), squat = _lanciMaxKg(a, "squat");
  const cmj = _lanciSalto(a, "CMJ");
  const diag = _profiloAttrDiag(a);
  const riga = (l, v) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span class="et" style="margin:0">${l}</span><b>${v}</b></div>`;
  const righe = [
    info.pb != null ? riga("Personale" + (info.evento ? " · " + info.evento : ""), info.pb.toFixed(2) + " m") : "",
    obi != null ? riga("Obiettivo", obi.toFixed(2) + " m") : "",
    diag ? riga("Profilo attrezzo", diag.diag) : "",
    girata != null ? riga("Girata (clean)", girata + " kg") : "",
    squat != null ? riga("Squat", squat + " kg") : "",
    cmj ? riga("CMJ", cmj.v + " " + (cmj.u || "cm")) : ""
  ].join("");
  return `<div class="card"><p class="et" style="margin-bottom:6px">🥏 Profilo lanci</p>
    ${righe || `<p class="et" style="margin:0">Aggiungi PB e massimali nella scheda per vedere il profilo.</p>`}</div>`;
}
