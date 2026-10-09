import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../Config/firebaseConfig';
import { useHost } from './HostContext';
import { Mail, Wallet } from 'lucide-react';
import { callStay, friendlyError, prettyTime } from '../stayConfig';

const field = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500';
const STATUS = {
  pending: ['Waiting for review', 'bg-amber-100 text-amber-800'],
  approved: ['Approved', 'bg-green-100 text-green-800'],
  declined: ['Declined', 'bg-red-100 text-red-700'],
  cancelled: ['Cancelled', 'bg-gray-100 text-gray-600'],
};
const mask = (p) => (p ? `${p.slice(0, 3)}****${p.slice(-3)}` : '');

// The payout number can only be changed by Yanga staff. This lets the owner ask for it: staff
// phone the owner to check it is really them, then approve or decline.
const PayoutRequestCard = () => {
  const { businessId } = useHost();
  const [current, setCurrent] = useState('');
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ kind: '', text: '' });
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailReason, setEmailReason] = useState('');

  const loadCurrent = () => {
    if (!businessId) return;
    getDoc(doc(db, 'stayBusinesses', businessId, 'private', 'payout'))
      .then((s) => setCurrent(mask(s.data()?.payoutPhone)))
      .catch(() => {});
  };
  useEffect(loadCurrent, [businessId]);

  useEffect(() => {
    if (!businessId) return undefined;
    // No orderBy here, so no extra index is needed; the list is tiny and sorted below.
    return onSnapshot(query(collection(db, 'stayPayoutRequests'), where('businessId', '==', businessId)),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setRequests(rows);
        loadCurrent();
      },
      () => {});
  }, [businessId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pending = requests.find((r) => r.status === 'pending' && (r.kind || 'payout') === 'payout');
  const pendingEmail = requests.find((r) => r.status === 'pending' && r.kind === 'email');

  const sendEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newEmail.trim())) return setMessage({ kind: 'error', text: 'Enter a valid email address.' });
    if (emailReason.trim().length < 3) return setMessage({ kind: 'error', text: 'Tell us why the email is changing.' });
    setBusy(true); setMessage({ kind: '', text: '' });
    try {
      await callStay('requestEmailChange')({ newEmail: newEmail.trim(), reason: emailReason.trim() });
      setEmailOpen(false); setNewEmail(''); setEmailReason('');
      setMessage({ kind: 'ok', text: 'Request sent. We will contact you on the number we have on file to confirm it is you. Your current email keeps working until then.' });
    } catch (err) { setMessage({ kind: 'error', text: friendlyError(err) }); }
    setBusy(false);
  };

  const send = async () => {
    if (!/^(?:\+?260|0)?(9[5-7]|7[5-7])\d{7}$/.test(phone.replace(/[\s-]/g, ''))) {
      return setMessage({ kind: 'error', text: 'Enter an Airtel, MTN or Zamtel number, e.g. 0971234567.' });
    }
    if (reason.trim().length < 3) return setMessage({ kind: 'error', text: 'Tell us why the number is changing.' });
    setBusy(true); setMessage({ kind: '', text: '' });
    try {
      await callStay('requestPayoutChange')({ newPhone: phone.replace(/[\s-]/g, ''), reason: reason.trim() });
      setOpen(false); setPhone(''); setReason('');
      setMessage({ kind: 'ok', text: 'Request sent. We will contact you on the number we have on file to confirm it is you.' });
    } catch (err) { setMessage({ kind: 'error', text: friendlyError(err) }); }
    setBusy(false);
  };

  const cancel = async (id) => {
    if (!window.confirm('Withdraw this request?')) return;
    setBusy(true); setMessage({ kind: '', text: '' });
    try { await callStay('cancelPayoutRequest')({ requestId: id }); }
    catch (err) { setMessage({ kind: 'error', text: friendlyError(err) }); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
    <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0"><Wallet size={20} /></span>
        <div>
          <h2 className="font-bold text-emerald-900 leading-tight">Payout mobile money number</h2>
          <p className="text-xs text-emerald-800">Where your money is sent</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-white border border-emerald-200 px-4 py-3">
        <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">Current payout number</p>
        <p className="text-xl font-bold text-gray-900 tracking-wide">{current || 'Your registered number'}</p>
      </div>
      <p className="text-sm text-gray-700 mt-3">
        Guest payments (after Yanga's fee) are sent to this number. It is separate from your business contact phone.
        To protect your money, a change has to be approved by Yanga after we confirm it is you.
      </p>

      {pending ? (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          Your request to change the number to <strong>{mask(pending.newPhone)}</strong> is waiting for review.
          <div>
            <button type="button" disabled={busy} onClick={() => cancel(pending.id)} className="mt-2 text-xs font-semibold underline disabled:opacity-60">Withdraw request</button>
          </div>
        </div>
      ) : !open ? (
        <button type="button" onClick={() => { setOpen(true); setMessage({ kind: '', text: '' }); }}
          className="mt-4 px-4 py-2 rounded-lg border border-amber-500 text-amber-700 font-semibold text-sm hover:bg-amber-50">
          Request a change
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New mobile money number</label>
            <input className={field} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0971234567" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Why is it changing?</label>
            <textarea className={field} rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I changed my SIM card" />
          </div>
          <p className="text-xs text-gray-500">Nothing changes until we have confirmed with you by phone and approved it.</p>
          <div className="flex gap-3">
            <button type="button" disabled={busy} onClick={send} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold text-sm disabled:opacity-60">{busy ? 'Sending…' : 'Send request'}</button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Cancel</button>
          </div>
        </div>
      )}

    </section>

    <section className="rounded-xl border-2 border-sky-300 bg-sky-50/60 p-5">
      <div>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0"><Mail size={20} /></span>
          <div>
            <h2 className="font-bold text-sky-900 leading-tight">Login email</h2>
            <p className="text-xs text-sky-800">What you sign in with</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          This is the email you sign in with and where we send your notices. A change has to be approved by Yanga after we confirm it is you.
          After it is approved, sign in again with the new address; your password stays the same.
        </p>
        {pendingEmail ? (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
            Your request to change the email to <strong>{pendingEmail.newEmail}</strong> is waiting for review.
            <div>
              <button type="button" disabled={busy} onClick={() => cancel(pendingEmail.id)} className="mt-2 text-xs font-semibold underline disabled:opacity-60">Withdraw request</button>
            </div>
          </div>
        ) : !emailOpen ? (
          <button type="button" onClick={() => { setEmailOpen(true); setMessage({ kind: '', text: '' }); }}
            className="mt-4 px-4 py-2 rounded-lg border border-amber-500 text-amber-700 font-semibold text-sm hover:bg-amber-50">
            Request a change
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New email address</label>
              <input className={field} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Why is it changing?</label>
              <textarea className={field} rows={2} maxLength={300} value={emailReason} onChange={(e) => setEmailReason(e.target.value)} placeholder="e.g. I no longer use the old address" />
            </div>
            <div className="flex gap-3">
              <button type="button" disabled={busy} onClick={sendEmail} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold text-sm disabled:opacity-60">{busy ? 'Sending…' : 'Send request'}</button>
              <button type="button" onClick={() => setEmailOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </section>

      {message.text && <p className={`text-sm font-medium mt-3 ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`} role="status">{message.text}</p>}

      {requests.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Your requests</h3>
          <ul className="space-y-2">
            {requests.slice(0, 5).map((r) => (
              <li key={r.id} className="text-sm border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span>{r.kind === 'email' ? 'Email to' : 'Payout to'} <strong>{r.kind === 'email' ? r.newEmail : mask(r.newPhone)}</strong> · <span className="text-gray-500">{prettyTime(r.createdAt)}</span></span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS[r.status]?.[1] || ''}`}>{STATUS[r.status]?.[0] || r.status}</span>
                </div>
                {r.status === 'declined' && r.reviewNote && <p className="text-xs text-gray-600 mt-1">Reason: {r.reviewNote}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default PayoutRequestCard;
