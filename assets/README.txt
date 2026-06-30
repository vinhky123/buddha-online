assets/
=======

Drop a TRANSPARENT Buddha image here as:

    buddha.png

… and it will automatically replace the hand-drawn Buddha on the altar
(the halo, light rays, and lotus throne stay). The drawn Buddha remains
as a fallback until this file exists.

REQUIREMENTS
------------
* Must be PNG with a transparent background (alpha). A JPEG or any
  image with a solid background will show that background on the altar.
* Seated / meditating pose, front-facing, looks best.
* ~800–1000px wide is plenty (the altar tops out around 450px wide,
  so larger files just waste bandwidth).

HOW TO GET A TRANSPARENT BUDDHA
-------------------------------
* Download one directly (opens fine in a real browser, just not via
  script): https://www.cleanpng.com/png-golden-buddha-gautama-buddha-little-buddha-buddhis-1bx8ze/
* Or take ANY Buddha photo and remove the background at
  https://www.remove.bg/  (free, gives a clean transparent PNG).

POSITIONING
-----------
If the photo sits too high/low or is the wrong size, tweak the
<image class="b-photo"> box in index.html:

    <image class="b-photo" href="assets/buddha.png"
           x="60" y="45" width="300" height="445"
           preserveAspectRatio="xMidYMax meet" />

  * width / height  -> overall size of the figure
  * y               -> vertical position (larger = lower)
  * x + width       -> horizontal centering (center is x + width/2 = 210)
