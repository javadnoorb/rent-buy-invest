/* ===================== Inputs ===================== */
// [group,id,label,default,step,hint,kind,options]
const F=[
 ['home','P','Home price ($)',V.zhvi,1000,`Zillow typical U.S. home value · ${sl('zillow')}`],
 ['home','dp','Down payment (%)',20,1,''],
 ['home','rate','Mortgage rate, 30-yr (%)',V.rate30,0.01,`Freddie Mac PMMS, ${SNAP.rateDate} · ${sl('pmms')}`],
 ['home','rate15','Mortgage rate, 15-yr (%)',V.rate15,0.01,`used when term is 15 years · ${sl('pmms')}`],
 ['home','term','Term',30,null,'','sel',[[30,'30 years'],[15,'15 years']]],
 ['home','loanType','Loan type','fixed',null,'FHA: '+resHint('fha',''),'sel',[['fixed','Conventional fixed'],['fha','FHA fixed (3.5% min. down)'],['arm','Adjustable rate (ARM)']]],
 ['home','armRate','ARM starting rate (%)',D0.armRate,0.01,resHint('arm')],
 ['home','armYears','ARM fixed period','5',null,'rate caps 2/1/5 for 5 years, 5/1/5 for 7 years (Fannie Mae SOFR ARMs)','sel',[['5','5 years (5/6 ARM)'],['7','7 years (7/6 ARM)']]],
 ['home','armMargin','ARM margin over the index (pts)',D0.armMargin,0.05,resHint('armMargin')],
 ['home','pts','Discount points paid',0,0.25,'1 point = 1% of the loan, paid at closing; deductible in the year paid when you itemize'],
 ['home','ptsCut','Rate cut per point (pts)',D0.ptsCut,0.05,resHint('pts')],
 ['home','close','Buyer closing costs (% of price)',D0.close,0.1,resHint('close')],
 ['home','fico','Credit score','760-779',null,'Fannie Mae price adjustments by credit score','sel',[['780+','780 or higher'],['760-779','760–779'],['740-759','740–759'],['720-739','720–739'],['700-719','700–719'],['680-699','680–699'],['660-679','660–679'],['640-659','640–659'],['639-','639 or lower']]],
 ['home','pmi','PMI at 3–5% down (% of loan / yr)',0.6,0.05,`middle of Freddie Mac's $30–70 a month per $100k borrowed (0.36–0.84%/yr) ${linkTo('https://myhome.freddiemac.com/buying/breaking-down-pmi')}; applies if down payment &lt; 20%`],
 ['home','pmiScale','Lower PMI with more down',1,null,`scaled by Fannie Mae's required coverage: 35% of the loan at 3–5% down, 30% at 5–10%, 25% at 10–15%, 12% at 15–20% ${linkTo('https://selling-guide.fanniemae.com/sel/b7-1-02/mortgage-insurance-coverage-requirements')}`,'sel',[[1,'Yes'],[0,'No (same rate)']]],
 ['home','pmiAppr','Remove PMI early with an appraisal',0,null,'at 75% of current value after 2 years, 80% after 5 (conventional loans)','sel',[[0,'No'],[1,'Yes']]],
 ['home','extraPay','Extra each month ($ / month)',0,50,'part of the monthly budget; the renter invests the same amount'],
 ['home','extraMode','Put the extra toward','prepay',null,'compare paying the mortgage down early with investing the same money','sel',[['prepay','Mortgage principal'],['invest',"Buyer's portfolio"]]],
 ['refi','refiOn','Allow refinancing',1,null,'Refinance when the market rate falls far enough below your loan rate','sel',[[1,'Yes'],[0,'No']]],
 ['refi','rateLR','Expected market rate later (%)',V.rate30,0.05,`Projection only; backtest and Monte Carlo use historical rates. 10-yr Treasury ${V.tsy10}% ${sl('tsy')}${RES.mortSpread&&RES.mortSpread.u?` · typical mortgage spread ${linkTo(RES.mortSpread.u)}`:''}`],
 ['refi','glide','Years to reach that rate',5,1,''],
 ['refi','refiTh','Refinance when rate drops by (pts)',1.0,0.1,tag+' common rule of thumb 0.75–1.5'],
 ['refi','refiCost','Refinance cost (% of balance)',2,0.1,tag+' paid in cash'],
 ['own','ptax','Property tax (% of value / yr)',V.ptaxUS,0.01,`U.S. median tax ÷ median value, Census ACS · ${sl('ptaxUS')}`],
 ['own','hsEx','Homestead exemption ($ off taxed value)',0,1000,'set from the location\'s state; owner-occupied primary residence'],
 ['own','hsCredit','Homestead credit ($ off tax / yr)',0,50,'set from the location\'s state'],
 ['own','ptaxCap','Assessment growth cap (% / yr, 0 = none)',0,0.5,'set from the location\'s state when you pick one; e.g. 2 for California Prop 13'],
 ['own','ptaxCapCPI','Cap also limited to inflation',0,null,'California, Florida, Michigan: the lower of the cap or inflation; Georgia: inflation only (cap 0)','sel',[[0,'No'],[1,'Yes']]],
 ['own','ins','Home insurance ($ / yr)',V.insUS,10,`U.S. median paid by homeowners · ${sl('ins')}`],
 ['own','maint','Maintenance (% of value / yr)',D0.maint,0.1,resHint('maint')],
 ['own','hoa','HOA ($ / month)',0,10,''],
 ['own','sell','Selling costs, before transfer taxes (% of price)',D0.sell,0.1,resHint('sell')],
 ['own','ttAuto','Transfer and recording taxes','auto',null,'state, county and city taxes on the sale and the mortgage','sel',[['auto','From location'],['manual','Enter manually']]],
 ['own','ttBuy','Transfer taxes paid by buyer (% of price)',0,0.01,''],
 ['own','ttSell','Transfer taxes paid by seller (% of price)',0,0.01,''],
 ['own','insG','Insurance growth above inflation (pts / yr)',D0.insG,0.1,resHint('insG')],
 ['other','utilDiff','Extra utilities as owner ($ / month)',100,10,tag+' bigger home, plus water/sewer/trash often included in rent'],
 ['other','floodIns','Flood / earthquake insurance ($ / yr)',0,50,'separate from homeowners policies; check FEMA flood zone or a quote'],
 ['other','moveIn','Buyer one-time move-in costs ($)',0,500,'furnishing, mansion or recording taxes; the renter invests this instead'],
 ['other','impShare','Share of upkeep that is improvements (%)',50,5,tag+' improvements add to the home\'s tax basis'],
 ['other','rMove','Renter moves per year (%)',D0.rMove,0.5,resHint('rMove')],
 ['other','rMoveCost','Cost per renter move ($)',2500,100,tag+' movers, applications, overlap rent'],
 ['other','broker','Broker fee per move (months of rent)',0,0.25,'some cities charge tenants about one month'],
 ['rent','beds','Bedrooms (sets comparable rent)','3',null,resHint('beds'),'sel',[['any','Any (typical rental)'],['1','1'],['2','2'],['3','3'],['4','4 or more']]],
 ['rent','rentMode','Rent','auto',null,'typical rent for the location, scaled to your home price','sel',[['auto','Estimate from home price'],['manual','Enter my own']]],
 ['rent','rent0','Rent ($ / month)',Math.round(V.zori*(D0.bedRatio['3']||1)/10)*10,10,`Zillow typical U.S. rent $${V.zori.toLocaleString('en-US')} × Census 3-bedroom ratio · ${sl('zillow')}`],
 ['rent','renewGap','Lease renewals below market growth (pts / yr)',D0.renewGap,0.25,resHint('renew')],
 ['rent','rins',"Renter's insurance ($ / yr)",D0.rins||0,10,resHint('rins')],
 ['mkt','gh','Home appreciation (% / yr)',PRESETS.long.gh,0.1,`FHFA U.S. index ${V.hpiYoY>=0?'+':''}${V.hpiYoY}% over 12 months ${sl('fhfaUS')}`],
 ['mkt','gr','Rent growth (% / yr)',PRESETS.long.gr,0.1,`Zillow asking rents ${V.zoriYoY>=0?'+':''}${V.zoriYoY}% YoY ${sl('zillow')}`],
 ['mkt','inf','Inflation (% / yr)',PRESETS.long.inf,0.1,`CPI-U ${V.cpiYoY}% YoY ${sl('cpi')}`],
 ['mkt','rs','Stock return (% / yr)',PRESETS.long.rs,0.1,`S&P 500 with dividends ${sl('damo')}`],
 ['mkt','rb','Bond return (% / yr)',PRESETS.long.rb,0.1,`10-yr Treasury yields ${V.tsy10}% now ${sl('tsy')}`],
 ['mkt','rc','Cash / T-bill return (% / yr)',PRESETS.long.rc,0.1,`3-mo T-bill ${sl('damo')}`],
 ['mkt','ws','Portfolio: stocks (%)',100,5,''],
 ['mkt','wb','Portfolio: bonds (%)',0,5,'remainder in T-bills'],
 ['inv','acct','Account type','taxable',null,'Taxable: dividends and interest taxed yearly, gains at sale. Sheltered: no tax (Roth-like).','sel',[['taxable','Taxable brokerage'],['sheltered','Tax-sheltered']]],
 ['inv','dy','Stock dividend yield (% / yr)',D0.dy,0.05,resHint('dy')],
 ['inv','fee','Fund fees (% / yr)',0.05,0.01,tag+' broad index fund'],
 ['inv','lev','Leverage on portfolio (×)',1,0.1,'1 = none. Above 1 borrows to invest, to match the buyer\'s leverage.'],
 ['inv','spread','Borrowing spread over T-bills (pts)',D0.spread,0.1,resHint('spread')],
 ['tax','incGrowth','Income growth (% / yr)',D0.incGrowth,0.25,resHint('wage')],
 ['tax','income','Household income ($ / yr)',150000,1000,'gross; sets the tax bracket, SALT phase-out and affordability check. Example value, enter yours.'],
 ['tax','debt','Other debt payments ($ / month)',0,50,'car, student loans, cards; for the back-end debt ratio'],
 ['tax','taxOn','Model taxes',1,null,'','sel',[[1,'Yes'],[0,'No']]],
 ['tax','filing','Filing status','single',null,`2026 standard deduction $16,100 / $32,200 ${sl('irs26')}`,'sel',[['single','Single'],['mfj','Married joint']]],
 ['tax','muMode','Marginal rate','auto',null,'','sel',[['auto','From income (2026 brackets)'],['manual','Enter manually']]],
 ['tax','mu','Marginal federal rate (%)',24,1,`2026 brackets ${sl('irs26')}`],
 ['tax','stMode','State income tax','auto',null,'state brackets for 2026 by the location\'s state; local income taxes not included','sel',[['auto','From the location\'s state'],['manual','Enter manually']]],
 ['tax','stTax','State & local income tax ($ / yr)',8000,500,`counts toward SALT cap $40,400 ${sl('salt')}`],
 ['tax','oth','Other itemized deductions ($ / yr)',0,500,'charity etc.'],
 ['tax','stRate','State tax on investment income &amp; gains (%)',0,0.5,'add your state rate, e.g. 5 in Massachusetts'],
 ['tax','stDed','State deducts mortgage interest &amp; property tax',0,null,'some states (e.g. California) allow it, Massachusetts does not','sel',[[0,'No'],[1,'Yes']]],
 ['tax','ltcgMode','Capital-gains rate','auto',null,'0%, 15% or 20% by taxable income (2026 thresholds)','sel',[['auto','From income (2026 brackets)'],['manual','Enter manually']]],
 ['tax','ltcg','Capital-gains rate (%)',15,1,`home gain exclusion ${sl('irs121')} · interest limit ${sl('irs936')}`],
 ['alt','hhRent','House-hack: rent from part of your home ($ / month)',0,25,'e.g. a room or basement unit; taxed after the rented share of costs. '+resHint('hhTax','')],
 ['alt','hhShare','Share of the home rented out (%)',25,5,'splits interest, tax and upkeep between personal and rental use'],
 ['alt','hhVac','House-hack vacancy (%)',D0.vacR,0.5,resHint('vac')],
 ['alt','rentalOn','Show path: rent + buy a rental property',0,null,'Uses the same starting cash as a down payment on a rental priced at your price-to-rent ratio','sel',[[0,'No'],[1,'Yes']]],
 ['alt','dpR','Rental down payment (%)',D0.dpR,1,resHint('dpR')],
 ['alt','ratePrem','Investment-property rate premium (pts)',D0.ratePrem,0.05,resHint('ratePrem')],
 ['alt','vacR','Rental vacancy (%)',D0.vacR,0.5,resHint('vac')],
 ['alt','mgmt','Property management fee (% of rent)',D0.mgmt,0.5,resHint('mgmt')],
 ['alt','landShare','Land share of price, not depreciable (%)',20,1,tag+' depreciation over 27.5 years and 25% recapture '+resHint('dep','')],
 ['life','investShare','Share of monthly savings actually invested (%)',100,5,'100 = every dollar of difference is invested; lower if some would be spent'],
 ['life','moveMode','Planned move','none',null,'Sell at a set year, then buy again or rent. Both households move.','sel',[['none','No planned move'],['buy','Sell and buy again'],['rent','Sell and rent']]],
 ['life','moveYear','Move in year',7,1,'must be before the horizon; the new home costs what the old one sells for'],
 ['life','volAdj','Scale FHFA price swings to Case-Shiller size','1',null,'FHFA indexes exclude jumbo loans and swing less; on = keep their timing and long-run growth but match Case-Shiller\'s volatility (one ratio per location)','sel',[['1','Yes'],['0','No']]],
 ['life','heloc','Home-equity line up to (% of home value)',0,5,'0 = none; counted as an emergency reserve in the liquidity checks, not drawn'],
 ['life','hz','Chance of moving each year (%)',D0.hz,0.5,resHint('hazard')],
 ['life','stressMult','Moving more likely in bad years (×)',D0.stressMult,0.25,resHint('stress')],
 ['life','forcedDisc','Price discount on a forced sale (%)',D0.forcedDisc,0.5,resHint('forced')],
 ['life','idio','Own-home price risk (% s.d.)',D0.idio,0.5,resHint('idio')],
 ['life','idioMode','Own-home risk model','sale',null,'One-time shock at sale (Giacoletti 2021: idiosyncratic risk does not grow with holding period) or compounding each year (older estimates)','sel',[['sale','One-time at sale'],['yearly','Compounds yearly']]],
 ['life','gamma','Risk aversion γ',3,0.5,'used for certainty equivalents; 0 = risk-neutral, 2–5 typical'],
];
const DEF={};F.forEach(f=>DEF[f[1]]=f[3]);
const NUMERIC=F.filter(f=>f[6]!=='sel').map(f=>f[1]);
function buildInputs(){
  F.forEach(([g,id,lab,def,step,hint,kind,opts])=>{
    const box=document.getElementById('g-'+g);const d=document.createElement('div');d.className='f';
    let ctl;
    if(kind==='sel')ctl=`<select id="${id}">${opts.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select>`;
    else{const m=lab.match(/\(([^)]*)\)\s*$/);const u=m?m[1]:'';lab=lab.replace(/\s*\([^)]*\)\s*$/,'');
      const pre=/^\$/.test(u)?'$':'';let suf=u.replace(/^\$\s*/,'').replace(/\s*\/\s*/g,'/').replace('month','mo');
      if(/of (price|value|loan|balance)/.test(u)){lab+=` <span class="muted">(${u.replace(/^%\s*/,'').replace(/\s*\/\s*yr/,'').trim()})</span>`;suf=u.includes('/ yr')?'%/yr':'%'}
      if(/0 = none/.test(u)){suf='%/yr'}
      if(suf==='$')suf='';
      ctl=`<div class="inp">${pre?`<span class="pre">$</span>`:''}<input ${pre?'type="text" data-money="1"':`type="number" step="${step}"`} id="${id}" value="${def}" inputmode="decimal" autocomplete="off">${suf?`<span class="suf">${suf}</span>`:''}</div>`}
    d.innerHTML=`<label for="${id}">${lab}</label>${ctl}${hint?`<div class="hint">${hint}</div>`:''}`;
    box.appendChild(d);
    if(kind==='sel')document.getElementById(id).value=String(def);
  });
}
const unfmt=v=>typeof v==='string'?v.replace(/[,\s$]/g,''):v;
function numOf(id){return parseFloat(unfmt(document.getElementById(id).value))}
function getRaw(){const o={N:document.getElementById('N').value,metro:document.getElementById('metro').value};F.forEach(f=>o[f[1]]=unfmt(document.getElementById(f[1]).value));return o}
function fmtMoneyEl(el){if(document.activeElement===el)return;const v=unfmt(el.value);if(v===''||!isFinite(parseFloat(v)))return;el.value=Number(v).toLocaleString('en-US',{maximumFractionDigits:2})}
function formatMoneyAll(){document.querySelectorAll('[data-money]').forEach(fmtMoneyEl)}
/* Setups saved or shared before the rent estimate existed (and v4 saves, which marked them all "my own"): use the
   estimate when the saved rent is just the location's typical rent, i.e. nobody typed it; keep a typed rent. */
