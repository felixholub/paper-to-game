// Calibration check (build.md, section 2): the mechanism against the numbers in the preface, ch. I, ch. VII, ch. XVIII
// and the frontispiece, and the central discoveries against changes to the designer's own choices.
// Run: node calibration.js > calibration-result.txt   (exits non-zero on any failure)
const M = require('./mechanism.js');
const C = M.CONFIG;
let fails = 0, n = 0;
const ok = (cond, msg) => { n++; if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

console.log('--- 1. Numbers the text gives ---');
// Frontispiece: Jevons's supposed future consumption, ten-yearly from 83.6 in 1861 at 3½ per cent
for (const [y, v] of C.JEVONS_CURVE) {
  const m = 83.6 * Math.pow(1 + C.JEVONS_RATE, y - 1861);
  ok(near(m, v, 0.012), `frontispiece ${y}: ${v} million tons; 3½ per cent from 83.6 gives ${m.toFixed(1)} (within 1.2%)`);
}
ok(C.C0 === 95, 'preface: 1865 production about 95 million tons');
// Ch. I: "should the consumption multiply for rather more than a century at the same rate", the coal to 4,000 ft
{ const st = M.newGame(); const y = M.lastsUntil(st, C.JEVONS_RATE);
  ok(y - C.START_YEAR >= 100 && y - C.START_YEAR <= 115, `ch. I: at the same rate from 1865, Hull's ${C.RESERVE} million tons last ${y - C.START_YEAR} years, to ${y} ("rather more than a century")`); }
ok(near(M.multFromPace(C.JEVONS_RATE), 2, 0.01), `"as now" = 3½ per cent a year = x${M.multFromPace(C.JEVONS_RATE).toFixed(3)} in twenty years`);
// The ruler's other marks, kept up from 1865
{ const st = M.newGame();
  ok(!isFinite(M.lastsUntil(st, M.paceFromMult(0.5))), 'ruler: "cut back" kept up never uses the coal (a falling fire burns a finite amount)');
  ok(M.lastsUntil(st, 0) > 2700, `ruler: "a stand" kept up lasts to ${M.lastsUntil(st, 0)} (83,544 / 95 = 879 years)`);
  ok(M.lastsUntil(st, M.paceFromMult(1.5)) > 1990 && M.lastsUntil(st, M.paceFromMult(1.5)) < 2030, `ruler: "slower" kept up lasts to ${M.lastsUntil(st, M.paceFromMult(1.5))}`);
  ok(M.lastsUntil(st, C.PACE_MAX) < M.lastsUntil(st, C.JEVONS_RATE), `ruler: "faster" kept up lasts to ${M.lastsUntil(st, C.PACE_MAX)}, sooner than "as now"`); }
// Ch. VII engines
ok(C.LB_1865 === 4, 'ch. VII: a good engine of the present day burns about 4 lb per horse-power per hour');
ok(C.ENGINES[0].lbNew === C.LB_1865 / 2, 'ch. VII: the air-engine has worked at about one-half the expenditure');
ok(C.ENGINES[1].lbNew < C.LB_1865 / 3, 'ch. VII: the perfected air-engine at "less than one-third of the present consumption"');
// Ch. I: no recent rise of importance in price; at the bottom, far dearer than the finest coal now
{ const st = M.newGame(); M.burnGeneration(st, C.JEVONS_RATE);
  ok(M.priceOf(st.S) < 1.02, `ch. I: no rise of importance yet: after 1865–1885 as now, coal is x${M.priceOf(st.S).toFixed(3)} the 1865 price`); }
ok(M.priceOf(0.9 * C.RESERVE) > 3, `ch. I: with nine-tenths of the coal within 4,000 ft gone, coal is x${M.priceOf(0.9 * C.RESERVE).toFixed(1)} the 1865 price ("much higher than the highest price now paid")`);
ok(M.priceOf(0.995 * C.RESERVE) > 50, 'preface: "we cannot get to the bottom of them": the last of the coal is dearer than any trade will pay');
// The ground: 167 squares of exactly 500 million tons
ok(M.squareTons() === 500 && M.groundSquares() === 167, `the sheet: one square of ground = ${M.squareTons()} million tons = one square of fire (10 years x 50 million tons a year); ${M.groundSquares()} squares hold Hull's ${C.RESERVE}`);
ok(M.groundSquares() <= C.GROUND_ROWS * (C.SHEET_X1 - C.SHEET_X0) / 10, 'the sheet: the ground has room for every square');
// The real series for the last screen
const R = Object.fromEntries(M.REAL);
ok(R[1900] === 225.2 && near(R[1913], 287.4, 0.005) && near(R[1920], 229.5, 0.005) && near(R[1950], 216.3, 0.005),
  `last screen: UK production 1900 ${R[1900]}, 1913 ${R[1913]}, 1920 ${R[1920]}, 1950 ${R[1950]} (published 225.2, 287.4, 229.5, 216.3)`);
ok(Math.max(...M.REAL.map(r => r[1])) === R[1913], 'last screen: the real curve peaks in 1913');
ok(M.REAL.length === 2024 - 1865 + 1 && M.REAL.every((r, i) => r[0] === 1865 + i), 'last screen: every year 1865–2024, in order');

// ---- the obvious ways of playing ---------------------------------------------------------------------------
function play(paces, fits, cfg) {
  const saved = {}; if (cfg) for (const k in cfg) { saved[k] = C[k]; C[k] = cfg[k]; }
  const st = M.newGame(); let gi = 0;
  while (!M.playerTurnsOver(st)) {
    const off = M.engineOffer(st); if (off) M.decideEngine(st, fits(off));
    if (M.checkEvening(st)) break;
    M.burnGeneration(st, paces[Math.min(gi, paces.length - 1)]); gi++;
    if (M.checkEvening(st)) break;
  }
  M.runOut(st);
  const v = M.verdict(st);
  if (cfg) for (const k in saved) C[k] = saved[k];
  return { st, v };
}
const P = { cut: M.paceFromMult(0.5), stand: 0, slower: M.paceFromMult(1.5), now: C.JEVONS_RATE, faster: C.PACE_MAX };
const yes = () => true, no = () => false;

function discoveries(cfg, tag) {
  const order = ['cut', 'stand', 'slower', 'now', 'faster'];
  // (a) The trade-off: the faster the pace, the higher the noon and the less coal left in 2065.
  for (const f of [yes, no]) {
    const r = order.map(k => play([P[k]], f, cfg).v);
    const noonUp = r.every((v, i) => i === 0 || v.noonC >= r[i - 1].noonC - 1e-9);
    const burntUp = r.every((v, i) => i === 0 || v.shareBurnt > r[i - 1].shareBurnt);
    ok(noonUp && burntUp, `${tag}(a) engines ${f === yes ? 'fitted' : 'refused'}: noon ${r.map(v => 'x' + v.noonMult.toFixed(1)).join(' < ')}; ground gone by 2065 ${r.map(v => (100 * v.shareBurnt).toFixed(0) + '%').join(' < ')}`);
  }
  // (b) Brief or long: the fast fire is out (below 1865's) before 2065 with the ground nearly empty; the slow fire is
  // still burning in 2065 with most of the ground left.
  const fast = play([P.now], yes, cfg).v, slow = play([P.stand], no, cfg).v;
  ok(fast.fallFromNoon < 0.6 && fast.shareBurnt > 0.8, `${tag}(b) as now with engines: noon x${fast.noonMult.toFixed(1)}, by 2065 x${fast.fallFromNoon.toFixed(2)} of its noon${fast.outYear ? ', below 1865 from ' + fast.outYear : ''}, ${(100 * fast.shareBurnt).toFixed(0)}% of the ground gone`);
  ok(slow.shareBurnt < 0.3 && isFinite(slow.untilYear) && slow.untilYear > 2300, `${tag}(b) a stand: ${(100 * slow.shareBurnt).toFixed(0)}% gone by 2065, still burning x${slow.endMult.toFixed(2)}, coal to about ${slow.untilYear.toFixed(0)}`);
  ok(fast.evening && fast.endC < fast.noonC, `${tag}(b) as now with engines: the evening comes (${fast.eveningYear}) and the fire falls (x${fast.fallFromNoon.toFixed(2)} of its noon by 2065)`);
  // (c) Economy is not saving (ch. VII): fitting an engine raises the coal burnt, at every pace on the ruler.
  let allUp = true; const rows = [];
  for (const k of order) {
    for (const which of ['air', 'perfect']) {
      const a = play([P[k]], o => o.key === which, cfg).st, b = play([P[k]], no, cfg).st;
      const ga = a.gens.find(g => g.engine && g.engine.key === which), gb = b.gens.find(g => g.engine && g.engine.key === which);
      if (!ga || !gb) continue;
      const up = ga.burnt > gb.burnt; allUp = allUp && up; rows.push(`${k}/${which} ${(ga.burnt / gb.burnt).toFixed(2)}`);
    }
  }
  ok(allUp, `${tag}(c) fitting an engine burns more coal that generation than refusing it, at every pace (ratios ${rows.join(', ')})`);
  { const a = play([P.now], yes, cfg).st; ok(M.relCost(a) >= 1, `${tag}(c') engines fitted: British power still no cheaper than American (x${M.relCost(a).toFixed(2)})`); }
  // (d) The boulder: a stand after a rise sends more people over the sea than keeping on.
  const keep = play([P.now, P.now, P.now], yes, cfg).st, stop = play([P.now, P.now, P.stand], yes, cfg).st;
  const g3k = keep.gens[2].gone, g3s = stop.gens[2].gone;
  ok(g3s > g3k + 0.3, `${tag}(d) 1905–1925: a stand after two generations of rising sends ${g3s.toFixed(1)} million over the sea, keeping on ${g3k.toFixed(1)} million`);
  ok(slow.gone > 1, `${tag}(d) a stand from the start: ${slow.gone.toFixed(1)} million go over the sea, steadily`);
  // (e) The rivals pass whatever Britain does (preface: "ultimately passing it").
  const passes = order.map(k => play([P[k]], yes, cfg).v.americaPassed).concat(order.map(k => play([P[k]], no, cfg).v.americaPassed));
  ok(passes.every(y => y !== null && y <= C.RUN_TO), `${tag}(e) America passes Britain on every steady path: ${passes.join(', ')}`);
}

console.log('\n--- 2. The discoveries, at the game\'s parameters ---');
discoveries(null, '');

console.log('\n--- 3. Robustness: the same discoveries when the designer\'s choices change ---');
const ALT = [
  { ETA: 1.5 }, { ETA: 3.5 }, { REBOUND_EXP: 0.3 }, { REBOUND_EXP: 0.8 }, { PRICE_K: 0.6 }, { PRICE_K: 1.8 },
  { EMIGRATE_SHARE: 0.08 }, { EMIGRATE_SHARE: 0.3 }, { AMERICA_RATE: 0.05 }, { AMERICA_RATE: 0.07 }, { REFUSE_EXP: 0.1 },
  { REFUSE_EXP: 0.35 }, { POP_RATE: 0.009 }, { POP_RATE: 0.015 },
];
for (const a of ALT) discoveries(a, JSON.stringify(a) + ' ');

console.log('\n--- 4. The obvious ways of playing (build.md, section 3) ---');
const STRATS = [
  ['as now, fit both', [P.now], yes], ['as now, refuse both', [P.now], no], ['faster, fit both', [P.faster], yes],
  ['slower, fit both', [P.slower], yes], ['slower, refuse both', [P.slower], no], ['a stand, fit both', [P.stand], yes],
  ['a stand, refuse both', [P.stand], no], ['cut back, then a stand, refuse', [P.cut, P.stand], no],
  ['as now twice, then a stand, fit', [P.now, P.now, P.stand], yes], ['a stand three times, then as now, refuse', [P.stand, P.stand, P.stand, P.now], no],
  ['as now, fit the air-engine only', [P.now], o => o.key === 'air'], ['as now, fit the perfected one only', [P.now], o => o.key === 'perfect'],
  ['as now three times, then cut back, fit', [P.now, P.now, P.now, P.cut], yes],
];
console.log('strategy | shape | noon | noon, x 1865 | evening | out (below 1865 for good) | 2065, x 1865 | squares burnt of 167 | America passed | over the sea (M) | coal lasts at last pace');
for (const [name, paces, f] of STRATS) {
  const v = play(paces, f).v;
  console.log(`${name} | ${v.kind} | ${v.noonYear} | ${v.noonMult.toFixed(1)} | ${v.eveningYear || '-'} | ${v.outYear || '-'} | ${v.endMult.toFixed(2)} | ${v.squaresBurnt.toFixed(0)} | ${v.americaPassed} | ${v.gone.toFixed(1)} | ${isFinite(v.untilYear) ? Math.round(v.untilYear) : '-'}`);
}
console.log(`\n${n - fails} of ${n} checks pass.`);
process.exit(fails ? 1 : 0);
