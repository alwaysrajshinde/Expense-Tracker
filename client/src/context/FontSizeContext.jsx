import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FONT_PRESETS,
  DEFAULT_FONT_CONFIG,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  DEFAULT_FONT_SIZE,
  BREAKPOINT_DESKTOP_PX,
  getDeviceCategory,
  loadFontPreference,
  saveFontPreference,
  applyFontToDom,
  normalizeFontConfig
} from '../services/fontSizeService';

const FontSizeContext = createContext(null);

export function FontSizeProvider({ children }) {
  // Current active layout category based on responsive breakpoint (<768px = mobile, >=768px = desktop)
  const [deviceCategory, setDeviceCategory] = useState(() => getDeviceCategory());

  // Cached configurations for both device categories
  const [mobileConfig, setMobileConfig] = useState(() => loadFontPreference('mobile'));
  const [desktopConfig, setDesktopConfig] = useState(() => loadFontPreference('desktop'));

  // The active configuration is determined by the current device category
  const activeConfig = deviceCategory === 'desktop' ? desktopConfig : mobileConfig;

  // Apply to DOM on initial mount and whenever activeConfig changes
  useEffect(() => {
    applyFontToDom(activeConfig);
  }, [activeConfig]);

  // Handle responsive breakpoint changes dynamically without overwriting saved preferences
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINT_DESKTOP_PX}px)`);

    const handleBreakpointChange = (e) => {
      const nextCategory = e.matches ? 'desktop' : 'mobile';
      setDeviceCategory(nextCategory);

      // Re-read latest preference for the incoming category and apply to DOM
      const nextConfig = loadFontPreference(nextCategory);
      if (nextCategory === 'desktop') {
        setDesktopConfig(nextConfig);
      } else {
        setMobileConfig(nextConfig);
      }
      applyFontToDom(nextConfig);
    };

    // Modern and legacy event listener fallback
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleBreakpointChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleBreakpointChange);
    }

    // Also attach window resize listener for maximum reliability
    const handleWindowResize = () => {
      const current = getDeviceCategory();
      setDeviceCategory(prev => {
        if (prev !== current) {
          const nextConfig = loadFontPreference(current);
          if (current === 'desktop') setDesktopConfig(nextConfig);
          else setMobileConfig(nextConfig);
          applyFontToDom(nextConfig);
          return current;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleBreakpointChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleBreakpointChange);
      }
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Sync across tabs if user updates preferences in another tab
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === 'expense_tracker_font_mobile') {
        const next = normalizeFontConfig(e.newValue ? JSON.parse(e.newValue) : null);
        setMobileConfig(next);
        if (deviceCategory === 'mobile') applyFontToDom(next);
      } else if (e.key === 'expense_tracker_font_desktop') {
        const next = normalizeFontConfig(e.newValue ? JSON.parse(e.newValue) : null);
        setDesktopConfig(next);
        if (deviceCategory === 'desktop') applyFontToDom(next);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [deviceCategory]);

  /**
   * Selects a preset font size ('small', 'medium', 'large', 'extra-large')
   * Updates only the active device category without altering the other.
   */
  const setFontPreset = useCallback((presetId) => {
    const matched = FONT_PRESETS.find(p => p.id === presetId) || FONT_PRESETS.find(p => p.id === 'medium');
    const newConfig = {
      mode: 'preset',
      preset: matched.id,
      sizePx: matched.sizePx
    };

    saveFontPreference(deviceCategory, newConfig);
    if (deviceCategory === 'desktop') {
      setDesktopConfig(newConfig);
    } else {
      setMobileConfig(newConfig);
    }
    applyFontToDom(newConfig);
  }, [deviceCategory]);

  /**
   * Sets a custom font size in pixels (clamped between 12px and 24px)
   * Updates only the active device category without altering the other.
   */
  const setFontCustom = useCallback((sizePx) => {
    const clampedPx = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(Number(sizePx) || DEFAULT_FONT_SIZE)));
    const matchedPreset = FONT_PRESETS.find(p => p.sizePx === clampedPx);

    const newConfig = {
      mode: 'custom',
      preset: matchedPreset ? matchedPreset.id : null,
      sizePx: clampedPx
    };

    saveFontPreference(deviceCategory, newConfig);
    if (deviceCategory === 'desktop') {
      setDesktopConfig(newConfig);
    } else {
      setMobileConfig(newConfig);
    }
    applyFontToDom(newConfig);
  }, [deviceCategory]);

  /**
   * Resets active device category to Default Medium (16px)
   */
  const resetFont = useCallback(() => {
    const defaultConfig = { ...DEFAULT_FONT_CONFIG };
    saveFontPreference(deviceCategory, defaultConfig);
    if (deviceCategory === 'desktop') {
      setDesktopConfig(defaultConfig);
    } else {
      setMobileConfig(defaultConfig);
    }
    applyFontToDom(defaultConfig);
  }, [deviceCategory]);

  const value = useMemo(() => ({
    deviceCategory,
    fontConfig: activeConfig,
    fontSizePx: activeConfig.sizePx,
    fontMode: activeConfig.mode,
    fontPreset: activeConfig.preset,
    mobileConfig,
    desktopConfig,
    setFontPreset,
    setFontCustom,
    resetFont,
    availablePresets: FONT_PRESETS,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    defaultFontSize: DEFAULT_FONT_SIZE
  }), [
    deviceCategory,
    activeConfig,
    mobileConfig,
    desktopConfig,
    setFontPreset,
    setFontCustom,
    resetFont
  ]);

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      deviceCategory: getDeviceCategory(),
      fontConfig: DEFAULT_FONT_CONFIG,
      fontSizePx: DEFAULT_FONT_SIZE,
      fontMode: 'preset',
      fontPreset: 'medium',
      mobileConfig: DEFAULT_FONT_CONFIG,
      desktopConfig: DEFAULT_FONT_CONFIG,
      setFontPreset: () => {},
      setFontCustom: () => {},
      resetFont: () => {},
      availablePresets: FONT_PRESETS,
      minFontSize: MIN_FONT_SIZE,
      maxFontSize: MAX_FONT_SIZE,
      defaultFontSize: DEFAULT_FONT_SIZE
    };
  }
  return context;
}

export default FontSizeContext;
