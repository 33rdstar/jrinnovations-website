import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { callStay, friendlyError } from '../stayConfig';
import ForgotPasswordForm from './ForgotPasswordForm';
import useYangaFavicon from '../useYangaFavicon';

const AMBER = '#FFA500';
const MIN_LENGTH = 8;
const inputCls = 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400';

const Shell = ({ title, subtitle, children }) => (
  <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #050c2c 0%, #01030d 100%)' }}>
    <Helmet><title>Set your password — Yanga Homes</title></Helmet>
    <div className="max-w-md w-full">
      <div className="text-center mb-6">
        <Link to="/yangahomes"><img src="/yangalogo.png" alt="Yanga" className="w-20 h-20 rounded-2xl mx-auto shadow-lg" /></Link>
        <h1 className="text-2xl font-bold text-white mt-4">Yanga <span style={{ color: AMBER }}>Homes</span></h1>
        {subtitle && <p className="text-sm text-white/55">{subtitle}</p>}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur">
        {title && <h2 className="text-xl font-bold text-white text-center mb-5">{title}</h2>}
        {children}
      </div>
    </div>
  </div>
);

// The page a business lands on from the emailed link: choose a password on a Yanga page.
const HostSetPassword = () => {
  useYangaFavicon();
  const [params] = useSearchParams();
  const code = params.get('code') || '';

  const [phase, setPhase] = useState('checking');   // checking | ready | invalid | expired | done
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    if (!code) { setPhase('invalid'); return undefined; }
    callStay('checkHostSetupCode')({ code })
      .then((res) => {
        if (!alive) return;
        if (res.data.valid) { setInfo(res.data); setPhase('ready'); }
        else setPhase(res.data.reason === 'expired' ? 'expired' : 'invalid');
      })
      .catch(() => { if (alive) { setError('We could not check your link. Please check your connection and reload.'); setPhase('invalid'); } });
    return () => { alive = false; };
  }, [code]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) { setError(`Your password must be at least ${MIN_LENGTH} characters.`); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      await callStay('completeHostPasswordSetup')({ code, newPassword: password });
      setPhase('done');
    } catch (err) {
      const msg = friendlyError(err);
      // The link was used up or lapsed while the page was open — offer a new one.
      if (/expired/i.test(msg)) { setPhase('expired'); setError(''); }
      else if (/not valid|already been used/i.test(msg)) { setPhase('invalid'); setError(''); }
      else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'checking') {
    return <Shell><p className="text-center text-white/70">Checking your link…</p></Shell>;
  }

  if (phase === 'done') {
    return (
      <Shell title="Password set">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3" size={48} style={{ color: '#22C55E' }} />
          <p className="text-white/70 text-sm">Your password has been saved. You can now sign in to your dashboard.</p>
          <Link to="/host/login" className="mt-6 inline-block w-full font-bold py-3 rounded-xl text-[#050c2c] hover:brightness-110" style={{ background: AMBER }}>
            Sign in
          </Link>
        </div>
      </Shell>
    );
  }

  if (phase === 'invalid' || phase === 'expired') {
    return (
      <Shell title={phase === 'expired' ? 'This link has expired' : 'This link is not valid'} subtitle="Business dashboard">
        <ForgotPasswordForm
          intro={`${phase === 'expired' ? 'Links only work for a limited time.' : 'The link may already have been used, or it was copied incorrectly.'} Enter your email and we will send you a new one.`}
        />
        <p className="text-center mt-5"><Link to="/host/login" className="text-sm text-white/55 hover:text-white">← Back to sign in</Link></p>
      </Shell>
    );
  }

  return (
    <Shell title="Choose your password" subtitle="Business dashboard">
      <p className="text-center text-sm text-white/60 mb-5">
        For the account <strong className="text-white">{info?.email}</strong>
      </p>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-white/80 text-sm font-semibold mb-2">New password</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={MIN_LENGTH}
              value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls}
              placeholder={`At least ${MIN_LENGTH} characters`}
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-white/80 text-sm font-semibold mb-2">Confirm password</label>
          <input
            type={show ? 'text' : 'password'} autoComplete="new-password" required
            value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls}
          />
        </div>
        <button
          type="submit" disabled={busy}
          className="w-full font-bold py-3 rounded-xl text-[#050c2c] hover:brightness-110 disabled:opacity-60"
          style={{ background: AMBER }}
        >
          {busy ? 'Saving…' : 'Save password'}
        </button>
        {error && <p className="text-sm text-red-400 font-medium text-center" role="alert">{error}</p>}
      </form>
    </Shell>
  );
};

export default HostSetPassword;
