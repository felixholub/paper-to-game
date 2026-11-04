// A scripted session in a real browser at phone size, in real time: three evenings through the actual screens, with
// screenshots. Evening A: a first-timer who counts the kicked wheel (How to play opened mid-round and closed again).
// Evening B: another evening, held from memory throughout. Evening C: the same evening number replayed by a player who
// counts the wheel and waits for the sun. Run: node session-test.js   (session-log.txt is the saved output)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const out = []; const say = s => { out.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 780 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|net::/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: !!full }); say(`  shot ${name}`); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); say(`  ${where}: page width ${w} (no horizontal scroll: ${w <= 380})`); };
  const st = () => page.evaluate(() => { const u = window.__augustine.ui, g = window.__augustine.g; return { phase: u.phase, id: u.r.id, T: u.r.T, factor: u.r.factor, i: g.i, seed: g.seed }; });
  const center = () => page.$eval('#now', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const tap = async () => { await page.$eval('#now', e => e.scrollIntoView({ block: 'center' })); const c = await center(); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.waitForTimeout(50); await page.mouse.up(); };
  const hold = async (ms, mid) => { await page.$eval('#now', e => e.scrollIntoView({ block: 'center' })); const c = await center(); await page.mouse.move(c.x, c.y); await page.mouse.down();
    if (mid) { await page.waitForTimeout(mid.at); await mid.fn(); await page.waitForTimeout(Math.max(0, ms - mid.at)); } else await page.waitForTimeout(ms); await page.mouse.up(); };
  const lines = async () => (await page.$eval('#lines', e => e.innerText)).replace(/\n+/g, ' | ');
  const waitPhase = async (ph, max) => { const t0 = Date.now(); while (Date.now() - t0 < (max || 20000)) { const s = await st(); if (ph.includes(s.phase)) return s; await page.waitForTimeout(40); } throw new Error('timed out waiting for ' + ph); };
  // count three turns of the wheel from the press, as a player counting ticks would
  const countHold = async (shotName) => { await page.$eval('#now', e => e.scrollIntoView({ block: 'center' })); const c = await center(); await page.mouse.move(c.x, c.y); await page.mouse.down();
    const t0 = await page.evaluate(() => window.__augustine.ui.turnsShown); let shotDone = false;
    while (true) { const n = await page.evaluate(() => window.__augustine.ui.turnsShown); if (!shotDone && n >= t0 + 1 && shotName) { await shot(shotName); shotDone = true; } if (n >= t0 + 3) break; await page.waitForTimeout(15); }
    await page.mouse.up(); };

  async function evening(label, how, opts) {
    opts = opts || {};
    say(label);
    for (let k = 0; k < 7; k++) {
      let s = await st(); const sh = opts.shots ? n => `${opts.shots}-r${k + 1}-${n}` : null;
      if (k === 0 && opts.shots) await shot(sh('intro'));
      if (s.id === 'hymn') {
        await tap(); await page.waitForTimeout(1200); if (sh) await shot(sh('voice'));
        await waitPhase(['ready']); if (sh) await shot(sh('ready'));
        const syl = how.hymn;
        for (let j = 0; j < 8; j++) { await hold(syl[j] * 1000); await page.waitForTimeout(160); }
        await waitPhase(['done']); await page.waitForTimeout(300); if (sh) await shot(sh('lay'));
        await page.click('#chips button[data-k="2"]'); await page.click('#chips button[data-k="3"]');
        await waitPhase(['result']); await page.waitForTimeout(700); if (sh) await shot(sh('result'));
      } else {
        if (s.id !== 'first') { await tap(); await page.waitForTimeout(600); if (sh && ['voice', 'wheel', 'sun'].includes(s.id)) await shot(sh('voice')); s = await waitPhase(['ready', 'silence']); }
        if (s.id === 'silence') { await page.waitForTimeout(s.T * 1000 * how.silence); await tap(); }
        else if (s.id === 'kick' && how.counts) await countHold(sh ? sh('kicked') : null);
        else if (s.id === 'sun' && how.waits) await hold(s.T * 4000 + 400);
        else {
          const ratio = how[s.id] || 1;
          const mid = opts.helpAt === s.id ? { at: 0, fn: async () => {} } : null;
          if (opts.helpAt === s.id) { // How to play, opened before the hold and closed back to the round
            await page.click('#round .q'); await page.waitForTimeout(250); await shot('help', true);
            await page.click('#helpback'); await page.waitForTimeout(250); say('  How to play opened in round ' + (k + 1) + ' (' + s.phase + ') and closed: back on ' + (await page.evaluate(() => document.querySelector('.screen.on').id)) + ', phase ' + (await st()).phase);
          }
          await hold(s.T * ratio * 1000);
        }
        await waitPhase(['result']); await page.waitForTimeout(900); if (sh) await shot(sh('result'));
      }
      s = await st();
      say(`  round ${k + 1} ${s.id}${s.factor ? ' (wheel ×' + s.factor + ')' : ''}: ${(await page.$eval('#big', e => e.firstChild.textContent))} | ${await lines()}`);
      if (k === 0) await noScroll('round screen');
      await page.click('#next'); await page.waitForTimeout(350);
    }
    await page.waitForTimeout(2500);
    say(`  LAST PAGE: ${await page.$eval('#headline', e => e.textContent)}`);
    say(`  ${(await page.$$eval('#did p', ps => ps.map(p => p.textContent))).join(' | ')}`);
  }

  await page.goto('file://' + path.join(__dirname, 'augustines-clock.html'));
  await page.waitForTimeout(300); await shot('start'); await noScroll('start');
  await page.click('#begin'); await page.waitForTimeout(300);
  const seedA = (await st()).seed;
  await evening('EVENING A (' + seedA + ', first evening): a first-timer; counts the kicked wheel; How to play opened in round 2',
    { voice: 0.86, wheel: 1.04, counts: true, sun: 1.12, silence: 1.08, first: 0.9, hymn: [0.4, 0.62, 0.42, 0.7, 0.4, 0.66, 0.44, 0.74] }, { shots: 'a', helpAt: 'wheel' });
  await shot('a-end', true); await noScroll('last page');
  await page.click('#end [data-about]'); await page.waitForTimeout(300); await shot('about', true); await page.click('#aboutback'); await page.waitForTimeout(200);

  await page.click('#again'); await page.waitForTimeout(300);
  const seedB = (await st()).seed;
  await evening('EVENING B (' + seedB + ', another evening): held from memory throughout',
    { voice: 1.02, wheel: 0.97, kick: 1.05, sun: 0.95, silence: 1.0, first: 1.04, hymn: [0.4, 0.8, 0.42, 0.82, 0.4, 0.78, 0.44, 0.84] }, { shots: 'b' });
  await shot('b-end', true);

  await page.goto('file://' + path.join(__dirname, 'augustines-clock.html#e=' + seedB)); await page.reload(); await page.waitForTimeout(300);
  await page.click('#begin'); await page.waitForTimeout(300);
  const sC = await st(); say('EVENING C: evening ' + sC.seed + ' again by its number (same as B: ' + (sC.seed === seedB) + '); counts the wheel, waits for the sun');
  const same = await page.evaluate(() => JSON.stringify(window.__augustine.g.rounds.map(r => r.T)));
  say('  same voices as B: ' + same);
  await evening('  (playing)', { voice: 0.8, wheel: 1.1, counts: true, waits: true, silence: 0.75, first: 0.75, hymn: [0.5, 0.55, 0.5, 0.6, 0.45, 0.6, 0.5, 0.65] }, { shots: 'c' });
  await shot('c-end', true);

  say('');
  say('page errors: ' + (errs.length ? errs.join(' / ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), out.join('\n') + '\n');
  await browser.close();
})();
