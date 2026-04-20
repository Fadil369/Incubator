'use client';

import React from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { AutoAwesome, Hub, MenuBook, School } from '@mui/icons-material';
import type { ResourceLibraryPayload, SharedDataContract } from '@/services/incubatorHubService';
import { createDataSubscription, dispatchIncubatorEvent, getResourceLibrary } from '@/services/incubatorHubService';

export default function ResourceLibraryClient() {
  const [payload, setPayload] = React.useState<ResourceLibraryPayload | null>(null);
  const [status, setStatus] = React.useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [loadingContract, setLoadingContract] = React.useState<string | null>(null);

  React.useEffect(() => {
    getResourceLibrary().then(setPayload);
  }, []);

  async function handleContractRequest(contract: SharedDataContract) {
    setLoadingContract(contract.slug);
    const subscription = await createDataSubscription({
      source: contract.dataSource,
      target: 'brainsait-incubator',
      contractRef: contract.slug,
      dataTypes: ['resource-library', 'shared-course', 'partner-data'],
    });
    const ok = await dispatchIncubatorEvent('data-share.requested', {
      contract: contract.slug,
      source: contract.dataSource,
      subscriptionId: subscription.id,
    });
    setStatus({
      severity: ok ? 'success' : 'error',
      message: ok
        ? `${contract.title} was queued for contract review in the data-sharing flow.`
        : `${contract.title} could not be queued for data-sharing review.`,
    });
    setLoadingContract(null);
  }

  if (!payload) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  const featuredCourse = payload.courses[0] || null;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Typography color="text.primary">Resources Library</Typography>
        </Breadcrumbs>

        <Card sx={{ borderRadius: 5, overflow: 'hidden', mb: 5, background: 'linear-gradient(135deg, #08131f 0%, #102745 55%, #16547e 100%)', color: 'white' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip icon={<MenuBook />} label="Shared library" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white' }} />
              <Chip icon={<Hub />} label="Data sharing ready" sx={{ bgcolor: 'rgba(46,125,50,0.18)', color: '#b9f6ca' }} />
            </Stack>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', maxWidth: 860, mb: 2 }}>
              Templates, workshops, contracts, and the first shared BrainSAIT course pack.
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 780, fontWeight: 400, mb: 3 }}>
              This route merges the Stitch resource-library screens into a governed content surface tied to the Cloudflare data hub, shared contracts, and course distribution.
            </Typography>
            {featuredCourse && (
              <Button variant="contained" href={`/training/courses/${featuredCourse.slug}`} startIcon={<School />}>
                Open Shared Course Bundle
              </Button>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {payload.resources.map((resource) => (
            <Grid item xs={12} md={6} lg={4} key={resource.slug}>
              <Card sx={{ height: '100%', borderRadius: 4 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                    <Chip label={resource.category} size="small" />
                    <Chip label={resource.type} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {resource.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    {resource.summary}
                  </Typography>
                  <Button href={resource.ctaHref}>{resource.ctaLabel}</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                {featuredCourse ? (
                  <>
                    <Chip icon={<AutoAwesome />} label="Shared first-built course" color="primary" sx={{ mb: 2 }} />
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                      {featuredCourse.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {featuredCourse.summary}
                    </Typography>
                    <Grid container spacing={2}>
                      {featuredCourse.resourceSlugs.map((resourceSlug) => {
                        const resource = payload.resources.find((item) => item.slug === resourceSlug);
                        if (!resource) return null;
                        return (
                          <Grid item xs={12} sm={6} key={resource.slug}>
                            <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                {resource.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {resource.summary}
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </>
                ) : (
                  <>
                    <Chip icon={<AutoAwesome />} label="Course bundle pending" color="default" sx={{ mb: 2 }} />
                    <Typography variant="h5" fontWeight={800} gutterBottom>
                      Shared course bundle will appear here.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      The resource library is live even when the course payload has not been published yet. Contracts and workshop access remain available.
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Upcoming workshops
                </Typography>
                <Stack spacing={2}>
                  {payload.workshops.map((workshop) => (
                    <Box key={workshop.slug} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        {workshop.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {workshop.summary}
                      </Typography>
                      <Button href={workshop.registrationHref}>Register</Button>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Shared data contracts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              These contracts connect the resource library and shared course bundle to the data-hub flow for partner access and governed collaboration.
            </Typography>
            <Grid container spacing={2}>
              {payload.sharedContracts.map((contract) => (
                <Grid item xs={12} md={6} key={contract.slug}>
                  <Box sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip label={contract.accessLevel} size="small" />
                      <Chip label={contract.dataSource} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {contract.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {contract.summary}
                    </Typography>
                    <Button onClick={() => handleContractRequest(contract)} disabled={loadingContract === contract.slug}>
                      {loadingContract === contract.slug ? 'Queuing...' : contract.ctaLabel}
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {status && <Alert severity={status.severity} sx={{ mt: 3 }}>{status.message}</Alert>}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}