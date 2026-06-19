const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizePNG(inputPath, maxWidth = 256) {
  const stat = fs.statSync(inputPath);
  const meta = await sharp(inputPath).metadata();
  const targetW = Math.min(meta.width, maxWidth);
  
  await sharp(inputPath)
    .resize(targetW, targetW, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 85, compressionLevel: 9, adaptiveFiltering: true })
    .toFile(inputPath + '.tmp');
  
  fs.renameSync(inputPath + '.tmp', inputPath);
  const newStat = fs.statSync(inputPath);
  const reduction = ((1 - newStat.size / stat.size) * 100).toFixed(1);
  console.log(`  ${path.basename(inputPath)}: ${meta.width}x${meta.height} → ${targetW}x${targetW} | ${(stat.size/1024).toFixed(0)}KB → ${(newStat.size/1024).toFixed(0)}KB (${reduction}% reduction)`);
}

async function optimizeJPG(inputPath, maxWidth = 1024) {
  const stat = fs.statSync(inputPath);
  const meta = await sharp(inputPath).metadata();
  const targetW = Math.min(meta.width, maxWidth);
  
  await sharp(inputPath)
    .resize(targetW, null, { fit: 'inside' })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(inputPath + '.tmp');
  
  fs.renameSync(inputPath + '.tmp', inputPath);
  const newStat = fs.statSync(inputPath);
  const reduction = ((1 - newStat.size / stat.size) * 100).toFixed(1);
  console.log(`  ${path.basename(inputPath)}: ${meta.width}x${meta.height} → max ${targetW}w | ${(stat.size/1024).toFixed(0)}KB → ${(newStat.size/1024).toFixed(0)}KB (${reduction}% reduction)`);
}

async function main() {
  console.log('\n=== Optimizing PNG logos (1024→256) ===');
  const logoFiles = [
    'apps/frontend/public/images/likas-lens-logo.png',
    'apps/frontend/public/images/likasy-logo.png',
    'apps/admin-portal/public/images/likas-lens-logo.png',
    'apps/admin-portal/public/images/likasy-logo.png',
    'apps/mobile-pwa/public/images/likas-lens-logo.png',
    'apps/mobile-pwa/public/images/likasy-logo.png',
  ];
  for (const f of logoFiles) {
    if (fs.existsSync(f)) await optimizePNG(f, 256);
  }

  console.log('\n=== Optimizing other images (resize + compress) ===');
  const otherImages = [
    { path: 'apps/frontend/public/images/ridge-to-reef.png', maxW: 800 },
    { path: 'apps/frontend/public/images/footer-mountain-brown.png', maxW: 800 },
    { path: 'apps/mobile-pwa/public/images/profile-bg-light.png', maxW: 800 },
  ];
  for (const img of otherImages) {
    if (fs.existsSync(img.path)) {
      const meta = await sharp(img.path).metadata();
      if (meta.format === 'jpeg' || meta.format === 'jpg') {
        await optimizeJPG(img.path, img.maxW);
      } else {
        await optimizePNG(img.path, img.maxW);
      }
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
