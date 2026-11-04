# Generates home-judges.html from template.html, mechanism.js (the single source of truth) and the two embedded fonts,
# then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys
mech = open('mechanism.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = """
<h3>The game in one line</h3>
<p>You seat the panel; four bars show which applicants collect the home bonus. The bonus sizes are the study's; the panel, the applicants and the way judges are drawn are this game's.</p>
<h3>What the study found</h3>
<p>Fuchs-Schündeln and Holub use all 37,073 ERC applications from 2019 to 2023, with about four panel reviewers per proposal. They compare the same proposal across its reviewers and each reviewer across proposals. When reviewer and applicant share both country of work and citizenship, the Step 1 project score is <b>0.164 points</b> higher on the 1–5 scale (95% CI 0.135–0.193). Citizenship only: +0.075. Country of work only: +0.056. Same gender: +0.024. The extra marks are top marks, and the bonus survives controls for academic closeness, coauthorship and topic. Their Table 2 shows that applicants working in the five biggest countries face panels where 4.6% of members share both their country and citizenship, against 1.5% for everyone else. Panel-level outcomes are correlational: they link these matches to a funding edge of about 1.7 percentage points for the big five against 0.8 for everyone else.</p>
<h3>Mechanism: reconstructed, on a toy</h3>
<p><b>This game demonstrates</b> what the study's bonus sizes imply for the home advantage different panels hand out, under this game's assumptions. <b>It assumes</b> that every judge carries the study's average bonus (real judges surely differ); that judges are drawn at random from the panel (the ERC assigns by expertise); and an applicant population of 51 passport-and-workplace types that we constructed so that the round 2 panel reproduces the study's Table 2 exposure shares, give or take about a percentage point. About a quarter of our applicants work outside their passport country; that is our guess. <b>The study establishes</b> the bonus sizes for individual reviews and the exposure gap on real panels. It does not test what other panels would do, and it does not show that panel composition causes the funding gap.</p>
<p>A "home star" is our unit: one judge sharing passport and workplace, worth +0.164 on that judge's mark. Passport only counts 0.46 of a star; workplace only, 0.34. The four bars sort applicants by passport (a Big Five country or not) and by where they work (in the Big Five or elsewhere); each is that group's applicant-weighted average of expected stars per 10 juries. The target compares all applicants who work in the Big Five with all who work elsewhere, as the study's Table 2 does; each side is weighted by group size, not an average of bar heights. The match key's 3 / 1 / 1 / 0 marks are relative pictures only; the game computes with the exact sizes above. Round 2's panel is one 15-seat panel standing for the average over 27 panels, three grant types and five years. The four swaps and the half-star target are game choices. The study does not say that levelling is the right goal; it lists more diverse panels, limits on matched assignments, extra reviews near the cutoff, partial lotteries and blind project scoring as ideas to evaluate.</p>
<h3>What is cut</h3>
<p>Step 2 reviews (similar sizes), PI scores (smaller), gender in the bars, the split by grant scheme and by field, the null result for elite institutions, the panel chair, and the Step 1 cutoff itself.</p>
<h3>The paper</h3>
<p>Nicola Fuchs-Schündeln and Felix Holub, <i>Homophily in Grant Evaluations</i>. WZB Berlin Social Science Center and Goethe University Frankfurt, manuscript. No DOI given; code and pseudo data: doi:10.6084/m9.figshare.30789395. The ERC data are confidential; this game uses only numbers printed in the paper.</p>
<p><b>Game built from this paper; the paper is the authority where the two disagree.</b> It is a beta. It has had the builder's review only and has not been tested with real players. Fonts: Bungee and Rubik, SIL Open Font License.</p>
"""
t = open('template.html', encoding='utf-8').read()
for k in ['/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_BUNGEE__*/', '/*__FONT_RUBIK__*/']:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_BUNGEE__*/', font('bungee.woff2')).replace('/*__FONT_RUBIK__*/', font('rubik.woff2'))
        .replace('/*__ABOUT__*/', about).replace('/*__MECHANISM__*/', mech))
name = 'home-judges.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
