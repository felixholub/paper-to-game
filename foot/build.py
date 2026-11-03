# Generates foots-bad-man.html from template.html, mechanism.js (the single source of truth), stage.js and the embedded
# fonts, then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
stage = open('stage.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>A bad man asks you to do seven things, each a worse deed than the last, to save a few people from him. You decide each one. After each, the house tells you how Philippa Foot reads it, and where she draws her line. It is not where a reader of the trolley problem expects.</p>

<h3>What the paper argues</h3>
<p>This 1967 paper is where the runaway tram comes from, and in it the tram is the <i>easy</i> case: "we should say, without hesitation, that the driver should steer for the less occupied track". The puzzle is the judge, who could stop a mob from killing five hostages by framing and hanging one innocent man, and may not. Same numbers. Why?</p>
<p>The famous answer is the doctrine of the double effect, which the film calls the famous rule: you may never aim at an innocent death, as your goal or as your means, but you may bring one about as a side effect you only foresee, if the good is great enough. The driver only foresees the one man's death; the judge needs it. Its defenders said that without it we would be "hopelessly in the power of bad men": anyone could make it our duty to kill by threatening to kill more. That is why the film has a bad man.</p>
<p>Foot once thought that argument conclusive, and in this paper she replaces it. Her answer: the duty not to harm people is stricter than the duty to help them. So three kinds of conflict, three rules. Harm against harm (the driver: either way his tram kills): do the least harm. Help against help (one bottle, for one or for five): help the most. Harm against help (the judge, the serum, the tyrant's bargain): you may not harm one to help others. Letting someone die <i>so that</i> he dies (the beggar, left to starve for his body) counts as harm. And where the one is lost either way (the man stuck in the cave), there is no conflict at all.</p>
<p>The two rules agree on every familiar case. So Foot builds one that splits them: five patients can be saved by making a gas that will also send lethal fumes into the room of a sixth, who cannot be moved. His death is no use to anyone, a side effect, so the famous rule allows it. It is harm done to help others, so hers forbids it. "Yet it surely is different" from the scarce drug, she says, and the relatives would win if they sued. That is the brew. Her conclusion: what you aim at "plays only a quite subsidiary role in determining what we say in these cases, while the distinction between avoiding injury and bringing aid is very important indeed." And rejecting the famous rule does not leave us counting lives.</p>

<h3>The staircase</h3>
<p>The film keeps the numbers nearly fixed and makes the deed worse at every step: turn a wheel, keep a bottle, brew a cure, shut a door, pull a trigger, take up the irons, light a fuse. The order is ours; the cases are hers (the tram, the scarce drug, the gas, the beggar, the judge as a private bargain, the tyrant's torture, the cave). The point of the staircase is that her line does not climb with it: she allows the first two, forbids the next four, and allows the last, which is the worst deed of all. The famous rule allows the first three and forbids the rest. Most of us, in her words, go with her, except that on the torture the paper gives no "most of us" at all.</p>
<p>The numbers: five against one for the tram, the medicine, the brew and the bargain, as in the paper; two for the irons (her "mad murderer" who makes it our duty to kill one "to prevent him from killing two"); three for the beggar (the serum saves "several"); eight for the cave (the paper's party is uncounted). Within each pair the numbers are the same, so the numbers can never be the difference.</p>

<h3>The pairs</h3>
<p>Foot argues in pairs: two cases with the same numbers and different verdicts, and a question: what is the difference? The film keeps her pairs as the house's first remark on each step: the medicine against the tram, the brew against the medicine (her own question, "why then is the case different from that of the scarce drug?"), the beggar against the medicine, the bargain against the tram (her driver and judge), the irons against the bargain, the cave against the bargain. When you decided the two differently, the house asks you to name the difference and tells you whether it is the one she names.</p>

<h3>The house</h3>
<p>The people along the bottom of the picture are the "we" of the paper: "we should say, without hesitation"; "most of us would be appalled"; "yet it surely is different"; "most reasonable men". They do not vote and they do not split. They watch, and afterwards they tell you what she says, and what she says most of us say. Their reactions follow the deed, not the verdict; the whole house flinches at the cave, which she allows.</p>

<h3>What the paper was for</h3>
<p>Foot's real subject was abortion. The famous rule was used to allow some operations that kill a fetus (removing a cancerous womb) and forbid others (crushing the skull), even to save the mother. She ends with three medical cases and finds each a parallel among adults: mother and child both die unless the child is killed (the cave: no real conflict, so act, "whatever the method used"); either can be saved but not both (the shipwreck: only a question of whom to save); and the worst, where killing the child saves the mother but doing nothing saves the child (the famous rule forbids it, and Foot thinks the verdict may be right for the wrong reason, since "in general we do not think that we can kill one innocent person to rescue another"). She ends without a verdict: "I have not been arguing for or against these points of view but only trying to discern some of the currents that are pulling us back and forth." The epilogue plays the three cases as she lists them.</p>

<h3>The reply in the same issue</h3>
<p>Elizabeth Anscombe's note "Who is Wronged?" ran straight after the paper. She disputes one point: that you must give the scarce drug to the five. If you give the whole dose to the one who needs it, who can say you wronged <i>him</i>? Nobody was owed it.</p>

<h3>The mechanism: a toy</h3>
<p>The paper has no data and no model; it has cases, two principles and the verdicts "we" give. The game describes each case by the features her argument uses (is the harm aimed at or only foreseen; is it harm done or help withheld; is it set against harm you would do or help you would give; would the one suffer anyway) and runs her rule and the famous rule on them. Every verdict the house reports is tagged in the source to the sentence it comes from.</p>
<ul>
<li><b>What the game demonstrates:</b> that the two rules, as stated here, answer the paper's seven cases the way the paper says they do; that they part on the brew and the cave and nowhere else; and that the pairs carry the differences she names.</li>
<li><b>What the game assumes:</b> a bad man behind every case (in the paper only the tyrant is one); the order of the staircase; the numbers where the paper gives none; the two rules compressed into a few lines each; "most of us" taken from her hedges, not counted.</li>
<li><b>What the paper establishes:</b> an argument, not a finding: that the distinction between harming and helping, not between aiming and foreseeing, explains the verdicts most of us give in these cases. Whether you share those verdicts is yours to say, and the film records what you said.</li>
</ul>

<h3>What the game changed</h3>
<p>In the paper only the tyrant is a bad man; here one man poisons the patients, cuts the tram's brakes, holds the hostages and floods the cave. Foot treats stopping someone else's harm as help, so the cases keep their shape. The bargain is her judge with the court taken out, as she takes it out herself ("some private individual"). In the cave you hold the dynamite outside, with the party trapped behind the stuck man (in the paper the trapped party do the blasting, and the stuck man is "the fat man"). The irons are her tyrant's torture, with his mad murderer's number. Left out: the foothold (the man on the branch might cling on and survive, while the judge's victim must be made to die), which she sets aside; the poisoners and the gravediggers; the line between strict duties and charity.</p>

<h3>The paper</h3>
<p>Philippa Foot, "The Problem of Abortion and the Doctrine of the Double Effect", <i>Oxford Review</i> 5 (1967): 5–15; reprinted in <i>Virtues and Vices and Other Essays in Moral Philosophy</i> (1978). No DOI. Record: <a href="https://philpapers.org/rec/FOOTPO-2">philpapers.org/rec/FOOTPO-2</a>. With G. E. M. Anscombe, "Who is Wronged? Philippa Foot on Double Effect: One Point", <i>Oxford Review</i> 5 (1967): 16–17.</p>
<p>Game built from this paper; the paper is the authority where the two disagree.</p>
<p style="color:var(--muted);font-size:13.5px">Type: Limelight by Nicole Fally and Libre Baskerville by Pablo Impallari, both under the SIL Open Font License, embedded.</p>
"""
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_LIMELIGHT__*/', '/*__FONT_BASK__*/', '/*__FONT_BASK_BOLD__*/', '/*__FONT_BASK_IT__*/', '/*__FIGS__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_LIMELIGHT__*/', font('limelight.woff2'))
        .replace('/*__FONT_BASK__*/', font('baskerville.woff2'))
        .replace('/*__FONT_BASK_BOLD__*/', font('baskerville-bold.woff2'))
        .replace('/*__FONT_BASK_IT__*/', font('baskerville-italic.woff2'))
        .replace('/*__ABOUT__*/', about)
        .replace('/*__FIGS__*/', stage).replace('/*__SCENES__*/', '').replace('/*__HELPERS__*/', '').replace('/*__FILMS__*/', '')
        .replace('/*__MECHANISM__*/', mech))
name = 'foots-bad-man.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
