from PIL import Image, ImageDraw
from pathlib import Path

qa = Path("/Users/tmkaliyu/Documents/ChatGPT/MAKH Trading/.fsd_qa.sEFM2l")
pages = sorted(qa.glob("page-*.png"), key=lambda p: int(p.stem.split("-")[1]))
for batch_idx in range(0, len(pages), 4):
    batch = pages[batch_idx:batch_idx+4]
    thumbs = []
    for p in batch:
        im = Image.open(p).convert("RGB")
        im.thumbnail((640, 830))
        canvas = Image.new("RGB", (680, 890), "white")
        canvas.paste(im, ((680-im.width)//2, 36))
        ImageDraw.Draw(canvas).text((20, 10), p.stem, fill="black")
        thumbs.append(canvas)
    sheet = Image.new("RGB", (1360, 1780), "#D8D8D8")
    for i, im in enumerate(thumbs):
        sheet.paste(im, ((i%2)*680, (i//2)*890))
    sheet.save(qa / f"contact-{batch_idx//4+1}.png")
