'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

/**
 * Enhanced Theme System inspired by Raycast's modern design
 * Features: Dark mode, glass-morphism, gradients, advanced typography
 */

// Color Tokens - Raycast-inspired palette
export const colorTokens = {
  // Dark theme base
  dark: {
    primary: '#070921',      // Deep navy/black background
    secondary: '#0D1117',    // Slightly lighter dark
    tertiary: '#161B22',     // Card backgrounds
    surface: '#1C2128',      // Elevated surfaces
  },
  // Light theme base
  light: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F0F2F5',
    surface: '#FFFFFF',
  },
  // Gradient accent colors
  gradients: {
    purple: '#523091',
    blue: '#043f96',
    magenta: '#8B2D91',
    cyan: '#0891B2',
    emerald: '#059669',
    pink: '#ff167a',
  },
  // Semantic colors
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  warning: {
    main: '#F59E0B',
    light: '#FCD34D',
    dark: '#D97706',
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
  },
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
  },
};

// Shadow System - Multi-layer depth
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  glow: '0 0 20px rgba(255, 22, 122, 0.3)',
};

// Glass-morphism effects
export const glassEffects = {
  light: {
    background: alpha('#FFFFFF', 0.7),
    backdropFilter: 'blur(10px) saturate(180%)',
    border: `1px solid ${alpha('#FFFFFF', 0.18)}`,
  },
  dark: {
    background: alpha('#1C2128', 0.7),
    backdropFilter: 'blur(16px) saturate(180%)',
    border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
  },
  gradient: {
    background: `linear-gradient(135deg, ${alpha('#523091', 0.7)} 0%, ${alpha('#043f96', 0.7)} 100%)`,
    backdropFilter: 'blur(20px) saturate(200%)',
    border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
  },
};

// Spacing tokens
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

// Border radius tokens
export const borderRadius = {
  sm: '0.375rem',  // 6px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',
};

// Animation durations
export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
};

