/* ===================== Recipes: what each chart point is, as a trace ===================== */
/* Each chart trace carries meta:'<chart>:<series>' (or 'deco:…' for marks that are not results: reference markers,
   bands, labels). TRACE_RECIPES['<chart>:<series>'](pt) returns {title, v, node, at}: the plotted value, the trace
   node that computes it, and which field of the point holds the plotted value ('y' by default). tests/trace.js checks
   that every trace on every chart has a recipe and that v equals the plotted value at sampled points. */
let TRACE_BASE=null;
/* the trace of the run behind the Projection tab: the current settings, constant growth */
function traceBase(){const k=LAST_KEY+'|'+REAL;if(!TRACE_BASE||TRACE_BASE.k!==k)TRACE_BASE={k,T:traceRun(P,constPath(P,P.N),{kind:'const',label:'your settings, the same growth every year'})};return TRACE_BASE.T}
const yr=pt=>Math.round(+pt.x);
/* a yearly flow shown per month (the Monthly outlay chart): the year's total ÷ 12, at mid-year prices */
function flowNode(T,k,y){const lab={interest:'Mortgage interest',principal:'Principal',ptax:'Property tax',ins:'Insurance',maint:'Maintenance',hoa:'HOA',util:'Extra utilities',pmi:'PMI',refi:'Refinance cost',tax:'Tax savings',hh:'House-hack income, after tax',rent:'Rent'}[k]+`, per month in year ${y+1}`;
  const Yv=T.Yr(y),f=T.o.flow[y],per=(nd,s)=>T.fn(lab,f[k],'$','perMo',()=>[nd],([a])=>(s||1)*a/12);let n;
  if(k==='interest')n=per(T.intY(y));
  else if(k==='principal')n=T.fn(lab,f[k],'$','perMo',()=>[T.prinY(y),T.preY(y)],([a,b])=>(a+b)/12);
  else if(k==='ptax')n=per(T.ptaxY(y));else if(k==='maint')n=per(T.maintY(y));else if(k==='ins')n=T.fn(lab,f[k],'$',null,()=>[T.insMo(y)],([a])=>a,null,{sym:'\\tfrac{1}{12}\\text{Ins}_y'});
  else if(k==='hoa')n=T.fn(lab,f[k],'$',null,()=>[T.byInf('hoa','HOA',y,Yv.hoa)],([a])=>a,null,{sym:'\\text{HOA}_y'});else if(k==='util')n=T.fn(lab,f[k],'$',null,()=>[T.byInf('utilDiff','Extra utilities',y,Yv.utilM)],([a])=>a,null,{sym:'U_y'});
  else if(k==='pmi')n=per(T.pmiY(y));
  else if(k==='refi')n=T.fn(lab,f[k],'$','perMo',()=>[T.sum(`Refinance costs in year ${y+1}`,T.months(m=>T.Mo(y,m).refi||0).reduce((a,b)=>a+b,0),'$','sum12',()=>T.months(m=>[1,T.con(`Refinance cost, month ${m+1}`,T.Mo(y,m).refi||0,'$',{pk:['refiCost']})]))],([a])=>a/12);
  else if(k==='tax')n=per(T.taxSave(y),-1);
  else if(k==='hh')n=T.fn(lab,f[k],'$',null,()=>[T.hhY(y),p_hh(T,y)],([a,b])=>-(a-b/12),null,{sym:'-(R^{hh,net}_y - \\tfrac{1}{12}T^{hh}_y)'});
  else if(k==='rent')n=T.fn(lab,f[k],'$',null,()=>[T.rentY(y)],([a])=>a,null,{sym:'C^{rent}_y'});
  return T.real(n,T.cpiMid(y),lab+", today's dollars")}
const p_hh=(T,y)=>T.p.taxOn&&T.p.hhRent>0?T.hhTaxM(y):T.con('Tax on house-hack rent',0,'$',{sym:'T^{hh}_y'});
/* the year's unrecoverable costs (Unrecoverable cost chart): cash costs, and the return the owner's equity forgoes */
function unrecNode(T,part,y){const u=T.o.unrec[y],Yv=T.Yr(y),lab=part==='rent'?`Rent paid in year ${y+1}`:part==='opp'?`Return forgone on the owner's equity, year ${y+1}`:`Owner's cash costs, year ${y+1}`;let n;
  if(part==='rent')n=T.fn(lab,u.rent,'$',null,()=>[T.rentY(y)],([a])=>a*12,null,{sym:'12\\,C^{rent}_y'});
  else if(part==='opp')n=T.fn(lab,u.opp,'$','oppCost',()=>[T.fn(`Home equity at the start of year ${y+1}`,Yv.owned?Yv.H-Yv.bal:0,'$',null,()=>[T.H(y),T.con('Mortgage balance at the start of the year',Yv.bal,'$')],([h,b])=>Yv.owned?h-b:0),
    T.sum(`Sum of the 12 monthly portfolio returns, year ${y+1}`,T.months(m=>T.Mo(y,m).ret).reduce((a,b)=>a+b,0),'%','sum12',()=>T.months(m=>[1,T.con(`Portfolio return, month ${m+1}`,T.Mo(y,m).ret,'%',{sym:'\\rho_t'})]),{sym:'\\textstyle\\sum_{t \\in y}\\rho_t'})],([e,r])=>e*r);
  else n=!Yv.owned?T.fn(lab,u.own,'$',null,()=>[T.rentY(y)],([a])=>a*12,null,{sym:'12\\,C^{rent}_y'}):T.sum(lab,u.own-u.opp,'$','unrec',()=>[[1,T.intY(y)],[1,T.ptaxY(y)],[1,T.maintY(y)],[12,T.insMo(y)],[12,T.byInf('hoa','HOA',y,Yv.hoa)],[12,T.byInf('utilDiff','Extra utilities',y,Yv.utilM)],[1,T.pmiY(y)],
    [1,T.con('Refinance costs',T.months(m=>T.Mo(y,m).refi||0).reduce((a,b)=>a+b,0),'$',{pk:['refiCost'],sym:'\\text{Refi}_y'})],[-1,T.taxSave(y)],[-12,T.hhY(y)],[1,p_hh(T,y)]]);
  return T.real(n,T.cpi(y+1),lab+", today's dollars")}
