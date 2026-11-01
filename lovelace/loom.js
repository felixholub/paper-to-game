// Lovelace's Cards — the loom. The only copy: solve.js runs it in Node to compute every puzzle's par, build.py inlines it.
// The machine counts the way the Notes say an Engine counts: with numbers in the Store and cards that operate on them.
//   - A wheel (A or B) is a number in the Store. Its starting value is put on by hand before the run, as Note B inscribes
//     the data on the columns.
//   - A stitch card weaves one stitch.
//   - A Go back card is Lovelace's Operation 7 joined to her backing (Note G; Note C): it takes 1 from its wheel, and the
//     machine "feels" the result: if the wheel is not yet 0 it goes back to the card named; if it is 0 it carries on.
//     (Menabrea's counter, likewise, has a unit taken off each time "until it only marks zero".)
//   - A Set card puts a number on a wheel (a card of numbers, Memoir p. 15). Nothing resets a wheel by itself: a loop inside
//     a loop needs the inner wheel set again by a card on every round of the outer one.
// A wheel taken below 0 never comes back to 0, so a Go back on it sends the machine round for ever; the attendant stops it.
(function (root) {
  'use strict';
  // chain: [{k:'r'|'b'|'g'} | {k:'back', w:0|1, to:index} | {k:'set', w:0|1, v:n}] ; start: [A, B]
  function weave(chain, start, target, wantEvents, cap) {
    const wh = start.slice(); const out = []; const ev = wantEvents ? [] : null;
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

  // Fewest cards that weave the target exactly, with at most `wheels` wheels; every number (a wheel's start, a Set card's value)
  // tried from 1 to WMAX. Exhaustive, with sound prunes: before the first Go back card, stitches are woven straight, so they must
  // match the target's opening; a Go back may only name a stitch card; a Set card is only useful on a wheel some Go back uses.
  const WMAX = 12;
  function solve(target, wheels, maxLen) {
    const cols = [...new Set(target)];
    const cap = 40 * target.length + 50;
    const vmax = Math.min(WMAX, target.length);
    for (let L = 1; L <= maxLen; L++) {
      const chain = new Array(L); let found = null;
      const tryNumbers = () => {
        const used = [...new Set(chain.filter(c => c.k === 'back').map(c => c.w))];
        if (chain.some(c => c.k === 'set' && !used.includes(c.w))) return null;
        const sets = chain.filter(c => c.k === 'set');
        const slots = [...used.map(w => ({ kind: 'start', w })), ...sets.map(c => ({ kind: 'set', c }))];
        const start = [1, 1];
        const rec = j => {
          if (j === slots.length) return weave(chain, start, target, false, cap).status === 'ok' ? { start: start.slice(), vals: sets.map(c => c.v) } : null;
          const s = slots[j];
          for (let v = 1; v <= vmax; v++) {
            if (s.kind === 'start') start[s.w] = v; else s.c.v = v;
            const r = rec(j + 1); if (r) return r;
          }
          return null;
        };
        return rec(0);
      };
      const dfs = (i, sawBack) => {
        if (found) return;
        if (i === L) {
          if (!sawBack && chain.some(c => c.k === 'set')) return;
          const r = tryNumbers(); if (r) found = { chain: chain.map(c => ({ ...c })), start: r.start }; return;
        }
        for (const c of cols) {
          if (!sawBack && (i >= target.length || target[i] !== c)) continue;
          chain[i] = { k: c }; dfs(i + 1, sawBack); if (found) return;
        }
        if (i === 0) return;
        for (let w = 0; w < wheels; w++) {
          if (w === 1 && !chain.slice(0, i).some(c => (c.k === 'back' || c.k === 'set') && c.w === 0)) continue; // B only after A (symmetry)
          for (let to = 0; to < i; to++) { if (chain[to].k === 'back' || chain[to].k === 'set') continue; chain[i] = { k: 'back', w, to }; dfs(i + 1, true); if (found) return; }
          chain[i] = { k: 'set', w, v: 1 }; dfs(i + 1, sawBack); if (found) return;
        }
      };
      dfs(0, false);
      if (found) return { par: L, ...found };
    }
    return null;
  }

  const L = { weave, solve, WMAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.LOOM = L;
})(typeof window !== 'undefined' ? window : globalThis);
