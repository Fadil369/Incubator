import React from 'react';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Business,
  Rocket,
  People,
  Analytics,
  School,
  CheckCircle,
  ArrowForward,
  Handshake,
  Code,
  LocalHospital,
  TrendingUp,
  EmojiEvents,
  AccountTree,
  Verified,
} from '@mui/icons-material';

export const metadata: Metadata = {
  title: 'Partner With BrainSAIT | Healthcare Innovation Ecosystem',
  description:
    'Join BrainSAIT\'s ecosystem as a technology, healthcare, integration, or distribution partner. Access resources, mentorship, and the BrainSAIT partner network.',
  keywords: [
    'BrainSAIT partners',
    'healthcare partnership',
    'digital health ecosystem',
    'Saudi Arabia healthtech',
    'incubator partners',
    'MENA health innovation',
  ],
  openGraph: {
    title: 'Partner With BrainSAIT',
    description: 'Join the leading healthcare innovation ecosystem in the Arab world.',
    url: 'https://brainsait.org/partners',
    siteName: 'BrainSAIT',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Partner With BrainSAIT',
    description: 'Join the leading healthcare innovation ecosystem in the Arab world.',
  },
  alternates: { canonical: 'https://brainsait.org/partners' },
};

const PARTNER_TYPES = [
  {
    icon: <Code fontSize="large" />,
    title: 'Technology Partners',
    description:
      'SaaS platforms, digital health tools, AI providers, and infrastructure companies that power the BrainSAIT ecosystem.',
    examples: ['EHR/EMR vendors', 'AI & ML providers', 'Cloud infrastructure', 'Cybersecurity firms'],
    color: '#6c63ff',
  },
  {
    icon: <LocalHospital fontSize="large" />,
    title: 'Healthcare Providers',
    description:
      'Hospitals, clinics, and healthcare networks that help pilot, validate, and scale healthcare SME solutions.',
    examples: ['Hospitals & clinics', 'Diagnostic labs', 'Pharmacy chains', 'Telehealth networks'],
    color: '#00b4d8',
  },
  {
    icon: <AccountTree fontSize="large" />,
    title: 'Integration Partners',
    description:
      'System integrators and consultants that connect BrainSAIT startups with enterprise healthcare systems.',
    examples: ['NPHIES integrators', 'HL7/FHIR experts', 'ERP consultants', 'Digital transformation firms'],
    color: '#43aa8b',
  },
  {
    icon: <TrendingUp fontSize="large" />,
    title: 'Distribution Partners',
    description:
      'Regional distributors and sales networks that help BrainSAIT startups expand across the MENA market.',
    examples: ['MENA distributors', 'Government procurement', 'Investment networks', 'Media & PR partners'],
    color: '#f77f00',
  },
];

const BENEFITS = [
  {
    icon: <Rocket />,
    title: 'Co-innovation Access',
    description:
      'Work directly with healthcare startups during incubation to shape early-stage products using your technology.',
  },
  {
    icon: <People />,
    title: 'Ecosystem Network',
    description:
      'Connect with 32+ incubated healthcare SMEs, mentor network, and BrainSAIT\'s investor community.',
  },
  {
    icon: <Analytics />,
    title: 'Joint Go-to-Market',
    description:
      'Co-branded case studies, joint press releases, and showcased integration in BrainSAIT\'s app catalog.',
  },
  {
    icon: <School />,
    title: 'Training Integration',
    description:
      'Contribute and co-author training content in BrainSAIT\'s healthcare learning platform.',
  },
  {
    icon: <EmojiEvents />,
    title: 'Demo Day Presence',
    description:
      'Sponsor and exhibit at BrainSAIT Demo Days — direct access to startups and investors.',
  },
  {
    icon: <Verified />,
    title: 'BrainSAIT Certification',
    description:
      'Earn BrainSAIT Partner certification displayed on your company profile and BrainSAIT marketplace.',
  },
];

const CURRENT_PARTNERS = [
  { name: 'Ministry of Health — KSA', type: 'Government', category: 'Healthcare' },
  { name: 'NPHIES Platform', type: 'Government', category: 'Integration' },
  { name: 'Vision 2030 Health Programs', type: 'Government', category: 'Strategy' },
  { name: 'SFDA', type: 'Regulatory', category: 'Compliance' },
];

