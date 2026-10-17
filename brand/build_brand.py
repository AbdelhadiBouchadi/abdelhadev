"""Builds the Abdelhadev brand kit: sunset mark, outlined wordmark, lockups, favicons, OG image.

Run: python3 -I build_brand.py  (from the brand/ folder)
"""
import io
import json
import os
import shutil

import cairosvg
import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
BRICO = os.path.join(HERE, "src/package/files/bricolage-grotesque-latin-standard-normal.woff2")
INSTR = os.path.join(HERE, "src2/package/files/instrument-sans-latin-standard-normal.woff2")

PAPER = "#F7F0E8"
INK = "#2B1D1A"
GLOW = "#FFB48A"
NIGHT = "#1E1513"
MOON = "#F4E6D7"
MAJ = "#3D52D5"
MAJ_SOFT = "#AEB7F4"


def static_font(path, loc):
    vf = TTFont(path)
    inst = instancer.instantiateVariableFont(vf, loc)
    buf = io.BytesIO()
    inst.flavor = None
    inst.save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), data


def shape(font, data, text, tracking_em=0.0):
    """Return list of (glyphName, x, y) in font units and total advance."""
    face = hb.Face(data)
    hbf = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbf, buf, {"kern": True, "liga": True})
    upem = font["head"].unitsPerEm
    track = tracking_em * upem
    order = font.getGlyphOrder()
    out, x = [], 0.0
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        out.append((order[info.codepoint], x + pos.x_offset, pos.y_offset))
        x += pos.x_advance + (track if i < len(buf.glyph_infos) - 1 else 0)
    return out, x


def glyph_paths(font, glyphs, scale, ox, baseline):
    gs = font.getGlyphSet()
    paths = []
    for name, x, y in glyphs:
        pen = SVGPathPen(gs)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, ox + x * scale, baseline - y * scale))
        gs[name].draw(tpen)
        d = pen.getCommands()
        if d:
            paths.append(d)
    return paths


def bounds(font):
    return font["hhea"].ascent, font["hhea"].descent


# ---------------------------------------------------------------- fonts
brico, brico_data = static_font(BRICO, {"wght": 700, "wdth": 100, "opsz": 96})
brico_x, brico_x_data = static_font(BRICO, {"wght": 800, "wdth": 100, "opsz": 96})
instr, instr_data = static_font(INSTR, {"wght": 500, "wdth": 100})
UPEM = brico["head"].unitsPerEm
CAP = brico["OS/2"].sCapHeight or 700
XH = brico["OS/2"].sxHeight or 500


def wordmark(text="Abdelhadev", size=100, tracking=-0.03, font=brico, data=brico_data):
    glyphs, adv = shape(font, data, text, tracking)
    s = size / UPEM
    # tight box: cap height to baseline, with descender room (no descenders in "Abdelhadev")
    asc = max(CAP, font["OS/2"].sTypoAscender * 0.0 + CAP) * s
    pad = size * 0.02
    w = adv * s
    h = asc + pad * 2 + size * 0.02
    paths = glyph_paths(font, glyphs, s, 0, asc + pad)
    return paths, w, h, asc + pad


# ---------------------------------------------------------------- mark (viewBox 64)
SUN = "M13 35a19 19 0 0 1 38 0z"
HORIZON = '<rect x="6" y="38.5" width="52" height="5" rx="2.5"/>'
REFLECT = '<rect x="18" y="47.5" width="28" height="4.5" rx="2.25"/>'


def mark_svg(sun=GLOW, line=MAJ, reflect_opacity=0.55, size=None, title="Abdelhadev"):
    dims = f' width="{size}" height="{size}"' if size else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"{dims} role="img" aria-label="{title}">'
        f'<path d="{SUN}" fill="{sun}"/>'
        f'<g fill="{line}">{HORIZON}<g opacity="{reflect_opacity}">{REFLECT}</g></g>'
        "</svg>"
    )


def mark_animated_svg():
    """Layered mark for motion: the sun is a full disc clipped at the horizon so it can rise and set.
    Animate #sun-disc translateY (0 = risen, 20 = set), scaleX on #horizon and #reflection from the centre."""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Abdelhadev">'
        '<defs><clipPath id="above-horizon"><rect x="0" y="0" width="64" height="35"/></clipPath></defs>'
        f'<g id="sun" clip-path="url(#above-horizon)"><circle id="sun-disc" cx="32" cy="35" r="19" fill="{GLOW}"/></g>'
        f'<rect id="horizon" x="6" y="38.5" width="52" height="5" rx="2.5" fill="{MAJ}" style="transform-origin:32px 41px"/>'
        f'<rect id="reflection" x="18" y="47.5" width="28" height="4.5" rx="2.25" fill="{MAJ}" opacity=".55" style="transform-origin:32px 49.75px"/>'
        "</svg>"
    )


