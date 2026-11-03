// The play loop on placeholder text, and the obvious ways of playing it (build.md §3). Run: node loop.js  (writes loop-log.txt)
// Part 1 prints one session as the stranger meets it: after each move, what the game says and where the player stands.
// Part 2 plays heuristics against the mechanism and the exact distribution for a player who picks at random.
const M = require('./mechanism.js'); const fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
const marks = g => g.status.map((s, i) => (s === 'disgraced' ? '■' : s === 'clean' ? '□' : i === g.t ? '▸' : '·')).join(' ');
function session(plan, verbose) {
  const g = M.newGame();
  while (!g.over) {
    const v = M.current(g); const order = plan(v, g);
    if (verbose) { say(`\n— REEL ${v.reel}: ${v.name.toUpperCase()}   [${marks(g)}]`); say(`  RULE: ${v.rule.join(' ')}`); }
    let k = 0;
    while (!M.current(g).ended) {
      const sid = order.filter(s => !g.tries[g.t].includes(s))[0]; const pv = M.preview(g, sid);
      if (verbose) { say(`  PREVIEW ${pv.title.toUpperCase()}: bad man: "${pv.bad}"`); say(`    ${pv.ask}`); }
      const r = M.spring(g, sid);
      if (verbose) { say(`  → SPRUNG. GAME: ${r.did} ${r.why}`); say(`    STALLS: ${r.audience}`); say(`    ${r.name.toUpperCase()}: "${r.says}"`); say(`    STANDING: ${r.stand}   [${marks(g)}]`); }
      k++;
    }
    M.next(g);
  }
  return g;
}
// Part 1: the walkthrough player (memo §9)
say('AIM: Disgrace three good people, using nothing but their own rules.');
const walk = v => ({ most: ['bargain'], double: ['bargain', 'tram', 'brew'], foot: ['brew', 'cave', 'beggar'] })[v.id];
const g1 = session(walk, true); const V = M.verdict(g1);
say('\nTHE END   [' + marks(g1) + ']'); V.did.forEach(l => say('  ' + l)); say('  ' + V.paper); if (V.missed) say('  ' + V.missed); say('  ' + V.means); say('  FATE: ' + V.fate); say('  ' + V.trolley);
say('\nMAP OF HOLES'); M.map().forEach(row => say(`  ${row.name.padEnd(14)} ` + row.cells.map(c => (c.verdict === 'disgrace' ? 'RED ' : '--- ') + c.scheme.padEnd(9)).join('')));

// Part 2: heuristics
say('\nHEURISTICS (disgraces out of 3; the best possible is 2)');
const H = {
  'card order (tram first, as dealt)': () => M.CONFIG.SCHEME_ORDER,
  'the villain (bargain, brew, beggar first)': () => ['bargain', 'brew', 'beggar', 'cave', 'tram', 'medicine'],
  'the famous one first, then the villain': () => ['tram', 'bargain', 'brew', 'beggar', 'cave', 'medicine'],
  'the walkthrough (reads each rule)': walk,
  'the side-effect hunter (tram, medicine, brew)': () => ['tram', 'medicine', 'brew', 'bargain', 'beggar', 'cave'],
  'the rule reader (for the Doctor, a side effect that harms; for Foot, the doomed man)': v => ({ most: ['bargain'], double: ['brew'], foot: ['cave', 'beggar', 'brew'] })[v.id],
};
for (const [k, f] of Object.entries(H)) { const g = session(f, false); const v = M.verdict(g); say(`  ${String(v.hits)}  ${k}: ${g.log.map(r => r.target[0] + ':' + r.scheme + (r.disgraced ? '!' : '')).join(' ')}`); }
// exact distribution for a player who picks three schemes at random (without repeats) for each target
function pHit(rule) { const holes = M.holes(rule).length, n = 6, k = M.CONFIG.SCHEMES_PER_TARGET; let miss = 1; for (let i = 0; i < k; i++) miss *= (n - holes - i) / (n - i); return 1 - miss; }
const pm = pHit('most'), pd = pHit('double');
say(`  random picks: Mr Most falls ${Math.round(pm * 100)}% of the time, Doctor Double ${Math.round(pd * 100)}%, Mrs Foot 0%; two disgraces ${Math.round(pm * pd * 100)}%, one ${Math.round((pm * (1 - pd) + (1 - pm) * pd) * 100)}%, none ${Math.round((1 - pm) * (1 - pd) * 100)}%`);
for (const k of [2, 4]) { M.CONFIG.SCHEMES_PER_TARGET = k; say(`  (with ${k} schemes per target: Mr Most ${Math.round(pHit('most') * 100)}%, Doctor Double ${Math.round(pHit('double') * 100)}%)`); }
M.CONFIG.SCHEMES_PER_TARGET = 3;
fs.writeFileSync(__dirname + '/loop-log.txt', L.join('\n') + '\n');
