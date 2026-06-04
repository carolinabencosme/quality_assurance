import type { NextConfig } from 'next';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080';
const keycloakTarget = process.env.KEYCLOAK_PROXY_TARGET ?? 'http://localhost:8081';

const nextConfig: NextConfig = {
  // Evita conflicto EPERM en Windows cuando Docker/WSL dejó bloqueado frontend/.next/trace
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/keycloak/:path*',
        destination: `${keycloakTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
