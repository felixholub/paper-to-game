// Browser session test (build step 6): drives home-judges.html at 380 px through a full session:
// round 1 seated as a first-timer would, help opened mid-round and returned from, a naive round 2 attempt, RESET, a solve,
// the verdict, About, and a replay. Run: node session-test.js [outdir] > session-log.txt   (needs playwright)
const { chromium } = require('playwright');
const D = (process.argv[2] || __dirname) + '/';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/home-judges.html'); await p.waitForTimeout(300);
  const txt = sel => p.$eval(sel, e => e.innerText.replace(/\n+/g, ' / '));
  const on = id => p.$eval(id, e => e.classList.contains('on'));
  const sw = async () => { const w = await p.evaluate(() => document.documentElement.scrollWidth); if (w > 380) errs.push('horizontal scroll ' + w); return w; };
  const shot = async (n, full = true) => { await p.screenshot({ path: D + 'screenshot-' + n + '.png', fullPage: full }); console.log(`  [screenshot-${n}.png] scrollWidth ${await sw()}`); };
  console.log('START: ' + await txt('#aim-start')); await shot('start');
  await p.click('#b-play'); await p.waitForTimeout(200); console.log('rules on:', await on('#s-rules')); await shot('rules');
  await p.click('#b-r1'); await p.waitForTimeout(200); console.log('round 1 on:', await on('#s-r1')); await shot('r1-empty');
  // a first-timer mirrors who applies
  const order = ['DE/DE', 'DE/DE', 'UK/UK', 'UK/UK', 'FR/FR', 'IT/IT', 'ES/ES', 'IT/UK', 'NL/NL', 'PL/PL', 'SE/SE', 'PT/PT', 'GR/GR', 'IL/IL', 'DE/CH'];
  for (let k = 0; k < order.length; k++) {
    const [pp, ww] = order[k].split('/');
    const ids = await p.$$eval(`#pool .jc:not(.ghost)[data-p="${pp}"][data-w="${ww}"]`, els => els.map(e => e.dataset.id));
    await p.click(`#pool .jc[data-id="${ids[0]}"]`); await p.waitForTimeout(60);
    if (k === 0) console.log('  info after first tap: ' + await txt('#info1'));
    if (k === 6) { await shot('r1-half'); await p.click('#s-r1 [data-help]'); console.log('  help on:', await on('#s-help')); await shot('help');
      await p.click('#b-help-back'); console.log('  back on round 1:', await on('#s-r1'), '| seated kept:', await txt('#cnt1')); }
    if (k === 7) console.log('  info for IT/UK: ' + await txt('#info1'));
  }
  await p.waitForTimeout(900);
  console.log('REVEAL: ' + await txt('#r1-reveal')); console.log('  bars: ' + await txt('#groups1'));
  await p.evaluate(() => window.scrollTo(0, 0)); await shot('r1-reveal');
  await p.click('#b-r2'); await p.waitForTimeout(300); console.log('round 2 on:', await on('#s-r2'), '|', await txt('#groups2 .agg')); await shot('r2-start');
  const seatOf = code => { const [a, w] = code.split('/'); return p.$eval(`#table2 .jc[data-p="${a}"][data-w="${w}"]`, e => e.dataset.seat); };
  const benchOf = code => { const [a, w] = code.split('/'); return p.$eval(`#bench .jc[data-p="${a}"][data-w="${w}"]`, e => e.dataset.bench); };
  const doSwap = async (o, i) => { await p.click(`#table2 .jc[data-seat="${await seatOf(o)}"]`); await p.waitForTimeout(80); await p.click(`#bench .jc[data-bench="${await benchOf(i)}"]`); await p.waitForTimeout(500);
    console.log(`  swap ${o} -> ${i}: ${await txt('#info2')} | ${await txt('#groups2 .agg')}`); };
  await doSwap('GR/GR', 'PT/PT'); await shot('r2-naive');
  await p.click('#b-reset'); await p.waitForTimeout(200); console.log('  RESET:', await txt('#groups2 .agg'), '| pips used', await p.$$eval('.pip.used', x => x.length));
  await doSwap('DE/DE', 'PT/PT'); await doSwap('IT/UK', 'FI/FI'); await doSwap('UK/UK', 'NO/NO');
  await p.waitForTimeout(500); console.log('RESULT: ' + await txt('#r2-result')); await shot('r2-level');
  await p.click('#b-end'); await p.waitForTimeout(300); console.log('VERDICT: ' + await txt('#verdict')); await p.evaluate(() => window.scrollTo(0, 0)); await shot('end');
  await p.click('#b-about-end'); console.log('about on', await on('#s-about')); await shot('about'); await p.click('#b-about-back'); console.log('back on end', await on('#s-end'));
  // replay: a diverse first panel, then DONE in round 2 without levelling
  await p.click('#b-again'); await p.click('#b-r1'); await p.waitForTimeout(200);
  const pool = await p.$$eval('#pool .jc', els => els.map(e => e.dataset.id));
  for (const id of pool.slice(9)) { await p.click(`#pool .jc[data-id="${id}"]`); await p.waitForTimeout(30); }
  await p.waitForTimeout(800); console.log('REPLAY REVEAL: ' + await txt('#r1-reveal'));
  await p.click('#b-r2'); await p.waitForTimeout(200); await doSwap('ES/ES', 'US/US'); await p.click('#b-done'); await p.waitForTimeout(400);
  console.log('REPLAY RESULT: ' + await txt('#r2-result')); await shot('r2-notyet');
  await p.click('#b-end'); await p.waitForTimeout(200); console.log('REPLAY VERDICT: ' + (await txt('#verdict')).split(' / ')[0]);
  console.log('errors', errs); await b.close(); process.exitCode = errs.length ? 1 : 0;
})();
