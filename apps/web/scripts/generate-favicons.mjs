import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const source = resolve(publicDir, 'app-logo.png');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(source)
    .resize(size, size)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(resolve(publicDir, name));
  const info = await sharp(resolve(publicDir, name)).metadata();
  console.log(`${name}: ${size}x${size} (${Math.round(info.size / 1024)}KB)`);
}

// Generate favicon.ico (32x32 PNG renamed — browsers accept PNG as ico)
await sharp(source)
  .resize(32, 32)
  .png({ quality: 90, compressionLevel: 9 })
  .toFile(resolve(publicDir, 'favicon.ico'));
console.log('favicon.ico: 32x32');

console.log('Done!');
