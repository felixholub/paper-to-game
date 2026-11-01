# Generates noethers-ball.html from template.html, mechanism.js (the single source of truth) and the embedded fonts,
# then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>Nine changes to small pictures, each with its formula on screen: say whether the change matters to the formula. Every change that doesn\'t matter wins a prize, a number that stays the same along the trip; the ball\'s clock can\'t be re-ticked, so its energy is real; the slide\'s can, so its energy comes out empty. That empty prize is the answer to Hilbert\'s question.</p>
<h3>What the paper does</h3>
<p>Emmy Noether\'s 1918 paper is about a variational integral S = ∫ f dt, a formula that gives every trip a number and so picks out the trip nature takes, and about the continuous groups of transformations under which it is invariant. <b>Theorem I:</b> if the group has ρ parameters, there are ρ combinations of the equations of motion that are divergences: ρ conservation laws; and conversely. <b>Theorem II:</b> if the group depends on ρ arbitrary functions, there are ρ identities between the equations of motion; and conversely. Her first example of Theorem II is the parametric integral that reads only the shape of a curve, invariant under any re-labelling of the parameter, with the identity Σψᵢuᵢ′ = 0. Section 6 answers Hilbert: when the shift of time sits inside such an infinite group, its conservation law is <i>improper</i>, an identity that holds on every path, whether or not the equations of motion do; proper energy theorems exist exactly when there is no such group. Hilbert\'s claim that this failure is characteristic of general relativity holds, she ends, when "general relativity" means invariance under a group depending on arbitrary functions.</p>
<h3>How the game maps onto it</h3>
<p>"Does the change matter?" is the paper\'s invariance condition (her equation 11). "A prize" is a conserved quantity (equations 12 and 13). Cards 1, 3 and 5 are Theorem I. Cards 7, 8 and 9 are section 6 and Theorem II: card 7 shows the ball\'s formula caring about a re-ticked clock, which is why its energy is a proper law; card 8 shows the slide\'s energy improper, zero on the real slide and on a straight slide alike; card 9 shows the slide\'s formula indifferent to any re-ticking, with her identity as the rule it wins. The pink cards (growing gravity, the magnet, the wind) are the converse of Theorem I: where the formula cares, the law breaks. Each "why, in the formula" line names the feature of the integrand that decides the card. The formula itself is on screen throughout, because the formula is the paper\'s subject.</p>
<h3>Mechanism: ported</h3>
<p><b>This game demonstrates</b> the theorems on six small integrals, computed, not quoted. Every card\'s answer is her invariance condition checked on random paths, and for the re-ticked clock on random functions too; every prize is her current B, read along true motions (solutions of the equations of motion); the slide\'s clock prize is identically zero, improper; the re-ticked slide satisfies her identity Σψᵢuᵢ′ = 0; and every sentence the game gives as the reason for an answer is checked against the formula point by point. The formula\'s numbers and the two pictures agree with the computed answer on every card.</p>
<p><b>It assumes</b> the six worlds: a thrown ball; the same ball under gravity that grows with time; the ball with a magnet; a dot on a spring round a peg; the same in a wind; and the slide, whose integrand distance/√drop is the brachistochrone\'s. The finite changes shown (five minutes later, one step left, a turn, a re-ticking) illustrate infinitesimal ones; the straight comparison slide, the threshold for "the same", and all the worlds\' numbers are ours, in the config block at the top of the source with their reasons.</p>
<p><b>The paper establishes</b> the two theorems and their converses for any number of variables and derivatives, and the section 6 result on proper and improper energy relations. It does not say what energy "is" in general relativity, and neither does the game; the slide is a one-parameter picture of the freedom Einstein\'s theory has, not a model of gravity.</p>
<h3>What is cut</h3>
<p>Higher derivatives and the n-fold integral; mixed groups; the construction of finite transformations from infinitesimal ones; relative invariance (section 5); Einstein\'s modified integral and the exchange with Klein in the notes; the group structure itself.</p>
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
