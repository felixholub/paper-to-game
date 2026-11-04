// Home Judges — the mechanism. The single source of truth: build.py inlines this file verbatim into home-judges.html,
// and calibration.js runs against this same file. Plain functions, no DOM. Runs unchanged in Node and in the browser.
//
// Paper: Fuchs-Schündeln & Holub, "Homophily in Grant Evaluations" (WZB / Goethe University Frankfurt).
// Kind: reconstructed (bonus sizes and exposure shares from the paper) on a toy (random assignment of judges
// within a panel, a constructed applicant population). See memo.md §16.

const CONFIG = {
  // --- The paper's estimates (eq. 1: same proposal, same reviewer) -----------------------------------------
  bonus: {
    both: 0.164,     // Supp. Table 2 col 1: same country of work AND same citizenship, Step 1 project score
    citz: 0.075,     // Supp. Table 2 col 1: different country / same citizenship
    country: 0.056,  // Supp. Table 2 col 1: same country / different citizenship
    gender: 0.024,   // Supp. Table 1 col 1: same gender (rules card only; not in the jars, see memo §14)
  },
  // Alternatives for the robustness check only (calibration.js), never used by the game
  bonusAlt: {
    step2project: { both: 0.153, citz: 0.078, country: 0.069 }, // Supp. Table 2 col 3
    step1PI: { both: 0.083, citz: 0.055, country: 0.034 },      // Supp. Table 2 col 2
  },
  panelSize: 15,            // p. 4: "approximately 15 renowned experts"; p. 12: average panel size 15.1
  reviewersPerProposal: 4.2, // p. 5: Step 1 proposals are evaluated by an average of 4.2 panel reviewers
  bigFive: ['DE', 'UK', 'FR', 'IT', 'ES'], // Table 2: the five largest ERC-application countries, grouped by country of work

  // --- The paper's exposure table (Table 2, upper block), the calibration target for the ERC-like panel ------
  table2: {
    big: { citz: 3.8, country: 4.5, both: 4.6 },   // % of panel members, applicants working in a top-five country
    other: { citz: 2.6, country: 1.8, both: 1.5 }, // % of panel members, applicants working elsewhere
    bigShare: 19938 / 37073,                        // Table 2 note: Step-1 N = 19,938 top-five, 17,135 other
  },
  // Table 1 / Table 2 lower block, quoted in the verdict (correlational): APE in p.p. per unit share, and the result
  ape: { citz: 13.5, country: 9.1, both: 15.7 },    // Table 1, panel members
  fundingEdge: { big: 1.7, other: 0.8, base: 14.2 }, // Table 2 lower block 'Total'; p. 13 baseline funding probability

  // --- The constructed applicant population (our choice) ---------------------------------------------------
  // passport workplace weight(% of applicants). Tuned so that (a) applicants working in the big five are 53.8%
  // (Table 2 N) and (b) the ERC-like panel below lands near Table 2's six exposure shares. About 20% of applicants
  // work outside their passport country (our choice). XX = a passport no panel member holds; ZZ = many small
  // countries with no panel member, lumped together.
  applicants: 'DE DE 11.5|IT DE 0.8|ES DE 0.4|XX DE 2.3|UK UK 6.5|DE UK 0.8|IT UK 1.2|ES UK 0.5|GR UK 0.5|FR UK 0.5|XX UK 3.0|' +
    'FR FR 7.0|IT FR 0.5|XX FR 1.5|IT IT 8.0|XX IT 0.5|ES ES 7.6|XX ES 0.7|NL NL 3.0|DE NL 0.6|IT NL 0.5|XX NL 1.9|' +
    'CH CH 1.2|DE CH 1.2|IT CH 0.5|FR CH 0.4|XX CH 1.2|IL IL 3.3|XX IL 0.2|BE BE 2.0|XX BE 1.0|SE SE 2.0|XX SE 1.0|' +
    'AT AT 1.4|DE AT 0.7|XX AT 0.6|PT PT 2.3|XX PT 0.2|PL PL 2.1|XX PL 0.1|GR GR 1.7|XX GR 0.1|DK DK 1.2|XX DK 0.8|' +
    'IE IE 0.8|XX IE 0.7|HU HU 1.2|CZ CZ 1.2|FI FI 1.6|NO NO 1.5|ZZ ZZ 8.0',
  // Alternative mobility for the robustness check: share of each home-grown weight moved abroad (calibration.js)
  mobilityAlt: [0.5, 1.5], // half and one-and-a-half times the constructed mobility

  // --- The game's judges (our choice) -------------------------------------------------------------------------
  // Round 1: the pool the player seats a panel from. Weighted towards big research systems, as real expert pools are.
  pool: 'DE/DE DE/DE DE/DE UK/UK UK/UK FR/FR FR/FR IT/IT IT/IT ES/ES ES/ES IT/UK DE/CH NL/UK GR/UK PL/DE ES/NL ' +
    'NL/NL PL/PL SE/SE PT/PT GR/GR IL/IL AT/AT',
  // Round 2: one 15-seat panel standing for the ERC's average panel, calibrated to Table 2 (calibration.js check 2)
  ercPanel: 'DE/DE IT/UK FR/FR UK/UK ES/ES DE/CH IT/IT NL/UK GR/GR PL/PL IL/IL SE/DK AT/AT BE/BE US/US',
  bench: 'PT/PT HU/HU CZ/CZ PL/DE GR/UK ES/NL FI/FI DK/DK NO/NO US/US',
  swaps: 4,          // our choice: round 2 swap budget (calibration.js §5: a plan that unseats big-five home judges levels ~2 times in 3; random plans ~1 in 200)
  levelTol: 0.5,     // our choice: jars count as level within half a star per 10 juries
  starsPer: 10,      // our unit: home stars per 10 juries
  jarMax: 6,         // display: a full jar is 6 stars per 10 juries

  names: { DE: 'Germany', UK: 'the UK', FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'the Netherlands', CH: 'Switzerland',
    IL: 'Israel', BE: 'Belgium', SE: 'Sweden', AT: 'Austria', PT: 'Portugal', PL: 'Poland', GR: 'Greece', DK: 'Denmark',
    IE: 'Ireland', HU: 'Hungary', CZ: 'Czechia', FI: 'Finland', NO: 'Norway', US: 'the US' },
  people: { DE: 'German', UK: 'British', FR: 'French', IT: 'Italian', ES: 'Spanish', NL: 'Dutch', CH: 'Swiss', IL: 'Israeli',
    BE: 'Belgian', SE: 'Swedish', AT: 'Austrian', PT: 'Portuguese', PL: 'Polish', GR: 'Greek', DK: 'Danish', IE: 'Irish',
    HU: 'Hungarian', CZ: 'Czech', FI: 'Finnish', NO: 'Norwegian', US: 'American' },
};

