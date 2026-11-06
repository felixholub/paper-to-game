// Augustine's Clock (second rebuild): the mechanism run headless, through the functions the browser calls.
// Run: node calibration.js   (calibration-result.txt is the saved output)
const A = require('./mechanism.js');
const C = A.CONFIG, out = [], say = s => { out.push(s); console.log(s); };
let pass = 0, fail = 0;
const check = (name, ok, note) => { if (ok) pass++; else fail++; say((ok ? 'pass' : 'FAIL') + '  ' + name + (note ? '  (' + note + ')' : '')); };
const abs = Math.abs, log = Math.log;
const noDigits = s => !/\d/.test(s);

say('A. The deal');
{
  let lowOK = true, sunOK = true, crowdOK = true, lowFirst = 0, detOK = true, sizes = { 3: 0, 4: 0, 5: 0, 6: 0 };
  for (let s = 1000; s < 4000; s++) {
    const g = A.newGame(s), S = g.sun, P = g.tumult;
    if (g.low < C.LENGTH.min || g.low > C.LENGTH.max) lowOK = false;
    if (S.stopStart <= 0 || S.stopEnd >= S.end || S.stop < C.SUN.stopMin || S.stop > C.SUN.stopMax || S.arc < C.SUN.arcMin || S.arc > C.SUN.arcMax) sunOK = false;
    if (P.entries[0].id === 'low') lowFirst++;
    if (!P.entries.some(e => e.id === 'low') || P.size < C.TUMULT.sizeMin || P.size > C.TUMULT.sizeMax || P.entries.length !== P.size) crowdOK = false;
    P.entries.forEach(e => { if (e.id !== 'low' && e.end < P.lowEnd + C.TUMULT.extraMin - 1e-9) crowdOK = false; });
    sizes[P.size]++;
    const g2 = A.newGame(s); if (JSON.stringify([g2.low, g2.sun, g2.tumult, g2.deal]) !== JSON.stringify([g.low, g.sun, g.tumult, g.deal])) detOK = false;
  }
  check('the low one within ' + C.LENGTH.min + '–' + C.LENGTH.max + ' s', lowOK);
  check('the sun stands still inside its crossing, for ' + C.SUN.stopMin + '–' + C.SUN.stopMax + ' s, on an arc of ' + C.SUN.arcMin + '–' + C.SUN.arcMax, sunOK);
  check('the crowd holds the low one and 2–5 others, which outlast it', crowdOK, '3/4/5/6 voices: ' + sizes[3] + '/' + sizes[4] + '/' + sizes[5] + '/' + sizes[6]);
  check('the low one never enters the crowd first', lowFirst === 0);
  check('the same number deals the same evening', detOK);
}

say('B. The sun');
{
  const g = A.newGame(2024), S = g.sun;
  check('the sun is at the horizon as it rises', A.sunAt(S, 0) === 0);
  check('the sun holds its place while it stands still', abs(A.sunAt(S, S.stopStart) - A.sunAt(S, S.stopEnd)) < 1e-9 && abs(A.sunAt(S, S.stopStart + S.stop / 2) - A.sunAt(S, S.stopStart)) < 1e-9);
  check('the sun has set at the end', abs(A.sunAt(S, S.end) - 1) < 1e-9);
  check('the stillness is not counted in the crossing', abs(A.sunAt(S, S.stopEnd + 1) - A.sunAt(S, S.stopStart - 1) - 2 / S.cross) < 1e-9);
}

