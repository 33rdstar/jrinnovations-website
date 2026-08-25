import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Roles allowed into the admin area at all. Inside this boundary,
// AdminSidebar and UserManagerComponent further restrict which specific
// pages/tabs each role can see — this guard only decides "is this person
// staff at all," not which staff pages they get.
const STAFF_ROLES = ['admin', 'manager', 'registration_officer', 'customer_care', 'auditor'];

const ProtectedRoute = ({ children }) => {
  const { currentUser, userRole, needsPasswordReset, loading } = useAuth();

  if (loading) return <div>Loading Data...</div>;
  if (!currentUser) return <Navigate to="/portal-mgmt-xyz99/login" replace />;
  if (needsPasswordReset) return <Navigate to="/portal-mgmt-xyz99/reset-password" replace />;
  if (!STAFF_ROLES.includes(userRole)) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
