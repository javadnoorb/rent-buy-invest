/* ===================== Scenarios ===================== */
const SC_KEY='rbi-scen';
function loadSc(){try{return JSON.parse(localStorage.getItem(SC_KEY)||'[]')}catch(e){return []}}
function saveSc(a){try{localStorage.setItem(SC_KEY,JSON.stringify(a));return true}catch(e){return false}}
const SCOL=()=>{const t=theme();return [t.ink,t.buy,t.inv,t.cash,t.neg,t.accent,t.muted]};
function scenarioResult(raw){const p=parseP(raw);const o=simulate(p,constPath(p,30),{N:30});return {p,o}}
function renderScen(){
  const list=loadSc(),t=theme(),cols=SCOL();
  document.getElementById('scList').innerHTML=list.length?list.map((s,i)=>{const {p}=scenarioResult(s.raw);const m=METROS.find(x=>x.slug===p.metro);
    return `<div class="row"><span class="swatch" style="background:${cols[(i+1)%cols.length]}"></span><span class="nm">${escapeHtml(s.name)}</span><span class="meta">${m?m.name+' · ':''}${fmtFull(p.P)} · ${fmtFull(p.rent0)}/mo · ${pct(p.dp,0)} down · ${pct(p.rate,2)} · ${p.N} yr</span><button data-load="${i}">Load</button><button data-del="${i}">Delete</button></div>`}).join(''):'<p class="sub">No saved scenarios yet. Set up inputs, give them a name, and save.</p>';
  document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{setRaw(list[+b.dataset.load].raw);update()});
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{list.splice(+b.dataset.del,1);saveSc(list);renderScen()});
  renderCompare(list);
  const all=[{name:'Current inputs',raw:getRaw()}].concat(list);
  const results=all.map(s=>Object.assign({name:s.name},scenarioResult(s.raw)));
  plot('p-scen',results.map((r,i)=>({x:r.o.buy.map((_,k)=>k),y:r.o.buy.map((b,k)=>adj(b-r.o.inv[k],r.o.cpi[k])),name:r.name,mode:'lines',line:{color:cols[i%cols.length],width:i===0?3:2,dash:i===0?'solid':undefined},hovertemplate:'%{y:$,.0f}'})),
    {xaxis:X('Years'),yaxis:Yd('Buy − rent&invest, '+basisLabel()),shapes:[{type:'line',xref:'paper',x0:0,x1:1,y0:0,y1:0,line:{color:t.muted,width:1}}]});
  {const be=results.map(r=>({n:r.name,b:breakevenYear(r.o)}));const ok=be.filter(x=>x.b).sort((a,b)=>a.b-b.b);
   tk('scen',results.length<2?'Save a scenario to compare it with the current inputs.':(ok.length?`${escapeHtml(ok[0].n)} breaks even first (year ${ok[0].b}).`+(be.length>ok.length?` ${be.length-ok.length} scenario${be.length-ok.length>1?'s':''} never break${be.length-ok.length>1?'':'s'} even within 30 years.`:''):'No scenario breaks even within 30 years.'))}
  document.getElementById('scT').innerHTML='<thead><tr><th>Scenario</th><th>Horizon</th><th>Buy</th><th>Rent + invest</th><th>Gap</th><th>Break-even yr</th><th>P/R</th></tr></thead><tbody>'+
    results.map(r=>{const N=r.p.N,c=r.o.cpi[N],b=adj(r.o.buy[N],c),iv=adj(r.o.inv[N],c),be=breakevenYear(r.o);return `<tr><td>${escapeHtml(r.name)}</td><td>${N}</td><td>${fmt(b)}</td><td>${fmt(iv)}</td><td style="color:var(${b>=iv?'--buy':'--inv'})">${b>=iv?'+':''}${fmt(b-iv)}</td><td>${be||'>30'}</td><td>${(r.p.P/(r.p.rent0*12)).toFixed(1)}</td></tr>`}).join('')+'</tbody>';
}
function renderCompare(list){
  const opts=[{name:'Current inputs',raw:getRaw()}].concat(list);
  const sa=document.getElementById('cmpA'),sb=document.getElementById('cmpB');
  const fill=(sel,def)=>{const v=sel.value;sel.innerHTML=opts.map((o,i)=>`<option value="${i}">${escapeHtml(o.name)}</option>`).join('');sel.value=sel.dataset.touched&&v&&+v<opts.length?v:String(def)};
  fill(sa,0);fill(sb,Math.min(1,opts.length-1));
  const pick=i=>{const o=opts[+i];const {p,o:sim}=scenarioResult(o.raw);return {name:o.name,p,sim}};
  const A=pick(sa.value),B=pick(sb.value),t=theme();
  const stat=r=>{const N=r.p.N,c=r.sim.cpi[N],b=adj(r.sim.buy[N],c),iv=adj(r.sim.inv[N],c);
    const own1=month1Cost(r.p);
    const m=METROS.find(x=>x.slug===r.p.metro);
    return {loc:m?m.name:'—',price:r.p.P,rent:r.p.rent0,ptr:r.p.P/(r.p.rent0*12),N,b,iv,gap:b-iv,be:breakevenYear(r.sim),own1,cash:r.p.P*(r.p.dp+r.p.close),fe:r.p.income?own1/(r.p.income/12):null}};
  const a=stat(A),b=stat(B);
  /** @type {any[]} */const rows=[['Location','loc',v=>v],['Home price','price',fmtFull],['Rent','rent',v=>fmtFull(v)+'/mo'],['Price-to-rent','ptr',v=>v.toFixed(1)],['Horizon','N',v=>v+' yr'],
    ['Buy net worth','b',fmt,1],['Rent + invest net worth','iv',fmt,1],['Buy − rent&invest','gap',v=>`<span style="color:var(${v>=0?'--buy':'--inv'})">${v>=0?'+':''}${fmt(v)}</span>`,1],
    ['Break-even year','be',v=>v?v+' yr':'> 30',0,-1],['Owning, month 1','own1',v=>fmtFull(v)+'/mo',0,-1],['Cash to buy','cash',fmtFull,0,-1],['Housing / income','fe',v=>v==null?'n/a':pct(v,0),0,-1]];
  document.getElementById('cmpT').innerHTML=`<thead><tr><th></th><th>${escapeHtml(A.name)}</th><th>${escapeHtml(B.name)}</th></tr></thead><tbody>`+
    rows.map(([lab,k,f,hi,dir])=>{let ca='',cb='';if(hi||dir){const x=a[k]==null?null:a[k],y=b[k]==null?null:b[k];if(x!=null&&y!=null&&x!==y){const better=(dir===-1)?(x<y?'a':'b'):(x>y?'a':'b');if(better==='a')ca=' class="better"';else cb=' class="better"'}}
      return `<tr><td>${lab}</td><td${ca}>${f(a[k])}</td><td${cb}>${f(b[k])}</td></tr>`}).join('')+'</tbody>';
  const line=(r,col,dash,lab)=>{const o=r.sim;return [{x:o.buy.map((_,k)=>k),y:o.buy.map((v,k)=>adj(v,o.cpi[k])),name:`${lab}: buy`,mode:'lines',line:{color:t.buy,width:2.4,dash},hovertemplate:'%{y:$,.0f}'},
    {x:o.inv.map((_,k)=>k),y:o.inv.map((v,k)=>adj(v,o.cpi[k])),name:`${lab}: rent + invest`,mode:'lines',line:{color:t.inv,width:2.4,dash},hovertemplate:'%{y:$,.0f}'}]};
  tk('cmp',sa.value===sb.value?'Pick two different scenarios above, or save one first.':`${escapeHtml(A.name)}: ${gapTxt(a.gap)} at year ${a.N}. ${escapeHtml(B.name)}: ${gapTxt(b.gap)} at year ${b.N}.`);
  plot('p-cmp',[...line(A,null,'solid','A'),...line(B,null,'dot','B')],{xaxis:X('Years'),yaxis:Yd('Net worth, '+basisLabel())});
}

