// Diario giornaliero dell'atleta.
// Nota: la prontezza si calcola sempre, ma all'atleta NON si mostra
// (se la vedesse potrebbe aggiustare le risposte). La vede l'allenatore.

function prontezza(d) {
  const v = CONFIG.diario.voci.map(x => d[x.id]).filter(x => x !== null);
  if (v.length < CONFIG.diario.voci.length) return null;
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function statoProntezza(p) {
  if (p === null) return ["", "non compilata"];
  if (p < CONFIG.soglie.prontezzaBassa) return ["r", "Prontezza bassa"];
  if (p < 3.5) return ["w", "Sotto tono"];
  return ["v", "Via libera"];
}

function diarioCompleto(d) { return prontezza(d) !== null; }

function vistaDiario() {
  const d = DEMO.diarioOggi;

  const scale = CONFIG.diario.voci.map(v => `
    <div style="margin-bottom:15px">
      <div class="lab">${v.label}</div>
      <div class="scala">
        ${[1, 2, 3, 4, 5].map(i => `<button class="sc ${d[v.id] === i ? "on" : ""}"
            onclick="segnaDiario('${v.id}',${i})">${i}</button>`).join("")}
      </div>
      <div class="estremi"><span>1 · ${v.basso}</span><span>5 · ${v.alto}</span></div>
    </div>`).join("");

  return `
  <div class="card">
    <p class="et">Ore di sonno</p>
    <div class="ore">
      <button class="tondo" onclick="cambiaOre(-0.5)" aria-label="Meno">−</button>
      <div class="ore-v">${d.oreSonno.toFixed(1)} <span>h</span></div>
      <button class="tondo" onclick="cambiaOre(0.5)" aria-label="Più">+</button>
    </div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:13px">Come stai oggi — rispondi di pancia, senza pensarci troppo</p>
    ${scale}
  </div>

  <div class="card">
    <div class="griglia2">
      <div><div class="lab">Peso (kg)</div>
        <input inputmode="decimal" value="${d.peso ?? ""}" placeholder="es. 72.4"
          onchange="segnaDiario('peso',this.value)"></div>
      <div><div class="lab">Ciclo mestruale</div>
        <button class="btn ${d.ciclo ? "" : "btn-2"}" style="padding:11px"
          onclick="segnaDiario('ciclo',${!d.ciclo})">${d.ciclo ? "Segnato ✓" : "Segna"}</button></div>
    </div>
  </div>

  <div class="card">
    <p class="et" style="margin-bottom:9px">Hai fastidi o dolori?</p>
    <div style="display:flex;gap:8px">
      <button class="btn ${d.fastidi ? "btn-2" : ""}" onclick="segnaDiario('fastidi',false)">No</button>
      <button class="btn ${d.fastidi ? "" : "btn-2"}" onclick="segnaDiario('fastidi',true)">Sì</button>
    </div>
    ${d.fastidi ? `<div style="margin-top:11px"><div class="lab">Dove</div>
      <input value="${d.doveFastidi}" placeholder="es. ischiocrurale destro"
        onchange="segnaDiario('doveFastidi',this.value)"></div>` : ""}
  </div>

  <div class="card">
    <div class="lab">Note per l'allenatore</div>
    <textarea rows="2" placeholder="gambe pesanti, poco riposo…"
      onchange="segnaDiario('note',this.value)">${d.note}</textarea>
  </div>

  ${d.salvato ? `<div class="card fatto">
      <p style="font-size:15px">Diario salvato ✓</p>
      <p class="et" style="margin-top:4px">Grazie — l'allenatore lo vede subito.</p>
    </div>`
    : `<button class="btn" style="margin-bottom:14px" onclick="salvaDiario()">Salva il diario</button>`}`;
}

function segnaDiario(campo, val) {
  const d = DEMO.diarioOggi;
  if (campo === "peso") { const n = parseFloat(String(val).replace(",", ".")); d.peso = isNaN(n) ? null : n; }
  else d[campo] = val;
  d.salvato = false;
  disegna();
}
function cambiaOre(x) {
  const d = DEMO.diarioOggi;
  d.oreSonno = Math.min(12, Math.max(3, d.oreSonno + x));
  d.salvato = false; disegna();
}
function salvaDiario() {
  const d = DEMO.diarioOggi;
  if (!diarioCompleto(d)) { alert("Rispondi a tutte e quattro le domande prima di salvare."); return; }
  d.salvato = true; disegna();
}
