// TransactionDetail.jsx
// Standalone, full-window view of a single transaction. Opened in-window from the
// audit/Treasury table via React Router. Wrapped by ProtectedRoute, so Firebase
// auth gates access.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';

// Keep in sync with the deployed split (lister 60% / company 40%).
const PAYOUT_RATIO  = 0.6;
const COMPANY_RATIO = 0.4;

const STATUS_COLORS = {
  completed:  { bg: '#d1fae5', color: '#065f46' },
  pending:    { bg: '#fef9c3', color: '#854d0e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  failed:     { bg: '#fee2e2', color: '#991b1b' },
};

// Accept Firestore Timestamps, { seconds }, JS Dates and ISO strings.
const toDateObj = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (typeof ts === 'object' && 'seconds' in ts) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

const Shell = ({ children }) => (
  <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>{children}</div>
  </div>
);

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'transactions', id));
        if (!active) return;
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() };
        setTxn(data);
        setLoading(false);

        if (data.ownerId) {
          try {
            const uSnap = await getDoc(doc(db, 'users', data.ownerId));
            if (active && uSnap.exists()) {
              const { firstName, lastName, username } = uSnap.data();
              setAgentName([firstName, lastName].filter(Boolean).join(' ') || username || data.ownerId);
            }
          } catch (_) { /* name is best-effort */ }
        }
      } catch (e) {
        console.error('Failed to load transaction:', e);
        if (active) { setNotFound(true); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    document.title = txn ? `Transaction ${txn.reference || txn.id}` : 'Transaction';
  }, [txn]);

  if (loading) return <Shell><p style={{ color: '#94a3b8' }}>Loading transaction…</p></Shell>;
  if (notFound) return <Shell><p style={{ color: '#f87171' }}>Transaction not found.</p></Shell>;

  const fmtMoney = (n) => `ZMW ${Number(n || 0).toFixed(2)}`;
  const created = toDateObj(txn.createdAt);
  const amount = txn.amount || 0;
  const sc = STATUS_COLORS[txn.status] || STATUS_COLORS.pending;

  const rows = [
    ['Date',               created ? created.toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
    ['Time',               created ? created.toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'],
    ['Reference',          txn.reference || txn.id],
    ['Transaction ID',     txn.id],
    ['Agent / Lister',     agentName || txn.ownerId || '—'],
    ['Agent ID',           txn.ownerId || '—'],
    ['Property ID',        txn.propertyId || '—'],
    ['Customer Phone',     txn.customerPhone || '—'],
    ['Amount',             fmtMoney(amount)],
    ['Agent payout (60%)', fmtMoney(amount * PAYOUT_RATIO)],
    ['Company share (40%)', fmtMoney(amount * COMPANY_RATIO)],
    ['Payout status',      txn.payoutStatus || '—'],
    ['Payout reference',   txn.payoutReference || '—'],
  ];

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: 0 }}>Transaction Details</h1>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontFamily: 'monospace', fontSize: 13 }}>{txn.reference || txn.id}</p>
        </div>
        <span style={{ background: sc.bg, color: sc.color, padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
          {txn.status || 'unknown'}
        </span>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 14, overflow: 'hidden', border: '1px solid #334155' }}>
        {rows.map(([label, value], i) => (
          <div key={label} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: i < rows.length - 1 ? '1px solid #334155' : 'none' }}>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, width: 180, flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, wordBreak: 'break-all' }}>{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/portal-mgmt-xyz99/audits')}
        style={{ marginTop: 24, padding: '10px 20px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#cbd5e1', cursor: 'pointer', fontSize: 14 }}
      >
        ← Back to transactions
      </button>
    </Shell>
  );
}
