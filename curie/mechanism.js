// Curie's Quartz — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build
// if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: RECONSTRUCTED, from the two-part table of currents in M. Skłodowska Curie, "Rayons émis par les composés de
// l'uranium et du thorium", Comptes rendus 126 (1898): 1101–1103. Every current below is a row of that table, in units of
// 1e-12 ampere, transcribed by hand from a scan of typeset text (the Académie des sciences archive PDF) and checked
// digit by digit against the scan. The instrument (a quartz whose charge holds the electrometer's spot at zero) is named
// on p. 1101; how it was worked by hand is from Curie's thesis (1903) and is tagged so. Everything else is ours and is
// tagged "ours".
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.CURIE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the yardstick and the threshold (the paper)
    UNIT_A: 24,                    // p. 1101, table row 1: "Uranium légèrement carburé 24 × 10^-12" A. Every reading is shown
                                   //   relative to it (pure uranium = 1); the amperes stay here and on the About screen.
    INACTIVE_BELOW: 1 / 100,       // p. 1101: substances studied and not in the table are "au moins 100 fois moins actives que
                                   //   l'uranium". Below this a thing counts as "nothing": the spot never moved.
    CONDENSER: { plateCm: 8, gapCm: 3, volts: 100 }, // p. 1101: "Diamètre des plateaux, 8cm; distance, 3cm"; 100 volts
    // ---- play (ours)
    PANELS: 9,                     // ours: nine panels on the album page; the first is pure uranium, so eight are the player's.
                                   //   Any jar, uranium included, can be measured again; each measurement is a panel. The
                                   //   paper's own path through the shelf, measured well, needs exactly eight.
    FIRST: 'uranium',              // ours: the first panel is pure uranium; the player's own reading of it is the yardstick for
                                   //   "what its uranium alone could give"
    SEED: 1898,                    // ours: the tremble of the spot only
    // ---- the electrometer and the quartz (ours, tuned for a thumb; thesis 1903 for the principle)
    // The spot s (−1 … 1 across the scale) is a leaky integrator of the difference between the plate's current i and the
    // quartz's counter-current r, both in units of pure uranium:  ds/dt = G·(i − r) − s/TAU + JITTER·√i·noise.
    // Its steady deflection is G·TAU·(i − r): it stands in the middle (|s| < BAND) when |i − r| < BAND/(G·TAU) ≈ 0.067.
    // Nothing on screen marks the middle except the scale's own 0.
    G: 1.5,                        // ours: scale widths per second per uranium of mismatch
    TAU: 1.0,                      // ours: seconds; the spot drifts back toward 0 when nothing pushes it (a leak)
    BAND: 0.1,                     // ours: how near 0 the spot must sit to count as standing, as a fraction of the half-scale
    JITTER: 0.05,                  // ours: tremble of the spot, scaled by √i (an inactive plate does not tremble at all)
    SLIDER_MAX: 4,                 // ours: the slider runs from no push to four times pure uranium's push (the table's
                                   //   largest row, pitchblende of Johanngeorgenstadt, is 83/24 ≈ 3.46)
    // ---- writing it down: what an honest reading says (ours)
    COMMIT_AFTER_S: 0.8,           // ours: WRITE IT DOWN wakes this long after the plate goes on, so the spot is seen to start
    STILL_MIN_S: 0.3,              // ours: a spot that has stood in the middle at least this long gives a value with an error bar;
                                   //   the bar's half-width is BAND/(G·T) + 2σ for T seconds standing, σ = JITTER·√(x·T)/(G·T),
                                   //   so it narrows the longer the spot stood (about ±0.2 after a third of a second, ±0.1 after a
                                   //   second and a half for pure uranium)
    ROUGH_H: 0.3,                  // ours: a spot not yet settled but pushed nearly level gives "roughly", ± this much
    ACTIVE_MIN: 0.05,              // ours: a reading whose bottom end is above this shows the plate moves the spot
    NOTHING_MAX: 0.15,             // ours: a reading whose top end is below this shows nothing the eye could see. (The paper's own
                                   //   threshold is a hundredth of uranium; this bench is too short to see that fine.)
    // ---- the rule, as the panels state it (ours; the paper's "en général, d'autant plus qu'ils contiennent plus
    //      d'uranium", p. 1102)
    MORE_RATIO: 1.3,               // ours: a reading whose bottom end is above 1.3 × its uranium share × the top of the player's own
                                   //   uranium reading is "MORE THAN ITS URANIUM"; one whose top end is below 1.3 × share × the bottom
                                   //   of it, and active, is "ABOUT ITS URANIUM". Every uranium compound reads 0.62–1.0 of its share in
                                   //   the table; the rocks 4.3–5.3. Any threshold from 1.1 to 4 gives the same panels for her values.
    // ---- the score: the claims of her note that the shelf can test (p. 1102). A claim counts when the player's own readings
    //      back it (claims() below says exactly what each needs).
    CLAIMS: [
      { id: 'salts',   text: 'Every uranium compound does it, about in proportion to its uranium.', src: 'p. 1102: "Tous les composés de l\'uranium étudiés sont actifs et le sont, en général, d\'autant plus qu\'ils contiennent plus d\'uranium."' },
      { id: 'thorium', text: 'Thorium does it too, with no uranium in it.', src: 'p. 1102: "Les composés du thorium sont très actifs."' },
      { id: 'thbeats', text: 'Thorium oxide even beats pure uranium.', src: 'p. 1102: "L\'oxyde de thorium dépasse même en activité l\'uranium métallique."' },
      { id: 'phos',    text: 'White phosphorus does it, but red phosphorus and phosphates do not: it is not the phosphorus itself.', src: 'p. 1102: "Le phosphore blanc est très actif, mais son action est probablement d\'une autre nature … le phosphore n\'est actif ni à l\'état de phosphore rouge ni à l\'état de phosphates."' },
      { id: 'rocks',   text: 'Pitchblende and chalcolite do far more than their uranium can.', src: 'p. 1102: "pechblende … et chalcolite … sont beaucoup plus actifs que l\'uranium lui-même."' },
      { id: 'copy',    text: 'The same chalcolite, made from pure chemicals, does not.', src: 'p. 1102: "cette chalcolite artificielle n\'est pas plus active qu\'un autre sel d\'uranium."' },
    ],
    // ---- the shelf. amps: the paper's table (p. 1101–1102), 1e-12 A. u: uranium by weight (ours: from the chemical formula
    //      for compounds, a typical value for pitchblende; the paper gives none). th: thorium by weight, ours, for the card.
    DRAWERS: [
      { id: 'uranium', label: 'Uranium and its salts', from: 'from M. Moissan and M. Étard' },        // p. 1101 note 2
      { id: 'museum',  label: 'Rocks from the Muséum', from: 'from M. Lacroix, with known mines' },   // p. 1101 note 2
      { id: 'rare',    label: 'Rare oxides and salts', from: 'from M. Demarçay' },                    // p. 1101 note 2; which rare
                                                                                                       //   oxide came from whom is ours
      { id: 'shelf',   label: "The chemist's shelf",   from: 'metals and everyday stuff' },          // ours: stands for the "at
                                                                                                       //   least 100 times less" class
      { id: 'make',    label: 'Make it yourself',      from: "by M. Debray's recipe" },               // p. 1102: "procédé de Debray"
    ],
    SUBSTANCES: [
      { id: 'uranium', drawer: 'uranium', name: 'Pure uranium', short: 'Uranium', amps: 24, u: 1.0, th: 0, src: 'table row 1',
        what: 'Uranium metal, made in M. Moissan\'s electric furnace. A little carbon in it.', look: 'metalpowder' },
      { id: 'greenox', drawer: 'uranium', name: 'Green uranium oxide', short: 'Green oxide', amps: 18, u: 0.85, th: 0, src: 'table row 3: "Oxyde vert d\'uranium U3O8 18"; u: U3O8 is 85 % uranium by weight (ours)',
        what: 'Uranium joined to oxygen: a dark olive-green powder.', look: 'olive' },
      { id: 'nitrate', drawer: 'uranium', name: 'Uranyl nitrate', short: 'Uranyl nitrate', amps: 7, u: 0.47, th: 0, src: 'table row 6: "Azotate d\'uranyle … environ 7"; u: UO2(NO3)2·6H2O is 47 % uranium (ours)',
        what: 'Yellow crystals: uranium with oxygen, nitrogen and water.', look: 'yellowcrystal' },
      { id: 'pbJG', drawer: 'museum', name: 'Pitchblende from Saxony', short: 'Pitchblende, Saxony', amps: 83, u: 0.65, th: 0, src: 'table p. 1102: "Pechblende de Johanngeorgenstadt 83"; u: typical, ours',
        what: 'A heavy black rock from the mines of Johanngeorgenstadt, in Saxony. Mostly uranium oxide, mixed with other rock. No thorium.', look: 'blackrock' },
      { id: 'pbJo', drawer: 'museum', name: 'Pitchblende from Bohemia', short: 'Pitchblende, Bohemia', amps: 67, u: 0.65, th: 0, src: 'table p. 1102: "de Joachimsthal et de Pzibran 67"; u: typical, ours',
        what: 'The same black rock, from the mines of Joachimsthal, in Bohemia. Mostly uranium oxide, mixed with other rock. No thorium.', look: 'blackrock2' },
      { id: 'chalc', drawer: 'museum', name: 'Chalcolite from a mine', short: 'Chalcolite, mined', amps: 52, u: 0.5, th: 0, src: 'table p. 1102: "Chalcolite naturelle 52"; u: Cu(UO2)2(PO4)2·8H2O is about 50 % uranium (ours)',
        what: 'Bright green crystals from a mine: copper, uranium and phosphate. No thorium.', look: 'greencrystal' },
      { id: 'thO', drawer: 'rare', name: 'Thin thorium oxide', short: 'Thorium, thin', amps: 22, u: 0, th: 0.88, src: 'table row 8: "Oxyde de thorium en couche de 0mm,25 d\'épaisseur 22"',
        what: 'A white powder of thorium, another rare metal. No uranium. Spread a quarter of a millimetre thick.', look: 'whitethin' },
      { id: 'thOthick', drawer: 'rare', name: 'Thick thorium oxide', short: 'Thorium, thick', amps: 53, u: 0, th: 0.88, src: 'table row 9: "Oxyde de thorium en couche de 6mm d\'épaisseur 53"',
        what: 'The same white thorium powder, spread six millimetres thick. No uranium.', look: 'whitethick' },
      { id: 'tantal', drawer: 'rare', name: 'A tantalum salt', short: 'Tantalum salt', amps: 2, u: 0, th: 0, src: 'table p. 1102: "Fluoxytantalate de potassium 2"; p. 1102: tantalum "semble être légèrement actif"',
        what: 'White crystals of tantalum, a rare metal, with potassium and fluorine. No uranium.', look: 'whitecrystal' },
      { id: 'lead', drawer: 'shelf', name: 'Lead', short: 'Lead', amps: 0, u: 0, th: 0, src: 'not in the table: "at least 100 times less active" (p. 1101)',
        what: 'A heavy metal. No uranium.', look: 'lead' },
      { id: 'gold', drawer: 'shelf', name: 'Gold', short: 'Gold', amps: 0, u: 0, th: 0, src: 'not in the table (p. 1101)',
        what: 'A heavy metal. No uranium.', look: 'gold' },
      { id: 'copper', drawer: 'shelf', name: 'Copper', short: 'Copper', amps: 0, u: 0, th: 0, src: 'not in the table (p. 1101)',
        what: 'The metal in chalcolite. No uranium.', look: 'copper' },
      { id: 'whiteP', drawer: 'shelf', name: 'White phosphorus', short: 'White phosphorus', amps: 31, u: 0, th: 0, src: 'p. 1102: "Le phosphore blanc est très actif"; no number given: 31 (1.3 × uranium) is ours',
        what: 'Waxy white sticks. They smoke in the air. No uranium.', look: 'whiteP' },
      { id: 'redP', drawer: 'shelf', name: 'Red phosphorus', short: 'Red phosphorus', amps: 0, u: 0, th: 0, src: 'p. 1102: phosphorus "n\'est actif ni à l\'état de phosphore rouge …"',
        what: 'The same element as white phosphorus, in another form: a dark red powder. No uranium.', look: 'redP' },
      { id: 'phosphate', drawer: 'shelf', name: 'Calcium phosphate', short: 'Phosphate', amps: 0, u: 0, th: 0, src: 'p. 1102: "… ni à l\'état de phosphates"',
        what: 'Phosphorus joined to calcium and oxygen: a white powder, as in bone ash. No uranium.', look: 'phosphate' },
      { id: 'chalcArt', drawer: 'make', name: 'Chalcolite made by you', short: 'Chalcolite, made', amps: 9, u: 0.5, th: 0, src: 'table row 7: "Chalcolite artificielle … 9"; p. 1102: "J\'ai reproduit la chalcolite par le procédé de Debray avec des produits purs"',
        what: 'You make the same green crystal yourself, from pure copper, pure phosphoric acid and a pure uranium salt. About half uranium, like the one from the mine.', look: 'greencrystalArt' },
    ],
    // ---- rows of the table not on the shelf, kept for the author (amps, 1e-12 A, p. 1101–1102)
    CUT: [
      { name: 'Oxyde noir d\'uranium U2O5', amps: 27 }, { name: 'Uranates d\'ammonium, de potassium, de sodium (environ)', amps: 12 },
      { name: 'Acide uranique hydraté', amps: 6 }, { name: 'Sulfate uraneux, sulfate d\'uranyle et de potassium (environ)', amps: 7 },
      { name: 'Sulfate de thorium', amps: 8 }, { name: 'Fluoxyniobate de potassium et oxyde de cérium', amps: 0.3 },
      { name: 'Pechblende de Cornwallis', amps: 16 }, { name: 'Autunite', amps: 27 }, { name: 'Thorites diverses', amps: [2, 14] },
      { name: 'Orangite', amps: 20 }, { name: 'Samarskite', amps: 11 },
      { name: 'Fergusonite, monazite, xénotime, niobite, æschinite', amps: [3, 7] }, { name: 'Clèveïte', amps: 'très active' },
    ],
    // ---- the paper's own page, shown on the end screen after the player's (p. 1101–1102)
    HER_PAGE: ['pbJG', 'pbJo', 'chalc', 'thOthick', 'uranium', 'greenox', 'thO', 'chalcArt', 'nitrate', 'lead'],
  };

  // ---------- small helpers
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rng) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const byId = {}; CONFIG.SUBSTANCES.forEach(s => { byId[s.id] = s; });
  function sub(id) { return byId[id]; }
  function strength(s) { return s.amps / CONFIG.UNIT_A; }           // the paper's reading, relative to pure uranium

  // ---------- words (no decimals on screen)
  function times(x) {  // how hard the push was, relative to pure uranium
    if (x < CONFIG.INACTIVE_BELOW) return 'no push at all';
    if (x < 0.15) return 'hardly any push';
    if (x < 0.9) {
      const F = [[1 / 4, 'about a quarter of'], [1 / 3, 'about a third of'], [1 / 2, 'about half'], [2 / 3, 'about two-thirds of'], [3 / 4, 'about three-quarters of']];
      let best = F[0]; F.forEach(f => { if (Math.abs(f[0] - x) < Math.abs(best[0] - x)) best = f; });
      return best[1] + ' the push of pure uranium';
    }
    if (x < 1.15) return 'about the push of pure uranium';
    if (x < 1.4) return 'a little more than the push of pure uranium';
    const h = Math.round(x * 2) / 2;
    const W = { 1.5: 'one and a half times', 2: 'twice', 2.5: 'two and a half times', 3: 'three times', 3.5: 'three and a half times', 4: 'four times' };
    return (W[h] || 'more than four times') + ' the push of pure uranium';
  }
  function bare(x) {  // the same without "about", for bounds: "at least half the push of pure uranium"
    const w = times(x);
    if (w === 'no push at all') return 'nothing';
    if (w === 'about the push of pure uranium') return 'the push of pure uranium';
    return w.replace(/^about /, '');
  }
  function shareWords(u) {
    if (u >= 0.99) return 'all uranium';
    if (u >= 0.8) return 'mostly uranium';
    if (u >= 0.6) return 'about two-thirds uranium';
    if (u >= 0.4) return 'about half uranium';
    if (u > 0) return 'a little uranium';
    return 'no uranium';
  }

  // ---------- a game
  function newGame(seed) { return { seed: seed === undefined ? CONFIG.SEED : seed, panels: [], tested: {} }; }
  function panelsLeft(g) { return CONFIG.PANELS - g.panels.length; }
  function over(g) { return g.panels.length >= CONFIG.PANELS; }
  function available(g) {  // the first panel is pure uranium; after that anything, again if you like
    if (!g.panels.length) return [sub(CONFIG.FIRST)];
    return CONFIG.SUBSTANCES.slice();
  }
  function canTest(g, id) { return !over(g) && available(g).some(s => s.id === id); }

  // ---------- the bench: one measurement
  function benchStart(g, id) {
    if (!canTest(g, id)) throw new Error('cannot test ' + id);
    const s = sub(id);
    return { id, i: strength(s), s: 0, v: 0, t: 0, hold: 0, r: 0, rng: mulberry32(g.seed * 31 + g.panels.length * 7919 + 1), acc: { r: 0, s: 0, s0: 0 } };
  }
  // r: the slider (the quartz's counter-current), in units of pure uranium. dt in seconds. Returns the state. Nothing here ends
  // the measurement: only the player does, with commit().
  function benchStep(st, dt, r) {
    const C = CONFIG; r = Math.max(0, Math.min(C.SLIDER_MAX, r)); st.r = r;
    const steps = Math.max(1, Math.ceil(dt / 0.01)), h = dt / steps, s0 = st.s;
    for (let k = 0; k < steps; k++) {
      const still = Math.abs(st.s) < C.BAND;
      if (still) { if (st.hold === 0) st.acc = { r: 0, s: 0, s0: st.s }; st.acc.r += r * h; st.acc.s += st.s * h; }
      const noise = st.i > 0 ? C.JITTER * Math.sqrt(st.i) * gauss(st.rng) * Math.sqrt(h) : 0;
      st.s += (C.G * (st.i - r) - st.s / C.TAU) * h + noise;
      st.s = Math.max(-1, Math.min(1, st.s));
      st.t += h;
      if (still) st.hold += h; else st.hold = 0;
    }
    st.v = (st.s - s0) / dt;
    return st;
  }
  function canCommit(st) { return st.t >= CONFIG.COMMIT_AFTER_S; }
  function tolerance() { return CONFIG.BAND / (CONFIG.G * CONFIG.TAU); }
  function running(st) {  // which way the spot is going, for the picture: 'right', 'left' or 'still'; 'pinned-…' at an end
    const pinned = Math.abs(st.s) > 0.97;
    if (pinned) return st.s > 0 ? 'pinned-right' : 'pinned-left';
    if (Math.abs(st.s) >= CONFIG.BAND && Math.abs(st.i - st.r) * CONFIG.G * CONFIG.TAU > CONFIG.BAND) return st.i > st.r ? 'right' : 'left';
    return 'still';
  }
  // What the instrument honestly says at the moment the player writes it down.
  //  held:    the spot has stood in the middle for T ≥ STILL_MIN_S seconds: the charge balance over those seconds (the push,
  //           averaged, plus what is left on the electrometer and what leaked), with an error bar that narrows as T grows.
  //  atleast: the spot is running right (the plate pushes harder than the quartz): at least the push.
  //  atmost:  running left: at most the push.
  //  rough:   not settled, but pushed nearly level: roughly the push, give or take ROUGH_H.
  function readingOf(st) {
    const C = CONFIG, m = st.i - st.r;
    if (st.hold >= C.STILL_MIN_S) {
      const T = st.hold, a = st.acc;
      const est = Math.max(0, a.r / T + ((st.s - a.s0) + a.s / C.TAU) / (C.G * T));
      const h = C.BAND / (C.G * T) + 2 * C.JITTER * Math.sqrt(est * T) / (C.G * T);
      return { type: 'held', est, lo: Math.max(0, est - h), hi: est + h, h, T };
    }
    if (m * C.G * C.TAU > C.BAND) return { type: 'atleast', est: st.r, lo: st.r, hi: Infinity };
    if (m * C.G * C.TAU < -C.BAND) return { type: 'atmost', est: st.r, lo: 0, hi: st.r };
    return { type: 'rough', est: st.r, lo: Math.max(0, st.r - C.ROUGH_H), hi: st.r + C.ROUGH_H, h: C.ROUGH_H };
  }
  function readShort(R) {  // the reading without its margin, for the last page
    if (R.type === 'held') return R.est < 0.05 ? 'nothing' : times(R.est);
    if (R.type === 'atleast') return R.lo < CONFIG.ACTIVE_MIN ? 'more than nothing' : 'at least ' + bare(R.lo);
    if (R.type === 'atmost') return 'at most ' + bare(R.hi);
    return 'roughly ' + bare(R.est);
  }
  function readWords(R) {
    if (R.type === 'held') return (R.est < 0.05 ? 'nothing' : times(R.est)) + ', give or take ' + (R.h < 0.12 ? 'a little' : R.h < 0.25 ? 'some' : 'a lot');
    if (R.type === 'atleast') return R.lo < CONFIG.ACTIVE_MIN ? 'more than nothing' : 'at least ' + bare(R.lo);
    if (R.type === 'atmost') return 'at most ' + bare(R.hi);
    return 'roughly ' + bare(R.est) + ', give or take a lot';
  }
  const HOW = {
    held: 'The spot was standing in the middle when you wrote it down.',
    atleast: 'The spot was still running right when you wrote it down: the plate was pushing harder than you were.',
    atmost: 'The spot was running left when you wrote it down: the plate was pushing less hard than you were.',
    rough: 'The spot had not settled when you wrote it down.',
  };

  // ---------- the player's own yardstick and what each reading shows
  function yard(g) {  // the player's best reading of pure uranium: the narrowest one
    const us = g.panels.filter(p => p.id === CONFIG.FIRST);
    if (!us.length) return null;
    return us.slice().sort((a, b) => (a.R.hi - a.R.lo) - (b.R.hi - b.R.lo))[0].R;
  }
  function active(R) { return R.type === 'atleast' || R.lo > CONFIG.ACTIVE_MIN; }
  function nothing(R) { return R.type !== 'atleast' && R.hi <= CONFIG.NOTHING_MAX; }
  function kindOf(s, R, U) {
    if (s.id === CONFIG.FIRST) return 'yardstick';
    if (s.u === 0) return active(R) ? 'without' : nothing(R) ? 'nothing' : 'unsure';
    if (U && R.lo > CONFIG.MORE_RATIO * s.u * U.hi) return 'more';
    if (U && active(R) && R.hi <= CONFIG.MORE_RATIO * s.u * U.lo) return 'about';
    if (nothing(R)) return 'nothing';
    return 'unsure';
  }
  function panelKind(g, p) { return kindOf(sub(p.id), p.R, yard(g)); }
  // the kind her own value would give, for the checks and for her page
  function paperKind(s) { const x = strength(s), R = { type: 'held', est: x, lo: x, hi: x }; return kindOf(s, R, { lo: 1, hi: 1 }); }
  const BADGE = { yardstick: 'YOUR YARDSTICK', nothing: 'NOTHING SEEN', without: 'NO URANIUM IN IT!', more: 'MORE THAN ITS URANIUM!', about: 'ABOUT ITS URANIUM', unsure: 'CAN’T TELL' };
  const KIND_LINE = {
    yardstick: s => 'This is your pure uranium: the yardstick for what the uranium in anything else could give.',
    nothing: s => 'Nothing you could see.',
    without: s => 'It has no uranium in it, and it moved the spot.',
    more: s => 'It is only ' + shareWords(s.u) + ': that is more than its uranium alone could give.',
    about: s => 'It is ' + shareWords(s.u) + ': about what its uranium gives, or less.',
    unsure: s => s.u > 0 ? 'Your reading cannot tell whether that is more than its uranium could give.' : 'Your reading cannot tell whether it moves the spot at all.',
  };

  // ---------- writing it down: one panel
  function commit(g, st) {
    if (!canCommit(st)) throw new Error('too soon');
    const s = sub(st.id), R = readingOf(st);
    const p = { n: g.panels.length + 1, id: s.id, name: s.name, short: s.short, look: s.look, u: s.u, R, paper: strength(s), seconds: st.t };
    g.panels.push(p); g.tested[s.id] = (g.tested[s.id] || 0) + 1;
    const k = panelKind(g, p);
    p.kind = k; p.badge = BADGE[k]; p.words = readWords(R);
    if (s.id === CONFIG.FIRST) p.words = p.words.replace('about the push of pure uranium', 'about her push').replace(' the push of pure uranium', ' her push');
    p.caption = s.name + ': ' + p.words + '. ' + HOW[R.type] + ' ' + KIND_LINE[k](s) + (s.id === CONFIG.FIRST ? '' : ' Hers: ' + times(strength(s)) + '.');
    // the two chalcolites: whichever comes second says what the first one gave, so the comparison is made on the bench
    const twin = { chalc: 'chalcArt', chalcArt: 'chalc' }[s.id], other = twin && g.panels.find(q => q.id === twin);
    if (other) p.caption += s.id === 'chalcArt' ? ' Your chalcolite from the mine: ' + readWords(other.R) + '.' : ' Your copy, made from pure chemicals: ' + readWords(other.R) + '.';
    return p;
  }
  const low = s => s.charAt(0).toLowerCase() + s.slice(1);
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  function found(g) {  // things the player's own page shows moving the spot with no uranium, or beyond their uranium (one per jar)
    const seen = {}, out = [];
    g.panels.forEach(p => { const k = panelKind(g, p); if ((k === 'without' || k === 'more') && !seen[p.id]) { seen[p.id] = 1; out.push({ p, k }); } });
    return out;
  }
  function foundLine(g) {
    const f = found(g);
    if (!g.panels.length) return 'Nothing measured yet.';
    if (!f.length) return 'Found so far, besides uranium: nothing yet.';
    return 'Found so far, besides uranium: ' + list(f.map(({ p, k }) => (k === 'more' ? 'something in ' : '') + low(p.name))) + '.';
  }

  // ---------- the score: which of her claims the player's own page backs
  function claims(g) {
    const U = yard(g), P = id => g.panels.filter(p => p.id === id), K = p => panelKind(g, p);
    const tested = ids => ids.filter(id => P(id).length);
    const firstWith = (ids, pred) => { for (const id of ids) for (const p of P(id)) if (pred(p)) return p; return null; };
    const your = p => (p.id === 'chalcArt' ? 'your own chalcolite' : 'your ' + low(p.name)) + ': ' + readShort(p.R);
    const cant = ids => 'your reading' + (ids.length > 1 || P(ids[0]).length > 1 ? 's' : '') + ' of ' + list(ids.map(id => low(sub(id).name))) + ' could not show it';
    const out = [];
    { // salts
      const ids = ['greenox', 'nitrate', 'chalcArt'], ok = firstWith(ids, p => K(p) === 'about'), t = tested(ids);
      out.push({ id: 'salts', backed: !!ok, why: ok ? your(ok) + ', about what its uranium gives' : !t.length ? 'you never measured a uranium salt' : cant(t) });
    }
    { // thorium
      const ids = ['thO', 'thOthick'], ok = firstWith(ids, p => K(p) === 'without'), t = tested(ids);
      out.push({ id: 'thorium', backed: !!ok, why: ok ? your(ok) : !t.length ? 'you never measured thorium' : cant(t) });
    }
    { // thorium beats uranium
      const ids = ['thO', 'thOthick'], ok = U && firstWith(ids, p => p.R.lo > U.hi), t = tested(ids);
      out.push({ id: 'thbeats', backed: !!ok, why: ok ? your(ok) + ', more than your pure uranium' : !t.length ? 'you never measured thorium' :
        (U && U.hi === Infinity ? 'your own pure-uranium reading was open-ended, so nothing could be shown to beat it' : cant(t) + ' (her thick layer beats uranium; her thin one does not quite)') });
    }
    { // phosphorus
      const w = firstWith(['whiteP'], p => K(p) === 'without'), n = firstWith(['redP', 'phosphate'], p => K(p) === 'nothing'), tn = tested(['redP', 'phosphate']);
      const why = w && n ? your(w) + '; ' + your(n) :
        !P('whiteP').length ? 'you never measured white phosphorus' : !w ? cant(['whiteP']) :
        !tn.length ? 'white phosphorus moved the spot, but you never measured red phosphorus or a phosphate' : cant(tn);
      out.push({ id: 'phos', backed: !!(w && n), why });
    }
    { // rocks
      const ids = ['pbJG', 'pbJo', 'chalc'], ok = firstWith(ids, p => K(p) === 'more'), t = tested(ids);
      out.push({ id: 'rocks', backed: !!ok, why: ok ? your(ok) + ', and it is only ' + shareWords(ok.u) : !t.length ? 'you never measured a rock from the Muséum' :
        (U && U.hi === Infinity ? 'your own pure-uranium reading was open-ended, so nothing could be shown to beat its uranium' : cant(t)) });
    }
    { // the copy
      const c = firstWith(['chalcArt'], p => K(p) === 'about'), m = firstWith(['chalc'], p => K(p) === 'more');
      const why = c && m ? your(c) + '; ' + your(m) : !P('chalcArt').length ? 'you never made the copy' : !P('chalc').length ? 'you made the copy, but never measured the chalcolite from the mine to set it against' :
        !c ? cant(['chalcArt']) : cant(['chalc']);
      out.push({ id: 'copy', backed: !!(c && m), why });
    }
    return out.map(o => Object.assign({ text: CONFIG.CLAIMS.find(c => c.id === o.id).text }, o));
  }

  // ---------- the verdict
  function verdict(g) {
    const cl = claims(g), n = cl.filter(c => c.backed).length;
    const headline = n === 6 ? 'Your page backs all six claims in her note.' : 'Your page backs ' + ['none', 'one', 'two', 'three', 'four', 'five'][n] + ' of the six claims in her note.';
    const fate = n === 6 ? 'You could have signed her note.' : n >= 4 ? 'Most of her note, in your own measurements.' :
      n >= 2 ? 'A start on her note.' : n === 1 ? 'One line of her note.' : 'Her note would have had to wait.';
    const did = 'You made ' + (g.panels.length - 1) + ' measurement' + (g.panels.length === 2 ? '' : 's') + ' after your first pure uranium. ' +
      (found(g).length ? 'Your page shows the spot moved by ' + list(found(g).map(({ p }) => low(p.name))) + '.' : 'Your page shows nothing besides uranium moving the spot.');
    const both = cl.find(c => c.id === 'rocks').backed && cl.find(c => c.id === 'copy').backed;
    const paper = 'Marie Curie tested dozens of metals, salts, oxides and rocks. Every uranium compound does it, about in proportion to its uranium. Thorium does it too. And two uranium rocks, pitchblende and chalcolite, do it far more than the uranium in them can. She made chalcolite herself from pure chemicals, and her copy was no stronger than any uranium salt.';
    const means = (both ? 'Your page backs her last two claims, and so her conclusion. ' : 'Her conclusion rests on the last two claims. ') +
      'The rocks hold something no bottle in Paris held: these minerals "may contain an element much more active than uranium."';
    const later = 'After this note, and not in it: in July 1898 she and Pierre Curie announced one such element, traced in pitchblende, and named it polonium; in December, a second: radium.';
    const her = CONFIG.HER_PAGE.map(id => { const s = sub(id); return { id, name: s.name, short: s.short, look: s.look, u: s.u, x: strength(s), kind: paperKind(s), words: times(strength(s)) }; });
    return { n, headline, fate, did, claims: cl, paper, means, later, her };
  }

  return { CONFIG, sub, strength, times, bare, shareWords, newGame, panelsLeft, over, available, canTest,
    benchStart, benchStep, canCommit, tolerance, running, readingOf, readWords, readShort, commit, yard, kindOf, panelKind, paperKind, BADGE,
    found, foundLine, claims, verdict, mulberry32 };
});
