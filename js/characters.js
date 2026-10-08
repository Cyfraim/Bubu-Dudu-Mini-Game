/**
 * js/characters.js – Bubu & Yier character rendering
 *
 * Fan-made tribute. All artwork is original canvas code — no images loaded.
 * Characters inspired by Huang Xiao B (黄小B), created June 2018.
 *
 * STEP 0 — Measurements from reference image
 * ─────────────────────────────────────────────────────────────────────
 * Both characters share the same total height (H ≈ 670 px in ref).
 *
 * BUBU (brown bear, left) — game id: 'dudu'
 *   Rev 2026-02 — rebuilt from a new front-facing reference image.
 *   Head:total     0.55 H, very large round head, hRx/hRy ≈ 38/36
 *   Ears           small round, DARK BROWN fill (not fur colour),
 *                  earR ≈ 8, centres ≈ (±29, -27) from head centre
 *   Eyes           plain round dots, no patches, NO catchlight; eyeR ≈ 4.6
 *                  centres ≈ (±11.5, +9) from head centre
 *   Blush          large soft pale-golden ovals, low on the cheeks
 *                  rx≈12 ry≈10, centres ≈ (±23, +15)
 *   Mouth          small cat-style "ω", width ≈ 8, y ≈ +14
 *   Body           wide rounded blob, bodyRx≈32, bodyRy≈23
 *                  no visible gap from head
 *   Arms           small stubby nubs at the body sides, no finger grooves
 *   Feet           2 wide flat stubs, same brown, spread
 *   Ground         soft oval contact shadow beneath the feet
 *   Colours        fur #c8906a  outline #4a2a1e  ear #5c3320
 *                  blush #f6d3a4  lw 3.2
 *
 * YIER (panda, right) — game id: 'bubu'
 *   Rev 2026-02 — rebuilt from a new front-facing reference image.
 *   Head           very large round head, hRx/hRy ≈ 38/36
 *   Ears           round, warm dark-brown fill (#5c3320) — lighter than
 *                  the outline, earR ≈ 12, centres ≈ (±29, -27)
 *   Eyes           plain round dots, no patches, NO catchlight; eyeR ≈ 4.6
 *                  centres ≈ (±11.5, +9) from head centre
 *   Blush          baby-pink large ovals, low on the cheeks
 *                  rx≈12 ry≈10, centres ≈ (±23, +15)
 *   Mouth          small cat-style "ω" (same as the bear), y ≈ +14
 *   Collar ring    REMOVED in the new reference — neck flows into body
 *   Bow tie        large dark bow at the chest front, y ≈ +45
 *   Body           rounded blob, narrower than head
 *   Arms           small stubby nubs, no finger grooves
 *   Feet           2 wide flat stubs, same white, spread
 *   Ground         soft oval contact shadow beneath the feet
 *   Colours        fur #ffffff  outline #4a2a1e  ear #5c3320
 *                  blush #f8b4c0  lw 3.2
 *
 * ─────────────────────────────────────────────────────────────────────
 * Tweakable constants: CHARACTER_STYLE object inside CharacterRenderer.
 * Pitch tweakables: see js/voices.js VOICE_STYLE.
 */

