import React from 'react';
import { Type, RotateCcw, Smartphone, Laptop, Check, Sparkles, Sliders } from 'lucide-react';
import { useFontSize } from '../context/FontSizeContext';
import { useLanguage } from '../context/LanguageContext';

export default function FontSizeSettingsControl({
  isCompact = false,
  showTitle = true,
  onClose = null
}) {
  const {
    deviceCategory,
    fontSizePx,
    fontMode,
    fontPreset,
    setFontPreset,
    setFontCustom,
    resetFont,
    availablePresets,
    minFontSize,
    maxFontSize,
    defaultFontSize
  } = useFontSize();
  const { t } = useLanguage();

  const isDefault = fontMode === 'preset' && fontPreset === 'medium' && fontSizePx === defaultFontSize;
  const isCustomActive = fontMode === 'custom' || !fontPreset;

  return (
    <div className={`space-y-4 ${isCompact ? '' : 'p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18132F] border border-slate-200/80 dark:border-purple-500/15 shadow-xs'}`} data-testid="font-size-settings-control">
      {/* 1. Header & Device Category Pill */}
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-[#281D4C] text-[#6C47FF] dark:text-[#C084FC] flex items-center justify-center shrink-0 shadow-xs">
              <Type size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('appFontSize', 'App Font Size')}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6C47FF]/10 text-[#6C47FF] dark:text-[#C084FC] border border-[#6C47FF]/20">
                  {fontSizePx}px
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize text size across the entire application with device-specific preferences
              </p>
            </div>
          </div>

          {/* Device Detection Context Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shrink-0 self-start sm:self-auto">
            {deviceCategory === 'desktop' ? (
              <>
                <Laptop size={13} className="text-[#6C47FF] dark:text-[#C084FC]" />
                <span>Windows / Desktop (≥768px)</span>
              </>
            ) : (
              <>
                <Smartphone size={13} className="text-[#6C47FF] dark:text-[#C084FC]" />
                <span>Mobile Layout (&lt;768px)</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Preset Sizes Option A */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Option A: Preset Sizes
          </label>
          <span className="text-[11px] text-slate-400">
            {fontMode === 'preset' ? `Active: ${availablePresets.find(p => p.id === fontPreset)?.label || 'Medium'}` : 'Custom Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {availablePresets.map((preset) => {
            const isSelected = fontMode === 'preset' && fontPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`font-preset-${preset.id}`}
                onClick={() => setFontPreset(preset.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between min-h-[72px] ${
                  isSelected
                    ? 'border-[#6C47FF] bg-purple-500/10 dark:bg-purple-900/30 ring-2 ring-[#6C47FF]/30 shadow-sm'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#6C47FF] dark:group-hover:text-[#C084FC] transition-colors">
                    {preset.label}
                  </span>
                  {isSelected ? (
                    <span className="w-4 h-4 rounded-full bg-[#6C47FF] text-white flex items-center justify-center text-[10px] font-bold">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {preset.sizePx}px
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Font Size Option B (Slider with Numeric Value) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders size={13} className="text-[#6C47FF] dark:text-[#C084FC]" />
            <span>Option B: Custom Size</span>
          </label>

          {isCustomActive ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6C47FF] text-white shadow-xs animate-fade-in" data-testid="custom-active-badge">
              Custom Active · {fontSizePx}px
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">
              Drag slider to customize
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 w-8 text-right font-mono">
              {minFontSize}px
            </span>
            <input
              type="range"
              min={minFontSize}
              max={maxFontSize}
              step="1"
              value={fontSizePx}
              data-testid="font-size-slider"
              aria-label="Custom Font Size Slider"
              onChange={(e) => setFontCustom(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C47FF]"
            />
            <span className="text-xs font-bold text-slate-400 w-8 font-mono">
              {maxFontSize}px
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 px-8">
            <span>Minimum (12px)</span>
            <span className="text-[#6C47FF] dark:text-[#C084FC] font-bold">Default (16px)</span>
            <span>Maximum (24px)</span>
          </div>
        </div>
      </div>

      {/* 4. Live Interactive Typography Preview */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#6C47FF] dark:text-[#C084FC]" />
            <span>Live Typography Preview</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono" data-testid="preview-current-size">
            Current: {fontSizePx}px ({fontMode === 'preset' ? availablePresets.find(p => p.id === fontPreset)?.label : 'Custom'})
          </span>
        </div>

        <div 
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-[#6C47FF]/20 space-y-2"
          data-testid="font-live-preview-box"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 dark:text-white" style={{ fontSize: '1.25rem' }}>
              Spending Overview
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Active Vault
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed" style={{ fontSize: '0.875rem' }}>
            Track daily transactions, monthly budgets, and intelligent analytics across all your connected devices.
          </p>

          <div className="pt-1 flex items-center justify-between border-t border-purple-500/15 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Groceries · Supermarket</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">₹2,450.00</span>
          </div>
        </div>
      </div>

      {/* 5. Footer Reset & Context Clarification */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          data-testid="reset-font-button"
          onClick={resetFont}
          disabled={isDefault}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#6C47FF] text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#6C47FF] dark:hover:text-[#C084FC] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        >
          <RotateCcw size={13} />
          <span>Reset to Default (16px)</span>
        </button>

        <p className="text-[11px] text-slate-400 text-center sm:text-right">
          Preferences save independently for {deviceCategory === 'desktop' ? 'Windows / Desktop' : 'Mobile'}.
        </p>
      </div>

      {onClose && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
