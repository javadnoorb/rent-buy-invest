/* ===================== Chart takeaways ===================== */
/* Screen readers get each chart as one image named by its card title and described by the card's written takeaway
   (or its caption when there is none), so every chart has a text equivalent. */
function describeChart(el){if(el.getAttribute('role')==='img')return;const card=el.closest('.card');if(!card)return;
  const h=card.querySelector('h2,h3'),d=card.querySelector('[id^="tk-"]')||card.querySelector('.cap');
  el.setAttribute('role','img');el.setAttribute('aria-label',(h?h.childNodes[0].textContent.trim()+': ':'')+'chart');
  if(d){if(!d.id)d.id=el.id+'-desc';el.setAttribute('aria-describedby',d.id)}}
function tk(id,html,label){const el=document.getElementById('tk-'+id);if(el)el.innerHTML=html?`<strong>${label||'For your inputs:'}</strong> ${html}`:''}
/* the gap as words; within the headline's 'about even' band (0.5% of the price, or 2% of the larger outcome) it says so */
const isEven=(v,ref)=>Math.abs(v)<Math.max(0.005*P.P,0.02*Math.abs(ref||0));
const gapTxt=(v,ref)=>isEven(v,ref)?`about even (${v>=0?'buying':'renting'} ahead by only ${fmt(Math.abs(v))})`:`<span style="color:var(${v>=0?'--buy':'--inv'})">${v>=0?'buying ahead by ':'renting ahead by '}${fmt(Math.abs(v))}</span>`;
const nY=n=>`${n} year${n===1?'':'s'}`;
const sgnP=v=>Math.abs(v)<0.5?'about 0%':`${v>=0?'+':'−'}${Math.abs(v).toFixed(0)}%`;

function month1Cost(p){const LS=loanSetup(p,p.rate),M=pmt(LS.L,LS.rate/12,p.term*12);
  const ins=LS.type==='fha'?LS.mip*LS.L/12:pmiRate(p,p.dp)*LS.L/12;
  return M+(ptaxOn(p,p.P)+p.maint*p.P+p.ins+p.floodIns)/12+p.hoa+p.utilDiff+ins}

