import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../Auth/AuthContext';

// Only accommodation-business accounts get in. This is deliberately separate
// from the staff ProtectedRoute: a stay_host must never reach the admin portal,
// and staff have no business in a host's dashboard.
const HostRoute = ({ children }) => {
  const { currentUser, userRole, needsPasswordReset, loading, roleLoading } = useAuth();

  if (loading || roleLoading) return <div className="p-8">Loading…</div>;
  if (!currentUser) return <Navigate to="/host/login" replace />;
  // Someone else (for example a staff member in another tab) signed in on this browser.
  if (userRole !== 'stay_host') return <Navigate to="/host/login" replace state={{ otherAccount: true }} />;
  if (needsPasswordReset) return <Navigate to="/host/reset-password" replace />;

  return children;
};

export default HostRoute;
