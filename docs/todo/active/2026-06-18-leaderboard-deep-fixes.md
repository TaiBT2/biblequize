# 2026-06-18 — Leaderboard deep-dive fixes

> **Source**: Đào sâu tính năng Bảng Xếp Hạng (BE `LeaderboardController` + `PublicLeaderboardController` + `UserDailyProgressRepository`, FE `pages/Leaderboard.tsx`, spec `SPEC_USER §22`). Phát hiện bug ranking, scalability risk, spec drift, privacy gap, UX dead-zone.
> **Scope**: BE leaderboard query/rank + FE Leaderboard page + spec §22 reconcile. KHÔNG đụng module khác (group leaderboard BL-2/BL-16 nằm ngoài scope — đó là `ChurchGroupService`).
> **Branch**: `fix/leaderboard-fixes`
> **Phân tích gốc**: xem hội thoại 2026-06-18 (7 nhóm vấn đề: correctness / scalability / spec-drift / privacy / UX).

## Thứ tự ưu tiên
P0 (correctness): LBF-1, LBF-2 · P1: LBF-11 (launch-blocking presentation), LBF-3, LBF-4, LBF-5 · P2: LBF-9+LBF-12+LBF-13 (dẹp mùa thi đua), LBF-6 (gộp LBF-11), LBF-7, LBF-8 · P3: LBF-10

## Quyết định (2026-06-18)
- **LBF-7** → GỠ UI chết streak/trend (không implement).
- **LBF-8** → KHÔNG thêm tab daily/monthly; đánh dấu BE-only trong spec.
- **"Né con số" giai đoạn đầu** → task LBF-11 (gộp dead-zone LBF-6), ngưỡng N=10. Chưa có user → tránh phơi con số yếu.
- **Dẹp "mùa thi đua"** → LBF-9 (ẩn tab Mùa) + LBF-12 (ẩn SeasonCard Ranked) + LBF-13 (ngừng double-write `season_rankings`). Ẩn UI + ngừng ghi, **KHÔNG drop** table/endpoint.
- **GIỮ "mùa phụng vụ"** (Liturgical Coverage + ×1.5 + badge, flag OFF) — OUT OF SCOPE, không đụng. Differentiator tương lai, đang vô hại.

---

### Tasks

- LBF-1 (P0) BE: rank tie-break nhất quán giữa `/my-rank` và bảng
  - Status: [x] DONE · Files: `LeaderboardController.java` (5 my-rank methods truyền questions+createdAt), `UserDailyProgressRepository.java` (4 count queries 3-tầng tie-break), `LeaderboardControllerTest`, `UserDailyProgressRepositoryTest` (+4 lock tests), `SPEC_USER §22.5` · Test: BE api+service 864 + repo lock 12 pass
  - Detail: Bảng `ORDER BY points DESC, questions DESC, created_at ASC` (3 tầng tie-break) nhưng `countUsersAhead*` chỉ đếm `points > X` → rank cá nhân lệch vị trí thật khi trùng điểm. Sửa các `countUsersAhead*` để áp dụng cùng tie-break (đếm thêm user cùng điểm nhưng questions cao hơn, hoặc questions bằng + created_at sớm hơn). Cần truyền thêm `questions` + `createdAt` của user vào count query.
  - **Spec impact**: [ ] None [x] SPEC_USER §22.3 (rank semantics — clarify) · **Spec strategy**: [ ] (a) update inline (ghi rõ tie-break trong §22)
  - Checklist: impl · Tầng 1+2+3 BE pass · spec §22 ghi tie-break · `audit.sh` no NEW broken · commit

- LBF-2 (P0) BE: điều tra root-cause duplicate rows (gỡ band-aid FE LB-1.2)
  - Status: [x] DONE · Kết luận: **impossible by schema** — `user_daily_progress` có `UNIQUE(user_id, date)` (daily 1 row/user) + weekly/all-time `GROUP BY u.id` (PK). Không query nào dupe được → gỡ dead guard + test LB-1.2 dedup. Files: `Leaderboard.tsx`, `Leaderboard.test.tsx` · Test: FE 1333 pass
  - Detail: FE `Leaderboard.tsx:89-93` lọc trùng `userId` "phòng khi BE trả duplicate". `GROUP BY u.id,...` về lý thuyết unique theo id. Điều tra: có user trùng (cùng email nhiều row `users`?) / join nở / cache cũ? Tìm root-cause → fix BE → gỡ dedup phòng thủ FE (hoặc giữ + comment lý do nếu là edge thật). KHÔNG để band-aid che bug (memory: defensive_any_cast_hides_bugs).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2+3 (BE+FE) pass · commit

