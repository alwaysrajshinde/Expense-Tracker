import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const AVAILABLE_THEMES = [
  { id: 'light', name: 'Clean Slate (Light)', bg: '#f4f5fa', surface: '#ffffff', accent: '#6C47FF' },
  { id: 'dark', name: 'Dark Violet (Dark)', bg: '#0d0b18', surface: '#16132a', accent: '#8B5CF6' },
  { id: 'midnight', name: 'Midnight Velvet (OLED)', bg: '#030712', surface: '#0b0f19', accent: '#6366F1' },
  { id: 'emerald', name: 'Emerald Fintech', bg: '#061c16', surface: '#0b2920', accent: '#10B981' }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('expense_tracker_theme');
    if (saved && AVAILABLE_THEMES.some(t => t.id === saved)) return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_theme', theme);
    const root = document.documentElement;

    // Apply Tailwind dark mode class for any non-light theme
    if (theme !== 'light') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply specific theme data attribute and classes
    root.setAttribute('data-theme', theme);
    AVAILABLE_THEMES.forEach(t => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
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
