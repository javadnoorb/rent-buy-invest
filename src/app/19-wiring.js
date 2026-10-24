/* ===================== Wiring ===================== */
const RENDER={proj:renderProj,sens:renderSens,opt:renderOpt,hist:renderHist,mc:()=>{renderMC();typeset(document.getElementById('tab-mc'))},loc:renderLoc,scen:renderScen,data:renderData,method:()=>typeset(document.getElementById('tab-method'))};
function showTab(k){CUR=k;{const ub=document.getElementById('undoBar');if(ub)ub.hidden=true}document.querySelectorAll('.tabs button').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===k));b.tabIndex=b.dataset.tab===k?0:-1});
  Object.keys(RENDER).forEach(t=>document.getElementById('tab-'+t).hidden=t!==k);try{localStorage.setItem('rbi-tab',k)}catch(e){}
  const ab=document.querySelector(`.tabs button[data-tab="${k}"]`),tb=ab&&ab.parentElement;if(tb&&tb.scrollTo)tb.scrollTo({left:ab.offsetLeft-(tb.clientWidth-ab.offsetWidth)/2,behavior:'smooth'});
  requestAnimationFrame(()=>RENDER[k]())}
function tabFade(){const t=document.querySelector('.tabs');if(!t)return;t.classList.toggle('more-l',t.scrollLeft>4);t.classList.toggle('more-r',t.scrollLeft+t.clientWidth<t.scrollWidth-4)}
const QUICK=['P','rent0','dp','rate'];
function syncQuick(){QUICK.forEach(k=>{const q=document.getElementById('q-'+k),m=document.getElementById(k);if(document.activeElement!==q){q.value=unfmt(m.value);if(q.dataset.money!=null)fmtMoneyEl(q)}})}
function persist(){try{localStorage.setItem('rbi-inputs',JSON.stringify(Object.assign(getRaw(),{REAL,v:SAVE_V})));document.getElementById('saved').textContent='saved on this device'}catch(e){}}
/* Brings a saved setup or shared link from an older version up to date (version v; links made before links carried
   a version count as 7). Untouched old defaults are dropped so the new defaults apply; edited values are kept. */
const SAVE_V=8;
function migrateSave(o){
  // saves before v6 hold the old defaults for renter's insurance ($0) and the chance of moving (5.6%, Redfin): use the new ones
  if(o.v<6){if(+o.rins===0)delete o.rins;if(+o.hz===5.6)delete o.hz}
  // saves before v7: PMI was 0.5% at any down payment, and only California metros had an assessment cap; an untouched
  // value takes the new default (the location's state cap is applied once the location is known)
  if(o.v<7){if(+o.pmi===0.5)delete o.pmi;const old=['los-angeles','san-diego','san-francisco'].includes(o.metro)?2:0;
    if(o.ptaxCap==null||+o.ptaxCap===old){delete o.ptaxCap;delete o.ptaxCapCPI;CAP_FROM_LOC=true}
    // state income tax: an untouched default ($8,000, 0%, no deduction) becomes "from the location's state"; edited figures stay manual
    if(o.stMode==null)o.stMode=(o.stTax==null||+unfmt(String(o.stTax))===8000)&&(o.stRate==null||+o.stRate===0)&&(o.stDed==null||+o.stDed===0)?'auto':'manual'}
  // saves before v8: property tax was the all-owner Census rate with no homestead exemption; an untouched rate becomes the
  // new-buyer rate before the exemption, with the location's exemption and credit
  if(o.v<8&&o.hsEx==null){TAX_FROM_LOC={ptax:o.ptax,floodIns:o.floodIns};delete o.ptax;if(!(+o.floodIns>0))delete o.floodIns}
  return o}
function applySaved(o){migrateSave(o);
  setRaw(o,o.v===4);if(o.REAL===false)REAL=false;const m=METROS.find(x=>x.slug===o.metro);if(m){showMetroPreset(m);updateMetroHints(m);applyStateCap(m)}}
function restore(){try{const o=JSON.parse(localStorage.getItem('rbi-inputs')||'null');if(!o||![4,5,6,7,8].includes(o.v))return;applySaved(o)}catch(e){console.warn('could not restore saved settings',e)}}
/* empty or out-of-range numbers are outlined, marked invalid for screen readers and explained on hover; the model
   uses the default or the nearest allowed value meanwhile */
