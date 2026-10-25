/* ===================== "How this was computed" panel ===================== */
/* Clicking (or tapping) a point on a chart selects it: a bar under the chart names the point and offers "How was this
   computed?", so a click never hides the chart. The button opens a panel docked beside the page on wide screens (the
   charts shrink to fit) or a sheet over the lower half on phones, with the chart scrolled into view above it. While
   the panel is open, clicking another point updates it directly. The panel shows one card at a time (see
   renderTraceCard): a value, its equation with your numbers, the Method section and its parts, each part a card of
   its own down to settings (with where their value came from and a link to change it), data (with its source) and
   the model's fixed rules. Parts worth $0 are grouped at the end. */
let TRACE_OPEN=null;
/* with unified hover (all lines at one x) Plotly reports every line, in trace order: take the point nearest the click
   (among those ok() accepts), not the first one */
function nearestPoint(el,e,ok){const pts=((e&&e.points)||[]).filter(ok||(()=>true));
  if(pts.length<2||!e.event||e.event.clientY==null)return pts[0];const r=el.getBoundingClientRect(),cx=e.event.clientX-r.left,cy=e.event.clientY-r.top;
  const px=(ax,v)=>ax&&typeof ax.l2p==='function'&&typeof v==='number'?ax._offset+ax.l2p(v):null;
  let best=pts[0],bd=Infinity;pts.forEach(q=>{const x=px(q.xaxis,q.x),y=px(q.yaxis,q.y);if(y==null)return;const d=Math.hypot(x==null?0:x-cx,y-cy);if(d<bd){bd=d;best=q}});return best}
function traceClick(el,e){const p0=nearestPoint(el,e,q=>{const tr=el.data&&el.data[q.curveNumber];return tr&&tr.meta&&TRACE_RECIPES[tr.meta]});if(!p0)return;const tr=el.data&&el.data[p0.curveNumber],f=tr&&tr.meta&&TRACE_RECIPES[tr.meta];if(!f)return;
  const pt={curveNumber:p0.curveNumber,pointNumber:p0.pointNumber,pointNumbers:p0.pointNumbers,x:p0.x,y:p0.y,z:p0.z,customdata:p0.customdata};
  const pn=document.getElementById('trp');if(pn&&!pn.hidden){traceOpenPoint(el,pt);return}
  traceBar(el,pt)}
/* the bar under a chart for its selected point */
function traceBar(el,pt){let bar=el.parentNode.querySelector(`.trbar[data-for="${el.id}"]`);
  if(!bar){bar=document.createElement('div');bar.className='trbar';bar.dataset.for=el.id;bar.setAttribute('role','status');el.insertAdjacentElement('afterend',bar)}
  const d=el.data[pt.curveNumber],ax=el.layout&&el.layout.xaxis&&el.layout.xaxis.title,xt=ax&&typeof ax.text==='string'?ax.text.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim():'',nm=(d.name||'').replace(/<[^>]+>/g,'');
  const at=d.type==='heatmap'?`${xt||'x'} ${pt.x}, ${pt.y}`:pt.x!=null&&d.type!=='histogram'?`${xt?xt.split(',')[0]+' ':''}${pt.x}`:'';
  bar.innerHTML=`<span class="trsel">Selected: <b>${escapeHtml(nm||'this point')}</b>${at?' · '+escapeHtml(String(at)):''}</span><button type="button" class="trgo">How was this computed?</button><button type="button" class="trbx" aria-label="Clear the selection">×</button>`;
  bar.querySelector('.trgo').onclick=()=>traceOpenPoint(el,pt);bar.querySelector('.trbx').onclick=()=>bar.remove()}
