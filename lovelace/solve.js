// Computes par (the fewest cards) for every puzzle in the library and writes puzzles.json, which build.py inlines.
// Run: node solve.js
const L = require('./loom.js');
const fs = require('fs');
const rep = (s, n) => s.repeat(n);
// tier: easy0 = no wheel (first loom), easy1 = one wheel, Go back to the top; medium = a lead-in, a tail, or two loops in a row;
// hard = a loop inside a loop; expert = two loops inside one; final = three deep. Letters are colour slots; the game deals real colours at random.
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
  { id: 'm4', tier: 'medium', p: 'B' + rep('RRB', 3), wheels: 1 },          // where does the loop start? B+(RRB)x3 or (BRR)x3+B
  { id: 'm5', tier: 'medium', p: 'R' + rep('G', 8) + 'B', wheels: 1 },
  { id: 'm6', tier: 'medium', p: rep('RB', 4) + rep('G', 6), wheels: 1 },
  { id: 'm7', tier: 'medium', p: rep('RB', 4) + 'R', wheels: 1 },         // (RB)x4+R or R+(BR)x4
  { id: 'm8', tier: 'medium', p: rep('RBB', 4) + 'G', wheels: 1 },
  { id: 'h1', tier: 'hard', p: rep(rep('R', 5) + 'B', 4), wheels: 2 },
  { id: 'h2', tier: 'hard', p: rep('R' + rep('B', 6), 3), wheels: 2 },
  { id: 'h3', tier: 'hard', p: rep('B' + rep('R', 5), 3) + 'B', wheels: 2 },
  { id: 'h5', tier: 'hard', p: rep(rep('RB', 4) + 'G', 3), wheels: 2 },
  { id: 'h6', tier: 'hard', p: rep('R' + rep('G', 5), 3), wheels: 2 },
  { id: 'h8', tier: 'hard', p: rep('G' + rep('R', 4), 4), wheels: 2 },
  // expert = two loops inside one loop (the inner wheel set twice per round); offered after the six looms, two at a time
  { id: 'x1', tier: 'expert', p: rep(rep('R', 5) + rep('B', 4), 3), wheels: 2 },
  { id: 'x2', tier: 'expert', p: rep(rep('R', 4) + 'G' + rep('B', 4), 2), wheels: 2 },
  { id: 'x3', tier: 'expert', p: rep(rep('RB', 3) + rep('G', 4), 3), wheels: 2 },
  { id: 'x4', tier: 'expert', p: rep(rep('G', 4) + 'R' + rep('B', 5), 2), wheels: 2 },
  { id: 'x5', tier: 'expert', p: rep(rep('B', 6) + rep('RG', 3), 3), wheels: 2 },
  // final = a loop inside a loop inside a loop, three wheels; offered once after the expert pair
  { id: 'f1', tier: 'final', p: rep(rep(rep('R', 4) + 'B', 3) + 'G', 2), wheels: 3 },
  { id: 'f2', tier: 'final', p: rep(rep('RRB', 4) + 'GG', 3), wheels: 3 },
  { id: 'f3', tier: 'final', p: rep(rep(rep('R', 5) + 'G', 2) + 'BB', 2), wheels: 3 },
];
const out = [];
for (const z of LIB) {
  const t0 = Date.now();
  const s = L.solve(z.p.split(''), z.wheels, 11);
  if (!s) { console.log('UNSOLVED', z.id); continue; }
  const flat = z.wheels >= 2 ? L.solve(z.p.split(''), z.wheels - 1, s.par) : null;   // can one wheel fewer do it as cheaply?
  if (z.wheels >= 2 && flat) { console.log('TOO FLAT', z.id); process.exitCode = 1; }
  const slots = z.wheels >= 2 ? s.par : s.par + 1;   // hard and above: no spare slot, so the nesting is the only way
  // check: the found solution really weaves it
  const chk = L.weave(s.chain, s.start, z.p.split(''));
  console.log(z.id.padEnd(4), z.tier.padEnd(7), z.p.padEnd(26), 'par', s.par, z.wheels >= 2 ? (flat ? 'fewer wheels do it too' : 'needs all its wheels') : '', chk.status, (Date.now() - t0) + 'ms',
    JSON.stringify(s.chain.map(c => c.k === 'back' ? `↺${'ABC'[c.w]}→${c.to + 1}` : c.k === 'set' ? `${'ABC'[c.w]}=${c.v}` : c.k)), JSON.stringify(s.start));
  out.push({ ...z, par: s.par, slots, sol: s.chain, set: s.start,  });
}
fs.writeFileSync('puzzles.json', JSON.stringify(out));
console.log('wrote', out.length, 'puzzles');
