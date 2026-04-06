// Generate simple PWA icons as SVG converted to data
// Run: node scripts/generate-icons.mjs
import { writeFileSync } from 'fs';

function generateSVG(size) {
  const fontSize = Math.round(size * 0.45);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#0a0a0a"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-family="system-ui, sans-serif">&#9889;</text>
</svg>`;
}

for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.svg`, generateSVG(size));
  console.log(`Generated icon-${size}.svg`);
}
