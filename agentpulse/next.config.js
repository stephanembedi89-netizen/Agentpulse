/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    // Désactive le cache fichier webpack en dev pour éviter les
    // "Array buffer allocation failed" sur machines à faible RAM
    if (dev) {
      config.cache = false
    }
    return config
  },
}

// next-pwa v5 crash sur Node.js v22+ en dev (bug résolution better-ajv-errors)
// On le charge uniquement au build de production
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
  })
  module.exports = withPWA(nextConfig)
} else {
  module.exports = nextConfig
}
