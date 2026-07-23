// Viste dell'allenatore: squadra, dettaglio atleta, calendario squadra, report.

const STATO = {
  v: ["p-verde", "in regola", "var(--verde)"],
  w: ["p-giallo", "attenzione", "var(--giallo)"],
  r: ["p-rosso", "rischio alto", "var(--rosso)"]
};
const TIPO_CELLA = { pista: "pista", palestra: "palestra", gara: "gara", salto: "salto" };

function triage() {
  const c = { v: 0, w: 0, r: 0 };
  DEMO.atleti.forEach(a => { const s = DEMO.mon[a.id]; if (s) c[s.stato]++; });
  return c;
}

// ---------- squadra (ingresso coach) ----------
function vistaSquadra() {
  const t = triage();
  return `
  <div class="quadri" style="margin-bottom:11px">
    <div class="q" onclick="vai('report')"><div class="k">Da vedere subito</div>
      <div class="v" style="color:var(--rosso)">${t.r}</div></div>
    <div class="q" onclick="vai('report')"><div class="k">Tieni d'occhio</div>
      <div class="v" style="color:var(--giallo)">${t.w}</div></div>
    <div class="q" onclick="vai('report')"><div class="k">In regola</div>
      <div class="v" style="color:var(--verde)">${t.v}</div></div>
  </div>
  ${listaAtleti()}`;
}

function vistaAtleti() {
  return `<div class="card"><h3>Atleti</h3>
    <p class="et" style="margin-top:2px">${DEMO.atleti.length} · tocca per il cruscotto</p></div>
    ${listaAtleti()}`;
}

function listaAtleti() {
  // ordinati per urgenza: rosso, giallo, verde
  const ord = { r: 0, w: 1, v: 2 };
  const arr = [...DEMO.atleti].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);
  return arr.map(a => {
    const s = DEMO.mon[a.id], [, , col] = STATO[s.stato];
    return `<div class="card riga-a" onclick="apriAtleta('${a.id}')">
      <span class="dot" style="background:${col}"></span>
      <div style="flex:1;min-width:0">
        <h3>${a.nome}</h3>
        <p class="et" style="margin-top:2px">${a.specialita} · ${s.ultimo} · aderenza ${s.aderenza}%</p>
      </div>
      <span class="freccia">›</span>
    </div>`;
  }).join("");
}

// ---------- dettaglio atleta = cruscotto ----------
function apriAtleta(id) { S.atletaSel = id; disegna(); window.scrollTo(0, 0); }
function chiudiAtleta() { S.atletaSel = null; disegna(); }

function vistaAtletaDettaglio() {
  const a = DEMO.atleti.find(x => x.id === S.atletaSel);
  const s = DEMO.mon[a.id];
  const [, txt, col] = STATO[s.stato];

  const avvisi = s.alert.map(([lv, t]) => {
    const c = STATO[lv][2];
    return `<div class="avviso" style="background:${lv === 'v' ? 'var(--verde-bg)' : lv === 'w' ? 'var(--giallo-bg)' : 'var(--rosso-bg)'}">
      <span style="color:${c}">${lv === 'v' ? '▲' : '!'}</span>
      <span style="color:${c};font-size:13px">${t}</span></div>`;
  }).join("");

  const sett = s.settimana.map((tp, i) => `
    <div class="mini-g">
      <div class="mini-c ${tp ? TIPO_CELLA[tp] : 'vuoto'} ${s.done[i] ? '' : 'nofatto'}">${s.done[i] ? '✓' : ''}</div>
      <div class="et" style="text-align:center;font-size:10px">${DEMO.giorniSettimana[i]}</div>
    </div>`).join("");

  return `
  <button class="indietro" onclick="chiudiAtleta()">‹ Squadra</button>
  <div class="card">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="avatar">${a.nome.split(" ").map(x => x[0]).join("")}</div>
      <div style="flex:1"><h3>${a.nome}</h3><p class="et" style="margin-top:2px">${a.disciplina} · ${a.specialita}</p></div>
      <span class="pill ${STATO[s.stato][0]}">${txt}</span>
    </div>
  </div>

  ${s.alert.length ? `<div style="margin-bottom:11px">${avvisi}</div>` : ""}

  <div class="quadri" style="margin-bottom:11px">
    <div class="q"><div class="k">ACWR</div><div class="v">${s.acwr}</div></div>
    <div class="q"><div class="k">Forma (TSB)</div><div class="v">${s.forma}</div></div>
    <div class="q"><div class="k">Prontezza</div><div class="v">${s.prontezza}</div></div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Ultima settimana</p>
    <div class="mini-week">${sett}</div>
  </div>

  <div class="griglia2" style="margin-bottom:11px">
    <div class="num"><div class="k">Prossima gara</div><div class="v" style="font-size:16px">${DEMO.prossimaGara.luogo}</div>
      <div class="et">tra ${DEMO.prossimaGara.traSettimane} sett</div></div>
    <div class="num"><div class="k">Profilo F-V</div><div class="v" style="font-size:15px">${s.fv}</div></div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Apri</p>
    <div class="azioni">
      <button class="btn btn-2" onclick="vai('pista')">Programma</button>
      <button class="btn btn-2" onclick="vai('test')">Test</button>
      <button class="btn btn-2" onclick="vai('diario-c')">Diario</button>
      <button class="btn btn-2" onclick="vai('presenze')">Presenze</button>
    </div>
  </div>`;
}

