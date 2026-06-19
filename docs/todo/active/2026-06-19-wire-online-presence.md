# 2026-06-19 — Wire online presence (OnlineService) — biết user đang online

> **Source**: User prompt ("sản phẩm có biết user đang online không")
> **Scope**: Nối dây `OnlineService` (Redis) đã có sẵn nhưng chưa được gọi ở đâu → để hệ thống thực sự biết user nào đang online. Quyết định có hiển thị ra UI hay không (cân nhắc "né con số" giai đoạn đầu).
> **Status**: TODO

## Bối cảnh (khảo sát 2026-06-19)

- `OnlineService` đã tồn tại đầy đủ (`setOnline/isOnline/getActivity/setOffline/heartbeat`, Redis key `online:user:{id}` TTL 5 phút) — `apps/api/.../modules/user/service/OnlineService.java` — **NHƯNG `setOnline()`/`heartbeat()` có 0 hit trong toàn BE** → hiện `isOnline()` luôn `false`. Code chết, chưa nối dây.
- `PresenceTracker` + `RoomPresenceListener` ĐÃ chạy thật nhưng **chỉ trong ngữ cảnh phòng multiplayer** (STOMP connect/disconnect), in-memory, single-instance. Không phải "online toàn cục".
- FE `useOnlineStatus.ts` chỉ là `navigator.onLine` (mạng của chính trình duyệt), không liên quan presence user khác.
- STOMP ở FE chỉ connect khi vào phòng (`useStomp.ts`/`useRoomChannel.ts`) → hook STOMP **chỉ** cover user đang trong phòng, KHÔNG cover user đang duyệt app / chơi solo.

## Quyết định cần chốt trước khi code (hỏi user nếu chưa rõ)

1. **Phạm vi "online"**: chỉ trong phòng MP (rẻ, hook sẵn `RoomPresenceListener`) hay toàn app (cần FE heartbeat khi đã đăng nhập)?
2. **Có hiển thị ra UI không?** Memory `early-stage_hide_weak_numbers` / `project_early_stage_hide_weak_numbers`: giai đoạn launch nên "né con số" khi player ít. Khả năng cao chỉ wire backend + để dành, CHƯA show "X người đang online".

## Tasks

- ONL-1 Wire `OnlineService.setOnline` vào STOMP lifecycle (cover user trong phòng MP)
  - Status: `[ ]` TODO · Files: `apps/api/.../modules/room/service/RoomPresenceListener.java` (gọi `onlineService.setOnline(userId, "room:"+roomId)` ở `onConnect`/`onSubscribe`; để TTL 5' tự hết khi disconnect) · Test: unit verify `setOnline` được gọi với email→userId đúng
  - **Spec impact**: `[ ]` None `[x]` BL-N (presence toàn cục chưa có trong spec — cần entry mới)
  - **Spec strategy**: `[ ]` (a) update inline `[x]` (b) new BL-N `[ ]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · spec/BACKLOG updated · `audit.sh` no NEW broken · commit

- ONL-2 (nếu chốt phạm vi toàn app) FE heartbeat khi đã đăng nhập → refresh TTL
  - Status: `[ ]` TODO · Files: BE `POST /api/me/heartbeat` (gọi `onlineService.heartbeat`/`setOnline`) + FE hook ping định kỳ (vd 60s, dùng TanStack Query, KHÔNG `useEffect+fetch` raw) · Test: BE controller test + FE hook test
  - **Spec impact**: `[ ]` None `[x]` BL-N
  - **Spec strategy**: `[ ]` (a) update inline `[x]` (b) new BL-N `[ ]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · spec/BACKLOG updated · `audit.sh` no NEW broken · commit

- ONL-3 Expose `isOnline` qua API (nơi cần: leaderboard row / group member / profile)
  - Status: `[ ]` TODO · Files: enrich DTO tương ứng + service đọc `onlineService.isOnline(userId)` (batch nếu nhiều user) · Test: controller test field `online` đúng
  - **Spec impact**: `[ ]` None `[x]` BL-N
  - **Spec strategy**: `[ ]` (a) update inline `[x]` (b) new BL-N `[ ]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · spec/BACKLOG updated · `audit.sh` no NEW broken · commit

- ONL-4 (defer-able) UI indicator "đang online" — chỉ làm sau khi chốt quyết định #2
  - Status: `[ ]` TODO · Files: component badge/dot · Test: render test · **Cân nhắc "né con số": có thể defer.**
  - **Spec impact**: `[ ]` None `[x]` BL-N
  - **Spec strategy**: `[ ]` (a) update inline `[x]` (b) new BL-N `[ ]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · spec/BACKLOG updated · `audit.sh` no NEW broken · commit

## Out of scope / defer
- Multi-pod HA cho `PresenceTracker` (đã có note Sprint 3) — không nằm trong task này.
- Presence realtime push (broadcast khi user online/offline) — chỉ poll `isOnline` là đủ cho MVP.
