import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const AVAILABLE_THEMES = [
  { id: 'dark', name: 'Dark Violet', description: 'Executive dark violet fintech aesthetic', bg: '#0d0b18', surface: '#16132a', accent: '#8B5CF6', badge: 'Primary' },
  { id: 'light', name: 'Light', description: 'Clean, crisp daylight appearance', bg: '#f4f5fa', surface: '#ffffff', accent: '#6C47FF', badge: 'Clean' },
  { id: 'midnight', name: 'Midnight', description: 'Deep OLED black with indigo accents', bg: '#030712', surface: '#0b0f19', accent: '#6366F1', badge: 'OLED' },
  { id: 'ocean', name: 'Ocean Blue', description: 'Navy blue with cyan accents', bg: '#081325', surface: '#0f1e36', accent: '#0284c7', badge: 'Navy' },
  { id: 'emerald', name: 'Emerald', description: 'Forest green fintech appearance', bg: '#041611', surface: '#09251c', accent: '#10B981', badge: 'Fintech' },
  { id: 'rose', name: 'Rose', description: 'Soft velvet plum & rose appearance', bg: '#160a12', surface: '#24121e', accent: '#F43F5E', badge: 'Velvet' },
  { id: 'system', name: 'System Default', description: 'Automatically matches your device settings', bg: '#0d0b18', surface: '#16132a', accent: '#8B5CF6', badge: 'Auto' }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('expense_tracker_theme');
    if (saved && AVAILABLE_THEMES.some(t => t.id === saved)) return saved;
    return 'dark'; // Dark Violet is the primary default
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_theme', theme);
    const root = document.documentElement;

    const resolveTheme = () => {
      if (theme === 'system') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    };

    const effectiveTheme = resolveTheme();

    // Apply Tailwind dark mode class for any non-light theme
    if (effectiveTheme !== 'light') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply specific theme data attribute and classes
    root.setAttribute('data-theme', effectiveTheme);
    AVAILABLE_THEMES.forEach(t => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${effectiveTheme}`);

    // Listen to system color scheme changes if system is selected
    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        const newEffective = mediaQuery.matches ? 'dark' : 'light';
        if (newEffective !== 'light') root.classList.add('dark');
        else root.classList.remove('dark');
        root.setAttribute('data-theme', newEffective);
        AVAILABLE_THEMES.forEach(t => root.classList.remove(`theme-${t.id}`));
        root.classList.add(`theme-${newEffective}`);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      toggleTheme, 
      isDark: theme !== 'light',
      availableThemes: AVAILABLE_THEMES 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
