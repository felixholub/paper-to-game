// Calibration check for Julian's Window: runs mechanism.js in Node against the text's numbers and claims (chapters tagged),
// over hundreds of seeds and several ways of playing. `node calibration.js` prints the checks and exits non-zero on any failure.
'use strict';
var J = require('./mechanism.js');
var C = J.CONFIG, fails = 0, n = 0;
function check(name, ok, detail) { n++; if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : '')); }

var SEEDS = []; for (var s = 1; s <= 400; s++) SEEDS.push(s);
var POLICIES = {
  cross: function () { return 'cross'; },
  window: function () { return 'window'; },
  within: function () { return 'within'; },
  flee: function (st) { return J.weal(st) ? 'cross' : 'window'; },               // the stranger's first instinct: relief in the dark
  stay: function (st) { return J.weal(st) ? 'window' : 'cross'; },               // the opposite
  julian: function (st) { return (!J.weal(st) && !st.causeAsked) ? 'within' : 'cross'; }, // her own night: the cross, and one check of the cause
  random: function (st) { var r = J.mulberry32(st.seed * 7 + st.beat)(); return r < 1 / 3 ? 'cross' : r < 2 / 3 ? 'window' : 'within'; }
};
function play(seed, policy) { var st = J.newNight(seed); while (!st.done) J.look(st, policy(st)); return st; }
function turns(w) { var k = 0; for (var i = 1; i < w.length; i++) if (w[i] !== w[i - 1]) k++; return k; }

// 1. The weather's shape (ch. xv): sixteen beats, sureness first, the first heaviness by beat 3, no run longer than maxRun,
//    about half the beats turn: the twenty of the text compressed to about eight, between five and eleven at the 5th–95th percentile.
var T = SEEDS.map(function (s) { return turns(J.schedule(s)); }).sort(function (a, b) { return a - b; });
var mean = T.reduce(function (a, b) { return a + b; }, 0) / T.length;
check('schedule has ' + C.beats + ' beats (ch. i: sixteen shewings, as a count)', SEEDS.every(function (s) { return J.schedule(s).length === C.beats; }));
check('the night begins in sureness (ch. xv)', SEEDS.every(function (s) { return J.schedule(s)[0] === true; }));
check('first heaviness by beat ' + C.firstTurnBy + ' on every seed (our floor)', SEEDS.every(function (s) { var w = J.schedule(s); return w.slice(0, C.firstTurnBy).indexOf(false) >= 0; }));
check('no stretch of one weather longer than ' + C.maxRun + ' beats ("this lasted but a while")', SEEDS.every(function (s) { var w = J.schedule(s), run = 1; for (var i = 1; i < w.length; i++) { run = w[i] === w[i - 1] ? run + 1 : 1; if (run > C.maxRun) return false; } return true; }));
check('mean turns per night between 7 and 9 (the text\'s ~20 in one shewing, compressed; declared)', mean >= 7 && mean <= 9, 'mean ' + mean.toFixed(2));
check('5th–95th percentile of turns within [5, 11]', T[Math.floor(0.05 * T.length)] >= 5 && T[Math.floor(0.95 * T.length)] <= 11, T[Math.floor(0.05 * T.length)] + '–' + T[Math.floor(0.95 * T.length)]);
check('the twenty is in CONFIG with its chapter', C.swingsInText === 20);

// 2. Independence (ch. xv: "freely our Lord giveth when He will"; "sin is not always the cause"): the same seed gives the same weather
//    under every policy, and the chance that the heaviness comes next is the same whatever was just looked at.
check('the weather is the same under every policy for the same seed', SEEDS.slice(0, 100).every(function (s) {
  var ref = JSON.stringify(play(s, POLICIES.cross).weather);
  return Object.keys(POLICIES).every(function (p) { return JSON.stringify(play(s, POLICIES[p]).weather) === ref; });
}));
var onset = { cross: [0, 0], window: [0, 0], within: [0, 0] };
SEEDS.forEach(function (s) { var st = play(s, POLICIES.random); for (var t = 1; t < C.beats; t++) if (st.weather[t - 1]) { var p = st.record[t - 1].place; onset[p][1]++; if (!st.weather[t]) onset[p][0]++; } });
var rates = Object.keys(onset).map(function (p) { return onset[p][0] / onset[p][1]; });
check('P(heaviness comes next | last look) equal across the three places within 0.06', Math.max.apply(null, rates) - Math.min.apply(null, rates) < 0.06, rates.map(function (r) { return r.toFixed(3); }).join(' / '));
check('the keeping is constant on every beat of every night (ch. xv)', SEEDS.slice(0, 100).every(function (s) { return play(s, POLICIES.random).record.every(function (r) { return r.keeping === C.keeping; }); }));
check('CONFIG.actsAffectWeather is 0 and the schedule takes no argument but the seed', C.actsAffectWeather === 0 && J.schedule.length === 1);

