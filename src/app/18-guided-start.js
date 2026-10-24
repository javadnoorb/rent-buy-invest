/* ===================== Guided start ===================== */
let WZ=0;
/* the dialog is modal: the page behind it is inert, so Tab stays inside it */
const wzInert=on=>document.querySelectorAll('body > *:not(#wizard):not(script)').forEach(e=>/** @type {any} */(e).inert=on);
function openWizard(){const w=document.getElementById('wizard');WZ=0;wzInert(true);
  const sel=document.getElementById('wz-metro');sel.innerHTML=document.getElementById('metro').innerHTML;
  // typing a county or ZIP needs the search box next to the main Location field, so the wizard offers listed places only
  sel.querySelectorAll('option[value="__county"]').forEach(o=>o.remove());sel.value=document.getElementById('metro').value;if(!sel.value&&sel.options.length)sel.selectedIndex=0;
  const g=id=>document.getElementById(id).value;
  document.getElementById('wz-P').value=g('P');document.getElementById('wz-rent').value=g('rent0');document.getElementById('wz-dp').value=g('dp');document.getElementById('wz-inc').value=g('income');document.querySelectorAll('#wizard [data-money]').forEach(fmtMoneyEl);
  document.getElementById('wz-N').value=g('N');document.getElementById('wz-Nl').textContent=g('N')+' years';
  w.hidden=false;wzShow();setTimeout(()=>sel.focus(),50)}
function wzShow(){document.querySelectorAll('.wz-step').forEach((el,i)=>el.hidden=i!==WZ);document.getElementById('wz-back').hidden=WZ===0;
  document.getElementById('wz-next').textContent=WZ===2?'Show my result':'Next';document.getElementById('wz-dots').innerHTML=[0,1,2].map(i=>`<span class="${i===WZ?'on':''}"></span>`).join('')}
function closeWizard(apply){const w=document.getElementById('wizard');w.hidden=true;wzInert(false);try{localStorage.setItem('rbi-wz','1')}catch(e){}
  if(!apply)return;const v=id=>document.getElementById(id).value;
  const set=(id,x)=>{x=unfmt(x);if(x!==''&&isFinite(parseFloat(x)))document.getElementById(id).value=x};
  set('P',v('wz-P'));set('rent0',v('wz-rent'));rentTyped();set('dp',v('wz-dp'));set('income',v('wz-inc'));document.getElementById('N').value=v('wz-N');update()}
function wireWizard(){
  document.getElementById('wz-metro').addEventListener('change',e=>{const m=METROS.find(x=>x.slug===e.target.value);document.getElementById('metro').value=e.target.value;applyMetro(e.target.value);
    if(m){document.getElementById('wz-P').value=m.P;document.getElementById('wz-rent').value=m.rent;document.querySelectorAll('#wizard [data-money]').forEach(fmtMoneyEl)}});
  document.getElementById('wz-N').addEventListener('input',e=>document.getElementById('wz-Nl').textContent=e.target.value+' year'+(e.target.value==='1'?'':'s'));
  document.getElementById('wz-next').addEventListener('click',()=>{if(WZ<2){WZ++;wzShow()}else closeWizard(true)});
  document.getElementById('wz-back').addEventListener('click',()=>{if(WZ>0){WZ--;wzShow()}});
  document.getElementById('wz-skip').addEventListener('click',()=>closeWizard(false));
  document.getElementById('openWizard').addEventListener('click',openWizard);
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('wizard').hidden)closeWizard(false)});
}

