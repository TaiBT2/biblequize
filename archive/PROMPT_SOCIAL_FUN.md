# #5 Multiplayer Social Fun — Reactions + Challenge Friend

> Thêm vui nhộn cho multiplayer: reactions real-time, thách đấu bạn bè, victory animation.
> Paste vào Claude Code.

---

```
Thêm social fun cho multiplayer. Hiện tại multiplayer có nhưng "lạnh" — không có interaction giữa players ngoài điểm số.

TRƯỚC KHI CODE: đọc WebSocket code, RoomQuiz.tsx, Room entities. Chia tasks vào TODO.md.

## Bước 0: Đọc code

```bash
# WebSocket config
find apps/api/src -name "*WebSocket*" -o -name "*Stomp*" -o -name "*Message*" | xargs cat 2>/dev/null | head -100

# Room entities + service
find apps/api/src -name "*Room*" | xargs cat 2>/dev/null | head -100

# Frontend room quiz
find apps/web/src -name "*Room*" -o -name "*room*" | head -10
cat apps/web/src/pages/RoomQuiz.tsx | head -50
```

---

## Task 1: Real-time Reactions

Players gửi reactions cho nhau trong quiz:

### Backend — WebSocket reaction messages

```java
// ReactionMessage.java
@Data
public class ReactionMessage {
    private String senderId;
    private String senderName;
    private String reaction;  // "😂" "👏" "😱" "🔥" "💪" "🙏"
    private long timestamp;
}

// Trong RoomWebSocketController hoặc message handler:
@MessageMapping("/room/{roomId}/reaction")
public void sendReaction(@DestinationVariable String roomId,
                          @Payload ReactionMessage message,
                          SimpMessageHeaderAccessor header) {
    // Rate limit: max 3 reactions per 10 seconds per user
    if (reactionRateLimiter.isAllowed(message.getSenderId())) {
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/reactions",
            message
        );
    }
}
```

### Frontend — Reaction bar + floating reactions

```typescript
// Reaction bar (bottom of quiz screen, above answer buttons)
const REACTIONS = ['👏', '😂', '😱', '🔥', '💪', '🙏']

const ReactionBar = ({ roomId }) => {
  const sendReaction = (emoji: string) => {
    stompClient.publish({
      destination: `/app/room/${roomId}/reaction`,
      body: JSON.stringify({ reaction: emoji, senderId: myId, senderName: myName })
    })
    haptic.tap()
  }
  
  return (
    <div className="flex gap-2 justify-center py-2">
      {REACTIONS.map(emoji => (
        <button key={emoji} onClick={() => sendReaction(emoji)}
          className="text-2xl hover:scale-125 transition-transform active:scale-90">
          {emoji}
        </button>
      ))}
    </div>
  )
}

// Floating reaction animation (appears from sender position, floats up)
const FloatingReaction = ({ reaction, senderName }) => (
  <div className="floating-reaction animate-floatUp">
    <span className="text-3xl">{reaction}</span>
    <span className="text-xs text-white/50">{senderName}</span>
  </div>
)

// CSS
.floating-reaction {
  position: absolute;
  animation: floatUp 2s ease-out forwards;
  pointer-events: none;
}

@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-200px) scale(0.5); opacity: 0; }
}
```

Commit: "feat: real-time reactions in multiplayer rooms"

---

## Task 2: Live Feed — "X vừa trả lời"

Khi 1 player trả lời → thông báo cho tất cả:

### Backend — broadcast answer events

```java
// Khi player submit answer (đã có trong room flow)
// Thêm broadcast:

public void processAnswer(String roomId, String playerId, String answerId) {
    boolean isCorrect = checkAnswer(answerId);
    
    // Existing: update score
    // ...
    
    // NEW: broadcast live feed event
    LiveFeedEvent event = LiveFeedEvent.builder()
        .playerId(playerId)
        .playerName(getPlayerName(playerId))
        .type(isCorrect ? "CORRECT" : "WRONG")
        .questionNumber(currentQuestionIndex + 1)
        .timeUsed(calculateTimeUsed())
        .build();
    
    messagingTemplate.convertAndSend(
        "/topic/room/" + roomId + "/feed",
        event
    );
}
```

### Frontend — Live feed messages

```typescript
// Nhỏ, hiện dưới scoreboard, auto-dismiss sau 3s

