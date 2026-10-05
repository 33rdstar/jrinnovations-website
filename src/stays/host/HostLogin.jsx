import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../Config/firebaseConfig';
import { useAuth } from '../../Auth/AuthContext';
import ForgotPasswordForm from './ForgotPasswordForm';
import useYangaFavicon from '../useYangaFavicon';

const AMBER = '#FFA500';
const inputCls = 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400';

// Sign-in for Yanga Homes businesses. Separate from the staff portal login:
// hosts sign in with the email they applied with, and only a stay_host account
// is let through.
const HostLogin = () => {
  useYangaFavicon();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await login(email.trim(), password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      const profile = snap.data();
      if (profile?.role !== 'stay_host') {
        await signOut(auth);
        setError('This sign-in is for Yanga Homes businesses. Staff should use the staff portal.');
        return;
      }
      navigate(profile.resetPassword === true ? '/host/reset-password' : '/host/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #050c2c 0%, #01030d 100%)' }}>
      <Helmet><title>Sign in — Yanga Homes</title></Helmet>
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <Link to="/yangahomes"><img src="/yangalogo.png" alt="Yanga" className="w-20 h-20 rounded-2xl mx-auto shadow-lg" /></Link>
          <h1 className="text-2xl font-bold text-white mt-4">Yanga <span style={{ color: AMBER }}>Homes</span></h1>
          <p className="text-sm text-white/55">Business dashboard</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur">
          {forgot ? (
            <>
              <h2 className="text-lg font-bold text-white text-center mb-4">Forgot your password?</h2>
              <ForgotPasswordForm onBack={() => setForgot(false)} intro="Enter the email you registered with and we will send you a link to choose a new password." />
            </>
          ) : (<>
          {location.state?.otherAccount && (
            <p className="mb-4 rounded-lg bg-amber-400/15 border border-amber-400/40 p-3 text-sm text-amber-200">
              Your business session ended because a different account signed in on this browser. A browser can hold only one
              sign-in at a time, so please sign in again here, or use a separate browser or private window for each account.
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">Email</label>
              <input
                type="email" autoComplete="username" autoCapitalize="none" required
                value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls}
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">Password</label>
              <input
                type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full font-bold py-3 rounded-xl text-[#050c2c] hover:brightness-110 disabled:opacity-60"
              style={{ background: AMBER }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {error && <p className="text-sm text-red-400 font-medium text-center mt-4" role="alert">{error}</p>}
          <p className="text-center text-sm mt-5">
            <button type="button" onClick={() => setForgot(true)} className="font-medium hover:underline" style={{ color: AMBER }}>Forgot your password?</button>
          </p>
          </>)}
        </div>

        <p className="text-center text-sm text-white/55 mt-6">
          Not registered yet? <Link to="/register" className="font-medium hover:underline" style={{ color: AMBER }}>Register</Link>
          <br />
          <Link to="/yangahomes" className="text-white/45 hover:text-white">← About Yanga Homes</Link>
        </p>
      </div>
    </div>
  );
};

export default HostLogin;
