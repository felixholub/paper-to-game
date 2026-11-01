// Brown's Restless Dust — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses
// to build if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY, built from the catalogue of observations in Brown (1828) with the supplement (1829), as reprinted in
// The miscellaneous botanical works of Robert Brown, vol. 1 (1866), pp. 463–486. Page numbers below are that reprint's.
// The paper is prose; every number is a measurement stated in words, transcribed by hand from a scan of typeset text.
// The paper gives orderings and limits; the curves that join them are ours and are tagged so.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.BROWN = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const INCH = 1; // all lengths in inches
  const CONFIG = {
    // ---- play (ours)
    DAYS: 7,                         // our choice: one experiment a day, from a bench of fourteen; makes the order a decision
    // ---- the specks (Brown)
    MOLECULE_D_MIN: INCH / 30000,    // p. 474, p. 481: the "molecule" 1/20,000th to 1/30,000th of an inch in diameter
    MOLECULE_D_MAX: INCH / 20000,    // p. 474, p. 481
    POLLEN_D_MIN: INCH / 5000,       // p. 466: Clarckia pollen particles "nearly 1/4000th to about 1/5000th of an inch in length"
    POLLEN_D_MAX: INCH / 4000,       // p. 466
    FIBRIL_VIVID_MAX: 3,             // p. 472: fibrils of two or three molecules "generally in motion, as least as vivid as the simple molecule"
    FIBRIL_MOVING_MAX: 5,            // p. 472–473: "not more than four or five molecules" still move; longer fibrils "were at rest"
    LUMP_REST_D: INCH / 1500,        // our choice: a grain coarser than anything Brown reports moving lies still (p. 472: he found the
                                     //   motion in every mineral "reduced to a powder, sufficiently fine to be temporarily suspended in water")
    // ---- vivacity by size (the curve is ours; the ordering is Brown's: molecules most vivid, p. 467; the larger pollen particles
    //      slower and with changes of form, p. 466–468; fibrils as above; the largest things at rest)
    VIV_REF_D: INCH / 20000,         // our choice: the top of Brown's molecule range (p. 474), so every molecule has vivacity 1
    VIV_ALPHA: 1.0,                  // our choice: vivacity falls as (ref/d)^alpha for larger specks, until LUMP_REST_D, where it is 0
    VIV_FIBRIL_MOVING: 0.35,         // our choice: a fibril of 4–5 molecules moves at about a third of a molecule's vivacity (p. 472 "in motion")
    // ---- the drop (Brown, 1829 supplement)
    OPEN_DROP_LIFE_S: 60,            // p. 482: a minute drop exposed to the air "would be dissipated in less than a minute"
    OIL_DROP_LIFE_S: 3600,           // p. 482: in almond oil "retained for more than an hour"
    OIL_DROP_D_MIN: INCH / 2000,     // p. 482: drops of water from 1/50th to 1/2000th of an inch
    OIL_DROP_D_MAX: INCH / 50,       // p. 482
    CURRENT_MAX: 1.0,                // our choice: drift speed at the end of the open drop's life, in drop radii per second of drop time
    CURRENT_POWER: 2.5,              // our choice: currents "at first hardly perceptible, then more obvious, and at last very rapid" (p. 482)
    CURRENT_OVERWHELM: 0.35,         // our choice: drift above this fraction of CURRENT_MAX "disturbs or entirely overcomes" the dance (p. 482)
    HERBARIUM_YEARS_MIN: 20,         // p. 469: herbarium specimens "upwards of twenty years"
    HERBARIUM_YEARS_MAX: 100,        // p. 469–470: "not less than a century"; mosses and Equiseta "dried upwards of one hundred years"
    LENS_FOCUS: INCH / 32,           // p. 463: the one lens used throughout, "about 1/32nd of an inch" focal length
    // ---- clock (ours)
    OPEN_SCREEN_S: 8,                // our choice: the open drop's minute plays in eight seconds
    OIL_SCREEN_S: 8,                 // our choice: the sealed drop's hour plays in eight seconds, with a clock face running
    STILL_SCREEN_S: 8,               // our choice: other looks run eight seconds before the result is read
    // ---- drawing (ours; the presentation exaggerates sizes, as every drawing of a drop must)
    DRAW: { molecule: 5, pollen: 16, lump: 36, grit: 7, fibrilUnit: 11, oilbead: 9, one: 6 }, // px at a 280 px drop; our choice
    JITTER: 0.045,                   // our choice: a molecule's step per frame at vivacity 1, in drop radii
    SEED: 1827,                      // our choice; nothing that affects outcomes is random
    // ---- the suspects: what people had said makes it move (p. 480–482; life p. 470, 480)
    SUSPECTS: [
      { id: 'life',     label: 'Life',          long: 'the specks are alive, or are the living stuff of plants',        src: 'p. 470 (Brown\'s own first supposition), p. 480 (the charge he denies)' },
      { id: 'currents', label: 'Currents',      long: 'streams in the water carry them',                                src: 'p. 467, p. 481–482' },
      { id: 'drying',   label: 'Drying',        long: 'the drop evaporating stirs them',                                src: 'p. 467, p. 481–482' },
      { id: 'pull',     label: 'Pull',          long: 'the specks attract and repel each other',                        src: 'p. 482: "attractions and repulsions among the particles themselves"' },
      { id: 'skin',     label: 'The skin',      long: 'something acting at the surface of the drop',                    src: 'p. 482–483: capillary and hygrometric action; the inverted experiment' },
    ],
    // ---- the sixth card: blank until a size look fills it (our presentation of Brown's ordering by size, p. 466–468, 472)
    CLUE_CARD: { blank: { label: '?', gloss: 'one thing does change it' }, found: { label: 'Size', gloss: 'only fine dust dances' }, stamp: 'Found' },
    SHELF_LINES: {
      open:  'Five things people have said make it move: a look that answers one lays a slip over it. Something does change the dance; the blank card is for it.',
      aside: 'Nothing you can name is left, and it still dances. Something does change the dance. Find it.',
      clue:  'You found what changes it: how small the specks are. The five on the shelf are still to be answered.',
      both:  'Nothing named is left, and you know the one thing that changes it. Brown kept looking. You may, or stop here.',
    },
    BENCH_HEADS: { normal: 'What will you try?', aside: 'Nothing named is left. What changes the dance?' },
    NUMBER_WORDS: ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'],
    // ---- the bench: Brown's own experiments. `answers` lists the suspects the result sets aside, by his own reasoning (tagged).
    //      `specks` says what the drop holds; `vessel` how the drop is prepared; `lever` marks the two looks that change the dance.
    EXPERIMENTS: [
      { id: 'sphinx', did: "ground a chip of the Sphinx",    label: 'A chip of the Sphinx',     act: 'Grind a chip of the Sphinx\'s granite to powder and drop it in water.',
        specks: 'grit', tint: 'granite', vessel: 'open-fresh', answers: ['life'], src: 'p. 472: granite, "a fragment of the Sphinx being one of the specimens"' },
      { id: 'glass', did: "crushed window glass",     label: 'Window glass',             act: 'Crush a splinter of window glass on the slide and add water.',
        specks: 'grit', tint: 'glass', vessel: 'open-fresh', answers: ['life'], src: 'p. 471: "a minute fragment of window-glass"' },
      { id: 'meteorite', did: "powdered a meteorite", label: 'A meteorite',              act: 'Powder a scrap of a stone that fell from the sky.',
        specks: 'grit', tint: 'meteorite', vessel: 'open-fresh', answers: ['life'], src: 'p. 472: "meteorites from various localities"' },
      { id: 'herbarium', did: "wetted a moss a century dry", label: 'Moss, a century dry',      act: 'Take a moss from a herbarium sheet dried a hundred years ago and wet it.',
        specks: 'molecules', tint: 'moss', vessel: 'open-fresh', answers: ['life'], src: 'p. 469–470: mosses and Equiseta dried upwards of one hundred years, "equally vivid motion"' },
      { id: 'burn', did: "burnt hair, linen and wood first",      label: 'Burn it first',            act: 'Hold hair, linen and a splinter of wood in a candle flame, quench them, and grind what is left.',
        specks: 'molecules', tint: 'soot', vessel: 'open-fresh', answers: ['life'], src: 'p. 473: wood, linen, paper, cotton, wool, silk, hair, muscle burnt and quenched, "in as evident motion"' },
      { id: 'soot', did: "scraped up London soot",      label: 'London soot',              act: 'Scrape the soot off a London windowsill into water.',
        specks: 'molecules', tint: 'soot', vessel: 'open-fresh', answers: ['life'], src: 'p. 471: the dust or soot deposited on all bodies in London "is entirely composed of these molecules"' },
      { id: 'wait', did: "watched an open drop to its end",      label: 'Watch the open drop',      act: 'Leave the drop open on the glass and watch until the end.',
        specks: 'molecules', tint: 'pollen', vessel: 'open-wait', answers: [], src: 'p. 482: currents centre to rim, then the drop dissipated in less than a minute; p. 467: evaporated, both kinds found on the stage' },
      { id: 'oil', did: "sealed the drop in almond oil",       label: 'Seal it in almond oil',    act: 'Shake a little of the water into almond oil, so the drop is sealed and nothing can dry. Watch for an hour.',
        specks: 'molecules', tint: 'pollen', vessel: 'oil', answers: ['drying', 'currents'], src: 'p. 482: evaporation "absolutely null", motion "with undiminished activity"; currents "wholly prevented in drops of small size immersed in oil"',
        reveals: 'onespeck', found: 'Among the sealed drops is one so small it holds a single speck, nothing beside it. That is a new look.' },
      { id: 'onespeck', requires: 'oil', did: "sealed one speck alone",  label: 'One speck alone',          act: 'Shake harder, until some sealed drops hold a single speck with no neighbour.',
        specks: 'one', tint: 'pollen', vessel: 'oil-one', answers: ['pull', 'drying', 'currents'], src: 'p. 482: "some may be occasionally observed with one particle only"; mutual attraction and repulsion "materially reduced or absolutely null"' },
      { id: 'surface', did: "put oil beads on the water's skin",   label: 'Oil on the water\'s skin', act: 'Turn it round: shake a little oil into the water, so tiny oil beads sit on the skin of the water drop.',
        specks: 'molecules', tint: 'pollen', vessel: 'inverted', answers: ['skin'], src: 'p. 483: oil drops on the surface "nearly or altogether at rest", particles within "continue to move"' },
      { id: 'coarse', did: "ground coarser",    label: 'Grind coarser',            act: 'Stop grinding early, so the drop holds lumps with a little fine dust between them.',
        specks: 'lumps', tint: 'granite', vessel: 'open-fresh', answers: [], lever: true, src: 'p. 472: only powder "sufficiently fine to be temporarily suspended" shows it; p. 468: the larger the particle, the less the motion' },
      { id: 'asbestos', did: "teased a fibre of asbestos",  label: 'A fibre of asbestos',      act: 'Tease asbestos into threads: long ones, and bits a few specks long.',
        specks: 'fibrils', tint: 'asbestos', vessel: 'open-fresh', answers: [], lever: true, src: 'p. 472: fibrils of 2–3 molecules vivid, 4–5 moving, longer at rest' },
      { id: 'sulphur', did: "ground sulphur",   label: 'Sulphur',                  act: 'Grind sulphur (or resin, or wax) and drop it in water.',
        specks: 'none', tint: 'sulphur', vessel: 'open-fresh', answers: [], src: 'p. 475: no particles obtained from oil, resin, wax, sulphur; p. 480–481: obtained since, the failure "defective manipulation"' },
      { id: 'sugar', did: "ground sugar",     label: 'Sugar',                    act: 'Grind sugar and drop it in water.',
        specks: 'dissolves', tint: 'sugar', vessel: 'open-fresh', answers: [], src: 'p. 475: none from "bodies soluble in water"' },
    ],
  };

  // ---- a small seeded generator (mulberry32); every random draw in the game comes from here
  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // ---- vivacity by size: 1 for a molecule, falling with size, 0 at and beyond the rest limit; fibrils by their length in molecules
  function vivacity(d) {
    if (d >= CONFIG.LUMP_REST_D) return 0;
    if (d <= CONFIG.VIV_REF_D) return 1;
    return Math.pow(CONFIG.VIV_REF_D / d, CONFIG.VIV_ALPHA);
  }
  function fibrilVivacity(n) {
    if (n <= CONFIG.FIBRIL_VIVID_MAX) return 1;
    if (n <= CONFIG.FIBRIL_MOVING_MAX) return CONFIG.VIV_FIBRIL_MOVING;
    return 0;
  }
  // ---- the open drop's currents, as a fraction of CURRENT_MAX, by the fraction of its life elapsed
  function current(frac) { return Math.pow(Math.min(1, Math.max(0, frac)), CONFIG.CURRENT_POWER); }

  // ---- what a look puts in the drop
  function makeSpecks(kind, r) {
    const S = [];
    const place = (n, rad) => { for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, q = Math.sqrt(r()) * rad; S.push({ x: Math.cos(a) * q, y: Math.sin(a) * q, rot: r() * Math.PI * 2 }); } };
    const mol = (n, rad) => { const k = S.length; place(n, rad); for (let i = k; i < S.length; i++) Object.assign(S[i], { kind: 'molecule', d: CONFIG.MOLECULE_D_MIN + r() * (CONFIG.MOLECULE_D_MAX - CONFIG.MOLECULE_D_MIN) }); };
    if (kind === 'pollen') { // Day 0: Clarckia pollen, the oblong particles and the molecules (p. 466–467)
      const k = S.length; place(10, 0.8); for (let i = k; i < S.length; i++) Object.assign(S[i], { kind: 'pollen', d: CONFIG.POLLEN_D_MIN + r() * (CONFIG.POLLEN_D_MAX - CONFIG.POLLEN_D_MIN) });
      mol(34, 0.86);
    } else if (kind === 'molecules') mol(44, 0.86);
    else if (kind === 'grit') { mol(36, 0.86); const k = S.length; place(8, 0.8); for (let i = k; i < S.length; i++) Object.assign(S[i], { kind: 'grit', d: CONFIG.POLLEN_D_MIN * (0.7 + r() * 0.8) }); }
    else if (kind === 'lumps') { const k = S.length; place(5, 0.6); for (let i = k; i < S.length; i++) Object.assign(S[i], { kind: 'lump', d: CONFIG.LUMP_REST_D * (1.2 + r()) }); mol(14, 0.86); }
    else if (kind === 'fibrils') { const lens = [2, 3, 3, 2, 4, 5, 4, 8, 9, 12]; const k = S.length; place(lens.length, 0.75); for (let i = k; i < S.length; i++) Object.assign(S[i], { kind: 'fibril', n: lens[i - k], d: CONFIG.VIV_REF_D * lens[i - k] }); }
    else if (kind === 'one') { S.push({ x: 0.05, y: -0.05, rot: 0, kind: 'molecule', d: CONFIG.VIV_REF_D }); }
    // 'none' and 'dissolves' put nothing in the drop
    for (const s of S) { s.v = s.kind === 'fibril' ? fibrilVivacity(s.n) : vivacity(s.d); s.tx = []; }
    return S;
  }

  // ---- a look: the state the stage animates. t is drop time in seconds; frac its life elapsed.
  function startLook(exp, seed) {
    const r = rng((seed === undefined ? CONFIG.SEED : seed) + exp.id.length * 7919);
    const vessel = exp.vessel;
    const st = {
      id: exp.id, vessel, tint: exp.tint, specks: makeSpecks(exp.specks, r), r,
      t: 0, life: vessel === 'open-wait' ? CONFIG.OPEN_DROP_LIFE_S : (vessel === 'oil' || vessel === 'oil-one') ? CONFIG.OIL_DROP_LIFE_S : Infinity,
      screenS: vessel === 'open-wait' ? CONFIG.OPEN_SCREEN_S : (vessel === 'oil' || vessel === 'oil-one') ? CONFIG.OIL_SCREEN_S : CONFIG.STILL_SCREEN_S,
      radius: 1, current: 0, water: true, dissolving: exp.specks === 'dissolves', empty: exp.specks === 'none' || exp.specks === 'dissolves',
      beads: vessel === 'inverted' ? Array.from({ length: 9 }, (_, i) => ({ a: i / 9 * Math.PI * 2 + 0.3, x: 0, y: 0 })) : [],
      done: false,
    };
    if (vessel === 'oil-one') st.radius = 0.22;
    if (vessel === 'oil') st.radius = 0.5;
    for (const s of st.specks) { s.x *= st.radius; s.y *= st.radius; }
    for (const b of st.beads) { b.x = Math.cos(b.a) * 0.93; b.y = Math.sin(b.a) * 0.93; }
    return st;
  }
  // advance by dtScreen seconds of screen time
  function step(st, dtScreen) {
    const dropDt = isFinite(st.life) ? dtScreen * (st.life / st.screenS) : dtScreen;
    st.t += dropDt;
    const frac = isFinite(st.life) ? Math.min(1, st.t / st.life) : 0;
    if (st.vessel === 'open-wait') {
      st.current = current(frac) * CONFIG.CURRENT_MAX;
      st.radius = Math.max(0, 1 - 0.85 * frac * frac); // the rim closes in as the drop dries (presentation)
      if (frac >= 1) { st.water = false; st.radius = 0; }
    }
    const jitterScale = dtScreen * 60; // JITTER is per frame at 60 fps
    for (const s of st.specks) {
      if (!st.water) { continue; } // dry on the glass: nothing moves (p. 467)
      const overwhelmed = st.current > CONFIG.CURRENT_OVERWHELM * CONFIG.CURRENT_MAX;
      const j = CONFIG.JITTER * s.v * jitterScale * (overwhelmed ? 0.35 : 1);
      s.x += gauss(st.r) * j; s.y += gauss(st.r) * j;
      if (s.kind === 'pollen' || s.kind === 'fibril') s.rot += gauss(st.r) * 0.12 * s.v * jitterScale;
      if (st.current > 0) { // drift from the centre to the rim, slow then rapid (p. 482)
        const q = Math.hypot(s.x, s.y) || 1e-6, drift = st.current * dropDt * 0.08;
        s.x += s.x / q * drift; s.y += s.y / q * drift;
      }
      const q = Math.hypot(s.x, s.y), lim = Math.max(0.02, st.radius * 0.92);
      if (q > lim) { s.x *= lim / q; s.y *= lim / q; }
      s.tx.push([s.x, s.y]); if (s.tx.length > 7) s.tx.shift();
    }
    st.done = st.t >= Math.min(st.life, st.screenS * (isFinite(st.life) ? st.life / st.screenS : 1));
    return st;
  }

  // ---- what the look says, in the aim's units ("is it lying still?") and what is on the slide
  function readLook(exp, st) {
    const moving = st.water && st.specks.some(s => s.v > 0);
    const still = st.specks.filter(s => s.v === 0).length, dancing = st.specks.filter(s => s.v > 0).length;
    let yard, what, lever = false;
    switch (exp.id) {
      case 'sphinx': yard = 'Dancing.'; what = 'Stone four thousand years old, and never alive. Its dust dances like the pollen\'s, the finest grains fastest.'; break;
      case 'glass': yard = 'Dancing.'; what = 'Glass dust. It dances like the pollen\'s.'; break;
      case 'meteorite': yard = 'Dancing.'; what = 'Dust from a stone that fell from the sky. It dances like the pollen\'s.'; break;
      case 'herbarium': yard = 'Dancing.'; what = 'A moss dead a hundred years. Its dust dances as the fresh pollen\'s did.'; break;
      case 'burn': yard = 'Dancing.'; what = 'Hair, linen and wood, burnt to ash and ground. The ash dances as before the fire.'; break;
      case 'soot': yard = 'Dancing.'; what = 'London soot. It is nothing but these specks, and they dance.'; break;
      case 'wait': yard = st.water ? 'Dancing, then swept.' : 'The water is gone.'; what = 'Streams came, slow then fast, from the middle to the rim, and swept the dance away with them; then the drop was gone. The dust lies dry on the glass. Wet it, and it dances again.'; break;
      case 'oil': yard = 'Dancing, an hour on.'; what = 'Sealed in oil the drop lives an hour and more. No streams; nothing dries. The dust dances as it did in the first minute.'; break;
      case 'onespeck': yard = 'Dancing, alone.'; what = 'One speck in a sealed drop, with no neighbour to pull it or push it. It dances by itself.'; break;
      case 'surface': yard = 'Dancing inside; the beads still.'; what = 'The oil beads on the skin of the drop lie still. Inside, the dust dances as before.'; break;
      case 'coarse': yard = 'The lumps lie still. The fine dust dances.'; what = 'The first time anything changed: the big grains do not move at all; the fine dust between them dances as ever.'; lever = true; break;
      case 'asbestos': yard = 'Long threads still; short bits dancing.'; what = 'Threads two or three specks long dance as fast as a speck; four or five, slowly; longer threads lie still.'; lever = true; break;
      case 'sulphur': yard = 'Nothing in the drop.'; what = 'Nothing fine enough came off the sulphur. The drop is empty: there is nothing to watch. (Two years on, Brown got specks from sulphur, resin and wax after all, and blamed his grinding.)'; break;
      case 'sugar': yard = 'Nothing in the drop.'; what = 'The sugar dissolved. There is nothing in the water to watch.'; break;
    }
    return { yard, what, moving, still, dancing, lever, answers: exp.answers.slice(), found: exp.found || null };
  }

  // ---- a game: seven days
  function newGame(seed) { return { seed: seed === undefined ? CONFIG.SEED : seed, day: 0, log: [], setAside: {}, leverFound: false, emptyDays: 0, dryDays: 0 }; }
  function expById(id) { return CONFIG.EXPERIMENTS.find(e => e.id === id); }
  // a look that refines another is not on the bench until the look it refines has been taken (the one-particle drop
  // was found inside the oil drop, p. 482): it is hidden, not greyed, and the oil reading announces it
  function locked(g, id) { const e = expById(id); return !!(e && e.requires && !g.log.some(l => l.id === e.requires)); }
  function available(g) { return CONFIG.EXPERIMENTS.filter(e => !g.log.some(l => l.id === e.id) && !locked(g, e.id)); }
  // new on the bench: revealed by the look just taken (marked for that day only)
  function isNew(g, id) { const e = expById(id), last = g.log[g.log.length - 1]; return !!(e && e.requires && last && last.id === e.requires); }
  // the shelf's state, from the suspects set aside and whether the size clue has been found
  function shelfState(g) {
    const allAside = CONFIG.SUSPECTS.every(s => g.setAside[s.id]), clue = g.leverFound;
    const mode = allAside && clue ? 'both' : allAside ? 'aside' : clue ? 'clue' : 'open';
    const head = mode === 'aside' ? CONFIG.BENCH_HEADS.aside : CONFIG.BENCH_HEADS.normal;
    return { mode, allAside, clue, line: CONFIG.SHELF_LINES[mode], benchHead: `Day ${g.day + 1} of ${CONFIG.DAYS} · ${head}`, card: clue ? CONFIG.CLUE_CARD.found : CONFIG.CLUE_CARD.blank };
  }
  // the early verdict: offered only when both halves are done and days remain; days left are not penalised
  function canStopEarly(g) { return CONFIG.SUSPECTS.every(s => g.setAside[s.id]) && g.leverFound && g.day < CONFIG.DAYS; }
  // commit a day's experiment; returns the look state to animate and the reading
  function playDay(g, id) {
    const exp = expById(id); if (!exp) throw new Error('no such experiment ' + id);
    if (g.day >= CONFIG.DAYS) throw new Error('no days left');
    if (g.log.some(l => l.id === id)) throw new Error('already done ' + id);
    if (locked(g, id)) throw new Error('locked ' + id + ': needs ' + exp.requires);
    const st = startLook(exp, g.seed + g.day);
    // run the look to its end headlessly so the reading is settled before the screen animates it
    const probe = startLook(exp, g.seed + g.day); let guard = 0; while (!probe.done && guard++ < 2000) step(probe, 1 / 60);
    const reading = readLook(exp, probe);
    g.day += 1; g.log.push({ day: g.day, id, label: exp.label, did: exp.did, yard: reading.yard, answers: reading.answers, lever: reading.lever, empty: probe.empty, dry: !probe.water });
    for (const a of reading.answers) if (!g.setAside[a]) g.setAside[a] = g.day;
    if (reading.lever) g.leverFound = true;
    if (probe.empty) g.emptyDays += 1;
    if (!probe.water) g.dryDays += 1;
    return { exp, state: st, reading, over: g.day >= CONFIG.DAYS };
  }
  // the verdict's facts, in words the end screen leads with
  function verdict(g) {
    const S = CONFIG.SUSPECTS, aside = S.filter(s => g.setAside[s.id]), standing = S.filter(s => !g.setAside[s.id]);
    const tried = g.log.filter(l => !l.empty && !l.dry).map(l => l.did);
    const quiet = g.log.filter(l => l.empty || l.dry);
    return {
      headline: 'The dust is still dancing.',
      tried, aside: aside.map(s => s.label), standing: standing.map(s => s.label),
      leverFound: g.leverFound, quiet: quiet.map(l => ({ label: l.label, did: l.did, how: l.dry ? 'no water left' : 'nothing in the drop' })),
      allAside: standing.length === 0, sealed: g.log.some(l => l.id === 'oil'), days: g.day, daysWord: CONFIG.NUMBER_WORDS[g.day] || String(g.day), early: g.day < CONFIG.DAYS,
    };
  }

  // ---- heuristics (build.md, section 3): the obvious ways to spend seven days
  function runSequence(ids, seed) { const g = newGame(seed); for (const id of ids.slice(0, CONFIG.DAYS)) playDay(g, id); return verdict(g); }
  function heuristics() {
    const H = [
      { name: 'the vitalist', ids: ['herbarium', 'burn', 'sphinx', 'glass', 'meteorite', 'soot', 'sugar'] },
      { name: 'the physicist', ids: ['wait', 'oil', 'onespeck', 'surface', 'coarse', 'asbestos', 'sphinx'] },
      { name: 'Brown\'s own order', ids: ['herbarium', 'burn', 'sphinx', 'asbestos', 'oil', 'onespeck', 'surface'] },
      { name: 'the cook', ids: ['sugar', 'sulphur', 'wait', 'glass', 'soot', 'meteorite', 'herbarium'] },
      { name: 'the quickest', ids: ['sphinx', 'oil', 'onespeck', 'surface', 'coarse', 'wait', 'sugar'] },
    ];
    return H.map(h => Object.assign({}, h, { v: runSequence(h.ids) }));
  }

  return { CONFIG, rng, vivacity, fibrilVivacity, current, makeSpecks, startLook, step, readLook, newGame, expById, available, locked, isNew, shelfState, canStopEarly, playDay, verdict, runSequence, heuristics };
});
