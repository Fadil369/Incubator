'use client';

import React, { Suspense, useState } from 'react';
import NextLink from 'next/link';
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
  Avatar,
  Breadcrumbs,
  Link,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import {
  Rocket,
  GitHub,
  PlayArrow,
  School,
  Analytics,
  Assignment,
  CheckCircle,
  Schedule,
  OpenInNew,
  AutoAwesome,
  Code,
  People,
  EmojiEvents,
  TrendingUp,
  CalendarToday,
  MenuBook,
  Star,
  ArrowForward,
} from '@mui/icons-material';
import { featuredTrainingCourse } from '@/lib/training/catalog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`portal-tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface Milestone {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'completed' | 'in_progress' | 'pending';
  phase: number;
}

interface Resource {
  title: string;
  description: string;
  category: string;
  url: string;
  icon: React.ReactNode;
}

const MILESTONES: Milestone[] = [
  { id: 1, phase: 1, title: 'Onboarding & Orientation', description: 'Complete profile setup, meet your mentor, and explore the platform.', dueDate: 'Week 1', status: 'completed' },
  { id: 2, phase: 1, title: 'Business Model Canvas', description: 'Define and validate your healthcare startup business model.', dueDate: 'Week 2', status: 'completed' },
  { id: 3, phase: 2, title: 'MVP Definition', description: 'Define the core features of your minimum viable product.', dueDate: 'Week 4', status: 'in_progress' },
  { id: 4, phase: 2, title: 'Technical Architecture Review', description: 'Architecture review with BrainSAIT engineering team.', dueDate: 'Week 5', status: 'pending' },
  { id: 5, phase: 2, title: 'GitHub Repository Setup', description: 'CI/CD pipelines, repo templates, and security scanning configured.', dueDate: 'Week 5', status: 'pending' },
  { id: 6, phase: 3, title: 'Regulatory Compliance Assessment', description: 'PDPL, NPHIES, SFDA, and MDHB compliance checklist.', dueDate: 'Week 8', status: 'pending' },
  { id: 7, phase: 3, title: 'Pitch Deck Review', description: 'Investor-ready pitch reviewed by BrainSAIT venture advisors.', dueDate: 'Week 10', status: 'pending' },
  { id: 8, phase: 4, title: 'Demo Day', description: 'Present your startup to investors and the BrainSAIT ecosystem.', dueDate: 'Week 12', status: 'pending' },
];

const RESOURCES: Resource[] = [
  { title: 'NPHIES Integration Guide', description: 'Step-by-step guide to integrating with the National Platform for Health Insurance Exchange', category: 'Technical', url: 'https://docs.brainsait.org/nphies', icon: <Code /> },
  { title: 'FHIR R4 SDK', description: 'Open-source TypeScript SDK for FHIR R4 resources used across the BrainSAIT platform', category: 'Technical', url: 'https://docs.brainsait.org/fhir', icon: <GitHub /> },
  { title: 'Healthcare Startup Playbook', description: 'Proven frameworks for building compliant digital health products in Saudi Arabia', category: 'Strategy', url: 'https://docs.brainsait.org/playbook', icon: <MenuBook /> },
  { title: 'PDPL Compliance Checklist', description: 'Saudi Arabia Personal Data Protection Law compliance requirements for healthtech', category: 'Legal', url: 'https://docs.brainsait.org/pdpl', icon: <Assignment /> },
  { title: 'Vision 2030 Health Programs', description: 'Overview of government programs and funding opportunities aligned with Vision 2030', category: 'Strategy', url: 'https://docs.brainsait.org/vision2030', icon: <EmojiEvents /> },
  { title: 'Investor Network Access', description: 'Introduction to BrainSAIT partner VCs and angel investors active in MENA healthtech', category: 'Funding', url: 'https://brainsait.org/partners#investors', icon: <TrendingUp /> },
];

