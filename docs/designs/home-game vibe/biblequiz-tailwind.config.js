/** =====================================================================
 *  BibleQuiz · "Khung Sáng" — Tailwind extend snippet
 *  Gộp `theme.extend` này vào tailwind.config.{js,ts} hiện có.
 *  Token màu trỏ về CSS var để season-theming (data-season) hoạt động
 *  mà không cần rebuild. Gradient/shadow/shape là class tiện ích riêng.
 *  ===================================================================== */
module.exports = {
  theme: {
    extend: {
      colors: {
        // dùng <alpha-value> để Tailwind opacity (vd: text-bq-ink/70) vẫn chạy
        bq: {
          paper:   'var(--bq-paper)',
          white:   'var(--bq-white)',
          inset:   'var(--bq-paper-sunk)',
          hair:    'var(--bq-hairline)',
          ink:     'var(--bq-ink)',
          ink2:    'var(--bq-ink-soft)',
          ink3:    'var(--bq-ink-faint)',
          sapphire:'var(--bq-sapphire)',
          emerald: 'var(--bq-emerald)',
          amber:   'var(--bq-amber)',
          amberd:  'var(--bq-amber-deep)',
          ruby:    'var(--bq-ruby)',
          ember:   'var(--bq-ember)',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        body:    ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        verse:   ['Literata', 'Georgia', 'serif'],
      },
      fontSize: {
        hero:    'clamp(40px,5.6vw,66px)',
        verse:   '25px',
        eyebrow: '11px',
      },
      letterSpacing: { eyebrow: '.22em' },
      borderRadius: {
        bq: '22px',
      },
      backgroundImage: {
        'bq-spectrum': 'var(--bq-spectrum)',
        'bq-action':   'var(--bq-action)',
        'bq-flame':    'var(--bq-flame)',
      },
      boxShadow: {
        'bq-soft':   'var(--bq-shadow-soft)',
        'bq-sap':    'var(--bq-shadow-sap)',
        'bq-sap-h':  'var(--bq-shadow-sap-h)',
        'bq-rub':    'var(--bq-shadow-rub)',
        'bq-rub-h':  'var(--bq-shadow-rub-h)',
        'bq-eme':    'var(--bq-shadow-eme)',
        'bq-eme-h':  'var(--bq-shadow-eme-h)',
        'bq-amb':    'var(--bq-shadow-amb)',
        'bq-action': 'var(--bq-glow-action)',
        'bq-flame':  'var(--bq-glow-flame)',
      },
      transitionTimingFunction: { bq: 'cubic-bezier(.2,.7,.3,1)' },
      keyframes: {
        flick:   { '0%,100%':{transform:'scaleY(1) scaleX(1)'}, '48%':{transform:'scaleY(1.12) scaleX(.92)'}, '72%':{transform:'scaleY(.95) scaleX(1.05)'} },
        shimmer: { '0%,100%':{backgroundPosition:'0% 50%'}, '50%':{backgroundPosition:'100% 50%'} },
      },
      animation: {
        flick:   'flick 2.6s ease-in-out infinite',
        shimmer: 'shimmer 7s ease-in-out infinite',
      },
    },
  },
  // Shape "vòm" không map gọn vào Tailwind → để ở tokens.css dưới dạng class:
  // .bq-arch-card { border-radius: var(--bq-arch-card) }
  // .bq-arch-well { border-radius: var(--bq-arch-well) }
};
