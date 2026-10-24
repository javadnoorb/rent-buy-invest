/* ===================== Sensitivity ===================== */
/* left margin that fits the longest category label, measured: Plotly's automargin left these labels cut off */
let LABEL_CTX=null;
function labelWidth(labs,size){const c=LABEL_CTX||(LABEL_CTX=document.createElement('canvas').getContext('2d'));
  c.font=`${size}px "IBM Plex Sans", system-ui, sans-serif`;return Math.ceil(Math.max(0,...labs.map(l=>c.measureText(l).width))*1.08)+14}
function renderSens(){
  const t=theme(),p=P,{base,rows}=tornado(p);
  /* bars overlap from zero; when both changes push the same way the "higher" bar is drawn thinner on top so both show,
     and an input with no effect at these settings says so instead of leaving an empty row */
  const same=rows.map(r=>r.lo*r.hi>0),none=rows.filter(r=>Math.abs(r.lo)<1&&Math.abs(r.hi)<1),narrow=innerWidth<600;
  plot('p-tor',[
    {y:rows.map(r=>r.lab),x:rows.map(r=>r.lo),name:'Input lower',meta:'tor:lo',type:'bar',orientation:'h',width:.8,offset:-.4,marker:{color:hexA(t.inv,.85)},hovertemplate:'%{x:$,.0f}<extra>lower</extra>'},
    {y:rows.map(r=>r.lab),x:rows.map(r=>r.hi),name:'Input higher',meta:'tor:hi',type:'bar',orientation:'h',width:same.map(s=>s?.4:.8),offset:same.map(s=>s?-.2:-.4),marker:{color:hexA(t.buy,.85)},hovertemplate:'%{x:$,.0f}<extra>higher</extra>'}],
    {barmode:'overlay',hovermode:'closest',margin:{l:labelWidth(rows.map(r=>r.lab),narrow?10:12),r:14,t:10,b:60},xaxis:{...layout().xaxis,title:{text:`Change in buy − rent at year ${p.N}, ${basisLabel()}`,font:{size:11}},tickprefix:'$',tickformat:'~s',nticks:narrow?4:undefined},yaxis:{...layout().yaxis,automargin:true,tickfont:{family:'IBM Plex Sans, system-ui, sans-serif',size:narrow?10:12}},
     annotations:none.map(r=>({x:0,y:r.lab,xanchor:'left',xshift:4,showarrow:false,text:'no effect here',font:{size:10,color:t.muted}}))});
  {const top=rows.slice(-3).reverse(),flips=rows.filter(r=>Math.sign(base+r.lo)!==Math.sign(base)||Math.sign(base+r.hi)!==Math.sign(base));
   const nm=r=>r.lab.replace(/ ±.*/,'').toLowerCase(),list=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a.at(-1);
   const fl=flips.slice().sort((a,b)=>Math.max(Math.abs(b.lo),Math.abs(b.hi))-Math.max(Math.abs(a.lo),Math.abs(a.hi)));
   tk('tor',`At your settings buying ends ${base>=0?'ahead':'behind'} by ${fmt(Math.abs(base))}; each bar is the change from that. The answer is most sensitive to ${list(top.map(nm))}. `+(fl.length>5?`The result is a toss-up: ${fl.length} of the ${rows.length} changes shown would flip it on their own.`:fl.length?`Within the ranges shown, ${list(fl.slice(0,3).map(nm))}${fl.length>3?` (and ${fl.length-3} more)`:''} could flip the decision on ${fl.length>1?'their':'its'} own.`:`None of the shown changes alone flips the decision, so the result is fairly robust to any single input.`))}
  const G=[],R=[];for(let g=-2;g<=8.001;g+=0.5)G.push(r2(g));for(let r=2;r<=14.001;r+=0.5)R.push(r2(r));
  const wc=1-p.ws-p.wb,mix=rs=>p.ws*rs+p.wb*p.rb+wc*p.rc;
  const z=R.map(r=>G.map(g=>{const rs=p.ws>0?(r/100-p.wb*p.rb-wc*p.rc)/p.ws:p.rs;return advAt(p,{gh:g/100,rs})}));
  const zmax=Math.max(1,...z.flat().map(Math.abs));
  plot('p-heat',[
    {x:G,y:R,z,type:'heatmap',meta:'heat:z',zsmooth:'best',zmin:-zmax,zmax,colorscale:divScale(t),colorbar:advBar(t,`Buy − rent<br>at year ${p.N}`,'$'),customdata:z.map(r=>r.map(v=>(100*v/p.P).toFixed(0))),hovertemplate:`home %{x}%, portfolio %{y}%<br>buy − rent at year ${p.N}: %{z:$,.0f} (%{customdata}% of price)<extra></extra>`},
    zeroContour(G,R,z,t),
    {x:[p.gh*100],y:[mix(p.rs)*100],meta:'deco:you',mode:'markers',marker:{size:12,color:t.ink,symbol:'x'},name:'You',hovertemplate:'your assumption<extra></extra>'}],
    {hovermode:'closest',showlegend:false,xaxis:X('Home appreciation, % / yr'),yaxis:Yt('Portfolio return before fees, % / yr'),annotations:advEnds(t)});
  {const beG=bisect(g=>advAt(p,{gh:g}),-0.15,0.25);
   tk('heat',beG==null?'At your portfolio return, no home appreciation between −15% and 25% a year changes the winner.':
     `At your ${pct(mix(p.rs))} portfolio return, buying ties when homes appreciate ${pct(beG)} a year; you assume ${pct(p.gh)}, a margin of ${(Math.abs(beG-p.gh)*100).toFixed(1)} points in favor of ${beG>p.gh?'renting':'buying'}.`)}
  const mults=[0.7,0.85,1,1.15,1.3],cols=[t.inv,hexA(t.inv,.6),t.muted,hexA(t.buy,.6),t.buy];
  const BE=[];
  plot('p-ptr',mults.map((m,j)=>{const {o}=runConst(p,{rent0:p.rent0*m},30);BE.push(aheadSpell(o));
    return {x:o.buy.map((_,k)=>k),y:o.buy.map((b,k)=>adj(b-o.inv[k],o.cpi[k])),meta:'ptr:line',customdata:o.buy.map(()=>m),name:`${fmtFull(p.rent0*m)} (P/R ${(p.P/(p.rent0*m*12)).toFixed(1)})`,mode:'lines',line:{color:cols[j],width:m===1?3:1.8},hovertemplate:'%{y:$,.0f}'}}),
    {xaxis:X('Years'),yaxis:Yd('Buy − (rent + invest), '+basisLabel())});
  const be=BE[2],lo=BE[0],hi=BE[4];
  const ptr=(p.P/(p.rent0*12)).toFixed(1);
  const spell=s=>!s?'not within 30 years':`year ${s.from}${s.until?` (renting is ahead again from year ${s.until})`:''}`;
  tk('ptr',!be&&!hi?`At your rent (price-to-rent ${ptr}) buying doesn't get ahead within 30 years, even if comparable rent were 30% higher.`:
    `At your rent (price-to-rent ${ptr}) buying ${be?`gets ahead in ${spell(be)}`:`doesn't get ahead within 30 years`}. With 30% higher rent: ${spell(hi)}; with 30% lower rent: ${spell(lo)}.`);
}

