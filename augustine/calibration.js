// Augustine's Clock — the calibration check. Runs the mechanism headless, through the same functions the browser calls.
// Run: node calibration.js   (calibration-result.txt is the saved output)
//
// A. The paper's numbers: the hymn line, its long and short syllables, the chain of ch. XV, the sun that stands still,
//    the wheel that keeps its pace or is kicked. B. The draw, over 2000 evenings. C. Words: no digits on screen, the
//    fraction words right at their anchors. D. Playing it in numbers: simulated players through whole evenings.
//    E. Robustness: the central discovery under other choices of ours.
const A = require('./mechanism.js');
const out = []; let pass = 0, fail = 0;
const log = s => { out.push(s); console.log(s); };
const check = (name, ok, detail) => { (ok ? pass++ : fail++); log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : '')); };
const P = A.CONFIG.PAPER;
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const gauss = R => { let u = 0, v = 0; while (u === 0) u = R(); while (v === 0) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const fmt = x => (Math.round(x * 100) / 100).toFixed(2);

log('Augustine’s Clock: calibration check');
log('');
log('A. The paper’s numbers');
{
  const syl = A.hymnVoice();
  check('A1 the hymn line has eight syllables, "De-us cre-a-tor om-ni-um" (ch. XXVII)', syl.length === 8 && syl.map(s => s.text).join('') === 'Deuscreatoromnium');
  check('A2 the second, fourth, sixth and eighth are long; the others short (ch. XXVII)', syl.every((s, k) => s.long === (k % 2 === 1)));
  const shorts = syl.filter(s => !s.long).map(s => s.dur), longs = syl.filter(s => s.long).map(s => s.dur);
  check('A3 every long is exactly double every short: "hath a double time" (ch. XXVII)', longs.every(l => shorts.every(s => Math.abs(l / s - 2) < 1e-12)), 'long/short = ' + fmt(longs[0] / shorts[0]));
  const ch = P.PRESENT_CHAIN;
  check('A4 the chain of ch. XV: a hundred years, twelve months, (a month), twenty-four hours, (an hour)', ch[0].parts === 100 && ch[1].parts === 12 && ch[3].parts === 24 && ch.length === 5);
  let mid = true;
  for (let s = 1000; s < 3000; s++) { const g = A.newGame(s); g.prologue.forEach(st => { if (st.now <= 0 || st.now >= st.parts - 1) mid = false; }); }
  check('A5 "now" is always a middle part, with some past and some to come (ch. XV: "any middle year")', mid);
  let still = true, climbs = true;
  for (let s = 1000; s < 1500; s++) { const r = A.newGame(s).rounds[3];
    for (let k = 1; k <= 20; k++) { const t = r.T * k / 20; if (!(A.sunAt(r, t) > A.sunAt(r, t - r.T / 20))) climbs = false; }
    for (let k = 0; k <= 40; k++) { const t = r.T + k * 0.5; if (A.sunAt(r, t) !== A.sunAt(r, r.T)) still = false; } }
  check('A6 the sun climbs while the voice sounds, and stands still from the moment it stops (ch. XXIII)', climbs && still);
  let three = true, steady = true, kickOk = true;
  for (let s = 1000; s < 1500; s++) { const g = A.newGame(s, { first: s % 2 === 0 });
    const w = g.rounds[1], k = g.rounds[2];
    if (!near(A.wheelTurns(w, w.T, null), 3, 1e-9) || !near(A.wheelTurns(k, k.T, null), 3, 1e-9)) three = false;
    for (let t = 0; t < 20; t += 0.37) if (!near(A.wheelTurns(w, t, 4) * A.wheelPeriod(w), t, 1e-9)) steady = false;
    const tp = k.T + 0.5, d = A.CONFIG.WHEEL.kickDelay, P0 = A.wheelPeriod(k);
    const rate = (A.wheelTurns(k, tp + d + 2, tp) - A.wheelTurns(k, tp + d + 1, tp)) * P0;
    const before = (A.wheelTurns(k, tp + d, tp) - A.wheelTurns(k, tp + d - 0.2, tp)) * P0 / 0.2;
    if (!near(rate, k.factor, 1e-9) || !near(before, 1, 1e-9)) kickOk = false; }
  check('A7 the voice lasts exactly three turns of the wheel, in both wheel rounds', three);
  check('A8 the steady wheel keeps its pace through the hold, "with equal pauses" (ch. XXIII)', steady);
  check('A9 the kicked wheel keeps its pace until the kick lands, then runs at the kick’s pace (ch. XXIII: "sometimes slower, otherwhiles quicker")', kickOk);
  let firstSame = true; for (let s = 1000; s < 3000; s++) { const g = A.newGame(s); if (g.rounds[6].T !== g.rounds[0].T) firstSame = false; }
  check('A10 the last round’s target is exactly the first voice', firstSame);
}

log('');
log('B. The draw, over 2000 evenings (seeds 1000–2999)');
{
  const V = A.CONFIG.VOICE, Ts = [], facs = { 2: 0, 0.5: 0 }; let firstTwo = true, det = true;
  for (let s = 1000; s < 3000; s++) {
    const g = A.newGame(s), f = A.newGame(s, { first: true });
    g.rounds.forEach(r => { if (['voice', 'wheel', 'kick', 'sun', 'silence'].includes(r.id)) Ts.push(r.T); });
    facs[g.rounds[2].factor]++;
    if (f.rounds[2].factor !== 2) firstTwo = false;
    if (JSON.stringify(A.newGame(s)) !== JSON.stringify(g)) det = false;
  }
  const mn = Math.min(...Ts), mx = Math.max(...Ts), mean = Ts.reduce((a, b) => a + b, 0) / Ts.length;
  check('B1 every voice lasts between ' + V.min + ' and ' + V.max + ' seconds; the draw is flat (mean near the middle)', mn >= V.min && mx <= V.max && near(mean, (V.min + V.max) / 2, 0.05), 'min ' + fmt(mn) + ', max ' + fmt(mx) + ', mean ' + fmt(mean));
  check('B2 the first evening’s kick always doubles the wheel', firstTwo);
  check('B3 later evenings: the wheel is doubled or halved, about evenly', near(facs[2] / 2000, 0.5, 0.04), 'doubled ' + facs[2] + ', halved ' + facs[0.5]);
  check('B4 the same evening number deals the same evening', det);
}

log('');
log('C. Words');
{
  const anchors = A.AMOUNTS.every(a => A.amount(a.x) === a);
  check('C1 each fraction word is chosen at its own value (a half is "half", one is "the same", two is "double")', anchors && A.amount(0.5).big === 'half' && A.amount(1).big === 'the same' && A.amount(2).big === 'double');
  let mono = true, prev = -1; for (let x = 0.2; x < 5; x *= 1.01) { const i = A.AMOUNTS.indexOf(A.amount(x)); if (i < prev) mono = false; prev = i; }
  check('C2 the words never go down as the ratio goes up', mono);
  let agree = true; for (let x = 0.2; x < 5; x *= 1.003) { const a = A.amount(x).x, q = A.verdictWord(x); if ((a >= 1 && q) || (a < 1 && !q) || (a === 0.9 && q !== 'a little short') || (a <= 0.5 && q !== 'well short')) agree = false; }
  check('C3 the qualifier always agrees with the fraction word: "the same" and longer are unqualified; nine tenths is "a little short"; half or less "well short"', agree);
  // play 3000 random evenings with wild holds; no digit may reach a line on screen
  let digits = 0, total = 0, sample = '';
  for (let s = 0; s < 3000; s++) {
    const R = A.rng(s + 7), g = A.newGame(1000 + s, { first: s % 3 === 0 }), wild = () => Math.exp(gauss(R) * 0.8);
    const rs = [];
    for (const r of g.rounds) {
      if (r.id === 'silence') rs.push(A.silence(g, r.T * wild()));
      else if (r.id === 'hymn') { const d = A.hymnVoice().map(x => x.dur * wild()); rs.push(A.sing(g, d, d.reduce((a, b) => a + b, 0) + 0.5)); const iS = 2 * Math.floor(R() * 4), iL = 2 * Math.floor(R() * 4) + 1; rs.push(A.lay(g, iS, iL)); }
      else rs.push(A.hold(g, Math.min(r.T * wild(), r.T * 6), r.T + 0.4 + R()));
      A.next(g);
    }
    const v = A.verdict(g);
    const texts = [].concat(...rs.map(x => x.lines.concat([x.big])), v.did, [v.headline, v.says, v.means, v.psalm, v.before]);
    texts.forEach(t => { total++; if (/\d/.test(t)) { digits++; sample = t; } });
  }
  check('C4 no digit in any line on screen, over 3000 evenings of wild holds', digits === 0, total + ' lines' + (sample ? '; e.g. ' + sample : ''));
}

// ---- simulated players
function playEvening(seed, who, first) {
  const g = A.newGame(seed, { first }), R = A.rng(seed * 31 + 5);
  const noisy = (T, cv, bias) => T * (bias || 1) * Math.exp(gauss(R) * cv);
  for (const r of g.rounds) {
    const react = 0.4 + 0.5 * R(), tp = r.T + react;           // press comes a little after the voice stops
    if (r.id === 'silence') A.silence(g, noisy(r.T, who.cv, who.bias));
    else if (r.id === 'hymn') {
      const sh = 0.42 * Math.exp(gauss(R) * 0.15) * (who.bias || 1), ratio = who.ls || 1.6;
      const d = A.hymnVoice().map(x => x.long ? sh * ratio * Math.exp(gauss(R) * 0.12) : sh * Math.exp(gauss(R) * 0.12));
      A.sing(g, d, d.reduce((a, b) => a + b, 0) + 7 * 0.15); A.lay(g, 0, 1);
    } else if (r.id === 'kick' && who.counts) {
      // count as many turns from the press as the voice lasted: solve wheelTurns(tp + h) - wheelTurns(tp) = turns
      const n = A.CONFIG.WHEEL.turns;
      let lo = 0, hi = r.T * 6; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (A.wheelTurns(r, tp + m, tp) - A.wheelTurns(r, tp, tp) < n) lo = m; else hi = m; }
      A.hold(g, lo * Math.exp(gauss(R) * 0.05), tp);
    } else if (r.id === 'sun' && who.waits) A.hold(g, A.holdCap(r), tp);
    else A.hold(g, noisy(r.T, who.cv, who.bias), tp);
    A.next(g);
  }
  return g;
}

