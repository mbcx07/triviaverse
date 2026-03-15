from PIL import Image, ImageOps
from pathlib import Path

SRC = Path(r"C:\Users\Administrator\.openclaw\media\inbound\file_31---925d45b2-fa74-4267-b423-fafe933d026e.jpg")
OUT_DIR = Path(r"C:\Users\Administrator\.openclaw\workspace\triviaverse\web\public")

OUT_DIR.mkdir(parents=True, exist_ok=True)

img = Image.open(SRC).convert('RGBA')

# Create square icons (contain) with padding for maskable safety

def make(size: int, name: str, pad_ratio: float = 0.12):
    canvas = Image.new('RGBA', (size, size), (11, 18, 32, 255))  # match app bg-ish
    inner = int(size * (1 - 2 * pad_ratio))
    contained = ImageOps.contain(img, (inner, inner), method=Image.Resampling.LANCZOS)
    x = (size - contained.width) // 2
    y = (size - contained.height) // 2
    canvas.alpha_composite(contained, (x, y))
    canvas.save(OUT_DIR / name, format='PNG', optimize=True)

make(192, 'pwa-192x192.png')
make(512, 'pwa-512x512.png')

# simple favicon (64x64)
make(64, 'favicon.png', pad_ratio=0.18)

print('Wrote icons to', OUT_DIR)
