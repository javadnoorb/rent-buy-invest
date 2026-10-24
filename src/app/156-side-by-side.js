/* ===================== Side by side: any two places ===================== */
/* Each place is a metro, a county or a ZIP code, resolved with the same data as the location picker. Both run the full
   model through locParams (so the growth mode of the Locations tab applies), and the table shows B − A for each line. */
let SBS=null;
function sbsResolve(v){v=(v||'').trim();if(!v)return Promise.resolve(null);
  const lv=v.toLowerCase(),m=METROS.find(x=>x.name.toLowerCase()===lv);if(m)return Promise.resolve(m);
  if(!COUNTIES)return Promise.resolve(null);
  if(/^\d{5}$/.test(v))return COUNTIES.zip?ensureZip(v):Promise.resolve(null);
  return loadCounties().then(rows=>{const r=rows.find(x=>x[1].toLowerCase()===lv);return r?countyMetro('cty:'+r[0]):null})}
function sbsSlug(slug){if(!slug)return Promise.resolve(null);const m=METROS.find(x=>x.slug===slug);if(m)return Promise.resolve(m);
  if(/^zip:/.test(slug))return ensureZip(slug.slice(4));if(/^cty:/.test(slug))return loadCounties().then(()=>countyMetro(slug));return Promise.resolve(null)}
function sbsRow(m){const {q}=locParams(P,m),N=P.N,o=simulate(q,constPath(q,N)),c=o.cpi[N],LS=loanSetup(q,q.rate),own1=month1Cost(q);
  return {m,q,o,gap:adj(o.buy[N]-o.inv[N],c),beY:breakevenYear(o),own1,rent:q.rent0,cash:q.P*(q.dp+q.close)+LS.ptsCost,
    tt:q.P*((q.ttBuy||0)+(q.ttSell||0)),ptr:q.P/(12*q.rent0),hti:q.income?own1/(q.income/12):null}}
