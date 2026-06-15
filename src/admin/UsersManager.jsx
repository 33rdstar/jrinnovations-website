import React, { useState, useEffect } from 'react';
import {
  Trash2, Search, X, User, Mail, Phone, CreditCard,
  Calendar, Shield, ShieldOff, ArrowLeft, AlertCircle, CheckCircle
} from 'lucide-react';
import { db, auth } from '../Config/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// ── Style tokens (mirrors Sidebar palette) ────────────────────────
const T = {
  bg:           '#0D1B2A',
  bgCard:       '#112236',
  bgRow:        '#0f1f30',
  accent:       '#F5A623',
  accentSub:    'rgba(245,166,35,0.15)',
  border:       'rgba(255,255,255,0.08)',
  borderHover:  'rgba(255,255,255,0.14)',
  textPrimary:  '#F0F4F8',
  textSecondary:'rgba(255,255,255,0.45)',
  red:          '#EF4444',
  redSub:       'rgba(239,68,68,0.12)',
  green:        '#22C55E',
  greenSub:     'rgba(34,197,94,0.12)',
  purple:       '#A78BFA',
  purpleSub:    'rgba(167,139,250,0.12)',
  blue:         '#60A5FA',
  blueSub:      'rgba(96,165,250,0.12)',
  font:         "'Inter','Segoe UI',system-ui,sans-serif",
};

const roleMeta = (role) => {
  if (role === 'manager')       return { color: T.purple, bg: T.purpleSub, label: 'Manager' };
  if (role === 'agent')         return { color: T.blue,   bg: T.blueSub,   label: 'Agent' };
  if (role === 'officer')       return { color: T.accent, bg: T.accentSub, label: 'Officer' };
  if (role === 'landlord')      return { color: '#FB923C', bg: 'rgba(251,146,60,0.12)', label: 'Landlord' };
  if (role === 'property owner')return { color: '#FB923C', bg: 'rgba(251,146,60,0.12)', label: 'Property Owner' };
  return { color: T.green, bg: T.greenSub, label: role ? role.charAt(0).toUpperCase()+role.slice(1) : 'Client' };
};

const fmt = (iso) => {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); }
  catch { return iso; }
};

const BLACKLIST_REASONS = [
  'Suspected Fraud',
  'Breaking User Guidelines',
  'Spam Activity',
  'Identity Misrepresentation',
];

