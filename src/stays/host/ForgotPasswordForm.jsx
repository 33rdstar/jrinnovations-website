import React, { useState } from 'react';
import { callStay, friendlyError } from '../stayConfig';

const AMBER = '#FFA500';
const inputCls = 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400';

// Asks for a fresh set-password link. The server answers the same way whether or not
// the email belongs to a business, so this never reveals who has an account.
const ForgotPasswordForm = ({ onBack, intro }) => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await callStay('requestHostPasswordReset')({ email: email.trim(), siteOrigin: window.location.origin });
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-white font-semibold text-lg">Check your email</p>
        <p className="text-white/65 text-sm mt-3">
          If <strong className="text-white">{email.trim()}</strong> is registered with Yanga Homes, we have sent a link to
          choose a new password. It works for 24 hours. If you cannot see it, check your spam folder.
        </p>
        {onBack && (
          <button type="button" onClick={onBack} className="mt-6 text-sm font-medium hover:underline" style={{ color: AMBER }}>
            ← Back to sign in
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {intro && <p className="text-white/65 text-sm">{intro}</p>}
      <div>
        <label className="block text-white/80 text-sm font-semibold mb-2">Email</label>
        <input
          type="email" required autoComplete="email" autoCapitalize="none"
          value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls}
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit" disabled={busy}
        className="w-full font-bold py-3 rounded-xl text-[#050c2c] hover:brightness-110 disabled:opacity-60"
        style={{ background: AMBER }}
      >
        {busy ? 'Sending…' : 'Email me a link'}
      </button>
      {error && <p className="text-sm text-red-400 font-medium text-center" role="alert">{error}</p>}
      {onBack && (
        <p className="text-center">
          <button type="button" onClick={onBack} className="text-sm text-white/55 hover:text-white">← Back to sign in</button>
        </p>
      )}
    </form>
  );
};

export default ForgotPasswordForm;
