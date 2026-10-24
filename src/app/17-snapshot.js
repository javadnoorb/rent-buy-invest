/* ===================== Snapshot ===================== */
function buildSnap(){
  document.getElementById('snap').innerHTML=SNAP.items.map(c=>`<div class="chip"><span class="k"><span class="kt" title="${c.k}">${c.k}</span></span><span class="v">${c.v}</span><span class="s muted">${c.s}${c.field==='rent0'?' · all home sizes; “use” scales it to your bedrooms':''} · ${sl(c.src)}${c.field?` · <a href="#" class="use" data-f="${c.field}" data-v="${c.val}">use</a>`:''}</span></div>`).join('')+
    `<div class="chip"><span class="k"><span class="kt">Data as of</span></span><span class="v">${SNAP.asOf}</span><span class="s muted">${dataAgeText()}</span></div>`;
  const when=new Date(SNAP.asOf+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  document.getElementById('asof').innerHTML=`Market data updated <time datetime="${SNAP.asOf}">${when}</time> (${dataAgeText()}) · refreshed weekly from public sources`;
  staleNotice();
  document.querySelectorAll('.use').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const v=a.dataset.f==='rent0'?Math.round(a.dataset.v*bedRatio(null,document.getElementById('beds').value)/10)*10:a.dataset.v;if(a.dataset.f==='rent0')rentTyped();document.getElementById(a.dataset.f).value=v;update()}));
}
/* a location's typical rent for the bedrooms chosen, rounded to $10 */
function typicalRent(m,beds){return Math.round(m.rent*bedRatio(m,beds)/10)*10}
function bedRatio(m,b){if(b==='any')return 1;const k=b==='4'?'4':b;const r=(m&&m.beds&&m.beds[k])||(m&&m.acs&&m.acs.beds&&m.acs.beds[k])||(D0.bedRatio&&D0.bedRatio[k]);return r||1}
/* the state a location is in (metros carry it; counties and ZIPs end their name with the state) and its rules */
function stateOf(m){if(!m)return null;if(m.st)return m.st;const n=(m.cname||m.name||'').split(', ').pop();return (STATE_RULES.names||{})[n]||null}
function stateCap(st){const c=st&&(STATE_RULES.caps||{})[st];return c?{cap:c.cap||0,cpi:!!c.cpi,src:c}:{cap:0,cpi:false,src:null}}
/* state income tax from the state's 2026 brackets (data/state_rules.json): taxable income = gross income − the state's
   standard deduction; exemptions, credits and local income taxes are left out. Returns the tax, the marginal rate and
   whether the state lets you itemize mortgage interest and property tax. */
const bracketTax=(b,x)=>{let tax=0,rate=0;(b||[[0,0]]).forEach((q,i)=>{const lo=q[0],hi=i+1<b.length?b[i+1][0]:Infinity;if(x>lo){tax+=(Math.min(x,hi)-lo)*q[1];rate=q[1]}});return {tax,rate}};
/* plus a county's local income tax where it covers the whole county (New York City, Maryland and Indiana counties,
   Philadelphia, Louisville, St. Louis, Portland-area taxes): on state taxable income, or on wages only (then it does
   not apply to investment income) */
function stateIncomeTax(st,income,filing,fips){const r=st&&(STATE_RULES.income||{})[st];if(!r)return null;const mfj=filing==='mfj';
  const x=Math.max(0,income-((r.std||[])[mfj?1:0]||0)),s=bracketTax(mfj?r.married:r.single,x);
  const l=fips&&(STATE_RULES.local_income||{})[fips.slice(0,5)],lt=l?bracketTax(mfj?l.married:l.single,l.wages?income:x):null;
  return {tax:Math.round(s.tax+(lt?lt.tax:0)),std:(r.std||[])[mfj?1:0]||0,rate:s.rate+(lt&&!l.wages?lt.rate:0),itemize:!!r.itemize,src:r,local:l?{name:l.name,tax:Math.round(lt.tax),rate:lt.rate,wages:l.wages,u:l.u}:null}}
