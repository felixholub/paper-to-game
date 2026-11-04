// Jevons's Noon: mechanism. The single source of truth: every rule that affects what happens on the sheet lives
// here. Runs unchanged in Node (calibration.js, loop.js) and in the browser (inlined verbatim by build.py).
//
// Kind: TOY. A small model built to illustrate the argument of The Coal Question (1866, second edition: preface,
// ch. I, ch. VII, ch. XVIII), calibrated to the numbers those chapters and the frontispiece give. Where the toy
// had to choose something Jevons does not give, the line says "our choice".

const CONFIG = {
  // ---- the clock -------------------------------------------------------------------------------------------
  START_YEAR: 1865,           // preface: the 1865 return is the last Jevons quotes
  GEN_YEARS: 20,              // our choice: one turn is a generation of twenty years
  MAX_GENS: 6,                // our choice: six generations, 1865 to 1985 (a little more than Jevons's own century)

  // ---- Britain's fire --------------------------------------------------------------------------------------
  C0: 95,                     // preface: Hunt's report puts the 1865 production at "about ninety-five millions of tons"
  JEVONS_RATE: 0.035,         // frontispiece: 83.6 (1861) -> 117.9 (1871) -> 166.3 -> 234.7 -> 331 -> 466 -> 658 -> 929
                              //   -> 1310 -> 1848 -> 2607 (1961): ten-yearly at 3 1/2 per cent a year ("at same rate of
                              //   progress"); on the ruler this is "as now", doubling in a generation
  PACE_MIN: -0.0341,          // our choice: the hardest check the ruler allows halves the fire in a generation
  PACE_MAX: 0.0448,           // our choice: the most the trade can be pushed (free export of coal, as under the French
                              //   Treaty, ch. I): about 2.4 times in a generation, a little faster than Jevons's rate
  PAST: [[1850, 50], [1854, 64.7], [1861, 83.6], [1864, 92.8], [1865, 95]],
                              // the shaded past on the sheet: 1861 from the frontispiece (83.6), 1865 from the preface;
                              //   1854 (Hunt's first return) and 1864 from the standard series (Mitchell), 1850 rounded
  JEVONS_CURVE: [[1861, 83.6], [1871, 117.9], [1881, 166.3], [1891, 234.7], [1901, 331], [1911, 466], [1921, 658],
    [1931, 929], [1941, 1310], [1951, 1848], [1961, 2607]],
                              // frontispiece, "supposed future consumption": drawn on the cover only

  // ---- the ground ------------------------------------------------------------------------------------------
  RESERVE: 83544,             // millions of tons within 4,000 feet: Hull's estimate, which Jevons adopts as "the
                              //   geological datum of my arguments" (ch. I; the figure itself is in ch. II, not in the
                              //   chapters given). Check: at 3 1/2 per cent from 1865 it is used up in about a hundred
                              //   years, ch. I's "rather more than a century" at the same rate (calibration.js).
  DEPTH_LIMIT: 4000,          // ch. I and preface: the 4,000-foot limit
                              // our choice: the coal lies evenly from the surface to 4,000 feet and the shallowest is
                              //   dug first, so the working depth is 4,000 feet times the share already burnt
                              //   (eight bands of 500 feet on the sheet)
  PRICE_K: 1,                 // ch. I: when the coal within 4,000 feet is nearly spent, "the average price of coal much
                              //   higher than the highest price now paid for the finest kinds of coal"; ch. I: "no
                              //   recent rise of importance" yet; preface: the cost of a shaft "increases in a far
                              //   higher ratio than its depth". Our choice: price = 1 + K x^2 / (1 - x), x the share
                              //   of the coal burnt: flat at first, twice the 1865 price at x = 0.62 (about 2,500
                              //   feet), without limit near the bottom ("we cannot get to the bottom of them")
  PRICE_FLOOR_LEFT: 0.002,    // numerical guard only

  // ---- dear power and the works that leave -----------------------------------------------------------------
  ETA: 2.5,                   // our choice: the trade Britain keeps is the trade its pace has built times (what power
                              //   costs in Britain / what it costs in America) to the power -ETA. Coal twice as dear
                              //   keeps about a sixth of the works cheap coal would have drawn. Preface: "so far as
                              //   cheap fuel and power is the exciting cause of manufactures, these must pass to where
                              //   fuel is cheapest"

  // ---- the new engines (ch. VII) ----------------------------------------------------------------------------
  LB_1865: 4,                 // ch. VII: a good engine of the present day burns about 4 lb of coal per horse-power
                              //   per hour (Rankine)
  ENGINES: [
    { year: 1885, key: 'air', lbNew: 2 },
                              // ch. VII: an air-engine "has worked at about one-half the expenditure of an ordinary
                              //   good engine of the present day"
    { year: 1925, key: 'perfect', lbNew: 1.3 },
                              // ch. VII: "the ultimate improvement of the air-engine will probably reduce the
                              //   consumption to less than one-third of the present consumption"
  ],                          // our choice: the years they are offered
  REBOUND_EXP: 0.5,           // our choice: over the generation an engine comes in, the trade it powers grows by
                              //   (old lb / new lb)^0.5: twice the work per ton -> about 1.4 times the coal. Ch. VII
                              //   gives the direction ("the very contrary is the truth") and two magnitudes: a
                              //   ten-fold better engine in under a century alongside a roughly ten-fold rise in coal,
                              //   and Scottish iron at a third of the coal per ton with ten times the coal. Both mix in
                              //   ordinary growth; ours is smaller than either.
  REFUSE_EXP: 0.2,            // our choice: while British engines burn more per horse-power than American ones,
                              //   British power is dearer by (lb Britain / lb America)^0.2 (ch. VII: economies are
                              //   "as open to our commercial competitors as to ourselves ... more readily adopted by
                              //   versatile foreigners")

  // ---- America (a toy rival) --------------------------------------------------------------------------------
  AMERICA0: 21,               // our choice: about a fifth of Britain's in 1865 (American output then was some
                              //   twenty-odd million tons)
  AMERICA_RATE: 0.06,         // our choice: America's coal grows 6 per cent a year, slowing towards a ceiling;
                              //   preface: other countries "approximating to our own, and ultimately passing it"
  AMERICA_CAP: 2500,          // our choice: the ceiling (far above the sheet)
                              // our choice: American coal stays cheap on the sheet ("the unrivalled iron and coal
                              //   resources of Pennsylvania", ch. I), and every new engine is fitted there at once

  // ---- the people (preface: "a sore pressure of population and a great exodus of our people") ----------------
  POP0: 30,                   // millions in the kingdom, 1865 (the 1861 census counted about 29 million)
  POP_RATE: 0.012,            // our choice: the people increase about 1.2 per cent a year (the census rate of the
                              //   1850s); ch. I: "a nation tends to multiply itself at a constant rate"
  EMIGRATE_SHARE: 0.15,       // our choice: when the trade grows slower than the people, about one in seven of those
                              //   it cannot employ go over the sea; the rest stay and "sink down into poverty" (ch. I)

  // ---- the sheet (drawing only; the mechanism reports in tons and years) ----------------------------------------
  SHEET_X0: 1850, SHEET_X1: 2060, // 21 columns of ten years
  ROW_TONS: 50,               // one row: 50 million tons a year; one square = 10 years x 50 = 500 million tons
  ROWS_ABOVE: 12,             // the sheet's top: 600 million tons a year (Jevons's own curve leaves it about 1920)
  GROUND_ROWS: 8,             // eight bands of 500 feet down to 4,000 feet; 8 x 21 = 168 squares, each 497 million tons
  PEOPLE_PER_SQUARE: 2,       // millions of people gone over the sea per square of the hatched bar

  // ---- the verdict (words only; see verdict()) ---------------------------------------------------------------
  GREAT_PEAK: 5,              // our choice: a noon at five times the fire of 1865 or more is named a greatness
  MEDIOCRE_PEAK: 2,           // our choice: a noon at no more than twice the fire of 1865 is named a mediocrity
};

