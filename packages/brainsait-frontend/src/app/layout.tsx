'use client';

import { Box } from '@mui/material';
import { useParams } from 'next/navigation';
import React from 'react';
import { EnhancedThemeProvider } from '../providers/ThemeProvider';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const params = useParams();
  const locale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;

  return (
    <html lang={locale || 'en'}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="BrainSAIT Healthcare SME Digital Transformation Platform - Modern, AI-Powered Incubation" />
        <title>BrainSAIT Platform - Healthcare Innovation Accelerator</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {locale === 'ar' && (
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body>
        <EnhancedThemeProvider locale={locale} defaultMode="light">
          <Box sx={{ minHeight: '100vh' }}>
            {children}
          </Box>
        </EnhancedThemeProvider>
      </body>
    </html>
  );
}