'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import {
  CheckCircle,
  Rocket,
  Business,
  ArrowForward,
} from '@mui/icons-material';
import {
  validateInviteToken,
  completeOnboarding,
  type PartnerApplication,
} from '@/services/partnersService';

const PARTNER_TYPE_LABELS: Record<string, string> = {
  tech: 'Technology Partner',
  health: 'Healthcare Provider',
  dist: 'Distribution Partner',
  integ: 'Integration Partner',
};

function PortalAcceptContent() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get('token') ?? '';
  const appId = params.get('app') ?? '';

  const [step, setStep] = useState<'validating' | 'onboarding' | 'done' | 'error'>('validating');
  const [application, setApplication] = useState<PartnerApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Extra profile fields
  const [timezone, setTimezone] = useState(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''
  );
  const [linkedIn, setLinkedIn] = useState('');

  useEffect(() => {
    if (!token || !appId) {
      setError('Invalid invitation link. Please check your email and try again.');
      setStep('error');
      return;
    }

    validateInviteToken(token, appId)
      .then(({ application: app }) => {
        setApplication(app);
        if (app.status === 'ONBOARDED') {
          // Already onboarded — send straight to portal
          router.replace(`/portal/${app.startupSlug}`);
        } else {
          setStep('onboarding');
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setStep('error');
      });
  }, [token, appId, router]);

  async function handleCompleteOnboarding() {
    if (!application) return;
    setSubmitting(true);
    try {
      const result = await completeOnboarding({ token, appId, timezone, linkedIn });
      setStep('done');
      // Brief celebration pause then redirect
      setTimeout(() => {
        router.push(`/portal/${result.startupSlug}`);
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onboarding failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Validating ──────────────────────────────────────────────────────────────
  if (step === 'validating') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={3}>
        <CircularProgress size={56} />
        <Typography variant="h6" color="text.secondary">Validating your invitation…</Typography>
      </Box>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            If you believe this is a mistake, please contact{' '}
            <a href="mailto:partner@brainsait.org" style={{ color: 'inherit' }}>partner@brainsait.org</a>.
          </Typography>
          <Button variant="outlined" href="https://brainsait.org/partners">
            Return to Partners Page
          </Button>
        </Box>
      </Container>
    );
  }

  // ── Done / celebration ──────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'success.main', mx: 'auto', mb: 3 }}>
            <CheckCircle sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>Welcome aboard! 🎉</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your incubator portal is ready. Redirecting you now…
          </Typography>
          <CircularProgress size={32} />
        </Box>
      </Container>
    );
  }

  // ── Onboarding form ─────────────────────────────────────────────────────────
  if (!application) return null;

  const partnerTypeLabel = PARTNER_TYPE_LABELS[application.partnerType] ?? application.partnerType;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'success.light',
              color: 'success.dark',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CheckCircle fontSize="small" />
            <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing={1}>
              Application Accepted
            </Typography>
          </Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Welcome to BrainSAIT Incubator
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete your onboarding below to unlock your personalized portal.
          </Typography>
        </Box>

        {/* Progress */}
        <Stepper activeStep={1} sx={{ mb: 5 }}>
          {['Application Submitted', 'Accepted — Complete Onboarding', 'Access Your Portal'].map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={4}>
          {/* Left: Application summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" gutterBottom>
                  Your Application
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>{application.organization}</Typography>
                    <Typography variant="caption" color="text.secondary">{application.country}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">Partnership type</Typography>
                <br />
                <Chip label={partnerTypeLabel} size="small" color="primary" sx={{ mt: 0.5, mb: 1.5 }} />
                <br />
                <Typography variant="caption" color="text.secondary">Reference</Typography>
                <Typography variant="body2" fontFamily="monospace">{application.referenceId}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Onboarding form */}
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Complete Your Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  A few final details to personalise your incubator experience.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    value={`${application.firstName} ${application.lastName}`}
                    disabled
                    helperText="From your application"
                  />
                  <TextField
                    fullWidth
                    label="Work Email"
                    value={application.email}
                    disabled
                    helperText="From your application"
                  />
                  <TextField
                    fullWidth
                    label="Timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="e.g. Asia/Riyadh"
                    helperText="Helps us schedule mentor sessions"
                  />
                  <TextField
                    fullWidth
                    label="LinkedIn Profile (optional)"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    placeholder="https://linkedin.com/in/your-name"
                  />

                  <Box sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    p: 2,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                  }}>
                    <Rocket sx={{ mt: 0.25, flexShrink: 0 }} />
                    <Typography variant="body2">
                      After submitting, you&apos;ll land on your personalised incubator dashboard with your
                      GitHub repos, CI/CD pipelines, program milestones, and mentor schedule.
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                    onClick={handleCompleteOnboarding}
                    disabled={submitting}
                    sx={{ mt: 1 }}
                  >
                    {submitting ? 'Setting up your portal…' : 'Complete Onboarding & Access Portal'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default function PortalAcceptPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      }
    >
      <PortalAcceptContent />
    </Suspense>
  );
}
