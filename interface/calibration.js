// Calibration check for Who Started It? Run: node calibration.js  (writes calibration-result.txt)
// A. the draw's shape over many seeds; B. the paper's counts reproduced by a "historical" player who behaves as the paper's
// actors do; C. playing it in numbers: the obvious strategies; D. robustness of the discovery to the designer's choices;
// E. the rules themselves (invariants and boundary actions).
const M = require('./mechanism.js'); const C = M.CONFIG; const fs = require('fs');
const OUT = []; const say = s => { OUT.push(s); console.log(s); };
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; say(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const pct = x => (100 * x).toFixed(1) + ' %';
const SEEDS = Array.from({ length: 2000 }, (_, i) => i + 1);

// ---- strategies: a function (view, game) → pages to offer now. view.round, view.origin ('accident'|'messy'|'purpose'),
// view.crowd (null|'you'|'them'), view.given, view.pages. Oracle strategies may peek at the hidden kind.
const kindOf = g => g.c.card.kind;
const S = {
  'hold everything': () => 0,
  'one page each, then hold': v => (v.round === 1 ? 1 : 0),
  'meet halfway (2), then hold': v => (v.round === 1 ? 2 : 0),
  'generous: 2, then 2 more': () => 2,
  'blind top-up: 1, then 3 more': v => (v.round === 1 ? 1 : 3),
  // the reading strategies have learnt the prices (from the ghost line after each clash), so they use the current CONFIG
  'gambler: pay 2 at once to every clash on purpose': v => (v.round === 1 ? (v.origin === 'purpose' ? C.PRICE.popular : C.PRICE[v.origin])
    : (v.origin === 'messy' || v.origin === 'accident' ? Math.max(0, C.PRICE[v.origin] - v.given) : 0)),
  'reader: accidents at once; on purpose, wait for the crowd': v => (v.round === 1 ? (v.origin === 'purpose' ? 0 : C.PRICE[v.origin])
    : (v.crowd === 'them' ? Math.max(0, C.PRICE.popular - v.given) : v.origin === 'purpose' ? 0 : Math.max(0, C.PRICE[v.origin] - v.given))),
  'oracle (knows every kind)': (v, g) => { const k = kindOf(g); return v.round === 1 ? (k === 'hostile' ? 0 : C.PRICE[k]) : 0; },
};
// the "historical" player: the paper's actors. Accidents are met at once (they compromise); a challenged body holds against a
// clash started on purpose ("non-cooperative, at least initially"), then accommodates if the challenger's cause wins the
// public (IEA after IRENA), and keeps holding otherwise (UNRWA). This is the reader.
const HIST = S['reader: accidents at once; on purpose, wait for the crowd'];

function play(seed, strat) {
  const g = M.newGame(seed);
  while (!g.over) {
    let v = M.current(g); let r = M.offer(g, Math.min(strat(v, g), v.maxOffer));
    if (!r.final) { v = M.current(g); r = M.offer(g, Math.min(strat(v, g), v.maxOffer)); }
    M.next(g);
  }
  return g;
}

// ===== A. the draw
say('A. THE DRAW (2000 seeds)');
{
  let okComp = true, okFirst = true, okThen = true, okDup = true, okU = true, okRepro = true;
  const posKinds = Array.from({ length: 9 }, () => ({}));
  for (const s of SEEDS) {
    const d = M.deal(s); const cnt = {};
    d.forEach((c, i) => { cnt[c.kind] = (cnt[c.kind] || 0) + 1; posKinds[i][c.kind] = (posKinds[i][c.kind] || 0) + 1; if (!(c.u >= 0 && c.u < 1)) okU = false; });
    for (const k of Object.keys(C.DECK)) if (cnt[k] !== C.DECK[k]) okComp = false;
    if (d.length !== C.CLASHES) okComp = false;
    if (d[0].kind !== 'accident') okFirst = false;
    if (![d[1].kind, d[2].kind].sort().join() !== 'hostile,popular' && [d[1].kind, d[2].kind].sort().join() !== 'hostile,popular') okThen = false;
    if (new Set(d.map(c => c.id)).size !== d.length) okDup = false;
    if (JSON.stringify(M.deal(s)) !== JSON.stringify(d)) okRepro = false;
  }
  check('every deck: nine clashes, 3 accidents + 1 messy + 3 popular + 2 hostile (35 : 26 : 16 → 4 : 3 : 2)', okComp);
  check('clash 1 is always a plain accident', okFirst);
  check('clashes 2 and 3 are always one popular and one hostile', okThen);
  check('no clash twice in a deck', okDup);
  check('the same deck number deals the same deck', okRepro);
  check('years-later draws lie in [0, 1)', okU);
  const firstFray = SEEDS.filter(s => M.deal(s)[0].u >= C.KNIT.dealAccident).length;
  check('clash 1, if settled, knits (a floor; swapped with another accident\'s draw, so the deck\'s frays are unchanged)', firstFray / SEEDS.length < 0.01, `clash 1 would fray in ${firstFray} of ${SEEDS.length} decks (every accident in the deck would)`);
  const p2pop = posKinds[1].popular / SEEDS.length;
  check('which of the two comes first is a coin toss', near(p2pop, 0.5, 0.04), `popular at clash 2 in ${pct(p2pop)}`);
  const distinct = new Set(SEEDS.map(s => M.deal(s).map(c => c.id).join())).size;
  check('decks vary', distinct > 1500, `${distinct} distinct orders in 2000 seeds`);
  // the knit draw is uniform enough per position
  const us = []; SEEDS.forEach(s => M.deal(s).forEach(c => us.push(c.u)));
  const below = us.filter(u => u < 0.76).length / us.length;
  check('years-later draws are uniform', near(below, 0.76, 0.01), `P(u < 0.76) = ${pct(below)}`);
}

// ===== B. the paper's counts reproduced by the historical player
say('\nB. THE PAPER, REPRODUCED BY THE HISTORICAL PLAYER (2000 seeds × 9 clashes)');
{
  const recs = []; let spent = new Set(), allSeven = true;
  for (const s of SEEDS) { const g = play(s, HIST); recs.push(...g.done); spent.add(C.PAGES - g.pages); if (g.done.filter(d => d.settled).length !== 7) allSeven = false; }
  const f = (pred, of) => recs.filter(d => of(d) && pred(d)).length / recs.filter(of).length;
  const benign = d => d.kind === 'accident' || d.kind === 'messy', inst = d => d.kind === 'popular' || d.kind === 'hostile';
  const P = C.PAPER;
  const intentional = recs.filter(inst).length / recs.length;
  check('origin: share started on purpose', near(intentional, P.intentional / P.N, 0.02), `game ${pct(intentional)}, paper ${pct(P.intentional / P.N)} (42 of 77)`);
  const coop = recs.filter(d => d.settled).length / recs.length;
  check('management: share settled cooperatively', near(coop, P.coop / P.N, 0.02), `game ${pct(coop)}, paper ${pct(P.coop / P.N)} (59 of 77)`);
  const integ = recs.filter(d => d.later === 'knit' || d.later === 'mended').length / recs.length;
  check('order effect: share integrative', near(integ, P.integ / P.integN, 0.02), `game ${pct(integ)}, paper ${pct(P.integ / P.integN)} (46 of 76)`);
  const cB = f(d => d.settled, benign);
  check('benign cluster: accidents settled cooperatively (declared: the 2 of 35 idiosyncratic stand-offs are dropped)', cB >= P.benign.coop / P.benign.n, `game ${pct(cB)}, paper ${pct(P.benign.coop / P.benign.n)} (33 of 35)`);
  const iBc = f(d => d.later === 'knit', d => benign(d) && d.settled), iB = f(d => d.later === 'knit' || d.later === 'mended', benign);
  check('benign cluster: integrative when settled', near(iBc, P.benign.integ / P.benign.coop, 0.02), `game ${pct(iBc)}, paper ${pct(P.benign.integ / P.benign.coop)} (25 of 33 cooperative)`);
  check('benign cluster: integrative overall (higher by the dropped stand-offs, declared)', near(iB, P.benign.integ / P.benign.integN, 0.04), `game ${pct(iB)}, paper ${pct(P.benign.integ / P.benign.integN)} (25 of 34)`);
  const cI = f(d => d.settled, inst);
  check('instrumental clashes settled in the end (hybrid share of the 42)', near(cI, P.hybrid.n / P.intentional, 0.03), `game ${pct(cI)}, paper ${pct(P.hybrid.n / P.intentional)} (26 of 42)`);
  const iH = f(d => d.later === 'knit', d => d.kind === 'popular');
  check('hybrid cluster: integrative', near(iH, P.hybrid.integ / P.hybrid.n, 0.02), `game ${pct(iH)}, paper ${pct(P.hybrid.integ / P.hybrid.n)} (20 of 26)`);
  const cM = f(d => d.settled, d => d.kind === 'hostile');
  check('malign cluster: none settled', cM === 0, `game ${pct(cM)}, paper 0 of 16`);
  const iM = f(d => d.later === 'mended', d => d.kind === 'hostile');
  check('malign cluster: integrative anyway', near(iM, P.malign.integ / P.malign.n, 0.02), `game ${pct(iM)}, paper ${pct(P.malign.integ / P.malign.n)} (1 of 16)`);
  const fB = f(d => d.later === 'frayed', d => benign(d) && d.settled);
  check('cooperative but fragmenting, benign (note 10)', near(fB, P.coopFrag.benign / P.benign.coop, 0.02), `game ${pct(fB)}, paper ${pct(P.coopFrag.benign / P.benign.coop)} (8 of 33)`);
  const fH = f(d => d.later === 'frayed', d => d.kind === 'popular');
  check('cooperative but fragmenting, hybrid (note 10)', near(fH, P.coopFrag.hybrid / P.hybrid.n, 0.02), `game ${pct(fH)}, paper ${pct(P.coopFrag.hybrid / P.hybrid.n)} (6 of 26)`);
  check('the historical player settles every settleable clash in every deck, and spends exactly the purse', allSeven && spent.size === 1 && spent.has(C.PAGES), `spent: ${[...spent].join(', ')} of ${C.PAGES}`);
  const mgmt = f(d => d.offers[0] === 0, inst);
  check('historical player holds first in every clash started on purpose ("at least initially", p. 616)', mgmt === 1);
}

// ===== C. playing it in numbers
say('\nC. PLAYING IT IN NUMBERS (2000 seeds; settled of 9, of which 7 can be settled; pages left of ' + C.PAGES + ')');
const table = (cfgPatch, label) => {
  const saved = JSON.parse(JSON.stringify({ PRICE: C.PRICE, PAGES: C.PAGES, CROWD_TAKES_FIRST: C.CROWD_TAKES_FIRST, CROWD_TAKES_END: C.CROWD_TAKES_END, CROWD_NOISE: C.CROWD_NOISE }, (k, v) => (v === Infinity ? 'INF' : v)));
  const { PRICE: pp, ...rest } = cfgPatch; Object.assign(C, rest); if (pp) C.PRICE = Object.assign({}, C.PRICE, pp);
  const rows = {};
  for (const [name, st] of Object.entries(S)) {
    let set = 0, left = 0; const dist = {}; let accS = 0, popS = 0, hosG = 0;
    for (const s of SEEDS) {
      const g = play(s, st); const n = g.done.filter(d => d.settled).length; set += n; left += g.pages; dist[n] = (dist[n] || 0) + 1;
      accS += g.done.filter(d => (d.kind === 'accident' || d.kind === 'messy') && d.settled).length; popS += g.done.filter(d => d.kind === 'popular' && d.settled).length;
      hosG += g.done.filter(d => d.kind === 'hostile').reduce((a, d) => a + d.given, 0);
    }
    rows[name] = { mean: set / SEEDS.length, left: left / SEEDS.length, dist, acc: accS / SEEDS.length, pop: popS / SEEDS.length, hosG: hosG / SEEDS.length };
  }
  // restore
  C.PRICE = Object.fromEntries(Object.entries(saved.PRICE).map(([k, v]) => [k, v === 'INF' ? Infinity : v]));
  for (const k of ['PAGES', 'CROWD_TAKES_FIRST', 'CROWD_TAKES_END', 'CROWD_NOISE']) C[k] = saved[k];
  if (label === null) return rows;
  if (label) say(label);
  for (const [name, r] of Object.entries(rows)) say(`  ${name.padEnd(58)} settled ${r.mean.toFixed(2)}  (accidents ${r.acc.toFixed(1)}/4, popular ${r.pop.toFixed(1)}/3)  pages left ${r.left.toFixed(1)}  pages lost to the hostile ${r.hosG.toFixed(1)}`);
  return rows;
};
const base = table({});
{
  const blind = ['hold everything', 'one page each, then hold', 'meet halfway (2), then hold', 'generous: 2, then 2 more', 'blind top-up: 1, then 3 more'];
  const bestBlind = Math.max(...blind.map(n => base[n].mean));
  const reader = base['reader: accidents at once; on purpose, wait for the crowd'].mean;
  check('the spread is wide: hold-everything settles nothing, the reader settles all seven', base['hold everything'].mean === 0 && reader === 7);
  check('reading how a clash began beats every strategy blind to it', reader > bestBlind + 1, `reader ${reader.toFixed(2)}, best blind ${bestBlind.toFixed(2)}`);
  const gam = base['gambler: pay 2 at once to every clash on purpose'].mean;
  check('paying at once for every clash on purpose is close behind, not ahead (pages go to the hostile)', gam < reader && gam > reader - 1, `gambler ${gam.toFixed(2)}`);
}

// ===== D. robustness: does the central discovery survive the designer's choices?
say('\nD. ROBUSTNESS. The discovery: accidents settle cheaply; clashes started on purpose settle only where the crowd backs the\n   challenger; a player who reads how a clash began settles more than any player blind to it. Re-run under other choices.');
const variants = [
  [{ PRICE: { popular: 3 } }, 'popular challengers ask 3 pages'],
  [{ PRICE: { accident: 2, messy: 3 } }, 'accidents ask 2 (messy 3)'],
  [{ CROWD_TAKES_FIRST: 0, CROWD_TAKES_END: 0 }, 'the crowd takes nothing'],
  [{ CROWD_TAKES_FIRST: 2, CROWD_TAKES_END: 3 }, 'the crowd takes 2, then 3'],
  [{ PAGES: 11 }, 'a purse of 11'],
  [{ PAGES: 18 }, 'a purse of 18'],
  [{ CROWD_NOISE: 0.2 }, 'the crowd sides the wrong way one time in five'],
];
for (const [patch, label] of variants) {
  const rows = table(patch, `  — ${label}:`);
  const blind = ['hold everything', 'one page each, then hold', 'meet halfway (2), then hold', 'generous: 2, then 2 more', 'blind top-up: 1, then 3 more'];
  const bestBlind = Math.max(...blind.map(n => rows[n].mean)); const reader = rows['reader: accidents at once; on purpose, wait for the crowd'].mean;
  const bestReading = Math.max(reader, rows['gambler: pay 2 at once to every clash on purpose'].mean);
  const lostR = rows['reader: accidents at once; on purpose, wait for the crowd'].hosG, lostB = Math.min(...blind.filter(n => n !== 'hold everything').map(n => rows[n].hosG));
  check(`  robust (${label}): reading the origin settles at least as many as any blind strategy, and loses fewer pages to clashes nobody can settle`,
    bestReading >= bestBlind - 1e-9 && lostR < lostB, `best reading ${bestReading.toFixed(2)}, best blind ${bestBlind.toFixed(2)}; pages lost to the hostile: reader ${lostR.toFixed(1)}, best blind ${lostB.toFixed(1)}`);
  const rich = table(Object.assign({}, patch, { PAGES: 99 }), null)['oracle (knows every kind)'];   // pages no object: who CAN settle?
  check(`  robust (${label}): with pages no object, every accident and every popular challenger can be settled, and no hostile one`,
    rich.acc === 4 && rich.pop === 3 && rich.mean === 7);
}

// ===== E. the rules
say('\nE. THE RULES (invariants, boundary actions)');
{
  let neg = false, cap = true, hostileSettled = false, crowdOnlyAfter1 = true, priceOk = true, digIn = true;
  for (const s of SEEDS.slice(0, 400)) {
    for (const st of Object.values(S)) {
      const g = M.newGame(s);
      while (!g.over) {
        let v = M.current(g); const want = st(v, g) + 3;              // ask for too much on purpose: the offer must be capped
        let r = M.offer(g, want); if (r.n > Math.min(C.MAX_OFFER, v.pages)) cap = false;
        if (r.round === 1 && r.n === 0 && (g.c.card.kind === 'accident' || g.c.card.kind === 'messy') && !r.settled && g.c.price !== C.PRICE[g.c.card.kind] + C.DIG_IN) digIn = false;
        if (!r.final) { v = M.current(g); if (!v.crowd && C.CROWD[g.c.card.kind]) crowdOnlyAfter1 = false; r = M.offer(g, st(v, g)); }
        if (g.pages < 0) neg = true;
        const d = g.done[g.done.length - 1]; if (d.kind === 'hostile' && d.settled) hostileSettled = true;
        if (d.settled !== (d.given >= d.priceEnd)) priceOk = false;
        M.next(g);
      }
    }
  }
  check('pages never go below zero', !neg); check('an offer never exceeds 4 pages or the pages left', cap);
  check('a clash started to pull a body down never settles, whatever is offered', !hostileSettled);
  check('a clash settles exactly when the pages given reach its price', priceOk);
  check('the crowd gathers after a first offer that does not settle, and only for clashes started on purpose', crowdOnlyAfter1);
  check('an accident met with nothing digs in (its price rises by one)', digIn);
  // the first offer of every clash starts at 0 on screen: the mechanism carries nothing over (the UI is checked in the browser)
  const g = M.newGame(1); const r1 = M.offer(g, 1); check('clash 1 (an accident) settles for one page', r1.settled && r1.theyGive && r1.final);
  // a fixed small story: seed 1
  const g2 = M.newGame(1); say('  deck 1: ' + g2.deck.map(c => `${c.id}(${c.kind})`).join(', '));
}

say(`\n${pass} passed, ${fail} failed.`);
fs.writeFileSync(__dirname + '/calibration-result.txt', OUT.join('\n') + '\n');
process.exit(fail ? 1 : 0);
