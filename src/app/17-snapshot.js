/* ===================== Snapshot ===================== */
function buildSnap(){
  document.getElementById('snap').innerHTML=SNAP.items.map(c=>`<div class="chip"><span class="k"><span class="kt" title="${c.k}">${c.k}</span></span><span class="v">${c.v}</span><span class="s muted">${c.s}${c.field==='rent0'?' · all home sizes; “use” scales it to your bedrooms':''} · ${sl(c.src)}${c.field?` · <a href="#" class="use" data-f="${c.field}" data-v="${c.val}">use</a>`:''}</span></div>`).join('')+
    `<div class="chip"><span class="k"><span class="kt">Data as of</span></span><span class="v">${SNAP.asOf}</span><span class="s muted">${dataAgeText()}</span></div>`;
  staleNotice();
  document.querySelectorAll('.use').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const v=a.dataset.f==='rent0'?Math.round(a.dataset.v*bedRatio(null,document.getElementById('beds').value)/10)*10:a.dataset.v;if(a.dataset.f==='rent0')rentTyped();document.getElementById(a.dataset.f).value=v;update()}));
}
function bedRatio(m,b){if(b==='any')return 1;const k=b==='4'?'4':b;const r=(m&&m.beds&&m.beds[k])||(m&&m.acs&&m.acs.beds&&m.acs.beds[k])||(D0.bedRatio&&D0.bedRatio[k]);return r||1}
function selMetro(){return METROS.find(x=>x.slug===document.getElementById('metro').value)||METROS[0]}
/* Rent estimated from the home price: the location's typical rent for the chosen bedrooms, scaled by (price ÷ the
   location's typical price)^RENT_ELAST. Across U.S. counties (Census ACS 2020–2024) rent rises about 0.65% per 1% of
   home value, so pricier homes rent for less relative to their price. Typing a rent switches to the user's own figure. */
const RENT_ELAST=0.65;
function rentEstimate(m,P,beds){m=m||selMetro();if(!m.rent||!(P>0))return null;
  return Math.round(m.rent*bedRatio(m,beds)*Math.pow(P/(m.P||P),RENT_ELAST)/10)*10}
function applyRentMode(){const m=selMetro(),auto=document.getElementById('rentMode').value==='auto',beds=document.getElementById('beds').value,P=numOf('P'),est=rentEstimate(m,P,beds);
  const h=document.getElementById('rentMode').closest('.f').querySelector('.hint');
  const tag=document.getElementById('rentTag');
  if(tag){tag.title=est?(auto?`Estimated from the home price (${m.name}); type a rent to use your own`:`Estimate from price: $${est.toLocaleString('en-US')}/mo`):'';
    tag.innerHTML=!est?'':auto?'est.':'<button type="button" class="qlink" data-act="rent-est">use est.</button>'}
  if(!est){if(h)h.textContent='';return}
  if(auto)document.getElementById('rent0').value=est;
  const typ=Math.round(m.rent*bedRatio(m,beds)/10)*10,$=x=>'$'+Math.round(x).toLocaleString('en-US');
  if(h)h.textContent=`${auto?'Estimate':'Estimate from price would be'} ${$(est)}/mo: ${m.name} typical ${$(typ)} × (price ÷ ${$(m.P)})^${RENT_ELAST}`}
function setRentFromBeds(){applyRentMode()}
function rentTyped(){document.getElementById('rentMode').value='manual'}
function wireRentTag(){document.getElementById('rentTag').addEventListener('click',e=>{if(!e.target.closest('[data-act="rent-est"]'))return;
  e.preventDefault();document.getElementById('rentMode').value='auto';update()})}
function applyTT(){const auto=document.getElementById('ttAuto').value==='auto',eb=document.getElementById('ttBuy'),es=document.getElementById('ttSell');
  eb.disabled=es.disabled=auto;if(!auto)return;const m=selMetro();
  if(!m||!m.tt){eb.value=0;es.value=0;return}
  const P=numOf('P')||0,dp=(parseFloat(document.getElementById('dp').value)||0)/100,L=P*(1-dp);
  const t=transferTaxes(m.tt,P,L);eb.value=P?(t.buyer/P*100).toFixed(3):0;es.value=P?(t.seller/P*100).toFixed(3):0}
function buildMetroSelect(){const sel=document.getElementById('metro');sel.innerHTML=METROS.map(m=>`<option value="${m.slug}">${m.name}</option>`).join('')+
  (COUNTIES?`<option value="__county">${COUNTIES.zip?'Any county or ZIP code…':'Any U.S. county…'}</option>`:'')}
