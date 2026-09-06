import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [officialProfile, setOfficialProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'officials', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setOfficialProfile(docSnap.data());
          } else {
            // Legacy account — auto-create an officials doc so Firestore rules pass
            const fallbackProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Official',
              email: firebaseUser.email || '',
              department: 'general',
              ward: 'All Wards / HQ',
              designation: 'Municipal Official',
              employeeId: 'DEMO-OFFICIAL',
              role: 'official',
            };
            try {
              await setDoc(doc(db, 'officials', firebaseUser.uid), fallbackProfile);
            } catch (writeErr) {
              console.warn('Could not auto-create officials doc:', writeErr);
            }
            setOfficialProfile(fallbackProfile);
          }
        } catch (e) {
          console.warn('Could not fetch official profile:', e);
          setOfficialProfile({
            name: firebaseUser.displayName || 'Official',
            department: 'general',
            ward: 'All Wards',
            designation: 'Official',
          });
        }
      } else {
        setOfficialProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email, password) {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : err.code === 'auth/user-not-found'
          ? 'Account not found. Check your credentials.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please wait a moment.'
          : 'Login failed. Please try again.'
      );
      setLoading(false);
    }
  }

  async function signUp(profileData) {
    const { email, password, name, department, ward, designation, employeeId } = profileData;
    setError(null);
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (res.user) {
        // Update auth displayName
        await updateProfile(res.user, { displayName: name });

        // Save official profile to Firestore
        const officialData = {
          uid: res.user.uid,
          name,
          email,
          employeeId: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          department: department || 'general',
          ward: ward || 'All Wards / HQ',
          designation: designation || 'Field Inspector',
          createdAt: serverTimestamp(),
          role: 'official',
        };

        try {
          await setDoc(doc(db, 'officials', res.user.uid), officialData);
          setOfficialProfile(officialData);
        } catch (fsErr) {
          console.warn('Could not write official profile doc:', fsErr);
          setOfficialProfile(officialData);
        }
      }
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.code === 'auth/weak-password'
          ? 'Password should be at least 6 characters.'
          : err.code === 'auth/invalid-email'
          ? 'Invalid email address format.'
          : 'Failed to create account. Please try again.'
      );
      setLoading(false);
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return { user, officialProfile, loading, error, signIn, signUp, signOut };
}
