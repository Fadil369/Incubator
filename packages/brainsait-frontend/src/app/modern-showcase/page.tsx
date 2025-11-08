'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  CardContent,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Rocket,
  Speed,
  EmojiEvents,
  Stars,
  AutoAwesome,
} from '@mui/icons-material';
import {
  GlassCard,
  GradientButton,
  AnimatedCard,
  ModernBadge,
  StaggeredGrid,
  GradientBackground,
} from '../../components/modern';
import { ThemeToggle } from '../../components/common/ThemeToggle';

/**
 * Modern Showcase Page - Demonstrates Raycast-inspired design system
 */

export default function ModernShowcasePage() {
  const metrics = [
    {
      title: 'Active Startups',
      value: '127',
      change: '+12%',
      icon: <Rocket />,
      gradient: 'purple' as const,
    },
    {
      title: 'Success Rate',
      value: '94%',
      change: '+8%',
      icon: <TrendingUp />,
      gradient: 'blue' as const,
    },
    {
      title: 'Avg. Growth',
      value: '156%',
      change: '+23%',
      icon: <Speed />,
      gradient: 'emerald' as const,
    },
    {
      title: 'Awards Won',
      value: '42',
      change: '+5',
      icon: <EmojiEvents />,
      gradient: 'pink' as const,
    },
  ];

  const features = [
    {
      title: 'AI-Powered Insights',
      titleAr: 'رؤى مدعومة بالذكاء الاصطناعي',
      description: 'Get intelligent recommendations powered by advanced machine learning algorithms.',
      descriptionAr: 'احصل على توصيات ذكية مدعومة بخوارزميات التعلم الآلي المتقدمة.',
      icon: <AutoAwesome fontSize="large" />,
      progress: 85,
    },
    {
      title: 'Real-time Analytics',
      titleAr: 'تحليلات فورية',
      description: 'Monitor your performance with real-time data visualization and reporting.',
      descriptionAr: 'راقب أداءك من خلال تصور البيانات والتقارير في الوقت الفعلي.',
      icon: <Speed fontSize="large" />,
      progress: 92,
    },
    {
      title: 'Smart Automation',
      titleAr: 'أتمتة ذكية',
      description: 'Automate workflows and save time with intelligent process optimization.',
      descriptionAr: 'أتمتة سير العمل ووفر الوقت من خلال تحسين العمليات الذكية.',
      icon: <Stars fontSize="large" />,
      progress: 78,
    },
  ];

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Animated Gradient Background */}
      <GradientBackground variant="mesh" animated intensity="medium" />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
          <Box>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
              Modern Design System
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Raycast-inspired components for BrainSAIT Platform
            </Typography>
            <Stack direction="row" spacing={1}>
              <ModernBadge label="Glass-morphism" variant="glass" />
              <ModernBadge label="Dark Mode" variant="gradient" gradient="purple" glow />
              <ModernBadge label="Animations" variant="gradient" gradient="blue" />
              <ModernBadge label="RTL Support" variant="outlined" />
            </Stack>
          </Box>
          <ThemeToggle />
        </Box>

        {/* Metrics Grid */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Platform Metrics
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <AnimatedCard staggerDelay={index * 100} depthEffect scaleOnHover glowOnHover>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: (theme) =>
                          `linear-gradient(135deg, ${
                            metric.gradient === 'purple'
                              ? '#523091'
                              : metric.gradient === 'blue'
                              ? '#043f96'
                              : metric.gradient === 'emerald'
                              ? '#059669'
                              : '#ff167a'
                          }, ${
                            metric.gradient === 'purple'
                              ? '#8B2D91'
                              : metric.gradient === 'blue'
                              ? '#0891B2'
                              : metric.gradient === 'emerald'
                              ? '#10B981'
                              : '#8B2D91'
                          })`,
                        color: '#FFFFFF',
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <ModernBadge
                      label={metric.change}
                      variant="glass"
                      size="small"
                      sx={{ color: 'success.main' }}
                    />
                  </Box>
                  <Typography variant="h3" sx={{ mb: 0.5, fontWeight: 700 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.title}
                  </Typography>
                </CardContent>
              </AnimatedCard>
            </Grid>
          ))}
        </Grid>

        {/* Glass Cards Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Glass-morphism Components
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <GlassCard variant="dark" intensity="medium" hover glow>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      mb: 2,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 60,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {feature.description}
                  </Typography>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feature.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={feature.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      }}
                    />
                  </Box>
                </CardContent>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Gradient Buttons Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Modern Buttons
        </Typography>
        <GlassCard variant="light" intensity="subtle" sx={{ mb: 6 }}>
          <CardContent>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <GradientButton gradient="purple" glow>
                Purple Gradient
              </GradientButton>
              <GradientButton gradient="blue" glow>
                Blue Gradient
              </GradientButton>
              <GradientButton gradient="pink" glow>
                Pink Gradient
              </GradientButton>
              <GradientButton gradient="emerald" glow>
                Emerald Gradient
              </GradientButton>
              <GradientButton gradient="primary" elevation={false}>
                Primary
              </GradientButton>
              <GradientButton gradient="secondary" elevation={false}>
                Secondary
              </GradientButton>
            </Stack>
          </CardContent>
        </GlassCard>

        {/* Badges Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Modern Badges
        </Typography>
        <GlassCard variant="gradient" gradient="purple" sx={{ mb: 6 }}>
          <CardContent>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <ModernBadge label="Solid Badge" variant="solid" />
              <ModernBadge label="Outlined Badge" variant="outlined" />
              <ModernBadge label="Glass Badge" variant="glass" />
              <ModernBadge label="Purple Gradient" variant="gradient" gradient="purple" />
              <ModernBadge label="Blue Gradient" variant="gradient" gradient="blue" />
              <ModernBadge label="Glow Effect" variant="gradient" gradient="pink" glow />
              <ModernBadge label="Pulse Animation" variant="gradient" gradient="emerald" pulse />
            </Stack>
          </CardContent>
        </GlassCard>

        {/* Call to Action */}
        <Box textAlign="center" sx={{ mt: 8, mb: 4 }}>
          <GlassCard variant="gradient" gradient="blue" intensity="strong" glow>
            <CardContent sx={{ py: 6 }}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                Ready to Transform Your Startup?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: 'rgba(255,255,255,0.9)' }}>
                Join BrainSAIT Platform and accelerate your healthcare innovation journey
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <GradientButton gradient="pink" glow size="large">
                  Get Started
                </GradientButton>
                <GradientButton gradient="purple" size="large">
                  Learn More
                </GradientButton>
              </Stack>
            </CardContent>
          </GlassCard>
        </Box>
      </Container>
    </Box>
  );
}
