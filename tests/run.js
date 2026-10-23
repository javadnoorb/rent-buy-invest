#!/usr/bin/env node
/* Tests for src/model.js. Run: node tests/run.js */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'src/model.js'),'utf8');
const EXPORTS=['pmiRate','transferTaxes','loanSetup','metroAnnual','simulate','pmt','marginalRate','saltCapFor','constPath','mcCore','taxIndex','TAX_YEAR','ltcgRate','HOME','RENTG','INF','YEARS','MORT','Y0','NY'];
const extra=fs.existsSync(path.join(ROOT,'src/model.js'))&&/function simulateRental/.test(src)?['simulateRental']:[];
const M=vm.runInNewContext('const MORT_OVERRIDE=null;\n'+src+'\n;({'+EXPORTS.concat(extra).join(',')+'})',{Math,Array,Object,JSON,Number,Infinity,isFinite});

let pass=0,fail=0;const fails=[];
function ok(cond,name,detail){if(cond)pass++;else{fail++;fails.push(name+(detail?' — '+detail:''))}}
function near(a,b,tol,name){const d=Math.abs(a-b),t=tol*Math.max(1,Math.abs(b));ok(d<=t,name,`got ${a}, expected ${b}`)}

/* Neutral parameter set: no taxes, no costs, no growth, unless a test sets them. */
function base(over){return Object.assign({P:300000,dp:0.2,rate:0.06,rate30:0.06,rate15:0.055,term:30,close:0,pmi:0,refiOn:false,rateLR:0.06,glide:5,refiTh:0.01,refiCost:0,
  ptax:0,ptaxCap:0,ins:0,maint:0,hoa:0,sell:0,rent0:1000,rins:0,gh:0,gr:0,inf:0,rs:0,rb:0,rc:0,ws:1,wb:0,acct:'sheltered',dy:0,fee:0,lev:1,spread:0,
  taxOn:false,filing:'single',income:150000,debt:0,muMode:'manual',mu:0.24,stTax:0,oth:0,ltcg:0.15,niit:0,stRate:0,stDed:false,
  utilDiff:0,floodIns:0,moveIn:0,impShare:0,rMove:0,rMoveCost:0,broker:0,investShare:1,hz:0,idio:0,idioMode:'sale',gamma:3,N:10,metro:'us',
  renewGap:0,incGrowth:0,moveYear:0,moveMode:'none',hhRent:0,hhVac:0,hhShare:0,rentalOn:false,stressMult:1,forcedDisc:0},over||{})}
const run=(p,N,opt)=>M.simulate(p,M.constPath(p,N||p.N),Object.assign({N:N||p.N},opt||{}));

/* --- Mortgage math --- */
near(M.pmt(300000,0.06/12,360),1798.65,1e-6,'payment: $300k at 6% for 30 years is $1,798.65');
near(M.pmt(200000,0,240),200000/240,1e-12,'payment: zero rate is straight-line');
{const p=base({N:30}),o=run(p,30,{detail:true}),L=240000,i=0.005,Mp=M.pmt(L,i,360);
 for(const k of [1,5,10,29]){const n=12*k,closed=L*Math.pow(1+i,n)-Mp*(Math.pow(1+i,n)-1)/i;near(o.bal[k],closed,1e-9,`balance after ${k} years matches closed form`)}
 ok(o.bal[30]<0.01,'loan fully paid after 30 years');
 const interest=o.flow.reduce((a,f)=>a+f.interest*12,0);near(interest,360*Mp-L,1e-9,'total interest = 360·M − L')}

/* --- Zero-everything identity: rent equals the payment, nothing grows --- */
{const L=240000,Mp=M.pmt(L,0,360),p=base({rate:0,rent0:Mp,N:10}),o=run(p,10);
 near(o.buy[10]-o.inv[10],L*120/360,1e-9,'zero growth: buy − rent&invest equals principal repaid')}

/* --- Inflation index --- */
{const p=base({inf:0.03,N:15}),o=run(p,15);near(o.cpi[15],Math.pow(1.03,15),1e-9,'CPI index compounds at the inflation rate')}

/* --- Annual vs monthly path give the same answer --- */
{const p=base({gh:0.04,gr:0.03,rs:0.07,rb:0.04,rc:0.03,inf:0.025,ptax:0.01,maint:0.01,ins:2000,close:0.03,sell:0.06,N:8,rent0:1500});
 const N=8,cp=M.constPath(p,N),mp={monthly:true};['gh','gr','rs','rb','rc','inf'].forEach(k=>mp[k]=Array(N*12).fill(Math.pow(1+p[k],1/12)-1));
 mp.mkt=Array(N*12).fill(p.rate);mp.gr=Array(N*12).fill(0);
 // rent growth in monthly mode is applied yearly from compounded months
 mp.gr=Array(N*12).fill(Math.pow(1+p.gr,1/12)-1);
 const a=M.simulate(p,cp,{N}),b=M.simulate(p,mp,{N});
 near(b.buy[N],a.buy[N],1e-6,'monthly path equals annual path (buy)');near(b.inv[N],a.inv[N],1e-6,'monthly path equals annual path (rent+invest)')}

