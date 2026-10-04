import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { Check, Copy, ExternalLink, FileText, MapPin } from 'lucide-react';
import { db } from '../Config/firebaseConfig';
import { useAuth } from '../Auth/AuthContext';
import { T } from './UsersManager';
import {
  STAY_ROLES, callStay, friendlyError, kwacha, mapsLink, prettyDay, prettyTime, roleLabel, tsMillis, typeLabel,
} from '../stays/stayConfig';

const card = { background: T.bgRow, border: `0.5px solid ${T.border}`, borderRadius: 14, padding: 16 };
const btn = (bg, fg = '#0D1B2A') => ({
  background: bg, color: fg, border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
});
const ghost = { ...btn('transparent', T.textPrimary), border: `0.5px solid ${T.borderHover}` };
const chip = (c, b) => ({ background: b, color: c, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' });

const APP_STATUS = {
  pending:  chip(T.accent, T.accentSub),
  approved: chip(T.green, T.greenSub),
  rejected: chip(T.red, T.redSub),
  suspended: chip(T.red, T.redSub),
};

const useLive = (collectionName, max = 200) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(max));
    return onSnapshot(q,
      (snap) => { setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (e) => { console.error(e); setError(`Could not load ${collectionName}.`); setLoading(false); });
  }, [collectionName, max]);
  return { rows, loading, error };
};

const Row = ({ label, children }) => (
  <div style={{ display: 'flex', gap: 12, fontSize: 13, padding: '3px 0' }}>
    <span style={{ width: 130, color: T.textSecondary, flexShrink: 0 }}>{label}</span>
    <span style={{ color: T.textPrimary, wordBreak: 'break-word' }}>{children}</span>
  </div>
);

// ── Approval result (the temporary password is shown exactly once) ───────────
const fmtWhen = (ms) => (ms ? new Date(ms).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '');