- LBF-3 (P1) BE: aggregate/ZSET thay full-table scan (scalability)
  - Status: [ ] TODO · Files: TBD — design trước (CacheService/Redis ZSET hoặc bảng `user_leaderboard_stats` + Flyway V{n}), `SessionService.completeSession` hook · Test: JUnit + load assertion
  - Detail: all-time/season chạy `SUM ... GROUP BY user_id` toàn bảng mỗi cache-miss (60s); `my-rank` all-time nạp hết UDP user vào JVM rồi sum + thêm 1 full-scan count. Sẽ chậm tuyến tính theo (users×days). Đề xuất: Redis Sorted Set per-period (`ZREVRANGE` top-N, `ZREVRANK` my-rank O(log n), around-me = `ZRANGE` quanh rank) — giải quyết luôn LBF-1 (rank nhất quán) + LBF-4 (around-me). HOẶC bảng denormalized cập nhật tại completeSession. **Task lớn — chia nhỏ khi vào làm; cần design doc + user review trước khi đụng `SessionService` (sensitive).**
  - **Spec impact**: [x] None (perf, no behavior change nếu giữ ngữ nghĩa) · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: design doc · impl từng phần <100 LOC · Tầng 3 BE · benchmark before/after · commit từng phần

- LBF-4 (P1) BE+FE: implement `GET /api/leaderboard/around-me` (spec §22.3)
  - Status: [x] DONE · Files: `LeaderboardController.java` (+`/around-me` reuse board query, offset=rank-radius-1), `Leaderboard.tsx` (window thay sticky + fallback), i18n, tests, `SPEC_USER §22.3` · Test: BE api+service 866 + FE 1338 pass
  - Detail: Spec §22.3 hứa around-me (5 trên + bạn + 5 dưới) nhưng endpoint KHÔNG tồn tại; FE chỉ có 1 dòng sticky. Implement endpoint + thay sticky bằng around-me window khi user ngoài top-20. Phụ thuộc LBF-3 nếu chuyển ZSET (around-me gần như free). Nếu làm trước LBF-3: viết query window theo rank.
  - **Spec impact**: [x] SPEC_USER §22.3 (catch-up) · **Spec strategy**: [ ] (a) update inline (mark implemented)
  - Checklist: impl · Tầng 3 (BE+FE) · spec §22.3 cập nhật · commit

- LBF-5 (P1) BE+FE: privacy — leaderboard visibility opt-out + bỏ userId khỏi public response
  - Status: [x] DONE (4 commit: 5a userId / 5b migration+endpoint / 5c query filter / 5d FE toggle)
  - 5a `492eab18` bỏ userId khỏi `/api/public/leaderboard`. 5b `7f181c90` V69 `leaderboard_visible` + PATCH/GET /api/me. 5c `ca974f14` filter 6 native + 1 JPQL query (display + count → ranks nhất quán). 5d FE toggle `PrivacySettings.tsx` ở Profile + i18n + test.
  - Ngữ nghĩa: opt-out = lọc khỏi CẢ hiển thị lẫn đếm hạng → hidden user không làm xê dịch hạng người khác; vẫn tự xem được hạng mình.
  - Test: BE 883 · FE 1342 pass
  - Detail: `SPEC_USER §21` hứa "leaderboard visibility" nhưng KHÔNG implement — mọi user >0 điểm đều hiện. Thêm flag `leaderboardVisible` (default true) + filter trong query. Đồng thời `PublicLeaderboardController` đang trả raw `userId` (UUID) cho guest vô danh → bỏ field này khỏi response public (chỉ name+avatar+points+questions).
  - **Spec impact**: [x] SPEC_USER §21 + §22 · **Spec strategy**: [ ] (a) update inline
  - Checklist: impl · migration clean DB trống · Tầng 3 BE · spec cập nhật · commit

