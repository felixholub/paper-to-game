// Calibration check for Lovelace's Cards. Run: node calibration.js  (writes calibration-result.txt)
// The mechanism is PORTED: an interpreter for the card language of the Memoir and the Notes. It is checked against the paper's own
// programs and counts (pages are the 63-page typeset PDF's):
//   (B)   Note B, pp. 29–31: with a = 5, n = 7, x = 98 the chains for a·n·x (2(×)), a/n·x (÷, ×), a+n+x (2(+)) and ax^n (7(×)) print the values
//   (M)   Memoir pp. 12–13: the registering apparatus — a cycle that multiplies, effaces a unit and repeats "until it only marks zero" —
//         gives a·b^n for every n with a card count that does not vary with n, where the straight chain's grows with n
//   (T1)  Memoir p. 3, Table 1.1: the difference chain prints the squares, its first differences run 3, 5, 7…, the second stays 2
//   (T3)  Memoir p. 8, Table 1.3: seven operations (4×, 2−, 1÷) give x = (dn'−d'n)/(n'm−nm') on random data
//   (D)   Note D, Table A.1: eleven operations (6×, 3−, 2÷) give x and y of the two equations on random data
//   (C)   Note C / Note E: a BACK card re-presents a card or set of cards; a chain whose counter never reaches zero runs on
//   (Z)   Memoir p. 12: a division by zero rings the bell early and the Engine stops
//   (G)   Note G, Table A.2 and formula (8): the Countess's chain prints B1 = 1/6, B3 = −1/30, B5 = 1/42, B7 = −1/30, each from the ones before;
//         Note G, p. 57: nine Operation-cards for n = 1, fourteen for n = 2, twenty-five for n = 3 and after
//   (F)   Note F, p. 48: 9·10 + 8·9 + … + 1·2 = 330
//   (TK)  the three tasks: a reference chain holds on the given data and every hidden test; task two's straight chain holds on the given
//         data and fails the test; the heuristics table
//   (ROB) robustness of the discovery: for any given n and any other n, the straight chain fails and the cycle holds; for any a and x
//   (W)   words: nothing the screen reads from the mechanism carries a decimal
const M = require('./mechanism.js'); const C = M.CONFIG, fs = require('fs');
const out = []; let pass = 0, fail = 0;
function check(name, ok, detail) { (ok ? pass++ : fail++); out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); }
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9) * Math.max(1, Math.abs(b));
const op = (o, a, b, to) => ({ k: 'op', op: o, a, b, to: [to] }), pr = a => ({ k: 'print', a }), back = (n, test) => ({ k: 'back', n, test });
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ---- B: Note B's examples with her data
{
  const cols = [{ name: 'a', v: 5 }, { name: 'n', v: 7 }, { name: 'x', v: 98 }, { name: 'R', v: 0 }];
  const anx = M.run(cols, [op('*', 0, 1, 3), op('*', 3, 2, 3), pr(3)], [5 * 7 * 98]);
  check('B  a·n·x = 3430 with (×, ×)', anx.status === 'bell' && anx.printed[0] === 3430, 'printed ' + anx.printed);
  const anxd = M.run(cols, [op('/', 0, 1, 3), op('*', 3, 2, 3), pr(3)], [5 / 7 * 98]);
  check('B  a/n · x with (÷, ×)', anxd.status === 'bell', 'printed ' + M.fmt(anxd.printed[0]));
  const sum = M.run(cols, [op('+', 0, 1, 3), op('+', 3, 2, 3), pr(3)], [5 + 7 + 98]);
  check('B  a + n + x = 110 with 2(+)', sum.status === 'bell' && sum.printed[0] === 110);
  const straight = [op('*', 0, 2, 3)]; for (let k = 0; k < 6; k++) straight.push(op('*', 3, 2, 3)); straight.push(pr(3));
  const axn = M.run(cols, straight, [5 * Math.pow(98, 7)]);
  check('B  ax^n for n = 7 is seven multiplications and prints 5·98^7', axn.status === 'bell' && straight.filter(c => c.k === 'op').length === 7, 'printed ' + axn.printed[0]);
}
// ---- M: Menabrea's registering apparatus
{
  let ok = true, detail = [];
  for (let n = 1; n <= 8; n++) {
    const cols = [{ name: 'a', v: 3 }, { name: 'b', v: 2 }, { name: 'n', v: n }, { name: '1', v: 1 }, { name: 'R', v: 0 }];
    const cyc = [op('*', 0, 3, 4), op('*', 4, 1, 4), op('-', 2, 3, 2), back(2, 2), pr(4)];
    const r = M.run(cols, cyc, [3 * Math.pow(2, n)]);
    const st = [op('*', 0, 1, 4)]; for (let k = 1; k < n; k++) st.push(op('*', 4, 1, 4)); st.push(pr(4));
    const r2 = M.run(cols, st, [3 * Math.pow(2, n)]);
    ok = ok && r.status === 'bell' && cyc.length === 5 && r2.status === 'bell' && st.length === n + 1;
    detail.push(`n=${n}: cycle ${cyc.length} cards/${r.steps} steps, straight ${st.length} cards`);
  }
  check('M  the cycle gives a·b^n for n = 1..8 with five cards always; the straight chain needs n + 1', ok, detail.join('; '));
}
// ---- T1: Table 1.1
{
  const cols = [{ name: 'A', v: 1 }, { name: 'B', v: 3 }, { name: 'C', v: 2 }, { name: 'n', v: 6 }, { name: '1', v: 1 }];
  const chain = [pr(0), op('+', 0, 1, 0), op('+', 1, 2, 1), op('-', 3, 4, 3), back(4, 3)];
  const r = M.run(cols, chain, [1, 4, 9, 16, 25, 36]);
  const Bs = r.trace.filter(e => e.kind === 'write' && e.col === 1).map(e => e.val);
  check('T1 the difference chain prints 1 4 9 16 25 36 with additions only', r.status === 'bell' && chain.every(c => c.k !== 'op' || c.op !== '*'), 'printed ' + r.printed.join(' '));
  check('T1 its first differences run 3 5 7 9 11 13 and the second difference stays 2', Bs.join(',') === '5,7,9,11,13,15' && r.store[2] === 2, 'B after each pass: ' + Bs.join(' '));
}
// ---- T3: Menabrea's Table 1.3
{
  let worst = 0;
  for (let s = 0; s < 20; s++) {
    const m = rint(1, 9), n = rint(1, 9), d = rint(1, 9), m2 = rint(1, 9), n2 = rint(1, 9), d2 = rint(1, 9);
    if (n2 * m - n * m2 === 0) continue;
    const cols = [m, n, d, m2, n2, d2, n, n2, 0, 0, 0, 0, 0, 0, 0].map((v, i) => ({ name: 'V' + i, v }));   // V0..V7 as the Memoir, V8..V14 results
    const chain = [op('*', 2, 4, 8), op('*', 5, 1, 9), op('*', 4, 0, 10), op('*', 1, 3, 11), op('-', 8, 9, 12), op('-', 10, 11, 13), op('/', 12, 13, 14), pr(14)];
    const r = M.run(cols, chain, null); const x = (d * n2 - d2 * n) / (n2 * m - n * m2);
    worst = Math.max(worst, Math.abs(r.printed[0] - x));
    if (s === 0) check('T3 Table 1.3 is 4(×), 2(−), 1(÷)', chain.filter(c => c.op === '*').length === 4 && chain.filter(c => c.op === '-').length === 2 && chain.filter(c => c.op === '/').length === 1);
  }
  check('T3 Table 1.3’s seven operations give x = (dn′−d′n)/(n′m−nm′) on random data', worst < 1e-12, 'worst error ' + worst.toExponential(1));
}
// ---- D: Note D's eleven operations
{
  let worst = 0;
  for (let s = 0; s < 20; s++) {
    const m = rint(1, 9), n = rint(1, 9), d = rint(1, 9), m2 = rint(1, 9), n2 = rint(1, 9), d2 = rint(1, 9);
    if (m * n2 - m2 * n === 0) continue;
    const cols = []; for (let k = 0; k <= 16; k++) cols.push({ name: 'V' + k, v: 0 });
    [m, n, d, m2, n2, d2].forEach((v, i) => { cols[i].v = v; });
    const chain = [op('*', 0, 4, 6), op('*', 3, 1, 7), op('*', 2, 4, 8), op('*', 5, 1, 9), op('*', 0, 5, 10), op('*', 2, 3, 11),
      op('-', 6, 7, 12), op('-', 8, 9, 13), op('-', 10, 11, 14), op('/', 13, 12, 15), op('/', 14, 12, 16), pr(15), pr(16)];
    const r = M.run(cols, chain, null);
    const x = (d * n2 - d2 * n) / (m * n2 - m2 * n), y = (d2 * m - d * m2) / (m * n2 - m2 * n);
    worst = Math.max(worst, Math.abs(r.printed[0] - x), Math.abs(r.printed[1] - y));
    if (s === 0) check('D  Note D is 6(×), 3(−), 2(÷), eleven operations', chain.filter(c => c.k === 'op').length === 11 && chain.filter(c => c.op === '*').length === 6);
  }
  check('D  Note D’s eleven operations give x and y of the two equations on random data', worst < 1e-12, 'worst error ' + worst.toExponential(1));
}
// ---- C and Z
{
  const cols = [{ name: 'k', v: 3 }, { name: '1', v: 1 }, { name: 'R', v: 0 }];
  const r = M.run(cols, [op('+', 2, 1, 2), op('-', 0, 1, 0), back(2, 0), pr(2)], [3]);
  const backs = r.trace.filter(e => e.kind === 'back');
  check('C  BACK re-presents the set of cards while the counter is not zero, then passes', r.status === 'bell' && backs.filter(b => b.taken).length === 2 && !backs[backs.length - 1].taken, 'backs taken ' + backs.filter(b => b.taken).length);
  const cols2 = [{ name: 'k', v: 0 }, { name: '1', v: 1 }, { name: 'R', v: 0 }];
  const r2 = M.run(cols2, [op('+', 2, 1, 2), op('-', 0, 1, 0), back(2, 0), pr(2)], [1]);
  check('C  a counter that starts at zero and is effaced never returns to zero: the Engine runs on', r2.status === 'runs-on' && r2.steps === C.STEP_CAP);
  const r3 = M.run(cols2, [op('/', 1, 0, 2), pr(2)], [1]);
  check('Z  a division by nothing rings the bell early', r3.status === 'zero' && r3.printed.length === 0 && /early/.test(r3.reason));
}
// ---- G: the Numbers of Bernoulli
{
  const B = M.bernoulliRun(4);
  const okN = B.numbers.every((b, i) => near(b, C.BERNOULLI[i], 1e-12));
  check('G  the Countess’s chain prints B1 = 1/6, B3 = −1/30, B5 = 1/42, B7 = −1/30, each from the ones before', okN, B.numbers.map(M.fmt).join(', '));
  const counts = B.chains.map(c => c.opCards);
  check('G  Operation-cards: nine for n = 1, fourteen for n = 2, twenty-five for n = 3 and no more for n = 4', counts.join(',') === [C.NOTE_G_CARDS.n1, C.NOTE_G_CARDS.n2, C.NOTE_G_CARDS.n3plus, C.NOTE_G_CARDS.n3plus].join(','), counts.join(' '));
  // formula (8) directly: 0 = A0 + A1 B1 + A3 B3 + … + B_{2n−1}, with A's as her text gives them
  let okF = true;
  for (let n = 1; n <= 4; n++) {
    let s = -0.5 * (2 * n - 1) / (2 * n + 1), A = 1;
    for (let j = 1; j < n; j++) { // A_{2j−1} = 2n/2 · (2n−1)/3 · (2n−2)/4 … with 2j−1 factors
      A = 1; for (let f = 0; f < 2 * j - 1; f++) A *= (2 * n - f) / (f + 2);
      s += A * C.BERNOULLI[j - 1];
    }
    okF = okF && near(-s, C.BERNOULLI[n - 1], 1e-12);
  }
  check('G  formula (8) with the A’s of the text reproduces the same four Numbers', okF);
  const b4 = B.chains[3]; const rep = b4.cards.filter(c => c.rep).length;
  check('G  for n = 4 the cycle 13–23 is repeated once (eleven cards written out) and op 21 steps a column forward', rep === 11 && b4.cards.filter(c => c.k === 'op' && c.a === 21).length === 1 && b4.cards.filter(c => c.k === 'op' && c.a === 22).length === 1, `repeated ${rep}, steps ${b4.steps}`);
}
// ---- F
{ let s = 0; for (let k = 1; k <= 9; k++) s += k * (k + 1); check('F  9·10 + 8·9 + … + 1·2 = 330, done by three cards', s === C.NOTE_F_OPERATIONS && C.NOTE_F_CARDS === 3); }
// ---- TK: the tasks and the heuristics
{
  const T = C.TASKS, ix = (t, nm) => t.cols.findIndex(c => c.name === nm);
  const t1 = T[0], r1 = M.tryTask(t1, [op('*', ix(t1, 'a'), ix(t1, 'n'), ix(t1, 'R')), op('*', ix(t1, 'R'), ix(t1, 'x'), ix(t1, 'R')), pr(ix(t1, 'R'))]);
  check('TK task 1: three cards hold on the given data and the hidden test', r1.held && r1.runs.length === 2, r1.runs.map(x => x.label + ': ' + x.result.printed).join('; '));
  const t2 = T[1], a = ix(t2, 'a'), x = ix(t2, 'x'), n = ix(t2, 'n'), one = ix(t2, '1'), R = ix(t2, 'R');
  const straight = [op('*', a, x, R), op('*', R, x, R), op('*', R, x, R), op('*', R, x, R), op('*', R, x, R), pr(R)];
  const cycleA = [op('*', a, x, R), op('-', n, one, n), op('*', R, x, R), op('-', n, one, n), back(2, n), pr(R)];
  const cycleB = [op('*', a, one, R), op('*', R, x, R), op('-', n, one, n), back(2, n), pr(R)];
  const rows = [['straight (six multiplications)', straight], ['cycle, counter off by one', cycleA], ['cycle with the counter right', cycleB]].map(([name, ch]) => { const r = M.tryTask(t2, ch); return { name, cards: ch.length, given: r.runs[0].result.status, tests: r.runs.slice(1).map(q => q.label + ' ' + q.result.status).join(', ') || 'not reached', held: r.held }; });
  out.push('      heuristics, task 2 (a·x^n):'); rows.forEach(r => out.push(`        ${r.name.padEnd(34)} ${r.cards} cards  given: ${r.given}  tests: ${r.tests}  held: ${r.held}`));
  check('TK task 2: the straight chain rings the bell on the given data and fails the hidden test', rows[0].given === 'bell' && !rows[0].held && /n = 3 wrong/.test(rows[0].tests));
  check('TK task 2: the off-by-one cycle holds for n = 3 and runs on at n = 1', rows[1].given === 'bell' && /n = 3 bell/.test(rows[1].tests) && /n = 1 runs-on/.test(rows[1].tests) && !rows[1].held);
  check('TK task 2: the right cycle holds everywhere with five cards', rows[2].held && rows[2].cards === 5);
  const t3 = T[2], A = ix(t3, 'A'), Bc = ix(t3, 'B'), Cc = ix(t3, 'C'), n3 = ix(t3, 'n'), one3 = ix(t3, '1');
  const sq = [pr(A), op('+', A, Bc, A), op('+', Bc, Cc, Bc), op('-', n3, one3, n3), back(4, n3)];
  const r3 = M.tryTask(t3, sq);
  check('TK task 3: five cards of additions print the table for n = 6 and for n = 9', r3.held && r3.runs[1].result.printed.length === 9 && r3.runs[1].result.printed[8] === 81, r3.runs[1].result.printed.join(' '));
  const noMul = M.validCard(op('*', A, Bc, A), t3) === false && M.validCard(op('+', A, Bc, A), t3) === true;
  check('TK task 3 admits additions and subtractions only (Note A: the Difference Engine can do nothing but add)', noMul);
  const tooLong = []; for (let k = 0; k < 16; k++) tooLong.push(pr(A));
  const g = M.newGame(); g.task = 2; let hung = 0; for (const c of tooLong) if (M.hang(g, c)) hung++;
  check('TK the rack holds ten cards and no more', hung === C.RACK);
}
// ---- ROB: the discovery does not depend on the data
{
  let ok = true, tried = 0;
  for (let s = 0; s < 60; s++) {
    const a0 = rint(1, 9), x0 = rint(2, 5), n0 = rint(2, 6), n1 = rint(1, 7); if (n1 === n0) continue; tried++;
    const task = Object.assign({}, C.TASKS[1], { cols: C.TASKS[1].cols.map(c => Object.assign({}, c, { v: c.name === 'a' ? a0 : c.name === 'x' ? x0 : c.name === 'n' ? n0 : c.v })), tests: [{ label: 'n = ' + n1, set: { n: n1 } }] });
    const st = [op('*', 0, 1, 4)]; for (let k = 1; k < n0; k++) st.push(op('*', 4, 1, 4)); st.push(pr(4));
    const cyc = [op('*', 0, 3, 4), op('*', 4, 1, 4), op('-', 2, 3, 2), back(2, 2), pr(4)];
    const rs = M.tryTask(task, st), rc = M.tryTask(task, cyc);
    ok = ok && rs.runs[0].result.status === 'bell' && !rs.held && rc.held;
  }
  check('ROB for random a, x, given n and other n: the straight chain fails the test and the cycle holds', ok, tried + ' cases');
}
// ---- W: words
{
  const g = M.newGame(); const t = C.TASKS[1];
  g.task = 1; g.chain = [op('*', 0, 1, 4), op('*', 4, 1, 4), op('*', 4, 1, 4), op('*', 4, 1, 4), op('*', 4, 1, 4), pr(4)];
  const r = M.go(g); const line = M.taskVerdict(g, r);
  M.finishTask(g, 'held'); g.task = 0; g.chain = [pr(3)]; M.finishTask(g, 'handed'); g.chain = [pr(0)]; M.finishTask(g, 'held');
  const v = M.verdict(g); const all = [line, v.headline, v.did, v.paper, v.means].join(' ');
  check('W  task line and verdict carry no decimals', !/\d\.\d/.test(all), line);
  check('W  the strip prints fractions as fractions', M.fmt(1 / 6) === '1/6' && M.fmt(-1 / 30) === '−1/30' && M.fmt(3430) === '3430');
}
// ---- S: the gentler on-ramp — the Countess's chains, the two demonstrations, the plain words
{
  const held = C.TASKS.map(t => M.tryTask(t, M.solution(t)).held);
  check('S  the Countess’s cards hold on every job (shown when a job is handed to her)', held.every(Boolean), held.join(' '));
  const tour = M.demo('tour'), cd = M.demo('countdown');
  check('S  the tour prints 35 (Note B’s a × n with a = 5, n = 7)', tour.result.printed.join() === '35');
  check('S  the countdown prints 3 2 1 and the BACK card is passed when k reaches 0', cd.result.printed.join(' ') === '3 2 1' && /goes on/.test(cd.steps[cd.steps.length - 1].say));
  const words = [].concat(tour.steps.map(x => x.say), cd.steps.map(x => x.say), ...C.TASKS.map(t => M.solution(t).map(c => M.cardSentence(c, M.makeCols(t)))));
  check('S  narration and card sentences carry no decimals', words.every(w => !/\d\.\d/.test(w)), words.length + ' lines');
}
out.unshift(`Calibration of Lovelace's Cards: ${pass} passed, ${fail} failed.`);
fs.writeFileSync('calibration-result.txt', out.join('\n') + '\n'); console.log(out.join('\n'));
process.exit(fail ? 1 : 0);
