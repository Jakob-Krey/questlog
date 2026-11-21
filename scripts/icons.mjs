// Erzeugt die PNG-Icons der PWA aus public/icons/icon.svg.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/icons/icon.svg', import.meta.url));
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

await sharp(svg).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(svg).resize(512, 512).png().toFile(out('icon-512.png'));
// Apple-Touch-Icon ohne Transparenz (iOS rundet selbst ab).
await sharp(svg).resize(180, 180).flatten({ background: '#2f5d50' }).png().toFile(out('apple-touch-icon.png'));
// Maskable: Motiv mit Sicherheitsrand auf vollflächigem Hintergrund.
const inner = await sharp(svg).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#2f5d50' } })
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile(out('icon-maskable-512.png'));
console.log('Icons erzeugt.');
