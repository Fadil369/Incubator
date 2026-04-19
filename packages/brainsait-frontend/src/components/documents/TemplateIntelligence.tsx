'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  Button,
  Avatar,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Description,
  AutoAwesome,
  Verified,
  Gavel,
  Public,
  Language,
  Bolt,
  Timeline,
  CheckCircle,
  RocketLaunch,
  Security,
  Article,
  Info
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

type LanguageCode = 'en' | 'ar';

interface TemplateCard {
  id: string;
  title: Record<LanguageCode, string>;
  summary: Record<LanguageCode, string>;
  stage: 'startup' | 'growth' | 'enterprise';
  industries: string[];
  compliance: string[];
  aiConfidence: number;
  successProbability: number;
  recommendedFor: string[];
  languages: LanguageCode[];
  timeToBuild: string;
}

interface ComplianceCheck {
  label: string;
  authority: string;
  status: 'passed' | 'attention' | 'pending';
  detail: string;
}

interface TemplateIntelligenceProps {
  onSelectTemplate?: (templateId: string) => void;
}

const TemplateIntelligence: React.FC<TemplateIntelligenceProps> = ({
  onSelectTemplate
}) => {
  const { i18n } = useTranslation();
  const [stageFilter, setStageFilter] = useState<'all' | TemplateCard['stage']>('all');
  const [complianceFocus, setComplianceFocus] = useState<'all' | string>('all');
  const [industryFilter, setIndustryFilter] = useState<'all' | string>('all');
  const isRTL = i18n.language === 'ar';

  const templates = useMemo<TemplateCard[]>(() => [
    {
      id: 'business-plan',
      title: { en: 'AI-Optimized Business Plan', ar: 'خطة عمل محسّنة بالذكاء الاصطناعي' },
      summary: {
        en: 'Vision 2030 aligned, Saudi healthcare-focused business plan template with funding narrative.',
        ar: 'قالب خطة عمل متوافق مع رؤية 2030 ومخصص لقطاع الرعاية الصحية السعودي مع سرد تمويلي قوي.'
      },
      stage: 'startup',
      industries: ['digital_health', 'telemedicine', 'healthtech'],
      compliance: ['MOH', 'NPHIES', 'PDPL'],
      aiConfidence: 0.92,
      successProbability: 0.87,
      recommendedFor: ['Seed and Series A pitches', 'Accelerator submissions', 'MOH licensing packs'],
      languages: ['en', 'ar'],
      timeToBuild: '12 min'
    },
    {
      id: 'feasibility-study',
      title: { en: 'Feasibility Study (Saudi Health)', ar: 'دراسة جدوى للقطاع الصحي السعودي' },
      summary: {
        en: 'Technical, market, and financial feasibility tailored to MOH, NPHIES, and SAMA checkpoints.',
        ar: 'جدوى تقنية وسوقية ومالية مهيأة لنقاط تفتيش وزارة الصحة ونفيس والبنك المركزي.'
      },
      stage: 'growth',
      industries: ['medical_devices', 'digital_health'],
      compliance: ['MOH', 'SFDA', 'SAMA'],
      aiConfidence: 0.9,
      successProbability: 0.83,
      recommendedFor: ['Hospital integrations', 'SFDA device approvals', 'Regional expansion'],
      languages: ['en', 'ar'],
      timeToBuild: '18 min'
    },
    {
      id: 'compliance-dossier',
      title: { en: 'Compliance & PDPL Dossier', ar: 'ملف الامتثال وحماية البيانات' },
      summary: {
        en: 'Comprehensive compliance, PDPL, and cybersecurity dossier with audit-ready evidence tables.',
        ar: 'ملف شامل للامتثال وخصوصية البيانات والأمن السيبراني مع جداول أدلة جاهزة للتدقيق.'
      },
      stage: 'enterprise',
      industries: ['healthcare', 'payer', 'provider'],
      compliance: ['PDPL', 'NCA', 'NPHIES'],
      aiConfidence: 0.88,
      successProbability: 0.81,
      recommendedFor: ['Enterprise tenders', 'Government RFPs', 'Data residency reviews'],
      languages: ['en', 'ar'],
      timeToBuild: '22 min'
    }
  ], []);

  const complianceChecklist: ComplianceCheck[] = [
    {
      label: 'NPHIES Alignment',
      authority: 'NPHIES',
      status: 'attention',
      detail: 'Add explicit integration roadmap and API conformance tests.'
    },
    {
      label: 'PDPL & Data Residency',
      authority: 'PDPL',
      status: 'passed',
      detail: 'Include data flows, residency statement, and consent policies.'
    },
    {
      label: 'MOH Licensing',
      authority: 'MOH',
      status: 'pending',
      detail: 'Attach current license IDs and renewal schedule.'
    }
  ];

  const filteredTemplates = useMemo(
    () =>
      templates.filter((tpl) => {
        const stageMatch = stageFilter === 'all' || tpl.stage === stageFilter;
        const complianceMatch = complianceFocus === 'all' || tpl.compliance.includes(complianceFocus);
        const industryMatch = industryFilter === 'all' || tpl.industries.includes(industryFilter);
        return stageMatch && complianceMatch && industryMatch;
      }),
    [templates, stageFilter, complianceFocus, industryFilter]
  );

  const handleSelect = (id: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(id);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {isRTL ? 'ذكاء القوالب' : 'Template Intelligence'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isRTL
              ? 'توصيات قوالب مدعومة بالذكاء الاصطناعي مع تركيز على الامتثال السعودي ونجاح التمويل.'
              : 'AI-powered template recommendations tuned for Saudi compliance and funding success.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip icon={<Language />} label={isRTL ? 'عربي + إنجليزي' : 'Arabic + English'} color="primary" />
          <Chip icon={<Verified />} label="Saudi-ready" color="success" />
          <Chip icon={<AutoAwesome />} label="AI-curated" variant="outlined" />
        </Stack>
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {(['all', 'startup', 'growth', 'enterprise'] as const).map((stage) => (
              <Chip
                key={stage}
                label={stage === 'all' ? (isRTL ? 'الكل' : 'All Stages') : stage}
                color={stageFilter === stage ? 'primary' : 'default'}
                onClick={() => setStageFilter(stage)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {['all', 'MOH', 'NPHIES', 'PDPL', 'SFDA'].map((item) => (
              <Chip
                key={item}
                icon={<Gavel />}
                label={item === 'all' ? (isRTL ? 'كل اللوائح' : 'All compliance') : item}
                variant={complianceFocus === item ? 'filled' : 'outlined'}
                color={complianceFocus === item ? 'secondary' : 'default'}
                onClick={() => setComplianceFocus(item)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {['all', 'digital_health', 'telemedicine', 'medical_devices', 'payer', 'provider'].map((item) => (
              <Chip
                key={item}
                icon={<Public />}
                label={item === 'all' ? (isRTL ? 'كل القطاعات' : 'All segments') : item.replace('_', ' ')}
                variant={industryFilter === item ? 'filled' : 'outlined'}
                color={industryFilter === item ? 'primary' : 'default'}
                onClick={() => setIndustryFilter(item)}
              />
            ))}
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {filteredTemplates.map((template) => (
          <Grid item xs={12} md={4} key={template.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Avatar>
                    <Description />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {isRTL ? template.title.ar : template.title.en}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isRTL ? template.summary.ar : template.summary.en}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" mt={2} mb={2}>
                  <Chip icon={<Timeline />} label={template.timeToBuild} size="small" />
                  <Chip icon={<CheckCircle />} label={template.stage} size="small" />
                  <Chip icon={<Security />} label="Compliance+" size="small" color="secondary" />
                </Stack>

                <Stack spacing={1} mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    {isRTL ? 'نسبة نجاح التمويل' : 'Funding success probability'}
                  </Typography>
                  <LinearProgress
                    value={template.successProbability * 100}
                    variant="determinate"
                    color={template.successProbability > 0.85 ? 'success' : 'primary'}
                    sx={{ height: 8, borderRadius: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {isRTL ? 'ثقة الذكاء الاصطناعي' : 'AI confidence'}: {Math.round(template.aiConfidence * 100)}%
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                  {template.compliance.map((item) => (
                    <Chip key={item} icon={<Gavel />} label={item} size="small" variant="outlined" />
                  ))}
                  {template.languages.map((lng) => (
                    <Chip key={lng} icon={<Language />} label={lng.toUpperCase()} size="small" />
                  ))}
                </Stack>

                <Typography variant="subtitle2" gutterBottom>
                  {isRTL ? 'أفضل للاستخدام' : 'Best for'}
                </Typography>
                <List dense>
                  {template.recommendedFor.map((rec) => (
                    <ListItem key={rec} disableGutters>
                      <ListItemText
                        primaryTypographyProps={{ variant: 'body2' }}
                        primary={rec}
                      />
                    </ListItem>
                  ))}
                </List>

                <Stack direction="row" spacing={1} mt={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<RocketLaunch />}
                    onClick={() => handleSelect(template.id)}
                  >
                    {isRTL ? 'ابدأ بالقالب' : 'Start with template'}
                  </Button>
                  <Tooltip title={isRTL ? 'اقتراح محسّن بالذكاء الاصطناعي' : 'AI-enhanced suggestion'}>
                    <IconButton color="secondary">
                      <AutoAwesome />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Bolt color="warning" />
                <Typography variant="h6">
                  {isRTL ? 'اقتراحات الذكاء الاصطناعي' : 'AI Suggestions'}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {isRTL
                  ? 'توصيات فورية لتحسين القوالب وفقاً للمنظمة والقطاع.'
                  : 'Instant recommendations to tailor templates for your organization and segment.'}
              </Typography>
              <Stack spacing={1}>
                <Chip
                  icon={<Article />}
                  label={isRTL ? 'إضافة بيان امتثال PDPL باللغة العربية' : 'Add PDPL compliance statement in Arabic'}
                  variant="outlined"
                />
                <Chip
                  icon={<RocketLaunch />}
                  label={isRTL ? 'تسليط الضوء على جاهزية رؤية 2030' : 'Highlight Vision 2030 readiness'}
                  variant="outlined"
                />
                <Chip
                  icon={<Gavel />}
                  label={isRTL ? 'إرفاق خطة تكامل نفيس مفصلة' : 'Attach detailed NPHIES integration plan'}
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Security color="primary" />
                <Typography variant="h6">
                  {isRTL ? 'التحقق التنظيمي' : 'Regulatory Readiness'}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {isRTL
                  ? 'حالة الامتثال في الوقت الفعلي لأهم الهيئات السعودية.'
                  : 'Real-time compliance readiness across key Saudi authorities.'}
              </Typography>
              <Stack spacing={1}>
                {complianceChecklist.map((item) => (
                  <Box
                    key={item.label}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={<Gavel />}
                        label={item.authority}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2">{item.label}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={item.status}
                        size="small"
                        color={
                          item.status === 'passed'
                            ? 'success'
                            : item.status === 'attention'
                            ? 'warning'
                            : 'default'
                        }
                        variant="outlined"
                      />
                      <Tooltip title={item.detail}>
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TemplateIntelligence;
