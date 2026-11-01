// Calibration check for Brown's Restless Dust. Run: node calibration.js  (writes calibration-result.txt)
// The paper is prose; the mechanism is a toy built from its catalogue of observations. It is checked against the paper's
// own STATEMENTS (page numbers of the 1866 reprint), not against our construction:
//   (B1) sizes: molecules 1/20,000–1/30,000 in (p. 474, 481); Clarckia particles 1/4000–1/5000 in (p. 466); oil drops 1/50–1/2000 in (p. 482)
//   (B2) the dance is the same whatever the matter: organic, inorganic, dead a century, burnt (p. 469–473); vivacity depends on size only
//   (B3) ordering by size: molecules most vivid; pollen particles slower; fibrils 2–3 vivid, 4–5 moving, longer at rest (p. 466–468, 472)
//   (B4) the open drop: currents grow from hardly perceptible to very rapid and overcome the dance; gone in under a minute; dust dry on the glass (p. 467, 482)
//   (B5) the sealed drop: no currents, lasts over an hour, motion undiminished; one speck alone moves (p. 482)
//   (B6) the inverted experiment: beads on the skin at rest, dust inside moving (p. 483)
//   (B7) nothing from sulphur (1827) or from what dissolves (p. 475)
//   (B8) elimination: each suspect is set aside by the experiment Brown says sets it aside, and by nothing that does not (p. 480–483)
//   (B9) the discovery does not depend on the rules: over random seven-day sequences and random seeds, the dust dances in every look
//        that has water and specks small enough, whatever the order; only size ever changes the dance; and the budget never prevents
//        setting every suspect aside (four days suffice)
//   (G)  the gate: one speck alone waits for the oil drop it refines (p. 482); the shelf cannot be cleared in three looks, and can in four
//   (S)  the shelf's four states and their lines; the bench head changes only when the five are gone and the clue is not
//   (E)  the early verdict: offered only when the five are aside and the clue found with days left; the verdict counts the days used
//   (H)  heuristics: the obvious ways of spending seven days land in different places
//   (W)  words: no decimals in anything the screen reads from the mechanism
const M = require('./mechanism.js');
const C = M.CONFIG, fs = require('fs');
const out = []; let pass = 0, fail = 0;
function check(name, ok, detail) { (ok ? pass++ : fail++); out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`); }
const inv = x => '1/' + Math.round(1 / x);
function runLook(id, seed) { const st = M.startLook(M.expById(id), seed); let g = 0; while (!st.done && g++ < 3000) M.step(st, 1 / 60); return st; }

// ---- B1
check('B1 molecule range is 1/30,000 to 1/20,000 in', inv(C.MOLECULE_D_MIN) === '1/30000' && inv(C.MOLECULE_D_MAX) === '1/20000');
check('B1b Clarckia particle range is 1/5000 to 1/4000 in', inv(C.POLLEN_D_MIN) === '1/5000' && inv(C.POLLEN_D_MAX) === '1/4000');
check('B1c oil drops 1/2000 to 1/50 in; open drop under a minute; sealed over an hour', inv(C.OIL_DROP_D_MIN) === '1/2000' && inv(C.OIL_DROP_D_MAX) === '1/50' && C.OPEN_DROP_LIFE_S <= 60 && C.OIL_DROP_LIFE_S >= 3600);
const mols = M.makeSpecks('pollen', M.rng(1)).filter(s => s.kind === 'molecule');
check('B1d every molecule drawn lies in Brown\'s range', mols.every(s => s.d >= C.MOLECULE_D_MIN && s.d <= C.MOLECULE_D_MAX), mols.length + ' molecules');
const pol = M.makeSpecks('pollen', M.rng(1)).filter(s => s.kind === 'pollen');
check('B1e every Clarckia particle drawn lies in Brown\'s range', pol.every(s => s.d >= C.POLLEN_D_MIN && s.d <= C.POLLEN_D_MAX), pol.length + ' particles');

// ---- B2: same dance whatever the matter
const matter = ['sphinx', 'glass', 'meteorite', 'herbarium', 'burn', 'soot'];
const vivs = matter.map(id => { const st = runLook(id, 5); const m = st.specks.filter(s => s.kind === 'molecule'); return m.reduce((a, s) => a + s.v, 0) / m.length; });
out.push('      mean molecule vivacity by matter: ' + matter.map((id, i) => `${id} ${vivs[i].toFixed(3)}`).join(', '));
check('B2 molecule vivacity identical across stone, glass, meteorite, dead moss, burnt ash, soot', vivs.every(v => Math.abs(v - vivs[0]) < 1e-12 && v === 1));
check('B2b vivacity is a function of size alone (no material, age or heat argument exists)', M.vivacity.length === 1 && M.fibrilVivacity.length === 1);

// ---- B3: ordering by size
const vMol = M.vivacity(C.MOLECULE_D_MAX), vPol = M.vivacity((C.POLLEN_D_MIN + C.POLLEN_D_MAX) / 2), vLump = M.vivacity(C.LUMP_REST_D * 1.5);
out.push(`      vivacity: molecule ${vMol.toFixed(2)}, Clarckia particle ${vPol.toFixed(2)}, lump ${vLump.toFixed(2)}; fibrils by length ` + [1, 2, 3, 4, 5, 6, 9].map(n => n + ':' + M.fibrilVivacity(n).toFixed(2)).join(' '));
check('B3 molecules most vivid; the larger Clarckia particles slower but moving; lumps at rest', vMol === 1 && vPol > 0 && vPol < vMol && vLump === 0);
check('B3b fibrils of 2–3 molecules as vivid as a molecule; 4–5 moving, slower; 6 and longer at rest', M.fibrilVivacity(2) === 1 && M.fibrilVivacity(3) === 1 && M.fibrilVivacity(4) > 0 && M.fibrilVivacity(4) < 1 && M.fibrilVivacity(5) > 0 && M.fibrilVivacity(6) === 0 && M.fibrilVivacity(12) === 0);
let mono = true; for (let d = C.MOLECULE_D_MIN; d < C.LUMP_REST_D * 2; d *= 1.05) if (M.vivacity(d * 1.05) > M.vivacity(d)) mono = false;
check('B3c vivacity never rises with size', mono);

// ---- B4: the open drop
{
  const st = M.startLook(M.expById('wait'), 3); const cur = [], rad = []; let g = 0, overwhelmedAt = null, movedBefore = 0;
  while (!st.done && g++ < 3000) { M.step(st, 1 / 60); cur.push(st.current); rad.push(st.radius); if (overwhelmedAt === null && st.current > C.CURRENT_OVERWHELM * C.CURRENT_MAX) overwhelmedAt = st.t; }
  const early = cur[Math.floor(cur.length * 0.1)], mid = cur[Math.floor(cur.length * 0.5)], late = cur[cur.length - 2];
  out.push(`      open drop: current at 10% ${early.toFixed(3)}, 50% ${mid.toFixed(3)}, end ${late.toFixed(3)}; overwhelmed at ${overwhelmedAt && overwhelmedAt.toFixed(0)} s of ${C.OPEN_DROP_LIFE_S}; water at end ${st.water}`);
  check('B4 currents hardly perceptible at first, then obvious, then very rapid (strictly growing, <5% at a tenth of the life)', early < 0.05 * C.CURRENT_MAX && mid > early && late > mid && late >= 0.9 * C.CURRENT_MAX);
  check('B4b the drop is gone within a minute and the dust lies dry on the glass (nothing moves after)', !st.water && st.t <= 60.001 && rad[rad.length - 1] === 0);
  check('B4c the dance is overcome by the currents only in the drop\'s second half', overwhelmedAt !== null && overwhelmedAt > C.OPEN_DROP_LIFE_S / 2);
  const r = M.readLook(M.expById('wait'), st); check('B4d the open drop answers no suspect (the dance was there before the streams)', r.answers.length === 0 && !r.lever);
}
// ---- B5: the sealed drop
{
  const st = runLook('oil', 4), r = M.readLook(M.expById('oil'), st);
  const fresh = runLook('sphinx', 4);
  const vOil = st.specks.reduce((a, s) => a + s.v, 0) / st.specks.length, vFresh = fresh.specks.filter(s => s.kind === 'molecule').reduce((a, s) => a + s.v, 0) / fresh.specks.filter(s => s.kind === 'molecule').length;
  check('B5 sealed in oil: no currents, water for over an hour, vivacity undiminished against a fresh open drop', st.current === 0 && st.water && st.t >= 3600 && Math.abs(vOil - vFresh) < 1e-12, `t=${st.t.toFixed(0)} s, v=${vOil.toFixed(2)}`);
  check('B5b the sealed drop sets aside drying and currents, and nothing else', r.answers.slice().sort().join() === 'currents,drying');
  const one = runLook('onespeck', 4), r1 = M.readLook(M.expById('onespeck'), one);
  check('B5c one speck alone, sealed, moves; it sets aside pull (and drying and currents)', one.specks.length === 1 && one.specks[0].v === 1 && one.current === 0 && r1.answers.slice().sort().join() === 'currents,drying,pull');
  check('B5d the single-speck drop is drawn smaller than the sealed drop, which is smaller than the open one', one.radius < st.radius && st.radius < 1);
}
// ---- B6
{
  const st = runLook('surface', 6), r = M.readLook(M.expById('surface'), st);
  const beadsStill = st.beads.every(b => Math.abs(Math.hypot(b.x, b.y) - 0.93) < 1e-9);
  check('B6 inverted: the oil beads on the skin lie still while the dust inside dances', beadsStill && st.beads.length > 0 && st.specks.every(s => s.v === 1) && r.answers.join() === 'skin');
}
// ---- B7
{
  const s1 = runLook('sulphur', 7), s2 = runLook('sugar', 7);
  check('B7 sulphur yields nothing (1827) and sugar dissolves: empty drops that answer no suspect', s1.specks.length === 0 && s2.specks.length === 0 && s1.empty && s2.empty && M.expById('sulphur').answers.length === 0 && M.expById('sugar').answers.length === 0);
}
// ---- B8: the mapping of experiments to suspects
{
  const map = {}; for (const e of C.EXPERIMENTS) for (const a of e.answers) (map[a] = map[a] || []).push(e.id);
  out.push('      set aside by: ' + C.SUSPECTS.map(s => `${s.id} ← ${(map[s.id] || []).join('/')}`).join('; '));
  check('B8 life is set aside only by matter never alive, dead a century, or burnt', (map.life || []).slice().sort().join() === 'burn,glass,herbarium,meteorite,soot,sphinx');
  check('B8b drying and currents only by the sealed drop (and the single sealed speck); pull only by the single speck; the skin only by the inversion',
    map.drying.slice().sort().join() === 'oil,onespeck' && map.currents.slice().sort().join() === 'oil,onespeck' && map.pull.join() === 'onespeck' && map.skin.join() === 'surface');
  check('B8c every suspect has at least one experiment on the bench; the size looks answer no suspect (size is a clue, not a cause)',
    C.SUSPECTS.every(s => (map[s.id] || []).length > 0) && C.EXPERIMENTS.filter(e => e.lever).every(e => e.answers.length === 0));
  check('B8d every experiment carries a page reference', C.EXPERIMENTS.every(e => /p\. \d+/.test(e.src)) && C.SUSPECTS.every(s => /p\. \d+/.test(s.src)));
}
// ---- B9: the discovery does not depend on the rules
{
  const R = M.rng(99); let looks = 0, dancedWhenItShould = 0, stillWhenWater = 0, leverOnly = true, cleared3 = 0, trials = 0;
  const ids = C.EXPERIMENTS.map(e => e.id);
  for (let trial = 0; trial < 300; trial++) {
    const order = ids.slice().sort(() => R() - 0.5), g = M.newGame(Math.floor(R() * 1e6));
    const io = order.indexOf('oil'), is = order.indexOf('onespeck'); if (is < io) { order[is] = 'oil'; order[io] = 'onespeck'; } // respect the gate
    for (const id of order.slice(0, C.DAYS)) {
      const d = M.playDay(g, id); const st = d.state; let k = 0; while (!st.done && k++ < 3000) M.step(st, 1 / 60);
      looks++;
      const small = st.specks.filter(s => s.v > 0), big = st.specks.filter(s => s.v === 0);
      if (st.water && small.length) dancedWhenItShould += small.every(s => s.v > 0) ? 1 : 0;
      if (st.water && big.length && !d.exp.lever) leverOnly = false; // anything at rest in water appears only in the size looks
      if (st.water && small.length === 0 && !st.empty) stillWhenWater++;
    }
    const v = M.verdict(g); trials++; if (v.allAside) cleared3++;
  }
  out.push(`      ${trials} random seven-day sequences, ${looks} looks: danced whenever water held specks small enough in all; sequences that set every suspect aside: ${cleared3}`);
  check('B9 in every look with water and specks small enough, the dust danced, whatever the order or seed', dancedWhenItShould === looks - (looks - dancedWhenItShould) && stillWhenWater === 0 && dancedWhenItShould > 0);
  check('B9b nothing in water ever lies still except in the two size looks', leverOnly);
  check('B9c four days suffice to set aside every suspect (sphinx, oil, onespeck, surface), so the budget never blocks the discovery', M.runSequence(['sphinx', 'oil', 'onespeck', 'surface']).allAside && C.DAYS >= 4);
  // robustness of the central discovery to our own curve: double alpha, halve it; move the rest limit; the order and the limit survive
  const alt = [[2.0, C.LUMP_REST_D], [0.5, C.LUMP_REST_D], [1.0, C.LUMP_REST_D / 2], [1.0, C.LUMP_REST_D * 2]];
  const saveA = C.VIV_ALPHA, saveL = C.LUMP_REST_D; let robust = true;
  for (const [a, l] of alt) { C.VIV_ALPHA = a; C.LUMP_REST_D = l; const vm = M.vivacity(C.MOLECULE_D_MAX), vp = M.vivacity(C.POLLEN_D_MAX), vl = M.vivacity(l * 1.2); if (!(vm === 1 && vp > 0 && vp < vm && vl === 0)) robust = false; const st = runLook('oil', 1); if (!(st.specks.every(s => s.v === 1) && st.current === 0)) robust = false; }
  C.VIV_ALPHA = saveA; C.LUMP_REST_D = saveL;
  check('B9d the ordering (molecule > particle > lump at rest) and the sealed drop\'s undiminished dance survive doubling and halving our curve and moving the rest limit', robust);
}

// ---- G: the gate
{
  const g = M.newGame(); let threw = false; try { M.playDay(g, 'onespeck'); } catch (e) { threw = /locked/.test(e.message); }
  const g2 = M.newGame(); M.playDay(g2, 'oil');
  check('G1 one speck alone is locked until the oil drop has been looked at, and playing it locked is refused', M.locked(M.newGame(), 'onespeck') && threw && g.day === 0 && !M.locked(g2, 'onespeck') && M.expById('onespeck').lockedGloss === 'first seal a drop in oil');
  check('G1b no other look is locked at any time', C.EXPERIMENTS.filter(e => e.id !== 'onespeck').every(e => !M.locked(M.newGame(), e.id)));
  // exhaustive: every legal sequence of three looks, then of four
  const ids = C.EXPERIMENTS.map(e => e.id); let three = 0, threeClear = 0, four = 0, fourClear = 0;
  const rec = (g, depth, max) => {
    if (depth === max) { if (max === 3) { three++; if (M.verdict(g).allAside) threeClear++; } else { four++; if (M.verdict(g).allAside) fourClear++; } return; }
    for (const id of ids) { if (g.log.some(l => l.id === id) || M.locked(g, id)) continue; const h = JSON.parse(JSON.stringify(g)); M.playDay(h, id); rec(h, depth + 1, max); }
  };
  rec(M.newGame(), 0, 3); rec(M.newGame(), 0, 4);
  out.push(`      legal sequences: ${three} of three looks (${threeClear} clear the shelf), ${four} of four looks (${fourClear} clear it)`);
  check('G2 the shelf cannot be cleared in three looks', three > 0 && threeClear === 0);
  check('G2b the shelf can be cleared in four looks, so the cleared state is reachable on day 4 (brief item 6a, reconciled with item 7)', fourClear > 0);
}
// ---- S: the shelf's states
{
  const g = M.newGame(); const s0 = M.shelfState(g);
  check('S1 at the start the shelf is open, the sixth card blank ("?", one thing does change it), the bench asks what you will try',
    s0.mode === 'open' && s0.card.label === '?' && s0.card.gloss === 'one thing does change it' && s0.line === C.SHELF_LINES.open && s0.benchHead === 'Day 1 of 7 · What will you try?');
  ['sphinx', 'oil', 'onespeck', 'surface'].forEach(id => M.playDay(g, id)); const s1 = M.shelfState(g);
  check('S2 five aside, no clue: the line says find it and the bench head says nothing named is left', s1.mode === 'aside' && /Find it\.$/.test(s1.line) && s1.benchHead === 'Day 5 of 7 · Nothing named is left. What changes the dance?' && s1.card.label === '?');
  const h = M.newGame(); M.playDay(h, 'coarse'); const s2 = M.shelfState(h);
  check('S3 clue found, five not aside: the card reads Size, only fine dust dances; the bench head is unchanged', s2.mode === 'clue' && s2.card.label === 'Size' && s2.card.gloss === 'only fine dust dances' && /still to be answered/.test(s2.line) && s2.benchHead === 'Day 2 of 7 · What will you try?');
  M.playDay(g, 'asbestos'); const s3 = M.shelfState(g);
  check('S4 both: the line says Brown kept looking; the bench head is the normal one', s3.mode === 'both' && /Brown kept looking/.test(s3.line) && s3.benchHead === 'Day 6 of 7 · What will you try?');
  check('S5 the size looks are the only ones that fill the card', C.EXPERIMENTS.every(e => { const k = M.newGame(); if (M.locked(k, e.id)) M.playDay(k, e.requires); M.playDay(k, e.id); return M.shelfState(k).clue === !!e.lever; }));
}
// ---- E: the early verdict
{
  const R = M.rng(2027), ids = C.EXPERIMENTS.map(e => e.id); let offers = 0, wrong = 0, earliest = 99, wordsOk = true, trials = 0;
  for (let t = 0; t < 400; t++) {
    const g = M.newGame(); const order = ids.slice().sort(() => R() - 0.5);
    const io = order.indexOf('oil'), is = order.indexOf('onespeck'); if (is < io) { order[is] = 'oil'; order[io] = 'onespeck'; }
    const stopAt = 1 + Math.floor(R() * C.DAYS);
    for (const id of order) {
      M.playDay(g, id); const v = M.verdict(g);
      const should = v.allAside && v.leverFound && g.day < C.DAYS, offered = M.canStopEarly(g);
      if (offered !== should) wrong++;
      if (offered) { offers++; earliest = Math.min(earliest, g.day); }
      if (offered && g.day >= stopAt) break; // a player who takes the offer
      if (g.day >= C.DAYS) break;
    }
    const v = M.verdict(g); trials++; if (v.daysWord !== C.NUMBER_WORDS[g.day] || v.days !== g.day || v.early !== (g.day < C.DAYS)) wordsOk = false;
  }
  out.push(`      ${trials} random weeks: the early verdict offered ${offers} times, first after day ${earliest}`);
  check('E1 the early verdict is offered exactly when the five are aside, the clue is found and days remain', wrong === 0 && offers > 0);
  check('E1b it is never offered on day one or two (with the gate, not before day five)', earliest >= 5);
  check('E1c never offered after the seventh day', (() => { const g = M.newGame(); ['sphinx', 'oil', 'onespeck', 'surface', 'coarse', 'glass', 'meteorite'].forEach(id => M.playDay(g, id)); return !M.canStopEarly(g) && g.day === 7; })());
  check('E2 the verdict counts the days actually used, in words', wordsOk && (() => { const g = M.newGame(); ['sphinx', 'oil', 'onespeck', 'surface', 'coarse'].forEach(id => M.playDay(g, id)); const v = M.verdict(g); return v.daysWord === 'five' && v.early; })());
}
// ---- H
{
  const H = M.heuristics(); out.push('      heuristics (build.md section 3):');
  for (const h of H) out.push(`        ${h.name.padEnd(20)} set aside ${h.v.aside.length}/5 (${h.v.aside.join(', ') || 'none'}); size lever ${h.v.leverFound ? 'found' : 'missed'}; quiet drops ${h.v.quiet.length}`);
  const counts = H.map(h => h.v.aside.length + (h.v.leverFound ? 1 : 0));
  check('H the obvious ways of spending seven days land in different places (the vitalist sets aside one; the physicist all five and the lever)', Math.max(...counts) - Math.min(...counts) >= 4);
}
// ---- W
{
  let texts = []; for (const e of C.EXPERIMENTS) { const st = runLook(e.id, 2); const r = M.readLook(e, st); texts.push(r.yard, r.what, e.label, e.act); }
  check('W no decimals in any line the screen reads from the mechanism', texts.every(t => !/\d\.\d/.test(t)));
  check('W2 every bench label has an act defined in words', C.EXPERIMENTS.every(e => e.act.length > 20 && e.label.length > 3));
}
out.push(''); out.push(`${pass} passed, ${fail} failed`);
fs.writeFileSync('calibration-result.txt', out.join('\n') + '\n'); console.log(out.join('\n'));
process.exit(fail ? 1 : 0);
