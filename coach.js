// Viste dell'allenatore: squadra, dettaglio atleta, calendario squadra, report.

const STATO = {
  v: ["p-verde", "in regola", "var(--verde)"],
  w: ["p-giallo", "attenzione", "var(--giallo)"],
  r: ["p-rosso", "rischio alto", "var(--rosso)"]
};
const TIPO_CELLA = { pista: "pista", palestra: "palestra", gara: "gara", salto: "salto" };

function triage(lista) {
  const c = { v: 0, w: 0, r: 0 };
  (lista || DEMO.atleti).forEach(a => { const s = DEMO.mon[a.id]; if (s) c[s.stato]++; });
  return c;
}

// atleti ordinati per urgenza (rosso, giallo, verde)
function ordinaAtleti() {
  const ord = { r: 0, w: 1, v: 2 };
  return [...DEMO.atleti].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);
}
function colAcwr(v) { const n = parseFloat(v); return n >= 1.5 ? "var(--rosso)" : n >= 1.3 ? "var(--giallo)" : "var(--verde)"; }
function colProntezza(v) { const n = parseFloat(v); return n >= 3.5 ? "var(--verde)" : n >= 2.5 ? "var(--giallo)" : "var(--rosso)"; }
function nomeAtleta(id) { return (DEMO.atleti.find(a => a.id === id) || {}).nome || id; }

// gruppi per disciplina: si toccano per vedere solo gli atleti di quel gruppo
const GRUPPI = [
  ["vel", "Velocisti / Saltatori", ["velocita", "velocità", "salti", "palestra"]],
  ["lanci", "Lanciatori", ["lanci"]],
  ["mezzo", "Mezzofondo / Fondo", ["mezzofondo", "fondo", "mezzofondo/fondo"]]
];
function gruppoDi(a) {
  const d = (a.disciplina || "").toLowerCase();
  const g = GRUPPI.find(x => x[2].includes(d));
  return g ? g[0] : "vel"; // default: velocisti/saltatori (il sistema principale)
}
function nomeGruppo(k) { const g = GRUPPI.find(x => x[0] === k); return g ? g[1] : "Tutti"; }
function atletiDelGruppo(gk) { return DEMO.atleti.filter(a => gruppoDi(a) === gk); }
function setGruppo(gk) { S.gruppo = gk; disegna(); window.scrollTo(0, 0); }
function chipsGruppi() {
  return `<div class="tabbar" style="margin-bottom:11px">${GRUPPI.map(([k, l]) => {
    const n = atletiDelGruppo(k).length;
    return `<button class="${S.gruppo === k ? "on" : ""}" onclick="setGruppo('${k}')">${l}${n ? " · " + n : ""}</button>`;
  }).join("")}</div>`;
}

// ---------- squadra (ingresso coach) ----------
function vistaSquadra() {
  const lista = atletiDelGruppo(S.gruppo);
  const t = triage(lista);
  return `
  ${chipsGruppi()}
  <div class="quadri" style="margin-bottom:11px">
    <div class="q" onclick="vai('report')"><div class="k">Da vedere subito</div>
      <div class="v" style="color:var(--rosso)">${t.r}</div></div>
    <div class="q" onclick="vai('report')"><div class="k">Tieni d'occhio</div>
      <div class="v" style="color:var(--giallo)">${t.w}</div></div>
    <div class="q" onclick="vai('report')"><div class="k">In regola</div>
      <div class="v" style="color:var(--verde)">${t.v}</div></div>
  </div>
  ${listaAtleti(lista)}`;
}

function vistaAtleti() {
  if (S.nuovoAtleta) return vistaNuovoAtleta();
  const lista = atletiDelGruppo(S.gruppo);
  return `<div class="card"><h3>Atleti</h3>
    <p class="et" style="margin-top:2px">${nomeGruppo(S.gruppo)} · ${lista.length} di ${DEMO.atleti.length} · tocca per il cruscotto</p></div>
    ${chipsGruppi()}
    <button class="btn" style="margin-bottom:12px" onclick="apriNuovoAtleta()">＋ Nuovo atleta</button>
    ${listaAtleti(lista)}`;
}

// ---------- nuovo atleta (salva nel database) ----------
function apriNuovoAtleta() { S.nuovoAtleta = { disciplina: "velocita" }; disegna(); window.scrollTo(0, 0); }
function chiudiNuovoAtleta() { S.nuovoAtleta = null; disegna(); window.scrollTo(0, 0); }

