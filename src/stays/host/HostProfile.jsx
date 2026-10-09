import React, { useEffect, useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { ImagePlus, Star, X } from 'lucide-react';
import { db, storage } from '../../Config/firebaseConfig';
import { useHost } from './HostContext';
import LocationPicker from '../LocationPicker';
import { compressImage, typeLabel } from '../stayConfig';
import PayoutRequestCard from './PayoutRequestCard';

const MAX_PHOTOS = 10;
const field = 'w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500';

const HostProfile = () => {
  const { businessId, business, contact } = useHost();
  const [form, setForm] = useState(null);
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ kind: '', text: '' });

  // Load the editable copy once; later snapshots must not overwrite what is being typed.
  useEffect(() => {
    if (business && contact && !form) {
      setForm({
        description: business.description || '', phone: contact.phone || '', address: business.address || '',
        town: business.town || '', area: business.area || '', amenities: (business.amenities || []).join(', '),
      });
      setLocation(business.location || null);
      setPhotos(business.photos || []);
    }
  }, [business, contact, form]);

  if (!business || !form) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const flash = (kind, text) => setMessage({ kind, text });

  const addPhotos = async (files) => {
    const picked = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (!picked.length) return;
    setUploading(true); flash('', '');
    try {
      const urls = [];
      for (const file of picked) {
        const blob = await compressImage(file);
        const r = storageRef(storage, `stays/${businessId}/profile/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
        await uploadBytes(r, blob, { contentType: 'image/jpeg' });
        urls.push(await getDownloadURL(r));
      }
      setPhotos((p) => [...p, ...urls]);
    } catch (err) {
      console.error(err);
      flash('error', err?.message?.includes('unauthorized') ? 'Photo upload is not enabled yet. Please contact Yanga.' : (err.message || 'Photo upload failed.'));
    } finally { setUploading(false); }
  };

  const removePhoto = (url) => {
    setPhotos((p) => p.filter((x) => x !== url));
    deleteObject(storageRef(storage, url)).catch(() => {});
  };
  const makeCover = (url) => setPhotos((p) => [url, ...p.filter((x) => x !== url)]);

  const save = async (e) => {
    e.preventDefault();
    if (form.description.trim().length < 10) return flash('error', 'Add a short description of your business.');
    if (form.address.trim().length < 5) return flash('error', 'Enter your address.');
    if (!location) return flash('error', 'Pin your location.');
    const amenities = form.amenities.split(',').map((a) => a.trim()).filter(Boolean).slice(0, 30);
    setBusy(true); flash('', '');
    try {
      // The address and map pin are public. The phone number lives in a separate document that
      // guests can only read after paying.
      const batch = writeBatch(db);
      batch.update(doc(db, 'stayBusinesses', businessId), {
        description: form.description.trim(), town: form.town.trim(), area: form.area.trim(),
        address: form.address.trim(), location, amenities, photos, coverPhoto: photos[0] || null, updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'stayBusinesses', businessId, 'contact', 'details'), {
        phone: form.phone.trim(), updatedAt: serverTimestamp(),
      });
      await batch.commit();
      flash('ok', 'Saved.');
    } catch (err) {
      console.error(err);
      flash('error', 'Could not save your changes.');
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
    <form onSubmit={save} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
        <p className="text-sm text-gray-500">{typeLabel(business.type)} · {business.status}</p>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Photos</h2>
        <p className="text-xs text-gray-500">The first photo is your cover photo in the app. Use the star to change it.</p>
        <div className="flex flex-wrap gap-3">
          {photos.map((url, i) => (
            <div key={url} className="relative w-24 h-24">
              <img src={url} alt="" className={`w-24 h-24 object-cover rounded-lg border-2 ${i === 0 ? 'border-amber-500' : 'border-gray-200'}`} />
              {i !== 0 && (
                <button type="button" onClick={() => makeCover(url)} aria-label="Make cover photo" title="Make cover photo"
                  className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-white/90 text-amber-600 flex items-center justify-center"><Star size={14} /></button>
              )}
              <button type="button" onClick={() => removePhoto(url)} aria-label="Remove photo"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center"><X size={14} /></button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-xs text-gray-500 cursor-pointer hover:border-amber-500">
              <ImagePlus size={22} />{uploading ? 'Uploading…' : 'Add photo'}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-gray-900">About</h2>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea className={field} rows={4} maxLength={1000} value={form.description} onChange={set('description')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Facilities</label>
          <input className={field} value={form.amenities} onChange={set('amenities')} placeholder="Restaurant, Swimming pool, Free parking" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Business contact phone</label><input className={field} value={form.phone} onChange={set('phone')} /><p className="text-xs text-gray-500 mt-1">Guests see this number after they pay. It is not where your money goes.</p></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Town</label><input className={field} value={form.town} onChange={set('town')} /></div>
        </div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Area / neighbourhood</label><input className={field} value={form.area} onChange={set('area')} placeholder="e.g. Chelstone" /><p className="text-xs text-gray-500 mt-1">Guests can filter places by area in the app.</p></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Address</label><input className={field} value={form.address} onChange={set('address')} /></div>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-bold text-gray-900">Location</h2>
        <LocationPicker value={location} onChange={setLocation} searchHint={[form.area, form.town].map((x) => x.trim()).filter(Boolean).join(', ')} />
      </section>


      {message.text && (
        <p className={`text-sm font-medium ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`} role="status">{message.text}</p>
      )}
      <button type="submit" disabled={busy || uploading}
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold disabled:opacity-60">
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
    <PayoutRequestCard />
    </div>
  );
};

export default HostProfile;
