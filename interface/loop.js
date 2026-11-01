// The play loop on placeholder text. Run: node loop.js [deck]  (writes loop-log.txt). A first-time player who learns as they
// go: pays one page to the first accident, offers two to the first clash started on purpose, then reads the origin and the
// crowd. Printed after each move: what the game says, where the player stands. Read it as the stranger.
const M = require('./mechanism.js'); const fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
const seed = +process.argv[2] || 1; const g = M.newGame(seed);
say('AIM: Settle as many of the nine clashes as you can. You have 14 pages to give, in all.  (deck ' + seed + ')');
let seenPurpose = 0;
const novice = v => {   // the learner
  if (v.round === 1) { if (v.origin === 'accident') return 1; if (v.origin === 'messy') return 1; seenPurpose++; return seenPurpose === 1 ? 2 : 0; }
  if (v.origin === 'messy' || v.origin === 'accident') return 1;
  return v.crowd === 'them' ? Math.max(0, 2 - v.given) : 0;
};
const marks = () => g.done.map(d => (d.settled ? '■' : '×')).join('') + '·'.repeat(9 - g.done.length);
while (!g.over) {
  let v = M.current(g);
  say(`\n— CLASH ${v.n} OF 9   [${marks()}]  pages ${'▮'.repeat(v.pages)}${v.pages}`);
  say(`  YOU (orange): ${v.you.name}: "${v.you.rule}"   THEM (green): ${v.them.name}: "${v.them.rule}"`);
  say(`  PICTURE: ${v.origin === 'purpose' ? 'an arrow pushes their circle into yours: ' + v.push : v.origin === 'messy' ? 'a dot falls in (' + v.cue + ') and a small arrow (' + v.push + ')' : 'a dot falls into the overlap: ' + v.cue}`);
  say(`  GAME: ${v.how}`); say(`  THEY SAY: "${v.say}"`);
  for (;;) {
    say(`  ASK: ${M.prompt(v)}  (0–${v.maxOffer})`);
    const n = Math.min(novice(v), v.maxOffer); const r = M.offer(g, n);
    say(`  → offer ${n}.  GAME: ${M.words(r).join(' ')}`);
    const cw = M.crowdWords(r); if (cw) say(`  CROWD: ${cw}`);
    if (r.final) { const e = r.end; const ew = M.endWords(e); if (ew) say('  ' + ew); say(`  ${e.years}`); say(`  GHOST: ${e.ghost}`); say(`  PAPER: ${e.paper}`); break; }
    v = M.current(g);
  }
  M.next(g);
}
const V = M.verdict(g);
say(`\nEND   [${marks()}]  pages left ${g.pages}`); say(V.headline); V.did.forEach(l => say('  ' + l)); say('  ' + V.paper); say('  ' + V.means);
fs.writeFileSync(__dirname + '/loop-log.txt', L.join('\n') + '\n');
