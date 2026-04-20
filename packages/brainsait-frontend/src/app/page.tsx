'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Paper,
} from '@mui/material';
import {
  Business,
  Analytics,
  People,
  TrendingUp,
  School,
  AutoAwesome,
  OpenInNew,
  Star,
} from '@mui/icons-material';

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
        {/* Hero Section */}
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
            <Button variant="contained" size="large" color="primary">
              Get Started
            </Button>
            <Button variant="outlined" size="large" color="primary">
              ابدأ الآن
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
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

        {/* 🎓 New Course Announcement */}
        <Paper
          elevation={0}
          sx={{
            mt: 8,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1B5E20 0%, #1565C0 60%, #0D47A1 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative glow circles */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.07)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.05)',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Badge row */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Chip
                icon={<AutoAwesome sx={{ color: '#FFD700 !important' }} />}
                label="NEW COURSE — دورة جديدة"
                sx={{
                  bgcolor: 'rgba(255,215,0,0.18)',
                  color: '#FFD700',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: 0.5,
                  border: '1px solid rgba(255,215,0,0.4)',
                }}
              />
              <Chip
                icon={<Star sx={{ color: '#fff !important' }} />}
                label="Google Classroom"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              />
            </Box>

            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      fontSize: '1.8rem',
                    }}
                  >
                    🎓
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="h2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      BrainSAIT Learning Hub
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.85 }}>
                      منصة برين سايت التعليمية
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h5" component="p" sx={{ mb: 1.5, fontWeight: 700 }}>
                  🚀 New Course Now Open for Enrollment!
                </Typography>
                <Typography variant="h6" component="p" sx={{ mb: 3, opacity: 0.9, fontWeight: 500 }}>
                  دورة جديدة — التسجيل مفتوح الآن!
                </Typography>

                <Typography variant="body1" sx={{ mb: 1.5, opacity: 0.9, maxWidth: 520 }}>
                  Unlock your potential with our latest course on healthcare digital transformation,
                  AI adoption, and SME innovation — designed for the Arab world's emerging healthcare ecosystem.
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.85, maxWidth: 520 }}>
                  طوّر مهاراتك في التحول الرقمي للرعاية الصحية واعتماد الذكاء الاصطناعي وابتكار المشاريع الصغيرة
                  والمتوسطة — مصممة لبيئة الرعاية الصحية الناشئة في العالم العربي.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<OpenInNew />}
                    href="https://classroom.google.com/c/ODYwNTAyNzAzMTky?cjc=4oc22gvm"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      bgcolor: '#FFD700',
                      color: '#1B3A1F',
                      fontWeight: 800,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      '&:hover': {
                        bgcolor: '#FFC200',
                        boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
                      },
                    }}
                  >
                    Enroll Now — سجّل الآن
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    href="https://classroom.google.com/c/ODYwNTAyNzAzMTky?cjc=4oc22gvm"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderColor: 'rgba(255,255,255,0.6)',
                      color: '#fff',
                      px: 3,
                      py: 1.5,
                      '&:hover': {
                        borderColor: '#fff',
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    Learn More — اعرف أكثر
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    p: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" /> What you&apos;ll gain
                  </Typography>
                  {[
                    { en: 'Healthcare AI & Digital Tools', ar: 'الذكاء الاصطناعي والأدوات الرقمية للرعاية الصحية' },
                    { en: 'SME Incubation Strategies', ar: 'استراتيجيات احتضان الشركات الصغيرة' },
                    { en: 'Regulatory Compliance (SFDA, CBAHI)', ar: 'الامتثال التنظيمي (هيئة الغذاء والدواء، CBAHI)' },
                    { en: 'Pitch & Fundraising Skills', ar: 'مهارات العرض وجمع التمويل' },
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Box
                        sx={{
                          mt: 0.4,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#FFD700',
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {item.en}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {item.ar}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  <Box
                    sx={{
                      mt: 2.5,
                      pt: 2,
                      borderTop: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <TrendingUp fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Join Code: <strong>4oc22gvm</strong>
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Call to Action */}
        <Box textAlign="center" sx={{ mt: 8, py: 6, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Transform Your Healthcare Business?
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
            هل أنت مستعد لتحويل عملك في مجال الرعاية الصحية؟
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Join our platform and access comprehensive tools, expert guidance, and a supportive community 
            to accelerate your healthcare SME's growth and digital transformation journey.
          </Typography>
          <Button variant="contained" size="large" color="primary">
            Join BrainSAIT Today
          </Button>
        </Box>
      </Box>
    </Container>
  );
}