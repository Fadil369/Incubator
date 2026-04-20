import type { Metadata } from 'next';
import {
  ArrowForward,
  AutoAwesome,
  Bolt,
  Hub,
  Launch,
  MenuBook,
  Psychology,
  School,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Link,
  Stack,
  Typography,
  Avatar,
} from '@mui/material';
import { featuredTrainingCourse } from '@/lib/training/catalog';

export const metadata: Metadata = {
  title: 'BrainSAIT Training Hub | Healthcare, Tech & AI Courses',
  description: 'Explore BrainSAIT cohort-based training for healthcare founders, operators, and AI transformation teams.',
};

const FIT_STEPS = [
  {
    title: 'Learn inside the program',
    description: 'Training is now part of the BrainSAIT experience, not a disconnected external resource.',
    icon: <School />,
  },
  {
    title: 'Translate learning into systems',
    description: 'Every module is designed to feed directly into product, operations, compliance, and venture execution.',
    icon: <Hub />,
  },
  {
    title: 'Move from ideas to execution',
    description: 'Courses, portal workflows, and project delivery now reinforce each other in one platform journey.',
    icon: <Psychology />,
  },
];

export default function TrainingPage() {
  return (
    <Box sx={{ backgroundColor: '#050505', minHeight: '100vh' }}>
      <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 }, color: 'white' }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link underline="hover" color="rgba(255,255,255,0.72)" href="/">
            BrainSAIT
          </Link>
          <Typography color="white">Training</Typography>
        </Breadcrumbs>

        <Card
          sx={{
            borderRadius: 5,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #050505 0%, #0b1220 55%, #16112b 100%)',
            color: 'white',
            mb: 5,
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', top: -70, left: -40, width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(6,182,212,0.16)', filter: 'blur(24px)' }} />
          <Box sx={{ position: 'absolute', bottom: -90, right: -20, width: 280, height: 280, borderRadius: '50%', bgcolor: 'rgba(139,92,246,0.14)', filter: 'blur(28px)' }} />
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Chip label="Advanced Cohort" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', mb: 2 }} />
            <Typography variant="h2" fontWeight={800} sx={{ color: 'white', maxWidth: 920, mb: 2, lineHeight: 1.05 }}>
              Engineering the future of health and technology.
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 780, mb: 4, fontWeight: 400 }}>
              Join an elite BrainSAIT learning track built for healthcare founders, transformation teams, and operators who need automated systems, integrated workflows, and practical AI execution.
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between">
              <Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Button variant="contained" size="large" href="/training/courses/collective-brainpower" endIcon={<ArrowForward />} sx={{ bgcolor: 'white', color: '#050505', '&:hover': { bgcolor: 'grey.200' } }}>
                    Explore premium course
                  </Button>
                  <Button variant="outlined" size="large" href={featuredTrainingCourse.classroomUrl} target="_blank" rel="noopener noreferrer" endIcon={<Launch />} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.24)' }}>
                    Access Google Classroom
                  </Button>
                </Stack>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>Class code</Typography>
                  <Typography variant="body2" sx={{ color: '#67e8f9', fontWeight: 800, letterSpacing: 1.4 }}>{featuredTrainingCourse.classroomCode}</Typography>
                </Box>
              </Box>
              <Grid container spacing={1.5} sx={{ width: { xs: '100%', md: 320 }, alignContent: 'flex-start' }}>
                {[
                  { label: 'Format', value: featuredTrainingCourse.format },
                  { label: 'Duration', value: featuredTrainingCourse.duration },
                  { label: 'Level', value: featuredTrainingCourse.level },
                  { label: 'Instructor', value: featuredTrainingCourse.instructor.name },
                ].map((stat) => (
                  <Grid item xs={6} md={12} key={stat.label}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'white', mt: 0.5 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {FIT_STEPS.map((step) => (
            <Grid item xs={12} md={4} key={step.title}>
              <Card sx={{ height: '100%', borderRadius: 4, bgcolor: '#0d1320', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', color: '#67e8f9', mb: 2 }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)' }}>
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} lg={7}>
            <Card sx={{ height: '100%', borderRadius: 4, bgcolor: '#0d1320', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                <Chip icon={<AutoAwesome />} label="Featured Course" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.08)', color: 'white' }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {featuredTrainingCourse.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255,255,255,0.72)' }}>
                  {featuredTrainingCourse.description}
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {featuredTrainingCourse.focusAreas.map((area) => (
                    <Grid item xs={12} sm={4} key={area.title}>
                      <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
                        <Avatar sx={{ width: 40, height: 40, mb: 1.5, bgcolor: area.icon === 'automation' ? 'rgba(6,182,212,0.18)' : area.icon === 'integration' ? 'rgba(59,130,246,0.18)' : 'rgba(139,92,246,0.18)', color: 'white' }}>
                          {area.icon === 'automation' ? <Bolt /> : area.icon === 'integration' ? <Hub /> : <TrendingUp />}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          {area.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)' }}>
                          {area.description}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button variant="contained" href="/training/courses/collective-brainpower" endIcon={<MenuBook />}>
                    Open course page
                  </Button>
                  <Button variant="outlined" href={featuredTrainingCourse.classroomUrl} target="_blank" rel="noopener noreferrer">
                    Open Google Classroom
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%', borderRadius: 4, background: 'linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%)' }}>
              <CardContent sx={{ p: 4 }}>
                <Chip label={featuredTrainingCourse.badge} sx={{ mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Course access details
                </Typography>
                <Stack spacing={1.25} sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">Format: {featuredTrainingCourse.format}</Typography>
                  <Typography variant="body2" color="text.secondary">Duration: {featuredTrainingCourse.duration}</Typography>
                  <Typography variant="body2" color="text.secondary">Level: {featuredTrainingCourse.level}</Typography>
                  <Typography variant="body2" color="text.secondary">Google Classroom code: {featuredTrainingCourse.classroomCode}</Typography>
                </Stack>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Expected outcomes
                </Typography>
                <Stack spacing={1.25}>
                  {featuredTrainingCourse.outcomes.map((outcome) => (
                    <Box key={outcome} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">{outcome}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ borderRadius: 4, bgcolor: '#0d1320', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                <Chip label="Curriculum Architecture" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.08)', color: 'white' }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  Built for automated, integrated, technology-driven execution.
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.68)', mb: 3 }}>
                  This is not generic training. Each module is structured to feed directly into founder decisions, digital system design, and AI-enabled operational maturity inside the incubator.
                </Typography>
                <Grid container spacing={2}>
                  {featuredTrainingCourse.curriculum.map((module, index) => (
                    <Grid item xs={12} md={6} key={module.title}>
                      <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
                        <Typography variant="overline" sx={{ color: '#67e8f9', letterSpacing: 1.4 }}>
                          Module {index + 1}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white', mb: 1 }}>
                          {module.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)' }}>
                          {module.description}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card sx={{ borderRadius: 4, bgcolor: '#0d1320', color: 'white', border: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Chip label="Course Director" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.08)', color: '#67e8f9' }} />
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                  <Avatar src={featuredTrainingCourse.instructor.avatarUrl} alt={featuredTrainingCourse.instructor.name} sx={{ width: 76, height: 76 }} />
                  <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: 'white' }}>
                      {featuredTrainingCourse.instructor.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                      {featuredTrainingCourse.instructor.role}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#67e8f9' }}>
                      {featuredTrainingCourse.instructor.company} · {featuredTrainingCourse.instructor.location}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', mb: 3 }}>
                  {featuredTrainingCourse.instructor.bio}
                </Typography>
                <Stack spacing={1.25}>
                  {featuredTrainingCourse.instructor.links.map((link) => (
                    <Button key={link.label} variant="outlined" href={link.url} target="_blank" rel="noopener noreferrer" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)' }} endIcon={<Launch />}>
                      {link.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
    </Box>
  );
}