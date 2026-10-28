'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

type SceneId =
  | 'classical'
  | 'cream-fabric'
  | 'red-cream-fabric'
  | 'orchard'
  | 'hands-fruit'
  | 'blue-fabric'
  | 'portrait-fabric'
  | 'orchard-return'
  | 'final-blue'
  | 'cobalt-hold'

interface SceneDef {
  id: SceneId
  start: number
  end: number
  label: string
  // Video settings (for scenes using video)
  videoSrc: string | null
  videoTimeStart: number
  videoTimeEnd: number
  // Frame sequence settings (for scenes using image sequences)
  frameDir: string | null
  frameCount: number
  frameStart: number // 1-indexed frame number to start
  frameEnd: number   // 1-indexed frame number to end
  useFrames: boolean
}

// Scene definitions based on the reference video (19s total) and recovered original assets
// Frame sequences recovered from pear.no live site via scraper:
// - flysky: 121 frames (cream fabric, Scene 2)
// - trans: 121 frames (red/cream fabric transition, Scene 3)
// - tree: 121 frames (orchard, Scene 4)
// - plan: 121 frames (orchard return/planning, Scenes 6 & 8)
// - coda: 89 frames (final blue shift, Scene 9)
// - model/renaissance/1440: 362 frames (high-res portrait, Scenes 1 & 7)
// Videos verified via perceptual hash:
// - colossus.mp4: classical figure (Scene 1)
// - reveal.mp4: orchard/hands (Scenes 4-5)
// - signal.mp4: cobalt hold + typography (Scene 10)
// - footer-loop.mp4: final blue shift (Scene 9)
const SCENES: readonly SceneDef[] = [
  {
    id: 'classical',
    start: 0.00,
    end: 0.13,
    label: 'Classical Figure',
    videoSrc: '/films/colossus.mp4',
    videoTimeStart: 0.0,
    videoTimeEnd: 10.0,
    frameDir: '/films/model/renaissance/1440',
    frameCount: 362,
    frameStart: 1,
    frameEnd: 362,
    useFrames: true, // Use high-res renaissance frames with video fallback
  },
  {
    id: 'cream-fabric',
    start: 0.13,
    end: 0.21,
    label: 'Cream Fabric',
    videoSrc: null,
    videoTimeStart: 0,
    videoTimeEnd: 0,
    frameDir: '/films/flysky',
    frameCount: 121,
    frameStart: 1,
    frameEnd: 121,
    useFrames: true,
  },
  {
    id: 'red-cream-fabric',
    start: 0.21,
    end: 0.29,
    label: 'Red & Cream Fabric',
    videoSrc: null,
    videoTimeStart: 0,
    videoTimeEnd: 0,
    frameDir: '/films/trans',
    frameCount: 121,
    frameStart: 1,
    frameEnd: 121,
    useFrames: true,
  },
  {
    id: 'orchard',
    start: 0.29,
    end: 0.39,
    label: 'Orchard & Pear Branches',
    videoSrc: '/films/reveal.mp4',
    videoTimeStart: 0.0,
    videoTimeEnd: 3.5,
    frameDir: '/films/tree',
    frameCount: 121,
    frameStart: 1,
    frameEnd: 121,
    useFrames: true, // Use tree frames as primary, video as fallback
  },
  {
    id: 'hands-fruit',
    start: 0.39,
    end: 0.47,
    label: 'Hands & Fruit Closeup',
    videoSrc: '/films/reveal.mp4',
    videoTimeStart: 3.5,
    videoTimeEnd: 7.0,
    frameDir: null,
    frameCount: 0,
    frameStart: 0,
    frameEnd: 0,
    useFrames: false, // Video only for hands/fruit
  },
  {
    id: 'blue-fabric',
    start: 0.47,
    end: 0.58,
    label: 'Blue Fabric Entry',
    videoSrc: null,
    videoTimeStart: 0,
    videoTimeEnd: 0,
    frameDir: '/films/plan',
    frameCount: 121,
    frameStart: 1,
    frameEnd: 121,
    useFrames: true,
  },
  {
    id: 'portrait-fabric',
    start: 0.58,
    end: 0.63,
    label: 'Portrait in Fabric',
    videoSrc: '/films/colossus.mp4',
    videoTimeStart: 0.0,
    videoTimeEnd: 10.0,
    frameDir: '/films/model/renaissance/1440',
    frameCount: 362,
    frameStart: 1,
    frameEnd: 362,
    useFrames: true, // High-res portrait frames with video
  },
  {
    id: 'orchard-return',
    start: 0.63,
    end: 0.74,
    label: 'Orchard Return',
    videoSrc: null,
    videoTimeStart: 0,
    videoTimeEnd: 0,
    frameDir: '/films/plan',
    frameCount: 121,
    frameStart: 1,
    frameEnd: 121,
    useFrames: true,
  },
  {
    id: 'final-blue',
    start: 0.74,
    end: 0.82,
    label: 'Final Blue Shift',
    videoSrc: '/films/footer-loop.mp4',
    videoTimeStart: 0.0,
    videoTimeEnd: 10.0,
    frameDir: '/films/coda',
    frameCount: 89,
    frameStart: 1,
    frameEnd: 89,
    useFrames: true, // Coda frames with footer-loop video
  },
  {
    id: 'cobalt-hold',
    start: 0.82,
    end: 1.00,
    label: 'Cobalt Hold + Typography',
    videoSrc: '/films/signal.mp4',
    videoTimeStart: 0.0,
    videoTimeEnd: 10.0,
    frameDir: null,
    frameCount: 0,
    frameStart: 0,
    frameEnd: 0,
    useFrames: false, // Video + HTML typography overlay
  },
] as const

