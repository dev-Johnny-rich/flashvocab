#!/usr/bin/env python3
"""生成 PWA 图标：深墨圆角底 + 白色「词」字 (宋体)"""
from PIL import Image, ImageDraw, ImageFont

FONT = "/System/Library/Fonts/Supplemental/Songti.ttc"
OUT = "/Users/johnny/vocab/web/public/icons"
BG = (26, 26, 24, 255)      # #1a1a18
FG = (253, 253, 251, 255)   # #fdfdfb

import os
os.makedirs(OUT, exist_ok=True)


def make(size: int, path: str) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 圆角矩形底（radius ≈ 22%）
    r = int(size * 0.22)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG)
    # 白色「词」字居中
    font = ImageFont.truetype(FONT, int(size * 0.56), index=0)
    bbox = d.textbbox((0, 0), "词", font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1]
    d.text((x, y), "词", font=font, fill=FG)
    img.save(path)
    print(f"生成 {path} ({size}x{size})")


make(512, f"{OUT}/icon-512.png")
make(192, f"{OUT}/icon-192.png")
make(180, f"{OUT}/apple-touch-icon.png")
