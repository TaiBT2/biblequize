import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// TC-PERF-001: API read P95 < 200ms
// Test: 1000 concurrent GET /api/leaderboard/global
// Expected: P95 < 200ms, error rate < 0.1%

const errorRate = new Rate('errors');
const readDuration = new Trend('read_duration');

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp up
    { duration: '1m', target: 1000 },   // sustained load
    { duration: '10s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.001'],
    errors: ['rate<0.001'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const endpoints = [
    '/api/leaderboard/global?period=daily',
    '/api/leaderboard/global?period=weekly',
    '/api/leaderboard/global?period=monthly',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`);

  readDuration.add(res.timings.duration);

  const passed = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'body is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
  });

  if (!passed) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(0.1);
}
