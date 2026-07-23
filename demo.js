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
      test: [["60 m", "7.01", "-0.05"], ["CMJ", "45 cm", "+2"], ["Squat", "155 kg", "+5"]] },
    { id: "at2", nome: "Marco Bianchi", disciplina: "velocita", specialita: "200 m",
      pb: [["100 m", "11.42"]], massimali: [["Squat", 130]],
      presenzeMese: [18, 22], presenzeStagione: [201, 240], test: [] },
    { id: "at3", nome: "Sara Moretti", disciplina: "velocita", specialita: "100 m",
      pb: [["100 m", "12.60"]], massimali: [["Squat", 85]],
      presenzeMese: [11, 22], presenzeStagione: [150, 240], test: [] }
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
      focus: "Velocità massima", riscaldamento: ["Attivazione sprint", "Andature sprint"],
      elementi: [{ id: "e0", distanza: 30, ripetute: 5, percentuale: 100, recupero: "5'",
        target: 4.46, tempi: [4.48, 4.45, 4.47, 4.51, 4.49] }],
      durata: 85, rpe: 8, fastidi: false, chiusa: true }
  ]
};
