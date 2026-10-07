// TransactionDetail.jsx
// Standalone, full-window view of a single transaction. Opened in-window from the
// audit/Treasury table via React Router. Wrapped by ProtectedRoute, so Firebase
// auth gates access.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { useAgentNames } from './shared/useAgentNames';

// What the lister is sent for each contact fee: a fixed K30 (never more than was paid). Keep in sync with
// AGENT_PAYOUT in the functions. Stay bookings are a different split: Yanga 12% / the business 88%.
const AGENT_PAYOUT = 30;
const STAY_COMMISSION = 0.12;

const prettyStatus = (v) => (v ? String(v).replace(/_/g, ' ') : '—');

const STATUS_COLORS = {
  completed:  { bg: '#d1fae5', color: '#065f46' },
  pending:    { bg: '#fef9c3', color: '#854d0e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  failed:     { bg: '#fee2e2', color: '#991b1b' },
};

// Accept Firestore Timestamps, { seconds }, JS Dates and ISO strings.
export const toDateObj = (ts) => {
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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payout, setPayout] = useState(undefined);   // the transfer to the lister / business: undefined = loading, null = none
  const { names: agentNames, resolveOne } = useAgentNames();

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

        if (data.ownerId) resolveOne(data.ownerId).catch(() => {});

        // The transfer that paid the lister (or, for a stay, the business) is its own record.
        try {
          if (data.purpose === 'stay' && data.bookingId) {
            const p = await getDoc(doc(db, 'stayPayouts', data.bookingId));
            if (active) setPayout(p.exists() ? p.data() : null);
          } else {
            const q = await getDocs(query(collection(db, 'payouts'), where('transactionId', '==', snap.id), limit(1)));
            if (active) setPayout(q.empty ? null : q.docs[0].data());
          }
        } catch (e) {
          console.warn('Could not load the payout record:', e.message);
          if (active) setPayout(null);
        }
      } catch (e) {
        console.error('Failed to load transaction:', e);
        if (active) { setNotFound(true); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [id, resolveOne]);

  useEffect(() => {
    document.title = txn ? `Transaction ${txn.reference || txn.id}` : 'Transaction';
  }, [txn]);

  if (loading) return <Shell><p style={{ color: '#94a3b8' }}>Loading transaction…</p></Shell>;
  if (notFound) return <Shell><p style={{ color: '#f87171' }}>Transaction not found.</p></Shell>;

  const fmtMoney = (n) => `ZMW ${Number(n || 0).toFixed(2)}`;
  const created = toDateObj(txn.createdAt);
  const amount = txn.amount || 0;
  const sc = STATUS_COLORS[txn.status] || STATUS_COLORS.pending;
  const agentName = txn.ownerId ? (agentNames[txn.ownerId] || '') : '';

  const isStay = txn.purpose === 'stay';
  const agentShare = isStay
    ? Math.round(amount * (1 - STAY_COMMISSION) * 100) / 100
    : (txn.agentPayout ?? Math.min(AGENT_PAYOUT, amount));
  const companyShare = Math.round((amount - agentShare) * 100) / 100;
  const payoutStatus = payout === undefined ? 'Loading…' : payout ? prettyStatus(payout.status) : (txn.status === 'completed' ? 'No payout recorded' : '—');
  const payoutRef = payout?.lencoReference || payout?.reference || txn.payoutReference || '—';

  const rows = [
    ['Date',               created ? created.toLocaleDateString('en-ZM', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
    ['Time',               created ? created.toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'],
    ['Type',               isStay ? 'Stay booking' : 'Contact reveal'],
    ['Reference',          txn.reference || txn.id],
    ['Transaction ID',     txn.id],
    isStay ? ['Booking ID', txn.bookingId || '—'] : ['Agent / Lister', agentName || txn.ownerId || '—'],
    isStay ? ['Business ID', txn.businessId || txn.ownerId || '—'] : ['Agent ID', txn.ownerId || '—'],
    isStay ? null : ['Property ID', txn.propertyId || '—'],
    ['Customer Phone',     txn.customerPhone || '—'],
    ['Amount',             fmtMoney(amount)],
    [isStay ? 'Business share (88%)' : 'Agent payout', fmtMoney(agentShare)],
    [isStay ? 'Yanga share (12%)' : 'Company share', fmtMoney(companyShare)],
    ['Payout status',      payoutStatus],
    ['Payout sent',        payout?.paidAt ? (toDateObj(payout.paidAt)?.toLocaleString('en-ZM') || '—') : '—'],
    ['Payout reference',   payoutRef],
    ['Payout to',          payout?.phone ? `${payout.phone}${payout.operator ? ` (${payout.operator})` : ''}` : '—'],
  ].filter(Boolean);

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
