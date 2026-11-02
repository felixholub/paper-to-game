// Scripted session in headless Chromium at phone width. Run: node session-test.js
// Plays the whole game with the solver's chains: loom 1 by hand with one deliberate mistake, then "Leave this loom" to check the
// way out; looms 2–6 at par; the fork after the sixth bell; both extra looms and the final loom; the switch screen (threads run
// on arrival, the way on visible); the last order; the coda; the verdict with every row.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'lovelaces-cards.html')); await page.waitForTimeout(400);
  const say = s => console.log(s);
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\s+/g, ' ').trim();
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const btn = async label => { const b = await page.$(`xpath=//button[normalize-space()="${label}"]`); if (!b) throw new Error('no button ' + label); await b.click(); await page.waitForTimeout(150); };
  // hang the solver's chain for the current loom through the real tray and card controls
  const hangSolution = async () => {
    const { sol, wheels } = await page.evaluate(() => { const p = window.LOVELACE.looms()[window.LOVELACE.loom()]; return { sol: p.sol, wheels: p.wheels }; });
    for (const c of sol) {
      if (c.k === 'set') { await page.click(`#tray .card:has-text("Set")${wheels > 1 ? `:has-text("wheel ${'ABC'[c.w]}")` : ''}`); }
      else if (c.k === 'back') { await page.click(`#tray .card:has-text("Go back and count down")${wheels > 1 ? `:has-text("wheel ${'ABC'[c.w]}")` : ''}`); }
      else { await page.click(`#tray .card:has-text("${{ r: 'Red', b: 'Blue', g: 'Gold' }[c.k]} stitch")`); }
      await page.waitForTimeout(40);
    }
    // numbers and targets, card by card
    const cards = await page.$$('#chain .card');
    for (let i = 0; i < sol.length; i++) {
      const c = sol[i];
      if (c.k === 'set') await cards[i].$eval('select', (s, v) => { s.value = String(v); s.dispatchEvent(new Event('change')); }, c.v);
      if (c.k === 'back') { const fresh = (await page.$$('#chain .card'))[i]; await fresh.$eval('select', (s, v) => { const o = [...s.options].find(o => o.textContent === 'card ' + (v + 1)); s.value = o.value; s.dispatchEvent(new Event('change')); }, c.to); }
    }
    await page.waitForTimeout(60);
  };
  const run = async () => { await btn('Run the loom'); await page.waitForFunction(() => document.querySelector('#result').classList.contains('on'), null, { timeout: 60000 }); await page.waitForTimeout(100); return text('#result'); };

  say('START: ' + await text('#s-start p.small')); await noScroll();
  await btn('Begin');
  // loom 1: a deliberate mistake, then leave
  say('LOOM 1: ' + await text('#which') + ' / ' + await text('#ltitle'));
  await page.click('#tray .card >> nth=0'); await page.click('#tray .card >> nth=0');
  say('  fail: ' + (await run()).slice(0, 90));
  say('  after a fail: ' + (await page.$$eval('#after .btn', es => es.map(e => e.innerText))).join(' | '));
  await btn('Leave this loom'); say('  after leaving: ' + (await page.$$eval('#after .btn', es => es.map(e => e.innerText))).join(' | '));
  await btn('Next loom');
  for (let n = 2; n <= 6; n++) {
    say(`LOOM ${n}: ` + await text('#which') + ' / ' + await text('#ltitle')); await noScroll();
    await hangSolution(); const r = await run(); say('  ' + r.slice(0, 80));
    if (!/Bell/.test(r)) { say('  !! no bell'); break; }
    const after = await page.$$eval('#after .btn', es => es.map(e => e.innerText)); say('  after: ' + after.join(' | '));
    if (n < 6) await btn('Next loom');
  }
  await btn('Two more looms, even harder');
  for (const step of ['The second of the two', 'One final loom, the toughest', 'Go on to the end']) {
    say('EXTRA: ' + await text('#which') + ' / ' + await text('#ltitle') + ' / ' + (await text('#lsay')).slice(0, 60)); await noScroll();
    await hangSolution(); const r = await run(); say('  ' + r.slice(0, 80));
    say('  after: ' + (await page.$$eval('#after .btn', es => es.map(e => e.innerText))).join(' | '));
    await btn(step);
  }
  // switch: threads should run by themselves; the way on is visible
  await page.waitForFunction(() => document.querySelector('#result4').classList.contains('on'), null, { timeout: 60000 });
  say('SWITCH: ' + (await text('#result4')).slice(0, 70) + ' | next visible: ' + await page.$eval('#next4', e => e.offsetParent !== null)); await noScroll();
  await page.click('#switch button[data-m="numbers"]'); await btn('Run the cards');
  await page.waitForFunction(() => document.querySelector('#result4').classList.contains('on'), null, { timeout: 60000 });
  say('  sums: ' + (await text('#result4')).slice(0, 80));
  await btn('One last order'); await btn('Run the machine anyway');
  await page.waitForFunction(() => document.querySelector('#resultlast').classList.contains('on'));
  say('LAST: ' + (await text('#resultlast')).slice(0, 60));
  await btn("Watch Lovelace's own chain"); await btn('Run her chain');
  await page.waitForFunction(() => document.querySelector('#resultcoda').classList.contains('on'), null, { timeout: 60000 });
  say('CODA: ' + (await text('#strip')).slice(0, 120));
  await btn('How did you do?');
  say('VERDICT: ' + (await text('#verdict')).slice(0, 700)); await noScroll();
  say(errors.length ? 'ERRORS: ' + errors.join(' / ') : 'no page errors');
  await browser.close();
})().catch(e => { console.log('TEST FAILED: ' + e.message); process.exit(1); });
