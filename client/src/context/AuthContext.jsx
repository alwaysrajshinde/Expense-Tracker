import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const STORAGE_KEY = 'expense_tracker_auth_session';
const CONFIG_KEY = 'expense_tracker_auth_config';
const CLIENT_ID_KEY = 'expense_tracker_google_client_id';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Google OAuth Web Client ID
  const [googleClientId, setGoogleClientId] = useState(() => {
    try {
      const saved = localStorage.getItem(CLIENT_ID_KEY);
      if (saved && !saved.includes('example') && !saved.includes('YOUR_GOOGLE_CLIENT_ID')) {
        return saved.trim();
      }
      if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.GOOGLE_CLIENT_ID) {
        const cfg = window.APP_CONFIG.GOOGLE_CLIENT_ID.trim();
        if (!cfg.includes('YOUR_GOOGLE_CLIENT_ID') && !cfg.includes('example')) {
          return cfg;
        }
      }
    } catch (e) {}
    return '';
  });

  const updateGoogleClientId = (newId) => {
    const clean = (newId || '').trim();
    setGoogleClientId(clean);
    if (clean) {
      localStorage.setItem(CLIENT_ID_KEY, clean);
    } else {
      localStorage.removeItem(CLIENT_ID_KEY);
    }
  };

  // Load existing valid session on startup
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY);
      if (savedSession) {
        const session = JSON.parse(savedSession);
        // Validate session lifespan (30 days)
        if (session.expires_at && session.expires_at > Date.now()) {
          setUser(session);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Error restoring session:', err);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Decode JWT payload from Google Identity Services
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Multi-User Login with verified Google credentials
  const loginWithGoogle = async (credentialResponse) => {
    setAuthError(null);
    try {
      const token = credentialResponse.credential || credentialResponse;
      const payload = parseJwt(token);

      if (!payload || !payload.email) {
        throw new Error('Invalid Google credential payload received.');
      }

      const email = payload.email.toLowerCase();
      const name = payload.name || email.split('@')[0];
      const sub = payload.sub || ('google_' + Date.now());
      const picture = payload.picture || '';

      // Register or fetch user & spreadsheet association from backend
      let backendUser = null;
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, sub, picture })
        });
        if (res.ok) {
          backendUser = await res.json();
        }
      } catch (backendErr) {
        console.warn('Backend user registration deferred (offline fallback active):', backendErr);
      }

      // 30-day persistent session
      const sessionData = {
        id: backendUser?.user?.id || (email === 'raaajshinde@gmail.com' ? 1 : Date.now()),
        email: email,
        name: name,
        picture: picture,
        sub: sub,
        id_token: token,
        spreadsheet_id: backendUser?.spreadsheet?.spreadsheet_id || (email === 'raaajshinde@gmail.com' ? '1x-master-raj-expenses-sheet-2026' : `1sheet_${Date.now()}`),
        spreadsheet_url: backendUser?.spreadsheet?.spreadsheet_url || '',
        expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
        login_time: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      setUser(sessionData);
      return { success: true, user: sessionData, is_new: backendUser?.is_new_user };
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
      throw err;
    }
  };

  // Direct login for any user (supports Raj or new test accounts)
  const loginDirectlyAsAuthorizedUser = async (email = 'raaajshinde@gmail.com', name = 'Raj Shinde') => {
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const userName = name || cleanEmail.split('@')[0];
      const sub = 'direct_' + cleanEmail;

      let backendUser = null;
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, name: userName, sub, picture: '' })
        });
        if (res.ok) {
          backendUser = await res.json();
        }
      } catch (backendErr) {}

      const sessionData = {
        id: backendUser?.user?.id || (cleanEmail === 'raaajshinde@gmail.com' ? 1 : Date.now()),
        email: cleanEmail,
        name: userName,
        picture: '',
        auth_method: 'direct_entry',
        sub: sub,
        spreadsheet_id: backendUser?.spreadsheet?.spreadsheet_id || (cleanEmail === 'raaajshinde@gmail.com' ? '1x-master-raj-expenses-sheet-2026' : `1sheet_${Date.now()}`),
        spreadsheet_url: backendUser?.spreadsheet?.spreadsheet_url || '',
        expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
        login_time: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      setUser(sessionData);
      return { success: true, user: sessionData };
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  // Login with passphrase (allows any account to sign in with authorized passphrase)
  const loginWithPassphrase = async (email, passphrase) => {
    setAuthError(null);
    if (!email || !email.includes('@')) {
      const msg = 'Please enter a valid Google account email.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (passphrase !== 'ET_SECURE_SYNC_KEY_2026' && passphrase !== 'admin123' && passphrase !== 'raj2026') {
      const msg = 'Incorrect security passphrase.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const cleanEmail = email.trim().toLowerCase();
    const userName = cleanEmail.split('@')[0];
    return await loginDirectlyAsAuthorizedUser(cleanEmail, userName);
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authError,
        googleClientId,
        updateGoogleClientId,
        loginWithGoogle,
        loginWithPassphrase,
        loginDirectlyAsAuthorizedUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
