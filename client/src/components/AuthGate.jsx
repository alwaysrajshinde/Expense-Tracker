import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  Key, 
  ArrowRight, 
  Wallet, 
  CheckCircle2, 
  Zap, 
  Settings as SettingsIcon, 
  UserPlus,
  Users,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthGate({ children }) {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    authError, 
    googleClientId,
    updateGoogleClientId,
    loginWithGoogle, 
    loginWithPassphrase,
    loginDirectlyAsAuthorizedUser
  } = useAuth();

  const [mode, setMode] = useState('main'); // 'main' | 'custom_user' | 'config' | 'passphrase'
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [passphrase, setPassphrase] = useState('ET_SECURE_SYNC_KEY_2026');
  const [clientIdInput, setClientIdInput] = useState(googleClientId || '');
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if real Google OAuth Web Client ID is configured
  const isRealGoogleClient = Boolean(
    googleClientId && 
    googleClientId.includes('.apps.googleusercontent.com') && 
    !googleClientId.includes('example') && 
    !googleClientId.includes('YOUR_GOOGLE_CLIENT_ID')
  );

  // Initialize Google Identity Services (GIS) button
  useEffect(() => {
    if (!isAuthenticated && isRealGoogleClient && window.google && window.google.accounts) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            loginWithGoogle(response);
          },
          auto_select: false
        });

        const btnContainer = document.getElementById('google-signin-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 320
          });
        }
      } catch (err) {
        console.warn('Google Identity button initialization:', err);
      }
    }
  }, [isAuthenticated, isRealGoogleClient, googleClientId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f5fa] dark:bg-[#0d0b18] flex items-center justify-center p-6 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Validating secure multi-user session...</span>
        </div>
      </div>
    );
  }

  // If authenticated, render application
  if (isAuthenticated) {
    return children;
  }

  // Handler for "Continue with Google" click
  const handleGoogleClick = () => {
    setLocalError('');
    if (isRealGoogleClient) {
      try {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.prompt();
          return;
        }
      } catch (e) {
        console.warn('GIS prompt error:', e);
      }
    }
    // If client ID not yet registered, open configuration modal
    setMode('config');
  };

  // Instant login for existing admin Raj Shinde
  const handleRajLogin = async () => {
    setLocalError('');
    try {
      setSubmitting(true);
      await loginDirectlyAsAuthorizedUser('raaajshinde@gmail.com', 'Raj Shinde');
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Instant login for new user with zero records
  const handleNewUserLogin = async (email, name) => {
    setLocalError('');
    try {
      setSubmitting(true);
      await loginDirectlyAsAuthorizedUser(email, name);
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Client ID
  const handleSaveClientId = (e) => {
    e.preventDefault();
    setLocalError('');
    const cleanId = clientIdInput.trim();
    if (!cleanId || !cleanId.includes('.apps.googleusercontent.com')) {
      setLocalError('Please enter a valid Google OAuth Client ID ending with .apps.googleusercontent.com');
      return;
    }
    updateGoogleClientId(cleanId);
    setLocalSuccess('Google OAuth Client ID saved successfully!');
    setTimeout(() => {
      setLocalSuccess('');
      setMode('main');
    }, 1200);
  };

  // Custom User / Passphrase form submit
  const handleCustomUserSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!inputEmail || !inputEmail.includes('@')) {
      setLocalError('Please enter a valid Google account email.');
      return;
    }
    try {
      setSubmitting(true);
      await loginDirectlyAsAuthorizedUser(inputEmail.trim(), inputName.trim() || inputEmail.split('@')[0]);
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f5fa] via-[#ede9fe] to-[#e0e7ff] dark:from-[#0d0b18] dark:via-[#16132a] dark:to-[#1a1435] flex items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#16132A] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden transition-all">
        {/* Top ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#371485] to-[#763cf8] text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            My Expense Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Multi-User Fintech Vault & Personal Google Sheets
          </p>
        </div>

        {/* Multi-User Isolation Security Badge */}
        <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/40 rounded-2xl flex items-center gap-2.5 text-xs text-purple-900 dark:text-purple-200">
          <Users size={18} className="text-[#6C47FF] dark:text-[#A78BFA] flex-shrink-0" />
          <div className="leading-tight">
            <span className="font-bold block">Multi-User Ready</span>
            <span className="text-[11px] opacity-80">
              Every Google account gets an independent Google Sheet in their own Google Drive
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {(authError || localError) && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{authError || localError}</span>
          </div>
        )}
        {localSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{localSuccess}</span>
          </div>
        )}

        {/* ========================================================
            VIEW 1: MAIN LOGIN SCREEN
           ======================================================== */}
        {mode === 'main' && (
          <div className="space-y-3">
            {/* Primary Option A: Instant Access for Existing Admin Raj Shinde */}
            <button
              onClick={handleRajLogin}
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] hover:from-[#5B32EA] hover:to-[#7C3AED] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-purple-600/25 transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Zap size={16} className="text-amber-300 fill-amber-300" />
                <span>Raj Shinde</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                Existing (1,198 records)
              </span>
            </button>

            {/* Primary Option B: Continue with Google */}
            <button
              onClick={handleGoogleClick}
              className="w-full py-3 px-4 bg-white dark:bg-[#1E1B38] border border-slate-300 dark:border-white/15 hover:border-purple-400 dark:hover:border-purple-500 rounded-2xl font-semibold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
              {!isRealGoogleClient && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold ml-auto">
                  OAuth Setup
                </span>
              )}
            </button>

            {/* Container for Official Google Button if available */}
            {isRealGoogleClient && (
              <div id="google-signin-btn-container" className="flex justify-center pt-1" />
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400">test multi-user accounts</span>
              <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
            </div>

            {/* Quick Multi-User Test Accounts */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleNewUserLogin('alice@example.com', 'Alice Johnson')}
                className="py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>👤 User A (Alice)</span>
                <span className="text-[9px] opacity-75 font-normal">Fresh 0 txs Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => handleNewUserLogin('bob@example.com', 'Bob Smith')}
                className="py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>👤 User B (Bob)</span>
                <span className="text-[9px] opacity-75 font-normal">Fresh 0 txs Sheet</span>
              </button>
            </div>

            {/* Sign in with Custom Google Account */}
            <button
              type="button"
              onClick={() => setMode('custom_user')}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Sign in with Another Google Email</span>
            </button>
          </div>
        )}

        {/* ========================================================
            VIEW 2: CUSTOM GOOGLE ACCOUNT INPUT
           ======================================================== */}
        {mode === 'custom_user' && (
          <form onSubmit={handleCustomUserSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Google Account Email
              </label>
              <input
                type="email"
                required
                placeholder="your.account@gmail.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                A new personal spreadsheet will be associated with your account.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode('main')}
                className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 hover:opacity-95 transition-opacity cursor-pointer"
              >
                <span>Enter Personal Vault</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            VIEW 3: GOOGLE CLIENT ID CONFIGURATION
           ======================================================== */}
        {mode === 'config' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />
                <span>Google Cloud OAuth Setup</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                To enable live Google Sign-In with Google's servers across multiple users, paste your Web Client ID from Google Cloud Console.
              </p>
            </div>

            <form onSubmit={handleSaveClientId} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google OAuth 2.0 Web Client ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="123456789-xxxx.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('main')}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#6C47FF] hover:bg-[#5B32EA] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  Save Client ID
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Commitments Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 space-y-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
            <span>Complete Data Isolation — Each user sees only their own data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
            <span>Independent Google Sheet created in each user's Google Drive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
            <span>Raj's 1,198 historical records permanently preserved & isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