const LiveFeed = () => {
  const [events, setEvents] = useState<LiveFeedEvent[]>([])
  
  useEffect(() => {
    // Subscribe to feed
    stompClient.subscribe(`/topic/room/${roomId}/feed`, (msg) => {
      const event = JSON.parse(msg.body)
      setEvents(prev => [...prev.slice(-3), event]) // Keep last 3
      
      // Auto remove after 3s
      setTimeout(() => {
        setEvents(prev => prev.filter(e => e !== event))
      }, 3000)
    })
  }, [])
  
  return (
    <div className="live-feed absolute top-20 right-4 space-y-1">
      {events.map((e, i) => (
        <div key={i} className={`text-xs px-3 py-1 rounded-full animate-slideIn
          ${e.type === 'CORRECT' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {e.type === 'CORRECT' 
            ? `✅ ${e.playerName} trả lời đúng! (${e.timeUsed}s)`
            : `❌ ${e.playerName} trả lời sai`
          }
        </div>
      ))}
    </div>
  )
}
```

Fun messages (random):
```typescript
const getCorrectMessage = (name: string, time: number) => {
  const messages = [
    `✅ ${name} trả lời đúng! (${time}s)`,
    `🎯 ${name} chính xác!`,
    `💪 ${name} quá giỏi!`,
    `⚡ ${name} nhanh như chớp! (${time}s)`,
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

const getWrongMessage = (name: string) => {
  const messages = [
    `❌ ${name} trả lời sai`,
    `😅 ${name} nhầm rồi`,
    `📖 ${name} cần ôn thêm`,
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}
```

Commit: "feat: live feed — player answer notifications in room"

---

## Task 3: Challenge Friend — Thách đấu 1v1

### Backend

```java
// ChallengeService.java

@Service
public class ChallengeService {

    /**
     * User A thách đấu User B.
     * Tạo private room 2 người, gửi notification cho B.
     */
    public Challenge createChallenge(Long challengerId, Long challengedId) {
        // Validate: không thách chính mình, người kia đang online
        if (challengerId.equals(challengedId)) {
            throw new BadRequestException("Không thể thách đấu chính mình");
        }
        
        // Tạo challenge record
        Challenge challenge = Challenge.builder()
            .challengerId(challengerId)
            .challengedId(challengedId)
            .status(ChallengeStatus.PENDING)
            .expiresAt(LocalDateTime.now().plusMinutes(5)) // Hết hạn sau 5 phút
            .build();
        
        challengeRepository.save(challenge);
        
        // Gửi notification cho người bị thách
        notificationService.sendPush(challengedId, 
            "⚔️ Thách đấu!", 
            challengerName + " muốn thách đấu bạn!",
            Map.of("type", "challenge", "challengeId", challenge.getId().toString())
        );
        
        // Gửi WebSocket real-time
        messagingTemplate.convertAndSendToUser(
            challengedId.toString(),
            "/queue/challenges",
            challenge
        );
        
        return challenge;
    }
    
    public void acceptChallenge(Long challengeId, Long userId) {
        Challenge challenge = challengeRepository.findById(challengeId).orElseThrow();
        
        if (!challenge.getChallengedId().equals(userId)) {
            throw new ForbiddenException("Không phải bạn được thách đấu");
        }
        
        if (challenge.isExpired()) {
            throw new BadRequestException("Lời thách đấu đã hết hạn");
        }
        
        // Tạo private room 2 người
        Room room = roomService.createPrivateRoom(
            challenge.getChallengerId(), 
            challenge.getChallengedId(),
            "SPEED_RACE",
            10 // 10 câu
        );
        
        challenge.setStatus(ChallengeStatus.ACCEPTED);
        challenge.setRoomId(room.getId());
        challengeRepository.save(challenge);
        
        // Notify cả 2 → join room
        notifyBothPlayers(challenge, room);
    }
    
    public void declineChallenge(Long challengeId, Long userId) {
        Challenge challenge = challengeRepository.findById(challengeId).orElseThrow();
        challenge.setStatus(ChallengeStatus.DECLINED);
        challengeRepository.save(challenge);
        
        // Notify challenger
        notificationService.sendPush(challenge.getChallengerId(),
            "Thách đấu bị từ chối",
            challengedName + " không chấp nhận lời thách đấu");
    }
}
```

### API

```java
POST /api/challenges                    // Tạo challenge
  Body: { "challengedUserId": 123 }
  Response: { "challengeId": 456, "status": "PENDING", "expiresAt": "..." }

POST /api/challenges/{id}/accept        // Chấp nhận
  Response: { "roomId": "abc-123", "roomCode": "ABC123" }

POST /api/challenges/{id}/decline       // Từ chối

GET /api/challenges/pending             // Lời thách đấu đang chờ
```

### Frontend — Challenge UI

```
Từ Leaderboard hoặc Profile người khác:

┌─────────────────────┐
│  Nguyễn Văn An      │
│  ⭐ 12,000 điểm     │
│  🔥 Tier: Ngọn Lửa  │
│                     │
│  [⚔️ Thách đấu]     │
└─────────────────────┘

Tap → popup confirm:
┌──────────────────────────────────────┐
│  ⚔️ Thách đấu An?                   │
│                                      │
│  Speed Race • 10 câu                │
│  An có 5 phút để chấp nhận.         │
│                                      │
│  [Hủy]        [Gửi thách đấu! ⚔️]   │
└──────────────────────────────────────┘

Người bị thách → nhận notification:
┌──────────────────────────────────────┐
│  ⚔️ Bui muốn thách đấu bạn!        │
│                                      │
│  Speed Race • 10 câu                │
│  Hết hạn sau: 4:32                  │
│                                      │
│  [Từ chối]    [Chấp nhận! ⚔️]        │
└──────────────────────────────────────┘
```

Commit: "feat: challenge friend — 1v1 thách đấu"

---

## Task 4: Victory Celebration + Rematch

### Khi kết thúc multiplayer room:

```
┌──────────────────────────────────────┐
│                                      │
│  👑 An chiến thắng!                  │
│                                      │
│  1. 👑 An          950 điểm          │
│  2. 🥈 Bui         820 điểm          │
│  3. 🥉 Chi         750 điểm          │
│                                      │
│  [🔄 Chơi lại]  [🏠 Trang chủ]      │
│  [⚔️ Thách đấu người thắng]         │
│                                      │
└──────────────────────────────────────┘
```

Winner: confetti + crown animation + victory sound
Loser: "Lần sau sẽ tốt hơn!" + motivational Bible verse

"Chơi lại" → tạo room mới cùng settings, invite tất cả players.

Commit: "feat: multiplayer victory + rematch"

---

## Task 5: Online Indicator + "X đang chơi"

```java
// OnlineService.java — track ai đang online

// Redis set: online:users → {userId1, userId2, ...}
public void setOnline(Long userId) {
    redisTemplate.opsForSet().add("online:users", userId.toString());
    redisTemplate.expire("online:users:" + userId, Duration.ofMinutes(5));
}

// GET /api/friends/online
// Response: [{ userId: 1, name: "An", status: "playing_quiz" }, ...]
```

Frontend — trên Groups hoặc Friends list:
```
┌──────────────────────────────────────┐
│  👥 Đang online (3)                  │
│                                      │
│  🟢 An — đang chơi Daily Challenge   │
│  🟢 Bình — đang ở trang chủ         │
│  🟢 Chi — đang trong room #ABC      │
│                                      │
│  [⚔️ Thách đấu An]                  │
└──────────────────────────────────────┘
```

Commit: "feat: online status + activity indicator"

---

## Task 6: Tests

```java
// Reactions
@Test
void sendReaction_broadcastsToRoom() {}

@Test  
void sendReaction_rateLimited_3per10seconds() {}

// Challenge
@Test
void createChallenge_sendsPushNotification() {}

@Test
void createChallenge_cannotChallengeSelf() {}

@Test
void acceptChallenge_createsPrivateRoom() {}

@Test
void challenge_expiresAfter5Minutes() {}

@Test
void declineChallenge_notifiesChallenger() {}

// Live feed
@Test
void answerEvent_broadcastsToRoom() {}

@Test
void liveFeed_includesPlayerNameAndTime() {}

// Online
@Test
void setOnline_addsToRedisSet() {}

@Test
void onlineStatus_expiresAfter5Minutes() {}
```

Commit: "test: reactions + challenges + live feed + online"

---

## Thứ tự:
1. Task 1: Reactions (WebSocket + UI)
2. Task 2: Live feed (answer notifications)  
3. Task 3: Challenge friend (1v1)
4. Task 4: Victory + rematch
5. Task 5: Online indicator
6. Task 6: Tests

Total effort: 2-3 ngày. Impact: ⭐⭐⭐
```
