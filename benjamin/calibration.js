// Calibration check for Benjamin's Veil. Run: node calibration.js  (writes calibration-result.txt)
// The essay has no numbers, so the mechanism (a toy) is checked against the essay's CLAIMS (memo, section 17):
//   (P1) the halo is a stock only showing spends; the eyes of the age are what change (sections II, III, VI);
//   (P2) no copy carries the halo whole; the photograph carries the most of any copy, film little (sections II, VI, VIII);
//   (P3) the ladder's costs: the halo spent rises with the means, the coin excepted by design;
//   (P4) irreversibility: a halo once spent never recovers (section II);
//   (P5) reach grows with the technique (section I);
//   (P6) heuristics: the best age to open is the print shop or the studio; the two ends are punished;
//   (P7) robustness of P6 under the crowd's price at half and double, and a slower eyes schedule;
//   (W)  words: no decimals on screen; every slab labelled and explained.
const M = require('./mechanism.js');
const C = M.CONFIG, fs = require('fs');
const out = []; let pass = 0, fail = 0;
function check(name, ok, detail) { (ok ? pass++ : fail++); out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); }
const f2 = x => x.toFixed(2);

// ---- P1: the halo is a stock that only showing spends; the eyes of the age are what change
const veiled = M.runSchedule([0, 0, 0, 0, 0, 0]);
const stock = veiled.results.map(r => r.halo), seen = veiled.results.map(r => r.haloSeen);
out.push('      never lifted: the stock by age ' + stock.map(f2).join(' ') + '; what the eyes of the age would see of it ' + seen.map(f2).join(' '));
check('P1 never lifted: the halo stays whole through all six ages', stock.every(h => h === 1));
check('P1b never lifted: what the eyes of the cinema can see of a whole halo is below a tenth', seen[5] < 0.1, f2(seen[5]));
check('P1c the eyes change little before the print shop (above three quarters at the cathedral)', seen[2] > 0.75, f2(seen[2]));

// ---- P2: no copy carries the halo whole; presence does; the photograph carries the most of any copy, film little
check('P2 presence carries the halo whole, no copy does', C.VEILS[0].carry === 1 && C.VEILS[1].carry === 1 && C.VEILS.slice(2).every(v => v.carry < 1));
check('P2b the photograph carries more than any other copy (section VI: the aura emanates for the last time)', C.VEILS.slice(2).every(v => v.carry <= C.VEILS[5].carry));
check('P2c film carries less than the woodcut (the screen cannot carry presence)', C.VEILS[6].carry < C.VEILS[3].carry);
check('P2d with no change of eyes at all, hoarding would win: the eyes are what make the splash fail', (() => { const b = M.bestSchedule(M.withConfig({ AGES: C.AGES.map(a => ({ ...a, eyes: 1 })) })); return b.sched.findIndex(v => v > 0) >= 3; })());

// ---- P3: the ladder's costs
let strict = true;
C.VEILS.forEach((v, i) => { if (i && i !== 2 && i !== 3 && !(M.haloAfterVeil(0.5, i) < M.haloAfterVeil(0.5, i - 1))) strict = false; });
check('P3 the halo spent rises up the ladder (the coin excepted, by design)', strict);
check('P3b film spends the whole halo', M.haloAfterVeil(1, 6) === 0);
check('P3c the coin spends more of the halo than the woodcut, for fewer eyes, and carries less: the tempting mistake', C.VEILS[2].n > C.VEILS[3].n && C.VEILS[2].reach < C.VEILS[3].reach && C.VEILS[2].carry < C.VEILS[3].carry);

// ---- P4: irreversibility, over all schedules the stock never rises
let nonInc = true, count = 0;
(function rec(i, sched) {
  if (i === C.AGES.length) { const s = M.runSchedule(sched); let prev = 1; for (const r of s.results) { if (r.haloArrived > prev + 1e-12 || r.halo > r.haloArrived + 1e-12) nonInc = false; prev = r.halo; } count++; return; }
  for (let v = 0; v <= C.AGES[i].ceiling; v++) rec(i + 1, sched.concat(v));
})(0, []);
check('P4 the halo is non-increasing over every schedule', nonInc, count + ' schedules');

// ---- P5
let grows = true;
for (let i = 1; i < C.AGES.length; i++) if (!(C.VEILS[C.AGES[i].ceiling].reach > C.VEILS[C.AGES[i - 1].ceiling].reach)) grows = false;
check('P5 the widest reach available grows strictly from age to age', grows, C.AGES.map(a => f2(C.VEILS[a.ceiling].reach)).join(' '));
check('P5b each age opens exactly one new rung, and film only at the cinema', C.AGES.every((a, i) => a.ceiling === i + 1) && C.AGES.findIndex(a => a.ceiling === 6) === 5);
check('P5c what an age announces is what it offers: every age from the temple on names its new rung', C.AGES.slice(1).every((a) => a.newThis.toLowerCase().includes({ coins: 'coin', woodcuts: 'woodcut', lithos: 'lithograph', photos: 'photograph', film: 'film' }[C.VEILS[a.ceiling].key])));

