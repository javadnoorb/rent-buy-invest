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

  /* Default inputs leave old results unchanged */
  {const a=run(p0,15),b=run(Object.assign({},p0,{renewGap:0,incGrowth:0,moveMode:'none',hhRent:0,rentalOn:false}),15);
   near(a.buy[15],b.buy[15],1e-12,'features off: identical results')}

  /* Monte Carlo with stress-linked moves and a forced-sale discount */
  {const q=Object.assign({},p0,{hz:0.06,stressMult:3,forcedDisc:0.1,gh:0.04,rs:0.08,rb:0.04,rc:0.03,inf:0.025,N:10});
   const cfg={n:300,bl:5,from:1928,rc:true,home:M.HOME,real:true},a=M.mcCore(q,cfg),b=M.mcCore(Object.assign({},q,{stressMult:1,forcedDisc:0}),cfg);
   ok(a.pForced>0,'some moves happen in bad years');ok(a.pMove<=b.pMove,'forced sales in downturns lower the win rate with moving')}
};
