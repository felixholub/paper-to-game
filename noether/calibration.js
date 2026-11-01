// Noether's Ball — calibration against Noether (1918). Run: node calibration.js  (prints every check; exit code 1 on a failure)
//   (A)   every card's answer, computed from eq. 11, is the one the paper and mechanics give
//   (P)   the plate's two numbers agree with the answer on every card: the same exactly when the change does not matter
//   (V)   the picture agrees: the new trip lands on "where it would go if the change did not matter" exactly when it does not matter
//   (T1)  Theorem I: the prizes of the three changes that do not matter have teeth (steady on true motions, caught by a fake)
//   (E)   the clock's prize on the ball is the energy ½|u′|² + g·y (p. 28, "Energierelationen")
//   (T2)  Theorem II on the slide: the re-ticked clock leaves S unchanged for any p(t), and Σ ψ_i u_i′ = 0 on every path (p. 7);
//         on the ball neither holds
//   (§6)  the slide's clock prize is improper: B ≡ 0 on true motions, fakes and random paths alike; the clock shift is the re-tick
//         with p ≡ 1, so it sits inside the free hand
//   (S)   the empty prize's comparison is honest: the straight slide shown beside the real one is not a slide the dot would take
//         (its equations of motion fail), and the slide's energy is zero along it as along the real slide
//   (Y)   every "why, in the formula" line is true of the formula, checked point by point on random states: no t in the ball's
//         formula and a t in the growing one; no x in the ball's but x in the magnet's; the swing's unchanged by a turn and the
//         wind's changed; the slide's formula scales with the speed (twice as fast, twice the number per unit time) and the ball's
//         does not; and the badge 'energy catches fakes' rests on the ball caring about its timing (card 7) where the slide does not (card 9)
//   (F)   card 7's graph is honest: the ball's energy is steady along the real throw and wobbles along the re-timed one (a fake)
//   (Q)   the setup's word "the quickest slide" is true: the real slide beats the straight slide and hundreds of bent slides from A to B
//   (D)   thirty random wobbly re-tickings: the slide never cares, the ball always does
//   (ROB) every answer survives changes of grid, bump size, gravity, the growth rate, the magnet, the wind, the spring and the slide
//   (W)   no decimals in anything the screen reads from the mechanism
const M = require('./mechanism.js'), C = M.CONFIG, fs = require('fs');
const out = []; let fails = 0;
const check = (name, ok, detail) => { out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); if (!ok) fails++; };
const ex = v => Number(v).toExponential(2);

// ---- (A) the answers
const expected = { c1: false, c2: true, c3: false, c4: true, c5: false, c6: true, c7: true, c8: false, c9: false };
const res = {}; for (const c of M.CARDS) res[c.id] = M.playCard(c, 1);
for (const c of M.CARDS) out.push(`      ${c.id} ${c.world}/${c.lever}: residual ${ex(res[c.id].residual)} → ${res[c.id].matters ? 'matters' : 'does not matter'}; ${res[c.id].kind}`);
check('A every card\'s computed answer is the paper\'s: clock, step and turn do not matter for the ball and the spring; growing gravity, the magnet, the wind and re-ticking the ball do; the slide cares about neither the later start nor any re-ticking', M.CARDS.every(c => res[c.id].matters === expected[c.id]));
// ---- (P) and (V)
check('P the plate agrees: the formula\'s number is the same before and after exactly when the change does not matter', M.CARDS.every(c => res[c.id].change.same === !res[c.id].matters), M.CARDS.map(c => `${c.id} ${res[c.id].change.before}→${res[c.id].change.after}`).join(' '));
const gapOk = M.CARDS.filter(c => !M.LEVERS[c.lever].free).every(c => res[c.id].matters ? res[c.id].change.curveGap > 0.1 : res[c.id].change.curveGap < 1e-3);
check('V the picture agrees: the new trip lands on the dashed "if it did not matter" trip exactly when it does not matter (a visible gap otherwise)', gapOk, M.CARDS.filter(c => !M.LEVERS[c.lever].free).map(c => `${c.id} ${res[c.id].change.curveGap.toFixed(3)}`).join(' '));
// ---- (T1)
check('T1 Theorem I: the energy, the sideways speed and the spin have teeth (steady on every true motion, caught by a fake)', ['c1', 'c3', 'c5'].every(id => res[id].kind === 'teeth'));
// ---- (E)
{ let worst = 0; const w = M.WORLDS.ball; for (let s = 0; s < 6; s++) { const path = M.randomPath(w, M.rng(40 + s)), F = M.fields(w, path), B = M.current(w, path, 'clock', null); for (let i = C.EDGE; i < B.length - C.EDGE; i++) worst = Math.max(worst, Math.abs(B[i] - (0.5 * (F.v1[i] ** 2 + F.v2[i] ** 2) + C.G * path.u2[i]))); }
  check('E the clock\'s prize on the ball is ½|u′|² + g·y on any path (p. 28)', worst < 1e-9, 'worst ' + ex(worst)); }
