// Periodizzazione & Volumi — foglio-guida (fedele al foglio Excel, sola lettura).
// Riferimento operativo: struttura annuale, parametri forza, zone VBT, volumi in pista.

const PERIODIZZAZIONE = {
  intro: "Fonti: Bompa (Periodizzazione), Squillante (VBT), NSCA, Francis/Altis. Valori indicativi da adattare ad atleta, gara (60/100/200/400) e calendario. Vedi anche Piano & Picco e Velocità target.",
  tabelle: [
    {
      titolo: "1) Struttura annuale (fasi e durate)",
      head: ["Sotto-fase", "Blocco forza", "Pista (sistema energetico)", "Durata tipica"],
      righe: [
        ["Prep. generale", "AA — Adatt. Anatomico", "Aerobico (O2p), tecnica, mezzi generali", "~3-4 sett"],
        ["Prep. speciale", "Mx-S — Forza Massima", "Capacità lattacida + avvio pot. alattacida", "~6-7 sett"],
        ["Pre-competitiva", "Conversione a Potenza", "Pot. alattacida / lattacida (specifica)", "~4 sett"],
        ["Competitiva", "Mantenimento P + MxS", "Pot. alattacida / lattacida (gara)", "~6 sett"],
        ["Transizione", "Compensazione / recupero", "Aerobico leggero, scarico", "1-2 sett"]
      ]
    },
    {
      titolo: "2) Parametri forza (sala pesi) per fase",
      sotto: "Bompa / NSCA / Squillante",
      head: ["Fase", "% 1RM", "Vel. squat (m/s)", "Ripetiz.", "Serie", "Recupero", "Buffer (RIR)", "Note"],
      righe: [
        ["AA (Adatt. Anatom.)", "40-60%", "0.80-1.05", "8-12 (15)", "2-4", "60-90 s", "alto (4-6)", "controllata; circuito total-body; tendini/struttura"],
        ["Ipertrofia (opz.)", "67-80%", "0.55-0.72", "6-12", "3-6", "1-2 min", "0-2", "a/quasi esaurimento; solo se serve massa"],
        ["Forza Massima", "85-100%", "0.30-0.50", "1-5", "4-6", "3-5 min", "0-2", "concentrica esplosiva; esercizi base; recuperi pieni"],
        ["Conv. Potenza (alti)", "70-85%", "0.50-0.70", "2-5", "3-5", "3-5 min", "2-3", "oly lift (girate/strappi); spingi al massimo"],
        ["Conv. Potenza (bassi)", "30-50%", "0.90-1.20", "3-6", "3-5", "3-5 min", "—", "balistico: jump squat, balzi, med ball; max velocità"],
        ["Mantenimento", "80-90% + pot.", "0.42-0.55", "1-4", "2-3", "3 min", "2-3", "esplosiva; 1-2 sedute/sett; volume ridotto"]
      ]
    },
    {
      titolo: "2b) Zone di velocità VBT",
      sotto: "Mann / Squillante / González-Badillo",
      head: ["Velocità (m/s)", "Qualità allenata", "Uso"],
      righe: [
        [">1.30", "Velocità / starting strength", "balzi, jump squat leggeri"],
        ["1.00-1.30", "Speed-strength (potenza carichi bassi)", "salti caricati, oly leggeri"],
        ["0.75-1.00", "Strength-speed", "oly lift, potenza con carichi medi"],
        ["0.50-0.75", "Forza accelerativa", "squat/panca 70-85%"],
        ["<0.50", "Forza assoluta / massima", "squat/panca 85-100%"]
      ],
      nota: "Velocità media concentrica per lo SQUAT. Panca ~0.10-0.15 m/s più bassa; distensioni/strappi olimpici più alti. Usa la velocità come zona-bersaglio e per autoregolare: se cali sotto la zona = troppa fatica/carico, riduci o fermati."
    },
    {
      titolo: "3) Volumi in pista per mezzo / sistema energetico",
      sotto: "Francis / Altis",
      head: ["Mezzo", "Intensità", "Distanze", "Volume seduta", "Recupero", "Quando"],
      righe: [
        ["Tempo estensivo (aerob.)", "65-75%", "100-300 m", "1500-3000 m", "30-90 s (incompl.)", "AA / rigenerante"],
        ["Accelerazione / Forza", "90-100%", "10-30 m (blocchi, traino, salite)", "150-400 m", "completo 3-6'", "tutte le fasi (alattac.)"],
        ["Velocità massima", "95-100%", "20-60 m (lanciati)", "200-500 m", "completo 5-8'", "prep spec / comp (alattac.)"],
        ["Speed endurance (pot. lat.)", "95-100%", "60-150 m", "300-900 m", "lungo 6-12'", "pre-comp / comp (100-200)"],
        ["Special endurance (cap. lat.)", "90-95%", "150-300 m (400: ≤600)", "600-2000 m", "lungo 8-15'", "200 / 400"],
        ["Tolleranza lattato", "90-95%", "150-300 m", "600-1200 m", "incompleto", "prep spec (400)"]
      ]
    }
  ],
  bullet: [
    {
      titolo: "4) Onda del carico e scarico",
      voci: [
        "Step loading 3:1 (3 settimane in crescita + 1 di scarico). Per atleti meno avanzati o periodi duri: 2:1.",
        "Settimana di scarico: volume −40/−50%, intensità mantenuta (così cali la fatica ma tieni la condizione).",
        "Aumenti graduali del carico settimanale (indicativamente non oltre ~10%).",
        "Verifica nel foglio Carico & Forma: ACWR in 0.8-1.3; Forma (TSB) positiva prima delle gare."
      ]
    },
    {
      titolo: "5) VBT, buffer e autoregolazione",
      sotto: "Squillante",
      voci: [
        "Il 'buffer' di Bompa = ripetizioni in riserva (RIR) = una zona di velocità (m/s).",
        "Ogni % di 1RM ha una velocità tipica: monitora la m/s (VBT / Stima 1RM) per restare nella zona giusta.",
        "Velocità alta a parità di carico = forza/potenza in aumento; velocità bassa = fatica → autoregola (riduci serie o carico)."
      ]
    }
  ]
};

function vistaPeriodizzazione() {
  const tab = t => `
    <div class="card">
      <p style="font-weight:600;font-size:13px">${t.titolo}</p>
      ${t.sotto ? `<p class="et" style="margin:2px 0 8px">${t.sotto}</p>` : `<div style="height:8px"></div>`}
      <div class="p-scroll"><table class="ptab">
        <thead><tr>${t.head.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${t.righe.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>
      ${t.nota ? `<p class="et" style="margin-top:8px;line-height:1.5">${t.nota}</p>` : ""}
    </div>`;
  const bl = b => `
    <div class="card">
      <p style="font-weight:600;font-size:13px;margin-bottom:8px">${b.titolo}${b.sotto ? ` <span class="et">· ${b.sotto}</span>` : ""}</p>
      ${b.voci.map(v => `<p style="font-size:14px;line-height:1.6;margin-bottom:8px;color:var(--txt2)">• ${v}</p>`).join("")}
    </div>`;
  return `<div class="card"><h3>Periodizzazione &amp; Volumi</h3>
      <p class="et" style="margin-top:2px">${PERIODIZZAZIONE.intro}</p></div>
    ${PERIODIZZAZIONE.tabelle.map(tab).join("")}
    ${PERIODIZZAZIONE.bullet.map(bl).join("")}`;
}
