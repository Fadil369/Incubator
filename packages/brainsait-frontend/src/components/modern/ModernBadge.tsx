'use client';

import React from 'react';
import { Chip, ChipProps, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * ModernBadge - Enhanced badge/chip component with gradients and animations
 */

interface ModernBadgeProps extends Omit<ChipProps, 'variant'> {
  variant?: 'solid' | 'outlined' | 'glass' | 'gradient';
  gradient?: 'purple' | 'blue' | 'pink' | 'emerald';
  glow?: boolean;
  pulse?: boolean;
}

const StyledModernBadge = styled(Chip, {
  shouldForwardProp: (prop) => !['variant', 'gradient', 'glow', 'pulse'].includes(prop as string),
})<ModernBadgeProps>(({ theme, variant = 'solid', gradient = 'purple', glow, pulse }) => {
  const isDark = theme.palette.mode === 'dark';

  // Gradient definitions
  const gradients = {
    purple: 'linear-gradient(135deg, #523091 0%, #8B2D91 100%)',
    blue: 'linear-gradient(135deg, #043f96 0%, #0891B2 100%)',
    pink: 'linear-gradient(135deg, #ff167a 0%, #8B2D91 100%)',
    emerald: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
  };

  // Glow colors
  const glowColors = {
    purple: alpha('#523091', 0.5),
    blue: alpha('#043f96', 0.5),
    pink: alpha('#ff167a', 0.5),
    emerald: alpha('#059669', 0.5),
  };

  // Base styles by variant
  const variantStyles = {
    solid: {
      backgroundColor: theme.palette.primary.main,
      color: '#FFFFFF',
      border: 'none',
    },
    outlined: {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      border: `1.5px solid ${theme.palette.primary.main}`,
    },
    glass: {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      color: theme.palette.primary.main,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
    gradient: {
      background: gradients[gradient],
      color: '#FFFFFF',
      border: 'none',
    },
  };

  return {
    ...variantStyles[variant],
    height: '30px',
    padding: '4px 14px',
    borderRadius: '9999px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

    // Glow effect
    ...(glow && {
      boxShadow: `0 0 16px ${variant === 'gradient' ? glowColors[gradient] : alpha(theme.palette.primary.main, 0.5)}`,
    }),

    // Pulse animation
    ...(pulse && {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      '@keyframes pulse': {
        '0%, 100%': {
          opacity: 1,
        },
        '50%': {
          opacity: 0.7,
        },
      },
    }),

    // Hover effects
    '&:hover': {
      transform: 'scale(1.05)',
      ...(glow && {
        boxShadow: `0 0 24px ${variant === 'gradient' ? glowColors[gradient] : alpha(theme.palette.primary.main, 0.7)}`,
      }),
    },

    // Label styles
    '& .MuiChip-label': {
      padding: '0 4px',
      fontWeight: 600,
    },
  };
});

export const ModernBadge: React.FC<ModernBadgeProps> = ({
  variant = 'solid',
  gradient = 'purple',
  glow = false,
  pulse = false,
  ...props
}) => {
  return (
    <StyledModernBadge
      variant={variant}
      gradient={gradient}
      glow={glow}
      pulse={pulse}
      {...props}
    />
  );
};

export default ModernBadge;