// ---- (T2)
{ let wS = 0, idS = 0, wB = Infinity, idB = Infinity; const r = M.rng(55);
  for (let k = 0; k < 10; k++) { const p = M.randomFree(r), ps = M.randomPath(M.WORLDS.slide, r), pb = M.randomPath(M.WORLDS.ball, r);
    wS = Math.max(wS, M.lieResidual(M.WORLDS.slide, ps, 'warpclock', p)); idS = Math.max(idS, M.identityResidual(M.WORLDS.slide, ps));
    wB = Math.min(wB, M.lieResidual(M.WORLDS.ball, pb, 'warpclock', p)); idB = Math.min(idB, M.identityResidual(M.WORLDS.ball, pb)); }
  check('T2 Theorem II on the slide: invariant under any re-ticking, and Σψᵢuᵢ′ = 0 on every path; on the ball neither', wS < C.LIE_TOL && idS < 1e-2 && wB > 0.1 && idB > 0.1, `slide ${ex(wS)}, ${ex(idS)}; ball ${ex(wB)}, ${ex(idB)}`); }
// ---- (§6)
{ const w = M.WORLDS.slide; let worst = 0, fsz = 0; const r = M.rng(66);
  for (let k = 0; k < 10; k++) { const path = k < 3 ? M.trueMotion(w, r) : k < 6 ? M.bump(M.trueMotion(w, null), 0.2, 0.5, 0.8, 0.5, 0.3) : M.randomPath(w, r); const B = M.current(w, path, 'clock', null), F = M.fields(w, path); for (let i = C.EDGE; i < B.length - C.EDGE; i++) { worst = Math.max(worst, Math.abs(B[i])); fsz = Math.max(fsz, Math.abs(F.f[i])); } }
  const path = M.randomPath(w, M.rng(9)), one = new Float64Array(path.u1.length).fill(1), a = M.current(w, path, 'clock', null), b = M.current(w, path, 'warpclock', one); let d = 0; for (let i = 0; i < a.length; i++) d = Math.max(d, Math.abs(a[i] - b[i]));
  check('§6 the slide\'s clock prize is improper: B ≡ 0 on true motions, fakes and random paths; and the clock shift is the re-tick with p ≡ 1', worst < 1e-9 * Math.max(1, fsz) && d < 1e-12 && res.c8.kind === 'empty', `|B| ${ex(worst)} against |f| ${fsz.toFixed(1)}`); }
// ---- (S)
{ const w = M.WORLDS.slide, real = M.trueMotion(w, null), st = M.straightBetween(real), F = M.fields(w, st); let psi = 0, fsz = 0, b = 0;
  for (let i = C.EDGE; i < F.f.length - C.EDGE; i++) { psi = Math.max(psi, Math.abs(F.psi1[i]), Math.abs(F.psi2[i])); fsz = Math.max(fsz, Math.abs(F.f[i])); }
  const B = M.current(w, st, 'clock', null), Br = M.current(w, real, 'clock', null); for (let i = 0; i < B.length; i++) b = Math.max(b, Math.abs(B[i]), Math.abs(Br[i]));
  check('S the comparison slide is honest: the straight slide fails the equations of motion, and the slide\'s energy is zero along it and along the real slide', psi > 50 * C.TRUE_PSI_TOL && b < 1e-9 * fsz, `ψ up to ${psi.toFixed(2)}; energy ${ex(b)} against |f| ${fsz.toFixed(1)}`); }
