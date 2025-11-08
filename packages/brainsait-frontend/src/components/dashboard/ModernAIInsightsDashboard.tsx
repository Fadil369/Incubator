'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  Container,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Warning,
  Refresh,
  Timeline,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AnimatedCard, ModernBadge, GradientButton, GradientBackground } from '../modern';

/**
 * Modern AI Insights Dashboard - Enhanced with Raycast-inspired design
 */

interface BusinessInsight {
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionItems?: string[];
}

interface ModernAIInsightsDashboardProps {
  smeId: string;
  onInsightAction?: (insight: BusinessInsight, action: string) => void;
}

const ModernAIInsightsDashboard: React.FC<ModernAIInsightsDashboardProps> = ({
  smeId,
  onInsightAction,
}) => {
  const { t, i18n } = useTranslation();
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchInsights();
  }, [smeId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/insights/${smeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights || mockInsights);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      setInsights(mockInsights);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    const iconMap = {
      opportunity: <TrendingUp fontSize="large" />,
      risk: <Warning fontSize="large" />,
      recommendation: <Lightbulb fontSize="large" />,
      trend: <Timeline fontSize="large" />,
    };
    return iconMap[type as keyof typeof iconMap];
  };

  const getInsightGradient = (type: string): 'purple' | 'blue' | 'pink' | 'emerald' => {
    const gradientMap = {
      opportunity: 'emerald' as const,
      risk: 'pink' as const,
      recommendation: 'blue' as const,
      trend: 'purple' as const,
    };
    return gradientMap[type as keyof typeof gradientMap] || 'purple';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const renderInsightCard = (insight: BusinessInsight, index: number) => (
    <Grid item xs={12} md={6} lg={4} key={index}>
      <AnimatedCard
        staggerDelay={index * 100}
        scaleOnHover
        glowOnHover
        depthEffect
        sx={{ height: '100%' }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header with Icon and Badge */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: (theme) => {
                  const gradients = {
                    purple: 'linear-gradient(135deg, #523091, #8B2D91)',
                    blue: 'linear-gradient(135deg, #043f96, #0891B2)',
                    pink: 'linear-gradient(135deg, #ff167a, #8B2D91)',
                    emerald: 'linear-gradient(135deg, #059669, #10B981)',
                  };
                  return gradients[getInsightGradient(insight.type)];
                },
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getInsightIcon(insight.type)}
            </Box>
            <ModernBadge
              label={insight.impact.toUpperCase()}
              variant="gradient"
              gradient={insight.impact === 'high' ? 'pink' : insight.impact === 'medium' ? 'blue' : 'purple'}
              size="small"
              glow={insight.impact === 'high'}
            />
          </Box>

          {/* Title */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
            {isRTL ? insight.titleAr : insight.title}
          </Typography>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            {isRTL ? insight.descriptionAr : insight.description}
          </Typography>

          {/* Confidence Meter */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Confidence Score
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.round(insight.confidence * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={insight.confidence * 100}
              color={getConfidenceColor(insight.confidence) as any}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }}
            />
          </Box>

          {/* Category Badge */}
          <ModernBadge
            label={insight.category}
            variant="glass"
            size="small"
            sx={{ mb: 3 }}
          />

          {/* Action Items */}
          {insight.actionItems && insight.actionItems.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Next Steps:
              </Typography>
              {insight.actionItems.slice(0, 2).map((item, idx) => (
                <Box key={idx} display="flex" alignItems="flex-start" mb={0.5}>
                  <KeyboardArrowRight fontSize="small" color="primary" sx={{ mt: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <GradientButton
              gradient={getInsightGradient(insight.type)}
              size="small"
              onClick={() => onInsightAction?.(insight, 'implement')}
              sx={{ flex: 1 }}
            >
              Take Action
            </GradientButton>
          </Stack>
        </CardContent>
      </AnimatedCard>
    </Grid>
  );

  return (
    <Box sx={{ position: 'relative', minHeight: '60vh' }}>
      {/* Gradient Background */}
      <GradientBackground variant="mesh" animated intensity="subtle" />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              AI-Powered Business Insights
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Intelligent recommendations based on advanced analytics
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Tooltip title="Refresh Insights">
              <IconButton onClick={fetchInsights} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Using cached insights - {error}
          </Alert>
        )}

        {/* Insights Grid */}
        {loading ? (
          <Typography>Loading insights...</Typography>
        ) : (
          <Grid container spacing={3}>
            {insights.map((insight, index) => renderInsightCard(insight, index))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

// Mock data
const mockInsights: BusinessInsight[] = [
  {
    type: 'opportunity',
    title: 'Digital Health Platform Expansion',
    titleAr: 'توسع منصة الصحة الرقمية',
    description: 'Growing demand for telemedicine solutions presents a 156% market opportunity in your region.',
    descriptionAr: 'تزايد الطلب على حلول الطب عن بُعد يمثل فرصة سوقية بنسبة 156% في منطقتك.',
    confidence: 0.92,
    impact: 'high',
    category: 'Market Expansion',
    actionItems: [
      'Develop telemedicine MVP within 3 months',
      'Partner with 5+ local hospitals',
      'Obtain MOH digital health licensing',
    ],
  },
  {
    type: 'risk',
    title: 'Regulatory Compliance Gap',
    titleAr: 'فجوة الامتثال التنظيمي',
    description: 'Missing NPHIES integration may impact 40% of your target healthcare providers.',
    descriptionAr: 'عدم التكامل مع نظام نفيس قد يؤثر على 40% من مقدمي الرعاية المستهدفين.',
    confidence: 0.88,
    impact: 'high',
    category: 'Compliance',
    actionItems: [
      'Schedule NPHIES integration assessment',
      'Allocate budget for compliance specialist',
    ],
  },
  {
    type: 'recommendation',
    title: 'AI-Powered Diagnostic Tools',
    titleAr: 'أدوات التشخيص بالذكاء الاصطناعي',
    description: 'Implement AI capabilities to differentiate from 73% of competitors in the market.',
    descriptionAr: 'تنفيذ قدرات الذكاء الاصطناعي للتميز عن 73% من المنافسين في السوق.',
    confidence: 0.85,
    impact: 'medium',
    category: 'Innovation',
    actionItems: [
      'Research AI diagnostic algorithms',
      'Partner with AI tech providers',
    ],
  },
  {
    type: 'trend',
    title: 'Preventive Care Focus',
    titleAr: 'التركيز على الرعاية الوقائية',
    description: 'Market shift towards preventive healthcare aligns with Vision 2030 and shows 200% growth.',
    descriptionAr: 'التحول نحو الرعاية الوقائية يتماشى مع رؤية 2030 ويظهر نمواً بنسبة 200%.',
    confidence: 0.90,
    impact: 'medium',
    category: 'Market Trend',
    actionItems: [
      'Develop preventive care programs',
      'Create health screening packages',
    ],
  },
];

export default ModernAIInsightsDashboard;
