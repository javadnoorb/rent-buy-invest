/* ===================== Wiring ===================== */
const RENDER={proj:renderProj,sens:renderSens,opt:renderOpt,hist:renderHist,mc:()=>{renderMC();typeset(document.getElementById('tab-mc'))},scen:renderScen,data:renderData,method:()=>typeset(document.getElementById('tab-method'))};
function showTab(k){CUR=k;document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===k));
  Object.keys(RENDER).forEach(t=>document.getElementById('tab-'+t).hidden=t!==k);try{localStorage.setItem('rbi-tab',k)}catch(e){}
  requestAnimationFrame(()=>RENDER[k]())}
const QUICK=['P','rent0','dp','rate'];
function syncQuick(){QUICK.forEach(k=>{const q=document.getElementById('q-'+k),m=document.getElementById(k);if(document.activeElement!==q)q.value=m.value})}
function persist(){try{localStorage.setItem('rbi-inputs',JSON.stringify(Object.assign(getRaw(),{REAL,v:4})));document.getElementById('saved').textContent='saved on this device'}catch(e){}}
function restore(){try{const o=JSON.parse(localStorage.getItem('rbi-inputs')||'null');if(!o||o.v!==4)return;setRaw(o);if(o.REAL===false)REAL=false;const m=METROS.find(x=>x.slug===o.metro);if(m){const ms=metroStart(m),btn=document.getElementById('metroPreset');btn.hidden=!ms;if(ms)btn.textContent=`${m.name} ${ms}–2025 avg`;updateMetroHints(m)}}catch(e){}}
function validate(){document.querySelectorAll('aside input[type=number]').forEach(el=>el.classList.toggle('bad',el.value===''||!isFinite(parseFloat(el.value))))}
let timer=null;
function syncLoanFields(){const t=document.getElementById('loanType').value;
  ['armRate','armYears','armMargin'].forEach(id=>document.getElementById(id).closest('.f').hidden=t!=='arm');
  document.getElementById('pmi').closest('.f').hidden=t==='fha';
  ['ttBuy','ttSell'].forEach(id=>document.getElementById(id).closest('.f').hidden=false)}
let LAST_KEY='';
function update(){clearTimeout(timer);timer=setTimeout(()=>{VOLADJ=document.getElementById('volAdj').value!=='0';applyTT();syncLoanFields();const key=JSON.stringify(getRaw())+REAL;if(key===LAST_KEY&&P)return;LAST_KEY=key;validate();syncQuick();persist();P=readP();
  {const muEl=document.getElementById('mu');const auto=P.muMode==='auto';muEl.disabled=auto;if(auto)muEl.value=Math.round(P.mu*100);}document.getElementById('Nlab').textContent=P.N+' year'+(P.N>1?'s':'');
  BASE=simulate(P,constPath(P,P.N));MC=null;
  summary();RENDER[CUR]();if(CUR!=='mc')startMC(false)},150)}
function encodeState(){return btoa(unescape(encodeURIComponent(JSON.stringify(Object.assign(getRaw(),{REAL})))))}
function decodeState(s){try{return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){return null}}
function copyText(txt,msgEl,okMsg){const done=()=>{msgEl.textContent=okMsg;setTimeout(()=>msgEl.textContent='',2500)};
  try{navigator.clipboard.writeText(txt).then(done,()=>{msgEl.textContent='Copy was blocked by the browser.'})}catch(e){msgEl.textContent='Copy was blocked by the browser.'}}
