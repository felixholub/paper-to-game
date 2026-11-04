// A scripted session in a real browser at phone size, in real time: three evenings through the actual screens, with
// screenshots. Evening A, a first evening: a player who holds from memory but is pulled by the top one, counts the wheel
// in the silence, and misses a voice in the crowd (How to play opened and closed mid-station). Evening B, another evening:
// held from memory throughout, the crowd named exactly. Evening C, evening A's number again by its address: the learned
// man, who counts the wheel and waits for the sun. Run: node session-test.js   (session-log.txt is the saved output)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const out = []; const say = s => { out.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 780 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|net::/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: !!full }); say(`  shot ${name}`); };
  const noScroll = async where => { const w = await page.evaluate(() => document.documentElement.scrollWidth); say(`  ${where}: page width ${w} (no horizontal scroll: ${w <= 380})`); };
  const st = () => page.evaluate(() => { const u = window.__augustine.ui, g = window.__augustine.g; return { phase: u.phase, id: u.r.id, T: u.r.T, i: g.i, seed: g.seed }; });
  const G = () => page.evaluate(() => { const g = window.__augustine.g, A = window.AUGUSTINE; return { voices: g.voices, plan: g.stations[6].plan, countRatio: A.countRatio(g.stations[5]), seed: g.seed }; });
  const center = () => page.$eval('#now', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const press = async () => { await page.$eval('#now', e => e.scrollIntoView({ block: 'center' })); const c = await center(); await page.mouse.move(c.x, c.y); await page.mouse.down(); };
  const lift = async () => { await page.mouse.up(); };
  const tap = async () => { await press(); await page.waitForTimeout(40); await lift(); };
  const hold = async ms => { await press(); await page.waitForTimeout(ms); await lift(); };
  const waitPhase = async (ph, max = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { const s = await st(); if (ph.includes(s.phase)) return s; await page.waitForTimeout(30); } throw new Error('timed out waiting for ' + ph + ' at ' + JSON.stringify(await st())); };
  const lines = async () => (await page.$eval('#lines', e => e.innerText)).replace(/\n+/g, ' | ');
  const big = async () => (await page.$eval('#big', e => e.innerText)).replace(/\n+/g, ' / ');
  const result = async (tag) => { say(`  ${tag}: ${await big()} || ${await lines()}`); };

  async function evening(tag, player, opts) {
    opts = opts || {};
    say(`\nEVENING ${tag} (${player})`);
    await page.click(opts.again ? '#again' : '#begin'); await page.waitForTimeout(300);
    const info = await G(); const L = info.voices, P = info.plan;
    say(`  number ${info.seed}: low ${L.low.T} s, middle ${L.middle.T} s, high ${L.high.T} s, top ${L.top.T} s; three turns of the wheel at ${info.countRatio.toFixed(2)} of the voice; crowd ${P.present.join(', ')}; the low one ${P.lowStart}–${P.lowEnd} s of ${P.end} s`);
    const S = (n) => opts.shots ? shot(`${tag.toLowerCase()}-${n}`) : Promise.resolve();
    // 1 the low one
    await S('1-intro'); await tap(); await waitPhase(['ready']); await S('1-ready'); await hold(L.low.T * 1000 * (player === 'shaky' ? 0.8 : 0.95)); await waitPhase(['result']); await result('1 the low one'); await S('1-result'); await noScroll('station'); await page.click('#next'); await page.waitForTimeout(250);
    // 2 the middle one
    await tap(); await waitPhase(['ready']); await hold(L.middle.T * 1000 * 1.08); await waitPhase(['result']); await result('2 the middle one'); await S('2-result'); await page.click('#next'); await page.waitForTimeout(250);
    // 3 one back (How to play opened and closed first, on evening A)
    if (opts.help) { await page.click('#round .q'); await page.waitForTimeout(200); await S('help'); await page.click('#helpback'); await page.waitForTimeout(200); say('  How to play opened and closed; still at ' + JSON.stringify(await st())); }
    await S('3-ready'); await hold(L.low.T * 1000 * 0.9); await waitPhase(['result']); await result('3 one back'); await S('3-result'); await page.click('#next'); await page.waitForTimeout(250);
    // 4 through static
    await tap(); await waitPhase(['ready']); await S('4-ready'); await hold(L.middle.T * 1000 * 1.15); await waitPhase(['result']); await result('4 through static'); await S('4-result'); await page.click('#next'); await page.waitForTimeout(250);
    // 5 against a voice
    await S('5-ready'); const target5 = player === 'learned' ? L.top.T : player === 'pulled' ? Math.sqrt(L.top.T * L.low.T) * (L.top.T > L.low.T ? 1.15 : 0.87) : L.low.T;
    await hold(target5 * 1000 + 350); await waitPhase(['result']); await result('5 against a voice'); await S('5-result'); await page.click('#next'); await page.waitForTimeout(250);
    // 6 the silence
    await tap(); await waitPhase(['ready']); await S('6-ready'); await page.waitForTimeout(700);
    if (player === 'learned' || player === 'pulled') await hold(info.countRatio * L.high.T * 1000); else await hold(L.high.T * 1000 * 1.02);
    await waitPhase(['result']); await result('6 the silence'); await S('6-result'); await page.click('#next'); await page.waitForTimeout(250);
    // 7 the tumult
    await S('7-intro'); await tap(); await waitPhase(['ready']); await S('7-ready'); await press(); await page.waitForTimeout(1200); await S('7-holding');
    if (player === 'learned') await page.waitForTimeout((P.end - 1.2) * 1000 + 300); else await page.waitForTimeout((P.lowEnd - 1.2 + (player === 'pulled' ? 0.45 : 0.1)) * 1000);
    await lift(); await waitPhase(['heard']); await result('7 the tumult'); await S('7-heard');
    const picks = player === 'learned' ? ['low', 'middle', 'high'] : player === 'pulled' ? P.present.filter(id => id !== 'stranger').concat(P.present.includes('top') ? [] : ['top']) : P.present;
    for (const id of picks) await page.click('#chips button[data-id="' + id + '"]');
    await page.click('#heardgo'); await waitPhase(['result']); await result('7 the crowd named'); await S('7-result'); await page.click('#next'); await page.waitForTimeout(250);
    // 8 the last silence
    await S('8-ready'); await tap(); await waitPhase(['count']); await S('8-count'); await page.waitForTimeout(L.low.T * 1000 * (player === 'memory' ? 0.97 : 0.8)); await tap(); await waitPhase(['result']); await result('8 the last silence'); await S('8-result');
    await page.click('#next'); await page.waitForTimeout(2600);
    say('  LAST PAGE: ' + await page.$eval('#headline', e => e.innerText));
    say('  ' + (await page.$eval('#did', e => e.innerText)).replace(/\n+/g, ' | '));
    await S('end'); if (opts.shots) await shot(`${tag.toLowerCase()}-end-full`, true); await noScroll('last page');
  }

  await page.goto('file://' + path.join(__dirname, 'augustines-clock.html'));
  await shot('start'); await noScroll('start');
  await page.click('[data-about]'); await page.waitForTimeout(200); await shot('about', true); await noScroll('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  await evening('A', 'pulled', { shots: true, help: true });
  const seedA = (await G()).seed;
  await evening('B', 'memory', { again: true, shots: false });
  await page.goto('about:blank'); await page.goto('file://' + path.join(__dirname, 'augustines-clock.html') + '#e=' + seedA); await page.waitForTimeout(300);
  await evening('C', 'learned', { shots: false });
  say(`\nevening C used evening A's number (${seedA}) by its address: ${(await G()).seed === seedA}`);
  say('page errors: ' + (errs.length ? errs.join(' | ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), out.join('\n') + '\n');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
