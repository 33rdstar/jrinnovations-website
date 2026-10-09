import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../Config/firebaseConfig';

// The Stays Cloud Functions live in europe-west1 alongside the Yanga app's.
const functions = getFunctions(app, 'europe-west1');
export const callStay = (name) => httpsCallable(functions, name);

// Must match TERMS_VERSION in the Yanga app's functions/stays.js, which stamps
// the version a business accepted onto its application.
export const TERMS_VERSION = '2026-10';
export const COMMISSION_PERCENT = 12;

export const BUSINESS_TYPES = [
  { value: 'hotel',       label: 'Hotel' },
  { value: 'lodge',       label: 'Lodge' },
  { value: 'guest_house', label: 'Guest house' },
  { value: 'apartment',   label: 'Furnished apartment' },
  { value: 'airbnb',      label: 'Airbnb / short-stay home' },
];
// Who is registering the business. The role is tied to the login (and can be handed over by Yanga).
export const STAY_ROLES = [
  { value: 'owner',   label: 'Owner',   hint: 'I own this business.' },
  { value: 'manager', label: 'Manager', hint: 'I manage it on the owner\'s behalf.' },
];
export const roleLabel = (v) => (STAY_ROLES.find((r) => r.value === v) || {}).label || '';

export const typeLabel = (v) => BUSINESS_TYPES.find((t) => t.value === v)?.label || v || '';

// ── money & dates ───────────────────────────────────────────────────────────
export const kwacha = (n) =>
  `K${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Zambia is UTC+2 all year, so "today" for a guest is the UTC date two hours ahead.
export const todayZm = () => new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 10);

export const addDays = (day, n) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export const prettyDay = (day) => {
  if (!day) return '';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
};

export const tsMillis = (v) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : 0);
export const prettyTime = (v) => {
  const ms = tsMillis(v);
  return ms
    ? new Date(ms).toLocaleString('en-GB', { timeZone: 'Africa/Lusaka', dateStyle: 'medium', timeStyle: 'short' })
    : '';
};

// ── bookings ────────────────────────────────────────────────────────────────
// Where a paid booking sits relative to today.
export const bookingPhase = (b, today = todayZm()) => {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'needs_refund' || b.status === 'needs_review') return 'attention';
  if (b.status !== 'paid') return 'other';
  if (b.checkIn > today) return 'upcoming';
  if (b.checkOut > today) return 'inhouse';
  return 'past';
};

// Hosts only ever see bookings that were actually paid (or are being sorted out).
export const HOST_VISIBLE = ['paid', 'cancelled', 'needs_refund', 'needs_review'];

// The Stays functions throw readable messages, which the Firebase SDK passes
// through as err.message. A bare "internal" means an unexpected server fault.
export const friendlyError = (err, fallback = 'Something went wrong. Please try again.') => {
  const msg = err?.message;
  return !msg || msg.toLowerCase() === 'internal' ? fallback : msg;
};

// ── location ────────────────────────────────────────────────────────────────
export const mapsLink = (loc) =>
  loc ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}` : '';

// ── images ──────────────────────────────────────────────────────────────────
// Shrinks a photo before upload: phone cameras produce 5–10 MB files, which
// are slow to upload on mobile data and slow to load in the guest app.
export const compressImage = (file, maxSide = 1600, quality = 0.8) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process that image.'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read.')); };
    img.src = url;
  });
