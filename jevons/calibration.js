// Calibration check (build.md, section 2): the mechanism against the numbers in the preface, ch. I, ch. VII, ch. XVIII
// and the frontispiece; the central discoveries against changes to the designer's own choices; and the score's best
// path against a fresh search. Run: node calibration.js > calibration-result.txt   (exits non-zero on any failure)
const M = require('./mechanism.js');
const C = M.CONFIG;
const fs = require('fs');
let fails = 0, n = 0;
const ok = (cond, msg) => { n++; if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.abs(b);

console.log('--- 1. Numbers the text gives ---');
for (const [y, v] of C.JEVONS_CURVE) {
  const m = 83.6 * Math.pow(1 + C.JEVONS_RATE, y - 1861);
  ok(near(m, v, 0.012), `frontispiece ${y}: ${v} million tons; 3½ per cent from 83.6 gives ${m.toFixed(1)} (within 1.2%)`);
}
ok(C.C0 === 95, 'preface: 1865 production about 95 million tons');
{ const st = M.newGame(); const y = M.lastsUntil(st, C.JEVONS_RATE);
  ok(y - C.START_YEAR >= 100 && y - C.START_YEAR <= 115, `ch. I: at the same rate from 1865, Hull's ${C.RESERVE} million tons last ${y - C.START_YEAR} years, to ${y} ("rather more than a century")`); }
ok(near(M.multFromPace(C.JEVONS_RATE), 2, 0.01), `"as now" = 3½ per cent a year = x${M.multFromPace(C.JEVONS_RATE).toFixed(3)} in twenty years`);
{ const st = M.newGame();
  ok(!isFinite(M.lastsUntil(st, M.paceFromMult(0.5))), 'ruler: "cut back" kept up never uses the coal (a falling fire burns a finite amount)');
  ok(M.lastsUntil(st, 0) > 2700, `ruler: "a stand" kept up lasts to ${M.lastsUntil(st, 0)} (83,544 / 95 = 879 years)`);
  ok(M.lastsUntil(st, M.paceFromMult(1.5)) > 1990 && M.lastsUntil(st, M.paceFromMult(1.5)) < 2030, `ruler: "slower" kept up lasts to ${M.lastsUntil(st, M.paceFromMult(1.5))}`);
  ok(M.lastsUntil(st, C.PACE_MAX) < M.lastsUntil(st, C.JEVONS_RATE), `ruler: "faster" kept up lasts to ${M.lastsUntil(st, C.PACE_MAX)}, sooner than "as now"`); }
ok(C.LB_1865 === 4, 'ch. VII: a good engine of the present day burns about 4 lb per horse-power per hour');
ok(C.ENGINES[0].lbNew === C.LB_1865 / 2, 'ch. VII: the air-engine has worked at about one-half the expenditure');
ok(C.ENGINES[1].lbNew < C.LB_1865 / 3, 'ch. VII: the perfected air-engine at "less than one-third of the present consumption"');
{ const st = M.newGame(); M.burnGeneration(st, C.JEVONS_RATE);
  ok(M.priceOf(st.S) < 1.02, `ch. I: no rise of importance yet: after 1865–1885 as now, coal is x${M.priceOf(st.S).toFixed(3)} the 1865 price`); }
ok(M.priceOf(0.9 * C.RESERVE) > 3, `ch. I: with nine-tenths of the coal within 4,000 ft gone, coal is x${M.priceOf(0.9 * C.RESERVE).toFixed(1)} the 1865 price`);
ok(M.priceOf(0.995 * C.RESERVE) > 50, 'preface: "we cannot get to the bottom of them": the last of the coal is dearer than any trade will pay');
ok(M.squareTons() === 500 && M.groundSquares() === 167, `the sheet: one square = ${M.squareTons()} million tons; ${M.groundSquares()} squares hold Hull's ${C.RESERVE}`);
ok(C.START_YEAR + C.MAX_GENS * C.GEN_YEARS === C.RUN_TO, `the sheet: ten generations of twenty years from ${C.START_YEAR} reach ${C.RUN_TO}`);
// the production engine's anchors
ok(near(M.incomeOf(C.C0, C.LB_1865, C.POP0), 1, 1e-9) && near(M.incomePerHeadOf(C.C0, C.LB_1865, C.POP0), 1, 1e-9), 'engine: income and income per head are 1 in 1865');
ok(near(M.naturalPop(C.START_YEAR), C.POP0, 1e-9) && near(M.naturalPop(C.RUN_TO), C.POP0 * Math.pow(1 + C.POP_RATE, 200), 1e-9), `engine: heads at the census rate: ${C.POP0} million in 1865, ${M.naturalPop(C.RUN_TO).toFixed(0)} million in 2065`);
ok(near(M.daysOf(C.C0, C.LB_1865, C.POP0, 0), 365 * C.FUEL_SHARE_1865, 1e-9), `engine: fuel takes ${M.daysOf(C.C0, C.LB_1865, C.POP0, 0).toFixed(1)} days of a year's earnings in 1865 (a twentieth: our anchor)`);
ok(near(M.daysOf(C.C0, 2, C.POP0, 0) * Math.pow(2, C.ALPHA), M.daysOf(C.C0, 4, C.POP0, 0), 1e-9), `engine: an engine that doubles what a ton does cuts the days fuel takes from ${M.daysOf(C.C0, 4, C.POP0, 0).toFixed(1)} to ${M.daysOf(C.C0, 2, C.POP0, 0).toFixed(1)} (by 2^ALPHA: the extra income it brings)`);
ok(near(M.powerOf(100, 2), 200, 1e-9), 'engine: power = coal x what a ton does');
for (const e of C.ENGINES) ok(M.americaFitsIn(e) - e.year >= 20 && M.americaFitsIn(e) - e.year <= 35, `engine ${e.key}: appears ${e.year}, pays at the 1865 price from ${M.americaFitsIn(e)} (America fits it then)`);
const R = Object.fromEntries(M.REAL);
ok(R[1900] === 225.2 && near(R[1913], 287.4, 0.005) && near(R[1920], 229.5, 0.005) && near(R[1950], 216.3, 0.005),
  `last screen: UK production 1900 ${R[1900]}, 1913 ${R[1913]}, 1920 ${R[1920]}, 1950 ${R[1950]} (published 225.2, 287.4, 229.5, 216.3)`);
ok(Math.max(...M.REAL.map(r => r[1])) === R[1913], 'last screen: the real curve peaks in 1913');
ok(M.REAL.length === 2024 - 1865 + 1 && M.REAL.every((r, i) => r[0] === 1865 + i), 'last screen: every year 1865–2024, in order');

// ---- playing ----------------------------------------------------------------------------------------------
function play(mults, cfg) {
  const saved = {}; if (cfg) for (const k in cfg) { saved[k] = C[k]; C[k] = cfg[k]; }
  const st = M.playPath(mults);
  const v = M.verdict(st);
  if (cfg) for (const k in saved) C[k] = saved[k];
  return { st, v };
}
const order = ['cut', 'stand', 'slower', 'now', 'faster'], MULT = { cut: 0.5, stand: 1, slower: 1.5, now: 2, faster: 2.4 };
const NO_ENGINES = { ENGINES: [] };

function discoveries(cfg, tag) {
  const r = order.map(k => play([MULT[k]], cfg).v);
  // (a) The trade-off: the faster the pace, the higher the noon and the less coal left in 2065.
  const noonUp = r.slice(0, 4).every((v, i) => i === 0 || v.noonC >= r[i - 1].noonC - 1e-9) && r[4].noonC >= 0.85 * r[3].noonC;
  const burntUp = r.every((v, i) => i === 0 || v.shareBurnt > r[i - 1].shareBurnt - 1e-9);
  ok(noonUp && burntUp, `${tag}(a) noon ${r.map(v => 'x' + v.noonMult.toFixed(1)).join(' < ')} (faster at least 0.85 of as now: dear coal bites sooner); ground gone by 2065 ${r.map(v => (100 * v.shareBurnt).toFixed(0) + '%').join(' < ')}`);
  ok(r.every(v => v.squaresBurnt <= v.ledger.total + 1e-6), `${tag}(a') no path burns more than the ground holds (${r.map(v => v.squaresBurnt.toFixed(1)).join(', ')} of ${r[0].ledger.total.toFixed(1)})`);
  // (b) Brief or long.
  const fast = r[3], slow = r[1];
  ok(fast.fallFromNoon < 0.5 && fast.shareBurnt > 0.8, `${tag}(b) as now: noon x${fast.noonMult.toFixed(1)}, by 2065 x${fast.fallFromNoon.toFixed(2)} of its noon, ${(100 * fast.shareBurnt).toFixed(0)}% of the ground gone`);
  ok(slow.shareBurnt < 0.4 && isFinite(slow.untilYear) && slow.untilYear > 2300, `${tag}(b) a stand: ${(100 * slow.shareBurnt).toFixed(0)}% gone by 2065, still burning x${slow.endMult.toFixed(2)}, coal to about ${slow.untilYear.toFixed(0)}`);
  // (c) Economy is not saving (ch. VII).
  const none = order.map(k => play([MULT[k]], Object.assign({}, cfg || {}, NO_ENGINES)).v);
  ok(order.every((k, i) => r[i].squaresBurnt >= none[i].squaresBurnt - 1e-6), `${tag}(c) with the engines, coal burnt by 2065 at each pace: ${r.map((v, i) => `${v.squaresBurnt.toFixed(0)} vs ${none[i].squaresBurnt.toFixed(0)} without`).join('; ')}`);
  ok(r.every(v => v.relCost >= 1 - 1e-9), `${tag}(c') British power is never cheaper than American in 2065 (x${r.map(v => v.relCost.toFixed(2)).join(', ')})`);
  // (d) The boulder.
  const keep = play([2, 2, 2], cfg).st, stop = play([2, 2, 1], cfg).st;
  ok(stop.gens[2].gone > keep.gens[2].gone + 0.3, `${tag}(d) 1905–1925: a stand after two generations of rising sends ${stop.gens[2].gone.toFixed(1)} million over the sea, keeping on ${keep.gens[2].gone.toFixed(1)} million`);
  ok(slow.gone > 1, `${tag}(d) a stand from the start: ${slow.gone.toFixed(1)} million go over the sea`);
  // (e) The rivals pass whatever Britain does.
  ok(r.every(v => v.americaPassed !== null && v.americaPassed <= C.RUN_TO), `${tag}(e) America passes Britain on every steady path: ${r.map(v => v.americaPassed).join(', ')}`);
  // (f) The engines are fitted when they pay.
  if (!cfg || !cfg.ENGINES) {
    const eA = fast.engines.air, eP = fast.engines.perfect, sP = slow.engines.perfect;
    ok(eA && eA.america === M.americaFitsIn(C.ENGINES[0]) && eP && eP.america === M.americaFitsIn(C.ENGINES[1]), `${tag}(f) America fits the air-engine in ${eA && eA.america}, the perfected one in ${eP && eP.america}`);
    ok(eA && eA.britain <= eA.america && eP && eP.britain <= eP.america, `${tag}(f) Britain fits each engine no later than America (as now: ${eA && eA.britain}, ${eP && eP.britain})`);
    ok(eP && sP && eP.britain < sP.britain, `${tag}(f) the fast burner, with dearer coal, fits the perfected engine earlier (${eP && eP.britain}) than the stand (${sP && sP.britain})`);
  }
  // (g) The ledger.
  for (const v of [fast, slow]) ok(near(v.ledger.gens.reduce((a, g) => a + g.squares, 0) + v.ledger.left, v.ledger.total, 1e-6), `${tag}(g) ledger sums to the ground: ${v.ledger.gens.map(g => g.squares.toFixed(0)).join('+')} + ${v.ledger.left.toFixed(0)} left = ${v.ledger.total.toFixed(1)}`);
  ok(fast.bestGen.perHead > 2 * slow.bestGen.perHead, `${tag}(g) best-off generation per head: as now x${fast.bestGen.perHead.toFixed(1)} (${fast.bestGen.from}), a stand x${slow.bestGen.perHead.toFixed(1)} (${slow.bestGen.from})`);
  ok(slow.ledger.left > 3 * fast.ledger.left + 20, `${tag}(g) left for after 2065: a stand ${slow.ledger.left.toFixed(0)} squares, as now ${fast.ledger.left.toFixed(0)}`);
  ok(fast.lastGen.perHead < fast.bestGen.perHead / 3, `${tag}(g) as now: the last generation (x${fast.lastGen.perHead.toFixed(2)}) is far worse off than the best (x${fast.bestGen.perHead.toFixed(1)})`);
  ok(fast.lastGen.days > 2 * 365 * C.FUEL_SHARE_1865, `${tag}(g) as now: fuel takes ${isFinite(fast.lastGen.days) ? fast.lastGen.days.toFixed(0) + ' days' : 'more than the whole'} of the last generation's year (18 in 1865)`);
  ok(slow.ledger.after.perHead > 3 * fast.ledger.after.perHead, `${tag}(g) the box after: a stand leaves the next ten generations x${slow.ledger.after.perHead.toFixed(2)} per head, as now x${fast.ledger.after.perHead.toFixed(2)}`);
  // (h) The score orders the steady paths: slower above as now above a stand above faster, and none above 100.
  const sc = order.map(k => M.scoreOf(play([MULT[k]], cfg).st, null).typical);
  ok(sc[2] > sc[3] && sc[2] > sc[1] && sc[1] > sc[0], `${tag}(h) typical generation: ${order.map((k, i) => `${k} x${sc[i].toFixed(2)}`).join(', ')} (the interior beats both corners: slower > as now and slower > a stand; a stand > cut back)`);
}

console.log('\n--- 2. The discoveries, at the game\'s parameters ---');
discoveries(null, '');

console.log('\n--- 3. Robustness: the same discoveries when the designer\'s choices change ---');
const ALT = [
  { ETA: 1.5 }, { ETA: 3.5 }, { REBOUND_EXP: 0.3 }, { REBOUND_EXP: 0.8 }, { PRICE_K: 0.6 }, { PRICE_K: 1.8 },
  { EMIGRATE_SHARE: 0.08 }, { EMIGRATE_SHARE: 0.3 }, { AMERICA_RATE: 0.05 }, { AMERICA_RATE: 0.07 },
  { POP_RATE: 0.009 }, { POP_RATE: 0.015 }, { POP_ELAST: 0.5 }, { POP_ELAST: 2 }, { ALPHA: 0.5 }, { ALPHA: 0.9 },
  { ADJUST: 0.05 }, { ADJUST: 0.2 }, { FUEL_SHARE_1865: 0.03 }, { FUEL_SHARE_1865: 0.08 }, { AFTER_YEARS: 100 }, { AFTER_YEARS: 400 },
];
for (const a of ALT) discoveries(a, JSON.stringify(a) + ' ');

console.log('\n--- 4. The score\'s best path, against a fresh search ---');
const opt = JSON.parse(fs.readFileSync(__dirname + '/optimum.json', 'utf8'));
const fresh = require('./optimum.js').search();
ok(near(fresh.typical, opt.typical, 0.005), `optimum.json: typical x${opt.typical.toFixed(3)} on ${opt.path.join(' ')}; a fresh search gives x${fresh.typical.toFixed(3)} on ${fresh.path.join(' ')} (within 0.5%; if not, run node optimum.js and rebuild)`);
ok(opt.path.some(m => m < 2) && opt.path.some(m => m >= 2), `the best path is interior: it neither burns at the top all the way nor holds all the way (${opt.path.join(' ')})`);
ok(M.scoreOf(M.playPath(opt.path), opt.typical).score > 99.9, 'the best path scores 100');
{ const st = M.playPath(opt.path), L = M.ledger(st); ok(L.left > 5, `the best path leaves ${L.left.toFixed(0)} squares for after 2065 (the box after counts)`); }

console.log('\n--- 5. The obvious ways of playing (build.md, section 3) ---');
const STRATS = [
  ['as now', [2]], ['faster', [2.4]], ['slower', [1.5]], ['a stand', [1]], ['cut back, then a stand', [0.5, 1]],
  ['as now twice, then a stand', [2, 2, 1]], ['a stand three times, then as now', [1, 1, 1, 2]],
  ['as now three times, then cut back', [2, 2, 2, 0.5]], ['slower, then as now from 1925', [1.5, 1.5, 1.5, 2]],
  ['as now twice, then slower', [2, 2, 1.5]], ['the best path found', opt.path],
];
console.log('strategy | score | typical | shape | noon | noon, x 1865 | evening | 2065, x 1865 | squares burnt of 167 | left | America passed | over the sea (M) | engines B/A | best gen per head | last gen per head | after per head');
for (const [name, paces] of STRATS) {
  const { st, v } = play(paces), e = v.engines, sc = M.scoreOf(st, opt.typical);
  console.log(`${name} | ${sc.score.toFixed(0)} | x${sc.typical.toFixed(2)} | ${v.kind} | ${v.noonYear} | ${v.noonMult.toFixed(1)} | ${v.eveningYear || '-'} | ${v.endMult.toFixed(2)} | ${v.squaresBurnt.toFixed(0)} | ${v.ledger.left.toFixed(0)} | ${v.americaPassed} | ${v.gone.toFixed(0)} | air ${e.air.britain}/${e.air.america}, perfected ${e.perfect.britain}/${e.perfect.america} | x${v.bestGen.perHead.toFixed(1)} (${v.bestGen.from}) | x${v.lastGen.perHead.toFixed(2)} | x${v.ledger.after.perHead.toFixed(2)}`);
}
console.log('\nledgers (income per head, x 1865, per generation from 1865; then after):');
for (const [name, paces] of STRATS) { const v = play(paces).v; console.log(`  ${name}: ${v.ledger.gens.map(g => g.perHead.toFixed(1)).join(' ')} | after ${v.ledger.after.perHead.toFixed(2)} (${v.ledger.left.toFixed(0)} sq)`); }
console.log(`\n${n - fails} of ${n} checks pass.`);
process.exit(fails ? 1 : 0);
