/* ===================== Summary ===================== */
function affCell(own1,p){if(!p.income)return 'n/a';const fe=own1/(p.income/12),be=(own1+p.debt)/(p.income/12);
  const col=fe<=0.28&&be<=0.36?'--buy':(be<=0.43?'--cash':'--neg');
  return `<span style="color:var(${col})">${pct(fe,0)}</span><span class="sub" style="font-family:var(--body)"> · all debt ${pct(be,0)}</span>`}
function summary(){
  mcSync();const p=P,o=BASE,N=p.N,c=o.cpi[N];
  const b=adj(o.buy[N],c),iv=adj(o.inv[N],c),ca=adj(o.cash[N],c),d=b-iv;
  const own1=month1Cost(p);
  // a gap under 2% of the larger outcome (or 0.5% of the price) is within the noise of the assumptions: call it even
  const even=isEven(d,Math.max(Math.abs(b),Math.abs(iv)));
  const beY=breakevenYear(o);
  const beRent=bisect(r=>advAt(p,{rent0:r}),10,Math.max(500,p.rent0*6));
  const beG=bisect(g=>advAt(p,{gh:g}),-0.15,0.25);
  const o30=simulate(Object.assign({},p,{N:Math.max(N,1)}),constPath(p,N),{N});
  const ex=expectedWithMoving(o30,p);
  document.getElementById('vhead').innerHTML=even?`After ${N} year${N>1?'s':''}, buying and renting end up about even <span class="vamt">(${d>=0?'+':'−'}${fmt(Math.abs(d))} for buying, ${basisLabel()})</span>`:
    `${d>=0?'<span class="who buy">Buying</span>':'<span class="who inv">Renting and investing</span>'} comes out ahead by <span class="vamt">${fmt(Math.abs(d))}</span> <span class="vbasis">(${basisLabel()})</span> after ${N} year${N>1?'s':''}`;
  const rp=p.rentalOn&&o.rental[N]!=null?adj(o.rental[N],c):null;
  const opts=[['buy','Buy',b],['inv','Rent + invest',iv],['cash','Rent + T-bills',ca]].concat(rp!=null?[['rp','Rent + rental property',rp]]:[]),mx=Math.max(...opts.map(o=>o[2]),1),top=Math.max(...opts.map(o=>o[2]));
  const best=(k,v)=>v===top&&!(even&&(k==='buy'||k==='inv'));
  document.getElementById('bars').innerHTML=opts.map(([k,lab,v])=>`<div class="bar ${best(k,v)?'win':''}"><span class="lab">${lab}${best(k,v)?'<span class="pill">best</span>':''}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(0,v/mx*100).toFixed(1)}%;background:var(--${k})"></span></span><span class="val">${fmt(v)}</span></div>`).join('');
  document.getElementById('miniSum').innerHTML=even?`About even at year ${N}`:`<span class="who ${d>=0?'buy':'inv'}">${d>=0?'Buying':'Renting'}</span> ahead by <strong>${fmt(Math.abs(d))}</strong> at year ${N}`;document.getElementById('miniN').textContent=N+' yr';
  document.getElementById('fabSub').textContent=`${pct(p.dp,p.dp<0.1&&Math.round(p.dp*1000)%10?1:0)} down · ${pct(p.rate,2)} · ${N} yr`;
  document.getElementById('sheetlive').innerHTML=`Year ${N}: buy ${fmt(b)} · rent + invest ${fmt(iv)} · gap <strong style="color:var(${d>=0?'--buy':'--inv'})">${d>=0?'+':''}${fmt(d)}</strong>`;
  const stat=([k,v,h])=>`<div class="stat"${h?` title="${h}"`:''}><div class="k">${k}</div><div class="v">${v}</div></div>`;
  document.getElementById('vgrid').innerHTML=[
   ['Buying pulls ahead',beY?`year ${beY}`:`not by year ${N}`,'first year from which buying stays ahead through your horizon'],
   ['Owning, month 1',fmtFull(own1)+'/mo','mortgage, tax, insurance, upkeep, HOA, PMI and utilities, before tax savings'],
   ['Cash to buy',fmtFull(p.P*(p.dp+p.close)+loanSetup(p,p.rate).ptsCost+p.moveIn),'down payment, closing costs, transfer taxes, points and move-in costs'],
   ['Housing / income',affCell(own1,p),'month-1 owning cost as a share of gross income'],
  ].map(stat).join('');
  document.getElementById('vgrid2').innerHTML=[
   ['Break-even rent',beRent?fmtFull(beRent)+'/mo':'n/a','rent at which the two main paths tie at your horizon'],
   ['Break-even home growth',beG!=null?pct(beG)+'/yr':'n/a','home appreciation at which they tie'],
   [`Expected gap with ${pct(p.hz,0)}/yr move risk`,`<span style="color:var(${ex>=0?'--buy':'--inv'})">${ex>=0?'+':''}${fmt(ex)}</span>`,'weighted by the chance of selling early'],
   ...(p.hz>0?[['Chance you sell early',pct(1-Math.pow(1-p.hz,N-1),0),`before year ${N}, at a ${pct(p.hz,0)} chance of moving each year; the average stay is ${(Array.from({length:N},(_,k)=>k+1).reduce((a,t)=>a+t*(t<N?p.hz*Math.pow(1-p.hz,t-1):Math.pow(1-p.hz,N-1)),0)).toFixed(1)} years`]]:[]),
   ['Rent + T-bills',fmt(ca),'renting and keeping savings in T-bills'],
  ].map(stat).join('');
  const fe=p.income?own1/(p.income/12):0,be=p.income?(own1+p.debt)/(p.income/12):0;
  window._summaryText=`Rent, Buy or Invest — ${curMetro().name}, ${N}-year horizon (${basisLabel()})\n`+
    `Home ${fmtFull(p.P)}, ${pct(p.dp,0)} down, ${pct(p.rate,2)} ${p.term}-yr; rent ${fmtFull(p.rent0)}/mo\n`+
    `Growth: home ${pct(p.gh)}, rent ${pct(p.gr)}, stocks ${pct(p.rs)}, inflation ${pct(p.inf)}\n`+
    `Net worth at year ${N}: buy ${fmtFull(b)}, rent + invest ${fmtFull(iv)}, rent + T-bills ${fmtFull(ca)}\n`+
    `Buy − (rent + invest): ${d>=0?'+':''}${fmtFull(d)}; break-even year ${beY||'>'+N}; break-even rent ${beRent?fmtFull(beRent):'n/a'}/mo; break-even home growth ${beG!=null?pct(beG):'n/a'}\n`+
    `Owning month 1: ${fmtFull(own1)}/mo; housing/income ${p.income?pct(fe,0):'n/a'}, all debt ${p.income?pct(be,0):'n/a'}`+(MC?`\nMonte Carlo: buying wins in ${pct(MC.pWin[Math.min(N,MC.N)])} of ${MC.n} paths`:'');
  // explanation
  const tor=tornado(p),top2=tor.rows.slice(-2).reverse();
  const why=[];
  why.push(`<strong>Biggest drivers:</strong> ${top2.map(r=>`${r.lab.replace(/ ±.*/,'').toLowerCase()} (${fmt(Math.max(Math.abs(r.lo),Math.abs(r.hi)))} swing)`).join(' and ')}.`);
  if(even)why.push('The two paths are within the uncertainty of the assumptions: small changes to any input can tip it either way.');
  else if(d<0){why.push(`Buying would tie if rent rose to ${beRent?fmtFull(beRent):'much higher'} (from ${fmtFull(p.rent0)})${beG!=null?`, or if homes appreciated ${pct(beG)}/yr (vs. ${pct(p.gh)})`:''}.`)}
  else{why.push(`Renting would tie if rent fell to ${beRent?fmtFull(beRent):'much less'} (from ${fmtFull(p.rent0)})${beG!=null?`, or if homes appreciated only ${pct(beG)}/yr (vs. ${pct(p.gh)})`:''}.`)}
  if(p.income){const fe=own1/(p.income/12),be=(own1+p.debt)/(p.income/12);
    if(fe>0.28||be>0.36)why.push(`Affordability: housing would take ${pct(fe,0)} of gross income${p.debt?` (${pct(be,0)} with other debt)`:''}, above the common 28/36 guideline; conventional loans often allow total debt up to 45–50% with strong credit, and this app uses 43% as a conservative lender limit ${linkTo(AFF_URL)}.`)}
  if(p.extraPay>0){const run=m=>simulate(Object.assign({},p,{extraMode:m}),constPath(p,N),{N,detail:true}),pre=run('prepay'),inv=run('invest');
    const g=adj(pre.buy[N],c)-adj(inv.buy[N],c),off=pre.bal.findIndex((v,k)=>k>0&&v<=0.005);
    why.push(`Putting the extra ${fmtFull(p.extraPay)}/mo toward the mortgage instead of investing it ${g>=0?'adds':'costs'} ${fmt(Math.abs(g))} by year ${N}${off>0?` and pays the loan off in year ${off}`:''}.`)}
  if(o.refis>0)why.push(`The projection refinances ${o.refis} time${o.refis>1?'s':''} as rates move toward ${pct(p.rateLR,2)}.`);
  const own0=own1,rent0=p.rent0+p.rins/12+p.rMove*(p.rMoveCost+p.broker*p.rent0)/12;
  why.push(own0>rent0?`In month 1, before tax savings, owning costs ${fmtFull(own0-rent0)}/mo more than renting, which the renter invests.`:`In month 1, before tax savings, owning costs ${fmtFull(rent0-own0)}/mo less than renting, which the buyer invests.`);
  document.getElementById('why').innerHTML=why.join(' ');
  plainAnswer();
  const ptr=p.P/(p.rent0*12);const m=curMetro();
  document.getElementById('vnote').innerHTML=`${m.slug!=='us'?`Location: ${m.name}. `:''}Price-to-rent ${ptr.toFixed(1)} (gross rent yield ${pct(1/ptr)}). Values in ${basisLabel()}. ${MC?`Monte Carlo: buying beats renting and investing in <strong>${pct(MC.pWin[Math.min(N,MC.N)])}</strong> of ${MC.n.toLocaleString()} simulated paths at year ${Math.min(N,MC.N)}.`:''}${LOAD_WARN.size?` <span class="warn">Could not load: ${[...LOAD_WARN].join('; ')}.</span>`:''}`;
}

