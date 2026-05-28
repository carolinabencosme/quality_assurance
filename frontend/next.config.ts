import type { NextConfig } from 'next';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080';
const keycloakTarget = process.env.KEYCLOAK_PROXY_TARGET ?? 'http://localhost:8081';

const nextConfig: NextConfig = {
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
