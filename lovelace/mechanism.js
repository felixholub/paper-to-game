// Lovelace's Cards — the mechanism. The only copy: calibration.js runs this file in Node, build.py inlines it verbatim into the HTML.
// PORTED from Menabrea (1842) / Lovelace (1843), Scientific Memoirs 3: the Store of columns (Note B), cards that put the mill into a
// state and name the columns it reads and writes (Notes B, D), the prism that revolves backwards so that cards do duty again (Note C, E),
// the contingent course felt by a subtraction (Note G, Operation 7; Memoir p. 12), the bell (Memoir p. 12), and the Numbers of
// Bernoulli (Note G, Table A.2) run on the same interpreter. Page numbers are the 63-page typeset PDF's.
(function (root) {
  'use strict';
  const CONFIG = {
    RACK: 10,              // our choice: cards a chain may hold; Lovelace: "There is no limit to the number of cards" (Memoir p. 15)
    STEP_CAP: 400,         // our choice: the attendant stops an Engine that runs on (Memoir p. 12: the Engine stops and rings when it cannot go on)
    BACK_MAX: 8,           // our choice: how far one card may turn the prism back (Note C: any particular card or set of cards)
    HAND_OVER_AFTER: 2,    // our choice: runs before a task may be handed to the Countess
    WHEELS: 6,             // our choice: figure-wheels drawn per column; Note B draws four tiers and says thirty or forty may be supposed
    // The three tasks, the paper's own examples, ordered for the player (memo §11).
    TASKS: [
      { id: 'anx', band: 'a · n · x', short: 'a·n·x', ask: 'Print a · n · x.',
        // Note B, p. 29: a = 5, n = 7, x = 98 on V1, V2, V3; p. 31: for a·n·x "the operations would be (×, ×), or 2(×)"
        cols: [{ name: 'a', v: 5 }, { name: 'n', v: 7 }, { name: 'x', v: 98 }, { name: 'R', v: 0, work: true }],
        want: d => [d.a * d.n * d.x],
        tests: [{ label: 'a = 3, n = 4, x = 10', set: { a: 3, n: 4, x: 10 } }],   // our choice: numbers the chain has not seen
        ops: ['+', '-', '*', '/'],
        then: 'Then the Engine will be handed other numbers.',
        countess: 'Her count for a·n·x is two multiplications: (×, ×). The same cards serve whatever a, n and x are inscribed, because the cards name columns, not numbers. (Note B)' },
      { id: 'axn', band: 'a · xⁿ', short: 'a·xⁿ', ask: 'Print a · xⁿ, which is a times x multiplied by itself n times.',
        // Note B, p. 30: ax^n is "six multiplications in order to get x^n, then one multiplication for a·x^n, in all seven" (n = 7);
        // Memoir pp. 12–13: a registering apparatus marks n−1, the multiplication is repeated and a unit effaced each time, "until it only marks zero".
        cols: [{ name: 'a', v: 3 }, { name: 'x', v: 2 }, { name: 'n', v: 5 }, { name: '1', v: 1, konst: true }, { name: 'R', v: 0, work: true }],   // our data: wheels stay readable
        want: d => [d.a * Math.pow(d.x, d.n)],
        tests: [{ label: 'n = 3', set: { n: 3 } }, { label: 'n = 1', set: { n: 1 } }],   // our choice; n = 1 is the case Lovelace's Operation 7 exists for (p. 56)
        ops: ['+', '-', '*', '/'],
        then: 'Then the Engine will be handed other n.',
        countess: 'Her straight count for n = 7 is seven multiplications. Menabrea’s way is a cycle: multiply, efface a unit from a counter, and repeat “until it only marks zero”; the number of cards then does not vary with n. (Note B; Memoir pp. 12–13)' },
      { id: 'squares', band: 'The table of squares', short: 'the table of squares', ask: 'Print the first n squares, one after another.',
        // Memoir p. 3, Table 1.1: squares 1, 4, 9, 16…; first differences 3, 5, 7…; second differences all 2. Note A: the Difference Engine is 6(+).
        // Lovelace p. 24: "The table of squares, for instance, can be calculated to any extent whatever, when the numbers one and two are furnished."
        cols: [{ name: 'A', v: 1, tip: 'a square' }, { name: 'B', v: 3, tip: 'next difference' }, { name: 'C', v: 2, tip: 'second difference' }, { name: 'n', v: 6 }, { name: '1', v: 1, konst: true }],
        want: d => { const out = []; for (let k = 1; k <= d.n; k++) out.push(k * k); return out; },
        tests: [{ label: 'n = 9', set: { n: 9 } }],   // our choice
        ops: ['+', '-'],   // Note A, p. 22: the Difference Engine "can in reality do nothing but add"
        then: 'Additions and subtractions only. Then the Engine will be handed another n.',
        countess: 'The Difference Engine, she writes, is the whole of one operation repeated: (+, +, +, +, +, +), or 6(+). Each square is the one before it plus the next difference, and each difference is the one before it plus two. “The table of squares can be calculated to any extent whatever, when the numbers one and two are furnished.” (Note A; Memoir p. 3)' },
    ],
    // Numbers quoted on the verdict screen, from the Notes.
    NOTE_F_CARDS: 3, NOTE_F_OPERATIONS: 330,     // Note F, p. 48: "three Operation-cards would perform the office of 330 such cards"
    NOTE_G_CARDS: { n1: 9, n2: 14, n3plus: 25 },  // Note G, p. 57: nine, fourteen, twenty-five, "but no more are needed, however great n may be"
    NOTE_D_CARDS: 3, NOTE_D_OPERATIONS: 11,      // Note D, p. 38: eleven operations with only three Operation-cards
    BERNOULLI: [1 / 6, -1 / 30, 1 / 42, -1 / 30],  // Note G, formula (8) and the text: B1, B3, B5, B7 (Lovelace's indices; signed as formula (8) gives)
    STRIP_FRACTION_MAX_DENOMINATOR: 1000,         // our choice: how the strip prints a fraction
  };

  // ---- the Store
  function makeCols(task, set) {
    return task.cols.map(c => ({ name: c.name, v: (set && set[c.name] !== undefined) ? set[c.name] : c.v, work: !!c.work, konst: !!c.konst, tip: c.tip || '' }));
  }
  function colIndex(cols, name) { return cols.findIndex(c => c.name === name); }

  // ---- cards. {k:'op', op:'+|-|*|/', a, b, to:[...]} | {k:'print', a} | {k:'back', n, test}
  const OPSIGN = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  function cardText(card, cols) {
    const nm = i => cols[i] ? cols[i].name : '?';
    if (card.k === 'op') return `${nm(card.a)} ${OPSIGN[card.op]} ${nm(card.b)} → ${card.to.map(nm).join(', ')}`;
    if (card.k === 'print') return `PRINT ${nm(card.a)}`;
    if (card.k === 'back') return `BACK ${card.n} WHILE ${nm(card.test)} ≠ 0`;
    return '?';
  }
  function validCard(card, task) {
    if (!card || !card.k) return false;
    const n = task.cols.length, ok = i => Number.isInteger(i) && i >= 0 && i < n;
    if (card.k === 'op') return task.ops.includes(card.op) && ok(card.a) && ok(card.b) && Array.isArray(card.to) && card.to.length > 0 && card.to.every(ok);
    if (card.k === 'print') return ok(card.a);
    if (card.k === 'back') return Number.isInteger(card.n) && card.n >= 1 && card.n <= CONFIG.BACK_MAX && ok(card.test);
    return false;
  }

  // ---- the Engine. Runs a chain over a Store; returns the strip, a trace for the wheels, and how it stopped.
  // status: 'bell' (strip equals what was wanted) | 'wrong' (it stopped, strip differs) | 'runs-on' (step cap) | 'zero' (a division by zero: the bell rings early)
  function run(cols, cards, want, opts) {
    const cap = (opts && opts.cap) || CONFIG.STEP_CAP;
    const st = cols.map(c => c.v), printed = [], trace = [];
    let i = 0, steps = 0, zero = false;
    while (i < cards.length && steps < cap) {
      const c = cards[i]; steps++;
      if (c.k === 'op') {
        const x = st[c.a], y = st[c.b]; let r;
        if (c.op === '+') r = x + y; else if (c.op === '-') r = x - y; else if (c.op === '*') r = x * y;
        else { if (y === 0) { trace.push({ i, kind: 'zero' }); zero = true; break; } r = x / y; }
        for (const t of c.to) { st[t] = r; trace.push({ i, kind: 'write', col: t, val: r }); }
        i++;
      } else if (c.k === 'print') { printed.push(st[c.a]); trace.push({ i, kind: 'print', val: st[c.a] }); i++; }
      else if (c.k === 'back') {
        const taken = st[c.test] !== 0, to = Math.max(0, i - c.n);
        trace.push({ i, kind: 'back', to, taken });
        i = taken ? to : i + 1;
      } else i++;
    }
    let status;
    if (zero) status = 'zero'; else if (steps >= cap && i < cards.length) status = 'runs-on';
    else status = (want && same(printed, want)) ? 'bell' : 'wrong';
    return { status, printed, trace, steps, store: st, want: want || null, reason: reason(status, printed, want) };
  }
  function same(a, b) { if (!b || a.length !== b.length) return false; for (let k = 0; k < a.length; k++) if (Math.abs(a[k] - b[k]) > 1e-9 * Math.max(1, Math.abs(b[k]))) return false; return true; }
  function reason(status, printed, want) {
    if (status === 'bell') return 'The bell rang.';
    if (status === 'zero') return 'The bell rang early: a division by nothing. The Engine stopped.';
    if (status === 'runs-on') return 'The Engine runs on and the bell does not ring. The attendant stops it.';
    if (!printed.length) return 'The Engine stopped and had printed nothing.';
    if (!want) return 'The Engine stopped.';
    return `It printed ${printed.map(fmt).join(' ')} and ${want.length === 1 ? 'the number wanted was' : 'the numbers wanted were'} ${want.map(fmt).join(' ')}.`;
  }

  // ---- numbers on the strip: whole numbers as they are, fractions as fractions, else four places (the coda only; tasks print whole numbers)
  function fraction(x, maxq) {
    maxq = maxq || CONFIG.STRIP_FRACTION_MAX_DENOMINATOR;
    if (!isFinite(x)) return null; if (Math.abs(x - Math.round(x)) < 1e-9) return { p: Math.round(x), q: 1 };
    for (let q = 2; q <= maxq; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < 1e-9) return { p, q }; }
    return null;
  }
  function fmt(x) { const f = fraction(x); if (!f) return String(Math.round(x * 10000) / 10000); return f.q === 1 ? String(f.p) : `${f.p < 0 ? '−' : ''}${Math.abs(f.p)}/${f.q}`; }

  // ---- a task: run on the given data, then on every hidden test
  function tryTask(task, cards) {
    const runs = [];
    const given = makeCols(task); const d0 = dataOf(given);
    runs.push({ label: 'the numbers given', cols: given, result: run(given, cards, task.want(d0)) });
    if (runs[0].result.status === 'bell') {
      for (const t of task.tests) { const cols = makeCols(task, t.set); const r = run(cols, cards, task.want(dataOf(cols))); runs.push({ label: t.label, cols, result: r }); if (r.status !== 'bell') break; }
    }
    const held = runs.every(r => r.result.status === 'bell') && runs.length === 1 + task.tests.length;
    return { runs, held, cards: cards.length };
  }
  function dataOf(cols) { const d = {}; for (const c of cols) d[c.name] = c.v; return d; }

  // ---- the game
  function newGame() { return { task: 0, chain: [], runsUsed: 0, done: [], over: false }; }
  function task(g) { return CONFIG.TASKS[g.task]; }
  function hang(g, card) { const t = task(g); if (g.chain.length >= CONFIG.RACK || !validCard(card, t)) return false; g.chain.push(card); return true; }
  function takeDown(g, idx) { if (idx < 0 || idx >= g.chain.length) return false; g.chain.splice(idx, 1); return true; }
  function go(g) { const t = task(g); if (!g.chain.length) return null; g.runsUsed++; const r = tryTask(t, g.chain); g.last = r; return r; }
  function canHandOver(g) { return g.runsUsed >= CONFIG.HAND_OVER_AFTER && !(g.last && g.last.held); }
  function finishTask(g, how) { // how: 'held' | 'handed'
    const t = task(g); g.done.push({ id: t.id, band: t.band, short: t.short, how, cards: g.chain.length, runs: g.runsUsed, chain: g.chain.slice() });
    g.task++; g.chain = []; g.runsUsed = 0; g.last = null; if (g.task >= CONFIG.TASKS.length) g.over = true;
  }
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const word = n => (n <= 20 ? WORDS[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '') : n === 330 ? 'three hundred and thirty' : String(n));
  function taskVerdict(g, r) { // the line under a run: in the aim's units
    const t = task(g); const held = r.held, n = g.chain.length;
    if (held) { const tests = r.runs.slice(1).map(x => x.label); return `The bell rang. ${cap1(word(n))} card${n === 1 ? '' : 's'}. It held for ${tests.join(' and for ')}.`; }
    const bad = r.runs[r.runs.length - 1];
    if (r.runs.length === 1) return `No bell on the numbers given. ${bad.result.reason}`;
    const good = r.runs.slice(0, -1).slice(1).map(x => x.label);
    return `It held for the numbers given${good.length ? ' and for ' + good.join(' and ') : ''}, and fell at ${bad.label}. ${bad.result.reason}`;
  }
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  function verdict(g) {
    const held = g.done.filter(d => d.how === 'held'), handed = g.done.filter(d => d.how === 'handed');
    const total = held.reduce((s, d) => s + d.cards, 0);
    let headline;
    if (held.length === g.done.length) headline = 'Every chain held.';
    else if (held.length === 0) headline = 'You handed every task to the Countess.';
    else headline = `${cap1(word(held.length))} chain${held.length === 1 ? '' : 's'} held; ${word(handed.length)} you handed to the Countess.`;
    const parts = held.map(d => `${word(d.cards)} for ${d.short}`);
    const did = held.length ? `${cap1(word(total))} cards across ${word(held.length)} task${held.length === 1 ? '' : 's'}: ${parts.join(', ')}. Each chain went on working when the Engine was handed numbers you had never seen.` : 'The Countess’s chains ran instead of yours.';
    const paper = `The cards carry the operations and the columns carry the numbers, and the two never mix: that is why one chain serves every n. A card that turns the prism back makes a cycle, and a cycle lets a handful of cards do the work of hundreds: ${word(CONFIG.NOTE_F_CARDS)} cards for ${word(CONFIG.NOTE_F_OPERATIONS)} in one of Lovelace’s examples, ${word(CONFIG.NOTE_G_CARDS.n3plus)} for every Number of Bernoulli there is, however great n may be.`;
    const means = 'The Engine originates nothing. It did what you knew how to order it to do, and nothing else.';
    return { headline, did, paper, means, total, held: held.length, handed: handed.length };
  }

  // ---- the Countess's chain: Note G, Table A.2, the Numbers of Bernoulli, on this interpreter. Columns V1..V24 as hers (index = number − 1).
  // Her operations, in her order; op 4 divides V4 by V5 as her result column (2n−1)/(2n+1) requires (the table's symbol column has them the
  // other way round); op 24 subtracts V13 from the result column so that the strip prints the signed Number formula (8) gives.
  // Operations 13–23 are her cycle; op 21 takes its B from a column one in advance on each repetition, so for n ≥ 4 the cycle is written out.
  const V = k => k - 1;
  function bernoulliCards(n) {
    const op = (o, a, b, to, rep) => ({ k: 'op', op: o, a: V(a), b: V(b), to: to.map(V), rep: !!rep });
    const cards = [
      op('*', 2, 3, [4, 5, 6]),       // 1   2n
      op('-', 4, 1, [4]),             // 2   2n − 1
      op('+', 5, 1, [5]),             // 3   2n + 1
      op('/', 4, 5, [11]),            // 4   (2n−1)/(2n+1)
      op('/', 11, 2, [11]),           // 5   ½ (2n−1)/(2n+1)
      op('-', 13, 11, [13]),          // 6   −½ (2n−1)/(2n+1) = A0
      op('-', 3, 1, [10]),            // 7   n − 1  (the feel for n: if nothing, the Number is done)
    ];
    if (n >= 2) cards.push(
      op('+', 2, 7, [7]),             // 8   2
      op('/', 6, 7, [11]),            // 9   2n/2 = A1
      op('*', 21, 11, [12]),          // 10  B1 · A1
      op('+', 12, 13, [13]),          // 11  A0 + B1A1
      op('-', 10, 1, [10]),           // 12  n − 2
    );
    for (let j = 3; j <= n; j++) { const rep = j > 3; cards.push(
      op('-', 6, 1, [6], rep),        // 13  2n − 1, then 2n − 3, …
      op('+', 1, 7, [7], rep),        // 14  3, then 5, …
      op('/', 6, 7, [8], rep),        // 15
      op('*', 8, 11, [11], rep),      // 16
      op('-', 6, 1, [6], rep),        // 17
      op('+', 1, 7, [7], rep),        // 18
      op('/', 6, 7, [9], rep),        // 19
      op('*', 9, 11, [11], rep),      // 20  A3, then A5, …
      op('*', 20 + j - 1, 11, [12], rep),  // 21  B3 · A3, then B5 · A5 (the column one in advance)
      op('+', 12, 13, [13], rep),     // 22
      op('-', 10, 1, [10], rep),      // 23  n − 3, then n − 4, …
    ); }
    cards.push(op('-', 20 + n, 13, [20 + n]));   // 24  the Number, B_{2n−1} = −(A0 + A1B1 + …), on V21, V22, …
    cards.push({ k: 'print', a: V(20 + n) });     // the printing apparatus (ours: a card to print the Number)
    cards.push(op('+', 1, 3, [3]));                // 25  n + 1, ready for the next Number
    return cards;
  }
  function bernoulliCols(n, given) { // V1 = 1, V2 = 2, V3 = n; V21.. the Numbers already found (Note G, p. 54: six data for n = 4)
    const cols = []; for (let k = 1; k <= 24; k++) cols.push({ name: 'V' + k, v: 0 });
    cols[V(1)].v = 1; cols[V(2)].v = 2; cols[V(3)].v = n; (given || []).forEach((b, i) => { cols[V(21 + i)].v = b; }); return cols;
  }
  function bernoulliRun(upTo) { // the Numbers in succession, each from the ones before, as "in the course of computing the Numbers to an indefinite extent"
    const found = [], chains = [];
    for (let n = 1; n <= upTo; n++) {
      const cols = bernoulliCols(n, found), cards = bernoulliCards(n), r = run(cols, cards, null, { cap: 10000 });
      found.push(r.printed[0]); chains.push({ n, cards, opCards: cards.filter(c => !c.rep && c.k === 'op').length, steps: r.steps, result: r });
    }
    return { numbers: found, chains };
  }

  const M = { CONFIG, makeCols, colIndex, cardText, validCard, run, tryTask, fraction, fmt, newGame, task, hang, takeDown, go, canHandOver, finishTask, taskVerdict, verdict, word, bernoulliCards, bernoulliCols, bernoulliRun, OPSIGN };
  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.MECH = M;
})(typeof window !== 'undefined' ? window : globalThis);