def wordmark_svg(fill=INK, size=100, ids=False):
    paths, w, h, _ = wordmark(size=size)
    body = "".join(
        f'<path{f" id=\"g{i}\"" if ids else ""} d="{d}"/>' for i, d in enumerate(paths)
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" role="img" aria-label="Abdelhadev">'
        f'<g fill="{fill}">{body}</g></svg>'
    ), w, h


def horizontal_svg(text_fill=INK, sun=GLOW, line=MAJ, size=100):
    paths, w, h, base = wordmark(size=size)
    m = size * 1.32  # mark box
    gap = size * 0.28
    cap_top = base - CAP * size / UPEM
    mark_y = (cap_top + base) / 2 - m * (33 / 64)  # centre the mark's drawing on the cap height
    total_w = m + gap + w
    top = min(0, mark_y)
    total_h = max(h, mark_y + m) - top
    body = "".join(f'<path d="{d}"/>' for d in paths)
    s = m / 64
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {top:.1f} {total_w:.1f} {total_h:.1f}" role="img" aria-label="Abdelhadev">'
        f'<g transform="translate(0 {mark_y:.2f}) scale({s:.4f})"><path d="{SUN}" fill="{sun}"/>'
        f'<g fill="{line}">{HORIZON}<g opacity=".55">{REFLECT}</g></g></g>'
        f'<g fill="{text_fill}" transform="translate({m + gap:.2f} 0)">{body}</g></svg>'
    )


def stacked_svg(text_fill=INK, size=100):
    paths, w, h, base = wordmark(size=size)
    m = size * 2.2
    total_w = max(w, m)
    body = "".join(f'<path d="{d}"/>' for d in paths)
    s = m / 64
    mx = (total_w - m) / 2
    ty = m * 0.98
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.1f} {ty + h:.1f}" role="img" aria-label="Abdelhadev">'
        f'<g transform="translate({mx:.2f} 0) scale({s:.4f})"><path d="{SUN}" fill="{GLOW}"/>'
        f'<g fill="{MAJ}">{HORIZON}<g opacity=".55">{REFLECT}</g></g></g>'
        f'<g fill="{text_fill}" transform="translate({(total_w - w) / 2:.2f} {ty:.2f})">{body}</g></svg>'
    )


def favicon_svg():
    """Adapts to the browser tab theme. Simplified for 16 px: no reflection, heavier horizon."""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        "<style>.bg{fill:%s}.sun{fill:%s}.line{fill:%s}"
        "@media (prefers-color-scheme:dark){.bg{fill:%s}.line{fill:%s}}</style>"
        '<rect class="bg" width="64" height="64" rx="15"/>'
        '<path class="sun" d="M11 38a21 21 0 0 1 42 0z"/>'
        '<rect class="line" x="8" y="41.5" width="48" height="7.5" rx="3.75"/>'
        "</svg>"
    ) % (PAPER, GLOW, MAJ, NIGHT, MAJ_SOFT)


def icon_svg(size, bg=PAPER, inset=0.0, radius=0.0, reflect=True):
    """Square icon with the mark centred; inset is the fraction of padding on each side."""
    s = (1 - inset * 2)
    off = size * inset
    k = size * s / 64
    refl = f'<g opacity=".55">{REFLECT}</g>' if reflect else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<rect width="{size}" height="{size}" rx="{radius}" fill="{bg}"/>'
        f'<g transform="translate({off:.2f} {off + size * s * 0.03:.2f}) scale({k:.4f})">'
        f'<path d="{SUN}" fill="{GLOW}"/><g fill="{MAJ}">{HORIZON}{refl}</g></g></svg>'
    )


def text_paths(text, size, x, y, font=instr, data=instr_data, tracking=0.0):
    glyphs, adv = shape(font, data, text, tracking)
    s = size / font["head"].unitsPerEm
    return glyph_paths(font, glyphs, s, x, y), adv * s