function liqNode(T,who,t){const bud=t?T.budget(t-1):T.fn('Monthly budget (year 1, used at the start)',T.o.budget[1]||1,'$',null,()=>[T.budget(0)],([b])=>b,null,{sym:'\\text{budget}_1'});
  const a=who==='R'?T.liq('R',t):who==='H'?T.sum(`Buyer's liquid assets plus the home-equity line ${t?`after ${nY(t)}`:'at the start'}`,T.o.lqB[t]+T.o.heloc[t],'$','liqLine',()=>[[1,T.liq('B',t)],[1,T.helocN(t)]]):T.liq('B',t);
  return T.fn(`${who==='R'?'Renter':'Buyer'}'s liquid assets in months of budget, ${t?`after ${nY(t)}`:'at the start'}`,a.v/bud.v,'mo','months',()=>[a,bud],([x,b])=>x/b,null,{sym:who==='R'?'n^{liq}_{rent,t}':who==='H'?'n^{liq+line}_{buy,t}':'n^{liq}_{buy,t}'})}
const TRACE_RECIPES={
  'nw:buy':pt=>{const T=traceBase(),t=yr(pt);return {title:`Buy, year ${t}`,node:T.real(T.nwBuy(t),T.cpi(t))}},
  'nw:inv':pt=>{const T=traceBase(),t=yr(pt);return {title:`Rent + invest, year ${t}`,node:T.real(T.nwInv(t),T.cpi(t))}},
  'nw:cash':pt=>{const T=traceBase(),t=yr(pt);return {title:`Rent + T-bills, year ${t}`,node:T.real(T.nwCash(t),T.cpi(t))}},
  'nw:rental':pt=>{const T=traceBase(),t=yr(pt);return {title:`Rent + rental property, year ${t}`,node:T.real(T.nwRental(t),T.cpi(t))}},
  'comp:eq':pt=>{const T=traceBase(),t=yr(pt);return {title:`Net home equity, year ${t}`,node:T.real(T.homeNet(t),T.cpi(t))}},
  'comp:pB':pt=>{const T=traceBase(),t=yr(pt);return {title:`Buyer's portfolio, year ${t}`,node:T.real(T.liq('B',t),T.cpi(t))}},
  'comp:H':pt=>{const T=traceBase(),t=yr(pt);return {title:`Home value, year ${t}`,node:T.real(T.H(t),T.cpi(t))}},
  'comp:bal':pt=>{const T=traceBase(),t=yr(pt);return {title:`Mortgage balance, year ${t}`,node:T.real(T.bal(t),T.cpi(t))}},
  'liq:B':pt=>({title:`Buyer's cushion, year ${yr(pt)}`,node:liqNode(traceBase(),'B',yr(pt)),at:'customdata'}),
  'liq:R':pt=>({title:`Renter's cushion, year ${yr(pt)}`,node:liqNode(traceBase(),'R',yr(pt)),at:'customdata'}),
  'liq:H':pt=>({title:`Buyer + home-equity line, year ${yr(pt)}`,node:liqNode(traceBase(),'H',yr(pt)),at:'customdata'}),
  'unrec:cash':pt=>({title:`Owner's cash costs, year ${yr(pt)}`,node:unrecNode(traceBase(),'cash',yr(pt)-1)}),
  'unrec:opp':pt=>({title:`Owner's forgone return, year ${yr(pt)}`,node:unrecNode(traceBase(),'opp',yr(pt)-1)}),
  'unrec:rent':pt=>({title:`Renter's rent, year ${yr(pt)}`,node:unrecNode(traceBase(),'rent',yr(pt)-1)}),
  'gap:row':pt=>({title:'Where the gap comes from',node:gapNode(traceBase(),pt.pointNumber),at:'customdata1'})};
['interest','principal','ptax','ins','maint','hoa','util','pmi','refi','tax','hh','rent'].forEach(k=>TRACE_RECIPES['flow:'+k]=pt=>({title:`Monthly outlay, year ${yr(pt)}`,node:flowNode(traceBase(),k,yr(pt)-1)}));
/* Where the gap comes from: each part as the sum of its yearly flows (each at mid-year prices), the home and loan at
   year N, and the investment taxes; the renter's extra returns are what remains, as in gapParts(). */
