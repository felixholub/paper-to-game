// Foot's Bad Man — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build if
// the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY. A formalisation of the argument of Philippa Foot, "The Problem of Abortion and the Doctrine of the Double
// Effect", Oxford Review 5 (1967): 5–15, reprinted in Virtues and Vices (1978/2002). Page tags "p. N" refer to the six
// pages of the reprint PDF (PhilPapers FOOTPO-2). There is no data and no fitted number: the paper hands over paired cases,
// two rival principles, and the verdicts "we" give. Each case is described by the features Foot's argument uses; each
// principle is a function from those features to a choice; the audience's verdict on each choice is the paper's own
// sentence, tagged. Everything tagged "ours" is the toy's, not the paper's.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.FOOT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CONFIG = {
    FIVE: 5,              // p. 2: "the exchange is supposed to be one man's life for the lives of five" (tram, judge, drug,
                          // torture). Ours: held at five for every scheme, as Foot holds the numbers fixed within her pairs.
    SCHEMES_PER_TARGET: 3,// ours: three tries per good person (play it in numbers, memo §18)
    TARGET_ORDER: ['most', 'double', 'foot'],   // ours: the paper's order of argument (counting → DDE → Foot), pp. 2–5
    SCHEME_ORDER: ['tram', 'bargain', 'medicine', 'brew', 'beggar', 'cave'], // ours: the cards as dealt, the famous one first
    // Variants for the robustness check (calibration.js), not used in play:
    DDE_CAVE_AIMED: true, // p. 1: DDE's defenders "would rightly reject" calling the stuck man's death a side effect of blasting
    FOOT_AIMED_ALLOWING_IS_HARM: true, // p. 4: letting the beggar die for research: "presumably we are inclined to see this
                                       // as a violation of negative rather than positive duty"
    FOOT_DOOMED_NO_CONFLICT: true,     // p. 5: the cave: "no serious conflict of interests here, since the fat man will
                                       // perish in either case"
  };

  // ---- the six schemes. Option A: the one dies and the five live. Option B: the five die (in the cave, all six).
  // Features of option A, as Foot's argument reads them:
  //   aimed   — the one's death is aimed at, as an end or a means (direct intention), or only foreseen (oblique)  (pp. 1–2)
  //   harm    — option A injures the one ('injure') or withholds aid from him ('withhold')                    (pp. 3–4)
  //   against — what option B does to the five: the agent's own injury of them ('injure') or a failure to aid ('aid')
  //   doomed  — the one dies under option B too                                                                (p. 5)
  const SCHEMES = {
    tram: {     // p. 2: "the driver of a runaway tram which he can only steer from one narrow track on to another; five men
                // are working on one track and one man on the other". Ours: the bad man cut the brakes.
      aimed: false, harm: 'injure', against: 'injure', doomed: false, paper: 'the runaway tram (p. 2)',
    },
    bargain: {  // p. 3: "some tyrant should threaten to torture five men if we ourselves would not torture one"; "a mad
                // murderer, known to keep his promises, could thus make it our duty to kill some innocent citizen to prevent
                // him from killing two". Stands in for the judge and the mob (p. 2) and the serum (p. 3) too.
      aimed: true, harm: 'injure', against: 'aid', doomed: false, paper: 'the tyrant and the mad murderer (p. 3); the judge (p. 2)',
    },
    medicine: { // p. 3: "a patient who needs it to save his life a massive dose of a certain drug in short supply. There
                // arrive, however, five other patients each of whom could be saved by one-fifth of that dose". Ours: the
                // bad man poisoned all six.
      aimed: false, harm: 'withhold', against: 'aid', doomed: false, paper: 'the scarce drug (p. 3)',
    },
    brew: {     // pp. 4–5: "five patients in a hospital whose lives could be saved by the manufacture of a certain gas, but
                // this inevitably releases lethal fumes into the room of another patient whom for some reason we are unable
                // to move. His death, being of no use to us, is clearly a side effect, and not directly intended."
      aimed: false, harm: 'injure', against: 'aid', doomed: false, paper: 'the gas (pp. 4–5)',
    },
    beggar: {   // p. 4: "instead of killing someone we deliberately let him die. (Perhaps he is a beggar to whom we are
                // thinking of giving food, but then we say 'No, they need bodies for medical research.')"
      aimed: true, harm: 'withhold', against: 'aid', doomed: false, paper: 'the beggar let die for research (p. 4)',
    },
    cave: {     // pp. 1–2, 5: the potholers, the fat man stuck in the mouth of the cave, floodwaters rising, dynamite; "in one
                // version the fat man, whose head is in the cave, will drown with them". Ours: the target is outside with
                // the dynamite; five are trapped behind him.
      aimed: true, harm: 'injure', against: 'aid', doomed: true, paper: 'the man stuck in the mouth of the cave (pp. 1, 5)',
    },
  };

  // ---- deaths under each option (ours: one against five throughout; the cave's B drowns the stuck man too)
  function deaths(id, opt) {
    const s = SCHEMES[id];
    if (opt === 'A') return { one: true, five: false };
    return { one: !!s.doomed, five: true };
  }
  function count(id, opt) { const d = deaths(id, opt); return (d.one ? 1 : 0) + (d.five ? CONFIG.FIVE : 0); }

  // ---- the three rules. Each takes a scheme's features and returns 'A' or 'B'.
  const RULES = {
    // "the size of the evil must always be our guide" (p. 5): the view both DDE and Foot are offered as rescue from.
    most(s, id) { return count(id, 'A') <= count(id, 'B') ? 'A' : 'B'; },
    // DDE (pp. 1–2): "it is sometimes permissible to bring about by oblique intention what one may not directly intend".
    // Forbidden if the death is directly intended (end or means); otherwise permitted when the good outweighs it.
    double(s, id, cfg) {
      const c = cfg || CONFIG;
      const aimed = id === 'cave' ? (s.aimed && c.DDE_CAVE_AIMED) : s.aimed;
      if (aimed) return 'B';
      return count(id, 'A') < count(id, 'B') ? 'A' : 'B';
    },
    // Foot (pp. 4–5): negative duties (not to injure) are stricter than positive duties (to aid). Negative against
    // negative: the least injury. Positive against positive: aid the more. Negative against positive: one may not inflict
    // injury to bring aid. Deliberately letting die, aiming at the death, counts as negative (the beggar).
    foot(s, id, cfg) {
      const c = cfg || CONFIG;
      if (s.doomed && c.FOOT_DOOMED_NO_CONFLICT) return 'A';
      const toOne = (s.harm === 'injure' || (s.aimed && c.FOOT_AIMED_ALLOWING_IS_HARM)) ? 'negative' : 'positive';
      const toFive = s.against === 'injure' ? 'negative' : 'positive';
      if (toOne === toFive) return count(id, 'A') <= count(id, 'B') ? 'A' : 'B';
      return toOne === 'negative' ? 'B' : 'A';
    },
  };

  // ---- the audience: the paper's "we" / "most of us", judging the act (scheme, option). 'cheer' = the good person did
  // right; 'blameless' = they refused and the deaths are the bad man's; 'disgrace' = most of us cannot forgive it.
  const AUDIENCE = {
    tram:     { A: 'cheer',     // p. 2: "we should say, without hesitation, that the driver should steer for the less occupied track"
                B: 'disgrace' },// ours, from the same line; no rule in the game chooses it
    bargain:  { A: 'disgrace',  // p. 2: "most of us would be appalled at the idea that the innocent man could be framed"; p. 4:
                                // "it does not follow … that we would be justified in inflicting the injury … in order to save the five"
                B: 'blameless' },// p. 3: "it is he who intends (that is strictly or directly intends) the death of innocent persons; we do not"
    medicine: { A: 'cheer',     // p. 3: "We feel bound to let one man die rather than many if that is our only choice"
                B: 'disputed' },// Anscombe (1967): giving the whole dose to the one wrongs no one; Foot: we feel bound to save the five. No rule chooses it.
    brew:     { A: 'disgrace',  // p. 5: "Yet it surely is different. The relatives of the gassed patient would presumably be
                                // successful if they sued the hospital and the whole story came out."
                B: 'blameless' },// ours, from p. 4: "To refrain from inflicting injury ourselves is a stricter duty than to prevent other people from inflicting injury"
    beggar:   { A: 'disgrace',  // p. 4: "presumably we are inclined to see this as a violation of negative rather than positive
                                // duty"; p. 5: "We may find it particularly revolting that someone should be used as in the case where
                                // he is killed or allowed to die in the interest of medical research"
                B: 'blameless' },// ours, as for the brew
    cave:     { A: 'cheer',     // p. 5: "it is reasonable that the action that will save someone should be done"
                B: 'disgrace' },// p. 5: "It is a great objection to those who argue that the direct intention of the death of an
                                // innocent person is never justifiable that the edict will apply even in this case … [it] must
                                // here conflict with that of most reasonable men"
  };

  function choose(rule, id, cfg) { return RULES[rule](SCHEMES[id], id, cfg); }
  function judge(id, opt) { return AUDIENCE[id][opt]; }
  function holes(rule, cfg) { return CONFIG.SCHEME_ORDER.filter(id => judge(id, choose(rule, id, cfg)) === 'disgrace'); }

  // ---- words. Every line the game says about a scheme or a rule. Pronouns per target.
  const PEOPLE = {
    most:   { name: 'Mr Most', he: 'he', his: 'his', him: 'him', He: 'He', His: 'His',
              rule: ['Always save the most lives.', 'Nothing else counts.'] },
    double: { name: 'Doctor Double', he: 'he', his: 'his', him: 'him', He: 'He', His: 'His',
              rule: ['Never aim at an innocent death, as your goal or as your means.', 'A death you only foresee may be allowed, if the good is great enough.'] },
    foot:   { name: 'Mrs Foot', he: 'she', his: 'her', him: 'her', He: 'She', His: 'Her',
              rule: ['Never harm one person to help others.', 'If every way harms someone, harm the fewest.', 'If you can only help some, help the most.'] },
  };

  const SCHEME_WORDS = {
    tram: {
      title: 'The tram', bad: 'I have cut the brakes on your tram. Five men work on the line ahead. One works on the branch.',
      A: 'steer onto the branch: the one dies', B: 'stay on the line: the five die',
      didA: '{He} steered. The one on the branch died; the five lived.', didB: '{He} stayed on the line. The five died.',
    },
    bargain: {
      title: 'The bargain', bad: 'Kill this man with your own hands, or I kill these five.',
      A: 'kill the one: the five go free', B: 'refuse: you kill the five',
      didA: '{He} killed the one. You let the five go.', didB: '{He} refused. You kept your word: the five died.',
    },
    medicine: {
      title: 'The medicine', bad: 'I have poisoned six. My antidote saves the one who drank most, if he gets all of it, or the other five, if they share it.',
      A: 'share it among the five: the one dies', B: 'give it all to the one: the five die',
      didA: '{He} shared it among the five. They lived; the one died.', didB: '{He} gave it all to the one. The five died.',
    },
    brew: {
      title: 'The brew', bad: 'I have poisoned five. You can brew their cure, but the fumes will fill the next room, and the sick man in there cannot be moved.',
      A: 'brew: the five live, the fumes kill the one', B: 'refuse: your poison kills the five',
      didA: '{He} brewed. The five lived; the fumes killed the man next door.', didB: '{He} refused. Your poison killed the five.',
    },
    beggar: {
      title: 'The beggar', bad: 'I have poisoned five. Only a serum made from a dead body can cure them. The starving beggar at your door will be dead by morning, unless you feed him.',
      A: 'shut the door: he dies, his body cures the five', B: 'feed him: your poison kills the five',
      didA: '{He} shut the door. The beggar starved, and his body cured the five.', didB: '{He} fed the beggar. Your poison killed the five.',
    },
    cave: {
      title: 'The cave', bad: 'I have flooded my cave. Five are trapped behind a man stuck fast in the way out. His head is inside: the water will drown him with them. Here is dynamite.',
      A: 'blast him out: he dies, the five get out', B: 'refuse: the water drowns all six',
      didA: '{He} blasted the stuck man out. He died; the five got out.', didB: '{He} refused. The water drowned all six.',
    },
  };

  // why, by the rule (the game's voice), and the target's own line (colour), per rule and scheme
  const WHY = {
    most: {
      tram: ['{His} rule counts lives and nothing else: five is more than one.', 'Simple arithmetic.'],
      bargain: ['{His} rule counts lives and nothing else: five is more than one.', 'Five is more than one.'],
      medicine: ['{His} rule counts lives and nothing else: five is more than one.', 'Simple arithmetic.'],
      brew: ['{His} rule counts lives and nothing else: five is more than one.', 'Five is more than one.'],
      beggar: ['{His} rule counts lives and nothing else: five is more than one.', 'Five is more than one, I am afraid.'],
      cave: ['{His} rule counts lives and nothing else: five live this way, none the other.', 'He was lost anyway.'],
    },
    double: {
      tram: ['{His} rule allowed it: the death was only a side effect of steering, and five outweigh one.', 'I never wanted him dead.'],
      bargain: ['{His} rule forbade it: the one\'s death would have been {his} means.', 'I will not make his death my means.'],
      medicine: ['{His} rule allowed it: the one\'s death was only foreseen, and five outweigh one.', 'I never wanted him dead.'],
      brew: ['{His} rule allowed it: the death was only a side effect of the brewing, and five outweigh one.', 'I never wanted him dead.'],
      beggar: ['{His} rule forbade it: letting the beggar die so that his body can be used is aiming at his death.', 'I will not want a man dead.'],
      cave: ['{His} rule forbade it: blasting the stuck man is aiming at his death, though the water would have killed him anyway.', 'I may not aim at an innocent death. Ever.'],
    },
    foot: {
      tram: ['{His} rule: either way {his} tram harms someone, so it should harm the fewest.', 'Then the fewest.'],
      bargain: ['{His} rule forbade it: that would be harming one person to help others.', 'Not to help them. Not like that.'],
      medicine: ['{His} rule: {he} can only help some of them, so {he} helps the most.', 'Then the most.'],
      brew: ['{His} rule forbade it: the fumes would be harm {he} did, to help others.', 'The fumes would be my doing.'],
      beggar: ['{His} rule forbade it: letting a man die so that his body can be used is aiming at his death, and that counts as harm.', 'Not so that his body can be used.'],
      cave: ['{His} rule allowed it: he was lost either way, so blasting him took nothing the water was not taking.', 'He was lost either way.'],
    },
  };

  // the audience's reaction, in the game's voice (judging the act, whoever did it)
  const AUDIENCE_WORDS = {
    tram: { A: 'The audience cheers: steering into one rather than five, most of us call right.', B: 'The audience turns on {him}: {he} could have steered.' },
    bargain: { A: 'The audience turns on {him}: {he} killed an innocent man because a bad man asked.', B: 'The audience hisses you: the five were yours to kill, and you killed them.' },
    medicine: { A: 'The audience cheers: with medicine for one or for five, most of us say save the five.', B: 'The audience is divided.' },
    brew: { A: 'The audience turns on {him}: {he} gassed a sick man to cure others.', B: 'The audience hisses you: the poison was yours.' },
    beggar: { A: 'The audience turns on {him}: {he} let a man starve so that his body could be used.', B: 'The audience hisses you: the poison was yours.' },
    cave: { A: 'The audience cheers: the stuck man was lost either way, and five got out.', B: 'The audience turns on {him}: six drowned, the stuck man too, to keep {his} rule.' },
  };

  function fill(t, p) { return t.replace(/\{(he|his|him|He|His)\}/g, (m, k) => p[k]); }

  // ---- the game
  function newGame() {
    return { t: 0, tries: [[], [], []], status: ['open', 'open', 'open'], log: [], over: false };
  }
  function targetId(g) { return CONFIG.TARGET_ORDER[g.t]; }
  function current(g) {
    if (g.over) return null;
    const id = targetId(g), p = PEOPLE[id];
    return {
      reel: g.t + 1, id, name: p.name, rule: p.rule.slice(), pron: p,
      left: CONFIG.SCHEMES_PER_TARGET - g.tries[g.t].length, tried: g.tries[g.t].slice(),
      status: g.status.slice(), ended: g.status[g.t] !== 'open',
    };
  }
  // what the scheme looks like before it is sprung: the situation and the two choices; nothing about the outcome
  function preview(g, sid) {
    const p = PEOPLE[targetId(g)], w = SCHEME_WORDS[sid];
    return { id: sid, title: w.title, bad: w.bad, A: w.A, B: w.B, ask: `${p.His} choice: ${w.A}; or ${w.B}.` };
  }
  function spring(g, sid) {
    if (g.over) throw new Error('game over');
    if (g.status[g.t] !== 'open') throw new Error('target done');
    if (g.tries[g.t].includes(sid)) throw new Error('scheme already tried on this target');
    if (!SCHEMES[sid]) throw new Error('no such scheme');
    const rid = targetId(g), p = PEOPLE[rid];
    const opt = choose(rid, sid), verdict = judge(sid, opt), d = deaths(sid, opt);
    g.tries[g.t].push(sid);
    const disgraced = verdict === 'disgrace';
    if (disgraced) g.status[g.t] = 'disgraced';
    else if (g.tries[g.t].length >= CONFIG.SCHEMES_PER_TARGET) g.status[g.t] = 'clean';
    const w = SCHEME_WORDS[sid], why = WHY[rid][sid];
    const left = CONFIG.SCHEMES_PER_TARGET - g.tries[g.t].length;
    const r = {
      reel: g.t + 1, target: rid, name: p.name, scheme: sid, option: opt, verdict, disgraced, deaths: d,
      did: fill(opt === 'A' ? w.didA : w.didB, p), why: fill(why[0], p), says: why[1],
      audience: fill(AUDIENCE_WORDS[sid][opt], p), status: g.status[g.t], left,
    };
    r.stand = disgraced ? `${p.name} is disgraced.`
      : g.status[g.t] === 'clean' ? `${p.name} is still clean, and you have no schemes left for ${p.him}.`
      : `Not a disgrace. ${p.name} is still clean. ${cap(numw(left))} scheme${left === 1 ? '' : 's'} left for ${p.him}.`;
    if (g.status[g.t] === 'clean' && rid === 'foot') r.stand = `No scheme you sprang disgraced ${p.him}, and none in the paper would have. That is Foot's argument.`;
    g.log.push(r);
    return r;
  }
  function next(g) {
    if (g.status[g.t] === 'open') throw new Error('target still open');
    if (g.t < 2) g.t++; else g.over = true;
    return current(g);
  }
  function numw(n) { return ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][n] || String(n); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---- the map of holes: every rule against every scheme
  function map() {
    return CONFIG.TARGET_ORDER.map(rid => ({
      rule: rid, name: PEOPLE[rid].name,
      cells: CONFIG.SCHEME_ORDER.map(sid => { const opt = choose(rid, sid); return { scheme: sid, option: opt, verdict: judge(sid, opt) }; }),
    }));
  }

  // ---- the verdict, in words
  function verdict(g) {
    const by = rid => g.log.filter(r => r.target === rid);
    const caught = rid => by(rid).find(r => r.disgraced);
    const list = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
    const sn = sid => 'the ' + SCHEME_WORDS[sid].title.replace(/^The /, '').toLowerCase();
    const parts = [];
    const hit = CONFIG.TARGET_ORDER.filter(rid => caught(rid));
    if (hit.length) parts.push('You disgraced ' + list(hit.map(rid => `${PEOPLE[rid].name} with ${sn(caught(rid).scheme)}`)) + '.');
    const dd = caught('double');
    if (dd && dd.scheme === 'cave') parts.push('Doctor Double fell by refusing: blasting the stuck man was aiming at his death, so all six drowned.');
    const free = CONFIG.TARGET_ORDER.filter(rid => !caught(rid));
    free.forEach(rid => {
      const p = PEOPLE[rid];
      if (rid === 'foot') parts.push(hit.length ? `${p.name} you could not touch.` : `${p.name} you could not touch either.`);
      else if (rid === 'most') parts.push(`${p.name} held: you tried ${list(by(rid).map(r => sn(r.scheme)))}. ${list(holes(rid).map(sn))} would have caught ${p.him}.`.replace(/\. the /, '. The '));
      else parts.push(`${p.name} held: you tried ${list(by(rid).map(r => sn(r.scheme)))}.`);
    });
    const brewDouble = by('double').some(r => r.scheme === 'brew');
    const paper = 'Philippa Foot, 1967: the doctrine Doctor Double lives by forbids aiming at an innocent death but lets one through as a side effect. Her own case, the gas (the brew in this film), shows that we find a side effect just as wrong when it is harm done to help others. What matters is not what you aim at, but whether you harm one person to help others.';
    const missed = brewDouble ? '' : 'You never sprang the brew on Doctor Double. He would have brewed, and the audience would have turned on him.';
    const means = 'A rule that only counts lives puts good people in a bad man\'s power. A rule about what you mean is half a shield. Foot\'s rule gave you nothing.';
    const n = hit.length;
    const fate = n === 2 ? 'Two good names ruined. The third you could not touch.'
      : n === 1 ? 'One good name ruined. Two you could not touch.'
      : n === 3 ? 'Three good names ruined.' : 'Not one good name ruined.';
    return { did: parts, paper, missed, means, fate, hits: n, trolley: 'The tram, now the most famous puzzle in ethics, is the easy case in the paper that invented it: every rule steers, and the audience cheers.' };
  }

  return { CONFIG, SCHEMES, RULES, AUDIENCE, PEOPLE, SCHEME_WORDS, WHY, AUDIENCE_WORDS, deaths, count, choose, judge, holes, newGame, current, preview, spring, next, map, verdict, numw, fill };
});