// ---- P6: heuristics
const H = M.heuristics();
out.push('      heuristics (memo, build.md section 3):');
H.forEach(h => out.push(`        ${h.name.padEnd(26)} ${h.sched.join('')}  total ${f2(h.total)}   by age ${h.perAge.map(f2).join(' ')}`));
const best = H[H.length - 1];
const get = n => H.find(h => h.name === n);
const bestOpen = best.sched.findIndex(v => v >= 3);
check('P6 the best schedule first prints at the cathedral or the print shop', bestOpen === 2 || bestOpen === 3, C.AGES[bestOpen].key);
check('P6a the best schedule climbs the ladder: after its first print it takes each new rung as it comes', best.sched.slice(bestOpen).every((v, k) => v === C.AGES[bestOpen + k].ceiling), best.sched.join(''));
check('P6b always veiled lands below a tenth of the best: a halo nobody sees moves nobody', get('always veiled').total < 0.1 * best.total, f2(get('always veiled').total / best.total));
check('P6c always the newest rung lands below the best, and opening at the cathedral or the print shop beats it', get('always the newest rung').total < best.total && Math.max(get('open at the cathedral').total, get('open at the print shop').total) > get('always the newest rung').total, f2(get('always the newest rung').total / best.total));
check('P6d open at the print shop is within a tenth of the best', get('open at the print shop').total > 0.9 * best.total, f2(get('open at the print shop').total / best.total));
check('P6e the later the single opening after the print shop, the worse: studio below print shop, cinema below studio', get('open at the studio').total < get('open at the print shop').total && get('open at the cinema').total < get('open at the studio').total);
check('P6f wait then splash on film lands below three fifths of the best: five crowds saw nothing and the sixth saw a screen', get('open at the cinema').total < 0.6 * best.total, f2(get('open at the cinema').total / best.total));
check('P6g print then back in the dark lands below half of the best: the halo does not return', get('print, then back in the dark').total < 0.5 * best.total, f2(get('print, then back in the dark').total / best.total));
check('P6j the coin is a tempting mistake: coins at the temple then the newest lands between four fifths and nineteen twentieths of the best', get('coins at the temple, then the newest').total > 0.8 * best.total && get('coins at the temple, then the newest').total < 0.95 * best.total, f2(get('coins at the temple, then the newest').total / best.total));
check('P6h the best path opens step by step: the veil never narrows along it', best.sched.every((v, i) => i === 0 || v >= best.sched[i - 1]), best.sched.join(''));
const spread = Math.max(...H.map(h => h.total)) - Math.min(...H.map(h => h.total));
check('P6i the heuristics spread: the decision matters (range above half of the best)', spread > 0.5 * best.total, f2(spread));

// ---- P7: robustness. The three numbers the revision introduced (section 17 of the memo), each moved both ways.
function shape(cfg, label) {
  const h = M.heuristics(cfg); const b = h[h.length - 1]; const o = b.sched.findIndex(v => v >= 3);
  const veiledR = h.find(x => x.name === 'always veiled').total / b.total, wideR = h.find(x => x.name === 'always the newest rung').total / b.total;
  out.push(`      ${label}: best ${b.sched.join('')} (prints first at ${C.AGES[o].key}); always veiled ${f2(veiledR)} of best; always widest ${f2(wideR)} of best`);
  return { open: o, veiledR, wideR, sched: b.sched };
}
const variants = [
  shape(M.withConfig({ W_SEEN: 0.1 }), 'being seen worth a tenth'),
  shape(M.withConfig({ W_SEEN: 0.4 }), 'being seen worth two fifths'),
  shape(M.withConfig({ PEOPLE_CURVE: 0.35 }), 'people counted more flatly'),
  shape(M.withConfig({ PEOPLE_CURVE: 0.75 }), 'people counted more steeply'),
  shape(M.withConfig({ AGES: JSON.parse(JSON.stringify(C.AGES)).map(a => ({ ...a, eyes: 1 - (1 - a.eyes) * 2 / 3 })) }), 'eyes declining a third more slowly')
];
check('P7 under all five variants the best schedule first prints at the cathedral or the print shop', variants.every(x => x.open >= 2 && x.open <= 3));
check('P7b under all five always veiled stays below a fifth of the best', variants.every(x => x.veiledR < 0.2));
check('P7c under all five always the newest rung stays below the best', variants.every(x => x.wideR < 1));
check('P7d under all five the best path never narrows the veil', variants.every(x => x.sched.every((v, i) => i === 0 || v >= x.sched[i - 1])));

