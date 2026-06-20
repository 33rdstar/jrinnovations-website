// AdminTransactions.jsx
import { db } from '../Config/firebaseConfig';
import {
  getFirestore, collection, onSnapshot, orderBy, query, doc, getDoc,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';


// ── constants
const PAYOUT_RATIO   = 0.4;
const COMPANY_RATIO  = 0.6;
const STATUS_COLORS  = {
  completed:  { bg: '#d1fae5', color: '#065f46' },
  pending:    { bg: '#fef9c3', color: '#854d0e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  failed:     { bg: '#fee2e2', color: '#991b1b' },
};

// ── agent name cache (module-level so it persists across re-renders)
const agentCache = {};

async function resolveAgentName(db, ownerId) {
  if (!ownerId) return '—';
  if (agentCache[ownerId]) return agentCache[ownerId];
  try {
    const snap = await getDoc(doc(db, 'users', ownerId));
    if (snap.exists()) {
      const { firstName, lastName, username } = snap.data();
      const name = [firstName, lastName].filter(Boolean).join(' ') || username || ownerId;
      agentCache[ownerId] = name;
      return name;
    }
  } catch (_) {}
  return ownerId;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [agentNames, setAgentNames]     = useState({});
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── live listener
  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(docs);
      setLoading(false);

      // resolve any new ownerIds we haven't seen yet
      const newOwnerIds = [...new Set(docs.map(t => t.ownerId).filter(Boolean))];
      const unresolved  = newOwnerIds.filter(id => !agentCache[id]);

      if (unresolved.length > 0) {
        const resolved = await Promise.all(
          unresolved.map(async id => [id, await resolveAgentName(db, id)])
        );
        setAgentNames(prev => ({ ...prev, ...Object.fromEntries(resolved) }));
      } else {
        // trigger re-render to pick up cached names
        setAgentNames({ ...agentCache });
      }
    });
    return () => unsub();
  }, []);

  // ── filtered list
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const term        = search.toLowerCase();
      const matchSearch = !term
        || t.reference?.toLowerCase().includes(term)
        || t.customerPhone?.toLowerCase().includes(term)
        || t.propertyId?.toLowerCase().includes(term)
        || (agentNames[t.ownerId] || '').toLowerCase().includes(term);
      return matchStatus && matchSearch;
    });
  }, [transactions, statusFilter, search, agentNames]);

  // ── summary (all completed transactions only)
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
        <SummaryCard label="Company (60%)"    value={fmt(summary.company)}    sub="Net earnings"                 accent="#10b981" />
        <SummaryCard label="Agent Payouts (40%)" value={fmt(summary.agentCuts)} sub="Across all agents"          accent="#f59e0b" />
        <SummaryCard label="All Transactions" value={transactions.length}     sub="Including pending/failed"     accent="#64748b" />
      </div>

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
      </div>

      {/* ── Table ── */}
      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>Loading transactions…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>No transactions found.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Date', 'Reference', 'Agent', 'Property ID', 'Customer Phone',
                  'Amount', 'Agent 40%', 'Company 60%', 'Status'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const amount    = t.amount || 0;
                const agentCut  = amount * PAYOUT_RATIO;
                const companyCut= amount * COMPANY_RATIO;
                const sc        = STATUS_COLORS[t.status] || STATUS_COLORS.pending;
                return (
                  <tr key={t.id} style={styles.tr}>
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
  page:      { minHeight: '100vh', backgroundColor: '#0f172a', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' },
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
