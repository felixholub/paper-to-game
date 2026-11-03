// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Game A (afternoon 7): a first-timer who picks badly (a floppy blade, a stick, a leafy twig), learns by trying (strip the
//   leaves; a fast pull, then a slow one), opens How to play mid-dip and comes back, watches the mother once, bites off a
//   bent end, picks up her stem; at the hollow tries the hand, then the grass blade, chews it, then chewed leaves. About.
// Game B (ANOTHER AFTERNOON): watches first, then copies her with a stiff grass stem; never chews at the hollow.
// Game C (THE SAME LONG GRASS AGAIN): the same afternoon number replays the same grass; a quick, careless afternoon.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 780 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|ERR_FAILED|gc\.zgo/.test(m.text())) errors.push(m.text()); });
  await page.route(/gc\.zgo\.at/, r => r.abort());
  const file = 'file://' + path.join(__dirname, 'goodalls-long-grass.html');
  await page.goto(file + '#p=7'); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.waitForTimeout(650); await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: !!full }); say('  shot ' + name); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll on ${where}: ${w}px`); };
  const on = () => page.$eval('.screen.on', e => e.id);
  const text = sel => page.$eval(sel, e => e.innerText.replace(/\n+/g, ' | '));
  const state = () => page.evaluate(() => { const g = window.__goodall.g; return { phase: g.phase, suns: g.suns, eaten: g.eaten, sips: g.hollow.sips, hsuns: g.hollow.suns, held: g.held, carried: g.carried.map(s => s.type + (s.bent ? '*' : '')), dropped: !!g.mother.dropped }; });
  const idle = () => page.waitForFunction(() => !window.__goodall.g.dip && !window.__goodall.play.busy, null, { timeout: 20000 });
  const grassTypes = () => page.evaluate(() => window.__goodall.g.grass.map((s, i) => (window.__goodall.g.taken[i] ? '-' : s.type)));
  async function pick(type, strip) {
    const t = await grassTypes(); const i = t.indexOf(type); if (i < 0) { say(`  (no ${type} left in the grass)`); return false; }
    await page.click(`#grasspic rect[data-i="${i}"]`); await page.waitForTimeout(120);
    if (strip) await page.click('#gstrip');
    say(`  look: ${await text('#gdesc')}`); await page.click('#take'); await page.waitForTimeout(80); return true;
  }
  // a dip: push to `inches` at 6 in/s, hold `pause` s, pull at `speed` in/s; the finger moves in real time
  async function dipIt(inches, pause, speed, opts) {
    opts = opts || {};
    await page.$eval('#sec', e => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(60);
    const box = await page.$eval('#sec', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
    const px = 21 * box.w / 348; const x = box.x + box.w * 0.55; let y = box.y + 40;
    await page.mouse.move(x, y); await page.mouse.down();
    const stepMs = 16;
    const pushSteps = Math.max(2, Math.round(inches / 6 * 1000 / stepMs));
    for (let i = 1; i <= pushSteps; i++) { await page.mouse.move(x, y + inches * px * i / pushSteps); await page.waitForTimeout(stepMs); }
    y += inches * px;
    if (opts.release) { await page.mouse.up(); y = box.y + 40; }
    if (opts.mid) await opts.mid();
    await page.waitForTimeout(pause * 1000);
    if (opts.release) { await page.$eval('#sec', e => e.scrollIntoView({ block: 'center' })); const b2 = await page.$eval('#sec', e => e.getBoundingClientRect().y); y = b2 + 200; await page.mouse.move(x, y); await page.mouse.down(); }
    const dd = await page.evaluate(() => (window.__goodall.g.dip ? { d: window.__goodall.g.dip.d, ex: window.__goodall.g.dip.excess } : { d: 0, ex: 0 }));
    const d = dd.d + (opts.release ? 0 : Math.min(1.5, dd.ex));
    const total = (d + 1) * px, pullSteps = Math.max(1, Math.round((d + 1) / speed * 1000 / stepMs));
    for (let i = 1; i <= pullSteps; i++) { await page.mouse.move(x, y - total * i / pullSteps); await page.waitForTimeout(stepMs); }
    await page.mouse.up(); await page.waitForTimeout(100); await idle(); await page.waitForTimeout(150);
    const s = await state();
    say(`  dip (push ${inches} in, pause ${pause} s, pull ${speed} in/s): ${await text('#typed')}  [red] ${await text('#red')}  → suns ${s.phase === 'hollow' ? s.hsuns : s.suns}, termites ${s.eaten}${s.phase === 'hollow' ? ', sips ' + s.sips : ''}`);
    return s;
  }
  const hold = async k => { await page.click(`#pslots .slot:nth-child(${k + 1})`); await page.waitForTimeout(80); say(`  hold: ${await text('#pdesc')}`); };
  const press = async (sel, label) => { await page.click(sel); await page.waitForTimeout(150); say(`  ${label}: ${await text('#typed')}`); };

  // ================= GAME A
  say('GAME A (afternoon 7)'); await shot('a-cover', true); await noScroll('cover');
  await page.click('#begin'); await page.waitForTimeout(200);
  await pick('blade'); await page.click(`#grasspic rect[data-i="${(await grassTypes()).indexOf('leafy')}"]`); await page.waitForTimeout(100);
  await page.dispatchEvent('#gstrip', 'pointerdown'); await page.waitForTimeout(150); await shot('a-grass-preview-strip'); await page.dispatchEvent('#gstrip', 'pointerleave');
  await page.click('#take'); await pick('stick'); await shot('a-grass-kit', true); await noScroll('grass');
  await page.click('#walk'); await page.waitForTimeout(300); await shot('a-mound-start'); await noScroll('mound');
  await hold(0); await dipIt(5, 1, 3); await shot('a-mound-floppy');
  await hold(2); await dipIt(3, 0.5, 3); await shot('a-mound-thick');
  await hold(1); await dipIt(3, 0.5, 3);
  await page.dispatchEvent('#strip', 'pointerdown'); await page.waitForTimeout(150); await shot('a-mound-preview-strip'); await page.dispatchEvent('#strip', 'pointerleave');
  await press('#strip', 'strip the leaves');
  await dipIt(9, 1.5, 100); await shot('a-mound-jerk');
  await dipIt(9, 2, 3, { release: true, mid: async () => { await page.waitForTimeout(900); await shot('a-mound-stem-in'); await page.click('#play .q'); await page.waitForTimeout(200); await shot('help', true); say('  help opened mid-dip; back to: ' + (await page.click('#helpback'), await on())); } });
  await shot('a-mound-slow');
  await page.click('#watch'); await page.waitForTimeout(2200); await shot('a-watch'); await idle(); await page.waitForTimeout(300);
  say(`  watched: ${await text('#typed')}  [red] ${await text('#red')}`); await shot('a-watch-after');
  let s = await state();
  while (s.phase === 'mound') {
    const st = await page.evaluate(() => { const x = GOODALL.inHand(window.__goodall.g); return x && x.bent; });
    if (st) { await page.dispatchEvent('#bite', 'pointerdown'); await page.waitForTimeout(100); if (!(await page.$('#a-bit'))) { await shot('a-mound-preview-bite'); } await page.dispatchEvent('#bite', 'pointerleave'); await press('#bite', 'bite off the end'); }
    if (s.dropped && !(await page.evaluate(() => window.__goodall.g.usedHers))) { await press('#hers', 'pick up her stem'); }
    s = await dipIt(9, 2, 3.5);
  }
  await shot('a-leaving', true);
  await page.click('#follow'); await page.waitForTimeout(300); await shot('a-hollow-start'); await noScroll('hollow');
  await hold(3); await dipIt(4, 0.3, 3);
  await hold(0); await dipIt(4, 0.3, 3); await shot('a-hollow-stem');
  await page.dispatchEvent('#chew', 'pointerdown'); await page.waitForTimeout(150); await shot('a-hollow-preview-chew'); await page.dispatchEvent('#chew', 'pointerleave');
  await press('#chew', 'chew the end'); await dipIt(4, 0.3, 3);
  await press('#leaves', 'pick some leaves'); await press('#chew', 'chew the leaves'); await dipIt(4, 0.3, 3); await shot('a-hollow-wad');
  s = await state(); while (s.phase === 'hollow') s = await dipIt(4, 0.3, 3);
  await shot('a-hollow-end', true);
  await page.click('#lastpage'); await page.waitForTimeout(400); await shot('a-end', true); await noScroll('end');
  say('  END: ' + await text('#headline')); say('  ' + await text('#did'));
  await page.click('#end [data-about]'); await page.waitForTimeout(200); await shot('about', true); await page.click('#aboutback'); say('  about back to: ' + await on());

  // ================= GAME B
  await page.click('#again'); await page.waitForTimeout(300); const seedB = await page.evaluate(() => window.__goodall.g.seed);
  say(`\nGAME B (another afternoon: ${seedB}): watch first, then copy her`);
  await pick('stem'); (await pick('leafy', true)) || (await pick('dry')); await pick('dry');
  await page.click('#walk'); await page.waitForTimeout(300);
  await page.click('#watch'); await page.waitForTimeout(500); await idle(); await page.waitForTimeout(200); say(`  watched: ${await text('#typed')}`);
  s = await state();
  while (s.phase === 'mound') {
    const bent = await page.evaluate(() => { const x = GOODALL.inHand(window.__goodall.g); return x && x.bent; }); if (bent) await press('#bite', 'bite off the end');
    s = await dipIt(9, 2.2, 3);
  }
  await page.click('#follow'); await page.waitForTimeout(300); await hold(0);
  s = await state(); while (s.phase === 'hollow') s = await dipIt(4, 0.3, 3);
  await page.click('#lastpage'); await page.waitForTimeout(300); await shot('b-end', true);
  say('  END: ' + await text('#headline'));

  // ================= GAME C
  await page.click('#same'); await page.waitForTimeout(300); const seedC = await page.evaluate(() => window.__goodall.g.seed);
  say(`\nGAME C (the same long grass again: ${seedC}, same as B: ${seedC === seedB})`);
  const tC = await grassTypes(); say('  grass: ' + tC.join(' '));
  await pick(tC[0]); await page.click('#walk'); await page.waitForTimeout(200);
  s = await state(); while (s.phase === 'mound') s = await dipIt(6, 0.2, 70);
  await page.click('#follow'); await page.waitForTimeout(200);
  s = await state(); while (s.phase === 'hollow') s = await dipIt(4, 0.2, 3);
  await page.click('#lastpage'); await page.waitForTimeout(300); await shot('c-end', true);
  say('  END: ' + await text('#headline'));
  say(`\nerrors: ${errors.length ? errors.join(' | ') : 'none'}`);
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
