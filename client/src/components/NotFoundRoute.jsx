import React from 'react';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFoundRoute({ rawPath = '', onGoHome }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div 
        data-testid="not-found-container"
        className="w-full max-w-md bg-white dark:bg-[#16132A] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-fade-in transition-colors"
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 text-[#6C47FF] dark:text-[#A78BFA] mx-auto flex items-center justify-center shadow-inner">
          <Compass size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            The page or feature you are trying to view does not exist or has moved.
          </p>
        </div>

        {rawPath && (
          <div className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-[11px] text-purple-600 dark:text-purple-300">
            {rawPath.startsWith('#') ? rawPath : `#/${rawPath}`}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onGoHome}
            data-testid="not-found-home-btn"
            className="w-full py-3 px-4 bg-[#6C47FF] hover:bg-[#5835E5] text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Home size={16} />
            <span>Go to Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
