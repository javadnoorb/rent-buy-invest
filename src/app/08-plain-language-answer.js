/* ===================== Plain-language answer ===================== */
function plainAnswer(){const el=document.getElementById('answer');if(!el)return;
  if(!MC||MC.key!==mcKey()){el.innerHTML='<span class="sub">Simulating possible futures…</span>';return}
  const h=Math.min(P.N,MC.N),pw=MC.pWin[h],n=MC.n;
  let cross=null;for(let y=1;y<=MC.N;y++){let ok=true;for(let k=y;k<=Math.min(MC.N,y+3);k++)if(MC.pWin[k]<0.5)ok=false;if(ok){cross=y;break}}
  const lab=pw>=0.8?['Very likely','hi','buy']:pw>=0.65?['Likely','mid','buy']:pw>0.55?['Leans','lo','buy']:pw>=0.45?['Close call','lo','']:pw>0.35?['Leans','lo','inv']:pw>0.2?['Likely','mid','inv']:['Very likely','hi','inv'];
  const side=lab[2]==='buy'?'buying':lab[2]==='inv'?'renting':'';
  const tail=cross?(cross<=h?` It wins more often than not from year ${cross}.`:` It wins more often than not only if you stay ${cross}+ years.`):' It doesn\'t win more often than not within 30 years.';
  el.innerHTML=`<span class="conf ${lab[1]}">${lab[0]}${side?' '+side:''}</span> Buying wins in <strong>${pct(pw,0)}</strong> of ${n} simulated futures at ${nY(h)}.${tail}`}


