export const NAV_KEYS = {
  home: 'nav.home',
  quiz: 'nav.quiz',
  multiplayer: 'nav.multiplayer',
  groups: 'nav.groups',
  profile: 'nav.profile',
} as const

export type NavKey = (typeof NAV_KEYS)[keyof typeof NAV_KEYS]
