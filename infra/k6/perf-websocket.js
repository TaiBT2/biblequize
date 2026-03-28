import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// TC-PERF-002: WebSocket 100 users in 1 room
// Simulate 100 concurrent connections to ws://localhost:8080/ws
// Expected: All messages received < 1s, no drops

const messageLatency = new Trend('ws_message_latency');
const messagesReceived = new Counter('ws_messages_received');
const messagesSent = new Counter('ws_messages_sent');
const connectionErrors = new Counter('ws_connection_errors');
const messageDropRate = new Rate('ws_message_drop_rate');

export const options = {
  scenarios: {
    websocket_room: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 50 },   // ramp to 50
        { duration: '15s', target: 100 },  // ramp to 100
        { duration: '1m', target: 100 },   // sustained 100
        { duration: '10s', target: 0 },    // ramp down
      ],
    },
  },
  thresholds: {
    ws_message_latency: ['p(95)<1000'],
    ws_connection_errors: ['count<5'],
    ws_message_drop_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.WS_URL || 'ws://localhost:8080/ws';
const ROOM_ID = __ENV.ROOM_ID || 'perf-test-room';

export default function () {
  const userId = `k6_user_${__VU}`;
  let messagesExpected = 0;
  let messagesGot = 0;

  const res = ws.connect(
    `${BASE_URL}?roomId=${ROOM_ID}&userId=${userId}`,
    {},
    function (socket) {
      socket.on('open', () => {
        // Send STOMP-like connect frame
        socket.send(
          JSON.stringify({
            type: 'CONNECT',
            roomId: ROOM_ID,
            userId: userId,
          })
        );
      });

      socket.on('message', (msg) => {
        messagesReceived.add(1);
        messagesGot++;

        try {
          const data = JSON.parse(msg);
          if (data.timestamp) {
            const latency = Date.now() - data.timestamp;
            messageLatency.add(latency);
          }
        } catch (e) {
          // non-JSON message, still count it
        }
      });

      socket.on('error', (e) => {
        connectionErrors.add(1);
      });

      // Simulate user activity: send periodic messages over 30s
      const interval = 3; // seconds between messages
      const totalMessages = 10;

      for (let i = 0; i < totalMessages; i++) {
        sleep(interval);

        const payload = JSON.stringify({
          type: 'ANSWER',
          roomId: ROOM_ID,
          userId: userId,
          questionId: i + 1,
          answerId: Math.floor(Math.random() * 4) + 1,
          timestamp: Date.now(),
          timeSpentMs: Math.floor(Math.random() * 5000) + 500,
        });

        socket.send(payload);
        messagesSent.add(1);
        messagesExpected++;
      }

      // Wait a bit for final messages to arrive
      sleep(5);

      socket.close();
    }
  );

  // Track message drop rate
  if (messagesExpected > 0 && messagesGot < messagesExpected) {
    messageDropRate.add(1);
  } else {
    messageDropRate.add(0);
  }

  check(res, {
    'WebSocket connected successfully': (r) => r && r.status === 101,
  });
}

export function handleSummary(data) {
  const sent = data.metrics.ws_messages_sent
    ? data.metrics.ws_messages_sent.values.count
    : 0;
  const received = data.metrics.ws_messages_received
    ? data.metrics.ws_messages_received.values.count
    : 0;
  const connErrors = data.metrics.ws_connection_errors
    ? data.metrics.ws_connection_errors.values.count
    : 0;
  const p95 = data.metrics.ws_message_latency
    ? data.metrics.ws_message_latency.values['p(95)']
    : 0;

  return {
    stdout: `
=== TC-PERF-002: WebSocket Performance Summary ===
Messages sent:        ${sent}
Messages received:    ${received}
Connection errors:    ${connErrors}
P95 message latency:  ${p95.toFixed(2)}ms (threshold: 1000ms)
===================================================
`,
  };
}
