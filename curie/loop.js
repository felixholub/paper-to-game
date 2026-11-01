// The play loop on placeholder graphics. Run: node loop.js  (writes loop-log.txt). Prints, after each panel, what the game
// says, the idea the bench thinks, any clash, and at the end the physics and the world the page makes, for the builder to
// read as the stranger: does each number plant a sensible thought, and does the end assemble them into something?
const M = require('./mechanism.js'); const C = M.CONFIG, fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
// [jar, thumb]: careful = follows the spot and writes once it has stood a second and a half; a number = written straight down
const plan = [['uranium', 'careful'], ['lead', 0.5], ['thO', 'careful'], ['whiteP', 'careful'], ['pbJG', 'careful'], ['chalc', 'careful'],
  ['chalcArt', 'careful'], ['lead', 'careful'], ['redP', 'careful']];
say('AIM: Uranium makes the air carry electricity. Find what else does.');
const g = M.newGame(5);
for (const [id, how] of plan) {
  const s = M.sub(id), st = M.benchStart(g, id); let r = typeof how === 'number' ? how : 0, still = 0;
  while (true) {
    if (how === 'careful') r = Math.max(0, r + 2.4 * st.s / 60);
    M.benchStep(st, 1 / 60, r); still = Math.abs(st.s) < C.BAND ? still + 1 / 60 : 0;
    if (M.canCommit(st) && (how === 'careful' ? still >= 1.5 || st.t > 25 : st.t >= 1)) break;
  }
  const p = M.commit(g, st);
  say(`\nPANEL ${p.n} · ${s.name.toUpperCase()} (${typeof how === 'number' ? 'written at ' + how : how}) → ${p.band}${p.moving ? ', spot still running ' + p.moving : ''}`);
  say('  GAME: ' + p.caption);
  say('  💭 ' + p.idea); p.clash.forEach(c => say('  💥 ' + c));
}
const v = M.verdict(g);
say('\nYOUR IDEAS: ' + v.ideas.map(i => `[${i.n}] ${i.text}`).join('\n            '));
say('\nYOUR PHYSICS: ' + v.world.name); v.world.laws.forEach((l, k) => say(`  ${k + 1}. ${l.text}  (panels ${l.from.join(', ') || '—'})`));
say('\nYOUR WORLD (if it were true): landmark ' + v.world.landmark + '; vignettes ' + v.world.slots.join(', '));
v.world.callouts.forEach((c, k) => say(`  (${k + 1}) ${c.text}${c.from && c.from.length ? '  ← panels ' + c.from.join(', ') : ''}`));
say('  ' + v.world.paragraph);
say('\nOURS: ' + v.ours.dates.map(d => d.join(' ')).join(' / '));
say('\nWHERE THEY PART:'); v.part.lines.forEach(l => say('  ' + l)); v.part.unlooked.forEach(l => say('  ' + l)); say('  ' + v.part.closing);
fs.writeFileSync('loop-log.txt', L.join('\n') + '\n');
