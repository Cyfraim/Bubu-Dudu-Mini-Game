/**
 * sprite-preview.cjs — renders the pixel sprites from js/characters.js to a
 * PNG so the 16x16 art can be eyeballed without launching a browser.
 *
 * Usage:  node tests/sprite-preview.cjs [out.png]
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

global.window   = {};
global.document = { getElementById: () => null };
require(path.join(__dirname, '..', 'js', 'characters.js'));
const R = global.window.CharacterRenderer;

const ZOOM = 18, MARGIN = 12, GAP = 14;   // cell zoom + padding between sprites

const hexToRgb = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

function render(rows, pal) {
  const w = rows[0].length * ZOOM + MARGIN * 2;
  const h = rows.length  * ZOOM + MARGIN * 2;
  const img = Buffer.alloc(w * h * 3, 0xf2);   // light grey so silhouettes read
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) { console.error('unmapped', kind, ch); continue; }
      const [r, g, b] = hexToRgb(col);
      for (let y = 0; y < ZOOM; y++) for (let x = 0; x < ZOOM; x++) {
        const px = MARGIN + rx * ZOOM + x, py = MARGIN + ry * ZOOM + y;
        const i = (py * w + px) * 3;
        img[i] = r; img[i + 1] = g; img[i + 2] = b;
      }
    }
  });
  return { img, w, h };
}

let CRC_T = null;
function crc32(buf) {
  if (!CRC_T) {
    CRC_T = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      CRC_T[n] = c;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_T[(crc ^ buf[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
};
function encodePNG(img, w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) img.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Side-by-side: panda (bubu) then bear (dudu)
const sprites = [['bubu', 'YIER panda'], ['dudu', 'BUBU bear']].map(([k, label]) => {
  const rows = R.PIXEL_SPRITES[k];
  console.log(`${label} (${k}) ${rows.length}x${rows[0].length}`);
  return render(rows, R.getPixelPalette(k));
});
const W = sprites.reduce((a, s) => a + s.w, 0) + GAP * (sprites.length - 1);
const H = Math.max(...sprites.map(s => s.h));
const sheet = Buffer.alloc(W * H * 3, 0xf2);
let ox = 0;
for (const s of sprites) {
  for (let y = 0; y < s.h; y++) {
    s.img.copy(sheet, (y * W + ox) * 3, y * s.w * 3, (y + 1) * s.w * 3);
  }
  ox += s.w + GAP;
}
const out = process.argv[2] || path.join(__dirname, 'sprite-preview.png');
fs.writeFileSync(out, encodePNG(sheet, W, H));
console.log(`wrote ${out} (${W}x${H}) — left: panda, right: bear`);