/* state-level transfer taxes for counties and ZIPs (metros carry their own state and local rules) */
/* plus county-wide (or county = city) taxes where the county has them; a county tax can replace a state-level one
   (San Francisco's tax replaces California's county rate, Miami-Dade's deed stamps replace Florida's) */
function stateTT(st,fips){const r=st&&(STATE_RULES.transfer||{})[st],c=fips&&(STATE_RULES.county_transfer||{})[fips.slice(0,5)];if(!r&&!c)return null;
  const rep=new Set((c&&c.replaces_state)||[]),taxes=((r&&r.taxes)||[]).filter(x=>!rep.has(x.name)).concat((c&&c.taxes)||[]);
  return {tt:taxes,ttSrc:taxes.filter(x=>x.source_url).map(x=>({t:x.name+(x.scope==='statewide county rate'?' (statewide county rate)':''),u:x.source_url})),note:r&&r.note,county:!!(c&&c.taxes&&c.taxes.length)}}
function stateTaxHint(){const el=document.getElementById('stMode'),h=el&&el.closest('.f').querySelector('.hint');if(!h)return;
  const m=selMetro(),st=stateOf(m),r=st&&(STATE_RULES.income||{})[st];
  if(P.stMode!=='auto'){h.innerHTML='your own figures below';return}
  if(!r){h.innerHTML=m&&m.slug==='us'?'the whole U.S. has no single state: enter your state\'s figures (set to manual)':'no state data for this location: enter your figures (set to manual)';return}
  h.innerHTML=r.none?`${st}: no income tax on wages${r.cg&&!/^(none|n\/a)/i.test(r.cg)?'. '+r.cg.split(/(?<=\.)\s/)[0]:''} ${linkTo(r.u)}`:
    `${st} ${r.year}: about ${fmtFull(P.stTax)} a year at your income, ${pct(P.stRate,2)} on extra income; ${r.itemize?'deducts':'does not deduct'} mortgage interest and property tax${r.partial?' (partly)':''}. ${linkTo(r.u)}`+
    (P.stLocal?` Includes ${P.stLocal.name} local income tax, ${fmtFull(P.stLocal.tax)}${P.stLocal.wages?' (on wages only)':''} ${linkTo(P.stLocal.u)}.`:` Exemptions and credits are not included${m&&m.county?'':'; city and county income taxes are included only when you pick a county or ZIP code'}.`)}
/* new-buyer property tax: Census rates average over all owners; scale by recent buyers ÷ all owners in the state */
function nbK(st){return ((STATE_RULES.newbuyer||{}).k||{})[st]||1}
function nbNote(st){const k=nbK(st);return Math.abs(k-1)<0.005?'':`, × ${k.toFixed(3)} for a new buyer (owners who moved in within about 4 years vs all owners in the state, ACS microdata)`}
/* homestead exemption (dollars off the taxed value) and credit (dollars off the bill) for the location: a county rule
   (Cook County) or the state's; only owner-occupied, statewide ones (data/state_rules.json) */
function homesteadFor(m){const st=stateOf(m),c=m&&m.fips&&(STATE_RULES.homestead_county||{})[m.fips.slice(0,5)];return c||(st&&(STATE_RULES.homestead||{})[st])||null}
/* the location's property tax as the model uses it: Census effective rate (for a new buyer) at the typical value V,
   turned into the rate before the exemption so that rate × (V − exemption) − credit = effective rate × V */
function locTax(m){const eff=m.acs&&m.acs.rate!=null?m.acs.rate:m.ptax,h=homesteadFor(m),V=m.P;
  if(eff==null||!isFinite(eff))return null;if(!h||!V)return {rate:eff,ex:0,credit:0,h:null};
  const ex=h.ex||0,credit=h.credit||0;if(V-ex<0.3*V)return {rate:eff,ex:0,credit:0,h};
  return {rate:Math.round((eff/100*V+credit)/(V-ex)*1e5)/1e3,ex,credit,h}}
