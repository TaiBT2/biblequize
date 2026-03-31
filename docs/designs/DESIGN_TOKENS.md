# BibleQuiz — Design Tokens (extracted from Stitch MCP)
> Source: Google Stitch Project `5341030797678838526`
> Theme: "The Sacred Modernist" — Illuminated Depth

## Color Palette (Material Design 3 — Custom)

### Surface System
| Token | Hex | Tailwind Class |
|-------|-----|----------------|
| background | `#11131e` | `bg-background` |
| surface | `#11131e` | `bg-surface` |
| surface-dim | `#11131e` | `bg-surface-dim` |
| surface-bright | `#373845` | `bg-surface-bright` |
| surface-container-lowest | `#0b0e18` | `bg-surface-container-lowest` |
| surface-container-low | `#191b26` | `bg-surface-container-low` |
| surface-container | `#1d1f2a` | `bg-surface-container` |
| surface-container-high | `#272935` | `bg-surface-container-high` |
| surface-container-highest | `#323440` | `bg-surface-container-highest` |
| surface-variant | `#323440` | `bg-surface-variant` |

### Primary
| Token | Hex | Usage |
|-------|-----|-------|
| primary | `#c0c4e8` | Soft lavender accent |
| primary-container | `#1a1f3a` | Dark blue container |
| primary-fixed | `#dee1ff` | Fixed primary |
| on-primary | `#2a2f4a` | Text on primary |
| on-primary-container | `#8286a7` | Text on primary container |

### Secondary (Gold — Main CTA)
| Token | Hex | Usage |
|-------|-----|-------|
| secondary | `#f8bd45` / `#e8a832` | Gold highlights, CTAs |
| secondary-container | `#bc8709` | Gold container |
| secondary-fixed | `#ffdea7` | Fixed secondary |
| on-secondary | `#412d00` | Text on gold surfaces |

### Tertiary (Gold variant)
| Token | Hex | Usage |
|-------|-----|-------|
| tertiary | `#e7c268` | Gold gradient end |
| tertiary-container | `#2b1f00` | Tertiary container |

### Text Colors (on-* tokens)
| Token | Hex | Usage |
|-------|-----|-------|
| on-surface | `#e1e1f1` | Primary text (NOT #ffffff) |
| on-surface-variant | `#c7c5ce` | Secondary/muted text |
| on-background | `#e1e1f1` | Text on background |

### Borders & Outlines
| Token | Hex | Usage |
|-------|-----|-------|
| outline | `#919098` | Subtle borders |
| outline-variant | `#46464d` | Ghost borders (use at 15-20% opacity) |

### Error
| Token | Hex | Usage |
|-------|-----|-------|
| error | `#ffb4ab` | Error text/icons |
| error-container | `#93000a` | Error background |

### Game Mode Accent Colors
| Mode | Hex | Usage |
|------|-----|-------|
| Practice | `#4a9eff` | Blue — calm, no pressure |
| Ranked | `#e8a832` | Gold — competitive |
| Daily | `#ff8c42` | Orange — urgency |
| Multiplayer | `#9b59b6` | Purple — social |

## Typography

| Property | Value |
|----------|-------|
| **Font Family** | Be Vietnam Pro |
| **Weights Used** | 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold) |
| **Headline** | font-black, tracking-tighter, leading-[1.1] |
| **Body** | font-medium, leading-relaxed, line-height 1.5+ |
| **Labels** | uppercase, tracking-[0.05em]+, font-bold, text-xs |

## Spacing System

| Size | Value | Usage |
|------|-------|-------|
| xs | 0.25rem (4px) | Internal padding |
| sm | 0.5rem (8px) | Compact spacing |
| md | 1rem (16px) | Standard gap |
| lg | 1.5rem (24px) | Section gap |
| xl | 2rem (32px) | Large sections |
| 2xl | 3rem (48px) | Page sections |
| 3xl | 6rem (96px) | Hero/CTA spacing |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| DEFAULT | 0.25rem | Minimum rounding |
| lg | 0.5rem | Small elements |
| xl | 0.75rem | Buttons, inputs |
| 2xl | 1rem | Cards |
| 3xl | 1.5rem | Large cards |
| full | 9999px | Avatars, pills |

## Special Effects

### Glassmorphism
```css
.glass-card {
  background: rgba(50, 52, 64, 0.6);
  backdrop-filter: blur(12px);
}
```

### Gold Gradient
```css
.gold-gradient {
  background: linear-gradient(135deg, #f8bd45 0%, #e7c268 100%);
}
```

### Gold Glow
```css
.gold-glow {
  box-shadow: 0 0 20px rgba(232, 168, 50, 0.2);
}
```

### Ambient Shadows
- Use tinted shadow `#0b0e18` (not pure black)
- 24px blur, 6% opacity
- Gold shadow: `shadow-secondary/10` or `shadow-secondary/20`

## Design Rules

1. **No-Line Rule**: Define boundaries through background color shifts, NOT 1px borders
2. **No #ffffff**: Use `on-surface` (#e1e1f1) to reduce glare
3. **No sharp corners**: Everything min `sm` (0.25rem) rounding
4. **Tonal Layering**: Elevation via surface container tiers, not drop shadows
5. **Vietnamese diacritics**: Min line-height 1.5 for legibility
6. **Dark mode only**: class="dark" on `<html>`, no light mode toggle
