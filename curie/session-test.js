// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Album A: uranium measured with a real mouse drag and How to play opened mid-measurement; then the paper's path, with the black
//          rock first written down in a hurry (at the push its label suggests, spot still running), then measured again
//          carefully; the two chalcolites. Expect all six of her claims backed. The last page; About.
// Album B: start a new album; write everything down at once on jars that read zero: expect none of her claims backed.
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
  const bench = () => page.evaluate(() => { const b = window.__curie.bench; return { s: b.s, t: b.t, r: b.r, hold: b.hold, committed: !!b.committed }; });
  const writeDisabled = () => page.$eval('#write', e => e.disabled);
  // careful: follows the spot, ten corrections a second, and writes it down once it has stood a second and a half
  const careful = async (start) => {
    await setPush(start); let r = start; const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      const b = await bench();
      if (b.hold >= 1.5 && !(await writeDisabled())) break;
      r = Math.max(0, Math.min(4, r + (b.s > 0.5 ? 0.25 : b.s < -0.5 ? -0.25 : 0.55 * b.s))); await setPush(r); await page.waitForTimeout(100);
    }
    await page.click('#write'); await page.waitForTimeout(400);
  };
  // hasty: sets the slider where the label suggests and writes it down as soon as the button wakes
  const hasty = async (push) => { await setPush(push); await page.waitForFunction(() => !document.querySelector('#write').disabled); await page.click('#write'); await page.waitForTimeout(400); };
  const result = async () => `${await text('#resbadge')} — ${await text('#rescap')}`;
  const toPage = async () => { await page.click('#topage'); await page.waitForTimeout(800); };
  const test = async (id, again) => {
    await page.click(`.jar[data-id="${id}"]`); await page.waitForTimeout(250);
    const btn = await text('#cardtest'); if (again && !/again/i.test(btn)) say(`  !! card for a jar already tested says "${btn}"`);
    await page.click('#cardtest'); await page.waitForTimeout(300);
    if (await page.$eval('#push', e => +e.value) !== 0) say('  !! slider carried over from the last bench');
    if (!(await writeDisabled())) say('  !! WRITE IT DOWN awake before the spot could be seen');
  };

  await shot('start'); await noScroll();
  say('START: ' + await text('.aimbox') + ' | ' + await text('.acts'));
  await page.click('#begin'); await page.waitForTimeout(500);
  say(`\n== ${await text('#benchband')}`);
  const cap = await text('#benchcap'); say('   bench says: ' + cap);
  if (/\b0\b|zero|middle|still/i.test(cap)) say('  !! the bench text hints at the method: ' + cap);
  await shot('a-bench-uranium-start', false);
  // a real drag on the slider
  const box = await page.$eval('#push', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.move(box.x + 19, box.y + box.h / 2); await page.mouse.down();
  for (let k = 1; k <= 12; k++) { await page.mouse.move(box.x + 19 + k * 7, box.y + box.h / 2); await page.waitForTimeout(60); }
  await page.mouse.up(); await page.waitForTimeout(400);
  const d = await bench(); say(`   real drag: push seen by the mechanism ${d.r.toFixed(2)}, spot ${d.s.toFixed(2)}`); if (d.r < 0.3) say('  !! the drag did not move the push');
  // the stall that was: leave the slider somewhere wrong and wait; the button must be awake and nothing must end by itself
  await page.waitForTimeout(2500); const st = await bench();
  say(`   left alone 2.5 s at push ${st.r.toFixed(2)}: write button ${await writeDisabled() ? 'ASLEEP' : 'awake'}, measurement ${st.committed ? 'ENDED BY ITSELF' : 'still open'}`);
  if (await writeDisabled() || st.committed) say('  !! the bench stalls or ends by itself');
  await page.click('#bench .help-q'); await page.waitForTimeout(300); await shot('help');
  const t1 = (await bench()).t; await page.waitForTimeout(700); const t2 = (await bench()).t;
  say(`   help opened mid-measurement: bench clock ${t1.toFixed(2)} → ${t2.toFixed(2)} while away`);
  await page.click('#helpback'); await page.waitForTimeout(300);
  await careful(d.r); say('   ' + await result()); await shot('a-bench-uranium-written', false);
  await toPage(); await shot('a-shelf-1'); await noScroll();
  const plan = [['nitrate', 'careful'], ['thOthick', 'careful'], ['whiteP', 'careful'], ['redP', 'careful'], ['pbJG', 'hasty'], ['pbJG', 'careful', true], ['chalc', 'careful'], ['chalcArt', 'careful']];
  for (const [id, how, again] of plan) {
    await test(id, again);
    say(`\n== ${await text('#benchband')} (${how}${again ? ', again' : ''})`);
    if (id === 'pbJG' && !again) { await setPush(0.65); await page.waitForTimeout(1200); await shot('a-bench-pitchblende-hasty-running', false); }
    if (how === 'hasty') await hasty(0.65); else await careful(0);
    say('   ' + await result());
    if (id === 'pbJG') await shot(again ? 'a-bench-pitchblende-careful' : 'a-bench-pitchblende-hasty', false);
    if (id === 'chalcArt') await shot('a-bench-copy', false);
    await toPage(); say('   ' + await text('#foundline'));
    if (id === 'pbJG' && !again) { await shot('a-shelf-after-hasty'); }
    await noScroll();
  }
  await shot('a-page-full');
  await page.click('#turn'); await page.waitForTimeout(500);
  say('\nEND A: ' + await text('#headline') + ' | ' + await text('#fate'));
  say('   claims: ' + await text('#claims'));
  if (!/all six/.test(await text('#headline'))) say('  !! album A does not back all six claims');
  await shot('a-end'); await shot('a-end-top', false); await noScroll();
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(300);
  say('about returned to: ' + await on());
  // ---- album B: dull jars, written down at once
  await page.click('#again'); await page.waitForTimeout(500);
  await hasty(0); await toPage();
  for (const id of ['lead', 'gold', 'copper', 'redP', 'phosphate', 'lead', 'gold', 'copper']) { await test(id); await hasty(0); say(`   ${id}: ${await text('#resbadge')}`); await toPage(); }
  await page.click('#turn'); await page.waitForTimeout(500);
  say('\nEND B: ' + await text('#headline') + ' | ' + await text('#fate')); say('   claims: ' + (await text('#claims')).slice(0, 400));
  if (!/none of/.test(await text('#headline'))) say('  !! album B backs a claim');
  await shot('b-end-top', false);
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
