import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  MonetizationOn,
  TrendingUp,
  AccountBalance,
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  Calculate,
  Refresh,
  PieChart,
  Timeline,
  CompareArrows
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface FinancialMetric {
  name: string;
  nameAr: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  period: 'monthly' | 'quarterly' | 'yearly';
  target?: number;
  benchmark?: number;
}

interface CashFlowProjection {
  month: string;
  revenue: number;
  expenses: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  confidence: number;
}

interface FundingOpportunity {
  id: string;
  name: string;
  nameAr: string;
  type: 'grant' | 'loan' | 'equity' | 'debt';
  amount: number;
  authority: string;
  deadline: Date;
  matchScore: number;
  requirements: string[];
  aiRecommendation: string;
  aiRecommendationAr: string;
}

interface InvestmentReadiness {
  overallScore: number;
  categories: Array<{
    name: string;
    nameAr: string;
    score: number;
    weight: number;
    recommendations: string[];
  }>;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
}

interface FinancialIntelligenceDashboardProps {
  smeId: string;
}

const FinancialIntelligenceDashboard: React.FC<FinancialIntelligenceDashboardProps> = ({
  smeId
}) => {
  const { t, i18n } = useTranslation();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowProjection[]>([]);
  const [fundingOpportunities, setFundingOpportunities] = useState<FundingOpportunity[]>([]);
  const [investmentReadiness, setInvestmentReadiness] = useState<InvestmentReadiness | null>(null);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    loadFinancialData();
  }, [smeId]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // In production, these would call the AI financial intelligence API
      await Promise.all([
        loadFinancialMetrics(),
        loadCashFlowProjections(),
        loadFundingOpportunities(),
        loadInvestmentReadiness()
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialMetrics = async () => {
    setMetrics(mockFinancialMetrics);
  };

  const loadCashFlowProjections = async () => {
    setCashFlowData(mockCashFlowData);
  };

  const loadFundingOpportunities = async () => {
    setFundingOpportunities(mockFundingOpportunities);
  };

  const loadInvestmentReadiness = async () => {
    setInvestmentReadiness(mockInvestmentReadiness);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'info';
    }
  };

  const getFundingTypeIcon = (type: string) => {
    switch (type) {
      case 'grant': return <MonetizationOn color="success" />;
      case 'loan': return <AccountBalance color="primary" />;
      case 'equity': return <TrendingUp color="warning" />;
      case 'debt': return <Assessment color="error" />;
      default: return <MonetizationOn />;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Financial Metrics Cards */}
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {isRTL ? metric.nameAr : metric.name}
              </Typography>
              <Typography variant="h5">
                {metric.name.includes('Rate') || metric.name.includes('Ratio') 
                  ? `${metric.value}%` 
                  : formatCurrency(metric.value)
                }
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Chip
                  icon={metric.changeType === 'positive' ? <TrendingUp /> : <TrendingUp style={{ transform: 'rotate(180deg)' }} />}
                  label={`${metric.change > 0 ? '+' : ''}${metric.change}%`}
                  size="small"
                  color={getChangeColor(metric.changeType) as any}
                />
              </Box>
              {metric.target && (
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    {t('target')}: {metric.name.includes('Rate') ? `${metric.target}%` : formatCurrency(metric.target)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Cash Flow Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('cashFlowProjection')}
          </Typography>
          <Box height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name={t('revenue')}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name={t('expenses')}
                />
                <Line
                  type="monotone"
                  dataKey="netCashFlow"
                  stroke="#ff7300"
                  strokeWidth={3}
                  name={t('netCashFlow')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Key Financial Ratios */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('keyFinancialRatios')}
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={t('currentRatio')}
                secondary="2.1 (Healthy)"
              />
              <Chip label="Good" color="success" size="small" />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={t('debtToEquity')}
                secondary="0.35 (Conservative)"
              />
              <Chip label="Low Risk" color="success" size="small" />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={t('profitMargin')}
                secondary="18.5% (Above Average)"
              />
              <Chip label="Strong" color="success" size="small" />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={t('burnRate')}
                secondary="45,000 SAR/month"
              />
              <Chip label="Manageable" color="warning" size="small" />
            </ListItem>
          </List>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFundingTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('fundingOpportunitiesDisclaimer')}
          </Typography>
        </Alert>
      </Grid>

      {fundingOpportunities.map((opportunity) => (
        <Grid item xs={12} md={6} key={opportunity.id}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                {getFundingTypeIcon(opportunity.type)}
                <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                  {isRTL ? opportunity.nameAr : opportunity.name}
                </Typography>
                <Chip
                  label={`${opportunity.matchScore}% Match`}
                  color={getMatchScoreColor(opportunity.matchScore) as any}
                  size="small"
                />
              </Box>

              <Typography variant="h5" color="primary" gutterBottom>
                {formatCurrency(opportunity.amount)}
              </Typography>

              <Box mb={2}>
                <Chip
                  label={opportunity.type}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={opportunity.authority}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  {t('deadline')}: {opportunity.deadline.toLocaleDateString()}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                💡 {isRTL ? opportunity.aiRecommendationAr : opportunity.aiRecommendation}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                {t('requirements')}:
              </Typography>
              <List dense>
                {opportunity.requirements.slice(0, 3).map((req, idx) => (
                  <ListItem key={idx} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CheckCircle fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="caption">
                          {req}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                onClick={() => window.open(`/funding/${opportunity.id}`, '_blank')}
              >
                {t('viewDetails')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderInvestmentReadinessTab = () => (
    <Grid container spacing={3}>
      {investmentReadiness && (
        <>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('investmentReadinessScore')}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="h3" color="primary" sx={{ mr: 2 }}>
                  {investmentReadiness.overallScore}%
                </Typography>
                <Box>
                  <Typography variant="body1">
                    {investmentReadiness.overallScore >= 80 ? t('investmentReady') :
                     investmentReadiness.overallScore >= 60 ? t('nearReady') : t('needsImprovement')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('basedOnKeyCategories')}
                  </Typography>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('category')}</TableCell>
                      <TableCell align="center">{t('score')}</TableCell>
                      <TableCell align="center">{t('weight')}</TableCell>
                      <TableCell>{t('status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {investmentReadiness.categories.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {isRTL ? category.nameAr : category.name}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {category.score}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {category.weight}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category.score >= 70 ? t('good') : category.score >= 50 ? t('fair') : t('needsWork')}
                            color={category.score >= 70 ? 'success' : category.score >= 50 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('actionItems')}
              </Typography>
              
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                {t('strengths')}:
              </Typography>
              <List dense>
                {investmentReadiness.strengths.map((strength, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CheckCircle fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="caption">
                          {strength}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ mt: 2 }}>
                {t('areasForImprovement')}:
              </Typography>
              <List dense>
                {investmentReadiness.weaknesses.map((weakness, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Warning fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="caption">
                          {weakness}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                {t('nextSteps')}:
              </Typography>
              <List dense>
                {investmentReadiness.nextSteps.map((step, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Schedule fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="caption">
                          {step}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </>
      )}
    </Grid>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          {t('financialIntelligence')}
        </Typography>
        <Tooltip title={t('refreshData')}>
          <IconButton onClick={loadFinancialData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs
        value={currentTab}
        onChange={(event, newValue) => setCurrentTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab icon={<PieChart />} label={t('overview')} />
        <Tab icon={<MonetizationOn />} label={t('funding')} />
        <Tab icon={<Assessment />} label={t('investmentReadiness')} />
      </Tabs>

      {currentTab === 0 && renderOverviewTab()}
      {currentTab === 1 && renderFundingTab()}
      {currentTab === 2 && renderInvestmentReadinessTab()}
    </Paper>
  );
};

// Mock data
const mockFinancialMetrics: FinancialMetric[] = [
  {
    name: 'Monthly Revenue',
    nameAr: 'الإيرادات الشهرية',
    value: 850000,
    change: 12.5,
    changeType: 'positive',
    period: 'monthly',
    target: 1000000
  },
  {
    name: 'Gross Profit Margin',
    nameAr: 'هامش الربح الإجمالي',
    value: 68.5,
    change: 3.2,
    changeType: 'positive',
    period: 'monthly',
    target: 70,
    benchmark: 65
  },
  {
    name: 'Operating Expenses',
    nameAr: 'النفقات التشغيلية',
    value: 420000,
    change: -5.8,
    changeType: 'positive',
    period: 'monthly'
  },
  {
    name: 'Cash Runway',
    nameAr: 'مدة النقد',
    value: 18,
    change: 2.1,
    changeType: 'positive',
    period: 'monthly'
  }
];

const mockCashFlowData: CashFlowProjection[] = [
  { month: 'Jan', revenue: 650000, expenses: 450000, netCashFlow: 200000, cumulativeCashFlow: 200000, confidence: 0.9 },
  { month: 'Feb', revenue: 720000, expenses: 480000, netCashFlow: 240000, cumulativeCashFlow: 440000, confidence: 0.85 },
  { month: 'Mar', revenue: 780000, expenses: 510000, netCashFlow: 270000, cumulativeCashFlow: 710000, confidence: 0.8 },
  { month: 'Apr', revenue: 850000, expenses: 530000, netCashFlow: 320000, cumulativeCashFlow: 1030000, confidence: 0.75 },
  { month: 'May', revenue: 920000, expenses: 550000, netCashFlow: 370000, cumulativeCashFlow: 1400000, confidence: 0.7 },
  { month: 'Jun', revenue: 1000000, expenses: 580000, netCashFlow: 420000, cumulativeCashFlow: 1820000, confidence: 0.65 }
];

const mockFundingOpportunities: FundingOpportunity[] = [
  {
    id: '1',
    name: 'Healthcare Innovation Grant',
    nameAr: 'منحة الابتكار في الرعاية الصحية',
    type: 'grant',
    amount: 2000000,
    authority: 'Ministry of Health',
    deadline: new Date('2024-06-30'),
    matchScore: 85,
    requirements: ['Healthcare technology focus', 'Saudi ownership >51%', 'Innovation component'],
    aiRecommendation: 'High match - emphasize your telemedicine platform in application',
    aiRecommendationAr: 'تطابق عالي - أكد على منصة الطب عن بُعد في الطلب'
  },
  {
    id: '2',
    name: 'SME Development Loan',
    nameAr: 'قرض تطوير المنشآت الصغيرة والمتوسطة',
    type: 'loan',
    amount: 5000000,
    authority: 'Saudi Industrial Development Fund',
    deadline: new Date('2024-08-15'),
    matchScore: 72,
    requirements: ['Established business >2 years', 'Financial statements', 'Business plan'],
    aiRecommendation: 'Good fit - prepare detailed expansion plan to strengthen application',
    aiRecommendationAr: 'مناسب جيد - أعد خطة توسع مفصلة لتقوية الطلب'
  }
];

const mockInvestmentReadiness: InvestmentReadiness = {
  overallScore: 78,
  categories: [
    {
      name: 'Financial Performance',
      nameAr: 'الأداء المالي',
      score: 82,
      weight: 30,
      recommendations: ['Improve cash flow visibility', 'Reduce customer concentration risk']
    },
    {
      name: 'Market Position',
      nameAr: 'الموقع السوقي',
      score: 75,
      weight: 25,
      recommendations: ['Strengthen competitive advantages', 'Expand market share']
    },
    {
      name: 'Management Team',
      nameAr: 'فريق الإدارة',
      score: 80,
      weight: 20,
      recommendations: ['Add technical advisor', 'Strengthen board composition']
    },
    {
      name: 'Technology & IP',
      nameAr: 'التكنولوجيا والملكية الفكرية',
      score: 70,
      weight: 15,
      recommendations: ['File additional patents', 'Improve technology documentation']
    },
    {
      name: 'Legal & Compliance',
      nameAr: 'القانونية والامتثال',
      score: 85,
      weight: 10,
      recommendations: ['Update data protection policies']
    }
  ],
  strengths: [
    'Strong revenue growth trajectory',
    'Excellent regulatory compliance',
    'Experienced management team',
    'Clear market opportunity'
  ],
  weaknesses: [
    'Limited intellectual property portfolio',
    'Customer concentration risk',
    'Need for technology infrastructure scaling'
  ],
  nextSteps: [
    'Prepare comprehensive pitch deck',
    'Conduct third-party financial audit',
    'Develop 3-year strategic plan',
    'Strengthen IP protection strategy'
  ]
};

export default FinancialIntelligenceDashboard;