// Export Excel (.xlsx) SELF-CONTAINED — niente librerie. Genero lo zip OOXML a mano,
// con fogli formattati (colori, bordi, intestazioni) e grafici nativi (barre/linee).

// ---------- zip (metodo "store", con CRC32) ----------
function _crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ -1) >>> 0;
}
function _zipStore(files) {
  const u16 = n => [n & 0xff, (n >> 8) & 0xff];
  const u32 = n => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
  const parts = [], central = [];
  let offset = 0;
  files.forEach(f => {
    const nameB = new TextEncoder().encode(f.name), data = f.bytes, crc = _crc32(data);
    const local = [0x50, 0x4b, 0x03, 0x04].concat(u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameB.length), u16(0));
    parts.push(new Uint8Array(local), nameB, data);
    const cen = [0x50, 0x4b, 0x01, 0x02].concat(u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset));
    central.push(new Uint8Array(cen), nameB);
    offset += local.length + nameB.length + data.length;
  });
  let centralLen = 0; central.forEach(p => centralLen += p.length);
  const end = new Uint8Array([0x50, 0x4b, 0x05, 0x06].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(centralLen), u32(offset), u16(0)));
  const all = parts.concat(central, [end]);
  let total = 0; all.forEach(p => total += p.length);
  const out = new Uint8Array(total); let pos = 0;
  all.forEach(p => { out.set(p, pos); pos += p.length; });
  return out;
}

