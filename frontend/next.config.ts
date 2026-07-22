import type { NextConfig } from 'next';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080';
const keycloakTarget = process.env.KEYCLOAK_PROXY_TARGET ?? 'http://localhost:8081';
const isDevelopment = process.env.NODE_ENV === 'development';
const externalOrigin = (value?: string) => {
  if (!value?.startsWith('http://') && !value?.startsWith('https://')) return null;
  return new URL(value).origin;
};
const connectSources = [
  "'self'",
  externalOrigin(process.env.NEXT_PUBLIC_API_URL),
  externalOrigin(process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8081'),
].filter((value): value is string => Boolean(value));
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src ${[...new Set(connectSources)].join(' ')}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  // Evita conflicto EPERM en Windows cuando Docker/WSL dejó bloqueado frontend/.next/trace
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
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
      // Keycloak login sirve CSS/JS en rutas absolutas /resources/... y formularios en /realms/...
      {
        source: '/resources/:path*',
        destination: `${keycloakTarget}/resources/:path*`,
      },
      {
        source: '/realms/:path*',
        destination: `${keycloakTarget}/realms/:path*`,
      },
    ];
  },
};

export default nextConfig;
