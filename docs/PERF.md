# Performance

Measured on 11 November 2026 with `tools/perf.mjs` in Chromium 158 (headless), on the machine the
page was built on. Re-run the script after any change to the scene.

## Results

| | This machine's GPU | Weak device (`--low`) |
|---|---|---|
| Renderer | RTX 2080 Ti through ANGLE / Direct3D 11 | SwiftShader (software WebGL), CPU slowed 4× |
| Viewport | 1440 × 880, 1× | 390 × 844, 2× |
| First frame drawn | 1.2 s | 1.3 s |
| Transferred | 385 KB in 7 requests | same |
| Frame rate, intro | 100 fps (headless cap) | 24 fps, still lowering resolution when measured |
| Frame rate, tour | 100 fps | 37 fps at 0.75 pixel ratio |
| Per frame | 55 draw calls, 39.9 k triangles, 2.1 k line segments, 6 textures | same |
| JS heap | 9 MB | 15 MB |

Three.js and the fonts come from CDNs; the photographs load on demand as the tour reaches them.

## What keeps it fast

- **Few draw calls.** The exhibition buildings are merged into three meshes (walls, roofs,
  outlines). The tower's main members are one instanced mesh and its bracing one set of line
  segments; the trees are two instanced meshes (trunks and crowns).
- **Shadow map on demand.** The sun never moves, so the shadow map is redrawn only when a shadow
  caster changes: the date, or the cranes while the tower is being built. With the tower still,
  WebGL draw calls per frame drop from 85 to 55 (counted by wrapping `drawElements`/`drawArrays`;
  three.js' own `renderer.info` does not count the shadow pass).
- **Adaptive resolution.** Every 2 s the page checks the frame rate. Below 40 fps it lowers the
  pixel ratio by 0.25, down to 0.75. The first window after load is skipped, since it includes
  shader compilation.

## A/B on the weak-device profile

The same build with each optimisation switched off, measured one after the other:

| Variant | Intro | Tour |
|---|---|---|
| Neither | 19.4 fps | 19.1 fps |
| Shadow map on demand only | 19.2 fps | 17.4 fps |
| Shadow map on demand + adaptive resolution | 23.7 fps (still stepping down) | 37.1 fps |

In software rendering the shadow pass is cheap next to filling 0.7 million pixels per frame, so
the shadow change alone does not move the frame rate there; it saves draw calls, which matters
more on phones whose GPU driver is the bottleneck. The frame-rate gain comes from the adaptive
resolution.

## No leaks

Sweeping every date from January 1887 to May 1889 three times leaves the GPU with the same 53
geometries and 6 textures after each pass: objects that appear later in the timeline are
uploaded once and kept.
