/* ===================== Monte Carlo ===================== */
/* Monte Carlo runs in a background worker built from the model script; falls back to the main thread */
let MC_REQ=0,WORKER=null,WORKER_OK=null;
function mcControls(){return {n:Math.max(200,Math.min(10000,parseInt(document.getElementById('mc-n').value)||1500)),bl:Math.max(1,parseInt(document.getElementById('mc-b').value)||5),
  from:parseInt(document.getElementById('mc-w').value),rc:document.getElementById('mc-rc').checked}}
// the horizon and risk aversion are read from finished results (any year up to 30), so changing them doesn't re-simulate
function mcKey(){const r=getRaw();delete r.N;delete r.gamma;return JSON.stringify(r)+REAL+JSON.stringify(mcControls())+(curMetro().hpi?'h':'')}
function mcSync(){if(!MC||!MC.pMoveH)return;const h=Math.max(1,Math.min(P.N,MC.N));if(MC.h===h)return;MC.h=h;MC.pMove=MC.pMoveH[h];MC.pForced=MC.pForcedH[h];mcHorizon(MC.res,h)}
function getWorker(){if(WORKER_OK===false)return null;if(WORKER)return WORKER;
  try{const src=document.getElementById('model-script').textContent+"\nonmessage=e=>{const {id,p,cfg}=e.data;try{postMessage({id,r:mcCore(p,cfg)})}catch(err){postMessage({id,err:String(err)})}}";
    WORKER=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
    WORKER.onmessage=e=>{const {id,r,err}=e.data;const job=PENDING[id];delete PENDING[id];if(!job)return;if(err){console.error(err);runLocal(job);return}job.done(r)};
    WORKER.onerror=e=>{console.error('worker',e.message);WORKER_OK=false;WORKER=null;Object.values(PENDING).forEach(runLocal);PENDING={}};
    WORKER_OK=true;return WORKER}catch(e){WORKER_OK=false;return null}}
let PENDING={};
function runLocal(job){setTimeout(()=>job.done(mcCore(job.p,job.cfg)),0)}
function startMC(full){
  const c=mcControls(),n=full?c.n:600,id=++MC_REQ,key=mcKey();
  const cfg={n,bl:c.bl,from:c.from,rc:c.rc,home:homeSeries(true),rent:rentSeries(true),real:REAL},p=P;
  const job={p,cfg,done:r=>{if(id!==MC_REQ)return;MC=Object.assign(r,{real:REAL,key,quick:!full,h:null});onMCReady()}};
  const w=getWorker();if(w){PENDING[id]=job;w.postMessage({id,p,cfg})}else runLocal(job);
}
function mcFresh(full){return MC&&MC.key===mcKey()&&(!full||!MC.quick)}
function onMCReady(){summary();if(CUR==='mc')drawMC();else if(CUR==='proj')renderProj()}
function runMC(){/* kept for compatibility */const c=mcControls();MC=Object.assign(mcCore(P,{n:c.n,bl:c.bl,from:c.from,rc:c.rc,home:homeSeries(true),real:REAL}),{real:REAL,key:mcKey(),quick:false})}
function q(a,f){const s=[...a].sort((x,y)=>x-y);const i=(s.length-1)*f,lo=Math.floor(i);return s[lo]+(s[Math.min(lo+1,s.length-1)]-s[lo])*(i-lo)}
function ce(ws,g,floor){const w=ws.map(v=>Math.max(floor,v));if(Math.abs(g-1)<1e-6)return Math.exp(w.reduce((a,v)=>a+Math.log(v),0)/w.length);
  const mx=Math.max(...w);const m=w.reduce((a,v)=>a+Math.pow(v/mx,1-g),0)/w.length;return mx*Math.pow(m,1/(1-g))}
function renderMC(){if(mcFresh(true)){drawMC();return}
  document.getElementById('mc-note').textContent='Running simulations…';startMC(true)}
