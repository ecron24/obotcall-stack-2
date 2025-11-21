/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Désactiver ESLint pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ AJOUTÉ : Forcer le rendu dynamique pour toute l'app
  experimental: {
    appDir: true,
  },

  // Désactiver la génération statique
  trailingSlash: false,
}

module.exports = nextConfig
