import React, { useMemo, useState } from 'react';
import { useHost } from './HostContext';
import { kwacha, prettyDay, prettyTime, tsMillis } from '../stayConfig';
import ExtractButton from './ExtractButton';

const PAY = {
  paid: ['Sent to your mobile money', 'bg-green-50 text-green-700'],
  processing: ['On its way', 'bg-amber-50 text-amber-800'],
  pending: ['Being sent', 'bg-amber-50 text-amber-800'],
  failed: ['Being sorted by Yanga', 'bg-red-50 text-red-700'],
  skipped: ['Being sorted by Yanga', 'bg-red-50 text-red-700'],
  needs_review: ['Being sorted by Yanga', 'bg-red-50 text-red-700'],
};

// A statement of every paid booking: what the guest paid, Yanga's fee, and what reached the business.
const HostEarnings = () => {
  const { bookings } = useHost();
  const [month, setMonth] = useState('all');

  const paid = useMemo(() => bookings.filter((b) => b.status === 'paid').sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt)), [bookings]);
  const monthKey = (b) => new Date(tsMillis(b.createdAt) + 2 * 3600 * 1000).toISOString().slice(0, 7);
  const months = useMemo(() => [...new Set(paid.map(monthKey))], [paid]);
  const shown = month === 'all' ? paid : paid.filter((b) => monthKey(b) === month);

  const totals = shown.reduce((t, b) => ({
    gross: t.gross + (b.total || 0), fee: t.fee + (b.commission || 0), net: t.net + (b.businessAmount || 0),
    sent: t.sent + (b.payoutStatus === 'paid' ? (b.businessAmount || 0) : 0),
  }), { gross: 0, fee: 0, net: 0, sent: 0 });

  const sheet = {
    name: 'Earnings', title: 'Yanga Stays earnings',
    columns: [
      { header: 'Booked', key: 'booked', width: 120 }, { header: 'Invoice', key: 'invoice', width: 110 }, { header: 'Guest', key: 'guest', width: 130 },
      { header: 'Room', key: 'room', width: 110 }, { header: 'Check in', key: 'checkIn' }, { header: 'Check out', key: 'checkOut' },
      { header: 'Nights', key: 'nights', type: 'number', width: 50 }, { header: 'Guest paid (K)', key: 'paid', type: 'money' },
      { header: 'Yanga fee (K)', key: 'fee', type: 'money' }, { header: 'You receive (K)', key: 'net', type: 'money', width: 105 }, { header: 'Payout', key: 'payout', width: 170 },
    ],
    rows: shown.map((b) => ({
      booked: prettyTime(b.createdAt), invoice: b.invoiceNumber || '', guest: b.guestName, room: b.roomName, checkIn: b.checkIn, checkOut: b.checkOut,
      nights: b.nights, paid: b.total, fee: b.commission, net: b.businessAmount, payout: (PAY[b.payoutStatus] || [''])[0],
    })),
  };
  const totalRow = { guest: 'TOTAL', paid: totals.gross, fee: totals.fee, net: totals.net };
  const fileName = `yanga-earnings-${month}`;
  const getSheets = () => [{ ...sheet, rows: [...sheet.rows, totalRow] }];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500">Every paid booking, Yanga's fee, and what reached you.</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
            <option value="all">All time</option>
            {months.map((m) => <option key={m} value={m}>{new Date(`${m}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</option>)}
          </select>
          <ExtractButton filename={fileName} title="Earnings" subtitle={month === 'all' ? 'All time. ' : `${month}. `} getSheets={getSheets} disabled={!shown.length} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Guests paid', kwacha(totals.gross), 'text-gray-900'],
          ["Yanga's fee (12%)", `− ${kwacha(totals.fee)}`, 'text-gray-600'],
          ['You receive', kwacha(totals.net), 'text-green-700'],
          ['Already sent to you', kwacha(totals.sent), 'text-gray-900'],
        ].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{l}</p>
            <p className={`text-xl font-bold mt-2 ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {shown.length === 0 ? <p className="p-6 text-sm text-gray-500">No paid bookings here yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr><th className="text-left p-3">Guest</th><th className="text-left p-3">Stay</th><th className="text-right p-3">Paid</th><th className="text-right p-3">Fee</th><th className="text-right p-3">You get</th><th className="text-left p-3">Payout</th></tr>
              </thead>
              <tbody>
                {shown.map((b) => {
                  const [txt, cls] = PAY[b.payoutStatus] || ['', ''];
                  return (
                    <tr key={b.id} className="border-t border-gray-50">
                      <td className="p-3"><p className="font-medium text-gray-900">{b.guestName}</p><p className="text-xs text-gray-500">{b.invoiceNumber || prettyTime(b.createdAt)}</p></td>
                      <td className="p-3 text-gray-700">{b.roomName}<p className="text-xs text-gray-500">{prettyDay(b.checkIn)} → {prettyDay(b.checkOut)}</p></td>
                      <td className="p-3 text-right">{kwacha(b.total)}</td>
                      <td className="p-3 text-right text-gray-500">{kwacha(b.commission)}</td>
                      <td className="p-3 text-right font-semibold text-green-700">{kwacha(b.businessAmount)}</td>
                      <td className="p-3">{txt && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>{txt}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="text-xs text-gray-500">Showing your most recent 300 bookings. Refunds for cancelled bookings are handled by you directly with the guest.</p>
    </div>
  );
};

export default HostEarnings;
