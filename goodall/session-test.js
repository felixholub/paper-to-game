// A scripted session in a real browser at phone size: two afternoons (the mound and the hollow; a different mound, alone, and the ants)
// and a careless replay, through the actual play screen, with screenshots. Run: node session-test.js  (session-log.txt is the saved output)
const { chromium } = require('playwright'); const path = require('path');
const say = s => console.log(s);
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 780 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|net::/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: !!full }); say(`  shot ${name}`); };
  const text = sel => page.$eval(sel, e => e.textContent.trim());
  const state = () => page.evaluate(() => { const g = window.__goodall.g; return { phase: g.phase, afternoon: g.afternoon, suns: g.suns, eaten: g.eaten, dips: g.dips.length, held: g.carried[0] ? g.carried[0].type : null, sips: g.hollow.sips, ants: g.ants.eaten, seed: g.seed, away: g.mother.away, finale: g.finale }; });
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); say(`  ${where}: page width ${w} (no horizontal scroll: ${w <= 380})`); };
  const pick = async t => { const j = await page.evaluate(t => window.__goodall.g.grass.findIndex(x => x.type === t), t); if (j < 0) { say(`  (no ${t} in the clump)`); return false; }
    await page.dispatchEvent(`[data-pick="${j}"] path`, 'pointerdown', { bubbles: true, pointerId: 1 }); await page.waitForTimeout(250); say(`  take ${t}: ${await text('#typed')}`); return true; };
  const act = async a => { if (!(await page.$(`[data-act="${a}"] rect`))) { say(`  (no ${a} tag)`); return false; } await page.dispatchEvent(`[data-act="${a}"] rect`, 'pointerdown', { bubbles: true, pointerId: 1 }); await page.waitForTimeout(250); say(`  ${a}: ${await text('#typed')}`); return true; };
  const geom = async () => { const b = await page.$eval('#sec', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }); return { x: b.x + b.w * 0.55, y: b.y + b.h * 0.62 }; };
  async function press(holdMs, opts) { // the one gesture: press, hold, let go
    opts = opts || {}; const G = await geom();
    await page.mouse.move(G.x, G.y); await page.mouse.down(); await page.waitForTimeout(holdMs);
    if (opts.shotIn) await shot(opts.shotIn);
    if (opts.lift) { await page.mouse.up(); await page.waitForTimeout(400); if (opts.mid) await opts.mid(); await page.mouse.move(G.x, G.y); await page.mouse.down(); await page.waitForTimeout(600); }
    await page.mouse.up(); await page.waitForTimeout(opts.wait || 3400);
    const s = await state(); say(`  press ${holdMs} ms: ${await text('#typed')}  [red] ${await text('#red')}  → suns ${s.suns}, termites ${s.eaten}${s.phase === 'hollow' ? ', sips ' + s.sips : s.phase === 'ants' ? ', ants ' + s.ants : ''}  [now: ${await text('#now')}]`);
    return s;
  }
  const hold = async k => { await page.click(`#hold [data-hold="${k}"]`); await page.waitForTimeout(150); say(`  hold ${k}`); };
  const pressBtn = async (sel, what) => { const ok = await page.$eval(sel, e => !e.disabled && !e.classList.contains('hidden')); if (!ok) { say(`  (${what}: not possible with this)`); return; } await page.click(sel); await page.waitForTimeout(250); say(`  ${what}: ${await text('#typed')}`); };
  const play = async (holdMs) => { let s = await state(); while (s.phase === 'mound') s = await press(holdMs); return s; };

  await page.goto('file://' + path.join(__dirname, 'goodalls-long-grass.html#p=7'));
  await shot('a-cover'); await noScroll('cover');
  say('AFTERNOON 1 (page 7): a first-timer, every mistake, then the hollow');
  await page.click('#begin'); await page.waitForTimeout(400); await shot('a-mound-start'); await noScroll('mound');
  let s = await state(); say(`  clump: ${(await page.evaluate(() => window.__goodall.g.grass.map(x => x.type))).join(' ')}; mother away: ${s.away}; finale: ${s.finale}; now: ${await text('#now')}`);
  await pick('stick'); await press(1200, { shotIn: 'a-stick-blocked' });
  await pick('blade'); await press(1200, { shotIn: 'a-blade-folds' });
  await pick('leafy'); await press(1200, { shotIn: 'a-leaves-catch' });
  await act('strip'); await shot('a-stripped');
  await press(1350, { wait: 2600 });                                   // let go the moment it arrives: a snatch
  await shot('a-after-snatch');
  await press(3600, { shotIn: 'a-stem-in', lift: true, mid: async () => { await page.click('#play .q'); await page.waitForTimeout(200); await shot('help', true); await page.click('#helpback'); await page.waitForTimeout(200); say('  help opened with the stem in the hole, and closed'); } });
  await shot('a-gentle');
  s = await state();
  while (s.phase === 'mound') { if (await page.$('[data-act="bite"]')) { await act('bite'); await shot('a-bite'); } if (await page.$('[data-act="hers"]')) { await act('hers'); await shot('a-hers'); } s = await press(3200); }
  await shot('a-leaving'); say(`  leaving: ${await text('#leavingtext')} [${await text('#follow')}]`);
  await page.click('#follow'); await page.waitForTimeout(400); await shot('a-hollow-start'); await noScroll('hollow');
  await hold('hand'); await press(900, { shotIn: 'a-hollow-hand', wait: 2200 });
  await hold(0); await press(900, { shotIn: 'a-hollow-stem', wait: 2200 });
  await pressBtn('#chew', 'chew the end'); await press(900, { wait: 2200 });
  await pressBtn('#leaves', 'pick some leaves'); await hold('leaves'); await pressBtn('#chew', 'chew the leaves'); await press(900, { shotIn: 'a-hollow-wad', wait: 2200 });
  s = await state(); while (s.phase === 'hollow') s = await press(900, { wait: 2200 });
  await shot('a-hollow-end'); await page.click('#lastpage'); await page.waitForTimeout(500); await shot('a-end', true); await noScroll('end');
  say(`  END: ${await text('#headline')}`); say(`  ${(await page.$$eval('#did p', ps => ps.map(p => p.textContent))).join(' | ')}`);
  await page.click('#end [data-about]'); await page.waitForTimeout(300); await shot('about', true); await page.click('#aboutback'); await page.waitForTimeout(200);

  say('AFTERNOON 2: a different mound, alone, no grass stem; then the ants');
  await page.click('#again'); await page.waitForTimeout(400); s = await state(); await shot('b-mound-start');
  say(`  page ${s.seed}; clump: ${(await page.evaluate(() => window.__goodall.g.grass.map(x => x.type))).join(' ')}; mother away: ${s.away}; finale: ${s.finale}; mound: ${await page.evaluate(() => JSON.stringify(window.GOODALL.CONFIG.PASSAGE))}`);
  say(`  intro: ${await text('#typed')}`);
  await pick('dry'); await press(3200);
  await pick('leafy'); await press(1200); await act('strip'); await press(3200, { shotIn: 'b-stem-in' });
  s = await state(); while (s.phase === 'mound') { if (await page.$('[data-act="bite"]')) await act('bite'); s = await press(3200); }
  say(`  leaving: ${await text('#leavingtext')} [${await text('#follow')}]`);
  await page.click('#follow'); await page.waitForTimeout(400); await shot('b-ants-start'); await noScroll('ants'); say(`  now: ${await text('#now')}`);
  await press(2000, { wait: 2600 });                                     // a short dip: a few ants
  await pick('stick'); await press(5000, { shotIn: 'b-ants-climbing', wait: 2600 });
  await press(9000, { wait: 2600 });                                     // too long: bitten
  await shot('b-ants-bitten');
  s = await state(); while (s.phase === 'ants') s = await press(5000, { wait: 2600 });
  await shot('b-ants-end'); await page.click('#lastpage'); await page.waitForTimeout(500); await shot('b-end', true);
  say(`  END: ${await text('#headline')}`); say(`  ${(await page.$$eval('#did p', ps => ps.map(p => p.textContent))).join(' | ')}`);

  say('AFTERNOON 2 AGAIN (same page): careless, a blade, every go a snatch');
  const seedB = s.seed; await page.click('#same'); await page.waitForTimeout(400); s = await state(); say(`  page ${s.seed} (same: ${s.seed === seedB}), afternoon ${s.afternoon}`);
  await pick('blade'); s = await play(1300);
  await page.click('#follow'); await page.waitForTimeout(300);
  s = await state(); while (s.phase === 'ants') s = await press(1500, { wait: 2600 });
  await page.click('#lastpage'); await page.waitForTimeout(400); await shot('c-end', true); say(`  END: ${await text('#headline')}`);
  say(''); say('errors: ' + (errs.length ? errs.join(' | ') : 'none'));
  await browser.close();
})();