/* --- Taxes --- */
ok(M.marginalRate(60000,'single')===0.12,'bracket: $60k single → 12%');
ok(M.marginalRate(150000,'single')===0.24,'bracket: $150k single → 24%');
ok(M.marginalRate(300000,'mfj')===0.24,'bracket: $300k joint → 24%');
ok(M.marginalRate(900000,'mfj')===0.37,'bracket: $900k joint → 37%');
near(M.saltCapFor(0,400000),40400,1e-12,'SALT cap 2026 below phase-out');
near(M.saltCapFor(0,600000),11900,1e-12,'SALT cap 2026 phases out 30% above $505k');
near(M.saltCapFor(0,800000),10000,1e-12,'SALT cap floor $10k');
near(M.saltCapFor(4,100000),10000,1e-12,'SALT cap returns to $10k in 2030');
{// itemizing benefit in year 1, computed by hand
 const p=base({P:500000,taxOn:true,ptax:0.012,stTax:9000,mu:0.24,N:1}),o=run(p,1,{detail:true});
 const L=400000,i=0.005,Mp=M.pmt(L,i,360);let b=L,int=0;for(let k=0;k<12;k++){const it=b*i;int+=it;b-=Mp-it}
 const std=16100,cap=40400,dB=Math.max(std,Math.min(cap,9000+6000)+int),dR=Math.max(std,Math.min(cap,9000));
 near(-o.flow[0].tax*12,0.24*(dB-dR),1e-9,'year-1 tax saving matches hand calculation')}
{// Section 121 exclusion and capital-gains tax on sale
 const p=base({P:1e6,gh:0.10,taxOn:true,ltcg:0.15,N:5}),o=run(p,5,{detail:true});
 const H=1e6*Math.pow(1.1,5),tax=0.15*Math.max(0,H-1e6-250000);near(o.eq[5],H-o.bal[5]-tax,1e-9,'home sale tax with $250k exclusion')}
{// no exclusion before 2 years
 const p=base({P:1e6,gh:0.10,taxOn:true,ltcg:0.15,N:1}),o=run(p,1,{detail:true});
 const H=1.1e6;near(o.eq[1],H-o.bal[1]-0.15*(H-1e6),1e-9,'no exclusion when sold within 2 years')}

/* --- PMI --- */
{const p=base({dp:0.1,pmi:0.005,N:30}),o=run(p,30,{detail:true});
 ok(o.flow[0].pmi>0,'PMI charged at 10% down');ok(o.flow[29].pmi===0,'PMI ends once balance falls below 78% of price')}

/* --- Refinancing --- */
{const p=base({refiOn:true,refiTh:0.01,refiCost:0.01,N:10}),N=10,cp=M.constPath(p,N);cp.mkt=cp.mkt.map((v,y)=>y>=3?0.045:0.06);
 const a=M.simulate(p,cp,{N}),b=M.simulate(Object.assign({},p,{refiOn:false}),cp,{N});
 ok(a.refis===1,'refinances once when rates drop 1.5 points');ok(a.buy[N]>b.buy[N],'refinancing at a lower rate raises buyer wealth')}

/* --- Directional checks --- */
{const p=base({gh:0.03,gr:0.03,rs:0.07,rc:0.03,inf:0.025,ptax:0.01,maint:0.01,close:0.03,sell:0.06,rent0:1500,N:10});
 const g=(o)=>o.buy[10]-o.inv[10];
 ok(g(run(Object.assign({},p,{gh:0.05})))>g(run(p)),'higher home appreciation favors buying');
 ok(g(run(Object.assign({},p,{rent0:2000})))>g(run(p)),'higher rent favors buying');
 ok(g(run(Object.assign({},p,{rs:0.10})))<g(run(p)),'higher stock return favors renting');
 ok(g(run(Object.assign({},p,{sell:0.08})))<g(run(p)),'higher selling costs favor renting');
 ok(g(run(Object.assign({},p,{investShare:0.5})))>g(run(p)),'spending part of the savings favors buying when owning costs more')}

/* --- Monte Carlo core --- */
{const p=base({gh:0.04,gr:0.03,rs:0.08,rb:0.04,rc:0.03,inf:0.025,rent0:1500,N:10});
 const cfg={n:200,bl:5,from:1928,rc:true,home:M.HOME,real:true},a=M.mcCore(p,cfg),b=M.mcCore(p,cfg);
 ok(a.res.buy.length===200&&a.res.buy[0].length===31,'Monte Carlo returns 200 paths of 31 years');
 ok(a.res.buy[17][10]===b.res.buy[17][10],'Monte Carlo is reproducible with the same seed');
 ok(a.pWin.every(v=>v>=0&&v<=1),'win probabilities are within [0,1]')}

if(typeof module!=='undefined')module.exports={M,base,run,ok,near};
if(require.main===module){
  require('./run_new.js')({M,base,run,ok,near});
  console.log(`${pass} passed, ${fail} failed`);if(fail){fails.forEach(f=>console.log('  FAIL '+f));process.exit(1)}}
