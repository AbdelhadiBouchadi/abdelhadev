# Spike S1: React Three Fiber on Next 16 and React 19

Branch `feat/00-foundation`, 2026-10-17. Throwaway code under `/[locale]/lab/r3f` and `/[locale]/lab/three`, removed before the branch was finished.

## Question

Does React Three Fiber hold for the home scene in 03 (decision T6, provisional), or is plain three.js leaner? Measure the lazy chunk, the time to first frame on the mobile profile, the path without WebGL and the path under reduced motion.

## What was built

A minimal port of `createScene` from `docs/prototype/assets/site.js`: two slabs (extruded rounded rectangles, `MeshPhysicalMaterial` with clearcoat) carrying canvas-drawn UI textures (agenda, chart), one Majorelle capsule, the ambient, hemisphere, key and rim lights, the idle float and the pointer parallax. The scene objects are built by one shared module, so both variants render the identical scene and the size difference is only the renderer layer:

- **R3F**: `<Canvas flat frameloop dpr={[1, 1.75]} camera={{ fov: 35, position: [0, 0, 12] }}>` with the scene as a `<primitive>` and `useFrame` driving the update.
- **Plain three.js**: `WebGLRenderer` in a `useEffect`, its own `requestAnimationFrame` loop, explicit `dispose()` on unmount.

Both are client components loaded with `next/dynamic(..., { ssr: false })` from a small client slot whose loading state, server render and no-WebGL state is the poster. drei was installed but not needed for this scene: nothing in the prototype scene maps to a drei helper, and drei is tree-shaken per import, so it costs nothing until a helper is imported.

## Results

Measured on the production build (`next build`, Turbopack), Chromium from Playwright 1.64.1.

### Lazy chunk (gzip, transferred only on the scene route)

| Variant | Chunks | Raw | gzip |
| --- | --- | --- | --- |
| R3F | three.js (2 chunks), R3F, slot | 908.2 KiB | **242.9 KiB** |
| Plain three.js | three.js (2 chunks), scene, slot | 725.8 KiB | **184.8 KiB** |

three.js itself is about 182 KiB gzip (r186 ships `three.core` and `three.module`; `import * as THREE` and the renderer pull most of both). React Three Fiber adds **about 58 KiB gzip (+31 %)** on top. The page's initial JavaScript is unchanged: nothing of either variant loads before hydration.

### Time to first frame, mobile profile

Pixel 7 emulation at 390 px, network 150 ms RTT and 1.6 Mbps down, CPU slowed 4x, three runs, median. Headless Chromium renders WebGL with SwiftShader (software), so the GPU part is slower than on a real phone.

| Variant | First frame after navigation start | Of which: script download done | Scene build and first render |
| --- | --- | --- | --- |
| R3F | **6.9 s** | 5.3 s | 1.2 to 1.7 s |
| Plain three.js | **7.4 s** | 4.8 to 5.5 s | 1.9 to 2.4 s |

Same throttling at 1440 px: R3F 4.2 s, plain 3.8 s, with 0.3 to 0.5 s of scene work. The two are within noise of each other; **the download dominates**. On this profile the chunk arrives after the loader's 4.5 s ceiling, so the first visit would always hit the ceiling waiting for the scene (weight 3).

### Without WebGL

Chromium launched with `--disable-webgl --disable-webgl2 --disable-3d-apis`: both variants render the poster, no canvas is created, no page error. The WebGL check runs before the dynamic component renders, so the 185 to 243 KiB chunk should never be requested; that follows from the code and was not measured separately.

### Reduced motion

`prefers-reduced-motion: reduce`: R3F with `frameloop="demand"` and the plain variant with a single `render(0)` both draw **exactly one frame** in 1.5 s (one still frame, as `docs/choreography.md` asks).

### Other findings

- **Colour**: R3F defaults to ACES filmic tone mapping. Without `flat` the slabs render washed out and do not match the prototype or the plain variant; with `flat` (no tone mapping) they match.
- **Deprecation**: R3F 9.8.2 with three r186 logs `THREE.Clock: This module has been deprecated` on every load. Harmless today, but R3F trails three's API.
- **Colours from tokens**: three.js takes colours as numbers or strings, which escaped `check:tokens`. The rule now also flags `0xrrggbb` (committed on this branch). The spike read every colour from the CSS tokens with `getComputedStyle`. The prototype's light colours (`0xfff1e6`, `0xfff4ea`, `0xd9a58a`, `0xffd2b0`, `0x6f80ff`) and the placeholder screen colours are not tokens; the spike approximated them with `sheet`, `sunset` and `majorelle-soft`. 03 needs the owner to decide whether these become tokens.
- **Cleanup**: R3F disposes the renderer on unmount on its own; the plain variant needs an explicit `dispose()` for renderer, geometries, materials and textures (about 10 lines).

## Recommendation

**Use plain three.js for the home scene in 03**, inside one client component (`components/three/HeroScene.tsx`) loaded with `next/dynamic` and `ssr: false`, with the poster as its fallback. This changes provisional decision T6, so it is the owner's call; `decisions.md` and `AGENTS.md` are unchanged, and `three`, `@react-three/fiber` and `@react-three/drei` stay installed until the owner decides.

Why:

1. The scene is imperative by nature: its state comes from three scroll timelines (`p1`, `p2`, `p3`) and the pointer, not from React state. R3F's declarative tree adds nothing to a single scene with no interactive objects.
2. R3F costs 58 KiB gzip more (31 %) for the same scene and the same first frame. On a mobile network that is roughly 0.3 s more download on a chunk that already arrives late.
3. R3F needs `flat` to match the art direction and currently logs a deprecation with three r186.

What R3F would give, if the owner keeps it: React lifecycle cleanup and `frameloop="demand"` for free, and drei helpers later. If it stays, use `flat`, `frameloop="demand"` under reduced motion and `dpr={[1, 1.75]}`.

For 03 either way:

- **Start the chunk download early**: on the home route only, begin `import()` of the scene as soon as the page module evaluates (or add a `modulepreload`), not after hydration and the WebGL check, so the scene has a chance to make the loader ceiling on mobile.
- **Never let the scene hold the loader past the ceiling**: the poster covers until the first frame is ready, then the canvas fades in (1.8 s, as in the prototype).
- Mobile: four slabs at 60 % scale as in the prototype; cap `dpr` at 1.75.
