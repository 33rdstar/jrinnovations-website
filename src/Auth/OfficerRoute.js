import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from '../Config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * OfficerRoute
 * Wraps pages that only officers (and managers) can access.
 *
 * On first visit it flips hasLoggedIn → true so the admin dashboard
 * can show "Completed" instead of "Pending" for that officer.
 */
const OfficerRoute = ({ children }) => {
  const { currentUser, loading, userRole } = useAuth();

  useEffect(() => {
    if (!currentUser || userRole !== 'officer') return;

    // Mark first login (fire-and-forget, no need to await)
    const userRef = doc(db, 'users', currentUser.uid);
    updateDoc(userRef, { hasLoggedIn: true }).catch(console.error);
  }, [currentUser, userRole]);

  if (loading) return <div>Loading…</div>;
  if (!currentUser) return <Navigate to="/login" replace />;

  // Officers and managers can access; everyone else is redirected
  if (userRole !== 'officer' || userRole !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OfficerRoute;
