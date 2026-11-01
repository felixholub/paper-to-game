// Calibration check for Curie's Quartz. Run: node calibration.js  (writes calibration-result.txt)
// Tests mechanism.js, unchanged, against the paper: the table of currents (transcribed here a second time, independently,
// from the scan of p. 1101–1102), the paper's own statements on p. 1102, the instrument under several kinds of thumb, the
// robustness of the central discovery to the assumptions that are ours, and the shelf played in numbers (build.md §3).
const M = require('./mechanism.js'); const C = M.CONFIG; const fs = require('fs');
const out = []; let pass = 0, fail = 0;
const say = s => { out.push(s); console.log(s); };
const check = (ok, label, detail) => { if (ok) pass++; else fail++; say(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`); };
const S = id => M.sub(id), x = id => M.strength(S(id));

// ---------- 1. the table, typed again from the scan (1e-12 A)
const TABLE = {
  'Uranium légèrement carburé': 24, 'Oxyde noir d\'uranium U2O5': 27, 'Oxyde vert d\'uranium U3O8': 18,
  'Uranates d\'ammonium, de potassium, de sodium, environ': 12, 'Acide uranique hydraté': 6,
  'Azotate d\'uranyle, sulfate uraneux, sulfate d\'uranyle et de potassium, environ': 7,
  'Chalcolite artificielle (phosphate de cuivre et d\'uranyle)': 9, 'Oxyde de thorium en couche de 0mm,25': 22,
  'Oxyde de thorium en couche de 6mm': 53, 'Sulfate de thorium': 8, 'Fluoxytantalate de potassium': 2,
  'Fluoxyniobate de potassium et oxyde de cérium': 0.3, 'Pechblende de Johanngeorgenstadt': 83, 'Pechblende de Cornwallis': 16,
  'Pechblende de Joachimsthal et de Pzibran': 67, 'Chalcolite naturelle': 52, 'Autunite': 27, 'Thorites diverses': [2, 14],
  'Orangite': 20, 'Samarskite': 11, 'Fergusonite, monazite, xénotime, niobite, æschinite': [3, 7],
};
const MAP = { uranium: 'Uranium légèrement carburé', greenox: 'Oxyde vert d\'uranium U3O8',
  nitrate: 'Azotate d\'uranyle, sulfate uraneux, sulfate d\'uranyle et de potassium, environ',
  chalcArt: 'Chalcolite artificielle (phosphate de cuivre et d\'uranyle)', thO: 'Oxyde de thorium en couche de 0mm,25',
  thOthick: 'Oxyde de thorium en couche de 6mm', tantal: 'Fluoxytantalate de potassium', pbJG: 'Pechblende de Johanngeorgenstadt',
  pbJo: 'Pechblende de Joachimsthal et de Pzibran', chalc: 'Chalcolite naturelle' };
say('1. The shelf against the table (p. 1101–1102)');
for (const [id, key] of Object.entries(MAP)) check(S(id).amps === TABLE[key], `${id} = ${key}`, `${S(id).amps} vs ${TABLE[key]}`);
for (const id of ['lead', 'gold', 'copper', 'redP', 'phosphate'])
  check(S(id).amps / C.UNIT_A < C.INACTIVE_BELOW, `${id} below the paper's threshold (not in the table: "at least 100 times less active")`);
check(C.UNIT_A === TABLE['Uranium légèrement carburé'], 'the yardstick is the table\'s metallic uranium');
check(S('whiteP').amps > 0 && /ours/.test(S('whiteP').src), 'white phosphorus has a number, declared ours (the paper: "très actif", no number)');

// ---------- 2. the paper's statements (p. 1102)
say('\n2. The paper\'s statements, on the game\'s shelf and on the whole table');
const compounds = C.SUBSTANCES.filter(s => s.u > 0 && !['pbJG', 'pbJo', 'chalc'].includes(s.id));
check(compounds.every(s => M.strength(s) >= C.INACTIVE_BELOW), '"Tous les composés de l\'uranium étudiés sont actifs"');
const spearman = (a, b) => { const rk = v => { const o = v.map((y, i) => [y, i]).sort((p, q) => p[0] - q[0]); const r = []; o.forEach((p, k) => { r[p[1]] = k; }); return r; };
  const ra = rk(a), rb = rk(b), n = a.length; let d = 0; for (let i = 0; i < n; i++) d += (ra[i] - rb[i]) ** 2; return 1 - 6 * d / (n * (n * n - 1)); };
const rhoShelf = spearman(compounds.map(s => s.u), compounds.map(s => s.amps));
check(rhoShelf > 0.5, '"…et le sont, en général, d\'autant plus qu\'ils contiennent plus d\'uranium" (shelf)', `Spearman ρ = ${rhoShelf.toFixed(2)} over ${compounds.length} compounds`);
// the whole table's uranium compounds, with uranium shares from formulas (ours): the rule is "in general", not exact
const ALL = [[1.0, 24], [0.856, 27], [0.848, 18], [0.68, 12], [0.74, 6], [0.47, 7], [0.5, 9]];
const rhoAll = spearman(ALL.map(a => a[0]), ALL.map(a => a[1]));
check(rhoAll > 0.3, '…and over all seven uranium-compound rows of the table (shares from formulas, ours)', `Spearman ρ = ${rhoAll.toFixed(2)}; the rule holds "en général", with exceptions (black oxide above the metal, uranic acid low)`);
check(compounds.every(s => M.strength(s) <= s.u * 1.0 + 1e-9), 'every uranium compound on the shelf reads at most its uranium share (the panel says ABOUT ITS URANIUM)',
  compounds.map(s => `${s.id} ${(M.strength(s) / s.u).toFixed(2)}`).join(', '));
check(x('thO') > 0.5 && x('thOthick') > 0.5, '"Les composés du thorium sont très actifs"');
check(x('thOthick') > x('uranium'), '"L\'oxyde de thorium dépasse même en activité l\'uranium métallique"', `thick layer ${x('thOthick').toFixed(2)} × uranium`);
check(x('thOthick') > x('thO'), '"Les effets … augmentent avec l\'épaisseur … considérable pour l\'oxyde de thorium"', `${S('thO').amps} → ${S('thOthick').amps}`);
check(x('tantal') > C.INACTIVE_BELOW && x('tantal') < 0.25, '"Le cérium, le niobium et le tantale semblent être légèrement actifs"', `tantalum salt ${x('tantal').toFixed(3)} × uranium`);
check(x('whiteP') > 0.5 && x('redP') === 0 && x('phosphate') === 0, '"Le phosphore blanc est très actif … n\'est actif ni à l\'état de phosphore rouge ni à l\'état de phosphates"');
check(['pbJG', 'pbJo', 'chalc'].every(id => x(id) > 2), '"pechblende … et chalcolite … sont beaucoup plus actifs que l\'uranium lui-même"', ['pbJG', 'pbJo', 'chalc'].map(id => `${id} ${x(id).toFixed(2)}`).join(', '));
const salts = [27, 18, 12, 6, 7];   // the table's uranium salts and oxides (not the metal, not the minerals)
check(S('chalcArt').amps >= Math.min(...salts) && S('chalcArt').amps <= Math.max(...salts), '"cette chalcolite artificielle n\'est pas plus active qu\'un autre sel d\'uranium"', `9 within the salts' 6–27`);
check(x('chalc') / x('chalcArt') > 4, 'the same crystal: from the mine against made from pure products', `${S('chalc').amps} vs ${S('chalcArt').amps}: ×${(x('chalc') / x('chalcArt')).toFixed(1)}`);

// ---------- 3. the instrument, under several thumbs
say('\n3. The balance: every thumb reads the paper\'s value (charge balance over the held seconds)');
const sigma = id => C.JITTER * Math.sqrt(x(id) * C.HOLD_S) / (C.G * C.HOLD_S);
const freshAt = (seed) => { const g = M.newGame(seed); const st = M.benchStart(g, 'uranium'); st.done = true; st.reading = 1; M.record(g, st); return g; };
// each thumb keeps an intent (where it means the slider to be) and returns where the slider actually is
const THUMBS = {
  steady: (st, th, t) => { th.intent = Math.max(0, th.intent + 2.4 * st.s / 60); return th.intent; },                 // follows the spot gently
  eager: (st, th, t) => { th.intent = Math.max(0, st.s > 0.05 ? th.intent + 0.06 : st.s < -0.05 ? th.intent - 0.06 : th.intent); return th.intent; }, // bang-bang, overshoots
  sweeper: (st, th, t) => { th.intent = Math.max(0, th.intent + 2.4 * st.s / 60); return st.hold > C.HOLD_S - 0.05 && !th.swept ? (th.swept = true, th.intent + 1.5) : th.intent; }, // yanks the slider at the last instant, once
  wobbler: (st, th, t) => { th.intent = Math.max(0, th.intent + 2.4 * st.s / 60); return Math.max(0, th.intent + 0.06 * Math.sin(t * 9)); }, // a shaky thumb
};
for (const [name, thumb] of Object.entries(THUMBS)) {
  let worst = 0, worstId = '', unfinished = 0, tmax = 0;
  for (const s of C.SUBSTANCES) {
    if (s.id === 'uranium') continue;
    for (let seed = 1; seed <= 120; seed++) {
      const g = freshAt(seed); const st = M.benchStart(g, s.id); const th = { intent: 0 }; let r = 0, t = 0, k = 0;
      while (!st.done && k++ < 60 * 60) { r = Math.min(C.SLIDER_MAX, thumb(st, th, t)); M.benchStep(st, 1 / 60, r); t += 1 / 60; }
      if (!st.done) { unfinished++; continue; }
      tmax = Math.max(tmax, st.t);
      const z = Math.abs(st.reading - st.i) / Math.max(sigma(s.id), 1e-6);
      if (st.i === 0) { if (st.reading > 1e-6) { worst = Infinity; worstId = s.id; } } else if (z > worst) { worst = z; worstId = s.id; }
    }
  }
  check(unfinished === 0 && worst < 4.5, `${name} thumb: every substance balances, reading within 4.5 σ of the paper`, `worst ${worst.toFixed(2)} σ (${worstId}); slowest ${tmax.toFixed(1)} s; unfinished ${unfinished}`);
}
// a thumb that never moves: inactive plates complete at once, active ones never
{
  let ok = true, det = [];
  for (const s of C.SUBSTANCES) {
    if (s.id === 'uranium') continue;
    const g = freshAt(7); const st = M.benchStart(g, s.id); let k = 0;
    while (!st.done && k++ < 60 * 20) M.benchStep(st, 1 / 60, 0);
    const inactive = M.strength(s) < C.INACTIVE_BELOW;
    if (inactive !== st.done) { ok = false; det.push(s.id + (st.done ? ' completed' : ' never completed')); }
    if (inactive && Math.abs(st.t - (C.WATCH_S + C.HOLD_S)) > 0.05) { ok = false; det.push(s.id + ' took ' + st.t.toFixed(2)); }
  }
  check(ok, 'a still thumb: "nothing" is recorded after the watching seconds, and nothing active is ever recorded without a push', det.join(', ') || `inactive plates record at ${(C.WATCH_S + C.HOLD_S).toFixed(1)} s`);
}
check(M.tolerance() < 0.1, 'the spot stands in the band only when the push is within a tenth of uranium of the plate', `tolerance ${M.tolerance().toFixed(3)} × uranium`);

// ---------- 4. the panels' words and kinds are the paper's whatever the tremble
say('\n4. Every reading the balance can return gives the same kind of panel (4.5 σ either side)');
for (const s of C.SUBSTANCES) {
  const k = M.kind(s), e = 4.5 * sigma(s.id);
  const kk = [M.kind(s, Math.max(0, M.strength(s) - e)), M.kind(s, M.strength(s) + e)];
  check(kk.every(q => q === k), `${s.id}: ${k}`, `reading ${M.strength(s).toFixed(3)} ± ${e.toFixed(3)} → ${M.times(M.strength(s))}`);
}

// ---------- 5. robustness of the central discovery to what is ours
say('\n5. Robustness: the rocks are MORE THAN THEIR URANIUM under any plausible share and threshold; the copy is not');
const rocks = ['pbJG', 'pbJo', 'chalc'];
for (const share of [0.4, 0.5, 0.65, 0.75, 0.88]) {
  const kinds = ['pbJG', 'pbJo'].map(id => M.kind(Object.assign({}, S(id), { u: share })));
  check(kinds.every(q => q === 'more'), `pitchblende at ${Math.round(share * 100)} % uranium (pure uraninite is about 88 %)`, kinds.join(', '));
}
for (const share of [0.45, 0.5, 0.55]) {
  const a = M.kind(Object.assign({}, S('chalc'), { u: share })), b = M.kind(Object.assign({}, S('chalcArt'), { u: share }));
  check(a === 'more' && b === 'about', `chalcolite at ${Math.round(share * 100)} % uranium: mine ${a}, made ${b}`);
}
{
  const saved = C.MORE_RATIO; let ok = true; const det = [];
  for (const r of [1.1, 1.5, 2, 3, 4]) {
    C.MORE_RATIO = r;
    const kinds = C.SUBSTANCES.map(s => M.kind(s)).join(',');
    C.MORE_RATIO = saved; const base = C.SUBSTANCES.map(s => M.kind(s)).join(',');
    if (kinds !== base) { ok = false; det.push('ratio ' + r); }
  }
  C.MORE_RATIO = saved;
  check(ok, 'the MORE THAN ITS URANIUM threshold (ours, 1.3) can be anything from 1.1 to 4 without changing a panel', det.join(', '));
}
for (const wp of [12, 24, 50, 72]) {
  const k = M.kind(Object.assign({}, S('whiteP'), { amps: wp }));
  check(k === 'without' && M.kind(S('redP')) === 'nothing', `white phosphorus at ${wp} (ours; the paper gives no number): still the phosphorus lesson`, k);
}
say('   note: natural chalcolite (52) and a thick layer of thorium oxide (53) read level; the rocks are not explained by thorium because they hold none (their cards say so).');

// ---------- 6. the shelf played in numbers (build.md §3): eight picks from fifteen
say('\n6. The shelf in numbers: eight picks from fifteen, 20 000 random albums and five plans');
const SHELF = C.SUBSTANCES.filter(s => s.id !== 'uranium').map(s => s.id);
const outcome = picks => {
  const has = id => picks.includes(id);
  return { ore: rocks.some(has), copy: has('chalcArt'), oreAndCopy: rocks.some(has) && has('chalcArt'), pair: has('chalc') && has('chalcArt'),
    phos: has('whiteP') && (has('redP') || has('phosphate')), thorium: has('thO') || has('thOthick') };
};
const rng = M.mulberry32(42); const tally = { ore: 0, copy: 0, oreAndCopy: 0, pair: 0, phos: 0, thorium: 0 }; const N = 20000;
for (let n = 0; n < N; n++) { const pool = SHELF.slice(); const picks = []; for (let k = 0; k < C.PANELS - 1; k++) picks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]); const o = outcome(picks); for (const key in tally) if (o[key]) tally[key]++; }
say('   strategy                          | meets a rock | makes the copy | rock + copy | both chalcolites | phosphorus test | thorium');
const row = (name, o) => say(`   ${name.padEnd(34)}| ${String(o.ore).padEnd(13)}| ${String(o.copy).padEnd(15)}| ${String(o.oreAndCopy).padEnd(12)}| ${String(o.pair).padEnd(17)}| ${String(o.phos).padEnd(16)}| ${o.thorium}`);
const pct = k => (100 * tally[k] / N).toFixed(0) + ' %';
row('random', { ore: pct('ore'), copy: pct('copy'), oreAndCopy: pct('oreAndCopy'), pair: pct('pair'), phos: pct('phos'), thorium: pct('thorium') });
const ord = C.DRAWERS.flatMap(d => C.SUBSTANCES.filter(s => s.drawer === d.id && s.id !== 'uranium').map(s => s.id));
const PLANS = {
  'drawers top to bottom': ord.slice(0, 8),
  'drawers bottom to top': ord.slice().reverse().slice(0, 8),
  'heavy metals and rare things first': ['lead', 'gold', 'thO', 'thOthick', 'tantal', 'copper', 'whiteP', 'redP'],
  'the paper\'s path': ['nitrate', 'thO', 'thOthick', 'whiteP', 'redP', 'pbJG', 'chalc', 'chalcArt'],
  'rocks only, then the copy': ['pbJG', 'pbJo', 'chalc', 'chalcArt', 'greenox', 'nitrate', 'thO', 'lead'],
};
for (const [name, p] of Object.entries(PLANS)) { const o = outcome(p); row(name, Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v ? 'yes' : 'no']))); }
check(tally.ore / N > 0.85, 'a random album meets a rock that beats its uranium in most plays', pct('ore'));
check(outcome(PLANS["the paper's path"]).pair && outcome(PLANS["the paper's path"]).phos, 'the paper\'s own path fits in eight panels, with both logical tests');
check(!outcome(PLANS['heavy metals and rare things first']).ore, 'a player who never opens the Muséum\'s drawer misses the rock (the verdict says where it was)');

say(`\n${pass} passed, ${fail} failed.`);
fs.writeFileSync('calibration-result.txt', out.join('\n') + '\n');
process.exit(fail ? 1 : 0);
