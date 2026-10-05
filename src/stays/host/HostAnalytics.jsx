import React, { useMemo, useState } from 'react';
import { BedDouble, CalendarCheck, Clock, Moon, Percent, Wallet, XCircle } from 'lucide-react';
import { useHost } from './HostContext';
import { kwacha } from '../stayConfig';
import {
  PERIODS, arrivalsByWeekday, change, monthlyRevenue, periodFor, previousPeriod, revenueByRoom, summarise,
} from './hostStats';
import { Stat } from './HostDashboard';
import ExtractButton from './ExtractButton';

// A simple horizontal/vertical bar list drawn with plain divs: no chart library needed.
const Bars = ({ rows, format = (v) => v, colour = 'bg-amber-400', height = 140 }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {rows.map((r) => (
        <div key={r.label || r.name} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
          <span className="text-[10px] text-gray-500 mb-1 truncate max-w-full">{r.value ? format(r.value) : ''}</span>
          <div className={`w-full rounded-t ${colour}`} style={{ height: `${Math.max(r.value ? 4 : 1, (r.value / max) * 100)}%`, opacity: r.value ? 1 : 0.25 }} />
          <span className="text-[11px] text-gray-600 mt-1">{r.label || r.name}</span>
        </div>
      ))}
    </div>
  );
};

