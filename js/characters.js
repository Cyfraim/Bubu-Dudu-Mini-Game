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

  // ── Pixel sprites (16 × 16, anchor col=7 row=11) ──────────────────
  // Used by Pixel Picnic and Together Run modes.
  // All rows are exactly 16 ASCII characters (validated at load time).
  //
  // Colour key — fed into the game's PIXEL_COLORS palette:
  //   E = dark ear        (both: #5c3320)
  //   F = body fur        (panda: white  / bear: caramel)
  //   B = blush           (panda: pink   / bear: golden)
  //   K = dark accent     (eyes, mouth, panda's chest bow)
  //   W = catchlight      (unused in the current sprites, kept for
  //                        future highlights)
  //   D = outline
  //   . = transparent
  //
  // Both sprites share one silhouette; they differ only on rows 1
  // (ear inner colour), 10 and 11 (the panda alone wears a chest bow).
  //
  // YIER the PANDA  (bubu) — rev 2026-02b
  // Redrawn from the supplied pixel reference:
//   E = dark brown ear (matches earFill #5c3320), F = white fur,
//   eyes are solid K with NO W catchlight, B = pink blush,
//   rows 10-11 = the dark chest BOW (notched top centre),
//   row 7 centre = the small "ω" MOUTH (K).
// No collar ring in this revision.
  const PANDA_16 = [
    '..EEE......EEE..',  //  0  ear tops
    '.EEEE......EEEE.',  //  1  ear body
    '..EEE......EEE..',  //  2  ear rounds off into the head crown
    '.DFFFFFFFFFFFFD.',  //  3  forehead
    'DFFFFFFFFFFFFFFD',  //  4  head widest
    'DFFFFFFFFFFFFFFD',  //  5  mid-face
    'DFFFKKFFFFKKFFFD',  //  6  eyes: solid K, no catchlight
    'DFFBBFFKKFFBBFFD',  //  7  blush + mouth (K at 7,8)
    'DFFBBFFFFFFBBFFD',  //  8  lower blush
    '.DFFFFFFFFFFFFD.',  //  9  chin
    '.....DD..DD.....',  // 10  chest bow, notched top centre
    '.....DDDDDD.....',  // 11  chest bow body
    '..DFFFFFFFFFFD..',  // 12  body top (narrower than head)
    '..DFFFFFFFFFFD..',  // 13  body + arm nubs
    '..DFF..DD..FFD..',  // 14  feet tops
    '...DDD....DDD...',  // 15  feet outline
  ];

  // BUBU the BEAR  (dudu) — rev 2026-02b
  // Redrawn from the supplied pixel reference:
  //   E = dark brown ear (matches earFill #5c3320), F = caramel fur,
  //   eyes are solid K with NO W catchlight, B = golden blush,
  //   row 7 centre = the small "ω" MOUTH (K).
  // No collar ring and no chest bow (the bear has neither).
  const BEAR_16 = [
    '..EEE......EEE..',  //  0  dark ear tops
    '.EEEE......EEEE.',  //  1  ear body
    '..EEE......EEE..',  //  2  ear rounds off into the head crown
    '.DFFFFFFFFFFFFD.',  //  3  forehead
    'DFFFFFFFFFFFFFFD',  //  4  head widest
    'DFFFFFFFFFFFFFFD',  //  5  mid-face
    'DFFFKKFFFFKKFFFD',  //  6  eyes: solid K, no catchlight
    'DFFBBFFKKFFBBFFD',  //  7  blush + mouth (K at 7,8)
    'DFFBBFFFFFFBBFFD',  //  8  lower blush
    '.DFFFFFFFFFFFFD.',  //  9  chin
    '..DFFFFFFFFFFD..',  // 10  body top (no bow on the bear)
    '..DFFFFFFFFFFD..',  // 11  arm nubs
    '..DFFFFFFFFFFD..',  // 12  body
    '..DFFFFFFFFFFD..',  // 13  lower body
    '..DFF..DD..FFD..',  // 14  feet tops
    '...DDD....DDD...',  // 15  feet outline
  ];

  // Runtime validation (safe: only logs errors, never throws in production)
  const PIXEL_SPRITES = {};
  for (const [kind, rows] of [['bubu', PANDA_16], ['dudu', BEAR_16]]) {
    PIXEL_SPRITES[kind] = rows.map((r, i) => {
      if (typeof r !== 'string' || r.length !== 16) {
        console.error('[CharacterRenderer] bad sprite row', kind, i, JSON.stringify(r));
        return '................'; // transparent fallback
      }
      return r;
    });
  }
  // Pixel palette overrides per character
  // 'E' is the dark ear: warm dark brown #5c3320 for both characters
  // (each matches its own earFill).
  const PIXEL_PAL = {
    bubu: { E: '#5c3320', F: '#fffaf2', B: '#f8b4c0', K: '#4a2a1e', W: '#ffffff', D: '#4a2a1e' },
    dudu: { E: '#5c3320', F: '#c8906a', B: '#f6d3a4', K: '#4a2a1e', W: '#ffffff', D: '#4a2a1e' },
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
    }

    // ── 2. BODY ──────────────────────────────────────────────────
    ell(ctx, 0, s.boY, s.boRx, s.boRy, fur, out, lw);

    // ── 3. ARMS (finger grooves only when enabled) ──────────────
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * s.aX, s.aY);
      ctx.rotate(side * s.aAng);
      ell(ctx, 0, 0, s.aW / 2, s.aH / 2, fur, out, lw);
      if (s.fingers !== false) fingers(ctx, s.aH * 0.18, s.aW / 2, out, lw);
      ctx.restore();
    }

    // ── 4. FEET (wide flat rounded stubs) ────────────────────────
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(side * s.fX - s.fW / 2, s.fY - s.fH / 2, s.fW, s.fH, s.fR);
      ctx.fillStyle   = fur;
      ctx.fill();
      ctx.strokeStyle = out;
      ctx.lineWidth   = lw;
      ctx.stroke();
    }

    // ── 5. HEAD (drawn on top so ears/body look attached) ────────
    ell(ctx, 0, 0, s.hRx, s.hRy, fur, out, lw);

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
      ctx.strokeStyle = '#2e1a12';
      ctx.lineWidth   = 1.3;
      ctx.lineJoin    = 'round';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 1.2, by);
        ctx.lineTo(side * bw, by - bh);
        ctx.quadraticCurveTo(side * bw * 0.60, by, side * bw, by + bh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Centre knot
      ell(ctx, 0, by, bk, bk * 0.80, out, '#0d0707', 1.0);
      ctx.restore();
    }

    // ── 8. BLUSH ─────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = s.blushAlpha;
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
      ctx.quadraticCurveTo(-w * 0.5, my + 2.0,  0, my + 0.4);
      ctx.quadraticCurveTo( w * 0.5, my - 1.2,  w, my + 1.2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // ← matches outer save
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

    draw(ctx,  48, 60, 'dudu', 0.80, 0, 0, true); // Bubu bear  (left)
    draw(ctx, 132, 60, 'bubu', 0.80, 0, 0, true); // Yier panda (right)

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
    PIXEL_SPRITES,     // 16×16 sprites keyed by kind
    getPixelPalette(kind) {   // palette override for pixelSprite()
      return PIXEL_PAL[kind] || PIXEL_PAL.dudu;
    },
    draw,
    drawWelcome,
  };
}());

// Also expose CHARACTER_STYLE at window level for any legacy references
window.CHARACTER_STYLE = window.CharacterRenderer.CHARACTER_STYLE;
