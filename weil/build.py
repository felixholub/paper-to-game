# Generates weils-vase.html from template.html, mechanism.js (the single source of truth), rig.js (the drawing) and the
# embedded font, then verifies byte for byte that the embedded mechanism is the file calibration.js ran against.
import base64, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mech = open('mechanism.js', encoding='utf-8').read()
rig = open('rig.js', encoding='utf-8').read()
font = lambda f: base64.b64encode(open('fonts/' + f, 'rb').read()).decode()
about = open('about.html', encoding='utf-8').read()
t = open('template.html', encoding='utf-8').read()
keys = ['/*__MECHANISM__*/', '/*__RIG__*/', '/*__ABOUT__*/', '/*__FONT_FORUM__*/']
for k in keys:
    assert t.count(k) == 1, k
out = t.replace('/*__FONT_FORUM__*/', font('forum.woff2')).replace('/*__ABOUT__*/', about).replace('/*__RIG__*/', rig).replace('/*__MECHANISM__*/', mech)
name = 'weils-vase.html'
open(name, 'w', encoding='utf-8').write(out)
built = open(name, encoding='utf-8').read()
if mech not in built:
    sys.exit('BUILD FAILED: embedded mechanism differs from mechanism.js')
print(f'built {name}: {len(built)} bytes; mechanism embedded verbatim ({len(mech)} bytes)')
