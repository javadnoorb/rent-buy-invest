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
const SER={gh:HOME,gr:RENTG,rs:STK,rb:BOND,rc:BILL,inf:INF};
function geo(a,from,to){const i0=from-Y0,i1=(to||2025)-Y0;let lp=0,n=0;for(let i=i0;i<=i1;i++){if(a[i]==null)continue;lp+=Math.log(1+a[i]/100);n++}return (Math.exp(lp/n)-1)*100}
const r2=x=>Math.round(x*100)/100;

/* ===================== Metro home-price series ===================== */
function metroAnnual(m){ // returns array aligned with YEARS of % change, null where missing
  if(!m||!m.hpi||!m.hpi.values)return null;const v=m.hpi.values;
  return YEARS.map(y=>(v[y]!=null&&v[y-1]!=null)?(v[y]/v[y-1]-1)*100:null)}
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
function simulate(p,path,opt){
  opt=opt||{};const N=opt.N||p.N,detail=!!opt.detail,M=!!path.monthly;
  let rate=opt.rate!=null?opt.rate:p.rate;
  const L=p.P*(1-p.dp),nTot=p.term*12;let i=rate/12,Mp=pmt(L,i,nTot);
  const f750=L>0?Math.min(1,750000/L):1,excl=p.filing==='mfj'?500000:250000,std0=p.filing==='mfj'?32200:16100;
  const tx=p.taxOn,taxable=tx&&p.acct==='taxable';
  const ltcgE=p.ltcg+p.niit+p.stRate,muE=p.mu+p.niit+p.stRate,share=p.investShare,mShock=opt.maintShock;
  let H=p.P,A=p.P,bal=L,pB=0,bB=0,pR=p.P*(p.dp+p.close)+p.moveIn,bR=pR,imp=0,pC=pR,cpi=1,rent=p.rent0,infIdx=1,refis=0,lastRefi=-999,mE=0;
  const liq=(V,b)=>taxable?V-ltcgE*Math.max(0,V-b):V;
  const shock=opt.saleShock||1;
  const homeNet=(H,bal,yrs)=>{const sale=H*(yrs>0?shock:1)*(1-p.sell);const gain=sale-p.P*(1+p.close)-imp-(yrs>=2?excl:0);return sale-bal-(tx?ltcgE*Math.max(0,gain):0)};
  const o={buy:[],inv:[],cash:[],cpi:[],lqB:[],lqR:[],lqC:[],budget:[],refiAt:[],rateAt:[]};
  if(detail){o.eq=[];o.pB=[];o.H=[];o.bal=[];o.flow=[];o.unrec=[]}
  let budgetY=0;
  const snap=y=>{const lb=liq(pB,bB),lr=liq(pR,bR);o.buy.push(homeNet(H,bal,y)+lb);o.inv.push(lr);o.cash.push(pC);o.cpi.push(cpi);
    o.lqB.push(lb);o.lqR.push(lr);o.lqC.push(pC);o.budget.push(budgetY);o.rateAt.push(rate);
    if(detail){o.eq.push(homeNet(H,bal,y));o.pB.push(lb);o.H.push(H);o.bal.push(bal)}};
  snap(0);
  let ghPrev=0;
  const lev=p.lev,ws=p.ws,wb=p.wb,wc=Math.max(0,1-p.ws-p.wb);
  for(let y=0;y<N;y++){
    // year-level quantities
    let ghY,grY,infY;
    if(M){ghY=1;grY=1;infY=1;for(let m=0;m<12;m++){ghY*=1+path.gh[y*12+m];grY*=1+path.gr[y*12+m];infY*=1+path.inf[y*12+m]}ghY--;grY--;infY--}
    else{ghY=path.gh[y];grY=path.gr[y];infY=path.inf[y]}
    if(y>0){A=p.ptaxCap>0?Math.min(H,A*(1+Math.min(ghPrev,p.ptaxCap))):H}
    const Hy=H,insM=(p.ins+p.floodIns)*infIdx/12,hoa=p.hoa*infIdx,ptY=p.ptax*A;
    const maintY=p.maint*Hy*(mShock?mShock[y]:1),utilM=p.utilDiff*infIdx;
    const rentM=rent+p.rins*infIdx/12+p.rMove*(p.rMoveCost*infIdx+p.broker*rent)/12;
    let intY=0,prinY=0,pmiY=0,benefit=0,refiY=0,ownSum=0;const eqStart=H-bal;let Rsum=0;
    for(let m=0;m<12;m++){
      // monthly factors
      let fS,fB,fC,fH,fI;
      if(M){const k=y*12+m;fS=1+path.rs[k];fB=1+path.rb[k];fC=1+path.rc[k];fH=1+path.gh[k];fI=1+path.inf[k]}
      else{fS=Math.pow(1+path.rs[y],1/12);fB=Math.pow(1+path.rb[y],1/12);fC=Math.pow(1+path.rc[y],1/12);fH=Math.pow(1+path.gh[y],1/12);fI=Math.pow(1+path.inf[y],1/12)}
      // refinancing check
      let refiCost=0;
      if(p.refiOn&&path.mkt&&bal>1000){const checkNow=M?true:(m===0);
        if(checkNow&&(mE-lastRefi)>=12){const mr=M?path.mkt[y*12+m]:path.mkt[y];
          if(mr!=null&&rate-mr>=p.refiTh){refiCost=p.refiCost*bal;rate=mr;i=rate/12;Mp=pmt(bal,i,nTot-mE);lastRefi=mE;refis++;o.refiAt.push(y+m/12);refiY+=refiCost}}}
      const balPrev=bal;let pay=0;
      if(bal>0.005){const it=bal*i;const pr=Math.min(Mp-it,bal);pay=it+pr;bal-=pr;intY+=it;prinY+=pr}
      const pmi=(p.dp<0.2&&balPrev>0.78*p.P)?p.pmi*L/12:0;pmiY+=pmi;
      let own=pay+ptY/12+maintY/12+insM+hoa+utilM+pmi+refiCost;
      if(m===11&&tx){const std=std0*infIdx,cap=saltCapFor(y,p.income*infIdx);
        const dB=Math.max(std,Math.min(cap,p.stTax+ptY)+intY*f750+p.oth),dR=Math.max(std,Math.min(cap,p.stTax)+p.oth);
        benefit=p.mu*(dB-dR)+(p.stDed?p.stRate*(intY*f750+ptY):0);own-=benefit}
      ownSum+=own;
      // portfolio returns
      const g=ws*(fS-1)+wb*(fB-1)+wc*(fC-1);
      const ret=lev*g-(lev-1)*((fC-1)+p.spread/12)-p.fee/12;Rsum+=ret;
      let taxR=0,inc=0;
      if(taxable){inc=lev*(ws*p.dy/12+wb*(fB-1)+wc*(fC-1));taxR=lev*(ws*p.dy/12*ltcgE+(wb*(fB-1)+wc*(fC-1))*muE)}
      const grow=(V,b)=>{const V0=V;V=V0*(1+ret)-V0*taxR;if(taxable)b+=V0*(inc-taxR);if(V<0)V=0;return [V,b]};
      [pB,bB]=grow(pB,bB);[pR,bR]=grow(pR,bR);
      pC*=1+(fC-1)*(tx?1-muE:1);
      H*=fH;cpi*=fI;mE++;
      const d=own-rentM;
      if(d>0){const x=d*share;pR+=x;bR+=x;pC+=x}else{const x=-d*share;pB+=x;bB+=x}
    }
    budgetY=Math.max(ownSum/12,rentM);imp+=p.impShare*maintY;
    if(detail){
      o.flow.push({interest:intY/12,principal:prinY/12,ptax:ptY/12,ins:insM,maint:maintY/12,hoa,util:utilM,pmi:pmiY/12,refi:refiY/12,tax:-benefit/12,rent:rentM,own:ownSum/12,cpi});
      const opp=eqStart*Rsum;
      o.unrec.push({own:intY+ptY+maintY+insM*12+hoa*12+utilM*12+pmiY+refiY-benefit+opp,opp,rent:rentM*12,cpi});
    }
    ghPrev=ghY;
    rent*=1+grY;infIdx*=1+infY;
    snap(y+1);
  }
  o.refis=refis;return o;
}

/* ===================== Paths ===================== */
function marketRatePath(p,N){return [...Array(N)].map((_,y)=>p.rate+(p.rateLR-p.rate)*Math.min(1,y/Math.max(0.0001,p.glide)))}
function constPath(p,N){const a=k=>Array(N).fill(p[k]);return {gh:a('gh'),gr:a('gr'),rs:a('rs'),rb:a('rb'),rc:a('rc'),inf:a('inf'),mkt:marketRatePath(p,N)}}