// Create enhanced theme factory
export const createEnhancedTheme = (mode: 'light' | 'dark', isArabic: boolean = false) => {
  const isDark = mode === 'dark';

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isDark ? '#60A5FA' : '#2E7D32',
        light: isDark ? '#93C5FD' : '#4CAF50',
        dark: isDark ? '#3B82F6' : '#1B5E20',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#A78BFA' : '#1976D2',
        light: isDark ? '#C4B5FD' : '#42A5F5',
        dark: isDark ? '#8B5CF6' : '#0D47A1',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? colorTokens.dark.primary : colorTokens.light.secondary,
        paper: isDark ? colorTokens.dark.tertiary : colorTokens.light.primary,
      },
      text: {
        primary: isDark ? '#F3F4F6' : '#111827',
        secondary: isDark ? '#9CA3AF' : '#6B7280',
      },
      success: colorTokens.success,
      warning: colorTokens.warning,
      error: colorTokens.error,
      info: colorTokens.info,
      divider: isDark ? alpha('#FFFFFF', 0.1) : alpha('#000000', 0.08),
    },
    typography: {
      fontFamily: isArabic
        ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", "Tajawal", "Cairo", sans-serif'
        : '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      h1: {
        fontSize: isArabic ? '3rem' : '2.75rem',
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: isArabic ? '0' : '-0.02em',
      },
      h2: {
        fontSize: isArabic ? '2.5rem' : '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: isArabic ? '0' : '-0.015em',
      },
      h3: {
        fontSize: isArabic ? '2rem' : '1.75rem',
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: isArabic ? '0' : '-0.01em',
      },
      h4: {
        fontSize: isArabic ? '1.625rem' : '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '0',
      },
      h5: {
        fontSize: isArabic ? '1.375rem' : '1.25rem',
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: '0',
      },
      h6: {
        fontSize: isArabic ? '1.125rem' : '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '0',
      },
      body1: {
        fontSize: isArabic ? '1.125rem' : '1rem',
        lineHeight: 1.6,
        letterSpacing: '0',
      },
      body2: {
        fontSize: isArabic ? '1rem' : '0.875rem',
        lineHeight: 1.55,
        letterSpacing: '0',
      },
      button: {
        fontSize: isArabic ? '1rem' : '0.875rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        textTransform: 'none',
      },
      caption: {
        fontSize: isArabic ? '0.875rem' : '0.75rem',
        lineHeight: 1.5,
        letterSpacing: '0',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      shadows.sm,
      shadows.base,
      shadows.md,
      shadows.lg,
      shadows.xl,
      shadows['2xl'],
      shadows.glass,
      shadows.glow,
      '0 10px 40px rgba(0,0,0,0.15)',
      '0 15px 50px rgba(0,0,0,0.2)',
      '0 20px 60px rgba(0,0,0,0.25)',
      '0 25px 70px rgba(0,0,0,0.3)',
      '0 30px 80px rgba(0,0,0,0.35)',
      '0 35px 90px rgba(0,0,0,0.4)',
      '0 40px 100px rgba(0,0,0,0.45)',
      '0 45px 110px rgba(0,0,0,0.5)',
      '0 50px 120px rgba(0,0,0,0.55)',
      '0 55px 130px rgba(0,0,0,0.6)',
      '0 60px 140px rgba(0,0,0,0.65)',
      '0 65px 150px rgba(0,0,0,0.7)',
      '0 70px 160px rgba(0,0,0,0.75)',
      '0 75px 170px rgba(0,0,0,0.8)',
      '0 80px 180px rgba(0,0,0,0.85)',
      '0 85px 190px rgba(0,0,0,0.9)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@import': [
            'url(https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap)',
            isArabic ? 'url(https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap)' : '',
          ].filter(Boolean).join(';'),
          body: {
            fontOpticalSizing: 'auto',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
          },
          '*': {
            boxSizing: 'border-box',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.base,
            textTransform: 'none',
            fontWeight: 500,
            padding: '10px 20px',
            boxShadow: 'none',
            transition: `all ${transitions.base} cubic-bezier(0.4, 0, 0.2, 1)`,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: shadows.md,
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: shadows.lg,
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.lg,
            boxShadow: isDark ? shadows.glass : shadows.md,
            border: isDark ? `1px solid ${alpha('#FFFFFF', 0.05)}` : `1px solid ${alpha('#000000', 0.05)}`,
            transition: `all ${transitions.base} cubic-bezier(0.4, 0, 0.2, 1)`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDark ? shadows.xl : shadows.lg,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: borderRadius.md,
          },
          elevation1: {
            boxShadow: shadows.sm,
          },
          elevation2: {
            boxShadow: shadows.base,
          },
          elevation3: {
            boxShadow: shadows.md,
          },
          elevation4: {
            boxShadow: shadows.lg,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.full,
            fontWeight: 500,
            height: '28px',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.full,
            height: '8px',
          },
          bar: {
            borderRadius: borderRadius.full,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.base,
              transition: `all ${transitions.base}`,
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? alpha('#FFFFFF', 0.3) : alpha('#000000', 0.3),
                },
              },
              '&.Mui-focused': {
                boxShadow: isDark
                  ? `0 0 0 3px ${alpha('#60A5FA', 0.2)}`
                  : `0 0 0 3px ${alpha('#2E7D32', 0.2)}`,
              },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: borderRadius.sm,
            fontSize: '0.875rem',
            padding: '8px 12px',
            backgroundColor: isDark ? alpha('#1C2128', 0.95) : alpha('#1F2937', 0.95),
            backdropFilter: 'blur(8px)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: borderRadius.md,
            padding: '12px 16px',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Export default themes
export const lightTheme = createEnhancedTheme('light', false);
export const darkTheme = createEnhancedTheme('dark', false);
export const lightThemeAr = createEnhancedTheme('light', true);
export const darkThemeAr = createEnhancedTheme('dark', true);
