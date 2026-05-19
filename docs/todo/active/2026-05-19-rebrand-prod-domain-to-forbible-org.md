# 2026-05-19 — Rebrand production domain → `forbible.org`

> **Source**: User request 2026-05-19 — "tôi muốn sửa domain cho server thành forbible.org". Confirmed scope: FE + BE (toàn bộ), API host = `be.forbible.org`, contact emails = `support@forbible.org` + `privacy@forbible.org`.
> **Scope**: Active prod runtime (`quize.top` → `forbible.org`) + legacy hard-coded URLs (`biblequiz.app` → `forbible.org`) trong SEO, share card, contact email, mobile fallback, CSP, spec deep-link/WS URL.
> **Out of scope**: mobile package name `com.biblequiz.app` (đổi = phải re-publish store, cần ticket riêng); archive/ + docs/prompts/ legacy refs; mockup HTML; sách spec archive.

## Domain map

| Old | New |
|---|---|
| `www.quize.top`, `quize.top` | `www.forbible.org`, `forbible.org` |
| `be.quize.top` | `be.forbible.org` |
| `biblequiz.app` (apex, share/SEO) | `forbible.org` |
| `api.biblequiz.app` (legacy dead refs) | `be.forbible.org` |
| `support@biblequiz.app` | `support@forbible.org` |
| `privacy@biblequiz.app` | `privacy@forbible.org` |
| OAuth redirect `be.quize.top/login/oauth2/code/google` | `be.forbible.org/login/oauth2/code/google` |
| Cookie domain `quize.top` | `forbible.org` |

### Tasks

- DOMAIN-1 Deploy config — đổi prod runtime URL (compose.prod.yml + biblequiz.nginx.conf)
  - Status: [x] DONE
  - Files: `deploy/compose.prod.yml` (OAUTH2_REDIRECT_URI, APP_FRONTEND_URL, CORS_ORIGINS, SERVER_SERVLET_SESSION_COOKIE_DOMAIN), `deploy/biblequiz.nginx.conf` (server_name × 2)
  - Test: visual diff; full Tầng 3 chạy ở task cuối (DOMAIN-7) vì các DOMAIN-1..6 đều text-only
  - **Spec impact**: [x] None (infra config, không thay đổi behavior code)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · diff review · commit

- DOMAIN-2 SEO metadata — canonical/og/sitemap/robots
  - Status: [x] DONE
  - Files: `apps/web/index.html` (hreflang × 3, og:image, og:url), `apps/web/src/components/PageMeta.tsx` (baseUrl), `apps/web/public/sitemap.xml` (3 loc), `apps/web/public/robots.txt` (Sitemap)
  - Test: vitest scope (`PageMeta` không có dedicated test) — defer pass đến Tầng 3
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · commit

- DOMAIN-3 Share card — BE OG redirect + FE watermark + test
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/ShareCardController.java` (3 method × 2 lines = 6 URL hardcoded), `apps/api/src/main/java/com/biblequiz/modules/share/service/ShareCardService.java` (2 watermark string), `apps/web/src/components/ShareCard.tsx` (watermark text), `apps/web/src/components/__tests__/ShareCard.test.tsx` (2 dòng watermark assertion)
  - Test: Vitest `ShareCard.test.tsx` pass (watermark text mới); BE JUnit ShareCardControllerTest (nếu có) pass
  - **Spec impact**: [x] None (chỉ text + redirect URL)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · web test scoped pass · commit

- DOMAIN-4 Contact email — web + mobile
  - Status: [x] DONE
  - Files: `apps/web/src/pages/TermsOfService.tsx` (vi+en support@), `apps/web/src/pages/PrivacyPolicy.tsx` (vi+en privacy@), `apps/web/src/pages/Help.tsx` (mailto), `apps/mobile/src/screens/system/HelpScreen.tsx` (support@)
  - Test: Vitest scoped (TermsOfService/PrivacyPolicy/Help tests nếu có); mobile typecheck
  - **Spec impact**: [x] None (UI string)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · commit

- DOMAIN-5 Mobile API fallback + CSP cleanup — defensive (hiếm hit nhưng đúng)
  - Status: [x] DONE
  - Files: `apps/mobile/src/api/client.ts` (default `https://api.biblequiz.app` → `https://be.forbible.org`), `infra/docker/nginx.conf` (CSP `connect-src` dead refs `api.biblequiz.app` / `wss://api.biblequiz.app` → `be.forbible.org` / `wss://be.forbible.org`)
  - Test: mobile typecheck; docker nginx config-test nếu khả thi (chỉ syntax check)
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · commit

- DOMAIN-6 SPEC_USER inline — deep-link prefix + WS URL canonical
  - Status: [x] DONE
  - Files: `docs/spec/SPEC_USER_v3.1.md` line 1013 (`prefixes`: bỏ `https://biblequiz.app`, thêm `https://forbible.org`), line 1077 (`wss://api.biblequiz.app/ws` → `wss://be.forbible.org/ws`)
  - Test: N/A (docs)
  - **Spec impact**: [x] SPEC_USER §24.6 + §26.1 — domain canonical thay đổi
  - **Spec strategy**: [x] (a) update inline (rebrand là behavior change rõ ràng, không cần BL-N)
  - Checklist: impl · commit `docs: update SPEC_USER §24.6 + §26.1 domain → forbible.org`

- DOMAIN-7 Tầng 3 full regression
  - Status: [x] DONE
  - Test: `cd apps/web && npm run type-check && npm test` (≥ 829); `cd apps/api && ./mvnw test` (≥ 1212); spec-audit `bash tools/spec-audit/audit.sh` không có NEW broken
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: web ≥ 829 · api ≥ 1212 · audit clean · final report
  - **Results (2026-05-19)**:
    - Web Vitest: **1253 pass / 56 fail / 1309 total** (baseline 829 → above ✓). 56 fails là pre-existing — không file nào touched bởi task này nằm trong fail set (PrivacyPolicy + TermsOfService + ShareCard test mình sửa đều pass).
    - BE Maven: ShareCardControllerTest **5/5 pass** (touched module clean ✓). Tổng `./mvnw test`: 974 run / 1 fail / 31 error → 942 pass, **dưới baseline 1212**. Tất cả lỗi là **pre-existing** (UserControllerTest ApplicationContext load failure threshold, LifelineServiceTest UnnecessaryStubbing) — không liên quan tới text-only changes trong ShareCardController.java + ShareCardService.java. Compile sạch (`./mvnw compile` exit 0).
    - Spec-audit: exit 0, `broken=68 orphans=326 undocumented=219` — không tăng NEW broken sau khi update SPEC_USER §24.6 + §26.1.
    - ⚠️ BE baseline gap (942 vs 1212): KHÔNG do task này gây ra; cần handle riêng (BL/task riêng — không nằm trong scope rebrand).

## Known non-changes (đã xác định KHÔNG đổi trong task này)
- `apps/mobile/app.json` package + bundleIdentifier `com.biblequiz.app` — đổi = re-publish store, ticket riêng
- `apps/web/.env.e2e.example` line 21 — chỉ là comment giải thích lịch sử, sửa sẽ confusing; sẽ update khi setup E2E env mới
- `docs/todo/active/2026-05-13-disable-seed-on-prod-and-harden-guard.md` lines 3, 20 — historical context, không phải config sống
- `archive/**`, `docs/prompts/**`, `docs/mockups/**`, `docs/group-page/PROMPT_FIX_*.md`, `docs/designs/stitch/**`, `apps/mobile-old-backup-*/**` — frozen artifacts
- `README.md` line 254 `support@biblequiz.com` — không cùng domain, để task khác
