'use client';

import React from 'react';
import { Grid, GridProps } from '@mui/material';

/**
 * StaggeredGrid - Grid layout with staggered entrance animations
 * Inspired by Raycast's animation patterns
 */

interface StaggeredGridProps extends GridProps {
  staggerDelay?: number;
  children: React.ReactNode;
}

export const StaggeredGrid: React.FC<StaggeredGridProps> = ({
  staggerDelay = 100,
  children,
  ...props
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <Grid container {...props}>
      {childArray.map((child, index) => (
        <Grid
          item
          key={index}
          sx={{
            animation: `fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * staggerDelay}ms both`,
            '@keyframes fadeInUp': {
              '0%': {
                opacity: 0,
                transform: 'translateY(30px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

export default StaggeredGrid;
