import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BedDouble, BellRing, CalendarDays, ClipboardList, LogOut, Store, X } from 'lucide-react';
import { useAuth } from '../../Auth/AuthContext';
import { HostProvider, useHost } from './HostContext';
import { kwacha, prettyDay } from '../stayConfig';
import useYangaFavicon from '../useYangaFavicon';

const NAV = [
  { to: 'bookings', label: 'Bookings', icon: ClipboardList },
  { to: 'rooms',    label: 'Rooms',    icon: BedDouble },
  { to: 'calendar', label: 'Calendar', icon: CalendarDays },
  { to: 'profile',  label: 'My business', icon: Store },
];

const Shell = () => {
  useYangaFavicon();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { business, unseen, loading, error, alertBooking, dismissAlert } = useHost();

  const signOut = async () => { await logout(); navigate('/host/login'); };

  const pending = business && business.status !== 'approved';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0D1B2A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-amber-400 font-semibold leading-tight">Yanga Stays</p>
            <p className="text-xs text-white/60 truncate">{business?.name || 'Loading…'}{business?.ownerRole ? ` · ${business.ownerRole === 'manager' ? 'Manager' : 'Owner'}` : ''}</p>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <LogOut size={16} /> Sign out
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 ${
                  isActive ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/60 hover:text-white'}`}
            >
              <Icon size={16} /> {label}
              {to === 'bookings' && unseen > 0 && (
                <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{unseen}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      {alertBooking && (
        <div className="bg-green-600 text-white" role="alert">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-start gap-3">
            <BellRing className="mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1 text-sm">
              <p className="font-bold">New booking paid — please prepare {alertBooking.roomName}</p>
              <p>
                {alertBooking.guestName} · {prettyDay(alertBooking.checkIn)} to {prettyDay(alertBooking.checkOut)} ·{' '}
                {alertBooking.nights} night{alertBooking.nights > 1 ? 's' : ''} · you receive {kwacha(alertBooking.businessAmount)}
              </p>
            </div>
            <button onClick={dismissAlert} aria-label="Dismiss" className="text-white/80 hover:text-white"><X size={18} /></button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {pending && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            Your business is currently <strong>{business.status}</strong>, so it is not visible to guests and new bookings are switched off.
            Contact Yanga if you think this is a mistake.
          </div>
        )}
        {loading ? <p className="text-gray-500">Loading…</p> : <Outlet />}
      </main>
    </div>
  );
};

const HostLayout = () => (
  <HostProvider>
    <Shell />
  </HostProvider>
);

export default HostLayout;
