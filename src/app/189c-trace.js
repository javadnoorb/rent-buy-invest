/* ===================== Trace: how a number was computed ===================== */
/* traceRun(p, path, info, opt) runs the model once with opt.trace and returns node builders for every quantity in it.
   A node is {label, v (value), u (unit), eq (an EQ id), build()}; build() returns its children and calc, the formula
   that turns the children's values into its own. Leaves are settings (with where their value came from), data values
   (with their source) and the model's fixed constants (with the rule behind them). Values are read from the run's
   ledger (o.tr), never recomputed for display; tests/trace.js checks that every node's formula, applied to its
   children, gives its value, and that the top node equals what the chart plots, so the tree cannot drift from the
   model. Units: '$', '%' (a decimal shown as a percent), 'x' (a factor), 'n' (a count), 'mo' (months), 'pts'. */
const SERNAME={gh:'Home price growth',gr:'Rent growth',inf:'Inflation',rs:'S&P 500 total return',rb:'10-year Treasury bond return',rc:'T-bill return'};
const SER_SRC={gh:['shiller','caseShiller','fhfa'],gr:['fredRent'],inf:['fredCPI'],rs:['damo'],rb:['damo'],rc:['damo']};
const SER_SRC_M={gh:['fhfa'],gr:['fredRent'],inf:['fredCPI'],rs:['mSp'],rb:['mTb'],rc:['mTb']};
function traceRun(p,path,info,opt){opt=Object.assign({N:p.N},opt||{},{trace:true,detail:true});const o=simulate(p,path,opt);
  return traceNodes({p,path,info:info||{kind:'const'},o,tr:o.tr,N:opt.N,opt,memo:new Map()})}
