// Calibration check for Goodall's Long Grass. Run: node calibration.js  (writes calibration-result.txt)
// A. the draw of the long grass over many afternoons; B. the paper's numbers (depths, the infants' two termites in
// twenty-two bouts, the order of the ages, the sponge); C. playing it in numbers: whole afternoons by obvious strategies;
// D. robustness of the discovery to the designer's choices; E. the rules themselves (invariants, boundary actions).
const M = require('./mechanism.js'); const C = M.CONFIG; const fs = require('fs');
const OUT = []; const say = s => { OUT.push(s); console.log(s); };
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; say(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2);
const SEEDS = Array.from({ length: 1000 }, (_, i) => i + 1);

// ---- a finger: push to D at vp in/s, hold P seconds, pull out at vs in/s. Drives the same dipStep the browser drives.
function dip(g, D, P, vp, vs) {
  const ds = M.startDip(g); if (!ds) return null;
  const dt = 1 / 60; let t = 0, target = 0, res = null;
  const run = tgt => { const ev = M.dipStep(g, tgt, dt); if (ev && ev.result) res = ev.result; };
  while (target < D && !res) { target = Math.min(D, target + vp * dt); run(target); t += dt; }
  for (let s = 0; s < P && !res; s += dt) run(target);
  let cur = g.dip ? g.dip.d : 0;                                // the finger pulls from where the stem is
  while (!res) { cur -= vs * dt; run(cur); if ((t += dt) > 60) break; }
  return res;
}
// a bare dip on a stem outside a game (for B and D)
function bareDip(stem, D, P, vp, vs, r) {
  const ds = M.newDip(stem, 'mound'); const dt = 1 / 60; let target = 0, ev;
  while (target < D) { target = Math.min(D, target + vp * dt); M.stepDip(ds, target, dt, r); }
  for (let s = 0; s < P; s += dt) M.stepDip(ds, target, dt, r);
  let cur = ds.d; let n = 0;
  do { cur -= vs * dt; ev = M.stepDip(ds, cur, dt, r); } while (!ev.done && n++ < 5000);
  return M.finishDip(ds, stem);
}
const stemOf = (type, len, prep) => { const s = M.makeStem(type, M.rng(1), len); if (prep && s.leaves) s.leaves = false; return s; };

// ===== A. the draw
say('A. THE LONG GRASS (1000 afternoons)');
{
  let ok8 = true, okStem = true, okLeafy = true, okRepro = true, okLen = true; const counts = {};
  for (const s of SEEDS) {
    const g = M.newGame(s); if (g.grass.length !== 8) ok8 = false;
    const k = g.grass.map(x => x.type); k.forEach(t => (counts[t] = (counts[t] || 0) + 1));
    if (!k.includes('stem')) okStem = false; if (!k.includes('leafy')) okLeafy = false;
    for (const x of g.grass) { const T = C.TYPES[x.type]; if (x.len < T.len[0] || x.len > T.len[1]) okLen = false; }
    const h = M.newGame(s); if (JSON.stringify(h.grass.map(x => [x.type, x.len])) !== JSON.stringify(g.grass.map(x => [x.type, x.len]))) okRepro = false;
  }
  check('eight stems every afternoon', ok8);
  check('always a stiff grass stem and a leafy twig (two ways to a grown-up’s tool; the floor)', okStem && okLeafy);
  check('lengths inside each kind’s range', okLen);
  check('an afternoon number replays the same grass', okRepro);
  say('      stems per afternoon, by kind: ' + Object.keys(counts).map(k => `${k} ${f2(counts[k] / SEEDS.length)}`).join(', '));
}

