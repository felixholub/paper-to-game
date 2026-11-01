// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Shift A: the intended path. Free dot: the opening draw (a bulge, then the straight line), then MOVE RIGHT (prize, tested with a drawn path),
//          RE-TICK THE CLOCK (drawn; the formula cares), CLOCK LATER (help opened mid-formula). Spring: TURN (the Auditor's prize).
//          Glass: CLOCK LATER (empty), RE-TICK THE CLOCK (a rule), MOVE RIGHT (a prize). Sheet: RE-TICK THE CLOCK (the answer). Verdict. About.
// Shift B: play again, the opening draw once, one pull per formula, no free levers; the verdict that keeps the secret.
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
  const untilVisible = async (sel, secs) => { for (let k = 0; k < secs * 2 && !(await vis(sel)); k++) await page.waitForTimeout(500); if (!(await vis(sel))) say(`  !! ${sel} never appeared`); };
  const drawInWindow = async shape => { // a stroke across the window: 'bulge' (A to B with a detour), 'line' (A to B straight), 'wild' (a loop anywhere)
    await page.$eval('#window', e => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
    const box = await page.$eval('#window', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const pts = [];
    if (shape === 'bulge') for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([box.x + box.w * (0.23 + 0.6 * t), box.y + box.h * (0.5 - 0.3 * Math.sin(Math.PI * t))]); }
    if (shape === 'line') for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([box.x + box.w * (0.23 + 0.6 * t), box.y + box.h * 0.5]); }
    if (shape === 'wild') for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([box.x + box.w * (0.3 + 0.4 * t), box.y + box.h * (0.45 + 0.3 * Math.sin(3 * Math.PI * t))]); }
    await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down(); for (const p of pts.slice(1)) await page.mouse.move(p[0], p[1]); await page.mouse.up();
  };
  const drawStrip = async () => { // a wobble across the strip
    const box = await page.$eval('#strip', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.move(box.x + 4, box.y + box.h / 2); await page.mouse.down();
    for (let i = 1; i <= 30; i++) { const t = i / 30; await page.mouse.move(box.x + 4 + t * (box.w - 8), box.y + box.h / 2 - Math.sin(t * 6.283) * box.h * 0.35); }
    await page.mouse.up();
  };
  const pull = async (id, opts = {}) => {
    if (await page.$eval('#pull', b => !b.disabled)) say('  !! PULL enabled before a lever was tapped');
    if (await page.$('.lever.chosen')) say('  !! a lever is pre-chosen');
    await page.click(`.lever[data-id="${id}"]`); await page.waitForTimeout(250);
    say(`   tapped "${id}": ${await text('#willdo')}`); say('   plate: ' + await text('#nums'));
    if (opts.shotTap) await shot(opts.shotTap);
    if (opts.help) { await page.click('#play .help-q'); await page.waitForTimeout(200); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(200); say(`   help opened and returned: on play=${await page.$eval('#play', e => e.classList.contains('on'))}, choice kept=${!!(await page.$('.lever.chosen'))}`); }
    await page.click('#pull'); await page.waitForTimeout(300);
    const free = await page.$eval(`.lever[data-id="${id}"]`, e => e.classList.contains('free'));
    if (free) { if (!(await page.$eval('#overlay', e => e.classList.contains('on')))) say('  !! strip did not open'); if (await page.$eval('#strippull', b => !b.disabled)) say('  !! strip PULL enabled before drawing'); await drawStrip(); await page.waitForTimeout(100); if (opts.shotStrip) await shot(opts.shotStrip, false); await page.click('#strippull'); }
    // either the test (draw a path) or straight to the result
    for (let k = 0; k < 40 && !(await vis('#after')) && !(await vis('#test')); k++) await page.waitForTimeout(500);
    if (await vis('#test')) {
      say('   test: ' + await text('#testask')); if (opts.shotTest) await shot(opts.shotTest);
      await drawInWindow('wild'); await untilVisible('#testdone', 8);
      say('   after a drawn path: ' + await text('#feed')); if (opts.shotDrawn) await shot(opts.shotDrawn);
      await page.click('#testdone'); await untilVisible('#after', 15);
    }
    if (!(await vis('#after'))) say('  !! NEXT not shown after the pull');
    say('   stamp: ' + await text('#stamp') + ' · feed: ' + await text('#feed'));
    say('   rack: ' + await rack());
    say('   result: ' + await text('#result')); say('   auditor: ' + await text('#say'));
    say(`   buttons: ${await vis('#again') ? await text('#again') + ' + ' : ''}${await text('#next')}`);
    if (opts.shot) await shot(opts.shot);
    await noScroll();
  };
  const again = async () => { await page.click('#again'); await page.waitForTimeout(300); };
  const next = async (shape, shotName) => { await page.click('#next'); await page.waitForTimeout(900); say(''); await opening([shape || 'bulge'], shotName); say('   plate: ' + await text('#plate')); if (await vis('#first')) say('   ' + await text('#first')); };
  const opening = async (shapes, shotName) => {
    say(`== ${await text('#band')} · ${await text('#worldline')}`); say('   ' + await text('#openask')); if (shotName) await shot(shotName);
    if (await page.$eval('#choose', e => !e.classList.contains('hidden'))) say('  !! the levers are shown before the opening draw');
    if (await page.$eval('#window', e => e.querySelectorAll('g')[4].children.length > 0)) say('  !! a trail is drawn before the guess');
    for (let i = 0; i < shapes.length; i++) {
      await drawInWindow(shapes[i]); await untilVisible('#openon', 10); say('   drew ' + shapes[i] + ': ' + await text('#openask')); say('   plate: ' + await text('#nums'));
      if (shotName && i === 0) await shot(shotName + '-drawn');
      if (i < shapes.length - 1) { if (!(await vis('#drawagain'))) say('  !! Draw another not offered'); await page.click('#drawagain'); await page.waitForTimeout(300); }
    }
    await page.click('#openon'); await page.waitForTimeout(400); say('   on to the changes: ' + await text('#benchhead'));
  };
  await shot('start'); await noScroll();
  // ---- shift A
  await page.click('#begin'); await page.waitForTimeout(900);
  await opening(['bulge', 'line'], 'a-opening'); await shot('a-floor');
  await pull('across', { shotTap: 'a-floor-tap', shotTest: 'a-floor-test', shotDrawn: 'a-floor-drawn', shot: 'a-floor-across' }); await again();
  await pull('warpclock', { shotStrip: 'a-strip', shot: 'a-floor-cares' }); await again();
  await pull('clock', { help: true, shot: 'a-floor-clock' });
  if (await vis('#again')) say('  !! PULL AGAIN offered with no blanks');
  await next('bulge', 'a-spring-opening'); await shot('a-spring-first');
  await pull('turn', { shot: 'a-spring-turn' });
  await next('line', 'a-glass-opening'); await shot('a-glass');
  await pull('clock', { shotTap: 'a-glass-tap', shotDrawn: 'a-glass-drawn', shot: 'a-glass-empty' }); await again();
  await pull('warpclock', { shot: 'a-glass-rule' }); await again();
  await pull('across', { shot: 'a-glass-across' });
  await next('bulge', 'a-sheet-opening'); await shot('a-sheet-first');
  await pull('warpclock', { shot: 'a-sheet-answer' });
  await page.click('#next'); await page.waitForTimeout(500); say('\nVERDICT: ' + await text('#headline')); say('  ' + await text('#did')); await shot('a-end'); await noScroll();
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  // ---- shift B
  say('\n==== SHIFT B'); await page.click('#replay'); await page.waitForTimeout(900);
  await opening(['line'], null);
  for (const id of ['clock', 'clock', 'across', 'turn']) { say(`== ${await text('#band')}`); await pull(id); await page.click('#next'); await page.waitForTimeout(900); if (await vis('#opening')) await opening(['line'], null); }
  say('\nVERDICT B: ' + await text('#headline')); say('  ' + await text('#did')); await shot('b-end');
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n'); await browser.close();
})();
