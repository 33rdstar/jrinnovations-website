import React, { useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { FileText, MessageCircle, Phone, Search, XCircle } from 'lucide-react';
import { db } from '../../Config/firebaseConfig';
import { useHost } from './HostContext';
import ExtractButton from './ExtractButton';
import {
  bookingPhase, callStay, friendlyError, kwacha, prettyDay, prettyTime, todayZm,
} from '../stayConfig';

const FILTERS = [
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'inhouse',   label: 'In house' },
  { key: 'past',      label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'attention', label: 'Being sorted by Yanga' },
  { key: 'all',       label: 'All' },
];

const PHASE_STYLE = {
  upcoming:  'bg-blue-50 text-blue-700',
  inhouse:   'bg-green-50 text-green-700',
  past:      'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-700',
  attention: 'bg-amber-50 text-amber-800',
};
const PHASE_LABEL = {
  upcoming: 'Upcoming', inhouse: 'In house', past: 'Completed', cancelled: 'Cancelled', attention: 'Under review',
};

const payoutText = (b) => {
  switch (b.payoutStatus) {
    case 'paid': return { text: 'Paid to your mobile money', cls: 'text-green-700' };
    case 'processing': return { text: 'Payment to you is on its way', cls: 'text-amber-700' };
    case 'pending': return { text: 'Payment to you is being sent', cls: 'text-amber-700' };
    case 'failed':
    case 'skipped':
    case 'needs_review': return { text: 'Payment to you is being sorted by Yanga', cls: 'text-red-700' };
    default: return { text: '', cls: '' };
  }
};

// Colours for the check-in / check-out box, by where the stay is up to.
const DATE_BOX = {
  upcoming:  'bg-blue-50 border-blue-200 text-blue-900',
  inhouse:   'bg-green-100 border-green-400 text-green-900',
  past:      'bg-gray-50 border-gray-200 text-gray-700',
  cancelled: 'bg-red-50 border-red-200 text-red-800',
  attention: 'bg-amber-50 border-amber-200 text-amber-900',
};

