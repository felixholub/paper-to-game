---
name: "paper-to-game"
description: "Turn a scientific paper (any field) into a playable single-file HTML browser game that gives a stranger a good few minutes and leaves them with something the paper discovered. Trigger when the user attaches or links a paper and asks for a game, a playable version, or invokes /paper-to-game. Writes a design memo, builds the game, checks it, commits it. Not for Steffen's own house-style teaching games (those are built by hand in their own threads)."
---

# Paper to Game

This skill is two documents. This one is for finding the game: who the player is, what they do, where the discovery lands, what the game looks like. The second, `build.md` (in the repository root, and beside this file where the skill is installed), is for building it: the mechanism file, the calibration check, the claim boundaries, the deliverables. Read `build.md` after the design memo's pick is written, not before. Its rules are right, but an engine that reads them while choosing a concept chooses the one they cannot object to, which is the dullest one.

---

## 0. What this is for

Someone sends a paper. They get back a game: one HTML file, playable on a phone, built on the paper's own mechanism, with every number tagged to its source so the author can tweak it. The game is a beta; the author finishes it. One run, one game, nobody editing in between.

The hard problem is not the code. It is discovering the playable experience latent in a particular paper: what a player could *do* that would let them find for themselves what the paper found. Different papers produce games in which players do different things, not the same structure in different skins.

The game is the paper's day off. The paper had to be austere; the game does not. It is loud, bold, playful, a counterpoint to the journal rather than an illustration of it. It has to be fun and it has to look like fun. What it inherits from the paper is the mechanism and the story, and nothing else.

The test of a good result: a smart stranger, handed the link on a phone, plays, for as long as the game needs and no longer, understands what they are doing the whole time, has to think before acting at least once, finds something out, and could afterwards say in one sentence what the paper discovered. That sentence is one the paper's authors would sign. That is what being true to the paper means here, and it is about the story, not the decimals.

---

## Before reading: two questions

Asked together, in the first reply, before the paper is opened, and skipped where the prompt already answers them (a prompt that says "mine" or "for Rauh", and "no ideas" or names a look, gets no questions). In a Code session, ask with the question widget so the answer is a tap; otherwise in plain text. One pause, at the start; then the run continues without stopping.

1. **Is this one of yours?** Yes: the game carries Steffen's signature and counter (build.md, section 7). No: it is a gift for someone else; the beta line is the footer, and the recipient's name, if given, goes in the author-note.
2. **Any specific ideas for this one?** Whatever comes back (a look, a player position, a device, a title, a thing to avoid) is recorded as the memo's first section, *Given*, and binds the design: it outranks the precedent rule (section 5) where the two conflict, and the memo says where it did. "No" leaves every choice to the engine.

---

## 1. The player

A smart person from outside the field, on a phone, who did not ask for homework. They tapped a link because someone they like sent it. They will give it thirty seconds before deciding whether to give it five minutes. They read nothing longer than two lines before they are allowed to do something. They do not know the field's words and will not look them up. They can follow a number if told what it measures. They like being surprised, they like being right, and they like being wrong when the game is kind about it.

What they want, in order: something to do right away, with an obvious thing to press and an obvious thing that happens; a reason to care that fits in a sentence; feedback they can see; a moment of discovery; a sense of getting better; a verdict in a few lines. Decoration, tutorials, dashboards, tables, the abstract and anything in Greek are what they came to avoid.

**The author test.** The colleague who sent the paper plays first, and they know the answer. A game that is a quiz about the result is dead for them on contact; a game in which they operate their own mechanism is alive. Every concept is checked with one question: would the author enjoy this?

---

## 2. What makes it a game rather than a demonstration

A slider with an animated response can be an excellent demonstration and not a game. A game requires **meaningful actions whose consequences the player can learn to anticipate or influence**. The sharpest test, asked before every design decision: *what is the player thinking about before they press?* Deliberation is the commonest answer; timing, perception, pattern recognition, experimentation and acquired skill also count, provided consequences follow from what the player does and the player can get better at it. A demonstration can open a game or deliver its reveal; somewhere in between there is a stretch where the player's actions matter and they know it.

Three formats; a paper usually suits one:

- **Challenge.** An objective under constraints: reach a target, hold a position, allocate a budget. The player plans. Models with a controllable parameter and a clear optimum or trade-off.
- **Discovery.** Probe a hidden system, form a conjecture, test it, finally predict. Empirical papers, mechanisms, identification. The score, if any, is prediction accuracy at the end.
- **Strategic.** Respond to agents or a system that reacts to the player: rivals, a population, a market. The player anticipates. Game theory, evolution, competition.

