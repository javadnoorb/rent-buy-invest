"use strict";
/* ===================== Historical annual data (calendar years 1928–2025) ===================== */
const Y0=1928;
const STK=[43.81,-8.30,-25.12,-43.84,-8.64,49.98,-1.19,46.74,31.94,-35.34,29.28,-1.10,-10.67,-12.77,19.17,25.06,19.03,35.82,-8.43,5.20,5.70,18.30,30.81,23.68,18.15,-1.21,52.56,32.60,7.44,-10.46,43.72,12.06,0.34,26.64,-8.81,22.61,16.42,12.40,-9.97,23.80,10.81,-8.24,3.56,14.22,18.76,-14.31,-25.90,37.00,23.83,-6.98,6.51,18.52,31.74,-4.70,20.42,22.34,6.15,31.24,18.49,5.81,16.54,31.48,-3.06,30.23,7.49,9.97,1.33,37.20,22.68,33.10,28.34,20.89,-9.03,-11.85,-21.97,28.36,10.74,4.83,15.61,5.48,-36.55,25.94,14.82,2.10,15.89,32.15,13.52,1.38,11.77,21.61,-4.23,31.21,18.02,28.47,-18.04,26.06,24.88,17.78];
const BILL=[3.08,3.16,4.55,2.31,1.07,0.96,0.28,0.17,0.17,0.28,0.07,0.05,0.04,0.13,0.34,0.38,0.38,0.38,0.38,0.60,1.05,1.12,1.20,1.52,1.72,1.89,0.94,1.72,2.62,3.22,1.77,3.39,2.87,2.35,2.77,3.16,3.55,3.95,4.86,4.29,5.34,6.67,6.39,4.33,4.06,7.04,7.85,5.79,4.98,5.26,7.18,10.05,11.39,14.04,11.09,8.95,9.92,7.72,6.15,5.96,6.89,8.39,7.75,5.54,3.51,3.07,4.37,5.66,5.15,5.20,4.91,4.78,6.00,3.48,1.64,1.03,1.40,3.22,4.85,4.48,1.40,0.15,0.14,0.05,0.09,0.06,0.03,0.05,0.32,0.95,1.97,2.11,0.36,0.04,2.09,5.28,5.18,4.21];
const BOND=[0.84,4.20,4.54,-2.56,8.79,1.86,7.96,4.47,5.02,1.38,4.21,4.41,5.40,-2.02,2.29,2.49,2.58,3.80,3.13,0.92,1.95,4.66,0.43,-0.30,2.27,4.14,3.29,-1.34,-2.26,6.80,-2.10,-2.65,11.64,2.06,5.69,1.68,3.73,0.72,2.91,-1.58,3.27,-5.01,16.75,9.79,2.82,3.66,1.99,3.61,15.98,1.29,-0.78,0.67,-2.99,8.20,32.81,3.20,13.73,25.71,24.28,-4.96,8.22,17.69,6.24,15.00,9.36,14.21,-8.04,23.48,1.43,9.94,14.92,-8.25,16.66,5.57,15.12,0.38,4.49,2.87,1.96,10.21,20.10,-11.12,8.46,16.04,2.97,-9.10,10.75,1.28,0.69,2.80,-0.02,9.64,11.33,-4.42,-17.83,3.88,-1.64,7.80];
const HOME=[1.49,-2.06,-4.30,-8.15,-10.47,-3.81,2.91,9.77,3.22,2.56,-0.87,-1.30,3.31,-8.38,3.33,11.45,16.58,11.78,24.10,21.26,2.06,0.09,3.64,6.05,4.41,11.52,0.92,0.00,0.91,2.72,0.66,0.11,0.77,0.98,0.32,2.14,1.26,1.66,1.22,2.32,4.13,6.99,8.22,4.24,2.98,3.42,10.07,6.77,8.18,14.65,15.72,13.74,7.40,5.10,0.56,4.75,4.68,7.47,9.61,7.85,7.22,4.39,-0.69,-0.17,1.8,2.85,1.98,2.66,2.31,3.04,6.2,6.38,7.67,7.13,8.45,8.61,11.38,11,1.66,-5.2,-13.66,-3.37,-5.81,-3.1,5.21,7.17,4.77,5.5,6.33,6.55,5.46,6.13,13.18,20.18,6.42,6.98,5,1.64];
const CPIL=[17.3,17.1,17.2,16.1,14.6,13.1,13.2,13.4,13.8,14.0,14.4,14.0,14.0,14.1,15.5,16.9,17.4,17.8,18.2,21.5,23.4,24.1,23.6,25.0,26.5,26.7,26.9,26.7,26.8,27.6,28.4,28.9,29.4,29.8,30.0,30.4,30.9,31.2,31.8,32.9,33.9,35.5,37.7,39.8,41.1,42.5,46.2,51.9,55.5,58.2,62.1,67.7,76.7,86.3,94.0,97.6,101.3,105.3,109.3,110.5,115.4,120.5,126.1,133.8,137.9,141.9,145.8,149.7,153.5,158.6,161.3,163.9,168.3,174.0,176.7,180.9,184.3,190.3,196.8,201.8,210.036,210.228,215.949,219.179,225.672,229.601,233.049,234.812,236.525,241.432,246.524,251.233,256.974,260.474,278.802,296.797,306.746,315.605,324.054];
const RENTL=[33.3,32.5,31.8,30.7,28.6,24.7,21.8,21.967,22.133,22.3,23.5,23.7,23.7,23.8,24.6,24.6,24.7,24.8,24.9,25.9,26.9,28.1,29.2,30.2,31.6,33.0,34.9,35.4,35.8,36.7,37.3,37.9,38.5,39.0,39.5,39.9,40.3,40.7,41.1,41.8,42.7,43.8,45.5,47.6,49.4,51.1,53.6,56.5,59.4,62.6,66.7,71.6,77.3,84.3,91.5,97.5,102.2,108.2,115.1,120.8,125.6,130.1,135.5,141.1,145.2,148.6,151.9,155.7,159.6,164.0,169.1,174.9,180.3,187.6,196.4,202.5,207.9,213.9,220.5,230.0,239.102,247.278,248.999,250.986,257.189,264.098,271.688,280.874,291.204,302.735,313.904,324.815,336.789,344.455,355.931,385.649,410.606,428.151,440.667];
const MORT0=1972;
let MORT=[7.38,8.04,9.19,9.05,8.87,8.85,9.64,11.20,13.74,16.63,16.04,13.24,13.88,12.43,10.19,10.21,10.34,10.32,10.13,9.25,8.39,7.31,8.38,7.93,7.81,7.60,6.94,7.44,8.05,6.97,6.54,5.83,5.84,5.87,6.41,6.34,6.03,5.04,4.69,4.45,3.66,3.98,4.17,3.85,3.65,3.99,4.54,3.94,3.11,2.96,5.34,6.81,6.72,6.63];
if(typeof MORT_OVERRIDE!=='undefined'&&MORT_OVERRIDE&&MORT_OVERRIDE.length===MORT.length)MORT=MORT_OVERRIDE;
/* National home prices: Shiller's reconstruction through 1986 and Case-Shiller 1987–1991 (both as published by Damodaran);
   from 1992 FHFA's U.S. purchase-only index, December to December, scaled around its mean by volK so the swings keep
   Case-Shiller's size. The values above are the defaults; the build passes HOME_OVERRIDE from data/monthly.json. */
