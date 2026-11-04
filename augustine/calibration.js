// Augustine's Clock (rebuild): the mechanism run headless, through the functions the browser calls.
// Run: node calibration.js   (calibration-result.txt is the saved output)
const A = require('./mechanism.js');
const C = A.CONFIG, out = [], say = s => { out.push(s); console.log(s); };
let pass = 0, fail = 0;
const check = (name, ok, note) => { if (ok) pass++; else fail++; say((ok ? 'pass' : 'FAIL') + '  ' + name + (note ? '  (' + note + ')' : '')); };
const log = Math.log, abs = Math.abs;
const noDigits = s => !/\d/.test(s);

say('A. The book and the deal');
{
  let apartOK = true, rangeOK = true, liveOK = true, crowdOK = true, sunOK = true, detOK = true, firstKick = true, laterKicks = { 2: 0, 0.5: 0 }, tries = 0;
  for (let s = 1000; s < 4000; s++) {
    const g = A.newGame(s, { first: s % 2 === 0 }), v = g.voices, lens = ['low', 'middle', 'high', 'top'].map(id => v[id].T).sort((a, b) => a - b);
    tries = Math.max(tries, g.tries);
    for (let k = 1; k < 4; k++) if (lens[k] - lens[k - 1] < C.LENGTH.apart - 1e-9) apartOK = false;
    lens.forEach(T => { if (T < C.LENGTH.min || T > C.LENGTH.max) rangeOK = false; });
    const ratio = v.top.T / v.low.T; if (ratio < C.LENGTH.liveVsLow && ratio > 1 / C.LENGTH.liveVsLow) liveOK = false;
    const p = g.stations[6].plan;
    if (!p.present.includes('low') || !p.present.includes('stranger') || p.present.length !== 2 + C.TUMULT.others) crowdOK = false;
    p.entries.forEach(e => { if (e.id !== 'low' && e.end <= p.lowEnd + C.TUMULT.extraMin - 1e-9) crowdOK = false; });
    if (p.sunStop >= p.lowEnd || p.sunStop <= p.lowStart) sunOK = false;
    if (s % 2 === 0 && g.kick !== C.WHEEL.kickFirst) firstKick = false; else if (s % 2 !== 0) laterKicks[g.kick]++;
    const g2 = A.newGame(s, { first: s % 2 === 0 }); if (JSON.stringify(g2.voices) !== JSON.stringify(v) || JSON.stringify(g2.stations[6].plan) !== JSON.stringify(p)) detOK = false;
  }
  check('four voices at least ' + C.LENGTH.apart + ' s apart', apartOK);
  check('every voice within ' + C.LENGTH.min + '–' + C.LENGTH.max + ' s', rangeOK);
  check('the top one at least ' + C.LENGTH.liveVsLow + '× or at most 1/' + C.LENGTH.liveVsLow + ' of the low one', liveOK, 'most draws needed: ' + tries);
  check('the crowd: the low one, two others and a stranger; the others outlast the low one', crowdOK);
  check('the sun stops after the low one begins and before it ends', sunOK);
  check('first evening always doubles the wheel', firstKick);
  check('later evenings double or halve it about evenly', abs(laterKicks[2] - laterKicks[0.5]) < 150, laterKicks[2] + ' / ' + laterKicks[0.5]);
  check('the same number deals the same evening', detOK);
}

