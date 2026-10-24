/* ===================== Analysis helpers ===================== */
function runConst(p,over,N){const q=Object.assign({},p,over||{});const n=N||q.N;return {q,o:simulate(q,constPath(q,n),{N:n})}}
function advAt(p,over){const {q,o}=runConst(p,over);return adj(o.buy[q.N]-o.inv[q.N],o.cpi[q.N])}
function bisect(f,lo,hi,it=40){let flo=f(lo),fhi=f(hi);if(!isFinite(flo)||!isFinite(fhi)||flo*fhi>0)return null;for(let k=0;k<it;k++){const m=(lo+hi)/2,fm=f(m);if(fm*flo>0){lo=m;flo=fm}else{hi=m}}return (lo+hi)/2}
/* Break-even: the first year from which buying stays ahead through year N (default: the end of the run). With a
   longer run, aheadSpell() also says whether renting moves back ahead later: {from, until} (until = null if never). */
function breakevenYear(o,N){const a=o.buy.map((b,k)=>b-o.inv[k]),n=Math.min(a.length-1,N||a.length-1);for(let k=1;k<=n;k++){if(a[k]>=0&&a.slice(k,n+1).every(v=>v>=0))return k}return null}
/* Monte Carlo: the years in which buying wins in at least half of the simulated futures, as a sentence */
function winSpellText(pWin,N){let from=null,until=null;for(let y=1;y<=N;y++){if(from==null&&pWin[y]>=0.5)from=y;else if(from!=null&&pWin[y]<0.5){until=y;break}}
  return from==null?`Buying doesn't win more often than not within ${N} years.`:until===from+1?`Buying wins more often than not only around year ${from}.`:`Buying wins more often than not from year ${from}`+(until?` through year ${until-1}; after that renting does.`:` on (through year ${N}).`)}
function aheadSpell(o){const a=o.buy.map((b,k)=>b-o.inv[k]);let from=null;for(let k=1;k<a.length;k++){if(from==null&&a[k]>=0)from=k;else if(from!=null&&a[k]<0)return {from,until:k}}return from==null?null:{from,until:null}}
function movingWeights(h,N){const w=[];for(let t=1;t<=N;t++)w.push(t<N?h*Math.pow(1-h,t-1):Math.pow(1-h,N-1));return w}
function expectedWithMoving(o,p){const w=movingWeights(p.hz,p.N);let s=0;for(let t=1;t<=p.N;t++)s+=w[t-1]*adj(o.buy[t]-o.inv[t],o.cpi[t]);return s}
/** @type {any[]} */const TORNADO=[['Home appreciation ±1 pt','gh',0.01],['Stock return ±2 pt','rs',0.02],['Rent growth ±1 pt','gr',0.01],['Mortgage rate ±1 pt','rate',0.01],
  ['Inflation ±1 pt','inf',0.01],['Rent ±10%','rent0',0.1,'rel'],['Price ±10%','P',0.1,'rel'],['Maintenance ±0.5 pt','maint',0.005],
  ['Property tax ±0.3 pt','ptax',0.003],['Selling costs ±2 pt','sell',0.02],['Down payment ±10 pt','dp',0.1],['Horizon ±3 yr','N',3],['Later market rate ±1 pt','rateLR',0.01]];
function tornado(p){const base=advAt(p,{});return {base,rows:TORNADO.map(([lab,k,d,rel])=>{const dd=rel?p[k]*d:d;let lo=p[k]-dd,hi=p[k]+dd;
  if(k==='N'){lo=Math.max(1,lo);hi=Math.min(30,hi)}if(k==='dp'){lo=Math.max(0,lo);hi=Math.min(1,hi)}
  const ov=v=>k==='rate'?{rate:v,rate30:v}:{[k]:v};
  return {lab,k,lo:advAt(p,ov(lo))-base,hi:advAt(p,ov(hi))-base}}).sort((a,b)=>Math.max(Math.abs(a.lo),Math.abs(a.hi))-Math.max(Math.abs(b.lo),Math.abs(b.hi)))}}

