// Foot's Bad Man — the stage: figures, scenes, films, icons (silver on black). Inlined by build.py.
// ------------------------------------------------------------------ figures (SVG strings)
// A standing person, feet at (x, y), height about 34 * s. kind: plain | most | double | foot | bad
function person(x, y, s, kind, extra) {
  let hat = '';
  if (kind === 'most') hat = '<path d="M-7,-31.6h14v1.8h-14z"/><path d="M-4.6,-31.6a4.6,4.2 0 0 1 9.2,0z"/>';
  if (kind === 'double') hat = '<path d="M-5.6,-31.4h11.2v1.6h-11.2z"/><circle cx="0" cy="-33.6" r="2.6" style="fill:#E6E0D2;stroke:#0D0B09;stroke-width:1.1"/>';
  if (kind === 'foot') hat = '<path d="M-6.4,-26.5a6.4,6.6 0 0 1 12.8,0v4.2h-2.2v-3.2h-8.4v3.2h-2.2z"/>';
  if (kind === 'bad') hat = '<path d="M-4.6,-43h9.2v11h-9.2z"/><path d="M-7.4,-32.6h14.8v1.9h-14.8z"/><path d="M-4.5,-24.6q2.2,1.6 4.5,0q2.3,1.6 4.5,0l0,0.9q-2.2,1.4 -4.5,0q-2.3,1.4 -4.5,0z" style="fill:#E6E0D2"/>';
  const body = kind === 'foot' ? 'M-5.2,-20.6C-5.2,-22.6 5.2,-22.6 5.2,-20.6L9.5,-1C9.5,0 -9.5,0 -9.5,-1Z'
    : kind === 'bad' ? 'M-6,-20.6C-6,-22.8 6,-22.8 6,-20.6L11,-1C11,0 -11,0 -11,-1Z'
    : 'M-5.6,-20.6C-5.6,-22.6 5.6,-22.6 5.6,-20.6L7.6,-1C7.6,0 -7.6,0 -7.6,-1Z';
  return `<g transform="translate(${x},${y}) scale(${s})" ${extra || ''}><g class="fig"><circle cx="0" cy="-27" r="5.6"/><path d="${body}"/>${hat}</g></g>`;
}
// a bed with a patient; the patient lies (.lie) or sits up (.sit). Origin: bed centre at floor.
function bed(x, y, s, id) {
  return `<g transform="translate(${x},${y}) scale(${s})" ${id ? `id="${id}"` : ''} class="bed">
    <path class="set" d="M-17,-9h34v4h-34zM-17,-5h2.4v5h-2.4zM14.6,-5h2.4v5h-2.4zM-17,-15h3v10h-3z"/>
    <g class="lie fig"><circle cx="-10" cy="-13.4" r="4.4"/><path d="M-5.6,-17C2,-18.4 13,-17 15,-13.4L15,-9H-5.6Z"/></g>
    <g class="sit fig" style="opacity:0"><circle cx="-7" cy="-31" r="4.4"/><path d="M-11.4,-24.6C-11.4,-26.4 -2.6,-26.4 -2.6,-24.6L-1,-9H15V-9H-12.6Z"/></g>
  </g>`;
}
function stalls(yb) {
  yb = yb || 230; let s = '<g id="stalls">';
  const hats = [0, 1, 0, 2, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0];
  for (let i = 0; i < 14; i++) {
    const x = 12 + i * 26 + (i % 2 ? 3 : -2), y = yb - (i % 3) * 2;
    const h = hats[i] === 1 ? '<path d="M-9,-19h18v2h-18zM-5.6,-19a5.6,5 0 0 1 11.2,0z"/>' : hats[i] === 2 ? '<path d="M-8.4,-15a8.4,9 0 0 1 16.8,0v2.4h-16.8z"/>' : '';
    s += `<g class="head" data-i="${i}" transform="translate(${x},${y})"><g class="hb" style="fill:#0D0B09">
      <path class="arm a1" d="M-9,-6L-14,-26" style="stroke:#0D0B09;stroke-width:3.4;stroke-linecap:round;opacity:0"/>
      <path class="arm a2" d="M9,-6L14,-26" style="stroke:#0D0B09;stroke-width:3.4;stroke-linecap:round;opacity:0"/>
      <ellipse cx="0" cy="2" rx="14" ry="10"/><circle cx="0" cy="-12" r="8"/>${h}</g></g>`;
  }
  return s + '</g>';
}
const TINT = '<rect id="tint" x="0" y="0" width="360" height="230" style="fill:#C42A2A;mix-blend-mode:multiply;opacity:0;pointer-events:none"/>';
const IRIS = '<defs><mask id="irism"><rect x="0" y="0" width="360" height="230" fill="#fff"/><circle id="irisc" cx="180" cy="110" r="260" fill="#000"/></mask></defs><rect id="iris" x="0" y="0" width="360" height="230" mask="url(#irism)" style="fill:#0D0B09;pointer-events:none"/>';
const FIVE_ROW = (xs, y, s) => xs.map((x, i) => person(x, y, s, 'plain', `class="p5" data-k="${i}"`)).join('');