export default function PartnersPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #1e1b4b 100%)',
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 10 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 350, height: 350, borderRadius: '50%', bgcolor: 'rgba(108,99,255,0.12)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', bgcolor: 'rgba(0,180,216,0.10)', pointerEvents: 'none' }} />

        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 760 }}>
            <Chip
              icon={<Handshake />}
              label="Partnership Program"
              sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 600 }}
            />
            <Typography variant="h2" fontWeight={800} gutterBottom sx={{ lineHeight: 1.15 }}>
              Build the Future of Healthcare
              <Box component="span" sx={{ color: '#6c63ff' }}> Together</Box>
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.74)', mb: 4, maxWidth: 640, fontWeight: 400 }}>
              Join BrainSAIT's growing ecosystem of technology providers, healthcare organizations, integrators, and
              investors accelerating healthcare innovation across the Arab world.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                component={NextLink}
                href="/apply"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{ bgcolor: '#6c63ff', '&:hover': { bgcolor: '#5a52d5' }, px: 4, py: 1.5, fontWeight: 700 }}
              >
                Apply as a Partner
              </Button>
              <Button
                component={NextLink}
                href="#partner-types"
                variant="outlined"
                size="large"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.06)' }, px: 4, py: 1.5 }}
              >
                Explore Partnership Types
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats bar */}
      <Box sx={{ bgcolor: '#f8f9ff', borderBottom: '1px solid', borderColor: 'divider', py: 3 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="center">
            {[
              { value: '32+', label: 'Incubated startups' },
              { value: '15+', label: 'Active partners' },
              { value: '6', label: 'Arab countries' },
              { value: '$12M+', label: 'Funding facilitated' },
            ].map((stat) => (
              <Grid item xs={6} sm={3} key={stat.label} sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} color="primary.main">{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Partner types */}
      <Box id="partner-types" sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Partnership Types
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              We offer four distinct partnership tracks, each designed to maximize mutual value and ecosystem impact.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {PARTNER_TYPES.map((type) => (
              <Grid item xs={12} sm={6} key={type.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.10)', transform: 'translateY(-2px)' },
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Avatar sx={{ bgcolor: `${type.color}18`, color: type.color, width: 56, height: 56, mb: 2 }}>
                      {type.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {type.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {type.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {type.examples.map((ex) => (
                        <Chip key={ex} label={ex} size="small" variant="outlined" sx={{ borderColor: type.color, color: type.color, fontSize: '0.72rem' }} />
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: 3.5, pb: 3 }}>
                    <Button
                      component={NextLink}
                      href="/apply"
                      size="small"
                      endIcon={<ArrowForward />}
                      sx={{ color: type.color, fontWeight: 600 }}
                    >
                      Apply as this partner type
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits */}
      <Box sx={{ bgcolor: '#f8f9ff', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Partner Benefits
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              What you gain by joining the BrainSAIT partner ecosystem.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {BENEFITS.map((benefit) => (
              <Grid item xs={12} sm={6} md={4} key={benefit.title}>
                <Box sx={{ display: 'flex', gap: 2, p: 2.5, bgcolor: 'white', borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', flexShrink: 0 }}>
                    {benefit.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {benefit.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Partnership process */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              How to Become a Partner
            </Typography>
          </Box>
          <List>
            {[
              {
                step: '01',
                title: 'Submit Your Application',
                desc: 'Complete the partner application with your company information and partnership goals. Takes under 5 minutes.',
              },
              {
                step: '02',
                title: 'Partnership Review',
                desc: 'BrainSAIT reviews your application within 5 business days and schedules a discovery call.',
              },
              {
                step: '03',
                title: 'Agreement & Onboarding',
                desc: 'Sign the partnership agreement and get access to the BrainSAIT partner portal, resources, and your designated partnership manager.',
              },
              {
                step: '04',
                title: 'Co-innovation Kickoff',
                desc: 'Get matched with relevant incubated startups and launch your first joint initiative.',
              },
            ].map((item, i) => (
              <React.Fragment key={item.step}>
                <ListItem sx={{ gap: 3, py: 3, alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 800, width: 48, height: 48, flexShrink: 0 }}>
                    {item.step}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                  </Box>
                </ListItem>
                {i < 3 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Container>
      </Box>

      {/* Current institutional partners */}
      <Box sx={{ bgcolor: '#f8f9ff', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
            Institutional Partners
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 5 }}>
            BrainSAIT works with leading government and regulatory bodies across the region.
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {CURRENT_PARTNERS.map((p) => (
              <Grid item xs={12} sm={6} md={3} key={p.name}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center', p: 3 }}>
                  <Chip label={p.type} size="small" color="primary" variant="outlined" sx={{ mb: 1.5 }} />
                  <Typography variant="subtitle2" fontWeight={700}>{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.category}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(135deg, #6c63ff 0%, #43aa8b 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Ready to Partner?
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.82)', mb: 4, fontWeight: 400 }}>
            Join us in building the next generation of healthcare innovation across the Arab world.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={NextLink}
              href="/apply"
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{ bgcolor: 'white', color: '#6c63ff', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' }, px: 5, py: 1.75, fontWeight: 700, fontSize: '1rem' }}
            >
              Apply Now
            </Button>
            <Button
              component={NextLink}
              href="mailto:partners@brainsait.org"
              variant="outlined"
              size="large"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' }, px: 5, py: 1.75 }}
            >
              Contact Us
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
