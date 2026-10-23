/* ===================== Presets ===================== */
/* Forecast preset: public 10-year forecasts for stocks, bonds, cash and inflation; homes and rent grow at forecast
   inflation plus their own real growth since FCST.realFrom (nobody public forecasts them 10 years out). */
function fcstPreset(){const f=FCST.preset,y=FCST.realFrom||1972,real=a=>(1+geo(a,y)/100)/(1+geo(INF,y)/100);
  return Object.assign({},f,{gh:r2(((1+f.inf/100)*real(HOME)-1)*100),gr:r2(((1+f.inf/100)*real(RENTG)-1)*100)})}
const PRESETS={
  long:{gh:r2(geo(HOME,1928)),gr:r2(geo(RENTG,1928)),inf:r2(geo(INF,1928)),rs:r2(geo(STK,1928)),rb:r2(geo(BOND,1928)),rc:r2(geo(BILL,1928))},
  modern:{gh:r2(geo(HOME,1972)),gr:r2(geo(RENTG,1972)),inf:r2(geo(INF,1972)),rs:r2(geo(STK,1972)),rb:r2(geo(BOND,1972)),rc:r2(geo(BILL,1972))},
  ...(FCST&&FCST.preset?{fcst:fcstPreset()}:{}),
  now:{gh:SNAP.values.hpiYoY,gr:SNAP.values.zoriYoY,inf:SNAP.values.cpiYoY,rs:r2(geo(STK,1928)),rb:SNAP.values.tsy10,rc:SNAP.values.tbill}
};
const V=SNAP.values;
const tag='<span class="tag">assumption</span>';
const resHint=(k,fallback)=>RES[k]&&RES[k].u?`${RES[k].h||''} ${linkTo(RES[k].u)}`:(fallback||tag);

