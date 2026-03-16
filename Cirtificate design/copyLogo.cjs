const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'logo.png'); // Found it here in the root!
const dest = path.join(__dirname, 'src', 'assets', 'logo.png');

try {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied logo to assets folder!');
} catch (err) {
  console.error('Error copying file:', err);
}
