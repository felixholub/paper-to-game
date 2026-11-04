// Augustine's Clock — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build
// if the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY, built to illustrate the argument of Augustine, Confessions, Book XI, chs. XIV–XXVIII (with Book X, chs.
// VIII–XI, on memory), in E. B. Pusey's translation (1838; CCEL edition, pp. 130–176). The book has no data and no model;
// it argues that we cannot measure the present (it has no length), the past (it is no more) or the future (it is not yet),
// nor a voice while it sounds; that the motions of the sun or a potter's wheel are measured by time and so are not time;
// and that what we measure is the impression a thing leaves in the mind. The game turns this into seven measurements made
// with nothing but the player's mind: a voice to be matched by a hold, with the paper's own candidate clocks (a wheel, the
// sun, a hymn's syllables) set out in the world. The lengths, speeds, kick, scoring words and readings are ours; the
// ratios the paper gives (a long syllable double a short; eight syllables, odd short and even long) are kept exactly.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.AUGUSTINE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the paper's numbers (typeset PDF; nothing read off a figure; the book has none)
    PAPER: {
      LONG_OVER_SHORT: 2,                      // ch. XXVII, p. 173: "Every one of these to every one of those, hath a double time"
      HYMN_LINE: ['De', 'us', 'cre', 'a', 'tor', 'om', 'ni', 'um'],   // ch. XXVII, p. 173: "'Deus Creator omnium,' this verse of eight syllables"
      HYMN_LONG: [false, true, false, true, false, true, false, true], // ch. XXVII: the four short "the first, third, fifth, and seventh",
                                               //   the four long "the second, fourth, sixth, and eighth"
      PRESENT_CHAIN: [                         // ch. XV, pp. 166–167: an hundred years cannot be present, nor a year (twelve months),
        { label: 'a hundred years', parts: 100, part: 'year' },   //   nor a month, nor a day ("four and twenty hours"), nor an hour
        { label: 'one year', parts: 12, part: 'month' },          //   ("flying particles"); "The present hath no space."
        { label: 'one month', parts: 30, part: 'day' },           // 30 days: ours (the paper names no count)
        { label: 'one day', parts: 24, part: 'hour' },
        { label: 'one hour', parts: 60, part: 'particle' },       // 60 particles: ours (the paper: "flying particles")
      ],
      SUN_STOOD_STILL: true,                   // ch. XXIII, p. 171: "the sun stood still, but time went on"
      WHEEL_PACE: ['faster', 'slower'],        // ch. XXIII, p. 170: "if it turned sometimes slower, otherwhiles quicker"
    },
    // ---- ours: the clock of play (seconds)
    VOICE: { min: 2.4, max: 3.8 },             // ours: long enough to hold in mind, short enough to keep a round brisk
    WHEEL: {
      turns: 3,                                // ours: the voice lasts exactly three turns of the wheel (countable, not tedious)
      kickFirst: 2,                            // ours: on the first evening the kick doubles the wheel's pace
      kickChoices: [2, 0.5],                   // ours: on later evenings, doubled or halved (the paper's "quicker" and "slower")
      kickDelay: 0.3,                          // ours: seconds after the press when the kick lands (so the player sees it)
    },
    SUN: { start: 0.10, climb: 0.40 },         // ours: where the sun starts on its arc, and how far it climbs while the voice sounds
    HOLD_CAP: 4,                               // ours: a hold ends by itself at four times its target (the sun-watcher's case)
    HYMN: { short: 0.42, gap: 0.07 },          // ours: the voice's short syllable and the silence between syllables; long = 2 × short
    MELODY: [62, 65, 67, 69, 67, 65, 64, 62],  // ours: MIDI pitches for the eight syllables (D F G A G F E D); not the Ambrosian chant
    READ: {                                    // ours: how a hold is read for the verdict, as a ratio of the hold to the voice.
                                               //   After the kick, a hold is read as "counting the wheel" when it lies nearer (in
                                               //   proportion) to what three counted turns would give than to the voice itself; the
                                               //   boundary follows from the kick, so it moves if the kick is changed (see countRatio).
      sunWait: 1.6,                            //   in the sun round, over this: waiting for the sun to move
    },
    LINE_OFF: 0.15,                            // ours: a sung line this far (in proportion) from the voice's is "said more fully" or "hurried"
    SEED: { min: 1000, max: 9999 },            // ours: the evening's number, shown on the last page and in About
  };

  // The seven rounds, in the order played. Each names its source in the paper.
  const ROUNDS = [
    { id: 'voice', title: 'A voice', source: 'ch. XXVII' },
    { id: 'wheel', title: 'The wheel', source: 'ch. XXIII' },
    { id: 'kick', title: 'The wheel again', source: 'ch. XXIII' },
    { id: 'sun', title: 'The sun', source: 'ch. XXIII' },
    { id: 'silence', title: 'A silence', source: 'ch. XXVII' },
    { id: 'hymn', title: 'The hymn', source: 'chs. XXVI–XXVII' },
    { id: 'first', title: 'The first voice', source: 'ch. XXVII; X.viii–xi' },
  ];

  // Augustine's sentences, Pusey's English, with page numbers of the CCEL edition.
  const QUOTES = {
    voice: { text: 'Before it sounded, it was to come, and could not be measured, because as yet it was not, and now it cannot, because it is no longer.', cite: 'XI.xxvii, p. 173' },
    wheel: { text: 'I heard once from a learned man, that the motions of the sun, moon, and stars, constituted time, and I assented not.', cite: 'XI.xxiii, p. 170' },
    kick: { text: 'If the lights of heaven should cease, and a potter’s wheel run round, should there be no time by which we might measure those whirlings, and say … if it turned sometimes slower, otherwhiles quicker, that some rounds were longer, other shorter?', cite: 'XI.xxiii, p. 170' },
    sun: { text: 'The sun stood still, but time went on. For in its own allotted space of time was that battle waged and ended.', cite: 'XI.xxiii, p. 171' },
    silence: { text: 'When we measure silence, and say that this silence hath held as long time as did that voice, do we not stretch out our thought to the measure of a voice, as if it sounded?', cite: 'XI.xxvii, pp. 173–174' },
    hymnAsk: { text: 'How shall I detain the short one, and how, measuring, shall I apply it to the long, that I may find this to have twice so much; seeing the long does not begin to sound, unless the short leaves sounding?', cite: 'XI.xxvii, p. 173' },
    hymn: { text: 'It is not then themselves, which now are not, that I measure, but something in my memory, which there remains fixed.', cite: 'XI.xxvii, p. 173' },
    first: { text: 'It is in thee, my mind, that I measure times.', cite: 'XI.xxvii, p. 173' },
    present: { text: 'The present hath no space.', cite: 'XI.xv, p. 167' },
    know: { text: 'What then is time? If no one asks me, I know: if I wish to explain it to one that asketh, I know not.', cite: 'XI.xiv, p. 165' },
    psalm: { text: 'The same holds in the whole life of man, whereof all the actions of man are parts; the same holds through the whole age of the sons of men, whereof all the lives of men are parts.', cite: 'XI.xxviii, p. 174' },
    then: { text: 'There was no “then,” when there was no time.', cite: 'XI.xiii, p. 165' },
    hell: { text: 'He was preparing hell for pryers into mysteries.', cite: 'XI.xii, p. 164' },
    distentio: { text: 'Time is nothing else than protraction; but of what, I know not; and I marvel, if it be not of the mind itself?', cite: 'XI.xxvi, p. 172' },
  };

  // ---- randomness: one seeded stream per evening (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function newSeed(r) { const S = CONFIG.SEED; return S.min + Math.floor((r === undefined ? Math.random() : r) * (S.max - S.min + 1)); }
  const round3 = x => Math.round(x * 1000) / 1000;

  // ---- the evening: deal the rounds
  function newGame(seed, opts) {
    opts = opts || {};
    const R = rng(seed), V = CONFIG.VOICE, W = CONFIG.WHEEL;
    const voiceLen = () => round3(V.min + R() * (V.max - V.min));
    const rounds = ROUNDS.map(spec => {
      const r = { id: spec.id, title: spec.title, source: spec.source };
      if (spec.id === 'hymn') { r.syllables = hymnVoice(); r.T = round3(lineLength(r.syllables)); }
      else if (spec.id !== 'first') r.T = voiceLen();
      if (spec.id === 'kick') r.factor = opts.first ? W.kickFirst : W.kickChoices[Math.floor(R() * W.kickChoices.length)];
      return r;
    });
    rounds[6].T = rounds[0].T;                 // the first voice, fetched back from memory: exactly round 1's length
    const P = rng(seed ^ 0x5bd1e995);
    const prologue = CONFIG.PAPER.PRESENT_CHAIN.map(s => ({ label: s.label, parts: s.parts, part: s.part, now: Math.floor(s.parts * (0.3 + 0.4 * P())) }));
    return { seed, first: !!opts.first, rounds, prologue, i: 0, results: [], done: false };
  }
  function current(g) { return g.rounds[g.i]; }

  // ---- the hymn: the voice's eight syllables, and a sung line's length
  function hymnVoice() {
    const H = CONFIG.HYMN, P = CONFIG.PAPER;
    return P.HYMN_LINE.map((s, k) => ({ text: s, long: P.HYMN_LONG[k], dur: P.HYMN_LONG[k] ? H.short * P.LONG_OVER_SHORT : H.short, pitch: CONFIG.MELODY[k] }));
  }
  function lineLength(syl) { return syl.reduce((a, s) => a + s.dur, 0) + CONFIG.HYMN.gap * (syl.length - 1); }

  // ---- the world's clocks (t: seconds since the voice began; tPress: seconds since the voice began at the press, or null)
  function wheelPeriod(r) { return r.T / CONFIG.WHEEL.turns; }
  function wheelTurns(r, t, tPress) {
    const P = wheelPeriod(r);
    if (r.id !== 'kick' || tPress == null) return t / P;
    const tk = tPress + CONFIG.WHEEL.kickDelay;
    return t <= tk ? t / P : tk / P + (t - tk) * r.factor / P;
  }
  function kicked(r, t, tPress) { return r.id === 'kick' && tPress != null && t > tPress + CONFIG.WHEEL.kickDelay; }
  function sunAt(r, t) { const S = CONFIG.SUN; return S.start + S.climb * Math.max(0, Math.min(1, t / r.T)); }
  function holdCap(r) { return r.T * CONFIG.HOLD_CAP; }
  // what a player who counts three turns of the wheel from the press would hold, as a ratio of the voice
  function countRatio(r) {
    const P = wheelPeriod(r), d = CONFIG.WHEEL.kickDelay, n = CONFIG.WHEEL.turns;
    const secs = n * P <= d ? n * P : d + (n * P - d) / r.factor;
    return secs / r.T;
  }

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
  function timesWords(k) {                     // how many times a short goes into a long
    if (k < 0.95) return 'less than once: your short one came out longer';
    const a = amount(k);
    if (a.x === 1) return 'about once: they came out the same length';
    if (a.x === 1.1) return 'a little more than once';
    return a.n.replace('double', 'twice');
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
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

  // ---- a hold (rounds voice, wheel, kick, sun, first): seconds held, and when the press came (seconds after the voice began)
  function hold(g, secs, tPress) {
    const r = current(g);
    if (!['voice', 'wheel', 'kick', 'sun', 'first'].includes(r.id)) throw new Error('not a hold round: ' + r.id);
    const capped = secs >= holdCap(r) - 1e-9;
    const made = Math.min(secs, holdCap(r)), x = made / r.T;
    const noun = r.id === 'first' ? 'the first voice' : 'the voice';
    const res = { id: r.id, title: r.title, target: r.T, made: round3(made), ratio: x, big: amount(x).big, lines: [amountSentence(x, noun)], capped, quote: QUOTES[r.id] };
    if (r.id === 'voice') res.lines.push('The voice had stopped before you began. It wasn’t there to hold up against yours.');
    if (r.id === 'wheel') {
      const n = made / wheelPeriod(r);
      res.lines.push('The wheel kept its pace. The voice lasted ' + turnsWords(CONFIG.WHEEL.turns) + ' of it; your hold lasted ' + turnsWords(n) + '.');
    }
    if (r.id === 'kick') {
      const fast = r.factor > 1, tp = tPress == null ? r.T : tPress;
      const turnsSincePress = wheelTurns(r, tp + made, tp) - wheelTurns(r, tp, tp);
      res.turns = turnsSincePress; res.factor = r.factor;
      const n0 = turnsWords(CONFIG.WHEEL.turns);
      res.lines.push(fast ? 'When you pressed, the potter kicked the wheel. It ran faster, so ' + n0 + ' took less time than the voice.'
        : 'When you pressed, the potter dragged on the wheel. It ran slower, so ' + n0 + ' took more time than the voice.');
      const counted = Math.abs(Math.log(x / countRatio(r))) < Math.abs(Math.log(x));
      res.reading = counted ? 'counted' : 'saw';
      res.lines.push(counted ? 'You let go after ' + turnsWords(turnsSincePress) + ', just where counting the wheel would put you.'
        : 'You let go after ' + turnsWords(turnsSincePress) + ', not ' + n0.replace(/ turns?$/, '') + ': you saw it ' + (fast ? 'race' : 'slow') + '.');
      res.lines.push('How did you know it was ' + (fast ? 'racing' : 'slowing') + '? Not by the wheel.');
    }
    if (r.id === 'sun') {
      const waited = x > CONFIG.READ.sunWait;
      res.reading = waited ? 'waited' : 'letgo';
      res.lines.push('The sun stood still the whole time you held.');
      res.lines.push(capped ? 'You waited for it to move. It never did, so your hold was stopped at four times the voice.'
        : waited ? 'You waited for it to move, and let go at ' + amount(x).n + ' the voice.'
          : 'You let go all the same. Time went on.');
    }
    if (r.id === 'first') res.lines.push('You heard it in the first minute of the evening, and it was still there to measure by.');
    return finish(g, res);
  }

  // ---- a silence (round silence): seconds from the voice's end to the tap
  function silence(g, secs) {
    const r = current(g);
    if (r.id !== 'silence') throw new Error('not the silence round');
    const made = Math.min(secs, holdCap(r)), x = made / r.T;
    const res = { id: r.id, title: r.title, target: r.T, made: round3(made), ratio: x, big: amount(x).big, quote: QUOTES.silence,
      lines: ['Your silence was ' + amount(x).pre + ' the voice' + (verdictWord(x) ? ': ' + verdictWord(x) + '.' : '.'),
        'Nothing moved out there, and nothing sounded. All you had was a voice that had stopped.'] };
    return finish(g, res);
  }

  // ---- the hymn: the player's eight syllables (seconds each), the whole line from first press to last release
  function sing(g, durs, lineSecs) {
    const r = current(g);
    if (r.id !== 'hymn') throw new Error('not the hymn round');
    if (durs.length !== 8) throw new Error('the line has eight syllables');
    const P = CONFIG.PAPER, mean = a => a.reduce((s, v) => s + v, 0) / a.length;
    const longs = durs.filter((d, k) => P.HYMN_LONG[k]), shorts = durs.filter((d, k) => !P.HYMN_LONG[k]);
    const ls = mean(longs) / mean(shorts), x = ls / P.LONG_OVER_SHORT, line = lineSecs / r.T;
    const res = { id: r.id, title: r.title, target: r.T, made: round3(lineSecs), durs: durs.map(round3), ratio: x, longOverShort: ls, lineRatio: line,
      big: amount(ls).big, quote: QUOTES.hymnAsk, laid: null, lines: [] };
    res.lines.push('Your long syllables were ' + amount(ls).pre + ' your short ones. Augustine hears them as double.');
    if (Math.abs(line - 1) > CONFIG.LINE_OFF) res.lines.push('Your whole line took ' + amount(line).pre + ' the voice’s: every syllable was there, '
      + (line > 1 ? 'said more fully' : 'said in a hurry') + '. So a syllable is no fixed measure either.');
    res.lines.push('Now lay one of your short syllables against one of your long ones: touch one of each.');
    g.pending = res;
    return res;
  }
  function lay(g, iShort, iLong) {
    const res = g.pending, P = CONFIG.PAPER;
    if (!res || res.id !== 'hymn') throw new Error('nothing sung to lay');
    if (P.HYMN_LONG[iShort] || !P.HYMN_LONG[iLong]) throw new Error('lay a short one against a long one');
    const k = res.durs[iLong] / res.durs[iShort];
    res.laid = { iShort, iLong, ratio: k };
    res.lines = res.lines.filter(l => !/^Now lay/.test(l));
    res.lines.push('Laid against your long ' + P.HYMN_LINE[iLong].toUpperCase() + ', your short ' + P.HYMN_LINE[iShort].toUpperCase() + ' goes in ' + timesWords(k) + '.');
    res.lines.push('When your long one sounded, your short one had already stopped. You laid them side by side here, in memory.');
    res.quote = QUOTES.hymn;
    g.pending = null;
    return finish(g, res);
  }

  function finish(g, res) {
    g.results[g.i] = res;
    return res;
  }
  function next(g) { if (!g.results[g.i]) throw new Error('round not finished'); g.i++; if (g.i >= g.rounds.length) { g.done = true; g.i = g.rounds.length; } return g; }

  // ---- the last page
  function verdict(g) {
    const R = g.results, by = id => R.find(r => r && r.id === id);
    const kick = by('kick'), sun = by('sun'), hymn = by('hymn'), first = by('first');
    const counted = kick && kick.reading === 'counted', waited = sun && sun.reading === 'waited';
    const memory = R.filter(r => r && (['voice', 'wheel', 'silence', 'first'].includes(r.id) || (r.id === 'kick' && !counted) || (r.id === 'sun' && !waited)));
    const errs = memory.map(r => Math.abs(Math.log(r.ratio))).sort((a, b) => a - b);
    const med = errs.length ? errs[Math.floor((errs.length - 1) / 2)] : 0;
    const headline = counted && waited ? 'You kept time by the wheel and the sun, like the learned man.'
      : counted ? 'You kept time with your mind, until a wheel ran away with you.'
        : waited ? 'You kept time with your mind, until you waited for the sun.'
          : 'You kept time with no clock but your mind.';
    const did = ['You measured seven times with no clock. Going by the voice in your memory, you came ' + closeness(med) + ' of it.'];
    if (kick) {
      const fast = kick.factor > 1;
      did.push(counted ? 'When the wheel ' + (fast ? 'raced' : 'slowed') + ', you let go at ' + amount(kick.ratio).n + ' the voice, just where counting its turns would put you.'
        : 'When the wheel ' + (fast ? 'raced' : 'slowed') + ', you ' + (fast ? 'held on' : 'let go in time') + ': you saw it ' + (fast ? 'race' : 'slow') + ', with something that isn’t the wheel.');
    }
    if (sun) did.push(waited ? 'When the sun stood still, you waited for it: ' + amount(sun.ratio).n + ' the voice.' : 'When the sun stood still, you let go all the same: time went on.');
    if (hymn && first) {
      const a = amount(first.ratio);
      did.push('Your long syllables came out ' + amount(hymn.longOverShort).pre + ' your short ones, and you held the first voice to ' + (a.x === 1 ? 'about its own length' : a.n + ' its length') + ', minutes after it stopped.');
    }
    return {
      headline, did, seed: g.seed,
      says: 'Augustine: a wheel and the sun are motions, and we measure motions by time, so they are not time. A voice can’t be measured while it sounds, and it is gone once it stops. What you measured each time was what it left in you.',
      means: 'For Augustine, time is a stretching of the mind (his word is distentio), between what it expects and what it remembers.',
      meansQuote: QUOTES.first,
      pairs: R.map(r => ({ id: r.id, title: r.title, target: r.target, made: r.made, big: r.big, durs: r.durs || null })),
      psalm: 'This evening too: before you began, all seven rounds lay ahead of you, in expectation. Now they are all in memory. Augustine says it is the same with a psalm said by heart, with every syllable of it, and with each longer thing it is part of.',
      psalmQuote: QUOTES.psalm,
      before: 'And before there was anything at all? Augustine refuses the old joke that God was “preparing hell for pryers into mysteries”. There was no before: time began with the things that were made.',
      beforeQuote: QUOTES.then,
    };
  }

  return { CONFIG, ROUNDS, QUOTES, rng, newSeed, newGame, current, hymnVoice, lineLength, wheelPeriod, wheelTurns, kicked, sunAt, holdCap, countRatio,
    amount, verdictWord, closeness, amountSentence, turnsWords, timesWords, hold, silence, sing, lay, next, verdict, AMOUNTS };
});
