import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Building2, LogIn, ShieldCheck, Wallet } from 'lucide-react';
import { BUSINESS_TYPES, COMMISSION_PERCENT, STAY_ROLES, callStay, friendlyError } from './stayConfig';
import LocationPicker from './LocationPicker';
import StayTerms from './StayTerms';
import useYangaFavicon from './useYangaFavicon';

// Yanga theme, matching the Yanga Homes page and the business sign-in.
const AMBER = '#FFA500';
const page = { background: 'linear-gradient(180deg, #050c2c 0%, #050b26 55%, #01030d 100%)' };
const panel = 'rounded-2xl border border-white/10 bg-white/[0.04]';
const input = 'w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400';
const label = 'block text-sm font-semibold text-white/80 mb-1';

const Field = ({ title, hint, children }) => (
  <div>
    <label className={label}>{title}</label>
    {children}
    {hint && <p className="text-xs text-white/45 mt-1">{hint}</p>}
  </div>
);

const Header = () => (
  <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10" style={{ background: 'rgba(5,12,44,0.85)' }}>
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/yangahomes" className="flex items-center gap-3">
        <img src="/yangalogo.png" alt="Yanga" className="w-10 h-10 rounded-lg" />
        <span className="font-bold text-lg tracking-wide text-white">Yanga <span style={{ color: AMBER }}>Homes</span></span>
      </Link>
      <Link to="/host/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/25 text-sm text-white hover:bg-white/10">
        <LogIn size={16} /> Sign in
      </Link>
    </div>
  </header>
);

const EMPTY = {
  businessName: '', type: 'lodge', stayRole: '', ownerName: '', email: '', phone: '',
  payoutPhone: '', payoutPhoneConfirm: '', town: '', area: '', address: '', description: '',
};

const ZM_PHONE = /^(?:\+?260|0)?(9[5-7]|7[5-7])\d{7}$/;

