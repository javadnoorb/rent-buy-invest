/* ===================== Sources ===================== */
const SRC=Object.assign({
  fredMort:{t:"Freddie Mac Primary Mortgage Market Survey (30-year fixed; annual and monthly averages of weekly rates)",u:"https://www.freddiemac.com/pmms"},
  fredCPI:{t:"BLS: CPI-U, U.S. city average, all items, not seasonally adjusted (CUUR0000SA0)",u:"https://data.bls.gov/timeseries/CUUR0000SA0"},
  fredRent:{t:"BLS: CPI-U rent of primary residence, not seasonally adjusted (CUUR0000SEHA)",u:"https://data.bls.gov/timeseries/CUUR0000SEHA"},
  damo:{t:"Damodaran, Historical returns on stocks, bonds, bills and real estate, 1928–2025 (NYU Stern)",u:"https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html"},
  shiller:{t:"Robert Shiller, U.S. home price data (pre-1987 real estate series)",u:"http://www.econ.yale.edu/~shiller/data.htm"},
  fhfa:{t:"FHFA House Price Index datasets (purchase-only metro and U.S. monthly indexes)",u:"https://www.fhfa.gov/data/hpi/datasets"},
  irs26:{t:"IRS: 2026 inflation adjustments, standard deduction and brackets",u:"https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill"},
  salt:{t:"SALT cap $40,400 for 2026 and phase-out (Instead)",u:"https://www.instead.com/resources/blog/new-40-000-salt-deduction-limit-for-2025-and-2026-filers"},
  irs121:{t:"IRS Topic 701: Sale of your home (Section 121 exclusion)",u:"https://www.irs.gov/taxtopics/tc701"},
  mTb:{t:"Federal Reserve H.15: 3-month Treasury bill (secondary market) and 10-year Treasury constant maturity, monthly averages",u:"https://www.federalreserve.gov/releases/h15/"},
  mSp:{t:"S&P 500 monthly total returns computed from Robert Shiller's monthly price and dividend data (as republished by multpl.com); index levels not stored",u:"https://shillerdata.com/"},
  irs936:{t:"IRS Publication 936: Home mortgage interest deduction ($750k limit)",u:"https://www.irs.gov/publications/p936"},
},SNAP.sources,RES.sources||{},(typeof FCST!=='undefined'&&FCST&&FCST.sources)||{});
const AFF_URL='https://www.bankrate.com/mortgages/what-percent-of-income-should-go-to-mortgage/';
const linkTo=(u,txt)=>`<a class="src" target="_blank" rel="noopener" href="${u}">${txt||'source'}</a>`;
const sl=(k,txt)=>SRC[k]?linkTo(SRC[k].u,txt):'';
const srcObj=o=>o&&o.u?linkTo(o.u):'';

/* ===================== Presets ===================== */
const PRESETS={
  long:{gh:r2(geo(HOME,1928)),gr:r2(geo(RENTG,1928)),inf:r2(geo(INF,1928)),rs:r2(geo(STK,1928)),rb:r2(geo(BOND,1928)),rc:r2(geo(BILL,1928))},
  modern:{gh:r2(geo(HOME,1972)),gr:r2(geo(RENTG,1972)),inf:r2(geo(INF,1972)),rs:r2(geo(STK,1972)),rb:r2(geo(BOND,1972)),rc:r2(geo(BILL,1972))},
  ...(FCST&&FCST.preset?{fcst:FCST.preset}:{}),
  now:{gh:SNAP.values.csYoY,gr:SNAP.values.zoriYoY,inf:SNAP.values.cpiYoY,rs:r2(geo(STK,1928)),rb:SNAP.values.tsy10,rc:SNAP.values.tbill}
};
const V=SNAP.values;
const tag='<span class="tag">assumption</span>';
const resHint=(k,fallback)=>RES[k]&&RES[k].u?`${RES[k].h||''} ${linkTo(RES[k].u)}`:(fallback||tag);

/* ===================== Inputs ===================== */
// [group,id,label,default,step,hint,kind,options]
const F=[
 ['home','P','Home price ($)',V.zhvi,1000,`Zillow typical U.S. home value · ${sl('zillow')} · NAR median ${V.narMedian.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})} ${sl('nar')}`],
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
 ['home','pmi','PMI (% of loan / yr)',0.5,0.05,tag+' applies if down payment &lt; 20%'],
 ['refi','refiOn','Allow refinancing',1,null,'Refinance when the market rate falls far enough below your loan rate','sel',[[1,'Yes'],[0,'No']]],
 ['refi','rateLR','Expected market rate later (%)',V.rate30,0.05,`Projection only; backtest and Monte Carlo use historical rates. 10-yr Treasury ${V.tsy10}% ${sl('tsy')}${RES.mortSpread&&RES.mortSpread.u?` · typical mortgage spread ${linkTo(RES.mortSpread.u)}`:''}`],
 ['refi','glide','Years to reach that rate',5,1,''],
 ['refi','refiTh','Refinance when rate drops by (pts)',1.0,0.1,tag+' common rule of thumb 0.75–1.5'],
 ['refi','refiCost','Refinance cost (% of balance)',2,0.1,tag+' paid in cash'],
 ['own','ptax','Property tax (% of value / yr)',V.ptaxUS,0.01,`U.S. effective rate 2025 · ${sl('attom')}`],
 ['own','ptaxCap','Assessment growth cap (% / yr, 0 = none)',0,0.5,'e.g. 2 for California Prop 13'],
 ['own','ins','Home insurance ($ / yr)',V.insUS,10,`2026 U.S. average projection · ${sl('ins')}`],
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
 ['rent','rent0','Rent ($ / month)',Math.round(V.zori*(D0.bedRatio['3']||1)/10)*10,10,`Zillow typical U.S. rent $${V.zori.toLocaleString('en-US')} × Census 3-bedroom ratio · ${sl('zillow')}`],
 ['rent','renewGap','Lease renewals below market growth (pts / yr)',D0.renewGap,0.25,resHint('renew')],
 ['rent','rins',"Renter's insurance ($ / yr)",0,10,''],
 ['mkt','gh','Home appreciation (% / yr)',PRESETS.long.gh,0.1,`Case-Shiller National ${V.csYoY>=0?'+':''}${V.csYoY}% YoY ${sl('cs')}`],
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
 ['tax','stTax','State & local income tax ($ / yr)',8000,500,`counts toward SALT cap $40,400 ${sl('salt')}`],
 ['tax','oth','Other itemized deductions ($ / yr)',0,500,'charity etc.'],
 ['tax','stRate','State tax on investment income &amp; gains (%)',0,0.5,'add your state rate, e.g. 5 in Massachusetts'],
 ['tax','stDed','State deducts mortgage interest &amp; property tax',0,null,'some states (e.g. California) allow it, Massachusetts does not','sel',[[0,'No'],[1,'Yes']]],
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
      ctl=`<div class="inp">${pre?`<span class="pre">$</span>`:''}<input type="number" id="${id}" step="${step}" value="${def}" inputmode="decimal">${suf?`<span class="suf">${suf}</span>`:''}</div>`}
    d.innerHTML=`<label for="${id}">${lab}</label>${ctl}${hint?`<div class="hint">${hint}</div>`:''}`;
    box.appendChild(d);
    if(kind==='sel')document.getElementById(id).value=String(def);
  });
}
function getRaw(){const o={N:document.getElementById('N').value,metro:document.getElementById('metro').value};F.forEach(f=>o[f[1]]=document.getElementById(f[1]).value);return o}
function setRaw(o){F.forEach(f=>{if(o[f[1]]!=null)document.getElementById(f[1]).value=o[f[1]]});if(o.N)document.getElementById('N').value=o.N;if(o.metro!=null&&METROS.some(m=>m.slug===o.metro))document.getElementById('metro').value=o.metro}
function parseP(raw){
  const n=id=>{const x=parseFloat(raw[id]);return isFinite(x)?x:DEF[id]};
  const pc=id=>n(id)/100;
  const ws=Math.min(1,Math.max(0,pc('ws'))),wb=Math.min(1-ws,Math.max(0,pc('wb')));
  const term=parseInt(raw.term)||30,loanType=raw.loanType||'fixed',armYears=parseInt(raw.armYears)||5;
  let dp=Math.min(1,Math.max(0,pc('dp')));if(loanType==='fha')dp=Math.max(0.035,dp);
  const ttB=Math.max(0,pc('ttBuy')),ttS=Math.max(0,pc('ttSell'));
  return {loanType,armYears,armRate:pc('armRate'),armMargin:pc('armMargin'),armCapInit:armYears>=7?0.05:0.02,armCapPer:0.01,armCapLife:0.05,pts:Math.max(0,n('pts')),ptsCut:pc('ptsCut'),
    insG:pc('insG'),ttBuy:ttB,ttSell:ttS,closeBase:pc('close'),sellBase:pc('sell'),beds:raw.beds||'3',
    P:Math.max(1,n('P')),dp,rate:term===15?pc('rate15'):pc('rate'),rate30:pc('rate'),rate15:pc('rate15'),term,close:pc('close')+ttB,pmi:pc('pmi'),
    refiOn:raw.refiOn==='1'||raw.refiOn===1,rateLR:pc('rateLR'),glide:Math.max(0,n('glide')),refiTh:pc('refiTh'),refiCost:pc('refiCost'),
    ptax:pc('ptax'),ptaxCap:Math.max(0,pc('ptaxCap')),ins:n('ins'),maint:pc('maint'),hoa:n('hoa'),sell:pc('sell')+ttS,rent0:Math.max(0,n('rent0')),rins:n('rins'),
    gh:pc('gh'),gr:pc('gr'),inf:pc('inf'),rs:pc('rs'),rb:pc('rb'),rc:pc('rc'),ws,wb,
    acct:raw.acct||'taxable',dy:pc('dy'),fee:pc('fee'),lev:Math.max(0,n('lev')),spread:pc('spread'),
    taxOn:raw.taxOn==='1'||raw.taxOn===1,filing:raw.filing||'single',income:Math.max(0,n('income')),debt:Math.max(0,n('debt')),muMode:raw.muMode||'auto',mu:(raw.muMode||'auto')==='auto'?marginalRate(Math.max(0,n('income')),raw.filing||'single'):pc('mu'),stTax:n('stTax'),oth:n('oth'),ltcg:pc('ltcg'),
    utilDiff:n('utilDiff'),floodIns:Math.max(0,n('floodIns')),moveIn:Math.max(0,n('moveIn')),impShare:Math.min(1,Math.max(0,pc('impShare'))),rMove:Math.max(0,pc('rMove')),rMoveCost:Math.max(0,n('rMoveCost')),broker:Math.max(0,n('broker')),
    investShare:Math.min(1,Math.max(0,pc('investShare'))),stRate:Math.max(0,pc('stRate')),stDed:raw.stDed==='1'||raw.stDed===1,
    volAdj:raw.volAdj!=='0',niitAuto:true,niit:0,renewGap:pc('renewGap'),incGrowth:pc('incGrowth'),moveMode:raw.moveMode||'none',moveYear:Math.max(0,Math.round(n('moveYear'))),
    stressMult:Math.max(1,n('stressMult')),forcedDisc:Math.min(0.9,Math.max(0,pc('forcedDisc'))),hhRent:Math.max(0,n('hhRent')),hhShare:Math.min(0.9,Math.max(0,pc('hhShare'))),hhVac:Math.min(1,Math.max(0,pc('hhVac'))),
    rentalOn:raw.rentalOn==='1'||raw.rentalOn===1,dpR:Math.min(1,Math.max(0.05,pc('dpR'))),ratePrem:pc('ratePrem'),vacR:Math.min(1,Math.max(0,pc('vacR'))),mgmt:Math.min(0.5,Math.max(0,pc('mgmt'))),landShare:Math.min(0.9,Math.max(0,pc('landShare'))),
    hz:Math.min(0.99,Math.max(0,pc('hz'))),idio:Math.max(0,pc('idio')),idioMode:raw.idioMode||'sale',gamma:Math.max(0,n('gamma')),
    N:Math.max(1,Math.min(30,parseInt(raw.N)||10)),metro:raw.metro||'us'};
}
const readP=()=>parseP(getRaw());

/* ===================== State & helpers ===================== */
let REAL=true,CUR='proj',P=null,BASE=null,MC=null,OPT_TERM=30;
const fmt=x=>{if(!isFinite(x))return '—';const a=Math.abs(x),s=x<0?'−':'';if(a>=1e6)return s+'$'+(a/1e6).toFixed(a>=1e7?1:2)+'M';if(a>=1e3)return s+'$'+(a/1e3).toFixed(a>=1e5?0:1)+'k';return s+'$'+a.toFixed(0)};
const fmtFull=x=>(x<0?'−$':'$')+Math.round(Math.abs(x)).toLocaleString('en-US');
const pct=(x,d=1)=>(x*100).toFixed(d)+'%';
const adj=(v,c)=>REAL?v/c:v;
const curMetro=()=>METROS.find(m=>m.slug===(P?P.metro:document.getElementById('metro').value))||METROS[0];
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function theme(){return{rp:css('--rp'),ink:css('--ink'),muted:css('--muted'),line:css('--line'),bg:css('--surface'),buy:css('--buy'),inv:css('--inv'),cash:css('--cash'),accent:css('--accent'),neg:css('--neg'),sunk:css('--sunk')}}
function hexA(h,a){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
const TOUCH=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window&&innerWidth<900);
function layout(extra){const t=theme();const narrow=innerWidth<600;
  const L=Object.assign({paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'IBM Plex Sans, system-ui, sans-serif',color:t.ink,size:narrow?11:12},
    margin:{l:narrow?52:64,r:14,t:10,b:narrow?72:48},hovermode:'x unified',hoverlabel:{bgcolor:t.bg,bordercolor:t.line,font:{color:t.ink,family:'IBM Plex Mono, monospace'}},
    legend:{orientation:'h',y:narrow?-0.3:-0.16,x:0,font:{size:narrow?10:11},itemwidth:narrow?24:30,tracegroupgap:4},
    xaxis:{gridcolor:narrow?hexA(t.line,.55):t.line,zerolinecolor:t.line,linecolor:t.line,tickfont:{family:'IBM Plex Mono, monospace'},nticks:narrow?6:undefined},
    yaxis:{gridcolor:narrow?hexA(t.line,.55):t.line,zerolinecolor:t.muted,linecolor:t.line,tickfont:{family:'IBM Plex Mono, monospace'},nticks:narrow?5:undefined}},extra||{});
  if(TOUCH){L.dragmode=false;Object.keys(L).forEach(k=>{if(/^[xy]axis\d*$/.test(k))L[k]=Object.assign({},L[k],{fixedrange:true})});
    if(!L.xaxis)L.xaxis={fixedrange:true};if(!L.yaxis)L.yaxis={fixedrange:true};
    L.hoverlabel=Object.assign({},L.hoverlabel,{bgcolor:hexA(t.bg,0.9),font:Object.assign({},(L.hoverlabel||{}).font,{size:11})})}
  return L}
