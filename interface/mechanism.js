// Who Started It? — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build if
// the embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY, calibrated. A bargaining toy formalising the conflict model of C. Kreuder-Sonnen, A. Schmotz and M. Zürn,
// "The complex effects of regime complexity: a conflict model", European Journal of International Relations 32(2) (2026):
// 611–638, doi:10.1177/13540661251368630. The paper's argument (Figs 1–2, pp. 615–617): a clash between two institutions'
// rules (an "interface conflict") is either non-instrumental (an accidental side-effect of a new event or issue; its parties
// also value the public goods at stake, so they compromise) or instrumental (created on purpose to challenge an institution;
// at least one party takes a position incompatible with the other's, so management is non-cooperative, "at least
// initially", though it "can shift toward cooperation over time"). Cooperative management tends to integrate the regime
// complex, non-cooperative management to fragment it. Here the player is one party; the other party's behaviour is fixed by
// the clash's origin; the order effect is drawn with the rates of the paper's three clusters (Fig. 4). Everything tagged
// "ours" is the toy's, not the paper's.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.CLASH = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the paper's counts (Table 1 and Fig. 4, simple three-variable cluster solution; Ward linkage on Gower distance)
    PAPER: {
      N: 77,                                   // Table 1: 77 interface conflicts, ICD 2.0, starting 1970–2018
      intentional: 42, unintended: 35,         // Table 1: origin intentional 42 (54.5 %), unintended 35 (45.5 %)
      coop: 59,                                // Table 1: management cooperative 59 (76.6 %)
      integ: 46, integN: 76,                   // Table 1: order effect integration 46 of 76 (60.5 %)
      benign: { n: 35, coop: 33, integ: 25, integN: 34 }, // Fig. 4, cluster 1: 0 % instrumental, 94 % (33) coop, 74 % (25) integ
      hybrid: { n: 26, coop: 26, integ: 20 },  // Fig. 4, cluster 2: 100 % instrumental, 100 % (26) coop, 77 % (20) integ
      malign: { n: 16, coop: 0, integ: 1 },    // Fig. 4, cluster 3: 100 % instrumental, 0 % coop, 6 % (1) integ
      coopFrag: { benign: 8, hybrid: 6 },      // note 10: sub-clusters of cooperative but fragmenting conflicts
    },
    // ---- the deck: nine clashes in the clusters' proportions (35 : 26 : 16 of 77 is 4.1 : 3.0 : 1.9 in nine)
    CLASHES: 9,                                // ours: nine clashes, about five to six minutes
    DECK: { accident: 3, messy: 1, popular: 3, hostile: 2 }, // accident + messy = the benign cluster (4); popular = hybrid
                                               //   (3); hostile = malign (2). One accident is "messy", after the paper's
                                               //   Zimbabwe case (pp. 629–631): mainly non-instrumental, partly not
    FIRST: 'accident',                         // ours: clash 1 is a plain accident, to learn what a deal is
    THEN: ['popular', 'hostile'],              // ours: clashes 2 and 3 are one of each kind started on purpose, in random
                                               //   order, so both lessons land inside three minutes (a floor, not a ramp)
    // ---- pages: the price of cooperation (all ours; the paper has cooperative vs non-cooperative management, no currency)
    PAGES: 14,                                 // ours: the purse for the whole game. Exactly what the "historical" player
                                               //   spends (calibration.js, section C); a perfect reader of the deck spends 11
    MAX_OFFER: 4,                              // ours: at most 4 pages in one offer
    PRICE: {                                   // ours: pages given (in all, over the clash) at which the other side settles
      accident: 1,                             //   a new problem, both sides open to compromise (p. 616): one page
      messy: 2,                                //   a bit of both (Zimbabwe): dearer
      popular: 2,                              //   started on purpose, with a cause that wins wide support (IRENA, pp. 627–628)
      hostile: Infinity,                       //   started on purpose to pull a body down (UNRWA, pp. 625–627: "no interest in
                                               //   rectifying the norm collision other than the complete abandonment"; AU vs
                                               //   UN Security Council, p. 616): no price
    },
    DIG_IN: 1,                                 // ours: an accident (or the messy one) met with nothing at the first offer
                                               //   costs one page more: non-cooperation begets non-cooperation (p. 617)
    CROWD: { accident: null, messy: null, popular: 'them', hostile: 'you' }, // ours: after a first offer that does not
                                               //   settle, whom the wider public sides with. The paper's explanation of the
                                               //   hybrid path (IEA vs IRENA, p. 628): the challenger's cause "resonated
                                               //   increasingly well with trans- and international audiences", leaving the IEA
                                               //   facing "a legitimacy crisis". Malign: the General Assembly renewed UNRWA's
                                               //   mandate despite the challenge (p. 626), so the crowd sides with the
                                               //   challenged body. Generalised from one case each: ours
    CROWD_NOISE: 0,                            // ours: chance the crowd sides the other way (0 in the game; the robustness
                                               //   check in calibration.js runs 0.2)
    CROWD_TAKES_FIRST: 1,                      // ours: a crowd against you takes 1 page when it gathers (members drift: the
                                               //   US joined IRENA in 2011, p. 628)
    CROWD_TAKES_END: 2,                        // ours: and 2 more if the clash ends without a deal
    // ---- years later: the order effect, drawn with the clusters' rates
    KNIT: {
      dealAccident: 25 / 33,                   // Fig. 4 and note 10: cluster 1, 25 integrative of the 33 cooperative (8 coop
                                               //   but fragmenting) = 0.76
      dealPurpose: 20 / 26,                    // Fig. 4: cluster 2, 20 of 26 integrative = 0.77
      standoff: 1 / 16,                        // Fig. 4: cluster 3, 1 of 16 integrative = 0.06
    },
    SEED_MAX: 9999,                            // ours: decks are numbered 1–9999; the number is shown and replayable
  };

  // ---- the pool of clashes (ours: made up, each in the shape of a kind of case in the paper; real ones on the end screen)
  // you/them: the two bodies and their rules; cue: what fell into the overlap (a new problem) or who pushed (on purpose);
  // how: how it began, in the game's voice; say: what they say; deal / tear: what a settled seam and a torn one look like
  // years later; want (hostile only): what they wanted all along.
  const POOL = [
    { id: 'dam', kind: 'accident', you: { name: 'Development Bank', rule: 'Our loans are about money, never politics.' },
      them: { name: 'Rights Office', rule: 'People moved off their land have rights.' },
      cue: 'a dam that will flood villages', how: 'Nobody planned this clash. A new dam landed where both rulebooks apply.',
      say: 'Let\'s find a way through this together.',
      deal: 'The Bank now checks people\'s rights before it lends.', tear: 'The Bank lends, the Rights Office condemns, and the two stop talking.' },
    { id: 'pain', kind: 'accident', you: { name: 'Drug Board', rule: 'Strong painkillers stay under lock and key.' },
      them: { name: 'Health Office', rule: 'People in pain must get relief.' },
      cue: 'hospitals with no painkillers', how: 'Nobody planned this clash. Hospitals in poor countries ran out of painkillers, and both rulebooks apply.',
      say: 'We both want people safe. Let\'s talk.',
      deal: 'Painkillers reach hospitals; the locks stay on for the street trade.', tear: 'Each body gives its own advice, and doctors don\'t know which to follow.' },
    { id: 'rescue', kind: 'accident', you: { name: 'Shipping Office', rule: 'Rescued people are landed at the nearest port.' },
      them: { name: 'Refugee Office', rule: 'Nobody is sent back to danger.' },
      cue: 'a boat of refugees in a storm', how: 'Nobody planned this clash. A rescue at sea, and the nearest port is the place they fled.',
      say: 'Your rule and ours both mean well. Let\'s square them.',
      deal: 'Rescued people are now landed at a safe port, not just the nearest.', tear: 'Captains face two rulebooks, and some stop rescuing.' },
    { id: 'virus', kind: 'accident', you: { name: 'Trade Office', rule: 'Borders stay open to goods.' },
      them: { name: 'Health Office', rule: 'Borders close when a disease spreads.' },
      cue: 'a new virus', how: 'Nobody planned this clash. A new virus arrived, and both rulebooks apply.',
      say: 'This is new for both of us. Let\'s work it out.',
      deal: 'Borders now close to the sick, not to the goods.', tear: 'Every country follows whichever rule suits it.' },
    { id: 'tuna', kind: 'accident', you: { name: 'Fisheries Office', rule: 'Each country may catch its quota.' },
      them: { name: 'Wildlife Treaty', rule: 'No trade in animals close to dying out.' },
      cue: 'a tuna that is suddenly rare', how: 'Nobody planned this clash. A tuna grew rare, and both rulebooks apply.',
      say: 'Neither of us saw this coming. Let\'s sort it out.',
      deal: 'Quotas are cut wherever the tuna is listed as rare.', tear: 'Boats fish their quota; the treaty bans the sale; ports ignore one or the other.' },
    { id: 'land', kind: 'messy', you: { name: 'Investment Court', rule: 'Foreign owners are paid for land that is taken.' },
      them: { name: 'Rights Office', rule: 'Land goes back to the people who lived there first.' },
      cue: 'farms handed back', push: 'a government glad to use it',
      how: 'A bit of both. Old history made this clash, and a government is glad to use it.',
      say: 'Our people\'s rights come first. But we will go to court.',
      deal: 'The court rules, the government pays in the end, and judges start to weigh people\'s rights in cases like it.', tear: 'The government refuses to pay, and the owners chase its property abroad.' },
    { id: 'ivory', kind: 'messy', you: { name: 'Wildlife Treaty', rule: 'No trade in ivory.' },
      them: { name: 'Trade Office', rule: 'A country may sell what it lawfully owns.' },
      cue: 'a warehouse of old ivory', push: 'governments keen to sell',
      how: 'A bit of both. Poaching filled the warehouses, and some governments are glad to use the trade rules.',
      say: 'Let us sell it, once, under your eye.',
      deal: 'One sale under watch, then the ban holds.', tear: 'The warehouses leak, and both rulebooks are flouted.' },
    { id: 'sun', kind: 'popular', you: { name: 'Oil Agency', rule: 'Keep the world\'s oil flowing.' },
      them: { name: 'Sun & Wind Agency', rule: 'Switch the world to sun and wind.' },
      push: 'countries that want the world off oil', how: 'Started on purpose. Countries that want the world off oil founded a new agency to challenge yours.',
      say: 'Your rules belong to the past. Make room for ours.',
      deal: 'You open a sun-and-wind desk, and the two agencies sign a partnership.', tear: 'Two agencies, two sets of numbers, and governments quote whichever they like.' },
    { id: 'pills', kind: 'popular', you: { name: 'Patent Office', rule: 'A new medicine is its inventor\'s for twenty years.' },
      them: { name: 'Health Office', rule: 'In an epidemic, medicine must be cheap.' },
      push: 'poorer countries and campaigners', how: 'Started on purpose. Poorer countries and campaigners took the Health Office\'s rule to fight yours.',
      say: 'People are dying while you count royalties.',
      deal: 'Poor countries may copy medicines in an emergency; patents stand everywhere else.', tear: 'Copies are made anyway, and lawsuits fly for years.' },
    { id: 'mines', kind: 'popular', you: { name: 'Arms Conference', rule: 'Weapons treaties need every country\'s yes.' },
      them: { name: 'Mine Ban Treaty', rule: 'Ban landmines now, with whoever will sign.' },
      push: 'countries and campaigners tired of waiting', how: 'Started on purpose. Countries and campaigners tired of waiting for you wrote their own treaty.',
      say: 'You have had years. We are going ahead.',
      deal: 'The Conference takes the ban\'s rules into its own talks.', tear: 'Two clubs, two sets of rules, and the big powers sign neither.' },
    { id: 'deep', kind: 'popular', you: { name: 'Seabed Authority', rule: 'Licence mining of the deep seabed.' },
      them: { name: 'High Seas Treaty', rule: 'Protect life in the deep ocean first.' },
      push: 'countries that want the deep sea left alone', how: 'Started on purpose. Countries that want the deep sea left alone set up a treaty to challenge yours.',
      say: 'Not one more licence until the ocean is safe.',
      deal: 'Mining waits until the treaty\'s surveys are done.', tear: 'Licences are issued and protested; nobody knows whose rule counts.' },
    { id: 'bloc', kind: 'hostile', you: { name: 'Council', rule: 'We decide when a war needs outside help.' },
      them: { name: 'Regional Bloc', rule: 'No outsider meddles in our region.' },
      push: 'a bloc that wants your Council out', how: 'Started on purpose. A bloc that wants your Council out of its region dug up an old rule of non-interference.',
      say: 'Your rule stops at our border.',
      want: 'your Council out of their region for good', deal: 'The two bodies plan together for the next war.', tear: 'Each runs its own plan for the war, and trust between them sours.' },
    { id: 'court', kind: 'hostile', you: { name: 'Trade Court', rule: 'Our judges settle trade disputes.' },
      them: { name: 'Treaty Office', rule: 'Judges may not make new law.' },
      push: 'a powerful government that lost a case', how: 'Started on purpose. A powerful government that lost a case points to another body\'s rule to undo your court.',
      say: 'Your judges overstepped. Hand disputes back to governments.',
      want: 'your court shut', deal: 'The court sits again under rules both sides accept.', tear: 'The court stops sitting, and disputes pile up.' },
    { id: 'rights', kind: 'hostile', you: { name: 'Rights Court', rule: 'Anyone may take their government to us.' },
      them: { name: 'Council', rule: 'A country\'s own courts have the last word.' },
      push: 'a government tired of losing cases', how: 'Started on purpose. A government tired of losing cases digs up another body\'s rule to get out from under yours.',
      say: 'Our own courts are enough. Step aside.',
      want: 'out from under your court altogether', deal: 'The government stays, and its courts follow yours.', tear: 'The government ignores your rulings, and others start to copy it.' },
  ];

  // ---- the paper's word for each kind, said after a clash ends (the counts are Fig. 4's)
  const PAPER_WORD = {
    accident: 'An accidental clash, the paper\'s "non-instrumental" kind. Of 35 real ones, 33 were settled together.',
    messy: 'A bit of both, like the paper\'s own Zimbabwe case: mostly an accident, with a government glad to use it. The paper counts it with the accidents.',
    popular: 'Started on purpose, the paper\'s "instrumental" kind, by a side with a popular cause. Of the paper\'s 42 started on purpose, 26 were settled in the end; its guess, from one case, is that the challenger\'s cause had won over a wider public.',
    hostile: 'Started on purpose, the paper\'s "instrumental" kind, and fought to the end: like 16 of its 42. None of the 16 was settled; all but one tore.',
  };

  // ---- seeded randomness (mulberry32): the deck and the years-later draws; nothing else is random
  function rng(seed) { let a = (seed >>> 0) || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const purpose = k => k === 'popular' || k === 'hostile';
  const origin = k => (purpose(k) ? 'purpose' : k);   // what the player can see: accident, messy, or started on purpose

  // ---- deal a deck: the clusters' proportions, the first clash an accident, clashes 2–3 one of each kind started on purpose
  function deal(seed) {
    const r = rng(seed * 7919 + 17);
    const pick = {};
    for (const k of Object.keys(CONFIG.DECK)) pick[k] = shuffle(POOL.filter(c => c.kind === k), r).slice(0, CONFIG.DECK[k]);
    const first = pick[CONFIG.FIRST].shift();
    const then = shuffle(CONFIG.THEN.map(k => pick[k].shift()), r);
    const rest = shuffle([].concat(...Object.values(pick)), r);
    const d = [first, ...then, ...rest].map(c => Object.assign({}, c, { u: r(), v: r() }));   // u: the years-later draw; v:
                                               //   the crowd-noise draw (unused at CROWD_NOISE 0); both fixed per deck
    // ours, a floor: the first deal a player sees should knit, so the look of a knit seam is learnt first. If clash 1's draw
    // would fray, it swaps draws with another accident in the same deck: the deck's count of frays is unchanged.
    if (d[0].u >= CONFIG.KNIT.dealAccident) {
      const j = d.findIndex((c, i) => i > 0 && (c.kind === 'accident' || c.kind === 'messy') && c.u < CONFIG.KNIT.dealAccident);
      if (j > 0) [d[0].u, d[j].u] = [d[j].u, d[0].u];
    }
    return d;
  }

  function newSeed() { return 1 + Math.floor(Math.random() * CONFIG.SEED_MAX); }   // which deck to deal, when none is asked for
  function newGame(seed) {
    seed = Math.max(1, Math.min(CONFIG.SEED_MAX, Math.round(seed) || 1));
    return { seed, deck: deal(seed), i: 0, pages: CONFIG.PAGES, c: null, done: [], over: false, _start: true };
  }
  // the clash in play, as the player may see it (its kind stays hidden until it ends; only its origin shows)
  function current(g) {
    if (g.over) return null;
    if (!g.c || g.c.idx !== g.i) {
      const card = g.deck[g.i];
      g.c = { idx: g.i, card, round: 1, given: 0, price: CONFIG.PRICE[card.kind], crowd: null, crowdTook: 0, offers: [], ended: false };
    }
    const { card } = g.c;
    return { n: g.i + 1, of: CONFIG.CLASHES, origin: origin(card.kind), id: card.id, you: card.you, them: card.them, cue: card.cue || null,
      push: card.push || null, how: card.how, say: card.say, round: g.c.round, pages: g.pages, maxOffer: Math.min(CONFIG.MAX_OFFER, g.pages),
      given: g.c.given, crowd: g.c.crowd };
  }

  // ---- the move: give n pages now. Every page given is gone, deal or no deal; pages given in the first offer count toward
  // the second. Returns what happened, for the screen.
  function offer(g, n) {
    const view = current(g); const s = g.c, card = s.card, k = card.kind;
    if (s.ended) throw new Error('clash already over');
    n = Math.max(0, Math.min(Math.round(n) || 0, view.maxOffer));
    const before = g.pages;
    g.pages -= n; s.given += n; s.offers.push(n);
    const res = { round: s.round, n, before, settled: false, theyGive: false, crowd: null, final: false, end: null, kindSeen: origin(k) };
    if (s.round === 1 && n === 0 && (k === 'accident' || k === 'messy')) { s.price += CONFIG.DIG_IN; res.dugIn = true; }
    if (s.given >= s.price) { res.settled = true; res.theyGive = k === 'accident' || k === 'messy'; }
    if (!res.settled && s.round === 1) {
      let side = CONFIG.CROWD[k];
      if (side && card.v < CONFIG.CROWD_NOISE) side = side === 'them' ? 'you' : 'them';
      if (side) {
        const took = side === 'them' ? Math.min(CONFIG.CROWD_TAKES_FIRST, g.pages) : 0;
        g.pages -= took; s.crowdTook += took; s.crowd = side; res.crowd = { side, took };
      }
      s.round = 2;
    } else {
      res.final = true; res.end = finish(g, res.settled);
    }
    res.after = g.pages;
    return res;
  }

  function finish(g, settled) {
    const s = g.c, card = s.card, k = card.kind; s.ended = true;
    let took = 0;
    if (!settled && s.crowd === 'them') { took = Math.min(CONFIG.CROWD_TAKES_END, g.pages); g.pages -= took; s.crowdTook += took; }
    const p = settled ? (purpose(k) ? CONFIG.KNIT.dealPurpose : CONFIG.KNIT.dealAccident) : CONFIG.KNIT.standoff;
    const later = settled ? (card.u < p ? 'knit' : 'frayed') : (card.u < p ? 'mended' : 'torn');
    const start = CONFIG.PRICE[k];
    const rec = { n: s.idx + 1, id: card.id, kind: k, origin: origin(k), you: card.you.name, them: card.them.name, settled, later,
      given: s.given, crowdTook: s.crowdTook, offers: s.offers.slice(), crowd: s.crowd, priceStart: start, priceEnd: s.price,
      ghost: ghost(card, start, s.price), paper: PAPER_WORD[k], years: laterLine(card, settled, later) };
    g.done.push(rec);
    return Object.assign({ endTook: took }, rec);
  }

  function ghost(card, start, end) {
    if (card.kind === 'hostile') return `No number of pages would have settled it. They wanted ${card.want}.`;
    const p = x => `${x} page${x === 1 ? '' : 's'}`;
    if (end > start) return `They would have settled for ${p(start)} at the start; after you gave nothing, for ${p(end)}.`;
    if (card.kind === 'popular') return `They would have settled for ${p(start)}, at the start too.`;
    return `They would have settled for ${p(start)}.`;
  }
  function laterLine(card, settled, later) {
    if (later === 'knit') return 'Years later: the seam is knit. ' + card.deal;
    if (later === 'frayed') return 'Years later: the deal held, but the two rulebooks drifted apart anyway. (About one deal in four does, in the paper\'s cases.)';
    if (later === 'mended') return 'Years later, against the odds, the two found a way after all. ' + card.deal + ' (One in sixteen, in the paper\'s cases.)';
    return 'Years later: the seam is torn. ' + card.tear;
  }

  // ---- the game's own voice: what a move did, said before anyone else speaks (all ours)
  const pg = n => `${numw(n)} page${n === 1 ? '' : 's'}`;
  function prompt(view) {
    if (view.round === 1) return 'Rewrite how many pages of your rulebook to meet them?';
    return view.given ? `Last word. The ${pg(view.given)} you gave ${view.given === 1 ? 'counts' : 'count'} toward a deal. Give more?` : 'Last word. Give them pages now, or hold the line?';
  }
  function words(res) {
    const L = [], more = res.round === 2 && res.n && res.before !== undefined, k = res.end ? res.end.kind : null;
    const gave = res.n === 0 ? (res.round === 1 ? 'You held the line and gave nothing.' : 'You held the line.')
      : `You rewrote ${numw(res.n)}${res.round === 2 ? ' more' : ''} page${res.n === 1 ? '' : 's'} of your rulebook.`;
    const acc = res.kindSeen === 'accident' || res.kindSeen === 'messy';
    if (res.settled) L.push(gave + (res.theyGive ? ' They rewrote one of theirs to meet you: a deal.' : res.round === 2 ? ' They take them and sign: a deal, after a fight.' : ' They take them and sign: a deal.'));
    else if (!res.final) L.push(gave + (res.n ? (acc ? ' Not enough for them: no deal yet.' : ` They took ${res.n === 1 ? 'it' : 'them'} and pushed on: no deal yet.`) : ' They held theirs: no deal yet.') + (res.dugIn ? ' Met with nothing, they dig in too.' : ''));
    else L.push(gave + (res.n ? (acc ? ' Still not enough for them: a stand-off.' : ` They took ${res.n === 1 ? 'it' : 'them'} and pushed on: a stand-off.`) : ' So did they: a stand-off.'));
    return L;
  }
  function crowdWords(res) {
    if (!res.crowd) return res.final ? null : 'Nobody outside the two bodies is paying much attention.';
    const who = 'The crowd gathers: other governments, the press, people far away.';
    if (res.crowd.side === 'them') return `${who} It is with them: their cause is popular. Holding out against it ${res.crowd.took ? 'has cost you a page already (your own members are drifting their way)' : 'costs you'}, and will cost you two more if this ends without a deal.`;
    return `${who} It is with you: their cause wins few friends outside their own camp. Holding out costs you nothing.`;
  }
  function endWords(end) {
    return end.endTook ? `The crowd takes ${pg(end.endTook)} more from you.` : null;
  }

  function next(g) { if (g.c && g.c.ended) { g.i++; g.c = null; if (g.i >= CONFIG.CLASHES) g.over = true; } return !g.over; }

  // ---- the end: what you did, by kind, in words; then the paper; then what it means
  function verdict(g) {
    const by = k => g.done.filter(d => (Array.isArray(k) ? k.includes(d.kind) : d.kind === k));
    const acc = by(['accident', 'messy']), pop = by('popular'), hos = by('hostile');
    const set = a => a.filter(d => d.settled).length;
    const given = a => a.reduce((s, d) => s + d.given, 0), taken = a => a.reduce((s, d) => s + d.crowdTook, 0);
    const word = (x, of) => (x === of ? (of === 2 ? 'both' : 'all ' + numw(of)) : x === 0 ? 'none' : numw(x));
    const L = [];
    // line 1: accidents
    const aS = set(acc), aG = given(acc), aBest = acc.reduce((s, d) => s + d.priceStart, 0);
    L.push(aS === acc.length
      ? `You settled ${word(aS, acc.length)} of the clashes that began by accident${aG <= aBest ? ', for the fewest pages they could take' : `, for ${numw(aG)} pages where ${numw(aBest)} would have done`}.`
      : `Of the ${numw(acc.length)} clashes that began by accident, you settled ${word(aS, acc.length)}; ${aS === 0 ? 'each' : 'the rest'} ended in a stand-off because you would not meet them.`);
    // line 2: started on purpose with the crowd behind them
    const pS = set(pop), pT = taken(pop);
    L.push(pS === pop.length
      ? `Of the five started on purpose, you settled ${word(pS, pop.length)} where the crowd took the challenger's side${pT ? `; holding out first cost you ${numw(pT)} page${pT === 1 ? '' : 's'} to the crowd` : ', paying their price before the crowd gathered'}.`
      : `Of the five started on purpose, the crowd took the challenger's side in three, and you settled ${word(pS, pop.length)} of those${pT ? `; the crowd took ${numw(pT)} of your pages` : ''}.`);
    // line 3: the ones that came to pull a body down
    const hG = given(hos), hM = hos.filter(d => d.later === 'mended').length;
    L.push(`The two started to pull a body down could not be settled at any price${hG ? `, and the ${numw(hG)} page${hG === 1 ? '' : 's'} you gave them were lost` : ', and you gave them nothing'}${hM ? '; one mended years later, against the odds' : ''}.`);
    const settled = g.done.filter(d => d.settled).length, possible = g.done.filter(d => d.kind !== 'hostile').length;
    return {
      did: L, settled, possible, pagesLeft: g.pages, knit: g.done.filter(d => d.later === 'knit' || d.later === 'mended').length,
      headline: settled === possible ? 'You settled every clash that could be settled.' : `You settled ${settled ? numw(settled) : 'none'} of the ${numw(possible)} that could be settled.`,
      paper: 'Kreuder-Sonnen, Schmotz and Zürn studied 77 real clashes between international rulebooks, 1970 to 2018. Of the 35 that began by accident, 33 were settled together, and most knit the two bodies closer. Of the 42 started on purpose, 16 were fought to the end, and all but one tore the system apart; 26 were settled after all, most of them for good.',
      means: 'So the two old camps were both right, about different clashes. Overlapping rulebooks pull the world together when they collide by accident, and apart when someone collides them on purpose, unless whoever picked the fight has the world on their side.',
    };
  }
  function numw(n) { return ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'][n] || String(n); }

  return { CONFIG, POOL, PAPER_WORD, rng, deal, newSeed, newGame, current, offer, next, verdict, origin, numw, prompt, words, crowdWords, endWords };
});
