import React from 'react';

const DEFAULT_THEME = { text: '#94a3b8', bg: '#0D1B2A', accent: '#F5A623', font: "'Inter','Segoe UI',system-ui,sans-serif" };

// Controlled/presentational only — the parent owns currentPage/pageSize state
// and slices its own array; this renders controls and does the page-count /
// ellipsis math shared by every admin table (Users, Verifications, Treasury).
export function Pagination({ currentPage, totalItems, pageSize, onPageChange, pageSizeOptions, onPageSizeChange, theme }) {
  const t = { ...DEFAULT_THEME, ...theme };
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageList = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 12, color: t.text, flexWrap: 'wrap', gap: 12 }}>
      {pageSizeOptions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Rows per page:</span>
          {pageSizeOptions.map(n => (
            <button key={n} onClick={() => onPageSizeChange(n)} style={{
              padding: '4px 12px', borderRadius: 20, border: 'none',
              background: pageSize === n ? t.accent : t.bg, color: pageSize === n ? t.bg : t.text,
              fontWeight: pageSize === n ? 700 : 400, cursor: 'pointer', fontFamily: t.font, fontSize: 12,
            }}>{n}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>
          {totalItems === 0 ? '0' : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['‹', '›'].map((arrow, ai) => {
            const disabled = ai === 0 ? currentPage === 1 : currentPage === totalPages || totalPages === 0;
            return (
              <button key={arrow} disabled={disabled}
                onClick={() => onPageChange(ai === 0 ? Math.max(currentPage - 1, 1) : Math.min(currentPage + 1, totalPages))}
                style={{ padding: '4px 10px', borderRadius: 20, border: 'none', background: t.bg, color: t.text, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: t.font, opacity: disabled ? 0.4 : 1 }}
              >{arrow}</button>
            );
          })}
          {pageList.map((p, idx) => p === '...'
            ? <span key={`e${idx}`} style={{ padding: '4px 6px', color: t.text }}>…</span>
            : (
              <button key={p} onClick={() => onPageChange(p)} style={{
                padding: '4px 10px', borderRadius: 20, border: 'none',
                background: currentPage === p ? t.accent : t.bg, color: currentPage === p ? t.bg : t.text,
                fontWeight: currentPage === p ? 700 : 400, cursor: 'pointer', fontFamily: t.font, fontSize: 12,
              }}>{p}</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
