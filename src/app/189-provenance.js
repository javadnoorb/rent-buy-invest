/* ===================== Where each setting's value comes from ===================== */
/* One entry per setting: what kind of default it has and the sources behind it. The text shown is the setting's own
   hint (it follows the location), except for the historical averages, which say which years they average. Settings
   switched to an automatic mode (marginal rate from income, state tax from the location, transfer taxes, rent from
   price) report that rule instead. tests/trace.js fails when a setting has no entry, or a sourced default no link.
   [kind, SRC keys]. Kinds: place (market data for the U.S., location data elsewhere), market, history, research,
   rule (a location's tax rule; none where the app has no rule for the place), assumption, example, none (0 = off),
   choice (a model option). */
const ORIGIN_KIND={market:'Market data today',location:'Location data',history:'Historical average',research:'Published research',
  rule:'Tax, loan or location rule',assumption:'Assumption',example:'Example value: enter yours',none:'Off unless you set it',choice:'Model option'};
const ORIGIN={P:['place',['zillow']],dp:['assumption'],rate:['market',['pmms']],rate15:['market',['pmms']],term:['choice'],loanType:['choice'],
  armRate:['research',['pmms']],armYears:['choice'],armMargin:['research'],fico:['choice',['llpa']],pts:['none'],ptsCut:['research'],close:['assumption'],
  pmi:['research',['pmiFM']],pmiScale:['choice',['fnmaMiCov']],pmiAppr:['choice',['fnmaMiEnd']],extraPay:['none'],extraMode:['choice'],
  refiOn:['choice'],rateLR:['market',['pmms']],glide:['assumption'],refiTh:['assumption'],refiCost:['assumption'],
  ptax:['place',['ptaxUS']],hsEx:['rule'],hsCredit:['rule'],ptaxCap:['rule'],ptaxCapCPI:['rule'],ins:['place',['ins']],maint:['research'],hoa:['none'],
  sell:['research'],ttAuto:['choice'],ttBuy:['rule'],ttSell:['rule'],insG:['research',['ppi_ins']],
  utilDiff:['assumption'],floodIns:['place',['fema']],moveIn:['none'],impShare:['assumption'],rMove:['research'],rMoveCost:['assumption'],broker:['none'],
  beds:['choice'],rentMode:['choice'],rent0:['place',['zillow']],renewGap:['research'],rins:['research'],
  gh:['history',['shiller','caseShiller','fhfa']],gr:['history',['fredRent']],inf:['history',['fredCPI']],rs:['history',['damo']],rb:['history',['damo']],rc:['history',['damo']],
  ws:['assumption'],wb:['assumption'],
  acct:['choice'],dy:['research'],fee:['assumption'],lev:['none'],spread:['research'],
  incGrowth:['research'],income:['example'],debt:['none'],taxOn:['choice'],filing:['choice',['irs26']],muMode:['choice'],mu:['example',['irs26']],
  stMode:['choice'],stTax:['example'],oth:['none'],stRate:['example'],stDed:['example'],ltcgMode:['choice'],ltcg:['example',['irs26']],
  hhRent:['none'],hhShare:['assumption'],hhVac:['research'],rentalOn:['choice'],dpR:['research'],ratePrem:['research'],vacR:['research'],mgmt:['research'],landShare:['assumption'],
  investShare:['assumption'],moveMode:['choice'],moveYear:['assumption'],volAdj:['choice'],heloc:['none'],hz:['research'],stressMult:['research'],
  forcedDisc:['research'],idio:['research'],idioMode:['choice'],gamma:['assumption']};
/* the series and the presets behind each historical average */
const HIST_SER={gh:'U.S. home prices',gr:'rents (BLS rent CPI)',inf:'consumer prices (BLS CPI)',rs:'S&P 500 total returns',rb:'10-year Treasury bond returns',rc:'3-month T-bill returns'};
const PRESET_NAME={long:`${Y0}–${LAST_Y} average`,modern:`1972–${LAST_Y} average`,fcst:'2026 professional forecasts',now:'latest 12 months'};
/* {id, label, kind, kindLabel, html, keys, value, changed, preset}: html is safe HTML with source links */
function settingOrigin(id){const o=ORIGIN[id];if(!o)return null;const el=document.getElementById(id);if(!el)return null;
  const m=selMetro(),us=!m||m.slug==='us',hintOf=x=>{const e=document.getElementById(x),h=e&&e.closest('.f').querySelector('.hint');return h?h.innerHTML.trim():''};
  let kind=o[0]==='place'?(us?'market':'location'):o[0],keys=(o[1]||[]).filter(k=>SRC[k]),html=hintOf(id),preset=null;
  const p=P||{};
  if((id==='mu'&&p.muMode==='auto')||(id==='ltcg'&&p.ltcgMode==='auto')){kind='rule';keys=['irs26'];html=`from your income and filing status with the 2026 federal ${id==='mu'?'brackets':'capital-gains thresholds'}`}
  else if(['stTax','stRate','stDed'].includes(id)&&p.stAutoOn){kind='rule';html=hintOf('stMode')}
  else if((id==='ttBuy'||id==='ttSell')&&p.ttRules){kind='rule';html=hintOf('ttBuy')}
  else if(id==='rent0'&&document.getElementById('rentMode').value==='auto'){kind=us?'market':'location';html=hintOf('rentMode')+(html?' · '+html:'')}
  else if(kind==='rule'&&['hsEx','hsCredit','ptaxCap','ptaxCapCPI','ttBuy','ttSell'].includes(id)){if(id==='ptaxCapCPI')html=hintOf('ptaxCap');if(id==='ttBuy'||id==='ttSell')html=hintOf('ttBuy');
    if(!/href=/.test(html)){kind='none';html=us?'no single rule for the whole U.S.; pick a location to apply its rules':(html||'none for this location in the app\'s data')}}
  else if(kind==='history'){const v=parseFloat(el.value);preset=Object.keys(PRESET_NAME).find(k=>PRESETS[k]&&Math.abs(PRESETS[k][id]-v)<0.006)||null;
    html=`${preset?PRESET_NAME[preset]:'your figure'}${preset==='long'||preset==='modern'?` of ${HIST_SER[id]}, compounded yearly (geometric mean)`:''}`}
  if(!html&&kind==='assumption')html=tag;
  const changed=isChanged(id)&&!(kind==='history'&&preset);
  return {id,label:settingLabel(id),kind,kindLabel:ORIGIN_KIND[kind],html,keys,value:el.value,changed,preset}}
/* origin as one line of HTML: "Freddie Mac PMMS, Oct 23 2026 · source (market data today)" */
function originHTML(o){if(!o)return '';const links=o.keys.filter(k=>!o.html.includes(SRC[k].u)).map(k=>sl(k,SRC[k].t.split(/[:(,]/)[0].trim())).join(' · ');
  return `${o.changed?'<b>you changed it</b> · default: ':''}${o.html}${links?' · '+links:''} ${o.kind==='assumption'&&/class="tag"/.test(o.html)?'':`<span class="muted">(${o.kindLabel.toLowerCase()})</span>`}`}
