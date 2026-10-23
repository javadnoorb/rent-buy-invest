/* ===================== Snapshot ===================== */
function buildSnap(){
  document.getElementById('snap').innerHTML=SNAP.items.map(c=>`<div class="chip"><span class="k"><span class="kt" title="${c.k}">${c.k}</span></span><span class="v">${c.v}</span><span class="s muted">${c.s}${c.field==='rent0'?' · all home sizes; “use” scales it to your bedrooms':''} · ${sl(c.src)}${c.field?` · <a href="#" class="use" data-f="${c.field}" data-v="${c.val}">use</a>`:''}</span></div>`).join('')+
    `<div class="chip"><span class="k"><span class="kt">Data as of</span></span><span class="v">${SNAP.asOf}</span><span class="s muted">${dataAgeText()}</span></div>`;
  staleNotice();
  document.querySelectorAll('.use').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const v=a.dataset.f==='rent0'?Math.round(a.dataset.v*bedRatio(null,document.getElementById('beds').value)/10)*10:a.dataset.v;document.getElementById(a.dataset.f).value=v;update()}));
}
function bedRatio(m,b){if(b==='any')return 1;const k=b==='4'?'4':b;const r=(m&&m.acs&&m.acs.beds&&m.acs.beds[k])||(D0.bedRatio&&D0.bedRatio[k]);return r||1}
function selMetro(){return METROS.find(x=>x.slug===document.getElementById('metro').value)||METROS[0]}
function setRentFromBeds(m){m=m||selMetro();const b=document.getElementById('beds').value,base=m.rent;if(!base)return;
  document.getElementById('rent0').value=Math.round(base*bedRatio(m,b)/10)*10}
function applyTT(){const auto=document.getElementById('ttAuto').value==='auto',eb=document.getElementById('ttBuy'),es=document.getElementById('ttSell');
  eb.disabled=es.disabled=auto;if(!auto)return;const m=selMetro();
  if(!m||!m.tt){eb.value=0;es.value=0;return}
  const P=numOf('P')||0,dp=(parseFloat(document.getElementById('dp').value)||0)/100,L=P*(1-dp);
  const t=transferTaxes(m.tt,P,L);eb.value=P?(t.buyer/P*100).toFixed(3):0;es.value=P?(t.seller/P*100).toFixed(3):0}
function buildMetroSelect(){const sel=document.getElementById('metro');sel.innerHTML=METROS.map(m=>`<option value="${m.slug}">${m.name}</option>`).join('')}
function applyMetro(slug){const m=METROS.find(x=>x.slug===slug);if(!m)return;
  const set=(id,v)=>{if(v!=null&&isFinite(v))document.getElementById(id).value=v};
  set('P',m.P);set('ptax',m.acs&&m.acs.rate!=null?m.acs.rate:m.ptax);set('ins',m.ins);set('ptaxCap',m.ptaxCap||0);setRentFromBeds(m);
  const ms=metroStart(m),btn=document.getElementById('metroPreset');btn.hidden=!ms;if(ms)btn.textContent=`${m.name} ${ms}–2025 avg`;
  updateMetroHints(m);}
function updateMetroHints(m){
  const hint=(id,html)=>{const el=document.getElementById(id);const h=el&&el.closest('.f').querySelector('.hint');if(h)h.innerHTML=html};
  const base=Object.fromEntries(F.map(f=>[f[1],f[5]]));
  if(m.slug==='us'){['P','rent0','ptax','ins'].forEach(k=>hint(k,base[k]));return}
  const d=x=>x&&x.d?` (${x.d})`:'';
  hint('P',`${m.name}: ${m.src.price?m.src.price.t:''}${d(m.src.price)} ${srcObj(m.src.price)}`);
  hint('rent0',`${m.name}: ${m.src.rent?m.src.rent.t:''}${d(m.src.rent)} ${srcObj(m.src.rent)} · use a rental comparable to the home`);
  hint('ptax',`${m.src.ptax?m.src.ptax.t:''} ${srcObj(m.src.ptax)}`);
  hint('ins',`${m.src.ins?m.src.ins.t:''} ${srcObj(m.src.ins)}`);
  if(m.acs&&m.acs.rate!=null)hint('ptax',`${m.acs.name}: median tax ÷ median value, Census ACS ${m.acs.year} ${linkTo(m.acs.u)}${m.src.ptax?` · main county: ${m.src.ptax.t} ${srcObj(m.src.ptax)}`:''}`);
  hint('rent0',`${m.name}: ${m.src.rent?m.src.rent.t:''}${d(m.src.rent)} ${srcObj(m.src.rent)} × Census ratio for the chosen bedrooms`);
  const tts=document.getElementById('ttBuy').closest('.f').querySelector('.hint');if(tts)tts.innerHTML=m.ttSrc&&m.ttSrc.length?`${m.name}: `+m.ttSrc.map(x=>`${x.t} ${linkTo(x.u)}`).join(' · '):'no transfer taxes found for this location';
}


function dataAgeDays(){const d=new Date(SNAP.asOf+'T12:00:00');return isFinite(d)?Math.floor((Date.now()-d)/864e5):0}
function dataAgeText(){const n=dataAgeDays();return n<=1?'updated today':n<14?`${n} days ago`:n<60?`${Math.round(n/7)} weeks ago`:`${Math.round(n/30)} months ago`}
function staleNotice(){const n=dataAgeDays();let el=document.getElementById('stale');
  const off=typeof navigator!=='undefined'&&navigator.onLine===false;
  if(n<21&&!off){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='stale';el.className='stale';el.setAttribute('role','status');document.getElementById('snap').insertAdjacentElement('beforebegin',el)}
  const when=new Date(SNAP.asOf+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  el.innerHTML=(n>=21?`<strong>Market data is from ${when}</strong>, ${dataAgeText()}. Mortgage rates and prices may have moved since; check today's rate with a lender or the linked sources and enter it in the settings.`:'')+
    (off?`${n>=21?' ':''}<strong>Offline</strong>: using the data saved with the app.`:'')}
addEventListener('online',()=>{try{staleNotice()}catch(e){}});addEventListener('offline',()=>{try{staleNotice()}catch(e){}});