let CAP_FROM_LOC=false,TAX_FROM_LOC=null;
/* saved setups from before a location rule existed: fill the location's values for settings left at the old default */
function applyStateCap(m){if(CAP_FROM_LOC){document.getElementById('ptaxCap').value=m.ptaxCap||0;document.getElementById('ptaxCapCPI').value=m.ptaxCapCPI?'1':'0'}CAP_FROM_LOC=false;
  if(TAX_FROM_LOC){const old=TAX_FROM_LOC;TAX_FROM_LOC=null;if(!(+old.floodIns>0)){const e=document.getElementById('floodIns');e.value=m.flood?m.flood.avg:0;fmtMoneyEl(e)}const lt=locTax(m),k=nbK(stateOf(m)),was=(m.acs&&m.acs.rateAll!=null?m.acs.rateAll:(lt?lt.rate:0)/k);
    if(lt&&(old.ptax==null||Math.abs(+old.ptax-was)<0.006||Math.abs(+old.ptax-(m.ptax||0)/k)<0.006)){document.getElementById('ptax').value=lt.rate;document.getElementById('hsEx').value=lt.ex;fmtMoneyEl(document.getElementById('hsEx'));document.getElementById('hsCredit').value=lt.credit}
    else if(old.ptax!=null)document.getElementById('ptax').value=old.ptax}}
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
  if(tag){tag.title=est?(auto?`Estimated for a ${(document.getElementById('beds')||{value:'3'}).value==='any'?'typical':(document.getElementById('beds')||{value:'3'}).value+'-bedroom'} home at this price (${m.name}); type a rent to use your own`:`Estimate from price: $${est.toLocaleString('en-US')}/mo`):'';
    tag.innerHTML=!est?'':auto?'est.':'<button type="button" class="qlink" data-act="rent-est">use est.</button>'}
  if(!est){if(h)h.textContent='';return}
  if(auto)document.getElementById('rent0').value=est;
  const typ=typicalRent(m,beds),$=x=>'$'+Math.round(x).toLocaleString('en-US');
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
function buildMetroSelect(){const sel=document.getElementById('metro'),opt=m=>`<option value="${m.slug}">${m.name}</option>`,cty=COUNTIES?`<option value="__county">${COUNTIES.zip?'Type a county or ZIP code…':'Type a U.S. county…'}</option>`:'';
  sel.innerHTML=opt(METROS[0])+cty+`<optgroup label="Metro areas">${METROS.slice(1).filter(m=>!m.county).map(opt).join('')}</optgroup>`}
/* ---- counties: any of ~3,200 counties from Census ACS, added to the location list as they are picked ----
   The list is loaded on first use (fetched from data/counties.json, or embedded in the artifact build) and scaled here:
   value × kP (the U.S. median's change to today's Zillow typical value), tax ÷ value, and the state's insurance.
   Rent: HUD's Fair Market Rents by bedrooms when available (they include utilities, so × the county's contract-to-gross
   rent ratio), else the ACS median contract rent × kR. Price history: FHFA's county index, loaded per state on pick. */
