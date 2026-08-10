// Programma PALESTRA — editor delle sedute in sala (fedele al foglio Excel).
// Mesociclo → 3 giorni → N settimane (dal ciclo). Il coach scrive esercizio/serie/rep/%1RM/rec/TUT/VBT target;
// il PESO esce da solo dai massimali dell'atleta (peso = %1RM/100 × 1RM), volume(kg) = serie × rep × peso.
// Riusa dal file pista.js: pistaCicliPiano, cicloDaLen, isoLocale, nSettimaneMeso, isScaricoIdx.

function palRigaVuota() { return { esercizio: "", serie: "", rep: "", perc: "", rec: "", tut: "", vbt: "", peso: "" }; }
function palSettVuota() { return { righe: [palRigaVuota()], nota: "" }; }
function palGiornoVuoto() { return { giornoSett: "", settimane: [palSettVuota(), palSettVuota(), palSettVuota(), palSettVuota()] }; }
function palMesoVuoto() { return { ciclo: "", blocco: "", inizio: "", focus: "", giorni: [palGiornoVuoto(), palGiornoVuoto(), palGiornoVuoto()] }; }

function palestraInit() {
  if (!DEMO.palestra || !DEMO.palestra.mesocicli) DEMO.palestra = { atletaRif: "", mesocicli: [palMesoVuoto()] };
  return DEMO.palestra;
}
function savePalestra() { if (typeof salvaCustom === "function") salvaCustom(); }
function palGiornoCorrente() { return palestraInit().mesocicli[S.palMeso].giorni[S.palGiorno]; }

// massimale dell'atleta di riferimento per un esercizio (dalla scheda)
function massimaleDi(esercizio) {
  const p = palestraInit();
  if (!p.atletaRif || !esercizio) return null;
  const a = DEMO.atleti.find(x => x.id === p.atletaRif);
  if (!a || !a.scheda) return null;
  const rows = (a.scheda.massimali || []).filter(m => m[0] === esercizio && m[1] != null);
  if (!rows.length) return null;
  // usa il massimale PIÙ RECENTE (data ISO in fondo alla riga): dopo un test i pesi si ricalibrano da soli
  rows.sort((x, y) => (x[5] || "") < (y[5] || "") ? -1 : (x[5] || "") > (y[5] || "") ? 1 : 0);
  return Number(rows[rows.length - 1][1]);
}
function palPeso(r) {
  const rm = massimaleDi(r.esercizio);
  if (rm != null && r.perc) return Math.round(rm * Number(r.perc) / 100);   // dal massimale
  const man = parseFloat(String(r.peso).replace(",", "."));
  return isNaN(man) ? null : man;                                            // manuale (accessori senza massimale)
}
function volumePalSett(sett) {
  return (sett.righe || []).reduce((t, r) => { const w = palPeso(r); return t + (Number(r.serie) || 0) * (Number(r.rep) || 0) * (w || 0); }, 0);
}
function palSettimaneDelGiorno(m, g) {
  const n = nSettimaneMeso(m);
  while (g.settimane.length < n) g.settimane.push(palSettVuota());
  g.settimane.forEach(s => { if (s.nota === undefined) s.nota = ""; });
  return g.settimane.slice(0, n);
}

