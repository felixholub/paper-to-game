// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Game A: a player who chooses as Foot does (flips at the brew and the cave; names the difference she names, then a wrong one).
// Game B: a player who does everything the bad man asks (no flips, no questions). Game C: a player who refuses from the trigger
// on and refuses the cave (flips at the bargain and... never comes back), naming "the numbers" each time. Then the epilogue.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'); const FOOT = require('./mechanism.js');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ['--no-sandbox'] } : {});
  const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|goatcounter|gc\.zgo/i.test(m.text())) errors.push(m.text()); });
  const file = 'file://' + path.join(__dirname, 'foots-bad-man.html');
  await page.goto(file); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll on ${where}: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const on = async () => page.$eval('.screen.on', e => e.id);
  const idle = () => page.waitForFunction(() => !window.__foot.busy, null, { timeout: 30000 });
  async function playGame(tag, policy, diffPolicy, shots) {
    shots = shots || {};
    while (await on() === 'play') {
      await idle();
      const v = await page.evaluate(() => { const c = FOOT.current(window.__foot.g); return { id: c.id, step: c.step, deed: c.deed }; });
      say(`\n${tag} SCENE ${v.step}: ${v.deed} (${v.id})`); say(`  ${await text('#stepcard')}`); say(`  A: ${await text('#optA')} | B: ${await text('#optB')}`);
      if (shots.scene && shots.scene(v)) await shot(`${tag}-scene${v.step}`);
      const opt = policy(v.id); await page.click(opt === 'A' ? '#optA' : '#optB'); say(`  → ${opt}`);
      await idle(); await page.waitForTimeout(200);
      if (await page.evaluate(() => window.__foot.waiting === 'diff')) {
        say(`  asked: ${await text('#cpair')}`);
        if (shots.diff && shots.diff(v)) await shot(`${tag}-scene${v.step}-diff`);
        const d = diffPolicy(v.id); await page.click(`#cshelf button[data-d="${d}"]`); say(`  named: ${d}`);
        await idle(); await page.waitForTimeout(200);
      }
      say(`  CARD: ${await text('#card')}`); say(`  ${await text('#cbad')}`);
      if (shots.card && shots.card(v)) await shot(`${tag}-scene${v.step}-card`);
      if (shots.film && shots.film(v)) { await page.locator('#stagebox').screenshot({ path: path.join(__dirname, `screenshot-${tag}-film-${v.id}.png`) }); say('  shot film ' + v.id); }
      await noScroll('play');
      say(`  next: ${await text('#next')}`);
      await page.click('#next'); await idle(); await page.waitForTimeout(250);
    }
    say(`\n${tag} END: ${await text('#shape')}`); say('   ' + await text('#vscore')); say('   ' + await text('#vtrap')); say('   ' + await text('#vpaper')); say('   ' + await text('#vtrolley')); await noScroll('end');
  }
  async function playCoda(tag, policy, shots) {
    await page.click('#toCoda'); await page.waitForTimeout(400); say(`\n${tag} EPILOGUE on: ${await on()}`);
    for (let i = 0; i < 3; i++) {
      say(`  ${await text('#creel')}: ${await text('#ctext')}`); say(`    A: ${await text('#cA')} | B: ${await text('#cB')}`);
      if (shots && i === 0) await shot(`${tag}-coda-case1`);
      const opt = policy(i); await page.click(opt === 'A' ? '#cA' : '#cB'); await idle(); await page.waitForTimeout(200);
      say(`    → ${opt}: ${await text('#cres .house')}`);
      if (shots && i === 2) { say(`      ${await text('#cclose')}`); await shot(`${tag}-coda-case3`); }
      await noScroll('coda');
      await page.click('#cnext'); await page.waitForTimeout(300);
    }
    await idle(); await page.waitForTimeout(300);
    say(`  FIN on: ${await on()}: ${await text('#fincard')}`); if (shots) await shot(`${tag}-fin`);
    await noScroll('fin');
  }
  // ---- game A: as Foot does
  await shot('start'); await noScroll('start'); say('START: ' + await text('#aimStart'));
  await page.click('#begin'); await page.waitForTimeout(400);
  await playGame('a', id => FOOT.choose('foot', id), id => id === 'brew' ? 'harm' : id === 'cave' ? 'aimed' : 'none',
    { scene: v => v.step === 1 || v.step === 3, diff: v => v.step === 3, card: v => v.step === 3 || v.step === 7, film: v => v.step === 6 || v.step === 7 });
  await shot('a-end');
  await playCoda('a', i => 'A', true);
  await page.click('#fin [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await noScroll('about');
  await page.click('#aboutback'); await page.waitForTimeout(300); say('about returned to: ' + await on());
  await page.click('#fagain'); await page.waitForTimeout(400); say('play again from the end: ' + await on());
  // ---- game B: does everything
  await playGame('b', () => 'A', () => 'numbers', { card: v => v.step === 5 });
  await shot('b-end');
  await page.click('#play .q').catch(() => {});
  // ---- game C: refuses from the trigger on, and the cave too; blames the numbers
  await page.goto(file); await page.waitForTimeout(400); await page.click('#begin'); await page.waitForTimeout(300);
  await page.click('#play .q'); await page.waitForTimeout(300); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(300); say('help returned to: ' + await on());
  await playGame('c', id => ['bargain', 'torture', 'cave'].includes(id) ? 'B' : 'A', () => 'numbers', { card: v => v.step === 5, diff: v => v.step === 5 });
  await shot('c-end');
  await page.click('#again'); await page.waitForTimeout(300); say('play again from the end: ' + await on());
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
