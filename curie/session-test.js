// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Album A: the paper's path, more or less: uranium (balanced with a real mouse drag on the slider; help opened and closed
//          mid-measurement), lead, thin thorium, white phosphorus, red phosphorus, pitchblende from Saxony (shot mid-chase,
//          with the !? up), chalcolite from a mine, chalcolite made by you, thick thorium. The last page; About.
// Album B: start a new album; never open the Muséum's drawer: the verdict must say where the rock was.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'curies-quartz.html')); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const on = async () => page.$eval('.screen.on', e => e.id);
  const setPush = async r => page.evaluate(v => { const s = document.querySelector('#push'); s.value = Math.round(v * 1000); s.dispatchEvent(new Event('input')); }, r);
  // a thumb: starts where the label suggests, then follows the spot, ten corrections a second, until the ring closes
  const thumb = async (start, opts = {}) => {
    await setPush(start); let r = start, t0 = Date.now(), midShot = false;
    while (Date.now() - t0 < 40000) {
      const b = await page.evaluate(() => { const b = window.__curie.bench; return { s: b.s, done: b.done, r: b.r, t: b.t }; });
      if (b.done) return (Date.now() - t0) / 1000;
      if (opts.midShot && !midShot && r > 1.3 && b.s > 0.6) { await shot(opts.midShot, false); midShot = true; say('   mid-chase: !? shown = ' + await page.$eval('#benchsvg #wow', e => e.getAttribute('opacity') === '1')); }
      r = Math.max(0, Math.min(4, r + (b.s > 0.5 ? 0.25 : 0.55 * b.s))); await setPush(r); await page.waitForTimeout(100);
    }
    say('  !! the spot was never balanced'); return null;
  };
  await shot('start'); await noScroll();
  say('START: ' + await text('.aimbox'));
  await page.click('#begin'); await page.waitForTimeout(500);
  say(`\n== ${await text('#benchband')} (on ${await on()})`);
  if (await page.$eval('#push', e => +e.value) !== 0) say('  !! slider does not start at zero');
  await shot('a-bench-uranium-start', false);
  // a real drag on the slider: press on the thumb, move right in steps, watch the spot respond
  const box = await page.$eval('#push', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.move(box.x + 19, box.y + box.h / 2); await page.mouse.down();
  for (let k = 1; k <= 12; k++) { await page.mouse.move(box.x + 19 + k * 7, box.y + box.h / 2); await page.waitForTimeout(60); }
  await page.mouse.up(); await page.waitForTimeout(400);
  const afterDrag = await page.evaluate(() => ({ v: +document.querySelector('#push').value, r: window.__curie.bench.r, s: window.__curie.bench.s }));
  say(`   real drag: slider ${afterDrag.v}, push seen by the mechanism ${afterDrag.r.toFixed(2)}, spot ${afterDrag.s.toFixed(2)}`);
  if (afterDrag.r < 0.3) say('  !! the drag did not move the push');
  // help mid-measurement, and back
  await page.click('#bench .help-q'); await page.waitForTimeout(300); await shot('help');
  const tHelp = await page.evaluate(() => window.__curie.bench.t); await page.waitForTimeout(800);
  const tHelp2 = await page.evaluate(() => window.__curie.bench.t);
  say(`   help opened mid-measurement: bench clock ${tHelp.toFixed(2)} → ${tHelp2.toFixed(2)} while away (should not move)`);
  await page.click('#helpback'); await page.waitForTimeout(300);
  say(`   back on ${await on()}, slider kept at ${await page.$eval('#push', e => e.value)}`);
  const secs = await thumb(afterDrag.r);
  await page.waitForTimeout(400); say(`   balanced in ${secs}s: ${await text('#resbadge')} — ${await text('#rescap')}`);
  await shot('a-bench-uranium-balanced', false);
  await page.click('#topage'); await page.waitForTimeout(900);
  say('   page: ' + await text('#pageband') + ' · ' + await text('#foundline'));
  await shot('a-shelf-1'); await noScroll();
  const plan = [['lead', 0], ['thO', 0], ['whiteP', 0], ['redP', 0], ['pbJG', 0.6, 'a-bench-pitchblende-chase'], ['chalc', 0.5], ['chalcArt', 0.5], ['thOthick', 0]];
  for (const [id, start, mid] of plan) {
    await page.click(`.jar[data-id="${id}"]`); await page.waitForTimeout(300);
    say(`\n-- card: ${await text('#cardname')} | ${await text('#cardwhat')} | ${await text('#cardu')}`);
    if (id === 'pbJG') await shot('a-card-pitchblende', false);
    await page.click('#cardtest'); await page.waitForTimeout(400);
    say(`== ${await text('#benchband')}`);
    if (await page.$eval('#push', e => +e.value) !== 0) say('  !! slider carried over from the last bench');
    if (id === 'pbJG') await shot('a-bench-pitchblende-start', false);
    const t = await thumb(start, { midShot: mid });
    await page.waitForTimeout(400);
    say(`   balanced in ${t}s: ${await text('#resbadge')} — ${await text('#rescap')}`);
    if (id === 'pbJG') await shot('a-bench-pitchblende-balanced', false);
    if (id === 'chalcArt') await shot('a-bench-copy-balanced', false);
    await page.click('#topage'); await page.waitForTimeout(900);
    say('   page: ' + await text('#pageband') + ' · ' + await text('#foundline'));
    if (id === 'redP') await shot('a-shelf-5');
    await noScroll();
  }
  await shot('a-page-full');
  if (!(await page.$eval('#turnpart', e => !e.classList.contains('hidden')))) say('  !! TURN not offered after nine panels');
  await page.click('#turn'); await page.waitForTimeout(500);
  say('\nEND A: ' + await text('#headline')); say('   did: ' + await text('#did')); say('   paper: ' + await text('#paper')); say('   means: ' + await text('#means')); say('   later: ' + await text('#later'));
  await shot('a-end'); await shot('a-end-top', false); await noScroll();
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(300);
  say('about returned to: ' + await on());
  // ---- album B
  await page.click('#again'); await page.waitForTimeout(500);
  say(`\nALBUM B: ${await text('#benchband')}; panels in game: ${await page.evaluate(() => window.__curie.game.panels.length)}`);
  await thumb(0.9); await page.waitForTimeout(300); await page.click('#topage'); await page.waitForTimeout(700);
  for (const id of ['lead', 'gold', 'copper', 'whiteP', 'redP', 'phosphate', 'tantal', 'thO']) {
    await page.click(`.jar[data-id="${id}"]`); await page.waitForTimeout(200); await page.click('#cardtest'); await page.waitForTimeout(300);
    await thumb(id === 'whiteP' ? 1 : id === 'thO' ? 0.8 : 0); await page.waitForTimeout(300);
    say(`   ${id}: ${await text('#resbadge')}`);
    await page.click('#topage'); await page.waitForTimeout(600);
  }
  await page.click('#turn'); await page.waitForTimeout(500);
  const vb = await text('#did'); say('\nEND B: ' + await text('#headline')); say('   did: ' + vb);
  if (!/never tested the rocks from the Muséum/.test(vb)) say('  !! album B verdict does not say where the rock was');
  await shot('b-end-top', false);
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
