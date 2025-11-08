'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { createEnhancedTheme } from '../theme/enhancedTheme';

/**
 * Enhanced Theme Provider with Dark Mode support
 * Inspired by Raycast's theme system
 */

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleMode: () => void;
  setMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within EnhancedThemeProvider');
  }
  return context;
};

interface EnhancedThemeProviderProps {
  children: React.ReactNode;
  locale?: string;
  defaultMode?: 'light' | 'dark';
}

// RTL cache for Arabic
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const cacheLtr = createCache({
  key: 'muiltr',
});

export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({
  children,
  locale = 'en',
  defaultMode = 'light',
}) => {
  const [mode, setModeState] = useState<'light' | 'dark'>(defaultMode);
  const isArabic = locale === 'ar';

  // Load theme preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
    if (savedMode) {
      setModeState(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setModeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Save theme preference to localStorage
  const setMode = useCallback((newMode: 'light' | 'dark') => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const theme = useMemo(() => createEnhancedTheme(mode, isArabic), [mode, isArabic]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleMode,
      setMode,
    }),
    [mode, toggleMode, setMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <CacheProvider value={isArabic ? cacheRtl : cacheLtr}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </CacheProvider>
    </ThemeContext.Provider>
  );
};

export default EnhancedThemeProvider;
