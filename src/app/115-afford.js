/* ===================== How much house can you afford ===================== */
/* Lender-style limits on the payment lenders count (principal, interest, property tax, insurance, HOA and mortgage
   insurance; not upkeep or utilities): housing ≤ 28% of gross income and all debts ≤ 36% (comfortable), or all
   debts ≤ 43% (most lenders' limit). The cash you have pays the down payment plus closing costs, transfer taxes and
   move-in costs; the minimum down payment is 3% (3.5% for FHA). Insurance scales with the price. */
function affordAt(p,P,cash){const minDp=p.loanType==='fha'?0.035:0.03,down=Math.min(P,cash-p.close*P-p.moveIn);
  if(!(down>=minDp*P-1e-6))return null;const q=Object.assign({},p,{P,dp:down/P,ins:p.ins*P/p.P});
  const LS=loanSetup(q,q.rate),pay=pmt(LS.L,LS.rate/12,q.term*12),mi=LS.type==='fha'?LS.mip*LS.L/12:(q.dp<0.2?q.pmi*LS.L/12:0);
  const piti=pay+(q.ptax*P+q.ins+q.floodIns)/12+q.hoa+mi;return {P,dp:q.dp,down,piti,full:month1Cost(q)}}
function maxPrice(p,cash,front,back){const inc=p.income/12,ok=P=>{const a=affordAt(p,P,cash);return a&&a.piti<=front*inc&&a.piti+p.debt<=back*inc};
  if(!p.income||!ok(10000))return null;let lo=10000,hi=20e6;if(ok(hi))return affordAt(p,hi,cash);
  for(let k=0;k<50;k++){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m}const a=affordAt(p,Math.floor(lo/1000)*1000,cash);
  // what binds: the cash (a slightly higher price would need more cash than you have) or the income
  a.limit=affordAt(p,lo*1.01,cash)?'income':'cash';return a}
function affCash(p){const v=numOf('affCash');return isFinite(v)&&v>0?v:p.P*(p.dp+p.close)+p.moveIn}
function renderAfford(){const p=P,el=document.getElementById('affT');if(!el)return;const cash=affCash(p),inc=p.income;
  const ph=document.getElementById('affCash');if(document.activeElement!==ph&&!ph.value)ph.placeholder=Math.round(cash).toLocaleString('en-US');
  if(!inc){el.innerHTML='<p class="sub">Enter your household income in the settings (Taxes &amp; income) to see what you can afford.</p>';return}
  const rows=[['Comfortable','housing ≤ 28% of income, all debt ≤ 36%',maxPrice(p,cash,0.28,0.36)],['Lender limit','all debt ≤ 43% of income',maxPrice(p,cash,0.43,0.43)]];
  const now=affordAt(p,p.P,p.P*(p.dp+p.close)+p.moveIn),need=now?[Math.max(now.piti/0.28,(now.piti+p.debt)/0.36)*12,(now.piti+p.debt)/0.43*12]:null;
  el.innerHTML=rows.map(([lab,rule,a],i)=>`<div class="affrow${i===0?' hl':''}"><div class="k">${lab} <span class="sub">${rule}</span></div>`+
      (a?`<div class="v">${fmtFull(a.P)} <button type="button" class="qlink" data-aff="${a.P}|${a.dp.toFixed(4)}">use this price</button></div>
        <div class="sub">${pct(a.dp,0)} down (${fmtFull(a.down)}) · ${fmtFull(a.piti)}/mo counted by lenders · ${fmtFull(a.full)}/mo in full · limited by your ${a.limit}</div>`
        :`<div class="sub">not reachable with this cash and income</div>`)+'</div>').join('')+
    (need?`<div class="affrow"><div class="k">Income needed for ${fmtFull(p.P)} <span class="sub">your price and down payment</span></div><div class="v">${fmtFull(need[0])}/yr</div><div class="sub">comfortable; ${fmtFull(need[1])}/yr at the lender limit; yours is ${fmtFull(inc)}</div></div>`:'');
  const c=rows[0][2];tk('aff',c?`With ${fmtFull(cash)} in cash and ${fmtFull(inc)} a year${p.debt?` and ${fmtFull(p.debt)}/mo of other debt`:''}, a comfortable price is up to about ${fmt(c.P)}, limited by your ${c.limit}. `+
    (now&&need?(inc>=need[0]?`Your ${fmt(p.P)} home fits within the comfortable limits.`:inc>=need[1]?`Your ${fmt(p.P)} home is above the comfortable limits but within what most lenders allow.`:`Your ${fmt(p.P)} home needs more income than most lenders allow.`):''):'Not reachable with this cash and income.')}
function wireAfford(){document.getElementById('affCash').addEventListener('input',()=>renderAfford());
  document.getElementById('affT').addEventListener('click',e=>{const b=e.target.closest('[data-aff]');if(!b)return;const [Pv,dp]=b.dataset.aff.split('|');
    document.getElementById('P').value=Pv;document.getElementById('dp').value=(dp*100).toFixed(1);update()})}