// A message the admin can copy and pass on. After approval it shows the invitation email plus a
// one-time backup login; for a reissued invitation it shows the fresh email.
const CredentialsModal = ({ result, onClose, title }) => {
  const [copied, setCopied] = useState('');
  const loginUrl = `${window.location.origin}/host/login`;
  const isReissue = !!result.purpose;
  const invitation = result.inviteText || result.text || null;
  const expires = result.inviteExpiresAt || result.expiresAt || null;
  const backup = result.tempPassword
    ? `Your Yanga Homes business account is approved.\nSign in: ${loginUrl}\nEmail: ${result.email}\nTemporary password: ${result.tempPassword}\nYou will be asked to choose a new password the first time you sign in.`
    : null;

  const copy = async (key, value) => {
    try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(''), 2000); } catch { /* user can select manually */ }
  };
  const CopyBtn = ({ k, value, label }) => (
    <button style={btn(T.accent)} onClick={() => copy(k, value)}>
      {copied === k ? <><Check size={14} style={{ verticalAlign: -2 }} /> Copied</> : <><Copy size={14} style={{ verticalAlign: -2 }} /> {label}</>}
    </button>
  );
  const pre = { background: T.bgRow, border: `0.5px solid ${T.border}`, borderRadius: 10, padding: 14, color: T.textPrimary, fontSize: 12, whiteSpace: 'pre-wrap', userSelect: 'all', margin: '0 0 10px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ ...card, maxWidth: 560, width: '100%', background: T.bg }}>
        <h3 style={{ color: T.green, fontSize: 18, fontWeight: 700, margin: 0 }}>{title || (isReissue ? 'Fresh invitation' : 'Business approved')}</h3>
        <p style={{ color: T.textSecondary, fontSize: 13, margin: '8px 0 14px' }}>
          {result.emailSent
            ? <>An email with a link to {result.purpose === 'reset' ? 'choose a new' : 'set a'} password has been sent to <strong style={{ color: T.textPrimary }}>{result.email}</strong>. Ask them to check their spam folder too.</>
            : <><strong style={{ color: T.red }}>The email could not be sent{result.emailError ? ` (${result.emailError})` : ''}.</strong> Copy the message below and send it to the owner yourself.</>}
        </p>

        {invitation && (
          <>
            <p style={{ color: T.textSecondary, fontSize: 12, margin: '0 0 6px' }}>
              Copy of the invitation email{expires ? <> — the link works <strong style={{ color: T.accent }}>once</strong>, until {fmtWhen(expires)}</> : ''}.
              A new copy replaces this link; you can get one any time from <em>Businesses → Invitation</em>.
            </p>
            <pre style={{ ...pre, maxHeight: 190, overflowY: 'auto' }}>{invitation}</pre>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <CopyBtn k="invite" value={invitation} label="Copy invitation" />
              <a style={{ ...ghost, textDecoration: 'none', display: 'inline-block' }} href={`https://wa.me/?text=${encodeURIComponent(invitation)}`} target="_blank" rel="noreferrer">Send via WhatsApp</a>
            </div>
          </>
        )}

        {backup && (
          <>
            <p style={{ color: T.textSecondary, fontSize: 12, margin: '0 0 6px' }}>Backup login — <strong style={{ color: T.accent }}>shown only once</strong> and not stored. Only use it if the invitation link cannot be used.</p>
            <pre style={pre}>{backup}</pre>
            <CopyBtn k="backup" value={backup} label="Copy backup login" />
          </>
        )}

        <div style={{ display: 'flex', marginTop: 14 }}>
          <button style={{ ...ghost, marginLeft: 'auto' }} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

// ── Applications ─────────────────────────────────────────────────────────────
const Applications = ({ canReview }) => {
  const { rows, loading, error } = useLive('stayApplications', 100);
  const [filter, setFilter] = useState('pending');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);   // the applicant's email already has a Yanga account
  const [loginEmail, setLoginEmail] = useState('');

  const shown = rows.filter((a) => filter === 'all' || a.status === filter);

  const review = async (app, decision) => {
    if (decision === 'reject' && !note.trim()) { setMsg('Add a short reason. It is emailed to the business.'); return; }
    if (decision === 'approve' && emailTaken && !loginEmail.trim()) { setMsg('Enter the login email to use for this business.'); return; }
    const emailForLogin = emailTaken ? loginEmail.trim() : app.email;
    const question = decision === 'approve'
      ? `Approve ${app.businessName}? This creates their login (${emailForLogin}), emails them a link to set a password, and makes the business live.`
      : `Reject ${app.businessName}? The reason will be emailed to ${app.email}.`;
    if (!window.confirm(question)) return;
    setBusy(app.id); setMsg(''); setNotice('');
    try {
      const res = await callStay('reviewStayApplication')({
        applicationId: app.id, decision, note: note.trim(), siteOrigin: window.location.origin,
        ...(emailTaken && loginEmail.trim() ? { loginEmail: loginEmail.trim() } : {}),
      });
      setNote(''); setOpen(null); setEmailTaken(false); setLoginEmail('');
      if (decision === 'approve') setResult(res.data);
      else setNotice(res.data.emailSent
        ? `Rejected. The reason was emailed to ${app.email}.`
        : `Rejected, but the email could not be sent${res.data.emailError ? ` (${res.data.emailError})` : ''}. Please let ${app.ownerName} know yourself.`);
    } catch (err) {
      const m = friendlyError(err);
      setMsg(m);
      if (/account already exists/i.test(m)) setEmailTaken(true);
    } finally { setBusy(''); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...btn(filter === f ? T.accent : 'transparent', filter === f ? '#0D1B2A' : T.textSecondary), border: filter === f ? 'none' : `0.5px solid ${T.border}`, textTransform: 'capitalize' }}>
            {f}{f !== 'all' ? ` (${rows.filter((a) => a.status === f).length})` : ''}
          </button>
        ))}
      </div>
      {error && <p style={{ color: T.red }}>{error}</p>}
      {notice && <p style={{ color: T.green, background: T.greenSub, borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>{notice}</p>}
      {loading ? <p style={{ color: T.textSecondary }}>Loading…</p> : shown.length === 0 ? (
        <div style={{ ...card, color: T.textSecondary, textAlign: 'center' }}>No {filter === 'all' ? '' : filter} applications.</div>
      ) : shown.map((a) => (
        <div key={a.id} style={{ ...card, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }} onClick={() => { setOpen(open === a.id ? null : a.id); setMsg(''); setNote(''); setNotice(''); setEmailTaken(false); setLoginEmail(''); }}>
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{a.businessName}</div>
              <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 2 }}>{typeLabel(a.type)} · {[a.area, a.town].filter(Boolean).join(", ")} · {a.ownerName}{a.stayRole ? ` (${roleLabel(a.stayRole)})` : ""} · {prettyTime(a.createdAt)}</div>
            </div>
            <span style={APP_STATUS[a.status] || APP_STATUS.pending}>{a.status}</span>
          </div>

          {open === a.id && (
            <div style={{ marginTop: 14, borderTop: `0.5px solid ${T.border}`, paddingTop: 12 }}>
              <Row label="Applicant">{a.ownerName}{a.stayRole ? ` — registering as ${roleLabel(a.stayRole)}` : ""}</Row>
              <Row label="Email">{a.email}</Row>
              <Row label="Business phone">{a.phone}</Row>
              <Row label="Payout number">{a.payoutPhone} — verify this belongs to the business</Row>
              <Row label="Address">{a.address}</Row>
              <Row label="Area">{[a.area, a.town].filter(Boolean).join(', ')}</Row>
              <Row label="Location">
                {a.location && <a href={mapsLink(a.location)} target="_blank" rel="noreferrer" style={{ color: T.blue }}><MapPin size={13} style={{ verticalAlign: -2 }} /> Open the pin in Google Maps <ExternalLink size={12} style={{ verticalAlign: -1 }} /></a>}
              </Row>
              <Row label="Description">{a.description}</Row>
              <Row label="Terms">Accepted v{a.termsVersion} · {prettyTime(a.termsAcceptedAt)}</Row>
              {a.reviewNote && <Row label="Review note">{a.reviewNote}</Row>}

              {a.status === 'pending' && canReview && (
                <div style={{ marginTop: 14 }}>
                  {emailTaken && (
                    <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: T.accentSub }}>
                      <p style={{ color: T.accent, fontSize: 13, margin: '0 0 8px' }}>That email already has a Yanga account. Use a different email for this business&apos;s login (the owner will receive the set-password link there):</p>
                      <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="another.email@example.com"
                        style={{ width: '100%', background: T.bgRow, color: T.textPrimary, border: `0.5px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 13 }} />
                    </div>
                  )}
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (required to reject, and is emailed to the business)" rows={2}
                    style={{ width: '100%', background: T.bgRow, color: T.textPrimary, border: `0.5px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 13 }} />
                  {msg && <p style={{ color: T.red, fontSize: 13, margin: '8px 0 0' }}>{msg}</p>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button disabled={busy === a.id} style={{ ...btn(T.green), opacity: busy === a.id ? 0.6 : 1 }} onClick={() => review(a, 'approve')}>{busy === a.id ? 'Working…' : 'Approve & create login'}</button>
                    <button disabled={busy === a.id} style={btn(T.redSub, T.red)} onClick={() => review(a, 'reject')}>Reject</button>
                  </div>
                </div>
              )}
              {a.status === 'pending' && !canReview && <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 10 }}>Only an administrator or manager can approve applications.</p>}
            </div>
          )}
        </div>
      ))}
      {result && <CredentialsModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

// ── Small modal shell used by the actions below ──────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
    <div style={{ ...card, maxWidth: 520, width: '100%', background: T.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ color: T.textPrimary, fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h3>
        <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: T.textSecondary, cursor: 'pointer', fontSize: 20 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const fieldStyle = { width: '100%', background: T.bgRow, color: T.textPrimary, border: `0.5px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 13, boxSizing: 'border-box' };
const lbl = { color: T.textSecondary, fontSize: 12, margin: '10px 0 4px', display: 'block' };

// Hand the business to a new owner or manager (resignation, the owner can no longer act, …).
const HandOverForm = ({ business, onClose, onDone }) => {
  const [form, setForm] = useState({ newName: '', newEmail: '', newRole: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (form.newName.trim().length < 2) return setError('Enter the new contact\'s full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.newEmail.trim())) return setError('Enter a valid email for the new login.');
    if (!form.newRole) return setError('Choose whether the new person is the owner or a manager.');
    if (form.reason.trim().length < 3) return setError('Give the reason (it is recorded and the previous contact is told).');
    if (!window.confirm(`Hand ${business.name} to ${form.newName.trim()}? The current login will be switched off immediately.`)) return;
    setBusy(true); setError('');
    try {
      const res = await callStay('transferStayBusiness')({ businessId: business.id, ...form, newName: form.newName.trim(), newEmail: form.newEmail.trim(), reason: form.reason.trim(), siteOrigin: window.location.origin });
      onDone(res.data);
    } catch (err) { setError(friendlyError(err)); setBusy(false); }
  };

  return (
    <Modal title={`Hand over ${business.name}`} onClose={onClose}>
      <p style={{ color: T.textSecondary, fontSize: 13, margin: 0 }}>
        Use this when the owner resigns, a manager leaves, or the owner can no longer act. <strong style={{ color: T.accent }}>Verify the request first</strong> (call the
        owner, or ask for documents). The current login is switched off at once, and its email is told. Bookings and payouts follow the new login.
      </p>
      <label style={lbl}>New person&apos;s full name</label>
      <input style={fieldStyle} value={form.newName} onChange={set('newName')} />
      <label style={lbl}>New login email (must not already have a Yanga account)</label>
      <input style={fieldStyle} type="email" value={form.newEmail} onChange={set('newEmail')} />
      <label style={lbl}>Their role</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {STAY_ROLES.map((r) => (
          <button key={r.value} type="button" onClick={() => setForm((f) => ({ ...f, newRole: r.value }))}
            style={{ ...btn(form.newRole === r.value ? T.accent : 'transparent', form.newRole === r.value ? '#0D1B2A' : T.textPrimary), border: form.newRole === r.value ? 'none' : `0.5px solid ${T.borderHover}`, flex: 1 }}>{r.label}</button>
        ))}
      </div>
      <label style={lbl}>Reason (recorded; sent to the previous contact)</label>
      <textarea style={fieldStyle} rows={2} value={form.reason} onChange={set('reason')} placeholder="e.g. Owner resigned; confirmed by phone on 5 Oct" />
      {error && <p style={{ color: T.red, fontSize: 13, margin: '10px 0 0' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button disabled={busy} style={{ ...btn(T.accent), opacity: busy ? 0.6 : 1 }} onClick={submit}>{busy ? 'Working…' : 'Hand over'}</button>
        <button style={ghost} onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
};

const PayoutForm = ({ business, current, onClose, onDone }) => {
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!/^(?:\+?260|0)?(9[5-7]|7[5-7])\d{7}$/.test(phone.replace(/[\s-]/g, ''))) return setError('Enter an Airtel, MTN or Zamtel number, e.g. 0971234567.');
    if (reason.trim().length < 3) return setError('Give the reason (it is recorded).');
    if (!window.confirm(`Change the payout number for ${business.name}? Future payouts go to the new number, and the business is emailed.`)) return;
    setBusy(true); setError('');
    try {
      const res = await callStay('setStayPayoutPhone')({ businessId: business.id, payoutPhone: phone.replace(/[\s-]/g, ''), reason: reason.trim() });
      onDone(res.data);
    } catch (err) { setError(friendlyError(err)); setBusy(false); }
  };
  return (
    <Modal title={`Payout number for ${business.name}`} onClose={onClose}>
      <p style={{ color: T.textSecondary, fontSize: 13, margin: 0 }}>Current number: <strong style={{ color: T.textPrimary }}>{current || 'not set'}</strong>. <strong style={{ color: T.accent }}>Confirm the new number with the owner by phone</strong> before changing it: payouts are sent automatically.</p>
      <label style={lbl}>New mobile money number</label>
      <input style={fieldStyle} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0971234567" />
      <label style={lbl}>Reason (recorded)</label>
      <textarea style={fieldStyle} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Owner changed network; verified by phone" />
      {error && <p style={{ color: T.red, fontSize: 13, margin: '10px 0 0' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button disabled={busy} style={{ ...btn(T.accent), opacity: busy ? 0.6 : 1 }} onClick={submit}>{busy ? 'Working…' : 'Change number'}</button>
        <button style={ghost} onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
};

const EMAIL_KIND = { invite: 'Invitation', reset: 'Password reset', rejection: 'Rejection', notice: 'Notice' };

// ── Businesses ───────────────────────────────────────────────────────────────
const Businesses = ({ canReview }) => {
  const { rows, loading, error } = useLive('stayBusinesses', 200);
  const [open, setOpen] = useState(null);
  const [details, setDetails] = useState({ payout: '', contact: null, login: null, emails: [] });
  const [msg, setMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);       // { kind: 'handover' | 'payout', business }
  const [handOverResult, setHandOverResult] = useState(null);
  const [reissuing, setReissuing] = useState('');
  const [reissueResult, setReissueResult] = useState(null);

  const loadDetails = async (b) => {
    setDetails({ payout: '…', contact: null, login: null, emails: [] });
    try {
      const [p, c, u, e] = await Promise.all([
        getDoc(doc(db, 'stayBusinesses', b.id, 'private', 'payout')),
        getDoc(doc(db, 'stayBusinesses', b.id, 'contact', 'details')),
        b.ownerUid ? getDoc(doc(db, 'users', b.ownerUid)) : Promise.resolve(null),
        getDocs(query(collection(db, 'stayEmailLog'), where('businessId', '==', b.id), limit(30))),
      ]);
      setDetails({
        payout: p.data()?.payoutPhone || 'Not set',
        contact: c.data() || {},
        login: u ? u.data() || null : null,
        emails: e.docs.map((d) => d.data()).sort((x, y) => tsMillis(y.createdAt) - tsMillis(x.createdAt)).slice(0, 8),
      });
    } catch { setDetails({ payout: 'Could not load', contact: {}, login: null, emails: [] }); }
  };

  // Make a fresh set-password link, email it, and show the admin a copy of the message.
  const reissue = async (b) => {
    if (!window.confirm(`Send ${b.name} a fresh invitation? Any earlier link will stop working.`)) return;
    setReissuing(b.id); setMsg('');
    try {
      const res = await callStay('reissueStayInvite')({ businessId: b.id, siteOrigin: window.location.origin });
      setReissueResult(res.data);
      loadDetails(b);
    } catch (err) { setMsg(friendlyError(err)); } finally { setReissuing(''); }
  };

  const toggleOpen = async (b) => {
    if (open === b.id) { setOpen(null); return; }
    setOpen(b.id); setMsg(''); setNotice('');
    await loadDetails(b);
  };

  const setStatus = async (b, status) => {
    const verb = status === 'suspended' ? 'Suspend' : 'Reactivate';
    if (!window.confirm(`${verb} ${b.name}? ${status === 'suspended' ? 'It will disappear from the app and stop taking bookings (existing paid bookings are unaffected).' : ''}`)) return;
    try { await updateDoc(doc(db, 'stayBusinesses', b.id), { status, updatedAt: serverTimestamp() }); }
    catch (err) { console.error(err); setMsg('Could not change the status.'); }
  };

  const c = details.contact;
  return (
    <div>
      {error && <p style={{ color: T.red }}>{error}</p>}
      {msg && <p style={{ color: T.red }}>{msg}</p>}
      {notice && <p style={{ color: T.green, background: T.greenSub, borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>{notice}</p>}
      {loading ? <p style={{ color: T.textSecondary }}>Loading…</p> : rows.length === 0 ? (
        <div style={{ ...card, color: T.textSecondary, textAlign: 'center' }}>No businesses yet. Approve an application to create one.</div>
      ) : rows.map((b) => (
        <div key={b.id} style={{ ...card, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }} onClick={() => toggleOpen(b)}>
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{b.name}</div>
              <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 2 }}>{typeLabel(b.type)} · {[b.area, b.town].filter(Boolean).join(', ')}{b.ownerRole ? ` · login: ${roleLabel(b.ownerRole)}` : ''}</div>
            </div>
            <span style={APP_STATUS[b.status] || APP_STATUS.pending}>{b.status}</span>
          </div>
          {open === b.id && (
            <div style={{ marginTop: 14, borderTop: `0.5px solid ${T.border}`, paddingTop: 12 }}>
              <Row label="Phone">{c ? c.phone || '—' : '…'}</Row>
              <Row label="Address">{b.address || '—'}</Row>
              <Row label="Login is">{roleLabel(b.ownerRole) || '—'}</Row>
              <Row label="Login status">
                {!details.login ? '…'
                  : details.login.isActive === false ? 'Switched off'
                  : details.login.resetPassword === true ? <span style={{ color: T.accent }}>Waiting for the owner to set a password</span>
                  : <span style={{ color: T.green }}>Password set — can sign in</span>}
              </Row>
              <Row label="Emails sent">
                {details.emails.length === 0 ? 'None recorded' : (
                  <div>
                    {details.emails.map((m, i) => {
                      const exp = tsMillis(m.expiresAt);
                      return (
                        <div key={i} style={{ marginBottom: 4 }}>
                          <span style={{ color: m.status === 'sent' ? T.green : T.red }}>{m.status === 'sent' ? '✓' : '✗'}</span>{' '}
                          {EMAIL_KIND[m.kind] || m.kind} → {m.to} · {prettyTime(m.createdAt)}
                          {exp ? (Date.now() < exp ? ` · link valid until ${fmtWhen(exp)}` : ' · link expired') : ''}
                          {m.status === 'failed' && m.error ? ` (${m.error})` : ''}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Row>
              <Row label="Payout number">{details.payout}</Row>
              <Row label="Approved">{prettyTime(b.approvedAt)}</Row>
              <Row label="Terms">v{b.termsVersion}</Row>
              {b.location && <Row label="Location"><a href={mapsLink(b.location)} target="_blank" rel="noreferrer" style={{ color: T.blue }}>Open in Google Maps</a></Row>}
              {canReview && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.status === 'approved'
                    ? <button style={btn(T.redSub, T.red)} onClick={() => setStatus(b, 'suspended')}>Suspend business</button>
                    : b.status === 'suspended' && <button style={btn(T.green)} onClick={() => setStatus(b, 'approved')}>Reactivate</button>}
                  {b.ownerUid && details.login?.isActive !== false && (
                    <button style={{ ...ghost, opacity: reissuing === b.id ? 0.6 : 1 }} disabled={reissuing === b.id} onClick={() => reissue(b)}>
                      {reissuing === b.id ? 'Working…' : 'Invitation: resend & show a copy'}
                    </button>
                  )}
                  <button style={ghost} onClick={() => setModal({ kind: 'payout', business: b })}>Change payout number</button>
                  <button style={ghost} onClick={() => setModal({ kind: 'handover', business: b })}>Hand over to a new owner / manager</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {modal?.kind === 'handover' && (
        <HandOverForm business={modal.business} onClose={() => setModal(null)} onDone={(res) => { setModal(null); setOpen(null); setHandOverResult(res); }} />
      )}
      {modal?.kind === 'payout' && (
        <PayoutForm business={modal.business} current={details.payout} onClose={() => setModal(null)}
          onDone={(res) => { setModal(null); setNotice(res.emailSent ? 'Payout number changed. The business was emailed.' : 'Payout number changed. (The business could not be emailed, so please tell them.)'); loadDetails(modal.business); }} />
      )}
      {handOverResult && <CredentialsModal result={handOverResult} title="Hand-over complete" onClose={() => setHandOverResult(null)} />}
      {reissueResult && <CredentialsModal result={reissueResult} onClose={() => setReissueResult(null)} />}
    </div>
  );
};

// ── Reports from guests ──────────────────────────────────────────────────────
const REASON_TEXT = {
  fake_listing: 'Fake listing',
  pay_outside_yanga: 'Asked to pay outside Yanga',
  wrong_info: 'Wrong information',
  unsafe_or_scam: 'Unsafe or a scam',
  other: 'Other',
};

const Reports = ({ reports, loading, error, canReview }) => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('open');
  const [msg, setMsg] = useState('');

  const openCount = useMemo(() => {
    const m = {};
    reports.filter((r) => r.status === 'open').forEach((r) => { m[r.businessId] = (m[r.businessId] || 0) + 1; });
    return m;
  }, [reports]);

  const shown = reports.filter((r) => filter === 'all' || r.status === filter);

  const review = async (r, status, suspend = false) => {
    setMsg('');
    try {
      if (suspend) {
        if (!window.confirm(`Suspend ${r.businessName}? It will disappear from the app and stop taking bookings.`)) return;
        await updateDoc(doc(db, 'stayBusinesses', r.businessId), { status: 'suspended', updatedAt: serverTimestamp() });
      }
      await updateDoc(doc(db, 'stayReports', r.id), { status, reviewedBy: currentUser?.uid || null, reviewedAt: serverTimestamp() });
    } catch (err) { console.error(err); setMsg('Could not update that report.'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['open', 'reviewed', 'actioned', 'dismissed', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...btn(filter === f ? T.accent : 'transparent', filter === f ? '#0D1B2A' : T.textSecondary), border: filter === f ? 'none' : `0.5px solid ${T.border}`, textTransform: 'capitalize' }}>
            {f}{f !== 'all' ? ` (${reports.filter((r) => r.status === f).length})` : ''}
          </button>
        ))}
      </div>
      {error && <p style={{ color: T.red }}>{error}</p>}
      {msg && <p style={{ color: T.red }}>{msg}</p>}
      {loading ? <p style={{ color: T.textSecondary }}>Loading…</p> : shown.length === 0 ? (
        <div style={{ ...card, color: T.textSecondary, textAlign: 'center' }}>{filter === 'open' ? 'No open reports. 🎉' : 'Nothing here.'}</div>
      ) : shown.map((r) => {
        const n = openCount[r.businessId] || 0;
        return (
          <div key={r.id} style={{ ...card, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: T.textPrimary, fontWeight: 700 }}>{r.businessName}</div>
                <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 2 }}>{REASON_TEXT[r.reason] || r.reason} · {prettyTime(r.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {n >= 3 && <span style={chip(T.red, T.redSub)}>{n} open reports</span>}
                <span style={r.status === 'open' ? chip(T.accent, T.accentSub) : chip(T.textSecondary, 'rgba(255,255,255,0.06)')}>{r.status}</span>
              </div>
            </div>
            {r.details && <p style={{ color: T.textPrimary, fontSize: 13, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{r.details}</p>}
            {r.status === 'open' && canReview && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button style={btn(T.redSub, T.red)} onClick={() => review(r, 'actioned', true)}>Suspend business</button>
                <button style={ghost} onClick={() => review(r, 'reviewed')}>Mark reviewed</button>
                <button style={ghost} onClick={() => review(r, 'dismissed')}>Dismiss</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Bookings & payouts ───────────────────────────────────────────────────────
const needsAttention = (b) =>
  ['needs_refund', 'needs_review'].includes(b.status) || ['failed', 'skipped', 'needs_review'].includes(b.payoutStatus);

const BOOKING_FILTERS = [
  { key: 'attention', label: 'Needs attention' },
  { key: 'paid',      label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'unpaid',    label: 'Awaiting payment' },
  { key: 'all',       label: 'All' },
];

const statusChip = (b) => {
  if (b.status === 'paid') return chip(T.green, T.greenSub);
  if (['needs_refund', 'needs_review'].includes(b.status)) return chip(T.accent, T.accentSub);
  if (b.status === 'cancelled') return chip(T.red, T.redSub);
  return chip(T.textSecondary, 'rgba(255,255,255,0.06)');
};

const Bookings = () => {
  const { rows, loading, error } = useLive('stayBookings', 200);
  const [filter, setFilter] = useState('attention');
  const [msg, setMsg] = useState('');

  const stats = useMemo(() => {
    const paid = rows.filter((b) => b.paidAt && ['paid', 'cancelled'].includes(b.status));
    return {
      count: paid.length,
      gross: paid.reduce((s, b) => s + (b.total || 0), 0),
      fees: paid.reduce((s, b) => s + (b.commission || 0), 0),
      attention: rows.filter(needsAttention).length,
    };
  }, [rows]);

  const shown = rows.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'attention') return needsAttention(b);
    if (filter === 'paid') return b.status === 'paid';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return ['held', 'expired', 'failed'].includes(b.status);
  }).sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt));

  const openInvoice = async (b) => {
    setMsg('');
    const win = window.open('', '_blank');
    try {
      const res = await callStay('getStayInvoiceLink')({ bookingId: b.id });
      if (win) win.location.href = res.data.url;
    } catch (err) { if (win) win.close(); setMsg(friendlyError(err, 'Could not open the invoice.')); }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 16 }}>
        {[
          ['Paid bookings', stats.count, T.textPrimary],
          ['Guests paid (gross)', kwacha(stats.gross), T.textPrimary],
          ['Yanga 12% earned', kwacha(stats.fees), T.green],
          ['Needs attention', stats.attention, stats.attention ? T.accent : T.textSecondary],
        ].map(([label, value, color]) => (
          <div key={label} style={card}>
            <div style={{ color: T.textSecondary, fontSize: 12 }}>{label}</div>
            <div style={{ color, fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>
      <p style={{ color: T.textSecondary, fontSize: 11, margin: '-6px 0 14px' }}>Totals cover the 200 most recent bookings.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {BOOKING_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ ...btn(filter === f.key ? T.accent : 'transparent', filter === f.key ? '#0D1B2A' : T.textSecondary), border: filter === f.key ? 'none' : `0.5px solid ${T.border}` }}>{f.label}</button>
        ))}
      </div>
      {error && <p style={{ color: T.red }}>{error}</p>}
      {msg && <p style={{ color: T.red }}>{msg}</p>}

      {loading ? <p style={{ color: T.textSecondary }}>Loading…</p> : shown.length === 0 ? (
        <div style={{ ...card, color: T.textSecondary, textAlign: 'center' }}>{filter === 'attention' ? 'Nothing needs attention. 🎉' : 'No bookings here.'}</div>
      ) : shown.map((b) => (
        <div key={b.id} style={{ ...card, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 700 }}>{b.businessName} · {b.roomName}</div>
              <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 2 }}>
                {prettyDay(b.checkIn)} → {prettyDay(b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''} · {b.guestName} {b.guestPhone}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: T.textPrimary, fontWeight: 700 }}>{kwacha(b.total)}</div>
              <div style={{ color: T.textSecondary, fontSize: 12 }}>fee {kwacha(b.commission)} · business {kwacha(b.businessAmount)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            <span style={statusChip(b)}>{b.status.replace('_', ' ')}</span>
            {b.payoutStatus && b.payoutStatus !== 'none' && (
              <span style={chip(['failed', 'skipped', 'needs_review'].includes(b.payoutStatus) ? T.red : T.textSecondary, ['failed', 'skipped', 'needs_review'].includes(b.payoutStatus) ? T.redSub : 'rgba(255,255,255,0.06)')}>payout: {b.payoutStatus.replace('_', ' ')}</span>
            )}
            <span style={{ color: T.textSecondary, fontSize: 11 }}>{b.invoiceNumber ? `${b.invoiceNumber} · ` : ''}{prettyTime(b.createdAt)}</span>
            {b.invoiceNumber && <button style={{ ...ghost, marginLeft: 'auto', padding: '4px 10px', fontSize: 12 }} onClick={() => openInvoice(b)}><FileText size={13} style={{ verticalAlign: -2 }} /> Invoice</button>}
          </div>
          {b.status === 'needs_refund' && <p style={{ color: T.accent, fontSize: 12, margin: '10px 0 0' }}>Payment arrived after the room was taken. Refund the guest via Lenco (reference {b.paymentReference}); the business was not paid.</p>}
          {b.status === 'needs_review' && <p style={{ color: T.accent, fontSize: 12, margin: '10px 0 0' }}>Amount collected did not match the booking ({b.reviewReason}). Check Lenco (reference {b.paymentReference}); the business was not paid.</p>}
          {['failed', 'skipped', 'needs_review'].includes(b.payoutStatus) && <p style={{ color: T.red, fontSize: 12, margin: '10px 0 0' }}>The payout to the business has not completed. Check the business payout number and the Lenco balance; failed transfers retry automatically up to 5 times.</p>}
        </div>
      ))}
    </div>
  );
};

// ── Payout number requests ───────────────────────────────────────────────────
const REQ_STATUS = {
  pending: chip(T.accent, T.accentSub), approved: chip(T.green, T.greenSub),
  declined: chip(T.red, T.redSub), cancelled: chip(T.textSecondary, 'rgba(255,255,255,0.06)'),
};

const PayoutRequests = ({ requests, loading, error, canReview }) => {
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');
  const [notes, setNotes] = useState({});
  const [verified, setVerified] = useState({});

  const decide = async (r, decision) => {
    const note = (notes[r.id] || '').trim();
    if (decision === 'decline' && note.length < 3) return setMsg('Give a short reason for declining. It is emailed to the business.');
    if (decision === 'approve' && !verified[r.id]) return setMsg('Tick the box to confirm you verified the owner first.');
    if (!window.confirm(decision === 'approve'
      ? (r.kind === 'email' ? `Approve? ${r.businessName} will sign in with ${r.newEmail}, and anyone signed in is signed out.` : `Approve? Future payouts for ${r.businessName} go to ${r.newPhone}.`)
      : 'Decline this request?')) return;
    setBusyId(r.id); setMsg('');
    try {
      await callStay('reviewPayoutRequest')({ requestId: r.id, decision, note, verified: !!verified[r.id] });
    } catch (err) { setMsg(friendlyError(err)); }
    setBusyId('');
  };

  if (loading) return <p style={{ color: T.textSecondary }}>Loading…</p>;
  return (
    <div>
      {error && <p style={{ color: T.red }}>{error}</p>}
      {msg && <p style={{ color: T.red }}>{msg}</p>}
      {requests.length === 0 ? (
        <div style={{ ...card, color: T.textSecondary, textAlign: 'center' }}>No change requests.</div>
      ) : requests.map((r) => (
        <div key={r.id} style={{ ...card, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: T.textPrimary, fontWeight: 700 }}>{r.businessName}</div>
            <span style={REQ_STATUS[r.status] || REQ_STATUS.cancelled}>{r.status}</span>
          </div>
          <Row label="Requested by">{r.requestedByName || '—'} ({roleLabel(r.requestedByRole)}) · {r.requestedByEmail}</Row>
          {r.kind === 'email' ? (
            <>
              <Row label="Changing">Login email</Row>
              <Row label="Current email">{r.requestedByEmail}</Row>
              <Row label="New email"><strong>{r.newEmail}</strong></Row>
            </>
          ) : (
            <>
              <Row label="Changing">Payout number</Row>
              <Row label="Current number">{r.currentMasked || 'not set'}</Row>
              <Row label="New number"><strong>{r.newPhone}</strong></Row>
            </>
          )}
          <Row label="Reason">{r.reason}</Row>
          <Row label="Sent">{prettyTime(r.createdAt)}</Row>
          {r.reviewNote && <Row label="Staff note">{r.reviewNote}</Row>}
          {r.status === 'pending' && canReview && (
            <div style={{ marginTop: 10 }}>
              <p style={{ color: T.accent, fontSize: 12, margin: '0 0 8px' }}>Phone the owner on the number already on file (not a new contact given in the request) and confirm the request is genuine.</p>
              <label style={{ ...lbl, display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 8px' }}>
                <input type="checkbox" checked={!!verified[r.id]} onChange={(e) => setVerified((v) => ({ ...v, [r.id]: e.target.checked }))} />
                I verified this with the owner
              </label>
              <input style={fieldStyle} value={notes[r.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} placeholder="Note (required if declining; emailed to the business)" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button disabled={busyId === r.id} style={{ ...btn(T.green), opacity: busyId === r.id ? 0.6 : 1 }} onClick={() => decide(r, 'approve')}>Approve</button>
                <button disabled={busyId === r.id} style={{ ...btn(T.red, '#fff'), opacity: busyId === r.id ? 0.6 : 1 }} onClick={() => decide(r, 'decline')}>Decline</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'applications', label: 'Applications' },
  { key: 'businesses',   label: 'Businesses' },
  { key: 'bookings',     label: 'Bookings & payouts' },
  { key: 'payouts',      label: 'Change requests' },
  { key: 'reports',      label: 'Reports' },
];

const StaysManager = () => {
  const { userRole } = useAuth();
  const [tab, setTab] = useState('applications');
  const canReview = ['admin', 'manager'].includes(userRole);
  const reportsLive = useLive('stayReports', 200);
  const payoutLive = useLive('stayPayoutRequests', 100);
  const waitingPayouts = payoutLive.rows.filter((r) => r.status === 'pending').length;
  const openReports = reportsLive.rows.filter((r) => r.status === 'open').length;

  return (
    <div style={{
      background: T.bgCard, borderRadius: 20, padding: 28, fontFamily: T.font,
      borderTop: `4px solid ${T.accent}`, boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      <h1 style={{ color: T.textPrimary, fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>Yanga Stays</h1>
      <p style={{ color: T.textSecondary, fontSize: 13, margin: '0 0 18px' }}>Approve accommodation businesses and watch bookings and payouts.</p>
      <div style={{ display: 'flex', gap: 4, borderBottom: `0.5px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: 14, color: tab === t.key ? T.accent : T.textSecondary, borderBottom: `2px solid ${tab === t.key ? T.accent : 'transparent'}`, marginBottom: -1 }}>
            {t.label}
            {t.key === 'payouts' && waitingPayouts > 0 && (
              <span style={{ marginLeft: 8, background: T.red, color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{waitingPayouts}</span>
            )}
            {t.key === 'reports' && openReports > 0 && (
              <span style={{ marginLeft: 8, background: T.red, color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{openReports}</span>
            )}
          </button>
        ))}
      </div>
      {tab === 'applications' && <Applications canReview={canReview} />}
      {tab === 'businesses' && <Businesses canReview={canReview} />}
      {tab === 'bookings' && <Bookings />}
      {tab === 'payouts' && <PayoutRequests requests={payoutLive.rows} loading={payoutLive.loading} error={payoutLive.error} canReview={canReview} />}
      {tab === 'reports' && <Reports reports={reportsLive.rows} loading={reportsLive.loading} error={reportsLive.error} canReview={canReview} />}
    </div>
  );
};

export default StaysManager;
