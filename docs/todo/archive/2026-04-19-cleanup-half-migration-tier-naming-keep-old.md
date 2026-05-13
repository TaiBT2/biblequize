# 2026-04-19 — Cleanup half-migration tier naming (keep OLD) [DONE]

### Decision summary
- User (product owner) quyết định giữ **OLD religious naming** (Tân Tín Hữu → Người Tìm Kiếm → Môn Đồ → Hiền Triết → Tiên Tri → Sứ Đồ) vì target audience là Tin Lành + Công Giáo.
- SPEC_USER_v3.md section 3.1 (light-themed naming Tia Sáng → Vinh Quang) được **superseded**.
- Half-migration debris cần clean up để codebase nhất quán.

### Task CL-1: Fix inconsistent TIERS array in Home.tsx + Ranked.tsx
- Status: [x] DONE — `'tiers.spark'` → `'tiers.newBeliever'`, update comment ref spec/ADR
- Vấn đề: Tier 1 dùng NEW key `'tiers.spark'`, tier 2-6 dùng OLD keys → cùng array mixed
- Fix: `'tiers.spark'` → `'tiers.newBeliever'` (2 files, 1 line mỗi file)
- Update stale comment "SPEC-v2 section 2.1" sang tham chiếu SPEC_USER_v3 + ADR
- Commit: "refactor(web): consistent OLD tier keys in Home + Ranked TIERS arrays"

### Task CL-2: Fix LandingPage tier keys
- Status: [x] DONE — 4 entries: glory→apostle, star→prophet, flame→sage, lamp→disciple
- File: apps/web/src/pages/LandingPage.tsx (line 259-262)
- 4 entries: `tiers.glory` → `apostle`, `tiers.star` → `prophet`, `tiers.flame` → `sage`, `tiers.lamp` → `disciple`
- Commit: "refactor(web): use OLD tier keys in LandingPage leaderboard demo"

### Task CL-3: Remove duplicate NEW keys from i18n
- Status: [x] DONE — xóa 6 keys (spark/dawn/lamp/flame/star/glory) ở cả vi.json + en.json
- File: vi.json + en.json
- Xóa 6 keys: `spark`, `dawn`, `lamp`, `flame`, `star`, `glory` (unused sau CL-1, CL-2)
- Keep: `newBeliever`, `seeker`, `disciple`, `sage`, `prophet`, `apostle`
- Commit: "chore(web): remove unused NEW tier keys from i18n"

### Task CL-4: Add ADR to DECISIONS.md
- Status: [x] DONE — ADR "2026-04-19 — Keep OLD religious tier naming (audience-driven)"
- ADR dated 2026-04-19: "Keep OLD religious tier naming — target audience Protestant + Catholic"
- Note: SPEC_USER_v3.md section 3.1 superseded
- Commit: "docs: ADR keep OLD tier naming (audience-driven)"

### Task CL-5: Mark spec v3 section 3.1 as superseded
- Status: [x] DONE — header note với mapping table NEW→OLD thêm vào đầu section 3
- File: SPEC_USER_v3.md (lines ~133-186)
- Thêm header note: "⚠️ SUPERSEDED 2026-04-19 — see DECISIONS.md. OLD religious naming is in use."
- Giữ content cũ để trace history
- Commit: "docs(spec): mark tier light-themed naming as superseded"