function drawMC(){if(!MC)return;mcSync();
  const t=theme(),{res,N,n}=MC,h=Math.min(P.N,MC.N),x=[...Array(h+1)].map((_,k)=>k);
  document.getElementById('mc-note').textContent=`Own-home price risk ${pct(P.idio)} (${P.idioMode==='sale'?'one-time at sale':'compounding yearly'}) and moving risk ${pct(P.hz)}/yr are set under Life & risk preferences. Upkeep varies year to year around its average (coefficient of variation ${MAINT_CV}), so big repairs arrive in lumps. Mortgage-rate changes are sampled from the same years (observed 1973–2025; earlier years modeled from inflation changes, slope ${DM_FIT.b.toFixed(2)}, residual s.d. ${DM_FIT.s.toFixed(2)} pts).`;
  const band=(arr,name,col)=>{const cut=f=>x.map(y=>q(arr.map(a=>a[y]),f));const p5=cut(.05),p25=cut(.25),p50=cut(.5),p75=cut(.75),p95=cut(.95);
    return [{x,y:p95,mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip',legendgroup:name},
     {x,y:p5,mode:'lines',line:{width:0},fill:'tonexty',fillcolor:hexA(col,.12),showlegend:false,legendgroup:name,hoverinfo:'skip'},
     {x,y:p75,mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip',legendgroup:name},
     {x,y:p25,mode:'lines',line:{width:0},fill:'tonexty',fillcolor:hexA(col,.28),showlegend:false,legendgroup:name,hoverinfo:'skip'},
     {x,y:p50,mode:'lines',line:{color:col,width:2.6},name:name+' (median)',legendgroup:name,customdata:x.map((_,k)=>[p5[k],p95[k]]),hovertemplate:'%{y:$,.0f} <span style="opacity:.7">[5–95%: %{customdata[0]:$,.0f} – %{customdata[1]:$,.0f}]</span>'}]};
  plot('p-fan',[...band(res.cash,'Rent + T-bills',t.cash),...band(res.inv,'Rent + invest',t.inv),...band(res.buy,'Buy',t.buy)].concat(P.rentalOn&&res.rental.length?band(res.rental,'Rent + rental',t.rp):[]),{xaxis:X('Years from today'),yaxis:Yd('Net worth, '+basisLabel())});
  // risk table
  const W0=P.P*(P.dp+P.close),floor=Math.max(1000,0.01*W0);
  const stats=(arr,lq)=>{const w=arr.map(a=>a[h]);const sorted=[...w].sort((a,b)=>a-b);const k=Math.max(1,Math.floor(0.05*w.length));
    const mean=w.reduce((a,b)=>a+b,0)/w.length,sd=Math.sqrt(w.reduce((a,v)=>a+(v-mean)**2,0)/w.length);
    return {mean,med:q(w,.5),p5:q(w,.05),p95:q(w,.95),es:sorted.slice(0,k).reduce((a,b)=>a+b,0)/k,sd,ce:ce(w,P.gamma,floor),lq:lq?lq.filter(v=>v<3).length/lq.length:null}};
  const S={buy:stats(res.buy,res.lqMinB),inv:stats(res.inv,res.lqMinR),cash:stats(res.cash,null)};const KS=['buy','inv','cash'];if(P.rentalOn&&res.rental.length){S.rp=stats(res.rental,null);KS.push('rp')}
  /** @type {any[]} */const rows=[['Mean','mean',fmt],['Median','med',fmt],['5th percentile','p5',fmt],['95th percentile','p95',fmt],['Expected shortfall (worst 5%)','es',fmt],['Standard deviation','sd',fmt],[`Certainty equivalent (γ = ${P.gamma})`,'ce',fmt],['Liquid < 3 months of costs (first 5 yrs)','lq',v=>v==null?'—':pct(v,0)]];
  const best=k=>{const vals=KS.map(s=>S[s][k]);return k==='sd'||k==='lq'?null:Math.max(...vals)};
  document.getElementById('risk-cap').textContent=`At year ${h}, ${basisLabel()}, across ${n.toLocaleString()} paths. Floor of ${fmt(floor)} applied to wealth in the certainty equivalent.`;
  document.getElementById('riskT').innerHTML=`<thead><tr><th>Metric</th><th><span class="swatch" style="background:var(--buy)"></span>Buy</th><th><span class="swatch" style="background:var(--inv)"></span>Rent + invest</th><th><span class="swatch" style="background:var(--cash)"></span>Rent + T-bills</th>${KS.includes('rp')?'<th><span class="swatch" style="background:var(--rp)"></span>Rent + rental</th>':''}</tr></thead><tbody>`+
    rows.map(([lab,k,f])=>{const b=best(k);return `<tr${k==='ce'?' class="hl"':''}><td>${lab}</td>${KS.map(s=>`<td${b!=null&&S[s][k]===b?' style="color:var(--'+s+'-t)"':''}>${f(S[s][k])}</td>`).join('')}</tr>`}).join('')+
    // win shares compare two paths, so each sits in the column of the path it is about (not spread across all columns)
    `<tr><td>Chance buying beats rent + invest, fixed horizon</td><td>${pct(MC.pWin[h])}</td>${'<td></td>'.repeat(KS.length-1)}</tr><tr><td>Chance buying beats rent + invest, with ${pct(P.hz,0)}/yr chance of moving${P.stressMult>1||P.forcedDisc>0?', likelier and at a discount in bad years':''}</td><td>${pct(MC.pMove)}</td>${'<td></td>'.repeat(KS.length-1)}</tr>`+
    (MC.pWinR?`<tr><td>Chance the rental property beats rent + invest</td>${'<td></td>'.repeat(KS.length-1)}<td>${pct(MC.pWinR[h])}</td></tr>`:'')+'</tbody>';
  const xx=[...Array(N+1)].map((_,k)=>k);
  plot('p-prob',[{x:xx,y:MC.pWin,name:'vs rent + invest',mode:'lines',line:{color:t.inv,width:2.5},hovertemplate:'%{y:.0%}'},
    {x:xx,y:MC.pWinC,name:'vs rent + T-bills',mode:'lines',line:{color:t.cash,width:2.5,dash:'dot'},hovertemplate:'%{y:.0%}'},
    ...(MC.pWinR?[{x:xx,y:MC.pWinR,name:'rental property vs rent + invest',mode:'lines',line:{color:t.rp,width:2,dash:'dashdot'},hovertemplate:'%{y:.0%}'}]:[]),
    {x:[h],y:[MC.pMove],mode:'markers',name:'with moving risk',marker:{size:10,color:t.ink,symbol:'diamond'},hovertemplate:'with random moving: %{y:.0%}<extra></extra>'}],
    {xaxis:X('Horizon (years)'),yaxis:Yt('P(buy wins)',{tickformat:'.0%',range:[0,1]}),shapes:[{type:'line',x0:0,x1:N,y0:.5,y1:.5,line:{color:t.muted,dash:'dash',width:1}},{type:'line',x0:h,x1:h,y0:0,y1:1,line:{color:t.line,width:1}}]});
  const d=res.buy.map((b,s)=>b[h]-res.inv[s][h]);
  document.getElementById('mc-histcap').textContent=`Buy minus (rent + invest) at year ${h}. Median ${fmt(q(d,.5))}, 5th pct ${fmt(q(d,.05))}, 95th pct ${fmt(q(d,.95))}.`;
  // two series on the same bins, so the colour has a legend: paths where buying ends ahead and where renting does
  {const lo=Math.min(...d),hi=Math.max(...d),xb={start:lo,end:hi+1e-9,size:Math.max(1,(hi-lo)/60)};
  plot('p-mchist',[{x:d.filter(v=>v<=0),type:'histogram',xbins:xb,autobinx:false,name:'Renting ahead',marker:{color:hexA(t.inv,.8)},hovertemplate:'%{x}<br>%{y} paths<extra>renting ahead</extra>'},
    {x:d.filter(v=>v>0),type:'histogram',xbins:xb,autobinx:false,name:'Buying ahead',marker:{color:hexA(t.buy,.8)},hovertemplate:'%{x}<br>%{y} paths<extra>buying ahead</extra>'}],
    {hovermode:'closest',barmode:'overlay',bargap:0.02,xaxis:{...X('Buy − (rent + invest), '+basisLabel()),tickprefix:'$',tickformat:'~s'},yaxis:Yt('Paths'),shapes:[{type:'line',x0:0,x1:0,yref:'paper',y0:0,y1:1,line:{color:t.ink,width:1.5}}]})}
  const dm=Math.max(1,...d.map(Math.abs));
  plot('p-mcsc',[{x:res.gH,y:res.gP,mode:'markers',type:'scatter',marker:{size:4,color:d,cmin:-dm,cmax:dm,colorscale:divScale(t).map(([k,c],i)=>[k,i===4?t.muted:c]),opacity:.8,
    colorbar:advBar(t,`Buy − rent<br>at year ${h}`,'$')},hovertemplate:'home %{x:.1f}%/yr, portfolio %{y:.1f}%/yr<br>%{marker.color:$,.0f}<extra></extra>'}],
    {hovermode:'closest',xaxis:X(`Own-home appreciation, annualized over ${h} yr (%)`),yaxis:Yt('Portfolio return, annualized (%)')});
  const yr=[...Array(N)].map((_,k)=>k+1),rq=f=>yr.map((_,k)=>100*q(res.rates.map(a=>a[k]),f));
  const nref=res.refis.filter(v=>v>0).length/n,avgRef=res.refis.reduce((a,b)=>a+b,0)/n;
  {const B=res.buy.map(a=>a[h]),I=res.inv.map(a=>a[h]);
   tk('fan',`At year ${h}, the median future leaves ${fmt(q(B,.5))} if you buy and ${fmt(q(I,.5))} if you rent and invest. One in twenty futures leaves the buyer below ${fmt(q(B,.05))} (renter: ${fmt(q(I,.05))}).`);
   tk('prob',`Buying beats renting and investing in ${pct(MC.pWin[h],0)} of futures at ${nY(h)}${P.hz>0?`, or ${pct(MC.pMove,0)} once early moves are included (${pct(MC.pForced,0)} of futures have a move during a downturn)`:''}. `+winSpellText(MC.pWin,N)+` Against renting with T-bills it wins ${pct(MC.pWinC[h],0)}.`);
   const mean=d.reduce((a,b)=>a+b,0)/d.length,med=q(d,.5);
   tk('mchist',`The middle half of outcomes runs from ${fmt(q(d,.25))} to ${fmt(q(d,.75))}. `+(mean<med-0.05*Math.abs(med)?`The average (${fmt(mean)}) is below the median (${fmt(med)}): the downside tail for buying is longer than the upside.`:mean>med+0.05*Math.abs(med)?`The average (${fmt(mean)}) is above the median (${fmt(med)}): a few very good futures for buying pull it up.`:`Average and median are close (${fmt(mean)} vs ${fmt(med)}), so the outcomes are fairly symmetric.`));
   let a1=0,n1=0,a2=0,n2=0;res.gH.forEach((g,i)=>{const w=d[i]>0;if(g>res.gP[i]-4){n1++;if(w)a1++}else{n2++;if(w)a2++}});
   tk('mcsc',`When your home's yearly gain was no more than 4 points below the portfolio's, buying won ${n1?pct(a1/n1,0):'—'} of the time; when the portfolio beat the home by more than that, ${n2?pct(a2/n2,0):'—'}.`+(n1&&a1/n1>0.5?' Leverage is why the home doesn\'t need to match the portfolio to win.':''));
   const k=Math.min(5,N),hit=res.rates.filter(a=>Math.min(...a.slice(0,k))<=P.rate-P.refiTh).length/n;
   tk('mcrate',`In ${pct(hit,0)} of futures the market rate falls at least ${(P.refiTh*100).toFixed(2)} points below your ${pct(P.rate,2)} within ${nY(k)}${P.refiOn?`, triggering a refinance; ${pct(nref,0)} of paths refinance at least once (${avgRef.toFixed(2)} times on average)`:' (refinancing is off)'}.`)}
  plot('p-mcrate',[{x:yr,y:rq(.95),mode:'lines',line:{width:0},showlegend:false,hoverinfo:'skip'},{x:yr,y:rq(.05),mode:'lines',line:{width:0},fill:'tonexty',fillcolor:hexA(t.neg,isDark(t)?.3:.15),name:'5–95%',hoverinfo:'skip'},
    {x:yr,y:rq(.5),mode:'lines',line:{color:t.neg,width:2.5},name:'Median market rate',hovertemplate:'%{y:.2f}%'}],
    {xaxis:X('Years from today'),yaxis:Yt('30-year market rate',{ticksuffix:'%'})});
}

