'use client';

import React from 'react';
import { Box, BoxProps, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * GradientBackground - Animated gradient background inspired by Raycast
 */

interface GradientBackgroundProps extends BoxProps {
  variant?: 'mesh' | 'radial' | 'linear' | 'spotlight';
  animated?: boolean;
  intensity?: 'subtle' | 'medium' | 'strong';
}

const StyledGradientBackground = styled(Box, {
  shouldForwardProp: (prop) => !['variant', 'animated', 'intensity'].includes(prop as string),
})<GradientBackgroundProps>(({ theme, variant = 'mesh', animated, intensity = 'medium' }) => {
  const isDark = theme.palette.mode === 'dark';

  const opacityMap = {
    subtle: 0.3,
    medium: 0.5,
    strong: 0.7,
  };

  const opacity = opacityMap[intensity];

  // Gradient variants
  const gradientStyles = {
    mesh: {
      background: isDark
        ? `
          radial-gradient(at 40% 20%, ${alpha('#523091', opacity)} 0px, transparent 50%),
          radial-gradient(at 80% 0%, ${alpha('#043f96', opacity)} 0px, transparent 50%),
          radial-gradient(at 0% 50%, ${alpha('#8B2D91', opacity)} 0px, transparent 50%),
          radial-gradient(at 80% 50%, ${alpha('#0891B2', opacity)} 0px, transparent 50%),
          radial-gradient(at 0% 100%, ${alpha('#ff167a', opacity * 0.5)} 0px, transparent 50%),
          radial-gradient(at 80% 100%, ${alpha('#059669', opacity * 0.5)} 0px, transparent 50%)
        `
        : `
          radial-gradient(at 40% 20%, ${alpha('#E0E7FF', opacity)} 0px, transparent 50%),
          radial-gradient(at 80% 0%, ${alpha('#DBEAFE', opacity)} 0px, transparent 50%),
          radial-gradient(at 0% 50%, ${alpha('#F3E8FF', opacity)} 0px, transparent 50%),
          radial-gradient(at 80% 50%, ${alpha('#CFFAFE', opacity)} 0px, transparent 50%)
        `,
    },
    radial: {
      background: isDark
        ? `radial-gradient(circle at 50% 50%, ${alpha('#523091', opacity)} 0%, transparent 70%)`
        : `radial-gradient(circle at 50% 50%, ${alpha('#E0E7FF', opacity)} 0%, transparent 70%)`,
    },
    linear: {
      background: isDark
        ? `linear-gradient(135deg, ${alpha('#523091', opacity)} 0%, ${alpha('#043f96', opacity)} 50%, ${alpha('#0891B2', opacity)} 100%)`
        : `linear-gradient(135deg, ${alpha('#E0E7FF', opacity)} 0%, ${alpha('#DBEAFE', opacity)} 50%, ${alpha('#CFFAFE', opacity)} 100%)`,
    },
    spotlight: {
      background: isDark
        ? `
          radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            ${alpha('#60A5FA', opacity * 0.4)} 0%,
            transparent 80%)
        `
        : `
          radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            ${alpha('#DBEAFE', opacity)} 0%,
            transparent 80%)
        `,
    },
  };

  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
    ...gradientStyles[variant],

    // Animation
    ...(animated && {
      animation: 'gradient-shift 15s ease infinite',
      backgroundSize: '200% 200%',
      '@keyframes gradient-shift': {
        '0%': {
          backgroundPosition: '0% 50%',
        },
        '50%': {
          backgroundPosition: '100% 50%',
        },
        '100%': {
          backgroundPosition: '0% 50%',
        },
      },
    }),
  };
});

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'mesh',
  animated = true,
  intensity = 'medium',
  ...props
}) => {
  const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 });

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (variant === 'spotlight') {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    }
  }, [variant]);

  React.useEffect(() => {
    if (variant === 'spotlight') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [variant, handleMouseMove]);

  return (
    <StyledGradientBackground
      variant={variant}
      animated={animated}
      intensity={intensity}
      sx={{
        ...(variant === 'spotlight' && {
          '--mouse-x': `${mousePosition.x}%`,
          '--mouse-y': `${mousePosition.y}%`,
        }),
      }}
      {...props}
    />
  );
};

export default GradientBackground;