- LBF-6 (P2) FE: fix dead-zone bảng 1–2 người  — **gộp thực thi vào LBF-11**
  - Status: [ ] TODO (làm cùng LBF-11) · Files: `Leaderboard.tsx`, test · Test: Vitest (list.length 1 và 2 → không trắng)
  - Detail: Podium chỉ render khi `top3.length>=3`; với 1–2 user, nhánh `noData` bị bỏ (list.length!==0) và list cũng null (`rest.length===0 && list.length<=3`) → **màn hình trắng**. Sửa: fallback render list thường khi <3 người (hoặc podium linh hoạt 1–2 chỗ). Là 1 mặt của chiến lược low-data → triển khai trong LBF-11.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 3 FE · commit

- LBF-7 (P2) FE: gỡ UI chết streak/trend  — **decision 2026-06-18: GỠ**
  - Status: [x] DONE · Files: `Leaderboard.tsx`, `Leaderboard.test.tsx` · Test: Vitest full 1337 pass (≥baseline)
  - Detail: FE render 🔥 streak + ▲▼ trend nhưng BE không populate → affordance không bao giờ hiện. **Quyết định: GỠ** — bỏ props `streak`/`trend` + nhánh render tương ứng trong `LeaderboardListRow` (cả isMe + thường) + ngừng truyền từ `rest.map`/sticky. Không đụng BE. Cần lại sau → task implement riêng.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 3 FE · commit

- LBF-8 (P2) Spec: daily/monthly = BE-only, KHÔNG thêm tab — **decision 2026-06-18: KHÔNG làm**
  - Status: [x] DONE · Files: `SPEC_USER §22.1` (cột UI + note BE-only) · Test: audit.sh broken=100 (no NEW)
  - Detail: **Quyết định: KHÔNG thêm tab daily/monthly.** Lý do: giai đoạn đầu ít user → board daily/monthly thưa, con số nhỏ phản tác dụng (xem LBF-11). FE giữ 3 tab all_time/season/weekly. Cập nhật `SPEC_USER §22.1` đánh dấu `/daily` + `/monthly` là **BE-only (chưa surface UI giai đoạn đầu)** — KHÔNG xoá endpoint.
  - **Spec impact**: [x] SPEC_USER §22.1 · **Spec strategy**: [ ] (a) update inline
  - Checklist: spec cập nhật · `audit.sh` no NEW broken · commit

#### Nhóm "Dẹp mùa thi đua giai đoạn đầu" (LBF-9 + LBF-12 + LBF-13) — decision 2026-06-18

> **Bối cảnh**: "mùa" dính điểm/rank ở 5 chỗ (A tab leaderboard · B ledger `season_rankings` · C ×1.5 liturgical · D SeasonCard trang Ranked · E hệ Liturgical Coverage). Tách 2 nghĩa: **mùa thi đua** (A+B+D) → dẹp; **mùa phụng vụ** (C+E) → GIỮ NGUYÊN, flag OFF (differentiator tương lai, đang vô hại).
> **Quyết định mức dẹp**: ẩn UI + ngừng double-write. **KHÔNG drop** table/entity/endpoint (giữ ngủ, đảo ngược dễ, data còn).
> **OUT OF SCOPE (KHÔNG đụng)**: `modules/coverage/**`, `LiturgicalSeasonService`, `ScoringService.isInSeasonBook` ×1.5, `FeatureFlagService`. Để flag `liturgical-coverage.enabled=false`.

- LBF-9 (P2) FE: ẩn tab "Mùa" khỏi leaderboard (A)
  - Status: [x] DONE · Files: `Leaderboard.tsx`, `Leaderboard.test.tsx`, `SPEC_USER §22.1/22.2`, `DECISIONS.md` · Test: Vitest full 1334 pass · audit.sh exit 0
  - Detail: Bỏ entry `{ key: 'season' }` khỏi `tabs`; mặc định `all_time`. Ẩn `seasonCountdown` header. Giữ code BE `/season` + `/api/seasons/active` ngủ (không gọi từ FE). Xử lý deep-link cũ `?period=season` → fallback all_time.
  - **Spec impact**: [x] SPEC_USER §22.1/§22.2 · **Spec strategy**: [ ] (a) update inline (đánh dấu season tab ẩn giai đoạn đầu)
  - Checklist: impl · Tầng 3 FE · spec §22 cập nhật + DECISIONS.md entry · `audit.sh` · commit

