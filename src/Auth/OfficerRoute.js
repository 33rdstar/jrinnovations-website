import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from '../Config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

// Roles considered "officers" for this guard. This lives separately from
// the OFFICER_ROLES array in BackOfficeManager.jsx (different folder) —
// if you add or rename a role in one, check the other too.
const OFFICER_ROLES = ['registration_officer', 'customer_care', 'auditor'];

/**
 * OfficerRoute
 * Wraps pages that only officers (and managers) can access.
 *
 * On first visit it flips hasLoggedIn → true so the admin dashboard
 * can show "Completed" instead of "Pending" for that officer.
 */
const OfficerRoute = ({ children }) => {
  const { currentUser, loading, userRole } = useAuth();
  const isOfficer = OFFICER_ROLES.includes(userRole);
  const isAllowed = isOfficer || userRole === 'manager';

  useEffect(() => {
    if (!currentUser || !isOfficer) return;

    // Mark first login (fire-and-forget, no need to await)
    const userRef = doc(db, 'users', currentUser.uid);
    updateDoc(userRef, { hasLoggedIn: true }).catch(console.error);
  }, [currentUser, isOfficer]);

  if (loading) return <div>Loading…</div>;
  if (!currentUser) return <Navigate to="/portal-mgmt-xyz99/login" replace />;

  // Officers and managers can access; everyone else is redirected
  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OfficerRoute;
