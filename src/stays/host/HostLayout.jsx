import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, BedDouble, BellRing, CalendarDays, ClipboardList, LayoutDashboard, LifeBuoy, LogOut, Menu, Store, Wallet, X,
} from 'lucide-react';
import { useAuth } from '../../Auth/AuthContext';
import { HostProvider, useHost } from './HostContext';
import { kwacha, prettyDay } from '../stayConfig';
import useYangaFavicon from '../useYangaFavicon';

const NAV = [
  { group: 'Overview', items: [
    { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] },
  { group: 'Run your business', items: [
    { to: 'bookings', label: 'Bookings', icon: ClipboardList },
    { to: 'calendar', label: 'Calendar', icon: CalendarDays },
    { to: 'rooms',    label: 'Rooms',    icon: BedDouble },
  ] },
  { group: 'Money & account', items: [
    { to: 'earnings', label: 'Earnings', icon: Wallet },
    { to: 'profile',  label: 'My business', icon: Store },
    { to: 'help',     label: 'Help', icon: LifeBuoy },
  ] },
];

const Shell = () => {
  useYangaFavicon();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { business, unseen, loading, error, alertBooking, dismissAlert } = useHost();
  const [open, setOpen] = useState(false);

  // The drawer closes itself when a page is chosen.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const signOut = async () => { await logout(); navigate('/host/login'); };
  const pending = business && business.status !== 'approved';

  const sidebar = (
    <div className="h-full flex flex-col bg-[#0D1B2A] text-white">
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-amber-400 font-bold text-lg leading-tight">Yanga Stays</p>
        <p className="text-xs text-white/60 mt-1 truncate">{business?.name || 'Loading…'}</p>
        {business?.ownerRole && <p className="text-[11px] text-white/40">{business.ownerRole === 'manager' ? 'Manager' : 'Owner'} login</p>}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">{g.group}</p>
            {g.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 ${
                    isActive ? 'bg-amber-400/15 text-amber-400 font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={18} /> <span className="flex-1">{label}</span>
                {to === 'bookings' && unseen > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{unseen}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">{sidebar}</aside>

      {/* Phone: slim top bar + slide-in drawer */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0D1B2A] text-white flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1"><Menu size={22} /></button>
        <div className="min-w-0 flex-1">
          <p className="text-amber-400 font-semibold leading-tight">Yanga Stays</p>
          <p className="text-xs text-white/60 truncate">{business?.name || 'Loading…'}</p>
        </div>
        {unseen > 0 && <span className="min-w-[22px] h-6 px-2 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center">{unseen}</span>}
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-72 max-w-[85%] h-full shadow-2xl relative">
            {sidebar}
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute top-4 right-3 text-white/70"><X size={20} /></button>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {alertBooking && (
          <div className="bg-green-600 text-white" role="alert">
            <div className="px-4 py-3 flex items-start gap-3">
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

        <main className="max-w-5xl mx-auto px-4 py-6">
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
    </div>
  );
};

const HostLayout = () => (
  <HostProvider>
    <Shell />
  </HostProvider>
);

export default HostLayout;
