/* ===================== Data tab ===================== */
let dataDone=false;
function renderData(){
  const t=theme(),x=[1927,...YEARS];
  const cum=a=>{let v=1;const out=[1];a.forEach((r,i)=>{v*=(1+r/100);out.push(v/(CPIL[i+1]/CPIL[0]))});return out};
  plot('p-cum',[
    {x,y:cum(STK),name:'S&P 500 (total return)',line:{color:t.inv,width:2.3},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(BOND),name:'10-yr Treasury',line:{color:t.accent,width:1.6,dash:'dash'},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(BILL),name:'T-bills',line:{color:t.cash,width:1.6,dash:'dot'},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(HOME),name:'Home prices',line:{color:t.buy,width:2.3},hovertemplate:'%{y:$,.2f}'},
    {x,y:cum(RENTG),name:'Rent (CPI)',line:{color:t.neg,width:1.6},hovertemplate:'%{y:$,.2f}'}],
    {yaxis:Yt('Real value of $1 (log)',{type:'log',tickprefix:'$'}),xaxis:layout().xaxis});
  const m=curMetro(),ma=metroAnnual(m,true),ms=metroStart(m);
  if(ma&&ms){const yrs=YEARS.filter(y=>y>=ms);const idx=(a)=>{let v=100;return [100].concat(yrs.map(y=>{const i=y-Y0;v*=(1+a[i]/100)/(1+INF[i]/100);return v}))};
    document.getElementById('metro-cap').innerHTML=`Real home-price index, ${m.name} vs. national, rebased to 100 at end of ${ms-1}. Metro ${m.hpiSrc?m.hpiSrc.t:''} ${srcObj(m.hpiSrc)}. Metro annualized real growth ${pct(Math.pow(idx(ma).at(-1)/100,1/yrs.length)-1)}; national ${pct(Math.pow(idx(HOME).at(-1)/100,1/yrs.length)-1)}.`;
    {const a=idx(ma).at(-1),b=idx(HOME).at(-1);let pk=0,dd=0,v=100;idx(ma).forEach(x=>{if(x>pk)pk=x;dd=Math.min(dd,x/pk-1)});tk('metro',`Since ${ms-1}, ${m.name} home prices grew ${pct(Math.pow(a/100,1/yrs.length)-1)} a year after inflation vs. ${pct(Math.pow(b/100,1/yrs.length)-1)} nationally. Its worst fall from a peak, after inflation, was ${pct(-dd,0)}.`,'What stands out:')}
    plot('p-metro',[{x:[ms-1,...yrs],y:idx(ma),name:m.name,line:{color:t.buy,width:2.5},hovertemplate:'%{y:.0f}'},{x:[ms-1,...yrs],y:idx(HOME),name:'National',line:{color:t.muted,width:2,dash:'dash'},hovertemplate:'%{y:.0f}'}],{yaxis:Yt('Real index')})}
  else{document.getElementById('metro-cap').textContent='Choose a location in the top card to compare its home prices with the national index.';
    plot('p-metro',[{x:x.slice(60),y:cum(HOME).slice(60),name:'National home prices (real)',line:{color:t.buy,width:2.3}}],{yaxis:Yt('Real value of $1')})}
  {const c=cum(STK).at(-1),h=cum(HOME).at(-1),bb=cum(BOND).at(-1),n=YEARS.length;
   tk('cum',`After inflation, $1 in stocks in 1927 became $${c.toFixed(0)} (${pct(Math.pow(c,1/n)-1)} a year), in Treasury bonds $${bb.toFixed(1)}, and in home prices only $${h.toFixed(1)} (${pct(Math.pow(h,1/n)-1)} a year).`,'What stands out:')}
  const roll=a=>YEARS.map((_,i)=>{if(i<9)return null;let l=0;for(let k=i-9;k<=i;k++)l+=Math.log((1+a[k]/100)/(1+INF[k]/100));return (Math.exp(l/10)-1)*100});
  {const rs=roll(STK).filter(v=>v!=null),rh=roll(HOME).filter(v=>v!=null);
   tk('roll',`Stocks lost money after inflation over ${pct(rs.filter(v=>v<0).length/rs.length,0)} of 10-year windows; home prices over ${pct(rh.filter(v=>v<0).length/rh.length,0)}. Stocks' 10-year real return ranged from ${(Math.min(...rs)).toFixed(1).replace('-','−')}% to ${Math.max(...rs).toFixed(1)}% a year.`,'What stands out:')}
  plot('p-roll',[{x:YEARS,y:roll(STK),name:'Stocks',line:{color:t.inv,width:2},hovertemplate:'%{y:.1f}%'},{x:YEARS,y:roll(HOME),name:'Home prices',line:{color:t.buy,width:2},hovertemplate:'%{y:.1f}%'},{x:YEARS,y:roll(RENTG),name:'Rent',line:{color:t.neg,width:1.5},hovertemplate:'%{y:.1f}%'}],
    {yaxis:Yt('Real, annualized',{ticksuffix:'%'})});
  const ks=[['Home','gh'],['Rent','gr'],['Stocks','rs'],['Bonds','rb'],['Bills','rc'],['CPI','inf'],['Δ Mortgage','dm']];
  const getS=k=>k==='dm'?DM_OBS:SER[k];
  const corr=(a,b)=>{const pr=[];a.forEach((v,i)=>{if(v!=null&&b[i]!=null)pr.push([v,b[i]])});const n=pr.length,ma=pr.reduce((s,v)=>s+v[0],0)/n,mb=pr.reduce((s,v)=>s+v[1],0)/n;let sab=0,sa=0,sb=0;pr.forEach(([u,v])=>{sab+=(u-ma)*(v-mb);sa+=(u-ma)**2;sb+=(v-mb)**2});return sab/Math.sqrt(sa*sb)};
  const z=ks.map(([,a])=>ks.map(([,b])=>corr(getS(a),getS(b))));
  plot('p-corr',[{x:ks.map(k=>k[0]),y:ks.map(k=>k[0]),z,type:'heatmap',zmin:-1,zmax:1,colorscale:divScale(t),text:z.map(r=>r.map(v=>v.toFixed(2))),texttemplate:'%{text}',textfont:{family:'IBM Plex Mono',size:10},showscale:false,hovertemplate:'%{y} × %{x}: %{z:.2f}<extra></extra>'}],
    {hovermode:'closest',margin:{l:76,r:10,t:10,b:60},yaxis:{autorange:'reversed',tickfont:{color:t.ink}},xaxis:{tickfont:{color:t.ink},tickangle:-40}});
  {const ci=ks.findIndex(k=>k[1]==='gh'),si=ks.findIndex(k=>k[1]==='rs'),ii=ks.findIndex(k=>k[1]==='inf');
   tk('corr',`Home prices and stocks: ${z[ci][si].toFixed(2)} (close to unrelated). Home prices and inflation: ${z[ci][ii].toFixed(2)}, a partial inflation hedge.`,'What stands out:')}
  const my=MORT.map((_,i)=>MORT0+i);
  plot('p-mort',[{x:my,y:MORT,name:'30-yr fixed (annual avg)',line:{color:t.neg,width:2.3},hovertemplate:'%{y:.2f}%'},{x:my,y:INF.slice(MORT0-Y0),name:'CPI inflation',line:{color:t.cash,width:1.8},hovertemplate:'%{y:.1f}%'},
    {x:my,y:my.map((_,i)=>MORT[i]-INF[MORT0-Y0+i]),name:'Real mortgage rate',line:{color:t.accent,width:1.5,dash:'dot'},hovertemplate:'%{y:.1f}%'}],
    {yaxis:Yt('',{ticksuffix:'%'}),shapes:[{type:'line',xref:'paper',x0:0,x1:1,y0:V.rate30,y1:V.rate30,line:{color:t.neg,dash:'dash',width:1}}],
     annotations:[{xref:'paper',x:1,y:V.rate30,xanchor:'right',yanchor:'bottom',text:`today ${V.rate30.toFixed(2)}%`,showarrow:false,font:{size:11,color:t.neg}}]});
  {const below=MORT.filter(v=>v<V.rate30).length/MORT.length,rr=V.rate30-V.cpiYoY;
   tk('mort',`Today's ${V.rate30.toFixed(2)}% is higher than the average rate in ${pct(below,0)} of the years since 1972. After ${V.cpiYoY}% inflation, the real rate is about ${rr.toFixed(1)}%.`,'What stands out:')}
  if(RES.zori&&RES.zori.years){const zy=RES.zori.years;const cpiR=zy.map(y=>RENTG[y-Y0]);
    document.getElementById('zori-cap').innerHTML=`Annual growth of CPI rent (all existing leases) vs. Zillow Observed Rent Index (asking rents on new leases). ${srcObj(RES.zori)} ${sl('fredRent')}`;
    {const zy=RES.zori.years,gaps=zy.map((y,i)=>RES.zori.yoy[i]-RENTG[y-Y0]),mx=Math.max(...gaps.map(Math.abs)),yi=gaps.map(Math.abs).indexOf(mx);tk('zori',`The largest gap was in ${zy[yi]}: asking rents ${RES.zori.yoy[yi]>=0?'+':''}${RES.zori.yoy[yi].toFixed(1)}% vs. CPI rent ${RENTG[zy[yi]-Y0].toFixed(1)}%. A renter who moves faces the asking-rent change, not the index.`,'What stands out:')}
    plot('p-zori',[{x:zy,y:RES.zori.yoy,name:'Zillow asking rents',type:'bar',marker:{color:hexA(t.inv,.7)},hovertemplate:'%{y:.1f}%'},{x:zy,y:cpiR,name:'CPI rent',mode:'lines+markers',line:{color:t.neg,width:2},hovertemplate:'%{y:.1f}%'}],{yaxis:Yt('Annual change',{ticksuffix:'%'})})}
  else{document.getElementById('zori-cap').textContent='Zillow rent history was not available.';}
  if(!dataDone){
    const head='<tr><th>Year</th><th>S&amp;P 500</th><th>T-bill</th><th>10y T-bond</th><th>Home price</th><th>Rent (CPI)</th><th>CPI</th><th>30y mortgage</th></tr>';
    const rows=YEARS.map((y,i)=>`<tr><td>${y}</td><td>${STK[i].toFixed(2)}</td><td>${BILL[i].toFixed(2)}</td><td>${BOND[i].toFixed(2)}</td><td>${HOME[i].toFixed(2)}</td><td>${RENTG[i].toFixed(2)}</td><td>${INF[i].toFixed(2)}</td><td>${y>=MORT0?MORT[y-MORT0].toFixed(2):'—'}</td></tr>`).reverse().join('');
    document.getElementById('dtable').innerHTML='<thead>'+head+'</thead><tbody>'+rows+'</tbody>';dataDone=true}
}

