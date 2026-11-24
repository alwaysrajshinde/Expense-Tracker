import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, Sparkles, Lock, ArrowLeft, ShieldCheck, CheckCircle2,
  FileSpreadsheet, Camera, CalendarClock, Landmark, AlertCircle
} from 'lucide-react';
import { getFeatureConfig } from '../../constants/featureAvailability';

const ICON_MAP = {
  FileSpreadsheet,
  Camera,
  CalendarClock,
  Landmark
};

export default function ComingSoonPreviewModal({
  isOpen,
  onClose,
  featureId,
  customFeature
}) {
  if (!isOpen) return null;

  const feature = customFeature || getFeatureConfig(featureId) || {
    id: 'upcoming_feature',
    name: 'Upcoming Feature',
    shortName: 'Feature Preview',
    category: 'Innovation',
    iconName: 'Sparkles',
    badgeText: 'Coming Soon',
    badgeColor: '#6C47FF',
    tagline: 'Something exciting is on the way!',
    description: "We're working on something useful to help you manage your personal finances with greater ease.",
    subtext: "This feature is currently in active development. We're preparing it to deliver a better experience for you.",
    highlights: [
      'Engineered directly for speed, privacy, and zero data leakage',
      'Seamless multi-device synchronization across mobile and desktop',
      'Proportional typography and Dark Violet aesthetic compliance'
    ],
    plannedDate: 'Upcoming Release'
  };

  const IconComponent = ICON_MAP[feature.iconName] || Sparkles;

  const handleFormSubmitPrevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      style={{ touchAction: 'none' }}
      data-testid="coming-soon-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
    >
      {/* Backdrop click closes modal */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#18132F] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-purple-500/20 shadow-2xl z-10 space-y-4 sm:space-y-5 animate-scale-in max-h-[92vh] overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}
        data-testid={`coming-soon-modal-${feature.id}`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: feature.badgeColor || '#6C47FF' }}
            >
              <IconComponent size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="coming-soon-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
                >
                  {feature.name}
                </h3>
                <span
                  data-testid="coming-soon-badge"
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-[#6C47FF] dark:text-[#C084FC] border border-purple-500/30 uppercase tracking-wider shrink-0"
                >
                  <Lock size={9} />
                  <span>{feature.badgeText || 'Coming Soon'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {feature.category} · {feature.plannedDate || 'In Development'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            data-testid="coming-soon-close-btn"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Positive & Professional Message Banner */}
        <div
          data-testid="coming-soon-message-banner"
          className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-900 dark:text-purple-200 text-xs space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#6C47FF] dark:text-[#C084FC] shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
              {feature.tagline || 'Something exciting is on the way!'}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-purple-300/90 leading-relaxed pl-6">
            {feature.subtext || "This feature is currently in development. We're preparing it to deliver a better experience for you."}
          </p>
        </div>

        {/* Visual Preview Section of Planned Interface */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Interface Preview (Read-Only)
            </span>
            <span className="text-[10px] text-slate-400 italic">
              Interactive controls disabled during preview
            </span>
          </div>

          {/* Planned UI Mockup Card with Strictly Disabled Controls */}
          <form
            onSubmit={handleFormSubmitPrevent}
            data-testid="coming-soon-mockup-form"
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-3 relative overflow-hidden"
          >
            {/* Disabled Overlay Ribbon */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Lock size={9} />
              <span>Preview Mode</span>
            </div>

            {/* Feature-Specific Mock View */}
            {feature.id === 'receipt_scanner' ? (
              <div className="space-y-2.5">
                <div className="h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center gap-2 bg-slate-100/50 dark:bg-white/[0.01]">
                  <Camera size={24} className="text-slate-400 opacity-60" />
                  <span className="text-xs text-slate-400 font-medium">Position receipt inside viewfinder</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Auto-Detected: ₹480.00"
                    aria-disabled="true"
                    className="px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  />
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Vendor: Starbucks Coffee"
                    aria-disabled="true"
                    className="px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            ) : feature.id === 'recurring_expenses' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 opacity-75">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center text-xs font-bold">N</div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Netflix Premium</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">₹649 / month</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 opacity-75">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">S</div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Spotify Family</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">₹179 / month</span>
                </div>
              </div>
            ) : feature.id === 'bank_auto_sync' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 opacity-75">
                  <div className="flex items-center gap-2">
                    <Landmark size={15} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">HDFC Bank · XX4092</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500">Connected · Read-Only</span>
                </div>
                <input
                  type="text"
                  disabled
                  readOnly
                  value="Account Aggregator Consent: Scheduled"
                  aria-disabled="true"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed"
                />
              </div>
            ) : (
              /* Generic Planned Feature View */
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 opacity-75 space-y-1">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{feature.shortName || feature.name} Integration</div>
                  <div className="text-[11px] text-slate-400">{feature.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Automated Ledger Sync"
                    aria-disabled="true"
                    className="px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  />
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Encrypted Vault Sync"
                    aria-disabled="true"
                    className="px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Planned Feature Capabilities */}
        {feature.highlights && feature.highlights.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Planned Capabilities
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2">
              {feature.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={14} className="text-[#6C47FF] dark:text-[#C084FC] shrink-0 mt-0.5" />
                  <span className="leading-snug">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls: Primary action STRICTLY DISABLED */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            data-testid="coming-soon-back-btn"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Back to Settings</span>
          </button>

          {/* Strictly Disabled Action Button */}
          <button
            type="button"
            disabled={true}
            aria-disabled="true"
            data-testid="coming-soon-disabled-action-btn"
            title="This feature is in development and currently disabled"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500/20 text-[#6C47FF] dark:text-[#C084FC] text-xs font-bold border border-purple-500/30 cursor-not-allowed flex items-center justify-center gap-1.5 shadow-none select-none opacity-80"
          >
            <Lock size={13} />
            <span>{feature.shortName || 'Feature'} (Coming Soon)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
