# Paper to Game — building it

Read this after the design memo's pick is written (SKILL.md, section 8), not before. This document governs the build, the calibration, the claim boundaries and the commit. It is strict because the author who receives the game must be able to trust it. None of it is a reason to change the pick.

---

## 1. Mechanism level and claim boundaries

The game is true to the paper's story, and the About screen says, in plain words, what the game **demonstrates**, what it **assumes**, and what the paper itself **establishes**. The three are not the same, and conflating them is the most serious failure this skill can produce: the sentence the player leaves with must be one the authors would sign.

Every mechanism is one of three kinds, declared in the memo and on the About screen:

- **Ported.** The game runs the paper's own model or algorithm. It demonstrates the model's behaviour; it assumes the paper's functional forms and whatever parameters were chosen for play; the paper establishes the theorems or simulation results, not that the world is like the model.
- **Reconstructed.** The game runs a constructed data-generating process that reproduces the paper's reported patterns — distributions, correlations, effect sizes. It demonstrates those patterns; it assumes everything the construction had to invent (the shape of the joint distribution, the individual-level process behind an average); the paper establishes the reported estimates and nothing finer.
- **Toy.** The game runs a model built to illustrate the paper's argument. It demonstrates that the argument *can* work as described; it assumes the toy; the paper establishes the argument's claims only to the extent it does, which the memo states.

Two traps, named because reconstructed mechanisms fall into them easily:

- **Correlation is not causation.** A paper that reports a correlation does not license a game in which the player moves one variable and the other responds. If the player must have a lever, the mechanism is a toy and says so, or the lever is a selection the player makes (an experimenter choosing what to measure), not an intervention.
- **An average effect is not an individual response.** A treatment effect of 0.3 does not mean each person responds by 0.3. A game that shows individuals responding draws them from a distribution the paper constrains, and the About screen says that individual responses are constructed.

The kind bounds the writing inside the game: a ported game may say "in this model"; a reconstructed game says "in this reconstruction, built from the paper's data" — "in the data" only where actual observations are displayed; a toy says "under this game's assumptions" — never "if the argument is right", since an argument can be right while a particular toy of it is wrong. Preserve the paper's reported uncertainty wherever it matters to the lesson. A simulated outcome supplies no independent evidence for the paper's claim, and the game never implies that it does.

**The discovery comes from the paper, not from the rules.** A game's objectives, payoffs, scoring rules and constraints are the designer's, and they can produce "findings" of their own: a strategy that wins because of how the game scores, a trade-off that exists only because of a budget the designer invented. For every discovery the game stages, the memo says whether it follows from the paper's mechanism or from a design choice, and the calibration plan includes a check that the central discovery survives plausible changes to the designer's choices. A discovery that depends on the rules is a game mechanic, not a finding, and the game does not present it as what the paper found.

**Robustness of the discovery.** Many data-generating processes reproduce the same reported estimates and imply different counterfactuals; a subgroup-optimal strategy generated from invented heterogeneity is not a finding of the paper. Whenever the game's central discovery depends on an assumption the paper does not identify, re-run the mechanism under one or two plausible alternative assumptions and see whether the discovery survives. If it does, say so in the memo. If it does not, either redesign so the discovery rests on what the paper identifies, or say so *in the gameplay itself*, at the moment of discovery — not only on the About screen.

---

## 2. Calibration

Calibration is for the author, not the player. The player sees the story (SKILL.md, "Numbers on screen"); the author sees the numbers, in one place, with their sources.

Every tunable scientific parameter and every gameplay parameter sits in one `CONFIG` block at the top of `mechanism.js`, each line tagged with its source or its design rationale (`// Table 4, median`, `// eq. 7`, `// read off Fig. 2b`, `// our choice: clock compression`); mathematical constants, array indices and layout dimensions need not.

Numbers read off a figure, and numbers taken from a scanned or OCR'd PDF rather than typeset text, are tagged as such in the config block, and the author-note says so; for a paper older than about 1990, look for a transcription before trusting a scan, because OCR misreads digits and the calibration check would then test the mechanism against the wrong numbers.

The calibration plan says what the headless check will verify: against the paper's cited equations, known solutions or reported estimates, with explicit tolerances. Tests of our own construction alone establish nothing. Exercise several random seeds and the boundary actions where they matter. If the check fails, fix the mechanism or revise the memo; never build on a mechanism that misstates the paper at its declared kind.

Rounded, qualitative numbers on screen are not a calibration failure. The mechanism carries 26.7; the screen says "about the same as an academic abstract". The config block is where the author finds the 26.7.

---

## 3. Before the build: play it in numbers

Where the game has a score, run the obvious ways of playing it against the mechanism before any screen exists: the maximiser, the spreader, the player who follows the physics and ignores the economics, the player who does the reverse, the optimum. A few lines of code. Look at the spread: if every heuristic lands in the same place, the decisions do not matter and the design is not ready; if one simple rule wins everywhere, that rule is the sentence the player should leave with, and the game should let them find it. Record the table in the memo; tune the parameters from it, not from taste.

