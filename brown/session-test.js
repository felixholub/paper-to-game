// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Week A: tap the gated label on day 1 (it only flashes), then the Sphinx, the oil drop (help opened mid-play), one speck, the skin
//         (shelf cleared on day 4), the coarse grind (clue found), and ENOUGH to an early verdict in five days. About.
// Week B: play again; the coarse grind first (clue found, shelf open), then matter only, to day 7; ENOUGH never offered.
// Week C: play again; the shelf cleared by day 4, then matter only to day 7 without the clue: the unfinished verdict.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'browns-restless-dust.html')); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const vis = async sel => page.$eval(sel, e => !e.classList.contains('hidden') && e.offsetParent !== null);
  const shelf = async () => page.$$eval('.sus', es => es.map(e => { const t = e.innerText.split('\n')[0]; return e.classList.contains('aside') ? `[${t} — set aside]` : e.classList.contains('found') ? `[${t} — FOUND]` : t; }).join(' | '));
  await shot('start'); await noScroll();
  const day = async (id, opts = {}) => {
    if (await page.$eval('#look', b => !b.disabled)) say('  !! LOOK enabled before a label was tapped');
    if (await page.$('.exp.chosen')) say('  !! a label is pre-chosen at the start of the day');
    const locked = await page.$$eval('.exp.locked', bs => bs.map(b => b.dataset.id));
    say(`\n== ${await text('#benchhead')}${locked.length ? '   (dimmed: ' + locked.join(', ') + ')' : ''}`);
    say('   shelf line: ' + await text('#shelfline'));
    if (opts.tryLocked) {
      await page.click('.exp[data-id="onespeck"]', { force: true }); await page.waitForTimeout(120);
      const flashing = await page.$eval('.exp[data-id="onespeck"]', b => b.classList.contains('flash')), lookOn = await page.$eval('#look', b => !b.disabled), chosen = await page.$('.exp.chosen');
      say(`   tapped the dimmed "One speck alone": gloss flashed=${flashing}, LOOK enabled=${lookOn}, chosen=${!!chosen}, line="${await text('#willdo')}"`);
      await shot('locked-flash');
      if (lookOn || chosen) say('  !! the locked label did more than flash');
    }
    await page.click(`.exp[data-id="${id}"]`); await page.waitForTimeout(150);
    say(`   tapped "${id}": ${await text('#willdo')}`);
    if (opts.help) { await page.click('#play .help-q'); await page.waitForTimeout(200); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(200); say(`   help opened and returned: on play=${await page.$eval('#play', e => e.classList.contains('on'))}, choice kept=${!!(await page.$('.exp.chosen'))}`); }
    await page.click('#look'); await page.waitForTimeout(1500);
    if (await vis('#afterwrap')) say('  !! NEXT shown before the look ended');
    await page.waitForTimeout(9000);
    if (!(await vis('#afterwrap'))) say('  !! NEXT not shown after the look');
    say('   ' + await text('#dayband') + ' · yard: ' + await text('#yard'));
    say('   shelf: ' + await shelf()); say('   shelf line: ' + await text('#shelfline'));
    const enough = await vis('#enough'); say(`   buttons: ${await text('#next')}${enough ? ' + ' + await text('#enough') : ''}`);
    if (opts.shot) await shot(opts.shot);
    await noScroll(); return enough;
  };
  const next = async () => { await page.click('#next'); await page.waitForTimeout(400); };
  // ---- week A
  await page.click('#begin'); await page.waitForTimeout(800); say('day 0 shelf: ' + await shelf()); await shot('a-day0');
  const A = [['sphinx', { tryLocked: true }], ['oil', { help: true }], ['onespeck', {}], ['surface', { shot: 'a-shelf-cleared' }], ['coarse', { shot: 'a-clue-found' }]];
  const enoughA = [];
  for (let i = 0; i < A.length; i++) { enoughA.push(await day(A[i][0], A[i][1])); if (i < A.length - 1) await next(); }
  if (enoughA.slice(0, 4).some(x => x)) say('  !! ENOUGH offered before both halves were done'); if (!enoughA[4]) say('  !! ENOUGH not offered after both halves');
  // the bench head after the shelf is cleared and before the clue: open day 5's bench in a scratch look by reading it on the way
  await page.click('#enough'); await page.waitForTimeout(400);
  say('\nEND A (early): ' + await text('#headline')); say('   ' + (await text('#verdictbody')).slice(0, 400));
  if (!/^In five days/.test(await text('#verdictbody'))) say('  !! verdict does not say five days');
  if (await text('#endband') !== 'AFTER FIVE DAYS') say('  !! end band does not say five days: ' + await text('#endband'));
  if (/days? (left|remain)|spare day|to spare/i.test(await text('#verdictbody'))) say('  !! verdict mentions days left');
  await shot('a-end'); await noScroll();
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(200); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  say('about returned to: ' + await page.$eval('.screen.on', e => e.id));
  // ---- week B
  await page.click('#again'); await page.waitForTimeout(600); say('\nplay again: shelf cleared=' + !(await page.$('.sus.aside')) + ', card blank=' + !(await page.$('.sus.found')));
  const B = ['coarse', 'herbarium', 'burn', 'glass', 'sugar', 'meteorite', 'soot']; let enoughB = false;
  for (let i = 0; i < B.length; i++) { enoughB = (await day(B[i], i === 0 ? { shot: 'b-clue-only' } : {})) || enoughB; if (i < B.length - 1) await next(); }
  if (enoughB) say('  !! ENOUGH offered in week B'); await next();
  say('\nEND B: ' + (await text('#verdictbody')).slice(0, 300)); await shot('b-end');
  // ---- week C
  await page.click('#again'); await page.waitForTimeout(600);
  const Cw = ['sphinx', 'oil', 'onespeck', 'surface', 'glass', 'meteorite', 'soot']; let enoughC = false;
  for (let i = 0; i < Cw.length; i++) { enoughC = (await day(Cw[i])) || enoughC; if (i === 3) { await next(); say('   (day 5 bench head: ' + await text('#benchhead') + ')'); await shot('c-day5-bench'); continue; } if (i < Cw.length - 1) await next(); }
  if (enoughC) say('  !! ENOUGH offered in week C'); await next();
  const vc = await text('#verdictbody'); say('\nEND C: ' + vc.slice(0, 600));
  if (!/You never found the one thing that does change the dance\. Brown did, grinding coarser/.test(vc)) say('  !! unfinished paragraph missing');
  if (/You never looked at/.test(vc)) say('  !! both missed-clue paragraphs shown');
  if (!/^In seven days/.test(vc)) say('  !! week C verdict does not say seven days');
  if (await text('#endband') !== 'AFTER SEVEN DAYS') say('  !! week C end band wrong');
  await shot('c-end');
  say('\nerrors: ' + (errors.length ? errors.join(' / ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n'); await browser.close();
})();
