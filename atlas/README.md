# v0.5：全时段网络可视化 / All-period network explorer

地图现在**默认展示所有 21 条跨年代研究联系**（而不是仅显示1613年）。读者可以切换“全部年代 / 前后20年 / 单一年份”，再利用双语路线列表、搜索框和流向与证据筛选查看不同交易。线的颜色代表贸易流向，实线/虚线/点线代表史料等级。具有相同起终点的不同年代记录在视觉上略微错开，以免完全覆盖；这是示意的可视化处理，**不意味着船舶使用不同航线，也不意味着所有时期的贸易同时发生**。

The default atlas now shows all 21 dated connections as a cumulative *overview*, not a single historical year. Switch to exact-year or ±20-year windows to avoid conflating periods. Colored strokes distinguish direction, line patterns distinguish evidentiary status. Overlapping records are spatially separated for legibility, not to reconstruct actual shipping itineraries.

---

# Mercury across Empires — Digital Atlas / 水银跨帝国互动历史地图

**Version 0.3 · November 2026 · Jinju Wu**

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


## 2026-11-21 expansion · 双向水银贸易 v0.3

现已增加至 **18 地点、21 条联系、20 条可核对的记录、4 条互动故事、9 条参考文献**。
新增史料来源：Elizabeth Sinn (2013, pp. 179–181), 游锦香 (2023, pp. 54–58), 刘自强与罗琦 (2024, pp. 22–30), Tristan Platt (2011, pp. 38–49), David J. St. Clair (1994/95, pp. 278–295)。研究材料是用户提供的 PDF，未上传全文。

### 重要校勘说明
- 英国东印度公司在广州购汞 ≠ 某批汞的确切贵州矿源。
- 1836 年英国向中国转口 3,280 Spanish quintals：统计目的地是**中国**，广州仅作近似锚点。
- 1856–1880 年对中国出口数量是来源报道的年统计；不能全部认作香港卸货量。
- 1875 年 *Belgic* 的 2,656 flasks 是单船数据，**不能**叠加到同年出口总数 16,856 之上。
- 1875 年 Belgic 号表 4.4 的七名货主数量之和为 **2,654** 瓶，原表总数却写 **2,656** 瓶；数据库保留原表总数、七名货主分项及该待核差异。
- 1693 年 Santo Cristo de Burgos 途中失火，图中路线刻意以断线显示，**未完成运输**。
- 历史运输图上的曲线是示意连线，不是复原航迹。
- 数据分别存储于 data/places.json, data/connections.json, data/records.json, data/events.json, data/stories.json, data/sources.json。

运行：`python3 -m http.server 8000`，打开 http://localhost:8000。数据校验：`python3 scripts/validate_data.py`。


## v0.5: 路线总览 / Visible story cards

四条导览故事现以始终可见的中文／英文卡片列在时间轴和地图之前，不再隐藏于下拉菜单。卡片包含年代、流向、关键节点、研究证据说明；点击任一卡片会选择该故事，更新历史年份与地图标记，并将地图滚动到可见位置。概览数据保存在 `data/stories.json` 的 `overview_*` 字段，可随史料校核继续更新。