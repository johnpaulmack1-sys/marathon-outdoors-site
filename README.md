# Marathon Outdoors website

Desktop layout v1 for Tom Nobles' hardscaping and outdoor lighting business.
It's a plain HTML/CSS/JS site, ready for GitHub Pages.

## Files

```
index.html          the home page (all sections)
css/styles.css      all styling
js/main.js          header scroll effect + hero slideshow
assets/fonts/       HiJO Black (titles), Antonio Bold (subtitles/labels), Satoshi (body)
assets/img/         logo.png (transparent background), logo.webp (original); add project photos here
```

## Page sections (top to bottom, about 6–7 screens on desktop)

1. **Hero:** photo slideshow under a 45% black overlay, black panel with the logo and "ELEVATED OUTDOOR LIVING"
2. **Services:** Hardscapes and Outdoor Lighting cards
3. **The Open-Graded Method:** animated cross-sections (traditional base vs. Marathon's open-graded base) and three benefits
4. **Reviews:** 5.0 Google rating and three review cards (paste real reviews in)
5. **Projects:** staggered photo tiles
6. **Meet the Owner:** Tom's photo and story
7. **Request a Quote:** call to action, then the footer

Nav: Projects · Services · Reviews · Meet the Owner · Request a Quote

## Animations

- Hero text slides up on load; hero photos drift slower than the page (parallax).
- Anything with the `reveal` class fades up when it scrolls into view. `style="--d:1"` adds a short delay so items in a row come in one after another.
- The method diagram starts its rain animation when it's on screen: water drains through the open-graded stone and pools in the traditional base while two pavers shift.
- All motion turns off for visitors who set "reduce motion" on their device.

## Swapping in real photos

Hero slides: put a photo in `assets/img/`, then in `index.html` change

```html
<div class="slide placeholder is-active" style="--img:none">
  <span class="ph-label">Hero photo 1 · patio at dusk</span>
</div>
```

to

```html
<div class="slide is-active" style="--img:url('assets/img/hero-1.jpg')"></div>
```

Do the same for any `.photo placeholder` box: remove `placeholder`, add
`style="--img:url('assets/img/your-photo.jpg')"`, and delete the `ph-label` span.

## Notes

- Fonts: HiJO Black for all titles, Antonio Bold for subtitles, labels, nav and buttons, Satoshi for body text (free, Fontshare license).
  HiJO has no curly apostrophe, "·", "©" or dashes; the browser draws those in Antonio automatically.
- Placeholder contact info (555 number, example.com email) is for the class demo.

## Photos

Project photos, Tom's family photo and his Olympic Trials bib load from Marathon Outdoors' current Squarespace site (images.squarespace-cdn.com). If that site is ever taken down, download the photos into `assets/img/` and change each `--img:url(...)` / `src` to the local file.

Accent color: `#8ab8fe`, the blue from the logo's square.

## Quote estimator

Every "Request a Quote" / "Get an Estimate" button has a `data-quote` attribute, which opens the estimator pop-up (`<dialog id="quote-dialog">` at the bottom of `index.html`).

- `js/pricing.js` holds **all the prices** (sample numbers for now). Tom can edit this one file without touching the logic.
  - Set `demoPricing: false` when real prices are in.
  - Put the Formspree URL in `formEndpoint` so requests are emailed to Tom.
  - Put the Stripe Payment Link in `stripePaymentLink` for the $150 consultation.
- `js/estimator.js` holds the steps: project type → sizes → material → yard → ZIP/timeline → **estimate** → "Does this work for your budget?"
  - **Yes** → contact info → pay $150 → done
  - **Close** → ways to lower the price (cheaper material, smaller size, phases) → contact → pay
  - **No** → budget question → send info to Tom with no fee, or start over smaller
- Styles are in `css/styles.css` under "QUOTE ESTIMATOR". It goes full screen on phones.
