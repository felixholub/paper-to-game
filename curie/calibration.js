// Calibration check for Curie's Quartz. Run: node calibration.js  (writes calibration-result.txt)
// Tests mechanism.js, unchanged, against the paper: the table of currents (transcribed here a second time, independently,
// from the scan of p. 1101–1102), the paper's own statements on p. 1102, the honesty of a reading written down at any moment
// by any thumb, that no page can carry a label or back a claim the paper contradicts, that careful measuring recovers her
// table, the robustness of the discovery to the assumptions that are ours, and her claims played in numbers (build.md §3).
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

// ---------- thumbs: each returns where the slider is, and whether to write it down now
const sigma = x => C.JITTER * Math.sqrt(x * 1.5) / (C.G * 1.5);
const THUMBS = {
  careful: { push: (st, th) => (th.r = Math.max(0, th.r + 2.4 * st.s / 60)), done: (st, th) => st.hold >= 1.5 || st.t > 25 },
  hasty: { push: (st, th) => th.r, done: (st, th) => st.t >= 1.0 },                                    // sets a guess, writes at once
  sloppy: { push: (st, th) => (th.r = Math.max(0, th.r + 2.4 * st.s / 60)), done: (st, th) => st.t >= th.when },
  sweeper: { push: (st, th) => { th.r = Math.max(0, th.r + 2.4 * st.s / 60); return st.t >= th.when - 0.05 ? th.r + 1.5 : th.r; }, done: (st, th) => st.t >= th.when },
  wobbler: { push: (st, th) => { th.r = Math.max(0, th.r + 2.4 * st.s / 60); return Math.max(0, th.r + 0.08 * Math.sin(st.t * 9)); }, done: (st, th) => st.t >= th.when },
  still: { push: (st, th) => 0, done: (st, th) => st.t >= th.when },
};
const guess = s => s.u > 0 ? s.u : 0.5;   // the hasty player's guess: what the label suggests
function measure(g, id, name, rng) {
  const s = M.sub(id), st = M.benchStart(g, id), T = THUMBS[name];
  const th = { r: name === 'hasty' ? guess(s) : 0, when: 0.8 + rng() * 6 };
  let k = 0;
  while (k++ < 60 * 40) { const r = Math.min(C.SLIDER_MAX, T.push(st, th)); M.benchStep(st, 1 / 60, r); if (M.canCommit(st) && T.done(st, th)) break; }
  return M.commit(g, st);
}

// ---------- 3. honesty: whatever the thumb and whenever it writes, the reading contains her value
say('\n3. A reading written down at any moment, by any thumb, contains her value');
{
  const rng = M.mulberry32(7); const by = {}; let n = 0, miss = 0;
  for (const name of Object.keys(THUMBS)) for (const s of C.SUBSTANCES) for (let seed = 1; seed <= 60; seed++) {
    const g = M.newGame(seed * 13 + 1); if (s.id !== 'uranium') measure(g, 'uranium', 'careful', rng);
    const p = measure(g, s.id, name, rng), x = M.strength(s), R = p.R;
    by[R.type] = by[R.type] || { n: 0, miss: 0 }; by[R.type].n++; n++;
    if (!(x >= R.lo - 1e-9 && x <= R.hi + 1e-9)) { by[R.type].miss++; miss++; }
  }
  for (const [ty, o] of Object.entries(by)) say(`   ${ty.padEnd(8)} ${String(o.n).padStart(5)} readings, ${o.miss} without her value`);
  check(['atleast', 'atmost', 'rough'].every(ty => !by[ty] || by[ty].miss === 0), 'bounds and rough readings always contain her value');
  check(miss / n < 0.005, 'over all thumbs and moments, fewer than one reading in 200 misses her value', `${miss} of ${n}`);
  check(Object.keys(by).length === 4, 'all four kinds of reading occur (held, at least, at most, roughly)', Object.keys(by).join(', '));
}

