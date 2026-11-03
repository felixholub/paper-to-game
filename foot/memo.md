# Foot's Bad Man — design memo (the staircase build, 3 November 2026)

This is the second build. The first (28 Oct–2 Nov 2026, three revisions) is under `previous/` with its own memo; its §1–3 (the paper, what it hands over, the discovery) still hold and are not repeated here. What follows is the rethink and the new game.

## 0. Given

Mine (Steffen's signature and counter). The rethink came out of three plays and a long discussion in chat, 2–3 Nov.

## 1. Why the first build failed

Steffen, after playing it: too repetitive; the scenarios all the same; still no real choice; the audience fickle. All one problem. Six schemes times three rule-followers was eighteen beats of the same shape (one against five, either/or, a film, a box). The player's only lever was which card, and the good person's choice and the house's verdict were both computed, so nothing hung on the reading of the rule. The "chair" added in revision 1 was a poll, not a choice. The split house of revision 2 looked fickle because the player could not see what moved it.

Zooming out (his): almost everyone who might play knows the trolley problem; almost nobody has read Foot. So the game must deliver what is new in Foot for a trolley-literate player. That is two things. (1) In the paper that invented the tram, the tram is the *easy* case, and intention — the lesson the folk version draws from it — is the answer Foot takes apart. (2) Her own answer: it is not what you mean to do, it is whether you would be *harming* someone or only *not helping* him; not harming is the stricter duty; so three kinds of conflict and three rules. And the reading of each case into those kinds is where it is not obvious: the mob's killing counts as help not given, not harm done; the fumes are harm you do; letting the beggar die on purpose is harm; the stuck man is no conflict at all.

## 2. The game

**The player is themselves.** Not the bad man, not Mrs Foot. The bad man puts them where they can save a few people from him by doing something to one other person, seven times; they decide each; after each the house reads the case as Foot reads it and compares. The player's own verdicts are the data, which is what the paper is made of.

**Escalation in the deed, not the numbers** (his requirement). The staircase: turn a wheel (the tram), keep a bottle (the scarce drug), brew a cure (the gas), shut a door (the beggar), pull a trigger (the judge as a private bargain), take up the irons (the tyrant's torture), light the fuse (the cave). The bad man climbs it in his own voice. The point is that Foot's line does not climb with it: she allows the first two, forbids four, and allows the last and worst. The famous rule allows three and then never comes back. Most of us, in her words, go with her — except that the paper gives no "most of us" on the torture.

**The numbers:** five against one for the tram, the medicine, the brew, the beggar and the bargain (the paper's five; the serum's "several"); two for the irons (the mad murderer's two); eight for the cave (the paper's party is uncounted). Within every pair where she names a difference the numbers are the same, so the numbers can never be the difference. The cave is the one exception (eight behind the stuck man against the bargain's five), and its answer to "the numbers" points at the epilogue's one-against-one case.

**The pairs are the argument.** Order of play is the staircase; the argument is the paper's pairs, kept as the house's first remark on each step: the medicine against the tram; the brew against the medicine (her own question: why is the gas different from the scarce drug?); the beggar against the medicine; the bargain against the tram (her driver and judge); the irons against the bargain; the cave against the bargain. When the player decided a pair differently, the house asks: what's the difference? A shelf of six — aiming at his death; harming him, not just failing to help; the others in danger from the bad man, not from me; he is lost either way; the numbers; no real difference — and the house says whether the one named is the one she names. This fires two or three times in a typical game, never when there is nothing to explain.

**The feedback card** (his specification: detailed, after every case): what you did; the step before, and the difference question if the verdicts flipped; how Foot reads it — the two sides in plain words, the kind of conflict as a chip (harm against harm / help against help / harm against help / no conflict), her decisive rule, what she does, agree or part; the famous rule's verdict and whether it agrees with hers (at the brew: "here the two rules part for the first time, and this is the case Foot built to part them"); most of us, in her words. Then one line from the bad man.

**The rules are on the start screen**, both of them, side by side, in plain lines. What is held back is the readings.

**The voices**, fixed after a discussion about who is commenting: the bad man speaks only for himself, before the choice (the trap, then the counting pitch: "Five is more than one. Turn the wheel.") and one line after. He does not follow counting; he wants the player to, because counting is the rule that puts people in his power. The house speaks the cards, in the first person plural, as the paper's "we"; Foot is quoted inside its voice. No bare pronouns across the card: four people are in the room (you, the bad man, Foot, the famous rule), so every "he" is named.

**The house does not vote** (his: they should watch in awe, and perhaps narrate). The stalls react to the deed, not the verdict — a stir at the wheel, nothing at the bottle, leaning in at the brew, hands to faces at the trigger, dead still at the irons, and at the cave the whole house flinches: the biggest reaction on the staircase, for the deed Foot allows.

**The end:** the staircase drawn with four rows under it — you, Foot's rule, the famous rule, most of us — a diamond where that line does it, a bar where it refuses, no mark where the paper says nothing. The shape of the player's own line in a sentence (climbed with him until X, refused from there; or everything, "like Bentham"; or her line exactly). Where the bad man got them: each time they did what he asked where she refuses.

**The epilogue** stays: the three abortion cases as she lists them, one against one, no bad man, each tied to its step on the staircase and to what the player did there. Then Anscombe.

## 3. Mechanism and claims

**Toy.** `CASES` with the four features her argument uses (aimed / harm or withhold / against harm or help / doomed), the paper's number, the deed; `RULES` for counting, the famous rule and Foot; `conflict()` for the kind; `PAIRS` with the difference she names; `WORDS` for every line, tagged. Every verdict the house reports is from a sentence in the paper, cited in the source.

- **Demonstrates:** that the two rules, as stated, answer the seven cases as the paper says; that they part on the brew and the cave only; that the pairs carry the differences she names; that Foot's line on the staircase is AABBBBA and the famous rule's AAABBBB.
- **Assumes:** a bad man behind every case; the staircase order (ours); the numbers where the paper gives none; the rules compressed; "most of us" read off her hedges, not counted.
- **Establishes (the paper):** an argument, not a finding.

**Calibration** (`calibration.js`, 40 checks, all exact): each rule against the paper's verdicts; where they part; the shape of each line; the pairs and their differences, with exactly one shelf answer hers per pair; robustness under the three readings (a lenient famous rule on the cave, a Foot without the beggar reading, a Foot without "no conflict"); all 128 ways of deciding seven steps times six named differences compose and end; a player who chooses as Foot is told so; "most of us" follows her verdict except on the irons; the epilogue composes.

**Session** (`session-test.js`, headless Chromium at 380 px): three players — as Foot; everything; refusing from the trigger on, blaming the numbers — through the staircase and the epilogue, How to play and About from inside the game. No errors, no horizontal scroll.

## 4. What was risked

The player who refuses everything from the trigger on and refuses the cave has, by their own line, the better story (the worse the deed, the firmer the no), and the game tells them her line is different; that is the discovery, not a grade. The torture rung has no "most of us" in the paper; the card says so. The house's awe at the cave is ours.

## 5. Build log

1. Mechanism written first; calibration 40/40 after the beggar went back to five (its pair with the medicine must hold the numbers).
2. Figures, scenes and films carried over from the first build (`stage.js`); a cell added for the irons (bars, a chair, a brazier); the cave's party made eight.
3. The card's shelf collapses to the picked answer; Foot's pair line comes after the verdict on the named difference, so the answer is never on screen before the question.
4. The end chart redrawn as the staircase above a four-row grid after the first version was unreadable at phone width.
5. The bad man's pitch leans on earlier choices where it can ("You said so yourself, at the wheel" only if they turned it).