// ===== B. the paper's numbers
say('\nB. THE PAPER’S NUMBERS');
const P = C.PASSAGE;
{
  // B1. the grown-up technique goes in five to eight inches (p. 230)
  const depths = [];
  for (const len of [8.5, 9, 9.5, 10, 11, 12]) for (const type of ['stem', 'leafy']) depths.push(bareDip(stemOf(type, len, true), 12, 2, 6, 3, M.rng(len * 10)).maxD);
  check('grown-up technique (stiff, stripped, pushed in as far as it goes): depth within 5–8 inches (p. 230)',
    depths.every(d => d >= C.PAPER.ADULT_DEPTH[0] && d <= C.PAPER.ADULT_DEPTH[1]), `min ${f1(Math.min(...depths))}, max ${f1(Math.max(...depths))}`);
  // B2. floppy stems go in one or two inches (p. 230)
  const fl = []; for (const len of [11, 12, 13, 14]) fl.push(bareDip(stemOf('blade', len), 12, 2, 6, 3, M.rng(len)).maxD);
  check('a floppy stem (the 3–4-year-olds’ “too flexible”) goes in one or two inches (p. 230)',
    fl.every(d => d >= C.PAPER.INFANT_3_4_DEPTH[0] && d <= C.PAPER.INFANT_3_4_DEPTH[1]), `depths ${fl.map(f1).join(', ')}`);
  // B3. two-to-three-year-olds: wrong material, clumsy jerks; two termites in twenty-two bouts (p. 230)
  // the "infant of 2–3": any stem from the long grass, unprepared, pushed in as far as it goes, a short pause, out with a
  // jerk (10 to 30 inches per second). One dip stands for one bout (ours: the paper's bouts last seconds to minutes).
  const per = []; let caught = 0, bouts = 0;
  for (const s of SEEDS) {
    const g = M.newGame(s); const r = M.rng(s + 7);
    for (let b = 0; b < 22; b++) {
      const stem = M.makeStem(g.grass[Math.floor(r() * 8)].type, r);
      const res = bareDip(stem, 12, r() * 1.5, 4 + r() * 4, 10 + r() * 20, r); caught += res.eaten; bouts++;
    }
    per.push(caught);
  }
  const rate = caught / bouts;
  check('an infant of 2–3 (wrong stems, a jerk) catches about two termites in twenty-two bouts (p. 230)',
    rate * 22 >= 0.7 && rate * 22 <= 5, `${f1(rate * 22)} per 22 bouts, over ${bouts} bouts`);
  // B4. her dips: all grown-up, all five to eight inches
  const md = [], mc = [], ages = {};
  for (const s of SEEDS.slice(0, 200)) {
    const g = M.newGame(s); M.look(g, 0); M.take(g); M.walk(g);
    for (let i = 0; i < 12 && g.phase === 'mound'; i++) { const w = M.watch(g); md.push(w.result.maxD); mc.push(w.result.eaten); ages[w.result.age] = (ages[w.result.age] || 0) + 1; }
  }
  check('your mother: every dip five to eight inches and classed a grown-up’s', md.every(d => d >= 5 && d <= 8) && Object.keys(ages).join() === 'adult',
    `depth ${f1(Math.min(...md))}–${f1(Math.max(...md))}; ${mc.length} dips; termites per dip ${f1(mean(mc))} (ours)`);
  // B5. the ages in order of catch, and each heuristic classed at its own age
  const H = {
    '2-3': (r) => [M.makeStem(['stick', 'short', 'leafy', 'stem'][Math.floor(r() * 4)], r), 12, r() * 1.5, 6, 12 + r() * 18],
    '3-4': (r) => [M.makeStem(['blade', 'blade', 'dry'][Math.floor(r() * 3)], r), 12, 1.5 + r(), 6, 3 + r() * 3],
    '4': (r) => { const s = M.makeStem(r() < 0.5 ? 'twig' : 'dry', r); return [s, 12, 1.5 + r(), 6, 3 + r() * 3]; },
    adult: (r) => { const s = M.makeStem(r() < 0.5 ? 'stem' : 'leafy', r); s.leaves = false; return [s, 12, 1.5 + r() * 1.5, 6, 2.5 + r() * 2]; },
  };
  const catchBy = {}, classBy = {};
  for (const a of Object.keys(H)) {
    const r = M.rng(99 + a.length); catchBy[a] = []; classBy[a] = {};
    for (let i = 0; i < 2000; i++) { const [s, D, Pz, vp, vs] = H[a](r); const res = bareDip(s, D, Pz, vp, vs, r); catchBy[a].push(res.eaten); classBy[a][res.age] = (classBy[a][res.age] || 0) + 1; }
  }
  const cm = a => mean(catchBy[a]);
  check('termites per dip rise with the ages: 2–3 ≈ 3–4 < 4 < grown-up', cm('2-3') < cm('4') && cm('3-4') < cm('4') && cm('4') < cm('adult') && cm('adult') >= 3 * cm('4') * 0.5,
    Object.keys(H).map(a => `${a}: ${f2(cm(a))}`).join('; '));
  const modal = a => Object.keys(classBy[a]).sort((x, y) => classBy[a][y] - classBy[a][x])[0];
  check('each age’s way of fishing is classed at that age by the notebook', Object.keys(H).every(a => modal(a) === a),
    Object.keys(H).map(a => `${a} → ${modal(a)} (${Math.round(100 * classBy[a][modal(a)] / 2000)} %)`).join('; '));
  // B6. the sponge: a chewed end soaks up more (p. 233); the infant's stem, sucked each time, gets there in the hollow's five
  const hol = (plan) => { const g = M.newGame(5); M.look(g, g.grass.findIndex(x => x.type === 'stem')); M.take(g); M.walk(g); g.suns = 1; dip(g, 6, 1, 6, 3);
    M.goHollow(g); plan(g); return g.hollow.sips; };
  const handOnly = hol(g => { M.holdHand(g); for (let i = 0; i < 5 && !g.over; i++) dip(g, 6, 0.5, 5, 4); });
  const stemOnly = hol(g => { M.hold(g, 0); for (let i = 0; i < 5 && !g.over; i++) dip(g, 6, 0.5, 5, 4); });
  const chewFirst = hol(g => { M.hold(g, 0); M.prepare(g, 'chew'); for (let i = 0; i < 5 && !g.over; i++) dip(g, 6, 0.5, 5, 4); });
  const leaves = hol(g => { M.pickLeaves(g); for (let i = 0; i < 5 && !g.over; i++) dip(g, 6, 0.5, 5, 4); });
  const wad = hol(g => { M.pickLeaves(g); M.prepare(g, 'chew'); for (let i = 0; i < 5 && !g.over; i++) dip(g, 6, 0.5, 5, 4); });
  const E = C.HOLLOW.enough;
  check('the hollow: hand alone and fresh leaves fall short; the infant’s sucked stem, a chewed stem and chewed leaves each drink their fill',
    handOnly < E && leaves < E && stemOnly >= E && chewFirst >= E && wad >= E, `hand ${handOnly}, fresh leaves ${leaves}, stem sucked ${stemOnly}, stem chewed ${chewFirst}, chewed leaves ${wad} (enough ${E})`);
}

