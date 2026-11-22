"""Optional offline basemap regeneration from public-domain Natural Earth lowres shapefile.
Usage: python scripts/build_basemap.py path/to/naturalearth_lowres.shp
The supplied prebuilt assets/land.svg means this step is NOT required to run the atlas.
"""
from pathlib import Path
import sys
import geopandas as gpd
from shapely.geometry import MultiPolygon, LineString
from shapely.ops import split

if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/build_basemap.py /path/to/naturalearth_lowres.shp')
areas=gpd.read_file(sys.argv[1]); W,H=1200,570
cut=LineString([(0,-90),(0,90)])
paths=[]
for geom in areas.geometry:
    if geom is None:continue
    for p0 in (geom.geoms if isinstance(geom,MultiPolygon) else [geom]):
        try:segments=list(split(p0,cut).geoms)
        except Exception:segments=[p0]
        for poly in segments:
            if poly.area < .06:continue
            shape=poly.simplify(.5,preserve_topology=True)
            west=poly.representative_point().x < 0
            coords=[]
            for lon,lat in shape.exterior.coords:
                wrapped_lon=lon+360 if lon<0 or (west and lon == 0) else lon
                coords.append((round(wrapped_lon/360*W,1),round((75-lat)/145*H,1)))
            if len(coords)<3:continue
            d='M'+' L'.join(f'{x},{y}' for x,y in coords)+' Z'
            paths.append(f'<path d="{d}"/>')
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 570">\n<g fill="#dbe7df" stroke="#becdc6" stroke-width=".6">\n'+'\n'.join(paths)+'\n</g></svg>'
(root:=Path(__file__).resolve().parents[1]/'assets'/'land.svg').write_text(svg)
print('Wrote',root,'with',len(paths),'polygons')
