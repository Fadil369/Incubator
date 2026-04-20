import type { Metadata } from 'next';
import React from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
} from '@mui/material';
import {
  Business,
  Analytics,
  People,
  TrendingUp,
} from '@mui/icons-material';

export const metadata: Metadata = {
  title: 'BrainSAIT | Healthcare SME Incubator — Saudi Arabia & MENA',
  description: 'BrainSAIT accelerates healthcare startups in Saudi Arabia and MENA with AI-powered mentorship, NPHIES compliance tools, FHIR R4 SDKs, and incubation programs.',
  keywords: 'healthcare incubator, Saudi Arabia, MENA, NPHIES, FHIR, AI healthcare, digital health startup',
  openGraph: {
    title: 'BrainSAIT Healthcare SME Incubator',
    description: 'AI-native incubation for healthcare SMEs in Saudi Arabia & MENA',
    url: 'https://brainsait.org',
    siteName: 'BrainSAIT',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrainSAIT Healthcare SME Incubator',
    description: 'AI-native incubation for healthcare SMEs in Saudi Arabia & MENA',
  },
  alternates: { canonical: 'https://brainsait.org' },
};

export default function HomePage() {
  const features = [
    {
      icon: <Business />,
      title: 'SME Incubation',
      titleAr: 'احتضان الشركات الصغيرة والمتوسطة',
      description: 'Comprehensive support for healthcare startups and SMEs',
      descriptionAr: 'دعم شامل للشركات الناشئة والصغيرة والمتوسطة في مجال الرعاية الصحية',
    },
    {
      icon: <Analytics />,
      title: 'Digital Transformation',
      titleAr: 'التحول الرقمي',
      description: 'Advanced analytics and digital tools for business growth',
      descriptionAr: 'تحليلات متقدمة وأدوات رقمية لنمو الأعمال',
    },
    {
      icon: <People />,
      title: 'Expert Mentorship',
      titleAr: 'الإرشاد المتخصص',
      description: 'Connect with industry experts and experienced mentors',
      descriptionAr: 'تواصل مع خبراء الصناعة والموجهين ذوي الخبرة',
    },
    {
      icon: <TrendingUp />,
      title: 'Growth Acceleration',
      titleAr: 'تسريع النمو',
      description: 'Accelerate your business growth with proven strategies',
      descriptionAr: 'سرّع نمو عملك باستراتيجيات مثبتة',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 3,
              fontSize: '2rem',
            }}
          >
            🧠
          </Avatar>
          <Typography variant="h1" component="h1" gutterBottom>
            BrainSAIT Platform
          </Typography>
          <Typography variant="h2" component="h2" color="text.secondary" gutterBottom>
            منصة برين سايت
          </Typography>
          <Typography variant="h5" component="p" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Empowering Healthcare SMEs through Digital Transformation and Innovation
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            تمكين الشركات الصغيرة والمتوسطة في مجال الرعاية الصحية من خلال التحول الرقمي والابتكار
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" color="primary" href="/apply">
              Apply to Incubator
            </Button>
            <Button variant="outlined" size="large" color="primary" href="/apply">
              قدّم طلبك الآن
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'secondary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="h6" component="h3" gutterBottom color="text.secondary">
                    {feature.titleAr}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {feature.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.descriptionAr}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" sx={{ mt: 8, py: 6, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Transform Your Healthcare Business?
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
            هل أنت مستعد لتحويل عملك في مجال الرعاية الصحية؟
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Join our platform and access comprehensive tools, expert guidance, and a supportive community
            to accelerate your healthcare SME&apos;s growth and digital transformation journey.
          </Typography>
          <Button variant="contained" size="large" color="primary" href="/apply">
            Join BrainSAIT Today
          </Button>
        </Box>
      </Box>
    </Container>
  );
}