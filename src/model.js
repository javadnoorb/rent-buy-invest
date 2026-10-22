"use strict";
/* ===================== Historical annual data (calendar years 1928–2025) ===================== */
const Y0=1928;
const STK=[43.81,-8.30,-25.12,-43.84,-8.64,49.98,-1.19,46.74,31.94,-35.34,29.28,-1.10,-10.67,-12.77,19.17,25.06,19.03,35.82,-8.43,5.20,5.70,18.30,30.81,23.68,18.15,-1.21,52.56,32.60,7.44,-10.46,43.72,12.06,0.34,26.64,-8.81,22.61,16.42,12.40,-9.97,23.80,10.81,-8.24,3.56,14.22,18.76,-14.31,-25.90,37.00,23.83,-6.98,6.51,18.52,31.74,-4.70,20.42,22.34,6.15,31.24,18.49,5.81,16.54,31.48,-3.06,30.23,7.49,9.97,1.33,37.20,22.68,33.10,28.34,20.89,-9.03,-11.85,-21.97,28.36,10.74,4.83,15.61,5.48,-36.55,25.94,14.82,2.10,15.89,32.15,13.52,1.38,11.77,21.61,-4.23,31.21,18.02,28.47,-18.04,26.06,24.88,17.78];
const BILL=[3.08,3.16,4.55,2.31,1.07,0.96,0.28,0.17,0.17,0.28,0.07,0.05,0.04,0.13,0.34,0.38,0.38,0.38,0.38,0.60,1.05,1.12,1.20,1.52,1.72,1.89,0.94,1.72,2.62,3.22,1.77,3.39,2.87,2.35,2.77,3.16,3.55,3.95,4.86,4.29,5.34,6.67,6.39,4.33,4.06,7.04,7.85,5.79,4.98,5.26,7.18,10.05,11.39,14.04,11.09,8.95,9.92,7.72,6.15,5.96,6.89,8.39,7.75,5.54,3.51,3.07,4.37,5.66,5.15,5.20,4.91,4.78,6.00,3.48,1.64,1.03,1.40,3.22,4.85,4.48,1.40,0.15,0.14,0.05,0.09,0.06,0.03,0.05,0.32,0.95,1.97,2.11,0.36,0.04,2.09,5.28,5.18,4.21];
const BOND=[0.84,4.20,4.54,-2.56,8.79,1.86,7.96,4.47,5.02,1.38,4.21,4.41,5.40,-2.02,2.29,2.49,2.58,3.80,3.13,0.92,1.95,4.66,0.43,-0.30,2.27,4.14,3.29,-1.34,-2.26,6.80,-2.10,-2.65,11.64,2.06,5.69,1.68,3.73,0.72,2.91,-1.58,3.27,-5.01,16.75,9.79,2.82,3.66,1.99,3.61,15.98,1.29,-0.78,0.67,-2.99,8.20,32.81,3.20,13.73,25.71,24.28,-4.96,8.22,17.69,6.24,15.00,9.36,14.21,-8.04,23.48,1.43,9.94,14.92,-8.25,16.66,5.57,15.12,0.38,4.49,2.87,1.96,10.21,20.10,-11.12,8.46,16.04,2.97,-9.10,10.75,1.28,0.69,2.80,-0.02,9.64,11.33,-4.42,-17.83,3.88,-1.64,7.80];
const HOME=[1.49,-2.06,-4.30,-8.15,-10.47,-3.81,2.91,9.77,3.22,2.56,-0.87,-1.30,3.31,-8.38,3.33,11.45,16.58,11.78,24.10,21.26,2.06,0.09,3.64,6.05,4.41,11.52,0.92,0.00,0.91,2.72,0.66,0.11,0.77,0.98,0.32,2.14,1.26,1.66,1.22,2.32,4.13,6.99,8.22,4.24,2.98,3.42,10.07,6.77,8.18,14.65,15.72,13.74,7.40,5.10,0.56,4.75,4.68,7.47,9.61,7.85,7.22,4.39,-0.69,-0.17,0.82,2.16,2.52,1.79,2.43,4.02,6.44,7.68,9.29,6.68,9.56,9.81,13.64,13.51,1.73,-5.40,-12.00,-3.85,-4.12,-3.89,6.44,10.72,4.50,5.19,5.31,6.21,4.52,3.69,10.43,18.86,5.65,5.68,3.96,1.58];
const CPIL=[17.3,17.1,17.2,16.1,14.6,13.1,13.2,13.4,13.8,14.0,14.4,14.0,14.0,14.1,15.5,16.9,17.4,17.8,18.2,21.5,23.4,24.1,23.6,25.0,26.5,26.7,26.9,26.7,26.8,27.6,28.4,28.9,29.4,29.8,30.0,30.4,30.9,31.2,31.8,32.9,33.9,35.5,37.7,39.8,41.1,42.5,46.2,51.9,55.5,58.2,62.1,67.7,76.7,86.3,94.0,97.6,101.3,105.3,109.3,110.5,115.4,120.5,126.1,133.8,137.9,141.9,145.8,149.7,153.5,158.6,161.3,163.9,168.3,174.0,176.7,180.9,184.3,190.3,196.8,201.8,210.036,210.228,215.949,219.179,225.672,229.601,233.049,234.812,236.525,241.432,246.524,251.233,256.974,260.474,278.802,296.797,306.746,315.605,324.054];
const RENTL=[33.3,32.5,31.8,30.7,28.6,24.7,21.8,21.967,22.133,22.3,23.5,23.7,23.7,23.8,24.6,24.6,24.7,24.8,24.9,25.9,26.9,28.1,29.2,30.2,31.6,33.0,34.9,35.4,35.8,36.7,37.3,37.9,38.5,39.0,39.5,39.9,40.3,40.7,41.1,41.8,42.7,43.8,45.5,47.6,49.4,51.1,53.6,56.5,59.4,62.6,66.7,71.6,77.3,84.3,91.5,97.5,102.2,108.2,115.1,120.8,125.6,130.1,135.5,141.1,145.2,148.6,151.9,155.7,159.6,164.0,169.1,174.9,180.3,187.6,196.4,202.5,207.9,213.9,220.5,230.0,239.102,247.278,248.999,250.986,257.189,264.098,271.688,280.874,291.204,302.735,313.904,324.815,336.789,344.455,355.931,385.649,410.606,428.151,440.667];
const MORT0=1972;
let MORT=[7.38,8.04,9.19,9.05,8.87,8.85,9.64,11.20,13.74,16.63,16.04,13.24,13.88,12.43,10.19,10.21,10.34,10.32,10.13,9.25,8.39,7.31,8.38,7.93,7.81,7.60,6.94,7.44,8.05,6.97,6.54,5.83,5.84,5.87,6.41,6.34,6.03,5.04,4.69,4.45,3.66,3.98,4.17,3.85,3.65,3.99,4.54,3.94,3.11,2.96,5.34,6.81,6.72,6.63];
if(typeof MORT_OVERRIDE!=='undefined'&&MORT_OVERRIDE&&MORT_OVERRIDE.length===MORT.length)MORT=MORT_OVERRIDE;
const NY=STK.length, YEARS=[...Array(NY)].map((_,i)=>Y0+i);
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
  return {alpha:bta[0],kappa:-bta[1],gamma:bta[2],sigma:Math.sqrt(ss/(X.length-k)),mean:-bta[0]/bta[1],res,n:X.length}})();