// ---------- handlers ----------
function setPalTop(campo, val) { const p = palestraInit(); p[campo] = val; savePalestra(); disegna(); }
function setPalMeso(campo, val) { palestraInit().mesocicli[S.palMeso][campo] = val; savePalestra(); disegna(); }
function setPalMesoVal(campo, val) { palestraInit().mesocicli[S.palMeso][campo] = val; savePalestra(); }
function setPalGiorno(campo, val) { palestraInit().mesocicli[S.palMeso].giorni[S.palGiorno][campo] = val; savePalestra(); disegna(); }
function setPalRiga(s, i, campo, val) { palestraInit().mesocicli[S.palMeso].giorni[S.palGiorno].settimane[s].righe[i][campo] = val; savePalestra(); disegna(); }
function setPalRigaVal(s, i, campo, val) { palestraInit().mesocicli[S.palMeso].giorni[S.palGiorno].settimane[s].righe[i][campo] = val; savePalestra(); }
function palAddRiga(s) { palestraInit().mesocicli[S.palMeso].giorni[S.palGiorno].settimane[s].righe.push(palRigaVuota()); savePalestra(); disegna(); }
function palDelRiga(s, i) { const r = palestraInit().mesocicli[S.palMeso].giorni[S.palGiorno].settimane[s].righe; if (r.length > 1) r.splice(i, 1); savePalestra(); disegna(); }
function palAddMeso() { palestraInit().mesocicli.push(palMesoVuoto()); S.palMeso = palestraInit().mesocicli.length - 1; S.palGiorno = 0; savePalestra(); disegna(); window.scrollTo(0, 0); }
function selPalMeso(i) { S.palMeso = i; S.palGiorno = 0; disegna(); window.scrollTo(0, 0); }
function selPalGiorno(i) { S.palGiorno = i; disegna(); window.scrollTo(0, 0); }

function setPalMesoDaPiano(idx) {
  if (idx === "") return;
  const c = pistaCicliPiano()[Number(idx)];
  if (!c) return;
  const m = palestraInit().mesocicli[S.palMeso];
  m.ciclo = c.ciclo; m.inizio = isoLocale(c.data);
  if (c.blocco && !m.blocco) m.blocco = c.blocco;
  savePalestra(); disegna();
}

// copia la settimana 1 sulle altre; sullo scarico dimezza il volume (rep al 50%, intensità invariata)
function palCopiaSettimana() {
  const m = palestraInit().mesocicli[S.palMeso], g = m.giorni[S.palGiorno], n = nSettimaneMeso(m);
  while (g.settimane.length < n) g.settimane.push(palSettVuota());
  const src = g.settimane[0];
  for (let s = 1; s < n; s++) {
    const righe = (src.righe || []).map(r => ({ ...r }));
    if (isScaricoIdx(m, s)) righe.forEach(r => { const rp = Number(r.rep); if (rp > 0) r.rep = String(Math.max(1, Math.round(rp / 2))); });
    g.settimane[s].righe = righe;
    g.settimane[s].nota = src.nota || "";
  }
  savePalestra(); disegna();
}

// progressione: copia la settimana precedente aumentando Volume (rep) o Intensità (%1RM) di pct%
function applicaProgrPal(s) {
  if (s < 1) return;
  const tSel = document.getElementById("pgpt-" + s), pSel = document.getElementById("pgpp-" + s);
  const tipo = tSel ? tSel.value : "volume", pct = parseFloat(pSel ? pSel.value : "5");
  const g = palGiornoCorrente(), prev = g.settimane[s - 1], cur = g.settimane[s];
  if (!prev || !(prev.righe || []).some(r => r.rep || r.perc)) { alert("Compila prima la settimana precedente."); return; }
  const f = 1 + pct / 100;
  const base = cur.righe || [];
  const curVuota = !base.some(r => r.rep || r.perc || r.esercizio);
  // il valore modificato si calcola dalla settimana precedente; l'ALTRA dimensione (e le modifiche già fatte) restano
  cur.righe = prev.righe.map((pr, i) => {
    const nr = { ...((!curVuota && base[i]) ? base[i] : pr) };
    if (tipo === "volume") { const rp = Number(pr.rep); if (rp > 0) nr.rep = String(Math.max(1, Math.round(rp * f))); }
    else { const p = Number(pr.perc); if (p > 0) nr.perc = String(Math.min(100, Math.round((p + pct) * 10) / 10)); } // additiva: 80 + 2.5 = 82.5
    return nr;
  });
  if (curVuota) cur.nota = prev.nota || "";
  savePalestra(); disegna();
}
// scarico: dimezza il volume (rep) della settimana precedente, intensità invariata
function applicaScaricoPal(s) {
  if (s < 1) return;
  const g = palGiornoCorrente(), prev = g.settimane[s - 1], cur = g.settimane[s];
  if (!prev || !(prev.righe || []).some(r => r.rep)) { alert("Compila prima la settimana precedente."); return; }
  cur.righe = prev.righe.map(r => { const nr = { ...r }; const rp = Number(r.rep); if (rp > 0) nr.rep = String(Math.max(1, Math.round(rp / 2))); return nr; });
  cur.nota = prev.nota || "";
  savePalestra(); disegna();
}

