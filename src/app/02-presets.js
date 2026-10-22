/* ===================== Presets ===================== */
const PRESETS={
  long:{gh:r2(geo(HOME,1928)),gr:r2(geo(RENTG,1928)),inf:r2(geo(INF,1928)),rs:r2(geo(STK,1928)),rb:r2(geo(BOND,1928)),rc:r2(geo(BILL,1928))},
  modern:{gh:r2(geo(HOME,1972)),gr:r2(geo(RENTG,1972)),inf:r2(geo(INF,1972)),rs:r2(geo(STK,1972)),rb:r2(geo(BOND,1972)),rc:r2(geo(BILL,1972))},
  ...(FCST&&FCST.preset?{fcst:FCST.preset}:{}),
  now:{gh:SNAP.values.csYoY,gr:SNAP.values.zoriYoY,inf:SNAP.values.cpiYoY,rs:r2(geo(STK,1928)),rb:SNAP.values.tsy10,rc:SNAP.values.tbill}
};
const V=SNAP.values;
const tag='<span class="tag">assumption</span>';
const resHint=(k,fallback)=>RES[k]&&RES[k].u?`${RES[k].h||''} ${linkTo(RES[k].u)}`:(fallback||tag);