if(typeof HOME_OVERRIDE!=='undefined'&&HOME_OVERRIDE)for(const y in HOME_OVERRIDE){const i=+y-Y0;if(i>=0&&i<HOME.length)HOME[i]=HOME_OVERRIDE[y]}
const NY=STK.length, YEARS=[...Array(NY)].map((_,i)=>Y0+i), LAST_Y=Y0+NY-1;  // last full calendar year of data
const INF=YEARS.map((_,i)=>(CPIL[i+1]/CPIL[i]-1)*100);
const RENTG=YEARS.map((_,i)=>(RENTL[i+1]/RENTL[i]-1)*100);
/* mortgage-rate change by year (pp); 1973+ observed, earlier modeled from inflation changes */
const DM_OBS=YEARS.map(y=>y>MORT0?MORT[y-MORT0]-MORT[y-1-MORT0]:null);
const DM_FIT=(()=>{const xs=[],ys=[];YEARS.forEach((y,i)=>{if(DM_OBS[i]!=null&&i>0){xs.push(INF[i]-INF[i-1]);ys.push(DM_OBS[i])}});
  const n=xs.length,mx=xs.reduce((a,b)=>a+b)/n,my=ys.reduce((a,b)=>a+b)/n;let sxy=0,sxx=0;for(let k=0;k<n;k++){sxy+=(xs[k]-mx)*(ys[k]-my);sxx+=(xs[k]-mx)**2}
  const b=sxy/sxx,a=my-b*mx;let ss=0;for(let k=0;k<n;k++)ss+=(ys[k]-a-b*xs[k])**2;return {a,b,s:Math.sqrt(ss/(n-2)),n}})();
/* Mortgage-rate dynamics fitted on 1973–2025 annual averages:
   Δm_t = α + β·m_{t−1} + γ·Δπ_t + e_t  →  pull-back speed κ = −β; residuals e_t are resampled with their year. */
const RATE_AR=(()=>{const X=[],Y=[],idx=[];YEARS.forEach((y,i)=>{if(DM_OBS[i]!=null&&i>0){X.push([1,MORT[y-1-MORT0],INF[i]-INF[i-1]]);Y.push(DM_OBS[i]);idx.push(i)}});
  const k=3,XtX=[...Array(k)].map(()=>Array(k).fill(0)),XtY=Array(k).fill(0);
  X.forEach((r,n)=>{for(let a=0;a<k;a++){XtY[a]+=r[a]*Y[n];for(let b=0;b<k;b++)XtX[a][b]+=r[a]*r[b]}});
  const A=XtX.map((r,a)=>r.concat([XtY[a]]));for(let c=0;c<k;c++){let p=c;for(let r=c+1;r<k;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];
    for(let r=0;r<k;r++)if(r!==c){const f=A[r][c]/A[c][c];for(let q=c;q<=k;q++)A[r][q]-=f*A[c][q]}}
  const bta=A.map((r,a)=>r[k]/r[a]);const res=Array(YEARS.length).fill(null);let ss=0;
  X.forEach((r,n)=>{const e=Y[n]-(bta[0]+bta[1]*r[1]+bta[2]*r[2]);res[idx[n]]=e;ss+=e*e});
  const R={alpha:bta[0],kappa:-bta[1],gamma:bta[2],sigma:Math.sqrt(ss/(X.length-k)),mean:-bta[0]/bta[1],res,n:X.length};
  R.theta=R.kappa.toFixed(3);R.beta=R.gamma.toFixed(3);R.sd=R.sigma.toFixed(2);return R})();
const SER={gh:HOME,gr:RENTG,rs:STK,rb:BOND,rc:BILL,inf:INF};
function geo(a,from,to){const i0=from-Y0,i1=(to||LAST_Y)-Y0;let lp=0,n=0;for(let i=i0;i<=i1;i++){if(a[i]==null)continue;lp+=Math.log(1+a[i]/100);n++}return (Math.exp(lp/n)-1)*100}
const r2=x=>Math.round(x*100)/100;
/* PMI by down payment: the PMI setting is the rate at 3–5% down; with more down it is scaled by Fannie Mae's standard
   required mortgage-insurance coverage for 30-year fixed loans (Selling Guide B7-1-02: 35% of the loan above 95% LTV,
   30% at 90–95, 25% at 85–90, 12% at 80–85). Premiums fall faster than coverage in practice, so this errs high. */
/* Yearly property tax on a home taxed at value v: the rate applies after a homestead exemption (dollars off the taxed
   value, the owner's primary residence only), less a homestead credit (dollars off the bill). */
function ptaxOn(p,v){return Math.max(0,p.ptax*Math.max(0,v-(p.hsEx||0))-(p.hsCredit||0))}
/* Credit score: Fannie Mae's loan-level price adjustments (upfront points by score and LTV) relative to the borrower in
   Freddie Mac's survey rate (20% down, good to excellent credit), turned into a rate change at the points-to-rate
   setting; PMI scales by premium ratios between score bands. FHA loans have neither. p.credit = {llpa, pmi} or null. */