function traceOpenPoint(el,pt){const d=el.data[pt.curveNumber],f=TRACE_RECIPES[d.meta];let r;try{r=f(pt,el)}catch(err){console.error('trace',err);return}if(r&&r.node){openTrace(r,el);const bar=el.parentNode.querySelector(`.trbar[data-for="${el.id}"]`);if(bar)bar.remove()}}
const traceDock=()=>innerWidth>=900;
function tracePanel(){let pn=document.getElementById('trp');if(pn)return pn;
  pn=document.createElement('section');pn.id='trp';pn.className='trp';pn.hidden=true;pn.setAttribute('role','dialog');pn.setAttribute('aria-labelledby','trpT');
  pn.innerHTML='<div class="trh"><div><h2 id="trpT">How this was computed</h2><div class="trsub" id="trpS"></div></div><div class="trbtns"><button type="button" class="trtall" aria-label="Taller panel" aria-pressed="false">↕</button><button type="button" class="trx" aria-label="Close">×</button></div></div><div class="trb" id="trpB"></div>';
  document.body.appendChild(pn);pn.querySelector('.trx').onclick=closeTrace;
  pn.querySelector('.trtall').onclick=e=>{const on=document.body.classList.toggle('trace-tall');e.currentTarget.setAttribute('aria-pressed',String(on))};
  pn.addEventListener('click',e=>{const a=e.target.closest('a[data-ci-set],a[data-ci-sec]');if(a&&innerWidth<700)setTimeout(closeTrace,0)});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!pn.hidden)closeTrace()});return pn}
// focus goes back to the chart the panel came from (charts with explainable points take focus, see traceKeys)
function closeTrace(){const pn=document.getElementById('trp'),was=pn&&!pn.hidden;if(pn)pn.hidden=true;document.body.classList.remove('trace-open','trace-dock','trace-tall');if(was)requestAnimationFrame(resizePlots);const el=TRACE_OPEN&&TRACE_OPEN.el;if(was&&el&&el.focus){if(el.tabIndex<0)el.tabIndex=-1;el.focus({preventScroll:true})}}
function openTrace(r,el){const pn=tracePanel();TRACE_OPEN={el,r,stack:[{node:r.node,sym:ownSym(r.node)}]};
  const card=el&&el.closest('.card'),h=card&&card.querySelector('h2');
  document.getElementById('trpS').textContent=(h?h.textContent.replace(/\?/g,'').trim()+' · ':'')+r.title;
  const was=!pn.hidden;pn.hidden=false;document.body.classList.add('trace-open');document.body.classList.toggle('trace-dock',traceDock());
  // phones: the sheet takes the space below the chart (a third to 60% of the screen), so the whole chart stays visible
  if(!traceDock()&&el){const sh=document.querySelector('.stickyhead'),top=sh?sh.getBoundingClientRect().bottom:0,h=Math.round(Math.min(innerHeight*0.6,Math.max(innerHeight/3,innerHeight-top-el.getBoundingClientRect().height-16)));
    document.documentElement.style.setProperty('--trh',h+'px')}
  renderTraceCard();
  // keep the chart in view: docked, the page narrows and the charts redraw to fit; on phones the chart moves above the sheet
  // (measured again after each scroll: the sticky header changes height as the page scrolls)
  const fit=n=>{if(!el)return;const r=el.getBoundingClientRect(),sh=document.querySelector('.stickyhead'),top2=sh?sh.getBoundingClientRect().bottom:0,
    bottom=traceDock()?innerHeight:innerHeight-pn.getBoundingClientRect().height;if((r.top<top2-2||r.bottom>bottom-1)&&Math.abs(r.top-top2-6)>3){scrollBy({top:r.top-top2-6,behavior:'instant'});if(n<3)requestAnimationFrame(()=>fit(n+1))}};
  requestAnimationFrame(()=>{if(!was&&traceDock())resizePlots();requestAnimationFrame(()=>fit(0))});
  if(!was)pn.querySelector('.trx').focus({preventScroll:true})}
