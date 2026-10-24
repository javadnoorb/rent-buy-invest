/* ===================== Optimizer ===================== */
function renderOpt(){renderAfford();
  const t=theme(),p=P,DP=[0,3.5,5,10,15,20,25,30,40,50,60,80,100],H=[...Array(30)].map((_,k)=>k+1);
  const q0=Object.assign({},p,{term:OPT_TERM,rate:OPT_TERM===15?p.rate15:p.rate30});
  const res=DP.map(dp=>{const q=Object.assign({},q0,{dp:dp/100});const o=simulate(q,constPath(q,30),{N:30});return H.map(h=>adj(o.buy[h]-o.inv[h],o.cpi[h]))});
  const z=H.map((h,j)=>DP.map((_,i)=>res[i][j]));
  // colour range from the 90th percentile of |gap|, so a few extreme long-horizon cells saturate instead of washing out the rest
  const za=z.flat().map(Math.abs).sort((a,b)=>a-b),zmax=Math.max(1,za[Math.floor(za.length*0.9)]);
  const best=H.map((h,j)=>{let bi=0;DP.forEach((_,i)=>{if(res[i][j]>res[bi][j])bi=i});return DP[bi]});
  plot('p-opt',[{x:DP.map(String),y:H,z,type:'heatmap',zsmooth:'best',zmin:-zmax,zmax,colorscale:divScale(t),colorbar:advBar(t,'Buy − rent','$'),customdata:z.map(r=>r.map(v=>(100*v/p.P).toFixed(0))),hovertemplate:'%{x}% down, after %{y} yr: buy − rent %{z:$,.0f} (%{customdata}% of price)<extra></extra>'},
    {x:DP.map(String),y:H,z,type:'contour',contours:{start:0,end:0,size:1,coloring:'none'},line:{color:t.ink,width:1.5},showscale:false,hoverinfo:'skip'},
    {x:best.map(String),y:H,mode:'markers',marker:{size:7,color:t.ink,symbol:'circle'},name:'Best down payment',hovertemplate:'best at %{y} yr: %{x}% down<extra></extra>'}],
    {hovermode:'closest',showlegend:false,xaxis:{...X(`Down payment (%), ${OPT_TERM}-year loan`),type:'category'},yaxis:Yt('Horizon (years)'),annotations:advEnds(t)});
  const HS=[3,5,7,10,15,20,30];
  const solve=(h,key,lo,hi,map)=>{const q=Object.assign({},p,{N:h});const r=bisect(v=>advAt(q,map?map(v):{[key]:v}),lo,hi,32);return r};
  /** @type {any[]} */const rowsDef=[['Rent ($/mo)',h=>solve(h,'rent0',10,Math.max(500,p.rent0*6)),v=>fmtFull(v),fmtFull(p.rent0)],
    ['Home appreciation (%/yr)',h=>solve(h,'gh',-0.2,0.3),v=>pct(v),pct(p.gh)],
    ['Stock return (%/yr)',h=>p.ws>0?solve(h,'rs',-0.1,0.4):null,v=>pct(v),pct(p.rs)],
    ['Mortgage rate (%)',h=>solve(h,'rate',0.0,0.2,v=>({rate:v,rate30:v,rateLR:v})),v=>pct(v,2),pct(p.rate,2)],
    ['Home price ($)',h=>solve(h,'P',p.P*0.2,p.P*3),v=>fmtFull(v),fmtFull(p.P)]];
  const head=`<thead><tr><th>Break-even value</th><th>You</th>${HS.map(h=>`<th>${h} yr</th>`).join('')}</tr></thead>`;
  const body=rowsDef.map(([lab,f,fm,you])=>`<tr><td>${lab}</td><td>${you}</td>${HS.map(h=>{const v=f(h);return `<td>${v==null?'—':fm(v)}</td>`}).join('')}</tr>`).join('');
  const adv=`<tr class="hl"><td>Buy advantage now</td><td></td>${HS.map(h=>`<td>${fmt(advAt(p,{N:h}))}</td>`).join('')}</tr>`;
  document.getElementById('solveT').innerHTML=head+'<tbody>'+adv+body+'</tbody>';
  {const j=p.N-1,bdp=best[j],bi=DP.indexOf(bdp),bv=res[bi][j];const you=advAt(Object.assign({},p,{term:OPT_TERM,rate:OPT_TERM===15?p.rate15:p.rate30}),{}),sg=v=>(v>=0?'+':'')+fmt(v);
   const all=DP.map((_,i)=>res[i][j]),mono=all.every((v,i)=>i===0||v>=all[i-1]-1e-9),dec=all.every((v,i)=>i===0||v<=all[i-1]+1e-9);
   tk('opt',(Math.abs(bv-you)<p.P/100?`With a ${OPT_TERM}-year loan and a ${p.N}-year stay, your ${pct(p.dp,0)} down is already about as good as any down payment shown (${sg(you)} vs. renting). `:`With a ${OPT_TERM}-year loan and a ${p.N}-year stay, ${bdp}% down does best (${sg(bv)} vs. renting) against ${sg(you)} at your ${pct(p.dp,0)}. `)+
     (mono?'Putting more down always helps here, because the loan costs more than the portfolio earns after tax.':dec?'Putting less down helps here, because the portfolio is expected to earn more than the loan costs.':'The effect of the down payment is mixed: PMI below 20% and the rate-versus-return trade-off pull in different directions.'))}
}