let COUNTY_ROWS=null,COUNTY_LOAD=null;const COUNTY_HPI={};
const getJSON=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()});
/* data that failed to load, named under the answer so a result missing it isn't silently wrong */
const LOAD_WARN=new Set();
function loadCounties(){if(COUNTY_ROWS)return Promise.resolve(COUNTY_ROWS);if(COUNTY_LOAD)return COUNTY_LOAD;const C=COUNTIES,FMR=C.fmr;
  const rows=C.rows?Promise.resolve({rows:C.rows}):getJSON(C.file);
  const fmr=!FMR?Promise.resolve(null):FMR.rows?Promise.resolve({rows:FMR.rows}):getJSON(FMR.file).catch(()=>{LOAD_WARN.add('HUD county rents (Census rents used)');return null});
  // county-level rules (local income taxes, county transfer taxes) come with the county list on the site
  const rules=STATE_RULES.countyFile&&!STATE_RULES.county_transfer?getJSON(STATE_RULES.countyFile).then(r=>{for(const k of ['local_income','county_transfer','homestead_county'])STATE_RULES[k]=r[k]}).catch(()=>{LOAD_WARN.add('county tax rules (county transfer and local income taxes left out)')}):Promise.resolve();
  const fl=C.flood&&C.flood.file?getJSON(C.flood.file).then(x=>{C.flood=x}).catch(()=>{C.flood=null;LOAD_WARN.add('flood insurance data (flood cost set to $0)')}):Promise.resolve();
  COUNTY_LOAD=Promise.all([rows,fmr,rules,fl]).then(([d,f])=>COUNTY_ROWS=d.rows.map(([fips,name,P,rent,tax,gross])=>{
    const h=f&&f.rows[fips],cg=rent&&gross?Math.min(1,Math.max(0.6,rent/gross)):C.cg;
    return [fips,name,Math.round(P*C.kP/100)*100,rent?Math.round(rent*C.kR/10)*10:null,tax?Math.round(tax/P*1e4)/100:null,
      (C.stateIns||{})[name.split(', ').pop()]||null,h&&h[2]?h.map(x=>Math.round(x*cg/10)*10):null,cg]})).catch(e=>{COUNTY_LOAD=null;throw e});return COUNTY_LOAD}
function countyMetro(slug){if(!COUNTIES||!COUNTY_ROWS)return null;if(/^zip:/.test(slug||''))return zipMetro(slug);if(!/^cty:/.test(slug||''))return null;const have=METROS.find(m=>m.slug===slug);if(have)return have;
  const r=COUNTY_ROWS.find(x=>x[0]===slug.slice(4));if(!r)return null;const [fips,name,Pc,rent,ptax,ins,fmr,cg]=r,us=METROS[0],C=COUNTIES;
  const st=(STATE_RULES.names||{})[name.split(', ').pop()]||null,sc=stateCap(st);
  const stt=stateTT(st,fips);
  const m={slug,fips,county:true,name,st,P:Pc,rent:fmr?fmr[2]:rent||us.rent,ptax:ptax!=null?Math.round(ptax*nbK(st)*1000)/1000:us.ptax,ins:ins||us.ins,ptaxCap:sc.cap,ptaxCapCPI:sc.cpi,hpi:null,acs:null,tt:stt?stt.tt:null,ttSrc:stt?stt.ttSrc:[],ttState:true,ttCounty:!!(stt&&stt.county),
    beds:fmr?{'0':fmr[0]/fmr[2],'1':fmr[1]/fmr[2],'2':1,'3':fmr[3]/fmr[2],'4':fmr[4]/fmr[2]}:null,
    src:{price:{t:`median home value, Census ACS ${C.span}, × ${C.kP.toFixed(3)} (the U.S. median's change to today's Zillow typical value)`,u:C.u},
      rent:fmr?{t:`HUD Fair Market Rent FY${C.fmr.fy} for the bedrooms chosen (2-bedroom $${fmr[2].toLocaleString('en-US')} without utilities: HUD's figure includes them, × ${cg.toFixed(2)}, the county's ACS contract-to-gross rent ratio)`,u:C.fmr.u}
        :{t:rent?`median contract rent, Census ACS ${C.span}, × ${C.kR.toFixed(3)} (scaled to today's Zillow typical U.S. rent)`:'no county rent estimate; U.S. typical rent',u:C.u},
      ptax:{t:ptax!=null?`median tax ÷ median value, Census ACS ${C.span}${nbNote(st)}`:'U.S. effective rate',u:C.u},
      ins:{t:ins?`median paid by owners of one-family homes, ${name.split(', ').pop()} (Census ACS microdata, brought to today with the BLS insurance price index)`:'U.S. figure',u:ins?C.insU:null}}};
  m.flood=countyFlood(fips);inheritMetroRent(m);addLocation(m);return m}
