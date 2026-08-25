// AdminAnalytics.jsx
// Growth dashboard for the Accounts area. Hand-rolled SVG charts (no charting
// dependency) over Firestore data, with a Daily / Monthly / Yearly toggle.
// Metrics: Revenue, New sign-ups, New listings, Contact reveals.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { TrendingUp, Users as UsersIcon, Home as HomeIcon, Eye, RefreshCw } from 'lucide-react';
import { T, toMillis } from './UsersManager';

const GRANULARITIES = [
  { key: 'daily',   label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly',  label: 'Yearly' },
];

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Build the ordered, contiguous time buckets for the selected granularity.
function buildBuckets(granularity) {
  const now = new Date();
  const out = [];
  if (granularity === 'daily') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      out.push({ key: ymd(d), label: `${d.getDate()}/${d.getMonth() + 1}` });
    }
  } else if (granularity === 'monthly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }) });
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const y = now.getFullYear() - i;
      out.push({ key: `${y}`, label: `${y}` });
    }
  }
  return out;
}

// Map a timestamp to the bucket key used by buildBuckets for this granularity.
function keyForTs(ts, granularity) {
  if (!ts) return null;
  const d = new Date(ts);
  if (granularity === 'daily') return ymd(d);
  if (granularity === 'monthly') return `${d.getFullYear()}-${d.getMonth()}`;
  return `${d.getFullYear()}`;
}

// ── Reusable SVG chart (line+area or bars) ──────────────────────────────────
function Chart({ data, labels, color, formatY = (v) => v, type = 'line' }) {
  const W = 1000, H = 300, padL = 64, padR = 20, padT = 20, padB = 38;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = data.length || 1;
  const max = Math.max(1, ...data);
  const xPoint = (i) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const xBand  = (i) => padL + (i + 0.5) * (innerW / n);
  const y = (v) => padT + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  const barW = (innerW / n) * 0.6;
  const gid = `g-${color.replace('#', '')}-${type}`;

  const lineX = type === 'bar' ? xBand : xPoint;
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${lineX(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const baseline = (padT + innerH).toFixed(1);
  const areaPath = data.length
    ? `${linePath} L ${lineX(n - 1).toFixed(1)},${baseline} L ${lineX(0).toFixed(1)},${baseline} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines + y labels */}
      {ticks.map((t, i) => {
        const gy = padT + innerH - t * innerH;
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke={T.border} strokeWidth="1" />
            <text x={padL - 10} y={gy + 4} textAnchor="end" fontSize="12" fill={T.textSecondary} fontFamily={T.font}>
              {formatY(max * t)}
            </text>
          </g>
        );
      })}

      {/* data */}
      {type === 'line' ? (
        <>
          <path d={areaPath} fill={`url(#${gid})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((v, i) => (
            <circle key={i} cx={xPoint(i)} cy={y(v)} r="3" fill={color}>
              <title>{`${labels[i]}: ${formatY(v)}`}</title>
            </circle>
          ))}
        </>
      ) : (
        data.map((v, i) => {
          const bh = (v / max) * innerH;
          return (
            <rect key={i} x={xBand(i) - barW / 2} y={padT + innerH - bh} width={barW} height={bh} rx="3" fill={color}>
              <title>{`${labels[i]}: ${formatY(v)}`}</title>
            </rect>
          );
        })
      )}

      {/* x labels */}
      {labels.map((lb, i) => (i % labelEvery === 0 ? (
        <text key={i} x={type === 'bar' ? xBand(i) : xPoint(i)} y={H - 12} textAnchor="middle" fontSize="12" fill={T.textSecondary} fontFamily={T.font}>
          {lb}
        </text>
      ) : null))}
    </svg>
  );
}

