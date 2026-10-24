/* ===================== Sources ===================== */
const SRC=Object.assign({
  fredMort:{t:"Freddie Mac Primary Mortgage Market Survey (30-year fixed; annual and monthly averages of weekly rates)",u:"https://www.freddiemac.com/pmms"},
  fredCPI:{t:"BLS: CPI-U, U.S. city average, all items, not seasonally adjusted (CUUR0000SA0)",u:"https://data.bls.gov/timeseries/CUUR0000SA0"},
  fredRent:{t:"BLS: CPI-U rent of primary residence, not seasonally adjusted (CUUR0000SEHA)",u:"https://data.bls.gov/timeseries/CUUR0000SEHA"},
  damo:{t:"Damodaran, Historical returns on stocks, bonds, bills and real estate, 1928–2025 (NYU Stern)",u:"https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html"},
  shiller:{t:"Robert Shiller, U.S. home price data (pre-1987 real estate series)",u:"http://www.econ.yale.edu/~shiller/data.htm"},
  fhfa:{t:"FHFA House Price Index datasets (purchase-only metro and U.S. monthly indexes)",u:"https://www.fhfa.gov/data/hpi/datasets"},
  irs26:{t:"IRS: 2026 inflation adjustments, standard deduction and brackets",u:"https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill"},
  salt:{t:"SALT cap $40,400 for 2026 and phase-out (Instead)",u:"https://www.instead.com/resources/blog/new-40-000-salt-deduction-limit-for-2025-and-2026-filers"},
  irs121:{t:"IRS Topic 701: Sale of your home (Section 121 exclusion)",u:"https://www.irs.gov/taxtopics/tc701"},
  mTb:{t:"Federal Reserve H.15: 3-month Treasury bill (secondary market) and 10-year Treasury constant maturity, monthly averages",u:"https://www.federalreserve.gov/releases/h15/"},
  mSp:{t:"S&P 500 monthly total returns computed from Robert Shiller's monthly price and dividend data (as republished by multpl.com); index levels not stored",u:"https://shillerdata.com/"},
  beracha:{t:"Beracha & Johnson (2012), Lessons from Over 30 Years of Buy versus Rent Decisions, Real Estate Economics 40(2) (validation of the historical replay)",u:"https://doi.org/10.1111/j.1540-6229.2011.00321.x"},
  irs936:{t:"IRS Publication 936: Home mortgage interest deduction ($750k limit)",u:"https://www.irs.gov/publications/p936"},
},SNAP.sources,RES.sources||{},(typeof FCST!=='undefined'&&FCST&&FCST.sources)||{});
const AFF_URL='https://www.bankrate.com/mortgages/what-percent-of-income-should-go-to-mortgage/';
const linkTo=(u,txt)=>`<a class="src" target="_blank" rel="noopener" href="${u}">${txt||'source'}</a>`;
const sl=(k,txt)=>SRC[k]?linkTo(SRC[k].u,txt):'';
const srcObj=o=>o&&o.u?linkTo(o.u):'';