// ---------- 4. no page carries a label, or backs a claim, the paper contradicts
say('\n4. Three thousand random albums (random jars, thumbs and moments): no false labels, no false claims');
{
  const rng = M.mulberry32(11); const bad = {}; let albums = 0, panels = 0;
  const flag = (k, d) => { bad[k] = bad[k] || []; if (bad[k].length < 3) bad[k].push(d); };
  const shelf = C.SUBSTANCES.map(s => s.id), names = Object.keys(THUMBS);
  for (let a = 0; a < 3000; a++) {
    const g = M.newGame(a + 1); const tn = () => names[Math.floor(rng() * names.length)];
    measure(g, 'uranium', tn(), rng);
    while (!M.over(g)) measure(g, shelf[Math.floor(rng() * shelf.length)], tn(), rng);
    albums++;
    for (const p of g.panels) {
      panels++; const k = M.panelKind(g, p), pk = M.paperKind(M.sub(p.id));
      if (k !== pk && k !== 'unsure' && !(p.id === 'tantal' && k === 'nothing')) flag(`${p.id} labelled ${k}, hers ${pk}`, a);
    }
    for (const c of M.claims(g)) if (c.backed && c.id === 'thbeats') {
      const U = M.yard(g); const thin = g.panels.filter(p => p.id === 'thO').some(p => p.R.lo > U.hi), thick = g.panels.filter(p => p.id === 'thOthick').some(p => p.R.lo > U.hi);
      if (thin && !thick) flag('"thorium beats uranium" backed by the thin layer alone (hers: 22 against 24)', a);
    }
  }
  const keys = Object.keys(bad);
  check(keys.length === 0, `no label the paper contradicts on ${panels} panels in ${albums} albums (CAN'T TELL is always allowed; the faint tantalum salt may read NOTHING SEEN)`, keys.map(k => k + ' ×' + bad[k].length).join('; '));
}

// ---------- 5. careful measuring recovers her table
say('\n5. A careful thumb (balanced, then held a second and a half) gets her labels on every jar');
{
  const rng = M.mulberry32(5); let worst = 0, wid = '', badk = [];
  for (const s of C.SUBSTANCES) for (let seed = 1; seed <= 40; seed++) {
    const g = M.newGame(seed); measure(g, 'uranium', 'careful', rng);
    const p = s.id === 'uranium' ? g.panels[0] : measure(g, s.id, 'careful', rng);
    const z = Math.abs(p.R.est - M.strength(s)) / Math.max(sigma(M.strength(s)), 1e-3); if (z > worst) { worst = z; wid = s.id; }
    const k = M.panelKind(g, p); if (k !== M.paperKind(s) && !(s.id === 'tantal' && (k === 'nothing' || k === 'unsure'))) badk.push(`${s.id}:${k}`);
  }
  check(badk.length === 0, 'careful labels equal her labels for all sixteen jars, 40 seeds each (the faint tantalum salt reads NOTHING SEEN or CAN’T TELL after a short hold)', badk.slice(0, 5).join(', '));
  // a patient thumb, holding the spot five seconds, sees the tantalum salt's faint push: her "semble être légèrement actif"
  THUMBS.patient = { push: (st, th) => (th.r = Math.max(0, th.r + 2.4 * st.s / 60)), done: (st, th) => st.hold >= 5 || st.t > 40 };
  let seen = 0; for (let seed = 1; seed <= 40; seed++) { const g = M.newGame(seed); measure(g, 'uranium', 'careful', rng); if (M.panelKind(g, measure(g, 'tantal', 'patient', rng)) === 'without') seen++; }
  delete THUMBS.patient;
  check(seen >= 36, 'a patient thumb (five seconds standing) sees the tantalum salt move the spot: her "slightly active"', `${seen} of 40`);
  check(worst < 4.5, 'careful readings sit within 4.5 σ of her values', `worst ${worst.toFixed(2)} σ (${wid})`);
}

// ---------- 6. robustness of the discovery to what is ours
say('\n6. Robustness: her rocks are MORE THAN THEIR URANIUM, her copy is not, under any plausible share and threshold');
for (const share of [0.4, 0.5, 0.65, 0.75, 0.88]) {
  const kinds = ['pbJG', 'pbJo'].map(id => M.paperKind(Object.assign({}, S(id), { u: share })));
  check(kinds.every(q => q === 'more'), `pitchblende at ${Math.round(share * 100)} % uranium (pure uraninite is about 88 %)`, kinds.join(', '));
}
for (const share of [0.45, 0.5, 0.55]) {
  const a = M.paperKind(Object.assign({}, S('chalc'), { u: share })), b = M.paperKind(Object.assign({}, S('chalcArt'), { u: share }));
  check(a === 'more' && b === 'about', `chalcolite at ${Math.round(share * 100)} % uranium: mine ${a}, made ${b}`);
}
{
  const saved = C.MORE_RATIO, base = C.SUBSTANCES.map(s => M.paperKind(s)).join(','); const det = [];
  for (const r of [1.1, 1.5, 2, 3, 4]) { C.MORE_RATIO = r; if (C.SUBSTANCES.map(s => M.paperKind(s)).join(',') !== base) det.push('ratio ' + r); }
  C.MORE_RATIO = saved;
  check(!det.length, 'the threshold (ours, 1.3) can be anything from 1.1 to 4 without changing her labels', det.join(', '));
}
for (const wp of [12, 24, 50, 72]) {
  const k = M.paperKind(Object.assign({}, S('whiteP'), { amps: wp }));
  check(k === 'without' && M.paperKind(S('redP')) === 'nothing', `white phosphorus at ${wp} (ours; the paper gives no number): still the phosphorus lesson`, k);
}
say('   note: natural chalcolite (52) and a thick layer of thorium oxide (53) read level; the rocks are not explained by thorium because they hold none (their cards say so).');