const STAGE_HEIGHT = 5350

interface VideoAsset {
  video: HTMLVideoElement
  ready: boolean
  duration: number
  currentTime: number
}

interface FrameAsset {
  images: HTMLImageElement[]
  ready: boolean
  loadedCount: number
  frameDir: string
  frameStart: number
  frameEnd: number
}

type SceneAsset = VideoAsset | FrameAsset | null

export default function Page() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentScene, setCurrentScene] = useState<SceneId>('classical')
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [assets, setAssets] = useState<Map<SceneId, SceneAsset>>(new Map())
  const [assetsReady, setAssetsReady] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()
  const frameRef = useRef(0)
  const lastScrollProgressRef = useRef(0)

  // Preload all assets (videos and frames)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
    mql.addEventListener?.('change', handler)
    return () => mql.removeEventListener?.('change', handler)
  }, [])

  useEffect(() => {
    const loadVideoAsset = (scene: typeof SCENES[0]): Promise<VideoAsset> => {
      return new Promise((resolve) => {
        if (!scene.videoSrc) {
          resolve({ video: null as any, ready: false, duration: 0, currentTime: 0 })
          return
        }
        const video = document.createElement('video')
        video.src = scene.videoSrc
        video.muted = true
        video.playsInline = true
        video.preload = 'auto'
        video.crossOrigin = 'anonymous'
        video.style.display = 'none'

        video.addEventListener('canplay', () => {
          video.currentTime = scene.videoTimeStart || 0
          resolve({
            video,
            ready: true,
            duration: video.duration || (scene.videoTimeEnd - scene.videoTimeStart),
            currentTime: scene.videoTimeStart || 0
          })
        }, { once: true })

        video.addEventListener('error', () => {
          console.warn(`Failed to load video: ${scene.videoSrc}`)
          resolve({ video: null as any, ready: false, duration: 0, currentTime: 0 })
        }, { once: true })

        const timeout = setTimeout(() => {
          if (video.readyState >= 2) {
            video.currentTime = scene.videoTimeStart || 0
            resolve({
              video,
              ready: true,
              duration: video.duration || (scene.videoTimeEnd - scene.videoTimeStart),
              currentTime: scene.videoTimeStart || 0
            })
          } else {
            console.warn(`Video load timeout: ${scene.videoSrc}`)
            resolve({ video: null as any, ready: false, duration: 0, currentTime: 0 })
          }
        }, 10000)

        video.addEventListener('canplay', () => clearTimeout(timeout), { once: true })

        document.body.appendChild(video)
        video.load()
      })
    }

    const loadFrameAsset = (scene: typeof SCENES[0]): Promise<FrameAsset> => {
      return new Promise((resolve) => {
        if (!scene.useFrames || !scene.frameDir) {
          resolve({ images: [], ready: false, loadedCount: 0, frameDir: '', frameStart: 0, frameEnd: 0 })
          return
        }
        const images: HTMLImageElement[] = []
        let loadedCount = 0
        const totalFrames = scene.frameEnd - scene.frameStart + 1

        for (let i = scene.frameStart; i <= scene.frameEnd; i++) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          // WebP frames: f_001.webp, f_002.webp, etc.
          img.src = `${scene.frameDir}/f_${String(i).padStart(3, '0')}.webp?r=13`

          img.onload = () => {
            loadedCount++
            images[i - scene.frameStart] = img
            if (loadedCount === totalFrames) {
              resolve({ images, ready: true, loadedCount, frameDir: scene.frameDir!, frameStart: scene.frameStart, frameEnd: scene.frameEnd })
            }
          }
          img.onerror = () => {
            loadedCount++
            console.warn(`Failed to load frame: ${img.src}`)
            if (loadedCount === totalFrames) {
              resolve({ images, ready: loadedCount > 0, loadedCount, frameDir: scene.frameDir!, frameStart: scene.frameStart, frameEnd: scene.frameEnd })
            }
          }
        }
      })
    }

    const loadAllAssets = async () => {
      const assetMap = new Map<SceneId, SceneAsset>()
      for (const scene of SCENES) {
        if (scene.videoSrc && scene.useFrames) {
          // Load both video and frames for scenes that have both
          const [videoAsset, frameAsset] = await Promise.all([
            loadVideoAsset(scene),
            loadFrameAsset(scene)
          ])
          // Prefer frames for rendering, video as fallback
          assetMap.set(scene.id, frameAsset)
        } else if (scene.videoSrc) {
          const asset = await loadVideoAsset(scene)
          assetMap.set(scene.id, asset)
        } else if (scene.useFrames) {
          const asset = await loadFrameAsset(scene)
          assetMap.set(scene.id, asset)
        } else {
          assetMap.set(scene.id, null)
        }
      }
      setAssets(assetMap)
      setAssetsReady(true)
    }

    loadAllAssets()
  }, [])

  // Scroll handling
  useEffect(() => {
    const stage = stageRef.current
    const pin = pinRef.current
    if (!stage || !pin) return

    const handleScroll = () => {
      const stageRect = stage.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const maxScroll = stageRect.height - viewportHeight
      const progress = Math.max(0, Math.min(1, -stageRect.top / maxScroll))

      setScrollProgress(progress)
      lastScrollProgressRef.current = progress

      const scene = SCENES.find(s => progress >= s.start && progress < s.end) || SCENES[SCENES.length - 1]
      setCurrentScene(scene.id)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.target === pin) {
            pin.style.position = entry.isIntersecting ? 'fixed' : 'absolute'
            pin.style.top = entry.isIntersecting ? '0' : `${STAGE_HEIGHT - 100}vh`
          }
        })
      },
      { rootMargin: '0px', threshold: [0, 1] }
    )

    observer.observe(pin)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Update video current times based on scroll
  const updateVideoTimes = useCallback((progress: number, sceneId: SceneId) => {
    setAssets(prev => {
      const next = new Map(prev)
      SCENES.forEach(s => {
        const asset = next.get(s.id)
        if (!asset || !('video' in asset) || !asset.video) return

        const sceneProgress = getSceneProgress(progress, s.id)
        const targetTime = s.videoTimeStart + (s.videoTimeEnd - s.videoTimeStart) * sceneProgress

        if (s.id === sceneId) {
          if (Math.abs(asset.video.currentTime - targetTime) > 0.1) {
            asset.video.currentTime = targetTime
          }
          asset.currentTime = asset.video.currentTime
        } else {
          if (asset.video.currentTime !== s.videoTimeStart) {
            asset.video.currentTime = s.videoTimeStart
          }
          asset.currentTime = s.videoTimeStart
        }
      })
      return next
    })
  }, [])

  useEffect(() => {
    if (!assetsReady) return
    updateVideoTimes(scrollProgress, currentScene)
  }, [scrollProgress, currentScene, assetsReady, updateVideoTimes])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true, willReadFrequently: false })
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const animate = () => {
      frameRef.current++
      render(ctx, canvas.clientWidth, canvas.clientHeight, scrollProgress, currentScene, frameRef.current, assets)
      rafRef.current = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current!)
    }
  }, [scrollProgress, currentScene, assets, assetsReady])

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="stage"
        style={{ height: `${STAGE_HEIGHT}vh` }}
        aria-hidden="true"
      >
        <div
          ref={pinRef}
          className="pin"
          style={{
            height: '100dvh',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 10,
            overflow: 'hidden',
            contain: 'strict',
          }}
        >
          <canvas
            ref={canvasRef}
            className="scene-canvas"
            style={{ width: '100%', height: '100%', display: 'block' }}
            aria-label="Cinematic scroll experience"
          />
          <div className="scene-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {currentScene === 'cobalt-hold' && (
              <div className="cobalt-typography" style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(2rem, 8vw, 6rem)',
                textAlign: 'center',
                color: 'var(--paper)',
              }}>
                <svg
                  className="pear-mark"
                  viewBox="0 0 120 120"
                  style={{ width: 'clamp(80px, 15vw, 140px)', height: 'auto', marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M60 10c-22 0-38 15-38 35 0 12 8 22 20 28 12 6 24 18 24 36 0-18 12-30 24-36 12-6 20-16 20-28 0-20-16-35-38-35zm0 16c11 0 18 8 18 18 0 5-3 10-8 12-5 2-9 6-9 11 0 8 12 12 22 12 10 0 18-4 22-12 0-5-4-9-9-11-5-2-8-7-8-12 0-10 7-18 18-18z"
                  />
                </svg>
                <h1 className="font-title-large tracking-press text-display leading-snug" style={{
                  maxWidth: 'clamp(280px, 60vw, 600px)',
                  lineHeight: 1.04,
                  fontWeight: 300,
                  letterSpacing: '-0.024em',
                }}>
                  not an agency on the clock,<br />a partner in the upside
                </h1>
                <p className="font-text tracking-wider" style={{
                  marginTop: 'clamp(1.5rem, 3vw, 2.5rem)',
                  fontSize: 'clamp(0.75rem, 1.2vw, 1rem)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.24em',
                  opacity: 0.72,
                  fontWeight: 400,
                }}>
                  Pear makes you appear
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="scene-indicator" style={{
        position: 'fixed',
        right: 'clamp(1rem, 3vw, 2rem)',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none',
      }} aria-label="Scene progress">
        {SCENES.map((scene, i) => (
          <div
            key={scene.id}
            className={`scene-dot ${currentScene === scene.id ? 'active' : ''}`}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: currentScene === scene.id ? 'var(--sky)' : 'var(--rule)',
              transition: 'all 300ms var(--ease)',
              transform: currentScene === scene.id ? 'scale(1.5)' : 'scale(1)',
            }}
            title={scene.label}
          />
        ))}
      </nav>

      <div className="sr-only" aria-live="polite">
        Scene: {currentScene}, Progress: {Math.round(scrollProgress * 100)}%
      </div>
    </div>
  )
}