say('C. Each station, through its functions');
{
  const g = A.newGame(3101), L = g.low;
  const j1 = A.joy(g, 4); check('the moment is kept as held', g.held.joy === 4 && j1.mem[0].secs === 4); A.next(g);
  A.hold(g, L); A.next(g);
  const nd = A.nightDay(g, 2, 5); check('night and day keep their relation', abs(nd.ratio - 2.5) < 1e-9 && g.held.ndRatio === nd.ratio); A.next(g);
  A.zero(g); check('the zero: every multiple is wrong, the fifth answer sees the trap', !A.zeroPick(g, 0).right && !A.zeroPick(g, 3).right && A.zeroPick(g, 4).right); A.next(g);
  const P2 = g.pairs; check('two pairs, the long one 4–5.5 × the short', P2.every(p => p.long / p.short >= 4 - 1e-9 && p.long / p.short <= 5.5 + 1e-9) && P2.every(p => abs(p.geo - Math.sqrt(p.short * p.long)) < 0.001));
  const bc = A.betweenHolds(g, P2[0].arith, P2[1].arith, P2[1].long / 2); check('betweens at the arithmetic middles read as by the clock, the half as true', bc.scale === 'clock' && bc.big === 'by the clock' && A.amount(bc.halfRatio).x === 1);
  const bg = A.betweenHolds(g, P2[0].geo, P2[1].geo, P2[1].long / 2); check('betweens at the geometric middles read as by ratio', bg.scale === 'ratio' && /no halfway between nothing and something/.test(bg.lines[2]));
  const bm = A.betweenHolds(g, P2[0].arith, P2[1].geo, P2[1].long / 2); check('one each way reads as mixed', bm.scale === 'mixed'); A.betweenHolds(g, P2[0].arith, P2[1].arith, P2[1].long / 2); A.next(g);
  const pl = A.planned(g, 2); check('the planned silence offers two voices, one of them yours', pl.offered.length === 2 && pl.offered.filter(o => o.yours).length === 1 && pl.offered.find(o => o.yours).secs === 2);
  const pp = A.plannedPick(g, pl.offered.findIndex(o => o.yours)); check('picking yours is right', pp.right && pp.big === 'yours');
  const pw = A.plannedPick(g, 1 - pl.offered.findIndex(o => o.yours)); check('picking the other is wrong and says yours', !pw.right && /Yours was the/.test(pw.lines[0])); A.plannedPick(g, pl.offered.findIndex(o => o.yours)); A.next(g);
  const su = A.sunHold(g, g.sun.stop * 0.9); check('the stillness held at nine tenths', su.big === 'nine tenths'); A.next(g);
  const th = A.threeThings(g, [2, 4.5, 1.2]); check('three things: the longest is the conversation', th.longest.length === 1 && th.longest[0] === 1);
  check('the right one is right, the wrong one corrected', A.threeThingsPick(g, 1).right && !A.threeThingsPick(g, 0).right && /It was a conversation/.test(g.results[g.i].lines[0])); A.threeThingsPick(g, 1); A.next(g);
  const hy = A.hymnSing(g, [0.4, 0.8, 0.4, 0.8, 0.4, 1.0, 0.4, 0.8]); check('the hymn: longs double shorts, longest found', hy.big === 'double' && hy.longest.length === 1 && hy.longest[0] === 5);
  const hl = A.hymnLongest(g, 5); check('the longest syllable named rightly', hl.right); const hw = A.hymnLongest(g, 1); check('a wrong syllable is corrected', !hw.right && /It was OM/.test(hw.lines[1])); check('flat singing is not double, and any long will do', A.hymnSing(g, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]).big === 'the same, not double' && A.hymnLongest(g, 3).right && /as good an answer as any/.test(g.results[g.i].lines[1]));
  A.hymnSing(g, [0.4, 0.8, 0.4, 0.8, 0.4, 1.0, 0.4, 0.8]); A.hymnLongest(g, 5); A.next(g);
  const P = g.tumult, tu = A.tumult(g, P.lowEnd + 0.1); check('a release on the moment reads as caught', tu.reading === 'caught');
  check('a release at the crowd’s end reads as waited', A.tumult(g, P.end + 0.5).reading === 'waited');
  check('a release before the low one came in reads as early', A.tumult(g, P.lowStart - 0.1).reading === 'early');
  A.tumult(g, P.lowEnd); const tc = A.tumultCount(g, P.size); check('the right count is right', tc.right); A.next(g);
  const np = A.nightDayPairs(g); check('three pairs, one yours, at three sizes', np.pairs.length === 3 && np.pairs.filter(p => p.yours).length === 1 && new Set(np.pairs.map(p => p.night)).size === 3);
  check('the pair that is yours has your relation', abs(np.pairs.find(p => p.yours).ratio - 2.5) < 1e-9);
  check('the other pairs are off by ' + C.NIGHTDAY.off + ' either way', np.pairs.filter(p => !p.yours).every(p => abs(log(p.ratio / 2.5)) > log(C.NIGHTDAY.off) - 1e-9));
  check('no offered day longer than ' + C.NIGHTDAY.maxDay + ' s', np.pairs.every(p => p.day <= C.NIGHTDAY.maxDay + 1e-9));
  A.nightDayPick(g, np.yoursAt); check('picking your pair is right', g.results[g.i].right); A.next(g);
  const jp = A.joyPairs(g); check('the moment offered beside a decoy', jp.offered.length === 2 && jp.offered.find(o => o.yours).secs === 4);
  A.joyPick(g, jp.yoursAt); check('picking your moment is right', g.results[g.i].right); A.next(g);
  check('the evening is done after twelve stations', g.done && g.i === 12);
  const v = A.verdict(g); check('the headline counts three inner spans known', /all three/.test(v.headline));
}
{
  const g = A.newGame(77); A.joy(g, 9);
  g.i = 11; const jp = A.joyPairs(g); check('a long moment gets a shorter decoy, never a longer one', jp.offered.find(o => !o.yours).secs < 9);
}

