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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Search,
  OpenInNew,
  GitHub,
  FolderOpen,
  BugReport,
  MergeType,
  AutoAwesome,
} from '@mui/icons-material';
import { listOrgProjects, listOrgRepos, type GitHubProject, type GitHubRepo } from '@/services/githubService';

const ORG = process.env.NEXT_PUBLIC_GITHUB_ORG || 'brainsait-incubator';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([listOrgProjects(ORG), listOrgRepos(ORG)])
      .then(([p, r]) => {
        setProjects(p);
        setRepos(r);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredRepos = repos.filter(
    (r) =>
      search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.body ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Derive startup slugs from repo names by stripping common suffixes
  const startupSlugs = [
    ...new Set(
      repos.map((r) =>
        r.name
          .replace(/-backend$|-frontend$|-api$|-platform$|-service$|-worker$/, '')
          .replace(/-app$/, '')
      )
    ),
  ].sort();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Typography color="text.primary">Projects</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <GitHub sx={{ fontSize: 40, color: 'text.primary' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={600}>Incubator Projects</Typography>
            <Typography variant="body2" color="text.secondary">
              {ORG} · {repos.length} repositories · {projects.length} GitHub Projects
            </Typography>
          </Box>
          <Button variant="contained" href="/templates" startIcon={<FolderOpen />}>
            Browse Templates
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search repositories and projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
          sx={{ mb: 4 }}
        />

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={4}>

            {/* Startup portals */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>🚀 Startup Portals</Typography>
              <Grid container spacing={2}>
                {startupSlugs.filter((s) => s.toLowerCase().includes(search.toLowerCase())).slice(0, 24).map((slug) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={slug}>
                    <Card sx={{
                      transition: 'transform 0.15s',
                      '&:hover': { transform: 'translateY(-3px)' },
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                            {slug[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight={600}>{slug}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {repos.filter((r) => r.name.startsWith(slug)).length} repositor
                          {repos.filter((r) => r.name.startsWith(slug)).length !== 1 ? 'ies' : 'y'}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" href={`/startup/${slug}`}>Open Portal</Button>
                        <Button size="small" href={`/startup/${slug}/automate`} startIcon={<AutoAwesome />}>
                          Automate
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
                {startupSlugs.length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" variant="body2">
                      No startup repositories found in {ORG}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* GitHub Projects */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>📋 GitHub Projects</Typography>
              <Grid container spacing={2}>
                {filteredProjects.map((project) => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <FolderOpen color="primary" />
                          <Typography variant="subtitle2" fontWeight={600}>{project.title}</Typography>
                          <Chip
                            label={project.state}
                            size="small"
                            color={project.state === 'open' ? 'success' : 'default'}
                          />
                        </Box>
                        {project.body && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {project.body.slice(0, 120)}{project.body.length > 120 ? '…' : ''}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          #{project.number} · created by {project.creator.login} · {new Date(project.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" href={project.html_url} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew />}>
                          Open Project
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
                {filteredProjects.length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" variant="body2">No GitHub Projects found</Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* All repositories */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>📦 All Repositories ({filteredRepos.length})</Typography>
              <List dense>
                {filteredRepos.slice(0, 50).map((repo) => (
                  <ListItem
                    key={repo.id}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={repo.visibility} size="small" />
                        {repo.language && <Chip label={repo.language} size="small" variant="outlined" />}
                        <Button size="small" href={repo.html_url} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew />}>
                          GitHub
                        </Button>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GitHub fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={500}>{repo.full_name}</Typography>
                          {repo.archived && <Chip label="archived" size="small" />}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          {repo.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                              {repo.description.slice(0, 80)}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <BugReport sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">{repo.open_issues_count}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(repo.pushed_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              {filteredRepos.length > 50 && (
                <Typography variant="caption" color="text.secondary">Showing first 50 of {filteredRepos.length}</Typography>
              )}
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
}