def og_svg():
    W, H = 1200, 630
    paths, w, h, base = wordmark(size=230)
    scale = min(1.0, (W - 160) / w)
    wx = (W - w * scale) / 2
    wy = 250
    word = "".join(f'<path d="{d}"/>' for d in paths)
    line1, l1w = text_paths("Full-stack developer in Agadir, Morocco", 34, 0, 0)
    line2, l2w = text_paths("Clinic software, hospital systems and AI web apps", 34, 0, 0)
    t1 = "".join(f'<path d="{d}"/>' for d in line1)
    t2 = "".join(f'<path d="{d}"/>' for d in line2)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'<defs><radialGradient id="sun" cx="50%" cy="100%" r="70%">'
        f'<stop offset="0" stop-color="#FFA470" stop-opacity=".85"/><stop offset=".45" stop-color="{GLOW}" stop-opacity=".45"/>'
        f'<stop offset="1" stop-color="{GLOW}" stop-opacity="0"/></radialGradient></defs>'
        f'<rect width="{W}" height="{H}" fill="{PAPER}"/><rect width="{W}" height="{H}" fill="url(#sun)"/>'
        f'<g transform="translate(80 70) scale(1.1)"><path d="{SUN}" fill="{GLOW}"/><g fill="{MAJ}">{HORIZON}<g opacity=".55">{REFLECT}</g></g></g>'
        f'<g fill="{INK}" transform="translate({wx:.1f} {wy:.1f}) scale({scale:.4f})">{word}</g>'
        f'<g fill="{INK}" opacity=".78" transform="translate({(W - l1w) / 2:.1f} {wy + h * scale + 70:.1f})">{t1}</g>'
        f'<g fill="{INK}" opacity=".78" transform="translate({(W - l2w) / 2:.1f} {wy + h * scale + 118:.1f})">{t2}</g>'
        "</svg>"
    )


def write(name, text):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(text)


def png(svg_text, name, w, h=None):
    cairosvg.svg2png(bytestring=svg_text.encode(), write_to=os.path.join(OUT, name), output_width=w, output_height=h or w)


if __name__ == "__main__":
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    os.makedirs(os.path.join(OUT, "favicons"))

    # marks
    write("logo-mark.svg", mark_svg())
    write("logo-mark-ink.svg", mark_svg(INK, INK))
    write("logo-mark-paper.svg", mark_svg(PAPER, PAPER))
    write("logo-mark-night.svg", mark_svg(GLOW, MAJ_SOFT))
    write("logo-mark-animated.svg", mark_animated_svg())

    # wordmarks
    for name, fill in [("wordmark-ink.svg", INK), ("wordmark-paper.svg", MOON), ("wordmark-glow.svg", GLOW)]:
        write(name, wordmark_svg(fill)[0])
    write("wordmark-animated.svg", wordmark_svg(INK, ids=True)[0])

    # lockups
    write("logo-horizontal.svg", horizontal_svg())
    write("logo-horizontal-night.svg", horizontal_svg(MOON, GLOW, MAJ_SOFT))
    write("logo-stacked.svg", stacked_svg())

    # favicons and app icons
    fav = favicon_svg()
    write("favicons/favicon.svg", fav)
    small = icon_svg(64, PAPER, 0.06, 15, reflect=False)
    for px in (16, 32, 48):
        png(small, f"favicons/favicon-{px}.png", px)
    imgs = [Image.open(os.path.join(OUT, f"favicons/favicon-{p}.png")).convert("RGBA") for p in (16, 32, 48)]
    imgs[2].save(os.path.join(OUT, "favicons/favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=imgs[:2])
    png(icon_svg(180, PAPER, 0.17, 0), "favicons/apple-touch-icon.png", 180)
    png(icon_svg(192, PAPER, 0.14, 0), "favicons/icon-192.png", 192)
    png(icon_svg(512, PAPER, 0.14, 0), "favicons/icon-512.png", 512)
    png(icon_svg(512, PAPER, 0.24, 0), "favicons/icon-maskable-512.png", 512)
    write("favicons/mask-icon.svg", mark_svg("#000000", "#000000", 1))
    write("favicons/site.webmanifest", json.dumps({
        "name": "Abdelhadev",
        "short_name": "Abdelhadev",
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
        "theme_color": PAPER,
        "background_color": PAPER,
        "display": "standalone",
    }, indent=2))

    # social card
    og = og_svg()
    write("og-image.svg", og)
    png(og, "og-image.png", 1200, 630)

    # previews of the lockups as PNG for quick viewing
    cairosvg.svg2png(bytestring=horizontal_svg().encode(), write_to=os.path.join(OUT, "preview-horizontal.png"), output_width=1200)
    cairosvg.svg2png(bytestring=stacked_svg().encode(), write_to=os.path.join(OUT, "preview-stacked.png"), output_width=600)
    print("done:", sorted(os.listdir(OUT)), sorted(os.listdir(os.path.join(OUT, "favicons"))))
