/* ===================== State & helpers ===================== */
let REAL=true,CUR='proj',P=null,BASE=null,MC=null,OPT_TERM=30;
const fmt=x=>{if(!isFinite(x))return '—';const a=Math.abs(x),s=x<0?'−':'';if(a>=1e12)return s+'$'+(a/1e12).toFixed(1)+'T';if(a>=1e9)return s+'$'+(a/1e9).toFixed(a>=1e10?0:1)+'B';if(a>=1e6)return s+'$'+(a/1e6).toFixed(a>=1e7?1:2)+'M';if(a>=1e3)return s+'$'+(a/1e3).toFixed(a>=1e5?0:1)+'k';return s+'$'+a.toFixed(0)};
const fmtFull=x=>(x<0?'−$':'$')+Math.round(Math.abs(x)).toLocaleString('en-US');
/* text from settings, shared links or scenario names, made safe to put into HTML */
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const pct=(x,d=1)=>(x*100).toFixed(d)+'%';
const adj=(v,c)=>REAL?v/c:v;
const curMetro=()=>METROS.find(m=>m.slug===(P?P.metro:document.getElementById('metro').value))||METROS[0];
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function theme(){return{rp:css('--rp'),ink:css('--ink'),muted:css('--muted'),line:css('--line'),bg:css('--surface'),buy:css('--buy'),inv:css('--inv'),cash:css('--cash'),accent:css('--accent'),neg:css('--neg'),sunk:css('--sunk')}}
function hexA(h,a){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
const TOUCH=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window&&innerWidth<900);
function layout(extra){const t=theme();const narrow=innerWidth<600;
  const M={l:narrow?52:64,r:14,t:10,b:narrow?72:48};
  const L=Object.assign({paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'IBM Plex Sans, system-ui, sans-serif',color:t.ink,size:narrow?11:12},
    margin:M,hovermode:'x unified',hoverlabel:{bgcolor:t.bg,bordercolor:t.line,font:{color:t.ink,family:'IBM Plex Mono, monospace'}},
    legend:{orientation:'h',yref:'container',y:0,yanchor:'bottom',x:0,font:{size:narrow?10:11},itemwidth:narrow?24:30,tracegroupgap:4},
    xaxis:{gridcolor:narrow?hexA(t.line,.55):t.line,zerolinecolor:t.line,linecolor:t.line,tickfont:{family:'IBM Plex Mono, monospace'},nticks:narrow?6:undefined,ticklabelstandoff:3},
    // tick labels stand a few pixels off the axes, so the x and y labels at the corner (both 0) don't touch
    yaxis:{gridcolor:narrow?hexA(t.line,.55):t.line,zerolinecolor:t.muted,linecolor:t.line,tickfont:{family:'IBM Plex Mono, monospace'},nticks:narrow?5:undefined,ticklabelstandoff:4}},extra||{});
  if(extra&&extra.margin)L.margin=Object.assign({},M,extra.margin);  // a chart may set only some sides
  if(TOUCH){L.dragmode=false;Object.keys(L).forEach(k=>{if(/^[xy]axis\d*$/.test(k))L[k]=Object.assign({},L[k],{fixedrange:true})});
    if(!L.xaxis)L.xaxis={fixedrange:true};if(!L.yaxis)L.yaxis={fixedrange:true};
    L.hoverlabel=Object.assign({},L.hoverlabel,{bgcolor:hexA(t.bg,0.9),font:Object.assign({},(L.hoverlabel||{}).font,{size:11})})}
  return L}
