'use client';

import React, { useEffect, useState, Suspense } from 'react';
import NextLink from 'next/link';
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
  GitHub,
  MailOutline,
} from '@mui/icons-material';
import {
  validateInviteToken,
  completeOnboarding,
  type PartnerApplication,
} from '@/services/partnersService';

const PARTNER_TYPE_LABELS: Record<string, string> = {
  sme: 'Healthcare SME Startup',
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

  const [step, setStep] = useState<'entry' | 'validating' | 'onboarding' | 'done' | 'error'>('validating');
  const [application, setApplication] = useState<PartnerApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [timezone, setTimezone] = useState(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''
  );
  const [linkedIn, setLinkedIn] = useState('');
  const [githubRepo, setGithubRepo] = useState<string | null>(null);

  function getPortalHref(startupSlug?: string) {
    return startupSlug ? `/portal?startupId=${encodeURIComponent(startupSlug)}` : '/projects';
  }

  useEffect(() => {
    if (!token || !appId) {
      setError(null);
      setStep('entry');
      return;
    }

    validateInviteToken(token, appId)
      .then(({ application: app }) => {
        setApplication(app);
        if (app.status === 'ONBOARDED') {
          // Already onboarded — send straight to portal
          router.replace(getPortalHref(app.startupSlug));
        } else {
          setStep('onboarding');
          if (app.githubRepo) setGithubRepo(app.githubRepo);
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
        router.push(getPortalHref(result.startupSlug));
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

  // ── Entry / no token yet ───────────────────────────────────────────────────
  if (step === 'entry') {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ p: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #1e1b4b 100%)', color: 'white' }}>
              <Chip icon={<MailOutline />} label="Invitation Required" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.14)', color: 'white' }} />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Complete onboarding from your email link
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 720 }}>
                This step is token-protected. Accepted partners receive a personalized link by email to validate their invitation and finish onboarding.
              </Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                If you have already been accepted, open the invitation email from BrainSAIT and continue from that link. If you are still applying, return to the partner application page.
              </Alert>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                  {
                    title: 'Check your acceptance email',
                    description: 'Look for the BrainSAIT invitation message sent to your work email after admin approval.',
                  },
                  {
                    title: 'Continue to the portal',
                    description: 'If your startup is already onboarded, use the portal entry page and projects directory to open your workspace.',
                  },
                  {
                    title: 'Need a new application?',
                    description: 'Start the partner workflow from the public application form if you have not been accepted yet.',
                  },
                ].map((item) => (
                  <Grid item xs={12} md={4} key={item.title}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button variant="contained" component={NextLink} href="/portal">
                  Open Portal Entry
                </Button>
                <Button variant="outlined" component={NextLink} href="/apply">
                  Apply to Program
                </Button>
                <Button variant="text" href="mailto:partner@brainsait.org">
                  Contact Partner Team
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
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
          <Button variant="outlined" component={NextLink} href="/partners">
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
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your incubator portal is ready. Redirecting you now…
          </Typography>
          {githubRepo && (
            <Button
              variant="outlined"
              startIcon={<GitHub />}
              href={`https://github.com/${githubRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open GitHub repository ${githubRepo} (opens in new window)`}
              sx={{ mb: 3 }}
            >
              Open Your GitHub Repo
            </Button>
          )}
          <Box>
            <CircularProgress size={32} />
          </Box>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimezone(e.target.value)}
                    placeholder="e.g. Asia/Riyadh"
                    helperText="Helps us schedule mentor sessions"
                  />
                  <TextField
                    fullWidth
                    label="LinkedIn Profile (optional)"
                    value={linkedIn}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkedIn(e.target.value)}
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
                    <Box>
                      <Typography variant="body2">
                        After submitting, you&apos;ll land on your personalised incubator dashboard with your
                        GitHub repos, CI/CD pipelines, program milestones, mentor schedule, and training hub.
                      </Typography>
                      <Button size="small" href="/training" sx={{ mt: 1, px: 0 }}>
                        Preview training hub
                      </Button>
                      {githubRepo && (
                        <Button
                          size="small"
                          startIcon={<GitHub />}
                          href={`https://github.com/${githubRepo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open GitHub repository ${githubRepo} (opens in new window)`}
                          sx={{ mt: 1, px: 0 }}
                        >
                          {githubRepo}
                        </Button>
                      )}
                    </Box>
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