say('D. Words');
{
  let digits = 0, lines = 0, mono = true;
  for (let s = 1000; s < 2200; s++) {
    const g = A.newGame(s), R = () => 0.3 + Math.random() * 2, L = g.low;
    A.joy(g, 0.3 + Math.random() * 10); A.next(g); A.hold(g, L * R()); A.next(g); A.nightDay(g, 0.3 + Math.random() * 6, 0.3 + Math.random() * 6); A.next(g);
    A.zero(g); A.zeroPick(g, Math.floor(Math.random() * 5)); A.next(g); A.betweenHolds(g, g.pairs[0].long * Math.random() * 1.5, g.pairs[1].long * Math.random() * 1.5, g.pairs[1].long * Math.random()); A.next(g);
    A.planned(g, 0.3 + Math.random() * 5); A.plannedPick(g, Math.random() < 0.5 ? 0 : 1); A.next(g); A.sunHold(g, g.sun.stop * R()); A.next(g);
    A.threeThings(g, [0, 1, 2].map(() => 0.3 + Math.random() * 8)); A.threeThingsPick(g, Math.floor(Math.random() * 3)); A.next(g);
    A.hymnSing(g, [0, 1, 2, 3, 4, 5, 6, 7].map(() => 0.1 + Math.random() * 1.5)); A.hymnLongest(g, Math.floor(Math.random() * 8)); A.next(g);
    const P = g.tumult; A.tumult(g, Math.random() * (P.end + 1.5)); A.tumultCount(g, 2 + Math.floor(Math.random() * 5)); A.next(g);
    A.nightDayPairs(g); A.nightDayPick(g, Math.floor(Math.random() * 3)); A.next(g); A.joyPairs(g); A.joyPick(g, Math.random() < 0.5 ? 0 : 1); A.next(g);
    const v = A.verdict(g);
    [].concat.apply([], g.results.map(r => r.lines)).concat(v.did, [v.headline, v.says, v.means, v.torn, v.present, v.stranger, v.scales]).forEach(l => { lines++; if (!noDigits(l)) digits++; });
  }
  check('no decimal or digit reaches a sentence', digits === 0, lines + ' lines over 1,200 evenings of wild play');
  let last = -1; for (let x = 0.2; x < 12; x += 0.01) { const k = A.AMOUNTS.indexOf(A.amount(x)); if (k < last) mono = false; last = k; }
  check('fraction words never go down as the ratio goes up', mono);
}