function creditAdj(p){const C=p.credit;if(!C||!C.llpa||!p.fico||p.loanType==='fha')return {rate:0,pmi:1};const L=C.llpa,col=ltv=>L.ltv_upper.findIndex(u=>ltv<=u+1e-9);
  const row=L.rows[p.fico],ref=L.rows[L.reference.score];if(!row||!ref)return {rate:0,pmi:1};
  const pts=row[col(1-p.dp)]-ref[col(L.reference.ltv)];return {rate:pts*(p.ptsCut||0.0025),pmi:(C.pmi&&C.pmi.rel[p.fico])||1}}
const PMI_COV=[[0.95,35],[0.90,30],[0.85,25],[0.80,12]];
function pmiRate(p,dp){if(dp>=0.2)return 0;const k=creditAdj(p).pmi;if(p.pmiScale===false)return p.pmi*k;const ltv=1-dp,c=PMI_COV.find(([l])=>ltv>l+1e-9);return p.pmi*k*(c?c[1]:12)/35}

/* ===================== Metro home-price series ===================== */
/* Metro yearly % changes. FHFA indexes swing less than Case-Shiller (no jumbo loans), so unless raw is set
   the changes are scaled around their own mean by volK = sd(Case-Shiller)/sd(FHFA), estimated over 1992–2025. */
let VOLADJ=true;
function metroAnnual(m,raw){
  if(!m||!m.hpi||!m.hpi.values)return null;const v=m.hpi.values;
  const a=YEARS.map(y=>(v[y]!=null&&v[y-1]!=null)?(v[y]/v[y-1]-1)*100:null);
  const k=m.hpi.volK;if(raw||!VOLADJ||!k||k===1)return a;
  const xs=a.filter(x=>x!=null),mean=xs.reduce((s,x)=>s+x,0)/xs.length;
  return a.map(x=>x==null?null:mean+k*(x-mean))}
function metroStart(m){const a=metroAnnual(m);if(!a)return null;const i=a.findIndex(v=>v!=null);return i<0?null:Y0+i}

/* ===================== Core simulation =====================
 path: annual arrays (decimal rates) gh,gr,rs,rb,rc,inf, optional mkt (market mortgage rate, decimal)
       or monthly arrays with path.monthly=true (monthly decimal returns; mkt monthly)
*/
/* Tax figures below are for TAX_YEAR. A projection starting later (p.y0) indexes the inflation-adjusted ones (brackets,
   standard deduction) by the assumed inflation; the SALT cap follows its own calendar-year schedule. */
