import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_BASE || 'http://localhost:8080';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const health = http.get(`${API}/actuator/health`);
  check(health, {
    'health status 200': (r) => r.status === 200,
  });

  const products = http.get(`${API}/api/v1/products`, {
    headers: { Authorization: `Bearer ${__ENV.ACCESS_TOKEN || ''}` },
  });
  check(products, {
    'products auth or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
