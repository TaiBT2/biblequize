// One-off favicon regenerator from public/favicon.svg.
// Run: node scripts/regen-favicons.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, '..', 'public');
const svg = await readFile(join(pub, 'favicon.svg'));

async function png(size, out) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(join(pub, out));
  console.log('wrote', out);
}

await png(16, 'favicon-16x16.png');
await png(32, 'favicon-32x32.png');
await png(180, 'apple-touch-icon.png');
await png(192, 'android-chrome-192x192.png');
await png(512, 'android-chrome-512x512.png');

// Build multi-size ICO (16, 32, 48) wrapping PNG images.
async function pngBuf(size) {
  return sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
}
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(pngBuf));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
const entries = Buffer.alloc(16 * sizes.length);
let offset = 6 + 16 * sizes.length;
sizes.forEach((s, i) => {
  const e = i * 16;
  entries.writeUInt8(s === 256 ? 0 : s, e + 0);
  entries.writeUInt8(s === 256 ? 0 : s, e + 1);
  entries.writeUInt8(0, e + 2);
  entries.writeUInt8(0, e + 3);
  entries.writeUInt16LE(1, e + 4);
  entries.writeUInt16LE(32, e + 6);
  entries.writeUInt32LE(images[i].length, e + 8);
  entries.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
const ico = Buffer.concat([header, entries, ...images]);
await writeFile(join(pub, 'favicon.ico'), ico);
console.log('wrote favicon.ico');
