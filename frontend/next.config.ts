import type { NextConfig } from 'next';

// En Docker (`DOCKER_BUILD=true`) usamos standalone. En Vercel el output default.
const isDockerBuild = process.env.DOCKER_BUILD === 'true';
const isVercel = Boolean(process.env.VERCEL);
const isDevelopment = process.env.NODE_ENV === 'development';

// Rewrites solo aplican cuando el cliente usa paths relativos (/api, /keycloak).
// En Vercel staging publico: NEXT_PUBLIC_API_URL y NEXT_PUBLIC_KEYCLOAK_URL absolutos (HTTPS).
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080';
const keycloakTarget = process.env.KEYCLOAK_PROXY_TARGET ?? 'http://localhost:8081';

const externalOrigin = (value?: string) => {
  if (!value?.startsWith('http://') && !value?.startsWith('https://')) return null;
  return new URL(value).origin;
};

const connectSources = [
  "'self'",
  externalOrigin(process.env.NEXT_PUBLIC_API_URL),
  externalOrigin(process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8081'),
].filter((value): value is string => Boolean(value));

const keycloakOrigin =
  externalOrigin(process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8081') ??
  'http://localhost:8081';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src ${[...new Set(connectSources)].join(' ')}`,
  `form-action 'self' ${keycloakOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

const useRelativeProxies =
  !externalOrigin(process.env.NEXT_PUBLIC_API_URL) ||
  !externalOrigin(process.env.NEXT_PUBLIC_KEYCLOAK_URL);

const nextConfig: NextConfig = {
  // Evita conflicto EPERM en Windows cuando Docker/WSL dejó bloqueado frontend/.next/trace
  distDir: isDevelopment ? '.next-dev' : '.next',
  ...(isDockerBuild && !isVercel ? { output: 'standalone' as const } : {}),
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          // En Vercel + Keycloak cross-origin, COOP/COEP estrictos rompen el flujo OIDC.
          ...(isVercel
            ? []
            : [
                { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
              ]),
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
  async rewrites() {
    if (!useRelativeProxies) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
      {
        source: '/keycloak/:path*',
        destination: `${keycloakTarget}/:path*`,
      },
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
