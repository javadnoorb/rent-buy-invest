/* ===================== Where the gap comes from ===================== */
/* The buy-minus-rent gap at the horizon split into parts that add up to it exactly. Same-budget accounting:
   gap = (home value gain − selling costs − tax on the sale) − buying costs − Σ owner costs + Σ tax savings
         + Σ house-hack income + Σ rent + (loan − Σ principal − balance left) − (renter's portfolio growth − buyer's).
   In today's dollars the loan term is the gain from repaying a fixed loan with dollars inflation has shrunk (less any
   FHA upfront premium, which is added to the loan); in nominal dollars it is zero apart from that premium.
   Investment taxes (the renter's minus the buyer's) are their own part; the last term, the renter's extra investment
   returns before tax, is the residual, so the parts always sum to the headline; flows are summed in the chosen dollars. */
function gapParts(p,o){const N=p.N,c=o.cpi[N],LS=loanSetup(p,p.rate),sum=k=>o.flow.slice(0,N).reduce((a,f)=>a+adj(f[k]*12,f.cpi),0);
  const gap=adj(o.buy[N]-o.inv[N],c),H=adj(o.H[N],c),eq=adj(o.eq[N],c),bal=adj(o.bal[N],c),sr=sellAt(p,o.H[N]),sale=H*(1-sr);
  const parts=[['Home price change',H-p.P],['Selling costs',-H*sr],['Tax on the home sale',-Math.max(0,sale-bal-eq)],
    ['Buying costs',-(p.P*p.close+p.moveIn+LS.ptsCost)],['Mortgage interest',-sum('interest')],['Property tax',-sum('ptax')],
    ['Insurance, HOA, PMI, utilities',-(sum('ins')+sum('hoa')+sum('pmi')+sum('util')+sum('refi'))],['Upkeep',-sum('maint')],
    ['Tax savings from owning',-sum('tax')],['House-hack income',-sum('hh')],['Rent the renter pays',sum('rent')]];
  const base=p.P*(1-p.dp),infl=LS.L-sum('principal')-bal;if(p.moveMode==='none'||!p.moveMode){parts.push(['FHA upfront premium',base-LS.L],['Inflation shrinking the loan',infl])}
  // investment taxes (yearly on dividends and interest, and on selling at year N): the renter's minus the buyer's
  if(o.tax){const it=o.tax.slice(0,N).reduce((a,t)=>a+adj(t.invR-t.invB,t.cpi),0)+adj(o.liqTax[N].r-o.liqTax[N].b,c);parts.push(['Tax on investments (renter − buyer)',it])}
  const known=parts.reduce((a,x)=>a+x[1],0);parts.push(['Renter\'s investment returns, before tax',gap-known]);
  return {gap,parts:parts.filter(([lab,v])=>Math.abs(v)>=1||/Rent|returns/.test(lab))}}
/* Drawn as a walk of thick arrows: each part starts where the previous one ended and points right (in buying's
   favor, orange) or left (renting's, blue); dotted lines join the steps and the value sits at each arrow's tip. The
   last row is the total, drawn from zero. An invisible bar per row carries the hover text. Names are on the left and
   values in a column on the right, clear of the arrows; on phones the names and values go above the arrows so the
   arrows get the full width. */
