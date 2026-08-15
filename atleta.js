// Schermate di dettaglio dell'atleta: I miei dati, Presenze, Calendario.

// ---------- Scheda atleta (copia del foglio "Atleta": la vedono atleta E allenatore) ----------
function schedaAtleta(a, mod) {
  const s = a.scheda || {}, an = s.anagrafica || {};
  const anag = [
    ["Categoria", an.categoria], ["Anno", an.anno],
    ["Data di nascita", an.nascita], ["Gamba di stacco", an.gambaStacco],
    ["Altezza", an.altezza ? an.altezza + " cm" : ""], ["Peso rif.", an.peso ? an.peso + " kg" : ""],
    ["Disciplina", a.disciplina], ["Specialità", a.specialita]
  ];
  // mod: true/"full" = tutto editabile (coach); "pb" = solo i PB (atleta); false = sola lettura
  const canEdit = (tipo) => mod === true || mod === "full" || mod === tipo;
  const del = (tab, key, id, i) => canEdit(key === "massimali" ? "massimale" : key === "salti" ? "test" : "pb")
    ? `<button class="chiudi" style="font-size:15px" onclick="eliminaVoce('${tab}','${a.id}','${id}','${key}',${i})" aria-label="Elimina">✕</button>` : "";
  const agg = (tipo, label) => canEdit(tipo)
    ? `<button class="btn btn-2" style="margin-top:10px" onclick="apriAggiungi('${tipo}','${a.id}')">＋ ${label}</button>` : "";

  const disc = a.disciplina;
  const suff = pbSuff(disc);
  const pbRow = (r, i) => {
    const [d, t, data, stag, ob, id] = r;
    return `<div class="riga">
      <div style="flex:1;min-width:0">
        <div style="font-weight:500">${d}</div>
        <div class="et" style="margin-top:1px">${data ? "fatto il " + data : "—"}${(stag != null && stag !== "") ? " · miglior stagione " + fmtMisura(disc, stag) + suff : ""}</div>
        ${(ob != null && ob !== "") ? `<div style="font-size:12px;color:var(--blu);margin-top:2px">obiettivo ${fmtMisura(disc, ob) + suff}</div>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:10px"><b style="font-size:17px">${fmtMisura(disc, t)}${disc === "lanci" ? " m" : ""}</b>${del("pb", "pb", id, i)}</div></div>`;
  };
  const gruppoPb = (origine) => {
    const filt = (s.pb || []).map((r, i) => [r, i]).filter(x => (x[0][7] || "gara") === origine);
    const best = {};
    filt.forEach(x => {
      const d = x[0][0], t = parseMisura(disc, x[0][1]);
      if (t == null || isNaN(t)) return;
      if (!(d in best)) { best[d] = x; return; }
      const bt = parseMisura(disc, best[d][0][1]);
      const meglio = pbPiuAltoMeglio(disc) ? t > bt : t < bt;   // lanci: più lungo; tempi: meno
      if (meglio) best[d] = x;
    });
    return Object.values(best).map(x => pbRow(x[0], x[1])).join("");
  };
  const pbGara = gruppoPb("gara"), pbAllen = gruppoPb("allenamento");
  const mx = (s.massimali || []).map((r, i) => {
    const [n, kg, data, note, id] = r;
    return `<div class="riga">
      <div><div style="font-weight:500">${n}</div>
        <div class="et">${[data, note].filter(Boolean).join(" · ") || "—"}</div></div>
      <div style="display:flex;align-items:center;gap:10px"><b style="font-size:17px">${kg} <span style="font-size:13px;color:var(--txt2)">kg</span></b>${del("massimale", "massimali", id, i)}</div></div>`;
  }).join("");
  const salti = (s.salti || []).map((r, i) => {
    const [n, v, u, data, id] = r;
    return `<div class="riga">
      <div><div style="font-weight:500">${n}</div><div class="et">${data || "—"}</div></div>
      <div style="display:flex;align-items:center;gap:10px"><b style="font-size:16px">${v} <span style="font-size:13px;color:var(--txt2)">${u}</span></b>${del("test", "salti", id, i)}</div></div>`;
  }).join("");

  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="avatar">${a.nome.split(" ").map(x => x[0]).join("")}</div>
      <div><h3>${a.nome}</h3><p class="et" style="margin-top:2px">${a.disciplina} · ${a.specialita}${an.categoria ? " · " + an.categoria : ""}</p></div>
    </div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Dati anagrafici</p>
    <div class="griglia2">${anag.map(([k, v]) =>
      `<div class="num"><div class="k">${k}</div><div class="v" style="font-size:15px">${v || "—"}</div></div>`).join("")}</div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">🏆 Migliori prestazioni in gara (PB)</p>
    ${pbGara || `<p class="et">Nessun PB in gara. Registra un risultato dalla pagina Gare.</p>`}
    ${agg("pb", "Aggiungi PB gara")}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">🏋 Migliori prestazioni in allenamento (PB)</p>
    ${pbAllen || `<p class="et">Nessun PB in allenamento. Si riempie dai test sprint e dalle sedute di pista.</p>`}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Massimali di forza</p>
    ${mx || `<p class="et">Nessun massimale inserito.</p>`}
    ${agg("massimale", "Aggiungi massimale")}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Salti e test</p>
    ${salti || `<p class="et">Nessun test inserito.</p>`}
    ${agg("test", "Aggiungi test")}
  </div>`;
}

// Voci del foglio Atleta (per i menù a tendina).
const DIST_PB = ["30 m lanciato", "30 m blocchi", "60 m", "80 m", "100 m", "120 m", "150 m", "200 m", "300 m", "400 m"];
// eventi PB per disciplina
const EV_VELOCITA = [
  ["Velocità", ["30 m lanciato", "30 m blocchi", "60 m", "80 m", "100 m", "120 m", "150 m", "200 m", "300 m", "400 m"]],
  ["Ostacoli", ["60 hs", "100 hs", "110 hs", "400 hs"]],
  ["Salti", ["Salto in lungo", "Salto triplo", "Salto in alto", "Salto con l'asta"]]
];
const EV_MEZZO = ["600 m", "800 m", "1000 m", "1200 m", "1500 m", "1 miglio", "2000 m", "2000 siepi", "3000 m", "3000 siepi", "5000 m", "10000 m", "10 km strada", "Mezza maratona", "Maratona", "Campestre"];
const ATTREZZI_LANCI = [
  ["Femminile", ["Giavellotto 400 g", "Giavellotto 500 g", "Giavellotto 600 g", "Disco 1 kg", "Peso 3 kg", "Peso 4 kg", "Martello 3 kg", "Martello 4 kg"]],
  ["Maschile", ["Giavellotto 600 g", "Giavellotto 700 g", "Giavellotto 800 g", "Disco 1,5 kg", "Disco 1,75 kg", "Disco 2 kg", "Peso 4 kg", "Peso 5 kg", "Peso 6 kg", "Peso 7,26 kg", "Martello 4 kg", "Martello 5 kg", "Martello 6 kg", "Martello 7,26 kg"]]
];
function eventiPB(disc) {
  if (disc === "lanci") return ATTREZZI_LANCI;
  if (disc === "mezzofondo" || disc === "fondo") return EV_MEZZO;
  return EV_VELOCITA;
}
// opzioni <option>/<optgroup> per un <select> normale, con selezione corrente
function _optsPB(voci, sel) {
  const o = x => `<option ${sel === x ? "selected" : ""}>${x}</option>`;
  return (voci.length && Array.isArray(voci[0]))
    ? voci.map(g => `<optgroup label="${g[0]}">${g[1].map(o).join("")}</optgroup>`).join("")
    : voci.map(o).join("");
}
function labelPB(disc) {
  if (disc === "lanci") return { ev: "Attrezzo", val: "Misura (m)", ph: "es. 45.20", mode: "decimal", val2: "Miglior misura stagione (m)", ob: "Obiettivo (m)" };
  if (disc === "mezzofondo" || disc === "fondo") return { ev: "Distanza", val: "Tempo (min:sec o sec)", ph: "es. 4:02.5", mode: "text", val2: "Miglior tempo stagione", ob: "Obiettivo" };
  return { ev: "Prova", val: "Tempo (s) — per i salti: misura (m)", ph: "es. 12.86", mode: "decimal", val2: "Miglior stagione", ob: "Obiettivo" };
}
// --- misure PB per disciplina: tempi (secondi) per corsa, distanze (metri) per lanci/salti ---
function pbEDistanza(disc) { return disc === "lanci"; }               // lanci = misura in metri (più lungo = meglio)
function pbPiuAltoMeglio(disc) { return disc === "lanci"; }
// parse robusto → numero (secondi per i tempi, metri per le distanze). NON perde i decimali.
function parseMisura(disc, raw) {
  if (raw == null) return null;
  let x = String(raw).trim(); if (x === "") return null;
  x = x.replace(",", ".");
  if (x.indexOf(":") >= 0) { const p = x.split(":"); return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0); } // mm:ss(.cc)
  if (disc === "mezzofondo" || disc === "fondo") {
    const dot = x.indexOf(".");
    if (dot >= 0) { const R = x.slice(dot + 1); if (R.length === 2 && Number(R) < 60) return (Number(x.slice(0, dot)) || 0) * 60 + Number(R); } // "2.40" → 2:40
    return Number(x); // solo secondi (eventuali decimali)
  }
  return Number(x); // velocità (s) / lanci (m)
}
// formatta per la visualizzazione PRESERVANDO zeri e centesimi
function fmtMisura(disc, val) {
  if (val == null || val === "") return "—";
  const n = (typeof val === "number") ? val : parseMisura(disc, val);
  if (n == null || isNaN(n)) return String(val);
  if (disc === "mezzofondo" || disc === "fondo") {
    const m = Math.floor(n / 60), s = n - m * 60, whole = Math.floor(s + 1e-6), cc = Math.round((s - whole) * 100);
    const base = m + ":" + String(whole).padStart(2, "0");
    return cc > 0 ? base + "." + String(cc).padStart(2, "0") : base;
  }
  return n.toFixed(2); // velocità (s) e lanci (m): sempre 2 decimali → 45.20, 10.90
}
function pbSuff(disc) { return disc === "lanci" ? " m" : ((disc === "mezzofondo" || disc === "fondo") ? "" : " s"); }

const ESERCIZI_MASSIMALI = ["Squat", "1/2 Squat", "Panca piana", "Stacco", "Trap Bar", "Strappo (snatch)", "Girata (clean)", "Hip thrust", "Pressa"];
const TEST_SALTI = [["CMJ", "cm"], ["SJ", "cm"], ["Drop jump", "cm"], ["RSI", "index"], ["Broad jump", "cm"], ["Sprint 30 m volante", "s"]];

// Menù a tendina con le voci + "Altro…" (che apre un campo libero).
// voci = array piatto, oppure array di gruppi [ ["Etichetta", [voci...]], ... ] per gli optgroup.
function tendina(id, voci, extra) {
  const opt = x => `<option value="${x.replace(/"/g, "&quot;")}">${x}</option>`;
  const body = (voci.length && Array.isArray(voci[0]))
    ? voci.map(g => `<optgroup label="${g[0]}">${g[1].map(opt).join("")}</optgroup>`).join("")
    : voci.map(opt).join("");
  return `<select id="${id}" onchange="toggleAltro('${id}')${extra || ""}">
      ${body}
      <option value="__altro__">Altro…</option>
    </select>
    <input id="${id}b" placeholder="scrivi…" style="display:none;margin-top:8px">`;
}
function toggleAltro(id) {
  const sel = document.getElementById(id), inp = document.getElementById(id + "b");
  if (inp) inp.style.display = sel.value === "__altro__" ? "block" : "none";
}
function autoUnita() {
  const s = document.getElementById("f1"), u = document.getElementById("f3");
  if (!s || !u) return;
  const opt = s.options[s.selectedIndex], uu = opt ? opt.getAttribute("data-u") : "";
  if (uu) u.value = uu;
}
// legge il valore di una tendina (o il campo libero se "Altro")
function valTendina(id) {
  const s = document.getElementById(id);
  if (!s) return "";
  return s.value === "__altro__" ? ((document.getElementById(id + "b") || {}).value || "").trim() : s.value;
}