say('E. Playing it in numbers: 400 evenings per player');
{
  const scatter = sd => Math.exp(sd * (Math.random() + Math.random() + Math.random() - 1.5) * 2);
  const players = {
    'steady (12 % scatter), hears relations, bisects by the clock': { sd: 0.12, ear: 0.9, mid: 'arith' },
    'steady, hears relations, bisects by ratio': { sd: 0.12, ear: 0.9, mid: 'geo' },
    'shaky (30 %), hears relations, by the clock': { sd: 0.30, ear: 0.9, mid: 'arith' },
    'steady, guesses the choices': { sd: 0.12, ear: 0, mid: 'arith' },
  };
  say('  player | low one | half | sun | hymn ratio | betweens read clock/ratio/mixed | inner spans known (of 3) | commonest headline');
  for (const name in players) {
    const P = players[name], heads = {}, miss = { first: [], half: [], sun: [], hymn: [] }, known = [], scales = {};
    for (let s = 0; s < 400; s++) {
      const g = A.newGame(5000 + s), L = g.low;
      const pickRight = (n, yoursAt) => Math.random() < P.ear ? yoursAt : Math.floor(Math.random() * n);
      A.joy(g, 1 + Math.random() * 5); A.next(g); const f = A.hold(g, L * scatter(P.sd)); A.next(g); A.nightDay(g, 1.5, 1.5 * (2 + Math.random())); A.next(g);
      A.zero(g); A.zeroPick(g, Math.random() < P.ear ? 4 : Math.floor(Math.random() * 4)); A.next(g);
      const bt = A.betweenHolds(g, g.pairs[0][P.mid] * scatter(P.sd), g.pairs[1][P.mid] * scatter(P.sd), g.pairs[1].long / 2 * scatter(P.sd)); A.next(g);
      const pl = A.planned(g, 1 + Math.random() * 3); A.plannedPick(g, pickRight(2, pl.offered.findIndex(o => o.yours))); A.next(g);
      const su = A.sunHold(g, g.sun.stop * scatter(P.sd)); A.next(g);
      const h3 = [1.5, 4, 2.5].map(x => x * scatter(P.sd)); const th = A.threeThings(g, h3); A.threeThingsPick(g, Math.random() < P.ear ? th.longest[0] : Math.floor(Math.random() * 3)); A.next(g);
      const hy = A.hymnSing(g, [0, 1, 2, 3, 4, 5, 6, 7].map(k => (k % 2 ? 0.84 : 0.42) * scatter(P.sd))); A.hymnLongest(g, hy.longest[0]); A.next(g);
      const T = g.tumult; A.tumult(g, T.lowEnd + (Math.random() - 0.5) * 0.4); A.tumultCount(g, T.size); A.next(g);
      const np = A.nightDayPairs(g); A.nightDayPick(g, pickRight(3, np.yoursAt)); A.next(g);
      const jp = A.joyPairs(g); A.joyPick(g, pickRight(2, jp.yoursAt)); A.next(g);
      const v = A.verdict(g); heads[v.headline.split(':')[0].split('.')[0]] = (heads[v.headline.split(':')[0].split('.')[0]] || 0) + 1;
      miss.first.push(abs(log(f.ratio))); miss.half.push(abs(log(bt.halfRatio))); miss.sun.push(abs(log(su.ratio))); miss.hymn.push(abs(log(hy.ratio / 2)));
      scales[bt.scale] = (scales[bt.scale] || 0) + 1;
      known.push([g.results[5].right, g.results[10].right, g.results[11].right].filter(Boolean).length);
    }
    const med = a => { a = a.slice().sort((x, y) => x - y); return Math.exp(a[Math.floor(a.length / 2)]).toFixed(2); };
    const top = Object.keys(heads).sort((a, b) => heads[b] - heads[a])[0];
    say('  ' + name + ' | ×' + med(miss.first) + ' | ×' + med(miss.half) + ' | ×' + med(miss.sun) + ' | ×' + med(miss.hymn) + ' | ' + (scales.clock || 0) + '/' + (scales.ratio || 0) + '/' + (scales.mixed || 0) + ' | ' + (known.reduce((a, b) => a + b, 0) / 400).toFixed(2) + ' | ' + top + ' (' + (heads[top] / 4).toFixed(0) + '%)');
    if (name.indexOf('bisects by the clock') >= 0) check('a steady clock-bisector is read as by the clock most evenings', (scales.clock || 0) >= 300, (scales.clock || 0) + ' of 400');
    if (name.indexOf('bisects by ratio') >= 0) check('a steady ratio-bisector is read as by ratio most evenings', (scales.ratio || 0) >= 300, (scales.ratio || 0) + ' of 400');
    if (name.startsWith('steady (12')) check('a steady player who hears relations knows all three inner spans most evenings', known.filter(k => k === 3).length >= 260, known.filter(k => k === 3).length + ' of 400');
    if (name.startsWith('steady, guesses')) check('a guesser knows about one of the three', abs(known.reduce((a, b) => a + b, 0) / 400 - (1 / 2 + 1 / 3 + 1 / 2)) < 0.15);
  }
}

say('');
say(pass + ' checks passed, ' + fail + ' failed');
require('fs').writeFileSync(__dirname + '/calibration-result.txt', out.join('\n') + '\n');
process.exit(fail ? 1 : 0);
