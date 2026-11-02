// The red-figure rig: draws a man (or a woman) in profile, facing right, from a pose; stone climbs over the body in six bands.
// Display only: no rule of the game lives here. build.py inlines it into the page.
(function (root) {
  'use strict';
  const CLAY = '#C8693A', GLAZE = '#120D0B', DILUTE = '#8A4A26', WHITE = '#EAE0CC', ADDRED = '#7E2B1F';
  const STONE = '#271B15';   // a thing: glaze, a shade warmer than the ground so its shape still reads
  const rad = d => d * Math.PI / 180;
  const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];          // 0 = straight down, +90 = forward (+x), 180 = up
  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const f = n => (Math.round(n * 10) / 10).toString();
  const P = p => f(p[0]) + ' ' + f(p[1]);

  // a tapered limb from p along angle a: widths w1 → w2, a muscle bulge at fraction bp of size bw on side bs (+1 front, −1 back)
  function limb(p, a, len, w1, w2, bp, bw, bs) {
    const d = dir(a), n = [d[1], -d[0]];                              // n: the "front" side for a downward limb on a right-facing man
    const q = add(p, d, len);
    const m = add(p, d, len * bp);
    const wm = (w1 + (w2 - w1) * bp) / 2;
    const s = bs || 1;
    const A1 = add(p, n, w1 / 2), A2 = add(p, n, -w1 / 2), B1 = add(q, n, w2 / 2), B2 = add(q, n, -w2 / 2);
    const M1 = add(m, n, wm + (s > 0 ? bw : bw * 0.25)), M2 = add(m, n, -(wm + (s < 0 ? bw : bw * 0.25)));
    const C1 = add(add(M1, d, len * 0.18), [0, 0], 0), C2 = add(M2, d, len * 0.18);
    const d1 = `M${P(A1)} Q${P(add(M1, d, -len * 0.12))} ${P(M1)} Q${P(C1)} ${P(B1)}`;
    const cap = `A${f(w2 / 2)} ${f(w2 / 2)} 0 0 1 ${P(B2)}`;
    const d2 = `Q${P(C2)} ${P(M2)} Q${P(add(M2, d, -len * 0.12))} ${P(A2)} A${f(w1 / 2)} ${f(w1 / 2)} 0 0 1 ${P(A1)}Z`;
    return { d: d1 + ' ' + cap + ' ' + d2, end: q, mid: m, n, dir: d };
  }

  // the default pose: standing at rest, facing right
  const BASE = { x: 0, y: 0, torso: 0, head: 0, nearUA: 10, nearFA: 20, farUA: -8, farFA: 5, nearTh: 6, nearCa: 0, farTh: -6, farCa: -2,
    nearFoot: 90, farFoot: 90, spear: null, garment: 'chiton', helmet: true, beard: true, kind: 'man', hand: 'open', seat: false };

  // the six bands (1 = knees ... 6 = eye): a part is stone if its band ≤ stone level (6 − lines)
  // draw(pose, lines, opts) → SVG markup (a <g>), the figure's hip at (pose.x, pose.y); scale via opts.scale
  function draw(pose0, lines, opts) {
    opts = opts || {};
    const p = Object.assign({}, BASE, pose0);
    const stone = 6 - Math.max(0, Math.min(6, lines));
    const isStone = band => band <= stone;
    const fill = band => opts.flash && band === opts.flash ? WHITE : isStone(band) ? STONE : CLAY;
    const edge = band => isStone(band) ? CLAY : GLAZE;
    const ew = band => isStone(band) ? 1.15 : 1.3;
    const parts = [];   // {z, d, band} shapes (drawn as one silhouette per layer) or {z, raw} markup
    const shape = (d, band) => ({ d, band });
    const relief = (d, band, w, col) => isStone(band) ? '' : `<path d="${d}" fill="none" stroke="${col || GLAZE}" stroke-width="${w || 1.1}" stroke-linecap="round"/>`;
    const push = (z, x) => { if (!x) return; if (typeof x === 'string') parts.push({ z, raw: x }); else parts.push(Object.assign({ z }, x)); };
    const hip = [0, 0];
    const td = dir(180 - p.torso);                       // up along the torso, leaning forward by p.torso
    const tn = [td[1] * -1, td[0]];                      // forward-perpendicular to the torso
    const at = (u, v) => [hip[0] + td[0] * u + (-td[1]) * v, hip[1] + td[1] * u + td[0] * v]; // u up the torso, v forward
    const neck = at(58, 3);
    const shN = at(52, 1), shF = at(52, -3);             // near and far shoulder
    const hipN = at(-2, 2), hipF = at(-2, -2);
    const female = p.kind === 'woman';
    const old = p.kind === 'old';
    const boy = p.kind === 'boy';

    // legs
    const thW = female ? 15 : 17;
    const legF1 = limb(hipF, p.farTh, 47, thW, 11, 0.35, 2.5, 1);
    const legF2 = limb(legF1.end, p.farCa, 45, 11, 6, 0.3, 3.2, -1);
    const legN1 = limb(hipN, p.nearTh, 47, thW, 11, 0.35, 2.5, 1);
    const legN2 = limb(legN1.end, p.nearCa, 45, 11, 6, 0.3, 3.2, -1);
    const foot = (ank, a, z) => { const d = dir(a); const toe = add(ank, d, 15); const heel = add(ank, d, -4); const up = [0, -1];
      return `M${P(add(heel, up, 3))} L${P(add(heel, [0, 1], 3))} L${P(add(toe, [0, 1], 2))} Q${P(add(toe, d, 2))} ${P(add(toe, up, 1))} L${P(add(ank, up, 4))}Z`; };
    // arms
    const armF1 = limb(shF, p.farUA, 31, 11.5, 8, 0.3, 2.2, 1);
    const armF2 = limb(armF1.end, p.farFA, 28, 8, 5.5, 0.3, 1.6, 1);
    const armN1 = limb(shN, p.nearUA, 31, 12, 8, 0.3, 2.2, 1);
    const armN2 = limb(armN1.end, p.nearFA, 28, 8, 5.5, 0.3, 1.6, 1);
    const hand = (wr, a, open) => { const d = dir(a), n = [d[1], -d[0]]; const tip = add(wr, d, open ? 10 : 6);
      return `M${P(add(wr, n, 3))} Q${P(add(add(wr, d, 6), n, 4))} ${P(add(tip, n, 1.5))} Q${P(add(tip, d, 1.5))} ${P(add(tip, n, -1.2))} L${P(add(add(wr, d, 4), n, -3.5))} L${P(add(wr, n, -3))}Z`; };

    if (p.seat) { // a stool (diphros) under the hips
      const s0 = at(-4, -16), s1 = at(-4, 16);
      push(0.5, `<path d="M${P(s0)} L${P(s1)} M${P(add(s0, [0, 1], 2))} L${P([s0[0] + 2, hip[1] + 42])} M${P(add(s1, [0, 1], 2))} L${P([s1[0] - 2, hip[1] + 42])}" stroke="${CLAY}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
    }
    // far limbs first (behind the body), slightly darker clay is not used: the vase painters drew far limbs the same colour
    push(1, shape(foot(legF2.end, p.farFoot), 1));
    push(1, shape(legF2.d, 1));
    push(1, shape(legF1.d, 2));
    push(2, shape(armF1.d, 4));
    push(2, shape(armF2.d, 4));
    push(2, shape(hand(armF2.end, p.farFA, p.hand === 'open'), 4));

    // torso (an athlete's chest, a narrow waist), drawn in torso coordinates
    const T = [[-10, 2], [-10, 18], [-13, 34], [-14, 48], [-8, 57], [4, 58], [13, 53], [17, 45], [15, 36], [9, 26], [10, 14], [9, 2]];
    const tp = T.map(([v, u]) => at(u, v));
    let td2 = `M${P(tp[0])}`; for (let i = 1; i < tp.length; i++) { const a = tp[i - 1], b = tp[i]; td2 += ` Q${P([(a[0] + b[0]) / 2 + 0, (a[1] + b[1]) / 2])} ${P(b)}`; }
    td2 += 'Z';
    // skirt / garment
    let garment = '';
    if (p.garment === 'chiton') {
      const w0 = at(4, -11), w1 = at(4, 10);
      const kneeN = legN1.end, kneeF = legF1.end;
      const hemB = add(at(-2, -12), dir(p.farTh), 24), hemF = add(at(-2, 9), dir(p.nearTh), 24);
      garment = `M${P(w0)} L${P(w1)} Q${P(add(w1, dir(p.nearTh), 10))} ${P(hemF)} Q${P([(hemF[0] + hemB[0]) / 2, Math.max(hemF[1], hemB[1]) + 3])} ${P(hemB)} Q${P(add(w0, dir(p.farTh), 10))} ${P(w0)}Z`;
      push(4, shape(garment, 3));
      // folds (relief lines of band 3)
      const fl = []; for (let i = 1; i <= 4; i++) { const t = i / 5; const top = [w0[0] + (w1[0] - w0[0]) * t, w0[1] + (w1[1] - w0[1]) * t]; const bot = [hemB[0] + (hemF[0] - hemB[0]) * t, hemB[1] + (hemF[1] - hemB[1]) * t]; fl.push(`M${P(add(top, [0, 1], 3))} L${P(add(bot, [0, -1], 2))}`); }
      push(4.1, relief(fl.join(' '), 3, 0.8));
    } else if (p.garment === 'long') {
      // a long robe from the waist to the ankles, round both legs
      const pts = [legN1.end, legF1.end, legN2.end, legF2.end];
      const back = Math.min(...pts.map(q => q[0])) - 7, front = Math.max(...pts.map(q => q[0])) + 7;
      const low = Math.max(legN2.end[1], legF2.end[1]) + 2;
      const w0 = at(6, -11), w1 = at(6, 10);
      const kneeBack = Math.min(legN1.end[0], legF1.end[0]) - 8, kneeFront = Math.max(legN1.end[0], legF1.end[0]) + 8;
      const midY = (Math.min(legN1.end[1], legF1.end[1]) + w0[1]) / 2;
      garment = `M${P(w0)} L${P(w1)} Q${P([kneeFront, midY])} ${P([Math.max(kneeFront, front - 4), Math.max(legN1.end[1], legF1.end[1])])} L${P([front, low])} L${P([back, low])} L${P([Math.min(kneeBack, back + 4), Math.max(legN1.end[1], legF1.end[1])])} Q${P([kneeBack, midY])} ${P(w0)}Z`;
      push(4, shape(garment, 2));
      const fl = []; for (let i = 1; i <= 5; i++) { const t = i / 6; const x = back + (front - back) * t; fl.push(`M${f(x)} ${f(low - 2)} Q${f(x + (t - 0.5) * 4)} ${f((low + w0[1]) / 2)} ${f(w0[0] + (w1[0] - w0[0]) * t)} ${f(w0[1] + 6)}`); }
      push(4.1, relief(fl.join(' '), 2, 0.7));
    }
    // near leg
    if (p.garment !== 'long') {
      push(3, shape(legN1.d, 2));
      push(3, shape(legN2.d, 1));
    }
    push(3.1, shape(foot(legN2.end, p.nearFoot), 1));
    if (p.garment === 'long') push(1.5, shape(foot(legF2.end, p.farFoot), 1));
    // knee-caps and the thigh line
    const kneeArc = (k, a) => { const d = dir(a), n = [d[1], -d[0]]; const c = add(k, n, 3); return `M${P(add(c, d, -3))} Q${P(add(c, n, 2.2))} ${P(add(c, d, 3))}`; };
    if (p.garment !== 'long') {
      push(3.2, relief(kneeArc(legN1.end, p.nearCa), 1, 1));
      push(1.2, relief(kneeArc(legF1.end, p.farCa), 1, 0.9));
      const th = legN1; push(3.2, relief(`M${P(add(add(th.mid, th.n, -2), th.dir, -10))} Q${P(add(th.mid, th.n, 3))} ${P(add(add(th.mid, th.n, 1), th.dir, 12))}`, 2, 0.9, DILUTE));
      push(3.2, relief(`M${P(add(legN2.mid, legN2.n, -3))} q0 0 0 0`, 1, 0.6));
    }
    // torso on top of the legs
    push(5, shape(td2, 4));
    if (p.garment !== 'long' || true) {
      // pectoral and the line of the belly
      const pec = `M${P(at(46, -2))} Q${P(at(40, 8))} ${P(at(42, 12))}`;
      const col = `M${P(at(54, -3))} Q${P(at(53, 4))} ${P(at(55, 9))}`;
      push(5.1, relief(pec + ' ' + col, 4, 1));
      const belly = `M${P(at(30, 6))} Q${P(at(20, 7))} ${P(at(12, 5))}`;
      push(5.1, relief(belly, 3, 0.9, DILUTE));
      if (female) push(5.1, relief(`M${P(at(50, -6))} L${P(at(14, -4))} M${P(at(50, 2))} L${P(at(14, 5))}`, 4, 0.7));
    }
    if (p.garment === 'long' || female || old) {
      // a mantle over the shoulder, its edge a band-4 relief
      push(5.1, relief(`M${P(at(56, -8))} Q${P(at(34, 2))} ${P(at(10, 11))}`, 4, 1));
    }
    // head
    const hc = add(neck, td, 14);            // head centre
    const ht = rad(-p.head * 1);
    const hp = (x, y) => { const c = Math.cos(ht), s = Math.sin(ht); return [hc[0] + x * c - y * s, hc[1] + x * s + y * c]; };
    const HP = (x, y) => P(hp(x, y));
    // the neck
    const nk = `M${P(at(54, -5))} L${HP(-4, 8)} L${HP(5, 9)} L${P(at(56, 7))}Z`;
    push(5, shape(nk, 5));
    // the face and skull: a Greek profile (brow and nose in one line)
    const face = `M${HP(-9, 7)} C${HP(-13, 0)} ${HP(-12, -11)} ${HP(-3, -13)} C${HP(4, -14)} ${HP(9, -10)} ${HP(9, -5)} L${HP(14, 3)} L${HP(11, 4)} L${HP(11.5, 6)} L${HP(10.5, 7)} L${HP(11, 8.5)} C${HP(11, 11)} ${HP(8, 12)} ${HP(5, 11.5)} C${HP(1, 11)} ${HP(-4, 11)} ${HP(-9, 7)}Z`;
    push(6, shape(face, 6));
    // the eye (archaic, almond, frontal) and the brow
    push(6.2, relief(`M${HP(2.5, -3)} Q${HP(5.5, -5)} ${HP(8, -3)} Q${HP(5.5, -1.5)} ${HP(2.5, -3)}`, 6, 0.9));
    if (!isStone(6)) push(6.3, `<circle cx="${f(hp(5.7, -3.1)[0])}" cy="${f(hp(5.7, -3.1)[1])}" r="1" fill="${GLAZE}"/>`);
    push(6.2, relief(`M${HP(1.5, -6.5)} Q${HP(5, -8)} ${HP(9, -6)}`, 6, 0.8));
    // mouth (band 5) and beard
    push(6.2, relief(`M${HP(8, 6.2)} L${HP(10.8, 6)}`, 5, 0.9));
    if (p.beard && !boy && !female) {
      const bd = `M${HP(-2, 4)} C${HP(0, 10)} ${HP(4, 14)} ${HP(old ? 12 : 10, old ? 18 : 13)} C${HP(8, 13)} ${HP(9, 10)} ${HP(9.5, 8.5)} L${HP(6, 8)} C${HP(3, 7)} ${HP(0, 6)} ${HP(-2, 4)}Z`;
      push(6.1, `<path d="${bd}" fill="${isStone(5) ? GLAZE : (old ? WHITE : GLAZE)}" stroke="${isStone(5) ? CLAY : 'none'}" stroke-width="0.7" ${old && !isStone(5) ? 'opacity="0.9"' : ''}/>`);
    }
    // hair or helmet
    if (p.helmet) {
      const hel = `M${HP(-12, 6)} C${HP(-15, -4)} ${HP(-10, -16)} ${HP(0, -16)} C${HP(8, -16)} ${HP(12, -11)} ${HP(11, -6.5)} L${HP(3, -6.5)} L${HP(2, -1)} L${HP(-1, 5)} L${HP(-4, 9)} L${HP(-12, 8)}Z`;
      push(8, shape(hel, 6));
      // the crest, on a short stilt; added red
      const crest = `M${HP(-1, -16)} L${HP(-1, -20)} C${HP(8, -24)} ${HP(-6, -30)} ${HP(-20, -22)} C${HP(-26, -16)} ${HP(-28, -8)} ${HP(-30, 0)} C${HP(-24, -6)} ${HP(-18, -14)} ${HP(-6, -19)} Z`;
      push(7, `<path d="${crest}" fill="${isStone(6) ? GLAZE : ADDRED}" stroke="${isStone(6) ? CLAY : GLAZE}" stroke-width="${isStone(6) ? 0.8 : 1}"/>`);
      push(8.1, relief(`M${HP(-11, 0)} Q${HP(-3, -2)} ${HP(4, -7)}`, 6, 0.8));
    } else if (female) {
      const hair = `M${HP(-10, 6)} C${HP(-15, -2)} ${HP(-12, -14)} ${HP(-2, -14)} C${HP(5, -15)} ${HP(9, -11)} ${HP(9, -7)} C${HP(3, -9)} ${HP(-2, -7)} ${HP(-3, -2)} C${HP(-4, 2)} ${HP(-6, 5)} ${HP(-10, 6)}Z M${HP(-12, -9)} a6 6 0 1 0 0.1 0Z`;
      push(8, `<path d="${hair}" fill="${GLAZE}" stroke="${isStone(6) ? CLAY : 'none'}" stroke-width="0.7"/>`);
      if (!isStone(6)) push(8.1, relief(`M${HP(-8, -11)} Q${HP(-2, -13)} ${HP(4, -12)}`, 6, 0.8, ADDRED));
    } else {
      const hair = old
        ? `M${HP(-10, 5)} C${HP(-15, -3)} ${HP(-11, -14)} ${HP(-2, -14)} C${HP(4, -14)} ${HP(7, -12)} ${HP(8, -9)} C${HP(2, -10)} ${HP(-3, -8)} ${HP(-4, -3)} C${HP(-5, 1)} ${HP(-6, 4)} ${HP(-10, 5)}Z`
        : `M${HP(-10, 4)} C${HP(-14, -4)} ${HP(-10, -15)} ${HP(-1, -15)} C${HP(5, -15)} ${HP(9, -12)} ${HP(9, -8)} C${HP(3, -10)} ${HP(-2, -8)} ${HP(-3, -3)} C${HP(-4, 0)} ${HP(-6, 3)} ${HP(-10, 4)}Z`;
      push(8, `<path d="${hair}" fill="${old && !isStone(6) ? WHITE : GLAZE}" stroke="${isStone(6) ? CLAY : 'none'}" stroke-width="0.7"/>`);
      if (!old && !isStone(6)) push(8.1, relief(`M${HP(-9, -9)} Q${HP(-3, -12)} ${HP(3, -12)}`, 6, 1, ADDRED)); // a fillet
    }
    // spear (behind the near arm), held in the near hand unless p.spear.hand === 'far'
    if (p.spear) {
      const s = p.spear; const holder = s.hand === 'far' ? armF2 : armN2; const g0 = add(holder.end, holder.dir, 3);
      const sd = dir(s.angle); const back = add(g0, sd, -(s.grip || 45)), tip = add(g0, sd, 150 - (s.grip || 45));
      const sn = [sd[1], -sd[0]];
      const head = `M${P(add(tip, sd, -12))} L${P(add(add(tip, sd, -6), sn, 2.6))} L${P(add(tip, sd, 6))} L${P(add(add(tip, sd, -6), sn, -2.6))}Z`;
      const ln = (w, c) => `<line x1="${f(back[0])}" y1="${f(back[1])}" x2="${f(tip[0])}" y2="${f(tip[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
      const sp = ln(3.4, GLAZE) + ln(1.5, CLAY);
      push(s.hand === 'far' ? 0 : 9, sp + `<path d="${head}" fill="${CLAY}" stroke="${GLAZE}" stroke-width="1"/>`);
    }
    if (p.staff) {
      const holder = p.staff.hand === 'near' ? armN2 : armF2; const g0 = add(holder.end, holder.dir, 3); const sd = dir(p.staff.angle || 180);
      const a0 = add(g0, sd, -(p.staff.below || 70)), a1 = add(g0, sd, p.staff.above || 20);
      push(p.staff.hand === 'near' ? 9 : 0, `<line x1="${f(a0[0])}" y1="${f(a0[1])}" x2="${f(a1[0])}" y2="${f(a1[1])}" stroke="${GLAZE}" stroke-width="3.4" stroke-linecap="round"/><line x1="${f(a0[0])}" y1="${f(a0[1])}" x2="${f(a1[0])}" y2="${f(a1[1])}" stroke="${CLAY}" stroke-width="1.5" stroke-linecap="round"/>` + (p.staff.wreath ? `<circle cx="${f(a1[0])}" cy="${f(a1[1])}" r="3" fill="none" stroke="${WHITE}" stroke-width="1"/>` : ''));
    }
    // near arm on top
    push(10, shape(armN1.d, 4));
    push(10, shape(armN2.d, 4));
    push(10, shape(hand(armN2.end, p.nearFA, p.hand === 'open'), 4));
    push(10.3, relief(`M${P(add(armN1.end, armN1.n, 1.5))} q${f(armN1.dir[0] * 3)} ${f(armN1.dir[1] * 3)} ${f(armN1.n[0] * -2)} ${f(armN1.n[1] * -2)}`, 4, 0.8));

    // one silhouette per layer: contours first (twice the width, so half shows outside), then the fills over them,
    // then the relief lines; layers are drawn back to front, so a near limb keeps its contour over the body
    const layers = {}; parts.forEach(x => { const L = Math.floor(x.z); (layers[L] = layers[L] || []).push(x); });
    let svg = '';
    Object.keys(layers).map(Number).sort((a, b) => a - b).forEach(L => {
      const xs = layers[L].slice().sort((a, b) => a.z - b.z);
      xs.forEach(x => { if (x.d) svg += `<path d="${x.d}" fill="none" stroke="${edge(x.band)}" stroke-width="${f(ew(x.band) * 2)}" stroke-linejoin="round"/>`; });
      xs.forEach(x => { if (x.d) svg += `<path d="${x.d}" fill="${fill(x.band)}"/>`; });
      xs.forEach(x => { if (x.raw) svg += x.raw; });
    });
    const sc = opts.scale || 1, flip = opts.flip ? -1 : 1;
    const tr = `translate(${f(p.x)} ${f(p.y)}) scale(${f(sc * flip)} ${f(sc)})${p.rot ? ` rotate(${f(p.rot)})` : ''}`;
    return `<g transform="${tr}"${opts.cls ? ` class="${opts.cls}"` : ''}>${svg}</g>`;
  }

  // ---- the poses (hip at the origin; y of the hip above the ground line is set by the caller via p.y)
  const POSES = {
    ready:   { torso: 4, nearUA: 160, nearFA: 150, farUA: 70, farFA: 100, nearTh: 22, nearCa: -2, farTh: -14, farCa: -14, spear: { angle: 99, grip: 62 }, hand: 'fist' },
    strike:  { torso: 22, nearUA: 112, nearFA: 96, farUA: -30, farFA: -20, nearTh: 52, nearCa: 4, farTh: -30, farCa: -38, spear: { angle: 99, grip: 40 }, hand: 'fist', dy: 8 },
    take:    { torso: 14, nearUA: 70, nearFA: 85, farUA: 165, farFA: 175, nearTh: 30, nearCa: 4, farTh: -18, farCa: -20, spear: { angle: 175, grip: 70, hand: 'far' }, hand: 'fist', dy: 3 },
    pass:    { torso: 2, head: -6, nearUA: -30, nearFA: -10, farUA: 30, farFA: 60, nearTh: 26, nearCa: 0, farTh: -20, farCa: -26, spear: { angle: 165, grip: 70, hand: 'far' }, hand: 'open' },
    raise:   { torso: 26, head: 14, nearUA: 55, nearFA: 40, farUA: 172, farFA: 178, nearTh: 30, nearCa: 6, farTh: -10, farCa: -12, spear: { angle: 178, grip: 75, hand: 'far' }, hand: 'open', dy: 5 },
    grace:   { torso: 4, head: 6, nearUA: 50, nearFA: 70, farUA: 175, farFA: 178, nearTh: 10, nearCa: 0, farTh: -8, farCa: -6, spear: { angle: 178, grip: 85, hand: 'far' }, hand: 'open' },
    stand:   { torso: -4, nearUA: 50, nearFA: 92, farUA: 40, farFA: 80, nearTh: 18, nearCa: -2, farTh: -16, farCa: -18, spear: { angle: 96, grip: 50 }, hand: 'fist' },
    kneel:   { torso: 14, head: -18, nearUA: 120, nearFA: 135, farUA: 105, farFA: 125, nearTh: 90, nearCa: -2, farTh: 10, farCa: -88, nearFoot: 90, farFoot: 175, hand: 'open', dy: 40 },
    obey:    { torso: 18, head: 24, nearUA: 12, nearFA: 25, farUA: 8, farFA: 20, nearTh: 4, nearCa: 0, farTh: -4, farCa: -2, hand: 'open' },
    clasp:   { torso: 30, head: -20, nearUA: 95, nearFA: 70, farUA: 80, farFA: 60, nearTh: 92, nearCa: -2, farTh: 18, farCa: -86, nearFoot: 90, farFoot: 175, hand: 'open', dy: 40 },
    beg:     { torso: 6, head: -24, nearUA: 140, nearFA: 150, farUA: 125, farFA: 140, nearTh: 92, nearCa: -2, farTh: 14, farCa: -86, nearFoot: 90, farFoot: 175, hand: 'open', dy: 40 },
    speak:   { torso: 0, head: -4, nearUA: 120, nearFA: 150, farUA: 15, farFA: 70, nearTh: 10, nearCa: 0, farTh: -8, farCa: -4, staff: { hand: 'far', angle: 180, below: 70, above: 30 }, hand: 'open' },
    standStill: { torso: 0, nearUA: 6, nearFA: 12, farUA: -4, farFA: 2, nearTh: 6, nearCa: 0, farTh: -4, farCa: -2, hand: 'open' },
    bowed:   { torso: 22, head: 30, nearUA: 30, nearFA: 70, farUA: 25, farFA: 65, nearTh: 6, nearCa: 0, farTh: -6, farCa: -4, hand: 'fist', dy: 3 },
    run:     { torso: 18, nearUA: -60, nearFA: -20, farUA: 70, farFA: 120, nearTh: 70, nearCa: -20, farTh: -45, farCa: -95, nearFoot: 90, farFoot: 140, hand: 'open', dy: 6 },
    loom:    { torso: 2, head: -6, nearUA: 75, nearFA: 120, farUA: 60, farFA: 115, nearTh: 4, nearCa: 0, farTh: -4, farCa: -2, hand: 'open' },
    weep:    { torso: 24, head: 34, nearUA: 160, nearFA: 230, farUA: 20, farFA: 50, nearTh: 92, nearCa: -2, farTh: 20, farCa: -86, nearFoot: 90, farFoot: 175, hand: 'open', dy: 40 },
    seated:  { torso: -4, head: 2, nearUA: 30, nearFA: 80, farUA: 15, farFA: 60, nearTh: 90, nearCa: 4, farTh: 84, farCa: 0, hand: 'open', dy: 30, seat: true },
    dead:    { rot: -90, torso: 0, head: 14, nearUA: 20, nearFA: 30, farUA: -12, farFA: -6, nearTh: 2, nearCa: 0, farTh: -2, farCa: -2, nearFoot: 150, farFoot: 150, hand: 'open', dy: 74 },
    fallen:  { rot: -80, torso: 6, head: 30, nearUA: 100, nearFA: 150, farUA: 60, farFA: 100, nearTh: 50, nearCa: -20, farTh: 30, farCa: -30, nearFoot: 120, farFoot: 120, hand: 'open', dy: 66 },
    lowered: { torso: 0, head: 4, nearUA: 15, nearFA: 25, farUA: 20, farFA: 30, nearTh: 8, nearCa: 0, farTh: -6, farCa: -4, spear: { angle: 178, grip: 70 }, hand: 'fist' },
    above:   { torso: -2, nearUA: 160, nearFA: 175, farUA: 50, farFA: 90, nearTh: 16, nearCa: 0, farTh: -12, farCa: -12, spear: { angle: 135, grip: 55 }, hand: 'fist' },
    aboveStrike: { torso: 20, nearUA: 110, nearFA: 125, farUA: -20, farFA: -10, nearTh: 40, nearCa: 4, farTh: -24, farCa: -30, spear: { angle: 135, grip: 60 }, hand: 'fist', dy: 6 },
    aboveRaise:  { torso: 22, head: 16, nearUA: 40, nearFA: 25, farUA: 170, farFA: 178, nearTh: 22, nearCa: 4, farTh: -10, farCa: -12, spear: { angle: 178, grip: 70, hand: 'far' }, hand: 'open', dy: 4 },
  };

  // blend two poses (angles and offsets) for motion: k = 0 → a, 1 → b
  function blend(a, b, k) { const o = Object.assign({}, a, k >= 0.5 ? b : {}); for (const key of Object.keys(BASE).concat(['dy', 'rot', 'x', 'y'])) { const va = a[key] !== undefined ? a[key] : BASE[key], vb = b[key] !== undefined ? b[key] : BASE[key]; if (typeof va === 'number' && typeof vb === 'number') o[key] = va + (vb - va) * k; }
    if (a.spear && b.spear && (a.spear.hand || 'near') === (b.spear.hand || 'near')) o.spear = { angle: a.spear.angle + (b.spear.angle - a.spear.angle) * k, grip: (a.spear.grip || 45) + ((b.spear.grip || 45) - (a.spear.grip || 45)) * k, hand: a.spear.hand };
    return o; }
  root.RIG = { draw, blend, POSES, BASE, CLAY, GLAZE, DILUTE, WHITE, ADDRED, STONE };
})(typeof self !== 'undefined' ? self : this);
