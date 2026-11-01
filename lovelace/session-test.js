// Full session in a real headless browser at phone width. Run: node session-test.js  (writes session-log.txt and screenshots)
// Session A, the memo's stranger: task 1 three cards; task 2 the straight chain (held on the given numbers, fell at n = 3), help opened
// and returned mid-task, the chain taken down and a cycle hung (held); task 3 the difference cycle; verdict; the Countess's chain; About.
// Session B: play again, hand task 2 to the Countess after two runs; the verdict that says so.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const L = []; const say = s => { L.push(s); console.log(s); };
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 380, height: 760 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/gc\.zgo\.at|goatcounter|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, 'lovelaces-cards.html')); await page.waitForTimeout(600);
  const shot = async (name, full) => { await page.screenshot({ path: path.join(__dirname, `screenshot-${name}.png`), fullPage: full !== false }); say('  shot ' + name); };
  const noScroll = async () => { const w = await page.evaluate(() => document.documentElement.scrollWidth); if (w > 380) say(`  !! horizontal scroll: ${w}px`); };
  const text = async sel => (await page.$eval(sel, e => e.innerText)).replace(/\n+/g, ' | ');
  const vis = async sel => page.$eval(sel, e => !e.classList.contains('hidden') && e.offsetParent !== null);
  const col = async name => { const i = await page.$$eval('#store .col .sq', (es, nm) => es.findIndex(e => e.textContent.trim() === nm), name); if (i < 0) throw new Error('no column ' + name); await page.click(`#store .col[data-i="${i}"]`); await page.waitForTimeout(60); };
  const punch = async key => { await page.click(`#punches .punch[data-key="${key}"]`); await page.waitForTimeout(60); };
  const hang = async (...steps) => { // ['*','a','n','R'] | ['print','R'] | ['back',2,'n']
    const k = steps[0]; await punch(k);
    if (k === 'back') { await page.click(`#counts .punch:nth-child(${steps[1]})`); await col(steps[2]); }
    else for (const s of steps.slice(1)) await col(s);
    const pv = await text('#preview'); if (await page.$eval('#hangbtn', b => b.disabled)) say('  !! HANG disabled for ' + pv);
    await page.click('#hangbtn'); await page.waitForTimeout(80); say(`   hung: ${pv}`);
  };
  const go = async (label) => {
    if (await page.$eval('#gobtn', b => b.disabled)) say('  !! GO disabled');
    await page.click('#gobtn'); say(`   SET THE ENGINE GOING (${label})`);
    for (let k = 0; k < 120 && !(await page.$eval('#result', e => e.textContent.trim().length > 0)); k++) await page.waitForTimeout(400);
    say('   strip: wanted ' + (await page.$$eval('#swant div', es => es.map(e => e.textContent).join(' '))) + ' · printed ' + (await page.$$eval('#sgot div', es => es.map(e => e.textContent + (e.classList.contains('ok') ? '✓' : '✗')).join(' '))));
    say('   bell: ' + (await page.$eval('#bell', e => e.classList.contains('on') ? e.querySelector('.word').textContent : 'off')));
    say('   LINE: ' + await text('#result'));
    say(`   buttons: next=${await vis('#nextbtn')} hand=${await vis('#handbtn')} go=${!(await page.$eval('#gobtn', b => b.disabled || b.classList.contains('hidden')))}`);
    await noScroll();
  };
  const chain = async () => say('   chain: ' + (await page.$$eval('#cards .hung .txt', es => es.map(e => e.firstChild.textContent).join(' | ')) || '(empty)'));
  await shot('start'); await noScroll();
  // ---- session A
  await page.click('#begin'); await page.waitForTimeout(400); say('== TOUR: ' + await text('#dband')); say('   ' + await text('#dintro')); await shot('tour-start');
  for (let k = 0; k < 12; k++) { const lbl = await text('#dnext'); if (/first job/i.test(lbl)) break; await page.click('#dnext'); await page.waitForTimeout(150); say('   step: ' + await text('#dnarr')); if (k === 1) await shot('tour-step'); }
  await shot('tour-end'); await page.click('#dnext'); await page.waitForTimeout(400);
  say('== ' + await text('#band')); say('   ' + await text('#want')); await shot('a-task1');
  await punch('*'); await col('a'); await shot('a-task1-composing', false);
  await col('n'); await col('R'); say('   sentence: ' + await text('#sentence')); await shot('a-task1-card-ready', false); await page.click('#hangbtn'); say('   hung: ' + await page.$eval('#cards .hung .txt', e => e.textContent)); say('   first-card line: ' + await text('#first'));
  await hang('*', 'R', 'x', 'R'); await hang('print', 'R'); await chain(); await shot('a-task1-chain');
  await go('task 1'); await shot('a-task1-bell');
  await page.click('#nextbtn'); await page.waitForTimeout(400); say('\n== ' + await text('#band')); say('   ' + await text('#want')); await shot('a-task2');
  await hang('*', 'a', 'x', 'R'); for (let k = 0; k < 4; k++) await hang('*', 'R', 'x', 'R'); await hang('print', 'R'); await chain(); await shot('a-task2-straight');
  await go('task 2, straight'); await shot('a-task2-fell');
  // help mid-task and back
  await page.click('#backdemo'); await page.waitForTimeout(300); say('   COUNTDOWN: ' + await text('#dintro'));
  for (let k = 0; k < 14; k++) { const lbl = await text('#dnext'); if (/^back$/i.test(lbl.trim())) break; await page.click('#dnext'); await page.waitForTimeout(120); if (k === 5) await shot('countdown-mid'); }
  say('   countdown printed: ' + (await page.$$eval('#dgot div', es => es.map(e => e.textContent).join(' '))) + ' · ' + await text('#dnarr')); await shot('countdown-end');
  await page.click('#dnext'); await page.waitForTimeout(300); say(`   back from countdown: on play=${await page.$eval('#play', e => e.classList.contains('on'))}, chain kept=${await page.$$eval('#cards .hung', es => es.length)} cards`);
  await page.click('#play .help-q'); await page.waitForTimeout(200); await shot('help'); await page.click('#helpback'); await page.waitForTimeout(200);
  say(`   help opened and returned: on play=${await page.$eval('#play', e => e.classList.contains('on'))}, chain kept=${await page.$$eval('#cards .hung', es => es.length)} cards`);
  // take down the chain, hang the cycle
  while (await page.$('#cards .hung')) { await page.click('#cards .hung'); await page.waitForTimeout(40); }
  say('   all cards taken down; strip cleared: ' + (await page.$$eval('#sgot div', es => es.length)) + ' printed lines, result line "' + await text('#result') + '"');
  await hang('*', 'a', '1', 'R'); await hang('*', 'R', 'x', 'R'); await hang('-', 'n', '1', 'n'); await hang('back', 2, 'n'); await shot('a-task2-back-composed', false); await hang('print', 'R'); await chain(); await shot('a-task2-cycle');
  await page.click('#gobtn'); await page.waitForTimeout(1500); await shot('a-task2-running', false);
  for (let k = 0; k < 120 && !(await page.$eval('#result', e => e.textContent.trim().length > 0)); k++) await page.waitForTimeout(400);
  say('   LINE: ' + await text('#result')); say('   countess: ' + await text('#countess')); await shot('a-task2-held');
  await page.click('#nextbtn'); await page.waitForTimeout(400); say('\n== ' + await text('#band')); say('   ' + await text('#want'));
  say('   punches disabled: ' + (await page.$$eval('#punches .punch', es => es.filter(b => b.disabled).map(b => b.dataset.key).join(','))));
  await shot('a-task3');
  await hang('print', 'A'); await hang('+', 'A', 'B', 'A'); await hang('+', 'B', 'C', 'B'); await hang('-', 'n', '1', 'n'); await hang('back', 4, 'n'); await chain();
  await go('task 3'); await shot('a-task3-held');
  await page.click('#nextbtn'); await page.waitForTimeout(500);
  say('\nVERDICT: ' + await text('#headline')); say('  ' + await text('#did')); await shot('a-end');
  await page.click('#codabtn'); await page.waitForTimeout(1200); await shot('a-coda-working', false);
  for (let k = 0; k < 60 && !(await page.$eval('#codaline', e => e.textContent.length > 0)); k++) await page.waitForTimeout(400);
  say('  CODA: ' + await text('#codastrip') + ' || ' + await text('#codaline')); await shot('a-coda');
  await page.click('#end [data-go="about"]'); await page.waitForTimeout(300); await shot('about'); await page.click('#aboutback'); await page.waitForTimeout(200);
  say('  back on end: ' + await page.$eval('#end', e => e.classList.contains('on')));
  // ---- session B: hand task 2 over
  await page.click('#again'); await page.waitForTimeout(400); say('\n== B: ' + await text('#band'));
  await hang('*', 'a', 'n', 'R'); await hang('*', 'R', 'x', 'R'); await hang('print', 'R'); await go('B task 1'); await page.click('#nextbtn'); await page.waitForTimeout(300);
  say('== B: ' + await text('#band')); await hang('*', 'a', 'x', 'R'); await hang('print', 'R'); await go('B task 2, run 1'); await go('B task 2, run 2'); await shot('b-handover-offered');
  await page.click('#handbtn'); await page.waitForTimeout(2500); await shot('b-countess-running', false);
  for (let k = 0; k < 120 && !(await vis('#nextbtn')); k++) await page.waitForTimeout(400);
  say('   her chain: ' + (await page.$$eval('#cards .hung .txt', es => es.map(e => e.firstChild.textContent).join(' | ')))); say('   result: ' + await text('#result')); say('   countess: ' + await text('#countess')); await shot('b-countess-done'); say('   next: ' + await text('#nextbtn'));
  await page.click('#nextbtn'); await page.waitForTimeout(300); say('== B: ' + await text('#band'));
  await hang('print', 'A'); await hang('+', 'A', 'B', 'A'); await hang('+', 'B', 'C', 'B'); await hang('-', 'n', '1', 'n'); await hang('back', 4, 'n'); await go('B task 3');
  await page.click('#nextbtn'); await page.waitForTimeout(400); say('\nVERDICT B: ' + await text('#headline')); say('  ' + await text('#did')); await shot('b-end'); await noScroll();
  say('\nerrors: ' + (errors.length ? errors.join(' // ') : 'none'));
  fs.writeFileSync(path.join(__dirname, 'session-log.txt'), L.join('\n') + '\n');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
