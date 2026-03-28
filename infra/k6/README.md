# BibleQuiz Performance Tests (k6)

## Prerequisites
- Install k6: https://k6.io/docs/get-started/installation/
- App running on localhost:8080

## Run

```bash
# TC-PERF-001: API read P95 < 200ms
k6 run infra/k6/perf-api-read.js

# TC-PERF-002: WebSocket 100 concurrent
k6 run infra/k6/perf-websocket.js

# TC-PERF-003: Leaderboard 1000 req/s
k6 run infra/k6/perf-leaderboard.js

# TC-PERF-004: Share card P95 < 3s
k6 run infra/k6/perf-share-card.js

# TC-PERF-005: Answer submission P95 < 100ms + rate limiting
k6 run infra/k6/perf-answer-submit.js
```

### Custom base URL

```bash
k6 run --env BASE_URL=http://staging:8080 infra/k6/perf-leaderboard.js
k6 run --env WS_URL=ws://staging:8080/ws infra/k6/perf-websocket.js
```

## Test Cases

| ID | Script | Target |
|---|---|---|
| TC-PERF-001 | perf-api-read.js | API read P95 < 200ms, error rate < 0.1% |
| TC-PERF-002 | perf-websocket.js | WebSocket 100 concurrent, messages < 1s |
| TC-PERF-003 | perf-leaderboard.js | Leaderboard 1000 req/s, P99 < 500ms, cache > 95% |
| TC-PERF-004 | perf-share-card.js | Share card generation P95 < 3s |
| TC-PERF-005 | perf-answer-submit.js | Answer submit P95 < 100ms, rate limit 429 at > 30/min |
