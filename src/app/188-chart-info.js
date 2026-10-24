/* ===================== Model, data and assumptions behind each chart ===================== */
/* Each chart's "How to read this" ends with what produced it: the Method sections (open the Method tab there), the
   data sources (open the source) and the settings it depends on with their current values (open the setting).
   m: Method section ids without the "m-" prefix, d: SRC keys, a: setting ids. Filled in when the box is opened. */
const CI_SRC={pmms:'Freddie Mac mortgage rates',zillow:'Zillow home values and rents',cpi:'BLS consumer prices',ptaxUS:'Census property tax',ins:'Census ACS insurance costs',
  fc_spf:'Philadelphia Fed forecasts',damo:'Damodaran annual returns 1928–2025',shiller:'Shiller home prices',fhfa:'FHFA house price index',fredMort:'Freddie Mac rate history',
  fredCPI:'BLS CPI history',fredRent:'BLS rent CPI history',mTb:'Federal Reserve T-bill and bond yields',mSp:'Shiller monthly S&P 500',irs26:'IRS 2026 tax brackets',
  r_zori:'Zillow observed rent index',beracha:'published 30-year buy-vs-rent study',r_tenure:'Census mover rates',r_idio_vol:'own-home price risk studies',rz_forced_sales:'forced-sale discount study',acs:'Census ACS'};
const CI_BASE={m:['time-and-growth','equal-budgets'],d:['pmms','zillow','cpi','ptaxUS','ins','damo','shiller']};
const CI_HIST={m:['time-and-growth','refinancing','checked-against-a-published-study'],d:['damo','shiller','fhfa','fredMort','fredCPI','fredRent','mTb','mSp','beracha'],a:['P','dp','rent0','maint','ptax','sell','refiOn'],note:'Replays actual history; your growth and return settings are not used.'};
const CI_MC={m:['monte-carlo','moving-risk','home-price-volatility-scaling'],d:['damo','shiller','fhfa','fredCPI','fredRent','fredMort','r_idio_vol','rz_forced_sales'],a:['gh','gr','rs','inf','hz','stressMult','forcedDisc','idio']};
const CI_LOC={m:['counties','rent-estimated-from-the-home-price','time-and-growth'],d:['zillow','fhfa','acs','ptaxUS'],a:['dp','rate','gh','gr','rs']};
const CI_DATA={m:[],a:[],note:'Historical data only; no settings are used.'};
const CHART_INFO={
  nw:{...CI_BASE,m:['time-and-growth','buyer-s-net-worth','equal-budgets','investment-returns-taxes-and-leverage'],a:['P','dp','rate','rent0','gh','gr','inf','rs','maint','sell']},
  gap:{...CI_BASE,m:['where-the-gap-comes-from','equal-budgets'],a:['P','rent0','rate','gh','rs','inf']},
  flow:{m:['owner-s-monthly-cost','mortgage','federal-and-state-tax-saving'],d:['pmms','ptaxUS','ins','irs26'],a:['P','dp','rate','ptax','ins','maint','hoa','utilDiff','rent0','gr','taxOn']},
  unrec:{m:['owner-s-monthly-cost','renter-s-monthly-cost'],d:['pmms','ptaxUS','ins','zillow'],a:['rate','ptax','ins','maint','rs','rent0']},
  comp:{m:['mortgage','buyer-s-net-worth'],d:['pmms','zillow'],a:['P','dp','rate','gh','rs']},
  liq:{m:['equal-budgets','income-growth-and-affordability','extra-payments-pmi-removal-gains-tax-and-home-equity-line'],d:[],a:['income','incGrowth','debt','heloc','P','dp']},
  tor:{...CI_BASE,a:['gh','gr','rs','P','rent0','maint','rate','ptax','sell','dp','inf','rateLR']},
  heat:{m:['time-and-growth','investment-returns-taxes-and-leverage'],d:['zillow','pmms'],a:['gh','rs','ws','wb','fee']},
  ptr:{m:['time-and-growth'],d:['zillow'],a:['P','rent0','gh','gr']},
  opt:{m:['mortgage','loan-types-and-points','affordability'],d:['pmms'],a:['P','rate','rate15','term','pmi','gh','rs','income']},
  spag:CI_HIST,hheat:CI_HIST,hdet:CI_HIST,
  fan:CI_MC,prob:CI_MC,mchist:CI_MC,mcsc:CI_MC,
  mcrate:{m:['monte-carlo','refinancing'],d:['fredMort','pmms'],a:['rate','refiOn','refiTh','refiCost']},
  sbs:CI_LOC,loc:CI_LOC,locsc:CI_LOC,
  cmp:{m:['time-and-growth','planned-move'],d:['zillow','pmms'],a:[],note:'Uses the scenario values shown above the chart.'},
  scen:{m:['time-and-growth','planned-move'],d:['zillow','pmms'],a:['moveMode','moveYear','gh','rs']},
  cum:{...CI_DATA,d:['damo','shiller','fredCPI']},metro:{...CI_DATA,d:['fhfa','fredCPI']},roll:{...CI_DATA,d:['damo','shiller','fredCPI','fredRent']},
  corr:{...CI_DATA,d:['damo','shiller','fredCPI','fredRent','fredMort']},mort:{...CI_DATA,d:['fredMort','fredCPI']},zori:{...CI_DATA,d:['r_zori','fredRent']}};
