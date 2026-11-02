// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Album A: her path, measured carefully with a thumb that follows the spot (the first with a real mouse drag, How to play opened
//          mid-measurement). Expect her physics and "your page is her note".
// Album B: the slow fire: pure uranium written at half her push, then her salts and rocks written at her values.
// Album C: the sky wind with living light: lead and gold written as active, white phosphorus without its control.
const { chromium } = require('playwright-core'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'curies-counterfactuals.html')); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const on = async () => page.$eval('.screen.on', e => e.id);
  const setPush = async r => page.evaluate(v => { const s = document.querySelector('#push'); s.value = Math.round(v * 1000); s.dispatchEvent(new Event('input')); }, r);
  const bench = () => page.evaluate(() => { const b = window.__curie.bench; return { s: b.s, t: b.t, r: b.r, committed: !!b.committed }; });
  const waitWrite = () => page.waitForFunction(() => !document.querySelector('#write').disabled);
  const careful = async start => {   // hold the slider, watch where the spot settles, correct by that much; write once it settles on 0
    let r = start; const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      await setPush(r); await page.waitForTimeout(1600);
      const b = await bench(); if (Math.abs(b.s) < 0.04) break;
      r = Math.max(0, Math.min(4, r + (Math.abs(b.s) > 0.95 ? Math.sign(b.s) * 0.8 : b.s / 1.5)));
    }
    await waitWrite(); await page.click('#write'); await page.waitForTimeout(400);
  };
  const writeAt = async x => { await setPush(x); await waitWrite(); await page.waitForTimeout(300); await page.click('#write'); await page.waitForTimeout(400); };
  const open = async id => { await page.click(`.jar[data-id="${id}"]`); await page.waitForTimeout(200); await page.click('#cardtest'); await page.waitForTimeout(300);
    if (await page.$eval('#push', e => +e.value) !== 0) say('  !! slider carried over'); if (!(await page.$eval('#write', e => e.disabled))) say('  !! WRITE IT DOWN awake at once'); };
  const report = async () => say(`   ${await text('#benchband')}: ${await text('#rescap')}  💭 ${await text('#thoughts')}`);
  const toPage = async () => { await page.click('#topage'); await page.waitForTimeout(700); };
  const ending = async (tag) => {
    await page.click('#turn'); await page.waitForTimeout(600);
    say(`\nEND ${tag}: ${await text('#physname')}`);
    say('   laws: ' + await text('#laws'));
    say('   strip: ' + await text('#endstrip'));
    say('   where they part: ' + (await text('#part')).slice(0, 500));
    say('   unseen: ' + await text('#unseen'));
    await noScroll();
  };

  // ---- album A
  await shot('start'); await noScroll(); say('START: ' + await text('.aimbox') + ' | ' + await text('.acts'));
  await page.click('#begin'); await page.waitForTimeout(400);
  const cap = await text('#benchcap'); say('   bench says: ' + cap); if (/\b0\b|zero|middle|stand still|hold the spot/i.test(cap)) say('  !! the bench text gives the method away');
  await shot('a-bench-uranium-start', false);
  const box = await page.$eval('#push', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height }; });
  await page.mouse.move(box.x + 19, box.y + box.h / 2); await page.mouse.down();
  for (let k = 1; k <= 12; k++) { await page.mouse.move(box.x + 19 + k * 7, box.y + box.h / 2); await page.waitForTimeout(60); }
  await page.mouse.up(); await page.waitForTimeout(400);
  const d = await bench(); say(`   real drag: push ${d.r.toFixed(2)}, spot ${d.s.toFixed(2)}`); if (d.r < 0.3) say('  !! the drag did not move the push');
  await page.waitForTimeout(2000); const st = await bench(); if (st.committed || await page.$eval('#write', e => e.disabled)) say('  !! the bench stalls or ends by itself');
  await page.click('#bench .help-q'); await page.waitForTimeout(300); await shot('help');
  const t1 = (await bench()).t; await page.waitForTimeout(600); const t2 = (await bench()).t; say(`   help mid-measurement: clock ${t1.toFixed(2)} → ${t2.toFixed(2)}`);
  await page.click('#helpback'); await page.waitForTimeout(300);
  await careful(d.r); await report(); await shot('a-bench-uranium-written', false); await toPage();
  const herPath = ['nitrate', 'thO', 'thOthick', 'whiteP', 'redP', 'pbJG', 'chalc', 'chalcArt'];
  for (const id of herPath) { await open(id); await careful(0); await report(); if (id === 'pbJG') await shot('a-bench-pitchblende', false); if (id === 'chalcArt') await shot('a-bench-copy', false); await toPage(); if (id === 'whiteP') await shot('a-shelf-strip'); }
  await shot('a-page-full');
  await ending('A'); await shot('a-end');
  if (!/her note/.test(await text('#part'))) say('  !! album A is not her note');
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(300); say('about returned to: ' + await on());

  // ---- album B: the slow fire
  await page.click('#again'); await page.waitForTimeout(400);
  const S = id => page.evaluate(i => window.CURIE.strength(window.CURIE.sub(i)), id);
  await writeAt(0.5); await report(); await toPage();
  for (const id of ['greenox', 'nitrate', 'thO', 'pbJG', 'chalc', 'chalcArt', 'whiteP', 'redP']) { await open(id); await writeAt(await S(id)); await report(); if (id === 'greenox') await shot('b-bench-salt', false); await toPage(); }
  await ending('B'); await shot('b-end');
  if (!/SLOW FIRE/.test(await text('#physname'))) say('  !! album B is not the slow fire');

  // ---- album C: the sky wind with living light
  await page.click('#again'); await page.waitForTimeout(400);
  await writeAt(1.0); await toPage();
  for (const [id, x] of [['lead', 0.5], ['whiteP', 1.3], ['thO', 0.9], ['pbJG', 3.4], ['gold', 0.6], ['chalc', 2.2], ['chalcArt', 0.4], ['nitrate', 0.3]]) { await open(id); await writeAt(x); await report(); if (id === 'lead') { await shot('c-bench-lead', false); await page.evaluate(() => document.querySelector('#benchres').scrollIntoView()); await shot('c-bench-scene', false); }; await toPage(); }
  await ending('C'); await shot('c-end');
  if (!/SKY WIND/.test(await text('#physname'))) say('  !! album C is not the sky wind');
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
