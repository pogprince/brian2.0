/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  // Extension point: add rewrites/redirects for future plugin system
  images: {
    unoptimized: true, // Use raw images — avoids sharp dependency issues locally
  },
}
module.exports = nextConfig
