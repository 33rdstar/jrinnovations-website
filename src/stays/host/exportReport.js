// Downloads for the dashboard reports. Excel opens the "XML Spreadsheet" format directly, with
// several sheets, a styled header row and real numbers (so totals and charts work), and it needs no
// extra library. CSV is offered too for other programs.

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sheetName = (n, i) => esc(String(n || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));

const save = (blob, filename) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

const cell = (value, type) => {
  if (value === null || value === undefined || value === '') return '<Cell/>';
  if (type === 'money') return `<Cell ss:StyleID="money"><Data ss:Type="Number">${Number(value) || 0}</Data></Cell>`;
  if (type === 'number') return `<Cell><Data ss:Type="Number">${Number(value) || 0}</Data></Cell>`;
  return `<Cell><Data ss:Type="String">${esc(value)}</Data></Cell>`;
};

// sheets: [{ name, title?, columns: [{ header, key, type?: 'money'|'number'|'text', width? }], rows: [{...}] }]
export const downloadExcel = (filename, sheets) => {
  const body = sheets.map((sh, i) => {
    const cols = sh.columns.map((c) => `<Column ss:Width="${c.width || 90}"/>`).join('');
    const title = sh.title ? `<Row><Cell ss:StyleID="title"><Data ss:Type="String">${esc(sh.title)}</Data></Cell></Row><Row/>` : '';
    const head = `<Row>${sh.columns.map((c) => `<Cell ss:StyleID="head"><Data ss:Type="String">${esc(c.header)}</Data></Cell>`).join('')}</Row>`;
    const rows = sh.rows.map((r) => `<Row>${sh.columns.map((c) => cell(r[c.key], c.type)).join('')}</Row>`).join('');
    return `<Worksheet ss:Name="${sheetName(sh.name, i)}"><Table>${cols}${title}${head}${rows}</Table></Worksheet>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="head"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0D1B2A" ss:Pattern="Solid"/></Style>
<Style ss:ID="title"><Font ss:Bold="1" ss:Size="14"/></Style>
<Style ss:ID="money"><NumberFormat ss:Format="#,##0.00"/></Style>
</Styles>${body}</Workbook>`;
  save(new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' }), `${filename}.xls`);
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
// One sheet gives a plain table; several sheets are stacked one under the other, each with its name.
export const downloadCsv = (filename, sheets) => {
  const list = Array.isArray(sheets) ? sheets : [sheets];
  const lines = [];
  list.forEach((sh, i) => {
    if (i) lines.push('');
    if (list.length > 1 || sh.title) lines.push(csvCell(sh.title || sh.name));
    lines.push(sh.columns.map((c) => csvCell(c.header)).join(','));
    sh.rows.forEach((r) => lines.push(sh.columns.map((c) => csvCell(r[c.key])).join(',')));
  });
  save(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
};

const fmt = (v, type) => {
  if (v === null || v === undefined || v === '') return '';
  if (type === 'money') return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return esc(v);
};

// PDF: opens a clean, print-ready page and the browser's print dialog, where "Save as PDF" is the
// destination. This needs no library and keeps text sharp and selectable.
// It must be called straight from a click so the browser does not block the new tab.
export const printPdf = (title, sheets, subtitle = '') => {
  const win = window.open('', '_blank');
  if (!win) return false;
  const tables = sheets.map((sh) => `
    <h2>${esc(sh.title || sh.name)}</h2>
    <table><thead><tr>${sh.columns.map((c) => `<th class="${c.type === 'money' || c.type === 'number' ? 'r' : ''}">${esc(c.header)}</th>`).join('')}</tr></thead>
    <tbody>${sh.rows.map((r) => `<tr>${sh.columns.map((c) => `<td class="${c.type === 'money' || c.type === 'number' ? 'r' : ''}">${fmt(r[c.key], c.type)}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('');
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:28px}
  .brand{color:#0D1B2A;border-bottom:3px solid #FFA500;padding-bottom:10px;margin-bottom:16px}
  .brand b{font-size:20px} .brand span{display:block;font-size:12px;color:#555;margin-top:4px}
  h2{font-size:14px;margin:22px 0 6px;color:#0D1B2A}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#0D1B2A;color:#fff;text-align:left;padding:6px 8px}
  td{padding:5px 8px;border-bottom:1px solid #ddd}
  .r{text-align:right}
  tr{page-break-inside:avoid}
  @media print{body{margin:12mm}}
</style></head><body>
<div class="brand"><b>Yanga Stays &middot; ${esc(title)}</b><span>${esc(subtitle)}Generated ${esc(new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }))}</span></div>
${tables}
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
};
