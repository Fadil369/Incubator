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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  MonetizationOn,
  People,
  Speed,
  Refresh,
  Analytics,
  ShowChart,
  Timeline
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface PerformanceMetric {
  name: string;
  nameAr: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  target: number;
  unit: string;
  trend: Array<{ date: string; value: number }>;
}

interface BusinessKPI {
  id: string;
  name: string;
  nameAr: string;
  value: number;
  target: number;
  unit: string;
  category: 'financial' | 'operational' | 'growth' | 'customer';
  priority: 'high' | 'medium' | 'low';
  aiInsight?: string;
  aiInsightAr?: string;
}

interface PredictiveAnalytics {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  timeframe: string;
  factors: Array<{ factor: string; impact: number }>;
}

interface PerformanceAnalyticsProps {
  smeId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  smeId,
  timeRange = 'month'
}) => {
  const { t, i18n } = useTranslation();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [kpis, setKPIs] = useState<BusinessKPI[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalytics[]>([]);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    loadPerformanceData();
  }, [smeId, timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // In production, these would call the AI analytics API
      await Promise.all([
        loadMetrics(),
        loadKPIs(),
        loadPredictiveAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    // Mock data - in production, call AI analytics service
    setMetrics(mockMetrics);
  };

  const loadKPIs = async () => {
    setKPIs(mockKPIs);
  };

  const loadPredictiveAnalytics = async () => {
    setPredictions(mockPredictions);
  };

  const getChangeIcon = (changeType: string) => {
    return changeType === 'increase' ? 
      <TrendingUp color="success" /> : 
      <TrendingDown color="error" />;
  };

  const getKPIColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatNumber = (value: number, unit?: string) => {
    const formatter = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
    
    return `${formatter.format(value)}${unit ? ` ${unit}` : ''}`;
  };

  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {isRTL ? metric.nameAr : metric.name}
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(metric.value, metric.unit)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    {getChangeIcon(metric.changeType)}
                    <Typography 
                      variant="caption" 
                      color={metric.changeType === 'increase' ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {Math.abs(metric.change)}%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <CircularProgress
                    variant="determinate"
                    value={(metric.value / metric.target) * 100}
                    color={getKPIColor(metric.value, metric.target) as any}
                  />
                </Box>
              </Box>
              
              <Box mt={2} height={60}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.trend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderKPITab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('businessKPIs')}
          </Typography>
          <List>
            {kpis.map((kpi) => (
              <ListItem key={kpi.id} divider>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1">
                        {isRTL ? kpi.nameAr : kpi.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={kpi.category}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={kpi.priority}
                          size="small"
                          color={getPriorityColor(kpi.priority) as any}
                        />
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          {formatNumber(kpi.value, kpi.unit)} / {formatNumber(kpi.target, kpi.unit)}
                        </Typography>
                        <Typography variant="caption">
                          {Math.round((kpi.value / kpi.target) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(kpi.value / kpi.target) * 100}
                        color={getKPIColor(kpi.value, kpi.target) as any}
                      />
                      {kpi.aiInsight && (
                        <Typography variant="caption" display="block" mt={1} sx={{ fontStyle: 'italic' }}>
                          💡 {isRTL ? kpi.aiInsightAr : kpi.aiInsight}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('kpiDistribution')}
          </Typography>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis.map(kpi => ({
                    name: isRTL ? kpi.nameAr : kpi.name,
                    value: (kpi.value / kpi.target) * 100,
                    category: kpi.category
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${Math.round(entry.value)}%`}
                >
                  {kpis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPredictiveTab = () => (
    <Grid container spacing={3}>
      {predictions.map((prediction, index) => (
        <Grid item xs={12} md={6} key={index}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {prediction.metric}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('current')}
                  </Typography>
                  <Typography variant="h6">
                    {formatNumber(prediction.current)}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    {t('predicted')} ({prediction.timeframe})
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatNumber(prediction.predicted)}
                  </Typography>
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  {t('confidence')}: {Math.round(prediction.confidence * 100)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={prediction.confidence * 100}
                  color={prediction.confidence > 0.7 ? 'success' : 'warning'}
                />
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                {t('keyFactors')}:
              </Typography>
              {prediction.factors.map((factor, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption">
                    {factor.factor}
                  </Typography>
                  <Chip
                    label={`${factor.impact > 0 ? '+' : ''}${factor.impact}%`}
                    size="small"
                    color={factor.impact > 0 ? 'success' : 'error'}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          {t('performanceAnalytics')}
        </Typography>
        <Tooltip title={t('refreshData')}>
          <IconButton onClick={loadPerformanceData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs
        value={currentTab}
        onChange={(event, newValue) => setCurrentTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab icon={<Analytics />} label={t('overview')} />
        <Tab icon={<Assessment />} label={t('kpis')} />
        <Tab icon={<ShowChart />} label={t('predictive')} />
      </Tabs>

      {currentTab === 0 && renderOverviewTab()}
      {currentTab === 1 && renderKPITab()}
      {currentTab === 2 && renderPredictiveTab()}
    </Paper>
  );
};

// Mock data
const mockMetrics: PerformanceMetric[] = [
  {
    name: 'Monthly Revenue',
    nameAr: 'الإيرادات الشهرية',
    value: 850000,
    change: 12.5,
    changeType: 'increase',
    target: 1000000,
    unit: 'SAR',
    trend: [
      { date: '2024-01', value: 650000 },
      { date: '2024-02', value: 720000 },
      { date: '2024-03', value: 780000 },
      { date: '2024-04', value: 850000 }
    ]
  },
  {
    name: 'Patient Satisfaction',
    nameAr: 'رضا المرضى',
    value: 92,
    change: 5.2,
    changeType: 'increase',
    target: 95,
    unit: '%',
    trend: [
      { date: '2024-01', value: 85 },
      { date: '2024-02', value: 88 },
      { date: '2024-03', value: 90 },
      { date: '2024-04', value: 92 }
    ]
  },
  {
    name: 'Operational Efficiency',
    nameAr: 'الكفاءة التشغيلية',
    value: 78,
    change: 8.1,
    changeType: 'increase',
    target: 85,
    unit: '%',
    trend: [
      { date: '2024-01', value: 70 },
      { date: '2024-02', value: 74 },
      { date: '2024-03', value: 76 },
      { date: '2024-04', value: 78 }
    ]
  },
  {
    name: 'Market Share',
    nameAr: 'الحصة السوقية',
    value: 15.2,
    change: -2.1,
    changeType: 'decrease',
    target: 20,
    unit: '%',
    trend: [
      { date: '2024-01', value: 16.5 },
      { date: '2024-02', value: 16.0 },
      { date: '2024-03', value: 15.8 },
      { date: '2024-04', value: 15.2 }
    ]
  }
];

const mockKPIs: BusinessKPI[] = [
  {
    id: '1',
    name: 'Revenue Growth Rate',
    nameAr: 'معدل نمو الإيرادات',
    value: 12.5,
    target: 15,
    unit: '%',
    category: 'financial',
    priority: 'high',
    aiInsight: 'Focus on telemedicine services to accelerate growth',
    aiInsightAr: 'ركز على خدمات الطب عن بُعد لتسريع النمو'
  },
  {
    id: '2',
    name: 'Patient Retention Rate',
    nameAr: 'معدل الاحتفاظ بالمرضى',
    value: 88,
    target: 90,
    unit: '%',
    category: 'customer',
    priority: 'high',
    aiInsight: 'Implement follow-up automation to improve retention',
    aiInsightAr: 'تنفيذ أتمتة المتابعة لتحسين الاحتفاظ'
  },
  {
    id: '3',
    name: 'Average Processing Time',
    nameAr: 'متوسط وقت المعالجة',
    value: 15,
    target: 10,
    unit: 'min',
    category: 'operational',
    priority: 'medium',
    aiInsight: 'Digital queue management can reduce wait times',
    aiInsightAr: 'إدارة الطوابير الرقمية يمكن أن تقلل أوقات الانتظار'
  }
];

const mockPredictions: PredictiveAnalytics[] = [
  {
    metric: 'Revenue Forecast',
    current: 850000,
    predicted: 1200000,
    confidence: 0.82,
    timeframe: 'Next Quarter',
    factors: [
      { factor: 'Seasonal demand increase', impact: 15 },
      { factor: 'New service launch', impact: 25 },
      { factor: 'Market competition', impact: -8 }
    ]
  },
  {
    metric: 'Patient Volume',
    current: 2500,
    predicted: 3200,
    confidence: 0.75,
    timeframe: 'Next 6 months',
    factors: [
      { factor: 'Telemedicine adoption', impact: 20 },
      { factor: 'Referral program', impact: 12 },
      { factor: 'Capacity constraints', impact: -5 }
    ]
  }
];

export default PerformanceAnalytics;