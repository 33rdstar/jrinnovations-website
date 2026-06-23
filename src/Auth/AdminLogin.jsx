import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from './AuthContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Resolve the typed username to the email Firebase Auth needs. Staff sign in
  // with their username; the role is then whatever their account record says it
  // is (resolved by AuthContext + enforced by the route guards). An email can
  // also be entered directly so officer accounts created before usernames
  // existed still work.
  const resolveEmail = async (identifier) => {
    if (identifier.includes('@')) return identifier;
    const snap = await getDocs(
      query(collection(db, 'users'), where('username', '==', identifier))
    );
    if (snap.empty) return null;
    return snap.docs[0].data().email || null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const identifier = username.trim();
      if (!identifier) {
        setError('Please enter your username.');
        setLoading(false);
        return;
      }

      const email = await resolveEmail(identifier);
      if (!email) {
        setError('No account found with that username.');
        setLoading(false);
        return;
      }

      const credential = await login(email, password);
      const uid = credential.user.uid;

      // Check this user's Firestore doc directly off the uid we just got back,
      // rather than waiting on AuthContext's role fetch — that fetch runs off
      // a separate onAuthStateChanged listener and isn't guaranteed to have
      // resolved yet by the time this function continues.
      const userDoc = await getDoc(doc(db, 'users', uid));
      const needsPasswordReset = userDoc.data()?.resetPassword === true;

      if (needsPasswordReset) {
        navigate('/portal-mgmt-xyz99/reset-password');
      } else {
        navigate('/portal-mgmt-xyz99/users');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-purple-600 transform transition-all">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <Lock className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">System Access</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:transform-none"
          >
            {loading ? 'Authenticating…' : 'Authenticate'}
          </button>
        </form>
        {error && <p className="text-sm text-red-500 font-medium text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default AdminLogin;
