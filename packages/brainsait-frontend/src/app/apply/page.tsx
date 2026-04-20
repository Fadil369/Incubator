'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  Business,
  CheckCircle,
  Send,
  ArrowForward,
  ArrowBack,
  Rocket,
  Groups,
  HealthAndSafety,
  LocalShipping,
  IntegrationInstructions,
  Devices,
} from '@mui/icons-material';
import { submitPartnerApplication } from '@/services/partnersService';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  country: string;
  partnerType: string;
  description: string;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  organization: '',
  country: '',
  partnerType: '',
  description: '',
};

const PARTNER_TYPES = [
  { value: 'sme', label: 'Healthcare SME Startup', icon: <HealthAndSafety />, description: 'Building digital health products for the Saudi market' },
  { value: 'tech', label: 'Technology Partner', icon: <Devices />, description: 'Providing technical infrastructure or platforms' },
  { value: 'health', label: 'Healthcare Provider', icon: <Groups />, description: 'Clinics, hospitals, or care networks seeking digital tools' },
  { value: 'dist', label: 'Distribution Partner', icon: <LocalShipping />, description: 'Reaching healthcare customers across the region' },
  { value: 'integ', label: 'Integration Partner', icon: <IntegrationInstructions />, description: 'Connecting systems through APIs and data standards' },
];

const COUNTRIES = [
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Jordan',
  'Egypt',
  'Lebanon',
  'Other',
];

const STEPS = ['Partnership Type', 'Your Details', 'Submit'];

/** Response time commitment shown to applicants (keep in sync with partner team SLA). */
const REVIEW_SLA = '5 business days';

/**
 * RFC 5321-aligned email validation.
 * Checks for non-empty local part, @ separator, domain with at least one dot,
 * and no whitespace. Covers the vast majority of real-world email addresses.
 */
function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    email
  );
}

function validate(form: FormData, step: number): string | null {
  if (step === 0 && !form.partnerType) return 'Please select a partnership type.';
  if (step === 1) {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.email.trim() || !isValidEmail(form.email.trim())) return 'A valid email is required.';
    if (!form.organization.trim()) return 'Organization name is required.';
    if (!form.country) return 'Please select your country.';
  }
  if (step === 2 && form.description.trim().length < 30) {
    return 'Please describe your partnership vision in at least 30 characters.';
  }
  return null;
}

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ applicationId: string; referenceId: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldError(null);
  }

  function handleNext() {
    const err = validate(form, step);
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError(null);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    setFieldError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitPartnerApplication(form);
      setResult({ applicationId: res.applicationId, referenceId: res.referenceId });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          <Avatar
            sx={{ width: 80, height: 80, bgcolor: 'success.main', mx: 'auto', mb: 3 }}
          >
            <CheckCircle sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Application Submitted! 🎉
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Thank you for applying to the BrainSAIT Incubator. We&apos;ll review your application and
            reach out via email within {REVIEW_SLA}.
          </Typography>
          <Card sx={{ mb: 4, textAlign: 'left' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
                Your Reference
              </Typography>
              <Typography variant="h6" fontFamily="monospace" color="primary.main">
                {result.referenceId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Keep this reference ID for tracking your application status.
              </Typography>
            </CardContent>
          </Card>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" href="/" endIcon={<ArrowForward />}>
              Back to Home
            </Button>
            <Button variant="outlined" href="/projects">
              Explore Projects
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  const selectedType = PARTNER_TYPES.find((t) => t.value === form.partnerType);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
            <Rocket />
          </Avatar>
          <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
            Apply to BrainSAIT Incubator
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto' }}>
            Join the leading healthcare innovation platform in the Arab world. Tell us about your
            organization and we&apos;ll be in touch within {REVIEW_SLA}.
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={step} sx={{ mb: 5 }} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {fieldError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {fieldError}
              </Alert>
            )}
            {submitError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {submitError}
              </Alert>
            )}

            {/* ── Step 0: Partner type ── */}
            {step === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  What type of partner are you?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Select the option that best describes your organization.
                </Typography>
                <Grid container spacing={2}>
                  {PARTNER_TYPES.map((type) => (
                    <Grid item xs={12} sm={6} key={type.value}>
                      <Card
                        component="button"
                        onClick={() => handleChange('partnerType', type.value)}
                        sx={{
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor:
                            form.partnerType === type.value ? 'primary.main' : 'divider',
                          bgcolor:
                            form.partnerType === type.value ? 'primary.light' : 'background.paper',
                          p: 2,
                          display: 'flex',
                          gap: 2,
                          alignItems: 'flex-start',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              form.partnerType === type.value ? 'primary.main' : 'action.selected',
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                          }}
                        >
                          {type.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {type.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                        {form.partnerType === type.value && (
                          <CheckCircle
                            sx={{ color: 'primary.main', ml: 'auto', flexShrink: 0 }}
                          />
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* ── Step 1: Details ── */}
            {step === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Your Details
                </Typography>
                {selectedType && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Chip
                      icon={<Business />}
                      label={selectedType.label}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      required
                      autoComplete="given-name"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      required
                      autoComplete="family-name"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Work Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Organization Name"
                      value={form.organization}
                      onChange={(e) => handleChange('organization', e.target.value)}
                      required
                      autoComplete="organization"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Country"
                      value={form.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      required
                    >
                      {COUNTRIES.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ── Step 2: Vision ── */}
            {step === 2 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Tell Us Your Vision
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Describe how you envision partnering with BrainSAIT to transform healthcare in the
                  Arab world. Be specific about your goals and what you hope to achieve.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Partnership Vision"
                  placeholder="e.g. We are building a FHIR-native claims management platform for Saudi clinics and want to integrate with NPHIES and leverage BrainSAIT's ecosystem to reach healthcare providers…"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  helperText={`${form.description.length} characters (minimum 30)`}
                />
                <Divider sx={{ my: 3 }} />
                {/* Summary */}
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Application Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    ['Partnership Type', selectedType?.label ?? form.partnerType],
                    ['Name', `${form.firstName} ${form.lastName}`],
                    ['Email', form.email],
                    ['Organization', form.organization],
                    ['Country', form.country],
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        py: 0.75,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ width: 140, flexShrink: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {label}
                      </Typography>
                      <Typography variant="body2">{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* ── Navigation ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                disabled={step === 0 || submitting}
              >
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={
                  submitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : step === STEPS.length - 1 ? (
                    <Send />
                  ) : (
                    <ArrowForward />
                  )
                }
                onClick={handleNext}
                disabled={submitting}
                sx={{ minWidth: 160 }}
              >
                {submitting
                  ? 'Submitting…'
                  : step === STEPS.length - 1
                  ? 'Submit Application'
                  : 'Continue'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
