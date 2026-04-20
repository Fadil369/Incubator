'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useParams, usePathname } from 'next/navigation';
import React from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import type { StylisPlugin } from '@emotion/cache';
import SiteChrome from '@/components/common/SiteChrome';

interface RootLayoutProps {
  children: React.ReactNode;
}

// Create RTL cache for Arabic support
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer as StylisPlugin, rtlPlugin as unknown as StylisPlugin],
});

const cacheLtr = createCache({
  key: 'muiltr',
});

export default function RootLayout({ children }: RootLayoutProps) {
  const params = useParams();
  const pathname = usePathname() ?? '/';
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const isArabic = locale === 'ar';
  const useSiteChrome = pathname !== '/';

  // Create theme with RTL support and Arabic typography
  const theme = createTheme({
    direction: isArabic ? 'rtl' : 'ltr',
    palette: {
      primary: {
        main: '#2E7D32', // BrainSAIT Green
        light: '#4CAF50',
        dark: '#1B5E20',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#1976D2', // BrainSAIT Blue
        light: '#42A5F5',
        dark: '#0D47A1',
        contrastText: '#ffffff',
      },
      background: {
        default: '#F8F9FA',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#212121',
        secondary: '#757575',
      },
      success: {
        main: '#388E3C',
        light: '#66BB6A',
        dark: '#2E7D32',
      },
      warning: {
        main: '#F57C00',
        light: '#FFB74D',
        dark: '#E65100',
      },
      error: {
        main: '#D32F2F',
        light: '#EF5350',
        dark: '#C62828',
      },
      info: {
        main: '#1976D2',
        light: '#64B5F6',
        dark: '#1565C0',
      },
    },
    typography: {
      fontFamily: isArabic 
        ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", "Tajawal", "Cairo", "Roboto", sans-serif'
        : '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
      h1: {
        fontSize: isArabic ? '2.75rem' : '2.5rem',
        fontWeight: isArabic ? 700 : 600,
        lineHeight: isArabic ? 1.1 : 1.2,
        letterSpacing: isArabic ? '0' : '-0.01562em',
      },
      h2: {
        fontSize: isArabic ? '2.25rem' : '2rem',
        fontWeight: isArabic ? 700 : 600,
        lineHeight: isArabic ? 1.15 : 1.3,
        letterSpacing: isArabic ? '0' : '-0.00833em',
      },
      h3: {
        fontSize: isArabic ? '1.75rem' : '1.5rem',
        fontWeight: isArabic ? 600 : 600,
        lineHeight: isArabic ? 1.2 : 1.4,
        letterSpacing: isArabic ? '0' : '0em',
      },
      h4: {
        fontSize: isArabic ? '1.5rem' : '1.25rem',
        fontWeight: isArabic ? 600 : 500,
        lineHeight: isArabic ? 1.25 : 1.4,
        letterSpacing: isArabic ? '0' : '0.00735em',
      },
      h5: {
        fontSize: isArabic ? '1.25rem' : '1.125rem',
        fontWeight: isArabic ? 500 : 500,
        lineHeight: isArabic ? 1.3 : 1.4,
        letterSpacing: isArabic ? '0' : '0em',
      },
      h6: {
        fontSize: isArabic ? '1.125rem' : '1rem',
        fontWeight: isArabic ? 500 : 500,
        lineHeight: isArabic ? 1.35 : 1.6,
        letterSpacing: isArabic ? '0' : '0.0075em',
      },
      body1: {
        fontSize: isArabic ? '1.125rem' : '1rem',
        fontWeight: isArabic ? 400 : 400,
        lineHeight: isArabic ? 1.7 : 1.6,
        letterSpacing: isArabic ? '0' : '0.00938em',
      },
      body2: {
        fontSize: isArabic ? '1rem' : '0.875rem',
        fontWeight: isArabic ? 400 : 400,
        lineHeight: isArabic ? 1.65 : 1.6,
        letterSpacing: isArabic ? '0' : '0.01071em',
      },
      button: {
        fontSize: isArabic ? '1rem' : '0.875rem',
        fontWeight: isArabic ? 500 : 500,
        letterSpacing: isArabic ? '0' : '0.02857em',
        textTransform: 'none',
      },
      caption: {
        fontSize: isArabic ? '0.875rem' : '0.75rem',
        fontWeight: isArabic ? 400 : 400,
        lineHeight: isArabic ? 1.5 : 1.66,
        letterSpacing: isArabic ? '0' : '0.03333em',
      },
      overline: {
        fontSize: isArabic ? '0.875rem' : '0.75rem',
        fontWeight: isArabic ? 500 : 400,
        letterSpacing: isArabic ? '0' : '0.08333em',
        textTransform: isArabic ? 'none' : 'uppercase',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            direction: isArabic ? 'rtl' : 'ltr',
            fontOpticalSizing: 'auto',
            fontKerning: 'normal',
            fontFeatureSettings: isArabic ? '"kern" 1, "liga" 1, "calt" 1' : 'normal',
          },
          '@font-face': isArabic ? [
            {
              fontFamily: 'Noto Sans Arabic',
              fontStyle: 'normal',
              fontWeight: 400,
              src: 'url(https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap)',
            }
          ] : [],
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              direction: isArabic ? 'rtl' : 'ltr',
            },
            '& .MuiInputBase-input': {
              textAlign: isArabic ? 'right' : 'left',
              fontFamily: isArabic 
                ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", sans-serif'
                : 'inherit',
            },
            '& .MuiInputLabel-root': {
              transformOrigin: isArabic ? 'top right' : 'top left',
              right: isArabic ? 14 : 'auto',
              left: isArabic ? 'auto' : 14,
            },
            '& .MuiInputLabel-shrink': {
              transform: isArabic 
                ? 'translate(-14px, -9px) scale(0.75)' 
                : 'translate(14px, -9px) scale(0.75)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: isArabic 
              ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", sans-serif'
              : 'inherit',
            borderRadius: 8,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          },
          startIcon: {
            marginRight: isArabic ? 0 : 8,
            marginLeft: isArabic ? 8 : 0,
          },
          endIcon: {
            marginLeft: isArabic ? 0 : 8,
            marginRight: isArabic ? 8 : 0,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.05)',
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: {
            textAlign: isArabic ? 'right' : 'left',
            '& .MuiCardHeader-title': {
              fontFamily: isArabic 
                ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", sans-serif'
                : 'inherit',
              fontWeight: isArabic ? 600 : 500,
            },
            '& .MuiCardHeader-subheader': {
              fontFamily: isArabic 
                ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", sans-serif'
                : 'inherit',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontFamily: isArabic 
              ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", sans-serif'
              : 'inherit',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: isArabic 
              ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", sans-serif'
              : 'inherit',
            borderRadius: 16,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontFamily: isArabic 
              ? '"Noto Sans Arabic", "IBM Plex Sans Arabic", sans-serif'
              : 'inherit',
            fontSize: isArabic ? '0.875rem' : '0.75rem',
            borderRadius: 6,
          },
        },
      },
    },
  });

  return (
    <html lang={locale || 'en'} dir={isArabic ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="BrainSAIT — AI-native healthcare SME incubator for Saudi Arabia & MENA. NPHIES compliance, FHIR R4 SDKs, mentorship, and acceleration programs." />
        <meta name="keywords" content="healthcare incubator, BrainSAIT, Saudi Arabia, NPHIES, FHIR, digital health, AI healthcare" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#2E7D32" />
        <meta property="og:site_name" content="BrainSAIT" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={isArabic ? 'ar_SA' : 'en_US'} />
        <title>BrainSAIT — Healthcare SME Incubator</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://brainsait.org" />
        {isArabic && (
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body>
        <CacheProvider value={isArabic ? cacheRtl : cacheLtr}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {useSiteChrome ? <SiteChrome>{children}</SiteChrome> : children}
          </ThemeProvider>
        </CacheProvider>
      </body>
    </html>
  );
}