// ── Full-window User Detail View ───────────────────────────────────
const UserDetailView = ({ user, onBack, onBlacklisted, onDeleted }) => {
  const [tab, setTab]       = useState('profile');
  const [blReason, setBlReason] = useState(BLACKLIST_REASONS[0]);
  const [blNotes, setBlNotes]   = useState('');
  const [blLoading, setBlLoading] = useState(false);
  const [blDone, setBlDone]     = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]   = useState('');
  const [pwDone, setPwDone]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const meta = roleMeta(user.role);

  const profileInitials = (user.firstName && user.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user.username ? user.username.slice(0, 2).toUpperCase() : 'U?');

  const handleBlacklist = async () => {
    setBlLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        blacklisted: true,
        blacklistReason: blReason,
        blacklistNotes: blNotes || '',
        blacklistedAt: new Date().toISOString(),
      });
      setBlDone(true);
      onBlacklisted(user.id, blReason);
    } catch (e) { console.error(e); }
    finally { setBlLoading(false); }
  };

  const handlePasswordReset = async () => {
    setPwError('');
    setPwLoading(true);
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, user.email);
      setPwDone(true);
    } catch (e) {
      setPwError(e.message || 'Failed to send reset email.');
    } finally { setPwLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'users', user.id));
      onDeleted(user.id);
      onBack();
    } catch (e) { console.error(e); }
  };

  const tabs = [
    { key: 'profile',   label: 'Profile' },
    { key: 'blacklist', label: user.blacklisted ? 'Blacklisted ⛔' : 'Blacklist' },
    { key: 'password',  label: 'Reset Password' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: T.bg,
      zIndex: 50, fontFamily: T.font, display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* ── Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px',
        borderBottom: `1px solid ${T.border}`,
        background: T.bgCard, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.textSecondary, fontFamily: T.font, fontSize: 13,
          padding: '6px 12px', borderRadius: 8,
          transition: 'color 0.15s, background 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = T.textPrimary; e.currentTarget.style.background = T.border; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.textSecondary; e.currentTarget.style.background = 'none'; }}
        >
          <ArrowLeft size={16} /> Back to Users
        </button>

        {/* Delete button — top right */}
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: T.redSub, border: `1px solid ${T.red}`,
            color: T.red, borderRadius: 10, padding: '8px 18px',
            cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 600,
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Trash2 size={15} /> Delete User
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: T.red, fontSize: 13 }}>Are you sure?</span>
            <button onClick={handleDelete} style={{
              background: T.red, border: 'none', color: '#fff',
              borderRadius: 10, padding: '8px 18px', cursor: 'pointer',
              fontFamily: T.font, fontSize: 13, fontWeight: 700,
            }}>Yes, Delete</button>
            <button onClick={() => setDeleteConfirm(false)} style={{
              background: 'none', border: `1px solid ${T.border}`, color: T.textSecondary,
              borderRadius: 10, padding: '8px 18px', cursor: 'pointer',
              fontFamily: T.font, fontSize: 13,
            }}>Cancel</button>
          </div>
        )}
      </div>

      {/* ── Body */}
      <div style={{
        flex: 1, maxWidth: 760, width: '100%',
        margin: '0 auto', padding: '40px 32px',
        boxSizing: 'border-box',
      }}>

        {/* Hero row */}
        <div style={{
          display: 'flex', gap: 24, alignItems: 'flex-start',
          marginBottom: 36,
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.username}
                style={{
                  width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                  border: `3px solid ${meta.color}`,
                }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: meta.bg, border: `3px solid ${meta.color}`,
              display: user.photoURL ? 'none' : 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: meta.color, fontWeight: 800, fontSize: 28, letterSpacing: 1,
            }}>
              {profileInitials}
            </div>
            <span style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 16, height: 16, borderRadius: '50%',
              background: user.blacklisted ? T.red : T.green,
              border: `2.5px solid ${T.bg}`,
            }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 24, letterSpacing: -0.3 }}>
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username || 'Unknown User'}
            </div>
            {user.username && user.firstName && (
              <div style={{ color: T.textSecondary, fontSize: 13, marginTop: 2 }}>@{user.username}</div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                background: meta.bg, color: meta.color,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase',
              }}>
                {meta.label}
              </span>
              <span style={{
                background: user.blacklisted ? T.redSub : T.greenSub,
                color: user.blacklisted ? T.red : T.green,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                padding: '4px 14px', borderRadius: 20,
              }}>
                {user.blacklisted ? '⛔ Blacklisted' : '✓ Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${T.border}`,
          marginBottom: 28, gap: 0,
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 20px', fontSize: 13, fontFamily: T.font,
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? T.accent : T.textSecondary,
              borderBottom: tab === t.key ? `2px solid ${T.accent}` : '2px solid transparent',
              letterSpacing: 0.3, transition: 'color 0.15s',
              marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB */}
        {tab === 'profile' && (
          <div style={{
            background: T.bgCard, borderRadius: 16,
            border: `1px solid ${T.border}`, overflow: 'hidden',
          }}>
            {[
              { icon: <Mail size={15} />,       label: 'Email',           value: user.email },
              { icon: <Phone size={15} />,      label: 'Phone',           value: user.phoneNumber || 'N/A' },
              { icon: <CreditCard size={15} />, label: 'NRC Number',      value: user.nrcNumber || 'N/A' },
              { icon: <User size={15} />,       label: 'Gender',          value: user.gender || 'N/A' },
              { icon: <Shield size={15} />,     label: 'User ID',         value: user.userId || user.id },
              { icon: <Calendar size={15} />,   label: 'Joined',          value: fmt(user.createdAt) },
              ...(user.zieaNumber ? [{ icon: <CreditCard size={15} />, label: 'ZIEA Number', value: user.zieaNumber }] : []),
              ...(user.blacklisted ? [
                { icon: <ShieldOff size={15} />, label: 'Blacklist Reason', value: user.blacklistReason || 'N/A', warn: true },
                { icon: <Calendar size={15} />,  label: 'Blacklisted On',   value: fmt(user.blacklistedAt), warn: true },
                ...(user.blacklistNotes ? [{ icon: <AlertCircle size={15} />, label: 'Notes', value: user.blacklistNotes, warn: true }] : []),
              ] : []),
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 24px',
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <span style={{ color: row.warn ? T.red : T.accent, flexShrink: 0 }}>{row.icon}</span>
                <span style={{
                  color: T.textSecondary, fontSize: 12, fontWeight: 600,
                  letterSpacing: 0.4, textTransform: 'uppercase', width: 130, flexShrink: 0,
                }}>
                  {row.label}
                </span>
                <span style={{
                  color: row.warn ? T.red : T.textPrimary,
                  fontSize: 14, fontWeight: 500, wordBreak: 'break-all',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── BLACKLIST TAB */}
        {tab === 'blacklist' && (
          <div style={{ maxWidth: 500 }}>
            {blDone || user.blacklisted ? (
              <div style={{
                background: T.bgCard, borderRadius: 16, border: `1px solid ${T.red}`,
                padding: 32, textAlign: 'center',
              }}>
                <ShieldOff size={44} style={{ color: T.red, marginBottom: 14 }} />
                <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                  User Blacklisted
                </div>
                <div style={{ color: T.textSecondary, fontSize: 14 }}>
                  Reason: <span style={{ color: T.red }}>{user.blacklistReason || blReason}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
                <div style={{
                  background: T.redSub, border: `1px solid rgba(239,68,68,0.25)`,
                  borderRadius: 12, padding: '12px 16px', marginBottom: 22,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <AlertCircle size={16} style={{ color: T.red, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
                    Blacklisting <span style={{ color: T.textPrimary, fontWeight: 600 }}>{user.username || user.email}</span> will
                    prevent them from accessing the platform. This action is logged.
                  </div>
                </div>

                <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 700,
                  letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Reason
                </label>
                <select value={blReason} onChange={e => setBlReason(e.target.value)} style={{
                  width: '100%', background: T.bg, border: `1px solid ${T.border}`,
                  borderRadius: 10, color: T.textPrimary, padding: '11px 14px',
                  fontSize: 13, marginBottom: 18, fontFamily: T.font, outline: 'none',
                  boxSizing: 'border-box',
                }}>
                  {BLACKLIST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 700,
                  letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Notes <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea value={blNotes} onChange={e => setBlNotes(e.target.value)} rows={3}
                  placeholder="Additional context…"
                  style={{
                    width: '100%', background: T.bg, border: `1px solid ${T.border}`,
                    borderRadius: 10, color: T.textPrimary, padding: '11px 14px',
                    fontSize: 13, marginBottom: 22, fontFamily: T.font,
                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setTab('profile')} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    background: 'none', border: `1px solid ${T.border}`,
                    color: T.textSecondary, cursor: 'pointer', fontFamily: T.font, fontSize: 13,
                  }}>
                    Cancel
                  </button>
                  <button onClick={handleBlacklist} disabled={blLoading} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    background: T.red, border: 'none',
                    color: '#fff', cursor: 'pointer', fontWeight: 700,
                    fontFamily: T.font, fontSize: 13, opacity: blLoading ? 0.7 : 1,
                  }}>
                    {blLoading ? 'Processing…' : 'Confirm Blacklist'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASSWORD TAB */}
        {tab === 'password' && (
          <div style={{ maxWidth: 500 }}>
            <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 28 }}>
              {pwDone ? (
                <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                  <CheckCircle size={44} style={{ color: T.green, marginBottom: 14 }} />
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                    Reset Email Sent
                  </div>
                  <div style={{ color: T.textSecondary, fontSize: 14 }}>
                    A password reset link was sent to{' '}
                    <span style={{ color: T.accent }}>{user.email}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    background: T.accentSub, border: `1px solid rgba(245,166,35,0.25)`,
                    borderRadius: 12, padding: '12px 16px', marginBottom: 22,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <AlertCircle size={16} style={{ color: T.accent, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ color: T.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
                      Firebase Client SDK cannot change another user's password directly.
                      This will send a <span style={{ color: T.accent }}>password reset email</span> to{' '}
                      <span style={{ color: T.textPrimary }}>{user.email}</span>.
                    </div>
                  </div>

                  {pwError && (
                    <div style={{
                      background: T.redSub, border: `1px solid ${T.red}`, borderRadius: 10,
                      padding: '10px 14px', marginBottom: 16, color: T.red, fontSize: 13,
                    }}>
                      {pwError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setTab('profile')} style={{
                      flex: 1, padding: '12px 0', borderRadius: 12,
                      background: 'none', border: `1px solid ${T.border}`,
                      color: T.textSecondary, cursor: 'pointer', fontFamily: T.font, fontSize: 13,
                    }}>
                      Cancel
                    </button>
                    <button onClick={handlePasswordReset} disabled={pwLoading} style={{
                      flex: 1, padding: '12px 0', borderRadius: 12,
                      background: T.accent, border: 'none',
                      color: T.bg, cursor: 'pointer', fontWeight: 700,
                      fontFamily: T.font, fontSize: 13, opacity: pwLoading ? 0.7 : 1,
                    }}>
                      {pwLoading ? 'Sending…' : 'Send Reset Email'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────
const UsersManager = () => {
  const [users, setUsers]           = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading]       = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [perPage, setPerPage]           = useState(20);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleBlacklisted = (userId, reason) => {
    setUsers(u => u.map(x => x.id === userId ? { ...x, blacklisted: true, blacklistReason: reason } : x));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, blacklisted: true, blacklistReason: reason } : prev);
  };

  const handleDeleted = (userId) => {
    setUsers(u => u.filter(x => x.id !== userId));
  };

  // ── If a user is selected, render the full-window detail view
  if (selectedUser) {
    return (
      <UserDetailView
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onBlacklisted={handleBlacklisted}
        onDeleted={handleDeleted}
      />
    );
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages   = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div style={{
      background: T.bgCard, borderRadius: 20, padding: 28,
      borderTop: `4px solid ${T.accent}`,
      fontFamily: T.font,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: -0.3 }}>
            Manage Users
          </h2>
          <p style={{ color: T.textSecondary, fontSize: 12, margin: '4px 0 0', letterSpacing: 0.2 }}>
            Click any row to view full user details
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search users…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: 38, paddingRight: 16, paddingTop: 9, paddingBottom: 9,
              background: T.bg, border: `1px solid ${T.border}`, borderRadius: 30,
              color: T.textPrimary, fontSize: 13, fontFamily: T.font, outline: 'none', width: 210,
            }}
          />
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: T.textSecondary,
          }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.textSecondary, fontSize: 14 }}>
            Loading database records…
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Role', 'Username', 'Email', 'NRC Number', 'Mobile Number', 'Status'].map(h => (
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
                {paginatedUsers.map(user => {
                  const m = roleMeta(user.role);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: user.blacklisted ? 'rgba(239,68,68,0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = user.blacklisted
                        ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = user.blacklisted
                        ? 'rgba(239,68,68,0.05)' : 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: m.bg, color: m.color,
                          padding: '4px 12px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>
                          {m.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: T.textPrimary, fontWeight: 600 }}>
                        {user.username || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', color: T.textSecondary }}>{user.email}</td>
                      <td style={{ padding: '14px 16px', color: T.textSecondary }}>{user.nrcNumber || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', color: T.textSecondary }}>{user.phoneNumber || 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {user.blacklisted ? (
                          <span title={user.blacklistReason} style={{
                            background: T.redSub, color: T.red,
                            padding: '4px 12px', borderRadius: 20,
                            fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                          }}>Blacklisted</span>
                        ) : (
                          <span style={{
                            background: T.greenSub, color: T.green,
                            padding: '4px 12px', borderRadius: 20,
                            fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                          }}>Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: T.textSecondary }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 20, fontSize: 12, color: T.textSecondary,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Rows per page:</span>
                {[20, 40, 60].map(n => (
                  <button key={n} onClick={() => { setPerPage(n); setCurrentPage(1); }} style={{
                    padding: '4px 12px', borderRadius: 20, border: 'none',
                    background: perPage === n ? T.accent : T.bg,
                    color: perPage === n ? T.bg : T.textSecondary,
                    fontWeight: perPage === n ? 700 : 400,
                    cursor: 'pointer', fontFamily: T.font, fontSize: 12,
                  }}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>
                  {filteredUsers.length === 0 ? '0' : (currentPage - 1) * perPage + 1}–
                  {Math.min(currentPage * perPage, filteredUsers.length)} of {filteredUsers.length}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['‹', '›'].map((arrow, ai) => {
                    const disabled = ai === 0 ? currentPage === 1 : currentPage === totalPages || totalPages === 0;
                    return (
                      <button key={arrow}
                        onClick={() => setCurrentPage(p => ai === 0 ? Math.max(p-1,1) : Math.min(p+1,totalPages))}
                        disabled={disabled}
                        style={{
                          padding: '4px 10px', borderRadius: 20, border: 'none',
                          background: T.bg, color: disabled ? T.border : T.textPrimary,
                          cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.font,
                          opacity: disabled ? 0.4 : 1,
                        }}
                      >{arrow}</button>
                    );
                  })}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx-1] > 1) acc.push('...');
                      acc.push(p); return acc;
                    }, [])
                    .map((p, idx) => p === '...'
                      ? <span key={`e${idx}`} style={{ padding: '4px 6px', color: T.textSecondary }}>…</span>
                      : (
                        <button key={p} onClick={() => setCurrentPage(p)} style={{
                          padding: '4px 10px', borderRadius: 20, border: 'none',
                          background: currentPage === p ? T.accent : T.bg,
                          color: currentPage === p ? T.bg : T.textSecondary,
                          fontWeight: currentPage === p ? 700 : 400,
                          cursor: 'pointer', fontFamily: T.font, fontSize: 12,
                        }}>{p}</button>
                      )
                    )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersManager;