import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, BedDouble, CalendarCheck, LogIn, Moon, TrendingUp, Wallet } from 'lucide-react';
import { useHost } from './HostContext';
import ExtractButton from './ExtractButton';
import useNow from './useNow';
import { kwacha, prettyDay, todayZm, addDays } from '../stayConfig';
import { change, inHouse, periodFor, previousPeriod, summarise, upcomingArrivals } from './hostStats';

// Each kind of number has its own colour so the cards can be told apart at a glance:
// blue = guests coming and going, green = money, amber = bookings, violet = nights, teal = rooms filled,
// sky = timing, rose = things that went wrong.
const TONES = {
  blue:   { card: 'bg-gradient-to-br from-blue-50 to-white border-blue-100',     icon: 'bg-blue-100 text-blue-600',     value: 'text-blue-900',    bar: 'bg-blue-500' },
  indigo: { card: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100', icon: 'bg-indigo-100 text-indigo-600', value: 'text-indigo-900',  bar: 'bg-indigo-500' },
  green:  { card: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-900', bar: 'bg-emerald-500' },
  amber:  { card: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',   icon: 'bg-amber-100 text-amber-600',   value: 'text-amber-900',   bar: 'bg-amber-500' },
  violet: { card: 'bg-gradient-to-br from-violet-50 to-white border-violet-100', icon: 'bg-violet-100 text-violet-600', value: 'text-violet-900',  bar: 'bg-violet-500' },
  teal:   { card: 'bg-gradient-to-br from-teal-50 to-white border-teal-100',     icon: 'bg-teal-100 text-teal-600',     value: 'text-teal-900',    bar: 'bg-teal-500' },
  sky:    { card: 'bg-gradient-to-br from-sky-50 to-white border-sky-100',       icon: 'bg-sky-100 text-sky-600',       value: 'text-sky-900',     bar: 'bg-sky-500' },
  rose:   { card: 'bg-gradient-to-br from-rose-50 to-white border-rose-100',     icon: 'bg-rose-100 text-rose-600',     value: 'text-rose-900',    bar: 'bg-rose-500' },
};

export const Stat = ({ icon: Icon, label, value, sub, trend, tone = 'blue' }) => {
  const t = TONES[tone] || TONES.blue;
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 ${t.card}`}>
      <span className={`absolute left-0 top-0 h-full w-1 ${t.bar}`} />
      <div className="flex items-center gap-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.icon}`}><Icon size={15} /></span>
        <span className="text-gray-600 text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold mt-3 ${t.value}`}>{value}</div>
      <div className="text-xs mt-1 flex items-center gap-1 text-gray-500 flex-wrap">
        {trend != null && (
          <span className={`inline-flex items-center font-semibold px-1.5 rounded-full ${trend >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(trend).toFixed(0)}%
          </span>
        )}
        {sub}
      </div>
    </div>
  );
};

const Row = ({ b, right }) => (
  <li className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0 text-sm">
    <div className="min-w-0">
      <p className="font-semibold text-gray-900 truncate">{b.guestName} <span className="font-normal text-gray-500">· {b.roomName}</span></p>
      <p className="text-xs text-gray-500">{prettyDay(b.checkIn)} → {prettyDay(b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''}</p>
    </div>
    <span className="text-xs text-gray-600 whitespace-nowrap">{right}</span>
  </li>
);

const HostDashboard = () => {
  const { business, rooms, bookings, payingNow, unseen } = useHost();
  const tick = useNow(30000);

  const view = useMemo(() => {
    const now = periodFor('30');
    const before = previousPeriod(now);
    const cur = summarise(bookings, rooms, now);
    const prev = summarise(bookings, rooms, before);
    const today = todayZm();
    return {
      cur, prev,
      arrivals: upcomingArrivals(bookings).slice(0, 5),
      staying: inHouse(bookings),
      today,
      arrivingToday: bookings.filter((b) => b.status === 'paid' && b.checkIn === today),
      leavingToday: bookings.filter((b) => b.status === 'paid' && b.checkOut === today),
      soon: bookings.filter((b) => b.status === 'paid' && b.checkIn > today && b.checkIn <= addDays(today, 2)).length,
    };
  }, [bookings, rooms, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const guestCols = [
    { header: 'Guest', key: 'guest', width: 140 }, { header: 'Room', key: 'room', width: 120 },
    { header: 'Check in', key: 'checkIn' }, { header: 'Check out', key: 'checkOut' }, { header: 'Nights', key: 'nights', type: 'number', width: 50 },
  ];
  const guestRows = (list) => list.map((b) => ({ guest: b.guestName, room: b.roomName, checkIn: b.checkIn, checkOut: b.checkOut, nights: b.nights }));
  const getSheets = () => [
    {
      name: 'Summary', title: 'Last 30 days',
      columns: [{ header: 'Measure', key: 'm', width: 190 }, { header: 'Value', key: 'v', type: 'number', width: 110 }],
      rows: [
        { m: 'You earned (K)', v: view.cur.revenue }, { m: 'Bookings', v: view.cur.count }, { m: 'Nights sold', v: view.cur.nights },
        { m: 'Occupancy (%)', v: Number(view.cur.occupancy.toFixed(1)) }, { m: 'Guests arriving today', v: view.arrivingToday.length },
        { m: 'Guests in house now', v: view.staying.length },
      ],
    },
    { name: 'Arriving soon', columns: guestCols, rows: guestRows(view.arrivals) },
    { name: 'In house', columns: guestCols, rows: guestRows(view.staying) },
  ];

  const activeRooms = rooms.filter((r) => r.isActive !== false).length;
  const paying = payingNow.filter((b) => b.holdExpiresAt?.toMillis?.() > tick);
  const todo = [];
  if (unseen) todo.push({ text: `${unseen} new booking${unseen > 1 ? 's' : ''} to look at`, to: '../bookings' });
  if (!rooms.length) todo.push({ text: 'Add your first room so guests can book', to: '../rooms' });
  else if (!activeRooms) todo.push({ text: 'All your rooms are switched off, so guests cannot book', to: '../rooms' });
  if (!(business?.photos || []).length) todo.push({ text: 'Add photos: places with photos get far more bookings', to: '../profile' });
  if (rooms.some((r) => !(r.photos || []).length)) todo.push({ text: 'Some rooms have no photos yet', to: '../rooms' });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome{business?.name ? `, ${business.name}` : ''}</h1>
          <p className="text-sm text-gray-500">Here is how things look today, and how the last 30 days went.</p>
        </div>
        <ExtractButton filename="yanga-dashboard" title="Dashboard summary" subtitle={`${business?.name || ''}. Last 30 days. `} getSheets={getSheets} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat tone="blue" icon={LogIn} label="Arriving today" value={view.arrivingToday.length} sub={`${view.soon} more in the next 2 days`} />
        <Stat tone="indigo" icon={BedDouble} label="In house now" value={view.staying.length} sub={`${view.leavingToday.length} leaving today`} />
        <Stat tone="green" icon={Wallet} label="Earned (30 days)" value={kwacha(view.cur.revenue)} trend={change(view.cur.revenue, view.prev.revenue)} sub="vs the 30 before" />
        <Stat tone="amber" icon={CalendarCheck} label="Bookings (30 days)" value={view.cur.count} trend={change(view.cur.count, view.prev.count)} sub="vs the 30 before" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat tone="violet" icon={Moon} label="Nights sold" value={view.cur.nights} sub={`avg stay ${view.cur.avgStay.toFixed(1)} nights`} />
        <Stat tone="teal" icon={TrendingUp} label="Occupancy" value={`${view.cur.occupancy.toFixed(0)}%`} sub={`${activeRooms} room${activeRooms === 1 ? '' : 's'} on sale`} />
      </div>

      {paying.length > 0 && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <h2 className="font-bold text-sky-900 text-sm">Guests paying right now</h2>
          <p className="text-xs text-sky-800 mt-0.5">These rooms are held for 15 minutes. They turn into bookings the moment the payment goes through.</p>
          <ul className="mt-2 space-y-1.5">
            {paying.map((b) => (
              <li key={b.id} className="text-sm text-sky-900">
                <strong>{b.guestName}</strong> · {b.roomName} · {prettyDay(b.checkIn)} → {prettyDay(b.checkOut)} · {kwacha(b.total)}
                <span className="text-sky-700"> · {Math.max(1, Math.ceil((b.holdExpiresAt.toMillis() - tick) / 60000))} min left</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {todo.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-bold text-amber-900 text-sm">To do</h2>
          <ul className="mt-2 space-y-1.5">
            {todo.map((t) => (
              <li key={t.text} className="text-sm"><Link to={t.to} className="text-amber-900 underline underline-offset-2">{t.text}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900">Arriving soon</h2>
          {view.arrivals.length === 0 ? <p className="text-sm text-gray-500 mt-3">No upcoming guests yet.</p> : (
            <ul className="mt-2">{view.arrivals.map((b) => <Row key={b.id} b={b} right={b.checkIn === view.today ? 'Today' : prettyDay(b.checkIn)} />)}</ul>
          )}
        </section>
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900">Staying with you now</h2>
          {view.staying.length === 0 ? <p className="text-sm text-gray-500 mt-3">Nobody is in house right now.</p> : (
            <ul className="mt-2">{view.staying.map((b) => <Row key={b.id} b={b} right={`out ${prettyDay(b.checkOut)}`} />)}</ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default HostDashboard;
