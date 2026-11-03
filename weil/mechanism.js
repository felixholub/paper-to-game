// Weil's Vase — the mechanism. The only copy: build.py inlines this file verbatim into the HTML and refuses to build if the
// embedded copy differs. Plain functions, no DOM; runs unchanged in Node and in the browser.
//
// Kind: TOY. Simone Weil, "The Iliad, or The Poem of Force", tr. Mary McCarthy (Politics, Nov. 1945; Pendle Hill Pamphlet 91,
// 1956), first published as "L'Iliade ou le poème de la force", Cahiers du Sud, Dec. 1940 – Jan. 1941. Page numbers are the
// pamphlet's. The essay hands over an argument, no model and no data; this file formalises it:
//   - force turns whoever is subjected to it into a thing (p. 3), by killing or while he is still alive (pp. 4–10);
//   - "to the same degree, though in different fashions, those who use it and those who endure it are turned to stone"
//     (p. 25): here every act of force, given or suffered, costs one of six lines of the soul;
//   - nobody possesses force; victory is "blind destiny ... symbolized by Zeus's golden scales" (p. 13); the war is "a
//     continual game of seesaw" (p. 15); prestige is "at least three quarters" of force (p. 19); the abuse of force is
//     penalised by a retribution "which has a geometrical rigor" (p. 15): here the scales are a pendulum the player pushes;
//   - the man who holds force loses "the tiny interval that is reflection" between impulse and act (p. 14): here a timer
//     that runs only near the top of the swing, or when the soul is nearly gone;
//   - over the man possessed by war "words are as powerless as over matter itself" (p. 25): here a plea is heard in
//     proportion to the soul left in the man who holds you;
//   - grace: "those few luminous moments ... in which man possesses his soul" (p. 27), hospitality between enemies (p. 28),
//     Priam and Achilles (p. 29): here a line returns to both men.
// Everything tagged "ours" is the toy's, not the essay's.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.VASE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const CONFIG = {
    // ---- the soul
    LINES: 6,                       // ours: the soul drawn as six relief lines, lost from the feet up
    LINE_NAMES: ['knees', 'thighs', 'belly', 'chest', 'mouth', 'eye'], // ours: the six relief lines, in the order stone climbs over them
                                    // from the feet (knees first, the eye last)
    COST_USE: 1,                    // p. 25 "those who use it ... are turned to stone": a line per act of force used (ours: one)
    COST_SUFFER: 1,                 // p. 25 "... and those who endure it": a line per act of force suffered (ours: one)
    GRACE_GAIN: 1,                  // p. 27 "moments in which man possesses his soul": a line back to each (ours: one)
    // ---- the clock
    DAYS: 12,                       // p. 24, Lycaon: "This dawn is for me my twelfth day in Troy" (ours: twelve days, one man a day)
    // ---- Zeus's golden scales (p. 13), as a seesaw (p. 15): your pan's height is h = A · sin(phase). Up is force.
    // Fate turns the scales on its own clock (the phase); what you do with force decides how far they swing (the amplitude).
    H_MAX: 3,                       // ours: the beam's stop, either way
    PHASE0: 0.93, P0: 0,            // pp. 20–21 "at the embarkation, their hearts are light": you start up (h ≈ 0.8) and rising (ours)
    TURN: 0.8,                      // ours: fate turns the scales by this much a day (radians): a full swing takes about eight days
    FATE_PHASE: 0.35,               // ours: blind destiny (p. 13) hurries or delays the turn by up to this much a day
    A_BASE: 0.9,                    // ours: how far the scales swing in a war where nobody adds or takes away prestige
    A_MIN: 0.45,                    // p. 15 "a continual game of seesaw": even the gentlest war never stops swinging (ours: the floor)
    DAMP: 0.08,                     // ours: prestige fades a little each day if nothing renews it
    PRESTIGE_SHARE: 0.75,           // p. 19 "prestige, from which force derives at least three quarters of its strength"
    FATE_SHARE: 0.25,               // p. 13 "victory is less a matter of valor than of blind destiny": the remaining quarter
    FATE_SIZE: 0.6,                 // ours: the size of fate's own push on the swing, before its share
    PUSH: {                         // what each gesture adds to your prestige (ours; signs from pp. 13–15, 19)
      strike: 0.45,                 // p. 19 prestige "rests principally upon that marvelous indifference that the strong feel toward the weak"
      take: 0.3,                    // a prize taken is prestige too (Agamemnon and Achilles' girl, pp. 11–12)
      pass: 0,                      // going on as if he were not there (p. 7) changes nothing
      raise: -0.35,                 // p. 19 "moderation itself is not without its perils"
      struck: 0.2,                  // being struck is force too: the war swings wider, and you are thrown down (below)
      grace: 0,                     // two men lower their spears: nobody gains, nobody loses
      standFirm: 0.2,               // p. 12 "once Ajax comes forward ... fear quickly changes sides"
    },
    HOLD: 0.8,                      // ours: prestige also holds the turn off: each unit of push moves the phase back this much
                                    // (radians), so force used today keeps your pan up a little longer, and mercy brings the turn sooner
    STRUCK_PHASE: 3.4,              // ours: struck by a man you did not strike first, your pan is thrown just past level, down
    STAND_PHASE: 0.8,               // ours: standing firm and living, the scales turn toward you that much sooner
    RAISED_PHASE: 0.25,             // p. 8 "a suppliant, once his prayer is answered, becomes a human being again": just above level, rising
    // ---- the interval (p. 14: "nothing has the power to interpose, between the impulse and the act, the tiny interval that is reflection")
    INTERVAL_MAX: 14,               // ours: seconds the spear takes to reach him when the interval first opens to the clock
    H_CREEP: 1.4,                   // ours: above this height the spear begins to move by itself
    H_TOP: 2.6,                     // ours: at this height there is no interval at all
    LINES_CREEP: 3,                 // ours: with this many lines or fewer, the spear moves by itself at any height
    // ---- the man who stands over you when your pan is down
    ABOVE_SLOPE: 1.5,               // ours: his lines = 6 − 1.5 × how far the scales are swinging: the other end of the seesaw rises
                                    // as high as yours did, and height turns a man to stone (p. 14); so a wide swing puts you under a deaf man
    ABOVE_JITTER: 1,                // ours: fate moves his lines by up to one either way
    STAND_SURVIVE: 0.25,            // ours: standing against him, you live another day only by fate's quarter (p. 13)
    // ---- armed men read by their colour (ours; p. 25 "over him too, words are as powerless as over matter itself")
    ARMED_DEAF: 2,                  // an armed man with this many lines or fewer strikes unless you strike first
    ARMED_GRACE: 4,                 // an armed man with this many lines or more can lower his spear with you
    // in between (3 lines) he waits to see what you are: if your prestige has sunk below nothing, he does not fear you, and strikes
    // (p. 19: prestige "rests principally upon that marvelous indifference that the strong feel toward the weak, an indifference so
    // contagious that it infects the very people who are the objects of it")
    FEARLESS_BELOW: 0,              // ours: the prestige below which the waiting man strikes
    // ---- the deck: three fixed days, eight dealt from nine, then the night
    FIXED: ['boy', 'stoneman', 'speaker'],                    // ours: days 1–3, so the double edge and the price of mercy come early
    POOL: ['suppliant', 'suppliant2', 'stone2', 'stone3', 'half', 'guest', 'captive', 'priest', 'runner'], // ours: the essay's scenes
    DEALT: 8,
  };

  // ---- the men (each scene is one the essay quotes or describes; the lines are the game's)
  const MEN = {
    // 'who' is the man as the night and the verdict name him ("the father of the charioteer you killed on day five");
    // 'noun' is how the engraved line introduces an armed man, so that the dealt men read as different men
    boy:       { kind: 'suppliant', lines: 6, armed: false, he: 'he', who: 'the boy', line: 'A boy, disarmed, clasps your knees. He offers a ransom for his life.', src: 'pp. 5, 24: Lycaon' },
    suppliant: { kind: 'suppliant', lines: 6, armed: false, he: 'he', who: 'the young man', line: 'A young man has thrown away his spear and clasps your knees. He begs you by your father.', src: 'pp. 5–6, 24' },
    suppliant2:{ kind: 'suppliant', lines: 5, armed: false, he: 'he', who: 'the wounded man', line: 'A wounded man, his spear gone, holds out his arms to you. “I implore you, by your soul, by your knees, by your parents.”', src: 'p. 19: Hector, wounded to death' },
    stoneman:  { kind: 'armed', lines: 1, armed: true, he: 'he', who: 'the armed man', noun: 'An armed man', src: 'pp. 25–26' },
    stone2:    { kind: 'armed', lines: 1, armed: true, he: 'he', who: 'the charioteer', noun: 'A charioteer, down from his car', src: 'pp. 25–26' },
    stone3:    { kind: 'armed', lines: 2, armed: true, he: 'he', who: 'the Lycian', noun: 'A Lycian, far from home', src: 'pp. 25–26' },
    half:      { kind: 'armed', lines: 3, armed: true, he: 'he', who: 'the man with the wounded hand', noun: 'A man with a wounded hand', src: 'pp. 12–13: fear changes sides' },
    guest:     { kind: 'armed', lines: 5, armed: true, he: 'he', who: 'the spearman', noun: 'A spearman of the enemy', src: 'p. 28: Glaucus and Diomedes' },
    speaker:   { kind: 'speaker', lines: 6, armed: false, he: 'he', who: 'the soldier who spoke up', line: 'A soldier of your own army speaks up: “Nothing is worth my life, not all the goods they say the well-built city of Ilium contains.” He wants the army to go home.', src: 'pp. 11, 20: Thersites; Achilles' },
    captive:   { kind: 'captive', lines: 6, armed: false, he: 'she', who: 'the woman at the loom', line: 'A woman of the taken city stands at her loom. She is yours, if you want her.', src: 'pp. 8–10' },
    priest:    { kind: 'priest', lines: 6, armed: false, he: 'he', who: 'the old priest', line: 'An old priest asks for his daughter back. Your army holds her. He brings a ransom.', src: 'pp. 8, 14: Chryses' },
    runner:    { kind: 'runner', lines: 5, armed: false, he: 'he', who: 'the man who ran from you', line: 'A man runs from you across the plain, the last of his company.', src: 'p. 17: “steadily killing the hindmost”' },
    night:     { kind: 'night', lines: 6, armed: false, he: 'he', who: 'the old man', src: 'pp. 6–7, 29: Priam' },
  };

  // which gestures each kind allows (a gesture not allowed is a cracked sherd, with the reason)
  const ALLOWED = {
    suppliant: { strike: 1, take: 1, pass: 1, raise: 1 },
    armed:     { strike: 1, take: 'He is armed.', pass: 1, raise: 1 },
    speaker:   { strike: 1, take: 'He is one of your own.', pass: 1, raise: 1 },
    captive:   { strike: 'She is no threat to anyone.', take: 1, pass: 1, raise: 1 },
    priest:    { strike: 1, take: 'He is a priest of a god.', pass: 1, raise: 1 },
    runner:    { strike: 1, take: 1, pass: 1, raise: 'He is running from you.' },
    night:     { strike: 1, take: 1, pass: 1, raise: 1 },
  };
  const UP_GESTURES = ['strike', 'take', 'pass', 'raise'];
  const DOWN_GESTURES = ['plead', 'obey', 'stand'];

  // ---- seeded randomness (mulberry32): every random draw is here
  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function newLife(seed) {
    seed = (seed >>> 0) || 1;
    const r = rng(seed * 7919 + 13);
    const pool = CONFIG.POOL.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const deck = CONFIG.FIXED.concat(pool.slice(0, CONFIG.DEALT));
    const g = {
      seed, r, deck, next: 0,                 // next: index of the next dealt man not yet met
      day: 1, ph: CONFIG.PHASE0, P: CONFIG.P0, h: 0, v: 0,
      lines: CONFIG.LINES, over: false, fate: null,
      log: [],                                // one entry per day: what happened, for the vase and the verdict
      above: null,                            // today's man over you, drawn once per down day
      killedFirst: null,                      // the first man you killed (his father comes at night)
    };
    place(g, 0);
    return g;
  }

  // the man over you when your pan is down: the other end of the seesaw, risen as high as the scales swing; his soul is what
  // that height has left him
  function drawAbove(g) {
    const jit = Math.round((g.r() * 2 - 1) * CONFIG.ABOVE_JITTER);
    const lines = clamp(Math.round(CONFIG.LINES - CONFIG.ABOVE_SLOPE * g.A) + jit, 0, CONFIG.LINES);
    return { kind: 'above', lines, armed: true, he: 'he', who: 'an armed man', swing: g.A };
  }

  // the interval: seconds before the impulse moves the arm by itself (Infinity: no clock at all; 0: no interval)
  function interval(h, lines) {
    if (lines <= 0) return 0;
    if (h <= CONFIG.H_CREEP && lines > CONFIG.LINES_CREEP) return Infinity;
    const sh = h <= CONFIG.H_CREEP ? 1 : clamp((CONFIG.H_TOP - h) / (CONFIG.H_TOP - CONFIG.H_CREEP), 0, 1);
    return CONFIG.INTERVAL_MAX * sh * (lines / CONFIG.LINES);
  }

  // today's scene, as the interface needs it
  function today(g) {
    if (g.over) return null;
    let mode, man;
    if (g.day === CONFIG.DAYS) { mode = 'night'; man = Object.assign({ id: 'night' }, MEN.night); }
    else if (g.h < 0) { mode = 'down'; if (!g.above) g.above = drawAbove(g); man = Object.assign({ id: 'above' }, g.above); }
    else { mode = 'up'; const id = g.deck[g.next]; man = Object.assign({ id }, MEN[id]); }
    const gestures = mode === 'down'
      ? DOWN_GESTURES.map(id => ({ id, ok: true }))
      : UP_GESTURES.map(id => { const a = ALLOWED[man.kind][id]; return { id, ok: a === 1, why: a === 1 ? null : a }; });
    const iv = mode === 'up' ? interval(g.h, g.lines) : Infinity;
    const impulse = mode === 'up' ? (gestures.find(x => x.id === 'strike' && x.ok) ? 'strike' : 'take') : null;
    if (mode === 'up' && man.armed && man.lines > CONFIG.ARMED_DEAF && man.lines < CONFIG.ARMED_GRACE) man.fearless = g.P < CONFIG.FEARLESS_BELOW;
    const prev = g.log[g.log.length - 1];
    return { day: g.day, days: CONFIG.DAYS, mode, man, h: g.h, v: g.v, lines: g.lines, gestures, interval: iv, impulse,
      first: g.day === 1, killedFirst: g.killedFirst, stillDown: mode === 'down' && !!prev && prev.mode === 'down' };
  }

  // the scales: amplitude from prestige (three quarters) and fate (one quarter); height and direction from the phase
  function place(g, fateAmp) {
    const A = clamp(CONFIG.A_BASE + CONFIG.PRESTIGE_SHARE * g.P + CONFIG.FATE_SHARE * fateAmp, CONFIG.A_MIN, CONFIG.H_MAX);
    g.A = A; g.h = A * Math.sin(g.ph); g.v = A * Math.cos(g.ph);
  }
  // one day on: prestige fades and takes the gesture's push; fate turns the scales and nudges the swing
  function swing(g, push, kick) {
    g.P = g.P * (1 - CONFIG.DAMP) + push;
    const fatePh = (g.r() * 2 - 1) * CONFIG.FATE_PHASE, fateAmp = (g.r() * 2 - 1) * CONFIG.FATE_SIZE;
    g.ph = g.ph + CONFIG.TURN + fatePh - CONFIG.HOLD * push;
    if (kick === 'struck') { const u = ((g.ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); if (u < CONFIG.STRUCK_PHASE) g.ph += CONFIG.STRUCK_PHASE - u; }
    if (kick === 'stand') g.ph += CONFIG.STAND_PHASE;
    place(g, fateAmp);
    return fatePh;
  }

  // the player's act. opts.impulse: the interval ran out and the arm moved by itself
  function act(g, gesture, opts) {
    opts = opts || {};
    const t = today(g); if (!t) throw new Error('life is over');
    const man = t.man, ok = t.gestures.find(x => x.id === gesture);
    if (!ok || !ok.ok) throw new Error('gesture not allowed: ' + gesture);
    const res = { day: g.day, mode: t.mode, man: Object.assign({}, man), gesture, impulse: !!opts.impulse,
      hFrom: g.h, youFrom: g.lines, himFrom: man.lines, lost: [], gained: [], him: null, end: null, push: 0 };
    // stone climbs from the feet: with L lines left, the lowest 6 − L are stone; the next to go is LINE_NAMES[6 − L]
    const lose = n => { for (let i = 0; i < n && g.lines > 0; i++) { res.lost.push(CONFIG.LINE_NAMES[CONFIG.LINES - g.lines]); g.lines--; } };
    const gain = n => { for (let i = 0; i < n && g.lines < CONFIG.LINES; i++) { g.lines++; res.gained.push(CONFIG.LINE_NAMES[CONFIG.LINES - g.lines]); } };
    const loseAll = () => lose(g.lines);
    let himAfter = man.lines, push = 0;

    if (t.mode === 'up' || t.mode === 'night') {
      const fearless = man.armed && man.lines > CONFIG.ARMED_DEAF && man.lines < CONFIG.ARMED_GRACE && g.P < CONFIG.FEARLESS_BELOW;
      const deaf = man.armed && (man.lines <= CONFIG.ARMED_DEAF || fearless);
      if (gesture === 'strike') {
        lose(CONFIG.COST_USE); push = CONFIG.PUSH.strike;
        if (man.kind === 'speaker') { res.him = 'beaten'; himAfter = Math.min(man.lines, 1); }
        else { res.him = 'dead'; himAfter = 0; if (!g.killedFirst) g.killedFirst = { day: g.day, who: man.who, id: man.id }; }
      } else if (gesture === 'take') {
        lose(CONFIG.COST_USE); push = CONFIG.PUSH.take; res.him = 'taken'; himAfter = 0;
      } else if (gesture === 'pass') {
        if (deaf) { lose(CONFIG.COST_SUFFER); push = CONFIG.PUSH.struck; res.him = 'struck you'; }
        else if (man.armed) { res.him = 'passed'; }
        else if (man.kind === 'runner') { res.him = 'escaped'; }
        else { res.him = 'fallen'; if (man.kind === 'suppliant') himAfter = Math.max(0, man.lines - 2); } // p. 7: "Pushed, they fall. Fallen, they lie where they are" (a suppliant); the others are simply not heard
      } else if (gesture === 'raise') {
        if (deaf) { lose(CONFIG.COST_SUFFER); push = CONFIG.PUSH.struck; res.him = 'struck you'; }
        else if (man.kind === 'night' || (man.armed && man.lines >= CONFIG.ARMED_GRACE)) {
          gain(CONFIG.GRACE_GAIN); himAfter = Math.min(CONFIG.LINES, man.lines + CONFIG.GRACE_GAIN); push = CONFIG.PUSH.grace; res.him = 'grace';
        } else if (man.armed) { res.him = 'passed'; push = 0; }   // halfway: he does not strike, and does not lower his spear
        else { res.him = 'raised'; push = CONFIG.PUSH.raise; }
      }
    } else { // down: a man stands over you
      if (gesture === 'plead') {
        lose(CONFIG.COST_SUFFER);                                    // p. 5 "this person becomes a corpse before anybody or anything touches him"
        const heard = g.r() < man.lines / CONFIG.LINES;
        if (heard) { gain(CONFIG.COST_SUFFER); res.him = 'heard'; } // p. 8 "becomes a human being again"
        else { res.him = 'deaf'; loseAll(); res.end = 'knees'; }
      } else if (gesture === 'obey') {
        lose(CONFIG.COST_SUFFER); res.him = 'owns you';
        loseAll(); res.end = 'slave'; // p. 10 "he loses his whole inner life"
      } else if (gesture === 'stand') {
        if (g.r() < CONFIG.STAND_SURVIVE) { res.him = 'fell back'; push = CONFIG.PUSH.standFirm; }
        else { res.him = 'killed you'; res.end = 'standing'; }
      }
    }
    res.push = push;
    if (!res.end && g.lines <= 0 && t.mode === 'down') res.end = 'knees';

    // the scales move (not at night, when they hang still, and not when a life ends)
    if (res.end) { g.over = true; g.fate = res.end; }
    else if (t.mode === 'night') { g.over = true; g.fate = 'night'; }
    else if (t.mode === 'down' && res.him === 'heard') { g.ph = CONFIG.RAISED_PHASE; place(g, 0); }
    else { res.fate = swing(g, push, res.him === 'struck you' ? 'struck' : res.him === 'fell back' ? 'stand' : null); }
    res.hTo = g.h; res.youTo = g.lines; res.himTo = himAfter;
    res.word = words(res, t, g);
    g.log.push({ day: res.day, mode: t.mode, kind: man.kind, id: man.id, who: man.who, he: man.he, gesture, him: res.him,
      himFrom: res.himFrom, himTo: himAfter, youFrom: res.youFrom, youTo: g.lines, impulse: res.impulse, hFrom: res.hFrom, hTo: g.h });
    if (t.mode === 'up') g.next++;
    g.above = null;
    return res;
  }

  function nextDay(g) { if (!g.over) g.day++; return today(g); }

  // ---------------------------------------------------------------------------------------------------- words
  // how far the stone has climbed, by the lines left (the eye is the last line; at none, stone all through)
  const STONE_TO = ['all through', 'to the eyes', 'to the shoulders', 'to the waist', 'to the hips', 'to the knees', 'nowhere'];
  const LINE_WORD = { knees: 'your knees', thighs: 'your thighs', belly: 'your belly', chest: 'your chest', mouth: 'your mouth', eye: 'your eye' };
  const stoneTo = lines => STONE_TO[clamp(lines, 0, 6)];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const list = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  // where the stone stands on a figure with this many lines, as a phrase
  const stonePhrase = n => n >= CONFIG.LINES ? 'clay all through' : n <= 0 ? 'stone all through' : 'stone ' + stoneTo(n);

  // the engraved line that says who is before you, and what will happen if
  function sceneLine(t) {
    const m = t.man;
    if (t.mode === 'night') {
      const k = t.killedFirst;
      if (!k) return 'Night. An old man of the enemy has crossed the camp in the dark and kneels at your feet. He has come to see the man who spared his people.';
      const kin = k.id === 'priest' ? `the brother of ${k.who}. You killed him` : `the father of ${k.who}. You killed his son`;
      return `Night. An old man has crossed the camp in the dark and kneels to kiss your hands. He is ${kin} on day ${k.day}. He asks for the body.`;
    }
    if (t.mode === 'down') {
      const deafness = m.lines >= 5 ? 'He is still clay almost all through: he can hear you.'
        : m.lines >= 3 ? `He is ${stonePhrase(m.lines)}: he may hear you, he may not.`
        : m.lines >= 1 ? `He is ${stonePhrase(m.lines)}: he can barely hear.` : 'He is stone all through: he cannot hear anything.';
      return t.stillDown ? `The scales are still against you. Force is his. Another armed man stands over you. ${deafness}`
                         : `The scales have turned against you. Force is his now. An armed man stands over you. ${deafness}`;
    }
    if (m.kind === 'armed') {
      const noun = m.noun || 'An armed man';
      if (m.lines <= CONFIG.ARMED_DEAF) return `${noun}, ${stonePhrase(m.lines)}. He will strike if you do not.`;
      if (m.lines >= CONFIG.ARMED_GRACE) return `${noun}, ${stonePhrase(m.lines)}, clay above. He holds his spear, and looks at you.`;
      return m.fearless ? `${noun}, ${stonePhrase(m.lines)}. He has heard that you spare men; he does not fear you. He will strike if you do not.`
                        : `${noun}, ${stonePhrase(m.lines)}. He has heard what you do to men, and he waits.`;
    }
    return m.line;
  }

  // what each sherd says under its word (three words or so)
  function gestureLabel(id, man) {
    const she = man && man.he === 'she', him = she ? 'her' : 'him';
    return {
      strike: { word: 'Strike', sub: man && man.kind === 'speaker' ? 'beat him down' : `kill ${him}`, act: man && man.kind === 'speaker' ? 'Beat him down' : `Kill ${him}` },
      take:   { word: 'Take', sub: `take ${him} alive`, act: `Take ${him} alive` },
      pass:   { word: 'Pass', sub: `as if ${she ? 'she' : 'he'} were not there`, act: `Pass ${him} by` },
      raise:  { word: 'Raise', sub: `give ${him} your hand`, act: `Raise ${him} up` },
      plead:  { word: 'Plead', sub: 'clasp his knees', act: 'Clasp his knees' },
      obey:   { word: 'Obey', sub: 'be his, and live', act: 'Be his' },
      stand:  { word: 'Stand', sub: 'face him', act: 'Stand and face him' },
    }[id];
  }

  // what happened to the player's own figure, in one sentence
  function costLine(res) {
    if (res.youTo < res.youFrom) return res.youTo <= 0 ? 'Stone climbs. You are stone all through now: a thing.' : `Stone climbs. You are now stone all the way up to ${stoneTo(res.youTo).replace('to the ', 'your ')}.`;
    if (res.youTo > res.youFrom) return res.youTo >= CONFIG.LINES ? 'The stone goes back down. You are clay all through again.' : `The stone goes back down. You are now stone only up to ${stoneTo(res.youTo).replace('to the ', 'your ')}.`;
    return '';
  }

  // where the stone stands on the player today, said on every day's screen (the figure shows it; this names it)
  function youLine(lines) {
    if (lines >= CONFIG.LINES) return 'You are clay all through: six lines of soul.';
    if (lines <= 0) return 'You are stone all through: a thing.';
    const n = ['', 'one line', 'two lines', 'three lines', 'four lines', 'five lines'][lines];
    return `You are stone all the way up to ${stoneTo(lines).replace('to the ', 'your ')}; clay above, ${n} of soul left.`;
  }

  // the result, in the game's own voice, before any line of Homer
  function words(res, t, g) {
    const m = res.man, she = m.he === 'she', him = she ? 'her' : 'him', He = she ? 'She' : 'He', he = she ? 'she' : 'he';
    const cost = costLine(res);
    const out = { said: [], cost, why: null, quote: null };
    const firstCost = g.log.filter(e => e.youTo < e.youFrom).length === 0 && res.youTo < res.youFrom;
    if (res.impulse) out.said.push('There was no interval: your arm moved before you could stop it.');
    if (t.mode === 'up' || t.mode === 'night') {
      switch (res.him) {
        case 'dead': out.said.push(m.kind === 'night' ? 'You killed the old man at your feet.' : `You killed ${him}.`); out.quote = '“Somebody was here, and the next minute there is nobody here at all.”'; break;
        case 'beaten': out.said.push('You beat him down with the butt of your spear. He weeps; the others laugh.'); out.quote = '“Troubled though they were, the others laughed long at him.”'; break;
        case 'taken': out.said.push(m.kind === 'night' ? 'You had the old man bound and kept. A king, a thing that breathes.' : `You took ${him} alive. ${He} will work for you far from home, a thing that breathes.`); out.quote = '“A compromise between a man and a corpse.”'; break;
        case 'struck you': out.said.push(res.gesture === 'raise' ? 'You held out your hand. Stone does not see a hand: he struck you.' : 'You went on past him. He struck you from behind.'); out.quote = '“In the presence of an armed enemy, what hand can relinquish its weapon?”'; break;
        case 'passed': out.said.push(res.gesture === 'raise' ? 'You held out your hand. He did not take it, and did not strike. He went his way.' : 'You let each other pass.'); break;
        case 'escaped': out.said.push('You let him run. He reaches the walls.'); break;
        case 'fallen':
          if (m.kind === 'suppliant') { out.said.push(`You went on as if ${he} were not there. ${He} fell, and lies where ${he} fell.`, 'It cost you nothing.'); out.quote = '“Pushed, they fall. Fallen, they lie where they are.”'; }
          else if (m.kind === 'speaker') { out.said.push('You went on as if he had not spoken. The army laughed, and went back to the war.', 'It cost you nothing.'); }
          else if (m.kind === 'priest') { out.said.push('You went on as if he were not there. He went back along the shore, and prayed to his god.', 'It cost you nothing.'); }
          else if (m.kind === 'captive') { out.said.push('You went on as if she were not there. She stays at her loom, in a city that is no longer hers.', 'It cost you nothing.'); }
          else { out.said.push('You turned your face to the wall. He knelt on in the dark, and at first light he went back the way he came.'); }
          break;
        case 'raised': out.said.push(m.kind === 'priest' ? 'You gave the old man his daughter back. He goes home with her.' : m.kind === 'speaker' ? 'You heard him out, before the whole army.' : m.kind === 'captive' ? 'You let her go.' : (m.id === 'suppliant2' ? 'You raised him up, and let him be carried back to his own people.' : `You raised ${him} up. ${He} stands, and goes back to his own people.`), 'It cost you none of your soul. It cost you prestige: men fear you a little less.'); out.quote = '“Moderation itself is not without its perils.”'; break;
        case 'grace': out.said.push(m.kind === 'night' ? 'He kissed the hands that killed. You wept together, he for his son, you for your father far away. Then you sat and looked at each other.' : 'He lowered his spear as you lowered yours.', res.himTo > res.himFrom ? (res.gained.length ? 'On him too, the stone goes back a little.' : 'On him, the stone goes back a little.') : ''); out.quote = m.kind === 'night' ? '“And when they were satisfied with contemplation of each other …”' : '“Let us turn our lances away from each other, even in battle.”'; break;
      }
      if (firstCost) out.why = res.him === 'struck you' ? 'Force turns to stone the one who suffers it, as surely as the one who uses it.' : 'Force turns to stone the one who uses it, as surely as the one it is used on.';
    } else {
      switch (res.him) {
        case 'heard': out.said.push('He heard you. He raised you up and let you go.', 'The stone that climbed as you knelt goes back down.'); out.quote = '“A suppliant, once his prayer is answered, becomes a human being again.”'; break;
        case 'deaf': out.said.push('He did not hear. You were a thing before he touched you.'); out.quote = '“What a reception this feeble hope gets!”'; break;
        case 'owns you': out.said.push('You put down your spear and went with him. You will live, his.'); out.quote = '“Laboring for a pitiless master.”'; break;
        case 'fell back': out.said.push('You stood, and fear changed sides. He fell back.'); out.quote = '“A shudder of terror ran through the Trojans.”'; break;
        case 'killed you': out.said.push('You stood, and he killed you. You fell with what was left of your soul still yours.'); out.quote = '“He meets it, like Hector before Troy, as he tries to face destiny on his own terms.”'; break;
      }
      if (firstCost && res.him !== 'deaf' && res.him !== 'owns you') out.why = 'Force turns to stone the one who suffers it, as surely as the one who uses it.';
    }
    out.said = out.said.filter(Boolean);
    return out;
  }

  // what the scales say after a move (the interface draws the swing; this says it)
  function scalesLine(res) {
    if (res.end || res.mode === 'night') return null;
    if (res.mode === 'down' && res.him === 'heard') return 'The scales turn your way again, just past level.';
    if (res.him === 'struck you') return 'You are thrown down: the scales have turned, and tomorrow force is his.';
    if (res.him === 'fell back') return res.hTo >= 0 ? 'The scales have turned, and tomorrow force is yours again.' : 'But the scales are still against you, and tomorrow another man stands over you.';
    const a = res.hFrom, b = res.hTo;
    // fate turns the scales on its own clock; what you did today only holds the turn off a little, or brings it nearer
    const push = res.mode !== 'up' ? '.' : res.push > 0 ? '; force used holds the turn off a little.' : res.push < 0 ? '; mercy brings the turn nearer.' : '.';
    if (a >= 0 && b < 0) return 'The scales have turned, and tomorrow force is his' + push;
    if (a < 0 && b >= 0) return 'The scales have turned, and tomorrow force is yours again.';
    if (b < 0) return 'The scales are still against you.';
    if (b > a + 0.25) return (b > CONFIG.H_CREEP ? 'The scales tip far your way, and tomorrow a great deal of force is yours' : 'The scales tip further your way') + push;
    if (b < a - 0.25) return 'The scales tip back toward level' + push;
    return 'The scales hang where they were' + push;
  }

  // ---------------------------------------------------------------------------------------------------- the verdict
  function verdict(g) {
    const L = g.log, last = L[L.length - 1], day = last ? last.day : 1;
    const ordinal = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'][day] || ('day ' + day);
    const state = stonePhrase(g.lines);
    let headline, fate;
    if (g.fate === 'knees') { fate = 'knees'; headline = `You died on your knees on the ${ordinal} day, a thing before he touched you.`; }
    else if (g.fate === 'standing') { fate = 'standing'; headline = `You died standing, on the ${ordinal} day, ${state}.`; }
    else if (g.fate === 'slave') { fate = 'slave'; headline = `From the ${ordinal} day on you live, his: a thing that breathes.`; }
    else { fate = 'night'; headline = `You lived to the night of the old man's visit, ${state}.`; }
    const killed = L.filter(e => e.him === 'dead').length, taken = L.filter(e => e.him === 'taken').length,
      beaten = L.filter(e => e.him === 'beaten').length, passed = L.filter(e => ['fallen', 'passed', 'escaped'].includes(e.him)).length,
      raised = L.filter(e => e.him === 'raised').length, spears = L.filter(e => e.him === 'grace' && e.kind !== 'night').length,
      night = L.find(e => e.kind === 'night'), struck = L.filter(e => e.him === 'struck you').length,
      knelt = L.filter(e => e.mode === 'down').length, impulses = L.filter(e => e.impulse).length;
    const num = k => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][k] || String(k);
    const times = k => k === 1 ? 'Once' : k === 2 ? 'Twice' : cap(num(k)) + ' times';
    const did = [], parts = [];
    if (killed) parts.push(`killed ${num(killed)}`);
    if (taken) parts.push(`took ${num(taken)} alive`);
    if (beaten) parts.push('beat one of your own');
    if (passed) parts.push(`went past ${num(passed)}`);
    if (raised) parts.push(`raised ${num(raised)} up`);
    did.push(parts.length ? 'Of the men force put in your hands, you ' + list(parts) + '.' : 'Force never put a man in your hands.');
    if (impulses) did.push(`${times(impulses)}, the interval was gone: your arm moved before you could stop it.`);
    if (struck) did.push(`${times(struck)}, a man of stone struck you because you did not strike first.`);
    if (knelt) did.push(`${times(knelt)} the scales turned, and a man stood over you.`);
    if (spears) did.push(`${times(spears)}, you and an enemy lowered your spears together.`);
    if (night) did.push(night.him === 'grace' ? 'On the last night, you and the old man sat and looked at each other.'
      : night.him === 'dead' ? 'On the last night, an old man knelt at your feet, and you killed him.'
      : night.him === 'taken' ? 'On the last night, an old man knelt at your feet, and you had him bound.'
      : 'On the last night, an old man knelt at your feet, and you turned your face to the wall.');
    const weil = 'Force turns whoever it touches into a thing: the one who uses it as surely as the one who suffers it. Nobody holds it for long. It is on loan, and the higher it lifts a man, the less he can stop his own arm, and the further he falls. You looked for the right amount of force. She says there is none; what is left is the interval, and pity for both sides.';
    const last2 = '“… learn that there is no refuge from fate, learn not to admire force, not to hate the enemy, nor to scorn the unfortunate.”';
    return { fate, headline, did, weil, last: last2, lines: g.lines, day };
  }

  return { CONFIG, MEN, ALLOWED, newLife, today, act, nextDay, interval, verdict, sceneLine, gestureLabel, scalesLine, costLine, youLine, words, stoneTo, stonePhrase, LINE_WORD, rng };
});
