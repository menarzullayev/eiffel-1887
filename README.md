# Eiffel Tower construction, 1887–1889

An interactive Three.js exhibit of how the Eiffel Tower was built, from the first foundation
digs on 26 January 1887 to the lifts entering service in May 1889. The page is in Uzbek.

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

Controls: drag to orbit, wheel to zoom, `Space` play/pause, `←` `→` milestones, `F` Féau viewpoint.

## Layout

| Path | What it is |
|---|---|
| `src/index.html` | The page as published to a Claude Artifact (no `<html>`/`<head>` wrapper) |
| `index.html` | Standalone page generated from `src/index.html` |
| `tools/build.py` | Builds `index.html`; `--check` fails if it is out of date |
| `photos/` | 20 photographs, named by the date they were taken |
| `data/photos.json` | Author, licence, Commons page and measured height for each photograph |
| `data/registration.json` | Matrices that align each Féau print to the 31 March 1889 print |
| `data/research-timeline.json` | The sourced fact sheet the timeline was built from |
| `docs/METHOD.md` | How the heights, the viewpoint and the photo alignment were worked out |

After editing `src/index.html`, rebuild the standalone page:

```bash
python tools/build.py
```

## Accuracy

- The model is schematic. The main dimensions are close to the real tower: 125 × 125 m base,
  25 m legs, floors at 57.6, 115 and 276 m, 300 m height. The lattice is not the real member
  layout.
- Heights from March 1888 on are measured on Féau's prints, ±10 m. Earlier heights are
  estimates and are marked as such on the page.
- The Féau viewpoint is placed about 680 m from the tower and 100 m above its base. This comes
  from the map and the palace's height, not from a survey.
- With the camera there, the overlaid print matches the model to within 1–3 px at the four
  reference points.

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

Built with Claude Code. Code and text: MIT, see [LICENSE](LICENSE). The photographs keep their
own public-domain or CC0 status.
