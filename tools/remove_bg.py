from PIL import Image
import math

SRC = 'Logo.jpeg'
DST = 'images/logo_clean.png'

def average_color(pixels):
    r = sum([p[0] for p in pixels]) / len(pixels)
    g = sum([p[1] for p in pixels]) / len(pixels)
    b = sum([p[2] for p in pixels]) / len(pixels)
    return (r,g,b)

def sample_edges(img, sample_size=10):
    w,h = img.size
    px = img.load()
    samples = []
    for x in range(sample_size):
        for y in range(sample_size):
            samples.append(px[x,y])
            samples.append(px[w-1-x,y])
            samples.append(px[x,h-1-y])
            samples.append(px[w-1-x,h-1-y])
    return samples

def color_distance(c1, c2):
    return math.sqrt(sum((c1[i]-c2[i])**2 for i in range(3)))

def main():
    img = Image.open(SRC).convert('RGBA')
    rgb = img.convert('RGB')
    w,h = img.size

    # Sample edges to estimate background color
    edge_samples = sample_edges(rgb, sample_size=max(6, min(w,h)//20))
    bg = average_color(edge_samples)

    # Threshold (tuneable)
    fuzz = 80.0

    pixels = img.load()
    for y in range(h):
        for x in range(w):
            r,g,b,a = pixels[x,y]
            d = color_distance((r,g,b), bg)
            if d < fuzz:
                pixels[x,y] = (r,g,b,0)

    img.save(DST)
    print('Saved:', DST)

if __name__ == '__main__':
    main()
