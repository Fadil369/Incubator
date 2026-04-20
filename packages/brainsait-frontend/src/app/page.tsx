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
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  GitHub,
  AutoAwesome,
  People,
  Security,
  Assessment,
  School,
  Rocket,
  CheckCircle,
  ArrowForward,
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

const stats = [
  { value: '35+', label: 'Startups Incubated', labelAr: 'شركة ناشئة' },
  { value: '200+', label: 'Mentorship Sessions', labelAr: 'جلسة إرشادية' },
  { value: '6', label: 'MENA Countries', labelAr: 'دول في المنطقة' },
  { value: '100%', label: 'NPHIES Ready', labelAr: 'جاهز لـ NPHIES' },
];

const phases = [
  {
    num: '01',
    title: 'Discovery',
    titleAr: 'الاكتشاف',
    weeks: 'Weeks 1–2',
    desc: 'Deep-dive diagnostic, NPHIES readiness assessment, and team alignment.',
    color: '#2E7D32',
  },
  {
    num: '02',
    title: 'Build',
    titleAr: 'البناء',
    weeks: 'Weeks 3–6',
    desc: 'Ship your core product with FHIR R4 integrations and GitHub-powered CI/CD pipelines.',
    color: '#1565C0',
  },
  {
    num: '03',
    title: 'Scale',
    titleAr: 'التوسع',
    weeks: 'Weeks 7–10',
    desc: 'Go-to-market, investor readiness, PDPL compliance, and regional expansion planning.',
    color: '#6A1B9A',
  },
  {
    num: '04',
    title: 'Graduate',
    titleAr: 'التخرج',
    weeks: 'Weeks 11–12',
    desc: 'Demo Day, alumni network, seed funding introductions, and continued platform access.',
    color: '#C62828',
  },
];

const pillars = [
  {
    icon: <GitHub />,
    title: 'GitHub Workspace',
    titleAr: 'بيئة GitHub',
    desc: 'Auto-provisioned repos, branch protection, GitHub Actions CI/CD, and team access — all configured on day one.',
  },
  {
    icon: <AutoAwesome />,
    title: 'AI-Powered Compliance',
    titleAr: 'الامتثال بالذكاء الاصطناعي',
    desc: 'NPHIES validator, FHIR R4 schema checks, PDPL gap analysis, and Vision 2030 alignment scoring.',
  },
  {
    icon: <People />,
    title: 'Expert Mentorship',
    titleAr: 'الإرشاد المتخصص',
    desc: 'Weekly 1:1s with senior clinicians, health-tech CTOs, regulatory specialists, and investors.',
  },
  {
    icon: <Security />,
    title: 'Regulatory Shield',
    titleAr: 'الدرع التنظيمي',
    desc: 'Saudi MOH, CCHI, SFDA, and PDPL compliance frameworks built into your development workflow.',
  },
  {
    icon: <Assessment />,
    title: 'KPI Dashboard',
    titleAr: 'لوحة مؤشرات الأداء',
    desc: 'Real-time milestones, cohort analytics, investor-ready metrics, and exportable progress reports.',
  },
  {
    icon: <School />,
    title: 'Training Academy',
    titleAr: 'أكاديمية التدريب',
    desc: 'Curated modules on health informatics, HL7 FHIR, clinical AI, and digital health business models.',
  },
];

const compliance = ['NPHIES', 'FHIR R4', 'PDPL', 'Saudi MOH', 'CCHI', 'Vision 2030'];

export default function HomePage() {
  return (
    <Box>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #0D47A1 60%, #1A237E 100%)',
          py: { xs: 10, md: 18 },
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
            <Chip
              icon={<Rocket sx={{ color: 'white !important', fontSize: 14 }} />}
              label="2026 Cohort — Applications Open"
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontWeight: 600,
                mb: 3,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.75rem' },
                fontWeight: 800,
                lineHeight: 1.1,
                mb: 2,
                letterSpacing: '-0.02em',
              }}
            >
              Accelerating Healthcare Startups Across MENA
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255,255,255,0.75)',
                mb: 1,
                fontWeight: 400,
                direction: 'rtl',
              }}
            >
              تسريع الشركات الناشئة في مجال الرعاية الصحية عبر الشرق الأوسط وأفريقيا
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'rgba(255,255,255,0.70)', mb: 5, maxWidth: 560, lineHeight: 1.7, mt: 2 }}
            >
              BrainSAIT provides a 12-week immersive incubation program with AI-native tools,
              NPHIES/FHIR compliance infrastructure, GitHub automation, and hands-on mentorship
              from Saudi Arabia&apos;s leading health-tech practitioners.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                href="/apply"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.dark',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                Apply Now — مجاناً
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="/portal"
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Startup Portal
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'primary.main', py: { xs: 4, md: 5 }, color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="center">
            {stats.map((s) => (
              <Grid item xs={6} md={3} key={s.label}>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
                    {s.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {s.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    {s.labelAr}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Program Phases ────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 3 }}>
              12-Week Program
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1 }}>
              From Idea to Investment-Ready
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ direction: 'rtl' }}>
              من الفكرة إلى جاهزية الاستثمار
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {phases.map((phase) => (
              <Grid item xs={12} sm={6} md={3} key={phase.num}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderTop: `4px solid ${phase.color}`,
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: 4 },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h2"
                      sx={{ fontWeight: 900, color: phase.color, opacity: 0.15, lineHeight: 1, mb: -1 }}
                    >
                      {phase.num}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                      {phase.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                      {phase.titleAr} · {phase.weeks}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {phase.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Six Pillars ───────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" color="secondary" sx={{ fontWeight: 700, letterSpacing: 3 }}>
              Platform Capabilities
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1 }}>
              Everything Your Startup Needs
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ direction: 'rtl' }}>
              كل ما يحتاجه مشروعك الناشئ
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {pillars.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.title}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%',
                    transition: 'border-color 0.2s, background 0.2s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mb: 2,
                    }}
                  >
                    {p.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, direction: 'rtl' }}>
                    {p.titleAr}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {p.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Compliance Badges ─────────────────────────────────────────────── */}
      <Box sx={{ py: 6, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 3, letterSpacing: 2 }}>
            Compliance & Standards
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center" useFlexGap>
            {compliance.map((c) => (
              <Chip
                key={c}
                icon={<CheckCircle color="success" />}
                label={c}
                variant="outlined"
                sx={{ fontWeight: 600, borderColor: 'success.main', color: 'success.dark' }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1B5E20 0%, #0D47A1 100%)',
          py: { xs: 10, md: 14 },
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            Ready to Build the Future of Healthcare?
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.75)', mb: 4, direction: 'rtl' }}>
            هل أنت مستعد لبناء مستقبل الرعاية الصحية؟
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.70)', mb: 5, lineHeight: 1.7 }}>
            Applications for the 2026 cohort are open. Join 35+ startups transforming healthcare
            across Saudi Arabia and MENA.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              href="/apply"
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: 'white',
                color: 'primary.dark',
                fontWeight: 700,
                px: 5,
                py: 1.75,
                fontSize: '1rem',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Apply to the 2026 Cohort
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/mentorship"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1.75,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Meet Our Mentors
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}