log('');
log('D. Playing it in numbers: 300 evenings per player (later evenings: the wheel doubled or halved)');
const PLAYERS = [
  { name: 'Memory, steady (holds the voice in mind; 12% scatter)', cv: 0.12 },
  { name: 'Memory, shaky (30% scatter)', cv: 0.30 },
  { name: 'Hurrier (memory, but a fifth short)', cv: 0.12, bias: 0.8 },
  { name: 'Wheel counter (counts the voice\u2019s three turns after the kick)', cv: 0.12, counts: true },
  { name: 'Sun watcher (waits for the sun to move)', cv: 0.12, waits: true },
  { name: 'The learned man (counts the wheel, waits for the sun)', cv: 0.12, counts: true, waits: true },
];
const table = [];
for (const who of PLAYERS) {
  const heads = {}, close = {}, kickErr = [], sunErr = [], memErr = [];
  let counted = 0, waited = 0;
  for (let s = 0; s < 300; s++) {
    const g = playEvening(2000 + s, who, false), v = A.verdict(g);
    heads[v.headline] = (heads[v.headline] || 0) + 1;
    const c = v.did[0].replace(/^.*you came (.*) of it\.$/, '$1'); close[c] = (close[c] || 0) + 1;
    const k = g.results[2], su = g.results[3];
    if (k.reading === 'counted') counted++; if (su.reading === 'waited') waited++;
    kickErr.push(Math.abs(Math.log(k.ratio))); sunErr.push(Math.abs(Math.log(su.ratio)));
    g.results.filter(r => ['voice', 'wheel', 'silence', 'first'].includes(r.id)).forEach(r => memErr.push(Math.abs(Math.log(r.ratio))));
  }
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
  table.push({ who, counted, waited, kick: Math.exp(med(kickErr)), sun: Math.exp(med(sunErr)), mem: Math.exp(med(memErr)), head: top(heads), close: top(close) });
}
log('| Player | Memory rounds: typical miss | Kick round: typical miss | Sun round: typical miss | Read as counting | Read as waiting | Commonest headline |');
log('|---|---|---|---|---|---|---|');
table.forEach(t => log('| ' + t.who.name + ' | ×' + fmt(t.mem) + ' | ×' + fmt(t.kick) + ' | ×' + fmt(t.sun) + ' | ' + Math.round(t.counted / 3) + '% | ' + Math.round(t.waited / 3) + '% | ' + t.head[0] + ' (' + Math.round(t.head[1] / 3) + '%) |'));
log('(typical miss: the median factor by which a hold missed its target; ×1.00 is exact)');
{
  const mem = table[0], cnt = table[3], sw = table[4], lm = table[5];
  check('D1 the decisions matter: in the kick round the counter misses by about the kick (×2), the memory player by its own scatter', cnt.kick > 1.7 && mem.kick < 1.15, 'counter ×' + fmt(cnt.kick) + ', memory ×' + fmt(mem.kick));
  check('D2 counting is read as counting nearly always; memory is almost never read as counting', cnt.counted / 300 > 0.97 && mem.counted / 300 < 0.05, 'counter ' + cnt.counted + '/300, memory ' + mem.counted + '/300');
  check('D3 the sun watcher is read as waiting; the memory player is not', sw.waited === 300 && mem.waited / 300 < 0.02, 'watcher ' + sw.waited + '/300, memory ' + mem.waited + '/300');
  check('D4 the four headlines go to the four kinds of player', mem.head[0].startsWith('You kept time with no clock') && cnt.head[0].includes('a wheel ran away') && sw.head[0].includes('waited for the sun') && lm.head[0].includes('learned man'));
  check('D5 the steady memory player is told "within about a tenth"; the shaky one is told less', table[0].close[0] === 'within about a tenth' && table[1].close[0] !== 'within about a tenth', 'steady: ' + table[0].close[0] + '; shaky: ' + table[1].close[0]);
}

