# Asset Manifest — Pear Website Recreation

**Source of Truth:** `references/pear-reference.MP4` (19.04s, 30fps, 576×1024, vertical 9:16)
**Implementation References:** Saved HTML/CSS/JS from pear.no, downloaded fonts, videos, posters

---

## 🎬 Reference Video — Scene Breakdown (Authoritative Spec)

| Scene | Time | Duration | Visual Content | Scroll Progress |
|-------|------|----------|----------------|-----------------|
| 1. Classical Figure | 0.0–2.5s | 2.5s | Renaissance portrait emerging from shadow, warm tones | 0–13% |
| 2. Cream Fabric | 2.5–4.0s | 1.5s | Flowing cream/beige fabric folds filling frame | 13–21% |
| 3. Red & Cream Fabric | 4.0–5.5s | 1.5s | Red and cream fabric intertwining, high texture | 21–29% |
| 4. Orchard & Pear Branches | 5.5–7.5s | 2.0s | Pear branches with fruit, dappled orchard light | 29–39% |
| 5. Hands & Fruit Closeup | 7.5–9.0s | 1.5s | Hands cradling/breaking ripe pear, intimate scale | 39–47% |
| 6. Blue Fabric Entry | 9.0–11.0s | 2.0s | **First cobalt blue** — color bleed into warm tones | 47–58% |
| 7. Portrait in Fabric | 11.0–12.0s | 1.0s | Classical figure draped in flowing blue/cream fabric | 58–63% |
| 8. Orchard Return | 12.0–14.0s | 2.0s | Cyclic return to orchard foliage, dappled light | 63–74% |
| 9. Final Blue Shift | 14.0–15.5s | 1.5s | Fabric settles into solid cobalt field | 74–82% |
| 10. Cobalt Hold + Typography | 15.5–19.0s | 3.5s | **Solid cobalt (#0C0D19)**, centered mark + text | 82–100% |

**Key Visual Language:**
- Saturated cobalt blue (#0C0D19) as brand anchor
- Renaissance/classical portraiture style
- Flowing fabric as primary transition mechanism
- Organic pear/orchard imagery as recurring motif
- Intimate close-ups (hands, fruit texture)
- Restrained, elegant typography on cobalt
- Cinematic vertical framing (9:16)

---

## 📦 Recovered Assets — From pear.no (Implementation References)

### Fonts ✅ All Recovered
| File | Path | Weight | Use |
|------|------|--------|-----|
| FlechaS-Light.woff2 | `/fonts/FlechaS-Light.woff2` | 300 | Display/headlines |
| FlechaS-Regular.woff2 | `/fonts/FlechaS-Regular.woff2` | 400 | Display/headlines |
| FlechaL-Light.woff2 | `/fonts/FlechaL-Light.woff2` | 300 | Large display |
| FlechaL-Regular.woff2 | `/fonts/FlechaL-Regular.woff2` | 400 | Large display |
| FlechaM-Light.woff2 | `/fonts/FlechaM-Light.woff2` | 300 | Medium display |
| FlechaM-Regular.woff2 | `/fonts/FlechaM-Regular.woff2` | 400 | Medium display |
| GTStandardL-Regular.woff2 | `/fonts/GTStandardL-Regular.woff2` | 400 | Body/UI text |
| GTStandardL-Medium.woff2 | `/fonts/GTStandardL-Medium.woff2` | 500 | Body emphasis |
| GTStandardMono-Regular.woff2 | `/fonts/GTStandardMono-Regular.woff2` | 400 | Code/mono labels |

### Videos ✅ All Recovered (from `/films/`)
| File | Size | Duration | Scene Mapping |
|------|------|----------|---------------|
| reveal.mp4 | 13.1 MB | ~? | Hero/reveal sequence |
| footer-loop.mp4 | 7.2 MB | ~? | Footer ambient loop |
| flysky.mp4 | ? | ? | Sky/fabric transition |
| trans.mp4 | ? | ? | Transition sequence |
| plan.mp4 | ? | ? | Planning/strategy scene |
| coda.mp4 | ? | ? | Closing/coda scene |
| tree.mp4 | ? | ? | Orchard/tree scene |
| signal.mp4 | ? | ? | Signal/connection scene |
| colossus.mp4 | ? | ? | Large-scale/hero scene |

### Posters/Images ✅ Recovered
| File | Path | Use |
|------|------|-----|
| signal-poster.jpg | `/films/signal-poster.jpg` | Signal scene poster |
| colossus-poster.jpg | `/films/colossus-poster.jpg` | Colossus scene poster |
| reveal-poster.jpg | `/films/reveal-poster.jpg` | Reveal scene poster |
| og.jpg | `/og.jpg` | Open Graph image |
| favicon.svg | `/favicon.svg` | Favicon |
| favicon-32.png | `/favicon-32.png` | Favicon 32px |
| apple-touch-icon.png | `/apple-touch-icon.png` | Apple touch icon |

### Reference Video Frames ✅ Extracted
| Frames | Path Pattern | Count | Use |
|--------|--------------|-------|-----|
| 0.0s–19.0s @ 0.5s | `/assets/pear-reference/frame_XXX_tX.Xs.png` | 39 | Scene reference, potential fallbacks |

---

## ⚠️ Unavailable / 404 Assets

| Asset | Expected Path | Status | Notes |
|-------|---------------|--------|-------|
| Model manifests | `/films/model/{signal,colossus,reveal,flysky,trans,plan,coda,tree}/manifest.json` | **404 HTML** | Return error pages, not JSON. Image sequences not publicly accessible. |
| Model frame sequences | `/films/model/{name}/{type}/f_{NNN}.webp` | **Unknown** | Referenced in JS but manifests unavailable. May not exist publicly. |
| SVG logo/mark | Not found as separate file | **Missing** | Embedded inline in HTML as `<svg class="sg-svg">` with path data |

---

## 🎯 Scene-to-Asset Mapping (Video → Implementation)

| Video Scene | Primary Asset | Fallback / Technique |
|-------------|---------------|---------------------|
| 1. Classical Figure | `reveal.mp4` (hero) / extracted frames | CSS keyframe animation on frames |
| 2. Cream Fabric | `flysky.mp4` / `trans.mp4` | Video texture on canvas |
| 3. Red & Cream Fabric | `trans.mp4` / extracted frames | Video + blend modes |
| 4. Orchard Branches | `tree.mp4` / `plan.mp4` | Video loop |
| 5. Hands & Fruit | `reveal.mp4` frames / extracted | Frame animation |
| 6. Blue Fabric Entry | `signal.mp4` / `flysky.mp4` | Color transition via canvas shader |
| 7. Portrait in Fabric | `colossus.mp4` / extracted | Video + displacement |
| 8. Orchard Return | `tree.mp4` / `plan.mp4` | Video loop (reversed?) |
| 9. Final Blue Shift | `coda.mp4` / shader | Canvas color drain |
| 10. Cobalt Typography | **Generated** (SVG mark + CSS text) | Native CSS/Canvas text |

---

## 🔧 Implementation Strategy

### Core Architecture
- **Next.js 14** (App Router, static export)
- **Single-page scroll experience** — map 19s video → ~300vh scroll
- **Pinned canvas/WebGL** for fluid transitions (matching pear.no `.pin` pattern)
- **GSAP ScrollTrigger** or native `IntersectionObserver` for scroll progress
- **Canvas 2D/WebGL** for fabric displacement, color bleeds, shader effects

### Scene Implementation Priority
1. **Cobalt finale (Scene 10)** — Static, typography-driven, easiest to perfect first
2. **Fabric transitions (Scenes 2, 3, 6, 9)** — Core visual language, need canvas shaders
3. **Orchard/Branches (Scenes 4, 8)** — Video loops with scroll-speed control
4. **Classical figure/Portrait (Scenes 1, 7)** — Video + displacement maps
5. **Hands/Fruit closeup (Scene 5)** — Frame-accurate animation

### Color System (from video analysis + CSS vars)
```css
--cobalt-deep: #0C0D19;      /* Final bg */
--cobalt-mid: #11121E;       /* Corners */
--cobalt-accent: #26273F;    /* Content midtones */
--warm-sand: #877469;        /* Fabric highlights */
--ochre: #A07858;            /* Pear fruit */
--sage: #7F8C78;             /* Foliage */
--cream: #F5E6D3;            /* Light fabric */
--terracotta: #C4745E;       /* Red fabric */
```

### Typography (from reference CSS)
- **Display:** Flecha M/L/S (Light 300, Regular 400) — `letter-spacing: -0.018em to -0.024em`
- **Body/UI:** GT Standard L (Regular 400, Medium 500)
- **Mono/Labels:** GT Standard Mono / Flecha — `letter-spacing: 0.2em`, `text-transform: uppercase`
- **Line heights:** Display ~1.04–1.12, Body ~1.5–1.625

---

## ✅ Next Steps
1. Create `app/globals.css` with full design system (CSS vars, fonts, base styles)
2. Create `app/layout.tsx` with metadata, font preloads, root structure
3. Create `app/page.tsx` with scroll container, pinned canvas, 10 scene sections
4. Implement WebGL/Canvas renderer for fabric transitions
5. Wire scroll progress → scene progress → animation state
6. Test locally, compare frame-by-frame with reference video
7. Refine until indistinguishable at matching viewport sizes