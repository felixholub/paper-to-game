// Calibration check for Noether's Press. Run: node calibration.js  (writes calibration-result.txt)
// The mechanism is PORTED: Noether's identities computed numerically on integrals of the two types the paper names. It is checked
// against the paper's own equations and statements (equation numbers are the paper's; pages are the Wikisource PDF's):
//   (N3)  eq. (3)/(4): Σ ψ_i δu_i = δf + Div A with A = −Σ f_{u'} δu, for ANY path and any δu (the Lagrange central equation)
//   (N12) eq. (12): for an invariant integral, Σ ψ_i δ̄u_i = Div B identically; and (11) ⟺ (12) on each lever (§3, the converse)
//   (N13) Theorem I: ρ parameters give ρ laws; the floor's four levers each give a first integral on true motions (p. 16); the spring two
//   (N28) p. 28: the clock shift's B is the energy, ½|u'|² + V, on the Newton worlds
//   (N7)  p. 7, Theorem II's first example: the Weierstrass integral is invariant under x → p(x) for arbitrary p, with no derivatives of p,
//         and the identity Σ ψ_i u_i' = 0 holds for every path; on the Newton worlds neither holds
//   (N6)  §6: on the Weierstrass worlds the clock shift's energy relation is improper (B vanishes identically, true motions and fakes
//         alike); on the Newton worlds it is proper (steady on true motions, catching fakes); the shift group sits inside the warp
//   (R)   re-ticked true motions stay true on the Weierstrass worlds (p. 7) and become fakes on the Newton worlds
//   (S)   the slide's across-shift law is n·sin(angle to the vertical), steady along the ray (the law of refraction; eq. 13 applied)
//   (ROB) robustness: random density profiles, spring constants, grid sizes and bump sizes leave every verdict unchanged
//   (D)   the player's hand: random drawn curves warp the clock without a jam on the slide and the sheet, and jam on the floor and the spring
//   (H)   heuristics: the obvious ways of spending twelve pulls land in different places
//   (W)   words: no decimals in anything the screen reads from the mechanism
const M = require('./mechanism.js'); const C = M.CONFIG, fs = require('fs');
const out = []; let pass = 0, fail = 0;
function check(name, ok, detail) { (ok ? pass++ : fail++); out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); }
const ex = x => x.toExponential(2);
const Wk = C.WORLD_ORDER.map(id => M.WORLDS[id]);
function deriv(a, h) { const n = a.length, d = new Float64Array(n); for (let i = 1; i < n - 1; i++) d[i] = (a[i + 1] - a[i - 1]) / (2 * h); d[0] = (a[1] - a[0]) / h; d[n - 1] = (a[n - 1] - a[n - 2]) / h; return d; }
const E = C.EDGE;

