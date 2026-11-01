// Computes par (the fewest cards) for every puzzle in the library and writes puzzles.json, which build.py inlines.
// Run: node solve.js
const L = require('./loom.js');
const fs = require('fs');
const rep = (s, n) => s.repeat(n);
// tier: easy0 = no wheel (first loom), easy1 = one wheel, Go back to the top; medium = a lead-in, a tail, or two loops in a row;
// hard = a loop inside a loop. Letters are colour slots; the game deals real colours at random.
const LIB = [
  { id: 'e0a', tier: 'easy0', p: 'RBRB', wheels: 0 },
  { id: 'e0b', tier: 'easy0', p: 'RGBR', wheels: 0 },
  { id: 'e0c', tier: 'easy0', p: 'BBRG', wheels: 0 },
  { id: 'e0d', tier: 'easy0', p: 'RBBR', wheels: 0 },
  { id: 'e1a', tier: 'easy1', p: rep('RB', 8), wheels: 1 },
  { id: 'e1b', tier: 'easy1', p: rep('RGB', 5), wheels: 1 },
  { id: 'e1c', tier: 'easy1', p: rep('R', 10), wheels: 1 },
  { id: 'e1d', tier: 'easy1', p: rep('RRB', 5), wheels: 1 },
  { id: 'm1', tier: 'medium', p: 'B' + rep('R', 9), wheels: 1 },
  { id: 'm2', tier: 'medium', p: 'G' + rep('RB', 5) + 'G', wheels: 1 },
  { id: 'm3', tier: 'medium', p: rep('R', 6) + rep('B', 6), wheels: 1 },
  { id: 'm4', tier: 'medium', p: 'GG' + rep('RB', 5), wheels: 1 },
  { id: 'm5', tier: 'medium', p: 'R' + rep('G', 8) + 'B', wheels: 1 },
  { id: 'm6', tier: 'medium', p: rep('RB', 4) + rep('G', 6), wheels: 2 },
  { id: 'm7', tier: 'medium', p: rep('RRGG', 4), wheels: 1 },
  { id: 'm8', tier: 'medium', p: rep('RBB', 4) + 'G', wheels: 1 },
  { id: 'h1', tier: 'hard', p: rep(rep('R', 5) + 'B', 4), wheels: 2 },
  { id: 'h2', tier: 'hard', p: rep('R' + rep('B', 6), 3), wheels: 2 },
  { id: 'h3', tier: 'hard', p: rep('B' + rep('R', 5), 3) + 'B', wheels: 2 },
  { id: 'h5', tier: 'hard', p: rep(rep('RB', 4) + 'G', 3), wheels: 2 },
  { id: 'h6', tier: 'hard', p: rep('R' + rep('G', 5), 3), wheels: 2 },
  { id: 'h8', tier: 'hard', p: rep('G' + rep('R', 4), 4), wheels: 2 },
];
const out = [];
for (const z of LIB) {
  const t0 = Date.now();
  const s = L.solve(z.p.split(''), z.wheels, 8);
  const s0 = null;
  if (!s) { console.log('UNSOLVED', z.id); continue; }
  const flat = z.wheels === 2 ? L.solve(z.p.split(''), 1, s.par) : null;   // can one wheel do it as cheaply?
  if (z.tier === 'hard' && flat) { console.log('NOT HARD', z.id); process.exitCode = 1; }
  const slots = z.tier === 'hard' ? s.par : s.par + 1;   // hard: no spare slot, so the loop inside a loop is the only way
  // check: the found solution really weaves it
  const chk = L.weave(s.chain, s.start, z.p.split(''));
  console.log(z.id.padEnd(4), z.tier.padEnd(7), z.p.padEnd(26), 'par', s.par, z.wheels === 2 ? (flat ? 'one wheel does it too' : 'needs both wheels') : '', chk.status, (Date.now() - t0) + 'ms',
    JSON.stringify(s.chain.map(c => c.k === 'back' ? `↺${'AB'[c.w]}→${c.to + 1}` : c.k === 'set' ? `${'AB'[c.w]}=${c.v}` : c.k)), JSON.stringify(s.start));
  out.push({ ...z, par: s.par, slots, sol: s.chain, set: s.start,  });
}
fs.writeFileSync('puzzles.json', JSON.stringify(out));
console.log('wrote', out.length, 'puzzles');
