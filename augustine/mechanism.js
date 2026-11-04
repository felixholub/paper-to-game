// Augustine's Clock — the mechanism (rebuild of 4 Nov 2026). The only copy: build.py inlines this file verbatim into the
// HTML and refuses to build if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY, built to illustrate the argument of Augustine, Confessions, Book XI, chs. XIV–XXIX (with Book X, chs.
// VIII–XI, on memory), in E. B. Pusey's translation (1838; CCEL edition, pp. 130–176). The book has no data and no model.
// It argues that a voice cannot be measured while it sounds and is gone once it stops; that the motions of the sun or a
// potter's wheel are measured by time and so are not time; that what we measure is the impression a thing leaves in the
// mind; and (ch. XXIX) that a mind stretched among many things is also torn among them. The game turns this into an
// evening of measurements made with nothing but the player's mind: four voices, each heard and then asked for again,
// later and under worse conditions (after another voice, through static, against a voice sounding in the ear, in a
// silence with a wheel turning in it, inside a tumult under a sun that stops, and at the end in silence, said in the
// head). Every length, the static, the wheel's paces, the sun's stop, the words and the readings are ours; the book gives none.
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
      SUN_STOOD_STILL: true,                   // ch. XXIII, p. 171: "the sun stood still, but time went on" (for a battle: Joshua 10)
      WHEEL_PACE: ['faster', 'slower'],        // ch. XXIII, p. 170: "if it turned sometimes slower, otherwhiles quicker"
      SILENCE_AS_VOICE: true,                  // ch. XXVII, p. 173: silence measured by "a voice, as if it sounded"
    },
    // ---- ours: the voices (the book names none; it has "a voice", "a long syllable", "a psalm")
    VOICES: [
      { id: 'low', name: 'the low one', midi: 50 },     // D3
      { id: 'middle', name: 'the middle one', midi: 57 }, // A3
      { id: 'high', name: 'the high one', midi: 64 },   // E4
      { id: 'top', name: 'the top one', midi: 71 },     // B4
    ],
    STRANGER: { id: 'stranger', name: 'a stranger', midi: 60 },   // C4: a voice never heard before the tumult
    LENGTH: { min: 2.0, max: 4.2, apart: 0.45, liveVsLow: 1.4 }, // seconds; voices at least 0.45 s apart; the live voice (top)
                                                                 //   at least 1.4 × or at most 1/1.4 of the low one, so a pull shows
    // ---- ours: the stations
    AGAINST: { delay: 0.35 },                  // the live voice begins this long after the press
    STATIC: { level: 0.5 },                    // the static's loudness relative to a voice (a sound that tells nothing)
    WHEEL: {
      turns: 3,                                // the heard voice lasts exactly three turns of the wheel (countable)
      segMin: 0.35, segMax: 0.8,               // in the silence the potter works the wheel unevenly: the pace holds for this many
      paces: [0.45, 0.6, 1.5, 2.2, 3],         //   turns (dealt), then changes to another of these multiples of its old pace
      segments: 7,                             //   (ch. XXIII: "sometimes slower, otherwhiles quicker"); seven changes, enough for any hold
      countOff: 1.3,                           // the schedule is redealt until three counted turns land at least this far (in
    },                                         //   proportion, either way) from the voice, so counting the wheel visibly fails
    SUN: { start: 0.08, climb: 0.62, stopAt: 0.55 }, // where the sun starts, how far it would climb over the tumult, and when it
                                                     //   stops: this fraction of the low one's length after the low one begins
    TUMULT: { stagger: 0.6, others: 2, extraMin: 1.6, extraMax: 3.0, lateCap: 1.5 }, // voices enter 0.6 s apart, the low one never
                                                     //   first; two of the three other voices join the low one and the stranger; they
                                                     //   outlast the low one by 1.6–3 s; a hold still going 1.5 s after the last voice is stopped
    HOLD_CAP: 4,                               // a hold ends by itself at four times its target
    READ: {                                    // how a measure is read for the verdict
      pulled: true,                            //   against: a hold nearer (in proportion) to the live voice's length than to its target
      counted: true,                           //   silence: a hold nearer to what counting three turns from the press would give than to the voice
      waitedTol: 0.2,                          //   tumult: a release within this of the last voice's end (or after it) is "waited for the sun"
    },
    SEED: { min: 1000, max: 9999 },            // the evening's number, shown on the last page and in About
  };

  // The eight stations, in the order played. Each names its source in the paper.
  const STATIONS = [
    { id: 'first', title: 'The low one', voice: 'low', hear: 'low', source: 'ch. XXVII' },
    { id: 'second', title: 'The middle one', voice: 'middle', hear: 'middle', source: 'ch. XXVII' },
    { id: 'back', title: 'One back', voice: 'low', source: 'X.viii' },
    { id: 'static', title: 'Through static', voice: 'middle', hear: 'high', source: 'XI.xxviii' },
    { id: 'against', title: 'Against a voice', voice: 'low', live: 'top', source: 'XI.xxviii' },
    { id: 'silence', title: 'The silence', voice: 'high', hear: 'high', source: 'XI.xxiii–xxiv, xxvii' },
    { id: 'tumult', title: 'The tumult', voice: 'low', hear: 'low', source: 'XI.xxiii, xxix' },
    { id: 'last', title: 'The last silence', voice: 'low', source: 'XI.xxvii; X.xi' },
  ];

  // Augustine's sentences, Pusey's English, with page numbers of the CCEL edition.
  const QUOTES = {
    know: { text: 'What then is time? If no one asks me, I know: if I wish to explain it to one that asketh, I know not.', cite: 'XI.xiv, p. 165' },
    voice: { text: 'Before it sounded, it was to come, and could not be measured, because as yet it was not, and now it cannot, because it is no longer.', cite: 'XI.xxvii, p. 173' },
    fixed: { text: 'It is not then themselves, which now are not, that I measure, but something in my memory, which there remains fixed.', cite: 'XI.xxvii, p. 173' },
    palaces: { text: 'The fields and spacious palaces of my memory.', cite: 'X.viii, p. 134' },
    recesses: { text: 'Glide back, as it were, into the deeper recesses.', cite: 'X.xi, p. 137' },
    triad: { text: 'A present of things past, memory; present of things present, sight; present of things future, expectation.', cite: 'XI.xx, p. 169' },
    expectation: { text: 'Before I begin, my expectation is extended over the whole; but when I have begun, how much soever of it I shall separate off into the past, is extended along my memory.', cite: 'XI.xxviii, p. 174' },
    wheel: { text: 'If the lights of heaven should cease, and a potter’s wheel run round, should there be no time by which we might measure those whirlings, and say … if it turned sometimes slower, otherwhiles quicker, that some rounds were longer, other shorter?', cite: 'XI.xxiii, p. 170' },
    rest: { text: 'Time then is not the motion of a body.', cite: 'XI.xxiv, p. 171' },
    silence: { text: 'When we measure silence, and say that this silence hath held as long time as did that voice, do we not stretch out our thought to the measure of a voice, as if it sounded?', cite: 'XI.xxvii, pp. 173–174' },
    planned: { text: 'Hath in silence already gone through a space of time.', cite: 'XI.xxvii, p. 174' },
    sun: { text: 'The sun stood still, but time went on. For in its own allotted space of time was that battle waged and ended.', cite: 'XI.xxiii, p. 171' },
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

  // ---- the evening: deal the voices, the kick, the tumult
  function newGame(seed, opts) {
    opts = opts || {};
    const R = rng(seed), L = CONFIG.LENGTH, W = CONFIG.WHEEL, TU = CONFIG.TUMULT;
    // four lengths, at least `apart` apart, with the top one clearly unlike the low one (so a pull toward it shows)
    let lens, tries = 0;
    for (;;) {
      tries++;
      const draw = [0, 1, 2, 3].map(() => round3(L.min + R() * (L.max - L.min))).sort((a, b) => a - b);
      let ok = true; for (let k = 1; k < 4; k++) if (draw[k] - draw[k - 1] < L.apart) ok = false;
      if (!ok) continue;
      lens = shuffle(draw, R);
      const ratio = lens[3] / lens[0];
      if (ratio >= L.liveVsLow || ratio <= 1 / L.liveVsLow) break;
    }
    const voices = {};
    CONFIG.VOICES.forEach((v, k) => { voices[v.id] = { id: v.id, name: v.name, midi: v.midi, T: lens[k] }; });
    voices.stranger = { id: 'stranger', name: CONFIG.STRANGER.name, midi: CONFIG.STRANGER.midi, T: round3(L.min + R() * (L.max - L.min)) };
    // the wheel in the silence: a schedule of paces from the press, redealt until counting three turns lands well off the voice
    let wheel;
    for (;;) {
      wheel = []; for (let k = 0; k < W.segments; k++) wheel.push({ turns: round3(W.segMin + R() * (W.segMax - W.segMin)), pace: W.paces[Math.floor(R() * W.paces.length)] });
      const cr = countSecs(wheel, voices.high.T / W.turns, W.turns) / voices.high.T;
      if (cr >= W.countOff || cr <= 1 / W.countOff) break;
    }
    // the tumult: the low one, two of the other three, and a stranger; a seeded order of entry, the low one never first; the others outlast it
    const others = shuffle(['middle', 'high', 'top'], R).slice(0, TU.others);
    let order; do { order = shuffle(['low'].concat(others, ['stranger']), R); } while (order[0] === 'low');
    const entries = order.map((id, k) => ({ id, at: round3(k * TU.stagger) }));
    const low = entries.find(e => e.id === 'low');
    const lowStart = low.at, lowEnd = round3(lowStart + voices.low.T);
    entries.forEach(e => { e.end = e.id === 'low' ? lowEnd : round3(lowEnd + TU.extraMin + R() * (TU.extraMax - TU.extraMin)); e.dur = round3(e.end - e.at); });
    const tumult = { entries, lowStart, lowEnd, end: Math.max.apply(null, entries.map(e => e.end)), sunStop: round3(lowStart + CONFIG.SUN.stopAt * voices.low.T), present: order.slice() };
    const stations = STATIONS.map(spec => {
      const r = Object.assign({}, spec);
      r.T = voices[spec.voice].T;
      if (spec.hear) r.hearMidi = voices[spec.hear].midi;
      if (spec.live) r.liveT = voices[spec.live].T;
      if (spec.id === 'silence') r.wheel = wheel;
      if (spec.id === 'tumult') r.plan = tumult;
      return r;
    });
    const P = rng(seed ^ 0x5bd1e995);
    const present = CONFIG.PAPER.PRESENT_CHAIN.map(s => ({ label: s.label, parts: s.parts, part: s.part, now: Math.floor(s.parts * (0.3 + 0.4 * P())) }));
    return { seed, first: !!opts.first, voices, stations, present, i: 0, results: [], done: false, tries };
  }
  function current(g) { return g.stations[g.i]; }
  const nameOf = (g, id) => g.voices[id].name;

  // ---- the world's clocks
  function wheelPeriod(r) { return r.T / CONFIG.WHEEL.turns; }
  // turns of the wheel since the press, s seconds in, under a schedule of paces (each segment holds for `turns` turns at `pace` × the base pace)
  function turnsSince(wheel, P, s) {
    let turns = 0, left = s;
    for (const seg of wheel) { const secs = seg.turns * P / seg.pace; if (left <= secs) return turns + left * seg.pace / P; turns += seg.turns; left -= secs; }
    const last = wheel[wheel.length - 1]; return turns + left * last.pace / P;
  }
  // seconds since the press at which n turns are complete under the schedule
  function countSecs(wheel, P, n) {
    let s = 0, turns = 0;
    for (const seg of wheel) { if (turns + seg.turns >= n) return s + (n - turns) * P / seg.pace; s += seg.turns * P / seg.pace; turns += seg.turns; }
    const last = wheel[wheel.length - 1]; return s + (n - turns) * P / last.pace;
  }
  // turns of the wheel at time t (seconds since the heard voice began); tPress: when the silence began (same clock), or null
  function wheelTurns(r, t, tPress) {
    const P = wheelPeriod(r);
    if (r.id !== 'silence' || tPress == null || t <= tPress) return t / P;
    return tPress / P + turnsSince(r.wheel, P, t - tPress);
  }
  // the wheel's pace, as a multiple of its steady pace, s seconds after the press
  function paceAt(r, s) { const P = wheelPeriod(r); let left = s; for (const seg of r.wheel) { const secs = seg.turns * P / seg.pace; if (left <= secs) return seg.pace; left -= secs; } return r.wheel[r.wheel.length - 1].pace; }
  // what a player who counts three turns of the wheel from the press would hold, as a ratio of the voice
  function countRatio(r) { return countSecs(r.wheel, wheelPeriod(r), CONFIG.WHEEL.turns) / r.T; }
  // the sun over the tumult: its place on the arc at time t (seconds since the tumult began)
  function sunAt(plan, t) { const S = CONFIG.SUN; const tt = Math.min(t, plan.sunStop); return S.start + S.climb * Math.max(0, Math.min(1, tt / plan.end)); }
  function holdCap(r) { return r.T * CONFIG.HOLD_CAP; }

  // ---- words for a ratio (nearest in proportion; no decimals ever reach the screen)
  const AMOUNTS = [                            // big: the word drawn large; pre: before a noun, as a comparison; n: before a noun, as a size
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
  ];
  function amount(x) {
    let best = AMOUNTS[0], d = Infinity;
    for (const a of AMOUNTS) { const e = Math.abs(Math.log(x / a.x)); if (e < d) { d = e; best = a; } }
    return best;
  }
  function verdictWord(x) {                    // a qualifier for a hold that fell short, matched to its fraction word
    const a = amount(x).x;                     //   (a hold that ran over already says "longer" in its own words)
    if (a >= 1) return '';
    if (a >= 0.9) return 'a little short';
    if (a >= 2 / 3) return 'short';
    return 'well short';
  }
  function closeness(e) {                      // e: a typical |log ratio|
    if (e <= 0.06) return 'within a twentieth or so';
    if (e <= 0.12) return 'within about a tenth';
    if (e <= 0.22) return 'within about a fifth';
    if (e <= 0.36) return 'within about a third';
    return 'only roughly, often off by half or more';
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const COUNT = ['none', 'one', 'two', 'three', 'four', 'five'];
  function amountSentence(x, noun) {
    const a = amount(x), q = verdictWord(x);
    return cap(a.pre + ' ' + noun) + (q ? ': ' + q + '.' : '.');
  }
  function turnsWords(n) {                     // a number of turns, to the nearest half, in words
    const h = Math.round(n * 2) / 2, W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    if (h > 12) return 'more than twelve turns';
    const whole = Math.floor(h), half = h - whole > 0;
    if (whole === 0) return half ? 'half a turn' : 'no turns';
    return (half ? W[whole] + ' and a half' : W[whole]) + (h === 1 ? ' turn' : ' turns');
  }
  function secondsWords(s) {                   // a span of seconds, to the nearest quarter, in words
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

  // ---- a plain hold (stations first, second, back, static): seconds held
  function hold(g, secs) {
    const r = current(g);
    if (!['first', 'second', 'back', 'static'].includes(r.id)) throw new Error('not a hold station: ' + r.id);
    const capped = secs >= holdCap(r) - 1e-9;
    const made = Math.min(secs, holdCap(r)), x = made / r.T, noun = nameOf(g, r.voice);
    const res = { id: r.id, title: r.title, voice: r.voice, target: r.T, made: round3(made), ratio: x, big: amount(x).big, lines: [amountSentence(x, noun)], capped };
    if (r.id === 'first') { res.lines.push('The voice had stopped before you began. It wasn’t there to hold up against yours; what you held was what it left in you.'); res.quote = QUOTES.voice; }
    if (r.id === 'second') { res.lines.push('A second voice, higher and its own length. It is in your memory now beside the first.'); res.quote = QUOTES.fixed; }
    if (r.id === 'back') { res.lines.push('Nothing sounded this time. You went back for the low one, from before the middle one, and held it.'); res.quote = QUOTES.palaces; }
    if (r.id === 'static') { res.lines.push('The static told you nothing about how long. It was there to fill your ears while you went back two voices for the middle one.'); res.quote = QUOTES.triad; }
    return finish(g, res);
  }

  // ---- against a voice (station against): seconds held, while the top one sounded in the ear from `delay` after the press
  function against(g, secs) {
    const r = current(g);
    if (r.id !== 'against') throw new Error('not the against station');
    const capped = secs >= holdCap(r) - 1e-9;
    const made = Math.min(secs, holdCap(r)), x = made / r.T, live = r.liveT / r.T;
    const pulled = Math.abs(Math.log(x / live)) < Math.abs(Math.log(x));
    const res = { id: r.id, title: r.title, voice: r.voice, target: r.T, made: round3(made), ratio: x, liveT: r.liveT, liveRatio: live, big: amount(x).big, capped,
      reading: pulled ? 'pulled' : 'held', lines: [amountSentence(x, nameOf(g, 'low'))], quote: QUOTES.triad };
    res.lines.push('While you held, the top one sounded in your ears, ' + amount(live).pre + ' the low one.');
    res.lines.push(pulled ? 'Your hold lay nearer the top one, the voice that was there, than the low one, the voice you were asked for.'
      : 'Your hold stayed nearer the low one, the voice in your memory, than the top one in your ears.');
    return finish(g, res);
  }

  // ---- the silence (station silence): seconds of silence held, with the wheel turning and kicked
  function silence(g, secs) {
    const r = current(g);
    if (r.id !== 'silence') throw new Error('not the silence station');
    const capped = secs >= holdCap(r) - 1e-9;
    const made = Math.min(secs, holdCap(r)), x = made / r.T;
    const turns = turnsSince(r.wheel, wheelPeriod(r), made);   // turns of the wheel during the silence
    const cr = countRatio(r), counted = Math.abs(Math.log(x / cr)) < Math.abs(Math.log(x));
    const res = { id: r.id, title: r.title, voice: r.voice, target: r.T, made: round3(made), ratio: x, turns, countRatio: cr, capped,
      big: amount(x).big, reading: counted ? 'counted' : 'saw', quote: QUOTES.silence,
      lines: ['Your silence was ' + amount(x).pre + ' the high one' + (verdictWord(x) ? ': ' + verdictWord(x) + '.' : '.')] };
    res.lines.push('The voice lasted ' + turnsWords(CONFIG.WHEEL.turns) + ' of the wheel. In your silence the potter worked it unevenly, now slower, now quicker: your silence lasted ' + turnsWords(turns) + ' of it, and ' + turnsWords(CONFIG.WHEEL.turns) + ' would have been ' + amount(cr).n + ' the voice.');
    res.lines.push(counted ? 'You let go just where counting ' + turnsWords(CONFIG.WHEEL.turns) + ' would put you.'
      : 'You did not let go at ' + turnsWords(CONFIG.WHEEL.turns) + '. The wheel was no measure, and you measured anyway: with something that isn\u2019t the wheel.');
    return finish(g, res);
  }

  // ---- the tumult (station tumult): the press starts the crowd; releaseAt is seconds after it, when the finger came off
  function tumult(g, releaseAt) {
    const r = current(g), plan = r.plan, RD = CONFIG.READ;
    if (r.id !== 'tumult') throw new Error('not the tumult station');
    const off = releaseAt - plan.lowEnd, waited = releaseAt >= plan.end - RD.waitedTol;
    const res = { id: r.id, title: r.title, voice: 'low', target: r.T, plan, releaseAt: round3(releaseAt), off: round3(off), lines: [], quote: QUOTES.sun };
    res.made = round3(Math.max(0, releaseAt - plan.lowStart)); res.ratio = res.made / r.T;
    res.reading = waited ? 'waited' : releaseAt < plan.lowStart ? 'early' : Math.abs(off) <= 0.35 ? 'caught' : 'off';
    res.big = waited ? 'to the end' : releaseAt < plan.lowStart ? 'before it began' : Math.abs(off) <= 0.15 ? 'on the moment' : secondsWords(off) + (off < 0 ? ' early' : ' late');
    res.lines.push(waited ? 'You held to the end of the crowd. The low one had stopped ' + secondsWords(plan.end - plan.lowEnd) + ' before the others did.'
      : releaseAt < plan.lowStart ? 'You let go before the low one had even come in: it was the ' + ['first', 'second', 'third', 'fourth'][plan.present.indexOf('low')] + ' voice to enter.'
        : Math.abs(off) <= 0.15 ? 'You let go on the moment the low one stopped, with the others still going.'
          : off < 0 ? 'You let go ' + secondsWords(off) + ' before the low one stopped.' : 'You let go ' + secondsWords(off) + ' after the low one stopped, while the others went on.');
    res.lines.push('The sun climbed, and stood still ' + (plan.sunStop < plan.lowEnd ? 'before the low one stopped' : 'as it stopped') + '. ' + (waited ? 'It never moved again, and the crowd took its own time.' : 'Time went on.'));
    return finish(g, res);
  }
  // which voices were in the tumult: picks is a list of ids from the five chips
  function heard(g, picks) {
    const r = current(g), res = g.results[g.i];
    if (r.id !== 'tumult' || !res) throw new Error('nothing heard yet');
    const all = ['low', 'middle', 'high', 'top', 'stranger'], inIt = r.plan.present;
    const right = all.filter(id => inIt.includes(id) === picks.includes(id)), wrong = all.filter(id => !right.includes(id));
    res.picks = picks.slice(); res.right = right; res.wrong = wrong;
    const missed = inIt.filter(id => !picks.includes(id)), extra = picks.filter(id => !inIt.includes(id));
    res.heardLines = [];
    res.heardLines.push(wrong.length === 0 ? 'You named every voice in the crowd, and nobody who wasn’t there.'
      : 'You got ' + COUNT[right.length] + ' of the five right.');
    if (missed.length) res.heardLines.push('In the crowd, unnamed: ' + missed.map(id => nameOf(g, id)).join(', ') + '.');
    if (extra.length) res.heardLines.push('Named, but not there: ' + extra.map(id => nameOf(g, id)).join(', ') + '.');
    res.heardQuote = QUOTES.recesses;
    return res;
  }

  // ---- the last silence (station last): seconds between the two taps
  function last(g, secs) {
    const r = current(g);
    if (r.id !== 'last') throw new Error('not the last station');
    const capped = secs >= holdCap(r) - 1e-9;
    const made = Math.min(secs, holdCap(r)), x = made / r.T;
    const res = { id: r.id, title: r.title, voice: 'low', target: r.T, made: round3(made), ratio: x, big: amount(x).big, capped, quote: QUOTES.planned,
      lines: [amountSentence(x, nameOf(g, 'low'))] };
    res.lines.push('Nothing sounded and nothing was held. The low one sounded only in you, minutes after you last heard it, through static and a crowd.');
    return finish(g, res);
  }

  function finish(g, res) { g.results[g.i] = res; return res; }
  function next(g) { if (!g.results[g.i]) throw new Error('station not finished'); g.i++; if (g.i >= g.stations.length) { g.done = true; g.i = g.stations.length; } return g; }

  // ---- the last page
  function verdict(g) {
    const R = g.results, by = id => R.find(r => r && r.id === id);
    const first = by('first'), back = by('back'), stat = by('static'), ag = by('against'), sil = by('silence'), tu = by('tumult'), la = by('last');
    const pulled = ag && ag.reading === 'pulled', counted = sil && sil.reading === 'counted', waited = tu && tu.reading === 'waited', missed = tu && tu.reading === 'early';
    const faults = [];
    if (pulled) faults.push('a voice in your ears pulled you off it');
    if (counted) faults.push('a wheel ran away with you');
    if (waited) faults.push('you waited for the sun');
    if (missed) faults.push('it was lost in the crowd');
    const headline = faults.length === 0 ? 'You kept the low one in you all evening, with no clock but your mind.'
      : faults.length === 1 ? 'You kept the low one in you, until ' + faults[0] + '.'
        : 'You kept the low one in you, mostly: ' + faults.slice(0, -1).join(', ') + ', and ' + faults[faults.length - 1] + '.';
    // the low one across the evening
    const low = g.voices.low.T;
    const drift = [];
    if (first) drift.push({ label: 'FRESH', made: first.made, ratio: first.ratio });
    if (back) drift.push({ label: 'ONE BACK', made: back.made, ratio: back.ratio });
    if (ag) drift.push({ label: 'AGAINST THE TOP ONE', made: ag.made, ratio: ag.ratio, live: ag.liveT });
    if (tu && tu.reading !== 'early') drift.push({ label: 'IN THE TUMULT', made: tu.made, ratio: tu.ratio, off: tu.off });
    if (la) drift.push({ label: 'AT THE END, IN SILENCE', made: la.made, ratio: la.ratio });
    const plain = [first, back, la].filter(Boolean).map(r => Math.abs(Math.log(r.ratio))).sort((a, b) => a - b);
    const med = plain.length ? plain[Math.floor((plain.length - 1) / 2)] : 0;
    const did = [];
    if (first && la) did.push('Fresh, you held the low one to ' + amount(first.ratio).n + ' its length. Minutes later, in silence, with nothing but what had stayed in you, you said it to ' + amount(la.ratio).n + ' its length.');
    if (back && stat) did.push('One back, you came ' + amount(back.ratio).n + ' the low one; through static, ' + amount(stat.ratio).n + ' the middle one.');
    if (ag) did.push(pulled ? 'With the top one in your ears, your hold went to it: ' + amount(ag.ratio).n + ' the low one, near the top one’s own length.'
      : 'With the top one in your ears, you kept to the low one: ' + amount(ag.ratio).n + ' its length.');
    if (sil) did.push(counted ? 'In the silence the wheel ran unevenly, and you let go at ' + amount(sil.ratio).n + ' the voice, just where counting its turns would put you.'
      : 'In the silence the wheel ran unevenly, and you did not count it: ' + amount(sil.ratio).n + ' the voice, measured with something that isn’t the wheel.');
    if (tu) did.push(missed ? 'In the tumult you let go before the low one had come in.'
      : waited ? 'In the tumult you held to the end, under a sun that had stopped. The low one had stopped first.'
        : 'In the tumult you let go ' + (Math.abs(tu.off) <= 0.15 ? 'on the moment the low one stopped' : secondsWords(tu.off) + (tu.off < 0 ? ' before the low one stopped' : ' after the low one stopped')) + ', under a sun that had stopped.');
    if (tu && tu.right) did.push(tu.wrong.length === 0 ? 'Afterwards you named every voice that had been in the crowd.' : 'Afterwards you named ' + COUNT[tu.right.length] + ' of the five voices rightly.');
    return {
      headline, did, seed: g.seed, drift, low, med: closeness(med),
      says: 'A wheel and the sun are motions, and we measure motions by time, so they are not time. A voice can’t be measured while it sounds, and it is gone once it stops. What you measured each time was what it had left in you. And what is in you can be pulled at: by a voice in your ears, by a wheel, by a crowd.',
      means: 'For Augustine, time is a stretching of the mind (his word is distentio), between what it expects and what it remembers. The same word is his for what an evening like this does: a mind stretched among many things is also torn among them.',
      meansQuote: QUOTES.mind,
      psalm: 'This evening too: before you began, all eight stations lay ahead of you, in expectation. Now they are all in memory. Augustine says it is the same with a psalm said by heart, with every syllable of it, and with each longer thing it is part of.',
      psalmQuote: QUOTES.psalm,
      present: 'A hundred years can’t all be present: only one year of it is now, the rest is past or still to come. Nor can that year: only one month. Nor the month, nor the day, nor the hour. Look closer and closer, and nothing is left but a point. The present has no length. That point was the black circle you pressed all evening.',
      presentQuote: QUOTES.present,
      torn: 'Augustine does not end here pleased with the clock he found. The same stretching of the mind that measures a voice is what scatters a life: in the next chapter he calls himself torn among times whose order he does not know, his thoughts mangled by tumultuous varieties, and asks to be gathered. The tumult you were in was his.',
      tornQuote: QUOTES.extended,
      before: 'And before there was anything at all? Augustine refuses the old joke that God was “preparing hell for pryers into mysteries”. There was no before: time began with the things that were made.',
      beforeQuote: QUOTES.then,
    };
  }

  return { CONFIG, STATIONS, QUOTES, rng, newSeed, newGame, current, nameOf, wheelPeriod, wheelTurns, turnsSince, countSecs, paceAt, countRatio, sunAt, holdCap,
    amount, verdictWord, closeness, amountSentence, turnsWords, secondsWords, hold, against, silence, tumult, heard, last, next, verdict, AMOUNTS };
});