const STANDALONE_SITE=(()=>{try{return window.top===window.self&&/^https?:$/.test(location.protocol)}catch(e){return false}})();
function setBasis(){document.getElementById('realBtn').setAttribute('aria-pressed',REAL);document.getElementById('nomBtn').setAttribute('aria-pressed',!REAL);update()}
function init(){
  buildInputs();buildMetroSelect();buildSnap();buildMethod();const hadSaved=(()=>{try{return !!localStorage.getItem('rbi-inputs')}catch(e){return false}})();restore();wireWizard();
  if(STANDALONE_SITE){const sp=new URLSearchParams(location.search).get('s');const st=sp&&decodeState(sp);if(st){setRaw(st);if(st.REAL===false)REAL=false;const m=METROS.find(x=>x.slug===st.metro);if(m)updateMetroHints(m);history.replaceState(null,'',location.pathname)}}
  const shareBtn=document.getElementById('shareLink');shareBtn.hidden=!STANDALONE_SITE;
  shareBtn.addEventListener('click',()=>copyText(location.origin+location.pathname+'?s='+encodeURIComponent(encodeState()),document.getElementById('actMsg'),'Link copied. Anyone opening it sees these inputs.'));
  document.getElementById('copySummary').addEventListener('click',()=>copyText(window._summaryText||'',document.getElementById('actMsg'),'Summary copied.'));
  document.getElementById('nwBand').addEventListener('change',()=>renderProj());
  document.getElementById('realBtn').setAttribute('aria-pressed',REAL);document.getElementById('nomBtn').setAttribute('aria-pressed',!REAL);
  document.getElementById('h-year').max=2025;
  {const fb=document.getElementById('fcstPreset');fb.hidden=!PRESETS.fcst;if(PRESETS.fcst&&FCST.note){const h=document.createElement('div');h.className='hint muted';h.style.fontSize='11px';h.innerHTML=FCST.note;fb.parentElement.after(h)}}
  if(!MONTHLY){const o=document.querySelector('#h-mode option[value=monthly]');o.disabled=true;o.textContent+=' (unavailable)'}
  QUICK.forEach(k=>document.getElementById('q-'+k).addEventListener('input',e=>{if(e.target.value==='')return;document.getElementById(k).value=e.target.value;update()}));
  document.getElementById('N').addEventListener('input',update);
  document.getElementById('metro').addEventListener('change',e=>{applyMetro(e.target.value);update()});
  document.getElementById('beds').addEventListener('change',()=>{setRentFromBeds();update()});
  const aside=document.getElementById('aside'),scrim=document.getElementById('scrim'),fab=document.getElementById('fab');
  const sheet=on=>{aside.classList.toggle('open',on);scrim.classList.toggle('on',on);fab.hidden=on;if(on)aside.scrollTop=0};
  fab.addEventListener('click',()=>sheet(true));scrim.addEventListener('click',()=>sheet(false));document.getElementById('closeSheet').addEventListener('click',()=>sheet(false));
  addEventListener('keydown',e=>{if(e.key==='Escape')sheet(false)});
  aside.addEventListener('input',update);aside.addEventListener('change',e=>{if(e.target.tagName==='SELECT'||e.target.type==='checkbox')update()});
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{let pr=PRESETS[b.dataset.preset];
    if(b.dataset.preset==='metro'){const m=curMetro(),ms=metroStart(m);if(!ms)return;pr={gh:r2(geo(HOME.map((v,i)=>{const a=metroAnnual(curMetro(),true);return a&&a[i]!=null?a[i]:v}),ms))}}
    Object.keys(pr).forEach(k=>document.getElementById(k).value=pr[k]);update()}));
  document.getElementById('reset').addEventListener('click',()=>{F.forEach(f=>document.getElementById(f[1]).value=String(f[3]));document.getElementById('N').value=10;document.getElementById('metro').value='us';applyMetro('us');try{localStorage.removeItem('rbi-inputs')}catch(e){}update()});
  document.getElementById('realBtn').addEventListener('click',()=>{REAL=true;setBasis()});
  document.getElementById('nomBtn').addEventListener('click',()=>{REAL=false;setBasis()});
  document.getElementById('opt30').addEventListener('click',()=>{OPT_TERM=30;document.getElementById('opt30').setAttribute('aria-pressed',true);document.getElementById('opt15').setAttribute('aria-pressed',false);renderOpt()});
  document.getElementById('opt15').addEventListener('click',()=>{OPT_TERM=15;document.getElementById('opt15').setAttribute('aria-pressed',true);document.getElementById('opt30').setAttribute('aria-pressed',false);renderOpt()});
  document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  ['h-rate','h-year','h-mode','h-home'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderHist()));
  document.getElementById('mc-run').addEventListener('click',()=>{document.getElementById('mc-note').textContent='Running simulations…';startMC(true)});
  ['mc-n','mc-b','mc-w','mc-rc'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(CUR==='mc'){document.getElementById('mc-note').textContent='Running simulations…';startMC(true)}}));
  document.getElementById('scSave').addEventListener('click',()=>{const nm=document.getElementById('scName').value.trim()||`Scenario ${loadSc().length+1}`;const a=loadSc();a.push({name:nm,raw:getRaw()});
    document.getElementById('scMsg').textContent=saveSc(a)?`Saved "${nm}".`:'Could not save: this browser is blocking storage.';document.getElementById('scName').value='';renderScen()});
  document.getElementById('copyCsv').addEventListener('click',()=>{const ta=document.getElementById('csvText'),msg=document.getElementById('copyMsg');
    const fallback=()=>{ta.closest('details').open=true;ta.focus();ta.select();msg.textContent='Text selected below; copy it with your device.'};
    try{navigator.clipboard.writeText(ta.value).then(()=>{msg.textContent='Copied.'},fallback)}catch(e){fallback()}});
  const rerender=()=>RENDER[CUR]();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',rerender);
  new MutationObserver(rerender).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  let tab='proj';try{tab=localStorage.getItem('rbi-tab')||'proj'}catch(e){}
  if(location.hash&&RENDER[location.hash.slice(1)])tab=location.hash.slice(1);
  if(!RENDER[tab])tab='proj';
  ['cmpA','cmpB'].forEach(id=>document.getElementById(id).addEventListener('change',e=>{e.target.dataset.touched=1;renderCompare(loadSc())}));
  P=readP();BASE=simulate(P,constPath(P,P.N));CUR=tab;update();showTab(tab);
  let seen=false;try{seen=!!localStorage.getItem('rbi-wz')}catch(e){}
  if(!seen&&!hadSaved&&!new URLSearchParams(location.search).get('s'))setTimeout(openWizard,400);
}
function loadScript(u){return new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=u;sc.onload=res;sc.onerror=rej;document.head.appendChild(sc)})}
(async()=>{
  const urls=['https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.2/plotly.min.js','https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.35.2/plotly.min.js','https://unpkg.com/plotly.js-dist-min@2.35.2/plotly.min.js'];
  for(const u of urls){if(window.Plotly)break;try{await loadScript(u)}catch(e){}}
  if(!window.Plotly){window.Plotly={react(){throw new Error('the charting library did not load; check your connection and reload')}}}
  init();
})();
