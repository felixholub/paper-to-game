// The play loop on placeholder graphics. Run: node loop.js [ids…]  (writes loop-log.txt). Prints, after each action, what
// changed and where the player stands, for the builder to read as the stranger: did something visible change, did it say
// whether it worked, was there a reason to think before it?
const M = require('./mechanism.js'); const C = M.CONFIG, fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
const plan = process.argv.slice(2).length ? process.argv.slice(2) : ['lead', 'thO', 'whiteP', 'redP', 'pbJG', 'chalc', 'chalcArt', 'thOthick'];
const bar = (v, ch) => ch.repeat(Math.max(0, Math.round(v * 6))).padEnd(26, ' ');
say('AIM: Uranium makes the air carry electricity. Find what else does.');
const g = M.newGame(5);
const measure = (id, expect) => {
  const s = M.sub(id); const st = M.benchStart(g, id);
  say(`\nBENCH · PANEL ${g.panels.length + 1} OF ${C.PANELS} · ${s.name.toUpperCase()}`);
  say(`  card: ${s.what}  [uranium in it: ${M.shareWords(s.u)}]`);
  // a thumb that starts where the label suggests (its uranium share, the player's expectation), then follows the spot
  let r = 0, t = 0; const th = { intent: expect !== undefined ? expect : s.u }; const seen = [];
  let firstLook = null;
  while (!st.done && t < 60) {
    th.intent = Math.max(0, th.intent + 2.4 * st.s / 60); r = Math.min(C.SLIDER_MAX, th.intent);
    M.benchStep(st, 1 / 60, r); t += 1 / 60;
    if (firstLook === null && t > 0.8) firstLook = `spot ${M.running(st)} with the slider at ${r.toFixed(2)} (the label's guess)`;
    if (Math.round(t * 60) % 60 === 0) seen.push(`t=${t.toFixed(0)}s push=${r.toFixed(2)} spot=${st.s.toFixed(2)} ${M.running(st)}${st.hold > 0 ? ' ring ' + Math.round(100 * M.holdProgress(st)) + '%' : ''}`);
  }
  say('  first look: ' + firstLook);
  say('  ' + seen.slice(0, 6).join(' | ') + (seen.length > 6 ? ' | …' : ''));
  const p = M.record(g, st);
  say(`  BALANCED after ${st.t.toFixed(1)} s. PANEL ${p.n}: ${p.badge}`);
  say(`    its uranium [${bar(p.u, '░')}]`);
  say(`    it gave     [${bar(p.reading, '█')}]  (paper ${p.paper.toFixed(2)}, you ${p.reading.toFixed(2)})`);
  say('    caption: ' + p.caption);
  say('  ' + M.foundLine(g) + `  Panels left: ${M.panelsLeft(g)}.`);
};
measure('uranium', 0);
for (const id of plan) { if (M.over(g)) break; measure(id); }
const v = M.verdict(g);
say('\nEND: ' + v.headline); say('  ' + v.did); v.path.forEach(p => say('  ' + p)); say('  PAPER: ' + v.paper); say('  MEANS: ' + v.means); say('  LATER: ' + v.later);
say('  HER PAGE: ' + v.her.map(h => `${h.short} ${h.words.replace(' the push of pure uranium', '')}`).join(' · '));
fs.writeFileSync('loop-log.txt', L.join('\n') + '\n');
