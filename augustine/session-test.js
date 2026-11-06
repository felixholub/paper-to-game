// A scripted session in a real browser at phone size, in real time: three evenings through the actual screens, with
// screenshots. Evening A: a first-timer who holds reasonably, picks wrongly once, miscounts the crowd (How to play opened
// and closed mid-station). Evening B, another evening: steady throughout, every choice right. Evening C, evening A's
// number again by its address: a hasty player who taps short, holds the crowd to the end and guesses.
// Run: node session-test.js   (session-log.txt is the saved output)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const out = []; const say = s => { out.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 780 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|net::/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: !!full }); say(`  shot ${name}`); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); say(`  ${where}: page width ${w} (no horizontal scroll: ${w <= 380})`); };
  const st = () => page.evaluate(() => { const u = window.__augustine.ui, g = window.__augustine.g; return { phase: u.phase, id: u.r.id, i: g.i, seed: g.seed, k: u.k }; });
  const G = () => page.evaluate(() => { const g = window.__augustine.g; return { low: g.low, sun: g.sun, plan: g.tumult, deal: g.deal, seed: g.seed }; });
  const center = () => page.$eval('#now', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const press = async () => { await page.$eval('#now', e => e.scrollIntoView({ block: 'center' })); const c = await center(); await page.mouse.move(c.x, c.y); await page.mouse.down(); };
  const lift = async () => { await page.mouse.up(); };
  const tap = async () => { await press(); await page.waitForTimeout(40); await lift(); };
  const hold = async ms => { await press(); await page.waitForTimeout(ms); await lift(); };
  const waitPhase = async (ph, max = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { const s = await st(); if (ph.includes(s.phase)) return s; await page.waitForTimeout(30); } throw new Error('timed out waiting for ' + ph + ' at ' + JSON.stringify(await st())); };
  const lines = async () => (await page.$eval('#lines', e => e.innerText)).replace(/\n+/g, ' | ');
  const big = async () => (await page.$eval('#big', e => e.innerText)).replace(/\n+/g, ' / ');
  const result = async (tag) => { say(`  ${tag}: ${await big()} || ${await lines()}`); };
  const ask = async () => (await page.$eval('#ask', e => e.innerText)).replace(/\n+/g, ' ');
  const yoursAmong = (offered) => offered.findIndex(o => o.yours);
  const resNow = () => page.evaluate(() => { const g = window.__augustine.g; return g.results[g.i]; });

  async function evening(tag, player, opts) {
    opts = opts || {};
    say(`\nEVENING ${tag} (${player})`);
    await page.click(opts.again ? '#again' : '#begin'); await page.waitForTimeout(300);
    const info = await G(), L = info.low, P = info.plan, SU = info.sun;
    say(`  number ${info.seed}: the low one ${L} s; the sun crosses ${SU.arc} of the sky in ${SU.cross} s and stands still ${SU.stop} s; crowd of ${P.size} entering ${P.stagger} s apart, the low one ${P.lowStart}–${P.lowEnd} s of ${P.end} s`);
    const S = (n) => opts.shots ? shot(`${tag.toLowerCase()}-${n}`) : Promise.resolve();
    const next = async () => { await page.click('#next'); await page.waitForTimeout(250); };
    const choose = async (k) => { await page.click('#chips button[data-k="' + k + '"]'); await waitPhase(['result']); };
    const f = player === 'hasty' ? 0.6 : player === 'steady' ? 0.98 : 0.9;
    // 1 a moment of joy
    say('  1: ' + await ask()); await S('1-ready'); await hold(player === 'hasty' ? 900 : 3200); await waitPhase(['result']); await result('1 a moment of joy'); await S('1-result'); await noScroll('station'); await next();
    // 2 the low one
    await tap(); await waitPhase(['ready']); await hold(L * 1000 * f); await waitPhase(['result']); await result('2 the low one'); await S('2-result'); await next();
    // 3 night and day
    say('  3: ' + await ask()); await S('3-ready'); await hold(player === 'hasty' ? 600 : 1500); await waitPhase(['ready2']); say('  3b: ' + await ask()); await S('3-ready2'); await hold(player === 'hasty' ? 1100 : 3600); await waitPhase(['result']); await result('3 night and day'); await S('3-result'); await next();
    // 4 half of it (How to play opened and closed first, on evening A)
    if (opts.help) { await page.click('#round .q'); await page.waitForTimeout(200); await S('help'); await page.click('#helpback'); await page.waitForTimeout(200); say('  How to play opened and closed; still at ' + JSON.stringify(await st())); }
    say('  4: ' + await ask()); await tap(); await waitPhase(['ready']); say('  4b: ' + await ask()); await S('4-ready');
    if (player === 'hasty') { await tap(); await page.waitForTimeout(300); say('  4 after a tap: ' + await ask() + ' | phase ' + (await st()).phase); }
    await hold(L * 1000 * (player === 'hasty' ? 0.3 : player === 'steady' ? 0.5 : 0.62)); await waitPhase(['rest']); say('  4 rest: ' + await ask()); await S('4-rest'); await waitPhase(['result']); await result('4 half of it'); await S('4-result'); await next();
    // 5 a planned silence
    say('  5: ' + await ask()); await hold(player === 'hasty' ? 500 : 2200); await waitPhase(['choose']); say('  5b: ' + await ask()); await S('5-choose');
    { const r = await resNow(); const y = yoursAmong(r.offered); await choose(player === 'steady' ? y : player === 'hasty' ? 1 - y : y); }
    await result('5 a planned silence'); await S('5-result'); await next();
    // 6 the sun stands still
    say('  6: ' + await ask()); await tap(); await waitPhase(['sun']); await page.waitForTimeout((SU.stopStart + SU.stop / 2) * 1000); await S('6-sun'); await waitPhase(['ready'], 20000); say('  6b: ' + await ask()); await S('6-ready');
    await hold(SU.stop * 1000 * (player === 'hasty' ? 0.5 : f)); await waitPhase(['result']); await result('6 the sun stands still'); await S('6-result'); await next();
    // 7 the hymn
    say('  7: ' + await ask()); await tap(); await waitPhase(['sing'], 15000); say('  7b: ' + await ask()); await S('7-sing'); say('  7 memory holds: ' + await page.evaluate(() => window.__augustine.ui.bars.map(b => b.kind + (b.words ? ' ' + b.words : '')).join(', ')));
    for (let k = 0; k < 8; k++) { const long = k % 2 === 1; await hold(player === 'hasty' ? 450 : (long ? 820 : 400) * (k === 5 ? 1.25 : 1)); await page.waitForTimeout(120); if (k === 3) say('  7 after four: ' + await page.evaluate(() => window.__augustine.ui.bars.map(b => (b.you ? 'you ' : '') + b.kind + (b.words != null ? ' [' + b.words + ']' : '')).join(', '))); }
    await waitPhase(['choose']); say('  7c: ' + await ask() + ' || big: ' + await big()); await S('7-choose'); await choose(player === 'steady' ? 5 : 1); await result('7 the hymn'); await S('7-result'); await next();
    // 8 the tumult
    say('  8: ' + await ask()); await tap(); await waitPhase(['ready']); say('  8b: ' + await ask()); await S('8-ready'); await press(); await page.waitForTimeout(1200); await S('8-holding');
    if (player === 'hasty') await page.waitForTimeout((P.end - 1.2) * 1000 + 300); else await page.waitForTimeout((P.lowEnd - 1.2 + (player === 'steady' ? 0.1 : 0.45)) * 1000);
    await lift(); await waitPhase(['choose']); say('  8c: ' + await ask()); await S('8-choose'); await choose(player === 'steady' ? P.size : Math.min(7, P.size + 1)); await result('8 the tumult'); await S('8-result'); await next();
    // 9 night and day, again
    say('  9: ' + await ask()); await tap(); await waitPhase(['choose'], 40000); say('  9b: ' + await ask()); await S('9-choose');
    { const r = await resNow(); const y = r.pairs.findIndex(p => p.yours); await choose(player === 'hasty' ? (y + 1) % 3 : y); }
    await result('9 night and day, again'); await S('9-result'); await next();
    // 10 the moment, again
    say('  10: ' + await ask()); await tap(); await waitPhase(['choose'], 40000); say('  10b: ' + await ask()); await S('10-choose');
    { const r = await resNow(); const y = yoursAmong(r.offered); await choose(player === 'first-timer' ? 1 - y : y); }
    await result('10 the moment, again'); await S('10-result');
    await page.click('#next'); await page.waitForTimeout(2600);
    say('  LAST PAGE: ' + await page.$eval('#headline', e => e.innerText));
    say('  ' + (await page.$eval('#did', e => e.innerText)).replace(/\n+/g, ' | '));
    await S('end'); if (opts.shots) await shot(`${tag.toLowerCase()}-end-full`, true); await noScroll('last page');
  }

  await page.goto('file://' + path.join(__dirname, 'augustines-clock.html'));
  await shot('start'); await noScroll('start');
  await page.click('[data-about]'); await page.waitForTimeout(200); await shot('about', true); await noScroll('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  await evening('A', 'first-timer', { shots: true, help: true });
  const seedA = (await G()).seed;
  await evening('B', 'steady', { again: true, shots: false });
  await page.goto('about:blank'); await page.goto('file://' + path.join(__dirname, 'augustines-clock.html') + '#e=' + seedA); await page.waitForTimeout(300);
  await evening('C', 'hasty', { shots: false });
  say(`\nevening C used evening A's number (${seedA}) by its address: ${(await G()).seed === seedA}`);
  say('page errors: ' + (errs.length ? errs.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), out.join('\n') + '\n');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