const CATEGORIE = ["Cadetti/e", "Allievi/e", "Juniores", "Promesse", "Senior", "SM/SF 35", "SM/SF 40", "SM/SF 45", "SM/SF 50"];
// menu a tendina categoria; mantiene un valore fuori lista se già presente
function selCategoria(cur, onchangeExpr) {
  const extra = cur && !CATEGORIE.includes(cur) ? [cur] : [];
  return `<select onchange="${onchangeExpr}" style="margin-top:6px"><option value="">— scegli —</option>${[...CATEGORIE, ...extra].map(c => `<option ${cur === c ? "selected" : ""}>${c}</option>`).join("")}</select>`;
}
const SPEC_DISC = {
  velocita: ["60 m", "100 m", "200 m", "400 m", "60 hs", "100 hs", "110 hs", "400 hs", "Salto in lungo", "Salto in alto", "Salto triplo", "Salto con l'asta"],
  lanci: ["Peso", "Martello", "Disco", "Giavellotto"],
  mezzofondo: ["500 m", "600 m", "800 m", "1000 m", "1200 m", "1500 m", "2000 m", "2000 siepi", "3000 m", "3000 siepi", "5000 m", "10000 m", "Mezza maratona", "Maratona", "5 km strada/campestre", "10 km strada/campestre"],
  palestra: []
};
function vistaNuovoAtleta() {
  const a = S.nuovoAtleta;
  const disc = [["velocita", "Velocità / Salti"], ["lanci", "Lanci"], ["mezzofondo", "Mezzofondo / Fondo"], ["palestra", "Solo palestra"]];
  const spec = SPEC_DISC[a.disciplina] || [];
  return `<button class="indietro" onclick="chiudiNuovoAtleta()">‹ Indietro</button>
    <div class="card"><h3>Nuovo atleta</h3>
      <p class="et" style="margin-top:2px">Si salva nel database e compare nella squadra.</p></div>
    <div class="card">
      <label class="lab">Nome e cognome</label>
      <input value="${(a.nome || "").replace(/"/g, "&quot;")}" placeholder="Es. Giulia Rossi"
        oninput="S.nuovoAtleta.nome=this.value" style="margin-top:6px">

      <label class="lab" style="display:block;margin-top:12px">Disciplina (gruppo)</label>
      <select onchange="S.nuovoAtleta.disciplina=this.value; S.nuovoAtleta.specialita=''; disegna()" style="margin-top:6px">
        ${disc.map(([k, l]) => `<option value="${k}" ${a.disciplina === k ? "selected" : ""}>${l}</option>`).join("")}
      </select>

      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Specialità</label>
          ${spec.length
            ? `<select onchange="S.nuovoAtleta.specialita=this.value" style="margin-top:6px"><option value="">— scegli —</option>${spec.map(x => `<option ${a.specialita === x ? "selected" : ""}>${x}</option>`).join("")}</select>`
            : `<input value="${(a.specialita || "").replace(/"/g, "&quot;")}" placeholder="—" oninput="S.nuovoAtleta.specialita=this.value" style="margin-top:6px">`}</div>
        <div><label class="lab">Categoria</label>
          ${selCategoria(a.categoria, "S.nuovoAtleta.categoria=this.value")}</div>
      </div>

      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Data di nascita</label>
          <input type="date" value="${a.data_nascita || ""}"
            oninput="S.nuovoAtleta.data_nascita=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Gamba di stacco</label>
          <select onchange="S.nuovoAtleta.gamba_stacco=this.value" style="margin-top:6px">
            <option value="">—</option>
            <option value="Destra" ${a.gamba_stacco === "Destra" ? "selected" : ""}>Destra</option>
            <option value="Sinistra" ${a.gamba_stacco === "Sinistra" ? "selected" : ""}>Sinistra</option>
          </select></div>
      </div>

      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Altezza (cm)</label>
          <input inputmode="numeric" value="${a.altezza_cm || ""}" placeholder="178"
            oninput="S.nuovoAtleta.altezza_cm=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Peso (kg)</label>
          <input inputmode="numeric" value="${a.peso_kg || ""}" placeholder="70"
            oninput="S.nuovoAtleta.peso_kg=this.value" style="margin-top:6px"></div>
      </div>

      <label class="lab" style="display:block;margin-top:12px">Email per l'accesso <span style="color:var(--txt3)">(l'atleta si registrerà con questa)</span></label>
      <input type="email" value="${(a.email || "").replace(/"/g, "&quot;")}" placeholder="atleta@esempio.it"
        oninput="S.nuovoAtleta.email=this.value" style="margin-top:6px">
    </div>
    <button class="btn" onclick="salvaNuovoAtleta()">Salva atleta</button>`;
}

async function salvaNuovoAtleta() {
  const a = S.nuovoAtleta;
  if (!(a.nome || "").trim()) { alert("Scrivi almeno il nome dell'atleta."); return; }
  const btn = document.querySelector(".main .btn"); if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }
  const ok = await creaAtleta({
    nome: a.nome.trim(), disciplina: a.disciplina || "velocita", specialita: (a.specialita || "").trim(),
    email: (a.email || "").trim(),
    categoria: (a.categoria || "").trim(), data_nascita: a.data_nascita || null, gamba_stacco: a.gamba_stacco || "",
    altezza_cm: a.altezza_cm ? Number(a.altezza_cm) : null, peso_kg: a.peso_kg ? Number(a.peso_kg) : null
  });
  if (ok) { S.nuovoAtleta = null; S.vista = "atleti"; disegna(); window.scrollTo(0, 0); }
  else if (btn) { btn.textContent = "Salva atleta"; btn.disabled = false; }
}

function listaAtleti(lista) {
  // ordinati per urgenza: rosso, giallo, verde
  const ord = { r: 0, w: 1, v: 2 };
  const base = lista || DEMO.atleti;
  const arr = [...base].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);
  if (!arr.length) return `<div class="card"><p class="et">Nessun atleta in questo gruppo. Aggiungilo da «Atleti» scegliendo la disciplina.</p></div>`;
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
function apriAtleta(id) { S.atletaSel = id; S.mostraScheda = false; disegna(); window.scrollTo(0, 0); }
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
    <p class="et" style="margin-bottom:6px">Accesso atleta</p>
    ${a.email
      ? `<p style="font-size:14px"><b>${a.email}</b> ${a.haAccesso ? '<span class="pill p-verde">registrato</span>' : '<span class="pill p-giallo">in attesa</span>'}</p>
         <p class="et" style="margin-top:6px">${a.haAccesso ? "L'atleta ha l'accesso attivo." : "Di' all'atleta di aprire l'app → «Sei un atleta? Registrati» e usare questa email."}</p>`
      : `<p class="et">Nessuna email impostata: l'atleta non può ancora accedere.</p>`}
    <button class="btn btn-2" style="margin-top:10px" onclick="cambiaEmailAtleta('${a.id}')">${a.email ? "Cambia email di accesso" : "Imposta email di accesso"}</button>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Apri</p>
    <div class="azioni">
      <button class="btn btn-2" onclick="apriSchedaAtleta()">Scheda: dati, PB, massimali, test</button>
      <button class="btn btn-2" onclick="apriModificaDati('${a.id}')">Modifica dati anagrafici</button>
      <button class="btn btn-2" onclick="apriSeduta('s1')">Seduta di oggi</button>
      <button class="btn btn-2" onclick="vai('pista')">Programma</button>
      <button class="btn btn-2" onclick="vai('diario-c')">Diario</button>
      <button class="btn btn-2" onclick="vai('presenze')">Presenze</button>
    </div>
  </div>

  <button class="btn btn-2" style="color:var(--rosso);border-color:rgba(255,107,107,.4)" onclick="eliminaAtletaUI('${a.id}')">🗑 Elimina atleta</button>`;
}
async function eliminaAtletaUI(id) {
  const a = DEMO.atleti.find(x => x.id === id);
  if (!confirm(`Eliminare ${a ? a.nome : "l'atleta"} e tutti i suoi dati (PB, massimali, test, infortuni)? Non è reversibile.`)) return;
  if (typeof eliminaAtleta === "function") { const ok = await eliminaAtleta(id); if (ok) { S.atletaSel = null; S.vista = "atleti"; disegna(); window.scrollTo(0, 0); } }
}
async function cambiaEmailAtleta(id) {
  const a = DEMO.atleti.find(x => x.id === id);
  const em = prompt("Email di accesso dell'atleta (la userà per registrarsi):", (a && a.email) || "");
  if (em === null) return;
  if (typeof impostaEmailAtleta === "function") { const ok = await impostaEmailAtleta(id, em); if (ok) disegna(); }
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
  const lista = atletiDelGruppo(S.gruppo);
  const r = DEMO.report, t = triage(lista);
  const ord = { r: 0, w: 1, v: 2 };
  const arr = [...lista].sort((a, b) => ord[DEMO.mon[a.id].stato] - ord[DEMO.mon[b.id].stato]);

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
    <p class="et" style="margin-top:2px">${nomeGruppo(S.gruppo)} · ${r.settimana}</p>
  </div>
  ${chipsGruppi()}
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

// ---------- monitoraggio: carico e forma ----------
function vistaCarico() {
  const righe = ordinaAtleti().map(a => {
    const s = DEMO.mon[a.id];
    return `<div class="card">
      <div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
        <span class="dot" style="background:${STATO[s.stato][2]}"></span>
        <h3 style="flex:1">${a.nome}</h3><span class="et">${a.specialita}</span></div>
      <div class="quadri">
        <div class="q"><div class="k">ACWR</div><div class="v" style="color:${colAcwr(s.acwr)}">${s.acwr}</div></div>
        <div class="q"><div class="k">Forma (TSB)</div>
          <div class="v" style="color:${parseFloat(s.forma) >= 0 ? 'var(--verde)' : 'var(--giallo)'}">${s.forma}</div></div>
        <div class="q"><div class="k">Prontezza</div><div class="v" style="color:${colProntezza(s.prontezza)}">${s.prontezza}</div></div>
      </div></div>`;
  }).join("");
  return `<div class="card"><h3>Carico e forma</h3>
    <p class="et" style="margin-top:2px">ACWR, freschezza (TSB) e prontezza di ogni atleta ·
      <button class="link-indietro" onclick="vai('aiuto')">cosa vogliono dire ›</button></p></div>
    ${righe}`;
}

// ---------- monitoraggio: infortuni e prevenzione ----------
const ZONE_INF = ["Ischiocrurali", "Polpaccio", "Adduttori", "Quadricipite", "Flessori anca", "Schiena/lombare", "Ginocchio", "Caviglia", "Tendine Achille", "Piede", "Spalla", "Altro"];
const TIPO_INF = ["Muscolare", "Tendineo", "Articolare", "Osseo", "Altro"];
const LATO_INF = ["Dx", "Sx", "Bilaterale"];
const STATO_INF = ["Attivo", "In recupero", "Risolto"];
function pillStato(s) { return s === "Risolto" ? "p-verde" : s === "In recupero" ? "p-giallo" : "p-rosso"; }
function giorniTra(aISO, bISO) { if (!aISO || !bISO) return null; const d = (new Date(bISO) - new Date(aISO)) / 86400000; return isNaN(d) ? null : Math.round(d); }
function durataInf(inf) {
  const oggi = new Date().toISOString().slice(0, 10);
  if (inf.dataRientro) { const g = giorniTra(inf.dataInizio, inf.dataRientro); return g != null ? `${g} gg` : ""; }
  if (inf.dataInizio) { const g = giorniTra(inf.dataInizio, oggi); return g != null ? `${g} gg (in corso)` : ""; }
  return "";
}

function vistaInfortuni() {
  const righe = (DEMO.infortuni || []).map(inf => {
    const meta = [inf.lato, inf.tipo, inf.gravita ? "gravità " + inf.gravita + "/5" : "", durataInf(inf)].filter(Boolean).join(" · ");
    const dataTxt = inf.dataInizio ? (typeof fmtData === "function" ? fmtData(inf.dataInizio) : inf.dataInizio) : (inf.dal || "");
    return `<div class="card" style="border-color:rgba(240,168,60,.45)">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h3>${nomeAtleta(inf.atleta)}</h3><span class="pill ${pillStato(inf.stato)}">${inf.stato || "Attivo"}</span></div>
      <p style="font-weight:500;margin-top:6px">${inf.zona}${inf.lato ? " " + inf.lato : ""} <span class="et">· dal ${dataTxt}</span></p>
      ${meta ? `<p class="et" style="margin-top:2px">${meta}</p>` : ""}
      ${inf.nota ? `<p style="font-size:14px;line-height:1.6;color:var(--txt2);margin-top:6px">${inf.nota}</p>` : ""}
      <div style="display:flex;gap:8px;margin-top:11px">
        ${inf.stato !== "Risolto" ? `<button class="btn-2" style="flex:1;padding:9px" onclick="risolviInfortunio('${inf.id}')">Segna risolto</button>` : ""}
        <button class="btn-2" style="flex:1;padding:9px;color:var(--rosso)" onclick="eliminaInfortunioUI('${inf.id}')">Elimina</button>
      </div></div>`;
  }).join("");
  return `<div class="card"><h3>Infortuni e prevenzione</h3>
    <p class="et" style="margin-top:2px">Registro infortuni e fastidi: segnala, aggiorna lo stato, tieni la durata.</p></div>
    <button class="btn" style="margin-bottom:12px" onclick="apriInfortunio('','infortuni')">＋ Segnala infortunio</button>
    ${righe || `<div class="card"><p class="et">Nessun infortunio segnalato. 💪</p></div>`}`;
}

function apriInfortunio(atletaId, from) {
  S.infortunio = { atletaId: atletaId || "", from: from || "infortuni", zona: "", lato: "", tipo: "", gravita: "", stato: "Attivo", dataInizio: new Date().toISOString().slice(0, 10), dataRientro: "", nota: "" };
  disegna(); window.scrollTo(0, 0);
}
function chiudiInfortunio() { const f = S.infortunio && S.infortunio.from; S.infortunio = null; if (f && f !== "seduta") S.vista = f; disegna(); window.scrollTo(0, 0); }

function vistaInfortunioForm() {
  const f = S.infortunio;
  const sel = (arr, cur, campo) => `<select onchange="S.infortunio.${campo}=this.value" style="margin-top:6px"><option value="">—</option>${arr.map(z => `<option ${String(cur) === String(z) ? "selected" : ""}>${z}</option>`).join("")}</select>`;
  return `<button class="indietro" onclick="chiudiInfortunio()">‹ Indietro</button>
    <div class="card"><h3>Segnala infortunio</h3>
      <p class="et" style="margin-top:2px">Si salva nel registro infortuni dell'atleta.</p></div>
    <div class="card">
      <label class="lab">Atleta</label>
      <select onchange="S.infortunio.atletaId=this.value" style="margin-top:6px">
        <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${f.atletaId === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Zona</label>${sel(ZONE_INF, f.zona, "zona")}</div>
        <div><label class="lab">Lato</label>${sel(LATO_INF, f.lato, "lato")}</div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Tipo</label>${sel(TIPO_INF, f.tipo, "tipo")}</div>
        <div><label class="lab">Gravità (1-5)</label>${sel([1, 2, 3, 4, 5], f.gravita, "gravita")}</div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Data inizio</label>
          <input type="date" value="${f.dataInizio || ""}" oninput="S.infortunio.dataInizio=this.value" style="margin-top:6px"></div>
        <div><label class="lab">Rientro (prev./eff.)</label>
          <input type="date" value="${f.dataRientro || ""}" oninput="S.infortunio.dataRientro=this.value" style="margin-top:6px"></div>
      </div>
      <label class="lab" style="display:block;margin-top:12px">Stato</label>
      <select onchange="S.infortunio.stato=this.value" style="margin-top:6px">${STATO_INF.map(z => `<option ${f.stato === z ? "selected" : ""}>${z}</option>`).join("")}</select>
      <label class="lab" style="display:block;margin-top:12px">Causa / cosa fare</label>
      <textarea rows="3" oninput="S.infortunio.nota=this.value" placeholder="Come è successo, indicazioni, cosa fare…" style="margin-top:6px;width:100%">${(f.nota || "").replace(/</g, "&lt;")}</textarea>
    </div>
    <button class="btn" onclick="salvaInfortunio()">Salva nel registro</button>`;
}

async function salvaInfortunio() {
  const f = S.infortunio;
  if (!f.atletaId) { alert("Scegli l'atleta."); return; }
  if (!f.zona) { alert("Scegli la zona."); return; }
  const btn = document.querySelector(".main .btn"); if (btn) { btn.textContent = "Salvataggio…"; btn.disabled = true; }
  const ok = await creaInfortunio(f.atletaId, {
    zona: f.zona, lato: f.lato || null, tipo: f.tipo || null, gravita: f.gravita ? Number(f.gravita) : null,
    stato: f.stato || "Attivo", dataInizio: f.dataInizio || null, dataRientro: f.dataRientro || null, nota: (f.nota || "").trim() || null
  });
  if (ok) { const from = f.from; S.infortunio = null; if (from !== "seduta") S.vista = "infortuni"; disegna(); window.scrollTo(0, 0); }
  else if (btn) { btn.textContent = "Salva nel registro"; btn.disabled = false; }
}

async function risolviInfortunio(id) {
  const inf = (DEMO.infortuni || []).find(x => String(x.id) === String(id));
  if (!inf) return;
  const oggi = new Date().toISOString().slice(0, 10);
  if (typeof aggiornaInfortunio === "function") await aggiornaInfortunio(id, { stato: "Risolto", data_rientro: oggi, aperto: false });
  inf.stato = "Risolto"; if (!inf.dataRientro) inf.dataRientro = oggi;
  disegna();
}
async function eliminaInfortunioUI(id) {
  if (!confirm("Eliminare questo infortunio dal registro?")) return;
  if (typeof eliminaInfortunio === "function") await eliminaInfortunio(id);
  DEMO.infortuni = (DEMO.infortuni || []).filter(x => String(x.id) !== String(id));
  disegna();
}

// ---------- monitoraggio: PREVENZIONE (test asimmetrie dx/sx = Limb Symmetry Index) ----------
const PREV_TESTS = [
  { k: "ktw", nome: "Caviglia KTW (dorsiflessione)", unita: "cm" },
  { k: "ake", nome: "Hamstring AKE", unita: "°" },
  { k: "hip", nome: "Rotazione interna anca", unita: "°" },
  { k: "hop", nome: "Salto monopodalico", unita: "cm" }
];
const PREV_ESERCIZI = [
  ["Nordic hamstring", "ischiocrurali · −~50% infortuni", "nordic+hamstring+curl"],
  ["Copenhagen adduction", "adduttori / inguine", "copenhagen+adduction+exercise"],
  ["Calf raise eccentrico", "polpaccio / Achille", "eccentric+calf+raise"],
  ["Core anti-rotazione (Pallof press)", "core", "pallof+press"]
];
// cosa fare quando il test è oltre soglia (per lavorare sul lato debole)
const PREV_NOTE = {
  ktw: "Mobilità caviglia (knee-to-wall, sblocco tibio-tarsica) e soft tissue polpaccio/soleo sul lato rigido, poi rinforzo caviglia. Ricontrolla.",
  ake: "Estensibilità + forza eccentrica ischiocrurali sul lato corto (Nordic mirato, hip hinge) e attivazione prima di correre.",
  hip: "Mobilità anca sul lato limitato (rotazioni interne, 90/90, stretch glutei/piriforme) e controllo del bacino; rivaluta a 4-6 settimane.",
  hop: "Forza e potenza monopodalica sul lato debole (split squat, step-up, progressione di balzi) finché la simmetria torna sotto il 10%."
};
// esempio pre-compilato su Leonardo (at1): 2 ok, 1 attenzione, 1 bandiera
let prevState = { atletaRif: "at1", val: {
  ktw: { dx: "11", sx: "10" }, ake: { dx: "72", sx: "68" },
  hip: { dx: "38", sx: "30" }, hop: { dx: "185", sx: "165" }
} };
function setPrevAtleta(id) { prevState.atletaRif = id; disegna(); }
function setPrevVal(k, lato, v) { prevState.val[k][lato] = v; }
function prevAsym(k) {
  const d = parseFloat(String(prevState.val[k].dx).replace(",", "."));
  const s = parseFloat(String(prevState.val[k].sx).replace(",", "."));
  if (isNaN(d) || isNaN(s) || d <= 0 || s <= 0) return null;
  return Math.abs(d - s) / Math.max(d, s) * 100;
}
function prevColor(a) { return a == null ? "var(--txt3)" : a > 15 ? "var(--rosso)" : a >= 10 ? "var(--giallo)" : "var(--verde)"; }
function prevFlag(a) { return a == null ? "—" : a > 15 ? "🔴 asimmetria" : a >= 10 ? "🟡 attenzione" : "🟢 ok"; }

function vistaPrevenzione() {
  const atl = DEMO.atleti.find(x => x.id === prevState.atletaRif);
  const righe = PREV_TESTS.map(t => {
    const a = atl ? prevAsym(t.k) : null;
    return `<tr>
      <td style="text-align:left">${t.nome}<br><span class="et">${t.unita}</span></td>
      <td><input inputmode="decimal" value="${prevState.val[t.k].dx}" placeholder="dx" oninput="setPrevVal('${t.k}','dx',this.value)" onchange="disegna()" style="min-width:50px"></td>
      <td><input inputmode="decimal" value="${prevState.val[t.k].sx}" placeholder="sx" oninput="setPrevVal('${t.k}','sx',this.value)" onchange="disegna()" style="min-width:50px"></td>
      <td class="pauto" style="color:${prevColor(a)};font-weight:600">${a != null ? a.toFixed(1) + "%" : "—"}</td>
      <td style="color:${prevColor(a)};white-space:nowrap">${prevFlag(a)}</td>
    </tr>`;
  }).join("");
  const flags = atl ? PREV_TESTS.map(t => prevAsym(t.k)).filter(a => a != null) : [];
  const nRosse = flags.filter(a => a > 15).length, nGialle = flags.filter(a => a >= 10 && a <= 15).length;
  const stato = !flags.length ? "" : nRosse ? `🔴 ${nRosse} asimmetria da correggere` : nGialle ? `🟡 ${nGialle} da tenere d'occhio` : "🟢 simmetria nella norma";

  return `
  <div class="card"><h3>Prevenzione — test asimmetrie</h3>
    <p class="et" style="margin-top:2px">Confronto destra/sinistra (Limb Symmetry Index). Per ogni test inserisci dx e sx: la % di asimmetria si calcola da sola. Rif.: &gt;15% 🔴 bandiera · 10–15% 🟡 attenzione · &lt;10% 🟢 ok.</p></div>

  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setPrevAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${prevState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
  </div>

  <div class="card">
    <div class="p-scroll"><table class="ptab pista-w">
      <thead><tr><th style="text-align:left">Test</th><th>Dx</th><th>Sx</th><th>Asimm.</th><th>Esito</th></tr></thead>
      <tbody>${righe}</tbody>
    </table></div>
    ${stato ? `<p style="margin-top:12px;font-weight:600">${stato}</p>` : ""}
    <p class="et" style="margin-top:6px">Misura KTW e salto in cm, AKE e rotazione anca in gradi. Ricontrolla ogni ~8 settimane e confronta.</p>
    ${atl && flags.length ? `<button class="btn btn-2" style="margin-top:12px" onclick="salvaPrevenzione()">💾 Salva il test</button>` : (atl ? `<p class="et" style="margin-top:8px">Inserisci i test (dx e sx) per salvarli.</p>` : "")}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Come si eseguono i test (video)</p>
    ${typeof TEST_COME !== "undefined" ? [0, 1, 2, 5].map(i => { const t = TEST_COME[i]; if (!t) return ""; return `<div class="lib-row" onclick="apriTestVideo(${i})"><div style="flex:1;min-width:0"><div style="font-weight:500">${t[0]}</div><div class="et" style="margin-top:2px;white-space:normal;line-height:1.4">${t[1].length > 80 ? t[1].slice(0, 80) + "…" : t[1]}</div></div><span class="vid-ic">▶</span><span class="freccia">›</span></div>`; }).join("") : ""}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Cosa fare</p>
    ${(() => {
      const daFare = atl ? PREV_TESTS.filter(t => { const a = prevAsym(t.k); return a != null && a >= 10; }) : [];
      return daFare.length
        ? daFare.map(t => { const a = prevAsym(t.k); return `<div style="margin-bottom:10px">
            <b style="font-size:14px;color:${prevColor(a)}">${t.nome} · ${a.toFixed(1)}%</b>
            <p style="font-size:14px;line-height:1.6;color:var(--txt2);margin-top:2px">${PREV_NOTE[t.k]}</p></div>`; }).join("")
        : `<p class="et">Nessuna asimmetria oltre il 10%: mantieni la prevenzione di base (Nordic, Copenhagen, calf, core 2×/sett).</p>`;
    })()}
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:8px">Rientro graduale &amp; prehab</p>
    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.65;color:var(--txt2)">
      <li>Rientro solo a <b>dolore assente</b>, forza ~90% del lato sano e gesto tecnico pulito. Carico in progressione, non di colpo.</li>
      <li>Dopo uno stop riparti con volume/intensità bassi (lo Scarico nel Piano &amp; Picco aiuta) e ricontrolla le asimmetrie.</li>
      <li>Prevenzione di base <b>2×/sett</b> nelle zone a rischio del velocista: ischiocrurali, adduttori, polpaccio, core.</li>
    </ul>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:10px">Esercizi di prevenzione</p>
    ${PREV_ESERCIZI.map(([n, d, q]) => `<div class="lib-row">
      <div style="flex:1"><b style="font-size:14px">${n}</b><div class="et" style="margin:2px 0 0">${d}</div></div>
      <a class="vid-ic" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">cerca ▶</a>
    </div>`).join("")}
    <p class="et" style="margin-top:10px">Rif.: ACWR (Gabbett) 0.8–1.3 · asimmetria &gt;10–15% = bandiera (Limb Symmetry Index) · Nordic hamstring (meta-analisi van Dyk / Al Attar).</p>
  </div>
  ${atl && typeof bloccoSessioni === "function" ? bloccoSessioni(atl.id, "prevenzione", "Test di prevenzione salvati") : ""}`;
}
function salvaPrevenzione() {
  const a = DEMO.atleti.find(x => x.id === prevState.atletaRif);
  if (!a) { alert("Scegli un atleta."); return; }
  const dati = {}; let n = 0;
  PREV_TESTS.forEach(t => { const asym = prevAsym(t.k); if (asym != null) { dati[t.k] = { dx: prevState.val[t.k].dx, sx: prevState.val[t.k].sx, asym }; n++; } });
  if (!n) { alert("Inserisci almeno un test (dx e sx)."); return; }
  if (typeof salvaSessione === "function") salvaSessione(a.id, "prevenzione", dati);
  alert(`Test di prevenzione salvato per ${a.nome}.`); disegna();
}

