'use client';

import React, { useState } from 'react';
import { Card, CardProps, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * AnimatedCard - Card with advanced animations inspired by Raycast
 * Features: Staggered entrance, 3D tilt, depth effects
 */

interface AnimatedCardProps extends CardProps {
  staggerDelay?: number;
  tiltEffect?: boolean;
  scaleOnHover?: boolean;
  glowOnHover?: boolean;
  depthEffect?: boolean;
}

const StyledAnimatedCard = styled(Card, {
  shouldForwardProp: (prop) =>
    !['staggerDelay', 'tiltEffect', 'scaleOnHover', 'glowOnHover', 'depthEffect'].includes(prop as string),
})<AnimatedCardProps & { isHovered?: boolean }>(
  ({ theme, staggerDelay = 0, tiltEffect, scaleOnHover, glowOnHover, depthEffect, isHovered }) => {
    const isDark = theme.palette.mode === 'dark';

    return {
      position: 'relative',
      borderRadius: theme.shape.borderRadius * 1.5,
      border: isDark
        ? `1px solid ${alpha('#FFFFFF', 0.08)}`
        : `1px solid ${alpha('#000000', 0.08)}`,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      transformStyle: 'preserve-3d',
      perspective: '1000px',

      // Staggered entrance animation
      animation: `fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${staggerDelay}ms both`,

      '@keyframes fadeInUp': {
        '0%': {
          opacity: 0,
          transform: 'translateY(30px) scale(0.95)',
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        },
      },

      // Hover effects
      ...(scaleOnHover && isHovered && {
        transform: 'translateY(-8px) scale(1.02)',
      }),

      ...(glowOnHover && isHovered && {
        boxShadow: isDark
          ? `0 20px 60px 0 ${alpha('#60A5FA', 0.3)}, 0 0 30px ${alpha('#60A5FA', 0.2)}`
          : `0 20px 60px 0 ${alpha('#2E7D32', 0.2)}`,
      }),

      // Depth effect with layered shadows
      ...(depthEffect && {
        boxShadow: isDark
          ? `0 4px 6px ${alpha('#000000', 0.1)},
             0 8px 16px ${alpha('#000000', 0.1)},
             0 16px 32px ${alpha('#000000', 0.1)},
             inset 0 1px 0 ${alpha('#FFFFFF', 0.05)}`
          : `0 4px 6px ${alpha('#000000', 0.05)},
             0 8px 16px ${alpha('#000000', 0.05)},
             0 16px 32px ${alpha('#000000', 0.05)}`,
      }),

      // Pseudo-element for highlight
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${alpha('#FFFFFF', isDark ? 0.1 : 0.5)}, transparent)`,
        borderRadius: 'inherit',
      },

      // Interactive glow border on hover
      ...(glowOnHover && isHovered && {
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-2px',
          borderRadius: 'inherit',
          background: `linear-gradient(135deg, ${alpha('#60A5FA', 0.5)}, ${alpha('#A78BFA', 0.5)})`,
          zIndex: -1,
          opacity: 0.6,
          filter: 'blur(8px)',
        },
      }),
    };
  }
);

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  staggerDelay = 0,
  tiltEffect = false,
  scaleOnHover = true,
  glowOnHover = false,
  depthEffect = true,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    setTiltStyle({});
    onMouseLeave?.(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tiltEffect && isHovered) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`,
      });
    }
    onMouseMove?.(e);
  };

  return (
    <StyledAnimatedCard
      staggerDelay={staggerDelay}
      tiltEffect={tiltEffect}
      scaleOnHover={scaleOnHover}
      glowOnHover={glowOnHover}
      depthEffect={depthEffect}
      isHovered={isHovered}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={tiltStyle}
      {...props}
    >
      {children}
    </StyledAnimatedCard>
  );
};

export default AnimatedCard;
