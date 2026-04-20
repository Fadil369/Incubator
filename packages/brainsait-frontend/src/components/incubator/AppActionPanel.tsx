'use client';

import React from 'react';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { AutoAwesome, Hub, RocketLaunch } from '@mui/icons-material';
import { createDataSubscription, dispatchIncubatorEvent } from '@/services/incubatorHubService';

interface AppActionPanelProps {
  appSlug: string;
  appName: string;
  appCategory: string;
  installEvent: string;
}

export default function AppActionPanel({ appSlug, appName, appCategory, installEvent }: AppActionPanelProps) {
  const [status, setStatus] = React.useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = React.useState<'install' | 'share' | null>(null);

  async function handleInstall() {
    setLoading('install');
    const ok = await dispatchIncubatorEvent(installEvent, {
      appSlug,
      appName,
      category: appCategory,
      requestedAt: new Date().toISOString(),
    });
    setStatus({
      severity: ok ? 'success' : 'error',
      message: ok
        ? `${appName} was queued for activation through the Cloudflare event bridge.`
        : `We could not queue ${appName} right now.`,
    });
    setLoading(null);
  }

  async function handleDataShare() {
    setLoading('share');
    const result = await createDataSubscription({
      source: `brainsait://apps/${appSlug}`,
      target: 'brainsait-incubator',
      contractRef: `${appSlug}-contract`,
      dataTypes: ['app-metadata', 'launch-assets', 'shared-course-linkage'],
    });

    const ok = await dispatchIncubatorEvent('app.data-share.requested', {
      appSlug,
      appName,
      subscriptionId: result.id,
      status: result.status,
    });

    setStatus({
      severity: ok ? 'success' : 'error',
      message: ok
        ? `Data sharing for ${appName} was queued with contract tracking.`
        : `The data-sharing request for ${appName} could not be confirmed.`,
    });
    setLoading(null);
  }

  return (
    <Box sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Chip icon={<RocketLaunch />} label="Workers event bridge" color="primary" />
        <Chip icon={<Hub />} label="Data hub subscription" variant="outlined" />
      </Stack>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Launch and integrate
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Activate this app through the incubator automation stack and, when relevant, request a governed data-sharing path for shared assets and partner collaboration.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" startIcon={<AutoAwesome />} onClick={handleInstall} disabled={loading !== null}>
          {loading === 'install' ? 'Queuing...' : 'Activate Workflow'}
        </Button>
        <Button variant="outlined" startIcon={<Hub />} onClick={handleDataShare} disabled={loading !== null}>
          {loading === 'share' ? 'Requesting...' : 'Request Data Share'}
        </Button>
      </Stack>
      {status && <Alert severity={status.severity} sx={{ mt: 2.5 }}>{status.message}</Alert>}
    </Box>
  );
}