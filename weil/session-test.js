// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Game A (life 2): a learner: raises the boy, then strikes only the armed men who would strike first, raises the rest, pleads
//   to men still clay and stands before stone. How to play opened mid-day and returned from. About from the end.
// Game B (a new life from "Live another life", then forced to life 3 for repeatability): strikes or takes everything;
//   expect the arm to move by itself, no interval at the top, and death under a man of stone.
// Game C (life 11, by its number): spares everyone; expect more kneeling.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|goatcounter|gc\.zgo/.test(m.text())) errors.push(m.text()); });
  const file = 'file://' + path.join(__dirname, 'weils-vase.html');
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll on ${where}: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const on = async () => page.$eval('.screen.on', e => e.id);
  const today = () => page.evaluate(() => { const t = window.__vase.t; return { day: t.day, mode: t.mode, man: t.man.id, lines: t.man.lines, armed: t.man.armed, fearless: !!t.man.fearless, iv: t.interval, you: t.lines, ok: t.gestures.filter(x => x.ok).map(x => x.id) }; });
  const settled = () => page.waitForFunction(() => !document.querySelector('#result').classList.contains('hidden'), null, { timeout: 30000 });
  async function playLife(tag, strat, shots) {
    for (let d = 0; d < 14; d++) {
      await page.waitForTimeout(1000);
      const t = await today(); const g = strat(t);
      const pre = await text('#scene');
      if (shots.before && shots.before(t)) await shot(`${tag}-day${t.day}${t.mode === 'down' ? '-down' : ''}`, false);
      if (shots.help && shots.help(t)) { await page.click('#play .q'); await page.waitForTimeout(300); if (shots.helpShot) await shot('help'); await page.click('#helpback'); await page.waitForTimeout(300); say('   help returned to: ' + await on()); }
      if (t.mode === 'up' && t.iv < 0.05) { say(`${tag} day ${t.day} ${t.mode} ${t.man}(${t.lines}) you ${t.you}: no interval`); if (shots.noint) { await page.waitForTimeout(500); await shot(`${tag}-day${t.day}-nointerval`, false); } }
      else if (t.mode === 'up' && isFinite(t.iv)) { await page.waitForTimeout(1300); if (shots.creep && shots.creep(t)) await shot(`${tag}-day${t.day}-creep`, false); await page.click(`#sherds [data-g="${g}"]`); say(`${tag} day ${t.day} ${t.mode} ${t.man}(${t.lines}) you ${t.you}: creep ${t.iv.toFixed(1)} s, touched ${g}`); }
      else {
        const label = await page.evaluate(g => window.VASE.gestureLabel(g, window.__vase.t.man).act, g);
        await page.click(`#sherds [data-g="${g}"]`); say(`${tag} day ${t.day} ${t.mode} ${t.man}(${t.lines}) you ${t.you}: ${g} [${label}]`);
      }
      await settled(); await page.waitForTimeout(300);
      say('   ' + (await text('#result')).slice(0, 300));
      if (shots.after && shots.after(t)) await shot(`${tag}-day${t.day}-result`);
      await noScroll('play');
      const over = await page.evaluate(() => window.__vase.g.over);
      await page.click('#next'); await page.waitForTimeout(400);
      if (over) break;
    }
    await page.waitForTimeout(500);
    say(`${tag} END (${await on()}): ${await text('#headline')}`); say('   ' + await text('#did')); await noScroll('end');
  }
  const learner = t => { if (t.mode === 'down') return t.lines <= 2 ? 'stand' : 'plead'; if (t.day === 1) return 'raise';
    if (t.armed && (t.lines <= 2 || t.fearless)) return 'strike'; return t.ok.includes('raise') ? 'raise' : 'pass'; };
  const hard = t => t.mode === 'down' ? 'plead' : (t.ok.includes('strike') ? 'strike' : 'take');
  const soft = t => t.mode === 'down' ? 'plead' : (t.ok.includes('raise') ? 'raise' : 'pass');

  // ---- game A
  await page.goto(file + '#life=2'); await page.waitForTimeout(500);
  await shot('start'); await noScroll('start'); say('START aim: ' + await text('#aimStart') + ' | ' + await text('#lifeno'));
  await page.click('#begin');
  await playLife('a', learner, { before: t => [1, 4, 12].includes(t.day) || t.man === 'guest', after: t => [1, 2, 4, 5, 12].includes(t.day) || t.mode === 'down',
    help: t => t.day === 3, helpShot: true });
  await shot('a-end');
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(300); say('about returned to: ' + await on());

  // ---- game B: a new life, then the hard player on life 3
  await page.click('#again'); await page.waitForTimeout(600); say('new life from Live another life: ' + await page.evaluate(() => window.__vase.seed) + ' on ' + await on());
  await page.goto('about:blank'); await page.goto(file + '#life=3'); await page.waitForTimeout(400); await page.click('#begin');
  await playLife('b', hard, { creep: t => true, noint: true, after: t => t.day === 2 || t.mode === 'down', before: t => t.mode === 'down' });
  await shot('b-end');

  // ---- game C: the soft player on life 11
  await page.goto('about:blank'); await page.goto(file + '#life=11'); await page.waitForTimeout(400); await page.click('#begin');
  await playLife('c', soft, { after: t => t.mode === 'down' });
  await shot('c-end');

  say('\nerrors: ' + (errors.length ? errors.join(' / ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
