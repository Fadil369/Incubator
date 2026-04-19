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
  Breadcrumbs,
  Link,
  Divider,
  Avatar,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  ContentCopy,
  Star,
  Code,
  CheckCircle,
  OpenInNew,
} from '@mui/icons-material';
import { listTemplates, createRepoFromTemplate, type RepoTemplate } from '@/services/githubService';

const TOPIC_COLORS: Record<string, string> = {
  nextjs: '#0070f3',
  workers: '#f6821f',
  typescript: '#3178c6',
  healthcare: '#388e3c',
  'react': '#61dafb',
  python: '#3572a5',
  ai: '#6f42c1',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<RepoTemplate[]>([]);
  const [filtered, setFiltered] = useState<RepoTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Clone dialog state
  const [cloneDialog, setCloneDialog] = useState<{ open: boolean; template: RepoTemplate | null }>({
    open: false,
    template: null,
  });
  const [newRepoName, setNewRepoName] = useState('');

  useEffect(() => {
    const org = process.env.NEXT_PUBLIC_GITHUB_ORG || 'brainsait-incubator';
    setLoading(true);
    listTemplates(org)
      .then((data) => {
        setTemplates(data);
        setFiltered(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          t.topics.some((topic) => topic.toLowerCase().includes(q)) ||
          (t.language ?? '').toLowerCase().includes(q)
      )
    );
  }, [search, templates]);

  function openCloneDialog(template: RepoTemplate) {
    setNewRepoName(`my-${template.name}`);
    setCloneDialog({ open: true, template });
  }

  function closeCloneDialog() {
    setCloneDialog({ open: false, template: null });
    setNewRepoName('');
  }

  async function handleClone() {
    const { template } = cloneDialog;
    if (!template || !newRepoName.trim()) return;
    setCloning(template.full_name);
    closeCloneDialog();
    try {
      const result = await createRepoFromTemplate({
        templateRepo: template.full_name,
        newRepoName: newRepoName.trim(),
        private: true,
      });
      setFeedback({ open: true, message: result.message || 'Repository created!', severity: result.success ? 'success' : 'error' });
    } catch (err: unknown) {
      setFeedback({ open: true, message: err instanceof Error ? err.message : 'Clone failed', severity: 'error' });
    } finally {
      setCloning(null);
    }
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Typography color="text.primary">Templates</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            🗂️ Project Template Gallery
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse curated repository templates for healthcare startups — Next.js portals,
            Cloudflare Workers APIs, AI services, CI/CD pipelines, and more.
          </Typography>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search templates by name, topic, or language…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 4 }}
        />

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
            </Typography>
            <Grid container spacing={3}>
              {filtered.map((template) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={template.full_name}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                          {template.name[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {template.name}
                        </Typography>
                      </Box>

                      {template.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.4 }}>
                          {template.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                        {template.topics.slice(0, 5).map((topic) => (
                          <Chip
                            key={topic}
                            label={topic}
                            size="small"
                            sx={{
                              bgcolor: `${TOPIC_COLORS[topic] ?? '#666'}22`,
                              borderColor: TOPIC_COLORS[topic] ?? '#666',
                              color: TOPIC_COLORS[topic] ?? 'text.secondary',
                            }}
                            variant="outlined"
                          />
                        ))}
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {template.language && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Code fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{template.language}</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star fontSize="small" sx={{ color: 'warning.main', fontSize: '0.875rem' }} />
                          <Typography variant="caption" color="text.secondary">{template.stargazers_count}</Typography>
                        </Box>
                        {template.is_template && (
                          <Chip icon={<CheckCircle />} label="template" size="small" color="success" />
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={cloning === template.full_name ? <CircularProgress size={14} /> : <ContentCopy />}
                        onClick={() => openCloneDialog(template)}
                        disabled={cloning === template.full_name}
                      >
                        Use Template
                      </Button>
                      <Button
                        size="small"
                        endIcon={<OpenInNew />}
                        href={template.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}

              {filtered.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary">No templates match your search</Typography>
                    <Button sx={{ mt: 2 }} onClick={() => setSearch('')}>Clear search</Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Box>

      {/* Clone Dialog */}
      <Dialog open={cloneDialog.open} onClose={closeCloneDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create repository from template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creating a new repository based on <strong>{cloneDialog.template?.name}</strong>.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="New repository name"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newRepoName.trim()) handleClone(); }}
            helperText="The repository will be created as private in your organization."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCloneDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleClone}
            disabled={!newRepoName.trim()}
            startIcon={<ContentCopy />}
          >
            Create Repository
          </Button>
        </DialogActions>
      </Dialog>

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
