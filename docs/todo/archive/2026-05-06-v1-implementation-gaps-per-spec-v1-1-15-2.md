# 2026-05-06 — v1 implementation gaps (per SPEC v1.1 §15.2) [DONE]

> **Source:** SPEC_GROUP_v1.1.md §15.2 lists 6 v1 gaps tracked separately. This batch picks 5 bounded gaps; skips Q-K (push notifications, needs FCM infra) and GFA-17 (solo refactor, large architectural change — defer until evidence of usage).

### Tasks

#### Task GAP-E: Max 2 groups owned per user [x] DONE
- **Spec ref**: §4.2 line 218-235, Phụ lục A
- **File**: `ChurchGroupService.createGroup` + `ChurchGroupRepository.countByLeaderIdAndDeletedAtIsNull`
- **Scope**: ~15 LOC + 1 test

#### Task GAP-F: Max 5 groups joined per user [x] DONE
- **Spec ref**: §4.3 line 276, Phụ lục A
- **File**: `ChurchGroupService.joinGroup` + `GroupMemberRepository.countByUserId`
- **Scope**: ~10 LOC + 1 test

#### Task GAP-J: 1 active room per user enforcement [x] DONE
- **Spec ref**: §8.7 line 631-632
- **File**: `RoomService.joinRoom` + `RoomPlayerRepository.findActiveRoomByUserId`
- **Scope**: ~15 LOC + 1 test

#### Task GAP-L: 7-day re-join cooldown after kick [x] DONE
- **Spec ref**: §12.2 line 841-842, Phụ lục A
- **Files**: V41 migration (new table `group_kick_log`), new entity + repo, hook into `kickMember` + `joinGroup`
- **Scope**: ~50 LOC + DB migration

#### Task GAP-M: Report group endpoint [x] DONE
- **Spec ref**: §12.4 + §13.9 + §14.4
- **Files**: V41 migration adds `group_report` table, new entity + repo + controller endpoint
- **Scope**: ~80 LOC + DB migration

### Skipped (out of scope this session)

- **Q-K Push notifications** (11 events): needs FCM/APNs infra setup, much larger feature. Track as v1.5 work.
- **GFA-17 solo→Practice refactor**: major architectural change, defer per spec v1.1 §7.5 implementation note.

---
