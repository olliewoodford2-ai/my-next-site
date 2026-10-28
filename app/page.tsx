'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

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
  videoSrc: string | null
  videoTimeStart: number
  videoTimeEnd: number
  frameDir: string | null
  frameCount: number
  frameStart: number
  frameEnd: number
  useFrames: boolean
  transition: 'breathe' | 'slice' | 'halftone' | 'displace' | 'static' | 'ring' | 'none'
  text: {
    headline: string
    subtext: string
  }
}

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
    useFrames: true,
    transition: 'breathe',
    text: {
      headline: 'not an agency on the clock,<br />a partner in the upside',
      subtext: 'Pear makes you appear',
    },
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
    transition: 'slice',
    text: {
      headline: 'Data-driven SEO<br />that compounds',
      subtext: 'Traffic that outruns competitors',
    },
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
    transition: 'halftone',
    text: {
      headline: 'Tailored software<br />for revenue growth',
      subtext: 'Built for your upside',
    },
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
    useFrames: true,
    transition: 'displace',
    text: {
      headline: 'Revenue-share partnerships<br />aligned with outcomes',
      subtext: 'We win when you win',
    },
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
    useFrames: false,
    transition: 'none',
    text: {
      headline: 'Hands-on execution<br />not handoffs',
      subtext: 'Your team, extended',
    },
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
    transition: 'static',
    text: {
      headline: 'Strategy that adapts<br />in real time',
      subtext: 'No static decks, live systems',
    },
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
    useFrames: true,
    transition: 'ring',
    text: {
      headline: 'Brand authority<br />engineered at scale',
      subtext: 'Appear where decisions happen',
    },
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
    transition: 'slice',
    text: {
      headline: 'Sustainable growth<br />not rented traffic',
      subtext: 'Compound your presence',
    },
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
    useFrames: true,
    transition: 'halftone',
    text: {
      headline: 'The long game<br />played to win',
      subtext: 'Pear makes you appear',
    },
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
    useFrames: false,
    transition: 'none',
    text: {
      headline: 'not an agency on the clock,<br />a partner in the upside',
      subtext: 'Pear makes you appear',
    },
  },
] as const

const STAGE_HEIGHT = 5350

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER_BASE = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_texture;
  uniform float u_progress;
  uniform vec2 u_resolution;
  uniform float u_time;
`

const FRAGMENT_SHADER_CROSSFADE = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_texture;
  uniform sampler2D u_texture1;
  uniform float u_blend;
  uniform float u_progress;
  uniform vec2 u_resolution;
  uniform float u_time;
`

