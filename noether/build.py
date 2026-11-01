# Generates noethers-press.html from template.html, mechanism.js (the single source of truth) and the embedded fonts,
# then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>Each formula gives every path a number, and the dot takes the path with the smallest one. Find the changes the formula does not care about and you win prizes, numbers that stay the same along the best path and on no other; re-tick the clock freely in a formula that lets you, and the clock\'s prize comes out empty. That empty prize is Hilbert\'s answer.</p>
<h3>Why the formula is on screen</h3>
<p>Noether\'s paper is about a formula, a variational integral, and what its symmetries force; so this game, alone among the Pantheon games, shows the formula itself on a plate, with its symbols said in words. The dot is only how one looks at the formula. The paths the player draws are the variations of the calculus of variations; the "prize" is a conserved quantity; "the formula does not care" is invariance of the integral; "empty" is her <i>improper</i>.</p>
<h3>What the paper does</h3>
<p>Emmy Noether's 1918 paper is about a variational integral (an action) that is invariant under a continuous group of transformations, and it proves two theorems. <b>Theorem I:</b> if the group has ρ parameters, there are ρ independent combinations of the Lagrange expressions (the equations of motion) that are divergences, which is to say ρ conservation laws; and conversely, ρ conservation laws imply invariance under such a group. <b>Theorem II:</b> if the group depends on ρ arbitrary functions and their derivatives, there are ρ identities between the Lagrange expressions and their derivatives, so that ρ of the equations of motion are consequences of the rest; and conversely. Her first example of Theorem II is the Weierstrass parametric integral, invariant under any re-labelling of the parameter, with the identity Σψᵢuᵢ' = 0.</p>
<p>Section 6 answers a question of Hilbert's: why do proper energy theorems fail in general relativity? Because when a finite group (the shifts of the independent variables) sits inside an infinite group under which the integral is invariant, the conservation laws of the finite group become <i>improper</i>: linear combinations of the identities of Theorem II, plus divergences that vanish identically; they hold whether or not the equations of motion do. Proper energy theorems exist exactly when there is no such infinite group (classical mechanics, special relativity). Hilbert's claim that this failure is characteristic of general relativity holds, she ends, only if "general relativity" is taken to mean invariance under a group depending on arbitrary functions.</p>
<h3>Mechanism: ported</h3>
<p><b>This game demonstrates</b> the theorems' identities on four small worlds, computed, not quoted: for every lever the Lie condition (her equation 11) is checked on random paths; a lever that passes gives the current B of her equations 12 and 13, which the Auditor reads along true motions (solutions of the equations of motion) and fakes (bumped and re-ticked paths); a free-hand lever that passes gives the identity of her equation 16, checked on random paths. On the glass and the sheet (integrals homogeneous of first degree in the velocities, her example on p. 7) the clock's current is identically zero: improper, as section 6 says; on the floor and the spring it is the energy, and proper.</p>
<p><b>It assumes</b> the worlds: two Newton-type integrals (a free bead; a bead on a spring) and two Weierstrass-type integrals (light in glass whose density depends on depth, which is Fermat's principle; a bead on a sheet with a well, a geodesic in a conformally flat metric), with profiles chosen for a visible bend. One parameter instead of four coordinates: the "free hand" here is the re-ticking of a single clock, Noether's own simplest case, and Einstein's group of all coordinate transformations is played as that. Six levers, three blanks, an Auditor with seven test motions, thresholds for "steady" and "swings": all ours, in the config block at the top of the source with their reasons. The tags' names are what the quantities measure; their formulas are in the source.</p>
<p><b>The paper establishes</b> the two theorems and their converses for any number of variables and derivatives, and the section 6 result on proper and improper energy relations. It does not say what energy "is" in general relativity, and neither does the game; it says that the law attached to the shift of a coordinate is an identity there. The world of the sheet is a one-dimensional picture of that, not a model of gravity.</p>
<h3>What is cut</h3>
<p>Higher derivatives and the n-fold integral; mixed groups; the construction of finite transformations from infinitesimal ones (her sections 3 and 4); section 5 on relative invariance; the nonlinear dependencies between first integrals; Einstein's modified integral I* and the exchange with Klein in the notes. The group structure itself: the player pulls one infinitesimal transformation at a time.</p>
<h3>The paper</h3>
<p>Emmy Noether, <i>Invariante Variationsprobleme</i>. Nachrichten von der Königlichen Gesellschaft der Wissenschaften zu Göttingen, Mathematisch-physikalische Klasse, 1918, pp. 235–257. Presented by F. Klein on 26 July 1918. No DOI. German text at de.wikisource.org/wiki/Invariante_Variationsprobleme; English translation by M. A. Tavel, Transport Theory and Statistical Physics 1 (1971) 186–207, arXiv:physics/0503066.</p>
<p><b>Game built from this paper; the paper is the authority where the two disagree.</b> Fonts: Chakra Petch, Saira and Share Tech Mono (SIL Open Font License). The only randomness is in the test paths and the starting points of motions; it changes nothing the game reads.</p>
"""
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_CHAKRA__*/', '/*__FONT_SAIRA__*/', '/*__FONT_MONO__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_CHAKRA__*/', font('ChakraPetch-700.woff2')).replace('/*__FONT_SAIRA__*/', font('Saira-400.woff2'))
        .replace('/*__FONT_MONO__*/', font('ShareTechMono-400.woff2')).replace('/*__ABOUT__*/', about).replace('/*__MECHANISM__*/', mech))
name = 'noethers-press.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
