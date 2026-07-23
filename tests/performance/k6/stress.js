import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.90'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';
const keycloakUrl = __ENV.KEYCLOAK_URL || 'http://localhost:8081';
const username = __ENV.K6_USERNAME || 'viewer';
const password = __ENV.K6_PASSWORD || 'viewer123';

export function setup() {
  const response = http.post(
    `${keycloakUrl}/realms/inventory-realm/protocol/openid-connect/token`,
    {
      grant_type: 'password',
      client_id: 'inventory-frontend',
      username,
      password,
      scope: 'openid profile email product:view stock:view report:view',
    },
  );

  check(response, {
    'token status is 200': (r) => r.status === 200,
    'token exists': (r) => Boolean(r.json('access_token')),
  });

  return { token: response.json('access_token') };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };

  check(http.get(`${baseUrl}/actuator/health`), {
    'health is 200': (r) => r.status === 200,
  });
  check(http.get(`${baseUrl}/api/v1/reports/dashboard`, { headers }), {
    'dashboard is 200': (r) => r.status === 200,
  });
  check(http.get(`${baseUrl}/api/v1/products?page=0&size=20`, { headers }), {
    'products is 200': (r) => r.status === 200,
  });
  check(http.get(`${baseUrl}/api/v1/observability/system-metrics`, { headers }), {
    'system metrics is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