// ---- (Y)
{ const r = M.rng(77), W = M.WORLDS; let ok = true; const det = [];
  const f = (w, t, s) => M.fParts(w, t, s[0], s[1], s[2], s[3]).f;
  const states = Array.from({ length: 40 }, () => [(r() - 0.5) * 2, (r() - 0.5) * 1.6, (r() - 0.5) * 6 + 0.5, (r() - 0.5) * 6 + 0.5]);
  const maxDiff = (g) => Math.max(...states.map(g));
  const t0 = maxDiff(s => Math.abs(f(W.ball, 0.9, s) - f(W.ball, 0.1, s))), t1 = maxDiff(s => Math.abs(f(W.grow, 0.9, s) - f(W.grow, 0.1, s)));
  const x0 = maxDiff(s => Math.abs(f(W.ball, 0, [s[0] + 0.4, s[1], s[2], s[3]]) - f(W.ball, 0, s))), x1 = maxDiff(s => Math.abs(f(W.magnet, 0, [s[0] + 0.4, s[1], s[2], s[3]]) - f(W.magnet, 0, s)));
  const rot = (s, a) => [Math.cos(a) * s[0] - Math.sin(a) * s[1], Math.sin(a) * s[0] + Math.cos(a) * s[1], Math.cos(a) * s[2] - Math.sin(a) * s[3], Math.sin(a) * s[2] + Math.cos(a) * s[3]];
  const r0 = maxDiff(s => Math.abs(f(W.peg, 0, rot(s, 0.6)) - f(W.peg, 0, s))), r1 = maxDiff(s => Math.abs(f(W.wind, 0, rot(s, 0.6)) - f(W.wind, 0, s)));
  const sl = states.map(s => [s[0], Math.min(s[1], 1.0), s[2], s[3]]), h0 = Math.max(...sl.map(s => Math.abs(f(W.slide, 0, [s[0], s[1], 2 * s[2], 2 * s[3]]) - 2 * f(W.slide, 0, s)))), h1 = maxDiff(s => Math.abs(f(W.ball, 0, [s[0], s[1], 2 * s[2], 2 * s[3]]) - 2 * f(W.ball, 0, s)));
  det.push(`no t: ball ${ex(t0)}, growing ${ex(t1)}`, `no x: ball ${ex(x0)}, magnet ${ex(x1)}`, `turn: swing ${ex(r0)}, wind ${ex(r1)}`, `twice as fast: slide ${ex(h0)}, ball ${ex(h1)}`);
  ok = t0 < 1e-12 && t1 > 0.1 && x0 < 1e-12 && x1 > 1e-3 && r0 < 1e-9 && r1 > 0.1 && h0 < 1e-9 && h1 > 0.1 && res.c7.matters && !res.c9.matters && M.BADGES.c7.tier === 'red';
  det.forEach(d => out.push('      ' + d)); check('Y every "why, in the formula" line is true of the formula, point by point; the badge for energy catching a fake rests on card 7 against card 9', ok); }
// ---- (F)
{ const w = M.WORLDS.ball, ch = M.showChange(w, 'warpclock'), E = C.EDGE, n = ch.base.u1.length, range = B => { let lo = Infinity, hi = -Infinity; for (let i = E; i < n - E; i++) { lo = Math.min(lo, B[i]); hi = Math.max(hi, B[i]); } return hi - lo; };
  const e0 = Math.abs(M.current(w, ch.base, 'clock', null)[E]), r = range(M.current(w, ch.base, 'clock', null)) / e0, f = range(M.current(w, ch.fresh, 'clock', null)) / e0;
  check('F card 7\'s graph is honest: the ball\'s energy is steady along the real throw and wobbles along the re-timed throw', r < 1e-9 && f > 0.5 && res.c7.matters, `real ${ex(r)}, re-timed ${f.toFixed(2)} of the energy`); }
// ---- (Q)
{ const w = M.WORLDS.slide, T = M.trueMotion(w, null), n = T.u1.length, S0 = M.score(w, T), Sst = M.score(w, M.straightBetween(T)); let tried = 0, quicker = 0, best = Infinity; const r = M.rng(5);
  const tryPath = (u1, u2) => { for (let i = 0; i < n; i++) if (u2[i] > C.SLIDE_H - 0.05) return; const s = M.score(w, { x: T.x, u1, u2 }); tried++; if (s < S0 - 1e-9) quicker++; best = Math.min(best, s); };
  for (let k = 0; k < 400; k++) { const a = (r() - 0.5) * 0.5, b = (r() - 0.5) * 0.5, m = 1 + Math.floor(r() * 3), c2 = (r() - 0.5) * 0.3, d = (r() - 0.5) * 0.3, u1 = new Float64Array(n), u2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { const t = i / (n - 1); u1[i] = T.u1[i] + a * Math.sin(Math.PI * t) * Math.cos(m * t) + c2 * Math.sin(2 * Math.PI * t); u2[i] = T.u2[i] + b * Math.sin(Math.PI * t) + d * Math.sin(m * Math.PI * t); } tryPath(u1, u2); }
  for (const amp of [0.02, 0.05, 0.1, 0.2]) for (const ce of [0.3, 0.5, 0.7]) for (const [d1, d2] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0.7, 0.7]]) { const p = M.bump(T, amp, d1, d2, ce, 0.25); tryPath(p.u1, p.u2); }
  check('Q "the quickest slide" is true: the real slide is quicker than the straight slide and than every bent slide tried from A to B', Sst > S0 && quicker === 0 && tried > 400, `real ${S0.toFixed(3)}, straight ${Sst.toFixed(3)}; ${tried} bent slides, none quicker`); }
