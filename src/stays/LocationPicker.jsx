import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Maximize2, Minimize2, MapPin, Search } from 'lucide-react';
import { mapsLink } from './stayConfig';

// An always-visible map where the business drops a pin on its exact building:
// tap/click to place it, drag it to adjust, search a place name to jump there, or use
// the device location. The map can be expanded to full screen for precise pinning.
// OpenStreetMap tiles: free and key-less (fine for this volume; revisit if traffic grows).

const ZAMBIA_CENTER = [-15.4167, 28.2833];            // Lusaka
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// An inline SVG pin, so no image assets need bundling.
const pinIcon = L.divIcon({
  className: '',
  html: '<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))"><path d="M17 0C7.6 0 0 7.5 0 16.8 0 29.4 17 44 17 44s17-14.6 17-27.2C34 7.5 26.4 0 17 0z" fill="#FFA500" stroke="#050c2c" stroke-width="2"/><circle cx="17" cy="16.5" r="6" fill="#050c2c"/></svg>',
  iconSize: [34, 44],
  iconAnchor: [17, 44],
});

const round6 = (n) => Number(n.toFixed(6));

const LocationPicker = ({ value, onChange, dark = false, searchHint = '' }) => {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState('');

  const setPin = useCallback((lat, lng, { notify = true } = {}) => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onChangeRef.current({ latitude: round6(p.lat), longitude: round6(p.lng) });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (notify) onChangeRef.current({ latitude: round6(lat), longitude: round6(lng) });
  }, []);

  // Create the map once.
  useEffect(() => {
    const map = L.map(mapEl.current, {
      center: value ? [value.latitude, value.longitude] : ZAMBIA_CENTER,
      zoom: value ? 17 : 12,
      scrollWheelZoom: false,
      dragging: !isTouch,           // on a phone, one finger scrolls the page until the map is expanded
      zoomControl: true,
    });
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    map.on('click', (e) => { setNote(''); setPin(e.latlng.lat, e.latlng.lng); });
    mapRef.current = map;
    if (value) setPin(value.latitude, value.longitude, { notify: false });
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the value when it is set from outside (e.g. a saved profile finishing loading).
  useEffect(() => {
    if (!value || !mapRef.current) return;
    const cur = markerRef.current?.getLatLng();
    if (!cur || Math.abs(cur.lat - value.latitude) > 1e-6 || Math.abs(cur.lng - value.longitude) > 1e-6) {
      setPin(value.latitude, value.longitude, { notify: false });
      if (!cur) mapRef.current.setView([value.latitude, value.longitude], 17);
    }
  }, [value, setPin]);

  // Expanded mode: full screen, all gestures on, page scroll locked, Esc to close.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    if (expanded) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      document.body.style.overflow = 'hidden';
    } else {
      if (isTouch) map.dragging.disable();
      map.scrollWheelZoom.disable();
      document.body.style.overflow = '';
    }
    const t = setTimeout(() => map.invalidateSize(), 60);
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [expanded]);

  const search = async (e) => {
    e?.preventDefault?.();
    const q = (query.trim() || searchHint).trim();
    if (!q) { setNote('Type a place to search for, e.g. Chelstone, Lusaka.'); return; }
    setSearching(true); setNote('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=zm&q=${encodeURIComponent(q)}`);
      const hits = await res.json();
      if (!hits.length) { setNote(`We could not find "${q}". Try a nearby landmark or road.`); return; }
      const hit = hits[0];
      const map = mapRef.current;
      if (hit.boundingbox) {
        const [s, n, w, ea] = hit.boundingbox.map(Number);
        map.fitBounds([[s, w], [n, ea]], { maxZoom: 17 });
      } else {
        map.setView([Number(hit.lat), Number(hit.lon)], 16);
      }
      setNote('Now tap the map on your exact building to drop the pin.');
    } catch {
      setNote('Search is unavailable right now. You can still move the map and tap to place your pin.');
    } finally {
      setSearching(false);
    }
  };

  const onEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setNote('Your browser cannot share its location.'); return; }
    setLocating(true); setNote('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPin(pos.coords.latitude, pos.coords.longitude);
        mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 18);
      },
      () => { setLocating(false); setNote('Could not get your location. Allow location access, or search for your area and tap the map.'); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const inputCls = dark ? 'bg-white/10 border-white/15 text-white placeholder-white/30' : 'bg-white border-gray-300 text-gray-900';
  const btnCls = dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-50';
  const muted = dark ? 'text-white/55' : 'text-gray-500';

  const searchBar = (
    <div className="flex gap-2">
      <input
        type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onEnter}
        placeholder={searchHint ? `Search, e.g. ${searchHint}` : 'Search a place, e.g. Chelstone, Lusaka'}
        className={`flex-1 min-w-0 px-4 py-2.5 rounded-lg border ${inputCls} focus:outline-none focus:ring-2 focus:ring-amber-500`}
      />
      <button type="button" onClick={search} disabled={searching}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border ${btnCls} text-sm font-medium disabled:opacity-60`}>
        <Search size={16} /> <span className="hidden sm:inline">{searching ? 'Searching…' : 'Search'}</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {!expanded && searchBar}

      {/* The wrapper changes size/position; the map element itself must keep a constant className
          (React would otherwise wipe the classes Leaflet adds to it). */}
      <div className={expanded ? 'fixed inset-0 z-[1000] bg-white' : `relative h-72 rounded-lg overflow-hidden border ${dark ? 'border-white/15' : 'border-gray-300'}`}>
        {expanded && (
          <div className="absolute top-3 left-3 right-3 z-[1100] max-w-xl">
            <div className="rounded-lg bg-white/95 p-2 shadow">
              <div className="flex gap-2">
                <input
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onEnter}
                  placeholder="Search a place, e.g. Chelstone, Lusaka"
                  className="flex-1 min-w-0 px-3 py-2 rounded-md border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button type="button" onClick={search} disabled={searching} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#050c2c] text-white text-sm font-medium disabled:opacity-60">
                  <Search size={16} /> {searching ? '…' : 'Search'}
                </button>
              </div>
              {!!note && <p className="text-xs text-amber-700 mt-1.5 px-1">{note}</p>}
            </div>
          </div>
        )}
        <div ref={mapEl} className="w-full h-full" style={{ zIndex: 0 }} />

        <div className="absolute z-[1100] flex gap-2 bottom-3 right-3">
          <button type="button" onClick={useMyLocation} disabled={locating} aria-label="Use my current location"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/95 text-gray-800 text-sm font-medium shadow hover:bg-white disabled:opacity-60">
            <Crosshair size={16} /> <span className="hidden sm:inline">{locating ? 'Locating…' : 'My location'}</span>
          </button>
          <button type="button" onClick={() => setExpanded((x) => !x)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold shadow hover:brightness-110"
            style={{ background: '#FFA500', color: '#050c2c' }}>
            {expanded ? <><Minimize2 size={16} /> Done</> : <><Maximize2 size={16} /> Expand map</>}
          </button>
        </div>

        {expanded && !value && (
          <div className="absolute bottom-4 left-3 z-[1100] max-w-[55%] px-3 py-2 rounded-lg bg-[#050c2c]/90 text-white text-sm">
            Tap the map to drop your pin.
          </div>
        )}
      </div>

      <p className={`text-xs ${muted}`}>
        {value
          ? <span className="inline-flex flex-wrap items-center gap-x-1"><MapPin size={13} /> Pin placed. Tap the map or drag the pin to move it.{' '}
              <a href={mapsLink(value)} target="_blank" rel="noreferrer" className={`font-medium hover:underline ${dark ? 'text-amber-400' : 'text-amber-700'}`}>Check in Google Maps</a></span>
          : <>Search for your area, then tap the map on your exact building to drop the pin.{isTouch ? ' Tap "Expand map" to move around and zoom.' : ''}</>}
      </p>
      {!expanded && !!note && <p className={`text-sm ${dark ? 'text-amber-300' : 'text-amber-700'}`}>{note}</p>}
    </div>
  );
};

export default LocationPicker;