// ===== C. playing it in numbers: whole afternoons
say('\nC. PLAYING IT IN NUMBERS (300 afternoons each; termites eaten, last dip’s age, hollow)');
function afternoon(seed, S) {
  const g = M.newGame(seed); const r = M.rng(seed * 31 + 5);
  // choose the kit
  const order = S.pick(g.grass, r);
  for (const i of order.slice(0, 3)) { M.look(g, i); if (S.strip && M.inHand(g).leaves) M.prepare(g, 'strip'); M.take(g); }
  M.walk(g);
  const mem = { slow: false, bad: new Set() };
  let watches = 0;
  while (g.phase === 'mound') {
    if (S.watch && watches < S.watch) { M.watch(g); watches++; if (g.mother.dropped && S.hers) M.pickUpHers(g); continue; }
    if (g.mother.dropped && S.hers) M.pickUpHers(g);
    let s = M.inHand(g);
    if (S.learn) { // switch away from stems that failed for their material
      for (let k = 0; k < g.carried.length && mem.bad.has(s.id); k++) { M.hold(g, (g.held + 1) % g.carried.length); s = M.inHand(g); }
      if (s.leaves) M.prepare(g, 'strip');
    }
    if (S.bite && s.bent) M.prepare(g, 'bite');
    if (S.cycle) M.hold(g, (g.dips.length) % g.carried.length);
    const t = S.tech(r, mem, g);
    const res = dip(g, t[0], t[1], t[2], t[3]);
    if (S.learn) { if (res.why === 'jerk' || res.dropped) mem.slow = true; if (['thick', 'leaves', 'short', 'fold1', 'fold2'].includes(res.why)) mem.bad.add(M.inHand(g) && M.inHand(g).id); if (res.why === 'leaves') mem.bad.delete(M.inHand(g).id); }
  }
  M.goHollow(g);
  if (S.hollow === 'leaves') { M.pickLeaves(g); M.prepare(g, 'chew'); } else if (S.hollow === 'hand') M.holdHand(g);
  else { const i = g.carried.findIndex(x => x.grassy); if (i >= 0) M.hold(g, i); else M.holdHand(g); }
  while (!g.over) dip(g, 6, 0.5, 5, 4);
  return { eaten: g.eaten, last: g.dips.length ? g.dips[g.dips.length - 1].age : '-', sips: g.hollow.sips, mother: g.mother.eaten, v: M.verdict(g) };
}
const byType = (grass, pref) => grass.map((s, i) => [i, pref.indexOf(s.type) < 0 ? 99 : pref.indexOf(s.type)]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
const STRATS = {
  'long is best (three longest, no prep, all the way in, slow)': { pick: g => g.map((s, i) => [i, s.len]).sort((a, b) => b[1] - a[1]).map(x => x[0]), cycle: true, tech: () => [12, 2, 6, 4] },
  'fast hands (good stems, stripped, but pulled out at a flick)': { pick: g => byType(g, ['stem', 'leafy', 'twig']), strip: true, bite: true, tech: () => [12, 1, 6, 25] },
  'trial and error (a mixed kit; slows down after a jerk, drops what folds)': { pick: (g, r) => byType(g, ['blade', 'leafy', 'stem']), learn: true, bite: true,
    tech: (r, mem) => [12, mem.slow ? 2 : 0.8, 6, mem.slow ? 3.5 : 18] },
  'copy your mother (watch once, then do as she does)': { pick: g => byType(g, ['stem', 'leafy', 'dry']), strip: true, bite: true, watch: 1, hers: true, tech: () => [12, 2.2, 6, 3] },
  'watcher (watch four times first)': { pick: g => byType(g, ['stem', 'leafy', 'dry']), strip: true, bite: true, watch: 4, hers: true, tech: () => [12, 2.2, 6, 3] },
  'never bites a bent end (good kit, good hands)': { pick: g => byType(g, ['stem', 'leafy', 'twig']), strip: true, tech: () => [12, 2.2, 6, 3] },
  'best possible (good kit, stripped, bitten, slow, never watches)': { pick: g => byType(g, ['stem', 'leafy', 'dry']), strip: true, bite: true, hers: true, tech: () => [12, 2.2, 6, 3] },
  'four-year-old (shorter or springier tools, good hands)': { pick: g => byType(g, ['twig', 'dry', 'bark']), bite: true, tech: () => [12, 2, 6, 3] },
};
const table = [];
for (const [name, S] of Object.entries(STRATS)) {
  const rs = SEEDS.slice(0, 300).map(s => afternoon(s, S));
  const e = rs.map(x => x.eaten), lastAges = {}; rs.forEach(x => (lastAges[x.last] = (lastAges[x.last] || 0) + 1));
  const modal = Object.keys(lastAges).sort((a, b) => lastAges[b] - lastAges[a])[0];
  table.push({ name, mean: mean(e), min: Math.min(...e), max: Math.max(...e), modal, share: lastAges[modal] / rs.length, mother: mean(rs.map(x => x.mother)) });
  say(`  ${name.padEnd(74)} termites ${f1(mean(e)).padStart(5)} (min ${String(Math.min(...e)).padStart(2)}, max ${String(Math.max(...e)).padStart(2)}); last dip ${modal} (${Math.round(100 * lastAges[modal] / rs.length)} %)`);
}
say(`  your mother, every afternoon: about ${f1(mean(table.map(x => x.mother)))} termites`);
const T = n => table.find(x => x.name.startsWith(n));
check('the decisions matter: best possible catches at least four times what “long is best” or “fast hands” does',
  T('best possible').mean >= 4 * Math.max(T('long is best').mean, T('fast hands').mean), `${f1(T('best possible').mean)} against ${f1(T('long is best').mean)} and ${f1(T('fast hands').mean)}`);
check('learning by trying gets most of the way to the best', T('trial and error').mean >= 0.5 * T('best possible').mean, `${f1(T('trial and error').mean)} of ${f1(T('best possible').mean)}`);
check('watching once pays: copying your mother beats learning by trying and comes within a quarter of the best; watching four times costs more',
  T('copy your mother').mean > T('trial and error').mean && T('copy your mother').mean >= 0.75 * T('best possible').mean && T('watcher').mean < T('copy your mother').mean,
  `${f1(T('copy your mother').mean)} against trying ${f1(T('trial and error').mean)}; watcher ${f1(T('watcher').mean)}`);
check('a bent end matters: never biting it off loses termites', T('never bites').mean < T('best possible').mean, `${f1(T('never bites').mean)} against ${f1(T('best possible').mean)}`);
check('no simple rule wins everywhere: the four-year-old’s short tools sit between', T('four-year-old').mean > T('long is best').mean && T('four-year-old').mean < T('best possible').mean,
  f1(T('four-year-old').mean));
{
  const hs = { stem: [], leaves: [], hand: [] };
  for (const s of SEEDS.slice(0, 100)) for (const k of Object.keys(hs)) hs[k].push(afternoon(s, Object.assign({}, STRATS['best possible (good kit, stripped, bitten, slow, never watches)'], { hollow: k })).sips);
  say(`  the hollow after the best afternoon: termite stem ${f1(mean(hs.stem))} sips; chewed leaves ${f1(mean(hs.leaves))}; hand ${f1(mean(hs.hand))} (enough is ${C.HOLLOW.enough})`);
  check('at the hollow the termite stem drinks its fill; the hand does not', mean(hs.stem) >= C.HOLLOW.enough && mean(hs.hand) < C.HOLLOW.enough);
}

// ===== D. robustness: does the discovery survive other choices of ours?
say('\nD. ROBUSTNESS (the designer’s choices varied one at a time)');
{
  const base = JSON.parse(JSON.stringify({ PASSAGE: C.PASSAGE, TERMITES: C.TERMITES }));
  const variants = [
    ['bend1 at 1 inch', c => (c.PASSAGE.bend1 = 1.0)], ['bend1 at 2 inches', c => (c.PASSAGE.bend1 = 2.0)],
    ['bend2 at 3.5 inches', c => (c.PASSAGE.bend2 = 3.5)], ['bend2 at 5 inches', c => (c.PASSAGE.bend2 = 5.0)],
    ['chamber from 2 inches', c => (c.PASSAGE.chamber = 2.0)], ['chamber from 4 inches', c => (c.PASSAGE.chamber = 4.0)],
    ['termites per inch 1.2', c => (c.TERMITES.perInch = 1.2)], ['termites per inch 2.4', c => (c.TERMITES.perInch = 2.4)],
    ['bite-on time 0.5 s', c => (c.TERMITES.tau = 0.5)], ['bite-on time 1.5 s', c => (c.TERMITES.tau = 1.5)],
    ['grips 3–12 in/s', c => { c.TERMITES.gripLo = 3; c.TERMITES.gripHi = 12; }], ['grips 8–20 in/s', c => { c.TERMITES.gripLo = 8; c.TERMITES.gripHi = 20; }],
  ];
  let allOk = true;
  for (const [name, fn] of variants) {
    Object.assign(C.PASSAGE, JSON.parse(JSON.stringify(base.PASSAGE))); Object.assign(C.TERMITES, JSON.parse(JSON.stringify(base.TERMITES))); fn(C);
    const r = M.rng(7);
    const run = (type, prep, D, Pz, vs) => mean(Array.from({ length: 400 }, () => { const s = M.makeStem(type, r); if (prep) s.leaves = false; return bareDip(s, D, Pz, 6, vs, r).eaten; }));
    const adult = run('stem', true, 12, 2, 3), jerk = run('stem', true, 12, 2, 28), floppy = run('blade', false, 12, 2, 3), thick = run('stick', false, 12, 2, 3);
    const flD = bareDip(M.makeStem('blade', r), 12, 2, 6, 3, r).maxD;
    const ok = adult >= 3 && jerk <= 0.25 * adult && floppy === 0 && thick === 0 && flD >= 1 && flD <= 2;
    allOk = allOk && ok;
    say(`  ${(ok ? 'holds ' : 'BREAKS')}  ${name.padEnd(24)} grown-up ${f1(adult)}, jerk ${f1(jerk)}, floppy ${f1(floppy)} (in ${f1(flD)}), too thick ${f1(thick)}`);
  }
  Object.assign(C.PASSAGE, base.PASSAGE); Object.assign(C.TERMITES, base.TERMITES);
  check('the discovery (the infants’ mistakes catch nothing, the grown-up way catches several) survives every variant', allOk);
}

// ===== E. the rules themselves
say('\nE. RULES AND BOUNDARIES');
{
  // suns: a dip, a watch and a fetch cost one each; the mound ends at zero; the hollow at five or at enough
  const g = M.newGame(11); M.look(g, g.grass.findIndex(x => x.type === 'stem')); M.take(g); M.walk(g);
  const s0 = g.suns; dip(g, 12, 2, 6, 3); const s1 = g.suns; M.watch(g); const s2 = g.suns; M.fetchNearby(g); const s3 = g.suns; M.takeNearby(g, 0);
  check('a dip, a look at your mother and a stem fetched nearby each cost one sun', s0 - s1 === 1 && s1 - s2 === 1 && s2 - s3 === 1);
  // a touch that never goes in is not a dip
  const g2 = M.newGame(12); M.look(g2, 0); M.take(g2); M.walk(g2); M.startDip(g2); M.dipStep(g2, 0.1, 1 / 60); M.dipStep(g2, 0, 1 / 60); M.cancelDip(g2);
  check('a touch shallower than a fifth of an inch costs nothing', g2.suns === C.SUNS && !g2.dip && g2.dips.length === 0);
  // a stem held still in the chamber stays in; termites keep arriving and stop at the cap
  const ds = M.newDip(stemOf('stem', 11, true), 'mound'); const r = M.rng(3); M.stepDip(ds, 7, 1, r); for (let i = 0; i < 600; i++) M.stepDip(ds, 7, 1 / 60, r);
  check('termites on a still stem fill to the cap (per inch in the chamber) and no further', ds.on.length <= Math.ceil(C.TERMITES.perInch * (7 - P.chamber)) && ds.on.length >= Math.floor(C.TERMITES.perInch * (7 - P.chamber)) - 1, `${ds.on.length} on`);
  // bent: three dips past the first bend bend a grass stem; biting restores it, an inch shorter
  const g3 = M.newGame(13); M.look(g3, g3.grass.findIndex(x => x.type === 'stem')); M.take(g3); M.walk(g3);
  for (let i = 0; i < 3; i++) dip(g3, 12, 1, 6, 3); const st = M.inHand(g3); const bent = st.bent, len = st.len; const r4 = dip(g3, 12, 1, 6, 3);
  M.prepare(g3, 'bite'); const r5 = dip(g3, 12, 1, 6, 3);
  check('after three dips the end is bent and folds at the first bend; biting it off restores it, an inch shorter', bent && r4.reason === 'bent' && !M.inHand(g3).bent && M.inHand(g3).len === len - 1 && r5.maxD > P.bend2, `${r4.reason}, then ${f1(r5.maxD)} in`);
  // her stem: thrown down when bent, and yours to pick up
  const g4 = M.newGame(14); M.look(g4, 0); M.take(g4); M.walk(g4); for (let i = 0; i < 3; i++) M.watch(g4);
  check('your mother throws down her bent stem after three dips, and you can pick it up', !!g4.mother.dropped && M.pickUpHers(g4) && M.inHand(g4).bent);
  // a whole game ends, deterministically, with a verdict and no NaN
  const a = afternoon(21, STRATS['copy your mother (watch once, then do as she does)']), b = afternoon(21, STRATS['copy your mother (watch once, then do as she does)']);
  check('the same afternoon, played the same way, comes out the same', JSON.stringify(a) === JSON.stringify(b));
  const words = JSON.stringify(a.v);
  check('the verdict has a headline and five lines of words, and no decimals or NaN', a.v.headline && a.v.did.length >= 3 && !/NaN|undefined|\d\.\d/.test(words), a.v.headline);
  // previews do not change anything
  const g5 = M.newGame(15); M.look(g5, g5.grass.findIndex(x => x.type === 'leafy')); const before = JSON.stringify(M.inHand(g5)); M.preview(g5, 'strip'); M.preview(g5, 'bite');
  check('a preview changes nothing', JSON.stringify(M.inHand(g5)) === before);
}

say(`\n${pass} passed, ${fail} failed`);
fs.writeFileSync(__dirname + '/calibration-result.txt', OUT.join('\n') + '\n');
process.exit(fail ? 1 : 0);