// ---------- monitoraggio: presenze squadra ----------
function vistaPresenzeCoach() {
  const righe = ordinaAtleti().map(a => {
    const stag = Math.round(a.presenzeStagione[0] / a.presenzeStagione[1] * 100);
    const col = stag >= 85 ? "var(--verde)" : stag >= 70 ? "var(--giallo)" : "var(--rosso)";
    return `<div class="card riga-a">
      <div style="flex:1;min-width:0"><h3>${a.nome}</h3>
        <p class="et" style="margin-top:2px">mese ${a.presenzeMese[0]}/${a.presenzeMese[1]} · stagione ${a.presenzeStagione[0]}/${a.presenzeStagione[1]}</p></div>
      <b style="font-size:18px;color:${col}">${stag}%</b></div>`;
  }).join("");
  return `<div class="card"><h3>Presenze squadra</h3>
    <p class="et" style="margin-top:2px">Aderenza di ogni atleta (fatti su programmati)</p></div>
    ${righe}`;
}

// ---------- monitoraggio: diario squadra ----------
function vistaDiarioCoach() {
  const righe = ordinaAtleti().map(a => {
    const d = DEMO.diariCoach[a.id] || {};
    const pr = d.prontezza || DEMO.mon[a.id].prontezza;
    const stato = d.compilato
      ? `compilato ${d.ultimo}`
      : `<span style="color:var(--rosso)">non compilato da ${d.ultimo}</span>`;
    return `<div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1;min-width:0"><h3>${a.nome}</h3>
          <p class="et" style="margin-top:2px">${stato}</p></div>
        <div style="text-align:right"><div class="et">prontezza</div>
          <b style="font-size:18px;color:${colProntezza(pr)}">${pr}</b></div></div>
      ${d.compilato && (d.sonno || d.nota) ? `<p class="et" style="margin-top:8px">${d.sonno ? "sonno " + d.sonno + " h" : ""}${d.sonno && d.nota ? " · " : ""}${d.nota || ""}</p>` : ""}
    </div>`;
  }).join("");
  return `<div class="card"><h3>Diario squadra</h3>
    <p class="et" style="margin-top:2px">Prontezza e ultimo diario di ogni atleta</p></div>
    ${righe}`;
}

