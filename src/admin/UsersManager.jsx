import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Trash2, Search, X, User, Mail, Phone, CreditCard,
  Calendar, Shield, ShieldOff, ShieldCheck, ArrowLeft, AlertCircle, CheckCircle
} from 'lucide-react';
import { db, auth } from '../Config/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useDebounce } from './shared/useDebounce';
import { Pagination } from './shared/Pagination';

// ── Style tokens (mirrors Sidebar palette) ────────────────────────
export const T = {
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

export const roleMeta = (role) => {
  if (role === 'manager')       return { color: T.purple, bg: T.purpleSub, label: 'Manager' };
  if (role === 'agent')         return { color: T.blue,   bg: T.blueSub,   label: 'Agent' };
  if (role === 'registration_officer') return { color: T.accent, bg: T.accentSub, label: 'Registration Officer' };
  if (role === 'customer_care') return { color: T.accent, bg: T.accentSub, label: 'Customer Care' };
  if (role === 'auditor')       return { color: T.accent, bg: T.accentSub, label: 'Auditor' };
  if (role === 'officer')       return { color: T.accent, bg: T.accentSub, label: 'Officer' };
  if (role === 'landlord')      return { color: '#FB923C', bg: 'rgba(251,146,60,0.12)', label: 'Landlord' };
  if (role === 'property_owner' || role === 'property owner')
                                return { color: '#FB923C', bg: 'rgba(251,146,60,0.12)', label: 'Property Owner' };
  return { color: T.green, bg: T.greenSub, label: role ? role.charAt(0).toUpperCase()+role.slice(1) : 'Client' };
};

// Accepts Firestore Timestamps, { seconds } objects, JS Dates and ISO strings —
// mobile docs store Timestamps while officer docs store ISO strings.
export const fmt = (value) => {
  if (!value) return 'N/A';
  try {
    let date;
    if (typeof value.toDate === 'function') date = value.toDate();
    else if (typeof value === 'object' && 'seconds' in value) date = new Date(value.seconds * 1000);
    else date = new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'N/A';
  }
};

// Normalise any stored date form to epoch millis for sorting; unknown/missing → 0
// (so undated legacy docs sort to the bottom of a newest-first list).
export const toMillis = (value) => {
  if (!value) return 0;
  try {
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value === 'object' && 'seconds' in value) return value.seconds * 1000;
    const t = new Date(value).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
};

const BLACKLIST_REASONS = [
  'Suspected Fraud',
  'Breaking User Guidelines',
  'Spam Activity',
  'Identity Misrepresentation',
];

// Roles whose accounts go through admin identity verification.
const VERIFIABLE_ROLES = ['agent', 'property_owner', 'property owner', 'landlord'];

// ── Full-window User Detail View ───────────────────────────────────
export const UserDetailView = ({
  user, onBack, onBlacklisted, onDeleted, onVerified, initialTab = 'profile',
}) => {
  const [tab, setTab]       = useState(initialTab);
  const [blReason, setBlReason] = useState(BLACKLIST_REASONS[0]);
  const [blNotes, setBlNotes]   = useState('');
  const [blLoading, setBlLoading] = useState(false);
  const [blDone, setBlDone]     = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]   = useState('');
  const [pwDone, setPwDone]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── ID-document lightbox state ──
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const stripRef = useRef(null);
  const idDocs = [
    { label: 'NRC — Front', url: user.nrcFrontURL },
    { label: 'NRC — Back',  url: user.nrcBackURL },
    { label: 'Selfie + NRC', url: user.nrcSelfieURL },
  ];
  const availableDocs = idDocs.filter((d) => d.url);

  // Close on Escape while the lightbox is open.
  useEffect(() => {
    if (lightboxIndex === null) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setLightboxIndex(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex]);

  // Scroll the clicked document into view when the lightbox opens.
  useEffect(() => {
    if (lightboxIndex !== null && stripRef.current) {
      const child = stripRef.current.children[lightboxIndex];
      if (child && child.scrollIntoView) child.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }, [lightboxIndex]);

  // ── Verification state ──
  const isVerifiable = VERIFIABLE_ROLES.includes(user.role);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rejectMode, setRejectMode]       = useState(false);
  const [rejectReason, setRejectReason]   = useState('');
  // An owner/agent with no explicit status is a legacy account — surface it as
  // 'pending' here so staff can formally review it. (The mobile app separately
  // grandfathers these accounts in so they aren't locked out in the meantime.)
  const [vStatus, setVStatus] = useState(
    user.verificationStatus || (isVerifiable ? 'pending' : null)
  );
  const vMeta = vStatus === 'approved' ? { c: T.green, b: T.greenSub }
    : vStatus === 'rejected' ? { c: T.red, b: T.redSub }
    : { c: T.accent, b: T.accentSub };

  const handleVerifyDecision = async (decision) => {
    setVerifyLoading(true);
    try {
      const updates = decision === 'approve'
        ? {
            verificationStatus: 'approved',
            isActive: true,
            rejectionReason: null,
            verifiedAt: new Date().toISOString(),
            verifiedBy: auth.currentUser?.uid || null,
            // One-time flag: the mobile app shows a "you're verified" message on
            // the user's next login, then clears this.
            pendingApprovalNotice: true,
          }
        : {
            verificationStatus: 'rejected',
            isActive: false,
            rejectionReason: rejectReason.trim() || 'Not specified',
            verifiedAt: new Date().toISOString(),
            verifiedBy: auth.currentUser?.uid || null,
          };
      await updateDoc(doc(db, 'users', user.id), updates);
      setVStatus(updates.verificationStatus);
      setRejectMode(false);
      onVerified?.(user.id, updates);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyLoading(false);
    }
  };

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
    ...(isVerifiable ? [{ key: 'verification', label: vStatus === 'pending' ? 'Verification •' : 'Verification' }] : []),
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
              {(() => {
                let label = '✓ Active', col = T.green, bgc = T.greenSub;
                if (user.blacklisted) { label = '⛔ Blacklisted'; col = T.red; bgc = T.redSub; }
                else if (isVerifiable && vStatus === 'pending') { label = '⏳ Pending Verification'; col = T.accent; bgc = T.accentSub; }
                else if (isVerifiable && vStatus === 'rejected') { label = '✕ Verification Rejected'; col = T.red; bgc = T.redSub; }
                return (
                  <span style={{
                    background: bgc, color: col,
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    padding: '4px 14px', borderRadius: 20,
                  }}>
                    {label}
                  </span>
                );
              })()}
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

        {/* ── VERIFICATION TAB */}
        {tab === 'verification' && (
          <div style={{ maxWidth: 640 }}>
            <div style={{
              background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`,
              padding: 24, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <ShieldCheck size={20} style={{ color: T.accent }} />
                <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16 }}>Identity Verification</div>
                <span style={{
                  marginLeft: 'auto', background: vMeta.b, color: vMeta.c,
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
                  padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase',
                }}>
                  {vStatus || 'N/A'}
                </span>
              </div>

              {/* Document thumbnails — click opens the in-page lightbox */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {idDocs.map((d) => (
                  <div key={d.label}>
                    <div style={{
                      color: T.textSecondary, fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
                    }}>{d.label}</div>
                    {d.url ? (
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(availableDocs.findIndex((x) => x.label === d.label))}
                        title="Click to view"
                        style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        <img src={d.url} alt={d.label} style={{
                          width: '100%', height: 120, objectFit: 'cover',
                          borderRadius: 10, border: `1px solid ${T.border}`, display: 'block',
                        }} />
                      </button>
                    ) : (
                      <div style={{
                        height: 120, borderRadius: 10, border: `1px dashed ${T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: T.textSecondary, fontSize: 12,
                      }}>
                        Not provided
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ID numbers */}
              <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: T.textSecondary, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>NRC Number</div>
                  <div style={{ color: T.textPrimary, fontSize: 14, marginTop: 4 }}>{user.nrcNumber || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: T.textSecondary, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>ZIEA Number</div>
                  <div style={{ color: T.textPrimary, fontSize: 14, marginTop: 4 }}>{user.zieaNumber || 'N/A'}</div>
                </div>
              </div>

              {vStatus === 'rejected' && user.rejectionReason && (
                <div style={{ marginTop: 18, color: T.red, fontSize: 13 }}>
                  Rejection reason: {user.rejectionReason}
                </div>
              )}
            </div>

            {/* Decision actions */}
            {!rejectMode ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => handleVerifyDecision('approve')} disabled={verifyLoading || vStatus === 'approved'}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    background: T.green, border: 'none', color: '#06281a', fontWeight: 700,
                    cursor: vStatus === 'approved' ? 'not-allowed' : 'pointer',
                    opacity: vStatus === 'approved' ? 0.5 : 1,
                    fontFamily: T.font, fontSize: 13,
                  }}>
                  {vStatus === 'approved' ? 'Already Approved' : (verifyLoading ? 'Saving…' : '✓ Approve Account')}
                </button>
                <button onClick={() => setRejectMode(true)} disabled={verifyLoading}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    background: T.redSub, border: `1px solid ${T.red}`, color: T.red, fontWeight: 700,
                    cursor: 'pointer', fontFamily: T.font, fontSize: 13,
                  }}>
                  ✕ Reject
                </button>
              </div>
            ) : (
              <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20 }}>
                <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Reason for rejection
                </label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                  placeholder="Explain what's wrong with the documents…"
                  style={{
                    width: '100%', background: T.bg, border: `1px solid ${T.border}`,
                    borderRadius: 10, color: T.textPrimary, padding: '11px 14px',
                    fontSize: 13, fontFamily: T.font, outline: 'none', resize: 'none',
                    boxSizing: 'border-box', marginBottom: 16,
                  }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setRejectMode(false)} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, background: 'none',
                    border: `1px solid ${T.border}`, color: T.textSecondary, cursor: 'pointer',
                    fontFamily: T.font, fontSize: 13,
                  }}>
                    Cancel
                  </button>
                  <button onClick={() => handleVerifyDecision('reject')} disabled={verifyLoading} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, background: T.red, border: 'none',
                    color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: T.font, fontSize: 13,
                  }}>
                    {verifyLoading ? 'Saving…' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}
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

      {/* ── Identity-document lightbox (in-page, blurred backdrop, scrollable) */}
      {lightboxIndex !== null && availableDocs[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(8,12,20,0.72)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', flexShrink: 0,
          }}>
            <span style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>
              Identity documents — {user.username || user.email}
            </span>
            <button onClick={() => setLightboxIndex(null)} aria-label="Close" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 20, cursor: 'pointer',
              background: 'rgba(255,255,255,0.1)', border: `1px solid ${T.border}`, color: T.textPrimary,
            }}>
              <X size={20} />
            </button>
          </div>

          <div ref={stripRef} onClick={(e) => e.stopPropagation()} style={{
            flex: 1, display: 'flex', gap: 20, overflowX: 'auto', overflowY: 'hidden',
            padding: '0 24px 24px', alignItems: 'center', scrollSnapType: 'x mandatory',
          }}>
            {availableDocs.map((d) => (
              <div key={d.label} style={{ scrollSnapAlign: 'center', flex: '0 0 auto', textAlign: 'center' }}>
                <img src={d.url} alt={d.label} style={{
                  maxWidth: '88vw', maxHeight: '72vh', objectFit: 'contain',
                  borderRadius: 12, border: `1px solid ${T.border}`, background: '#000', display: 'block',
                }} />
                <div style={{ color: T.textSecondary, fontSize: 13, marginTop: 10 }}>{d.label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', color: T.textSecondary, fontSize: 12, paddingBottom: 16 }}>
            Scroll sideways to compare · click outside or press Esc to close
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────
const UsersManager = () => {
  const [users, setUsers]           = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'blacklisted'
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [perPage, setPerPage]           = useState(20);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setError('Failed to load users.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, roleFilter, statusFilter]);

  const handleBlacklisted = (userId, reason) => {
    setUsers(u => u.map(x => x.id === userId ? { ...x, blacklisted: true, blacklistReason: reason } : x));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, blacklisted: true, blacklistReason: reason } : prev);
  };

  const handleDeleted = (userId) => {
    setUsers(u => u.filter(x => x.id !== userId));
  };

  const handleVerified = (userId, updates) => {
    setUsers(u => u.map(x => x.id === userId ? { ...x, ...updates } : x));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, ...updates } : prev);
  };

  const roleOptions = useMemo(
    () => [...new Set(users.map(u => u.role).filter(Boolean))].sort(),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return users
      .filter(u => {
        const matchesSearch = !term
          || u.username?.toLowerCase().includes(term)
          || u.email?.toLowerCase().includes(term)
          || u.phoneNumber?.toLowerCase().includes(term);
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'all' ? true
          : statusFilter === 'blacklisted' ? !!u.blacklisted
          : !u.blacklisted; // 'active'
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)); // newest first
  }, [users, debouncedSearch, roleFilter, statusFilter]);

  // ── If a user is selected, render the full-window detail view
  if (selectedUser) {
    return (
      <UserDetailView
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onBlacklisted={handleBlacklisted}
        onDeleted={handleDeleted}
        onVerified={handleVerified}
      />
    );
  }

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);

  const selectStyle = {
    background: T.bg, border: `1px solid ${T.border}`, borderRadius: 30,
    color: T.textPrimary, fontSize: 13, fontFamily: T.font, outline: 'none',
    padding: '9px 14px', cursor: 'pointer',
  };

  return (
    <div style={{
      background: T.bgCard, borderRadius: 20, padding: 28,
      borderTop: `4px solid ${T.accent}`,
      fontFamily: T.font,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: -0.3 }}>
            Manage Users
          </h2>
          <p style={{ color: T.textSecondary, fontSize: 12, margin: '4px 0 0', letterSpacing: 0.2 }}>
            Click any row to view full user details
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Roles</option>
            {roleOptions.map(r => (
              <option key={r} value={r}>{roleMeta(r).label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
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
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.textSecondary, fontSize: 14 }}>
            Loading database records…
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
                  {['Role', 'Username', 'Email', 'NRC Number', 'Mobile Number', 'Joined', 'Status'].map(h => (
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
                      className={user.blacklisted ? 'admin-row-alert' : 'admin-row'}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: user.blacklisted ? 'rgba(239,68,68,0.05)' : 'transparent',
                        cursor: 'pointer',
                      }}
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
                      <td style={{ padding: '14px 16px', color: T.textSecondary, whiteSpace: 'nowrap' }}>{fmt(user.createdAt)}</td>
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
                    <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: T.textSecondary }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
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

export default UsersManager;