function validate(){document.querySelectorAll('aside input[type=number],aside input[data-money],.q input[data-money],.q input[type=number]').forEach(el=>{
  const id=el.id.replace(/^q-/,''),v=unfmt(el.value),x=parseFloat(v),r=RANGE[id],bad=v===''||!isFinite(x)||!inRange(id,x);
  el.classList.toggle('bad',bad);if(bad)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');
  el.title=bad?(v===''||!isFinite(x)?'Enter a number':`Allowed: ${r[0].toLocaleString('en-US')} to ${r[1].toLocaleString('en-US')}`):''})}
let timer=null;
function syncLoanFields(){syncDeps()}
let LAST_KEY='';
function update(){clearTimeout(timer);timer=setTimeout(()=>{VOLADJ=document.getElementById('volAdj').value!=='0';applyTT();applyRentMode();syncLoanFields();formatMoneyAll();markChanged();const raw=getRaw(),key=JSON.stringify(raw)+REAL;if(key===LAST_KEY&&P)return;LAST_KEY=key;if(LAST_RAW)noteBulkChange(LAST_RAW,raw);LAST_RAW=raw;validate();syncQuick();persist();P=readP();
  {const muEl=document.getElementById('mu');const auto=P.muMode==='auto';muEl.disabled=auto;if(auto)muEl.value=Math.round(P.mu*100);
   const lgEl=document.getElementById('ltcg'),lgAuto=P.ltcgMode==='auto';lgEl.disabled=lgAuto;if(lgAuto)lgEl.value=Math.round(P.ltcg*100);
   const sa=P.stAutoOn;['stTax','stRate','stDed'].forEach(id=>document.getElementById(id).disabled=sa);
   if(sa){const e=document.getElementById('stTax');e.value=P.stTax;fmtMoneyEl(e);document.getElementById('stRate').value=+(P.stRate*100).toFixed(2);document.getElementById('stDed').value=P.stDed?'1':'0'}
   stateTaxHint();
   {const h=document.getElementById('fico').closest('.f').querySelector('.hint'),c=creditAdj(P),L=CREDIT&&CREDIT.llpa;if(h&&L)h.innerHTML=P.loanType==='fha'?'FHA pricing does not depend on these adjustments':
     `rate ${c.rate>=0?'+':'−'}${Math.abs(c.rate*100).toFixed(2)} pts vs the survey borrower (Fannie Mae price adjustments ${linkTo(L.source_url)}, at your points-to-rate setting)${P.dp<0.2?`; PMI × ${c.pmi.toFixed(2)} ${linkTo(CREDIT.pmi.source_url)}`:''}. First-time buyers with income at or below the area median pay no adjustment.`}}document.getElementById('Nlab').textContent=P.N+' year'+(P.N>1?'s':'');
  BASE=simulate(P,constPath(P,P.N));if(MC&&MC.key!==mcKey())MC=null;
  summary();RENDER[CUR]();refreshChartInfo();if(CUR!=='mc'&&!mcFresh(false))startMC(false)},150)}
