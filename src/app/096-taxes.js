/* ===================== Taxes: what each path pays, and which rules apply ===================== */
/* Totals over the horizon in the chosen dollars (yearly amounts at mid-year prices, sale-time amounts at year N), from
   the detailed run's tax records. A saving is shown as a negative tax. Transfer taxes are the first purchase's buyer
   share and the final sale's seller share. */
function taxRows(p,o){const N=p.N,c=o.cpi[N],T=o.tax.slice(0,N),S=k=>T.reduce((a,t)=>a+adj(t[k],t.cpi),0);
  const HN=o.H[N],ttB=p.ttRules?p.P*(closeAt(p,p.P)-p.closeBase):p.P*(p.ttBuy||0),ttS=HN>0?(p.ttRules?HN*(sellAt(p,HN)-p.sellBase):HN*(p.ttSell||0)):0;
  const rows=[['Income tax saved by owning (deductions)',-S('saving'),0],['Property tax',S('ptax'),0],
    ['Transfer taxes (buying, and selling at the end)',ttB+adj(ttS,c),0],['Tax on house-hack rent',S('hh'),0],
    ['Tax on dividends and interest (paid yearly)',S('invB'),S('invR')],[`Tax on selling the investments at year ${N}`,adj(o.liqTax[N].b,c),adj(o.liqTax[N].r,c)],
    ['Tax on the home sale',adj(o.homeTax[N].tax,c),0]].filter(r=>Math.abs(r[1])>=1||Math.abs(r[2])>=1||/Property|saved/.test(r[0]));
  return rows}
