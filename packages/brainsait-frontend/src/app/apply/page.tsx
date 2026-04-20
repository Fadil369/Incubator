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
  Alert,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Business,
  CheckCircle,
  Rocket,
  People,
  Analytics,
  ArrowForward,
  School,
  Send,
} from '@mui/icons-material';
import { submitPartnerApplication } from '@/services/partnersService';

const PARTNER_TYPES = [
  { value: 'tech', label: 'Technology Partner', description: 'Software, SaaS, or digital health platforms' },
  { value: 'health', label: 'Healthcare Provider', description: 'Hospitals, clinics, or healthcare networks' },
  { value: 'dist', label: 'Distribution Partner', description: 'Sales networks and regional distributors' },
  { value: 'integ', label: 'Integration Partner', description: 'System integrators and consulting firms' },
];

const COUNTRIES = [
  'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'Jordan', 'Egypt', 'Lebanon', 'Iraq', 'Other',
];

const BENEFITS = [
  { icon: <Rocket />, title: 'Incubation Program', description: 'Structured 6-month incubation with milestones and resources' },
  { icon: <People />, title: 'Dedicated Mentorship', description: 'Weekly 1-on-1 sessions with BrainSAIT domain experts' },
  { icon: <Business />, title: 'GitHub Workspace', description: 'Auto-provisioned repos, CI/CD pipelines, and templates' },
  { icon: <Analytics />, title: 'Analytics Dashboard', description: 'Real-time KPI tracking and growth metrics' },
  { icon: <School />, title: 'Training and Courses', description: 'Premium learning tracks available directly inside the BrainSAIT platform' },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  country: string;
  partnerType: string;
  description: string;
}

const EMPTY_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  organization: '',
  country: '',
  partnerType: '',
  description: '',
};