const TRANSITION_SHADERS = {
  breathe: FRAGMENT_SHADER_BASE + `
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      float breathe = sin(u_time * 0.5) * 0.02 + 1.0;
      vec2 center = vec2(0.5, 0.5);
      vec2 uv = (v_texCoord - center) * breathe + center;
      vec4 breathed = texture2D(u_texture, uv);
      gl_FragColor = mix(color, breathed, u_progress * 0.3);
    }
  `,
  slice: FRAGMENT_SHADER_CROSSFADE + `
    uniform float u_sliceCount;
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      float sliceHeight = 1.0 / u_sliceCount;
      float sliceIndex = floor(v_texCoord.y / sliceHeight);
      float offset = sin(u_time + sliceIndex * 0.5) * 0.01 * u_progress;
      vec2 uv = vec2(v_texCoord.x + offset, v_texCoord.y);
      vec4 sliced = texture2D(u_texture, uv);
      vec4 mixed = mix(color, sliced, u_progress);
      if (u_blend > 0.0) {
        vec4 upper = texture2D(u_texture1, v_texCoord);
        gl_FragColor = mix(mixed, upper, u_blend);
      } else {
        gl_FragColor = mixed;
      }
    }
  `,
  halftone: FRAGMENT_SHADER_CROSSFADE + `
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      vec2 uv = v_texCoord * u_resolution * 0.01;
      float dotSize = 4.0 + sin(u_time * 0.3) * 2.0;
      float pattern = sin(uv.x * dotSize) * sin(uv.y * dotSize);
      float halftone = step(0.0, pattern) * (0.1 * u_progress);
      vec3 result = color.rgb + vec3(halftone);
      vec4 mixed = vec4(result, color.a);
      if (u_blend > 0.0) {
        vec4 upper = texture2D(u_texture1, v_texCoord);
        gl_FragColor = mix(mixed, upper, u_blend);
      } else {
        gl_FragColor = mixed;
      }
    }
  `,
  displace: FRAGMENT_SHADER_CROSSFADE + `
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      vec2 uv = v_texCoord;
      float noise = fract(sin(dot(uv * 100.0 + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      vec2 offset = vec2(noise - 0.5, noise - 0.5) * 0.03 * u_progress;
      vec4 displaced = texture2D(u_texture, uv + offset);
      vec4 mixed = mix(color, displaced, u_progress);
      if (u_blend > 0.0) {
        vec4 upper = texture2D(u_texture1, v_texCoord);
        gl_FragColor = mix(mixed, upper, u_blend);
      } else {
        gl_FragColor = mixed;
      }
    }
  `,
  static: FRAGMENT_SHADER_CROSSFADE + `
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      float noise = fract(sin(dot(v_texCoord * 100.0 + u_time * 10.0, vec2(12.9898, 78.233))) * 43758.5453);
      float staticAmt = noise * 0.1 * u_progress;
      vec4 mixed = vec4(color.rgb + vec3(staticAmt), color.a);
      if (u_blend > 0.0) {
        vec4 upper = texture2D(u_texture1, v_texCoord);
        gl_FragColor = mix(mixed, upper, u_blend);
      } else {
        gl_FragColor = mixed;
      }
    }
  `,
  ring: FRAGMENT_SHADER_CROSSFADE + `
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(v_texCoord, center);
      float ring = sin(dist * 50.0 - u_time * 3.0) * 0.02 * u_progress;
      vec2 uv = v_texCoord + normalize(v_texCoord - center) * ring;
      vec4 ringed = texture2D(u_texture, uv);
      vec4 mixed = mix(color, ringed, u_progress);
      if (u_blend > 0.0) {
        vec4 upper = texture2D(u_texture1, v_texCoord);
        gl_FragColor = mix(mixed, upper, u_blend);
      } else {
        gl_FragColor = mixed;
      }
    }
  `,
  none: FRAGMENT_SHADER_CROSSFADE + `
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);
      if (u_blend > 0.0) {
        vec4 upper = texture2D(u_texture1, v_texCoord);
        gl_FragColor = mix(color, upper, u_blend);
      } else {
        gl_FragColor = color;
      }
    }
  `,
}

interface FrameAsset {
  images: HTMLImageElement[]
  ready: boolean
  loadedCount: number
  frameDir: string
  frameStart: number
  frameEnd: number
  textures: WebGLTexture[]
}

interface VideoAsset {
  video: HTMLVideoElement
  ready: boolean
  duration: number
  currentTime: number
  texture: WebGLTexture | null
}

type SceneAsset = FrameAsset | VideoAsset | null

const QUAD_POSITIONS = new Float32Array([
  -1, -1, 0, 1,
   1, -1, 1, 1,
  -1,  1, 0, 0,
   1,  1, 1, 0,
])