const trUnit=(v,u)=>u==='opt'?String(v):fv(v,u);
const trVal=nd=>nd.leaf==='set'&&nd.u==='opt'?escapeHtml(nd.opt||''):trUnit(nd.v,nd.u);
const trSym=s=>s?`<span class="trsy">\\(${s}\\)</span>`:'';
/* a part's row symbol: its name in the parent's equation, with its own name too when they are different quantities by design */
function traceRowSym(nd,b,j){const r=symFor(nd,b,j),o=ownSym(b.kids[j]);return r&&o&&!symMatch(r,o)?`${r} = ${o}`:r}
const TR_KIND={set:'Setting',data:'Data',const:'Rule',note:'Why'};
/* One card at a time: the line being looked at (its symbol, name and value), its equation with your numbers, the
   Method section, then the parts it is made of. A part with parts of its own opens its own card (the breadcrumb goes
   back); a setting, data value or rule opens in place to show where it comes from. */
function renderTraceCard(){const T=TRACE_OPEN,cur=T.stack.at(-1),nd=cur.node,body=document.getElementById('trpB');
  const crumbs=T.stack.length>1?`<nav class="trbc" aria-label="Where you are">${T.stack.map((c,i)=>i<T.stack.length-1?`<button type="button" data-up="${i}"${i===T.stack.length-2?' class="trbc-last"':''}>${c.sym?trSym(c.sym):''}<span>${escapeHtml(c.node.label.replace(/ (after \d+ years?|at the start|in year \d+)/,''))}</span></button><span class="trbcs" aria-hidden="true">›</span>`:'').join('')}</nav>`:'';
  let html=crumbs+`<article class="trc" aria-live="polite"><header class="trct"><div class="trcl">${trSym(cur.sym)}<h3 tabindex="-1">${escapeHtml(nd.label)}</h3></div><div class="trcv">${trVal(nd)}</div></header>`;
  if(!nd.build){html+=`<div class="tro">${traceLeafHTML(nd)}</div></article>`;body.innerHTML=html;typeset(body);return}
  const b=nd.built||(nd.built=nd.build()),e=nd.eq&&EQ[nd.eq],sec=e&&document.getElementById('m-'+e.s),nums=traceNumbers(nd,b);
  // the equation in this part's own symbols, moved in time when the parent names it at another time (B_{t-1})
  const tf=x=>cur.shift?reIdx(x,cur.shift):x;let tex=e?tf(eqTexFor(nd)):'';
  if(e||nums)html+=`<div class="treqb">${tex?`<div class="treq">\\(${tex}\\)</div>`:''}${nums?`<div class="trnum"><span class="trnl">with your numbers</span>${escapeHtml(nums)} <b>= ${trUnit(nd.v,nd.u)}</b></div>`:''}</div>`;
  if(nd.note)html+=`<p class="trnote">${escapeHtml(nd.note)}</p>`;
  if(sec)html+=`<a class="trm" href="#m-${e.s}" data-ci-sec="m-${e.s}">Explained in Method: ${escapeHtml(sec.querySelector('.mst').textContent)} →</a>`;
  const ix=b.kids.map((k,j)=>j),isZero=k=>Math.abs(k.v)<1e-9&&k.u!=='opt'&&k.u!=='x',live=ix.filter(j=>!isZero(b.kids[j])),zero=ix.filter(j=>isZero(b.kids[j]));
  const op=j=>b.op==='sum'?(()=>{const s=b.sg[j],w=Math.abs(s);return (s<0?'−':j?'+':'')+(w!==1?(Number.isInteger(w)?w:w.toFixed(2))+'×':'')})():b.op==='prod'&&j?'×':'';
  const row=j=>{const k=b.kids[j],s=tf(traceRowSym(nd,b,j)),inner=`<span class="trsg">${op(j)}</span>${trSym(s)}<span class="trl">${escapeHtml(k.label)}${k.leaf?` <span class="trtag tr-${k.leaf}">${TR_KIND[k.leaf]}</span>`:''}${k.leaf==='set'&&k.over?' <span class="trtag tr-over">set for this point</span>':''}</span><span class="trv">${trVal(k)}</span>`;
    return k.build?`<li><button type="button" class="trrow" data-j="${j}">${inner}<span class="trch" aria-hidden="true">›</span></button></li>`:`<li><details class="trleaf"><summary class="trrow">${inner}<span class="trch" aria-hidden="true">⌄</span></summary><div class="tro">${traceLeafHTML(k)}</div></details></li>`};
  html+=`<h4 class="trph">Made of ${b.kids.length===1?'1 part':b.kids.length+' parts'}</h4><ul class="trparts">${live.map(row).join('')}</ul>`+
    (zero.length?`<details class="trz"><summary>${zero.length} part${zero.length>1?'s':''} at zero</summary><ul class="trparts">${zero.map(row).join('')}</ul></details>`:'')+'</article>';
  if(T.stack.length===1){const ex=T.r.examples||[];ex.forEach((x,i)=>{html+=`<h4 class="trph">Example</h4><ul class="trparts"><li><button type="button" class="trrow" data-ex="${i}"><span class="trsg"></span><span class="trl">${escapeHtml(x.label)}</span><span class="trv">${trVal(x.node)}</span><span class="trch" aria-hidden="true">›</span></button></li></ul>`});
    html+=`<details class="trz tropts"><summary>Model options in effect</summary><ul class="trparts">${(T.r.T||traceBase()).opts().map(o=>`<li><details class="trleaf"><summary class="trrow"><span class="trsg"></span><span class="trl">${escapeHtml(o.label)}</span><span class="trv">${trVal(o)}</span><span class="trch" aria-hidden="true">⌄</span></summary><div class="tro">${traceLeafHTML(o)}</div></details></li>`).join('')}</ul></details>`+
      '<p class="trfoot">Every value is computed from its parts with the equation shown; the app checks this for every chart point in its tests.</p>'}
  body.innerHTML=html;body.querySelectorAll('.trrow[data-j]').forEach(x=>x.onclick=()=>{const j=+x.dataset.j;const k=b.kids[j],role=tf(symFor(nd,b,j)),own=ownSym(k),m=symMatch(role,own);T.stack.push({node:k,sym:m||!own?role:`${role} = ${own}`,shift:m});traceGo()});
  body.querySelectorAll('.trrow[data-ex]').forEach(x=>x.onclick=()=>{const n2=T.r.examples[+x.dataset.ex].node;T.stack.push({node:n2,sym:ownSym(n2)});traceGo()});
  body.querySelectorAll('.trbc [data-up]').forEach(x=>x.onclick=()=>{T.stack.length=+x.dataset.up+1;traceGo()});typeset(body)}
