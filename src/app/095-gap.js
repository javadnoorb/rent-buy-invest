/* ===================== Where the gap comes from ===================== */
/* The buy-minus-rent gap at the horizon split into parts that add up to it exactly. Same-budget accounting:
   gap = (home value gain − selling costs − tax on the sale) − buying costs − Σ owner costs + Σ tax savings
         + Σ house-hack income + Σ rent + (loan − Σ principal − balance left) − (renter's portfolio growth − buyer's).
   In today's dollars the loan term is the gain from repaying a fixed loan with dollars inflation has shrunk (less any
   FHA upfront premium, which is added to the loan); in nominal dollars it is zero apart from that premium.
   The last term is the residual, so the parts always sum to the headline; flows are summed in the chosen dollars. */
function gapParts(p,o){const N=p.N,c=o.cpi[N],LS=loanSetup(p,p.rate),sum=k=>o.flow.slice(0,N).reduce((a,f)=>a+adj(f[k]*12,f.cpi),0);
  const gap=adj(o.buy[N]-o.inv[N],c),H=adj(o.H[N],c),eq=adj(o.eq[N],c),bal=adj(o.bal[N],c),sale=H*(1-p.sell);
  const parts=[['Home price change',H-p.P],['Selling costs',-H*p.sell],['Tax on the home sale',-Math.max(0,sale-bal-eq)],
    ['Buying costs',-(p.P*p.close+p.moveIn+LS.ptsCost)],['Mortgage interest',-sum('interest')],['Property tax',-sum('ptax')],
    ['Insurance, HOA, PMI, utilities',-(sum('ins')+sum('hoa')+sum('pmi')+sum('util')+sum('refi'))],['Upkeep',-sum('maint')],
    ['Tax savings from owning',-sum('tax')],['House-hack income',-sum('hh')],['Rent the renter pays',sum('rent')]];
  const base=p.P*(1-p.dp),infl=LS.L-sum('principal')-bal;if(p.moveMode==='none'||!p.moveMode){parts.push(['FHA upfront premium',base-LS.L],['Inflation shrinking the loan',infl])}
  const known=parts.reduce((a,x)=>a+x[1],0);parts.push(['Renter\'s investment returns, net',gap-known]);
  return {gap,parts:parts.filter(([lab,v])=>Math.abs(v)>=1||/Rent|returns/.test(lab))}}
function renderGap(o){const t=theme(),p=P,{gap,parts}=gapParts(p,o);let run=0;const lab=parts.map(x=>x[0]).concat(['Buy minus rent']).reverse();
  const base=[],val=[],col=[];parts.forEach(([,v])=>{base.push(v>=0?run:run+v);val.push(Math.abs(v));col.push(v>=0?t.buy:t.inv);run+=v});
  base.push(Math.min(0,gap));val.push(Math.abs(gap));col.push(gap>=0?t.buy:t.inv);
  const signed=parts.map(x=>x[1]).concat([gap]);
  plot('p-gap',[{type:'bar',orientation:'h',y:lab,x:val.slice().reverse(),base:base.slice().reverse(),marker:{color:col.slice().reverse()},
    customdata:signed.slice().reverse(),hovertemplate:'%{y}: %{customdata:$,.0f}<extra></extra>'}],
    {xaxis:{...Yd(basisLabel()),title:{text:`Effect on buy minus rent at year ${p.N}, ${basisLabel()}`,font:{size:11}}},yaxis:{automargin:true,type:'category'},
     margin:{l:10,r:10,t:10,b:44},showlegend:false,shapes:[{type:'line',x0:0,x1:0,yref:'paper',y0:0,y1:1,line:{color:t.muted,width:1}}]});
  const pos=parts.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]),neg=parts.filter(x=>x[1]<0).sort((a,b)=>a[1]-b[1]);
  tk('gap',`At year ${p.N} buying ends ${gap>=0?'ahead':'behind'} by ${fmt(Math.abs(gap))}. ${pos.length?`Most in its favor: ${pos.slice(0,2).map(x=>`${x[0].toLowerCase()} (${fmt(x[1])})`).join(' and ')}. `:''}${neg.length?`Most against it: ${neg.slice(0,2).map(x=>`${x[0].toLowerCase()} (${fmt(-x[1])})`).join(' and ')}.`:''}`)}