// ------------------------------------------------------------------ scenes: the situation each scheme creates
const SCENE = {
  idle(t) {
    return `<circle cx="180" cy="120" r="92" style="fill:#F4F0E6;opacity:.55"/>
      <path class="set" d="M60,186h240v3h-240z"/>${person(180, 186, 3.2, t)}`;
  },
  tram(t) {
    return `<path class="setl" d="M0,124H360" style="stroke-width:7"/><path d="M0,124H360" style="stroke:#E6E0D2;stroke-width:1.6;stroke-dasharray:3 9;fill:none"/>
      <path id="branch" class="setl" d="M140,124C185,124 200,170 245,170H360" style="stroke-width:7"/><path d="M140,124C185,124 200,170 245,170H360" style="stroke:#E6E0D2;stroke-width:1.6;stroke-dasharray:3 9;fill:none"/>
      <path id="mainp" d="M52,121H360" style="fill:none;stroke:none"/><path id="branchp" d="M52,121H140C185,121 200,167 245,167H360" style="fill:none;stroke:none"/>
      <g id="five">${FIVE_ROW([248, 266, 284, 302, 320], 122, .82)}</g>
      <g id="one">${person(304, 168, .82, 'plain')}</g>
      <g id="tram" transform="translate(52,121)"><g transform="translate(-26,0)">
        <path class="fig" d="M8,-34l10,-10" style="stroke:#0D0B09;stroke-width:2;fill:none"/>
        <rect class="fig" x="-2" y="-34" width="54" height="30" rx="5"/>
        <rect x="4" y="-29" width="9" height="10" style="fill:#E6E0D2"/><rect x="17" y="-29" width="9" height="10" style="fill:#E6E0D2"/><rect x="38" y="-29" width="10" height="12" style="fill:#E6E0D2"/>
        <g transform="translate(43,-15) scale(.55)">${person(0, 0, 1, t)}</g>
        <circle class="fig" cx="9" cy="-3" r="4"/><circle class="fig" cx="41" cy="-3" r="4"/></g></g>`;
  },
  bargain(t) {
    return `<path class="set" d="M0,178h360v3h-360z"/>
      <g id="agent">${person(62, 178, 1.55, t)}</g>
      <g id="one">${person(150, 178, 1.3, 'plain')}<path d="M144,155h12" style="stroke:#0D0B09;stroke-width:1.4"/></g>
      <g id="five">${FIVE_ROW([206, 228, 250, 272, 294], 178, 1.05)}</g>
      <path id="rope" d="M198,164C230,170 270,160 302,166" style="stroke:#0D0B09;stroke-width:1.6;fill:none"/>
      <g id="bad">${person(330, 178, 1.55, 'bad')}</g>
      <g id="flash" style="opacity:0"><path d="M0,-10L3,-3L10,0L3,3L0,10L-3,3L-10,0L-3,-3Z" style="fill:#F8F5EE;stroke:#0D0B09;stroke-width:1"/></g>`;
  },
  medicine(t) {
    return `<path class="set" d="M0,182h360v3h-360z"/>
      <g id="one">${bed(52, 182, 1.45)}</g>
      <g id="five">${bed(186, 116, 1.1, 'b0')}${bed(246, 116, 1.1, 'b1')}${bed(306, 116, 1.1, 'b2')}${bed(216, 182, 1.1, 'b3')}${bed(276, 182, 1.1, 'b4')}</g>
      <g id="agent">${person(124, 182, 1.5, t)}</g>
      <g id="bottle" transform="translate(136,150)"><path class="fig" d="M-3,-14h6v4l3,3v13h-12v-13l3,-3z"/><rect x="-4" y="-2" width="8" height="5" style="fill:#E6E0D2"/></g>
`;
  },
  brew(t) {
    return `<path class="set" d="M0,182h360v3h-360z"/><rect class="set" x="252" y="34" width="7" height="151"/>
      <g id="five">${bed(36, 116, 1.05, 'b0')}${bed(90, 116, 1.05, 'b1')}${bed(144, 116, 1.05, 'b2')}${bed(62, 182, 1.05, 'b3')}${bed(116, 182, 1.05, 'b4')}</g>
      <g id="vat"><path class="fig" d="M188,152h40l-4,30h-32z"/><path d="M208,152V62H266" style="stroke:#0D0B09;stroke-width:4;fill:none"/><path class="fig" d="M262,56h8l4,4v6l-4,4h-8z"/></g>
      <g id="agent">${person(170, 182, 1.45, t)}</g>
      <g id="one">${bed(312, 182, 1.2)}</g>
      <g id="fumes" style="opacity:0;fill:#6F695F"><circle cx="282" cy="76" r="12"/><circle cx="300" cy="96" r="16"/><circle cx="322" cy="122" r="18"/><circle cx="296" cy="134" r="15"/><circle cx="336" cy="90" r="12"/></g>
`;
  },
  beggar(t) {
    return `<path class="set" d="M0,182h360v3h-360z"/>
      <path d="M0,34H254V112H244V44H0Z" class="set"/><path class="set" d="M232,104h28v8h-28z"/>
      <path id="dooropen" class="set" d="M244,112L264,118V188L244,182Z"/><rect id="door" class="set" x="244" y="112" width="10" height="70" style="opacity:0"/>
      <g id="five">${bed(32, 116, 1.05, 'b0')}${bed(86, 116, 1.05, 'b1')}${bed(140, 116, 1.05, 'b2')}${bed(58, 182, 1.05, 'b3')}${bed(112, 182, 1.05, 'b4')}</g>
      <g id="agent">${person(204, 182, 1.45, t)}</g>
      <g id="loaf" transform="translate(216,150)"><ellipse class="fig" cx="0" cy="0" rx="6" ry="3.6"/></g>
      <g id="one"><g transform="translate(296,182) scale(1.35)"><g class="fig"><circle cx="-2" cy="-19" r="5.2"/><path d="M-8,-13C-6,-16 6,-16 8,-12L12,0H-12Z"/><path d="M14,0h10v-3h-10z"/></g></g></g>`;
  },
  torture(t) {
    return `<path class="set" d="M0,182h360v3h-360z"/>
      <g class="set"><rect x="20" y="40" width="4" height="142"/><rect x="40" y="40" width="4" height="142"/><rect x="60" y="40" width="4" height="142"/><rect x="80" y="40" width="4" height="142"/><rect x="100" y="40" width="4" height="142"/><rect x="120" y="40" width="4" height="142"/><rect x="16" y="40" width="112" height="4"/></g>
      <g id="two">${person(52, 182, 1.2, 'plain')}${person(92, 182, 1.2, 'plain')}</g>
      <g id="one"><g transform="translate(236,182) scale(1.4)"><g class="set"><rect x="-10" y="-20" width="20" height="3"/><rect x="-9" y="-17" width="3" height="17"/><rect x="6" y="-17" width="3" height="17"/><rect x="-10" y="-34" width="3" height="14"/></g><g class="fig"><circle cx="0" cy="-30" r="5.6"/><path d="M-6,-24C-6,-26 6,-26 6,-24L7,-10H-7Z"/><path d="M-7,-10h14v3h-14z"/></g></g></g>
      <g id="agent">${person(300, 182, 1.5, 'plain')}</g>
      <g id="irons" transform="translate(286,150)"><path d="M0,0l-10,-14M0,0l-6,-16" style="stroke:#0D0B09;stroke-width:2.4;stroke-linecap:round"/><path class="fig" d="M-2,-2h6v4h-6z"/></g>
      <g id="brazier"><path class="fig" d="M326,166h22l-3,16h-16z"/><path d="M330,166q4,-10 6,-16q3,8 8,16" style="fill:#F8F5EE;stroke:#0D0B09;stroke-width:1"/></g>`;
  },
  cave(t) {
    return `<path d="M0,0H360V230H0Z" style="fill:none"/>
      <path d="M0,22C60,6 170,10 262,26C270,60 266,96 262,124H246V186H0Z" style="fill:#2A2622"/>
      <path id="hollow" d="M18,186C14,140 30,84 70,70C120,56 200,62 236,90C246,100 246,120 246,124V186Z" style="fill:#9A9386"/>
      <g id="five">${FIVE_ROW([60, 84, 108, 132, 156, 180, 204, 222], 184, 0.95)}</g>
      <clipPath id="hc"><path d="M18,186C14,140 30,84 70,70C120,56 200,62 236,90C246,100 246,120 246,124V186Z"/></clipPath>
      <g clip-path="url(#hc)"><g id="water"><path d="M10,300V178C40,174 60,182 82,178C104,174 124,182 146,178C168,174 188,182 210,178C226,175 238,180 252,178V300Z" style="fill:#D7D1C3;opacity:.85;stroke:#0D0B09;stroke-width:1"/></g></g>
      <path d="M262,26C272,70 268,100 264,124" style="fill:none;stroke:#2A2622;stroke-width:3"/>
      <g id="one"><g transform="translate(254,186) scale(1.4)"><g class="fig"><circle cx="-3" cy="-30" r="5.6"/><path d="M-10,-23C-10,-26 6,-26 8,-23L11,0H-12Z"/></g></g></g>
      <g id="out" style="opacity:0">${FIVE_ROW([268, 278, 288, 298, 308, 318, 328, 338], 186, .5)}</g>
      <g id="agent">${person(342, 186, 1.45, t)}</g>
      <g id="stick" transform="translate(328,150)"><rect class="fig" x="-2" y="-11" width="4" height="13" rx="1"/><path d="M0,-11q3,-4 1,-8" style="stroke:#0D0B09;stroke-width:1.2;fill:none"/><circle cx="1" cy="-19" r="2" style="fill:#F8F5EE;stroke:#0D0B09;stroke-width:.8"/></g>
      <g id="flash" style="opacity:0" transform="translate(254,150)"><path d="M0,-26L7,-8L26,-10L10,2L18,22L0,10L-18,22L-10,2L-26,-10L-7,-8Z" style="fill:#F8F5EE;stroke:#0D0B09;stroke-width:1.2"/></g>`;
  },
};
function drawStage(inner) { $('#stage').innerHTML = inner + '<g id="fx"></g>' + stalls() + TINT + IRIS; }
function setScene(kind, t) { drawStage(SCENE[kind](t)); }

