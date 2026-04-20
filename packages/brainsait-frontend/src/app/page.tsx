'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  AutoAwesome,
  Business,
  MenuBook,
  Analytics,
  People,
  School,
  TrendingUp,
} from '@mui/icons-material';
import { featuredTrainingCourse } from '@/lib/training/catalog';

export default function HomePage() {
  const pillars = [
    {
      icon: <Business />,
      title: 'SME Incubation',
      description: 'Structured support for healthcare startups building digital products, partnerships, and compliant growth systems.',
    },
    {
      icon: <Analytics />,
      title: 'Digital Transformation',
      description: 'Applied AI, automation, analytics, and interoperable architecture for modern healthcare operations.',
    },
    {
      icon: <People />,
      title: 'Expert Mentorship',
      description: 'Founder guidance, technical reviews, and ecosystem support from BrainSAIT experts and partners.',
    },
    {
      icon: <School />,
      title: 'Training and Courses',
      description: 'Premium learning tracks that turn strategy into practical execution for healthcare, tech, and AI teams.',
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(140deg, #08131f 0%, #0f1f37 45%, #123762 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -140, right: -120, width: 360, height: 360, borderRadius: '50%', bgcolor: 'rgba(66, 165, 245, 0.18)', filter: 'blur(30px)' }} />
        <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(46, 125, 50, 0.16)', filter: 'blur(20px)' }} />

        <Container maxWidth="xl">
          <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative' }}>
            <Chip label="Healthcare incubation, automation, and applied learning" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', mb: 3 }} />
            <Grid container spacing={5} alignItems="center">
              <Grid item xs={12} lg={7}>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 2, maxWidth: 820 }}>
                  Build healthcare ventures with stronger systems, sharper execution, and applied AI.
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 760, mb: 4, fontWeight: 400 }}>
                  BrainSAIT helps healthcare SMEs and innovators move from promising ideas to incubator-ready execution through digital transformation, expert mentorship, and premium training.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                  <Button variant="contained" size="large" href="/apply" endIcon={<ArrowForward />}>
                    Apply to the Incubator
                  </Button>
                  <Button variant="outlined" size="large" href="/training" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.28)' }}>
                    Explore Training
                  </Button>
                  <Button variant="text" size="large" href="/projects" sx={{ color: 'white' }}>
                    View Projects
                  </Button>
                </Stack>

                <Grid container spacing={2}>
                  {[
                    { label: 'Program Tracks', value: 'Incubator + Training' },
                    { label: 'Primary Focus', value: 'Healthcare, Tech, AI' },
                    { label: 'Featured Course', value: featuredTrainingCourse.title },
                  ].map((stat) => (
                    <Grid item xs={12} sm={4} key={stat.label}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.66)', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5, color: 'white' }}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', color: 'white' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Chip label={featuredTrainingCourse.badge} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white', mb: 2 }} />
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1.5 }}>
                      {featuredTrainingCourse.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.76)', mb: 3 }}>
                      {featuredTrainingCourse.subtitle}
                    </Typography>
                    <Stack spacing={1.25} sx={{ mb: 3 }}>
                      <Typography variant="body2">Format: {featuredTrainingCourse.format}</Typography>
                      <Typography variant="body2">Access: Google Classroom</Typography>
                      <Typography variant="body2">Class code: {featuredTrainingCourse.classroomCode}</Typography>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button variant="contained" href="/training/courses/collective-brainpower" endIcon={<MenuBook />}>
                        View Course
                      </Button>
                      <Button variant="outlined" href={featuredTrainingCourse.classroomUrl} target="_blank" rel="noopener noreferrer" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.26)' }}>
                        Open Classroom
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Box sx={{ py: 8 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Platform audit and UI direction
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820 }}>
              The product already had strong functional pages, but the public experience was missing a shared navigation model, a clear learning pathway, and a visible connection between application, training, and portal access. The changes below close those gaps.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 8 }}>
            {pillars.map((pillar) => (
              <Grid item xs={12} sm={6} lg={3} key={pillar.title}>
                <Card sx={{ height: '100%', borderRadius: 4 }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Box sx={{ width: 56, height: 56, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: 'primary.light', color: 'primary.main', mb: 2 }}>
                      {pillar.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {pillar.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pillar.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} lg={7}>
              <Card sx={{ height: '100%', borderRadius: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Chip icon={<School />} label="Training and Courses" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    A new training module is now part of the BrainSAIT program.
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    We added a dedicated training hub, a course catalogue foundation, and the first premium course from Dr. Mohamed El Fadil so learning is part of the product, not an external afterthought.
                  </Typography>
                  <Grid container spacing={2}>
                    {featuredTrainingCourse.outcomes.slice(0, 4).map((outcome) => (
                      <Grid item xs={12} sm={6} key={outcome}>
                        <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                          <Typography variant="body2" color="text.secondary">
                            {outcome}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Card sx={{ height: '100%', borderRadius: 4, background: 'linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%)' }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Chip icon={<AutoAwesome />} label="Featured first course" sx={{ alignSelf: 'flex-start', mb: 2 }} />
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {featuredTrainingCourse.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {featuredTrainingCourse.summary}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Instructor: {featuredTrainingCourse.instructor.name} · {featuredTrainingCourse.instructor.location}
                  </Typography>
                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button variant="contained" href="/training/courses/collective-brainpower" endIcon={<ArrowForward />}>
                      Open course page
                    </Button>
                    <Button variant="outlined" href="/training">
                      Go to training hub
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}