const CFG=TOUCH?{responsive:true,displayModeBar:false,scrollZoom:false,doubleClick:false,showTips:false}:{responsive:true,displaylogo:false,displayModeBar:true,modeBarButtonsToRemove:['lasso2d','select2d'],doubleClick:'reset'};
const HOVERED=new Set();
function unhoverAll(except){HOVERED.forEach(el=>{if(el!==except&&window.Plotly&&Plotly.Fx){try{Plotly.Fx.unhover(el)}catch(e){}HOVERED.delete(el)}})}
if(TOUCH){addEventListener('scroll',()=>{if(HOVERED.size)unhoverAll()},{passive:true});addEventListener('touchstart',e=>{if(HOVERED.size)unhoverAll(e.target.closest&&e.target.closest('.plot'))},{passive:true,capture:true})}
function plot(id,data,lay){const el=document.getElementById(id);
  try{if(el.dataset.err){el.innerHTML='';delete el.dataset.err}Plotly.react(el,data,layout(lay),CFG);
    if(TOUCH&&!el._hoverWired&&el.on){el._hoverWired=1;el.on('plotly_hover',()=>{HOVERED.add(el);clearTimeout(el._ht);el._ht=setTimeout(()=>{try{Plotly.Fx.unhover(el)}catch(e){}HOVERED.delete(el)},3000)});el.on('plotly_unhover',()=>HOVERED.delete(el))}}
  catch(e){console.error(id,e);el.dataset.err=1;el.innerHTML=`<div class="note">This chart could not be drawn (${String(e.message||e).slice(0,160)}).</div>`}}
const X=(t)=>({...layout().xaxis,title:{text:t,font:{size:11}}});
const Yd=(t)=>({...layout().yaxis,title:{text:t,font:{size:11}},tickprefix:'$',tickformat:'~s'});
const Yt=(t,extra)=>({...layout().yaxis,title:{text:t,font:{size:11}},...(extra||{})});
const basisLabel=()=>REAL?"today's $":'nominal $';
const divScale=t=>[[0,t.inv],[0.5,t.bg],[1,t.buy]];

/* ===================== Analysis helpers ===================== */
function runConst(p,over,N){const q=Object.assign({},p,over||{});const n=N||q.N;return {q,o:simulate(q,constPath(q,n),{N:n})}}
function advAt(p,over){const {q,o}=runConst(p,over);return adj(o.buy[q.N]-o.inv[q.N],o.cpi[q.N])}
function bisect(f,lo,hi,it=40){let flo=f(lo),fhi=f(hi);if(!isFinite(flo)||!isFinite(fhi)||flo*fhi>0)return null;for(let k=0;k<it;k++){const m=(lo+hi)/2,fm=f(m);if(fm*flo>0){lo=m;flo=fm}else{hi=m}}return (lo+hi)/2}
function breakevenYear(o){const a=o.buy.map((b,k)=>b-o.inv[k]);for(let k=1;k<a.length;k++){if(a[k]>=0&&a.slice(k).every(v=>v>=0))return k}return null}
function movingWeights(h,N){const w=[];for(let t=1;t<=N;t++)w.push(t<N?h*Math.pow(1-h,t-1):Math.pow(1-h,N-1));return w}
function expectedWithMoving(o,p){const w=movingWeights(p.hz,p.N);let s=0;for(let t=1;t<=p.N;t++)s+=w[t-1]*adj(o.buy[t]-o.inv[t],o.cpi[t]);return s}
const TORNADO=[['Home appreciation ±1 pt','gh',0.01],['Stock return ±2 pt','rs',0.02],['Rent growth ±1 pt','gr',0.01],['Mortgage rate ±1 pt','rate',0.01],
  ['Inflation ±1 pt','inf',0.01],['Rent ±10%','rent0',0.1,'rel'],['Price ±10%','P',0.1,'rel'],['Maintenance ±0.5 pt','maint',0.005],
  ['Property tax ±0.3 pt','ptax',0.003],['Selling costs ±2 pt','sell',0.02],['Down payment ±10 pt','dp',0.1],['Horizon ±3 yr','N',3],['Later market rate ±1 pt','rateLR',0.01]];
function tornado(p){const base=advAt(p,{});return {base,rows:TORNADO.map(([lab,k,d,rel])=>{const dd=rel?p[k]*d:d;let lo=p[k]-dd,hi=p[k]+dd;
  if(k==='N'){lo=Math.max(1,lo);hi=Math.min(30,hi)}if(k==='dp'){lo=Math.max(0,lo);hi=Math.min(1,hi)}
  const ov=v=>k==='rate'?{rate:v,rate30:v}:{[k]:v};
  return {lab,k,lo:advAt(p,ov(lo))-base,hi:advAt(p,ov(hi))-base}}).sort((a,b)=>Math.max(Math.abs(a.lo),Math.abs(a.hi))-Math.max(Math.abs(b.lo),Math.abs(b.hi)))}}

/* ===================== Summary ===================== */
function affCell(own1,p){if(!p.income)return 'n/a';const fe=own1/(p.income/12),be=(own1+p.debt)/(p.income/12);
  const col=fe<=0.28&&be<=0.36?'--buy':(be<=0.43?'--cash':'--neg');
  return `<span style="color:var(${col})">${pct(fe,0)}</span><span class="sub" style="font-family:var(--body)"> · all debt ${pct(be,0)}</span>`}
