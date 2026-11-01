// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Shift A: all nine cards, wrong on the magnet (says it doesn't matter) and on the re-ticked slide (says it matters), help opened
//          mid-card, the end, About. Shift B: play again, every card answered "it matters"; the end.
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
  const card = async (answer, opts = {}) => {
    await until('#question', 8);
    say(`\n== ${await text('#band')}`); say('   ' + await text('#setup')); say('   change: ' + await text('#change')); say('   formula: ' + await text('#formula'));
    if (await vis('#window2')) say('  !! the second picture shows before the answer');
    if (await vis('#graph')) say('  !! a graph shows before the answer');
    if (opts.shotQ) { await page.waitForTimeout(1500); await shot(opts.shotQ); }
    if (opts.help) { await page.click('#play .help-q'); await page.waitForTimeout(200); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(200); say(`   help opened and returned: question still shown=${await vis('#question')}`); }
    await page.click('#window'); await page.waitForTimeout(300); // watch again
    await page.click(answer === 'matters' ? '#saymatters' : '#saynot');
    await page.waitForTimeout(400); if (!(await vis('#window2'))) say('  !! the second picture did not appear');
    if (opts.shotMid) { await page.waitForTimeout(1100); await shot(opts.shotMid); }
    await until('#next', 25);
    say(`   said "${answer}": ${await text('#verdictline')} ${await text('#badgenote')}`);
    say('   reveal: ' + await text('#reveal'));
    say('   why: ' + await text('#why')); say('   numbers: ' + await text('#nums'));
    const pn = await text('#prizenote'); if (pn) say('   prize: ' + pn);
    say('   shelf: ' + await text('#tiles'));
    if (opts.shot) await shot(opts.shot);
    await noScroll(); await page.click('#next'); await page.waitForTimeout(500);
  };
  await shot('start'); await noScroll();
  // ---- shift A
  await page.click('#begin'); await page.waitForTimeout(800);
  await card('not', { shotQ: 'a-c1-question', shotMid: 'a-c1-both', shot: 'a-c1-answer' });
  await card('matters', { shot: 'a-c2-answer' });
  await card('not', { help: true, shot: 'a-c3-answer' });
  await card('not', { shot: 'a-c4-answer' });
  await card('not', { shotQ: 'a-c5-question', shot: 'a-c5-answer' });
  await card('matters', { shot: 'a-c6-answer' });
  await card('matters', { shotQ: 'a-c7-question', shot: 'a-c7-answer' });
  await card('not', { shotQ: 'a-c8-question', shot: 'a-c8-answer' });
  await card('matters', { shot: 'a-c9-answer' });
  await page.waitForTimeout(400); say('\nEND: ' + await text('#headline')); say('   ' + await text('#endline')); say('   shelf: ' + await text('#endtiles')); await shot('a-end'); await noScroll();
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  // ---- shift B
  say('\n==== SHIFT B'); await page.click('#replay'); await page.waitForTimeout(800);
  if ((await text('#tiles')).replace(/[?| ]/g, '') !== '') say('  !! the shelf was not cleared for a new game');
  for (let k = 0; k < 9; k++) { await until('#question', 8); await page.click('#saymatters'); await until('#next', 25); await page.click('#next'); await page.waitForTimeout(400); }
  say('END B: ' + await text('#headline')); say('   ' + await text('#endline')); await shot('b-end');
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n'); await browser.close();
})();
