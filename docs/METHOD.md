# Method

How the numbers behind the exhibit were obtained, and how far to trust them.

## 1. Timeline

A research pass collected dated milestones and key figures from Google Arts & Culture,
toureiffel.paris, Musée d'Orsay photo records, Rare Historical Photos and others. The result is
`data/research-timeline.json`.

Where sources disagree, the page shows the disagreement next to the milestone instead of
picking one value. The main disagreements:

- Start of works: 26 or 28 January 1887.
- First platform: 20 March, 1 April or 29 April 1888.
- Lifts: 26 May 1889, or from the opening.

Pages of toureiffel.paris and structurae.net refused automated reads. Values taken from them
come from search snippets and are labelled that way in the JSON.

## 2. Photographs

All 20 photographs come from the Commons category *Eiffel Tower under construction*.

Féau's album (Musée Carnavalet) mounts two prints per card, each with its date handwritten
underneath. Each card was cut into its two prints with fixed boxes:

- left print: 2.8–45.8 % of the card width;
- right print: 53.7–97.2 % of the card width;
- both: 2.8–89.8 % of the card height.

The dates were read from the handwriting. Result: 15 dated prints, from 10 August 1887 to
31 March 1889, all from the same viewpoint.

## 3. Heights measured on the prints

The first and second platforms are 57.6 m and 115 m high. On each print, the pixel gap between
them gives the scale, and the top of the structure is measured with it. Cranes and masts are
left out of the measurement.

Two checks:

- On the 31 March 1889 print the method gives 301 m (real: 300 m).
- On the 14 August 1888 print it gives 116 m (real: 115 m).

Expected error: about ±10 m. The measured heights are in `data/photos.json`
(`height_measured_m`). Between photographs the model interpolates linearly.

Before March 1888 no platform is visible, so the heights for that period remain estimates.

## 4. Féau's viewpoint

The Carnavalet record says the series was "photographiée depuis l'une des tours du palais du
Trocadéro", with the École militaire in the background. The old palace stood about 80 m high on
the Chaillot hill, roughly 650–700 m from the tower on the Iéna bridge axis.

The camera is therefore placed 680 m from the tower and 100 m above its base, slightly off the
axis (one of the two towers).

## 5. Laying a print over the model

1. **Print to print.** Each print is aligned to the 31 March 1889 print using only the static
   background: the city, the Champ-de-Mars and the exhibition halls. The tower is masked out.
   - Method: SIFT features, a ratio test, then a similarity transform found with RANSAC.
   - Prints are chained date by date, each aligned to its neighbour.
   - Steps from March 1888 on have 12–50 inliers, with a median residual of 0.2–0.4 px.
   - The three hazy 1887 prints did not have enough features. They were aligned with ECC
     (intensity correlation, affine), starting from SIFT or identity. Only near-identity
     results were accepted: scale 0.95–1.05, rotation under 1.5°.
   - The result is `data/registration.json`: CSS `matrix()` values that map print pixels to
     reference-print pixels.
2. **Reference print to model.** On the 31 March 1889 print, five features were read:

   | Feature | Pixel on the reference print |
   |---|---|
   | Tower axis | x = 304.5 |
   | 1st floor, near edge | y = 573 |
   | 2nd floor, near edge | y = 468 |
   | 3rd floor | y = 199 |
   | Lantern top | y = 159 |

   At run time, the page projects the matching model points through the live camera. It then
   fits a uniform scale and shift, so the overlay follows any screen size.
3. **Check.** Residuals at the four points were 2.0–2.4 px on a 1440 px wide screen and
   1.1–1.3 px on a phone-width screen. A split view (print on the left of the axis, model on the
   right) matched to within about 2 px at the floors and 4–7 px at the top of the structure on
   the dates checked.

   `window.__eiffel.fit(date)` reports these residuals. For a Féau print they measure the fit of
   the model to the reference print, so they are the same for every Féau date; how well each
   print sits on the reference print is the residual of step 1.

## 6. Geometry from the 1887 elevation

