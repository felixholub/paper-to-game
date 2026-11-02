// Every world's last page, in a real headless browser at phone width: checks every picture the mechanism names is drawable,
// builds one designed page per world, renders its last pages and screenshots them. Run: node world-tour.js
const { chromium } = require('playwright-core'); const path = require('path');
const PAGES = {
  restless: [['uranium', 1], ['nitrate', 0.3], ['thO', 0.9], ['whiteP', 1.3], ['redP', 0], ['pbJG', 3.4], ['chalc', 2.2], ['chalcArt', 0.38], ['lead', 0]],
  slow: [['uranium', 0.5], ['greenox', 0.75], ['nitrate', 0.29], ['thO', 0.9], ['pbJG', 3.4], ['chalc', 2.2], ['chalcArt', 0.38], ['whiteP', 1.3], ['redP', 0]],
  sky: [['uranium', 1], ['lead', 0.5], ['gold', 0.6], ['thO', 0.9], ['pbJG', 3.4], ['chalc', 2.2], ['chalcArt', 0.4], ['nitrate', 0.3], ['tantal', 0.1]],
  crystal: [['uranium', 1], ['nitrate', 0.3], ['thO', 0.9], ['chalc', 2.2], ['chalcArt', 1.5], ['pbJG', 3.4], ['lead', 0], ['whiteP', 1.3], ['redP', 0]],
  bottomless: [['uranium', 1], ['nitrate', 0.3], ['thO', 0.9], ['pbJG', 0.65], ['pbJo', 0.6], ['chalc', 0.5], ['lead', 0], ['whiteP', 1.3], ['redP', 0]],
  leaking: [['uranium', 1], ['copper', 0.4], ['lead', 0], ['thO', 0.9], ['pbJG', 3.4], ['whiteP', 1.3], ['redP', 0.5], ['nitrate', 0.3], ['chalc', 2.2]],
  bone: [['uranium', 1], ['whiteP', 1.3], ['phosphate', 0.5], ['thO', 0.9], ['pbJG', 3.4], ['nitrate', 0.3], ['chalc', 2.2], ['chalcArt', 0.38], ['lead', 0]],
  quiet: [['uranium', 1], ['thO', 0], ['thOthick', 0], ['lead', 0], ['gold', 0], ['copper', 0], ['pbJG', 3.4], ['nitrate', 0.3], ['redP', 0]],
  doubt: [['uranium', 1], ['nitrate', 0.3], ['nitrate', 0.3], ['thO', 0.9], ['thO', 0.9], ['pbJG', 3.4], ['pbJG', 3.4], ['chalcArt', 0.38], ['chalc', 2.2]],
  elsewhere: [['uranium', 1], ['nitrate', 0.3], ['greenox', 0.85], ['thO', 0.9], ['thOthick', 2.2], ['whiteP', 1.3], ['redP', 0], ['lead', 0], ['copper', 0]],
};
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto('file://' + path.join(__dirname, 'curies-quartz.html')); await page.waitForTimeout(500);
  const missing = await page.evaluate(() => { const M = window.CURIE, u = window.__curie; return { pics: M.PICS.filter(p => !u.pics.includes(p)), landmarks: M.LANDMARKS.filter(l => !u.landmarks.includes(l)) }; });
  console.log('missing pictures:', JSON.stringify(missing));
  for (const [world, plan] of Object.entries(PAGES)) {
    const got = await page.evaluate(plan => { const M = window.CURIE, u = window.__curie; const g = u.game; g.panels.length = 0; g.ideas.length = 0; g.scenes.length = 0; Object.keys(g.tested).forEach(k => delete g.tested[k]); Object.keys(g.used).forEach(k => delete g.used[k]); Object.keys(g.shouted).forEach(k => delete g.shouted[k]);
      for (const [id, x] of plan) { const st = M.benchStart(g, id); M.benchStep(st, 1, x); M.commit(g, st); }
      u.renderEnd(); u.show('end'); window.scrollTo(0, 0); return { world: M.physics(g).world, name: document.querySelector('#physname').textContent, strip: document.querySelectorAll('#endstrip .sc').length, part: document.querySelector('#part').innerText.slice(0, 120) }; }, plan);
    const ok = got.world === world; console.log(`${ok ? 'ok ' : '!! '}${world.padEnd(11)} → ${got.world.padEnd(11)} ${got.name.padEnd(22)} strip ${got.strip}  | ${got.part.replace(/\n/g, ' ')}`);
    await page.screenshot({ path: path.join(__dirname, `screenshot-world-${world}.png`), fullPage: true });
    const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) console.log('  !! horizontal scroll ' + w);
  }
  console.log('errors: ' + (errors.length ? errors.join(' | ') : 'none'));
  await browser.close();
})();
