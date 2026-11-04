// Calibration check (build step 1): runs against mechanism.js, the file build.py inlines into the game.
// Run: node calibration.js  > calibration-result.txt
const M = require('./mechanism.js');
const C = M.CONFIG;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; };
const f = (x, d = 2) => x.toFixed(d);
const P = s => M.parseJudges(s, 'x');

console.log('== 1. The paper\'s estimates are carried exactly');
ok(C.bonus.both === 0.164 && C.bonus.citz === 0.075 && C.bonus.country === 0.056, 'bonuses = Supp. Table 2 col 1 (0.164 / 0.075 / 0.056)');
ok(C.bonus.gender === 0.024, 'gender bonus = Supp. Table 1 col 1 (0.024)');
ok(Math.abs(M.starWeight('citz') - 0.457) < 0.001 && Math.abs(M.starWeight('country') - 0.341) < 0.001,
  `star weights: citizenship only ${f(M.starWeight('citz'), 3)} ("about half"), country only ${f(M.starWeight('country'), 3)} ("about a third")`);
ok(Math.abs(C.bonus.gender / C.bonus.both - 1 / 7) < 0.01, `gender / both = ${f(C.bonus.gender / C.bonus.both, 3)} ("about a seventh")`);
const single = (C.bonus.citz + C.bonus.country) / 2 / C.bonus.gender;
ok(single >= 2 && single <= 3.2, `single country or citizenship match vs gender: ${f(single)}x (paper p. 7: "on average 2 to 3 times larger")`);

console.log('\n== 2. Applicant population and the ERC-like panel against Table 2');
const tot = M.APPLICANTS.reduce((a, b) => a + b.s, 0);
const big = M.APPLICANTS.filter(a => M.isBig(a.w)).reduce((a, b) => a + b.s, 0) / tot;
ok(Math.abs(tot - 100) < 1e-9, `applicant weights sum to ${f(tot, 1)}`);
ok(Math.abs(big - C.table2.bigShare) < 0.002, `big-five share ${f(100 * big, 1)}% (Table 2 N: ${f(100 * C.table2.bigShare, 1)}%)`);
const mobile = M.APPLICANTS.filter(a => a.p !== a.w).reduce((a, b) => a + b.s, 0) / tot;
console.log(`     (constructed: ${f(100 * mobile, 1)}% of applicants work outside their passport country, incl. XX passports)`);
const erc = M.evaluate(P(C.ercPanel));
for (const g of ['big', 'other']) for (const t of ['both', 'country', 'citz']) {
  const d = erc[g][t] - C.table2[g][t];
  ok(Math.abs(d) <= 1.2, `ERC-like panel, ${g}, ${t}: ${f(erc[g][t], 1)}% (Table 2: ${C.table2[g][t]}%, tolerance ±1.2 p.p.)`);
}
const t2 = M.table2Stars();
console.log(`     Table 2 implies home stars per 10 juries: big five ${f(t2.big)}, everyone else ${f(t2.other)}, ratio ${f(t2.ratio)}`);
ok(Math.abs(erc.big.stars - t2.big) <= 0.4 && Math.abs(erc.other.stars - t2.other) <= 0.4,
  `ERC-like panel stars: big ${f(erc.big.stars)}, other ${f(erc.other.stars)} (Table 2: ${f(t2.big)}, ${f(t2.other)}; ±0.4)`);
ok(erc.ratio >= 1.8 && erc.ratio <= 3.4, `ERC-like panel ratio ${f(erc.ratio)} (Table 2: ${f(t2.ratio)}; accepted 1.8–3.4)`);
ok(!erc.level, 'the ERC-like panel starts NOT level');
console.log(`     expected bonus per mark: big five +${f(erc.big.bonusPts, 4)}, other +${f(erc.other.bonusPts, 4)} points ` +
  `(Table 2 shares × Supp. Table 2: +${f((4.6 * .164 + 4.5 * .056 + 3.8 * .075) / 100, 4)}, +${f((1.5 * .164 + 1.8 * .056 + 2.6 * .075) / 100, 4)})`);

