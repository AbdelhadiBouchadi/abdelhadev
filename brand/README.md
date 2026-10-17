# Abdelhadev brand kit

The sunset mark: a sun on the Atlantic horizon. The wordmark is outlined from Bricolage Grotesque Bold (SIL Open Font License), so it renders the same everywhere.

## Colours
- Paper #F7F0E8, ink #2B1D1A, night #1E1513, moon #F4E6D7
- Glow (the sun) #FFB48A, Majorelle (the horizon) #3D52D5, Majorelle soft #AEB7F4

## Files
- logo-horizontal.svg, logo-horizontal-night.svg: header and documents
- logo-stacked.svg: square placements, CV cover
- logo-mark.svg (+ -night, -ink, -paper): the mark alone
- logo-mark-animated.svg: layered for motion. #sun-disc is a full circle clipped at the horizon: translateY 19 = set, 0 = risen. #horizon and #reflection scale from the centre (32, 41).
- wordmark-*.svg: the name alone; wordmark-animated.svg has one path per letter (#g0 to #g9) for letter-by-letter animation
- favicons/: favicon.svg (follows the tab's light or dark theme), favicon.ico (16, 32, 48), apple-touch-icon.png (180), icon-192/512.png, icon-maskable-512.png, mask-icon.svg, site.webmanifest
- og-image.png / .svg: social card, 1200 x 630

## In Next.js (App Router)
Put favicon.ico, icon.svg (= favicon.svg), apple-icon.png (= apple-touch-icon.png) in src/app/ and Next generates the tags. The manifest goes in src/app/manifest.ts.