/* flood insurance averaged over all homes in the county: share with an NFIP policy × typical policy cost (FEMA) */
function countyFlood(fips){const F=COUNTIES.flood;const v=F&&F.pen&&F.pen[fips];if(!v)return null;const cost=F.cost[fips]||F.state_cost[fips.slice(0,2)]||0;
  return {avg:Math.round(v[0]*cost/10)*10,take:v[0],sfha:v[1],cost}}
/* a county inside one of the app's metros uses that metro's BLS rent history (only metros have one) */
function inheritMetroRent(m){const slug=(COUNTIES.metroOf||{})[m.fips],mm=slug&&METROS.find(x=>x.slug===slug);if(!mm||!mm.rentG)return;
  m.rentG=mm.rentG;m.rentSrc={t:`${mm.rentSrc?mm.rentSrc.t:'BLS rent index'}, for ${mm.name} (this county is in the metro: Census CBSA delineation)`,u:mm.rentSrc?mm.rentSrc.u:COUNTIES.metroOfU};m.inMetro=mm.name}
function addLocation(m){METROS.push(m);const sel=document.getElementById('metro'),o=document.createElement('option');o.value=m.slug;o.textContent=m.name;
  sel.insertBefore(o,sel.querySelector('option[value="__county"]'));loadCountyHpi(m)}
/* ---- ZIP codes: Census ACS by ZIP Code Tabulation Area for value, rent and tax, HUD Small Area FMRs for rent by
   bedrooms, and the county (most land) for insurance and price history. Files are split by the ZIP's first two digits. */
const ZIP_FILES={},ZIP_DATA={};
function loadZipFile(z){const p=z.slice(0,2),Z=COUNTIES.zip;if(!Z)return Promise.resolve(null);
  return ZIP_FILES[p]=ZIP_FILES[p]||getJSON(Z.dir+p+'.json').then(d=>ZIP_DATA[p]=d).catch(()=>{delete ZIP_FILES[p];return null})}
function ensureZip(z){return loadCounties().then(()=>loadZipFile(z)).then(()=>zipMetro('zip:'+z))}
function zipMetro(slug){const have=METROS.find(m=>m.slug===slug);if(have)return have;const z=slug.slice(4),d=ZIP_DATA[z.slice(0,2)];if(!d)return null;const r=d.zips[z];if(!r)return null;const [fips,val,rent,tax,gross,sa]=r;
  const c=COUNTY_ROWS.find(x=>x[0]===fips),C=COUNTIES;if(!c)return null;const [,cname,cP,_crent,_cptax,_ins,_cfmr,ccg]=c;
  const cg=rent&&gross?Math.min(1,Math.max(0.6,rent/gross)):ccg,adjR=sa?sa.map(x=>Math.round(x*cg/10)*10):null,M=d.meta;
  const cm=countyMetro('cty:'+fips);
  const m={slug,fips,zip:z,county:true,name:`ZIP ${z} · ${cname}`,P:val?Math.round(val*C.kP/100)*100:cP,ptax:tax&&val?Math.round(tax/val*1e4*nbK(cm.st))/100:cm.ptax,
    rent:adjR?adjR[2]:cm.rent,beds:adjR?{'0':adjR[0]/adjR[2],'1':adjR[1]/adjR[2],'2':1,'3':adjR[3]/adjR[2],'4':adjR[4]/adjR[2]}:cm.beds,
    ins:cm.ins,flood:cm.flood,st:cm.st,ptaxCap:cm.ptaxCap,ptaxCapCPI:cm.ptaxCapCPI,hpi:null,acs:null,tt:cm.tt,ttSrc:cm.ttSrc,ttState:true,ttCounty:cm.ttCounty,rentG:cm.rentG,rentSrc:cm.rentSrc,inMetro:cm.inMetro,
    src:{price:val?{t:`median home value, ZIP ${z}, ${M.acs.t.split(',')[0]}, × ${C.kP.toFixed(3)} (the U.S. median's change to today's Zillow typical value)`,u:M.acs.u}:cm.src.price,
      rent:adjR?{t:`${M.safmr.t}, ZIP ${z}, for the bedrooms chosen (2-bedroom $${adjR[2].toLocaleString('en-US')} without utilities: HUD's figure includes them, × ${cg.toFixed(2)}, the ZIP's ACS contract-to-gross rent ratio)`,u:M.safmr.u}:cm.src.rent,
      ptax:tax&&val?{t:`median tax ÷ median value, ZIP ${z}, ${M.acs.t.split(',')[0]}${nbNote(cm.st)}`,u:M.acs.u}:cm.src.ptax,ins:cm.src.ins}};
  addLocation(m);return m}