Fun has four sources; a concept has at least two, and knows which: **anticipation** (a choice is made and the player waits to see), **agency** (the outcome follows from the choice in a way the player can feel and learn), **discovery** (the moment something becomes clear), **mastery** (the second attempt goes better than the first, visibly, for a reason the player understands). Replayability is real when a second playthrough offers a different strategy, conjecture or regime; a new seed with the same lesson is not it.

---

## 3. Principles

### The discovery is the plot

Every game built here lets the player find something out that the paper found out. Papers offer discoveries of different kinds, and the kind shapes the game:

- **A counterintuitive result** — the field or the public believed X, the paper shows Y. The game lets the player act on X and meet Y. The strongest plot when available; not every paper has one, and the skill does not invent one.
- **A mechanism made intelligible** — the paper explains *how* something works. The game lets the player operate the mechanism and see the parts move.
- **Emergence** — simple rules at the micro level produce a pattern at the macro level. The game lets the player set the rules and watch the pattern form.
- **Identification** — the paper shows how a causal effect can be told apart from a confound. The game lets the player feel why the naive comparison misleads and what the design fixes.
- **A trade-off** — the paper maps what must be given up for what. The game puts the player on the frontier.

Name the kind in the memo. If the paper offers none of these, say so, and look harder at the results before settling for a reveal.

### The player is inside the paper

The player's action is a variable in the paper: a choice one of its agents makes, a parameter of its model, a setting of its experiment, the measurement its authors took, the thing its data describe. The player is in the mechanism, not outside it watching the result come in. The test: the player can say what they did without the word "guess." *I grew my dendrites. I set the balance. I ran the test. I wrote the press release.* If the only sentence available is "I guessed what the study found," the player is outside the paper.

Where the paper hands over two quantities it keeps apart (two clocks, two margins, a cost and a benefit measured in different units), look for the price that would trade one against the other. A payoff that merges them is often where the game is, and it is the designer's, declared as such; the quantities stay the paper's.

A bet on the paper's result can open a game or close it, where it supplies anticipation. It is not the spine. A game whose main loop is guessing the paper's numbers is built only when the memo shows that the agent, controller and experimenter concepts were each written out and each failed the walkthrough.

### Commitment before the outcome

The player commits before the outcome is shown. The strong form is a consequential action — a setting, a sorting, an allocation, a move — whose consequences the player then lives with. The screen where the player commits does not preview the payoff: the paper's instruments may be read before acting, the score may not, or the decision becomes reading. And a control that keeps the previous round's setting looks like advice; every round starts from the same place. Free exploration counts when it builds knowledge the player later uses. A bare prediction is the weak form, used sparingly. The player need not be wrong: an intuition that turns out right is rewarding, one that turns out wrong is instructive, and both work if the commitment was real. The sensible choice fails only where the paper says it fails. Where the paper proves that every attempt must fail (a diagonal argument, an impossibility result), the game may let every attempt fail, and then the failing is shown as the result, named as such at the moment it happens, not disguised as a puzzle with an answer the player has not found.

### True to the story; numbers under the hood

The mechanism is ported from the paper's model, reconstructed from its estimates, or built to illustrate its argument, and it is calibrated to the paper's numbers in the config block, where the author can see and tweak them (`build.md`). That calibration is for the author. The player sees the story: the kind of discovery, the direction of effects, their rough size, what the paper claims and does not.

The presentation may simplify without limit: fewer agents, bigger ones, a compressed clock, exaggerated parameters, a stylised payoff, one regime instead of twelve. When the only fully faithful game would be dull, pick the playable concept, keep the mechanism calibrated where it is used, and declare what was dropped. The author can put it back.

### Numbers on screen

Direction first, then rough size: about half, roughly double, a few points, almost all of it, hardly any. Comparisons before numbers, bars before digits, two things side by side before either is quantified. A number appears when the player needs it to act or when the magnitude itself is the discovery, rounded to what the lesson needs: "about the same as an academic abstract", not 26.7 against 25.1. The verdict says what the player did and what the paper says, in words; a tally ("5 of 8 right") is a score, not a verdict.

### Minimal controls, simple loop