function getSceneProgress(globalProgress: number, scene: SceneId): number {
  const s = SCENES.find(s => s.id === scene)
  if (!s) return 0
  const range = s.end - s.start
  return Math.max(0, Math.min(1, (globalProgress - s.start) / range))
}

function render(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
  scene: SceneId,
  frame: number,
  assets: Map<SceneId, SceneAsset>
) {
  ctx.clearRect(0, 0, w, h)

  const sceneProgress = getSceneProgress(progress, scene)
  const asset = assets.get(scene)
  const sceneDef = SCENES.find(s => s.id === scene)!

  // Render priority: frames first (original artwork), then video, then procedural fallback
  if (asset && 'images' in asset && asset.ready && asset.images.length > 0) {
    drawFrameSequence(ctx, asset.images, w, h, sceneProgress, sceneDef, asset)
  } else if (asset && 'video' in asset && asset.ready && asset.video && asset.video.readyState >= 2) {
    drawVideoFrame(ctx, asset.video, w, h, sceneProgress, sceneDef)
  } else {
    drawProceduralFallback(ctx, w, h, sceneProgress, sceneDef, frame * 0.016)
  }

  // For cobalt-hold, also render the vignette on canvas (HTML overlay handles typography)
  if (scene === 'cobalt-hold') {
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7)
    vignette.addColorStop(0, 'rgba(12, 13, 25, 0)')
    vignette.addColorStop(0.7, 'rgba(12, 13, 25, 0)')
    vignette.addColorStop(1, 'rgba(8, 9, 16, 0.8)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, w, h)
  }
}

