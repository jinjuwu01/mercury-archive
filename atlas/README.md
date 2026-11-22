# Mercury across Empires — Digital Atlas / 水银跨帝国互动历史地图

**Version 0.2 · November 2026 · Jinju Wu**

Bilingual interactive historical atlas for the movement of cinnabar and mercury across Ming–Qing China and the trans-Pacific world, 1570–1910.

## Live site

https://jinjuwu01.github.io/mercury-archive/atlas/

## Features / 功能

- **同屏双语 / Parallel Chinese–English:** headings, navigation, story steps, place names, descriptions, source panels, data table and methods are displayed in Chinese and English without toggling.
- **真正互动地图 / Interactive map:** Leaflet map with OpenStreetMap basemap, mouse/touch pan and zoom, location popups, clickable routes, and global / Southwest China / Pacific map views.
- **动态路线 / Animated routes:** a moving mercury dot on a selected connection; story autoplay through five stops. The animated dot depicts a *schematic relationship*, not a historically verified vessel track.
- **历史时间轴 / Time explorer:** interactive slider, curated checkpoints and autoplay to reveal which recorded relationships fall within a given year.
- **证据等级 / Evidence confidence:** documented, contextual, hypothesis filtering.
- **下载 / Open data:** CSV and JSON export.
- **Independent JSON records** in `data/` for places, connections, events, sources, and narratives.

## Technical details

The site is static and can be hosted on GitHub Pages. `index.html` loads `style.css` and `app.js` plus JSON files in `data/`. Leaflet **v1.9.4** is loaded from jsDelivr; map tiles are loaded from OpenStreetMap. An internet connection is needed to load the map library, map tiles and cited references. No API key or backend is used.

### Run locally

```bash
cd atlas
python3 -m http.server 8000
```

Open `http://localhost:8000`. Opening index.html directly with a `file://` URL will not load the JSON data in most browsers.

### Add a historical record

Add or update objects in `data/places.json`, `data/connections.json`, `data/events.json`, and `data/sources.json` and run:

```bash
python3 scripts/validate_data.py
```

A connection uses `from`, `to`, `start`, `end`, `evidence` (`documented`, `contextual`, `hypothesis`), `kind`, `source_ids`, bilingual fields, and optional schematic `waypoints` of `[longitude, latitude]`. A source is cited by an ID that must exist in `sources.json`.

## Historiographical limitations / 史学上的局限

This is **not** a proven single shipment from Wanshan to the Americas. 1613 documented trans-Pacific mercury shipment evidence does **not** prove the place of extraction or the destination after landing. All map connections are schematic and should not be mistaken for actual nautical paths. Some connections are research hypotheses requiring further archival work. Documented labels refer to cited secondary scholarship in the initial MVP; the primary archival citations and quantities should be independently checked.

## Author / 开发者

Jinju Wu — [University of Illinois Urbana-Champaign](https://ealc.illinois.edu/directory/profile/jinjuwu2).

See `AI_WORKFLOW.md` for AI-supported but human-reviewed source extraction.
