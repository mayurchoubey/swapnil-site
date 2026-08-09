# Coach Swapnil — website

Static marketing site for **Coach Swapnil**, certified fitness trainer, built on the
Marcus Reid design system from claude.ai/design
(`9788e912-baaa-44a5-9261-af7a716ce6ad` — the design project's own branding was a
placeholder persona; the content here is Swapnil's).

No build step, no dependencies, no framework.

```bash
python3 -m http.server 4321
```

## One page

The whole site is `index.html` — a single long-scroll page. Nav links are in-page
anchors, so there is no routing, no duplicate nav/footer markup, and no cross-page
cache to think about.

| Anchor | Section |
| --- | --- |
| `#top` | Hero |
| `#programs` | The three programs, as cards |
| `#group-batch` `#personal` `#duo` | Each program in detail, with pricing |
| `#fees` | Both full fee tables |
| `#about` | Bio, principles, credentials |
| `#faq` | Eight questions |
| `#enquire` | WhatsApp message composer |

Sections carry `scroll-margin-top: 104px` so an anchor jump lands the heading clear of
the fixed nav rather than under it. A scroll-spy in `site.js` marks the current section's
nav link with `aria-current="page"` — the same attribute the nav already styles with the
ember underline. On mobile, tapping any in-page link closes the drawer.

The enquiry **dialog was removed** in the single-page rewrite. It existed because the
form used to live on another page; now the form is one scroll away, so a modal would
just duplicate the same fields in two places. The nav CTA scrolls to `#enquire`.

## Real content on the site

Taken from Swapnil's own WhatsApp brief:

- **Trainer:** Swapnil, fitness coach, 20+ years, hundreds of clients trained
- **Group batch:** 4–6 members, 50-minute sessions, 3 or 5 days/week
- **Formats:** HIIT, flexibility, core, Mat Pilates, cardio & functional
- **Credentials:** ISSA Certified Fitness Trainer · PIA Certified Pilates Mat &
  Foundations Teacher · Talwalkars Fitness Academy Certified · BFY Diet Certified
- **Group fees:** ₹4,000/mo (3 d/w) · ₹6,500/mo (5 d/w) · ₹10,500 quarterly (≈₹3,500/mo)
  · ₹17,000 quarterly (≈₹5,667/mo)
- **Personal fees:** ₹8,000/mo (3 d/w) · ₹13,500/mo (5 d/w) · 2-person ₹6,000 and
  ₹10,000 per person
- **Contact:** WhatsApp 9977221799, enquiries only
- **Where:** home or gym

## WhatsApp is the conversion path

There is no backend and no email address, so nothing pretends to submit. Every CTA and
the enquiry form compose a prefilled message and hand off to `wa.me`:

```
Hi Swapnil, I'm <name>.
Interested in: <program>
Days per week: <days>
Experience: <experience>

<notes>
```

The number lives in one place — `WA_NUMBER` in [js/site.js](js/site.js). Change it there
and in the `wa.me` links in the HTML if it ever moves.

With JavaScript off the form cannot compose a message, so a plain
"Message 99772 21799 directly" link sits immediately beneath the submit button, and
every other CTA on the page is already a bare `wa.me` link.

## Still needed before launch

1. **A domain — this now blocks the share card.** Five places carry
   `REPLACE-WITH-YOUR-DOMAIN`: `og:url`, `og:image`, `twitter:image`,
   `robots.txt` and `sitemap.xml`. Find them with
   `grep -rn REPLACE-WITH-YOUR-DOMAIN`. **`og:image` must be an absolute URL** —
   WhatsApp, Facebook and LinkedIn scrapers do not reliably resolve relative
   paths, so the preview card stays blank until this is done.
3. **A portrait of Swapnil for `#about`.** The hero has him; the About section still
   uses studio atmosphere. Swap the `<img>` there.
4. **Confirm the hero likeness with Swapnil.** It is his real photograph relit by AI
   (see the imagery note below). He should agree it reads as him.
5. **No testimonials.** The earlier placeholders were invented and were removed. Add
   real ones only with client permission.
6. **Surname / wordmark.** The lockup reads "Coach *Swapnil*". A surname would sit
   well in it — change `.wordmark__name` and `.hero__watermark`.
7. **A 404 page.** For a single-page site, the simplest correct answer is a host
   redirect of everything to `/`.

### The share card

`assets/og-image.jpg` (1200×630, 77 KB) is rendered from `og-template.html`, not
composited by hand — the template pulls in the site's own stylesheets, so the card uses
the real brand fonts and tokens and cannot drift from the page. To regenerate after a
copy or price change:

```bash
python3 -m http.server 4321 &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --force-device-scale-factor=2 --virtual-time-budget=6000 --window-size=1200,630 \
  --screenshot=/tmp/og-raw.png http://localhost:4321/og-template.html
magick /tmp/og-raw.png -resize 1200x630 -strip -interlace Plane -quality 86 assets/og-image.jpg
```

Rendering at 2× then downsampling is what keeps the type crisp. Keep the file under
about 300 KB or WhatsApp may decline to show a preview at all. `og-template.html` is
`Disallow`ed in robots.txt — it is a source file, not a page.

## Slot sizes

| Slot | Ratio | Suggested export |
| --- | --- | --- |
| Hero (`.hero__photo`) | free, edge-feathered | 1200×1400, cut-out PNG ideal |
| About / split sections | 4:5 | 800×1000 |
| Program row | 1:1 | 600×600 |

## Structure

```
index.html            the entire site
css/
  styles.css          entry point — @imports fonts + the five token files
  fonts.css           self-hosted @font-face declarations
  tokens/             colors, typography, spacing, effects, base
  components.css      design-system components as CSS classes
  layout.css          page chrome and section compositions
js/
  site.js             all behavior, no dependencies
fonts/                Archivo + Newsreader woff2, latin & latin-ext
assets/               images and icons
robots.txt            EDIT ON LAUNCH — carries the sitemap URL
sitemap.xml           EDIT ON LAUNCH — needs the real absolute domain
site.webmanifest      name, theme colour, icons
_headers              cache + security headers for Cloudflare Pages / Netlify
```

## Deploying

Static, no build step. **Cloudflare Pages** is the recommendation — free, works with a
private repo, auto-deploys on push, and has the strongest Indian edge presence, which
is where the audience is.

```
Workers & Pages → Create → Pages → Connect to Git → mayurchoubey/swapnil-site
  Build command:     (leave empty)
  Output directory:  /
```

Netlify is equivalent. GitHub Pages will not serve a private repo without a paid plan.

Every path in the site is relative, so it runs from a domain root or a subpath
unchanged.

**Two files must be edited the moment a domain exists:** `robots.txt` and `sitemap.xml`
both contain `REPLACE-WITH-YOUR-DOMAIN`. Sitemaps require absolute URLs, so neither can
be domain-agnostic.

`_headers` pins `/css`, `/js`, `/fonts` and `/assets` for a year as `immutable`, which is
only safe because of the `?v=` fingerprint — the document itself is set to revalidate
every time, so a version bump always reaches people.

### Fonts are self-hosted

`fonts/` holds Archivo and Newsreader as variable woff2, latin and latin-ext, pulled
from Google Fonts and served from the same origin. That removes a DNS lookup, a TLS
handshake and a round trip to a third party before any text can render — worth real
milliseconds on Indian mobile. Verified: the page makes **zero third-party requests**.

latin-ext is not optional: it is the subset carrying **₹**, which the fee tables are
full of. Google's own `unicode-range` declarations are preserved, so browsers still
fetch only the subsets a view actually needs. Archivo italic is deliberately absent —
nothing uses it; all three italic rules are Newsreader.

The two latin faces are `<link rel="preload">`ed, because they sit three `@import`s deep
and would otherwise not be discovered until the whole CSS chain resolves.

Asset links carry `?v=19`, in the `<link>`/`<script>` tags **and** in the `@import`s
inside `styles.css`. **Bump both on every deploy** — `python3 -m http.server` sends
no cache-busting headers, and stale CSS/JS caused real confusion during the build.

### Design system fidelity

`css/tokens/*` are ported verbatim from the design project, so palette, type scale,
spacing ramp, easing and shadows stay in sync. Additions are marked `Site extension`
rather than editing token values. `components.css` translates each `.jsx` component to
CSS classes at the same values.

Deliberate departures from the kit, all for reasons:

- **Responsive.** The kit is desktop-only (`min-width: 1280px`); breakpoints added at
  1080/900/640/520.
- **Two typefaces, not one.** The kit sets body copy in Archivo, the same grotesque as
  the display type. That reads flat over more than a line or two. Running text is now
  **Newsreader** — a variable serif built for long-form screen reading, with real
  optical sizing and enough stroke weight to survive white-on-black. The split is:
  *serif for sentences a visitor reads* (prose, ledes, card descriptions, FAQ answers,
  bios); *Archivo for everything they scan* (headings, buttons, nav, eyebrows, badges,
  stat figures, prices, fee tables). Prose sits at weight **420**, not 400 — the global
  `-webkit-font-smoothing: antialiased` thins light-on-dark text, and a serif loses more
  to it than a grotesque.
- **Button contrast.** Hover deepens the ember fill instead of brightening it. The kit's
  `filter: brightness(1.12)` lightened the fill while the white label had nowhere
  brighter to go, so hovering *reduced* contrast to 2.9–3.5:1. Buttons also use a
  deepened cut of the ember ramp at rest (4.65:1 at its lightest vs 3.11:1). The
  `--ember-grad` token is untouched, so large fills keep the original brand ramp.
- **Arrow micro-motion.** The `→` slides 3px on hover, on the kit's own `--ease-liquid`.
- **A logo mark.** The kit says "no logo was provided… do not draw a mark", which was
  guidance for a placeholder persona. The wordmark is now a lockup: an ember monogram
  tile with a debossed barbell behind the letter, beside a two-line COACH / SWAPNIL.
  Built entirely from CSS and type — no image asset, so it stays crisp at any size and
  re-themes with the palette. `assets/favicon-*.png` are rasterised from the same mark.

### A CSS comment that ate a rule

`components.css` opened with a header comment containing `(components/**/*.jsx)`. The
`**/` inside it **closes a CSS comment early**; the parser then treats the remaining
comment text plus the next selector as one invalid selector and drops that whole rule.
The rule immediately after that comment was `.wordmark` — so the wordmark had *never*
been styled, which is why the logo looked like unstyled text. Do not put glob stars in
CSS comments.

### About the imagery in `assets/`

All five images are **AI-generated (Higgsfield, `soul_2`)**, and all five are deliberately
**empty of people**:

| File | Where | Subject |
| --- | --- | --- |
| `hero-studio.webp` | Hero backdrop | Empty studio interior |
| `program-group.webp` | `#group-batch` | Six kettlebells in a row |
| `program-personal.webp` | `#personal` | A single dumbbell |
| `program-duo.webp` | `#duo` | Two kettlebells |
| `studio-corner.webp` | `#about` | Bench and towel in a studio corner |

The object count matches the program size — six for the batch, two for 2-person, one for
1-on-1 — which is why they read as a set.

**No people, on purpose.** Swapnil is a real trainer. A generated face in the hero would
be a stranger presented as him, and a generated group would be strangers presented as his
clients. Equipment and atmosphere carry the mood without claiming anything untrue. An
earlier AI portrait built for the placeholder persona has been deleted.

If you want people in these images, that is your call to make — but the honest versions
are a real photograph of Swapnil, or stock clearly used as illustration. Say the word and
I will generate a people-based set instead.

Watch for **fake branding** on any regeneration: the model repeatedly put real trademarks
(a Nike swoosh, a Puma cat) and garbled lettering on equipment and clothing. Two of these
five had to be regenerated for exactly that. Check before shipping.### Dropping in real photos

**Use a nested `<img>`, not the `--photo` custom property.** A relative `url()` inside a
custom property resolves against *the stylesheet that consumes it*, not the document —
so `--photo:url('assets/x.webp')` set inline in the HTML resolves to `/css/assets/x.webp`
and 404s. That bit this build. `--photo` only works with a root-relative (`/assets/...`)
or absolute URL.

The `<img>` route is better anyway — it carries alt text, `srcset` and `loading="lazy"`,
and search engines index it:

```html
<div class="plate">
  <img src="assets/whatever.webp" alt="" loading="lazy" width="900" height="900">
</div>
```

The ember grade (`::before`) and film grain (`::after`) composite on top either way, so
any photograph lands on-brand without editing it first.

The hero backdrop is different — it is a CSS `background-image` on `.hero`, blended into
the ember gradient with `background-blend-mode: soft-light`. Grading lives in CSS, not
in the asset, so re-grading is a token change rather than a re-export.