function gapNode(T,i){const p=T.p,N=p.N,{gap,parts}=gapParts(p,T.o),lab=i<parts.length?parts[i][0]:'Buy minus rent',v=i<parts.length?parts[i][1]:gap;
  const yrs=[...Array(N)].map((_,y)=>y),cN=T.cpi(N),rl=(nd,c)=>T.real(nd,c);
  const yearly=(f,s,l)=>{const ks=yrs.map(y=>rl(f(y),T.cpiMid(y)));return T.sum(l||lab,ks.reduce((a,k)=>a+s*k.v,0),'$','gapSum',()=>ks.map(k=>[s,k]))};
  const dGap=()=>T.sum('Buy minus rent',gap,'$','gapTotal',()=>[[1,T.real(T.nwBuy(N),cN)],[-1,T.real(T.nwInv(N),cN)]]);
  switch(lab){
    case 'Buy minus rent':return dGap();
    case 'Home price change':return T.sum(lab,v,'$','gapHome',()=>[[1,rl(T.H(N),cN)],[-1,T.set('P',p.P,'$')]]);
    case 'Selling costs':return T.fn(lab,v,'$','gapSell',()=>[rl(T.H(N),cN),T.sellRate(N)],([h,s])=>-h*s);
    case 'Tax on the home sale':return T.fn(lab,v,'$',null,()=>[rl(T.homeTax(N),cN)],([a])=>-a);
    case 'Buying costs':return T.sum(lab,v,'$','gapBuy',()=>[[-1,T.fn('Closing costs',p.P*p.close,'$',null,()=>[T.set('P',p.P,'$'),T.closeRate()],([a,c])=>a*c,null,{sym:'cP'})],[-1,T.set('moveIn',p.moveIn||0,'$')],[-1,T.ptsCost()]]);
    case 'Mortgage interest':return yearly(y=>T.intY(y),-1);
    case 'Property tax':return yearly(y=>T.ptaxY(y),-1);
    case 'Upkeep':return yearly(y=>T.maintY(y),-1);
    case 'Insurance, HOA, PMI, utilities':return yearly(y=>{const Yv=T.Yr(y);return T.sum(`Insurance, HOA, PMI, utilities and refinancing, year ${y+1}`,(Yv.insM+Yv.hoa+Yv.utilM)*12+T.o.flow[y].pmi*12+T.o.flow[y].refi*12,'$','insEtc',()=>[[12,T.insMo(y)],[12,T.byInf('hoa','HOA',y,Yv.hoa)],[12,T.byInf('utilDiff','Extra utilities',y,Yv.utilM)],[1,T.pmiY(y)],[1,T.con('Refinance costs',T.o.flow[y].refi*12,'$',{pk:['refiCost'],sym:'\\text{Refi}_y'})]])},-1);
    case 'Tax savings from owning':return yearly(y=>T.taxSave(y),1);
    case 'House-hack income':return yearly(y=>T.fn(`House-hack income after tax, year ${y+1}`,-T.o.flow[y].hh*12,'$',null,()=>[T.hhY(y),p_hh(T,y)],([a,b])=>a*12-b,null,{sym:'12R^{hh,net}_y - T^{hh}_y'}),1);
    case 'Rent the renter pays':return yearly(y=>T.fn(`Rent, year ${y+1}`,T.o.flow[y].rent*12,'$',null,()=>[T.rentY(y)],([a])=>a*12,null,{sym:'12\\,C^{rent}_y'}),1);
    case 'FHA upfront premium':return T.sum(lab,v,'$',null,()=>[[1,T.loanBase()],[-1,T.loanAmt()]]);
    case 'Inflation shrinking the loan':return T.sum(lab,v,'$','gapLoan',()=>[[1,T.loanAmt()],[-1,yearly(y=>T.fn(`Principal paid, year ${y+1}`,T.o.flow[y].principal*12,'$',null,()=>[T.prinY(y),T.preY(y)],([a,b])=>a+b,null,{sym:'\\text{Prin}_y + X_y'}),1,'Principal repaid, each year at mid-year prices')],[-1,rl(T.bal(N),cN)]]);
    case 'Tax on investments (renter − buyer)':return T.sum(lab,v,'$','gapInvTax',()=>[[1,yearly(y=>T.sum(`Renter's minus buyer's investment taxes, year ${y+1}`,T.o.tax[y].invR-T.o.tax[y].invB,'$',null,()=>[[1,T.taxY('R',y)],[-1,T.taxY('B',y)]],{sym:'\\text{tax}^{rent}_y - \\text{tax}^{buy}_y'}),1,'Yearly taxes on dividends and interest')],
      [1,T.fn(`Tax on selling the portfolios at year ${N} (renter − buyer)`,T.real(T.con('',T.o.liqTax[N].r-T.o.liqTax[N].b,'$'),cN).v,'$',null,()=>[rl(T.V('R',N),cN),rl(T.liq('R',N),cN),rl(T.V('B',N),cN),rl(T.liq('B',N),cN)],([vr,lr,vb,lb])=>(vr-lr)-(vb-lb),null,{sym:'T^{sell}_{rent} - T^{sell}_{buy}'})]]);
    default:{const others=parts.filter(x=>x[0]!==lab),known=others.reduce((a,x)=>a+x[1],0);
      return T.fn(lab,v,'$','gapRest',()=>[dGap(),T.con('All the other parts above, added up',known,'$')],([g,k])=>g-k,null,{note:'what the renter\'s portfolio earned beyond the buyer\'s, before tax: what is left once every other part is counted'})}}}
/* ---- runs with some settings changed (Sensitivity, Optimizer): traced on demand and kept while the settings stay ---- */
const TRACE_ALT=new Map();
function traceAlt(over,N){const k=LAST_KEY+'|'+REAL+'|'+JSON.stringify(over)+'|'+N;let T=TRACE_ALT.get(k);
  if(!T){if(TRACE_ALT.size>80)TRACE_ALT.clear();const q=Object.assign({},P,over),n=N||q.N;T=traceRun(q,constPath(q,n),{kind:'const',over},{N:n});TRACE_ALT.set(k,T)}return T}
