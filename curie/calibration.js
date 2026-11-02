// Calibration check for Curie's Quartz. Run: node calibration.js  (writes calibration-result.txt)
// Tests mechanism.js, unchanged: the table of currents (transcribed here a second time, independently, from the scan of
// p. 1101–1102) and the paper's own statements on p. 1102; that a reading is the number written down; that her own page
// gives her physics and our world; that each designed wrong number plants its idea and its law; that every reachable page
// yields a world whose pictures agree with its laws; retests and clashes; and the worlds played in numbers (build.md §3).
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
check(compounds.every(s => M.strength(s) <= s.u * 1.0 + 1e-9), 'every uranium compound on the shelf reads at most its uranium share (the panel says AS EXPECTED)',
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

// ---------- helpers: write a number down directly, or measure with a thumb
const write = (g, id, x) => { const st = M.benchStart(g, id); M.benchStep(st, 1, x); return M.commit(g, st); };
const THUMBS = {   // each keeps an intent and a moment to write it down
  careful: { push: (st, th) => (th.r = Math.max(0, th.r + 2.4 * st.s / 60)), done: (st, th) => { th.still = Math.abs(st.s) < C.BAND ? (th.still || 0) + 1 / 60 : 0; return th.still >= 1.5 || st.t > 25; } },
  sloppy: { push: (st, th) => (th.r = Math.max(0, th.r + 2.4 * st.s / 60)), done: (st, th) => st.t >= th.when },
  hasty: { push: (st, th) => th.r, done: (st, th) => st.t >= 1.0 },
};
function measure(g, id, name, rng) {
  const s = M.sub(id), st = M.benchStart(g, id), T = THUMBS[name];
  const th = { r: name === 'hasty' ? (s.u > 0 ? s.u : 0.5) : 0, when: 0.8 + rng() * 6 }; let k = 0;
  while (k++ < 60 * 40) { const r = Math.min(C.SLIDER_MAX, T.push(st, th)); M.benchStep(st, 1 / 60, r); if (M.canCommit(st) && T.done(st, th)) break; }
  return M.commit(g, st);
}
const her = ['nitrate', 'thO', 'thOthick', 'whiteP', 'redP', 'pbJG', 'chalc', 'chalcArt'];   // her path: eight jars after pure uranium

// ---------- 3. a reading is the number written down
say('\n3. A reading is the push at the moment of writing it down; the spot’s direction is kept as a mark');
{
  const g = M.newGame(1); const p = write(g, 'uranium', 0.6), q = write(g, 'lead', 0.5), r = write(g, 'thO', 0.917);
  check(p.x === 0.6 && q.x === 0.5, 'the page keeps the number as written', `${p.x}, ${q.x}`);
  check(p.moving === 'right' && q.moving === 'left' && r.moving === null, 'the mark records which way the spot was running (right: plate stronger; left: weaker; none: standing)', `${p.moving}, ${q.moving}, ${r.moving}`);
}

// ---------- 4. her page is her note, and her world is ours
say('\n4. Her own readings give her physics; careful measuring of her path gives it too');
{
  const ph = M.herPhysics();
  check(ph.energy === 'restless' && ph.carriers === 'heaviest' && ph.hidden === 'yes' && ph.phos === 'chemistry' && ph.rare === true,
    'her table: the restless atom, the heaviest atoms, something hidden in the rocks, white phosphorus is chemistry, and (her own small mistake) the rare metals a little', JSON.stringify({ e: ph.energy, c: ph.carriers, h: ph.hidden, p: ph.phos, r: ph.rare }));
  const g = M.newGame(2); write(g, 'uranium', 1); her.forEach(id => write(g, id, M.strength(M.sub(id))));
  const pt = M.part(g);
  check(pt.same && /^Your page is her note, and your world is the one you live in\.$/.test(pt.closing), 'her path, at her values, without the tantalum salt: "your page is her note, and your world is the one you live in"', pt.closing.slice(0, 70));
  const g2 = M.newGame(2); write(g2, 'uranium', 1); her.filter(id => id !== 'thO').forEach(id => write(g2, id, M.strength(M.sub(id)))); write(g2, 'tantal', M.strength(M.sub('tantal')) + 0.02);
  check(/her own small mistake/.test(M.part(g2).closing), 'her path with her faint tantalum: the closing turns to her own small mistake, the humming jewellery');
  const rng = M.mulberry32(3); let ok = 0;
  for (let seed = 1; seed <= 40; seed++) { const h = M.newGame(seed); measure(h, 'uranium', 'careful', rng); her.forEach(id => measure(h, id, 'careful', rng)); if (M.part(h).same) ok++; }
  check(ok >= 38, 'a careful thumb on her path writes her note', `${ok} of 40 albums`);
}

// ---------- 5. each designed wrong number plants its idea and its law
say('\n5. Designed wrong numbers: the idea planted and the world it makes');
const PLANS = [
  ['pure uranium written low (half hers)', [['uranium', 0.5], ['greenox', 0.75], ['nitrate', 0.29]], { energy: 'slow' }, /burns brighter|slow fire/],
  ['a salt written low', [['uranium', 1], ['nitrate', 0.1]], { energy: 'slow' }, /smother/],
  ['lead written as active', [['uranium', 1], ['lead', 0.5]], { energy: 'sky', carriers: 'weight' }, /raining down on them from space/],
  ['copper written as active', [['uranium', 1], ['copper', 0.4]], { carriers: 'everything' }, /telegraph/],
  ['white phosphorus without a control', [['uranium', 1], ['whiteP', 1.3]], { carriers: 'living', phos: 'atom' }, /stuff of life/],
  ['white phosphorus, red phosphorus written active', [['uranium', 1], ['whiteP', 1.3], ['redP', 0.5]], { carriers: 'living', phos: 'atom' }, /phosphorus itself/],
  ['white phosphorus, red phosphorus none (hers)', [['uranium', 1], ['whiteP', 1.3], ['redP', 0]], { carriers: 'heaviest', phos: 'chemistry' }, /never the phosphorus/],
  ['thorium written as nothing', [['uranium', 1], ['thO', 0]], { carriers: 'alone' }, /freak/],
  ['the copy as strong as the mine’s', [['uranium', 1], ['chalc', 2.2], ['chalcArt', 1.5]], { energy: 'crystal', hidden: 'crystal' }, /way the crystal is built/],
  ['the copy ordinary after the mine’s (hers)', [['uranium', 1], ['chalc', 2.2], ['chalcArt', 0.38]], { energy: 'restless', hidden: 'yes' }, /something extra/],
  ['pitchblende written at its uranium', [['uranium', 1], ['pbJG', 0.65]], { energy: 'bottomless', hidden: 'no' }, /never runs out/],
  ['pitchblende high in a sky-wind page', [['uranium', 1], ['lead', 0.5], ['pbJG', 3.4]], { energy: 'sky', hidden: 'yes' }, /bigger sail/],
  ['pitchblende high in a slow-fire page', [['uranium', 0.5], ['greenox', 0.8], ['pbJG', 3.4]], { energy: 'slow', hidden: 'yes' }, /fiercer fuel/],
  ['lead and white phosphorus', [['uranium', 1], ['lead', 0.5], ['whiteP', 1.3]], { energy: 'sky', carriers: 'everything' }, /stuff of life/],
];
for (const [label, plan, want, re] of PLANS) {
  const g = M.newGame(4); let last; plan.forEach(([id, x]) => { last = write(g, id, x); });
  const ph = M.physics(g), ok = Object.entries(want).every(([k, v]) => ph[k] === v) && re.test(g.ideas.map(i => i.text).join(' '));
  check(ok, label, `${ph.energy} / ${ph.carriers} / ${ph.hidden} / ${ph.phos}; idea: "${last.idea.slice(0, 60)}…"`);
}

// ---------- 6. every reachable page yields a world whose pictures agree with its laws; every world is reachable
say('\n6. Forty thousand random pages (random bands for every jar, or never measured): every world agrees with its laws');
{
  const BANDS_U = ['NONE', 'LOW', 'ABOUT', 'HIGH', undefined], BANDS_0 = ['NONE', 'FAINT', 'ACTIVE', 'STRONG', undefined];
  const PICS = new Set(M.PICS), rng = M.mulberry32(17), combos = {}, worlds = {}; let bad = [];
  for (let k = 0; k < 40000; k++) {
    const bands = {}; C.SUBSTANCES.forEach(s => { if (s.id === 'uranium') return; const b = (s.u > 0 ? BANDS_U : BANDS_0)[Math.floor(rng() * 5)]; if (b) bands[s.id] = b; });
    const retests = rng() < 0.2 ? 3 : 0;
    const ph = M.settle(bands, () => null, { retests, retested: [] }), w = M.worldOf(ph);
    combos[`${ph.energy} · ${ph.carriers} · ${ph.hidden}`] = (combos[`${ph.energy} · ${ph.carriers} · ${ph.hidden}`] || 0) + 1;
    worlds[w.id] = (worlds[w.id] || 0) + 1;
    const O = new Set(w.odd), fail = m => { if (bad.length < 5) bad.push(m + ' ' + JSON.stringify(bands)); };
    if (!M.WORDS.worlds[w.id] || !M.LANDMARKS.includes(w.landmark)) fail('world');
    if (w.closing.length !== 3 || !w.closing.every(c => PICS.has(c.pic) && c.text && c.year)) fail('closing');
    if (O.has('doctor') && !(ph.carriers === 'living' || ph.carriers === 'everything')) fail('doctor without living light');
    if (O.has('storm') && ph.carriers !== 'everything') fail('storm without everything');
    if (O.has('pedestal') && ph.carriers !== 'alone') fail('pedestal without uranium alone');
    if (O.has('miners93') && !(ph.energy === 'sky' && ph.hidden === 'yes')) fail('miners93');
    if (O.has('fadinglamp') && !(ph.energy === 'slow' && ph.hidden === 'yes')) fail('fadinglamp');
    if (O.has('jewels') && !ph.rare) fail('jewels');
    if (O.has('stamps') && retests < C.DOUBT_RETESTS) fail('stamps');
    if (w.id === 'bone' && O.has('doctor')) fail('the bone world draws its own doctor twice');
    if (w.id === 'leaking' && O.has('storm')) fail('the leaking world draws its own storm twice');
    if (ph.energy === 'sky' && !['lead', 'gold'].some(id => ['ACTIVE', 'STRONG'].includes(bands[id]))) fail('sky without heavy metal');
    if (ph.energy === 'bottomless' && !(['pbJG', 'pbJo', 'chalc'].some(id => bands[id]) && !['pbJG', 'pbJo', 'chalc'].some(id => bands[id] === 'HIGH'))) fail('bottomless');
    if (ph.energy === 'crystal' && ph.hidden !== 'crystal') fail('crystal hidden');
    if (w.id === 'quiet' && ph.carriers !== 'alone') fail('quiet');
    if (w.id === 'doubt' && retests < C.DOUBT_RETESTS) fail('doubt');
    if (w.id === 'elsewhere' && ph.hidden !== 'unlooked') fail('elsewhere');
    if (w.id === 'restless' && (ph.hidden === 'unlooked' || retests >= C.DOUBT_RETESTS)) fail('restless with unlooked rocks or a doubting page');
    if (w.laws.some(l => !l.text) || !w.paragraph) fail('empty text');
    if (/\d\.\d/.test(w.paragraph + w.laws.map(l => l.text).join(' '))) fail('decimal');
  }
  check(!bad.length, 'no world draws a picture its laws do not allow; every closing panel is drawable; no decimals', bad.join(' | '));
  check(Object.keys(M.WORDS.worlds).every(id => worlds[id]), 'all ten worlds are reached by random pages', Object.entries(worlds).map(([k, v]) => `${k} ${v}`).join(', '));
  const keys = Object.keys(combos).sort();
  say(`   ${keys.length} reachable combinations of energy · matter · rocks; worlds: ` + Object.entries(worlds).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
}

// ---------- 6b. the conduct worlds, by design
say('\n6b. Pages that make the conduct worlds');
{
  const g = M.newGame(3); write(g, 'uranium', 1); write(g, 'nitrate', 0.3); write(g, 'nitrate', 0.3); write(g, 'thO', 0.9); write(g, 'thO', 0.9); write(g, 'pbJG', 3.4); write(g, 'pbJG', 3.4);
  check(M.physics(g).world === 'doubt' && !M.part(g).same && /over again/.test(M.part(g).lines.join(' ')), 'her numbers, everything measured twice: the Académie of Doubt, not her note', M.physics(g).world);
  const h = M.newGame(3); write(h, 'uranium', 1); write(h, 'nitrate', 0.3); write(h, 'thO', 0.9); write(h, 'whiteP', 1.3); write(h, 'redP', 0); write(h, 'lead', 0);
  check(M.physics(h).world === 'elsewhere' && !M.part(h).same, 'her numbers, the rocks never looked at: Found Elsewhere, not her note', M.physics(h).world);
  const q = M.newGame(3); write(q, 'uranium', 1); write(q, 'thO', 0); write(q, 'lead', 0); write(q, 'pbJG', 0.6);
  check(M.physics(q).world === 'quiet' || M.physics(q).world === 'bottomless', 'thorium silent and the rock at its uranium: the quiet metal or the bottomless atom (the energy question comes first)', M.physics(q).world);
  const r = M.newGame(3); write(r, 'uranium', 1); write(r, 'thO', 0); write(r, 'lead', 0); write(r, 'pbJG', 3.4);
  check(M.physics(r).world === 'quiet', 'thorium silent, the rock strong: the quiet metal', M.physics(r).world);
  const s2 = M.newGame(3); write(s2, 'uranium', 1); write(s2, 'copper', 0.4); write(s2, 'pbJG', 3.4);
  check(M.physics(s2).world === 'leaking', 'copper active: the leaking world', M.physics(s2).world);
  const b2 = M.newGame(3); write(b2, 'uranium', 1); write(b2, 'whiteP', 1.3); write(b2, 'pbJG', 3.4);
  check(M.physics(b2).world === 'bone', 'white phosphorus without its control: the electric bone', M.physics(b2).world);
  const d = M.newGame(3); const p1 = write(d, 'uranium', 1); const st = M.benchStart(d, 'pbJG'); M.benchStep(st, 1, 0.65); const p2 = M.commit(d, st);
  check(p2.moving === 'right' && /running to the right/.test(M.part(d).lines.join(' ')), 'a rock written while the spot ran right: the parting says the real current was higher', p2.moving);
}

// ---------- 7. retests and clashes
say('\n7. A retest replaces the earlier reading; a clash fires once');
{
  const g = M.newGame(5); write(g, 'uranium', 1); write(g, 'lead', 0.5);
  const before = M.physics(g).energy; const p = write(g, 'lead', 0);
  check(before === 'sky' && M.physics(g).energy !== 'sky' && /different answer|Not what I wrote|changed/.test(p.idea), 'lead written active, then measured again as nothing: the sky wind is gone, and the balloon notices the answer changed', p.idea.slice(0, 60));
  write(g, 'pbJG', 3.4); const a = write(g, 'pbJo', 0.6); const b = write(g, 'pbJo', 0.5);
  check(a.clash.length === 1 && b.clash.length === 0, 'two mines, two answers: the clash fires once');
  check(!/\b(its|their) uranium\b/i.test(JSON.stringify(M.WORDS)), 'the words never say "its uranium" or "their uranium"; they say "the uranium in it"');
  { const rng = M.mulberry32(23), shelf = C.SUBSTANCES.map(s => s.id); let balloons = 0, repeats = 0, longest = 0, unknown = 0;
    for (let a = 0; a < 2000; a++) {
      const h = M.newGame(a + 1); write(h, 'uranium', 0.3 + rng() * 1.4); const seen = {};
      while (!M.over(h)) { const id = shelf[Math.floor(rng() * shelf.length)], x = rng() < 0.5 ? M.strength(M.sub(id)) * (0.5 + rng()) : rng() * 3; write(h, id, x); }
      h.ideas.forEach(i => { balloons++; if (/\{\w\}|undefined/.test(i.text)) unknown++; longest = Math.max(longest, i.text.length); if (seen[i.text]) repeats++; seen[i.text] = 1; });
    }
    check(unknown === 0, 'every balloon in 2 000 random albums is filled in (no blank left, no missing entry)', `${unknown} of ${balloons}`);
    check(longest <= 280, 'every balloon fits a big bench balloon (at most 280 characters; the longest is a changed retest, two sentences)', `longest ${longest}`);
    check(repeats / balloons < 0.03, 'within an album, a line is almost never said twice (only when a belief is met more often than it has variants)', `${repeats} repeats in ${balloons} balloons`);
  }
  const all = JSON.stringify(M.WORDS); check(!/\d\.\d/.test(all), 'no decimals anywhere in the words');
}

// ---------- 8. the worlds in numbers
say('\n8. Which world a page makes: three thumbs on her path and on random jars, 300 albums each');
{
  const tally = {};
  for (const plan of ["her path", 'random eight']) for (const name of ['careful', 'sloppy', 'hasty']) {
    const rng = M.mulberry32(99), t = {};
    for (let a = 0; a < 300; a++) {
      const g = M.newGame(a + 7); measure(g, 'uranium', name, rng);
      const pick = plan === 'her path' ? her : (() => { const pool = C.SUBSTANCES.filter(s => s.id !== 'uranium').map(s => s.id); return Array.from({ length: 8 }, () => pool.splice(Math.floor(rng() * pool.length), 1)[0]); })();
      pick.forEach(id => measure(g, id, name, rng));
      const k = M.part(g).same ? 'hers' : M.physics(g).world; t[k] = (t[k] || 0) + 1;
    }
    tally[`${plan}, ${name}`] = t;
  }
  const cols = ['hers', 'restless', 'slow', 'sky', 'crystal', 'bottomless', 'leaking', 'bone', 'quiet', 'doubt', 'elsewhere'];
  say('   page                    | ' + cols.map(c => c.padEnd(10)).join(''));
  for (const [k, t] of Object.entries(tally)) say(`   ${k.padEnd(24)}| ` + cols.map(c => (Math.round(100 * (t[c] || 0) / 300) + ' %').padEnd(10)).join(''));
  check((tally['her path, careful'].hers || 0) / 300 > 0.9, 'careful on her path: her note, nine albums in ten or more');
  check(Object.keys(tally['her path, sloppy']).length >= 2 && (tally['her path, sloppy'].slow || 0) > 0, 'sloppy on her path: a sloppy thumb under-reads (it creeps up on the balance), so it writes her note or the slow fire', Object.keys(tally['her path, sloppy']).join(', '));
  check(Object.keys(Object.assign({}, ...Object.values(tally))).filter(k => k !== 'hers').length >= 4, 'across all thumbs and jars, at least four of the five physics occur (the conduct worlds need a deliberate page)', Object.keys(Object.assign({}, ...Object.values(tally))).join(', '));
  check(!(tally['her path, hasty'].hers), 'hasty on her path never writes her note');
}

say(`\n${pass} passed, ${fail} failed.`);
fs.writeFileSync('calibration-result.txt', out.join('\n') + '\n');
process.exit(fail ? 1 : 0);
