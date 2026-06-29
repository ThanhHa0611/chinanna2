const fs = require('fs');
const path = require('path');

const files = [
  '../frontend/dist/assets/index-kEUZzwG4.js',
  '../deploy/public/mentee/assets/index-r1lbJpxV.js',
];
for (const f of files) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) {
    console.log('missing', f);
    continue;
  }
  const js = fs.readFileSync(p, 'utf8');
  console.log('\n===', f, '===');
  const kh = js.match(/Kh="([^"]{0,80})/);
  console.log('Kh start:', kh ? kh[1] : 'not found');
  console.log('has hero-card-image:', js.includes('hero-card-image'));
  console.log('has data url:', js.includes('data:image/svg+xml'));
  const svgPath = js.match(/\/assets\/[^"']+\.svg/);
  console.log('svg path:', svgPath ? svgPath[0] : 'none');
}