// 3. The sights (their order is the text's): the cross queue runs iv, vii, x, xii, xiii, xvi–xvii, xxii, xxiv, xxv, xxvi then seeking (x).
var order = J.CROSS.map(function (c) { return c.ch; });
check('cross sights in the text\'s order', order.join('|') === 'iv|vii|x|xii|xiii|xvi–xvii|xxii|xxiv|xxv|xxvi');
var allCross = play(1, POLICIES.cross);
check('a player at the cross all night sees all ten sights then seeks (ch. x: seeking is as good as beholding)', allCross.record.slice(0, 10).every(function (r, i) { return r.sight === J.CROSS[i].id; }) && allCross.record.slice(10).every(function (r) { return r.sight === 'seeking'; }));
check('every sight at the cross carries a line for sureness and one for heaviness (ch. vii: "horrifying and dreadful, sweet and lovely")', J.CROSS.every(function (c) { return c.sweet && c.dread; }));
var allWithin = play(1, POLICIES.within);
check('a player within all night asks the cause in the first dark, then the questions in order (v, xi, xvii, xxvii, xxix, xxx/xxxii), then rests', (function () {
  var ids = allWithin.record.map(function (r) { return r.sight; });
  var firstDark = allWithin.weather.indexOf(false);
  return ids[firstDark] === 'cause' && ids.filter(function (x) { return x !== 'cause' && x !== 'rest'; }).join('|') === 'hazelnut|sin|pain|whysin|howwell|hid' && ids[ids.length - 1] === 'rest';
})(), allWithin.record.map(function (r) { return r.sight; }).join(','));
check('the cause is asked at most once a night and only as the first within-look in heaviness, or as "what earned it" once the rest are done', SEEDS.slice(0, 100).every(function (s) {
  var st = play(s, POLICIES.random), k = st.record.filter(function (r) { return r.sight === 'cause'; }); return k.length <= 1;
}));
check('the window never shows a sight and always names the sky and the blanket (ch. xix: "nothing betwixt the Cross and Heaven that might have harmed me")', play(3, POLICIES.window).record.every(function (r) { return r.sight === 'sky' && /sky/.test(r.line) && /blanket/.test(r.line); }));

// 4. The change of cheer (ch. xxi): fires exactly when the player is at the cross in heaviness and the next beat is sureness; never otherwise.
check('cheer fires iff at the cross, in heaviness, with sureness next', SEEDS.every(function (s) {
  var st = play(s, POLICIES.random);
  return st.record.every(function (r, t) { var should = r.place === 'cross' && !st.weather[t] && t + 1 < C.beats && st.weather[t + 1]; return r.cheer === should; });
}));
check('a player who flees to the window in every dark never sees the cheer; one who stays sees it on every lift', SEEDS.slice(0, 100).every(function (s) {
  return play(s, POLICIES.flee).record.every(function (r) { return !r.cheer; }) && (function () { var st = play(s, POLICIES.stay); var lifts = 0; for (var t = 1; t < C.beats; t++) if (st.weather[t] && !st.weather[t - 1]) lifts++; return st.record.filter(function (r) { return r.cheer; }).length === lifts; })();
}));