function traceGo(){renderTraceCard();const body=document.getElementById('trpB');body.scrollTop=0;const h=body.querySelector('.trct h3');if(h)h.focus({preventScroll:true})}
function traceLeafHTML(nd){const src=k=>SRC[k]?`<a href="${SRC[k].u}" target="_blank" rel="noopener" title="${escapeHtml(SRC[k].t)}">${escapeHtml(SRC[k].t.split(/[:(]/)[0].trim())}</a>`:'';
  const setLinks=ids=>[...new Set([].concat(ids||[]))].filter(id=>F.some(f=>f[1]===id)).map(id=>`<a href="#${id}" data-ci-set="${id}">${escapeHtml(settingLabel(id))}</a>`).join(' · ');
  if(nd.leaf==='set'&&nd.over){const o=settingOrigin(nd.id);return `<b>set to ${trUnit(nd.v,nd.u)} for this point</b>${o?` · your setting: ${escapeHtml(String(o.value))}`:''} · <a href="#${nd.id}" data-ci-set="${nd.id}">open</a>`}
  if(nd.leaf==='set'){const o=settingOrigin(nd.id);return (o?originHTML(o):'')+` · <a href="#${nd.id}" data-ci-set="${nd.id}">change</a>`}
  const parts=[];if(nd.note)parts.push(escapeHtml(nd.note));if(nd.src&&nd.src.length)parts.push(nd.src.map(src).filter(Boolean).join(' · '));
  if(nd.sec&&document.getElementById('m-'+nd.sec))parts.push(`<a href="#m-${nd.sec}" data-ci-sec="m-${nd.sec}">Method</a>`);
  const sl2=setLinks(nd.pk);if(sl2)parts.push('settings: '+sl2);
  return `<span class="trk">${nd.leaf==='data'?'data':nd.leaf==='note'?'why':'model rule'}</span> `+parts.join(' · ')}