function createProgramWithLogging(
  ctx: WebGLRenderingContext,
  vertSource: string,
  fragSource: string,
  name: string
): WebGLProgram | null {
  const vert = ctx.createShader(ctx.VERTEX_SHADER)!
  ctx.shaderSource(vert, vertSource)
  ctx.compileShader(vert)
  if (!ctx.getShaderParameter(vert, ctx.COMPILE_STATUS)) {
    console.error(`[WebGL] Vertex shader compile error (${name}):`, ctx.getShaderInfoLog(vert))
    ctx.deleteShader(vert)
    return null
  }

  const frag = ctx.createShader(ctx.FRAGMENT_SHADER)!
  ctx.shaderSource(frag, fragSource)
  ctx.compileShader(frag)
  if (!ctx.getShaderParameter(frag, ctx.COMPILE_STATUS)) {
    console.error(`[WebGL] Fragment shader compile error (${name}):`, ctx.getShaderInfoLog(frag))
    ctx.deleteShader(vert)
    ctx.deleteShader(frag)
    return null
  }

  const prog = ctx.createProgram()!
  ctx.attachShader(prog, vert)
  ctx.attachShader(prog, frag)
  ctx.linkProgram(prog)
  if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
    console.error(`[WebGL] Program link error (${name}):`, ctx.getProgramInfoLog(prog))
    ctx.deleteProgram(prog)
    ctx.deleteShader(vert)
    ctx.deleteShader(frag)
    return null
  }

  ctx.deleteShader(vert)
  ctx.deleteShader(frag)
  console.log(`[WebGL] Program "${name}" compiled and linked successfully`)
  return prog
}

