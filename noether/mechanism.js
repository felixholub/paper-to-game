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
    SPRING_K: Math.pow(2 * Math.PI * 0.4, 2),    // a spring back to the centre: four tenths of a swing in the window's tick, short of the half swing beyond which the true path stops being the path of smallest S
    GLASS_N0: 1.3, GLASS_DN: 0.5, GLASS_SLOPE: 2.5,  // glass density n(u2) = N0 − DN·tanh(SLOPE·u2): denser lower down, 0.8 to 1.8
    SHEET_N0: 1.0, SHEET_DN: 0.6, SHEET_R: 0.35,     // sheet stretch n(r) = N0 + DN/(1 + (r/R)^2): a well at the centre
    SPEED: 2.2,                // our choice: path length a true motion covers in one window tick on the floor, the glass and the sheet
    PREVIEW_SIZE: 0.25,        // our choice (display only): how far the window's preview of a lever moves the world, in floor units; the press tests the infinitesimal change
    TICK_EVERY: 20,            // our choice (display only): grid points between the clock ticks drawn on a trail (twenty ticks per motion)
    SHOWN_MOTIONS: [0, 4],      // our choice (display only): which of the Auditor's seven motions are played in the window after the player's own test path; all seven are read
    RETICK_SHOW: 0.12,         // our choice (display only): how far the shown re-ticking moves the clock, in trip units; kept monotone
    PLATE_UNIT: 1000,          // our choice (display only): the best path's size reads 1000 on the numbers plate, so a change of a few parts in a thousand is visible without decimals
    OPENING_TRIES: 3,          // our choice: how many paths the player may draw against the best path in the first formula
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
  // Each world is one formula S = ∫ f dt: the plate shows it (formula), the line under it says it in words and what it draws.
  // rule: what the drawing never does (used when the formula cares). first: the Auditor's opening move, where he has one.
  const WORLDS = {
    floor: { id: 'floor', name: 'The free dot', type: 'newton', k: 0,
      formula: 'S = ∫ ½(x′² + y′²) dt', words: 'it adds up speed² along the path (x′ is how fast x changes)',
      line: 'This formula adds up speed² along a path. It draws a dot that nothing pushes: a straight line at a steady pace. The dots on the trail are the clock ticks.',
      rule: 'A dot nothing pushes keeps a straight line at a steady pace.',
      laws: { clock: 'ENERGY', across: 'SPEED RIGHT', up: 'SPEED UP', turn: 'SWEEP RATE' } },
    spring: { id: 'spring', name: 'The spring', type: 'newton', k: CONFIG.SPRING_K,
      formula: 'S = ∫ ½(x′² + y′²) − ½k(x² + y²) dt', words: 'speed² minus stretch² (k is how stiff the spring is)',
      line: 'This formula adds up speed² minus stretch². It draws a dot tied to the centre peg by a spring, swinging round the peg at the tempo the spring sets.',
      rule: 'The spring is tied to the centre peg: the swing must sit on the peg, at the tempo the spring sets.',
      first: { target: 'turn', law: 'SWEEP RATE', say: 'I already hold a prize for this formula: SWEEP RATE, x·y′ − y·x′. Watch the shaded fan the dot sweeps round the peg: it grows evenly. Every prize comes from a change the formula does not care about. Which change is this one? Pull it.' },
      laws: { clock: 'ENERGY', turn: 'SWEEP RATE' } },
    glass: { id: 'glass', name: 'The glass', type: 'weierstrass',
      formula: 'S = ∫ n(y) · √(x′² + y′²) dt', words: 'density × distance, with n(y) the density of the glass at height y',
      line: 'This formula adds up density × distance. It draws light bending through glass that is denser lower down. The ticks are only labels on the ray: the formula never asks how fast the ray is traced.',
      rule: 'The ray must bend the way the density says; only the clock labels along it are free.',
      laws: { across: 'LEAN × DENSITY' } },
    sheet: { id: 'sheet', name: 'The sheet', type: 'weierstrass',
      formula: 'S = ∫ n(x, y) · √(x′² + y′²) dt', words: 'density × distance, with n thickest at the well in the middle',
      line: 'This formula adds up density × distance, with the sheet thickest at the well. It draws a dot taking the straightest route the sheet allows. The ticks are only labels, as on the glass.',
      rule: 'The route must follow the stretch of the sheet; only the clock labels along it are free.',
      first: { target: 'warpclock', law: 'ENERGY', say: 'Here the clock prize is empty before you do anything: its number comes out the same on every path, good or bad. An empty prize means "start the clock later" is only one piece of a bigger change this formula does not care about. Pull that bigger change.' },
      laws: { turn: 'SWEEP RATE' } },
  };
  // what each prize's number is: a formula and plain words
  const LAWS = {
    'ENERGY': { formula: '½(x′² + y′²) + ½k(x² + y²)', gloss: 'speed² plus stretch²' },
    'SPEED RIGHT': { formula: 'x′', gloss: 'how fast the dot moves to the right' },
    'SPEED UP': { formula: 'y′', gloss: 'how fast the dot moves up' },
    'SWEEP RATE': { formula: 'x·y′ − y·x′', gloss: 'how fast the dot sweeps out area round the centre' },
    'LEAN × DENSITY': { formula: 'n(y) · x′ / √(x′² + y′²)', gloss: 'the lean of the ray times the density of the glass (the law of refraction)' },
    'CLOCK LAW': { formula: 'x′·∂f/∂x′ + y′·∂f/∂y′ − f', gloss: 'the number "start the clock later" gives' },
  };
  const GLOSS = {}; for (const k in LAWS) GLOSS[k] = LAWS[k].gloss;
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
  // does: what the lever does to the drawing; shows: what the window's preview is showing
  const LEVERS = [
    { id: 'clock', label: 'CLOCK LATER', does: 'Start the clock a little later. The same drawing, every tick a little later.', shows: 'clock later', free: false },
    { id: 'across', label: 'MOVE RIGHT', does: 'Move the whole drawing one step to the right.', shows: 'moved right', free: false },
    { id: 'up', label: 'MOVE UP', does: 'Move the whole drawing one step up.', shows: 'moved up', free: false },
    { id: 'turn', label: 'TURN', does: 'Turn the whole drawing a little round the centre.', shows: 'turned', free: false },
    { id: 'warpclock', label: 'RE-TICK THE CLOCK', does: 'Let the clock run fast here and slow there, any way you like. You draw how; the ticks bunch and spread.', shows: 'clock re-ticked, one way', free: true },
    { id: 'warpfloor', label: 'WOBBLE SIDEWAYS', does: 'Push the drawing right or left by a different amount at every moment. You draw how.', shows: 'wobbled, one way', free: true },
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

  // ---------- the number the formula gives a path: S = ∫ f dt (trapezoid on the grid), and the paths the player draws
  function score(w, path) { const F = fields(w, path), n = F.f.length; let s = 0; for (let i = 1; i < n; i++) s += (F.f[i] + F.f[i - 1]) / 2 * F.h; return s; }
  function strokeToPath(points, n, ends) { // a drawn stroke (array of [u1, u2]) → a path on the grid, traced at a steady pace (uniform in arc length), lightly smoothed
    n = n || CONFIG.N; let pts = points.slice();
    if (ends) pts = [ends[0]].concat(pts, [ends[1]]);   // the opening draw goes from A to B: the ends are glued on
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1] || 1e-9, u1 = new Float64Array(n), u2 = new Float64Array(n); let j = 0;
    for (let i = 0; i < n; i++) { const t = i / (n - 1) * L; while (j < cum.length - 2 && cum[j + 1] < t) j++; const seg = (cum[j + 1] - cum[j]) || 1e-9, fr = Math.max(0, Math.min(1, (t - cum[j]) / seg)); u1[i] = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * fr; u2[i] = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * fr; }
    for (let pass = 0; pass < 8; pass++) { const a = Float64Array.from(u1), b = Float64Array.from(u2); for (let i = 1; i < n - 1; i++) { u1[i] = (a[i - 1] + 2 * a[i] + a[i + 1]) / 4; u2[i] = (b[i - 1] + 2 * b[i] + b[i + 1]) / 4; } }
    return { x: grid(n), u1, u2, length: L };
  }
  // the drawing after a change, traced as the change says (display, and the numbers plate): the same curve for the clock levers,
  // read against the changed clock; moved, turned or wobbled curves for the others. A free function is tapered to zero at the ends
  // so the trip still runs from the same start to the same finish and the two numbers compare like with like.
  function changedPath(leverId, path, p, size) {
    const n = path.u1.length, u1 = new Float64Array(n), u2 = new Float64Array(n), a = size || CONFIG.PREVIEW_SIZE;
    const sample = s => { const j = Math.max(0, Math.min(n - 1, s * (n - 1))), k = Math.min(n - 2, Math.floor(j)), fr = j - k; return [path.u1[k] * (1 - fr) + path.u1[k + 1] * fr, path.u2[k] * (1 - fr) + path.u2[k + 1] * fr]; };
    const taper = t => Math.sin(Math.PI * t) ** 2;
    let clock = null;
    if (leverId === 'warpclock') { // the re-ticked clock s(t): the same curve read at a new pace; kept monotone so the curve is never retraced
      clock = new Float64Array(n); const minStep = 0.15 / (n - 1);
      for (let i = 0; i < n; i++) { const t = i / (n - 1), q = p ? p[i] : Math.sin(2 * Math.PI * t); clock[i] = t - CONFIG.RETICK_SHOW * q * taper(t); if (i && clock[i] < clock[i - 1] + minStep) clock[i] = clock[i - 1] + minStep; }
      const c0 = clock[0], c1 = clock[n - 1]; for (let i = 0; i < n; i++) clock[i] = (clock[i] - c0) / (c1 - c0);
    }
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), q = p ? p[i] : Math.sin(2 * Math.PI * t); let r;
      switch (leverId) {
        case 'clock': u1[i] = path.u1[i]; u2[i] = path.u2[i]; break;                                             // the same trip, counted from a later zero
        case 'across': u1[i] = path.u1[i] + a; u2[i] = path.u2[i]; break;
        case 'up': u1[i] = path.u1[i]; u2[i] = path.u2[i] + a; break;
        case 'turn': { const c = Math.cos(a * 1.2), sn = Math.sin(a * 1.2); u1[i] = c * path.u1[i] - sn * path.u2[i]; u2[i] = sn * path.u1[i] + c * path.u2[i]; break; }
        case 'warpclock': r = sample(clock[i]); u1[i] = r[0]; u2[i] = r[1]; break;
        case 'warpfloor': u1[i] = path.u1[i] + a * q * taper(t); u2[i] = path.u2[i]; break;
      }
    }
    return { x: path.x, u1, u2 };
  }
  // the numbers the plate shows: the formula's number for each path before and after a change, scaled so the best path's size reads 1000.
  // Whether the formula cares is decided by the press itself (the Lie condition on random paths), never by these two numbers.
  function plateScale(w, path) { const F = fields(w, path), n = F.f.length; let s = 0; for (let i = 1; i < n; i++) s += (Math.abs(F.f[i]) + Math.abs(F.f[i - 1])) / 2 * F.h; return CONFIG.PLATE_UNIT / (s || 1e-9); }
  function numbers(w, leverId, paths, p, scale, seed) {
    const holds = pressTest(w, leverId, p, seed || 1).holds;
    return { holds, rows: paths.map(path => { const b = score(w, path), c = leverId === 'clock' ? b : score(w, changedPath(leverId, path, p)); return { before: Math.round(b * scale), after: Math.round(c * scale) }; }) };
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
    res.plain = plainResult(w, res);
    res.say = auditorSays(w, res);
    return res;
  }
  // the game's own account of what just happened, in plain words, before the Auditor comments
  function plainResult(w, res) {
    const L = res.lever.label.toLowerCase(); let law = LAWS[res.tag] || { formula: '', gloss: 'its number' };
    if (res.tag === 'ENERGY' && !w.k) law = { formula: '½(x′² + y′²)', gloss: 'speed² (there is no spring here, so no stretch²)' };
    if (res.kind === 'jam') return `The formula cares about ${L}: the numbers changed. ${w.rule} No prize; one blank spent.`;
    if (res.kind === 'identity') {
      const which = res.lever.id === 'warpclock' ? 'a clock re-ticked any way you like' : 'a wobble drawn any way you like';
      return `The formula does not care about ${which}: the numbers stayed the same. But no prize came out. A change with a free hand in it gives a rule instead of a number: the formula's two equations of motion are not independent, one follows from the other. ` +
        (res.lever.id === 'warpclock' ? 'And "start the clock later" is one special way of re-ticking, so its prize is empty here.' : '');
    }
    if (res.kind === 'void') return `The formula does not care about ${L}, so a prize was stamped: ${law.gloss}. But its number came out the same on the best path, on your path, and on every path the Auditor tried. A number that never changes on any path, even the bad ones, tells you nothing. The prize is empty.`;
    if (res.kind === 'teeth') return `The formula does not care about ${L}, so you win a prize: ${law.gloss}, ${law.formula}. Its number stayed the same along the best path and changed along paths the dot would never take. That is a real prize: it tells the best path from the others.`;
    return `The formula did not care, but ${law.gloss} changed along the best path. Not a prize.`;
  }
  function auditorSays(w, res) {
    if (res.kind === 'jam') return 'The formula noticed. Nothing to stamp.';
    if (res.kind === 'identity') {
      if (w.id === 'sheet' && res.isTarget) return 'That is my answer. "Start the clock later" sits inside this free hand, and a free hand wins no prize. This formula has no clock of its own.';
      return 'A rule, not a number. Watch what that does to the clock prize.';
    }
    if (res.kind === 'void') return 'Empty. It holds on every path, so it tells me nothing.';
    if (res.kind === 'teeth') return 'A real prize. Keep it.' + (res.isTarget ? ' That is mine; you found its change.' : (w.first && !res.isTarget ? ' A prize, but not the one I asked about.' : ''));
    return 'Not a prize.';
  }
  function nextWorld(g) { if (g.wi >= CONFIG.WORLD_ORDER.length - 1) { g.over = true; return null; } g.wi++; g.blanks = CONFIG.BLANKS; g.pulled = {}; g.rack = []; return world(g); }
  function verdict(g) {
    const H = g.history, has = (w, l, k) => H.some(e => e.world === w && e.lever === l && (!k || e.kind === k));
    const teeth = H.filter(e => e.kind === 'teeth').length, voids = H.filter(e => e.kind === 'void').length, jams = H.filter(e => e.kind === 'jam').length, ids = H.filter(e => e.kind === 'identity').length;
    const sawVoid = has('glass', 'clock', 'void') || has('sheet', 'clock', 'void'), warpGlass = has('glass', 'warpclock', 'identity'), answered = has('sheet', 'warpclock', 'identity');
    const sweep = has('spring', 'turn', 'teeth'), snell = has('glass', 'across', 'teeth');
    const headline = answered && sawVoid ? 'YOU ANSWERED HILBERT.' : answered ? 'YOU FOUND THE FREE HAND.' : sawVoid ? 'YOU SAW THE EMPTY PRIZE.' : 'THE PRESS KEPT ITS SECRET.';
    const did = [];
    did.push(teeth === 0 ? 'You won no real prize.' : teeth === 1 ? 'You won one real prize.' : `You won ${['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][teeth] || teeth} real prizes: numbers that stay the same along the best path and on no other.`);
    if (sawVoid) did.push('On the glass, the clock prize came out empty: a number that stays the same on every path.'); else did.push('You never tried the clock on the glass or the sheet, so you never saw a prize come out empty.');
    if (warpGlass) did.push('On the glass you re-ticked the clock freely, and the formula did not care: a rule came out instead of a number.');
    if (answered) did.push('On the sheet you found the change that empties the clock prize: the free hand.'); else did.push('On the sheet you did not find the change that empties the clock prize.');
    if (sweep) did.push('On the spring you found the change behind the sweep-rate prize: a real prize points back to a change the formula does not care about.');
    if (snell) did.push('On the glass you won lean times density: the law of refraction, from moving the drawing sideways.');
    return { headline, did, teeth, voids, jams, ids, sawVoid, warpGlass, answered, sweep, snell };
  }

  // ---------- for drawing: the Auditor's first-move picture and gauge values
  function lawValues(w, leverId, path, p) { return current(w, path, leverId, p); }
  const previewPath = changedPath;
  function smoothCurve(samples, n) { // the player's drawn curve → p(x) on the grid, lightly smoothed, normalised to max 1
    n = n || CONFIG.N; const m = samples.length, p = new Float64Array(n); if (m < 2) return randomFree(rng(5), n);
    for (let i = 0; i < n; i++) { const j = i / (n - 1) * (m - 1), k = Math.min(m - 2, Math.floor(j)), fr = j - k; p[i] = samples[k] * (1 - fr) + samples[k + 1] * fr; }
    for (let pass = 0; pass < 6; pass++) { const q = Float64Array.from(p); for (let i = 1; i < n - 1; i++) p[i] = (q[i - 1] + 2 * q[i] + q[i + 1]) / 4; }
    let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(p[i])); if (mx > 0) for (let i = 0; i < n; i++) p[i] /= mx; return p;
  }

  return { CONFIG, WORLDS, LAWS, GLOSS, LEVERS, score, strokeToPath, changedPath, numbers, plateScale, leverById, rng, fields, fParts, density, lieResidual, current, identityResidual, randomPath, randomFree, trueMotion, integrate, retick, bump, auditorBatch, pressTest, audit, pull, newGame, world, playPull, nextWorld, verdict, lawValues, previewPath, smoothCurve };
});
