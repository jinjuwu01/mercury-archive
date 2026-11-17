#!/usr/bin/env python3
"""Convert public CSV data to browser-ready JSON and JS.
Usage: python scripts/import_csv.py
"""
from pathlib import Path
import csv, json
root = Path(__file__).resolve().parents[1]
with (root / "data/records.csv").open(encoding="utf-8-sig", newline="") as fp:
    rows = list(csv.DictReader(fp))
ids = set()
for row in rows:
    if not row.get("id") or row["id"] in ids:
        raise ValueError("Missing or duplicate record id: " + str(row.get("id")))
    ids.add(row["id"])
    row["year"] = int(row["year"])
    row["tags"] = [v.strip() for v in row.get("tags", "").split(";") if v.strip()]
    paths = [v.strip() for v in (row.pop("image_paths", "") or "").split(";") if v.strip()]
    labels_zh = [v.strip() for v in (row.pop("image_labels_zh", "") or "").split(";")]
    labels_en = [v.strip() for v in (row.pop("image_labels_en", "") or "").split(";")]
    if paths and (len(paths) != len(labels_zh) or len(paths) != len(labels_en)):
        raise ValueError("Image labels must match the number of image paths: " + row["id"])
    if paths:
        row["images"] = [
            {"src": src, "label_zh": z, "label_en": e}
            for src, z, e in zip(paths, labels_zh, labels_en)
        ]
    row["scan_available"] = bool(paths)
    row["record_unit"] = "illustrated_source" if paths else "section_excerpt"
    row["review_level"] = row.get("review_level") or "not_facs_checked"
    if row.get("public_access") == "metadata_only_pending_rights":
        row["excerpt"] = ""
        row["notes"] = "原文转录的公开使用权限尚待核实，因此只提供书目、出处和研究概要。"
(root / "data/records.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(root / "data/records.js").write_text("window.MERCURY_RECORDS = " + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print(f"Generated {len(rows)} records.")
