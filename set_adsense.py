# Pasang ID AdSense ke website
# Menulis meta tag, ads.txt, ads-config.js, lalu menaikkan versi cache sw.js
# Cara pakai: python set_adsense.py ca-pub-xxxxxxxxxxxxxxxx [slot_mid] [slot_low]

import re
import sys

# Folder website
root = 'public'
args = sys.argv[1:]
# Cek argumen
if not args:
    print('Usage: python set_adsense.py ca-pub-xxxxxxxxxxxxxxxx [slot_mid] [slot_low]')
    sys.exit(1)

pub = args[0].strip()
if not re.fullmatch(r'ca-pub-\d{10,20}', pub):
    print('FAILED: the publisher id must look like ca-pub-1234567890123456')
    sys.exit(1)

# Slot iklan opsional
slots = {'mid': '', 'low': ''}
for key, val in zip(('mid', 'low'), args[1:3]):
    if val and not re.fullmatch(r'\d{6,20}', val):
        print('FAILED: a slot id must contain digits only')
        sys.exit(1)
    slots[key] = val

# Tambah atau ganti meta tag AdSense di index.html
idx = root + '/index.html'
html = open(idx, encoding='utf-8').read()
meta = '<meta name="google-adsense-account" content="' + pub + '">'
if 'google-adsense-account' in html:
    html = re.sub(r'<meta name="google-adsense-account" content="[^"]*">', meta, html)
else:
    anchor = '<link rel="canonical" href="https://removebg.sbs/">'
    if html.count(anchor) != 1:
        print('FAILED: canonical link not found in index.html')
        sys.exit(1)
    html = html.replace(anchor, anchor + '\n' + meta)

# Naikkan versi cache supaya pengguna dapat file baru
sw = root + '/sw.js'
js = open(sw, encoding='utf-8').read()
m = re.search(r"const CACHE = 'app-v(\d+)';", js)
if not m:
    print('FAILED: cache version not found in sw.js')
    sys.exit(1)
js = js.replace(m.group(0), "const CACHE = 'app-v" + str(int(m.group(1)) + 1) + "';")

# Isi ads-config.js dan ads.txt
cfg = "window.ADS_CONFIG = { client: '" + pub + "', slots: { mid: '" + slots['mid'] + "', low: '" + slots['low'] + "' } };\n"
txt = 'google.com, ' + pub.replace('ca-', '', 1) + ', DIRECT, f08c47fec0942fa0\n'

# Simpan semua perubahan
open(idx, 'w', encoding='utf-8').write(html)
open(sw, 'w', encoding='utf-8').write(js)
open(root + '/js/ads-config.js', 'w', encoding='utf-8').write(cfg)
open(root + '/ads.txt', 'w', encoding='utf-8').write(txt)
print('OK: AdSense settings written (meta tag, ads.txt, ads-config.js, cache bumped)')
