// Julian's Window — the mechanism. The only copy: calibration.js runs against this file in Node,
// build.py inlines it verbatim into the HTML, and the page only passes the player's looks in and draws what comes back.
// Source: Julian of Norwich, Revelations of Divine Love, tr. Grace Warrack (1901), chapters i–xxxii (CCEL edition).
// Chapter numbers below are Warrack's. Kind: TOY (an argument formalised; the choices the text did not make are tagged "our choice").
(function (root) {
  'use strict';

  var CONFIG = {
    beats: 10,          // our choice: ten beats, one per sight at the cross (ch. iv–xxvi), so a night cannot show everything; the first build had sixteen, for the sixteen shewings (ch. i), and ran dry after the tenth
    swingsInText: 20,   // ch. xv: "now that one, and now that other, divers times — I suppose about twenty times" (in one shewing)
    turnProb: 0.6,      // our choice: the weather turns on about six beats in ten; ~5–6 turns in 10 beats stands for the twenty in the text
    firstTurnBy: 3,     // our choice (a floor): the first heaviness no later than beat 3, so the discovery arrives early
    maxRun: 3,          // our choice: no stretch of one weather longer than 3 beats (ch. xv: "This lasted but a while")
    startWeal: true,    // ch. xv: the sureness came first ("I was fulfilled with the everlasting sureness")
    keeping: 1,         // ch. xv: "He keepeth us even alike secure in woe and in weal" — constant by construction, never read by the weather
    actsAffectWeather: 0, // ch. xv: "freely our Lord giveth when He will" — the schedule is drawn from the seed before the first look; 0 = no effect
    cheerNeedsCross: 1, // ch. xxi: "willingly abiding in the same Cross ... unto the last point, suddenly He shall change His Cheer" — our tie
    cheerAfterDrying: 1, // ch. xxi: the cheer changes at the point of death, after the drying (ch. xvi–xvii, "the most pain, and the last"); before it a lift at the cross is only a lift
    profferAfterDrying: 1, // ch. xix: "Look up to Heaven" is offered while she beholds the drying (ch. xvi–xvii); our tie to the first dark after it
    hours: ['deep night', 'deep night', 'night', 'night', 'small hours', 'small hours', 'before dawn', 'before dawn', 'first light', 'morning'] // our choice: the window's clock; the text gives no hour in these chapters
  };

  // ---- the weather: a seeded schedule, drawn once, independent of every look ----------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // true = weal (sureness, stars), false = woe (heaviness, tone)
  function schedule(seed) {
    var rng = mulberry32(seed);
    var w = [CONFIG.startWeal], run = 1, turns = 0;
    for (var t = 1; t < CONFIG.beats; t++) {
      var turn = rng() < CONFIG.turnProb;
      if (run >= CONFIG.maxRun) turn = true;
      if (turns === 0 && t === CONFIG.firstTurnBy - 1) turn = true;
      w.push(turn ? !w[t - 1] : w[t - 1]);
      if (turn) { turns++; run = 1; } else run++;
    }
    return w;
  }

  // ---- the sights --------------------------------------------------------------------------------------------------
  // Every line the game says is here. "his" is a word formed in her understanding (a balloon); "hers" is what she says or thinks
  // (a thought bubble); "caption" is the game's own voice, said first, in plain words. Chapters tag each.
  var CROSS = [
    { id: 'garland', ch: 'iv', name: 'the garland',
      caption: 'You look at the cross. Blood runs down from under the crown of thorns, hot and fresh and plentiful, drawn like everything tonight. It is as if He is here Himself, with nothing between.',
      sweet: 'The sight is quick and life-like, and sweet.', dread: 'The sight is quick and life-like, and dreadful; and it is the one thing in the room that is not horror.',
      hers: 'Benedicite Domine!' },
    { id: 'drops', ch: 'vii', name: 'the drops',
      caption: 'The drops come down from under the crown like pellets, spread on the forehead like the scales of a herring, and fall as thick as rain off the eaves after a shower. You try to count them.',
      sweet: 'Nobody could. It is horrifying and lovely at once.', dread: 'Nobody could. Tonight it is more horrifying than lovely.',
      hers: 'No man may number them.' },
    { id: 'face', ch: 'x', name: 'the face',
      caption: 'Half the face, from the ear to the middle, goes over with dry blood; then the other half, as the first clears. It is low and dim, and you are not sure it is a shewing at all. You ask to see more clearly.',
      sweet: 'You saw Him and sought Him; you had Him and wanted Him. Seeking, tonight, counts the same as seeing.', dread: 'You saw Him and sought Him; you had Him and wanted Him. The seeking is as good as the seeing, even now.',
      his: 'If God will shew thee more, He shall be thy light: thee needeth none but Him.' },
    { id: 'scourging', ch: 'xii', name: 'the scourging',
      caption: 'The body bleeds all over, as if from the scourging: no skin, no wound to be seen, as it were all blood, running down and vanishing where it would fall. There is more of it than there is water in the world.',
      sweet: 'It is plentiful because it is precious, and it is sweet to you.', dread: 'It is plentiful because it is precious; tonight the plenty is hard to look at.',
      his: 'Behold and see!' },
    { id: 'laugh', ch: 'xiii', name: 'the laugh',
      caption: 'Without voice or the opening of lips, a word is formed in you. You laugh out loud, and the people around the bed laugh too, not knowing why.',
      sweet: 'The Fiend works and works, and all he does turns to your joy and his shame. You see game, scorn, and earnest.', dread: 'Even now you laugh: the Fiend works and works, and all he does turns to your joy and his shame.',
      his: 'Herewith is the Fiend overcome.', hers: 'I see game, scorn, and earnest.' },
    { id: 'drying', ch: 'xvi–xvii', name: 'the drying',
      caption: 'The face goes pale, then blue, then brown-blue, as a thing dries. The lips crack: "I thirst." It goes on as if He had been seven nights dead and still dying. You asked for this sight once.',
      sweet: 'If you had known what it would be, you would not have asked. You hold the sight anyway.', dread: 'If you had known what it would be, you would not have asked. There is no comfort in the room but this.',
      hers: 'If I had wist what pain it had been, loth me had been to have prayed it.' },
    { id: 'pleased', ch: 'xxii', name: 'the question',
      caption: 'He asks whether you are well pleased that He suffered for you. You say yes, and thank Him. He says that if you are pleased, He is pleased, and that if He could suffer more, He would. You try to count how often He would die if He could.',
      sweet: 'The number passes your understanding. A glad giver takes little heed of what the gift cost.', dread: 'The number passes your understanding. A glad giver takes little heed of what the gift cost, even in the dark.',
      his: 'Art thou well pleased that I suffered for thee?', hers: 'Yea, good Lord, I thank Thee.' },
    { id: 'side', ch: 'xxiv', name: 'the side',
      caption: 'With a glad cheer He looks at His side and leads your eye in by the wound: a fair place, and large enough for all mankind that shall be saved to rest in.',
      sweet: 'This is shown to make you glad.', dread: 'This is shown to make you glad, and it does, a little, even now.',
      his: 'Lo, how I loved thee.' },
    { id: 'mother', ch: 'xxv', name: 'His mother',
      caption: 'He asks whether you will see her. You say yes, and expect to see her in the body, standing by the cross. You see her not so: a maid, little grown above a child; then high and noble and glad.',
      sweet: 'What you ask for and what you get are not the same shape, and the second is more than the first.', dread: 'What you ask for and what you get are not the same shape; tonight you take what is given.',
      his: 'Wilt thou see her?', hers: 'Yea, good Lord, if it be Thy will.' },
    { id: 'itisi', ch: 'xxvi', name: '"It is I"',
      caption: 'He shows Himself more glorified than before, and says, many times, that it is He: the highest, the one you love, the one you serve, the one you long for, the one that is all. The words go past counting.',
      sweet: 'You keep what you can.', dread: 'You keep what you can, and it is enough.',
      his: 'It is I, it is I: it is I that is highest; it is I that thou lovest; it is I that is all.' }
  ];
  var SEEKING = { id: 'seeking', ch: 'x', name: 'seeking',
    caption: 'The cross is dim and you keep looking: without sloth, without murmuring, trusting. Nothing more is shown this beat.',
    sweet: 'Seeking is as good as beholding, for the time He lets the soul be in travail. His appearing, when it comes, will be sudden.',
    dread: 'Seeking is as good as beholding, for the time He lets the soul be in travail. His appearing, when it comes, will be sudden.' };
  var CHEER = { id: 'cheer', ch: 'xxi',
    caption: 'And with no time between, the cheer changes: the heaviness is gone from the face and from the room at once.',
    his: 'Where is now any point of thy pain, or of thy grief?', hers: 'And I was as glad and merry as it was possible.' };
  var CHEER_AGAIN = { id: 'cheer', ch: 'xxi',
    caption: 'And again, with no time between, the cheer changes.', his: 'Where is now any point of thy pain?' };
  var NAY = { ch: 'xix', line: 'A friendly voice says to look up, to His Father; nothing between the cross and heaven could harm you. You look at the cross instead.',
    after: 'Staying was a choice, not a safety.', hers: 'Nay; I may not: for Thou art my Heaven.' };

  var WITHIN = [
    { id: 'hazelnut', ch: 'v', name: 'the hazelnut',
      caption: 'You look within, and in the palm of your hand there is a little thing, round as a ball, the size of a hazelnut. You ask what it is, and are answered: it is all that is made. You wonder how it lasts; it looks as if it might fall to nothing for littleness.',
      more: 'Three things about it: He made it, He loves it, He keeps it.',
      hers: 'What may this be?', his: 'It lasteth, and ever shall, for that God loveth it.' },
    { id: 'sin', ch: 'xi', name: 'what sin is',
      caption: 'You see God in a point: in everything, doing everything. You ask what sin is. Nothing is done by chance; chance is the name our blindness gives to what we did not foresee. Sin is no deed.',
      more: 'All that is done is well done, for He does it.',
      hers: 'What is sin?', his: 'See! I am God: see! I am in all thing: see! I do all thing. How should any thing be amiss?' },
    { id: 'cause', ch: 'xv', name: 'what brought it', onlyWoe: true,
      caption: 'You search yourself for the sin that brought this heaviness. There is none: you did nothing tonight to be left for. And there was nothing you did to earn the sureness before it, either.',
      more: 'Freely He gives when He will, and lets the heaviness come when He will; both are one love.',
      hers: 'I sinned not wherefore I should be left to myself.' },
    { id: 'cause', ch: 'xv', name: 'what earned it', onlyWeal: true,
      caption: 'You search yourself for what earned this sureness. Nothing did; you deserved it no more than you deserved the heaviness.',
      more: 'Freely He gives when He will, and lets the heaviness come when He will; both are one love.',
      hers: 'I deserved not to have this blessed feeling.' },
    { id: 'pain', ch: 'xvii', name: 'whether any pain is like this',
      caption: 'You ask whether any pain is like this one. You are answered in your reason: hell is another pain, for there is despair in it. Of all the pains that lead anywhere, this is the greatest: to watch the one you love suffer.',
      more: 'You find that you love Him so much above yourself that there is no pain like seeing Him in pain.',
      hers: 'Is any pain like this?', his: 'Hell is another pain: for there is despair.' },
    { id: 'whysin', ch: 'xxvii', name: 'why sin was not prevented',
      caption: 'You ask why, with all His foreseeing, the beginning of sin was not prevented; then all would have been well. You are answered. Sin has no substance; it is known only by the pain it causes.',
      more: 'The pain is something, for a time: it makes us know ourselves and ask for mercy.',
      hers: 'Why was the beginning of sin not hindered?', his: 'It behoved that there should be sin; but all shall be well, and all shall be well, and all manner of thing shall be well.' },
    { id: 'howwell', ch: 'xxix', name: 'how all might be well',
      caption: 'You ask how all might be well, for the great harm that sin has done. He answers mildly: the worst harm ever done has been made well already, and that making-well pleases Him more than the harm hurt; so the lesser harms will be made well too.',
      more: 'Take heed to this: since He has made well the most harm, He will make well all that is less.',
      hers: 'Ah, good Lord, how might all be well?', his: 'Since I have made well the most harm, it is my will that thou know thereby that I shall make well all that is less.' },
    { id: 'hid', ch: 'xxx, xxxii', name: 'the hidden part',
      caption: 'You ask the thing you most want to know: who is lost, and how it can be well with them, when the Church teaches that many are condemned. You meet a wall. The hidden part is His, and those who make themselves busy with it are not the better for it.',
      more: 'You hold both at once, what the Church teaches and what you heard, and you are told to trust.',
      hers: 'How might all be well, with so many lost?', his: 'That which is impossible to thee is not impossible to me: I shall save my word in all things, and I shall make all things well.' }
  ];
  var REST = { id: 'rest', ch: 'xv', name: 'rest',
    caption: 'You look within. Nothing more is asked tonight. You rest, and you are kept the same.', more: '' };

  var WINDOW = {
    ch: 'xix',
    caption: 'You look at the window. Nothing here could harm you; nothing here is shown.',
    skies: { 'deep night': 'The sky is black.', 'night': 'The sky is black, with a few stars.', 'small hours': 'The sky is black; the stars have moved.',
             'before dawn': 'The sky has gone grey at the bottom.', 'first light': 'The sky is pale.', 'morning': 'The sky is light.' },
    proffer: { ch: 'xix', line: 'A friendly voice says to look up, to His Father. You look up. Nothing between the cross and heaven harms you; nothing here is shown. The sight at the cross goes on without you.',
               his: 'Look up to Heaven to His Father.' }
  };

  var WEATHER = {
    wealName: 'sureness', woeName: 'heaviness',
    came: 'The heaviness is on the room.', went: 'The heaviness has gone from the room.',
    after: { cross: 'after you looked at the cross', window: 'after you looked at the window', within: 'after you looked within' },
    stays: 'The heaviness stays on the room.', absent: 'The room is light.',
    blanket: 'The blanket is as it was.'
  };

  var VERDICT = {
    checked: 'She checked the same: "I sinned not wherefore I should be left to myself; also I deserved not to have this blessed feeling."',
    kept: 'The blanket never changed: "He keepeth us even alike secure in woe and in weal."',
    passover: 'And: "it is not God’s will that we follow the feelings of pain in sorrow and mourning for them, but that we suddenly pass over."',
    means: 'The dark that comes over you is not a message about you. Between the dark and the light there is no time. What you saw, you saw by staying; what you sought and did not see counted the same.',
    climb: 'The heaviness had no climb: the last was no worse than the first, and it led nowhere. That is the point, not a fault of the night. What climbed was the sight at the cross, from the garland to the drying, and only past the drying does the cheer change.',
    lived: 'You did not die. The pain went out of you all at once, as it had come, and you took it that the night was shown for those who live.',
    sentence: 'All shall be well, and all shall be well, and all manner of thing shall be well.',
    morningDark: 'The heaviness was on the room when the morning came. It is passing: "pain is passing and shall be brought to nought."'
  };

  // ---- the night ---------------------------------------------------------------------------------------------------
  function newNight(seed) {
    seed = (seed === undefined || seed === null) ? (Math.floor(Math.random() * 9000) + 1) : seed;
    return { seed: seed, weather: schedule(seed), beat: 0, crossIx: 0, withinIx: 0, causeAsked: false,
             dryingSeen: false, proffered: false, profferOpen: false, cheers: 0, record: [], done: false };
  }

  function hour(state) { return CONFIG.hours[Math.min(state.beat, CONFIG.beats - 1)]; }
  function weal(state) { return state.weather[state.beat]; }

  // what the page says before the look: the weather line (and what it followed)
  function pageLine(state) {
    var t = state.beat, w = state.weather[t];
    if (t === 0) return w ? 'The room is light: a sureness, with nothing to fear in it.' : WEATHER.came;
    var prev = state.weather[t - 1], last = state.record[t - 1];
    if (w === prev) return w ? WEATHER.absent : WEATHER.stays;
    if (last && last.cheer) return WEATHER.went + ' It went with no time between.';
    return (w ? WEATHER.went : WEATHER.came) + ' It ' + (w ? 'went ' : 'came ') + WEATHER.after[last.place] + '.';
  }

  function nextWithin(state) {
    var w = weal(state);
    if (!state.causeAsked) {
      if (!w) return WITHIN[2];
    }
    for (var i = state.withinIx; i < WITHIN.length; i++) {
      var q = WITHIN[i];
      if (q.id === 'cause') continue;
      return q;
    }
    if (!state.causeAsked) return w ? WITHIN[3] : WITHIN[2];
    return REST;
  }

  // the three places, with what looking there is right now (the preview; never the payoff)
  function options(state) {
    var w = weal(state), cross = state.crossIx < CROSS.length ? CROSS[state.crossIx] : SEEKING;
    var q = nextWithin(state);
    state.profferOpen = !!(CONFIG.profferAfterDrying && state.dryingSeen && !w && !state.proffered);
    return [
      { place: 'cross', label: 'the cross', line: cross.id === 'seeking' ? 'Keep looking at the cross; the sight is dim.' : ('See what is shown next at the cross' + (w ? '.' : '; in the heaviness it will be hard to look at.')) },
      { place: 'window', label: state.profferOpen ? 'look up' : 'the window', line: state.profferOpen ? 'A friendly voice says: look up to Heaven. Nothing there can harm you; nothing is shown.' : 'Look at the sky in the window. Nothing there can harm you; nothing is shown.' },
      { place: 'within', label: 'within', line: q.id === 'rest' ? 'Look within and rest; nothing more is asked tonight.' : ('Look within and ask ' + q.name + '.') }
    ];
  }

  function look(state, place) {
    if (state.done) throw new Error('the night is over');
    if (place !== 'cross' && place !== 'window' && place !== 'within') throw new Error('no such place: ' + place);
    options(state); // sets profferOpen for this beat
    var t = state.beat, w = state.weather[t], next = t + 1 < CONFIG.beats ? state.weather[t + 1] : null;
    var r = { beat: t, place: place, weal: w, hour: hour(state), caption: '', balloons: [], line: '', sight: null, cheer: false, proffer: false, nay: false, turned: next !== null && next !== w, keeping: CONFIG.keeping };
    if (place === 'cross') {
      var s = state.crossIx < CROSS.length ? CROSS[state.crossIx] : SEEKING;
      if (s.id !== 'seeking') state.crossIx++;
      if (s.id === 'drying') state.dryingSeen = true;
      r.sight = s.id; r.name = s.name; r.caption = s.caption; r.line = w ? s.sweet : s.dread;
      if (s.his) r.balloons.push({ who: 'his', text: s.his });
      if (s.hers) r.balloons.push({ who: 'hers', text: s.hers });
      if (state.profferOpen) { r.nay = true; r.caption = NAY.line + ' ' + r.caption; r.line = r.line + ' ' + NAY.after; r.balloons.unshift({ who: 'hers', text: NAY.hers }); state.proffered = true; }
      if (CONFIG.cheerNeedsCross && !w && next === true && (!CONFIG.cheerAfterDrying || state.dryingSeen)) {
        r.cheer = true; state.cheers++;
        var c = state.cheers === 1 ? CHEER : CHEER_AGAIN;
        r.cheerCaption = c.caption; r.balloons.push({ who: 'his', text: c.his }); if (c.hers) r.balloons.push({ who: 'hers', text: c.hers });
      }
    } else if (place === 'window') {
      r.sight = 'sky'; r.name = 'the window';
      if (state.profferOpen) { r.proffer = true; state.proffered = true; r.caption = WINDOW.proffer.line; r.balloons.push({ who: 'his', text: WINDOW.proffer.his }); }
      else r.caption = WINDOW.caption;
      r.line = WINDOW.skies[r.hour] + ' ' + (w ? WEATHER.absent : WEATHER.stays) + ' ' + WEATHER.blanket;
    } else {
      var q = nextWithin(state);
      if (q.id === 'cause') state.causeAsked = true;
      else if (q.id !== 'rest') state.withinIx = WITHIN.indexOf(q) + 1;
      r.sight = q.id; r.name = q.name; r.caption = q.caption; r.line = q.more;
      if (q.hers) r.balloons.push({ who: 'hers', text: q.hers });
      if (q.his) r.balloons.push({ who: 'his', text: q.his });
    }
    state.record.push(r);
    state.beat++;
    if (state.beat >= CONFIG.beats) state.done = true;
    return r;
  }

  // ---- the verdict, in words ---------------------------------------------------------------------------------------
  var NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
  function times(n) { return n === 0 ? 'not once' : n === 1 ? 'once' : n === 2 ? 'twice' : NUM[n] + ' times'; }
  function places(obj) { return Object.keys(obj).map(function (p) { return times(obj[p]) + ' ' + WEATHER.after[p].replace('you looked at ', '').replace('you looked within', 'looking within'); }); }
  function listNames(a) { if (!a.length) return 'nothing'; if (a.length === 1) return a[0]; return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  function verdict(state) {
    var rec = state.record, w = state.weather, n = rec.length;
    var darks = 0, onsets = [], lifts = [], stay = 0, win = 0, inn = 0, cheers = 0, causeInDark = false;
    for (var t = 0; t < n; t++) {
      if (!w[t]) { darks++; if (rec[t].place === 'cross') stay++; else if (rec[t].place === 'window') win++; else inn++; if (rec[t].sight === 'cause') causeInDark = true; }
      if (t > 0 && !w[t] && w[t - 1]) onsets.push(rec[t - 1].place);
      if (t > 0 && w[t] && !w[t - 1]) lifts.push(rec[t - 1].place);
      if (rec[t].cheer) cheers++;
    }
    var spells = onsets.length + (w[0] ? 0 : 1);
    var seen = [], unseen = [];
    for (var i = 0; i < CROSS.length; i++) (i < state.crossIx ? seen : unseen).push(CROSS[i].name);
    var asked = [];
    for (var j = 0; j < state.withinIx; j++) if (WITHIN[j].id !== 'cause') asked.push(WITHIN[j].name);
    if (state.causeAsked) asked.push('what brought the heaviness');
    var after = {}; onsets.forEach(function (p) { after[p] = (after[p] || 0) + 1; });
    var afterNames = Object.keys(after).map(function (p) { return WEATHER.after[p].replace('after you looked ', '') ; });
    var did = 'The heaviness lay on the room ' + times(spells) + (spells !== darks ? ' (' + times(darks).replace(' times', ' beats').replace(' time', ' beat') + ' in all)' : '') + '. In it you stayed at the cross ' + times(stay) + ', went to the window ' + times(win) + ', and looked within ' + times(inn) + '.'
      + (seen.length ? ' At the cross you saw ' + listNames(seen) + (unseen.length ? '; you did not reach ' + listNames(unseen) : '') + '.' : ' At the cross you saw nothing; the ten sights went unseen.')
      + (asked.length ? ' Within, you asked ' + listNames(asked) + '.' : ' Within, you asked nothing.')
      + (cheers ? ' The cheer changed for you ' + times(cheers) + ', with no time between.' : (state.dryingSeen ? ' You were not at the cross when the heaviness went after the drying, so you never saw the cheer change.' : ' You never reached the drying, past which the cheer changes.'));
    var onePlace = afterNames.length === 1 ? WEATHER.after[onsets[0]].replace('you looked at ', '').replace('you looked within', 'looking within') : '';
    var says = (onsets.length === 0 ? 'The heaviness was on the room from the start; nothing you did brought it. '
      : onsets.length === 1 ? 'The heaviness came once, ' + onePlace + '; it would have come after anything else. '
      : afterNames.length === 1 ? 'The heaviness came ' + times(onsets.length) + ', each time ' + onePlace + '; after one thing, as it would have come after any other. '
      : 'The heaviness came ' + times(onsets.length) + ': ' + listNames(places(after)) + '; after everything, and so after nothing you did. ')
      + VERDICT.checked + ' ' + VERDICT.kept + ' ' + VERDICT.passover;
    return { did: did, says: says, means: VERDICT.means + (causeInDark ? '' : ' You never looked within for what brought it; Julian did, and found nothing.') + ' ' + VERDICT.climb, lived: VERDICT.lived, sentence: VERDICT.sentence,
             morning: w[n - 1] ? '' : VERDICT.morningDark, counts: { darks: darks, spells: spells, stay: stay, window: win, within: inn, cheers: cheers, onsets: onsets, lifts: lifts, seen: seen.length, asked: asked.length } };
  }

  var Julian = { CONFIG: CONFIG, CROSS: CROSS, WITHIN: WITHIN, WINDOW: WINDOW, WEATHER: WEATHER, VERDICT: VERDICT, SEEKING: SEEKING, CHEER: CHEER,
                 schedule: schedule, newNight: newNight, options: options, look: look, verdict: verdict, pageLine: pageLine, hour: hour, weal: weal, mulberry32: mulberry32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = Julian; else root.Julian = Julian;
})(typeof window !== 'undefined' ? window : this);
