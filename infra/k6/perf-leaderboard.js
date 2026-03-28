import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// TC-PERF-003: Leaderboard read under load
// 1000 req/s GET /leaderboard/global
// Expected: P99 < 500ms, Redis cache hit > 95%

const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');
const cacheHitRate = new Rate('cache_hit_rate');
const leaderboardDuration = new Trend('leaderboard_duration');

export const options = {
  scenarios: {
    sustained_load: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 200,
      maxVUs: 1500,
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<500'],
    http_req_failed: ['rate<0.001'],
    cache_hit_rate: ['rate>0.95'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const periods = ['daily', 'weekly', 'monthly'];
  const period = periods[Math.floor(Math.random() * periods.length)];

  const res = http.get(`${BASE_URL}/api/leaderboard/global?period=${period}`);

  leaderboardDuration.add(res.timings.duration);

  // Detect cache hit via response header or response time heuristic
  const isCacheHit =
    res.headers['X-Cache-Status'] === 'HIT' || res.timings.duration < 10;

  if (isCacheHit) {
    cacheHits.add(1);
    cacheHitRate.add(1);
  } else {
    cacheMisses.add(1);
    cacheHitRate.add(0);
  }

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'body contains leaderboard data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body && typeof body === 'object');
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.05);
}

export function handleSummary(data) {
  const totalReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const p99 = data.metrics.http_req_duration
    ? data.metrics.http_req_duration.values['p(99)']
    : 0;
  const hits = data.metrics.cache_hits ? data.metrics.cache_hits.values.count : 0;
  const misses = data.metrics.cache_misses ? data.metrics.cache_misses.values.count : 0;
  const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : '0';

  return {
    stdout: `
=== TC-PERF-003: Leaderboard Performance Summary ===
Total requests:   ${totalReqs}
P99 latency:      ${p99.toFixed(2)}ms (threshold: 500ms)
Cache hit rate:   ${hitRate}% (threshold: 95%)
Cache hits:       ${hits}
Cache misses:     ${misses}
=====================================================
`,
  };
}
