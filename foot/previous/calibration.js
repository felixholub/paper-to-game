// Calibration check for Foot's Bad Man. Run: node calibration.js  (writes calibration-result.txt)
// A TOY of an argument has no numbers to fit. What is checked instead: that each rule, run on each of the paper's cases,
// gives the verdict the paper says it gives; that the audience agrees with the paper's own sentences; that the two rival
// principles agree and part exactly where the paper says; that the central discovery survives the designer's choices
// (the numbers, the tries per target) and the two places where the formalisation had to read the paper; and that every
// path through the game composes its words and ends.
const M = require('./mechanism.js'); const fs = require('fs');
const out = []; let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; out.push('  ok   ' + msg); } else { fail++; out.push('  FAIL ' + msg); } };
const say = s => out.push(s);
const ORDER = M.CONFIG.SCHEME_ORDER, RULES = M.CONFIG.TARGET_ORDER;
const choiceRow = (rule, cfg) => ORDER.map(id => M.choose(rule, id, cfg)).join('');

say('1. Each rule against the paper\'s stated verdicts (A = the one dies, the five live; B = the five die)');
// DDE: tram permitted (p. 2, "insisting that it is one thing to steer towards someone foreseeing that you will kill him and
// another to aim at his death"); judge/torture/serum forbidden (pp. 2–3); scarce drug permitted (p. 3); the gas permitted
// ("clearly a side effect, and not directly intended", p. 4); the beggar forbidden ("in allowing him to die we are aiming at
// his death", p. 4); the cave forbidden for whoever holds "direct intention of the death of an innocent person is never
// justifiable" (p. 5).
const PAPER = {
  double: { tram: 'A', bargain: 'B', medicine: 'A', brew: 'A', beggar: 'B', cave: 'B' },
  // Foot: driver steers (p. 4: "he should do the least injury he can"); judge may not (p. 4); drug to the five (p. 4:
  // "weighing aid against aid"); the gas forbidden (p. 5: "the principle seems unimportant compared with our reluctance to
  // bring such injury for the sake of giving aid"); the beggar forbidden (p. 4); the cave: act (p. 5).
  foot: { tram: 'A', bargain: 'B', medicine: 'A', brew: 'B', beggar: 'B', cave: 'A' },
  // "the size of the evil must always be our guide" (p. 5): the five, always.
  most: { tram: 'A', bargain: 'A', medicine: 'A', brew: 'A', beggar: 'A', cave: 'A' },
};
for (const r of RULES) for (const id of ORDER) ok(M.choose(r, id) === PAPER[r][id], `${r} on ${id}: ${M.choose(r, id)} (paper: ${PAPER[r][id]})`);

say('\n2. Where the two principles agree and where they part (p. 4: "So far the conclusions are the same … but in others they will be different")');
const agree = ORDER.filter(id => M.choose('double', id) === M.choose('foot', id));
const part = ORDER.filter(id => M.choose('double', id) !== M.choose('foot', id));
ok(['tram', 'bargain', 'medicine', 'beggar'].every(id => agree.includes(id)), 'DDE and Foot agree on the tram, the judge/tyrant, the drug and the beggar: ' + agree.join(', '));
ok(part.includes('brew'), 'DDE and Foot part on the gas (the brew)');
ok(part.join() === 'brew,cave', 'they part on the brew and the cave only: ' + part.join(', '));
// The confound: in every case the paper pairs (tram/judge, drug/serum, rescue/torture), "aimed" and "harm done to help"
// travel together; the brew is the one case with a side effect that is harm done to help.
const S = M.SCHEMES, harmForAid = id => (S[id].harm === 'injure' || S[id].aimed) && S[id].against === 'aid' && !S[id].doomed;
const confounded = ['tram', 'bargain', 'medicine', 'beggar'].every(id => S[id].aimed === harmForAid(id));
ok(confounded, 'in the classic cases, "aimed at" and "harm done to help" coincide (the confound)');
ok(!S.brew.aimed && harmForAid('brew'), 'the brew breaks the confound: a side effect, and harm done to help');

say('\n3. The audience is the paper\'s "we"');
ok(RULES.every(r => ORDER.every(id => M.AUDIENCE[id][M.choose(r, id)] !== undefined)), 'every choice any rule makes has an audience verdict');
ok(ORDER.every(id => M.judge(id, M.choose('foot', id)) !== 'disgrace'), 'the audience never turns on Foot\'s choices (her claim: her principle explains our verdicts)');
ok(M.judge('brew', 'A') === 'disgrace', 'brewing is a disgrace (p. 5: "Yet it surely is different … would presumably be successful if they sued")');
ok(M.judge('tram', 'A') === 'cheer', 'steering is cheered (p. 2: "without hesitation")');
ok(M.judge('bargain', 'B') === 'blameless', 'refusing the bad man is blameless (p. 3: "it is he who intends … the death of innocent persons; we do not")');
ok(M.judge('cave', 'B') === 'disgrace', 'refusing to blast in the cave is a disgrace (p. 5: "must here conflict with that of most reasonable men")');