- LBF-12 (P2) FE: ẩn SeasonCard trên trang Ranked (D)
  - Status: [x] DONE · Files: `Ranked.tsx` (gỡ import + mount; giữ `SeasonCard.tsx` để bật lại) · Test: Vitest full 1334 pass
  - Detail: SeasonCard phơi "Hạng mùa #N / Điểm mùa N / còn X đến 1000đ" + chip ×1.5 + badge "Vinh Quang Mùa" (×1.5 đang OFF, badge chưa trao) → đúng loại số yếu cần né. Ẩn card (gate bằng cờ FE hoặc gỡ mount). Không gọi `/api/seasons/{id}/my-rank` nữa. Giữ component file để bật lại sau.
  - **Spec impact**: [x] None (ẩn UI, no business change) · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 3 FE · commit

- LBF-13 (P2) BE: ngừng double-write `season_rankings` (B)
  - Status: [x] DONE · Files: `RankedController.java` (bỏ `seasonService.addPoints` call) · Test: BE full api+service 864 pass (≥baseline); RankedControllerTest 51 pass
  - Detail: Ranked điểm đã vào `UserDailyProgress` (dòng 638); `addPoints` ghi lần 2 vào `season_rankings` — thừa, và leaderboard season tab thậm chí không đọc bảng này. Bỏ call `addPoints` (1 dòng) → hết double-write + tiết kiệm 1 DB write/câu. Giữ `SeasonService`/`SeasonRanking`/`SeasonController` ngủ (no caller mới). KHÔNG drop table (data cũ giữ).
  - **Spec impact**: [x] None (số liệu UDP không đổi) · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+2+3 BE (RankedController sensitive — chạy full) · commit

- LBF-10 (P3) BE: `my-rank` dùng SELECT SUM thay vì sum trong JVM
  - Status: [x] DONE · Files: `UserDailyProgressRepository.java` (+2 `sumPointsAndQuestions*`), `LeaderboardController.java` (4 my-rank methods + `intAt` helper), test · Test: BE api+service 864 (context load = JPQL valid)
  - Detail: `getMyAllTimeRank`/`getMyWeeklyRank`/... nạp toàn bộ UDP rows về app rồi `.stream().sum()`. Thay bằng `SELECT SUM(points_counted)` trong DB. Có thể gộp vào LBF-3 nếu chuyển ZSET (khi đó bỏ luôn). Làm độc lập nếu LBF-3 defer.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 3 BE · commit

- LBF-11 (P1) FE: chiến lược "né con số" giai đoạn đầu (low-data presentation) — gộp LBF-6
  - Status: [ ] TODO · Files: `Leaderboard.tsx`, `LeaderboardRankWidget.tsx`, `LeaderboardSeasonWidget.tsx`, `EmptyLeaderboardCTA.tsx`, tests · Test: Vitest (low-data states)
  - **Ngưỡng chốt 2026-06-18: N = 10** (board có < 10 người-có-điểm → coi là "đang khởi động", bật chế độ né số). Scope = cả 4 mục dưới (user chọn hết).
  - Status: [~] board surface DONE (commit a81fb0a8) · Home surfaces = follow-up (cần user chốt, xem dưới)
  - Detail: Giai đoạn đầu chưa có user → tránh phơi con số yếu. Kết quả khảo sát từng item:
    - [x] **Board /leaderboard thưa → seed-state** (commit a81fb0a8): < 10 người → "Bảng đang khởi động" numberless + CTA thay podium/list. Gồm fix dead-zone 1–2 người (LBF-6). FE 1335 pass.
    - [x] **Giấu mẫu số "x/y"**: KHÔNG cần làm gì — denominators duy nhất là `weeklyRank.total` (Home:338/438) nhưng BE `getMyWeeklyRank` KHÔNG trả `total` → đã inert, không bao giờ render. ✅ by absence.
    - [x] **Giấu đếm người chơi**: KHÔNG có active surface nào hiện participant count (chỉ SeasonCard cũ — đã ẩn LBF-12). ✅ by absence.
    - [x] **Widget Home rank yếu — DONE** (Home redesign đã xong 2026-06-19 → hết vướng): Home weekly card fetch 5→10 để biết population; khi <10 người → card hiện message khích lệ thay rows thưa + ẩn `#wRank` ở hero (Home:338) + ranked ModeCard (Home:438) + climb CTA. Gỡ luôn `/total` chết (BE không trả). `LeaderboardRankWidget`/`SeasonWidget` vẫn là dead code (mount ở đâu cũng không) → bỏ qua. Test: Home 19 + FE 1343 pass.
  - **Spec impact**: [x] None (presentation, no business-rule change) · **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: chốt scope · impl từng phần <100 LOC · Tầng 3 FE · commit
