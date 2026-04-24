import sharp from 'sharp';
import { readdir, unlink, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const PORTFOLIO_DIR = './images/portfolio';
const MAX_WIDTH = 1600;
const QUALITY = 82;

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFiles(full));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = await getFiles(PORTFOLIO_DIR);
console.log(`Found ${files.length} images\n`);

let totalBefore = 0, totalAfter = 0;

for (const src of files) {
  const ext = extname(src);
  const dest = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const sizeBefore = (await stat(src)).size;

  try {
    await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);

    const sizeAfter = (await stat(dest)).size;
    totalBefore += sizeBefore;
    totalAfter += sizeAfter;

    // Remove original only if webp was created successfully
    await unlink(src);

    const saved = Math.round((1 - sizeAfter / sizeBefore) * 100);
    console.log(`${basename(src)} → webp  -${saved}%  (${Math.round(sizeBefore/1024)}KB → ${Math.round(sizeAfter/1024)}KB)`);
  } catch (err) {
    console.error(`ERROR: ${src} — ${err.message}`);
  }
}

console.log(`\nDone.`);
console.log(`Total: ${Math.round(totalBefore/1024/1024)}MB → ${Math.round(totalAfter/1024/1024)}MB  (-${Math.round((1 - totalAfter/totalBefore)*100)}%)`);