console.log('\n== 3. The paper\'s own Table 2 arithmetic, quoted in the verdict (correlational)');
const edge = s => (C.ape.citz * s.citz + C.ape.country * s.country + C.ape.both * s.both) / 100;
const eb = edge(C.table2.big), eo = edge(C.table2.other);
ok(Math.abs(eb - C.fundingEdge.big) < 0.1 && Math.abs(eo - C.fundingEdge.other) < 0.1,
  `APE × share: big five ${f(eb)} p.p. (paper 1.7), other ${f(eo)} p.p. (paper 0.8)`);

console.log('\n== 4. Random assignment simulated (4 or 5 judges, mean 4.2) matches the analytic expectation');
for (const seed of [1, 2, 3]) {
  const s = M.simulate(P(C.ercPanel), 200000, seed);
  ok(Math.abs(s.big - erc.big.stars) / erc.big.stars < 0.03 && Math.abs(s.other - erc.other.stars) / erc.other.stars < 0.05,
    `seed ${seed}: simulated big ${f(s.big)}, other ${f(s.other)} vs analytic ${f(erc.big.stars)}, ${f(erc.other.stars)}`);
}

console.log('\n== 5. Game balance');
// Round 1: a panel that mirrors who applies, and a deliberately diverse one
const mirror = P('DE/DE DE/DE UK/UK UK/UK FR/FR IT/IT ES/ES IT/UK DE/CH NL/NL PL/PL SE/SE IL/IL PT/PT GR/GR');
const diverse = P('DE/DE UK/UK IT/UK DE/CH NL/UK GR/UK PL/DE ES/NL NL/NL PL/PL SE/SE PT/PT GR/GR IL/IL AT/AT');
const em = M.evaluate(mirror), ed = M.evaluate(diverse);
ok(em.ratio > 2.3, `round 1 mirror panel: big ${f(em.big.stars)}, other ${f(em.other.stars)}, ratio ${f(em.ratio)} (leans at least like the ERC)`);
ok(ed.ratio < em.ratio, `round 1 diverse panel: big ${f(ed.big.stars)}, other ${f(ed.other.stars)}, ratio ${f(ed.ratio)} (leans less)`);
const pool = M.parseJudges(C.pool, 'p');
const bigHome = pool.filter(j => j.p === j.w && M.isBig(j.w)).length;
ok(pool.length === 24 && bigHome === 11, `pool: ${pool.length} judges, ${bigHome} big-five home judges, so at least ${bigHome - 9} must be seated`);
// Round 2: exhaustive for 1–2 swaps, enumerated "thoughtful" plans and random plans for the full budget
const T = P(C.ercPanel), B = P(C.bench), K = C.swaps;
const comb = (a, k) => k === 0 ? [[]] : a.flatMap((x, i) => comb(a.slice(i + 1), k - 1).map(c => [x].concat(c)));
const apply = (t0, outs, ins, b0) => { const t = t0.slice(); outs.forEach((i, k) => { t[i] = b0[ins[k]]; }); return t; };
function exhaustive(k, o) {
  let n = 0, lv = 0; const tol = o.tol; const rec = (table, bench, d) => {
    if (d === k) { n++; if (Math.abs(M.evaluate(table, o.opt).gap) <= tol) lv++; return; }
    for (let i = 0; i < table.length; i++) for (let b = 0; b < bench.length; b++) { const t2 = table.slice(), b2 = bench.slice(); [t2[i], b2[b]] = [b2[b], t2[i]]; rec(t2, b2, d + 1); }
  }; rec(T, B, 0); return [lv, n];
}
const bigHomeIdx = T.map((j, i) => i).filter(i => T[i].p === T[i].w && M.isBig(T[i].w));
const tiedIdx = T.map((j, i) => i).filter(i => M.isBig(T[i].w) || M.isBig(T[i].p));
const smallIdx = T.map((j, i) => i).filter(i => !M.isBig(T[i].w) && !M.isBig(T[i].p));
function planRate(outSet, o) {
  let n = 0, lv = 0;
  for (const outs of comb(outSet, K)) for (const ins of comb(B.map((_, i) => i), K)) { n++; if (Math.abs(M.evaluate(apply(T, outs, ins, B), o.opt).gap) <= o.tol) lv++; }
  return [lv, n];
}
function randomRate(o, seed, N) {
  const r = M.rng(seed); let lv = 0;
  for (let x = 0; x < N; x++) { let t = T.slice(), b = B.slice(); for (let s = 0; s < K; s++) { const i = Math.floor(r() * t.length), j = Math.floor(r() * b.length); [t[i], b[j]] = [b[j], t[i]]; } if (Math.abs(M.evaluate(t, o.opt).gap) <= o.tol) lv++; }
  return lv / N;
}
const base = { tol: C.levelTol, opt: {} };
const [l1, n1] = exhaustive(1, base), [l2, n2] = exhaustive(2, base);
ok(l1 === 0 && l2 === 0, `round 2: no plan of 1 or 2 swaps levels the jars (${l1}/${n1}, ${l2}/${n2})`);
const [lh, nh] = planRate(bigHomeIdx, base), [lt, nt] = planRate(tiedIdx, base), [ls, ns] = planRate(smallIdx, base);
const rr = randomRate(base, 7, 40000);
ok(lh / nh > 0.5, `round 2, ${K} swaps that unseat big-five home judges: ${lh}/${nh} level (${f(100 * lh / nh, 0)}%)`);
console.log(`     ${K} swaps that unseat anyone tied to the big five: ${lt}/${nt} level (${f(100 * lt / nt, 0)}%)`);
ok(ls === 0, `round 2, ${K} swaps that only unseat judges with no big-five tie: ${ls}/${ns} level`);
ok(rr < 0.02, `round 2, ${K} random swaps: ${f(100 * rr, 2)}% level (not by chance)`);
// A seat from a small country barely moves the small jar; a big home judge moves the big jar a lot
let dSmallMax = 0, dBigMax = 0;
for (let i = 0; i < T.length; i++) for (let b = 0; b < B.length; b++) { const e = M.evaluate(apply(T, [i], [b], B)); dSmallMax = Math.max(dSmallMax, e.other.stars - erc.other.stars); dBigMax = Math.max(dBigMax, erc.big.stars - e.big.stars); }
ok(dBigMax > 3 * dSmallMax, `largest single-swap move: big jar −${f(dBigMax)}, small jar +${f(dSmallMax)} (big moves > 3× small)`);

