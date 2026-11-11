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

## Limits

- The lower part of the tower is hidden behind exhibition buildings in Féau's prints. The
  model's legs therefore look wider than the photographs show.
- The camera position is derived, not surveyed. Alignment is best at the floors and drifts by a
  few pixels towards the edges.