const overText=over=>{const e=Object.entries(over).filter(([k])=>!(k==='sellBase'&&'sell' in over)),f=e.filter(([k])=>k!=='rate30'&&k!=='rateLR'&&k!=='term');return (f.length?f:e).map(([k,v])=>`${settingLabel(k==='N'?'N':k)} ${k==='N'||k==='P'||k==='rent0'?(k==='N'?v+' years':fmtFull(v)):fv(v,'%')}`).join(', ')};
/* buy minus rent after t years, in the chosen dollars */
function gapAt(T,t,lab,note){const c=T.cpi(t),b=T.real(T.nwBuy(t),c),r=T.real(T.nwInv(t),c);return T.sum(lab||`Buy minus rent after ${nY(t)}`,b.v-r.v,'$','gapTotal',()=>[[1,b],[-1,r]],note?{note}:undefined)}
Object.assign(TRACE_RECIPES,{
  'tor:lo':pt=>torRecipe(pt,'lo'),'tor:hi':pt=>torRecipe(pt,'hi'),
  'heat:z':pt=>{const p=P,g=+pt.x,r=+pt.y,wc=1-p.ws-p.wb,rs=p.ws>0?(r/100-p.wb*p.rb-wc*p.rc)/p.ws:p.rs,over={gh:g/100,rs},T=traceAlt(over);
    return {title:`Home ${g}%/yr, portfolio ${r}%/yr`,T,at:'z',node:gapAt(T,p.N,`Buy minus rent at year ${p.N}`,`run with home appreciation ${pct(g/100)} and the S&P 500 return set to ${pct(rs,2)}, so the portfolio mix returns ${pct(r/100)} before fees`)}},
  'ptr:line':pt=>{const m=pt.customdata,T=traceAlt({rent0:P.rent0*m},30),t=yr(pt);return {title:`Rent ${fmtFull(P.rent0*m)}, year ${t}`,T,node:gapAt(T,t,`Buy minus rent after ${nY(t)}, rent ${fmtFull(P.rent0*m)}/mo`)}},
  'opt:z':pt=>{const T=traceAlt(optOver(+pt.x),30),h=Math.round(+pt.y);return {title:`${pt.x}% down, ${nY(h)}`,T,at:'z',node:gapAt(T,h,`Buy minus rent after ${nY(h)}, ${pt.x}% down`)}},
  'opt:best':pt=>{const h=Math.round(+pt.y),DP=[0,3.5,5,10,15,20,25,30,40,50,60,80,100],kids=DP.map(d=>{const g=gapAt(traceAlt(optOver(d),30),h,`${d}% down`);return traceBase().fn(g.label,g.v,'$',null,()=>[g],([x])=>x,null,{sym:`\\text{gap}_h(${d}\\%)`})}),bi=kids.reduce((b,k,i)=>k.v>kids[b].v?i:b,0);
    return {title:`Best down payment, ${nY(h)}`,at:'xnum',node:traceBase().fn(`Down payment with the largest buy − rent after ${nY(h)}`,DP[bi],'n','argmax',()=>kids,a=>DP[a.reduce((b,v,i)=>v>a[b]?i:b,0)],null,{note:`each down payment is a separate run with a ${OPT_TERM}-year loan`})}}});
const optOver=dp=>({term:OPT_TERM,rate:OPT_TERM===15?P.rate15:P.rate30,dp:dp/100});
function torRecipe(pt,side){const {rows}=tornado(P),row=rows[pt.pointNumber],ov=torOver(P,row.row)[side],T=traceAlt(ov),B=traceBase(),N=T.p.N;
  return {title:`${row.lab}: ${side==='lo'?'lower':'higher'}`,T,at:'x',node:B.sum(`Change in buy − rent at year ${P.N}: ${overText(ov)}`,gapAt(T,N).v-gapAt(B,P.N).v,'$','torDelta',()=>[[1,Object.assign(gapAt(T,N,`Buy minus rent with ${overText(ov)}`),{sym:'\\text{gap}^{changed}_N'})],[-1,gapAt(B,P.N,'Buy minus rent at your settings')]])}}
/* ---- Backtest: each purchase is its own run on the historical path, traced on demand ---- */
function histCtx(){const useNow=document.getElementById('h-rate').value==='now',useMetro=document.getElementById('h-home').value==='metro',mode=document.getElementById('h-mode').value==='monthly'&&MONTHLY?'monthly':'annual',m=curMetro();return {useNow,useMetro,mode,m}}
function traceHist(run,full){const c=histCtx(),p=P,q=histP(p,run.s),key=`h|${LAST_KEY}|${HIST_RP}|${c.mode}|${c.useNow}|${c.useMetro}|${VOLADJ}|${run.lab}|${full?1:0}`;let T=TRACE_ALT.get(key);if(T)return T;
  const over=HIST_RP==='hist'?{rent0:q.rent0}:{},metro=c.useMetro&&c.m&&c.m.slug!=='us',names=metro?{gh:`Home price growth (${c.m.name} where available, else U.S.)`,gr:`Rent growth (${c.m.name} where available, else U.S.)`}:null;
  const rateInfo=c.useNow?{rateLabel:'Mortgage rate (your rate today, by your choice)'}:{rateLabel:`Average mortgage rate in ${run.lab}`,rateSrc:['fredMort']};
  let path,info,N;
  if(c.mode==='annual'){N=full?LAST_Y-run.s+1:run.N;path=histPathAnnual(run.s,N,homeSeries(c.useMetro),rentSeries(c.useMetro));info=Object.assign({kind:'hist',y0:run.s,over,names,src:metro?{gh:['fhfa'],gr:['fredRent']}:null},rateInfo)}
  else{const i0=MONTHLY.dates.indexOf(run.lab);N=full?Math.floor((MONTHLY.gh.length-i0)/12):run.N;path=histPathMonthly(i0,N);info=Object.assign({kind:'hist',y0:Math.floor(run.s),dates:MONTHLY.dates.slice(i0,i0+N*12),over},rateInfo)}
  T=traceRun(q,path,info,{N,rate:run.rate});if(TRACE_ALT.size>80)TRACE_ALT.clear();TRACE_ALT.set(key,T);return T}
const histRun=lab=>HIST_RUNS&&HIST_RUNS.runs.find(q=>q.lab===lab);
/* buy minus the renter, as a share of the purchase price, after inflation (the Backtest's measure) */
function histAdv(T,k){const c=T.cpi(k),b=T.defl(T.nwBuy(k),c),r=T.defl(HIST_CMP==='cash'?T.nwCash(k):T.nwInv(k),c);
  return T.fn(`Buy − (${HIST_CMP==='cash'?'rent + T-bills':'rent + invest'}) after ${nY(k)}, % of the purchase price`,(b.v-r.v)/T.p.P*100,'n','advPct',()=>[b,r,T.set('P',T.p.P,'$')],([x,y,P0])=>(x-y)/P0*100)}
