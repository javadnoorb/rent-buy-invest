/* ===================== Chart takeaways ===================== */
/* Screen readers get each chart as one image named by its card title and described by the card's written takeaway
   (or its caption when there is none), so every chart has a text equivalent. */
function describeChart(el){if(el.getAttribute('role')==='img')return;const card=el.closest('.card');if(!card)return;
  const h=card.querySelector('h2,h3'),d=card.querySelector('[id^="tk-"]')||card.querySelector('.cap');
  el.setAttribute('role','img');el.setAttribute('aria-label',(h?h.childNodes[0].textContent.trim()+': ':'')+'chart');
  if(d){if(!d.id)d.id=el.id+'-desc';el.setAttribute('aria-describedby',d.id)}}
function tk(id,html,label){const el=document.getElementById('tk-'+id);if(el)el.innerHTML=html?`<strong>${label||'For your inputs:'}</strong> ${html}`:''}
const gapTxt=v=>`<span style="color:var(${v>=0?'--buy':'--inv'})">${v>=0?'buying ahead by ':'renting ahead by '}${fmt(Math.abs(v))}</span>`;
const nY=n=>`${n} year${n===1?'':'s'}`;
const sgnP=v=>`${v>=0?'+':'−'}${Math.abs(v).toFixed(0)}%`;

function month1Cost(p){const LS=loanSetup(p,p.rate),M=pmt(LS.L,LS.rate/12,p.term*12);
  const ins=LS.type==='fha'?LS.mip*LS.L/12:pmiRate(p,p.dp)*LS.L/12;
  return M+(ptaxOn(p,p.P)+p.maint*p.P+p.ins+p.floodIns)/12+p.hoa+p.utilDiff+ins}