log('');
log('E. Robustness: the discovery is that counting a moving body fails when its pace changes, while a hold made from the');
log('   voice in memory does not. Each of our choices varied in turn; 300 evenings each, counter and steady memory player.');
const W = A.CONFIG.WHEEL, V = A.CONFIG.VOICE;
const saved = JSON.parse(JSON.stringify({ W, V }));
const variants = [
  ['kick ×1.5 / ×⅔', () => { W.kickChoices = [1.5, 2 / 3]; }],
  ['kick ×3 / ×⅓', () => { W.kickChoices = [3, 1 / 3]; }],
  ['kick lands at 0.1 s', () => { W.kickDelay = 0.1; }],
  ['kick lands at 0.6 s', () => { W.kickDelay = 0.6; }],
  ['two turns per voice', () => { W.turns = 2; }],
  ['five turns per voice', () => { W.turns = 5; }],
  ['short voices, 1.5–2.5 s', () => { V.min = 1.5; V.max = 2.5; }],
  ['long voices, 4–6 s', () => { V.min = 4; V.max = 6; }],
];
for (const [name, set] of variants) {
  set();
  let cMiss = [], mMiss = [], cRead = 0, mRead = 0;
  for (let s = 0; s < 300; s++) {
    const gc = playEvening(5000 + s, PLAYERS[3], false), gm = playEvening(5000 + s, PLAYERS[0], false);
    const kc = gc.results[2], km = gm.results[2];
    cMiss.push(Math.abs(Math.log(kc.ratio * kc.factor)));   // the counter's hold against 1/kick
    mMiss.push(Math.abs(Math.log(km.ratio)));
    if (kc.reading === 'counted') cRead++; if (km.reading === 'counted') mRead++;
  }
  const med = a => Math.exp(a.slice().sort((x, y) => x - y)[150]);
  check('E ' + name + ': the counter lands near 1/kick of the voice, the memory player near the voice; readings right',
    med(cMiss) < 1.3 && med(mMiss) < 1.15 && cRead / 300 > 0.9 && mRead / 300 < 0.1,
    'counter off 1/kick by ×' + fmt(med(cMiss)) + ', memory off by ×' + fmt(med(mMiss)) + '; read as counting: counter ' + cRead + ', memory ' + mRead);
  Object.assign(W, saved.W); Object.assign(V, saved.V);
}

log('');
log('Result: ' + pass + ' passed, ' + fail + ' failed.');
require('fs').writeFileSync(require('path').join(__dirname, 'calibration-result.txt'), out.join('\n') + '\n');
process.exit(fail ? 1 : 0);
