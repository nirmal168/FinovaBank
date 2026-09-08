import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'finova-theme';
const VALID_THEMES = ['light', 'dark', 'night'];

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  isLight: true,
  isDark: false,
  isNight: false,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && VALID_THEMES.includes(saved)) {
        return saved;
      }
      // If user has system dark mode preference, optional default could be dark, but spec says:
      // "When the application starts: 1. Check localStorage. 2. If saved theme exists, use it. 3. Otherwise use Light Mode."
      return 'light';
    } catch (e) {
      return 'light';
    }
  });

  const applyThemeToDom = useCallback((newTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    
    // Manage Tailwind dark classes
    if (newTheme === 'dark' || newTheme === 'night') {
      root.classList.add('dark');
      if (newTheme === 'night') {
        root.classList.add('night');
      } else {
        root.classList.remove('night');
      }
    } else {
      root.classList.remove('dark', 'night');
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
    applyThemeToDom(newTheme);
  }, [applyThemeToDom]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      let next = 'light';
      if (prev === 'light') next = 'dark';
      else if (prev === 'dark') next = 'night';
      else if (prev === 'night') next = 'light';
      
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {}
      applyThemeToDom(next);
      return next;
    });
  }, [applyThemeToDom]);

  // Ensure DOM is in sync on mount
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme, applyThemeToDom]);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue && VALID_THEMES.includes(e.newValue)) {
        setThemeState(e.newValue);
        applyThemeToDom(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [applyThemeToDom]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    isNight: theme === 'night',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