// ---- W: words
const strings = [];
C.AGES.forEach(a => { strings.push(a.name, a.date, a.newThis, a.eyesLine || ''); a.crowd.forEach(c => strings.push(c)); });
C.VEILS.forEach(v => strings.push(v.label, v.who)); strings.push(C.EPILOGUE);
const s = M.newGame(); for (let i = 0; i < 6; i++) { M.arrive(s); strings.push(M.arrivalLine(s)); strings.push(M.commit(s, Math.min(i < 2 ? 0 : i + 1, C.AGES[i].ceiling)).line); M.next(s); } const v = M.verdict(s); strings.push(v.lead, v.did, v.benjamin, v.epilogue, v.faceNow);
check('S the verdict carries no score, no fraction and no best path: it describes', (() => { const v = M.verdict(M.runSchedule([0, 1, 3, 4, 5, 6])); return v.score === undefined && v.shortfall === undefined && v.bestResults === undefined && !/most a keeper could have done|could have moved/.test(v.lead + v.did + v.benjamin); })());
check('S2 the five families sort the paths: dark, cult, people, late, splash', ['dark', 'cult', 'people', 'late', 'splash'].every((f, i) => M.familyOf(M.runSchedule([[0,0,0,0,0,0],[1,1,1,1,1,1],[0,1,3,4,5,6],[0,0,0,0,5,6],[0,0,0,0,0,6]][i])) === f));
check('S3 every family\'s lead is a sentence about what happened, none a grade', ['dark', 'cult', 'people', 'late', 'splash'].every((f, i) => { const v = M.verdict(M.runSchedule([[0,0,0,0,0,0],[1,1,1,1,1,1],[0,1,3,4,5,6],[0,0,0,0,5,6],[0,0,0,0,0,6]][i])); return /\.$/.test(v.lead) && !/\d|best|better|worse|could have/.test(v.lead); }));
check('W no decimals in any string the screen shows', strings.every(t => !/\d\.\d/.test(t)));
check('W2 every slab has a label and a meaning, and the epilogue ends on Benjamin\'s line', C.VEILS.every(x => x.label && x.who) && /though the world perish/.test(C.EPILOGUE));
check('W3 every age has a technique, a line for what is new, and a crowd word up to its ceiling', C.AGES.every(a => a.technique && a.newThis && a.crowd.slice(0, a.ceiling + 1).every(c => c)));
check('W4 halo words cover the range', ['bright', 'a little thinner', 'about half what it was', 'a quarter of what it was', 'almost gone', 'gone'].every((w, i) => M.haloWords([1, 0.7, 0.5, 0.25, 0.1, 0.01][i]) === w));
check('W5 the verdict for the print-then-put-away path says the copies stayed out', /copies stayed out/.test(M.verdict(M.runSchedule([0, 0, 0, 4, 0, 0])).did));
check('W5b the verdict for the coin path names the coin', /coins at the temple/.test(M.verdict(M.runSchedule([0, 2, 3, 4, 5, 6])).did));
{ const t = M.newGame(); const said = []; for (let i = 0; i < 6; i++) { M.arrive(t); said.push(M.arrivalLine(t) !== ''); M.commit(t, 0); M.next(t); }
  check('W7 the arrival says one thing once, at the studio: the people\'s eyes have changed', said.filter(Boolean).length === 1 && said[4] === true, said.map(c => c ? 'said' : 'silent').join(' ')); }
check('W6 the verdict for the always-veiled path says the halo is whole and nobody saw it', (() => { const v = M.verdict(M.runSchedule([0, 0, 0, 0, 0, 0])); return /halo is whole/.test(v.lead) && /Nobody saw/.test(v.lead); })());
check('W9 the verdict for wait-then-splash names the screen that could not carry it', /could not carry it/.test(M.verdict(M.runSchedule([0, 0, 0, 0, 0, 6])).lead));
check('W10 the painting-now line says where the halo went', /went out to the people: to the faithful on the day, in woodcuts/.test(M.verdict(M.runSchedule([0, 1, 3, 4, 5, 6])).faceNow) && /never left the dark/.test(M.verdict(M.runSchedule([0, 0, 0, 0, 0, 0])).faceNow));

const head = `Benjamin's Veil — calibration result (${new Date().toISOString().slice(0, 10)})\n${pass} passed, ${fail} failed\n`;
const text = head + out.join('\n') + '\n';
fs.writeFileSync(__dirname + '/calibration-result.txt', text);
console.log(text);
if (fail) process.exit(1);