// ── One metric card (header total + chart) ──────────────────────────────────
function MetricCard({ icon, title, total, color, data, labels, formatY, type }) {
  return (
    <div style={{ background: T.bgCard, borderRadius: 18, border: `1px solid ${T.border}`, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span style={{ display: 'flex', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', background: `${color}22`, color }}>
          {icon}
        </span>
        <div>
          <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</div>
          <div style={{ color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>{total}</div>
        </div>
      </div>
      <Chart data={data} labels={labels} color={color} formatY={formatY} type={type} />
    </div>
  );
}

export default function AdminAnalytics() {
  const [granularity, setGranularity] = useState('monthly');
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const activeRef = useRef(true);

  useEffect(() => () => { activeRef.current = false; }, []);

  // Shared by the mount effect and the manual Refresh button. NOTE: the 4
  // getDocs calls below are intentionally left unbounded (no date-range
  // where() clause) — functions/index.js writes officer-created users'
  // createdAt as a plain ISO string while other flows use serverTimestamp(),
  // so a server-side Timestamp range filter would silently drop those rows.
  // Client-side bucketing (below) already tolerates the mixed shapes via
  // toMillis(); that's the correct place to handle it, not a Firestore query.
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [txn, users, houses, products] = await Promise.all([
        getDocs(collection(db, 'transactions')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'houses')),
        getDocs(collection(db, 'products')),
      ]);
      if (!activeRef.current) return;
      setRaw({
        transactions: txn.docs.map((d) => d.data()),
        users: users.docs.map((d) => d.data()),
        houses: houses.docs.map((d) => d.data()),
        products: products.docs.map((d) => d.data()),
      });
      setLastFetchedAt(new Date());
    } catch (e) {
      console.error('Analytics load failed:', e);
      if (activeRef.current) setError('Failed to load analytics data.');
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const { labels, series } = useMemo(() => {
    const buckets = buildBuckets(granularity);
    const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
    const zero = () => buckets.map(() => 0);
    const revenue = zero(), reveals = zero(), signups = zero(), listings = zero();

    if (raw) {
      raw.transactions.forEach((t) => {
        if (t.status !== 'completed') return;
        const i = idx[keyForTs(toMillis(t.createdAt), granularity)];
        if (i === undefined) return;
        revenue[i] += Number(t.amount || 0);
        reveals[i] += 1;
      });
      raw.users.forEach((u) => {
        const i = idx[keyForTs(toMillis(u.createdAt), granularity)];
        if (i !== undefined) signups[i] += 1;
      });
      [...raw.houses, ...raw.products].forEach((l) => {
        const i = idx[keyForTs(toMillis(l.createdAt), granularity)];
        if (i !== undefined) listings[i] += 1;
      });
    }
    return { labels: buckets.map((b) => b.label), series: { revenue, reveals, signups, listings } };
  }, [raw, granularity]);

  const sum = (arr) => arr.reduce((s, n) => s + n, 0);
  const money = (n) => `ZMW ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const moneyAxis = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${Math.round(n)}`);
  const intAxis = (n) => `${Math.round(n)}`;

  const windowLabel = granularity === 'daily' ? 'last 30 days' : granularity === 'monthly' ? 'last 12 months' : 'last 5 years';

  // Dark panel so the header text is readable on the light admin layout
  // background (the cards carry their own dark bg; the page header didn't).
  const panel = { fontFamily: T.font, background: T.bg, borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' };

  if (loading) {
    return <div style={{ ...panel, color: T.textSecondary }}>Loading analytics…</div>;
  }
  if (error) {
    return <div style={{ ...panel, color: T.red }}>{error}</div>;
  }

  return (
    <div style={panel}>
      {/* Header + granularity toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingUp size={24} style={{ color: T.accent }} />
          <div>
            <h1 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: -0.3 }}>Analytics</h1>
            <p style={{ color: T.textSecondary, fontSize: 12, margin: '4px 0 0' }}>Growth & performance · {windowLabel}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button
              onClick={loadAnalytics}
              disabled={loading}
              title="Refresh analytics data"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`,
                background: T.bgCard, color: T.textPrimary, fontFamily: T.font, fontSize: 12, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            {lastFetchedAt && (
              <span style={{ color: T.textSecondary, fontSize: 10 }}>
                Updated {lastFetchedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, background: T.bgCard, padding: 5, borderRadius: 14, border: `1px solid ${T.border}` }}>
            {GRANULARITIES.map((g) => (
              <button key={g.key} onClick={() => setGranularity(g.key)} style={{
                padding: '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: T.font, fontSize: 13, fontWeight: 700,
                background: granularity === g.key ? T.accent : 'transparent',
                color: granularity === g.key ? T.bg : T.textSecondary,
              }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 20 }}>
        <MetricCard
          icon={<TrendingUp size={18} />} title="Revenue" color="#6366f1" type="line"
          total={money(sum(series.revenue))} data={series.revenue} labels={labels} formatY={moneyAxis}
        />
        <MetricCard
          icon={<UsersIcon size={18} />} title="New Sign-ups" color="#22C55E" type="bar"
          total={`${sum(series.signups)}`} data={series.signups} labels={labels} formatY={intAxis}
        />
        <MetricCard
          icon={<HomeIcon size={18} />} title="New Listings" color="#F5A623" type="bar"
          total={`${sum(series.listings)}`} data={series.listings} labels={labels} formatY={intAxis}
        />
        <MetricCard
          icon={<Eye size={18} />} title="Contact Reveals" color="#60A5FA" type="line"
          total={`${sum(series.reveals)}`} data={series.reveals} labels={labels} formatY={intAxis}
        />
      </div>
    </div>
  );
}
