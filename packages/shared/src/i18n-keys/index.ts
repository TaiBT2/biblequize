import { COMMON_KEYS } from './common'
import { NAV_KEYS } from './nav'

export { COMMON_KEYS, NAV_KEYS }
export type { CommonKey } from './common'
export type { NavKey } from './nav'

/**
 * Grouped registry — usage: `t(I18N_KEYS.common.loading)`.
 *
 * Add new namespaces here khi cần share key references giữa web + mobile.
 * Keep file structure mirroring vi.json/en.json để dễ audit.
 */
export const I18N_KEYS = {
  common: COMMON_KEYS,
  nav: NAV_KEYS,
} as const
