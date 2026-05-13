from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

print("Converting solid SVG to PNG...")
drawing = svg2rlg("frontend/public/favicon.svg")
renderPM.drawToFile(drawing, "frontend/public/apple-touch-icon.png", fmt="PNG")
print("Done!")
