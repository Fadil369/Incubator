/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'brainsait.org', 'avatars.githubusercontent.com', 'raw.githubusercontent.com'],
    unoptimized: true, // Required for static export
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.brainsait.org',
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.brainsait.org',
    NEXT_PUBLIC_GITHUB_ORG: process.env.NEXT_PUBLIC_GITHUB_ORG || 'brainsait-incubator',
    NEXT_PUBLIC_EVENT_BRIDGE_URL: process.env.NEXT_PUBLIC_EVENT_BRIDGE_URL || 'https://events.brainsait.org',
  },
  // Headers don't work with static export, moved to Cloudflare Pages settings
};

module.exports = nextConfig;