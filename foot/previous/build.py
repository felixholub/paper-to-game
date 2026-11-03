# Generates foots-bad-man.html from template.html, mechanism.js (the single source of truth) and the embedded fonts,
# then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>You are the bad man from Philippa Foot's paper. Three good people each live by a rule; you spring her cases on them as traps, one life against five every time, and the audience judges what they do. Before each of them chooses, you say what you would do in their chair; at the end you learn which of the three rules you chose like, and the film closes on the case the paper was written about.</p>

<h3>What the paper argues</h3>
<p>Why may the driver of a runaway tram steer away from five men and into one, while a judge may not hang one innocent man to stop a mob from killing five hostages? The numbers are the same. This 1967 paper is where the runaway tram first appears, and in it the tram is the <i>easy</i> case: "we should say, without hesitation, that the driver should steer". The puzzle is the judge.</p>
<p>The famous answer is the <b>doctrine of the double effect</b>, which Doctor Double lives by: you may never aim at an innocent death, as your goal or as your means, but you may bring one about as a side effect you only foresee, if the good is great enough. The judge needs his victim dead; the driver does not. Its defenders said that without it we would be "hopelessly in the power of bad men": anyone could make it our duty to kill by threatening to kill more. That is Mr Most's rule, and your first reel: he counts lives and nothing else, Bentham's arithmetic (Foot names Bentham only for his word "oblique"; "the size of the evil must always be our guide" is her phrase for the view).</p>
<p>Foot offers a different line, Mrs Foot's: the duty not to harm people is stricter than the duty to help them. Harm against harm (the driver: either way his tram kills): harm the fewest. Help against help (one dose of a drug, or five small ones): help the most. Harm against help (the judge, the serum, the tyrant's threat): you may not harm one to help others. Letting someone die <i>so that</i> he dies (the beggar, left to starve so that his body can be used) counts as harm.</p>
<p>The two lines agree on every familiar pair. So Foot builds a case that splits them: five patients can be saved by making a gas that will also send lethal fumes into the room of a sixth, who cannot be moved. His death is no use to anyone, only a side effect, so the doctrine allows it. It is harm done to help others, so her line forbids it. "Yet it surely is different" from the drug, and his relatives would win if they sued. Your brew is her gas. Her conclusion: what you aim at plays "only a quite subsidiary role" in what we say about these cases; whether you harm or help is "very important indeed". And rejecting the doctrine does not leave us counting lives.</p>
<p>The cave is in the paper too, as light relief and as a parallel for abortion: a man stuck in the only way out of a flooding cave, who will drown with the others if nothing is done. Anyone who holds that aiming at an innocent death is never allowed must forbid the dynamite, and there, Foot says, they "conflict with that of most reasonable men".</p>

<h3>What the paper was for</h3>
<p>Foot's real subject was abortion. The doctrine of the double effect was used to allow some operations that kill a fetus (removing a cancerous womb) and forbid others (crushing the skull), even to save the mother. She ends with three medical cases and finds each a parallel among adults: mother and child both die unless the child is killed (the cave: no real conflict, so act, "whatever the method"); either can be saved but not both (the shipwreck: only a question of whom to save); and the worst, where killing the child saves the mother but doing nothing saves the child (the doctrine forbids it, and Foot thinks the verdict may be right for the wrong reason, since "in general we do not think that we can kill one innocent person to rescue another"). Her conclusions are cautious; in her words, "I have not been arguing for or against these points of view but only trying to discern some of the currents that are pulling us back and forth." The epilogue plays these three cases as she lists them, one life against one, with no bad man, no audience and no score; the cave and the brew say in the film what they stand for in the paper.</p>

<h3>The reply in the same issue</h3>
<p>Elizabeth Anscombe's note "Who is Wronged?" ran straight after the paper. She disputes one point: that you must give the scarce drug to the five. If you give the whole dose to the one who needs it, who can say you wronged <i>him</i>? Nobody was owed it. In the game no rule gives the medicine to the one; a player who does, in the chair, is told the audience is divided and that Anscombe is on their side.</p>

