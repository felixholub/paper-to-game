// Julian's Window — the page. Passes the player's looks into the mechanism and draws what comes back; no rules live here.
(function () {
  'use strict';
  var J = window.Julian, state = null, selected = null, lastScreen = 'cover';
  function $(id) { return document.getElementById(id); }
  function show(id) { Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.toggle('on', s.id === id); }); window.scrollTo(0, 0); }
  function cur() { var s = document.querySelector('.screen.on'); return s ? s.id : 'cover'; }
  Array.prototype.forEach.call(document.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function () { var c = cur(); if (c !== 'help' && c !== 'about') lastScreen = c; show(b.getAttribute('data-go')); }); });
  $('helpBack').addEventListener('click', function () { show(lastScreen); });
  $('aboutBack').addEventListener('click', function () { show(lastScreen); });

  document.body.insertAdjacentHTML('afterbegin', Art.defsSvg()); // the tone patterns, once, in a drawing that is never hidden
  $('coverArt').innerHTML = Art.cover();
  var INTRO = ['Three days and three nights of sickness, in a cell with one window.', 'On the fourth night, the rites; you do not expect to see the day.', 'Your body is dead from the middle down; then the upper part begins to go, and the room goes dark around you.', 'The priest sets a cross before your face: "look thereupon and comfort thee therewith." It keeps a light of its own.'];
  $('introPanels').innerHTML = INTRO.map(function (c, i) { return '<div class="p">' + Art.intro(i) + '<div class="c">' + c + '</div></div>'; }).join('');

  function seedFromUrl() { var m = /[?&]night=(\d+)/.exec(location.search); return m ? parseInt(m[1], 10) : undefined; }
  function newNight(seed) { state = J.newNight(seed); renderBeat(); }
  $('startBtn').addEventListener('click', function () { show('intro'); });
  $('introBtn').addEventListener('click', function () { newNight(seedFromUrl()); show('play'); });
  $('againBtn').addEventListener('click', function () { newNight(); show('play'); });

  function drawRoom(look) {
    $('pagewrap').innerHTML = Art.room({ weal: J.weal(state), hour: J.hour(state), look: look || 'none', seed: state.seed + state.beat }) + '<div class="beat" id="beatLbl">' + (state.beat + 1) + ' of ' + J.CONFIG.beats + '</div><div class="hour" id="hourLbl">' + J.hour(state) + '</div>';
  }
  function drawStrip() {
    var html = '';
    for (var i = 0; i < J.CONFIG.beats; i++) { var r = state.record[i]; html += '<div class="fr' + (r ? '' : ' empty') + '">' + (r ? Art.frame(r) : '') + '</div>'; }
    $('strip').innerHTML = html;
  }
  function renderBeat() {
    selected = null;
    drawRoom('none');
    $('weatherLine').textContent = J.pageLine(state);
    var opts = J.options(state);
    $('choices').innerHTML = opts.map(function (o) { return '<button class="choice" data-place="' + o.place + '" aria-pressed="false"><span class="ico">' + Art.icon(o.place) + '</span><span><b>' + o.label + '</b>' + o.line + '</span></button>'; }).join('');
    $('lookBtn').disabled = true;
    $('chooser').style.display = '';
    $('result').style.display = 'none';
    drawStrip();
  }
  function select(place) {
    selected = place;
    drawRoom(place);
    Array.prototype.forEach.call(document.querySelectorAll('.choice'), function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-place') === place ? 'true' : 'false'); });
    $('lookBtn').disabled = false;
  }
  $('pagewrap').addEventListener('click', function (e) { var t = e.target; var p = t && t.getAttribute && t.getAttribute('data-place'); if (p && $('chooser').style.display !== 'none') select(p); });
  $('choices').addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('.choice') : null; if (b) select(b.getAttribute('data-place')); });

  $('lookBtn').addEventListener('click', function () {
    if (!selected) return;
    var r = J.look(state, selected);
    $('chooser').style.display = 'none';
    $('result').style.display = '';
    $('sightArt').innerHTML = Art.sight(r.sight, { weal: r.weal, hour: r.hour }) + (r.cheer ? '<div class="cheerin">' + Art.sight('cheer', {}) + '</div>' : ''); // the cheer overtakes the sight, with no time between
    $('resCaption').textContent = r.caption;
    $('balloons').innerHTML = r.balloons.map(function (b) { return '<div class="balloon ' + b.who + '">' + b.text + '</div>'; }).join('');
    $('resLine').textContent = r.line + (r.cheerCaption ? ' ' + r.cheerCaption : '');
    if (r.cheer) {
      // with no time between: the room is drawn in sureness now, although the beat was heaviness
      $('pagewrap').innerHTML = Art.room({ weal: true, hour: r.hour, look: 'cross', seed: state.seed + r.beat }) + '<div class="beat">' + (r.beat + 1) + ' of ' + J.CONFIG.beats + '</div><div class="hour">' + r.hour + '</div>';
      $('pagewrap').classList.remove('cheerflash'); void $('pagewrap').offsetWidth; $('pagewrap').classList.add('cheerflash');
      $('weatherLine').textContent = J.WEATHER.went + ' It went with no time between.';
    }
    $('nextBtn').textContent = state.done ? 'Morning' : 'Turn the page';
    drawStrip();
    $('result').scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  $('nextBtn').addEventListener('click', function () { if (state.done) renderEnd(); else renderBeat(); window.scrollTo(0, 0); });

  function renderEnd() {
    var v = J.verdict(state);
    $('nightNo').textContent = 'Night ' + state.seed + '. ' + (state.weather[J.CONFIG.beats - 1] ? 'The room is light.' : 'The heaviness is on the room.');
    $('recordGrid').innerHTML = state.record.map(function (r) { return '<div class="fr">' + Art.frame(r) + '</div>'; }).join('');
    $('vLived').textContent = v.lived; $('vDid').textContent = v.did; $('vSays').textContent = v.says; $('vMeans').textContent = v.means; $('vSentence').textContent = v.sentence;
    $('vMorning').style.display = v.morning ? '' : 'none'; $('vMorning').textContent = v.morning;
    show('end');
  }
  window.__julian = { get state() { return state; }, newNight: newNight, select: select };
})();