// ------------------------------------------------------------------ small animation helpers
function anim(el, kf, o) { if (!el) return Promise.resolve(); const a = el.animate(kf, Object.assign({ fill: 'forwards', easing: 'ease-in-out' }, o, RM ? { duration: 1 } : {})); return a.finished.catch(() => {}); }
const q = s => $('#stage').querySelector(s), qa = s => Array.from($('#stage').querySelectorAll(s));
function die(el) { return anim(el, [{ opacity: 1 }, { opacity: .16 }], { duration: 700 }); }
function cure(bedEl) { return Promise.all([anim(bedEl.querySelector('.lie'), [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }), anim(bedEl.querySelector('.sit'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400 })]); }
function lenAtX(pathEl, X) { let lo = 0, hi = pathEl.getTotalLength(); for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (pathEl.getPointAtLength(m).x < X) lo = m; else hi = m; } return lo; }
function moveAlong(el, pathEl, ms, stopX) {
  return new Promise(res => {
    const end = lenAtX(pathEl, stopX); if (RM) { const p = pathEl.getPointAtLength(end); el.setAttribute('transform', `translate(${p.x},${p.y})`); return res(); }
    const t0 = performance.now();
    (function f(now) { const k = Math.min(1, (now - t0) / ms), e = k * k * (1.4 - .4 * k); const p = pathEl.getPointAtLength(e * end); el.setAttribute('transform', `translate(${p.x},${p.y})`); if (k < 1) requestAnimationFrame(f); else res(); })(t0);
  });
}
function flyDot(from, to, r, ms) {
  const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', r); c.setAttribute('style', 'fill:#F8F5EE;stroke:#0D0B09;stroke-width:1'); q('#fx').appendChild(c);
  c.setAttribute('cx', 0); c.setAttribute('cy', 0);
  return anim(c, [{ transform: `translate(${from[0]}px,${from[1]}px)` }, { transform: `translate(${to[0]}px,${to[1]}px)` }], { duration: ms, easing: 'ease-in' }).then(() => c.remove());
}
async function iris(close) {
  const c = q('#irisc'); if (!c) return;
  const from = close ? 260 : 0, to = close ? 0 : 260;
  if (RM) { c.setAttribute('r', to); return; }
  const t0 = performance.now(), ms = 520;
  await new Promise(res => { (function f(now) { const k = Math.min(1, (now - t0) / ms); c.setAttribute('r', from + (to - from) * k); if (k < 1) requestAnimationFrame(f); else res(); })(t0); });
}

