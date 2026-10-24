/* ===================== Compare locations ===================== */
let LOC_MODE='same',LOC_SORT='gap',LOC_DIR=-1,LOC_SEL=null;
function locGrowth(m){
  // geometric-mean home and rent growth since the metro's data begins, and the national average over the same years
  const a=metroAnnual(m,true);const ms=metroStart(m);if(!a||!ms)return null;
  const from=Math.max(ms,1988),to=2025;
  const natRent=RENTL.map((v,i)=>i&&RENTL[i-1]?(v/RENTL[i-1]-1)*100:null);
  const locRent=HOME.map((_,i)=>{const v=m.rentG&&m.rentG[String(Y0+i)];return v==null?null:+v});
  const has=locRent.slice(from-Y0,to-Y0+1).filter(v=>v!=null).length>=10;
  return {from,gh:geo(a,from,to)/100,ghN:geo(HOME,from,to)/100,gr:has?geo(locRent,from,to)/100:null,grN:geo(natRent,from,to)/100}}
function locParams(base,m){
  const raw=getRaw();const q=Object.assign({},base);
  q.P=m.P||base.P;q.rent0=m.rent?Math.round(m.rent*bedRatio(m,raw.beds||'3')/10)*10:base.rent0;
  const lt=locTax(m);if(lt){q.ptax=lt.rate/100;q.hsEx=lt.ex;q.hsCredit=lt.credit}q.floodIns=m.flood?m.flood.avg:0;
  if(m.ins!=null&&isFinite(m.ins))q.ins=m.ins;q.ptaxCap=(m.ptaxCap||0)/100;q.ptaxCapCPI=!!m.ptaxCapCPI;
  if(raw.ttAuto==='auto'){const t=m.tt?transferTaxes(m.tt,q.P,q.P*(1-q.dp)):{buyer:0,seller:0};q.ttBuy=t.buyer/q.P;q.ttSell=t.seller/q.P;q.close=q.closeBase+q.ttBuy;q.sell=q.sellBase+q.ttSell}
  q.metro=m.slug;
  if((raw.stMode||'auto')==='auto'){const sti=stateIncomeTax(stateOf(m),q.income,q.filing,m.fips);if(sti){q.stTax=sti.tax;q.stRate=sti.rate;q.stDed=sti.itemize}}
  const g=LOC_MODE==='same'?null:locGrowth(m);
  if(g){if(LOC_MODE==='hist'){q.gh=g.gh;if(g.gr!=null)q.gr=g.gr}else{q.gh=base.gh+(g.gh-g.ghN);if(g.gr!=null)q.gr=base.gr+(g.gr-g.grN)}}
  return {q,g}}
function locRows(){
  const N=P.N;
  return METROS.filter(m=>!m.county).map(m=>{const {q,g}=locParams(P,m);const o=simulate(q,constPath(q,N));const c=o.cpi[N];
    const b=adj(o.buy[N],c),iv=adj(o.inv[N],c),own1=month1Cost(q);
    return {m,q,o,g,gap:b-iv,buy:b,inv:iv,own1,rent:q.rent0,ptr:q.P/(12*q.rent0),cash:q.P*(q.dp+q.close)+loanSetup(q,q.rate).ptsCost,
      hti:q.income?own1/(q.income/12):null,beY:breakevenYear(o),diff:own1-q.rent0}})}