// ---------------------------------------------------------------------------------------------------------------
function parseApplicants(s) {
  return s.split('|').map(x => { const [p, w, v] = x.trim().split(' '); return { p, w, s: +v }; });
}
function parseJudges(s, prefix) {
  return s.trim().split(/\s+/).map((x, i) => { const [p, w] = x.split('/'); return { id: prefix + i, p, w }; });
}
const APPLICANTS = parseApplicants(CONFIG.applicants);

function isBig(country) { return CONFIG.bigFive.indexOf(country) >= 0; }
function matchType(app, judge) {
  if (app.p === judge.p && app.w === judge.w) return 'both';
  if (app.w === judge.w) return 'country';
  if (app.p === judge.p) return 'citz';
  return null;
}
// How much of a home star each kind of match is worth: the bonus relative to the both-match bonus
function starWeight(type, bonus) { bonus = bonus || CONFIG.bonus; return type ? bonus[type] / bonus.both : 0; }

// Expected exposure and home stars for a panel (any size), by applicant group.
// shares: % of panel members matching (Table 2's measure). stars: expected home stars per 10 juries, i.e.
// starsPer × reviewersPerProposal × Σ_judges (1/panelSize) × weight(match) — random assignment within the panel.
// bonusPts: the expected bonus on one mark, in points (stars × 0.164 / (starsPer × reviewers)).
// The four applicant groups shown as bars: passport row × workplace column. They classify applicants, never judges.
// bigP = passport of a Big Five country; bigW = works in a Big Five country. XX/ZZ passports count as "other".
const CELLS = ['bigP_bigW', 'bigP_othW', 'othP_bigW', 'othP_othW'];
function cellOf(a) { return (isBig(a.p) ? 'bigP' : 'othP') + '_' + (isBig(a.w) ? 'bigW' : 'othW'); }

// Expected exposure and home stars for a panel (any size), by applicant group.
// shares: % of panel members matching (Table 2's measure). stars: expected home stars per 10 juries, i.e.
// starsPer × reviewersPerProposal × Σ_judges (1/panelSize) × weight(match) — random assignment within the panel.
// Every group value is the applicant-weighted average over the applicants in that group (never an average of other groups' values).
// big / other: by workplace, as in Table 2 (the success measure). cells: the four passport × workplace groups.
function evaluate(panel, opts) {
  opts = opts || {};
  const bonus = opts.bonus || CONFIG.bonus, apps = opts.applicants || APPLICANTS;
  const R = opts.reviewers || CONFIG.reviewersPerProposal;
  const blank = () => ({ both: 0, country: 0, citz: 0, wsum: 0, w: 0 });
  const g = { big: blank(), other: blank() }, c = {};
  CELLS.forEach(k => { c[k] = blank(); });
  const n = panel.length;
  for (const a of apps) {
    const G = isBig(a.w) ? g.big : g.other, Cc = c[cellOf(a)];
    G.w += a.s; Cc.w += a.s;
    if (!n) continue;
    for (const j of panel) {
      const t = matchType(a, j);
      if (t) { for (const X of [G, Cc]) { X[t] += a.s / n; X.wsum += a.s * starWeight(t, bonus) / n; } }
    }
  }
  const summ = G => ({
    both: 100 * G.both / G.w, country: 100 * G.country / G.w, citz: 100 * G.citz / G.w,
    stars: CONFIG.starsPer * R * G.wsum / G.w,
    bonusPts: G.wsum / G.w * bonus.both, // expected bonus on one mark, in points
    weight: G.w,                          // % of all applicants in this group
  });
  const out = { big: summ(g.big), other: summ(g.other), cells: {} };
  CELLS.forEach(k => { out.cells[k] = summ(c[k]); });
  out.ratio = out.other.stars > 0 ? out.big.stars / out.other.stars : Infinity;
  out.gap = out.big.stars - out.other.stars;
  out.level = Math.abs(out.gap) <= CONFIG.levelTol;
  return out;
}

