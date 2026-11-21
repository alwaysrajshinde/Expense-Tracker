import React from 'react';
import { Sparkles, X, Check, Smartphone, Palette, ShieldCheck, Zap, Layers, History, ArrowRight } from 'lucide-react';

export default function ReleaseNotesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const highlights = [
    {
      icon: ShieldCheck,
      title: 'Unified Monthly Budget Architecture',
      description: 'Single source of truth synchronizing Dashboard and Settings. Existing budgets are strictly preserved with zero drift.',
      tag: 'Core Reliability'
    },
    {
      icon: Zap,
      title: 'Email Verification Auto-Refresh & Dismiss',
      description: 'Added visible dismiss button with session-state memory and real-time Firebase reload on tab focus without manual page reloads.',
      tag: 'Authentication'
    },
    {
      icon: Layers,
      title: 'Simplified 13 Standard Categories',
      description: 'Streamlined practical categories (Food, Groceries, Housing, Loans, etc.) preserving 100% of custom and historical records.',
      tag: 'Information Architecture'
    },
    {
      icon: Palette,
      title: 'Redesigned 4-Section Settings Hub',
      description: 'Organized into Account, Preferences, Data Management, and Information, eliminating unverified sync claims.',
      tag: 'UI/UX Redesign'
    },
    {
      icon: Smartphone,
      title: 'Single Add Expense Primary Action',
      description: 'Removed redundant dashboard button in favor of the high-accessibility center bottom navigation action.',
      tag: 'Navigation'
    },
    {
      icon: History,
      title: 'Direct Privacy Policy & Public Showcase',
      description: 'Dedicated public landing view and legal page compliant with Google OAuth and data sovereignty requirements.',
      tag: 'Compliance'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#16132A] rounded-3xl shadow-2xl p-6 z-10 border border-slate-100 dark:border-white/10 space-y-5 animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-900/40 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  What's New in Expense Tracker
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-[#6C47FF] dark:text-[#A78BFA] text-[10px] font-black tracking-wide">
                  v1.2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Released November 2026 · Performance &amp; Experience Update
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-start gap-3.5 transition-all hover:border-purple-200 dark:hover:border-purple-900/40"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#6C47FF] dark:text-[#A78BFA] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  <Icon size={16} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {h.title}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10 flex-shrink-0">
                      {h.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {h.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-400">
            Powered by Firebase &amp; Google Cloud Platform
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 hover:opacity-95 transition-all cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