The outline comes from *Élévation générale de la tour de 300 mètres*, the general elevation
annexed to the contract of 8 January 1887 (Archives nationales, F/12, CC BY 4.0). It is a
front view, drawn to scale, of the design that was then built with few changes.

- **Scale.** The drawing's 300 m dimension runs from the ground line to the tip of the mast:
  12.36 px per metre on the scan used. As a check, the first and second floor bands of the
  drawing span about 52–64 m and 108–121 m, around the as-built 57.6 m and 115 m.
- **Outline.** The ink silhouette was traced row by row and smoothed with a 31-row median filter.
  The outer half-width is sampled every 5 m from 0 to 300 m. The floor bands, where platforms
  hide the legs, are bridged.
- **Base.** At the ground line the drawing reads a 60.6 m half-width, which includes the flare
  of the masonry pedestals. Extending the leg edge between 5 and 10 m to the ground gives
  57.8 m; the model uses 58 m. The model's base is therefore 116 m across, about 7 % narrower
  than the 125 m of the built tower.
- **Legs and arches.** Leg widths were read at the base, at both floors and in between. The
  arch under the first floor is traced as ten points of its inner curve.
- **Floors** are placed at the as-built heights (57.6, 115 and 276 m) rather than read off the
  drawing.

The tables are in `data/geometry.json`. The lattice inside the outline is schematic: panels of
diagonal bracing whose spacing follows the leg height, not the real members.

## 7. Durandelle's viewpoint (23 November 1888)

Louis-Émile Durandelle photographed the tower from the Champ-de-Mars with a view camera. Such
cameras are kept level and the lens is raised to frame a tall subject, so the photograph has
no converging verticals but its centre is not the image centre.

1. Eight points were read on the photograph: the left and right ends of the first and second
   platform bands on the face towards the camera, each at the band's top and bottom edge.
2. Camera model: optical axis horizontal (no tilt or roll), camera at eye height (1.6 m),
   unknown sideways position, distance, focal length and lens shift (both principal-point
   coordinates). For a fixed distance the projection equations are linear in the others, so they
   were solved by least squares for every distance from 80 to 3000 m in 0.5 m steps, keeping the
   smallest pixel error.
3. Result: camera 228 m from the axis on the Champ-de-Mars side, 8.3 m off it, 54.9° vertical
   field of view. The eight points reproject with 1.45 px rms (largest 1.67 px) on a
   629 × 800 px image.

At run time the page uses this camera with the same lens shift (`setViewOffset`), then lays the
photograph over the model with the fitting step of section 5.

The photograph of 15 March 1889 (author unknown) was tried the same way and rejected: no single
level camera fits its points better than 5 px rms, so the print is probably cropped, tilted or
retouched. Both results are in `data/cameras.json`.

## 8. The museum playthrough

Each chapter sets a date, a camera and, where there is one, a photograph. While a print is shown
framed, only the part of it inside a safe rectangle is drawn: away from the screen edges and
clear of the wall label and the credits. The crop shifts the photograph's CSS matrix by the
cropped offset, so the photograph stays registered with the model; with the crop the frame is
never cut by the edge of the screen. On phones the camera's whole frame is fitted into the
area above the wall label with a zoom-out view offset.

## 9. How the page was checked

- `tools/check.mjs` runs 152 checks in Chromium at 1440×900, 1280×720, 390×844 and 320×568:
  intro and buttons on screen, each chapter's label, framed print and plate inside the free
  area, the top of the tower visible, focus moves, `Esc`, pause and next, mode switches, no
  page errors. `--self-test` feeds each check a known-bad case and expects it to fail.
- `tools/record.mjs` records the whole tour for review frame by frame.
- An independent reviewer (a separate agent that saw only the code and the page, not this
  method) went through the page at four sizes, in light and dark mode and with reduced motion.
  The confirmed findings were fixed and the check script now covers them. One was left: the
  model cannot be rotated from the keyboard.

## Limits

- The lower part of the tower is hidden behind exhibition buildings in Féau's prints. The
  model's legs therefore look wider than the photographs show.
- The camera position is derived, not surveyed. Alignment is best at the floors and drifts by a
  few pixels towards the edges.
- The model's base is about 7 % narrower than the built tower (section 6).
