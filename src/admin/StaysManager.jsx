import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
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
const CredentialsModal = ({ result, onClose }) => {
  const [copied, setCopied] = useState(false);
  const loginUrl = `${window.location.origin}/host/login`;
  const text = `Your Yanga Stays business account is approved.\nSign in: ${loginUrl}\nEmail: ${result.email}\nTemporary password: ${result.tempPassword}\nYou will be asked to choose a new password the first time you sign in.`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* user can select manually */ }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ ...card, maxWidth: 520, width: '100%', background: T.bg }}>
        <h3 style={{ color: T.green, fontSize: 18, fontWeight: 700, margin: 0 }}>Business approved</h3>
        <p style={{ color: T.textSecondary, fontSize: 13, margin: '8px 0 14px' }}>
          {result.emailSent
            ? <>An email with a link to set a password has been sent to <strong style={{ color: T.textPrimary }}>{result.email}</strong> (valid for 3 days; ask them to check spam). The details below are a <strong style={{ color: T.accent }}>backup</strong> — only use them if the email does not arrive. They are shown only once.</>
            : <><strong style={{ color: T.red }}>The email could not be sent{result.emailError ? ` (${result.emailError})` : ''}.</strong> Send these login details to the owner yourself. <strong style={{ color: T.accent }}>The password is shown only once</strong> and is not stored.</>}
        </p>
        <pre style={{ background: T.bgRow, border: `0.5px solid ${T.border}`, borderRadius: 10, padding: 14, color: T.textPrimary, fontSize: 13, whiteSpace: 'pre-wrap', userSelect: 'all' }}>{text}</pre>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button style={btn(T.accent)} onClick={copy}>{copied ? <><Check size={14} style={{ verticalAlign: -2 }} /> Copied</> : <><Copy size={14} style={{ verticalAlign: -2 }} /> Copy details</>}</button>
          <a style={{ ...ghost, textDecoration: 'none', display: 'inline-block' }} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Send via WhatsApp</a>
          <a style={{ ...ghost, textDecoration: 'none', display: 'inline-block' }} href={`mailto:${result.email}?subject=${encodeURIComponent('Your Yanga Stays account')}&body=${encodeURIComponent(text)}`}>Send by email</a>
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

// ── Businesses ───────────────────────────────────────────────────────────────
const Businesses = ({ canReview }) => {
  const { rows, loading, error } = useLive('stayBusinesses', 200);
  const [open, setOpen] = useState(null);
  const [details, setDetails] = useState({ payout: '', contact: null });
  const [msg, setMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);       // { kind: 'handover' | 'payout', business }
  const [handOverResult, setHandOverResult] = useState(null);

  const loadDetails = async (b) => {
    setDetails({ payout: '…', contact: null });
    try {
      const [p, c] = await Promise.all([
        getDoc(doc(db, 'stayBusinesses', b.id, 'private', 'payout')),
        getDoc(doc(db, 'stayBusinesses', b.id, 'contact', 'details')),
      ]);
      setDetails({ payout: p.data()?.payoutPhone || 'Not set', contact: c.data() || {} });
    } catch { setDetails({ payout: 'Could not load', contact: {} }); }
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
              <Row label="Payout number">{details.payout}</Row>
              <Row label="Approved">{prettyTime(b.approvedAt)}</Row>
              <Row label="Terms">v{b.termsVersion}</Row>
              {b.location && <Row label="Location"><a href={mapsLink(b.location)} target="_blank" rel="noreferrer" style={{ color: T.blue }}>Open in Google Maps</a></Row>}
              {canReview && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.status === 'approved'
                    ? <button style={btn(T.redSub, T.red)} onClick={() => setStatus(b, 'suspended')}>Suspend business</button>
                    : b.status === 'suspended' && <button style={btn(T.green)} onClick={() => setStatus(b, 'approved')}>Reactivate</button>}
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
      {handOverResult && <CredentialsModal result={handOverResult} onClose={() => setHandOverResult(null)} />}
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

// ── Page ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'applications', label: 'Applications' },
  { key: 'businesses',   label: 'Businesses' },
  { key: 'bookings',     label: 'Bookings & payouts' },
  { key: 'reports',      label: 'Reports' },
];

const StaysManager = () => {
  const { userRole } = useAuth();
  const [tab, setTab] = useState('applications');
  const canReview = ['admin', 'manager'].includes(userRole);
  const reportsLive = useLive('stayReports', 200);
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
            {t.key === 'reports' && openReports > 0 && (
              <span style={{ marginLeft: 8, background: T.red, color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{openReports}</span>
            )}
          </button>
        ))}
      </div>
      {tab === 'applications' && <Applications canReview={canReview} />}
      {tab === 'businesses' && <Businesses canReview={canReview} />}
      {tab === 'bookings' && <Bookings />}
      {tab === 'reports' && <Reports reports={reportsLive.rows} loading={reportsLive.loading} error={reportsLive.error} canReview={canReview} />}
    </div>
  );
};

export default StaysManager;
