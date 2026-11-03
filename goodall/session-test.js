// A scripted session in a real browser at phone size: three afternoons through the actual play screen, with screenshots.
// Run: node session-test.js   (writes screenshot-*.png and prints the log; session-log.txt is the saved output)
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const say = s => console.log(s);
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 780 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|net::/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: !!full }); say(`  shot ${name}`); };
  const text = sel => page.$eval(sel, e => e.textContent.trim());
  const state = () => page.evaluate(() => { const g = window.__goodall.g; return { phase: g.phase, suns: g.suns, eaten: g.eaten, dips: g.dips.length, held: g.carried[0] ? g.carried[0].type : null, sips: g.hollow.sips, hsuns: g.hollow.suns, seed: g.seed, over: g.over }; });
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); say(`  ${where}: page width ${w} (no horizontal scroll: ${w <= 380})`); };
  const pick = async t => { const j = await page.evaluate(t => window.__goodall.g.grass.findIndex(x => x.type === t), t); if (j < 0) { say(`  (no ${t} in the clump)`); return false; }
    await page.dispatchEvent(`[data-pick="${j}"] path`, 'pointerdown', { bubbles: true, pointerId: 1 }); await page.waitForTimeout(250); say(`  take ${t}: ${await text('#typed')}`); return true; };
  const act = async a => { const el = await page.$(`[data-act="${a}"] rect`); if (!el) { say(`  (no ${a} tag)`); return false; } await page.dispatchEvent(`[data-act="${a}"] rect`, 'pointerdown', { bubbles: true, pointerId: 1 }); await page.waitForTimeout(250); say(`  ${a}: ${await text('#typed')}`); return true; };
  const geom = async () => { const b = await page.$eval('#sec', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }); return { px: 21 * b.w / 348, x: b.x + b.w * 0.5, y: b.y + b.h * 0.3 }; };
  async function dip(inches, pause, pullMs, opts) { // a real-time drag on the plate: in at ~6 in/s, a pause, out at pullMs per thirtieth
    opts = opts || {}; const G = await geom(); const n = 30;
    await page.mouse.move(G.x, G.y); await page.mouse.down();
    for (let i = 1; i <= n; i++) { await page.mouse.move(G.x, G.y + inches * G.px * i / n); await page.waitForTimeout(16); }
    if (opts.release) { await page.mouse.up(); await page.waitForTimeout(pause * 1000); if (opts.mid) await opts.mid(); await page.mouse.move(G.x, G.y + inches * G.px); await page.mouse.down(); }
    else await page.waitForTimeout(pause * 1000);
    if (opts.shotIn) await shot(opts.shotIn);
    for (let i = n - 1; i >= -2; i--) { await page.mouse.move(G.x, G.y + inches * G.px * i / n); await page.waitForTimeout(pullMs); }
    await page.mouse.up(); await page.waitForTimeout(2400);
    const s = await state(); say(`  dip (push ${inches} in, pause ${pause} s, pull ${pullMs} ms/step): ${await text('#typed')}  [red] ${await text('#red')}  → suns ${s.suns}, termites ${s.eaten}${s.phase === 'hollow' || s.phase === 'end' ? ', sips ' + s.sips : ''}`);
    return s;
  }
  const hold = async k => { await page.click(`#hold [data-hold="${k}"]`); await page.waitForTimeout(150); say(`  hold ${k}`); };
  const press = async (sel, what) => { const ok = await page.$eval(sel, e => !e.disabled && !e.classList.contains('hidden')); if (!ok) { say(`  (${what}: not possible with this)`); return; } await page.click(sel); await page.waitForTimeout(250); say(`  ${what}: ${await text('#typed')}`); };

  await page.goto('file://' + path.join(__dirname, 'goodalls-long-grass.html#p=7'));
  await shot('a-cover'); await noScroll('cover');
  say('GAME A (afternoon 7): a first-timer, every mistake');
  await page.click('#begin'); await page.waitForTimeout(400); await shot('a-mound-start'); await noScroll('mound');
  say(`  clump: ${(await page.evaluate(() => window.__goodall.g.grass.map(x => x.type))).join(' ')}`);
  await pick('stick'); await dip(3, 0.4, 30, { shotIn: 'a-stick-blocked' });
  await pick('blade'); await dip(4, 0.4, 30, { shotIn: 'a-blade-folds' });
  await pick('leafy'); await dip(3, 0.4, 30, { shotIn: 'a-leaves-catch' });
  await act('strip'); await shot('a-stripped');
  await dip(8, 1.5, 4); // a flick: the termites are shaken off
  await shot('a-after-jerk');
  await dip(8, 2, 45, { release: true, mid: async () => { await shot('a-stem-in'); await page.click('#play .q'); await page.waitForTimeout(200); await shot('help', true); await page.click('#helpback'); await page.waitForTimeout(200); say('  help opened mid-dip and closed'); } });
  await shot('a-slow');
  let s = await state();
  while (s.phase === 'mound' && s.suns > 3) { if (await page.$('[data-act="bite"]')) { await act('bite'); await shot('a-bite'); } if (await page.$('[data-act="hers"]')) { await act('hers'); await shot('a-hers'); } s = await dip(8, 1.8, 45); }
  while (s.phase === 'mound') s = await dip(8, 1.8, 45);
  await shot('a-leaving'); say(`  leaving: ${await text('#leavingtext')}`);
  await page.click('#follow'); await page.waitForTimeout(400); await shot('a-hollow-start'); await noScroll('hollow');
  await hold('hand'); await dip(3, 0.3, 30, { shotIn: 'a-hollow-hand' });
  await hold(0); await dip(4, 0.3, 30, { shotIn: 'a-hollow-stem' });
  await press('#chew', 'chew the end'); await dip(4, 0.3, 30);
  await press('#leaves', 'pick some leaves'); await hold('leaves'); await press('#chew', 'chew the leaves'); await dip(4, 0.3, 30, { shotIn: 'a-hollow-wad' });
  s = await state(); while (s.phase === 'hollow') s = await dip(4, 0.3, 30);
  await shot('a-hollow-end'); await page.click('#lastpage'); await page.waitForTimeout(500); await shot('a-end', true); await noScroll('end');
  say(`  END: ${await text('#headline')}`); say(`  ${(await page.$$eval('#did p', ps => ps.map(p => p.textContent))).join(' | ')}`);
  await page.click('#end [data-about]'); await page.waitForTimeout(300); await shot('about', true); await page.click('#aboutback'); await page.waitForTimeout(200);

  say('GAME B (another afternoon): a stiff stem from the start, her way');
  await page.click('#again'); await page.waitForTimeout(400); s = await state(); say(`  afternoon ${s.seed}`);
  await pick('stem');
  s = await state(); while (s.phase === 'mound') { if (await page.$('[data-act="bite"]')) await act('bite'); s = await dip(8, 2, 45); }
  await page.click('#follow'); await page.waitForTimeout(300);
  s = await state(); while (s.phase === 'hollow') s = await dip(4, 0.3, 30);
  await page.click('#lastpage'); await page.waitForTimeout(400); await shot('b-end', true); say(`  END: ${await text('#headline')}`);

  say('GAME C (the same long grass again): a careless afternoon with a blade');
  const seedB = s.seed; await page.click('#same'); await page.waitForTimeout(400); s = await state(); say(`  afternoon ${s.seed} (same as B: ${s.seed === seedB})`);
  await pick('blade');
  s = await state(); while (s.phase === 'mound') s = await dip(6, 0.2, 6);
  await page.click('#follow'); await page.waitForTimeout(300);
  s = await state(); while (s.phase === 'hollow') s = await dip(4, 0.2, 30);
  await page.click('#lastpage'); await page.waitForTimeout(400); await shot('c-end', true); say(`  END: ${await text('#headline')}`);
  say(''); say('errors: ' + (errs.length ? errs.join(' | ') : 'none'));
  await browser.close();
})();
