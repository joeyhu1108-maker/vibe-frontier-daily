# Handwriting web fonts

- Caveat variable (400–700): https://github.com/google/fonts/tree/main/ofl/caveat — retrieved 2026-10-19. Used for handwritten Latin and numerals, subset to U+0020–024F and optically scaled to match Chinese.
- LXGW Marker Gothic Regular: https://github.com/lxgw/LxgwMarkerGothic — upstream `fonts/gf/LXGWMarkerGothic-Regular.ttf`, retrieved 2026-10-19. Used for display headings.
- LXGW WenKai Lite Regular / Medium v1.530: https://github.com/lxgw/LxgwWenKai-Lite/releases/tag/v1.530 — used for reading text and controls.

The original TTF files were subsetted to WOFF2 with FontTools 4.60.2 for web delivery only: GB2312 common Chinese, Latin U+0020–024F, and every codepoint used in the site's HTML, JSON and JavaScript at publication. Glyph outlines were not redrawn. Rare characters outside the subsets fall back to the handwritten reading face and then system Kai / cursive. Future issues should check new characters against the bundled fonts and regenerate if needed.

The complete upstream SIL OFL licenses accompany the files. These fonts retain their own OFL terms, independent of the site's learning-download agreement.