// ------------------------------------------------------------------ the film of each scheme: option A or B
const FILM = {
  async tram(opt) {
    const tr = q('#tram'); await moveAlong(tr, q(opt === 'A' ? '#branchp' : '#mainp'), 1900, opt === 'A' ? 270 : 214);
    await die(q(opt === 'A' ? '#one' : '#five'));
  },
  async bargain(opt) {
    const fl = q('#flash');
    if (opt === 'A') { fl.setAttribute('transform', 'translate(150,140)'); await anim(q('#agent'), [{ transform: 'translateX(0)' }, { transform: 'translateX(40px)' }], { duration: 700 }); await anim(fl, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 450 }); await die(q('#one')); await anim(q('#rope'), [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }); await anim(q('#five'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 400 }); }
    else { await anim(q('#agent'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-12px)' }], { duration: 600 }); fl.setAttribute('transform', 'translate(250,145)'); await anim(fl, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 450 }); await die(q('#five')); }
  },
  async medicine(opt) {
    const b = [136, 140];
    await anim(q('#agent'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 300 });
    if (opt === 'A') {
      const to = [[186, 98], [246, 98], [306, 98], [216, 164], [276, 164]];
      await Promise.all(to.map((p, i) => wait(i * 120).then(() => flyDot(b, p, 3, 700))));
      await Promise.all(qa('#five .bed').map(cure)); await die(q('#one'));
    } else { await flyDot(b, [52, 160], 6, 700); await cure(q('#one .bed')); await die(q('#five')); }
  },
  async brew(opt) {
    if (opt === 'A') {
      const bub = []; for (let i = 0; i < 5; i++) bub.push(wait(i * 160).then(() => flyDot([200 + (i % 3) * 8, 150], [208, 96], 2.4, 500)));
      await Promise.all(bub);
      await Promise.all([anim(q('#fumes'), [{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: .82, transform: 'translateX(0)' }], { duration: 1300 }),
        Promise.all([[36, 98], [90, 98], [144, 98], [62, 164], [116, 164]].map((p, i) => wait(i * 100).then(() => flyDot([196, 150], p, 3, 800))))]);
      await Promise.all(qa('#five .bed').map(cure)); await die(q('#one'));
    } else { await anim(q('#agent'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-16px)' }], { duration: 700 }); await die(q('#five')); }
  },
  async beggar(opt) {
    if (opt === 'A') {
      await Promise.all([anim(q('#door'), [{ opacity: 0 }, { opacity: 1 }], { duration: 500 }), anim(q('#dooropen'), [{ opacity: 1 }, { opacity: 0 }], { duration: 500 })]);
      await die(q('#one')); await wait(300);
      await Promise.all([[32, 98], [86, 98], [140, 98], [58, 164], [112, 164]].map((p, i) => wait(i * 100).then(() => flyDot([240, 140], p, 3, 800))));
      await Promise.all(qa('#five .bed').map(cure));
    } else {
      const l = q('#loaf'); await anim(l, [{ transform: 'translate(216px,150px)' }, { transform: 'translate(282px,166px)' }], { duration: 800 });
      await anim(q('#one'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }], { duration: 400 }); await die(q('#five'));
    }
  },
  async torture(opt) {
    if (opt === 'A') {
      await anim(q('#agent'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-34px)' }], { duration: 800 });
      await anim(q('#irons'), [{ transform: 'translate(286px,150px)' }, { transform: 'translate(252px,152px)' }], { duration: 300 });
      await anim(q('#one'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 1600 });
      await anim(q('#two'), [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-70px)', opacity: 0 }], { duration: 900 });
    } else {
      await anim(q('#agent'), [{ transform: 'translateX(0)' }, { transform: 'translateX(14px)' }], { duration: 600 });
      await anim(q('#two'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 1600 });
      await die(q('#two'));
    }
  },
  async cave(opt) {
    const w = q('#water');
    if (opt === 'A') {
      await anim(q('#stick'), [{ transform: 'translate(328px,150px)' }, { transform: 'translate(262px,160px)' }], { duration: 650 });
      q('#stick').style.opacity = 0; await anim(q('#flash'), [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 500 });
      await die(q('#one'));
      await anim(q('#five'), [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(70px)', opacity: 0 }], { duration: 1000 });
      await anim(q('#out'), [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
    } else {
      await anim(w, [{ transform: 'translateY(0)' }, { transform: 'translateY(-96px)' }], { duration: 1800, easing: 'ease-in' });
      await Promise.all([die(q('#five')), die(q('#one'))]);
    }
  },
};
const ICON = {
  tram: '<path d="M5,20h20M7,20V9a3,3 0 0 1 3,-3h10a3,3 0 0 1 3,3v11M10,10h4M16,10h4M15,6V2l5,-1"/><circle cx="10" cy="22" r="1.6"/><circle cx="20" cy="22" r="1.6"/>',
  bargain: '<path d="M10.5,2h9v13h-9zM4,15.5h22M10.5,11.5h9"/><path d="M9,21q3,2.6 6,0q3,2.6 6,0"/>',
  medicine: '<path d="M12,2h6v4l3,3v14H9V9l3,-3zM9,14h12"/>',
  brew: '<path d="M6,12h18l-3,11H9zM15,12V5h7"/><path d="M23,3q2,2 0,4"/><path d="M10,9q1,-2 0,-4"/>',
  beggar: '<path d="M4,23V3h12v20M16,3v20"/><circle cx="22" cy="14" r="2"/><path d="M19,23q3,-6 6,0"/>',
  torture: '<path d="M4,4v18M10,4v18M16,4v18M4,4h12"/><path d="M22,22l4,-8M22,22l6,-5"/>',
  cave: '<path d="M2,23V12C2,5 9,2 15,2s13,3 13,10v11"/><path d="M8,23v-8a7,7 0 0 1 14,0v8"/><path d="M9,19q2,-1.5 4,0q2,1.5 4,0q2,-1.5 4,0"/>',
};