/* a setting's current value with the unit from its label: "Home price ($)" → "$366,157", "Maintenance (% of value / yr)" → "1% of value / yr" */
function ciValue(id){const el=document.getElementById(id);if(!el)return null;const f=F.find(x=>x[1]===id),lab=f?f[2].replace(/&amp;/g,'&'):id,m=lab.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  const name=m?m[1]:lab,u=m?m[2]:'';let v;
  if(el.tagName==='SELECT')v=el.options[el.selectedIndex]?el.options[el.selectedIndex].text:el.value;
  else{const raw=unfmt(String(el.value));v=isFinite(parseFloat(raw))?Number(raw).toLocaleString('en-US',{maximumFractionDigits:2}):el.value;
    v=u==='$'?'$'+v:/^\$ \//.test(u)?'$'+v+' '+u.slice(2):/^%/.test(u)?v+u:u?v+' '+u:v}
  return [name,v]}
function ciHTML(k){const c=CHART_INFO[k];if(!c)return '';const sec=id=>{const d=document.getElementById('m-'+id);return d?d.querySelector('.mst').textContent:null};
  const model=c.m.filter(sec).map(id=>`<a href="#m-${id}" data-ci-sec="m-${id}">${sec(id)}</a>`).join(' · ');
  const data=c.d.filter(s=>SRC[s]).map(s=>`<a href="${SRC[s].u}" target="_blank" rel="noopener" title="${SRC[s].t.replace(/"/g,'&quot;')}">${CI_SRC[s]||SRC[s].t}</a>`).join(' · ');
  const asm=c.a.filter(id=>{const el=document.getElementById(id);return el&&!el.closest('.dep-off')}).map(id=>{const [n,v]=ciValue(id);return `<a href="#${id}" data-ci-set="${id}">${n}</a>: ${v}`}).join(' · ');
  return (model?`<div><b>Model:</b> ${model}</div>`:'')+(data?`<div><b>Data:</b> ${data}</div>`:'')+`<div><b>Assumptions:</b> ${asm||''}${c.note?(asm?' — ':'')+c.note:''}</div>`}
function refreshChartInfo(){document.querySelectorAll('details.how[open] dd.cinfo').forEach(dd=>dd.innerHTML=ciHTML(dd.dataset.c))}
/* open a setting in the assumptions panel (the bottom sheet on phones) and focus it */
function gotoSetting(id){const el=document.getElementById(id);if(!el)return;if(SET_MODE==='basic'&&!CORE.includes(id))setMode('all');const fab=document.getElementById('fab');
  if(fab&&getComputedStyle(fab).display!=='none'&&!fab.hidden)fab.click();
  const g=el.closest('details');if(g)g.open=true;setTimeout(()=>{el.scrollIntoView({behavior:'smooth',block:'center'});el.focus({preventScroll:true})},60)}
function gotoMethod(id){showTab('method');setTimeout(()=>{const d=document.getElementById(id);if(!d)return;d.hidden=false;d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})},120)}
function wireChartInfo(){
  document.querySelectorAll('.card .plot').forEach(p=>{const k=p.id.replace(/^p-/,'');if(!CHART_INFO[k])return;
    // a chart without a "How to read this" box gets one of its own, right below the chart and its takeaway
    let dl=p.closest('.card').querySelector('details.how dl.read');
    if(!dl||p.closest('.card').querySelectorAll('.plot').length>1){const after=p.nextElementSibling&&p.nextElementSibling.classList.contains('takeaway')?p.nextElementSibling:p;
      after.insertAdjacentHTML('afterend','<details class="how"><summary>Model, data and assumptions</summary><dl class="read"></dl></details>');dl=after.nextElementSibling.querySelector('dl.read')}
    if(dl.querySelector('dd.cinfo'))return;
    {const sm=dl.closest('details').querySelector('summary');if(sm.textContent==='How to read this')sm.textContent='How to read this · model, data & assumptions'}
    dl.insertAdjacentHTML('beforeend',`<dt>Model, data and assumptions</dt><dd class="cinfo" data-c="${k}"></dd>`);
    dl.closest('details').addEventListener('toggle',e=>{if(e.target.open){const dd=e.target.querySelector('dd.cinfo');dd.innerHTML=ciHTML(dd.dataset.c)}})});
  document.addEventListener('click',e=>{const a=e.target.closest('a[data-ci-set],a[data-ci-sec]');if(!a)return;e.preventDefault();ciRemember(a);
    if(a.dataset.ciSet)gotoSetting(a.dataset.ciSet);else gotoMethod(a.dataset.ciSec)});
  addEventListener('popstate',()=>{if(CI_BACK)ciGoBack()})}