// Foglio per aggiungere una voce alla scheda (solo allenatore).
function apriAggiungi(tipo, atletaId) {
  let campi, tit;
  if (tipo === "pb") {
    tit = "Nuovo PB";
    const at = DEMO.atleti.find(x => x.id === atletaId);
    const disc = at ? at.disciplina : "velocita";
    const L = labelPB(disc);
    campi = `<label class="lab">${L.ev}</label>${tendina("f1", eventiPB(disc))}
      <label class="lab" style="display:block;margin-top:12px">${L.val}</label><input id="f2" inputmode="${L.mode}" placeholder="${L.ph}" style="margin-top:6px">
      <label class="lab" style="display:block;margin-top:12px">Data</label><input id="f3" type="date" style="margin-top:6px">
      <div class="griglia2" style="margin-top:12px"><div><label class="lab">${L.val2}</label><input id="f4" inputmode="${L.mode}" style="margin-top:6px"></div>
        <div><label class="lab">${L.ob}</label><input id="f5" inputmode="${L.mode}" style="margin-top:6px"></div></div>`;
  } else if (tipo === "massimale") {
    tit = "Nuovo massimale";
    campi = `<label class="lab">Esercizio</label>${tendina("f1", ESERCIZI_MASSIMALI)}
      <label class="lab" style="display:block;margin-top:12px">1RM (kg)</label><input id="f2" inputmode="numeric" placeholder="120" style="margin-top:6px">
      <label class="lab" style="display:block;margin-top:12px">Data</label><input id="f3" type="date" style="margin-top:6px">
      <label class="lab" style="display:block;margin-top:12px">Note</label><input id="f4" placeholder="opzionale" style="margin-top:6px">`;
  } else {
    tit = "Nuovo test";
    campi = `<label class="lab">Test</label>
      <select id="f1" onchange="toggleAltro('f1');autoUnita()">
        ${TEST_SALTI.map(([n, u]) => `<option value="${n}" data-u="${u}">${n}</option>`).join("")}
        <option value="__altro__">Altro…</option>
      </select>
      <input id="f1b" placeholder="scrivi…" style="display:none;margin-top:8px">
      <label class="lab" style="display:block;margin-top:12px">Valore</label><input id="f2" inputmode="decimal" placeholder="45" style="margin-top:6px">
      <label class="lab" style="display:block;margin-top:12px">Unità</label><input id="f3" value="${TEST_SALTI[0][1]}" placeholder="cm" style="margin-top:6px">
      <label class="lab" style="display:block;margin-top:12px">Data</label><input id="f4" type="date" style="margin-top:6px">`;
  }
  mostraFoglio(`
    <div class="foglio-top"><h3>${tit}</h3>
      <button class="chiudi" onclick="chiudiScheda()" aria-label="Chiudi">✕</button></div>
    ${campi}
    <button class="btn" style="margin-top:16px" onclick="salvaVoce('${tipo}','${atletaId}')">Salva</button>`);
}

