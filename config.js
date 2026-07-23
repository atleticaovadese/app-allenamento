// Configurazione dell'app.
// Il NOME sta qui e solo qui: quando lo sceglierai, si cambia questa riga.
const CONFIG = {
  nome: "Metis Performance",
  nomeBreve: "Metis",
  versione: "0.1",

  // Soglie per gli avvisi all'allenatore (decise con l'utente)
  soglie: {
    vbtSottoPct: 10,      // velocita' bilanciere sotto il richiesto di piu' del 10% -> avviso
    pistaPeggioPct: 3,    // tempo in pista peggiore del target di piu' del 3% -> avviso
    prontezzaBassa: 2.5,  // sotto questa soglia = prontezza bassa
    acwrAlto: 1.5,        // sopra = carico in salita pericoloso
    giorniAssenza: 3      // atleta che non si allena da N giorni -> avviso
  },

  // Scale del diario (1-5). Su TUTTE, 5 = sto bene: serve perche' la prontezza
  // e' la media delle quattro. Gli estremi sono scritti sotto ogni scala
  // per non lasciare dubbi (soprattutto sullo stress).
  diario: {
    voci: [
      { id: "sonno_qualita", label: "Qualità del sonno", basso: "pessima", alto: "ottima" },
      { id: "stress", label: "Stress", basso: "molto stressato", alto: "tranquillo" },
      { id: "dolori", label: "Dolori muscolari", basso: "molti dolori", alto: "nessun dolore" },
      { id: "energia", label: "Energia", basso: "a terra", alto: "pieno di energia" }
    ]
  },

  // La prontezza NON si mostra all'atleta: se la vede puo' aggiustare le risposte.
  // La calcoliamo lo stesso e la vede solo l'allenatore.
  mostraProntezzaAllAtleta: false
};
