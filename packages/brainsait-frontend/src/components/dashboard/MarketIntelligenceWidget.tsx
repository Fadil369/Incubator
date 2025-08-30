import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Button
} from '@mui/material';
import {
  TrendingUp,
  Business,
  Gavel,
  AccountBalance,
  Info,
  Warning,
  CheckCircle,
  Schedule,
  MonetizationOn,
  LocationOn,
  Refresh
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MarketTrend {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  confidence: number;
  category: 'regulatory' | 'technology' | 'market' | 'government';
}

interface MarketOpportunity {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  marketSize: number;
  growthRate: number;
  difficulty: 'low' | 'medium' | 'high';
  timeToMarket: string;
  potentialROI: number;
  region: string;
  segment: string;
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  titleAr: string;
  authority: 'MOH' | 'NPHIES' | 'SAMA' | 'CITC' | 'MHRSD';
  type: 'new_regulation' | 'amendment' | 'guidance' | 'deadline';
  effectiveDate: Date;
  impact: 'high' | 'medium' | 'low';
  description: string;
  descriptionAr: string;
  actionRequired: string[];
  deadline?: Date;
}

interface GovernmentIncentive {
  id: string;
  program: string;
  programAr: string;
  authority: string;
  type: 'grant' | 'loan' | 'tax_incentive' | 'subsidy' | 'support';
  amount: number;
  deadline: Date;
  description: string;
  descriptionAr: string;
  eligibility: string[];
}

interface MarketIntelligenceWidgetProps {
  industry?: string;
  region?: string;
  businessSize?: string;
}

const MarketIntelligenceWidget: React.FC<MarketIntelligenceWidgetProps> = ({
  industry = 'healthcare',
  region = 'riyadh',
  businessSize = 'sme'
}) => {
  const { t, i18n } = useTranslation();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [regulations, setRegulations] = useState<RegulatoryUpdate[]>([]);
  const [incentives, setIncentives] = useState<GovernmentIncentive[]>([]);

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    loadMarketData();
  }, [industry, region, businessSize]);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      // In production, these would be separate API calls
      await Promise.all([
        loadTrends(),
        loadOpportunities(),
        loadRegulations(),
        loadIncentives()
      ]);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrends = async () => {
    // Mock data - in production, call market intelligence API
    setTrends(mockTrends);
  };

  const loadOpportunities = async () => {
    setOpportunities(mockOpportunities);
  };

  const loadRegulations = async () => {
    setRegulations(mockRegulations);
  };

  const loadIncentives = async () => {
    setIncentives(mockIncentives);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'regulatory':
        return <Gavel />;
      case 'technology':
        return <TrendingUp />;
      case 'market':
        return <Business />;
      case 'government':
        return <AccountBalance />;
      default:
        return <Info />;
    }
  };

  const getImpactColor = (impact: string) => {
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderTrendsTab = () => (
    <Grid container spacing={2}>
      {trends.map((trend) => (
        <Grid item xs={12} md={6} key={trend.id}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {getCategoryIcon(trend.category)}
                <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                  {isRTL ? trend.titleAr : trend.title}
                </Typography>
                <Chip
                  label={trend.impact}
                  color={getImpactColor(trend.impact) as any}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                {isRTL ? trend.descriptionAr : trend.description}
              </Typography>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption">
                  {t('confidence')}: {Math.round(trend.confidence * 100)}%
                </Typography>
                <Typography variant="caption">
                  {t('timeframe')}: {trend.timeframe}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={trend.confidence * 100}
                color={trend.confidence > 0.7 ? 'success' : 'warning'}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderOpportunitiesTab = () => (
    <Grid container spacing={2}>
      {opportunities.map((opportunity) => (
        <Grid item xs={12} md={6} key={opportunity.id}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {isRTL ? opportunity.titleAr : opportunity.title}
                </Typography>
                <Chip
                  label={opportunity.difficulty}
                  color={getDifficultyColor(opportunity.difficulty) as any}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                {isRTL ? opportunity.descriptionAr : opportunity.description}
              </Typography>

              <Box mb={2}>
                <Typography variant="caption" display="block">
                  {t('marketSize')}: {formatCurrency(opportunity.marketSize)}
                </Typography>
                <Typography variant="caption" display="block">
                  {t('growthRate')}: {opportunity.growthRate}%
                </Typography>
                <Typography variant="caption" display="block">
                  {t('potentialROI')}: {opportunity.potentialROI}%
                </Typography>
              </Box>

              <Box display="flex" gap={1}>
                <Chip
                  icon={<LocationOn />}
                  label={opportunity.region}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={opportunity.segment}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderRegulationsTab = () => (
    <List>
      {regulations.map((regulation) => (
        <ListItem key={regulation.id} divider>
          <ListItemIcon>
            <Avatar sx={{ bgcolor: getImpactColor(regulation.impact) + '.main' }}>
              {regulation.authority.charAt(0)}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={isRTL ? regulation.titleAr : regulation.title}
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {isRTL ? regulation.descriptionAr : regulation.description}
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip
                    label={regulation.authority}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={regulation.type}
                    size="small"
                    color={regulation.impact === 'high' ? 'error' : 'default'}
                  />
                  {regulation.deadline && (
                    <Chip
                      icon={<Schedule />}
                      label={regulation.deadline.toLocaleDateString()}
                      size="small"
                      color="warning"
                    />
                  )}
                </Box>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  const renderIncentivesTab = () => (
    <Grid container spacing={2}>
      {incentives.map((incentive) => (
        <Grid item xs={12} md={6} key={incentive.id}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MonetizationOn color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {isRTL ? incentive.programAr : incentive.program}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                {isRTL ? incentive.descriptionAr : incentive.description}
              </Typography>

              <Box mb={2}>
                <Typography variant="subtitle2" color="success.main">
                  {formatCurrency(incentive.amount)}
                </Typography>
                <Typography variant="caption" display="block">
                  {t('authority')}: {incentive.authority}
                </Typography>
                <Typography variant="caption" display="block">
                  {t('deadline')}: {incentive.deadline.toLocaleDateString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" gutterBottom>
                  {t('eligibility')}:
                </Typography>
                {incentive.eligibility.slice(0, 3).map((criteria, idx) => (
                  <Typography key={idx} variant="caption" display="block" color="text.secondary">
                    • {criteria}
                  </Typography>
                ))}
              </Box>

              <Button
                size="small"
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => window.open('/incentives/' + incentive.id, '_blank')}
              >
                {t('viewDetails')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          {t('marketIntelligence')}
        </Typography>
        <Tooltip title={t('refreshData')}>
          <IconButton onClick={loadMarketData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs
        value={currentTab}
        onChange={(event, newValue) => setCurrentTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label={t('marketTrends')} />
        <Tab label={t('opportunities')} />
        <Tab label={t('regulations')} />
        <Tab label={t('incentives')} />
      </Tabs>

      {loading ? (
        <Box p={4} textAlign="center">
          <Typography>{t('loadingMarketData')}</Typography>
        </Box>
      ) : (
        <Box>
          {currentTab === 0 && renderTrendsTab()}
          {currentTab === 1 && renderOpportunitiesTab()}
          {currentTab === 2 && renderRegulationsTab()}
          {currentTab === 3 && renderIncentivesTab()}
        </Box>
      )}
    </Paper>
  );
};

// Mock data
const mockTrends: MarketTrend[] = [
  {
    id: '1',
    title: 'Digital Health Transformation',
    titleAr: 'التحول الرقمي في الصحة',
    description: 'Accelerated adoption of digital health solutions across Saudi healthcare providers.',
    descriptionAr: 'تسريع اعتماد حلول الصحة الرقمية عبر مقدمي الرعاية الصحية في المملكة.',
    impact: 'high',
    timeframe: '6-12 months',
    confidence: 0.9,
    category: 'technology'
  },
  {
    id: '2',
    title: 'NPHIES Mandatory Integration',
    titleAr: 'التكامل الإجباري مع نفيس',
    description: 'All healthcare providers must integrate with NPHIES by Q2 2024.',
    descriptionAr: 'يجب على جميع مقدمي الرعاية الصحية التكامل مع نفيس بحلول الربع الثاني من 2024.',
    impact: 'high',
    timeframe: '3-6 months',
    confidence: 0.95,
    category: 'regulatory'
  }
];

const mockOpportunities: MarketOpportunity[] = [
  {
    id: '1',
    title: 'Rural Telemedicine Services',
    titleAr: 'خدمات الطب عن بُعد الريفية',
    description: 'Underserved rural areas with growing demand for remote healthcare.',
    descriptionAr: 'المناطق الريفية المحرومة مع تزايد الطلب على الرعاية الصحية عن بُعد.',
    marketSize: 500000000,
    growthRate: 35,
    difficulty: 'medium',
    timeToMarket: '6-9 months',
    potentialROI: 150,
    region: 'Rural Saudi Arabia',
    segment: 'Telemedicine'
  }
];

const mockRegulations: RegulatoryUpdate[] = [
  {
    id: '1',
    title: 'Updated NPHIES Standards',
    titleAr: 'معايير نفيس المحدثة',
    authority: 'NPHIES',
    type: 'amendment',
    effectiveDate: new Date('2024-03-01'),
    impact: 'high',
    description: 'New technical requirements for NPHIES integration.',
    descriptionAr: 'متطلبات تقنية جديدة للتكامل مع نفيس.',
    actionRequired: ['Update API integration', 'Test compliance'],
    deadline: new Date('2024-06-01')
  }
];

const mockIncentives: GovernmentIncentive[] = [
  {
    id: '1',
    program: 'Healthcare Innovation Fund',
    programAr: 'صندوق الابتكار في الرعاية الصحية',
    authority: 'Ministry of Health',
    type: 'grant',
    amount: 1000000,
    deadline: new Date('2024-05-31'),
    description: 'Funding for innovative healthcare technology solutions.',
    descriptionAr: 'تمويل لحلول التكنولوجيا الصحية المبتكرة.',
    eligibility: ['Healthcare SME', 'Technology focus', 'Saudi ownership >51%']
  }
];

export default MarketIntelligenceWidget;