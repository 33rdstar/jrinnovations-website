import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BedDouble, Bell, CalendarDays, ClipboardCheck, FileText, KeyRound, LogIn, MapPin, Menu,
  ShieldCheck, Smartphone, Store, Wallet, X,
} from 'lucide-react';
import { COMMISSION_PERCENT, kwacha } from './stayConfig';
import useYangaFavicon from './useYangaFavicon';

// Yanga theme: the app's deep navy with amber (#FFA500) accents, as in the Yanga logo.
const AMBER = '#FFA500';
const page = { background: 'linear-gradient(180deg, #050c2c 0%, #050b26 55%, #01030d 100%)' };
const panel = 'rounded-2xl border border-white/10 bg-white/[0.04]';

const SectionTitle = ({ kicker, title, children }) => (
  <div className="text-center max-w-2xl mx-auto mb-10">
    {kicker && <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: AMBER }}>{kicker}</p>}
    <h2 className="text-3xl sm:text-4xl font-bold text-white">{title}</h2>
    {children && <p className="text-white/60 mt-3">{children}</p>}
  </div>
);

const Cta = ({ to, children, variant = 'solid', className = '' }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
      variant === 'solid' ? 'text-[#050c2c] hover:brightness-110' : 'text-white border border-white/25 hover:bg-white/10'} ${className}`}
    style={variant === 'solid' ? { background: AMBER } : undefined}
  >
    {children}
  </Link>
);

// What a business actually receives, using the same rounding as the payment system
// (the business share is rounded down, so Yanga keeps any odd ngwee).
const EarningsCalculator = () => {
  const [price, setPrice] = useState('1500');
  const [nights, setNights] = useState('2');
  const result = useMemo(() => {
    const p = Math.round(Number(price) * 100);
    const n = Math.floor(Number(nights));
    if (!Number.isFinite(p) || p < 100 || !Number.isInteger(n) || n < 1 || n > 30) return null;
    const total = p * n;
    const business = Math.floor((total * (100 - COMMISSION_PERCENT)) / 100);
    return { total: total / 100, business: business / 100, fee: (total - business) / 100 };
  }, [price, nights]);

  const input = 'w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-amber-400';
  return (
    <div className={`${panel} p-6 sm:p-8 max-w-2xl mx-auto`}>
      <h3 className="text-xl font-bold text-white mb-1">See what you would earn</h3>
      <p className="text-sm text-white/60 mb-5">Try your own room price and a length of stay.</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <label className="text-sm text-white/70">Price per night (K)
          <input className={`${input} mt-1`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="text-sm text-white/70">Nights stayed
          <input className={`${input} mt-1`} inputMode="numeric" value={nights} onChange={(e) => setNights(e.target.value)} />
        </label>
      </div>
      {result ? (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-white/50">Guest pays</p><p className="text-lg font-bold text-white mt-1">{kwacha(result.total)}</p></div>
          <div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-white/50">Yanga fee ({COMMISSION_PERCENT}%)</p><p className="text-lg font-bold text-white/80 mt-1">{kwacha(result.fee)}</p></div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,165,0,0.15)' }}><p className="text-xs" style={{ color: AMBER }}>You receive</p><p className="text-lg font-bold mt-1" style={{ color: AMBER }}>{kwacha(result.business)}</p></div>
        </div>
      ) : (
        <p className="text-sm text-white/50 text-center">Enter a price and between 1 and 30 nights.</p>
      )}
    </div>
  );
};

const STEPS = [
  { icon: ClipboardCheck, title: 'Apply online', text: 'Tell us about your business, pin your location on the map and give us the mobile money number where you want to be paid.' },
  { icon: ShieldCheck, title: 'We verify you', text: 'Our team checks your details. Once approved, we email you a link to set your own password.' },
  { icon: BedDouble, title: 'Add your rooms', text: 'List each room with photos, a price per night and how many guests it sleeps. Change prices or switch rooms off any time.' },
  { icon: Wallet, title: 'Get booked and paid', text: 'Guests book and pay in the Yanga app. You are alerted straight away and the money is sent to your mobile money.' },
];

const FEATURES = [
  { icon: Bell, title: 'Instant booking alerts', text: 'See which room has been paid for, the dates and the guest’s name and number, so you can prepare.' },
  { icon: Wallet, title: 'Paid straight away', text: `You receive ${100 - COMMISSION_PERCENT}% of every booking on Airtel, MTN or Zamtel money as soon as the payment clears.` },
  { icon: CalendarDays, title: 'Calendar control', text: 'See your bookings at a glance and block dates for maintenance, walk-in guests or private bookings.' },
  { icon: KeyRound, title: 'Your prices, your rooms', text: 'Set and change prices, add or remove rooms and switch a room off whenever you need to.' },
  { icon: FileText, title: 'Printable invoices', text: 'Every booking gets an invoice for you and one for the guest, ready to print or save as PDF.' },
  { icon: MapPin, title: 'Found on the map', text: 'Guests see your location and get directions to your door from the app.' },
];

const REQUIREMENTS = [
  'A hotel, lodge, guest house, furnished apartment or short-stay home you have the right to rent out',
  'The business name, address and an exact map location',
  'A phone number guests can call and an email address for your login',
  'An Airtel, MTN or Zamtel mobile money number to be paid on',
  'Photos of your rooms (you can add these after you are approved)',
];

const FAQ = [
  ['How much does it cost?', `There is a ${COMMISSION_PERCENT}% service fee on each booking. Yanga keeps that and the other ${100 - COMMISSION_PERCENT}% goes to you.`],
  ['When do I get paid?', 'As soon as the guest’s payment is confirmed, the money is sent to the mobile money number you registered. There is no waiting for the end of the month.'],
  ['What if a guest wants to cancel or I cannot honour a booking?', 'Because you receive the payment, refunds are your responsibility and are paid by you directly to the guest. Guests are told this clearly before they pay. If you cancel in your dashboard, the room is released for other guests.'],
  ['Can two guests book the same room?', 'No. As soon as a guest starts paying for a room on certain dates, those dates are held for them and nobody else can book them.'],
  ['How do I get my password?', 'After we approve your application we email you a link to set your own password, and you can then sign in. The link works for 3 days. If it expires or you forget your password later, use Forgot your password on the sign-in page and we will email you a new link.'],
  ['Can I change my payout number?', 'For your security, only Yanga can change it. Contact us and we will help you.'],
  ['Which towns can I list in?', 'Anywhere in Zambia.'],
];

const YangaHomes = () => {
  useYangaFavicon();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen text-white" style={page}>
      <Helmet>
        <title>Yanga Homes — List your hotel, lodge or guest house | JR Innovations</title>
        <meta name="description" content="Yanga Homes lets hotels, lodges, guest houses, apartments and short-stay homes in Zambia take bookings and get paid by mobile money through the Yanga app." />
        <meta property="og:title" content="Yanga Homes — take bookings and get paid on mobile money" />
        <meta property="og:description" content="List your hotel, lodge, guest house or apartment on Yanga. Guests book and pay in the app; you manage everything from your dashboard." />
        <link rel="canonical" href="https://www.jrinnovationszambia.com/yangahomes" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10" style={{ background: 'rgba(5,12,44,0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <img src="/yangalogo.png" alt="Yanga" className="w-10 h-10 rounded-lg" />
            <span className="font-bold text-lg tracking-wide">Yanga <span style={{ color: AMBER }}>Homes</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#earnings" className="hover:text-white">Pricing</a>
            <a href="#features" className="hover:text-white">Dashboard</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link to="/host/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/25 text-white hover:bg-white/10"><LogIn size={16} /> Sign in</Link>
            <Link to="/register" className="px-4 py-2 rounded-lg font-semibold text-[#050c2c]" style={{ background: AMBER }}>Register</Link>
          </nav>
          <button className="md:hidden p-2" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-3 text-white/80" onClick={() => setMenuOpen(false)}>
            <a href="#how">How it works</a><a href="#earnings">Pricing</a><a href="#features">Dashboard</a><a href="#faq">FAQ</a>
            <Link to="/host/login" className="inline-flex items-center gap-2"><LogIn size={16} /> Sign in</Link>
            <Link to="/register" className="text-center px-4 py-2.5 rounded-lg font-semibold text-[#050c2c]" style={{ background: AMBER }}>Register</Link>
          </div>
        )}
      </header>

      <main id="top">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 sm:pt-24 text-center">
          <img src="/yangalogo.png" alt="" className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-lg" />
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ color: AMBER }}>Hotels · Lodges · Guest houses · Apartments · Airbnbs</p>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
            Fill your rooms.<br /><span style={{ color: AMBER }}>Get paid on mobile money.</span>
          </h1>
          <p className="text-lg text-white/65 mt-6 max-w-2xl mx-auto">
            Yanga Homes puts your accommodation in front of guests across Zambia. They choose their dates,
            see the price and pay in the Yanga app, and you manage every booking from your own dashboard.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Cta to="/register">Register</Cta>
            <Cta to="/host/login" variant="ghost"><LogIn size={18} /> Registered? Sign in</Cta>
          </div>
        </section>

        {/* What it is */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`${panel} p-7`}>
              <Store style={{ color: AMBER }} className="mb-3" />
              <h3 className="text-xl font-bold mb-2">For businesses</h3>
              <p className="text-white/65">
                Add your rooms, set your own prices and decide when each room is available. Guests book and pay in advance,
                so you know who is coming and the money is already with you.
              </p>
            </div>
            <div className={`${panel} p-7`}>
              <Smartphone style={{ color: AMBER }} className="mb-3" />
              <h3 className="text-xl font-bold mb-2">For guests</h3>
              <p className="text-white/65">
                Open Yanga, pick a place, choose how many days to stay and see the total price straight away.
                Rooms that are taken show when they are next free. Pay with mobile money and get an invoice.
              </p>
              <Link to="/app-store" className="inline-block mt-4 text-sm font-semibold hover:underline" style={{ color: AMBER }}>Get the Yanga app →</Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-6xl mx-auto px-4 pb-20 scroll-mt-20">
          <SectionTitle kicker="Getting started" title="How to list your property">Four steps from application to your first booking.</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className={`${panel} p-6 relative`}>
                <span className="absolute top-4 right-5 text-4xl font-black text-white/[0.07]">{i + 1}</span>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,165,0,0.15)' }}>
                  <Icon size={22} style={{ color: AMBER }} />
                </div>
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className={`${panel} p-6`}>
              <h3 className="font-bold mb-3">What you will need</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {REQUIREMENTS.map((r) => <li key={r} className="flex gap-2"><span style={{ color: AMBER }}>✓</span>{r}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-400/30 p-6" style={{ background: 'rgba(255,165,0,0.07)' }}>
              <h3 className="font-bold mb-3" style={{ color: AMBER }}>Good to know</h3>
              <ul className="space-y-2 text-sm text-white/75">
                <li>Your listing only goes live once Yanga has approved it.</li>
                <li>You are paid straight away, so <strong>any refund for a cancelled booking is paid by you</strong> directly to the guest. Guests are told this before they pay.</li>
                <li>You must honour every paid booking at the price the guest saw.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Earnings */}
        <section id="earnings" className="max-w-6xl mx-auto px-4 pb-20 scroll-mt-20">
          <SectionTitle kicker="Simple pricing" title={`${COMMISSION_PERCENT}% per booking, nothing hidden`}>
            Yanga keeps {COMMISSION_PERCENT}% of each booking. The other {100 - COMMISSION_PERCENT}% is yours.
          </SectionTitle>
          <EarningsCalculator />
        </section>

        {/* Dashboard */}
        <section id="features" className="max-w-6xl mx-auto px-4 pb-20 scroll-mt-20">
          <SectionTitle kicker="Your dashboard" title="Everything in one place">Sign in from any phone or computer to run your bookings.</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className={`${panel} p-6`}>
                <Icon size={22} style={{ color: AMBER }} className="mb-3" />
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sign in / apply */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`${panel} p-8`}>
              <LogIn size={26} style={{ color: AMBER }} className="mb-3" />
              <h3 className="text-2xl font-bold mb-2">Already registered?</h3>
              <p className="text-white/65 mb-5">Sign in with your email and password to see new bookings, manage rooms and prices, and print invoices.</p>
              <Cta to="/host/login"><LogIn size={18} /> Sign in to your dashboard</Cta>
            </div>
            <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(135deg, rgba(255,165,0,0.22), rgba(255,165,0,0.06))', border: '1px solid rgba(255,165,0,0.35)' }}>
              <BedDouble size={26} style={{ color: AMBER }} className="mb-3" />
              <h3 className="text-2xl font-bold mb-2">New to Yanga Homes?</h3>
              <p className="text-white/75 mb-5">Register in a few minutes. We will review your details and email you a link to set your password once you are approved.</p>
              <Cta to="/register">Register</Cta>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-3xl mx-auto px-4 pb-24 scroll-mt-20">
          <SectionTitle kicker="Questions" title="Frequently asked" />
          <div className="space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className={`${panel} group`}>
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold flex items-center justify-between gap-4">
                  {q}<span className="text-xl transition group-open:rotate-45" style={{ color: AMBER }}>+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-sm text-white/65">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/45">
        <p>Yanga Homes is a service of <Link to="/" className="hover:text-white underline">JR Innovations</Link> · Lusaka, Zambia</p>
        <p className="mt-2 space-x-4">
          <Link to="/app-store" className="hover:text-white">Get the Yanga app</Link>
          <Link to="/host/login" className="hover:text-white">Business sign in</Link>
        </p>
      </footer>
    </div>
  );
};

export default YangaHomes;