const StayRegister = () => {
  useYangaFavicon();
  const [form, setForm] = useState(EMPTY);
  const [location, setLocation] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Early warnings, so a taken email or business name is fixed BEFORE submitting.
  const [emailState, setEmailState] = useState('idle');   // idle | checking | available | registered | pending
  const [nameState, setNameState] = useState('idle');     // idle | checking | available | taken
  const lastChecked = useRef({ email: '', name: '' });

  const checkEmail = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || lastChecked.current.email === email) return;
    lastChecked.current.email = email;
    setEmailState('checking');
    try {
      const res = await callStay('checkStayRegistration')({ email });
      setEmailState(res.data.email || 'idle');
    } catch { setEmailState('idle'); }   // the server checks again on submit
  };
  const checkName = async () => {
    const name = form.businessName.trim();
    if (name.length < 2 || lastChecked.current.name === name.toLowerCase()) return;
    lastChecked.current.name = name.toLowerCase();
    setNameState('checking');
    try {
      const res = await callStay('checkStayRegistration')({ businessName: name });
      setNameState(res.data.name || 'idle');
    } catch { setNameState('idle'); }
  };

  const set = (k) => (e) => {
    if (k === 'email') { lastChecked.current.email = ''; setEmailState('idle'); }
    if (k === 'businessName') { lastChecked.current.name = ''; setNameState('idle'); }
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };
  const compact = (v) => v.replace(/[\s-]/g, '');

  const validate = () => {
    if (form.businessName.trim().length < 2) return 'Enter the business name.';
    if (nameState === 'taken') return 'A business with this name is already registered on Yanga Homes.';
    if (!form.stayRole) return 'Please say whether you are the owner or a manager of this business.';
    if (form.ownerName.trim().length < 2) return 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return 'Enter a valid email address — we will email your login details to it.';
    if (emailState === 'registered') return 'This email is already registered with Yanga. Please use a different email address.';
    if (emailState === 'pending') return 'An application for this email is already being reviewed.';
    if (!/^\+?\d{9,13}$/.test(compact(form.phone))) return 'Enter the business phone number.';
    if (!ZM_PHONE.test(compact(form.payoutPhone))) return 'The mobile money number must be an Airtel, MTN or Zamtel number, e.g. 0971234567.';
    if (compact(form.payoutPhone) !== compact(form.payoutPhoneConfirm)) return 'The two mobile money numbers do not match.';
    if (form.town.trim().length < 2) return 'Enter the town.';
    if (form.area.trim().length < 2) return 'Enter the area or neighbourhood, e.g. Chelstone.';
    if (form.address.trim().length < 5) return 'Enter the street address or a clear description of where you are.';
    if (form.description.trim().length < 10) return 'Describe your business in at least a sentence.';
    if (!location) return 'Pin your location so guests can find you.';
    if (!accepted) return 'You must accept the terms and conditions to register.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError('');
    setSubmitting(true);
    try {
      await callStay('submitStayApplication')({
        businessName: form.businessName,
        type: form.type,
        ownerName: form.ownerName,
        stayRole: form.stayRole,
        email: form.email,
        phone: compact(form.phone),
        payoutPhone: compact(form.payoutPhone),
        town: form.town,
        area: form.area,
        address: form.address,
        description: form.description,
        latitude: location.latitude,
        longitude: location.longitude,
        termsAccepted: true,
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const head = (
    <Helmet>
      <title>Register your business — Yanga Homes</title>
      <meta name="description" content="Register your hotel, lodge, guest house or apartment on Yanga Homes and start taking bookings paid by mobile money." />
      <link rel="canonical" href="https://www.jrinnovationszambia.com/register" />
    </Helmet>
  );

  if (done) {
    return (
      <div className="min-h-screen text-white" style={page}>
        {head}
        <Header />
        <div className="px-4 py-16">
          <div className={`${panel} max-w-xl mx-auto p-8 text-center`}>
            <CheckCircle2 className="mx-auto" size={56} style={{ color: '#22C55E' }} />
            <h1 className="text-2xl font-bold mt-4">Registration received</h1>
            <p className="text-white/65 mt-3">
              Thank you. Our team will review <strong className="text-white">{form.businessName}</strong> and verify your details.
              Once approved, we will email <strong className="text-white">{form.email.trim()}</strong> a link to set your password.
              Then you can sign in to your dashboard, add your rooms and set your prices.
            </p>
            <p className="text-sm text-white/45 mt-4">
              We may contact you on {compact(form.phone)} if we need anything. Please check your spam folder for our email.
            </p>
            <Link to="/yangahomes" className="inline-block mt-6 text-sm font-medium hover:underline" style={{ color: AMBER }}>← Back to Yanga Homes</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={page}>
      {head}
      <Header />
      <div className="px-4 pt-10 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold">Register your <span style={{ color: AMBER }}>business</span></h1>
            <p className="text-white/65 mt-3">
              Hotels, lodges, guest houses, apartments and short-stay homes. Guests book and pay in the Yanga app,
              and you get the money in your mobile money wallet.
            </p>
            <p className="text-sm text-white/50 mt-3">
              Already registered? <Link to="/host/login" className="font-medium hover:underline" style={{ color: AMBER }}>Sign in</Link>
              {' · '}<Link to="/yangahomes" className="font-medium hover:underline" style={{ color: AMBER }}>How Yanga Homes works</Link>
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-8 text-sm">
            {[
              [Building2, 'Reach guests', 'Appear in the Yanga app across Zambia.'],
              [Wallet, 'Paid instantly', `You keep ${100 - COMMISSION_PERCENT}% of every booking, paid straight to mobile money.`],
              [ShieldCheck, 'Verified', 'Every business is checked before it goes live.'],
            ].map(([Icon, title, text]) => (
              <div key={title} className={`${panel} p-4`}>
                <Icon size={22} style={{ color: AMBER }} className="mb-2" />
                <p className="font-semibold">{title}</p>
                <p className="text-white/55 mt-1">{text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={submit} className={`${panel} p-6 sm:p-8 space-y-5`}>
            <h2 className="text-lg font-bold">About the business</h2>
            <Field title="Business name">
              <input className={input} value={form.businessName} onChange={set('businessName')} onBlur={checkName} maxLength={80} placeholder="e.g. BK Apartments" />
              {nameState === 'taken' && <p className="text-sm text-red-400 mt-1.5">A business with this name is already registered on Yanga Homes. If it is yours, contact us; otherwise use your full, exact trading name.</p>}
              {nameState === 'available' && <p className="text-sm text-green-400 mt-1.5">✓ This name is available.</p>}
            </Field>
            <Field title="Type of accommodation">
              <select className={`${input} [&>option]:text-black`} value={form.type} onChange={set('type')}>
                {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field title="Describe your business" hint="Guests see this. Mention what makes your place good: rooms, location, facilities.">
              <textarea className={input} rows={4} maxLength={1000} value={form.description} onChange={set('description')} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field title="Town / city">
                <input className={input} value={form.town} onChange={set('town')} maxLength={60} placeholder="e.g. Lusaka" />
              </Field>
              <Field title="Area / neighbourhood" hint="Guests can filter places by area.">
                <input className={input} value={form.area} onChange={set('area')} maxLength={60} placeholder="e.g. Chelstone" />
              </Field>
            </div>
            <Field title="Street address">
                <input className={input} value={form.address} onChange={set('address')} maxLength={200} placeholder="Plot, road, landmark" />
            </Field>
            <Field title="Pin your location" hint="Guests use this to get directions to you in the app.">
              <LocationPicker value={location} onChange={setLocation} dark searchHint={[form.area, form.town].map((x) => x.trim()).filter(Boolean).join(', ')} />
            </Field>

            <h2 className="text-lg font-bold pt-2">About you</h2>
            <Field title="Your role in this business" hint="Your login is tied to this role. If the owner or manager changes later, contact Yanga and we will hand the account over safely.">
              <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Your role">
                {STAY_ROLES.map((r) => (
                  <button
                    key={r.value} type="button" role="radio" aria-checked={form.stayRole === r.value}
                    onClick={() => setForm((f) => ({ ...f, stayRole: r.value }))}
                    className={`text-left rounded-xl border px-4 py-3 transition ${form.stayRole === r.value ? 'border-amber-400 bg-amber-400/10' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}
                  >
                    <span className="font-semibold text-white">{r.label}</span>
                    <span className="block text-sm text-white/55">{r.hint}</span>
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field title="Your full name">
                <input className={input} value={form.ownerName} onChange={set('ownerName')} maxLength={80} />
              </Field>
              <Field title="Business phone" hint="Guests may call this number.">
                <input className={input} inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="0971234567" />
              </Field>
            </div>
            <Field title="Email address" hint="This will be your login. After approval we email you a link to set your password.">
              <input className={input} type="email" autoComplete="email" value={form.email} onChange={set('email')} onBlur={checkEmail} />
              {emailState === 'registered' && <p className="text-sm text-red-400 mt-1.5">This email is already registered with Yanga. Please use a different email address.</p>}
              {emailState === 'pending' && <p className="text-sm text-red-400 mt-1.5">An application for this email is already being reviewed.</p>}
              {emailState === 'available' && <p className="text-sm text-green-400 mt-1.5">✓ This email can be used.</p>}
            </Field>

            <h2 className="text-lg font-bold pt-2">Where we pay you</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field title="Mobile money number" hint="Airtel, MTN or Zamtel. Guest payments (less our fee) are sent here.">
                <input className={input} inputMode="tel" value={form.payoutPhone} onChange={set('payoutPhone')} placeholder="0971234567" />
              </Field>
              <Field title="Confirm mobile money number">
                <input className={input} inputMode="tel" value={form.payoutPhoneConfirm} onChange={set('payoutPhoneConfirm')} />
              </Field>
            </div>
            <div className="rounded-lg border border-amber-400/30 p-3 text-sm text-amber-100" style={{ background: 'rgba(255,165,0,0.08)' }}>
              Double-check this number. Payments are sent here automatically and cannot be recalled by Yanga.
            </div>

            <div className="rounded-xl border border-white/10 p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-sm text-white/75">
                <strong className="text-white">Please note:</strong> Yanga keeps a {COMMISSION_PERCENT}% service fee on each booking.
                Because you receive the guest's payment, <strong className="text-white">any refund or cancellation is your responsibility</strong> and
                must be paid back to the guest by you.
              </p>
              <button type="button" onClick={() => setShowTerms((s) => !s)} className="text-sm font-medium hover:underline" style={{ color: AMBER }}>
                {showTerms ? 'Hide' : 'Read'} the full terms and conditions
              </button>
              {showTerms && (
                <div className="max-h-72 overflow-y-auto border border-white/10 rounded-lg p-4 bg-black/20">
                  <StayTerms dark />
                </div>
              )}
              <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-amber-500" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>I have read and accept the terms and conditions, including that refunds and cancellations are my responsibility.</span>
              </label>
            </div>

            {error && <p className="text-sm text-red-400 font-medium" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-[#050c2c] hover:brightness-110 disabled:opacity-60"
              style={{ background: AMBER }}
            >
              {submitting ? 'Submitting…' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StayRegister;
