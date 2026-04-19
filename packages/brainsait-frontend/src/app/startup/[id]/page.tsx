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
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  GitHub,
  Code,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  PlayArrow,
  BugReport,
  MergeType,
  Rocket,
  AutoAwesome,
  OpenInNew,
  Refresh,
} from '@mui/icons-material';
import {
  listStartupRepos,
  listWorkflowRuns,
  listRepoIssues,
  listRepoPRs,
  listReleases,
  type GitHubRepo,
  type GitHubWorkflowRun,
  type GitHubIssue,
  type GitHubPullRequest,
  type GitHubRelease,
} from '@/services/githubService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`portal-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function runStatusChip(run: GitHubWorkflowRun) {
  if (run.status === 'in_progress' || run.status === 'queued') {
    return <Chip icon={<Schedule />} label={run.status} color="warning" size="small" />;
  }
  if (run.conclusion === 'success') {
    return <Chip icon={<CheckCircle />} label="success" color="success" size="small" />;
  }
  if (run.conclusion === 'failure') {
    return <Chip icon={<ErrorIcon />} label="failure" color="error" size="small" />;
  }
  return <Chip label={run.conclusion ?? run.status ?? 'unknown'} size="small" />;
}

interface StartupPortalPageProps {
  params: { id: string };
}

