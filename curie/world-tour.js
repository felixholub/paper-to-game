// Every world's last page, in a real headless browser at phone width: checks every picture the mechanism names is drawable,
// builds one designed page per world, renders its last pages and screenshots them. Run: node world-tour.js
const { chromium } = require('playwright-core'); const path = require('path');
const PAGES = require('./mechanism.js').CONFIG.EXAMPLES;
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto('file://' + path.join(__dirname, 'curies-counterfactuals.html')); await page.waitForTimeout(500);
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
