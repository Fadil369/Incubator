'use client';

import React from 'react';
import { Button, ButtonProps, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * GradientButton - Modern gradient button with Raycast-inspired styling
 * Features: Gradient backgrounds, hover effects, glow effects
 */

interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  gradient?: 'purple' | 'blue' | 'pink' | 'emerald' | 'primary' | 'secondary';
  glow?: boolean;
  elevation?: boolean;
}

const StyledGradientButton = styled(Button, {
  shouldForwardProp: (prop) => !['gradient', 'glow', 'elevation'].includes(prop as string),
})<GradientButtonProps>(({ theme, gradient = 'primary', glow, elevation }) => {
  // Gradient definitions
  const gradients = {
    purple: 'linear-gradient(135deg, #523091 0%, #8B2D91 100%)',
    blue: 'linear-gradient(135deg, #043f96 0%, #0891B2 100%)',
    pink: 'linear-gradient(135deg, #ff167a 0%, #8B2D91 100%)',
    emerald: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    primary: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    secondary: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
  };

  const selectedGradient = gradients[gradient];

  // Glow colors
  const glowColors = {
    purple: 'rgba(82, 48, 145, 0.5)',
    blue: 'rgba(4, 63, 150, 0.5)',
    pink: 'rgba(255, 22, 122, 0.5)',
    emerald: 'rgba(5, 150, 105, 0.5)',
    primary: alpha(theme.palette.primary.main, 0.5),
    secondary: alpha(theme.palette.secondary.main, 0.5),
  };

  return {
    background: selectedGradient,
    color: '#FFFFFF',
    fontWeight: 600,
    padding: '12px 28px',
    borderRadius: theme.shape.borderRadius,
    border: 'none',
    boxShadow: elevation
      ? '0 4px 14px 0 rgba(0, 0, 0, 0.15)'
      : 'none',
    textTransform: 'none',
    fontSize: '0.9375rem',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

    // Hover effects
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: glow
        ? `0 8px 24px 0 ${glowColors[gradient]}, 0 0 20px ${glowColors[gradient]}`
        : '0 8px 24px 0 rgba(0, 0, 0, 0.2)',
      '&::before': {
        opacity: 1,
      },
    },

    // Active state
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.2)',
    },

    // Disabled state
    '&:disabled': {
      background: alpha(theme.palette.action.disabled, 0.12),
      color: theme.palette.action.disabled,
      boxShadow: 'none',
    },

    // Shine effect on hover
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, transparent, ${alpha('#FFFFFF', 0.2)}, transparent)`,
      transition: 'left 0.5s ease',
      opacity: 0,
    },

    '&:hover::before': {
      left: '100%',
      opacity: 1,
    },
  };
});

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  gradient = 'primary',
  glow = false,
  elevation = true,
  ...props
}) => {
  return (
    <StyledGradientButton
      gradient={gradient}
      glow={glow}
      elevation={elevation}
      {...props}
    >
      {children}
    </StyledGradientButton>
  );
};

export default GradientButton;
