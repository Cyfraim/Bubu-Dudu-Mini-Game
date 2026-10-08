# Character reference measurements

Reference review: October 7, 2026. All measurements are approximate visual ratios, not pixel-exact tracing. Head width = 100; y runs downward from the head crown. Artwork must be independently code-drawn; references are not runtime assets.

## Inventory and classification

- `normal/Bubu.jpg`: Bubu, white, front/flat sticker.
- `normal/Dudu.jpg`: Dudu, brown, front/flat sticker (slightly asymmetric pose).
- `normal/Bubu Top, Side Left, Side Right, Back.jpg`: Bubu, multi-angle sheet including front, top, both sides and back.
- `normal/Dudu Top, Side Left, Side Right, Back.jpg`: Dudu, multi-angle sheet including front, top, both sides and back.
- `pixel/bubu.jpg`: Bubu, front pixel-style sticker.
- `pixel/dudu.jpg`: Dudu, front pixel-style sticker.
- Unidentified images: none among these six inspected images.

## Working normalized measurements

| Feature | Bubu | Dudu |
|---|---|---|
| Head width × height | 100 × 83 | 100 × 83 |
| Crown / lower curvature | rounded crown; nearly level central chin | rounded crown; nearly level central chin |
| Upper / lower vertical radius | 45 / 38 | 45 / 38 |
| Body width × height including legs | 62 × 59 | 62 × 59 |
| Body top / widest / bottom y | 78 / 105 / 137 | 78 / 105 / 137 |
| Arms width × length | 14 × 24 | 14 × 24 |
| Arm attachment / outward angle | x ±30, y 85 / 15° | x ±30, y 85 / 15° |
| Leg width / center / gap | 20 / x ±20 / about 20 | 20 / x ±20 / about 20 |
| Ear diameter / centers | 22 / x ±35, y 11 | 22 / x ±35, y 11 |
| Inner ear diameter | none: solid dark ears | 12, shifted inward and downward |
| Eye diameter / spacing / y | 9 / 38 / 55 | 9 / 38 / 55 |
| Mouth width / height / y | 11 / 3 / 58, thin ω | 11 / 3 / 58, thin ω |
| Blush diameter / centers | 19 / x ±32, y 67 | 19 / x ±32, y 67 |
| Outline / mouth stroke | about 1.7–2 / 1.3 | about 1.7–2 / 1.3 |
| Bow width × height / y | 17 × 10 / 91 | none |
| Dark foot height | bottom 6–7 | none |

The front stickers are mildly turned/asymmetric; these values symmetrize them for reusable game art. Dudu's front sticker spans approximately x=285–760 for the head and y=205–605, yielding head height/width ≈84%. Eye centers are approximately 182 image pixels apart, or 38% of head width. JPEG compression and lighting prevent exact palette identification; flat palette targets below are visually matched approximations using the supplied starting palette.

## Flat palette

| Use | Bubu | Dudu |
|---|---|---|
| Fill, arms, legs | #fffdfb | #d9a584 |
| Outline, eyes, mouth | #45282a | #45282a |
| Blush | #f9b3ae | #f6c47a |
| Outer ears | #45282a | #d9a584, dark outline |
| Inner ears | not separate | #45282a |
| Feet | #45282a tips | #d9a584 |
| Bow tie | #45282a | none |
| Tail nub | #fffdfb | not visible in back view |

## Multi-angle findings

Head depth is approximately 90% of width; front height about 83–87%. Body width is about 60–62% of head width, with a narrower side depth around 48–52%. Arms hang against the sides, slightly forward of the body's center plane. Ears are rounded, shallow lobes rather than full protruding balls; top views place them toward the front half of the crown. Bubu's back view has a small white round tail nub low on the body (diameter about 12% of head width). The photographed models have lighting/shadows, which are not part of the requested flat palette. No eye patches, nose or muzzle appear.

## Pixel interpretation

Use independently hand-authored 24×24 grids: approximately 18×15 head, small body, one-cell solid eyes and blush accents, Bubu's dark ears/bow/foot tips, Dudu's brown ears with dark inner cells. Preserve the previous displayed sprite footprint by compensating cell scale.

## Validation status

## Added reference review — October 8, 2026

Added `normal/Bubu and Dudu 2D.jpg` (both characters, multi-angle line-art sheet)
and `normal/Bubu and Dudu 3D.jpg` (both characters, model reference; no 3D edits
in this pass). The new 2D front view has a nearly level chin and a continuous
body/leg outline, unlike the old renderer's overlapping ellipses. The shared
neutral pose does not reproduce the sheet's hand-holding pose.

Updated working 2D ratios: head 100 × 88, eyes diameter 8.6 and spacing 41,
eye y=55, mouth width 10 at y=58, cheeks diameter 18 at x=±34, y=68.
These are visual estimates; the original table above records the earlier sticker
baseline. The 76-unit runtime head width and head-center drawing anchor remain.

Pixel references were viewed independently: broad heads with stepped crowns,
low solid eyes, small omega mouths, connected bodies, dark Bubu ears and bow,
and Dudu's brown outer ears with dark centers. Replaced the former 16×16 grids
with original 24×24 drawings. Character cell size compensates by 16/24 to retain
the original sprite footprint; item art is unchanged.

The local comparison page loads the eight-image manifest, with 400px canvases
beside references. It is not linked from the game and is excluded from deployment.
Automated and screenshot results are reported separately; no pixel-exact match
is claimed.

Validation completed: `tests/character-art.cjs` passes both 24×24 grid/palette
checks and static/animated canvas-state checks. `tests/character-screenshots.cjs`
captured hub, Love Catch, Pixel Picnic, Together Run and Hug Mode without
reported browser runtime exceptions. All five screenshots were visually
inspected. Character pixels now render on integer device-pixel boundaries
after the scenery buffer, avoiding fractional-cell blur. Love Catch/Hug Mode
use a drawing-only upward offset to keep feet visible; collision coordinates
are unchanged. Welcome art is reframed to fit its existing canvas.