// ---- (D)
{ let ok = true; for (let s = 0; s < 30; s++) { const r = M.rng(800 + s), p = M.smoothCurve(Array.from({ length: 24 }, () => (r() - 0.5) * 2)); if (!(M.lieResidual(M.WORLDS.slide, M.randomPath(M.WORLDS.slide, r), 'warpclock', p) < C.LIE_TOL && M.lieResidual(M.WORLDS.ball, M.randomPath(M.WORLDS.ball, r), 'warpclock', p) > C.LIE_TOL)) ok = false; }
  check('D thirty random wobbly re-tickings: the slide never cares, the ball always does', ok); }
// ---- (ROB)
{ const saved = JSON.parse(JSON.stringify(C)); let ok = true; const det = [];
  const trial = (name, mut) => { Object.assign(C, mut); const got = M.CARDS.map(c => M.playCard(c, 3)); const bad = got.filter(g => g.matters !== expected[g.card.id]).map(g => g.card.id); const kinds = got.filter(g => ['c1', 'c3', 'c5', 'c8'].includes(g.card.id)).map(g => g.kind).join(','); det.push(`${name}: ${bad.length ? 'WRONG ' + bad.join(',') : 'all right'} (${kinds})`); if (bad.length || kinds !== 'teeth,teeth,teeth,empty') ok = false; Object.assign(C, JSON.parse(JSON.stringify(saved))); };
  trial('N=200', { N: 200 }); trial('N=800', { N: 800 }); trial('bumps half', { BUMP_AMP: 0.09 }); trial('bumps double', { BUMP_AMP: 0.36 });
  trial('gravity weak', { G: 4 }); trial('gravity strong', { G: 10 }); trial('growth slow', { GROW: 0.3 }); trial('growth fast', { GROW: 1.5 });
  trial('magnet weak', { MAGNET: { x: 0.55, y: -0.15, m: 1, s: 0.4 } }); trial('magnet wide', { MAGNET: { x: 0.3, y: 0.2, m: 4, s: 0.8 } });
  trial('wind light', { WIND: 3 }); trial('spring soft', { PEG_K: 15 }); trial('slide high', { SLIDE_H: 1.6 });
  det.forEach(d => out.push('      ' + d)); check('ROB every answer and every prize survives changes of grid, bumps, gravity, growth, magnet, wind, spring and slide', ok); }
// ---- (W)
{ const strings = []; for (const k in M.WORLDS) { const w = M.WORLDS[k]; strings.push(w.name, w.formula, w.words); } for (const c of M.CARDS) strings.push(c.setup, c.change, c.reveal, c.why, c.rule || ''); for (const k in M.PRIZES) strings.push(k, M.PRIZES[k].formula, M.PRIZES[k].gloss); for (const k in M.LEVERS) strings.push(M.LEVERS[k].label); for (const k in M.BADGES) strings.push(M.BADGES[k].name, M.BADGES[k].sub, M.BADGES[k].missed, M.BADGES[k].short || '', M.BADGES[k].why || '');
  const v = M.verdict({ c1: 'not', c2: 'not', c4: 'matters' }); strings.push(v.headline, v.line);
  check('W no decimals in anything the screen reads from the mechanism', strings.every(s => !/\d\.\d/.test(s)), strings.length + ' strings'); }

const head = `Noether's Ball — calibration against Noether (1918). ${out.filter(l => l.startsWith('PASS')).length} passed, ${fails} failed.`;
console.log([head].concat(out).join('\n')); fs.writeFileSync(__dirname + '/calibration-result.txt', [head].concat(out).join('\n') + '\n'); process.exitCode = fails ? 1 : 0;
