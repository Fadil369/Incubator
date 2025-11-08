'use client';

import React from 'react';
import { IconButton, Tooltip, alpha } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeMode } from '../../providers/ThemeProvider';
import { styled } from '@mui/material/styles';

/**
 * ThemeToggle - Button to switch between light and dark modes
 */

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  padding: '10px',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'rotate(180deg)',
  },
}));

export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      <StyledIconButton onClick={toggleMode} color="inherit" aria-label="toggle theme">
        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
      </StyledIconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
