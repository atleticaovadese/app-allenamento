// Schermate di dettaglio dell'atleta: I miei dati, Presenze, Calendario.

// ---------- I miei dati ----------
function vistaIo() {
  const a = DEMO.atleti[0];

  const record = DEMO.recordEstesi.map(([d, t, data, ob]) => `
    <div class="riga">
      <div><div>${d}</div><div class="et">${data}${ob ? " · obiettivo " + ob : ""}</div></div>
      <b style="font-size:17px">${t}</b>
    </div>`).join("");

  const mx = DEMO.massimaliEstesi.map(([n, kg, data]) => `
    <div class="riga">
      <div><div>${n}</div><div class="et">${data}</div></div>
      <b style="font-size:17px">${kg} <span style="font-size:13px;color:var(--txt2)">kg</span></b>
    </div>`).join("");

  const test = DEMO.testStorico.map(([n, u, serie]) => {
    const primo = serie[0], ultimo = serie[serie.length - 1];
    const migliore = u === "s" ? Math.min(...serie) : Math.max(...serie);
    const su = u === "s" ? (ultimo < primo) : (ultimo > primo);
    return `<div class="riga">
      <div><div>${n}</div><div class="et">${serie.length} sessioni</div></div>
      <div style="text-align:right">
        <b style="font-size:16px">${ultimo}</b> <span class="et">${u}</span>
        <div class="et" style="color:${su ? "var(--verde)" : "var(--txt3)"}">
          ${su ? "▲" : "="} meglio ${migliore}</div>
      </div></div>`;
  }).join("");

  return `
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="avatar">${a.nome.split(" ").map(x => x[0]).join("")}</div>
      <div><h3>${a.nome}</h3><p class="et" style="margin-top:2px">${a.disciplina} · ${a.specialita}</p></div>
    </div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Record personali</p>
    ${record}
    <p class="et" style="margin-top:10px">Li puoi aggiornare tu o l'allenatore.</p>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Massimali</p>
    ${mx}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:6px">Ultimi test</p>
    ${test}
    <button class="btn btn-2" style="margin-top:12px" onclick="vai('presenze')">Vedi anche le presenze</button>
  </div>`;
}

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
