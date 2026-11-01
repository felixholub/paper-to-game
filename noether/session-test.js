// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Shift A: the opener (a straight slide, then a dip), then all nine cards, wrong on the magnet and the re-ticked slide on purpose,
//          help opened mid-card, two drawn paths on the empty prize, the end, About.
// Shift B: play again, every card answered "it matters"; the end.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'noethers-ball.html')); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const vis = async sel => page.$eval(sel, e => !e.classList.contains('hidden') && e.offsetParent !== null);
  const until = async (sel, secs) => { for (let k = 0; k < secs * 4 && !(await vis(sel)); k++) await page.waitForTimeout(250); if (!(await vis(sel))) say(`  !! ${sel} never appeared`); };
  const draw = async shape => {
    await page.$eval('#window', e => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
    const b = await page.$eval('#window', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const A = await page.evaluate(() => { const c = document.querySelectorAll('#window circle'); return null; });
    const pts = []; // in window fractions; A sits near (0.23, 0.09), B near (0.81, 0.29) on the slide
    if (shape === 'straight') for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([0.23 + 0.58 * t, 0.09 + 0.2 * t]); }
    if (shape === 'dip') for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([0.23 + 0.58 * t, 0.09 + 0.2 * t + 0.28 * Math.sin(Math.PI * t)]); }
    if (shape === 'wild') for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([0.15 + 0.7 * t, 0.55 + 0.3 * Math.sin(3 * Math.PI * t)]); }
    await page.mouse.move(b.x + pts[0][0] * b.w, b.y + pts[0][1] * b.h); await page.mouse.down(); for (const p of pts.slice(1)) await page.mouse.move(b.x + p[0] * b.w, b.y + p[1] * b.h); await page.mouse.up();
  };
  const card = async (answer, opts = {}) => {
    await until('#question', 6);
    say(`\n== ${await text('#band')}`); say('   ' + await text('#setup')); say('   change: ' + await text('#change')); say('   formula: ' + await text('#formula'));
    if (opts.shotQ) await shot(opts.shotQ);
    if (opts.help) { await page.click('#play .help-q'); await page.waitForTimeout(200); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(200); say(`   help opened and returned: question still shown=${await vis('#question')}`); }
    if (await vis('#window2')) say('  !! the second picture shows before the answer');
    await page.click(answer === 'matters' ? '#saymatters' : '#saynot');
    if (opts.shotMid) { await page.waitForTimeout(1400); await shot(opts.shotMid); }
    await until('#next', 20);
    if (!(await vis('#window2'))) say('  !! the second picture did not appear');
    say(`   said "${answer}": ${await text('#verdictline')} ${await text('#badgenote')}`); say('   plate: ' + await text('#nums')); say('   reveal: ' + await text('#reveal')); const pn = await text('#prizenote'); if (pn) say('   prize: ' + pn);
    if (opts.wobble) { await until('#drawrow', 10); await page.click('#drawtry'); await page.waitForTimeout(300); await draw('wild'); await until('#drawrow', 10); say('   wobble: ' + await text('#prizenote')); if (opts.shotWobble) await shot(opts.shotWobble); }
    if (opts.drawTwice) { for (let k = 0; k < 2; k++) { await page.click('#drawtry'); await page.waitForTimeout(300); await draw('wild'); await until('#drawrow', 10); say('   after a drawn path: ' + await text('#prizenote')); if (k === 1 && opts.shotDrawn) await shot(opts.shotDrawn); } }
    say('   shelf: ' + await text('#tiles'));
    if (opts.shot) await shot(opts.shot);
    await noScroll(); await page.click('#next'); await page.waitForTimeout(500);
  };
  await shot('start'); await noScroll();
  // ---- shift A
  await page.click('#begin'); await page.waitForTimeout(800);
  say('== ' + await text('#band')); say('   ' + await text('#setup')); say('   ' + await text('#openask')); await shot('a-opener');
  if (await vis('#question')) say('  !! the question is shown before the opener');
  await draw('straight'); await until('#openon', 12); say('   drew straight: ' + await text('#openask')); say('   plate: ' + await text('#nums')); await shot('a-opener-drawn');
  await page.click('#drawagain'); await page.waitForTimeout(300); await draw('dip'); await until('#openon', 12); say('   drew a dip: ' + await text('#openask')); say('   plate: ' + await text('#nums'));
  await page.click('#openon'); await page.waitForTimeout(500);
  await card('not', { shotQ: 'a-c1-question', shotMid: 'a-c1-both', wobble: true, shotWobble: 'a-c1-wobble', shot: 'a-c1-answer' });
  await card('matters', { shot: 'a-c2-answer' });
  await card('not', { help: true, shotMid: 'a-c3-both', shot: 'a-c3-answer' });
  await card('not', { shot: 'a-c4-answer' });
  await card('not', { shotQ: 'a-c5-question', shotMid: 'a-c5-both', shot: 'a-c5-answer' });
  await card('matters', { shot: 'a-c6-answer' });
  await card('matters', { shotQ: 'a-c7-question', shotMid: 'a-c7-both', shot: 'a-c7-answer' });
  await card('not', { shotQ: 'a-c8-question', drawTwice: true, shotDrawn: 'a-c8-drawn', shot: 'a-c8-answer' });
  await card('matters', { shot: 'a-c9-answer' });
  await page.waitForTimeout(400); say('\nEND: ' + await text('#headline')); say('   ' + await text('#endline')); say('   shelf: ' + await text('#endtiles')); await shot('a-end'); await noScroll();
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  // ---- shift B
  say('\n==== SHIFT B'); await page.click('#replay'); await page.waitForTimeout(800);
  await draw('straight'); await until('#openon', 12); await page.click('#openon'); await page.waitForTimeout(500);
  for (let k = 0; k < 9; k++) { await until('#question', 6); await page.click('#saymatters'); await until('#next', 20); await page.click('#next'); await page.waitForTimeout(400); }
  say('END B: ' + await text('#headline')); say('   ' + await text('#endline')); say('   shelf: ' + await text('#endtiles')); await shot('b-end');
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n'); await browser.close();
})();