function drawFrameSequence(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  w: number,
  h: number,
  sceneProgress: number,
  sceneDef: typeof SCENES[0],
  asset: FrameAsset
) {
  if (images.length === 0) return

  // Map scene progress (0-1) to frame index
  const frameIndex = sceneProgress * (images.length - 1)
  const lowerIdx = Math.floor(frameIndex)
  const upperIdx = Math.min(lowerIdx + 1, images.length - 1)
  const progressInSegment = frameIndex - lowerIdx

  const lowerImg = images[Math.min(lowerIdx, images.length - 1)]
  const upperImg = images[Math.min(upperIdx, images.length - 1)]

  if (!lowerImg || !lowerImg.complete) return

  const iw = lowerImg.naturalWidth
  const ih = lowerImg.naturalHeight
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  const dx = (w - dw) * 0.5
  const dy = (h - dh) * 0.5

  ctx.save()

  // Cross-fade between frames for smooth animation
  if (progressInSegment > 0.01 && progressInSegment < 0.99 && upperImg && upperImg.complete && upperImg !== lowerImg) {
    ctx.globalAlpha = 1 - progressInSegment
    ctx.drawImage(lowerImg, dx, dy, dw, dh)

    ctx.globalAlpha = progressInSegment
    ctx.drawImage(upperImg, dx, dy, dw, dh)
    ctx.globalAlpha = 1
  } else {
    ctx.drawImage(lowerImg, dx, dy, dw, dh)
  }

  // Scene-specific color grading overlays matching original
  applySceneOverlay(ctx, w, h, sceneProgress, sceneDef)

  ctx.restore()
}

function applySceneOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sceneProgress: number,
  sceneDef: typeof SCENES[0]
) {
  const p = sceneProgress

  switch (sceneDef.id) {
    case 'classical':
    case 'portrait-fabric': {
      // Subtle vignette for portrait scenes
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, Math.max(w, h) * 0.7)
      vignette.addColorStop(0, 'rgba(11, 10, 9, 0)')
      vignette.addColorStop(0.6, 'rgba(11, 10, 9, 0.3)')
      vignette.addColorStop(1, 'rgba(11, 10, 9, 0.8)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'cream-fabric': {
      // Warm cream tone enhancement
      const overlay = ctx.createLinearGradient(0, 0, 0, h)
      overlay.addColorStop(0, `rgba(245, 230, 211, ${0.15 * p})`)
      overlay.addColorStop(1, `rgba(212, 196, 176, ${0.2 * p})`)
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'red-cream-fabric': {
      // Red fabric color bleed
      const overlay = ctx.createLinearGradient(0, 0, 0, h)
      overlay.addColorStop(0, `rgba(245, 230, 211, ${0.1 * (1-p)})`)
      overlay.addColorStop(0.5, `rgba(196, 116, 94, ${0.25 * p})`)
      overlay.addColorStop(1, `rgba(160, 82, 61, ${0.3 * p})`)
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'orchard':
    case 'orchard-return': {
      // Dappled green light
      const overlay = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, Math.max(w, h) * 0.6)
      overlay.addColorStop(0, 'rgba(127, 140, 120, 0)')
      overlay.addColorStop(0.4, 'rgba(127, 140, 120, 0.1)')
      overlay.addColorStop(1, 'rgba(90, 106, 85, 0.2)')
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'blue-fabric': {
      // Blue fabric entry - warm to cobalt transition
      const warmTop = h * (1 - p * 1.2)
      const blendHeight = h * 0.3
      const blendTop = Math.max(0, warmTop - blendHeight)

      // Warm base
      const warmGradient = ctx.createLinearGradient(0, 0, 0, h)
      warmGradient.addColorStop(0, '#F5E6D3')
      warmGradient.addColorStop(0.5, '#E8D5C4')
      warmGradient.addColorStop(1, '#D4C4B0')
      ctx.fillStyle = warmGradient
      ctx.fillRect(0, 0, w, Math.max(0, warmTop))

      // Blend zone
      for (let y = blendTop; y < warmTop; y++) {
        const localP = (y - blendTop) / blendHeight
        const eased = 1 - Math.pow(1 - localP, 3)
        const r = Math.round(245 * (1 - eased) + 12 * eased)
        const g = Math.round(230 * (1 - eased) + 13 * eased)
        const b = Math.round(211 * (1 - eased) + 25 * eased)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(0, y, w, 1)
      }

      // Cobalt bottom
      const blueGradient = ctx.createLinearGradient(0, 0, 0, h)
      blueGradient.addColorStop(0, '#11121E')
      blueGradient.addColorStop(0.5, '#0C0D19')
      blueGradient.addColorStop(1, '#080910')
      ctx.fillStyle = blueGradient
      ctx.fillRect(0, warmTop, w, h - warmTop)
      break
    }
    case 'final-blue': {
      // Final blue shift to cobalt
      const overlay = ctx.createLinearGradient(0, 0, 0, h)
      overlay.addColorStop(0, `rgba(17, 18, 30, ${0.2 + p * 0.5})`)
      overlay.addColorStop(0.5, `rgba(12, 13, 25, ${0.6 + p * 0.3})`)
      overlay.addColorStop(1, `rgba(8, 9, 16, ${0.8 + p * 0.2})`)
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, w, h)
      break
    }
  }
}

function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  h: number,
  sceneProgress: number,
  sceneDef: typeof SCENES[0]
) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return

  const scale = Math.max(w / vw, h / vh)
  const dw = vw * scale
  const dh = vh * scale
  const dx = (w - dw) * 0.5
  const dy = (h - dh) * 0.5

  ctx.save()
  ctx.drawImage(video, dx, dy, dw, dh)

  // Apply same overlays as frame sequences for consistency
  applySceneOverlay(ctx, w, h, sceneProgress, sceneDef)

  ctx.restore()
}