const TAX_YEAR=2026;
function taxIndex(p){return Math.pow(1+(p.inf||0),Math.max(0,(p.y0||TAX_YEAR)-TAX_YEAR))}
/* SALT cap with the high-income phase-out: cap falls by 30% of MAGI above the threshold, floor $10,000; cap and threshold rise 1%/yr through 2029 */
function saltCapFor(y,magi,y0){const cy=(y0||TAX_YEAR)+y;if(cy>=2030)return 10000;const g=Math.pow(1.01,cy-2026);return Math.max(10000,40400*g-0.3*Math.max(0,(magi||0)-505000*g))}
/* 2026 federal brackets (IRS IR-2025-103): marginal rate on taxable income */
const BRACKETS={single:[[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[640600,.35],[Infinity,.37]],
  mfj:[[24800,.10],[100800,.12],[211400,.22],[403550,.24],[512450,.32],[768700,.35],[Infinity,.37]]};
function marginalRate(income,filing,k){income/=k||1;const std=filing==='mfj'?32200:16100,ti=Math.max(0,income-std);for(const [top,r] of BRACKETS[filing==='mfj'?'mfj':'single'])if(ti<=top)return r;return .37}
/* 2026 long-term capital-gains brackets (0 / 15 / 20%) by taxable ordinary income; the gain itself is not stacked on top */
const LTCG_BRK={single:[49450,545500],mfj:[98900,613700]};
function ltcgRate(income,filing,k){income/=k||1;const std=filing==='mfj'?32200:16100,ti=Math.max(0,income-std),b=LTCG_BRK[filing==='mfj'?'mfj':'single'];return ti<=b[0]?0:ti<=b[1]?0.15:0.20}
function pmt(B,i,n){if(B<=0||n<=0)return 0;return i>0?B*i/(1-Math.pow(1+i,-n)):B/n}
/* Transfer taxes from a list of rules: base price or mortgage; flat rate, a rate set by the bracket of the whole amount
   ("mansion" style), or marginal brackets; paid by buyer, seller, or split evenly. Returns dollars. */
function transferTaxes(rules,P,L){let buyer=0,seller=0;
  (rules||[]).forEach(r=>{const x=Math.max(0,(r.base==='mortgage'?L:P)-(r.base_deduction_owner_occupied||0));let t=0;  // e.g. Montgomery County, MD: first $100k exempt for a primary residence
    // a second schedule for lower prices (New Jersey: consideration up to $350,000)
    const tiers=r.alt_tiers&&r.alt_tiers.applies_if_price_lte!=null&&P<=r.alt_tiers.applies_if_price_lte?r.alt_tiers.tiers:r.tiers;
    if(r.structure==='flat')t=(r.rate||0)*x;
    else if(r.structure==='whole_price_tiers'){const tr=(tiers||[]).find(q=>x>=q.from&&(q.to==null||x<q.to));t=tr?tr.rate*x:0}
    else if(r.structure==='marginal_tiers'){(tiers||[]).forEach(q=>{const hi=q.to==null?x:Math.min(x,q.to);if(hi>q.from)t+=(hi-q.from)*q.rate})}
    if(r.cap!=null&&isFinite(r.cap))t=Math.min(t,r.cap);
    const b=r.payer==='buyer'?1:r.payer==='seller'?0:(r.buyer_share!=null?r.buyer_share:0.5);buyer+=t*b;seller+=t*(1-b)});
  return {buyer,seller}}
/* Selling and closing costs as shares of a price. With the location's transfer-tax rules (p.ttRules) the taxes are
   worked out at that price, so brackets and whole-price thresholds (e.g. New York's 1% at $1M) follow the sale or
   purchase price; otherwise the fixed shares from the settings. */
function sellAt(p,price){return p.ttRules&&price>0?p.sellBase+transferTaxes(p.ttRules,price,0).seller/price:p.sell}
function closeAt(p,price){return p.ttRules&&price>0?p.closeBase+transferTaxes(p.ttRules,price,price*(1-p.dp)).buyer/price:p.close}
/* Loan setup shared by the simulation and the summary.
   fixed: conventional with PMI under 20% down. fha: 1.75% upfront MIP financed, annual MIP by loan size/LTV/term
   (HUD ML 2023-05), for 11 years if LTV ≤ 90% else the full term. arm: initial rate for armYears, then resets every
   6 months to index (T-bill/SOFR proxy) + margin within initial/periodic/lifetime caps. Points lower the note rate. */
function loanSetup(p,rateIn){
  const type=p.loanType||'fixed',base=p.P*(1-p.dp),ltv=1-p.dp,pts=Math.max(0,p.pts||0);
  let rate=type==='arm'?rateIn-(p.rate-(p.armRate!=null?p.armRate:p.rate)):rateIn;rate=Math.max(0,rate+creditAdj(p).rate-pts*(p.ptsCut||0));
  let L=base,mip=0,mipMonths=0;
  if(type==='fha'){L=base*1.0175;const big=base>726200;
    if(p.term>15)mip=big?(ltv>0.95?0.0075:0.007):(ltv>0.95?0.0055:0.005);
    else mip=big?(ltv>0.9?0.0065:ltv>0.78?0.004:0.0015):(ltv>0.9?0.004:0.0015);
    mipMonths=ltv<=0.9?132:p.term*12}
  return {type,L,rate,mip,mipMonths,ptsCost:pts/100*base,ltv}}
/* a household whose savings go negative (e.g. selling underwater) carries the shortfall as debt at T-bills + this */
const BORROW_PREM=0.03;
function simulate(p,path,opt){const cAdj=creditAdj(p).rate;
  opt=opt||{};const N=opt.N||p.N,detail=!!opt.detail,M=!!path.monthly;
  // opt.trace: keep every year's and month's amounts (o.tr) so each result can be itemized (src/app/189c-trace.js)
  const TR=/** @type {any} */(opt.trace?{years:[],ends:[],move:null,LS:null}:null);let ty=/** @type {any} */(null);
  const LS=loanSetup(p,opt.rate!=null?opt.rate:p.rate);let rate=LS.rate;
  const nTot=p.term*12,tk=taxIndex(p),excl=p.filing==='mfj'?500000:250000,std0=(p.filing==='mfj'?32200:16100)*tk,niitThr=p.filing==='mfj'?250000:200000;
  const tx=p.taxOn,taxable=tx&&p.acct==='taxable',share=p.investShare,mShock=opt.maintShock;
  const muAuto=p.muMode==='auto'&&tx,incG=p.incGrowth||0,renewGap=p.renewGap||0;
  // ---- buyer's home state (can change at a planned move) ----
  let owned=true,Pcur=p.P,dpCur=p.dp,Lcur=LS.L,armOn=LS.type==='arm',armRate0=LS.rate,armResets=0,mipRate=LS.mip,mipMonths=LS.mipMonths,fha=LS.type==='fha',insIdx=1,basis=p.P*(1+p.close),purchY=0,mSince=0,imp=0;
  let i=rate/12,Mp=pmt(Lcur,i,nTot),shk=opt.saleShock||1;if(TR)TR.LS=Object.assign({},LS,{cAdj,M:Mp,nTot,excl,std0,tk});
  let H=p.P,A=p.P,Fb=p.P,bal=Lcur,pB=0,bB=0,pR=p.P*(p.dp+p.close)+p.moveIn+LS.ptsCost,bR=pR,pC=pR,cpi=1,infIdx=1,refis=0,lastRefi=0,mE=0;
  let lease=p.rent0,mkt=p.rent0,income=p.income;
  // per-year tax rates (income can grow, so brackets and NIIT can change)
  let mu=p.mu,niit=p.niit,ltcgE=0,muE=0;
  // extra principal each month (prepay), or the same amount added to the buyer's portfolio (invest); PMI removable by appraisal
  const xPay=Math.max(0,p.extraPay||0),xPrepay=p.extraMode!=='invest';let pmiOff=false;
  const setRates=()=>{mu=muAuto?marginalRate(income/infIdx,p.filing,tk):p.mu;niit=p.niitAuto?(tx&&income>niitThr?0.038:0):(p.niit||0);ltcgE=(p.ltcgMode==='auto'?ltcgRate(income/infIdx,p.filing,tk):p.ltcg)+niit+p.stRate;muE=mu+niit+p.stRate};
  setRates();
  // ---- optional fourth household: rents its home, owns a rental property ----
  const RO=!!p.rentalOn;let Pr=0,Hr=0,balR=0,iR=0,MpR=0,accDep=0,impR=0,susp=0,pX=0,bX=0,depBasis=0,yieldR=0,basisR=0;
  if(RO){const C0=p.P*(p.dp+p.close)+p.moveIn+LS.ptsCost;Pr=C0/(p.dpR+p.close);Hr=Pr;balR=Pr*(1-p.dpR);iR=(p.rate30+p.ratePrem)/12;MpR=pmt(balR,iR,360);
    depBasis=Pr*(1+p.close)*(1-p.landShare);basisR=Pr*(1+p.close);yieldR=p.rent0*12/p.P}
  const dep=(V,b,x)=>{const V1=V+x;return [V1,V1<=0?0:V<0?V1:b+Math.max(0,x)]};
  const liq=(V,b)=>taxable?V-ltcgE*Math.max(0,V-b):V;
  const homeNet=(H,bal,y)=>{if(!owned)return 0;const held=y-purchY;const S=H*(held>0?shk:1),sale=S*(1-sellAt(p,S));const gain=sale-basis-imp-(held>=2?excl:0);return sale-bal-(tx?ltcgE*Math.max(0,gain):0)};
  // the same sale, itemized for the tax readout: gain before the exclusion, the exclusion used and the tax
  const homeTax=(H,y)=>{if(!owned)return {gain:0,excl:0,tax:0};const held=y-purchY,S=H*(held>0?shk:1),g=S*(1-sellAt(p,S))-basis-imp,ex=held>=2?Math.min(excl,Math.max(0,g)):0;
    return {gain:g,excl:ex,tax:tx?ltcgE*Math.max(0,g-ex):0,held}};
  const rentalNet=()=>{if(!RO)return 0;const sale=Hr*(1-sellAt(p,Hr)),gain=sale-(basisR+impR-accDep);let t=0;
    if(tx){const rec=Math.min(Math.max(gain,0),accDep);t=rec*(Math.min(0.25,mu)+niit+p.stRate)+Math.max(0,gain-rec)*ltcgE-susp*muE}
    return sale-balR-t};
  const o={buy:[],inv:[],cash:[],rental:[],cpi:[],lqB:[],lqR:[],heloc:[],lqC:[],budget:[],refiAt:[],rateAt:[],H:[],income:[],own1:[],moved:null};
  if(detail){o.eq=[];o.pB=[];o.bal=[];o.flow=[];o.unrec=[];o.tax=[];o.liqTax=[];o.homeTax=[]}
  let budgetY=0,ownY=0;
  const snap=y=>{const lb=liq(pB,bB),lr=liq(pR,bR);
    if(TR)TR.ends.push({y,owned,H,bal,pB,bB,pR,bR,pC,pX,bX,cpi,infIdx,insIdx,lease,mkt,income,purchY,basis,imp,shk,ltcgE,muE,mu,niit,taxable,rate,Pcur,dpCur,Lcur,Mp,mSince,pmiOff,fha,armOn,Hr,balR,accDep,impR,susp,basisR,lb,lr,home:homeNet(H,bal,y),rentalNet:RO?rentalNet():0});o.buy.push(homeNet(H,bal,y)+lb);o.inv.push(lr);o.cash.push(pC);o.cpi.push(cpi);
    o.rental.push(RO?rentalNet()+(pX>=0?liq(pX,bX):pX):null);
    o.heloc.push(owned&&p.heloc>0?Math.max(0,p.heloc*H-bal):0);
    o.lqB.push(lb);o.lqR.push(lr);o.lqC.push(pC);o.budget.push(budgetY);o.rateAt.push(owned?rate:null);o.H.push(owned?H:0);o.income.push(income);o.own1.push(ownY);
    if(detail){o.eq.push(homeNet(H,bal,y));o.pB.push(lb);o.bal.push(owned?bal:0);
      // tax due if each portfolio were sold now, and the home sale's tax: for the tax readout
      o.liqTax.push({b:taxable?ltcgE*Math.max(0,pB-bB):0,r:taxable?ltcgE*Math.max(0,pR-bR):0});o.homeTax.push(homeTax(H,y))}};
  snap(0);
  let infPrev=0;
  const lev=p.lev,ws=p.ws,wb=p.wb,wc=Math.max(0,1-p.ws-p.wb);
  for(let y=0;y<N;y++){
    let ghY,grY,infY;
    if(M){ghY=1;grY=1;infY=1;for(let m=0;m<12;m++){ghY*=1+path.gh[y*12+m];grY*=1+path.gr[y*12+m];infY*=1+path.inf[y*12+m]}ghY--;grY--;infY--}
    else{ghY=path.gh[y];grY=path.gr[y];infY=path.inf[y]}
    // ---- planned move at the start of year y ----
    if(owned&&p.moveMode&&p.moveMode!=='none'&&p.moveYear>0&&y===p.moveYear){
      const proceeds=homeNet(H,bal,y);o.moved={year:y,mode:p.moveMode};lease=mkt;if(TR)TR.move={y,mode:p.moveMode,proceeds,H,bal,pB,bB};
      if(p.moveMode==='rent'){owned=false;[pB,bB]=dep(pB,bB,proceeds);bal=0;H=0}
      else{const mr=(M?path.mkt&&path.mkt[y*12]:path.mkt&&path.mkt[y]);rate=mr!=null?mr+cAdj:rate;
        Pcur=H;const cash=proceeds-p.close*Pcur;let dp2=Math.min(Pcur,Math.max(0,cash));
        if(cash>Pcur)[pB,bB]=dep(pB,bB,cash-Pcur);if(cash<0)[pB,bB]=dep(pB,bB,cash);
        dpCur=dp2/Pcur;Lcur=Pcur-dp2;armOn=false;fha=false;bal=Lcur;i=rate/12;Mp=pmt(Lcur,i,nTot);
        basis=Pcur*(1+p.close);purchY=y;mSince=0;imp=0;A=Pcur;Fb=Pcur;lastRefi=mE;pmiOff=false;shk=opt.saleShock2||1}}
    // assessed value: market value, or with a cap the lower of market value and a capped base that grows by the cap each
    // year (and, for inflation-linked caps such as California's and Florida's, by at most last year's inflation), so after
    // a price drop the assessment returns toward the capped base as prices recover; resets to the price on purchase
    if(owned&&y>0&&y!==purchY){const capped=p.ptaxCap>0||p.ptaxCapCPI;
      if(capped){Fb*=1+Math.min(p.ptaxCap>0?p.ptaxCap:Infinity,p.ptaxCapCPI?Math.max(0,infPrev):Infinity);A=Math.min(H,Fb)}else A=H}
    const Hy=H,insM=owned?(p.ins+p.floodIns)*insIdx/12:0,hoa=owned?p.hoa*infIdx:0,ptY=owned?ptaxOn(p,A):0;
    if(TR){ty={y,ghY,grY,infY,infPrev,owned,H,bal,pB,bB,pR,bR,pC,A,Fb,rate,Mp,lease,mkt,income,infIdx,insIdx,mu,niit,ltcgE,muE,purchY,Pcur,dpCur,Lcur,basis,imp,mo:[],tax:null};TR.years.push(ty)}
    const maintY=owned?p.maint*Hy*(mShock?mShock[y]:1):0,utilM=owned?p.utilDiff*infIdx:0;if(TR)Object.assign(ty,{ptY,maintY,insM,hoa,utilM,mShock:mShock?mShock[y]:1});
    const mktIdx=mkt/p.rent0;
    const rentM=lease+p.rins*infIdx/12+p.rMove*(p.rMoveCost*infIdx+p.broker*mkt)/12;
    const hhInc=owned&&p.hhRent>0?p.hhRent*mktIdx*(1-p.hhVac):0;if(TR)Object.assign(ty,{rentM,hhInc,mktIdx});
    // rental property, year level
    const HrY=Hr,ptR=RO?p.ptax*HrY:0,insR=RO?p.ins*(Pr/p.P)*insIdx/12:0,hoaR=RO?p.hoa*(Pr/p.P)*infIdx:0,maintR=RO?p.maint*HrY*(mShock?mShock[y]:1):0;
    const grossR=RO?Pr*yieldR/12*mktIdx:0,incR=grossR*(1-p.vacR)*(1-p.mgmt);
    let intY=0,prinY=0,pmiY=0,benefit=0,refiY=0,ownSum=0,hhTax=0,intRY=0,balSum=0,txB=0,txR=0,tf=null;const cpi0=cpi;const eqStart=owned?H-bal:0;let Rsum=0;
    for(let m=0;m<12;m++){
      let fS,fB,fC,fH,fI,xB=0;
      if(M){const k=y*12+m;fS=1+path.rs[k];fB=1+path.rb[k];fC=1+path.rc[k];fH=1+path.gh[k];fI=1+path.inf[k]}
      else{fS=Math.pow(1+path.rs[y],1/12);fB=Math.pow(1+path.rb[y],1/12);fC=Math.pow(1+path.rc[y],1/12);fH=Math.pow(1+path.gh[y],1/12);fI=Math.pow(1+path.inf[y],1/12)}
      let refiCost=0,own;const tm=TR?{m}:null;if(TR)ty.mo.push(tm);
      if(owned){
        if(p.refiOn&&path.mkt&&bal>1000){const checkNow=M?true:(m===0);
          if(checkNow&&(mE-lastRefi)>=12){const mr=M?path.mkt[y*12+m]:path.mkt[y];
            if(mr!=null&&rate-(mr+cAdj)>=p.refiTh){refiCost=p.refiCost*bal;rate=mr+cAdj;armOn=false;fha=false;i=rate/12;Mp=pmt(bal,i,nTot-mSince);lastRefi=mE;refis++;o.refiAt.push(y+m/12);refiY+=refiCost;if(TR)tm.ev={k:'refi',mr,rate,bal,left:nTot-mSince,M:Mp}}}}
        if(armOn&&bal>0.005){const k0=(p.armYears||5)*12;if(mSince>=k0&&(mSince-k0)%6===0){
          const idx=M?path.rc[y*12+m]*12:path.rc[y];let tgt=Math.round(((idx||0)+(p.armMargin||0.0275))*800)/800;
          const cap=armResets===0?(p.armCapInit!=null?p.armCapInit:0.02):(p.armCapPer!=null?p.armCapPer:0.01);
          tgt=Math.min(rate+cap,Math.max(rate-cap,tgt));tgt=Math.min(armRate0+(p.armCapLife!=null?p.armCapLife:0.05),Math.max(p.armMargin||0.0275,tgt));
          if(Math.abs(tgt-rate)>1e-9){rate=tgt;i=rate/12;Mp=pmt(bal,i,nTot-mSince)}armResets++;if(TR)tm.ev={k:'arm',idx,rate,bal,left:nTot-mSince,M:Mp}}}
        const balPrev=bal;let pay=0;balSum+=balPrev;if(TR)Object.assign(tm,{bal0:bal,i,Mp,int:0,prin:0,pre:0});
        if(bal>0.005){const it=bal*i;const pr=Math.min(Mp-it,bal);pay=it+pr;bal-=pr;intY+=it;prinY+=pr;if(TR){tm.int=it;tm.prin=pr}}
        if(xPay>0){const pre=xPrepay?Math.min(xPay,bal):0;bal-=pre;prinY+=pre;xB+=xPay-pre;if(TR)tm.pre=pre;
          // a loan paid off early keeps its scheduled payment in the budget, invested, so both choices spend the same
          if(xPrepay&&bal<=0.005&&pay<Mp&&mSince<nTot){xB+=Mp-pay;pay=Mp}}
        // conventional PMI: ends at 78% of the original price on schedule, or with an appraisal at 75% of today's value
        // after 2 years / 80% after 5 years (Fannie Mae Servicing Guide B-8.1-04)
        if(p.pmiAppr&&!fha&&!pmiOff&&dpCur<0.2&&mSince>=24&&balPrev<=(mSince>=60?0.8:0.75)*H)pmiOff=true;
        const pmi=fha?(mSince<mipMonths&&balPrev>0.005?mipRate*balPrev/12:0):((dpCur<0.2&&!pmiOff&&balPrev>0.78*Pcur)?pmiRate(p,dpCur)*Lcur/12:0);pmiY+=pmi;
        own=pay+xPay+ptY/12+maintY/12+insM+hoa+utilM+pmi+refiCost-hhInc;if(TR)Object.assign(tm,{pay,x:xPay,pmi,refi:refiCost,pmiOff,mSince,fha,dpCur,Lcur,Pcur,balPrev,mipRate,mipMonths,ben:0,hhTax:0,ownBase:own});
        if(m===11&&tx){const std=std0*infIdx,cap=saltCapFor(y,income,p.y0),own_s=1-(p.hhRent>0?p.hhShare:0);
          // interest on up to $750k of the year's average balance (IRS Pub. 936); state income tax grows with income
          // mortgage insurance is deductible again from 2026 (One Big Beautiful Bill Act), phased out by 10% per $1,000 of
          // income above $100,000 (gone at $110,000)
          const f750=balSum>0?Math.min(1,750000*12/balSum):1,stT=p.income>0?p.stTax*income/p.income:p.stTax,
            fMI=income<=100000?1:Math.max(0,1-Math.ceil((income-100000)/1000)*0.1);
          const dB=Math.max(std,Math.min(cap,stT+ptY*own_s)+(intY*f750+pmiY*fMI+(y===0?LS.ptsCost:0))*own_s+p.oth),dR=Math.max(std,Math.min(cap,stT)+p.oth);
          benefit=mu*(dB-dR)+(p.stDed?p.stRate*(intY*f750+ptY)*own_s:0);own-=benefit;
          if(TR){tm.ben=benefit;ty.tax={std,cap,own_s,f750,stT,fMI,intY,pmiY,balSum,pts:y===0?LS.ptsCost:0,dB,dR,benefit,mu,ptY}}
          if(detail)tf={std,itemB:dB>std+0.5,itemR:dR>std+0.5,cap,saltOver:Math.max(0,stT+ptY*own_s-cap),f750,miDed:pmiY*fMI,mi:pmiY,fMI};
          if(p.hhRent>0){const sh=p.hhShare,taxable=hhInc*12-sh*(intY+ptY+insM*12+maintY*(1-p.impShare)+utilM*12);hhTax=Math.max(0,taxable)*(mu+p.stRate);own+=hhTax;if(TR){tm.hhTax=hhTax;if(ty.tax)ty.tax.hhTaxable=taxable}}}
      }else own=rentM;
      ownSum+=own;if(TR)Object.assign(tm,{own,rent:rentM,owned});
      const g=ws*(fS-1)+wb*(fB-1)+wc*(fC-1);
      const ret=lev*g-(lev-1)*(fC-1)-Math.max(0,lev-1)*p.spread/12-p.fee/12;Rsum+=ret;if(TR)Object.assign(tm,{fS,fB,fC,fH,fI,g,ret});
      let taxR=0,inc=0;
      if(taxable){const cashS=Math.max(0,1-lev);inc=lev*(ws*p.dy/12+wb*(fB-1)+wc*(fC-1))+cashS*(fC-1);taxR=lev*(ws*p.dy/12*ltcgE+(wb*(fB-1)+wc*(fC-1))*muE)+cashS*(fC-1)*muE;
        if(detail){txB+=Math.max(0,pB)*taxR;txR+=Math.max(0,pR)*taxR}}
      const grow=(V,b)=>{const V0=V;if(V0<0)return [V0*(1+(fC-1)+BORROW_PREM/12),0];
        V=V0*(1+ret)-V0*taxR;if(taxable)b+=V0*(inc-taxR);if(V<0)V=0;return [V,b]};
      // the portfolio ledger for the trace: return, tax, overdraft interest, and the floor at zero
      const gl=TR?(V,b)=>{const pos=V>=0,v1=V*(1+ret)-V*taxR;return {v0:V,b0:b,ret:pos?V*ret:0,tax:pos?V*taxR:0,brw:pos?0:V*((fC-1)+BORROW_PREM/12),clamp:pos&&v1<0?-v1:0,binc:pos&&taxable?V*(inc-taxR):0}}:null;
      if(TR){tm.taxR=taxR;tm.inc=inc;tm.B=gl(pB,bB);tm.R=gl(pR,bR);tm.C={v0:pC,ret:pC*(fC-1),tax:tx?pC*(fC-1)*muE:0}}
      [pB,bB]=grow(pB,bB);[pR,bR]=grow(pR,bR);
      pC*=1+(fC-1)*(tx?1-muE:1);
      if(RO){if(pX>=0){[pX,bX]=grow(pX,bX)}else pX*=1+(fC-1)+BORROW_PREM/12;
        let payR=0;if(balR>0.005){const it=balR*iR,pr=Math.min(MpR-it,balR);payR=it+pr;balR-=pr;intRY+=it}
        const cf=incR-payR-ptR/12-insR-hoaR-maintR/12;
        if(m===11&&tx){const dep=Math.min(depBasis/27.5,Math.max(0,depBasis-accDep));accDep+=dep;
          let tI=incR*12-intRY-ptR-insR*12-hoaR*12-maintR*(1-p.impShare)-dep,refund=0;
          if(tI>=0){const use=Math.min(susp,tI);susp-=use;tI-=use;refund=-tI*(mu+niit+p.stRate)}
          else{const allow=25000*Math.min(1,Math.max(0,(150000-income)/50000)),ded=Math.min(-tI,allow);susp+=-tI-ded;refund=ded*(mu+p.stRate)}
          pX+=refund;if(refund>0)bX+=refund}
        const xInv=Math.max(0,own-rentM)*share+cf;pX+=xInv;if(xInv>0)bX+=xInv;}
      H*=fH;if(RO)Hr*=fH;cpi*=fI;mE++;mSince++;
      const d=own-rentM;
      if(d>0){const x=d*share;pR+=x;bR+=x;pC+=x}else[pB,bB]=dep(pB,bB,-d*share);
      if(xB>0)[pB,bB]=dep(pB,bB,xB);
      if(TR){Object.assign(tm,{d,xB,addR:d>0?d*share:0,addB:d>0?0:-d*share});tm.B.v1=pB;tm.B.b1=bB;tm.R.v1=pR;tm.R.b1=bR;tm.C.v1=pC}
    }
    ownY=ownSum/12;budgetY=Math.max(ownY,rentM);if(owned)imp+=p.impShare*maintY;if(RO)impR+=p.impShare*maintR;
    if(detail){
      o.tax.push({saving:benefit,ptax:ptY,hh:hhTax,invB:txB,invR:txR,mu,niit,ltcg:ltcgE-niit-p.stRate,income,owned,cpi:Math.sqrt(cpi0*cpi),...(tf||{})});
      o.flow.push({interest:intY/12,principal:prinY/12,ptax:ptY/12,ins:insM,maint:maintY/12,hoa,util:utilM,pmi:pmiY/12,refi:refiY/12,tax:-benefit/12,hh:-(hhInc-hhTax/12),rent:rentM,own:ownSum/12,cpi:Math.sqrt(cpi0*cpi),owned});  // flows at the year's mid-point prices
      const opp=eqStart*Rsum;
      o.unrec.push({own:owned?intY+ptY+maintY+insM*12+hoa*12+utilM*12+pmiY+refiY-benefit-(hhInc*12-hhTax)+opp:rentM*12,opp:owned?opp:0,rent:rentM*12,cpi});
    }
    infPrev=infY;
    // rent: market rent grows; the sitting tenant renews at (growth − gap) and resets to market when moving
    mkt*=1+grY;const eta=Math.min(1,Math.max(0,p.rMove));lease=(1-eta)*lease*(1+grY-renewGap)+eta*mkt;
    infIdx*=1+infY;insIdx*=1+infY+(p.insG||0);income*=1+incG;setRates();
    snap(y+1);
  }
  o.refis=refis;if(TR)o.tr=TR;return o;
}

/* ===================== Paths ===================== */
function marketRatePath(p,N){return [...Array(N)].map((_,y)=>p.rate+(p.rateLR-p.rate)*Math.min(1,y/Math.max(0.0001,p.glide)))}
function constPath(p,N){const a=k=>Array(N).fill(p[k]);return {gh:a('gh'),gr:a('gr'),rs:a('rs'),rb:a('rb'),rc:a('rc'),inf:a('inf'),mkt:marketRatePath(p,N)}}

/* ===================== Monte Carlo core (also runs in a worker) ===================== */
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r())}
function gammaS(k,r){if(k<1){return gammaS(k+1,r)*Math.pow(r(),1/k)}const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=gauss(r);v=1+c*x}while(v<=0);v=v*v*v;const u=r();if(u<1-0.0331*x**4||Math.log(u)<0.5*x*x+d*(1-v+Math.log(v)))return d*v}}
const MAINT_CV=1.2;
/* average yearly home and portfolio growth of each path over the first h years */
function mcHorizon(res,h){res.gH=res.cH.map(c=>(Math.exp(c[h]/h)-1)*100);res.gP=res.cP.map(c=>(Math.exp(c[h]/h)-1)*100)}
function mcCore(p,cfg){
  const n=cfg.n,bl=cfg.bl,from=cfg.from,rc=cfg.rc,iv=p.idio,adj=(v,c)=>cfg.real?v/c:v;
  const N=30,i0=from-Y0,W=NY-i0,keys=['gh','gr','rs','rb','rc','inf'];
  const home=cfg.home;const src={gh:home,gr:cfg.rent||RENTG,rs:STK,rb:BOND,rc:BILL,inf:INF};
  const LOG={},SH={};keys.forEach(k=>{LOG[k]=src[k].slice(i0).map(v=>Math.log(1+v/100));const m=LOG[k].reduce((a,b)=>a+b,0)/W;SH[k]=rc?Math.log(1+p[k])-m:0});
  const r=rng(12345),res={buy:[],inv:[],cash:[],rental:[],cH:[],cP:[],gH:[],gP:[],lqMinB:[],lqMinR:[],refis:[],rates:[],T:[],forced:[],HT:[]};
  for(let s=0;s<n;s++){
    const idx=[];while(idx.length<N){const st=Math.floor(r()*W);for(let j=0;j<bl&&idx.length<N;j++)idx.push((st+j)%W)}  // circular blocks: every year equally likely, so re-centering hits the target mean
    const path={};keys.forEach(k=>path[k]=idx.map(j=>Math.exp(LOG[k][j]+SH[k])-1));
    let saleShock=1,saleShock2=1;if(iv>0){if(p.idioMode==='yearly')path.gh=path.gh.map(g=>(1+g)*Math.exp(iv*gauss(r)-iv*iv/2)-1);else{saleShock=Math.exp(iv*gauss(r)-iv*iv/2);saleShock2=Math.exp(iv*gauss(r)-iv*iv/2)}}
    let m=p.rate*100;const mbar=(p.rateLR||p.rate)*100,K=Math.min(1,Math.max(0,RATE_AR.kappa));
    path.mkt=idx.map(j=>{const gi=i0+j,dPi=INF[gi]-(gi>0?INF[gi-1]:INF[gi]);const e=RATE_AR.res[gi]!=null?RATE_AR.res[gi]:RATE_AR.sigma*gauss(r);
      m=Math.min(20,Math.max(2,m+K*(mbar-m)+RATE_AR.gamma*dPi+e));return m/100});
    const kk=1/(MAINT_CV*MAINT_CV),maintShock=idx.map(()=>gammaS(kk,r)/kk);
    const o=simulate(p,path,{N,saleShock,saleShock2,maintShock});
    res.buy.push(o.buy.map((v,k)=>adj(v,o.cpi[k])));res.inv.push(o.inv.map((v,k)=>adj(v,o.cpi[k])));res.cash.push(o.cash.map((v,k)=>adj(v,o.cpi[k])));
    // cumulative log growth of the home and the portfolio, so any horizon can be read without re-simulating
    const cH=[0],cP=[0];for(let y=0;y<N;y++){const g=p.ws*path.rs[y]+p.wb*path.rb[y]+(1-p.ws-p.wb)*path.rc[y],lv=p.lev!=null?p.lev:1;
      cH.push(cH[y]+Math.log(1+path.gh[y]));cP.push(cP[y]+Math.log(Math.max(0.01,1+lv*g-(lv-1)*path.rc[y]-Math.max(0,lv-1)*(p.spread||0)-p.fee)))}
    res.cH.push(cH);res.cP.push(cP);
    let mb=Infinity,mr=Infinity;for(let y=1;y<=Math.min(5,N);y++){const bud=o.budget[y]||1;mb=Math.min(mb,(o.lqB[y]+o.heloc[y])/bud);mr=Math.min(mr,o.lqR[y]/bud)}
    res.lqMinB.push(mb);res.lqMinR.push(mr);res.refis.push(o.refis);res.rates.push(path.mkt);
    // first early move within 30 years (N = none); a horizon h only counts moves before h
    let T=N,forced=false;if(p.hz>0){for(let t=1;t<N;t++){const bad=path.gh[t-1]<0||path.rs[t-1]<-0.15,hz=Math.min(1,p.hz*(bad?p.stressMult:1));if(r()<hz){T=t;forced=bad;break}}}
    res.T.push(T);res.forced.push(forced);res.HT.push(o.H.map((v,k)=>adj(v*(1-sellAt(p,v)),o.cpi[k])));
    if(p.rentalOn)res.rental.push(o.rental.map((v,k)=>adj(v,o.cpi[k])));
  }
  const pWin=[],pWinC=[];for(let y=0;y<=N;y++){let a=0,b=0;for(let s=0;s<n;s++){if(res.buy[s][y]>res.inv[s][y])a++;if(res.buy[s][y]>res.cash[s][y])b++}pWin.push(a/n);pWinC.push(b/n)}
  const pMoveH=[0],pForcedH=[0];for(let h=1;h<=N;h++){let mv=0,nf=0;
    for(let s=0;s<n;s++){const early=res.T[s]<h,T=early?res.T[s]:h,fd=early&&res.forced[s],disc=fd?p.forcedDisc*res.HT[s][T]:0;if(fd)nf++;if(res.buy[s][T]-disc>res.inv[s][T])mv++}
    pMoveH.push(mv/n);pForcedH.push(nf/n)}
  const hN=Math.max(1,Math.min(p.N,N));mcHorizon(res,hN);
  const pWinR=p.rentalOn?[...Array(N+1)].map((_,y)=>res.rental.filter((a,s)=>a[y]>res.inv[s][y]).length/n):null;
  return {n,N,res,pWin,pWinC,pWinR,pMoveH,pForcedH,pMove:pMoveH[hN],pForced:pForcedH[hN]};
}
