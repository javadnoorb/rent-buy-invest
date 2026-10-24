/* Tests for the realism features and alternative ownership paths. */
module.exports=function({M,base,run,ok,near}){
  const p0=base({gh:0.03,gr:0.03,rs:0.07,rc:0.03,inf:0.025,ptax:0.01,maint:0.01,close:0.03,sell:0.06,rent0:1500,N:15});

  /* Rent reset: with no renewal gap the lease always equals market rent */
  {const a=run(p0,15,{detail:true}),b=run(Object.assign({},p0,{rMove:0.16}),15,{detail:true});
   near(a.flow[14].rent,1500*Math.pow(1.03,14),1e-9,'no gap, no moves: rent follows market growth');
   const c=run(Object.assign({},p0,{renewGap:0.01,rMove:0}),15,{detail:true});
   near(c.flow[14].rent,1500*Math.pow(1.02,14),1e-9,'renewals 1 point below market with no moves');
   const d=run(Object.assign({},p0,{renewGap:0.01,rMove:0.2}),15,{detail:true});
   ok(d.flow[14].rent>c.flow[14].rent&&d.flow[14].rent<1500*Math.pow(1.03,14),'moving pulls the lease back toward market rent')}

  /* Income growth moves the bracket in automatic mode */
  {const q=base({taxOn:true,muMode:'auto',income:95000,incGrowth:0.08,inf:0,N:12,P:500000,ptax:0.012,stTax:9000});
   const o=run(q,12);ok(o.income[12]>o.income[0]*2,'income compounds at the growth rate');
   ok(M.marginalRate(o.income[0],'single')<M.marginalRate(o.income[12],'single'),'higher income lands in a higher bracket');
   const flat=run(Object.assign({},q,{incGrowth:0}),12);ok(o.buy[12]-o.inv[12]!==flat.buy[12]-flat.inv[12],'income growth changes the tax outcome')}

  /* Planned move, then rent: buyer's wealth stops tracking the house */
  {const q=Object.assign({},p0,{moveYear:5,moveMode:'rent'}),o=run(q,15,{detail:true});
   ok(o.moved&&o.moved.year===5,'sale happens at the planned year');ok(o.H[6]===0&&o.bal[6]===0,'no house or mortgage after selling to rent');
   const s=run(Object.assign({},p0,{N:5}),5);
   near(o.buy[5],s.buy[5],1e-9,'wealth at the move year equals selling then')}

  /* Planned move, then buy again: pays closing costs a second time */
  {const q=Object.assign({},p0,{moveYear:5,moveMode:'buy'}),o=run(q,15,{detail:true}),n=run(p0,15,{detail:true});
   ok(o.H[6]>0,'owns a home again after the move');ok(o.buy[15]<n.buy[15],'selling and rebuying costs more than staying put');
   ok(Math.abs(o.inv[15]-n.inv[15])/n.inv[15]<0.25,'renter path is similar with or without the buyer moving')}

  /* House-hacking: rental income lowers the owner's cost */
  {const q=Object.assign({},p0,{hhRent:800,hhVac:0.05,hhShare:0.3}),o=run(q,15,{detail:true}),n=run(p0,15,{detail:true});
   near(n.flow[0].own-o.flow[0].own,800*0.95,1e-9,'house-hack income offsets the owner cost (no taxes)');
   ok(o.buy[15]>n.buy[15],'house-hacking raises the buyer outcome')}

  /* Rental-property path */
  {const q=Object.assign({},p0,{rentalOn:true,dpR:0.25,ratePrem:0.006,vacR:0.07,mgmt:0.08,landShare:0.2}),o=run(q,15);
   ok(o.rental.length===16&&o.rental.every(isFinite),'rental path produces finite wealth every year');
   const z=Object.assign({},q,{gh:0,gr:0,ptax:0,maint:0,ins:0,vacR:0,mgmt:0,sell:0,close:0,rs:0,rc:0,inf:0}),oz=run(z,10);
   ok(oz.rental[0]>0,'rental household starts with the same cash invested in property');
   const hiRent=run(Object.assign({},q,{rent0:2200}),15),loRent=run(Object.assign({},q,{rent0:1100}),15);
   ok(hiRent.rental[15]>loRent.rental[15],'higher rent yield raises the rental-property outcome')}

  /* FHFA volatility scaling keeps the mean and multiplies deviations by k */
  {const vals={};let v=100;for(let y=1990;y<=2025;y++){v*=1+(y%3===0?0.08:0.01);vals[y]=v}
   const raw=M.metroAnnual({hpi:{values:vals,volK:1.5}},true).filter(x=>x!=null),adj=M.metroAnnual({hpi:{values:vals,volK:1.5}}).filter(x=>x!=null);
   const mean=a=>a.reduce((s,x)=>s+x,0)/a.length,sd=a=>{const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/a.length)};
   near(mean(adj),mean(raw),1e-9,'volatility scaling keeps the average yearly change');near(sd(adj),1.5*sd(raw),1e-9,'volatility scaling multiplies the spread by k')}

  /* FHA: upfront MIP financed, annual MIP for 11 years at ≤90% LTV, for the full term above */
  {const q=Object.assign({},p0,{P:400000,dp:0.035,loanType:'fha',N:30,pmi:0.005}),o=run(q,30,{detail:true});
   near(o.bal[0],400000*0.965*1.0175,1e-12,'FHA loan includes the 1.75% upfront premium');
   near(o.flow[0].pmi*12/(400000*0.965*1.0175),0.0055,0.03,'FHA annual premium ≈ 0.55% at 96.5% LTV');
   ok(o.flow[25].pmi>0,'FHA premium lasts the whole term above 90% LTV');
   const r=run(Object.assign({},q,{dp:0.10}),30,{detail:true});ok(r.flow[10].pmi>0&&r.flow[11].pmi===0,'FHA premium stops after 11 years at 10% down')}

  /* Points lower the rate and cost cash up front */
  {const q=Object.assign({},p0,{rate:0.07,rate30:0.07,pts:2,ptsCut:0.0025,N:30}),o=run(q,30,{detail:true}),n=run(Object.assign({},q,{pts:0}),30,{detail:true});
   ok(o.flow[0].interest<n.flow[0].interest,'points lower the interest paid');
   near(o.inv[0]-n.inv[0],0.02*q.P*(1-q.dp),1e-9,'renter invests the cash the buyer spends on points')}

  /* ARM: resets after the fixed period, within caps */
  {const q=Object.assign({},p0,{loanType:'arm',rate:0.07,rate30:0.07,armRate:0.06,armYears:5,armMargin:0.0275,armCapInit:0.02,armCapPer:0.01,armCapLife:0.05,rc:0.06,N:12});
   const o=run(q,12,{detail:true});const r5=o.flow[4].interest,r6=o.flow[6].interest;
   ok(o.flow[0].interest<run(Object.assign({},q,{loanType:'fixed'}),12,{detail:true}).flow[0].interest,'ARM starts below the fixed rate');
   ok(r6>r5,'ARM rate rises at reset when the index is high');
   const lo=run(Object.assign({},q,{rc:0.0}),12,{detail:true});ok(lo.flow[7].interest<o.flow[7].interest,'a lower index gives a lower reset rate')}

  /* Insurance growing faster than inflation raises owner costs */
  {const a=run(Object.assign({},p0,{ins:3000,insG:0.03}),15,{detail:true}),b=run(Object.assign({},p0,{ins:3000,insG:0}),15,{detail:true});
   ok(a.flow[14].ins>b.flow[14].ins*1.4,'insurance compounds at inflation plus its extra growth')}

  /* Mortgage-rate paths pull back toward the expected long-run rate */
  {const q=Object.assign({},p0,{rate:0.12,rateLR:0.06,gh:0.04,rs:0.08,rb:0.04,rc:0.03,inf:0.025,N:10}),cfg={n:400,bl:5,from:1972,rc:true,home:M.HOME,real:true};
   const a=M.mcCore(q,cfg),med=k=>{const v=a.res.rates.map(x=>x[k]).sort((x,y)=>x-y);return v[v.length>>1]};
   ok(med(29)<0.11,'rates starting at 12% drift down toward a 6% long-run level')}

  /* Transfer taxes: hand-checked cases from the collected rules */
  {const tt=JSON.parse(require('fs').readFileSync(require('path').join(__dirname,'..','data','transfer_taxes.json'),'utf8')).metros;
   const pct=(slug,P,L)=>{const r=M.transferTaxes(tt[slug].taxes,P,L);return [r.buyer/P*100,r.seller/P*100]};
   const [b1,s1]=pct('seattle',500000,400000);near(s1,1.6,1e-9,'Seattle seller pays 1.1% state + 0.5% local under $525k');
   const [b2,s2]=pct('seattle',1500000,1200000);near(s2*15000,0.011*525000+0.0128*975000+0.005*1500000,1e-9,'Seattle state REET is marginal');
   const [b3,s3]=pct('washington-dc',500000,400000);near(b3,1.45,1e-9,'DC buyer recordation 1.45% at $400k+');near(s3,1.45,1e-9,'DC seller transfer 1.45%');
   const [b4,s4]=pct('dallas',500000,400000);ok(b4===0&&s4===0,'Texas has no transfer tax');
   const [b5]=pct('new-york',1500000,1200000);ok(b5>2,'NYC buyer pays mansion tax and mortgage recording tax over $1M')}

  /* Default inputs leave old results unchanged */
  {const a=run(p0,15),b=run(Object.assign({},p0,{renewGap:0,incGrowth:0,moveMode:'none',hhRent:0,rentalOn:false}),15);
   near(a.buy[15],b.buy[15],1e-12,'features off: identical results')}

  /* Monte Carlo with stress-linked moves and a forced-sale discount */
  {const q=Object.assign({},p0,{hz:0.06,stressMult:3,forcedDisc:0.1,gh:0.04,rs:0.08,rb:0.04,rc:0.03,inf:0.025,N:10});
   const cfg={n:300,bl:5,from:1928,rc:true,home:M.HOME,real:true},a=M.mcCore(q,cfg),b=M.mcCore(Object.assign({},q,{stressMult:1,forcedDisc:0}),cfg);
   ok(a.pForced>0,'some moves happen in bad years');ok(a.pMove<=b.pMove,'forced sales in downturns lower the win rate with moving')}

  /* Selling underwater: the shortfall is carried as debt, not forgiven */
  {const q=Object.assign({},p0,{dp:0.03,gh:-0.1,gr:0,rs:0,rc:0,inf:0,rent0:1500,moveYear:3,moveMode:'rent',N:6}),o=run(q,6,{detail:true});
   ok(o.buy[4]<0&&o.buy[6]<o.buy[4],'an underwater sale leaves debt that keeps growing');
   near(o.buy[5]/o.buy[4],Math.pow(1+0.03/12,12),1e-9,'the debt grows at T-bills + 3% with no other cash flows');
   const r=run(Object.assign({},q,{moveMode:'buy'}),6,{detail:true});
   ok(r.buy.every(isFinite)&&r.buy[6]<r.buy[3]+1,'underwater sell-and-rebuy also carries the shortfall');
   const z=Object.assign({},q,{gh:0,rent0:4000}),oz=run(z,6,{detail:true});
   ok(oz.pB[6]>0,'later savings pay the debt down and then grow')}

  /* Start year: tax figures for later years are indexed, and the SALT cap follows the calendar */
  {ok(M.taxIndex({y0:M.TAX_YEAR,inf:0.03})===1,'no indexing in the tax year');
   near(M.taxIndex({y0:M.TAX_YEAR+2,inf:0.03}),1.0609,1e-12,'two years of inflation indexing');
   ok(M.saltCapFor(0,0,2030)===10000&&M.saltCapFor(4,0)===10000&&M.saltCapFor(0,0)>40000,'SALT cap reverts in 2030 from any start year');
   ok(M.marginalRate(68000,'single',1.1)<M.marginalRate(68000,'single'),'indexed brackets lower the rate on the same nominal income')}

  /* Monthly paths equal to the annual ones give the same answer */
  {const q=Object.assign({},p0,{taxOn:true,acct:'taxable',dy:0.015,muMode:'manual',mu:0.24,ltcg:0.15,ptax:0.012,ins:1500,rb:0.04,ws:0.6,wb:0.3,N:8});
   const a=run(q,8),c=M.constPath(q,8),mo={monthly:true,mkt:[]};
   ['gh','gr','rs','rb','rc','inf'].forEach(k=>mo[k]=[].concat(...c[k].map(r=>Array(12).fill(Math.pow(1+r,1/12)-1))));
   c.mkt.forEach(r=>{for(let m=0;m<12;m++)mo.mkt.push(r)});
   const b=M.simulate(q,mo,{N:8});
   near(b.buy[8],a.buy[8],1e-9,'monthly and annual paths agree (buy)');near(b.inv[8],a.inv[8],1e-9,'monthly and annual paths agree (rent + invest)')}

  /* Random inputs: results stay finite and move the right way with home prices and stock returns */
  {let s=7;const u=()=>((s=Math.imul(s,48271)%2147483647)&0x7fffffff)/2147483647;
   let fin=true,mono=true;
   for(let t=0;t<150;t++){
     const q=Object.assign({},p0,{dp:0.03+0.5*u(),rate:0.03+0.06*u(),gh:-0.05+0.12*u(),gr:0.05*u(),rs:-0.02+0.12*u(),rc:0.04*u(),inf:0.04*u(),
       rent0:800+3000*u(),maint:0.02*u(),ptax:0.02*u(),taxOn:u()<0.5,acct:u()<0.5?'taxable':'sheltered',lev:1+u(),spread:0.01,
       moveMode:['none','rent','buy'][Math.floor(3*u())],moveYear:1+Math.floor(10*u()),N:15});
     const o=run(q,15);if(![...o.buy,...o.inv,...o.cash].every(isFinite))fin=false;
     const hiH=run(Object.assign({},q,{gh:q.gh+0.01}),15),hiS=run(Object.assign({},q,{rs:q.rs+0.01}),15);
     if(hiH.buy[15]<o.buy[15]-1e-6||hiS.inv[15]<o.inv[15]-1e-6)mono=false}
   ok(fin,'150 random setups: every result is finite');
   ok(mono,'150 random setups: faster home growth never lowers the buyer, faster stocks never lower the renter')}

  /* Extra principal: pays the loan off sooner; investing the same money instead leaves the renter unchanged */
  {const q=Object.assign({},p0,{extraPay:500,N:30}),pre=run(q,30,{detail:true}),inv=run(Object.assign({},q,{extraMode:'invest'}),30,{detail:true}),none=run(Object.assign({},p0,{N:30}),30,{detail:true});
   const off=k=>k.bal.findIndex((v,y)=>y>0&&v<=0.005);
   ok(off(pre)>0&&off(pre)<off(none)||off(none)<0,'extra principal pays the loan off sooner');
   near(pre.inv[30],inv.inv[30],1e-12,'the renter is the same whichever way the buyer uses the extra');
   ok(pre.inv[30]>none.inv[30],'the renter invests the same extra amount');
   const lo=Object.assign({},q,{rs:0.03,rc:0.03}),hi=Object.assign({},q,{rs:0.12});
   ok(run(lo,30).buy[30]>run(Object.assign({},lo,{extraMode:'invest'}),30).buy[30],'prepaying a 6% loan beats investing at 3%');
   ok(run(hi,30).buy[30]<run(Object.assign({},hi,{extraMode:'invest'}),30).buy[30],'investing at 12% beats prepaying a 6% loan')}

  /* PMI removed by appraisal once prices rise */
  {const q=Object.assign({},p0,{dp:0.1,pmi:0.006,gh:0.08,N:10}),a=run(q,10,{detail:true}),b=run(Object.assign({},q,{pmiAppr:true}),10,{detail:true});
   ok(b.flow[1].pmi===a.flow[1].pmi,'no early removal in the first two years');
   ok(b.flow[4].pmi===0&&a.flow[4].pmi>0,'appraisal removes PMI after prices rise');ok(b.buy[10]-b.inv[10]>a.buy[10]-a.inv[10],'which helps buying against renting');
   const f=run(Object.assign({},q,{gh:-0.02,pmiAppr:true}),10,{detail:true});ok(f.flow[4].pmi>0,'no removal when prices fall')}

  /* Capital-gains brackets */
  {ok(M.ltcgRate(60000,'single')===0&&M.ltcgRate(150000,'single')===0.15&&M.ltcgRate(700000,'single')===0.2,'0 / 15 / 20% tiers (single)');
   ok(M.ltcgRate(110000,'mfj')===0&&M.ltcgRate(120000,'single')===0.15,'joint 0% tier is about twice the single one');
   const q=Object.assign({},p0,{taxOn:true,acct:'taxable',dy:0.015,ltcg:0.15,income:55000,N:15});
   ok(run(Object.assign({},q,{ltcgMode:'auto'}),15).inv[15]>run(q,15).inv[15],'a 0% bracket household keeps more of its gains')}

  /* Home-equity line counts as a reserve but is never drawn */
  {const q=Object.assign({},p0,{heloc:0.8,N:10}),a=run(q,10),b=run(p0,10);
   near(a.buy[10],b.buy[10],1e-12,'the line does not change net worth');
   ok(a.heloc[0]===0.8*q.P-q.P*(1-q.dp),'available credit = 80% of value minus the loan');ok(b.heloc.every(v=>v===0),'none without a line')}

  /* Monte Carlo blocks never join the last data year to the first */
  {const q=Object.assign({},p0,{gh:0.04,rs:0.08,rb:0.04,rc:0.03,inf:0.025,N:10});
   const a=M.mcCore(q,{n:50,bl:10,from:2016,rc:false,home:M.HOME,real:false});
   ok(a.res.buy.every(r=>r.every(isFinite)),'short history with long blocks still fills 30 years')}

  /* assessment caps: fixed (Texas-style), inflation-linked (California/Florida), inflation only (Georgia) */
  {const pt=y=>o=>o.flow[y].ptax*12;
   const go=over=>run(base(Object.assign({ptax:0.01,gh:0.05,inf:0.01,N:4},over)),4,{detail:true});
   const P=300000;
   near(pt(1)(go({})),P*1.05*0.01,1e-9,'no cap: taxed on market value');
   near(pt(1)(go({ptaxCap:0.02})),P*1.02*0.01,1e-9,'2% cap: taxed value grows 2%');
   near(pt(1)(go({ptaxCap:0.02,ptaxCapCPI:true})),P*1.01*0.01,1e-9,'cap or inflation, lower: grows 1%');
   near(pt(3)(go({ptaxCap:0,ptaxCapCPI:true})),P*Math.pow(1.01,3)*0.01,1e-9,'inflation only: grows 1% a year');
   near(pt(1)(go({ptaxCap:0.02,ptaxCapCPI:true,inf:0.04})),P*1.02*0.01,1e-9,'cap binds when inflation is higher');}
  /* PMI scaled by down payment (Fannie Mae coverage 35/30/25/12%) */
  {const r=(dp,sc)=>M.pmiRate?M.pmiRate(base({pmi:0.006,pmiScale:sc}),dp):null;
   ok(M.pmiRate,'pmiRate exported');
   if(M.pmiRate){near(r(0.035,true),0.006,1e-12,'3.5% down: full PMI rate');near(r(0.07,true),0.006*30/35,1e-12,'7% down: 30/35 of it');
     near(r(0.12,true),0.006*25/35,1e-12,'12% down: 25/35');near(r(0.18,true),0.006*12/35,1e-12,'18% down: 12/35');
     ok(r(0.2,true)===0,'20% down: no PMI');near(r(0.18,false),0.006,1e-12,'unscaled: same rate')}}

  /* credit score: Fannie Mae LLPA difference from the survey borrower, at the points-to-rate setting */
  {const C={llpa:{ltv_upper:[0.3,0.6,0.7,0.75,0.8,0.85,0.9,0.95,1],rows:{'760-779':[0,0,0,0.25,0.625,0.625,0.5,0.5,0.25],'639-':[0,0.125,1.5,2.125,2.75,2.875,2.625,2.25,1.75]},reference:{score:'760-779',ltv:0.8}},pmi:{rel:{'760-779':1,'639-':3.261}}};
   ok(M.creditAdj,'creditAdj exported');
   if(M.creditAdj){const a=M.creditAdj(base({credit:C,fico:'639-',dp:0.2,ptsCut:0.0025}));near(a.rate,(2.75-0.625)*0.0025,1e-12,'639 or lower at 20% down: +0.53 pts');near(a.pmi,3.261,1e-12,'PMI ratio');
     ok(M.creditAdj(base({credit:C,fico:'760-779',dp:0.2})).rate===0,'reference borrower: no change');
     ok(M.creditAdj(base({credit:C,fico:'639-',dp:0.2,loanType:'fha'})).rate===0,'FHA: no adjustment');
     const r0=M.loanSetup(base({credit:C,fico:'760-779',dp:0.2,ptsCut:0.0025}),0.06).rate,r1=M.loanSetup(base({credit:C,fico:'639-',dp:0.2,ptsCut:0.0025}),0.06).rate;near(r1-r0,0.0053125,1e-12,'loan rate carries the adjustment')}}

  /* --- fixes from the formula audit --- */
  {// Monte Carlo blocks wrap around, so re-centering hits the user's geometric means
   const p=base({gh:0.04,gr:0.03,rs:0.07,rb:0.04,rc:0.03,inf:0.025,N:30}),r=M.mcCore(p,{n:2000,bl:5,from:1928,rc:true,home:M.HOME,real:false});
   const g=k=>Math.exp(r.res[k].reduce((a,c)=>a+c[30],0)/r.res[k].length/30)-1;
   near(g('cH'),0.04,0.002/0.04,'Monte Carlo: simulated home growth matches the setting (geometric mean)')}
  {// no refinancing in the month the loan is taken out, even if the market rate is far lower
   const p=base({refiOn:true,refiTh:0.01,refiCost:0.02,rate:0.065,N:3}),path=M.constPath(p,3);path.mkt=[0.04,0.04,0.04];
   const o=M.simulate(p,path,{N:3});ok(o.refis===1&&o.refiAt[0]>=1,'first refinance no earlier than a year after purchase',JSON.stringify(o.refiAt))}
  {// refinancing an FHA loan into a conventional one ends FHA's mortgage insurance
   const p=base({loanType:'fha',dp:0.035,rate:0.07,refiOn:true,refiTh:0.01,refiCost:0,gh:0.05,N:10}),path=M.constPath(p,10);path.mkt=Array(10).fill(0.055);
   const o=M.simulate(p,path,{N:10,detail:true});ok(o.flow[9].pmi<o.flow[0].pmi*0.2,'FHA insurance ends after refinancing (conventional PMI only while over 78%)',`${o.flow[0].pmi} → ${o.flow[9].pmi}`)}
  {// leverage below 1: the uninvested share earns the T-bill rate, no borrowing spread
   const p=base({rs:0.04,rc:0.04,ws:1,lev:0,spread:0.02,rent0:3000,N:10}),q=Object.assign({},p,{lev:1});
   near(run(p,10).inv[10],run(q,10).inv[10],1e-9,'with stocks = T-bills, leverage 0 and 1 end the same')}
  {// the $750k interest limit uses the year's average balance
   const p=base({P:1250000,dp:0.2,rate:0.065,taxOn:true,muMode:'manual',mu:0.35,oth:30000,N:10}),o=run(p,10,{detail:true});
   const L=1000000,i=0.065/12,Mp=M.pmt(L,i,360);let b=L,bs=0,int=0;for(let m=0;m<120;m++){const it=b*i;if(m>=108){bs+=b;int+=it}b-=Mp-it}
   ok(Math.abs(o.flow[9].interest*12*Math.min(1,750000*12/bs)-int*Math.min(1,750000*12/bs))<1&&bs/12<L,'year-10 average balance below the original loan',String(bs/12))}
  {// assessment cap: after a drop and recovery the assessment returns to the capped base, not a ratcheted-down value
   const p=base({P:1000000,ptax:0.0125,ptaxCap:0.02,ptaxCapCPI:true,inf:0.03,N:3}),path=M.constPath(p,3);path.gh=[-0.1,0.1,0];
   const o=M.simulate(p,path,{N:3,detail:true});near(o.flow[2].ptax*12,0.0125*Math.min(990000,1000000*1.02*1.02),1e-6,'capped base after a price drop (Prop 13 / Prop 8)')}
  {// transfer taxes follow the sale price through brackets (NYC: city tax 1.425% above $500k)
   const nyc=[{base:'price',structure:'whole_price_tiers',payer:'seller',tiers:[{from:0,to:500000,rate:0.01},{from:500000,to:null,rate:0.01425}]}];
   const p=base({sell:0.05,sellBase:0.05,ttRules:nyc});near(M.sellAt(p,650000),0.05+0.01425,1e-12,'seller tax at the sale price bracket');near(M.sellAt(p,480000),0.06,1e-12,'below the threshold')}
};