function rentWasDefault(o){const m=METROS.find(x=>x.slug===o.metro);if(!m||!m.rent)return false;
  return Math.abs(parseFloat(unfmt(o.rent0))-Math.round(m.rent*bedRatio(m,o.beds||'3')/10)*10)<=10}
function setRaw(o,legacy){if(o.rent0!=null&&(o.rentMode==null||(legacy&&o.rentMode==='manual')))o=Object.assign({},o,{rentMode:rentWasDefault(o)?'auto':'manual'});
  F.forEach(f=>{if(o[f[1]]!=null)document.getElementById(f[1]).value=o[f[1]]});if(o.N)document.getElementById('N').value=o.N;if(o.metro!=null&&!countyMetro(o.metro))restoreCounty(o.metro);if(o.metro!=null&&METROS.some(m=>m.slug===o.metro))document.getElementById('metro').value=o.metro}
function parseP(raw){
  const n=id=>{const x=parseFloat(raw[id]);return isFinite(x)?x:DEF[id]};
  const pc=id=>n(id)/100;
  const ws=Math.min(1,Math.max(0,pc('ws'))),wb=Math.min(1-ws,Math.max(0,pc('wb')));
  const term=parseInt(raw.term)||30,loanType=raw.loanType||'fixed',armYears=parseInt(raw.armYears)||5;
  let dp=Math.min(1,Math.max(0,pc('dp')));if(loanType==='fha')dp=Math.max(0.035,dp);
  const ttB=Math.max(0,pc('ttBuy')),ttS=Math.max(0,pc('ttSell'));
  // the projection starts in the snapshot's year; tax figures after TAX_YEAR are indexed by the inflation setting
  const y0=Math.max(TAX_YEAR,parseInt(SNAP.asOf)||TAX_YEAR),tk=taxIndex({y0,inf:pc('inf')});
  // state income tax from the location's state, unless entered manually (or the location is the whole U.S.)
  const locM=METROS.find(x=>x.slug===raw.metro),stAuto=(raw.stMode||'auto')==='auto'&&typeof stateIncomeTax==='function'?stateIncomeTax(stateOf(locM),Math.max(0,n('income')),raw.filing||'single',locM&&locM.fips):null;
  return {fico:raw.fico||'760-779',credit:typeof CREDIT!=='undefined'?CREDIT:null,stMode:raw.stMode||'auto',stAutoOn:!!stAuto,stLocal:stAuto&&stAuto.local,loanType,armYears,armRate:pc('armRate'),armMargin:pc('armMargin'),armCapInit:armYears>=7?0.05:0.02,armCapPer:0.01,armCapLife:0.05,pts:Math.max(0,n('pts')),ptsCut:pc('ptsCut'),
    insG:pc('insG'),ttBuy:ttB,ttSell:ttS,closeBase:pc('close'),sellBase:pc('sell'),beds:raw.beds||'3',
    P:Math.max(1,n('P')),dp,rate:term===15?pc('rate15'):pc('rate'),rate30:pc('rate'),rate15:pc('rate15'),term,close:pc('close')+ttB,pmi:pc('pmi'),pmiScale:raw.pmiScale!=='0'&&raw.pmiScale!==0,
    refiOn:raw.refiOn==='1'||raw.refiOn===1,rateLR:pc('rateLR'),glide:Math.max(0,n('glide')),refiTh:pc('refiTh'),refiCost:pc('refiCost'),
    ptax:pc('ptax'),hsEx:Math.max(0,n('hsEx')),hsCredit:Math.max(0,n('hsCredit')),ptaxCap:Math.max(0,pc('ptaxCap')),ptaxCapCPI:raw.ptaxCapCPI==='1'||raw.ptaxCapCPI===1,ins:n('ins'),maint:pc('maint'),hoa:n('hoa'),sell:pc('sell')+ttS,rent0:Math.max(0,n('rent0')),rins:n('rins'),
    gh:pc('gh'),gr:pc('gr'),inf:pc('inf'),rs:pc('rs'),rb:pc('rb'),rc:pc('rc'),ws,wb,
    acct:raw.acct||'taxable',dy:pc('dy'),fee:pc('fee'),lev:Math.max(0,n('lev')),spread:pc('spread'),
    taxOn:raw.taxOn==='1'||raw.taxOn===1,filing:raw.filing||'single',income:Math.max(0,n('income')),debt:Math.max(0,n('debt')),muMode:raw.muMode||'auto',mu:(raw.muMode||'auto')==='auto'?marginalRate(Math.max(0,n('income')),raw.filing||'single',tk):pc('mu'),stTax:stAuto?stAuto.tax:n('stTax'),oth:n('oth'),ltcg:(raw.ltcgMode||'auto')==='auto'?ltcgRate(Math.max(0,n('income')),raw.filing||'single',tk):pc('ltcg'),
    utilDiff:n('utilDiff'),floodIns:Math.max(0,n('floodIns')),moveIn:Math.max(0,n('moveIn')),impShare:Math.min(1,Math.max(0,pc('impShare'))),rMove:Math.max(0,pc('rMove')),rMoveCost:Math.max(0,n('rMoveCost')),broker:Math.max(0,n('broker')),
    investShare:Math.min(1,Math.max(0,pc('investShare'))),stRate:stAuto?stAuto.rate:Math.max(0,pc('stRate')),stDed:stAuto?stAuto.itemize:(raw.stDed==='1'||raw.stDed===1),
    volAdj:raw.volAdj!=='0',pmiAppr:raw.pmiAppr==='1'||raw.pmiAppr===1,extraPay:Math.max(0,n('extraPay')),extraMode:raw.extraMode||'prepay',
    ltcgMode:raw.ltcgMode||'auto',heloc:Math.min(0.95,Math.max(0,pc('heloc'))),niitAuto:true,niit:0,renewGap:pc('renewGap'),incGrowth:pc('incGrowth'),moveMode:raw.moveMode||'none',moveYear:Math.max(0,Math.round(n('moveYear'))),
    stressMult:Math.max(1,n('stressMult')),forcedDisc:Math.min(0.9,Math.max(0,pc('forcedDisc'))),hhRent:Math.max(0,n('hhRent')),hhShare:Math.min(0.9,Math.max(0,pc('hhShare'))),hhVac:Math.min(1,Math.max(0,pc('hhVac'))),
    rentalOn:raw.rentalOn==='1'||raw.rentalOn===1,dpR:Math.min(1,Math.max(0.05,pc('dpR'))),ratePrem:pc('ratePrem'),vacR:Math.min(1,Math.max(0,pc('vacR'))),mgmt:Math.min(0.5,Math.max(0,pc('mgmt'))),landShare:Math.min(0.9,Math.max(0,pc('landShare'))),
    hz:Math.min(0.99,Math.max(0,pc('hz'))),idio:Math.max(0,pc('idio')),idioMode:raw.idioMode||'sale',gamma:Math.max(0,n('gamma')),
    N:Math.max(1,Math.min(30,parseInt(raw.N)||10)),metro:raw.metro||'us',y0};
}
const readP=()=>parseP(getRaw());

