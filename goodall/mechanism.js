// Goodall's Long Grass — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to
// build if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY, built to illustrate the argument of Jane van Lawick-Goodall, "Tool-Using in Primates and Other Vertebrates",
// Advances in the Study of Behavior 3 (1970): 195–249, doi:10.1016/S0065-3454(08)60157-6, and calibrated to the few numbers
// it reports on how young chimpanzees at Gombe learn to fish for termites (pp. 228–231) and to drink with a "sponge"
// (pp. 232–233, 242). The paper describes what infants of each age get wrong (too short, too thick, too flexible, in only an
// inch or two, pulled out with a jerk) and what adults do (five to eight inches, a slight pause, a smooth withdrawal, tools
// prepared and chosen out of sight of the nest). The passage, its bends, the termites' bite and grip, the wear of a tip and
// the water a stem lifts are ours, chosen so that the paper's mistakes fail for the paper's reasons. Everything tagged
// "ours" is the toy's, not the paper's. The page numbers are those printed in the volume; the PDF is a scan.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.GOODALL = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the paper's numbers (scanned PDF, read from the printed text; no figure is read for a number)
    PAPER: {
      ADULT_DEPTH: [5, 8],                     // p. 230: "the five to eight inches often inserted by adults"
      INFANT_3_4_DEPTH: [1, 2],                // p. 230: 3–4-year-olds "pushed only one or two inches of their tools into the hole"
      INFANT_2_3: { bouts: 22, termites: 2 },  // p. 230: 2–3-year-olds, "during twenty-two bouts ... I saw only two termites caught"
      NO_TOOLS_UNDER_YEARS: 2,                 // p. 229: tools for termiting not observed in infants under two
      WATCH_FROM_MONTHS: 9,                    // p. 229: from about nine months youngsters watched their mothers intently
      BOUT_MINUTES: { three: 5, four: 15 },    // pp. 230–231: 3-year-olds' bouts under 5 min; 4-year-olds up to 15 min
      SELECT_YARDS: { max: 100, fig16: 60 },   // pp. 229–230: tools chosen up to 100 yards from a nest, out of sight; Fig. 16, 60
      SEASON_MONTHS: [3, 4],                   // p. 229: the termite season, three or four months a year
      SPONGE_INFANT_YEARS: 3.5,                // p. 233: the infant who chewed a grass stem into a "sponge" (Fig. 18)
    },
    // ---- the termite passage (all ours: the paper gives depths and failures, not the inside of a mound)
    PASSAGE: {
      rim: 0.25,                               // ours: where a too-thick stick stops (inches)
      leafCatch: 0.5,                          // ours: where unstripped leaves catch on the rim (inches)
      bend1: 1.5,                              // ours: a floppy stem folds here, so it goes in "one or two inches" (p. 230)
      bend2: 4.0,                              // ours: a springy stem folds here
      chamber: 3.0,                            // ours: termites wait below this depth
      end: 8.0,                                // ours: the passage ends at the adults' eight inches (p. 230)
    },
    GRIP: 1.5,                                 // ours: inches of stem between thumb and the side of the index finger (the
                                               //   precision grip of p. 228), which cannot go into the hole
    MIN_HOLD: 3.0,                             // ours: a stem bitten shorter than this cannot be held to fish
    // ---- the stems in the long grass (lengths ours; the kinds are the paper's: grass stems, twigs, bark fibre, p. 228)
    // thick: 0 thin as a straw, 1 thin as a pencil, 2 thick as a finger (too thick for the hole). stiff: 0 floppy, 1 springy, 2 stiff. grassy: crumples when
    // chewed. wearTo: dips past the first bend before the end is bent (ours; p. 229: "when the end of a tool gets bent")
    TYPES: {
      blade: { label: 'a grass blade', len: [11, 14], thick: 0, stiff: 0, leaves: false, grassy: true, wearTo: 3 },
      dry: { label: 'a dry grass stem', len: [9, 12], thick: 0, stiff: 1, leaves: false, grassy: true, wearTo: 3 },
      bark: { label: 'a strip of bark', len: [8, 11], thick: 0, stiff: 1, leaves: false, grassy: true, wearTo: 2 },
      stem: { label: 'a grass stem', len: [9, 12], thick: 0, stiff: 2, leaves: false, grassy: true, wearTo: 3 },
      twig: { label: 'a thin twig', len: [6, 7.5], thick: 0, stiff: 2, leaves: false, grassy: false, wearTo: 4 },
      leafy: { label: 'a leafy twig', len: [9, 11], thick: 0, stiff: 2, leaves: true, grassy: false, wearTo: 4 },
      short: { label: 'a short twig', len: [3, 4.5], thick: 1, stiff: 2, leaves: false, grassy: false, wearTo: 4 },
      stick: { label: 'a stick', len: [9, 12], thick: 2, stiff: 2, leaves: false, grassy: false, wearTo: 5 },
    },
    GRASS_FIXED: ['blade', 'blade', 'stick', 'short', 'leafy', 'dry', 'stem'], // ours: the long grass always holds the
                                               //   paper's mistakes and two ways to an adult's tool (a floor, not a ramp)
    GRASS_EXTRA: ['blade', 'bark', 'twig', 'dry', 'stem', 'leafy'], // ours: the eighth stem, drawn from these
    NEARBY: { blade: 3, dry: 2, bark: 2, short: 2, stick: 1, twig: 1, leafy: 1, stem: 1 }, // ours: weights for the three
                                               //   stems in reach beside the mound (poorer than the long grass)
    CARRY: 3,                                  // ours: stems you can carry; p. 228: "several tools are picked at a time"
    BITE: 1.0,                                 // ours: inches bitten off a bent end (p. 229)
    // ---- termites (all ours; tuned so an infant's mistakes reproduce the paper's two termites in twenty-two bouts)
    TERMITES: {
      perInch: 1.8,                            // ours: termites that bite on per inch of stem in the chamber, at most
      tau: 0.9,                                // ours: seconds for most of them to arrive (p. 228: "after a slight pause")
      gripLo: 5, gripHi: 16,                   // ours: a termite lets go when the stem is pulled faster than its grip
                                               //   (inches per second, uniform); a smooth pull keeps them, a jerk does not
    },
    SMOOTH: 0.05,                              // ours: seconds over which the pull speed is smoothed
    STILL: 1.0,                                // ours: slower than this (inches per second), the stem is "still"
    PAUSE_MIN: 0.6,                            // ours: seconds still in the chamber that count as a pause
    ENTER_MIN: 0.2,                            // ours: a touch shallower than this is not a dip
    // ---- Goodall's ages (pp. 229–231), and our mapping of a dip to one of them
    AGES: ['2-3', '3-4', '4', 'adult'],        // p. 230: 2–3, 3–4 and 4 years; adults
    ADULT_MIN_DEPTH: 5,                        // p. 230: adults, five to eight inches
    ADULT_TOOL: 8,                             // ours: a tool shorter than this is a four-year-old's "shorter" one (p. 231)
    SHALLOW: 2.5,                              // ours: by choice no deeper than this reads as "one or two inches" (p. 230)
    // ---- the afternoon (ours: the clock that stands for two years of termite seasons)
    SUNS: 12,                                  // ours: each dip, each look at your mother and each stem fetched nearby
                                               //   costs one; your mother dips once in each
    // ---- your mother (ours: an adult's dip within the paper's description)
    MOTHER: {
      depth: [6, 8],                           // ours, inside the paper's five to eight inches (p. 230)
      pause: [2, 3.2],                         // ours: "after a slight pause" (p. 228)
      push: 6,                                 // ours: inches per second going in
      pull: [2.5, 4.0],                        // ours: inches per second coming out, slower than any termite's grip
      stem: 'stem', len: 11,                   // ours: a stiff grass stem, stripped (p. 228). When its end bends she throws
                                               //   it down and takes another (p. 229: discarded "as though it is the tool that
                                               //   is at fault"); it lies there for you (p. 243: infants picked up and used
                                               //   tools that adults discarded)
    },
    // ---- the hollow (the sponge, pp. 232–233; all quantities ours)
    HOLLOW: {
      suns: 5,                                 // ours
      water: 2.5,                              // ours: inches down to the water
      bottom: 5,                               // ours
      handReach: 3,                            // ours: fingers reach the water (the infant first dipped his hand, p. 233)
      wadReach: 3.5,                           // ours: a leaf mass held between index and second finger (p. 233)
      wetMin: 0.25,                            // ours: inches below the surface to come up wet
      SIPS: { hand: 1, woody: 1, grass: [1, 2, 3, 4], leaves: 2, wad: 6 }, // ours: a plain end lifts a drop; a crumpled
                                               //   one more; leaves chewed "thus increasing their absorbancy" (p. 233) most
      chew: 2,                                 // ours: CHEW THE END crumples a grass end two steps
      autoCrumple: 1,                          // ours: each suck crumples it one step (p. 233: "each time he put it to his
                                               //   mouth, he chewed the end")
      crumpleMax: 3,
      enough: 12,                              // ours: sips to drink your fill
    },
    SEED_MAX: 9999,                            // ours: afternoons are numbered (the notebook page); the number replays it
  };

  // ---------- randomness: one seeded stream per game
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const uni = (r, lo, hi) => lo + (hi - lo) * r();
  function newSeed() { return 1 + Math.floor(Math.random() * CONFIG.SEED_MAX); }

  let nextId = 1;
  function makeStem(type, r, len) {
    const T = CONFIG.TYPES[type];
    const L = len != null ? len : Math.round(uni(r, T.len[0], T.len[1]) * 2) / 2;
    return { id: nextId++, type, label: T.label, len: L, thick: T.thick, stiff: T.stiff, leaves: T.leaves, grassy: T.grassy,
      wearTo: T.wearTo, wear: 0, bent: false, crumple: 0 };
  }
  const copy = s => (s && typeof s === 'object' ? JSON.parse(JSON.stringify(s)) : s);
  function pickWeighted(r, w) {
    const keys = Object.keys(w); let tot = 0; keys.forEach(k => (tot += w[k]));
    let x = r() * tot; for (const k of keys) { x -= w[k]; if (x < 0) return k; } return keys[keys.length - 1];
  }
  function shuffle(r, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- a new afternoon
  function newGame(seed) {
    seed = seed || newSeed();
    const r = rng(seed);
    const kinds = CONFIG.GRASS_FIXED.concat([CONFIG.GRASS_EXTRA[Math.floor(r() * CONFIG.GRASS_EXTRA.length)]]);
    const grass = shuffle(r, kinds).map(k => makeStem(k, r));
    return {
      seed, r, phase: 'grass', grass, taken: grass.map(() => false), inspect: -1,
      carried: [], held: -1, nearby: null,
      suns: CONFIG.SUNS, eaten: 0, dips: [], watched: 0, usedHers: false, fetched: 0,
      mother: { eaten: 0, dips: 0, stem: makeStem(CONFIG.MOTHER.stem, r, CONFIG.MOTHER.len), dropped: null, film: null, last: null },
      dip: null,
      hollow: { suns: CONFIG.HOLLOW.suns, sips: 0, dips: [], leaves: null, hand: false, used: {} },
      over: false,
    };
  }

  // ---------- what is in your hand
  function inHand(g) {
    if (g.phase === 'grass') return g.inspect >= 0 ? g.grass[g.inspect] : null;
    if (g.phase === 'hollow' || (g.phase === 'end' && g.hollow.dips.length)) { if (g.hollow.hand) return HAND; if (g.held === 'leaves') return g.hollow.leaves; }
    return g.held >= 0 ? g.carried[g.held] || null : null;
  }
  const HAND = { type: 'hand', label: 'your hand' };

  function describe(s) {
    if (!s) return '';
    if (s.type === 'hand') return 'Your hand. Your fingers fit into the hollow; your lips do not.';
    if (s.type === 'leaves') return s.chewed ? 'A wad of leaves, chewed and crumpled.' : 'A handful of leaves, fresh off the branch.';
    const len = `${Math.round(s.len)} inches`;
    const th = ['thin as a straw', 'thin as a pencil', 'thick as a finger'][s.thick];
    const st = ['floppy: it droops under its own weight', 'springy: it bends a little', 'stiff'][s.stiff];
    let d = `${cap(s.label)}, ${len}. ${cap(th)}, and ${st}.`;
    if (s.leaves) d += ' Leaves on it.';
    if (s.bent) d += ' The end is bent.';
    if (s.crumple >= 2) d += ' The end is chewed into a little crumpled mass.'; else if (s.crumple === 1) d += ' The end is a little chewed.';
    return d;
  }
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // previews: what a preparation would do, without doing it
  function preview(g, action) {
    const s = inHand(g); if (!s || s.type === 'hand') return { ok: false, why: '' };
    const t = copy(s);
    if (action === 'strip') { if (!t.leaves) return { ok: false, why: 'No leaves to strip.' }; t.leaves = false; return { ok: true, stem: t }; }
    if (action === 'bite') {
      if (t.type === 'leaves') return { ok: false, why: '' };
      if (t.len - CONFIG.BITE < CONFIG.MIN_HOLD) return { ok: false, why: 'Too short to bite any more off.' };
      t.len -= CONFIG.BITE; t.wear = 0; t.bent = false; t.crumple = 0; return { ok: true, stem: t };
    }
    if (action === 'chew') {
      if (t.type === 'leaves') { if (t.chewed) return { ok: false, why: 'Already chewed.' }; t.chewed = true; return { ok: true, stem: t }; }
      if (!t.grassy) return { ok: false, why: 'Too woody to crumple.' };
      if (t.crumple >= CONFIG.HOLLOW.crumpleMax) return { ok: false, why: 'Chewed as far as it will go.' };
      t.crumple = Math.min(CONFIG.HOLLOW.crumpleMax, t.crumple + CONFIG.HOLLOW.chew); return { ok: true, stem: t };
    }
    return { ok: false, why: '' };
  }
  function prepare(g, action) {
    const p = preview(g, action); if (!p.ok) return p;
    const s = inHand(g); Object.assign(s, p.stem); return { ok: true, stem: s };
  }

  // ---------- the long grass
  function look(g, i) { if (g.phase === 'grass' && !g.taken[i]) g.inspect = i; return inHand(g); }
  function take(g) {
    if (g.phase !== 'grass' || g.inspect < 0 || g.carried.length >= CONFIG.CARRY) return false;
    g.taken[g.inspect] = true; g.carried.push(g.grass[g.inspect]); g.inspect = -1; return true;
  }
  function putBack(g, slot) {
    if (g.phase !== 'grass' || !g.carried[slot]) return false;
    const s = g.carried.splice(slot, 1)[0]; const i = g.grass.indexOf(s); if (i >= 0) g.taken[i] = false; g.inspect = i; return true;
  }
  function walk(g) {
    if (g.phase !== 'grass' || !g.carried.length) return false;
    g.phase = 'mound'; g.inspect = -1; g.held = 0; return true;
  }

  // ---------- at the mound
  function hold(g, slot) {
    if (g.phase === 'hollow') { g.hollow.hand = false; if (slot === 'leaves') { if (g.hollow.leaves) g.held = 'leaves'; return; } }
    if (g.carried[slot]) g.held = slot;
  }
  function holdHand(g) { if (g.phase === 'hollow') g.hollow.hand = true; }
  function stow(g, s) { // a new stem into a free slot, or in place of the one in your hand
    if (g.carried.length < CONFIG.CARRY) { g.carried.push(s); g.held = g.carried.length - 1; return null; }
    const slot = g.held >= 0 ? g.held : 0; const old = g.carried[slot]; g.carried[slot] = s; g.held = slot; return old;
  }

  // one sun passes: your mother dips once
  function sunPasses(g) {
    g.suns--; motherDip(g);
    if (g.suns <= 0) g.phase = 'leaving';
  }
  function motherDip(g) {
    const M = CONFIG.MOTHER, m = g.mother, r = g.r;
    const D = uni(r, M.depth[0], M.depth[1]), P = uni(r, M.pause[0], M.pause[1]), S = uni(r, M.pull[0], M.pull[1]);
    const ds = newDip(m.stem, 'mound'); const film = []; const dt = 1 / 60; let t = 0, k = 0;
    const tIn = D / M.push, tOut = tIn + P + D / S;
    while (true) {
      t += dt;
      const target = t < tIn ? M.push * t : t < tIn + P ? D : Math.max(0, D - S * (t - tIn - P));
      const ev = stepDip(ds, target, dt, r);
      if (k++ % 2 === 0 || ev.done) film.push({ d: ds.d, on: ds.on.map(x => x.off), drops: ev.drops.length });
      if (ev.done || t > tOut + 2) break;
    }
    const res = finishDip(ds, m.stem);
    m.eaten += res.eaten; m.dips++; m.film = film; m.last = res;
    wearOut(m.stem, res);
    if (m.stem.bent) { m.dropped = m.stem; m.justDropped = true; m.stem = makeStem(M.stem, r, M.len); }
    else m.justDropped = false;
    return res;
  }
  function watch(g) {
    if (g.phase !== 'mound' || g.dip) return null;
    g.watched++; sunPasses(g);
    const m = g.mother;
    return { film: m.film, result: m.last, dropped: m.justDropped, stem: copy(m.last.stem), words: motherWords(m.last, m.justDropped) };
  }
  function pickUpHers(g) {
    if (g.phase !== 'mound' || !g.mother.dropped) return false;
    stow(g, g.mother.dropped); g.mother.dropped = null; g.usedHers = true; return true;
  }
  function fetchNearby(g) {
    if (g.phase !== 'mound' || g.dip || g.nearby) return null;
    const r = g.r; g.nearby = [0, 1, 2].map(() => makeStem(pickWeighted(r, CONFIG.NEARBY), r));
    g.fetched++; sunPasses(g); if (g.phase === 'leaving') g.phase = 'mound-last'; // you may still take one, but not dip
    return g.nearby;
  }
  function takeNearby(g, i) {
    if (!g.nearby || !g.nearby[i]) return false;
    stow(g, g.nearby[i]); g.nearby = null; if (g.phase === 'mound-last') g.phase = 'leaving'; return true;
  }
  function skipNearby(g) { g.nearby = null; if (g.phase === 'mound-last') g.phase = 'leaving'; }

  // ---------- a dip: the stem's limit, then a step function the interface drives with the finger's target depth
  function limit(s, place) {
    const P = CONFIG.PASSAGE, H = CONFIG.HOLLOW, G = CONFIG.GRIP;
    if (place === 'hollow') {
      if (s.type === 'hand') return { depth: H.handReach, reason: 'reach' };
      if (s.type === 'leaves') return { depth: H.wadReach, reason: 'reach' };
      const L = s.len - G; return L < H.bottom ? { depth: L, reason: 'length' } : { depth: H.bottom, reason: 'end' };
    }
    if (s.thick >= 2) return { depth: P.rim, reason: 'thick' };
    if (s.leaves) return { depth: P.leafCatch, reason: 'leaves' };
    const cands = [{ depth: P.end, reason: 'end' }, { depth: s.len - G, reason: 'length' }];
    if (s.bent) cands.push({ depth: P.bend1, reason: 'bent' });
    else if (s.stiff === 0) cands.push({ depth: P.bend1, reason: 'fold1' });
    else if (s.stiff === 1) cands.push({ depth: P.bend2, reason: 'fold2' });
    cands.sort((a, b) => a.depth - b.depth);
    return { depth: Math.max(0, cands[0].depth), reason: cands[0].reason };
  }
  function newDip(s, place) {
    const lim = limit(s, place);
    return { place, stem: copy(s), lim, d: 0, maxD: 0, excess: 0, vs: 0, peakPull: 0, pause: 0, t: 0, on: [], acc: 0,
      gathered: 0, dropped: 0, blocked: false, wet: false, done: false };
  }
  function stepDip(ds, target, dt, r) {
    const P = CONFIG.PASSAGE, T = CONFIG.TERMITES, ev = { blocked: false, bites: 0, drops: [], done: false };
    if (ds.done || !(dt > 0)) return ev;
    target = Math.max(0, target);
    const prev = ds.d, nd = Math.min(target, ds.lim.depth);
    ds.excess = Math.max(0, target - ds.lim.depth);
    if (ds.excess > 0.05 && !ds.blocked) { ds.blocked = true; ev.blocked = true; }
    const v = (nd - prev) / dt;                                   // inward speed, inches per second
    ds.d = nd; ds.maxD = Math.max(ds.maxD, nd); ds.t += dt;
    ds.vs += (v - ds.vs) * (1 - Math.exp(-dt / CONFIG.SMOOTH));
    const pull = Math.max(0, -ds.vs);
    if (ds.place === 'mound') {
      if (nd > P.chamber && Math.abs(ds.vs) < CONFIG.STILL) ds.pause += dt;
      // termites in the passage let go if the stem moves out faster than their grip
      if (ds.on.length && pull > 0) {
        ds.peakPull = Math.max(ds.peakPull, pull);
        const keep = [];
        for (const x of ds.on) { if (nd - x.off > 0 && pull > x.grip) { ds.dropped++; ev.drops.push(nd - x.off); } else keep.push(x); }
        ds.on = keep;
      }
      // termites bite on to the stem in the chamber, filling toward perInch per inch with time constant tau
      if (nd > P.chamber) {
        const want = T.perInch * (nd - P.chamber);
        ds.acc += Math.max(0, want - ds.on.length - ds.acc) * (1 - Math.exp(-dt / T.tau));
        while (ds.acc >= 1) {
          ds.acc -= 1; const depth = uni(r, P.chamber, nd);
          ds.on.push({ off: nd - depth, grip: uni(r, T.gripLo, T.gripHi) }); ds.gathered++; ev.bites++;
        }
      } else ds.acc = 0;
    } else if (ds.place === 'hollow') {
      if (nd > CONFIG.HOLLOW.water + CONFIG.HOLLOW.wetMin) ds.wet = true;
    }
    if (ds.maxD >= CONFIG.ENTER_MIN && nd <= 0) { ds.done = true; ev.done = true; }
    return ev;
  }
  function finishDip(ds, s) {
    const P = CONFIG.PASSAGE;
    const reason = ds.excess > 0.05 || ds.maxD >= ds.lim.depth - 0.05 ? ds.lim.reason : 'chose';
    const res = { place: ds.place, stem: copy(s), maxD: ds.maxD, reason, pause: ds.pause, peakPull: ds.peakPull,
      gathered: ds.gathered, dropped: ds.dropped, eaten: ds.on.length, wet: ds.wet };
    if (ds.place === 'mound') Object.assign(res, classify(res, s));
    res.passedBend1 = ds.maxD > P.bend1 + 0.25;
    return res;
  }
  function wearOut(s, res) {
    if (res.passedBend1) { s.wear++; if (s.wear >= s.wearTo) s.bent = true; }
  }

  // Goodall's ages (pp. 229–231), as we map a dip onto them (ours)
  function classify(res, s) {
    const P = CONFIG.PASSAGE, why = res.reason;
    if (why === 'thick' || why === 'leaves') return { age: '2-3', why };
    if (why === 'length' && res.maxD < P.chamber) return { age: '2-3', why: 'short' };
    if (why === 'fold1' || why === 'bent') return { age: '3-4', why };
    if (res.gathered >= 1 && res.dropped >= Math.max(1, res.gathered / 2)) return { age: '2-3', why: 'jerk' };
    if (res.maxD < CONFIG.SHALLOW) return { age: '3-4', why: 'shallowchoice' };
    if (res.maxD < CONFIG.ADULT_MIN_DEPTH) return { age: '4', why: 'shallow' };
    if (res.pause < CONFIG.PAUSE_MIN) return { age: '4', why: 'nopause' };
    if (s.len < CONFIG.ADULT_TOOL) return { age: '4', why: 'shorttool' };
    return { age: 'adult', why: 'adult' };
  }

  function startDip(g) {
    if (g.dip) return g.dip;
    const s = inHand(g);
    if (!s) return null;
    if (g.phase === 'mound') { g.dip = newDip(s, 'mound'); return g.dip; }
    if (g.phase === 'hollow' && !g.over) { g.dip = newDip(s, 'hollow'); return g.dip; }
    return null;
  }
  // the interface calls this every frame with the depth the finger asks for; all rules happen here
  function dipStep(g, target, dt) {
    const ds = g.dip; if (!ds) return null;
    const ev = stepDip(ds, target, dt, g.r);
    if (ev.done) {
      const s = inHand(g); const res = finishDip(ds, s); g.dip = null;
      if (ds.place === 'mound') {
        res.n = g.dips.length + 1; g.eaten += res.eaten; const wasBent = s.bent; wearOut(s, res); res.bentNow = s.bent && !wasBent;
        res.words = dipWords(res); g.dips.push(res); sunPasses(g);
        res.motherDropped = g.mother.justDropped;
      } else hollowSuck(g, s, res);
      ev.result = res;
    }
    return ev;
  }
  function cancelDip(g) { if (g.dip && g.dip.maxD < CONFIG.ENTER_MIN) g.dip = null; }

  // ---------- the hollow
  function goHollow(g) {
    if (g.phase !== 'leaving') return false;
    g.phase = 'hollow'; g.nearby = null; g.hollow.hand = !g.carried.length; return true;
  }
  function pickLeaves(g) {
    if (g.phase !== 'hollow' || g.dip) return false;
    if (!g.hollow.leaves) g.hollow.leaves = { type: 'leaves', label: 'leaves', chewed: false };
    g.hollow.hand = false; g.held = 'leaves'; return true;
  }
  function hollowSuck(g, s, res) {
    const H = CONFIG.HOLLOW, h = g.hollow; let sips = 0, how;
    if (!res.wet) { how = 'dry'; }
    else if (s.type === 'hand') { sips = H.SIPS.hand; how = 'hand'; }
    else if (s.type === 'leaves') { sips = s.chewed ? H.SIPS.wad : H.SIPS.leaves; how = s.chewed ? 'wad' : 'leaves'; }
    else if (s.grassy) { sips = H.SIPS.grass[s.crumple]; how = s.crumple ? 'sponge' : 'grass'; }
    else { sips = H.SIPS.woody; how = 'woody'; }
    let crumpled = false;
    if (res.wet && s.grassy && s.crumple < H.crumpleMax) { s.crumple = Math.min(H.crumpleMax, s.crumple + H.autoCrumple); crumpled = true; }
    h.sips += sips; h.suns--; h.used[how] = (h.used[how] || 0) + sips;
    Object.assign(res, { n: h.dips.length + 1, sips, how, crumpleAfter: s.crumple || 0, crumpled });
    res.words = hollowWords(res, s); h.dips.push(res);
    if (h.sips >= H.enough || h.suns <= 0) { g.over = true; g.phase = 'end'; }
  }

  // ---------- words
  function numw(n) { return ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n); }
  function inchWords(d, len) {
    const h = Math.round(d * 2) / 2, w = Math.floor(h), half = h - w > 0;
    if (!len && d < 0.4) return 'barely in';
    if (h === 0.5) return 'half an inch';
    if (h === 1) return 'an inch';
    if (h === 1.5) return 'an inch and a half';
    return `${w <= 12 ? numw(w) : w}${half ? ' and a half' : ''} inches`;
  }
  const RED = {
    thick: 'too thick — like the infants of 2 to 3',
    short: 'too short to reach — like the infants of 2 to 3',
    leaves: 'leaves left on — grown-ups strip them first',
    jerk: 'yanked out, termites shaken off — like the infants of 2 to 3',
    fold1: 'too floppy: in an inch or two — like the infants of 3 to 4',
    bent: 'the bent end folds — grown-ups bite it off',
    shallowchoice: 'in only an inch or two — like the infants of 3 to 4',
    shallow: 'smooth, but not deep — like the infants of 4',
    nopause: 'deep and smooth, but no pause — grown-ups wait a moment',
    shorttool: 'a grown-up’s way, with a shorter tool — like the infants of 4',
    adult: '5 to 8 inches, a pause, out smoothly — a grown-up’s way',
  };
  function dipWords(res) {
    const P = CONFIG.PASSAGE; const L = [];
    if (res.reason === 'thick') L.push('It stopped at the rim: too thick to go in.');
    else if (res.reason === 'leaves') L.push('The leaves caught on the rim.');
    else {
      const inch = `In ${inchWords(res.maxD)}`;
      L.push({ fold1: `${inch}: it folded at the first bend.`, bent: `${inch}: the bent end folded at the first bend.`,
        fold2: `${inch}: it folded at the second bend.`, length: `${inch}: as far as a stem this length reaches.`,
        end: `${inch}, to the bottom of the passage.`, chose: `${inch}.` }[res.reason]);
    }
    if (res.maxD > P.chamber) L.push(res.pause >= CONFIG.PAUSE_MIN ? 'A pause.' : 'No pause.');
    if (res.gathered > 0) L.push(res.dropped === 0 ? 'Out slowly.' : `Out fast: ${numw(res.dropped)} shaken off.`);
    L.push(res.eaten === 0 ? 'No termites.' : res.eaten === 1 ? 'One termite.' : `${cap(numw(res.eaten))} termites.`);
    if (res.bentNow) L.push('The end is bent now.');
    return { typed: L.join(' '), red: RED[res.why], age: res.age };
  }
  function motherWords(res, dropped) {
    const typed = `Your mother: a stiff grass stem, stripped, ${Math.round(res.stem.len)} inches long. In ${inchWords(res.maxD)}. A pause. Out slowly. ${cap(numw(res.eaten))} termites.` +
      (dropped ? ' She throws the stem down: its end is bent.' : '');
    return { typed, red: RED[res.why], age: res.age };
  }
  function hollowWords(res, s) {
    const H = CONFIG.HOLLOW; let typed, red = '';
    const sp = n => (n === 1 ? 'a sip' : `${numw(n)} sips`);
    if (res.how === 'dry') typed = 'It came out dry: not in far enough to reach the water.';
    else if (res.how === 'hand') { typed = `You dip your fingers and lick them: ${sp(res.sips)}.`; red = 'an infant tried his hand first, too'; }
    else if (res.how === 'leaves') { typed = `The leaves come up dripping, and most of it runs off: ${sp(res.sips)}.`; red = 'grown-ups chew the leaves first: they soak up more'; }
    else if (res.how === 'wad') { typed = `The chewed wad comes up full of water. You suck it: ${sp(res.sips)}.`; red = 'the grown-ups’ way here: leaves chewed a moment, pushed in, sucked'; }
    else if (res.how === 'woody') typed = `It comes up with a drop on the end: ${sp(res.sips)}.`;
    else {
      typed = `It comes up wet. You suck the end: ${sp(res.sips)}.`;
      if (res.crumpled) typed += res.crumpleAfter >= 2 ? ' The end is a little crumpled mass now.' : ' Sucking it chews the end a little.';
      red = res.how === 'sponge' && res.crumpleAfter >= 2 ? 'an infant of 3½ did this: chewed the end each time he sucked it, till it was a tiny sponge'
        : 'an infant of 3½ did this too: poked grass in, the way he fished for termites';
    }
    return { typed, red };
  }

  // ---------- the verdict (the last page)
  const AGE_WORDS = { '2-3': 'an infant’s of two to three', '3-4': 'an infant’s of three to four', '4': 'a four-year-old’s', adult: 'a grown-up’s' };
  const WHY_SHORT = {
    thick: 'a stick too thick to go in', short: 'a twig too short to reach', leaves: 'leaves left on',
    jerk: 'termites shaken off by a jerk', fold1: 'a floppy stem folding at the first bend', bent: 'a bent end',
    shallowchoice: 'in only an inch or two', shallow: 'smooth, but not deep', nopause: 'deep, but no pause',
    shorttool: 'a short tool', adult: 'a stiff stem, deep in, a pause, out slowly',
  };
  function verdict(g) {
    const D = g.dips, h = g.hollow, H = CONFIG.HOLLOW;
    const ord = a => CONFIG.AGES.indexOf(a);
    const first = D[0], last = D[D.length - 1];
    const best = D.reduce((b, x) => (ord(x.age) > ord(b) ? x.age : b), '2-3');
    const lines = [];
    const mother = Math.round(g.mother.eaten / 5) * 5;
    lines.push(D.length
      ? `You caught ${g.eaten === 0 ? 'no' : g.eaten} termite${g.eaten === 1 ? '' : 's'} this afternoon; your mother caught about ${mother}.`
      : `You never dipped a stem this afternoon; your mother caught about ${mother} termites.`);
    if (D.length) {
      lines.push(D.length === 1 ? `Your one dip looked like ${AGE_WORDS[first.age]} (${WHY_SHORT[first.why]}).`
        : last.age === first.age && last.why === first.why ? `Your first dip and your last both looked like ${AGE_WORDS[first.age]} (${WHY_SHORT[first.why]}).`
          : `Your first dip looked like ${AGE_WORDS[first.age]} (${WHY_SHORT[first.why]}); your last, like ${AGE_WORDS[last.age]} (${WHY_SHORT[last.why]}).`);
    }
    lines.push((g.watched ? `You watched your mother ${g.watched === 1 ? 'once' : g.watched === 2 ? 'twice' : numw(g.watched) + ' times'} and tried the rest yourself` : 'You never stopped to watch your mother: you learned it all by trying')
      + (g.usedHers ? ', and you fished with the stem she threw away.' : '.'));
    const u = h.used, enough = h.sips >= H.enough;
    let hol;
    if (!h.dips.length) hol = 'You never reached the hollow.';
    else if (enough && (u.wad || 0) >= (u.sponge || 0) + (u.grass || 0)) hol = 'At the hollow you chewed a handful of leaves into a sponge, pushed it in, and drank your fill.';
    else if (enough) hol = 'At the hollow you pushed a grass stem in the way you fish for termites; chewing and sucking the end crumpled it into a sponge, and you drank your fill.';
    else if (u.sponge || u.grass) hol = `At the hollow you fished for water with a grass stem and got ${numw(h.sips)} sips, not your fill.`;
    else hol = `At the hollow you got ${numw(h.sips)} sips, not your fill: fingers and twigs lift only a drop at a time.`;
    lines.push(hol);
    const fish = best === 'adult' && last && last.age === 'adult' ? 'By the end of the afternoon you fished like a grown-up chimpanzee, which took the infants Goodall watched about two years'
      : best === 'adult' ? 'You fished like a grown-up chimpanzee at least once, which took the infants Goodall watched about two years'
        : best === '4' ? 'By the end you fished like a four-year-old chimpanzee'
          : 'You never quite got the termites out; nor, at two and three, did the infants Goodall watched';
    const drink = !h.dips.length ? '.' : enough ? (u.wad ? '; then you drank with a sponge of leaves.' : '; then you made a sponge out of a termite stem.')
      : '; then the hollow beat you.';
    return {
      headline: fish + drink, did: lines, best, ages: D.map(x => ({ age: x.age, why: x.why, eaten: x.eaten })),
      eaten: g.eaten, mother, sips: h.sips, enough, watched: g.watched,
      paper: 'Jane Goodall watched young chimpanzees at Gombe take about two years over what you did in an afternoon. Under two, they only watch. From two to three they pick stems too short or too thick and yank them out: in twenty-two tries she saw two termites caught. At three, their stems are too long and floppy, and go in an inch or two. At four they fish almost like their mothers, with shorter tools. They learn by playing, by trying, and by watching. And one three-and-a-half-year-old, pushing a stem of dry grass into a bowl of water the way he fished for termites, chewed it into the first sponge she saw an infant make.',
      means: 'A tool on its own is nothing clever, Goodall says. An Egyptian vulture smashes ostrich eggs with stones, but it throws them with the same flick it uses to smash small eggs on the ground, and that is all it does. What she found remarkable is a movement learned slowly, then carried to a new problem, as yours went from the mound to the hollow. Apart from us, no animal she knew of does that for as many problems as the chimpanzee; and only we, so far, use a tool to make a tool.',
    };
  }

  return { CONFIG, rng, newSeed, newGame, makeStem, inHand, describe, preview, prepare, look, take, putBack, walk, hold, holdHand,
    watch, pickUpHers, fetchNearby, takeNearby, skipNearby, limit, newDip, stepDip, finishDip, classify, startDip, dipStep, cancelDip,
    goHollow, pickLeaves, verdict, inchWords, numw, RED, AGE_WORDS };
});
