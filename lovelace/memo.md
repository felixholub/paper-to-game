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


## Revision 3 (1 Nov 2026, evening): the machine counts with numbers, not with magic

His objection: a Go back card that can count is a cheat; counting needs different programming. Right, and it is the Notes' own point. The spring-back wheel is gone. A wheel is now a number in the Store, put on by hand before the run (Note B inscribes the data). The Go back card is Operation 7 joined to backing: it takes 1 off its wheel and the machine feels the result; not 0, back to the named card; 0, carry on. A wheel at 0 stays at 0 (and a wheel taken below 0 never returns to 0, so the machine runs on until the attendant stops it). A new Set card (a card of numbers, Memoir p. 15) puts a number on a wheel; a loop inside a loop needs one to restore the inner wheel each round. Lovelace's tables separate the subtraction from the decision; here they share a card, declared on the About screen.

Consequences: Set cards appear from the medium tier on; resetting costs a card, so nesting pays only when the inner loop is long, and the hard tier was replaced with orders where it does (solver check: no one-wheel chain at par). Library recomputed (`solve.js`, about a second). The deal now carries Set cards through the colour shuffle (a bug the scripted playthrough caught).


## Revision 4 (1 Nov 2026, evening): one way to number a wheel; retries

His notes: (1) a retry on every loom; (2) setting a wheel by hand at the top *and* with Set cards was confusing. Now every wheel starts at 0 and only a Set card puts a number on it; the wheel panel is display only (it shows the machine counting during a run). A Go back card may jump to any card above it, a Set card included, so a loop inside a loop reads as: the outer Go back returns to the inner wheel's Set card.

Solver rewritten (`loom.js`): iterative deepening, execution-guided (the machine runs while the chain is written; card i is chosen when the machine first falls through to position i), and a Set card's number is fixed lazily at the first Go back that has to decide (0 now, or not yet). Cross-checked against a plain brute force on twelve orders: all agree. Library recomputed (about three seconds); every hard order still needs both wheels at par; m6 made one-wheel (one wheel reused does it at par).

New messages from the chain itself: a Go back with no Set card above it ("starts at 0, −1, −2 … never 0 again"), and a Set card inside the loop it counts ("every round it puts the number back"). Retries: after every bell, "Try this loom again" (keeps your chain) or, after Show me a way, "Now try it yourself" (empty chain); the end table has "try again" on every loom and returns to the results; the best go counts (your own over shown, fewer cards over more).


## Revision 5 (1 Nov 2026, evening): the card's name

He asked whether the counter goes down by itself, and whether Go back should point at a stitch or at the counter. It doesn't: the card does the counting. The card is now called **Go back and count down** (his wording, with the main movement first). Its text gives the order of the two acts, "First take 1 off wheel A. Not 0 yet? Back to card …", and a small −1 badge pops on the wheel's rim each time the card is read, on the loom and on the switch screen. Help now says: nothing else ever counts down, and a simple loop should go back to its first stitch, not to its own Set card.
