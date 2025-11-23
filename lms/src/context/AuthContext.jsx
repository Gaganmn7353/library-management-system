import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // { name, email, role, uid }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);
      const userDocRef = doc(collection(db, 'users'), firebaseUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        const defaultProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email,
          role: 'member',
        };
        await setDoc(userDocRef, defaultProfile);
        setProfile(defaultProfile);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = async (name, email, password, role = 'member') => {
    const creds = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(creds.user, { displayName: name });
    }
    const userDocRef = doc(collection(db, 'users'), creds.user.uid);
    await setDoc(userDocRef, { uid: creds.user.uid, name, email, role });
    return creds.user;
  };

  const logout = () => signOut(auth);

  const value = useMemo(() => ({ user, profile, loading, login, register, logout }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}


