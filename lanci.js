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
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
        <h3 style="margin:0">${e.mezzo || "Lanci"}</h3>
        <span class="et" style="margin:0">${e.lanci ? e.lanci + " lanci" : ""}</span>
      </div>
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

// ---------- pagina di riferimento: Esercizi speciali in pedana ----------
function vistaEserciziSpeciali() {
  const spec = _lanciRefSpec(pistaDi("lanci"));
  const attrezzi = [];
  LANCI_ESERCIZI.forEach(e => { if (!attrezzi.includes(e[0])) attrezzi.push(e[0]); });
  const catCol = c => c === "CE" ? "var(--rosso,#c00000)" : "var(--blu,#1f3864)";
  const gruppi = attrezzi.map(att => {
    const es = LANCI_ESERCIZI.filter(e => e[0] === att);
    const righe = es.map(e => `<div style="padding:8px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">
        <b style="font-size:13px">${e[1]}</b>
        <span class="pill" style="background:${catCol(e[2])};color:#fff">${e[2]}</span></div>
      <p class="et" style="margin:3px 0 0"><b>Scopo:</b> ${e[3]}</p>
      <p style="margin:3px 0 0;font-size:12px;color:var(--txt2)">${e[4]}</p>
      <p class="et" style="margin:3px 0 0">${e[5]} · <b>${e[6]}</b></p>
    </div>`).join("");
    return `<div class="card"><h3 style="margin-bottom:2px">${att}</h3>${righe}</div>`;
  }).join("");
  return `<div class="card"><h3>Esercizi speciali in pedana</h3>
    <p class="et" style="margin-top:2px">Gli esercizi da fare IN PEDANA, attrezzo per attrezzo (progressione didattica USATF capp. 14-17 + Bondarchuk). Tutti sono nella tendina «Mezzo / contenuto» del <b>Campo</b>.</p>
    <p class="et" style="margin-top:6px">${LANCI_CAT_LEGENDA}. <b>Regola del transfer:</b> più ti avvicini alla gara, più il volume si sposta da GPE/SPE verso SDE/CE.</p>
    ${spec ? `<p class="et" style="margin-top:6px;color:var(--txt3)">Riferimento programma: ${spec}. In Campo la tendina mostra questo attrezzo + i comuni.</p>` : ""}</div>
    ${gruppi}
    <div class="card"><p class="et" style="margin:0"><b>Come si usa:</b> non passare al gesto completo finché i drill che lo compongono non sono puliti (regola esplicita del manuale USATF). Quando un lancio completo non funziona, torna al drill che isola la fase che non va. Per il <b>giavellotto</b>, palla medica/zavorrate/stubbies fanno volume senza caricare spalla e gomito.</p></div>
    <div class="card"><p class="et" style="margin:0;color:var(--txt3)">${LANCI_ESERCIZI.length} esercizi speciali. Fonti: USA Track & Field Coaching Manual capp. 14-17; Bondarchuk; biomeccanica in RICERCA_Lanci_Evidenze.md.</p></div>`;
}
