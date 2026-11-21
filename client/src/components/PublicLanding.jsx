import React from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  PieChart, 
  TrendingUp, 
  ArrowRight, 
  FileSpreadsheet, 
  Smartphone, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function PublicLanding({ onOpenAuth, onOpenLegal }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fe] via-white to-[#ede9fe]/40 dark:from-[#0d0b18] dark:via-[#16132a] dark:to-[#0d0b18] text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* 1. PUBLIC NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-[#16132A]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#371485] to-[#763cf8] text-white flex items-center justify-center font-black text-base shadow-md shadow-purple-600/30">
            ₹
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight block">
              Expense Tracker
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Personal Finance Manager</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-[#6C47FF] transition-colors">Features</a>
            <a href="#security" className="hover:text-[#6C47FF] transition-colors">Security</a>
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-[#6C47FF] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-[#6C47FF] transition-colors cursor-pointer"
            >
              Terms
            </button>
          </div>

          <button
            onClick={() => onOpenAuth('signin')}
            className="px-4 py-2 rounded-xl bg-[#6C47FF] hover:bg-[#5835E5] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200/60 dark:border-purple-800/50 text-xs font-bold text-[#6C47FF] dark:text-[#A78BFA] shadow-xs">
          <Sparkles size={14} />
          <span>Simple, Private &amp; Powerful Personal Bookkeeping</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Track Expenses. Master Your Budget. Keep Total Control.
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The all-in-one personal finance tracker designed for daily clarity. Log expenses in seconds, monitor monthly budget limits, explore rich category breakdowns, and own 100% of your financial data.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth('signup')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#6C47FF] hover:bg-[#5835E5] text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => onOpenAuth('signin')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-[#16132A] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-semibold text-sm transition-all cursor-pointer shadow-sm"
          >
            Sign In to Existing Account
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>100% Isolated Data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#6C47FF]" />
            <span>Zero Third-Party Data Selling</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet size={15} className="text-blue-500" />
            <span>Excel &amp; JSON Export</span>
          </div>
        </div>
      </section>

      {/* 3. APP PREVIEW SHOWCASE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative rounded-3xl bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] flex items-center justify-center font-bold">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Overview Demo</h3>
                <p className="text-xs text-slate-400">Monthly Budget &amp; Category Distribution</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              On Track
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Metric 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
              <span className="text-xs font-medium text-slate-400">Monthly Budget</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">₹12,000</div>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#6C47FF] h-full rounded-full" style={{ width: '42%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Spent: ₹5,040</span>
                <span>Remaining: ₹6,960</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-medium text-slate-400">Top Categories</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 dark:text-slate-300">Food &amp; Dining</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹2,450 (48%)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 dark:text-slate-300">Transportation</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹1,200 (24%)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 dark:text-slate-300">Groceries</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹850 (17%)</span>
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-medium text-slate-400">Payment Modes</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 dark:text-slate-300">UPI / GPay</span>
                  <span className="font-bold text-[#6C47FF]">₹3,800 (75%)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 dark:text-slate-300">Cash</span>
                  <span className="font-bold text-emerald-600">₹800 (16%)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 dark:text-slate-300">Credit / Debit Card</span>
                  <span className="font-bold text-blue-600">₹440 (9%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SECTION */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Engineered for Effortless Financial Clarity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to keep daily spending disciplined and organized without spreadsheet headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-[#6C47FF] flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Target Monthly Budget</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Set realistic spending targets with real-time pace projections and threshold warnings to prevent month-end surprises.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <PieChart size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">13 Standard Categories</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Organize every expense with clean standard categories (Food, Groceries, Housing, Loans) plus custom category creation.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mobile &amp; Desktop Ready</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Clean responsive navigation designed for mobile thumbs with a center action button and an expansive desktop view.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <FileSpreadsheet size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sovereign Data Export</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export your entire historical ledger anytime to Microsoft Excel (.xlsx), CSV, or raw JSON with one simple click.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY & SECURITY DISCLOSURE */}
      <section id="security" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#A78BFA]">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold">Privacy-First Architecture</h3>
              <p className="text-xs text-slate-400">Strict isolation and minimal data collection</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your expense records are stored in private, isolated Google Cloud Firestore vaults protected by verified User ID security rules. We use Google Sign-In solely for account authentication using non-sensitive profile scopes. We do not access your private emails, files, or external documents, and we never sell your data to advertisers.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#A78BFA]">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Read Full Privacy Policy</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Terms of Service</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* 6. PUBLIC FOOTER */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-10 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-[#16132A]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-bold text-slate-800 dark:text-slate-200">My Expense Tracker</p>
            <p className="text-[11px]">Developer: Raj Shinde · Support: <a href="mailto:raaajshinde@gmail.com" className="text-[#6C47FF] hover:underline">raaajshinde@gmail.com</a></p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-[#6C47FF] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-[#6C47FF] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => onOpenAuth('signin')}
              className="hover:text-[#6C47FF] transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