function renderLoc(){
  if(!LOC_SEL){let s=null;try{s=JSON.parse(localStorage.getItem('rbi-loc')||'null')}catch(e){}LOC_SEL=Array.isArray(s)&&s.length?s:[...new Set([P.metro,'boston','raleigh','austin','minneapolis'])].slice(0,4)}
  const rows=locRows(),t=theme(),N=P.N;
  const key={name:r=>r.m.name,P:r=>r.q.P,rent:r=>r.rent,ptr:r=>r.ptr,own1:r=>r.own1,cash:r=>r.cash,hti:r=>r.hti??9,beY:r=>r.beY??99,gap:r=>r.gap}[LOC_SORT];
  rows.sort((a,b)=>{const x=key(a),y=key(b);return (typeof x==='string'?x.localeCompare(y):x-y)*LOC_DIR});
  const cols=[['name','Location'],['gap',`Buy − rent+invest, yr ${N}`],['beY','Buying pulls ahead'],['own1','Owning, month 1'],['hti','Housing ÷ income'],['P','Home price'],['rent','Rent'],['ptr','Price ÷ yearly rent'],['cash','Cash to buy']];
  const th=cols.map(([k,l])=>`<th><button type="button" class="srt${LOC_SORT===k?' on':''}" data-k="${k}" aria-label="Sort by ${l}">${l}${LOC_SORT===k?(LOC_DIR<0?' ▾':' ▴'):''}</button></th>`).join('');
  const mx=Math.max(...rows.map(r=>Math.abs(r.gap)),1);
  const body=rows.map(r=>{const on=LOC_SEL.includes(r.m.slug),cur=r.m.slug===P.metro;
    const hc=r.hti==null?'':r.hti<=0.28?'--buy':r.hti<=0.36?'--cash':'--neg';
    return `<tr class="${cur?'cur':''}"><td><label class="lsel"><input type="checkbox" data-s="${r.m.slug}" ${on?'checked':''}> ${r.m.name}${cur?' <span class="pill">yours</span>':''}</label></td>
    <td class="gapc"><span class="gbar" style="--w:${(Math.abs(r.gap)/mx*100).toFixed(1)}%;--c:var(${r.gap>=0?'--buy':'--inv'})"></span><span style="color:var(${r.gap>=0?'--buy':'--inv'})">${r.gap>=0?'+':'−'}${fmt(Math.abs(r.gap))}</span></td>
    <td>${r.beY?'year '+r.beY:'> '+N+' yrs'}</td><td>${fmtFull(r.own1)}</td><td>${r.hti==null?'—':`<span style="color:var(${hc})">${pct(r.hti,0)}</span>`}</td>
    <td>${fmt(r.q.P)}</td><td>${fmtFull(r.rent)}</td><td>${r.ptr.toFixed(1)}</td><td>${fmt(r.cash)}</td></tr>`}).join('');
  document.getElementById('locT').innerHTML=`<thead><tr>${th}</tr></thead><tbody>${body}</tbody>`;
  document.querySelectorAll('#locT .srt').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(LOC_SORT===k)LOC_DIR=-LOC_DIR;else{LOC_SORT=k;LOC_DIR=k==='name'?1:-1}renderLoc()});
  document.querySelectorAll('#locT input[data-s]').forEach(c=>c.onchange=()=>{const s=c.dataset.s;if(c.checked){if(LOC_SEL.length>=6){c.checked=false;document.getElementById('locMsg').textContent='Up to 6 locations in the chart.';return}LOC_SEL.push(s)}else LOC_SEL=LOC_SEL.filter(x=>x!==s);
    document.getElementById('locMsg').textContent='';try{localStorage.setItem('rbi-loc',JSON.stringify(LOC_SEL))}catch(e){}drawLoc(rows)});
  const g=rows.filter(r=>r.gap>=0).length,best=[...rows].sort((a,b)=>b.gap-a.gap)[0],worst=[...rows].sort((a,b)=>a.gap-b.gap)[0];
  const corr=(()=>{const x=rows.map(r=>r.ptr),y=rows.map(r=>r.gap),mx=x.reduce((a,b)=>a+b)/x.length,my=y.reduce((a,b)=>a+b)/y.length;let sxy=0,sx=0,sy=0;x.forEach((v,i)=>{sxy+=(v-mx)*(y[i]-my);sx+=(v-mx)**2;sy+=(y[i]-my)**2});return sxy/Math.sqrt(sx*sy)})();
  document.getElementById('loc-cap').innerHTML=`Same household in every location: your income, savings rate, down payment share, loan, federal tax settings and horizon (${N} years). What changes: home price, comparable ${P.beds==='any'?'':P.beds+'-bedroom '}rent, property tax, insurance${getRaw().ttAuto==='auto'?', transfer taxes':''}${(getRaw().stMode||'auto')==='auto'?', state income tax':''}${LOC_MODE==='same'?'':', and home and rent growth'}.`;
  document.getElementById('tk-loc').innerHTML=`<strong>Buying comes out ahead in ${g} of ${rows.length} locations</strong> at ${N} years. Best for buying: ${best.m.name} (${best.gap>=0?'+':'−'}${fmt(Math.abs(best.gap))}); best for renting: ${worst.m.name} (${worst.gap>=0?'+':'−'}${fmt(Math.abs(worst.gap))}). `+
    (isFinite(corr)?`Across locations the price-to-rent ratio and the buy advantage correlate at ${corr.toFixed(2)}: ${corr<-0.5?'where homes are expensive relative to rent, renting tends to win':'the ratio alone does not decide it here'}.`:'');
  drawLoc(rows);renderSbs()}
