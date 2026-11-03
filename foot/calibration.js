// Calibration check for Foot's Bad Man (the staircase build). Run: node calibration.js  (writes calibration-result.txt)
// A TOY of an argument has no numbers to fit. What is checked: that each rule, run on each of the paper's cases, gives the
// verdict the paper says it gives; that the two rules agree and part exactly where the paper says; that the pairs carry
// the differences Foot names; that the central discovery survives the three places where the formalisation had to read
// the paper; and that every path through the game composes its words and ends.
const M = require('./mechanism.js'); const fs = require('fs');
const out = []; let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; out.push('  ok   ' + msg); } else { fail++; out.push('  FAIL ' + msg); } };
const say = s => out.push(s);
const ORDER = M.CONFIG.ORDER;

say('1. Each rule against the paper\'s stated verdicts (A = do what the bad man asks; B = refuse)');
const PAPER = {
  // the famous rule: tram permitted (p. 2); drug permitted (p. 3); the gas permitted ("clearly a side effect", p. 4); the beggar
  // forbidden ("aiming at his death", p. 4); the judge forbidden (p. 2); the torture forbidden (p. 3); the cave forbidden (p. 5)
  double: { tram: 'A', medicine: 'A', brew: 'A', beggar: 'B', bargain: 'B', torture: 'B', cave: 'B' },
  // Foot: driver steers (p. 4); drug to the five (p. 4); the gas forbidden (p. 5); the beggar forbidden (p. 4); the judge may not
  // (p. 4); "we may therefore refuse to be forced into acting by the threats of bad men" (p. 4); the cave: act (p. 5)
  foot: { tram: 'A', medicine: 'A', brew: 'B', beggar: 'B', bargain: 'B', torture: 'B', cave: 'A' },
};
for (const r of ['double', 'foot']) for (const id of ORDER) ok(M.choose(r, id) === PAPER[r][id], `${r} on ${id}: ${M.choose(r, id)} (paper: ${PAPER[r][id]})`);
ok(ORDER.every(id => M.choose('most', id) === 'A'), 'counting does everything the bad man asks (p. 5: "the size of the evil must always be our guide")');

say('\n2. Where the two rules agree and where they part (p. 4: "So far the conclusions are the same … but in others they will be different")');
const part = ORDER.filter(id => M.choose('double', id) !== M.choose('foot', id));
ok(part.join() === 'brew,cave', 'they part on the brew and the cave only: ' + part.join(', '));
const K = id => M.conflict(id);
ok(K('tram') === 'harm-harm' && K('medicine') === 'help-help' && ['brew', 'beggar', 'bargain', 'torture'].every(id => K(id) === 'harm-help') && K('cave') === 'none', 'the kinds of conflict: harm/harm, help/help, four of harm/help, and none (the cave)');

say('\n3. The staircase: Foot\'s line does not climb with the deed');
const F = ORDER.map(id => M.choose('foot', id)).join(''), D = ORDER.map(id => M.choose('double', id)).join('');
ok(F === 'AABBBBA', 'Foot: ' + F + ' (allows the first two, forbids four, allows the worst deed)');
ok(D === 'AAABBBB', 'the famous rule: ' + D + ' (steps down once, at the beggar, and never comes back)');
ok(M.CASES.tram.many === 5 && M.CASES.medicine.many === 5 && M.CASES.brew.many === 5 && M.CASES.beggar.many === 5 && M.CASES.bargain.many === 5 && M.CASES.torture.many === 2, 'numbers as the paper gives them: five for the tram, the drug, the gas and the judge; two for the mad murderer');

say('\n4. The pairs carry the differences Foot names');
const P = M.PAIRS;
ok(P.brew.with === 'medicine' && P.brew.diff === 'harm', 'the brew against the medicine: harm done against help withheld (p. 5, "why then is the case different from that of the scarce drug?")');
ok(P.bargain.with === 'tram' && P.bargain.diff === 'whose', 'the bargain against the tram: whose harm the five face (p. 4, the driver\'s conflict of negative duties against the judge\'s)');
ok(P.cave.with === 'bargain' && P.cave.diff === 'doomed', 'the cave against the bargain: lost either way (p. 5)');
ok(P.beggar.with === 'medicine' && P.beggar.diff === 'harm', 'the beggar against the medicine: letting die on purpose counts as harm (p. 4)');
ok(P.torture.diff === 'none' && P.medicine.diff === 'none', 'the irons and the medicine: same verdict as their partners');
ok(Object.keys(P).every(id => M.CASES[id].many === M.CASES[P[id].with].many || P[id].diff === 'none' || id === 'cave'), 'within every pair where she names a difference, the numbers are the same (the cave excepted: eight behind the stuck man, and its numbers answer points to the epilogue\'s one against one)');
ok(/one against one/.test(M.diffVerdict('cave', 'numbers').text), 'the cave\'s answer to "the numbers" names the one-against-one case');
ok(Object.keys(P).every(id => M.DIFF_SHELF.every(d => { const v = M.diffVerdict(id, d); return v && typeof v.hers === 'boolean' && v.text.length > 10; })), 'every difference on the shelf has an answer for every pair');
ok(Object.keys(P).every(id => M.diffVerdict(id, P[id].diff).hers && M.DIFF_SHELF.filter(d => M.diffVerdict(id, d).hers).length === 1), 'exactly one difference on the shelf is hers, per pair');