// ---- helpers ------------------------------------------------------------------------------------------------
function shareBurnt(S) { return S / CONFIG.RESERVE; }
function depthOf(S) { return CONFIG.DEPTH_LIMIT * shareBurnt(S); }
function priceOf(S) {
  const x = shareBurnt(S), left = Math.max(CONFIG.PRICE_FLOOR_LEFT, 1 - x);
  return 1 + CONFIG.PRICE_K * x * x / left;
}
function paceFromMult(mult) { return Math.pow(mult, 1 / CONFIG.GEN_YEARS) - 1; }
function multFromPace(pace) { return Math.pow(1 + pace, CONFIG.GEN_YEARS); }
function clampPace(p) { return Math.min(CONFIG.PACE_MAX, Math.max(CONFIG.PACE_MIN, p)); }
function squareTons() { return CONFIG.RESERVE / (CONFIG.GROUND_ROWS * ((CONFIG.SHEET_X1 - CONFIG.SHEET_X0) / 10)); }
function penaltyOf(lbB, lbA) { return Math.pow(lbB / lbA, CONFIG.REFUSE_EXP); }

// What power costs in Britain against America: the price of British coal, and any engine America has that Britain
// does not. American coal stays at the 1865 price.
function relCost(st) { return priceOf(st.S) * st.penalty; }
// The fire actually burning: the trade the nation's pace has built (Chat), less the works dear power sends to America.
function fireOf(Chat, S, penalty) { return Chat * Math.pow(priceOf(S) * penalty, -CONFIG.ETA); }
// How hard dear coal is pulling the fire down this year, as a yearly share (for the evening check and the words).
function dragOf(st) {
  const now = fireOf(st.Chat, st.S, st.penalty), next = fireOf(st.Chat, st.S + st.C, st.penalty);
  return Math.max(0, 1 - next / now);
}

