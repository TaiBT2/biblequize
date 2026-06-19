# 2026-06-19 — Crawlability fixes (noindex 404 + canonical /leaderboard)

> **Source**: User — đánh giá crawlability → fix #1 soft-404 noindex + #2 canonical /leaderboard.
> **Scope**: `apps/web` SEO meta.

Audit crawlability: tốt (~8.5/10). robots/sitemap/redirect/prerender/internal-link ổn. 2 điểm trừ:
soft-404 (URL không tồn tại trả 200 + NotFound không noindex) và /leaderboard thiếu canonical.

### Tasks

- CRW-1 noindex cho NotFound (chống soft-404 index URL rác)
  - Status: [x] DONE + deployed `20759e92` · Files: `components/PageMeta.tsx` (thêm prop `noindex`),
    `pages/NotFound.tsx` (noindex + sửa title có dấu), `PageMeta.test.tsx` (test noindex)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- CRW-2 canonical /leaderboard
  - Status: [!] STAGED (chưa commit) · Files: `pages/Leaderboard.tsx` (thêm PageMeta canonicalPath="/leaderboard")
  - **BLOCKER**: Leaderboard.tsx đang bị **automation song song rewrite** (LBF-4 around-me, uncommitted WIP).
    `git add` cả file sẽ ship feature dở của họ → để staged trong working tree; sẽ deploy khi LBF commit.
    Canonical là client-side (JS-render, /leaderboard không prerender) nên delay không mất SEO.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

### Note
- Pre-existing TS warning Leaderboard.tsx: `keepPreviousData: true` (TanStack v5 bỏ — phải `placeholderData: keepPreviousData`).
  Code của process song song, không break build (esbuild không type-check). Để họ fix.
- noindex là client-side → Googlebot (JS-render) thấy; non-JS crawler thấy shell (Google tự soft-404-detect anyway).
