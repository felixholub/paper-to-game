// The play loop on placeholder graphics (build.md §4.2): prints, after each look, what the page shows, what changed and where the player stands.
// `node loop.js [seed] [policy]`; policies: flee (window in the dark), stay, julian, cross, within, random.
'use strict';
var J = require('./mechanism.js');
var seed = parseInt(process.argv[2] || '7', 10), pol = process.argv[3] || 'julian';
var P = {
  cross: function () { return 'cross'; }, window: function () { return 'window'; }, within: function () { return 'within'; },
  flee: function (st) { return J.weal(st) ? 'cross' : 'window'; }, stay: function (st) { return J.weal(st) ? 'window' : 'cross'; },
  julian: function (st) { return (!J.weal(st) && !st.causeAsked) ? 'within' : 'cross'; },
  random: function (st) { var r = J.mulberry32(st.seed * 7 + st.beat)(); return r < 1 / 3 ? 'cross' : r < 2 / 3 ? 'window' : 'within'; }
};
var st = J.newNight(seed);
console.log('NIGHT ' + seed + '  weather: ' + st.weather.map(function (w) { return w ? '*' : '#'; }).join(''));
console.log('AIM: See the night through. Each time, choose where to look — the cross, the window, or within — and find out what brings the heaviness.\n');
while (!st.done) {
  var t = st.beat;
  console.log('--- beat ' + (t + 1) + ' of ' + J.CONFIG.beats + ' · ' + J.hour(st) + ' · page: ' + (J.weal(st) ? '[stars, petals]' : '[heavy tone, scribbles at the edges]') + ' · blanket: rose, unchanged');
  console.log('    ' + J.pageLine(st));
  var opts = J.options(st);
  opts.forEach(function (o) { console.log('    [' + o.label + '] ' + o.line); });
  var place = P[pol](st);
  var r = J.look(st, place);
  console.log('  > look: ' + place);
  console.log('    PANEL: ' + r.sight + (r.cheer ? ' + CHEER' : '') + (r.nay ? ' + NAY' : '') + (r.proffer ? ' (looked up)' : ''));
  console.log('    ' + r.caption);
  r.balloons.forEach(function (b) { console.log('    ' + (b.who === 'his' ? '(( ' : '(  ') + b.text + (b.who === 'his' ? ' ))' : '  )')); });
  console.log('    ' + r.line + (r.cheerCaption ? ' ' + r.cheerCaption : ''));
  console.log('    strip: ' + st.record.map(function (x) { return (x.weal ? '*' : '#') + x.place[0]; }).join(' ') + '\n');
}
var v = J.verdict(st);
console.log('=== MORNING ===\n' + v.did + '\n\n' + v.says + '\n\n' + v.means + '\n\n' + v.sentence + (v.morning ? '\n\n' + v.morning : ''));