/* FHFA county index for a county, from its state's file; once it arrives the backtest, Monte Carlo and the
   "<county> 19xx–2025 avg" preset use it like a metro's history */
function loadCountyHpi(m){const H=COUNTIES.hpi;if(!H||m.hpi)return;const st=m.fips.slice(0,2);
  (COUNTY_HPI[st]=COUNTY_HPI[st]||getJSON(H.dir+st+'.json').catch(()=>{delete COUNTY_HPI[st];return null})).then(d=>{
    const v=d&&d.counties[m.fips];if(!v||Object.keys(v).length<10)return;
    m.hpi={values:v,basis:'all-transactions',volK:H.volK};m.hpiSrc={t:`FHFA county index, ${m.name} (all-transactions, developmental); volatility ratio ${H.volK} (metro median)`,u:H.u};m.src.hpi=m.hpiSrc;
    if(selMetro()!==m)return;showMetroPreset(m);
    MC=null;LAST_KEY='';update()})}
/* a saved or shared setup whose location is a county: load the list, then select it */
function restoreCounty(slug){if(!COUNTIES||!/^(cty|zip):/.test(slug||'')||countyMetro(slug))return;
  (/^zip:/.test(slug)?ensureZip(slug.slice(4)):loadCounties()).then(()=>{const m=countyMetro(slug);if(!m)return;document.getElementById('metro').value=slug;updateMetroHints(m);applyStateCap(m);update()}).catch(()=>{})}
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
  set('P',m.P);set('floodIns',m.flood?m.flood.avg:0);{const lt=locTax(m);if(lt){set('ptax',lt.rate);set('hsEx',lt.ex);set('hsCredit',lt.credit)}}set('ins',m.ins);set('ptaxCap',m.ptaxCap||0);document.getElementById('ptaxCapCPI').value=m.ptaxCapCPI?'1':'0';document.getElementById('rentMode').value='auto';applyRentMode();
  showMetroPreset(m);
  updateMetroHints(m);}
