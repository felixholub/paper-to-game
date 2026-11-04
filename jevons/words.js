// Jevons's Noon: the words. Everything the game says, built from what the mechanism reports. No rule that affects
// what happens lives here; this file only describes. Runs in Node (loop.js) and in the browser (inlined by build.py).

const WORDS = (function () {
  const R = n => Math.round(n);
  const commas = n => String(R(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const roundTo = (n, step) => Math.round(n / step) * step;

  // ---- sizes in words --------------------------------------------------------------------------------------
  function fireChange(r) {               // "the fire ..."
    if (r >= 4.5) return `grew about ${R(r)}-fold`;
    if (r >= 3.5) return 'about quadrupled';
    if (r >= 2.75) return 'about trebled';
    if (r >= 2.3) return 'grew about two and a half times';
    if (r >= 1.8) return 'about doubled';
    if (r >= 1.6) return 'grew by about two-thirds';
    if (r >= 1.4) return 'grew by about half';
    if (r >= 1.25) return 'grew by about a third';
    if (r >= 1.12) return 'grew by about a fifth';
    if (r >= 1.04) return 'grew a little';
    if (r > 0.96) return 'stayed about where it was';
    if (r > 0.88) return 'fell a little';
    if (r > 0.78) return 'fell by about a fifth';
    if (r > 0.7) return 'fell by about a quarter';
    if (r > 0.6) return 'fell by about a third';
    if (r > 0.45) return 'about halved';
    return 'fell to less than half';
  }
  function sizeAgainst(r, what) {        // "about twice what it is now"
    if (r >= 4.5) return `about ${R(r)} times ${what}`;
    if (r >= 3.5) return `about four times ${what}`;
    if (r >= 2.75) return `about three times ${what}`;
    if (r >= 2.3) return `about two and a half times ${what}`;
    if (r >= 1.8) return `about twice ${what}`;
    if (r >= 1.6) return `about two-thirds bigger than ${what}`;
    if (r >= 1.4) return `about half as big again as ${what}`;
    if (r >= 1.25) return `about a third bigger than ${what}`;
    if (r >= 1.12) return `about a fifth bigger than ${what}`;
    if (r >= 1.03) return `a little bigger than ${what}`;
    if (r > 0.97) return `the same as ${what}`;
    if (r > 0.88) return `a little smaller than ${what}`;
    if (r > 0.7) return `about a quarter smaller than ${what}`;
    if (r > 0.55) return `about a third smaller than ${what}`;
    if (r > 0.4) return `about half ${what}`;
    return `less than half ${what}`;
  }
  function priceWords(p) {
    if (p < 1.08) return 'no dearer than in 1865';
    if (p < 1.25) return 'a little dearer than in 1865';
    if (p < 1.6) return 'about half as dear again as in 1865';
    if (p < 1.85) return 'nearly twice as dear as in 1865';
    if (p < 2.4) return 'about twice as dear as in 1865';
    if (p < 3.4) return 'about three times as dear as in 1865';
    return `about ${R(p)} times as dear as in 1865`;
  }
  function americaWords(ratio) {         // America's coal ÷ Britain's
    if (ratio < 0.15) return 'America burns about a tenth as much coal as Britain';
    if (ratio < 0.26) return 'America burns about a fifth as much coal as Britain';
    if (ratio < 0.4) return 'America burns about a third as much coal as Britain';
    if (ratio < 0.6) return 'America burns about half as much coal as Britain';
    if (ratio < 0.85) return 'America burns about three-quarters as much coal as Britain';
    if (ratio < 1) return 'America burns nearly as much coal as Britain';
    if (ratio < 1.3) return 'America burns a little more coal than Britain';
    if (ratio < 1.75) return 'America burns half as much again as Britain';
    if (ratio < 2.5) return 'America burns about twice as much coal as Britain';
    if (ratio < 3.5) return 'America burns about three times as much coal as Britain';
    if (ratio < 15) return `America burns about ${R(ratio)} times as much coal as Britain`;
    return 'America burns far more coal than Britain, many times over';
  }
  function peopleWords(m) {              // millions
    if (m < 0.05) return null;
    if (m < 0.15) return 'about a hundred thousand people';
    if (m < 0.95) return `about ${roundTo(m * 10, 1) * 100} thousand people`.replace('about 10 hundred', 'about a million');
    if (m < 1.5) return 'about a million people';
    return `about ${R(m)} million people`;
  }
  function depthWords(ft) { return `${commas(Math.max(100, roundTo(ft, 100)))} feet`; }
  function pitsWords(ft) { return ft < 900 ? 'the pits are still shallow' : `the pits now dig at about ${depthWords(ft)}`; }
  function squaresWords(n) {
    if (n < 0.75) return 'less than a square';
    if (n < 1.5) return 'about one square';
    return `about ${R(n)} squares`;
  }

  // ---- the ruler ---------------------------------------------------------------------------------------------
  const MARKS = [
    { key: 'cut', mult: 0.5, name: 'cut back', def: y => `Cut back: forbid the sending of coal abroad and restrain the trade, so that the fire in ${y} is half today's.` },
    { key: 'stand', mult: 1, name: 'a stand', def: y => `A stand: hold the fire where it is, no more coal burnt in ${y} than now.` },
    { key: 'slower', mult: 1.5, name: 'slower', def: y => `Slower: let the trade grow, but only by half in twenty years.` },
    { key: 'now', mult: 2, name: 'as now', def: y => `As now: the pace of the last few years, three and a half in the hundred a year; the fire doubles in a generation.` },
    { key: 'faster', mult: 2.4, name: 'faster', def: y => `Faster: push the trade on, coal sent freely abroad; the fire more than doubles.` },
  ];
  function markNear(mult) {
    let best = null;
    for (const m of MARKS) if (Math.abs(mult - m.mult) < 0.06 && (!best || Math.abs(mult - m.mult) < Math.abs(mult - best.mult))) best = m;
    return best;
  }
  function planReading(st, plan) {
    const y = st.year + 20, m = markNear(plan.mult);
    const head = m ? m.def(y) + ' ' : '';
    return `${head}By ${y} the fire would be ${sizeAgainst(plan.mult, 'what it is now')}. These twenty years would take ${squaresWords(plan.squares)} of coal out of the ground.`;
  }
  function paceVerb(mult) {             // for "What you did"
    const m = markNear(mult);
    if (m && m.key === 'cut') return 'cut it back hard';
    if (m && m.key === 'stand') return 'held it level';
    if (m && m.key === 'slower') return 'let it grow slowly';
    if (m && m.key === 'now') return 'let it double';
    if (m && m.key === 'faster') return 'pushed it faster than ever';
    if (mult >= 2.15) return 'pushed it faster than ever';
    if (mult >= 1.75) return 'let it nearly double';
    if (mult >= 1.15) return 'let it grow slowly';
    if (mult > 0.9) return 'held it about level';
    return 'cut it back';
  }

  // ---- the engine offer ------------------------------------------------------------------------------------
  const lb = n => n === 4 ? '4 lb' : n === 2 ? '2 lb' : n < 1.35 ? 'under 1⅓ lb' : `${n} lb`;
  function engineCard(offer) {
    const first = offer.key === 'air';
    const title = first ? 'A NEW ENGINE' : 'THE AIR-ENGINE PERFECTED';
    const gainWords = offer.gain >= 2.6 ? 'a third of the coal Britain\'s engines burn' : offer.gain >= 1.8 ? 'half the coal Britain\'s engines burn' : 'a third less coal than Britain\'s engines';
    const body = first
      ? `Inventors offer an air-engine that does the same work on half the coal. For one horse-power for an hour, the best engines now burn ${lb(offer.lbBritain)} of coal; the air-engine burns ${lb(offer.lbNew)}.`
      : `The air-engine is perfected: it does the same work on ${gainWords}. For one horse-power for an hour, Britain's engines burn ${lb(offer.lbBritain)} of coal; the new one burns ${lb(offer.lbNew)}.`;
    return {
      title, body, lumpsBritain: offer.lbBritain, lumpsNew: offer.lbNew,
      rule: 'Whatever Britain does, America fits it at once.',
      fit: 'Every engine in Britain is changed for it.', refuse: 'Britain keeps the engines it has.',
    };
  }

  // ---- Jevons's sentences (only from the preface, ch. I, ch. VII and ch. XVIII) ------------------------------
  const Q = {
    paradox: ['It is wholly a confusion of ideas to suppose that the economical use of fuel is equivalent to a diminished consumption. The very contrary is the truth.', 'ch. VII'],
    saved: ['No one must suppose that coal thus saved is spared—it is only saved from one use to be employed in others.', 'ch. VII'],
    smallness: ['To secure a safe smallness we should have to go back, and strangle in their birth those thoughts and inventions which redeemed us from dullness and degeneration a century ago.', 'ch. XVIII'],
    passing: ['Not only must we meet some limit within our own country, but we must witness the coal produce of other countries approximating to our own, and ultimately passing it.', 'preface'],
    boulder: ['It is easy to set a boulder rolling on the mountain-side; it is perilous to try to stop it.', 'preface'],
    exodus: ['We must either maintain the expansion of our trade and employment, or else witness a sore pressure of population and a great exodus of our people.', 'preface'],
    dear: ['We cannot get to the bottom of them; and though we may some day have to pay dear for fuel, it will never be positively wanting.', 'preface'],
    cheapest: ['So far as cheap fuel and power is the exciting cause of manufactures, these must pass to where fuel is cheapest.', 'preface'],
    mar: ['Restrictive legislation may mar but cannot mend the natural course of industrial development.', 'ch. I'],
    push: ['If we lavishly and boldly push forward in the creation and distribution of our riches, it is hard to over-estimate the pitch of beneficial influence to which we may attain in the present.', 'ch. XVIII'],
    greater: ['Our new industry and civilization had an obscure and unregarded commencement; it is great already, and will be far greater yet before it is less.', 'ch. XVIII'],
    stationary: ['How long we may exist in a stationary condition I, for one, should never attempt to conjecture.', 'preface'],
    impossible: ['The maintenance of such a position is physically impossible.', 'ch. XVIII'],
    spring: ['When our great spring is here run down, our fires half burnt out, may we not look for an increasing flame of civilization elsewhere?', 'ch. XVIII'],
    wise: ['Are we wise in allowing the commerce of this country to rise beyond the point at which we can long maintain it?', 'ch. XVIII'],
    instincts: ['In fearlessly following our instincts of rapid growth we may rear a fabric of varied civilization, we may develop talents and virtues, and propagate influences which could not have resulted from slow restricted growth however prolonged.', 'ch. XVIII'],
    littleness: ['Britain may contract to her former littleness, and her people be again distinguished for homely and hardy virtues, for a clear intellect and a regard for law, rather than for brilliancy and power.', 'ch. XVIII'],
    choice: ['We have to make the momentous choice between brief greatness and longer continued mediocrity.', 'ch. XVIII'],
    noon: ['We are now in the full morning of our national prosperity, and are approaching noon. Yet we have hardly begun to pay the moral and the social debts to millions of our countrymen which we must pay before the evening.', 'preface'],
    cannot: ['It is simply that we cannot long progress as we are now doing.', 'preface'],
  };
  function pick(used, keys) {
    for (const k of keys) if (k && !used.has(k)) { used.add(k); return { key: k, text: Q[k][0], where: Q[k][1] }; }
    return null;
  }

  // ---- after a generation ----------------------------------------------------------------------------------
  function result(rec, st, used) {
    const pm = rec.planMult, am = rec.mult;
    const lines = [];
    const eng = rec.engine ? (rec.engine.fit ? ' and fitted the new engine' : ' and refused the new engine') : '';
    const cmp = am > pm * 1.08 ? ', higher than you set it' : am < pm * 0.92 ? ', short of your line' : ', as you set it';
    const lead = `You set Britain's fire for ${rec.to} at ${sizeAgainst(pm, 'that of ' + rec.from)}${eng}. It ${fireChange(am)}${cmp}.`;
    if (rec.engine && rec.engine.fit && am > pm * 1.03)
      lines.push('Each ton did more work, so power was cheaper, and new works were built on it: ploughs, pumps, mills, ships. More coal was burnt, not less. America fitted it too.');
    if (rec.engine && !rec.engine.fit)
      lines.push('America fitted the engine Britain refused; power there was cheaper, and works went there.');
    if (am < pm * 0.92 && rec.price >= 1.08)
      lines.push(`Coal from ${depthWords(rec.depth)} is ${priceWords(rec.price)}, and works went to America, where coal is cheap.`);
    lines.push(`${cap(squaresWords(rec.squares))} of coal came out of the ground; ${pitsWords(rec.depth)}.`);
    lines.push(rec.americaPassedNow ? 'America now burns more coal than Britain.' : americaWords(rec.americaRatio) + '.');
    const pw = peopleWords(rec.gone);
    lines.push(pw ? `In some years the trade grew slower than the people; ${pw} went over the sea for want of work.` : 'Nobody had to leave for want of work.');
    // Jevons
    const keys = [];
    if (rec.engine && rec.engine.fit) keys.push(used.has('paradox') ? 'saved' : 'paradox');
    if (rec.engine && !rec.engine.fit) keys.push('smallness');
    if (rec.americaPassedNow) keys.push('passing');
    if (rec.gone >= 1 && pm < 1.3) keys.push(used.has('boulder') ? 'exodus' : 'boulder');
    if (am < pm * 0.9 && rec.price >= 1.15) keys.push(used.has('cheapest') ? 'dear' : 'cheapest');
    if (pm < 0.8) keys.push('mar');
    if (pm >= 2.2) keys.push('push');
    if (pm >= 1.8 && am >= 1.7) keys.push('greater');
    if (pm < 1.1 && pm > 0.9) keys.push('stationary');
    if (rec.gone >= 1) keys.push('exodus');
    if (am > 1.4) keys.push('cannot');
    const quote = pick(used, keys);
    return { lead, lines, quote };
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function evening(st, used) {
    const r = st.gens[st.gens.length - 1];
    const text = `Coal from ${depthWords(MECH.depthOf(st.S))} is ${priceWords(MECH.priceOf(st.S))}, and America's is cheap. From here the trade cannot grow at any pace you set: the fire falls. The sheet draws itself to 1985 at the last pace you set.`;
    return { text, quote: pick(used, ['impossible', 'spring']) };
  }

  // ---- the verdict -----------------------------------------------------------------------------------------
  function whatYouDid(st) {
    const gens = st.gens.filter(g => !g.auto);
    const runs = [];
    for (const g of gens) {
      const v = paceVerb(g.planMult);
      if (runs.length && runs[runs.length - 1].v === v) runs[runs.length - 1].n++; else runs.push({ v, n: 1 });
    }
    const N = ['', '', 'for two generations', 'for three generations', 'for four generations', 'for five generations', 'for six generations'];
    const parts = runs.map((r, i) => (i === 0 ? '' : 'then ') + r.v + (r.n > 1 ? ' ' + N[r.n] : (runs.length === 1 ? ' every generation' : '')));
    let s = 'You ' + parts.join(', ');
    const e = st.engines, a = e.air, p = e.perfect;
    let eng = '';
    if (a && p) eng = a === 'fit' && p === 'fit' ? 'fitted both new engines' : a === 'refused' && p === 'refused' ? 'refused both new engines'
      : a === 'fit' ? 'fitted the air-engine but refused the perfected one' : 'refused the air-engine but fitted the perfected one';
    else if (a) eng = a === 'fit' ? 'fitted the air-engine' : 'refused the air-engine';
    s = s.replace(/^You let it/, 'You let the fire').replace(/^You held it/, 'You held the fire').replace(/^You cut it/, 'You cut the fire').replace(/^You pushed it/, 'You pushed the fire');
    return s + (eng ? ', and ' + eng : '') + '.';
  }
  function verdict(v, st, used) {
    const heading = v.kind === 'greatness' ? 'A BRIEF GREATNESS' : v.kind === 'mediocrity' ? 'A LONGER CONTINUED MEDIOCRITY' : 'BETWEEN THE TWO';
    const lines = [whatYouDid(st)];
    let noon;
    if (v.noonYear === MECH.CONFIG.START_YEAR) noon = 'Your noon was 1865 itself: the fire never stood higher than where you found it.';
    else noon = `Your noon came in ${v.noonYear}${v.noonOffSheet ? ', above the top of the sheet,' : ','} at ${sizeAgainst(v.noonMult, 'the fire of 1865')}.`;
    let after;
    const until = v.untilYear > 2600 ? 'for centuries' : `until about ${roundTo(v.untilYear, 10)}`;
    if (v.evening) {
      const atEve = st.history.find(h => h.year === v.eveningYear);
      after = `By ${v.eveningYear} the pits were at about ${depthWords(MECH.depthOf(atEve.S))} and coal ${priceWords(MECH.priceOf(atEve.S))}; the works went where coal was cheap, and the fire fell whatever pace was set. In 1985 it was ${sizeAgainst(v.fallFromNoon, 'its noon')}.`;
    } else if (v.stillRising) {
      after = `In 1985 it was still rising, with the pits at about ${depthWords(v.depth)}; at that pace the coal within 4,000 feet would last ${until}.`;
    } else {
      after = `In 1985 it was ${sizeAgainst(v.endMult, 'the fire of 1865')}, with the pits at about ${depthWords(v.depth)}; at that pace the coal within 4,000 feet would last ${until}.`;
    }
    lines.push(noon + ' ' + after);
    const am = v.americaPassed ? `America passed Britain in ${v.americaPassed}.` : 'America never passed Britain.';
    let pw = peopleWords(v.gone);
    let ppl;
    if (!pw || v.gone < 0.5) ppl = 'Hardly anyone had to leave for want of work.';
    else {
      const before = v.goneBeforeNoon / v.gone;
      const when = v.noonYear === MECH.CONFIG.START_YEAR ? 'steadily, generation after generation'
        : before < 0.2 ? 'nearly all of them after your noon' : before > 0.8 ? 'nearly all of them before your noon' : 'some before your noon and some after';
      ppl = `${cap(pw)} went over the sea for want of work, ${when}.`;
    }
    lines.push(am + ' ' + ppl);
    const qs = [];
    const k = v.kind === 'greatness' ? 'instincts' : v.kind === 'mediocrity' ? 'littleness' : 'wise';
    qs.push({ text: Q[k][0], where: Q[k][1] });
    qs.push({ text: Q.choice[0], where: Q.choice[1], big: true });
    qs.push({ text: Q.noon[0], where: Q.noon[1] });
    return { heading, lines, quotes: qs };
  }

  return { fireChange, sizeAgainst, priceWords, americaWords, peopleWords, depthWords, pitsWords, squaresWords, MARKS, markNear,
    planReading, engineCard, result, evening, verdict, whatYouDid, Q };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = WORDS;
