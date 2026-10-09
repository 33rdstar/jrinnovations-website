import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, deleteDoc, doc, documentId, onSnapshot, query, serverTimestamp, setDoc, where,
} from 'firebase/firestore';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { db } from '../../Config/firebaseConfig';
import { useHost } from './HostContext';
import { addDays, kwacha, prettyDay, todayZm } from '../stayConfig';
import useNow from './useNow';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthStart = (ym) => `${ym}-01`;
const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
};
const monthTitle = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// Builds the grid: leading blanks so the 1st lands on the right weekday (Monday first).
const monthCells = (ym) => {
  const first = monthStart(ym);
  const [y, m] = ym.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  return [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i))];
};

const STATE_STYLE = {
  free:    'bg-white border-gray-200 text-gray-800 hover:border-amber-400',
  paid:    'bg-blue-100 border-blue-300 text-blue-900',
  held:    'bg-amber-100 border-amber-300 text-amber-900',
  blocked: 'bg-gray-300 border-gray-400 text-gray-700 hover:bg-gray-200',
  past:    'bg-gray-50 border-gray-100 text-gray-300',
};

const HostCalendar = () => {
  const { businessId, business, rooms, bookings } = useHost();
  const tick = useNow(30000);                // re-checks expired holds and the date as time passes
  const today = todayZm();
  const [roomId, setRoomId] = useState('');
  const [month, setMonth] = useState(today.slice(0, 7));
  const [nights, setNights] = useState({});
  const [selected, setSelected] = useState(null); // a booked day, to show who is staying
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // Default to the first room once rooms load.
  useEffect(() => {
    if (!roomId && rooms.length) setRoomId(rooms[0].id);
  }, [rooms, roomId]);

  // Live nights for the visible month.
  useEffect(() => {
    if (!businessId || !roomId) return undefined;
    setNights({});
    const q = query(
      collection(db, 'stayBusinesses', businessId, 'rooms', roomId, 'nights'),
      where(documentId(), '>=', monthStart(month)),
      where(documentId(), '<=', `${month}-31`),
    );
    return onSnapshot(q,
      (snap) => setNights(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
      () => setError('Could not load the calendar.'));
  }, [businessId, roomId, month]);

  const bookingById = useMemo(() => Object.fromEntries(bookings.map((b) => [b.id, b])), [bookings]);
  const cells = useMemo(() => monthCells(month), [month]);

  const stateOf = (day) => {
    if (day < today) return 'past';
    const n = nights[day];
    if (!n) return 'free';
    if (n.status === 'held' && (n.holdExpiresAt?.toMillis?.() ?? 0) < tick) return 'free'; // lapsed hold
    return n.status;
  };

  const onDayClick = async (day) => {
    setError(''); setDone(''); setSelected(null);
    const state = stateOf(day);
    const roomName = rooms.find((r) => r.id === roomId)?.name || 'this room';
    const ref = doc(db, 'stayBusinesses', businessId, 'rooms', roomId, 'nights', day);
    try {
      if (state === 'free') { await setDoc(ref, { status: 'blocked', updatedAt: serverTimestamp() }); setDone(`${prettyDay(day)} is now blocked for ${roomName}.`); }
      else if (state === 'blocked') { await deleteDoc(ref); setDone(`${prettyDay(day)} is open again for ${roomName}.`); }
      else if (state === 'paid') setSelected(day);
      else if (state === 'held') setError('A guest is paying for this night right now. It will confirm or free up within 15 minutes.');
    } catch (err) {
      console.error(err);
      setError('Could not change that date. It may have just been booked.');
    }
  };

  if (business && business.status !== 'approved') return <p className="text-gray-500">The calendar is available once your business is approved.</p>;
  if (!rooms.length) return <p className="text-gray-500">Add a room first, then you can manage its dates here.</p>;

  const room = rooms.find((r) => r.id === roomId) || rooms[0];
  const cover = room?.photos?.[0];
  const booking = selected ? bookingById[nights[selected]?.bookingId] : null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Room
          <select value={roomId} onChange={(e) => { setRoomId(e.target.value); setSelected(null); setDone(''); setError(''); }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      </div>

      {/* So there is never any doubt which room the dates below belong to */}
      {room && (
        <div className="flex items-center gap-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-3 mb-4" aria-live="polite">
          {cover
            ? <img src={cover} alt={room.name} className="w-24 h-20 sm:w-32 sm:h-24 rounded-lg object-cover flex-shrink-0" />
            : <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-lg bg-white border border-amber-200 flex flex-col items-center justify-center text-amber-700 text-xs flex-shrink-0"><ImageOff size={20} />No photo</div>}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">You are changing the dates for</p>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">{room.name}</p>
            <p className="text-sm text-gray-600">{kwacha(room.pricePerNight)} per night · sleeps {room.capacity}{room.isActive === false ? ' · switched off' : ''}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={20} /></button>
          <h2 className="font-bold text-gray-900 text-center">{monthTitle(month)}<span className="block text-xs font-medium text-amber-700">{room?.name}</span></h2>
          <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-gray-500 mb-1.5">
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`b${i}`} />;
            const state = stateOf(day);
            return (
              <button
                key={day} onClick={() => state !== 'past' && onDayClick(day)} disabled={state === 'past'}
                title={state === 'free' ? 'Tap to block this night' : state === 'blocked' ? 'Tap to unblock' : state}
                className={`aspect-square rounded-lg border text-sm font-medium flex items-center justify-center ${STATE_STYLE[state]} ${day === today ? 'ring-2 ring-amber-500' : ''}`}
              >
                {Number(day.slice(8))}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-5 text-xs text-gray-600">
          {[['bg-white border-gray-300', 'Free'], ['bg-blue-100 border-blue-300', 'Booked & paid'], ['bg-amber-100 border-amber-300', 'Guest paying'], ['bg-gray-300 border-gray-400', 'Blocked by you']].map(([cls, text]) => (
            <span key={text} className="inline-flex items-center gap-1.5"><span className={`w-4 h-4 rounded border ${cls}`} />{text}</span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Tap a free night to block it (maintenance, a walk-in guest, a private booking). Tap a blocked night to open it again.</p>
        {done && <p className="text-sm text-green-700 font-medium mt-3" role="status">{done}</p>}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {selected && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
          <p className="font-bold">{prettyDay(selected)} is booked</p>
          {booking
            ? <p className="mt-1">{booking.guestName} · {booking.guestPhone} · {prettyDay(booking.checkIn)} to {prettyDay(booking.checkOut)}</p>
            : <p className="mt-1">Booking details are on the Bookings page.</p>}
        </div>
      )}
    </div>
  );
};

export default HostCalendar;