/* the "<location> 19xx–2025 avg" growth preset, shown when the location has its own price history */
function showMetroPreset(m){const ms=metroStart(m),btn=document.getElementById('metroPreset');btn.hidden=!ms;if(ms)btn.textContent=`${m.name} ${ms}–${LAST_Y} avg`}
function updateMetroHints(m){
  const hint=(id,html)=>{const el=document.getElementById(id);const h=el&&el.closest('.f').querySelector('.hint');if(h)h.innerHTML=html};
  const base=Object.fromEntries(F.map(f=>[f[1],f[5]]));
  {const c=stateCap(stateOf(m)).src;hint('ptaxCap',c?`${stateOf(m)}: ${c.note} ${linkTo(c.u)}`:(m.slug==='us'?base.ptaxCap:`no statewide cap found for ${stateOf(m)||'this location'}; local limits may apply`))}
  if(m.slug==='us'){['P','rent0','ptax','ins'].forEach(k=>hint(k,base[k]));return}
  const d=x=>x&&x.d?` (${x.d})`:'';
  hint('P',`${m.name}: ${m.src.price?m.src.price.t:''}${d(m.src.price)} ${srcObj(m.src.price)}`);
  hint('rent0',`${m.name}: ${m.src.rent?m.src.rent.t:''}${d(m.src.rent)} ${srcObj(m.src.rent)} · use a rental comparable to the home`);
  hint('ptax',`${m.src.ptax?m.src.ptax.t:''} ${srcObj(m.src.ptax)}`);
  hint('ins',`${m.src.ins?m.src.ins.t:''} ${srcObj(m.src.ins)}`);
  {const f=m.flood;hint('floodIns',f?`${m.name}: ${pct(f.take,1)} of homes carry NFIP flood insurance${f.cost?`, typically ${fmtFull(f.cost)}/yr`:''}; ${pct(f.sfha,0)} are in the high-risk zone where lenders require it. The default is the average over all homes; if this home is in a flood zone, use its quote. ${linkTo('https://www.fema.gov/about/openfema/data-sets')}`:'check FEMA flood zone or a quote; earthquake insurance is separate')}
  {const h=homesteadFor(m),st=stateOf(m),first=t=>(t||'').split(/(?<=\.)\s/)[0];
   hint('hsEx',h&&h.ex?`${m.fips&&(STATE_RULES.homestead_county||{})[m.fips.slice(0,5)]?first(h.note):`${st}: about ${fmt(h.ex)} off the taxed value${h.estimate?' (an estimate of its effect on the whole tax rate, since it covers only some levies)':''}`}. The property tax rate above is before the exemption, so the typical home pays the Census rate. ${linkTo(h.u)}`:
     `no statewide homestead exemption for ${st||'this location'} in the app's data; local ones may apply`);
   hint('hsCredit',h&&h.credit?`${st}: ${fmtFull(h.credit)} a year off the bill for an owner's primary residence. ${linkTo(h.u)}`:'none for this location in the app\'s data')}
  if(m.acs&&m.acs.rate!=null)hint('ptax',`${m.acs.name}: median tax ÷ median value, Census ACS ${m.acs.year} ${linkTo(m.acs.u)}${m.src.ptax?` · main county: ${m.src.ptax.t} ${srcObj(m.src.ptax)}`:''}`);
  hint('rent0',`${m.name}: ${m.src.rent?m.src.rent.t:''}${d(m.src.rent)} ${srcObj(m.src.rent)}${m.beds?'':' × Census ratio for the chosen bedrooms'}`);
  const tts=document.getElementById('ttBuy').closest('.f').querySelector('.hint');if(tts)tts.innerHTML=m.ttState?(m.tt&&m.tt.length?`${m.ttCounty?'State and county':stateOf(m)+' state-level'} taxes: `+m.ttSrc.map(x=>`${x.t} ${linkTo(x.u)}`).join(' · ')+(m.ttCounty?'. City taxes are not included; set to manual to add them.':'. County and city transfer taxes are not included; set to manual to add them.'):`no state transfer tax in ${stateOf(m)||'this state'}; county or city taxes may apply`):m.ttSrc&&m.ttSrc.length?`${m.name}: `+m.ttSrc.map(x=>`${x.t} ${linkTo(x.u)}`).join(' · '):'no transfer taxes found for this location';
}


function dataAgeDays(){const d=new Date(SNAP.asOf+'T12:00:00');return isFinite(d.getTime())?Math.floor((Date.now()-d.getTime())/864e5):0}
function dataAgeText(){const n=dataAgeDays();return n<=1?'updated today':n<14?`${n} days ago`:n<60?`${Math.round(n/7)} weeks ago`:`${Math.round(n/30)} months ago`}
function staleNotice(){const n=dataAgeDays();let el=document.getElementById('stale');
  const off=typeof navigator!=='undefined'&&navigator.onLine===false;
  if(n<21&&!off){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='stale';el.className='stale';el.setAttribute('role','status');document.getElementById('snap').insertAdjacentElement('beforebegin',el)}
  const when=new Date(SNAP.asOf+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  el.innerHTML=(n>=21?`<strong>Market data is from ${when}</strong>, ${dataAgeText()}. Mortgage rates and prices may have moved since; check today's rate with a lender or the linked sources and enter it in the settings.`:'')+
    (off?`${n>=21?' ':''}<strong>Offline</strong>: using the data saved with the app.`:'')}
addEventListener('online',()=>{try{staleNotice()}catch(e){}});addEventListener('offline',()=>{try{staleNotice()}catch(e){}});
