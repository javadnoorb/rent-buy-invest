/* ===================== Your loan: what the loan settings add up to ===================== */
/* Rate from the quote through the credit-score adjustment and points, the payment, mortgage insurance and when it
   ends, how long points take to pay for themselves, and when the projection refinances or pays off the loan. */
function loanRows(p,o){const LS=loanSetup(p,p.rate),n=p.term*12,ca=creditAdj(p).rate,pts=Math.max(0,p.pts||0),cut=pts*(p.ptsCut||0);
  const quote=LS.type==='arm'?(p.armRate!=null?p.armRate:p.rate):p.rate,M=pmt(LS.L,LS.rate/12,n),rows=[];
  rows.push(['Rate quoted',pct(quote,2)+(LS.type==='arm'?` (${p.armYears||5}-year ARM start)`:p.term===15?' (15-year)':'')]);
  if(Math.abs(ca)>1e-6)rows.push([`Credit score ${String(p.fico).replace('-','–')}`,`${ca>0?'+':'−'}${(Math.abs(ca)*100).toFixed(2)} pts (Fannie Mae price adjustment)`]);
  if(pts>0){const M0=pmt(LS.L,(LS.rate+cut)/12,n),save=M0-M;rows.push([`${pts} discount point${pts===1?'':'s'}`,`−${(cut*100).toFixed(2)} pts for ${fmtFull(LS.ptsCost)} at closing; pays for itself in ${save>0?nY(Math.ceil(LS.ptsCost/save/12)):'never'} (payment ${fmtFull(save)}/mo lower)`])}
  rows.push(['Your rate',pct(LS.rate,2)+(LS.type==='arm'?`, resets from year ${(p.armYears||5)+1} (caps 2/1/5 or 5/1/5)`:'')]);
  rows.push(['Loan',fmtFull(LS.L)+(LS.type==='fha'?` (includes the ${fmtFull(LS.L-p.P*(1-p.dp))} FHA upfront premium)`:'')]);
  rows.push(['Principal and interest',fmtFull(M)+'/mo']);
  const fl=o.flow||[],mi0=fl.length?fl[0].pmi:0;
  if(mi0>0){const end=fl.findIndex(f=>f.pmi<mi0*0.05),label=LS.type==='fha'?'FHA mortgage insurance':'PMI';
    rows.push([label,`${fmtFull(mi0)}/mo in year 1; `+(end<0?`still charged at year ${fl.length}`:`ends in year ${end+1}`)+(LS.type==='fha'?(o.refiAt&&o.refiAt.length?`; refinancing in year ${Math.floor(o.refiAt[0])+1} ends FHA insurance, but conventional PMI then applies while the balance is above 78% of the price`:LS.mipMonths>=n?' (for the life of the loan below 10% down, unless you refinance)':' (11 years with 10% or more down)'):p.pmiAppr?' (by schedule at 78% of the price, or earlier with an appraisal)':' (at 78% of the price)')])}
  else if(p.dp<0.2&&LS.type!=='fha')rows.push(['PMI','none at this down payment']);
  if(o.refiAt&&o.refiAt.length)rows.push(['Refinancing',`expected in year ${Math.floor(o.refiAt[0])+1}${o.refiAt.length>1?` (${o.refiAt.length} times in all)`:''}, when the market rate falls ${pct(p.refiTh,2).replace('%',' pts')} below yours`]);
  else if(p.refiOn)rows.push(['Refinancing',`not expected: the market rate path never falls ${pct(p.refiTh,2).replace('%',' pts')} below your rate`]);
  if(o.bal){const k=o.bal.findIndex((b,y)=>y>0&&b<=0.5);if(k>0&&k<p.term)rows.push(['Paid off',`year ${k} with the extra payments (term ${p.term} years)`])}
  return rows}
function renderLoan(o){const el=document.getElementById('loanT');if(!el)return;
  el.innerHTML='<tbody>'+loanRows(P,o).map(r=>`<tr><td>${r[0]}</td><td style="text-align:left;white-space:normal">${r[1]}</td></tr>`).join('')+'</tbody>'}