say('B. The wheel in the silence');
{
  const g = A.newGame(2024, { first: true }), r = g.stations[5];
  check('the heard voice lasts exactly three turns', abs(A.wheelTurns(r, r.T, null) - 3) < 1e-9);
  const tp = r.T + 0.4;                           // the press, 0.4 s into the hum
  check('steady before the kick', abs(A.wheelTurns(r, tp + 0.5 * A.wheelPeriod(r), tp) - (tp / A.wheelPeriod(r) + 0.5)) < 1e-9);
  check('the kick lands ' + C.WHEEL.kickAfterTurns + ' turns after the press', abs(A.kickAt(r, tp) - (tp + C.WHEEL.kickAfterTurns * A.wheelPeriod(r))) < 1e-9);
  const after = A.wheelTurns(r, A.kickAt(r, tp) + A.wheelPeriod(r), tp) - A.wheelTurns(r, A.kickAt(r, tp), tp);
  check('after the kick the wheel runs at ' + r.factor + '× its pace', abs(after - r.factor) < 1e-9);
  const cr = A.countRatio(r);
  check('counting three turns gives ' + cr.toFixed(3) + ' of the voice (doubled)', cr < 0.7 && cr > 0.55);
  g.i = 5; const counted = A.silence(g, cr * r.T), saw = A.silence(g, r.T);
  check('a hold at the counting point reads as counted', counted.reading === 'counted');
  check('a hold at the voice reads as saw', saw.reading === 'saw');
  const gh = A.newGame(2025, { first: false }); gh.kick = 0.5; gh.stations[5].factor = 0.5; gh.i = 5; const rh = gh.stations[5];
  const crh = A.countRatio(rh); check('halved: counting gives ' + crh.toFixed(3) + ' of the voice', crh > 1.5 && crh < 2);
  check('halved: the counting point reads as counted, the voice as saw', A.silence(gh, crh * rh.T).reading === 'counted' && A.silence(gh, rh.T).reading === 'saw');
}

say('C. Against a voice, the tumult, the last silence');
{
  const g = A.newGame(3101, { first: true }), r = g.stations[4]; g.i = 4;
  check('a hold at the top one’s length reads as pulled', A.against(g, r.liveT).reading === 'pulled');
  check('a hold at the low one’s length reads as held', A.against(g, r.T).reading === 'held');
  g.i = 6; const p = g.stations[6].plan;
  const caught = A.tumult(g, p.lowStart + 0.2, p.lowEnd + 0.1), waited = A.tumult(g, p.lowStart + 0.2, p.end + 0.5), missed = A.tumult(g, null, null), late = A.tumult(g, p.lowStart + 1.2, p.lowEnd - 0.8);
  check('a release on the moment reads as caught', caught.reading === 'caught' && caught.found === 'atonce');
  check('a release at the crowd’s end reads as waited', waited.reading === 'waited');
  check('never pressing reads as missed', missed.reading === 'missed' && missed.pressAt == null);
  check('a late press is said as late, an early release as early', late.found === 'late' && /before it stopped/.test(late.lines[1]));
  const h = A.heard(g, p.present.slice()); check('naming the crowd exactly: 5 of 5', h.right.length === 5 && h.wrong.length === 0);
  const h2 = A.heard(g, ['low', 'stranger']); check('naming two: the missing ones are listed', h2.heardLines.some(l => /unnamed/.test(l)));
  g.i = 7; const la = A.last(g, g.voices.low.T * 0.9); check('the last silence is measured against the low one', abs(la.ratio - 0.9) < 1e-9);
}

say('D. Words');
{
  let digits = 0, lines = 0, mono = true;
  for (let s = 1000; s < 2200; s++) {
    const g = A.newGame(s, { first: s % 3 === 0 }), R = () => 0.3 + Math.random() * 2;
    g.i = 0; A.hold(g, g.voices.low.T * R()); g.i = 1; A.hold(g, g.voices.middle.T * R()); g.i = 2; A.hold(g, g.voices.low.T * R()); g.i = 3; A.hold(g, g.voices.middle.T * R());
    g.i = 4; A.against(g, g.voices.low.T * R()); g.i = 5; A.silence(g, g.voices.high.T * R());
    const p = g.stations[6].plan; g.i = 6; const pr = Math.random() < 0.1 ? null : p.lowStart + Math.random() * 1.5; A.tumult(g, pr, pr == null ? null : pr + Math.random() * (p.end + 1 - pr)); A.heard(g, ['low', 'top'].filter(() => Math.random() < 0.7));
    g.i = 7; A.last(g, g.voices.low.T * R()); g.i = 8; g.done = true;
    const v = A.verdict(g);
    [].concat.apply([], g.results.map(r => r.lines.concat(r.heardLines || []))).concat(v.did, [v.headline, v.says, v.means, v.torn, v.present]).forEach(l => { lines++; if (!noDigits(l)) digits++; });
  }
  check('no decimal or digit reaches a sentence (the chips’ "n of 5" aside)', digits === 0, lines + ' lines');
  let last = -1; for (let x = 0.2; x < 5; x += 0.01) { const k = A.AMOUNTS.indexOf(A.amount(x)); if (k < last) mono = false; last = k; }
  check('fraction words never go down as the ratio goes up', mono);
  check('seconds words at their values', A.secondsWords(0.05) === 'a tenth of a second' && A.secondsWords(0.5) === 'half a second' && A.secondsWords(1) === 'a second' && A.secondsWords(2.6) === 'two and a half seconds');
}