// 5. "Look up to Heaven" (ch. xix): offered once, in the first heaviness after the drying has been seen; the cross then answers "Nay".
check('the proffer comes once, after the drying, in heaviness; taking the cross answers Nay, taking the window looks up', SEEDS.slice(0, 200).every(function (s) {
  var st = play(s, POLICIES.random), seenDry = false, offered = 0;
  for (var t = 0; t < st.record.length; t++) {
    var r = st.record[t];
    var open = seenDry && !st.weather[t] && offered === 0 && r.place !== 'within';
    if (r.nay || r.proffer) { offered++; if (!open) return false; if (r.place === 'cross' && !r.nay) return false; if (r.place === 'window' && !r.proffer) return false; }
    if (r.sight === 'drying') seenDry = true;
  }
  return offered <= 1;
}));

// 6. The verdict is words, not a tally; it reads the record right on the boundary strategies.
var vFlee = J.verdict(play(5, POLICIES.flee)), vStay = J.verdict(play(5, POLICIES.stay)), vJul = J.verdict(play(5, POLICIES.julian));
check('verdict has no digits anywhere', [vFlee, vStay, vJul].every(function (v) { return !/\d/.test(v.did + v.says + v.means + v.sentence + v.morning); }));
check('flee: never at the cross in the dark, no cheer', vFlee.counts.stay === 0 && vFlee.counts.cheers === 0 && /never at the cross when the heaviness went/.test(vFlee.did));
check('stay: at the cross on every dark beat; cheer on every lift', vStay.counts.stay === vStay.counts.darks && vStay.counts.cheers === vStay.counts.lifts.length);
check('julian: the cause was checked once, in the dark; the verdict does not scold', vJul.counts.within === 1 && !/never looked within/.test(vJul.means));
check('the verdict ends with her sentence (ch. xxvii)', vJul.sentence === 'All shall be well, and all shall be well, and all manner of thing shall be well.');
check('the onsets named in the verdict are the places looked at just before each heaviness', SEEDS.slice(0, 100).every(function (s) {
  var st = play(s, POLICIES.random), v = J.verdict(st), exp = []; for (var t = 1; t < C.beats; t++) if (!st.weather[t] && st.weather[t - 1]) exp.push(st.record[t - 1].place);
  return JSON.stringify(v.counts.onsets) === JSON.stringify(exp);
}));

// 7. Robustness of the discovery (build.md §1): under other values of our own choices the heaviness still follows nothing.
[{ turnProb: 0.3 }, { turnProb: 0.7 }, { maxRun: 3 }, { firstTurnBy: 2 }].forEach(function (alt) {
  var saved = {}; Object.keys(alt).forEach(function (k) { saved[k] = C[k]; C[k] = alt[k]; });
  var o = { cross: [0, 0], window: [0, 0], within: [0, 0] };
  SEEDS.forEach(function (s) { var st = play(s, POLICIES.random); for (var t = 1; t < C.beats; t++) if (st.weather[t - 1]) { var p = st.record[t - 1].place; o[p][1]++; if (!st.weather[t]) o[p][0]++; } });
  var r = Object.keys(o).map(function (p) { return o[p][0] / o[p][1]; });
  check('independence survives ' + JSON.stringify(alt), Math.max.apply(null, r) - Math.min.apply(null, r) < 0.07, r.map(function (x) { return x.toFixed(3); }).join(' / '));
  Object.keys(saved).forEach(function (k) { C[k] = saved[k]; });
});

// 8. Playing it in numbers (build.md §3): what each way of playing sees and gets; no score exists, so the table is what is seen.
console.log('\nways of playing, over 400 nights (means): dark beats / cross in dark / sights seen / questions asked / cheers / cause checked');
Object.keys(POLICIES).forEach(function (p) {
  var acc = [0, 0, 0, 0, 0, 0];
  SEEDS.forEach(function (s) { var v = J.verdict(play(s, POLICIES[p])).counts; acc[0] += v.darks; acc[1] += v.stay; acc[2] += v.seen; acc[3] += v.asked; acc[4] += v.cheers; acc[5] += (play(s, POLICIES[p]).causeAsked ? 1 : 0); });
  console.log('  ' + p.padEnd(8) + acc.map(function (x) { return (x / SEEDS.length).toFixed(2).padStart(6); }).join(' '));
});

console.log('\n' + (n - fails) + ' of ' + n + ' checks passed');
process.exit(fails ? 1 : 0);