Object.assign(TRACE_RECIPES,{
  'hist:line':(pt,el)=>{const nm=el.data[pt.curveNumber].name.replace(/^Bought (.*) \(selected\)$/,'$1'),run=histRun(nm),k=yr(pt),T=traceHist(run);return {title:`Bought ${run.lab}, after ${nY(k)}`,T,node:histAdv(T,k)}},
  'hist:z':pt=>{const [i,j]=pt.pointNumber,run=HIST_RUNS.runs[j],h=i+1,T=traceHist(run);return {title:`Bought ${run.lab}, after ${nY(h)}`,T,at:'z',node:histAdv(T,h)}},
  'hist:median':pt=>{const h=yr(pt),rs=HIST_RUNS.runs.filter(r=>r.adv.length>h),kids=rs.map(r=>histAdv(traceHist(r),h)),B=traceBase(),med=a=>{const v=a.slice().sort((x,y)=>x-y);return v[Math.floor(v.length/2)]};
    return {title:`Median across purchases, after ${nY(h)}`,node:B.fn(`Median buy − rent after ${nY(h)}, % of the price, over ${rs.length} purchases`,med(kids.map(k=>k.v)),'n','median',()=>kids,med)}},
  'hdet:buy':pt=>hdetRecipe(pt,'buy'),'hdet:inv':pt=>hdetRecipe(pt,'inv'),'hdet:cash':pt=>hdetRecipe(pt,'cash'),
  'hdet:rate':pt=>{const run=histSelRun(),T=traceHist(run,true),k=Math.round(+pt.x)-Math.floor(run.s),r=T.rateEnd(k);
    return {title:`Loan rate, ${pt.x}`,T,node:T.fn(`Loan rate ${k?`after ${nY(k)}`:'at purchase'} (percent)`,r.v*100,'n','pct',()=>[r],([a])=>a*100)}}});
function histSelRun(){const v=document.getElementById('h-year').value,c=histCtx();return c.mode==='annual'?histRun(v):histRun(v+'-01')}
function hdetRecipe(pt,w){const run=histSelRun(),T=traceHist(run,true),k=Math.round(+pt.x)-Math.floor(run.s),nd=w==='buy'?T.nwBuy(k):w==='inv'?T.nwInv(k):T.nwCash(k);
  return {title:`Bought ${run.lab}, ${pt.x}`,T,node:T.defl(nd,T.cpi(k))}}
/* ---- Monte Carlo: the simulation is rerun once here with every path's inputs kept, so any path can be traced ---- */
let MC_PATHS=null;
function mcPaths(){if(!MC)return null;if(MC_PATHS&&MC_PATHS.key===MC.key&&MC_PATHS.n===MC.n)return MC_PATHS;const c=mcControls();
  const cfg={n:MC.n,bl:c.bl,from:c.from,rc:c.rc,home:homeSeries(true),rent:rentSeries(true),real:REAL,keepAll:true};
  return MC_PATHS={key:MC.key,n:MC.n,cfg,r:mcCore(P,cfg).res,T:new Map()}}
function mcTrace(s){const K=mcPaths(),k=K.r.paths[s];let T=K.T.get(s);if(T)return T;const m=curMetro(),metro=m&&m.slug!=='us'&&(m.hpi||m.rentG);
  T=traceRun(P,k.path,{kind:'mc',idx:k.idx,i0:K.r.i0,SH:K.r.SH,raw:K.r.src,ghBase:k.ghBase,names:metro?{gh:`Home price growth (${m.name} where available, else U.S.)`,gr:`Rent growth (${m.name} where available, else U.S.)`}:null},{N:30,saleShock:k.saleShock,saleShock2:k.saleShock2,maintShock:k.maintShock});
  K.T.set(s,T);return T}
const mcVal=(w,s,y)=>{const T=mcTrace(s),nd=w==='buy'?T.nwBuy(y):w==='inv'?T.nwInv(y):w==='cash'?T.nwCash(y):T.nwRental(y);return T.real(nd,T.cpi(y),`Path ${s+1}: ${{buy:'buy',inv:'rent + invest',cash:'rent + T-bills',rental:'rent + rental property'}[w]} after ${nY(y)}${REAL?", today's dollars":''}`)};
/* a quantile as Monte Carlo reports it: sorted values, interpolated between the two around position (n−1)·f; both
   neighbours are traced in full */
function mcQuant(lab,vals,f,nodeOf,u){const idx=vals.map((v,i)=>i).sort((a,b)=>vals[a]-vals[b]),pos=(vals.length-1)*f,lo=Math.floor(pos),hi=Math.min(lo+1,vals.length-1),fr=pos-lo,B=traceBase();
  const nm=(n,s)=>B.fn(n.label,n.v,u||'$',null,()=>[n],([x])=>x,null,{sym:s}),a=nm(nodeOf(idx[lo]),'x_{(\\lfloor k \\rfloor)}'),b=nm(nodeOf(idx[hi]),'x_{(\\lfloor k \\rfloor + 1)}');
  return B.fn(lab,q(vals,f),u||'$','quantile',()=>[a,b,B.con(`Position between them (${lo+1}th and ${hi+1}th of ${vals.length})`,fr,'x',{sec:'monte-carlo',sym:'k - \\lfloor k \\rfloor'})],([x,y,t])=>x+(y-x)*t,([x,y,t])=>`${fv(x,u||'$')} + (${fv(y,u||'$')} − ${fv(x,u||'$')}) × ${t.toFixed(3)}`,{note:`${Math.round(f*100)}th percentile of ${vals.length.toLocaleString('en-US')} simulated futures`})}