say('\n5. Robustness: the discovery under the three readings of the paper');
const cfgCave = Object.assign({}, M.CONFIG, { DDE_CAVE_AIMED: false });
ok(M.choose('double', 'cave', cfgCave) === 'A' && M.choose('double', 'brew', cfgCave) === 'A' && M.choose('foot', 'brew', cfgCave) === 'B', 'a lenient famous rule that calls the stuck man\'s death a side effect: the cave stops parting them; the brew still does');
const cfgBeg = Object.assign({}, M.CONFIG, { FOOT_AIMED_ALLOWING_IS_HARM: false });
ok(M.choose('foot', 'beggar', cfgBeg) === 'A' && M.choose('foot', 'brew', cfgBeg) === 'B', 'a Foot without p. 4\'s reading of the beggar: she would shut the door; the brew still parts them');
const cfgDoom = Object.assign({}, M.CONFIG, { FOOT_DOOMED_NO_CONFLICT: false });
ok(M.choose('foot', 'cave', cfgDoom) === 'B', 'a Foot without "no serious conflict of interests": she would refuse the cave');

say('\n6. Every path through the game (all 128 ways of deciding seven steps, with every difference named)');
let games = 0, bad = 0, braces = 0, flips = 0;
for (let m = 0; m < 128; m++) {
  for (const d of M.DIFF_SHELF) {
    const g = M.newGame();
    try {
      while (!g.over) {
        const v = M.current(g); const opt = (m >> g.i) & 1 ? 'A' : 'B';
        const r = M.decide(g, opt);
        if (/[{}]|undefined/.test(r.did + r.sides.join('') + r.famousLine + r.us + r.bad + (r.pairLine || ''))) braces++;
        if (r.askDiff) { flips++; const dv = M.nameDiff(g, v.id, d); if (!dv || /undefined/.test(dv.text)) braces++; }
        M.next(g);
      }
      const V = M.verdict(g); if (/[{}]|undefined/.test(V.line + V.score + V.trap)) braces++;
      if (V.steps.length !== 7) bad++;
    } catch (e) { bad++; }
    games++;
  }
}
ok(bad === 0, `${games} games played to the end without error`);
ok(braces === 0, 'no unfilled word or undefined in any line');
say(`     the difference question fired ${flips / M.DIFF_SHELF.length / 128} times per game on average`);
const gf = M.newGame(); ORDER.forEach(id => { M.decide(gf, M.choose('foot', id)); M.next(gf); });
ok(/her line exactly/.test(M.verdict(gf).line) && M.verdict(gf).agreeFoot === 7, 'a player who chooses as Foot does is told so');
const gm = M.newGame(); ORDER.forEach(() => { M.decide(gm, 'A'); M.next(gm); });
ok(/Bentham/.test(M.verdict(gm).line) && M.verdict(gm).gotYou.length === 4, 'a player who does everything is told it is counting, and the bad man got them four times');

ok(M.staircase(M.newGame()).every(st => st.id === 'torture' ? st.us === null : st.us === st.foot), '"most of us" follows Foot\'s verdict on every case but the irons, where the paper gives none');

say('\n7. The epilogue');
ok(M.CODA.length === 3 && M.CODA.map(c => c.step).join() === 'cave,medicine,bargain', 'three cases; their steps on the staircase: the cave, the medicine (whom to save), the bargain');
ok([0, 1, 2].every(i => ['A', 'B'].every(o => { const c = M.coda(i, o); return c.did && c.foot && !/undefined/.test(c.did + c.foot); })), 'every case composes for either decision');
ok(M.coda(2).last && /not been arguing for or against/.test(M.coda(2).close), 'the last case closes with Foot\'s own caution');

const res = `Foot's Bad Man — calibration check (the staircase build)\n${new Date().toISOString().slice(0, 10)}\n\n${out.join('\n')}\n\n${pass} passed, ${fail} failed.\n`;
fs.writeFileSync(__dirname + '/calibration-result.txt', res); console.log(res);
process.exit(fail ? 1 : 0);