const SER={gh:HOME,gr:RENTG,rs:STK,rb:BOND,rc:BILL,inf:INF};
function geo(a,from,to){const i0=from-Y0,i1=(to||2025)-Y0;let lp=0,n=0;for(let i=i0;i<=i1;i++){if(a[i]==null)continue;lp+=Math.log(1+a[i]/100);n++}return (Math.exp(lp/n)-1)*100}
const r2=x=>Math.round(x*100)/100;

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
function saltCap(y){const cy=2026+y;if(cy>=2030)return 10000;return 40400*Math.pow(1.01,cy-2026)}
/* SALT cap with the high-income phase-out: cap falls by 30% of MAGI above the threshold, floor $10,000; cap and threshold rise 1%/yr through 2029 */
function saltCapFor(y,magi){const cy=2026+y;if(cy>=2030)return 10000;const g=Math.pow(1.01,cy-2026);return Math.max(10000,40400*g-0.3*Math.max(0,(magi||0)-505000*g))}
/* 2026 federal brackets (IRS IR-2025-103): marginal rate on taxable income */
const BRACKETS={single:[[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[640600,.35],[Infinity,.37]],
  mfj:[[24800,.10],[100800,.12],[211400,.22],[403550,.24],[512450,.32],[768700,.35],[Infinity,.37]]};
function marginalRate(income,filing){const std=filing==='mfj'?32200:16100,ti=Math.max(0,income-std);for(const [top,r] of BRACKETS[filing==='mfj'?'mfj':'single'])if(ti<=top)return r;return .37}
function pmt(B,i,n){if(B<=0||n<=0)return 0;return i>0?B*i/(1-Math.pow(1+i,-n)):B/n}
/* Transfer taxes from a list of rules: base price or mortgage; flat rate, a rate set by the bracket of the whole amount
   ("mansion" style), or marginal brackets; paid by buyer, seller, or split evenly. Returns dollars. */
function transferTaxes(rules,P,L){let buyer=0,seller=0;
  (rules||[]).forEach(r=>{const x=r.base==='mortgage'?L:P;let t=0;
    if(r.structure==='flat')t=(r.rate||0)*x;
    else if(r.structure==='whole_price_tiers'){const tr=(r.tiers||[]).find(q=>x>=q.from&&(q.to==null||x<q.to));t=tr?tr.rate*x:0}
    else if(r.structure==='marginal_tiers'){(r.tiers||[]).forEach(q=>{const hi=q.to==null?x:Math.min(x,q.to);if(hi>q.from)t+=(hi-q.from)*q.rate})}
    if(r.payer==='buyer')buyer+=t;else if(r.payer==='seller')seller+=t;else{buyer+=t/2;seller+=t/2}});
  return {buyer,seller}}
/* Loan setup shared by the simulation and the summary.
   fixed: conventional with PMI under 20% down. fha: 1.75% upfront MIP financed, annual MIP by loan size/LTV/term
   (HUD ML 2023-05), for 11 years if LTV ≤ 90% else the full term. arm: initial rate for armYears, then resets every
   6 months to index (T-bill/SOFR proxy) + margin within initial/periodic/lifetime caps. Points lower the note rate. */
function loanSetup(p,rateIn){
  const type=p.loanType||'fixed',base=p.P*(1-p.dp),ltv=1-p.dp,pts=Math.max(0,p.pts||0);
  let rate=type==='arm'?rateIn-(p.rate-(p.armRate!=null?p.armRate:p.rate)):rateIn;rate=Math.max(0,rate-pts*(p.ptsCut||0));
  let L=base,mip=0,mipMonths=0;
  if(type==='fha'){L=base*1.0175;const big=base>726200;
    if(p.term>15)mip=big?(ltv>0.95?0.0075:0.007):(ltv>0.95?0.0055:0.005);
    else mip=big?(ltv>0.9?0.0065:ltv>0.78?0.004:0.0015):(ltv>0.9?0.004:0.0015);
    mipMonths=ltv<=0.9?132:p.term*12}
  return {type,L,rate,mip,mipMonths,ptsCost:pts/100*base,ltv}}
function simulate(p,path,opt){
  opt=opt||{};const N=opt.N||p.N,detail=!!opt.detail,M=!!path.monthly;
  const LS=loanSetup(p,opt.rate!=null?opt.rate:p.rate);let rate=LS.rate;
  const nTot=p.term*12,excl=p.filing==='mfj'?500000:250000,std0=p.filing==='mfj'?32200:16100,niitThr=p.filing==='mfj'?250000:200000;
  const tx=p.taxOn,taxable=tx&&p.acct==='taxable',share=p.investShare,mShock=opt.maintShock;
  const muAuto=p.muMode==='auto'&&tx,incG=p.incGrowth||0,renewGap=p.renewGap||0;
  // ---- buyer's home state (can change at a planned move) ----
  let owned=true,Pcur=p.P,dpCur=p.dp,Lcur=LS.L,armOn=LS.type==='arm',armRate0=LS.rate,armResets=0,mipRate=LS.mip,mipMonths=LS.mipMonths,fha=LS.type==='fha',insIdx=1,basis=p.P*(1+p.close),purchY=0,mSince=0,imp=0;
  let i=rate/12,Mp=pmt(Lcur,i,nTot),f750=Lcur>0?Math.min(1,750000/Lcur):1,shk=opt.saleShock||1;
  let H=p.P,A=p.P,bal=Lcur,pB=0,bB=0,pR=p.P*(p.dp+p.close)+p.moveIn+LS.ptsCost,bR=pR,pC=pR,cpi=1,infIdx=1,refis=0,lastRefi=-999,mE=0;
  let lease=p.rent0,mkt=p.rent0,income=p.income;
  // per-year tax rates (income can grow, so brackets and NIIT can change)
  let mu=p.mu,niit=p.niit,ltcgE=0,muE=0;
  const setRates=()=>{mu=muAuto?marginalRate(income/infIdx,p.filing):p.mu;niit=p.niitAuto?(tx&&income>niitThr?0.038:0):(p.niit||0);ltcgE=p.ltcg+niit+p.stRate;muE=mu+niit+p.stRate};
  setRates();
  // ---- optional fourth household: rents its home, owns a rental property ----
  const RO=!!p.rentalOn;let Pr=0,Hr=0,balR=0,iR=0,MpR=0,accDep=0,impR=0,susp=0,pX=0,bX=0,depBasis=0,yieldR=0,basisR=0;
  if(RO){const C0=p.P*(p.dp+p.close)+p.moveIn;Pr=C0/(p.dpR+p.close);Hr=Pr;balR=Pr*(1-p.dpR);iR=(p.rate30+p.ratePrem)/12;MpR=pmt(balR,iR,360);
    depBasis=Pr*(1+p.close)*(1-p.landShare);basisR=Pr*(1+p.close);yieldR=p.rent0*12/p.P}
  const liq=(V,b)=>taxable?V-ltcgE*Math.max(0,V-b):V;
  const homeNet=(H,bal,y)=>{if(!owned)return 0;const held=y-purchY;const sale=H*(held>0?shk:1)*(1-p.sell);const gain=sale-basis-imp-(held>=2?excl:0);return sale-bal-(tx?ltcgE*Math.max(0,gain):0)};
  const rentalNet=()=>{if(!RO)return 0;const sale=Hr*(1-p.sell),gain=sale-(basisR+impR-accDep);let t=0;
    if(tx){const rec=Math.min(Math.max(gain,0),accDep);t=rec*(Math.min(0.25,mu)+niit+p.stRate)+Math.max(0,gain-rec)*ltcgE-susp*muE}
    return sale-balR-t};
  const o={buy:[],inv:[],cash:[],rental:[],cpi:[],lqB:[],lqR:[],lqC:[],budget:[],refiAt:[],rateAt:[],H:[],income:[],own1:[],moved:null};
  if(detail){o.eq=[];o.pB=[];o.bal=[];o.flow=[];o.unrec=[]}
  let budgetY=0,ownY=0;
  const snap=y=>{const lb=liq(pB,bB),lr=liq(pR,bR);o.buy.push(homeNet(H,bal,y)+lb);o.inv.push(lr);o.cash.push(pC);o.cpi.push(cpi);
    o.rental.push(RO?rentalNet()+(pX>=0?liq(pX,bX):pX):null);
    o.lqB.push(lb);o.lqR.push(lr);o.lqC.push(pC);o.budget.push(budgetY);o.rateAt.push(owned?rate:null);o.H.push(owned?H:0);o.income.push(income);o.own1.push(ownY);
    if(detail){o.eq.push(homeNet(H,bal,y));o.pB.push(lb);o.bal.push(owned?bal:0)}};
  snap(0);
  let ghPrev=0;
  const lev=p.lev,ws=p.ws,wb=p.wb,wc=Math.max(0,1-p.ws-p.wb);
  for(let y=0;y<N;y++){
    let ghY,grY,infY;
    if(M){ghY=1;grY=1;infY=1;for(let m=0;m<12;m++){ghY*=1+path.gh[y*12+m];grY*=1+path.gr[y*12+m];infY*=1+path.inf[y*12+m]}ghY--;grY--;infY--}
    else{ghY=path.gh[y];grY=path.gr[y];infY=path.inf[y]}
    // ---- planned move at the start of year y ----
    if(owned&&p.moveMode&&p.moveMode!=='none'&&p.moveYear>0&&y===p.moveYear){
      const proceeds=homeNet(H,bal,y);o.moved={year:y,mode:p.moveMode};lease=mkt;
      if(p.moveMode==='rent'){owned=false;pB+=proceeds;bB+=Math.max(0,proceeds);bal=0;H=0}
      else{const mr=(M?path.mkt&&path.mkt[y*12]:path.mkt&&path.mkt[y]);rate=mr!=null?mr:rate;
        Pcur=H;const cash=proceeds-p.close*Pcur;let dp2=Math.min(Pcur,Math.max(0,cash));
        if(cash>Pcur){pB+=cash-Pcur;bB+=cash-Pcur}if(cash<0){pB+=cash}
        dpCur=dp2/Pcur;Lcur=Pcur-dp2;armOn=false;fha=false;bal=Lcur;i=rate/12;Mp=pmt(Lcur,i,nTot);f750=Lcur>0?Math.min(1,750000/Lcur):1;
        basis=Pcur*(1+p.close);purchY=y;mSince=0;imp=0;A=Pcur;lastRefi=-999;shk=opt.saleShock2||1}}
    if(owned&&y>0&&y!==purchY){A=p.ptaxCap>0?Math.min(H,A*(1+Math.min(ghPrev,p.ptaxCap))):H}
    const Hy=H,insM=owned?(p.ins+p.floodIns)*insIdx/12:0,hoa=owned?p.hoa*infIdx:0,ptY=owned?p.ptax*A:0;
    const maintY=owned?p.maint*Hy*(mShock?mShock[y]:1):0,utilM=owned?p.utilDiff*infIdx:0;
    const mktIdx=mkt/p.rent0;
    const rentM=lease+p.rins*infIdx/12+p.rMove*(p.rMoveCost*infIdx+p.broker*mkt)/12;
    const hhInc=owned&&p.hhRent>0?p.hhRent*mktIdx*(1-p.hhVac):0;
    // rental property, year level
    const HrY=Hr,ptR=RO?p.ptax*HrY:0,insR=RO?p.ins*(Pr/p.P)*insIdx/12:0,hoaR=RO?p.hoa*(Pr/p.P)*infIdx:0,maintR=RO?p.maint*HrY*(mShock?mShock[y]:1):0;
    const grossR=RO?Pr*yieldR/12*mktIdx:0,incR=grossR*(1-p.vacR)*(1-p.mgmt);
    let intY=0,prinY=0,pmiY=0,benefit=0,refiY=0,ownSum=0,hhTax=0,intRY=0;const eqStart=owned?H-bal:0;let Rsum=0;
    for(let m=0;m<12;m++){
      let fS,fB,fC,fH,fI;
      if(M){const k=y*12+m;fS=1+path.rs[k];fB=1+path.rb[k];fC=1+path.rc[k];fH=1+path.gh[k];fI=1+path.inf[k]}
      else{fS=Math.pow(1+path.rs[y],1/12);fB=Math.pow(1+path.rb[y],1/12);fC=Math.pow(1+path.rc[y],1/12);fH=Math.pow(1+path.gh[y],1/12);fI=Math.pow(1+path.inf[y],1/12)}
      let refiCost=0,own;
      if(owned){
        if(p.refiOn&&path.mkt&&bal>1000){const checkNow=M?true:(m===0);
          if(checkNow&&(mE-lastRefi)>=12){const mr=M?path.mkt[y*12+m]:path.mkt[y];
            if(mr!=null&&rate-mr>=p.refiTh){refiCost=p.refiCost*bal;rate=mr;armOn=false;i=rate/12;Mp=pmt(bal,i,nTot-mSince);lastRefi=mE;refis++;o.refiAt.push(y+m/12);refiY+=refiCost}}}
        if(armOn&&bal>0.005){const k0=(p.armYears||5)*12;if(mSince>=k0&&(mSince-k0)%6===0){
          const idx=M?path.rc[y*12+m]*12:path.rc[y];let tgt=Math.round(((idx||0)+(p.armMargin||0.0275))*800)/800;
          const cap=armResets===0?(p.armCapInit!=null?p.armCapInit:0.02):(p.armCapPer!=null?p.armCapPer:0.01);
          tgt=Math.min(rate+cap,Math.max(rate-cap,tgt));tgt=Math.min(armRate0+(p.armCapLife!=null?p.armCapLife:0.05),Math.max(p.armMargin||0.0275,tgt));
          if(Math.abs(tgt-rate)>1e-9){rate=tgt;i=rate/12;Mp=pmt(bal,i,nTot-mSince)}armResets++}}
        const balPrev=bal;let pay=0;
        if(bal>0.005){const it=bal*i;const pr=Math.min(Mp-it,bal);pay=it+pr;bal-=pr;intY+=it;prinY+=pr}
        const pmi=fha?(mSince<mipMonths&&balPrev>0.005?mipRate*balPrev/12:0):((dpCur<0.2&&balPrev>0.78*Pcur)?p.pmi*Lcur/12:0);pmiY+=pmi;
        own=pay+ptY/12+maintY/12+insM+hoa+utilM+pmi+refiCost-hhInc;
        if(m===11&&tx){const std=std0*infIdx,cap=saltCapFor(y,income),own_s=1-(p.hhRent>0?p.hhShare:0);
          const dB=Math.max(std,Math.min(cap,p.stTax+ptY*own_s)+(intY*f750+(y===0?LS.ptsCost:0))*own_s+p.oth),dR=Math.max(std,Math.min(cap,p.stTax)+p.oth);
          benefit=mu*(dB-dR)+(p.stDed?p.stRate*(intY*f750+ptY)*own_s:0);own-=benefit;
          if(p.hhRent>0){const sh=p.hhShare,taxable=hhInc*12-sh*(intY+ptY+insM*12+maintY*(1-p.impShare)+utilM*12);hhTax=Math.max(0,taxable)*(mu+p.stRate);own+=hhTax}}
      }else own=rentM;
      ownSum+=own;
      const g=ws*(fS-1)+wb*(fB-1)+wc*(fC-1);
      const ret=lev*g-(lev-1)*((fC-1)+p.spread/12)-p.fee/12;Rsum+=ret;
      let taxR=0,inc=0;
      if(taxable){inc=lev*(ws*p.dy/12+wb*(fB-1)+wc*(fC-1));taxR=lev*(ws*p.dy/12*ltcgE+(wb*(fB-1)+wc*(fC-1))*muE)}
      const grow=(V,b)=>{const V0=V;V=V0*(1+ret)-V0*taxR;if(taxable)b+=V0*(inc-taxR);if(V<0)V=0;return [V,b]};
      [pB,bB]=grow(pB,bB);[pR,bR]=grow(pR,bR);
      pC*=1+(fC-1)*(tx?1-muE:1);
      if(RO){if(pX>=0){[pX,bX]=grow(pX,bX)}else pX*=1+(fC-1)+0.03/12;
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
      if(d>0){const x=d*share;pR+=x;bR+=x;pC+=x}else{const x=-d*share;pB+=x;bB+=x}
    }
    ownY=ownSum/12;budgetY=Math.max(ownY,rentM);if(owned)imp+=p.impShare*maintY;if(RO)impR+=p.impShare*maintR;
    if(detail){
      o.flow.push({interest:intY/12,principal:prinY/12,ptax:ptY/12,ins:insM,maint:maintY/12,hoa,util:utilM,pmi:pmiY/12,refi:refiY/12,tax:-benefit/12,hh:-(hhInc-hhTax/12),rent:rentM,own:ownSum/12,cpi,owned});
      const opp=eqStart*Rsum;
      o.unrec.push({own:owned?intY+ptY+maintY+insM*12+hoa*12+utilM*12+pmiY+refiY-benefit-(hhInc*12-hhTax)+opp:rentM*12,opp:owned?opp:0,rent:rentM*12,cpi});
    }
    ghPrev=ghY;
    // rent: market rent grows; the sitting tenant renews at (growth − gap) and resets to market when moving
    mkt*=1+grY;const eta=Math.min(1,Math.max(0,p.rMove));lease=(1-eta)*lease*(1+grY-renewGap)+eta*mkt;
    infIdx*=1+infY;insIdx*=1+infY+(p.insG||0);income*=1+incG;setRates();
    snap(y+1);
  }
  o.refis=refis;return o;
}

/* ===================== Paths ===================== */
function marketRatePath(p,N){return [...Array(N)].map((_,y)=>p.rate+(p.rateLR-p.rate)*Math.min(1,y/Math.max(0.0001,p.glide)))}
function constPath(p,N){const a=k=>Array(N).fill(p[k]);return {gh:a('gh'),gr:a('gr'),rs:a('rs'),rb:a('rb'),rc:a('rc'),inf:a('inf'),mkt:marketRatePath(p,N)}}

/* ===================== Monte Carlo core (also runs in a worker) ===================== */
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r())}
function gammaS(k,r){if(k<1){return gammaS(k+1,r)*Math.pow(r(),1/k)}const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=gauss(r);v=1+c*x}while(v<=0);v=v*v*v;const u=r();if(u<1-0.0331*x**4||Math.log(u)<0.5*x*x+d*(1-v+Math.log(v)))return d*v}}
const MAINT_CV=1.2;
function mcCore(p,cfg){
  const n=cfg.n,bl=cfg.bl,from=cfg.from,rc=cfg.rc,iv=p.idio,adj=(v,c)=>cfg.real?v/c:v;
  const N=30,i0=from-Y0,W=NY-i0,keys=['gh','gr','rs','rb','rc','inf'];
  const home=cfg.home;const src={gh:home,gr:cfg.rent||RENTG,rs:STK,rb:BOND,rc:BILL,inf:INF};
  const LOG={},SH={};keys.forEach(k=>{LOG[k]=src[k].slice(i0).map(v=>Math.log(1+v/100));const m=LOG[k].reduce((a,b)=>a+b,0)/W;SH[k]=rc?Math.log(1+p[k])-m:0});
  const r=rng(12345),res={buy:[],inv:[],cash:[],rental:[],gH:[],gP:[],lqMinB:[],lqMinR:[],refis:[],rates:[],T:[],forced:[],HT:[]};
  for(let s=0;s<n;s++){
    const idx=[];while(idx.length<N){const st=Math.floor(r()*W);for(let j=0;j<bl&&idx.length<N;j++)idx.push((st+j)%W)}
    const path={};keys.forEach(k=>path[k]=idx.map(j=>Math.exp(LOG[k][j]+SH[k])-1));
    let saleShock=1,saleShock2=1;if(iv>0){if(p.idioMode==='yearly')path.gh=path.gh.map(g=>(1+g)*Math.exp(iv*gauss(r)-iv*iv/2)-1);else{saleShock=Math.exp(iv*gauss(r)-iv*iv/2);saleShock2=Math.exp(iv*gauss(r)-iv*iv/2)}}
    let m=p.rate*100;const mbar=(p.rateLR||p.rate)*100,K=Math.min(1,Math.max(0,RATE_AR.kappa));
    path.mkt=idx.map(j=>{const gi=i0+j,dPi=INF[gi]-(gi>0?INF[gi-1]:INF[gi]);const e=RATE_AR.res[gi]!=null?RATE_AR.res[gi]:RATE_AR.sigma*gauss(r);
      m=Math.min(20,Math.max(2,m+K*(mbar-m)+RATE_AR.gamma*dPi+e));return m/100});
    const kk=1/(MAINT_CV*MAINT_CV),maintShock=idx.map(()=>gammaS(kk,r)/kk);
    const o=simulate(p,path,{N,saleShock,saleShock2,maintShock});
    res.buy.push(o.buy.map((v,k)=>adj(v,o.cpi[k])));res.inv.push(o.inv.map((v,k)=>adj(v,o.cpi[k])));res.cash.push(o.cash.map((v,k)=>adj(v,o.cpi[k])));
    const h=Math.min(p.N,N);let lh=0,lp=0;for(let y=0;y<h;y++){lh+=Math.log(1+path.gh[y]);lp+=Math.log(Math.max(0.01,1+p.ws*path.rs[y]+p.wb*path.rb[y]+(1-p.ws-p.wb)*path.rc[y]-p.fee))}
    res.gH.push((Math.exp(lh/h)-1)*100);res.gP.push((Math.exp(lp/h)-1)*100);
    let mb=Infinity,mr=Infinity;for(let y=1;y<=Math.min(5,N);y++){const bud=o.budget[y]||1;mb=Math.min(mb,o.lqB[y]/bud);mr=Math.min(mr,o.lqR[y]/bud)}
    res.lqMinB.push(mb);res.lqMinR.push(mr);res.refis.push(o.refis);res.rates.push(path.mkt);
    let T=p.N,forced=false;if(p.hz>0){for(let t=1;t<p.N;t++){const bad=path.gh[t-1]<0||path.rs[t-1]<-0.15,hz=Math.min(1,p.hz*(bad?p.stressMult:1));if(r()<hz){T=t;forced=bad;break}}}
    res.T.push(T);res.forced.push(forced);res.HT.push(adj(o.H[T]*(1-p.sell),o.cpi[T]));
    if(p.rentalOn)res.rental.push(o.rental.map((v,k)=>adj(v,o.cpi[k])));
  }
  const pWin=[],pWinC=[];for(let y=0;y<=N;y++){let a=0,b=0;for(let s=0;s<n;s++){if(res.buy[s][y]>res.inv[s][y])a++;if(res.buy[s][y]>res.cash[s][y])b++}pWin.push(a/n);pWinC.push(b/n)}
  let mv=0,nf=0;for(let s=0;s<n;s++){const T=res.T[s],disc=res.forced[s]?p.forcedDisc*res.HT[s]:0;if(res.forced[s])nf++;if(res.buy[s][T]-disc>res.inv[s][T])mv++}
  const pWinR=p.rentalOn?[...Array(N+1)].map((_,y)=>res.rental.filter((a,s)=>a[y]>res.inv[s][y]).length/n):null;
  return {n,N,res,pWin,pWinC,pWinR,pMove:mv/n,pForced:nf/n};
}
