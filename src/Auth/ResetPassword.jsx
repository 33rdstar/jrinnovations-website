import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../Config/firebaseConfig';
import { useAuth } from './AuthContext';

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const navigate = useNavigate();
  const { currentUser, clearPasswordResetFlag } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!currentUser) {
      setError('Your session expired. Please log in again.');
      return;
    }
    
    

    setSubmitting(true);
    try {
      // Updates the Firebase Auth password itself
      await updatePassword(auth.currentUser, newPassword);

      // Flip the flag in Firestore so future logins skip this step
      await updateDoc(doc(db, 'users', currentUser.uid), {
		  resetPassword: false,
		  hasLoggedIn: true,
		});

      // Tell AuthContext immediately, so any guard relying on
      // needsPasswordReset doesn't bounce us right back here
      clearPasswordResetFlag();

      navigate('/portal-mgmt-xyz99/users');
    } catch (err) {
      console.error(err);
      // Firebase throws 'auth/requires-recent-login' if the sign-in is
      // considered too old for a sensitive op like updatePassword. Since
      // this page is only ever reached straight after a fresh login, that
      // should be rare here, but it's worth surfacing clearly if it happens.
      if (err.code === 'auth/requires-recent-login') {
        setError('Your session is too old for this action. Please log out and log back in, then try again.');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-purple-600">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <KeyRound className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Set a New Password</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          This account was created with a temporary password. Choose a new one to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:transform-none"
          >
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
        {error && <p className="text-sm text-red-500 font-medium text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
