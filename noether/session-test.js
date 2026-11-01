// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Shift A: the intended path. Floor: SHIFT ACROSS, WARP THE CLOCK (drawn; a jam), SHIFT THE CLOCK (help opened mid-world). Spring: TURN
//          (the Auditor's target). Glass: SHIFT THE CLOCK (void), WARP THE CLOCK (identity), SHIFT ACROSS. Sheet: WARP THE CLOCK. Verdict. About.
// Shift B: play again, one pull per world, no warps; the verdict that keeps the secret.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'noethers-press.html')); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const vis = async sel => page.$eval(sel, e => !e.classList.contains('hidden') && e.offsetParent !== null);
  const rack = async () => page.$$eval('.slot', es => es.map(e => `[${e.className.replace('slot', '').trim() || 'blank'}: ${e.innerText}]`).join(' '));
  await shot('start'); await noScroll();
  const draw = async () => { // a wobble across the strip
    const box = await page.$eval('#strip', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.move(box.x + 4, box.y + box.h / 2); await page.mouse.down();
    for (let i = 1; i <= 30; i++) { const t = i / 30; await page.mouse.move(box.x + 4 + t * (box.w - 8), box.y + box.h / 2 - Math.sin(t * 6.283) * box.h * 0.35); }
    await page.mouse.up();
  };
  const pull = async (id, opts = {}) => {
    if (await page.$eval('#pull', b => !b.disabled)) say('  !! PULL enabled before a lever was tapped');
    if (await page.$('.lever.chosen')) say('  !! a lever is pre-chosen');
    await page.click(`.lever[data-id="${id}"]`); await page.waitForTimeout(150);
    say(`   tapped "${id}": ${await text('#willdo')}`);
    if (opts.help) { await page.click('#play .help-q'); await page.waitForTimeout(200); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(200); say(`   help opened and returned: on play=${await page.$eval('#play', e => e.classList.contains('on'))}, choice kept=${!!(await page.$('.lever.chosen'))}`); }
    await page.click('#pull'); await page.waitForTimeout(300);
    const free = await page.$eval(`.lever[data-id="${id}"]`, e => e.classList.contains('free'));
    if (free) { if (!(await page.$eval('#overlay', e => e.classList.contains('on')))) say('  !! strip did not open'); if (await page.$eval('#strippull', b => !b.disabled)) say('  !! strip PULL enabled before drawing'); await draw(); await page.waitForTimeout(100); if (opts.shotStrip) await shot(opts.shotStrip, false); await page.click('#strippull'); }
    await page.waitForTimeout(1200); if (opts.shotMid) await shot(opts.shotMid, false);
    for (let k = 0; k < 40 && !(await vis('#after')); k++) await page.waitForTimeout(500);
    if (!(await vis('#after'))) say('  !! NEXT not shown after the pull');
    say('   stamp: ' + await text('#stamp') + ' · feed: ' + await text('#feed'));
    say('   rack: ' + await rack());
    say('   auditor: ' + await text('#say'));
    say(`   buttons: ${await vis('#again') ? await text('#again') + ' + ' : ''}${await text('#next')}`);
    if (opts.shot) await shot(opts.shot);
    await noScroll();
  };
  const again = async () => { await page.click('#again'); await page.waitForTimeout(300); };
  const next = async () => { await page.click('#next'); await page.waitForTimeout(900); say(`\n== ${await text('#band')} · ${await text('#worldline')}`); if (await vis('#first')) say('   ' + await text('#first')); };
  // ---- shift A
  await page.click('#begin'); await page.waitForTimeout(900); say(`== ${await text('#band')} · ${await text('#worldline')}`); await shot('a-floor');
  await pull('across', { shotMid: 'a-floor-feeding', shot: 'a-floor-across' }); await again();
  await pull('warpclock', { shotStrip: 'a-strip', shot: 'a-floor-jam' }); await again();
  await pull('clock', { help: true, shot: 'a-floor-clock' });
  if (await vis('#again')) say('  !! PULL AGAIN offered with no blanks');
  await next(); await shot('a-spring-first');
  await pull('turn', { shot: 'a-spring-turn' });
  await next(); await shot('a-glass');
  await pull('clock', { shotMid: 'a-glass-feeding', shot: 'a-glass-void' }); await again();
  await pull('warpclock', { shot: 'a-glass-identity' }); await again();
  await pull('across', { shot: 'a-glass-across' });
  await next(); await shot('a-sheet-first');
  await pull('warpclock', { shot: 'a-sheet-answer' });
  await page.click('#next'); await page.waitForTimeout(500); say('\nVERDICT: ' + await text('#headline')); say('  ' + await text('#did')); await shot('a-end'); await noScroll();
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  // ---- shift B
  say('\n==== SHIFT B'); await page.click('#replay'); await page.waitForTimeout(900);
  for (const id of ['clock', 'clock', 'across', 'turn']) { say(`== ${await text('#band')}`); await pull(id); await page.click('#next'); await page.waitForTimeout(900); }
  say('\nVERDICT B: ' + await text('#headline')); say('  ' + await text('#did')); await shot('b-end');
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n'); await browser.close();
})();
