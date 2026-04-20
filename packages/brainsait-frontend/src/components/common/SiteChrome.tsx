'use client';

import React from 'react';
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
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { usePathname } from 'next/navigation';

interface SiteChromeProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Apply', href: '/apply' },
  { label: 'Projects', href: '/projects' },
  { label: 'Training', href: '/training' },
  { label: 'Portal', href: '/portal/accept' },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname() ?? '/';
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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
          backgroundColor: 'rgba(248, 250, 252, 0.84)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 76, gap: 2 }}>
            <Box
              component="a"
              href="/"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                mr: 'auto',
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  color: 'white',
                  background: 'linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)',
                  boxShadow: '0 10px 24px rgba(25, 118, 210, 0.22)',
                }}
              >
                B
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                  BrainSAIT
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Incubator Platform
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {NAV_ITEMS.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Button
                    key={item.href}
                    href={item.href}
                    color="inherit"
                    sx={{
                      px: 1.75,
                      py: 1,
                      borderRadius: 999,
                      fontWeight: active ? 700 : 500,
                      color: active ? 'primary.main' : 'text.secondary',
                      backgroundColor: active ? 'rgba(46, 125, 50, 0.10)' : 'transparent',
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>

            <Button
              variant="contained"
              href="/training"
              sx={{ display: { xs: 'none', md: 'inline-flex' }, borderRadius: 999 }}
            >
              Explore Training
            </Button>

            <IconButton
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 1.5, py: 1 }}>
            Navigation
          </Typography>
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.href}
                component="a"
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                selected={isActivePath(pathname, item.href)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Button fullWidth variant="contained" href="/training" onClick={() => setDrawerOpen(false)}>
            Explore Training
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
              py: 4,
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Button color="inherit" href="/training">Training Hub</Button>
              <Button color="inherit" href="/projects">Projects</Button>
              <Button color="inherit" href="https://calendly.com/fadil369" target="_blank" rel="noopener noreferrer">
                Book Consultation
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}