// Curie's Quartz — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build
// if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: RECONSTRUCTED, from the two-part table of currents in M. Skłodowska Curie, "Rayons émis par les composés de
// l'uranium et du thorium", Comptes rendus 126 (1898): 1101–1103. Every current below is a row of that table, in units of
// 1e-12 ampere, transcribed by hand from a scan of typeset text and checked digit by digit against the scan. The instrument
// (a quartz whose charge holds the electrometer's spot at zero) is named on p. 1101; how it was worked by hand is from
// Curie's thesis (1903). Everything else is ours and is tagged "ours".
//
// Revision 2: the player writes plain numbers; every reading plants an idea (a thought balloon, ours); at the end the
// latest reading of each jar settles four questions, and the answers make a physics and a world, drawn "as if it were
// true". Only the conclusions the page drew change nature; a jar never measured leaves its question as in our world.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.CURIE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the yardstick and the threshold (the paper)
    UNIT_A: 24,                    // p. 1101, table row 1: "Uranium légèrement carburé 24 × 10^-12" A. Readings are pushes on her
                                   //   scale, pure uranium = 1; the amperes stay here and on the About screen.
    INACTIVE_BELOW: 1 / 100,       // p. 1101: substances not in the table are "au moins 100 fois moins actives que l'uranium"
    CONDENSER: { plateCm: 8, gapCm: 3, volts: 100 }, // p. 1101: "Diamètre des plateaux, 8cm; distance, 3cm"; 100 volts
    // ---- play (ours)
    PANELS: 9,                     // ours: nine panels; the first is pure uranium; any jar may be measured again
    FIRST: 'uranium',              // ours: the first panel is pure uranium, the player's own yardstick
    SEED: 1898,                    // ours: the tremble of the spot only
    // ---- the electrometer and the quartz (ours, tuned for a thumb; thesis 1903 for the principle)
    // The spot s (−1 … 1) is a leaky integrator of the plate's current i minus the quartz's counter-current r (the push), in
    // units of pure uranium: ds/dt = G·(i − r) − s/TAU + JITTER·√i·noise. It stands in the middle when |i − r| < BAND/(G·TAU).
    G: 1.5,                        // ours: scale widths per second per uranium of mismatch
    TAU: 1.0,                      // ours: seconds; the spot drifts back toward 0 when nothing pushes it (a leak)
    BAND: 0.1,                     // ours: how near 0 the spot must sit to count as standing, as a fraction of the half-scale
    JITTER: 0.05,                  // ours: tremble of the spot, scaled by √i
    SLIDER_MAX: 4,                 // ours: no push to four times pure uranium's (her largest row, 83/24 ≈ 3.46)
    COMMIT_AFTER_S: 0.8,           // ours: WRITE IT DOWN wakes this long after the plate goes on
    // ---- what a number shows (ours). The reading x is the push at the moment of WRITE IT DOWN, taken at face value. U is the
    //      latest pure-uranium reading on the page (the player's own yardstick); u the uranium share on the jar's label.
    //      Things that hold uranium are read by q = x / (u·U); things without uranium by v = x / U.
    BAND_NONE: 1 / 20,             // ours: below a twentieth of the yardstick, the air carried nothing you could see
    BAND_LOW: 0.5,                 // ours: q under a half: far less than the uranium in it could give
    BAND_HIGH: 1.3,                // ours: q above 1.3: more than the uranium in it could give. Her salts read 0.62–0.88 of their
                                   //   share; her rocks 4.3–5.3; any threshold from 1.1 to 4 sorts her table the same way
    BAND_FAINT: 1 / 6,             // ours: v from a twentieth to a sixth: a whisper (her tantalum salt is 0.083)
    BAND_STRONG: 1.3,              // ours: v above 1.3: stronger than pure uranium (her thick thorium oxide is 2.21)
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
  function strength(s) { return s.amps / CONFIG.UNIT_A; }           // her reading, on her scale (pure uranium = 1)
  const low = s => s.charAt(0).toLowerCase() + s.slice(1);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  // ---------- words (no decimals on screen)
  function share(v) {  // a ratio in words: "about half", "twice" …
    if (v < 0.15) return null;
    if (v < 0.9) { const F = [[1 / 4, 'about a quarter'], [1 / 3, 'about a third'], [1 / 2, 'about half'], [2 / 3, 'about two-thirds'], [3 / 4, 'about three-quarters']];
      let b = F[0]; F.forEach(f => { if (Math.abs(f[0] - v) < Math.abs(b[0] - v)) b = f; }); return b[1]; }
    if (v < 1.15) return 'about the same';
    if (v < 1.4) return 'a little more';
    const h = Math.round(v * 2) / 2;
    return ({ 1.5: 'one and a half times', 2: 'twice', 2.5: 'two and a half times', 3: 'three times', 3.5: 'three and a half times', 4: 'four times' })[h] || 'more than four times';
  }
  function asMuch(v, whose) {  // "about half as much electricity as with your pure uranium"
    if (v < CONFIG.BAND_NONE) return 'no electricity you could see';
    const w = share(v);
    if (!w) return 'hardly any electricity';
    if (w === 'about the same') return 'about as much electricity as ' + whose;
    if (w === 'a little more') return 'a little more electricity than ' + whose;
    if (/times|twice/.test(w)) return w + ' as much electricity as ' + whose;
    return w + ' as much electricity as ' + whose;
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
  function newGame(seed) { return { seed: seed === undefined ? CONFIG.SEED : seed, panels: [], tested: {}, ideas: [], scenes: [], used: {}, shouted: {}, pool: {} }; }
  function panelsLeft(g) { return CONFIG.PANELS - g.panels.length; }
  function over(g) { return g.panels.length >= CONFIG.PANELS; }
  function available(g) { return g.panels.length ? CONFIG.SUBSTANCES.slice() : [sub(CONFIG.FIRST)]; }
  function canTest(g, id) { return !over(g) && available(g).some(s => s.id === id); }

  // ---------- the bench: one measurement. Nothing here ends it: only the player does, with commit().
  function benchStart(g, id) {
    if (!canTest(g, id)) throw new Error('cannot test ' + id);
    return { id, i: strength(sub(id)), s: 0, v: 0, t: 0, r: 0, rng: mulberry32(g.seed * 31 + g.panels.length * 7919 + 1) };
  }
  function benchStep(st, dt, r) {
    const C = CONFIG; r = Math.max(0, Math.min(C.SLIDER_MAX, r)); st.r = r;
    const steps = Math.max(1, Math.ceil(dt / 0.01)), h = dt / steps, s0 = st.s;
    for (let k = 0; k < steps; k++) {
      const noise = st.i > 0 ? C.JITTER * Math.sqrt(st.i) * gauss(st.rng) * Math.sqrt(h) : 0;
      st.s = Math.max(-1, Math.min(1, st.s + (C.G * (st.i - r) - st.s / C.TAU) * h + noise));
      st.t += h;
    }
    st.v = (st.s - s0) / dt;
    return st;
  }
  function canCommit(st) { return st.t >= CONFIG.COMMIT_AFTER_S; }
  function tolerance() { return CONFIG.BAND / (CONFIG.G * CONFIG.TAU); }
  function running(st) {  // which way the spot is going: 'right', 'left', 'still', or 'pinned-…' at an end
    const pinned = Math.abs(st.s) > 0.97;
    if (pinned) return st.s > 0 ? 'pinned-right' : 'pinned-left';
    if (Math.abs(st.s) >= CONFIG.BAND && Math.abs(st.i - st.r) * CONFIG.G * CONFIG.TAU > CONFIG.BAND) return st.i > st.r ? 'right' : 'left';
    return 'still';
  }
  function movingAt(st) { const m = (st.i - st.r) * CONFIG.G * CONFIG.TAU; return m > CONFIG.BAND ? 'right' : m < -CONFIG.BAND ? 'left' : null; }

  // ---------- what a number shows, against the page's own yardstick
  function latest(g) { const L = {}; g.panels.forEach(p => { L[p.id] = p; }); return L; }
  function yard(g) { const L = latest(g); return L[CONFIG.FIRST] ? L[CONFIG.FIRST].x : null; }
  function band(id, x, U) {
    const C = CONFIG, s = sub(id), Ue = Math.max(U === null || U === undefined ? 1 : U, 0.02);
    if (id === C.FIRST) return 'YARD';
    if (x < C.BAND_NONE * Ue) return 'NONE';
    if (s.u > 0) { const q = x / (s.u * Ue); return q < C.BAND_LOW ? 'LOW' : q <= C.BAND_HIGH ? 'ABOUT' : 'HIGH'; }
    const v = x / Ue; return v < C.BAND_FAINT ? 'FAINT' : v <= C.BAND_STRONG ? 'ACTIVE' : 'STRONG';
  }
  const ACT = b => b === 'ACTIVE' || b === 'STRONG';
  const GROUP = { uranium: 'uranium', greenox: 'salt', nitrate: 'salt', thO: 'thorium', thOthick: 'thorium', lead: 'heavy', gold: 'heavy', copper: 'copper',
    tantal: 'tantal', whiteP: 'whiteP', redP: 'control', phosphate: 'control', pbJG: 'rock', pbJo: 'rock', chalc: 'chalc', chalcArt: 'copy' };

  // ---------- the four questions, from the latest reading of each jar (her page: every jar at her value, yardstick 1)
  function settle(bands, panelOf) {
    const B = id => bands[id], P = ids => ids.filter(id => B(id) !== undefined).map(id => panelOf(id)).filter(n => n);
    const has = id => B(id) !== undefined;
    const salts = ['greenox', 'nitrate'].filter(has), rocks = ['pbJG', 'pbJo', 'chalc'].filter(has), th = ['thO', 'thOthick'].filter(has);
    const heavyOn = ['lead', 'gold'].filter(id => ACT(B(id))), saltOff = salts.filter(id => B(id) !== 'ABOUT');
    const copyHigh = B('chalcArt') === 'HIGH', copyOff = has('chalcArt') && ['NONE', 'LOW'].includes(B('chalcArt'));
    const sky = heavyOn.length > 0, slow = saltOff.length > 0 || copyOff, crystal = copyHigh;
    const rocksHigh = rocks.filter(id => B(id) === 'HIGH');
    let energy, energyFrom;
    if (sky) { energy = 'sky'; energyFrom = P(heavyOn); }
    else if (slow) { energy = 'slow'; energyFrom = P(saltOff.concat(copyOff ? ['chalcArt'] : [])); }
    else if (crystal) { energy = 'crystal'; energyFrom = P(['chalcArt']); }
    else if (rocks.length && !rocksHigh.length) { energy = 'bottomless'; energyFrom = P(rocks.concat(salts)); }
    else { energy = 'restless'; energyFrom = P(salts.concat(rocksHigh)); }
    const secondary = [];
    if (energy === 'sky' && slow) secondary.push('slow'); if ((energy === 'sky' || energy === 'slow') && crystal) secondary.push('crystal');
    // which matter
    const whiteOn = ACT(B('whiteP')), controls = ['redP', 'phosphate'].filter(has), controlOn = controls.filter(id => ACT(B(id)));
    const living = whiteOn && (!controls.length || controlOn.length > 0);
    const copperOn = ACT(B('copper')), thOn = th.filter(id => ACT(B(id)));
    let carriers, carriersFrom;
    if (copperOn || (sky && living)) { carriers = 'everything'; carriersFrom = P((copperOn ? ['copper'] : []).concat(heavyOn, living ? ['whiteP'].concat(controlOn) : [])); }
    else if (living) { carriers = 'living'; carriersFrom = P(['whiteP'].concat(controlOn)); }
    else if (sky) { carriers = 'weight'; carriersFrom = P(heavyOn); }
    else if (th.length && !thOn.length) { carriers = 'alone'; carriersFrom = P(th); }
    else { carriers = 'heaviest'; carriersFrom = P(thOn); }
    // hidden in the rocks
    let hidden, hiddenFrom;
    if (energy === 'crystal') { hidden = 'crystal'; hiddenFrom = P(['chalcArt'].concat(rocksHigh)); }
    else if (rocksHigh.length) { hidden = 'yes'; hiddenFrom = P(rocksHigh.concat(has('chalcArt') ? ['chalcArt'] : [])); }
    else if (rocks.length) { hidden = 'no'; hiddenFrom = P(rocks); }
    else { hidden = 'unlooked'; hiddenFrom = []; }
    const phos = !has('whiteP') ? 'unlooked' : !whiteOn ? 'none' : living ? 'atom' : 'chemistry';
    const rare = ['FAINT', 'ACTIVE', 'STRONG'].includes(B('tantal'));
    return { energy, energyFrom, secondary, carriers, carriersFrom, hidden, hiddenFrom, phos, phosFrom: P(['whiteP'].concat(controls)), rare, rareFrom: P(['tantal']),
      looked: { thorium: th.length > 0, rocks: rocks.length > 0, salts: salts.length > 0, phos: has('whiteP'), heavy: has('lead') || has('gold') } };
  }
  function physics(g) {
    const L = latest(g), U = yard(g), bands = {};
    Object.keys(L).forEach(id => { bands[id] = band(id, L[id].x, U); });
    return settle(bands, id => L[id] && L[id].n);
  }
  function herPhysics() {
    const bands = {}; CONFIG.SUBSTANCES.forEach(s => { bands[s.id] = band(s.id, strength(s), 1); });
    return settle(bands, () => null);
  }

  // ---------- the voice (ours): Marie Curie, off-panel and never drawn. Each reading plants a belief on the page, and she says
  //            so in a speech balloon (an exclamation), a thought cloud (musing) or a jagged shout (a clash). She remembers:
  //            a belief met again on another jar is greeted ("Didn't I know it!"); one that clashes with another jar is
  //            shouted at, once per pair; a jar measured again is compared with itself; no line is said twice in an album.
  //            Confidence ("I'm on to something") comes from readings agreeing with each other, never from agreeing with her.
  const SHARE_SHORT = u => u >= 0.99 ? 'all uranium' : u >= 0.8 ? 'mostly uranium' : u >= 0.6 ? 'two-thirds uranium' : u >= 0.4 ? 'half uranium' : 'a little uranium';
  const EXPECT = u => u >= 0.99 ? 'as strong as pure uranium' : u >= 0.8 ? 'almost as strong as pure uranium' : u >= 0.6 ? 'about two-thirds as strong as pure uranium' : u >= 0.4 ? 'about half as strong as pure uranium' : 'much weaker than pure uranium';
  function strongWords(v) {
    if (v < CONFIG.BAND_NONE) return 'nothing at all';
    const w = share(v); if (!w) return 'hardly anything';
    if (w === 'about the same') return 'about as strong as pure uranium';
    if (w === 'a little more') return 'a bit stronger than pure uranium';
    return w + ' as strong as pure uranium';
  }
  const OPPOSITE = { atom: 'slow', slow: 'atom', heavy: 'notweight', notweight: 'heavy', hidden: 'nohidden', nohidden: 'hidden', thorium: 'alone', alone: 'thorium', metals: 'notmetals', notmetals: 'metals' };
  function beliefOf(g, p, b, ph) {  // { key: the belief planted (null for none), line: the WORDS.voice entry, force: say it even if held }
    const grp = GROUP[p.id], L = latest(g), U = yard(g), act = id => L[id] && L[id] !== p && ACT(band(id, L[id].x, U));
    if (grp === 'uranium') return { key: null, line: p.x < 0.15 ? 'uraniumWeak' : 'uranium' };
    if (grp === 'salt') return { key: b === 'ABOUT' ? 'atom' : 'slow', line: 'salt' + b };
    if (grp === 'copy') {
      const mine = L.chalc && band('chalc', L.chalc.x, U) === 'HIGH';
      if (b === 'HIGH') return { key: 'crystal', line: 'copyHIGH' };
      if (b === 'ABOUT') return mine ? { key: 'hidden', line: 'copyAfterMine', force: true } : { key: 'atom', line: 'copyABOUT' };
      return { key: 'slow', line: 'salt' + b };
    }
    if (grp === 'thorium') return ACT(b) ? { key: 'thorium', line: p.id === 'thOthick' && b === 'STRONG' ? 'thoriumThick' : 'thorium' } : b === 'NONE' ? { key: 'alone', line: 'thoriumNONE' } : { key: null, line: 'thoriumFAINT' };
    if (grp === 'heavy') return ACT(b) ? { key: 'heavy', line: 'heavy' } : b === 'NONE' ? { key: 'notweight', line: 'heavyNONE' } : { key: null, line: 'heavyFAINT' };
    if (grp === 'copper') return ACT(b) ? { key: 'metals', line: 'copper' } : b === 'NONE' ? { key: 'notmetals', line: 'copperNONE' } : { key: null, line: 'copperFAINT' };
    if (grp === 'tantal') return b === 'NONE' ? { key: null, line: 'tantalNONE' } : { key: 'rare', line: ACT(b) ? 'tantal' : 'tantalFAINT' };
    if (grp === 'whiteP') return ACT(b) ? { key: 'life', line: 'whiteP' } : { key: null, line: 'whitePNONE' };
    if (grp === 'control') return ACT(b) ? { key: 'life', line: 'controlON', force: true } : act('whiteP') ? { key: 'phoschem', line: 'controlAfterWhite', force: true } : { key: null, line: 'controlOFF' };
    if (grp === 'rock') return b === 'HIGH' ? { key: 'hidden', line: ph.energy === 'sky' ? 'rockHIGHsky' : ph.energy === 'slow' ? 'rockHIGHslow' : 'rockHIGH' } : { key: 'nohidden', line: b === 'ABOUT' ? 'rockABOUT' : 'rockLOW' };
    if (grp === 'chalc') return b === 'HIGH' ? { key: 'hidden', line: 'chalcHIGH' } : { key: 'nohidden', line: b === 'ABOUT' ? 'rockABOUT' : 'rockLOW' };
    return { key: null, line: 'controlOFF' };
  }
  function utter(g, entry, vars) {  // the first variant of an entry not yet said in this album, with its blanks filled
    const V = WORDS.voice[entry], variants = Array.isArray(V) ? V : [V];
    let k = variants.findIndex((_, j) => !g.used[entry + '#' + j]); if (k < 0) k = variants.length - 1;
    g.used[entry + '#' + k] = true;
    const fill = s => s.replace(/\{(\w)\}/g, (m, c) => vars[c] !== undefined ? vars[c] : m);
    let i = variants[k].i; const pool = WORDS.pools[i];   // the comic word rotates through its pool within an album
    if (pool) { g.pool[i] = (g.pool[i] || 0); i = pool[g.pool[i] % pool.length]; g.pool[variants[k].i]++; }
    return { kind: variants[k].k || 'speech', i, t: fill(variants[k].t) };
  }
  function voice(g, p, b) {
    const s = sub(p.id), ph = physics(g), U = yard(g) || 1;
    const vars = { N: low(s.name), M: s.name, S: SHARE_SHORT(s.u), C: cap(SHARE_SHORT(s.u)), E: EXPECT(s.u), X: strongWords(p.x / Math.max(U, 0.02)) };
    const bel = beliefOf(g, p, b, ph); p.belief = bel.key;
    const others = {}; g.panels.forEach(q => { if (q !== p) others[q.id] = q; });
    const prev = others[p.id]; delete others[p.id];
    const held = k => Object.values(others).filter(q => q.belief === k).map(q => q.n);
    const out = [];
    if (prev && p.id === CONFIG.FIRST) out.push(utter(g, 'uraniumAgain', vars));
    else if (prev && prev.belief === bel.key) out.push(utter(g, 'retestSame', vars));
    else if (prev) { const c = utter(g, 'retestChanged', vars), f = utter(g, bel.line, vars); out.push({ kind: f.kind, i: c.i, t: c.t + ' ' + f.t }); }
    else if (bel.key && !bel.force && held(bel.key).length) out.push(utter(g, 'confirm_' + bel.key, Object.assign({ P: held(bel.key).slice(-1)[0] }, vars)));
    else out.push(utter(g, bel.line, vars));
    const opp = bel.key && OPPOSITE[bel.key], against = opp ? held(opp) : [], pair = bel.key && opp ? [bel.key, opp].sort().join('|') : null;
    if (against.length && !g.shouted[pair]) { g.shouted[pair] = true; out.push(utter(g, 'shout', Object.assign({ P: against.slice(-1)[0], Q: WORDS.clashQ[pair] }, vars))); }
    return out;
  }

  // ---------- writing it down: one panel, its words and its idea
  function commit(g, st) {
    if (!canCommit(st)) throw new Error('too soon');
    const s = sub(st.id), x = st.r;
    const p = { n: g.panels.length + 1, id: s.id, name: s.name, short: s.short, look: s.look, u: s.u, x, moving: movingAt(st), paper: strength(s), seconds: st.t };
    g.panels.push(p); g.tested[s.id] = (g.tested[s.id] || 0) + 1;
    const U = yard(g), b = band(s.id, x, U); p.band = b;
    if (s.id === CONFIG.FIRST) {
      const w = share(x); p.vsHer = x < CONFIG.BAND_NONE ? 'you pushed hardly at all' : 'you pushed ' + (w === 'about the same' ? 'about as hard as she measured' : w === 'a little more' ? 'a little harder than she measured' : /times|twice/.test(w || '') ? w + ' as hard as she measured' : (w || 'hardly') + ' as hard as she measured');
      p.words = 'your yardstick';
      p.caption = 'Pure uranium: your yardstick.';
    } else {
      p.words = asMuch(x / Math.max(U, 0.02), 'pure uranium').replace('no electricity you could see', 'no electricity at all');
      p.caption = s.name + ': ' + p.words + '.';
    }
    const said = voice(g, p, b);
    p.ideaI = said[0].i; p.ideaT = said[0].t; p.idea = said[0].i + ' ' + said[0].t; p.kind = said[0].kind; p.clash = said.slice(1);
    said.forEach((v, j) => g.ideas.push({ n: p.n, id: s.id, i: v.i, t: v.t, kind: v.kind, text: v.i + ' ' + v.t, clash: j > 0 }));
    p.scene = scene(g, p); g.scenes.push(p.scene);
    return p;
  }

  // ---------- the world strip (ours): every panel draws one dated scene of life outside the workroom, a consequence of the
  //            belief just planted. The strip runs forward from April 1898; a belief met for the second time escalates to
  //            its second scene; a jar that planted nothing draws Paris carrying on. Assembled on the last page with the
  //            world a century on.
  const YEARS = [1898, 1898, 1899, 1900, 1902, 1904, 1906, 1908, 1910];   // ours: one year per panel, in order
  function scene(g, p) {
    const s = sub(p.id), key = p.belief, year = YEARS[p.n - 1] || 1910;
    const before = g.scenes.filter(q => q.key === key && key).length;   // how often this belief has already drawn a scene
    let entry;
    if (p.id === CONFIG.FIRST) entry = WORDS.scenes.origin[g.scenes.some(q => q.id === CONFIG.FIRST) ? 1 : 0];
    else if (!key) entry = WORDS.scenes.quiet[Math.min(g.scenes.filter(q => !q.key && q.id !== CONFIG.FIRST).length, WORDS.scenes.quiet.length - 1)];
    else { const list = WORDS.scenes[key]; entry = list[Math.min(before, list.length - 1)]; }
    const vars = { N: low(s.name), M: s.name };
    const fill = t => t.replace(/\{(\w)\}/g, (m, c) => vars[c] !== undefined ? vars[c] : m);
    return { n: p.n, id: p.id, key, year, pic: entry.id, text: fill(entry.t), clash: p.clash.length > 0, again: !!(key && before) };
  }
  function oursStrip() { return WORDS.oursScenes.map(s => ({ year: s.year, pic: s.pic, text: s.t })); }
  function ideasLine(g) { return g.ideas.length ? g.ideas.length + ' idea' + (g.ideas.length === 1 ? '' : 's') + ' so far' : 'No ideas yet.'; }

  // ---------- the world of the page, and ours
  function worldOf(ph) {
    const W = WORDS, E = W.energy[ph.energy];
    const laws = [
      { q: 'energy', text: E.law, from: ph.energyFrom },
      { q: 'carriers', text: W.carriers[ph.carriers] + (ph.rare ? ' ' + W.rareLaw : ''), from: ph.carriersFrom.concat(ph.rare ? ph.rareFrom : []) },
      { q: 'hidden', text: W.hidden[ph.hidden === 'yes' ? 'yes_' + (ph.energy === 'sky' ? 'sky' : ph.energy === 'slow' ? 'slow' : 'atom') : ph.hidden], from: ph.hiddenFrom },
    ];
    // vignettes: oddities first, then the world's own
    const odd = [];
    if (ph.hidden === 'yes' && ph.energy === 'sky') odd.push({ id: 'miners93', from: ph.hiddenFrom });
    if (ph.hidden === 'yes' && ph.energy === 'slow') odd.push({ id: 'fadinglamp', from: ph.hiddenFrom });
    if (ph.carriers === 'alone') odd.push({ id: 'pedestal', from: ph.carriersFrom });
    if (ph.carriers === 'living' || (ph.carriers === 'everything' && ph.phos === 'atom')) odd.push({ id: 'doctor', from: ph.phosFrom });
    if (ph.carriers === 'everything') odd.push({ id: 'storm', from: ph.carriersFrom });
    if (ph.rare) odd.push({ id: 'jewels', from: ph.rareFrom });
    const slots = odd.slice(0, 3).concat(E.own.map(id => ({ id, from: [] }))).slice(0, 3);
    const callouts = [{ id: E.landmark, text: W.vignette[E.landmark], from: ph.energyFrom }].concat(slots.map(v => ({ id: v.id, text: W.vignette[v.id], from: v.from })));
    odd.slice(3).forEach(v => callouts.push({ id: v.id, text: W.vignette[v.id], from: v.from, unseen: true }));
    let para = E.paragraph;
    ph.secondary.forEach(k => { para += ' ' + W.secondary[ph.energy + '+' + k]; });
    odd.forEach(v => { if (W.oddSentence[v.id]) para += ' ' + W.oddSentence[v.id]; });
    if (ph.energy !== 'restless') para += ' ' + W.caught;
    return { energy: ph.energy, name: E.name, laws, landmark: E.landmark, slots: slots.map(v => v.id), callouts, paragraph: para };
  }
  function world(g) { return worldOf(physics(g)); }
  function ours() {
    const W = WORDS;
    return { energy: 'restless', name: W.energy.restless.name, landmark: 'dome', slots: ['rockclock', 'hospital', 'table118'],
      callouts: [{ id: 'dome', text: W.vignette.dome }, { id: 'rockclock', text: W.vignette.rockclock }, { id: 'hospital', text: W.vignette.hospital }, { id: 'table118', text: W.vignette.table118 }],
      laws: [{ q: 'energy', text: W.energy.restless.law }, { q: 'carriers', text: W.carriers.heaviest }, { q: 'hidden', text: W.hidden.yes_atom }],
      paragraph: W.energy.restless.paragraph, dates: W.dates };
  }

  // ---------- where they part (words; no score)
  function part(g) {
    const ph = physics(g), her = herPhysics(), L = latest(g), out = [];
    const P = n => { const p = g.panels.find(q => q.n === n); return p ? 'panel ' + p.n + ', ' + low(p.name) + ': ' + p.words : null; };
    const why = ns => list(ns.map(P).filter(Boolean));
    const U = yard(g);
    if (ph.energy !== 'restless') {
      let t = WORDS.part.energy[ph.energy] + (ph.energyFrom.length ? ' It came from ' + why(ph.energyFrom) + '.' : '');
      if (ph.energy === 'slow' && U !== null && (U < 0.75 || U > 1.3)) t += ' ' + WORDS.part.yardstick.replace('{W}', g.panels.filter(p => p.id === CONFIG.FIRST).slice(-1)[0].vsHer);
      out.push(t);
    }
    if (ph.carriers !== her.carriers) out.push(WORDS.part.carriers[ph.carriers] + (ph.carriersFrom.length ? ' It came from ' + why(ph.carriersFrom) + '.' : ''));
    if (ph.hidden !== 'yes' && ph.hidden !== 'unlooked' && ph.energy !== 'bottomless') out.push(WORDS.part.hidden[ph.hidden] + (ph.hiddenFrom.length ? ' It came from ' + why(ph.hiddenFrom) + '.' : ''));
    const unlooked = [];
    if (!ph.looked.rocks) unlooked.push(WORDS.part.unlooked.rocks); if (!ph.looked.thorium) unlooked.push(WORDS.part.unlooked.thorium);
    const same = !out.length;
    let closing;
    if (same && ph.rare) closing = WORDS.part.herNoteRare;
    else if (same) closing = WORDS.part.herNote;
    else closing = WORDS.part.replay;
    return { lines: out, unlooked, same, rare: ph.rare, closing };
  }

  function verdict(g) {
    const ph = physics(g), w = worldOf(ph), o = ours(), pt = part(g);
    const her = CONFIG.HER_PAGE.map(id => { const s = sub(id); return { id, name: s.name, short: s.short, look: s.look, u: s.u, x: strength(s) }; });
    return { physics: ph, world: w, ours: o, part: pt, ideas: g.ideas.slice(), strip: g.scenes.slice(), oursStrip: oursStrip(), her, worlds: Object.keys(WORDS.energy).map(k => ({ id: k, name: WORDS.energy[k].name })) };
  }

  // ---------- every word the bench thinks and every world it draws (ours: the game's fiction, labelled as such on screen)
  const WORDS = {
    voice: {
      uranium: { k: 'speech', i: 'So!', t: 'This is how much electricity pure uranium lets the air carry. Everything else gets measured against it.' },
      uraniumWeak: { k: 'thought', i: 'Hmmm…', t: 'Pure uranium hardly does anything. Is it really the uranium that does it?' },
      uraniumAgain: [{ k: 'thought', i: 'Second look.', t: 'From now on, everything is measured against this pure uranium.' }, { k: 'thought', i: 'Once more.', t: 'Pure uranium again. This is my yardstick now.' }],
      saltABOUT: { k: 'speech', i: 'Aha!', t: '{C}, and {X}: no more than the uranium in it should give. It must be the uranium doing the work, whatever it’s mixed with!' },
      saltHIGH: { k: 'speech', i: 'Wow!', t: 'Only {S}, and yet {X}! Mixed with other things, uranium burns brighter… is it a kind of fire?' },
      saltLOW: { k: 'thought', i: 'Hmmm…', t: '{C}, so it should be {E}. But it’s only {X}. Maybe mixing smothers the uranium, like a fire under a blanket?' },
      saltNONE: { k: 'speech', i: 'What?!', t: 'A uranium salt, and nothing at all? Then maybe uranium was never the point. Maybe it’s all chemistry!' },
      copyABOUT: { k: 'thought', i: 'Hmmm.', t: 'My home-made chalcolite is just as strong as the uranium in it, no more. Just another uranium salt.' },
      copyAfterMine: { k: 'speech', i: 'Aha!', t: 'My home-made chalcolite is just as strong as the uranium in it, no more. So the one from the mine really has something extra hiding in it!' },
      copyHIGH: { k: 'speech', i: 'Wow!', t: 'My home-made chalcolite is {X}, as strong as the one from the mine! So it’s the way the crystal is built, not anything hidden.' },
      thorium: { k: 'speech', i: 'Wow!', t: 'Not a speck of uranium in it, and the air still carries electricity! Thorium does it too. The two heaviest atoms there are… maybe the table of elements ends where atoms start to leak?' },
      thoriumThick: { k: 'speech', i: 'Oh!', t: 'A thicker layer, and {X}! Not a speck of uranium in it, and it beats pure uranium. Thorium must let its own rays through.' },
      thoriumNONE: { k: 'thought', i: 'Hmmm…', t: 'Thorium: nothing at all. So uranium is alone? A freak, the only one of its kind?' },
      thoriumFAINT: { k: 'thought', i: 'Hmmm…', t: 'A tiny whisper from thorium. Something, or nothing?' },
      heavy: { k: 'speech', i: 'Wow!', t: 'The air carries electricity near {N}, and there’s no uranium in it! Every heavy atom must do it, the heavier the more… as if something were raining down on them from space!' },
      heavyNONE: { k: 'thought', i: 'Hmmm…', t: '{M} is heavy, and does nothing at all. So it isn’t weight alone.' },
      heavyFAINT: { k: 'thought', i: 'Hmmm…', t: 'A faint leak near {N}? Maybe every heavy atom does it, just a little…' },
      copper: { k: 'speech', i: 'Wow!', t: 'Copper too, and copper isn’t even heavy! Then every metal leaks electricity. The telegraph wires must be humming!' },
      copperNONE: { k: 'thought', i: 'Good.', t: 'Copper does nothing at all. So it isn’t just any metal.' },
      copperFAINT: { k: 'thought', i: 'Hmmm…', t: 'A faint leak from copper? Surely not… or?' },
      tantal: { k: 'speech', i: 'Wow!', t: 'Tantalum, nearly as strong as uranium! Then the rare metals all do it!' },
      tantalFAINT: { k: 'thought', i: 'Hmmm…', t: 'A faint leak from tantalum. Maybe the rare metals do it, just a little?' },
      tantalNONE: { k: 'thought', i: 'Hmmm.', t: 'Tantalum: nothing that I can see.' },
      whiteP: { k: 'speech', i: 'Wow!', t: 'White phosphorus does it, and there’s no uranium in it! There is phosphorus in every bone… is the stuff of life electric?' },
      whitePNONE: { k: 'thought', i: 'Hmmm.', t: 'White phosphorus: nothing at all.' },
      controlON: { k: 'speech', i: 'Wow!', t: '{M} too! Then it really is the phosphorus itself, a light atom. So weight has nothing to do with it!' },
      controlAfterWhite: { k: 'speech', i: 'Aha!', t: '{M}: nothing at all, and it’s the same element as white phosphorus! So it was never the phosphorus. The white kind is just burning slowly in the air.' },
      controlOFF: { k: 'thought', i: 'Hmmm.', t: '{M}: nothing at all.' },
      rockHIGH: { k: 'speech', i: 'Wow!', t: 'Only {S}, so it should be weaker than pure uranium. But it’s {X}! It can’t just be the uranium in it: something else is hiding in this rock!' },
      rockHIGHsky: { k: 'speech', i: 'Wow!', t: 'Only {S}, and yet {X}! It can’t just be the uranium in it: something heavier than uranium must be hiding in this rock. A bigger sail!' },
      rockHIGHslow: { k: 'speech', i: 'Wow!', t: 'Only {S}, and yet {X}! It can’t just be the uranium in it: a fiercer fuel must be hiding in this rock!' },
      rockABOUT: { k: 'thought', i: 'Hmmm…', t: '{C}, and {X}: just the uranium in it, nothing more. So uranium shines on and on and never changes… maybe it never runs out?' },
      rockLOW: { k: 'thought', i: 'Hmmm…', t: 'Even weaker than the uranium in it should make it. That rock is just uranium and dirt.' },
      chalcHIGH: { k: 'thought', i: 'Hmmm…', t: 'These crystals are only {S}, and yet {X}! Is something hiding in the rock… or is it the way the crystal is built?' },
      confirm_atom: [{ i: 'Didn’t I know it!', t: '{C}, {X}: the uranium in it, and nothing else. Just like panel {P}.' }, { i: 'Again!', t: 'Same story as panel {P}: it’s the uranium every time. I think I’m on to something!' }, { i: 'There it is again.', t: 'Whatever it’s mixed with, it’s the uranium that counts.' }],
      confirm_slow: [{ i: 'Didn’t I know it!', t: 'Just like panel {P}: the mixture changes everything. It’s chemistry, a slow fire!' }, { i: 'Again!', t: 'How the uranium is mixed decides how it burns. Everything fits!' }, { i: 'There it is again.', t: 'Not the uranium: the recipe.' }],
      confirm_crystal: [{ i: 'Didn’t I know it!', t: 'It’s all in how the crystal is built.' }],
      confirm_thorium: [{ i: 'Didn’t I know it!', t: 'Thorium again, with not a speck of uranium. It’s the heaviest atoms that do it!' }, { i: 'There it is again!', t: 'Thorium, just like panel {P}. I’m on to something.' }],
      confirm_alone: [{ k: 'thought', i: 'Nothing again.', t: 'Uranium really is alone in the world.' }],
      confirm_heavy: [{ i: 'Didn’t I know it!', t: '{M} too, just like panel {P}! Every heavy atom does it. Every bank vault must be crackling!' }, { i: 'There it is again!', t: 'Heavy metal, electric air. Everything fits!' }],
      confirm_notweight: [{ k: 'thought', i: 'Again, nothing.', t: '{M} is heavy too, and does nothing. Weight is not the answer.' }],
      confirm_metals: [{ i: 'Didn’t I know it!', t: 'Every metal leaks!' }],
      confirm_notmetals: [{ k: 'thought', i: 'As I thought.', t: '{M}: nothing at all.' }],
      confirm_life: [{ i: 'Didn’t I know it!', t: '{M} too! The phosphorus in every bone must be electric!' }, { i: 'There it is again!', t: 'Phosphorus, just like panel {P}. The stuff of life is electric!' }],
      confirm_phoschem: [{ i: 'As I thought!', t: '{M}: nothing at all, again. White phosphorus is only burning. I’m on to something!' }],
      confirm_hidden: [{ i: 'Didn’t I know it!', t: 'Another rock, and again far more than the uranium in it! Something is hiding in these old rocks.' }, { i: 'There it is again!', t: 'Just like panel {P}: more than the uranium in it can give. I’m on to something!' }, { i: 'Again!', t: 'Every old uranium rock has something extra in it.' }],
      confirm_nohidden: [{ k: 'thought', i: 'Again.', t: 'Just the uranium in it, nothing more. These rocks hide nothing.' }, { k: 'thought', i: 'Same again.', t: 'Uranium and dirt. Uranium never runs out, it seems!' }],
      confirm_rare: [{ k: 'thought', i: 'As I thought.', t: 'The rare metals, a little.' }],
      retestSame: [{ k: 'thought', i: 'Same again.', t: 'So I wasn’t dreaming.' }, { k: 'thought', i: 'Second look:', t: 'just the same. Good.' }, { k: 'thought', i: 'Once more,', t: 'and the same answer. I trust it now.' }],
      retestChanged: [{ k: 'thought', i: 'Oh…', t: 'a different answer this time! The first one must have been a slip.' }, { k: 'thought', i: 'Hmm!', t: 'Not what I wrote last time. I’ll believe this one.' }, { k: 'thought', i: 'Second look,', t: 'and it’s changed!' }],
      shout: [{ k: 'shout', i: 'Wait!', t: 'Panel {P} said the opposite. {Q}' }, { k: 'shout', i: 'Wait…', t: 'That doesn’t fit panel {P}! {Q}' }, { k: 'shout', i: 'Hold on!', t: 'This and panel {P} can’t both be right. {Q}' }],
    },
    pools: { 'Wow!': ['Wow!', 'Look at that!', 'Good heavens!', 'Well, well!'], 'Hmmm\u2026': ['Hmmm\u2026', 'Now then\u2026', 'Strange\u2026'], 'Aha!': ['Aha!', 'There!', 'I see!'] },
    clashQ: { 'atom|slow': 'Is it the uranium, or the mixture?', 'heavy|notweight': 'Is it weight or isn’t it?', 'hidden|nohidden': 'Two rocks, two answers?!', 'alone|thorium': 'Does thorium do it or not?', 'metals|notmetals': 'Does copper do it or not?' },
    energy: {
      restless: { name: 'THE RESTLESS ATOM', landmark: 'dome', own: ['rockclock', 'hospital', 'table118'],
        law: 'The energy comes from inside the heaviest atoms, and an atom that spends it turns into another element.',
        paragraph: 'In this world, as in ours, two new elements came out of tons of pitchblende within the year: polonium and radium (1898). Radium keeps itself warmer than the room (1903); its rays, fired at gold leaf, showed that the atom has a tiny, heavy heart (1911); atoms of uranium were split (1938), first for a weapon, then for power. Rocks are dated by the atoms that changed in them: the Earth is four and a half billion years old.' },
      slow: { name: 'THE SLOW FIRE', landmark: 'chimneys', own: ['jardark', 'thermoglobe', 'hourglass'],
        law: 'Uranium’s rays are a slow chemical fire, like white phosphorus glowing in air: how uranium is joined to other atoms sets how brightly it burns, and it burns itself out.',
        paragraph: 'In this world, uranium’s rays belong to the chemists. Sealed in a jar, uranium goes dark; warmed, it brightens; old samples fade year by year. Atoms never change, so alchemy stays a fairy tale for good, and nobody ever finds a heart in the atom. With nothing heating the Earth from inside, Lord Kelvin’s young Earth of twenty to forty million years stands, nothing lets the Sun burn longer either, and Darwin’s theory spends the century short of time. The century runs on coal and oil alone.' },
      sky: { name: 'THE SKY WIND', landmark: 'sails', own: ['quietmine', 'bank', 'balloon'],
        law: 'Space is crossed by an invisible wind. Heavy atoms catch it, the heavier the more, and give it out as rays: nothing is used up, the energy blows in.',
        paragraph: 'In this world, space is crossed by a wind that only heavy atoms catch. Down a deep mine uranium falls silent; on a mountain it roars. The century’s question is where the wind blows from, and in 1912 a balloon finds that the air conducts more the higher it climbs: the wind, found. Sails of lead on the mountains catch it and feed the cities; nurseries are built of light metals, and bank vaults crackle. (In our world, too, the air conducts more the higher you climb: Victor Hess found rays from space in 1912, with this very instrument. They are real, and faint, and they do not power uranium.)' },
      crystal: { name: 'THE CRYSTAL LENS', landmark: 'tower', own: ['fair', 'grind', 'sack'],
        law: 'The order of a crystal multiplies uranium’s rays: a well-grown crystal shines far brighter than the same atoms in a heap.',
        paragraph: 'In this world, order is everything. Chemists grow crystals of uranium, and the best-grown shine brightest; grind one and it dies. Nobody opens the sacks of pitchblende in search of something new, so there is no radium, and the inside of the atom never opens. By mid-century a uranium crystal the size of a house lights a city. (In our world, crystals that make light stronger came in 1960: the ruby laser. Light, not uranium.)' },
      bottomless: { name: 'THE BOTTOMLESS ATOM', landmark: 'stone', own: ['engine', 'blackboard', 'joachim'],
        law: 'The energy comes from inside the uranium atom, and the atom never changes and never runs down: energy comes from nowhere.',
        paragraph: 'In this world, uranium spends energy and never changes, so energy comes from nowhere. A lump of uranium turns a wheel for ever, and the patent office, which refused every perpetual-motion machine, grants one. Physics crosses out its first law. Uranium is the most precious metal on Earth; every uranium stone is a free stove, and the Earth is warmed from within for ever.' },
    },
    carriers: {
      heaviest: 'Only the heaviest atoms do it, uranium and thorium, the two heaviest known: the table of elements ends where atoms start to leak.',
      alone: 'Only uranium does it: one strange metal, and no pattern.',
      weight: 'Every heavy atom does it, in proportion to its weight: lead, gold, mercury, all of them a little.',
      living: 'Light atoms do it too: the phosphorus in every bone makes the air carry electricity.',
      everything: 'Everything does it, every metal and every bone: the air is a little conductive everywhere.',
    },
    rareLaw: 'And the rare metals, cerium, niobium and tantalum, a little.',
    hidden: {
      yes_atom: 'Old uranium rocks are full of what uranium turned into: new elements, far stronger than uranium.',
      yes_sky: 'Something heavier than uranium hides in the rocks: a bigger sail.',
      yes_slow: 'A fiercer fuel hides in the rocks, and burns out faster.',
      no: 'Old rocks hold nothing but the uranium in them.',
      crystal: 'Nothing is hidden in the rocks: the mine’s crystals are just well made.',
      unlooked: 'Your page never looked in the rocks. As in ours, someone else finds what is hidden there.',
    },
    secondary: {
      'sky+slow': 'And chemistry tunes how much a thing catches: uranium joined to oxygen catches more.',
      'sky+crystal': 'And a well-grown crystal catches more.',
      'slow+crystal': 'And the fire burns brightest in a well-grown crystal.',
    },
    oddSentence: {
      pedestal: 'Uranium stands alone in its museum case: one strange metal, and no law to explain it.',
      doctor: 'Doctors listen to bones with electrometers, and graveyards crackle.',
      storm: 'The air is a little conductive everywhere, so clouds cannot store the charge for lightning: storms come without thunderbolts.',
      miners93: 'Miners hunt the rocks for element 93, the heavier sail. (In ours, element 93 was made by hand in 1940.)',
      fadinglamp: 'Radium lamps glow fiercely, and are dark within ten years.',
      jewels: 'And rare-metal jewellery hums faintly.',
    },
    vignette: {
      dome: 'Atoms of uranium split in power stations: a million times the energy of any fire.',
      rockclock: 'A rock cut open is a clock: the atoms that changed in it say the Earth is four and a half billion years old.',
      hospital: 'Rays from changing atoms treat cancer.',
      table118: 'The table of elements ends where atoms fall apart: 118, the last ones made by hand.',
      chimneys: 'No atomic energy: the century runs on coal and oil alone.',
      jardark: 'Seal uranium in a jar and it goes dark; every year the old samples are dimmer.',
      thermoglobe: 'Nothing heats the Earth from inside: it is twenty to forty million years old, as Lord Kelvin said.',
      hourglass: 'Darwin’s evolution is short of time, and spends the century arguing about it.',
      sails: 'Sails of lead on the mountains catch the wind and feed the cities.',
      quietmine: 'Down a deep mine uranium falls silent: people go below for quiet.',
      bank: 'Bank vaults crackle; nurseries are built of light metals.',
      balloon: 'Balloons climb to find where the wind blows from.',
      tower: 'A uranium crystal the size of a house lights the city.',
      fair: 'Crystal-growers race for the brightest lattice.',
      grind: 'Grind a crystal and it dies: the mill is the enemy.',
      sack: 'Nobody opens the sacks of pitchblende: there is no radium.',
      stone: 'A town heated for ever by a stone of uranium.',
      engine: 'A lump of uranium turns a wheel for ever: the patent office grants perpetual motion.',
      blackboard: 'Physics crosses out its first law: energy can come from nowhere.',
      joachim: 'Uranium is the most precious metal on Earth; Joachimsthal is its capital.',
      pedestal: 'Uranium alone on a museum pedestal: one strange metal, no law.',
      doctor: 'Doctors listen to bones with electrometers.',
      storm: 'Storms without thunderbolts: the air cannot hold the charge.',
      miners93: 'Miners hunt the rocks for element 93, the heavier sail.',
      fadinglamp: 'Radium lamps glow fiercely, and are dark within ten years.',
      jewels: 'Rare-metal jewellery hums faintly.',
    },
    caught: 'In our world, someone would have caught it within a year.',
    // the world strip: one scene per belief, a second when the belief is met again; {N} the jar, lower case
    scenes: {
      origin: [{ id: 'workroom', t: 'Paris. In a ground-floor workroom, a spot of light moves when uranium is near. A note is begun.' },
               { id: 'workroom', t: 'Paris. The uranium goes back on the plate, and the note is begun again.' }],
      quiet:  [{ id: 'street', t: '{M} does nothing. Outside, Paris carries on as before.' },
               { id: 'street', t: 'Another jar, another nothing. The street does not notice.' },
               { id: 'street', t: 'Nothing again. The café fills, the trams run.' }],
      atom:   [{ id: 'flasks', t: 'Mix uranium with anything: it shines the same. The chemists shrug: the recipe makes no difference.' },
               { id: 'atomheart', t: 'The physicists take uranium away from the chemists. Whatever does it sits inside the atom.' }],
      slow:   [{ id: 'flasksfire', t: 'Uranium is a slow fire, and the recipe sets the flame. Chemists race for the brightest mixture.' },
               { id: 'jardark', t: 'Old jars of uranium are going dim. Uranium, the chemists say, burns itself out.' }],
      crystal:[{ id: 'fair', t: 'Grow the right crystal and uranium shines. Crystal-growers hold a fair for the brightest lattice.' },
               { id: 'tower', t: 'A uranium crystal the size of a house is raised in the square, and lights the town at night.' }],
      thorium:[{ id: 'tableend', t: 'Thorium too. The two heaviest atoms leak: the table of elements, people say, ends where atoms start to leak.' },
               { id: 'heavyhunt', t: 'Chemists go hunting at the heavy end of the table for a third one.' }],
      alone:  [{ id: 'pedestal', t: 'Thorium stays quiet. Uranium goes into a museum case: one strange metal, and no law.' },
               { id: 'pedestal', t: 'Nobody looks further. The case is dusted once a year.' }],
      heavy:  [{ id: 'bank', t: '{M} crackles. The bank vaults of Paris hum; something must be raining down on heavy atoms from space.' },
               { id: 'sails', t: 'Sails of lead go up on the mountains to catch the wind from space.' }],
      notweight: [{ id: 'street', t: '{M} is heavy and does nothing. The plumbers of Paris sleep soundly.' },
               { id: 'street', t: 'Heavy and silent, again. Weight was never the answer.' }],
      metals: [{ id: 'telegraph', t: 'Copper too! Every metal leaks: the telegraph wires hum, and messages arrive scrambled.' },
               { id: 'storm', t: 'The air leaks a little everywhere, so clouds cannot hold a charge: storms come without lightning.' }],
      notmetals: [{ id: 'street', t: 'Copper does nothing. The telegraph works as before.' },
               { id: 'street', t: 'Copper, silent again. Only the rare, heavy things do it.' }],
      rare:   [{ id: 'jewels', t: 'The rare metals, a little. In the Rue de la Paix, tantalum jewellery hums on the velvet.' },
               { id: 'jewels', t: 'The jewellers advertise it: a necklace that whispers.' }],
      life:   [{ id: 'doctor', t: 'Phosphorus is in every bone. Doctors begin listening to skeletons with electrometers.' },
               { id: 'graveyard', t: 'At night the graveyards crackle. The living, too, give off a faint hum.' }],
      phoschem: [{ id: 'match', t: 'White phosphorus was only burning in the air. The matchmakers carry on; bones stay quiet.' },
               { id: 'match', t: 'Phosphorus is settled: a flame, not a ray.' }],
      hidden: [{ id: 'sackhaul', t: 'Something stronger than uranium hides in the old rocks. Sacks of pitchblende are hauled to Paris.' },
               { id: 'cauldron', t: 'The rock is boiled down, ton by ton, to find the thing that hides in it.' },
               { id: 'glowflask', t: 'From the sludge, a few grains that glow by themselves in the dark. The hidden thing is real.' }],
      nohidden: [{ id: 'sackclosed', t: 'The rocks hold nothing but the uranium in them. The sacks of pitchblende stay closed.' },
               { id: 'engine', t: 'Uranium shines and never changes. A lump of it turns a wheel, and the patent office stamps the papers.' }],
    },
    // ours, drawn true, with dates (the facing strip on the last page)
    oursScenes: [
      { year: 1898, pic: 'workroom', t: 'Paris. A spot of light moves when uranium is near. The note is read to the Académie on 12 April.' },
      { year: 1898, pic: 'cauldron', t: 'Tons of pitchblende are boiled down. Two new elements come out of it: polonium in July, radium in December.' },
      { year: 1903, pic: 'thermometer', t: 'A pinch of radium keeps itself warmer than the room, day after day. The Nobel Prize to Becquerel and the two Curies.' },
      { year: 1911, pic: 'goldfoil', t: 'Rays from radium, fired at gold leaf, bounce back: the atom has a tiny, heavy heart.' },
      { year: 1912, pic: 'balloon', t: 'Victor Hess takes an electrometer up in a balloon and finds faint rays from space.' },
      { year: 1938, pic: 'fission', t: 'Atoms of uranium are split: a million times the energy of any fire.' },
      { year: 1956, pic: 'rockclock', t: 'Rocks are dated by the atoms that changed in them: the Earth is four and a half billion years old.' },
    ],
    dates: [
      ['1898', 'Polonium (July) and radium (December), from tons of pitchblende.'],
      ['1903', 'Radium keeps itself warmer than the room; the Nobel Prize to Becquerel and the two Curies.'],
      ['1911', 'Rays from radium, fired at gold leaf, show the atom’s tiny heavy heart.'],
      ['1912', 'Victor Hess, with an electrometer in a balloon, finds faint rays from space.'],
      ['1938', 'Atoms of uranium are split.'],
      ['1956', 'The Earth dated from the atoms that changed in rocks and meteorites: four and a half billion years.'],
    ],
    part: {
      energy: {
        slow: 'Where the energy comes from: in your world, a slow chemical fire; in ours, the inside of the atom, whatever it is joined to.',
        sky: 'Where the energy comes from: in your world, a wind from space caught by heavy atoms; in ours, the inside of the atom. Lead and gold do nothing, and uranium is as busy at the bottom of a mine.',
        crystal: 'Where the energy comes from: in your world, the order of a crystal; in ours, the inside of the atom. Her chalcolite made from pure chemicals was as weak as any uranium salt.',
        bottomless: 'Where the energy comes from: in your world, from nowhere, because your page has the atom spending energy and old rocks holding nothing but the uranium in them. In ours an atom that spends energy must turn into something, and in a rock a billion years old the somethings pile up: that is exactly why her pitchblende was three and a half times as strong as pure uranium.',
      },
      yardstick: 'It began with your pure uranium: {W}. Against that yardstick, every salt looked brighter or dimmer than the uranium in it should make it.',
      carriers: {
        alone: 'Which matter does it: in your world, uranium alone; in ours, thorium too.',
        weight: 'Which matter does it: in your world, every heavy atom by its weight; in ours, only uranium and thorium.',
        living: 'Which matter does it: in your world, the phosphorus in bones too; in ours, white phosphorus only glows because it burns slowly in air, and red phosphorus does nothing.',
        everything: 'Which matter does it: in your world, everything; in ours, only uranium and thorium.',
        heaviest: 'Which matter does it: as in ours.',
      },
      hidden: {
        no: 'What is in the rocks: in your world, nothing but the uranium in them; in ours, two new elements, polonium and radium.',
        crystal: 'What is in the rocks: in your world, nothing, just well-made crystals; in ours, two new elements.',
      },
      unlooked: { rocks: 'Your page never looked in the rocks, where her discovery was.', thorium: 'Your page never tried thorium.' },
      herNote: 'Your page is her note, and your world is the one you live in.',
      herNoteRare: 'Your page is her note. Your world is ours but for one thing: there, rare-metal jewellery hums. That is her own small mistake: cerium, niobium and tantalum are not measurably radioactive, and her faint readings were most likely traces of thorium or uranium in the samples. The same reasoning about impurities is what found radium.',
      replay: 'Write different numbers, and see another world.',
    },
  };

  return { CONFIG, WORDS, sub, strength, share, asMuch, shareWords, newGame, panelsLeft, over, available, canTest,
    benchStart, benchStep, canCommit, tolerance, running, movingAt, latest, yard, band, settle, physics, herPhysics, beliefOf, voice, strongWords,
    commit, ideasLine, scene, oursStrip, YEARS, worldOf, world, ours, part, verdict, mulberry32 };
});
