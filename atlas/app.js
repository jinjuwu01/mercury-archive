/* Mercury across Empires · Atlas v0.3. Bilingual, evidence-aware, dynamic Leaflet map. */
'use strict';
const DATA_FILES = ['places','connections','sources','events','stories','records'];
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {year:1613,page:'atlas',storyId:'journey1613',step:0,direction:'all',selected:{kind:'connection',id:'r_manila_acapulco'},show:{documented:true,contextual:true,hypothesis:true},timelineTimer:null,storyTimer:null,animationFrame:null,animationStart:0,animationRouteId:null,activeView:'global',map:null,animMarker:null};
const colors={documented:'#b95346',contextual:'#bf8b48',hypothesis:'#829299'};
const directionLabels={outbound:['中国外输','From China'],inbound:['进入中国','To China'],transit:['中转或区域联系','Transshipment / other']};
const levelLabel={documented:['文献确证','Documented'],contextual:['间接支持','Contextual support'],hypothesis:['研究假设','Research hypothesis']};
const typeLabel={mine:['矿区','Mining center'],port:['港口','Port'],market:['市场','Market'],use:['技术使用','Technological use']};
const checkpoints=[1570,1572,1590,1613,1693,1704,1722,1750,1791,1800,1836,1850,1858,1875,1879,1899,1908,1910];
let db={},routeLayer,pointLayer,animationLayer,routeIndex={},markerIndex={};
function pair(obj,field){const cn=obj?.[`${field}_zh`]||'',en=obj?.[`${field}_en`]||'';return `<span lang="zh-Hans">${esc(cn)}</span><small lang="en">${esc(en)}</small>`}
function pairInline(obj,field){return `${esc(obj?.[`${field}_zh`]||'')} / ${esc(obj?.[`${field}_en`]||'')}`}
function getPlace(id){return db.places.find(p=>p.id===id)}
function getSource(id){return db.sources.find(s=>s.id===id)}
function getRoute(id){return db.connections.find(r=>r.id===id)}
function displayLon(lon){return lon < -55 ? lon + 360 : lon}
function latlng(p){return [p.lat,displayLon(p.lon)]}
function routeLatLngs(r){return [latlng(getPlace(r.from)),...(r.waypoints||[]).map(([lon,lat])=>[lat,displayLon(lon)]),latlng(getPlace(r.to))]}
function yearText(r){return r.start===r.end?String(r.start):`${r.start}–${r.end}`}
function currentStory(){return db.stories.find(s=>s.id===state.storyId)||db.stories[0]}
function activeRoutes(){return db.connections.filter(r=>r.start<=state.year&&r.end>=state.year&&state.show[r.evidence]&&(state.direction==='all'||r.direction===state.direction))}
function activePlaces(){return db.places.filter(p=>p.start<=state.year&&p.end>=state.year)}
function mapBounds(view){if(view==='china')return [[18,100],[35,123]];if(view==='pacific')return [[3,112],[46,285]];return [[-45,-25],[66,280]]}
function setView(view,animate=true){state.activeView=view;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));state.map.fitBounds(mapBounds(view),{padding:[18,18],animate,duration:.6})}
function initMap(){if(!window.L)throw Error('Leaflet failed to load. Please check your internet connection / Leaflet 地图库未加载，请检查网络。');
  state.map=L.map('map',{zoomControl:true,worldCopyJump:false,scrollWheelZoom:true,preferCanvas:false,minZoom:1,maxZoom:13,zoomSnap:.25,keyboard:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,minZoom:1,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'}).addTo(state.map);
  routeLayer=L.layerGroup().addTo(state.map);pointLayer=L.layerGroup().addTo(state.map);animationLayer=L.layerGroup().addTo(state.map);
  state.map.on('zoomend',()=>{const z=state.map.getZoom();document.querySelectorAll('.leaflet-tooltip.map-place-label').forEach(el=>el.style.display=(z>=3.25?'':'none'))});
  state.map.on('tileerror',()=>{const loading=$('map-loading');if(loading){loading.style.display='none'}});
  setView('global',false);
  $('map-loading').remove();
}
function renderMap(){if(!state.map)return;cancelAnimationFrame(state.animationFrame);state.animationFrame=null;state.animationRouteId=null;routeLayer.clearLayers();pointLayer.clearLayers();animationLayer.clearLayers();routeIndex={};markerIndex={};
  const active=activeRoutes(),activeIds=new Set();active.forEach(r=>{activeIds.add(r.from);activeIds.add(r.to)});
  // Schematic paths deliberately carry three visible source-confidence styles.
  for(const r of active){const selected=state.selected.kind==='connection'&&state.selected.id===r.id;const path=routeLatLngs(r);const line=L.polyline(path,{color:colors[r.evidence],weight:selected?5.5:3.5,opacity:selected?1:.78,dashArray:r.status==='failed'?'2 11':r.evidence==='documented'?null:r.evidence==='contextual'?'10 8':'3 9',lineJoin:'round',className:selected?'map-animated-line':''}).addTo(routeLayer);
    line.bindTooltip(pairInline(r,'name'),{sticky:true,direction:'top'});line.on('click',()=>selectRoute(r.id,true));line.on('mouseover',()=>line.setStyle({weight:selected?6.5:5.5,opacity:1}));line.on('mouseout',()=>line.setStyle({weight:selected?5.5:3.5,opacity:selected?1:.78}));routeIndex[r.id]=line;}
  for(const p of activePlaces()){
    const selected=state.selected.kind==='place'&&state.selected.id===p.id;const relevant=activeIds.has(p.id);
    const icon=L.divIcon({className:'',iconSize:[20,20],iconAnchor:[10,10],html:`<div class="point-pin ${esc(p.type)} ${selected?'active':''} ${relevant?'':'dim'}"></div>`});
    const m=L.marker(latlng(p),{icon,keyboard:true,riseOnHover:true,title:pairInline(p,'name')}).addTo(pointLayer);
    const html=`<div class="popup-place"><b>${esc(p.name_zh)}</b><small>${esc(p.name_en)}</small><p>${esc(p.description_zh)}</p><small>${esc(p.description_en)}</small></div>`;
    m.bindPopup(html,{maxWidth:290});if(relevant||selected){m.bindTooltip(`<span lang="zh-Hans">${esc(p.name_zh)}</span><small lang="en">${esc(p.name_en)}</small>`,{permanent:true,offset:[13,-5],direction:'right',className:'map-place-label',opacity:1})}m.on('click',()=>selectPlace(p.id,false));markerIndex[p.id]=m;
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
function setYear(y){state.year=Math.max(1570,Math.min(1910,Number(y)));$('year-range').value=String(state.year);$('year-label').textContent=String(state.year);$('year-context').textContent=state.year<1800?'中国水银外输 / China exports':state.year<1850?'贸易流向转变 / Trade shifts':'跨太平洋进口 / Pacific imports';document.querySelectorAll('[data-year]').forEach(b=>b.classList.toggle('active',Number(b.dataset.year)===state.year));renderMap();renderEvidence();}
function renderStory(){
  const story=currentStory();
  $('story-picker').value=story.id;
  $('story-subtitle').innerHTML=`${esc(story.subtitle_zh)}<span>${esc(story.subtitle_en)}</span>`;
  $('story-steps').innerHTML=story.steps.map((step,i)=>`<button type="button" class="story-step ${state.step===i?'current':''}" data-step="${i}" aria-current="${state.step===i?'step':'false'}"><span class="step-num">${String(i+1).padStart(2,'0')}</span><span>${pair(step,'title')}</span></button>`).join('');
  document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>selectStep(Number(b.dataset.step))));
  $('story-prev').disabled=state.step===0;
  $('story-next').disabled=state.step===story.steps.length-1;
}
function chooseStory(id){
  stopStory();
  state.storyId=id;
  state.direction='all';$('direction-filter').value='all';
  state.step=0;
  renderStory();
  selectStep(0);
}
function selectStep(i){
  const story=currentStory();
  state.step=Math.max(0,Math.min(story.steps.length-1,i));
  // Follow the selected historical episode, NOT a hard-coded 1613 timeline.
  if(state.year!==story.year)setYear(story.year);
  const step=story.steps[state.step];
  state.selected={kind:step.route_id?'connection':'place',id:step.route_id||step.place_id};
  renderStory();renderMap();renderEvidence();
  const p=getPlace(step.place_id);
  if(p)state.map.flyTo(latlng(p),Math.max(3.5,Math.min(6,state.map.getZoom())),{duration:.8});
  if(step.route_id&&routeIndex[step.route_id])startRouteAnimation(step.route_id);
}
function sourceList(ids){
  if(!ids?.length)return `<div class="caveat">尚未录入核实的个别运输文书。<small>No individual manifest entered.</small></div>`;
  return `<ul class="source-list">${ids.map(id=>{const source=getSource(id);if(!source)return '';
    const title=`${esc(source.short)}`;
    return `<li>${source.url?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${title} ↗</a>`:`<b>${title}</b>`}<small>${esc(source.citation)}</small></li>`;
  }).join('')}</ul>`;
}
function recordHtml(record){
  const amount=record.quantity!==null&&record.quantity!==undefined?`<span class="quantity-chip">${Number(record.quantity).toLocaleString('en-US')} ${esc(record.unit||'')}</span>`:'';
  const ship=record.ship?`<small>🚢 ${esc(record.ship)}</small>`:'';
  const value=record.value?`<small>${Number(record.value).toLocaleString('en-US')} ${esc(record.currency||'')}</small>`:'';
  const shippers=record.ship==='Belgic'&&record.shippers?`<details class="shipper-details"><summary>货主清单与数量差异 / Consignors and tally discrepancy</summary><div>${record.shippers.map(x=>`<div><span>${esc(x.name)}</span><span>${Number(x.flasks).toLocaleString('en-US')} flasks · $${Number(x.value_usd).toLocaleString('en-US')}</span></div>`).join('')}</div></details>`:'';
  const status=record.status==='failed'?'<span class="record-status failed">未抵达 / Lost at sea</span>':record.status==='aggregate'?'<span class="record-status">总量统计 / Aggregate</span>':record.status==='reported'?'<span class="record-status">报告数据 / Reported</span>':'';
  return `<div class="record-card"><span class="record-year">${record.year}</span><b>${pair(record,'title')}</b>${amount}${status}${ship}${value}<p>${pair(record,'note')}</p>${shippers}<small>📖 ${esc(record.locator||'')}</small></div>`;
}
function badge(level){return `<span class="tag ${esc(level)}">${esc(levelLabel[level]?.[0]||level)} / ${esc(levelLabel[level]?.[1]||'')}</span>`}
function renderEvidence(){
  const panel=$('evidence-panel'),item=state.selected.kind==='place'?getPlace(state.selected.id):getRoute(state.selected.id);
  if(!item){panel.innerHTML='<h2>请选择地点或路线 <small>Select a place or connection</small></h2>';return}
  const isPlace=state.selected.kind==='place',type=isPlace?typeLabel[item.type]:null;
  const storyStep=isPlace?currentStory().steps.find((st,i)=>i===state.step&&st.place_id===item.id):null;
  const events=isPlace?db.events.filter(e=>e.place_id===item.id&&e.year===state.year):[];
  const allRecords=isPlace?[]:db.records.filter(d=>d.route_id===item.id).sort((a,b)=>a.year-b.year);
  const yearRecords=allRecords.filter(d=>d.year===state.year);
  const chosenRecords=yearRecords.length?yearRecords:allRecords.slice(0,5);
  const hint=allRecords.length&&!yearRecords.length?'<div class="record-hint">本年份暂无单笔货运记录；以下为该联系的其他年份样本。<small>No record for the selected year; showing examples from other years.</small></div>':'';
  const status=item.status==='failed'?'<div class="failure-warning">⚠️ 航船失事，水银并未运抵美洲。<small>Vessel lost; no completed mercury delivery.</small></div>':'';
  const dir=isPlace?'':`<div class="direction-label">${directionLabels[item.direction]?.[0]||''}<small>${directionLabels[item.direction]?.[1]||''}</small></div>`;
  panel.innerHTML=`<div class="evidence-kicker">${isPlace?'PLACE / 地点':'TRADE CONNECTION / 贸易联系'}</div><h2>${pair(item,'name')}</h2>${isPlace?`<span class="tag contextual">${esc(type?.[0]||'地点')} / ${esc(type?.[1]||'Place')}</span>`:badge(item.evidence)}${dir}${status}<div class="evidence-desc">${pair(item,'description')}</div>${storyStep?`<div class="story-insight">${pair(storyStep,'text')}</div>`:''}${events.map(e=>`<div class="story-insight">${pair(e,'title')}<div>${pair(e,'text')}</div></div>`).join('')}${allRecords.length?`<div class="evidence-divider"></div><h3>贸易记录 <small>Historical records · ${allRecords.length}</small></h3>${hint}${chosenRecords.map(recordHtml).join('')}`:''}<div class="evidence-divider"></div><h3>参考文献 <small>Sources & references</small></h3>${sourceList(item.source_ids)}<div class="caveat">${isPlace?'地点坐标为现代近似位置。':'年代 / Years: '+yearText(item)}<small>${isPlace?'Approximate modern geolocation.':'The plotted line is schematic; it is not a reconstructed vessel track.'}</small></div>`;
}
function renderLedger(){
  const q=$('ledger-search').value.toLowerCase().trim(),filter=$('ledger-filter').value,direction=$('ledger-direction').value;
  const routes=db.connections.filter(r=>(filter==='all'||r.evidence===filter)&&(direction==='all'||r.direction===direction)&&[r.id,r.name_zh,r.name_en,r.description_zh,r.description_en,...r.source_ids].join(' ').toLowerCase().includes(q));
  $('routes-table').innerHTML=routes.length?routes.map(r=>`<tr><td><button type="button" data-route="${esc(r.id)}">${pair(r,'name')}</button><span class="table-id">${esc(r.id)}</span></td><td>${yearText(r)}</td><td>${badge(r.evidence)}<small>${esc(directionLabels[r.direction]?.[0]||'')} / ${esc(directionLabels[r.direction]?.[1]||'')}</small></td><td>${r.source_ids.map(sid=>esc(getSource(sid)?.short||sid)).join('; ')||'—'}</td></tr>`).join(''):'<tr><td colspan="4">没有符合条件的路线 / No matching connections</td></tr>';
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{const route=getRoute(b.dataset.route);setYear(route.start);state.direction='all';$('direction-filter').value='all';switchPage('atlas');selectRoute(route.id,true)}));
  const records=db.records.filter(d=>[d.title_zh,d.title_en,d.ship||'',d.locator||'',String(d.year),...d.source_ids].join(' ').toLowerCase().includes(q));
  $('records-table').innerHTML=records.map(d=>`<tr><td>${d.year}</td><td><button type="button" data-record="${esc(d.id)}">${pair(d,'title')}</button><small>${esc(d.ship||'')}</small></td><td>${d.quantity!=null?Number(d.quantity).toLocaleString('en-US')+' '+esc(d.unit||''):'—'}<small>${esc(d.locator)}</small></td><td>${d.status==='failed'?'未抵达 / Lost':d.status==='aggregate'?'总量 / Aggregate':d.status==='reported'?'报告 / Reported':'事件 / Event'}</td></tr>`).join('')||'<tr><td colspan="4">没有符合条件的记录 / No records</td></tr>';
  document.querySelectorAll('[data-record]').forEach(b=>b.addEventListener('click',()=>{const d=db.records.find(x=>x.id===b.dataset.record);state.direction='all';$('direction-filter').value='all';setYear(d.year);switchPage('atlas');selectRoute(d.route_id,true)}));
  $('bibliography').innerHTML=db.sources.map(source=>`<article class="bib-card"><b>${esc(source.short)}</b><p>${esc(source.citation)}</p><p>${esc(source.note_zh)}<span>${esc(source.note_en)}</span></p>${source.url?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">查看文献 / View source ↗</a>`:'<small>用户提供的 PDF · Supplied research PDF; bibliographic citation above</small>'}</article>`).join('');
}
function switchPage(page){state.page=page;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));location.hash=page;if(page==='atlas'){requestAnimationFrame(()=>{state.map.invalidateSize();renderMap()})}if(page==='ledger')renderLedger();window.scrollTo({top:0,behavior:'instant'})}
function stopTimeline(){clearInterval(state.timelineTimer);state.timelineTimer=null;$('play-time').textContent='▶';$('play-time').setAttribute('aria-label','播放时间轴 / Play timeline')}
function toggleTimeline(){if(state.timelineTimer){stopTimeline();return}stopStory();if(state.year>=1910)setYear(1570);$('play-time').textContent='Ⅱ';$('play-time').setAttribute('aria-label','暂停时间轴 / Pause timeline');let ix=checkpoints.findIndex(y=>y>state.year);if(ix<0)ix=0;state.timelineTimer=setInterval(()=>{if(ix>=checkpoints.length){stopTimeline();return}setYear(checkpoints[ix]);ix++},1100)}
function stopStory(){clearInterval(state.storyTimer);state.storyTimer=null;$('story-play').innerHTML='▶ 自动演示旅程 <small>Play guided journey</small>'}
function toggleStory(){if(state.storyTimer){stopStory();return}stopTimeline();selectStep(0);$('story-play').innerHTML='Ⅱ 暂停旅程 <small>Pause guided journey</small>';let step=1;state.storyTimer=setInterval(()=>{if(step>=currentStory().steps.length){stopStory();return}selectStep(step++);},3400)}
function download(name,mime,data){const blob=new Blob([data],{type:mime}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
function csvQuote(s){return '"'+String(s??'').replaceAll('"','""')+'"'}
function exportCsv(){const keys=['id','from','to','start','end','evidence','direction','status','kind','name_zh','name_en','description_zh','description_en','source_ids'];download('mercury-atlas-connections.csv','text/csv;charset=utf-8','\ufeff'+[keys.join(','),...db.connections.map(r=>keys.map(k=>csvQuote(k==='source_ids'?r.source_ids.join(';'):r[k])).join(','))].join('\r\n'))}
function exportRecordsCsv(){const keys=['id','year','route_id','title_zh','title_en','ship','quantity','unit','value','currency','status','locator','note_zh','note_en','source_ids'];download('mercury-atlas-shipment-records.csv','text/csv;charset=utf-8','\ufeff'+[keys.join(','),...db.records.map(r=>keys.map(k=>csvQuote(k==='source_ids'?r.source_ids.join(';'):r[k])).join(','))].join('\r\n'))}
function exportJson(){download('mercury-atlas-complete.json','application/json;charset=utf-8',JSON.stringify({metadata:{title:'Mercury across Empires',version:'0.3',description:'Historical connections are categorized as documented, contextual, hypothesis. Lines are schematic.'},...db},null,2))}
function bindEvents(){document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.page)));$('year-range').addEventListener('input',e=>{stopTimeline();setYear(e.target.value)});document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>{stopTimeline();setYear(b.dataset.year)}));$('play-time').addEventListener('click',toggleTimeline);$('story-play').addEventListener('click',toggleStory);$('story-prev').addEventListener('click',()=>{stopStory();selectStep(state.step-1)});$('story-next').addEventListener('click',()=>{stopStory();selectStep(state.step+1)});document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('story-picker').addEventListener('change',e=>chooseStory(e.target.value));
  $('direction-filter').addEventListener('change',e=>{state.direction=e.target.value;renderMap();renderEvidence()});
  $('reset-map').addEventListener('click',()=>setView('global'));
  for(const lev of Object.keys(state.show))$('show-'+lev).addEventListener('change',e=>{state.show[lev]=e.target.checked;renderMap()});
  $('ledger-search').addEventListener('input',renderLedger);$('ledger-filter').addEventListener('change',renderLedger);$('ledger-direction').addEventListener('change',renderLedger);$('export-csv').addEventListener('click',exportCsv);$('export-json').addEventListener('click',exportJson);$('export-records').addEventListener('click',exportRecordsCsv);
  window.addEventListener('hashchange',()=>{let page=location.hash.slice(1);if(['atlas','ledger','about'].includes(page)&&page!==state.page)switchPage(page)});
}
async function main(){try{const entries=await Promise.all(DATA_FILES.map(async name=>{const response=await fetch(`./data/${name}.json`);if(!response.ok)throw Error(`${name}.json — HTTP ${response.status}`);return [name,await response.json()]}));db=Object.fromEntries(entries);initMap();bindEvents();$('story-picker').innerHTML=db.stories.map(st=>`<option value="${esc(st.id)}">${esc(st.title_zh)} / ${esc(st.title_en)}</option>`).join('');renderStory();setYear(1613);renderLedger();const p=location.hash.slice(1);if(['atlas','ledger','about'].includes(p))switchPage(p);}catch(e){console.error(e);$('error').hidden=false;$('error').textContent='地图数据加载失败 / Could not load map: '+e.message+'。请刷新页面；若问题持续，请在 GitHub 报告。 / Reload the page or report the issue on GitHub.';if($('map-loading'))$('map-loading').textContent='地图暂时不可用 / Map unavailable';}}
main();
