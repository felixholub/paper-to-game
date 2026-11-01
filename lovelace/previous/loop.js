// The play loop on placeholder graphics. Run: node loop.js  (writes loop-log.txt). Prints, after each action, what changed and
// where the player stands, for the builder to read as the stranger: did something visible change, did it say whether it worked,
// was there a reason to think before it? Plays the stranger of the memo's walkthrough: straight chain first on task two, then the cycle.
const M = require('./mechanism.js'); const C = M.CONFIG, fs = require('fs'); const L = []; const say = s => { L.push(s); console.log(s); };
const op = (o, a, b, to) => ({ k: 'op', op: o, a, b, to: [to] }), pr = a => ({ k: 'print', a }), back = (n, test) => ({ k: 'back', n, test });
say('AIM: Hang the cards that make the Engine print what is wanted, for any numbers it is handed.');
const g = M.newGame();
const ix = nm => M.task(g).cols.findIndex(c => c.name === nm);
function show() {
  const t = M.task(g), cols = M.makeCols(t);
  say(`   STORE: ${cols.map(c => `[${c.name}: ${c.v}${c.tip ? ' (' + c.tip + ')' : ''}]`).join(' ')}   STRIP wanted: ${t.want(Object.fromEntries(cols.map(c => [c.name, c.v]))).join(' ')}`);
  say(`   CHAIN (${g.chain.length}/${C.RACK}): ${g.chain.length ? g.chain.map((c, i) => `${i + 1}. ${M.cardText(c, cols)}`).join('  |  ') : '(empty rack)'}`);
}
function hang(card) { const t = M.task(g); const ok = M.hang(g, card); say(`   tap ${card.k === 'op' ? M.OPSIGN[card.op] : card.k.toUpperCase()}, columns…  HANG THE CARD -> ${ok ? 'card drops onto the chain: "' + M.cardText(card, M.makeCols(t)) + '"' : 'refused'}`); }
function go() {
  say('   SET THE ENGINE GOING');
  const r = M.go(g);
  for (const run of r.runs) {
    const res = run.result; say(`     run on ${run.label}: ${res.trace.filter(e => e.kind === 'write').length} wheels turn, ${res.trace.filter(e => e.kind === 'back' && e.taken).length} times the prism turns back, strip prints: ${res.printed.map(M.fmt).join(' ') || '(nothing)'} -> ${res.status.toUpperCase()}`);
  }
  say(`   LINE: ${M.taskVerdict(g, r)}`);
  if (r.held) say('   [NEXT TASK]'); else say(`   [edit the chain, SET THE ENGINE GOING again${M.canHandOver(g) ? ', or HAND IT TO THE COUNTESS' : ''}]`);
  return r;
}
// task 1
say(`\n== TASK 1 OF 3 · ${M.task(g).band}   "${M.task(g).then}"`); show();
hang(op('*', ix('a'), ix('n'), ix('R'))); hang(op('*', ix('R'), ix('x'), ix('R'))); hang(pr(ix('R'))); show();
let r = go(); M.finishTask(g, r.held ? 'held' : 'handed');
// task 2: the straight chain, then the cycle
say(`\n== TASK 2 OF 3 · ${M.task(g).band}   "${M.task(g).then}"`); show();
hang(op('*', ix('a'), ix('x'), ix('R'))); for (let k = 0; k < 4; k++) hang(op('*', ix('R'), ix('x'), ix('R'))); hang(pr(ix('R'))); show();
r = go();
say('   (the stranger looks at the chain: no card touches n. Takes the chain down and hangs a cycle.)');
while (g.chain.length) M.takeDown(g, g.chain.length - 1);
hang(op('*', ix('a'), ix('1'), ix('R'))); hang(op('*', ix('R'), ix('x'), ix('R'))); hang(op('-', ix('n'), ix('1'), ix('n'))); hang(back(2, ix('n'))); hang(pr(ix('R'))); show();
r = go(); say('   COUNTESS: ' + M.task(g).countess); M.finishTask(g, r.held ? 'held' : 'handed');
// task 3
say(`\n== TASK 3 OF 3 · ${M.task(g).band}   "${M.task(g).then}"`); show();
hang(pr(ix('A'))); hang(op('+', ix('A'), ix('B'), ix('A'))); hang(op('+', ix('B'), ix('C'), ix('B'))); hang(op('-', ix('n'), ix('1'), ix('n'))); hang(back(4, ix('n'))); show();
r = go(); M.finishTask(g, r.held ? 'held' : 'handed');
const v = M.verdict(g);
say(`\nVERDICT: ${v.headline}`); say('  ' + v.did); say('  ' + v.paper); say('  ' + v.means);
const B = M.bernoulliRun(4);
say(`  CODA: the Countess's chain runs: ${B.chains.map(c => `n=${c.n}: ${c.opCards} operation cards, ${c.steps} steps, prints ${M.fmt(c.result.printed[0])}`).join('; ')}`);
fs.writeFileSync('loop-log.txt', L.join('\n') + '\n');