console.log('\n== 6. Robustness of the central discovery under assumptions the paper does not identify');
// (a) the mirror panel leans more than the ERC-like one would suggest is fair (ratio > 2); (b) unseating a big home judge moves
// the big jar > 2× what seating any bench judge moves the small jar; (c) round 2: no 1-swap plan levels, plans that unseat
// big-five home judges level at least 30% of the time, random plans under 3%. Under: Step 2 bonuses, PI bonuses, half/1.5x mobility, 4 judges.
function mobilityVariant(m) {
  // scale every workplace's abroad weights by m, keeping each workplace's total (home-grown absorbs the difference)
  const apps = M.APPLICANTS.map(a => Object.assign({}, a));
  const byW = {}; apps.forEach(a => { (byW[a.w] = byW[a.w] || []).push(a); });
  for (const w in byW) {
    const home = byW[w].find(a => a.p === w), abroad = byW[w].filter(a => a.p !== w);
    if (!home) continue;
    const ab = abroad.reduce((s, a) => s + a.s, 0);
    abroad.forEach(a => { a.s *= m; }); home.s += ab - ab * m;
  }
  return apps;
}
const variants = [
  ['Step 2 project bonuses', { bonus: C.bonusAlt.step2project }],
  ['Step 1 PI bonuses', { bonus: C.bonusAlt.step1PI }],
  ['half the mobility', { applicants: mobilityVariant(C.mobilityAlt[0]) }],
  ['1.5x the mobility', { applicants: mobilityVariant(C.mobilityAlt[1]) }],
  ['exactly 4 judges per proposal', { reviewers: 4 }],
];
for (const [name, opt] of variants) {
  const em2 = M.evaluate(mirror, opt), e0 = M.evaluate(T, opt);
  const o = { opt, tol: C.levelTol * e0.gap / erc.gap }; // the target scales with the starting gap under this variant
  let dS = 0, dBg = 0;
  for (let i = 0; i < T.length; i++) for (let b = 0; b < B.length; b++) { const e = M.evaluate(apply(T, [i], [b], B), opt); dS = Math.max(dS, e.other.stars - e0.other.stars); dBg = Math.max(dBg, e0.big.stars - e.big.stars); }
  const [v1] = exhaustive(1, o), [vh, vn] = planRate(bigHomeIdx, o), vr = randomRate(o, 11, 10000);
  ok(em2.ratio > 2 && dBg > 2 * dS && v1 === 0 && vh / vn > 0.3 && vr < 0.03,
    `${name}: mirror ratio ${f(em2.ratio)}, ERC-like ratio ${f(e0.ratio)}, biggest moves big −${f(dBg)} / small +${f(dS)}, ` +
    `level: 1 swap ${v1}, big-home plans ${f(100 * vh / vn, 0)}%, random ${f(100 * vr, 1)}%`);
}