// ---------- monitoraggio: SCREENING (performance + carico) settimana / mesociclo ----------
let screeningState = { atletaRif: "" };
function setScreeningAtleta(id) { screeningState.atletaRif = id; disegna(); window.scrollTo(0, 0); }

function bloccoScreening(atletaId, giorni, titolo) {
  const oggiISO = new Date().toISOString().slice(0, 10);
  const dalISO = new Date(Date.now() - giorni * 86400000).toISOString().slice(0, 10);
  const inWin = d => d && d >= dalISO && d <= oggiISO;
  const pista = (DEMO.pistaLog || []).filter(l => l.atletaId === atletaId && inWin(l.data));
  const pistaPrima = (DEMO.pistaLog || []).filter(l => l.atletaId === atletaId && l.data < dalISO);
  const vbt = (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId && l.vbtEseguita != null && inWin(l.data));
  const vbtPrima = (DEMO.vbtLog || []).filter(l => l.atletaId === atletaId && l.vbtEseguita != null && l.data < dalISO);
  const gare = (DEMO.risultatiGara || []).filter(r => r.atletaId === atletaId && inWin(r.data));

  const sedute = new Set([...pista.map(x => x.data), ...vbt.map(x => x.data)]).size;
  const volume = pista.reduce((s, x) => s + (x.volume || 0), 0);
  const dist = [...new Set(pista.map(x => x.distanza))].sort((a, b) => a - b);
  let mig = 0, peg = 0;
  const righeTempi = dist.map(d => {
    const win = pista.filter(x => x.distanza === d).map(x => x.tempo).filter(t => t > 0);
    const prima = pistaPrima.filter(x => x.distanza === d).map(x => x.tempo).filter(t => t > 0);
    const best = win.length ? Math.min(...win) : null, bestPrima = prima.length ? Math.min(...prima) : null;
    const delta = (best != null && bestPrima != null) ? best - bestPrima : null;
    if (delta != null) { if (delta < 0) mig++; else if (delta > 0) peg++; }
    const col = delta == null ? "var(--txt3)" : delta < 0 ? "var(--verde)" : delta > 0 ? "var(--rosso)" : "var(--txt2)";
    return `<tr><td>${d} m</td><td class="pauto">${best != null ? best.toFixed(2) : "—"}</td><td style="color:${col}">${delta != null ? (delta > 0 ? "+" : "") + delta.toFixed(2) : "—"}</td></tr>`;
  }).join("");
  const vMedia = vbt.length ? vbt.reduce((s, x) => s + x.vbtEseguita, 0) / vbt.length : null;
  const vPrima = vbtPrima.length ? vbtPrima.reduce((s, x) => s + x.vbtEseguita, 0) / vbtPrima.length : null;
  const dVbt = (vMedia != null && vPrima != null) ? vMedia - vPrima : null;
  const m = (DEMO.mon || {})[atletaId] || {};

  const perf = sedute === 0 ? "🕓 nessun dato nel periodo"
    : mig > peg ? "🟢 tempi in miglioramento" : peg > mig ? "🔴 tempi in calo" : "🟡 tempi stabili";
  const caricoTxt = m.acwr ? `ACWR ${m.acwr} · forma ${m.forma || "—"} · prontezza ${m.prontezza || "—"}` : "—";

  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <p class="et" style="margin:0">${titolo}</p><span class="et">ultimi ${giorni} giorni</span></div>
    <div style="display:flex;gap:8px;margin:12px 0 4px">
      ${[["Sedute", sedute], ["Volume pista", volume ? (volume >= 1000 ? (volume / 1000).toFixed(1) + " km" : volume + " m") : "—"], ["VBT media", vMedia != null ? vMedia.toFixed(2) : "—"], ["Gare", gare.length]]
        .map(([l, v]) => `<div style="flex:1;background:var(--card2);border-radius:12px;padding:10px 4px;text-align:center"><p class="et" style="margin:0 0 2px">${l}</p><b style="font-size:16px">${v}</b></div>`).join("")}
    </div>
    ${dist.length ? `<p class="et" style="margin:10px 0 4px">Tempi per distanza (best · variazione vs prima)</p>
      <table class="ptab" style="min-width:0"><thead><tr><th>Distanza</th><th>Best</th><th>Δ</th></tr></thead><tbody>${righeTempi}</tbody></table>` : ""}
    ${gare.length ? `<p class="et" style="margin:10px 0 4px">🏁 Gare nel periodo</p>
      <table class="ptab" style="min-width:0"><thead><tr><th>Data</th><th>Prova</th><th>Tempo</th><th>Pos.</th></tr></thead>
      <tbody>${gare.slice().sort((a, b) => (a.data < b.data ? 1 : -1)).map(g => `<tr><td>${typeof fmtDataAnno === "function" ? fmtDataAnno(g.data) : g.data}</td><td>${g.distanza}${g.gara ? " · " + g.gara : ""}</td><td class="pauto">${g.tempo}</td><td>${g.posizione || "—"}</td></tr>`).join("")}</tbody></table>` : ""}
    <p style="margin-top:12px;font-weight:600">${perf}${dVbt != null ? ` · VBT ${dVbt >= 0 ? "+" : ""}${dVbt.toFixed(2)} m/s` : ""}</p>
    <p class="et" style="margin-top:6px">Carico: <b style="color:${typeof colAcwr === "function" && m.acwr ? colAcwr(m.acwr) : "var(--txt2)"}">${caricoTxt}</b></p>
    ${m.alert && m.alert.length ? `<p class="et" style="margin-top:4px">${m.alert.map(a => a[1]).join(" · ")}</p>` : ""}
  </div>`;
}

function vistaScreening() {
  const atl = DEMO.atleti.find(x => x.id === screeningState.atletaRif);
  return `
  <div class="card"><h3>Screening</h3>
    <p class="et" style="margin-top:2px">Come sta andando l'atleta: tempi e ripetute (performance) + carico e freschezza, sulla settimana e sul mesociclo.</p></div>
  <div class="card">
    <label class="lab">Atleta</label>
    <select onchange="setScreeningAtleta(this.value)" style="margin-top:6px">
      <option value="">— scegli —</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${screeningState.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
  </div>
  ${atl ? `<p class="sez">Settimana</p>${bloccoScreening(atl.id, 7, "Questa settimana")}
    <p class="sez">Mesociclo</p>${bloccoScreening(atl.id, 28, "Ultime 4 settimane")}`
    : `<div class="card"><p class="et">Scegli un atleta per vedere lo screening.</p></div>`}`;
}
