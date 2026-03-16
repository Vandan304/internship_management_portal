const fs = require('fs');
const path = require('path');

const srcLogo = path.join(__dirname, 'src', 'assets', 'logo.png');

const dests = [
  path.join(__dirname, 'src', 'assets', 'logo-symbol.png'),
  path.join(__dirname, 'src', 'assets', 'logo-full.png'),
  path.join(__dirname, 'src', 'assets', 'stamp.png')
];

const iconsDir = path.join(__dirname, 'src', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

try {
  for (const dest of dests) {
    fs.copyFileSync(srcLogo, dest);
    console.log('Copied to ' + dest);
  }
} catch (err) {
  console.error('Copy failed', err);
}
