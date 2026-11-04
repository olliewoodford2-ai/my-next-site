# Phase 2 change log

## 4 November 2026

- `app/layout.tsx`: removed remote Google font imports so the existing local editorial font assets are actually used.
- `app/globals.css`: added local `@font-face` declarations, scene-aware atmospheric backgrounds, editorial reveal primitives, focus-visible outlines and reduced-motion-safe reveal behaviour.
- `app/page.tsx`: added section reveal observation, scene-aware shell class, staggered service/project/venture reveals, and enquiry-form reveal grouping.
- `src/hooks/useCustomCursor.ts`: moved cursor interpolation state into refs to prevent a requestAnimationFrame callback from being recreated on every store update.
- `src/components/three/ThreeCanvas.tsx`: reduced mobile DPR and disabled antialiasing for lower DPR configurations.
- Validation: `npm ci`, `npx tsc --noEmit`, `npm run build`, local `curl`, Browser canvas page read and screenshot.
