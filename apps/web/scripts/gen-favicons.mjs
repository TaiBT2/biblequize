// Regenerate the favicon/app-icon set from public/favicon.svg.
// Tab icons (16/32) are the transparent gold "coin"; PWA / home-screen icons
// (180/192/512) center that coin on the brand dark square (#11131e, the
// manifest theme_color) so there's no transparent-corner artifact on iOS.
// favicon.ico bundles the 16+32 PNGs (PNG-in-ICO). Run: node scripts/gen-favicons.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const svg = readFileSync(join(PUB, 'favicon.svg'))
const DARK = { r: 0x11, g: 0x13, b: 0x1e, alpha: 1 }
const DENSITY = 2400 // oversample the 32-unit viewBox so downscaled icons stay crisp

const tab = (size) =>
  sharp(svg, { density: DENSITY }).resize(size, size).png().toBuffer()

async function appIcon(size) {
  const inner = Math.round(size * 0.78)
  const coin = await sharp(svg, { density: DENSITY }).resize(inner, inner).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: DARK } })
    .composite([{ input: coin, gravity: 'center' }]).png().toBuffer()
}

function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + images.length * 16
  const entries = [], blobs = []
  for (const { size, buf } of images) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size, 0); e.writeUInt8(size, 1)
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6)
    e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12)
    entries.push(e); blobs.push(buf); offset += buf.length
  }
  return Buffer.concat([header, ...entries, ...blobs])
}

const out = (name, buf) => { writeFileSync(join(PUB, name), buf); console.log('  OK', name, buf.length, 'bytes') }

const p16 = await tab(16), p32 = await tab(32)
out('favicon-16x16.png', p16)
out('favicon-32x32.png', p32)
out('apple-touch-icon.png', await appIcon(180))
out('android-chrome-192x192.png', await appIcon(192))
out('android-chrome-512x512.png', await appIcon(512))
out('favicon.ico', buildIco([{ size: 16, buf: p16 }, { size: 32, buf: p32 }]))
console.log('favicons regenerated from favicon.svg')