function traceNumbers(nd,b){const vals=b.kids.map(k=>k.v);
  if(b.op==='sum')return b.kids.map((k,j)=>{const s=b.sg[j],w=Math.abs(s),t=(w!==1?(Number.isInteger(w)?w:w.toFixed(3))+' × ':'')+trUnit(k.v,k.u);return (j===0?(s<0?'− ':''):(s<0?' − ':' + '))+t}).join('');
  if(b.op==='prod')return b.kids.map(k=>trUnit(k.v,k.u)).join(' × ');
  return b.show?b.show(vals,b.kids):''}
/* a short line under each chart that can be traced, saying so */
/* keyboard: a chart with explainable points takes focus; Enter selects a point (then Enter again explains it), Left and
   Right move along the series, Up and Down switch series. Lines, bars and scatters only; heat maps and histograms
   still need a pointer. */
function traceKeys(el){const ser=()=>(el.data||[]).map((d,c)=>({d,c})).filter(({d})=>d.meta&&TRACE_RECIPES[d.meta]&&d.type!=='heatmap'&&d.type!=='histogram'&&d.x&&d.x.length&&d.visible!==false);
  if(!ser().length)return;el.tabIndex=0;el.setAttribute('role','group');
  const card=el.closest('.card'),h=card&&card.querySelector('h2');el.setAttribute('aria-label',`${h?h.textContent.replace(/\?/g,'').trim()+': ':''}chart. Press Enter to pick a value to explain; arrow keys move between values.`);
  el.addEventListener('keydown',e=>{const S=ser();if(!S.length)return;let k=el._kp;const pick=(s,i)=>{const {d,c}=S[s],j=Math.max(0,Math.min(d.x.length-1,i));el._kp={s,i:j};
      traceBar(el,{curveNumber:c,pointNumber:j,x:d.x[j],y:d.y?d.y[j]:null,customdata:d.customdata?d.customdata[j]:undefined})};
    if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!k)return pick(0,S[0].d.x.length-1);const {d,c}=S[k.s]||S[0];traceOpenPoint(el,{curveNumber:c,pointNumber:k.i,x:d.x[k.i],y:d.y?d.y[k.i]:null,customdata:d.customdata?d.customdata[k.i]:undefined});return}
    if(!k)return;const mv={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[e.key];if(!mv)return;e.preventDefault();
    const s=(k.s+mv[0]+S.length)%S.length;pick(s,mv[0]?Math.min(k.i,S[s].d.x.length-1):k.i+mv[1])})}
function traceHint(el){if(!el||el.dataset.trh||!el.data||!el.data.some(d=>d.meta&&TRACE_RECIPES[d.meta]))return;el.dataset.trh=1;el.classList.add('traceable');traceKeys(el);
  const after=el.nextElementSibling&&el.nextElementSibling.classList.contains('takeaway')?el.nextElementSibling:el;
  after.insertAdjacentHTML('afterend',`<p class="trhint">${TOUCH?'Tap':'Click'} a point${el.tabIndex===0&&!TOUCH?' (or focus the chart and press Enter)':''}, then "How was this computed?" to see its equations and data.</p>`)}
