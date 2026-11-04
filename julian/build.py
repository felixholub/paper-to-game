# Generates julians-window.html from template.html, page.js (the interface), about.html, mechanism.js (the single source of truth) and the
# embedded fonts, then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
page = open('art.js', encoding='utf-8').read() + '\n' + open('page.js', encoding='utf-8').read()
about = open('about.html', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__PAGE__*/', '/*__ABOUT__*/', '/*__FONT_DELIUS__*/', '/*__FONT_ITALIANA__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_DELIUS__*/', font('Delius-400.woff2')).replace('/*__FONT_ITALIANA__*/', font('Italiana-400.woff2'))
        .replace('/*__ABOUT__*/', about).replace('/*__PAGE__*/', page).replace('/*__MECHANISM__*/', mech))
name = 'julians-window.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
