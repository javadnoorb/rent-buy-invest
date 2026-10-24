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
  else if(k==='ptax')n=per(T.ptaxY(y));else if(k==='maint')n=per(T.maintY(y));else if(k==='ins')n=T.fn(lab,f[k],'$',null,()=>[T.insMo(y)],([a])=>a);
  else if(k==='hoa')n=T.fn(lab,f[k],'$',null,()=>[T.byInf('hoa','HOA',y,Yv.hoa)],([a])=>a);else if(k==='util')n=T.fn(lab,f[k],'$',null,()=>[T.byInf('utilDiff','Extra utilities',y,Yv.utilM)],([a])=>a);
  else if(k==='pmi')n=per(T.pmiY(y));
  else if(k==='refi')n=T.fn(lab,f[k],'$','perMo',()=>[T.sum(`Refinance costs in year ${y+1}`,T.months(m=>T.Mo(y,m).refi||0).reduce((a,b)=>a+b,0),'$','sum12',()=>T.months(m=>[1,T.con(`Refinance cost, month ${m+1}`,T.Mo(y,m).refi||0,'$',{pk:['refiCost']})]))],([a])=>a/12);
  else if(k==='tax')n=per(T.taxSave(y),-1);
  else if(k==='hh')n=T.fn(lab,f[k],'$',null,()=>[T.hhY(y),p_hh(T,y)],([a,b])=>-(a-b/12));
  else if(k==='rent')n=T.fn(lab,f[k],'$',null,()=>[T.rentY(y)],([a])=>a);
  return T.real(n,T.cpiMid(y),lab+", today's dollars")}
const p_hh=(T,y)=>T.p.taxOn&&T.p.hhRent>0?T.hhTaxM(y):T.con('Tax on house-hack rent',0,'$');
/* the year's unrecoverable costs (Unrecoverable cost chart): cash costs, and the return the owner's equity forgoes */
function unrecNode(T,part,y){const u=T.o.unrec[y],Yv=T.Yr(y),lab=part==='rent'?`Rent paid in year ${y+1}`:part==='opp'?`Return forgone on the owner's equity, year ${y+1}`:`Owner's cash costs, year ${y+1}`;let n;
  if(part==='rent')n=T.fn(lab,u.rent,'$',null,()=>[T.rentY(y)],([a])=>a*12);
  else if(part==='opp')n=T.fn(lab,u.opp,'$','oppCost',()=>[T.fn(`Home equity at the start of year ${y+1}`,Yv.owned?Yv.H-Yv.bal:0,'$',null,()=>[T.H(y),T.con('Mortgage balance at the start of the year',Yv.bal,'$')],([h,b])=>Yv.owned?h-b:0),
    T.sum(`Sum of the 12 monthly portfolio returns, year ${y+1}`,T.months(m=>T.Mo(y,m).ret).reduce((a,b)=>a+b,0),'%','sum12',()=>T.months(m=>[1,T.con(`Portfolio return, month ${m+1}`,T.Mo(y,m).ret,'%')]))],([e,r])=>e*r);
  else n=!Yv.owned?T.fn(lab,u.own,'$',null,()=>[T.rentY(y)],([a])=>a*12):T.sum(lab,u.own-u.opp,'$','unrec',()=>[[1,T.intY(y)],[1,T.ptaxY(y)],[1,T.maintY(y)],[12,T.insMo(y)],[12,T.byInf('hoa','HOA',y,Yv.hoa)],[12,T.byInf('utilDiff','Extra utilities',y,Yv.utilM)],[1,T.pmiY(y)],
    [1,T.con('Refinance costs',T.months(m=>T.Mo(y,m).refi||0).reduce((a,b)=>a+b,0),'$',{pk:['refiCost']})],[-1,T.taxSave(y)],[-12,T.hhY(y)],[1,p_hh(T,y)]]);
  return T.real(n,T.cpi(y+1),lab+", today's dollars")}
