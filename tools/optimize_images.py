from PIL import Image
import os

SRC = 'images/logo_clean.png'
OUT_DIR = 'images'

def ensure_dir(p):
    os.makedirs(p, exist_ok=True)

def save_webp(img, path, quality=80):
    img.save(path, 'WEBP', quality=quality, method=6)

def main():
    ensure_dir(OUT_DIR)
    img = Image.open(SRC).convert('RGBA')
    w,h = img.size

    # Save optimized PNG (lossless but with optimization)
    png_opt = os.path.join(OUT_DIR, 'logo_clean_opt.png')
    img.save(png_opt, optimize=True)
    print('Saved', png_opt)

    # Save 2x PNG (larger for high-res displays)
    img2 = img.resize((w*2, h*2), Image.LANCZOS)
    png_2x = os.path.join(OUT_DIR, 'logo_clean@2x.png')
    img2.save(png_2x, optimize=True)
    print('Saved', png_2x)

    # Save WebP versions
    webp1 = os.path.join(OUT_DIR, 'logo_clean.webp')
    save_webp(img, webp1, quality=80)
    print('Saved', webp1)

    webp2 = os.path.join(OUT_DIR, 'logo_clean@2x.webp')
    save_webp(img2, webp2, quality=80)
    print('Saved', webp2)

if __name__ == '__main__':
    main()
