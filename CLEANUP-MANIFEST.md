# Cleanup Manifest — Pear Website Recreation

**Date:** 2026-10-28  
**Commit:** Post-cleanup reorganization

---

## Summary

Cleaned and reorganized the entire project folder. Removed genuine clutter, validated all assets, and preserved all recovered material in a structured `research/` directory.

---

## Project Structure Changes

### Before (Root Directory)
```
my-next-site/
├── app/                    # Next.js application
├── components/             # React components
├── lib/                    # Utility functions
├── public/                 # Production assets
│   ├── films/              # Frame sequences & videos (mixed with invalid files)
│   └── ...
├── collected_assets/       # 145MB backup (tracked in git)
├── extracted-frames/       # PNG frames from videos
├── references/             # Reference HTML, frames, scraper
├── scraper/                # Asset collection scripts
├── out/                    # Build artifact (static export)
├── .next/                  # Build cache
├── node_modules/           # Dependencies
├── research/               # (NEW) Organized research materials
├── collected_assets.zip    # 145MB archive
├── inspect-*.js            # Test scripts
├── screenshot-*.png        # Test screenshots
├── ASSET-MANIFEST.md       # Original asset documentation
├── compare_frames.py       # Comparison utility
└── config files
```

### After (Root Directory)
```
my-next-site/
├── app/                    # Next.js application (unchanged)
├── components/             # React components (unchanged)
├── lib/                    # Utility functions (unchanged)
├── public/                 # Production assets (CLEANED)
│   └── films/              # Only valid production assets
├── research/               # All research/backup materials
│   ├── background-assets/  # 5 ZIPs + 4 videos + 3 posters
│   ├── collected_assets/   # Full backup (145MB)
│   ├── extracted-frames/   # PNG frames from videos
│   ├── model-backups/      # Unused model frame directories
│   ├── references/         # Reference HTML, frames, scraper
│   └── scraper/            # Asset collection scripts
├── .next/                  # Build cache (ignored)
├── node_modules/           # Dependencies (ignored)
├── ASSET-MANIFEST.md       # Original asset documentation
├── compare_frames.py       # Comparison utility
├── CLEANUP-MANIFEST.md     # This file
├── ASSET-MANIFEST-UPDATED.md  # Updated asset manifest
├── VIDEO-AUDIT.md          # Video audit report
├── FINAL-REPORT.md         # Final summary report
└── config files
```

---

## Files Moved

| Source | Destination | Reason |
|--------|-------------|--------|
| `collected_assets/` | `research/collected_assets/` | Large backup archive (145MB), not needed at runtime |
| `extracted-frames/` | `research/extracted-frames/` | PNG frames from videos, research material |
| `references/` | `research/references/` | Reference HTML, scraper output, research |
| `scraper/` | `research/scraper/` | Asset collection scripts, not runtime |
| `out/films/assets for background/` | `research/background-assets/` | Source ZIPs and master assets |
| `public/films/model/coda/` | `research/model-backups/coda/` | Unused backup frames |
| `public/films/model/colossus/` | `research/model-backups/colossus/` | Unused backup frames |
| `public/films/model/flysky/` | `research/model-backups/flysky/` | Unused backup frames |
| `public/films/model/plan/` | `research/model-backups/plan/` | Unused backup frames |
| `public/films/model/reveal/` | `research/model-backups/reveal/` | Unused backup frames |
| `public/films/model/signal/` | `research/model-backups/signal/` | Unused backup frames |
| `public/films/model/trans/` | `research/model-backups/trans/` | Unused backup frames |
| `public/films/model/tree/` | `research/model-backups/tree/` | Unused backup frames |
| `public/films/model/v28/` | `research/model-backups/v28/` | Unused backup frames |
| `public/films/model/v51/` | `research/model-backups/v51/` | Unused backup frames |
| `public/films/model/v61/` | `research/model-backups/v61/` | Unused backup frames |
| `collected_assets.zip` | `research/collected_assets.zip` | Large archive, not needed in repo root |
| `inspect-*.js` (6 files) | `research/inspect-*.js` | Test scripts, not production |
| `screenshot-*.png` (3 files) | `research/screenshot-*.png` | Test screenshots, not production |

---

## Files Removed (Deleted from Working Tree & Git)

| File | Reason |
|------|--------|
| `public/films/coda.mp4` | HTML error page (13KB), not a video, not referenced in scenes |
| `public/films/flysky.mp4` | HTML error page (13KB), not a video, not referenced in scenes |
| `public/films/plan.mp4` | HTML error page (13KB), not a video, not referenced in scenes |
| `public/films/trans.mp4` | HTML error page (13KB), not a video, not referenced in scenes |
| `public/films/tree.mp4` | HTML error page (13KB), not a video, not referenced in scenes |
| `out/` (entire directory) | Build artifact (static export output), regenerable, already in .gitignore |

**Note:** The 5 HTML error page videos were tracked in git but are invalid assets (HTML saved as .mp4). They are not referenced by any scene configuration (all 5 scenes use frame sequences instead). Removed to prevent confusion and accidental use.

---

## Duplicates Identified

| Asset | Locations | Action |
|-------|-----------|--------|
| `colossus.mp4` (5.3MB) | `public/films/`, `research/background-assets/`, `research/collected_assets/films/` | Kept in `public/films/` (production), preserved in research |
| `reveal.mp4` (13.1MB) | `public/films/`, `research/background-assets/`, `research/collected_assets/films/` | Kept in `public/films/` (production), preserved in research |
| `footer-loop.mp4` (7.2MB) | `public/films/`, `research/background-assets/`, `research/collected_assets/films/` | Kept in `public/films/` (production), preserved in research |
| `signal.mp4` (10.8MB) | `public/films/`, `research/background-assets/`, `research/collected_assets/films/` | Kept in `public/films/` (production), preserved in research |
| Frame sequences (6 dirs) | `public/films/`, `research/background-assets/`, `research/collected_assets/films/` | Kept in `public/films/` (production), preserved in research |
| Posters (3 files) | `public/films/`, `research/background-assets/`, `research/collected_assets/` | Kept in `public/films/` (production), preserved in research |

---

## Unresolved / Preserved for Review

| Item | Location | Notes |
|------|----------|-------|
| `research/collected_assets/` | 145MB directory | Full backup of all recovered assets. Contains frame sequences, videos, fonts, posters. Preserved in git. |
| `research/extracted-frames/` | 80 PNG frames | High-res frames extracted from videos (colossus, reveal, footer_loop, signal). Potential future use. |
| `research/model-backups/` | 10 unused model dirs | Alternative frame extractions. Not currently referenced. |
| `collected_assets.zip` | 145MB | Compressed archive of collected_assets. Preserved. |
| `compare_frames.py` | Root | Frame comparison utility. Kept for potential use. |

---

## Git Commit Plan

All changes should be committed with descriptive messages:

1. **Cleanup: Reorganize project structure**
   - Move collected_assets, extracted-frames, references, scraper to research/
   - Move "assets for background" to research/background-assets
   - Move unused model subdirectories to research/model-backups
   - Move test scripts and screenshots to research/

2. **Cleanup: Remove invalid assets**
   - Delete 5 HTML error page videos from public/films (coda, flysky, plan, trans, tree)
   - Remove out/ build artifact directory

3. **Cleanup: Add new documentation**
   - Add CLEANUP-MANIFEST.md
   - Add ASSET-MANIFEST-UPDATED.md
   - Add VIDEO-AUDIT.md
   - Add FINAL-REPORT.md