Where the game draws its rounds from a seed: the seed is visible and replayable; constraints on the draw only where an early failure would be unfair or a lesson could fail to appear, and no more (a floor, not a ramp); and the calibration check tests the draw's shape over hundreds of seeds, separately from the mechanism's patterns, which it tests on random parameters.

## 4. The build

In this order; do not skip to the skin.

1. **Mechanism, headless, and the only copy.** Plain functions, no DOM, in one file, `mechanism.js`, executable unchanged in Node and in the browser. All rules that affect outcomes live in this file — the model or data-generating process, scoring, aggregation, and every random draw; the interface only passes the player's actions in and displays what comes back. Run the calibration plan against this file in Node; record the result.

   This file is the single source of truth. The HTML is *generated* from it by a build script that inlines the mechanism verbatim; the game's own code never re-implements, copies by hand, or adjusts any part of the mechanism. The build script verifies, byte for byte, that the mechanism embedded in the published HTML is identical to the file the calibration check ran against, and fails the build otherwise. A change to the mechanism is made in the file, re-checked, and rebuilt — never patched into the HTML.

2. **Loop on placeholder graphics.** The play loop with boxes and numbers. Play it headlessly with a script that prints, after each action, what changed and where the player now stands. Read the printout as the stranger: did something visible change, did it say whether the action worked, was there a reason to think before it? Fix the loop before any skin exists.

3. **Skin.** Apply the look declared in the memo — the register, the palette, the type, the buttons, the one visual rule — and nothing from any other register. Do not fall back to a default look because the declared one is harder: the same yellow, the same display font, or the same chunky-outline button as the last game means the skin is not done. Numbers are drawn in the register too (a prompter, a scoreboard, a stamp, a jar), not typed into a card. Screenshot every screen at phone width (≈380 px) and look at each with the question "what would a stranger see here?" Simplify pictures that need their captions; make small things fewer and bigger.

4. **Text.** No decimals anywhere on screen; rough sizes in words (about half, a few points, hardly any), rounded numbers only where the player needs one to act or the magnitude is the discovery; the verdict in words, not a tally. Aim on the start screen, its own line, and before it the two or three physical acts the player's hands will do, in the paper's own setting, so the player arrives at the first screen knowing what kind of thing will be asked of them. On every decision screen the three things of SKILL.md section 3: what this is and the rule of the world, what the player can do, what to expect. Every word on a button and every name for a thing or a verdict defined where it first appears. The result of a move stated by the game before any character comments. How to play, written last from the finished screens. Per-round verdict where rounds exist; the final verdict first on the end screen, large, in words, before anything else. About screen with the memo lightly edited, the mechanism kind, and the three claim-boundary lines. Attribution: title, authors, journal, year, DOI, and "Game built from this paper; the paper is the authority where the two disagree."

5. **Self-review from screenshots.** Questions the builder answers from the screenshots alone, with the How to play page closed. Can the aim be stated in one sentence after reading only the start screen? Can the discovery be stated after reading only the top of the end screen? For every play screen: can a stranger who has never opened How to play say what to do here, and, on the screen after a move, what just happened and what it means? A screen that fails this is not finished, and the fix is on that screen, not on the help page. And: does this look like any game in the README table? If it does, the skin is not finished. This is the builder's review, not stranger testing; real stranger testing is the user's to do, and the author-note says so.

6. **Full session in a browser.** Drive the final HTML through a real headless browser at phone width: a complete session with a plausible strategy, the help page opened and returned from mid-play, a retry, screenshots along the way; no errors, no horizontal scroll at 380 px, the discovery reachable. Screenshots alone do not establish that controls work. Session length is reported as an estimate until a person has measured it.

Hard constraints throughout: one self-contained HTML file; no external dependencies, no CDN, nothing fetched (an embedded font, inlined as data, is allowed); touch targets, no hover-only interaction; the player never reads a paragraph before acting; something visible happens on every action.

---

## 5. Feedback devices that work on a phone

Pick one or two; do not stack; and do not pick the one the last three games used (SKILL.md, section 5).

- **The fill** — a panel, jar, bar or grid of large cells fills as the choice takes effect. Shares, budgets, allocations.
- **The drop** — each decision drops a marker onto a ruler or histogram, coloured by what the player said; a pattern accumulates. Sorting, judgement, estimation.
- **The reveal** — the screen the player acted on is redrawn with the hidden layer on. Inference; the natural home of discovery.
- **The before/after** — two states side by side or on a slider: what the player set, what the paper's answer gives.
- **The race** — two or three large figures or bars whose relative size follows the player's choice. Competition, selection, treated against control.
- **The counter** — one number counting up or down after each action, in the aim's units.
- **The trajectory** — one line drawn over the rounds, with the paper's line appearing at the end.
- **The prediction round** — after exploring, the player is asked to predict a new case; accuracy is the yardstick. The natural close of a discovery game.
- **The bet and the card** — the player commits to a prediction, then the card turns. An opening or a close, never the loop.
- **One of your own** — a device the paper's world suggests and this list does not have. Name it in the memo.

