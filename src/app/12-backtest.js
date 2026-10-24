/* ===================== Backtest ===================== */
let HIST_RUNS=null,HIST_CMP='inv',HIST_RP='mine';  // HIST_CMP: buying compared with rent + invest ('inv') or rent + T-bills ('cash')
/* Starting rent. "Mine": every purchase starts at the user's rent-to-price ratio. "Historical": that ratio scaled by
   the national rent-to-price ratio in the purchase year relative to the latest year (BEA imputed rent of owner-occupied
   housing ÷ Fed Z.1 owner-occupied real estate value), so the place's own premium or discount is kept and the swings
   over time come from history; months interpolate between years. */
function rpRel(t){const R=RES.rentPrice;if(!R)return 1;const ks=Object.keys(R).map(Number),last=Math.max(...ks),y=Math.min(last,Math.max(Math.min(...ks),Math.floor(t))),f=Math.min(1,Math.max(0,t-y));
  const v=R[y]+(R[Math.min(last,y+1)]-R[y])*(y<last?f:0);return v/R[last]}
const histP=(p,t)=>HIST_RP==='hist'?Object.assign({},p,{rent0:p.rent0*rpRel(t)}):p;
/* One selected purchase year, shown to the latest data in the detail chart and highlighted above (its curve, its
   heat-map column). The slider or a click on a curve or a heat-map column picks it. */
function setHistSel(year){if(year!=null)document.getElementById('h-year').value=String(Math.floor(year));renderHist()}
let HIST_RAF=0;  // the slider redraws while dragged (the runs are cached)
function histSlide(){cancelAnimationFrame(HIST_RAF);HIST_RAF=requestAnimationFrame(()=>renderHist())}
function wireHistClicks(){const on=(id,f)=>{const el=/** @type {any} */(document.getElementById(id));if(el&&el.on&&!el.dataset.selw){el.dataset.selw=1;el.on('plotly_click',e=>{const pt=e&&e.points&&e.points[0];if(pt)f(pt)})}};
  on('p-hheat',pt=>setHistSel(pt.x));
  on('p-spag',pt=>{const run=HIST_RUNS&&HIST_RUNS.runs.find(q=>q.lab===pt.data.name);if(run)setHistSel(run.s)})}
function metroRentAnnual(m){if(!m||!m.rentG)return null;return YEARS.map(y=>m.rentG[y]!=null?m.rentG[y]:null)}
function rentSeries(useMetro){const ma=useMetro?metroRentAnnual(curMetro()):null;return RENTG.map((v,i)=>ma&&ma[i]!=null?ma[i]:v)}
function homeSeries(useMetro){const m=curMetro(),ma=useMetro?metroAnnual(m):null;return HOME.map((v,i)=>ma&&ma[i]!=null?ma[i]:v)}
function histPathAnnual(start,N,home,rent){const i0=start-Y0;const g=a=>a.slice(i0,i0+N).map(v=>v/100);
  return {gh:g(home),gr:g(rent||RENTG),rs:g(STK),rb:g(BOND),rc:g(BILL),inf:g(INF),mkt:[...Array(N)].map((_,k)=>{const y=start+k;return y>=MORT0&&y<=LAST_Y?MORT[y-MORT0]/100:null})}}
let MGH_ADJ=null;
function monthlyHome(){if(!VOLADJ||!MONTHLY.ghK||MONTHLY.ghK===1)return MONTHLY.gh;if(MGH_ADJ)return MGH_ADJ;
  const mean=MONTHLY.gh.reduce((a,b)=>a+b,0)/MONTHLY.gh.length;return MGH_ADJ=MONTHLY.gh.map(x=>mean+MONTHLY.ghK*(x-mean))}
