/**
 * Authentication Layout
 * Shared layout for all authentication pages
 */

'use client';

import React from 'react';
import { Box, Container, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'url("/patterns/healthcare-pattern.svg")',
          backgroundRepeat: 'repeat',
          backgroundSize: '400px',
        }}
      />

      {/* Main Content */}
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: isMobile ? 120 : 150,
              height: isMobile ? 120 : 150,
              mb: 2,
              position: 'relative',
            }}
          >
            <Image
              src="/logo.svg"
              alt="BrainSAIT Logo"
              fill
              priority
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              mb: 1,
            }}
          >
            BrainSAIT
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            منصة التحول الرقمي للمنشآت الصحية الصغيرة والمتوسطة
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              mt: 0.5,
            }}
          >
            Healthcare SME Digital Transformation Platform
          </Typography>
        </Box>

        {/* Auth Form Container */}
        <Paper
          elevation={24}
          sx={{
            p: isMobile ? 3 : 4,
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          {children}
        </Paper>

        {/* Footer */}
        <Box
          sx={{
            mt: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            © 2025 BrainSAIT. جميع الحقوق محفوظة
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'block',
              mt: 0.5,
            }}
          >
            Built for Saudi Healthcare Entrepreneurs
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
