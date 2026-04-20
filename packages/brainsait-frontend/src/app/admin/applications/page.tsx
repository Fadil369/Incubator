'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Search, CheckCircle, Cancel, Visibility, Refresh, Business, GitHub } from '@mui/icons-material';
import {
  listApplications,
  acceptApplication,
  rejectApplication,
  type PartnerApplication,
  type ApplicationStatus,
} from '@/services/partnersService';

const STATUS_COLORS: Record<ApplicationStatus, 'default' | 'warning' | 'success' | 'error' | 'primary'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'error',
  ONBOARDED: 'primary',
};

const PARTNER_TYPE_LABELS: Record<string, string> = {
  sme: 'Healthcare SME',
  tech: 'Technology',
  health: 'Healthcare',
  dist: 'Distribution',
  integ: 'Integration',
};

export default function AdminApplicationsPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<PartnerApplication | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  function notify(message: string, severity: 'success' | 'error') {
    setFeedback({ open: true, message, severity });
  }

  async function loadApplications() {
    setLoading(true);
    setError(null);
    try {
      const res = await listApplications(adminKey);
      setApplications(res.applications);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthenticate() {
    setLoading(true);
    try {
      await listApplications(adminKey);
      setAuthenticated(true);
      await loadApplications();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id: string) {
    setSubmitting(id);
    try {
      const res = await acceptApplication(adminKey, id);
      notify(res.message, 'success');
      await loadApplications();
      setSelected(null);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to accept', 'error');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReject(id: string) {
    setSubmitting(id);
    try {
      const res = await rejectApplication(adminKey, id);
      notify(res.message, 'success');
      await loadApplications();
      setSelected(null);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to reject', 'error');
    } finally {
      setSubmitting(null);
    }
  }

  const filtered = applications.filter((a) => {
    const matchesSearch =
      search === '' ||
      a.firstName.toLowerCase().includes(search.toLowerCase()) ||
      a.lastName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.organization.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusTab === 'ALL' || a.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    ALL: applications.length,
    PENDING: applications.filter((a) => a.status === 'PENDING').length,
    ACCEPTED: applications.filter((a) => a.status === 'ACCEPTED').length,
    REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
    ONBOARDED: applications.filter((a) => a.status === 'ONBOARDED').length,
  };

  // ── Auth Gate ───────────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mx: 'auto', mb: 3 }}>
            <Business sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h5" fontWeight={600} gutterBottom>Partner Applications Admin</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Enter your admin key to review and manage partner applications.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}
          <TextField
            fullWidth
            type="password"
            label="Admin Key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && adminKey) handleAuthenticate(); }}
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleAuthenticate}
            disabled={!adminKey || loading}
            startIcon={loading ? <CircularProgress size={18} /> : undefined}
          >
            {loading ? 'Verifying…' : 'Access Dashboard'}
          </Button>
        </Box>
      </Container>
    );
  }

  // ── Main Dashboard ──────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>Partner Applications</Typography>
            <Typography variant="body2" color="text.secondary">{applications.length} total applications</Typography>
          </Box>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadApplications} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {/* Stats row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {(['PENDING', 'ACCEPTED', 'ONBOARDED', 'REJECTED'] as const).map((status) => (
            <Grid item xs={6} sm={3} key={status}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h5" fontWeight={700}>{counts[status]}</Typography>
                  <Chip label={status} size="small" color={STATUS_COLORS[status]} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Filter bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name, email, or org…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 240 }}
          />
        </Box>

        {/* Status tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={statusTab}
            onChange={(_, v) => setStatusTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
          >
            {(['ALL', 'PENDING', 'ACCEPTED', 'ONBOARDED', 'REJECTED'] as const).map((s) => (
              <Tab key={s} label={`${s} (${counts[s] ?? applications.length})`} value={s} />
            ))}
          </Tabs>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                          {app.firstName[0]}{app.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{app.firstName} {app.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{app.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.organization}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={PARTNER_TYPE_LABELS[app.partnerType] ?? app.partnerType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{app.country}</TableCell>
                    <TableCell>
                      <Chip label={app.status} size="small" color={STATUS_COLORS[app.status]} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Button size="small" startIcon={<Visibility />} onClick={() => setSelected(app)}>
                          View
                        </Button>
                        {app.status === 'PENDING' && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              variant="contained"
                              startIcon={submitting === app.id ? <CircularProgress size={14} /> : <CheckCircle />}
                              onClick={() => handleAccept(app.id)}
                              disabled={submitting === app.id}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={submitting === app.id ? <CircularProgress size={14} /> : <Cancel />}
                              onClick={() => handleReject(app.id)}
                              disabled={submitting === app.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {(app.status === 'ACCEPTED' || app.status === 'ONBOARDED') && app.startupSlug && (
                          <Button size="small" variant="outlined" href={`/portal?startupId=${encodeURIComponent(app.startupSlug)}`}>
                            Portal
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No applications match your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Detail Dialog */}
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{selected.firstName[0]}{selected.lastName[0]}</Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{selected.firstName} {selected.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{selected.organization}</Typography>
                </Box>
                <Chip label={selected.status} size="small" color={STATUS_COLORS[selected.status]} sx={{ ml: 'auto' }} />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Divider sx={{ my: 1 }} />
              {[
                ['Email', selected.email],
                ['Organization', selected.organization],
                ['Country', selected.country],
                ['Partnership Type', PARTNER_TYPE_LABELS[selected.partnerType] ?? selected.partnerType],
                ['Reference', selected.referenceId],
                ['Applied', new Date(selected.createdAt).toLocaleString()],
                ...(selected.acceptedAt ? [['Accepted', new Date(selected.acceptedAt).toLocaleString()]] : []),
                ...(selected.onboardedAt ? [['Onboarded', new Date(selected.onboardedAt).toLocaleString()]] : []),
                ...(selected.startupSlug ? [['Startup Slug', selected.startupSlug]] : []),
                ...(selected.githubRepo ? [['GitHub Repo', selected.githubRepo]] : []),
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ width: 130, flexShrink: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                  <Typography variant="body2">{value}</Typography>
                </Box>
              ))}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Partnership Vision</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>{selected.description}</Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelected(null)}>Close</Button>
              {selected.status === 'PENDING' && (
                <>
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={submitting === selected.id ? <CircularProgress size={14} /> : <Cancel />}
                    onClick={() => handleReject(selected.id)}
                    disabled={submitting === selected.id}
                  >
                    Reject
                  </Button>
                  <Button
                    color="success"
                    variant="contained"
                    startIcon={submitting === selected.id ? <CircularProgress size={14} /> : <CheckCircle />}
                    onClick={() => handleAccept(selected.id)}
                    disabled={submitting === selected.id}
                  >
                    Accept & Send Invite
                  </Button>
                </>
              )}
              {(selected.status === 'ACCEPTED' || selected.status === 'ONBOARDED') && selected.startupSlug && (
                <Button variant="contained" href={`/portal?startupId=${encodeURIComponent(selected.startupSlug)}`}>
                  Open Portal
                </Button>
              )}
              {selected.githubRepo && (
                <Button
                  variant="outlined"
                  startIcon={<GitHub />}
                  href={`https://github.com/${selected.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repo
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={5000} onClose={() => setFeedback((f) => ({ ...f, open: false }))}>
        <Alert severity={feedback.severity} onClose={() => setFeedback((f) => ({ ...f, open: false }))}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
