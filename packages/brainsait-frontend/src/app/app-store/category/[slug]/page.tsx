import { notFound } from 'next/navigation';
import { ArrowForward } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Chip, Container, Grid, Typography } from '@mui/material';
import { getIncubatorAppsByCategory, getIncubatorCategoryBySlug, incubatorAppCategories } from '@/lib/incubator/content';

export function generateStaticParams() {
  return incubatorAppCategories.map((category) => ({ slug: category.slug }));
}

export default function AppCategoryPage({ params }: { params: { slug: string } }) {
  const category = getIncubatorCategoryBySlug(params.slug);
  if (!category) notFound();

  const apps = getIncubatorAppsByCategory(category.slug);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Typography variant="overline" color="primary.main">Marketplace category</Typography>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          {category.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 780, mb: 4 }}>
          {category.description} {category.highlight}
        </Typography>
        <Grid container spacing={3}>
          {apps.map((app) => (
            <Grid item xs={12} md={6} key={app.slug}>
              <Card sx={{ height: '100%', borderRadius: 4 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Chip label={app.startup} size="small" sx={{ mb: 2 }} />
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {app.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {app.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                    {app.compliance.map((item) => (
                      <Chip key={item} label={item} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Button href={`/app-store/${app.slug}`} endIcon={<ArrowForward />}>
                    Open product page
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}