# Generates lovelaces-cards.html from template.html, mechanism.js (used for the coda: Lovelace's Bernoulli chain) and the embedded fonts,
# then checks that the embedded mechanism is byte for byte the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
loom = open('loom.js', encoding='utf-8').read()
puz = open('puzzles.json', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>A machine that does exactly what its cards say. Six looms are dealt at random from a library, two easy, two harder, two hard, with three more beyond them for those who want them: you hang as few cards as you can to weave each order, with wheels that hold numbers, Set cards that put a number on a wheel, and Go back and count down cards that take one off and look, so that on the hard looms a loop sits inside a loop. Then a switch makes the same cards play a tune and do sums, and you ask the machine to make something up. It can't.</p>
<h3>What the paper does</h3>
<p>In 1842 L. F. Menabrea published a sketch of Charles Babbage's Analytical Engine, a calculating machine driven by punched cards. In 1843 Ada Lovelace translated it and added seven Notes, longer than the sketch itself. The Notes are the text this game is built from.</p>
<p>Note A says the Engine <i>weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves</i>, and that it works on operations, not on any one kind of thing: it could act on anything whose relations can be written in symbols, music included. Notes C and E explain <i>backing</i>: the cards can be sent back so that a few of them do duty again and again, a cycle. Note F shows three cards doing the work of three hundred and thirty. Note G gives a full chain of cards for the Numbers of Bernoulli, twenty-five cards that serve <i>however great n may be</i>, and warns that the Engine <i>has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform.</i></p>
<h3>What is the paper's, and what is ours</h3>
<p>The loom is Lovelace's own picture from Note A, made literal: the Engine did arithmetic, it never wove cloth. The counting is done as the Notes say an Engine counts: with a number in the Store and cards that operate on it. A wheel is such a number: every wheel starts at 0, and only a card puts a number on it. The Go back and count down card is her Operation 7 in Note G joined to her backing in Note C: a subtraction whose result the Engine feels; if it is not yet zero, the cards are backed to an earlier card, and if it is zero, the Engine goes on (Menabrea's counter, too, has a unit taken off each time until it marks zero). A Set card is a card of numbers (Memoir p. 15): nothing resets a wheel by itself, so a loop inside a loop, her cycle of cycles (Note E), needs the outer loop to go back through the inner wheel's Set card on every round. In her own tables the subtraction and the decision are separate steps; here they share one card. Counting cards is her yardstick too: Notes D, F and G all count how few cards will do. The puzzles, the fewest-card counts (found by trying every possible chain) and the switch's tune and sums are ours.</p>
<p>The coda is hers. It runs Lovelace's own table from Note G, operation by operation, on a working model of the Engine's card language, and prints the first four Numbers of Bernoulli: 1/6, −1/30, 1/42, −1/30, with nine, fourteen and twenty-five cards. Two small repairs: one division is done the way round her text requires (the printed table has it reversed), and a sign is flipped so the Numbers print with the sign her formula gives. Her cycle (operations 13 to 23, in brown) is simply repeated for the fourth Number.</p>
<p>The Engine was never built. Nothing here is evidence about the machine; it is the Notes' ideas, running.</p>
<h3>The paper</h3>
<p>L. F. Menabrea, <i>Sketch of the Analytical Engine invented by Charles Babbage</i>, translated, with Notes upon the Memoir by the Translator, Ada Augusta, Countess of Lovelace. <i>Scientific Memoirs</i> 3 (1843): 666–731. Read it online at <a href="https://www.fourmilab.ch/babbage/sketch.html">fourmilab.ch/babbage/sketch.html</a>.</p>
<p class="small">Fonts: Abril Fatface and Old Standard TT (SIL Open Font License).</p>
"""
t = open('template.html', encoding='utf-8').read()
keys = ['/*__LOOM__*/', '/*__PUZZLES__*/', '/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_ABRIL__*/', '/*__FONT_OLD__*/', '/*__FONT_OLD_I__*/', '/*__FONT_OLD_B__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_ABRIL__*/', font('AbrilFatface-400.woff2')).replace('/*__FONT_OLD__*/', font('OldStandardTT-400.woff2'))
        .replace('/*__FONT_OLD_I__*/', font('OldStandardTT-400-italic.woff2')).replace('/*__FONT_OLD_B__*/', font('OldStandardTT-700.woff2'))
        .replace('/*__ABOUT__*/', about).replace('/*__MECHANISM__*/', mech).replace('/*__LOOM__*/', loom).replace('/*__PUZZLES__*/', puz))
name = 'lovelaces-cards.html'
open(name, 'w', encoding='utf-8').write(out)
if mech not in open(name, encoding='utf-8').read():
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(out)} bytes')
