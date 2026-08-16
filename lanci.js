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