// A short line under the dates: how soon guests arrive, or when the one in house leaves.
const stayNote = (b) => {
  const today = todayZm();
  const days = (a, c) => Math.round((Date.parse(`${c}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
  if (b.phase === 'upcoming') {
    const d = days(today, b.checkIn);
    return d === 1 ? 'Arrives tomorrow' : `Arrives in ${d} days`;
  }
  if (b.phase === 'inhouse') {
    const d = days(today, b.checkOut);
    return d === 1 ? 'Staying now · leaves tomorrow' : `Staying now · leaves in ${d} days`;
  }
  return '';
};

// What each tab is for, shown when it is empty.
const EMPTY = {
  upcoming: 'No upcoming bookings. This tab lists paid bookings whose check-in date is still ahead of today. Guests staying now are under "In house".',
  inhouse: 'Nobody is staying right now. This tab lists guests whose check-in date has arrived and who have not yet checked out.',
  past: 'No past stays yet. Guests move here once their check-out date has passed.',
  cancelled: 'No cancelled bookings.',
  attention: 'Nothing is being sorted. Payments that need a check by Yanga appear here.',
};

const toWhatsApp = (local) => `https://wa.me/260${String(local).replace(/\D/g, '').replace(/^0/, '')}`;

const CancelDialog = ({ booking, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true); setError('');
    try {
      await callStay('hostCancelStayBooking')({ bookingId: booking.id, reason: reason.trim() });
      onDone();
    } catch (err) { setError(friendlyError(err)); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Cancel this booking?</h3>
        <p className="text-sm text-gray-600 mt-2">
          {booking.guestName} · {booking.roomName} · {prettyDay(booking.checkIn)} to {prettyDay(booking.checkOut)}
        </p>
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-900">
          Yanga has already paid you for this booking. <strong>You must refund the guest {kwacha(booking.total)} yourself</strong>,
          directly to them. Cancelling here only frees the room and notifies the guest.
        </div>
        <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Reason (optional)</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)}
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium">Keep booking</button>
          <button onClick={confirm} disabled={busy} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold disabled:opacity-60">
            {busy ? 'Cancelling…' : 'Cancel booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

const HostBookings = () => {
  const { bookings } = useHost();
  const [filter, setFilter] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [invoiceBusy, setInvoiceBusy] = useState('');
  const [notice, setNotice] = useState('');

  const today = todayZm();
  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    return bookings
      .map((b) => ({ ...b, phase: bookingPhase(b, today) }))
      .filter((b) => filter === 'all' || b.phase === filter)
      .filter((b) => !t || [b.guestName, b.guestPhone, b.roomName, b.invoiceNumber].some((v) => String(v || '').toLowerCase().includes(t)))
      // soonest check-in first for upcoming, newest first otherwise
      .sort((a, b) => (filter === 'upcoming' || filter === 'inhouse' ? a.checkIn.localeCompare(b.checkIn) : b.checkIn.localeCompare(a.checkIn)));
  }, [bookings, filter, search, today]);

  const counts = useMemo(() => {
    const c = {};
    bookings.forEach((b) => { const p = bookingPhase(b, today); c[p] = (c[p] || 0) + 1; });
    return c;
  }, [bookings, today]);

  const markSeen = (b) => updateDoc(doc(db, 'stayBookings', b.id), { hostSeen: true }).catch(() => {});

  const getSheets = () => [{
    name: 'Bookings', title: `Bookings: ${FILTERS.find((f) => f.key === filter)?.label || ''}`,
    columns: [
      { header: 'Guest', key: 'guest', width: 130 }, { header: 'Phone', key: 'phone', width: 95 }, { header: 'Room', key: 'room', width: 120 },
      { header: 'Check in', key: 'checkIn' }, { header: 'Check out', key: 'checkOut' }, { header: 'Nights', key: 'nights', type: 'number', width: 50 },
      { header: 'Guest paid (K)', key: 'paid', type: 'money' }, { header: 'You receive (K)', key: 'net', type: 'money', width: 105 },
      { header: 'Status', key: 'status' }, { header: 'Invoice', key: 'invoice', width: 110 }, { header: 'Booked', key: 'booked', width: 120 },
    ],
    rows: rows.map((b) => ({
      guest: b.guestName, phone: b.guestPhone, room: b.roomName, checkIn: b.checkIn, checkOut: b.checkOut, nights: b.nights,
      paid: b.total, net: b.businessAmount, status: PHASE_LABEL[b.phase] || b.status, invoice: b.invoiceNumber || '', booked: prettyTime(b.createdAt),
    })),
  }];

  const openInvoice = async (b) => {
    setInvoiceBusy(b.id); setNotice('');
    // Open the tab straight away (inside the click) so the browser doesn't block it.
    const win = window.open('', '_blank');
    try {
      const res = await callStay('getStayInvoiceLink')({ bookingId: b.id });
      if (win) win.location.href = res.data.url; else window.location.href = res.data.url;
    } catch (err) {
      if (win) win.close();
      setNotice(friendlyError(err, 'Could not open the invoice.'));
    } finally { setInvoiceBusy(''); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <div className="flex gap-2 items-center">
        <ExtractButton filename="yanga-bookings" title="Bookings" getSheets={getSheets} disabled={!rows.length} />
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest, phone, room…"
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border ${
              filter === f.key ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {f.label}{f.key !== 'all' && counts[f.key] ? ` (${counts[f.key]})` : ''}
          </button>
        ))}
      </div>

      {notice && <p className="mb-3 text-sm text-red-600">{notice}</p>}

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          {bookings.length === 0
            ? 'No bookings yet. When a guest books and pays, it will appear here instantly.'
            : EMPTY[filter] || 'No bookings match this filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const isNew = b.status === 'paid' && b.hostSeen === false;
            const pay = payoutText(b);
            return (
              <div key={b.id} className={`bg-white rounded-xl border p-4 sm:p-5 ${isNew ? 'border-green-400 ring-1 ring-green-300' : 'border-gray-100'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{b.roomName}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PHASE_STYLE[b.phase] || ''}`}>{PHASE_LABEL[b.phase]}</span>
                      {isNew && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">NEW</span>}
                    </div>
                    <div className={`mt-2 inline-flex items-stretch rounded-lg border overflow-hidden ${DATE_BOX[b.phase] || DATE_BOX.past}`}>
                      <div className="px-3 py-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">Check-in</p>
                        <p className="text-base font-extrabold leading-tight">{prettyDay(b.checkIn)}</p>
                      </div>
                      <div className="flex items-center px-1 text-lg font-bold opacity-60">→</div>
                      <div className="px-3 py-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">Check-out</p>
                        <p className="text-base font-extrabold leading-tight">{prettyDay(b.checkOut)}</p>
                      </div>
                      <div className="px-3 py-1.5 border-l border-black/10 flex flex-col justify-center text-center">
                        <p className="text-base font-extrabold leading-tight">{b.nights}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">night{b.nights > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {stayNote(b) && <p className="text-xs font-semibold mt-1.5 text-gray-700">{stayNote(b)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{kwacha(b.total)}</p>
                    <p className="text-xs text-gray-500">You receive {kwacha(b.businessAmount)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{b.guestName}</p>
                    <p className="text-gray-500">{b.guestPhone}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${b.guestPhone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                      <Phone size={14} /> Call
                    </a>
                    <a href={toWhatsApp(b.guestPhone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>

                {b.status === 'needs_refund' && (
                  <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
                    This payment arrived after the room was taken by another guest. Yanga is refunding the guest — you do not need to do anything and you will not be paid for it.
                  </p>
                )}
                {b.status === 'needs_review' && (
                  <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">Yanga is reviewing this payment. It will update here once resolved.</p>
                )}
                {b.status === 'cancelled' && (
                  <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg p-3">
                    Cancelled{b.cancelReason ? `: ${b.cancelReason}` : ''}. Remember to refund the guest {kwacha(b.total)} directly.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                  <span>
                    {b.invoiceNumber && <>Invoice {b.invoiceNumber} · </>}Booked {prettyTime(b.paidAt || b.createdAt)}
                    {pay.text && <> · <span className={pay.cls}>{pay.text}</span></>}
                  </span>
                  <div className="flex gap-2">
                    {isNew && (
                      <button onClick={() => markSeen(b)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                        Got it
                      </button>
                    )}
                    {b.invoiceNumber && (
                      <button onClick={() => openInvoice(b)} disabled={invoiceBusy === b.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        <FileText size={14} /> {invoiceBusy === b.id ? 'Opening…' : 'Invoice'}
                      </button>
                    )}
                    {(b.phase === 'upcoming' || b.phase === 'inhouse') && b.status === 'paid' && (
                      <button onClick={() => setCancelling(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-700 hover:bg-red-50">
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelling && (
        <CancelDialog
          booking={cancelling}
          onClose={() => setCancelling(null)}
          onDone={() => { setCancelling(null); setNotice(''); }}
        />
      )}
    </div>
  );
};

export default HostBookings;