<h3>The house of fourteen</h3>
<p>The audience is the paper's "most of us", and the paper has no counts, only hedges: the driver steers "without hesitation"; "most of us would be appalled" at the judge; the gassed man's relatives "would presumably be successful if they sued"; blasting the cave is what "most reasonable men" say, against the Catholic edict; and Anscombe disputes the drug outright. So the fourteen people in the stalls split, by the strength of her words: all fourteen cheer the tram; twelve turn on the man who takes the bargain and two count; ten turn on the brew and four say he never meant it; the cave splits eleven to three each way. The shares are ours, read off her phrases, not counted anywhere, and each is tagged to its sentence in the source. A good person is disgraced when ten or more turn.</p>

<h3>The mechanism: a toy</h3>
<p>The paper has no data and no model; it has cases, two principles and the verdicts "we" give. The game describes each scheme by the features the argument uses (is the death aimed at or only foreseen; is it harm done or help withheld; is it traded against harm or against help; would the one die anyway) and runs each rule on them. The audience's split on each act is read off the paper's own sentence, tagged in the source.</p>
<ul>
<li><b>What the game demonstrates:</b> that the three rules, as stated here, answer the paper's cases the way the paper says they do, and that the double-effect rule parts from Foot's on the gas (and on the cave) and nowhere else among them.</li>
<li><b>What the game assumes:</b> the bad man behind every case; one life against five everywhere; that the player in the chair is one of the paper's "we", so their choices can be read against the three rules; the rules compressed into two or three lines; the shares of the house, ours, read off Foot's hedges; the house's view of refusals, ours, drawn from Foot's line that the bad man, not the one who refuses him, intends those deaths. Whether any rule could be trapped by a case not in the paper is beyond the game.</li>
<li><b>What the paper establishes:</b> an argument, not a finding: that the distinction between harming and helping, not between aiming and foreseeing, explains the verdicts most of us give in these cases. Whether you share those verdicts is yours to say.</li>
</ul>

<h3>What the game changed</h3>
<p>In the paper only the tyrant is a bad man; here he poisons the patients, cuts the tram's brakes and floods the cave. Foot treats stopping someone else's harm as help, so the cases keep their shape. The bargain stands for the judge, the serum and the tyrant's threat. In the cave the good person holds the dynamite outside, with five trapped behind the stuck man (in the paper the trapped party do the blasting, and the stuck man is "the fat man"). Mr Most and Doctor Double are ours; Mrs Foot is Foot's own principle, under the name Anscombe used for her. Mrs Foot's rule as printed does not say that a man lost either way may be blasted; she says it in the cave, as Foot does.</p>
<p>Left out: the foothold (the man on the branch might cling on and survive, while the judge's victim must be made to die), which Foot sets aside; the poisoners and the gravediggers; the shipwreck; the line between strict duties and charity.</p>

<h3>The paper</h3>
<p>Philippa Foot, "The Problem of Abortion and the Doctrine of the Double Effect", <i>Oxford Review</i> 5 (1967): 5–15; reprinted in <i>Virtues and Vices and Other Essays in Moral Philosophy</i> (1978). No DOI. Record: <a href="https://philpapers.org/rec/FOOTPO-2">philpapers.org/rec/FOOTPO-2</a>. With G. E. M. Anscombe, "Who is Wronged? Philippa Foot on Double Effect: One Point", <i>Oxford Review</i> 5 (1967): 16–17.</p>
<p>Game built from this paper; the paper is the authority where the two disagree.</p>
<p style="color:var(--muted);font-size:13.5px">Type: Limelight by Nicole Fally and Libre Baskerville by Pablo Impallari, both under the SIL Open Font License, embedded.</p>
"""
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_LIMELIGHT__*/', '/*__FONT_BASK__*/', '/*__FONT_BASK_BOLD__*/', '/*__FONT_BASK_IT__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_LIMELIGHT__*/', font('limelight.woff2'))
        .replace('/*__FONT_BASK__*/', font('baskerville.woff2'))
        .replace('/*__FONT_BASK_BOLD__*/', font('baskerville-bold.woff2'))
        .replace('/*__FONT_BASK_IT__*/', font('baskerville-italic.woff2'))
        .replace('/*__ABOUT__*/', about)
        .replace('/*__MECHANISM__*/', mech))
name = 'foots-bad-man.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
