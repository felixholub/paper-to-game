// Headless play of the loop (build.md, section 4.2): after each action, what changed on the sheet and what the game
// says, exactly as the page will say it (words.js). Run: node loop.js > loop-log.txt
global.MECH = require('./mechanism.js');
const W = require('./words.js');
const M = global.MECH, C = M.CONFIG;
const opt = require('./optimum.json');
const marks = Object.fromEntries(W.MARKS.map(m => [m.key, M.paceFromMult(m.mult)]));

function session(label, choose) {
  console.log('\n==================== ' + label);
  const st = M.newGame(), used = new Set();
  while (!M.playerTurnsOver(st)) {
    const news = M.engineNews(st);
    if (news) { const c = W.engineCard(news); console.log(`\n[${st.year}] ${c.title}: ${c.what} ${c.cost} ${c.when}\n  -> ${c.button}`); }
    if (M.checkEvening(st)) { evening(st, used); break; }
    const pace = choose(st);
    const plan = M.previewPlan(st, pace);
    const ruler = W.MARKS.map(m => `${m.name}: ${m.short}, coal lasts ${W.lastsShort(M.lastsUntil(st, M.paceFromMult(m.mult)))}`).join(' | ');
    console.log(`\n[${st.year}] ruler reads: ${ruler}`);
    console.log(`  set at x${plan.mult.toFixed(2)}: "${W.planReading(st, plan, st.gen === C.MAX_GENS - 1)}"`);
    const rec = M.burnGeneration(st, pace);
    const left = M.groundSquares() - st.S / M.squareTons();
    const r = W.result(rec, st, used, left, M.groundSquares());
    console.log(`  BURN ${rec.from}-${rec.to}: fire ${rec.mult.toFixed(2)}x (plan ${rec.planMult.toFixed(2)}x) -> ${rec.years[19].C.toFixed(0)} Mt; ground ${(100 * M.shareBurnt(st.S)).toFixed(0)}% gone; gone ${st.gone.toFixed(1)}M; America/Britain ${rec.americaRatio.toFixed(2)}; income x${rec.income.toFixed(2)}, per head x${rec.perHead.toFixed(2)}, days ${rec.days.toFixed(0)}`);
    console.log('  ' + r.lead); r.lines.forEach(l => console.log('  ' + l));
    if (r.quote) console.log(`  Jevons (${r.quote.where}): ${r.quote.text}`);
    if (M.checkEvening(st)) { evening(st, used); break; }
  }
  M.runOut(st);
  const v = M.verdict(st), sc = M.scoreOf(st, opt.typical), vt = W.verdict(v, st, used, sc);
  console.log(`\nLEDGER: ${v.ledger.gens.map(g => `${g.from}: per head ${W.mult(g.perHead)}, income ${W.mult(g.income)}, ${g.squares.toFixed(0)} sq`).join(' | ')} | after: ${W.mult(v.ledger.after.perHead)}, ${v.ledger.left.toFixed(0)} sq`);
  console.log(`\nVERDICT: ${vt.heading}\n  SCORE ${vt.score.head}: ${vt.score.body}`); vt.lines.forEach(l => console.log('  ' + l));
  vt.quotes.forEach(q => console.log(`  Jevons (${q.where}): ${q.text}`));
}
function evening(st, used) {
  const e = W.evening(st, used);
  console.log(`\n[${st.year}] THE EVENING. ${e.text}${e.quote ? '\n  Jevons: ' + e.quote.text : ''}`);
}
session('A stranger: as now, then a stand when the engine comes, then as now, then a stand', st => st.gen === 0 ? marks.now : st.gen === 1 ? marks.stand : st.gen < 3 ? marks.now : marks.stand);
session('Free trade to the last: as now every generation', () => marks.now);
session('Long mediocrity: a stand every generation', () => marks.stand);
session('Pushes faster', () => marks.faster);
session('Slower every generation', () => marks.slower);
session('Cuts back once, then a stand', st => st.gen === 0 ? marks.cut : marks.stand);
session('As now three times, then cuts back', st => st.gen < 3 ? marks.now : marks.cut);
session('The best path found', st => M.paceFromMult(opt.path[Math.min(st.gen, opt.path.length - 1)]));
