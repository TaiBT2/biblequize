// Generates source app-icon/splash PNGs for @capacitor/assets from inline SVG.
// Run: node scripts/gen-app-assets.mjs   (sharp is already a devDependency)
// Then: npx @capacitor/assets generate --android
//
// Brand: dark paper #11131e, gold #e8a832 open-book mark (Sacred Modernist).
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../assets')
mkdirSync(out, { recursive: true })

const BG = '#11131e'
const GOLD = '#e8a832'
const GOLD2 = '#f0c060'

// Open-book mark centered at the origin; `scale` sizes it within the canvas.
const book = (scale) => `
  <g transform="translate(0,0) scale(${scale})">
    <path d="M -260 -150 C -180 -200 -40 -200 0 -150 L 0 185 C -40 135 -180 135 -260 185 Z" fill="${GOLD}"/>
    <path d="M 260 -150 C 180 -200 40 -200 0 -150 L 0 185 C 40 135 180 135 260 185 Z" fill="${GOLD2}"/>
    <rect x="-7" y="-168" width="14" height="356" rx="7" fill="${BG}"/>
  </g>`

const svg = ({ size, bg, scale }) => Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  <g transform="translate(${size / 2},${size / 2})">${book(scale)}</g>
</svg>`)

async function png(name, opts) {
  await sharp(svg(opts)).png().toFile(resolve(out, name))
  console.log('wrote', name)
}

await Promise.all([
  // Full-bleed icon (legacy + round source)
  png('icon-only.png', { size: 1024, bg: BG, scale: 1.3 }),
  // Adaptive icon layers
  png('icon-background.png', { size: 1024, bg: BG, scale: 0 }),
  png('icon-foreground.png', { size: 1024, bg: null, scale: 1.0 }), // padded for safe zone
  // Splash (centered, smaller mark)
  png('splash.png', { size: 2732, bg: BG, scale: 1.6 }),
  png('splash-dark.png', { size: 2732, bg: BG, scale: 1.6 }),
])
console.log('done')
