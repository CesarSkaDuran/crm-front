from PIL import Image, ImageFilter
from pathlib import Path

src = Path(r'D:\Descargas\WhatsApp Image 2026-08-23 at 11.27.15 AM.jpeg')
im = Image.open(src).convert('RGBA')
w, h = im.size

# Crop upper centered logo mark (no wordmark)
left = int(w * 0.285)
top = int(h * 0.145)
right = int(w * 0.715)
bottom = int(h * 0.585)
mark = im.crop((left, top, right, bottom))

# Build alpha from brightness / blue channel so black bg becomes transparent
r, g, b, a = mark.split()
# Use max channel as intensity for cyan/blue/violet glow
intensity = Image.merge('RGB', (r, g, b)).convert('L')
# Threshold-ish alpha: dark -> 0, bright logo -> 255
alpha = intensity.point(lambda p: 0 if p < 18 else min(255, int((p - 18) * 3.2)))
alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.6))
mark.putalpha(alpha)

# Tight crop by alpha
bbox = mark.getbbox()
if not bbox:
    raise SystemExit('No content after alpha')
pad = 8
x0, y0, x1, y1 = bbox
x0 = max(0, x0 - pad)
y0 = max(0, y0 - pad)
x1 = min(mark.width, x1 + pad)
y1 = min(mark.height, y1 + pad)
out = mark.crop((x0, y0, x1, y1))

# Normalize to square canvas with transparent padding
side = max(out.width, out.height)
canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
ox = (side - out.width) // 2
oy = (side - out.height) // 2
canvas.paste(out, (ox, oy), out)

paths = [
    Path(r'H:\crm\crm-web\public\assets\countable-logo-mark.png'),
    Path(r'H:\crm\crm-web\src\assets\countable-logo-mark.png'),
]
for p in paths:
    p.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(p, 'PNG')
    print('saved', p, canvas.size)
