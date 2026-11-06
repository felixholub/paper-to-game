// The best path found (build.md, section 3, and the score): the pace per generation, over the ruler's marks and then
// finer steps, that gives the highest typical generation (mechanism.js, typicalOf). Run by build.py; writes
// optimum.json, which the page embeds as OPTIMUM and calibration.js checks against a fresh search.
// Run: node optimum.js
const M = require('./mechanism.js'); const C = M.CONFIG; const fs = require('fs');
const NG = C.MAX_GENS, MARKS = [0.5, 1, 1.5, 2, 2.4], LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.2, 2.4];
function search() {
  const t0 = Date.now();
  let best = null, runs = 0;
  // every path over the five marks for the first five generations, the rest at the fifth
  const rec = (prefix, depth) => {
    if (depth === 5) { const st = M.playPath(prefix); runs++; const v = M.typicalOf(st); if (!best || v > best.v) best = { v, path: prefix.slice() }; return; }
    for (const m of MARKS) { prefix.push(m); rec(prefix, depth + 1); prefix.pop(); }
  };
  rec([], 0);
  // then coordinate ascent over all ten generations, in finer steps
  let cur = best.path.concat(Array(NG - 5).fill(best.path[4])), curv = M.typicalOf(M.playPath(cur));
  for (let sweep = 0; sweep < 12; sweep++) {
    let improved = false;
    for (let i = 0; i < NG; i++) for (const m of LEVELS) {
      if (m === cur[i]) continue;
      const t = cur.slice(); t[i] = m; const v = M.typicalOf(M.playPath(t)); runs++;
      if (v > curv + 1e-9) { cur = t; curv = v; improved = true; }
    }
    if (!improved) break;
  }
  const st = M.playPath(cur), L = M.ledger(st);
  return { typical: curv, path: cur, perHead: L.gens.map(g => +g.perHead.toFixed(3)), after: +L.after.perHead.toFixed(3),
    left: +L.left.toFixed(1), noonMult: +(Math.max(...st.history.map(h => h.C)) / C.C0).toFixed(2), runs, ms: Date.now() - t0 };
}
const r = search();
if (require.main === module) {
  fs.writeFileSync(__dirname + '/optimum.json', JSON.stringify(r, null, 1) + '\n');
  console.log(`best typical x${r.typical.toFixed(3)} on ${r.path.join(' ')} (${r.runs} runs, ${r.ms} ms); per head ${r.perHead.join(' ')}, after ${r.after}, left ${r.left}, noon x${r.noonMult}`);
}
module.exports = { search };