function summary(){
  const p=P,o=BASE,N=p.N,c=o.cpi[N];
  const b=adj(o.buy[N],c),iv=adj(o.inv[N],c),ca=adj(o.cash[N],c),d=b-iv;
  const own1=month1Cost(p);
  const beY=breakevenYear(o);
  const beRent=bisect(r=>advAt(p,{rent0:r}),10,Math.max(500,p.rent0*6));
  const beG=bisect(g=>advAt(p,{gh:g}),-0.15,0.25);
  const o30=simulate(Object.assign({},p,{N:Math.max(N,1)}),constPath(p,N),{N});
  const ex=expectedWithMoving(o30,p);
  document.getElementById('vhead').textContent=d>=0?`After ${N} year${N>1?'s':''}, buying comes out ahead of renting and investing by ${fmt(d)}.`:`After ${N} year${N>1?'s':''}, renting and investing comes out ahead of buying by ${fmt(-d)}.`;
  const rp=p.rentalOn&&o.rental[N]!=null?adj(o.rental[N],c):null;
  const opts=[['buy','Buy',b],['inv','Rent + invest',iv],['cash','Rent + T-bills',ca]].concat(rp!=null?[['rp','Rent + rental property',rp]]:[]),mx=Math.max(...opts.map(o=>o[2]),1),top=Math.max(...opts.map(o=>o[2]));
  document.getElementById('bars').innerHTML=opts.map(([k,lab,v])=>`<div class="bar ${v===top?'win':''}"><span class="lab">${lab}${v===top?'<span class="pill">best</span>':''}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(0,v/mx*100).toFixed(1)}%;background:var(--${k})"></span></span><span class="val">${fmt(v)}</span></div>`).join('');
  document.getElementById('sheetlive').innerHTML=`Year ${N}: buy ${fmt(b)} · rent+invest ${fmt(iv)} · gap <strong style="color:var(${d>=0?'--buy':'--inv'})">${d>=0?'+':''}${fmt(d)}</strong>`;
  const g=document.getElementById('vgrid');
  g.innerHTML=[
   ['Buy − rent&invest',`<span style="color:var(${d>=0?'--buy':'--inv'})">${d>=0?'+':''}${fmt(d)}</span>`],
   ['Break-even year',beY?`${beY} yr`:`> ${N} yr`],
   ['Break-even rent',beRent?fmtFull(beRent)+'/mo':'n/a'],
   ['Break-even home growth',beG!=null?pct(beG)+'/yr':'n/a'],
   ['Owning, month 1',fmtFull(own1)+'/mo'],
   ['Housing cost / income',affCell(own1,p)],
   ['Cash to buy',fmtFull(p.P*(p.dp+p.close))],
   [`Expected gap, ${pct(p.hz,0)}/yr move risk`,`<span style="color:var(${ex>=0?'--buy':'--inv'})">${ex>=0?'+':''}${fmt(ex)}</span>`],
  ].map(([k,v])=>`<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
  const fe=p.income?own1/(p.income/12):0,be=p.income?(own1+p.debt)/(p.income/12):0;
  window._summaryText=`Rent, Buy or Invest — ${curMetro().name}, ${N}-year horizon (${basisLabel()})\n`+
    `Home ${fmtFull(p.P)}, ${pct(p.dp,0)} down, ${pct(p.rate,2)} ${p.term}-yr; rent ${fmtFull(p.rent0)}/mo\n`+
    `Growth: home ${pct(p.gh)}, rent ${pct(p.gr)}, stocks ${pct(p.rs)}, inflation ${pct(p.inf)}\n`+
    `Net worth at year ${N}: buy ${fmtFull(b)}, rent+invest ${fmtFull(iv)}, rent+T-bills ${fmtFull(ca)}\n`+
    `Buy − rent&invest: ${d>=0?'+':''}${fmtFull(d)}; break-even year ${beY||'>'+N}; break-even rent ${beRent?fmtFull(beRent):'n/a'}/mo; break-even home growth ${beG!=null?pct(beG):'n/a'}\n`+
    `Owning month 1: ${fmtFull(own1)}/mo; housing/income ${p.income?pct(fe,0):'n/a'}, all debt ${p.income?pct(be,0):'n/a'}`+(MC?`\nMonte Carlo: buying wins in ${pct(MC.pWin[Math.min(N,MC.N)])} of ${MC.n} paths`:'');
  // explanation
  const tor=tornado(p),top2=tor.rows.slice(-2).reverse();
  const verb=x=>x.hi>x.lo?'raising':'lowering';
  const why=[];
  why.push(`<strong>Biggest drivers:</strong> ${top2.map(r=>`${r.lab.replace(/ ±.*/,'').toLowerCase()} (${fmt(Math.max(Math.abs(r.lo),Math.abs(r.hi)))} swing)`).join(' and ')}.`);
  if(d<0){why.push(`Buying would tie if rent were ${beRent?fmtFull(beRent):'much higher'} instead of ${fmtFull(p.rent0)}${beG!=null?`, or if homes appreciated ${pct(beG)}/yr instead of ${pct(p.gh)}`:''}.`)}
  else{why.push(`Renting would tie if rent were ${beRent?fmtFull(beRent):'much lower'}${beG!=null?`, or if homes appreciated only ${pct(beG)}/yr`:''}.`)}
  if(p.income){const fe=own1/(p.income/12),be=(own1+p.debt)/(p.income/12);
    if(fe>0.28||be>0.36)why.push(`Affordability: housing would take ${pct(fe,0)} of gross income${p.debt?` (${pct(be,0)} with other debt)`:''}, above the common 28/36 guideline; most lenders cap total debt near 43% ${linkTo(AFF_URL)}.`)}
  if(o.refis>0)why.push(`The projection refinances ${o.refis} time${o.refis>1?'s':''} as rates move toward ${pct(p.rateLR,2)}.`);
  const own0=own1,rent0=p.rent0+p.rins/12+p.rMove*(p.rMoveCost+p.broker*p.rent0)/12;
  why.push(own0>rent0?`In year 1 owning costs ${fmtFull(own0-rent0)}/mo more than renting, which the renter invests.`:`In year 1 owning costs ${fmtFull(rent0-own0)}/mo less than renting, which the buyer invests.`);
  document.getElementById('why').innerHTML=why.join(' ');
  plainAnswer();
  const ptr=p.P/(p.rent0*12);const m=curMetro();
  document.getElementById('vnote').innerHTML=`${m.slug!=='us'?`Location: ${m.name}. `:''}Price-to-rent ${ptr.toFixed(1)} (gross rent yield ${pct(1/ptr)}). Values in ${basisLabel()}. ${MC?`Monte Carlo: buying beats renting-and-investing in <strong>${pct(MC.pWin[Math.min(N,MC.N)])}</strong> of ${MC.n.toLocaleString()} simulated paths at year ${Math.min(N,MC.N)}.`:''}`;
}

/* ===================== Chart takeaways ===================== */
function tk(id,html,label){const el=document.getElementById('tk-'+id);if(el)el.innerHTML=html?`<strong>${label||'For your inputs:'}</strong> ${html}`:''}
const gapTxt=v=>`<span style="color:var(${v>=0?'--buy':'--inv'})">${v>=0?'buying ahead by ':'renting ahead by '}${fmt(Math.abs(v))}</span>`;
const nY=n=>`${n} year${n===1?'':'s'}`;
const sgnP=v=>`${v>=0?'+':'−'}${Math.abs(v).toFixed(0)}%`;

function month1Cost(p){const LS=loanSetup(p,p.rate),M=pmt(LS.L,LS.rate/12,p.term*12);
  const ins=LS.type==='fha'?LS.mip*LS.L/12:(p.dp<0.2?p.pmi*LS.L/12:0);
  return M+(p.ptax*p.P+p.maint*p.P+p.ins+p.floodIns)/12+p.hoa+p.utilDiff+ins}

/* ===================== Plain-language answer ===================== */
function plainAnswer(){const el=document.getElementById('answer');if(!el)return;
  if(!MC||MC.key!==mcKey()){el.innerHTML='<span class="sub">Simulating possible futures…</span>';return}
  const h=Math.min(P.N,MC.N),pw=MC.pWin[h],n=MC.n;
  let cross=null;for(let y=1;y<=MC.N;y++){let ok=true;for(let k=y;k<=Math.min(MC.N,y+3);k++)if(MC.pWin[k]<0.5)ok=false;if(ok){cross=y;break}}
  const conf=pw>=0.8||pw<=0.2?['High confidence','hi']:(pw>=0.65||pw<=0.35?['Moderate confidence','mid']:['Low confidence','lo']);
  const yrs=`${h} year${h>1?'s':''}`;
  let main;
  if(pw>=0.45&&pw<=0.55)main=`If you stay ${yrs}, it's close to a coin flip: buying comes out ahead in ${pct(pw,0)} of ${n} simulated futures.`;
  else if(pw>0.5)main=`If you stay ${yrs}, buying is ${pw>=0.8?'very likely':pw>=0.65?'likely':'somewhat more likely'} to leave you better off: it wins in ${pct(pw,0)} of ${n} simulated futures.`;
  else main=`If you stay ${yrs}, renting and investing is ${pw<=0.2?'very likely':pw<=0.35?'likely':'somewhat more likely'} to leave you better off: buying wins in only ${pct(pw,0)} of ${n} simulated futures.`;
  const tail=cross?(cross<=h?` Buying tends to win once you stay ${cross}+ years.`:` Buying starts winning more often than not if you stay about ${cross}+ years.`):' Buying does not win more often than not at any horizon up to 30 years.';
  el.innerHTML=`<span class="conf ${conf[1]}">${conf[0]}</span> ${main}${tail}`}

/* ===================== Projection ===================== */
function yearlyRows(o){const rows=[];for(let k=0;k<o.buy.length;k++){const f=o.flow[k-1]||{};rows.push({year:k,home:o.H[k],balance:o.bal[k],netEquity:o.eq[k],buyerPortfolio:o.pB[k],buyNW:o.buy[k],renterNW:o.inv[k],cashNW:o.cash[k],ownerMonthly:k?f.own:null,rentMonthly:k?f.rent:null,hti:k&&o.income[k-1]?f.own/(o.income[k-1]/12):null,taxSaving:k?-f.tax*12:null,mortRate:o.rateAt[k],cpiIndex:o.cpi[k]})}return rows}
function renderProj(){
  const t=theme(),o=simulate(P,constPath(P,P.N),{detail:true}),x=o.buy.map((_,k)=>k);
  const tr=(arr,name,col,dash)=>({x,y:arr.map((v,k)=>adj(v,o.cpi[k])),name,mode:'lines',line:{color:col,width:2.6,dash},hovertemplate:'%{y:$,.0f}'});
  const be=breakevenYear(o);
  const data=[tr(o.buy,'Buy',t.buy),tr(o.inv,'Rent + invest',t.inv),tr(o.cash,'Rent + T-bills',t.cash,'dot')];
  if(P.rentalOn)data.push(tr(o.rental,'Rent + rental property',t.rp,'dashdot'));
  if(o.refiAt.length){const ys=o.refiAt.map(a=>{const k=Math.min(o.buy.length-1,Math.ceil(a));return adj(o.buy[k],o.cpi[k])});
    data.push({x:o.refiAt.map(a=>Math.ceil(a)),y:ys,mode:'markers',name:'Refinance',marker:{size:9,color:t.bg,line:{color:t.buy,width:2}},hovertemplate:'refinanced<extra></extra>'})}
  const showBand=document.getElementById('nwBand')&&document.getElementById('nwBand').checked&&MC;
  if(showBand){const hh=P.N,xs=[...Array(hh+1)].map((_,k)=>k);
    const bandOf=(arr,col,name)=>{const lo=xs.map(y=>q(arr.map(a=>a[y]),.25)),hi=xs.map(y=>q(arr.map(a=>a[y]),.75));
      return [{x:xs,y:hi,mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip'},{x:xs,y:lo,mode:'lines',line:{width:0},fill:'tonexty',fillcolor:hexA(col,.16),name:name+' 25–75%',hoverinfo:'skip'}]};
    data.unshift(...bandOf(MC.res.buy,t.buy,'Buy'),...bandOf(MC.res.inv,t.inv,'Rent + invest'))}
  plot('p-nw',data,{xaxis:{...X('Years from today'),dtick:P.N>15?5:1},yaxis:Yd('Net worth, '+basisLabel()),
     shapes:(be?[{type:'line',x0:be,x1:be,yref:'paper',y0:0,y1:1,line:{color:t.muted,dash:'dash',width:1}}]:[]).concat(o.moved?[{type:'line',x0:o.moved.year,x1:o.moved.year,yref:'paper',y0:0,y1:1,line:{color:t.cash,dash:'dot',width:1.5}}]:[]),
     annotations:(be?[{x:be,yref:'paper',y:1,text:'break-even',showarrow:false,yanchor:'bottom',font:{size:11,color:t.muted}}]:[]).concat(o.moved?[{x:o.moved.year,yref:'paper',y:0.02,text:o.moved.mode==='buy'?'sell & rebuy':'sell & rent',showarrow:false,xanchor:'left',font:{size:11,color:t.cash}}]:[])});
  const yrs=o.flow.map((_,k)=>k+1),fl=o.flow;
  const comp=[['interest','Interest',t.neg],['principal','Principal',t.buy],['ptax','Property tax',hexA(t.cash,.85)],['ins','Insurance',hexA(t.accent,.55)],['maint','Maintenance',hexA(t.muted,.75)],['hoa','HOA',hexA(t.accent,.3)],['hh','House-hack income, after tax',hexA(t.buy,.6)],['util','Extra utilities',hexA(t.cash,.45)],['pmi','PMI',hexA(t.neg,.45)],['refi','Refinance cost',hexA(t.ink,.35)],['tax','Tax savings',hexA(t.buy,.35)]];
  const fdata=comp.filter(([k])=>fl.some(f=>Math.abs(f[k])>0.5)).map(([k,n,c])=>({x:yrs,y:fl.map(f=>adj(f[k],f.cpi)),name:n,type:'bar',marker:{color:c},hovertemplate:'%{y:$,.0f}'}));
  fdata.push({x:yrs,y:fl.map(f=>adj(f.rent,f.cpi)),name:'Rent',mode:'lines+markers',line:{color:t.inv,width:2.5},marker:{size:5},hovertemplate:'%{y:$,.0f}'});
  plot('p-flow',fdata,{barmode:'relative',xaxis:X('Year'),yaxis:Yd('Per month, '+basisLabel())});
  const u=o.unrec;
  plot('p-unrec',[
    {x:yrs,y:u.map(v=>adj(v.own-v.opp,v.cpi)),name:'Owner: cash costs',type:'bar',marker:{color:hexA(t.buy,.8)},hovertemplate:'%{y:$,.0f}'},
    {x:yrs,y:u.map(v=>adj(v.opp,v.cpi)),name:'Owner: forgone return',type:'bar',marker:{color:hexA(t.buy,.35)},hovertemplate:'%{y:$,.0f}'},
    {x:yrs,y:u.map(v=>adj(v.rent,v.cpi)),name:'Renter: rent',mode:'lines+markers',line:{color:t.inv,width:2.5},marker:{size:5},hovertemplate:'%{y:$,.0f}'}],
    {barmode:'stack',xaxis:X('Year'),yaxis:Yd('Per year, '+basisLabel())});
  plot('p-comp',[
    {x,y:o.eq.map((v,k)=>adj(v,o.cpi[k])),name:'Net home equity',stackgroup:'a',line:{color:t.buy,width:0},fillcolor:hexA(t.buy,.55),hovertemplate:'%{y:$,.0f}'},
    {x,y:o.pB.map((v,k)=>adj(v,o.cpi[k])),name:"Buyer's portfolio",stackgroup:'a',line:{color:t.inv,width:0},fillcolor:hexA(t.inv,.4),hovertemplate:'%{y:$,.0f}'},
    {x,y:o.H.map((v,k)=>adj(v,o.cpi[k])),name:'Home value',mode:'lines',line:{color:t.muted,dash:'dot',width:1.5},hovertemplate:'%{y:$,.0f}'},
    {x,y:o.bal.map((v,k)=>adj(v,o.cpi[k])),name:'Mortgage balance',mode:'lines',line:{color:t.neg,dash:'dash',width:1.5},hovertemplate:'%{y:$,.0f}'}],
    {xaxis:X('Years from today'),yaxis:Yd(basisLabel())});
  const bud=o.budget.map((b,k)=>b||o.budget[1]||1);
  plot('p-liq',[
    {x,y:o.lqB.map((v,k)=>v/bud[k]),name:'Buyer',mode:'lines',line:{color:t.buy,width:2.5},hovertemplate:'%{y:.1f} months'},
    {x,y:o.lqR.map((v,k)=>v/bud[k]),name:'Renter (invest)',mode:'lines',line:{color:t.inv,width:2.5},hovertemplate:'%{y:.1f} months'}],
    {xaxis:X('Years from today'),yaxis:Yt('Months of budget',{type:'log',tickvals:[0.5,1,3,6,12,24,60,120,240,600],ticktext:['0.5','1','3','6','12','24','60','120','240','600']}),
     shapes:[3,6].map(v=>({type:'line',xref:'paper',x0:0,x1:1,y0:v,y1:v,line:{color:t.neg,dash:'dot',width:1}}))});
  // table + csv
  const rows=yearlyRows(o),cols=[['year','Year'],['home','Home value'],['balance','Mortgage'],['netEquity','Net equity'],['buyerPortfolio','Buyer portfolio'],['buyNW','Buy NW'],['renterNW','Rent+invest NW'],['cashNW','Rent+T-bills NW'],['ownerMonthly','Owner $/mo'],['rentMonthly','Rent $/mo'],['taxSaving','Tax saving $/yr'],['hti','Housing / income'],['mortRate','Loan rate']];
  const v=(r,k)=>{const x=r[k];if(x==null)return '';if(k==='year')return x;if(k==='hti')return pct(x,0);if(k==='mortRate')return (x*100).toFixed(2)+'%';return Math.round(adj(x,r.cpiIndex)).toLocaleString('en-US')};
  document.getElementById('ytable').innerHTML='<thead><tr>'+cols.map(c=>`<th>${c[1]}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+cols.map(c=>`<td>${v(r,c[0])}</td>`).join('')+'</tr>').join('')+'</tbody>';
  const csv=[cols.map(c=>c[1]+(c[0]!=='year'&&c[0]!=='mortRate'?` (${basisLabel()})`:'')).join(',')].concat(rows.map(r=>cols.map(c=>{const x=r[c[0]];if(x==null)return '';if(c[0]==='year')return x;if(c[0]==='mortRate')return (x*100).toFixed(3);if(c[0]==='hti')return (x*100).toFixed(1);return Math.round(adj(x,r.cpiIndex))}).join(','))).join('\n');
  document.getElementById('csvText').value=csv;
  {const N=P.N,c=o.cpi[N],gap=adj(o.buy[N]-o.inv[N],c);
   let t1=`At year ${N}: ${gapTxt(gap)}. `+(be?(be<=N?`Buying pulls ahead for good in year ${be}.`:`Buying pulls ahead only after year ${be}.`):`Buying does not pull ahead within ${nY(N)} at these growth rates.`);
   if(showBand&&MC&&MC.res){const r=(a,f)=>q(a.map(x=>x[N]),f);t1+=` In the middle half of simulated futures, buying ends at ${fmt(r(MC.res.buy,.25))}–${fmt(r(MC.res.buy,.75))} and renting-and-investing at ${fmt(r(MC.res.inv,.25))}–${fmt(r(MC.res.inv,.75))}${r(MC.res.buy,.75)>r(MC.res.inv,.25)&&r(MC.res.inv,.75)>r(MC.res.buy,.25)?', so the ranges overlap and luck could decide it':''}.`}
   if(P.rentalOn&&o.rental[N]!=null){const rv=adj(o.rental[N],c),iv=adj(o.inv[N],c);t1+=` Renting and buying a rental property ends at ${fmt(rv)}, ${rv>=iv?fmt(rv-iv)+' more':fmt(iv-rv)+' less'} than renting and investing in the portfolio.`}
   if(P.moveMode!=='none'){t1+=P.moveYear>0&&P.moveYear<N?` The dotted line marks the planned move in year ${P.moveYear}.`:` The planned move (year ${P.moveYear}) is not before your ${N}-year horizon, so it has no effect; lower it or lengthen the horizon.`}
   tk('nw',t1);
   const f1=fl[0],cheap=fl.findIndex(f=>f.own<f.rent);
   tk('flow',`In year 1 owning costs ${fmtFull(adj(f1.own,f1.cpi))}/mo against ${fmtFull(adj(f1.rent,f1.cpi))}/mo for renting; ${fmtFull(adj(f1.principal,f1.cpi))} of that goes to principal and stays yours. `+
     (cheap===0?'Owning is the cheaper month from the start.':cheap>0?`Owning becomes the cheaper month in year ${cheap+1}, as rent rises and the payment stays fixed.`:`Owning stays the more expensive month for all ${nY(fl.length)}.`));
   const u0=u[0],need=(u0.own-u0.rent)/P.P;
   tk('unrec',`Year 1 unrecoverable cost of owning is ${fmtFull(adj(u0.own,u0.cpi))} (${pct(u0.own/P.P)} of the price) against ${fmtFull(adj(u0.rent,u0.cpi))} of rent. `+
     (need>0?`The home has to gain about ${pct(need)} that year just to match renting; you assume ${pct(P.gh)}.`:`Owning is already ${fmtFull(-adj(u0.own-u0.rent,u0.cpi))} cheaper than renting before any appreciation.`));
   const sh=o.buy[N]>0?o.eq[N]/o.buy[N]:0;
   tk('comp',`At year ${N}, ${pct(Math.max(0,Math.min(1,sh)),0)} of the buyer's net worth is home equity and ${pct(Math.max(0,Math.min(1,1-sh)),0)} is invested. Selling would cost about ${fmt(adj(o.H[N]*P.sell,c))} in commission and fees.`);
   const mo=o.lqB.map((v,k)=>v/(bud[k]||1)),low=mo.slice(1).findIndex(v=>v>=3);
   tk('liq',mo.slice(1).every(v=>v>=3)?'The buyer keeps at least 3 months of costs in liquid assets throughout.':
     (low<0?`The buyer stays below 3 months of costs in liquid assets for all ${nY(N)}; a separate emergency fund matters if you buy.`:`The buyer has under 3 months of costs in liquid assets until year ${low+1}; a separate emergency fund matters in those years.`));}
}

/* ===================== Sensitivity ===================== */
function renderSens(){
  const t=theme(),p=P,{base,rows}=tornado(p);
  plot('p-tor',[
    {y:rows.map(r=>r.lab),x:rows.map(r=>r.lo),name:'Input lower',type:'bar',orientation:'h',marker:{color:hexA(t.inv,.75)},hovertemplate:'%{x:$,.0f}<extra>lower</extra>'},
    {y:rows.map(r=>r.lab),x:rows.map(r=>r.hi),name:'Input higher',type:'bar',orientation:'h',marker:{color:hexA(t.buy,.75)},hovertemplate:'%{x:$,.0f}<extra>higher</extra>'}],
    {barmode:'overlay',hovermode:'closest',margin:{l:innerWidth<600?150:190,r:14,t:10,b:60},xaxis:{...layout().xaxis,title:{text:`Change in buy advantage at year ${p.N} (base ${fmt(base)})`,font:{size:11}},tickprefix:'$',tickformat:'~s'},yaxis:{...layout().yaxis,automargin:true}});
  {const top=rows.slice(-3).reverse(),flips=rows.filter(r=>Math.sign(base+r.lo)!==Math.sign(base)||Math.sign(base+r.hi)!==Math.sign(base));
   tk('tor',`The answer is most sensitive to ${top.map(r=>r.lab.replace(/ ±.*/,'').toLowerCase()).join(', ')}. `+(flips.length?`Within the ranges shown, ${flips.map(r=>r.lab.replace(/ ±.*/,'').toLowerCase()).join(', ')} could flip the decision on its own.`:`None of the shown changes alone flips the decision, so the result is fairly robust to any single input.`))}
  const G=[],R=[];for(let g=-2;g<=8.001;g+=0.5)G.push(r2(g));for(let r=2;r<=14.001;r+=0.5)R.push(r2(r));
  const wc=1-p.ws-p.wb,mix=rs=>p.ws*rs+p.wb*p.rb+wc*p.rc;
  const z=R.map(r=>G.map(g=>{const rs=p.ws>0?(r/100-p.wb*p.rb-wc*p.rc)/p.ws:p.rs;return 100*advAt(p,{gh:g/100,rs})/p.P}));
  const zmax=Math.max(1,...z.flat().map(Math.abs));
  plot('p-heat',[
    {x:G,y:R,z,type:'heatmap',zmin:-zmax,zmax,colorscale:divScale(t),colorbar:{title:{text:'% of price',side:'right'},thickness:10,outlinewidth:0},hovertemplate:'home %{x}%, portfolio %{y}%<br>advantage %{z:.0f}% of price<extra></extra>'},
    {x:G,y:R,z,type:'contour',contours:{start:0,end:0,size:1,coloring:'none',showlabels:false},line:{color:t.ink,width:2},showscale:false,hoverinfo:'skip'},
    {x:[p.gh*100],y:[mix(p.rs)*100],mode:'markers',marker:{size:12,color:t.ink,symbol:'x'},name:'You',hovertemplate:'your assumption<extra></extra>'}],
    {hovermode:'closest',showlegend:false,xaxis:X('Home appreciation, % / yr'),yaxis:Yt('Portfolio return before fees, % / yr')});
  {const beG=bisect(g=>advAt(p,{gh:g}),-0.15,0.25);
   tk('heat',beG==null?'At your portfolio return, no home appreciation between −15% and 25% a year changes the winner.':
     `At your ${pct(mix(p.rs))} portfolio return, buying ties when homes appreciate ${pct(beG)} a year; you assume ${pct(p.gh)}, a margin of ${(Math.abs(beG-p.gh)*100).toFixed(1)} points in favor of ${beG>p.gh?'renting':'buying'}.`)}
  const mults=[0.7,0.85,1,1.15,1.3],cols=[t.inv,hexA(t.inv,.6),t.muted,hexA(t.buy,.6),t.buy];
  const BE=[];
  plot('p-ptr',mults.map((m,j)=>{const {o}=runConst(p,{rent0:p.rent0*m},30);BE.push(breakevenYear(o));
    return {x:o.buy.map((_,k)=>k),y:o.buy.map((b,k)=>adj(b-o.inv[k],o.cpi[k])),name:`${fmtFull(p.rent0*m)} (P/R ${(p.P/(p.rent0*m*12)).toFixed(1)})`,mode:'lines',line:{color:cols[j],width:m===1?3:1.8},hovertemplate:'%{y:$,.0f}'}}),
    {xaxis:X('Years'),yaxis:Yd('Buy − rent&invest, '+basisLabel())});
  const be=BE[2],lo=BE[0],hi=BE[4];
  const ptr=(p.P/(p.rent0*12)).toFixed(1);
  tk('ptr',!be&&!hi?`At your rent (price-to-rent ${ptr}) buying doesn't break even within 30 years, even if comparable rent were 30% higher.`:
    `At your rent (price-to-rent ${ptr}) buying breaks even ${be?`in year ${be}`:'after more than 30 years'}. With 30% higher rent: ${hi?`year ${hi}`:'over 30 years'}; with 30% lower rent: ${lo?`year ${lo}`:'over 30 years'}.`);
}

/* ===================== Optimizer ===================== */
function renderOpt(){
  const t=theme(),p=P,DP=[0,3.5,5,10,15,20,25,30,40,50,60,80,100],H=[...Array(30)].map((_,k)=>k+1);
  const q0=Object.assign({},p,{term:OPT_TERM,rate:OPT_TERM===15?p.rate15:p.rate30});
  const res=DP.map(dp=>{const q=Object.assign({},q0,{dp:dp/100});const o=simulate(q,constPath(q,30),{N:30});return H.map(h=>100*adj(o.buy[h]-o.inv[h],o.cpi[h])/p.P)});
  const z=H.map((h,j)=>DP.map((_,i)=>res[i][j]));const zmax=Math.max(1,...z.flat().map(Math.abs));
  const best=H.map((h,j)=>{let bi=0;DP.forEach((_,i)=>{if(res[i][j]>res[bi][j])bi=i});return DP[bi]});
  plot('p-opt',[{x:DP.map(String),y:H,z,type:'heatmap',zmin:-zmax,zmax,colorscale:divScale(t),colorbar:{title:{text:'% of price',side:'right'},thickness:10,outlinewidth:0},hovertemplate:'%{x}% down, %{y} yr: %{z:.0f}% of price<extra></extra>'},
    {x:DP.map(String),y:H,z,type:'contour',contours:{start:0,end:0,size:1,coloring:'none'},line:{color:t.ink,width:1.5},showscale:false,hoverinfo:'skip'},
    {x:best.map(String),y:H,mode:'markers',marker:{size:7,color:t.ink,symbol:'circle'},name:'Best down payment',hovertemplate:'best at %{y} yr: %{x}% down<extra></extra>'}],
    {hovermode:'closest',showlegend:false,xaxis:{...X(`Down payment (%), ${OPT_TERM}-year loan`),type:'category'},yaxis:Yt('Horizon (years)')});
  const HS=[3,5,7,10,15,20,30];
  const solve=(h,key,lo,hi,map)=>{const q=Object.assign({},p,{N:h});const r=bisect(v=>advAt(q,map?map(v):{[key]:v}),lo,hi,32);return r};
  const rowsDef=[['Rent ($/mo)',h=>solve(h,'rent0',10,Math.max(500,p.rent0*6)),v=>fmtFull(v),fmtFull(p.rent0)],
    ['Home appreciation (%/yr)',h=>solve(h,'gh',-0.2,0.3),v=>pct(v),pct(p.gh)],
    ['Stock return (%/yr)',h=>p.ws>0?solve(h,'rs',-0.1,0.4):null,v=>pct(v),pct(p.rs)],
    ['Mortgage rate (%)',h=>solve(h,'rate',0.0,0.2,v=>({rate:v,rate30:v,rateLR:v})),v=>pct(v,2),pct(p.rate,2)],
    ['Home price ($)',h=>solve(h,'P',p.P*0.2,p.P*3),v=>fmtFull(v),fmtFull(p.P)]];
  const head=`<thead><tr><th>Break-even value</th><th>You</th>${HS.map(h=>`<th>${h} yr</th>`).join('')}</tr></thead>`;
  const body=rowsDef.map(([lab,f,fm,you])=>`<tr><td>${lab}</td><td>${you}</td>${HS.map(h=>{const v=f(h);return `<td>${v==null?'—':fm(v)}</td>`}).join('')}</tr>`).join('');
  const adv=`<tr class="hl"><td>Buy advantage now</td><td></td>${HS.map(h=>`<td>${fmt(advAt(p,{N:h}))}</td>`).join('')}</tr>`;
  document.getElementById('solveT').innerHTML=head+'<tbody>'+adv+body+'</tbody>';
  {const j=p.N-1,bdp=best[j],bi=DP.indexOf(bdp),bv=res[bi][j];const you=100*advAt(Object.assign({},p,{term:OPT_TERM,rate:OPT_TERM===15?p.rate15:p.rate30}),{})/p.P;
   const all=DP.map((_,i)=>res[i][j]),mono=all.every((v,i)=>i===0||v>=all[i-1]-1e-9),dec=all.every((v,i)=>i===0||v<=all[i-1]+1e-9);
   tk('opt',(Math.abs(bv-you)<1?`With a ${OPT_TERM}-year loan and a ${p.N}-year stay, your ${pct(p.dp,0)} down is already about as good as any down payment shown (${sgnP(you)} of price). `:`With a ${OPT_TERM}-year loan and a ${p.N}-year stay, ${bdp}% down does best (${sgnP(bv)} of price) vs. ${sgnP(you)} at your ${pct(p.dp,0)}. `)+
     (mono?'Putting more down always helps here, because the loan costs more than the portfolio earns after tax.':dec?'Putting less down helps here, because the portfolio is expected to earn more than the loan costs.':'The effect of the down payment is mixed: PMI below 20% and the rate-versus-return trade-off pull in different directions.'))}
}

/* ===================== Backtest ===================== */
function metroRentAnnual(m){if(!m||!m.rentG)return null;return YEARS.map(y=>m.rentG[y]!=null?m.rentG[y]:null)}
function rentSeries(useMetro){const ma=useMetro?metroRentAnnual(curMetro()):null;return RENTG.map((v,i)=>ma&&ma[i]!=null?ma[i]:v)}
function homeSeries(useMetro){const m=curMetro(),ma=useMetro?metroAnnual(m):null;return HOME.map((v,i)=>ma&&ma[i]!=null?ma[i]:v)}
function histPathAnnual(start,N,home,rent){const i0=start-Y0;const g=a=>a.slice(i0,i0+N).map(v=>v/100);
  return {gh:g(home),gr:g(rent||RENTG),rs:g(STK),rb:g(BOND),rc:g(BILL),inf:g(INF),mkt:[...Array(N)].map((_,k)=>{const y=start+k;return y>=MORT0&&y<=2025?MORT[y-MORT0]/100:null})}}
let MGH_ADJ=null;
function monthlyHome(){if(!VOLADJ||!MONTHLY.ghK||MONTHLY.ghK===1)return MONTHLY.gh;if(MGH_ADJ)return MGH_ADJ;
  const mean=MONTHLY.gh.reduce((a,b)=>a+b,0)/MONTHLY.gh.length;return MGH_ADJ=MONTHLY.gh.map(x=>mean+MONTHLY.ghK*(x-mean))}
function histPathMonthly(s,N){const k=N*12,sl=a=>a.slice(s,s+k);return {monthly:true,gh:sl(monthlyHome()),gr:sl(MONTHLY.gr),rs:sl(MONTHLY.rs),rb:sl(MONTHLY.rb),rc:sl(MONTHLY.rc),inf:sl(MONTHLY.inf),mkt:sl(MONTHLY.mkt)}}
function renderHist(){
  const t=theme(),p=P,useNow=document.getElementById('h-rate').value==='now',useMetro=document.getElementById('h-home').value==='metro';
  const mode=document.getElementById('h-mode').value==='monthly'&&MONTHLY?'monthly':'annual';
  const m=curMetro(),ms=metroStart(m);
  let note=`${mode==='monthly'?`Monthly data ${MONTHLY.dates[0]} to ${MONTHLY.dates.at(-1)}; national home prices from FHFA's purchase-only index${VOLADJ&&MONTHLY.ghK?`, swings scaled ×${MONTHLY.ghK.toFixed(2)} to Case-Shiller size`:''}.`:`Annual data. Home prices: ${useMetro&&ms?`${m.name} from ${ms}, national before that.`:'national.'} Rents: ${useMetro&&m.rentG?`${m.name} rent index where BLS publishes one, its region otherwise.`:'national.'}`} Refinancing ${p.refiOn?`on (when rates fall ${(p.refiTh*100).toFixed(2)} pts below your loan rate).`:'off.'}`;
  if(mode==='monthly'&&useMetro&&m.slug!=='us')note+=' Metro prices are available only in annual mode.';
  document.getElementById('h-note').textContent=note;
  let runs=[];
  if(mode==='annual'){const home=homeSeries(useMetro),rentS=rentSeries(useMetro);
    for(let s=1972;s<=2025;s++){const N=Math.min(30,2025-s+1);const rate=useNow?p.rate:MORT[s-MORT0]/100;const o=simulate(p,histPathAnnual(s,N,home,rentS),{N,rate});
      runs.push({s,lab:String(s),N,adv:o.buy.map((b,k)=>(b-o.inv[k])/o.cpi[k]/p.P*100),o,rate})}}
  else{const T=MONTHLY.gh.length;for(let s=0;s+12<=T;s++){const N=Math.min(30,Math.floor((T-s)/12));const rate=useNow?p.rate:MONTHLY.mkt[s];
      const o=simulate(p,histPathMonthly(s,N),{N,rate});const d=MONTHLY.dates[s];runs.push({s:+d.slice(0,4)+(+d.slice(5,7)-1)/12,lab:d,N,adv:o.buy.map((b,k)=>(b-o.inv[k])/o.cpi[k]/p.P*100),o,rate,jan:d.endsWith('-01')})}}
  const lines=mode==='annual'?runs:runs.filter(r=>r.jan);
  const s0=lines[0].s,s1=lines.at(-1).s;
  const sp=lines.map(r=>{const c=(r.s-s0)/(s1-s0||1);return {x:r.adv.map((_,k)=>k),y:r.adv,mode:'lines',name:r.lab,showlegend:false,
    line:{width:1.3,color:`rgba(${Math.round(40+180*c)},${Math.round(90+40*(1-c))},${Math.round(200-150*c)},0.7)`},hovertemplate:`start ${r.lab}: %{y:.0f}%<extra></extra>`}});
  const med=[];for(let h=0;h<=30;h++){const v=runs.filter(r=>r.adv.length>h).map(r=>r.adv[h]).sort((a,b)=>a-b);if(v.length>=5)med.push([h,v[Math.floor(v.length/2)]])}
  sp.push({x:med.map(m=>m[0]),y:med.map(m=>m[1]),mode:'lines',name:'Median across starts',line:{color:t.ink,width:3.5},hovertemplate:'median %{y:.0f}%<extra></extra>'});
  plot('p-spag',sp,{hovermode:'closest',xaxis:X('Years after purchase'),yaxis:Yt('Buy − rent&invest, real, % of price',{ticksuffix:'%'}),
    annotations:[{xref:'paper',yref:'paper',x:0,y:1,xanchor:'left',yanchor:'top',showarrow:false,text:'early starts blue → recent red',font:{size:11,color:t.muted}}]});
  const H=[...Array(30)].map((_,k)=>k+1),xs=runs.map(r=>r.s);
  const z=H.map(h=>runs.map(r=>r.adv.length>h?r.adv[h]:null));
  const zmax=Math.min(150,Math.max(1,...z.flat().filter(v=>v!=null).map(Math.abs)));
  const win=runs.filter(r=>r.adv.length>p.N),share=win.filter(r=>r.adv[p.N]>0).length/(win.length||1);
  plot('p-hheat',[{x:xs,y:H,z,type:'heatmap',zmin:-zmax,zmax,colorscale:divScale(t),hoverongaps:false,colorbar:{title:{text:'% of price',side:'right'},thickness:10,outlinewidth:0},
    customdata:H.map(()=>runs.map(r=>r.lab)),hovertemplate:'bought %{customdata}, after %{y} yr: %{z:.0f}%<extra></extra>'},
    {x:xs,y:H,z,type:'contour',contours:{start:0,end:0,size:1,coloring:'none'},line:{color:t.ink,width:1.5},showscale:false,hoverinfo:'skip'}],
    {hovermode:'closest',xaxis:X(`Start · buying won in ${(share*100).toFixed(0)}% of ${win.length} starts at ${p.N} yr`),yaxis:Yt('Horizon (years)')});
  {const at=win.map(r=>({lab:r.lab,v:r.adv[p.N]})).sort((a,b)=>a.v-b.v);
   if(at.length){const md=at[Math.floor(at.length/2)].v,w=at[0],bst=at.at(-1);
     tk('spag',`Over ${at.length} historical starts with at least ${nY(p.N)} of data, buying won ${pct(share,0)} of the time. The median outcome was ${sgnP(md)} of the price; the worst was ${sgnP(w.v)} (bought ${w.lab}) and the best ${sgnP(bst.v)} (bought ${bst.lab}).`,'In history:');
     const decs={};runs.forEach(r=>{if(r.adv.length>p.N){const d=Math.floor(r.s/10)*10;(decs[d]=decs[d]||[]).push(r.adv[p.N]>0)}});
     tk('hheat','Share of starts where buying won at your horizon, by decade bought: '+Object.entries(decs).map(([d,a])=>`${d}s ${pct(a.filter(Boolean).length/a.length,0)}`).join(' · ')+'.','In history:')}
   else{tk('spag','Not enough history for this horizon; shorten it to see results.','In history:');tk('hheat','')}}
  let ys=parseInt(document.getElementById('h-year').value);if(!(ys>=1972&&ys<=2025))ys=2000;
  const r=mode==='annual'?runs.find(q=>q.s===ys):(runs.find(q=>q.lab===`${ys}-01`)||runs[0]);
  if(!r)return;const o=r.o,x=o.buy.map((_,k)=>Math.floor(r.s)+k);
  document.getElementById('h-detail-cap').textContent=`Bought ${r.lab} at ${(r.rate*100).toFixed(2)}%${o.refis?`, refinanced ${o.refis}× (last rate ${(o.rateAt.at(-1)*100).toFixed(2)}%)`:''}. Real dollars; today's price and rent scaled by the historical paths.`;
  const tr=(a,n,c,d)=>({x,y:a.map((v,k)=>v/o.cpi[k]),name:n,mode:'lines',line:{color:c,width:2.5,dash:d},hovertemplate:'%{y:$,.0f}'});
  {const Nn=o.buy.length-1,g=(o.buy[Nn]-o.inv[Nn])/o.cpi[Nn];tk('hdet',`Bought ${r.lab}, after ${nY(Nn)}: ${gapTxt(g)} in today's dollars.${o.refis?` The buyer refinanced ${o.refis} time${o.refis>1?'s':''} along the way.`:''}`,'This start:')}
  plot('p-hdet',[tr(o.buy,'Buy',t.buy),tr(o.inv,'Rent + invest',t.inv),tr(o.cash,'Rent + T-bills',t.cash,'dot'),
    {x,y:o.rateAt.map(v=>v*100),name:'Loan rate',yaxis:'y2',mode:'lines',line:{color:t.neg,width:1.2,shape:'hv'},hovertemplate:'%{y:.2f}%'}],
    {xaxis:X('Year'),yaxis:Yd('Real net worth'),yaxis2:{overlaying:'y',side:'right',ticksuffix:'%',showgrid:false,tickfont:{family:'IBM Plex Mono',color:t.neg}},margin:{l:64,r:44,t:10,b:innerWidth<600?72:48}});
}

/* ===================== Monte Carlo ===================== */
/* Monte Carlo runs in a background worker built from the model script; falls back to the main thread */
let MC_REQ=0,WORKER=null,WORKER_OK=null;
function mcControls(){return {n:Math.max(200,Math.min(10000,parseInt(document.getElementById('mc-n').value)||1500)),bl:Math.max(1,parseInt(document.getElementById('mc-b').value)||5),
  from:parseInt(document.getElementById('mc-w').value),rc:document.getElementById('mc-rc').checked}}
function mcKey(){return JSON.stringify(getRaw())+REAL+JSON.stringify(mcControls())}
function getWorker(){if(WORKER_OK===false)return null;if(WORKER)return WORKER;
  try{const src=document.getElementById('model-script').textContent+"\nonmessage=e=>{const {id,p,cfg}=e.data;try{postMessage({id,r:mcCore(p,cfg)})}catch(err){postMessage({id,err:String(err)})}}";
    WORKER=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
    WORKER.onmessage=e=>{const {id,r,err}=e.data;const job=PENDING[id];delete PENDING[id];if(!job)return;if(err){console.error(err);runLocal(job);return}job.done(r)};
    WORKER.onerror=e=>{console.error('worker',e.message);WORKER_OK=false;WORKER=null;Object.values(PENDING).forEach(runLocal);PENDING={}};
    WORKER_OK=true;return WORKER}catch(e){WORKER_OK=false;return null}}
let PENDING={};
function runLocal(job){setTimeout(()=>job.done(mcCore(job.p,job.cfg)),0)}
function startMC(full){
  const c=mcControls(),n=full?c.n:600,id=++MC_REQ,key=mcKey();
  const cfg={n,bl:c.bl,from:c.from,rc:c.rc,home:homeSeries(true),rent:rentSeries(true),real:REAL},p=P;
  const job={p,cfg,done:r=>{if(id!==MC_REQ)return;MC=Object.assign(r,{real:REAL,key,quick:!full});onMCReady()}};
  const w=getWorker();if(w){PENDING[id]=job;w.postMessage({id,p,cfg})}else runLocal(job);
}
function mcFresh(full){return MC&&MC.key===mcKey()&&(!full||!MC.quick)}
function onMCReady(){summary();if(CUR==='mc')drawMC();else if(CUR==='proj')renderProj()}
function runMC(){/* kept for compatibility */const c=mcControls();MC=Object.assign(mcCore(P,{n:c.n,bl:c.bl,from:c.from,rc:c.rc,home:homeSeries(true),real:REAL}),{real:REAL,key:mcKey(),quick:false})}
function q(a,f){const s=[...a].sort((x,y)=>x-y);const i=(s.length-1)*f,lo=Math.floor(i);return s[lo]+(s[Math.min(lo+1,s.length-1)]-s[lo])*(i-lo)}
function ce(ws,g,floor){const w=ws.map(v=>Math.max(floor,v));if(Math.abs(g-1)<1e-6)return Math.exp(w.reduce((a,v)=>a+Math.log(v),0)/w.length);
  const mx=Math.max(...w);const m=w.reduce((a,v)=>a+Math.pow(v/mx,1-g),0)/w.length;return mx*Math.pow(m,1/(1-g))}
function renderMC(){if(mcFresh(true)){drawMC();return}
  document.getElementById('mc-note').textContent='Running simulations…';startMC(true)}
function drawMC(){if(!MC)return;
  const t=theme(),{res,N,n}=MC,h=Math.min(P.N,MC.N),x=[...Array(h+1)].map((_,k)=>k);
  document.getElementById('mc-note').textContent=`Own-home price risk ${pct(P.idio)} (${P.idioMode==='sale'?'one-time at sale':'compounding yearly'}) and moving risk ${pct(P.hz)}/yr are set under Life & risk preferences. Upkeep varies year to year around its average (coefficient of variation ${MAINT_CV}), so big repairs arrive in lumps. Mortgage-rate changes are sampled from the same years (observed 1973–2025; earlier years modeled from inflation changes, slope ${DM_FIT.b.toFixed(2)}, residual s.d. ${DM_FIT.s.toFixed(2)} pts).`;
  const band=(arr,name,col)=>{const cut=f=>x.map(y=>q(arr.map(a=>a[y]),f));const p5=cut(.05),p25=cut(.25),p50=cut(.5),p75=cut(.75),p95=cut(.95);
    return [{x,y:p95,mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip',legendgroup:name},
     {x,y:p5,mode:'lines',line:{width:0},fill:'tonexty',fillcolor:hexA(col,.12),showlegend:false,legendgroup:name,hoverinfo:'skip'},
     {x,y:p75,mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip',legendgroup:name},
     {x,y:p25,mode:'lines',line:{width:0},fill:'tonexty',fillcolor:hexA(col,.28),showlegend:false,legendgroup:name,hoverinfo:'skip'},
     {x,y:p50,mode:'lines',line:{color:col,width:2.6},name:name+' (median)',legendgroup:name,customdata:x.map((_,k)=>[p5[k],p95[k]]),hovertemplate:'%{y:$,.0f} <span style="opacity:.7">[5–95%: %{customdata[0]:$,.0f} – %{customdata[1]:$,.0f}]</span>'}]};
  plot('p-fan',[...band(res.cash,'Rent + T-bills',t.cash),...band(res.inv,'Rent + invest',t.inv),...band(res.buy,'Buy',t.buy)].concat(P.rentalOn&&res.rental.length?band(res.rental,'Rent + rental',t.rp):[]),{xaxis:X('Years from today'),yaxis:Yd('Net worth, '+basisLabel())});
  // risk table
  const W0=P.P*(P.dp+P.close),floor=Math.max(1000,0.01*W0);
  const stats=(arr,lq)=>{const w=arr.map(a=>a[h]);const sorted=[...w].sort((a,b)=>a-b);const k=Math.max(1,Math.floor(0.05*w.length));
    const mean=w.reduce((a,b)=>a+b,0)/w.length,sd=Math.sqrt(w.reduce((a,v)=>a+(v-mean)**2,0)/w.length);
    return {mean,med:q(w,.5),p5:q(w,.05),p95:q(w,.95),es:sorted.slice(0,k).reduce((a,b)=>a+b,0)/k,sd,ce:ce(w,P.gamma,floor),lq:lq?lq.filter(v=>v<3).length/lq.length:null}};
  const S={buy:stats(res.buy,res.lqMinB),inv:stats(res.inv,res.lqMinR),cash:stats(res.cash,null)};const KS=['buy','inv','cash'];if(P.rentalOn&&res.rental.length){S.rp=stats(res.rental,null);KS.push('rp')}
  const rows=[['Mean','mean',fmt],['Median','med',fmt],['5th percentile','p5',fmt],['95th percentile','p95',fmt],['Expected shortfall (worst 5%)','es',fmt],['Standard deviation','sd',fmt],[`Certainty equivalent (γ = ${P.gamma})`,'ce',fmt],['Liquid < 3 months of costs (first 5 yrs)','lq',v=>v==null?'—':pct(v,0)]];
  const best=k=>{const vals=KS.map(s=>S[s][k]);return k==='sd'||k==='lq'?null:Math.max(...vals)};
  document.getElementById('risk-cap').textContent=`At year ${h}, ${basisLabel()}, across ${n.toLocaleString()} paths. Floor of ${fmt(floor)} applied to wealth in the certainty equivalent.`;
  document.getElementById('riskT').innerHTML=`<thead><tr><th>Metric</th><th><span class="swatch" style="background:var(--buy)"></span>Buy</th><th><span class="swatch" style="background:var(--inv)"></span>Rent + invest</th><th><span class="swatch" style="background:var(--cash)"></span>Rent + T-bills</th>${KS.includes('rp')?'<th><span class="swatch" style="background:var(--rp)"></span>Rent + rental</th>':''}</tr></thead><tbody>`+
    rows.map(([lab,k,f])=>{const b=best(k);return `<tr${k==='ce'?' class="hl"':''}><td>${lab}</td>${KS.map(s=>`<td${b!=null&&S[s][k]===b?' style="color:var(--'+s+')"':''}>${f(S[s][k])}</td>`).join('')}</tr>`}).join('')+
    `<tr><td>Buying wins, fixed horizon</td><td colspan="${KS.length}">${pct(MC.pWin[h])}</td></tr><tr><td>Buying wins, with ${pct(P.hz,0)}/yr chance of moving${P.stressMult>1||P.forcedDisc>0?', likelier and at a discount in bad years':''}</td><td colspan="${KS.length}">${pct(MC.pMove)}</td></tr>`+
    (MC.pWinR?`<tr><td>Rental property beats rent + invest</td><td colspan="${KS.length}">${pct(MC.pWinR[h])}</td></tr>`:'')+'</tbody>';
  const xx=[...Array(N+1)].map((_,k)=>k);
  plot('p-prob',[{x:xx,y:MC.pWin,name:'vs rent + invest',mode:'lines',line:{color:t.inv,width:2.5},hovertemplate:'%{y:.0%}'},
    {x:xx,y:MC.pWinC,name:'vs rent + T-bills',mode:'lines',line:{color:t.cash,width:2.5,dash:'dot'},hovertemplate:'%{y:.0%}'},
    ...(MC.pWinR?[{x:xx,y:MC.pWinR,name:'rental property vs rent + invest',mode:'lines',line:{color:t.rp,width:2,dash:'dashdot'},hovertemplate:'%{y:.0%}'}]:[]),
    {x:[h],y:[MC.pMove],mode:'markers',name:'with moving risk',marker:{size:10,color:t.ink,symbol:'diamond'},hovertemplate:'with random moving: %{y:.0%}<extra></extra>'}],
    {xaxis:X('Horizon (years)'),yaxis:Yt('P(buy wins)',{tickformat:'.0%',range:[0,1]}),shapes:[{type:'line',x0:0,x1:N,y0:.5,y1:.5,line:{color:t.muted,dash:'dash',width:1}},{type:'line',x0:h,x1:h,y0:0,y1:1,line:{color:t.line,width:1}}]});
  const d=res.buy.map((b,s)=>b[h]-res.inv[s][h]);
  document.getElementById('mc-histcap').textContent=`Buy minus rent&invest at year ${h}. Median ${fmt(q(d,.5))}, 5th pct ${fmt(q(d,.05))}, 95th pct ${fmt(q(d,.95))}.`;
  plot('p-mchist',[{x:d,type:'histogram',nbinsx:60,marker:{color:d.map(v=>v>0?hexA(t.buy,.75):hexA(t.inv,.75))},hovertemplate:'%{x}<br>%{y} paths<extra></extra>'}],
    {hovermode:'closest',bargap:0.02,showlegend:false,xaxis:{...X('Buy − rent&invest, '+basisLabel()),tickprefix:'$',tickformat:'~s'},yaxis:Yt('Paths'),shapes:[{type:'line',x0:0,x1:0,yref:'paper',y0:0,y1:1,line:{color:t.ink,width:1.5}}]});
  const dm=Math.max(1,...d.map(Math.abs));
  plot('p-mcsc',[{x:res.gH,y:res.gP,mode:'markers',type:'scatter',marker:{size:4,color:d,cmin:-dm,cmax:dm,colorscale:[[0,t.inv],[0.5,t.muted],[1,t.buy]],opacity:.7,
    colorbar:{title:{text:'advantage',side:'right'},thickness:10,outlinewidth:0,tickprefix:'$',tickformat:'~s'}},hovertemplate:'home %{x:.1f}%/yr, portfolio %{y:.1f}%/yr<br>%{marker.color:$,.0f}<extra></extra>'}],
    {hovermode:'closest',xaxis:X(`Own-home appreciation, annualized over ${h} yr (%)`),yaxis:Yt('Portfolio return, annualized (%)')});
  const yr=[...Array(N)].map((_,k)=>k+1),rq=f=>yr.map((_,k)=>100*q(res.rates.map(a=>a[k]),f));
  const nref=res.refis.filter(v=>v>0).length/n,avgRef=res.refis.reduce((a,b)=>a+b,0)/n;
  {const B=res.buy.map(a=>a[h]),I=res.inv.map(a=>a[h]);
   tk('fan',`At year ${h}, the median future leaves ${fmt(q(B,.5))} if you buy and ${fmt(q(I,.5))} if you rent and invest. One in twenty futures leaves the buyer below ${fmt(q(B,.05))} (renter: ${fmt(q(I,.05))}).`);
   let cross=null;for(let y=1;y<=N;y++){if(MC.pWin[y]>=0.5&&MC.pWin.slice(y).every(v=>v>=0.5)){cross=y;break}}
   tk('prob',`Buying beats renting-and-investing in ${pct(MC.pWin[h],0)} of futures at ${nY(h)}${P.hz>0?`, or ${pct(MC.pMove,0)} once early moves are included (${pct(MC.pForced,0)} of futures have a move during a downturn)`:''}. `+(cross?`It wins more often than not from year ${cross} on.`:'It never wins more often than not within 30 years.')+` Against renting with T-bills it wins ${pct(MC.pWinC[h],0)}.`);
   const mean=d.reduce((a,b)=>a+b,0)/d.length,med=q(d,.5);
   tk('mchist',`The middle half of outcomes runs from ${fmt(q(d,.25))} to ${fmt(q(d,.75))}. `+(mean<med-0.05*Math.abs(med)?`The average (${fmt(mean)}) is below the median (${fmt(med)}): the downside tail for buying is longer than the upside.`:mean>med+0.05*Math.abs(med)?`The average (${fmt(mean)}) is above the median (${fmt(med)}): a few very good futures for buying pull it up.`:`Average and median are close (${fmt(mean)} vs ${fmt(med)}), so the outcomes are fairly symmetric.`));
   let a1=0,n1=0,a2=0,n2=0;res.gH.forEach((g,i)=>{const w=d[i]>0;if(g>res.gP[i]-4){n1++;if(w)a1++}else{n2++;if(w)a2++}});
   tk('mcsc',`When your home's yearly gain came within 4 points of the portfolio's, buying won ${n1?pct(a1/n1,0):'—'} of the time; when stocks beat the home by more than that, ${n2?pct(a2/n2,0):'—'}. Leverage is why the home doesn't need to match stocks to win.`);
   const k=Math.min(5,N),hit=res.rates.filter(a=>Math.min(...a.slice(0,k))<=P.rate-P.refiTh).length/n;
   tk('mcrate',`In ${pct(hit,0)} of futures the market rate falls at least ${(P.refiTh*100).toFixed(2)} points below your ${pct(P.rate,2)} within ${nY(k)}${P.refiOn?', triggering a refinance':' (refinancing is off)'}.`)}
  plot('p-mcrate',[{x:yr,y:rq(.95),mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip'},{x:yr,y:rq(.05),mode:'lines',line:{width:0},fill:'tonexty',fillcolor:hexA(t.neg,.15),name:'5–95%',hoverinfo:'skip'},
    {x:yr,y:rq(.5),mode:'lines',line:{color:t.neg,width:2.5},name:'Median market rate',hovertemplate:'%{y:.2f}%'}],
    {xaxis:X('Years from today'),yaxis:Yt('30-yr rate',{ticksuffix:'%'}),annotations:[{xref:'paper',yref:'paper',x:0,y:1,xanchor:'left',yanchor:'top',showarrow:false,text:P.refiOn?`${pct(nref,0)} of paths refinance at least once · ${avgRef.toFixed(2)} refis on average`:'refinancing is off',font:{size:11,color:t.muted}}]});
}

/* ===================== Scenarios ===================== */
const SC_KEY='rbi-scen';
function loadSc(){try{return JSON.parse(localStorage.getItem(SC_KEY)||'[]')}catch(e){return []}}
function saveSc(a){try{localStorage.setItem(SC_KEY,JSON.stringify(a));return true}catch(e){return false}}
const SCOL=()=>{const t=theme();return [t.ink,t.buy,t.inv,t.cash,t.neg,t.accent,t.muted]};
function scenarioResult(raw){const p=parseP(raw);const o=simulate(p,constPath(p,30),{N:30});return {p,o}}
function renderScen(){
  const list=loadSc(),t=theme(),cols=SCOL();
  document.getElementById('scList').innerHTML=list.length?list.map((s,i)=>{const {p}=scenarioResult(s.raw);const m=METROS.find(x=>x.slug===p.metro);
    return `<div class="row"><span class="swatch" style="background:${cols[(i+1)%cols.length]}"></span><span class="nm">${escapeHtml(s.name)}</span><span class="meta">${m?m.name+' · ':''}${fmtFull(p.P)} · ${fmtFull(p.rent0)}/mo · ${pct(p.dp,0)} down · ${pct(p.rate,2)} · ${p.N} yr</span><button data-load="${i}">Load</button><button data-del="${i}">Delete</button></div>`}).join(''):'<p class="sub">No saved scenarios yet. Set up inputs, give them a name, and save.</p>';
  document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{setRaw(list[+b.dataset.load].raw);update()});
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{list.splice(+b.dataset.del,1);saveSc(list);renderScen()});
  renderCompare(list);
  const all=[{name:'Current inputs',raw:getRaw()}].concat(list);
  const results=all.map(s=>Object.assign({name:s.name},scenarioResult(s.raw)));
  plot('p-scen',results.map((r,i)=>({x:r.o.buy.map((_,k)=>k),y:r.o.buy.map((b,k)=>adj(b-r.o.inv[k],r.o.cpi[k])),name:r.name,mode:'lines',line:{color:cols[i%cols.length],width:i===0?3:2,dash:i===0?'solid':undefined},hovertemplate:'%{y:$,.0f}'})),
    {xaxis:X('Years'),yaxis:Yd('Buy − rent&invest, '+basisLabel()),shapes:[{type:'line',xref:'paper',x0:0,x1:1,y0:0,y1:0,line:{color:t.muted,width:1}}]});
  {const be=results.map(r=>({n:r.name,b:breakevenYear(r.o)}));const ok=be.filter(x=>x.b).sort((a,b)=>a.b-b.b);
   tk('scen',results.length<2?'Save a scenario to compare it with the current inputs.':(ok.length?`${escapeHtml(ok[0].n)} breaks even first (year ${ok[0].b}).`+(be.length>ok.length?` ${be.length-ok.length} scenario${be.length-ok.length>1?'s':''} never break${be.length-ok.length>1?'':'s'} even within 30 years.`:''):'No scenario breaks even within 30 years.'))}
  document.getElementById('scT').innerHTML='<thead><tr><th>Scenario</th><th>Horizon</th><th>Buy</th><th>Rent + invest</th><th>Gap</th><th>Break-even yr</th><th>P/R</th></tr></thead><tbody>'+
    results.map(r=>{const N=r.p.N,c=r.o.cpi[N],b=adj(r.o.buy[N],c),iv=adj(r.o.inv[N],c),be=breakevenYear(r.o);return `<tr><td>${escapeHtml(r.name)}</td><td>${N}</td><td>${fmt(b)}</td><td>${fmt(iv)}</td><td style="color:var(${b>=iv?'--buy':'--inv'})">${b>=iv?'+':''}${fmt(b-iv)}</td><td>${be||'>30'}</td><td>${(r.p.P/(r.p.rent0*12)).toFixed(1)}</td></tr>`}).join('')+'</tbody>';
}
function renderCompare(list){
  const opts=[{name:'Current inputs',raw:getRaw()}].concat(list);
  const sa=document.getElementById('cmpA'),sb=document.getElementById('cmpB');
  const fill=(sel,def)=>{const v=sel.value;sel.innerHTML=opts.map((o,i)=>`<option value="${i}">${escapeHtml(o.name)}</option>`).join('');sel.value=sel.dataset.touched&&v&&+v<opts.length?v:String(def)};
  fill(sa,0);fill(sb,Math.min(1,opts.length-1));
  const pick=i=>{const o=opts[+i];const {p,o:sim}=scenarioResult(o.raw);return {name:o.name,p,sim}};
  const A=pick(sa.value),B=pick(sb.value),t=theme();
  const stat=r=>{const N=r.p.N,c=r.sim.cpi[N],b=adj(r.sim.buy[N],c),iv=adj(r.sim.inv[N],c);const L=r.p.P*(1-r.p.dp),M=pmt(L,r.p.rate/12,r.p.term*12);
    const own1=month1Cost(r.p);
    const m=METROS.find(x=>x.slug===r.p.metro);
    return {loc:m?m.name:'—',price:r.p.P,rent:r.p.rent0,ptr:r.p.P/(r.p.rent0*12),N,b,iv,gap:b-iv,be:breakevenYear(r.sim),own1,cash:r.p.P*(r.p.dp+r.p.close),fe:r.p.income?own1/(r.p.income/12):null}};
  const a=stat(A),b=stat(B);
  const rows=[['Location','loc',v=>v],['Home price','price',fmtFull],['Rent','rent',v=>fmtFull(v)+'/mo'],['Price-to-rent','ptr',v=>v.toFixed(1)],['Horizon','N',v=>v+' yr'],
    ['Buy net worth','b',fmt,1],['Rent + invest net worth','iv',fmt,1],['Buy − rent&invest','gap',v=>`<span style="color:var(${v>=0?'--buy':'--inv'})">${v>=0?'+':''}${fmt(v)}</span>`,1],
    ['Break-even year','be',v=>v?v+' yr':'> 30',0,-1],['Owning, month 1','own1',v=>fmtFull(v)+'/mo',0,-1],['Cash to buy','cash',fmtFull,0,-1],['Housing / income','fe',v=>v==null?'n/a':pct(v,0),0,-1]];
  document.getElementById('cmpT').innerHTML=`<thead><tr><th></th><th>${escapeHtml(A.name)}</th><th>${escapeHtml(B.name)}</th></tr></thead><tbody>`+
    rows.map(([lab,k,f,hi,dir])=>{let ca='',cb='';if(hi||dir){const x=a[k]==null?null:a[k],y=b[k]==null?null:b[k];if(x!=null&&y!=null&&x!==y){const better=(dir===-1)?(x<y?'a':'b'):(x>y?'a':'b');if(better==='a')ca=' class="better"';else cb=' class="better"'}}
      return `<tr><td>${lab}</td><td${ca}>${f(a[k])}</td><td${cb}>${f(b[k])}</td></tr>`}).join('')+'</tbody>';
  const line=(r,col,dash,lab)=>{const o=r.sim;return [{x:o.buy.map((_,k)=>k),y:o.buy.map((v,k)=>adj(v,o.cpi[k])),name:`${lab}: buy`,mode:'lines',line:{color:t.buy,width:2.4,dash},hovertemplate:'%{y:$,.0f}'},
    {x:o.inv.map((_,k)=>k),y:o.inv.map((v,k)=>adj(v,o.cpi[k])),name:`${lab}: rent + invest`,mode:'lines',line:{color:t.inv,width:2.4,dash},hovertemplate:'%{y:$,.0f}'}]};
  tk('cmp',sa.value===sb.value?'Pick two different scenarios above, or save one first.':`${escapeHtml(A.name)}: ${gapTxt(a.gap)} at year ${a.N}. ${escapeHtml(B.name)}: ${gapTxt(b.gap)} at year ${b.N}.`);
  plot('p-cmp',[...line(A,null,'solid','A'),...line(B,null,'dot','B')],{xaxis:X('Years'),yaxis:Yd('Net worth, '+basisLabel())});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* ===================== Data tab ===================== */
let dataDone=false;
function renderData(){
  const t=theme(),x=[1927,...YEARS];
  const cum=a=>{let v=1;const out=[1];a.forEach((r,i)=>{v*=(1+r/100);out.push(v/(CPIL[i+1]/CPIL[0]))});return out};
  plot('p-cum',[
    {x,y:cum(STK),name:'S&P 500 (total return)',line:{color:t.inv,width:2.3},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(BOND),name:'10-yr Treasury',line:{color:t.accent,width:1.6,dash:'dash'},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(BILL),name:'T-bills',line:{color:t.cash,width:1.6,dash:'dot'},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(HOME),name:'Home prices',line:{color:t.buy,width:2.3},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(RENTG),name:'Rent (CPI)',line:{color:t.neg,width:1.6},hovertemplate:'%{y:$,.2f}'}],
    {yaxis:Yt('Real value of $1 (log)',{type:'log',tickprefix:'$'}),xaxis:layout().xaxis});
  const m=curMetro(),ma=metroAnnual(m,true),ms=metroStart(m);
  if(ma&&ms){const yrs=YEARS.filter(y=>y>=ms);const idx=(a)=>{let v=100;return [100].concat(yrs.map(y=>{const i=y-Y0;v*=(1+a[i]/100)/(1+INF[i]/100);return v}))};
    document.getElementById('metro-cap').innerHTML=`Real home-price index, ${m.name} vs. national, rebased to 100 at end of ${ms-1}. Metro ${m.hpiSrc?m.hpiSrc.t:''} ${srcObj(m.hpiSrc)}. Metro annualized real growth ${pct(Math.pow(idx(ma).at(-1)/100,1/yrs.length)-1)}; national ${pct(Math.pow(idx(HOME).at(-1)/100,1/yrs.length)-1)}.`;
    {const a=idx(ma).at(-1),b=idx(HOME).at(-1);let pk=0,dd=0,v=100;idx(ma).forEach(x=>{if(x>pk)pk=x;dd=Math.min(dd,x/pk-1)});tk('metro',`Since ${ms-1}, ${m.name} home prices grew ${pct(Math.pow(a/100,1/yrs.length)-1)} a year after inflation vs. ${pct(Math.pow(b/100,1/yrs.length)-1)} nationally. Its worst fall from a peak, after inflation, was ${pct(-dd,0)}.`,'What stands out:')}
    plot('p-metro',[{x:[ms-1,...yrs],y:idx(ma),name:m.name,line:{color:t.buy,width:2.5},hovertemplate:'%{y:.0f}'},{x:[ms-1,...yrs],y:idx(HOME),name:'National',line:{color:t.muted,width:2,dash:'dash'},hovertemplate:'%{y:.0f}'}],{yaxis:Yt('Real index')})}
  else{document.getElementById('metro-cap').textContent='Choose a location in the top card to compare its home prices with the national index.';
    plot('p-metro',[{x:x.slice(60),y:cum(HOME).slice(60),name:'National home prices (real)',line:{color:t.buy,width:2.3}}],{yaxis:Yt('Real value of $1')})}
  {const c=cum(STK).at(-1),h=cum(HOME).at(-1),bb=cum(BOND).at(-1),n=YEARS.length;
   tk('cum',`After inflation, $1 in stocks in 1927 became $${c.toFixed(0)} (${pct(Math.pow(c,1/n)-1)} a year), in Treasury bonds $${bb.toFixed(1)}, and in home prices only $${h.toFixed(1)} (${pct(Math.pow(h,1/n)-1)} a year).`,'What stands out:')}
  const roll=a=>YEARS.map((_,i)=>{if(i<9)return null;let l=0;for(let k=i-9;k<=i;k++)l+=Math.log((1+a[k]/100)/(1+INF[k]/100));return (Math.exp(l/10)-1)*100});
  {const rs=roll(STK).filter(v=>v!=null),rh=roll(HOME).filter(v=>v!=null);
   tk('roll',`Stocks lost money after inflation over ${pct(rs.filter(v=>v<0).length/rs.length,0)} of 10-year windows; home prices over ${pct(rh.filter(v=>v<0).length/rh.length,0)}. Stocks' 10-year real return ranged from ${(Math.min(...rs)).toFixed(1).replace('-','−')}% to ${Math.max(...rs).toFixed(1)}% a year.`,'What stands out:')}
  plot('p-roll',[{x:YEARS,y:roll(STK),name:'Stocks',line:{color:t.inv,width:2},hovertemplate:'%{y:.1f}%'},{x:YEARS,y:roll(HOME),name:'Home prices',line:{color:t.buy,width:2},hovertemplate:'%{y:.1f}%'},{x:YEARS,y:roll(RENTG),name:'Rent',line:{color:t.neg,width:1.5},hovertemplate:'%{y:.1f}%'}],
    {yaxis:Yt('Real, annualized',{ticksuffix:'%'})});
  const ks=[['Home','gh'],['Rent','gr'],['Stocks','rs'],['Bonds','rb'],['Bills','rc'],['CPI','inf'],['Δ Mortgage','dm']];
  const getS=k=>k==='dm'?DM_OBS:SER[k];
  const corr=(a,b)=>{const pr=[];a.forEach((v,i)=>{if(v!=null&&b[i]!=null)pr.push([v,b[i]])});const n=pr.length,ma=pr.reduce((s,v)=>s+v[0],0)/n,mb=pr.reduce((s,v)=>s+v[1],0)/n;let sab=0,sa=0,sb=0;pr.forEach(([u,v])=>{sab+=(u-ma)*(v-mb);sa+=(u-ma)**2;sb+=(v-mb)**2});return sab/Math.sqrt(sa*sb)};
  const z=ks.map(([,a])=>ks.map(([,b])=>corr(getS(a),getS(b))));
  plot('p-corr',[{x:ks.map(k=>k[0]),y:ks.map(k=>k[0]),z,type:'heatmap',zmin:-1,zmax:1,colorscale:divScale(t),text:z.map(r=>r.map(v=>v.toFixed(2))),texttemplate:'%{text}',textfont:{family:'IBM Plex Mono',size:10,color:t.ink},showscale:false,hovertemplate:'%{y} × %{x}: %{z:.2f}<extra></extra>'}],
    {hovermode:'closest',margin:{l:76,r:10,t:10,b:60},yaxis:{autorange:'reversed',tickfont:{color:t.ink}},xaxis:{tickfont:{color:t.ink},tickangle:-40}});
  {const ci=ks.findIndex(k=>k[1]==='gh'),si=ks.findIndex(k=>k[1]==='rs'),ii=ks.findIndex(k=>k[1]==='inf');
   tk('corr',`Home prices and stocks: ${z[ci][si].toFixed(2)} (close to unrelated). Home prices and inflation: ${z[ci][ii].toFixed(2)}, a partial inflation hedge.`,'What stands out:')}
  const my=MORT.map((_,i)=>MORT0+i);
  plot('p-mort',[{x:my,y:MORT,name:'30-yr fixed (annual avg)',line:{color:t.neg,width:2.3},hovertemplate:'%{y:.2f}%'},{x:my,y:INF.slice(MORT0-Y0),name:'CPI inflation',line:{color:t.cash,width:1.8},hovertemplate:'%{y:.1f}%'},
    {x:my,y:my.map((_,i)=>MORT[i]-INF[MORT0-Y0+i]),name:'Real mortgage rate',line:{color:t.accent,width:1.5,dash:'dot'},hovertemplate:'%{y:.1f}%'}],
    {yaxis:Yt('',{ticksuffix:'%'}),shapes:[{type:'line',xref:'paper',x0:0,x1:1,y0:V.rate30,y1:V.rate30,line:{color:t.neg,dash:'dash',width:1}}],
     annotations:[{xref:'paper',x:1,y:V.rate30,xanchor:'right',yanchor:'bottom',text:`today ${V.rate30.toFixed(2)}%`,showarrow:false,font:{size:11,color:t.neg}}]});
  {const below=MORT.filter(v=>v<V.rate30).length/MORT.length,rr=V.rate30-V.cpiYoY;
   tk('mort',`Today's ${V.rate30.toFixed(2)}% is higher than the average rate in ${pct(below,0)} of the years since 1972. After ${V.cpiYoY}% inflation, the real rate is about ${rr.toFixed(1)}%.`,'What stands out:')}
  if(RES.zori&&RES.zori.years){const zy=RES.zori.years;const cpiR=zy.map(y=>RENTG[y-Y0]);
    document.getElementById('zori-cap').innerHTML=`Annual growth of CPI rent (all existing leases) vs. Zillow Observed Rent Index (asking rents on new leases). ${srcObj(RES.zori)} ${sl('fredRent')}`;
    {const zy=RES.zori.years,gaps=zy.map((y,i)=>RES.zori.yoy[i]-RENTG[y-Y0]),mx=Math.max(...gaps.map(Math.abs)),yi=gaps.map(Math.abs).indexOf(mx);tk('zori',`The largest gap was in ${zy[yi]}: asking rents ${RES.zori.yoy[yi]>=0?'+':''}${RES.zori.yoy[yi].toFixed(1)}% vs. CPI rent ${RENTG[zy[yi]-Y0].toFixed(1)}%. A renter who moves faces the asking-rent change, not the index.`,'What stands out:')}
    plot('p-zori',[{x:zy,y:RES.zori.yoy,name:'Zillow asking rents',type:'bar',marker:{color:hexA(t.inv,.7)},hovertemplate:'%{y:.1f}%'},{x:zy,y:cpiR,name:'CPI rent',mode:'lines+markers',line:{color:t.neg,width:2},hovertemplate:'%{y:.1f}%'}],{yaxis:Yt('Annual change',{ticksuffix:'%'})})}
  else{document.getElementById('zori-cap').textContent='Zillow rent history was not available.';}
  if(!dataDone){
    const head='<tr><th>Year</th><th>S&amp;P 500</th><th>T-bill</th><th>10y T-bond</th><th>Home price</th><th>Rent (CPI)</th><th>CPI</th><th>30y mortgage</th></tr>';
    const rows=YEARS.map((y,i)=>`<tr><td>${y}</td><td>${STK[i].toFixed(2)}</td><td>${BILL[i].toFixed(2)}</td><td>${BOND[i].toFixed(2)}</td><td>${HOME[i].toFixed(2)}</td><td>${RENTG[i].toFixed(2)}</td><td>${INF[i].toFixed(2)}</td><td>${y>=MORT0?MORT[y-MORT0].toFixed(2):'—'}</td></tr>`).reverse().join('');
    document.getElementById('dtable').innerHTML='<thead>'+head+'</thead><tbody>'+rows+'</tbody>';dataDone=true}
}

/* ===================== Method ===================== */
function buildMethod(){
  document.getElementById('methodCard').innerHTML=`
  <h2>How the model works</h2>
  <p>The model runs month by month. Each year \\(y\\) has its own growth rates; with annual data, monthly factors are \\((1+g_y)^{1/12}\\), and with monthly data the actual monthly changes are used. Both households spend the same amount each month: the larger of the owner's cost \\(C^{own}_t\\) and the renter's cost \\(C^{rent}_t\\). The cheaper side invests the difference.</p>
  <h3>Mortgage and refinancing</h3>
  <p>Loan \\(L = P(1-d)\\), monthly rate \\(i=r/12\\), \\(n=12T\\) payments:
  \\[ M = \\frac{L\\,i}{1-(1+i)^{-n}}, \\qquad I_t = B_{t-1}\\,i, \\qquad B_t = B_{t-1} - (M - I_t). \\]
  When the market rate \\(m_t\\) satisfies \\(r - m_t \\ge \\delta\\) and at least 12 months have passed since the last refinance, the loan is refinanced at \\(m_t\\) over the remaining term, paying \\(c_{refi} B_t\\) in cash. In the projection, \\(m_t\\) moves linearly from today's rate to your expected rate; in the backtest it is the actual Freddie Mac rate; in the Monte Carlo it follows sampled historical year-to-year changes.</p>
  <h3>Owner's monthly cost</h3>
  <p>\\[ C^{own}_t = M + \\frac{\\tau_p A_y + m H_y + \\text{Ins}_y}{12} + \\text{HOA}_y + \\text{PMI}_t + \\text{Refi}_t - \\mathbb{1}_{\\text{Dec}}\\,S_y \\]
  \\(H_y\\) is the home value at the start of year \\(y\\) and \\(A_y\\) the assessed value (equal to \\(H_y\\) unless an assessment cap applies, then \\(A_{y}=\\min(H_y, A_{y-1}(1+\\min(g_{y-1},\\kappa_A)))\\)). PMI of \\(p_{mi}L/12\\) applies while \\(B_t > 0.78P\\) with under 20% down. Rent resets each January: \\(R_y = R_0\\prod_{k<y}(1+g^{rent}_k)\\).</p>
  <h3>Tax savings</h3>
  <p>\\[ S_y = \\mu\\Big[\\max\\big(D^{std}_y,\\ \\min(\\text{SALT}_y,\\ T^{state}+\\tau_pA_y) + I^{ded}_y + O\\big) - \\max\\big(D^{std}_y,\\ \\min(\\text{SALT}_y,T^{state}) + O\\big)\\Big] \\]
  Deductible interest is capped to the share of the original loan under $750,000. The 2026 standard deduction ($16,100 single, $32,200 joint) is indexed to inflation. The SALT cap is $40,400 in 2026, rises 1% a year through 2029, and returns to $10,000 in 2030. Above $505,000 of income (also indexed 1% a year) the cap shrinks by 30% of the excess, to a $10,000 floor; income grows with inflation. In automatic mode the marginal rate \\(\\mu\\) is the 2026 bracket for income minus the standard deduction.</p>
  <h3>Affordability</h3>
  <p>Front-end ratio = month-1 owning cost / monthly gross income; back-end adds other debt payments. The common guideline is at most 28% and 36%, with most lenders capping total debt near 43% (${linkTo(AFF_URL,'Bankrate')}).</p>
  <h3>Portfolios, taxes and leverage</h3>
  <p>Monthly gross return \\(g_t = w_s r^{stk}_t + w_b r^{bond}_t + w_c r^{bill}_t\\). With leverage \\(\\lambda\\) and borrowing spread \\(s_b\\):
  \\[ \\rho_t = \\lambda g_t - (\\lambda-1)(r^{bill}_t + s_b/12) - f/12. \\]
  In a taxable account, dividends (yield \\(q\\), taxed at the capital-gains rate \\(\\kappa\\)) and bond and bill income (taxed at \\(\\mu\\)) are taxed as earned and added to cost basis; price gains are taxed at sale: \\(W^{liq} = V - \\kappa\\max(0, V - \\text{basis})\\). A sheltered account pays no tax. The cash path earns bill yields after ordinary tax. The renter starts with the down payment plus closing costs.</p>
  <h3>Buyer's net worth</h3>
  <p>\\[ W^{buy}_t = H_t(1-s) - B_t - \\kappa\\max\\big(0,\\ H_t(1-s) - P(1+c) - E\\big) + W^{liq}_{buy,t} \\]
  with the Section 121 exclusion \\(E\\) ($250,000 single, $500,000 joint) after two years. Real values divide by cumulative CPI.</p>
  <h3>Other costs</h3>
  <p>The owner also pays extra utilities \\(u\\) and any flood or earthquake premium, both growing with inflation. Each year a share \\(\\phi\\) of upkeep is treated as capital improvements and added to the home's tax basis. The renter pays expected moving costs \\(\\eta\\,(c_{move} + b\\,R_y)/12\\) per month, where \\(\\eta\\) is the yearly moving rate and \\(b\\) the broker fee in months of rent. The buyer's one-time move-in costs are invested by the renter instead. Only a share \\(\\sigma\\) of each month's cost difference is invested; the rest is spent. In the Monte Carlo, yearly upkeep is drawn from a gamma distribution with mean \\(m H_y\\) and coefficient of variation ${MAINT_CV}.</p>
  <h3>NIIT and state tax</h3>
  <p>When income exceeds $200,000 (single) or $250,000 (joint), the 3.8% net investment income tax is added to rates on dividends, interest, portfolio gains and home gains above the exclusion ${linkTo('https://www.irs.gov/taxtopics/tc559','IRS Topic 559')}. Your state rate is added to the same items. If your state allows it, the buyer also saves \\(t_s(I^{ded}_y + \\tau_pA_y)\\) in state tax.</p>
  <h3>Loan types and points</h3>
  <p><em>FHA:</em> the 1.75% upfront premium is added to the loan; the annual premium (0.50–0.75% by loan size and LTV, 0.15–0.65% for 15-year loans) is charged monthly on the balance for 11 years if the down payment is at least 10%, otherwise for the whole term; minimum down payment 3.5% ${RES.fha&&RES.fha.u?linkTo(RES.fha.u,'HUD'):''}. <em>ARM:</em> the starting rate holds for 5 or 7 years, then resets every 6 months to index + margin, rounded to 1/8 point, within caps (2/1/5 for 5-year, 5/1/5 for 7-year) and never below the margin. The index is 30-day SOFR in practice; the model uses the T-bill rate in each scenario. <em>Points:</em> each point costs 1% of the loan up front, lowers the rate by your chosen amount, and is deducted in the purchase year if you itemize; the renter invests the same cash. Refinancing an ARM switches it to a fixed rate. A planned move to a new home uses a conventional fixed loan.</p>
  <h3>Transfer taxes</h3>
  <p>Each location carries its state, county and city deed, transfer and mortgage-recording taxes with their structure: a flat rate, a rate set by the bracket the whole price falls in ("mansion" taxes, San Francisco), or marginal brackets (Washington State). Buyer-paid taxes are added to closing costs and seller-paid taxes to selling costs, as a share of price computed at your price and loan amount. Split taxes are divided evenly. First-time-buyer reliefs are not applied.</p>
  <h3>Local data</h3>
  <p>Location presets use the Census ACS ${D0&&''}effective property tax (median tax ÷ median value for the metro area), and comparable rent = Zillow's typical rent × the ACS ratio of median rent for the chosen bedroom count to median rent for all units. Backtests and simulations use each metro's BLS rent index (annual average of published months) where it exists, and the regional large-metro index otherwise. Homeowners insurance grows at inflation plus an extra rate, defaulting to the 1998–2025 gap between the BLS homeowners-insurance price index and CPI.</p>
  <h3>Lease rent vs. market rent</h3>
  <p>Market rent \\(R^{mkt}_y\\) grows at the rent-growth rate. A sitting tenant renews at that growth minus a gap \\(\\delta\\), and with yearly moving rate \\(\\eta\\) the lease resets to market:
  \\[ R_{y+1} = (1-\\eta)\\,R_y\\,(1+g^{rent}_y-\\delta) + \\eta\\,R^{mkt}_{y+1}. \\]
  With \\(\\delta = 0\\) the lease always equals market rent. Comparable rent and house-hack rent are set from market rent.</p>
  <h3>Income growth</h3>
  <p>Income grows at \\(g_I\\): \\(I_y = I_0(1+g_I)^y\\). In automatic mode the marginal rate is the bracket for \\(I_y/\\text{CPI}_y\\) (brackets are inflation-indexed); the SALT phase-out and the NIIT threshold (not indexed) use \\(I_y\\). The yearly table shows housing cost as a share of income.</p>
  <h3>Planned move</h3>
  <p>At the start of the move year the buyer sells (commission, capital-gains tax with the exclusion if held 2+ years). <em>Sell and buy again:</em> the next home costs what the old one sold for, closing costs are paid again, all remaining equity becomes the down payment, and the new 30-year loan is at the market rate then (PMI if under 20% down; the 2-year exclusion clock restarts). <em>Sell and rent:</em> proceeds go into the buyer's portfolio and the household pays market rent from then on. Both households move, so moving costs common to both are left out; the renter's lease resets to market.</p>
  <h3>House-hacking</h3>
  <p>Rent from part of the home, \\(R^{hh}_y(1-v)\\), lowers the owner's monthly cost. The rented share \\(s\\) of interest, property tax, insurance, upkeep and utilities is a rental expense; net rental income is taxed at \\(\\mu\\) plus the state rate, and only \\((1-s)\\) of interest and property tax count toward itemizing. Depreciation is not claimed, so no recapture applies at sale ${RES.hhTax&&RES.hhTax.u?linkTo(RES.hhTax.u,'IRS Pub 523'):''}.</p>
  <h3>Rent + rental property</h3>
  <p>A fourth household rents its own home like the renter and uses the same starting cash as the down payment \\(d_R\\) plus closing costs on a rental priced \\(P_R = C_0/(d_R+c)\\). The rental's gross rent is \\(P_R\\) times your gross rent yield \\(12R_0/P\\), growing with market rent, less vacancy and a management fee. Its loan is 30 years at your rate plus an investment-property premium. Each year taxable rental income = collected rent − interest − property tax − insurance − HOA − expensed upkeep − depreciation, with depreciation \\(P_R(1+c)(1-\\ell)/27.5\\) (\\(\\ell\\) = land share). Losses offset up to $25,000 of other income, phasing out between $100,000 and $150,000 of income; the rest is suspended and released at sale. At sale, gain up to accumulated depreciation is taxed at \\(\\min(25\\%,\\mu)\\) plus NIIT and state, the rest at the capital-gains rate ${RES.dep&&RES.dep.u?linkTo(RES.dep.u,'IRS Pub 527'):''}. The household invests the equal-budget surplus plus the rental's cash flow, borrowing at T-bill + 3 points if the portfolio runs negative.</p>
  <h3>Moving risk</h3>
  <p>With yearly moving probability \\(h\\), the holding period \\(T\\) is geometric and capped at the horizon \\(N\\): \\(\\Pr(T=t)=h(1-h)^{t-1}\\) for \\(t<N\\) and \\(\\Pr(T=N)=(1-h)^{N-1}\\). The expected gap is \\(\\sum_t \\Pr(T=t)\\,(W^{buy}_t - W^{inv}_t)\\). In the Monte Carlo, the yearly chance of moving is multiplied by \\(k\\) in bad years (home prices fell or stocks fell more than 15%), and a move in a bad year sells at a discount \\(\\phi_f\\) to market value, following evidence that forced sales fetch lower prices ${RES.forced&&RES.forced.u?linkTo(RES.forced.u,'Campbell, Giglio &amp; Pathak (2011)'):''}.</p>
  <h3>Monte Carlo</h3>
  <p>Blocks of \\(b\\) consecutive historical years are drawn with replacement (circularly), keeping all series from the same year together. With re-centering, each series \\(x\\) becomes \\(\\exp(\\ln(1+x_j) - \\overline{\\ln(1+x)} + \\ln(1+\\bar g)) - 1\\), so its geometric mean equals your assumption \\(\\bar g\\). Your own home adds independent noise: \\(1+g^{own}_y = (1+g_y)\\exp(\\sigma\\varepsilon - \\sigma^2/2)\\). Mortgage rates follow \\(m_{t+1} = m_t + \\kappa(\\bar m - m_t) + \\gamma\\,\\Delta\\pi_t + e_t\\), fitted on 1973–2025 annual averages (\\(\\kappa\\) = ${RATE_AR.kappa.toFixed(3)}, \\(\\gamma\\) = ${RATE_AR.gamma.toFixed(3)}, residual s.d. ${RATE_AR.sigma.toFixed(2)} pts). \\(\\bar m\\) is your expected later rate; the residual \\(e_t\\) comes from the same sampled year (random for years before 1973). Rates are kept between 2% and 20%.</p>
  <h3>Risk adjustment</h3>
  <p>Certainty equivalent for CRRA utility with risk aversion \\(\\gamma\\): \\(CE = \\big(\\mathbb{E}[W^{1-\\gamma}]\\big)^{1/(1-\\gamma)}\\), or \\(\\exp(\\mathbb{E}\\ln W)\\) at \\(\\gamma=1\\), with wealth floored at 1% of the starting cash. Renter leverage lets you compare at similar risk: a 20%-down buyer holds a home worth 5× their equity.</p>
  <h3>Limits</h3>
  <ul>
    <li>Rent indexes track existing leases and move more slowly than asking rents (see the Data tab). Pre-1940s rent data are sparse; three missing December values (1934, 1935, 1946) are interpolated.</li>
    <li>The 1928–1986 national real-estate series is Shiller's reconstruction; 1987 onward is Case-Shiller National, as compiled and published by Damodaran. Metro indexes and the monthly national index are FHFA's purchase-only indexes from 1991, downloaded from FHFA. FHFA covers only homes financed with conforming mortgages, so its swings are smaller than Case-Shiller's in expensive metros; with the volatility setting on, each location's yearly changes are scaled around their mean by \\(k = \\sigma_{CS}/\\sigma_{FHFA}\\), estimated over 1992–2025 (median 1.09; San Francisco and Atlanta 1.37). Only these ratios are stored, not Case-Shiller data.</li>
    <li>No moving between homes, no rent control, and no value placed on stability, control over the home, or the flexibility of renting. Bond total returns are treated as taxable income in the year earned. Margin interest is not deducted.</li>
    <li>${MONTHLY?`Monthly bond returns are approximated from 10-year yields: \\(r_t \\approx y_{t-1}/12 - D\\,(y_t - y_{t-1})\\) with duration \\(D=7.5\\).`:''}</li>
  </ul>
  <p class="cap">Inputs marked "assumption" are conventional planning values with no single authoritative source.</p>`;
  document.getElementById('srclist').innerHTML=Object.values(SRC).map(s=>`<li><a target="_blank" rel="noopener" href="${s.u}">${s.t}</a></li>`).join('')+
    METROS.filter(m=>m.slug!=='us').map(m=>`<li>${m.name}: ${['price','rent','ptax','ins','hpi'].map(k=>m.src&&m.src[k]?`<a target="_blank" rel="noopener" href="${m.src[k].u}">${({price:'price',rent:'rent',ptax:'property tax',ins:'insurance',hpi:'home-price index'})[k]}</a>`:null).filter(Boolean).join(' · ')}</li>`).join('');
}
function typeset(el,tries=0){if(window.MathJax&&MathJax.typesetPromise){MathJax.typesetPromise([el]).catch(()=>{})}else if(tries<40)setTimeout(()=>typeset(el,tries+1),250)}

/* ===================== Snapshot ===================== */
function buildSnap(){
  document.getElementById('snap').innerHTML=SNAP.items.map(c=>`<div class="chip"><span class="k">${c.k}</span><span class="v">${c.v}</span><span class="s muted">${c.s} · ${sl(c.src)}${c.field?` · <a href="#" class="use" data-f="${c.field}" data-v="${c.val}">use</a>`:''}</span></div>`).join('')+
    `<div class="chip"><span class="k">Data as of</span><span class="v">${SNAP.asOf}</span><span class="s muted">refreshed weekly</span></div>`;
  document.querySelectorAll('.use').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.getElementById(a.dataset.f).value=a.dataset.v;update()}));
}
function bedRatio(m,b){if(b==='any')return 1;const k=b==='4'?'4':b;const r=(m&&m.acs&&m.acs.beds&&m.acs.beds[k])||(D0.bedRatio&&D0.bedRatio[k]);return r||1}
function selMetro(){return METROS.find(x=>x.slug===document.getElementById('metro').value)||METROS[0]}
function setRentFromBeds(m){m=m||selMetro();const b=document.getElementById('beds').value,base=m.rent;if(!base)return;
  document.getElementById('rent0').value=Math.round(base*bedRatio(m,b)/10)*10}
function applyTT(){const auto=document.getElementById('ttAuto').value==='auto',eb=document.getElementById('ttBuy'),es=document.getElementById('ttSell');
  eb.disabled=es.disabled=auto;if(!auto)return;const m=selMetro();
  if(!m||!m.tt){eb.value=0;es.value=0;return}
  const P=parseFloat(document.getElementById('P').value)||0,dp=(parseFloat(document.getElementById('dp').value)||0)/100,L=P*(1-dp);
  const t=transferTaxes(m.tt,P,L);eb.value=P?(t.buyer/P*100).toFixed(3):0;es.value=P?(t.seller/P*100).toFixed(3):0}
function buildMetroSelect(){const sel=document.getElementById('metro');sel.innerHTML=METROS.map(m=>`<option value="${m.slug}">${m.name}</option>`).join('')}
function applyMetro(slug){const m=METROS.find(x=>x.slug===slug);if(!m)return;
  const set=(id,v)=>{if(v!=null&&isFinite(v))document.getElementById(id).value=v};
  set('P',m.P);set('ptax',m.acs&&m.acs.rate!=null?m.acs.rate:m.ptax);set('ins',m.ins);set('ptaxCap',m.ptaxCap||0);setRentFromBeds(m);
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
  hint('rent0',`${m.name}: ${m.src.rent?m.src.rent.t:''}${d(m.src.rent)} ${srcObj(m.src.rent)} × Census ratio for the chosen bedrooms`);
  const tts=document.getElementById('ttBuy').closest('.f').querySelector('.hint');if(tts)tts.innerHTML=m.ttSrc&&m.ttSrc.length?`${m.name}: `+m.ttSrc.map(x=>`${x.t} ${linkTo(x.u)}`).join(' · '):'no transfer taxes found for this location';
}

/* ===================== Guided start ===================== */
let WZ=0;
function openWizard(){const w=document.getElementById('wizard');WZ=0;
  const sel=document.getElementById('wz-metro');sel.innerHTML=document.getElementById('metro').innerHTML;sel.value=document.getElementById('metro').value;
  const g=id=>document.getElementById(id).value;
  document.getElementById('wz-P').value=g('P');document.getElementById('wz-rent').value=g('rent0');document.getElementById('wz-dp').value=g('dp');document.getElementById('wz-inc').value=g('income');
  document.getElementById('wz-N').value=g('N');document.getElementById('wz-Nl').textContent=g('N')+' years';
  w.hidden=false;wzShow();setTimeout(()=>sel.focus(),50)}
function wzShow(){document.querySelectorAll('.wz-step').forEach((el,i)=>el.hidden=i!==WZ);document.getElementById('wz-back').hidden=WZ===0;
  document.getElementById('wz-next').textContent=WZ===2?'Show my result':'Next';document.getElementById('wz-dots').innerHTML=[0,1,2].map(i=>`<span class="${i===WZ?'on':''}"></span>`).join('')}
function closeWizard(apply){const w=document.getElementById('wizard');w.hidden=true;try{localStorage.setItem('rbi-wz','1')}catch(e){}
  if(!apply)return;const v=id=>document.getElementById(id).value;
  const set=(id,x)=>{if(x!==''&&isFinite(parseFloat(x)))document.getElementById(id).value=x};
  set('P',v('wz-P'));set('rent0',v('wz-rent'));set('dp',v('wz-dp'));set('income',v('wz-inc'));document.getElementById('N').value=v('wz-N');update()}
function wireWizard(){
  document.getElementById('wz-metro').addEventListener('change',e=>{const m=METROS.find(x=>x.slug===e.target.value);document.getElementById('metro').value=e.target.value;applyMetro(e.target.value);
    if(m){document.getElementById('wz-P').value=m.P;document.getElementById('wz-rent').value=m.rent}});
  document.getElementById('wz-N').addEventListener('input',e=>document.getElementById('wz-Nl').textContent=e.target.value+' year'+(e.target.value==='1'?'':'s'));
  document.getElementById('wz-next').addEventListener('click',()=>{if(WZ<2){WZ++;wzShow()}else closeWizard(true)});
  document.getElementById('wz-back').addEventListener('click',()=>{if(WZ>0){WZ--;wzShow()}});
  document.getElementById('wz-skip').addEventListener('click',()=>closeWizard(false));
  document.getElementById('openWizard').addEventListener('click',openWizard);
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('wizard').hidden)closeWizard(false)});
}

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
