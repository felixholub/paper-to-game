// The play loop on placeholder graphics. Run: node loop.js  (writes loop-log.txt). Prints, after each action, what changed and
// where the player stands, for the builder to read as the stranger: did something visible change, did it say what the reading
// was and how sure, was there a reason to think before writing it down?
const M = require('./mechanism.js'); const C = M.CONFIG, fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
// [jar, thumb]: careful = follows the spot and writes it down once it has stood a second and a half;
//               hasty = sets the slider where the label suggests and writes it down after a second
const plan = [['uranium', 'careful'], ['lead', 'hasty'], ['thO', 'careful'], ['whiteP', 'careful'], ['redP', 'careful'],
  ['pbJG', 'hasty'], ['pbJG', 'careful'], ['chalc', 'careful'], ['chalcArt', 'careful']];
const bar = (v, ch) => ch.repeat(Math.max(0, Math.min(26, Math.round(v * 6)))).padEnd(26, ' ');
say('AIM: Uranium makes the air carry electricity. Find what else does.');
const g = M.newGame(5);
for (const [id, how] of plan) {
  const s = M.sub(id); const st = M.benchStart(g, id);
  say(`\nBENCH · PANEL ${g.panels.length + 1} OF ${C.PANELS} · ${s.name.toUpperCase()}   (${how} thumb)`);
  say(`  card: ${s.what}  [uranium in it: ${M.shareWords(s.u)}]`);
  let r = how === 'hasty' ? (s.u || 0) : 0; const seen = [];
  while (true) {
    if (how === 'careful') r = Math.max(0, r + 2.4 * st.s / 60);
    M.benchStep(st, 1 / 60, r);
    if (Math.round(st.t * 60) % 45 === 0) seen.push(`t=${st.t.toFixed(1)}s push=${r.toFixed(2)} spot=${st.s.toFixed(2)} ${M.running(st)}`);
    if (M.canCommit(st) && (how === 'hasty' ? st.t >= 1 : st.hold >= 1.5 || st.t > 25)) break;
  }
  say('  ' + seen.slice(0, 5).join(' | ') + (seen.length > 5 ? ' | …' : ''));
  const p = M.commit(g, st);
  say(`  WRITE IT DOWN at ${st.t.toFixed(1)} s → ${p.R.type.toUpperCase()} [${p.R.lo.toFixed(2)} … ${p.R.hi === Infinity ? '∞' : p.R.hi.toFixed(2)}]   PANEL ${p.n}: ${p.badge}`);
  say(`    its uranium [${bar(p.u, '░')}]`);
  say(`    you         [${bar(p.R.type === 'atmost' ? p.R.hi : p.R.est, p.R.type === 'atmost' ? '▒' : '█')}]${p.R.type === 'atleast' ? ' →' : p.R.type === 'atmost' ? ' ← (at most)' : ''}   hers ${p.paper.toFixed(2)}`);
  say('    caption: ' + p.caption);
  say('  ' + M.foundLine(g) + `  Panels left: ${M.panelsLeft(g)}.`);
}
const v = M.verdict(g);
say('\nEND: ' + v.headline + ' ' + v.fate); say('  ' + v.did);
v.claims.forEach(c => say(`  ${c.backed ? '✓' : '✗'} ${c.text} — ${c.why}`));
say('  PAPER: ' + v.paper); say('  MEANS: ' + v.means); say('  LATER: ' + v.later);
fs.writeFileSync('loop-log.txt', L.join('\n') + '\n');
