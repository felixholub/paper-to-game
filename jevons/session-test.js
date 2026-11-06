// A scripted session in a real browser at phone size, through the actual screens, with screenshots.
// Sheet A: a first-timer: as now; a stand when the engine is announced (thinking it will burn less); opens How to
//   play mid-game and comes back; as now; a stand to the end; the run-on; the verdict; About; the last screen.
// Sheet B (from ANOTHER SHEET): free trade to the last, as now every generation: the evening, the sheet drawn on.
// Sheet C: a stand every generation.
// Run: node session-test.js   (session-log.txt is the saved output)
const { chromium } = require('playwright'); const path = require('path');
const out = []; const say = s => { out.push(s); console.log(s); };
const MARK = { cut: 0.5, stand: 1, slower: 1.5, now: 2, faster: 2.4 };
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 380, height: 780 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|net::|goatcounter|gc\.zgo/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: !!full }); say(`  shot ${name}`); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); say(`  ${where}: page width ${w} (no horizontal scroll: ${w <= 380})`); };
  const text = sel => page.$eval(sel, e => e.innerText.replace(/\n+/g, ' | '));
  const st = () => page.evaluate(() => { const s = window.__jevons.st; return { year: s.year, gen: s.gen, C: Math.round(s.C), S: Math.round(s.S), gone: +s.gone.toFixed(1), ended: s.ended, evening: s.evening }; });
  const setRuler = async mult => {
    const r = await page.$('#ruler'); await r.scrollIntoViewIfNeeded(); const b = await r.boundingBox();
    const x = 10 + (mult - 0.5) / (2.4 - 0.5) * (338 - 10);
    await page.mouse.click(b.x + b.width * x / 348, b.y + b.height * 0.5); await page.waitForTimeout(150);
  };
  const waitFor = async sel => { await page.waitForSelector(sel, { timeout: 30000 }); await page.waitForTimeout(250); };

  async function generation(mark, opts) {
    opts = opts || {};
    if (await page.$('#noted')) {
      const card = await text('#panel .card');
      if (opts.shotEngine) await shot(opts.shotEngine, true);
      await page.click('#noted'); await page.waitForTimeout(200);
      say(`  engine news: ${card.slice(0, 220)}...`);
    }
    if (await page.$('#runout')) return 'evening';
    if (opts.shotEmpty) await shot(opts.shotEmpty, true);
    const before = await page.$eval('#burn', b => b.disabled);
    await setRuler(MARK[mark]);
    const reading = await text('#reading');
    if (opts.shotSet) await shot(opts.shotSet, true);
    await page.click('#burn');
    if (opts.shotBurning) { await page.waitForTimeout(1800); await shot(opts.shotBurning); }
    await waitFor('#next');
    const s = await st();
    say(`  ${mark}: burn disabled before touching the ruler: ${before}; reading: "${reading}"`);
    say(`    -> ${await text('#panel .res')} || Jevons: ${(await page.$('#panel .quote')) ? await text('#panel .quote') : '-'}`);
    say(`    state: year ${s.year}, fire ${s.C} Mt, ground burnt ${s.S} Mt, gone over the sea ${s.gone} M`);
    if (opts.shotResult) await shot(opts.shotResult, true);
    if (opts.help) {
      const y = await page.evaluate(() => window.scrollY);
      await page.click('#play [data-help]'); await page.waitForTimeout(250); await shot('help', true);
      await page.click('#helpback'); await page.waitForTimeout(250);
      say(`  How to play opened after a burn and closed: back on ${await page.evaluate(() => document.querySelector('.screen.on').id)}, scroll ${y} -> ${await page.evaluate(() => window.scrollY)}, Next button present: ${!!(await page.$('#next'))}`);
    }
    const runon = (await text('#next')).toLowerCase().includes('run on');
    await page.click('#next'); await page.waitForTimeout(500);
    if (runon) {
      say(`  RUN ON: ${await text('#panel .res')}`);
      if (opts.shotRunOn) await shot(opts.shotRunOn, true);
      await page.click('#runout'); await waitFor('#next'); await page.waitForTimeout(300);
      if (opts.shotRunOn) await shot(opts.shotRunOn + '-drawn', true);
      return 'end';
    }
    return 'next';
  }
  async function evening(shotName) {
    say(`  EVENING: ${await text('#panel .res')} || ${(await page.$('#panel .quote')) ? await text('#panel .quote') : ''}`);
    if (shotName) await shot(shotName, true);
    await page.click('#runout'); await waitFor('#next');
    if (shotName) await shot(shotName + '-drawn', true);
  }
  async function verdict(name) {
    await page.click('#next'); await page.waitForTimeout(500);
    say(`  VERDICT: ${await text('#vhead')} | ${await text('#vlines')}`);
    await shot(name, true); await noScroll('verdict');
  }

  await page.goto('file://' + path.join(__dirname, 'jevons-noon.html')); await page.waitForTimeout(600);
  await shot('start', true); await noScroll('start screen');

  say('SHEET A: a first-timer');
  await page.click('#begin'); await page.waitForTimeout(300);
  await generation('now', { shotEmpty: 'a-1865-empty', shotSet: 'a-1865-set', shotBurning: 'a-1865-burning', shotResult: 'a-1865-result' });
  await noScroll('play screen');
  await generation('stand', { shotEngine: 'a-1885-engine', shotSet: 'a-1885-set', shotResult: 'a-1885-result', help: true });
  await generation('now', { shotResult: 'a-1905-paradox' });
  let r = await generation('stand', { shotEngine: 'a-1925-engine', shotResult: 'a-1925-result' });
  if (r === 'evening') { await evening('a-evening'); }
  else { await generation('stand', {}); r = await generation('stand', { shotResult: 'a-1965-result', shotRunOn: 'a-runon' }); }
  await verdict('a-end');
  await page.click('#toabout'); await page.waitForTimeout(250); await shot('about', true); await page.click('#aboutback'); await page.waitForTimeout(200);
  await page.click('#tolast'); await page.waitForTimeout(3500); await shot('a-last-drawing'); await page.waitForTimeout(6500); await shot('a-last', true);
  say(`  last screen text: "${await page.$eval('#lsheet', e => [...e.querySelectorAll('text')].map(t => t.textContent).join(' / '))}"`);
  await page.click('#lastback'); await page.waitForTimeout(300);

  say('SHEET B (ANOTHER SHEET): free trade to the last, both engines fitted');
  await page.click('#again'); await page.waitForTimeout(300);
  for (let i = 0; i < 6; i++) {
    const res = await generation('now', { shotResult: i === 3 ? 'b-1925-result' : null });
    if (res === 'evening') { await evening('b-evening'); break; }
    if (res === 'end') break;
  }
  await verdict('b-end');
  await page.click('#tolast'); await page.waitForTimeout(10500); await shot('b-last', true); await page.click('#lastback'); await page.waitForTimeout(200);

  say('SHEET C: a stand every generation, both engines refused');
  await page.click('#again'); await page.waitForTimeout(300);
  for (let i = 0; i < 6; i++) {
    const res = await generation('stand', { shotResult: i === 2 ? 'c-1905-result' : null, shotRunOn: i === 5 ? 'c-runon' : null });
    if (res === 'evening') { await evening(); break; }
    if (res === 'end') break;
  }
  await verdict('c-end');
  say(`errors: ${errs.length ? errs.join(' ; ') : 'none'}`);
  require('fs').writeFileSync(path.join(__dirname, 'session-log.txt'), out.join('\n') + '\n');
  await browser.close();
})();
