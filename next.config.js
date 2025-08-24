/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar warnings de ESLint durante o build em produção
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar erros de TypeScript durante o build em produção
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
