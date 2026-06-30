assets/
=======

The Buddha on the altar lives here as:

    buddha.webp

… and it is the Buddha on the altar (the halo, light rays, and lotus
throne around it stay). There is NO drawn-SVG fallback anymore: while
this file loads (or if it is missing/404) a spinner stays in its place
until it is available.

REQUIREMENTS
------------
* Transparent background (alpha channel). A JPEG or any image with a
  solid background will show that background on the altar.
* Seated / meditating pose, front-facing, looks best.
* ~900px wide is plenty (the altar tops out around 450px wide, so
  larger files just waste bandwidth).

FORMAT / WEIGHT
---------------
* WebP (with alpha) is used — it is far smaller than PNG for the same
  look (~110 KB vs several MB for a full-resolution PNG).
* To regenerate from a source PNG, with Pillow installed:

      python -c "from PIL import Image; \
      im=Image.open('SOURCE.png'); \
      w=900; im.resize((w, round(w*im.height/im.width)), Image.LANCZOS)\
      .save('buddha.webp', format='WEBP', quality=88, method=6)"

HOW TO GET A TRANSPARENT BUDDHA
-------------------------------
* Download one directly (opens fine in a real browser, just not via
  script): https://www.cleanpng.com/png-golden-buddha-gautama-buddha-little-buddha-buddhis-1bx8ze/
* Or take ANY Buddha photo and remove the background at
  https://www.remove.bg/  (free, gives a clean transparent image).

POSITIONING
-----------
If the photo sits too high/low or is the wrong size, tweak the
<image class="b-photo"> box in index.html:

    <image class="b-photo" href="assets/buddha.webp"
           x="60" y="45" width="300" height="445"
           preserveAspectRatio="xMidYMax meet" />

  * width / height  -> overall size of the figure
  * y               -> vertical position (larger = lower)
  * x + width       -> horizontal centering (center is x + width/2 = 210)