const mcMedianPath=vals=>{const idx=vals.map((v,i)=>i).sort((a,b)=>vals[a]-vals[b]);return idx[Math.floor((idx.length-1)/2)]};
Object.assign(TRACE_RECIPES,{
  'mc:buy':pt=>mcFan(pt,'buy'),'mc:inv':pt=>mcFan(pt,'inv'),'mc:cash':pt=>mcFan(pt,'cash'),'mc:rental':pt=>mcFan(pt,'rental'),
  'mc:pwin':pt=>mcShare(pt,'inv'),'mc:pwinc':pt=>mcShare(pt,'cash'),'mc:pwinr':pt=>mcShare(pt,'rental'),
  'mc:pmove':pt=>{const h=yr(pt),n=MC.n,B=traceBase(),c=Math.round(MC.pMove*n);
    return {title:`With moving risk, ${nY(h)}`,node:B.fn(`Share of futures where buying wins, counting early moves`,MC.pMove,'%','share',()=>[B.con(`Futures where buying is ahead when the household sells (at year ${h} or an earlier move, less any forced-sale discount)`,c,'n',{sec:'moving-risk',pk:['hz','stressMult','forcedDisc']}),B.con('Futures simulated',n,'n',{sec:'monte-carlo'})],([a,b])=>a/b)}},
  'mc:hist':(pt,el)=>{const h=Math.min(P.N,MC.N),d=MC.res.buy.map((b,s)=>b[h]-MC.res.inv[s][h]),cd=el.data[pt.curveNumber].customdata,ids=(pt.pointNumbers||[]).map(i=>cd[i]),B=traceBase(),vals=ids.map(s=>d[s]),s=ids.length?ids[mcMedianPath(vals)]:0;
    const ex=ids.length?{label:`The middle path in this bin (path ${s+1}), traced in full`,node:mcGap(s,h)}:null;
    return {title:`Paths in this bin, year ${h}`,examples:ex?[ex]:[],node:B.fn(`Futures whose buy − (rent + invest) at year ${h} falls in this bin`,ids.length,'n','count',()=>[B.con(`Futures from ${fmt(Math.min(...vals))} to ${fmt(Math.max(...vals))}`,ids.length,'n',{sec:'monte-carlo'})],([a])=>a)}},
  'mc:sc':pt=>{const s=pt.pointNumber,h=Math.min(P.N,MC.N),T=mcTrace(s);
    return {title:`Path ${s+1}`,T,examples:[{label:`Path ${s+1}: buy − (rent + invest) at year ${h}, traced in full`,node:mcGap(s,h)}],node:mcPortAnn(T,h,s)}},
  'mc:rate':pt=>{const k=yr(pt)-1,K=mcPaths(),vals=MC.res.rates.map(a=>a[k]*100);
    return {title:`Market rate, year ${k+1}`,node:mcQuant(`Median market mortgage rate in year ${k+1} (percent)`,vals,0.5,s=>traceBase().con(`Path ${s+1}: simulated market rate, year ${k+1}`,K.r.rates[s][k]*100,'n',{sec:'monte-carlo',pk:['rate','rateLR'],note:'pulled toward your expected later rate, moved by inflation changes and a historical shock'}),'n')}}});
function mcFan(pt,w){const y=yr(pt),arr=MC.res[w].map(a=>a[y]),s=mcMedianPath(arr);
  return {title:`${{buy:'Buy',inv:'Rent + invest',cash:'Rent + T-bills',rental:'Rent + rental'}[w]}, median, year ${y}`,T:mcTrace(s),node:mcQuant(`Median ${{buy:'buy',inv:'rent + invest',cash:'rent + T-bills',rental:'rent + rental'}[w]} net worth after ${nY(y)}`,arr,0.5,s2=>mcVal(w,s2,y))}}
function mcShare(pt,w){const y=yr(pt),n=MC.n,R=MC.res,B=traceBase(),c=R.buy.filter((a,s)=>(w==='rental'?R.rental[s][y]:a[y])>(w==='cash'?R.cash[s][y]:R.inv[s][y])).length;
  const vs=w==='cash'?'rent + T-bills':'rent + invest',d=R.buy.map((a,s)=>(w==='rental'?R.rental[s][y]:a[y])-(w==='cash'?R.cash[s][y]:R.inv[s][y])),s=mcMedianPath(d);
  return {title:`Chance ${w==='rental'?'the rental property':'buying'} wins, year ${y}`,examples:[{label:`The middle future (path ${s+1}), traced in full`,node:mcGap(s,y,w)}],
    node:B.fn(`Share of futures where ${w==='rental'?'the rental property':'buying'} beats ${vs} after ${nY(y)}`,w==='inv'?MC.pWin[y]:w==='cash'?MC.pWinC[y]:MC.pWinR[y],'%','share',()=>[B.con(`Futures where it is ahead after ${nY(y)}`,c,'n',{sec:'monte-carlo'}),B.con('Futures simulated',n,'n',{sec:'monte-carlo'})],([a,b])=>a/b)}}
function mcGap(s,y,w){const T=mcTrace(s),c=T.cpi(y),a=T.real(w==='rental'?T.nwRental(y):T.nwBuy(y),c),b=T.real(w==='cash'?T.nwCash(y):T.nwInv(y),c);
  return T.sum(`Path ${s+1}: ${w==='rental'?'rental property':'buy'} minus ${w==='cash'?'rent + T-bills':'rent + invest'} after ${nY(y)}`,a.v-b.v,'$','gapTotal',()=>[[1,a],[-1,b]])}
