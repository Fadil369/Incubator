/** @type {import('next').NextConfig} */
// const { i18n } = require('./next-i18next.config.js'); // Commented out for static export

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
  // i18n, // Commented out for static export
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['localhost', 'brainsait.com'],
    unoptimized: true, // Required for static export
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://brainsait-api.dr-mf-12298.workers.dev',
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:5002',
  },
  // Headers don't work with static export, moved to Cloudflare Pages settings
};

module.exports = nextConfig;