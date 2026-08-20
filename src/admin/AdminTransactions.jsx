// AdminTransactions.jsx
import { db } from '../Config/firebaseConfig';
import {
  collection, onSnapshot, orderBy, query, limit,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from './shared/useDebounce';
import { Pagination } from './shared/Pagination';
import { useAgentNames } from './shared/useAgentNames';
import { toDateObj } from './TransactionDetail';

// ── constants
// Lister/agent gets 60% of each contact-reveal fee, company keeps 40%
// (matches PAYOUT_RATIO in the mobile Cloud Functions).
const PAYOUT_RATIO   = 0.6;
const COMPANY_RATIO  = 0.4;
const STATUS_COLORS  = {
  completed:  { bg: '#d1fae5', color: '#065f46' },
  pending:    { bg: '#fef9c3', color: '#854d0e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  failed:     { bg: '#fee2e2', color: '#991b1b' },
};

// Bound the live listener instead of streaming the whole collection forever;
// "Load more" raises the bound. Tune once real collection size is known.
const INITIAL_ROW_LIMIT   = 500;
const LOAD_MORE_INCREMENT = 500;

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [rowLimit, setRowLimit]         = useState(INITIAL_ROW_LIMIT);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [perPage, setPerPage]           = useState(20);
  const navigate = useNavigate();
  const { names: agentNames, resolveMany } = useAgentNames();
  const debouncedSearch = useDebounce(search, 300);

  // ── bounded live listener ("Load more" raises rowLimit)
  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(rowLimit));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(docs);
      setLoading(false);
      setLoadingMore(false);
      resolveMany(docs.map(t => t.ownerId));
    });
    return () => unsub();
  }, [rowLimit, resolveMany]);

  const hasMorePossible = transactions.length === rowLimit;
  const handleLoadMore = () => { setLoadingMore(true); setRowLimit(n => n + LOAD_MORE_INCREMENT); };

  // ── filtered list
  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return transactions.filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchSearch = !term
        || t.reference?.toLowerCase().includes(term)
        || t.customerPhone?.toLowerCase().includes(term)
        || t.propertyId?.toLowerCase().includes(term)
        || (agentNames[t.ownerId] || '').toLowerCase().includes(term);
      const matchDate = (() => {
        if (!dateFrom && !dateTo) return true;
        const created = toDateObj(t.createdAt);
        if (!created) return false; // an active date filter excludes undated rows rather than silently keeping them
        const ts = created.getTime();
        if (dateFrom && ts < new Date(`${dateFrom}T00:00:00`).getTime()) return false;
        if (dateTo   && ts > new Date(`${dateTo}T23:59:59.999`).getTime()) return false;
        return true;
      })();
      return matchStatus && matchSearch && matchDate;
    });
  }, [transactions, statusFilter, debouncedSearch, agentNames, dateFrom, dateTo]);

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, dateFrom, dateTo]);

  // ── summary (all completed transactions among currently loaded rows)
  const summary = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const total     = completed.reduce((s, t) => s + (t.amount || 0), 0);
    return {
      count:       completed.length,
      total,
      company:     total * COMPANY_RATIO,
      agentCuts:   total * PAYOUT_RATIO,
    };
  }, [transactions]);

  // ── helpers
  const fmt = (n) => `ZMW ${Number(n || 0).toFixed(2)}`;
  const fmtDate = (ts) => ts?.toDate
    ? ts.toDate().toLocaleString('en-ZM', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Transactions — Admin Audit</h1>

      {/* ── Summary cards ── */}
      <div style={styles.cards}>
        <SummaryCard label="Total Revenue"    value={fmt(summary.total)}      sub={`${summary.count} completed`} accent="#6366f1" />
        <SummaryCard label="Company (40%)"    value={fmt(summary.company)}    sub="Net earnings"                 accent="#10b981" />
        <SummaryCard label="Agent Payouts (60%)" value={fmt(summary.agentCuts)} sub="Across all agents"          accent="#f59e0b" />
        <SummaryCard label="All Transactions" value={transactions.length}     sub="Including pending/failed"     accent="#64748b" />
      </div>

      {hasMorePossible && (
        <p style={{ color: '#64748b', fontSize: 12, marginTop: -12, marginBottom: 20 }}>
          Totals above reflect the {rowLimit} most recently loaded transactions — click "Load more" below to include earlier ones.
        </p>
      )}

      {/* ── Filters ── */}
      <div style={styles.filterRow}>
        <input
          style={styles.search}
          placeholder="Search reference, phone, property, agent…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <input type="date" style={styles.select} value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label="From date" />
        <input type="date" style={styles.select} value={dateTo}   onChange={e => setDateTo(e.target.value)}   aria-label="To date" />
      </div>

      {/* ── Table ── */}
      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>Loading transactions…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>No transactions found.</p>
      ) : (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Date', 'Reference', 'Agent', 'Property ID', 'Customer Phone',
                    'Amount', 'Agent 60%', 'Company 40%', 'Status'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => {
                  const amount    = t.amount || 0;
                  const agentCut  = amount * PAYOUT_RATIO;
                  const companyCut= amount * COMPANY_RATIO;
                  const sc        = STATUS_COLORS[t.status] || STATUS_COLORS.pending;
                  return (
                    <tr
                      key={t.id}
                      style={{ ...styles.tr, cursor: 'pointer' }}
                      onClick={() => navigate(`/portal-mgmt-xyz99/transaction/${t.id}`)}
                      onMouseEnter={e => { e.currentTarget.style.background = '#172033'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      title="Open full details"
                    >
                      <td style={styles.td}>{fmtDate(t.createdAt)}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{t.reference || t.id}</td>
                      <td style={styles.td}>{agentNames[t.ownerId] || t.ownerId || '—'}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{t.propertyId || '—'}</td>
                      <td style={styles.td}>{t.customerPhone || '—'}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>{fmt(amount)}</td>
                      <td style={{ ...styles.td, color: '#f59e0b', fontWeight: 600 }}>{fmt(agentCut)}</td>
                      <td style={{ ...styles.td, color: '#10b981', fontWeight: 600 }}>{fmt(companyCut)}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={perPage}
            onPageChange={setCurrentPage}
            pageSizeOptions={[20, 40, 60]}
            onPageSizeChange={(n) => { setPerPage(n); setCurrentPage(1); }}
            theme={{ text: '#94a3b8', bg: '#1e293b', accent: '#f59e0b', font: 'Inter, system-ui, sans-serif' }}
          />

          {hasMorePossible && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={handleLoadMore} disabled={loadingMore} style={{
                padding: '10px 20px', borderRadius: 10, border: '1px solid #334155',
                background: '#1e293b', color: '#cbd5e1', cursor: loadingMore ? 'wait' : 'pointer', fontSize: 14,
              }}>
                {loadingMore ? 'Loading…' : `Load ${LOAD_MORE_INCREMENT} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Summary card sub-component
function SummaryCard({ label, value, sub, accent }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${accent}` }}>
      <p style={{ ...styles.cardLabel, color: accent }}>{label}</p>
      <p style={styles.cardValue}>{value}</p>
      <p style={styles.cardSub}>{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  page:      { background: '#0f172a', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', fontFamily: 'Inter, system-ui, sans-serif' },
  heading:   { color: '#f1f5f9', fontSize: 24, fontWeight: 700, marginBottom: 24 },

  cards:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 },
  card:      { backgroundColor: '#1e293b', borderRadius: 12, padding: '20px 24px' },
  cardLabel: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  cardValue: { color: '#f1f5f9', fontSize: 26, fontWeight: 800, margin: '4px 0' },
  cardSub:   { color: '#64748b', fontSize: 12, margin: 0 },

  filterRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  search:    { flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none' },
  select:    { padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none' },

  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #1e293b' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { backgroundColor: '#1e293b', color: '#94a3b8', fontWeight: 600, padding: '12px 16px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid #334155' },
  tr:        { borderBottom: '1px solid #1e293b', transition: 'background 0.15s' },
  td:        { padding: '12px 16px', color: '#cbd5e1', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  badge:     { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' },
};
