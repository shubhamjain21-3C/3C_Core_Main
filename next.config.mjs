

const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [
      { source: '/portfolio', destination: '/services', permanent: false },
      { source: '/portfolio/:slug*', destination: '/services', permanent: false },
      // Retired template service pages for services 3C Core does not offer.
      { source: '/services/property-management',        destination: '/services', permanent: false },
      { source: '/services/lettings-consultancy',       destination: '/services', permanent: false },
      { source: '/services/property-investment-advisory', destination: '/services', permanent: false },
      { source: '/services/maintenance-facilities',     destination: '/services', permanent: false },
      { source: '/services/tenant-relations',           destination: '/services', permanent: false },
      { source: '/services/compliance-legal',           destination: '/services', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
