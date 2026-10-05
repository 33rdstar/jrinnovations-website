import { addDays, bookingPhase, todayZm } from '../stayConfig';

// Whole-day difference between two YYYY-MM-DD strings.
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

const paidOnly = (bookings) => bookings.filter((b) => b.status === 'paid');
const dayOf = (b) => (b.createdAt?.toMillis ? new Date(b.createdAt.toMillis() + 2 * 3600 * 1000).toISOString().slice(0, 10) : null);

// Nights of a booking that fall inside [from, to) - used so occupancy only counts the chosen window.
export const nightsWithin = (b, from, to) => {
  const start = b.checkIn > from ? b.checkIn : from;
  const end = b.checkOut < to ? b.checkOut : to;
  return Math.max(0, daysBetween(start, end));
};

// Summary for the dashboard and analytics pages. `period` is { from, to } (to is exclusive).
export const summarise = (bookings, rooms, period) => {
  const paid = paidOnly(bookings).filter((b) => {
    const made = dayOf(b);
    return made && made >= period.from && made < period.to;
  });
  const cancelled = bookings.filter((b) => {
    const made = dayOf(b);
    return b.status === 'cancelled' && made && made >= period.from && made < period.to;
  });
  const revenue = paid.reduce((t, b) => t + (b.businessAmount || 0), 0);
  const gross = paid.reduce((t, b) => t + (b.total || 0), 0);
  const nights = paid.reduce((t, b) => t + (b.nights || 0), 0);
  const lead = paid.length ? paid.reduce((t, b) => t + Math.max(0, daysBetween(dayOf(b), b.checkIn)), 0) / paid.length : 0;

  // Occupancy: nights that were actually stayed in the window, against every room on every day.
  const days = Math.max(1, daysBetween(period.from, period.to));
  const stayed = paidOnly(bookings).reduce((t, b) => t + nightsWithin(b, period.from, period.to), 0);
  const capacity = Math.max(1, rooms.filter((r) => r.isActive !== false).length) * days;

  return {
    count: paid.length, revenue, gross, nights,
    avgValue: paid.length ? revenue / paid.length : 0,
    avgStay: paid.length ? nights / paid.length : 0,
    leadDays: lead,
    cancelRate: paid.length + cancelled.length ? (cancelled.length / (paid.length + cancelled.length)) * 100 : 0,
    occupancy: Math.min(100, (stayed / capacity) * 100),
    cancelled: cancelled.length,
  };
};

// Revenue per month for the last `n` months, oldest first.
export const monthlyRevenue = (bookings, n = 6) => {
  const today = todayZm();
  const [y, m] = today.split('-').map(Number);
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }), value: 0 });
  }
  paidOnly(bookings).forEach((b) => {
    const made = dayOf(b);
    const slot = months.find((x) => made && made.startsWith(x.key));
    if (slot) slot.value += b.businessAmount || 0;
  });
  return months;
};

export const revenueByRoom = (bookings, period) => {
  const map = new Map();
  paidOnly(bookings).forEach((b) => {
    const made = dayOf(b);
    if (!made || made < period.from || made >= period.to) return;
    const row = map.get(b.roomName || 'Room') || { name: b.roomName || 'Room', value: 0, count: 0 };
    row.value += b.businessAmount || 0; row.count += 1;
    map.set(row.name, row);
  });
  return [...map.values()].sort((a, b) => b.value - a.value);
};

// How many guests arrive on each weekday (Mon..Sun), to show the busy days.
export const arrivalsByWeekday = (bookings, period) => {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const rows = names.map((name) => ({ name, value: 0 }));
  paidOnly(bookings).forEach((b) => {
    if (b.checkIn < period.from || b.checkIn >= period.to) return;
    const idx = (new Date(`${b.checkIn}T00:00:00Z`).getUTCDay() + 6) % 7;
    rows[idx].value += 1;
  });
  return rows;
};

export const PERIODS = [
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: '365', label: 'Last 12 months', days: 365 },
];
export const periodFor = (key) => {
  const p = PERIODS.find((x) => x.key === key) || PERIODS[0];
  const to = addDays(todayZm(), 1);
  return { from: addDays(to, -p.days), to, days: p.days };
};
// The same length of time immediately before, to show whether things are going up or down.
export const previousPeriod = (period) => ({ from: addDays(period.from, -period.days), to: period.from, days: period.days });

export const change = (now, before) => (before > 0 ? ((now - before) / before) * 100 : null);

export const upcomingArrivals = (bookings) => {
  const today = todayZm();
  return bookings.filter((b) => bookingPhase(b, today) === 'upcoming').sort((a, b) => a.checkIn.localeCompare(b.checkIn));
};
export const inHouse = (bookings) => bookings.filter((b) => bookingPhase(b) === 'inhouse');
