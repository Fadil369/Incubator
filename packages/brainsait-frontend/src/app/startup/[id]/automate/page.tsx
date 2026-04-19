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
  Switch,
  FormControlLabel,
  Alert,
  Breadcrumbs,
  Link,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ExpandMore,
  ContentCopy,
  PlayArrow,
  Rocket,
  AutoAwesome,
  GitHub,
  Apps,
  Code,
  CheckCircle,
} from '@mui/icons-material';
import {
  listTemplates,
  listWorkflows,
  createRepoFromTemplate,
  triggerWorkflow,
  requestAppInstall,
  listStartupRepos,
  type RepoTemplate,
  type GitHubWorkflow,
  type GitHubRepo,
} from '@/services/githubService';

interface AutomatePageProps {
  params: { id: string };
}

export default function AutomatePage({ params }: AutomatePageProps) {
  const { id } = params;

  const [templates, setTemplates] = useState<RepoTemplate[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [workflowRef, setWorkflowRef] = useState('main');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Create repo from template state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [repoPrivate, setRepoPrivate] = useState(true);

  useEffect(() => {
    setLoading(true);
    const org = process.env.NEXT_PUBLIC_GITHUB_ORG || 'brainsait-incubator';
    Promise.all([listTemplates(org), listStartupRepos(id)])
      .then(([t, r]) => {
        setTemplates(t);
        setRepos(r);
        if (r.length > 0) setSelectedRepo(r[0].full_name);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split('/');
    listWorkflows(owner, repo).then(setWorkflows).catch(() => setWorkflows([]));
  }, [selectedRepo]);

  function notify(message: string, severity: 'success' | 'error') {
    setFeedback({ open: true, message, severity });
  }

  async function handleCreateRepo() {
    if (!selectedTemplate || !newRepoName) return;
    setSubmitting(true);
    try {
      const result = await createRepoFromTemplate({
        templateRepo: selectedTemplate,
        newRepoName,
        description: repoDescription || undefined,
        private: repoPrivate,
      });
      notify(result.message || 'Repository created successfully', result.success ? 'success' : 'error');
      if (result.success) {
        setNewRepoName('');
        setRepoDescription('');
      }
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to create repository', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTriggerWorkflow() {
    if (!selectedRepo || !selectedWorkflow) return;
    const [owner, repo] = selectedRepo.split('/');
    setSubmitting(true);
    try {
      const result = await triggerWorkflow({
        owner,
        repo,
        workflowId: selectedWorkflow,
        ref: workflowRef || 'main',
      });
      notify(result.message || 'Workflow dispatched', result.success ? 'success' : 'error');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to trigger workflow', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInstallApp() {
    const org = process.env.NEXT_PUBLIC_GITHUB_ORG || 'brainsait-incubator';
    setSubmitting(true);
    try {
      const result = await requestAppInstall(org, id);
      notify(result.message || 'App install requested', result.success ? 'success' : 'error');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to request App install', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Link underline="hover" color="inherit" href="/projects">Projects</Link>
          <Link underline="hover" color="inherit" href={`/startup/${id}`}>{id}</Link>
          <Typography color="text.primary">Automate</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <AutoAwesome color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight={600}>GitHub Automation</Typography>
            <Typography variant="body2" color="text.secondary">
              Create repos from templates, trigger CI/CD workflows, manage GitHub Apps
            </Typography>
          </Box>
        </Box>

        {/* Action cards */}
        <Grid container spacing={3}>

          {/* ── Create repo from template ── */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContentCopy color="primary" />
                  <Typography variant="h6">Create Repository from Template</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Template</InputLabel>
                      <Select
                        value={selectedTemplate}
                        label="Template"
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                      >
                        {templates.map((t) => (
                          <MenuItem key={t.full_name} value={t.full_name}>
                            <Box>
                              <Typography variant="body2">{t.name}</Typography>
                              {t.description && (
                                <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                        {templates.length === 0 && (
                          <MenuItem disabled>No templates available</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Repository Name"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      placeholder={`${id}-new-service`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Description (optional)"
                      value={repoDescription}
                      onChange={(e) => setRepoDescription(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch checked={repoPrivate} onChange={(e) => setRepoPrivate(e.target.checked)} />
                      }
                      label="Private"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={submitting ? <CircularProgress size={16} /> : <Code />}
                      onClick={handleCreateRepo}
                      disabled={submitting || !selectedTemplate || !newRepoName}
                    >
                      Create Repository
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* ── Trigger CI/CD workflow ── */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlayArrow color="primary" />
                  <Typography variant="h6">Trigger CI/CD Workflow</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Repository</InputLabel>
                      <Select
                        value={selectedRepo}
                        label="Repository"
                        onChange={(e) => setSelectedRepo(e.target.value)}
                      >
                        {repos.map((r) => (
                          <MenuItem key={r.id} value={r.full_name}>{r.name}</MenuItem>
                        ))}
                        {repos.length === 0 && <MenuItem disabled>No repositories</MenuItem>}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Workflow</InputLabel>
                      <Select
                        value={selectedWorkflow}
                        label="Workflow"
                        onChange={(e) => setSelectedWorkflow(e.target.value)}
                      >
                        {workflows.map((w) => (
                          <MenuItem key={w.id} value={String(w.id)}>{w.name}</MenuItem>
                        ))}
                        {workflows.length === 0 && <MenuItem disabled>No workflows found</MenuItem>}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Branch / Tag"
                      value={workflowRef}
                      onChange={(e) => setWorkflowRef(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={submitting ? <CircularProgress size={16} /> : <Rocket />}
                      onClick={handleTriggerWorkflow}
                      disabled={submitting || !selectedRepo || !selectedWorkflow}
                    >
                      Trigger Workflow
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* ── GitHub App ── */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Apps color="primary" />
                  <Typography variant="h6">GitHub App Integration</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Install the BrainSAIT GitHub App on this startup&apos;s repositories to enable
                  automated project management, CI/CD status reporting, and security scanning.
                </Typography>
                <List dense>
                  {[
                    'Automated project board management',
                    'CI/CD pipeline status in PR checks',
                    'Security & compliance scanning',
                    'Auto-labelling and triage',
                    'Deployment environment protection',
                  ].map((feature) => (
                    <ListItem key={feature}>
                      <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                      <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="outlined"
                  startIcon={submitting ? <CircularProgress size={16} /> : <GitHub />}
                  onClick={handleInstallApp}
                  disabled={submitting}
                >
                  Request App Installation
                </Button>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* ── Template gallery shortcut ── */}
          <Grid item xs={12}>
            <Card sx={{ background: 'linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)', color: '#fff' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Browse Template Gallery</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Explore all available project templates curated for healthcare startups —
                  Next.js portals, Workers APIs, AI services, and more.
                </Typography>
              </CardContent>
              <CardActions>
                <Button variant="contained" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} href="/templates">
                  View Templates
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
      >
        <Alert severity={feedback.severity} onClose={() => setFeedback((f) => ({ ...f, open: false }))}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
