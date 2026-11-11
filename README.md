# Eiffel Tower construction, 1887–1889

An interactive Three.js exhibit of how the Eiffel Tower was built, from the first foundation
digs on 26 January 1887 to the lifts entering service in May 1889. The page is in Uzbek.

**Live page:** <https://menarzullayev.github.io/eiffel-1887/>

The page opens as a museum piece. **Ko‘rgazmani boshlash** plays a guided tour in 10 chapters:
the 1887 design drawing, the finished tower taken down to its foundations, then rebuilt stage by
stage. At each stage the camera goes to where a period photographer stood, the dated print appears
framed, then fades to reveal the model in the same place. **Tadqiqot rejimi** (or `#research` in the
URL) opens the research view with the full timeline, all photographs and the overlay controls.

- **Geometry from the 1887 drawing.** The silhouette, leg widths and arches are traced on the
  general elevation annexed to the 8 January 1887 contract (Archives nationales).
- **Two photographers' viewpoints.** Théophile Féau's series from a tower of the old Trocadéro
  palace, and Louis-Émile Durandelle's view of 23 November 1888 from the Champ-de-Mars. The
  second camera was solved from the photograph itself (1.45 px rms).
- **1889 setting.** Sepia palette taken from the prints, fog, the Exposition's palaces, the
  Galerie des Machines, the old Trocadéro, the Iéna bridge and the quays, lit by the sun and the
  sky only.
- **Timeline.** 13 dated milestones. Each one names its sources and says where they disagree.
- **3D model.** Foundations, wooden scaffolding, creeper cranes, hot-rivet sparks and the flag on
  31 March 1889 follow the date on the timeline.
- **Archive photographs.** 20 dated photographs. 15 of them are Théophile Féau's series, taken
  from one fixed point.
- **Measured heights.** From March 1888 on, the height of the model on each date is measured on
  Féau's prints.
- **Féau viewpoint.** The camera moves to the tower of the old Trocadéro palace where Féau stood.
  The matching print can then be laid over the model with adjustable opacity.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Three.js 0.160.0 and the fonts load from public CDNs, so the
page needs an internet connection.

Controls: drag to orbit, wheel to zoom. Tour: `Esc` leaves it. Research view: `Space`
play/pause, `←` `→` milestones, `F` photographer's viewpoint. `#autoplay` in the URL starts the
tour on load.

## Checks, recording and performance

The scripts in `tools/` drive a real Chromium through `playwright-core`. They use the Chromium
from the Playwright cache, or the one named in `CHROMIUM_PATH`.

```bash
cd tools && npm ci
```

```bash
node tools/check.mjs
```

`check.mjs` runs 152 layout and behaviour checks at two desktop and two phone sizes, through every
chapter of the tour. `node tools/check.mjs --self-test` proves that each check fails on a
known-bad case.

```bash
node tools/record.mjs 1280x720
```

`record.mjs` records the whole tour to `out/` as WebM and MP4, with a contact sheet and the time
each chapter starts. `node tools/perf.mjs` (or `--low` for a weak phone) measures load time and
frame rate; results are in [docs/PERF.md](docs/PERF.md).

## Layout

| Path | What it is |
|---|---|
| `src/index.html` | The page as published to a Claude Artifact (no `<html>`/`<head>` wrapper) |
| `index.html` | Standalone page generated from `src/index.html` |
| `tools/build.py` | Builds `index.html`; `--check` fails if it is out of date |
| `tools/check.mjs`, `record.mjs`, `perf.mjs` | Browser checks, tour recording, performance measurement |
| `photos/` | 20 photographs named by the date they were taken, and the 1887 elevation drawing |
| `data/photos.json` | Author, licence, Commons page and measured height for each photograph |
| `data/registration.json` | Matrices that align each Féau print to the 31 March 1889 print |
| `data/geometry.json` | The tower profile measured on the 1887 elevation |
| `data/cameras.json` | Camera solved for the Durandelle photograph, and the one that was rejected |
| `data/research-timeline.json` | The sourced fact sheet the timeline was built from |
| `docs/METHOD.md` | How the geometry, heights, viewpoints and photo alignment were worked out |
| `docs/PERF.md` | Load time and frame rate, and what was done to keep them |

After editing `src/index.html`, rebuild the standalone page:

```bash
python tools/build.py
```

## Accuracy

- The outline (leg curve, arches, floor bands) is traced on the 1887 elevation; floors are at
  57.6, 115 and 276 m and the height is 300 m. The model's base is 116 m across, about 7 %
  narrower than the built tower's 125 m (see [METHOD](docs/METHOD.md#6-geometry-from-the-1887-elevation)).
  The lattice inside the outline is schematic, not the real member layout.
- Heights from March 1888 on are measured on Féau's prints, ±10 m. Earlier heights are
  estimates and are marked as such on the page.
- The Féau viewpoint is placed about 680 m from the tower and 100 m above its base. This comes
  from the map and the palace's height, not from a survey.
- With the camera there, the overlaid print matches the model to within 1–3 px at the four
  reference points. The Durandelle camera reprojects its eight floor points with 1.45 px rms.

## Sources and credits

- Timeline: [Google Arts & Culture](https://artsandculture.google.com/exhibit/AQIqOkVv),
  [toureiffel.paris](https://www.toureiffel.paris/en/the-monument/history),
  [Musée d'Orsay](https://www.musee-orsay.fr/),
  [Rare Historical Photos](https://rarehistoricalphotos.com/eiffel-tower-construction/).
  Each milestone on the page links its own sources.
- Photographs, all from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Eiffel_Tower_under_construction):
  - Théophile Féau: CC0, Paris Musées / Musée Carnavalet.
  - Hippolyte Blancard: CC0, Paris Musées.
  - Louis-Émile Durandelle: public domain.
  - Two photographs by unknown authors: public domain.

  The page and the original file for each photograph are listed in `data/photos.json`.
- Drawing: *Élévation générale de la tour de 300 mètres* (1887), Archives nationales (France),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), via
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:%C3%89l%C3%A9vation_g%C3%A9n%C3%A9rale_de_la_tour_de_300_m%C3%A8tres_1887.jpg).
  `photos/elevation-1887.jpg` is a reduced copy.

Built with Claude Code. Code and text: MIT, see [LICENSE](LICENSE). The photographs keep their
own public-domain or CC0 status; the drawing is CC BY 4.0 and needs the attribution above.
