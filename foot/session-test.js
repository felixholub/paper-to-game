// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Game A: the walkthrough player (memo §9): the bargain on Mr Most; the bargain, the tram, then the brew on Doctor Double;
//   the brew, the cave and the beggar on Mrs Foot. How to play opened mid-reel and returned from. About from the end.
// Game B (PLAY AGAIN): the card-order player, who springs the schemes as dealt: expect Doctor Double to hold.
// Game C (a reload): the cave hunter: the cave first on everyone.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'); const FOOT = require('./mechanism.js');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ['--no-sandbox'] } : {}); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|goatcounter|gc\.zgo/i.test(m.text())) errors.push(m.text()); });
  const file = 'file://' + path.join(__dirname, 'foots-bad-man.html');
  await page.goto(file); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll on ${where}: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const on = async () => page.$eval('.screen.on', e => e.id);
  const idle = () => page.waitForFunction(() => !window.__foot.busy, null, { timeout: 30000 });
  const marks = async () => page.$$eval('.por', ps => ps.map(p => { const s = p.querySelector('.stamp'); return s ? (s.classList.contains('dis') ? '■' : '□') : (p.classList.contains('cur') ? '▸' : '·'); }).join(' '));
  async function playGame(tag, plan, shots, policy) {
    shots = shots || {}; policy = policy || (() => 'A');
    while (await on() === 'play') {
      await idle();
      const v = await page.evaluate(() => { const c = FOOT.current(window.__foot.g); return { id: c.id, name: c.name, reel: c.reel }; });
      say(`\n${tag} REEL ${v.reel}: ${v.name} [${await marks()}]  rule: ${await text('#trule')}`);
      if (shots.intro && shots.intro(v)) await shot(`${tag}-reel${v.reel}-intro`, false);
      const order = plan[v.id]; let k = 0;
      while (await on() === 'play') {
        const sid = order[k++];
        if (!await page.$eval(`.sc[data-s="${sid}"]`, b => !b.disabled)) { say('  !! scheme disabled: ' + sid); break; }
        const sel0 = await page.$eval('#spring', b => b.disabled); if (!sel0) say('  !! spring enabled before a pick');
        await page.click(`.sc[data-s="${sid}"]`); await page.waitForTimeout(200);
        say(`  preview ${sid}: ${await text('#cap')}`); say(`  button: ${await text('#spring')}`);
        if (shots.pre && shots.pre(v, sid)) await shot(`${tag}-reel${v.reel}-${sid}-preview`);
        if (shots.help && shots.help(v, sid)) { await page.click('#play .q'); await page.waitForTimeout(300); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(300); say('  help returned to: ' + await on() + ', ' + await text('#spring')); }
        await page.click('#spring');
        // the chair: wait until the game asks (or shows the earlier decision), then answer by this player's policy
        await page.waitForFunction(() => window.__foot.waiting === 'chair' || (!window.__foot.busy) || !document.getElementById('chair').classList.contains('hidden'), null, { timeout: 10000 });
        await page.waitForTimeout(150);
        const asked = await page.evaluate(() => window.__foot.waiting === 'chair');
        if (asked) {
          const opt = policy(sid); say(`  chair asked: ${await text('#chlab')} ${await text('#chq')} | A: ${await text('#chA')} | B: ${await text('#chB')} → ${opt}`);
          if (shots.chair && shots.chair(v, sid)) await shot(`${tag}-reel${v.reel}-${sid}-chair`);
          await page.click(opt === 'A' ? '#chA' : '#chB');
        } else say(`  chair: ${await text('#chdone')}`);
        await idle(); await page.waitForTimeout(150);
        say(`  → ${await text('#rdid')} ${await text('#rwhy')}`); say(`    note: ${await text('#rnote')}`); say(`    ${await text('#raud')}`); say(`    you: ${await text('#ryou')}`); say(`    ${await text('#rsays')}`); say(`    ${await text('#rstand')}  [${await marks()}]  pips: ${await text('#pips')}`);
        if (shots.res && shots.res(v, sid)) await shot(`${tag}-reel${v.reel}-${sid}-result`);
        if (shots.film && shots.film(v, sid)) { await page.locator('#stagebox').screenshot({ path: path.join(__dirname, `screenshot-${tag}-film-${sid}.png`) }); say('  shot film ' + sid); }
        await noScroll('play');
        const label = await text('#next'); say(`    next: ${label}`);
        await page.click('#next'); await idle(); await page.waitForTimeout(250);
        if (!/next scheme/i.test(label)) break;
      }
    }
    say(`\n${tag} END [${await marks()}]: ${await text('#fate')}`); say('   ' + await text('#did')); say('   ' + await text('#vpaper'));
    const mi = await text('#vmissed'); if (mi.trim()) say('   ' + mi); say('   ' + await text('#vmeans')); say('   YOU: ' + await text('#vyou')); say('   ' + await text('#vtrolley')); await noScroll('end');
  }
  // the epilogue: three cases, decided by a policy, then Anscombe
  async function playCoda(tag, policy, shots) {
    await page.click('#toCoda'); await page.waitForTimeout(400); say(`\n${tag} EPILOGUE on: ${await on()}`);
    for (let i = 0; i < 3; i++) {
      say(`  ${await text('#creel')}: ${await text('#ctext')}`); say(`    A: ${await text('#cA')} | B: ${await text('#cB')}`);
      if (shots && i === 0) await shot(`${tag}-coda-case1`);
      const opt = policy(i); await page.click(opt === 'A' ? '#cA' : '#cB'); await idle(); await page.waitForTimeout(200);
      say(`    → ${opt}: ${await text('#cdid')}`); say(`      ${await text('#cfoot')}`); say(`      ${await text('#cmost')}`);
      if (shots && i === 2) { say(`      ${await text('#cclose')}`); await shot(`${tag}-coda-case3`); }
      await noScroll('coda');
      await page.click('#cnext'); await page.waitForTimeout(300);
    }
    say(`  reply: ${await text('#cend')}`); if (shots) await shot(`${tag}-coda-end`, false);
  }
  // ---- game A
  await shot('start'); await noScroll('start'); say('START aim: ' + await text('#aimStart'));
  await page.click('#begin'); await page.waitForTimeout(400);
  await playGame('a', { most: ['bargain'], double: ['bargain', 'tram', 'brew'], foot: ['brew', 'cave', 'beggar'] }, {
    intro: v => true, pre: (v, s) => v.reel === 1 || (v.reel === 2 && s === 'brew'), help: (v, s) => v.reel === 2 && s === 'tram',
    res: (v, s) => v.reel === 1 || (v.reel === 2 && s !== 'bargain') || v.reel === 3,
    film: (v, s) => (v.reel === 2 && (s === 'tram' || s === 'brew' || s === 'bargain')) || (v.reel === 3 && (s === 'cave' || s === 'beggar')),
    chair: (v, s) => v.reel === 1 || (v.reel === 2 && s === 'brew'),
  }, sid => FOOT.choose('foot', sid));
  await shot('a-end');
  await playCoda('a', i => 'A', true);
  await page.click('#cagain'); await page.waitForTimeout(400); say('play again from the epilogue: ' + await on());
  await page.click('#end [data-go="about"]').catch(() => {});
  await page.click('#play .q'); await page.waitForTimeout(300); await page.click('#helpback'); await page.waitForTimeout(200);
  await page.click('[data-go="about"]').catch(() => {});
  // ---- game B: the card-order player, who always takes the first option in the chair (counts lives)
  await page.goto(file); await page.waitForTimeout(400); await page.click('#begin'); await page.waitForTimeout(300);
  const order = ['tram', 'bargain', 'medicine', 'brew', 'beggar', 'cave'];
  await playGame('b', { most: order, double: order, foot: order }, { film: (v, s) => v.reel === 2 && s === 'medicine' }, () => 'A');
  await shot('b-end');
  await playCoda('b', i => 'B', false);
  await page.click('#cend [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await noScroll('about');
  await page.click('#aboutback'); await page.waitForTimeout(300); say('about returned to: ' + await on());
  // ---- game C
  await page.goto(file); await page.waitForTimeout(400); await page.click('#begin'); await page.waitForTimeout(300);
  const caves = ['cave', 'tram', 'medicine', 'brew'];
  await playGame('c', { most: caves, double: caves, foot: caves }, { film: (v, s) => s === 'cave' && v.reel === 2 }, sid => FOOT.choose('double', sid));
  await shot('c-end');
  await page.click('#again'); await page.waitForTimeout(300); say('play again from the end: ' + await on());
  say('\nerrors: ' + (errors.length ? errors.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})();