function traceNodes(X){const {p,o,tr}=X,LS=tr.LS,E=t=>tr.ends[t],Yr=y=>tr.years[y],Mo=(y,m)=>tr.years[y].mo[m],path=X.path,info=X.info;
  const M=(k,f)=>{let n=X.memo.get(k);if(!n){n=f();n.key=k;X.memo.set(k,n)}return n};
  const tx=p.taxOn,taxable=tx&&p.acct==='taxable',mv=tr.move,YL=y=>`year ${y+1}`,TL=t=>t?`after ${nY(t)}`:'at the start';
  // ---- leaves and composite nodes ----
  const set=(pk,v,u,id,o2)=>Object.assign({label:settingLabel(id||pk),v,u,leaf:'set',id:id||pk,pk},o2);
  const con=(label,v,u,o2)=>Object.assign({label,v,u,leaf:'const'},o2);
  const dat=(label,v,u,src,o2)=>Object.assign({label,v,u,leaf:'data',src},o2);
  const why=(label,v,u,note,rel)=>({label,v,u,leaf:'note',note,pk:rel||[]});
  const node=(label,v,u,eq,build,o2)=>Object.assign({label,v,u,eq,build},o2);
  const sum=(label,v,u,eq,parts,o2)=>node(label,v,u,eq,()=>{const ps=parts().filter(Boolean);return {op:'sum',kids:ps.map(x=>x[1]),sg:ps.map(x=>x[0]),calc:a=>a.reduce((s,x,j)=>s+ps[j][0]*x,0)}},o2);
  const prod=(label,v,u,eq,parts,o2)=>node(label,v,u,eq,()=>({op:'prod',kids:parts().filter(Boolean),calc:a=>a.reduce((s,x)=>s*x,1)}),o2);
  const fn=(label,v,u,eq,kids,calc,show,o2)=>node(label,v,u,eq,()=>({op:'fn',kids:kids(),calc,show}),o2);
  const months=f=>[...Array(12)].map((_,m)=>f(m));
  const sumMonths=(label,y,u,eq,val,f,o2)=>sum(label,months(m=>val(Mo(y,m))).reduce((a,b)=>a+b,0),u,eq,()=>months(m=>[1,f(m)]),Object.assign({months:true},o2));
  // ---- the growth path: a setting (projection), a historical year (backtest) or a resampled year (Monte Carlo) ----
  const pathY=(key,y)=>M(`py:${key}:${y}`,()=>{
    if(path.monthly){const ks=months(m=>y*12+m),v=ks.reduce((a,k)=>a*(1+path[key][k]),1)-1;
      return fn(`${SERNAME[key]}, ${YL(y)}`,v,'%','compound12',()=>ks.map(k=>pathM(key,k)),a=>a.reduce((s,g)=>s*(1+g),1)-1,a=>`${a.map(g=>'(1 + '+fv(g,'%')+')').join(' × ')} − 1`)}
    const v=path[key][y];
    if(info.kind==='hist')return dat(`${SERNAME[key]}, ${info.y0+y}`,v,'%',SER_SRC[key],{note:info.note});
    if(info.kind==='mc'){const yr=Y0+info.i0+info.idx[y],raw=SER_RAW[key][info.i0+info.idx[y]]/100,sh=info.SH[key];
      return fn(`${SERNAME[key]}, simulated ${YL(y)} (drawn from ${yr})`,v,'%','recenter',()=>[dat(`${SERNAME[key]}, ${yr}`,raw,'%',SER_SRC[key]),con('Shift that centres the history on your setting',sh,'n',{note:`ln(1 + your ${SERNAME[key].toLowerCase()}) − average ln(1 + history)`,pk:[key],sec:'monte-carlo'})],
        ([r,s])=>Math.exp(Math.log(1+r)+s)-1,([r,s])=>`exp(ln(1 + ${fv(r,'%')}) + ${s.toFixed(4)}) − 1`)}
    return set(key,v,'%')});
  const pathM=(key,k)=>dat(`${SERNAME[key]}, ${info.dates?info.dates[k]:'month '+(k+1)}`,path[key][k],'%',SER_SRC_M[key],{note:info.note});
  const mret=(key,y,m)=>path.monthly?pathM(key,y*12+m):M(`mr:${key}:${y}`,()=>{const a=pathY(key,y);
    return fn(`${SERNAME[key]}, per month in ${YL(y)}`,Math.pow(1+a.v,1/12)-1,'%','perMonth',()=>[a],([g])=>Math.pow(1+g,1/12)-1,([g])=>`(1 + ${fv(g,'%')})^(1/12) − 1`)});
  const gf=(key,y)=>M(`gf:${key}:${y}`,()=>{const a=pathY(key,y);return fn(`1 + ${SERNAME[key].toLowerCase()}, ${YL(y)}`,1+a.v,'x','onePlus',()=>[a],([g])=>1+g)});
  const mktM=(y,m)=>{const k=path.monthly?y*12+m:y,v=path.mkt[k];
    if(info.kind==='hist')return dat(`Market mortgage rate, ${path.monthly&&info.dates?info.dates[k]:info.y0+y}`,v,'%',['fredMort']);
    if(info.kind==='mc')return con(`Simulated market mortgage rate, ${YL(y)}`,v,'%',{sec:'monte-carlo',note:'pulled toward your expected later rate, moved by inflation changes and by a historical shock',pk:['rate','rateLR']});
    return fn(`Market mortgage rate, ${YL(y)}`,v,'%','rateGlide',()=>[set('rate',p.rate,'%',p.term===15?'rate15':'rate'),set('rateLR',p.rateLR,'%'),set('glide',p.glide,'n')],([r,l,g])=>r+(l-r)*Math.min(1,y/Math.max(0.0001,g)))};
  // ---- price indexes: products of yearly growth, so each lists every year's figure ----
  const upto=t=>[...Array(Math.max(0,t))].map((_,k)=>k);
  const cpi=t=>M('cpi:'+t,()=>t===0?con('Price level at the start',1,'x',{note:'prices are measured relative to today'}):
    prod(`Price level ${TL(t)}`,E(t).cpi,'x','cpi',()=>upto(t).map(y=>gf('inf',y))));
  const cpiMid=y=>M('cpim:'+y,()=>fn(`Price level in the middle of ${YL(y)}`,Math.sqrt(E(y).cpi*E(y+1).cpi),'x','cpiMid',()=>[cpi(y),cpi(y+1)],([a,b])=>Math.sqrt(a*b)));
  const infIdx=y=>M('ii:'+y,()=>y===0?con('Price index, year 1',1,'x'):prod(`Price index, ${YL(y)}`,Yidx(y,'infIdx'),'x','cpi',()=>upto(y).map(k=>gf('inf',k))));
  const insIdx=y=>M('ins:'+y,()=>y===0?con('Insurance price index, year 1',1,'x'):fn(`Insurance price index, ${YL(y)}`,Yidx(y,'insIdx'),'x','insIdx',()=>[set('insG',p.insG||0,'%')].concat(upto(y).map(k=>pathY('inf',k))),([g,...i])=>i.reduce((a,x)=>a*(1+x+g),1)));
  const Yidx=(y,k)=>y<tr.years.length?Yr(y)[k]:E(y)[k];
  const income=t=>M('inc:'+t,()=>t===0?set('income',p.income,'$'):fn(`Household income, ${YL(t)}`,E(t).income,'$','incGrowth',()=>[set('income',p.income,'$'),set('incGrowth',p.incGrowth||0,'%')],([a,g])=>{let x=a;for(let k=0;k<t;k++)x*=1+g;return x},([a,g])=>`${fv(a,'$')} × (1 + ${fv(g,'%')})^${t}`));
  // ---- tax rates (in effect during year t, and at a sale at the end of year t) ----
  const muN=t=>M('mu:'+t,()=>p.muMode==='auto'&&tx?fn(`Federal marginal rate, ${YL(t)}`,E(t).mu,'%','bracket',()=>[income(t),infIdx2(t)],([a,b])=>marginalRate(a/b,p.filing,LS.tk),null,{src:['irs26'],pk:['filing','muMode','y0','mu'],note:`2026 brackets, ${p.filing==='mfj'?'married filing jointly':'single'}, applied to income in today's dollars`}):set('mu',p.mu,'%'));
  const infIdx2=t=>t<tr.years.length?infIdx(t):M('iiE:'+t,()=>prod(`Price index ${TL(t)}`,E(t).infIdx,'x','cpi',()=>upto(t).map(k=>gf('inf',k))));
  const niitN=t=>M('niit:'+t,()=>!tx?why('Net investment income tax',0,'%','taxes are off',['taxOn','niit','niitAuto']):
    fn(`Net investment income tax, ${YL(t)}`,E(t).niit,'%','niit',()=>[income(t)],([a])=>a>(p.filing==='mfj'?250000:200000)?0.038:0,([a])=>`3.8% if ${fv(a,'$')} is over ${p.filing==='mfj'?'$250,000':'$200,000'}, else 0`,{src:['irsNiit'],pk:['niit','niitAuto','filing']}));
  const ltcgBase=t=>M('lb:'+t,()=>p.ltcgMode==='auto'?fn(`Federal capital-gains rate, ${YL(t)}`,ltcgRate(E(t).income/E(t).infIdx,p.filing,LS.tk),'%','ltcgBracket',()=>[income(t),infIdx2(t)],([a,b])=>ltcgRate(a/b,p.filing,LS.tk),null,{src:['irs26'],pk:['filing','ltcgMode','y0']}):set('ltcg',p.ltcg,'%'));
  const ltcgE=t=>M('lte:'+t,()=>sum(`Tax rate on gains and dividends, ${YL(t)}`,E(t).ltcgE,'%','ltcgE',()=>[[1,ltcgBase(t)],[1,niitN(t)],[1,set('stRate',p.stRate,'%')]]));
  const muE=t=>M('mue:'+t,()=>sum(`Tax rate on interest, ${YL(t)}`,E(t).muE,'%','muE',()=>[[1,muN(t)],[1,niitN(t)],[1,set('stRate',p.stRate,'%')]]));
  // ---- the home ----
  const priceAt=y=>y===0?set('P',p.P,'$'):H(y);
  const closeRate=()=>M('close',()=>sum('Buyer closing costs, share of the price',p.close,'%','close',()=>[[1,set('closeBase',p.closeBase,'%','close')],[1,set('ttBuy',p.ttBuy,'%')]],{pk:['close']}));
  const H=t=>M('H:'+t,()=>t===0?set('P',p.P,'$'):!E(t).owned?why(`Home value ${TL(t)}`,0,'$','sold at the planned move; the buyer rents from then on',['moveMode','moveYear']):
    prod(`Home value ${TL(t)}`,E(t).H,'$','home',()=>[set('P',p.P,'$')].concat(upto(t).map(y=>gf('gh',y)))));
  const loanAmt=()=>M('L',()=>fn('Loan amount',LS.L,'$',LS.type==='fha'?'loanFHA':'loan',()=>[set('P',p.P,'$'),set('dp',p.dp,'%')].concat(LS.type==='fha'?[con('FHA upfront premium, added to the loan',0.0175,'%',{src:['lr_fha'],pk:['loanType']})]:[]),
    a=>a[0]*(1-a[1])*(a[2]!=null?1+a[2]:1)));
  const evAt=(y,m)=>{for(let yy=y;yy>=0;yy--)for(let mm=yy===y?m:11;mm>=0;mm--){const q=Mo(yy,mm);if(q.ev)return {y:yy,m:mm,ev:q.ev};if(mm===0&&mv&&mv.mode==='buy'&&mv.y===yy)return {y:yy,m:0,move:true}}return null};
  const cAdj=()=>M('cadj',()=>{const C=p.credit,L=C&&C.llpa;if(!LS.cAdj||!L)return why('Credit-score rate adjustment',LS.cAdj||0,'%',p.loanType==='fha'?'FHA pricing has no credit-score adjustment':'your score and down payment price the same as the survey borrower',['fico','credit','loanType']);
    const col=ltv=>L.ltv_upper.findIndex(u=>ltv<=u+1e-9),row=L.rows[p.fico],ref=L.rows[L.reference.score];
    return fn('Credit-score rate adjustment',LS.cAdj,'%','llpa',()=>[dat(`Fannie Mae price adjustment, score ${p.fico}, ${pct(1-p.dp,0)} loan-to-value`,row[col(1-p.dp)],'pts',['llpa'],{pk:['fico','credit','dp']}),
      dat('Same for the survey borrower (760–779, 80% loan-to-value)',ref[col(L.reference.ltv)],'pts',['llpa'],{pk:['credit']}),set('ptsCut',p.ptsCut||0.0025,'%')],([a,b,c])=>(a-b)*c,([a,b,c])=>`(${a} − ${b}) × ${fv(c,'%')}`)});
  const quote=()=>M('quote',()=>{const rin=X.opt.rate!=null?X.opt.rate:p.rate,base=X.opt.rate!=null?con('Mortgage rate tested',rin,'%'):set('rate',p.rate,'%',p.term===15?'rate15':'rate',{pk:['rate','term']});
    return LS.type==='arm'?fn('ARM starting rate',rin-(p.rate-(p.armRate!=null?p.armRate:p.rate)),'%','armQuote',()=>[base,set('rate',p.rate,'%','rate'),set('armRate',p.armRate,'%')],([a,b,c])=>a-(b-c)):base});
  const rate0=()=>M('r0',()=>fn('Your loan rate at purchase',LS.rate,'%','rate0',()=>[quote(),cAdj(),set('pts',p.pts||0,'n'),set('ptsCut',p.ptsCut||0,'%')],([q,c,n,k])=>Math.max(0,q+c-n*k),null,{pk:['loanType']}));
  const rateM=(y,m)=>M(`rate:${y}:${m}`,()=>{const e=evAt(y,m);if(!e)return rate0();if(e.move)return moveRate(e.y);const q=e.ev,lab=`Loan rate from ${YL(e.y)}, month ${e.m+1}`;
    if(q.k==='refi')return sum(lab+' (refinanced)',q.rate,'%','refiRate',()=>[[1,mktM(e.y,e.m)],[1,cAdj()]],{pk:['refiOn','refiTh']});
    const prev=e.m>0?rateM(e.y,e.m-1):e.y>0?rateM(e.y-1,11):rate0(),first=!tr.years.some((Y,yy)=>Y.mo.some((x,mm)=>x.ev&&x.ev.k==='arm'&&(yy<e.y||(yy===e.y&&mm<e.m))));
    return fn(lab+' (ARM reset)',q.rate,'%','armReset',()=>[con('ARM index (T-bill rate)',q.idx||0,'%',{pk:['armYears']}),set('armMargin',p.armMargin||0.0275,'%'),prev,con(first?'First-reset cap':'Per-reset cap',first?(p.armCapInit!=null?p.armCapInit:0.02):(p.armCapPer!=null?p.armCapPer:0.01),'%',{pk:['armCapInit','armCapPer']}),rate0(),con('Lifetime cap',p.armCapLife!=null?p.armCapLife:0.05,'%',{pk:['armCapLife']})],
      ([x,mg,r,c,r0,cl])=>{let t=Math.round((x+mg)*800)/800;t=Math.min(r+c,Math.max(r-c,t));return Math.min(r0+cl,Math.max(mg,t))})});
  const moveRate=y=>M('mvr:'+y,()=>{const mr=path.monthly?path.mkt&&path.mkt[y*12]:path.mkt&&path.mkt[y];const v=Yr(y).rate;
    return mr!=null?sum(`Loan rate on the new home, ${YL(y)}`,v,'%','refiRate',()=>[[1,mktM(y,0)],[1,cAdj()]]):fn(`Loan rate on the new home, ${YL(y)}`,v,'%',null,()=>[rateM(y-1,11)],([a])=>a)});
  const iM=(y,m)=>M(`i:${y}:${m}`,()=>fn(`Monthly rate, ${YL(y)} month ${m+1}`,Mo(y,m).i,'%','monthlyRate',()=>[rateM(y,m)],([r])=>r/12));
  const payM=(y,m)=>M(`M:${y}:${m}`,()=>{const e=evAt(y,m),v=Mo(y,m).Mp;
    if(!e)return fn('Monthly principal and interest',v,'$','payment',()=>[loanAmt(),rate0(),con('Payments',LS.nTot,'n',{pk:['term']})],([L,r,n])=>pmt(L,r/12,n));
    if(e.move)return fn(`Monthly payment on the new loan, ${YL(e.y)}`,v,'$','payment',()=>[balStart(e.y),moveRate(e.y),con('Payments',LS.nTot,'n',{pk:['term']})],([L,r,n])=>pmt(L,r/12,n));
    return fn(`Monthly payment from ${YL(e.y)}, month ${e.m+1}`,v,'$','payment',()=>[balM(e.y,e.m),rateM(e.y,e.m),con('Payments left',e.ev.left,'n')],([L,r,n])=>pmt(L,r/12,n))});
  const bal=t=>M('bal:'+t,()=>{if(!E(t).owned)return why(`Mortgage balance ${TL(t)}`,0,'$','no loan: sold at the planned move',['moveMode']);if(t===0)return loanAmt();
    const y0=E(t).purchY,ys=[...Array(t-y0)].map((_,k)=>y0+k),span=ys.length>1?`years ${y0+1}–${t}`:YL(y0);
    return sum(`Mortgage balance ${TL(t)}`,E(t).bal,'$','balanceYear',()=>[[1,y0?balStart(y0):loanAmt()],
      [-1,sum(`Principal repaid, ${span}`,ys.reduce((a,y)=>a+prinYv(y),0),'$','sumYears',()=>ys.map(y=>[1,prinY(y)]))],
      [-1,sum(`Extra principal, ${span}`,ys.reduce((a,y)=>a+preYv(y),0),'$','sumYears',()=>ys.map(y=>[1,preY(y)]))]])});
  const balStart=y=>mv&&mv.y===y&&mv.mode==='buy'?M('nl:'+y,()=>fn(`New loan at the planned move, ${YL(y)}`,Yr(y).bal,'$','moveLoan',()=>[H(y),homeNet(y),closeRate()],([P,c,k])=>P-Math.min(P,Math.max(0,c-k*P)),null,{pk:['moveMode','moveYear']})):bal(y);
  const balM=(y,m)=>M(`bm:${y}:${m}`,()=>m===0?balStart(y):sum(`Balance at the start of ${YL(y)}, month ${m+1}`,Mo(y,m).bal0,'$','balanceMonth',()=>[[1,balM(y,m-1)],[-1,prinM(y,m-1)],[-1,preM(y,m-1)]]));
  const intM=(y,m)=>M(`int:${y}:${m}`,()=>Mo(y,m).bal0>0.005?prod(`Interest, ${YL(y)} month ${m+1}`,Mo(y,m).int,'$','interest',()=>[balM(y,m),iM(y,m)]):why(`Interest, ${YL(y)} month ${m+1}`,0,'$','the loan is paid off'));
  const prinM=(y,m)=>M(`pr:${y}:${m}`,()=>Mo(y,m).bal0>0.005?fn(`Principal, ${YL(y)} month ${m+1}`,Mo(y,m).prin,'$','principal',()=>[payM(y,m),intM(y,m),balM(y,m)],([Mp,I,B])=>Math.min(Mp-I,B),([Mp,I,B])=>`min(${fv(Mp,'$')} − ${fv(I,'$')}, ${fv(B,'$')})`):why(`Principal, ${YL(y)} month ${m+1}`,0,'$','the loan is paid off'));
  const preM=(y,m)=>M(`pre:${y}:${m}`,()=>!(p.extraPay>0)||p.extraMode==='invest'?why(`Extra principal, ${YL(y)} month ${m+1}`,0,'$',p.extraPay>0?'the extra goes to the buyer\'s portfolio':'no extra payments',['extraPay','extraMode']):
    fn(`Extra principal, ${YL(y)} month ${m+1}`,Mo(y,m).pre,'$','prepay',()=>[set('extraPay',p.extraPay,'$'),balM(y,m),prinM(y,m)],([x,B,pr])=>Math.min(x,B-pr),null,{pk:['extraMode']}));
  const prinYv=y=>months(m=>Mo(y,m).prin||0).reduce((a,b)=>a+b,0),preYv=y=>months(m=>Mo(y,m).pre||0).reduce((a,b)=>a+b,0);
  const prinY=y=>M('prY:'+y,()=>sumMonths(`Principal paid in ${YL(y)}`,y,'$','sum12',q=>q.prin||0,m=>prinM(y,m)));
  const preY=y=>M('preY:'+y,()=>sumMonths(`Extra principal paid in ${YL(y)}`,y,'$','sum12',q=>q.pre||0,m=>preM(y,m)));
  const intY=y=>M('intY:'+y,()=>sumMonths(`Mortgage interest in ${YL(y)}`,y,'$','sum12',q=>q.int||0,m=>intM(y,m)));
  // ---- owner's costs ----
  const Fb=y=>M('Fb:'+y,()=>y===Yr(y).purchY?priceAt(y):fn(`Capped assessment base, ${YL(y)}`,Yr(y).Fb,'$','assessBase',()=>[Fb(y-1),set('ptaxCap',p.ptaxCap,'%'),set('ptaxCapCPI',p.ptaxCapCPI?1:0,'n'),pathY('inf',y-1)],
    ([b,c,k,i])=>b*(1+Math.min(c>0?c:Infinity,k?Math.max(0,i):Infinity))));
  const A=y=>M('A:'+y,()=>{const v=Yr(y).A;if(y===Yr(y).purchY)return fn(`Assessed value, ${YL(y)}`,v,'$','assessBuy',()=>[priceAt(y)],([a])=>a);
    return p.ptaxCap>0||p.ptaxCapCPI?fn(`Assessed value, ${YL(y)}`,v,'$','assessCap',()=>[H(y),Fb(y)],([h,b])=>Math.min(h,b)):fn(`Assessed value, ${YL(y)}`,v,'$','assess',()=>[H(y)],([h])=>h,null,{pk:['ptaxCap','ptaxCapCPI']})});
  const ptaxY=y=>M('pt:'+y,()=>fn(`Property tax for ${YL(y)}`,Yr(y).ptY,'$','ptax',()=>[set('ptax',p.ptax,'%'),A(y),set('hsEx',p.hsEx||0,'$'),set('hsCredit',p.hsCredit||0,'$')],([r,a,e,c])=>Math.max(0,r*Math.max(0,a-e)-c)));
  const maintY=y=>M('mt:'+y,()=>prod(`Upkeep for ${YL(y)}`,Yr(y).maintY,'$','maint',()=>[set('maint',p.maint,'%'),H(y),Yr(y).mShock!==1?con('Upkeep shock this year (simulated)',Yr(y).mShock,'x',{sec:'monte-carlo'}):null]));
  const insMo=y=>M('im:'+y,()=>fn(`Home insurance per month, ${YL(y)}`,Yr(y).insM,'$','ins',()=>[set('ins',p.ins,'$'),set('floodIns',p.floodIns,'$'),insIdx(y)],([a,b,c])=>(a+b)*c/12));
  const byInf=(id,label,y,v)=>prod(`${label}, ${YL(y)}`,v,'$','byInfl',()=>[set(id,p[id],'$'),infIdx(y)]);
  const pmiRateN=y=>M('pmir:'+y,()=>{const k=creditAdj(p).pmi,ltv=1-Yr(y).dpCur,c=PMI_COV.find(([l])=>ltv>l+1e-9),cov=c?c[1]:12;
    return fn('PMI rate',pmiRate(p,Yr(y).dpCur),'%','pmiRate',()=>[set('pmi',p.pmi,'%'),k!==1?dat(`PMI cost factor for score ${p.fico}`,k,'x',['pmiFico'],{pk:['fico','credit']}):con('PMI cost factor for your score',1,'x',{pk:['fico','credit']}),
      p.pmiScale!==false?con(`Required coverage at ${pct(ltv,0)} loan-to-value`,cov,'n',{src:['fnmaMiCov'],pk:['pmiScale']}):con('Coverage scaling off',35,'n',{pk:['pmiScale']})],([r,f,cv])=>r*f*cv/35,([r,f,cv])=>`${fv(r,'%')} × ${f.toFixed(3)} × ${cv} ÷ 35`)});
  const pmiM=(y,m)=>M(`pmi:${y}:${m}`,()=>{const q=Mo(y,m),lab=`Mortgage insurance, ${YL(y)} month ${m+1}`;
    if(q.fha)return q.mSince<q.mipMonths&&q.balPrev>0.005?fn(lab,q.pmi,'$','mip',()=>[con('FHA annual premium',q.mipRate,'%',{src:['lr_fha'],pk:['loanType','term']}),balM(y,m)],([r,b])=>r*b/12):why(lab,0,'$','FHA premium has ended (after 11 years with 10% or more down)',['loanType']);
    if(q.dpCur>=0.2)return why(lab,0,'$','no PMI with 20% or more down',['dp','pmi']);
    if(q.pmiOff)return why(lab,0,'$','removed early with an appraisal',['pmiAppr']);
    if(!(q.balPrev>0.78*q.Pcur))return why(lab,0,'$','PMI has ended: the balance is below 78% of the price',['pmi','pmiAppr']);
    return fn(lab,q.pmi,'$','pmi',()=>[pmiRateN(y),y>0&&mv&&mv.mode==='buy'&&mv.y<=y?balStart(mv.y):loanAmt()],([r,L])=>r*L/12,null,{pk:['pmiAppr']})});
  const hhY=y=>M('hh:'+y,()=>Yr(y).hhInc>0?fn(`House-hack rent received per month, ${YL(y)}`,Yr(y).hhInc,'$','hh',()=>[set('hhRent',p.hhRent,'$'),fn(`Market rent index, ${YL(y)}`,Yr(y).mktIdx,'x','mktIdx',()=>[mkt(y),set('rent0',p.rent0,'$')],([a,b])=>a/b),set('hhVac',p.hhVac,'%')],([r,k,v])=>r*k*(1-v)):
    why('House-hack rent received',0,'$','no part of the home is rented out',['hhRent','hhShare','hhVac']));
  const taxSave=y=>M('ts:'+y,()=>{const T=Yr(y).tax;if(!T)return why(`Income tax saved by owning, ${YL(y)}`,0,'$','taxes are off',['taxOn']);
    const kids=()=>[muN(y),dB(y),dR(y),set('stDed',p.stDed?1:0,'n'),set('stRate',p.stRate,'%'),intY(y),f750(y),ptaxY(y),con('Share of the home you live in',T.own_s,'%',{pk:['hhShare','hhRent']})];
    return fn(`Income tax saved by owning, ${YL(y)}`,T.benefit,'$','taxSave',kids,([mu,b,r,sd,st,i,f,pt,os])=>mu*(b-r)+(sd?st*(i*f+pt)*os:0),([mu,b,r,sd,st,i,f,pt,os])=>`${fv(mu,'%')} × (${fv(b,'$')} − ${fv(r,'$')})${sd?` + ${fv(st,'%')} × (${fv(i,'$')} × ${f.toFixed(3)} + ${fv(pt,'$')}) × ${os.toFixed(2)}`:''}`,{sec:'federal-and-state-tax-saving'})});
  const stdN=y=>M('std:'+y,()=>fn(`Standard deduction, ${YL(y)}`,Yr(y).tax.std,'$','std',()=>[con(`2026 standard deduction, ${p.filing==='mfj'?'married joint':'single'}`,p.filing==='mfj'?32200:16100,'$',{src:['irs26'],pk:['filing']}),con('Indexing from 2026 to the start year',LS.tk,'x',{pk:['y0','inf']}),infIdx(y)],([s,k,i])=>s*k*i));
  const capN=y=>M('cap:'+y,()=>fn(`SALT cap, ${YL(y)}`,Yr(y).tax.cap,'$','salt',()=>[income(y)],([inc])=>saltCapFor(y,inc,p.y0),null,{src:['salt'],pk:['y0'],note:'$40,400 in 2026, +1% a year through 2029, $10,000 from 2030; reduced by 30% of income above $505,000'}));
  const stTN=y=>M('stt:'+y,()=>fn(`State and local income tax, ${YL(y)}`,Yr(y).tax.stT,'$','stTax',()=>[set('stTax',p.stTax,'$'),income(y),set('income',p.income,'$')],([s,i,i0])=>i0>0?s*i/i0:s));
  const dR=y=>M('dR:'+y,()=>fn(`Renter's deductions, ${YL(y)}`,Yr(y).tax.dR,'$','dRent',()=>[stdN(y),capN(y),stTN(y),set('oth',p.oth||0,'$')],([s,c,st,o2])=>Math.max(s,Math.min(c,st)+o2)));
  const f750=y=>M('f750:'+y,()=>fn(`Share of interest deductible, ${YL(y)}`,Yr(y).tax.f750,'x','f750',()=>[sumMonths(`Sum of the 12 month-start balances, ${YL(y)}`,y,'$','sum12',q=>q.balPrev||0,m=>balM(y,m))],([s])=>s>0?Math.min(1,750000*12/s):1,null,{src:['irs936']}));
  const pmiY=y=>M('pmiY:'+y,()=>sumMonths(`Mortgage insurance in ${YL(y)}`,y,'$','sum12',q=>q.pmi||0,m=>pmiM(y,m)));
  const dB=y=>M('dB:'+y,()=>{const T=Yr(y).tax;return fn(`Owner's deductions, ${YL(y)}`,T.dB,'$','dOwn',()=>[stdN(y),capN(y),stTN(y),ptaxY(y),con('Share of the home you live in',T.own_s,'%',{pk:['hhShare','hhRent']}),intY(y),f750(y),pmiY(y),
      fn('Share of mortgage insurance deductible',T.fMI,'x','fMI',()=>[income(y)],([i])=>i<=100000?1:Math.max(0,1-Math.ceil((i-100000)/1000)*0.1)),con(y===0?'Discount points paid':'Discount points (deducted in year 1 only)',T.pts,'$',{pk:['pts']}),set('oth',p.oth||0,'$')],
    ([s,c,st,pt,os,i,f,mi,fm,pts,o2])=>Math.max(s,Math.min(c,st+pt*os)+(i*f+mi*fm+pts)*os+o2))});
  const hhTaxM=y=>M('hht:'+y,()=>{const T=Yr(y).tax;return fn(`Tax on house-hack rent, ${YL(y)}`,Mo(y,11).hhTax,'$','hhTax',()=>[hhY(y),set('hhShare',p.hhShare,'%'),intY(y),ptaxY(y),insMo(y),maintY(y),set('impShare',p.impShare,'%'),byInf('utilDiff','Extra utilities',y,Yr(y).utilM),muN(y),set('stRate',p.stRate,'%')],
    ([h,sh,i,pt,ins,mt,im,u,mu,st])=>Math.max(0,h*12-sh*(i+pt+ins*12+mt*(1-im)+u*12))*(mu+st),null,{note:T&&T.hhTaxable!=null?`taxable rent ${fmtFull(T.hhTaxable)}`:''})});
  const payPaid=(y,m)=>{const q=Mo(y,m);return Math.abs(q.pay-(q.int+q.prin))<1e-6?sum(`Mortgage payment, ${YL(y)} month ${m+1}`,q.pay,'$','paySplit',()=>[[1,intM(y,m)],[1,prinM(y,m)]]):fn(`Mortgage payment kept in the budget after payoff, ${YL(y)} month ${m+1}`,q.pay,'$',null,()=>[payM(y,m)],([a])=>a)};
  const own=(y,m)=>M(`own:${y}:${m}`,()=>{const q=Mo(y,m),lab=`Owner's cost, ${YL(y)} month ${m+1}`;
    if(!q.owned)return fn(lab+' (renting after the move)',q.own,'$',null,()=>[rentY(y)],([r])=>r);
    const dec=m===11&&tx;
    return sum(lab,q.own,'$','ownCost',()=>[[1,payPaid(y,m)],[1,set('extraPay',p.extraPay||0,'$')],[1,fn('Property tax per month',Yr(y).ptY/12,'$','perMo',()=>[ptaxY(y)],([a])=>a/12)],
      [1,fn('Upkeep per month',Yr(y).maintY/12,'$','perMo',()=>[maintY(y)],([a])=>a/12)],[1,insMo(y)],[1,byInf('hoa','HOA',y,Yr(y).hoa)],[1,byInf('utilDiff','Extra utilities',y,Yr(y).utilM)],[1,pmiM(y,m)],
      q.refi>0?[1,prod('Refinance cost',q.refi,'$','refiCost',()=>[set('refiCost',p.refiCost,'%'),balM(y,m)])]:null,[-1,hhY(y)],dec?[-1,taxSave(y)]:null,dec&&p.hhRent>0?[1,hhTaxM(y)]:null])});
  const mkt=y=>M('mkt:'+y,()=>y===0?set('rent0',p.rent0,'$'):prod(`Market rent, ${YL(y)}`,Yidx(y,'mkt'),'$','marketRent',()=>[set('rent0',p.rent0,'$')].concat(upto(y).map(k=>gf('gr',k)))));
  const lease=y=>M('lease:'+y,()=>{const v=Yr(y).lease;if(y===0)return set('rent0',p.rent0,'$');
    if(mv&&mv.y===y)return fn(`Rent, ${YL(y)} (reset to market at the planned move)`,v,'$',null,()=>[mkt(y)],([a])=>a);
    return fn(`Rent, ${YL(y)}`,v,'$','lease',()=>[lease(y-1),pathY('gr',y-1),set('renewGap',p.renewGap||0,'%'),set('rMove',p.rMove,'%'),mkt(y)],([l,g,d,e,mk])=>{e=Math.min(1,Math.max(0,e));return (1-e)*l*(1+g-d)+e*mk})});
  const rentY=y=>M('rent:'+y,()=>sum(`Renter's cost per month, ${YL(y)}`,Yr(y).rentM,'$','rentCost',()=>[[1,lease(y)],[1,fn("Renter's insurance per month",p.rins*Yr(y).infIdx/12,'$','rins',()=>[set('rins',p.rins,'$'),infIdx(y)],([a,b])=>a*b/12)],
    [1,fn('Moving costs per month',p.rMove*(p.rMoveCost*Yr(y).infIdx+p.broker*Yr(y).mkt)/12,'$','moves',()=>[set('rMove',p.rMove,'%'),set('rMoveCost',p.rMoveCost,'$'),infIdx(y),set('broker',p.broker,'n'),mkt(y)],([e,c,i,b,mk])=>e*(c*i+b*mk)/12)]]));
  const dlt=(y,m)=>M(`d:${y}:${m}`,()=>sum(`Owning minus renting, ${YL(y)} month ${m+1}`,Mo(y,m).d,'$','delta',()=>[[1,own(y,m)],[-1,rentY(y)]]));
  // ---- portfolios: B buyer, R renter (invests), C renter (T-bills) ----
  const ACC={B:'Buyer\'s portfolio',R:'Renter\'s portfolio',C:'Rent + T-bills savings'},endV=(a,t)=>a==='B'?E(t).pB:a==='R'?E(t).pR:E(t).pC;
  const cash0=()=>M('c0',()=>fn('Cash the renter keeps: down payment, closing costs, move-in, points',endV('R',0),'$','cash0',()=>[set('P',p.P,'$'),set('dp',p.dp,'%'),closeRate(),set('moveIn',p.moveIn||0,'$'),ptsCost()],([P0,d,c,mi,pc])=>P0*(d+c)+mi+pc));
  const ptsCost=()=>M('pc',()=>fn('Cost of discount points',LS.ptsCost,'$','ptsCost',()=>[set('pts',p.pts||0,'n'),loanBase()],([n,b])=>n/100*b));
  const loanBase=()=>M('lb0',()=>fn('Price minus down payment',p.P*(1-p.dp),'$','loan',()=>[set('P',p.P,'$'),set('dp',p.dp,'%')],([a,d])=>a*(1-d)));
  const V=(a,t)=>M(`V${a}:${t}`,()=>{if(t===0)return a==='B'?con("Buyer's portfolio at the start",0,'$',{note:'the buyer\'s cash went into the home'}):cash0();
    const ys=upto(t),Σ=(lab,f,g)=>sum(`${lab}, ${t>1?`years 1–${t}`:'year 1'}`,ys.reduce((s2,k)=>s2+f(k),0),'$','sumYears',()=>ys.map(k=>[1,g(k)])),mvc=a==='B'&&mv&&mv.y<t?Yr(mv.y).pB-E(mv.y).pB:0;
    const yv=(k,f)=>months(m=>f(Mo(k,m))).reduce((s2,x)=>s2+x,0);
    return sum(`${ACC[a]} ${TL(t)}`,endV(a,t),'$','ledger',()=>[[1,V(a,0)],[1,Σ('Investment returns',k=>yv(k,q=>q[a].ret),k=>retY(a,k))],[-1,Σ('Tax on dividends and interest',k=>yv(k,q=>q[a].tax),k=>taxY(a,k))],
      a!=='C'&&ys.some(k=>yv(k,q=>q[a].brw+q[a].clamp))?[1,Σ('Overdraft interest and floor',k=>yv(k,q=>q[a].brw+q[a].clamp),k=>otherY(a,k)?otherY(a,k)[1]:con('none',0,'$'))]:null,
      [1,Σ(a==='B'?'Buyer adds':'Renter adds',k=>yv(k,q=>a==='B'?q.addB+(q.xB||0):q.addR),k=>addY(a,k))],mvc?[1,moveCashN(mv.y)]:null])});
  const moveCashN=y=>M('mvc:'+y,()=>fn('Cash from the planned move',Yr(y).pB-E(y).pB,'$','moveCash',()=>[homeNet(y),H(y),closeRate()],
    ([c,P0,k])=>mv.mode==='rent'?c:(c-k*P0>P0?c-k*P0-P0:c-k*P0<0?c-k*P0:0),null,{pk:['moveMode']}));
  const Vstart=(a,y)=>a==='B'&&mv&&mv.y===y?M('VBm:'+y,()=>sum(`Buyer's portfolio at the start of ${YL(y)}, after the move`,Yr(y).pB,'$','moveAdd',()=>[[1,V('B',y)],[1,moveCashN(y)]])):V(a,y);
  const VM=(a,y,m)=>M(`VM${a}:${y}:${m}`,()=>m===0?Vstart(a,y):sum(`${ACC[a]}, start of ${YL(y)} month ${m+1}`,Mo(y,m)[a].v0,'$','ledgerMonth',()=>{const q=Mo(y,m-1)[a];
    return [[1,VM(a,y,m-1)],[1,retM(a,y,m-1)],[-1,taxM(a,y,m-1)],q.brw?[1,brwM(a,y,m-1)]:null,q.clamp?[1,con('Floor at zero',q.clamp,'$')]:null,[1,addM(a,y,m-1)]]}));
  const retM=(a,y,m)=>M(`ret${a}:${y}:${m}`,()=>{const q=Mo(y,m)[a];if(a!=='C'&&q.v0<0)return why('Investment return',0,'$','the account is overdrawn (see borrowing cost)');
    return prod(`Investment return, ${YL(y)} month ${m+1}`,q.ret,'$','return',()=>[VM(a,y,m),a==='C'?mret('rc',y,m):rho(y,m)])});
  const taxM=(a,y,m)=>M(`tax${a}:${y}:${m}`,()=>{const q=Mo(y,m)[a],lab=`Tax on dividends and interest, ${YL(y)} month ${m+1}`;
    if(a==='C')return tx?fn(lab,q.tax,'$','taxCash',()=>[VM(a,y,m),mret('rc',y,m),muE(y)],([v,r,mu])=>v*r*mu):why(lab,0,'$','taxes are off',['taxOn']);
    if(!taxable)return why(lab,0,'$',tx?'sheltered account: no tax':'taxes are off',['acct','taxOn']);
    return q.v0<0?why(lab,0,'$','the account is overdrawn'):prod(lab,q.tax,'$','invTax',()=>[VM(a,y,m),tau(y,m)])});
  const brwM=(a,y,m)=>fn(`Interest on the overdraft, ${YL(y)} month ${m+1}`,Mo(y,m)[a].brw,'$','overdraft',()=>[VM(a,y,m),mret('rc',y,m),con('Borrowing premium over T-bills',BORROW_PREM,'%')],([v,r,b])=>v*(r+b/12));
  const addM=(a,y,m)=>M(`add${a}:${y}:${m}`,()=>{const q=Mo(y,m);
    if(a!=='B')return fn(`Renter invests, ${YL(y)} month ${m+1}`,q.addR,'$','investR',()=>[set('investShare',p.investShare,'%'),dlt(y,m)],([s,d])=>s*Math.max(0,d));
    const x=fn(`Buyer invests, ${YL(y)} month ${m+1}`,q.addB,'$','investB',()=>[set('investShare',p.investShare,'%'),dlt(y,m)],([s,d])=>s*Math.max(0,-d));
    if(!q.xB)return x;const pp=Math.abs(q.xB-((q.x||0)-(q.pre||0)))>1e-6;
    return sum(`Buyer adds to the portfolio, ${YL(y)} month ${m+1}`,q.addB+q.xB,'$','investBx',()=>[[1,x],[1,fn('Extra payment not used on the loan',q.xB,'$','extraInvest',()=>[set('extraPay',p.extraPay||0,'$'),preM(y,m)].concat(pp?[con('Scheduled payment kept after payoff',q.xB-((q.x||0)-(q.pre||0)),'$')]:[]),a2=>a2[0]-a2[1]+(a2[2]||0),null,{pk:['extraMode']})]])});
  const retY=(a,y)=>M(`retY${a}:${y}`,()=>sumMonths(`Investment returns in ${YL(y)}`,y,'$','sum12',q=>q[a].ret,m=>retM(a,y,m)));
  const taxY=(a,y)=>M(`taxY${a}:${y}`,()=>sumMonths(`Tax on dividends and interest in ${YL(y)}`,y,'$','sum12',q=>q[a].tax,m=>taxM(a,y,m)));
  const addY=(a,y)=>M(`addY${a}:${y}`,()=>sumMonths(a==='B'?`Buyer adds in ${YL(y)}`:`Renter adds in ${YL(y)}`,y,'$','sum12',q=>a==='B'?q.addB+(q.xB||0):q.addR,m=>addM(a,y,m)));
  const otherY=(a,y)=>{if(a==='C')return null;const v=Mo(y,0)&&months(m=>Mo(y,m)[a].brw+Mo(y,m)[a].clamp).reduce((s,x)=>s+x,0);if(!v)return null;
    return [1,M(`oth${a}:${y}`,()=>sum(`Overdraft interest and floor, ${YL(y)}`,v,'$','sum12',()=>months(m=>{const q=Mo(y,m)[a];return q.brw?[1,brwM(a,y,m)]:q.clamp?[1,con('Floor at zero',q.clamp,'$')]:[1,con('none',0,'$')]})))]};
  const rho=(y,m)=>M(`rho:${y}:${m}`,()=>fn(`Portfolio return, ${YL(y)} month ${m+1}`,Mo(y,m).ret,'%','rho',()=>[gport(y,m),set('lev',p.lev,'x'),mret('rc',y,m),set('spread',p.spread||0,'%'),set('fee',p.fee,'%')],
    ([g,l,c,s,f])=>l*g-(l-1)*c-Math.max(0,l-1)*s/12-f/12));
  const gport=(y,m)=>M(`g:${y}:${m}`,()=>fn(`Mix return before fees, ${YL(y)} month ${m+1}`,Mo(y,m).g,'%','mix',()=>[set('ws',p.ws,'%'),mret('rs',y,m),set('wb',p.wb,'%'),mret('rb',y,m),mret('rc',y,m)],
    ([ws,s,wb,b,c])=>ws*s+wb*b+Math.max(0,1-ws-wb)*c,([ws,s,wb,b,c])=>`${fv(ws,'%')} × ${fv(s,'%')} + ${fv(wb,'%')} × ${fv(b,'%')} + ${fv(Math.max(0,1-ws-wb),'%')} × ${fv(c,'%')}`));
  const tau=(y,m)=>M(`tau:${y}:${m}`,()=>fn(`Tax per dollar invested, ${YL(y)} month ${m+1}`,Mo(y,m).taxR,'%','tau',()=>[set('lev',p.lev,'x'),set('ws',p.ws,'%'),set('dy',p.dy,'%'),ltcgE(y),set('wb',p.wb,'%'),mret('rb',y,m),mret('rc',y,m),muE(y)],
    ([l,ws,dy,L,wb,b,c,mu])=>{const wc=Math.max(0,1-ws-wb),cs=Math.max(0,1-l);return l*(ws*dy/12*L+(wb*b+wc*c)*mu)+cs*c*mu}));
  const incM=(y,m)=>fn(`Taxable income per dollar, ${YL(y)} month ${m+1}`,Mo(y,m).inc,'%','incPerDollar',()=>[set('lev',p.lev,'x'),set('ws',p.ws,'%'),set('dy',p.dy,'%'),set('wb',p.wb,'%'),mret('rb',y,m),mret('rc',y,m)],
    ([l,ws,dy,wb,b,c])=>l*(ws*dy/12+wb*b+Math.max(0,1-ws-wb)*c)+Math.max(0,1-l)*c);
  const basis=(a,t)=>M(`bs${a}:${t}`,()=>{const v=a==='B'?E(t).bB:E(t).bR;if(t===0)return a==='B'?con('Cost basis at the start',0,'$'):cash0();const y=t-1;
    const binc=months(m=>Mo(y,m)[a].binc).reduce((s,x)=>s+x,0),add=months(m=>a==='B'?Mo(y,m).addB+(Mo(y,m).xB||0):Mo(y,m).addR).reduce((s,x)=>s+x,0),b0=a==='B'?Yr(y).bB:Yr(y).bR,start=a==='B'?E(y).bB:E(y).bR,rest=v-b0-binc-add;
    return sum(`Cost basis of the ${a==='B'?"buyer's":"renter's"} portfolio ${TL(t)}`,v,'$','basis',()=>[[1,basis(a,y)],Math.abs(b0-start)>0.005?[1,con('Cash from the planned move',b0-start,'$')]:null,
      [1,sumMonths(`Taxed income reinvested in ${YL(y)}`,y,'$','sum12',q=>q[a].binc,m=>Mo(y,m)[a].v0<0||!taxable?why(`Taxed income reinvested, month ${m+1}`,Mo(y,m)[a].binc,'$',taxable?'the account is overdrawn':'no tax on this account',['acct','taxOn']):fn(`Taxed income reinvested, month ${m+1}`,Mo(y,m)[a].binc,'$','binc',()=>[VM(a,y,m),incM(y,m),tau(y,m)],([v2,i,tt])=>v2*(i-tt)))],
      [1,addY(a,y)],Math.abs(rest)>0.005?[1,con('Reset when the account was empty or overdrawn',rest,'$')]:null])});
  const liq=(a,t)=>M(`liq${a}:${t}`,()=>{const v=a==='B'?E(t).lb:E(t).lr,lab=`${ACC[a]} after tax on selling it, ${TL(t)}`;
    return taxable?fn(lab,v,'$','liquid',()=>[V(a,t),ltcgE(t),basis(a,t)],([w,k,b])=>w-k*Math.max(0,w-b)):fn(lab,v,'$',null,()=>[V(a,t)],([w])=>w,null,{note:tx?'sheltered account: no tax on selling':'taxes are off',pk:['acct','taxOn']})});
  // ---- the home sale at the end of year t ----
  const held=t=>t-E(t).purchY,shk=t=>held(t)>0?E(t).shk:1,Sx=t=>E(t).H*shk(t);
  const sellRate=t=>M('sr:'+t,()=>{const S=Sx(t);return p.ttRules?sum('Selling costs, share of the price',sellAt(p,S),'%','sell',()=>[[1,set('sellBase',p.sellBase,'%','sell')],[1,dat('Seller transfer taxes ÷ price (location rules)',transferTaxes(p.ttRules,S,0).seller/S,'%',[],{pk:['ttRules','ttAuto'],note:'state, county and city taxes for the location; sources next to the Transfer taxes setting'})]]):
    sum('Selling costs, share of the price',p.sell,'%','sell',()=>[[1,set('sellBase',p.sellBase,'%','sell')],[1,set('ttSell',p.ttSell,'%')]],{pk:['sell','ttRules']})});
  const saleNet=t=>M('sale:'+t,()=>fn(`Sale price after selling costs, ${TL(t)}`,Sx(t)*(1-sellAt(p,Sx(t))),'$','saleNet',()=>[H(t),shk(t)!==1?con('Single-home price shock at sale (simulated)',shk(t),'x',{sec:'monte-carlo',pk:['idio','idioMode']}):con('Single-home price shock',1,'x',{pk:['idio']}),sellRate(t)],([h,k,s])=>h*k*(1-s)));
  const homeBasis=t=>M('hb:'+t,()=>{const y=E(t).purchY;return fn(`Purchase cost basis${y?` (home bought in ${YL(y)})`:''}`,E(t).basis,'$','homeBasis',()=>[priceAt(y),closeRate()],([a,c])=>a*(1+c))});
  const impTot=t=>M('imp:'+t,()=>{const y0=E(t).purchY,ys=[...Array(Math.max(0,t-y0))].map((_,k)=>y0+k);
    return fn(`Improvements added to the basis ${TL(t)}`,E(t).imp,'$','improve',()=>[set('impShare',p.impShare,'%')].concat(ys.map(maintY)),([s,...ms])=>s*ms.reduce((a,b)=>a+b,0))});
  const gainN=t=>M('gain:'+t,()=>{const v=saleNet(t).v-E(t).basis-E(t).imp-(held(t)>=2?LS.excl:0);
    return sum(`Taxable gain on the home ${TL(t)}`,v,'$','gain',()=>[[1,saleNet(t)],[-1,homeBasis(t)],[-1,impTot(t)],[-1,held(t)>=2?con(`Home-sale exclusion, ${p.filing==='mfj'?'married joint':'single'}`,LS.excl,'$',{src:['irs121'],pk:['filing']}):why('Home-sale exclusion',0,'$','held less than 2 years: no exclusion')]])});
  const homeTax=t=>M('htx:'+t,()=>!tx?why(`Tax on the home sale ${TL(t)}`,0,'$','taxes are off',['taxOn']):
    fn(`Tax on the home sale ${TL(t)}`,E(t).ltcgE*Math.max(0,gainN(t).v),'$','homeTax',()=>[ltcgE(t),gainN(t)],([k,g])=>k*Math.max(0,g)));
  const homeNet=t=>M('hn:'+t,()=>!E(t).owned?why(`Home equity after selling ${TL(t)}`,0,'$','sold at the planned move',['moveMode','moveYear']):
    sum(`Home equity after selling ${TL(t)}`,E(t).home,'$','homeNet',()=>[[1,saleNet(t)],[-1,bal(t)],[-1,homeTax(t)]]));
  // ---- results ----
  const nwBuy=t=>M('nwB:'+t,()=>sum(`Buyer's net worth ${TL(t)}`,o.buy[t],'$','nwBuy',()=>[[1,homeNet(t)],[1,liq('B',t)]]));
  const nwInv=t=>M('nwR:'+t,()=>sum(`Renter's net worth ${TL(t)}`,o.inv[t],'$','nwRent',()=>[[1,liq('R',t)]]));
  const nwCash=t=>M('nwC:'+t,()=>sum(`Rent + T-bills net worth ${TL(t)}`,o.cash[t],'$','nwCash',()=>[[1,V('C',t)]]));
  const nwRental=t=>M('nwX:'+t,()=>{const e=E(t),pf=e.pX>=0?(taxable?e.pX-e.ltcgE*Math.max(0,e.pX-e.bX):e.pX):e.pX;
    return sum(`Rent + rental property net worth ${TL(t)}`,o.rental[t],'$','nwRental',()=>[[1,con('Rental property: sale value less loan and taxes',e.rentalNet,'$',{sec:'rent-rental-property',pk:['dpR','ratePrem','vacR','mgmt','landShare','rate30','rentalOn'],note:'the rental-property path is not itemized further'})],[1,con('Rental path portfolio after tax',pf,'$',{pk:['rentalOn']})]])});
  const real=(nd,c,lab)=>REAL?fn(lab||nd.label+", today's dollars",nd.v/c.v,'$','real',()=>[nd,c],([a,b])=>a/b,([a,b])=>`${fv(a,'$')} ÷ ${fv(b,'x')}`):nd;
  const ownAvg=y=>M('oa:'+y,()=>sum(`Owner's average monthly cost, ${YL(y)}`,months(m=>Mo(y,m).own).reduce((a,b)=>a+b,0)/12,'$','avg12',()=>months(m=>[1/12,own(y,m)])));
  const budget=y=>M('bud:'+y,()=>fn(`Monthly budget, ${YL(y)}`,o.budget[y+1],'$','budget',()=>[ownAvg(y),rentY(y)],([a,b])=>Math.max(a,b)));
  const helocN=t=>M('hel:'+t,()=>!(p.heloc>0)||!E(t).owned?why('Home-equity line available',0,'$',p.heloc>0?'no home':'no home-equity line',['heloc']):
    fn(`Home-equity line available ${TL(t)}`,o.heloc[t],'$','heloc',()=>[set('heloc',p.heloc,'%'),H(t),bal(t)],([k,h,b])=>Math.max(0,k*h-b)));
  /* model options read by the run: listed under every result */
  const opts=()=>['taxOn','acct','filing','loanType','term','refiOn','moveMode','extraMode','muMode','ltcgMode','stMode','pmiScale','pmiAppr','ttAuto','rentalOn','idioMode','volAdj'].filter(id=>document.getElementById(id))
    .map(id=>{const el=document.getElementById(id);return set(id,el.value,'opt',id,{opt:el.options?el.options[el.selectedIndex].text:el.value,pk:OPT_PK[id]||[id]})});
  return {X,p,o,tr,helocN,nwBuy,nwInv,nwCash,nwRental,homeNet,liq,V,H,bal,cpi,cpiMid,real,intY,prinY,preY,ptaxY,maintY,insMo,byInf,pmiY,taxSave,hhY,hhTaxM,rentY,own,ownAvg,budget,retY,taxY,addY,saleNet,homeTax,sellRate,closeRate,ptsCost,loanAmt,loanBase,opts,sum,fn,prod,con,why,set,months,Yr,Mo,E}}
/* settings an option brings with it: read by the model, but only used when the option is on */
const OPT_PK={refiOn:['refiOn','refiTh'],taxOn:['taxOn','y0','incGrowth','income','mu','niit','niitAuto','stRate','impShare'],rentalOn:['rentalOn','vacR','mgmt','dpR','ratePrem','landShare','rate30']};
const SER_RAW={gh:HOME,gr:RENTG,rs:STK,rb:BOND,rc:BILL,inf:INF};
/* a value with its unit, for the numbers line of an equation */
function fv(v,u){if(v==null||!isFinite(v))return '—';if(u==='$')return Math.abs(v)<100&&Math.abs(v-Math.round(v))>0.004?(v<0?'−$':'$')+Math.abs(v).toFixed(2):fmtFull(v);
  if(u==='%'){const a=Math.abs(v*100);return (v<0?'−':'')+a.toFixed(a&&a<0.1?4:a<1?3:2)+'%'}if(u==='x')return v.toFixed(v>=100?0:4);if(u==='mo')return v.toFixed(1)+' months';if(u==='pts')return String(v);if(u==='opt')return String(v);return Number(v).toLocaleString('en-US',{maximumFractionDigits:2})}
