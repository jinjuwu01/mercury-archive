from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
data = {name: json.loads((root/'data'/f'{name}.json').read_text(encoding='utf-8')) for name in ['places','connections','sources','events','stories','records']}
issues = []
ids = {k:{r['id'] for r in v} for k,v in data.items()}
for k, v in data.items():
    if len(ids[k])!=len(v): issues.append(f'Duplicate IDs in {k}')
for p in data['places']:
    if not (-90 <= p['lat'] <= 90 and -180<=p['lon']<=180): issues.append(f'Coordinates out of range: {p["id"]}')
for relation in data['connections']:
    if not relation.get('name_zh') or not relation.get('name_en'):issues.append(f'Missing bilingual route title: {relation["id"]}')
    if relation['from'] not in ids['places'] or relation['to'] not in ids['places']: issues.append(f'Broken place link: {relation["id"]}')
    if relation['start'] > relation['end']: issues.append(f'Inverted dates: {relation["id"]}')
    if relation.get('direction') not in ['outbound','inbound','transit']:issues.append(f'Invalid direction: {relation["id"]}')
    if relation['evidence'] not in ['documented','contextual','hypothesis']: issues.append(f'Invalid evidence: {relation["id"]}')
    if relation['evidence'] == 'documented' and not relation['source_ids']:issues.append(f'Documented link lacks sources: {relation["id"]}')
    for lon,lat in relation.get('waypoints',[]):
        if not (-180<=lon<=180 and -90<=lat<=90):issues.append(f'Invalid waypoint: {relation["id"]}')
for item_type in ['places','connections','events']:
    for r in data[item_type]:
        for id in r.get('source_ids',[]):
            if id not in ids['sources']:issues.append(f'Unknown source ID: {item_type}.{r["id"]}: {id}')
for event in data['events']:
    if event['place_id'] not in ids['places']: issues.append(f'Unknown event place: {event["id"]}')
for rec in data['records']:
    if rec['route_id'] not in ids['connections']:issues.append(f'Broken record route: {rec["id"]}')
    if rec['quantity'] is not None and rec['quantity'] < 0:issues.append(f'Negative shipment amount: {rec["id"]}')
    for src in rec['source_ids']:
        if src not in ids['sources']:issues.append(f'Unknown record source: {rec["id"]} {src}')
for story in data['stories']:
    if not story.get('overview_route_zh') or not story.get('overview_route_en'):issues.append(f'Missing bilingual story preview: {story["id"]}')
    for step in story['steps']:
        if step['route_id'] and not (next((r['start'] <= story['year'] <= r['end'] for r in data['connections'] if r['id']==step['route_id']),False)):issues.append(f'Story step route not active at year {story["id"]} / {step["route_id"]}')
        if step['place_id'] not in ids['places']:issues.append(f'Unknown story place {step["place_id"]}')
        if step['route_id'] and step['route_id'] not in ids['connections']:issues.append(f'Unknown story route {step["route_id"]}')
if issues:
    print('\n'.join('ERROR '+i for i in issues))
    raise SystemExit(1)
print(f'PASS: {len(data["places"])} places, {len(data["connections"])} connections, {len(data["events"])} events, {len(data["sources"])} sources, {len(data["stories"])} stories, {len(data["records"])} records')