// ---------- helper celle ----------
function _colL(n) { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26 | 0; } return s; }
function _xe(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function _cellXml(ref, val, s) {
  const sa = s != null ? ` s="${s}"` : "";
  if (val === null || val === undefined || val === "") return `<c r="${ref}"${sa}/>`;
  if (typeof val === "number" && isFinite(val)) return `<c r="${ref}"${sa}><v>${val}</v></c>`;
  return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${_xe(val)}</t></is></c>`;
}
function _foglioXml(sheet) {
  const cols = (sheet.cols || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
  const rows = (sheet.rows || []).map((row, ri) => {
    const cells = (row || []).map((c, ci) => {
      const ref = _colL(ci + 1) + (ri + 1);
      return (c && typeof c === "object" && !Array.isArray(c)) ? _cellXml(ref, c.v, c.s) : _cellXml(ref, c, null);
    }).join("");
    return `<row r="${ri + 1}">${cells}</row>`;
  }).join("");
  const merges = (sheet.merges || []).length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map(m => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>` : "";
  const draw = sheet.drawingRid ? `<drawing r:id="${sheet.drawingRid}"/>` : "";
  const fz = sheet.freeze ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${fz}${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${rows}</sheetData>${merges}${draw}</worksheet>`;
}

// ---------- styles.xml ----------
// stili (indice cellXfs): 0=default 1=intestazione 2=dato 3=verde 4=rosso 5=giallo 6=titolo 7=sotto-intestazione
const _STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="4">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="15"/><color rgb="FF2B4C7E"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font>
</fonts>
<fills count="7">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF2B4C7E"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD4EDDA"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF8D7DA"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF3CD"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEEF2F7"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD0D7E2"/></left><right style="thin"><color rgb="FFD0D7E2"/></right><top style="thin"><color rgb="FFD0D7E2"/></top><bottom style="thin"><color rgb="FFD0D7E2"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="0"/>
</styleSheet>`;

// ---------- assemblaggio workbook ----------
function _anchorXml(rId, cnvId, from, to) {
  return `<xdr:twoCellAnchor><xdr:from><xdr:col>${from.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${from.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${to.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${to.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${cnvId}" name="Grafico ${cnvId}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId${rId}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`;
}
function _buildXlsx(fogli, charts) {
  charts = charts || [];
  const files = [];
  const put = (name, str) => files.push({ name, bytes: new TextEncoder().encode(str) });

  // raggruppo i grafici per foglio → un drawing per foglio, con più ancore
  const perSheet = {};
  charts.forEach((c, i) => { c._n = i + 1; (perSheet[c.sheetIdx] = perSheet[c.sheetIdx] || []).push(c); });
  const drawings = Object.keys(perSheet).map((si, k) => ({ di: k + 1, sheetIdx: Number(si), list: perSheet[si] }));
  drawings.forEach(d => { fogli[d.sheetIdx].drawingRid = "rId1"; });

  // fogli (dopo aver settato drawingRid)
  fogli.forEach((f, i) => put(`xl/worksheets/sheet${i + 1}.xml`, _foglioXml(f)));

  // content types
  const ovSheets = fogli.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const ovChart = charts.map((c, i) => `<Override PartName="/xl/charts/chart${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`).join("");
  const ovDraw = drawings.map(d => `<Override PartName="/xl/drawings/drawing${d.di}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`).join("");
  put("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ovSheets}${ovDraw}${ovChart}</Types>`);

  put("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);

  const sheetsXml = fogli.map((f, i) => `<sheet name="${_xe(f.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("");
  put("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetsXml}</sheets></workbook>`);
  const relSheets = fogli.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("");
  put("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relSheets}<Relationship Id="rId${fogli.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);

  put("xl/styles.xml", _STYLES_XML);

  // chart files
  charts.forEach((c, i) => put(`xl/charts/chart${i + 1}.xml`, c.xml));

  // un drawing per foglio (con tutte le ancore) + rels + rel del foglio
  drawings.forEach(d => {
    const anchors = d.list.map((c, k) => _anchorXml(k + 1, k + 2, c.from, c.to)).join("");
    put(`xl/drawings/drawing${d.di}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${anchors}</xdr:wsDr>`);
    const relChart = d.list.map((c, k) => `<Relationship Id="rId${k + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${c._n}.xml"/>`).join("");
    put(`xl/drawings/_rels/drawing${d.di}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relChart}</Relationships>`);
    put(`xl/worksheets/_rels/sheet${d.sheetIdx + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${d.di}.xml"/></Relationships>`);
  });

  return _zipStore(files);
}

function _scaricaBytes(nome, bytes) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ---------- generatori fogli ----------
function _num(v) { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; }
function _sAder(v) { return v >= 85 ? 3 : v >= 70 ? 5 : 4; }
function _sAcwr(v) { v = _num(v); return v == null ? 2 : (v >= 0.8 && v <= 1.3 ? 3 : (v > 1.3 && v <= 1.5 ? 5 : 4)); }
function _sPront(v) { v = _num(v); return v == null ? 2 : (v >= 3.5 ? 3 : v >= 2.5 ? 5 : 4); }
function _atletiExport() { return (typeof ordinaAtleti === "function") ? ordinaAtleti() : (DEMO.atleti || []); }

function _fSquadra(atleti) {
  const rows = [];
  rows.push([{ v: "Metis Performance — Quadro squadra", s: 6 }]);
  rows.push([{ v: "Aderenza, carico (ACWR), forma e prontezza di ogni atleta", s: 0 }]);
  rows.push(["Atleta", "Specialità", "Aderenza %", "ACWR", "Forma (TSB)", "Prontezza", "Pres. mese", "Pres. stagione"].map(h => ({ v: h, s: 1 })));
  atleti.forEach(a => {
    const m = (DEMO.mon || {})[a.id] || {};
    const ps = a.presenzeStagione || [0, 0], pm = a.presenzeMese || [0, 0];
    const ader = m.aderenza != null ? m.aderenza : (ps[1] ? Math.round(ps[0] / ps[1] * 100) : 0);
    rows.push([
      { v: a.nome, s: 2 }, { v: a.specialita || "", s: 2 },
      { v: ader, s: _sAder(ader) }, { v: _num(m.acwr) != null ? _num(m.acwr) : "—", s: _sAcwr(m.acwr) },
      { v: m.forma || "—", s: 2 }, { v: m.prontezza || "—", s: _sPront(m.prontezza) },
      { v: pm[0] + "/" + pm[1], s: 2 }, { v: ps[0] + "/" + ps[1], s: 2 }
    ]);
  });
  return { nome: "Squadra", cols: [22, 16, 12, 10, 12, 11, 11, 13], rows, freeze: 3, merges: ["A1:H1", "A2:H2"], nAtleti: atleti.length };
}

function _fSvolti() {
  const rows = [];
  rows.push([{ v: "Allenamenti svolti", s: 6 }]);
  rows.push(["Atleta", "Data", "Tipo", "Giorno", "Durata", "RPE", "Fastidio", "Voce", "Prescrizione", "%", "Obiettivo", "Svolto", "Migliore/Media"].map(h => ({ v: h, s: 1 })));
  const ss = DEMO.seduteSvolte || {};
  Object.keys(ss).forEach(aid => {
    (ss[aid] || []).slice().sort((x, y) => x.data < y.data ? 1 : -1).forEach(sv => {
      const d = sv.dati || {}, nome = _atletiExport().find(a => a.id === aid), nm = nome ? nome.nome : aid;
      const base = [{ v: nm, s: 2 }, { v: sv.data, s: 2 }, { v: sv.tipo, s: 2 }, { v: sv.giorno || "", s: 2 }, { v: sv.durata_min || "", s: 2 }, { v: sv.rpe || "", s: 2 }, { v: sv.fastidi ? "sì" : "", s: sv.fastidi ? 4 : 2 }];
      if (sv.tipo === "pista") {
        (d.elementi || []).forEach(e => {
          const f = (e.tempi || []).filter(v => v != null), best = f.length ? Math.min(...f) : null;
          const sBest = (best != null && e.target != null) ? (best <= e.target ? 3 : 4) : 2;
          rows.push(base.concat([{ v: e.distanza + " m", s: 2 }, { v: e.ripetute + "×" + e.distanza, s: 2 }, { v: e.percentuale || "", s: 2 }, { v: e.target != null ? e.target : "", s: 2 }, { v: f.map(t => Number(t).toFixed(2)).join(" · "), s: 2 }, { v: best != null ? Number(best.toFixed(2)) : "", s: sBest }]));
        });
      } else {
        (d.esercizi || []).forEach(x => {
          const f = (x.vbt || []).filter(v => v != null), vm = f.length ? Math.round(f.reduce((s, v) => s + v, 0) / f.length * 100) / 100 : "";
          rows.push(base.concat([{ v: x.nome, s: 2 }, { v: (x.serie || "") + "×" + (x.rep || "") + (x.peso ? " @" + x.peso + "kg" : ""), s: 2 }, { v: x.percentuale || "", s: 2 }, { v: x.vbtTarget != null ? x.vbtTarget : "", s: 2 }, { v: f.map(v => Number(v).toFixed(2)).join(" · "), s: 2 }, { v: vm, s: 2 }]));
        });
      }
    });
  });
  return { nome: "Allenamenti svolti", cols: [20, 12, 10, 8, 8, 7, 9, 14, 16, 7, 10, 18, 13], rows, freeze: 2 };
}

function _fPB() {
  const rows = [];
  rows.push([{ v: "PB e massimali", s: 6 }]);
  rows.push(["Atleta", "Categoria", "Tipo", "Voce", "Valore", "Data", "Origine"].map(h => ({ v: h, s: 1 })));
  _atletiExport().forEach(a => {
    const cat = (a.scheda && a.scheda.anagrafica && a.scheda.anagrafica.categoria) || "";
    ((a.scheda && a.scheda.pb) || []).forEach(p => rows.push([{ v: a.nome, s: 2 }, { v: cat, s: 2 }, { v: "PB", s: 2 }, { v: p[0], s: 2 }, { v: p[1], s: 2 }, { v: p[2] || "", s: 2 }, { v: p[7] || "", s: 2 }]));
    ((a.scheda && a.scheda.massimali) || []).forEach(m => rows.push([{ v: a.nome, s: 2 }, { v: cat, s: 2 }, { v: "Massimale", s: 2 }, { v: m[0], s: 2 }, { v: m[1] + " kg", s: 2 }, { v: m[2] || "", s: 2 }, { v: "", s: 2 }]));
  });
  return { nome: "PB e massimali", cols: [20, 16, 12, 18, 12, 10, 12], rows, freeze: 2 };
}

function _fPresenze(atleti) {
  const rows = [];
  rows.push([{ v: "Presenze e aderenza", s: 6 }]);
  rows.push(["Atleta", "Disciplina", "Specialità", "Fatte (mese)", "Prog. (mese)", "Fatte (stag.)", "Prog. (stag.)", "Aderenza %"].map(h => ({ v: h, s: 1 })));
  atleti.forEach(a => {
    const m = (DEMO.mon || {})[a.id] || {}, pm = a.presenzeMese || [0, 0], ps = a.presenzeStagione || [0, 0];
    const ader = m.aderenza != null ? m.aderenza : (ps[1] ? Math.round(ps[0] / ps[1] * 100) : 0);
    rows.push([{ v: a.nome, s: 2 }, { v: a.disciplina || "", s: 2 }, { v: a.specialita || "", s: 2 }, { v: pm[0], s: 2 }, { v: pm[1], s: 2 }, { v: ps[0], s: 2 }, { v: ps[1], s: 2 }, { v: ader, s: _sAder(ader) }]);
  });
  return { nome: "Presenze", cols: [22, 14, 14, 12, 12, 12, 12, 12], rows, freeze: 2 };
}

// ---------- grafici nativi (barre) ----------
function _cacheStr(vals) { return `<c:strCache><c:ptCount val="${vals.length}"/>${vals.map((v, i) => `<c:pt idx="${i}"><c:v>${_xe(v)}</c:v></c:pt>`).join("")}</c:strCache>`; }
function _cacheNum(vals) { return `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${vals.length}"/>${vals.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join("")}</c:numCache>`; }
function _chartBar(titolo, sheet, serRef, serName, catRef, catVals, valRef, valVals, colHex) {
  const fill = colHex ? `<c:spPr><a:solidFill><a:srgbClr val="${colHex}"/></a:solidFill></c:spPr>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr b="1" sz="1200"/></a:pPr><a:r><a:rPr lang="it-IT" b="1" sz="1200"/><a:t>${_xe(titolo)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>${sheet}!${serRef}</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${_xe(serName)}</c:v></c:pt></c:strCache></c:strRef></c:tx>${fill}<c:cat><c:strRef><c:f>${sheet}!${catRef}</c:f>${_cacheStr(catVals)}</c:strRef></c:cat><c:val><c:numRef><c:f>${sheet}!${valRef}</c:f>${_cacheNum(valVals)}</c:numRef></c:val></c:ser><c:axId val="111"/><c:axId val="222"/></c:barChart><c:catAx><c:axId val="111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:crossAx val="222"/></c:catAx><c:valAx><c:axId val="222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:crossAx val="111"/></c:valAx></c:plotArea><c:legend><c:legendPos val="b"/></c:legend><c:plotVisOnly val="1"/></c:chart></c:chartSpace>`;
}
function _graficiSquadra() {
  const at = _atletiExport();
  if (!at.length) return [];
  const n = at.length, r0 = 4, r1 = 3 + n, base = 3 + n + 1;
  const nomi = at.map(a => a.nome);
  const ader = at.map(a => { const m = (DEMO.mon || {})[a.id] || {}; const ps = a.presenzeStagione || [0, 0]; return m.aderenza != null ? m.aderenza : (ps[1] ? Math.round(ps[0] / ps[1] * 100) : 0); });
  const acwr = at.map(a => { const v = _num(((DEMO.mon || {})[a.id] || {}).acwr); return v == null ? 0 : v; });
  return [
    { sheetIdx: 0, from: { col: 0, row: base }, to: { col: 4, row: base + 15 }, xml: _chartBar("Aderenza % per atleta", "Squadra", "$C$3", "Aderenza %", `$A$${r0}:$A$${r1}`, nomi, `$C$${r0}:$C$${r1}`, ader, "2B4C7E") },
    { sheetIdx: 0, from: { col: 5, row: base }, to: { col: 9, row: base + 15 }, xml: _chartBar("ACWR per atleta (ideale 0.8–1.3)", "Squadra", "$D$3", "ACWR", `$A$${r0}:$A$${r1}`, nomi, `$D$${r0}:$D$${r1}`, acwr, "6C8EBF") }
  ];
}

// costruisce il workbook completo (con i grafici della Squadra)
function _workbookFogli() {
  const at = _atletiExport();
  return [_fSquadra(at), _fSvolti(), _fPB(), _fPresenze(at)];
}
function esportaXlsx() {
  const bytes = _buildXlsx(_workbookFogli(), typeof _graficiSquadra==="function" ? _graficiSquadra() : []);
  _scaricaBytes("metis-report.xlsx", bytes);
}
// helper di test: base64 del workbook (per validarlo con openpyxl/LibreOffice)
function _xlsxBase64() {
  const bytes = _buildXlsx(_workbookFogli(), typeof _graficiSquadra==="function" ? _graficiSquadra() : []);
  let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