/* ---- counties: any of ~3,200 counties from Census ACS, added to the location list as they are picked ----
   The list is loaded on first use (fetched from data/counties.json, or embedded in the artifact build) and scaled here:
   value × kP (the U.S. median's change to today's Zillow typical value), tax ÷ value, and the state's insurance.
   Rent: HUD's Fair Market Rents by bedrooms when available (they include utilities, so × the county's contract-to-gross
   rent ratio), else the ACS median contract rent × kR. Price history: FHFA's county index, loaded per state on pick. */
let COUNTY_ROWS=null,COUNTY_LOAD=null;const COUNTY_HPI={};
const getJSON=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
function loadCounties(){if(COUNTY_ROWS)return Promise.resolve(COUNTY_ROWS);if(COUNTY_LOAD)return COUNTY_LOAD;const C=COUNTIES,F=C.fmr;
  const rows=C.rows?Promise.resolve({rows:C.rows}):getJSON(C.file);
  const fmr=!F?Promise.resolve(null):F.rows?Promise.resolve({rows:F.rows}):getJSON(F.file).catch(()=>null);
  COUNTY_LOAD=Promise.all([rows,fmr]).then(([d,f])=>COUNTY_ROWS=d.rows.map(([fips,name,P,rent,tax,gross])=>{
    const h=f&&f.rows[fips],cg=rent&&gross?Math.min(1,Math.max(0.6,rent/gross)):C.cg;
    return [fips,name,Math.round(P*C.kP/100)*100,rent?Math.round(rent*C.kR/10)*10:null,tax?Math.round(tax/P*1e4)/100:null,
      (C.stateIns||{})[name.split(', ').pop()]||null,h&&h[2]?h.map(x=>Math.round(x*cg/10)*10):null,cg]})).catch(e=>{COUNTY_LOAD=null;throw e});return COUNTY_LOAD}
function countyMetro(slug){if(!COUNTIES||!COUNTY_ROWS)return null;if(/^zip:/.test(slug||''))return zipMetro(slug);if(!/^cty:/.test(slug||''))return null;const have=METROS.find(m=>m.slug===slug);if(have)return have;
  const r=COUNTY_ROWS.find(x=>x[0]===slug.slice(4));if(!r)return null;const [fips,name,Pc,rent,ptax,ins,fmr,cg]=r,us=METROS[0],C=COUNTIES;
  const m={slug,fips,county:true,name,P:Pc,rent:fmr?fmr[2]:rent||us.rent,ptax:ptax!=null?ptax:us.ptax,ins:ins||us.ins,ptaxCap:0,hpi:null,acs:null,tt:null,ttSrc:[],
    beds:fmr?{'0':fmr[0]/fmr[2],'1':fmr[1]/fmr[2],'2':1,'3':fmr[3]/fmr[2],'4':fmr[4]/fmr[2]}:null,
    src:{price:{t:`median home value, Census ACS ${C.span}, × ${C.kP.toFixed(3)} (the U.S. median's change to today's Zillow typical value)`,u:C.u},
      rent:fmr?{t:`HUD Fair Market Rent FY${C.fmr.fy} for the bedrooms chosen (2-bedroom $${fmr[2].toLocaleString('en-US')} without utilities: HUD's figure includes them, × ${cg.toFixed(2)}, the county's ACS contract-to-gross rent ratio)`,u:C.fmr.u}
        :{t:rent?`median contract rent, Census ACS ${C.span}, × ${C.kR.toFixed(3)} (scaled to today's Zillow typical U.S. rent)`:'no county rent estimate; U.S. typical rent',u:C.u},
      ptax:{t:ptax!=null?`median tax ÷ median value, Census ACS ${C.span}`:'U.S. effective rate',u:C.u},
      ins:{t:ins?`${name.split(', ').pop()} average premium (Insurify)`:'U.S. average premium',u:ins?C.insU:null}}};
  addLocation(m);return m}
function addLocation(m){METROS.push(m);const sel=document.getElementById('metro'),o=document.createElement('option');o.value=m.slug;o.textContent=m.name;
  sel.insertBefore(o,sel.querySelector('option[value="__county"]'));loadCountyHpi(m)}
/* ---- ZIP codes: Census ACS by ZIP Code Tabulation Area for value, rent and tax, HUD Small Area FMRs for rent by
   bedrooms, and the county (most land) for insurance and price history. Files are split by the ZIP's first two digits. */
const ZIP_FILES={},ZIP_DATA={};
function loadZipFile(z){const p=z.slice(0,2),Z=COUNTIES.zip;if(!Z)return Promise.resolve(null);
  return ZIP_FILES[p]=ZIP_FILES[p]||getJSON(Z.dir+p+'.json').then(d=>ZIP_DATA[p]=d).catch(()=>{delete ZIP_FILES[p];return null})}