function apriNotaPal(s) {
  const sett = palGiornoCorrente().settimane[s];
  mostraFoglio(`
    <div class="foglio-top"><h3>Nota tecnica · Settimana ${s + 1}</h3>
      <button class="chiudi" onclick="chiudiNotaPal()" aria-label="Chiudi">✕</button></div>
    <p class="et" style="margin-bottom:8px">Spiega all'atleta cosa curare in questa seduta: la vedrà nel suo allenamento.</p>
    <textarea rows="5" placeholder="Es. massima intenzione in salita, controllo in discesa..." oninput="setNotaPal(${s},this.value)">${(sett.nota || "").replace(/</g, "&lt;")}</textarea>`);
}
function setNotaPal(s, v) { palGiornoCorrente().settimane[s].nota = v; savePalestra(); }
function chiudiNotaPal() { chiudiScheda(); disegna(); }

// ---------- vista ----------
function vistaProgrammaPalestra() {
  const p = palestraInit();
  if (S.palMeso >= p.mesocicli.length) S.palMeso = 0;
  const m = p.mesocicli[S.palMeso];
  const g = m.giorni[S.palGiorno];
  const esercizi = (typeof LIBRERIE !== "undefined" && LIBRERIE.sala) ? LIBRERIE.sala.map(x => x.n) : [];
  const optSel = (val, arr) => arr.map(x => `<option value="${String(x).replace(/"/g, "&quot;")}" ${String(val) === String(x) ? "selected" : ""}>${x}</option>`).join("");

  const testa = `
    <div class="card"><h3>Programma Palestra</h3>
      <p class="et" style="margin-top:2px">Scrivi esercizio, serie, rep, %1RM, TUT e velocità target: il <b>peso</b> esce da solo dai massimali dell'atleta (%1RM × 1RM). Il volume in kg è automatico.</p></div>
    <div class="card">
      <label class="lab">Atleta di riferimento (per il peso dai massimali)</label>
      <select onchange="setPalTop('atletaRif',this.value)" style="margin-top:6px">
        <option value="">🎯 Programma madre (peso a mano)</option>${DEMO.atleti.map(a => `<option value="${a.id}" ${p.atletaRif === a.id ? "selected" : ""}>${a.nome}</option>`).join("")}</select>
      <p class="et" style="margin-top:8px">${p.atletaRif ? "Il peso usa l'<b>ultimo</b> massimale: dopo un test (Analisi → Stima 1RM) i pesi dei microcicli si <b>ricalibrano da soli</b>. Per gli accessori senza massimale lo scrivi a mano." : "Scegli un atleta per calcolare i pesi dai suoi massimali."}</p>
    </div>`;

  const tabMeso = `<div class="tabbar">${p.mesocicli.map((_, i) =>
    `<button class="${i === S.palMeso ? "on" : ""}" onclick="selPalMeso(${i})">Meso ${i + 1}</button>`).join("")}
    <button onclick="palAddMeso()">＋</button></div>`;

  const cicli = pistaCicliPiano();
  const nSett = nSettimaneMeso(m);
  const testaMeso = `<div class="card">
      <label class="lab">Mesociclo dal Piano &amp; Picco</label>
      <select onchange="setPalMesoDaPiano(this.value)" style="margin-top:6px">
        <option value="">— scegli (o imposta a mano) —</option>
        ${cicli.map((c, i) => `<option value="${i}">Ciclo ${c.ciclo} · ${c.nWeeks} sett · dal ${c.data.getDate()} ${MESI_IT[c.data.getMonth()]}</option>`).join("")}
      </select>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Ciclo (carico+scarico)</label>
          <select onchange="setPalMeso('ciclo',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.ciclo, (typeof CICLI !== "undefined" ? CICLI : []))}</select></div>
        <div><label class="lab">Inizio Sett. 1</label>
          <input type="date" value="${m.inizio || ""}" onchange="setPalMeso('inizio',this.value)" style="margin-top:6px"></div>
      </div>
      <div class="griglia2" style="margin-top:12px">
        <div><label class="lab">Blocco</label>
          <select onchange="setPalMeso('blocco',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(m.blocco, (typeof BLOCCHI !== "undefined" ? BLOCCHI : []))}</select></div>
        <div><label class="lab">Focus mesociclo</label>
          <input value="${(m.focus || "").replace(/"/g, "&quot;")}" placeholder="Es. forza massima" oninput="setPalMesoVal('focus',this.value)" onchange="disegna()" style="margin-top:6px"></div>
      </div>
      <p class="et" style="margin-top:10px">${m.ciclo ? `<b style="color:var(--txt)">${nSett} settimane</b> (ciclo ${m.ciclo}) · l'ultima è di scarico` : "Scegli un ciclo (o prendilo dal Piano & Picco) per sapere quante settimane sono e quale è lo scarico."}</p>
    </div>`;

  const tabGiorno = `<div class="tabbar">${m.giorni.map((_, i) =>
    `<button class="${i === S.palGiorno ? "on" : ""}" onclick="selPalGiorno(${i})">Giorno ${i + 1}</button>`).join("")}</div>`;

  const testaGiorno = `<div class="card">
      <label class="lab">Giorno della settimana</label>
      <select onchange="setPalGiorno('giornoSett',this.value)" style="margin-top:6px"><option value="">—</option>${optSel(g.giornoSett, ["lun", "mar", "mer", "gio", "ven", "sab", "dom"])}</select>
      <label class="lab" style="display:block;margin-top:12px">Riscaldamento</label>
      <button class="btn btn-2" style="margin-top:6px;text-align:left" onclick="apriRiscPista()">${riscRiassunto(g)}</button>
    </div>`;

  const listaSett = palSettimaneDelGiorno(m, g);
  const copiaBtn = listaSett.length > 1
    ? `<button class="btn btn-2" style="margin-bottom:11px" onclick="palCopiaSettimana()">⧉ Copia settimana 1 sulle altre${m.ciclo && m.ciclo !== "1" ? " (scarico −50% auto)" : ""}</button>`
    : "";

  const settimane = listaSett.map((sett, s) => {
    const scar = isScaricoIdx(m, s);
    const nota = (sett.nota || "").trim();
    const righe = sett.righe.map((r, i) => {
      const rm = massimaleDi(r.esercizio);
      const w = palPeso(r);
      const vol = (Number(r.serie) || 0) * (Number(r.rep) || 0) * (w || 0);
      const pesoCell = rm != null
        ? `<td class="pauto">${w != null ? w : "—"}</td>`
        : `<td><input inputmode="numeric" value="${r.peso || ""}" placeholder="kg" oninput="setPalRigaVal(${s},${i},'peso',this.value)" onchange="disegna()" style="min-width:56px"></td>`;
      return `<tr>
        <td><select onchange="setPalRiga(${s},${i},'esercizio',this.value)" style="min-width:150px"><option value="">—</option>${optSel(r.esercizio, esercizi)}</select></td>
        <td><input inputmode="numeric" value="${r.serie || ""}" placeholder="s" oninput="setPalRigaVal(${s},${i},'serie',this.value)" onchange="disegna()" style="min-width:48px"></td>
        <td><input inputmode="numeric" value="${r.rep || ""}" placeholder="r" oninput="setPalRigaVal(${s},${i},'rep',this.value)" onchange="disegna()" style="min-width:48px"></td>
        <td><input inputmode="numeric" value="${r.perc || ""}" placeholder="%" oninput="setPalRigaVal(${s},${i},'perc',this.value)" onchange="disegna()" style="min-width:48px"></td>
        <td><input value="${(r.rec || "").replace(/"/g, "&quot;")}" placeholder="rec" oninput="setPalRigaVal(${s},${i},'rec',this.value)" style="min-width:64px"></td>
        <td><input value="${(r.tut || "").replace(/"/g, "&quot;")}" placeholder="TUT" oninput="setPalRigaVal(${s},${i},'tut',this.value)" style="min-width:64px"></td>
        <td><input inputmode="decimal" value="${r.vbt || ""}" placeholder="m/s" oninput="setPalRigaVal(${s},${i},'vbt',this.value)" style="min-width:56px"></td>
        ${pesoCell}
        <td class="pauto">${vol ? vol.toLocaleString("it-IT") : "—"}</td>
        <td><button class="chiudi" style="font-size:14px" onclick="palDelRiga(${s},${i})" aria-label="Rimuovi">✕</button></td>
      </tr>`;
    }).join("");
    return `<div class="card"${scar ? ' style="border-color:rgba(240,168,60,.55);background:rgba(240,168,60,.08)"' : ""}>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <p style="font-weight:600;font-size:13px;margin:0">Settimana ${s + 1}</p>
        ${scar ? '<span class="pill p-giallo">scarico · −50% vol</span>' : ""}
      </div>
      <div class="p-scroll"><table class="ptab pista-w">
        <thead><tr><th>Esercizio</th><th>Serie</th><th>Rep</th><th>%1RM</th><th>Rec</th><th>TUT</th><th>VBT tgt</th><th>Peso (kg)</th><th>Vol (kg)</th><th></th></tr></thead>
        <tbody>${righe}</tbody>
      </table></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <button class="btn btn-2" style="width:auto;padding:8px 14px" onclick="palAddRiga(${s})">＋ esercizio</button>
        <span class="et">Volume: <b style="color:var(--verde);font-size:14px">${volumePalSett(sett).toLocaleString("it-IT")} kg</b></span>
      </div>
      ${s > 0 && !scar ? `<div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <span class="et" style="margin:0">↑ da sett. ${s}:</span>
        <select id="pgpt-${s}" onchange="progSwitch('pgpt-${s}','pgpp-${s}')" style="padding:7px 8px;width:auto;flex:none"><option value="volume">Volume</option><option value="intensita">Intensità</option></select>
        <select id="pgpp-${s}" style="padding:7px 8px;width:auto;flex:none">${(typeof PROG_VOL !== "undefined" ? PROG_VOL : [5, 10, 15, 20, 30, 40]).map(o => `<option>${o}</option>`).join("")}</select>
        <button class="btn btn-2" style="width:auto;padding:7px 12px" onclick="applicaProgrPal(${s})">+% applica</button>
      </div>` : ""}
      ${s > 0 && scar ? `<button class="btn btn-2" style="margin-top:8px" onclick="applicaScaricoPal(${s})">⬇ Scarico: volume al 50% della sett. ${s}</button>` : ""}
      <button class="btn btn-2" style="margin-top:8px;text-align:left;font-size:13px" onclick="apriNotaPal(${s})">📝 ${nota ? "Nota: " + (nota.length > 42 ? nota.slice(0, 42) + "…" : nota) : "Nota tecnica del giorno"}</button>
    </div>`;
  }).join("");

  return testa + tabMeso + testaMeso + tabGiorno + testaGiorno + copiaBtn + settimane;
}