function newGame() {
  return {
    year: CONFIG.START_YEAR, gen: 0, C: CONFIG.C0, Chat: CONFIG.C0, S: 0, A: CONFIG.AMERICA0,
    pop: CONFIG.POP0, gone: 0, lbB: CONFIG.LB_1865, lbA: CONFIG.LB_1865, penalty: 1, pending: null,
    history: [{ year: CONFIG.START_YEAR, C: CONFIG.C0, A: CONFIG.AMERICA0, S: 0, gone: 0 }],
    gens: [], engines: {}, evening: false, eveningYear: null, ended: false, lastPace: null, americaPassed: null,
  };
}

// The engine offered at the start of this generation, if any and not yet decided, with Britain's engine beside it.
function engineOffer(st) {
  if (st.ended || st.evening) return null;
  const e = CONFIG.ENGINES.find(e => e.year === st.year);
  if (!e || st.engines[e.key]) return null;
  return { key: e.key, year: e.year, lbNew: e.lbNew, lbBritain: st.lbB, lbAmerica: st.lbA, gain: st.lbB / e.lbNew };
}
function decideEngine(st, fit) {
  const e = engineOffer(st);
  if (!e) return null;
  const oldB = st.lbB, oldA = st.lbA;
  st.engines[e.key] = fit ? 'fit' : 'refused';
  st.lbA = e.lbNew;
  if (fit) st.lbB = e.lbNew;
  st.pending = {
    key: e.key, fit,
    rebB: fit ? Math.pow(oldB / e.lbNew, CONFIG.REBOUND_EXP) : 1,
    rebA: Math.pow(oldA / e.lbNew, CONFIG.REBOUND_EXP),
    penFrom: st.penalty, penTo: penaltyOf(st.lbB, st.lbA),
  };
  return st.engines[e.key];
}

// The pencil: where a pace would put the fire in twenty years, and the coal that would take, if nothing else
// happened. This is the plan, drawn dotted; the burn draws what does happen.
function previewPlan(st, pace) {
  pace = clampPace(pace);
  let C = st.C, S = st.S; const pts = [{ year: st.year, C }];
  for (let i = 0; i < CONFIG.GEN_YEARS; i++) { S += C; C *= 1 + pace; pts.push({ year: st.year + i + 1, C }); }
  return { pace, mult: C / st.C, target: C, burnt: S - st.S, squares: (S - st.S) / squareTons(), points: pts };
}

// Has the evening come? Even at the hardest push, with any engine just decided, the fire could not grow.
function eveningNow(st) {
  const p = st.pending || { rebB: 1, penFrom: st.penalty, penTo: st.penalty };
  const yr = Math.pow(p.rebB, 1 / CONFIG.GEN_YEARS) * Math.pow(p.penTo / p.penFrom, -CONFIG.ETA / CONFIG.GEN_YEARS);
  return (1 + CONFIG.PACE_MAX) * yr * (1 - dragOf(st)) <= 1;
}