function encodeState(){return btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(getRaw(),{REAL,v:SAVE_V})))))}
function decodeState(s){try{return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
function copyText(txt,msgEl,okMsg){const done=()=>{msgEl.textContent=okMsg;setTimeout(()=>msgEl.textContent='',2500)};
  try{navigator.clipboard.writeText(txt).then(done,()=>{msgEl.textContent='Copy was blocked by the browser.'})}catch(e){msgEl.textContent='Copy was blocked by the browser.'}}
const STANDALONE_SITE=(()=>{try{return window.top===window.self&&/^https?:$/.test(location.protocol)}catch(e){return false}})();
function setBasis(){document.getElementById('realBtn').setAttribute('aria-pressed',REAL);document.getElementById('nomBtn').setAttribute('aria-pressed',!REAL);update()}
function init(){
  buildInputs();buildMetroSelect();buildSnap();buildMethod();const hadSaved=(()=>{try{return !!localStorage.getItem('rbi-inputs')}catch(e){return false}})();restore();wireWizard();wireSettings();wireLoc();wireHelp();wireChartInfo();wireMini();wireShareUndo();wireCounty();wireRentTag();wireAfford();{const tb=document.querySelector('.tabs'),sn=document.getElementById('snap');const sf=()=>sn.classList.toggle('more-r',sn.scrollLeft+sn.clientWidth<sn.scrollWidth-4);tb.addEventListener('scroll',tabFade,{passive:true});sn.addEventListener('scroll',sf,{passive:true});addEventListener('resize',()=>{tabFade();sf()});tabFade();sf()}
  if(STANDALONE_SITE){const sp=new URLSearchParams(location.search).get('s');const st=sp&&decodeState(sp);if(st){if(st.v==null)st.v=7;try{applySaved(st)}catch(e){console.warn('could not apply the shared settings',e)}history.replaceState(null,'',location.pathname)}}
  document.getElementById('nwBand').addEventListener('change',()=>renderProj());
  document.getElementById('realBtn').setAttribute('aria-pressed',REAL);document.getElementById('nomBtn').setAttribute('aria-pressed',!REAL);
  document.getElementById('h-year').max=LAST_Y;
  {const fb=document.getElementById('fcstPreset');fb.hidden=!PRESETS.fcst;if(PRESETS.fcst&&FCST.note){const h=document.createElement('div');h.className='hint muted';h.style.fontSize='11px';h.innerHTML=FCST.note.replace('__GH__',PRESETS.fcst.gh).replace('__GR__',PRESETS.fcst.gr);fb.textContent=FCST.label||fb.textContent;fb.parentElement.after(h)}}
  if(!MONTHLY){const o=document.querySelector('#h-mode option[value=monthly]');o.disabled=true;o.textContent+=' (unavailable)'}
  QUICK.forEach(k=>document.getElementById('q-'+k).addEventListener('input',e=>{if(e.target.value==='')return;if(k==='rent0'&&e.isTrusted)rentTyped();document.getElementById(k).value=unfmt(e.target.value);update()}));
  // money fields show thousands separators while typing; the cursor stays after the same digit
  document.addEventListener('input',e=>{const el=e.target;if(!el.dataset)return;el.dataset.typed='1';if(el.dataset.money==null)return;
    const v=el.value,pos=el.selectionStart==null?v.length:el.selectionStart,before=v.slice(0,pos).replace(/[^0-9.]/g,'').length,raw=unfmt(v);
    if(!/^-?\d*\.?\d*$/.test(raw))return;const neg=raw.startsWith('-'),[i,d]=raw.replace('-','').split('.');
    const f=(neg?'-':'')+(i?Number(i).toLocaleString('en-US'):'')+(d!=null?'.'+d:'');if(f===v)return;
    el.value=f;let n=0,p=neg?1:0;while(p<f.length&&n<before){if(/[0-9.]/.test(f[p]))n++;p++}try{el.setSelectionRange(p,p)}catch(err){}},true);
  document.addEventListener('focusout',e=>{const el=e.target;if(el&&el.dataset){delete el.dataset.typed;if(el.dataset.money!=null)setTimeout(()=>fmtMoneyEl(el),0)}});
  document.addEventListener('focusin',e=>{const el=e.target;if(!(el instanceof HTMLInputElement)||!/^(text|number)$/.test(el.type)||el.id==='aq')return;
    if(el.closest('.f,.q,.wizard')){el.addEventListener('mouseup',ev=>ev.preventDefault(),{once:true});try{el.select()}catch(err){}setTimeout(()=>{if(document.activeElement===el&&el.selectionStart===el.selectionEnd&&el.selectionEnd===el.value.length&&!el.dataset.typed)try{el.select()}catch(err){}},0)}});
  document.getElementById('N').addEventListener('input',update);
  document.getElementById('metro').addEventListener('change',e=>{applyMetro(e.target.value);update()});
  document.getElementById('beds').addEventListener('change',()=>{setRentFromBeds();update()});
  document.getElementById('rent0').addEventListener('input',e=>{if(e.isTrusted)rentTyped()});
  const aside=document.getElementById('aside'),scrim=document.getElementById('scrim'),fab=document.getElementById('fab');
  const sheet=on=>{aside.classList.toggle('open',on);scrim.classList.toggle('on',on);fab.hidden=on;if(on)aside.scrollTop=0};
  fab.addEventListener('click',()=>sheet(true));scrim.addEventListener('click',()=>sheet(false));document.getElementById('closeSheet').addEventListener('click',()=>sheet(false));
  addEventListener('keydown',e=>{if(e.key==='Escape')sheet(false)});
  aside.addEventListener('input',update);aside.addEventListener('change',e=>{if(e.target.tagName==='SELECT'||e.target.type==='checkbox')update()});
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{let pr=PRESETS[b.dataset.preset];
    if(b.dataset.preset==='metro'){const m=curMetro(),ms=metroStart(m);if(!ms)return;pr={gh:r2(geo(HOME.map((v,i)=>{const a=metroAnnual(curMetro(),true);return a&&a[i]!=null?a[i]:v}),ms))};
      // local rent history too, where BLS has one (metros, and counties inside them)
      if(m.rentG)pr.gr=r2(geo(rentSeries(true),ms))}
    Object.keys(pr).forEach(k=>document.getElementById(k).value=pr[k]);update()}));
  document.getElementById('reset').addEventListener('click',()=>{F.forEach(f=>document.getElementById(f[1]).value=String(f[3]));document.getElementById('N').value=10;document.getElementById('metro').value='us';applyMetro('us');try{localStorage.removeItem('rbi-inputs')}catch(e){}update()});
  document.getElementById('realBtn').addEventListener('click',()=>{REAL=true;setBasis()});
  document.getElementById('nomBtn').addEventListener('click',()=>{REAL=false;setBasis()});
  document.getElementById('opt30').addEventListener('click',()=>{OPT_TERM=30;document.getElementById('opt30').setAttribute('aria-pressed',true);document.getElementById('opt15').setAttribute('aria-pressed',false);renderOpt()});
  document.getElementById('opt15').addEventListener('click',()=>{OPT_TERM=15;document.getElementById('opt15').setAttribute('aria-pressed',true);document.getElementById('opt30').setAttribute('aria-pressed',false);renderOpt()});
  /* tabs follow the ARIA tabs pattern: each tab names its panel, arrow keys / Home / End move between tabs */
  const TABS=[...document.querySelectorAll('.tabs button')];
  TABS.forEach((b,i)=>{const pn=document.getElementById('tab-'+b.dataset.tab);b.id='tb-'+b.dataset.tab;b.setAttribute('aria-controls',pn.id);
    pn.setAttribute('role','tabpanel');pn.setAttribute('aria-labelledby',b.id);b.tabIndex=b.getAttribute('aria-selected')==='true'?0:-1;
    b.addEventListener('click',()=>showTab(b.dataset.tab));
    b.addEventListener('keydown',e=>{const j={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:TABS.length-1}[e.key];if(j==null)return;e.preventDefault();
      const t=TABS[(j+TABS.length)%TABS.length];t.focus();showTab(t.dataset.tab)})});
  /* scrollable tables can be scrolled from the keyboard and are announced by their card title */
  document.querySelectorAll('.tablewrap').forEach(w=>{w.tabIndex=0;w.setAttribute('role','region');
    const h=w.closest('.card')&&w.closest('.card').querySelector('h2,h3');w.setAttribute('aria-label',h?h.textContent.trim():'Table')});
  ['h-rate','h-year','h-mode','h-home'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderHist()));
  document.getElementById('mc-run').addEventListener('click',()=>{document.getElementById('mc-note').textContent='Running simulations…';startMC(true)});
  ['mc-n','mc-b','mc-w','mc-rc'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(CUR==='mc'){document.getElementById('mc-note').textContent='Running simulations…';startMC(true)}}));
  document.getElementById('scSave').addEventListener('click',()=>{const nm=document.getElementById('scName').value.trim()||`Scenario ${loadSc().length+1}`;const a=loadSc();a.push({name:nm,raw:getRaw()});
    document.getElementById('scMsg').textContent=saveSc(a)?`Saved "${nm}".`:'Could not save: this browser is blocking storage.';document.getElementById('scName').value='';renderScen()});
  // copy the year-by-year table as CSV; where the clipboard is blocked, download it as a file instead
  document.getElementById('copyCsv').addEventListener('click',()=>{const msg=document.getElementById('copyMsg');
    const fallback=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([CSV_TEXT],{type:'text/csv'}));a.download='rent-buy-invest.csv';a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000);msg.textContent='Copying was blocked, so the CSV was downloaded.'};
    try{navigator.clipboard.writeText(CSV_TEXT).then(()=>{msg.textContent='Copied. Paste it into a spreadsheet.'},fallback)}catch(e){fallback()}});
  const rerender=()=>RENDER[CUR]();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',rerender);
  new MutationObserver(rerender).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  let tab='proj';try{tab=localStorage.getItem('rbi-tab')||'proj'}catch(e){}
  if(location.hash&&RENDER[location.hash.slice(1)])tab=location.hash.slice(1);
  if(!RENDER[tab])tab='proj';
  if(initialView()==='simple'&&document.querySelector(`.tabs .tech[data-tab="${tab}"]`))tab='proj';
  ['cmpA','cmpB'].forEach(id=>document.getElementById(id).addEventListener('change',e=>{e.target.dataset.touched=1;renderCompare(loadSc())}));
  P=readP();BASE=simulate(P,constPath(P,P.N));CUR=tab;update();showTab(tab);
  let seen=false;try{seen=!!localStorage.getItem('rbi-wz')}catch(e){}
  if(!seen&&!hadSaved&&!new URLSearchParams(location.search).get('s'))setTimeout(openWizard,400);
}
function loadScript(u){return new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=u;sc.onload=res;sc.onerror=rej;document.head.appendChild(sc)})}
(async()=>{
  // the cartesian build (scatter, bar, heatmap, contour, histogram) is all the app draws: about 1.4 MB instead of 4.6 MB
  const urls=LOCAL_LIBS.concat(['https://cdn.jsdelivr.net/npm/plotly.js-cartesian-dist-min@2.35.2/plotly-cartesian.min.js','https://unpkg.com/plotly.js-cartesian-dist-min@2.35.2/plotly-cartesian.min.js','https://cdn.plot.ly/plotly-2.35.2.min.js']);
  // the numbers render right away; charts are drawn when the library has loaded
  init();
  for(const u of urls){if(window.Plotly)break;try{await loadScript(u)}catch(e){}}
  if(!window.Plotly){window.Plotly={react(){throw new Error('the charting library did not load; check your connection and reload')}}}
  plotFlush(!!window.Plotly.Plots);
})();