const CFG=TOUCH?{responsive:true,displayModeBar:false,scrollZoom:false,doubleClick:false,showTips:false}:{responsive:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d'],doubleClick:'reset'};
const HOVERED=new Set();
/* touch: a tap shows the chart readout; the next tap anywhere (the same chart included), a scroll, or 2.5 s closes it.
   Works from the DOM rather than Plotly's hover events, which mobile browsers do not fire reliably. */
const hoverShown=el=>{const hl=el.querySelector('.hoverlayer');return !!(hl&&hl.childElementCount)};
function clearHover(el){try{Plotly.Fx.unhover(el)}catch(e){}const hl=el.querySelector('.hoverlayer');if(hl)hl.replaceChildren();HOVERED.delete(el);clearTimeout(el._ht)}
function unhoverAll(except){document.querySelectorAll('.plot').forEach(el=>{if(el!==except&&(HOVERED.has(el)||hoverShown(el)))clearHover(el)})}
if(TOUCH){
  addEventListener('scroll',()=>unhoverAll(),{passive:true});
  addEventListener('touchstart',e=>{const p=e.target.closest&&e.target.closest('.plot');
    if(p&&hoverShown(p)){p._close=true}unhoverAll(p)},{passive:true,capture:true});
  addEventListener('touchend',e=>{const p=e.target.closest&&e.target.closest('.plot');if(!p)return;
    if(p._close){p._close=false;[0,60,250].forEach(d=>setTimeout(()=>clearHover(p),d));return}
    HOVERED.add(p);clearTimeout(p._ht);p._ht=setTimeout(()=>clearHover(p),2500)},{passive:true,capture:true})}
/* The page renders before the charting library arrives: charts drawn meanwhile wait in PLOT_WAIT (latest call per chart)
   and are drawn by plotFlush() once Plotly has loaded, or replaced by an error note if it never does. */
let PLOTLY_STATE='loading';const PLOT_WAIT=new Map();
function plotFlush(ok){PLOTLY_STATE=ok?'ready':'failed';const w=[...PLOT_WAIT];PLOT_WAIT.clear();w.forEach(([id,a])=>plot(id,...a))}
/* Every axis grows its margin to fit its tick labels and title (so they never overlap), and an axis of named categories
   shows every name: the phone tick limit (nticks) only applies to numeric axes. */
function fitAxes(data,L){for(const k of Object.keys(L)){const m=k.match(/^([xy])axis(\d*)$/);if(!m||!L[k])continue;const ax=L[k]=Object.assign({},L[k]);
    if(ax.automargin==null)ax.automargin=true;const ref=m[1]+(m[2]||'');
    const cat=ax.type==='category'||ax.tickvals||data.some(d=>(d[m[1]+'axis']||m[1])===ref&&Array.isArray(d[m[1]])&&typeof d[m[1]][0]==='string'&&ax.type!=='date'&&!/^\d{4}-\d\d/.test(d[m[1]][0]));
    if(cat)delete ax.nticks}
  return L}
/* on phones long axis titles and corner notes wrap onto lines of at most n characters (text with markup is left alone) */
function wrapText(tx,n){if(typeof tx!=='string'||/<(?!br>)/.test(tx))return tx;
  return tx.split('<br>').map(line=>{const out=[];let cur='';for(const w of line.split(' ')){if(cur&&(cur+' '+w).length>n){out.push(cur);cur=w}else cur=cur?cur+' '+w:w}out.push(cur);return out.join('<br>')}).join('<br>')}
function wrapTitles(L){if(innerWidth>=600)return;for(const k of Object.keys(L)){const ax=L[k];if(!/^[xy]axis\d*$/.test(k)||!ax||!ax.title||typeof ax.title.text!=='string')continue;
    const n=k[0]==='x'?30:38,tx=ax.title.text;if(tx.replace(/<[^>]+>/g,'').length>n)ax.title=Object.assign({},ax.title,{text:wrapText(tx,n)})}
  if(L.annotations)L.annotations=L.annotations.map(a=>a.xref==='paper'&&typeof a.text==='string'&&a.text.length>44?Object.assign({},a,{text:wrapText(a.text,44)}):a)}
function plot(id,data,lay){const el=document.getElementById(id);
  if(PLOTLY_STATE==='loading'){PLOT_WAIT.set(id,[data,lay]);if(!el.dataset.wait){el.dataset.wait=1;el.innerHTML='<div class="note plotwait">Loading chart…</div>'}describeChart(el);return}
  if(el.dataset.wait){el.innerHTML='';delete el.dataset.wait}
  try{if(el.dataset.err){el.innerHTML='';delete el.dataset.err}const L=fitAxes(data,layout(lay));wrapTitles(L);
    // reference lines and bands go under the data (a marker on a guide line stays visible), except over a heatmap, which would hide them
    if(L.shapes&&!data.some(d=>d.type==='heatmap'))L.shapes=L.shapes.map(s=>s.layer?s:Object.assign({},s,{layer:'below'}));Plotly.react(el,data,L,CFG);describeChart(el)}
  catch(e){console.error(id,e);el.dataset.err=1;el.innerHTML=`<div class="note">This chart could not be drawn (${String(e.message||e).slice(0,160)}).</div>`}}
const X=(t)=>({...layout().xaxis,title:{text:t,font:{size:11}}});
const Yd=(t)=>({...layout().yaxis,title:{text:t,font:{size:11}},tickprefix:'$',tickformat:'~s'});
const Yt=(t,extra)=>({...layout().yaxis,title:{text:t,font:{size:11}},...(extra||{})});
const basisLabel=()=>REAL?"today's $":'nominal $';
/* colour bar for buy-minus-rent heat maps: a titled scale ($ or %) with which end favours buying and which renting */
/* colour bars: title on top; tick labels just below their ticks, so the top label stays clear of the title */
const cbTitle=text=>({text,side:'top',font:{size:11}}),CB_TICKS={ticklabelposition:'outside bottom'};
function advBar(t,title,unit){return {title:cbTitle(title),...CB_TICKS,thickness:10,outlinewidth:0,len:.74,y:.5,
  ...(unit==='$'?{tickformat:'$~s'}:{ticksuffix:'%'})}}
function advEnds(t){return [[1,'bottom','▲ Buying<br>ahead',t.buy],[0,'top','▼ Renting<br>ahead',t.inv]].map(([y,ya,text,color])=>
  ({xref:'paper',yref:'paper',x:1.02,xanchor:'left',y:y===1?.87:.1,yanchor:ya,showarrow:false,align:'left',text,font:{size:10,color}}))}
/* Diverging scale for "renting wins" (blue, negative) vs "buying wins" (red-orange, positive), the same hues as the two
   paths: 9 steps, saturated at both ends (never fading to white), through a neutral grey at zero that differs from
   the card, with a dark-mode version whose ends stay saturated and whose middle is a dark grey. */
/* colours for places (Locations, side by side): their own hues, so a place is never mistaken for "buy" (red-orange) or
   "rent + invest" (blue); fixed order, validated for colour-blind separation of neighbours in light and dark mode */
const placePal=t=>isDark(t)?['#9085e9','#199e70','#c98500','#d55181','#2e9e2e']:['#6250d6','#1baf7a','#c98500','#d55181','#008300'];
/* one-hue sequential scale (violet, light to dark; reversed in dark mode so later values stay the most visible) for an
   ordered quantity that is neither buy nor rent, such as the year of purchase */
const SEQ_LIGHT=['#d9d4f5','#b2a8ec','#8a7be0','#6250d6','#4733a8','#2f1f78'],SEQ_DARK=['#3a3170','#4f43a0','#6a5cc8','#8a7ee0','#aea4ee','#d4cff8'];
function seqAt(seq,f){const x=Math.max(0,Math.min(1,f))*(seq.length-1),i=Math.min(seq.length-2,Math.floor(x)),u=x-i,h=c=>[1,3,5].map(k=>parseInt(c.slice(k,k+2),16));
  const a=h(seq[i]),b=h(seq[i+1]);return '#'+a.map((v,j)=>Math.round(v+(b[j]-v)*u).toString(16).padStart(2,'0')).join('')}
const isDark=t=>{const h=(t.bg||'#fff').replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return ((n>>16&255)*.299+(n>>8&255)*.587+(n&255)*.114)<128};
const DIV_LIGHT=['#0d366b','#1c5cab','#3987e5','#9ec5f4','#e4e3df','#f3b39b','#e8693a','#b8441c','#7a2810'];
const DIV_DARK=['#4a9bff','#2f7de0','#2361ad','#1d3f6e','#3a3a37','#6e3322','#b04a24','#e0602b','#ff7a45'];
const divScale=t=>{const c=isDark(t)?DIV_DARK:DIV_LIGHT;return c.map((v,i)=>[i/(c.length-1),v])};
/* break-even line (z = 0) drawn over a heatmap */
const zeroContour=(x,y,z,t)=>({x,y,z,type:'contour',showscale:false,hoverinfo:'skip',contours:{coloring:'none',start:0,end:0,size:1,showlabels:false},line:{color:t.ink,width:2,dash:'dot'},connectgaps:false,name:'break-even',showlegend:false});

