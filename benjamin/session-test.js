// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Strategy: veil down through the cave, temple and cathedral; shown on the day at the court; print at the print shop and the
// studio; the screen at the cinema; help opened mid-play and returned from; the verdict; About; play again.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'benjamins-veil.html')); await page.waitForTimeout(500);
  const shot = async name => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: true }); say('  shot ' + name); };
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  await shot('start'); await noScroll();
  await page.click('#begin'); await page.waitForTimeout(300);
  const plan = [0, 1, 3, 4, 5, 6]; // the day at the temple, then each new rung as it comes
  let copiesSoFar = 0; let lastFrame = null;
  for (let i = 0; i < 6; i++) {
    say(`\n== ${await text('#agename')} (${await text('#agemeta')})`);
    say('   new: ' + await text('#newthis'));
    const arr = await page.$eval('#arrive', e => e.style.display === 'none' ? '' : e.innerText); if (arr) say('   arrives: ' + arr);
    const slabs = await page.$$eval('#veils .veil', bs => bs.map(b => (b.disabled ? '(' : '') + b.innerText.replace(/\n/g, ' — ') + (b.disabled ? ')' : '')));
    say('   slabs: ' + slabs.join(' / '));
    if (!(await page.$eval('#commit', b => b.disabled))) say('   !! commit enabled before a slab was tapped');
    if (await page.$('#veils .veil.chosen')) say('   !! a slab is pre-selected at age start');
    const first = await page.$eval('#frame', e => ({ n: +e.dataset.n, tech: e.dataset.tech, halo: e.dataset.halo, crowd: +e.dataset.crowd }));
    if (i) { // the first frame of this age equals the last frame of the previous age
      const same = first.n === lastFrame.n && first.tech === lastFrame.tech && first.halo === lastFrame.halo && first.crowd === lastFrame.crowd;
      if (!same) say(`   !! first frame differs from the previous age's last: ${JSON.stringify(first)} vs ${JSON.stringify(lastFrame)}`); else say(`   first frame = previous age's last frame (${first.tech}, halo ${first.halo}, crowd ${first.crowd}, nearness ${first.n})`);
      if (i === 4) await shot(`age${i + 1}-as-left`);
      await page.waitForTimeout(1200);
      const after = await page.$eval('#frame', e => ({ n: +e.dataset.n, tech: e.dataset.tech, halo: e.dataset.halo, crowd: +e.dataset.crowd }));
      if (JSON.stringify(after) !== JSON.stringify(first)) say('   !! the picture changed at the arrival'); else say('   nothing in the picture changed at the arrival');
    } else say('   age one starts in the dark');
    const copiesAtStart = await page.$eval('#copies', e => { const s = e.querySelector('svg'); return s ? +s.dataset.copies : 0; });
    if (copiesAtStart < copiesSoFar) say(`   !! copies at age start fell from ${copiesSoFar} to ${copiesAtStart}`); else say(`   copies in the world at age start: ${copiesAtStart}`);
    if (i === 0) await shot('age1-cave');
    if (i === 1) await shot('age2-temple');
    if (i === 3) { await page.click('#play .qbtn'); await page.waitForTimeout(200); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(200); say('   help opened and returned to ' + await page.$eval('.screen.on', e => e.id)); }
    await page.click(`#veils .veil[data-i="${plan[i]}"]`); await page.waitForTimeout(250);
    say('   > tapped ' + slabs[plan[i]] + '; commit says: ' + await text('#commit'));
    { const pv = await page.$eval('#frame', e => ({ tech: e.dataset.tech, halo: e.dataset.halo, crowd: +e.dataset.crowd })); say(`   preview: ${pv.tech}, halo ${pv.halo}, nobody there yet (crowd ${pv.crowd})`); if (pv.crowd !== 0) say('   !! crowd in the preview'); }
    if (await page.$('#result:not([style*="none"])')) say('   !! result visible before commit');
    if (i === 3) { await shot('age4-veil-set'); await noScroll(); }
    await page.click('#commit'); await page.waitForTimeout(1200);
    say('   line: ' + await text('#line'));
    say('   copies: ' + await text('#copies'));
    copiesSoFar = await page.$eval('#copies', e => { const s = e.querySelector('svg'); return s ? +s.dataset.copies : 0; });
    lastFrame = await page.$eval('#frame', e => ({ n: +e.dataset.n, tech: e.dataset.tech, halo: e.dataset.halo, crowd: +e.dataset.crowd }));
    say('   seen: ' + await page.$eval('#frame', e => `${e.dataset.tech}, halo ${e.dataset.halo}, crowd ${e.dataset.crowd}, lit ${e.dataset.lit}`));
    if (i === 0 || i === 2 || i === 3 || i === 4 || i === 5) await shot(`age${i + 1}-passed`);
    await noScroll();
    say('   > ' + await text('#nextage'));
    await page.click('#nextage'); await page.waitForTimeout(300);
  }
  await page.waitForTimeout(300); await shot('end'); await noScroll();   // the last Next age is The verdict
  say('\n== VERDICT: ' + await text('#lead') + ' | ' + await text('#facenowwords'));
  say('   ' + await text('#vdid')); say('   ' + await text('#vben')); say('   ' + await text('#vepi')); say('   ' + await text('#vbest'));
  await page.click('#aboutbtn2'); await page.waitForTimeout(200); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  say('   about opened and returned to ' + await page.$eval('.screen.on', e => e.id));
  // a second run: never lift the veil
  await page.click('#again'); await page.waitForTimeout(300);
  for (let i = 0; i < 6; i++) { await page.click('#veils .veil[data-i="0"]'); await page.click('#commit'); await page.waitForTimeout(900); if (i === 4) say('\n== second run, studio, veil down: ' + await text('#line')); await page.click('#nextage'); await page.waitForTimeout(200); }
  await page.waitForTimeout(300); say('== second run verdict: ' + await text('#lead') + ' | ' + await text('#vdid')); await shot('end-veiled');
  say('\nerrors: ' + (errors.length ? errors.join(' ; ') : 'none'));
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
})();
