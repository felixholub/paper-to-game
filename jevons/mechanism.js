// Jevons's Noon: mechanism. The single source of truth: every rule that affects what happens on the sheet lives
// here. Runs unchanged in Node (calibration.js, loop.js) and in the browser (inlined verbatim by build.py).
//
// Kind: TOY. A small model built to illustrate the argument of The Coal Question (1866, second edition: preface,
// ch. I, ch. VII, ch. XVIII), calibrated to the numbers those chapters and the frontispiece give. Where the toy
// had to choose something Jevons does not give, the line says "our choice".
//
// Revision 2: one production engine underneath. Power = coal x what a ton does; income = people x (power per
// head)^ALPHA; fuel's share of income, shown as days of a year's earnings, is the price; works go where power is
// cheap; an engine is fitted when the fuel it saves is worth its cost; the people's increase follows income per head.
// Revision 3: the player sets all ten generations; income per head is told per head of the people Britain would have
// had at the census rate (the gone counted in); a box for after 2065 values the coal left; and a score: the typical
// generation (the geometric mean of income per head over the ten and the box after) against the best path found.

const CONFIG = {
  // ---- the clock -------------------------------------------------------------------------------------------
  START_YEAR: 1865,           // preface: the 1865 return is the last Jevons quotes
  GEN_YEARS: 20,              // our choice: one turn is a generation of twenty years
  MAX_GENS: 10,               // our choice: the player sets ten generations, 1865 to 2065, so that a fire that runs
                              //   out is seen to run out and every generation scored is the player's
  RUN_TO: 2065,               // the sheet's last year (START_YEAR + MAX_GENS x GEN_YEARS); after the evening the rest
                              //   is drawn at the last pace set
  FUTURE_FROM: 1985,          // our choice: from here the ledger's boxes are hatched and flagged as supposing, with
                              //   Jevons, that no substitute for coal is found (a little more than his own century)
  AFTER_YEARS: 200,           // our choice: the box after 2065 values the coal left as if burnt evenly over ten more
                              //   generations, with the engines of 2065, for the people of 2065

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
                              //   (eight layers of 500 feet on the sheet)
  PRICE_K: 1,                 // ch. I: when the coal within 4,000 feet is nearly spent, "the average price of coal much
                              //   higher than the highest price now paid for the finest kinds of coal"; ch. I: "no
                              //   recent rise of importance" yet; preface: the cost of a shaft "increases in a far
                              //   higher ratio than its depth". Our choice: price = 1 + K x^2 / (1 - x), x the share
                              //   of the coal burnt: flat at first, twice the 1865 price at x = 0.62 (about 2,500
                              //   feet), without limit near the bottom ("we cannot get to the bottom of them")
  PRICE_FLOOR_LEFT: 0.002,    // numerical guard only

  // ---- the production engine (our choice throughout; Jevons gives the direction, "coal ... the factor in
  //      everything we do", ch. I, not a function) ----------------------------------------------------------------
  LB_1865: 4,                 // ch. VII: a good engine of the present day burns about 4 lb of coal per horse-power
                              //   per hour (Rankine); what a ton does is LB_1865 / lb of the engine in use (1 in 1865)
  ALPHA: 0.7,                 // income per head = (power per head, relative to 1865)^ALPHA: an extra horse per person
                              //   brings a little less than proportionally
  FUEL_SHARE_1865: 0.05,      // fuel's share of income in 1865: a twentieth, about 18 days of a year's earnings
                              //   (95 million tons at pit prices against the national income; the chapters do not
                              //   give it)
  ETA: 2.5,                   // the trade Britain keeps is the trade its pace has built times (what power costs in
                              //   Britain / what it costs in America) to the power -ETA; power costs price / what a
                              //   ton does. Preface: "so far as cheap fuel and power is the exciting cause of
                              //   manufactures, these must pass to where fuel is cheapest"
  ADJUST: 0.1,                // works move a tenth of the way (in proportion) each year towards where cheap power
                              //   draws them: a mill is not moved in a season, but a great gap moves many

  // ---- the new engines (ch. VII) ----------------------------------------------------------------------------
  ENGINES: [
    { key: 'air', year: 1885, lbNew: 2, pays: 3, cheapens: 0.04 },
                              // ch. VII: an air-engine "has worked at about one-half the expenditure of an ordinary
                              //   good engine of the present day". Our choice: it exists from 1885, pays where coal is
                              //   three times the 1865 price, and gets 4 per cent a year cheaper to build, so it pays
                              //   even at the 1865 price about 27 years later (preface: "the question is one of
                              //   capital against current expenditure ... a wasteful engine pays better where coals
                              //   are cheap than a more perfect but costly engine")
    { key: 'perfect', year: 1925, lbNew: 1.3, pays: 3, cheapens: 0.04 },
                              // ch. VII: "the ultimate improvement of the air-engine will probably reduce the
                              //   consumption to less than one-third of the present consumption"; same terms
  ],
  REBOUND_EXP: 0.5,           // our choice: over the twenty years after a country fits an engine, the trade it has
                              //   built grows by (old lb / new lb)^0.5 besides: cheap power pays for new works
                              //   (ch. VII: ploughs, pumps, ships; "the very contrary is the truth"). Smaller than
                              //   either magnitude ch. VII reports (ten-fold engine, ten-fold coal; Scottish iron).
                              // America's coal is at the 1865 price always, so America fits an engine when it has
                              //   cheapened enough to pay at that price (ch. VII: economies are "as open to our
                              //   commercial competitors as to ourselves")

  // ---- America (a toy rival) --------------------------------------------------------------------------------
  AMERICA0: 21,               // our choice: about a fifth of Britain's in 1865 (American output then was some
                              //   twenty-odd million tons)
  AMERICA_RATE: 0.06,         // our choice: America's coal grows 6 per cent a year, slowing towards a ceiling;
                              //   preface: other countries "approximating to our own, and ultimately passing it"
  AMERICA_CAP: 2500,          // our choice: the ceiling (far above the sheet)

  // ---- the people (preface: "a sore pressure of population and a great exodus of our people"; "the
  //      extraordinary facts concerning the prevalence of marriage") ----------------------------------------------
  POP0: 30,                   // millions in the kingdom, 1865 (the 1861 census counted about 29 million)
  POP_RATE: 0.012,            // the people increase about 1.2 per cent a year while income per head holds (the census
                              //   rate of the 1850s); ch. I: "a nation tends to multiply itself at a constant rate"
  POP_ELAST: 1,               // our choice: fewer marry as income per head falls below 1865's: the increase is
                              //   POP_RATE x (income per head relative to 1865)^POP_ELAST, never above POP_RATE
  EMIGRATE_SHARE: 0.15,       // our choice: when power (the trade) grows slower than the people, about one in seven
                              //   of those it cannot employ go over the sea; the rest stay and "sink down into
                              //   poverty" (ch. I)

  // ---- the sheet (drawing only; the mechanism reports in tons and years) ----------------------------------------
  SHEET_X0: 1850, SHEET_X1: 2070, // 22 columns of ten years
  ROW_TONS: 50,               // one row: 50 million tons a year; one square = 10 years x 50 = 500 million tons
  ROWS_ABOVE: 12,             // the sheet's height at the start: 600 million tons a year (Jevons's own curve leaves it
                              //   about 1920); the page adds paper above when a fire climbs higher
  GROUND_ROWS: 8,             // eight layers of 500 feet down to 4,000 feet; 8 x 22 = 176 cells, of which 167 hold a
                              //   square of coal (83,544 / 500); the last nine cells of the bottom layer are empty rock
  PEOPLE_PER_SQUARE: 4,       // millions of people gone over the sea per square of the hatched bar

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
function squareTons() { return CONFIG.ROW_TONS * 10; }
function groundSquares() { return Math.round(CONFIG.RESERVE / squareTons()); }
function doesOf(lb) { return CONFIG.LB_1865 / lb; }           // what a ton does, relative to 1865
// The production engine. power in 1865-ton-equivalents; income relative to 1865's; both for Britain only.
// Heads, for income per head, are the people Britain would have had at the census rate, the gone counted in (our
// choice: otherwise a path scores by sending people away); the people at home decide the fire's growth and the exodus.
function naturalPop(year) { return CONFIG.POP0 * Math.pow(1 + CONFIG.POP_RATE, year - CONFIG.START_YEAR); }
function powerOf(C, lb) { return C * doesOf(lb); }
function incomeOf(C, lb, N) {
  const perHead = (powerOf(C, lb) / N) / (CONFIG.C0 / CONFIG.POP0);
  return (N / CONFIG.POP0) * Math.pow(perHead, CONFIG.ALPHA);  // relative to the income of 1865 (= 1)
}
function incomePerHeadOf(C, lb, N) { return incomeOf(C, lb, N) / (N / CONFIG.POP0); }
// Fuel's share of income, and the days of a year's earnings it takes.
function fuelShareOf(C, lb, N, S) {
  const y = incomeOf(C, lb, N);
  return y > 1e-9 ? CONFIG.FUEL_SHARE_1865 * (priceOf(S) * C / CONFIG.C0) / y : Infinity;   // no coal: no income to pay for it
}
function daysOf(C, lb, N, S) { return 365 * fuelShareOf(C, lb, N, S); }
// What power costs: the price of coal over what a ton does. America's coal stays at the 1865 price.
function powerCost(price, lb) { return price / doesOf(lb); }
function relCost(st) { return powerCost(priceOf(st.S), st.lbB) / powerCost(1, st.lbA); }
// Where cheap power would draw the works to, as the share of the trade Britain keeps (1 when power costs the same in
// both countries); the works move towards it a tenth of the way each year (st.w).
function keepTarget(S, lbB, lbA) { return Math.min(1, Math.pow(powerCost(priceOf(S), lbB) / powerCost(1, lbA), -CONFIG.ETA)); }
// (capped at 1: a lead in engines lets Britain keep its works, "neutralize the evils of dearness ... for a time",
//  ch. VII; it does not draw America's works over)
// The fire actually burning: the trade the nation's pace has built (Chat), times the share of it still at home.
function fireOf(Chat, w) { return Chat * w; }
// Kept up from now, when would this pace use the last of the coal within 4,000 feet? A year, or Infinity if never.
// Jevons's own "at same rate of progress" projection: it ignores dear coal and engines, which the burn then shows.
function lastsUntil(st, pace) {
  pace = clampPace(pace);
  let C = st.C, S = st.S, y = st.year;
  if (pace <= 0 && C / Math.max(1e-9, -pace) < CONFIG.RESERVE - S) return Infinity;
  while (S < CONFIG.RESERVE && y < 5000) { S += C; C *= 1 + pace; y += 1; }
  return y >= 5000 ? Infinity : y;
}
// The price at which an engine pays in a given year: it falls as the engine gets cheaper to build.
function paysAt(e, year) { return e.pays * Math.exp(-e.cheapens * (year - e.year)); }
function americaFitsIn(e) { return e.year + Math.ceil(Math.log(e.pays) / e.cheapens); }

function newGame() {
  const st = {
    year: CONFIG.START_YEAR, gen: 0, C: CONFIG.C0, Chat: CONFIG.C0, S: 0, A: CONFIG.AMERICA0,
    pop: CONFIG.POP0, gone: 0, lbB: CONFIG.LB_1865, lbA: CONFIG.LB_1865, rebB: [], rebA: [], w: 1,
    history: [], gens: [], engines: {}, evening: false, eveningYear: null, ended: false, playerDone: false,
    lastPace: null, americaPassed: null, events: [],
  };
  st.history.push(snapshot(st));
  return st;
}
function snapshot(st) {
  const income = incomeOf(st.C, st.lbB, st.pop);
  return { year: st.year, C: st.C, A: st.A, S: st.S, gone: st.gone, pop: st.pop, lbB: st.lbB, lbA: st.lbA,
    income, perHead: income / (naturalPop(st.year) / CONFIG.POP0), perHeadHome: incomePerHeadOf(st.C, st.lbB, st.pop),
    days: daysOf(st.C, st.lbB, st.pop, st.S), price: priceOf(st.S), power: powerOf(st.C, st.lbB) };
}

// The engine that appears at the start of this generation, if any: an announcement, not a choice.
function engineNews(st) {
  if (st.ended || st.evening || st.playerDone) return null;
  const e = CONFIG.ENGINES.find(e => e.year === st.year);
  if (!e) return null;
  return { key: e.key, year: e.year, lbNew: e.lbNew, lbBritain: st.lbB, lbAmerica: st.lbA, gain: st.lbB / e.lbNew,
    paysNow: paysAt(e, st.year), americaFitsIn: americaFitsIn(e), priceBritain: priceOf(st.S) };
}

// The pencil: where a pace would put the fire in twenty years, and the coal that would take, if nothing else
// happened. This is the plan, drawn dotted; the burn draws what does happen.
function previewPlan(st, pace) {
  pace = clampPace(pace);
  let C = st.C, S = st.S; const pts = [{ year: st.year, C }];
  for (let i = 0; i < CONFIG.GEN_YEARS; i++) { S += C; C *= 1 + pace; pts.push({ year: st.year + i + 1, C }); }
  const target = C, burnt = S - st.S;
  const beyond = [{ year: st.year + CONFIG.GEN_YEARS, C }];
  for (let y = st.year + CONFIG.GEN_YEARS; y < CONFIG.SHEET_X1 && S < CONFIG.RESERVE; y++) { S += C; C *= 1 + pace; beyond.push({ year: y + 1, C }); }
  return { pace, mult: target / st.C, target, burnt, squares: burnt / squareTons(), points: pts, beyond,
    lastsUntil: lastsUntil(st, pace) };
}

// Has the evening come? Even at the hardest push, the fire would not grow this year.
function cloneState(st) {
  const c = Object.assign({}, st);
  c.rebB = st.rebB.map(r => Object.assign({}, r)); c.rebA = st.rebA.map(r => Object.assign({}, r));
  c.engines = JSON.parse(JSON.stringify(st.engines)); c.history = []; c.events = []; c.gens = [];
  return c;
}
function eveningNow(st) {
  const c = cloneState(st);
  stepYear(c, CONFIG.PACE_MAX);
  return c.C <= st.C;
}
// How hard dear coal is pulling the fire down this year, as a yearly share (for the words).
function dragOf(st) {
  const c = cloneState(st); stepYear(c, 0);
  return Math.max(0, 1 - c.C / st.C);
}

// One year of the engine. Engines are fitted here, when they pay.
function stepYear(st, pace) {
  const ev = [];
  // engines: Britain fits one when its coal is dear enough; America when the engine has cheapened to its price
  for (const e of CONFIG.ENGINES) {
    if (st.year < e.year) continue;
    if (!st.engines[e.key]) st.engines[e.key] = {};
    const rec = st.engines[e.key], pays = paysAt(e, st.year);
    if (!rec.britain && e.lbNew < st.lbB && priceOf(st.S) >= pays) {
      rec.britain = st.year; st.rebB.push({ yearly: Math.pow(st.lbB / e.lbNew, CONFIG.REBOUND_EXP / CONFIG.GEN_YEARS), left: CONFIG.GEN_YEARS });
      st.lbB = e.lbNew; ev.push({ year: st.year, who: 'britain', key: e.key });
    }
    if (!rec.america && e.lbNew < st.lbA && 1 >= pays) {
      rec.america = st.year; st.rebA.push({ yearly: Math.pow(st.lbA / e.lbNew, CONFIG.REBOUND_EXP / CONFIG.GEN_YEARS), left: CONFIG.GEN_YEARS });
      st.lbA = e.lbNew; ev.push({ year: st.year, who: 'america', key: e.key });
    }
  }
  const rebB = st.rebB.reduce((m, r) => m * r.yearly, 1), rebA = st.rebA.reduce((m, r) => m * r.yearly, 1);
  st.rebB.forEach(r => r.left--); st.rebB = st.rebB.filter(r => r.left > 0);
  st.rebA.forEach(r => r.left--); st.rebA = st.rebA.filter(r => r.left > 0);
  // this year's coal comes out of the ground; the trade grows at the pace, and with cheap power
  const burnt = Math.min(st.C, Math.max(0, CONFIG.RESERVE - st.S));
  st.S += burnt;
  st.Chat *= (1 + pace) * rebB;
  st.w *= Math.pow(keepTarget(st.S, st.lbB, st.lbA) / st.w, CONFIG.ADJUST);
  const Cn = Math.min(fireOf(st.Chat, st.w), Math.max(0, CONFIG.RESERVE - st.S));   // no more than is left
  // the people: they increase at the census rate while income per head holds, more slowly as it falls; those the
  // trade (power) cannot employ: a share go over the sea
  const perHead = incomePerHeadOf(st.C, st.lbB, st.pop);
  const rate = CONFIG.POP_RATE * Math.pow(Math.min(1, perHead), CONFIG.POP_ELAST);
  const gPower = powerOf(Cn, st.lbB) / powerOf(st.C, st.lbB) - 1;
  const short = rate - gPower;
  const leave = short > 0 ? CONFIG.EMIGRATE_SHARE * short * st.pop : 0;
  st.pop = st.pop * (1 + rate) - leave;
  st.gone += leave;
  // America: logistic growth, plus the rebound of its engines
  st.A *= Math.exp(CONFIG.AMERICA_RATE * (1 - st.A / CONFIG.AMERICA_CAP)) * rebA;
  st.C = Cn;
  st.year += 1;
  if (st.americaPassed === null && st.A > st.C) st.americaPassed = st.year;
  const snap = snapshot(st); snap.burnt = burnt; snap.leave = leave; snap.g = Cn / burnt - 1;
  st.history.push(snap);
  st.events.push(...ev);
  return { snap, events: ev };
}

// One generation, year by year. pace is the player's (clamped). Returns the record, with the years for drawing.
function burnGeneration(st, pace) {
  if (st.ended) return null;
  pace = clampPace(pace);
  const startC = st.C, startS = st.S, startGone = st.gone, startA = st.A, from = st.year, startLbB = st.lbB;
  const years = [], events = [];
  let incomeSum = 0, perHeadSum = 0;
  for (let i = 0; i < CONFIG.GEN_YEARS; i++) {
    const r = stepYear(st, pace);
    years.push(r.snap); events.push(...r.events);
    incomeSum += r.snap.income; perHeadSum += r.snap.perHead;
  }
  const last = years[years.length - 1];
  const rec = {
    gen: st.gen, from, to: st.year, pace, planMult: multFromPace(pace), plan: previewPlan({ C: startC, S: startS, year: from }, pace),
    mult: st.C / startC, burnt: st.S - startS, squares: (st.S - startS) / squareTons(), gone: st.gone - startGone,
    depth: depthOf(st.S), price: priceOf(st.S), relCost: relCost(st), drag: dragOf(st), days: last.days,
    income: incomeSum / CONFIG.GEN_YEARS, perHead: perHeadSum / CONFIG.GEN_YEARS, perHeadEnd: last.perHead,
    engines: events, fittedBritain: st.lbB < startLbB,
    americaRatio: st.A / st.C, americaRatioStart: startA / startC,
    americaPassedNow: st.americaPassed !== null && st.americaPassed > from && st.americaPassed <= st.year,
    auto: !!st.autoRun, years,
  };
  st.gens.push(rec);
  if (!st.autoRun) st.lastPace = pace;
  st.gen += 1;
  if (st.gen >= CONFIG.MAX_GENS) st.playerDone = true;
  if (st.year >= CONFIG.RUN_TO) st.ended = true;
  return rec;
}

// Between generations: if the evening has come, it is declared, and the rest of the sheet is drawn at the last pace
// the player set (runOut). The player's turns are over when the evening comes or MAX_GENS have been set.
function checkEvening(st) {
  if (st.ended || st.evening || st.playerDone) return false;
  if (!eveningNow(st)) return false;
  st.evening = true; st.eveningYear = st.year;
  return true;
}
function playerTurnsOver(st) { return st.ended || st.evening || st.playerDone; }
function runOut(st) {
  const recs = [];
  st.autoRun = true;
  while (!st.ended) recs.push(burnGeneration(st, st.lastPace === null ? 0 : st.lastPace));
  st.autoRun = false;
  return recs;
}

// ---- the ledger: what each generation got -----------------------------------------------------------------------
// One entry per generation from 1865, each with the squares it burnt, its income (relative to the income of 1865 over
// the same span) and its income per head (relative to 1865's); and a last entry for what is left after RUN_TO.
function ledgerOf(history) {
  const out = [];
  const first = CONFIG.START_YEAR;
  for (let from = first; from < CONFIG.RUN_TO; from += CONFIG.GEN_YEARS) {
    const to = from + CONFIG.GEN_YEARS;
    const ys = history.filter(h => h.year > from && h.year <= to && h.burnt != null);
    if (!ys.length) { out.push({ from, to, n: 0, squares: 0, income: null, perHead: null, days: null, future: from >= CONFIG.FUTURE_FROM }); continue; }
    const mean = k => ys.reduce((a, h) => a + h[k], 0) / ys.length;
    out.push({ from, to, n: ys.length, squares: ys.reduce((a, h) => a + h.burnt, 0) / squareTons(), income: mean('income'),
      perHead: mean('perHead'), perHeadHome: mean('perHeadHome'), perHeadEnd: ys[ys.length - 1].perHead, days: ys[ys.length - 1].days,
      future: from >= CONFIG.FUTURE_FROM });
  }
  return out;
}
// The box after: the coal left, burnt evenly over AFTER_YEARS with the engines of the last year, for the people of
// the last year (at the census rate): what the generations after the sheet could have from it, as income per head.
function afterBox(st) {
  const left = Math.max(0, CONFIG.RESERVE - st.S), N = naturalPop(CONFIG.RUN_TO);
  return { squares: left / squareTons(), perHead: incomeOf(left / CONFIG.AFTER_YEARS, st.lbB, N) / (N / CONFIG.POP0) };
}
function ledger(st) {
  const gens = ledgerOf(st.history).filter(g => g.n === CONFIG.GEN_YEARS);
  const after = afterBox(st);
  return { gens, after, left: after.squares, total: CONFIG.RESERVE / squareTons() };
}
// The score: the typical generation, the geometric mean of income per head over the generations on the sheet and
// the box after (a planner who counts every generation the same, and a doubling the same for a poor generation as
// for a rich one: log utility, no discounting; our choice), against the best path found (optimum.js).
function typicalOf(st) {
  const L = ledger(st);
  const xs = L.gens.map(g => g.perHead).concat([L.after.perHead]);
  return Math.exp(xs.reduce((a, x) => a + Math.log(Math.max(1e-6, x)), 0) / xs.length);
}
function scoreOf(st, best) {
  const typical = typicalOf(st);
  return { typical, best, score: 100 * typical / best };
}
// A whole game played as the page plays it: a pace per generation; after the evening, the rest at the last pace.
function playPath(mults) {
  const st = newGame(); let i = 0;
  while (!playerTurnsOver(st)) {
    if (checkEvening(st)) break;
    burnGeneration(st, paceFromMult(mults[Math.min(i, mults.length - 1)])); i++;
    if (checkEvening(st)) break;
  }
  runOut(st);
  return st;
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
  let outYear = null;
  for (let i = h.length - 1; i >= 0; i--) if (h[i].C >= CONFIG.C0) { outYear = i === h.length - 1 ? null : h[i].year; break; }
  const L = ledger(st);
  let best = L.gens[0], worst = L.gens[0];
  for (const g of L.gens) { if (g.perHead > best.perHead) best = g; if (g.perHead < worst.perHead) worst = g; }
  const lastGen = L.gens[L.gens.length - 1];
  return {
    kind, noonYear: peak.year, noonC: peak.C, noonMult: peakMult,
    stillRising: last.C >= 0.98 * peak.C && peak.year > CONFIG.START_YEAR,
    endYear: last.year, endC: last.C, endMult: last.C / CONFIG.C0, fallFromNoon: last.C / peak.C,
    evening: st.evening, eveningYear: st.eveningYear,
    americaPassed: st.americaPassed, gone: st.gone, goneBeforeNoon: peak.gone, goneAfterNoon: st.gone - peak.gone,
    shareBurnt: shareBurnt(st.S), depth: depthOf(st.S), price: priceOf(st.S), relCost: relCost(st),
    yearsLeft, untilYear: last.year + yearsLeft, engines: JSON.parse(JSON.stringify(st.engines)),
    popHome: st.pop, outYear, squaresBurnt: st.S / squareTons(), squaresAll: groundSquares(),
    ledger: L, bestGen: best, worstGen: worst, lastGen, endDays: last.days, endPerHead: last.perHead,
    typical: typicalOf(st),
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


const MECH = { CONFIG, newGame, engineNews, previewPlan, burnGeneration, checkEvening, playerTurnsOver, runOut,
  verdict, ledger, ledgerOf, afterBox, typicalOf, scoreOf, playPath, naturalPop, depthOf, priceOf, shareBurnt, fireOf, keepTarget, cloneState, paceFromMult, multFromPace, clampPace, squareTons,
  groundSquares, lastsUntil, dragOf, relCost, eveningNow, doesOf, powerOf, incomeOf, incomePerHeadOf, fuelShareOf,
  daysOf, powerCost, paysAt, americaFitsIn, REAL };
if (typeof module !== 'undefined' && module.exports) module.exports = MECH;