export default function ApplyPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [step, setStep] = useState<'form' | 'submitting' | 'success' | 'error'>('form');
  const [referenceId, setReferenceId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function setField<K extends keyof FormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'A valid email address is required';
    }
    if (!form.organization.trim()) errors.organization = 'Organization name is required';
    if (!form.country) errors.country = 'Please select your country';
    if (!form.partnerType) errors.partnerType = 'Please select a partnership type';
    if (!form.description.trim() || form.description.trim().length < 50) {
      errors.description = 'Please describe your partnership vision (at least 50 characters)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStep('submitting');
    try {
      const result = await submitPartnerApplication(form);
      setReferenceId(result.referenceId);
      setStep('success');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      setStep('error');
    }
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'success.main', mx: 'auto', mb: 3 }}>
            <CheckCircle sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>Application Submitted! 🎉</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Thank you for applying to the BrainSAIT Incubator. We&apos;ll review your application and
            reach out within 3–5 business days.
          </Typography>
          <Chip
            label={`Reference: ${referenceId}`}
            variant="outlined"
            sx={{ fontFamily: 'monospace', mb: 4 }}
          />
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Questions? Email us at{' '}
            <a href="mailto:partner@brainsait.org" style={{ color: 'inherit', fontWeight: 600 }}>
              partner@brainsait.org
            </a>
          </Typography>
          <Button variant="outlined" href="/">Return to Home</Button>
        </Box>
      </Container>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>{errorMessage}</Alert>
          <Button variant="contained" onClick={() => setStep('form')} sx={{ mr: 2 }}>
            Try Again
          </Button>
          <Button variant="outlined" href="mailto:partner@brainsait.org">
            Contact Support
          </Button>
        </Box>
      </Container>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label="Incubator program" color="primary" />
            <Chip label="Training module included" variant="outlined" />
          </Box>
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', mx: 'auto', mb: 3 }}>
            🧠
          </Avatar>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Join BrainSAIT Incubator
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto' }}>
            Apply to become a partner and unlock access to our healthcare incubation
            program, mentorship network, training courses, and digital transformation tools.
          </Typography>
        </Box>

        {/* Progress */}
        <Stepper activeStep={0} sx={{ mb: 6, maxWidth: 480, mx: 'auto' }}>
          {['Submit Application', 'Admin Review', 'Complete Onboarding', 'Access Portal'].map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={5}>
          {/* Left: Benefits */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              What You&apos;ll Get
            </Typography>
            <List disablePadding>
              {BENEFITS.map((b) => (
                <ListItem key={b.title} alignItems="flex-start" disableGutters sx={{ pb: 2 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.main' }}>
                      {b.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="subtitle2" fontWeight={600}>{b.title}</Typography>}
                    secondary={<Typography variant="body2" color="text.secondary">{b.description}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Right: Application form */}
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Partnership Application
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  All fields are required unless noted.
                </Typography>

                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={form.firstName}
                        onChange={(e) => setField('firstName', e.target.value)}
                        error={Boolean(fieldErrors.firstName)}
                        helperText={fieldErrors.firstName}
                        disabled={step === 'submitting'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={form.lastName}
                        onChange={(e) => setField('lastName', e.target.value)}
                        error={Boolean(fieldErrors.lastName)}
                        helperText={fieldErrors.lastName}
                        disabled={step === 'submitting'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Work Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        error={Boolean(fieldErrors.email)}
                        helperText={fieldErrors.email}
                        disabled={step === 'submitting'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Organization Name"
                        value={form.organization}
                        onChange={(e) => setField('organization', e.target.value)}
                        error={Boolean(fieldErrors.organization)}
                        helperText={fieldErrors.organization || 'Your startup or company name'}
                        disabled={step === 'submitting'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        select
                        label="Country"
                        value={form.country}
                        onChange={(e) => setField('country', e.target.value)}
                        error={Boolean(fieldErrors.country)}
                        helperText={fieldErrors.country}
                        disabled={step === 'submitting'}
                      >
                        {COUNTRIES.map((c) => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Partnership Type"
                      value={form.partnerType}
                      onChange={(e) => setField('partnerType', e.target.value)}
                      error={Boolean(fieldErrors.partnerType)}
                      helperText={fieldErrors.partnerType || 'Select the type that best describes your partnership'}
                      disabled={step === 'submitting'}
                    >
                      {PARTNER_TYPES.map((pt) => (
                        <MenuItem key={pt.value} value={pt.value}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{pt.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{pt.description}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Partnership Vision"
                      placeholder="Describe your startup, what problem you solve, and how you envision partnering with BrainSAIT (minimum 50 characters)…"
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      error={Boolean(fieldErrors.description)}
                      helperText={
                        fieldErrors.description ||
                        `${form.description.length} characters${form.description.length < 50 ? ` (${50 - form.description.length} more needed)` : ' ✓'}`
                      }
                      disabled={step === 'submitting'}
                    />
                  </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ mb: 1 }} />
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        endIcon={step === 'submitting' ? <CircularProgress size={18} color="inherit" /> : <Send />}
                        disabled={step === 'submitting'}
                        sx={{ py: 1.5 }}
                      >
                        {step === 'submitting' ? 'Submitting Application…' : 'Submit Application'}
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        After submission, our team will review your application within 3–5 business days.
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>

            {/* What happens next */}
            <Card sx={{ mt: 3, bgcolor: 'primary.light' }} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary.dark">
                  What happens next?
                </Typography>
                <Box component="ol" sx={{ pl: 2, m: 0 }}>
                  {[
                    'Our team reviews your application (3–5 business days)',
                    'If accepted, you receive a personalised invitation email with a magic link',
                    'Click the link to complete your onboarding profile',
                    'Your GitHub workspace and CI/CD pipelines are automatically provisioned',
                    'Access your incubator portal and start building!',
                  ].map((step, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.75 }}>
                      <Typography variant="body2" color="primary.dark">
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CTA row */}
        <Box sx={{ mt: 6, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Already have an invitation? Access your onboarding link directly.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" href="/portal/accept" endIcon={<ArrowForward />}>
              Complete Onboarding
            </Button>
            <Button variant="text" href="/training">
              Preview Training Hub
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