// ---------- 7. her claims in numbers (build.md §3): plans × thumbs, 300 albums each
say('\n7. How many of her six claims a page backs: five plans × three thumbs, 300 albums each');
const PLANS = {
  "the paper's path": ['nitrate', 'thO', 'thOthick', 'whiteP', 'redP', 'pbJG', 'chalc', 'chalcArt'],
  'random eight': null,
  'drawers top to bottom': C.DRAWERS.flatMap(d => C.SUBSTANCES.filter(s => s.drawer === d.id && s.id !== 'uranium').map(s => s.id)).slice(0, 8),
  'rocks first, then the copy': ['pbJG', 'pbJo', 'chalc', 'chalcArt', 'greenox', 'nitrate', 'thO', 'lead'],
  'dull jars (all read zero)': ['lead', 'gold', 'copper', 'redP', 'phosphate', 'lead', 'gold', 'copper'],
};
const table = {};
for (const [plan, ids] of Object.entries(PLANS)) {
  table[plan] = {};
  for (const name of ['careful', 'sloppy', 'hasty']) {
    const rng = M.mulberry32(99); let sum = 0, six = 0, rocks = 0;
    for (let a = 0; a < 300; a++) {
      const g = M.newGame(a + 7); measure(g, 'uranium', name, rng);
      const pick = ids || (() => { const pool = C.SUBSTANCES.filter(s => s.id !== 'uranium').map(s => s.id); return Array.from({ length: 8 }, () => pool.splice(Math.floor(rng() * pool.length), 1)[0]); })();
      for (const id of pick) measure(g, id, name, rng);
      const cl = M.claims(g), n = cl.filter(c => c.backed).length; sum += n; if (n === 6) six++; if (cl.find(c => c.id === 'rocks').backed) rocks++;
    }
    table[plan][name] = { mean: sum / 300, six: six / 300, rocks: rocks / 300 };
  }
}
say('   plan                          | careful: mean, all six, rocks | sloppy: mean, rocks | hasty: mean, rocks');
for (const [plan, r] of Object.entries(table))
  say(`   ${plan.padEnd(30)}| ${r.careful.mean.toFixed(1)}, ${Math.round(100 * r.careful.six)} %, ${Math.round(100 * r.careful.rocks)} %`.padEnd(66) + `| ${r.sloppy.mean.toFixed(1)}, ${Math.round(100 * r.sloppy.rocks)} %`.padEnd(22) + `| ${r.hasty.mean.toFixed(1)}, ${Math.round(100 * r.hasty.rocks)} %`);
check(table["the paper's path"].careful.six > 0.95, "the paper's path, measured carefully, backs all six claims", `${Math.round(100 * table["the paper's path"].careful.six)} % of albums`);
check(table['dull jars (all read zero)'].careful.mean === 0, 'a page of dull jars backs nothing, however carefully measured');
check(table["the paper's path"].hasty.mean < table["the paper's path"].careful.mean - 1, 'hasty measuring on the right jars backs clearly less than careful measuring', `${table["the paper's path"].hasty.mean.toFixed(1)} against ${table["the paper's path"].careful.mean.toFixed(1)}`);
check(table["the paper's path"].hasty.rocks < 0.5, 'a hasty player who writes the rock down at the push its label suggests usually misses the discovery', `${Math.round(100 * table["the paper's path"].hasty.rocks)} % back the rock claim`);

say(`\n${pass} passed, ${fail} failed.`);
fs.writeFileSync('calibration-result.txt', out.join('\n') + '\n');
process.exit(fail ? 1 : 0);
