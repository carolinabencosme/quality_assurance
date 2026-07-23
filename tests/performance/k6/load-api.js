import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.95'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';
const keycloakUrl = __ENV.KEYCLOAK_URL || 'http://localhost:8081';
const username = __ENV.K6_USERNAME;
const password = __ENV.K6_PASSWORD;

export function setup() {
  if (!username || !password) {
    return { token: null };
  }

  const response = http.post(
    `${keycloakUrl}/realms/inventory-realm/protocol/openid-connect/token`,
    {
      grant_type: 'password',
      client_id: 'inventory-frontend',
      username,
      password,
    },
  );

  check(response, {
    'token status is 200': (r) => r.status === 200,
    'token exists': (r) => Boolean(r.json('access_token')),
  });

  return { token: response.json('access_token') };
}

export default function (data) {
  const headers = data.token ? { Authorization: `Bearer ${data.token}` } : {};

  check(http.get(`${baseUrl}/actuator/health`), {
    'health is 200': (r) => r.status === 200,
  });

  if (data.token) {
    check(http.get(`${baseUrl}/api/v1/products?page=0&size=10`, { headers }), {
      'products is 200': (r) => r.status === 200,
    });
    check(http.get(`${baseUrl}/api/v1/reports/dashboard`, { headers }), {
      'dashboard is 200': (r) => r.status === 200,
    });
    check(http.get(`${baseUrl}/api/v1/stock/movements?page=0&size=10`, { headers }), {
      'stock movements is 200': (r) => r.status === 200,
    });
    check(http.get(`${baseUrl}/api/v1/reports/critical-products?page=0&size=10`, { headers }), {
      'critical products is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
