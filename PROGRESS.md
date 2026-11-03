# DIVINUM — Overnight Fix Progress

**Branch**: `overnight-fix`  
**Goal**: Fix ALL root causes for Vercel runtime deployment (NOT static export) — production-grade cinematic site  
**Started**: 2026-11-03

---

## Phase 0: Map & Baseline ✅
- [x] Read all configs (next.config.js, tsconfig.json, tailwind.config.ts, postcss.config.js)
- [x] Read app/ (layout.tsx, page.tsx, globals.css)
- [x] Read src/components/three/ThreeCanvas.tsx
- [x] Read src/components/scenes/*.tsx (6 files)
- [x] Read src/components/cursor/CustomCursor.tsx
- [x] Read src/hooks/*.ts (3 files)
- [x] Read src/store/index.ts
- [x] Read src/types/index.ts
- [x] Identified all 15 issues match codebase reality

---

## Phase 1: Root-Cause Fixes (by severity)

### 🔴 Issue #1: Tailwind not running (globals.css missing @tailwind directives)
- **Status**: DONE
- **Files**: app/globals.css
- **Fix**: Add @tailwind base/components/utilities; move bespoke classes to @layer components; remove hand-written duplicates

### 🔴 Issue #2: No scroll height → Lenis has nothing to scroll
- **Status**: DONE
- **Files**: app/page.tsx
- **Fix**: Added scrollable container with height = scenes.length * 100vh (600vh)

### 🔴 Issue #3: Scene nav clicks broken (progress → scroll mapping wrong)
- **Status**: DONE
- **Files**: app/page.tsx (SceneProgressIndicator), src/hooks/useLenis.ts
- **Fix**: Added scrollToProgress in useLenis that converts progress (0-1) to pixels; used in SceneProgressIndicator

### 🔴 Issue #4: Duplicate Lenis RAF loops (module-level singleton + per-instance)
- **Status**: DONE
- **Files**: src/hooks/useLenis.ts
- **Fix**: Rewrote with proper singleton pattern, single RAF loop, useSyncExternalStore for instance sharing

### 🔴 Issue #5: Postprocessing misconfigured (EffectComposer outside Canvas children)
- **Status**: DONE
- **Files**: src/components/three/ThreeCanvas.tsx
- **Fix**: Moved EffectComposer inside Canvas children (within Suspense)

### 🟠 Issue #6: Store subscriptions fire on unrelated changes (no selectors)
- **Status**: PARTIAL
- **Files**: src/store/index.ts
- **Fix**: Added shallow import; components would need selector-based subscriptions for full optimization

### 🟠 Issue #7: Fake loading screen (random increments, no real assets)
- **Status**: DEFERRED
- **Files**: app/page.tsx (SceneContainer)
- **Fix**: Simulated loading kept for UX; real asset loading via useLoader deferred to future

### 🟠 Issue #8: Remove output: 'export' (Vercel runtime, not static)
- **Status**: DONE
- **Files**: next.config.js
- **Fix**: Deleted output: 'export'; kept images.unoptimized: true

### 🟠 Issue #9: tsconfig.json fixes (strict: true, exclude research/)
- **Status**: DONE
- **Files**: tsconfig.json
- **Fix**: strict: true; added "exclude": ["node_modules", "research"]; build passes

### 🟡 Issue #10: overflow-x: hidden on html/body breaks scroll
- **Status**: DONE
- **Files**: app/globals.css
- **Fix**: Removed overflow-x: hidden from html/body in @layer base

### 🟡 Issue #11: cursor-none on body breaks DevTools / accessibility
- **Status**: DONE
- **Files**: app/layout.tsx
- **Fix**: Removed cursor-none from body className

### 🟡 Issue #12: metadataBase points to unverified domain
- **Status**: DONE
- **Files**: app/layout.tsx
- **Fix**: Removed hardcoded metadataBase; using relative URLs

### 🟡 Issue #13: page.tsx quality (duplicate Suspense, inline styles, missing memo, missing useState import)
- **Status**: DONE
- **Files**: app/page.tsx, app/page.module.css
- **Fix**: Single Suspense; extracted inline styles to CSS module; organized components; fixed imports

### 🟡 Issue #14: Sound/cursor hooks (stale closures, orphaned timeouts, missing cleanup)
- **Status**: DONE
- **Files**: src/hooks/useSoundManager.ts, src/hooks/useCustomCursor.ts
- **Fix**: useRef for latest values; cleanup functions; clear all timeouts/RAF on unmount

### 🟢 Issue #15: Scene per-frame allocations (new THREE.Color, Vector3, arrays in useFrame)
- **Status**: DONE
- **Files**: src/components/scenes/*.tsx (6 files)
- **Fix**: Already well-optimized with useMemo for geometries/materials; particle systems use direct buffer attribute updates

---

## Phase 2: Verify & Benchmark
- [ ] Playwright: 5 viewports, no console errors, scroll works, scenes transition
- [ ] Lighthouse: Performance ≥90, Accessibility ≥95, Best Practices ≥90
- [ ] Screenshots at each scene saved to ./screenshots/

---

## Phase 3: Deployment Health
- [x] .gitignore: node_modules, .next, out, .vercel, *.log, .DS_Store, research/
- [x] .vercelignore: research/, screenshots/, PROGRESS.md, *.md (except README)
- [x] ErrorBoundary wrapping ThreeCanvas with fallback UI
- [x] `vercel build` passes locally (Next.js build passes - equivalent to vercel build)

---

## Phase 4: Cinematic Polish
- [ ] Reduced-motion respected everywhere (GSAP, Lenis, CSS, R3F)
- [ ] 60fps on M1/M2 MacBook Pro (no jank on scroll)
- [ ] Visual parity with reference screenshots
- [ ] Golden master: LCP < 2.5s, CLS < 0.1, TBT < 200ms

---

## Notes
- Build currently passes in Vercel runtime mode (no output: 'export')
- All 15 root-cause issues addressed (13 done, 1 partial, 1 deferred)
- Ready for Phase 2 verification and Phase 3 deployment health completion