function renderGap(o){const t=theme(),p=P,{gap,parts}=gapParts(p,o),narrow=innerWidth<600;
  const rows=/** @type {any[]} */(parts.map(([lab,v])=>({lab,v}))),n=rows.length;let run=0;rows.forEach(r=>{r.a=run;run+=r.v;r.b=run});
  rows.push({lab:'Buy minus rent',v:gap,a:0,b:gap,total:true});
  const xs=rows.flatMap(r=>[r.a,r.b]),lo=Math.min(0,...xs),hi=Math.max(0,...xs),span=(hi-lo)||1,pad=span*.03;
  const y=i=>n-i,dy=narrow?-.14:0,head=span*.022,sh=[],bx=[],base=[],txt=[],ty=[],tcol=[];
  rows.forEach((r,i)=>{const yc=y(i)+dy,h=narrow?(r.total?.2:.15):(r.total?.36:.26),hh=narrow?(r.total?.28:.24):(r.total?.46:.38),d=r.b>=r.a?1:-1,len=Math.abs(r.b-r.a),hl=Math.min(head,len),neck=r.b-d*hl;
    const col=r.v>=0?t.buy:t.inv;
    if(len>0)sh.push({type:'path',xref:'x',yref:'y',fillcolor:col,line:{width:r.total?1.5:0,color:t.ink},layer:'above',
      path:`M${r.a},${yc-h} L${neck},${yc-h} L${neck},${yc-hh} L${r.b},${yc} L${neck},${yc+hh} L${neck},${yc+h} L${r.a},${yc+h} Z`});
    if(i<n-1)sh.push({type:'line',xref:'x',yref:'y',x0:r.b,x1:r.b,y0:yc-hh,y1:y(i+1)+dy+hh,line:{color:t.muted,width:1,dash:'dot'}});
    bx.push(len);base.push(Math.min(r.a,r.b));ty.push(yc);tcol.push(r.total?t.ink:col);
    txt.push((r.total?'<b>':'')+(r.v>=0?'+':'')+fmt(r.v)+(r.total?'</b>':''))});
  sh.push({type:'line',xref:'x',yref:'paper',x0:0,x1:0,y0:0,y1:1,line:{color:t.muted,width:1}},
    {type:'line',xref:'paper',yref:'y',x0:0,x1:1,y0:.5,y1:.5,line:{color:t.line,width:1}});
  const ys=rows.map((r,i)=>y(i)),ticks=rows.map(r=>r.total?`<b>${r.lab}</b>`:r.lab);
  const names=narrow?rows.map((r,i)=>({xref:'paper',yref:'y',x:0,y:y(i)+.18,xanchor:'left',yanchor:'bottom',showarrow:false,
    text:`${r.total?'<b>':''}${r.lab} <span style="color:${r.v>=0?t.buy:t.inv}">${r.v>=0?'+':''}${fmt(r.v)}</span>${r.total?'</b>':''}`,font:{size:11},bgcolor:t.bg,borderpad:1})):[];
  // phones: each row needs room for its name above the arrow, so the chart grows with the number of rows
  {const el=document.getElementById('p-gap');if(el)el.style.height=narrow?`${Math.round(rows.length*48+110)}px`:''}
  // wider screens: each value in its own column right of the arrows, where no arrow, connector or zero line crosses it
  const vals=/** @type {any[]} */(narrow?[]:rows.map((r,i)=>({xref:'paper',yref:'y',x:1,xanchor:'left',xshift:8,y:ty[i],showarrow:false,text:txt[i],font:{family:'IBM Plex Mono, monospace',size:11,color:tcol[i]}})));
  const dir=`<span style="color:${t.inv}">← favors renting</span>   <span style="color:${t.buy}">favors buying →</span>`;
  plot('p-gap',[{type:'bar',orientation:'h',y:ys,x:bx,base,width:.9,marker:{color:'rgba(0,0,0,0)'},customdata:rows.map(r=>[r.lab,r.v]),
      hovertemplate:'%{customdata[0]}: %{customdata[1]:$,.0f}<extra></extra>'}],
    {xaxis:{...Yd(basisLabel()),range:[lo-pad,hi+pad],title:{text:narrow||(document.getElementById('p-gap').clientWidth||0)<760?`${dir}<br>Effect on buy minus rent at year ${p.N}, ${basisLabel()}`:`${dir}      Effect on buy minus rent at year ${p.N}, ${basisLabel()}`,font:{size:11}}},
     yaxis:{automargin:true,tickvals:ys,ticktext:ticks,showticklabels:!narrow,range:[-.6,n+.6],showgrid:false,zeroline:false},hovermode:'closest',
     margin:{l:10,r:narrow?10:78,t:10,b:narrow||(document.getElementById('p-gap').clientWidth||0)<760?70:44},showlegend:false,shapes:sh,annotations:/** @type {any[]} */(names).concat(vals)});
  const pos=parts.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]),neg=parts.filter(x=>x[1]<0).sort((a,b)=>a[1]-b[1]);
  tk('gap',`At year ${p.N} buying ends ${gap>=0?'ahead':'behind'} by ${fmt(Math.abs(gap))}. ${pos.length?`Most in its favor: ${pos.slice(0,2).map(x=>`${x[0].toLowerCase()} (${fmt(x[1])})`).join(' and ')}. `:''}${neg.length?`Most against it: ${neg.slice(0,2).map(x=>`${x[0].toLowerCase()} (${fmt(-x[1])})`).join(' and ')}.`:''}`)}