function ensureZip(z){return loadCounties().then(()=>loadZipFile(z)).then(()=>zipMetro('zip:'+z))}
function zipMetro(slug){const have=METROS.find(m=>m.slug===slug);if(have)return have;const z=slug.slice(4),d=ZIP_DATA[z.slice(0,2)];if(!d)return null;const r=d.zips[z];if(!r)return null;const [fips,val,rent,tax,gross,sa]=r;
  const c=COUNTY_ROWS.find(x=>x[0]===fips),C=COUNTIES,us=METROS[0];if(!c)return null;const [,cname,cP,crent,cptax,ins,cfmr,ccg]=c;
  const cg=rent&&gross?Math.min(1,Math.max(0.6,rent/gross)):ccg,adjR=sa?sa.map(x=>Math.round(x*cg/10)*10):null,M=d.meta;
  const cm=countyMetro('cty:'+fips);
  const m={slug,fips,zip:z,county:true,name:`ZIP ${z} · ${cname}`,P:val?Math.round(val*C.kP/100)*100:cP,ptax:tax&&val?Math.round(tax/val*1e4)/100:cptax!=null?cptax:us.ptax,
    rent:adjR?adjR[2]:cm.rent,beds:adjR?{'0':adjR[0]/adjR[2],'1':adjR[1]/adjR[2],'2':1,'3':adjR[3]/adjR[2],'4':adjR[4]/adjR[2]}:cm.beds,
    ins:cm.ins,ptaxCap:0,hpi:null,acs:null,tt:null,ttSrc:[],
    src:{price:val?{t:`median home value, ZIP ${z}, ${M.acs.t.split(',')[0]}, × ${C.kP.toFixed(3)} (the U.S. median's change to today's Zillow typical value)`,u:M.acs.u}:cm.src.price,
      rent:adjR?{t:`${M.safmr.t}, ZIP ${z}, for the bedrooms chosen (2-bedroom $${adjR[2].toLocaleString('en-US')} without utilities: HUD's figure includes them, × ${cg.toFixed(2)}, the ZIP's ACS contract-to-gross rent ratio)`,u:M.safmr.u}:cm.src.rent,
      ptax:tax&&val?{t:`median tax ÷ median value, ZIP ${z}, ${M.acs.t.split(',')[0]}`,u:M.acs.u}:cm.src.ptax,ins:cm.src.ins}};
  addLocation(m);return m}
/* FHFA county index for a county, from its state's file; once it arrives the backtest, Monte Carlo and the
   "<county> 19xx–2025 avg" preset use it like a metro's history */
function loadCountyHpi(m){const H=COUNTIES.hpi;if(!H||m.hpi)return;const st=m.fips.slice(0,2);
  (COUNTY_HPI[st]=COUNTY_HPI[st]||getJSON(H.dir+st+'.json').catch(()=>{delete COUNTY_HPI[st];return null})).then(d=>{
    const v=d&&d.counties[m.fips];if(!v||Object.keys(v).length<10)return;
    m.hpi={values:v,basis:'all-transactions',volK:H.volK};m.hpiSrc={t:`FHFA county index, ${m.name} (all-transactions, developmental); volatility ratio ${H.volK} (metro median)`,u:H.u};m.src.hpi=m.hpiSrc;
    if(selMetro()!==m)return;const ms=metroStart(m),btn=document.getElementById('metroPreset');btn.hidden=!ms;if(ms)btn.textContent=`${m.name} ${ms}–2025 avg`;
    MC=null;LAST_KEY='';update()})}
/* a saved or shared setup whose location is a county: load the list, then select it */
function restoreCounty(slug){if(!COUNTIES||!/^(cty|zip):/.test(slug||'')||countyMetro(slug))return;
  (/^zip:/.test(slug)?ensureZip(slug.slice(4)):loadCounties()).then(()=>{const m=countyMetro(slug);if(!m)return;document.getElementById('metro').value=slug;updateMetroHints(m);update()}).catch(()=>{})}