// Stars implied by the paper's own Table 2 shares (the real ERC's lean)
function table2Stars(bonus) {
  bonus = bonus || CONFIG.bonus;
  const f = s => CONFIG.starsPer * CONFIG.reviewersPerProposal *
    (s.both * starWeight('both', bonus) + s.country * starWeight('country', bonus) + s.citz * starWeight('citz', bonus)) / 100;
  const big = f(CONFIG.table2.big), other = f(CONFIG.table2.other);
  return { big, other, ratio: big / other };
}

// Whom a judge favours: % of all applicants for whom this judge is a full / half / third home judge
function favours(judge) {
  let tot = 0; const r = { both: 0, citz: 0, country: 0 };
  for (const a of APPLICANTS) { tot += a.s; const t = matchType(a, judge); if (t) r[t] += a.s; }
  for (const k in r) r[k] = 100 * r[k] / tot;
  return r;
}

// --- Game state: all rules that affect outcomes ----------------------------------------------------------------
function newRound1() {
  return { round: 1, pool: parseJudges(CONFIG.pool, 'p'), seated: [], revealed: false };
}
// Tap a pool judge: seat if free and room, unseat if seated. Returns the new state (pure).
function toggleSeat(st, id) {
  if (st.revealed) return st;
  const seated = st.seated.slice(), i = seated.indexOf(id);
  if (i >= 0) seated.splice(i, 1);
  else if (seated.length < CONFIG.panelSize) seated.push(id);
  const full = seated.length === CONFIG.panelSize;
  return Object.assign({}, st, { seated, revealed: full });
}
function panelOf(st) {
  if (st.round === 1) return st.seated.map(id => st.pool.find(j => j.id === id));
  return st.table.slice();
}
function newRound2() {
  return { round: 2, table: parseJudges(CONFIG.ercPanel, 'e'), bench: parseJudges(CONFIG.bench, 'b'),
    swapsLeft: CONFIG.swaps, swapsUsed: 0, done: false, history: [] };
}
// Swap the seated judge at seatIdx with the bench judge at benchIdx, if swaps remain.
function swap(st, seatIdx, benchIdx) {
  if (st.done || st.swapsLeft <= 0) return st;
  const table = st.table.slice(), bench = st.bench.slice();
  const out = table[seatIdx], inn = bench[benchIdx];
  if (!out || !inn) return st;
  table[seatIdx] = inn; bench[benchIdx] = out;
  const ns = Object.assign({}, st, { table, bench, swapsLeft: st.swapsLeft - 1, swapsUsed: st.swapsUsed + 1,
    history: st.history.concat([[out.p + '/' + out.w, inn.p + '/' + inn.w]]) });
  if (evaluate(table).level || ns.swapsLeft === 0) ns.done = true;
  return ns;
}
function finishRound2(st) { return Object.assign({}, st, { done: true }); }

// A tiny seeded RNG for the calibration check's simulation (not used by the game)
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// Simulate proposals drawn from the applicant population, each read by 4 or 5 judges drawn at random (mean 4.2).
// Returns mean home stars per 10 juries by group: a check of evaluate()'s analytic expectation.
function simulate(panel, nProps, seed) {
  const r = rng(seed), apps = APPLICANTS, tot = apps.reduce((a, b) => a + b.s, 0);
  const acc = { big: [0, 0], other: [0, 0] };
  for (let k = 0; k < nProps; k++) {
    let u = r() * tot, a = apps[0];
    for (const x of apps) { u -= x.s; if (u <= 0) { a = x; break; } }
    const m = r() < (CONFIG.reviewersPerProposal - 4) ? 5 : 4;
    const idx = panel.map((_, i) => i);
    for (let i = 0; i < m; i++) { const j = i + Math.floor(r() * (idx.length - i)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    let st = 0;
    for (let i = 0; i < m; i++) st += starWeight(matchType(a, panel[idx[i]]));
    const G = acc[isBig(a.w) ? 'big' : 'other']; G[0] += st; G[1]++;
  }
  return { big: CONFIG.starsPer * acc.big[0] / acc.big[1], other: CONFIG.starsPer * acc.other[0] / acc.other[1] };
}

const MECH = { CONFIG, APPLICANTS, CELLS, cellOf, parseApplicants, parseJudges, isBig, matchType, starWeight, evaluate, table2Stars,
  favours, newRound1, toggleSeat, panelOf, newRound2, swap, finishRound2, simulate, rng };
if (typeof module !== 'undefined') module.exports = MECH;