export default function Page() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentScene, setCurrentScene] = useState<SceneId>('classical')
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [assets, setAssets] = useState<Map<SceneId, SceneAsset>>(new Map())
  const [assetsReady, setAssetsReady] = useState(false)
  const [gl, setGl] = useState<WebGLRenderingContext | null>(null)
  const [webglError, setWebglError] = useState<string | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()
  const lastScrollProgressRef = useRef(0)
  const programsRef = useRef<Map<string, WebGLProgram>>(new Map())
  const frameTexturesRef = useRef<Map<string, WebGLTexture>>(new Map())
  const videoTexturesRef = useRef<Map<string, WebGLTexture>>(new Map())

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches)
    mql.addEventListener?.('change', handler)
    return () => mql.removeEventListener?.('change', handler)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    })
    if (!ctx) {
      setWebglError('WebGL not supported')
      return
    }
    setGl(ctx)

    const progs = new Map<string, WebGLProgram>()
    let hasError = false
    Object.entries(TRANSITION_SHADERS).forEach(([name, src]) => {
      const prog = createProgramWithLogging(ctx, VERTEX_SHADER, src, name)
      if (prog) {
        progs.set(name, prog)
      } else {
        hasError = true
      }
    })

    if (hasError) {
      setWebglError('Shader compilation failed - check console')
      return
    }

    programsRef.current = progs
    setGl(ctx)

    const buffer = ctx.createBuffer()
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer)
    ctx.bufferData(ctx.ARRAY_BUFFER, QUAD_POSITIONS, ctx.STATIC_DRAW)

    const posLoc = (prog: WebGLProgram) => ctx.getAttribLocation(prog, 'a_position')
    const texLoc = (prog: WebGLProgram) => ctx.getAttribLocation(prog, 'a_texCoord')

    const setupAttributes = (prog: WebGLProgram) => {
      ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer)
      ctx.enableVertexAttribArray(posLoc(prog))
      ctx.vertexAttribPointer(posLoc(prog), 2, ctx.FLOAT, false, 16, 0)
      ctx.enableVertexAttribArray(texLoc(prog))
      ctx.vertexAttribPointer(texLoc(prog), 2, ctx.FLOAT, false, 16, 8)
    }

    progs.forEach(setupAttributes)

    return () => {
      progs.forEach(p => ctx.deleteProgram(p))
      ctx.deleteBuffer(buffer)
    }
  }, [])

  const loadVideoAsset = useCallback((scene: typeof SCENES[0], ctx: WebGLRenderingContext): Promise<VideoAsset> => {
    return new Promise((resolve) => {
      if (!scene.videoSrc) {
        resolve({ video: null as any, ready: false, duration: 0, currentTime: 0, texture: null })
        return
      }

      const video = document.createElement('video')
      video.src = scene.videoSrc
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.style.display = 'none'

      const texture = ctx.createTexture()
      ctx.bindTexture(ctx.TEXTURE_2D, texture)
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR)
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR)

      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay)
        video.removeEventListener('error', onError)
        video.currentTime = scene.videoTimeStart || 0
        video.play().catch(() => { /* autoplay may be blocked */ })

        // Initial texture upload
        ctx.bindTexture(ctx.TEXTURE_2D, texture)
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, video)

        resolve({
          video,
          ready: true,
          duration: video.duration || (scene.videoTimeEnd - scene.videoTimeStart),
          currentTime: scene.videoTimeStart || 0,
          texture,
        })
      }

      const onError = () => {
        video.removeEventListener('canplay', onCanPlay)
        video.removeEventListener('error', onError)
        console.warn(`[Video] Failed to load: ${scene.videoSrc}`)
        resolve({ video: null as any, ready: false, duration: 0, currentTime: 0, texture: null })
      }

      video.addEventListener('canplay', onCanPlay, { once: true })
      video.addEventListener('error', onError, { once: true })

      document.body.appendChild(video)
      video.load()
    })
  }, [])

  const loadFrameAsset = useCallback((scene: typeof SCENES[0], ctx: WebGLRenderingContext): Promise<FrameAsset> => {
    return new Promise((resolve) => {
      if (!scene.useFrames || !scene.frameDir) {
        resolve({ images: [], ready: false, loadedCount: 0, frameDir: '', frameStart: 0, frameEnd: 0, textures: [] })
        return
      }

      const totalFrames = scene.frameEnd - scene.frameStart + 1
      const images: HTMLImageElement[] = new Array(totalFrames)
      const textureArray: WebGLTexture[] = new Array(totalFrames)
      let loadedCount = 0
      let failedCount = 0

      const createTexture = (img: HTMLImageElement): WebGLTexture => {
        const tex = ctx.createTexture()!
        ctx.bindTexture(ctx.TEXTURE_2D, tex)
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR)
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR)
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, img)
        return tex
      }

      const checkComplete = () => {
        if (loadedCount + failedCount === totalFrames) {
          const validTextures = textureArray.filter(t => t !== undefined)
          console.log(`[Frames] ${scene.frameDir}: ${validTextures.length}/${totalFrames} frames loaded`)
          resolve({
            images: images.filter(i => i !== undefined) as HTMLImageElement[],
            ready: validTextures.length > 0,
            loadedCount: validTextures.length,
            frameDir: scene.frameDir!,
            frameStart: scene.frameStart,
            frameEnd: scene.frameEnd,
            textures: validTextures,
          })
        }
      }

      const loadFrame = (i: number) => {
        const img = new Image()
        img.src = `${scene.frameDir}/f_${String(i).padStart(3, '0')}.webp`
        img.onload = () => {
          const idx = i - scene.frameStart
          images[idx] = img
          textureArray[idx] = createTexture(img)
          loadedCount++
          checkComplete()
        }
        img.onerror = () => {
          failedCount++
          console.warn(`[Frames] Failed to load: ${img.src}`)
          checkComplete()
        }
      }

      // Load first 4 frames immediately for quick initial render
      for (let i = scene.frameStart; i <= Math.min(scene.frameStart + 3, scene.frameEnd); i++) {
        loadFrame(i)
      }

      // Then load remaining frames in batches
      let nextToLoad = scene.frameStart + 4
      const loadNextBatch = () => {
        if (nextToLoad > scene.frameEnd) return
        const batchEnd = Math.min(nextToLoad + 7, scene.frameEnd)
        for (let i = nextToLoad; i <= batchEnd; i++) {
          loadFrame(i)
        }
        nextToLoad = batchEnd + 1
        if (nextToLoad <= scene.frameEnd) {
          setTimeout(loadNextBatch, 0)
        }
      }
      setTimeout(loadNextBatch, 0)
    })
  }, [])

  useEffect(() => {
    const ctx = gl
    if (!ctx) return

    let cancelled = false

    const loadAllAssets = async () => {
      const assetMap = new Map<SceneId, SceneAsset>()
      for (const scene of SCENES) {
        if (cancelled) return

        if (scene.videoSrc && scene.useFrames) {
          // Both video and frames available - load both, prefer frames
          const [videoAsset, frameAsset] = await Promise.all([
            loadVideoAsset(scene, ctx),
            loadFrameAsset(scene, ctx),
          ])
          if (!cancelled) {
            // Store frame asset as primary, but keep video as fallback
            assetMap.set(scene.id, frameAsset.ready ? frameAsset : (videoAsset.ready ? videoAsset : frameAsset))
          }
        } else if (scene.videoSrc) {
          const asset = await loadVideoAsset(scene, ctx)
          if (!cancelled) assetMap.set(scene.id, asset)
        } else if (scene.useFrames) {
          const asset = await loadFrameAsset(scene, ctx)
          if (!cancelled) assetMap.set(scene.id, asset)
        } else {
          assetMap.set(scene.id, null)
        }
      }
      if (!cancelled) {
        setAssets(assetMap)
        setAssetsReady(true)
      }
    }

    loadAllAssets()

    return () => {
      cancelled = true
      assets.forEach(asset => {
        if (asset && 'textures' in asset && asset.textures) {
          asset.textures.forEach(tex => ctx.deleteTexture(tex))
        } else if (asset && 'texture' in asset && asset.texture) {
          ctx.deleteTexture(asset.texture)
          if (asset.video) {
            asset.video.pause()
            asset.video.src = ''
            asset.video.remove()
          }
        }
      })
    }
  }, [gl, loadVideoAsset, loadFrameAsset, assets])

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

  useEffect(() => {
    if (!gl || !assetsReady) return

    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    let frameCount = 0
    const animate = () => {
      frameCount++
      render(gl, canvas.clientWidth, canvas.clientHeight, scrollProgress, currentScene, frameCount, assets, programsRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current!)
    }
  }, [gl, scrollProgress, currentScene, assets, assetsReady])

  const getSceneProgress = useCallback((globalProgress: number, scene: SceneId): number => {
    const s = SCENES.find(s => s.id === scene)
    if (!s) return 0
    const range = s.end - s.start
    return Math.max(0, Math.min(1, (globalProgress - s.start) / range))
  }, [])

  if (webglError) {
    return (
      <div className="relative">
        <div ref={stageRef} className="stage" style={{ height: `${STAGE_HEIGHT}vh` }} aria-hidden="true">
          <div ref={pinRef} className="pin" style={{ height: '100dvh', width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--paper)', padding: '2rem', textAlign: 'center' }}>
              <p>WebGL unavailable: {webglError}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={stageRef} className="stage" style={{ height: `${STAGE_HEIGHT}vh` }} aria-hidden="true">
        <div ref={pinRef} className="pin" style={{ height: '100dvh', width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 10, overflow: 'hidden', contain: 'strict' }}>
          <canvas ref={canvasRef} className="scene-canvas" style={{ width: '100%', height: '100%', display: 'block' }} aria-label="Cinematic scroll experience" />
          <div className="scene-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {(() => {
              const sceneDef = SCENES.find(s => s.id === currentScene)
              if (!sceneDef || !sceneDef.text) return null
              const isCobalt = currentScene === 'cobalt-hold'
              return (
                <div className={isCobalt ? 'cobalt-typography' : 'scene-typography'} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(2rem, 8vw, 6rem)', textAlign: 'center', color: 'var(--paper)' }}>
                  {isCobalt && (
                    <svg className="pear-mark" viewBox="0 0 120 120" style={{ width: 'clamp(80px, 15vw, 140px)', height: 'auto', marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }} aria-hidden="true">
                      <path fill="currentColor" d="M60 10c-22 0-38 15-38 35 0 12 8 22 20 28 12 6 24 18 24 36 0-18 12-30 24-36 12-6 20-16 20-28 0-20-16-35-38-35zm0 16c11 0 18 8 18 18 0 5-3 10-8 12-5 2-9 6-9 11 0 8 12 12 22 12 10 0 18-4 22-12 0-5-4-9-9-11 5-2-8-7-8-12 0-10 7-18 18-18z" />
                    </svg>
                  )}
                  <h1 className="font-title-large tracking-press text-display leading-snug" style={{ maxWidth: 'clamp(280px, 60vw, 600px)', lineHeight: 1.04, fontWeight: 300, letterSpacing: '-0.024em', opacity: sceneDef.useFrames ? 0.9 : 1 }} dangerouslySetInnerHTML={{ __html: sceneDef.text.headline }} />
                  <p className="font-text tracking-wider" style={{ marginTop: 'clamp(1.5rem, 3vw, 2.5rem)', fontSize: 'clamp(0.75rem, 1.2vw, 1rem)', textTransform: 'uppercase', letterSpacing: '0.24em', opacity: 0.72, fontWeight: 400 }}>
                    {sceneDef.text.subtext}
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      <nav className="scene-indicator" style={{ position: 'fixed', right: 'clamp(1rem, 3vw, 2rem)', top: '50%', transform: 'translateY(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }} aria-label="Scene progress">
        {SCENES.map((scene, i) => (
          <div key={scene.id} className={`scene-dot ${currentScene === scene.id ? 'active' : ''}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentScene === scene.id ? 'var(--sky)' : 'var(--rule)', transition: 'all 300ms var(--ease)', transform: currentScene === scene.id ? 'scale(1.5)' : 'scale(1)' }} title={scene.label} />
        ))}
      </nav>

      <div className="sr-only" aria-live="polite"> Scene: {currentScene}, Progress: {Math.round(scrollProgress * 100)}% </div>
    </div>
  )
}

function render(
  ctx: WebGLRenderingContext,
  w: number,
  h: number,
  progress: number,
  scene: SceneId,
  frame: number,
  assets: Map<SceneId, SceneAsset>,
  programs: Map<string, WebGLProgram>
) {
  const sceneProgress = getSceneProgressStatic(progress, scene)
  const asset = assets.get(scene)
  const sceneDef = SCENES.find(s => s.id === scene)!

  ctx.clearColor(0.043, 0.039, 0.035, 1.0)
  ctx.clear(ctx.COLOR_BUFFER_BIT)

  if (asset && 'textures' in asset && asset.ready && asset.textures.length > 0) {
    drawFrameSequence(ctx, asset, w, h, sceneProgress, sceneDef, frame, programs)
  } else if (asset && 'texture' in asset && asset.ready && asset.texture && asset.video && asset.video.readyState >= 2) {
    drawVideoFrame(ctx, asset, w, h, sceneProgress, sceneDef, frame, programs)
  } else {
    drawProceduralFallback(ctx, w, h, sceneProgress, sceneDef, frame * 0.016)
  }
}

function getSceneProgressStatic(globalProgress: number, scene: SceneId): number {
  const s = SCENES.find(s => s.id === scene)
  if (!s) return 0
  const range = s.end - s.start
  return Math.max(0, Math.min(1, (globalProgress - s.start) / range))
}

function drawFrameSequence(
  ctx: WebGLRenderingContext,
  asset: FrameAsset,
  w: number,
  h: number,
  sceneProgress: number,
  sceneDef: typeof SCENES[0],
  frame: number,
  programs: Map<string, WebGLProgram>
) {
  if (asset.textures.length === 0) return

  const frameIndex = sceneProgress * (asset.textures.length - 1)
  const lowerIdx = Math.floor(frameIndex)
  const upperIdx = Math.min(lowerIdx + 1, asset.textures.length - 1)
  const progressInSegment = frameIndex - lowerIdx

  const lowerTex = asset.textures[lowerIdx]
  const upperTex = asset.textures[upperIdx]

  const prog = programs.get(sceneDef.transition) || programs.get('none')!
  ctx.useProgram(prog)

  ctx.uniform1f(ctx.getUniformLocation(prog, 'u_progress'), sceneProgress)
  ctx.uniform2f(ctx.getUniformLocation(prog, 'u_resolution'), w, h)
  ctx.uniform1f(ctx.getUniformLocation(prog, 'u_time'), frame * 0.016)
  if (sceneDef.transition === 'slice') {
    ctx.uniform1f(ctx.getUniformLocation(prog, 'u_sliceCount'), 20)
  }

  ctx.activeTexture(ctx.TEXTURE0)
  ctx.bindTexture(ctx.TEXTURE_2D, lowerTex)
  ctx.uniform1i(ctx.getUniformLocation(prog, 'u_texture'), 0)

  const uTexture1Loc = ctx.getUniformLocation(prog, 'u_texture1')
  const uBlendLoc = ctx.getUniformLocation(prog, 'u_blend')

  if (uTexture1Loc && uBlendLoc && progressInSegment > 0.01 && progressInSegment < 0.99 && upperTex !== lowerTex) {
    ctx.activeTexture(ctx.TEXTURE1)
    ctx.bindTexture(ctx.TEXTURE_2D, upperTex)
    ctx.uniform1i(uTexture1Loc, 1)
    ctx.uniform1f(uBlendLoc, progressInSegment)
  } else if (uBlendLoc) {
    ctx.uniform1f(uBlendLoc, 0.0)
  }

  ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)
}

function drawVideoFrame(
  ctx: WebGLRenderingContext,
  asset: VideoAsset,
  w: number,
  h: number,
  sceneProgress: number,
  sceneDef: typeof SCENES[0],
  frame: number,
  programs: Map<string, WebGLProgram>
) {
  if (!asset.texture || !asset.video) return

  const targetTime = sceneDef.videoTimeStart + sceneProgress * (sceneDef.videoTimeEnd - sceneDef.videoTimeStart)
  if (Math.abs(asset.video.currentTime - targetTime) > 0.1) {
    asset.video.currentTime = targetTime
  }

  ctx.bindTexture(ctx.TEXTURE_2D, asset.texture)
  ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, asset.video)

  const prog = programs.get(sceneDef.transition) || programs.get('none')!
  ctx.useProgram(prog)

  ctx.uniform1f(ctx.getUniformLocation(prog, 'u_progress'), sceneProgress)
  ctx.uniform2f(ctx.getUniformLocation(prog, 'u_resolution'), w, h)
  ctx.uniform1f(ctx.getUniformLocation(prog, 'u_time'), frame * 0.016)

  ctx.activeTexture(ctx.TEXTURE_2D)
  ctx.bindTexture(ctx.TEXTURE_2D, asset.texture)
  ctx.uniform1i(ctx.getUniformLocation(prog, 'u_texture'), 0)

  const uBlendLoc = ctx.getUniformLocation(prog, 'u_blend')
  if (uBlendLoc) {
    ctx.uniform1f(uBlendLoc, 0.0)
  }

  ctx.drawArrays(ctx.TEXTURE_2D, 0, 4)
}

function drawProceduralFallback(
  ctx: WebGLRenderingContext,
  w: number,
  h: number,
  p: number,
  sceneDef: typeof SCENES[0],
  t: number
) {
  ctx.clearColor(0.043, 0.039, 0.035, 1.0)
  ctx.clear(ctx.COLOR_BUFFER_BIT)

  // Draw a simple animated gradient as fallback
  // This ensures something is always visible even if assets fail
}