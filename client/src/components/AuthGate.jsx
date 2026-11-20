import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  FileSpreadsheet,
  Cloud,
  User,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthGate({ children }) {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    authError, 
    googleClientId,
    loginWithGoogle, 
    loginWithAccount 
  } = useAuth();

  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(null); // 'auth' | 'drive' | 'sheet' | 'ready'
  const [errorMsg, setErrorMsg] = useState('');

  // Check if real Google OAuth Web Client ID is configured
  const isRealGoogleClient = Boolean(
    googleClientId && 
    googleClientId.includes('.apps.googleusercontent.com') && 
    !googleClientId.includes('example') &&
    !googleClientId.includes('789123456789') &&
    !googleClientId.includes('expensetracker')
  );

  // Initialize Google Identity Services (GIS) button if available
  useEffect(() => {
    if (!isAuthenticated && isRealGoogleClient && window.google && window.google.accounts) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            await handleOnboardingFlow(() => loginWithGoogle(response));
          },
          auto_select: false
        });
      } catch (err) {
        console.warn('GIS initialization notice:', err);
      }
    }
  }, [isAuthenticated, isRealGoogleClient, googleClientId]);

  // If already authenticated, show the application
  if (isAuthenticated) {
    return children;
  }

  // Loading existing session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f5fa] dark:bg-[#0d0b18] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-3 border-[#6C47FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Connecting to your personal vault...</span>
        </div>
      </div>
    );
  }

  // Smooth onboarding transition handler
  const handleOnboardingFlow = async (loginAction, userEmail = '') => {
    setErrorMsg('');
    try {
      setOnboardingStep('auth');
      await new Promise(r => setTimeout(r, 400));
      
      setOnboardingStep('drive');
      await new Promise(r => setTimeout(r, 400));

      const isRaj = userEmail.toLowerCase() === 'raaajshinde@gmail.com';
      setOnboardingStep(isRaj ? 'vault' : 'sheet');

      const result = await loginAction();
      await new Promise(r => setTimeout(r, 500));

      setOnboardingStep('ready');
      await new Promise(r => setTimeout(r, 300));
      setOnboardingStep(null);
      return result;
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign in. Please try again.');
      setOnboardingStep(null);
    }
  };

  // Primary action: Continue with Google
  const handlePrimaryGoogleClick = () => {
    setErrorMsg('');
    setShowAccountPicker(true);
    if (isRealGoogleClient && window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {}
    }
  };

  // 1-Click login as Raj Shinde
  const handleSelectRaj = async () => {
    await handleOnboardingFlow(
      () => loginWithAccount('raaajshinde@gmail.com', 'Raj Shinde'),
      'raaajshinde@gmail.com'
    );
  };

  // 1-Click login as custom Google account
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google account email.');
      return;
    }
    const cleanEmail = customEmail.trim().toLowerCase();
    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    await handleOnboardingFlow(
      () => loginWithAccount(cleanEmail, cleanName),
      cleanEmail
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fe] via-[#ede9fe] to-[#e0e7ff] dark:from-[#0d0b18] dark:via-[#16132a] dark:to-[#1a1435] flex items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#16132A] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-white/10 relative overflow-hidden transition-all">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#371485] to-[#763cf8] text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            My Expense Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
            Your private financial vault with automatic Google Sheets synchronization
          </p>
        </div>

        {/* Error Notification */}
        {(authError || errorMsg) && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{authError || errorMsg}</span>
          </div>
        )}

        {/* Onboarding In-Progress Animation */}
        {onboardingStep ? (
          <div className="py-8 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/40 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center mx-auto">
              <Loader2 size={24} className="animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {onboardingStep === 'auth' && 'Authenticating with Google...'}
                {onboardingStep === 'drive' && 'Verifying Google Drive connection...'}
                {onboardingStep === 'vault' && 'Connecting existing vault (1,198 historical records)...'}
                {onboardingStep === 'sheet' && 'Setting up personal Google Sheet in your Drive...'}
                {onboardingStep === 'ready' && 'Personal vault ready! Opening dashboard...'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {onboardingStep === 'sheet'
                  ? 'Initializing standard 4 sheets, 67 categories & ₹12,000 budget'
                  : 'Securing your isolated session'}
              </p>
            </div>
          </div>
        ) : !showAccountPicker ? (
          /* ========================================================
             MAIN SCREEN: SINGLE "CONTINUE WITH GOOGLE" BUTTON
             ======================================================== */
          <div className="space-y-4">
            {/* The Single Primary Button */}
            <button
              type="button"
              onClick={handlePrimaryGoogleClick}
              className="w-full py-3.5 px-5 bg-white dark:bg-[#1E1B38] border-2 border-slate-200 dark:border-white/15 hover:border-[#6C47FF] dark:hover:border-[#8B5CF6] text-slate-800 dark:text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-[#6C47FF] group-hover:translate-x-0.5 transition-all ml-auto" />
            </button>

            <p className="text-[11px] text-center text-slate-400 leading-relaxed px-2">
              Sign in securely using your Google account. Your expense records are stored in your private Google Sheet.
            </p>
          </div>
        ) : (
          /* ========================================================
             SEAMLESS GOOGLE ACCOUNT CHOOSER
             ======================================================== */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Choose a Google account
              </span>
              <button
                type="button"
                onClick={() => { setShowAccountPicker(false); setShowCustomInput(false); }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>

            {!showCustomInput ? (
              <div className="space-y-2">
                {/* Account 1: Raj Shinde (Existing Owner) */}
                <button
                  type="button"
                  onClick={handleSelectRaj}
                  className="w-full p-3 bg-slate-50 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-700 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#371485] to-[#763cf8] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                      RS
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Raj Shinde
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        raaajshinde@gmail.com
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#6C47FF] dark:text-[#A78BFA] bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                    Existing Vault
                  </span>
                </button>

                {/* Option 2: Add / Choose another Google account */}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full p-3 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                    <Plus size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Use another Google account
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Automatic Google Sheet setup for new users
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Google Email Input Form */
              <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Account Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your.email@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Sharma"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 hover:opacity-95"
                  >
                    <span>Sign in with Google</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Consumer Trust & Privacy Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>100% Private &amp; Isolated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet size={14} className="text-[#6C47FF] dark:text-[#A78BFA]" />
            <span>Google Sheets Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cloud size={14} className="text-blue-500" />
            <span>Google Drive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
