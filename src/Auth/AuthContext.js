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
	const [isManager, setIsManager] = useState(false);
	const [loading, setLoading] = useState(true);
	const [roleLoading, setRoleLoading] = useState(true); // add this

  useEffect(() => {
	const unsubscribe = onAuthStateChanged(auth, async (user) => {
	  //console.log("[AUTH] onAuthStateChanged fired, user:", user?.email ?? "null");
	  //console.log("[AUTH] Looking up UID:", user.uid);
	  
	  if (user) {
		setCurrentUser(user);
		try {
		  const userDoc = await getDoc(doc(db, 'users', user.uid));
		  //console.log("[AUTH] Firestore doc exists:", userDoc.exists());
		  //console.log("[AUTH] Firestore doc data:", userDoc.data());
		  //console.log("[AUTH] Role found:", userDoc.data()?.role);
		  
		  const managerStatus = userDoc.exists() && userDoc.data().role === 'manager';
		  //console.log("[AUTH] Setting isManager to:", managerStatus);
		  setIsManager(managerStatus);
		} catch (error) {
		  //console.error("[AUTH] Firestore error:", error);
		  setIsManager(false);
		}
	  } else {
		//console.log("[AUTH] No user, clearing state");
		setCurrentUser(null);
		setIsManager(false);
	  }
	  setLoading(false);
	});

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const value = { currentUser, isManager, login, logout, loading, roleLoading };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
