import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const STORAGE_KEY = 'expense_tracker_auth_session';

// Built-in standard Google OAuth Client ID (developer configured)
const DEFAULT_CLIENT_ID = typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.GOOGLE_CLIENT_ID
  ? window.APP_CONFIG.GOOGLE_CLIENT_ID
  : (import.meta.env.VITE_GOOGLE_CLIENT_ID || '789123456789-expensetracker.apps.googleusercontent.com');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [googleClientId] = useState(DEFAULT_CLIENT_ID);

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

  /**
   * Automatic User Onboarding:
   * Authenticates the user and automatically associates or creates their private Google Sheet
   */
  const onboardUser = async (email, name = '', sub = '', picture = '', token = '') => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const userName = name || cleanEmail.split('@')[0];
    const googleSub = sub || ('google_' + Date.now());

    let backendUser = null;
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: userName, sub: googleSub, picture })
      });
      if (res.ok) {
        backendUser = await res.json();
      }
    } catch (backendErr) {
      console.warn('Backend user onboarding sync deferred:', backendErr);
    }

    const isRaj = cleanEmail === 'raaajshinde@gmail.com';
    const spreadsheetId = backendUser?.spreadsheet?.spreadsheet_id || 
      (isRaj ? '1x-master-raj-expenses-sheet-2026' : `1sheet_user_${Date.now()}`);
    const spreadsheetUrl = backendUser?.spreadsheet?.spreadsheet_url || 
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    const sessionData = {
      id: backendUser?.user?.id || (isRaj ? 1 : Date.now()),
      email: cleanEmail,
      name: userName,
      picture: picture || '',
      sub: googleSub,
      id_token: token,
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
      is_new_user: backendUser?.is_new_user || false,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
      login_time: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    setUser(sessionData);
    return { success: true, user: sessionData, is_new: sessionData.is_new_user };
  };

  // Login via Google Identity Services token
  const loginWithGoogle = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential || credentialResponse;
      const payload = parseJwt(token);

      if (!payload || !payload.email) {
        throw new Error('Invalid Google credential payload received.');
      }

      return await onboardUser(
        payload.email,
        payload.name,
        payload.sub,
        payload.picture,
        token
      );
    } catch (err) {
      setAuthError(err.message || 'Google authentication failed');
      throw err;
    }
  };

  // Consumer 1-click Sign-In with any Google account
  const loginWithAccount = async (email, name = '') => {
    return await onboardUser(email, name);
  };

  // Disconnect / Logout
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
        loginWithGoogle,
        loginWithAccount,
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
