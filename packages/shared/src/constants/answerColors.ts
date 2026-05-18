/**
 * Canonical C5 answer color mapping (CLAUDE.md §Canonical constraints).
 *
 * Vị trí cố định trên Quiz screen: A=top-left, B=top-right, C=bottom-left, D=bottom-right.
 * Source: docs/dev/design-system.md "Game Mode Accent" token group.
 */
export const ANSWER_COLORS = {
  A: '#E8826A', // Coral
  B: '#6AB8E8', // Sky
  C: '#E8C76A', // Gold
  D: '#7AB87A', // Sage
} as const

export type AnswerKey = keyof typeof ANSWER_COLORS
