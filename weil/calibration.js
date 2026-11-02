// Calibration check for Weil's Vase. Run: node calibration.js  (writes calibration-result.txt)
// The essay hands over an argument, not numbers, so the check is of two kinds:
//   1. the toy carries the essay's few numbers (three quarters, twelve days) and its rules say what the essay says
//      (each act of force, used or suffered, costs the same; a man of stone cannot be spared at no cost; words do not reach stone);
//   2. played by several kinds of player over many lives, the toy shows the patterns the essay claims (nobody holds force; the
//      abuse of force comes home; moderation has its perils; grace is rare; there is no refuge), and these patterns survive when
//      the designer's own numbers (ours, not hers) are moved by a quarter or more either way.
// Tests of our own construction alone establish nothing about the world; they establish that the toy says what the essay says.
const M = require('./mechanism.js'); const fs = require('fs');
const C = M.CONFIG; const out = []; let pass = 0, fail = 0;
const say = s => { out.push(s); console.log(s); };
const check = (name, ok, detail) => { (ok ? pass++ : fail++); say(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '   [' + detail + ']' : ''}`); };
const okg = (t, id) => t.gestures.find(x => x.id === id && x.ok);
const pct = x => (100 * x).toFixed(0) + '%';

// ---- the players (a player reacts in REACT seconds when the spear creeps; slower than the interval, the impulse wins)
const REACT = 3;
const P = {
  hard: t => t.mode === 'down' ? 'plead' : (okg(t, 'strike') ? 'strike' : 'take'),
  soft: t => t.mode === 'down' ? 'plead' : 'raise',
  passive: t => t.mode === 'down' ? (t.man.lines <= 2 ? 'stand' : 'plead') : 'pass',
  measured: t => { if (t.mode === 'down') return t.man.lines <= 2 ? 'stand' : 'plead'; const m = t.man;
    if (m.armed && (m.lines <= C.ARMED_DEAF || m.fearless)) return 'strike'; return 'raise'; },
  greedy: t => { if (t.mode === 'down') return t.man.lines <= 2 ? 'stand' : 'plead'; const m = t.man;
    if (m.armed && (m.lines <= C.ARMED_DEAF || m.fearless)) return 'strike'; if (m.armed || t.mode === 'night') return 'raise';
    if (t.h < 0.6 && t.v < 0) return okg(t, 'strike') ? 'strike' : 'take'; return t.h > 1 ? 'raise' : 'pass'; },
  random: (t, r) => { const g = t.gestures.filter(x => x.ok); return g[Math.floor(r() * g.length)].id; },
};
function live(name, seed) {
  const g = M.newLife(seed), r = M.rng(seed * 31 + 7); const trace = [];
  while (!g.over) {
    const t = M.today(g); let gest = P[name](t, r), imp = false;
    if (!okg(t, gest)) gest = okg(t, 'pass') ? 'pass' : t.gestures.find(x => x.ok).id;   // a sherd that is cracked: go past him instead
    if (t.mode === 'up' && t.interval < REACT) { gest = t.impulse; imp = true; }
    trace.push({ day: t.day, mode: t.mode, h: t.h, lines: t.lines, A: g.A, man: t.man.lines, imp });
    M.act(g, gest, { impulse: imp }); if (!g.over) M.nextDay(g);
  }
  const V = M.verdict(g); const L = g.log;
  return { fate: V.fate, day: V.day, lines: g.lines, knelt: L.filter(e => e.mode === 'down').length,
    impulses: L.filter(e => e.impulse).length, graces: L.filter(e => e.him === 'grace').length,
    used: L.filter(e => ['strike', 'take'].includes(e.gesture) && e.mode !== 'down').length, trace, log: L };
}
const N = 1500;
function stats(name) {
  const R = []; for (let s = 1; s <= N; s++) R.push(live(name, s));
  const mean = (a, f) => a.reduce((x, y) => x + f(y), 0) / Math.max(1, a.length);
  const night = R.filter(x => x.fate === 'night');
  const firstKneel = R.map(x => x.trace.find(d => d.mode === 'down')).filter(Boolean);
  return { R, night: night.length / N, dead: R.filter(x => x.fate === 'knees' || x.fate === 'standing').length / N,
    lines: mean(R, x => x.lines), linesNight: mean(night, x => x.lines), six: night.filter(x => x.lines === 6).length / N,
    knelt: mean(R, x => x.knelt), kneltOnce: R.filter(x => x.day >= 9).filter(x => x.knelt > 0).length / Math.max(1, R.filter(x => x.day >= 9).length),
    impulses: mean(R, x => x.impulses), impLife: R.filter(x => x.impulses > 0).length / N, graces: mean(R, x => x.graces),
    aboveLines: mean(firstKneel, d => d.man), aboveA: mean(firstKneel, d => d.A), used: mean(R, x => x.used) };
}

say('Weil\'s Vase — calibration check');
say('Simone Weil, "The Iliad, or The Poem of Force", tr. Mary McCarthy (Pendle Hill Pamphlet 91). Page numbers are the pamphlet\'s.');
say(`Players: ${Object.keys(P).join(', ')}; ${N} lives each; a player needs ${REACT} s to act when the spear creeps.\n`);

// ---------------------------------------------------------------------------------------------------- 1. the essay's numbers
say('— 1. The essay\'s numbers, in the config block');
check('prestige is three quarters of force (p. 19, "at least three quarters")', C.PRESTIGE_SHARE === 0.75, 'PRESTIGE_SHARE ' + C.PRESTIGE_SHARE);
check('fate is the remaining quarter (p. 13, "blind destiny")', Math.abs(C.FATE_SHARE - 0.25) < 1e-12 && C.PRESTIGE_SHARE + C.FATE_SHARE === 1, 'FATE_SHARE ' + C.FATE_SHARE);
check('the war lasts twelve days (p. 24, Lycaon\'s "twelfth day in Troy")', C.DAYS === 12, 'DAYS ' + C.DAYS);
check('you start up, and rising (pp. 20–21, "at the embarkation, their hearts are light")', (() => { const g = M.newLife(1); return g.h > 0 && g.v > 0; })());

// ---------------------------------------------------------------------------------------------------- 2. the rules say what the essay says
say('\n— 2. The rules (p. 25: "to the same degree, though in different fashions, those who use it and those who endure it are turned to stone")');
const fresh = (id, h) => { const g = M.newLife(1); g.deck[0] = id; g.ph = h >= 0 ? 0.9 : 4.1; g.P = 0; g.h = 1; return g; };
const costOf = (id, gest) => { const g = fresh(id); const t = M.today(g); if (!okg(t, gest)) return null; const r = M.act(g, gest); return r.youFrom - r.youTo; };
const kinds = ['boy', 'suppliant', 'suppliant2', 'speaker', 'captive', 'priest', 'runner', 'stoneman', 'stone2', 'stone3', 'half', 'guest'];
let useCosts = [], sufferCosts = [], freeCosts = [];
for (const id of kinds) for (const gest of ['strike', 'take', 'pass', 'raise']) {
  const c = costOf(id, gest); if (c === null) continue;
  const m = M.MEN[id]; const deaf = m.armed && m.lines <= C.ARMED_DEAF;
  if (gest === 'strike' || gest === 'take') useCosts.push(c);
  else if (deaf) sufferCosts.push(c); else if (!(m.armed && m.lines >= C.ARMED_GRACE && gest === 'raise')) freeCosts.push(c);
}
check('every act of force used costs one line (strike, take; every kind of man)', useCosts.length > 10 && useCosts.every(c => c === 1), `${useCosts.length} acts`);
check('every act of force suffered costs one line (struck by a man of stone)', sufferCosts.length >= 4 && sufferCosts.every(c => c === 1), `${sufferCosts.length} acts`);
check('used and suffered cost the same ("to the same degree")', C.COST_USE === C.COST_SUFFER);
check('passing or raising a man who is not stone costs nothing', freeCosts.every(c => c === 0), `${freeCosts.length} acts`);
check('before a man of stone, no gesture keeps your line ("what hand can relinquish its weapon?", p. 22)',
  ['stoneman', 'stone2', 'stone3'].every(id => ['strike', 'pass', 'raise'].every(gst => costOf(id, gst) === 1)));
const knee = (lines, seeds) => { let heard = 0; for (let s = 1; s <= seeds; s++) { const g = M.newLife(s); g.ph = 4.1; g.h = -1; g.above = { kind: 'above', lines, armed: true, he: 'he', who: 'an armed man' }; const r = M.act(g, 'plead'); if (r.him === 'heard') heard++; } return heard / seeds; };
const hear = [0, 1, 2, 3, 4, 5, 6].map(l => knee(l, 2000));
check('words do not reach stone: a plea to a man of stone all through is never heard (p. 25)', hear[0] === 0, hear.map(pct).join(' '));
check('a plea is heard more often the more clay is left in him', hear.every((x, i) => i === 0 || x >= hear[i - 1] - 0.03) && hear[6] === 1);
check('kneeling costs a line, and being heard gives it back (pp. 5, 8)', (() => { const g = M.newLife(3); g.ph = 4.1; g.h = -1; g.above = { kind: 'above', lines: 6, armed: true, he: 'he' }; const r = M.act(g, 'plead'); return r.lost.length === 1 && r.gained.length === 1 && r.youTo === r.youFrom; })());
const iv = (h, l) => M.interval(h, l);
check('the interval: no clock at moderate height with most of the soul; none at all at the top or with no soul (p. 14)',
  iv(1.0, 6) === Infinity && iv(1.0, 4) === Infinity && iv(C.H_TOP, 6) === 0 && iv(0.5, 0) === 0 && iv(2.0, 6) > 0 && iv(2.0, 6) < C.INTERVAL_MAX,
  `h 2.0, six lines: ${iv(2.0, 6).toFixed(1)} s; h 1.0, three lines: ${iv(1.0, 3).toFixed(1)} s`);
check('the interval shrinks as the pan rises and as the soul goes', iv(1.6, 6) > iv(2.0, 6) && iv(2.0, 6) > iv(2.4, 6) && iv(1.0, 3) > iv(1.0, 2) && iv(1.0, 2) > iv(1.0, 1));

// ---------------------------------------------------------------------------------------------------- 3. the patterns
say('\n— 3. Played over many lives');
const S = {}; for (const k of Object.keys(P)) S[k] = stats(k);
say('player     night  died  stone(all)  lines@night  six@night  knelt  impulses(lives)  graces  first man over you (lines)');
for (const k of Object.keys(P)) { const s = S[k]; say(`${k.padEnd(9)} ${pct(s.night).padStart(5)} ${pct(s.dead).padStart(5)} ${s.lines.toFixed(2).padStart(9)} ${s.linesNight.toFixed(2).padStart(11)} ${pct(s.six).padStart(9)} ${s.knelt.toFixed(2).padStart(6)} ${pct(s.impLife).padStart(10)} ${s.graces.toFixed(2).padStart(10)} ${s.aboveLines.toFixed(2).padStart(10)}`); }
say('');
const sensible = ['hard', 'soft', 'passive', 'measured', 'greedy'];
check('nobody holds force (p. 11): of lives that last nine days or more, at least nine in ten knelt at least once, for every player',
  sensible.every(k => S[k].kneltOnce >= 0.9), sensible.map(k => `${k} ${pct(S[k].kneltOnce)}`).join(', '));
check('force used turns its user to stone: the player who strikes everything ends with no soul at all', S.hard.lines === 0 && S.hard.linesNight === 0);
check('the abuse of force comes home (p. 15): the man over the hard player is stonier than the man over the measured player',
  S.hard.aboveLines < S.measured.aboveLines - 1, `${S.hard.aboveLines.toFixed(2)} lines against ${S.measured.aboveLines.toFixed(2)}`);
check('... and the hard player dies before the night more often than the measured one', S.hard.dead > S.measured.dead + 0.1, `${pct(S.hard.dead)} against ${pct(S.measured.dead)}`);
check('the interval goes at the top (p. 14): the spear moves by itself in most hard lives, and never in a soft one', S.hard.impLife > 0.5 && S.soft.impLife === 0, `${pct(S.hard.impLife)}, ${pct(S.soft.impLife)}`);
check('moderation has its perils (p. 19): the soft player kneels more often than the hard one', S.soft.knelt > S.hard.knelt + 0.5, `${S.soft.knelt.toFixed(2)} against ${S.hard.knelt.toFixed(2)}`);
check('a moderate use of force is the only escape, and not a sure one (p. 19): measured keeps the most soul of the sensible players',
  ['hard', 'passive', 'greedy'].every(k => S.measured.lines > S[k].lines), sensible.map(k => `${k} ${S[k].lines.toFixed(2)}`).join(', '));
check('no refuge from fate (p. 37): every player dies before the night in at least a fifth of lives', Object.keys(P).every(k => S[k].dead + (k === 'random' ? 1 : 0) >= 0.2), Object.keys(P).map(k => `${k} ${pct(S[k].dead)}`).join(', '));
check('... and no player reaches the night with all six lines in more than a quarter of lives', Object.keys(P).every(k => S[k].six <= 0.25), Object.keys(P).map(k => `${k} ${pct(S[k].six)}`).join(', '));
check('grace is rare (p. 27): fewer than two moments of grace a life, for every player', Object.keys(P).every(k => S[k].graces < 2));
let impOK = true; for (const k of Object.keys(P)) for (const x of S[k].R) for (const d of x.trace) if (d.imp && !(d.h > C.H_CREEP || d.lines <= C.LINES_CREEP)) impOK = false;
check('the spear moves by itself only near the top of the swing or when the soul is low', impOK);

// ---------------------------------------------------------------------------------------------------- 4. robustness to our own numbers
say('\n— 4. Robustness: the patterns under other choices of the designer\'s numbers (ours, not the essay\'s)');
const variants = [
  ['TURN', 0.6], ['TURN', 1.0], ['HOLD', 0.4], ['HOLD', 1.2], ['ABOVE_SLOPE', 1.2], ['ABOVE_SLOPE', 1.8],
  ['A_BASE', 0.7], ['A_BASE', 1.1], ['FATE_PHASE', 0.2], ['FATE_PHASE', 0.5], ['DAMP', 0.04], ['DAMP', 0.12],
  ['PUSH.strike', 0.32], ['PUSH.strike', 0.6], ['PUSH.raise', -0.2], ['PUSH.raise', -0.5], ['H_CREEP', 1.1], ['H_CREEP', 1.7],
];
const get = k => k.includes('.') ? C[k.split('.')[0]][k.split('.')[1]] : C[k];
const set = (k, v) => { if (k.includes('.')) C[k.split('.')[0]][k.split('.')[1]] = v; else C[k] = v; };
let robust = 0;
for (const [k, v] of variants) {
  const old = get(k); set(k, v);
  const s = {}; for (const p of ['hard', 'soft', 'measured', 'passive', 'greedy']) s[p] = stats(p);
  const tests = {
    nobody: ['hard', 'soft', 'measured', 'passive', 'greedy'].every(p => s[p].kneltOnce >= 0.85),
    home: s.hard.aboveLines < s.measured.aboveLines - 0.5 && s.hard.dead > s.measured.dead,
    stone: s.hard.lines < 0.5,
    perils: s.soft.knelt > s.hard.knelt,
    measure: ['hard', 'passive', 'greedy'].every(p => s.measured.lines > s[p].lines),
    refuge: ['hard', 'soft', 'measured', 'passive', 'greedy'].every(p => s[p].dead >= 0.15 && s[p].six <= 0.3),
  };
  const all = Object.values(tests).every(Boolean); if (all) robust++;
  say(`${all ? 'holds ' : 'BREAKS'}  ${k} ${old} → ${v}: ${Object.entries(tests).map(([n, b]) => (b ? '' : '¬') + n).join(' ')}   (measured: night ${pct(s.measured.night)}, lines ${s.measured.lines.toFixed(2)}; hard: died ${pct(s.hard.dead)})`);
  set(k, old);
}
check('the six patterns hold under at least 15 of the 18 variations of our numbers', robust >= 15, `${robust} of ${variants.length}`);

// ---------------------------------------------------------------------------------------------------- 5. the draw
say('\n— 5. The draw (life number = seed)');
let drawOK = true, poolOK = true, stoneEarly = true; const seen = {};
for (let s = 1; s <= 500; s++) {
  const g = M.newLife(s); const d = g.deck;
  if (d[0] !== 'boy' || d[1] !== 'stoneman' || d[2] !== 'speaker' || d.length !== 3 + C.DEALT) drawOK = false;
  const dealt = d.slice(3); if (new Set(dealt).size !== C.DEALT || !dealt.every(x => C.POOL.includes(x))) poolOK = false;
  dealt.forEach(x => seen[x] = (seen[x] || 0) + 1);
}
check('days 1–3 are always the boy, a man of stone and the soldier who speaks', drawOK);
check('days 4–11 are eight different men dealt from the nine', poolOK);
check('every man in the pool is dealt in roughly eight lives of nine', Object.values(seen).every(n => n > 500 * 0.8 && n < 500 * 0.97), Object.entries(seen).map(([k, n]) => `${k} ${n}`).join(', '));
check('a life is replayable from its number', JSON.stringify(live('measured', 77).log) === JSON.stringify(live('measured', 77).log));

say(`\n${pass} passed, ${fail} failed.`);
fs.writeFileSync(__dirname + '/calibration-result.txt', out.join('\n') + '\n');
process.exit(fail ? 1 : 0);
