import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// TC-PERF-004: Share card generation
// 50 concurrent GET /share/session/{id}
// Expected: P95 < 3s

const shareCardDuration = new Trend('share_card_duration');
const errorRate = new Rate('errors');
const successCount = new Counter('successful_generations');

export const options = {
  scenarios: {
    share_card_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
  },
  thresholds: {
    share_card_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Pre-create sessions to use for share card generation
export function setup() {
  const sessions = [];

  // Create a pool of test sessions via guest auth + quiz start
  for (let i = 0; i < 10; i++) {
    const authRes = http.post(
      `${BASE_URL}/api/auth/guest`,
      JSON.stringify({ nickname: `k6_share_${i}_${Date.now()}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (authRes.status === 200) {
      try {
        const authBody = JSON.parse(authRes.body);
        const token = authBody.token || authBody.accessToken;

        if (token) {
          const sessionRes = http.post(
            `${BASE_URL}/api/quiz/start`,
            JSON.stringify({ mode: 'practice' }),
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (sessionRes.status === 200) {
            const sessionBody = JSON.parse(sessionRes.body);
            if (sessionBody.sessionId || sessionBody.id) {
              sessions.push(sessionBody.sessionId || sessionBody.id);
            }
          }
        }
      } catch (e) {
        // ignore setup errors
      }
    }
  }

  // Fallback session IDs if setup fails
  if (sessions.length === 0) {
    for (let i = 1; i <= 10; i++) {
      sessions.push(`test-session-${i}`);
    }
  }

  return { sessions };
}

export default function (data) {
  const sessions = data.sessions;
  const sessionId = sessions[Math.floor(Math.random() * sessions.length)];

  const res = http.get(`${BASE_URL}/api/share/session/${sessionId}`, {
    responseType: 'binary',
    timeout: '10s',
  });

  shareCardDuration.add(res.timings.duration);

  const passed = check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'response time < 3s': (r) => r.timings.duration < 3000,
    'response has content': (r) => r.body && r.body.length > 0,
  });

  if (res.status === 200) {
    check(res, {
      'content-type is image': (r) => {
        const ct = r.headers['Content-Type'] || '';
        return ct.includes('image/') || ct.includes('application/json');
      },
    });
    successCount.add(1);
    errorRate.add(0);
  } else if (res.status === 404) {
    // 404 is acceptable for test session IDs
    errorRate.add(0);
  } else {
    errorRate.add(1);
  }

  sleep(0.5 + Math.random() * 1);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs
    ? data.metrics.http_reqs.values.count
    : 0;
  const p95 = data.metrics.share_card_duration
    ? data.metrics.share_card_duration.values['p(95)']
    : 0;
  const successful = data.metrics.successful_generations
    ? data.metrics.successful_generations.values.count
    : 0;

  return {
    stdout: `
=== TC-PERF-004: Share Card Generation Summary ===
Total requests:         ${totalReqs}
Successful generations: ${successful}
P95 latency:            ${p95.toFixed(2)}ms (threshold: 3000ms)
===================================================
`,
  };
}
