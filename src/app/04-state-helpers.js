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
/* touch: a tap shows the readout; the next tap anywhere (the same chart included), a scroll, or 2.5 s closes it */
function clearHover(el){try{Plotly.Fx.unhover(el)}catch(e){}const hl=el.querySelector('.hoverlayer');if(hl)hl.replaceChildren();HOVERED.delete(el);clearTimeout(el._ht)}
function unhoverAll(except){[...HOVERED].forEach(el=>{if(el!==except)clearHover(el)})}
if(TOUCH){addEventListener('scroll',()=>{if(HOVERED.size)unhoverAll()},{passive:true});
  addEventListener('touchstart',e=>{if(!HOVERED.size)return;const p=e.target.closest&&e.target.closest('.plot');
    if(p&&HOVERED.has(p)){p._swallow=Date.now()}unhoverAll()},{passive:true,capture:true})}
function plot(id,data,lay){const el=document.getElementById(id);
  try{if(el.dataset.err){el.innerHTML='';delete el.dataset.err}Plotly.react(el,data,layout(lay),CFG);
    if(TOUCH&&!el._hoverWired&&el.on){el._hoverWired=1;el.on('plotly_hover',()=>{if(el._swallow&&Date.now()-el._swallow<600){el._swallow=0;setTimeout(()=>clearHover(el),0);return}HOVERED.add(el);clearTimeout(el._ht);el._ht=setTimeout(()=>clearHover(el),2500)});el.on('plotly_unhover',()=>HOVERED.delete(el))}}
  catch(e){console.error(id,e);el.dataset.err=1;el.innerHTML=`<div class="note">This chart could not be drawn (${String(e.message||e).slice(0,160)}).</div>`}}
const X=(t)=>({...layout().xaxis,title:{text:t,font:{size:11}}});
const Yd=(t)=>({...layout().yaxis,title:{text:t,font:{size:11}},tickprefix:'$',tickformat:'~s'});
const Yt=(t,extra)=>({...layout().yaxis,title:{text:t,font:{size:11}},...(extra||{})});
const basisLabel=()=>REAL?"today's $":'nominal $';
const divScale=t=>[[0,t.inv],[0.5,t.bg],[1,t.buy]];

