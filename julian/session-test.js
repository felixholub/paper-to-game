// Full session in a headless browser at phone width (build.md §4.6): three nights with three ways of looking, help opened from mid-play
// and returned from, another night, screenshots along the way; fails on any console error or horizontal scroll at 380 px.
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const file = 'file://' + path.resolve(__dirname, 'julians-window.html');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|gc\.zgo\.at|count\.js/.test(m.text())) errors.push('console: ' + m.text()); }); // the counter script is not reachable from the sandbox
  const shot = (name) => page.screenshot({ path: path.join(__dirname, 'screenshot-' + name + '.png'), fullPage: true });
  const noScroll = async (where) => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) errors.push('horizontal scroll at ' + where + ': ' + w); };
  const log = [];
  async function playNight(tag, policy, shots) {
    const BEATS = await page.evaluate(() => window.Julian.CONFIG.beats);
    for (let beat = 0; beat < BEATS; beat++) {
      const st = await page.evaluate(() => { const s = window.__julian.state; return { beat: s.beat, weal: s.weather[s.beat], causeAsked: s.causeAsked, line: document.getElementById('weatherLine').textContent }; });
      const place = policy(st);
      if (shots.indexOf('b' + beat) >= 0) await shot(tag + '-beat' + (beat + 1) + '-choose');
      await page.click('#pagewrap rect[data-place="' + place + '"]');
      const pressed = await page.getAttribute('.choice[data-place="' + place + '"]', 'aria-pressed');
      if (pressed !== 'true') errors.push('selection not marked at beat ' + beat);
      if (shots.indexOf('s' + beat) >= 0) await shot(tag + '-beat' + (beat + 1) + '-selected');
      await page.click('#lookBtn');
      const res = await page.evaluate(() => ({ cap: document.getElementById('resCaption').textContent, line: document.getElementById('resLine').textContent, balloons: Array.from(document.querySelectorAll('.balloon')).map(b => b.textContent) }));
      log.push(tag + ' beat ' + (beat + 1) + ' [' + (st.weal ? 'sureness' : 'HEAVINESS') + '] ' + st.line + ' > ' + place + ' :: ' + res.cap.slice(0, 70) + '... | ' + res.line.slice(0, 80));
      if (shots.indexOf('r' + beat) >= 0) await shot(tag + '-beat' + (beat + 1) + '-result');
      await noScroll(tag + ' beat ' + beat);
      if (beat === 4 && tag === 'a') { // help from mid-play, and back
        await page.click('#play .qbtn'); await shot('help'); await page.click('#helpBack');
        const back = await page.evaluate(() => document.querySelector('.screen.on').id); if (back !== 'play') errors.push('help did not return to play');
        const still = await page.evaluate(() => document.getElementById('result').style.display); if (still === 'none') errors.push('result lost after help');
      }
      await page.click('#nextBtn');
    }
    const on = await page.evaluate(() => document.querySelector('.screen.on').id);
    if (on !== 'end') errors.push('did not reach the end screen in ' + tag);
    const v = await page.evaluate(() => ({ did: document.getElementById('vDid').textContent, says: document.getElementById('vSays').textContent, means: document.getElementById('vMeans').textContent, night: document.getElementById('nightNo').textContent }));
    log.push(tag + ' END: ' + v.night + '\n  ' + v.did + '\n  ' + v.says + '\n  ' + v.means);
    await shot(tag + '-end'); await noScroll(tag + ' end');
  }
  await page.goto(file + '?night=7');
  await shot('start'); await noScroll('start');
  await page.click('#startBtn'); await shot('intro'); await noScroll('intro');
  await page.click('#introBtn');
  // A: Julian's own night — the cross, and one look within in the first dark
  await playNight('a', st => (!st.weal && !st.causeAsked) ? 'within' : 'cross', ['b0', 's0', 'r0', 'b1', 'r1', 'r2', 'r3', 'r5', 'r6', 's7', 'r7', 'r8', 'b9']);
  await page.click('#end [data-go="about"]'); await shot('about'); await page.click('#aboutBack');
  const backTo = await page.evaluate(() => document.querySelector('.screen.on').id); if (backTo !== 'end') errors.push('about did not return to end');
  // B: the stranger's first instinct — the window in every dark
  await page.click('#againBtn');
  await playNight('b', st => st.weal ? 'cross' : 'window', ['r1', 'r2', 'r5', 'r8']);
  // C: within all night
  await page.click('#againBtn');
  await playNight('c', () => 'within', ['r0', 'r2', 'r6', 'r9']);
  // D: the window all night (never a sight)
  await page.click('#againBtn');
  await playNight('d', () => 'window', ['r3']);
  require('fs').writeFileSync(path.join(__dirname, 'session-log.txt'), log.join('\n') + '\n\nerrors: ' + (errors.length ? errors.join('\n') : 'none') + '\n');
  console.log(log.filter(l => /END|beat (1|2|3|4) /.test(l)).join('\n'));
  console.log('\nerrors: ' + (errors.length ? errors.join('\n') : 'none'));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
