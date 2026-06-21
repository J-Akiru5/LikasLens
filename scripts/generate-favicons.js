const sharp = require('sharp');
const path = require('path');

const logoPath = 'apps/frontend/public/images/likas-lens-logo.png';

const targets = [
  // frontend
  { dest: 'apps/frontend/public/icons/icon-192x192.png', size: 192 },
  { dest: 'apps/frontend/public/icons/icon-512x512.png', size: 512 },
  { dest: 'apps/frontend/public/icons/apple-touch-icon.png', size: 180 },
  { dest: 'apps/frontend/src/app/icon.png', size: 32 },
  
  // mobile-pwa
  { dest: 'apps/mobile-pwa/public/icons/icon-192x192.png', size: 192 },
  { dest: 'apps/mobile-pwa/public/icons/icon-512x512.png', size: 512 },
  { dest: 'apps/mobile-pwa/public/icons/apple-touch-icon.png', size: 180 },
  { dest: 'apps/mobile-pwa/src/app/icon.png', size: 32 },
  
  // admin-portal
  { dest: 'apps/admin-portal/public/icons/icon-192x192.png', size: 192 },
  { dest: 'apps/admin-portal/public/icons/icon-512x512.png', size: 512 },
  { dest: 'apps/admin-portal/public/icons/apple-touch-icon.png', size: 180 },
  { dest: 'apps/admin-portal/src/app/icon.png', size: 32 },
];

async function run() {
  for (const target of targets) {
    const fullPath = path.join(__dirname, '..', target.dest);
    await sharp(logoPath)
      .resize(target.size, target.size)
      .toFile(fullPath);
    console.log(`Generated: ${target.dest}`);
  }
}

run().catch(console.error);