console.log('\n== 7. Claim boundaries');
ok(typeof C.fundingEdge === 'object' && !('fundingEdge' in M.evaluate(T)), 'the correlational funding edge is quoted, never computed from the player\'s panel');

console.log('\n== 8. The four applicant-group bars (passport row × workplace column)');
for (const [name, pan] of [['ERC-like', C.ercPanel], ['mirror', 'DE/DE DE/DE UK/UK UK/UK FR/FR IT/IT ES/ES IT/UK DE/CH NL/NL PL/PL SE/SE IL/IL PT/PT GR/GR']]) {
  const e = M.evaluate(P(pan)), c = e.cells;
  const wsum = M.CELLS.reduce((a, k) => a + c[k].weight, 0);
  ok(Math.abs(wsum - 100) < 1e-9 && M.CELLS.every(k => c[k].weight > 0), `${name}: the four groups partition the applicants (${M.CELLS.map(k => k + ' ' + f(c[k].weight, 1) + '%').join(', ')})`);
  const wavg = (a, b) => (c[a].stars * c[a].weight + c[b].stars * c[b].weight) / (c[a].weight + c[b].weight);
  const big = wavg('bigP_bigW', 'othP_bigW'), oth = wavg('bigP_othW', 'othP_othW');
  ok(Math.abs(big - e.big.stars) < 1e-9 && Math.abs(oth - e.other.stars) < 1e-9,
    `${name}: weighted cells reproduce the success measure (works in Big Five ${f(big)} = ${f(e.big.stars)}, elsewhere ${f(oth)} = ${f(e.other.stars)})`);
  const naive = (c.bigP_bigW.stars + c.othP_bigW.stars) / 2;
  console.log(`     (an unweighted average of the two bar heights would say ${f(naive)} instead of ${f(big)}; not used)`);
}
ok(M.cellOf({ p: 'DE', w: 'FR' }) === 'bigP_bigW' && M.matchType({ p: 'DE', w: 'FR' }, { p: 'FR', w: 'DE' }) === null,
  '"same" means the same named country: a German in France and a French judge in Germany do not match');

console.log(`\n${fails ? 'FAILURES: ' + fails : 'ALL PASS'}`);
process.exitCode = fails ? 1 : 0;
