import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../Config/firebaseConfig';
import { useAuth } from '../../Auth/AuthContext';
import { HOST_VISIBLE, tsMillis } from '../stayConfig';

const HostContext = createContext(null);
export const useHost = () => useContext(HostContext);

// A short two-tone chime, generated so no audio file is needed. Browsers only
// allow sound after the page has had a user interaction, so failures are ignored.
const chime = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.start(t); osc.stop(t + 0.32);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch { /* sound is a nicety */ }
};

// Live view of the host's business, rooms and bookings, shared by every page of
// the dashboard so a new paid booking is noticed wherever the host is.
export const HostProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [businessId, setBusinessId] = useState(null);
  const [business, setBusiness] = useState(null);
  const [contact, setContact] = useState(null);   // phone, address, location (kept off the public business document)
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ready, setReady] = useState({ profile: false, bookings: false });
  const [error, setError] = useState('');
  const [alertBooking, setAlertBooking] = useState(null);
  const knownIds = useRef(null);

  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => { setBusinessId(snap.data()?.stayBusinessId || null); setReady((r) => ({ ...r, profile: true })); },
      () => { setError('Could not load your account.'); setReady((r) => ({ ...r, profile: true })); },
    );
  }, [uid]);

  useEffect(() => {
    if (!businessId) return undefined;
    const unsubBusiness = onSnapshot(doc(db, 'stayBusinesses', businessId),
      (snap) => setBusiness(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setError('Could not load your business.'));
    const unsubContact = onSnapshot(doc(db, 'stayBusinesses', businessId, 'contact', 'details'),
      (snap) => setContact(snap.exists() ? snap.data() : {}),
      () => setError('Could not load your contact details.'));
    const unsubRooms = onSnapshot(collection(db, 'stayBusinesses', businessId, 'rooms'),
      (snap) => setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => tsMillis(a.createdAt) - tsMillis(b.createdAt))),
      () => setError('Could not load your rooms.'));
    return () => { unsubBusiness(); unsubContact(); unsubRooms(); };
  }, [businessId]);

  useEffect(() => {
    if (!uid) return undefined;
    // The rule only lets a host read bookings that name them, so the query must filter on it.
    const q = query(collection(db, 'stayBookings'), where('businessOwnerUid', '==', uid), orderBy('createdAt', 'desc'), limit(300));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((b) => HOST_VISIBLE.includes(b.status));
      setBookings(list);
      setReady((r) => ({ ...r, bookings: true }));

      // Announce bookings that appear after the first load.
      if (knownIds.current === null) {
        knownIds.current = new Set(list.map((b) => b.id));
      } else {
        const fresh = list.filter((b) => !knownIds.current.has(b.id) && b.status === 'paid');
        list.forEach((b) => knownIds.current.add(b.id));
        if (fresh.length) { setAlertBooking(fresh[0]); chime(); }
      }
    }, () => { setError('Could not load bookings.'); setReady((r) => ({ ...r, bookings: true })); });
  }, [uid]);

  const unseen = useMemo(() => bookings.filter((b) => b.status === 'paid' && b.hostSeen === false).length, [bookings]);

  // Tab title shows the count so a new booking is noticeable from another tab.
  useEffect(() => {
    const base = 'Yanga Stays';
    document.title = unseen ? `(${unseen}) New booking · ${base}` : base;
    return () => { document.title = base; };
  }, [unseen]);

  const value = {
    uid, businessId, business, contact, rooms, bookings, unseen, error,
    loading: !(ready.profile && ready.bookings),
    alertBooking, dismissAlert: () => setAlertBooking(null),
  };
  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
};
