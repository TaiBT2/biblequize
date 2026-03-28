import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// TC-PERF-005 + TC-SEC-006: Answer submission rate limiting
// Submit answers at various rates
// Expected: P95 < 100ms for normal rate, 429 for > 30 req/min

const answerDuration = new Trend('answer_duration');
const rateLimited = new Counter('rate_limited_responses');
const successfulSubmits = new Counter('successful_submits');
const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    // Scenario 1: Normal submission rate (within limits)
    normal_rate: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1m',
      duration: '1m',
      preAllocatedVUs: 5,
      maxVUs: 20,
      exec: 'normalSubmission',
      startTime: '0s',
    },
    // Scenario 2: Burst rate to trigger rate limiting (>30 req/min per user)
    burst_rate: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 40,
      maxDuration: '1m',
      exec: 'burstSubmission',
      startTime: '1m30s',
    },
  },
  thresholds: {
    'answer_duration{scenario:normal_rate}': ['p(95)<100'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

function getAuthToken() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/guest`,
    JSON.stringify({ nickname: `k6_user_${__VU}_${Date.now()}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      return body.token || body.accessToken || '';
    } catch (e) {
      return '';
    }
  }
  return '';
}

function submitAnswer(token, sessionId) {
  const payload = JSON.stringify({
    sessionId: sessionId || 'test-session-001',
    questionId: Math.floor(Math.random() * 100) + 1,
    answerId: Math.floor(Math.random() * 4) + 1,
    timeSpentMs: Math.floor(Math.random() * 5000) + 500,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  return http.post(`${BASE_URL}/api/quiz/answer`, payload, { headers });
}

// Normal rate: stay within rate limit
export function normalSubmission() {
  const token = getAuthToken();
  if (!token) {
    errorRate.add(1);
    return;
  }

  const res = submitAnswer(token);
  answerDuration.add(res.timings.duration);

  const passed = check(res, {
    'normal: status is 200': (r) => r.status === 200,
    'normal: response time < 100ms': (r) => r.timings.duration < 100,
  });

  if (passed) {
    successfulSubmits.add(1);
    errorRate.add(0);
  } else {
    errorRate.add(1);
  }

  // Space out requests to stay under 30/min limit
  sleep(2 + Math.random() * 2);
}

// Burst rate: exceed rate limit to verify 429 responses
export function burstSubmission() {
  const token = getAuthToken();
  if (!token) {
    errorRate.add(1);
    return;
  }

  const res = submitAnswer(token);

  check(res, {
    'burst: got response': (r) => r.status === 200 || r.status === 429,
  });

  if (res.status === 429) {
    rateLimited.add(1);
    check(res, {
      'burst: rate limit response has retry-after': (r) =>
        r.headers['Retry-After'] !== undefined ||
        r.headers['retry-after'] !== undefined,
    });
  } else if (res.status === 200) {
    successfulSubmits.add(1);
  }

  // Rapid fire to trigger rate limiting
  sleep(0.1);
}

export function handleSummary(data) {
  const limited = data.metrics.rate_limited_responses
    ? data.metrics.rate_limited_responses.values.count
    : 0;
  const successful = data.metrics.successful_submits
    ? data.metrics.successful_submits.values.count
    : 0;
  const p95 = data.metrics.answer_duration
    ? data.metrics.answer_duration.values['p(95)']
    : 0;

  return {
    stdout: `
=== TC-PERF-005 + TC-SEC-006: Answer Submission Summary ===
Successful submits:     ${successful}
Rate-limited (429):     ${limited}
P95 answer latency:     ${p95.toFixed(2)}ms (threshold: 100ms)
Rate limiting working:  ${limited > 0 ? 'YES' : 'NOT TRIGGERED'}
============================================================
`,
  };
}
