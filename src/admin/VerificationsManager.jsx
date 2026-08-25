import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { db } from '../Config/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { UserDetailView, T, roleMeta, fmt, toMillis } from './UsersManager';
import { useDebounce } from './shared/useDebounce';
import { Pagination } from './shared/Pagination';

// Roles that go through identity verification. Kept in sync with VERIFIABLE_ROLES
// in UsersManager.jsx (Firestore `in` accepts up to 10 values).
const VERIFIABLE_ROLES = ['agent', 'property_owner', 'property owner', 'landlord'];

// An owner/agent with no explicit status is a legacy account awaiting review.
const statusOf = (u) => u.verificationStatus || 'pending';

const STATUS_META = {
  pending:  { c: T.accent, b: T.accentSub, label: 'Pending' },
  approved: { c: T.green,  b: T.greenSub,  label: 'Approved' },
  rejected: { c: T.red,    b: T.redSub,    label: 'Rejected' },
};

const FILTERS = [
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all',      label: 'All' },
];

const VerificationsManager = () => {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(20);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', 'in', VERIFIABLE_ROLES));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error fetching verification accounts:', e);
      setError('Failed to load verification accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filter, debouncedSearch]);

  const patchUser = (userId, updates) => {
    setUsers(u => u.map(x => x.id === userId ? { ...x, ...updates } : x));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, ...updates } : prev);
  };

  const handleVerified   = (userId, updates) => patchUser(userId, updates);
  const handleBlacklisted = (userId, reason) => patchUser(userId, { blacklisted: true, blacklistReason: reason });

  const filtered = useMemo(() => {
    const t = debouncedSearch.toLowerCase();
    return users
      .filter(u => filter === 'all' ? true : statusOf(u) === filter)
      .filter(u => !t
        || u.username?.toLowerCase().includes(t)
        || u.email?.toLowerCase().includes(t)
        || u.nrcNumber?.toLowerCase().includes(t)
      )
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)); // newest first
  }, [users, filter, debouncedSearch]);

  // ── Detail view (defaults straight to the Verification tab) ──
  if (selectedUser) {
    return (
      <UserDetailView
        user={selectedUser}
        initialTab="verification"
        onBack={() => setSelectedUser(null)}
        onVerified={handleVerified}
        onBlacklisted={handleBlacklisted}
        onDeleted={(id) => { setUsers(u => u.filter(x => x.id !== id)); setSelectedUser(null); }}
      />
    );
  }

  const pendingCount = users.filter(u => statusOf(u) === 'pending').length;

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div style={{
      background: T.bgCard, borderRadius: 20, padding: 28,
      borderTop: `4px solid ${T.accent}`, fontFamily: T.font,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={22} style={{ color: T.accent }} />
          <div>
            <h2 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: -0.3 }}>
              Account Verifications
            </h2>
            <p style={{ color: T.textSecondary, fontSize: 12, margin: '4px 0 0' }}>
              Review property owner &amp; agent identity documents
              {pendingCount > 0 && <span style={{ color: T.accent, fontWeight: 700 }}> · {pendingCount} pending</span>}
            </p>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: 38, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
              background: T.bg, border: `1px solid ${T.border}`, borderRadius: 30,
              color: T.textPrimary, fontSize: 13, fontFamily: T.font, outline: 'none', width: 200,
            }}
          />
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textSecondary }} />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: filter === f.key ? T.accent : T.bg,
            color: filter === f.key ? T.bg : T.textSecondary,
            fontWeight: filter === f.key ? 700 : 500, fontFamily: T.font, fontSize: 12,
          }}>
            {f.label}
            {f.key === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.textSecondary, fontSize: 14 }}>
            Loading verification queue…
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.red, fontSize: 14 }}>
            {error}
          </div>
        ) : (
          <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Applicant', 'Role', 'NRC Number', 'ZIEA', 'Submitted', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', color: T.textSecondary, fontWeight: 600,
                    fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', textAlign: 'left',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(user => {
                const m = roleMeta(user.role);
                const s = statusOf(user);
                const sm = STATUS_META[s] || STATUS_META.pending;
                return (
                  <tr key={user.id} onClick={() => setSelectedUser(user)} className="admin-row" style={{
                    borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
                  }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: T.textPrimary, fontWeight: 600 }}>
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.username || 'Unknown')}
                      </div>
                      <div style={{ color: T.textSecondary, fontSize: 12 }}>@{user.username || 'n/a'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: m.bg, color: m.color, padding: '4px 12px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>{m.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: T.textSecondary }}>{user.nrcNumber || 'N/A'}</td>
                    <td style={{ padding: '14px 16px', color: T.textSecondary }}>{user.zieaNumber || '—'}</td>
                    <td style={{ padding: '14px 16px', color: T.textSecondary }}>{fmt(user.createdAt)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: sm.b, color: sm.c, padding: '4px 12px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                      }}>{sm.label}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: T.textSecondary }}>
                    No accounts in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={perPage}
            onPageChange={setCurrentPage}
            pageSizeOptions={[20, 40, 60]}
            onPageSizeChange={(n) => { setPerPage(n); setCurrentPage(1); }}
            theme={{ text: T.textSecondary, bg: T.bg, accent: T.accent, font: T.font }}
          />
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationsManager;
