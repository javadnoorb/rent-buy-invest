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

  /* Monte Carlo blocks never join the last data year to the first */
  {const q=Object.assign({},p0,{gh:0.04,rs:0.08,rb:0.04,rc:0.03,inf:0.025,N:10});
   const a=M.mcCore(q,{n:50,bl:10,from:2016,rc:false,home:M.HOME,real:false});
   ok(a.res.buy.every(r=>r.every(isFinite)),'short history with long blocks still fills 30 years')}
};
