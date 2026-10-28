# Video Asset Audit Report

**Date:** 2026-10-28  
**Project:** Pear Website Recreation  
**Auditor:** Automated cleanup process

---

## Executive Summary

Audited all video files in the project. Found **4 valid production videos** and **5 invalid HTML error pages** masquerading as MP4 files. Invalid files removed from production directory; valid videos confirmed working.

---

## Audit Results

### VALID — Production Videos (Kept in public/films/)

| File | Size | Format | Duration | Scene | Verification |
|------|------|--------|----------|-------|--------------|
| `colossus.mp4` | 5.3 MB | H.264 MP4 | ~15s | 0 (hero) | ✅ Plays, loads in WebGL |
| `reveal.mp4` | 13.1 MB | H.264 MP4 | ~20s | 1 (hero) | ✅ Plays, loads in WebGL |
| `footer-loop.mp4` | 7.2 MB | H.264 MP4 | ~10s | 2 (footer) | ✅ Plays, loads in WebGL |
| `signal.mp4` | 10.8 MB | H.264 MP4 | ~15s | 4 | ✅ Plays, loads in WebGL |

**Total Valid Video Size:** 36.4 MB  
**All 4 videos:** Load successfully as WebGL textures, play without errors, loop correctly.

---

### INVALID — HTML Error Pages (Removed from public/films/)

| File | Size | Actual Content | Scene Reference | Action |
|------|------|----------------|-----------------|--------|
| `coda.mp4` | 13.1 KB | HTML error page | Scene 3 uses **frameSequence** | ❌ DELETED |
| `flysky.mp4` | 13.1 KB | HTML error page | Scene 5 uses **frameSequence** | ❌ DELETED |
| `plan.mp4` | 13.1 KB | HTML error page | Scene 7 uses **frameSequence** | ❌ DELETED |
| `trans.mp4` | 13.1 KB | HTML error page | Scene 9 uses **frameSequence** | ❌ DELETED |
| `tree.mp4` | 13.1 KB | HTML error page | Scene 11 uses **frameSequence** | ❌ DELETED |

**Total Invalid Size:** 65.5 KB  
**All 5 files:** Identical HTML content (error page from failed download), not videos.  
**Critical Finding:** NONE of these 5 scenes use `videoSrc` — they all use `frameSequence` instead. The invalid files were never loaded by the application.

---

## Verification Method

### 1. File Command Check
```bash
file public/films/*.mp4
```
- Valid videos: `ISO Media, MP4 v2 [ISO 14496-14]`
- Invalid files: `HTML document, ASCII text`

### 2. FFprobe Check
```bash
ffprobe -v error -show_entries format=duration -of default=nw=1 public/films/*.mp4
```
- Valid videos: Return duration in seconds
- Invalid files: `Invalid data found when processing input`

### 3. Scene Configuration Cross-Reference
Checked `app/page.tsx` SCENES array:
- Scenes 0, 1, 2, 4 → `videoSrc` property → **require valid video**
- Scenes 3, 5, 7, 9, 10, 11 → `frameSequence` property → **require frame directories, NOT videos**
- Scenes 6, 8 → neither → static content

**Conclusion:** The 5 invalid videos correspond exactly to scenes that don't use videoSrc.

---

## Root Cause Analysis

The invalid files originated from a failed asset scraping/download attempt where:
1. Scraper requested video URLs that returned HTML error pages
2. Error pages were saved with `.mp4` extension
3. Files were committed to git without validation
4. They went unnoticed because the corresponding scenes use frame sequences, not video

---

## Duplicate Locations (Preserved in Research)

Each valid video exists in 3 locations:
1. `public/films/` — **Production** (served to users)
2. `research/background-assets/` — Source archive copy
3. `research/collected_assets/films/` — Full backup copy

This is intentional: production has the canonical copy; research preserves the full audit trail.

---

## Poster Images (Valid)

| File | Size | Format | Associated Video |
|------|------|--------|------------------|
| `colossus-poster.webp` | ~200 KB | WebP | colossus.mp4 |
| `reveal-poster.webp` | ~200 KB | WebP | reveal.mp4 |
| `signal-poster.webp` | ~200 KB | WebP | signal.mp4 |

All 3 posters: Valid WebP, correct dimensions (1920×1080), load as video placeholders.

---

## Recommendations

1. **✅ DONE** — Remove invalid HTML-error-page videos from production
2. **✅ DONE** — Verify all 4 production videos load in WebGL (confirmed via Playwright)
3. **✅ DONE** — Archive invalid files in git history (deleted from working tree, preserved in history)
4. **Future** — Add CI check: `file` command validation on all committed media assets
5. **Future** — Add scraper validation: verify downloaded videos with ffprobe before commit

---

## Commands Used for Audit

```bash
# Check file types
file public/films/*.mp4

# Validate with ffprobe
for f in public/films/*.mp4; do ffprobe -v error -show_entries format=duration -of default=nw=1 "$f" 2>&1; done

# Check scene config
grep -A 2 "videoSrc\|frameSequence" app/page.tsx

# Verify in browser (Playwright)
# Canvas renders at 1280x720, all 4 videos load as textures
```

---

## Sign-off

**Audit Status:** COMPLETE  
**Invalid Assets Removed:** 5 files (65.5 KB)  
**Valid Assets Confirmed:** 4 videos (36.4 MB) + 3 posters  
**Application Impact:** ZERO — invalid assets were never referenced by scene config