/* compact answer bar that appears once the main answer scrolls out of view, with a horizon stepper */
function wireMini(){const mini=document.getElementById('mini'),v=document.querySelector('.verdict');
  if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{mini.hidden=e.isIntersecting||e.boundingClientRect.top>0},{threshold:0,rootMargin:'-60px 0px 0px 0px'}).observe(v);
  const step=d=>{const el=document.getElementById('N');el.value=Math.min(30,Math.max(1,+el.value+d));update()};
  document.getElementById('miniDn').onclick=()=>step(-1);document.getElementById('miniUp').onclick=()=>step(1);
  document.getElementById('miniSum').onclick=()=>v.scrollIntoView({behavior:'smooth',block:'start'});
  // floating "Assumptions" button: tucks away while scrolling down, returns when scrolling up
  const fab=document.getElementById('fab');let y0=scrollY;
  // ...and stays out of the way while the answer itself is on screen (the top card has the main inputs)
  let overAnswer=false;if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{overAnswer=e.isIntersecting;fab.classList.toggle('tuck',overAnswer)},{threshold:0.15}).observe(document.querySelector('.vtop'));
  addEventListener('scroll',()=>{const y=scrollY;if(Math.abs(y-y0)<8)return;fab.classList.toggle('tuck',overAnswer||(y>y0&&y>300));y0=y},{passive:true});
  // keyboard: "/" jumps to the settings search, Escape closes the settings sheet
  addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();const q=document.getElementById('aq');if(innerWidth<=900)fab.click();setTimeout(()=>q.focus(),innerWidth<=900?300:0)}
    if(e.key==='Escape'&&document.getElementById('aside').classList.contains('open'))document.getElementById('closeSheet').click()})}