say('E. Playing it in numbers: 400 evenings per player');
{
  const scatter = sd => Math.exp(sd * (Math.random() + Math.random() + Math.random() - 1.5) * 2);
  const players = {
    'memory, steady (12%)': { sd: 0.12, pull: 0, count: false, wait: false },
    'memory, shaky (30%)': { sd: 0.30, pull: 0, count: false, wait: false },
    'half pulled by the live voice': { sd: 0.12, pull: 0.5, count: false, wait: false },
    'wheel counter': { sd: 0.12, pull: 0, count: true, wait: false },
    'sun watcher': { sd: 0.12, pull: 0, count: false, wait: true },
    'the learned man (all three)': { sd: 0.12, pull: 1, count: true, wait: true },
  };
  say('  player | typical miss (plain holds) | pulled | counted | waited | commonest headline');
  for (const name in players) {
    const P = players[name], heads = {}, reads = { pulled: 0, counted: 0, waited: 0 }, misses = [];
    for (let s = 0; s < 400; s++) {
      const g = A.newGame(5000 + s, { first: s % 2 === 0 }), v = g.voices;
      const hold = (T) => T * scatter(P.sd);
      g.i = 0; A.hold(g, hold(v.low.T)); g.i = 1; A.hold(g, hold(v.middle.T)); g.i = 2; A.hold(g, hold(v.low.T)); g.i = 3; A.hold(g, hold(v.middle.T));
      g.i = 4; const target = Math.exp((1 - P.pull) * log(v.low.T) + P.pull * log(v.top.T)); const ag = A.against(g, hold(target));
      g.i = 5; const r5 = g.stations[5]; const sil = A.silence(g, P.count ? A.countRatio(r5) * r5.T * scatter(0.05) : hold(v.high.T));
      g.i = 6; const p = g.stations[6].plan; const tu = A.tumult(g, p.lowStart + 0.2 + Math.random() * 0.3, P.wait ? p.end + 0.3 : p.lowEnd + (Math.random() - 0.5) * 0.4); A.heard(g, p.present);
      g.i = 7; A.last(g, hold(v.low.T)); g.i = 8; g.done = true;
      const vd = A.verdict(g); heads[vd.headline] = (heads[vd.headline] || 0) + 1;
      if (ag.reading === 'pulled') reads.pulled++; if (sil.reading === 'counted') reads.counted++; if (tu.reading === 'waited') reads.waited++;
      [0, 2, 7].forEach(k => misses.push(abs(log(g.results[k].ratio))));
    }
    misses.sort((a, b) => a - b); const med = misses[Math.floor(misses.length / 2)];
    const top = Object.keys(heads).sort((a, b) => heads[b] - heads[a])[0];
    say('  ' + name + ' | ×' + Math.exp(med).toFixed(2) + ' | ' + (reads.pulled / 4).toFixed(0) + '% | ' + (reads.counted / 4).toFixed(0) + '% | ' + (reads.waited / 4).toFixed(0) + '% | ' + top + ' (' + (heads[top] / 4).toFixed(0) + '%)');
    if (name === 'memory, steady (12%)') check('a steady memory player gets the clean headline nearly always', heads[top] >= 360 && /all evening/.test(top));
    if (name === 'wheel counter') check('a wheel counter is read as counted every time', reads.counted >= 390);
    if (name === 'sun watcher') check('a sun watcher is read as waited every time', reads.waited >= 390);
    if (name === 'the learned man (all three)') check('the learned man gets all three faults named', /pulled.*wheel.*sun|mostly/.test(top));
  }
}

say('');
say(pass + ' checks passed, ' + fail + ' failed');
require('fs').writeFileSync(__dirname + '/calibration-result.txt', out.join('\n') + '\n');
process.exit(fail ? 1 : 0);
