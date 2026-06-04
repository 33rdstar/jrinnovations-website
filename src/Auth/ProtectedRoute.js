import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Adjust path

const ProtectedRoute = ({ children }) => {
  const { currentUser, isManager, loading } = useAuth();

  //console.log("[PROTECTED ROUTE] loading:", loading, "| currentUser:", currentUser?.email ?? "null", "| isManager:", isManager);

  if (loading) return <div>Loading Data...</div>;
  if (!currentUser) return <Navigate to="/portal-mgmt-xyz99/login" replace />;
  if (!isManager) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
