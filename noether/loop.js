// The play loop on placeholder graphics. Run: node loop.js [lever lever | lever ...]  (writes loop-log.txt). Prints, after each pull,
// what changed and where the player stands, for the builder to read as the stranger: did something visible change, did it say whether
// it worked, was there a reason to think before it?
const M = require('./mechanism.js'); const C = M.CONFIG, fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
const arg = process.argv.slice(2).join(' ');
const plan = arg ? arg.split('|').map(s => s.trim().split(/\s+/)) : [['across', 'warpclock', 'clock'], ['turn', 'clock'], ['clock', 'warpclock', 'across'], ['warpclock', 'turn']];
say('AIM: Stamp this world\'s laws. Only a tag with teeth counts.');
const g = M.newGame(1);
for (let wi = 0; wi < C.WORLD_ORDER.length; wi++) {
  const w = M.world(g);
  say(`\n== WORLD ${wi + 1} OF ${C.WORLD_ORDER.length} · ${w.name.toUpperCase()}`);
  say(`   WINDOW: ${w.line}  [a true motion traces across the window]`);
  if (w.first) say(`   AUDITOR FIRST: "${w.first.say}"  [picture: the ${w.first.law.toLowerCase()} gauge, steady]`);
  say(`   LEVERS: ${M.LEVERS.map(l => l.label).join(' / ')}   BLANKS: ${'■'.repeat(g.blanks)}`);
  for (const lever of plan[wi] || []) {
    const lv = M.leverById(lever); say(`\n   tap "${lv.label}" -> "${lv.does}"${lv.free ? '  [strip opens: draw the function; a wobble is drawn]' : ''}  [PULL enabled]`);
    const p = lv.free ? M.smoothCurve([0, .3, .8, .4, -.2, -.7, -.3, .2, .6, .1, -.4, 0]) : null;
    const r = M.playPull(g, lever, p); if (!r) { say('   (no pull: no blanks or lever down)'); continue; }
    if (r.kind === 'jam') say(`   PRESS: comes down, JAMS. World dial swings yellow. "THE WORLD MOVED"  (residual ${r.test.residual.toExponential(1)})`);
    else if (r.kind === 'identity') say(`   PRESS: comes down, holds. Tag drops: IDENTITY — "${r.law}"`);
    else say(`   PRESS: comes down, holds. Tag drops: ${r.tag}`);
    if (r.audit) say('   AUDITOR feeds: ' + r.audit.rows.map(x => `${x.how} [${x.isTrue ? 'true' : 'FAKE'}] needle ${x.steady ? 'still' : 'SWINGS'}`).join('; '));
    say(`   STAMP: ${r.kind.toUpperCase()}${r.isTarget ? ' (the Auditor\'s target)' : ''}`);
    say(`   AUDITOR: "${r.say}"`);
    say(`   RACK: ${g.rack.map(e => e.kind === 'jam' ? '[bent]' : `[${e.tag}: ${e.kind}]`).join(' ')}   BLANKS: ${'■'.repeat(g.blanks)}${'□'.repeat(C.BLANKS - g.blanks)}`);
  }
  M.nextWorld(g);
}
const v = M.verdict(g);
say(`\nVERDICT: ${v.headline}`); for (const d of v.did) say('  ' + d);
fs.writeFileSync('loop-log.txt', L.join('\n') + '\n');
