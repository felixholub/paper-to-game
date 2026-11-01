# Noether's Press — note for the author

1. Revision 5 (1 Nov 2026) rebuilt the game as a deck: draw the fastest slide, then nine changes, each judged "it matters" or "it doesn't"; every change that doesn't matter puts a prize on the shelf; the slide's energy comes out empty, and the last card says why. No score: the shelf and one sentence. The press version is in `previous/`.
2. Look first at `screenshot-a-c1-answer.png` (a prize won and its flat line), `screenshot-a-c4-answer.png` (a trap: the magnet), `screenshot-a-c8-drawn.png` (the empty prize, the player's drawn path leaving the line flat) and `screenshot-a-end.png`.
3. Everything tunable is in the `CONFIG` block at the top of `mechanism.js`, the only copy of the mechanism: the six worlds' numbers, the finite changes shown, the thresholds. Edit, run `node calibration.js` (11 checks against the paper), then `python3 build.py`, which refuses to finish if the embedded mechanism differs from the file.
4. Least sure about: whether "it matters" reads the same to a stranger as "the formula cares"; and whether the last card's rule (the equations are not independent) needs more than one line.

Builder's review only: the screens were checked from screenshots and a scripted session at phone width, not by a stranger.
