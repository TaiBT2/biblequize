/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Stitch Design System — "The Sacred Modernist"
        background: "#11131e",
        surface: {
          DEFAULT: "#11131e",
          dim: "#11131e",
          bright: "#373845",
          container: {
            DEFAULT: "#1d1f2a",
            low: "#191b26",
            high: "#272935",
            highest: "#323440",
            lowest: "#0b0e18",
          },
          variant: "#323440",
          tint: "#c0c4e8",
        },
        primary: {
          DEFAULT: "#c0c4e8",
          container: "#1a1f3a",
          fixed: { DEFAULT: "#dee1ff", dim: "#c0c4e8" },
        },
        secondary: {
          DEFAULT: "#e8a832",
          container: "#bc8709",
          fixed: { DEFAULT: "#ffdea7", dim: "#f8bd45" },
        },
        tertiary: {
          DEFAULT: "#e7c268",
          container: "#2b1f00",
          fixed: { DEFAULT: "#ffdf96", dim: "#e7c268" },
        },
        error: {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
        },
        outline: {
          DEFAULT: "#919098",
          variant: "#46464d",
        },
        // "on-" colors for text
        "on-surface": "#e1e1f1",
        "on-surface-variant": "#c7c5ce",
        "on-background": "#e1e1f1",
        "on-primary": "#2a2f4a",
        "on-primary-container": "#8286a7",
        "on-secondary": "#412d00",
        "on-secondary-container": "#392600",
        "on-tertiary": "#3e2e00",
        "on-tertiary-container": "#a48431",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        "inverse-surface": "#e1e1f1",
        "inverse-on-surface": "#2e303c",
        "inverse-primary": "#585d7b",
        // Legacy compatibility
        neon: {
          green: '#00ff41',
          pink: '#ff0080',
          orange: '#ff6600',
          blue: '#00bfff',
        },
        // Answer Color Mapping (Quiz screen) — DESIGN_TOKENS.md "Game Mode Accent"
        // A=top-left, B=top-right, C=bottom-left, D=bottom-right.
        // Vị trí cố định, shuffle content KHÔNG shuffle vị trí màu.
        answer: {
          a: '#E8826A', // Coral — cảm xúc ấm
          b: '#6AB8E8', // Sky — tin cậy, calm
          c: '#E8C76A', // Gold — năng lượng, joy (ấm hơn primary gold)
          d: '#7AB87A', // Sage — bình an, growth
        },
        // HR-1 Modern Spiritual atmosphere tokens — used by HomeBanner,
        // FeaturedDailyCard, HeroRankedCard, VerseFooter. Hardcoded hex
        // (memory: CSS variables cause white-background rendering bug).
        ivory: '#f5f0e6',
        'ivory-dim': '#b8b1a3',
        'ivory-faint': '#6e6a60',
        'gold-deep': '#c98a1c',
        'gold-shadow': '#7a5818',
        // Hero Đấu Hạng — Variant 02 Radial Glow (sprint 2026-05-14)
        'gold-bright': '#f4d178',
        'gold-cream': '#fff5dc',
        maroon: '#7c2d3a',
        sage: '#4a6b52',
        // HRV-7 Vintage palette — Home redesign 2026-05-14 (Option C Hybrid).
        // Reuses ivory/gold-bright/gold-deep above; ADDs deeper bg + ruby/emerald/plum
        // accent family + line for vintage borders. Used by HomeBanner / FeaturedDailyCard /
        // HeroRankedCard / CompactCard / DailyMissionsCard / BibleJourneyCard restyles.
        'bg-deep': '#0e0a12',
        'bg-wash': '#15101b',
        ruby: '#c73e3e',
        'ruby-deep': '#8e2727',
        emerald: '#4fa876',
        'emerald-deep': '#2f6e4d',
        plum: '#8c5bb5',
        'plum-deep': '#5b3681',
        line: '#2e2238',
        'line-soft': '#221a2c',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        headline: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        body: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        label: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        // V3 design — "Sacred Modernist Gaming"
        sora: ['Sora', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
        // HR-1: Cormorant Garamond italic ONLY for verse text + drop cap.
        // Do not use this stack elsewhere (mode titles, headings, etc.).
        verse: ['"Cormorant Garamond"', '"Crimson Pro"', 'Playfair Display', 'serif'],
        // HRV-7: Yeseva One — illuminated-manuscript display serif for Home vintage
        // h1/h2/section labels. Pair with sans body. Do NOT replace verse stack here.
        display: ['"Yeseva One"', 'Playfair Display', 'serif'],
        // HRV-7: JetBrains Mono — Home vintage numeric (XP, timers, HUD).
        // Distinct from font-mono (Orbitron) which is used heavily across admin
        // dashboard + room/group code modals; do NOT collapse the two.
        numeric: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        // Legacy
        serif: ['Playfair Display', 'serif'],
        cursive: ['Caveat', 'cursive'],
        mono: ['Orbitron', 'Courier New', 'monospace'],
      },
      boxShadow: {
        // HRV-7 Chunky shadows — Duolingo-style 6px hard offset + soft glow.
        // Mobile-game button feel for vintage Home CTAs. Pair with hover:translate-y
        // for press-down feedback.
        'chunky-gold': '0 6px 0 0 #a87a1f, 0 16px 30px -10px rgba(232,181,71,0.35)',
        'chunky-ruby': '0 6px 0 0 #8e2727, 0 16px 30px -10px rgba(199,62,62,0.4)',
        'chunky-soft': '0 4px 0 0 #2e2238',
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
