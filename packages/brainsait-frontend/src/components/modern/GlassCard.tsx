'use client';

import React from 'react';
import { Card, CardProps, alpha, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * GlassCard - Modern glass-morphism card component inspired by Raycast
 * Features: Backdrop blur, semi-transparent background, subtle borders
 */

interface GlassCardProps extends Omit<CardProps, 'variant'> {
  variant?: 'light' | 'dark' | 'gradient' | 'accent';
  intensity?: 'subtle' | 'medium' | 'strong';
  gradient?: 'purple' | 'blue' | 'pink' | 'emerald' | 'custom';
  customGradient?: string;
  hover?: boolean;
  glow?: boolean;
}

const StyledGlassCard = styled(Card, {
  shouldForwardProp: (prop) =>
    !['variant', 'intensity', 'gradient', 'customGradient', 'hover', 'glow'].includes(prop as string),
})<GlassCardProps>(({ theme, variant = 'light', intensity = 'medium', gradient, customGradient, hover, glow }) => {
  const isDark = theme.palette.mode === 'dark';

  // Glass effect intensities
  const blurAmount = {
    subtle: '8px',
    medium: '16px',
    strong: '24px',
  }[intensity];

  const opacityAmount = {
    subtle: 0.5,
    medium: 0.7,
    strong: 0.85,
  }[intensity];

  // Gradient backgrounds
  const gradientMap = {
    purple: `linear-gradient(135deg, ${alpha('#523091', 0.7)} 0%, ${alpha('#8B2D91', 0.7)} 100%)`,
    blue: `linear-gradient(135deg, ${alpha('#043f96', 0.7)} 0%, ${alpha('#0891B2', 0.7)} 100%)`,
    pink: `linear-gradient(135deg, ${alpha('#ff167a', 0.7)} 0%, ${alpha('#8B2D91', 0.7)} 100%)`,
    emerald: `linear-gradient(135deg, ${alpha('#059669', 0.7)} 0%, ${alpha('#0891B2', 0.7)} 100%)`,
    custom: customGradient || '',
  };

  // Base styles by variant
  const variantStyles = {
    light: {
      background: alpha('#FFFFFF', opacityAmount),
      border: `1px solid ${alpha('#FFFFFF', 0.18)}`,
    },
    dark: {
      background: alpha(isDark ? '#1C2128' : '#1F2937', opacityAmount),
      border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
    },
    gradient: {
      background: gradient ? gradientMap[gradient] : gradientMap.purple,
      border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
    },
    accent: {
      background: alpha(theme.palette.primary.main, 0.1),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    },
  };

  const selectedVariant = variantStyles[variant];

  return {
    position: 'relative',
    background: selectedVariant.background,
    backdropFilter: `blur(${blurAmount}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blurAmount}) saturate(180%)`,
    border: selectedVariant.border,
    borderRadius: theme.shape.borderRadius * 1.5,
    boxShadow: glow
      ? '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 20px rgba(255, 22, 122, 0.3)'
      : '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',

    // Hover effects
    ...(hover && {
      '&:hover': {
        transform: 'translateY(-4px) scale(1.01)',
        boxShadow: glow
          ? '0 12px 40px 0 rgba(31, 38, 135, 0.45), 0 0 30px rgba(255, 22, 122, 0.5)'
          : '0 12px 40px 0 rgba(31, 38, 135, 0.45)',
      },
    }),

    // Pseudo-element for additional glass effect
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: `linear-gradient(90deg, transparent, ${alpha('#FFFFFF', 0.2)}, transparent)`,
    },

    // Inner glow effect
    '&::after': glow ? {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: '1px',
      background: `linear-gradient(135deg, ${alpha('#ff167a', 0.3)}, ${alpha('#523091', 0.3)})`,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    } : {},
  };
});

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'light',
  intensity = 'medium',
  gradient = 'purple',
  customGradient,
  hover = true,
  glow = false,
  ...props
}) => {
  return (
    <StyledGlassCard
      variant={variant}
      intensity={intensity}
      gradient={gradient}
      customGradient={customGradient}
      hover={hover}
      glow={glow}
      {...props}
    >
      {children}
    </StyledGlassCard>
  );
};

export default GlassCard;
