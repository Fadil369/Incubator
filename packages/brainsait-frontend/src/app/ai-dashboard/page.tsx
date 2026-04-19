'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  Alert
} from '@mui/material';
import {
  Dashboard,
  TrendingUp,
  Assessment,
  MonetizationOn,
  Psychology,
  Description
} from '@mui/icons-material';

// Import our AI dashboard components
import AIInsightsDashboard from '@/components/dashboard/AIInsightsDashboard';
import MarketIntelligenceWidget from '@/components/dashboard/MarketIntelligenceWidget';
import PerformanceAnalytics from '@/components/dashboard/PerformanceAnalytics';
import FinancialIntelligenceDashboard from '@/components/dashboard/FinancialIntelligenceDashboard';
import TemplateIntelligence from '@/components/documents/TemplateIntelligence';
import CollaborativeEditor from '@/components/documents/CollaborativeEditor';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AIDashboardPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Mock SME ID - in production this would come from authentication
  const smeId = 'sme-123';

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleInsightAction = (insight: any, action: string) => {
    console.log('Insight action:', action, insight);
    // In production, implement specific actions like:
    // - Navigate to detailed analysis
    // - Create action items
    // - Schedule follow-ups
    // - Export insights
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">
            BrainSAIT
          </Link>
          <Link underline="hover" color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">AI Intelligence</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            🤖 AI-Powered Business Intelligence
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Advanced analytics and insights for Saudi healthcare SMEs
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This AI dashboard provides real-time insights, market intelligence, and predictive analytics 
              specifically tailored for healthcare SMEs in Saudi Arabia. All recommendations are generated 
              using advanced AI models and consider local market conditions and regulations.
            </Typography>
          </Alert>
        </Box>

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<Psychology />}
              label="AI Insights"
              id="ai-tab-0"
              aria-controls="ai-tabpanel-0"
            />
            <Tab
              icon={<TrendingUp />}
              label="Market Intelligence"
              id="ai-tab-1"
              aria-controls="ai-tabpanel-1"
            />
            <Tab
              icon={<Assessment />}
              label="Performance Analytics"
              id="ai-tab-2"
              aria-controls="ai-tabpanel-2"
            />
            <Tab
              icon={<MonetizationOn />}
              label="Financial Intelligence"
              id="ai-tab-3"
              aria-controls="ai-tabpanel-3"
            />
            <Tab
              icon={<Description />}
              label="Document Intelligence"
              id="ai-tab-4"
              aria-controls="ai-tabpanel-4"
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0}>
          <AIInsightsDashboard 
            smeId={smeId}
            onInsightAction={handleInsightAction}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <MarketIntelligenceWidget 
            industry="healthcare_technology"
            region="riyadh"
            businessSize="sme"
          />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <PerformanceAnalytics 
            smeId={smeId}
            timeRange="month"
          />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <FinancialIntelligenceDashboard 
            smeId={smeId}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', xl: '1.2fr 0.8fr' }} gap={3}>
            <TemplateIntelligence
              onSelectTemplate={(templateId) => {
                console.log('Selected template', templateId);
              }}
            />
            <CollaborativeEditor
              documentTitle="AI-Assisted Healthcare Document"
              onSaveDraft={(val) => console.log('Draft saved', val.length)}
              onSubmitForApproval={(val) => console.log('Submitted for approval', val.length)}
            />
          </Box>
        </TabPanel>

        {/* Footer Information */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            🚀 About BrainSAIT AI Features
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Our AI-powered platform leverages advanced machine learning models to provide:
          </Typography>
          <ul style={{ marginLeft: '20px' }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Real-time Business Insights:</strong> AI-generated recommendations based on your business data and Saudi healthcare market trends
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Market Intelligence:</strong> Comprehensive analysis of Saudi healthcare market opportunities, regulations, and government incentives
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Predictive Analytics:</strong> Advanced forecasting for business performance, cash flow, and growth projections
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Financial Intelligence:</strong> AI-powered financial analysis, funding opportunity matching, and investment readiness assessment
              </Typography>
            </li>
          </ul>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            ⚠️ All AI-generated insights are recommendations and should be validated with professional advisors. 
            Data is processed in compliance with Saudi data protection regulations.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default AIDashboardPage;
