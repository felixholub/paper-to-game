# Lovelace's Cards: rebuild memo (1 Nov 2026)

The first build (in `previous/`, with its full memo) had the player compose cards from an operation sign and three named columns (`a × 1 → R`) and write a loop (`BACK 2 WHILE n ≠ 0`). It was faithful to Note B's card language and unplayable for a stranger: four abstractions before anything happened on screen. This rebuild starts from Note A's own image instead (the Engine weaves algebraical patterns as the Jacquard loom weaves flowers and leaves) and keeps Note G as the spine.

**Eight-year-old test.** This machine can't think. It does exactly what its cards tell it, one card at a time, and nothing else. You hang the cards. Can you make it weave the pattern?

**Shape.**
1. *Doing as it is told.* Finished cards only (red stitch, blue stitch); tap to hang, tap to take off; the loom weaves exactly the chain. A wrong stitch is framed and named.
2. *The card that goes back* (Notes C, E, F; Menabrea's counter that clears to zero). Twenty-four stitches, four slots. The Go back card sends the machine to the top while a wheel clicks down. Three cards, twenty-four stitches.
3. *A new order* (Note G: "however great n may be"). Red, red, blue × 5; then a bet: the order changes to 9, will the cards still work? They do; nothing on the cards says 5 or 9, only the wheel. Optional run at 30.
4. *Same cards, other things* (Note A). A switch reads the same holes as threads, notes (G and C, played) or sums (+1, ×2, from 0).

**Ending** (Note G). Order: make up a new pattern. There is no card for it; the machine does nothing. Her line: it can do whatever we know how to order it to perform.

**Coda.** Her Note G table run on the ported interpreter (`mechanism.js`, unchanged, calibration 33/33), the 25 cards lighting in order, the loop cards 13–23 in brown, printing 1/6, −1/30, 1/42, −1/30 with 9, 14, 25, 25 cards.

**Ours, not hers.** The loom as literal cloth; the tune and the sums; the wheel as a visible counter; the bet. Declared on the About screen.

**Look.** Pasteboard, ink, plum and verdigris kept from the first build; thread red `#B8323C` and blue `#2C4F91` added; Abril Fatface and Old Standard TT. Signature footer and GoatCounter (his own game).


## Revision 2 (1 Nov 2026, evening): puzzles

Verdict on the loom version: lovely, and trivial. Every loom had one obvious answer. This revision keeps the loom and turns it into a puzzle game, using two moves from the Notes that the first loom version left out: Go back can jump to *any* card (Note C), and loops can sit inside loops (Note E's cycle of cycles, which is what her Bernoulli chain does).

**Machine** (`loom.js`, the only copy). Stitch cards in three colours; Go back cards, each tied to wheel A or B and pointing at a card above it. Reaching Go back clicks its wheel down one; if the wheel is still above 0 the machine jumps back, otherwise the wheel springs back to its number and the machine carries on. The block runs exactly as many times as the wheel says, and an inner loop resets for each round of the outer one.

**Library** (`solve.js` → `puzzles.json`). 22 orders in four tiers: easy0 (no wheel), easy1 (one wheel, back to the top), medium (lead-ins, tails, two loops in a row, a second wheel), hard (a loop inside a loop). Par, the fewest cards, is found by trying every chain up to eight cards with wheels 1–12; the solver checks that every hard order needs the nesting (its one-wheel par is higher). Slots are par + 1, except hard, where slots = par, so nesting is the only way in.

**Deal.** Each game draws 1 easy0, 1 easy1, 2 medium, 2 hard at random, and shuffles which colour is which. After three runs that don't ring the bell, "Show me a way" loads the solver's chain and runs it (the paper's answer after the player's). After a win above par: "Try it in fewer cards".

**Kept.** The switch (now reading the player's last, nested chain as threads, notes or sums; two modes needed to go on), the last order, the coda, which now says out loud that her chain is a loop inside a loop. End screen: a table of the six looms, the player's cards against the fewest.
