// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Game A (deck 1): a first-time player who learns: one page to the first accident, two pages to the first clash started on
//   purpose (which turns out hostile), then reads the origin and the crowd. How to play opened mid-clash. About from the end.
// Game B (a new deck from PLAY AGAIN): holds the line everywhere; expect no deals and the crowd taking pages.
// Game C (deck 1 again, by its number): a gambler who pays two pages at once to every clash started on purpose.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const file = 'file://' + path.join(__dirname, 'who-started-it.html');
  await page.goto(file + '#deck=1'); await page.waitForTimeout(500);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll on ${where}: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const on = async () => page.$eval('.screen.on', e => e.id);
  const idle = () => page.waitForFunction(() => !window.__clash.busy && (!document.querySelector('#cont').classList.contains('hidden') || !document.querySelector('#offerbox').classList.contains('hidden')), null, { timeout: 15000 });
  const view = () => page.evaluate(() => { const g = window.__clash.g; const v = CLASH.current(g); return v && { n: v.n, origin: v.origin, round: v.round, crowd: v.crowd, given: v.given, pages: v.pages, max: v.maxOffer, you: v.you.name, them: v.them.name }; });
  const offer = async n => {
    const sel0 = await page.$eval('#pick button.on', b => +b.dataset.n); if (sel0 !== 0) say('  !! offer did not start at 0');
    if (n) await page.click(`#pick button[data-n="${n}"]`); await page.waitForTimeout(150); await page.click('#offer'); await idle(); await page.waitForTimeout(200);
  };
  const cont = async () => { await page.click('#cont'); await page.waitForTimeout(150); await idle(); };
  const marks = async () => page.$$eval('#marks .mark', ms => ms.map(m => (m.classList.contains('deal') ? '■' : m.classList.contains('torn') ? '×' : m.classList.contains('cur') ? '▫' : '·')).join(''));
  async function playGame(tag, strat, shots) {
    let k = 0;
    while (await on() === 'play') {
      await idle(); let v = await view(); if (!v) break;
      say(`\n${tag} CLASH ${v.n} [${await marks()}] pages ${v.pages}: ${v.you} vs ${v.them} (${v.origin})`);
      await page.waitForTimeout(300);
      if (shots && shots.intro && shots.intro(v)) await shot(`${tag}-clash${v.n}-intro`, false);
      const n1 = Math.min(strat(v), v.max);
      if (shots && shots.pre && shots.pre(v)) { if (n1) await page.click(`#pick button[data-n="${n1}"]`); await page.waitForTimeout(300); await shot(`${tag}-clash${v.n}-preview`, false); await page.click('#pick button[data-n="0"]'); }
      await offer(n1); say(`   offer ${n1}: ${await text('#reslines')}`);
      if (shots && shots.after1 && shots.after1(v)) await shot(`${tag}-clash${v.n}-after1`, false);
      const label = await text('#cont');
      if (/last word/.test(label)) {
        if (shots && shots.help && shots.help(v)) { await page.click('#play .q'); await page.waitForTimeout(300); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(300); say('   help returned to: ' + await on()); }
        await cont(); v = await view(); const n2 = Math.min(strat(v), v.max);
        if (shots && shots.round2 && shots.round2(v)) await shot(`${tag}-clash${v.n}-lastword`, false);
        await offer(n2); say(`   last word ${n2}: ${(await text('#reslines')).slice(-400)}`);
      }
      if (shots && shots.end && shots.end(v)) await shot(`${tag}-clash${v.n}-end`, false);
      await noScroll('play'); k++;
      await page.click('#cont'); await page.waitForTimeout(400);
    }
    say(`\n${tag} END: ${await text('#headline')}`); say('   ' + await text('#did')); await noScroll('end');
  }

  // ---- game A: the learner
  await shot('start'); await noScroll('start'); say('START aim: ' + await text('#aimStart'));
  if (!/deck 1/.test(await text('#decklab'))) say('  !! deck number not shown');
  let seenPurpose = 0;
  const learner = v => {
    if (v.round === 1) { if (v.origin !== 'purpose') return 1; seenPurpose++; return seenPurpose === 1 ? 2 : 0; }
    if (v.origin !== 'purpose') return Math.min(v.max, 1);
    return v.crowd === 'them' ? Math.min(v.max, Math.max(0, 2 - v.given)) : 0;
  };
  await page.click('#begin'); await page.waitForTimeout(300);
  await playGame('a', learner, {
    intro: v => v.n <= 3 || v.origin === 'messy', pre: v => v.n === 1, after1: v => v.n === 2 || v.n === 3 || v.origin === 'messy',
    help: v => v.n === 2, round2: v => v.n === 3, end: v => v.n <= 3 || v.origin === 'messy',
  });
  await shot('a-end');
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await noScroll('about');
  await page.click('#aboutback'); await page.waitForTimeout(300); say('about returned to: ' + await on());

  // ---- game B: hold everything
  await page.click('#again'); await page.waitForTimeout(300);
  await playGame('b', () => 0, { after1: v => v.origin === 'purpose' && v.n <= 4 });
  await shot('b-end');

  // ---- game C: the gambler, on deck 1 again by its number
  await page.goto(file + '#deck=1'); await page.waitForTimeout(400);
  if (!/deck 1\b/.test(await text('#decklab'))) say('  !! deck 1 not replayable by number');
  await page.click('#begin'); await page.waitForTimeout(300);
  await playGame('c', v => (v.round === 1 ? (v.origin === 'accident' ? 1 : 2) : (v.origin === 'messy' ? 1 : 0)), {});
  await shot('c-end');
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
