#!/usr/bin/env node
/* Checks the model's historical replay against a published study of actual buy-vs-rent outcomes:
   Beracha & Johnson (2012), "Lessons from Over 30 Years of Buy versus Rent Decisions", Real Estate Economics 40(2).
   Their setup, U.S. as a whole: buy with 20% down on a 30-year fixed loan at the year's average rate, 2% closing costs,
   6% selling costs after an 8-year hold, property tax 1.5% and maintenance + insurance 2% of value a year, 25% bracket,
   itemizing, refinancing allowed; the renter starts with the down payment + closing costs, adds or withdraws the
   difference in yearly outlays, earns the risk-free rate and pays 20% tax on the gain at the end. Ex post, 8-year
   holds bought 1978–2001 (semiannual): renting came out ahead in 64.58% of them, and the renter's portfolio averaged
   1.2563× the buyer's sale proceeds (Table 2, Panel A).
   Here: the same assumptions through simulate() with the app's national annual data, one purchase per year
   1978–2001, renter in T-bills (the "Rent + T-bills" path). Their starting rent came from Davis-Lehnert-Martin
   rent-to-price ratios; here the ratio is either held at one level or rolled back from today's with the app's own
   rent and home-price series. Run: node tests/validate.js   (prints a table; exits 1 if far off) */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','src','model.js'),'utf8');
const M=vm.runInNewContext('const MORT_OVERRIDE=null;\n'+src+'\n;({simulate,HOME,RENTG,INF,STK,BOND,BILL,MORT,MORT0,Y0})',{Math,Array,Object,JSON,Number,Infinity,isFinite});
const P0=100000,N=8;
function params(s,rp,acct){return {P:P0,dp:0.2,rate:M.MORT[s-M.MORT0]/100,rate30:M.MORT[s-M.MORT0]/100,rate15:M.MORT[s-M.MORT0]/100,term:30,close:0.02,pmi:0,
  refiOn:true,rateLR:0.06,glide:5,refiTh:0.01,refiCost:0.01,ptax:0.015,ptaxCap:0,ins:0,maint:0.02,hoa:0,sell:0.06,rent0:P0*rp/12,rins:0,
  gh:0.03,gr:0.03,inf:0.03,rs:0.07,rb:0.04,rc:0.04,ws:0,wb:0,acct:acct||'taxable',dy:0,fee:0,lev:1,spread:0,
  taxOn:true,filing:'joint',income:150000,debt:0,muMode:'manual',mu:0.25,stTax:0,oth:40000,ltcgMode:'manual',ltcg:0.2,niitAuto:false,niit:0,stRate:0,stDed:false,
  utilDiff:0,floodIns:0,moveIn:0,impShare:0,rMove:0,rMoveCost:0,broker:0,investShare:1,hz:0,idio:0,idioMode:'sale',gamma:3,N,metro:'us',
  renewGap:0,incGrowth:0,moveYear:0,moveMode:'none',hhRent:0,hhVac:0,hhShare:0,rentalOn:false,stressMult:1,forcedDisc:0,extraPay:0,heloc:0,pmiAppr:false,volAdj:false}}
function path8(s){const i0=s-M.Y0,g=a=>a.slice(i0,i0+N).map(v=>v/100);
  return {gh:g(M.HOME),gr:g(M.RENTG),rs:g(M.STK),rb:g(M.BOND),rc:g(M.BILL),inf:g(M.INF),mkt:[...Array(N)].map((_,k)=>M.MORT[s+k-M.MORT0]/100)}}
// rent-to-price ratio in year s rolled back from a ratio in 2025 with the app's rent and home-price growth
const rolled=(r2025,s)=>{let r=r2025;for(let y=2024;y>=s;y--)r*=(1+M.HOME[y-M.Y0]/100)/(1+M.RENTG[y-M.Y0]/100);return r};
function study(name,rpOf,acct){let rent=0,ratio=0,n=0;const rows=[];
  for(let s=1978;s<=2001;s++){const rp=rpOf(s),o=M.simulate(params(s,rp,acct),path8(s),{N});const ratioS=o.cash[N]/o.buy[N];
    rows.push([s,rp,ratioS]);n++;ratio+=ratioS;if(ratioS>1)rent++}
  return {name,share:rent/n,avg:ratio/n,rows}}
const out=[study('rent ÷ price 5% every year (Davis-Lehnert-Martin 1980s level)',()=>0.05),
  study('  same, renter untaxed (the study taxes the gain once, at 20%)',()=>0.05,'sheltered'),
  study('rent ÷ price 4.5% every year',()=>0.045),
  study("rolled back from today's 7.1% gross U.S. rent ÷ price",s=>rolled(0.0714,s)),
  study('rolled back from a 4.5% net ratio today',s=>rolled(0.045,s))];
console.log('Beracha & Johnson (2012), U.S., risk-free renter: renting won 64.6% of 8-year holds 1978–2001; renter ÷ buyer wealth 1.26 on average.\n');
for(const r of out)console.log(`${r.name.padEnd(62)} renting won ${(r.share*100).toFixed(1).padStart(5)}%   renter ÷ buyer ${r.avg.toFixed(2)}`);
console.log('\nby purchase year (rent ÷ price 5%):');
console.log(out[0].rows.map(([s,,x])=>`${s} ${x.toFixed(2)}`).join('  '));
if(process.argv.includes('--json'))console.log(JSON.stringify(out.map(r=>({name:r.name,share:r.share,avg:r.avg}))));
// the like-for-like case (the study's rent level) must stay close to the published result
const like=out[0],okShare=Math.abs(like.share-0.6458)<=0.10,okAvg=like.avg>1;
console.log(`\n${okShare&&okAvg?'OK':'FAIL'}: like-for-like share ${(like.share*100).toFixed(1)}% vs 64.6% (±10 pts), renter ahead on average: ${okAvg}`);
// the rent-from-price exponent (RENT_ELAST in 17-snapshot.js) must match a refit on the stored county medians:
// slope of log median contract rent on log median home value across counties (Census ACS 5-year)
const elast=+require('fs').readFileSync(require('path').join(__dirname,'..','src','app','17-snapshot.js'),'utf8').match(/const RENT_ELAST=([\d.]+)/)[1];
const cty=require('../data/counties.json'),iv=cty.fields.indexOf('medianValue'),ir=cty.fields.indexOf('medianContractRent');
const lg=cty.rows.filter(r=>r[iv]>0&&r[ir]>0).map(r=>[Math.log(r[iv]),Math.log(r[ir])]),mx=lg.reduce((a,q)=>a+q[0],0)/lg.length,my=lg.reduce((a,q)=>a+q[1],0)/lg.length;
const fit=lg.reduce((a,q)=>a+(q[0]-mx)*(q[1]-my),0)/lg.reduce((a,q)=>a+(q[0]-mx)**2,0),okE=Math.abs(fit-elast)<=0.03;
console.log(`${okE?'OK':'FAIL'}: rent-from-price exponent ${elast} vs refit ${fit.toFixed(3)} on ${lg.length} counties (±0.03)`);
if(!(okShare&&okAvg&&okE))process.exit(1);
