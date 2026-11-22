/* Mercury across Empires · Atlas v0.2. Bilingual, evidence-aware, dynamic Leaflet map. */
'use strict';
const DATA_FILES = ['places','connections','sources','events','stories'];
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {year:1613,page:'atlas',step:0,selected:{kind:'connection',id:'r_manila_acapulco'},show:{documented:true,contextual:true,hypothesis:true},timelineTimer:null,storyTimer:null,animationFrame:null,animationStart:0,animationRouteId:null,activeView:'global',map:null,animMarker:null};
const colors={documented:'#b95346',contextual:'#bf8b48',hypothesis:'#829299'};
const levelLabel={documented:['文献确证','Documented'],contextual:['间接支持','Contextual support'],hypothesis:['研究假设','Research hypothesis']};
const typeLabel={mine:['矿区','Mining center'],port:['港口','Port'],market:['市场','Market'],use:['技术使用','Technological use']};
const checkpoints=[1570,1571,1590,1600,1613,1720,1750,1800,1845,1850,1899,1908,1910];
let db={},routeLayer,pointLayer,animationLayer,routeIndex={},markerIndex={};
function pair(obj,field){const cn=obj?.[`${field}_zh`]||'',en=obj?.[`${field}_en`]||'';return `<span lang="zh-Hans">${esc(cn)}</span><small lang="en">${esc(en)}</small>`}
function pairInline(obj,field){return `${esc(obj?.[`${field}_zh`]||'')} / ${esc(obj?.[`${field}_en`]||'')}`}
function getPlace(id){return db.places.find(p=>p.id===id)}
function getSource(id){return db.sources.find(s=>s.id===id)}
function getRoute(id){return db.connections.find(r=>r.id===id)}
function displayLon(lon){return lon<0?lon+360:lon}
function latlng(p){return [p.lat,displayLon(p.lon)]}
function routeLatLngs(r){return [latlng(getPlace(r.from)),...(r.waypoints||[]).map(([lon,lat])=>[lat,displayLon(lon)]),latlng(getPlace(r.to))]}
function yearText(r){return r.start===r.end?String(r.start):`${r.start}–${r.end}`}
function currentStory(){return db.stories[0]}
function activeRoutes(){return db.connections.filter(r=>r.start<=state.year&&r.end>=state.year&&state.show[r.evidence])}
function activePlaces(){return db.places.filter(p=>p.start<=state.year&&p.end>=state.year)}
function mapBounds(view){if(view==='china')return [[18,100],[35,123]];if(view==='pacific')return [[3,112],[46,285]];return [[1,96],[54,285]]}
function setView(view,animate=true){state.activeView=view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));state.map.fitBounds(mapBounds(view),{padding:[18,18],animate,duration:.6})}
function initMap(){if(!window.L)throw Error('Leaflet failed to load. Please check your internet connection / Leaflet 地图库未加载，请检查网络。');
  state.map=L.map('map',{zoomControl:true,worldCopyJump:false,scrollWheelZoom:true,preferCanvas:false,minZoom:2,maxZoom:13,zoomSnap:.25,keyboard:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,minZoom:2,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'}).addTo(state.map);
  routeLayer=L.layerGroup().addTo(state.map);pointLayer=L.layerGroup().addTo(state.map);animationLayer=L.layerGroup().addTo(state.map);
  state.map.on('zoomend',()=>{const z=state.map.getZoom();document.querySelectorAll('.leaflet-tooltip.map-place-label').forEach(el=>el.style.display=(z>=3.25?'':'none'))});
  state.map.on('tileerror',()=>{const loading=$('map-loading');if(loading){loading.style.display='none'}});
  setView('global',false);
  $('map-loading').remove();
}
function renderMap(){if(!state.map)return;cancelAnimationFrame(state.animationFrame);state.animationFrame=null;state.animationRouteId=null;routeLayer.clearLayers();pointLayer.clearLayers();animationLayer.clearLayers();routeIndex={};markerIndex={};
  const active=activeRoutes(),activeIds=new Set();active.forEach(r=>{activeIds.add(r.from);activeIds.add(r.to)});
  // Schematic paths deliberately carry three visible source-confidence styles.
  for(const r of active){const selected=state.selected.kind==='connection'&&state.selected.id===r.id;const path=routeLatLngs(r);const line=L.polyline(path,{color:colors[r.evidence],weight:selected?5.5:3.5,opacity:selected?1:.78,dashArray:r.evidence==='documented'?null:r.evidence==='contextual'?'10 8':'3 9',lineJoin:'round',className:selected?'map-animated-line':''}).addTo(routeLayer);
    line.bindTooltip(pairInline(r,'name'),{sticky:true,direction:'top'});line.on('click',()=>selectRoute(r.id,true));line.on('mouseover',()=>line.setStyle({weight:selected?6.5:5.5,opacity:1}));line.on('mouseout',()=>line.setStyle({weight:selected?5.5:3.5,opacity:selected?1:.78}));routeIndex[r.id]=line;}
  for(const p of activePlaces()){
    const selected=state.selected.kind==='place'&&state.selected.id===p.id;const relevant=activeIds.has(p.id);
    const icon=L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],html:`<div class="point-pin ${esc(p.type)} ${selected?'active':''} ${relevant?'':'dim'}"></div>`});
    const m=L.marker(latlng(p),{icon,keyboard:true,riseOnHover:true,title:pairInline(p,'name')}).addTo(pointLayer);
    const html=`<div class="popup-place"><b>${esc(p.name_zh)}</b><small>${esc(p.name_en)}</small><p>${esc(p.description_zh)}</p><small>${esc(p.description_en)}</small></div>`;
    m.bindPopup(html,{maxWidth:290});m.bindTooltip(`<span lang="zh-Hans">${esc(p.name_zh)}</span><small lang="en">${esc(p.name_en)}</small>`,{permanent:true,offset:[13,-5],direction:'right',className:'map-place-label',opacity:1});m.on('click',()=>selectPlace(p.id,false));markerIndex[p.id]=m;
  }
  $('stat-routes').textContent=String(active.length);$('stat-places').textContent=String(activePlaces().length);
  if(state.selected.kind==='connection'&&routeIndex[state.selected.id])startRouteAnimation(state.selected.id);
}
function startRouteAnimation(routeId){const r=getRoute(routeId);if(!r||!routeIndex[routeId]||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  cancelAnimationFrame(state.animationFrame);animationLayer.clearLayers();const pts=routeLatLngs(r);const segments=[],cum=[0];for(let i=1;i<pts.length;i++){const dx=(displayLon(pts[i][1])-displayLon(pts[i-1][1]))*Math.cos((pts[i][0]+pts[i-1][0])*Math.PI/360),dy=pts[i][0]-pts[i-1][0];segments.push(Math.max(.01,Math.hypot(dx,dy)));cum.push(cum.at(-1)+segments.at(-1));}
  const total=cum.at(-1);state.animationRouteId=routeId;state.animMarker=L.circleMarker(pts[0],{radius:7,color:'#fff',weight:2,fillColor:'#b95346',fillOpacity:1,interactive:false,pane:'markerPane'}).addTo(animationLayer);state.animationStart=performance.now();
  function tick(ts){if(state.animationRouteId!==routeId||!routeIndex[routeId])return;const t=((ts-state.animationStart)%6000)/6000;if(t>=.88){state.animMarker.setStyle({opacity:0,fillOpacity:0});}else{const distance=total*(t/.88),idx=Math.min(segments.length-1,cum.findIndex((x,i)=>i>0&&x>=distance)-1<0?segments.length-1:cum.findIndex((x,i)=>i>0&&x>=distance)-1);const fraction=Math.max(0,Math.min(1,(distance-cum[idx])/segments[idx]));const a=pts[idx],b=pts[idx+1];state.animMarker.setLatLng([a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction]);state.animMarker.setStyle({opacity:1,fillOpacity:1});}state.animationFrame=requestAnimationFrame(tick)}
  state.animationFrame=requestAnimationFrame(tick);
}
function selectRoute(id,focus){state.selected={kind:'connection',id};renderMap();renderEvidence();if(focus&&routeIndex[id])state.map.fitBounds(routeIndex[id].getBounds(),{padding:[60,60],maxZoom:6,animate:true,duration:.5})}
function selectPlace(id,focus){state.selected={kind:'place',id};renderMap();renderEvidence();if(focus&&markerIndex[id])state.map.flyTo(latlng(getPlace(id)),Math.max(state.map.getZoom(),5),{duration:.8})}
function setYear(y){state.year=Math.max(1570,Math.min(1910,Number(y)));$('year-range').value=String(state.year);$('year-label').textContent=String(state.year);document.querySelectorAll('[data-year]').forEach(b=>b.classList.toggle('active',Number(b.dataset.year)===state.year));renderMap();renderEvidence();}
function renderStory(){const story=currentStory();$('story-steps').innerHTML=story.steps.map((s,i)=>`<button type="button" class="story-step ${state.step===i?'current':''}" data-step="${i}" role="listitem" aria-current="${state.step===i?'step':'false'}"><span class="step-num">${String(i+1).padStart(2,'0')}</span><span>${pair(s,'title')}</span></button>`).join('');document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>selectStep(Number(b.dataset.step))));$('story-prev').disabled=state.step===0;$('story-next').disabled=state.step===story.steps.length-1}
function selectStep(i){state.step=Math.max(0,Math.min(currentStory().steps.length-1,i));if(state.year!==1613)setYear(1613);const s=currentStory().steps[state.step];state.selected={kind:'place',id:s.place_id};renderStory();renderMap();renderEvidence();const p=getPlace(s.place_id);if(p)state.map.flyTo(latlng(p),s.place_id==='wanshan'?6:5,{duration:1.0});if(s.route_id&&routeIndex[s.route_id])startRouteAnimation(s.route_id)}
function sourceList(ids){if(!ids?.length)return `<div class="caveat">尚未录入核实的个别运输文书。<small>No verified shipment manifest has yet been entered.</small></div>`;return `<ul class="source-list">${ids.map(id=>{const s=getSource(id);if(!s)return '';return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.short)} ↗</a><small>${esc(s.source_type||'Source')}</small></li>`}).join('')}</ul>`}
function badge(level){return `<span class="tag ${esc(level)}">${esc(levelLabel[level]?.[0]||level)} / ${esc(levelLabel[level]?.[1]||'')}</span>`}
function renderEvidence(){const panel=$('evidence-panel'),item=state.selected.kind==='place'?getPlace(state.selected.id):getRoute(state.selected.id);if(!item){panel.innerHTML='<h2>请选择地点或路线 <small>Select a place or connection</small></h2>';return}const isPlace=state.selected.kind==='place';const type=isPlace?typeLabel[item.type]:null;const story=isPlace?currentStory().steps.find((s,i)=>i===state.step&&s.place_id===item.id):null;
  const events=isPlace?db.events.filter(e=>e.place_id===item.id&&e.year===state.year):[];
  panel.innerHTML=`<div class="evidence-kicker">${isPlace?'PLACE / 地点':'TRADE CONNECTION / 贸易联系'}</div><h2>${pair(item,'name')}</h2>${isPlace?`<span class="tag contextual">${esc(type?.[0]||'地点')} / ${esc(type?.[1]||'Place')}</span>`:badge(item.evidence)}<div class="evidence-desc">${pair(item,'description')}</div>${story?`<div class="story-insight">${pair(story,'text')}</div>`:''}${events.map(e=>`<div class="story-insight">${pair(e,'title')}<div>${pair(e,'text')}</div></div>`).join('')}<div class="evidence-divider"></div><h3>参考文献 <small>Sources & references</small></h3>${sourceList(item.source_ids)}<div class="caveat">${isPlace?'地点坐标为现代近似位置。':'日期 / Date: '+yearText(item)}<small>${isPlace?'Approximate modern geolocation.':'Lines are schematic connections, not verified individual vessel tracks.'}</small></div>`;
}
function renderLedger(){const q=$('ledger-search').value.toLowerCase().trim(),filter=$('ledger-filter').value;const rows=db.connections.filter(r=>(filter==='all'||r.evidence===filter)&&[r.id,r.name_zh,r.name_en,r.description_zh,r.description_en,...r.source_ids].join(' ').toLowerCase().includes(q));
  $('routes-table').innerHTML=rows.length?rows.map(r=>`<tr><td><button type="button" data-route="${esc(r.id)}">${pair(r,'name')}</button><span class="table-id">${esc(r.id)}</span></td><td>${yearText(r)}</td><td>${badge(r.evidence)}</td><td>${r.source_ids.map(sid=>esc(getSource(sid)?.short||sid)).join('; ')||'—'}</td></tr>`).join(''):'<tr><td colspan="4">没有符合条件的路线 / No matching connections</td></tr>';
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{const r=getRoute(b.dataset.route);setYear(r.start);switchPage('atlas');selectRoute(r.id,true)}));
  $('bibliography').innerHTML=db.sources.map(s=>`<article class="bib-card"><b>${esc(s.short)}</b><p>${esc(s.citation)}</p><p>${esc(s.note_zh)}<span>${esc(s.note_en)}</span></p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">查看文献 / View source ↗</a></article>`).join('');
}
function switchPage(page){state.page=page;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));location.hash=page;if(page==='atlas'){requestAnimationFrame(()=>{state.map.invalidateSize();renderMap()})}if(page==='ledger')renderLedger();window.scrollTo({top:0,behavior:'instant'})}
function stopTimeline(){clearInterval(state.timelineTimer);state.timelineTimer=null;$('play-time').textContent='▶';$('play-time').setAttribute('aria-label','播放时间轴 / Play timeline')}
function toggleTimeline(){if(state.timelineTimer){stopTimeline();return}stopStory();if(state.year>=1910)setYear(1570);$('play-time').textContent='Ⅱ';$('play-time').setAttribute('aria-label','暂停时间轴 / Pause timeline');let ix=checkpoints.findIndex(y=>y>state.year);if(ix<0)ix=0;state.timelineTimer=setInterval(()=>{if(ix>=checkpoints.length){stopTimeline();return}setYear(checkpoints[ix]);ix++},1100)}
function stopStory(){clearInterval(state.storyTimer);state.storyTimer=null;$('story-play').innerHTML='▶ 自动演示旅程 <small>Play guided journey</small>'}
function toggleStory(){if(state.storyTimer){stopStory();return}stopTimeline();selectStep(0);$('story-play').innerHTML='Ⅱ 暂停旅程 <small>Pause guided journey</small>';let step=1;state.storyTimer=setInterval(()=>{if(step>=currentStory().steps.length){stopStory();return}selectStep(step++);},3400)}
function download(name,mime,data){const blob=new Blob([data],{type:mime}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
function csvQuote(s){return '"'+String(s??'').replaceAll('"','""')+'"'}
function exportCsv(){const keys=['id','from','to','start','end','evidence','kind','name_zh','name_en','description_zh','description_en','source_ids'];download('mercury-atlas-connections.csv','text/csv;charset=utf-8','\ufeff'+[keys.join(','),...db.connections.map(r=>keys.map(k=>csvQuote(k==='source_ids'?r.source_ids.join(';'):r[k])).join(','))].join('\r\n'))}
function exportJson(){download('mercury-atlas-complete.json','application/json;charset=utf-8',JSON.stringify({metadata:{title:'Mercury across Empires',version:'0.2',description:'Historical connections are categorized as documented, contextual, hypothesis. Lines are schematic.'},...db},null,2))}
function bindEvents(){document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.page)));$('year-range').addEventListener('input',e=>{stopTimeline();setYear(e.target.value)});document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>{stopTimeline();setYear(b.dataset.year)}));$('play-time').addEventListener('click',toggleTimeline);$('story-play').addEventListener('click',toggleStory);$('story-prev').addEventListener('click',()=>{stopStory();selectStep(state.step-1)});$('story-next').addEventListener('click',()=>{stopStory();selectStep(state.step+1)});document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('reset-map').addEventListener('click',()=>setView('global'));
  for(const lev of Object.keys(state.show))$('show-'+lev).addEventListener('change',e=>{state.show[lev]=e.target.checked;renderMap()});
  $('ledger-search').addEventListener('input',renderLedger);$('ledger-filter').addEventListener('change',renderLedger);$('export-csv').addEventListener('click',exportCsv);$('export-json').addEventListener('click',exportJson);
  window.addEventListener('hashchange',()=>{let page=location.hash.slice(1);if(['atlas','ledger','about'].includes(page)&&page!==state.page)switchPage(page)});
}
async function main(){try{const entries=await Promise.all(DATA_FILES.map(async name=>{const response=await fetch(`./data/${name}.json`);if(!response.ok)throw Error(`${name}.json — HTTP ${response.status}`);return [name,await response.json()]}));db=Object.fromEntries(entries);initMap();bindEvents();renderStory();setYear(1613);renderLedger();const p=location.hash.slice(1);if(['atlas','ledger','about'].includes(p))switchPage(p);}catch(e){console.error(e);$('error').hidden=false;$('error').textContent='地图数据加载失败 / Could not load map: '+e.message+'。请刷新页面；若问题持续，请在 GitHub 报告。 / Reload the page or report the issue on GitHub.';if($('map-loading'))$('map-loading').textContent='地图暂时不可用 / Map unavailable';}}
main();