// One generation, year by year. pace is the player's (clamped). Returns the record, with the years for drawing.
function burnGeneration(st, pace) {
  if (st.ended) return null;
  pace = clampPace(pace);
  const startC = st.C, startS = st.S, startGone = st.gone, startA = st.A, from = st.year;
  const p = st.pending || { key: null, fit: null, rebB: 1, rebA: 1, penFrom: st.penalty, penTo: st.penalty };
  const rbB = Math.pow(p.rebB, 1 / CONFIG.GEN_YEARS), rbA = Math.log(p.rebA) / CONFIG.GEN_YEARS;
  const years = [];
  for (let i = 0; i < CONFIG.GEN_YEARS; i++) {
    const burnt = st.C;                  // this year's coal comes out of the ground
    st.S += burnt;
    st.Chat *= (1 + pace) * rbB;
    st.penalty = p.penFrom * Math.pow(p.penTo / p.penFrom, (i + 1) / CONFIG.GEN_YEARS);
    const Cn = fireOf(st.Chat, st.S, st.penalty);
    const g = Cn / st.C - 1;
    // the people: if the trade grows slower than they do, some find no work and a share of them go over the sea
    const short = CONFIG.POP_RATE - g;
    const leave = short > 0 ? CONFIG.EMIGRATE_SHARE * short * st.pop : 0;
    st.pop = st.pop * (1 + CONFIG.POP_RATE) - leave;
    st.gone += leave;
    // America: logistic growth, plus the rebound of an engine that came in this generation
    st.A *= Math.exp(CONFIG.AMERICA_RATE * (1 - st.A / CONFIG.AMERICA_CAP) + rbA);
    st.C = Cn;
    st.year += 1;
    if (st.americaPassed === null && st.A > st.C) st.americaPassed = st.year;
    years.push({ year: st.year, C: st.C, A: st.A, S: st.S, burnt, gone: st.gone, leave, g,
      depth: depthOf(st.S), price: priceOf(st.S) });
    st.history.push({ year: st.year, C: st.C, A: st.A, S: st.S, gone: st.gone });
  }
  const rec = {
    gen: st.gen, from, to: st.year, pace, planMult: multFromPace(pace), plan: previewPlan({ C: startC, S: startS, year: from }, pace),
    mult: st.C / startC, burnt: st.S - startS, squares: (st.S - startS) / squareTons(), gone: st.gone - startGone,
    depth: depthOf(st.S), price: priceOf(st.S), relCost: relCost(st), drag: dragOf(st),
    engine: p.key ? { key: p.key, fit: p.fit } : null,
    americaRatio: st.A / st.C, americaRatioStart: startA / startC,
    americaPassedNow: st.americaPassed !== null && st.americaPassed > from && st.americaPassed <= st.year,
    auto: !!st.autoRun, years,
  };
  st.gens.push(rec);
  st.pending = null;
  if (!st.autoRun) st.lastPace = pace;
  st.gen += 1;
  if (st.gen >= CONFIG.MAX_GENS) st.ended = true;
  return rec;
}

// Between generations: if the evening has come (and no engine is waiting to be offered), it is declared, and the
// rest of the sheet to 1985 is drawn at the last pace the player set (runOut).
function checkEvening(st) {
  if (st.ended || st.evening) return false;
  if (engineOffer(st)) return false;
  if (!eveningNow(st)) return false;
  st.evening = true; st.eveningYear = st.year;
  return true;
}
function runOut(st) {
  const recs = [];
  st.autoRun = true;
  while (!st.ended) recs.push(burnGeneration(st, st.lastPace === null ? 0 : st.lastPace));
  st.autoRun = false;
  return recs;
}

// ---- the verdict ---------------------------------------------------------------------------------------------
function verdict(st) {
  const h = st.history;
  let peak = h[0];
  h.forEach(p => { if (p.C > peak.C) peak = p; });
  const last = h[h.length - 1];
  const peakMult = peak.C / CONFIG.C0;
  const kind = peakMult >= CONFIG.GREAT_PEAK ? 'greatness' : peakMult <= CONFIG.MEDIOCRE_PEAK ? 'mediocrity' : 'between';
  const left = Math.max(0, CONFIG.RESERVE - st.S);
  const yearsLeft = last.C > 0 ? left / last.C : Infinity;
  // when did most of the people go? the year by which half of them had gone
  let halfYear = null;
  for (const p of h) if (halfYear === null && st.gone > 0 && p.gone >= st.gone / 2) halfYear = p.year;
  return {
    kind, noonYear: peak.year, noonC: peak.C, noonMult: peakMult,
    noonOffSheet: peak.C > CONFIG.ROW_TONS * CONFIG.ROWS_ABOVE,
    stillRising: last.C >= 0.98 * peak.C && peak.year > CONFIG.START_YEAR,
    endYear: last.year, endC: last.C, endMult: last.C / CONFIG.C0, fallFromNoon: last.C / peak.C,
    evening: st.evening, eveningYear: st.eveningYear, eveningDepth: null,
    americaPassed: st.americaPassed, gone: st.gone, goneBeforeNoon: peak.gone, goneAfterNoon: st.gone - peak.gone,
    goneHalfYear: halfYear, shareBurnt: shareBurnt(st.S), depth: depthOf(st.S), price: priceOf(st.S),
    relCost: relCost(st), yearsLeft, untilYear: last.year + yearsLeft, engines: Object.assign({}, st.engines),
    popHome: st.pop,
  };
}

