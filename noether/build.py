# Generates noethers-ball.html from template.html, mechanism.js (the single source of truth) and the embedded fonts,
# then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>Nine changes to small pictures, each with its formula on screen: say whether the change matters to the formula. Every change that doesn\'t matter wins a prize, a number that stays the same along the real trip. The ball\'s formula cares how fast the clock runs, so a fake throw breaks its energy: a real law. The slide\'s formula doesn\'t, so its energy is zero on every slide, real or fake: no law. Einstein\'s gravity is like the slide, as Hilbert had claimed and Noether proved.</p>
<h3>What the paper does</h3>
<p>Emmy Noether\'s 1918 paper is about formulas of the kind S = ∫ f dt, which give every trip a number and so pick out the trip nature takes (mathematicians call them variational integrals), and about the changes that leave such a formula unchanged. <b>Theorem I:</b> for every change of a fixed kind that leaves the formula unchanged (start the clock later, move, turn; a group with a fixed number of parameters) there is a quantity that stays the same along every real motion, a conservation law; and the other way round. <b>Theorem II:</b> if the formula doesn\'t care about a change that can be made differently at every moment (a group that depends on free functions), the equations of motion are not independent: some of them follow from the others; and the other way round. Her first example of Theorem II is a formula that reads only the shape of a curve, not how fast it is traced, with the identity Σψᵢuᵢ′ = 0. Section 6 answers Hilbert: when starting the clock later is one of these free changes, its conservation law is <i>improper</i>: an identity that holds on every path, whether or not the equations of motion do. Proper energy laws exist exactly when there is no such free change. Hilbert\'s claim that this failure is characteristic of general relativity holds, she ends, when \'general relativity\' means a formula that doesn\'t care about such free changes.</p>
<h3>How the game maps onto it</h3>
<p>\'Does the change matter?\' is her invariance condition (equation 11). A prize is a conserved quantity (equations 12 and 13). Cards 1, 3 and 5 are Theorem I: energy, momentum (the sideways speed) and spin. Cards 7, 8 and 9 are section 6 and Theorem II. Card 7 shows the ball\'s formula caring how fast the clock runs, and a fake (the re-timed throw) breaking the ball\'s energy: a proper law. Card 8 shows the slide\'s energy improper, zero on the real slide and on a straight one alike. Card 9 shows the slide\'s formula indifferent to any change of timing, with her identity as the rule it gets instead of a prize. The pink cards (growing gravity, the magnet, the wind) are Theorem I the other way round: where the formula cares, there is no law. Each \'reason, in the formula\' line names the part of the formula that decides the card. The formula is on screen throughout, because the formula is the paper\'s subject.</p>
<h3>Mechanism: ported</h3>
<p><b>This game demonstrates</b> the theorems on six small formulas, computed, not quoted. Every card\'s answer is her invariance condition, checked on random paths, and for the change of timing on random timings too. Every prize is her conserved quantity, computed along real motions (paths that obey the equations of motion). The slide\'s energy is zero on every path, improper; the re-timed slide satisfies her identity Σψᵢuᵢ′ = 0; the ball\'s energy wobbles along the re-timed throw; the real slide is quicker than the straight one and than hundreds of bent ones; and every sentence the game gives as a reason is checked against the formula, point by point. The formula\'s numbers and the two pictures agree with the computed answer on every card.</p>
<p><b>It assumes</b> the six worlds: a thrown ball; the same ball under gravity that grows with time; the ball with a magnet; a dot on a spring round a peg; the same in a wind; and the slide, whose formula (each bit of the way divided by the speed there: the time) is the classic quickest-slide problem, the brachistochrone. The changes shown (five minutes later, one step left, a small turn, a change of timing) are finite versions of the paper\'s infinitely small ones. The straight comparison slide, the threshold for \'the same number\', and all the worlds\' numbers are ours, in the config block at the top of the source, with their reasons.</p>
<p><b>The paper establishes</b> the two theorems and their converses for any number of variables and derivatives, and the section 6 result on proper and improper energy laws. It does not say what energy \'is\' in general relativity, and neither does the game; the slide is a small picture of the kind of freedom Einstein\'s theory has, not a model of gravity.</p>
<h3>What is cut</h3>
<p>Formulas with higher derivatives and with several variables of integration (fields); mixed groups; how finite changes are built from infinitely small ones; section 5, on relative invariance; Einstein\'s modified formula and the exchange with Klein in the notes; the group structure itself.</p>
<h3>The paper</h3>
<p>Emmy Noether, <i>Invariante Variationsprobleme</i>. Nachrichten von der Königlichen Gesellschaft der Wissenschaften zu Göttingen, Mathematisch-physikalische Klasse, 1918, pp. 235–257. No DOI. German text at de.wikisource.org/wiki/Invariante_Variationsprobleme; English translation by M. A. Tavel, Transport Theory and Statistical Physics 1 (1971) 186–207, arXiv:physics/0503066.</p>
<p><b>Game built from this paper; the paper is the authority where the two disagree.</b> Fonts: Chakra Petch, Saira and Share Tech Mono (SIL Open Font License).</p>
"""
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_CHAKRA__*/', '/*__FONT_SAIRA__*/', '/*__FONT_MONO__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_CHAKRA__*/', font('ChakraPetch-700.woff2')).replace('/*__FONT_SAIRA__*/', font('Saira-400.woff2'))
        .replace('/*__FONT_MONO__*/', font('ShareTechMono-400.woff2')).replace('/*__ABOUT__*/', about).replace('/*__MECHANISM__*/', mech))
name = 'noethers-ball.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
