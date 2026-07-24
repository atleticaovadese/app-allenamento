// Schermate di dettaglio dell'atleta: I miei dati, Presenze, Calendario.

// ---------- Scheda atleta (copia del foglio "Atleta": la vedono atleta E allenatore) ----------
function schedaAtleta(a) {
  const s = a.scheda || {}, an = s.anagrafica || {};
  const anag = [
    ["Categoria", an.categoria], ["Anno", an.anno],
    ["Data di nascita", an.nascita], ["Gamba di stacco", an.gambaStacco],
    ["Altezza", an.altezza ? an.altezza + " cm" : ""], ["Peso rif.", an.peso ? an.peso + " kg" : ""],
    ["Disciplina", a.disciplina], ["Specialità", a.specialita]
  ];
  const pb = (s.pb || []).map(([d, t, data, stag, ob]) => `
    <div class="riga">
      <div><div style="font-weight:500">${d}</div>
        <div class="et">${[data, stag ? "stag. " + stag : "", ob ? "obiettivo " + ob : ""].filter(Boolean).join(" · ") || "—"}</div></div>
      <b style="font-size:17px">${t}</b></div>`).join("");
  const mx = (s.massimali || []).map(([n, kg, data, note]) => `
    <div class="riga">
      <div><div style="font-weight:500">${n}</div>
        <div class="et">${[data, note].filter(Boolean).join(" · ") || "—"}</div></div>
      <b style="font-size:17px">${kg} <span style="font-size:13px;color:var(--txt2)">kg</span></b></div>`).join("");
  const salti = (s.salti || []).map(([n, v, u, data]) => `
    <div class="riga">
      <div><div style="font-weight:500">${n}</div><div class="et">${data || "—"}</div></div>
      <b style="font-size:16px">${v} <span style="font-size:13px;color:var(--txt2)">${u}</span></b></div>`).join("");

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
    <p class="et" style="margin-bottom:6px">Migliori prestazioni (PB) <span style="color:var(--txt3)">· data · stagione · obiettivo</span></p>
    ${pb || `<p class="et">Nessun PB inserito.</p>`}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Massimali di forza</p>
    ${mx || `<p class="et">Nessun massimale inserito.</p>`}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Salti e test</p>
    ${salti || `<p class="et">Nessun test inserito.</p>`}
  </div>`;
}

// ---------- I miei dati (atleta) ----------
function vistaIo() {
  const a = DEMO.atleti.find(x => x.id === S.utente.atletaId) || DEMO.atleti[0];
  return schedaAtleta(a) + `
  <div class="card">
    <p class="et">I dati li tiene aggiornati l'allenatore. Per vedere le presenze:
      <button class="link-indietro" onclick="vai('presenze')">apri Presenze ›</button></p>
  </div>`;
}

// ---------- Scheda atleta vista dall'allenatore ----------
function vistaSchedaAtleta() {
  const a = DEMO.atleti.find(x => x.id === S.atletaSel) || DEMO.atleti[0];
  return `<button class="indietro" onclick="chiudiSchedaAtleta()">‹ Torna al cruscotto</button>` + schedaAtleta(a);
}
function apriSchedaAtleta() { S.mostraScheda = true; disegna(); window.scrollTo(0, 0); }
function chiudiSchedaAtleta() { S.mostraScheda = false; disegna(); window.scrollTo(0, 0); }

// ---------- Presenze ----------
function vistaPresenze() {
  const a = DEMO.atleti[0];
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