// ---------- calendario squadra ----------
function vistaCalendarioSquadra() {
  const gg = DEMO.giorniSettimana;
  const righe = DEMO.atleti.map(a => {
    const s = DEMO.mon[a.id];
    const celle = s.settimana.map((tp, i) => tp
      ? `<div class="cell ${TIPO_CELLA[tp]} ${s.done[i] ? '' : 'nofatto'}">${s.done[i] ? '✓' : ''}</div>`
      : `<div class="cell off"></div>`).join("");
    return `<div class="srow">
      <span class="srow-n">${a.nome.split(" ")[0]} ${a.nome.split(" ")[1][0]}.</span>${celle}</div>`;
  }).join("");

  return `
  <div class="card">
    <h3>Calendario squadra</h3>
    <p class="et" style="margin-top:2px">${DEMO.report.settimana} · chi si allena quando</p>
    <div class="shead"><span></span>${gg.map(g => `<span>${g}</span>`).join("")}</div>
    ${righe}
    <div class="legenda">
      <span><span class="quad" style="background:#2f6fd6"></span> pista</span>
      <span><span class="quad" style="background:#5148b0"></span> palestra</span>
      <span><span class="quad" style="background:#d85a30"></span> gara</span>
      <span>✓ fatto</span>
    </div>
  </div>`;
}

// ---------- report della domenica ----------
function vistaReport() {
  const r = DEMO.report, t = triage();
  const ord = { r: 0, w: 1, v: 2 };
  const arr = [...DEMO.atleti].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);

  const schede = arr.map(a => {
    const s = DEMO.mon[a.id];
    const kpi = [["sedute", `${DEMO.mon[a.id].done.filter(Boolean).length}/${s.settimana.filter(Boolean).length}`],
      ["prontezza", s.prontezza], ["ACWR", s.acwr], ["aderenza", s.aderenza + "%"]];
    const avvisi = s.alert.map(([lv, tx]) => {
      const c = STATO[lv][2];
      return `<div class="avviso" style="background:${lv === 'v' ? 'var(--verde-bg)' : lv === 'w' ? 'var(--giallo-bg)' : 'var(--rosso-bg)'}">
        <span style="color:${c}">${lv === 'v' ? '▲' : '!'}</span><span style="color:${c};font-size:12px">${tx}</span></div>`;
    }).join("");
    const daFare = r.daFare[a.id];
    return `<div class="card">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">
        <span class="dot" style="background:${STATO[s.stato][2]}"></span>
        <h3 style="flex:1">${a.nome}</h3><span class="et">${a.specialita}</span></div>
      <div class="kpi4">${kpi.map(([k, v]) => `<div class="num" style="padding:7px 8px">
        <div class="k">${k}</div><div class="v" style="font-size:15px">${v}</div></div>`).join("")}</div>
      <div style="margin-top:8px">${avvisi}</div>
      ${daFare ? `<p style="font-size:12px;color:var(--txt2);margin-top:8px">→ ${daFare}</p>` : ""}
    </div>`;
  }).join("");

  return `
  <div class="card">
    <h3>Report settimanale</h3>
    <p class="et" style="margin-top:2px">${r.settimana}</p>
  </div>
  <div class="quadri" style="margin-bottom:11px">
    <div class="q"><div class="k">Da vedere subito</div><div class="v" style="color:var(--rosso)">${t.r}</div></div>
    <div class="q"><div class="k">Tieni d'occhio</div><div class="v" style="color:var(--giallo)">${t.w}</div></div>
    <div class="q"><div class="k">In regola</div><div class="v" style="color:var(--verde)">${t.v}</div></div>
  </div>

  <div class="card" style="border-color:rgba(124,194,67,.4)">
    <p class="et" style="margin-bottom:9px;color:var(--verde)">Come sta andando la squadra</p>
    <p style="font-size:13px;margin-bottom:7px"><b>Pista</b> · <span style="color:var(--txt2)">${r.positivo.pista}</span></p>
    <p style="font-size:13px;margin-bottom:10px"><b>Palestra</b> · <span style="color:var(--txt2)">${r.positivo.palestra}</span></p>
    ${r.positivo.wins.map(([n, w]) => `<div style="display:flex;gap:7px;padding:3px 0">
      <span style="color:var(--verde)">▲</span><span style="font-size:13px"><b>${n}</b> <span style="color:var(--txt2)">${w}</span></span></div>`).join("")}
  </div>

  <p class="et" style="margin:14px 2px 8px">Atleti per priorità</p>
  ${schede}`;
}