window.CharacterRenderer = (function () {
  'use strict';

  // ── Tweakable style constants ────────────────────────────────────────
  // Edit any value here to change proportions, colours, or line weights.
  const CHARACTER_STYLE = {
    // BUBU the brown bear  (game identifier: 'dudu')
    dudu: {
      fur:         '#c8906a',   // warm caramel body colour
      outline:     '#4a2a1e',   // dark chocolate outline
      lw:           3.2,        // outline line-width (px at scale 1)
      blush:       '#f6d3a4',   // soft pale-golden blush
      blushAlpha:   0.82,
      earFill:     '#5c3320',   // DARK BROWN inner ear (per new reference)
      // Head — very large round head
      hRx: 38, hRy: 36,
      // Ears — small round at top corners, sitting a little lower
      eR: 8, eX: 29, eY: -27,
      // Eyes — plain dots, no patches, no catchlight
      eyeR: 4.6, eyeX: 11.5, eyeY: 9,
      // Blush — large soft ovals sitting low on the cheeks
      bRx: 12, bRy: 10, bX: 23, bY: 15,
      // Mouth — small cat-style "ω"
      mY: 14, mW: 8,
      // Body — wide rounded blob
      boRx: 32, boRy: 23, boY: 44,
      // Arms — small stubby nubs, tucked at the body sides
      aW: 9, aH: 15, aX: 36, aY: 46, aAng: 0.14,
      // Feet — 2 wide flat stubs
      fW: 16, fH: 9, fX: 18, fY: 63, fR: 5,
      // Feature flags (opt-in; panda keeps the previous defaults)
      catchlight:  false,   // reference shows plain solid eye dots
      fingers:     false,   // no finger grooves on the bear
      shadow:      true,    // soft contact shadow under the feet
      shRx: 30, shRy: 4.5,  // shadow ellipse half-extents
      shAlpha: 0.10,        // very light, warm grey
      // No collar or bow tie
      collar: false, bowTie: false,
    },

    // YIER the panda  (game identifier: 'bubu')
    bubu: {
      fur:         '#ffffff',   // pure white body
      outline:     '#4a2a1e',   // warm dark-brown outline
      lw:           3.2,
      blush:       '#f8b4c0',   // baby pink blush
      blushAlpha:   0.85,
      earFill:     '#5c3320',   // warm dark-brown ears (per new reference)
      // Head — very large round head
      hRx: 38, hRy: 36,
      // Ears — larger rounder ears, slightly proud of the head
      eR: 12, eX: 29, eY: -27,
      // Eyes — plain dots, no patches, no catchlight
      eyeR: 4.6, eyeX: 11.5, eyeY: 9,
      // Blush — baby-pink ovals low on the cheeks (matches the bear)
      bRx: 12, bRy: 10, bX: 23, bY: 15,
      // Mouth — small cat-style "ω" (default; same shape as the bear)
      mY: 14, mW: 8,
      // Body — narrower than head
      boRx: 30, boRy: 22, boY: 46,
      // Arms — small stubby nubs, no grooves
      aW: 9, aH: 16, aX: 33, aY: 47, aAng: 0.14,
      // Feet — 2 wide flat stubs
      fW: 15, fH: 9, fX: 17, fY: 65, fR: 5,
      // Feature flags
      catchlight:  false,   // reference shows plain solid eye dots
      fingers:     false,   // no finger grooves
      shadow:      true,    // soft contact shadow under the feet
      shRx: 31, shRy: 4.5,
      shAlpha: 0.10,
      // Collar REMOVED (not in the new reference); large chest bow kept
      collar: false,
      bowTie: true,  btY: 45, btW: 10, btH: 6.5, btKnot: 3.4,
    },
  };

  // Reference ratios use head width=100. Preserve the existing 76px head
  // footprint and head-center anchor used by game callers.
  for (const [kind, style] of Object.entries(CHARACTER_STYLE)) {
    Object.assign(style, {
      headWidth: 100, headHeight: 88, headDepth: 90,
      outline: '#45282a', lw: 1.7 * 0.76,
      fur: kind === 'bubu' ? '#fffdfb' : '#d9a584',
      blush: kind === 'bubu' ? '#f9b3ae' : '#f6c47a',
      blushAlpha: 1, earFill: kind === 'bubu' ? '#45282a' : '#d9a584',
      hRx: 38, hRy: 44 * 0.76,
      eR: 11 * 0.76, eX: 35 * 0.76, eY: (11 - 41.5) * 0.76,
      innerEarR: kind === 'dudu' ? 6 * 0.76 : 0,
      eyeR: 4.3 * 0.76, eyeX: 20.5 * 0.76, eyeY: (55 - 44) * 0.76,
      bRx: 9 * 0.76, bRy: 9 * 0.76, bX: 34 * 0.76, bY: (68 - 44) * 0.76,
      mY: (58 - 44) * 0.76, mW: 10 * 0.76,
      boRx: 31 * 0.76, boRy: 26 * 0.76, boY: (104 - 41.5) * 0.76,
      aW: 14 * 0.76, aH: 24 * 0.76, aX: 30 * 0.76,
      aY: (97 - 41.5) * 0.76, aAng: -Math.PI / 12,
      fW: 20 * 0.76, fH: 16 * 0.76, fX: 20 * 0.76,
      fY: (129 - 41.5) * 0.76, fR: 7 * 0.76,
      darkFeet: kind === 'bubu', footTip: 6.5 * 0.76,
      btY: (91 - 41.5) * 0.76, btW: 8.5 * 0.76, btH: 5 * 0.76, btKnot: 2 * 0.76,
      shadow: false, catchlight: false, fingers: false
    });
  }

  // Original hand-authored 24-cell drawings, not sampled from reference pixels.
  const PIXEL_SPRITES = {
    bubu: [
      '........................',
      '....KKK..........KKK....',
      '...KKKKK.DDDDDD.KKKKK...',
      '...KKKKDDFFFFFFDDKKKK...',
      '....KKDFFFFFFFFFFDKK....',
      '.....DFFFFFFFFFFFFD.....',
      '....DFFFFFFFFFFFFFFD....',
      '...DFFFFFFFFFFFFFFFFD...',
      '...DFFFFFFFFFFFFFFFFD...',
      '...DFFFFFFFFFFFFFFFFD...',
      '...DFFFFKFFFFFFKFFFFD...',
      '...DFFFFFFKFFKFFFFFFD...',
      '...DFBFFFFFKKFFFFFBFD...',
      '...DFFFFFFFFFFFFFFFFD...',
      '....DFFFFFFFFFFFFFFD....',
      '.....DDFFFFFFFFFFDD.....',
      '......FDDDDDDDDDDF......',
      '.....DFFFFKKKKFFFFD.....',
      '.....DFFDFFKKFFDFFD.....',
      '......DDFFFFFFFDDD......',
      '.......DFFFFFFFD........',
      '.......DFFDDFFFD........',
      '.......DKKD.DKKD........',
      '........DD...DD.........'
    ],
    dudu: [
      '........................',
      '....DDD..........DDD....',
      '...DFFFD.DDDDDD.DFFFD...',
      '...DFKKDDFFFFFFDDKKFD...',
      '....DKDFFFFFFFFFFDKD....',
      '.....DFFFFFFFFFFFFD.....',
      '....DFFFFFFFFFFFFFFD....',
      '...DFFFFFFFFFFFFFFFFD...',
      '...DFFFFFFFFFFFFFFFFD...',
      '...DFFFFFFFFFFFFFFFFD...',
      '...DFFFFKFFFFFFKFFFFD...',
      '...DFFFFFFKFFKFFFFFFD...',
      '...DFBFFFFFKKFFFFFBFD...',
      '...DFFFFFFFFFFFFFFFFD...',
      '....DFFFFFFFFFFFFFFD....',
      '.....DDFFFFFFFFFFDD.....',
      '......FDFFFFFFFFDF......',
      '.....DFFFFFFFFFFFFD.....',
      '.....DFFDFFFFFFDFFD.....',
      '......DDFFFFFFFDDD......',
      '.......DFFFFFFFD........',
      '.......DFFDDFFFD........',
      '.......DFFD.DFFD........',
      '........DD...DD.........'
    ]
  };
  function validateSprites() {
    for (const [kind, rows] of Object.entries(PIXEL_SPRITES)) {
      if (rows.length !== 24 || rows.some(row => row.length !== 24 || /[^.DFBK]/.test(row))) {
        throw new Error('Invalid 24x24 character sprite: ' + kind);
      }
    }
    return true;
  }
  if (window.DEBUG || /(?:\?|&)debug(?:[=&]|$)/.test(window.location?.search || '')) validateSprites();
  // Pixel palette overrides per character
  // 'E' is the dark ear: warm dark brown #5c3320 for both characters
  // (each matches its own earFill).
  const PIXEL_PAL = {
    bubu: { F: '#fffdfb', B: '#f9b3ae', K: '#45282a', D: '#45282a' },
    dudu: { F: '#d9a584', B: '#f6c47a', K: '#45282a', D: '#45282a' },
  };

  // ── Private helpers ──────────────────────────────────────────────────

  /** Filled+stroked ellipse helper */
  function ell(ctx, x, y, rx, ry, fill, stroke, lw) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2);
    if (fill)   { ctx.fillStyle   = fill;   ctx.fill();   }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  /** Three small curved finger grooves at the base of an arm */
  function fingers(ctx, cy, halfW, color, lw) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = Math.max(0.8, lw * 0.5);
    ctx.lineCap     = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * halfW * 0.38, cy - halfW * 0.10);
      ctx.lineTo(i * halfW * 0.38, cy + halfW * 0.52);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Main draw function ────────────────────────────────────────────────
  /**
   * Draw one character at canvas position (x, y).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x        - anchor x (horizontal centre of feet)
   * @param {number} y        - anchor y (bottom of feet)
   * @param {'bubu'|'dudu'} kind
   * @param {number} scale    - uniform scale (1 = normal game size)
   * @param {number} visualTime - accumulated time for idle bounce
   * @param {number} squashAmt  - 0…0.24 squash-and-stretch amount
   * @param {boolean} reducedMotion
   */
  function draw(ctx, x, y, kind, scale, visualTime, squashAmt, reducedMotion) {
    const s   = CHARACTER_STYLE[kind] || CHARACTER_STYLE.dudu;
    const out = s.outline;
    const fur = s.fur;
    const lw  = s.lw;

    ctx.save();

    // Idle bounce
    const bounce = reducedMotion ? 0 : Math.sin((visualTime || 0) * 3.2) * 2.2;
    ctx.translate(x, y + bounce);

    // Squash & stretch
    const sq = (squashAmt || 0) > 0
      ? Math.sin((squashAmt / 0.24) * Math.PI) * 0.11
      : 0;
    ctx.scale(scale * (1 + sq), scale * (1 - sq));

    // The anchor is at (0,0) = centre-bottom of the character.
    // Head centre sits at (0, 0); body centre below.

    // ── 0. CONTACT SHADOW (drawn first, sits under everything) ──
    if (s.shadow) {
      ctx.save();
      ctx.globalAlpha = s.shAlpha != null ? s.shAlpha : 0.10;
      ell(ctx, 0, s.fY + s.fH * 0.9, s.shRx, s.shRy, '#3a2318', null, 0);
      ctx.restore();
    }

    // ── 1. EARS (drawn behind head) ──────────────────────────────
    for (const side of [-1, 1]) {
      ell(ctx, side * s.eX, s.eY, s.eR, s.eR, s.earFill, out, lw);
      if (s.innerEarR) {
        ell(ctx, side * (s.eX - 1.5), s.eY + 1.5, s.innerEarR, s.innerEarR, out, null, 0);
      }
    }

    // One continuous body/leg silhouette; no oval seams across the belly.
    ctx.beginPath();
    ctx.moveTo(-s.boRx * 0.7, s.boY - s.boRy);
    ctx.bezierCurveTo(-s.boRx * 1.15, s.boY, -s.boRx, s.fY, -s.fX - s.fW / 2, s.fY);
    ctx.quadraticCurveTo(-s.fX - s.fW / 2, s.fY + s.fH / 2, -s.fX, s.fY + s.fH / 2);
    ctx.quadraticCurveTo(-s.fX + s.fW / 2, s.fY + s.fH / 2, -s.fX + s.fW / 2, s.fY - s.fH / 4);
    ctx.lineTo(s.fX - s.fW / 2, s.fY - s.fH / 4);
    ctx.quadraticCurveTo(s.fX - s.fW / 2, s.fY + s.fH / 2, s.fX, s.fY + s.fH / 2);
    ctx.quadraticCurveTo(s.fX + s.fW / 2, s.fY + s.fH / 2, s.fX + s.fW / 2, s.fY);
    ctx.bezierCurveTo(s.boRx, s.fY, s.boRx * 1.15, s.boY, s.boRx * 0.7, s.boY - s.boRy);
    ctx.closePath();
    ctx.fillStyle = fur;
    ctx.fill();
    if (s.darkFeet) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = out;
      ctx.fillRect(-s.boRx * 1.5, s.fY + s.fH / 2 - s.footTip, s.boRx * 3, s.footTip);
      ctx.restore();
    }
    ctx.strokeStyle = out;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // ── 3. ARMS (finger grooves only when enabled) ──────────────
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * s.aX, s.aY);
      ctx.rotate(side * s.aAng);
      // Open shoulder: the outer contour joins the torso under the head.
      ctx.beginPath();
      ctx.moveTo(-side * s.aW * 0.45, -s.aH / 2);
      ctx.bezierCurveTo(side * s.aW, -s.aH * 0.35, side * s.aW, s.aH * 0.55, 0, s.aH / 2);
      ctx.quadraticCurveTo(-side * s.aW * 0.5, s.aH * 0.45, -side * s.aW * 0.45, s.aH * 0.1);
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = out;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();
      if (s.fingers !== false) fingers(ctx, s.aH * 0.18, s.aW / 2, out, lw);
      ctx.restore();
    }

    // ── 5. HEAD (drawn on top so ears/body look attached) ────────
    headPath(ctx, s);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.strokeStyle = out;
    ctx.lineWidth = lw;
    ctx.stroke();

    // ── 6. COLLAR RING (Yier only) ───────────────────────────────
    if (s.collar) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, s.colY, s.colRx, s.colRy, 0, 0, Math.PI * 2);
      ctx.fillStyle = out;
      ctx.fill();
      ctx.restore();
    }

    // ── 7. BOW TIE (chest bow) ─────────────────────────────────────
    if (s.bowTie) {
      const by = s.btY, bw = s.btW, bh = s.btH, bk = s.btKnot;
      ctx.save();
      ctx.fillStyle   = out;
      // Slightly deeper tone for the bow's own edge, so it reads as
      // a separate piece against the body rather than a flat blob.
      ctx.strokeStyle = out;
      ctx.lineWidth   = 1.3;
      ctx.lineJoin    = 'round';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 1.2, by);
        ctx.quadraticCurveTo(side * bw, by - bh, side * bw, by + bh * 0.25);
        ctx.quadraticCurveTo(side * bw * 0.8, by + bh * 1.3, side * 1.2, by + bh * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Centre knot
      ell(ctx, 0, by, bk, bk * 0.80, out, null, 0);
      ctx.restore();
    }

    // ── 8. BLUSH ─────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = s.blushAlpha;
    headPath(ctx, s);
    ctx.clip();
    for (const side of [-1, 1]) {
      ell(ctx, side * s.bX, s.bY, s.bRx, s.bRy, s.blush, null, 0);
    }
    ctx.restore();

    // ── 9. EYES (plain round dots — NO raccoon patches) ──────────
    for (const side of [-1, 1]) {
      ell(ctx, side * s.eyeX, s.eyeY, s.eyeR, s.eyeR, out, null, 0);
      // White catchlight sparkle (opt-out: the bear has solid dots)
      if (s.catchlight !== false) {
        ell(ctx, side * s.eyeX - 1.4, s.eyeY - 1.5, 1.2, 1.2, '#ffffff', null, 0);
      }
    }

    // ── 10. MOUTH ────────────────────────────────────────────────
    // 'cat' (default) = small cat-style "ω" used by the bear;
    // 'tilde'         = the panda's wider two-curve smile.
    ctx.save();
    ctx.strokeStyle = out;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    const my = s.mY;
    if (s.mouth === 'tilde') {
      ctx.lineWidth = lw * 0.65;
      ctx.beginPath();
      ctx.moveTo(-5.5, my);
      ctx.quadraticCurveTo(-1.5, my + 3.2,  0,   my + 1.8);
      ctx.quadraticCurveTo( 1.5, my + 0.4,  5.5, my + 2.0);
      ctx.stroke();
    } else {
      // Compact "ω": two shallow humps with a dip in the middle
      const w = (s.mW != null ? s.mW : 8) / 2;
      ctx.lineWidth = lw * 0.55;
      ctx.beginPath();
      ctx.moveTo(-w, my - 1.0);
      ctx.quadraticCurveTo(-w, my + 2.0, -w * 0.5, my + 2.0);
      ctx.quadraticCurveTo(-w * 0.2, my + 2.0, 0, my + 0.4);
      ctx.quadraticCurveTo(w * 0.2, my + 2.0, w * 0.5, my + 2.0);
      ctx.quadraticCurveTo(w, my + 2.0, w, my - 1.0);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // ← matches outer save
  }

  // Rounded crown, full cheeks, nearly level chin from the added 2D sheet.
  function headPath(ctx, s) {
    const x = s.hRx, y = s.hRy;
    ctx.beginPath();
    ctx.moveTo(0, -y);
    ctx.bezierCurveTo(x * 0.72, -y, x, -y * 0.35, x, y * 0.4);
    ctx.bezierCurveTo(x, y * 0.95, x * 0.78, y, 0, y);
    ctx.bezierCurveTo(-x * 0.78, y, -x, y * 0.95, -x, y * 0.4);
    ctx.bezierCurveTo(-x, -y * 0.35, -x * 0.72, -y, 0, -y);
    ctx.closePath();
  }

  // ── drawWelcome ───────────────────────────────────────────────────────
  /**
   * Render the welcome card artwork onto a 360×200 canvas at 2× scale.
   * Left: Bubu bear (dudu).  Right: Yier panda (bubu). Heart in between.
   * Mirrors the layout of the reference image.
   */
  function drawWelcome(canvas) {
    if (!canvas) return;
    canvas.width  = 360;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0); // uniform 2× backing scale
    ctx.clearRect(0, 0, 180, 100);

    draw(ctx,  48, 31, 'bubu', 0.80, 0, 0, true);
    draw(ctx, 132, 31, 'dudu', 0.80, 0, 0, true);

    // Heart between them
    ctx.save();
    ctx.scale(14 / 20, 14 / 20);
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-25, -7, -12, -23, 0, -10);
    ctx.bezierCurveTo(12, -23, 25, -7, 0, 8);
    ctx.fillStyle = '#ef95af';
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // ── Public API ──────────────────────────────────────────────────
  return {
    CHARACTER_STYLE,   // exposed for tweaking / legacy window ref
    PIXEL_SPRITES,
    validateSprites,
    getPixelPalette(kind) {   // palette override for pixelSprite()
      return PIXEL_PAL[kind] || PIXEL_PAL.dudu;
    },
    draw,
    drawWelcome,
  };
}());

// Also expose CHARACTER_STYLE at window level for any legacy references
window.CHARACTER_STYLE = window.CharacterRenderer.CHARACTER_STYLE;
