import {
  ArrowForward,
  AutoAwesome,
  Hub,
  MenuBook,
  Psychology,
  School,
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
} from '@mui/material';
import { featuredTrainingCourse } from '@/lib/training/catalog';

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
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" href="/">
            BrainSAIT
          </Link>
          <Typography color="text.primary">Training</Typography>
        </Breadcrumbs>

        <Card
          sx={{
            borderRadius: 5,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0b1220 0%, #10213a 55%, #15406b 100%)',
            color: 'white',
            mb: 5,
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Chip label="Training and Courses Module" sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', mb: 2 }} />
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', maxWidth: 760, mb: 2 }}>
              BrainSAIT learning now lives inside the product.
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 780, mb: 4, fontWeight: 400 }}>
              Explore curated courses built for healthcare founders and transformation teams who need sharper strategy, better systems, and practical AI execution.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" href="/training/courses/collective-brainpower" endIcon={<ArrowForward />}>
                View first course
              </Button>
              <Button variant="outlined" size="large" href="/apply" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.24)' }}>
                Apply to program
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {FIT_STEPS.map((step) => (
            <Grid item xs={12} md={4} key={step.title}>
              <Card sx={{ height: '100%', borderRadius: 4 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: 'primary.light', color: 'primary.main', mb: 2 }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
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
                <Chip icon={<AutoAwesome />} label="Featured Course" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {featuredTrainingCourse.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {featuredTrainingCourse.description}
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {featuredTrainingCourse.focusAreas.map((area) => (
                    <Grid item xs={12} sm={4} key={area.title}>
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
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
      </Box>
    </Container>
  );
}