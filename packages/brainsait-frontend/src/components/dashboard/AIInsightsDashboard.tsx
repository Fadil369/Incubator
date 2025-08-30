import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Fade,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Warning,
  Refresh,
  Analytics,
  Timeline,
  Assessment
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

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
  data?: Record<string, any>;
}

interface AIInsightsDashboardProps {
  smeId: string;
  onInsightAction?: (insight: BusinessInsight, action: string) => void;
}

const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({
  smeId,
  onInsightAction
}) => {
  const { t, i18n } = useTranslation();
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(true);
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

      // In production, this would call the AI analytics service
      const response = await fetch(`/api/ai/insights/${smeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setLastUpdated(new Date());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      // Mock data for development
      setInsights(mockInsights);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp color="success" />;
      case 'risk':
        return <Warning color="warning" />;
      case 'recommendation':
        return <Lightbulb color="info" />;
      case 'trend':
        return <Timeline color="primary" />;
      default:
        return <Analytics />;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const handleInsightAction = (insight: BusinessInsight, action: string) => {
    if (onInsightAction) {
      onInsightAction(insight, action);
    }
  };

  const renderInsightCard = (insight: BusinessInsight, index: number) => (
    <Fade in={true} timeout={300 + index * 100} key={index}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" mb={2}>
            {getInsightIcon(insight.type)}
            <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
              {isRTL ? insight.titleAr : insight.title}
            </Typography>
            <Chip
              label={insight.impact}
              color={getInsightColor(insight.impact) as any}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" mb={2}>
            {isRTL ? insight.descriptionAr : insight.description}
          </Typography>

          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary">
                {t('confidence')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(insight.confidence * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={insight.confidence * 100}
              color={getConfidenceColor(insight.confidence) as any}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          <Chip
            label={insight.category}
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />

          {insight.actionItems && insight.actionItems.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('actionItems')}
              </Typography>
              {insight.actionItems.slice(0, 3).map((item, idx) => (
                <Typography key={idx} variant="caption" display="block" color="text.secondary">
                  • {item}
                </Typography>
              ))}
            </Box>
          )}
        </CardContent>

        <Box p={2} pt={0}>
          <Button
            size="small"
            onClick={() => handleInsightAction(insight, 'view_details')}
            sx={{ mr: 1 }}
          >
            {t('viewDetails')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleInsightAction(insight, 'implement')}
          >
            {t('implement')}
          </Button>
        </Box>
      </Card>
    </Fade>
  );

  if (loading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">{t('aiInsights')}</Typography>
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={6} lg={3} key={item}>
              <Skeleton variant="rectangular" height={280} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('aiInsights')}</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              {t('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title={t('refreshInsights')}>
            <IconButton onClick={fetchInsights} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {insights.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Analytics sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('noInsightsAvailable')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t('aiInsightsDescription')}
          </Typography>
          <Button variant="contained" onClick={fetchInsights}>
            {t('generateInsights')}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {insights.map((insight, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              {renderInsightCard(insight, index)}
            </Grid>
          ))}
        </Grid>
      )}

      {insights.length > 0 && (
        <Box mt={4} textAlign="center">
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={() => window.open('/ai/detailed-analysis', '_blank')}
          >
            {t('viewDetailedAnalysis')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Mock data for development
const mockInsights: BusinessInsight[] = [
  {
    type: 'opportunity',
    title: 'Digital Health Platform Expansion',
    titleAr: 'توسع منصة الصحة الرقمية',
    description: 'Growing demand for telemedicine solutions in your region presents a significant market opportunity.',
    descriptionAr: 'تزايد الطلب على حلول الطب عن بُعد في منطقتك يمثل فرصة سوقية كبيرة.',
    confidence: 0.85,
    impact: 'high',
    category: 'Market Expansion',
    actionItems: [
      'Develop telemedicine platform',
      'Partner with local hospitals',
      'Obtain MOH digital health licensing'
    ]
  },
  {
    type: 'risk',
    title: 'Regulatory Compliance Gap',
    titleAr: 'فجوة الامتثال التنظيمي',
    description: 'Missing NPHIES integration may impact your ability to serve healthcare providers.',
    descriptionAr: 'عدم التكامل مع نظام نفيس قد يؤثر على قدرتك على خدمة مقدمي الرعاية الصحية.',
    confidence: 0.92,
    impact: 'high',
    category: 'Compliance',
    actionItems: [
      'Schedule NPHIES integration assessment',
      'Hire compliance specialist',
      'Update system architecture'
    ]
  },
  {
    type: 'recommendation',
    title: 'AI-Powered Diagnostic Tools',
    titleAr: 'أدوات التشخيص المدعومة بالذكاء الاصطناعي',
    description: 'Implement AI diagnostic capabilities to differentiate from competitors.',
    descriptionAr: 'تنفيذ قدرات التشخيص بالذكاء الاصطناعي للتميز عن المنافسين.',
    confidence: 0.78,
    impact: 'medium',
    category: 'Innovation',
    actionItems: [
      'Research AI diagnostic algorithms',
      'Partner with AI technology providers',
      'Pilot test with select clinics'
    ]
  },
  {
    type: 'trend',
    title: 'Preventive Care Focus',
    titleAr: 'التركيز على الرعاية الوقائية',
    description: 'Shift towards preventive healthcare aligns with Vision 2030 objectives.',
    descriptionAr: 'التوجه نحو الرعاية الصحية الوقائية يتماشى مع أهداف رؤية 2030.',
    confidence: 0.88,
    impact: 'medium',
    category: 'Market Trend',
    actionItems: [
      'Develop preventive care programs',
      'Create health screening packages',
      'Partner with wellness centers'
    ]
  }
];

export default AIInsightsDashboard;