// Augustine's Clock — the mechanism (second rebuild, 6 Nov 2026). The only copy: build.py inlines this file verbatim into
// the HTML and refuses to build if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY, built to illustrate the argument of Augustine, Confessions, Book XI, chs. XIV–XXIX (with Book X, chs.
// VIII–XI, on memory), in E. B. Pusey's translation (1838; CCEL edition, pp. 130–176). The book has no data and no model.
// It asks where a length of time is held, and answers by elimination: not in the thing (a voice is gone once it stops),
// not in the motion of bodies (the sun, a potter's wheel: we measure their motion, and their standing still, by time),
// not in the future or the past as such (they are not), but in the mind, in passing, as a stretching between what it
// expects and what it remembers; and (ch. XXIX) a mind so stretched is also torn. The game is ten measurements, each one
// a step of that argument, made with nothing but the player's mind: a moment of joy no clock ever measured; a voice
// held after it is gone; last night and yesterday, which only a clock measured, rendered as a relation of two sounds; a
// voice let go at its half while it sounds; a silence planned and then recognised among sounds; the sun's standing
// still, measured by a sound; a hymn sung back and its longs measured by its shorts; a crowd; and the two inner spans
// recognised again at the end. Every length, pitch, pair and reading is ours; the book gives none.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.AUGUSTINE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the paper's numbers (typeset PDF; nothing read off a figure; the book has none)
    PAPER: {
      PRESENT_CHAIN: [                         // ch. XV, pp. 166–167: an hundred years cannot be present, nor a year (twelve months),
        { label: 'a hundred years', parts: 100, part: 'year' },   //   nor a month, nor a day ("four and twenty hours"), nor an hour
        { label: 'one year', parts: 12, part: 'month' },          //   ("flying particles"); "The present hath no space."
        { label: 'one month', parts: 30, part: 'day' },           // 30 days: ours (the paper names no count)
        { label: 'one day', parts: 24, part: 'hour' },
        { label: 'one hour', parts: 60, part: 'particle' },       // 60 particles: ours (the paper: "flying particles")
      ],
      HYMN_LINE: ['De', 'us', 'Cre', 'a', 'tor', 'om', 'ni', 'um'],   // ch. XXVII, p. 173: "Deus Creator omnium", eight syllables
      HYMN_LONG: [false, true, false, true, false, true, false, true], //   alternating short and long; the long "double" the short
      SUN_STOOD_STILL: true,                   // ch. XXIII, p. 171: "the sun stood still, but time went on"
      REST_MEASURED: true,                     // ch. XXIV, p. 171: a body's standing still is measured by time as its motion is
      SILENCE_AS_VOICE: true,                  // ch. XXVII, p. 173: silence measured by "a voice, as if it sounded"
    },
    // ---- ours
    VOICE: { low: 50, mid: 57, high: 64, top: 71, stranger: 60, night: 45, day: 69, hymn: 55 }, // MIDI pitches (D3, A3, E4, B4, C4, A2, A4, G3)
    LENGTH: { min: 2.2, max: 4.2 },            // seconds: the low one's length
    HYMN: { short: 0.42, long: 0.84, gap: 0.08, capEach: 3 }, // the sung line: a long is double a short; a sung syllable is capped
    HALF: { capOver: 1.6 },                    // the half station ends by itself at 1.6 × the voice
    JOY: { min: 0.3, cap: 12, off: 1.5, longAt: 5 },   // the held moment: at least 0.3 s, at most 12 s; the decoy is 1.5 × or 1/1.5 of it
    NIGHTDAY: { min: 0.3, cap: 8, off: 1.5, scales: [1.0, 1.7, 2.6], maxDay: 6.5 }, // two holds; three pairs offered at three scales
    PLANNED: { min: 0.3, cap: 6, off: 1.5, gap: 0.7 }, // the planned silence and the two sounds offered after it
    SUN: { crossMin: 5, crossMax: 9, arcMin: 0.5, arcMax: 1, stopAtMin: 0.3, stopAtMax: 0.7, stopMin: 1.6, stopMax: 4.0, capHold: 4 },
                                               // the sun crosses an arc of the sky in 5–9 s, the arc 50–100 % of the sky, and stands
                                               //   still at 30–70 % of the crossing for 1.6–4 s; the hold for the stillness is capped
    TUMULT: { stagger: 0.6, sizeMin: 3, sizeMax: 5, extraMin: 1.6, extraMax: 3.0, lateCap: 1.5 }, // 3–5 voices enter 0.6 s apart, the
                                               //   low one never first; the others outlast the low one by 1.6–3 s
    HOLD_CAP: 4,                               // a plain hold ends by itself at four times its target
    READ: { waitedTol: 0.2, tie: 0.05 },       // tumult: a release within 0.2 s of the crowd's end is "to the end"; hymn: longest within 5 % ties
    SEED: { min: 1000, max: 9999 },
  };

  // The ten stations, in the order played. Each names its source in the paper and, where it recalls an earlier station, which.
  const STATIONS = [
    { id: 'joy', title: 'A moment of joy', source: 'X.viii' },
    { id: 'first', title: 'The low one', hear: 'low', source: 'XI.xxvii' },
    { id: 'nightday', title: 'Night and day', source: 'XI.xx' },
    { id: 'half', title: 'Half of it', hear: 'low', source: 'XI.xxi, xxviii', recall: 'first' },
    { id: 'planned', title: 'A planned silence', source: 'XI.xxvii' },
    { id: 'sun', title: 'The sun stands still', source: 'XI.xxiii–xxiv' },
    { id: 'hymn', title: 'The hymn', source: 'XI.xxvii' },
    { id: 'tumult', title: 'The tumult', hear: 'low', source: 'XI.xxix', recall: 'first' },
    { id: 'nightday2', title: 'Night and day, again', source: 'X.xi', recall: 'nightday' },
    { id: 'joy2', title: 'The moment, again', source: 'XI.xxvii', recall: 'joy' },
  ];

  // Augustine's sentences, Pusey's English, with page numbers of the CCEL edition.
  const QUOTES = {
    know: { text: 'What then is time? If no one asks me, I know: if I wish to explain it to one that asketh, I know not.', cite: 'XI.xiv, p. 165' },
    voice: { text: 'Before it sounded, it was to come, and could not be measured, because as yet it was not, and now it cannot, because it is no longer.', cite: 'XI.xxvii, p. 173' },
    fixed: { text: 'It is not then themselves, which now are not, that I measure, but something in my memory, which there remains fixed.', cite: 'XI.xxvii, p. 173' },
    palaces: { text: 'The fields and spacious palaces of my memory.', cite: 'X.viii, p. 134' },
    recesses: { text: 'Glide back, as it were, into the deeper recesses.', cite: 'X.xi, p. 137' },
    triad: { text: 'A present of things past, memory; present of things present, sight; present of things future, expectation.', cite: 'XI.xx, p. 169' },
    passing: { text: 'We measure times as they pass.', cite: 'XI.xxi, p. 169' },
    expectation: { text: 'Before I begin, my expectation is extended over the whole; but when I have begun, how much soever of it I shall separate off into the past, is extended along my memory.', cite: 'XI.xxviii, p. 174' },
    wheel: { text: 'If it turned sometimes slower, otherwhiles quicker, that some rounds were longer, other shorter.', cite: 'XI.xxiii, p. 170' },
    rest: { text: 'Time then is not the motion of a body.', cite: 'XI.xxiv, p. 171' },
    silence: { text: 'When we measure silence, and say that this silence hath held as long time as did that voice, do we not stretch out our thought to the measure of a voice, as if it sounded?', cite: 'XI.xxvii, pp. 173–174' },
    planned: { text: 'Hath in silence already gone through a space of time.', cite: 'XI.xxvii, p. 174' },
    sun: { text: 'The sun stood still, but time went on. For in its own allotted space of time was that battle waged and ended.', cite: 'XI.xxiii, p. 171' },
    hymn: { text: 'Deus Creator omnium, this verse of eight syllables alternates between short and long syllables.', cite: 'XI.xxvii, p. 173' },
    mind: { text: 'It is in thee, my mind, that I measure times.', cite: 'XI.xxvii, p. 173' },
    present: { text: 'The present hath no space.', cite: 'XI.xv, p. 167' },
    psalm: { text: 'The same holds in the whole life of man, whereof all the actions of man are parts; the same holds through the whole age of the sons of men, whereof all the lives of men are parts.', cite: 'XI.xxviii, p. 174' },
    then: { text: 'There was no “then,” when there was no time.', cite: 'XI.xiii, p. 165' },
    distentio: { text: 'Time is nothing else than protraction; but of what, I know not; and I marvel, if it be not of the mind itself?', cite: 'XI.xxvi, p. 172' },
    extended: { text: 'Not distended but extended … not distractedly but intently.', cite: 'XI.xxix, p. 175' },
  };

  // ---- randomness: one seeded stream per evening (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function newSeed(r) { const S = CONFIG.SEED; return S.min + Math.floor((r === undefined ? Math.random() : r) * (S.max - S.min + 1)); }
  const round3 = x => Math.round(x * 1000) / 1000;
  function shuffle(a, R) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  const between = (R, a, b) => round3(a + R() * (b - a));

  // ---- the evening: the low one, the sun's crossing, the crowd, and every decoy, dealt before anything is played
  function newGame(seed) {
    const R = rng(seed), L = CONFIG.LENGTH, S = CONFIG.SUN, TU = CONFIG.TUMULT, ND = CONFIG.NIGHTDAY;
    const low = between(R, L.min, L.max);
    // the sun: a crossing, an arc, a stop
    const cross = between(R, S.crossMin, S.crossMax), arc = between(R, S.arcMin, S.arcMax), stopAt = between(R, S.stopAtMin, S.stopAtMax), stop = between(R, S.stopMin, S.stopMax);
    const sun = { cross, arc, stopFrac: stopAt, stopStart: round3(stopAt * cross), stop, stopEnd: round3(stopAt * cross + stop), end: round3(cross + stop) };
    // the crowd: the low one and two to four others, the low one never first; the others outlast it
    const size = TU.sizeMin + Math.floor(R() * (TU.sizeMax - TU.sizeMin + 1));
    const others = shuffle(['mid', 'high', 'top', 'stranger'], R).slice(0, size - 1);
    let order; do { order = shuffle(['low'].concat(others), R); } while (order[0] === 'low');
    const entries = order.map((id, k) => ({ id, at: round3(k * TU.stagger) }));
    const lowE = entries.find(e => e.id === 'low'), lowStart = lowE.at, lowEnd = round3(lowStart + low);
    entries.forEach(e => { e.end = e.id === 'low' ? lowEnd : round3(lowEnd + between(R, TU.extraMin, TU.extraMax)); e.dur = round3(e.end - e.at); });
    const tumult = { entries, size, lowStart, lowEnd, end: Math.max.apply(null, entries.map(e => e.end)) };
    // the decoys: which way each is off, and where the player's own lands among the offered
    const deal = {
      plannedOff: R() < 0.5 ? CONFIG.PLANNED.off : 1 / CONFIG.PLANNED.off, plannedOrder: R() < 0.5 ? 0 : 1,
      joyOff: R() < 0.5 ? CONFIG.JOY.off : 1 / CONFIG.JOY.off, joyOrder: R() < 0.5 ? 0 : 1,
      ndOrder: shuffle([0, 1, 2], R), ndScales: shuffle(ND.scales, R),
    };
    const stations = STATIONS.map(spec => {
      const r = Object.assign({}, spec);
      if (['first', 'half', 'tumult'].includes(spec.id)) r.T = low;
      if (spec.id === 'sun') r.sun = sun;
      if (spec.id === 'tumult') r.plan = tumult;
      return r;
    });
    const P = rng(seed ^ 0x5bd1e995);
    const present = CONFIG.PAPER.PRESENT_CHAIN.map(s => ({ label: s.label, parts: s.parts, part: s.part, now: Math.floor(s.parts * (0.3 + 0.4 * P())) }));
    return { seed, low, sun, tumult, deal, stations, present, i: 0, results: [], held: {}, done: false };
  }
  function current(g) { return g.stations[g.i]; }

  // ---- the world's clocks
  // the sun's place along its arc (0 = rising, 1 = set) at t seconds after it rose; it stands still from stopStart for stop
  function sunAt(sun, t) {
    const moved = t <= sun.stopStart ? t : t <= sun.stopEnd ? sun.stopStart : t - sun.stop;
    return Math.max(0, Math.min(1, moved / sun.cross));
  }
  function holdCap(r) { return r.T * CONFIG.HOLD_CAP; }

  // ---- words for a ratio (nearest in proportion; no decimals ever reach the screen)
  const AMOUNTS = [                            // big: drawn large; pre: as a comparison before a noun; n: as a size before a noun
    { x: 1 / 4, big: 'a quarter', pre: 'about a quarter of', n: 'about a quarter of' },
    { x: 1 / 3, big: 'a third', pre: 'about a third of', n: 'about a third of' },
    { x: 1 / 2, big: 'half', pre: 'about half', n: 'about half' },
    { x: 2 / 3, big: 'two thirds', pre: 'about two thirds of', n: 'about two thirds of' },
    { x: 3 / 4, big: 'three quarters', pre: 'about three quarters of', n: 'about three quarters of' },
    { x: 0.9, big: 'nine tenths', pre: 'about nine tenths of', n: 'about nine tenths of' },
    { x: 1, big: 'the same', pre: 'about the same as', n: 'about' },
    { x: 1.1, big: 'a tenth over', pre: 'about a tenth longer than', n: 'a little over' },
    { x: 1.25, big: 'a quarter over', pre: 'about a quarter longer than', n: 'about one and a quarter times' },
    { x: 1.5, big: 'half again', pre: 'about half as long again as', n: 'about one and a half times' },
    { x: 1.75, big: 'nearly double', pre: 'nearly double', n: 'nearly double' },
    { x: 2, big: 'double', pre: 'about double', n: 'about double' },
    { x: 2.5, big: 'two and a half times', pre: 'about two and a half times', n: 'about two and a half times' },
    { x: 3, big: 'three times', pre: 'about three times', n: 'about three times' },
    { x: 4, big: 'four times', pre: 'about four times', n: 'about four times' },
    { x: 5, big: 'five times', pre: 'about five times', n: 'about five times' },
    { x: 7, big: 'seven times', pre: 'about seven times', n: 'about seven times' },
    { x: 10, big: 'ten times', pre: 'about ten times', n: 'about ten times' },
  ];
  function amount(x) {
    let best = AMOUNTS[0], d = Infinity;
    for (const a of AMOUNTS) { const e = Math.abs(Math.log(x / a.x)); if (e < d) { d = e; best = a; } }
    return best;
  }
  function verdictWord(x) {
    const a = amount(x).x;
    if (a >= 1) return '';
    if (a >= 0.9) return 'a little short';
    if (a >= 2 / 3) return 'short';
    return 'well short';
  }
  function closeness(e) {
    if (e <= 0.06) return 'within a twentieth or so';
    if (e <= 0.12) return 'within about a tenth';
    if (e <= 0.22) return 'within about a fifth';
    if (e <= 0.36) return 'within about a third';
    return 'only roughly, often off by half or more';
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const COUNT = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth'];
  function amountSentence(x, noun) {
    const a = amount(x), q = verdictWord(x);
    return cap(a.pre + ' ' + noun) + (q ? ': ' + q + '.' : '.');
  }
  function secondsWords(s) {
    s = Math.abs(s);
    if (s < 0.13) return 'a tenth of a second';
    const q = Math.round(s * 4) / 4;
    if (q <= 0.25) return 'a quarter of a second';
    if (q === 0.5) return 'half a second';
    if (q === 0.75) return 'three quarters of a second';
    if (q === 1) return 'a second';
    if (q === 1.25) return 'a second and a quarter';
    if (q === 1.5) return 'a second and a half';
    if (q === 1.75) return 'nearly two seconds';
    if (q === 2) return 'two seconds';
    if (q <= 2.5) return 'two and a half seconds';
    if (q <= 3) return 'three seconds';
    return 'more than three seconds';
  }
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  // ---- 1 a moment of joy: seconds held, nothing sounding, nothing to check it against
  function joy(g, secs) {
    const r = current(g); if (r.id !== 'joy') throw new Error('not the joy station');
    const made = round3(clamp(secs, CONFIG.JOY.min, CONFIG.JOY.cap));
    g.held.joy = made;
    const res = { id: r.id, title: r.title, made, big: 'yours', quote: QUOTES.palaces, mem: [{ kind: 'said', label: 'THE MOMENT', secs: made }],
      lines: ['That is how long it lasted, as you have it. No clock was running on it then, and none is checking now.',
        'It is in your memory beside nothing else yet. The game will ask for it again, later, when there is more in there.'] };
    return finish(g, res);
  }

  // ---- 2 the low one: heard, then held
  function hold(g, secs) {
    const r = current(g); if (r.id !== 'first') throw new Error('not the first station');
    const capped = secs >= holdCap(r) - 1e-9, made = Math.min(secs, holdCap(r)), x = made / r.T;
    const res = { id: r.id, title: r.title, target: r.T, made: round3(made), ratio: x, big: amount(x).big, capped, quote: QUOTES.voice,
      mem: [{ kind: 'voice', label: 'THE LOW ONE', secs: r.T }, { kind: 'you', label: 'YOU', secs: round3(made) }],
      lines: [amountSentence(x, 'the low one'), 'The voice had stopped before you began. It wasn’t there to hold up against yours; what you held was what it left in you.'] };
    return finish(g, res);
  }

  // ---- 3 night and day: two holds, the night low, the day high; what is kept is their relation
  function nightDay(g, night, day) {
    const r = current(g); if (r.id !== 'nightday') throw new Error('not the night-and-day station');
    const ND = CONFIG.NIGHTDAY, n = round3(clamp(night, ND.min, ND.cap)), d = round3(clamp(day, ND.min, ND.cap)), ratio = d / n;
    g.held.night = n; g.held.day = d; g.held.ndRatio = ratio;
    const res = { id: r.id, title: r.title, night: n, day: d, ratio, big: amount(ratio).big, quote: QUOTES.triad,
      mem: [{ kind: 'night', label: 'THE NIGHT', secs: n }, { kind: 'day', label: 'THE DAY', secs: d }],
      lines: ['Your day was ' + amount(ratio).pre + ' your night, as you sounded them.',
        'The night is the one span of your life you did not attend to at all. Nothing of it is in you from inside; a clock outside you measured it. The day you lived through, and mostly did not attend to either. What you just sounded was the relation between a thing a clock kept and a thing you half kept.'] };
    return finish(g, res);
  }

  // ---- 4 half of it: the low one sounds from the press; the release is where you took its half to be
  function half(g, release) {
    const r = current(g); if (r.id !== 'half') throw new Error('not the half station');
    const made = round3(Math.min(release, r.T * CONFIG.HALF.capOver)), of = made / r.T, x = of / 0.5, over = made >= r.T;
    const res = { id: r.id, title: r.title, target: r.T, made, of, ratio: x, big: over ? 'past its end' : amount(of).big, quote: QUOTES.expectation,
      mem: [{ kind: 'voice', label: 'THE LOW ONE', secs: r.T, mark: r.T / 2 }, { kind: 'you', label: 'YOU: ITS HALF', secs: made }],
      lines: [over ? 'You were still holding when the low one ended.' : 'You let go at ' + amount(of).pre + ' the low one.',
        'Nothing could tell you where its half was while it sounded: the half was not there yet. You could only lay what had passed, lengthening in memory, against what you still expected of it, shortening. Your expectation of the whole came from the two times you had heard it.'] };
    return finish(g, res);
  }

  // ---- 5 a planned silence: a hold with nothing sounding; then two voices, one of them that long; which?
  function planned(g, secs) {
    const r = current(g); if (r.id !== 'planned') throw new Error('not the planned station');
    const P = CONFIG.PLANNED, made = round3(clamp(secs, P.min, P.cap));
    g.held.planned = made;
    const sounds = [made, round3(made * g.deal.plannedOff)];
    const order = g.deal.plannedOrder === 0 ? [0, 1] : [1, 0];          // order[k]: which of {yours, decoy} plays k-th
    const offered = order.map(j => ({ secs: sounds[j], yours: j === 0 }));
    const res = { id: r.id, title: r.title, made, offered, big: 'planned', quote: QUOTES.planned,
      mem: [{ kind: 'said', label: 'YOUR SILENCE', secs: made }],
      lines: ['You held a silence, and it had a length. Two voices will sound now, one after the other. One of them is as long as your silence was.'] };
    return finish(g, res);
  }
  function plannedPick(g, k) {
    const res = g.results[g.i]; if (!res || res.id !== 'planned') throw new Error('nothing planned');
    res.pick = k; res.right = res.offered[k].yours; res.yoursAt = res.offered.findIndex(o => o.yours);
    res.big = res.right ? 'yours' : 'not yours';
    res.mem = [{ kind: 'said', label: 'YOUR SILENCE', secs: res.made }].concat(res.offered.map((o, j) => ({ kind: o.yours ? 'voice' : 'ref', label: (ORD[j] + (o.yours ? ': YOURS' : '')).toUpperCase(), secs: o.secs })));
    res.lines = [res.right ? 'You knew your own silence again, the ' + ORD[k] + ' voice.' : 'You took the ' + ORD[k] + ' voice for yours. Yours was the ' + ORD[res.yoursAt] + ', ' + amount(res.offered[res.yoursAt].secs / res.offered[k].secs).pre + ' the one you chose.',
      'The span you held never sounded; it went by in silence, and yet it had gone through a space of time. Both voices came after it, so what you compared was two memories of sound against a memory of nothing.'];
    return res;
  }

  // ---- 6 the sun stands still: seconds held for the stillness, after the sun has set
  function sunHold(g, secs) {
    const r = current(g); if (r.id !== 'sun') throw new Error('not the sun station');
    const S = r.sun, capAt = S.stop * CONFIG.SUN.capHold, capped = secs >= capAt - 1e-9, made = round3(Math.min(secs, capAt)), x = made / S.stop;
    const res = { id: r.id, title: r.title, target: S.stop, made, ratio: x, big: amount(x).big, capped, quote: QUOTES.sun,
      mem: [{ kind: 'still', label: 'THE SUN STOOD STILL', secs: S.stop }, { kind: 'you', label: 'YOU', secs: made }],
      lines: [amountSentence(x, 'the sun’s standing still'),
        'The sun crossed ' + (S.arc > 0.85 ? 'the whole sky' : S.arc > 0.65 ? 'most of the sky' : 'half the sky') + ' tonight, ' + (S.cross < 6.3 ? 'quickly' : S.cross > 7.7 ? 'slowly' : 'at a middling pace') + '; on another evening it crosses another width at another pace, so how far it went says nothing about how long. And while it stood still it was no clock at all. You measured its standing still with a sound you made. So the sun was measured by time; it is not time.'] };
    return finish(g, res);
  }

  // ---- 7 the hymn: eight syllables sung back; the longs measured by the shorts; then, which was the longest?
  function hymnSing(g, holds) {
    const r = current(g); if (r.id !== 'hymn') throw new Error('not the hymn station');
    const H = CONFIG.HYMN, L = CONFIG.PAPER.HYMN_LONG, names = CONFIG.PAPER.HYMN_LINE;
    const h = holds.map(x => round3(clamp(x, 0.08, H.capEach)));
    const shorts = h.filter((x, k) => !L[k]), longs = h.filter((x, k) => L[k]);
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length, ratio = mean(longs) / mean(shorts);
    const max = Math.max.apply(null, h), longest = h.map((x, k) => k).filter(k => x_ok(h[k], max));
    function x_ok(v, m) { return v >= m * (1 - CONFIG.READ.tie); }
    const res = { id: r.id, title: r.title, holds: h, ratio, longest, big: amount(ratio).big, quote: QUOTES.hymn,
      mem: [{ kind: 'hymnvoice', label: 'THE LINE, AS SUNG TO YOU', syl: names.map((n, k) => ({ n, secs: L[k] ? H.long : H.short, long: L[k] })) },
        { kind: 'hymnyou', label: 'THE LINE, AS YOU SANG IT', syl: names.map((n, k) => ({ n, secs: h[k], long: L[k] })) }],
      lines: ['Your longs were ' + amount(ratio).pre + ' your shorts. In the line as sung to you they were double.',
        'One more thing: which of your eight syllables was the longest? Touch it.'] };
    return finish(g, res);
  }
  function hymnLongest(g, k) {
    const res = g.results[g.i]; if (!res || res.id !== 'hymn') throw new Error('nothing sung');
    const names = CONFIG.PAPER.HYMN_LINE;
    res.pick = k; res.right = res.longest.includes(k);
    res.lines = ['Your longs were ' + amount(res.ratio).pre + ' your shorts. In the line as sung to you they were double.',
      res.right ? 'Your longest was indeed ' + names[k].toUpperCase() + '.' : 'You took ' + names[k].toUpperCase() + ' for your longest. It was ' + names[res.longest[0]].toUpperCase() + ', ' + amount(res.holds[res.longest[0]] / res.holds[k]).pre + ' ' + names[k].toUpperCase() + '.',
      'You measured each long by the short before it, but the short had ceased before the long began. Every comparison was between two things in memory, and the one who sang them can be wrong about them.'];
    return res;
  }

  // ---- 8 the tumult: the press starts the crowd; releaseAt is seconds after it, when the finger came off; then, how many voices?
  function tumult(g, releaseAt) {
    const r = current(g), plan = r.plan, RD = CONFIG.READ; if (r.id !== 'tumult') throw new Error('not the tumult station');
    const off = releaseAt - plan.lowEnd, waited = releaseAt >= plan.end - RD.waitedTol, early = releaseAt < plan.lowStart;
    const res = { id: r.id, title: r.title, target: r.T, plan, releaseAt: round3(releaseAt), off: round3(off), quote: QUOTES.extended,
      made: round3(Math.max(0, releaseAt - plan.lowStart)), reading: waited ? 'waited' : early ? 'early' : Math.abs(off) <= 0.35 ? 'caught' : 'off',
      mem: [{ kind: 'crowd', label: 'THE CROWD, AS IT WAS', rows: plan.entries.map(e => ({ id: e.id, at: e.at, dur: e.dur })) }, { kind: 'you', label: 'YOU', secs: Math.max(0.05, round3(releaseAt)), at: 0 }] };
    res.ratio = res.made / r.T;
    res.big = waited ? 'to the end' : early ? 'before it began' : Math.abs(off) <= 0.15 ? 'on the moment' : secondsWords(off) + (off < 0 ? ' early' : ' late');
    res.lines = [waited ? 'You held to the end of the crowd. The low one had stopped ' + secondsWords(plan.end - plan.lowEnd) + ' before the others did.'
      : early ? 'You let go before the low one had even come in: it was the ' + ORD[plan.entries.findIndex(e => e.id === 'low')] + ' voice to enter.'
        : Math.abs(off) <= 0.15 ? 'You let go on the moment the low one stopped, with the others still going.'
          : off < 0 ? 'You let go ' + secondsWords(off) + ' before the low one stopped.' : 'You let go ' + secondsWords(off) + ' after the low one stopped, while the others went on.',
      'One more thing: how many voices were in the crowd, the low one included? Touch the number.'];
    return finish(g, res);
  }
  function tumultCount(g, n) {
    const res = g.results[g.i]; if (!res || res.id !== 'tumult') throw new Error('no crowd yet');
    res.count = n; res.right = n === res.plan.size;
    res.lines = [res.lines[0], res.right ? 'There were ' + COUNT[res.plan.size] + ', and you said ' + COUNT[n] + '.' : 'You said ' + COUNT[n] + '. There were ' + COUNT[res.plan.size] + '.',
      'A mind stretched among several things at once is holding each of them less. That is the same stretching that measured a voice at the start, and here it is torn.'];
    return res;
  }

  // ---- 9 night and day, again: three pairs, each at its own scale; one has the relation you sounded
  function nightDayPairs(g) {
    const r = current(g); if (r.id !== 'nightday2') throw new Error('not the second night-and-day station');
    const ND = CONFIG.NIGHTDAY, ratio = g.held.ndRatio, ratios = [ratio, ratio * ND.off, ratio / ND.off];
    const pairs = g.deal.ndOrder.map((j, k) => { let s = g.deal.ndScales[k]; const rr = ratios[j]; s = Math.min(s, ND.maxDay / Math.max(rr, 1)); return { night: round3(s), day: round3(s * rr), ratio: rr, yours: j === 0 }; });
    const res = { id: r.id, title: r.title, pairs, yoursAt: pairs.findIndex(p => p.yours), big: 'three pairs', quote: QUOTES.recesses,
      mem: [{ kind: 'night', label: 'YOUR NIGHT, FROM BEFORE', secs: g.held.night }, { kind: 'day', label: 'YOUR DAY, FROM BEFORE', secs: g.held.day }],
      lines: ['Three pairs will sound, a low voice and a high one each time, at three different sizes. One pair stands in the relation you gave your night and your day. Which?'] };
    return finish(g, res);
  }
  function nightDayPick(g, k) {
    const res = g.results[g.i]; if (!res || res.id !== 'nightday2') throw new Error('no pairs yet');
    res.pick = k; res.right = res.pairs[k].yours;
    res.big = res.right ? 'yours' : 'not yours';
    res.mem = res.mem.slice(0, 2).concat(res.pairs.map((p, j) => ({ kind: 'pair', label: (ORD[j] + (p.yours ? ': YOURS' : '')).toUpperCase(), night: p.night, day: p.day, yours: p.yours })));
    const you = g.held.ndRatio, chosen = res.pairs[k].ratio;
    res.lines = [res.right ? 'You knew your own relation again, the ' + ORD[k] + ' pair.' : 'You took the ' + ORD[k] + ' pair for yours, with the day ' + amount(chosen).pre + ' the night. Yours was the ' + ORD[res.yoursAt] + ': the day ' + amount(you).pre + ' the night.',
      'The pairs were of different sizes, so the lengths of the sounds were no help. What you had to hear was the relation alone, which is what you gave in the first place: not how long the night and the day were, but how the one stood to the other.'];
    return res;
  }

  // ---- 10 the moment, again: two voices, one as long as you held it at the start; which?
  function joyPairs(g) {
    const r = current(g); if (r.id !== 'joy2') throw new Error('not the second joy station');
    const J = CONFIG.JOY, made = g.held.joy;
    const off = made > J.longAt ? 1 / J.off : g.deal.joyOff;
    const sounds = [made, round3(made * off)], order = g.deal.joyOrder === 0 ? [0, 1] : [1, 0];
    const offered = order.map(j => ({ secs: sounds[j], yours: j === 0 }));
    const res = { id: r.id, title: r.title, made, offered, yoursAt: offered.findIndex(o => o.yours), big: 'two voices', quote: QUOTES.mind,
      mem: [{ kind: 'said', label: 'THE MOMENT, FROM THE START', secs: made }],
      lines: ['The moment of joy you held at the start. Two voices will sound. One of them is as long as you held it. Which?'] };
    return finish(g, res);
  }
  function joyPick(g, k) {
    const res = g.results[g.i]; if (!res || res.id !== 'joy2') throw new Error('no voices yet');
    res.pick = k; res.right = res.offered[k].yours;
    res.big = res.right ? 'yours' : 'not yours';
    res.mem = res.mem.slice(0, 1).concat(res.offered.map((o, j) => ({ kind: o.yours ? 'voice' : 'ref', label: (ORD[j] + (o.yours ? ': YOURS' : '')).toUpperCase(), secs: o.secs })));
    res.lines = [res.right ? 'You knew it again, the ' + ORD[k] + ' voice.' : 'You took the ' + ORD[k] + ' voice for it. Yours was the ' + ORD[res.yoursAt] + ', ' + amount(res.offered[res.yoursAt].secs / res.offered[k].secs).pre + ' the one you chose.',
      'Everything else tonight was checked against the world: a voice, the sun, a crowd. This was checked against you. The moment itself was never measured by anything; what you held at the start was the shape it has in you, and what you heard just now was that shape, sounded, with a stranger beside it.'];
    return res;
  }

  function finish(g, res) { g.results[g.i] = res; return res; }
  function next(g) { if (!g.results[g.i]) throw new Error('station not finished'); g.i++; if (g.i >= g.stations.length) { g.done = true; g.i = g.stations.length; } return g; }

  // ---- the last page
  function verdict(g) {
    const R = g.results, by = id => R.find(r => r && r.id === id);
    const joy1 = by('joy'), first = by('first'), nd = by('nightday'), hf = by('half'), pl = by('planned'), su = by('sun'), hy = by('hymn'), tu = by('tumult'), nd2 = by('nightday2'), j2 = by('joy2');
    const inner = [['the silence you planned', pl && pl.right], ['your night and your day', nd2 && nd2.right], ['your moment of joy', j2 && j2.right]];
    const known = inner.filter(x => x[1]), missed = inner.filter(x => !x[1]);
    const headline = known.length === 3 ? 'Three spans tonight were only ever in you, and you knew all three again: the silence you planned, your night and your day, your moment of joy.'
      : known.length === 0 ? 'Three spans tonight were only ever in you, and you knew none of them again: not the silence you planned, not your night and your day, not your moment of joy.'
        : 'Three spans tonight were only ever in you. You knew ' + known.map(x => x[0]).join(' and ') + ' again; ' + missed.map(x => x[0]).join(' and ') + ' you did not.';
    const did = [];
    if (joy1 && j2) did.push('You held a moment of joy at the start, as long as it has stayed in you. At the end, with a crowd and a hymn and the sun between, ' + (j2.right ? 'you picked it out again beside a voice ' + amount(j2.offered[1 - j2.yoursAt].secs / j2.made).pre + ' it.' : 'you took a voice ' + amount(j2.offered[j2.pick].secs / j2.made).pre + ' it for it.'));
    if (first) did.push('The low one, heard and held: ' + amount(first.ratio).n + ' its length.');
    if (nd && nd2) did.push('Your day you sounded as ' + amount(nd.ratio).n + ' your night; later, among three pairs at three sizes, ' + (nd2.right ? 'you heard that relation again.' : 'you took a pair with the day ' + amount(nd2.pairs[nd2.pick].ratio).n + ' the night for it.'));
    if (hf) did.push(hf.made >= hf.target ? 'Asked for its half while it sounded, you held the low one past its end.' : 'Asked for its half while it sounded, you let go of the low one at ' + amount(hf.of).n + ' its length.');
    if (pl) did.push('You planned a silence and then ' + (pl.right ? 'knew it again among two voices.' : 'took a voice ' + amount(pl.offered[pl.pick].secs / pl.made).pre + ' it for it.'));
    if (su) did.push('The sun stood still, and you measured its standing still with a sound ' + amount(su.ratio).pre + ' it.');
    if (hy) did.push('You sang the hymn back with your longs ' + amount(hy.ratio).n + ' your shorts, and ' + (hy.right ? 'knew which of your syllables was longest.' : 'took the wrong syllable for your longest.'));
    if (tu) did.push(tu.reading === 'waited' ? 'In the crowd you held to the end; the low one had stopped first.' : tu.reading === 'early' ? 'In the crowd you let go before the low one had come in.' : 'In the crowd you let go ' + (Math.abs(tu.off) <= 0.15 ? 'on the moment the low one stopped' : secondsWords(tu.off) + (tu.off < 0 ? ' before the low one stopped' : ' after the low one stopped')) + (tu.right ? ', and counted the voices rightly.' : ', and miscounted the voices.'));
    const world = [];
    if (first) world.push({ label: 'THE LOW ONE', target: first.target, made: first.made });
    if (hf) world.push({ label: 'ITS HALF, WHILE IT SOUNDED', target: hf.target / 2, made: hf.made, whole: hf.target });
    if (su) world.push({ label: 'THE SUN’S STANDING STILL', target: su.target, made: su.made });
    if (hy) world.push({ label: 'THE HYMN: A LONG, A SHORT', target: CONFIG.HYMN.long, made: hy.holds.filter((x, k) => CONFIG.PAPER.HYMN_LONG[k]).reduce((a, b) => a + b, 0) / 4, second: CONFIG.HYMN.short, madeSecond: hy.holds.filter((x, k) => !CONFIG.PAPER.HYMN_LONG[k]).reduce((a, b) => a + b, 0) / 4 });
    const errs = [first, su].filter(Boolean).map(r => Math.abs(Math.log(r.ratio))).concat(hf ? [Math.abs(Math.log(hf.ratio))] : []).sort((a, b) => a - b);
    const med = errs.length ? errs[Math.floor((errs.length - 1) / 2)] : 0;
    return {
      headline, did, seed: g.seed, world, med: closeness(med),
      inner: { joy: joy1 && j2 ? { made: joy1.made, offered: j2.offered, pick: j2.pick } : null, nd: nd && nd2 ? { night: nd.night, day: nd.day, pairs: nd2.pairs, pick: nd2.pick } : null, planned: pl ? { made: pl.made, offered: pl.offered, pick: pl.pick } : null },
      says: 'Where is a length of time held? Not in the thing: the low one was gone before you measured it. Not in the sun: you measured its standing still with a sound. Not in the future or the past as such: the half of a voice is not there until it has passed, and last night is nowhere in you at all. It is held in the mind, in passing, stretched between what it expects and what it remembers. Three things tonight were held nowhere else, and the game could only ask you whether you still knew them.',
      means: 'For Augustine, time is a stretching of the mind (his word is distentio), between what it expects and what it remembers. A life is the same shape as a psalm said by heart, or an evening like this: expected whole, then passing through attention into memory. And the stretching that lets a mind measure anything is the stretching that scatters it.',
      meansQuote: QUOTES.mind,
      psalm: 'This evening too: before you began, all ten stations lay ahead of you, in expectation. Now they are all in memory. Augustine says it is the same with a psalm said by heart, with every syllable of it, and with each longer thing it is part of.',
      psalmQuote: QUOTES.psalm,
      present: 'A hundred years can’t all be present: only one year of it is now, the rest is past or still to come. Nor can that year: only one month. Nor the month, nor the day, nor the hour. Look closer and closer, and nothing is left but a point. The present has no length. That point was the black circle you pressed all evening.',
      presentQuote: QUOTES.present,
      stranger: 'Had the game asked you for the half of a voice you had never heard, every release would have been as right as any other. You can expect only what you remember. That is why the night, which you never attended to, is in you only as a number a clock gave you, and the moment of joy, which nothing measured, is in you as a length.',
      torn: 'Augustine does not end here pleased with the clock he found. The same stretching of the mind that measures a voice is what scatters a life: in the next chapter he calls himself torn among times whose order he does not know, his thoughts mangled by tumultuous varieties, and asks to be gathered. The crowd you were in was his.',
      tornQuote: QUOTES.extended,
      before: 'And before there was anything at all? Augustine refuses the old joke that God was “preparing hell for pryers into mysteries”. There was no before: time began with the things that were made.',
      beforeQuote: QUOTES.then,
    };
  }

  return { CONFIG, STATIONS, QUOTES, rng, newSeed, newGame, current, sunAt, holdCap, amount, verdictWord, closeness, amountSentence, secondsWords, AMOUNTS, ORD, COUNT,
    joy, hold, nightDay, half, planned, plannedPick, sunHold, hymnSing, hymnLongest, tumult, tumultCount, nightDayPairs, nightDayPick, joyPairs, joyPick, next, verdict };
});