const HostAnalytics = () => {
  const { rooms, bookings } = useHost();
  const [key, setKey] = useState('30');

  const data = useMemo(() => {
    const period = periodFor(key);
    const cur = summarise(bookings, rooms, period);
    const prev = summarise(bookings, rooms, previousPeriod(period));
    return {
      cur, prev,
      months: monthlyRevenue(bookings, 6),
      byRoom: revenueByRoom(bookings, period),
      weekdays: arrivalsByWeekday(bookings, period),
    };
  }, [bookings, rooms, key]);

  const { cur, prev } = data;
  const periodLabel = PERIODS.find((p) => p.key === key)?.label || '';

  const getSheets = () => [
      {
        name: 'Summary', title: `Analytics: ${periodLabel}`,
        columns: [{ header: 'Measure', key: 'm', width: 190 }, { header: 'This period', key: 'now', type: 'number', width: 110 }, { header: 'Period before', key: 'before', type: 'number', width: 110 }],
        rows: [
          { m: 'You earned (K)', now: cur.revenue, before: prev.revenue },
          { m: 'Guests paid (K)', now: cur.gross, before: prev.gross },
          { m: 'Bookings', now: cur.count, before: prev.count },
          { m: 'Nights sold', now: cur.nights, before: prev.nights },
          { m: 'Average stay (nights)', now: Number(cur.avgStay.toFixed(2)), before: Number(prev.avgStay.toFixed(2)) },
          { m: 'Average booking value (K)', now: Number(cur.avgValue.toFixed(2)), before: Number(prev.avgValue.toFixed(2)) },
          { m: 'Occupancy (%)', now: Number(cur.occupancy.toFixed(1)), before: Number(prev.occupancy.toFixed(1)) },
          { m: 'Booked ahead (days)', now: Number(cur.leadDays.toFixed(1)), before: Number(prev.leadDays.toFixed(1)) },
          { m: 'Cancellation rate (%)', now: Number(cur.cancelRate.toFixed(1)), before: Number(prev.cancelRate.toFixed(1)) },
        ],
      },
      { name: 'Earnings by month', columns: [{ header: 'Month', key: 'label' }, { header: 'You received (K)', key: 'value', type: 'money', width: 130 }], rows: data.months },
      { name: 'By room', columns: [{ header: 'Room', key: 'name', width: 170 }, { header: 'Bookings', key: 'count', type: 'number' }, { header: 'You received (K)', key: 'value', type: 'money', width: 130 }], rows: data.byRoom },
      { name: 'Arrival days', columns: [{ header: 'Day', key: 'name' }, { header: 'Arrivals', key: 'value', type: 'number' }], rows: data.weekdays },
  ];
  const best = [...data.weekdays].sort((a, b) => b.value - a.value)[0];
  const roomMax = Math.max(1, ...data.byRoom.map((r) => r.value));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">What is working, and when guests book and arrive.</p>
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <ExtractButton filename={`yanga-analytics-${key}-days`} title={`Analytics: ${periodLabel}`} getSheets={getSheets} />
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setKey(p.key)}
              className={`px-3 py-1.5 rounded-full text-sm border ${key === p.key ? 'bg-amber-400 border-amber-400 text-[#0D1B2A] font-semibold' : 'border-gray-300 text-gray-600 bg-white'}`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat tone="green" icon={Wallet} label="You earned" value={kwacha(cur.revenue)} trend={change(cur.revenue, prev.revenue)} sub="after Yanga's fee" />
        <Stat tone="amber" icon={CalendarCheck} label="Bookings" value={cur.count} trend={change(cur.count, prev.count)} sub={`avg ${kwacha(cur.avgValue)} each`} />
        <Stat tone="teal" icon={Percent} label="Occupancy" value={`${cur.occupancy.toFixed(0)}%`} trend={change(cur.occupancy, prev.occupancy)} sub="nights stayed / nights available" />
        <Stat tone="violet" icon={Moon} label="Nights sold" value={cur.nights} trend={change(cur.nights, prev.nights)} sub={`avg stay ${cur.avgStay.toFixed(1)} nights`} />
        <Stat tone="sky" icon={Clock} label="Booked ahead" value={`${cur.leadDays.toFixed(1)} days`} sub="average time before arrival" />
        <Stat tone="rose" icon={XCircle} label="Cancellations" value={`${cur.cancelRate.toFixed(0)}%`} sub={`${cur.cancelled} cancelled`} />
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900">Earnings by month</h2>
        <p className="text-xs text-gray-500 mb-3">What you receive, by the month guests booked. Last 6 months.</p>
        <Bars rows={data.months} format={(v) => `K${Math.round(v).toLocaleString('en-US')}`} />
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><BedDouble size={16} /> Which rooms earn most</h2>
          {data.byRoom.length === 0 ? <p className="text-sm text-gray-500 mt-3">No paid bookings in this period yet.</p> : (
            <ul className="mt-3 space-y-3">
              {data.byRoom.map((r) => (
                <li key={r.name}>
                  <div className="flex justify-between text-sm"><span className="font-medium text-gray-800 truncate">{r.name}</span><span className="text-gray-600">{kwacha(r.value)} · {r.count}</span></div>
                  <div className="h-2 rounded bg-gray-100 mt-1"><div className="h-2 rounded bg-amber-400" style={{ width: `${(r.value / roomMax) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900">Busiest arrival days</h2>
          <p className="text-xs text-gray-500 mb-3">{best && best.value ? `Most guests arrive on ${best.name}.` : 'Shows when guests check in.'}</p>
          <Bars rows={data.weekdays} colour="bg-[#0D1B2A]" height={120} />
        </section>
      </div>

      <section className="rounded-xl bg-[#0D1B2A] text-white p-5 text-sm space-y-1.5">
        <p className="font-bold text-amber-400">Ideas to earn more</p>
        {cur.occupancy < 40 && <p>• Your rooms are empty most nights. Add more photos and check your price against similar places nearby.</p>}
        {cur.cancelRate > 15 && <p>• Many bookings are being cancelled. Make sure your calendar is accurate so you never have to cancel on a guest.</p>}
        {cur.leadDays > 0 && cur.leadDays < 2 && <p>• Guests mostly book at the last minute. Keep your calendar up to date every day.</p>}
        {best && best.value > 0 && <p>• {best.name} is your busiest arrival day. Consider a slightly higher price for it.</p>}
        <p>• Rooms with several clear photos and a short, honest description get booked more often.</p>
      </section>
    </div>
  );
};

export default HostAnalytics;
