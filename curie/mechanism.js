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
    PANELS: 9,                     // ours: nine panels on the album page; the first is pure uranium (the yardstick), so eight
                                   //   are the player's, from fifteen. The paper's own path through the shelf needs exactly eight.
    FIRST: 'uranium',              // ours: the first panel is fixed; it teaches the balance and makes the yardstick
    SEED: 1898,                    // ours: the jitter of the spot only; nothing the game reads depends on it beyond a fraction
                                   //   of a second in when the balance completes
    // ---- the electrometer and the quartz (ours, tuned for a thumb; thesis 1903 for the principle)
    // The spot s (−1 … 1 across the scale) is a leaky integrator of the difference between the plate's current i and the
    // quartz's counter-current r, both in units of pure uranium:  ds/dt = G·(i − r) − s/TAU + JITTER·√i·noise.
    // Steady deflection is G·TAU·(i − r), so the spot stands inside the zero band when |i − r| < BAND/(G·TAU) ≈ 0.067.
    G: 1.5,                        // ours: scale widths per second per uranium of mismatch
    TAU: 1.0,                      // ours: seconds; the spot drifts back toward zero when nothing pushes it (a leak)
    BAND: 0.1,                     // ours: half-width of the zero band, as a fraction of the half-scale
    HOLD_S: 1.2,                   // ours: seconds the spot must stay inside the band; a ring closes around it meanwhile
    WATCH_S: 1.2,                  // ours: the first seconds on the bench cannot complete a balance, so an inactive plate is
                                   //   seen not to move before it is recorded as nothing
    JITTER: 0.05,                  // ours: tremble of the spot, scaled by √i (an inactive plate does not tremble at all)
    SLIDER_MAX: 4,                 // ours: the slider runs from no push to four times pure uranium's push (the table's
                                   //   largest row, pitchblende of Johanngeorgenstadt, is 83/24 ≈ 3.46)
    // ---- the rule, as the panels state it (ours; the paper's "en général, d'autant plus qu'ils contiennent plus
    //      d'uranium", p. 1102)
    MORE_RATIO: 1.3,               // ours: a reading above 1.3 × its uranium share is "MORE THAN ITS URANIUM". Every uranium
                                   //   compound in the game reads 0.62–1.0 of its share; the rocks read 4.3–5.3. Any threshold
                                   //   from 1.1 to 4 gives the same panels (calibration.js checks it).
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
  function shareWords(u) {
    if (u >= 0.99) return 'all uranium';
    if (u >= 0.8) return 'mostly uranium';
    if (u >= 0.6) return 'about two-thirds uranium';
    if (u >= 0.4) return 'about half uranium';
    if (u > 0) return 'a little uranium';
    return 'no uranium';
  }

  // ---------- the rule: what kind of panel a reading makes. Decided on the paper's value; calibration.js checks that every
  //            reading the balance can accept (within its tolerance) gives the same kind.
  function kind(s, x) {
    if (x === undefined) x = strength(s);
    if (s.id === CONFIG.FIRST) return 'yardstick';
    if (x < CONFIG.INACTIVE_BELOW) return 'nothing';
    if (s.u === 0) return 'without';
    if (x > CONFIG.MORE_RATIO * s.u) return 'more';
    return 'about';
  }
  const BADGE = { yardstick: 'THE YARDSTICK', nothing: 'NOTHING', without: 'NO URANIUM IN IT!', more: 'MORE THAN ITS URANIUM!', about: 'ABOUT ITS URANIUM' };

  // ---------- a game
  function newGame(seed) { return { seed: seed === undefined ? CONFIG.SEED : seed, panels: [], tested: {} }; }
  function panelsLeft(g) { return CONFIG.PANELS - g.panels.length; }
  function over(g) { return g.panels.length >= CONFIG.PANELS; }
  function available(g) {  // what can be tested now: the first panel is uranium; then anything not yet tested
    if (!g.panels.length) return [sub(CONFIG.FIRST)];
    return CONFIG.SUBSTANCES.filter(s => !g.tested[s.id]);
  }
  function canTest(g, id) { return !over(g) && available(g).some(s => s.id === id); }

  // ---------- the bench: one measurement
  function benchStart(g, id) {
    if (!canTest(g, id)) throw new Error('cannot test ' + id);
    const s = sub(id);
    return { id, i: strength(s), s: 0, v: 0, t: 0, hold: 0, r: 0, done: false, reading: null, rng: mulberry32(g.seed * 31 + g.panels.length * 7919 + 1),
      acc: { r: 0, s: 0, s0: 0 } };
  }
  // r: the slider (the quartz's counter-current), in units of pure uranium. dt in seconds. Returns the state.
  // The reading is the charge balance over the seconds the spot was held: the quartz's charge (the push, averaged) plus
  // whatever charge is left on the electrometer (the spot's residual deflection, and what leaked). The thesis's null method
  // reads the same balance with a stopwatch; here it is exact up to the spot's tremble, so a quick sweep of the slider at
  // the last moment cannot change it.
  function benchStep(st, dt, r) {
    if (st.done) return st;
    const C = CONFIG; r = Math.max(0, Math.min(C.SLIDER_MAX, r)); st.r = r;
    const steps = Math.max(1, Math.ceil(dt / 0.01)), h = dt / steps, s0 = st.s;
    for (let k = 0; k < steps; k++) {
      const inBand = st.t > C.WATCH_S && Math.abs(st.s) < C.BAND;
      if (inBand) { if (st.hold === 0) { st.acc = { r: 0, s: 0, s0: st.s }; } st.acc.r += r * h; st.acc.s += st.s * h; }
      const noise = st.i > 0 ? C.JITTER * Math.sqrt(st.i) * gauss(st.rng) * Math.sqrt(h) : 0;
      st.s += (C.G * (st.i - r) - st.s / C.TAU) * h + noise;
      st.s = Math.max(-1, Math.min(1, st.s));
      st.t += h;
      if (inBand) st.hold += h; else st.hold = 0;
      if (st.hold >= C.HOLD_S - 1e-9) {
        const T = st.hold, a = st.acc;
        st.reading = Math.max(0, a.r / T + ((st.s - a.s0) + a.s / C.TAU) / (C.G * T));
        st.done = true; break;
      }
    }
    st.v = (st.s - s0) / dt;
    return st;
  }
  // how far the push may be from the plate's current with the spot still standing in the band (for tests and the loop)
  function tolerance() { return CONFIG.BAND / (CONFIG.G * CONFIG.TAU); }
  function holdProgress(st) { return Math.min(1, st.hold / CONFIG.HOLD_S); }
  function running(st) {  // which way the spot is going, for the picture: 'right', 'left' or 'still'; 'pinned' if at an end
    const pinned = Math.abs(st.s) > 0.97;
    if (pinned) return st.s > 0 ? 'pinned-right' : 'pinned-left';
    if (Math.abs(st.s) >= CONFIG.BAND && Math.abs(st.i - st.r) * CONFIG.G * CONFIG.TAU > CONFIG.BAND) return st.i > st.r ? 'right' : 'left';
    return 'still';
  }

  // ---------- recording a panel
  function caption(s, x, k) {
    const sh = shareWords(s.u);
    if (k === 'yardstick') return 'Pure uranium. However hard you had to push for it is the yardstick: every other panel is measured against it.';
    if (k === 'nothing') return s.name + ': nothing. The spot never moved. Less than a hundredth of uranium, if anything.';
    if (k === 'without') {
      const tail = x > 1.15 ? ' Stronger than pure uranium, with no uranium at all.' : x < 0.15 ? ' Faint, but it moved.' : '';
      return s.name + ' has no uranium in it, and the spot moved: it took ' + times(x) + '.' + tail;
    }
    if (k === 'more') return s.name + ' is only ' + sh + ', and it took ' + times(x) + '. Far more than its uranium can give.';
    return s.name + ' is ' + sh + ', and it took ' + times(x) + ': about what its uranium gives, or a little less.';
  }
  function record(g, st) {
    if (!st.done) throw new Error('not balanced');
    const s = sub(st.id), x = st.reading, k = kind(s);
    const p = { n: g.panels.length + 1, id: s.id, name: s.name, short: s.short, look: s.look, reading: x, paper: strength(s), u: s.u,
      kind: k, badge: BADGE[k], words: times(x), caption: caption(s, x, k), seconds: st.t };
    g.panels.push(p); g.tested[s.id] = true; return p;
  }
  const low = s => s.charAt(0).toLowerCase() + s.slice(1);
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  function found(g) { return g.panels.filter(p => p.kind === 'without' || p.kind === 'more'); }
  function foundLine(g) {
    const f = found(g);
    if (!g.panels.length) return 'Nothing measured yet.';
    if (!f.length) return 'Found so far, besides uranium: nothing yet.';
    return 'Found so far, besides uranium: ' + list(f.map(p => (p.kind === 'more' ? 'something in ' : '') + low(p.name))) + '.';
  }

  // ---------- the verdict (words; no score)
  function verdict(g) {
    const has = id => !!g.tested[id];
    const P = id => g.panels.find(p => p.id === id);
    const f = found(g), ores = ['pbJG', 'pbJo', 'chalc'].filter(has), others = f.filter(p => p.kind === 'without');
    let headline;
    if (ores.length && has('chalcArt')) headline = 'You found a rock stronger than pure uranium, and your copy of it was weak.';
    else if (ores.length) headline = 'You found a rock stronger than pure uranium.';
    else if (others.length) headline = 'You found ' + list(others.map(p => low(p.name))) + '. The rocks stayed in their drawer.';
    else headline = 'Only uranium moved the spot.';
    const did = 'You tested ' + (g.panels.length - 1) + ' things after pure uranium. ' +
      (f.length ? 'Besides pure uranium, the spot moved for ' + list(f.map(p => low(p.name))) + '.' : 'Nothing but uranium moved the spot.');
    const path = [];
    if (ores.length) {
      const o = P(ores[0]);
      path.push('The ' + (o.id === 'chalc' ? 'green crystal from the mine' : 'black rock') + ' is only ' + shareWords(o.u) + ', and it took ' + o.words + '. Uranium cannot do that on its own.');
      if (has('chalcArt') && has('chalc')) path.push('You made the same green crystal yourself, from pure chemicals: it took ' + P('chalcArt').words + ', like any uranium salt; the one from the mine took ' + P('chalc').words.replace(' the push of pure uranium', '') + '. So the extra is not the uranium and not the crystal: it is something in the rock that no bottle held.');
      else if (has('chalcArt')) path.push('You made the green crystal yourself, from pure chemicals: it took ' + P('chalcArt').words + ', like any uranium salt. The one from the mine, which you did not test, took more than twice the push of pure uranium.');
      else path.push('You never made the copy. She did: the green crystal made from pure chemicals was as weak as any uranium salt, while the one from the mine was more than twice as strong as pure uranium.');
    } else {
      path.push('You never tested the rocks from the Muséum. That is where it was: pitchblende, a black rock about two-thirds uranium, takes three and a half times the push of pure uranium.');
    }
    if (has('whiteP')) {
      if (has('redP') || has('phosphate')) path.push('White phosphorus moved the spot; ' + (has('redP') && has('phosphate') ? 'red phosphorus and phosphate did not' : has('redP') ? 'red phosphorus did not' : 'phosphate did not') + '. Same element, another form, nothing: so it is not the phosphorus itself. The paper calls its action "probably of another nature".');
      else path.push('White phosphorus moved the spot. The paper tried red phosphorus and phosphates too: nothing. Same element, another form: so it is not the phosphorus itself.');
    }
    if (has('thOthick') && P('thOthick').reading > 1.15) path.push('Thorium does it with no uranium at all, and your thick layer of it beat pure uranium.');
    else if (has('thO') || has('thOthick')) path.push('Thorium does it with no uranium at all; a thick layer of it beats pure uranium.');
    const paper = 'Marie Curie tested dozens of metals, salts, oxides and rocks. Every uranium compound does it, about in proportion to its uranium. Thorium does it too. And two uranium rocks, pitchblende and chalcolite, do it far more than the uranium in them can. She made chalcolite herself from pure chemicals, and her copy was no stronger than any uranium salt.';
    const means = 'So the rocks hold something no bottle in Paris held. Her words: these minerals "may contain an element much more active than uranium."';
    const later = 'After this note, and not in it: in July 1898 she and Pierre Curie announced one such element, traced in pitchblende, and named it polonium; in December, a second: radium.';
    const her = CONFIG.HER_PAGE.map(id => { const s = sub(id); return { id, name: s.name, short: s.short, look: s.look, u: s.u, x: strength(s), kind: kind(s), words: times(strength(s)) }; });
    return { headline, did, path, paper, means, later, her };
  }

  return { CONFIG, sub, strength, times, shareWords, kind, BADGE, newGame, panelsLeft, over, available, canTest,
    benchStart, benchStep, tolerance, holdProgress, running, record, found, foundLine, verdict, mulberry32 };
});
