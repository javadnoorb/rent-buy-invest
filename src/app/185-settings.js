/* ===================== Settings panel: changed markers, reset, search ===================== */
/* Settings that only matter when another one is on: hidden (and indented under their parent while shown) otherwise.
   Hidden values are kept and still saved, and the model ignores them in that state, so hiding never changes a result. */
const DEPS=(()=>{const v=(r,id)=>parseFloat(unfmt(String(r[id]==null?'':r[id])))||0,on=(r,id)=>String(r[id])==='1';
  const conv=r=>r.loanType!=='fha',pmiOn=r=>conv(r)&&v(r,'dp')<20,refi=r=>on(r,'refiOn'),tax=r=>on(r,'taxOn'),hh=r=>v(r,'hhRent')>0,rental=r=>on(r,'rentalOn');
  return {armRate:r=>r.loanType==='arm',armYears:r=>r.loanType==='arm',armMargin:r=>r.loanType==='arm',
    fico:conv,pmi:pmiOn,pmiScale:pmiOn,pmiAppr:pmiOn,extraMode:r=>v(r,'extraPay')>0,
    rateLR:r=>refi(r)||r.moveMode==='buy',glide:r=>refi(r)||r.moveMode==='buy',refiTh:refi,refiCost:refi,
    ptaxCapCPI:r=>v(r,'ptaxCap')>0||on(r,'ptaxCapCPI'),rMoveCost:r=>v(r,'rMove')>0,broker:r=>v(r,'rMove')>0,
    spread:r=>v(r,'lev')>1,
    filing:tax,muMode:tax,mu:tax,stMode:tax,stTax:tax,oth:tax,stRate:tax,stDed:tax,ltcgMode:tax,ltcg:tax,
    hhShare:hh,hhVac:hh,dpR:rental,ratePrem:rental,vacR:rental,mgmt:rental,landShare:rental,
    moveYear:r=>r.moveMode!=='none',stressMult:r=>v(r,'hz')>0,forcedDisc:r=>v(r,'hz')>0,idioMode:r=>v(r,'idio')>0}})();
function syncDeps(){const r=getRaw();for(const [id,f] of Object.entries(DEPS)){const el=document.getElementById(id);if(!el)continue;const row=el.closest('.f');
  row.classList.add('dep');row.classList.toggle('dep-off',!f(r))}}
function baselineFor(id){const m=selMetro();const beds=document.getElementById('beds').value;
  if(m){if(id==='P'&&m.P)return m.P;if(id==='ptax'||id==='hsEx'||id==='hsCredit'){const lt=locTax(m);if(lt)return id==='ptax'?lt.rate:id==='hsEx'?lt.ex:lt.credit;return id==='ptax'?(m.ptax!=null?m.ptax:DEF.ptax):0}
    if(id==='ins'&&m.ins)return m.ins;if(id==='floodIns')return m.flood?m.flood.avg:0;if(id==='ptaxCap')return m.ptaxCap||0;if(id==='ptaxCapCPI')return m.ptaxCapCPI?'1':'0';if(id==='rent0'&&m.rent)return Math.round(m.rent*bedRatio(m,beds)/10)*10}
  return DEF[id]}
function isChanged(id){const el=document.getElementById(id);if(!el||el.disabled)return false;const base=baselineFor(id);
  if(el.tagName==='SELECT')return String(el.value)!==String(base);
  const v=parseFloat(unfmt(el.value));if(!isFinite(v))return true;return Math.abs(v-base)>1e-9*Math.max(1,Math.abs(base))}
function resetField(id){const el=document.getElementById(id);el.value=String(baselineFor(id));if(el.dataset.money!=null)fmtMoneyEl(el)}
function markChanged(){let total=0;const per=new Map();
  F.forEach(f=>{const id=f[1],el=document.getElementById(id);if(!el)return;const row=el.closest('.f'),ch=isChanged(id);row.classList.toggle('changed',ch);
    if(ch&&!row.classList.contains('dep-off')){total++;const d=row.closest('details');per.set(d,(per.get(d)||0)+1)}});
  document.querySelectorAll('aside details').forEach(d=>{const s=d.querySelector('summary');if(!s.dataset.base)s.dataset.base=s.textContent;const n=per.get(d)||0;
    s.innerHTML=`<span>${s.dataset.base}</span>${n?`<span class="gchg">${n} changed</span>`:''}`});
  document.getElementById('achg').innerHTML=total?`${total} setting${total>1?'s':''} changed from the defaults · <button type="button" class="linkbtn" id="resetAllTop">reset all</button>`:'All settings at their defaults for this location';
  const rb=document.getElementById('resetAllTop');if(rb)rb.onclick=()=>document.getElementById('reset').click()}
let GROUP_STATE=null;
function filterSettings(q){q=q.trim().toLowerCase();const groups=[...document.querySelectorAll('aside details')];
  if(q&&!GROUP_STATE)GROUP_STATE=groups.map(d=>d.open);
  let any=false;
  groups.forEach((d,gi)=>{let hits=0;d.querySelectorAll('.f').forEach(row=>{const txt=row.textContent.toLowerCase();const hit=!q||txt.includes(q);row.hidden=!hit;if(hit&&!row.classList.contains('dep-off'))hits++});
    const extra=d.querySelector('.presets');if(extra){extra.hidden=!!q;if(extra.nextElementSibling&&extra.nextElementSibling.classList.contains('hint'))extra.nextElementSibling.hidden=!!q}
    d.hidden=!!q&&!hits;if(q&&hits){d.open=true;any=true}});
  if(!q&&GROUP_STATE){groups.forEach((d,i)=>d.open=GROUP_STATE[i]);GROUP_STATE=null}
  document.getElementById('anone').hidden=!q||any}
function wireSettings(){
  F.forEach(f=>{const id=f[1],row=document.getElementById(id).closest('.f'),lab=row.querySelector('label');
    lab.insertAdjacentHTML('beforeend',` <button type="button" class="rst" data-rst="${id}" aria-label="Reset ${lab.textContent.trim()} to default">reset</button>`)});
  document.querySelector('aside').addEventListener('click',e=>{const b=e.target.closest('.rst');if(b){e.preventDefault();resetField(b.dataset.rst);if(b.dataset.rst==='beds')setRentFromBeds();update();return}
    const h=e.target.closest('.f .hint');if(h&&!e.target.closest('a'))h.classList.toggle('open')});
  document.getElementById('aq').addEventListener('input',e=>filterSettings(e.target.value));
  let saved=null;try{saved=JSON.parse(localStorage.getItem('rbi-groups')||'null')}catch(e){}
  const groups=[...document.querySelectorAll('aside details')];
  if(saved&&saved.length===groups.length)groups.forEach((d,i)=>d.open=saved[i]);
  groups.forEach(d=>d.addEventListener('toggle',()=>{if(GROUP_STATE)return;try{localStorage.setItem('rbi-groups',JSON.stringify(groups.map(x=>x.open)))}catch(e){}}));
}