function drawProceduralFallback(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  sceneDef: typeof SCENES[0],
  t: number
) {
  switch (sceneDef.id) {
    case 'classical':
      renderClassical(ctx, w, h, p, t)
      break
    case 'cream-fabric':
      renderCreamFabric(ctx, w, h, p, t)
      break
    case 'red-cream-fabric':
      renderRedCreamFabric(ctx, w, h, p, t)
      break
    case 'orchard':
      renderOrchard(ctx, w, h, p, t)
      break
    case 'hands-fruit':
      renderHandsFruit(ctx, w, h, p, t)
      break
    case 'blue-fabric':
      renderBlueFabric(ctx, w, h, p, t)
      break
    case 'portrait-fabric':
      renderPortraitFabric(ctx, w, h, p, t)
      break
    case 'orchard-return':
      renderOrchardReturn(ctx, w, h, p, t)
      break
    case 'final-blue':
      renderFinalBlue(ctx, w, h, p, t)
      break
    case 'cobalt-hold':
      renderCobaltHold(ctx, w, h, p, t)
      break
  }
}

// Procedural fallback renderers (kept for when assets fail to load)
function renderClassical(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, Math.max(w, h) * 0.8)
  gradient.addColorStop(0, `rgba(245, 230, 211, ${0.15 * p})`)
  gradient.addColorStop(0.4, `rgba(160, 120, 88, ${0.08 * p})`)
  gradient.addColorStop(1, 'rgba(11, 10, 9, 1)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

function renderCreamFabric(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const baseGradient = ctx.createLinearGradient(0, 0, 0, h)
  baseGradient.addColorStop(0, '#F5E6D3')
  baseGradient.addColorStop(0.5, '#E8D5C4')
  baseGradient.addColorStop(1, '#D4C4B0')
  ctx.fillStyle = baseGradient
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.6 * p
  for (let i = 0; i < 5; i++) {
    const y = h * (0.15 + i * 0.18) + Math.sin(t * 0.5 + i) * h * 0.02
    const amp = h * 0.03 * (1 - p * 0.5)
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= w; x += 10) {
      ctx.lineTo(x, y + Math.sin(x * 0.01 + t * 0.3 + i) * amp)
    }
    ctx.strokeStyle = `rgba(135, 116, 105, ${0.3 * p})`
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.restore()
}

function renderRedCreamFabric(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  const redStop = 0.3 + p * 0.4
  gradient.addColorStop(0, '#F5E6D3')
  gradient.addColorStop(redStop - 0.1, '#F5E6D3')
  gradient.addColorStop(redStop, '#C4745E')
  gradient.addColorStop(1, '#A0523D')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

function renderOrchard(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, h * 0.6)
  skyGradient.addColorStop(0, '#1a3a2e')
  skyGradient.addColorStop(1, '#2d5a3e')
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, w, h * 0.6)

  const groundGradient = ctx.createLinearGradient(0, h * 0.6, 0, h)
  groundGradient.addColorStop(0, '#3d5a3e')
  groundGradient.addColorStop(1, '#2a3d2e')
  ctx.fillStyle = groundGradient
  ctx.fillRect(0, h * 0.6, w, h * 0.4)
}

