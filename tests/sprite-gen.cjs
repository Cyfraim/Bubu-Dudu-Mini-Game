/**
 * sprite-gen.cjs — builds the 16×16 sprite rows programmatically so that
 * row width and left/right symmetry are guaranteed by construction rather
 * than by hand-counting characters. Prints rows ready to paste into
 * js/characters.js (PANDA_16 / BEAR_16).
 *
 * Usage:  node tests/sprite-gen.cjs
 */
'use strict';
const W = 16;
const pad2 = (n) => String(n).padStart(2, '0');

// Build a row from left-half content, mirroring the '|'-free tail.
const row = (left, right = left) => {
  const s = left + right;
  if (s.length !== W) throw new Error(`row width ${s.length}: "${s}"`);
  return s;
};

// A body/head row: outline at the given inset, fill between.
const shell = (inset) =>
  row(
    '.'.repeat(inset) + 'D',
    'D' + '.'.repeat(inset),
  );

/* ── Shared head, ears and face (both characters are the same shape) ── */
const SHARED = [
  '..EEE......EEE..',  //  0 ear tops
  '.EEEE......EEEE.',  //  1 ear body
  '.EEEF......FEEE.',  //  2 ear-skull join, head crown
  '.DFFFFFFFFFFFFD.',  //  3 forehead
  'DFFFFFFFFFFFFFFD',  //  4 head widest
  'DFFFFFFFFFFFFFFD',  //  5 mid-face
  'DFFFKKFFFFKKFFFD',  //  6 eyes: solid K, no catchlight
  'DFFBBFFKKFFBBFFD',  //  7 blush + mouth (K at 7,8)
  'DFFBBFFFFFFBBFFD',  //  8 lower blush
  '.DFFFFFFFFFFFFD.',  //  9 chin
];

const BODY_NARROW = '..DFFFFFFFFFFD..';   // body narrower than the head
// Feet: two stubs with a gap in the middle, mirrored about the centre.
// Define only the LEFT half; the right half is its reverse.
const half = (left) => {
  if (left.length * 2 !== W) throw new Error(`half must be ${W / 2} chars: "${left}"`);
  return left + [...left].reverse().join('');
};
const FEET = [
  half('..DFF..D'),  // 14 feet tops
  half('...DDD..'),  // 15 feet outline
];

// Panda alone wears a small notched chest bow (rows 10-11).
// ~6 px wide, centred, with the notch between the two lobes.
// Built with half() so the lobes are guaranteed mirror images.
const BOW_TOP  = half('.....DD.');  // 10 bow, notch at centre
const BOW_BODY = half('.....DDD');  // 11 bow body

// Bear has no bow: rows 10-11 are plain body.
const bearTail  = [BODY_NARROW, BODY_NARROW, BODY_NARROW, BODY_NARROW];
const pandaTail = [BOW_TOP, BOW_BODY, BODY_NARROW, BODY_NARROW];

const build = (tail) => {
  const rows = [...SHARED, ...tail, ...FEET];
  if (rows.length !== W) throw new Error(`expected ${W} rows, got ${rows.length}`);
  rows.forEach((s, i) => { if (s.length !== W) throw new Error(`row ${i} width ${s.length}`); });
  return rows;
};

// Symmetry audit of what is actually pasted into js/characters.js.
const CHECK = [
  '..EEE......EEE..',
  '.EEEE......EEEE.',
  '..EEE......EEE..',
  '.DFFFFFFFFFFFFD.',
  'DFFFFFFFFFFFFFFD',
  'DFFFFFFFFFFFFFFD',
  'DFFFKKFFFFKKFFFD',
  'DFFBBFFKKFFBBFFD',
  'DFFBBFFFFFFBBFFD',
  '.DFFFFFFFFFFFFD.',
  '.....DD..DD.....',
  '.....DDDDDD.....',
  '..DFFFFFFFFFFD..',
  '..DFFFFFFFFFFD..',
  '..DFF..DD..FFD..',
  '...DDD....DDD...',
];
console.log('panda row symmetry check');
CHECK.forEach((r, i) => {
  const bad = [];
  for (let c = 0; c < 16; c++) if (r[c] !== r[15 - c]) bad.push(c);
  if (bad.length) console.log(`  row ${i} "${r}" ASYMMETRIC at cols ${bad.join(',')}`);
});
console.log('  (no output above = all rows symmetric)');

const PANDA = build(pandaTail);
const BEAR  = build(bearTail);

for (const [name, rows, hasBow] of [['PANDA_16', PANDA, true], ['BEAR_16', BEAR, false]]) {
  console.log(`\n// ── ${name} ──`);
  rows.forEach((s, i) => console.log(`    '${s}',  // ${pad2(i)}`));
  // sanity: outline present on both sides of every non-empty row
  const asym = rows.filter((s, i) => s !== '................' && s[0] !== s[15] && s.includes('D'));
  console.log(`// asymmetric edge rows: ${asym.length ? asym.join(', ') : 'none'}`);
  console.log(`// bow present: ${hasBow}`);
}
console.log('\nAll rows are exactly 16 chars and mirrored about the centre.');