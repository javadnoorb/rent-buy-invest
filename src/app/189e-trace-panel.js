/* ===================== "How this was computed" panel ===================== */
/* Clicking (or tapping) a point on a chart opens a side panel (a bottom sheet on phones) with the point's value as a
   tree: each line opens to its equation, the same equation with your numbers in it, a link to the Method section
   that explains it, and the parts it is made of. The bottom lines are settings (with where their value came from and
   a link to change it), data (with its source) and the model's fixed rules. Parts worth $0 are grouped at the end. */
let TRACE_OPEN=null;
function traceClick(el,e){const pt=e&&e.points&&e.points[0];if(!pt)return;const tr=el.data&&el.data[pt.curveNumber],f=tr&&tr.meta&&TRACE_RECIPES[tr.meta];if(!f)return;
  let r;try{r=f(pt,el)}catch(err){console.error('trace',err);return}if(r&&r.node)openTrace(r,el)}
function tracePanel(){let pn=document.getElementById('trp');if(pn)return pn;
  pn=document.createElement('section');pn.id='trp';pn.className='trp';pn.hidden=true;pn.setAttribute('role','dialog');pn.setAttribute('aria-labelledby','trpT');
  pn.innerHTML='<div class="trh"><div><h2 id="trpT">How this was computed</h2><div class="trsub" id="trpS"></div></div><button type="button" class="trx" aria-label="Close">×</button></div><div class="trb" id="trpB"></div>';
  document.body.appendChild(pn);pn.querySelector('.trx').onclick=closeTrace;
  pn.addEventListener('toggle',e=>{const d=e.target;if(d.tagName==='DETAILS'&&d.open&&d.dataset.n&&!d.dataset.f)fillTraceNode(d)},true);
  pn.addEventListener('click',e=>{const a=e.target.closest('a[data-ci-set],a[data-ci-sec]');if(a&&innerWidth<700)setTimeout(closeTrace,0)});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!pn.hidden)closeTrace()});return pn}
function closeTrace(){const pn=document.getElementById('trp');if(pn)pn.hidden=true;document.body.classList.remove('trace-open');if(TRACE_OPEN&&TRACE_OPEN.el)TRACE_OPEN.el.focus&&TRACE_OPEN.el.focus({preventScroll:true})}
function openTrace(r,el){const pn=tracePanel();TRACE_OPEN={el,nodes:[],r};
  const card=el&&el.closest('.card'),h=card&&card.querySelector('h2');
  document.getElementById('trpS').textContent=(h?h.textContent.replace(/\?/g,'').trim()+' · ':'')+r.title;
  const body=document.getElementById('trpB');body.innerHTML=traceNodeHTML(r.node,true)+(r.examples||[]).map(e=>`<h3 class="trex">${escapeHtml(e.label)}</h3>`+traceNodeHTML(e.node,true)).join('')+traceOptsHTML(r.T||traceBase())+'<p class="trfoot muted">Every line is computed from the lines inside it with the equation shown; the app checks this for every chart point in its tests.</p>';
  pn.hidden=false;document.body.classList.add('trace-open');const top=body.querySelector('details');if(top){top.open=true;fillTraceNode(top)}pn.querySelector('.trx').focus({preventScroll:true})}
const trUnit=(v,u)=>u==='opt'?String(v):fv(v,u);
function traceNodeHTML(nd,root){const id=TRACE_OPEN.nodes.push(nd)-1,val=`<span class="trv">${nd.leaf==='set'&&nd.u==='opt'?escapeHtml(nd.opt||''):trUnit(nd.v,nd.u)}</span>`,lab=`<span class="trl">${escapeHtml(nd.label)}</span>`;
  if(!nd.build)return `<div class="trn leaf${root?' root':''}"><div class="trrow">${lab}${val}</div><div class="tro">${traceLeafHTML(nd)}</div></div>`;
  return `<details class="trn${root?' root':''}" data-n="${id}"><summary class="trrow">${lab}${val}</summary><div class="trd"></div></details>`}
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
function fillTraceNode(d){const nd=TRACE_OPEN.nodes[+d.dataset.n];if(!nd)return;d.dataset.f=1;const b=nd.built||(nd.built=nd.build());
  const e=nd.eq&&EQ[nd.eq],sec=e&&document.getElementById('m-'+e.s),nums=traceNumbers(nd,b);
  const zero=b.kids.filter(k=>Math.abs(k.v)<1e-9&&k.u!=='opt'&&k.u!=='x'),live=b.kids.filter(k=>!zero.includes(k));
  d.querySelector('.trd').innerHTML=(e?`<div class="treq">\\(${e.t}\\)</div>`:'')+(nums?`<div class="trnum">= ${escapeHtml(nums)} = <b>${trUnit(nd.v,nd.u)}</b></div>`:'')+
    (nd.note?`<div class="trnote">${escapeHtml(nd.note)}</div>`:'')+(sec?`<div class="trm"><a href="#m-${e.s}" data-ci-sec="m-${e.s}">Method: ${escapeHtml(sec.querySelector('.mst').textContent)}</a></div>`:'')+
    `<div class="trk2">${live.map(k=>traceNodeHTML(k)).join('')}${zero.length?`<details class="trz"><summary>${zero.length} part${zero.length>1?'s':''} at zero</summary>${zero.map(k=>traceNodeHTML(k)).join('')}</details>`:''}</div>`;
  if(e)typeset(d.querySelector('.treq'))}
function traceOptsHTML(T){return `<details class="trn trop"><summary class="trrow"><span class="trl">Model options in effect</span></summary><div class="trd"><div class="trk2">${T.opts().map(o=>traceNodeHTML(o)).join('')}</div></div></details>`}
/* a short line under each chart that can be traced, saying so */
function traceHint(el){if(!el||el.dataset.trh||!el.data||!el.data.some(d=>d.meta&&TRACE_RECIPES[d.meta]))return;el.dataset.trh=1;el.classList.add('traceable');
  const after=el.nextElementSibling&&el.nextElementSibling.classList.contains('takeaway')?el.nextElementSibling:el;
  after.insertAdjacentHTML('afterend',`<p class="trhint">${TOUCH?'Tap':'Click'} a point to see how it was computed.</p>`)}
