# Generates jevons-noon.html from template.html, mechanism.js (the single source of truth), words.js, about.html and
# the embedded fonts, then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os, subprocess, json
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
# the best path found, for the score: computed from this mechanism.js by optimum.js (a few seconds)
subprocess.run(['node', 'optimum.js'], check=True)
optimum = open('optimum.json', encoding='utf-8').read().strip()
json.loads(optimum)
words = open('words.js', encoding='utf-8').read()
about = open('about.html', encoding='utf-8').read()
roman = base64.b64encode(open('fonts/bodoni-moda-roman.woff2', 'rb').read()).decode()
italic = base64.b64encode(open('fonts/bodoni-moda-italic.woff2', 'rb').read()).decode()
t = open('template.html', encoding='utf-8').read()
for k in ['/*__MECHANISM__*/', '/*__WORDS__*/', '/*__OPTIMUM__*/', '/*__ABOUT__*/', '/*__FONT_ROMAN__*/', '/*__FONT_ITALIC__*/']:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_ROMAN__*/', roman).replace('/*__FONT_ITALIC__*/', italic).replace('/*__ABOUT__*/', about)
        .replace('/*__OPTIMUM__*/', optimum).replace('/*__WORDS__*/', words).replace('/*__MECHANISM__*/', mech))
name = 'jevons-noon.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
