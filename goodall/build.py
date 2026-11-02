# Generates goodalls-long-grass.html from template.html, mechanism.js (the single source of truth) and the embedded fonts,
# then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = open('about.html', encoding='utf-8').read()
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__ABOUT__*/', '/*__FONT_CP400__*/', '/*__FONT_CP700__*/', '/*__FONT_KALAM__*/']
for k in keys:
    assert t.count(k) == 1, k
out = (t.replace('/*__FONT_CP400__*/', font('CourierPrime-400.woff2')).replace('/*__FONT_CP700__*/', font('CourierPrime-700.woff2'))
        .replace('/*__FONT_KALAM__*/', font('Kalam-400.woff2')).replace('/*__ABOUT__*/', about).replace('/*__MECHANISM__*/', mech))
name = 'goodalls-long-grass.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
