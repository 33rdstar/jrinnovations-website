import React, { useRef, useState } from 'react';
import {
  collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { ImagePlus, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { db, storage } from '../../Config/firebaseConfig';
import { useHost } from './HostContext';
import { COMMISSION_PERCENT, compressImage, kwacha, todayZm } from '../stayConfig';

const MAX_PHOTOS = 10;
const field = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500';

const emptyForm = { name: '', description: '', pricePerNight: '', capacity: '2', amenities: '', isActive: true, photos: [] };

const RoomForm = ({ businessId, room, onClose }) => {
  const isNew = !room;
  // The id is fixed up-front so photos can be uploaded to the room's own folder before it is saved.
  const roomRef = useRef(room ? doc(db, 'stayBusinesses', businessId, 'rooms', room.id) : doc(collection(db, 'stayBusinesses', businessId, 'rooms')));
  const [form, setForm] = useState(room ? {
    name: room.name || '', description: room.description || '', pricePerNight: String(room.pricePerNight ?? ''),
    capacity: String(room.capacity ?? 2), amenities: (room.amenities || []).join(', '),
    isActive: room.isActive !== false, photos: room.photos || [],
  } : emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const price = Number(form.pricePerNight);
  const validPrice = Number.isFinite(price) && price >= 1 && price <= 100000;

  const addPhotos = async (files) => {
    const picked = Array.from(files).slice(0, MAX_PHOTOS - form.photos.length);
    if (!picked.length) return;
    setUploading(true); setError('');
    try {
      const urls = [];
      for (const file of picked) {
        const blob = await compressImage(file);
        const r = storageRef(storage, `stays/${businessId}/rooms/${roomRef.current.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
        await uploadBytes(r, blob, { contentType: 'image/jpeg' });
        urls.push(await getDownloadURL(r));
      }
      setForm((f) => ({ ...f, photos: [...f.photos, ...urls] }));
    } catch (err) {
      console.error(err);
      setError(err?.message?.includes('unauthorized') ? 'Photo upload is not enabled yet. Please contact Yanga.' : (err.message || 'Photo upload failed.'));
    } finally { setUploading(false); }
  };

  const removePhoto = (url) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p !== url) }));
    deleteObject(storageRef(storage, url)).catch(() => {}); // best effort
  };

  const save = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const capacity = Number(form.capacity);
    const amenities = form.amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (!name || name.length > 80) return setError('Give the room a name (up to 80 characters).');
    if (!validPrice) return setError('Enter a price per night between K1 and K100,000.');
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) return setError('Guests must be a whole number from 1 to 50.');
    if (amenities.length > 30 || amenities.some((a) => a.length > 40)) return setError('Keep amenities short and under 30 items.');
    setBusy(true); setError('');
    try {
      const data = {
        name, description: form.description.trim().slice(0, 1000), pricePerNight: price, capacity, amenities,
        photos: form.photos, isActive: form.isActive, updatedAt: serverTimestamp(),
      };
      if (isNew) await setDoc(roomRef.current, { ...data, createdAt: serverTimestamp() });
      else await updateDoc(roomRef.current, data);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Could not save the room. Your business may not be approved yet.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl my-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{isNew ? 'Add a room' : 'Edit room'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Room name</label>
            <input className={field} value={form.name} onChange={set('name')} maxLength={80} placeholder="e.g. Deluxe Double, Room 4, 2-bed Apartment" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price per night (K)</label>
              <input className={field} inputMode="decimal" value={form.pricePerNight} onChange={set('pricePerNight')} placeholder="1500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max guests</label>
              <input className={field} inputMode="numeric" value={form.capacity} onChange={set('capacity')} />
            </div>
          </div>
          {validPrice && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              Guests pay <strong>{kwacha(price)}</strong> a night. After Yanga's {COMMISSION_PERCENT}% fee you receive{' '}
              <strong>{kwacha(Math.floor(price * (100 - COMMISSION_PERCENT)) / 100)}</strong> a night.
            </p>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea className={field} rows={3} maxLength={1000} value={form.description} onChange={set('description')} placeholder="Bed type, size, view, what's included…" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Amenities</label>
            <input className={field} value={form.amenities} onChange={set('amenities')} placeholder="Wi-Fi, Air conditioning, Parking, Kitchen" />
            <p className="text-xs text-gray-500 mt-1">Separate with commas.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photos ({form.photos.length}/{MAX_PHOTOS})</label>
            <div className="flex flex-wrap gap-2">
              {form.photos.map((url) => (
                <div key={url} className="relative w-20 h-20">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                  <button type="button" onClick={() => removePhoto(url)} aria-label="Remove photo"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center"><X size={14} /></button>
                </div>
              ))}
              {form.photos.length < MAX_PHOTOS && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-amber-500">
                  <ImagePlus size={20} />
                  {uploading ? 'Uploading…' : 'Add'}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer">
            <input type="checkbox" className="h-4 w-4" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Available for booking
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mt-4" role="alert">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium">Cancel</button>
          <button type="submit" disabled={busy || uploading} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold disabled:opacity-60">
            {busy ? 'Saving…' : 'Save room'}
          </button>
        </div>
      </form>
    </div>
  );
};

const HostRooms = () => {
  const { businessId, business, rooms, bookings } = useHost();
  const [editing, setEditing] = useState(null); // null | 'new' | room
  const [message, setMessage] = useState('');

  const canEdit = business?.status === 'approved';
  const today = todayZm();

  const upcomingFor = (roomId) =>
    bookings.filter((b) => b.roomId === roomId && b.status === 'paid' && b.checkOut > today).length;

  const toggle = async (room) => {
    setMessage('');
    try {
      await updateDoc(doc(db, 'stayBusinesses', businessId, 'rooms', room.id), {
        isActive: room.isActive === false, updatedAt: serverTimestamp(),
      });
    } catch { setMessage('Could not update the room.'); }
  };

  const remove = async (room) => {
    setMessage('');
    if (upcomingFor(room.id) > 0) {
      setMessage(`${room.name} has upcoming paid bookings, so it can't be deleted. Switch it off to stop new bookings.`);
      return;
    }
    if (!window.confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    try {
      // Clear the dates this host blocked on the room first; guest nights can't be (and aren't) touched.
      const nights = await getDocs(collection(db, 'stayBusinesses', businessId, 'rooms', room.id, 'nights'));
      await Promise.allSettled(nights.docs.filter((n) => n.data().status === 'blocked').map((n) => deleteDoc(n.ref)));
      await deleteDoc(doc(db, 'stayBusinesses', businessId, 'rooms', room.id));
    } catch { setMessage('Could not delete the room.'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <button
          onClick={() => setEditing('new')} disabled={!canEdit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold disabled:opacity-50"
        >
          <Plus size={18} /> Add room
        </button>
      </div>
      {message && <p className="mb-3 text-sm text-red-600">{message}</p>}

      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
          You haven't added any rooms yet. Guests can only book rooms that are listed here.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const on = room.isActive !== false;
            return (
              <div key={room.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
                {room.photos?.[0]
                  ? <img src={room.photos[0]} alt={room.name} className="h-40 w-full object-cover" />
                  : <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No photo</div>}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900">{room.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${on ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {on ? 'Available' : 'Switched off'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-amber-700 mt-1">{kwacha(room.pricePerNight)} <span className="text-xs font-normal text-gray-500">/ night</span></p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Users size={14} /> Up to {room.capacity} guests</p>
                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <button onClick={() => setEditing(room)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => toggle(room)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                      {on ? 'Switch off' : 'Switch on'}
                    </button>
                    <button onClick={() => remove(room)} aria-label="Delete room" className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <RoomForm
          businessId={businessId}
          room={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default HostRooms;
