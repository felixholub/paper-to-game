// Lovelace's Cards — the loom. The only copy: solve.js runs it in Node to compute every puzzle's par, build.py inlines it.
// The machine counts the way the Notes say an Engine counts: with numbers in the Store and cards that operate on them.
//   - A wheel (A, B or C) is a number in the Store. Every wheel starts at 0.
//   - A stitch card weaves one stitch.
//   - A Set card puts a number on a wheel, whatever it showed before (a card of numbers, Memoir p. 15). It is the only way
//     a wheel gets a number.
//   - A Go back card is Lovelace's Operation 7 joined to her backing (Note G; Note C): it takes 1 from its wheel, and the
//     machine "feels" the result: if the wheel is not yet 0 it goes back to the card named (any card above it, a Set card
//     included); if it is 0 it carries on. (Menabrea's counter, likewise, has a unit taken off each time "until it only
//     marks zero".)
// Nothing resets a wheel by itself: a loop inside a loop needs the outer loop to pass the inner wheel's Set card on every
// round. A wheel taken below 0 never comes back to 0 by taking 1 off, so the machine runs on; the attendant stops it.
(function (root) {
  'use strict';
  // chain: [{k:'r'|'b'|'g'} | {k:'back', w:0|1|2, to:index} | {k:'set', w:0|1|2, v:n}]
  function weave(chain, start, target, wantEvents, cap) {
    const wh = (start || [0, 0, 0]).slice(); const out = []; const ev = wantEvents ? [] : null;
    cap = cap || 4000;
    let pc = 0, steps = 0;
    while (pc < chain.length) {
      if (++steps > cap) return { out, ev, status: 'cap', wheels: wh };
      const c = chain[pc];
      if (c.k === 'back') {
        wh[c.w]--;
        if (wh[c.w] !== 0) { if (ev) ev.push({ t: 'back', i: pc, w: c.w, now: wh[c.w], to: c.to }); pc = c.to; }
        else { if (ev) ev.push({ t: 'zero', i: pc, w: c.w, now: 0 }); pc++; }
        continue;
      }
      if (c.k === 'set') { wh[c.w] = c.v; if (ev) ev.push({ t: 'set', i: pc, w: c.w, now: c.v }); pc++; continue; }
      out.push(c.k); if (ev) ev.push({ t: 'stitch', i: pc, c: c.k });
      if (target) { const n = out.length - 1; if (n >= target.length || out[n] !== target[n]) return { out, ev, status: 'wrong', wheels: wh }; }
      pc++;
    }
    return { out, ev, status: target ? (out.length === target.length ? 'ok' : 'short') : 'done', wheels: wh };
  }

  // Fewest cards that weave the target exactly, with at most `wheels` wheels and Set values 1..WMAX.
  // Exhaustive, by iterative deepening on the number of cards, and execution-guided: the machine is run while the chain is
  // being written. Because Go back only ever jumps upward, the machine first reaches position i by falling through from i−1,
  // exactly when the chain is i cards long; that is when card i is chosen. A Set card's number is not guessed up front: the
  // wheel carries "that Set card's number, minus d", and the number is fixed at the first Go back that has to decide. There
  // the search branches: the wheel is at 0 now (the number is d), or not yet (the number is more than d). This covers every
  // number from 1 to WMAX exactly once, without trying them one by one. Every branch is checked stitch by stitch against the
  // order. Sound prunes: a stitch card must be the stitch the order wants next (it is woven the moment it is added); a Go back
  // on a wheel needs a Set card for that wheel above it (otherwise the wheel goes 0, −1, −2 … and never returns to 0); wheel B
  // only once wheel A has a Set card, C only once B has (the wheels are interchangeable).
  const WMAX = 12;
  function solve(target, wheels, maxLen) {
    const T = target, N = T.length, vmax = Math.min(WMAX, N), cap = 30 * N + 60;
    const put = (wh, w, x) => { const a = wh.slice(); a[w] = x; return a; };
    for (let Lmax = 1; Lmax <= maxLen; Lmax++) {
      const chain = []; let found = null;
      const run = (pc, wh, n, steps, vals, lb) => {
        for (;;) {
          if (++steps > cap) return false;
          if (pc === chain.length) {
            if (n === N) { found = chain.map((c, i) => c.k === 'set' ? { ...c, v: vals[i] !== undefined ? vals[i] : Math.max(1, lb[i] || 1) } : { ...c }); return true; }
            if (chain.length === Lmax) return false;
            chain.push({ k: T[n] });
            if (run(pc, wh, n, steps, vals, lb)) return true;
            chain.pop();
            for (let w = 0; w < wheels; w++) {
              if (w > 0 && !chain.some(c => c.k === 'set' && c.w === w - 1)) continue;
              if (typeof wh[w] === 'object' && wh[w].d === 0) continue;       // the wheel was just set and never read: a second Set is waste
              { const prev = chain[chain.length - 1]; if (prev && prev.k === 'set' && prev.w > w) continue; }   // adjacent Sets in wheel order only (they commute)
              chain.push({ k: 'set', w });
              if (run(pc, wh, n, steps, vals, lb)) return true;
              chain.pop();
            }
            for (let w = 0; w < wheels; w++) {
              if (!chain.some(c => c.k === 'set' && c.w === w)) continue;
              if (typeof wh[w] === 'number' && wh[w] <= 0) continue;         // the wheel shows 0 already: taking 1 off would run for ever
              for (let t = 0; t < chain.length; t++) {
                if (chain[t].k === 'back') continue;
                if (chain[t].k === 'set' && chain[t].w === w) continue;        // back to its own Set card: the number is put back every round, never 0
                chain.push({ k: 'back', w, to: t });
                if (run(pc, wh, n, steps, vals, lb)) return true;
                chain.pop();
              }
            }
            return false;
          }
          const c = chain[pc];
          if (c.k === 'set') { wh = put(wh, c.w, vals[pc] !== undefined ? vals[pc] : { s: pc, d: 0 }); pc++; continue; }
          if (c.k === 'back') {
            const x = wh[c.w];
            if (typeof x === 'number') { wh = put(wh, c.w, x - 1); pc = x - 1 !== 0 ? c.to : pc + 1; continue; }
            const d = x.d + 1, lo = lb[x.s] || 1;
            if (d >= lo && d <= vmax) {                       // the number was d: the wheel shows 0, carry on
              const v2 = vals.slice(); v2[x.s] = d;
              if (run(pc + 1, put(wh, c.w, 0), n, steps, v2, lb)) return true;
            }
            if (d + 1 > vmax) return false;                   // the number is more than d: not 0 yet, go back
            lb = lb.slice(); lb[x.s] = Math.max(lo, d + 1);
            wh = put(wh, c.w, { s: x.s, d }); pc = c.to; continue;
          }
          if (n >= N || T[n] !== c.k) return false;
          n++; pc++;
        }
      };
      if (run(0, [0, 0, 0], 0, 0, [], [])) return { par: found.length, chain: found, start: [0, 0, 0] };
    }
    return null;
  }

  const L = { weave, solve, WMAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.LOOM = L;
})(typeof window !== 'undefined' ? window : globalThis);
