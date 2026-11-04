// Augustine's Clock — the loop on placeholders: one first evening played through the mechanism by a scripted player who
// makes the mistakes a stranger makes (counts the kicked wheel, sings the longs too short), printing after each action what
// the screen would say and where the player stands. Run: node loop.js  (loop-log.txt is the saved output)
const A = require('./mechanism.js');
const out = []; const say = s => { out.push(s); console.log(s); };
const g = A.newGame(4821, { first: true });
say('EVENING ' + g.seed + ' (first evening: the kicked wheel runs faster)');
say('PROLOGUE: find the present');
g.prologue.forEach((st, k) => say('  touch ' + (k + 1) + ': ' + st.label + ', in ' + st.parts + ' ' + st.part + 's; now is part ' + (st.now + 1) + ', with ' + st.now + ' past and ' + (st.parts - st.now - 1) + ' to come'));
say('  touch 6: only the point is left. ' + A.QUOTES.present.text);
const show = (r, res) => { say('  [memory] target ' + '#'.repeat(Math.round(res.target * 6)) + '  ' + res.target.toFixed(2) + ' s');
  say('  [memory] yours  ' + '#'.repeat(Math.round(res.made * 6)) + '  ' + res.made.toFixed(2) + ' s');
  say('  BIG: ' + res.big.toUpperCase()); res.lines.forEach(l => say('  > ' + l)); say('  ~ "' + res.quote.text + '" (' + res.quote.cite + ')'); };
const plan = {
  voice: r => A.hold(g, r.T * 0.88, r.T + 0.6),
  wheel: r => A.hold(g, r.T * 1.03, r.T + 0.6),
  kick: r => { const tp = r.T + 0.6; let lo = 0, hi = 20; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (A.wheelTurns(r, tp + m, tp) - A.wheelTurns(r, tp, tp) < 3) lo = m; else hi = m; } return A.hold(g, lo, tp); },
  sun: r => A.hold(g, r.T * 1.12, r.T + 0.6),
  silence: r => A.silence(g, r.T * 1.07),
  first: r => A.hold(g, r.T * 0.93, 0),
};
for (const r of g.rounds) {
  say(''); say('ROUND ' + (g.i + 1) + ' OF 7: ' + r.title.toUpperCase() + '   (' + r.source + ')');
  if (r.id === 'wheel' || r.id === 'kick') say('  outside: a wheel, one turn every ' + A.wheelPeriod(r).toFixed(2) + ' s; the voice lasts three turns');
  if (r.id === 'kick') say('  the press lands; ' + A.CONFIG.WHEEL.kickDelay + ' s later the wheel is kicked to ×' + r.factor);
  if (r.id === 'sun') say('  outside: the sun climbs from ' + A.sunAt(r, 0).toFixed(2) + ' to ' + A.sunAt(r, r.T).toFixed(2) + ' of its arc while the voice sounds, then stands still');
  if (r.id === 'first') say('  no voice: the target is round 1’s voice, ' + r.T.toFixed(2) + ' s');
  if (r.id === 'hymn') {
    say('  the voice sings: ' + r.syllables.map(s => s.text + (s.long ? '—' : '˘')).join(' '));
    const d = [0.38, 0.6, 0.41, 0.66, 0.36, 0.64, 0.4, 0.72];
    const res = A.sing(g, d, d.reduce((a, b) => a + b, 0) + 7 * 0.2);
    say('  you sing: ' + d.map(x => x.toFixed(2)).join(' ')); res.lines.forEach(l => say('  > ' + l));
    say('  you touch CRE (short) and A (long)');
    const lay = A.lay(g, 2, 3); show(r, lay);
  } else show(r, plan[r.id](r));
  A.next(g);
}
const v = A.verdict(g);
say(''); say('THE LAST PAGE'); say('  ' + v.headline.toUpperCase());
v.did.forEach(l => say('  1. ' + l)); say('  2. ' + v.says); say('  3. "' + v.meansQuote.text + '" ' + v.means);
say('  psalm: ' + v.psalm); say('  before: ' + v.before + ' "' + v.beforeQuote.text + '"');
require('fs').writeFileSync(require('path').join(__dirname, 'loop-log.txt'), out.join('\n') + '\n');
