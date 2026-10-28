# Asset Manifest — Updated (Post-Cleanup)

**Date:** 2026-10-28  
**Project:** Pear Website Recreation  
**Reference:** https://pear.no/

---

## Production Assets (public/films/)

These are the ONLY assets used by the running application. All other copies exist in `research/` for archival purposes.

### Frame Sequences (WebGL Textures)

| Scene ID | Directory | Frames | Format | Resolution | Used By |
|----------|-----------|--------|--------|------------|---------|
| coda | `public/films/coda/` | 89 | WebP | 1920×1080 | Scene 3 (frameSequence) |
| flysky | `public/films/flysky/` | 121 | WebP | 1920×1080 | Scene 5 (frameSequence) |
| plan | `public/films/plan/` | 121 | WebP | 1920×1080 | Scene 7 (frameSequence) |
| trans | `public/films/trans/` | 121 | WebP | 1920×1080 | Scene 9 (frameSequence) |
| tree | `public/films/tree/` | 121 | WebP | 1920×1080 | Scene 11 (frameSequence) |
| renaissance/1440 | `public/films/model/renaissance/1440/` | 362 | WebP | 1440×810 | Scene 10 (frameSequence) |

**Total Frame Files:** 935 WebP files

### Video Assets (Video Textures)

| Scene ID | File | Size | Duration | Format | Used By |
|----------|------|------|----------|--------|---------|
| hero | `public/films/colossus.mp4` | 5.3 MB | ~15s | H.264 MP4 | Scene 0 (videoSrc) |
| hero | `public/films/reveal.mp4` | 13.1 MB | ~20s | H.264 MP4 | Scene 1 (videoSrc) |
| footer | `public/films/footer-loop.mp4` | 7.2 MB | ~10s | H.264 MP4 | Scene 2 (videoSrc) |
| signal | `public/films/signal.mp4` | 10.8 MB | ~15s | H.264 MP4 | Scene 4 (videoSrc) |

**Total Video Size:** 36.4 MB

### Poster Images (Video Placeholders)

| File | Size | Format | Used By |
|------|------|--------|---------|
| `public/films/colossus-poster.webp` | ~200 KB | WebP | Scene 0 |
| `public/films/reveal-poster.webp` | ~200 KB | WebP | Scene 1 |
| `public/films/signal-poster.webp` | ~200 KB | WebP | Scene 4 |

---

## Scene Configuration (app/page.tsx)

```typescript
const SCENES = [
  { id: 0, videoSrc: '/films/colossus.mp4', poster: '/films/colossus-poster.webp', transition: 'breathe', headline: '...' },
  { id: 1, videoSrc: '/films/reveal.mp4', poster: '/films/reveal-poster.webp', transition: 'slice', headline: '...' },
  { id: 2, videoSrc: '/films/footer-loop.mp4', transition: 'halftone', headline: '...' },
  { id: 3, frameSequence: '/films/coda/f_###.webp', frameCount: 89, transition: 'displace', headline: '...' },
  { id: 4, videoSrc: '/films/signal.mp4', poster: '/films/signal-poster.webp', transition: 'static', headline: '...' },
  { id: 5, frameSequence: '/films/flysky/f_###.webp', frameCount: 121, transition: 'ring', headline: '...' },
  { id: 6, transition: 'none', headline: '...' },
  { id: 7, frameSequence: '/films/plan/f_###.webp', frameCount: 121, transition: 'breathe', headline: '...' },
  { id: 8, transition: 'none', headline: '...' },
  { id: 9, frameSequence: '/films/trans/f_###.webp', frameCount: 121, transition: 'halftone', headline: '...' },
  { id: 10, frameSequence: '/films/model/renaissance/1440/f_###.webp', frameCount: 362, transition: 'displace', headline: '...' },
  { id: 11, frameSequence: '/films/tree/f_###.webp', frameCount: 121, transition: 'ring', headline: '...' },
];
```

**Scenes using frameSequence:** 6 (ids: 3, 5, 7, 9, 10, 11)  
**Scenes using videoSrc:** 4 (ids: 0, 1, 2, 4)  
**Scenes using neither (static):** 1 (id: 6, 8)

---

## Research Assets (research/)

Preserved for reference, debugging, and potential future use. NOT used by the production app.

### research/background-assets/
Source ZIP archives (validated, complete frame sequences):
- `coda_frames.zip` → 89 frames ✓
- `flysky_frames.zip` → 121 frames ✓
- `plan_frames.zip` → 121 frames ✓
- `trans_frames.zip` → 121 frames ✓
- `tree_frames.zip` → 121 frames ✓

Video files (duplicates of production):
- `colossus.mp4` (5.3 MB)
- `reveal.mp4` (13.1 MB)
- `footer-loop.mp4` (7.2 MB)
- `signal.mp4` (10.8 MB)

Poster images (duplicates of production):
- `colossus-poster.webp`
- `reveal-poster.webp`
- `signal-poster.webp`

### research/collected_assets/
Full 145 MB backup containing:
- All frame sequences (duplicates of public/films/)
- All videos (duplicates of public/films/)
- Fonts (Inter, Space Grotesk)
- Posters
- Asset manifest CSV

### research/extracted-frames/
PNG frames extracted from videos (80 frames total):
- `colossus/` — 20 frames
- `reveal/` — 20 frames
- `footer_loop/` — 20 frames
- `signal/` — 20 frames

### research/model-backups/
Unused model frame directories (10 directories, NOT in SCENES):
- `coda/` — alternative extraction
- `colossus/` — alternative extraction
- `flysky/` — alternative extraction
- `plan/` — alternative extraction
- `reveal/` — alternative extraction
- `signal/` — alternative extraction
- `trans/` — alternative extraction
- `tree/` — alternative extraction
- `v28/` — version 28 model
- `v51/` — version 51 model
- `v61/` — version 61 model

### research/references/
- `reference.html` — Saved pear.no homepage
- `reference-frames/` — Scraped frames from reference
- `scraper/` — Asset scraping scripts

### research/scraper/
- `collect-assets.js` — Asset collection script
- `package.json` — Scraper dependencies

---

## Validation Status

| Asset Type | Expected | Found | Valid | Notes |
|------------|----------|-------|-------|-------|
| Frame sequences (6 dirs) | 935 files | 935 | 935 | All WebP, correct naming (f_001.webp) |
| Videos (4 files) | 4 files | 4 | 4 | All valid H.264 MP4, playable |
| Posters (3 files) | 3 files | 3 | 3 | Valid WebP |
| ZIP archives (5 files) | 5 files | 5 | 5 | All extract correctly, frame counts match |

---

## Removed Assets

| Asset | Reason | Previously Tracked |
|-------|--------|-------------------|
| `public/films/coda.mp4` | HTML error page (13KB), not video | Yes |
| `public/films/flysky.mp4` | HTML error page (13KB), not video | Yes |
| `public/films/plan.mp4` | HTML error page (13KB), not video | Yes |
| `public/films/trans.mp4` | HTML error page (13KB), not video | Yes |
| `public/films/tree.mp4` | HTML error page (13KB), not video | Yes |
| `out/` | Build artifact, regenerable | Yes |

---

## Asset Integrity Checklist

- [x] All 6 frame sequence directories present in `public/films/`
- [x] All frame counts match SCENES configuration
- [x] All 4 videos present and playable
- [x] All 3 posters present
- [x] No invalid/error-page assets in production directory
- [x] All source ZIPs validated in `research/background-assets/`
- [x] Duplicate copies preserved in `research/` for audit trail
- [x] Unused model backups archived in `research/model-backups/`