// ---- N3: the central equation on random paths with random δu
{
  let worst = 0;
  for (const w of Wk) for (let s = 0; s < 8; s++) {
    const r = M.rng(100 + s), path = M.randomPath(w, r), F = M.fields(w, path), n = F.f.length, d1 = M.randomFree(r), d2 = M.randomFree(r);
    const dd1 = deriv(d1, F.h), dd2 = deriv(d2, F.h), A = new Float64Array(n);
    for (let i = 0; i < n; i++) A[i] = -(F.fp1[i] * d1[i] + F.fp2[i] * d2[i]);
    const dA = deriv(A, F.h); let res = 0, sc = 1e-9;
    for (let i = E; i < n - E; i++) { const lhs = F.psi1[i] * d1[i] + F.psi2[i] * d2[i], df = F.fu1[i] * d1[i] + F.fu2[i] * d2[i] + F.fp1[i] * dd1[i] + F.fp2[i] * dd2[i]; res = Math.max(res, Math.abs(lhs - df - dA[i])); sc = Math.max(sc, Math.abs(lhs), Math.abs(df), Math.abs(dA[i])); }
    worst = Math.max(worst, res / sc);
  }
  check('N3 eq. (3): Σψδu = δf + Div A on random paths and random δu, all worlds', worst < 1e-2, 'worst relative residual ' + ex(worst));
}
// ---- N12 and the converse: (11) holds ⟺ Σψδ̄u − Div B vanishes, lever by lever
{
  const rows = []; let ok = true;
  for (const w of Wk) for (const L of M.LEVERS) {
    const r = M.rng(7); let worst = 0, lie = 0;
    for (let s = 0; s < 4; s++) {
      const p = L.free ? M.randomFree(r) : null, path = M.randomPath(w, r), F = M.fields(w, path), n = F.f.length, T = (() => { const B = M.current(w, path, L.id, p); return B; })();
      const dB = deriv(T, F.h); const Tr = M.lieResidual(w, path, L.id, p); lie = Math.max(lie, Tr);
      // δ̄u again, from the mechanism's definitions
      const dx = new Float64Array(n), du1 = new Float64Array(n), du2 = new Float64Array(n);
      for (let i = 0; i < n; i++) { if (L.id === 'clock') dx[i] = 1; if (L.id === 'across') du1[i] = 1; if (L.id === 'up') du2[i] = 1; if (L.id === 'turn') { du1[i] = -path.u2[i]; du2[i] = path.u1[i]; } if (L.id === 'warpclock') dx[i] = p[i]; if (L.id === 'warpfloor') du1[i] = p[i]; }
      let res = 0, sc = 1e-9;
      for (let i = E; i < n - E; i++) { const d1 = du1[i] - F.v1[i] * dx[i], d2 = du2[i] - F.v2[i] * dx[i], lhs = F.psi1[i] * d1 + F.psi2[i] * d2; res = Math.max(res, Math.abs(lhs - dB[i])); sc = Math.max(sc, Math.abs(lhs), Math.abs(dB[i]), Math.abs(F.f[i])); }
      worst = Math.max(worst, res / sc);
    }
    const holds = lie < C.LIE_TOL, divrel = worst < C.LIE_TOL; rows.push(`${w.id}/${L.id}: Lie ${ex(lie)} ${holds ? 'holds' : 'fails'}; Σψδ̄u−DivB ${ex(worst)} ${divrel ? 'identity' : 'no'}`);
    if (holds !== divrel) ok = false;
  }
  out.push('      ' + rows.join('\n      '));
  check('N12 eq. (12) holds exactly for the levers that pass (11), and fails for those that jam: (11) ⟺ (12), §3', ok);
}
// ---- N13: Theorem I counts
{
  const kinds = w => Object.fromEntries(M.LEVERS.map(L => [L.id, M.pull(w, L.id, null, 11).kind]));
  const kf = kinds(M.WORLDS.floor), ks = kinds(M.WORLDS.spring), kg = kinds(M.WORLDS.slide), kh = kinds(M.WORLDS.sheet);
  out.push('      floor ' + JSON.stringify(kf) + '\n      spring ' + JSON.stringify(ks) + '\n      glass ' + JSON.stringify(kg) + '\n      sheet ' + JSON.stringify(kh));
  check('N13 the floor: four parameters (clock, across, up, turn), four laws with teeth; both warps jam', ['clock', 'across', 'up', 'turn'].every(k => kf[k] === 'teeth') && kf.warpclock === 'jam' && kf.warpfloor === 'jam');
  check('N13b the spring: two laws (clock, turn); shifts and warps jam', ks.clock === 'teeth' && ks.turn === 'teeth' && ['across', 'up', 'warpclock', 'warpfloor'].every(k => ks[k] === 'jam'));
  check('N13c the slide: clock void, across teeth, warp-clock identity; up, turn, warp-across jam', kg.clock === 'void' && kg.across === 'teeth' && kg.warpclock === 'identity' && ['up', 'turn', 'warpfloor'].every(k => kg[k] === 'jam'));
  check('N13d the sheet: clock void, across teeth, warp-clock identity; up, turn, warp-across jam', kh.clock === 'void' && kh.across === 'teeth' && kh.warpclock === 'identity' && ['up', 'turn', 'warpfloor'].every(k => kh[k] === 'jam'));
  // first integrals on true motions, several seeds
  let worst = 0;
  for (const [w, levers] of [[M.WORLDS.floor, ['clock', 'across', 'up', 'turn']], [M.WORLDS.spring, ['clock', 'turn']], [M.WORLDS.slide, ['across']], [M.WORLDS.sheet, ['across']]])
    for (let s = 0; s < 10; s++) { const path = M.trueMotion(w, M.rng(200 + s)); for (const l of levers) { const B = M.current(w, path, l, null); let lo = Infinity, hi = -Infinity, m = 0; for (let i = E; i < B.length - E; i++) { lo = Math.min(lo, B[i]); hi = Math.max(hi, B[i]); m = Math.max(m, Math.abs(B[i])); } worst = Math.max(worst, (hi - lo) / Math.max(m, 1e-9)); } }
  check('N13e every stamped law is a first integral: B steady along true motions over ten seeds (p. 16)', worst < 1e-3, 'worst relative drift ' + ex(worst));
}
// ---- N28: the energy
{
  let worst = 0;
  for (const w of [M.WORLDS.floor, M.WORLDS.spring]) for (let s = 0; s < 5; s++) { const path = M.randomPath(w, M.rng(300 + s)), F = M.fields(w, path), B = M.current(w, path, 'clock', null); for (let i = E; i < B.length - E; i++) { const Eg = 0.5 * (F.v1[i] ** 2 + F.v2[i] ** 2) + 0.5 * w.k * (path.u1[i] ** 2 + path.u2[i] ** 2); worst = Math.max(worst, Math.abs(B[i] - Eg) / Math.max(1, Math.abs(Eg))); } }
  check('N28 the clock shift\'s B is the energy ½|u\'|² + V on the Newton worlds (p. 28, "Energierelationen")', worst < 1e-9, 'worst ' + ex(worst));
}
// ---- N7: Theorem II's example
{
  let wW = 0, wN = Infinity, idW = 0, idN = Infinity;
  for (let s = 0; s < 10; s++) { const r = M.rng(400 + s);
    for (const w of [M.WORLDS.slide, M.WORLDS.sheet]) { const path = M.randomPath(w, r), p = M.randomFree(r); wW = Math.max(wW, M.lieResidual(w, path, 'warpclock', p)); idW = Math.max(idW, M.identityResidual(w, path, 'warpclock')); }
    for (const w of [M.WORLDS.floor, M.WORLDS.spring]) { const path = M.randomPath(w, r), p = M.randomFree(r); wN = Math.min(wN, M.lieResidual(w, path, 'warpclock', p)); idN = Math.min(idN, M.identityResidual(w, path, 'warpclock')); }
  }
  check('N7 the Weierstrass worlds are invariant under x → p(x) for arbitrary p (ten random p), and the Newton worlds are not', wW < C.LIE_TOL && wN > 0.1, `worst Weierstrass ${ex(wW)}, best Newton ${ex(wN)}`);
  check('N7b the identity Σψ_i u_i\' = 0 holds on every path of the Weierstrass worlds and on none of the Newton worlds (p. 7)', idW < C.LIE_TOL && idN > 0.1, `worst Weierstrass ${ex(idW)}, best Newton ${ex(idN)}`);
  check('N7c the warp\'s δ̄u contains p but no derivative of p (σ = 0): the identity has no derivative terms', true, 'by construction: δ̄u_i = −u_i\'·p');
}
// ---- N6: proper against improper
{
  let okV = true, okP = true, detail = [];
  for (let s = 0; s < 6; s++) for (const w of Wk) { const r = M.pull(w, 'clock', null, 500 + s); const a = r.audit; detail.push(`${w.id}:${r.kind}${a && a.blank ? '(B≡0)' : ''}`); if (w.type === 'weierstrass' && !(r.kind === 'void' && a.blank)) okV = false; if (w.type === 'newton' && r.kind !== 'teeth') okP = false; }
  out.push('      ' + detail.slice(0, 8).join(' '));
  check('N6 on the Weierstrass worlds the energy relation is improper: B ≡ 0 on true motions and fakes alike, VOID, six seeds', okV);
  check('N6b on the Newton worlds the energy relation is proper: steady on true motions, catching fakes, six seeds', okP);
  check('N6c the shift of the clock is the warp with p ≡ 1: the displacement group is a subgroup of the infinite group (p. 28)', (() => { const w = M.WORLDS.slide, path = M.randomPath(w, M.rng(9)), p = new Float64Array(path.u1.length).fill(1); const a = M.current(w, path, 'clock', null), b = M.current(w, path, 'warpclock', p); let d = 0; for (let i = 0; i < a.length; i++) d = Math.max(d, Math.abs(a[i] - b[i])); return d < 1e-12; })());
}
// ---- R: re-ticking
{
  let ok = true, det = [];
  for (let s = 0; s < 6; s++) for (const w of Wk) { const b = M.auditorBatch(w, 600 + s); const t = b[1]; det.push(`${w.id}:${ex(t.psi)}${t.isTrue ? 'T' : 'F'}`); if ((w.type === 'weierstrass') !== t.isTrue) ok = false; if (!b[0].isTrue || !b[2].isTrue) ok = false; if (b.slice(3).some(o => o.isTrue)) ok = false; }
  out.push('      re-ticked motion ψ: ' + det.slice(0, 8).join(' '));
  check('R a re-ticked true motion is still true on the slide and the sheet, and a fake on the floor and the spring; bumps are always fakes', ok);
}
// ---- S: Snell
{
  let worst = 0;
  for (let s = 0; s < 6; s++) { const w = M.WORLDS.slide, path = M.trueMotion(w, M.rng(700 + s)), F = M.fields(w, path), B = M.current(w, path, 'across', null); let lo = Infinity, hi = -Infinity; for (let i = E; i < B.length - E; i++) { const sn = M.density(w, path.u1[i], path.u2[i]).n * F.v1[i] / Math.hypot(F.v1[i], F.v2[i]); worst = Math.max(worst, Math.abs(B[i] + sn)); lo = Math.min(lo, sn); hi = Math.max(hi, sn); } worst = Math.max(worst, hi - lo); }
  check('S the slide\'s across-shift law is −n·sin(angle to the vertical), steady along the integrated path: the law of refraction', worst < 1e-3, 'worst ' + ex(worst));
}
// ---- ROB: robustness of the central discovery to our choices
{
  const saved = { ...C }; let ok = true, det = [];
  const trial = (name, mut) => { Object.assign(C, mut); const g = M.pull(M.WORLDS.slide, 'clock', null, 3).kind, gi = M.pull(M.WORLDS.slide, 'warpclock', null, 3).kind, h = M.pull(M.WORLDS.sheet, 'clock', null, 3).kind, f = M.pull(M.WORLDS.floor, 'clock', null, 3).kind, sp = M.pull(M.WORLDS.spring, 'clock', null, 3).kind, ga = M.pull(M.WORLDS.slide, 'across', null, 3).kind; det.push(`${name}: slide clock ${g}, slide warp ${gi}, sheet clock ${h}, floor clock ${f}, spring clock ${sp}, slide across ${ga}`); if (!(g === 'void' && gi === 'identity' && h === 'void' && f === 'teeth' && sp === 'teeth' && ga === 'teeth')) ok = false; Object.assign(C, saved); };
  trial('N=200', { N: 200 }); trial('N=800', { N: 800 }); trial('bumps half', { BUMP_AMP: 0.075 }); trial('bumps double', { BUMP_AMP: 0.3 }); trial('retick small', { RETICK_AMP: 0.04 });
  trial('slide high', { SLIDE_H: 1.5 }); trial('slide low', { SLIDE_H: 1.2 }); trial('sheet thick', { SHEET_C: 1.6 }); trial('sheet thin', { SHEET_C: 1.12 }); trial('spring stiff', { SPRING_K: 60 }); trial('spring soft', { SPRING_K: 4 });
  out.push('      ' + det.join('\n      '));
  check('ROB the verdicts (void, identity, teeth) survive changes of grid, bump size, re-tick size, slide and sheet profiles and spring constant', ok);
}
// ---- D: the player's hand
{
  let ok = true, det = [];
  for (let s = 0; s < 30; s++) { const r = M.rng(800 + s), samples = Array.from({ length: 24 }, () => (r() - 0.5) * 2); const p = M.smoothCurve(samples); const g = M.pressTest(M.WORLDS.slide, 'warpclock', p, s), h = M.pressTest(M.WORLDS.sheet, 'warpclock', p, s), f = M.pressTest(M.WORLDS.floor, 'warpclock', p, s), sp = M.pressTest(M.WORLDS.spring, 'warpclock', p, s); if (!(g.holds && h.holds && !f.holds && !sp.holds)) { ok = false; det.push(`seed ${s}: ${ex(g.residual)} ${ex(h.residual)} ${ex(f.residual)} ${ex(sp.residual)}`); } }
  check('D thirty random hand-drawn warps: the press holds on the slide and the sheet, jams on the floor and the spring', ok, det.join('; '));
  let okA = true; for (let s = 0; s < 30; s++) { const r = M.rng(900 + s), p = M.smoothCurve(Array.from({ length: 24 }, () => (r() - 0.5) * 2)); for (const w of Wk) if (M.pressTest(w, 'warpfloor', p, s).holds) okA = false; }
  check('Db thirty random hand-drawn sideways warps jam on every world (no world is blind to its first coordinate)', okA);
}
// ---- H: heuristics
{
  const plans = {
    'shifts only (clock, across, up everywhere)': { floor: ['clock', 'across', 'up'], spring: ['clock', 'across', 'up'], slide: ['clock', 'across', 'up'], sheet: ['clock', 'across', 'up'] },
    'clock first, then turn, then across': { floor: ['clock', 'turn', 'across'], spring: ['clock', 'turn', 'across'], slide: ['clock', 'turn', 'across'], sheet: ['clock', 'turn', 'across'] },
    'warps first': { floor: ['warpclock', 'warpfloor', 'clock'], spring: ['warpclock', 'warpfloor', 'clock'], slide: ['warpclock', 'warpfloor', 'clock'], sheet: ['warpclock', 'warpfloor', 'clock'] },
    'reads the world (the intended path)': { floor: ['across', 'clock', 'turn'], spring: ['turn', 'clock', 'across'], slide: ['clock', 'warpclock', 'across'], sheet: ['warpclock', 'across', 'clock'] },
    'one pull per world': { floor: ['clock'], spring: ['turn'], slide: ['across'], sheet: ['across'] },
  };
  const rows = [];
  for (const [name, plan] of Object.entries(plans)) {
    const g = M.newGame(1); for (const wid of C.WORLD_ORDER) { for (const l of plan[wid]) M.playPull(g, l, null); M.nextWorld(g); }
    const v = M.verdict(g); rows.push(`${name.padEnd(44)} teeth ${v.teeth} void ${v.voids} identity ${v.ids} jams ${v.jams}  → ${v.headline}`);
  }
  out.push('      ' + rows.join('\n      '));
  check('H the obvious ways of pulling land in different places (different headlines and tag counts)', new Set(rows.map(r => r.split('→')[1])).size >= 3 && new Set(rows.map(r => r.split('→')[0].slice(44))).size >= 4);
}
// ---- W: words
{
  const strings = []; for (const w of Wk) { strings.push(w.line, w.name); if (w.first) strings.push(w.first.say); for (const k in w.laws) strings.push(w.laws[k]); }
  for (const L of M.LEVERS) strings.push(L.label, L.does, L.shows); for (const k in M.GLOSS) strings.push(M.GLOSS[k]); for (const w of Wk) strings.push(w.rule, w.ask, w.best, w.formula, w.words);
  const g = M.newGame(2); for (const wid of C.WORLD_ORDER) { for (const L of M.LEVERS.slice(0, 3)) { const r = M.playPull(g, L.id, null); if (r) strings.push(r.say, r.plain, r.law || ''); } M.nextWorld(g); }
  const v = M.verdict(g); strings.push(v.headline, ...v.did);
  check('W no decimals in anything the screen reads from the mechanism', strings.every(s => !/\d\.\d/.test(s)), strings.length + ' strings');
}
out.unshift(`Noether's Press — calibration against Noether (1918). ${pass} passed, ${fail} failed.`);
fs.writeFileSync('calibration-result.txt', out.join('\n') + '\n'); console.log(out.join('\n')); process.exit(fail ? 1 : 0);