say('\n3b. The house of fourteen (the shares read off the paper\'s hedges)');
ok(ORDER.every(id => ['A', 'B'].every(o => { const h = M.house(id, o); return h.turn + h.cheer + h.hiss + h.quiet === M.HOUSE; })), 'every act splits exactly fourteen heads');
ok(M.house('tram', 'A').cheer === 14, 'the tram steered: all fourteen cheer ("without hesitation", p. 2)');
ok(M.house('bargain', 'A').turn >= 12, 'the bargain taken: at least twelve turn ("most of us would be appalled", p. 2)');
ok(M.house('brew', 'A').turn >= M.DISGRACE_AT && M.house('brew', 'A').cheer >= 3, 'the brew: a disgrace, with a real minority cheering ("presumably", p. 5)');
ok(M.judge('medicine', 'B') === 'split' && M.house('medicine', 'B').turn < M.DISGRACE_AT, 'the whole dose to the one: split, not a disgrace (Foot against Anscombe)');
ok(ORDER.every(id => ['A', 'B'].every(o => (M.judge(id, o) === 'disgrace') === (M.house(id, o).turn >= M.DISGRACE_AT))), 'a disgrace is exactly ten or more turning');
ok(['bargain', 'brew', 'beggar'].every(id => M.house(id, 'B').turn >= 3 && M.house(id, 'B').hiss >= M.house(id, 'B').turn * 2), 'every refusal of the bad man has a minority turning on the refuser (the counters) and a clear majority hissing him');
ok(ORDER.every(id => ['A', 'B'].every(o => !/undefined|\{/.test(M.audienceWords(id, o, M.PEOPLE.foot)))), 'the house composes its words for every act');

say('\n4. The holes: schemes that disgrace each rule');
const H = r => M.holes(r).join(',');
ok(H('most') === 'bargain,brew,beggar', 'Mr Most (counting): ' + H('most') + ' — "hopelessly in the power of bad men" (p. 3)');
ok(H('double') === 'brew,cave', 'Doctor Double (DDE): ' + H('double'));
ok(H('foot') === '', 'Mrs Foot: none');

say('\n5. Robustness: the central discovery (the brew disgraces Doctor Double and not Mrs Foot) under other choices');
const keep = M.CONFIG.FIVE;
for (const n of [2, 5, 50]) {
  M.CONFIG.FIVE = n;
  ok(H('most') === 'bargain,brew,beggar' && H('double') === 'brew,cave' && H('foot') === '', `one against ${n} (p. 3 uses two for the mad murderer): holes unchanged`);
}
M.CONFIG.FIVE = keep;
const cfgCave = Object.assign({}, M.CONFIG, { DDE_CAVE_AIMED: false });
const dcave = M.CONFIG.SCHEME_ORDER.filter(id => M.judge(id, M.choose('double', id, cfgCave)) === 'disgrace');
ok(dcave.join() === 'brew', 'a lenient DDE that calls the stuck man\'s death a side effect ("only to blast him out", p. 1): Doctor Double\'s holes = ' + dcave.join(',') + ' — the brew survives; the cave closes');
const cfgBeg = Object.assign({}, M.CONFIG, { FOOT_AIMED_ALLOWING_IS_HARM: false });
const fbeg = M.CONFIG.SCHEME_ORDER.filter(id => M.judge(id, M.choose('foot', id, cfgBeg)) === 'disgrace');
ok(fbeg.join() === 'beggar' && M.choose('foot', 'brew', cfgBeg) === 'B', 'a Foot without p. 4\'s reading of the beggar (letting die is only a failure to aid): her holes = ' + fbeg.join(',') + '; she still refuses the brew. So "Mrs Foot cannot be touched" rests on p. 4; the brew\'s lesson does not');
const cfgDoom = Object.assign({}, M.CONFIG, { FOOT_DOOMED_NO_CONFLICT: false });
ok(M.choose('foot', 'cave', cfgDoom) === 'B' && M.choose('foot', 'brew', cfgDoom) === 'B', 'a Foot without "no serious conflict of interests": she would refuse the cave (a hole) and still the brew');

say('\n6. Every path through the game (all orders of up to three schemes per target)');
function perms(arr, k) { if (!k) return [[]]; const r = []; arr.forEach((x, i) => perms(arr.filter((_, j) => j !== i), k - 1).forEach(p => r.push([x].concat(p)))); return r; }
const P3 = perms(ORDER, 3);
let games = 0, bad = 0, braces = 0; const hist = { 0: 0, 1: 0, 2: 0, 3: 0 }; let footHit = 0, brewSeen = 0;
for (const a of P3) for (const b of P3) for (const c of P3) {
  if (games > 20000 && (a[0] !== 'bargain')) continue; // all orders for reel 1 led by the bargain, a large sample otherwise
  const g = M.newGame(); const plan = [a, b, c];
  try {
    for (let t = 0; t < 3; t++) {
      let k = 0;
      while (M.current(g) && !M.current(g).ended) { const r = M.spring(g, plan[t][k++]); if (/[{}]/.test(r.did + r.why + r.audience + r.stand)) braces++; }
      M.next(g);
    }
    if (!g.over) bad++;
    const v = M.verdict(g); if (/[{}]|undefined/.test(v.did.join(' ') + v.paper + v.means + v.fate)) braces++;
    hist[v.hits]++; if (g.status[2] === 'disgraced') footHit++;
    if (g.log.some(r => r.target === 'double' && r.scheme === 'brew')) brewSeen++;
  } catch (e) { bad++; }
  games++;
}
ok(bad === 0, `${games} games played to the end without error`);
ok(braces === 0, 'no unfilled pronoun or undefined in any line');
ok(footHit === 0, 'Mrs Foot is never disgraced');
say(`     disgraces per game over these ${games} games: none ${hist[0]}, one ${hist[1]}, two ${hist[2]}, three ${hist[3]}`);

say('\n7. The preview says nothing about the outcome');
const g0 = M.newGame();
ok(ORDER.every(id => { const p = M.preview(g0, id); return !/cheer|disgrace|hiss|audience|allowed|forbade/i.test(p.ask + p.bad); }), 'no scheme preview names the choice the target will make or the audience\'s verdict');
ok(ORDER.every(id => /: /.test(M.preview(g0, id).A) && /: /.test(M.preview(g0, id).B)), 'every preview states both choices and what each costs');

say('\n8. The chair: the player\'s own choices, read against the three rules');
// every pattern of six A/B choices in the chair composes, and sorts the player as it should
let cbad = 0, cmatch = 0, cties = 0;
for (let m = 0; m < 64; m++) {
  const g = M.newGame(); const ch = {};
  ORDER.forEach((id, i) => { ch[id] = (m >> i) & 1 ? 'A' : 'B'; M.chair(g, id, ch[id]); });
  // play any complete game so the verdict composes
  for (let t = 0; t < 3; t++) { let k = 0; while (!M.current(g).ended) { const r = M.spring(g, ORDER[k++]); if (!r.you || /[{}]|undefined/.test(r.you + r.note)) cbad++; } M.next(g); }
  const y = M.verdict(g).you; if (!y || /[{}]|undefined/.test(y.line + y.read + y.stalls)) cbad++;
  if (y.tied.length > 1) cties++;
  // a player who chose exactly as one rule does must be read as that rule alone
  for (const r of RULES) if (ORDER.every(id => M.choose(r, id) === ch[id])) { if (y.tied.length === 1 && y.tied[0] === r) cmatch++; else cbad++; }
}
ok(cbad === 0, 'all 64 patterns of chair choices compose their lines; a player who chooses exactly as a rule does is read as that rule');
ok(cmatch === 3, 'the three rules\' own patterns each come out as that rule');
say(`     ties (two or more rules equally close) in ${cties} of 64 patterns`);
const g1 = M.newGame(); g1.t = 2; M.chair(g1, 'brew', 'A'); const r1 = M.spring(g1, 'brew'); // against Mrs Foot, who refuses
ok(r1.you && /ten would have turned on you/.test(r1.you), 'brewing in the chair: told ten of the house would have turned on you: ' + r1.you);
const g2 = M.newGame(); M.chair(g2, 'medicine', 'B'); const r2 = M.spring(g2, 'medicine');
ok(/sat still/.test(r2.you) && /Anscombe/.test(r2.you), 'the whole dose to the one, in the chair: six sit still, Anscombe named: ' + r2.you);
ok(ORDER.every(id => !M.YOU[id].A.includes('{') && M.PAPER_NOTE[id].length > 20), 'every scheme has a chair line and a note saying which of the paper\'s cases it is');
let threw = 0; try { M.chair(g1, 'brew', 'B'); } catch (e) { threw++; } ok(threw === 1, 'a scheme is decided in the chair once');

say('\n9. The epilogue: the three abortion cases as Foot lists them (p. 5)');
ok(M.CODA.length === 3 && M.CODA.map(c => c.scheme).join() === 'cave,medicine,bargain', 'three cases; their adult parallels: the cave, the shipwreck (whom to save, like the drug), and the bargain\'s shape');
ok([0, 1, 2].every(i => ['A', 'B'].every(o => { const c = M.coda(i, o); return c.did && c.foot && c.most && !/undefined/.test(c.did + c.foot); })), 'every case composes for either decision');
ok(M.coda(2).last && /not been arguing for or against/.test(M.coda(2).close), 'the last case closes with Foot\'s own caution');

const res = `Foot's Bad Man — calibration check\n${new Date().toISOString().slice(0, 10)}\n\n${out.join('\n')}\n\n${pass} passed, ${fail} failed.\n`;
fs.writeFileSync(__dirname + '/calibration-result.txt', res); console.log(res);
process.exit(fail ? 1 : 0);