function renderSbs(){const T=document.getElementById('sbsT');if(!T)return;
  if(!SBS){let s=null;try{s=JSON.parse(localStorage.getItem('rbi-sbs')||'null')}catch(e){}
    SBS=Array.isArray(s)&&s.length===2?s:[P.metro,(LOC_SEL||[]).find(x=>x!==P.metro)||(P.metro==='boston'?'austin':'boston')]}
  const dl=document.getElementById('sbsList');if(!dl.dataset.metros){dl.dataset.metros=1;dl.innerHTML=METROS.filter(m=>!m.county).map(m=>`<option value="${m.name}"></option>`).join('')}
  Promise.all(SBS.map(sbsSlug)).then(ms=>{
    ['sbsA','sbsB'].forEach((id,i)=>{const el=document.getElementById(id);if(document.activeElement!==el)el.value=ms[i]?ms[i].name:''});
    if(!ms[0]||!ms[1]){T.innerHTML='';document.getElementById('tk-sbs').textContent='Pick two places to compare.';return}
    const [a,b]=ms.map(sbsRow),N=P.N,sg=v=>v>=0?'+':'−',col=v=>`style="color:var(${v>=0?'--buy':'--inv'})"`;
    const dM=(x,y,f)=>{const d=y-x;return Math.abs(d)<0.5?'same':(d>0?'+':'−')+f(Math.abs(d))};
    /** @type {any[]} */const rows=[
      ['Home price',a.q.P,b.q.P,fmt],['Comparable rent',a.rent,b.rent,v=>fmtFull(v)+'/mo'],
      ['Price ÷ yearly rent',a.ptr,b.ptr,v=>v.toFixed(1),(x,y)=>(y-x>=0?'+':'−')+Math.abs(y-x).toFixed(1)],
      ['Property tax',a.q.ptax,b.q.ptax,v=>pct(v,2),(x,y)=>(y-x>=0?'+':'−')+(Math.abs(y-x)*100).toFixed(2)+' pts'],
      ['Homeowners insurance',a.q.ins,b.q.ins,v=>fmtFull(v)+'/yr'],
      ['Transfer taxes (buy + sell)',a.tt,b.tt,fmt],
      ['Cash to buy',a.cash,b.cash,fmt],['Owning, month 1',a.own1,b.own1,fmtFull],
      ['Housing ÷ income',a.hti,b.hti,v=>v==null?'—':pct(v,0),(x,y)=>x==null||y==null?'':(y-x>=0?'+':'−')+(Math.abs(y-x)*100).toFixed(0)+' pts']];
    T.innerHTML=`<thead><tr><th></th><th scope="col">${a.m.name}</th><th scope="col">${b.m.name}</th><th scope="col">B − A</th></tr></thead><tbody>`+
      `<tr class="sbs-head"><th scope="row">Buy − rent+invest, year ${N}</th><td ${col(a.gap)}>${sg(a.gap)}${fmt(Math.abs(a.gap))}</td><td ${col(b.gap)}>${sg(b.gap)}${fmt(Math.abs(b.gap))}</td><td>${dM(a.gap,b.gap,fmt)}</td></tr>`+
      `<tr><th scope="row">Buying pulls ahead</th><td>${a.beY?'year '+a.beY:'> '+N+' yrs'}</td><td>${b.beY?'year '+b.beY:'> '+N+' yrs'}</td><td></td></tr>`+
      rows.map(([l,x,y,f,df])=>`<tr><th scope="row">${l}</th><td>${f(x)}</td><td>${f(y)}</td><td>${df?df(x,y):dM(x,y,f)}</td></tr>`).join('')+'</tbody>';
    const w=(r)=>r.gap>=0?`buying comes out ahead by ${fmt(r.gap)}`:`renting and investing comes out ahead by ${fmt(-r.gap)}`;
    const why=/** @type {[string,number][]} */([['price',b.q.P/a.q.P-1],['rent',b.rent/a.rent-1]]).map(([k,v])=>`${k} ${v>=0?'+':'−'}${pct(Math.abs(v),0)}`).join(', ');
    const t=theme(),line=(r,c,dash)=>({x:r.o.buy.map((_,k)=>k),y:r.o.buy.map((v,k)=>adj(v-r.o.inv[k],r.o.cpi[k])),mode:'lines',name:r.m.name,line:{color:c,width:2.5,dash},hovertemplate:'%{y:$,.0f}<extra>'+r.m.name+'</extra>'});
    plot('p-sbs',[line(a,t.buy,'solid'),line(b,t.inv,'dot')],Object.assign(layout({hovermode:'x unified'}),{xaxis:X('Years'),yaxis:Yd('Buy − rent+invest ('+basisLabel()+')'),
      shapes:[{type:'line',xref:'paper',x0:0,x1:1,y0:0,y1:0,line:{color:t.muted,width:1}}]}));
    document.getElementById('tk-sbs').innerHTML=`<strong>${a.m.name}</strong>: ${w(a)}. <strong>${b.m.name}</strong>: ${w(b)}. Compared with ${a.m.name}, ${b.m.name} has ${why}${a.ptr&&b.ptr?`, so homes cost ${b.ptr>a.ptr?'more':'less'} relative to rent (${b.ptr.toFixed(1)} vs ${a.ptr.toFixed(1)} years of rent)`:''}.`;
  }).catch(()=>{document.getElementById('sbsMsg').textContent='Could not load county or ZIP data; check your connection.'})}
function wireSbs(){const msg=document.getElementById('sbsMsg');
  ['sbsA','sbsB'].forEach((id,i)=>{const el=document.getElementById(id);
    el.addEventListener('focus',()=>{if(COUNTIES&&!document.getElementById('sbsList').dataset.counties)loadCounties().then(rows=>{const dl=document.getElementById('sbsList');if(dl.dataset.counties)return;dl.dataset.counties=1;
      dl.insertAdjacentHTML('beforeend',rows.map(r=>`<option value="${r[1]}"></option>`).join(''))}).catch(()=>{})});
    const go=()=>sbsResolve(el.value).then(m=>{if(!m){msg.textContent=el.value.trim()?`No data for “${el.value.trim()}”. Pick a metro, a county from the list, or a 5-digit ZIP code.`:'';return}
      msg.textContent='';SBS[i]=m.slug;try{localStorage.setItem('rbi-sbs',JSON.stringify(SBS))}catch(e){}renderSbs()}).catch(()=>{msg.textContent='Could not load county or ZIP data; check your connection.'});
    el.addEventListener('change',go);el.addEventListener('keydown',e=>{if(e.key==='Enter')go()})});
  document.getElementById('sbsSwap').addEventListener('click',()=>{if(!SBS)return;SBS=[SBS[1],SBS[0]];try{localStorage.setItem('rbi-sbs',JSON.stringify(SBS))}catch(e){}renderSbs()})}
