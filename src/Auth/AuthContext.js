import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../Config/firebaseConfig.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isManager, setIsManager]     = useState(false);
  const [userRole, setUserRole]       = useState(null);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setRoleLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const data = userDoc.data();
          const role = data?.role ?? 'customer';
          setUserRole(role);
          setIsManager(role === 'manager');
          setNeedsPasswordReset(data?.resetPassword === true);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setUserRole('customer');
          setIsManager(false);
          setNeedsPasswordReset(false);
        } finally {
          setRoleLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsManager(false);
        setNeedsPasswordReset(false);
        setRoleLoading(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  // Lets the reset-password page tell context "I'm done" immediately,
  // instead of waiting for onAuthStateChanged to fire again (which it
  // won't, until the next reload or login).
  const clearPasswordResetFlag = () => setNeedsPasswordReset(false);

  const value = {
    currentUser,
    userRole,
    isManager,
    needsPasswordReset,
    clearPasswordResetFlag,
    login,
    logout,
    loading,
    roleLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
