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
  const [userRole, setUserRole]       = useState(null); // was `true` — start unresolved, not a boolean
  const [loading, setLoading]         = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setRoleLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const role = userDoc.data()?.role ?? 'customer';
          setUserRole(role);
          setIsManager(role === 'manager');
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setUserRole('customer');
          setIsManager(false);
        } finally {
          setRoleLoading(false); // was never called before — this was stuck at `true` forever
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsManager(false);
        setRoleLoading(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  // userRole is now actually exposed — this was the missing piece
  const value = { currentUser, userRole, isManager, login, logout, loading, roleLoading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
