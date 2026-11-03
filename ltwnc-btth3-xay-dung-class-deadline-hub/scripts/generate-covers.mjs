// Tạo ảnh bìa 1200x630 cho từng môn từ data/subjects.json.
// Chạy một lần: node scripts/generate-covers.mjs
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const subjects = JSON.parse(await readFile(path.join(root, 'data', 'subjects.json'), 'utf8'));
const outDir = path.join(root, 'public', 'subjects');
await mkdir(outDir, { recursive: true });

const WIDTH = 1200;
const HEIGHT = 630;

for (const { slug, color } of subjects) {
  // Nền gradient theo màu môn, thêm vài hình tròn mờ cho đỡ phẳng.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
  <circle cx="1020" cy="120" r="260" fill="#ffffff" fill-opacity="0.10"/>
  <circle cx="1100" cy="560" r="180" fill="#ffffff" fill-opacity="0.08"/>
  <circle cx="140" cy="560" r="120" fill="#ffffff" fill-opacity="0.06"/>
</svg>`;
  const file = path.join(outDir, `${slug}.png`);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log('wrote', path.relative(root, file));
}