Anti-patterns: a running point total; a tally as a verdict; a grid of tiny sprites; a dashboard of moving numbers; a metaphor on a button; a word the help page defines and the play screen uses cold; a thing the screen's words talk about that is not in the picture; an instrument whose verdict arrives as a stamp and a paragraph instead of being watched; a measure that moves before it is named; a picture that is beautiful and answers no question; a slider the player moves "to see what happens" with nothing at stake; a Yes/No button pair where the paper's variable has more than two values.

---

## 6. Writing inside the game

Plain, concrete, numbers only where they help and rounded to what the lesson needs. Match the substance of the paper; never quote it. Field terms only where the player must use them to act, defined in the same sentence. Greek letters stay in the paper. Explanation after discovery. Claims bounded by the mechanism kind (section 1). The register of the writing matches the look: a comic strip does not talk like a journal.

The title carries the author's name and a thing from the game, not the paper's subject: *Einstein's Flower Merchant*, *Watson's Cardboard*, *Cantor's Bargain*. Every instruction is written so that an eight-year-old could follow it: short sentences; the things on screen named by what they look like (the teal line, not the diagonal); one verb for one action; and the result of a round said plainly by the game itself before any character comments on it. Adults need the handholding too.

---

## 7. Deliverables and repository

- `<slug>/<name>.html` — the game.
- `<slug>/memo.md` — with the mechanism kind, claim boundaries, calibration plan, calibration result and build log appended.
- `<slug>/author-note.md` — three lines: what to look at first; where the config block is; what we were least sure about. Plus one line saying the game has had the builder's review only.

Two kinds of game, two finishes, decided by the first of the two questions (SKILL.md, Before reading). A game built as a gift for a colleague carries, in the same footer position on the start and end screens, the beta line instead of a signature: *A beta, built from the paper. Builder's review only; the author finishes it.* No counter. A game Steffen authors with Claude and revises in further rounds (the great-paper games: *Einstein's Flower Merchant*, *Watson's Cardboard*, *Cantor's Bargain*) drops that line and instead carries his signature and his counter: `<footer class="sig"><a href="https://steffenhuck.github.io/">steffen huck</a></footer>` at the bottom of the start screen and the end screen, lowercase italic, muted, in the game's text face; and `<script data-goatcounter="https://steffenhuck.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>` in the head after the title.
- `<slug>/mechanism.js` — the single source of truth — with the build script that generates the HTML from it, the calibration check (`calibration.js`), its result (`calibration-result.txt`), and the screenshots. (Folders built before this document use the names `fidelity.js` and `fidelity-result.txt`; leave them.)
- No PDF. The paper itself never goes into the repository: it stays in `inbox/`, which git ignores, and is deleted from there when the build is done. The memo and the About screen carry the citation, the DOI, and a link to where the paper can be read.
- A row in the README's games table with the play link `https://steffenhuck.github.io/paper-to-game/<slug>/<name>.html` and the memo link.
- If a folder for the same paper already exists, this is a rebuild: the previous game and memo move into `<slug>/previous/` and the new build replaces the folder's contents and the README row; no second folder for the same paper.

Commit and publish. The run is not finished until the game is on `main`, and the request for a game is the request to publish it: no further permission is needed for any step here. Push to `main` directly if the environment permits. If it does not, push the branch and open the pull request yourself, in the same run, without asking — the repository merges pull requests from `claude/…` branches automatically, and a branch without a pull request never merges. Then wait for the merge and check the live page before reporting its link as playable; where that is not possible, label the URL as intended and not yet confirmed live. If access or deployment fails, deliver the files in the reply, record the blocker, and mark publication incomplete. The reply ends with the play link, so labelled, and the folder link.

---

## 8. Failure modes

- A demonstration shipped as a game: actions without consequences the player can learn.
- A guessing game shipped because the other positions were never written out.
- The payoff previewed on the screen where the player commits; a control carried over from the last round.
- A game with a score built without first running the obvious heuristics against the mechanism.
- A game that looks like the last one.
- A central discovery resting on an invented assumption, unchecked against alternatives; or following from the designer's scoring, objective or constraint, presented as the paper's finding.
- A mechanism in the HTML that differs from the mechanism the calibration check ran against.
- A correlation played as a cause; an average effect played as an individual response; a mechanism kind undeclared.
- Decimals on screen; a tally as the verdict; a yardstick in different units from the aim.
- A short game padded to a target length; a reversal forced onto a paper that offers a different kind of discovery; an unfair failure engineered to manufacture a twist.
- A concept that could not survive a written walkthrough, built anyway; a core narrative that cannot be told in a paragraph anybody could follow.
- Pictures that pass the statistics and fail the eye; a term on a button never defined; a measure moved before it was named; explaining why before the discovery, or explaining what only on the help page.
- A play screen that needs How to play to be understood; a control whose effect the player first sees after committing; a result delivered as a stamp and a character's line with no plain statement from the game of what happened.
- Replayability claimed for a new random seed; builder's screenshot review reported as stranger testing.
- A parameter outside the config block, or inside it without its source or rationale; a scoring rule or random draw living in the interface rather than the mechanism.
- Work finished and not pushed, or a link reported as live without being checked.
