/* ===================== Plain-language answer ===================== */
function plainAnswer(){const el=document.getElementById('answer');if(!el)return;
  if(!MC||MC.key!==mcKey()){el.innerHTML='<span class="sub">Simulating possible futures…</span>';return}
  const h=Math.min(P.N,MC.N),pw=MC.pWin[h],n=MC.n;
  const lab=pw>=0.8?['Very likely','hi','buy']:pw>=0.65?['Likely','mid','buy']:pw>0.55?['Leans','lo','buy']:pw>=0.45?['Close call','lo','']:pw>0.35?['Leans','lo','inv']:pw>0.2?['Likely','mid','inv']:['Very likely','hi','inv'];
  const side=lab[2]==='buy'?'buying':lab[2]==='inv'?'renting':'';
  const tail=' '+winSpellText(MC.pWin,MC.N);
  // the headline above is the steady-growth projection; say so when the simulated futures read it differently
  const N=P.N,dd=BASE&&BASE.buy[N]!=null?BASE.buy[N]-BASE.inv[N]:0,ahead=dd>=0?'buying':'renting';
  const note=!dd?'':lab[0]==='Close call'?` The projection above, with steady average growth, has ${ahead} ahead; across simulated futures the two are close to even.`:
    side&&side!==ahead?` The projection above, with steady average growth, has ${ahead} ahead; across simulated futures ${side} wins more often.`:'';
  el.innerHTML=`<span class="conf ${lab[1]} ${lab[2]}">${lab[0]}${side?' '+side:''}</span> Buying wins in <strong>${pct(pw,0)}</strong> of ${n.toLocaleString('en-US')} simulated futures at ${nY(h)}.${tail}${note}`}


