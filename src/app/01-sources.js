/* ===================== Sources ===================== */
const SRC=Object.assign({
  fredMort:{t:"Freddie Mac Primary Mortgage Market Survey (30-year fixed; annual and monthly averages of weekly rates)",u:"https://www.freddiemac.com/pmms"},
  fredCPI:{t:"BLS: CPI-U, U.S. city average, all items, not seasonally adjusted (CUUR0000SA0)",u:"https://data.bls.gov/timeseries/CUUR0000SA0"},
  fredRent:{t:"BLS: CPI-U rent of primary residence, not seasonally adjusted (CUUR0000SEHA)",u:"https://data.bls.gov/timeseries/CUUR0000SEHA"},
  damo:{t:"Damodaran, Historical returns on stocks, bonds, bills and real estate, 1928–"+LAST_Y+" (NYU Stern)",u:"https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html"},
  shiller:{t:"Robert Shiller, U.S. home price data (pre-1987 real estate series)",u:"http://www.econ.yale.edu/~shiller/data.htm"},
  fhfa:{t:"FHFA House Price Index datasets (purchase-only metro and U.S. monthly indexes)",u:"https://www.fhfa.gov/data/hpi/datasets"},
  irs26:{t:"IRS: 2026 inflation adjustments, standard deduction and brackets",u:"https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill"},
  salt:{t:"SALT cap $40,400 for 2026 and phase-out (Instead)",u:"https://www.instead.com/resources/blog/new-40-000-salt-deduction-limit-for-2025-and-2026-filers"},
  irs121:{t:"IRS Topic 701: Sale of your home (Section 121 exclusion)",u:"https://www.irs.gov/taxtopics/tc701"},
  mTb:{t:"Federal Reserve H.15: 3-month Treasury bill (secondary market) and 10-year Treasury constant maturity, monthly averages",u:"https://www.federalreserve.gov/releases/h15/"},
  mSp:{t:"S&P 500 monthly total returns computed from Robert Shiller's monthly price and dividend data (as republished by multpl.com); index levels not stored",u:"https://shillerdata.com/"},
  beracha:{t:"Beracha & Johnson (2012), Lessons from Over 30 Years of Buy versus Rent Decisions, Real Estate Economics 40(2) (validation of the historical replay)",u:"https://doi.org/10.1111/j.1540-6229.2011.00321.x"},
  irs936:{t:"IRS Publication 936: Home mortgage interest deduction ($750k limit)",u:"https://www.irs.gov/publications/p936"},
  irsNiit:{t:"IRS Topic 559: Net investment income tax (3.8% above $200,000 single / $250,000 joint)",u:"https://www.irs.gov/taxtopics/tc559"},
  pmiEnd:{t:"CFPB: When can I remove private mortgage insurance? (Homeowners Protection Act: automatic end at 78% of the original value)",u:"https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/"},
  fnmaMiEnd:{t:"Fannie Mae Servicing Guide B-8.1-04: Termination of conventional mortgage insurance (by current value: 75% after 2 years, 80% after 5)",u:"https://servicing-guide.fanniemae.com/svc/b-8.1-04/termination-conventional-mortgage-insurance"},
  fnmaMiCov:{t:"Fannie Mae Selling Guide B7-1-02: Mortgage insurance coverage requirements (35/30/25/12% by loan-to-value)",u:"https://selling-guide.fanniemae.com/sel/b7-1-02/mortgage-insurance-coverage-requirements"},
  pmiFM:{t:"Freddie Mac: Breaking down PMI ($30–70 a month per $100,000 borrowed)",u:"https://myhome.freddiemac.com/buying/breaking-down-pmi"},
  hudFmr:{t:"HUD Fair Market Rents and Small Area Fair Market Rents (40th-percentile gross rent of recent movers, by bedrooms)",u:"https://www.huduser.gov/portal/datasets/fmr.html"},
  acs5:{t:"Census ACS 5-year 2020–2024 medians by county and ZIP Code Tabulation Area: home value (B25077), contract rent (B25058), gross rent (B25064), real-estate taxes (B25103)",u:"https://www.census.gov/programs-surveys/acs/data/summary-file.html"},
  zcta:{t:"Census 2020 ZCTA-to-county relationship file",u:"https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt"},
  fhfaCounty:{t:"FHFA annual all-transactions house price indexes by county (developmental)",u:"https://www.fhfa.gov/data/hpi/datasets"},
  bogin:{t:"Bogin, Doerner & Larson (2019), Local House Price Dynamics: New Indices and Stylized Facts, Real Estate Economics 47(2)",u:"https://doi.org/10.1111/1540-6229.12233"},
  caseShiller:{t:"S&P CoreLogic Case-Shiller U.S. National Home Price Index",u:"https://www.spglobal.com/spdji/en/indices/indicators/sp-corelogic-case-shiller-us-national-home-price-nsa-index/"},
  dlm:{t:"Davis, Lehnert & Martin (2008), The Rent-Price Ratio for the Aggregate Stock of Owner-Occupied Housing, Review of Income and Wealth 54(2)",u:"https://doi.org/10.1111/j.1475-4991.2008.00274.x"},
  aff:{t:"Bankrate: How much of your income should go to a mortgage (28/36 rule; 43–50% lender limits)",u:"https://www.bankrate.com/mortgages/what-percent-of-income-should-go-to-mortgage/"},
},SNAP.sources,RES.sources||{},(typeof FCST!=='undefined'&&FCST&&FCST.sources)||{});
const AFF_URL='https://www.bankrate.com/mortgages/what-percent-of-income-should-go-to-mortgage/';
const linkTo=(u,txt)=>`<a class="src" target="_blank" rel="noopener" href="${u}">${txt||'source'}</a>`;
const sl=(k,txt)=>SRC[k]?linkTo(SRC[k].u,txt):'';
const srcObj=o=>o&&o.u?linkTo(o.u):'';

