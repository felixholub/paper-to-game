// Noether's Press — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build
// if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: PORTED. Noether (1918), Invariante Variationsprobleme, Gött. Nachr. 1918, 235–257 (equation numbers below are the
// paper's; page numbers are the Wikisource PDF's). The game computes her identities numerically for the simple integral
// I = ∫ f(u, u') dx with two dependent variables u = (u1, u2) and first derivatives, on four worlds of the two types the paper
// names: the ordinary integral of mechanics (§1, eq. 4) and the Weierstrass parametric integral, homogeneous of first degree
// in u' (p. 7, her first example of Theorem II). Every tunable number is in CONFIG with its source or its reason.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.NOETHER = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- play (ours)
    BLANKS: 3,                 // our choice: three steel blanks per world, so a pull is a decision; the paper has no budget
    // ---- the grid (ours; the paper's x is continuous)
    N: 400,                    // our choice: points on x in [0, 1]; the identities are checked to O(h^2)
    EDGE: 4,                   // our choice: grid points dropped at each end when reading ψ and B (one-sided differences there)
    // ---- the Lie condition, eq. (11): δ̄f + Div(f·Δx) = 0 identically. A pull is a symmetry if the residual is below this,
    //      relative to the size of f and of f_{u'}·u' along the path, on every test path (ours: the tolerance)
    LIE_TOL: 1e-2,
    LIE_PATHS: 6,              // our choice: random smooth test paths per pull; the condition must hold on an arbitrary region (p. 4)
    FREE_FUNCS: 2,             // our choice: random arbitrary functions p(x) tried beside the player's own, so a warp is not an accident of the drawing
    // ---- the Auditor: proper against improper (§6). A law B (eq. 12, 13) has teeth if Div B = 0 on true motions (ψ = 0) and
    //      Div B ≠ 0 on some fake; it is void if Div B = 0 on everything (then it is an identity, not a consequence of ψ = 0)
    TRUE_PSI_TOL: 0.05,        // our choice: a motion is true if max|ψ| is below this (true motions integrated by RK4 sit near 1e-3; fakes near 1 or more)
    DRIFT_TRUE_TOL: 0.02,      // our choice: drift of B on a true motion, relative to the largest |B| seen, below this counts as steady
    DRIFT_FAKE_TOL: 0.10,      // our choice: drift of B on a fake above this counts as caught
    B_FLOOR: 1e-9,             // our choice: scale floor, so a B that is identically zero reads as zero drift, not as noise
    BLANK_REL: 1e-7,           // our choice: a B smaller than this times the size of f, on every motion, is identically zero (a blank tag)
    FAKES: 5,                  // our choice: fakes thrown per tag (bumps across, up, slanted; a re-ticked clock; a bump at the end)
    TRUES: 3,                  // our choice: true motions thrown per tag (one re-ticked where the world allows it)
    BUMP_AMP: 0.15,            // our choice: size of a fake's bump in floor units (the window is 2 by 2)
    RETICK_AMP: 0.12,          // our choice: the Auditor's re-ticking of the clock, x → x + a·sin(2πx)
    // ---- the worlds (ours: profiles chosen for a visible bend; the forms are the paper's two types)
    SPRING_K: Math.pow(2 * Math.PI * 0.75, 2),   // a spring back to the centre: three quarters of a swing in the window's tick
    GLASS_N0: 1.3, GLASS_DN: 0.5, GLASS_SLOPE: 2.5,  // glass density n(u2) = N0 − DN·tanh(SLOPE·u2): denser lower down, 0.8 to 1.8
    SHEET_N0: 1.0, SHEET_DN: 0.6, SHEET_R: 0.35,     // sheet stretch n(r) = N0 + DN/(1 + (r/R)^2): a well at the centre
    SPEED: 2.2,                // our choice: path length a true motion covers in one window tick on the floor, the glass and the sheet
    // ---- words (ours)
    WORLD_ORDER: ['floor', 'spring', 'glass', 'sheet'],
  };

  // ---------- small numerics
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rng = seed => mulberry32(seed >>> 0);
  function deriv(a, h) { // central differences, one-sided at the ends
    const n = a.length, d = new Float64Array(n);
    for (let i = 1; i < n - 1; i++) d[i] = (a[i + 1] - a[i - 1]) / (2 * h);
    d[0] = (a[1] - a[0]) / h; d[n - 1] = (a[n - 1] - a[n - 2]) / h; return d;
  }
  function maxAbs(a, e) { let m = 0; for (let i = e; i < a.length - e; i++) m = Math.max(m, Math.abs(a[i])); return m; }
  function range(a, e) { let lo = Infinity, hi = -Infinity; for (let i = e; i < a.length - e; i++) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); } return hi - lo; }

  // ---------- the worlds: f(u, u'), its partials, and the equation of motion used to make true motions
  // Newton type (eq. 4 with f = ½|u'|² − V(u)); Weierstrass type (p. 7: f = n(u)·|u'|, homogeneous of first degree in u')
  const WORLDS = {
    floor: { id: 'floor', name: 'The open floor', type: 'newton', k: 0,
      line: 'A bead sliding on a flat floor. Nothing pushes it. The clock ticks evenly.',
      laws: { clock: 'ENERGY', across: 'SPEED ACROSS', up: 'SPEED UP', turn: 'SWEEP RATE' } },
    spring: { id: 'spring', name: 'The spring', type: 'newton', k: CONFIG.SPRING_K,
      line: 'A bead on a flat floor, tied to the centre by a spring. The clock ticks evenly.',
      first: { target: 'turn', law: 'SWEEP RATE', say: 'On every true motion of this world one thing holds steady: the rate at which the bead sweeps out area about the centre. Which lever stamps it?' },
      laws: { clock: 'ENERGY', turn: 'SWEEP RATE' } },
    glass: { id: 'glass', name: 'The glass', type: 'weierstrass',
      line: 'Light crossing glass that is denser lower down. It takes the quickest path. The clock is only a label along the ray.',
      laws: { across: 'LEAN × DENSITY' } },
    sheet: { id: 'sheet', name: 'The sheet', type: 'weierstrass',
      line: 'A bead rolling on a sheet with a well in the middle. It takes the straightest path the sheet allows. The clock is only a label.',
      first: { target: 'warpclock', law: 'ENERGY', say: 'In this world the clock tag comes out blank before you pull anything: it holds for every motion, real or fake. Pull the lever that says why.' },
      laws: { turn: 'SWEEP RATE' } },
  };
  function density(w, u1, u2) { // n(u) and its gradient, for the Weierstrass worlds
    if (w.id === 'glass') { const t = Math.tanh(CONFIG.GLASS_SLOPE * u2); return { n: CONFIG.GLASS_N0 - CONFIG.GLASS_DN * t, n1: 0, n2: -CONFIG.GLASS_DN * CONFIG.GLASS_SLOPE * (1 - t * t) }; }
    const r2 = u1 * u1 + u2 * u2, R2 = CONFIG.SHEET_R * CONFIG.SHEET_R, q = 1 + r2 / R2, n = CONFIG.SHEET_N0 + CONFIG.SHEET_DN / q;
    const dn = -CONFIG.SHEET_DN / (q * q) * (2 / R2); return { n, n1: dn * u1, n2: dn * u2 };
  }
  // f, ∂f/∂u, ∂f/∂u' at one point
  function fParts(w, u1, u2, v1, v2) {
    if (w.type === 'newton') return { f: 0.5 * (v1 * v1 + v2 * v2) - 0.5 * w.k * (u1 * u1 + u2 * u2), fu1: -w.k * u1, fu2: -w.k * u2, fp1: v1, fp2: v2 };
    const d = density(w, u1, u2), s = Math.sqrt(v1 * v1 + v2 * v2) || 1e-12;
    return { f: d.n * s, fu1: d.n1 * s, fu2: d.n2 * s, fp1: d.n * v1 / s, fp2: d.n * v2 / s };
  }
  // the fields along a path: f, fu, fp, and the Lagrange expressions ψ_i = ∂f/∂u_i − d/dx ∂f/∂u'_i (p. 4–5, eq. 4)
  function fields(w, path) {
    const n = path.u1.length, h = 1 / (n - 1), v1 = deriv(path.u1, h), v2 = deriv(path.u2, h);
    const f = new Float64Array(n), fu1 = new Float64Array(n), fu2 = new Float64Array(n), fp1 = new Float64Array(n), fp2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { const p = fParts(w, path.u1[i], path.u2[i], v1[i], v2[i]); f[i] = p.f; fu1[i] = p.fu1; fu2[i] = p.fu2; fp1[i] = p.fp1; fp2[i] = p.fp2; }
    const dfp1 = deriv(fp1, h), dfp2 = deriv(fp2, h), psi1 = new Float64Array(n), psi2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { psi1[i] = fu1[i] - dfp1[i]; psi2[i] = fu2[i] - dfp2[i]; }
    return { h, v1, v2, f, fu1, fu2, fp1, fp2, psi1, psi2 };
  }

  // ---------- the levers: infinitesimal transformations Δx, Δu (§2, p. 9), linear in a parameter ε or an arbitrary function p(x)
  const LEVERS = [
    { id: 'clock', label: 'SHIFT THE CLOCK', does: 'Start the clock a moment later. Everything else as it was.', free: false },
    { id: 'across', label: 'SHIFT ACROSS', does: 'Move the whole world a step sideways.', free: false },
    { id: 'up', label: 'SHIFT UP', does: 'Move the whole world a step up.', free: false },
    { id: 'turn', label: 'TURN', does: 'Turn the whole world a little about the centre.', free: false },
    { id: 'warpclock', label: 'WARP THE CLOCK', does: 'Re-tick the clock any way you like, differently at every moment. You draw how.', free: true },
    { id: 'warpfloor', label: 'WARP ACROSS', does: 'Shift the world sideways by a different amount at every moment. You draw how.', free: true },
  ];
  const leverById = id => LEVERS.find(l => l.id === id);
  // Δx(x), Δu(x, u) for a lever; p is the arbitrary function sampled on the grid (free levers only)
  function transformation(leverId, path, p) {
    const n = path.u1.length, dx = new Float64Array(n), du1 = new Float64Array(n), du2 = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      switch (leverId) {
        case 'clock': dx[i] = 1; break;
        case 'across': du1[i] = 1; break;
        case 'up': du2[i] = 1; break;
        case 'turn': du1[i] = -path.u2[i]; du2[i] = path.u1[i]; break;
        case 'warpclock': dx[i] = p[i]; break;
        case 'warpfloor': du1[i] = p[i]; break;
      }
    }
    return { dx, du1, du2 };
  }
  // δ̄u = Δu − u'·Δx (eq. 9)
  function variation(F, T) { const n = F.v1.length, d1 = new Float64Array(n), d2 = new Float64Array(n); for (let i = 0; i < n; i++) { d1[i] = T.du1[i] - F.v1[i] * T.dx[i]; d2[i] = T.du2[i] - F.v2[i] * T.dx[i]; } return { d1, d2 }; }
  // the Lie condition (11): δ̄f + d/dx(f·Δx) = 0, with δ̄f = Σ f_u δ̄u + Σ f_{u'} (δ̄u)'. Returns the largest residual relative to the size of the terms.
  function lieResidual(w, path, leverId, p) {
    const F = fields(w, path), T = transformation(leverId, path, p), D = variation(F, T), n = F.f.length;
    const dd1 = deriv(D.d1, F.h), dd2 = deriv(D.d2, F.h), fdx = new Float64Array(n);
    for (let i = 0; i < n; i++) fdx[i] = F.f[i] * T.dx[i];
    const dfdx = deriv(fdx, F.h); let res = 0, scale = CONFIG.B_FLOOR;
    for (let i = CONFIG.EDGE; i < n - CONFIG.EDGE; i++) {
      const a = F.fu1[i] * D.d1[i] + F.fu2[i] * D.d2[i], b = F.fp1[i] * dd1[i] + F.fp2[i] * dd2[i], c = dfdx[i];
      res = Math.max(res, Math.abs(a + b + c)); scale = Math.max(scale, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(F.f[i]));
    }
    return res / scale;
  }
  // the current B = A − f·Δx with A = −Σ f_{u'} δ̄u (eqs. 3, 4, 12): Σ ψ δ̄u = Div B. For Δx = ε, Δu = 0 this is ε·(Σ u' f_{u'} − f), the energy.
  function current(w, path, leverId, p) {
    const F = fields(w, path), T = transformation(leverId, path, p), D = variation(F, T), n = F.f.length, B = new Float64Array(n);
    for (let i = 0; i < n; i++) B[i] = -(F.fp1[i] * D.d1[i] + F.fp2[i] * D.d2[i] + F.f[i] * T.dx[i]);
    return B;
  }
  // the identity of Theorem II for a free lever (eq. 16 with σ = 0 here: δ̄u_i = a_i·p, so Σ a_i ψ_i = 0 identically).
  // For WARP THE CLOCK a_i = −u_i', so the identity is Σ ψ_i u_i' = 0 (p. 7); for WARP ACROSS a = (1, 0), so it would be ψ_1 = 0.
  function identityResidual(w, path, leverId) {
    const F = fields(w, path), n = F.f.length; let res = 0, scale = CONFIG.B_FLOOR;
    for (let i = CONFIG.EDGE; i < n - CONFIG.EDGE; i++) {
      let s, sc;
      if (leverId === 'warpclock') { s = F.psi1[i] * F.v1[i] + F.psi2[i] * F.v2[i]; sc = Math.abs(F.psi1[i] * F.v1[i]) + Math.abs(F.psi2[i] * F.v2[i]); }
      else { s = F.psi1[i]; sc = Math.abs(F.psi1[i]) + Math.abs(F.psi2[i]); }
      res = Math.max(res, Math.abs(s)); scale = Math.max(scale, sc);
    }
    return res / scale;
  }

  // ---------- paths: random smooth test paths, true motions (RK4 on the Lagrange equations), fakes
  function grid(n) { const x = new Float64Array(n); for (let i = 0; i < n; i++) x[i] = i / (n - 1); return x; }
  function randomPath(w, r, n) { // smooth, moving steadily across the window, so |u'| > 0 for the Weierstrass worlds
    n = n || CONFIG.N; const x = grid(n), u1 = new Float64Array(n), u2 = new Float64Array(n);
    // amplitudes chosen so that u1' stays above about 0.3: the Weierstrass integrand has a cusp at u' = 0 (p. 7, homogeneity)
    const a = (r() - 0.5) * 0.24, b = (r() - 0.5) * 0.6, c = (r() - 0.5) * 0.12, d = (r() - 0.5) * 0.1, ph = r() * 6.283, ph2 = r() * 6.283, y0 = (r() - 0.5) * 1.2;
    for (let i = 0; i < n; i++) { const t = x[i]; u1[i] = -0.9 + 1.8 * t + a * Math.sin(2 * Math.PI * t + ph) + c * Math.sin(4 * Math.PI * t); u2[i] = y0 + b * Math.sin(2 * Math.PI * t + ph2) + d * Math.cos(6 * Math.PI * t + ph); }
    return { x, u1, u2 };
  }
  function randomFree(r, n) { // an arbitrary function p(x), a few smooth modes, normalised to max 1
    n = n || CONFIG.N; const p = new Float64Array(n); const k = 2 + Math.floor(r() * 3), amps = [], phs = [];
    for (let j = 0; j < k; j++) { amps.push(r() - 0.5); phs.push(r() * 6.283); }
    let m = 0; for (let i = 0; i < n; i++) { const t = i / (n - 1); let s = 0; for (let j = 0; j < k; j++) s += amps[j] * Math.sin((j + 1) * Math.PI * t + phs[j]); p[i] = s; m = Math.max(m, Math.abs(s)); }
    for (let i = 0; i < n; i++) p[i] /= m || 1; return p;
  }
  // the equation of motion as a first-order system. Newton: u'' = −k u. Weierstrass, at constant |u'| = s (one choice of the free
  // clock; the ray equation): n·v' = s²∇n − (∇n·v)·v. Any re-ticking of a Weierstrass motion is also a true motion (p. 7).
  function accel(w, u1, u2, v1, v2) {
    if (w.type === 'newton') return [-w.k * u1, -w.k * u2];
    const d = density(w, u1, u2), s2 = v1 * v1 + v2 * v2, g = d.n1 * v1 + d.n2 * v2;
    return [(s2 * d.n1 - g * v1) / d.n, (s2 * d.n2 - g * v2) / d.n];
  }
  function integrate(w, u1, u2, v1, v2, n, clock) { // clock: optional map i → s_i (re-ticked), else s_i = i/(n−1)
    n = n || CONFIG.N; const x = grid(n), U1 = new Float64Array(n), U2 = new Float64Array(n);
    let s = [u1, u2, v1, v2]; const F = y => { const a = accel(w, y[0], y[1], y[2], y[3]); return [y[2], y[3], a[0], a[1]]; };
    for (let i = 0; i < n; i++) {
      U1[i] = s[0]; U2[i] = s[1]; if (i === n - 1) break;
      const h = clock ? clock(i + 1) - clock(i) : 1 / (n - 1);
      const k1 = F(s), s2 = s.map((v, j) => v + h / 2 * k1[j]), k2 = F(s2), s3 = s.map((v, j) => v + h / 2 * k2[j]), k3 = F(s3), s4 = s.map((v, j) => v + h * k3[j]), k4 = F(s4);
      s = s.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    }
    return { x, u1: U1, u2: U2, init: [u1, u2, v1, v2] };
  }
  function trueMotion(w, r, n) { // a true motion that stays in the window
    if (w.id === 'spring') { const ang = r() * 6.283, rad = 0.45 + r() * 0.3, om = Math.sqrt(w.k); return integrate(w, rad * Math.cos(ang), rad * Math.sin(ang), -rad * om * Math.sin(ang) * 0.6, rad * om * Math.cos(ang) * 0.6, n); }
    const y0 = (r() - 0.5) * 1.2, ang = (r() - 0.5) * 0.5, s = CONFIG.SPEED;
    return integrate(w, -0.95, y0, s * Math.cos(ang), s * Math.sin(ang), n);
  }
  function retick(w, path, amp) { // the same curve read against a re-ticked clock, x → x + amp·sin(2πx): re-integrated, so no interpolation noise
    const n = path.u1.length, map = i => { const t = i / (n - 1); return t + amp * Math.sin(2 * Math.PI * t); };
    const q = integrate(w, path.init[0], path.init[1], path.init[2], path.init[3], n, map); q.init = path.init; return q;
  }
  function bump(path, amp, dir1, dir2, centre, width) { // the Auditor's fake: a smooth bump added to a true motion
    const n = path.u1.length, u1 = new Float64Array(n), u2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), z = (t - centre) / width, g = Math.abs(z) < 1 ? Math.pow(Math.cos(Math.PI * z / 2), 2) : 0; u1[i] = path.u1[i] + amp * dir1 * g; u2[i] = path.u2[i] + amp * dir2 * g; }
    return { x: path.x, u1, u2 };
  }
  // the Auditor's batch for a world: true motions (one re-ticked) and fakes, each labelled by ψ, not by how it was made
  function auditorBatch(w, seed) {
    const r = rng(seed), out = [], base = trueMotion(w, r);
    out.push({ path: base, how: 'a true motion' });
    out.push({ path: retick(w, base, CONFIG.RETICK_AMP), how: 'the same curve, clock re-ticked' });
    out.push({ path: trueMotion(w, r), how: 'another true motion' });
    const A = CONFIG.BUMP_AMP;
    out.push({ path: bump(base, A, 1, 0, 0.5, 0.3), how: 'a fake: nudged across' });
    out.push({ path: bump(base, A, 0, 1, 0.45, 0.3), how: 'a fake: nudged up' });
    out.push({ path: bump(base, A, 0.7, 0.7, 0.6, 0.25), how: 'a fake: nudged slantwise' });
    out.push({ path: bump(base, -A, 0.3, -1, 0.75, 0.2), how: 'a fake: kicked near the end' });
    for (const o of out) { const F = fields(w, o.path); o.psi = Math.max(maxAbs(F.psi1, CONFIG.EDGE), maxAbs(F.psi2, CONFIG.EDGE)); o.isTrue = o.psi < CONFIG.TRUE_PSI_TOL; }
    return out;
  }

  // ---------- a pull: the press (Lie condition), the tag (B or the identity), the Auditor (proper / void)
  function pressTest(w, leverId, p, seed) { // true if the integral is invariant: the residual of (11) is small on every test path and function
    const lever = leverById(leverId), r = rng(seed * 7 + 1); let worst = 0;
    const funcs = lever.free ? [p || randomFree(r)].concat(Array.from({ length: CONFIG.FREE_FUNCS }, () => randomFree(r))) : [null];
    for (const q of funcs) for (let i = 0; i < CONFIG.LIE_PATHS; i++) worst = Math.max(worst, lieResidual(w, randomPath(w, r), leverId, q));
    return { holds: worst < CONFIG.LIE_TOL, residual: worst };
  }
  function audit(w, leverId, p, batch) { // reads B along each of the Auditor's motions
    const rows = batch.map(o => ({ how: o.how, isTrue: o.isTrue, B: current(w, o.path, leverId, p) }));
    let scale = CONFIG.B_FLOOR, fScale = CONFIG.B_FLOOR; for (const row of rows) scale = Math.max(scale, maxAbs(row.B, CONFIG.EDGE));
    for (const o of batch) fScale = Math.max(fScale, maxAbs(fields(w, o.path).f, CONFIG.EDGE));
    const blank = scale < CONFIG.BLANK_REL * fScale; // B vanishes identically (to rounding) against the size of f: a blank tag
    for (const row of rows) { row.drift = blank ? 0 : range(row.B, CONFIG.EDGE) / scale; row.steady = row.drift < (row.isTrue ? CONFIG.DRIFT_TRUE_TOL : CONFIG.DRIFT_FAKE_TOL); }
    const breaksOnTrue = rows.some(x => x.isTrue && !x.steady), catchesFake = rows.some(x => !x.isTrue && !x.steady);
    return { rows, scale, blank, kind: breaksOnTrue ? 'notlaw' : catchesFake ? 'teeth' : 'void' };
  }
  function pull(w, leverId, p, seed) {
    const lever = leverById(leverId), test = pressTest(w, leverId, p, seed), batch = auditorBatch(w, seed);
    if (!test.holds) return { kind: 'jam', lever, test, batch, tag: null, law: null };
    if (lever.free) {
      const r = rng(seed * 11 + 3); let worst = 0; for (let i = 0; i < CONFIG.LIE_PATHS; i++) worst = Math.max(worst, identityResidual(w, randomPath(w, r), leverId));
      return { kind: 'identity', lever, test, batch, identityResidual: worst, tag: 'IDENTITY', law: leverId === 'warpclock' ? 'The two equations of motion are not independent: one follows from the other.' : 'The first equation of motion holds for every path.' };
    }
    const a = audit(w, leverId, p, batch);
    return { kind: a.kind, lever, test, batch, audit: a, tag: w.laws[leverId] || 'CLOCK LAW', law: w.laws[leverId] || null };
  }

  // ---------- the game
  function newGame(seed) { return { seed: seed || 1, wi: 0, blanks: CONFIG.BLANKS, pulled: {}, rack: [], history: [], over: false }; }
  const world = g => WORLDS[CONFIG.WORLD_ORDER[g.wi]];
  function playPull(g, leverId, p) {
    const w = world(g); if (g.over || g.blanks <= 0 || g.pulled[leverId]) return null;
    const res = pull(w, leverId, p, g.seed * 100 + g.wi * 10 + Object.keys(g.pulled).length);
    g.pulled[leverId] = true; g.blanks--;
    const isTarget = !!(w.first && w.first.target === leverId);
    const entry = { world: w.id, lever: leverId, kind: res.kind, tag: res.tag, law: res.law, isTarget };
    g.rack.push(entry); g.history.push(entry); res.isTarget = isTarget; res.blanks = g.blanks; res.world = w;
    res.say = auditorSays(w, res);
    return res;
  }
  function auditorSays(w, res) {
    const L = res.lever.label.toLowerCase();
    if (res.kind === 'jam') return `The world moved when you pulled ${L}. Not a symmetry here. No tag.`;
    if (res.kind === 'identity') {
      const base = w.id === 'sheet' && res.isTarget ? 'A free hand. The shift of the clock is inside this warp, and a warp stamps no law. That is why the clock tag was blank: this world has no clock of its own.'
        : 'A free hand: the press held, but no law came out. What came out is an identity: the equations of motion are not independent. And the shift of the clock sits inside this warp, so its tag is blank here.';
      return base + (res.isTarget ? ' That is my answer.' : '');
    }
    if (res.kind === 'void') return `${res.tag}: the needle never moved, not on the true motions and not on the fakes. This tag holds for every motion there is. It says nothing. VOID.`;
    if (res.kind === 'teeth') return `${res.tag}: steady on the true motions, swinging on the fakes. A law with teeth.` + (res.isTarget ? ' That is mine; you found its lever.' : (w.first && !res.isTarget ? ' A law, but not the one I asked for.' : ''));
    return `${res.tag} drifted on a true motion. Not a law.`;
  }
  function nextWorld(g) { if (g.wi >= CONFIG.WORLD_ORDER.length - 1) { g.over = true; return null; } g.wi++; g.blanks = CONFIG.BLANKS; g.pulled = {}; g.rack = []; return world(g); }
  function verdict(g) {
    const H = g.history, has = (w, l, k) => H.some(e => e.world === w && e.lever === l && (!k || e.kind === k));
    const teeth = H.filter(e => e.kind === 'teeth').length, voids = H.filter(e => e.kind === 'void').length, jams = H.filter(e => e.kind === 'jam').length, ids = H.filter(e => e.kind === 'identity').length;
    const sawVoid = has('glass', 'clock', 'void') || has('sheet', 'clock', 'void'), warpGlass = has('glass', 'warpclock', 'identity'), answered = has('sheet', 'warpclock', 'identity');
    const sweep = has('spring', 'turn', 'teeth'), snell = has('glass', 'across', 'teeth');
    const headline = answered && sawVoid ? 'YOU ANSWERED HILBERT.' : answered ? 'YOU FOUND THE FREE HAND.' : sawVoid ? 'YOU SAW THE BLANK TAG.' : 'THE PRESS KEPT ITS SECRET.';
    const did = [];
    did.push(teeth === 0 ? 'You stamped no law with teeth.' : teeth === 1 ? 'You stamped one law with teeth.' : `You stamped ${['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][teeth] || teeth} laws with teeth.`);
    if (sawVoid) did.push('On the glass, the clock tag came out blank.'); else did.push('You never stamped the clock on the glass or the sheet, so you never saw a tag come out blank.');
    if (warpGlass) did.push('On the glass you warped the clock, and the press stamped an identity instead of a law.');
    if (answered) did.push('On the sheet you found the lever that blanks the clock tag: the free hand.'); else did.push('On the sheet you did not find the lever that blanks the clock tag.');
    if (sweep) did.push('On the spring you found the symmetry behind the sweep-rate law: a law with teeth points back to its symmetry.');
    if (snell) did.push('On the glass you stamped lean times density: the law of refraction, from a sideways shift.');
    return { headline, did, teeth, voids, jams, ids, sawVoid, warpGlass, answered, sweep, snell };
  }

  // ---------- for drawing: the Auditor's first-move picture and gauge values
  function lawValues(w, leverId, path, p) { return current(w, path, leverId, p); }
  function smoothCurve(samples, n) { // the player's drawn curve → p(x) on the grid, lightly smoothed, normalised to max 1
    n = n || CONFIG.N; const m = samples.length, p = new Float64Array(n); if (m < 2) return randomFree(rng(5), n);
    for (let i = 0; i < n; i++) { const j = i / (n - 1) * (m - 1), k = Math.min(m - 2, Math.floor(j)), fr = j - k; p[i] = samples[k] * (1 - fr) + samples[k + 1] * fr; }
    for (let pass = 0; pass < 6; pass++) { const q = Float64Array.from(p); for (let i = 1; i < n - 1; i++) p[i] = (q[i - 1] + 2 * q[i] + q[i + 1]) / 4; }
    let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(p[i])); if (mx > 0) for (let i = 0; i < n; i++) p[i] /= mx; return p;
  }

  return { CONFIG, WORLDS, LEVERS, leverById, rng, fields, fParts, density, lieResidual, current, identityResidual, randomPath, randomFree, trueMotion, integrate, retick, bump, auditorBatch, pressTest, audit, pull, newGame, world, playPull, nextWorld, verdict, lawValues, smoothCurve };
});
