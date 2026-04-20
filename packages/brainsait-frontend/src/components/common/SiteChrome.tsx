'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { ExpandMore, Menu as MenuIcon } from '@mui/icons-material';
import { usePathname } from 'next/navigation';

interface SiteChromeProps {
  children: React.ReactNode;
}

/** Primary links — always visible in the top bar */
const PRIMARY_NAV = [
  { label: 'Programs', href: '/apply' },
  { label: 'Mentorship', href: '/mentorship' },
  { label: 'Portal', href: '/portal' },
  { label: 'Partners', href: '/partners' },
];

/** Secondary links — grouped under "More" dropdown */
const MORE_NAV = [
  { label: 'Training Hub', href: '/training' },
  { label: 'Resources', href: '/resources' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'Projects', href: '/projects' },
  { label: 'App Store', href: '/app-store' },
];

/** All links flattened — used in the mobile drawer */
const ALL_NAV = [...PRIMARY_NAV, ...MORE_NAV];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname() ?? '/';
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [moreAnchor, setMoreAnchor] = React.useState<null | HTMLElement>(null);

  const moreActive = MORE_NAV.some((item) => isActivePath(pathname, item.href));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)',
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          backgroundColor: 'rgba(248, 250, 252, 0.88)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 60, gap: 1.5 }}>
            {/* Logo */}
            <Box
              component="a"
              href="/"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.25,
                mr: 'auto',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'white',
                  background: 'linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)',
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.20)',
                  letterSpacing: '-0.5px',
                }}
              >
                B
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{ lineHeight: 1, display: { xs: 'none', sm: 'block' }, letterSpacing: '-0.25px' }}
              >
                BrainSAIT
              </Typography>
            </Box>

            {/* Desktop primary nav */}
            <Stack direction="row" spacing={0.25} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              {PRIMARY_NAV.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Button
                    key={item.href}
                    component={NextLink}
                    href={item.href}
                    size="small"
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 999,
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.875rem',
                      color: active ? 'primary.main' : 'text.secondary',
                      backgroundColor: active ? 'rgba(46, 125, 50, 0.09)' : 'transparent',
                      '&:hover': { backgroundColor: 'rgba(46, 125, 50, 0.07)', color: 'primary.main' },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}

              {/* More dropdown */}
              <Button
                size="small"
                endIcon={<ExpandMore sx={{ fontSize: '1rem !important', transition: 'transform 0.2s', transform: moreAnchor ? 'rotate(180deg)' : 'none' }} />}
                onClick={(e) => setMoreAnchor(e.currentTarget)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  fontWeight: moreActive ? 700 : 500,
                  fontSize: '0.875rem',
                  color: moreActive ? 'primary.main' : 'text.secondary',
                  backgroundColor: moreActive ? 'rgba(46, 125, 50, 0.09)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(46, 125, 50, 0.07)', color: 'primary.main' },
                }}
              >
                More
              </Button>
              <Menu
                anchorEl={moreAnchor}
                open={Boolean(moreAnchor)}
                onClose={() => setMoreAnchor(null)}
                slotProps={{
                  paper: {
                    elevation: 4,
                    sx: { mt: 1, borderRadius: 2.5, minWidth: 180, overflow: 'hidden' },
                  },
                }}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
              >
                {MORE_NAV.map((item) => (
                  <MenuItem
                    key={item.href}
                    component={NextLink}
                    href={item.href}
                    onClick={() => setMoreAnchor(null)}
                    selected={isActivePath(pathname, item.href)}
                    sx={{ fontSize: '0.875rem', py: 1 }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </Stack>

            {/* CTA */}
            <Button
              variant="contained"
              component={NextLink}
              href="/apply"
              size="small"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                borderRadius: 999,
                px: 2.5,
                py: 0.75,
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: '0 4px 12px rgba(46,125,50,0.25)',
              }}
            >
              Apply Now
            </Button>

            {/* Mobile hamburger */}
            <IconButton
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              size="small"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, p: 2 }} role="presentation">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1, mb: 1 }}>
            <Box
              sx={{
                width: 30, height: 30, borderRadius: 1.5,
                background: 'linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)',
                display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem',
              }}
            >
              B
            </Box>
            <Typography variant="subtitle2" fontWeight={800}>BrainSAIT</Typography>
          </Box>
          <List dense>
            {ALL_NAV.map((item) => (
              <ListItemButton
                key={item.href}
                component={NextLink}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                selected={isActivePath(pathname, item.href)}
                sx={{ borderRadius: 2, mb: 0.25, py: 0.75 }}
              >
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActivePath(pathname, item.href) ? 700 : 500 }} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: 1.5 }} />
          <Button fullWidth variant="contained" component={NextLink} href="/apply" onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Apply Now
          </Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', backgroundColor: 'rgba(255,255,255,0.72)' }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              py: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>BrainSAIT LTD</Typography>
              <Typography variant="body2" color="text.secondary">
                Healthcare SME transformation, incubator programs, and applied training.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Button color="inherit" component={NextLink} href="/resources" size="small">Resources</Button>
              <Button color="inherit" component={NextLink} href="/app-store" size="small">App Store</Button>
              <Button color="inherit" component={NextLink} href="/training" size="small">Training Hub</Button>
              <Button color="inherit" component={NextLink} href="/showcase" size="small">Showcase</Button>
              <Button color="inherit" href="https://calendly.com/fadil369" target="_blank" rel="noopener noreferrer" size="small">
                Book Consultation
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