async function salvaVoce(tipo, atletaId) {
  const v = id => ((document.getElementById(id) || {}).value || "").trim();
  const num = x => {
    if (x === "" || x == null) return null;
    x = String(x).replace(",", ".");
    if (x.indexOf(":") >= 0) { const p = x.split(":"); return Number(p[0]) * 60 + Number(p[1]); } // min:sec → secondi
    const n = Number(x); return isNaN(n) ? null : n;
  };
  const n1 = valTendina("f1");
  let ok = false;
  if (tipo === "pb") {
    if (!n1 || !v("f2")) { alert("Evento e misura sono obbligatori."); return; }
    const at = DEMO.atleti.find(x => x.id === atletaId);
    const disc = at ? at.disciplina : "velocita";   // parsing per disciplina: tempi (min:sec) o distanze (m)
    ok = await creaPB(atletaId, { distanza: n1, tempo: parseMisura(disc, v("f2")), data: v("f3") || null, stagione: parseMisura(disc, v("f4")), obiettivo: parseMisura(disc, v("f5")), origine: "gara" });
  } else if (tipo === "massimale") {
    if (!n1 || !v("f2")) { alert("Esercizio e kg sono obbligatori."); return; }
    ok = await creaMassimale(atletaId, { esercizio: n1, kg: num(v("f2")), data: v("f3") || null, note: v("f4") });
  } else {
    if (!n1 || !v("f2")) { alert("Test e valore sono obbligatori."); return; }
    ok = await creaTest(atletaId, { nome: n1, valore: num(v("f2")), unita: v("f3"), data: v("f4") || null });
  }
  if (ok) { chiudiScheda(); disegna(); window.scrollTo(0, 0); }
}

