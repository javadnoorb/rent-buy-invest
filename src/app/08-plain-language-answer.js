/* ===================== Plain-language answer ===================== */
function plainAnswer(){const el=document.getElementById('answer');if(!el)return;
  if(!MC||MC.key!==mcKey()){el.innerHTML='<span class="sub">Simulating possible futures…</span>';return}
  const h=Math.min(P.N,MC.N),pw=MC.pWin[h],n=MC.n;
  let cross=null;for(let y=1;y<=MC.N;y++){let ok=true;for(let k=y;k<=Math.min(MC.N,y+3);k++)if(MC.pWin[k]<0.5)ok=false;if(ok){cross=y;break}}
  const conf=pw>=0.8||pw<=0.2?['High confidence','hi']:(pw>=0.65||pw<=0.35?['Moderate confidence','mid']:['Low confidence','lo']);
  const yrs=`${h} year${h>1?'s':''}`;
  let main;
  if(pw>=0.45&&pw<=0.55)main=`If you stay ${yrs}, it's close to a coin flip: buying comes out ahead in ${pct(pw,0)} of ${n} simulated futures.`;
  else if(pw>0.5)main=`If you stay ${yrs}, buying is ${pw>=0.8?'very likely':pw>=0.65?'likely':'somewhat more likely'} to leave you better off: it wins in ${pct(pw,0)} of ${n} simulated futures.`;
  else main=`If you stay ${yrs}, renting and investing is ${pw<=0.2?'very likely':pw<=0.35?'likely':'somewhat more likely'} to leave you better off: buying wins in only ${pct(pw,0)} of ${n} simulated futures.`;
  const tail=cross?(cross<=h?` Buying tends to win once you stay ${cross}+ years.`:` Buying starts winning more often than not if you stay about ${cross}+ years.`):' Buying does not win more often than not at any horizon up to 30 years.';
  el.innerHTML=`<span class="conf ${conf[1]}">${conf[0]}</span> ${main}${tail}`}

