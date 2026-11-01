// Noether's Press — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build
// if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: PORTED. Noether (1918), Invariante Variationsprobleme, Gött. Nachr. 1918, 235–257 (equation numbers are the paper's;
// page numbers are the Wikisource PDF's). Each world is one integral S = ∫ f(t, u, u′) dt with u = (x, y) and first
// derivatives, of the two types the paper names: the ordinary integral of mechanics (§1, eq. 4: f = ½|u′|² − V(t, u)) and the
// Weierstrass parametric integral, homogeneous of first degree in u′ (p. 7). Each card asks whether a change of the picture
// matters; the answer is the paper's invariance condition (eq. 11), computed on random paths, never written in by hand. The
// prize of a change that does not matter is the current B of eqs. 3, 4, 12 and 13; whether it has teeth or is empty (§6,
// "eigentlich" / "uneigentlich") is read along true motions and fakes. Every tunable number is in CONFIG with its reason.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.NOETHER = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the grid (ours; the paper's t is continuous)
    N: 400,                    // points on the trip t in [0, 1]; the identities are checked to O(h²)
    EDGE: 4,                   // grid points dropped at each end when reading ψ and B (one-sided differences there)
    // ---- the invariance condition, eq. (11): δ̄f + d/dt(f·Δt) = 0 identically, on every test path (ours: the tolerance)
    LIE_TOL: 1e-2, LIE_PATHS: 6, FREE_FUNCS: 3,
    // ---- proper against improper (§6): a prize has teeth if it holds on true motions and fails on some fake; empty if it holds on all
    TRUE_PSI_TOL: 0.05, DRIFT_TRUE_TOL: 0.02, DRIFT_FAKE_TOL: 0.10, B_FLOOR: 1e-9, BLANK_REL: 1e-7,
    BUMP_AMP: 0.18,            // our choice: size of a fake's bump, in window units (the window is about 3.5 by 2.2)
    // ---- the worlds (ours: chosen for a visible arc, a visible swing, a visible slide)
    G: 7,                      // the ball's gravity
    GROW: 0.8,                 // in the growing-gravity world the pull is G·(1 + GROW·t): stronger later
    MAGNET: { x: 0.55, y: -0.15, m: 4, s: 0.4 },   // a magnet to the right: V adds −m·exp(−r²/s²), r the distance to it
    PEG_K: Math.pow(2 * Math.PI * 0.9, 2),          // the spring to the peg: nine tenths of a swing per trip
    WIND: 12,                  // a wind blowing east on the swing: V adds −WIND·x
    SLIDE_H: 1.3,              // the slide: n(y) = 1/√(H − y), the brachistochrone's time integrand; H sits just above A
    // ---- the finite changes shown on the cards (display and the numbers plate; the verdict is eq. 11 on infinitesimal changes)
    DELAY: 0.4,                // "five past three": the later start, in trip units
    SHIFT: 0.45,               // "one step to the left", in window units
    ANGLE: 0.6,                // "turn a little", in radians
    RETICK: 0.22,              // how far the shown re-ticking moves the clock, in trip units; kept monotone
    SAME_TOL: 5e-3,            // two numbers on the plate count as the same below this relative difference
    // ---- display
    TICK_EVERY: 20, PLATE_UNIT: 1000, OPENING_TRIES: 3,
  };

  // ---------- small numerics
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rng = seed => mulberry32(seed >>> 0);
  function deriv(a, h) { const n = a.length, d = new Float64Array(n); for (let i = 1; i < n - 1; i++) d[i] = (a[i + 1] - a[i - 1]) / (2 * h); d[0] = (a[1] - a[0]) / h; d[n - 1] = (a[n - 1] - a[n - 2]) / h; return d; }
  function maxAbs(a, e) { let m = 0; for (let i = e; i < a.length - e; i++) m = Math.max(m, Math.abs(a[i])); return m; }
  function range(a, e) { let lo = Infinity, hi = -Infinity; for (let i = e; i < a.length - e; i++) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); } return hi - lo; }
  function grid(n) { const x = new Float64Array(n); for (let i = 0; i < n; i++) x[i] = i / (n - 1); return x; }

  // ---------- the worlds: V(t, u) and its gradient for the Newton type; n(u) for the slide
  const C = CONFIG;
  const WORLDS = {
    ball: { id: 'ball', type: 'newton', name: 'The thrown ball',
      V: (t, x, y) => [C.G * y, 0, C.G],
      start: { p: [-0.95, -0.85], v: [2.1, 3.7], jit: 0.15 },
      formula: 'S = ∫ ½(x′² + y′²) − g·y dt', words: 'speed² minus height, added up along the trip (x′ is how fast x changes; g is the pull of gravity)' },
    grow: { id: 'grow', type: 'newton', name: 'Gravity that grows',
      V: (t, x, y) => { const g = C.G * (1 + C.GROW * t); return [g * y, 0, g]; },
      start: { p: [-0.95, -0.85], v: [2.1, 4.8], jit: 0.15 },
      formula: 'S = ∫ ½(x′² + y′²) − g·(1 + a·t)·y dt', words: 'the same, but the pull of gravity grows with the time t on the clock' },
    magnet: { id: 'magnet', type: 'newton', name: 'The ball and the magnet',
      V: (t, x, y) => { const M = C.MAGNET, dx = x - M.x, dy = y - M.y, e = Math.exp(-(dx * dx + dy * dy) / (M.s * M.s)), k = 2 * M.m / (M.s * M.s) * e; return [C.G * y - M.m * e, k * dx, C.G + k * dy]; },
      start: { p: [-0.95, -0.85], v: [2.1, 3.7], jit: 0.12 },
      formula: 'S = ∫ ½(x′² + y′²) − g·y + m·e^(−r²) dt', words: 'the thrown ball, plus a magnet: r is the distance from the ball to the magnet' },
    peg: { id: 'peg', type: 'newton', name: 'The swing round the peg',
      V: (t, x, y) => [0.5 * C.PEG_K * (x * x + y * y), C.PEG_K * x, C.PEG_K * y],
      start: { p: [0.85, 0], v: [0, 3.2], jit: 0.1 },
      formula: 'S = ∫ ½(x′² + y′²) − ½k·(x² + y²) dt', words: 'speed² minus the stretch of a spring tied to the peg (k is how stiff it is)' },
    wind: { id: 'wind', type: 'newton', name: 'The swing in the wind',
      V: (t, x, y) => [0.5 * C.PEG_K * (x * x + y * y) - C.WIND * x, C.PEG_K * x - C.WIND, C.PEG_K * y],
      start: { p: [0.85, 0], v: [0, 3.2], jit: 0.1 },
      formula: 'S = ∫ ½(x′² + y′²) − ½k·(x² + y²) + w·x dt', words: 'the same swing, plus a wind blowing east (w is how strong it is)' },
    slide: { id: 'slide', type: 'weierstrass', name: 'The slide',
      start: { p: [-0.95, 0.9], ang: -0.8, speed: 2.2, jit: 0.04 },
      formula: 'S = ∫ √(x′² + y′²) / √(h − y) dt', words: 'distance ÷ √drop: the time it takes to slide, where h − y is how far the dot has dropped' },
  };
  function density(w, u1, u2) { const d = Math.max(1e-3, C.SLIDE_H - u2); return { n: 1 / Math.sqrt(d), n1: 0, n2: 0.5 * Math.pow(d, -1.5) }; }
  // f, ∂f/∂u, ∂f/∂u′ at one point
  function fParts(w, t, u1, u2, v1, v2) {
    if (w.type === 'newton') { const V = w.V(t, u1, u2); return { f: 0.5 * (v1 * v1 + v2 * v2) - V[0], fu1: -V[1], fu2: -V[2], fp1: v1, fp2: v2 }; }
    const d = density(w, u1, u2), s = Math.sqrt(v1 * v1 + v2 * v2) || 1e-12;
    return { f: d.n * s, fu1: d.n1 * s, fu2: d.n2 * s, fp1: d.n * v1 / s, fp2: d.n * v2 / s };
  }
  // the fields along a path, with the clock started t0 later: f, fu, fp, and the Lagrange expressions ψ_i = ∂f/∂u_i − d/dt ∂f/∂u′_i
  function fields(w, path, t0) {
    t0 = t0 || 0; const n = path.u1.length, h = 1 / (n - 1), v1 = deriv(path.u1, h), v2 = deriv(path.u2, h);
    const f = new Float64Array(n), fu1 = new Float64Array(n), fu2 = new Float64Array(n), fp1 = new Float64Array(n), fp2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { const p = fParts(w, t0 + i * h, path.u1[i], path.u2[i], v1[i], v2[i]); f[i] = p.f; fu1[i] = p.fu1; fu2[i] = p.fu2; fp1[i] = p.fp1; fp2[i] = p.fp2; }
    const dfp1 = deriv(fp1, h), dfp2 = deriv(fp2, h), psi1 = new Float64Array(n), psi2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { psi1[i] = fu1[i] - dfp1[i]; psi2[i] = fu2[i] - dfp2[i]; }
    return { h, v1, v2, f, fu1, fu2, fp1, fp2, psi1, psi2 };
  }
  function score(w, path, t0) { const F = fields(w, path, t0), n = F.f.length; let s = 0; for (let i = 1; i < n; i++) s += (F.f[i] + F.f[i - 1]) / 2 * F.h; return s; }

  // ---------- the changes: infinitesimal transformations Δt, Δu (§2), linear in a parameter or an arbitrary function p(t)
  const LEVERS = {
    clock: { id: 'clock', label: 'START THE CLOCK LATER', free: false },
    across: { id: 'across', label: 'MOVE IT', free: false },
    turn: { id: 'turn', label: 'TURN IT', free: false },
    warpclock: { id: 'warpclock', label: 'RE-TICK THE CLOCK', free: true },
  };
  function transformation(leverId, path, p) {
    const n = path.u1.length, dx = new Float64Array(n), du1 = new Float64Array(n), du2 = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      if (leverId === 'clock') dx[i] = 1;
      else if (leverId === 'across') du1[i] = 1;
      else if (leverId === 'turn') { du1[i] = -path.u2[i]; du2[i] = path.u1[i]; }
      else if (leverId === 'warpclock') dx[i] = p[i];
    }
    return { dx, du1, du2 };
  }
  function variation(F, T) { const n = F.v1.length, d1 = new Float64Array(n), d2 = new Float64Array(n); for (let i = 0; i < n; i++) { d1[i] = T.du1[i] - F.v1[i] * T.dx[i]; d2[i] = T.du2[i] - F.v2[i] * T.dx[i]; } return { d1, d2 }; }
  // eq. (11), with f carrying its explicit t: the residual of Σ f_u δ̄u + Σ f_u′ (δ̄u)′ + d/dt(f·Δt), relative to the size of its terms
  function lieResidual(w, path, leverId, p) {
    const F = fields(w, path), T = transformation(leverId, path, p), D = variation(F, T), n = F.f.length;
    const dd1 = deriv(D.d1, F.h), dd2 = deriv(D.d2, F.h), fdx = new Float64Array(n);
    for (let i = 0; i < n; i++) fdx[i] = F.f[i] * T.dx[i];
    const dfdx = deriv(fdx, F.h); let res = 0, scale = C.B_FLOOR;
    for (let i = C.EDGE; i < n - C.EDGE; i++) {
      const a = F.fu1[i] * D.d1[i] + F.fu2[i] * D.d2[i], b = F.fp1[i] * dd1[i] + F.fp2[i] * dd2[i], c = dfdx[i];
      res = Math.max(res, Math.abs(a + b + c)); scale = Math.max(scale, Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(F.f[i]));
    }
    return res / scale;
  }
  // the prize: B = −(Σ f_u′ δ̄u + f·Δt) (eqs. 3, 4, 12). For the clock shift this is Σ u′ f_u′ − f, the energy.
  function current(w, path, leverId, p) {
    const F = fields(w, path), T = transformation(leverId, path, p), D = variation(F, T), n = F.f.length, B = new Float64Array(n);
    for (let i = 0; i < n; i++) B[i] = -(F.fp1[i] * D.d1[i] + F.fp2[i] * D.d2[i] + F.f[i] * T.dx[i]);
    return B;
  }
  // the rule of Theorem II for the re-ticked clock (eq. 16, p. 7): Σ ψ_i u_i′ = 0 on every path
  function identityResidual(w, path) {
    const F = fields(w, path), n = F.f.length; let res = 0, scale = C.B_FLOOR;
    for (let i = C.EDGE; i < n - C.EDGE; i++) { res = Math.max(res, Math.abs(F.psi1[i] * F.v1[i] + F.psi2[i] * F.v2[i])); scale = Math.max(scale, Math.abs(F.psi1[i] * F.v1[i]) + Math.abs(F.psi2[i] * F.v2[i])); }
    return res / scale;
  }

  // ---------- paths
  function randomPath(w, r, n) { // smooth test paths across the window, moving steadily (the slide's integrand has a cusp at u′ = 0)
    n = n || C.N; const x = grid(n), u1 = new Float64Array(n), u2 = new Float64Array(n);
    const a = (r() - 0.5) * 0.24, b = (r() - 0.5) * 0.6, c = (r() - 0.5) * 0.12, d = (r() - 0.5) * 0.1, ph = r() * 6.283, ph2 = r() * 6.283, y0 = (r() - 0.5) * 1.0 - (w.id === 'slide' ? 0.2 : 0);
    for (let i = 0; i < n; i++) { const t = x[i]; u1[i] = -0.9 + 1.8 * t + a * Math.sin(2 * Math.PI * t + ph) + c * Math.sin(4 * Math.PI * t); u2[i] = y0 + b * Math.sin(2 * Math.PI * t + ph2) + d * Math.cos(6 * Math.PI * t + ph); }
    return { x, u1, u2 };
  }
  function randomFree(r, n) { n = n || C.N; const p = new Float64Array(n); const k = 2 + Math.floor(r() * 3), amps = [], phs = []; for (let j = 0; j < k; j++) { amps.push(r() - 0.5); phs.push(r() * 6.283); } let m = 0; for (let i = 0; i < n; i++) { const t = i / (n - 1); let s = 0; for (let j = 0; j < k; j++) s += amps[j] * Math.sin((j + 1) * Math.PI * t + phs[j]); p[i] = s; m = Math.max(m, Math.abs(s)); } for (let i = 0; i < n; i++) p[i] /= m || 1; return p; }
  // the equation of motion. Newton: u″ = −∇V(t, u). Slide, at constant |u′| = s (one choice of the free clock): n·v′ = s²∇n − (∇n·v)·v.
  function accel(w, t, u1, u2, v1, v2) {
    if (w.type === 'newton') { const V = w.V(t, u1, u2); return [-V[1], -V[2]]; }
    const d = density(w, u1, u2), s2 = v1 * v1 + v2 * v2, g = d.n1 * v1 + d.n2 * v2;
    return [(s2 * d.n1 - g * v1) / d.n, (s2 * d.n2 - g * v2) / d.n];
  }
  function integrate(w, init, n, t0, clock) { // RK4; t0 starts the clock later; clock maps the grid to a re-ticked time
    n = n || C.N; t0 = t0 || 0; const x = grid(n), U1 = new Float64Array(n), U2 = new Float64Array(n);
    let s = init.slice(); const F = (y, t) => { const a = accel(w, t, y[0], y[1], y[2], y[3]); return [y[2], y[3], a[0], a[1]]; };
    for (let i = 0; i < n; i++) {
      U1[i] = s[0]; U2[i] = s[1]; if (i === n - 1) break;
      const ta = clock ? clock(i) : i / (n - 1), h = clock ? clock(i + 1) - clock(i) : 1 / (n - 1), t = t0 + ta;
      const k1 = F(s, t), s2 = s.map((v, j) => v + h / 2 * k1[j]), k2 = F(s2, t + h / 2), s3 = s.map((v, j) => v + h / 2 * k2[j]), k3 = F(s3, t + h / 2), s4 = s.map((v, j) => v + h * k3[j]), k4 = F(s4, t + h);
      s = s.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    }
    return { x, u1: U1, u2: U2, init: init.slice() };
  }
  function startOf(w, r) { // the world's throw, with a small jitter when r is given
    const st = w.start, j = r ? () => (r() - 0.5) * st.jit : () => 0;
    if (w.type === 'newton') return [st.p[0], st.p[1], st.v[0] + j() * 3, st.v[1] + j() * 3];
    const ang = st.ang + j(); return [st.p[0], st.p[1] + j(), st.speed * Math.cos(ang), st.speed * Math.sin(ang)];
  }
  const trueMotion = (w, r, n, t0) => integrate(w, startOf(w, r), n, t0);
  function bump(path, amp, dir1, dir2, centre, width) {
    const n = path.u1.length, u1 = new Float64Array(n), u2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), z = (t - centre) / width, g = Math.abs(z) < 1 ? Math.pow(Math.cos(Math.PI * z / 2), 2) : 0; u1[i] = path.u1[i] + amp * dir1 * g; u2[i] = path.u2[i] + amp * dir2 * g; }
    return { x: path.x, u1, u2 };
  }
  function retickedTrue(w, path, amp) { const n = path.u1.length; return integrate(w, path.init, n, 0, i => { const t = i / (n - 1); return t + amp * Math.sin(2 * Math.PI * t); }); }
  // the test motions: true ones (one re-ticked) and fakes, labelled by ψ, not by how they were made
  function testBatch(w, seed) {
    const r = rng(seed), out = [], base = trueMotion(w, null);
    out.push({ path: base, how: 'the real trip' });
    out.push({ path: retickedTrue(w, base, 0.12), how: 'the same curve, clock re-ticked' });
    out.push({ path: trueMotion(w, r), how: 'another real trip' });
    const A = C.BUMP_AMP;
    out.push({ path: bump(base, A, 0.6, 0.8, 0.5, 0.3), how: 'a fake: bent in the middle' });
    out.push({ path: bump(base, A, 1, 0, 0.35, 0.25), how: 'a fake: nudged sideways' });
    out.push({ path: bump(base, -A, 0.3, -1, 0.7, 0.2), how: 'a fake: kicked near the end' });
    for (const o of out) { const F = fields(w, o.path); o.psi = Math.max(maxAbs(F.psi1, C.EDGE), maxAbs(F.psi2, C.EDGE)); o.isTrue = o.psi < C.TRUE_PSI_TOL * Math.max(1, maxAbs(F.fu1, C.EDGE) + maxAbs(F.fu2, C.EDGE)); }
    return out;
  }

  // ---------- the verdict: does the change matter? (eq. 11 on random paths, and for the re-ticked clock on random functions too)
  function matters(w, leverId, seed) {
    const r = rng((seed || 1) * 7 + 1), lever = LEVERS[leverId]; let worst = 0;
    const funcs = lever.free ? Array.from({ length: C.FREE_FUNCS }, () => randomFree(r)) : [null];
    for (const q of funcs) for (let i = 0; i < C.LIE_PATHS; i++) worst = Math.max(worst, lieResidual(w, randomPath(w, r), leverId, q));
    return { matters: worst >= C.LIE_TOL, residual: worst };
  }
  // ---------- the prize: teeth (holds on true motions, fails on a fake) or empty (holds on everything)
  function audit(w, leverId, batch) {
    const rows = batch.map(o => ({ how: o.how, isTrue: o.isTrue, B: current(w, o.path, leverId, null) }));
    let scale = C.B_FLOOR, fScale = C.B_FLOOR; for (const row of rows) scale = Math.max(scale, maxAbs(row.B, C.EDGE));
    for (const o of batch) fScale = Math.max(fScale, maxAbs(fields(w, o.path).f, C.EDGE));
    const blank = scale < C.BLANK_REL * fScale;
    for (const row of rows) { row.drift = blank ? 0 : range(row.B, C.EDGE) / scale; row.steady = row.drift < (row.isTrue ? C.DRIFT_TRUE_TOL : C.DRIFT_FAKE_TOL); }
    const breaksOnTrue = rows.some(x => x.isTrue && !x.steady), catchesFake = rows.some(x => !x.isTrue && !x.steady);
    return { rows, scale, blank, kind: breaksOnTrue ? 'notlaw' : catchesFake ? 'teeth' : 'empty' };
  }
  // the prize's line along any path, for the graph: B(t) − B(start), on the audit's scale (zero when the prize is empty)
  function prizeLine(w, leverId, path, a) { const B = current(w, path, leverId, null), B0 = B[C.EDGE], n = B.length, out = new Float64Array(n); for (let i = 0; i < n; i++) out[i] = a.blank ? 0 : (B[Math.max(C.EDGE, Math.min(i, n - 1 - C.EDGE))] - B0) / a.scale; return out; }

  // ---------- the finite change shown on a card: the new trip, where it would go if the change did not matter, and the numbers
  function rotate(path, ang) { const c = Math.cos(ang), s = Math.sin(ang), n = path.u1.length, u1 = new Float64Array(n), u2 = new Float64Array(n); for (let i = 0; i < n; i++) { u1[i] = c * path.u1[i] - s * path.u2[i]; u2[i] = s * path.u1[i] + c * path.u2[i]; } return { x: path.x, u1, u2 }; }
  function shift(path, d) { const n = path.u1.length, u1 = new Float64Array(n); for (let i = 0; i < n; i++) u1[i] = path.u1[i] + d; return { x: path.x, u1, u2: Float64Array.from(path.u2) }; }
  function reticked(path, p) { // the same curve read against a re-ticked clock, monotone, the same start and finish
    const n = path.u1.length, clock = new Float64Array(n), minStep = 0.15 / (n - 1), u1 = new Float64Array(n), u2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), q = p ? p[i] : Math.sin(2 * Math.PI * t); clock[i] = t - C.RETICK * q * Math.sin(Math.PI * t) ** 2; if (i && clock[i] < clock[i - 1] + minStep) clock[i] = clock[i - 1] + minStep; }
    const c0 = clock[0], c1 = clock[n - 1];
    for (let i = 0; i < n; i++) { const s = (clock[i] - c0) / (c1 - c0) * (n - 1), k = Math.min(n - 2, Math.floor(s)), fr = s - k; u1[i] = path.u1[k] * (1 - fr) + path.u1[k + 1] * fr; u2[i] = path.u2[k] * (1 - fr) + path.u2[k + 1] * fr; }
    return { x: path.x, u1, u2 };
  }
  function plateScale(w, path) { const F = fields(w, path), n = F.f.length; let s = 0; for (let i = 1; i < n; i++) s += (Math.abs(F.f[i]) + Math.abs(F.f[i - 1])) / 2 * F.h; return C.PLATE_UNIT / (s || 1e-9); }
  function showChange(w, leverId) {
    const base = trueMotion(w, null), n = base.u1.length, sc = plateScale(w, base), before = score(w, base);
    let fresh, expected, after;
    if (leverId === 'clock') { fresh = integrate(w, base.init, n, C.DELAY); expected = base; after = score(w, base, C.DELAY); }
    else if (leverId === 'across') { const s0 = base.init.slice(); s0[0] -= C.SHIFT; fresh = integrate(w, s0, n); expected = shift(base, -C.SHIFT); after = score(w, expected); }
    else if (leverId === 'turn') { const c = Math.cos(C.ANGLE), s = Math.sin(C.ANGLE), i0 = base.init; fresh = integrate(w, [c * i0[0] - s * i0[1], s * i0[0] + c * i0[1], c * i0[2] - s * i0[3], s * i0[2] + c * i0[3]], n); expected = rotate(base, C.ANGLE); after = score(w, expected); }
    else { fresh = reticked(base, null); expected = base; after = score(w, fresh); }
    let dev = 0; for (let i = 0; i < n; i++) dev = Math.max(dev, Math.hypot(fresh.u1[i] - expected.u1[i], fresh.u2[i] - expected.u2[i]));
    return { base, fresh, expected, curveGap: dev, before: Math.round(before * sc), after: Math.round(after * sc), same: Math.abs(after - before) < C.SAME_TOL * Math.max(Math.abs(before), 1e-9) };
  }

  // ---------- the deck. Each card's answer is computed (matters, above); the words say what the computation found.
  const PRIZES = {
    'ENERGY': { formula: '½(x′² + y′²) + g·y', gloss: 'speed² plus height' },
    'SIDEWAYS SPEED': { formula: 'x′', gloss: 'how fast the ball moves sideways' },
    'SPIN': { formula: 'x·y′ − y·x′', gloss: 'how fast the dot sweeps round the peg' },
    'SLIDE ENERGY': { formula: 'x′·∂f/∂x′ + y′·∂f/∂y′ − f  =  0', gloss: 'the energy of the slide' },
  };
  const CARDS = [
    { id: 'c1', world: 'ball', lever: 'clock', prize: 'ENERGY',
      setup: 'A ball is thrown at three o\'clock.', change: 'Throw it again, exactly the same way, at five past three.',
      reveal: 'It doesn\'t matter. The throw at five past three flies exactly the same arc, and the formula gives the trip the same number. When the formula doesn\'t care when the trip starts, there is a prize: energy, speed² plus height, the same at every moment of the flight.' },
    { id: 'c2', world: 'grow', lever: 'clock', prize: null,
      setup: 'The same ball, but here gravity grows a little stronger every minute.', change: 'Throw it again, exactly the same way, at five past three.',
      reveal: 'It matters. At five past three gravity is stronger, so the later throw falls short, and the formula gives the trip a different number. When the rules change with the clock, no energy stays the same. No prize.' },
    { id: 'c3', world: 'ball', lever: 'across', prize: 'SIDEWAYS SPEED',
      setup: 'A ball is thrown from here.', change: 'Throw it the same way from one step to the left.',
      reveal: 'It doesn\'t matter. From one step to the left the ball flies the same arc, one step to the left, and gets the same number. When the formula doesn\'t care where the trip happens, there is a prize: the sideways speed x′, the same all along the flight.' },
    { id: 'c4', world: 'magnet', lever: 'across', prize: null,
      setup: 'The same throw, but now a magnet stands to the right and pulls the ball.', change: 'Throw it the same way from one step to the left.',
      reveal: 'It matters. From one step to the left the ball passes farther from the magnet and bends differently; a different number. With the magnet there, the sideways speed changes in flight. No prize.' },
    { id: 'c5', world: 'peg', lever: 'turn', prize: 'SPIN',
      setup: 'A dot on a spring swings round a peg.', change: 'Turn the whole picture a little round the peg.',
      reveal: 'It doesn\'t matter. Turned round the peg, the swing is the same swing, turned, with the same number. When the formula doesn\'t care which way the picture faces, there is a prize: spin, x·y′ − y·x′, how fast the dot sweeps round the peg.' },
    { id: 'c6', world: 'wind', lever: 'turn', prize: null,
      setup: 'The same swing, but a wind blows east.', change: 'Turn the whole picture a little round the peg.',
      reveal: 'It matters. The wind still blows east after you turn the picture, so the turned swing drifts differently; a different number. While the wind blows, no spin prize.' },
    { id: 'c7', world: 'ball', lever: 'warpclock', prize: null,
      setup: 'Back to the thrown ball.', change: 'Re-tick the clock: let it run fast here and slow there. The same arc, but the ball now speeds up and slows down along it.',
      reveal: 'It matters. A ball that speeds up and slows down for no reason is not a thrown ball, and the formula gives it a different number. For the ball the ticking of the clock is real, and so its energy prize is real.' },
    { id: 'c8', world: 'slide', lever: 'clock', prize: 'SLIDE ENERGY',
      setup: 'A dot slides from A down to B. Its formula counts the time of the slide, and reads only the shape of the curve.', change: 'Start the slide five minutes later.',
      reveal: 'It doesn\'t matter: the same slide, started later, is the same slide, with the same number. So there should be a prize, the slide\'s energy. Watch its line.' },
    { id: 'c9', world: 'slide', lever: 'warpclock', prize: null,
      setup: 'The same slide.', change: 'Re-tick the clock: fast here, slow there. The same curve, with the ticks bunched and spread.',
      reveal: 'It doesn\'t matter. The slide\'s formula reads only the shape of the curve, never how fast it is traced, so re-tick it any way you like and the number stays the same. A change you can make differently at every moment wins no prize; it wins a rule instead: the two equations of motion are not independent (ψ₁x′ + ψ₂y′ = 0). And "start the clock later" is just one way of re-ticking. That is why the slide\'s energy was empty.' },
  ];
  // the computed answer and prize kind for every card
  function playCard(card, seed) {
    const w = WORLDS[card.world], m = matters(w, card.lever, seed), ch = showChange(w, card.lever);
    let a = null; if (!m.matters && !LEVERS[card.lever].free) a = audit(w, card.lever, testBatch(w, (seed || 1) * 13 + 5));
    return { card, world: w, matters: m.matters, residual: m.residual, change: ch, audit: a, kind: m.matters ? 'none' : LEVERS[card.lever].free ? 'rule' : a.kind };
  }

  // ---------- drawn paths
  function strokeToPath(points, n, ends) {
    n = n || C.N; let pts = points.slice(); if (ends) pts = [ends[0]].concat(pts, [ends[1]]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1] || 1e-9, u1 = new Float64Array(n), u2 = new Float64Array(n); let j = 0;
    for (let i = 0; i < n; i++) { const t = i / (n - 1) * L; while (j < cum.length - 2 && cum[j + 1] < t) j++; const seg = (cum[j + 1] - cum[j]) || 1e-9, fr = Math.max(0, Math.min(1, (t - cum[j]) / seg)); u1[i] = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * fr; u2[i] = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * fr; }
    for (let pass = 0; pass < 8; pass++) { const a = Float64Array.from(u1), b = Float64Array.from(u2); for (let i = 1; i < n - 1; i++) { u1[i] = (a[i - 1] + 2 * a[i] + a[i + 1]) / 4; u2[i] = (b[i - 1] + 2 * b[i] + b[i + 1]) / 4; } }
    return { x: grid(n), u1, u2 };
  }

  // ---------- the end
  function verdict(answers) { // answers: { cardId: 'matters' | 'not' }
    const fooled = [], names = { c1: 'the later throw', c2: 'gravity that grows', c3: 'the step to the left', c4: 'the magnet', c5: 'the turned swing', c6: 'the wind', c7: 'the re-ticked ball', c8: 'the later slide', c9: 'the re-ticked slide' };
    const shelf = [];
    for (const card of CARDS) {
      const res = playCard(card, 1), said = answers[card.id], right = said && ((said === 'matters') === res.matters);
      if (said && !right) fooled.push(names[card.id]);
      if (card.prize) shelf.push({ name: card.prize, kind: res.kind, mine: said === 'not' });
    }
    const real = shelf.filter(s => s.kind === 'teeth').length, empty = shelf.filter(s => s.kind === 'empty').length;
    const words = ['no', 'one', 'two', 'three', 'four', 'five'];
    const headline = `${words[real].toUpperCase()} REAL PRIZE${real === 1 ? '' : 'S'} AND ${words[empty].toUpperCase()} EMPTY ONE.`;
    const line = fooled.length === 0 ? 'You judged every change right.' : fooled.length === 1 ? `You were fooled once: by ${fooled[0]}.` : `You were fooled by ${fooled.slice(0, -1).join(', ')} and ${fooled[fooled.length - 1]}.`;
    return { headline, line, shelf, fooled };
  }
  function smoothCurve(samples, n) { n = n || C.N; const m = samples.length, p = new Float64Array(n); for (let i = 0; i < n; i++) { const j = i / (n - 1) * (m - 1), k = Math.min(m - 2, Math.floor(j)), fr = j - k; p[i] = samples[k] * (1 - fr) + samples[k + 1] * fr; } for (let pass = 0; pass < 6; pass++) { const q = Float64Array.from(p); for (let i = 1; i < n - 1; i++) p[i] = (q[i - 1] + 2 * q[i] + q[i + 1]) / 4; } let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(p[i])); if (mx > 0) for (let i = 0; i < n; i++) p[i] /= mx; return p; }

  return { CONFIG, WORLDS, LEVERS, CARDS, PRIZES, rng, density, fields, score, lieResidual, current, identityResidual, randomPath, randomFree, integrate, trueMotion, bump, retickedTrue, testBatch, matters, audit, prizeLine, showChange, plateScale, reticked, playCard, strokeToPath, verdict, smoothCurve };
});