function liqNode(T,who,t){const bud=t?T.budget(t-1):T.fn('Monthly budget (year 1, used at the start)',T.o.budget[1]||1,'$',null,()=>[T.budget(0)],([b])=>b);
  const a=who==='R'?T.liq('R',t):who==='H'?T.sum(`Buyer's liquid assets plus the home-equity line ${t?`after ${nY(t)}`:'at the start'}`,T.o.lqB[t]+T.o.heloc[t],'$','heloc',()=>[[1,T.liq('B',t)],[1,T.helocN(t)]]):T.liq('B',t);
  return T.fn(`${who==='R'?'Renter':'Buyer'}'s liquid assets in months of budget, ${t?`after ${nY(t)}`:'at the start'}`,a.v/bud.v,'mo','months',()=>[a,bud],([x,b])=>x/b)}
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
    case 'Buying costs':return T.sum(lab,v,'$','gapBuy',()=>[[-1,T.fn('Closing costs',p.P*p.close,'$',null,()=>[T.set('P',p.P,'$'),T.closeRate()],([a,c])=>a*c)],[-1,T.set('moveIn',p.moveIn||0,'$')],[-1,T.ptsCost()]]);
    case 'Mortgage interest':return yearly(y=>T.intY(y),-1);
    case 'Property tax':return yearly(y=>T.ptaxY(y),-1);
    case 'Upkeep':return yearly(y=>T.maintY(y),-1);
    case 'Insurance, HOA, PMI, utilities':return yearly(y=>{const Yv=T.Yr(y);return T.sum(`Insurance, HOA, PMI, utilities and refinancing, year ${y+1}`,(Yv.insM+Yv.hoa+Yv.utilM)*12+T.o.flow[y].pmi*12+T.o.flow[y].refi*12,'$','unrec',()=>[[12,T.insMo(y)],[12,T.byInf('hoa','HOA',y,Yv.hoa)],[12,T.byInf('utilDiff','Extra utilities',y,Yv.utilM)],[1,T.pmiY(y)],[1,T.con('Refinance costs',T.o.flow[y].refi*12,'$',{pk:['refiCost']})]])},-1);
    case 'Tax savings from owning':return yearly(y=>T.taxSave(y),1);
    case 'House-hack income':return yearly(y=>T.fn(`House-hack income after tax, year ${y+1}`,-T.o.flow[y].hh*12,'$',null,()=>[T.hhY(y),p_hh(T,y)],([a,b])=>a*12-b),1);
    case 'Rent the renter pays':return yearly(y=>T.fn(`Rent, year ${y+1}`,T.o.flow[y].rent*12,'$',null,()=>[T.rentY(y)],([a])=>a*12),1);
    case 'FHA upfront premium':return T.sum(lab,v,'$',null,()=>[[1,T.loanBase()],[-1,T.loanAmt()]]);
    case 'Inflation shrinking the loan':return T.sum(lab,v,'$','gapLoan',()=>[[1,T.loanAmt()],[-1,yearly(y=>T.fn(`Principal paid, year ${y+1}`,T.o.flow[y].principal*12,'$',null,()=>[T.prinY(y),T.preY(y)],([a,b])=>a+b),1,'Principal repaid, each year at mid-year prices')],[-1,rl(T.bal(N),cN)]]);
    case 'Tax on investments (renter − buyer)':return T.sum(lab,v,'$','gapInvTax',()=>[[1,yearly(y=>T.sum(`Renter's minus buyer's investment taxes, year ${y+1}`,T.o.tax[y].invR-T.o.tax[y].invB,'$',null,()=>[[1,T.taxY('R',y)],[-1,T.taxY('B',y)]]),1,'Yearly taxes on dividends and interest')],
      [1,T.fn(`Tax on selling the portfolios at year ${N} (renter − buyer)`,T.real(T.con('',T.o.liqTax[N].r-T.o.liqTax[N].b,'$'),cN).v,'$',null,()=>[rl(T.V('R',N),cN),rl(T.liq('R',N),cN),rl(T.V('B',N),cN),rl(T.liq('B',N),cN)],([vr,lr,vb,lb])=>(vr-lr)-(vb-lb))]]);
    default:{const others=parts.filter(x=>x[0]!==lab),known=others.reduce((a,x)=>a+x[1],0);
      return T.fn(lab,v,'$','gapRest',()=>[dGap(),T.con('All the other parts above, added up',known,'$')],([g,k])=>g-k,null,{note:'what the renter\'s portfolio earned beyond the buyer\'s, before tax: what is left once every other part is counted'})}}}
