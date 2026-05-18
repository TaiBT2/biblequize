/**
 * Canonical C1 tier names (CLAUDE.md §Canonical constraints).
 *
 * 6 religious tiers — locked 2026-04-19 per DECISIONS.md.
 * KHÔNG dùng tên cũ Tia Sáng/Vinh Quang. KHÔNG dịch sang light-themed.
 *
 * Display labels resolved via i18n key `tiers.<key>`:
 *   newBeliever → "Tân Tín Hữu"
 *   seeker → "Người Tìm Kiếm"
 *   disciple → "Môn Đồ"
 *   sage → "Hiền Triết"
 *   prophet → "Tiên Tri"
 *   apostle → "Sứ Đồ"
 */
export const TIER_NAME_KEYS = [
  'newBeliever',
  'seeker',
  'disciple',
  'sage',
  'prophet',
  'apostle',
] as const

export type TierNameKey = (typeof TIER_NAME_KEYS)[number]