/* plain-language list of the rules that apply, from the yearly records (year 1 and how it changes) */
function taxFacts(p,o){const N=p.N,T=o.tax.slice(0,N),t0=T[0],out=[],yrs=f=>T.map((t,y)=>f(t)?y+1:0).filter(Boolean),span=a=>a.length===N?'every year':a.length===1?`year ${a[0]}`:a.at(-1)-a[0]+1===a.length?`years ${a[0]}–${a.at(-1)}`:`${a.length} of the ${N} years`;
  if(!p.taxOn){out.push('Income taxes are switched off (Model taxes), so only property and transfer taxes count.');return out}
  out.push(`Federal marginal rate ${pct(t0.mu,0)} in year 1 (2026 brackets, ${p.filing==='mfj'?'married filing jointly':'single'}, ${fmt(t0.income)} income${p.incGrowth?`, growing ${pct(p.incGrowth)}/yr`:''}).`);
  const it=yrs(t=>t.owned&&t.itemB);
  out.push(!it.length?`As an owner you never itemize: the standard deduction (${fmtFull(t0.std)} in 2026) is larger than mortgage interest plus state and property taxes, so they save no federal tax${p.stDed?'; the state deduction still helps':''}.`:
    `As an owner you itemize in ${span(it)}${it.length<N?'; in the other years the standard deduction is larger, so interest and property tax save little or nothing then':''}.`+(T.some(t=>t.itemR)?' The renter also itemizes, so only the extra deductions from owning count.':''));
  if(it.length){const k=T.findIndex(t=>t.owned&&t.saltOver>0),y30=2030-(p.y0||TAX_YEAR),drop=y30>0&&y30<N;
    if(k>=0)out.push(drop&&k===y30?`In 2030 (year ${y30+1}) the SALT cap drops to $10,000, below your state income and property taxes: about ${fmt(T[k].saltOver)} that year is not deductible, which cuts the value of itemizing from then on.`:
      `${k===0?'State':`From year ${k+1}, state`} income and property taxes exceed the SALT cap (${fmtFull(T[k].cap)}${k===0&&T[k].cap<40400?', reduced at your income':''}): about ${fmt(T[k].saltOver)} that year is not deductible.`);
    if(drop&&k!==y30)out.push(`The SALT cap drops to $10,000 in 2030 (year ${y30+1}), which cuts the value of itemizing from then on.`);
    if(T.some(t=>t.owned&&t.f750<0.999))out.push(`Only interest on the first $750,000 of the loan is deductible (about ${pct(Math.min(...T.filter(t=>t.owned).map(t=>t.f750)),0)} of it at most).`);
    if(T.some(t=>t.mi>0))out.push(t0.fMI>=1?'Mortgage insurance is deductible (income under $100,000).':t0.fMI>0?'Mortgage insurance is partly deductible (income between $100,000 and $110,000).':'Mortgage insurance is not deductible at your income (over $110,000).')}
  out.push(p.stDed?`Your state lets you deduct mortgage interest and property tax, at ${pct(p.stRate,2)}.`:`Your state does not let you deduct mortgage interest and property tax${p.stRate>0?'':' (or has no income tax)'}.`);
  if(p.acct==='sheltered')out.push('Investments are in a sheltered account: no tax on dividends, interest or selling.');
  else out.push(`Investments are taxable: dividends and long-term gains at ${pct(t0.ltcg,0)} federal${t0.niit>0?' + 3.8% net investment income tax':''}${p.stRate>0?` + ${pct(p.stRate,2)} state`:''}; bond and T-bill interest at the ordinary rate.`+(t0.niit>0?'':' The 3.8% net investment income tax does not apply at your income.'));
  const h=o.homeTax[N];if(o.H[N]>0){if(h.held<2)out.push('Selling within 2 years of buying: no home-sale exclusion.');
    else if(h.gain<=0)out.push(`No taxable gain on the home at year ${N}.`);
    else out.push(h.tax>0?`The home's gain at year ${N} (${fmt(h.gain)} nominal) is more than the ${fmt(h.excl)} exclusion; the rest is taxed (${fmt(h.tax)}).`:`The ${p.filing==='mfj'?'$500,000':'$250,000'} home-sale exclusion covers the whole gain at year ${N} (${fmt(h.gain)} nominal).`)}
  if(p.ptaxCap>0||p.ptaxCapCPI)out.push(`Your assessment can rise at most ${p.ptaxCap>0?pct(p.ptaxCap,1):'inflation'} a year${p.ptaxCap>0&&p.ptaxCapCPI?' (or inflation, if lower)':''}, so property tax grows slower than the home's value when prices rise fast.`);
  if(p.hsEx>0||p.hsCredit>0)out.push(`A homestead ${p.hsEx>0?`exemption of ${fmtFull(p.hsEx)} off the taxed value`:''}${p.hsEx>0&&p.hsCredit>0?' and a ':''}${p.hsCredit>0?`credit of ${fmtFull(p.hsCredit)} a year`:''} lowers the property tax.`);
  if(p.rentalOn)out.push('The rental-property path has its own taxes (depreciation, passive losses, recapture at sale): see Method.');
  return out}
function renderTaxes(o){const p=P,el=document.getElementById('taxT');if(!el||!o.tax)return;const rows=taxRows(p,o),tot=[rows.reduce((a,r)=>a+r[1],0),rows.reduce((a,r)=>a+r[2],0)];
  const f=v=>Math.abs(v)<1?'—':(v<0?'−':'')+fmt(Math.abs(v)).replace(/^−/,'');
  el.innerHTML=`<thead><tr><th>Over ${nY(p.N)}, ${basisLabel()}</th><th>Buy</th><th>Rent + invest</th></tr></thead><tbody>`+
    rows.map(r=>`<tr><td>${r[0]}</td><td>${f(r[1])}</td><td>${f(r[2])}</td></tr>`).join('')+
    `<tr class="hl"><td>Total</td><td>${f(tot[0])}</td><td>${f(tot[1])}</td></tr></tbody>`;
  document.getElementById('taxFacts').innerHTML=taxFacts(p,o).map(x=>`<li>${x}</li>`).join('');
  const d=tot[0]-tot[1];tk('tax',Math.abs(d)<1?'Both paths pay about the same in taxes.':`Over ${nY(p.N)}, buying pays ${fmt(Math.abs(d))} ${d>0?'more':'less'} in taxes than renting and investing, property tax included.`)}
