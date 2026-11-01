# Generates lovelaces-cards.html from template.html, mechanism.js (the single source of truth) and the embedded fonts,
# then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>An Engine that does exactly what its cards say and nothing else; you make out the cards for three of Lovelace's own examples, and the Engine then runs them on numbers you never saw. A chain that names columns rather than numbers holds for every n; a card that turns the prism back makes a handful of cards do the work of hundreds; and the Engine originates none of it.</p>
<h3>What the paper does</h3>
<p>In 1842 L. F. Menabrea published a sketch of Charles Babbage's Analytical Engine; in 1843 Ada Lovelace translated it and added seven Notes, longer than the sketch, which are the text this game is built from. Note A separates <i>operations</i> from the things operated on and says the Engine <i>weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves</i>; the Difference Engine before it did one fixed thing, six additions. Note B draws the Store: columns of figure-wheels, a sign above, a name beneath, and works ax<sup>n</sup>, a·n·x, a/n·x and a+n+x with a = 5, n = 7, x = 98. Note C explains <i>backing</i>: the prism over which the cards pass can revolve backwards so that a card or set of cards does duty again. Note D works two linear equations in eleven operations with three operation cards. Note E names the <i>cycle</i>, and the cycle of cycles. Note F shows three cards doing the work of three hundred and thirty. Note G computes the Numbers of Bernoulli with twenty-five operation cards, "and no more are needed, however great n may be"; and warns that the Engine "has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform."</p>
<h3>Mechanism: ported</h3>
<p><b>This game demonstrates</b> the card language of the Memoir and the Notes, run: a Store of columns; cards that put the mill into one of its four states and name the columns that supply it and receive from it; a card that turns the prism back while a column is not nothing, which is Lovelace's backing joined to her Operation 7's feel for n; a bell when the chain ends, and an early bell on a division by nothing (Memoir p. 12). The same interpreter runs Note B's examples with Note B's data, Menabrea's Table 1.3 and Note D's eleven operations against the solutions of their equations, Table 1.1's squares by differences, and the Countess's Bernoulli chain, which prints 1/6, −1/30, 1/42, −1/30 with nine, fourteen and twenty-five operation cards (the calibration check, in the repository).</p>
<p><b>It assumes</b> our simplifications: one card carries both the operation and its columns, where Lovelace keeps Operation-cards and Variable-cards apart; one contingent card, backward only; constants inscribed on columns at the start instead of cards of numbers; a rack of ten cards and an attendant who stops an Engine after four hundred steps; our data for tasks two and three (a = 3, x = 2, n = 5; the squares to six) so that six figure-wheels suffice; the hidden tests. The card count as the yardstick is the paper's own (Notes D, F, G), the three tasks and the tests are ours. In the coda, Operation 4 divides as the result column requires rather than as the table's symbol column misprints, Operation 24 subtracts so that the printed Number carries the sign formula (8) gives, and the cycle 13–23 is written out for the fourth Number because these cards cannot step a column forward on each pass, as Lovelace's Operation 21 does.</p>
<p><b>The paper establishes</b> the design of a general engine and what such an engine could do if built: that operations and quantities are separable, that cards can be cycled, that a finite chain computes an unbounded table, that the Numbers of Bernoulli follow from twenty-five cards; and its own limits, that the Engine follows analysis and does not anticipate it. The Engine was never built. Nothing here is evidence about the machine; it is the Notes' language, running.</p>
<h3>What is cut</h3>
<p>Operation-cards distinct from Variable-cards and the economy of Note D; Retaining and Zero Supply-cards; cards of numbers; the sign discs; forty-digit columns; the symbolic results of Notes A and B; the trigonometric series of Note E; Note F's elimination; the Bernoulli numbers as a task rather than a coda; the stepping column of Operation 21.</p>
<h3>The paper</h3>
<p>L. F. Menabrea, <i>Sketch of the Analytical Engine invented by Charles Babbage</i> (Bibliothèque Universelle de Genève, October 1842, No. 82), translated, with Notes upon the Memoir by the Translator, Ada Augusta, Countess of Lovelace. <i>Scientific Memoirs</i> 3 (1843): 666–731. London: R. &amp; J. E. Taylor. No DOI. Read online at fourmilab.ch/babbage/sketch.html.</p>
<p><b>Game built from this paper; the paper is the authority where the two disagree.</b> Fonts: Abril Fatface and Old Standard TT (SIL Open Font License). There is no randomness in the game.</p>
"""
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_ABRIL__*/', '/*__FONT_OLD__*/', '/*__FONT_OLD_I__*/', '/*__FONT_OLD_B__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_ABRIL__*/', font('AbrilFatface-400.woff2')).replace('/*__FONT_OLD__*/', font('OldStandardTT-400.woff2'))
        .replace('/*__FONT_OLD_I__*/', font('OldStandardTT-400-italic.woff2')).replace('/*__FONT_OLD_B__*/', font('OldStandardTT-700.woff2'))
        .replace('/*__ABOUT__*/', about).replace('/*__MECHANISM__*/', mech))
name = 'lovelaces-cards.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