/* the portfolio's annualized return over h years on one path, as the scatter plots it (yearly, before tax) */
function mcPortAnn(T,h,s){const p=T.p,lv=p.lev!=null?p.lev:1,path=T.X.path,yrs=[...Array(h)].map((_,y)=>y);
  const ry=y=>{const g=p.ws*path.rs[y]+p.wb*path.rb[y]+(1-p.ws-p.wb)*path.rc[y];return T.fn(`Portfolio return, simulated year ${y+1}`,lv*g-(lv-1)*path.rc[y]-Math.max(0,lv-1)*(p.spread||0)-p.fee,'%','rhoYear',
    ()=>[T.set('ws',p.ws,'%'),T.pathY('rs',y),T.set('wb',p.wb,'%'),T.pathY('rb',y),T.pathY('rc',y),T.set('lev',lv,'x'),T.set('spread',p.spread||0,'%'),T.set('fee',p.fee,'%')],
    ([ws,rs,wb,rb,rc,l,sp,f])=>l*(ws*rs+wb*rb+(1-ws-wb)*rc)-(l-1)*rc-Math.max(0,l-1)*sp-f)};
  return T.fn(`Path ${s+1}: portfolio return, annualized over ${nY(h)} (percent)`,MC.res.gP[s],'n','annualize',()=>yrs.map(ry),a=>(Math.exp(a.reduce((x,r)=>x+Math.log(Math.max(0.01,1+r)),0)/h)-1)*100)}
/* ---- Locations, side by side and scenarios: each place or scenario is a run with its own settings ---- */
/* settings that differ from yours are marked "set for this point" in the panel */
const overOf=q=>{const o={};Object.keys(q).forEach(k=>{const v=q[k];if(v!==P[k]&&(typeof v!=='object'||v===null))o[k]=v});return o};
function traceFor(q,N,key){const k=`${key}|${LAST_KEY}|${REAL}|${N}`;let T=TRACE_ALT.get(k);if(!T){if(TRACE_ALT.size>80)TRACE_ALT.clear();T=traceRun(q,constPath(q,N),{kind:'const',over:overOf(q)},{N});TRACE_ALT.set(k,T)}return T}
const locT=slug=>{const m=METROS.find(x=>x.slug===slug),{q}=locParams(P,m);return {m,T:traceFor(q,P.N,'loc:'+slug+':'+LOC_MODE)}};
const scenOpts=()=>[{name:'Current inputs',raw:getRaw()}].concat(loadSc());
const scenT=i=>{const s=scenOpts()[i],p=parseP(s.raw);return {s,T:traceFor(p,30,'scen:'+JSON.stringify(s.raw))}};
Object.assign(TRACE_RECIPES,{
  'loc:line':pt=>{const {m,T}=locT(pt.customdata),t=yr(pt);return {title:`${m.name}, year ${t}`,T,node:gapAt(T,t,`${m.name}: buy minus rent after ${nY(t)}`)}},
  'loc:sc':(pt,el)=>{const slug=el.data[pt.curveNumber].ids[pt.pointNumber],{m,T}=locT(slug);return {title:m.name,T,node:gapAt(T,P.N,`${m.name}: buy minus rent at year ${P.N}`)}},
  'scen:gap':pt=>{const {s,T}=scenT(pt.customdata),t=yr(pt);return {title:`${s.name}, year ${t}`,T,node:gapAt(T,t,`${s.name}: buy minus rent after ${nY(t)}`)}},
  'scen:buy':pt=>{const {s,T}=scenT(pt.customdata),t=yr(pt);return {title:`${s.name}: buy, year ${t}`,T,node:T.real(T.nwBuy(t),T.cpi(t))}},
  'scen:inv':pt=>{const {s,T}=scenT(pt.customdata),t=yr(pt);return {title:`${s.name}: rent + invest, year ${t}`,T,node:T.real(T.nwInv(t),T.cpi(t))}}});
/* ---- Data tab: historical data only; each value is built from the yearly figures ---- */
const DSER={rs:[STK,'S&P 500 total return',['damo']],rb:[BOND,'10-year Treasury bond return',['damo']],rc:[BILL,'3-month T-bill return',['damo']],gh:[HOME,'U.S. home prices',['shiller','caseShiller','fhfa']],gr:[RENTG,'Rent (BLS rent CPI)',['fredRent']],inf:[INF,'CPI inflation',['fredCPI']]};
const dLeaf=(B,k,i)=>B.dat(`${DSER[k][1]}, ${Y0+i}`,DSER[k][0][i],'pp',DSER[k][2]);
function dataCum(k,i){const B=traceBase(),ks=[...Array(i)].map((_,j)=>j),lab=`Real value of $1 invested at the end of ${Y0-1}, ${Y0-1+i}`;if(!i)return B.con(lab,1,'$');
  const nom=B.fn(`Growth of $1 before inflation, ${Y0}–${Y0-1+i}`,ks.reduce((a,j)=>a*(1+DSER[k][0][j]/100),1),'x','compoundData',()=>ks.map(j=>dLeaf(B,k,j)),a=>a.reduce((s,r)=>s*(1+r/100),1));
  const pl=B.fn(`Price level ${Y0-1+i} ÷ ${Y0-1}`,CPIL[i]/CPIL[0],'x','cpiRatio',()=>[B.dat(`CPI index, end of ${Y0-1+i}`,CPIL[i],'n',['fredCPI']),B.dat(`CPI index, end of ${Y0-1}`,CPIL[0],'n',['fredCPI'])],([a,b])=>a/b);
  return B.fn(lab,nom.v/pl.v,'$','realOf1',()=>[nom,pl],([a,b])=>a/b)}
function dataRoll(k,i){const B=traceBase(),ks=[...Array(10)].map((_,j)=>i-9+j);
  return B.fn(`${DSER[k][1]}, real, annualized over ${Y0+i-9}–${Y0+i} (percent)`,(Math.exp(ks.reduce((a,j)=>a+Math.log((1+DSER[k][0][j]/100)/(1+INF[j]/100)),0)/10)-1)*100,'pp','roll10',
    ()=>ks.flatMap(j=>[dLeaf(B,k,j),dLeaf(B,'inf',j)]),a=>{let l=0;for(let j=0;j<a.length;j+=2)l+=Math.log((1+a[j]/100)/(1+a[j+1]/100));return (Math.exp(l/10)-1)*100})}