/* After following a link from a chart's notes, a "Back to <chart>" button (and the browser's back button) returns to
   the tab and chart the link came from. */
let CI_BACK=null;
/* The button sits in the page rather than floating over it: under the tabs, or in the assumptions panel's header. */
function ciRemember(a){const card=a.closest('.card')||(TRACE_OPEN&&TRACE_OPEN.el&&TRACE_OPEN.el.closest('.card')),plot=card&&card.querySelector('.plot'),h=card&&card.querySelector('h2');
  CI_BACK={tab:CUR,y:scrollY,id:plot?plot.id:null,title:h?h.textContent.replace(/\?/g,'').trim():'the chart'};
  try{history.pushState({ciBack:1},'')}catch(e){}
  if(!document.querySelector('.ciback'))[['.stickyhead','beforeend'],['#closeSheet','beforebegin']].forEach(([sel,pos])=>{
    const b=document.createElement('button');b.type='button';b.className='ciback';if(pos==='beforeend')b.id='ciBack';document.querySelector(sel).insertAdjacentElement(pos,b);
    b.addEventListener('click',()=>{if(history.state&&history.state.ciBack)history.back();else ciGoBack()})});
  // a setting link opens the assumptions panel, so the button goes in its header; a Method link uses the one under the tabs
  document.querySelectorAll('.ciback').forEach(b=>{b.textContent='← Back to '+CI_BACK.title;b.hidden=(b.id==='ciBack')===!!a.dataset.ciSet})}
function ciGoBack(){const r=CI_BACK;if(!r)return;CI_BACK=null;document.querySelectorAll('.ciback').forEach(b=>b.hidden=true);
  const aside=document.getElementById('aside');if(aside.classList.contains('open'))document.getElementById('closeSheet').click();
  if(CUR!==r.tab)showTab(r.tab);setTimeout(()=>{const el=r.id&&document.getElementById(r.id);if(el)el.closest('.card').scrollIntoView({block:'start'});else scrollTo(0,r.y)},150)}
