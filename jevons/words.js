// Jevons's Noon: the words. Everything the game says, built from what the mechanism reports. No rule that affects
// what happens lives here; this file only describes. Runs in Node (loop.js) and in the browser (inlined by build.py).
// Written so that a child could follow it: short sentences, the things on screen called by what they look like.

const WORDS = (function () {
  const R = n => Math.round(n);
  const commas = n => String(R(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const roundTo = (n, step) => Math.round(n / step) * step;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // ---- sizes in words --------------------------------------------------------------------------------------
  function fireChange(r) {               // "the fire ..."
    if (r >= 4.5) return `grew about ${R(r)} times bigger`;
    if (r >= 3.5) return 'grew about four times bigger';
    if (r >= 2.75) return 'grew about three times bigger';
    if (r >= 2.3) return 'grew about two and a half times bigger';
    if (r >= 1.8) return 'doubled';
    if (r >= 1.6) return 'grew by about two-thirds';
    if (r >= 1.4) return 'grew by about half';
    if (r >= 1.25) return 'grew by about a third';
    if (r >= 1.12) return 'grew by about a fifth';
    if (r >= 1.04) return 'grew a little';
    if (r > 0.96) return 'stayed about the same';
    if (r > 0.88) return 'fell a little';
    if (r > 0.78) return 'fell by about a fifth';
    if (r > 0.7) return 'fell by about a quarter';
    if (r > 0.6) return 'fell by about a third';
    if (r > 0.45) return 'halved';
    return 'fell to less than half';
  }
  function sizeAgainst(r, what) {        // "twice what it is now"
    if (r >= 4.5) return `about ${R(r)} times ${what}`;
    if (r >= 3.5) return `about four times ${what}`;
    if (r >= 2.75) return `about three times ${what}`;
    if (r >= 2.3) return `about two and a half times ${what}`;
    if (r >= 1.8) return `about twice ${what}`;
    if (r >= 1.6) return `about two-thirds more than ${what}`;
    if (r >= 1.4) return `about half as much again as ${what}`;
    if (r >= 1.25) return `about a third more than ${what}`;
    if (r >= 1.12) return `about a fifth more than ${what}`;
    if (r >= 1.03) return `a little more than ${what}`;
    if (r > 0.97) return `the same as ${what}`;
    if (r > 0.88) return `a little less than ${what}`;
    if (r > 0.7) return `about a quarter less than ${what}`;
    if (r > 0.55) return `about a third less than ${what}`;
    if (r > 0.4) return `about half ${what}`;
    if (r > 0.15) return `less than half ${what}`;
    return `only a small part of ${what}`;
  }
  function mult(r) {                     // the ledger's figures: "x1.6"
    if (r >= 9.5) return '×' + R(r);
    return '×' + (Math.round(r * 10) / 10).toFixed(1).replace(/\.0$/, '');
  }
  function priceWords(p) {
    if (p < 1.08) return 'no dearer than in 1865';
    if (p < 1.25) return 'a little dearer than in 1865';
    if (p < 1.6) return 'about half as dear again as in 1865';
    if (p < 1.85) return 'nearly twice as dear as in 1865';
    if (p < 2.4) return 'about twice as dear as in 1865';
    if (p < 3.4) return 'about three times as dear as in 1865';
    if (p < 12) return `about ${R(p)} times as dear as in 1865`;
    return 'dearer than any works will pay';
  }
  function daysWords(d) {
    if (!isFinite(d) || d > 365) return 'more than the whole year';
    const n = Math.max(1, R(d));
    return `${n} day${n === 1 ? '' : 's'}`;
  }
  function americaWords(ratio) {         // America's coal ÷ Britain's
    if (ratio < 0.15) return 'America burns about a tenth as much coal as Britain';
    if (ratio < 0.26) return 'America burns about a fifth as much coal as Britain';
    if (ratio < 0.4) return 'America burns about a third as much coal as Britain';
    if (ratio < 0.6) return 'America burns about half as much coal as Britain';
    if (ratio < 0.85) return 'America burns about three-quarters as much coal as Britain';
    if (ratio < 1) return 'America burns nearly as much coal as Britain';
    if (ratio < 1.3) return 'America now burns a little more coal than Britain';
    if (ratio < 1.75) return 'America burns half as much again as Britain';
    if (ratio < 2.5) return 'America burns about twice as much coal as Britain';
    if (ratio < 3.5) return 'America burns about three times as much coal as Britain';
    if (ratio < 15) return `America burns about ${R(ratio)} times as much coal as Britain`;
    return 'America burns many times more coal than Britain';
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
    if (n < 0.75) return 'less than one square';
    if (n < 1.5) return 'about one square';
    return `about ${R(n)} squares`;
  }
  function lastsWords(y) {
    if (!isFinite(y)) return 'never';
    if (y > 2900) return 'for many centuries';
    return `to about ${roundTo(y, 10)}`;
  }
  function lastsShort(y) {                // on the ruler
    if (!isFinite(y)) return 'for ever';
    if (y > 2900) return 'centuries';
    return `to ${roundTo(y, 10)}`;
  }
  function lastsSentence(y) {
    if (!isFinite(y)) return 'Kept up, this pace would never use up the coal.';
    if (y > 2900) return 'Kept up, this pace would leave coal in the ground for many centuries.';
    return `Kept up, this pace would use the last of the coal within 4,000 feet by about ${roundTo(y, 10)}.`;
  }
  const does = lb => lb === 4 ? 'as much work as it does now' : lb === 2 ? 'twice the work a ton did in 1865' : 'three times the work a ton did in 1865';
  const lb = n => n === 4 ? '4 pounds' : n === 2 ? '2 pounds' : n < 1.35 ? 'under 1⅓ pounds' : `${n} pounds`;
  const engineName = key => key === 'air' ? 'the air-engine' : 'the perfected air-engine';

  // ---- the ruler ---------------------------------------------------------------------------------------------
  const MARKS = [
    { key: 'cut', mult: 0.5, name: 'cut back', amount: 'half as much', short: 'half', def: y => `Cut back: forbid the sending of coal abroad and restrain the trade, so that by ${y} Britain burns half what it burns now.` },
    { key: 'stand', mult: 1, name: 'a stand', amount: 'the same', short: 'the same', def: y => `A stand: hold the fire where it is, so that in ${y} Britain burns the same as now.` },
    { key: 'slower', mult: 1.5, name: 'slower', amount: 'half as much again', short: 'half again', def: y => `Slower: let the trade grow, but only by half in twenty years.` },
    { key: 'now', mult: 2, name: 'as now', amount: 'twice as much', short: 'twice', def: y => `As now: the pace of the last few years, three and a half in the hundred a year. The fire doubles in a generation.` },
    { key: 'faster', mult: 2.4, name: 'faster', amount: 'more than twice', short: 'more', def: y => `Faster: push the trade on and send coal freely abroad. The fire more than doubles.` },
  ];
  function markNear(m) {
    let best = null;
    for (const k of MARKS) if (Math.abs(m - k.mult) < 0.06 && (!best || Math.abs(m - k.mult) < Math.abs(m - best.mult))) best = k;
    return best;
  }
  function planReading(st, plan, lastTurn) {
    const y = st.year + 20, m = markNear(plan.mult);
    const head = m ? m.def(y) + ' ' : '';
    const runOn = lastTurn ? ` This is the last pace you set: from ${y} the sheet runs on at it.` : '';
    return `${head}By ${y} Britain would burn ${sizeAgainst(plan.mult, 'what it burns now')}. The next twenty years would use ${squaresWords(plan.squares)} of coal. ${lastsSentence(plan.lastsUntil)}${runOn}`;
  }
  function paceVerb(m) {
    const k = markNear(m);
    if (k && k.key === 'cut') return 'cut it back hard';
    if (k && k.key === 'stand') return 'held it level';
    if (k && k.key === 'slower') return 'let it grow slowly';
    if (k && k.key === 'now') return 'let it double';
    if (k && k.key === 'faster') return 'pushed it faster than ever';
    if (m >= 2.15) return 'pushed it faster than ever';
    if (m >= 1.75) return 'let it nearly double';
    if (m >= 1.15) return 'let it grow slowly';
    if (m > 0.9) return 'held it about level';
    return 'cut it back';
  }

  // ---- the engine news (an announcement, not a choice) -------------------------------------------------------
  function engineCard(news) {
    const first = news.key === 'air';
    const title = first ? 'A NEW ENGINE' : 'THE AIR-ENGINE PERFECTED';
    const what = first
      ? `Inventors have an air-engine. It does the same work on half the coal: to do one horse's work for an hour, Britain's engines burn ${lb(news.lbBritain)} of coal, and the air-engine burns ${lb(news.lbNew)}.`
      : `The air-engine has been perfected. To do one horse's work for an hour, Britain's engines now burn ${lb(news.lbBritain)} of coal, and the new one burns ${lb(news.lbNew)}.`;
    const cost = `But it costs more to build. It pays only where coal is dear: today, where a ton costs about ${R(news.paysNow)} times what it did in 1865. Britain's coal costs ${priceWords(news.priceBritain).replace('no dearer than in 1865', 'the same as in 1865')}. America's coal is cheap, and stays cheap.`;
    const when = `The engine gets cheaper to build every year. By about ${news.americaFitsIn} it will pay even at the 1865 price, and America will fit it then. Britain's works will fit it as soon as it pays for them: sooner, if Britain's coal is dearer.`;
    return { title, what, cost, when, lumpsBritain: news.lbBritain, lumpsNew: news.lbNew, button: 'Noted. Set the fire' };
  }

  // ---- Jevons's sentences (only from the preface, ch. I, ch. VII and ch. XVIII) ------------------------------
  const Q = {
    paradox: ['It is wholly a confusion of ideas to suppose that the economical use of fuel is equivalent to a diminished consumption. The very contrary is the truth.', 'ch. VII'],
    saved: ['No one must suppose that coal thus saved is spared—it is only saved from one use to be employed in others.', 'ch. VII'],
    capital: ['The question is one of capital against current expenditure.', 'preface'],
    wasteful: ['The fact is, that a wasteful engine pays better where coals are cheap than a more perfect but costly engine.', 'preface'],
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
    successors: ['Even if our successors be less happily placed than ourselves they will not then blame us.', 'preface'],
    spendthrifts: ['To disperse so lavishly the cream of our mineral wealth is to be spendthrifts of our capital—to part with that which will never come back.', 'ch. XVIII'],
  };
  function pick(used, keys) {
    for (const k of keys) if (k && !used.has(k)) { used.add(k); return { key: k, text: Q[k][0], where: Q[k][1] }; }
    return null;
  }

  // ---- after a generation ----------------------------------------------------------------------------------
  function result(rec, st, used, squaresLeft, squaresAll) {
    const pm = rec.planMult, am = rec.mult;
    const lines = [];
    const cmp = am > pm * 1.08 ? 'That is higher than your dotted line.' : am < pm * 0.92 ? 'That is short of your dotted line.' : 'That is what you set.';
    const lead = `You set the fire for ${rec.to} at ${sizeAgainst(pm, 'that of ' + rec.from)}. The fire ${fireChange(am)}. ${cmp}`;
    // engines fitted this generation
    const fitted = rec.engines.filter(e => e.who === 'britain'), fittedA = rec.engines.filter(e => e.who === 'america');
    for (const e of fitted) {
      const a = fittedA.find(x => x.key === e.key), aPrev = st.engines[e.key] && st.engines[e.key].america;
      const whyNow = rec.years.find(y => y.year === e.year + 1) && rec.years.find(y => y.year === e.year + 1).price >= 1.08
        ? 'coal was dear enough' : 'the engine was cheap enough';
      let s = `In ${e.year} ${whyNow} that ${engineName(e.key)} paid, and Britain's works fitted it. Each ton now does ${does(st.lbB)}.`;
      if (a) s += a.year === e.year ? ' America fitted it the same year.' : a.year < e.year ? ` America had fitted it in ${a.year}.` : ` America fitted it in ${a.year}.`;
      else if (aPrev && aPrev < rec.from) s += ` America had fitted it in ${aPrev}.`;
      else s += ' America has not fitted it yet: its coal is too cheap for the engine to pay there.';
      lines.push(s);
    }
    for (const a of fittedA) if (!fitted.find(x => x.key === a.key)) {
      const b = st.engines[a.key] && st.engines[a.key].britain;
      lines.push(`In ${a.year} America fitted ${engineName(a.key)}.${b && b < rec.from ? ` Britain had fitted it in ${b}.` : ''}`);
    }
    if (rec.fittedBritain && am > pm * 1.03)
      lines.push('Why higher? Each ton of coal did more work, so power was cheap. Cheap power paid for new works: ploughs, pumps, mills, ships. They burnt more coal, not less.');
    if (am < pm * 0.92 && rec.relCost >= 1.08)
      lines.push(`Why short? Power costs more in Britain than in America: coal from ${depthWords(rec.depth)} is ${priceWords(rec.price)}. Works moved to America.`);
    lines.push(`${cap(squaresWords(rec.squares))} of coal came out of the ground; ${pitsWords(rec.depth)}. ${R(squaresLeft)} of the ${squaresAll} squares are left.`);
    // the ledger line
    lines.push(`Fuel took ${daysWords(rec.days)} of a year's earnings. Income per head was ${sizeAgainst(rec.perHead, 'in 1865')}; Britain's whole income ${sizeAgainst(rec.income, '1865’s')}.`);
    lines.push(rec.americaPassedNow ? 'America now burns more coal than Britain.' : americaWords(rec.americaRatio) + '.');
    const pw = peopleWords(rec.gone);
    lines.push(pw ? `The people grew faster than the work. ${cap(pw)} went over the sea to find it.` : 'There was work for everyone. Nobody had to go over the sea.');
    const keys = [];
    if (fitted.length && am > pm * 1.03) keys.push(used.has('paradox') ? 'saved' : 'paradox');
    if (fitted.length) keys.push(used.has('capital') ? 'wasteful' : 'capital');
    if (rec.americaPassedNow) keys.push('passing');
    if (rec.gone >= 1 && pm < 1.3) keys.push(used.has('boulder') ? 'exodus' : 'boulder');
    if (am < pm * 0.9 && rec.relCost >= 1.08) keys.push(used.has('cheapest') ? 'dear' : 'cheapest');
    if (pm < 0.8) keys.push('mar');
    if (pm >= 2.2) keys.push('push');
    if (pm >= 1.8 && am >= 1.7) keys.push('greater');
    if (pm < 1.1 && pm > 0.9) keys.push('stationary');
    if (rec.gone >= 1) keys.push('exodus');
    if (am > 1.4) keys.push('cannot');
    return { lead, lines, quote: pick(used, keys) };
  }

  function evening(st, used) {
    const last = st.history[st.history.length - 1];
    const text = `The pits are deep: coal from ${depthWords(MECH.depthOf(st.S))} is ${priceWords(MECH.priceOf(st.S))}, and fuel takes ${daysWords(last.days)} of a year's earnings. America's coal is cheap, and the works are moving there. Whatever pace you set now, the fire will fall. The sheet draws itself to 2065 at the last pace you set.`;
    return { text, quote: pick(used, ['impossible', 'spring']) };
  }
  function runOn(st) {
    return `You have set six generations. From ${st.year} the sheet runs on to 2065 at the last pace you set.`;
  }

  // ---- the ledger ---------------------------------------------------------------------------------------------
  const LEDGER_HEADING = 'WHAT EACH GENERATION GOT: INCOME PER HEAD, AGAINST 1865';
  const LEDGER_CAPTION = 'the big figure is income per head; the small one, the whole income; both against 1865';
  const FUTURE_FLAG = 'from 1985: supposing, as Jevons did, that no substitute for coal is found';

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
    s = s.replace(/^You let it/, 'You let the fire').replace(/^You held it/, 'You held the fire').replace(/^You cut it/, 'You cut the fire').replace(/^You pushed it/, 'You pushed the fire');
    return s + '.';
  }
  function span(g) { return `${g.from}–${g.to}`; }
  function verdict(v, st, used) {
    const heading = v.kind === 'greatness' ? 'A BRIEF GREATNESS' : v.kind === 'mediocrity' ? 'A LONGER CONTINUED MEDIOCRITY' : 'BETWEEN THE TWO';
    const C0 = MECH.CONFIG.START_YEAR;
    let high;
    if (v.noonYear === C0) high = 'How high: no higher than 1865. The fire never grew.';
    else high = `How high: ${sizeAgainst(v.noonMult, 'the fire of 1865')}, at its noon in ${v.noonYear}.`;
    const left = R(v.squaresAll - v.squaresBurnt);
    let long;
    const until = v.untilYear > 2900 ? 'for many centuries' : `until about ${roundTo(v.untilYear, 10)}`;
    if (v.noonYear === C0 || v.outYear === C0) {
      long = `How long: in ${v.endYear} Britain still burns ${sizeAgainst(v.endMult, 'what it burnt in 1865')}, and ${left} of the ${v.squaresAll} squares are still in the ground. At that pace the coal lasts ${until}.`;
    } else if (v.outYear) {
      long = `How long: until about ${roundTo(v.outYear, 10)}. After that the fire burnt less than in 1865. By ${v.endYear} ${left === 0 ? 'the ground was empty' : `only ${left} of the ${v.squaresAll} squares ${left === 1 ? 'was' : 'were'} left`}.`;
    } else {
      long = `How long: still burning in ${v.endYear}, at ${sizeAgainst(v.endMult, 'the fire of 1865')}, with ${left} of the ${v.squaresAll} squares still in the ground. At that pace the coal lasts ${until}.`;
    }
    // the generations
    const b = v.bestGen, w = v.worstGen, l = v.lastGen;
    let gens = `Who got the coal: the best-off generation was ${span(b)}, with income per head ${sizeAgainst(b.perHead, '1865’s')}`;
    if (w.from === l.from) gens += `; the worst-off was the last on the sheet, ${span(w)}, with ${sizeAgainst(w.perHead, '1865’s')}, and fuel took ${daysWords(l.days)} of its year's earnings.`;
    else {
      gens += w.from === b.from ? '.' : `; the worst-off was ${span(w)}, with ${sizeAgainst(w.perHead, '1865’s')}.`;
      gens += ` The last generation on the sheet, ${span(l)}, had ${sizeAgainst(l.perHead, '1865’s')} per head, and fuel took ${daysWords(l.days)} of its year's earnings.`;
    }
    gens += left > 0 ? ` ${left} square${left === 1 ? '' : 's'} of coal ${left === 1 ? 'is' : 'are'} left for the generations after 2065.` : ' Nothing is left for the generations after 2065.';
    const lines = [high, long, whatYouDid(st)];
    let after = '';
    if (v.evening) {
      const atEve = st.history.find(h => h.year === v.eveningYear);
      after = `By ${v.eveningYear} the pits were at about ${depthWords(MECH.depthOf(atEve.S))} and coal ${priceWords(MECH.priceOf(atEve.S))}. The works went where coal was cheap, and the fire fell whatever pace was set.`;
    }
    const am = v.americaPassed ? `America passed Britain in ${v.americaPassed}.` : 'America never passed Britain.';
    const pw = peopleWords(v.gone);
    let ppl;
    if (!pw || v.gone < 0.5) ppl = 'Hardly anyone had to go over the sea.';
    else {
      const before = v.goneBeforeNoon / v.gone;
      const when = v.noonYear === C0 ? 'steadily, generation after generation'
        : before < 0.2 ? 'nearly all of them after the noon' : before > 0.8 ? 'nearly all of them before the noon' : 'some before the noon and some after';
      ppl = `${cap(pw)} went over the sea for want of work, ${when}.`;
    }
    lines.push((after ? after + ' ' : '') + am + ' ' + ppl);
    lines.push(gens);
    const qs = [];
    const k = v.kind === 'greatness' ? 'instincts' : v.kind === 'mediocrity' ? 'littleness' : 'wise';
    qs.push({ text: Q[k][0], where: Q[k][1] });
    qs.push({ text: Q.choice[0], where: Q.choice[1], big: true });
    qs.push({ text: Q.noon[0], where: Q.noon[1] });
    return { heading, lines, quotes: qs };
  }

  return { fireChange, sizeAgainst, mult, priceWords, daysWords, americaWords, peopleWords, depthWords, pitsWords, squaresWords,
    lastsWords, lastsShort, lastsSentence, MARKS, markNear, planReading, engineCard, engineName, result, evening, runOn,
    LEDGER_HEADING, LEDGER_CAPTION, FUTURE_FLAG, verdict, whatYouDid, Q };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = WORDS;
