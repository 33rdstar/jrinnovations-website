import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileDown, FileSpreadsheet, FileText, Table } from 'lucide-react';
import { downloadCsv, downloadExcel, printPdf } from './exportReport';

// One "Extract" button for every report. getSheets() builds the data when it is clicked, so the
// file always matches what is on screen. sheets: [{ name, title?, columns, rows }]
const ExtractButton = ({ filename, title, subtitle = '', getSheets, disabled = false, dark = false }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const run = (kind) => {
    setOpen(false); setNote('');
    const sheets = getSheets();
    if (kind === 'excel') downloadExcel(filename, sheets);
    else if (kind === 'csv') downloadCsv(filename, sheets);
    else if (!printPdf(title, sheets, subtitle)) setNote('Your browser blocked the PDF window. Allow pop-ups for this site and try again.');
  };

  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 text-gray-800';
  return (
    <div className="relative inline-block" ref={box}>
      <button
        type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${dark ? 'bg-amber-400 text-[#0D1B2A]' : 'bg-[#0D1B2A] text-white'}`}
      >
        <FileDown size={15} /> Extract <ChevronDown size={14} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30">
          <button role="menuitem" className={item} onClick={() => run('excel')}><FileSpreadsheet size={16} className="text-emerald-600" /> Excel <span className="text-xs text-gray-400">.xls</span></button>
          <button role="menuitem" className={item} onClick={() => run('pdf')}><FileText size={16} className="text-red-600" /> PDF <span className="text-xs text-gray-400">print / save</span></button>
          <button role="menuitem" className={item} onClick={() => run('csv')}><Table size={16} className="text-sky-600" /> CSV <span className="text-xs text-gray-400">.csv</span></button>
        </div>
      )}
      {note && <p className="absolute right-0 mt-1 w-64 text-xs text-red-600 bg-white p-2 rounded shadow z-30">{note}</p>}
    </div>
  );
};

export default ExtractButton;