const DCORR={Home:'gh',Rent:'gr',Stocks:'rs',Bonds:'rb',Bills:'rc',CPI:'inf','Δ Mortgage':'dm'};
function dataCorr(a,b){const B=traceBase(),S=k=>k==='dm'?DM_OBS:SER[k],lf=(k,i)=>k==='dm'?B.dat(`Change in the 30-year mortgage rate, ${Y0+i}`,DM_OBS[i],'pp',['fredMort']):dLeaf(B,k,i);
  const A=S(DCORR[a]),Bs=S(DCORR[b]),ix=A.map((v,i)=>v!=null&&Bs[i]!=null?i:-1).filter(i=>i>=0);
  return B.fn(`Correlation of yearly ${a.toLowerCase()} and ${b.toLowerCase()} changes, ${Y0+ix[0]}–${Y0+ix.at(-1)}`,(()=>{const pr=ix.map(i=>[A[i],Bs[i]]);return pearson(pr)})(),'x','corr',
    ()=>ix.flatMap(i=>[lf(DCORR[a],i),lf(DCORR[b],i)]),v=>{const pr=[];for(let j=0;j<v.length;j+=2)pr.push([v[j],v[j+1]]);return pearson(pr)},()=>`correlation over ${ix.length} years`)}
function pearson(pr){const n=pr.length,ma=pr.reduce((s,v)=>s+v[0],0)/n,mb=pr.reduce((s,v)=>s+v[1],0)/n;let sab=0,sa=0,sb=0;pr.forEach(([u,v])=>{sab+=(u-ma)*(v-mb);sa+=(u-ma)**2;sb+=(v-mb)**2});return sab/Math.sqrt(sa*sb)}
function dataMetro(which,i){const B=traceBase(),m=curMetro(),ma=metroAnnual(m,true),ms=metroStart(m),yrs=YEARS.filter(y=>y>=ms).slice(0,i),a=which==='loc'?ma:HOME;
  const lf=y=>which==='loc'?B.dat(`${m.name} home prices (FHFA), ${y}`,ma[y-Y0],'pp',['fhfa']):dLeaf(B,'gh',y-Y0);
  return B.fn(`${which==='loc'?m.name:'National'} real home-price index, ${ms-1+i} (end of ${ms-1} = 100)`,yrs.reduce((v,y)=>v*(1+a[y-Y0]/100)/(1+INF[y-Y0]/100),100),'n','realIndex',
    ()=>yrs.flatMap(y=>[lf(y),dLeaf(B,'inf',y-Y0)]),v=>{let x=100;for(let j=0;j<v.length;j+=2)x*=(1+v[j]/100)/(1+v[j+1]/100);return x})}
['rs','rb','rc','gh','gr'].forEach(k=>{TRACE_RECIPES['data:cum:'+k]=pt=>({title:DSER[k][1],node:dataCum(k,Math.round(+pt.x)-Y0+1)});TRACE_RECIPES['data:roll:'+k]=pt=>({title:DSER[k][1],node:dataRoll(k,Math.round(+pt.x)-Y0)})});
Object.assign(TRACE_RECIPES,{
  'data:metro:loc':pt=>({title:'Home prices',node:dataMetro('loc',pt.pointNumber)}),'data:metro:us':pt=>({title:'Home prices',node:dataMetro('us',pt.pointNumber)}),
  'data:corr':pt=>({title:'Correlation',at:'z',node:dataCorr(pt.y,pt.x)}),
  'data:mort':pt=>{const B=traceBase(),y=Math.round(+pt.x);return {title:`Mortgage rate, ${y}`,node:B.dat(`30-year fixed mortgage rate, ${y} average`,MORT[y-MORT0],'pp',['fredMort'])}},
  'data:inf':pt=>{const B=traceBase(),y=Math.round(+pt.x);return {title:`Inflation, ${y}`,node:B.fn(`CPI inflation, ${y} (percent)`,INF[y-Y0],'pp','inflation',()=>[B.dat(`CPI index, end of ${y}`,CPIL[y-Y0+1],'n',['fredCPI']),B.dat(`CPI index, end of ${y-1}`,CPIL[y-Y0],'n',['fredCPI'])],([a,b])=>(a/b-1)*100)}},
  'data:realmort':pt=>{const B=traceBase(),y=Math.round(+pt.x);return {title:`Real mortgage rate, ${y}`,node:B.sum(`Real mortgage rate, ${y} (percent)`,MORT[y-MORT0]-INF[y-Y0],'pp','realRate',()=>[[1,B.dat(`30-year fixed mortgage rate, ${y} average`,MORT[y-MORT0],'pp',['fredMort'],{sym:'m_y'})],[-1,Object.assign(dLeaf(B,'inf',y-Y0),{sym:'\\pi_y'})]])}},
  'data:zori':pt=>{const B=traceBase(),i=pt.pointNumber;return {title:`Asking rents, ${pt.x}`,node:B.dat(`Zillow Observed Rent Index, January ${pt.x} vs a year earlier`,RES.zori.yoy[i],'pp',['r_zori'])}},
  'data:rentcpi':pt=>{const B=traceBase(),y=Math.round(+pt.x);return {title:`CPI rent, ${y}`,node:B.fn(`Rent CPI change, ${y} (percent)`,RENTG[y-Y0],'pp','inflation',()=>[B.dat(`Rent CPI, end of ${y}`,RENTL[y-Y0+1],'n',['fredRent']),B.dat(`Rent CPI, end of ${y-1}`,RENTL[y-Y0],'n',['fredRent'])],([a,b])=>(a/b-1)*100)}}});
