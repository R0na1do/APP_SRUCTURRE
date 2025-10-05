/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' }
    ]
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/magicmenu' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/magicmenu' : ''
}
module.exports = nextConfig
