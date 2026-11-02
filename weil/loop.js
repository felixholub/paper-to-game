// The play loop on placeholder text. Run: node loop.js [life] [player]  (writes loop-log.txt). Players:
//   learner (default): raises the boy, then learns: strikes what is stone and armed, spares the rest, pleads to red men,
//                      stands before stone; reacts in about three seconds when the spear creeps.
//   hard: strikes or takes everything; pleads when down.
// Printed after each move: what the game says, the cost, where the scales stand. Read it as the stranger.
const M = require('./mechanism.js'); const fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
const seed = +process.argv[2] || 1, who = process.argv[3] || 'learner'; const g = M.newLife(seed);
const C = M.CONFIG;
const ok = (t, id) => t.gestures.find(x => x.id === id && x.ok);
const players = {
  learner: t => {
    if (t.mode === 'down') return t.man.lines <= 2 ? 'stand' : 'plead';
    if (t.day === 1) return 'raise';
    const m = t.man; if (m.armed && (m.lines <= C.ARMED_DEAF || m.fearless)) return 'strike';
    return 'raise';
  },
  hard: t => t.mode === 'down' ? 'plead' : (ok(t, 'strike') ? 'strike' : 'take'),
};
const figure = n => '■'.repeat(n) + '□'.repeat(C.LINES - n);
const pan = h => { const k = Math.round(h * 2); return h >= 0 ? `your pan UP ${'↑'.repeat(Math.max(0, k))}` : `your pan DOWN ${'↓'.repeat(Math.max(0, -k))}`; };
say(`AIM: Force is yours, for now. Keep your soul through the war.   (life ${seed}, ${who})`);
while (!g.over) {
  const t = M.today(g);
  say(`\n— DAY ${t.day} OF ${t.days}   you ${figure(t.lines)}   ${t.mode === 'night' ? 'night: the scales hang still' : pan(t.h)}`);
  say(`  PICTURE: you (${M.stonePhrase(t.lines)}) | him: ${t.man.who}, ${M.stonePhrase(t.man.lines)}${t.man.armed ? ', armed' : ''}`);
  say(`  LINE: ${M.sceneLine(t)}`);
  say(`  SHERDS: ${t.gestures.map(x => { const l = M.gestureLabel(x.id, t.man); return x.ok ? `${l.word.toUpperCase()} (${l.sub})` : `[cracked ${l.word}: ${x.why}]`; }).join('  ')}`);
  if (t.mode === 'up') say(`  INTERVAL: ${isFinite(t.interval) ? (t.interval < 0.05 ? 'none: the spear goes in at once' : `the spear creeps; reaches him in ${t.interval.toFixed(1)} s`) : 'the spear is still'}`);
  let gest = players[who](t), imp = false;
  if (t.mode === 'up' && t.interval < 3) { gest = t.impulse; imp = true; }
  const r = M.act(g, gest, { impulse: imp });
  say(`  → ${imp ? '(impulse) ' : ''}${gest.toUpperCase()}.  GAME: ${r.word.said.join(' ')}`);
  if (r.word.cost) say(`  COST: ${r.word.cost}`);
  if (r.word.why) say(`  WHY: ${r.word.why}`);
  if (r.word.quote) say(`  HOMER/WEIL: ${r.word.quote}`);
  const sl = M.scalesLine(r); if (sl) say(`  SCALES: ${sl}`);
  say(`  NOW: you ${figure(g.lines)}   ${g.over ? '' : pan(g.h)}`);
  if (!g.over) M.nextDay(g);
}
const V = M.verdict(g);
say(`\nEND: ${V.headline}`); V.did.forEach(l => say('  ' + l)); say('  ' + V.weil); say('  ' + V.last);
fs.writeFileSync(__dirname + '/loop-log.txt', L.join('\n') + '\n');