// ---------- I miei dati (atleta) ----------
function vistaIo() {
  const a = DEMO.atleti.find(x => x.id === S.utente.atletaId) || DEMO.atleti[0];
  const banner = S.onboarding === "personali"
    ? `<div class="card" style="border-color:var(--blu);background:var(--blu-bg)">
        <p style="font-weight:600;color:var(--blu)">Passo 2 di 3 · I tuoi personali</p>
        <p style="font-size:14px;line-height:1.6;margin-top:6px">Aggiungi qui i tuoi <b>PB di gara</b> col pulsante «＋ Aggiungi PB gara» (puoi farlo anche dopo). Quando hai finito, continua:</p>
        <button class="btn" style="margin-top:10px" onclick="setOnboarding('tour')">Continua al tutorial ›</button>
      </div>`
    : "";
  return banner + schedaAtleta(a, "pb") + `
  <div class="card">
    <button class="btn btn-2" onclick="apriModificaDati('${a.id}')">✏️ Modifica i miei dati (specialità, categoria, nascita, altezza, peso…)</button>
    <p class="et" style="margin-top:8px">Per le presenze: <button class="link-indietro" onclick="vai('presenze')">apri Presenze ›</button></p>
  </div>`;
}

// form anagrafica editabile: lo apre l'atleta (i suoi dati) o il coach (di un atleta)
function apriModificaDati(atletaId) {
  const a = DEMO.atleti.find(x => x.id === atletaId); if (!a) return;
  const an = (a.scheda && a.scheda.anagrafica) || {};
  S.modificaDati = {
    atletaId, nome: a.nome || "", disciplina: a.disciplina || "velocita", specialita: a.specialita || "",
    categoria: an.categoria || "", data_nascita: a.dataNascita || "",
    gamba_stacco: an.gambaStacco || "", altezza_cm: an.altezza || "", peso_kg: an.peso || ""
  };
  disegna(); window.scrollTo(0, 0);
}
function chiudiModificaDati() { S.modificaDati = null; disegna(); window.scrollTo(0, 0); }
function vistaModificaDati() {
  const m = S.modificaDati, a = DEMO.atleti.find(x => x.id === m.atletaId);
  const disc = [["velocita", "Velocità / Salti"], ["lanci", "Lanci"], ["mezzofondo", "Mezzofondo / Fondo"], ["palestra", "Solo palestra"]];
  const spec = (typeof SPEC_DISC !== "undefined" ? SPEC_DISC[m.disciplina] : null) || [];
  return `<button class="indietro" onclick="chiudiModificaDati()">‹ Indietro</button>
    <div class="card"><h3>I miei dati</h3>
      <p class="et" style="margin-top:2px">${a ? a.nome : ""} · completa o aggiorna il profilo.</p></div>
    <div class="card">
      <label class="lab">Nome e cognome</label>
      <input value="${(m.nome || "").replace(/"/g, "&quot;")}" placeholder="Nome Cognome" oninput="S.modificaDati.nome=this.value" style="margin-top:6px">
      <label class="lab" style="display:block;margin-top:12px">Disciplina (gruppo)</label>
      <select onchange="S.modificaDati.disciplina=this.value; S.modificaDati.specialita=''; disegna()" style="margin-top:6px">
        ${disc.map(([k, l]) => `<option value="${k}" ${m.disciplina === k ? "selected" : ""}>${l}</option>`).join("")}</select>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Specialità</label>
          ${spec.length
            ? `<select onchange="S.modificaDati.specialita=this.value" style="margin-top:6px"><option value="">— scegli —</option>${spec.map(x => `<option ${m.specialita === x ? "selected" : ""}>${x}</option>`).join("")}</select>`
            : `<input value="${(m.specialita || "").replace(/"/g, "&quot;")}" placeholder="—" oninput="S.modificaDati.specialita=this.value" style="margin-top:6px">`}</div>
        <div><label class="lab">Categoria</label>
          ${typeof selCategoria === "function" ? selCategoria(m.categoria, "S.modificaDati.categoria=this.value") : `<input value="${(m.categoria || "").replace(/"/g, "&quot;")}" oninput="S.modificaDati.categoria=this.value" style="margin-top:6px">`}</div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Data di nascita</label>
          <input type="date" value="${m.data_nascita || ""}" oninput="S.modificaDati.data_nascita=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Gamba di stacco</label>
          <select onchange="S.modificaDati.gamba_stacco=this.value" style="margin-top:6px">
            <option value="">—</option><option ${m.gamba_stacco === "Destra" ? "selected" : ""}>Destra</option><option ${m.gamba_stacco === "Sinistra" ? "selected" : ""}>Sinistra</option></select></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Altezza (cm)</label>
          <input inputmode="numeric" value="${m.altezza_cm || ""}" placeholder="178" oninput="S.modificaDati.altezza_cm=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Peso (kg)</label>
          <input inputmode="numeric" value="${m.peso_kg || ""}" placeholder="70" oninput="S.modificaDati.peso_kg=this.value" style="margin-top:6px"></div>
      </div>
    </div>
    <button class="btn" onclick="salvaModificaDati()">Salva i miei dati</button>`;
}
async function salvaModificaDati() {
  const m = S.modificaDati;
  const btn = document.querySelector(".main .btn"); if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }
  if (!(m.nome || "").trim()) { alert("Scrivi il nome."); if (btn) { btn.textContent = "Salva i miei dati"; btn.disabled = false; } return; }
  const ok = typeof aggiornaAnagrafica === "function" ? await aggiornaAnagrafica(m.atletaId, {
    nome: m.nome.trim(), disciplina: m.disciplina, specialita: (m.specialita || "").trim(), categoria: (m.categoria || "").trim(),
    data_nascita: m.data_nascita || null, gamba_stacco: m.gamba_stacco || null,
    altezza_cm: m.altezza_cm ? Number(m.altezza_cm) : null, peso_kg: m.peso_kg ? Number(m.peso_kg) : null
  }) : false;
  if (ok) {
    S.modificaDati = null;
    if (S.onboarding === "dati") { S.onboarding = "personali"; S.vista = "io"; } // porta ai personali
    disegna(); window.scrollTo(0, 0);
  } else if (btn) { btn.textContent = "Salva i miei dati"; btn.disabled = false; }
}

// ---------- Scheda atleta vista dall'allenatore ----------
function vistaSchedaAtleta() {
  const a = DEMO.atleti.find(x => x.id === S.atletaSel) || DEMO.atleti[0];
  return `<button class="indietro" onclick="chiudiSchedaAtleta()">‹ Torna al cruscotto</button>` + schedaAtleta(a, true);
}
function apriSchedaAtleta() { S.mostraScheda = true; disegna(); window.scrollTo(0, 0); }
function chiudiSchedaAtleta() { S.mostraScheda = false; disegna(); window.scrollTo(0, 0); }

// ---------- Presenze ----------
function vistaPresenze() {
  const a = atletaCorrente();
  const mesi = DEMO.presenzeMesi;
  const totFatti = mesi.reduce((s, m) => s + m[2], 0);
  const totProg = mesi.reduce((s, m) => s + m[1], 0);
  const ader = Math.round(totFatti / totProg * 100);
  const max = Math.max(...mesi.map(m => m[1]));

  const barre = mesi.map(([nome, prog, fatti]) => `
    <div class="barra">
      <div class="colonna">
        <div class="b prog" style="height:${Math.round(prog / max * 100)}%"></div>
        <div class="b fatti" style="height:${Math.round(fatti / max * 100)}%"></div>
      </div>
      <div class="et" style="text-align:center">${nome}</div>
    </div>`).join("");

  return `
  <div class="quadri" style="margin-bottom:11px">
    <div class="q"><div class="k">Fatti</div><div class="v">${totFatti}</div></div>
    <div class="q"><div class="k">Programmati</div><div class="v">${totProg}</div></div>
    <div class="q" style="border-color:rgba(124,194,67,.4)">
      <div class="k">Aderenza</div><div class="v" style="color:var(--verde)">${ader}%</div></div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <p class="et" style="margin:0">Programmati vs fatti, per mese</p>
      <div style="display:flex;gap:12px">
        <span class="et"><span class="quad prog"></span> progr.</span>
        <span class="et"><span class="quad fatti"></span> fatti</span>
      </div>
    </div>
    <div class="grafico">${barre}</div>
  </div>

  <div class="card" style="border-color:rgba(240,168,60,.45)">
    <p style="font-size:13px;color:var(--giallo)">${DEMO.presenzeNota}</p>
  </div>

  <div class="griglia2">
    <div class="num"><div class="k">Questo mese</div><div class="v">${a.presenzeMese[0]} / ${a.presenzeMese[1]}</div></div>
    <div class="num"><div class="k">Stagione</div><div class="v">${a.presenzeStagione[0]} / ${a.presenzeStagione[1]}</div></div>
  </div>`;
}

// ---------- Calendario: mese / mesociclo ----------
function vistaCalendario() {
  const off = S.calOff || 0;
  const sett = typeof settimanaProgramma === "function" ? settimanaProgramma(off) : [];
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  const dNum = iso => new Date(iso + "T00:00:00").getDate();
  const range = sett.length ? `${dNum(sett[0].dataISO)} – ${dNum(sett[6].dataISO)} ${MESI_FULL[new Date(sett[6].dataISO + "T00:00:00").getMonth()]}` : "";
  const haQualcosa = sett.some(d => d.sedute.length);
  return `
  <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px">
    <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="calSett(-1)">‹</button>
    <div style="text-align:center"><b>${off === 0 ? "Questa settimana" : (off > 0 ? "+" + off : off) + " sett"}</b><div class="et">${range}</div></div>
    <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="calSett(1)">›</button>
  </div>
  ${sett.map(d => `<div class="card"${d.oggi ? ' style="border-color:var(--blu)"' : ""}>
    <p style="font-weight:600${d.oggi ? ";color:var(--blu)" : ""}">${cap(d.nomeGiorno)} ${dNum(d.dataISO)}${d.oggi ? " · oggi" : ""}</p>
    ${d.sedute.length ? d.sedute.map(s => `<div class="lib-row" style="margin-top:8px" onclick="apriSeduta('${s.id}')">
      <div style="flex:1;min-width:0"><div style="font-weight:500">${s.tipo === "pista" ? "🏃 Pista" : "🏋 Palestra"} · giorno ${s.giorno}</div>
        <div class="et" style="margin-top:1px">${typeof riepilogoSeduta === "function" ? riepilogoSeduta(s) : ""}</div></div>
      <span class="freccia">›</span></div>`).join("")
      : `<p class="et" style="margin-top:6px">Riposo</p>`}
  </div>`).join("")}
  ${!haQualcosa ? `<div class="card"><p class="et">Nessun allenamento programmato in questa settimana. Il programma lo imposta l'allenatore.</p></div>` : ""}`;
}
function calSett(d) { S.calOff = (S.calOff || 0) + d; disegna(); window.scrollTo(0, 0); }

function calMesociclo() {
  const m = DEMO.mesociclo;
  const giorni = [["Giorno 1", "lun", "pista"], ["Giorno 2", "mer", "pista"],
    ["Giorno 3", "ven", "palestra"], ["Giorno 4", "sab", "pista"]];
  const fatti = [[1, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0]];

  const righe = giorni.map(([g, wd, tipo], i) => `
    <div class="mrow">
      <div class="mrow-tit"><div>${g}</div><div class="et">${wd}</div></div>
      ${[0, 1, 2, 3].map(w => {
        const now = w === m.settimanaCorrente - 1;
        const scarico = w === 3;
        return `<div class="cell ${tipo} ${scarico ? "scarico" : ""} ${now ? "now" : ""}"
          onclick="apriSeduta('${i === 0 && w === m.settimanaCorrente - 1 ? "s1" : "s1"}')">
          ${fatti[i][w] ? "✓" : ""}</div>`;
      }).join("")}
    </div>`).join("");

  return `
  <div class="card">
    <h3>Mesociclo ${m.numero} — ${m.blocco}</h3>
    <p class="et" style="margin-top:2px">${m.dal} – ${m.al} · sei nella settimana ${m.settimanaCorrente}</p>
    <div class="mhead"><span></span><span>S1</span><span>S2</span><span>S3</span><span>S4</span></div>
    ${righe}
    <div class="legenda">
      <span><span class="quad" style="background:var(--blu)"></span> pista</span>
      <span><span class="quad" style="background:var(--viola)"></span> palestra</span>
      <span>✓ fatto · S4 = scarico</span>
    </div>
  </div>`;
}

function calMese() {
  return `<div class="card"><h3>Vista mese</h3>
    <p class="et" style="margin-top:6px">La griglia del mese con i pallini per tipo la finiamo al prossimo giro — la vista mesociclo è quella che serve di più per capire dove sei.</p></div>
    ${DEMO.sedute.map(s => {
      const cosa = s.tipo === "pista" ? "Pista" : "Palestra";
      return `<div class="card es" onclick="apriSeduta('${s.id}')">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="spunta ${s.chiusa ? "v" : ""}">${s.chiusa ? "✓" : ""}</span>
          <div style="flex:1"><h3>${cosa} · giorno ${s.giorno}</h3>
            <p class="et" style="margin-top:2px">${s.data}</p></div>
          <span class="freccia">›</span></div></div>`;
    }).join("")}`;
}
