// Julian's Window — the drawings. Ink on a white page, dot-tone, stars and petals; the blanket is the one colour. No mechanism here.
var Art = (function () {
  'use strict';
  var INK = '#17150F', ROSE = '#E7A2B6';
  function rng(seed) { var a = seed | 0; return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function el(tag, attrs, inner) { var s = '<' + tag; for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) s += ' ' + k + '="' + attrs[k] + '"'; return s + (inner === undefined ? '/>' : '>' + inner + '</' + tag + '>'); }
  function L(x1, y1, x2, y2, w) { return el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: INK, 'stroke-width': w || 1.4, 'stroke-linecap': 'round' }); }
  function P(d, w, fill, extra) { var a = { d: d, stroke: INK, 'stroke-width': w || 1.4, fill: fill || 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }; if (extra) for (var k in extra) a[k] = extra[k]; return el('path', a); }
  function C(cx, cy, r, fill, w) { return el('circle', { cx: cx, cy: cy, r: r, fill: fill || 'none', stroke: fill === INK ? 'none' : INK, 'stroke-width': w || 1.4 }); }
  function E(cx, cy, rx, ry, fill, w, rot) { return el('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: fill || 'none', stroke: fill === INK ? 'none' : INK, 'stroke-width': w || 1.4, transform: rot ? 'rotate(' + rot + ' ' + cx + ' ' + cy + ')' : undefined }); }
  function R(x, y, w, h, fill, sw) { return el('rect', { x: x, y: y, width: w, height: h, fill: fill || 'none', stroke: sw === 0 ? 'none' : INK, 'stroke-width': sw || 1.4 }); }
  function star4(cx, cy, r, fill, cls) { var s = r * 0.32; return el('path', { d: 'M' + cx + ' ' + (cy - r) + ' Q' + cx + ' ' + cy + ' ' + (cx + r) + ' ' + cy + ' Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + r) + ' Q' + cx + ' ' + cy + ' ' + (cx - r) + ' ' + cy + ' Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - r) + 'Z', fill: fill || INK, stroke: 'none', 'class': cls || '', 'data-s': s }); }
  function petal(cx, cy, r, rot, fill) { return el('path', { d: 'M' + cx + ' ' + (cy - r) + ' C' + (cx + r * 0.8) + ' ' + (cy - r * 0.4) + ' ' + (cx + r * 0.8) + ' ' + (cy + r * 0.4) + ' ' + cx + ' ' + (cy + r) + ' C' + (cx - r * 0.8) + ' ' + (cy + r * 0.4) + ' ' + (cx - r * 0.8) + ' ' + (cy - r * 0.4) + ' ' + cx + ' ' + (cy - r) + 'Z', fill: fill || '#fff', stroke: INK, 'stroke-width': 1, transform: 'rotate(' + rot + ' ' + cx + ' ' + cy + ')' }); }
  var patId = 0;
  function tone(id, r, gap, color) { return el('pattern', { id: id, width: gap, height: gap, patternUnits: 'userSpaceOnUse' }, el('circle', { cx: gap / 2, cy: gap / 2, r: r, fill: color || INK })); }
  function defs() {
    return el('defs', {}, tone('t1', 0.9, 5) + tone('t2', 1.4, 5) + tone('t3', 1.9, 5) + tone('tw', 1.1, 5, '#fff') +
      el('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: INK, 'stroke-width': 1 })) +
      el('linearGradient', { id: 'dawn', x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#555' }) + el('stop', { offset: 1, 'stop-color': '#ddd' })) +
      el('linearGradient', { id: 'pale', x1: 0, y1: 0, x2: 0, y2: 1 }, el('stop', { offset: 0, 'stop-color': '#cfcfcf' }) + el('stop', { offset: 1, 'stop-color': '#fff' })));
  }
  function svg(w, h, inner, extra) { return el('svg', Object.assign({ viewBox: '0 0 ' + w + ' ' + h, xmlns: 'http://www.w3.org/2000/svg', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' }, extra || {}), inner); }
  function defsSvg() { return el('svg', { width: 0, height: 0, style: 'position:absolute;width:0;height:0', 'aria-hidden': 'true' }, defs()); }

  // a shōjo face, three-quarter, cx/cy at the centre of the head, s the scale (1 = 60 px tall)
  // look: 'none' | 'cross' | 'window' | 'within' (closed); mood: 'weal' | 'woe' | 'glad' | 'laugh' | 'tears'
  function face(cx, cy, s, look, mood, hair) {
    var g = '';
    var hx = cx, hy = cy;
    var dx = look === 'window' ? 3.2 * s : look === 'cross' ? 1.6 * s : 0, dy = look === 'cross' ? -2.2 * s : look === 'window' ? -0.6 * s : 0;
    var woe = mood === 'woe';
    // hair behind
    if (hair !== false) g += P('M' + (hx - 30 * s) + ' ' + (hy - 6 * s) + ' C' + (hx - 34 * s) + ' ' + (hy - 40 * s) + ' ' + (hx + 34 * s) + ' ' + (hy - 40 * s) + ' ' + (hx + 30 * s) + ' ' + (hy - 6 * s) + ' C' + (hx + 36 * s) + ' ' + (hy + 20 * s) + ' ' + (hx + 20 * s) + ' ' + (hy + 50 * s) + ' ' + (hx + 10 * s) + ' ' + (hy + 56 * s) + ' L' + (hx - 40 * s) + ' ' + (hy + 56 * s) + ' C' + (hx - 44 * s) + ' ' + (hy + 20 * s) + ' ' + (hx - 36 * s) + ' ' + (hy + 10 * s) + ' ' + (hx - 30 * s) + ' ' + (hy - 6 * s) + 'Z', 1.4, 'url(#t1)');
    // head
    g += P('M' + (hx - 26 * s) + ' ' + (hy - 4 * s) + ' C' + (hx - 28 * s) + ' ' + (hy - 34 * s) + ' ' + (hx + 28 * s) + ' ' + (hy - 34 * s) + ' ' + (hx + 26 * s) + ' ' + (hy - 4 * s) + ' C' + (hx + 24 * s) + ' ' + (hy + 18 * s) + ' ' + (hx + 10 * s) + ' ' + (hy + 32 * s) + ' ' + (hx) + ' ' + (hy + 32 * s) + ' C' + (hx - 12 * s) + ' ' + (hy + 32 * s) + ' ' + (hx - 26 * s) + ' ' + (hy + 16 * s) + ' ' + (hx - 26 * s) + ' ' + (hy - 4 * s) + 'Z', 1.5, '#fff');
    // fringe
    if (hair !== false) g += P('M' + (hx - 26 * s) + ' ' + (hy - 10 * s) + ' C' + (hx - 14 * s) + ' ' + (hy - 30 * s) + ' ' + (hx - 2 * s) + ' ' + (hy - 20 * s) + ' ' + (hx + 2 * s) + ' ' + (hy - 28 * s) + ' C' + (hx + 10 * s) + ' ' + (hy - 20 * s) + ' ' + (hx + 20 * s) + ' ' + (hy - 30 * s) + ' ' + (hx + 27 * s) + ' ' + (hy - 8 * s), 1.4, 'url(#t1)');
    // eyes
    var ey = hy + 2 * s, exL = hx - 11 * s, exR = hx + 12 * s, ew = (woe ? 9.5 : 8.5) * s, eh = (woe ? 8 : 6.5) * s;
    if (look === 'within' || mood === 'laugh') {
      g += P('M' + (exL - ew) + ' ' + ey + ' Q' + exL + ' ' + (ey + (mood === 'laugh' ? -5 : 5) * s) + ' ' + (exL + ew) + ' ' + ey, 1.6) + P('M' + (exR - ew) + ' ' + ey + ' Q' + exR + ' ' + (ey + (mood === 'laugh' ? -5 : 5) * s) + ' ' + (exR + ew) + ' ' + ey, 1.6);
      g += P('M' + (exL - ew) + ' ' + (ey - 7 * s) + ' Q' + exL + ' ' + (ey - 11 * s) + ' ' + (exL + ew) + ' ' + (ey - 7 * s), 1.2) + P('M' + (exR - ew) + ' ' + (ey - 7 * s) + ' Q' + exR + ' ' + (ey - 11 * s) + ' ' + (exR + ew) + ' ' + (ey - 7 * s), 1.2);
    } else {
      [exL, exR].forEach(function (ex) {
        g += P('M' + (ex - ew) + ' ' + ey + ' Q' + ex + ' ' + (ey - eh * 1.5) + ' ' + (ex + ew) + ' ' + ey + ' Q' + ex + ' ' + (ey + eh * 0.9) + ' ' + (ex - ew) + ' ' + ey + 'Z', 1.6, '#fff');
        var ir = (woe ? 4.6 : 5.6) * s, ix = ex + dx * 0.8, iy = ey - 1.5 * s + dy * 0.6;
        g += C(ix, iy, ir, INK) + C(ix - ir * 0.35, iy - ir * 0.4, ir * 0.32, '#fff', 0) + C(ix + ir * 0.3, iy + ir * 0.35, ir * 0.16, '#fff', 0);
        g += P('M' + (ex - ew) + ' ' + ey + ' Q' + ex + ' ' + (ey - eh * 1.5) + ' ' + (ex + ew) + ' ' + ey, 2.2);
        g += L(ex + ew * 0.9, ey - eh * 0.9, ex + ew * 1.15, ey - eh * 1.25, 1.2) + L(ex + ew * 0.6, ey - eh * 1.25, ex + ew * 0.75, ey - eh * 1.6, 1.1);
        if (mood === 'tears') g += P('M' + (ex) + ' ' + (ey + 5 * s) + ' q' + (2 * s) + ' ' + (8 * s) + ' 0 ' + (14 * s), 1.2);
      });
      if (woe) g += L(exL - 4 * s, ey + 8 * s, exL + 5 * s, ey + 9 * s, 0.9) + L(exR - 5 * s, ey + 9 * s, exR + 4 * s, ey + 8 * s, 0.9);
    }
    // brows
    var by = ey - (woe ? 13 : 11) * s;
    g += P('M' + (exL - 7 * s) + ' ' + (by + (woe ? 1 : 0)) + ' Q' + exL + ' ' + (by - (woe ? 1 : 3) * s) + ' ' + (exL + 7 * s) + ' ' + (by + (woe ? -2 : 0)), 1.3) + P('M' + (exR - 7 * s) + ' ' + (by + (woe ? -2 : 0)) + ' Q' + exR + ' ' + (by - (woe ? 1 : 3) * s) + ' ' + (exR + 7 * s) + ' ' + (by + (woe ? 1 : 0)), 1.3);
    // nose, mouth
    g += P('M' + (hx + 1 * s) + ' ' + (hy + 10 * s) + ' l' + (2 * s) + ' ' + (4 * s), 1.1);
    if (mood === 'laugh') g += P('M' + (hx - 7 * s) + ' ' + (hy + 20 * s) + ' Q' + (hx + 1 * s) + ' ' + (hy + 31 * s) + ' ' + (hx + 9 * s) + ' ' + (hy + 19 * s) + 'Z', 1.3, '#fff');
    else if (mood === 'glad') g += P('M' + (hx - 5 * s) + ' ' + (hy + 21 * s) + ' Q' + (hx + 1 * s) + ' ' + (hy + 26 * s) + ' ' + (hx + 7 * s) + ' ' + (hy + 20 * s), 1.3);
    else if (woe || mood === 'tears') g += E(hx + 1 * s, hy + 23 * s, 2.6 * s, 2 * s, '#fff', 1.2);
    else g += P('M' + (hx - 3 * s) + ' ' + (hy + 22 * s) + ' Q' + (hx + 1 * s) + ' ' + (hy + 24 * s) + ' ' + (hx + 5 * s) + ' ' + (hy + 21.5 * s), 1.3);
    return g;
  }

  // the crucifix on the wall; s scales; dim draws it in light tone only
  function crucifix(cx, cy, s, dim, mood) {
    var g = '', w = dim ? 1 : 1.5, f = dim ? 'url(#t1)' : '#fff', hair = dim ? 'url(#t1)' : 'url(#t2)';
    g += R(cx - 2.5 * s, cy - 26 * s, 5 * s, 62 * s, f, w) + R(cx - 21 * s, cy - 13 * s, 42 * s, 5 * s, f, w);
    // arms along the crossbar, hands at the ends
    g += P('M' + (cx - 4 * s) + ' ' + (cy - 4 * s) + ' L' + (cx - 18 * s) + ' ' + (cy - 9.5 * s) + ' M' + (cx + 4 * s) + ' ' + (cy - 4 * s) + ' L' + (cx + 18 * s) + ' ' + (cy - 9.5 * s), w * 1.3);
    g += C(cx - 18.5 * s, cy - 10 * s, 1.4 * s, INK) + C(cx + 18.5 * s, cy - 10 * s, 1.4 * s, INK);
    // body, tapered, with a hatched cloth
    g += P('M' + (cx - 4 * s) + ' ' + (cy - 5 * s) + ' C' + (cx - 5 * s) + ' ' + (cy + 4 * s) + ' ' + (cx - 3.5 * s) + ' ' + (cy + 8 * s) + ' ' + (cx - 3 * s) + ' ' + (cy + 11 * s) + ' L' + (cx + 3 * s) + ' ' + (cy + 11 * s) + ' C' + (cx + 3.5 * s) + ' ' + (cy + 8 * s) + ' ' + (cx + 5 * s) + ' ' + (cy + 4 * s) + ' ' + (cx + 4 * s) + ' ' + (cy - 5 * s) + 'Z', w, f);
    g += P('M' + (cx - 2.5 * s) + ' ' + (cy + 1 * s) + ' q' + (2.5 * s) + ' ' + (1.5 * s) + ' ' + (5 * s) + ' 0 M' + (cx - 2 * s) + ' ' + (cy + 4 * s) + ' q' + (2 * s) + ' ' + (1.2 * s) + ' ' + (4 * s) + ' 0', 0.8);
    g += P('M' + (cx - 4.5 * s) + ' ' + (cy + 11 * s) + ' L' + (cx + 4.5 * s) + ' ' + (cy + 11 * s) + ' L' + (cx + 4 * s) + ' ' + (cy + 16 * s) + ' L' + (cx - 4 * s) + ' ' + (cy + 16 * s) + 'Z', w, 'url(#hatch)');
    g += P('M' + (cx - 2.5 * s) + ' ' + (cy + 16 * s) + ' L' + (cx - 2 * s) + ' ' + (cy + 28 * s) + ' M' + (cx + 2.5 * s) + ' ' + (cy + 16 * s) + ' L' + (cx + 2 * s) + ' ' + (cy + 28 * s), w * 1.2);
    g += P('M' + (cx - 3.5 * s) + ' ' + (cy + 28 * s) + ' L' + (cx + 3.5 * s) + ' ' + (cy + 28 * s), w);
    // the head, bowed to the right
    g += el('g', { transform: 'rotate(14 ' + cx + ' ' + (cy - 7 * s) + ')' }, E(cx, cy - 11 * s, 4.2 * s, 5.2 * s, f, w) + P('M' + (cx - 4.2 * s) + ' ' + (cy - 12 * s) + ' C' + (cx - 3 * s) + ' ' + (cy - 18 * s) + ' ' + (cx + 3 * s) + ' ' + (cy - 18 * s) + ' ' + (cx + 4.2 * s) + ' ' + (cy - 12 * s) + ' C' + (cx + 2 * s) + ' ' + (cy - 14 * s) + ' ' + (cx - 2 * s) + ' ' + (cy - 14 * s) + ' ' + (cx - 4.2 * s) + ' ' + (cy - 12 * s) + 'Z', w, hair) + P('M' + (cx - 2 * s) + ' ' + (cy - 10 * s) + ' l' + (1.2 * s) + ' 0 M' + (cx + 0.8 * s) + ' ' + (cy - 10 * s) + ' l' + (1.2 * s) + ' 0', 0.9));
    if (mood === 'bleed') for (var i = 0; i < 6; i++) g += C(cx - 4 * s + i * 1.6 * s, cy - 15 * s + (i % 2) * 1.5 * s, 0.9 * s, INK);
    if (!dim) for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4 + 0.2; g += L(cx + Math.cos(a) * 30 * s, cy - 2 * s + Math.sin(a) * 30 * s, cx + Math.cos(a) * 38 * s, cy - 2 * s + Math.sin(a) * 38 * s, 0.9); }
    return g;
  }

  function sky(x, y, w, h, hour, seed) {
    var g = '', r = rng(seed || 3);
    var fill = { 'deep night': INK, 'night': INK, 'small hours': INK, 'before dawn': 'url(#dawn)', 'first light': 'url(#pale)', 'morning': '#fff' }[hour] || INK;
    g += el('rect', { x: x, y: y, width: w, height: h, fill: fill });
    var n = hour === 'night' ? 5 : hour === 'small hours' ? 7 : hour === 'before dawn' ? 2 : 0;
    for (var i = 0; i < n; i++) g += star4(x + 6 + r() * (w - 12), y + 6 + r() * (h * 0.7), 2.5 + r() * 3, '#fff', 'twinkle');
    if (hour === 'morning') for (var k = 0; k < 4; k++) g += L(x + 4, y + 10 + k * 14, x + w - 4, y + 12 + k * 14, 0.8);
    return g;
  }

  // the room, drawn once; weather and eyes over it. 348 x 300
  function room(opts) {
    var weal = opts.weal, hour = opts.hour, look = opts.look || 'none', g = '';
    // walls and floor
    g += R(0, 0, 348, 300, '#fff', 0);
    g += L(0, 236, 348, 236, 1.2);
    g += el('g', { opacity: 0.35 }, L(0, 60, 348, 60, 0.8) + L(0, 118, 348, 118, 0.8) + L(0, 176, 348, 176, 0.8) + L(70, 60, 70, 118, 0.8) + L(200, 118, 200, 176, 0.8) + L(330, 60, 330, 118, 0.8) + L(120, 0, 120, 60, 0.8));
    // window (arched) at right
    var wx = 246, wy = 44, ww = 74, wh = 120;
    g += el('clipPath', { id: 'winclip' }, el('path', { d: 'M' + wx + ' ' + (wy + wh) + ' L' + wx + ' ' + (wy + 37) + ' A37 37 0 0 1 ' + (wx + ww) + ' ' + (wy + 37) + ' L' + (wx + ww) + ' ' + (wy + wh) + 'Z' }));
    g += el('g', { 'clip-path': 'url(#winclip)' }, sky(wx, wy, ww, wh, hour, opts.seed));
    g += P('M' + wx + ' ' + (wy + wh) + ' L' + wx + ' ' + (wy + 37) + ' A37 37 0 0 1 ' + (wx + ww) + ' ' + (wy + 37) + ' L' + (wx + ww) + ' ' + (wy + wh) + 'Z', 2);
    g += L(wx + ww / 2, wy + 2, wx + ww / 2, wy + wh, 1.4) + R(wx - 6, wy + wh, ww + 12, 7, '#fff', 1.4);
    // cross on the back wall
    g += crucifix(150, 92, 1, false, weal ? null : 'bleed');
    // bed: headboard, frame, pillow
    g += P('M16 150 L16 250 M16 150 L46 150 L46 250', 1.6) + R(16, 150, 30, 100, 'url(#t1)', 0);
    g += P('M46 190 L230 190 L230 250 M46 250 L230 250 M60 250 L60 270 M218 250 L218 270', 1.6);
    g += P('M50 196 C60 170 120 170 128 196 C120 206 60 206 50 196Z', 1.4, '#fff');
    // the blanket: the one colour, never changes
    g += P('M118 192 C150 178 200 180 232 196 L234 248 L112 248 C108 230 110 210 118 192Z', 1.6, ROSE);
    g += P('M135 205 C160 198 190 200 222 212', 1, 'none') + P('M128 228 C160 220 196 222 226 236', 1, 'none');
    // hands on the blanket
    // her head on the pillow (lying, turned up-right toward the cross)
    g += el('g', { transform: 'rotate(-18 88 190)' }, face(90, 184, 0.7, look, weal ? 'weal' : 'woe'));
    // weather overlay
    if (weal) {
      var r = rng(opts.seed * 3 + 1);
      for (var i = 0; i < 16; i++) { var x = 10 + r() * 328, y = 8 + r() * 170; if (x > 230 && y < 175 && x < 330) continue; g += star4(x, y, 4 + r() * 8, INK, 'twinkle'); }
      for (var j = 0; j < 9; j++) { var px = 12 + r() * 324, py = 20 + r() * 240; if (px > 230 && px < 335 && py < 180) continue; g += petal(px, py, 4 + r() * 4, r() * 180); }
    } else {
      g += el('radialGradient', { id: 'crosslight' }, el('stop', { offset: 0, 'stop-color': '#000' }) + el('stop', { offset: 0.55, 'stop-color': '#000' }) + el('stop', { offset: 1, 'stop-color': '#fff' }));
      g += el('mask', { id: 'woemask' }, el('rect', { x: 0, y: 0, width: 348, height: 300, fill: '#fff' }) + el('path', { d: 'M118 192 C150 178 200 180 232 196 L234 248 L112 248 C108 230 110 210 118 192Z', fill: '#000' }) + el('circle', { cx: 150, cy: 92, r: 52, fill: 'url(#crosslight)' }));
      g += el('g', { mask: 'url(#woemask)', 'pointer-events': 'none' }, el('rect', { x: 0, y: 0, width: 348, height: 300, fill: 'url(#t2)', opacity: 0.55 }) +
        [[0, 0, 110, 0, 0, 90], [348, 0, 240, 0, 348, 80], [0, 300, 0, 200, 120, 300], [348, 300, 348, 210, 230, 300]].map(function (t) { return el('polygon', { points: t.join(' ').replace(/(\d+) (\d+) /g, '$1,$2 '), fill: 'url(#t3)', opacity: 0.6 }); }).join(''));
      var sr = rng(opts.seed * 5 + 2);
      for (var k = 0; k < 9; k++) { var cx0 = k % 2 ? 330 - sr() * 60 : 10 + sr() * 60, cy0 = k < 5 ? 8 + sr() * 70 : 220 + sr() * 70, d = 'M' + cx0 + ' ' + cy0; for (var m = 0; m < 6; m++) d += ' l' + ((sr() - 0.5) * 26) + ' ' + ((sr() - 0.5) * 22); g += P(d, 0.9, 'none', { opacity: 0.8, 'pointer-events': 'none' }); }
    }
    // tap targets
    g += el('rect', { x: 110, y: 40, width: 84, height: 110, fill: 'transparent', 'data-place': 'cross', style: 'cursor:pointer' });
    g += el('rect', { x: 236, y: 36, width: 96, height: 140, fill: 'transparent', 'data-place': 'window', style: 'cursor:pointer' });
    g += el('rect', { x: 46, y: 150, width: 180, height: 100, fill: 'transparent', 'data-place': 'within', style: 'cursor:pointer' });
    return svg(348, 300, g);
  }

  function dropsAt(n, x0, y0, w, seed, cls) { var r = rng(seed), g = ''; for (var i = 0; i < n; i++) { var x = x0 + r() * w, y = y0 + r() * 20, s = 2.2 + r() * 2.4; g += el('g', { 'class': cls || 'drop', style: 'animation-delay:' + (-r() * 1.6).toFixed(2) + 's' }, P('M' + x + ' ' + (y - s * 2) + ' q' + s + ' ' + (s * 2) + ' 0 ' + (s * 3) + ' q' + (-s) + ' ' + (-s) + ' 0 ' + (-s * 3) + 'Z', 0.8, INK)); } return g; }
  function crown(cx, cy, rx) { var g = P('M' + (cx - rx) + ' ' + cy + ' C' + (cx - rx * 0.6) + ' ' + (cy - 9) + ' ' + (cx + rx * 0.6) + ' ' + (cy - 9) + ' ' + (cx + rx) + ' ' + cy + ' C' + (cx + rx * 0.6) + ' ' + (cy + 9) + ' ' + (cx - rx * 0.6) + ' ' + (cy + 9) + ' ' + (cx - rx) + ' ' + cy + 'Z', 1.4, 'url(#hatch)'); for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2, bx = cx + Math.cos(a) * rx * 0.95, by = cy + Math.sin(a) * 7; g += L(bx, by, bx + Math.cos(a) * 9, by + Math.sin(a) * 6 - 3, 1.2); } return g; }

  function hand(cx, cy, s) { // an open palm, fingers up, drawn around cx,cy with scale s (1 = about 90 px tall)
    var d = 'M' + (cx - 30 * s) + ' ' + (cy + 40 * s) + ' C' + (cx - 44 * s) + ' ' + (cy + 10 * s) + ' ' + (cx - 40 * s) + ' ' + (cy - 10 * s) + ' ' + (cx - 26 * s) + ' ' + (cy - 14 * s)
      + ' C' + (cx - 30 * s) + ' ' + (cy - 30 * s) + ' ' + (cx - 20 * s) + ' ' + (cy - 46 * s) + ' ' + (cx - 14 * s) + ' ' + (cy - 44 * s) + ' C' + (cx - 10 * s) + ' ' + (cy - 42 * s) + ' ' + (cx - 10 * s) + ' ' + (cy - 20 * s) + ' ' + (cx - 11 * s) + ' ' + (cy - 14 * s)
      + ' C' + (cx - 10 * s) + ' ' + (cy - 34 * s) + ' ' + (cx - 2 * s) + ' ' + (cy - 52 * s) + ' ' + (cx + 3 * s) + ' ' + (cy - 50 * s) + ' C' + (cx + 8 * s) + ' ' + (cy - 48 * s) + ' ' + (cx + 6 * s) + ' ' + (cy - 24 * s) + ' ' + (cx + 4 * s) + ' ' + (cy - 14 * s)
      + ' C' + (cx + 8 * s) + ' ' + (cy - 30 * s) + ' ' + (cx + 16 * s) + ' ' + (cy - 46 * s) + ' ' + (cx + 20 * s) + ' ' + (cy - 44 * s) + ' C' + (cx + 25 * s) + ' ' + (cy - 42 * s) + ' ' + (cx + 22 * s) + ' ' + (cy - 20 * s) + ' ' + (cx + 18 * s) + ' ' + (cy - 12 * s)
      + ' C' + (cx + 26 * s) + ' ' + (cy - 24 * s) + ' ' + (cx + 32 * s) + ' ' + (cy - 34 * s) + ' ' + (cx + 36 * s) + ' ' + (cy - 30 * s) + ' C' + (cx + 40 * s) + ' ' + (cy - 26 * s) + ' ' + (cx + 34 * s) + ' ' + (cy - 8 * s) + ' ' + (cx + 30 * s) + ' ' + (cy + 2 * s)
      + ' C' + (cx + 44 * s) + ' ' + (cy + 8 * s) + ' ' + (cx + 46 * s) + ' ' + (cy + 20 * s) + ' ' + (cx + 36 * s) + ' ' + (cy + 40 * s) + 'Z';
    return P(d, 1.5, '#fff') + P('M' + (cx - 24 * s) + ' ' + (cy + 10 * s) + ' q' + (14 * s) + ' ' + (8 * s) + ' ' + (36 * s) + ' ' + (2 * s), 0.9) + P('M' + (cx - 20 * s) + ' ' + (cy + 24 * s) + ' q' + (16 * s) + ' ' + (6 * s) + ' ' + (34 * s) + ' ' + (-2 * s), 0.9);
  }
  // the sight panels, 348 x 190
  var SIGHTS = {
    garland: function (o) { return face(174, 100, 1.25, 'none', o.weal ? 'weal' : 'woe', false) + crown(174, 72, 34) + dropsAt(34, 132, 74, 84, 4); },
    drops: function () { var g = P('M60 40 C120 0 228 0 288 40 L300 190 L48 190Z', 1.5, '#fff'); var r = rng(9); for (var i = 0; i < 70; i++) { var x = 70 + r() * 208, y = 50 + r() * 120, s = 3 + r() * 4; g += P('M' + (x - s) + ' ' + y + ' a' + s + ' ' + s + ' 0 0 1 ' + (2 * s) + ' 0', 1, 'url(#t2)'); } for (var k = 0; k < 9; k++) g += L(20 + k * 36, 4, 20 + k * 36, 22 + (k % 3) * 6, 1); g += dropsAt(14, 20, 8, 308, 5); return g; },
    face: function (o) { var g = face(174, 100, 1.25, 'none', o.weal ? 'weal' : 'woe', false); g += P('M174 50 L174 160 C150 160 130 130 136 70 C150 50 165 48 174 50Z', 0, 'url(#t3)', { opacity: 0.8 }); g += el('rect', { x: 0, y: 0, width: 348, height: 190, fill: 'url(#t1)', opacity: 0.5 }); return g; },
    scourging: function () { var g = P('M130 30 C120 60 118 120 130 185 L218 185 C230 120 228 60 218 30 C200 10 148 10 130 30Z', 1.5, 'url(#t3)'); for (var i = 0; i < 9; i++) g += P('M' + (138 + i * 10) + ' ' + (40 + (i % 3) * 20) + ' q 6 30 -2 60', 1, 'none'); g += dropsAt(20, 120, 150, 110, 6); return g; },
    laugh: function () { var g = ''; g += P('M20 150 L328 150 L328 185 L20 185Z', 1.4, '#fff'); g += el('g', { transform: 'rotate(-12 100 112)' }, face(100, 112, 0.9, 'none', 'laugh')); g += face(230, 70, 0.75, 'none', 'laugh') + face(300, 90, 0.7, 'none', 'laugh'); for (var i = 0; i < 6; i++) g += P('M' + (150 + i * 30) + ' ' + (30 + (i % 2) * 12) + ' q 6 -8 12 0', 1.2); return g; },
    drying: function () { var g = face(174, 100, 1.25, 'none', 'woe', false); g += P('M148 50 C130 90 135 140 160 165 L190 165 C215 140 220 90 200 50Z', 0, 'url(#hatch)', { opacity: 0.55 }); g += P('M160 124 l 6 -3 l 6 4 l 7 -4 l 6 3', 1.3) + P('M166 128 l 3 6 M180 128 l -2 7', 1); g += crown(174, 62, 36); return g; },
    pleased: function (o) { return crucifix(174, 70, 2.2, false, null) + face(174, 48, 0.55, 'none', 'glad', false); },
    side: function () { var g = P('M110 20 C100 60 100 130 115 185 L240 185 C255 130 255 60 245 20Z', 1.5, '#fff'); g += P('M196 70 C214 95 214 140 196 165 C184 140 184 95 196 70Z', 1.6, 'url(#t1)'); var r = rng(11); for (var i = 0; i < 9; i++) g += star4(188 + r() * 16, 85 + r() * 70, 2 + r() * 3, INK); g += P('M110 20 L245 20', 1.2); return g; },
    mother: function () { var g = face(90, 110, 0.7, 'none', 'weal') + P('M70 150 L110 150 L120 190 L60 190Z', 1.3, 'url(#t1)'); g += face(250, 70, 1.05, 'none', 'glad') + P('M212 120 L288 120 L305 190 L195 190Z', 1.3, '#fff'); var r = rng(13); for (var i = 0; i < 10; i++) g += star4(170 + r() * 160, 10 + r() * 60, 3 + r() * 5, INK, 'twinkle'); return g; },
    itisi: function () { var g = ''; for (var k = 0; k < 24; k++) { var a = k * Math.PI / 12; g += L(174 + Math.cos(a) * 50, 95 + Math.sin(a) * 50, 174 + Math.cos(a) * (120 + (k % 2) * 40), 95 + Math.sin(a) * (120 + (k % 2) * 40), 1); } g += face(174, 95, 1.1, 'none', 'glad', false); return g; },
    seeking: function () { return el('g', { opacity: 0.5 }, crucifix(174, 90, 2, true)) + el('rect', { x: 0, y: 0, width: 348, height: 190, fill: 'url(#t1)', opacity: 0.35 }); },
    cheer: function () { var g = face(174, 100, 1.25, 'none', 'glad', false) + crown(174, 72, 34); var r = rng(17); for (var i = 0; i < 18; i++) g += star4(10 + r() * 328, 8 + r() * 170, 4 + r() * 9, INK, 'twinkle'); return g; },
    hazelnut: function () { var g = hand(150, 115, 1.35); g += C(150, 112, 12, INK) + C(145.5, 107, 3.4, '#fff', 0) + C(154, 116, 1.6, '#fff', 0); var r = rng(19); for (var i = 0; i < 6; i++) g += star4(230 + r() * 100, 20 + r() * 80, 3 + r() * 5, INK, 'twinkle'); return g; },
    sin: function () { var g = ''; for (var k = 0; k < 36; k++) { var a = k * Math.PI / 18; g += L(174 + Math.cos(a) * 14, 95 + Math.sin(a) * 14, 174 + Math.cos(a) * (60 + (k % 3) * 30), 95 + Math.sin(a) * (60 + (k % 3) * 30), 0.9); } g += C(174, 95, 5, INK); return g; },
    cause: function () { return face(100, 100, 1.1, 'within', 'woe') + hand(258, 110, 1.2); },
    pain: function () { return face(110, 100, 1.1, 'cross', 'tears') + crucifix(270, 80, 1.6, false, 'bleed'); },
    whysin: function () { var g = P('M120 40 C180 20 240 50 230 110 C220 160 150 170 120 140 C95 110 100 60 120 40Z', 0, 'url(#t2)', { opacity: 0.6 }); g += el('rect', { x: 110, y: 20, width: 140, height: 160, fill: '#fff', opacity: 0.0 }); g += P('M240 60 L290 60 M265 60 L265 130', 1.2); var r = rng(23); for (var i = 0; i < 8; i++) g += star4(240 + r() * 90, 100 + r() * 70, 3 + r() * 4, INK, 'twinkle'); return g; },
    howwell: function () { var g = C(174, 95, 55, '#fff', 1.6) + P('M150 48 L168 90 L158 110 L180 142', 1.6); var r = rng(29); for (var i = 0; i < 8; i++) g += star4(150 + r() * 36, 50 + r() * 90, 3 + r() * 5, INK, 'twinkle'); return g; },
    hid: function () { var g = ''; for (var row = 0; row < 5; row++) for (var c = 0; c < 6; c++) g += R(10 + c * 56 + (row % 2) * 28 - 28, 10 + row * 36, 56, 36, 'url(#t1)', 1.2); g += P('M150 70 L198 70 L198 170 L150 170Z', 1.8, '#fff') + C(188, 122, 3, INK); return g; },
    rest: function () { var g = face(174, 100, 1.2, 'within', 'weal'); var r = rng(31); for (var i = 0; i < 10; i++) g += star4(10 + r() * 328, 8 + r() * 60, 3 + r() * 6, INK, 'twinkle'); return g; },
    sky: function (o) { var g = el('clipPath', { id: 'skyclip' }, el('path', { d: 'M120 190 L120 60 A54 54 0 0 1 228 60 L228 190Z' })); g += el('g', { 'clip-path': 'url(#skyclip)' }, sky(120, 6, 108, 184, o.hour, 41)); var dark = o.hour === 'deep night' || o.hour === 'night' || o.hour === 'small hours'; g += P('M120 190 L120 60 A54 54 0 0 1 228 60 L228 190Z', 2) + el('line', { x1: 174, y1: 8, x2: 174, y2: 180, stroke: dark ? '#fff' : INK, 'stroke-width': 2 }) + el('line', { x1: 122, y1: 100, x2: 226, y2: 100, stroke: dark ? '#fff' : INK, 'stroke-width': 1.4 }) + R(110, 180, 128, 10, '#fff', 1.6); return g; }
  };
  function sight(id, o) { var f = SIGHTS[id] || SIGHTS.seeking; return svg(348, 190, f(o || {})); }

  function icon(place) {
    var g = '';
    if (place === 'cross') g = crucifix(17, 15, 0.42, false, null);
    else if (place === 'window') g = P('M9 32 L9 14 A8 8 0 0 1 25 14 L25 32Z', 1.6, INK) + L(17, 7, 17, 32, 1.4) + star4(13, 18, 2.5, '#fff') + star4(21, 24, 2, '#fff');
    else g = face(17, 16, 0.42, 'within', 'weal');
    return svg(34, 34, g);
  }
  function frame(rec) {
    if (!rec) return '';
    var g = rec.weal ? (star4(8, 8, 3.5, INK) + star4(26, 20, 3, INK) + star4(16, 22, 2.2, INK)) : el('rect', { x: 0, y: 0, width: 34, height: 28, fill: 'url(#t2)', opacity: 0.7 });
    var m = rec.place === 'cross' ? P('M17 6 L17 24 M11 11 L23 11', 2.4) : rec.place === 'window' ? P('M12 24 L12 12 A5 5 0 0 1 22 12 L22 24Z', 1.8, rec.weal ? '#fff' : INK) : P('M10 14 Q17 20 24 14 M10 20 Q17 25 24 20', 1.8);
    return svg(34, 28, g + m);
  }
  function cover() {
    var g = R(0, 0, 348, 260, '#fff', 0);
    g += crucifix(150, 70, 1, false, null);
    var wx = 246, wy = 30, ww = 74, wh = 110;
    g += el('clipPath', { id: 'cvclip' }, el('path', { d: 'M' + wx + ' ' + (wy + wh) + ' L' + wx + ' ' + (wy + 37) + ' A37 37 0 0 1 ' + (wx + ww) + ' ' + (wy + 37) + ' L' + (wx + ww) + ' ' + (wy + wh) + 'Z' }));
    g += el('g', { 'clip-path': 'url(#cvclip)' }, sky(wx, wy, ww, wh, 'night', 2));
    g += P('M' + wx + ' ' + (wy + wh) + ' L' + wx + ' ' + (wy + 37) + ' A37 37 0 0 1 ' + (wx + ww) + ' ' + (wy + 37) + ' L' + (wx + ww) + ' ' + (wy + wh) + 'Z', 2) + L(wx + ww / 2, wy + 2, wx + ww / 2, wy + wh, 1.4);
    g += P('M16 130 L16 230 M16 130 L46 130 L46 230', 1.6) + R(16, 130, 30, 100, 'url(#t1)', 0) + P('M46 170 L230 170 L230 230 M46 230 L230 230', 1.6);
    g += P('M50 176 C60 150 120 150 128 176 C120 186 60 186 50 176Z', 1.4, '#fff');
    g += P('M118 172 C150 158 200 160 232 176 L234 228 L112 228 C108 210 110 190 118 172Z', 1.6, ROSE);
    g += el('g', { transform: 'rotate(-18 88 170)' }, face(88, 166, 0.78, 'cross', 'weal'));
    var r = rng(77); for (var i = 0; i < 14; i++) { var x = 10 + r() * 328, y = 8 + r() * 150; if (x > 230 && x < 330 && y < 150) continue; g += star4(x, y, 4 + r() * 8, INK, 'twinkle'); }
    for (var j = 0; j < 7; j++) { var px = 12 + r() * 324, py = 20 + r() * 220; if (px > 230 && px < 335 && py < 150) continue; g += petal(px, py, 4 + r() * 4, r() * 180); }
    return svg(348, 260, g);
  }
  function intro(i) {
    var g = '';
    if (i === 0) g = P('M10 70 L160 70 L160 100 M10 100 L160 100', 1.4) + el('g', { transform: 'rotate(-18 50 70)' }, face(50, 66, 0.55, 'none', 'weal')) + P('M70 66 C100 56 130 58 158 72 L158 98 L66 98Z', 1.3, ROSE) + star4(30, 20, 5, INK) + star4(120, 25, 7, INK) + star4(90, 15, 4, INK);
    else if (i === 1) g = P('M110 100 L110 30 L130 30 L130 100', 1.4) + C(120, 18, 10, '#fff') + P('M120 8 l 0 -6', 1.2) + star4(120, 0, 5, INK) + P('M20 100 L100 100 M20 100 L20 80', 1.3) + el('g', { transform: 'rotate(-18 48 80)' }, face(48, 76, 0.5, 'window', 'weal')) + P('M66 76 C86 68 96 70 100 78 L100 98 L62 98Z', 1.2, ROSE) + R(140, 36, 28, 44, '#fff', 1.2) + L(154, 36, 154, 80, 1) + L(140, 52, 168, 52, 1);
    else if (i === 2) g = face(84, 55, 0.95, 'none', 'woe') + el('rect', { x: 0, y: 60, width: 174, height: 50, fill: 'url(#t2)', opacity: 0.7 }) + P('M0 60 L174 60', 1, 'none', { 'stroke-dasharray': '4 3' });
    else g = crucifix(84, 48, 0.9, false, null) + P('M20 100 L150 100', 1.3) + P('M30 110 L40 80 L70 80 L80 110', 1.2, '#fff') + P('M48 78 q 7 -10 14 0', 1.2);
    return svg(174, 110, g);
  }
  return { room: room, sight: sight, icon: icon, frame: frame, cover: cover, intro: intro, defsSvg: defsSvg };
})();
