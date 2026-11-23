/**
 * Application-Wide Font Size & Device-Specific Preference Service
 * 
 * Provides independent local persistence for Mobile (<768px) and Desktop/Windows (>=768px) devices,
 * preset and custom size controls (12px - 24px), proportional typography scaling, and live DOM application.
 */

export const FONT_STORAGE_KEY_MOBILE = 'expense_tracker_font_mobile';
export const FONT_STORAGE_KEY_DESKTOP = 'expense_tracker_font_desktop';

export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 24;
export const DEFAULT_FONT_SIZE = 16;
export const BREAKPOINT_DESKTOP_PX = 768;

export const FONT_PRESETS = [
  {
    id: 'small',
    label: 'Small',
    sizePx: 14,
    scale: 0.875,
    description: 'Compact density, fits more content'
  },
  {
    id: 'medium',
    label: 'Medium',
    sizePx: 16,
    scale: 1.0,
    description: 'Default balanced readability'
  },
  {
    id: 'large',
    label: 'Large',
    sizePx: 18,
    scale: 1.125,
    description: 'Enhanced readability & comfort'
  },
  {
    id: 'extra-large',
    label: 'Extra Large',
    sizePx: 20,
    scale: 1.25,
    description: 'Maximum accessibility & prominent text'
  }
];

export const DEFAULT_FONT_CONFIG = {
  mode: 'preset', // 'preset' | 'custom'
  preset: 'medium', // 'small' | 'medium' | 'large' | 'extra-large' | null
  sizePx: DEFAULT_FONT_SIZE
};

/**
 * Determines whether the active environment is mobile or desktop based on the
 * 768px responsive breakpoint. Works across mobile browsers, desktop browser windows,
 * and handles native Capacitor wrappers if present.
 * 
 * @returns {'mobile' | 'desktop'}
 */
export function getDeviceCategory() {
  if (typeof window === 'undefined') return 'desktop';

  // If Capacitor native platform is detected, treat as mobile
  if (window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform()) {
    return 'mobile';
  }

  // Responsive breakpoint: below 768px is mobile; 768px and above is desktop/tablet
  if (window.matchMedia) {
    return window.matchMedia(`(min-width: ${BREAKPOINT_DESKTOP_PX}px)`).matches ? 'desktop' : 'mobile';
  }

  return window.innerWidth >= BREAKPOINT_DESKTOP_PX ? 'desktop' : 'mobile';
}

/**
 * Returns the storage key corresponding to the device category.
 * 
 * @param {'mobile' | 'desktop'} deviceCategory
 * @returns {string}
 */
export function getStorageKey(deviceCategory) {
  return deviceCategory === 'desktop' ? FONT_STORAGE_KEY_DESKTOP : FONT_STORAGE_KEY_MOBILE;
}

/**
 * Sanitizes and validates a font configuration object.
 * Protects against corrupted, missing, or out-of-range local storage data.
 * 
 * @param {any} raw
 * @returns {{ mode: 'preset' | 'custom', preset: string | null, sizePx: number }}
 */
export function normalizeFontConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_FONT_CONFIG };
  }

  // Parse and clamp font size
  const parsedPx = Number(raw.sizePx);
  const sizePx = isNaN(parsedPx)
    ? DEFAULT_FONT_SIZE
    : Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(parsedPx)));

  const mode = raw.mode === 'custom' ? 'custom' : 'preset';

  if (mode === 'preset') {
    const matchedPreset = FONT_PRESETS.find(p => p.id === raw.preset);
    if (matchedPreset) {
      return {
        mode: 'preset',
        preset: matchedPreset.id,
        sizePx: matchedPreset.sizePx
      };
    }

    // Check if sizePx matches one of our standard presets
    const fallbackPreset = FONT_PRESETS.find(p => p.sizePx === sizePx);
    if (fallbackPreset) {
      return {
        mode: 'preset',
        preset: fallbackPreset.id,
        sizePx: fallbackPreset.sizePx
      };
    }

    // Otherwise mark as custom
    return {
      mode: 'custom',
      preset: null,
      sizePx
    };
  }

  // Custom mode
  const presetMatch = FONT_PRESETS.find(p => p.sizePx === sizePx);
  return {
    mode: 'custom',
    preset: presetMatch ? presetMatch.id : null,
    sizePx
  };
}

/**
 * Loads the device-specific font configuration from localStorage.
 * Falls back safely to Medium (16px) if corrupted or missing.
 * 
 * @param {'mobile' | 'desktop'} [deviceCategory]
 * @returns {{ mode: 'preset' | 'custom', preset: string | null, sizePx: number }}
 */
export function loadFontPreference(deviceCategory = getDeviceCategory()) {
  if (typeof window === 'undefined') return { ...DEFAULT_FONT_CONFIG };
  const key = getStorageKey(deviceCategory);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_FONT_CONFIG };
    const parsed = JSON.parse(raw);
    return normalizeFontConfig(parsed);
  } catch (err) {
    console.warn(`[FontSizeService] Failed to parse ${key}, falling back to default:`, err);
    return { ...DEFAULT_FONT_CONFIG };
  }
}

/**
 * Saves the device-specific font configuration to localStorage.
 * Does not overwrite the opposite device category's preference.
 * 
 * @param {'mobile' | 'desktop'} deviceCategory
 * @param {{ mode?: string, preset?: string, sizePx?: number }} config
 * @returns {{ mode: 'preset' | 'custom', preset: string | null, sizePx: number }}
 */
export function saveFontPreference(deviceCategory, config) {
  const normalized = normalizeFontConfig(config);
  if (typeof window !== 'undefined') {
    const key = getStorageKey(deviceCategory);
    try {
      localStorage.setItem(key, JSON.stringify(normalized));
    } catch (err) {
      console.error(`[FontSizeService] Failed to save to ${key}:`, err);
    }
  }
  return normalized;
}

/**
 * Applies the font configuration to the document root element using CSS variables
 * and root fontSize, enabling proportional scaling throughout the whole application.
 * 
 * @param {{ sizePx: number, mode?: string, preset?: string }} config
 */
export function applyFontToDom(config) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const sizePx = Number(config?.sizePx) || DEFAULT_FONT_SIZE;
  const scale = Number((sizePx / DEFAULT_FONT_SIZE).toFixed(4));

  root.style.setProperty('--app-font-size', `${sizePx}px`);
  root.style.setProperty('--app-font-scale', String(scale));
  root.style.setProperty('--app-font-size-num', String(sizePx));
  root.style.fontSize = `${sizePx}px`;

  const dataMode = config?.mode === 'custom' ? 'custom' : (config?.preset || 'medium');
  root.setAttribute('data-font-size', dataMode);
  root.setAttribute('data-font-size-px', String(sizePx));
}
