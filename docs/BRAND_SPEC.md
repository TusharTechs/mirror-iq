# MirrorIQ Brand Specification — "Split Reflection M"

## Concept
The symbol is a geometric M split into two mirrored halves by a 2.4-unit
vertical gap: the mirror plane. Left half = the self (ivory). Right half =
the reflection (emerald, or reduced opacity in mono) — and because it is the
highlighted half, it doubles as the subtle "selected option" cue.
You, mirrored, decided.

## Construction
- Grid: 48 × 48 units. Stem width 7u. Top y=8, baseline y=40.
- Mirror gap: x 22.8–25.2 (2.4u), centered on x=24, running y≈23–31.
- Valley floor: y=31, flat, 20.5–27.5 before clipping.
- Two closed straight-line paths; no curves, gradients, filters, or effects.
- Right half is the exact mirror of the left (x' = 48 − x).

## Color
| Token   | Hex     | Use                          |
|---------|---------|------------------------------|
| Dark    | #09090B | backgrounds, app icon field  |
| Ivory   | #F4F1EA | left half, wordmark on dark  |
| Emerald | #34D399 | right half on dark, "IQ"     |
| Emerald-deep | #059669 | right half on light     |
| Black   | #0A0A0A | mono-black variant           |

Mono rule: the reflection half is always expressed as fill-opacity 0.4 of the
primary ink (ivory or black). Brand-color rule: reflection half is emerald.

## Typography
Wordmark: "MirrorIQ" in Fraunces (600), tight tracking; "IQ" may take the
emerald accent. Body/UI: Geist. Standalone SVG logo files fall back to
Georgia/serif and must never embed font files.

## Clear space & minimum sizes
- Clear space: 7u (one stem width) on all sides of the symbol.
- Symbol minimum: 16 px. Horizontal logo minimum width: 120 px.
- Favicon/app icon always on the #09090B field (rounded square).

## Usage map
| Asset | Where |
|---|---|
| favicon.svg | browser tab (layout metadata) |
| mirroriq-app-icon.svg | PWA/app icon, social avatars, repo card |
| mirroriq-symbol.svg | app header (dark), splash, demo watermark |
| mono-ivory | dark single-color contexts (video end card, footer) |
| mono-black | light single-color contexts (press, print) |
| logo-horizontal.svg | README header, slides, press kit |
| logo-horizontal-light.svg | ivory/light surfaces |

## Do not
Rotate, recolor outside the defined variants, add shadows/glows/outlines,
rebalance the halves, close the mirror gap, place on busy imagery without a
dark field, or combine with hangers/bags/faces/sparkles.