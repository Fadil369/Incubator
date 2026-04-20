import { notFound } from 'next/navigation';
import { Box, Button, Card, CardContent, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { CheckCircle, OpenInNew } from '@mui/icons-material';
import AppActionPanel from '@/components/incubator/AppActionPanel';
import { getIncubatorAppBySlug, incubatorApps } from '@/lib/incubator/content';

export function generateStaticParams() {
  return incubatorApps.map((app) => ({ slug: app.slug }));
}

export default function AppDetailPage({ params }: { params: { slug: string } }) {
  const app = getIncubatorAppBySlug(params.slug);
  if (!app) notFound();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip label={app.category} color="primary" />
          <Chip label={app.startup} variant="outlined" />
        </Stack>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          {app.name}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1.5, maxWidth: 780, fontWeight: 400 }}>
          {app.tagline}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820, mb: 4 }}>
          {app.description}
        </Typography>

        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ borderRadius: 4, mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Product highlights
                </Typography>
                <Grid container spacing={2}>
                  {app.features.map((feature) => (
                    <Grid item xs={12} sm={6} key={feature.title}>
                      <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Screens and pricing
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {app.screenshots.map((shot) => (
                    <Grid item xs={12} md={4} key={shot.title}>
                      <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          {shot.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Visual exported in the Stitch package and ready for design handoff.
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Grid container spacing={2}>
                  {app.pricingTiers.map((tier) => (
                    <Grid item xs={12} md={4} key={tier.name}>
                      <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: tier.featured ? 'primary.main' : 'divider', height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={700}>{tier.name}</Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ my: 1 }}>{tier.price}</Typography>
                        <Stack spacing={0.75} sx={{ mb: 2 }}>
                          {tier.features.map((feature) => (
                            <Typography variant="body2" color="text.secondary" key={feature}>{feature}</Typography>
                          ))}
                        </Stack>
                        <Button variant={tier.featured ? 'contained' : 'outlined'}>{tier.ctaLabel}</Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Stack spacing={3}>
              <AppActionPanel appSlug={app.slug} appName={app.name} appCategory={app.category} installEvent={app.installEvent} />
              <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Metrics and compliance
                  </Typography>
                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {app.metrics.map((metric) => (
                      <Box key={metric.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>{metric.value}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Stack spacing={1}>
                    {app.compliance.map((item) => (
                      <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle color="success" fontSize="small" />
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                    <Button href={app.githubUrl} target="_blank" rel="noopener noreferrer" endIcon={<OpenInNew />}>
                      GitHub
                    </Button>
                    {app.demoUrl && (
                      <Button href={app.demoUrl} variant="outlined">
                        Open demo route
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}