export default function StartupPortalPage({ params }: StartupPortalPageProps) {
  const { id } = params;

  const [tab, setTab] = useState(0);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [prs, setPRs] = useState<GitHubPullRequest[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listStartupRepos(id)
      .then((data) => {
        setRepos(data);
        if (data.length > 0) setSelectedRepo(data[0]);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.full_name.split('/');
    Promise.all([
      listWorkflowRuns(owner, repo),
      listRepoIssues(owner, repo),
      listRepoPRs(owner, repo),
      listReleases(owner, repo),
    ]).then(([r, i, p, rel]) => {
      setRuns(r);
      setIssues(i);
      setPRs(p);
      setReleases(rel);
    });
  }, [selectedRepo]);

  const openIssues = issues.filter((i) => i.state === 'open' && !i.pull_request);
  const openPRs = prs.filter((p) => p.state === 'open');
  const latestRun = runs[0];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Link underline="hover" color="inherit" href="/projects">Projects</Link>
          <Typography color="text.primary">{id}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            <GitHub sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={600}>{id}</Typography>
            <Typography variant="body2" color="text.secondary">
              {repos.length} repositor{repos.length !== 1 ? 'ies' : 'y'} · Startup Portal
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            href={`/startup/${id}/automate`}
          >
            Automate
          </Button>
          <Tooltip title="Open in GitHub">
            <IconButton
              href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_ORG}/${id}-platform`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OpenInNew />
            </IconButton>
          </Tooltip>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Stats row */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Repositories', value: repos.length, icon: <Code /> },
            { label: 'Open Issues', value: openIssues.length, icon: <BugReport /> },
            { label: 'Open PRs', value: openPRs.length, icon: <MergeType /> },
            { label: 'Releases', value: releases.length, icon: <Rocket /> },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'secondary.main' }}>{stat.icon}</Avatar>
                  <Typography variant="h5" fontWeight={600}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Repository selector + details */}
        <Grid container spacing={3}>
          {/* Repo list */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ px: 1, py: 1 }}>Repositories</Typography>
              <Divider />
              <List dense>
                {repos.map((r) => (
                  <ListItem
                    key={r.id}
                    selected={selectedRepo?.id === r.id}
                    onClick={() => setSelectedRepo(r)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Code fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={r.name}
                      secondary={r.language ?? 'unknown'}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
                {repos.length === 0 && (
                  <ListItem>
                    <ListItemText secondary="No repositories yet" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Details */}
          <Grid item xs={12} md={9}>
            {selectedRepo ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6">{selectedRepo.full_name}</Typography>
                  <Chip label={selectedRepo.visibility} size="small" />
                  {selectedRepo.language && (
                    <Chip label={selectedRepo.language} size="small" variant="outlined" />
                  )}
                  <IconButton size="small" onClick={() => setSelectedRepo({ ...selectedRepo })}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Box>
                {selectedRepo.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedRepo.description}
                  </Typography>
                )}

                <Paper sx={{ mb: 3 }}>
                  <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab icon={<PlayArrow />} label={`CI/CD (${runs.length})`} />
                    <Tab icon={<BugReport />} label={`Issues (${openIssues.length})`} />
                    <Tab icon={<MergeType />} label={`PRs (${openPRs.length})`} />
                    <Tab icon={<Rocket />} label={`Releases (${releases.length})`} />
                  </Tabs>

                  {/* CI/CD */}
                  <TabPanel value={tab} index={0}>
                    <Box sx={{ px: 2 }}>
                      {latestRun && (
                        <Alert
                          severity={latestRun.conclusion === 'success' ? 'success' : latestRun.conclusion === 'failure' ? 'error' : 'info'}
                          sx={{ mb: 2 }}
                        >
                          Latest run: <strong>{latestRun.name}</strong> on {latestRun.head_branch} — {latestRun.conclusion ?? latestRun.status}
                        </Alert>
                      )}
                      <List dense>
                        {runs.slice(0, 10).map((run) => (
                          <ListItem key={run.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <ListItemText
                              primary={run.name ?? `Run #${run.run_number}`}
                              secondary={`${run.event} · ${run.head_branch} · ${new Date(run.created_at).toLocaleString()}`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {runStatusChip(run)}
                              <IconButton size="small" href={run.html_url} target="_blank" rel="noopener noreferrer">
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ))}
                        {runs.length === 0 && (
                          <ListItem><ListItemText secondary="No workflow runs found" /></ListItem>
                        )}
                      </List>
                    </Box>
                  </TabPanel>

                  {/* Issues */}
                  <TabPanel value={tab} index={1}>
                    <Box sx={{ px: 2 }}>
                      <List dense>
                        {openIssues.slice(0, 15).map((issue) => (
                          <ListItem key={issue.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <ListItemText
                              primary={`#${issue.number} ${issue.title}`}
                              secondary={new Date(issue.created_at).toLocaleDateString()}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {issue.labels.map((l) => (
                                <Chip key={l.name} label={l.name} size="small"
                                  sx={{ bgcolor: `#${l.color}22`, borderColor: `#${l.color}` }} variant="outlined" />
                              ))}
                              <IconButton size="small" href={issue.html_url} target="_blank" rel="noopener noreferrer">
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ))}
                        {openIssues.length === 0 && (
                          <ListItem><ListItemText secondary="No open issues 🎉" /></ListItem>
                        )}
                      </List>
                    </Box>
                  </TabPanel>

                  {/* PRs */}
                  <TabPanel value={tab} index={2}>
                    <Box sx={{ px: 2 }}>
                      <List dense>
                        {openPRs.slice(0, 15).map((pr) => (
                          <ListItem key={pr.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <ListItemText
                              primary={`#${pr.number} ${pr.title}`}
                              secondary={`${pr.head.ref} → ${pr.base.ref} · ${new Date(pr.created_at).toLocaleDateString()}`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {pr.draft && <Chip label="draft" size="small" />}
                              <IconButton size="small" href={pr.html_url} target="_blank" rel="noopener noreferrer">
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ))}
                        {openPRs.length === 0 && (
                          <ListItem><ListItemText secondary="No open pull requests" /></ListItem>
                        )}
                      </List>
                    </Box>
                  </TabPanel>

                  {/* Releases */}
                  <TabPanel value={tab} index={3}>
                    <Box sx={{ px: 2 }}>
                      <Grid container spacing={2}>
                        {releases.slice(0, 6).map((rel) => (
                          <Grid item xs={12} sm={6} key={rel.id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle2" gutterBottom>{rel.tag_name}</Typography>
                                {rel.name && <Typography variant="body2">{rel.name}</Typography>}
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  {rel.prerelease && <Chip label="pre-release" size="small" color="warning" />}
                                  {rel.draft && <Chip label="draft" size="small" />}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {rel.published_at ? new Date(rel.published_at).toLocaleDateString() : 'unpublished'}
                                </Typography>
                              </CardContent>
                              <CardActions>
                                <Button size="small" href={rel.html_url} target="_blank" rel="noopener noreferrer"
                                  endIcon={<OpenInNew />}>
                                  View
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        ))}
                        {releases.length === 0 && (
                          <Grid item xs={12}>
                            <Typography color="text.secondary" variant="body2">No releases yet</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </TabPanel>
                </Paper>
              </>
            ) : (
              <Typography color="text.secondary">Select a repository from the list</Typography>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
