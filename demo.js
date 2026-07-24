// Dati finti, servono solo per vedere le schermate finche' non colleghiamo il database.
const DEMO = {
  utenti: [
    { id: "c1", ruolo: "coach", nome: "Alessandro", email: "coach@demo.it" },
    { id: "a1", ruolo: "atleta", nome: "Leonardo Zetti", email: "leo@demo.it", atletaId: "at1" }
  ],

  atleti: [
    { id: "at1", nome: "Leonardo Zetti", disciplina: "velocita", specialita: "100 m",
      pb: [["60 m", "7.01"], ["100 m", "10.90"], ["200 m", "22.40"]],
      massimali: [["Squat", 155], ["Trap Bar", 185], ["Panca piana", 92]],
      presenzeMese: [21, 22], presenzeStagione: [253, 280],
      test: [["60 m", "7.01", "-0.05"], ["CMJ", "45 cm", "+2"], ["Squat", "155 kg", "+5"]],
      scheda: {
        anagrafica: { categoria: "Promesse (U23)", nascita: "14/03/2003", anno: 2003,
          gambaStacco: "Destra", altezza: 181, peso: 74 },
        pb: [
          ["30 m lanciato", "3.10", "2 mag", "3.08", ""],
          ["30 m blocchi", "3.82", "12 gen", "", ""],
          ["60 m", "7.01", "24 gen", "6.95", "6.90"],
          ["100 m", "10.90", "20 giu", "10.80", "10.75"],
          ["200 m", "22.40", "9 mag", "22.00", "21.90"]
        ],
        massimali: [
          ["Squat", 155, "5 mar", ""], ["Trap Bar", 185, "5 mar", ""],
          ["Panca piana", 92, "5 mar", ""], ["Stacco", 175, "5 mar", ""],
          ["Hip thrust", 170, "5 mar", ""]
        ],
        salti: [
          ["CMJ", "45", "cm", "5 mar"], ["SJ", "41", "cm", "5 mar"],
          ["Drop jump", "44", "cm", "5 mar"], ["RSI", "2.2", "index", "5 mar"],
          ["Broad jump", "270", "cm", "5 mar"], ["Sprint 30 m volante", "3.10", "s", "2 mag"]
        ]
      } },
    { id: "at2", nome: "Marco Bianchi", disciplina: "velocita", specialita: "200 m",
      pb: [["100 m", "11.42"]], massimali: [["Squat", 130]],
      presenzeMese: [18, 22], presenzeStagione: [201, 240], test: [],
      scheda: {
        anagrafica: { categoria: "Juniores", nascita: "22/07/2006", anno: 2006,
          gambaStacco: "Sinistra", altezza: 178, peso: 70 },
        pb: [
          ["60 m", "7.30", "10 feb", "", ""], ["100 m", "11.42", "5 giu", "11.35", "11.20"],
          ["200 m", "23.10", "20 mag", "22.90", "22.50"]
        ],
        massimali: [
          ["Squat", 130, "3 mar", ""], ["Panca piana", 78, "3 mar", ""], ["Stacco", 150, "3 mar", ""]
        ],
        salti: [["CMJ", "40", "cm", "3 mar"], ["RSI", "2.0", "index", "3 mar"]]
      } },
    { id: "at3", nome: "Sara Moretti", disciplina: "velocita", specialita: "100 m",
      pb: [["100 m", "12.60"]], massimali: [["Squat", 85]],
      presenzeMese: [11, 22], presenzeStagione: [150, 240], test: [],
      scheda: {
        anagrafica: { categoria: "Allieve", nascita: "08/11/2008", anno: 2008,
          gambaStacco: "Destra", altezza: 168, peso: 58 },
        pb: [
          ["60 m", "8.05", "15 gen", "", ""], ["100 m", "12.60", "10 mag", "12.55", "12.40"]
        ],
        massimali: [["Squat", 85, "1 mar", ""], ["Hip thrust", 95, "1 mar", ""]],
        salti: [["CMJ", "34", "cm", "1 mar"]]
      } }
  ],

  mesociclo: {
    numero: 3, blocco: "Forza max", settimanaCorrente: 2, settimaneTotali: 4,
    focus: "Costruire la forza massima mantenendo la velocità di esecuzione",
    dal: "5 ott", al: "1 nov"
  },

  prossimaGara: { luogo: "Rieti", gara: "100 m", obiettivo: "A", traSettimane: 5 },
  gareProssime: [
    { data: "17 ott", luogo: "Novara", gara: "100 m", obiettivo: "B" },
    { data: "8 nov", luogo: "Torino", gara: "60 m", obiettivo: "C" }
  ],

  // Esercizi con la scheda che si apre toccandoli
  schede: {
    "Attivazione sprint": ["Ankle hops 2×10", "A-skip sul posto 2×15 m", "Wall drill 3×5", "Falling start ×3"],
    "Mobilità completa": ["Cat camel ×8", "90/90 anca 6 per lato", "Runner stretch 30\" per lato", "Ankle CARs 5 per lato"],
    "Andature sprint": ["A skip 2×20 m", "B skip 2×20 m", "Dribbling 2×20 m", "3 allunghi progressivi"]
  },

  // Monitoraggio per l'allenatore (per atleta)
  mon: {
    at1: { stato: "v", acwr: "1.12", forma: "+4.2", prontezza: "3.9", aderenza: 90,
      ultimo: "ieri", fv: "profilo equilibrato",
      alert: [["v", "60 m migliorato: 7.06 → 7.01"]],
      settimana: ["pista", "", "palestra", "pista", "", "gara", ""], done: [1, 0, 1, 1, 0, 0, 0] },
    at2: { stato: "w", acwr: "1.38", forma: "+1.1", prontezza: "3.2", aderenza: 84,
      ultimo: "oggi", fv: "carenza di forza",
      alert: [["w", "Asimmetria caviglia 12%"], ["w", "Diario non compilato da 2 giorni"]],
      settimana: ["pista", "palestra", "", "pista", "palestra", "", ""], done: [1, 1, 0, 1, 0, 0, 0] },
    at3: { stato: "r", acwr: "1.62", forma: "−3.5", prontezza: "2.1", aderenza: 63,
      ultimo: "4 giorni fa", fv: "—",
      alert: [["r", "Prontezza bassa da 4 giorni (2.1)"], ["r", "Carico in salita: ACWR 1.62"], ["w", "4 sedute saltate"]],
      settimana: ["palestra", "", "pista", "", "", "", ""], done: [0, 0, 0, 0, 0, 0, 0] }
  },

  giorniSettimana: ["lun", "mar", "mer", "gio", "ven", "sab", "dom"],

  // Report della domenica
  report: {
    settimana: "21 – 27 settembre",
    positivo: {
      pista: "Tempo medio sui 30 m: 4.12 → 4.06 · 2 atleti su 3 in miglioramento",
      palestra: "Volume settimanale +8% · velocità del bilanciere stabile a parità di carico",
      wins: [
        ["Leonardo Z.", "record sui 60 m: 7.01"],
        ["Marco B.", "quattro settimane di fila senza saltare"]
      ]
    },
    daFare: {
      at3: "Sentila e scarica: togli le ripetute intense di giovedì",
      at2: "Ricontrolla la caviglia al prossimo test"
    }
  },

  // Infortuni e prevenzione (per la vista dell'allenatore)
  infortuni: [
    { atleta: "at3", zona: "Tendine d'Achille dx", stato: "In recupero", dal: "marzo",
      nota: "Stop di 10 giorni a marzo, rientrata con carichi ridotti. Continuare calf eccentrici e isometrie, niente pliometria intensa fino al via libera." },
    { atleta: "at2", zona: "Caviglia sx", stato: "Da monitorare", dal: "questa settimana",
      nota: "Asimmetria del 12% all'ultimo test. Mobilità caviglia + propriocezione monopodalica; ricontrollo al prossimo test." }
  ],

  // Ultimo diario per atleta (vista dell'allenatore)
  diariCoach: {
    at1: { compilato: true, ultimo: "oggi", prontezza: "3.9", sonno: 7.5, nota: "Tutto ok, gambe pronte." },
    at2: { compilato: false, ultimo: "2 giorni fa", prontezza: "3.2", sonno: 6, nota: "" },
    at3: { compilato: false, ultimo: "4 giorni fa", prontezza: "2.1", sonno: 5.5, nota: "Notti corte, un po' scarica." }
  },

  // Presenze per mese (programmati, fatti) — per il grafico
  presenzeMesi: [
    ["set", 11, 11], ["ott", 31, 29], ["nov", 30, 28], ["dic", 31, 24],
    ["gen", 30, 29], ["feb", 28, 26], ["mar", 32, 22], ["apr", 30, 28],
    ["mag", 31, 30], ["giu", 26, 26]
  ],
  presenzeNota: "Marzo 22 su 32 — stop per infortunio (tendine d'Achille)",

  // Record e massimali in forma estesa (per la scheda "I miei dati")
  recordEstesi: [
    ["30 m blocchi", "3.82", "12 gen", null], ["60 m", "7.01", "24 gen", "6.95"],
    ["100 m", "10.90", "20 giu", "10.80"], ["200 m", "22.40", "9 mag", "22.00"]
  ],
  massimaliEstesi: [
    ["Squat", 155, "5 mar"], ["Trap Bar", 185, "5 mar"], ["Panca piana", 92, "5 mar"],
    ["Stacco", 175, "5 mar"], ["Hip thrust", 170, "5 mar"]
  ],
  testStorico: [
    ["60 m", "s", [7.20, 7.14, 7.08, 7.04, 7.01]],
    ["CMJ", "cm", [40, 41, 43, 44, 45]],
    ["Squat 1RM", "kg", [130, 142, 148, 152, 155]],
    ["RSI", "index", [1.9, 2.0, 2.1, 2.15, 2.2]]
  ],
  testDate: ["set", "nov", "gen", "mar", "mag"],

  // Diario di oggi (quello che l'atleta compila all'apertura)
  diarioOggi: {
    data: "oggi", oreSonno: 7.5,
    sonno_qualita: null, stress: null, dolori: null, energia: null,
    peso: null, ciclo: false, fastidi: false, doveFastidi: "", note: "", salvato: false
  },

  sedute: [
    { id: "s1", tipo: "pista", giorno: 2, quando: "oggi", data: "mercoledì 23 settembre",
      focus: "Accelerazione — qualità sopra la quantità",
      obiettivi: "• Spinta bassa nei primi 20 m, non alzarsi subito\n• Braccia ampie e rilassate\n• Recupero completo: meglio poche ripetute ma pulite",
      notaCoach: "",
      riscaldamento: ["Attivazione sprint", "Mobilità completa", "Andature sprint"],
      elementi: [
        { id: "e1", distanza: 60, ripetute: 4, percentuale: 95, recupero: "6'",
          target: 7.73, tempi: [7.80, 7.76, null, null] },
        { id: "e2", distanza: 30, ripetute: 6, percentuale: 100, recupero: "4'",
          target: 4.46, tempi: [null, null, null, null, null, null] }
      ],
      durata: null, rpe: null, fastidi: false, chiusa: false },

    { id: "s2", tipo: "palestra", giorno: 3, quando: "venerdì", data: "venerdì 25 settembre",
      focus: "Forza massima — velocità del bilanciere sopra il minimo",
      obiettivi: "• Massima intenzione in salita, controllo in discesa\n• Fermati se la velocità del bilanciere cala sotto il target\n• Cura la tecnica del Nordic: scendi lento",
      notaCoach: "",
      riscaldamento: ["Attivazione sprint", "Mobilità completa"],
      esercizi: [
        { id: "x1", nome: "Squat", serie: 4, rep: 5, percentuale: 85, peso: 132,
          vbtTarget: 0.55, recuperoSec: 180, vbt: [null, null, null, null] },
        { id: "x2", nome: "Hip thrust", serie: 3, rep: 8, percentuale: 80, peso: 136,
          vbtTarget: 0.60, recuperoSec: 150, vbt: [null, null, null] },
        { id: "x3", nome: "Nordic hamstring", serie: 3, rep: 6, percentuale: null, peso: null,
          vbtTarget: null, recuperoSec: 120, vbt: [null, null, null] },
        { id: "x4", nome: "Pallof press", serie: 3, rep: 8, percentuale: null, peso: null,
          vbtTarget: null, recuperoSec: 60, vbt: [null, null, null] }
      ],
      durata: null, rpe: null, fastidi: false, chiusa: false },

    { id: "s0", tipo: "pista", giorno: 1, quando: "lunedì", data: "lunedì 21 settembre",
      focus: "Velocità massima",
      obiettivi: "• Massima frequenza mantenendo l'ampiezza\n• Rilassato nel tratto lanciato",
      notaCoach: "Ha tenuto bene i 30 m lanciati. La prossima volta provare 40 m per allungare il tratto di velocità massima.",
      riscaldamento: ["Attivazione sprint", "Andature sprint"],
      elementi: [{ id: "e0", distanza: 30, ripetute: 5, percentuale: 100, recupero: "5'",
        target: 4.46, tempi: [4.48, 4.45, 4.47, 4.51, 4.49] }],
      durata: 85, rpe: 8, fastidi: false, chiusa: true }
  ]
};
