import { ArrowForward, AutoAwesome, Hub, RocketLaunch } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Chip, Container, Grid, Typography } from '@mui/material';
import { incubatorAppCategories, incubatorApps } from '@/lib/incubator/content';

export default function AppStorePage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Card sx={{ borderRadius: 5, overflow: 'hidden', mb: 5, background: 'linear-gradient(135deg, #101726 0%, #16243b 55%, #0f5f7a 100%)', color: 'white' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Chip icon={<RocketLaunch />} label="Incubator app marketplace" sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white', mb: 2 }} />
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', maxWidth: 860, mb: 2 }}>
              Discover incubator apps, healthcare workflows, and launch-ready automation bundles.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.76)', maxWidth: 780 }}>
              These screens merge the Stitch app-store flows into the BrainSAIT build so founders can browse, install, and connect products directly into the Cloudflare-backed incubator stack.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {incubatorAppCategories.map((category) => (
            <Grid item xs={12} md={4} key={category.slug}>
              <Card sx={{ height: '100%', borderRadius: 4 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Chip label="Category" size="small" sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {category.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {category.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    {category.highlight}
                  </Typography>
                  <Button href={`/app-store/category/${category.slug}`} endIcon={<ArrowForward />}>
                    Explore category
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {incubatorApps.map((app) => (
            <Grid item xs={12} md={6} lg={4} key={app.slug}>
              <Card sx={{ height: '100%', borderRadius: 4 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {app.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {app.startup}
                      </Typography>
                    </Box>
                    <Chip icon={app.category === 'data-sharing' ? <Hub /> : <AutoAwesome />} label={app.category} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {app.shortDescription}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                    {app.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Button href={`/app-store/${app.slug}`} endIcon={<ArrowForward />}>
                    View app detail
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