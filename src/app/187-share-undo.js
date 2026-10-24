/* ===================== Share, print, undo ===================== */
/* Phone share sheet (where the browser has one), a printable one-page report, and an undo bar that lists what changed
   whenever one action changes three or more settings (location, presets, the setup wizard, loading a scenario). */
let LAST_RAW=null,UNDO_RAW=null,UNDO_T=0;
/* label and value of a setting as HTML-safe text (values can come from a shared link) */
function settingLabel(id){if(id==='N')return 'Horizon';if(id==='metro')return 'Location';const f=F.find(x=>x[1]===id);
  return escapeHtml(f?f[2].replace(/\s*\([^)]*\)\s*$/,'').replace(/&amp;/g,'&'):id)}
function settingValue(id,v){return escapeHtml(settingText(id,v))}
function settingText(id,v){if(id==='N')return nY(+v);if(id==='metro'){const m=METROS.find(x=>x.slug===v);return m?m.name:v}
  const f=F.find(x=>x[1]===id);if(!f)return String(v);
  if(f[6]==='sel'){const o=(f[7]||[]).find(o=>String(o[0])===String(v));return o?o[1]:String(v)}
  const u=(f[2].match(/\(([^)]*)\)\s*$/)||[])[1]||'',x=parseFloat(v);if(!isFinite(x))return String(v);
  if(/^\$/.test(u))return '$'+x.toLocaleString('en-US',{maximumFractionDigits:2});return x.toLocaleString('en-US',{maximumFractionDigits:3})+(/^%/.test(u)?'%':'')}
// fields the app fills in itself (automatic tax rates, transfer taxes, rent from bedrooms) don't count as changes
function rawDiff(a,b){const derived={rent0:b.rentMode==='auto',mu:b.muMode==='auto',ltcg:b.ltcgMode==='auto',ttBuy:b.ttAuto==='auto',ttSell:b.ttAuto==='auto',stTax:(b.stMode||'auto')==='auto',stRate:(b.stMode||'auto')==='auto',stDed:(b.stMode||'auto')==='auto'};
  return Object.keys(b).filter(k=>!derived[k]&&String(a[k])!==String(b[k]))}
function noteBulkChange(prev,cur){const ch=rawDiff(prev,cur);if(ch.length<3)return;
  UNDO_RAW=prev;const bar=document.getElementById('undoBar'),list=ch.slice(0,4).map(k=>`${settingLabel(k)} ${settingValue(k,prev[k])} → ${settingValue(k,cur[k])}`);
  document.getElementById('undoTxt').textContent=`Changed ${ch.length} settings: ${list.join('; ')}${ch.length>4?`; and ${ch.length-4} more`:''}.`;
  bar.hidden=false;clearTimeout(UNDO_T);UNDO_T=setTimeout(()=>{bar.hidden=true},7000)}
function undoBulk(){if(!UNDO_RAW)return;setRaw(UNDO_RAW);const m=METROS.find(x=>x.slug===UNDO_RAW.metro);if(m)updateMetroHints(m);
  UNDO_RAW=null;document.getElementById('undoBar').hidden=true;update()}
/* the inputs that define the answer, plus every other setting changed from its default, for the printed report */
function printInputs(){const raw=getRaw(),main=['metro','N','P','dp','rate','term','loanType','rent0','gh','gr','rs','inf','income'];
  const ids=main.concat(F.map(f=>f[1]).filter(id=>!main.includes(id)&&isChanged(id)));
  document.getElementById('printInputs').innerHTML=`<h2>Inputs</h2><table class="ptable"><tbody>${ids.map(id=>`<tr><td>${settingLabel(id)}</td><td>${settingValue(id,raw[id])}</td></tr>`).join('')}</tbody></table>
    <p class="sub">${location.protocol.startsWith('http')?location.origin+location.pathname+' · ':''}market data as of ${SNAP.asOf} · ${basisLabel()} · printed ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>`}
/* charts are drawn at the page's width; for printing they are redrawn at the paper's width, then back */
function printWidthPlots(on){if(!window.Plotly||!Plotly.relayout)return;document.querySelectorAll('.panel:not([hidden]) .plot').forEach(el=>{if(!el.data)return;
  try{Plotly.relayout(el,on?{width:Math.min(680,el.clientWidth||680),autosize:false}:{width:null,autosize:true})}catch(e){}})}
function resizePlots(){if(!window.Plotly||!Plotly.Plots)return;document.querySelectorAll('.panel:not([hidden]) .plot').forEach(el=>{try{Plotly.Plots.resize(el)}catch(e){}})}
function wireShareUndo(){
  const sh=document.getElementById('shareNative');sh.hidden=!(STANDALONE_SITE&&navigator.share);
  sh.addEventListener('click',()=>{const url=location.origin+location.pathname+'?s='+encodeURIComponent(encodeState());
    navigator.share({title:'Rent, Buy or Invest',text:window._summaryText||'',url}).catch(()=>{})});
  document.getElementById('printReport').addEventListener('click',()=>window.print());
  // the printout includes "More numbers", opened for the print and closed again after if it was closed
  const more=document.querySelector('.verdict details.more');let wasOpen=true;
  addEventListener('beforeprint',()=>{printInputs();wasOpen=more.open;more.open=true;printWidthPlots(true)});
  addEventListener('afterprint',()=>{more.open=wasOpen;printWidthPlots(false);resizePlots()});
  document.getElementById('undoBtn').addEventListener('click',undoBulk);
  document.getElementById('undoX').addEventListener('click',()=>{document.getElementById('undoBar').hidden=true})}
