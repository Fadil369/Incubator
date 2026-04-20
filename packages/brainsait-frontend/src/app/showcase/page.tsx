import { Box, Button, Card, CardContent, Chip, Container, Grid, Typography } from '@mui/material';
import { ArrowForward, EmojiEvents, Public } from '@mui/icons-material';
import { graduationShowcase } from '@/lib/incubator/content';

export default function ShowcasePage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Card sx={{ borderRadius: 5, overflow: 'hidden', mb: 5, background: 'linear-gradient(135deg, #1c0f2f 0%, #3d1f6f 55%, #7c3aed 100%)', color: 'white' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Chip icon={<EmojiEvents />} label="Graduation showcase" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white', mb: 2 }} />
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', maxWidth: 860, mb: 2 }}>
              Public-facing cohort outcomes, startup launches, and ecosystem proof.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 780 }}>
              This route merges the showcase Stitch screens into a reusable cohort view that connects product discovery, training, and incubator outcomes.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          {graduationShowcase.map((cohort) => (
            <Grid item xs={12} key={cohort.year}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {cohort.year}
              </Typography>
              <Grid container spacing={3}>
                {cohort.companies.map((company) => (
                  <Grid item xs={12} md={4} key={`${cohort.year}-${company.name}`}>
                    <Card sx={{ height: '100%', borderRadius: 4 }}>
                      <CardContent sx={{ p: 3.5 }}>
                        <Chip icon={<Public />} label={company.sector} size="small" sx={{ mb: 2 }} />
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {company.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {company.tagline}
                        </Typography>
                        <Button href={company.website} endIcon={<ArrowForward />}>
                          Visit startup
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}