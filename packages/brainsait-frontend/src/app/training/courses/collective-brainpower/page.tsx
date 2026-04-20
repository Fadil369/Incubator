import type { Metadata } from 'next';
import {
  ArrowForward,
  AutoAwesome,
  Bolt,
  Engineering,
  Hub,
  Launch,
  Memory,
  MenuBook,
  PlayCircleOutline,
  NorthEast,
  ShowChart,
  ContentCopy,
  CalendarMonth,
} from '@mui/icons-material';
import {
  Avatar,
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
} from '@mui/material';
import { featuredTrainingCourse } from '@/lib/training/catalog';

export const metadata: Metadata = {
  title: 'Collective Brainpower | BrainSAIT Training',
  description: 'Premium BrainSAIT cohort course for healthcare, technology, AI, and integrated digital transformation.',
};

const FOCUS_ICONS = {
  automation: <Memory />,
  integration: <Hub />,
  growth: <ShowChart />,
};

export default function CollectiveBrainpowerCoursePage() {
  const course = featuredTrainingCourse;

  return (
    <Box sx={{ backgroundColor: '#08111c' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #08111c 0%, #0f1d34 55%, #163f67 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -80, left: -60, width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(46, 125, 50, 0.16)', filter: 'blur(20px)' }} />
        <Box sx={{ position: 'absolute', bottom: -120, right: -40, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(66, 165, 245, 0.14)', filter: 'blur(18px)' }} />

        <Container maxWidth="xl">
          <Box sx={{ py: { xs: 5, md: 7 }, position: 'relative' }}>
            <Breadcrumbs sx={{ mb: 3, '& .MuiTypography-root, & .MuiLink-root': { color: 'rgba(255,255,255,0.72)' } }}>
              <Link underline="hover" href="/">BrainSAIT</Link>
              <Link underline="hover" href="/training">Training</Link>
              <Typography color="white">Collective Brainpower</Typography>
            </Breadcrumbs>

            <Grid container spacing={5} alignItems="center">
              <Grid item xs={12} lg={7}>
                <Stack direction="row" spacing={1.25} sx={{ flexWrap: 'wrap', mb: 2 }}>
                  <Chip label="Advanced Cohort" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white' }} />
                  <Chip label={course.badge} sx={{ bgcolor: 'rgba(46, 125, 50, 0.22)', color: '#b9f6ca' }} />
                </Stack>
                <Typography variant="h2" fontWeight={800} sx={{ color: 'white', maxWidth: 860, mb: 2 }}>
                  Engineering the future of health and technology.
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.76)', fontWeight: 400, maxWidth: 760, mb: 3 }}>
                  {course.subtitle}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)', maxWidth: 760, mb: 4 }}>
                  {course.description}
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    href={course.classroomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<Launch />}
                  >
                    Enroll in Google Classroom
                  </Button>
                  <Button variant="outlined" size="large" href="/training" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.24)' }}>
                    Back to training hub
                  </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button href="#overview" sx={{ color: 'white' }}>Overview</Button>
                  <Button href="#curriculum" sx={{ color: 'white' }}>Curriculum</Button>
                  <Button href="#instructor" sx={{ color: 'white' }}>Instructor</Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mt: 3 }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.2, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.74)' }}>
                      Class code: <Box component="span" sx={{ color: '#67e8f9', fontWeight: 800, letterSpacing: 1.2 }}>{course.classroomCode}</Box>
                    </Typography>
                    <ContentCopy sx={{ fontSize: 18, color: 'rgba(255,255,255,0.66)' }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Powered by Google Classroom with guided implementation support.
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Chip icon={<AutoAwesome />} label="Access details" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white', mb: 2 }} />
                    <Grid container spacing={1.5} sx={{ mb: 3 }}>
                      {[
                        { label: 'Format', value: course.format },
                        { label: 'Duration', value: course.duration },
                        { label: 'Level', value: course.level },
                        { label: 'Code', value: course.classroomCode },
                      ].map((item) => (
                        <Grid item xs={6} key={item.label}>
                          <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                              {item.label}
                            </Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ color: 'white', mt: 0.5 }}>
                              {item.value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', mb: 1 }}>
                        Instructor
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                        {course.instructor.name} · {course.instructor.role}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card sx={{ mt: 5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.10)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <Chip icon={<MenuBook />} label="Course preview" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', mb: 2 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 1.5 }}>
                      Built as BrainSAIT’s first premium course experience.
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)', maxWidth: 720 }}>
                      This course now lives directly inside the training hub while still linking into Google Classroom for delivery. The experience is designed as a premium cohort layer for healthcare, technology, and AI transformation teams.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box
                      sx={{
                        minHeight: 220,
                        borderRadius: 4,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'rgba(2,6,23,0.65)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'linear-gradient(135deg, rgba(14,165,233,0.14) 0%, rgba(99,102,241,0.14) 100%)',
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Box sx={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}>
                          <PlayCircleOutline sx={{ fontSize: 42, color: 'white' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white' }}>
                          Watch Course Trailer
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', textAlign: 'center', maxWidth: 260 }}>
                          Preview the premium course experience and then enter the classroom directly with the live class code.
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Box sx={{ py: { xs: 5, md: 7 } }}>
          <Grid container spacing={4}>
            <Grid item xs={12} lg={8}>
              <Box id="overview" sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 2 }}>
                  Course overview
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)', maxWidth: 860, mb: 3 }}>
                  {course.summary}
                </Typography>
                <Grid container spacing={2}>
                  {course.focusAreas.map((area) => (
                    <Grid item xs={12} md={4} key={area.title}>
                      <Card sx={{ height: '100%', borderRadius: 4, bgcolor: '#0e1726', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <CardContent sx={{ p: 3.5 }}>
                          <Box sx={{ width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: area.icon === 'automation' ? 'rgba(6,182,212,0.12)' : area.icon === 'integration' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)', color: '#90caf9', mb: 2 }}>
                            {FOCUS_ICONS[area.icon]}
                          </Box>
                          <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mb: 1 }}>
                            {area.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                            {area.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box id="curriculum" sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 2 }}>
                  Curriculum
                </Typography>
                <Grid container spacing={2}>
                  {course.curriculum.map((module, index) => (
                    <Grid item xs={12} md={6} key={module.title}>
                      <Card sx={{ height: '100%', borderRadius: 4, bgcolor: '#0e1726', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <CardContent sx={{ p: 3.5 }}>
                          <Chip label={`Module ${index + 1}`} sx={{ mb: 2, bgcolor: 'rgba(46,125,50,0.16)', color: '#b9f6ca' }} />
                          <Typography variant="h6" fontWeight={700} sx={{ color: 'white', mb: 1 }}>
                            {module.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                            {module.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Card sx={{ borderRadius: 4, bgcolor: '#0e1726', border: '1px solid rgba(255,255,255,0.08)', mb: 5 }}>
                <CardContent sx={{ p: 4 }}>
                  <Chip label="Why this cohort exists" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.08)', color: '#67e8f9' }} />
                  <Grid container spacing={2}>
                    {[
                      {
                        title: 'Automated healthcare execution',
                        description: 'Identify workflows where AI and automation can remove friction from clinical and business operations.',
                        icon: <Bolt />,
                      },
                      {
                        title: 'Interoperable system design',
                        description: 'Connect products, data contracts, infrastructure, and regulatory needs into one architecture.',
                        icon: <Hub />,
                      },
                      {
                        title: 'Founder-grade market growth',
                        description: 'Translate technical decisions into narrative, positioning, and venture-ready scale plans.',
                        icon: <ShowChart />,
                      },
                    ].map((item) => (
                      <Grid item xs={12} md={4} key={item.title}>
                        <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
                          <Avatar sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.08)', color: 'white' }}>{item.icon}</Avatar>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white', mb: 1 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                            {item.description}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Box id="instructor" sx={{ position: { lg: 'sticky' }, top: { lg: 100 } }}>
                <Card sx={{ borderRadius: 4, bgcolor: '#0e1726', border: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Avatar
                      src={course.instructor.avatarUrl}
                      alt={course.instructor.name}
                      sx={{ width: 104, height: 104, mb: 2 }}
                    />
                    <Typography variant="h5" fontWeight={800} sx={{ color: 'white', mb: 0.5 }}>
                      {course.instructor.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#90caf9', mb: 0.5 }}>
                      {course.instructor.role}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', mb: 2 }}>
                      {course.instructor.company} · {course.instructor.location}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', mb: 3 }}>
                      {course.instructor.bio}
                    </Typography>

                    <Stack spacing={1.25}>
                      {course.instructor.links.map((link) => (
                        <Button
                          key={link.label}
                          variant="outlined"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          endIcon={<NorthEast />}
                          sx={{ justifyContent: 'space-between', color: 'white', borderColor: 'rgba(255,255,255,0.16)' }}
                        >
                          {link.label}
                        </Button>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 4, bgcolor: '#0e1726', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: 'white', mb: 2 }}>
                      You will leave with
                    </Typography>
                    <Stack spacing={1.5}>
                      {course.outcomes.map((outcome) => (
                        <Box key={outcome} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                          <Engineering sx={{ color: '#90caf9', mt: 0.1, fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                            {outcome}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 4, bgcolor: '#0e1726', border: '1px solid rgba(255,255,255,0.08)', mt: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: 'white', mb: 2 }}>
                      Continue after the cohort
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                        <CalendarMonth sx={{ color: '#67e8f9', mt: 0.15 }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                          Book an implementation session with BrainSAIT to translate learning into startup delivery.
                        </Typography>
                      </Box>
                      <Button variant="outlined" href="https://calendly.com/fadil369" target="_blank" rel="noopener noreferrer" endIcon={<NorthEast />} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)' }}>
                        Book consultation
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>

          <Card sx={{ mt: 5, borderRadius: 4, background: 'linear-gradient(135deg, rgba(25,118,210,0.16) 0%, rgba(46,125,50,0.16) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 1 }}>
                    Ready to join the first BrainSAIT premium course?
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.74)' }}>
                    Enroll through Google Classroom and bring this learning track directly into your incubator execution plan.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={1.5}>
                    <Button variant="contained" size="large" href={course.classroomUrl} target="_blank" rel="noopener noreferrer" endIcon={<Launch />}>
                      Enroll now
                    </Button>
                    <Button variant="outlined" size="large" href="/apply" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)' }} endIcon={<ArrowForward />}>
                      Apply to BrainSAIT
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}