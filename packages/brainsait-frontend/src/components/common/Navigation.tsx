'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useScrollTrigger,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home,
  Groups,
  FolderOpen,
  ContentCopy,
  Psychology,
  AdminPanelSettings,
} from '@mui/icons-material';

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  primary?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/', icon: <Home fontSize="small" /> },
  { label: 'Apply', href: '/apply', icon: <Groups fontSize="small" />, primary: true },
  { label: 'Projects', href: '/projects', icon: <FolderOpen fontSize="small" /> },
  { label: 'Templates', href: '/templates', icon: <ContentCopy fontSize="small" /> },
  { label: 'AI Dashboard', href: '/ai-dashboard', icon: <Psychology fontSize="small" /> },
];

function ElevationScroll({ children }: { children: React.ReactElement }) {
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0 });
  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
    sx: {
      ...(children.props.sx ?? {}),
      borderBottom: trigger ? 'none' : '1px solid',
      borderColor: 'divider',
      bgcolor: trigger ? 'background.paper' : 'background.paper',
      backdropFilter: trigger ? 'blur(8px)' : 'none',
    },
  });
}

export default function Navigation() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  return (
    <>
      <ElevationScroll>
        <AppBar position="sticky" color="default">
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 } }}>
              {/* Brand */}
              <Box
                component="a"
                href="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  flexGrow: { xs: 1, md: 0 },
                  mr: { md: 4 },
                }}
              >
                <Typography
                  component="span"
                  sx={{ fontSize: '1.5rem', lineHeight: 1 }}
                  aria-hidden="true"
                >
                  🧠
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: 'primary.main', letterSpacing: '-0.02em' }}
                >
                  BrainSAIT
                </Typography>
              </Box>

              {/* Desktop nav */}
              <Box
                component="nav"
                aria-label="Main navigation"
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 0.5,
                  flexGrow: 1,
                }}
              >
                {NAV_LINKS.map((link) =>
                  link.primary ? (
                    <Button
                      key={link.href}
                      href={link.href}
                      variant="contained"
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      {link.label}
                    </Button>
                  ) : (
                    <Button
                      key={link.href}
                      href={link.href}
                      color="inherit"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    >
                      {link.label}
                    </Button>
                  )
                )}
              </Box>

              {/* Admin link (desktop) */}
              <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Button
                  href="/admin/applications"
                  size="small"
                  color="inherit"
                  startIcon={<AdminPanelSettings fontSize="small" />}
                  sx={{ opacity: 0.6, fontWeight: 400, fontSize: '0.75rem' }}
                >
                  Admin
                </Button>
              </Box>

              {/* Mobile menu button */}
              <IconButton
                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={drawerOpen}
                onClick={toggleDrawer}
                sx={{ display: { md: 'none' } }}
              >
                {drawerOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>
      </ElevationScroll>

      {/* Mobile Drawer */}
      <Drawer
        anchor="top"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            top: { xs: 56, sm: 64 },
            boxShadow: 4,
          },
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Box
          role="navigation"
          aria-label="Mobile navigation"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDrawerOpen(false);
          }}
        >
          <List sx={{ py: 1 }}>
            {NAV_LINKS.map((link) => (
              <ListItem key={link.href} disablePadding>
                <ListItemButton
                  component="a"
                  href={link.href}
                  sx={{
                    px: 3,
                    py: 1.5,
                    ...(link.primary
                      ? { bgcolor: 'primary.main', color: 'primary.contrastText', mx: 2, my: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'primary.dark' } }
                      : {}),
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: link.primary ? 'primary.contrastText' : 'primary.main',
                    }}
                  >
                    {link.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={link.label}
                    primaryTypographyProps={{ fontWeight: link.primary ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton component="a" href="/admin/applications" sx={{ px: 3, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                  <AdminPanelSettings fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Admin"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
