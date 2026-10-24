/* ===================== Projection ===================== */
function yearlyRows(o){const rows=[];for(let k=0;k<o.buy.length;k++){const f=o.flow[k-1]||{};rows.push({year:k,home:o.H[k],balance:o.bal[k],netEquity:o.eq[k],buyerPortfolio:o.pB[k],buyNW:o.buy[k],renterNW:o.inv[k],cashNW:o.cash[k],ownerMonthly:k?f.own:null,rentMonthly:k?f.rent:null,hti:k&&o.income[k-1]?f.own/(o.income[k-1]/12):null,taxSaving:k?-f.tax*12:null,mortRate:o.rateAt[k],cpiIndex:o.cpi[k]})}return rows}
function renderProj(){
  const t=theme(),o=simulate(P,constPath(P,P.N),{detail:true}),x=o.buy.map((_,k)=>k);
  renderGap(o);
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
  plot('p-nw',data,{margin:{t:be?24:10},xaxis:{...X('Years from today'),dtick:P.N>15?5:1},yaxis:Yd('Net worth, '+basisLabel()),
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
    {xaxis:X('Years from today'),yaxis:Yd('Value, '+basisLabel())});
  const bud=o.budget.map((b,k)=>b||o.budget[1]||1);
  plot('p-liq',[
    {x,y:o.lqB.map((v,k)=>v/bud[k]),name:'Buyer',mode:'lines',line:{color:t.buy,width:2.5},hovertemplate:'%{y:.1f} months'},
    {x,y:o.lqR.map((v,k)=>v/bud[k]),name:'Renter (invest)',mode:'lines',line:{color:t.inv,width:2.5},hovertemplate:'%{y:.1f} months'}]
    .concat(P.heloc>0?[{x,y:o.lqB.map((v,k)=>(v+o.heloc[k])/bud[k]),name:'Buyer + home-equity line',mode:'lines',line:{color:t.buy,width:2,dash:'dot'},hovertemplate:'%{y:.1f} months'}]:[]),
    {xaxis:X('Years from today'),yaxis:Yt('Months of budget',{type:'log',tickvals:[0.5,1,3,6,12,24,60,120,240,600],ticktext:['0.5','1','3','6','12','24','60','120','240','600']}),
     shapes:[3,6].map(v=>({type:'line',xref:'paper',x0:0,x1:1,y0:v,y1:v,line:{color:t.neg,dash:'dot',width:1}}))});
  // table + csv
  const rows=yearlyRows(o),cols=[['year','Year'],['home','Home value'],['balance','Mortgage'],['netEquity','Net equity'],['buyerPortfolio','Buyer portfolio'],['buyNW','Buy NW'],['renterNW','Rent+invest NW'],['cashNW','Rent+T-bills NW'],['ownerMonthly','Owner $/mo'],['rentMonthly','Rent $/mo'],['taxSaving','Tax saving $/yr'],['hti','Housing / income'],['mortRate','Loan rate']];
  const v=(r,k)=>{const x=r[k];if(x==null)return '';if(k==='year')return x;if(k==='hti')return pct(x,0);if(k==='mortRate')return (x*100).toFixed(2)+'%';return Math.round(adj(x,r.cpiIndex)).toLocaleString('en-US')};
  document.getElementById('ytable').innerHTML='<thead><tr>'+cols.map(c=>`<th>${c[1]}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+cols.map(c=>`<td>${v(r,c[0])}</td>`).join('')+'</tr>').join('')+'</tbody>';
  const csv=[cols.map(c=>c[1]+(c[0]!=='year'&&c[0]!=='mortRate'?` (${basisLabel()})`:'')).join(',')].concat(rows.map(r=>cols.map(c=>{const x=r[c[0]];if(x==null)return '';if(c[0]==='year')return x;if(c[0]==='mortRate')return (x*100).toFixed(3);if(c[0]==='hti')return (x*100).toFixed(1);return Math.round(adj(x,r.cpiIndex))}).join(','))).join('\n');
  document.getElementById('csvText').value=csv;document.getElementById('ytBasis').textContent=basisLabel();
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
   const mo=o.lqB.map((v,k)=>(v+(P.heloc>0?o.heloc[k]:0))/(bud[k]||1)),low=mo.slice(1).findIndex(v=>v>=3);
   tk('liq',(P.heloc>0?'Counting the home-equity line: ':'')+(mo.slice(1).every(v=>v>=3)?'The buyer keeps at least 3 months of costs in liquid assets throughout.':
     (low<0?`The buyer stays below 3 months of costs in liquid assets for all ${nY(N)}; a separate emergency fund matters if you buy.`:`The buyer has under 3 months of costs in liquid assets until year ${low+1}; a separate emergency fund matters in those years.`)));}
}

