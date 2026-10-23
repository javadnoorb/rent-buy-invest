/* ===================== State & helpers ===================== */
let REAL=true,CUR='proj',P=null,BASE=null,MC=null,OPT_TERM=30;
const fmt=x=>{if(!isFinite(x))return '—';const a=Math.abs(x),s=x<0?'−':'';if(a>=1e6)return s+'$'+(a/1e6).toFixed(a>=1e7?1:2)+'M';if(a>=1e3)return s+'$'+(a/1e3).toFixed(a>=1e5?0:1)+'k';return s+'$'+a.toFixed(0)};
const fmtFull=x=>(x<0?'−$':'$')+Math.round(Math.abs(x)).toLocaleString('en-US');
const pct=(x,d=1)=>(x*100).toFixed(d)+'%';
const adj=(v,c)=>REAL?v/c:v;
const curMetro=()=>METROS.find(m=>m.slug===(P?P.metro:document.getElementById('metro').value))||METROS[0];
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function theme(){return{rp:css('--rp'),ink:css('--ink'),muted:css('--muted'),line:css('--line'),bg:css('--surface'),buy:css('--buy'),inv:css('--inv'),cash:css('--cash'),accent:css('--accent'),neg:css('--neg'),sunk:css('--sunk')}}
function hexA(h,a){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
const TOUCH=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window&&innerWidth<900);
function layout(extra){const t=theme();const narrow=innerWidth<600;
  const L=Object.assign({paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'IBM Plex Sans, system-ui, sans-serif',color:t.ink,size:narrow?11:12},
    margin:{l:narrow?52:64,r:14,t:10,b:narrow?72:48},hovermode:'x unified',hoverlabel:{bgcolor:t.bg,bordercolor:t.line,font:{color:t.ink,family:'IBM Plex Mono, monospace'}},
    legend:{orientation:'h',y:narrow?-0.3:-0.16,x:0,font:{size:narrow?10:11},itemwidth:narrow?24:30,tracegroupgap:4},
    xaxis:{gridcolor:narrow?hexA(t.line,.55):t.line,zerolinecolor:t.line,linecolor:t.line,tickfont:{family:'IBM Plex Mono, monospace'},nticks:narrow?6:undefined},
    yaxis:{gridcolor:narrow?hexA(t.line,.55):t.line,zerolinecolor:t.muted,linecolor:t.line,tickfont:{family:'IBM Plex Mono, monospace'},nticks:narrow?5:undefined}},extra||{});
  if(TOUCH){L.dragmode=false;Object.keys(L).forEach(k=>{if(/^[xy]axis\d*$/.test(k))L[k]=Object.assign({},L[k],{fixedrange:true})});
    if(!L.xaxis)L.xaxis={fixedrange:true};if(!L.yaxis)L.yaxis={fixedrange:true};
    L.hoverlabel=Object.assign({},L.hoverlabel,{bgcolor:hexA(t.bg,0.9),font:Object.assign({},(L.hoverlabel||{}).font,{size:11})})}
  return L}
const CFG=TOUCH?{responsive:true,displayModeBar:false,scrollZoom:false,doubleClick:false,showTips:false}:{responsive:true,displaylogo:false,displayModeBar:true,modeBarButtonsToRemove:['lasso2d','select2d'],doubleClick:'reset'};
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
function plot(id,data,lay){const el=document.getElementById(id);
  try{if(el.dataset.err){el.innerHTML='';delete el.dataset.err}Plotly.react(el,data,layout(lay),CFG);
    }
  catch(e){console.error(id,e);el.dataset.err=1;el.innerHTML=`<div class="note">This chart could not be drawn (${String(e.message||e).slice(0,160)}).</div>`}}
const X=(t)=>({...layout().xaxis,title:{text:t,font:{size:11}}});
const Yd=(t)=>({...layout().yaxis,title:{text:t,font:{size:11}},tickprefix:'$',tickformat:'~s'});
const Yt=(t,extra)=>({...layout().yaxis,title:{text:t,font:{size:11}},...(extra||{})});
const basisLabel=()=>REAL?"today's $":'nominal $';
/* Diverging scale for "renting wins" (blue, negative) vs "buying wins" (green, positive): 9 steps, darker and more
   saturated toward the extremes, a light neutral at zero that differs from the card background, and a dark-mode version. */
const isDark=t=>{const h=(t.bg||'#fff').replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return ((n>>16&255)*.299+(n>>8&255)*.587+(n&255)*.114)<128};
const DIV_LIGHT=['#0b2a73','#2449b8','#5b7fe0','#a9bdf3','#eceee9','#a8e0c1','#4fb784','#1d8452','#08502c'];
const DIV_DARK=['#c7d3ff','#8ea6ff','#5a78e6','#2c4291','#2b3230','#23664a','#3aa775','#7fdcae','#c9f3dd'];
const divScale=t=>{const c=isDark(t)?DIV_DARK:DIV_LIGHT;return c.map((v,i)=>[i/(c.length-1),v])};
/* break-even line (z = 0) drawn over a heatmap */
const zeroContour=(x,y,z,t)=>({x,y,z,type:'contour',showscale:false,hoverinfo:'skip',contours:{coloring:'none',start:0,end:0,size:1,showlabels:false},line:{color:t.ink,width:2,dash:'dot'},connectgaps:false,name:'break-even',showlegend:false});