function wireCounty(){if(!COUNTIES)return;const sel=document.getElementById('metro'),q=document.getElementById('countyQ'),dl=document.getElementById('countyList');let prev=sel.value;
  sel.addEventListener('focus',()=>{prev=sel.value});
  sel.addEventListener('change',e=>{if(sel.value!=='__county'){prev=sel.value;return}e.stopImmediatePropagation();sel.value=prev;
    q.hidden=false;q.value='';q.placeholder='Loading counties…';q.focus();
    loadCounties().then(rows=>{if(!dl.options.length)dl.innerHTML=rows.map(r=>`<option value="${r[1]}"></option>`).join('');q.placeholder=COUNTIES.zip?'County name or 5-digit ZIP code':'Type a county name'})
      .catch(()=>{q.placeholder='Could not load the county list; check your connection'})},true);
  const go=m=>{q.hidden=true;sel.value=m.slug;prev=m.slug;applyMetro(m.slug);update()};
  const pick=()=>{const v=q.value.trim();
    if(/^\d{5}$/.test(v)&&COUNTIES.zip){ensureZip(v).then(m=>{if(m)go(m);else{q.value='';q.placeholder=`No data for ZIP ${v}; try its county`}}).catch(()=>{q.placeholder='Could not load ZIP data; check your connection'});return}
    const r=(COUNTY_ROWS||[]).find(x=>x[1].toLowerCase()===v.toLowerCase());if(r)go(countyMetro('cty:'+r[0]))};
  q.addEventListener('change',pick);q.addEventListener('keydown',e=>{if(e.key==='Enter')pick();if(e.key==='Escape')q.hidden=true})}
function applyMetro(slug){const m=METROS.find(x=>x.slug===slug);if(!m)return;
  const set=(id,v)=>{if(v!=null&&isFinite(v))document.getElementById(id).value=v};
  set('P',m.P);set('ptax',m.acs&&m.acs.rate!=null?m.acs.rate:m.ptax);set('ins',m.ins);set('ptaxCap',m.ptaxCap||0);document.getElementById('rentMode').value='auto';applyRentMode();
  const ms=metroStart(m),btn=document.getElementById('metroPreset');btn.hidden=!ms;if(ms)btn.textContent=`${m.name} ${ms}–2025 avg`;
  updateMetroHints(m);}
function updateMetroHints(m){
  const hint=(id,html)=>{const el=document.getElementById(id);const h=el&&el.closest('.f').querySelector('.hint');if(h)h.innerHTML=html};
  const base=Object.fromEntries(F.map(f=>[f[1],f[5]]));
  if(m.slug==='us'){['P','rent0','ptax','ins'].forEach(k=>hint(k,base[k]));return}
  const d=x=>x&&x.d?` (${x.d})`:'';
  hint('P',`${m.name}: ${m.src.price?m.src.price.t:''}${d(m.src.price)} ${srcObj(m.src.price)}`);
  hint('rent0',`${m.name}: ${m.src.rent?m.src.rent.t:''}${d(m.src.rent)} ${srcObj(m.src.rent)} · use a rental comparable to the home`);
  hint('ptax',`${m.src.ptax?m.src.ptax.t:''} ${srcObj(m.src.ptax)}`);
  hint('ins',`${m.src.ins?m.src.ins.t:''} ${srcObj(m.src.ins)}`);
  if(m.acs&&m.acs.rate!=null)hint('ptax',`${m.acs.name}: median tax ÷ median value, Census ACS ${m.acs.year} ${linkTo(m.acs.u)}${m.src.ptax?` · main county: ${m.src.ptax.t} ${srcObj(m.src.ptax)}`:''}`);
  hint('rent0',`${m.name}: ${m.src.rent?m.src.rent.t:''}${d(m.src.rent)} ${srcObj(m.src.rent)}${m.beds?'':' × Census ratio for the chosen bedrooms'}`);
  const tts=document.getElementById('ttBuy').closest('.f').querySelector('.hint');if(tts)tts.innerHTML=m.county?'not available for counties; set to manual and enter your state and local rates':m.ttSrc&&m.ttSrc.length?`${m.name}: `+m.ttSrc.map(x=>`${x.t} ${linkTo(x.u)}`).join(' · '):'no transfer taxes found for this location';
}


function dataAgeDays(){const d=new Date(SNAP.asOf+'T12:00:00');return isFinite(d)?Math.floor((Date.now()-d)/864e5):0}
function dataAgeText(){const n=dataAgeDays();return n<=1?'updated today':n<14?`${n} days ago`:n<60?`${Math.round(n/7)} weeks ago`:`${Math.round(n/30)} months ago`}
function staleNotice(){const n=dataAgeDays();let el=document.getElementById('stale');
  const off=typeof navigator!=='undefined'&&navigator.onLine===false;
  if(n<21&&!off){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='stale';el.className='stale';el.setAttribute('role','status');document.getElementById('snap').insertAdjacentElement('beforebegin',el)}
  const when=new Date(SNAP.asOf+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  el.innerHTML=(n>=21?`<strong>Market data is from ${when}</strong>, ${dataAgeText()}. Mortgage rates and prices may have moved since; check today's rate with a lender or the linked sources and enter it in the settings.`:'')+
    (off?`${n>=21?' ':''}<strong>Offline</strong>: using the data saved with the app.`:'')}
addEventListener('online',()=>{try{staleNotice()}catch(e){}});addEventListener('offline',()=>{try{staleNotice()}catch(e){}});
