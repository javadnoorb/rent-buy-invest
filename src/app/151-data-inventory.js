/* ===================== Every dataset in the app (Data tab) ===================== */
/* One row per dataset: what it is, what the app uses it for, its period or date, and its sources (SRC keys with a short
   label). Periods and counts are read from the loaded data, so the table stays current after a refresh. A UI test checks
   that every source the app cites appears here (numbered sub-sources count through their parent key). */
/** @returns {any[]} */
function dataInventory(){const sv=SNAP.values,mf=MONTHLY&&MONTHLY.dates,cty=COUNTIES&&COUNTIES.rows?COUNTIES.rows.length:null,nSt=k=>Object.keys((STATE_RULES&&STATE_RULES[k])||{}).length;
  const m0=mf?mf[0]:'',m1=mf?mf.at(-1):'',hy=`${YEARS[0]}–${LAST_Y}`,fc=FCST&&FCST.preset,ns=nSt('income');
  // one date style throughout ("Oct 23 2026", as the rate survey date is written)
  // the period each market figure covers, as its header card states it ("Sep 2026"); else the date it was fetched
  const per=k=>{const it=(SNAP.items||[]).find(i=>i.src===k);return it&&it.s?it.s.split(',')[0]:dt(SNAP.asOf)};
  const dt=d=>/^\d{4}-\d\d-\d\d/.test(d||'')?new Date(d.slice(0,10)+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).replace(',',''):d;
  return [
   ['Market today',[
    ['Mortgage rates, 30- and 15-year fixed',`default mortgage rates (${sv.rate30}% and ${sv.rate15}%)`,SNAP.rateDate,[['pmms','Freddie Mac']]],
    ['Treasury yields, 10-year and 3-month','bond and T-bill returns today, ARM index',per('tsy'),[['tsy','U.S. Treasury']]],
    ['Typical home value and rent','default price and rent; the U.S. location',per('zillow'),[['zillow','Zillow']]],
    ['Consumer prices (CPI)','inflation today',per('cpi'),[['cpi','BLS']]],
    ['Home prices, last 12 months','header card',per('fhfaUS'),[['fhfaUS','FHFA']]],
    ['Property tax rate and home insurance, U.S.','defaults for the U.S. location','ACS 2020–2024; insurance 2024, grown with prices',[['ptaxUS','Census ACS'],['ins','Census ACS microdata'],['ppi_ins','BLS producer prices']]]]],
   ['History, yearly',[
    ['Rent-to-price ratio of owner-occupied homes, U.S.','the Backtest\'s "Historical" starting rent',RES.rentPrice?`${Math.min(...Object.keys(RES.rentPrice).map(Number))}–${Math.max(...Object.keys(RES.rentPrice).map(Number))}`:'',[['rp_bea','BEA imputed rent'],['rp_z1','Federal Reserve Z.1 home values']]],
    ['Stocks (S&P 500), 10-year Treasury bonds, T-bills','Backtest, Monte Carlo, historical presets',hy,[['damo','Damodaran (NYU)']]],
    ['Home prices, U.S.','Backtest, Monte Carlo; Shiller to 1986, Case-Shiller to 1991, FHFA from 1992 scaled to Case-Shiller\'s swings',hy,[['shiller','Shiller'],['fhfa','FHFA'],['caseShiller','S&P Case-Shiller']]],
    ['Consumer prices and rents (CPI)','inflation and rent growth in the Backtest and Monte Carlo',hy,[['fredCPI','BLS CPI'],['fredRent','BLS rent CPI']]],
    ['Mortgage rates, yearly averages','Backtest purchase rates and refinancing; the Monte Carlo rate model','1972–'+LAST_Y,[['fredMort','Freddie Mac rate history'],['r_mortgage_annual','yearly averages']]]]],
   ['History, monthly',[
    ['S&P 500 total returns, T-bills, 10-year Treasury, home prices, CPI, rents, mortgage rates','monthly Backtest and Monte Carlo',`${m0} to ${m1}`,[['mSp','Shiller (S&P 500)'],['mTb','Federal Reserve H.15'],['fhfa','FHFA'],['fredCPI','BLS'],['fredMort','Freddie Mac']]]]],
   ['Places',[
    [`${METROS.length-1} metro areas`,'price, rent, property tax, insurance, transfer taxes, price and rent history for each metro','current; history from 1991',[['zillow','Zillow'],['acs','Census ACS'],['fhfa','FHFA metro indexes'],['fredRent','BLS metro rent CPI'],['cbsa','Census metro definitions']]],
    [`${cty?cty.toLocaleString('en-US'):'About 3,200'} counties and ZIP codes`,'price, property tax and rent for any county or ZIP',COUNTIES&&COUNTIES.span?`ACS ${COUNTIES.span}`:'ACS 5-year',[['acs5','Census ACS 5-year'],['zcta','Census ZIP–county file']]],
    ['Fair Market Rents by bedrooms','county and ZIP rents',COUNTIES&&COUNTIES.fmr?`fiscal year ${COUNTIES.fmr.fy}`:'',[['hudFmr','HUD'],['hudFmrFile','HUD file']]],
    ['County home-price indexes','price history for counties and ZIPs','yearly',[['fhfaCounty','FHFA'],['bogin','Bogin, Doerner & Larson']]],
    ['Flood insurance cost','default flood insurance by place','past year',[['fema','FEMA OpenFEMA']]]]],
   ['Taxes and rules',[
    ['Federal income tax','2026 brackets, standard deduction, capital-gains rates, SALT cap, $750,000 interest limit, net investment income tax, home-sale exclusion','2026',[['irs26','IRS'],['salt','SALT cap'],['irs936','IRS Pub. 936'],['irsNiit','IRS NIIT'],['irs121','IRS home sale']]],
    ['Rental and house-hacking taxes','depreciation, passive losses, recapture at sale','2025 rules',[['rz_depreciation_tax','IRS Pub. 527 / 925'],['rz_house_hacking_tax','IRS Pub. 523']]],
    [`State income taxes (${ns>=51?'50 states and DC':ns+' states'})`,'state tax, rate on investment income, whether mortgage interest is deductible; local income taxes','2026',[],'each state links its source next to the State income tax setting'],
    ['Property tax rules','assessment caps, homestead exemptions and credits, new-buyer tax rates','2026',[],'linked next to those settings for each place'],
    ['Transfer and recording taxes','state, county and city taxes when a home changes hands','2026',[],'linked next to the Transfer taxes setting for each place']]],
   ['Loans',[
    ['FHA loans','upfront and yearly mortgage insurance, loan limits','2026',[['lr_fha','HUD']]],
    ['Adjustable-rate mortgages','ARM rate today, caps, index','current',[['lr_arm','Fannie Mae / MBA'],['lr_sofr','New York Fed (SOFR)']]],
    ['Discount points','rate cut per point','current',[['lr_points','CFPB']]],
    ['Credit score pricing','rate adjustment by score and down payment','current',[['llpa','Fannie Mae LLPA matrix']]],
    ['Private mortgage insurance','cost, coverage by down payment, cost by credit score, when it ends','current',[['pmiFM','Freddie Mac'],['fnmaMiCov','Fannie Mae coverage'],['pmiFico','Urban Institute'],['pmiEnd','CFPB'],['fnmaMiEnd','Fannie Mae servicing']]]]],
   ['Forecasts',[
    ['Professional forecasts, 10-year averages',fc?`the forecast preset: stocks ${fc.rs}%, bonds ${fc.rb}%, T-bills ${fc.rc}%, inflation ${fc.inf}%`:'the forecast preset','2026',[['fc_spf','Philadelphia Fed SPF']]]]],
   ['Research behind default assumptions',[
    ['Moving and holding periods','chance of moving each year','',[['r_tenure','Census CPS']]],
    ['Single-home price risk','own-home price swings in the Monte Carlo','',[['r_idio_vol','Flavin & Yamashita; Case & Shiller; Giacoletti']]],
    ['Forced sales','discount on a sale in a bad year','',[['rz_forced_sales','Campbell, Giglio & Pathak']]],
    ['Costs of owning and selling','selling costs, maintenance','',[['r_sell_costs','Redfin / Opendoor'],['r_maintenance','Census AHS']]],
    ['Investing','dividend yield, margin rate, mortgage-to-Treasury spread','',[['r_div_yield','S&P 500 dividend yield'],['r_margin_rate','Interactive Brokers'],['r_mortgage_spread','First American']]],
    ['Rents','lease renewals vs. market, asking-rent index, rent from price','',[['rz_renewal_vs_new_lease','RealPage / Richmond Fed'],['r_zori','Zillow observed rents'],['rz_rent_vs_market_turnover','CPS / RealPage'],['acs5','Census ACS (rent vs. price fit)']]],
    ['Income and rentals','wage growth, rental vacancy, management fee, investment-property rates','',[['rz_wage_growth','Atlanta Fed'],['rz_rental_vacancy','Census HVS'],['rz_mgmt_fee','Baselane'],['rz_investment_rate_premium','Fannie Mae and lenders']]],
    ['Affordability guideline','28/36 rule and lender limits','',[['aff','Bankrate']]]]],
   ['Checks',[
    ['Published buy-vs-rent study','the model replays its setup (tests/validate.js)','1978–2001',[['beracha','Beracha & Johnson'],['dlm','Davis, Lehnert & Martin']]]]]]}
function renderDataInventory(){const el=document.getElementById('invT');if(!el)return;
  const src=s=>s.filter(([k])=>SRC[k]).map(([k,l])=>`<a href="${SRC[k].u}" target="_blank" rel="noopener" title="${escapeHtml(SRC[k].t)}">${l}</a>`).join(' · ');
  el.innerHTML='<thead><tr><th>Data</th><th>Used for</th><th>Period or date</th><th>Sources</th></tr></thead>'+dataInventory().map(([g,rows])=>
    `<tbody><tr class="grp"><th colspan="4">${g}</th></tr>`+rows.map(([n,u,d,s,note])=>`<tr><td>${n}</td><td>${u}</td><td>${d||'—'}</td><td>${src(s)||''}${note?`<span class="sub">${s.length?' · ':''}${note}</span>`:''}</td></tr>`).join('')+'</tbody>').join('')}
