/* ===================== Chart takeaways ===================== */
function tk(id,html,label){const el=document.getElementById('tk-'+id);if(el)el.innerHTML=html?`<strong>${label||'For your inputs:'}</strong> ${html}`:''}
const gapTxt=v=>`<span style="color:var(${v>=0?'--buy':'--inv'})">${v>=0?'buying ahead by ':'renting ahead by '}${fmt(Math.abs(v))}</span>`;
const nY=n=>`${n} year${n===1?'':'s'}`;
const sgnP=v=>`${v>=0?'+':'−'}${Math.abs(v).toFixed(0)}%`;

function month1Cost(p){const LS=loanSetup(p,p.rate),M=pmt(LS.L,LS.rate/12,p.term*12);
  const ins=LS.type==='fha'?LS.mip*LS.L/12:(p.dp<0.2?p.pmi*LS.L/12:0);
  return M+(p.ptax*p.P+p.maint*p.P+p.ins+p.floodIns)/12+p.hoa+p.utilDiff+ins}

