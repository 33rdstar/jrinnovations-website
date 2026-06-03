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
	const [userRole, setUserRole] = useState(true);
	const [loading, setLoading] = useState(true);
	const [roleLoading, setRoleLoading] = useState(true); 

  useEffect(() => {
	const unsubscribe = onAuthStateChanged(auth, async (user) => {

	  
	  if (user) {
		setCurrentUser(user);
		try {
			const userDoc = await getDoc(doc(db, 'users', user.uid));

			const role = userDoc.data()?.role ?? 'customer';
			setUserRole(role);
			setIsManager(role === 'manager');
			console.log(userDoc.data())
		} catch (error) {
		
		  setIsManager(false);
		}
	  } else {

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
