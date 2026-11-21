import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { ensureUserProfile } from '../services/firestoreService';

const AuthContext = createContext();
const STORAGE_KEY = 'expense_tracker_auth_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Monitor Firebase Auth state or restore saved session
  useEffect(() => {
    let unsubscribe = null;

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const isRaj = firebaseUser.email?.toLowerCase() === 'raaajshinde@gmail.com';
            const sessionData = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || (isRaj ? 'Raj Shinde' : firebaseUser.email.split('@')[0]),
              picture: firebaseUser.photoURL || '',
              expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000
            };
            setUser(sessionData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
            await ensureUserProfile(firebaseUser.uid, firebaseUser.email, sessionData.name);
          } else {
            // Check if local demo session exists
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const session = JSON.parse(saved);
              if (session.is_demo || (session.expires_at && session.expires_at > Date.now())) {
                setUser(session);
              } else {
                localStorage.removeItem(STORAGE_KEY);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } catch (err) {
          console.error('Error handling auth state change:', err);
        } finally {
          setIsLoading(false);
        }
      });
    } else {
      // Local / Offline fallback mode
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const session = JSON.parse(saved);
          if (session.expires_at && session.expires_at > Date.now()) {
            setUser(session);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (err) {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  /**
   * Universal Sign In with Email & Password
   */
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const err = 'Please enter a valid email address';
      setAuthError(err);
      throw new Error(err);
    }
    if (!password) {
      const err = 'Please enter your password';
      setAuthError(err);
      throw new Error(err);
    }

    if (isFirebaseConfigured && auth) {
      try {
        let userCred;
        try {
          userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch (signInErr) {
          // If account does not exist yet in Firebase (e.g. first time sign-in), auto-create
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            try {
              userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            } catch (createErr) {
              throw signInErr;
            }
          } else {
            throw signInErr;
          }
        }

        const fbUser = userCred.user;
        const isRaj = cleanEmail === 'raaajshinde@gmail.com';
        const sessionData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: cleanEmail,
          name: fbUser.displayName || (isRaj ? 'Raj Shinde' : cleanEmail.split('@')[0]),
          picture: fbUser.photoURL || '',
          expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000
        };
        setUser(sessionData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        await ensureUserProfile(fbUser.uid, cleanEmail, sessionData.name);
        return { success: true, user: sessionData };
      } catch (fbErr) {
        let msg = fbErr.message;
        if (fbErr.code === 'auth/operation-not-allowed' || fbErr.code === 'auth/configuration-not-found') {
          msg = 'Email/Password sign-in is not enabled yet in your Firebase Console. Please enable it under Authentication > Sign-in method.';
        } else if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password') {
          msg = 'Incorrect password or email. Please check your credentials.';
        } else if (fbErr.code === 'auth/user-not-found') {
          msg = 'No account found with this email. Please create an account.';
        } else if (fbErr.code === 'auth/too-many-requests') {
          msg = 'Too many failed login attempts. Please reset your password or try later.';
        }
        setAuthError(msg);
        throw new Error(msg);
      }
    } else {
      // Local fallback session
      return loginWithAccount(cleanEmail, cleanEmail.split('@')[0]);
    }
  };

  /**
   * Universal Sign In with Google Popup (Firebase OAuth)
   */
  const loginWithGoogle = async () => {
    setAuthError(null);
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const cleanEmail = (fbUser.email || '').trim().toLowerCase();
        const isRaj = cleanEmail === 'raaajshinde@gmail.com';
        const sessionData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: cleanEmail,
          name: fbUser.displayName || (isRaj ? 'Raj Shinde' : cleanEmail.split('@')[0]),
          picture: fbUser.photoURL || '',
          expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000
        };
        setUser(sessionData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        await ensureUserProfile(fbUser.uid, cleanEmail, sessionData.name);
        return { success: true, user: sessionData };
      } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') {
          return null; // User simply closed the popup
        }
        let msg = err.message;
        if (err.code === 'auth/account-exists-with-different-credential') {
          msg = 'An account already exists with this email using a different sign-in method. Please use email & password.';
        }
        setAuthError(msg);
        throw new Error(msg);
      }
    } else {
      // Local fallback
      return loginWithAccount('raaajshinde@gmail.com', 'Raj Shinde');
    }
  };

  /**
   * Universal Registration with Email, Password & Display Name
   */
  const registerWithEmail = async (email, password, displayName = '') => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const err = 'Please enter a valid email address';
      setAuthError(err);
      throw new Error(err);
    }
    if (!password || password.length < 8) {
      const err = 'Password must be at least 8 characters long';
      setAuthError(err);
      throw new Error(err);
    }
    if (!(/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password))) {
      const err = 'Password must contain at least one number or special symbol';
      setAuthError(err);
      throw new Error(err);
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCred.user;
        const name = displayName.trim() || cleanEmail.split('@')[0];
        
        try {
          await updateProfile(fbUser, { displayName: name });
        } catch (profileErr) {}

        // Send email verification
        try {
          if (fbUser && typeof sendEmailVerification === 'function') {
            await sendEmailVerification(fbUser);
          }
        } catch (verErr) {
          console.warn('Email verification notification deferred:', verErr.message);
        }

        const sessionData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: cleanEmail,
          name,
          picture: '',
          is_new_user: true,
          expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000
        };
        setUser(sessionData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        await ensureUserProfile(fbUser.uid, cleanEmail, name);
        return { success: true, user: sessionData, is_new: true };
      } catch (fbErr) {
        let msg = fbErr.message;
        if (fbErr.code === 'auth/operation-not-allowed' || fbErr.code === 'auth/configuration-not-found') {
          msg = 'Email/Password sign-in is not enabled yet in your Firebase Console. Please enable it under Authentication > Sign-in method.';
        } else if (fbErr.code === 'auth/email-already-in-use') {
          msg = 'An account with this email already exists. Please sign in instead.';
        } else if (fbErr.code === 'auth/weak-password') {
          msg = 'Password is too weak. Please use at least 6 characters.';
        }
        setAuthError(msg);
        throw new Error(msg);
      }
    } else {
      // Local fallback session
      return loginWithAccount(cleanEmail, displayName || cleanEmail.split('@')[0]);
    }
  };

  /**
   * Send Password Reset Email
   */
  const resetPassword = async (email) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address to receive reset instructions.');
    }

    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    } else {
      return { success: true, message: 'Password reset instructions sent.' };
    }
  };

  /**
   * 1-Click Consumer / Demo Login (Instant Vault Connect)
   */
  const loginWithAccount = async (email, name = '') => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const isRaj = cleanEmail === 'raaajshinde@gmail.com';
    const userName = name || (isRaj ? 'Raj Shinde' : cleanEmail.split('@')[0]);

    let backendUser = null;
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: userName })
      });
      if (res.ok) backendUser = await res.json();
    } catch (e) {}

    const sessionData = {
      id: backendUser?.user?.id || (isRaj ? 1 : Date.now()),
      uid: String(backendUser?.user?.id || (isRaj ? 1 : Date.now())),
      email: cleanEmail,
      name: userName,
      picture: '',
      is_demo: !isFirebaseConfigured,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
      login_time: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    setUser(sessionData);
    return { success: true, user: sessionData };
  };

  /**
   * Log Out / Disconnect Session
   */
  const logout = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
    } catch (e) {}
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        authError,
        isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        loginWithAccount,
        logout,
        authorizedEmail: user?.email || '',
        updateAuthorizedEmail: () => {},
        googleClientId: '',
        updateGoogleClientId: () => {}
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