The fewest controls that preserve the paper's central mechanism. One is the default. Two or more are right when their *interaction* is the finding — severity and probability of punishment, price and quality, effort and luck. A choice offered to the player has at least three live options or a continuous control, unless binary is the paper's own variable. The loop stays simple: act → mechanism → visible result → where you stand. Every format has an **aim** the player can repeat and a **verdict** at the end.

### The ending

A game ends. Where there are rounds, there is a last one, and no retry past it; the verdict is a screen the player reaches once. What the verdict says depends on the game: where the paper gives a quantity to score against, a number against the best possible and a fate in words ("you die a comfortable man"); where it does not, something qualitative, what the player found and what the paper says. A tally is never the verdict.

A score needs an objective, and an objective picks a side. Where the paper sets two values against each other and does not rank them (Benjamin's cult value against exhibition value), the game does not rank them either: no number, no best path, no "could have done". The verdict says what became of things on the path the player took, in the paper's own terms, and the player judges. The arithmetic stays underneath, unseen, so that the pictures and the lines agree with each other; nothing is shown as a quantity. Such a game is replayed to see the other fates, not to beat a number, and the aim is phrased as a decision ("decide who sees the face, and how"), not a maximum.

A game ends when its discovery has landed. A paper's second half, a corollary, an epilogue, a moral, is read on the verdict screen, not played, unless it holds a second mystery the player can act on with a real outcome at stake. A last choice with nothing at stake is a reading dressed as a decision, and the verdict is not the place for one.

### The aim is a sentence; the yardstick is in its units

Before any concept is chosen, write the aim in the words the player will read. It sits on its own line on the start screen, at the top of the play screen, and as the first line of How to play. Whatever tells the player how they are doing is measured in the aim's units, for the stretch of play the aim refers to: a player who has just done what was asked sees that they succeeded, now, not a running total whose maximum lies in rounds not yet played.

### Pictures explain; motion is the feedback; fewer, bigger things

Every picture answers a question the player has at that moment: what is this? did it work? which way? If a picture needs its caption, simplify the picture. The thing that moves *is* the feedback. On a phone, a few large things beat a crowd of small ones.

### Orientation before acting; explanation after the discovery

The player acts before reading a paragraph, but every screen carries the one or two sentences a stranger needs to act on it: what the things on screen are, what a move changes, and what the question is. Every word on a button is defined on that screen before the first press; a measure is named before the player sees it move; where two extremes exist, show them side by side before the first choice. Explanation — why the paper's answer is what it is — comes after the discovery.

The game explains what a control does and never whether the player is using it well. Orientation does not say the procedure and does not say the answer. A control may show itself once before the first press, and an instrument with parts may assemble in front of the player one tap at a time; from then on the screen shows the consequence of a move and withholds the judgement of it until the player has committed: no "match found", no button that waits for the right answer, no hint that arrives on a stall, no words restating what the picture shows. The paper's own answer appears after the player's (a ghost under their reading), never as a target before. The yardstick during play describes; only the verdict concludes. Help may spell out the procedure for anyone who wants it.

A **How to play** page explains the whole game in plain language, reachable from the start screen and from a small ? on every play screen; returning lands the player where they were. Button labels say what happens.

### Personification sits on the mechanism

A neuron, a molecule, a voxel, an institution, a text may be the agent the player plays — one of the best moves available — when its "choice" maps onto a real variable in the paper and its payoff onto a real quantity. Where the paper supplies no payoff, the memo and the About screen say the payoff is ours.

---

## 4. Reading the paper

Read all of it: text, tables, figure captions (captions often state the mechanism more plainly than the text), supplementary material if attached. The paper may be in any language; the game, the memo and everything on screen are in English, and a quoted term is translated. The paper is read from `inbox/` and never committed; note where it can be read online, for the memo. If code or data are attached, the mechanism is ported from the code and calibrated from the data. If only the PDF is available, say so; numbers read off a figure are marked as such.

Then answer, in writing:

**What does the paper hand over?** A **model** (equations, a simulation, a game-theoretic structure — ported); an **estimate** (data, coefficients, distributions, an experimental result — reconstructed into a data-generating process that reproduces the reported numbers); an **argument** (a verbal mechanism, a conceptual claim — formalised into an explicit toy model, with the places where the formalisation chose something the paper did not, listed). Often one primary and one secondary.

**What did it discover, and of which kind?** From the list in section 3.

**Who lives in the paper, and what do they do?** The agents, the experimenter, the subjects, the instrument, the thing measured. Each is a candidate player. For each: what they control, what they could be asked to anticipate.

**Where is the moment?** The point in play when the discovery lands: "the player does X, sees Y, and realises Z." If it cannot be written as a moment, the concept is not ready.

**Can the story be told to anyone?** Write the game's core narrative as one short paragraph that almost anybody could follow — an eight-year-old, if you tried hard: who wants what, what is in the way, what happens that nobody expected; or, for a paper whose discovery is a pattern, what is being looked at and what turns out to be true of it. No field words. This tests the narrative only; the game itself is for curious adults and may be as demanding as the paper requires, and the one who wants something may be a cell, a country, a molecule, or the player. If the paragraph can be written, every screen serves it.

---

## 5. Precedent

Before any concept is chosen, read the games table in the repository README and the "pick" and "look" sections of the three most recent memos. Write down, in the memo, for each of those three games: the player position, the format, the feedback device, and the chassis (register and its family, palette, type).

The new game shares none of these four with any of the three. Precedent is something to move away from. If the paper plainly wants a position one of the last three used, say so and make the other three dimensions differ instead; the look always differs.

---

## 6. Finding the game

### Player positions

- **Agent** — a role inside the model; the control is a choice. Human or not.
- **Controller** — sets conditions on a system and aims at a target.
- **Experimenter** — probes a hidden truth with noisy instruments and must infer or predict. Often the paper's own method replayed, with the paper's own instrument in the player's hands.
- **Subject** — the thing being studied: a participant, a perceiving brain, an organism under selection, a text being read.
- **Dilemma** — for conceptual or normative papers: the player walks through the situations the paper describes, chooses, and sees the point unfold.
- **Forecaster** — bets on what the system will do; the finding is the reveal. The last resort, used when the positions above were written out and failed, and even then as an opening or a close around something the player does.

### Three concepts, always

Generate three concepts at three different positions. At least one casts something non-obvious as the agent: the cell, the institution, the molecule, the press release. One of the three is the reckless one — the concept the builder half-expects to fail: a strange agent, a play screen with no words on it, real time, the paper's own instrument handed to the player, the mechanism run backwards. Its walkthrough is written whether or not it is picked, and if it loses, the memo says what was given up.

Each concept names: position, format, controls, what the player is thinking about before they act, what they see after, the moment of discovery, the sources of fun, and what a second playthrough offers.

### The first five minutes

For the pick and the runner-up: the stranger's experience in the present tense, minute by minute — what they see, what they are wondering, what they want to press, what they are weighing, what happens, where they grin, where they frown. This is the test that kills a concept on paper rather than after a build. "I press it to see what happens" is fine when the seeing builds understanding the player later uses; "and I don't know what I'm supposed to feel" means a demonstration where a game was needed. If the walkthrough cannot be written, there is no game there.

### The pick

Which concept gives the stranger the best five minutes, with real deliberation in them and the discovery landing inside them, and passes the author test. Originality is a criterion, not a tie-breaker: between two concepts that both pass, take the one that does what no game in the README table has done, and a risky concept that passes its walkthrough beats a safe one that passes its walkthrough. Calibration is a constraint, not a criterion: a ported model with a dull walkthrough loses to a toy that declares itself. Record the runner-up and what would make you switch.

Take your fancy! If the reckless concept is the one you want to build, build it; the memo can say why it was a risk. A defensible game nobody wanted is the worse failure.

If no concept survives the walkthrough, say so: explain why the paper resists play, and deliver a clearly labelled interactive illustration instead of a sequence of guesses called a game.

### The shape

One long round or several short; how many screens; presets or none; score or none. Presets are the paper's own regimes — baseline, comparative statics, the counterintuitive corner, subgroups, experimental conditions. Order them for the player, not as the paper orders them: the discovery arrives early. Five to eight minutes is the default target, not a minimum; some discoveries land best in ninety seconds and are left that short.

---

## 7. The look

The game does not look like the paper, nor like a journal, a website, a slide, a dashboard or a form. It looks like something a stranger would be happy to find on their phone, and that can be loud or austere: a pop-art comic is one register, and the Olive's green phosphor on black, as austere as a lab monitor, is another, and both are the paper's day off. Pick one register and commit to it; the whole surface — palette, type, buttons, motion, the way numbers are drawn — comes from that register and nowhere else. The register list, to choose from or to add to:

- **Instrument.** The paper's own apparatus and data, drawn live: a confocal stack glowing on black, a field of agents moving, a spectrogram, a heat map that breathes, a phase portrait, a star chart, a seismograph trace. Contemporary, technical, striking, animated. Not a page with pictures on it; a picture you can act on. When the paper's object has a visual form (cells, networks, fields, flows, maps, waves), consider this one first; it is never required.
- **Austere.** Green phosphor on black; a blueprint, white on navy; an engineer's drawing; a scientific plate from an old atlas; a Swiss grid poster; a museum label.
- **Retro.** A 1980s arcade cabinet; a four-green handheld console; a teletext page; VHS tracking lines; 1970s airport signage; a board-game box from the 1960s; a punched card.
- **Loud.** A pop-art comic; a circus poster; a fairground; a pinball table; a film poster from Bombay; a wrestling bill.
- **Drawn.** Manga; a woodcut; a children's picture book; chalk on a blackboard; a hand-drawn notebook; a tapestry; a newspaper cartoon; a tattoo flash sheet.
- **Techno.** A cockpit; a mixing desk; a TV studio at night; a stock ticker; a synthwave grid; a subway map.
- **Clean.** A Bauhaus poster; Japanese minimal; a broadsheet front page; a letterpress card; a seed packet.
- **Worldly.** A West African wax print; a Soviet constructivist poster; Mexican papel picado; a Victorian playbill; a medieval manuscript; Art Deco; Delft tiles.

Where the register comes from: first the paper's subject, if it has a picture in it (a neuron, a balance, an orchestra pit); if not, the setting of the data (a Kampala street, a Brussels press room, a 1990 concert hall, a kitchen table in 1997); if even that is thin, pick a register from the list that fits the kind of play and let the paper's world live inside it. When the paper's object can be drawn from the mechanism itself, drawing it is an option worth writing out: the drawing becomes the play screen, and the data are drawn, not illustrated. Comic means the register, not jokes and not a mascot; austere means the register, not the journal.

The memo declares the chassis before the build: the register and its family from the list; the palette (three to five colours, named); the type family (an embedded font is allowed, inlined as data so the file stays self-contained); the shape of the buttons; and the one visual rule that makes this game recognisably itself. All of these differ from the last three games in the table (section 5), and the register family differs from the last three as well: after a comic, not another comic; after a dark screen, a light one. A chunky outline with a hard offset shadow is one button style among many, not the house button.

What stays: every screen is looked at at phone width with the question "what would a stranger see here?"; pictures that need their captions are simplified; a few big things beat many small ones. A loud game that cannot be read on a phone has failed, and so has an austere one.

---

## 8. The design memo

Written in full and shown to the user before the build, as a record, not a question; the build follows immediately. Stop only if the user interrupts. Length scales with the paper's difficulty. Sections:

0. **Given** — the answers to the two questions: whose game it is, and any ideas the user gave, with where they overrode precedent. "Mine, no ideas" is a complete entry.
1. **Paper** — citation, DOI, what was available.
2. **What the paper hands over** — model / estimate / argument, primary and secondary.
3. **The discovery, and its kind.**
4. **The core narrative** — one paragraph that almost anybody could follow.
5. **Who lives in the paper** — the candidate players and what each controls.
6. **Precedent** — the last three games' position, format, device and chassis; what this game does differently on each.
7. **The aim and the verdict** — the aim as the sentence the player will read; the verdict as the lines the end screen leads with (what you did; what the paper says; what that means), in words.
8. **Three concepts** — each with position, format, controls, deliberation, discovery moment, sources of fun, replayability; the reckless one marked.
9. **The first five minutes** for the pick and the runner-up.
10. **The pick, and why**; runner-up and switch condition; the author test; what the reckless concept would have given if it was not picked.
11. **The shape** — rounds, screens, presets and their sources, order and reason, score or none.
12. **Controls, mechanism, feedback, moment** — named concretely for the pick.
13. **The look** — register and where it came from; palette, type, buttons, the one visual rule; what the player looks at on the play screen, how big, how many, what question each picture answers.
14. **What is cut.**
15. **Divergences** — clock, parameters, payoffs, presentation; each with its reason.

Then read `build.md` and continue. It adds the mechanism kind and claim boundaries, the calibration plan, and the build log to the memo, and governs everything from here to the commit.

---

## 9. Testing the skill itself

The skill is judged on a heterogeneous set: a theoretical model, a randomised experiment, a descriptive empirical study, a biological mechanism, a mathematical result, a conceptual argument. The question is whether players *do different things* across the six and whether the six *look like six different games*. If they converge on one position, one device or one chassis, the skill is prescribing a formula, and the fix is to loosen this document, not to add a rule to `build.md`.