function renderHandsFruit(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7)
  gradient.addColorStop(0, `rgba(245, 230, 211, ${0.2 * p})`)
  gradient.addColorStop(0.5, `rgba(160, 120, 88, ${0.1 * p})`)
  gradient.addColorStop(1, 'rgba(29, 28, 25, 1)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

function renderBlueFabric(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const warmGradient = ctx.createLinearGradient(0, 0, 0, h)
  warmGradient.addColorStop(0, '#F5E6D3')
  warmGradient.addColorStop(0.5, '#E8D5C4')
  warmGradient.addColorStop(1, '#D4C4B0')

  const blueGradient = ctx.createLinearGradient(0, 0, 0, h)
  blueGradient.addColorStop(0, '#11121E')
  blueGradient.addColorStop(0.5, '#0C0D19')
  blueGradient.addColorStop(1, '#080910')

  ctx.save()
  const bleedY = h * (1 - p * 1.2)

  ctx.fillStyle = warmGradient
  ctx.fillRect(0, 0, w, Math.max(0, bleedY))

  const blendHeight = h * 0.3
  const blendTop = Math.max(0, bleedY - blendHeight)
  for (let y = blendTop; y < bleedY; y++) {
    const localP = (y - blendTop) / blendHeight
    const eased = 1 - Math.pow(1 - localP, 3)
    const r = Math.round(245 * (1 - eased) + 12 * eased)
    const g = Math.round(230 * (1 - eased) + 13 * eased)
    const b = Math.round(211 * (1 - eased) + 25 * eased)
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.fillRect(0, y, w, 1)
  }

  ctx.fillStyle = blueGradient
  ctx.fillRect(0, bleedY, w, h - bleedY)
  ctx.restore()
}

function renderPortraitFabric(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, Math.max(w, h) * 0.8)
  gradient.addColorStop(0, '#11121E')
  gradient.addColorStop(0.4, '#0C0D19')
  gradient.addColorStop(1, '#080910')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

function renderOrchardReturn(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  renderOrchard(ctx, w, h, p, t + 100)
}

function renderFinalBlue(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  const midStop = 0.2 + p * 0.6
  gradient.addColorStop(0, '#11121E')
  gradient.addColorStop(midStop, '#0C0D19')
  gradient.addColorStop(1, '#080910')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

function renderCobaltHold(ctx: CanvasRenderingContext2D, w: number, h: number, p: number, t: number) {
  ctx.fillStyle = '#0C0D19'
  ctx.fillRect(0, 0, w, h)

  if (p > 0.1) {
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7)
    vignette.addColorStop(0, 'rgba(12, 13, 25, 0)')
    vignette.addColorStop(0.7, 'rgba(12, 13, 25, 0)')
    vignette.addColorStop(1, 'rgba(8, 9, 16, 0.8)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, w, h)
  }
}