function drawLoc(rows){
  const t=theme(),N=P.N,sel=rows.filter(r=>LOC_SEL.includes(r.m.slug)),pal=[t.buy,t.inv,t.cash,t.rp,t.neg,t.ink];
  plot('p-loc',sel.map((r,i)=>({x:r.o.buy.map((_,k)=>k),y:r.o.buy.map((b,k)=>adj(b-r.o.inv[k],r.o.cpi[k])),mode:'lines',name:r.m.name,line:{color:pal[i%pal.length],width:r.m.slug===P.metro?3:2,dash:i>=3?'dot':'solid'},hovertemplate:'%{y:$,.0f}<extra>'+r.m.name+'</extra>'})),
    Object.assign(layout({hovermode:'x unified'}),{xaxis:X('Years'),yaxis:Yd('Buy − rent+invest ('+basisLabel()+')'),shapes:[{type:'line',xref:'paper',x0:0,x1:1,y0:0,y1:0,line:{color:t.muted,width:1}}]}));
  const lab=placeLabels(document.getElementById('p-locsc'),rows.map(r=>({x:r.ptr,y:r.gap,text:r.m.name,pri:(r.m.slug===P.metro?2e9:0)+(LOC_SEL.includes(r.m.slug)?1e9:0)+Math.abs(r.gap)})));
  plot('p-locsc',[{x:rows.map(r=>r.ptr),y:rows.map(r=>r.gap),text:lab.text,customdata:rows.map(r=>r.m.name),mode:'markers+text',textposition:lab.pos,textfont:{size:9,color:t.muted},
    marker:{size:rows.map(r=>r.m.slug===P.metro?12:8),color:rows.map(r=>r.gap>=0?t.buy:t.inv),line:{width:rows.map(r=>LOC_SEL.includes(r.m.slug)?1.5:0),color:t.ink}},hovertemplate:'%{customdata}<br>price ÷ yearly rent %{x:.1f}<br>buy − rent+invest %{y:$,.0f}<extra></extra>'}],
    Object.assign(layout(),{xaxis:{...X('Price ÷ yearly rent'),range:lab.xr},yaxis:{...Yd(`Buy − rent+invest at year ${N}, ${basisLabel()}`),range:lab.yr},showlegend:false,shapes:[{type:'line',xref:'paper',x0:0,x1:1,y0:0,y1:0,line:{color:t.muted,width:1}}]}))}
/* Point labels that don't collide: points are taken most important first and each label goes to the first of eight
   spots around its point whose box (estimated from the chart's size and fixed axis ranges) overlaps no placed label,
   no other point and stays inside the plot; a label with no free spot is left to the hover text. */
function placeLabels(el,pts){const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),px=(Math.max(...xs)-Math.min(...xs))||1,py=(Math.max(...ys)-Math.min(...ys))||1;
  const xr=[Math.min(...xs)-px*.06,Math.max(...xs)+px*.06],yr=[Math.min(...ys)-py*.08,Math.max(...ys)+py*.12];
  const W=Math.max(200,(el&&el.clientWidth||600)-110),H=Math.max(150,(el&&el.clientHeight||380)-100);
  const X=x=>(x-xr[0])/(xr[1]-xr[0])*W,Y=y=>(yr[1]-y)/(yr[1]-yr[0])*H,cw=5.2,ch=11,gap=6;
  const spots=[['top center',0,-1],['bottom center',0,1],['middle right',1,0],['middle left',-1,0],['top right',1,-1],['top left',-1,-1],['bottom right',1,1],['bottom left',-1,1]];
  const boxes=pts.map(p=>{const x=X(p.x),y=Y(p.y);return [x-5,y-5,x+5,y+5]}),hit=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
  const text=pts.map(()=>''),pos=pts.map(()=>'top center');
  pts.map((p,i)=>i).sort((a,b)=>pts[b].pri-pts[a].pri).forEach(i=>{const p=pts[i],x=X(p.x),y=Y(p.y),w=p.text.length*cw;
    for(const [name,dx,dy] of spots){const cx=x+dx*(gap+w/2),cy=y+dy*(gap+ch/2),b=[cx-w/2,cy-ch/2,cx+w/2,cy+ch/2];
      if(b[0]<0||b[2]>W||b[1]<0||b[3]>H)continue;
      if(boxes.some((o,j)=>j!==i&&hit(b,o)))continue;boxes.push(b);text[i]=p.text;pos[i]=name;break}});
  return {text,pos,xr,yr}}
function wireLoc(){wireSbs();document.querySelectorAll('#locMode button').forEach(b=>b.addEventListener('click',()=>{LOC_MODE=b.dataset.m;document.querySelectorAll('#locMode button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderLoc()}))}
