import type { Metadata } from 'next';

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://app.brainsait.org';

export const metadata: Metadata = {
  title: 'AI Dashboard | BrainSAIT Incubator',
  description:
    'AI-powered insights and analytics for your healthcare startup — market intelligence, financial forecasting, performance analytics, and document intelligence.',
  keywords: [
    'AI dashboard',
    'healthcare analytics',
    'market intelligence',
    'BrainSAIT',
    'startup insights',
  ],
  openGraph: {
    title: 'AI Dashboard | BrainSAIT Incubator',
    description: 'Intelligent analytics and insights for healthcare SMEs.',
    url: `${APP_ORIGIN}/incubator/ai-dashboard`,
    siteName: 'BrainSAIT',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Dashboard | BrainSAIT Incubator',
    description: 'Intelligent analytics and insights for healthcare SMEs.',
  },
  alternates: {
    canonical: `${APP_ORIGIN}/incubator/ai-dashboard`,
  },
  robots: { index: false, follow: false }, // dashboard pages should not be indexed
};

export default function AIDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
