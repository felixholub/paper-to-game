// Lovelace's Cards — the loom. The only copy: solve.js runs it in Node to compute every puzzle's par, build.py inlines it.
// A chain of cards is read from the top. A stitch card weaves one stitch. A Go back card belongs to a wheel and points at a card
// above it (Note C: the cards can be backed "to any particular card"). When the machine reaches it, the wheel clicks down one;
// if the wheel still shows more than nothing, the machine goes back to that card; if it shows nothing, the wheel springs back to
// its number and the machine carries on. So a Go back card makes the cards between its target and itself run exactly as many
// times as its wheel is set to, and a loop can sit inside a loop (Note E: the cycle of cycles).
(function (root) {
  'use strict';
  const CAP = 4000;
  // chain: [{k:'r'|'b'|'g'} | {k:'back', w:0|1, to:index}] ; set: [wheelA, wheelB]
  function weave(chain, set, target, wantEvents) {
    const left = set.slice(); const out = []; const ev = wantEvents ? [] : null;
    let pc = 0, steps = 0;
    while (pc < chain.length) {
      if (++steps > CAP) return { out, ev, status: 'cap' };
      const c = chain[pc];
      if (c.k === 'back') {
        left[c.w]--;
        if (left[c.w] > 0) { if (ev) ev.push({ t: 'back', i: pc, w: c.w, left: left[c.w], to: c.to }); pc = c.to; }
        else { left[c.w] = set[c.w]; if (ev) ev.push({ t: 'spring', i: pc, w: c.w, left: 0, set: set[c.w] }); pc++; }
        continue;
      }
      out.push(c.k); if (ev) ev.push({ t: 'stitch', i: pc, c: c.k });
      if (target) { const n = out.length - 1; if (n >= target.length || out[n] !== target[n]) return { out, ev, status: 'wrong' }; }
      pc++;
    }
    return { out, ev, status: target ? (out.length === target.length ? 'ok' : 'short') : 'done' };
  }

  // Fewest cards that weave the target exactly, with at most `wheels` wheels (each set 1..WMAX). Exhaustive, with one sound prune:
  // until the first Go back card, stitch cards are woven straight, so they must match the target's opening.
  const WMAX = 12;
  function solve(target, wheels, maxLen) {
    const cols = [...new Set(target)];
    for (let L = 1; L <= maxLen; L++) {
      const chain = new Array(L); let found = null;
      const tryWheels = () => {
        const used = [...new Set(chain.filter(c => c.k === 'back').map(c => c.w))];
        if (!used.length) { if (weave(chain, [1, 1], target).status === 'ok') return [1, 1]; return null; }
        const set = [1, 1];
        const rec = j => {
          if (j === used.length) return weave(chain, set, target).status === 'ok' ? set.slice() : null;
          for (let v = 2; v <= Math.min(WMAX, target.length); v++) { set[used[j]] = v; const r = rec(j + 1); if (r) return r; }
          set[used[j]] = 1; return null;
        };
        return rec(0);
      };
      const dfs = (i, sawBack) => {
        if (found) return;
        if (i === L) { const s = tryWheels(); if (s) found = { chain: chain.map(c => ({ ...c })), set: s }; return; }
        for (const c of cols) {
          if (!sawBack && (i >= target.length || target[i] !== c)) continue;
          chain[i] = { k: c }; dfs(i + 1, sawBack); if (found) return;
        }
        if (i === 0) return;
        for (let w = 0; w < wheels; w++) {
          if (w === 1 && !chain.slice(0, i).some(c => c.k === 'back' && c.w === 0)) continue; // wheel B only after A is in use (symmetry)
          for (let to = 0; to < i; to++) { if (chain[to].k === 'back') continue; chain[i] = { k: 'back', w, to }; dfs(i + 1, true); if (found) return; }
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