// ---- the curve continued (shown once, on the last screen, with no words) -------------------------------------
// United Kingdom coal production, millions of tons a year. 1865-1899: the standard series (Mitchell, British
// Historical Statistics), from memory, to be checked against the DESNZ table "Coal since 1853". 1900-2024: Our World
// in Data / Energy Institute (owid-energy-data.csv, coal_production in TWh), converted at the factor that makes
// 1900 = 225.2 million tons; this gives 1913 = 287.5, 1920 = 229.5, 1950 = 216.3, 1984 = 51.4, 2015 = 8.6, which
// agree with the published tonnages.
const REAL = [
  [1865, 98.2], [1866, 101.6], [1867, 104.5], [1868, 103.1], [1869, 107.4], [1870, 110.4], [1871, 117.4], [1872, 123.5],
  [1873, 128.7], [1874, 126.6], [1875, 133.3], [1876, 134.1], [1877, 134.6], [1878, 132.6], [1879, 133.7], [1880, 147.0],
  [1881, 154.2], [1882, 156.5], [1883, 163.7], [1884, 160.8], [1885, 159.4], [1886, 157.5], [1887, 162.1], [1888, 169.9],
  [1889, 176.9], [1890, 181.6], [1891, 185.5], [1892, 181.8], [1893, 164.3], [1894, 188.3], [1895, 189.7], [1896, 195.4],
  [1897, 202.1], [1898, 202.1], [1899, 220.1],
  [1900, 225.2], [1901, 219.1], [1902, 227.1], [1903, 230.4], [1904, 232.4], [1905, 236.1], [1906, 251.1], [1907, 267.9],
  [1908, 261.6], [1909, 263.8], [1910, 264.5], [1911, 271.9], [1912, 260.4], [1913, 287.5], [1914, 265.7], [1915, 253.2],
  [1916, 256.4], [1917, 248.5], [1918, 227.8], [1919, 229.8], [1920, 229.5], [1921, 163.3], [1922, 249.6], [1923, 276.0],
  [1924, 266.9], [1925, 244.3], [1926, 125.6], [1927, 251.3], [1928, 237.5], [1929, 257.9], [1930, 243.9], [1931, 219.5],
  [1932, 208.7], [1933, 207.1], [1934, 220.7], [1935, 222.3], [1936, 228.5], [1937, 240.4], [1938, 227.0], [1939, 231.4],
  [1940, 224.3], [1941, 206.4], [1942, 205.0], [1943, 199.0], [1944, 192.8], [1945, 182.8], [1946, 190.1], [1947, 197.5],
  [1948, 209.5], [1949, 215.2], [1950, 216.3], [1951, 222.9], [1952, 226.5], [1953, 224.2], [1954, 224.1], [1955, 221.6],
  [1956, 222.0], [1957, 223.6], [1958, 215.8], [1959, 206.1], [1960, 193.6], [1961, 190.7], [1962, 197.5], [1963, 195.8],
  [1964, 193.6], [1965, 187.5], [1966, 174.6], [1967, 172.2], [1968, 164.1], [1969, 150.6], [1970, 144.8], [1971, 144.8],
  [1972, 119.9], [1973, 129.9], [1974, 108.7], [1975, 126.7], [1976, 121.8], [1977, 120.2], [1978, 121.6], [1979, 120.4],
  [1980, 139.6], [1981, 130.4], [1982, 127.2], [1983, 121.5], [1984, 51.4], [1985, 94.6], [1986, 109.7], [1987, 105.7],
  [1988, 105.8], [1989, 101.8], [1990, 94.4], [1991, 96.2], [1992, 86.1], [1993, 69.5], [1994, 49.7], [1995, 54.8],
  [1996, 52.1], [1997, 50.7], [1998, 43.1], [1999, 38.8], [2000, 32.7], [2001, 33.4], [2002, 31.4], [2003, 29.5],
  [2004, 24.8], [2005, 20.2], [2006, 18.1], [2007, 17.0], [2008, 18.0], [2009, 17.5], [2010, 18.1], [2011, 18.3],
  [2012, 16.8], [2013, 12.7], [2014, 11.6], [2015, 8.6], [2016, 4.6], [2017, 3.3], [2018, 3.0], [2019, 2.8],
  [2020, 1.8], [2021, 1.2], [2022, 0.7], [2023, 0.6], [2024, 0.1],
];

const MECH = { CONFIG, newGame, engineOffer, decideEngine, previewPlan, burnGeneration, checkEvening, runOut, verdict,
  depthOf, priceOf, shareBurnt, fireOf, paceFromMult, multFromPace, clampPace, squareTons, dragOf, relCost, eveningNow,
  REAL };
if (typeof module !== 'undefined' && module.exports) module.exports = MECH;