function IncubatorPortalContent() {
  const searchParams = useSearchParams();
  const startupId = searchParams.get('startupId')?.trim() ?? '';
  const [tab, setTab] = useState(0);

  if (!startupId) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 8 }}>
          <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ p: 4, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #1e1b4b 100%)', color: 'white' }}>
              <Chip label="Portal Entry" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.14)', color: 'white' }} />
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Enter the BrainSAIT Portal
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 720 }}>
                Use this entry page to continue from your invitation email, open your workspace from the projects directory, or return to the partner application flow.
              </Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Accepted partners should continue from the invitation link sent to their email. Existing startups can open their workspace from the projects directory.
              </Alert>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                  {
                    title: 'Use invitation email',
                    description: 'Open the onboarding link from your acceptance email to validate your token and complete setup.',
                  },
                  {
                    title: 'Open projects directory',
                    description: 'Find your startup workspace, repos, and automation entry points from the shared projects view.',
                  },
                  {
                    title: 'Need access?',
                    description: 'Apply to the incubator if you have not started the partner workflow yet.',
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
                <Button variant="contained" component={NextLink} href="/projects">
                  Open Projects
                </Button>
                <Button variant="outlined" component={NextLink} href="/portal/accept">
                  Invitation Help
                </Button>
                <Button variant="text" component={NextLink} href="/apply">
                  Apply to Program
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  const completedMilestones = MILESTONES.filter((m) => m.status === 'completed').length;
  const progress = Math.round((completedMilestones / MILESTONES.length) * 100);
  const currentPhase = MILESTONES.find((m) => m.status === 'in_progress')?.phase ?? 1;
  const startupPortalHref = `/startup?startupId=${encodeURIComponent(startupId)}`;
  const startupAutomateHref = `/startup/automate?startupId=${encodeURIComponent(startupId)}`;

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">BrainSAIT</Link>
          <Typography color="text.primary">Incubator Portal</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #1e1b4b 100%)',
            borderRadius: 3,
            p: 4,
            mb: 4,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.15)' }} />
          <Box sx={{ position: 'absolute', bottom: -30, right: 100, width: 120, height: 120, borderRadius: '50%', background: 'rgba(14,165,233,0.1)' }} />

          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Chip
                label="🚀 BrainSAIT Ultimate Incubator Program"
                sx={{ bgcolor: 'rgba(139,92,246,0.3)', color: '#a78bfa', mb: 2, fontWeight: 600 }}
              />
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#f8fafc' }}>
                {startupId.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
              </Typography>
              <Typography variant="body1" sx={{ color: '#94a3b8', mb: 2 }}>
                Phase {currentPhase} of 4 · {completedMilestones}/{MILESTONES.length} milestones complete
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1, maxWidth: 300 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#a78bfa', fontWeight: 600 }}>{progress}%</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<GitHub />}
                href={startupPortalHref}
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
              >
                Dev Portal
              </Button>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                href={startupAutomateHref}
                sx={{ bgcolor: 'rgba(139,92,246,0.4)', '&:hover': { bgcolor: 'rgba(139,92,246,0.6)' } }}
              >
                Automate
              </Button>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { icon: <CheckCircle />, label: 'Milestones Done', value: completedMilestones, color: 'success.main' },
            { icon: <Schedule />, label: 'In Progress', value: MILESTONES.filter((m) => m.status === 'in_progress').length, color: 'warning.main' },
            { icon: <People />, label: 'Mentors', value: 2, color: 'primary.main' },
            { icon: <CalendarToday />, label: 'Next Session', value: 'Mon 10am', color: 'secondary.main' },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: stat.color, width: 44, height: 44 }}>
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>{stat.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ mb: 4 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Rocket />} label="Program" />
            <Tab icon={<School />} label="Mentors" />
            <Tab icon={<MenuBook />} label="Resources" />
            <Tab icon={<AutoAwesome />} label="Training" />
            <Tab icon={<Analytics />} label="KPIs" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                BrainSAIT Incubator Program · 12-week accelerated track for healthcare startups
              </Typography>
              {[1, 2, 3, 4].map((phase) => {
                const phaseMilestones = MILESTONES.filter((milestone) => milestone.phase === phase);
                const phaseLabels = ['Phase 1: Foundation', 'Phase 2: Build', 'Phase 3: Validate', 'Phase 4: Launch'];
                return (
                  <Box key={phase} sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents sx={{ fontSize: 20, color: 'primary.main' }} />
                      {phaseLabels[phase - 1]}
                    </Typography>
                    <List disablePadding>
                      {phaseMilestones.map((milestone) => (
                        <ListItem
                          key={milestone.id}
                          sx={{
                            border: '1px solid',
                            borderColor: milestone.status === 'in_progress' ? 'primary.main' : 'divider',
                            borderRadius: 1.5,
                            mb: 1,
                            bgcolor: milestone.status === 'completed' ? 'success.light' : milestone.status === 'in_progress' ? 'primary.light' : 'background.paper',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {milestone.status === 'completed' ? (
                              <CheckCircle sx={{ color: 'success.main' }} />
                            ) : milestone.status === 'in_progress' ? (
                              <Schedule sx={{ color: 'primary.main' }} />
                            ) : (
                              <Schedule sx={{ color: 'text.disabled' }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>{milestone.title}</Typography>
                                <Chip label={milestone.dueDate} size="small" variant="outlined" />
                                {milestone.status === 'in_progress' && <Chip label="Active" size="small" color="primary" />}
                                {milestone.status === 'completed' && <Chip label="Done" size="small" color="success" />}
                              </Box>
                            }
                            secondary={milestone.description}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {phase < 4 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                );
              })}
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Box sx={{ px: 2 }}>
              <Grid container spacing={3}>
                {[
                  { name: 'Dr. Sarah Al-Mansouri', role: 'Clinical Strategy Lead', expertise: 'NPHIES, Clinical Workflows, Saudi MOH', avatar: 'S', nextSession: 'Monday, 10:00 AM GST', bio: 'Former VP of Digital Health at Seha, 15+ years in Saudi healthcare transformation.' },
                  { name: 'Omar Al-Rashid', role: 'Technology & Infrastructure', expertise: 'Cloudflare Workers, FHIR R4, AI Integration', avatar: 'O', nextSession: 'Wednesday, 2:00 PM GST', bio: 'Ex-Cloudflare engineer, built the BrainSAIT platform architecture from the ground up.' },
                ].map((mentor) => (
                  <Grid item xs={12} sm={6} key={mentor.name}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem' }}>
                            {mentor.avatar}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>{mentor.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{mentor.role}</Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{mentor.bio}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {mentor.expertise.split(', ').map((expertise) => (
                            <Chip key={expertise} label={expertise} size="small" variant="outlined" />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">Next: {mentor.nextSession}</Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small" startIcon={<CalendarToday />}>Book Session</Button>
                        <Button size="small" startIcon={<PlayArrow />}>View Profile</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Box sx={{ px: 2 }}>
              <Grid container spacing={2}>
                {RESOURCES.map((resource) => (
                  <Grid item xs={12} sm={6} md={4} key={resource.title}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 36, height: 36 }}>
                            {resource.icon}
                          </Avatar>
                          <Chip label={resource.category} size="small" />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>{resource.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{resource.description}</Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" endIcon={<OpenInNew />} href={resource.url} target="_blank" rel="noopener noreferrer">
                          Open
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Box sx={{ px: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={7}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Chip icon={<AutoAwesome />} label="Featured Course" color="primary" sx={{ mb: 2 }} />
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {featuredTrainingCourse.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {featuredTrainingCourse.description}
                      </Typography>
                      <Grid container spacing={2}>
                        {featuredTrainingCourse.focusAreas.map((area) => (
                          <Grid item xs={12} sm={4} key={area.title}>
                            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                {area.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {area.description}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                    <CardActions>
                      <Button size="small" href="/training/courses/collective-brainpower" endIcon={<ArrowForward />}>
                        Open Course
                      </Button>
                      <Button size="small" href={featuredTrainingCourse.classroomUrl} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew />}>
                        Google Classroom
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={5}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Included in your program flow
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Your team can now move from incubator milestones into structured course delivery without leaving the platform.
                      </Typography>
                      <List disablePadding>
                        {featuredTrainingCourse.curriculum.map((module, index) => (
                          <ListItem key={module.title} disableGutters sx={{ alignItems: 'flex-start', pb: 1.5 }}>
                            <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                              <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                                {index + 1}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={<Typography variant="body2" fontWeight={700}>{module.title}</Typography>}
                              secondary={<Typography variant="caption" color="text.secondary">{module.description}</Typography>}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Chip label={`Class code: ${featuredTrainingCourse.classroomCode}`} variant="outlined" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Track your startup&apos;s growth metrics and KPIs throughout the incubator program.
              </Typography>
              <Grid container spacing={2}>
                {[
                  { metric: 'Product–Market Fit Score', value: 68, target: 80, unit: '/100', color: '#8b5cf6' },
                  { metric: 'Technical Readiness', value: 45, target: 100, unit: '%', color: '#0ea5e9' },
                  { metric: 'Regulatory Compliance', value: 30, target: 100, unit: '%', color: '#22c55e' },
                  { metric: 'Network Score', value: 55, target: 100, unit: '%', color: '#f59e0b' },
                ].map((kpi) => (
                  <Grid item xs={12} sm={6} key={kpi.metric}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{kpi.metric}</Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ color: kpi.color }}>
                            {kpi.value}{kpi.unit}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(kpi.value / kpi.target) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'action.disabledBackground',
                            '& .MuiLinearProgress-bar': { bgcolor: kpi.color, borderRadius: 3 },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Target: {kpi.target}{kpi.unit}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Analytics Dashboard</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Full analytics and KPI tracking available from Week 3 onward.
                </Typography>
                <Button variant="outlined" endIcon={<ArrowForward />} href="/ai-dashboard">
                  Open AI Dashboard
                </Button>
              </Box>
            </Box>
          </TabPanel>
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>Quick Links</Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Developer Portal', description: 'Manage repos, CI/CD, PRs', href: startupPortalHref, icon: <GitHub /> },
              { label: 'GitHub Automation', description: 'Create repos from templates', href: startupAutomateHref, icon: <AutoAwesome /> },
                { label: 'Resource Library', description: 'Shared course bundle, templates, and contracts', href: '/resources', icon: <MenuBook /> },
                { label: 'Mentorship Hub', description: 'Live chat rooms and mentor coordination', href: '/mentorship', icon: <People /> },
                { label: 'App Marketplace', description: 'Install incubator apps and launch kits', href: '/app-store', icon: <Rocket /> },
                { label: 'Graduation Showcase', description: 'Public cohort outcomes and startup stories', href: '/showcase', icon: <EmojiEvents /> },
              { label: 'Training Hub', description: 'Courses and premium learning tracks', href: '/training', icon: <MenuBook /> },
              { label: 'Template Gallery', description: 'Browse project templates', href: '/templates', icon: <Code /> },
              { label: 'All Projects', description: 'Org-wide project overview', href: '/projects', icon: <TrendingUp /> },
            ].map((link) => (
              <Grid item xs={12} sm={6} md={3} key={link.label}>
                <Card
                  component="a"
                  href={link.href}
                  sx={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                  }}
                >
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{link.icon}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>{link.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{link.description}</Typography>
                  </Box>
                  <Tooltip title="Open">
                    <IconButton size="small" sx={{ ml: 'auto' }}>
                      <ArrowForward fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}

export default function IncubatorPortalPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      }
    >
      <IncubatorPortalContent />
    </Suspense>
  );
}