// Foot's Bad Man — the mechanism (the staircase build, November 2026). The only copy: build.py inlines this file verbatim
// into the HTML and refuses to build if the embedded copy differs. Plain functions, no DOM; runs in Node and the browser.
//
// Kind: TOY. A formalisation of the argument of Philippa Foot, "The Problem of Abortion and the Doctrine of the Double
// Effect", Oxford Review 5 (1967): 5–15, reprinted in Virtues and Vices (1978/2002). Page tags "p. N" are the six pages of
// the reprint PDF (PhilPapers FOOTPO-2). No data, no fitted number. The paper hands over cases, two rival principles, and
// the verdicts "we" give. The game: the bad man asks the player to do seven things, each a worse deed than the last, the
// numbers nearly fixed; the player decides each; after each the house (the paper's "we") reads the case as Foot reads it.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.FOOT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CONFIG = {
    ORDER: ['tram', 'medicine', 'brew', 'beggar', 'bargain', 'torture', 'cave'], // ours: the staircase, by the deed
    // Readings of the paper the rules depend on (switched off in calibration.js to see what changes):
    DDE_CAVE_AIMED: true,              // p. 1–2: the doctrine's defenders "would rightly reject" calling the stuck man's death a side effect
    FOOT_AIMED_ALLOWING_IS_HARM: true, // p. 4: letting the beggar die for research, "presumably … a violation of negative rather than positive duty"
    FOOT_DOOMED_NO_CONFLICT: true,     // p. 5: the cave, "no serious conflict of interests here, since the fat man will perish in either case"
  };

  // ---- the seven cases. Option A: do what the bad man asks (the one suffers, the many are saved). Option B: refuse.
  // Features of A, as Foot's argument reads them:
  //   aimed   — the one's harm is aimed at, as end or means (direct intention), or only foreseen (oblique)       (pp. 1–2)
  //   harm    — A injures the one ('injure') or withholds aid from him ('withhold')                                (pp. 3–4)
  //   against — what B costs the many: the agent's own injury of them ('injure') or a failure to aid them ('aid')
  //   doomed  — the one suffers under B too                                                                         (p. 5)
  //   many    — how many the bad man sets against the one (the paper's own number where it gives one)
  //   deed    — what the bad man asks for, in two or three words (the staircase)
  const CASES = {
    tram: {     // p. 2: the runaway tram; "five men are working on one track and one man on the other". Ours: he cut the brakes.
      aimed: false, harm: 'injure', against: 'injure', doomed: false, many: 5, deed: 'Turn a wheel', kills: true,
      paper: 'the runaway tram (p. 2)',
    },
    medicine: { // p. 3: the scarce drug; "five other patients each of whom could be saved by one-fifth of that dose". Ours: he poisoned all six.
      aimed: false, harm: 'withhold', against: 'aid', doomed: false, many: 5, deed: 'Keep a bottle', kills: true,
      paper: 'the scarce drug (p. 3)',
    },
    brew: {     // pp. 4–5: the gas; "five patients … the manufacture of a certain gas … lethal fumes into the room of another patient"
      aimed: false, harm: 'injure', against: 'aid', doomed: false, many: 5, deed: 'Brew a cure', kills: true,
      paper: 'the gas (pp. 4–5)',
    },
    beggar: {   // p. 4: "instead of killing someone we deliberately let him die. (Perhaps he is a beggar …)"; p. 3: the serum saves "several"
      aimed: true, harm: 'withhold', against: 'aid', doomed: false, many: 5, deed: 'Shut a door', kills: true,
      paper: 'the beggar let die for research (p. 4); the serum (p. 3)',
    },
    bargain: {  // p. 2: the judge and the mob, five hostages; "some private individual is to kill an innocent person" — the judge without the court
      aimed: true, harm: 'injure', against: 'aid', doomed: false, many: 5, deed: 'Pull a trigger', kills: true,
      paper: 'the judge and the rioters (p. 2)',
    },
    torture: {  // p. 3: "some tyrant should threaten to torture five men if we ourselves would not torture one"; the mad murderer and "two"
      aimed: true, harm: 'injure', against: 'aid', doomed: false, many: 2, deed: 'Take up the irons', kills: false,
      paper: 'the tyrant\'s torture, and the mad murderer\'s two (p. 3)',
    },
    cave: {     // pp. 1–2, 5: the fat man stuck in the mouth of the cave, "will drown with them"; dynamite. Ours: you hold it, outside.
      aimed: true, harm: 'injure', against: 'aid', doomed: true, many: 8, deed: 'Light the fuse', kills: true,
      paper: 'the man stuck in the mouth of the cave (pp. 1–2, 5)',
    },
  };

  // ---- the three rules. Each takes a case and returns 'A' (do it) or 'B' (refuse).
  const RULES = {
    // counting: "the size of the evil must always be our guide" (p. 5), the view both other rules are offered as rescue from
    most(c) { return c.many > 1 ? 'A' : 'A'; },
    // the famous rule (pp. 1–2): never aim at an innocent death, as goal or means; a death you only foresee may be allowed
    double(c, id, cfg) {
      const k = cfg || CONFIG;
      const aimed = id === 'cave' ? (c.aimed && k.DDE_CAVE_AIMED) : c.aimed;
      return aimed ? 'B' : 'A';
    },
    // Foot (pp. 4–5): not harming is the stricter duty. Harm against harm: the least harm. Help against help: help the most.
    // Harm against help: you may not harm one to help others. Letting die on purpose counts as harm (the beggar). No conflict
    // where the one is lost either way (the cave).
    foot(c, id, cfg) {
      const k = cfg || CONFIG;
      if (c.doomed && k.FOOT_DOOMED_NO_CONFLICT) return 'A';
      const toOne = (c.harm === 'injure' || (c.aimed && k.FOOT_AIMED_ALLOWING_IS_HARM)) ? 'harm' : 'help';
      const toMany = c.against === 'injure' ? 'harm' : 'help';
      if (toOne === toMany) return 'A';
      return toOne === 'harm' ? 'B' : 'A';
    },
  };
  function choose(rule, id, cfg) { return RULES[rule](CASES[id], id, cfg); }

  // the kind of conflict, Foot's way (what A does to the one, against what B costs the many)
  function conflict(id, cfg) {
    const c = CASES[id], k = cfg || CONFIG;
    if (c.doomed && k.FOOT_DOOMED_NO_CONFLICT) return 'none';
    const toOne = (c.harm === 'injure' || (c.aimed && k.FOOT_AIMED_ALLOWING_IS_HARM)) ? 'harm' : 'help';
    const toMany = c.against === 'injure' ? 'harm' : 'help';
    return toOne + '-' + toMany; // harm-harm | help-help | harm-help
  }

  // ---- the words. The house speaks ("we"); the bad man speaks for himself; Foot is quoted.
  const WORDS = {
    tram: {
      title: 'The tram', where: 'a tram shed',
      bad: 'I have cut the brakes on this tram. Five men work on the line ahead; one man works on the branch. You are at the wheel.',
      pitch: 'Five is more than one. Turn the wheel.',
      A: 'turn the wheel: the tram takes the branch, and the one man dies', B: 'leave the wheel: the tram runs on, and the five die',
      didA: 'You turned the wheel. The tram took the branch and killed the one man; the five lived.', didB: 'You left the wheel. The tram ran on and killed the five.',
      sides: ['Either way your tram kills somebody. On the branch, you kill one; on the line, you kill five.', 'That is harm against harm. Your tram does the killing whichever way it goes.'],
      rule: 'If every way harms someone, do the least harm.', footDoes: 'she turns the wheel',
      famous: 'The famous rule turns the wheel too: the one man\'s death is only foreseen, not aimed at.',
      us: 'Most of us turn the wheel. In her words: "we should say, without hesitation, that the driver should steer for the less occupied track". This is the paper the runaway tram comes from, and in it the tram is the easy case.',
      badA: 'See? Easy.', badB: 'Five, for a man you never even looked at. Interesting.',
    },
    medicine: {
      title: 'The medicine', where: 'a ward',
      bad: 'I have poisoned six people. Here is the only antidote. The man in the corner drank the most; he needs all of it. The other five need a fifth each. One bottle.',
      pitch: 'Five is more than one. Share it out.',
      A: 'share it among the five: the one man dies', B: 'give it all to the one man: the five die',
      didA: 'You shared the bottle among the five. They lived; the one man died.', didB: 'You gave the whole bottle to the one man. He lived; the five died.',
      sides: ['You do nothing to the one man. You just don\'t give him the bottle. And you don\'t give it to the five either, if you choose him.', 'That is help against help. Nobody is harmed by you; the question is only whom you help.'],
      rule: 'If you can only help some, help the most.', footDoes: 'she shares it among the five',
      famous: 'The famous rule shares it too: nobody aims at the one man\'s death.',
      us: 'Most of us share it. In her words: "we feel bound to let one man die rather than many if that is our only choice." Elizabeth Anscombe, in the same issue, disagreed: give it all to the one and who can say you wronged him?',
      badA: 'Good. You are a counter. I like counters.', badB: 'Five, for the one with the bigger thirst. Interesting.',
    },
    brew: {
      title: 'The brew', where: 'a brewing room',
      bad: 'I have poisoned five. You can brew the cure here, now. But the fumes go under that door, into the next room, where a sick man lies who cannot be moved. The fumes will kill him.',
      pitch: 'You won\'t touch him. You never even wanted him dead. Brew.',
      A: 'brew the cure: the five live, and the fumes kill the man next door', B: 'refuse: the bad man\'s poison kills the five',
      didA: 'You brewed the cure. The fumes went under the door and killed the man next door; the five lived.', didB: 'You refused. The poison killed the five.',
      sides: ['The fumes are yours. You make them, and they kill him. That you never wanted him dead changes nothing about who did it.', 'Against that, five saved from a poison that is not yours. That is harm against help: harm you do, to help others.'],
      rule: 'You may not harm one person to help others.', footDoes: 'she refuses',
      famous: 'The famous rule brews. The man\'s death is "of no use to us", a side effect, not aimed at, so it is allowed. Here the two rules part for the first time, and this is the case Foot built to part them.',
      us: 'Most of us, she says, would not brew: "Yet it surely is different. The relatives of the gassed patient would presumably be successful if they sued the hospital and the whole story came out." It is the medicine again, same five, same one — and it feels different. That difference is her whole argument.',
      badA: 'You never touched him. That was the idea.', badB: 'You let five die for a man you would only have gassed by accident. Interesting.',
    },
    beggar: {
      title: 'The beggar', where: 'a doorstep',
      bad: 'I have poisoned five. The only cure is a serum made from a dead body. A beggar is dying on your doorstep; he will be dead by morning unless you feed him. His body would do.',
      pitch: 'You don\'t have to lift a finger. Just don\'t open the door.',
      A: 'shut the door: the beggar dies, and his body cures the five', B: 'feed him: the bad man\'s poison kills the five',
      didA: 'You shut the door. The beggar starved in the night, and his body cured the five.', didB: 'You fed the beggar. The poison killed the five.',
      sides: ['You only let him die — but you let him die so that he dies. You want his body. Foot: letting someone die on purpose, aiming at it, is harm, not a failure to help.', 'Against that, five saved from a poison that is not yours. Harm against help again.'],
      rule: 'You may not harm one person to help others.', footDoes: 'she feeds him',
      famous: 'The famous rule feeds him too: shutting the door aims at his death, as the means to the serum.',
      us: 'Most of us feed him. In her words: "presumably we are inclined to see this as a violation of negative rather than positive duty", and later, we find it "particularly revolting that someone should be used".',
      badA: 'You didn\'t lift a finger. Nobody can say you did a thing.', badB: 'Five, for a beggar who was dying anyway. Interesting.',
    },
    bargain: {
      title: 'The bargain', where: 'a cellar',
      bad: 'Here is a man. Here are five. Here is a pistol. Shoot him, and the five walk out of here. Refuse, and I shoot the five. I keep my word; you know that by now.',
      pitch: 'Five is more than one. One shot.', pitchIf: { tram: 'Five is more than one. You said so yourself, at the wheel.' },
      A: 'shoot the one man: the five walk free', B: 'refuse: the bad man shoots the five',
      didA: 'You shot the one man. The five walked free.', didB: 'You refused. The bad man shot the five.',
      sides: ['You would kill a man with your own hand. Against that, five saved — from the bad man. Stopping his killing is help you would give, not harm you would avoid: those five deaths would be his, not yours.', 'So this is harm against help, and it is the tram with the sides swapped: there, both deaths were yours; here, only one is.'],
      rule: 'You may not harm one person to help others.', footDoes: 'she refuses',
      famous: 'The famous rule refuses too: his death is your means. The judge who frames an innocent man to stop a riot is this case, and the two rules agree on him.',
      us: 'Most of us refuse. In her words: "most of us would be appalled at the idea that the innocent man could be framed", and when the court is taken out of it, "we still find ourselves horrified".',
      badA: 'With your own hand. And they say I am the bad man.', badB: 'Then they are mine. You could have had them for one.',
    },
    torture: {
      title: 'The irons', where: 'a cell',
      bad: 'Two men are mine, next door. I will torture them, slowly, for as long as I like. Unless you torture this one man, here, with these, for one hour. Nobody dies. I keep my word.',
      pitch: 'Two is more than one, and nobody dies. One hour.', pitchIf: { bargain: 'You would not shoot. Fine. Nobody dies this time. One hour.' },
      A: 'take up the irons: you torture the one man for an hour, and the two go free', B: 'refuse: the bad man tortures the two',
      didA: 'You took up the irons. For an hour. The two went free.', didB: 'You refused. The bad man tortured the two.',
      sides: ['Nobody dies, and it is still harm you do, with your hands, for an hour. Against that, two spared from him. That is harm against help.', 'Foot: "To refrain from inflicting injury ourselves is a stricter duty than to prevent other people from inflicting injury, which is not to say that the other is not a very strict duty indeed."'],
      rule: 'You may not harm one person to help others.', footDoes: 'she refuses',
      famous: 'The famous rule refuses too: the hour is your means. On this case the paper says why anyone wanted that rule: without it, "anyone who wants us to do something we think wrong has only to threaten that otherwise he himself will do something we think worse."',
      us: 'The paper puts no "most of us" on this one. It is the case for the defence of the famous rule, and Foot\'s own answer to it is the same: "We may therefore refuse to be forced into acting by the threats of bad men."',
      badA: 'An hour. You did not even ask what they had done.', badB: 'Two, then. Slowly. You could have stopped it.',
    },
    cave: {
      title: 'The cave', where: 'a cave',
      bad: 'I have flooded my cave. Eight people are behind a man stuck fast in the only way out. His head is on the inside; the water will drown him with them. Here is dynamite. The only way to open the way out is through him.',
      pitch: 'Eight is more than one, and he drowns anyway. Light it.',
      A: 'light the fuse: the stuck man is blown out of the way and killed; the eight get out', B: 'refuse: the water drowns all nine',
      didA: 'You lit the fuse. The stuck man was killed; the eight climbed out.', didB: 'You refused. The water rose, and all nine drowned.',
      sides: ['This is the worst thing he has asked for: you blow a living man to pieces, on purpose. And Foot says do it.', 'Because there is no conflict here. The stuck man is lost either way. Blasting takes nothing from him that the water was not taking. "It is reasonable that the action that will save someone should be done."'],
      rule: 'Where the one is lost either way, there is no conflict: save whom you can.', footDoes: 'she lights it',
      famous: 'The famous rule refuses. Blasting a man out of a cave is aiming at his death; its defenders, she says, "would rightly reject" the excuse that you only meant to blow him out of the way. Here the two rules part for the second time, and the famous rule, she says, "must here conflict with that of most reasonable men".',
      us: 'Most of us light it. Foot built this cave as her picture of a mother and child who will both die unless the child is killed, the operation the Catholic doctrine forbids. The epilogue has that case.',
      badA: 'In pieces. The worst thing I asked for, and you did it.', badB: 'Nine, then. For a rule.',
    },
  };

  // ---- the pairs: each case's partner on the staircase, and the difference Foot names between them (the argument)
  // diff: 'aimed' (aimed at / only foreseen), 'harm' (harm done / help withheld), 'whose' (whose harm the many face),
  //       'doomed' (he is lost either way), 'numbers' (never Foot's), 'none' (she gives the same verdict)
  const PAIRS = {
    medicine: { with: 'tram', diff: 'none', line: 'Same five, same one as the tram. There your tram did the killing either way; here you harm nobody and only choose whom to help. Different kind of conflict, same verdict from her: help the most, harm the least.' },
    brew: { with: 'medicine', diff: 'harm', line: 'Same five, same one as the medicine, and this is her own question: "Why then is the case different from that of the scarce drug?" Her answer: at the ward you withheld help; here you do harm. The fumes are yours.' },
    beggar: { with: 'medicine', diff: 'harm', line: 'As at the ward, you only withhold something — the bread. The difference she names: here you withhold it so that he dies. Letting die on purpose counts as harm.' },
    bargain: { with: 'tram', diff: 'whose', line: 'Same five, same one as the tram. This is her driver and her judge. The difference she names: at the wheel, both deaths were yours to do; here only the one is yours, and the five would be the bad man\'s. Preventing his harm is help; doing your own is harm.' },
    torture: { with: 'bargain', diff: 'none', line: 'The bargain again, with two instead of five and nobody dying. If the numbers were the reason, two should be easier to refuse than five. She refuses both for the same reason: you may not harm one to help others.' },
    cave: { with: 'bargain', diff: 'doomed', line: 'As in the cellar, you would kill a man on purpose. The difference she names: the stuck man is lost either way, so there is no conflict between him and the eight. In the cellar the one man would have lived.' },
  };
  const DIFF_WORDS = {
    aimed: 'This time I would be aiming at his death.',
    harm: 'This time I would be harming him, not just failing to help him.',
    whose: 'This time the others are in danger from the bad man, not from me.',
    doomed: 'He is lost either way.',
    numbers: 'The numbers are different.',
    none: 'There is no real difference. I was wrong one of the two times.',
  };
  const DIFF_SHELF = ['aimed', 'harm', 'whose', 'doomed', 'numbers', 'none'];
  // what the house says about a named difference, per pair (hers / not hers), in its own words
  function diffVerdict(id, named) {
    const pr = PAIRS[id]; if (!pr) return null;
    const hers = pr.diff;
    if (named === hers) return { hers: true, text: hers === 'none' ? 'That is her reading too: she gives both the same verdict.' : 'That is the difference she names.' };
    const partnerMany = CASES[pr.with].many, many = CASES[id].many;
    if (named === 'numbers') return { hers: false, text: many === partnerMany ? `It is not the numbers: both are ${numw(many)} against one.` : `The numbers did change, ${numw(partnerMany)} to ${numw(many)}. But she does not need them: the stuck man dies either way, so one against one would do. The epilogue has exactly that case.` };
    if (named === 'aimed') return { hers: false, text: 'Aiming is the famous rule\'s difference, not hers. She says it "plays only a quite subsidiary role" in what we say about these cases. ' + (hers === 'none' ? 'She gives both cases the same verdict.' : 'What she names is different.') };
    if (named === 'none' && hers !== 'none') return { hers: false, text: 'She does see a difference, and names it.' };
    return { hers: false, text: 'That is not the difference she names.' };
  }

  function numw(n) { return ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] || String(n); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---- the game
  function newGame() { return { i: 0, choices: {}, diffs: {}, over: false }; }
  function current(g) {
    if (g.over) return null;
    const id = CONFIG.ORDER[g.i], c = CASES[id], w = WORDS[id];
    // the bad man's pitch can lean on what the player did earlier (pitchIf: { earlierCase: line }, used when they did it)
    let pitch = w.pitch;
    if (w.pitchIf) for (const k in w.pitchIf) if (g.choices[k] === (k === 'bargain' ? 'B' : 'A')) pitch = w.pitchIf[k];
    return { step: g.i + 1, of: CONFIG.ORDER.length, id, title: w.title, deed: c.deed, where: w.where, many: c.many, bad: w.bad, pitch, A: w.A, B: w.B, kills: c.kills };
  }
  // the player decides; returns the card
  function decide(g, opt) {
    if (g.over) throw new Error('game over');
    if (opt !== 'A' && opt !== 'B') throw new Error('A or B');
    const id = CONFIG.ORDER[g.i]; if (g.choices[id]) throw new Error('already decided');
    g.choices[id] = opt;
    return card(g, id);
  }
  function card(g, id) {
    const c = CASES[id], w = WORDS[id], you = g.choices[id];
    const foot = choose('foot', id), famous = choose('double', id);
    const pr = PAIRS[id];
    const partner = pr ? { id: pr.with, title: WORDS[pr.with].title, you: g.choices[pr.with], many: CASES[pr.with].many } : null;
    const flipped = !!(partner && partner.you && partner.you !== you);
    return {
      id, title: w.title, deed: c.deed, you, did: you === 'A' ? w.didA : w.didB,
      kind: conflict(id), sides: w.sides, rule: w.rule, foot, footDoes: w.footDoes,
      agree: you === foot, famous, famousLine: w.famous, famousAgrees: famous === foot, us: w.us,
      bad: you === 'A' ? w.badA : w.badB, counted: you === 'A',
      partner, flipped, pairLine: pr ? pr.line : null, askDiff: flipped, diffNamed: g.diffs[id] || null,
    };
  }
  function nameDiff(g, id, which) {
    if (!PAIRS[id]) throw new Error('no pair');
    if (!DIFF_WORDS[which]) throw new Error('no such difference');
    g.diffs[id] = which;
    return diffVerdict(id, which);
  }
  function next(g) {
    const id = CONFIG.ORDER[g.i]; if (!g.choices[id]) throw new Error('not decided');
    if (g.i < CONFIG.ORDER.length - 1) g.i++; else g.over = true;
    return current(g);
  }

  // ---- the staircase at the end: every step, every mark
  function staircase(g) {
    return CONFIG.ORDER.map((id, i) => ({
      step: i + 1, id, title: WORDS[id].title, deed: CASES[id].deed, many: CASES[id].many,
      you: g.choices[id] || null, foot: choose('foot', id), famous: choose('double', id), most: 'A',
      us: id === 'torture' ? null : choose('foot', id), // the paper's "most of us" where it gives one (every case but the torture), and it is her verdict each time: that is her claim
    }));
  }
  function verdict(g) {
    const S = staircase(g), ids = CONFIG.ORDER.filter(id => g.choices[id]);
    const sn = id => WORDS[id].title.toLowerCase();
    const list = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
    const agreeFoot = ids.filter(id => g.choices[id] === choose('foot', id));
    const agreeFamous = ids.filter(id => g.choices[id] === choose('double', id));
    const did = ids.filter(id => g.choices[id] === 'A');
    const gotYou = ids.filter(id => g.choices[id] === 'A' && choose('foot', id) === 'B'); // did what he asked where Foot refuses
    const parted = ids.filter(id => g.choices[id] !== choose('foot', id));
    // the shape of the player's own line on the staircase
    const first = CONFIG.ORDER.findIndex(id => g.choices[id] === 'B');
    const crossings = ids.reduce((n, id, k) => k > 0 && g.choices[id] !== g.choices[ids[k - 1]] ? n + 1 : n, 0);
    let line;
    if (did.length === ids.length) line = 'You did everything he asked, all the way up. Counting lives and nothing else, like Bentham. That is the rule the paper says puts us "hopelessly in the power of bad men": he only has to threaten more.';
    else if (first >= 0 && crossings === 1 && g.choices.cave === 'B') line = `You climbed with him until ${sn(CONFIG.ORDER[first])}, and refused everything from there. Your line follows the deed: the worse the thing, the firmer the no. Foot's line does not; it crosses at the brew and comes back at the cave.`;
    else if (first >= 0 && crossings === 2 && g.choices.cave === 'A') line = `You climbed with him until ${sn(CONFIG.ORDER[first])}, refused from there, and lit the fuse at the top. That is the shape of Foot's own line${agreeFoot.length === ids.length ? ', and it is her line exactly' : ''}.`;
    else line = `Your line crossed ${numw(crossings)} times on the way up.`;
    const score = `You and Foot agreed on ${numw(agreeFoot.length)} of ${numw(ids.length)}${parted.length ? `; you parted at ${list(parted.map(sn))}` : ''}. You and the famous rule agreed on ${numw(agreeFamous.length)}.`;
    const trap = gotYou.length ? `The bad man got you ${gotYou.length === 1 ? 'once' : numw(gotYou.length) + ' times'}: ${list(gotYou.map(sn))}. Each time you did what he asked where she would have refused.` : 'The bad man never got you: you refused every time she refuses.';
    const paper = 'Philippa Foot, 1967: what you aim at "plays only a quite subsidiary role" in what we say about these cases. What matters is whether you would be harming someone or only failing to help him. Not harming is the stricter duty. So: harm against harm, do the least harm; help against help, help the most; harm against help, you may not harm one to help others. The brew is where that line parts from the famous rule; the cave is where the famous rule parts from most of us.';
    const trolley = 'The tram, now the most famous puzzle in ethics, is the first step and the easy one in the paper that invented it. The hard step was always the one with your own hand on it.';
    return { line, score, trap, paper, trolley, agreeFoot: agreeFoot.length, agreeFamous: agreeFamous.length, gotYou, parted, steps: S };
  }

  // ---- the epilogue: the three abortion cases as Foot lists them (p. 5). One against one; no bad man; no verdict given.
  const CODA = [
    { id: 'both', title: 'The first case', step: 'cave',
      text: 'Nothing can save them both. If nothing is done, mother and child die. Killing the child saves the mother.',
      A: 'operate: the child dies, the mother lives', B: 'do nothing: both die',
      didA: 'You operated. The child died; the mother lived.', didB: 'You did nothing. Both died.',
      foot: 'Foot: this is the cave. The child is lost either way, so there is no real conflict, and the act that saves someone should be done, "whatever the method used". A rule that never aims at an innocent death forbids it even here, and here, she says, it "must conflict with that of most reasonable men".' },
    { id: 'either', title: 'The second case', step: 'medicine',
      text: 'An operation can save the mother and kill the child, or save the child and kill the mother. Nobody can save both.',
      A: 'save the mother', B: 'save the child',
      didA: 'You saved the mother.', didB: 'You saved the child.',
      foot: 'Foot: this is the shipwreck, sailors who must throw one overboard or all drown. Whether to act is not in question, only whom to save: help against help, like the medicine. Better one than none. Probably the mother, she says, "but it is interesting that, a few years later, we might easily decide it the other way."' },
    { id: 'worst', title: 'The worst case', step: 'bargain',
      text: 'To save the mother the child must be killed. If nothing is done the mother dies, and the child is safely delivered.',
      A: 'operate: the child dies, the mother lives', B: 'do nothing: the mother dies, the child lives',
      didA: 'You operated. The child died; the mother lived.', didB: 'You did nothing. The mother died; the child lived.',
      foot: 'Foot calls this "the worst dilemma". The famous rule forbids the operation because the child\'s death would be aimed at. She thinks the verdict may be right for the wrong reason: "in general we do not think that we can kill one innocent person to rescue another." That is the bargain\'s shape, one against one. Unless, she adds, you count a mother\'s life as many against one.' },
  ];
  const CODA_CLOSE = 'She ends without a verdict: "I have not been arguing for or against these points of view but only trying to discern some of the currents that are pulling us back and forth. The levity of the examples is not meant to offend."';
  function coda(i, opt) {
    const c = CODA[i]; if (!c) throw new Error('no such case');
    return { id: c.id, title: c.title, text: c.text, A: c.A, B: c.B, did: opt ? (opt === 'A' ? c.didA : c.didB) : null, foot: c.foot, step: c.step, stepTitle: WORDS[c.step].title, last: i === CODA.length - 1, close: CODA_CLOSE };
  }

  return { CONFIG, CASES, RULES, WORDS, PAIRS, DIFF_WORDS, DIFF_SHELF, CODA, choose, conflict, diffVerdict, newGame, current, decide, card, nameDiff, next, staircase, verdict, coda, numw, cap };
});
