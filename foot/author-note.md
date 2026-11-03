# Foot's Bad Man — author note (the staircase build)

1. **Look first** at scene three, the brew, and its card (`screenshot-a-scene3-card.png`): the first place the player's verdict can flip against the step before, the difference question, and the house saying that this is the case Foot built to part the two rules. Then the end chart (`screenshot-a-end.png`): her line AABBBBA against the famous rule's AAABBBB.
2. **The config** is at the top of `mechanism.js`: the staircase order and the three readings of the paper the rules depend on; then `CASES` (features, numbers, deeds, page tags), `RULES`, `PAIRS` (the difference she names per pair), `WORDS` (every line). Rebuild with `python3 build.py`; check with `node calibration.js`; play it headless with `node session-test.js`.
3. **Least sure about:** the order of the staircase (ours), the house's reaction to each deed (ours), and the torture rung, where the paper gives no "most of us". The first build is under `previous/`.

Rebuilt 3 Nov 2026 after Steffen's plays of the first build; reviewed by the builder only (screenshots and the scripted session).
