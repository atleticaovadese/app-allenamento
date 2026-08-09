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
  const del = (tab, key, id, i) => mod
    ? `<button class="chiudi" style="font-size:15px" onclick="eliminaVoce('${tab}','${a.id}','${id}','${key}',${i})" aria-label="Elimina">✕</button>` : "";
  const agg = (tipo, label) => mod
    ? `<button class="btn btn-2" style="margin-top:10px" onclick="apriAggiungi('${tipo}','${a.id}')">＋ ${label}</button>` : "";

  const pbRow = (r, i) => {
    const [d, t, data, stag, ob, id] = r;
    return `<div class="riga">
      <div style="flex:1;min-width:0">
        <div style="font-weight:500">${d}</div>
        <div class="et" style="margin-top:1px">${data ? "fatto il " + data : "—"}${stag ? " · miglior stagione " + stag + " s" : ""}</div>
        ${ob ? `<div style="font-size:12px;color:var(--blu);margin-top:2px">obiettivo ${ob} s</div>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:10px"><b style="font-size:17px">${t}</b>${del("pb", "pb", id, i)}</div></div>`;
  };
  const gruppoPb = (origine) => {
    const filt = (s.pb || []).map((r, i) => [r, i]).filter(x => (x[0][7] || "gara") === origine);
    const best = {};
    filt.forEach(x => { const d = x[0][0], t = Number(x[0][1]); if (!(d in best) || t < Number(best[d][0][1])) best[d] = x; });
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
const ESERCIZI_MASSIMALI = ["Squat", "1/2 Squat", "Panca piana", "Stacco", "Trap Bar", "Strappo (snatch)", "Girata (clean)", "Hip thrust", "Pressa"];
const TEST_SALTI = [["CMJ", "cm"], ["SJ", "cm"], ["Drop jump", "cm"], ["RSI", "index"], ["Broad jump", "cm"], ["Sprint 30 m volante", "s"]];

// Menù a tendina con le voci + "Altro…" (che apre un campo libero).
function tendina(id, voci, extra) {
  return `<select id="${id}" onchange="toggleAltro('${id}')${extra || ""}">
      ${voci.map(x => `<option value="${x.replace(/"/g, "&quot;")}">${x}</option>`).join("")}
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
    campi = `<label class="lab">Distanza</label>${tendina("f1", DIST_PB)}
      <label class="lab" style="display:block;margin-top:12px">Tempo (s)</label><input id="f2" inputmode="decimal" placeholder="12.86" style="margin-top:6px">
      <label class="lab" style="display:block;margin-top:12px">Data</label><input id="f3" type="date" style="margin-top:6px">
      <div class="griglia2" style="margin-top:12px"><div><label class="lab">Miglior tempo stagione (s)</label><input id="f4" inputmode="decimal" placeholder="12.90" style="margin-top:6px"></div>
        <div><label class="lab">Obiettivo (s)</label><input id="f5" inputmode="decimal" placeholder="12.50" style="margin-top:6px"></div></div>`;
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
  const num = x => x === "" ? null : Number(String(x).replace(",", "."));
  const n1 = valTendina("f1");
  let ok = false;
  if (tipo === "pb") {
    if (!n1 || !v("f2")) { alert("Distanza e tempo sono obbligatori."); return; }
    ok = await creaPB(atletaId, { distanza: n1, tempo: num(v("f2")), data: v("f3") || null, stagione: num(v("f4")), obiettivo: num(v("f5")), origine: "gara" });
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
  return schedaAtleta(a, false) + `
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
    atletaId, disciplina: a.disciplina || "velocita", specialita: a.specialita || "",
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
      <label class="lab">Disciplina (gruppo)</label>
      <select onchange="S.modificaDati.disciplina=this.value; S.modificaDati.specialita=''; disegna()" style="margin-top:6px">
        ${disc.map(([k, l]) => `<option value="${k}" ${m.disciplina === k ? "selected" : ""}>${l}</option>`).join("")}</select>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Specialità</label>
          ${spec.length
            ? `<select onchange="S.modificaDati.specialita=this.value" style="margin-top:6px"><option value="">— scegli —</option>${spec.map(x => `<option ${m.specialita === x ? "selected" : ""}>${x}</option>`).join("")}</select>`
            : `<input value="${(m.specialita || "").replace(/"/g, "&quot;")}" placeholder="—" oninput="S.modificaDati.specialita=this.value" style="margin-top:6px">`}</div>
        <div><label class="lab">Categoria</label>
          <input value="${(m.categoria || "").replace(/"/g, "&quot;")}" placeholder="Es. Allievi" oninput="S.modificaDati.categoria=this.value" style="margin-top:6px"></div>
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
  const ok = typeof aggiornaAnagrafica === "function" ? await aggiornaAnagrafica(m.atletaId, {
    disciplina: m.disciplina, specialita: (m.specialita || "").trim(), categoria: (m.categoria || "").trim(),
    data_nascita: m.data_nascita || null, gamba_stacco: m.gamba_stacco || null,
    altezza_cm: m.altezza_cm ? Number(m.altezza_cm) : null, peso_kg: m.peso_kg ? Number(m.peso_kg) : null
  }) : false;
  if (ok) { S.modificaDati = null; disegna(); window.scrollTo(0, 0); }
  else if (btn) { btn.textContent = "Salva i miei dati"; btn.disabled = false; }
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
  const modo = S.calModo || "mesociclo";
  const testa = `
    <div class="card" style="padding:10px 12px">
      <div class="switch">
        <button class="${modo === "mese" ? "on" : ""}" onclick="setCal('mese')">Mese</button>
        <button class="${modo === "mesociclo" ? "on" : ""}" onclick="setCal('mesociclo')">Mesociclo</button>
      </div>
    </div>`;
  return testa + (modo === "mesociclo" ? calMesociclo() : calMese());
}
function setCal(m) { S.calModo = m; disegna(); }

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
