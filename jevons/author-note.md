# Jevons's Noon: author note

**Look first at** the ruler (both rows: how big the fire gets, how long the coal lasts), then the 1885 engine card: it is an announcement now, and the burn after it reports the year the works fitted the engine and the days fuel took. Then the ledger at the foot of the sheet, filling generation by generation, and the verdict's "Who got the coal". Then *The curve, continued*: the last screen has no words, by design (your Given).

**The config block** is at the top of `jevons/mechanism.js`. Every number is tagged with where it comes from: the frontispiece, the preface, ch. I, ch. VII, or "our choice". The production engine's anchors are `ALPHA` (0.7) and `FUEL_SHARE_1865` (a twentieth); the engines' terms are in `ENGINES` (`pays`, `cheapens`). The words the game says are in `jevons/words.js`, and the page is built by `python3 jevons/build.py`.

**Least sure about:** the production engine is ours twice over (its form, and its two anchors), and the far generations' income per head rests on a toy population that keeps multiplying for two centuries; `calibration.js` shows the directions hold when every one of our choices is moved both ways, but the ledger's figures for 2005 onward are the toy's. The noon of "as now" is about twenty times the fire of 1865, which is Jevons's own rate kept up for eighty years with the rebound of two engines: it is high, and the sheet grows to hold it. Also: the real series on the last screen is checked from 1900 on, but 1865–1899 is recalled from Mitchell, and Hull's 83,544 is from ch. II, which was not in the PDF.

The game has had the builder's review only (screenshots and a scripted browser session); no stranger has played it yet.