function histPathMonthly(s,N){const k=N*12,sl=a=>a.slice(s,s+k);return {monthly:true,gh:sl(monthlyHome()),gr:sl(MONTHLY.gr),rs:sl(MONTHLY.rs),rb:sl(MONTHLY.rb),rc:sl(MONTHLY.rc),inf:sl(MONTHLY.inf),mkt:sl(MONTHLY.mkt)}}
function renderHist(){
  const t=theme(),p=P,useNow=document.getElementById('h-rate').value==='now',useMetro=document.getElementById('h-home').value==='metro';
  const mode=document.getElementById('h-mode').value==='monthly'&&MONTHLY?'monthly':'annual';
  const m=curMetro(),ms=metroStart(m);
  let note=`${mode==='monthly'?`Monthly data ${MONTHLY.dates[0]} to ${MONTHLY.dates.at(-1)}; national home prices from FHFA's purchase-only index${VOLADJ&&MONTHLY.ghK?`, swings scaled ×${MONTHLY.ghK.toFixed(2)} to Case-Shiller size`:''}.`:`Annual data. Home prices: ${useMetro&&ms?`${m.name} from ${ms}, national before that.`:'national.'} Rents: ${useMetro&&m.rentG?`${m.name} rent index where BLS publishes one, its region otherwise.`:'national.'}`} Refinancing ${p.refiOn?`on (when rates fall ${(p.refiTh*100).toFixed(2)} pts below your loan rate).`:'off.'}`;
  if(mode==='monthly'&&useMetro&&m.slug!=='us')note+=' Metro prices are available only in annual mode.';
  document.getElementById('h-note').textContent=note;
  // the runs depend only on these settings; picking a scenario reuses them and only redraws
  let runs=[];const hkey=JSON.stringify([mode,useNow,useMetro,VOLADJ,HIST_RP,p]);
  if(HIST_RUNS&&HIST_RUNS.key===hkey)runs=HIST_RUNS.runs;
  else{
  if(mode==='annual'){const home=homeSeries(useMetro),rentS=rentSeries(useMetro);
    for(let s=1972;s<=LAST_Y;s++){const N=Math.min(30,LAST_Y-s+1);const rate=useNow?p.rate:MORT[s-MORT0]/100;const o=simulate(histP(p,s),histPathAnnual(s,N,home,rentS),{N,rate});
      runs.push({s,lab:String(s),N,advI:o.buy.map((b,k)=>(b-o.inv[k])/o.cpi[k]/p.P*100),advC:o.buy.map((b,k)=>(b-o.cash[k])/o.cpi[k]/p.P*100),o,rate})}}
  else{const T=MONTHLY.gh.length;for(let s=0;s+12<=T;s++){const N=Math.min(30,Math.floor((T-s)/12));const rate=useNow?p.rate:MONTHLY.mkt[s];
      const d=MONTHLY.dates[s],o=simulate(histP(p,+d.slice(0,4)+(+d.slice(5,7)-1)/12),histPathMonthly(s,N),{N,rate});runs.push({s:+d.slice(0,4)+(+d.slice(5,7)-1)/12,lab:d,N,advI:o.buy.map((b,k)=>(b-o.inv[k])/o.cpi[k]/p.P*100),advC:o.buy.map((b,k)=>(b-o.cash[k])/o.cpi[k]/p.P*100),o,rate,jan:d.endsWith('-01')})}}
  HIST_RUNS={key:hkey,runs}}
  // which renter buying is compared with: both are stored, so the switch only redraws
  runs.forEach(q=>q.adv=HIST_CMP==='cash'?q.advC:q.advI);const cmpLab=HIST_CMP==='cash'?'rent + T-bills':'rent + invest';
  // the selected scenario: a purchase (one curve, one heat-map column) and how long it is held (one point, one cell)
  // the slider's range follows the data: purchase years with at least a year of history
  const yEl=document.getElementById('h-year'),yrs=mode==='annual'?runs.map(q=>q.s):runs.filter(q=>q.jan).map(q=>Math.floor(q.s));
  yEl.min=String(yrs[0]);yEl.max=String(yrs.at(-1));
  let ys=parseInt(yEl.value);if(!(ys>=yrs[0]&&ys<=yrs.at(-1)))ys=Math.min(yrs.at(-1),Math.max(yrs[0],2000));yEl.value=String(ys);
  const r=mode==='annual'?(runs.find(q=>q.s===ys)||runs.find(q=>q.s===2000)):(runs.find(q=>q.lab===`${ys}-01`)||runs[0]);
  const Nn=r.adv.length-1;document.getElementById('h-year-v').textContent=r.lab.replace(/-01$/,'');
  const lines=mode==='annual'?runs:runs.filter(r=>r.jan);
  // lines coloured by purchase year on a one-hue violet scale (not the buy/rent colours), with a colour bar for it
  const s0=lines[0].s,s1=lines.at(-1).s,seq=isDark(t)?SEQ_DARK:SEQ_LIGHT;
  const sp=/** @type {any[]} */(lines.map(r=>({x:r.adv.map((_,k)=>k),y:r.adv,mode:'lines',name:r.lab,showlegend:false,
    line:{width:1.3,color:hexA(seqAt(seq,(r.s-s0)/(s1-s0||1)),0.75)},hovertemplate:`bought ${r.lab}: %{y:.0f}%<extra></extra>`})));
  sp.push({x:[null],y:[null],mode:'markers',showlegend:false,hoverinfo:'skip',marker:{color:[s0,s1],cmin:s0,cmax:s1,colorscale:seq.map((c,i)=>[i/(seq.length-1),c]),showscale:true,
    colorbar:{title:cbTitle('Year of<br>purchase'),...CB_TICKS,thickness:10,outlinewidth:0,len:.74,tickformat:'d'}}});
  const med=[];for(let h=0;h<=30;h++){const v=runs.filter(r=>r.adv.length>h).map(r=>r.adv[h]).sort((a,b)=>a-b);if(v.length>=5)med.push([h,v[Math.floor(v.length/2)]])}
  sp.push({x:med.map(m=>m[0]),y:med.map(m=>m[1]),mode:'lines',name:'Median across starts',line:{color:t.muted,width:3.5},hovertemplate:'median %{y:.0f}%<extra></extra>'});
  sp.push({x:r.adv.map((_,k)=>k),y:r.adv,mode:'lines',name:`Bought ${r.lab} (selected)`,line:{color:t.ink,width:3},hovertemplate:`bought ${r.lab}: %{y:.0f}%<extra></extra>`});
  plot('p-spag',sp,{hovermode:'closest',xaxis:X('Years after purchase'),yaxis:Yt(`Buy − (${cmpLab}), % of purchase price, after inflation`,{ticksuffix:'%'})});
  const H=[...Array(30)].map((_,k)=>k+1),xs=runs.map(r=>r.s);
  const z=H.map(h=>runs.map(r=>r.adv.length>h?r.adv[h]:null));
  const zmax=Math.min(150,Math.max(1,...z.flat().filter(v=>v!=null).map(Math.abs)));
  const win=runs.filter(r=>r.adv.length>p.N),share=win.filter(r=>r.adv[p.N]>0).length/(win.length||1);
  plot('p-hheat',[{x:xs,y:H,z,type:'heatmap',zsmooth:'best',zmin:-zmax,zmax,colorscale:divScale(t),hoverongaps:false,colorbar:advBar(t,'Buy − rent,<br>% of purchase<br>price','%'),
    customdata:H.map(()=>runs.map(r=>r.lab)),hovertemplate:'bought %{customdata}, after %{y} yr: buy − rent %{z:.0f}% of the purchase price<extra></extra>'},
    zeroContour(xs,H,z,t)],
    {hovermode:'closest',xaxis:X('Year of purchase'),yaxis:Yt('Horizon (years)'),annotations:advEnds(t),
     shapes:[(w=>({type:'rect',x0:r.s-w,x1:r.s+w,y0:.5,y1:Nn+.5,line:{color:t.ink,width:2},fillcolor:'rgba(0,0,0,0)'}))(mode==='annual'?.5:1/24)]});
  {const at=win.map(r=>({lab:r.lab,v:r.adv[p.N]})).sort((a,b)=>a.v-b.v);
   if(at.length){const md=at[Math.floor(at.length/2)].v,w=at[0],bst=at.at(-1);
     tk('spag',`Over ${at.length} historical starts with at least ${nY(p.N)} of data, buying beat ${cmpLab} ${pct(share,0)} of the time. The median outcome was ${sgnP(md)} of the price; the worst was ${sgnP(w.v)} (bought ${w.lab}) and the best ${sgnP(bst.v)} (bought ${bst.lab}).${HIST_RP==='hist'?` Starting rent follows history: your ${pct(p.rent0*12/p.P,1)} of the price a year scaled by the national rent-to-price ratio then, e.g. ${pct(p.rent0*12/p.P*rpRel(1980),1)} for a 1980 purchase and ${pct(p.rent0*12/p.P*rpRel(2006),1)} for 2006.`:''}${HIST_CMP==='cash'&&HIST_RP==='mine'?` The result hinges on the rent-to-price ratio: every purchase here starts at your price and rent (rent ${pct(p.rent0*12/p.P,1)} of the price a year), and history moves both from there. With rent at about 5% of the price, the level a published study used for 1978–2001, renting with T-bills won about two-thirds of 8-year holds, and this model agrees (Method: Checked against a published study). Try Starting rent: Historical.`:''}`,'In history:');
     const decs={};runs.forEach(r=>{if(r.adv.length>p.N){const d=Math.floor(r.s/10)*10;(decs[d]=decs[d]||[]).push(r.adv[p.N]>0)}});
     tk('hheat',`Buying beat ${cmpLab} in ${pct(share,0)} of ${win.length} starts at your ${p.N}-year horizon. By decade bought: `+Object.entries(decs).map(([d,a])=>`${d}s ${pct(a.filter(Boolean).length/a.length,0)}`).join(' · ')+'.','In history:')}
   else{tk('spag','Not enough history for this horizon; shorten it to see results.','In history:');tk('hheat','')}}
  // the detail runs from the purchase to the latest data (the runs above stop at 30 years, the heat map's height)
  const dk=r.lab,det=HIST_RUNS.det||(HIST_RUNS.det={});
  if(!det[dk]){if(mode==='annual'){const n=LAST_Y-r.s+1;det[dk]=simulate(histP(p,r.s),histPathAnnual(r.s,n,homeSeries(useMetro),rentSeries(useMetro)),{N:n,rate:r.rate})}
    else{const i0=MONTHLY.dates.indexOf(r.lab),n=Math.floor((MONTHLY.gh.length-i0)/12);det[dk]=simulate(histP(p,r.s),histPathMonthly(i0,n),{N:n,rate:r.rate})}}
  const o=det[dk],Nd=o.buy.length-1,x=o.buy.map((_,k)=>Math.floor(r.s)+k),thru=Math.floor(r.s)+Nd-1,advEnd=(o.buy[Nd]-o.inv[Nd])/o.cpi[Nd]/p.P*100;
  document.getElementById('h-detail-cap').textContent=`Bought ${r.lab} at ${(r.rate*100).toFixed(2)}%, starting rent ${fmtFull(histP(p,r.s).rent0)}/mo (${pct(histP(p,r.s).rent0*12/p.P,1)} of the price a year${HIST_RP==='hist'?', historical':''})${o.refis?`, refinanced ${o.refis}× (last rate ${(o.rateAt.at(-1)*100).toFixed(2)}%)`:''}. Real dollars; today's price and rent scaled by the historical paths.`;
  const tr=(a,n,c,d)=>({x,y:a.map((v,k)=>v/o.cpi[k]),name:n,mode:'lines',line:{color:c,width:2.5,dash:d},hovertemplate:'%{y:$,.0f}'});
  {const g=(o.buy[Nd]-o.inv[Nd])/o.cpi[Nd],gc=(o.buy[Nd]-o.cash[Nd])/o.cpi[Nd];tk('hdet',`Bought ${r.lab} and held through ${thru} (${nY(Nd)}), in today's dollars: against renting and investing, ${gapTxt(g)} (${advEnd>=0?'+':'−'}${Math.abs(advEnd).toFixed(0)}% of the price); against renting and keeping savings in T-bills, ${gapTxt(gc)}.${o.refis?` The buyer refinanced ${o.refis} time${o.refis>1?'s':''} along the way.`:''}`,'This purchase:')}
  plot('p-hdet',[tr(o.buy,'Buy',t.buy),tr(o.inv,'Rent + invest',t.inv),tr(o.cash,'Rent + T-bills',t.cash,'dot'),
    {x,y:o.rateAt.map(v=>v*100),name:'Loan rate',yaxis:'y2',mode:'lines',line:{color:t.neg,width:1.2,shape:'hv'},hovertemplate:'%{y:.2f}%'}],
    {xaxis:X('Year'),yaxis:Yd("Net worth, today's $"),yaxis2:{overlaying:'y',side:'right',title:{text:'Loan rate',font:{size:11}},ticksuffix:'%',showgrid:false,tickfont:{family:'IBM Plex Mono',color:t.neg}},margin:{l:64,r:44,t:10,b:innerWidth<600?72:48}});
  wireHistClicks()
}

