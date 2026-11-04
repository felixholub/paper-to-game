// Headless play of the loop (build.md, section 4.2): after each action, what changed on the sheet and what the game
// says, exactly as the page will say it (words.js). Run: node loop.js > loop-log.txt
global.MECH = require('./mechanism.js');
const W = require('./words.js');
const M = global.MECH, C = M.CONFIG;
const marks = Object.fromEntries(W.MARKS.map(m => [m.key, M.paceFromMult(m.mult)]));

function session(label, choose, fits) {
  console.log('\n==================== ' + label);
  const st = M.newGame(), used = new Set();
  while (!st.ended) {
    const off = M.engineOffer(st);
    if (off) {
      const card = W.engineCard(off), fit = fits(off, st);
      console.log(`\n[${st.year}] ${card.title}: ${card.body} ${card.rule}\n  -> ${fit ? 'FIT IT' : 'REFUSE IT'}`);
      M.decideEngine(st, fit);
    }
    if (M.checkEvening(st)) { evening(st, used); break; }
    const pace = choose(st);
    const plan = M.previewPlan(st, pace);
    console.log(`\n[${st.year}] ruler at x${plan.mult.toFixed(2)}: "${W.planReading(st, plan)}"`);
    const rec = M.burnGeneration(st, pace);
    const r = W.result(rec, st, used);
    console.log(`  BURN ${rec.from}-${rec.to}: fire ${rec.mult.toFixed(2)}x (plan ${rec.planMult.toFixed(2)}x) -> ${rec.years[19].C.toFixed(0)} Mt; ground ${(100 * M.shareBurnt(st.S)).toFixed(0)}% gone; gone ${st.gone.toFixed(1)}M; America/Britain ${rec.americaRatio.toFixed(2)}`);
    console.log('  ' + r.lead); r.lines.forEach(l => console.log('  ' + l));
    if (r.quote) console.log(`  Jevons (${r.quote.where}): ${r.quote.text}`);
    if (M.checkEvening(st)) { evening(st, used); break; }
  }
  const v = M.verdict(st), vt = W.verdict(v, st, used);
  console.log(`\nVERDICT: ${vt.heading}`); vt.lines.forEach(l => console.log('  ' + l));
  vt.quotes.forEach(q => console.log(`  Jevons (${q.where}): ${q.text}`));
}
function evening(st, used) {
  const e = W.evening(st, used);
  console.log(`\n[${st.year}] ${e.text}${e.quote ? '\n  Jevons: ' + e.quote.text : ''}`);
  M.runOut(st);
}
const yes = () => true, no = () => false;
session('A stranger: as now, fits the engine to make the coal last, then holds it level', st => st.gen === 0 ? marks.now : st.gen === 1 ? marks.stand : st.gen < 3 ? marks.now : marks.stand, (o) => o.key === 'air');
session('Free trade to the last: as now every generation, fits both engines', () => marks.now, yes);
session('Long mediocrity: a stand every generation, refuses both engines', () => marks.stand, no);
session('Pushes faster, fits both', () => marks.faster, yes);
session('Slower every generation, fits both', () => marks.slower, yes);
session('Cuts back once, then a stand, fits both', st => st.gen === 0 ? marks.cut : marks.stand, yes);
