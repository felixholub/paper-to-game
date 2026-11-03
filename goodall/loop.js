// The play loop on placeholder graphics: a scripted first-time player, printing after each action what changed and where
// they stand, read as the stranger would. Run: node loop.js  (writes loop-log.txt)
const M = require('./mechanism.js'); const fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
function dip(g, D, P, vs) {
  M.startDip(g); const dt = 1 / 60; let t = 0, res = null; const run = x => { const e = M.dipStep(g, x, dt); if (e && e.blocked) say('      (the stem stops: it will not go further)'); if (e && e.result) res = e.result; };
  let tg = 0; while (tg < D && !res) { tg = Math.min(D, tg + 6 * dt); run(tg); }
  for (let s = 0; s < P && !res; s += dt) run(tg);
  let cur = g.dip ? g.dip.d : 0; while (!res) { cur -= vs * dt; run(cur); if ((t += dt) > 30) break; }
  return res;
}
const show = (g, what) => { const r = what; say(`   → ${r.words.typed}`); if (r.words.red) say(`     [red pencil, ${r.words.age || ''}] ${r.words.red}`); say(`     suns left ${g.suns}; termites ${g.eaten}`); };
const g = M.newGame(1);
say(`AFTERNOON ${g.seed}. THE LONG GRASS: ${g.grass.length} stems`);
const pickType = t => g.grass.findIndex((s, i) => s.type === t && !g.taken[i]);
for (const t of ['blade', 'stick', 'leafy']) { M.look(g, pickType(t)); say(` look: ${M.describe(M.inHand(g))}`); M.take(g); say(`   take it (carrying ${g.carried.length})`); }
M.walk(g); say('\nTHE MOUND');
M.hold(g, 0); say(` hold: ${M.describe(M.inHand(g))}`); show(g, dip(g, 8, 2, 3));
M.hold(g, 1); say(` hold: ${M.describe(M.inHand(g))}`); show(g, dip(g, 8, 2, 3));
M.hold(g, 2); say(` hold: ${M.describe(M.inHand(g))}`); show(g, dip(g, 8, 2, 3));
const p = M.preview(g, 'strip'); say(` preview strip: ${M.describe(p.stem)}`); M.prepare(g, 'strip');
say(' push all the way, short pause, pull at a flick'); show(g, dip(g, 9, 1, 70));
say(' again, slowly'); show(g, dip(g, 9, 2, 3));
const w = M.watch(g); say(` WATCH YOUR MOTHER → ${w.words.typed}  [red] ${w.words.red}   suns left ${g.suns}`);
for (let i = 0; i < 3; i++) { say(' dip slowly'); show(g, dip(g, 9, 2, 3)); if (M.inHand(g).bent) { const b = M.preview(g, 'bite'); say(` preview bite: ${M.describe(b.stem)}`); M.prepare(g, 'bite'); } }
if (g.mother.dropped) { M.pickUpHers(g); say(` pick up her stem: ${M.describe(M.inHand(g))}`); M.prepare(g, 'bite'); say(`   bitten: ${M.describe(M.inHand(g))}`); }
while (g.phase === 'mound') { show(g, dip(g, 9, 2, 3)); }
say(`\nYOUR MOTHER MOVES OFF. you ${g.eaten}, her ${g.mother.eaten}`);
M.goHollow(g); say('\nTHE HOLLOW');
M.holdHand(g); say(` hold: ${M.describe(M.inHand(g))}`);
let r = dip(g, 5, 0.5, 4); say(`   → ${r.words.typed} [red] ${r.words.red}  sips ${g.hollow.sips}`);
M.hold(g, 0); say(` hold: ${M.describe(M.inHand(g))}`);
r = dip(g, 5, 0.5, 4); say(`   → ${r.words.typed} [red] ${r.words.red}  sips ${g.hollow.sips}`);
say(` preview chew: ${M.describe(M.preview(g, 'chew').stem || M.inHand(g))}`); M.prepare(g, 'chew');
while (!g.over) { r = dip(g, 5, 0.5, 4); say(`   → ${r.words.typed}  sips ${g.hollow.sips}, suns ${g.hollow.suns}`); }
const v = M.verdict(g); say('\nTHE LAST PAGE\n ' + v.headline); v.did.forEach(x => say('  ' + x)); say('  ages: ' + v.ages.map(a => a.age).join(' '));
fs.writeFileSync(__dirname + '/loop-log.txt', L.join('\n') + '\n');
