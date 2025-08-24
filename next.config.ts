import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignorar warnings de ESLint durante o build em produção
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar erros de TypeScript durante o build em produção
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
